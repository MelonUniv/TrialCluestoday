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

try {
    // Get authenticated user
    $user = authenticateUser();
    if (!$user) {
        apiResponse(false, 'Authentication required', null, 401);
    }

    $db = Database::getInstance();
    $conn = $db->getConnection();
    $conn->exec("USE trialcluestoday_restaurant_ms");

    // Get user achievements progress
    $stmt = $conn->prepare("
        SELECT 
            ua.achievement_id,
            ua.progress,
            ua.completed_at,
            ua.level,
            b.name,
            b.description,
            b.icon,
            b.points,
            b.category
        FROM ss_user_achievements ua
        JOIN ss_badges b ON ua.achievement_id = b.badge_id
        WHERE ua.user_id = ?
        ORDER BY ua.completed_at DESC, ua.progress DESC
    ");
    
    $stmt->execute([$user['user_id']]);
    $achievements = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Get total points
    $stmt = $conn->prepare("
        SELECT 
            COALESCE(SUM(b.points), 0) as total_points,
            COUNT(*) as total_achievements
        FROM ss_user_achievements ua
        JOIN ss_badges b ON ua.achievement_id = b.badge_id
        WHERE ua.user_id = ? AND ua.completed_at IS NOT NULL
    ");
    
    $stmt->execute([$user['user_id']]);
    $totals = $stmt->fetch(PDO::FETCH_ASSOC);

    $response = [
        'achievements' => $achievements,
        'totals' => [
            'total_points' => (int)$totals['total_points'],
            'total_achievements' => (int)$totals['total_achievements']
        ]
    ];

    apiResponse(true, 'Achievement progress retrieved', $response);

} catch (Exception $e) {
    error_log("Achievement progress error: " . $e->getMessage());
    apiResponse(false, 'Failed to retrieve achievement progress', null, 500);
}