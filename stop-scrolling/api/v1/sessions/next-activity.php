<?php
/**
 * Get Next Activity API Endpoint
 * GET /api/v1/sessions/next-activity
 * 
 * Returns the next activity in the current flow session
 */

require_once __DIR__ . '/../../../lib/helpers/Response.php';
require_once __DIR__ . '/../../../lib/core/JWT.php';
require_once __DIR__ . '/../../../config/database.php';

// Apply CORS headers
Response::applyCorsHeaders();

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::methodNotAllowed(['GET']);
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
    $sessionId = $_GET['sessionId'] ?? '';
    
    if (empty($sessionId)) {
        Response::error('Session ID is required', 400);
    }
    
    // Get database connection
    $db = Database::getInstance();
    $conn = $db->getConnection();
    $conn->exec("USE trialcluestoday_restaurant_ms");
    
    // Get current session
    $stmt = $conn->prepare("
        SELECT * FROM ss_user_sessions_flow 
        WHERE session_flow_id = ? 
        AND user_id = ?
        AND session_state IN ('active', 'paused')
    ");
    $stmt->execute([$sessionId, $userId]);
    
    if ($stmt->rowCount() === 0) {
        Response::error('Active session not found', 404);
    }
    
    $session = $stmt->fetch(PDO::FETCH_ASSOC);
    $sequence = json_decode($session['activities_sequence'], true);
    $currentIndex = $session['current_index'];
    
    // Check if there are more activities
    if ($currentIndex >= count($sequence)) {
        Response::success([
            'hasNext' => false,
            'message' => 'No more activities in this session'
        ]);
    }
    
    // Get next activity
    $nextActivity = $sequence[$currentIndex];
    
    // Check if it's a break
    if (isset($nextActivity['type']) && $nextActivity['type'] === 'break') {
        // Return break information
        Response::success([
            'hasNext' => true,
            'type' => 'break',
            'duration' => $nextActivity['duration'] ?? 30,
            'reason' => $nextActivity['reason'] ?? 'interval',
            'index' => $currentIndex,
            'totalActivities' => count($sequence),
            'progress' => [
                'completed' => $session['activities_completed'],
                'total' => $session['total_activities'],
                'percentage' => round(($session['activities_completed'] / $session['total_activities']) * 100)
            ]
        ]);
    }
    
    // Get full content details
    $stmt = $conn->prepare("
        SELECT * FROM ss_contents 
        WHERE content_id = ?
    ");
    $stmt->execute([$nextActivity['content_id']]);
    $content = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$content) {
        // Content not found, skip to next
        $conn->prepare("
            UPDATE ss_user_sessions_flow 
            SET current_index = current_index + 1 
            WHERE session_flow_id = ?
        ")->execute([$sessionId]);
        
        // Recursive call to get next valid activity
        header("Location: " . $_SERVER['REQUEST_URI']);
        exit;
    }
    
    // Parse content data
    $content['content_data'] = json_decode($content['content_data'], true);
    
    // Update session index
    $conn->prepare("
        UPDATE ss_user_sessions_flow 
        SET current_index = current_index + 1 
        WHERE session_flow_id = ?
    ")->execute([$sessionId]);
    
    // Prepare response
    $response = [
        'hasNext' => true,
        'type' => 'activity',
        'activity' => [
            'contentId' => $content['content_id'],
            'title' => $content['title'],
            'description' => $content['description'],
            'category' => $content['category'],
            'subCategory' => $content['sub_category'],
            'difficulty' => $content['difficulty_level'],
            'estimatedDuration' => $content['estimated_duration_seconds'],
            'contentData' => $content['content_data'],
            'thumbnailUrl' => $content['thumbnail_url']
        ],
        'index' => $currentIndex,
        'totalActivities' => count($sequence),
        'progress' => [
            'completed' => $session['activities_completed'],
            'total' => $session['total_activities'],
            'percentage' => round(($session['activities_completed'] / $session['total_activities']) * 100)
        ],
        'nextPreview' => null
    ];
    
    // Add preview of next activity if available
    if ($currentIndex + 1 < count($sequence)) {
        $upcomingActivity = $sequence[$currentIndex + 1];
        if (!isset($upcomingActivity['type']) || $upcomingActivity['type'] !== 'break') {
            $stmt = $conn->prepare("
                SELECT title, category, difficulty_level 
                FROM ss_contents 
                WHERE content_id = ?
            ");
            $stmt->execute([$upcomingActivity['content_id']]);
            $preview = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($preview) {
                $response['nextPreview'] = [
                    'title' => $preview['title'],
                    'category' => $preview['category'],
                    'difficulty' => $preview['difficulty_level']
                ];
            }
        }
    }
    
    Response::success($response, 'Next activity retrieved successfully');
    
} catch (Exception $e) {
    error_log("Get next activity error: " . $e->getMessage());
    Response::serverError('Failed to get next activity');
}
?>