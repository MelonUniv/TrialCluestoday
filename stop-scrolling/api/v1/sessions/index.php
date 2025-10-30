<?php
/**
 * Sessions API Endpoint
 * List user sessions
 */

require_once __DIR__ . '/../../../lib/helpers/Response.php';
require_once __DIR__ . '/../../../lib/helpers/functions.php';
require_once __DIR__ . '/../../../lib/core/Database.php';

// Apply CORS headers
Response::applyCorsHeaders();

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::methodNotAllowed(['GET']);
}

// Authenticate user (optional - returns sessions for authenticated user or empty for guests)
$token = getBearerToken();
$userId = null;

if ($token) {
    require_once __DIR__ . '/../../../lib/core/JWT.php';
    try {
        $payload = JWT::decode($token, JWT_SECRET);
        if ($payload && isset($payload->sub)) {
            $userId = $payload->sub;
        }
    } catch (Exception $e) {
        // Invalid token, continue as guest
    }
}

try {
    $db = Database::getInstance();
    $conn = $db->getConnection();
    
    if ($userId) {
        // Get user's active sessions
        $stmt = $conn->prepare("
            SELECT 
                session_id,
                session_type,
                status,
                started_at,
                ended_at,
                total_duration_seconds,
                activities_completed,
                mood_before,
                mood_after
            FROM " . DB_PREFIX . "user_sessions
            WHERE user_id = ?
            ORDER BY started_at DESC
            LIMIT 10
        ");
        
        $stmt->execute([$userId]);
        $sessions = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        Response::success([
            'sessions' => $sessions,
            'user_id' => $userId
        ], 'Sessions retrieved successfully');
    } else {
        // Return empty sessions for guest users
        Response::success([
            'sessions' => [],
            'message' => 'Please log in to view your sessions'
        ], 'Guest access');
    }
    
} catch (Exception $e) {
    error_log("Sessions API Error: " . $e->getMessage());
    Response::serverError('Failed to retrieve sessions');
}