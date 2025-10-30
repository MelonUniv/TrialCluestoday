<?php
/**
 * Authentication Class
 * Handles user authentication, token generation, and validation
 */

require_once __DIR__ . '/../../config/app.php';
require_once __DIR__ . '/JWT.php';
require_once __DIR__ . '/Database.php';

class Auth {
    
    private static $blacklistedTokens = [];
    private $db;
    
    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }
    
    /**
     * Generate JWT token for user
     */
    public function generateToken($userId, $type = 'access') {
        $issuedAt = time();
        $expiry = $type === 'refresh' 
            ? $issuedAt + JWT_REFRESH_EXPIRY 
            : $issuedAt + JWT_EXPIRY;
        
        $payload = [
            'iss' => APP_URL,                  // Issuer
            'iat' => $issuedAt,                // Issued at
            'exp' => $expiry,                   // Expiration
            'nbf' => $issuedAt,                // Not before
            'jti' => bin2hex(random_bytes(16)), // JWT ID
            'sub' => $userId,                   // Subject (user ID)
            'type' => $type                     // Token type
        ];
        
        return JWT::encode($payload, JWT_SECRET, JWT_ALGORITHM);
    }
    
    /**
     * Validate JWT token
     */
    public function validateToken($token) {
        try {
            // Check if token is blacklisted
            if ($this->isTokenBlacklisted($token)) {
                throw new Exception('Token has been revoked');
            }
            
            // Decode and verify token
            $payload = JWT::decode($token, JWT_SECRET, [JWT_ALGORITHM]);
            
            // Verify token type
            if (!isset($payload['type']) || $payload['type'] !== 'access') {
                throw new Exception('Invalid token type');
            }
            
            // Check if user still exists and is active
            $stmt = $this->db->prepare("
                SELECT user_id, is_active 
                FROM " . DB_PREFIX . "users 
                WHERE user_id = ? AND is_active = 1
            ");
            $stmt->execute([$payload['sub']]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$user) {
                throw new Exception('User not found or inactive');
            }
            
            return $payload;
            
        } catch (Exception $e) {
            throw new Exception('Invalid token: ' . $e->getMessage());
        }
    }
    
    /**
     * Refresh access token using refresh token
     */
    public function refreshToken($refreshToken) {
        try {
            $payload = JWT::decode($refreshToken, JWT_SECRET, [JWT_ALGORITHM]);
            
            // Verify it's a refresh token
            if (!isset($payload['type']) || $payload['type'] !== 'refresh') {
                throw new Exception('Invalid refresh token');
            }
            
            // Check if token is blacklisted
            if ($this->isTokenBlacklisted($refreshToken)) {
                throw new Exception('Refresh token has been revoked');
            }
            
            // Generate new access token
            return $this->generateToken($payload['sub'], 'access');
            
        } catch (Exception $e) {
            throw new Exception('Invalid refresh token: ' . $e->getMessage());
        }
    }
    
    /**
     * Blacklist a token (logout)
     */
    public function blacklistToken($token) {
        try {
            $payload = JWT::decode($token, JWT_SECRET, [JWT_ALGORITHM]);
            $tokenHash = hash('sha256', $token);
            
            // Update existing session to mark as logged out
            $stmt = $this->db->prepare("
                UPDATE " . DB_PREFIX . "auth_sessions 
                SET expires_at = NOW()
                WHERE token_hash = ? AND user_id = ?
            ");
            
            $stmt->execute([$tokenHash, $payload['sub']]);
            
            // Add to memory blacklist
            self::$blacklistedTokens[] = $tokenHash;
            
            return true;
            
        } catch (Exception $e) {
            return false;
        }
    }
    
    /**
     * Check if token is blacklisted
     */
    private function isTokenBlacklisted($token) {
        $tokenHash = hash('sha256', $token);
        
        // Check memory first
        if (in_array($tokenHash, self::$blacklistedTokens)) {
            return true;
        }
        
        // Check database - token is blacklisted if expires_at is in the past
        $stmt = $this->db->prepare("
            SELECT 1 FROM " . DB_PREFIX . "auth_sessions 
            WHERE token_hash = ? AND expires_at < NOW()
            LIMIT 1
        ");
        $stmt->execute([$tokenHash]);
        
        return $stmt->rowCount() > 0;
    }
    
    /**
     * Create session record
     */
    public function createSession($userId, $token, $userAgent = '', $ipAddress = '') {
        try {
            $payload = JWT::decode($token, JWT_SECRET, [JWT_ALGORITHM]);
            
            // Determine device type from user agent
            $deviceType = 'web';
            if (stripos($userAgent, 'android') !== false) {
                $deviceType = 'android';
            } elseif (stripos($userAgent, 'iphone') !== false || stripos($userAgent, 'ipad') !== false) {
                $deviceType = 'ios';
            }
            
            $stmt = $this->db->prepare("
                INSERT INTO " . DB_PREFIX . "auth_sessions 
                (session_id, user_id, token_hash, device_type, ip_address, expires_at, created_at) 
                VALUES (UUID(), ?, ?, ?, ?, FROM_UNIXTIME(?), NOW())
            ");
            
            $tokenHash = hash('sha256', $token);
            $stmt->execute([
                $userId, 
                $tokenHash,
                $deviceType,
                $ipAddress,
                $payload['exp']
            ]);
            
            return $this->db->lastInsertId();
            
        } catch (Exception $e) {
            throw new Exception('Failed to create session: ' . $e->getMessage());
        }
    }
    
    /**
     * Clean expired sessions
     */
    public function cleanExpiredSessions() {
        // Delete sessions that expired more than 30 days ago
        $stmt = $this->db->prepare("
            DELETE FROM " . DB_PREFIX . "auth_sessions 
            WHERE expires_at < DATE_SUB(NOW(), INTERVAL 30 DAY)
        ");
        $stmt->execute();
        
        return $stmt->rowCount();
    }
    
    /**
     * Get user from token
     */
    public function getUserFromToken($token) {
        try {
            $payload = $this->validateToken($token);
            
            $stmt = $this->db->prepare("
                SELECT user_id, email, username, account_type, created_at 
                FROM " . DB_PREFIX . "users 
                WHERE user_id = ?
            ");
            $stmt->execute([$payload['sub']]);
            
            return $stmt->fetch(PDO::FETCH_ASSOC);
            
        } catch (Exception $e) {
            return null;
        }
    }
    
    /**
     * Hash password
     */
    public static function hashPassword($password) {
        return password_hash($password, PASSWORD_BCRYPT, ['cost' => BCRYPT_COST]);
    }
    
    /**
     * Verify password
     */
    public static function verifyPassword($password, $hash) {
        return password_verify($password, $hash);
    }
    
    /**
     * Generate random token (for email verification, password reset, etc.)
     */
    public static function generateRandomToken($length = 32) {
        return bin2hex(random_bytes($length));
    }
}