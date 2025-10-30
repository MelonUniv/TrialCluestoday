<?php
/**
 * User Logout Endpoint
 * POST /api/v1/auth/logout
 */

require_once __DIR__ . '/../../../lib/core/Auth.php';
require_once __DIR__ . '/../../../lib/helpers/functions.php';

// Get authorization token
$token = getBearerToken();

if (!$token) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'message' => 'Authorization token required'
    ]);
    exit;
}

try {
    $auth = new Auth();
    
    // Validate token and get user info
    $payload = $auth->validateToken($token);
    
    // Blacklist the token
    $auth->blacklistToken($token);
    
    // Return success response
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Logged out successfully'
    ]);
    
} catch (Exception $e) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'message' => 'Invalid or expired token'
    ]);
}