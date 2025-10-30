<?php
/**
 * Response Helper Class
 * Standardizes API responses
 */

class Response {
    
    /**
     * Send JSON response
     */
    public static function json($data, $statusCode = 200) {
        http_response_code($statusCode);
        header('Content-Type: application/json');
        echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
        exit;
    }
    
    /**
     * Send success response
     */
    public static function success($data = null, $message = 'Success', $statusCode = 200) {
        $response = [
            'success' => true,
            'message' => $message
        ];
        
        if ($data !== null) {
            $response['data'] = $data;
        }
        
        self::json($response, $statusCode);
    }
    
    /**
     * Send error response
     */
    public static function error($message = 'An error occurred', $statusCode = 400, $details = null) {
        $response = [
            'success' => false,
            'message' => $message
        ];
        
        if ($details !== null) {
            $response['details'] = $details;
        }
        
        self::json($response, $statusCode);
    }
    
    /**
     * Send validation error response
     */
    public static function validationError($errors, $message = 'Validation failed') {
        $response = [
            'success' => false,
            'message' => $message,
            'errors' => $errors
        ];
        
        self::json($response, 422);
    }
    
    /**
     * Send unauthorized response
     */
    public static function unauthorized($message = 'Unauthorized access') {
        self::error($message, 401);
    }
    
    /**
     * Send forbidden response
     */
    public static function forbidden($message = 'Access forbidden') {
        self::error($message, 403);
    }
    
    /**
     * Send not found response
     */
    public static function notFound($message = 'Resource not found') {
        self::error($message, 404);
    }
    
    /**
     * Send method not allowed response
     */
    public static function methodNotAllowed($allowedMethods = []) {
        $message = 'Method not allowed';
        if (!empty($allowedMethods)) {
            $message .= '. Allowed methods: ' . implode(', ', $allowedMethods);
        }
        
        self::error($message, 405);
    }
    
    /**
     * Send server error response
     */
    public static function serverError($message = 'Internal server error') {
        self::error($message, 500);
    }
    
    /**
     * Send rate limit exceeded response
     */
    public static function rateLimitExceeded($message = 'Rate limit exceeded', $retryAfter = null) {
        if ($retryAfter) {
            header("Retry-After: $retryAfter");
        }
        
        self::error($message, 429);
    }
    
    /**
     * Get request data (JSON or form data)
     */
    public static function getRequestData() {
        $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
        
        if (strpos($contentType, 'application/json') !== false) {
            $input = file_get_contents('php://input');
            return json_decode($input, true) ?? [];
        }
        
        // For form data or other content types
        return $_POST;
    }
    
    /**
     * Validate required fields
     */
    public static function validateRequired($data, $requiredFields) {
        $missing = [];
        
        foreach ($requiredFields as $field) {
            if (!isset($data[$field]) || empty($data[$field])) {
                $missing[] = $field;
            }
        }
        
        return $missing;
    }
    
    /**
     * Sanitize string input
     */
    public static function sanitizeString($input) {
        return htmlspecialchars(strip_tags(trim($input)), ENT_QUOTES, 'UTF-8');
    }
    
    /**
     * Validate email format
     */
    public static function validateEmail($email) {
        return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
    }
    
    /**
     * Apply CORS headers
     */
    public static function applyCorsHeaders() {
        // Allow from any origin
        header("Access-Control-Allow-Origin: *");
        
        // Allow specific headers
        header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
        
        // Allow specific methods
        header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
        
        // Allow credentials
        header("Access-Control-Allow-Credentials: true");
        
        // Cache preflight requests for 24 hours
        header("Access-Control-Max-Age: 86400");
        
        // Handle preflight OPTIONS request
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            exit;
        }
    }
}