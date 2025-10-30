<?php
/**
 * Contents API Endpoint
 * Handle GET requests for content listing with filters and pagination
 */

require_once __DIR__ . '/../../../lib/helpers/Response.php';
require_once __DIR__ . '/../../../lib/models/Content.php';
require_once __DIR__ . '/../../../config/app.php';

// Apply CORS headers
Response::applyCorsHeaders();

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::methodNotAllowed(['GET']);
}

// Initialize content model
$contentModel = new Content();

try {
    // Get query parameters
    $filters = [
        'category' => $_GET['category'] ?? '',
        'difficulty' => $_GET['difficulty'] ?? '',
        'is_premium' => $_GET['is_premium'] ?? '',
        'search' => $_GET['search'] ?? '',
        'sort' => $_GET['sort'] ?? 'newest'
    ];
    
    $pagination = [
        'limit' => min((int)($_GET['limit'] ?? 20), 50), // Max 50 items per page
        'offset' => max((int)($_GET['offset'] ?? 0), 0)
    ];
    
    // Clean empty filters
    $filters = array_filter($filters, function($value) {
        return $value !== '';
    });
    
    // Get content and total count
    $contents = $contentModel->getAll($filters, $pagination);
    $totalCount = $contentModel->getCount($filters);
    
    // Calculate pagination info
    $totalPages = ceil($totalCount / $pagination['limit']);
    $currentPage = floor($pagination['offset'] / $pagination['limit']) + 1;
    
    // Add pagination headers
    header("X-Total-Count: $totalCount");
    header("X-Page-Count: $totalPages");
    header("X-Current-Page: $currentPage");
    header("X-Per-Page: " . $pagination['limit']);
    
    // Format response
    $response = [
        'contents' => $contents,
        'pagination' => [
            'total' => $totalCount,
            'pages' => $totalPages,
            'current_page' => $currentPage,
            'per_page' => $pagination['limit'],
            'has_next' => $currentPage < $totalPages,
            'has_prev' => $currentPage > 1
        ],
        'filters_applied' => $filters
    ];
    
    Response::success($response, 'Contents retrieved successfully');
    
} catch (Exception $e) {
    error_log("Contents API Error: " . $e->getMessage());
    Response::serverError('Failed to retrieve contents');
}