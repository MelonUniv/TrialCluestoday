<?php
/**
 * Input Validation Middleware
 * Sanitizes and validates all API inputs to prevent security vulnerabilities
 */

class ValidationMiddleware {
    
    /**
     * Sanitize and validate request data
     */
    public static function sanitizeRequest() {
        // Sanitize GET parameters
        $_GET = self::sanitizeArray($_GET);
        
        // Sanitize POST parameters
        $_POST = self::sanitizeArray($_POST);
        
        // Sanitize and validate JSON input
        $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
        if (strpos($contentType, 'application/json') !== false) {
            $jsonInput = file_get_contents('php://input');
            if ($jsonInput) {
                $decodedInput = json_decode($jsonInput, true);
                if (json_last_error() === JSON_ERROR_NONE && is_array($decodedInput)) {
                    $decodedInput = self::sanitizeArray($decodedInput);
                    // Store sanitized JSON data for later use
                    $_POST = array_merge($_POST, $decodedInput);
                }
            }
        }
        
        // Sanitize server variables that might be used
        $serverVarsToSanitize = [
            'HTTP_USER_AGENT',
            'HTTP_REFERER',
            'HTTP_X_FORWARDED_FOR',
            'HTTP_X_REAL_IP'
        ];
        
        foreach ($serverVarsToSanitize as $var) {
            if (isset($_SERVER[$var])) {
                $_SERVER[$var] = self::sanitizeString($_SERVER[$var]);
            }
        }
    }
    
    /**
     * Apply security headers to prevent common attacks
     */
    public static function applySecurityHeaders() {
        // Prevent MIME type sniffing
        header('X-Content-Type-Options: nosniff');
        
        // Prevent clickjacking
        header('X-Frame-Options: DENY');
        
        // Enable XSS protection
        header('X-XSS-Protection: 1; mode=block');
        
        // Referrer policy
        header('Referrer-Policy: strict-origin-when-cross-origin');
        
        // Content Security Policy for API responses
        header("Content-Security-Policy: default-src 'none'; frame-ancestors 'none';");
        
        // Force HTTPS in production
        if (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') {
            header('Strict-Transport-Security: max-age=31536000; includeSubDomains; preload');
        }
        
        // Remove server signature
        header_remove('Server');
        header_remove('X-Powered-By');
    }
    
    /**
     * Sanitize an array recursively
     */
    private static function sanitizeArray($array) {
        if (!is_array($array)) {
            return self::sanitizeValue($array);
        }
        
        $sanitized = [];
        foreach ($array as $key => $value) {
            $cleanKey = self::sanitizeKey($key);
            
            if (is_array($value)) {
                $sanitized[$cleanKey] = self::sanitizeArray($value);
            } else {
                $sanitized[$cleanKey] = self::sanitizeValue($value);
            }
        }
        
        return $sanitized;
    }
    
    /**
     * Sanitize array keys
     */
    private static function sanitizeKey($key) {
        // Remove any non-alphanumeric characters except underscore and hyphen
        return preg_replace('/[^a-zA-Z0-9_\-]/', '', $key);
    }
    
    /**
     * Sanitize individual values
     */
    private static function sanitizeValue($value) {
        if (is_string($value)) {
            return self::sanitizeString($value);
        } elseif (is_numeric($value)) {
            return $value;
        } elseif (is_bool($value)) {
            return $value;
        } elseif (is_null($value)) {
            return null;
        }
        
        // For other types, convert to string and sanitize
        return self::sanitizeString((string) $value);
    }
    
    /**
     * Sanitize string input
     */
    private static function sanitizeString($input) {
        // Remove null bytes
        $input = str_replace("\0", '', $input);
        
        // Trim whitespace
        $input = trim($input);
        
        // Remove control characters except newlines and tabs
        $input = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', '', $input);
        
        // Limit string length to prevent memory issues
        if (strlen($input) > 65535) {
            $input = substr($input, 0, 65535);
        }
        
        return $input;
    }
    
    /**
     * Validate and sanitize email
     */
    public static function validateEmail($email) {
        $email = self::sanitizeString($email);
        
        if (strlen($email) > 254) {
            return false;
        }
        
        return filter_var($email, FILTER_VALIDATE_EMAIL);
    }
    
    /**
     * Validate and sanitize URL
     */
    public static function validateUrl($url) {
        $url = self::sanitizeString($url);
        
        if (strlen($url) > 2048) {
            return false;
        }
        
        return filter_var($url, FILTER_VALIDATE_URL);
    }
    
