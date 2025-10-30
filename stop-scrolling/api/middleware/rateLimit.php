<?php
/**
 * Rate Limiting Middleware
 * Prevents API abuse by limiting requests per IP/user
 */

require_once __DIR__ . '/../../lib/core/Database.php';

class RateLimitMiddleware {
    
    private $db;
    private $config;
    
    public function __construct($config = []) {
        $this->db = Database::getInstance();
        
        // Default configuration
        $this->config = array_merge([
            'requests_per_minute' => 60,
            'requests_per_hour' => 1000,
            'requests_per_day' => 5000,
            'burst_limit' => 10,
            'burst_window' => 10, // seconds
            'cleanup_probability' => 0.01, // 1% chance to clean old records
            'ban_threshold' => 50, // requests over limit before temp ban
            'ban_duration' => 3600, // 1 hour ban
            'whitelist' => [], // IP addresses to skip rate limiting
            'endpoint_specific' => [
                'auth/login' => ['requests_per_minute' => 5, 'requests_per_hour' => 30],
                'auth/register' => ['requests_per_minute' => 3, 'requests_per_hour' => 10]
            ]
        ], $config);
    }
    
    /**
     * Apply rate limiting
     */
    public function apply($endpoint = '') {
        $clientIp = $this->getClientIp();
        
        // Skip rate limiting for whitelisted IPs
        if (in_array($clientIp, $this->config['whitelist'])) {
            return true;
        }
        
        // Check if IP is temporarily banned
        if ($this->isIpBanned($clientIp)) {
            $this->sendRateLimitResponse('IP temporarily banned due to excessive requests', 429, 3600);
        }
        
        // Get endpoint-specific limits
        $limits = $this->getEndpointLimits($endpoint);
        
        // Check rate limits
        $this->checkRateLimit($clientIp, $limits, $endpoint);
        
        // Randomly cleanup old records
        if (mt_rand() / mt_getrandmax() < $this->config['cleanup_probability']) {
            $this->cleanupOldRecords();
        }
        
        return true;
    }
    
    /**
     * Check rate limits for client
     */
    private function checkRateLimit($clientIp, $limits, $endpoint) {
        $now = time();
        
        // Check burst limit (requests in last N seconds)
        if (isset($limits['burst_limit'])) {
            $burstCount = $this->getRequestCount($clientIp, $endpoint, $now - $this->config['burst_window']);
            if ($burstCount >= $limits['burst_limit']) {
                $this->logRateLimit($clientIp, $endpoint, 'burst', $burstCount);
                $this->sendRateLimitResponse('Too many requests in short time', 429, $this->config['burst_window']);
            }
        }
        
        // Check per-minute limit
        if (isset($limits['requests_per_minute'])) {
            $minuteCount = $this->getRequestCount($clientIp, $endpoint, $now - 60);
            if ($minuteCount >= $limits['requests_per_minute']) {
                $this->logRateLimit($clientIp, $endpoint, 'minute', $minuteCount);
                $retryAfter = 60 - ($now % 60);
                $this->sendRateLimitResponse('Rate limit exceeded', 429, $retryAfter);
            }
        }
        
        // Check per-hour limit
        if (isset($limits['requests_per_hour'])) {
            $hourCount = $this->getRequestCount($clientIp, $endpoint, $now - 3600);
            if ($hourCount >= $limits['requests_per_hour']) {
                $this->logRateLimit($clientIp, $endpoint, 'hour', $hourCount);
                $retryAfter = 3600 - ($now % 3600);
                $this->sendRateLimitResponse('Hourly limit exceeded', 429, $retryAfter);
            }
        }
        
        // Check per-day limit
        if (isset($limits['requests_per_day'])) {
            $dayCount = $this->getRequestCount($clientIp, $endpoint, $now - 86400);
            if ($dayCount >= $limits['requests_per_day']) {
                $this->logRateLimit($clientIp, $endpoint, 'day', $dayCount);
                $retryAfter = 86400 - ($now % 86400);
                $this->sendRateLimitResponse('Daily limit exceeded', 429, $retryAfter);
            }
        }
        
        // Log this request
        $this->logRequest($clientIp, $endpoint);
    }
    
