<?php
/**
 * Get Activity History API Endpoint
 * GET /api/v1/activities/history
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
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
    
    $userId = $payload['sub'];
    
    // Get query parameters for filtering
    $filters = [
        'activity_type' => $_GET['activity_type'] ?? null,
        'date_from' => $_GET['date_from'] ?? null,
        'date_to' => $_GET['date_to'] ?? null,
        'status' => $_GET['status'] ?? null,
        'page' => max(1, (int)($_GET['page'] ?? 1)),
        'limit' => min(100, max(1, (int)($_GET['limit'] ?? 20)))
    ];
    
    // Remove null values
    $filters = array_filter($filters, function($value) {
        return $value !== null && $value !== '';
    });
    
    // Get activity history
    $activityModel = new Activity();
    $result = $activityModel->getHistory($userId, $filters);
    
    if ($result['success']) {
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'data' => $result['activities'],
            'pagination' => $result['pagination']
        ]);
    } else {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => $result['message']
        ]);
    }
    
} catch (Exception $e) {
    error_log('Get activity history error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Internal server error'
    ]);
}