    /**
     * Validate integer with optional range
     */
    public static function validateInteger($value, $min = null, $max = null) {
        $int = filter_var($value, FILTER_VALIDATE_INT);
        
        if ($int === false) {
            return false;
        }
        
        if ($min !== null && $int < $min) {
            return false;
        }
        
        if ($max !== null && $int > $max) {
            return false;
        }
        
        return $int;
    }
    
    /**
     * Validate float with optional range
     */
    public static function validateFloat($value, $min = null, $max = null) {
        $float = filter_var($value, FILTER_VALIDATE_FLOAT);
        
        if ($float === false) {
            return false;
        }
        
        if ($min !== null && $float < $min) {
            return false;
        }
        
        if ($max !== null && $float > $max) {
            return false;
        }
        
        return $float;
    }
    
    /**
     * Validate boolean
     */
    public static function validateBoolean($value) {
        return filter_var($value, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
    }
    
    /**
     * Validate UUID format
     */
    public static function validateUuid($uuid) {
        $uuid = self::sanitizeString($uuid);
        $pattern = '/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i';
        return preg_match($pattern, $uuid) ? $uuid : false;
    }
    
    /**
     * Validate date format
     */
    public static function validateDate($date, $format = 'Y-m-d') {
        $date = self::sanitizeString($date);
        $dateTime = DateTime::createFromFormat($format, $date);
        
        if (!$dateTime || $dateTime->format($format) !== $date) {
            return false;
        }
        
        return $date;
    }
    
    /**
     * Validate time format
     */
    public static function validateTime($time, $format = 'H:i:s') {
        return self::validateDate($time, $format);
    }
    
    /**
     * Validate datetime format
     */
    public static function validateDateTime($datetime, $format = 'Y-m-d H:i:s') {
        return self::validateDate($datetime, $format);
    }
    
    /**
     * Validate string length
     */
    public static function validateStringLength($string, $minLength = 0, $maxLength = 255) {
        $string = self::sanitizeString($string);
        $length = strlen($string);
        
        if ($length < $minLength || $length > $maxLength) {
            return false;
        }
        
        return $string;
    }
    
    /**
     * Validate against whitelist
     */
    public static function validateWhitelist($value, $whitelist) {
        $value = self::sanitizeString($value);
        return in_array($value, $whitelist, true) ? $value : false;
    }
    
    /**
     * Validate against regex pattern
     */
    public static function validatePattern($value, $pattern) {
        $value = self::sanitizeString($value);
        return preg_match($pattern, $value) ? $value : false;
    }
    
    /**
     * Check for SQL injection patterns
     */
    public static function detectSqlInjection($input) {
        $sqlPatterns = [
            '/(\bunion\s+select\b)/i',
            '/(\bselect\s+.*\bfrom\b)/i',
            '/(\binsert\s+into\b)/i',
            '/(\bdelete\s+from\b)/i',
            '/(\bupdate\s+.*\bset\b)/i',
            '/(\bdrop\s+table\b)/i',
            '/(\balter\s+table\b)/i',
            '/(\bcreate\s+table\b)/i',
            '/(\'.*\';\s*--)/i',
            '/(\/\*.*\*\/)/i',
            '/(\bexec\b|\bexecute\b)/i',
            '/(\bsp_\w+)/i'
        ];
        
        $input = self::sanitizeString($input);
        
        foreach ($sqlPatterns as $pattern) {
            if (preg_match($pattern, $input)) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Check for XSS patterns
     */
    public static function detectXss($input) {
        $xssPatterns = [
            '/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/mi',
            '/javascript:/i',
            '/on\w+\s*=/i',
            '/<iframe\b/i',
            '/<object\b/i',
            '/<embed\b/i',
            '/<link\b/i',
            '/<meta\b/i',
            '/style\s*=/i',
            '/expression\s*\(/i',
            '/vbscript:/i',
            '/data:\s*text\/html/i'
        ];
        
        $input = self::sanitizeString($input);
        
        foreach ($xssPatterns as $pattern) {
            if (preg_match($pattern, $input)) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Validate file upload
     */
    public static function validateFileUpload($file, $allowedTypes = [], $maxSize = 5242880) { // 5MB default
        if (!is_array($file) || !isset($file['tmp_name']) || $file['error'] !== UPLOAD_ERR_OK) {
            return false;
        }
        
        // Check file size
        if ($file['size'] > $maxSize) {
            return false;
        }
        
        // Check MIME type
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);
        
        if (!empty($allowedTypes) && !in_array($mimeType, $allowedTypes)) {
            return false;
        }
        
        // Additional security checks could be added here
        
        return true;
    }
}