    /**
     * Get request count for IP/endpoint in time window
     */
    private function getRequestCount($clientIp, $endpoint, $since) {
        // Create rate limit table if it doesn't exist
        $this->createRateLimitTable();
        
        $sql = "SELECT COUNT(*) as count 
                FROM ss_rate_limits 
                WHERE client_ip = ? 
                AND endpoint = ? 
                AND request_time >= FROM_UNIXTIME(?)";
        
        $result = $this->db->fetchOne($sql, [$clientIp, $endpoint, $since]);
        return $result['count'] ?? 0;
    }
    
    /**
     * Log request for rate limiting
     */
    private function logRequest($clientIp, $endpoint) {
        $this->createRateLimitTable();
        
        $data = [
            'limit_id' => $this->generateUUID(),
            'client_ip' => $clientIp,
            'endpoint' => $endpoint,
            'request_time' => date('Y-m-d H:i:s'),
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
            'request_method' => $_SERVER['REQUEST_METHOD'] ?? 'GET'
        ];
        
        try {
            $this->db->insert('rate_limits', $data);
        } catch (Exception $e) {
            // Rate limiting shouldn't break the API
            error_log("Rate limit logging failed: " . $e->getMessage());
        }
    }
    
    /**
     * Check if IP is temporarily banned
     */
    private function isIpBanned($clientIp) {
        // Check recent violations
        $since = time() - 300; // Last 5 minutes
        $violationCount = $this->getViolationCount($clientIp, $since);
        
        if ($violationCount >= $this->config['ban_threshold']) {
            $this->logIpBan($clientIp);
            return true;
        }
        
        // Check existing ban records
        $sql = "SELECT COUNT(*) as count 
                FROM ss_ip_bans 
                WHERE ip_address = ? 
                AND banned_until > NOW() 
                AND is_active = 1";
        
        try {
            $result = $this->db->fetchOne($sql, [$clientIp]);
            return ($result['count'] ?? 0) > 0;
        } catch (Exception $e) {
            return false;
        }
    }
    
    /**
     * Get violation count for IP
     */
    private function getViolationCount($clientIp, $since) {
        try {
            $sql = "SELECT COUNT(*) as count 
                    FROM ss_rate_limit_violations 
                    WHERE client_ip = ? 
                    AND violation_time >= FROM_UNIXTIME(?)";
            
            $result = $this->db->fetchOne($sql, [$clientIp, $since]);
            return $result['count'] ?? 0;
        } catch (Exception $e) {
            return 0;
        }
    }
    
    /**
     * Log rate limit violation
     */
    private function logRateLimit($clientIp, $endpoint, $limitType, $requestCount) {
        try {
            $this->createViolationTable();
            
            $data = [
                'violation_id' => $this->generateUUID(),
                'client_ip' => $clientIp,
                'endpoint' => $endpoint,
                'limit_type' => $limitType,
                'request_count' => $requestCount,
                'violation_time' => date('Y-m-d H:i:s'),
                'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? ''
            ];
            
            $this->db->insert('rate_limit_violations', $data);
        } catch (Exception $e) {
            error_log("Rate limit violation logging failed: " . $e->getMessage());
        }
    }
    
    /**
     * Log IP ban
     */
    private function logIpBan($clientIp) {
        try {
            $this->createBanTable();
            
            $data = [
                'ban_id' => $this->generateUUID(),
                'ip_address' => $clientIp,
                'banned_at' => date('Y-m-d H:i:s'),
                'banned_until' => date('Y-m-d H:i:s', time() + $this->config['ban_duration']),
                'reason' => 'Excessive rate limit violations',
                'is_active' => 1
            ];
            
            $this->db->insert('ip_bans', $data);
        } catch (Exception $e) {
            error_log("IP ban logging failed: " . $e->getMessage());
        }
    }
    
    /**
     * Get endpoint-specific limits
     */
    private function getEndpointLimits($endpoint) {
        $limits = [
            'requests_per_minute' => $this->config['requests_per_minute'],
            'requests_per_hour' => $this->config['requests_per_hour'],
            'requests_per_day' => $this->config['requests_per_day'],
            'burst_limit' => $this->config['burst_limit']
        ];
        
        // Apply endpoint-specific overrides
        if (isset($this->config['endpoint_specific'][$endpoint])) {
            $limits = array_merge($limits, $this->config['endpoint_specific'][$endpoint]);
        }
        
        return $limits;
    }
    
