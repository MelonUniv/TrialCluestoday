<?php
/**
 * Content Search API Endpoint
 * Handle GET requests for content search
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
    // Get search parameters
    $query = trim($_GET['q'] ?? '');
    
    if (empty($query)) {
        Response::error('Search query is required', 400);
    }
    
    if (strlen($query) < 2) {
        Response::error('Search query must be at least 2 characters', 400);
    }
    
    $filters = [
        'category' => $_GET['category'] ?? '',
        'difficulty' => $_GET['difficulty'] ?? ''
    ];
    
    $pagination = [
        'limit' => min((int)($_GET['limit'] ?? 20), 50),
        'offset' => max((int)($_GET['offset'] ?? 0), 0)
    ];
    
    // Clean empty filters
    $filters = array_filter($filters, function($value) {
        return $value !== '';
    });
    
    // Perform search
    $results = $contentModel->search($query, $filters, $pagination['limit'], $pagination['offset']);
    
    // Get total count for the same search
    $totalCount = $contentModel->getCount(array_merge($filters, ['search' => $query]));
    
    // Calculate pagination info
    $totalPages = ceil($totalCount / $pagination['limit']);
    $currentPage = floor($pagination['offset'] / $pagination['limit']) + 1;
    
    // Add search headers
    header("X-Search-Query: " . urlencode($query));
    header("X-Total-Count: $totalCount");
    header("X-Page-Count: $totalPages");
    
    // Format response
    $response = [
        'query' => $query,
        'results' => $results,
        'total_results' => $totalCount,
        'pagination' => [
            'total' => $totalCount,
            'pages' => $totalPages,
            'current_page' => $currentPage,
            'per_page' => $pagination['limit'],
            'has_next' => $currentPage < $totalPages,
            'has_prev' => $currentPage > 1
        ],
        'filters_applied' => $filters,
        'search_time' => microtime(true) - $_SERVER['REQUEST_TIME_FLOAT']
    ];
    
    Response::success($response, 'Search completed successfully');
    
} catch (Exception $e) {
    error_log("Search API Error: " . $e->getMessage());
    Response::serverError('Search failed');
}