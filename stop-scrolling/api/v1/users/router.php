<?php
/**
 * Users API Router
 * Routes requests to appropriate user endpoints
 */

// Get the request path
$requestUri = $_SERVER['REQUEST_URI'];
$path = parse_url($requestUri, PHP_URL_PATH);

// Remove the base path to get the endpoint
$basePath = '/stop-scrolling/api/v1/users';
$endpoint = str_replace($basePath, '', $path);
$endpoint = trim($endpoint, '/');

// Route to appropriate endpoint
switch ($endpoint) {
    case 'profile':
        require_once __DIR__ . '/profile.php';
        break;
        
    case 'settings':
        require_once __DIR__ . '/settings.php';
        break;
        
    default:
        header('Content-Type: application/json');
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'Endpoint not found'
        ]);
        break;
}