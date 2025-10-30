<?php
/**
 * Contents API Router
 * Routes content-related API requests to appropriate endpoints
 */

require_once __DIR__ . '/../../../lib/helpers/Response.php';

// Apply CORS headers
Response::applyCorsHeaders();

// Get the request path after /api/v1/contents/
$requestUri = $_SERVER['REQUEST_URI'];
$basePath = '/stop-scrolling/api/v1/contents/';

// Remove base path and query string
$requestPath = str_replace($basePath, '', parse_url($requestUri, PHP_URL_PATH));
$requestPath = trim($requestPath, '/');

// Route to appropriate endpoint
switch ($requestPath) {
    case '':
        // Default contents listing
        require_once __DIR__ . '/index.php';
        break;
        
    case 'get':
        // Single content by ID
        require_once __DIR__ . '/get.php';
        break;
        
    case 'categories':
        // Content categories
        require_once __DIR__ . '/categories.php';
        break;
        
    case 'recommended':
        // Recommended content
        require_once __DIR__ . '/recommended.php';
        break;
        
    case 'search':
        // Content search
        require_once __DIR__ . '/search.php';
        break;
        
    case 'metadata':
        // Content metadata (tags, difficulties, durations)
        handleMetadataEndpoint();
        break;
        
    default:
        Response::notFound('Content endpoint not found');
}

/**
 * Handle metadata endpoint
 */
function handleMetadataEndpoint() {
    require_once __DIR__ . '/../../../lib/models/Content.php';
    
    $contentModel = new Content();
    $type = $_GET['type'] ?? 'all';
    
    try {
        switch ($type) {
            case 'tags':
                $data = $contentModel->getTags();
                break;
                
            case 'difficulties':
                $data = $contentModel->getDifficultyLevels();
                break;
                
            case 'durations':
                $data = $contentModel->getDurations();
                break;
                
            case 'all':
            default:
                $data = [
                    'tags' => $contentModel->getTags(),
                    'difficulties' => $contentModel->getDifficultyLevels(),
                    'durations' => $contentModel->getDurations()
                ];
                break;
        }
        
        Response::success($data, 'Metadata retrieved successfully');
        
    } catch (Exception $e) {
        error_log("Content Metadata API Error: " . $e->getMessage());
        Response::serverError('Failed to retrieve metadata');
    }
}