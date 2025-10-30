<?php
/**
 * API Response Helper Functions
 * Provides standardized JSON response format for all API endpoints
 */

/**
 * Send a standardized JSON response
 * 
 * @param bool $success Whether the request was successful
 * @param string $message Response message
 * @param mixed $data Optional response data
 * @param int $httpCode HTTP status code (default 200)
 */
function apiResponse($success, $message, $data = null, $httpCode = 200) {
    http_response_code($httpCode);
    
    $response = [
        'success' => $success,
        'message' => $message
    ];
    
    if ($data !== null) {
        $response['data'] = $data;
    }
    
    // Add timestamp
    $response['timestamp'] = time();
    
    // Send JSON response
    header('Content-Type: application/json');
    echo json_encode($response);
    exit;
}

/**
 * Send error response
 * 
 * @param string $message Error message
 * @param int $httpCode HTTP status code (default 400)
 * @param array $errors Optional array of error details
 */
function apiError($message, $httpCode = 400, $errors = null) {
    $data = null;
    if ($errors !== null) {
        $data = ['errors' => $errors];
    }
    apiResponse(false, $message, $data, $httpCode);
}

/**
 * Send success response
 * 
 * @param string $message Success message
 * @param mixed $data Optional response data
 * @param int $httpCode HTTP status code (default 200)
 */
function apiSuccess($message, $data = null, $httpCode = 200) {
    apiResponse(true, $message, $data, $httpCode);
}

/**
 * Send paginated response
 * 
 * @param array $items Data items
 * @param int $total Total number of items
 * @param int $page Current page
 * @param int $perPage Items per page
 * @param string $message Response message
 */
function apiPaginatedResponse($items, $total, $page, $perPage, $message = 'Data retrieved successfully') {
    $totalPages = ceil($total / $perPage);
    
    $data = [
        'items' => $items,
        'pagination' => [
            'total' => $total,
            'per_page' => $perPage,
            'current_page' => $page,
            'total_pages' => $totalPages,
            'has_prev' => $page > 1,
            'has_next' => $page < $totalPages
        ]
    ];
    
    apiSuccess($message, $data);
}