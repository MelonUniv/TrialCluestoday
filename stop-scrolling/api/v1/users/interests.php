<?php
/**
 * User Interests API Endpoint
 * Handle GET and PUT requests for user interests
 */

require_once __DIR__ . '/../../../lib/helpers/Response.php';
require_once __DIR__ . '/../../../lib/models/User.php';
require_once __DIR__ . '/../../../config/app.php';

// Apply CORS headers
Response::applyCorsHeaders();

// Initialize user model
$userModel = new User();

// Get request method
$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            handleGetInterests($userModel);
            break;
            
        case 'PUT':
            handleUpdateInterests($userModel);
            break;
            
        default:
            Response::methodNotAllowed(['GET', 'PUT']);
    }
} catch (Exception $e) {
    error_log("Interests API Error: " . $e->getMessage());
    Response::serverError('An unexpected error occurred');
}

/**
 * Handle GET /api/v1/users/interests
 * Returns user interests
 */
function handleGetInterests($userModel) {
    // Get user ID (normally from auth middleware)
    $userId = $_GET['user_id'] ?? null;
    
    if (!$userId) {
        Response::error('User ID is required', 400);
    }
    
    // Validate user exists
    if (!$userModel->exists($userId)) {
        Response::notFound('User not found');
    }
    
    // Get user interests
    $interests = $userModel->getInterests($userId);
    
    // Return empty interests if none exist
    if (!$interests) {
        $interests = [
            'memory_games' => false,
            'puzzles' => false,
            'trivia' => false,
            'problem_solving' => false,
            'news' => false,
            'mindfulness' => false,
            'languages' => false
        ];
    }
    
    Response::success($interests, 'User interests retrieved successfully');
}

/**
 * Handle PUT /api/v1/users/interests
 * Updates user interests
 */
function handleUpdateInterests($userModel) {
    // Get user ID (normally from auth middleware)
    $userId = $_GET['user_id'] ?? null;
    
    if (!$userId) {
        Response::error('User ID is required', 400);
    }
    
    // Validate user exists
    if (!$userModel->exists($userId)) {
        Response::notFound('User not found');
    }
    
    // Get request data
    $data = Response::getRequestData();
    
    if (empty($data)) {
        Response::error('No interests data provided', 400);
    }
    
    $errors = [];
    $validInterests = [
        'memory_games', 'puzzles', 'trivia', 'problem_solving',
        'news', 'mindfulness', 'languages'
    ];
    
    // Validate that only valid interest fields are provided
    foreach ($data as $interest => $value) {
        if (!in_array($interest, $validInterests)) {
            $errors[$interest] = "Invalid interest category: $interest";
            continue;
        }
        
        // Validate boolean value
        $data[$interest] = filter_var($value, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
        if ($data[$interest] === null) {
            $errors[$interest] = "Invalid boolean value for $interest";
        }
    }
    
    // Check that at least one interest is selected
    $selectedInterests = array_filter($data, function($value) {
        return $value === true;
    });
    
    if (empty($selectedInterests)) {
        $errors['interests'] = 'At least one interest must be selected';
    }
    
    // Return validation errors
    if (!empty($errors)) {
        Response::validationError($errors);
    }
    
    // Update interests
    $result = $userModel->updateInterests($userId, $data);
    
    if (!$result) {
        Response::serverError('Failed to update interests');
    }
    
    // Return updated interests
    $updatedInterests = $userModel->getInterests($userId);
    
    Response::success($updatedInterests, 'Interests updated successfully');
}