<?php
/**
 * CORS Configuration
 * Cross-Origin Resource Sharing settings
 */

// CORS Settings
define('CORS_ALLOWED_ORIGINS', [
    'https://trial.cluestoday.com',
    'http://localhost:3000', // Development
    'http://localhost:8080', // Development
]);

// Allowed HTTP Methods
define('CORS_ALLOWED_METHODS', [
    'GET',
    'POST',
    'PUT',
    'DELETE',
    'OPTIONS',
    'PATCH'
]);

// Allowed Headers
define('CORS_ALLOWED_HEADERS', [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-CSRF-Token',
    'Accept',
    'Accept-Language',
    'Cache-Control',
]);

// Exposed Headers (headers that the browser can access)
define('CORS_EXPOSED_HEADERS', [
    'X-Total-Count',
    'X-Page-Count',
    'X-Current-Page',
    'X-Per-Page',
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
]);

// Credentials Support
define('CORS_ALLOW_CREDENTIALS', true);

// Preflight Cache Duration (seconds)
define('CORS_MAX_AGE', 86400); // 24 hours

/**
 * Apply CORS headers to response
 */
function applyCorsHeaders() {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    
    // Check if origin is allowed
    if (in_array($origin, CORS_ALLOWED_ORIGINS)) {
        header('Access-Control-Allow-Origin: ' . $origin);
    } elseif (APP_ENV === 'development') {
        // Allow all origins in development
        header('Access-Control-Allow-Origin: *');
    }
    
    // Set other CORS headers
    header('Access-Control-Allow-Methods: ' . implode(', ', CORS_ALLOWED_METHODS));
    header('Access-Control-Allow-Headers: ' . implode(', ', CORS_ALLOWED_HEADERS));
    header('Access-Control-Expose-Headers: ' . implode(', ', CORS_EXPOSED_HEADERS));
    
    if (CORS_ALLOW_CREDENTIALS) {
        header('Access-Control-Allow-Credentials: true');
    }
    
    header('Access-Control-Max-Age: ' . CORS_MAX_AGE);
    
    // Handle preflight requests
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}

/**
 * Check if request origin is allowed
 */
function isOriginAllowed($origin = null) {
    if (!$origin) {
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    }
    
    if (empty($origin)) {
        return false;
    }
    
    // Allow in development
    if (APP_ENV === 'development') {
        return true;
    }
    
    return in_array($origin, CORS_ALLOWED_ORIGINS);
}