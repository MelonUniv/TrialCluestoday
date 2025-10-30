<?php
/**
 * Statistics API Router
 * Routes requests to appropriate statistics endpoints
 */

// Get the request path
$requestUri = $_SERVER['REQUEST_URI'];
$path = parse_url($requestUri, PHP_URL_PATH);

// Remove the base path to get the endpoint
$basePath = '/stop-scrolling/api/v1/stats';
$endpoint = str_replace($basePath, '', $path);
$endpoint = trim($endpoint, '/');

// Route to appropriate endpoint
switch ($endpoint) {
    case 'overview':
        require_once __DIR__ . '/overview.php';
        break;
        
    case 'detailed':
        require_once __DIR__ . '/detailed.php';
        break;
        
    case 'charts':
        require_once __DIR__ . '/charts.php';
        break;
        
    case 'insights':
        require_once __DIR__ . '/insights.php';
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