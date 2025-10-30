<?php
/**
 * CORS Middleware
 * Handles Cross-Origin Resource Sharing configuration
 */

class CorsMiddleware {
    
    /**
     * Apply CORS headers based on configuration
     */
    public static function apply($config = []) {
        // Default configuration
        $defaultConfig = [
            'allowed_origins' => ['*'],
            'allowed_methods' => ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD', 'PATCH'],
            'allowed_headers' => [
                'Accept',
                'Accept-Language',
                'Content-Language',
                'Content-Type',
                'Authorization',
                'X-Requested-With',
                'X-API-Key',
                'Cache-Control',
                'Pragma'
            ],
            'exposed_headers' => [
                'X-Total-Count',
                'X-Page-Count',
                'Link'
            ],
            'allow_credentials' => true,
            'max_age' => 86400, // 24 hours
            'vary_header' => true
        ];
        
        // Merge with provided configuration
        $config = array_merge($defaultConfig, $config);
        
        // Get request origin
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
        
        // Determine allowed origin
        if (in_array('*', $config['allowed_origins'])) {
            $allowedOrigin = '*';
        } elseif (in_array($origin, $config['allowed_origins'])) {
            $allowedOrigin = $origin;
        } else {
            // Check for wildcard patterns
            $allowedOrigin = self::checkWildcardOrigins($origin, $config['allowed_origins']);
        }
        
        // Set CORS headers
        if ($allowedOrigin) {
            header("Access-Control-Allow-Origin: $allowedOrigin");
        }
        
        // Set allowed methods
        header('Access-Control-Allow-Methods: ' . implode(', ', $config['allowed_methods']));
        
        // Set allowed headers
        header('Access-Control-Allow-Headers: ' . implode(', ', $config['allowed_headers']));
        
        // Set exposed headers
        if (!empty($config['exposed_headers'])) {
            header('Access-Control-Expose-Headers: ' . implode(', ', $config['exposed_headers']));
        }
        
        // Set credentials flag
        if ($config['allow_credentials'] && $allowedOrigin !== '*') {
            header('Access-Control-Allow-Credentials: true');
        }
        
        // Set max age for preflight cache
        header('Access-Control-Max-Age: ' . $config['max_age']);
        
        // Set Vary header for caching
        if ($config['vary_header']) {
            $varyHeaders = ['Origin'];
            if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD'])) {
                $varyHeaders[] = 'Access-Control-Request-Method';
            }
            if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS'])) {
                $varyHeaders[] = 'Access-Control-Request-Headers';
            }
            header('Vary: ' . implode(', ', $varyHeaders));
        }
        
        // Handle preflight OPTIONS request
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            self::handlePreflight($config);
        }
    }
    
    /**
     * Handle preflight OPTIONS request
     */
    private static function handlePreflight($config) {
        // Validate requested method
        $requestedMethod = $_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD'] ?? '';
        if ($requestedMethod && !in_array($requestedMethod, $config['allowed_methods'])) {
            http_response_code(405);
            header('Allow: ' . implode(', ', $config['allowed_methods']));
            exit;
        }
        
        // Validate requested headers
        $requestedHeaders = $_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS'] ?? '';
        if ($requestedHeaders) {
            $requestedHeadersList = array_map('trim', explode(',', $requestedHeaders));
            $allowedHeadersLower = array_map('strtolower', $config['allowed_headers']);
            
            foreach ($requestedHeadersList as $header) {
                if (!in_array(strtolower($header), $allowedHeadersLower)) {
                    http_response_code(400);
                    exit('Header not allowed: ' . $header);
                }
            }
        }
        
        // Send successful preflight response
        http_response_code(204);
        exit;
    }
    
    /**
     * Check if origin matches wildcard patterns
     */
    private static function checkWildcardOrigins($origin, $allowedOrigins) {
        foreach ($allowedOrigins as $allowedOrigin) {
            if (strpos($allowedOrigin, '*') !== false) {
                $pattern = str_replace(['*', '.'], ['.*', '\.'], $allowedOrigin);
                if (preg_match('/^' . $pattern . '$/', $origin)) {
                    return $origin;
                }
            }
        }
        return null;
    }
    
    /**
     * Get CORS configuration for development
     */
    public static function getDevelopmentConfig() {
        return [
            'allowed_origins' => [
                'http://localhost:3000',
                'http://localhost:8080',
                'http://127.0.0.1:3000',
                'http://127.0.0.1:8080',
                'https://trial.cluestoday.com'
            ],
            'allow_credentials' => true
        ];
    }
    
    /**
     * Get CORS configuration for production
     */
    public static function getProductionConfig() {
        return [
            'allowed_origins' => [
                'https://trial.cluestoday.com',
                'https://www.trial.cluestoday.com'
            ],
            'allow_credentials' => true,
            'max_age' => 3600 // 1 hour in production
        ];
    }
}