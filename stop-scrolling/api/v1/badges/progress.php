<?php
/**
 * Get Badge Progress API Endpoint
 * GET /api/v1/badges/progress
 * 
 * Returns user's badge progress and earned badges
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
    
    // Get earned badges
    $stmt = $conn->prepare("
        SELECT 
            ua.achievement_id,
            ua.badge_name,
            ua.badge_description,
            ua.earned_date,
            ua.achievement_type,
            ua.badge_tier,
            ua.category,
            ua.progress_data
        FROM ss_user_achievements ua
        WHERE ua.user_id = ?
        ORDER BY ua.earned_date DESC
    ");
    $stmt->execute([$userId]);
    $earnedBadges = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get user activity statistics for progress calculation
    $stmt = $conn->prepare("
        SELECT 
            content.category,
            COUNT(*) as activity_count,
            AVG(ua.accuracy_score) as avg_accuracy,
            SUM(ua.duration_seconds) as total_time,
            MAX(ua.accuracy_score) as best_accuracy,
            MIN(ua.completed_at) as first_activity,
            MAX(ua.completed_at) as last_activity
        FROM ss_user_activities ua
        JOIN ss_contents content ON ua.content_id = content.content_id
        WHERE ua.user_id = ? AND ua.completion_status = 'completed'
        GROUP BY content.category
    ");
    $stmt->execute([$userId]);
    $categoryStats = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get perfect streaks data
    $stmt = $conn->prepare("
        SELECT 
            content.category,
            ua.accuracy_score,
            ua.completed_at
        FROM ss_user_activities ua
        JOIN ss_contents content ON ua.content_id = content.content_id
        WHERE ua.user_id = ? AND ua.completion_status = 'completed'
        ORDER BY ua.completed_at ASC
    ");
    $stmt->execute([$userId]);
    $allActivities = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Calculate progress for each category
    $progress = [];
    foreach ($categoryStats as $stats) {
        $category = $stats['category'];
        $firstTime = strtotime($stats['first_activity']);
        $lastTime = strtotime($stats['last_activity']);
        
        // Calculate perfect streaks for this category
        $perfectStreaks = [];
        $currentStreak = 0;
        $categoryActivities = array_filter($allActivities, function($activity) use ($category) {
            return $activity['category'] === $category;
        });
        
        foreach ($categoryActivities as $activity) {
            if ($activity['accuracy_score'] >= 1.0) {
                $currentStreak++;
            } else {
                if ($currentStreak > 0) {
                    $perfectStreaks[] = [
                        'length' => $currentStreak,
                        'endDate' => $activity['completed_at']
                    ];
                    $currentStreak = 0;
                }
            }
        }
        
        // Calculate speed records (simplified)
        $avgDuration = $stats['total_time'] / $stats['activity_count'];
        $speedRecords = [];
        
        // This would need more sophisticated tracking in a real implementation
        foreach ($categoryActivities as $activity) {
            // Simulate speed record detection
            if (rand(0, 10) < 2) { // ~20% chance for demo
                $speedRecords[] = [
                    'improvement' => 0.5 + (rand(0, 30) / 100),
                    'date' => $activity['completed_at']
                ];
            }
        }
        
        $progress[$category] = [
            'activities' => intval($stats['activity_count']),
            'totalAccuracy' => floatval($stats['avg_accuracy']) * intval($stats['activity_count']),
            'totalTime' => intval($stats['total_time']),
            'firstActivity' => $firstTime * 1000, // Convert to JS timestamp
            'lastActivity' => $lastTime * 1000,
            'bestAccuracy' => floatval($stats['best_accuracy']),
            'perfectStreaks' => $perfectStreaks,
            'currentPerfectStreak' => $currentStreak,
            'speedRecords' => $speedRecords
        ];
    }
    
    // Format earned badges
    $formattedBadges = array_map(function($badge) {
        $progressData = json_decode($badge['progress_data'] ?? '{}', true);
        
        return [
            'id' => $badge['achievement_id'],
            'name' => $badge['badge_name'],
            'description' => $badge['badge_description'],
            'earnedDate' => $badge['earned_date'],
            'type' => $badge['achievement_type'],
            'tier' => $badge['badge_tier'],
            'category' => $badge['category'],
            'icon' => $progressData['icon'] ?? '🏆',
            'color' => $progressData['color'] ?? '#667eea'
        ];
    }, $earnedBadges);
    
    $response = [
        'progress' => $progress,
        'earned' => $formattedBadges
    ];
    
    Response::success($response, 'Badge progress retrieved successfully');
    
} catch (Exception $e) {
    error_log("Get badge progress error: " . $e->getMessage());
    Response::serverError('Failed to retrieve badge progress');
}