<?php
/**
 * API Router
 * Main entry point for all API requests
 */

require_once __DIR__ . '/../../config/app.php';
require_once __DIR__ . '/../../config/api.php';
require_once __DIR__ . '/../../config/cors.php';

// Apply CORS headers
applyCorsHeaders();

// Set content type
header('Content-Type: application/json');

// Get request method and path
$method = $_SERVER['REQUEST_METHOD'];
$requestUri = $_SERVER['REQUEST_URI'];
$basePath = '/stop-scrolling/api/v1/';

// Remove base path and query string
$path = str_replace($basePath, '', parse_url($requestUri, PHP_URL_PATH));
$path = trim($path, '/');

// Parse path components
$pathParts = explode('/', $path);
$resource = $pathParts[0] ?? '';
$action = $pathParts[1] ?? '';
$id = $pathParts[2] ?? null;

// Route to appropriate handler
try {
    switch ($resource) {
        case 'auth':
            require __DIR__ . '/auth/router.php';
            break;
            
        case 'users':
            require __DIR__ . '/users/router.php';
            break;
            
        case 'contents':
            require __DIR__ . '/contents/router.php';
            break;
            
        case 'activities':
            require __DIR__ . '/activities/router.php';
            break;
            
        case 'stats':
            require __DIR__ . '/stats/router.php';
            break;
            
        case 'gamification':
            require __DIR__ . '/gamification/router.php';
            break;
            
        case 'sessions':
            require __DIR__ . '/sessions/router.php';
            break;
            
        case 'badges':
            require __DIR__ . '/badges/router.php';
            break;
            
        case 'achievements':
            require __DIR__ . '/achievements/router.php';
            break;
            
        case 'streaks':
            require __DIR__ . '/streaks/router.php';
            break;
            
        case 'xp':
            require __DIR__ . '/xp/router.php';
            break;
            
        case 'performance':
            require __DIR__ . '/performance/router.php';
            break;
            
        default:
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'message' => 'Endpoint not found'
            ]);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => APP_DEBUG ? $e->getMessage() : 'Internal server error'
    ]);
}