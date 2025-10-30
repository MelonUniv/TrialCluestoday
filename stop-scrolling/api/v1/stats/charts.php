<?php
/**
 * Get Chart Data API Endpoint
 * GET /api/v1/stats/charts
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
require_once __DIR__ . '/../../../lib/models/Statistics.php';

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
    $chartType = $_GET['type'] ?? 'activity_over_time';
    
    // Validate chart type
    $validTypes = [
        'activity_over_time', 
        'score_progression', 
        'category_distribution', 
        'weekly_heatmap', 
        'skill_radar'
    ];
    
    if (!in_array($chartType, $validTypes)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Invalid chart type. Valid types: ' . implode(', ', $validTypes)
        ]);
        exit;
    }
    
    // Get chart data
    $statisticsModel = new Statistics();
    $result = $statisticsModel->getChartData($userId, $chartType);
    
    if ($result['success']) {
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'data' => $result['data']
        ]);
    } else {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => $result['message']
        ]);
    }
    
} catch (Exception $e) {
    error_log('Get chart data error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Internal server error'
    ]);
}