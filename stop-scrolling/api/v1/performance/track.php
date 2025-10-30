<?php
/**
 * Track Performance API Endpoint
 * POST /api/v1/performance/track
 * 
 * Tracks user performance for activities and analyzes fatigue
 */

require_once __DIR__ . '/../../../lib/helpers/Response.php';
require_once __DIR__ . '/../../../lib/core/JWT.php';
require_once __DIR__ . '/../../../lib/models/PerformanceTracker.php';

// Apply CORS headers
Response::applyCorsHeaders();

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::methodNotAllowed(['POST']);
}

try {
    // Verify JWT token
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? '';
    
    if (!preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
        Response::error('Authorization token required', 401);
    }
    
    $token = $matches[1];
    $jwt = new JWT();
    $payload = $jwt->decode($token);
    
    if (!$payload) {
        Response::error('Invalid or expired token', 401);
    }
    
    $userId = $payload['sub'];
    
    // Get request data
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        Response::error('Invalid JSON input', 400);
    }
    
    // Validate required fields
    $required = ['session_id', 'content_id', 'category', 'difficulty_level'];
    foreach ($required as $field) {
        if (!isset($input[$field])) {
            Response::error("$field is required", 400);
        }
    }
    
    // Prepare activity data
    $activityData = [
        'user_id' => $userId,
        'session_id' => $input['session_id'],
        'content_id' => $input['content_id'],
        'category' => $input['category'],
        'difficulty_level' => $input['difficulty_level'],
        'target_difficulty' => $input['target_difficulty'] ?? $input['difficulty_level'],
        'activity_index' => $input['activity_index'] ?? 0,
        'score' => $input['score'] ?? 0,
        'max_score' => $input['max_score'] ?? 100,
        'duration_seconds' => $input['duration'] ?? 0,
        'expected_duration' => $input['expected_duration'] ?? 60,
        'started_at' => $input['started_at'] ?? date('Y-m-d H:i:s'),
        'completed_at' => $input['completed_at'] ?? date('Y-m-d H:i:s'),
        'skipped' => $input['skipped'] ?? false
    ];
    
    // Track performance
    $tracker = new PerformanceTracker();
    $result = $tracker->trackPerformance($userId, $input['session_id'], $activityData);
    
    if (!$result['success']) {
        Response::error('Failed to track performance', 500);
    }
    
    // Get recommendations
    $nextDifficulty = $tracker->getRecommendedDifficulty($userId, $input['category']);
    
    // Prepare response
    $response = [
        'metrics' => $result['metrics'],
        'fatigue' => $result['fatigue'],
        'nextDifficulty' => $nextDifficulty,
        'recommendation' => $result['fatigue']['recommendation'] ?? null
    ];
    
    Response::success($response, 'Performance tracked successfully');
    
} catch (Exception $e) {
    error_log("Track performance error: " . $e->getMessage());
    Response::serverError('Failed to track performance');
}