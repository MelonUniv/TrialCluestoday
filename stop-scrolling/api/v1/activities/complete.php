<?php
/**
 * Complete Activity Session API Endpoint
 * POST /api/v1/activities/complete
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

require_once __DIR__ . '/../../../lib/core/JWT.php';
require_once __DIR__ . '/../../../lib/models/Activity.php';

try {
    // Verify JWT token
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? '';
    
    if (!preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Authorization token required']);
        exit;
    }
    
    $token = $matches[1];
    $jwt = new JWT();
    $payload = $jwt->decode($token);
    
    if (!$payload) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Invalid or expired token']);
        exit;
    }
    
    // Get request data
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid JSON input']);
        exit;
    }
    
    // Validate required fields
    if (!isset($input['session_id'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'session_id is required']);
        exit;
    }
    
    $sessionId = $input['session_id'];
    $scoreData = [
        'score' => $input['score'] ?? 0,
        'accuracy' => $input['accuracy'] ?? 100,
        'completion_rate' => $input['completion_rate'] ?? 100,
        'moves' => $input['moves'] ?? 0,
        'hints_used' => $input['hints_used'] ?? 0,
        'time_bonuses' => $input['time_bonuses'] ?? 0,
        'streak_count' => $input['streak_count'] ?? 0,
        'perfect_rounds' => $input['perfect_rounds'] ?? 0,
        'game_specific_data' => $input['game_data'] ?? []
    ];
    
    // Complete activity session
    $activityModel = new Activity();
    $result = $activityModel->completeSession($sessionId, $scoreData);
    
    if ($result['success']) {
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Activity completed successfully',
            'data' => [
                'experience_points' => $result['experience_points'],
                'achievements' => $result['achievements'],
                'session_summary' => $result['session_summary']
            ]
        ]);
    } else {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => $result['message']
        ]);
    }
    
} catch (Exception $e) {
    error_log('Complete activity error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Internal server error'
    ]);
}