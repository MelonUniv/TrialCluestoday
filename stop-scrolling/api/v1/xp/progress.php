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

    // Get user XP and level information
    $stmt = $conn->prepare("
        SELECT 
            total_points as total_xp,
            current_level,
            total_activities_completed,
            average_score,
            total_time_spent_seconds,
            longest_session_seconds,
            updated_at
        FROM ss_user_statistics 
        WHERE user_id = ?
    ");
    
    $stmt->execute([$user['user_id']]);
    $stats = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$stats) {
        // Create default stats if none exist
        $stmt = $conn->prepare("
            INSERT INTO ss_user_statistics 
            (user_id, total_points, current_level, total_activities_completed, 
             average_score, total_time_spent_seconds, longest_session_seconds, created_at, updated_at)
            VALUES (?, 0, 1, 0, 0, 0, 0, NOW(), NOW())
        ");
        $stmt->execute([$user['user_id']]);
        
        $stats = [
            'total_xp' => 0,
            'current_level' => 1,
            'total_activities_completed' => 0,
            'average_score' => 0,
            'total_time_spent_seconds' => 0,
            'longest_session_seconds' => 0,
            'updated_at' => date('Y-m-d H:i:s')
        ];
    }

    // Calculate level progression
    $current_level = (int)$stats['current_level'];
    $total_xp = (int)$stats['total_xp'];
    
    // XP required for each level (exponential growth)
    $xp_for_current_level = $current_level > 1 ? ($current_level - 1) * 100 * pow(1.2, $current_level - 2) : 0;
    $xp_for_next_level = $current_level * 100 * pow(1.2, $current_level - 1);
    
    $xp_in_current_level = $total_xp - $xp_for_current_level;
    $xp_needed_for_next = $xp_for_next_level - $xp_for_current_level;
    
    $level_progress = $xp_needed_for_next > 0 ? ($xp_in_current_level / $xp_needed_for_next) * 100 : 100;

    // Get recent XP gains (last 7 days)
    $stmt = $conn->prepare("
        SELECT 
            DATE(ua.created_at) as date,
            SUM(CASE 
                WHEN c.category = 'memory_game' THEN 10
                WHEN c.category = 'puzzle' THEN 15  
                WHEN c.category = 'trivia' THEN 12
                WHEN c.category = 'meditation' THEN 8
                ELSE 5
            END) as daily_xp
        FROM ss_user_activities ua
        JOIN ss_contents c ON ua.content_id = c.content_id
        WHERE ua.user_id = ? 
        AND ua.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        AND ua.completed = 1
        GROUP BY DATE(ua.created_at)
        ORDER BY date DESC
    ");
    
    $stmt->execute([$user['user_id']]);
    $recent_xp = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $response = [
        'total_xp' => $total_xp,
        'current_level' => $current_level,
        'level_progress' => round($level_progress, 2),
        'xp_for_next_level' => (int)$xp_for_next_level,
        'xp_in_current_level' => (int)$xp_in_current_level,
        'xp_needed_for_next' => (int)($xp_for_next_level - $total_xp),
        'activities_completed' => (int)$stats['total_activities_completed'],
        'average_score' => (float)$stats['average_score'],
        'total_time_hours' => round($stats['total_time_spent_seconds'] / 3600, 2),
        'recent_xp_gains' => $recent_xp
    ];

    apiResponse(true, 'XP progress retrieved', $response);

} catch (Exception $e) {
    error_log("XP progress error: " . $e->getMessage());
    apiResponse(false, 'Failed to retrieve XP progress', null, 500);
}