<?php
/**
 * Activities API Router
 * Routes requests to appropriate activity endpoints
 */

// Get the request path
$requestUri = $_SERVER['REQUEST_URI'];
$path = parse_url($requestUri, PHP_URL_PATH);

// Remove the base path to get the endpoint
$basePath = '/stop-scrolling/api/v1/activities';
$endpoint = str_replace($basePath, '', $path);
$endpoint = trim($endpoint, '/');

// Route to appropriate endpoint
switch ($endpoint) {
    case 'start':
        require_once __DIR__ . '/start.php';
        break;
        
    case 'update':
        require_once __DIR__ . '/update.php';
        break;
        
    case 'complete':
        require_once __DIR__ . '/complete.php';
        break;
        
    case 'history':
        require_once __DIR__ . '/history.php';
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