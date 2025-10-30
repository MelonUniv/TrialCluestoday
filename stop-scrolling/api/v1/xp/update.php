<?php
/**
 * XP Update Endpoint
 * POST /api/v1/xp/update
 * Updates user's XP and combo progress
 */

require_once __DIR__ . '/../../../lib/core/api_response.php';
require_once __DIR__ . '/../../../lib/core/auth_middleware.php';
require_once __DIR__ . '/../../../lib/core/Database.php';

header('Content-Type: application/json');

// Handle preflight CORS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}

// Verify POST method
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    apiResponse(false, 'Method not allowed', null, 405);
}

try {
    // Get authenticated user
    $user = authenticateUser();
    if (!$user) {
        apiResponse(false, 'Authentication required', null, 401);
    }

    // Get request body
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) {
        apiResponse(false, 'Invalid request data', null, 400);
    }

    $db = Database::getInstance();
    $conn = $db->getConnection();
    $conn->exec("USE trialcluestoday_restaurant_ms");

    // Extract XP data
    $xpData = $input['xp'] ?? [];
    $comboData = $input['combo'] ?? [];
    
    $totalXP = isset($xpData['total']) ? (int)$xpData['total'] : 0;
    $level = isset($xpData['level']) ? (int)$xpData['level'] : 1;
    $sessionXP = isset($xpData['sessionXP']) ? (int)$xpData['sessionXP'] : 0;
    
    // Begin transaction
    $conn->beginTransaction();
    
    try {
        // Update user statistics
        $stmt = $conn->prepare("
            UPDATE ss_user_statistics 
            SET 
                total_points = ?,
                current_level = ?,
                updated_at = NOW()
            WHERE user_id = ?
        ");
        
        $stmt->execute([$totalXP, $level, $user['user_id']]);
        
        // If no rows were updated, create new statistics record
        if ($stmt->rowCount() === 0) {
            $stmt = $conn->prepare("
                INSERT INTO ss_user_statistics 
                (user_id, total_points, current_level, total_activities_completed, 
                 average_score, total_time_spent_seconds, longest_session_seconds, 
                 created_at, updated_at)
                VALUES (?, ?, ?, 0, 0, 0, 0, NOW(), NOW())
            ");
            $stmt->execute([$user['user_id'], $totalXP, $level]);
        }
        
        // Save combo data if provided
        if (!empty($comboData)) {
            $current = $comboData['current'] ?? [];
            
            if (isset($current['isActive']) && $current['isActive'] && isset($current['count']) && $current['count'] > 0) {
                // Create combo record
                $stmt = $conn->prepare("
                    INSERT INTO ss_user_combos 
                    (user_id, combo_count, multiplier, xp_earned, started_at, created_at)
                    VALUES (?, ?, ?, ?, NOW(), NOW())
                    ON DUPLICATE KEY UPDATE
                    combo_count = VALUES(combo_count),
                    multiplier = VALUES(multiplier),
                    xp_earned = VALUES(xp_earned),
                    updated_at = NOW()
                ");
                
                $comboCount = $current['count'] ?? 0;
                $multiplier = $current['multiplier'] ?? 1.0;
                $xpEarned = $current['xpEarned'] ?? 0;
                
                $stmt->execute([$user['user_id'], $comboCount, $multiplier, $xpEarned]);
            }
        }
        
        // Check if category XP data is provided
        if (isset($xpData['categoryXP']) && is_array($xpData['categoryXP'])) {
            foreach ($xpData['categoryXP'] as $category => $categoryXP) {
                if ($categoryXP > 0) {
                    // Update category-specific statistics
                    $stmt = $conn->prepare("
                        INSERT INTO ss_category_statistics 
                        (user_id, category, total_xp, created_at, updated_at)
                        VALUES (?, ?, ?, NOW(), NOW())
                        ON DUPLICATE KEY UPDATE
                        total_xp = VALUES(total_xp),
                        updated_at = NOW()
                    ");
                    
                    $stmt->execute([$user['user_id'], $category, $categoryXP]);
                }
            }
        }
        
        // Update daily metrics
        $stmt = $conn->prepare("
            INSERT INTO ss_daily_user_metrics 
            (user_id, date, activities_completed, total_time_seconds, 
             average_score, points_earned, created_at)
            VALUES (?, CURDATE(), 0, 0, 0, ?, NOW())
            ON DUPLICATE KEY UPDATE
            points_earned = points_earned + VALUES(points_earned),
            updated_at = NOW()
        ");
        
        $stmt->execute([$user['user_id'], $sessionXP]);
        
        $conn->commit();
        
        apiResponse(true, 'XP updated successfully', [
            'total_xp' => $totalXP,
            'level' => $level,
            'session_xp' => $sessionXP
        ]);
        
    } catch (Exception $e) {
        $conn->rollBack();
        throw $e;
    }
    
} catch (Exception $e) {
    error_log("XP update error: " . $e->getMessage());
    apiResponse(false, 'Failed to update XP', null, 500);
}