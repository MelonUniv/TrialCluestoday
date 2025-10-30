<?php
/**
 * Get Current Streak API Endpoint
 * GET /api/v1/streaks/current
 * 
 * Returns user's current streak information
 */

require_once __DIR__ . '/../../../lib/helpers/Response.php';
require_once __DIR__ . '/../../../lib/core/JWT.php';
require_once __DIR__ . '/../../../lib/core/Database.php';

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
    
    // Get database connection
    $db = Database::getInstance();
    $conn = $db->getConnection();
    $conn->exec("USE trialcluestoday_restaurant_ms");
    
    // Get current streak
    $stmt = $conn->prepare("
        SELECT * FROM ss_user_streaks
        WHERE user_id = ? AND is_active = 1
        ORDER BY start_date DESC
        LIMIT 1
    ");
    $stmt->execute([$userId]);
    $currentStreak = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Get streak history (last 10 streaks)
    $stmt = $conn->prepare("
        SELECT 
            streak_id,
            days_lasted,
            start_date,
            end_date,
            total_activities,
            milestone_rewards,
            end_reason
        FROM ss_user_streaks
        WHERE user_id = ? AND is_active = 0
        ORDER BY start_date DESC
        LIMIT 10
    ");
    $stmt->execute([$userId]);
    $streakHistory = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get recovery information
    $stmt = $conn->prepare("
        SELECT 
            streak_recoveries_used,
            last_recovery_date,
            streak_freeze_tokens
        FROM ss_user_statistics
        WHERE user_id = ?
    ");
    $stmt->execute([$userId]);
    $userStats = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Calculate current streak status
    $streakData = null;
    $recoveryData = [
        'available' => 3, // Default max recoveries
        'used' => $userStats['streak_recoveries_used'] ?? 0,
        'lastRecoveryDate' => $userStats['last_recovery_date'],
        'canRecover' => false
    ];
    
    if ($currentStreak) {
        // Check if streak is still valid
        $today = new DateTime();
        $lastActivity = new DateTime($currentStreak['last_activity_date'] ?? $currentStreak['start_date']);
        $daysDiff = $today->diff($lastActivity)->days;
        
        // Allow 6-hour grace period past midnight
        $gracePeriod = new DateTime();
        $gracePeriod->setTime(6, 0, 0);
        if ($today->getTimestamp() < $gracePeriod->getTimestamp()) {
            $daysDiff = max(0, $daysDiff - 1);
        }
        
        $streakActive = $daysDiff <= 1;
        $canRecover = $daysDiff > 1 && $daysDiff <= 3 && $recoveryData['used'] < $recoveryData['available'];
        
        $streakData = [
            'days' => $currentStreak['current_days'],
            'startDate' => $currentStreak['start_date'],
            'lastActivityDate' => $currentStreak['last_activity_date'],
            'totalActivities' => $currentStreak['total_activities'],
            'milestoneRewards' => json_decode($currentStreak['milestone_rewards'] ?? '[]', true),
            'isActive' => $streakActive,
            'streak_id' => $currentStreak['streak_id']
        ];
        
        $recoveryData['canRecover'] = $canRecover;
        
        // If streak is broken but recoverable, mark it
        if (!$streakActive && $canRecover) {
            $streakData['needsRecovery'] = true;
            $streakData['daysSinceBreak'] = $daysDiff;
        }
    } else {
        // No current streak
        $streakData = [
            'days' => 0,
            'startDate' => null,
            'lastActivityDate' => null,
            'totalActivities' => 0,
            'milestoneRewards' => [],
            'isActive' => false,
            'streak_id' => null
        ];
    }
    
    // Add streak freeze tokens from milestones
    $recoveryData['streakFreezeTokens'] = $userStats['streak_freeze_tokens'] ?? 0;
    
    // Format streak history
    $formattedHistory = array_map(function($streak) {
        return [
            'streak_id' => $streak['streak_id'],
            'daysLasted' => $streak['days_lasted'],
            'startDate' => $streak['start_date'],
            'endDate' => $streak['end_date'],
            'totalActivities' => $streak['total_activities'],
            'milestoneRewards' => json_decode($streak['milestone_rewards'] ?? '[]', true),
            'reason' => $streak['end_reason'] ?? 'unknown'
        ];
    }, $streakHistory);
    
    $response = [
        'streak' => $streakData,
        'recovery' => $recoveryData,
        'history' => $formattedHistory
    ];
    
    Response::success($response, 'Current streak data retrieved successfully');
    
} catch (Exception $e) {
    error_log("Get current streak error: " . $e->getMessage());
    Response::serverError('Failed to retrieve streak data');
}