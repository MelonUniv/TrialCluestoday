<?php
require_once __DIR__ . '/../../../lib/core/api_response.php';
require_once __DIR__ . '/../../../lib/core/auth_middleware.php';
require_once __DIR__ . '/../../../lib/core/Database.php';

header('Content-Type: application/json');

// Handle preflight CORS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}

// Only allow POST requests
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
    
    if (!isset($input['achievement_type']) || !isset($input['progress'])) {
        apiResponse(false, 'achievement_type and progress are required', null, 400);
    }

    $db = Database::getInstance();
    $conn = $db->getConnection();
    $conn->exec("USE trialcluestoday_restaurant_ms");

    $achievement_type = $input['achievement_type'];
    $progress = (int)$input['progress'];
    $level = $input['level'] ?? 1;

    // Find matching badge
    $stmt = $conn->prepare("
        SELECT badge_id, name, points, requirements 
        FROM ss_badges 
        WHERE category = ? AND level = ?
        LIMIT 1
    ");
    $stmt->execute([$achievement_type, $level]);
    $badge = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$badge) {
        apiResponse(false, 'Badge not found for achievement type', null, 404);
    }

    // Update or create user achievement
    $stmt = $conn->prepare("
        INSERT INTO ss_user_achievements (user_id, achievement_id, progress, level, created_at, updated_at)
        VALUES (?, ?, ?, ?, NOW(), NOW())
        ON DUPLICATE KEY UPDATE 
            progress = GREATEST(progress, VALUES(progress)),
            updated_at = NOW()
    ");
    
    $stmt->execute([$user['user_id'], $badge['badge_id'], $progress, $level]);

    // Check if achievement is completed based on requirements
    $requirements = json_decode($badge['requirements'], true);
    $target = $requirements['target'] ?? 100;
    
    $completed = $progress >= $target;
    
    if ($completed) {
        // Mark as completed if not already
        $stmt = $conn->prepare("
            UPDATE ss_user_achievements 
            SET completed_at = COALESCE(completed_at, NOW()),
                updated_at = NOW()
            WHERE user_id = ? AND achievement_id = ? AND completed_at IS NULL
        ");
        $stmt->execute([$user['user_id'], $badge['badge_id']]);
        
        if ($stmt->rowCount() > 0) {
            // New completion - award points
            $stmt = $conn->prepare("
                UPDATE ss_user_statistics 
                SET total_points = total_points + ?,
                    updated_at = NOW()
                WHERE user_id = ?
            ");
            $stmt->execute([$badge['points'], $user['user_id']]);
        }
    }

    $response = [
        'achievement_updated' => true,
        'progress' => $progress,
        'completed' => $completed,
        'badge' => $badge
    ];

    apiResponse(true, 'Achievement updated successfully', $response);

} catch (Exception $e) {
    error_log("Achievement update error: " . $e->getMessage());
    apiResponse(false, 'Failed to update achievement', null, 500);
}