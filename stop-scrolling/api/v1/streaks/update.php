<?php
/**
 * Update Streak API Endpoint
 * POST /api/v1/streaks/update
 * 
 * Updates user's streak data after activity completion
 */

require_once __DIR__ . '/../../../lib/helpers/Response.php';
require_once __DIR__ . '/../../../lib/core/JWT.php';
require_once __DIR__ . '/../../../lib/core/Database.php';

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
    
    if (!$input || !isset($input['streak'])) {
        Response::error('Invalid request data', 400);
    }
    
    $streakData = $input['streak'];
    $recoveryData = $input['recovery'] ?? [];
    
    // Get database connection
    $db = Database::getInstance();
    $conn = $db->getConnection();
    $conn->exec("USE trialcluestoday_restaurant_ms");
    
    $conn->beginTransaction();
    
    try {
        // Check if streak exists
        $stmt = $conn->prepare("
            SELECT streak_id FROM ss_user_streaks
            WHERE user_id = ? AND streak_id = ?
        ");
        $stmt->execute([$userId, $streakData['streak_id']]);
        $existingStreak = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($existingStreak) {
            // Update existing streak
            $stmt = $conn->prepare("
                UPDATE ss_user_streaks SET
                    current_days = ?,
                    last_activity_date = NOW(),
                    total_activities = ?,
                    milestone_rewards = ?,
                    is_active = ?,
                    updated_at = NOW()
                WHERE streak_id = ? AND user_id = ?
            ");
            $stmt->execute([
                $streakData['days'],
                $streakData['totalActivities'],
                json_encode($streakData['milestoneRewards']),
                $streakData['isActive'] ? 1 : 0,
                $streakData['streak_id'],
                $userId
            ]);
        } else {
            // Create new streak
            $streakId = $streakData['streak_id'] ?: ('streak_' . time() . '_' . substr(md5(uniqid()), 0, 8));
            
            $stmt = $conn->prepare("
                INSERT INTO ss_user_streaks (
                    streak_id,
                    user_id,
                    current_days,
                    start_date,
                    last_activity_date,
                    total_activities,
                    milestone_rewards,
                    is_active,
                    created_at,
                    updated_at
                ) VALUES (?, ?, ?, ?, NOW(), ?, ?, ?, NOW(), NOW())
            ");
            $stmt->execute([
                $streakId,
                $userId,
                $streakData['days'],
                $streakData['startDate'] ?? date('Y-m-d H:i:s'),
                $streakData['totalActivities'],
                json_encode($streakData['milestoneRewards']),
                $streakData['isActive'] ? 1 : 0
            ]);
        }
        
        // Update user statistics with recovery data
        if (!empty($recoveryData)) {
            $stmt = $conn->prepare("
                UPDATE ss_user_statistics SET
                    streak_recoveries_used = ?,
                    last_recovery_date = ?,
                    updated_at = NOW()
                WHERE user_id = ?
            ");
            $stmt->execute([
                $recoveryData['used'] ?? 0,
                $recoveryData['lastRecoveryDate'],
                $userId
            ]);
        }
        
        // Add milestone rewards if any
        if (!empty($streakData['milestoneRewards'])) {
            foreach ($streakData['milestoneRewards'] as $milestone) {
                if (isset($milestone['reward']) && !empty($milestone['reward'])) {
                    $reward = $milestone['reward'];
                    
                    // Add XP if reward includes it
                    if (isset($reward['xp'])) {
                        $stmt = $conn->prepare("
                            UPDATE ss_user_statistics SET
                                total_experience_points = total_experience_points + ?,
                                updated_at = NOW()
                            WHERE user_id = ?
                        ");
                        $stmt->execute([$reward['xp'], $userId]);
                    }
                    
                    // Add streak freeze tokens if reward includes them
                    if (isset($reward['streakFreeze'])) {
                        $stmt = $conn->prepare("
                            UPDATE ss_user_statistics SET
                                streak_freeze_tokens = streak_freeze_tokens + ?,
                                updated_at = NOW()
                            WHERE user_id = ?
                        ");
                        $stmt->execute([$reward['streakFreeze'], $userId]);
                    }
                    
                    // Add badge achievement record
                    if (isset($reward['name'])) {
                        // Check if user already has this badge
                        $stmt = $conn->prepare("
                            SELECT achievement_id FROM ss_user_achievements
                            WHERE user_id = ? AND badge_name = ?
                        ");
                        $stmt->execute([$userId, $reward['name']]);
                        
                        if (!$stmt->fetch()) {
                            // Award new badge
                            $stmt = $conn->prepare("
                                INSERT INTO ss_user_achievements (
                                    achievement_id,
                                    user_id,
                                    badge_name,
                                    badge_description,
                                    earned_date,
                                    achievement_type,
                                    created_at
                                ) VALUES (UUID(), ?, ?, ?, NOW(), 'streak', NOW())
                            ");
                            $stmt->execute([
                                $userId,
                                $reward['name'],
                                "Achieved {$milestone['days']} day streak"
                            ]);
                        }
                    }
                }
            }
        }
        
        $conn->commit();
        
        // Return updated streak data
        $stmt = $conn->prepare("
            SELECT * FROM ss_user_streaks
            WHERE user_id = ? AND streak_id = ?
        ");
        $stmt->execute([$userId, $streakData['streak_id']]);
        $updatedStreak = $stmt->fetch(PDO::FETCH_ASSOC);
        
        Response::success([
            'streak' => [
                'days' => $updatedStreak['current_days'],
                'startDate' => $updatedStreak['start_date'],
                'lastActivityDate' => $updatedStreak['last_activity_date'],
                'totalActivities' => $updatedStreak['total_activities'],
                'milestoneRewards' => json_decode($updatedStreak['milestone_rewards'] ?? '[]', true),
                'isActive' => (bool)$updatedStreak['is_active'],
                'streak_id' => $updatedStreak['streak_id']
            ]
        ], 'Streak updated successfully');
        
    } catch (Exception $e) {
        $conn->rollBack();
        throw $e;
    }
    
} catch (Exception $e) {
    error_log("Update streak error: " . $e->getMessage());
    Response::serverError('Failed to update streak data');
}