    /**
     * Get client IP address
     */
    private function getClientIp() {
        $headers = [
            'HTTP_X_FORWARDED_FOR',
            'HTTP_X_REAL_IP',
            'HTTP_CF_CONNECTING_IP',
            'HTTP_CLIENT_IP',
            'REMOTE_ADDR'
        ];
        
        foreach ($headers as $header) {
            if (!empty($_SERVER[$header])) {
                $ips = explode(',', $_SERVER[$header]);
                $ip = trim($ips[0]);
                
                if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                    return $ip;
                }
            }
        }
        
        return $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
    }
    
    /**
     * Send rate limit response
     */
    private function sendRateLimitResponse($message, $statusCode = 429, $retryAfter = null) {
        http_response_code($statusCode);
        header('Content-Type: application/json');
        
        if ($retryAfter) {
            header("Retry-After: $retryAfter");
        }
        
        $response = [
            'success' => false,
            'message' => $message,
            'retry_after' => $retryAfter
        ];
        
        echo json_encode($response, JSON_PRETTY_PRINT);
        exit;
    }
    
    /**
     * Cleanup old rate limit records
     */
    private function cleanupOldRecords() {
        $cutoff = date('Y-m-d H:i:s', time() - 86400); // 24 hours ago
        
        try {
            $this->db->execute("DELETE FROM ss_rate_limits WHERE request_time < ?", [$cutoff]);
            $this->db->execute("DELETE FROM ss_rate_limit_violations WHERE violation_time < ?", [$cutoff]);
            $this->db->execute("DELETE FROM ss_ip_bans WHERE banned_until < NOW() AND is_active = 1");
        } catch (Exception $e) {
            error_log("Rate limit cleanup failed: " . $e->getMessage());
        }
    }
    
    /**
     * Create rate limit table if it doesn't exist
     */
    private function createRateLimitTable() {
        $sql = "CREATE TABLE IF NOT EXISTS ss_rate_limits (
            limit_id VARCHAR(36) PRIMARY KEY,
            client_ip VARCHAR(45) NOT NULL,
            endpoint VARCHAR(255) NOT NULL,
            request_time TIMESTAMP NOT NULL,
            user_agent TEXT,
            request_method VARCHAR(10),
            INDEX idx_ip_endpoint_time (client_ip, endpoint, request_time),
            INDEX idx_request_time (request_time)
        )";
        
        try {
            $this->db->execute($sql);
        } catch (Exception $e) {
            error_log("Rate limit table creation failed: " . $e->getMessage());
        }
    }
    
    /**
     * Create violation table if it doesn't exist
     */
    private function createViolationTable() {
        $sql = "CREATE TABLE IF NOT EXISTS ss_rate_limit_violations (
            violation_id VARCHAR(36) PRIMARY KEY,
            client_ip VARCHAR(45) NOT NULL,
            endpoint VARCHAR(255) NOT NULL,
            limit_type VARCHAR(20) NOT NULL,
            request_count INT NOT NULL,
            violation_time TIMESTAMP NOT NULL,
            user_agent TEXT,
            INDEX idx_ip_time (client_ip, violation_time)
        )";
        
        try {
            $this->db->execute($sql);
        } catch (Exception $e) {
            error_log("Rate limit violation table creation failed: " . $e->getMessage());
        }
    }
    
    /**
     * Create ban table if it doesn't exist
     */
    private function createBanTable() {
        $sql = "CREATE TABLE IF NOT EXISTS ss_ip_bans (
            ban_id VARCHAR(36) PRIMARY KEY,
            ip_address VARCHAR(45) NOT NULL,
            banned_at TIMESTAMP NOT NULL,
            banned_until TIMESTAMP NOT NULL,
            reason TEXT,
            is_active TINYINT(1) DEFAULT 1,
            INDEX idx_ip_until (ip_address, banned_until),
            INDEX idx_banned_until (banned_until)
        )";
        
        try {
            $this->db->execute($sql);
        } catch (Exception $e) {
            error_log("IP ban table creation failed: " . $e->getMessage());
        }
    }
    
    /**
     * Generate UUID
     */
    private function generateUUID() {
        $result = $this->db->fetchOne("SELECT UUID() as uuid");
        return $result['uuid'];
    }
}