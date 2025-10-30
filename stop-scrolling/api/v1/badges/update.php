<?php
/**
 * Update Badge Progress API Endpoint
 * POST /api/v1/badges/update
 * 
 * Updates user's badge progress and earned badges
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
    
    if (!$input || (!isset($input['progress']) && !isset($input['earned']))) {
        Response::error('Invalid request data', 400);
    }
    
    // Get database connection
    $db = Database::getInstance();
    $conn = $db->getConnection();
    $conn->exec("USE trialcluestoday_restaurant_ms");
    
    $conn->beginTransaction();
    
    try {
        // Update earned badges if provided
        if (isset($input['earned']) && is_array($input['earned'])) {
            foreach ($input['earned'] as $badge) {
                // Check if badge already exists
                $stmt = $conn->prepare("
                    SELECT achievement_id FROM ss_user_achievements
                    WHERE user_id = ? AND badge_name = ?
                ");
                $stmt->execute([$userId, $badge['name']]);
                
                if (!$stmt->fetch()) {
                    // Insert new badge
                    $stmt = $conn->prepare("
                        INSERT INTO ss_user_achievements (
                            achievement_id,
                            user_id,
                            badge_name,
                            badge_description,
                            earned_date,
                            achievement_type,
                            badge_tier,
                            category,
                            progress_data,
                            created_at
                        ) VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, NOW())
                    ");
                    
                    $progressData = json_encode([
                        'icon' => $badge['icon'] ?? '🏆',
                        'color' => $badge['color'] ?? '#667eea',
                        'requirements' => $badge['requirements'] ?? null,
                        'userStats' => $badge['userStats'] ?? null
                    ]);
                    
                    $stmt->execute([
                        $userId,
                        $badge['name'],
                        $badge['description'] ?? '',
                        $badge['earnedDate'] ?? date('Y-m-d H:i:s'),
                        $badge['type'] ?? 'achievement',
                        $badge['tier'] ?? null,
                        $badge['category'] ?? null,
                        $progressData
                    ]);
                    
                    // Award XP if badge has XP value
                    if (isset($badge['xp']) && $badge['xp'] > 0) {
                        $stmt = $conn->prepare("
                            UPDATE ss_user_statistics SET
                                total_experience_points = total_experience_points + ?,
                                updated_at = NOW()
                            WHERE user_id = ?
                        ");
                        $stmt->execute([$badge['xp'], $userId]);
                    }
                }
            }
        }
        
        // Store progress data in user statistics for future reference
        if (isset($input['progress']) && is_array($input['progress'])) {
            // Update badge-related statistics
            $stmt = $conn->prepare("
                UPDATE ss_user_statistics SET
                    badge_progress_data = ?,
                    updated_at = NOW()
                WHERE user_id = ?
            ");
            $stmt->execute([json_encode($input['progress']), $userId]);
            
            // If no row was updated, insert new statistics record
            if ($stmt->rowCount() === 0) {
                $stmt = $conn->prepare("
                    INSERT INTO ss_user_statistics (
                        statistics_id,
                        user_id,
                        badge_progress_data,
                        created_at,
                        updated_at
                    ) VALUES (UUID(), ?, ?, NOW(), NOW())
                ");
                $stmt->execute([$userId, json_encode($input['progress'])]);
            }
        }
        
        $conn->commit();
        
        // Get updated badge count
        $stmt = $conn->prepare("
            SELECT COUNT(*) as badge_count FROM ss_user_achievements
            WHERE user_id = ?
        ");
        $stmt->execute([$userId]);
        $badgeCount = $stmt->fetchColumn();
        
        Response::success([
            'badgeCount' => $badgeCount,
            'updated' => true
        ], 'Badge progress updated successfully');
        
    } catch (Exception $e) {
        $conn->rollBack();
        throw $e;
    }
    
} catch (Exception $e) {
    error_log("Update badge progress error: " . $e->getMessage());
    Response::serverError('Failed to update badge progress');
}