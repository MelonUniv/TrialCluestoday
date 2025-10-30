<?php
/**
 * Activity Model - Handles activity tracking, sessions, and progress
 */

require_once __DIR__ . '/../core/Database.php';

class Activity {
    private $db;
    private $conn;
    
    public function __construct() {
        $this->db = Database::getInstance();
        $this->conn = $this->db->getConnection();
        $this->conn->exec("USE trialcluestoday_restaurant_ms");
    }
    
    /**
     * Start a new activity session
     */
    public function startSession($userId, $contentId) {
        try {
            $this->conn->beginTransaction();
            
            // First, get content details
            $stmt = $this->conn->prepare("
                SELECT title, category, difficulty_level, content_data 
                FROM ss_contents 
                WHERE content_id = ?
            ");
            $stmt->execute([$contentId]);
            $content = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$content) {
                throw new Exception('Content not found');
            }
            
            // Create user session entry
            $sessionId = $this->generateUUID();
            $stmt = $this->conn->prepare("
                INSERT INTO ss_user_sessions (
                    session_id, user_id, started_at, device_type, ip_address, user_agent
                ) VALUES (?, ?, NOW(), ?, ?, ?)
            ");
            
            $deviceType = $this->detectDeviceType();
            $ipAddress = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
            $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';
            
            $stmt->execute([
                $sessionId, 
                $userId, 
                $deviceType, 
                $ipAddress, 
                $userAgent
            ]);
            
            // Create activity entry
            $activityId = $this->generateUUID();
            $stmt = $this->conn->prepare("
                INSERT INTO ss_user_activities (
                    activity_id, user_id, session_id, content_id, 
                    activity_type, started_at, status, progress_percentage,
                    difficulty_level
                ) VALUES (?, ?, ?, ?, ?, NOW(), 'in_progress', 0, ?)
            ");
            
            $stmt->execute([
                $activityId,
                $userId,
                $sessionId,
                $contentId,
                $content['category'],
                $content['difficulty_level']
            ]);
            
            $this->conn->commit();
            
            return [
                'success' => true,
                'session_id' => $sessionId,
                'activity_id' => $activityId,
                'content' => $content
            ];
            
        } catch (Exception $e) {
            $this->conn->rollBack();
            return [
                'success' => false,
                'message' => 'Failed to start session: ' . $e->getMessage()
            ];
        }
    }
    
    /**
     * Update activity progress
     */
    public function updateProgress($sessionId, $data) {
        try {
            // Get activity by session ID
            $stmt = $this->conn->prepare("
                SELECT activity_id, user_id FROM ss_user_activities 
                WHERE session_id = ? AND status = 'in_progress'
            ");
            $stmt->execute([$sessionId]);
            $activity = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$activity) {
                throw new Exception('Active session not found');
            }
            
            // Update progress
            $stmt = $this->conn->prepare("
                UPDATE ss_user_activities SET 
                    progress_percentage = ?,
                    current_score = ?,
                    interactions_count = ?,
                    time_spent_seconds = TIMESTAMPDIFF(SECOND, started_at, NOW()),
                    updated_at = NOW(),
                    checkpoint_data = ?
                WHERE activity_id = ?
            ");
            
            $checkpointData = json_encode($data['checkpoint'] ?? []);
            
            $stmt->execute([
                $data['progress'] ?? 0,
                $data['score'] ?? 0,
                $data['interactions'] ?? 0,
                $checkpointData,
                $activity['activity_id']
            ]);
            
            return [
                'success' => true,
                'message' => 'Progress updated successfully'
            ];
            
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Failed to update progress: ' . $e->getMessage()
            ];
        }
    }
    
    /**
     * Complete an activity session
     */
    public function completeSession($sessionId, $scoreData) {
        try {
            $this->conn->beginTransaction();
            
            // Get activity details
            $stmt = $this->conn->prepare("
                SELECT a.activity_id, a.user_id, a.content_id, a.activity_type, 
                       a.difficulty_level, a.started_at,
                       TIMESTAMPDIFF(SECOND, a.started_at, NOW()) as total_seconds
                FROM ss_user_activities a
                WHERE a.session_id = ? AND a.status = 'in_progress'
            ");
            $stmt->execute([$sessionId]);
            $activity = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$activity) {
                throw new Exception('Active session not found');
            }
            
            // Calculate experience points based on performance
            $experiencePoints = $this->calculateExperiencePoints(
                $scoreData['score'] ?? 0,
                $activity['difficulty_level'],
                $activity['total_seconds'],
                $scoreData['completion_rate'] ?? 100
            );
            
            // Update activity as completed
            $stmt = $this->conn->prepare("
                UPDATE ss_user_activities SET 
                    status = 'completed',
                    completed_at = NOW(),
                    time_spent_seconds = ?,
                    final_score = ?,
                    accuracy_percentage = ?,
                    progress_percentage = 100,
                    experience_points = ?,
                    completion_data = ?
                WHERE activity_id = ?
            ");
            
            $completionData = json_encode($scoreData);
            
            $stmt->execute([
                $activity['total_seconds'],
                $scoreData['score'] ?? 0,
                $scoreData['accuracy'] ?? 100,
                $experiencePoints,
                $completionData,
                $activity['activity_id']
            ]);
            
            // Update user session
            $stmt = $this->conn->prepare("
                UPDATE ss_user_sessions SET 
                    ended_at = NOW(),
                    duration_seconds = TIMESTAMPDIFF(SECOND, started_at, NOW())
                WHERE session_id = ?
            ");
            $stmt->execute([$sessionId]);
            
            // Update user statistics
            $this->updateUserStatistics($activity['user_id'], [
                'activity_type' => $activity['activity_type'],
                'experience_points' => $experiencePoints,
                'time_spent' => $activity['total_seconds'],
                'score' => $scoreData['score'] ?? 0
            ]);
            
            // Update daily metrics
            $this->updateDailyMetrics($activity['user_id']);
            
            // Check for achievements
            $achievements = $this->checkAchievements($activity['user_id'], $activity, $scoreData);
            
            $this->conn->commit();
            
            return [
                'success' => true,
                'experience_points' => $experiencePoints,
                'achievements' => $achievements,
                'session_summary' => [
                    'duration' => $activity['total_seconds'],
                    'score' => $scoreData['score'] ?? 0,
                    'accuracy' => $scoreData['accuracy'] ?? 100
                ]
            ];
            
        } catch (Exception $e) {
            $this->conn->rollBack();
            return [
                'success' => false,
                'message' => 'Failed to complete session: ' . $e->getMessage()
            ];
        }
    }
    
    /**
     * Get user activity history
     */
    public function getHistory($userId, $filters = []) {
        try {
            $whereClause = "WHERE a.user_id = ?";
            $params = [$userId];
            
            // Add filters
            if (isset($filters['activity_type'])) {
                $whereClause .= " AND a.activity_type = ?";
                $params[] = $filters['activity_type'];
            }
            
            if (isset($filters['date_from'])) {
                $whereClause .= " AND DATE(a.started_at) >= ?";
                $params[] = $filters['date_from'];
            }
            
            if (isset($filters['date_to'])) {
                $whereClause .= " AND DATE(a.started_at) <= ?";
                $params[] = $filters['date_to'];
            }
            
            if (isset($filters['status'])) {
                $whereClause .= " AND a.status = ?";
                $params[] = $filters['status'];
            }
            
            // Pagination
            $limit = $filters['limit'] ?? 20;
            $offset = ($filters['page'] ?? 1 - 1) * $limit;
            
            $stmt = $this->conn->prepare("
                SELECT 
                    a.activity_id,
                    a.activity_type,
                    a.started_at,
                    a.completed_at,
                    a.time_spent_seconds,
                    a.final_score,
                    a.accuracy_percentage,
                    a.difficulty_level,
                    a.experience_points,
                    a.status,
                    c.title as content_title,
                    c.category as content_category
                FROM ss_user_activities a
                LEFT JOIN ss_contents c ON a.content_id = c.content_id
                $whereClause
                ORDER BY a.started_at DESC
                LIMIT ? OFFSET ?
            ");
            
            $params[] = $limit;
            $params[] = $offset;
            
            $stmt->execute($params);
            $activities = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Get total count
            $countStmt = $this->conn->prepare("
                SELECT COUNT(*) as total
                FROM ss_user_activities a
                $whereClause
            ");
            $countStmt->execute(array_slice($params, 0, -2));
            $total = $countStmt->fetch(PDO::FETCH_ASSOC)['total'];
            
            return [
                'success' => true,
                'activities' => $activities,
                'pagination' => [
                    'total' => (int)$total,
                    'page' => $filters['page'] ?? 1,
                    'limit' => $limit,
                    'pages' => ceil($total / $limit)
                ]
            ];
            
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Failed to get history: ' . $e->getMessage()
            ];
        }
    }
    
    /**
     * Get user activity statistics
     */
    public function getStats($userId, $period = '30d') {
        try {
            $dateCondition = $this->getPeriodCondition($period);
            
            // Basic stats
            $stmt = $this->conn->prepare("
                SELECT 
                    COUNT(*) as total_activities,
                    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_activities,
                    SUM(time_spent_seconds) as total_time,
                    AVG(final_score) as average_score,
                    AVG(accuracy_percentage) as average_accuracy,
                    SUM(experience_points) as total_experience
                FROM ss_user_activities 
                WHERE user_id = ? AND $dateCondition
            ");
            $stmt->execute([$userId]);
            $basicStats = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Category breakdown
            $stmt = $this->conn->prepare("
                SELECT 
                    activity_type,
                    COUNT(*) as count,
                    SUM(time_spent_seconds) as time_spent,
                    AVG(final_score) as avg_score
                FROM ss_user_activities 
                WHERE user_id = ? AND $dateCondition AND status = 'completed'
                GROUP BY activity_type
            ");
            $stmt->execute([$userId]);
            $categoryStats = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Daily activity (last 7 days)
            $stmt = $this->conn->prepare("
                SELECT 
                    DATE(started_at) as date,
                    COUNT(*) as activities,
                    SUM(time_spent_seconds) as time_spent
                FROM ss_user_activities 
                WHERE user_id = ? AND started_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                GROUP BY DATE(started_at)
                ORDER BY date DESC
            ");
            $stmt->execute([$userId]);
            $dailyStats = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return [
                'success' => true,
                'stats' => [
                    'basic' => $basicStats,
                    'categories' => $categoryStats,
                    'daily' => $dailyStats,
                    'period' => $period
                ]
            ];
            
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Failed to get stats: ' . $e->getMessage()
            ];
        }
    }
    
    /**
     * Get current active sessions for user
     */
    public function getActiveSessions($userId) {
        try {
            $stmt = $this->conn->prepare("
                SELECT 
                    a.session_id,
                    a.activity_id,
                    a.activity_type,
                    a.started_at,
                    a.progress_percentage,
                    c.title as content_title
                FROM ss_user_activities a
                LEFT JOIN ss_contents c ON a.content_id = c.content_id
                WHERE a.user_id = ? AND a.status = 'in_progress'
                ORDER BY a.started_at DESC
            ");
            $stmt->execute([$userId]);
            $sessions = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return [
                'success' => true,
                'active_sessions' => $sessions
            ];
            
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Failed to get active sessions: ' . $e->getMessage()
            ];
        }
    }
    
    /**
     * Private helper methods
     */
    
    private function generateUUID() {
        $stmt = $this->conn->query("SELECT UUID() as uuid");
        return $stmt->fetch(PDO::FETCH_ASSOC)['uuid'];
    }
    
    private function detectDeviceType() {
        $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? '';
        
        if (preg_match('/mobile|android|iphone|ipad/i', $userAgent)) {
            return 'mobile';
        } elseif (preg_match('/tablet|ipad/i', $userAgent)) {
            return 'tablet';
        }
        return 'desktop';
    }
    
    private function calculateExperiencePoints($score, $difficulty, $timeSpent, $completionRate) {
        $basePoints = 100;
        $scoreMultiplier = min($score / 1000, 2.0); // Max 2x multiplier
        $difficultyMultiplier = [1 => 1.0, 2 => 1.2, 3 => 1.5, 4 => 1.8, 5 => 2.0][$difficulty] ?? 1.0;
        
        // Time bonus (faster completion gets bonus)
        $timeBonus = max(0, (300 - $timeSpent) / 300 * 50); // Up to 50 bonus points
        
        // Completion rate bonus
        $completionBonus = ($completionRate / 100) * 25;
        
        return round($basePoints * $scoreMultiplier * $difficultyMultiplier + $timeBonus + $completionBonus);
    }
    
    private function updateUserStatistics($userId, $data) {
        $stmt = $this->conn->prepare("
            INSERT INTO ss_user_statistics (
                user_id, 
                total_activities_completed,
                total_time_spent_seconds,
                total_points_earned,
                activities_this_week,
                created_at,
                updated_at
            ) VALUES (?, 1, ?, ?, 1, NOW(), NOW())
            ON DUPLICATE KEY UPDATE
                total_activities_completed = total_activities_completed + 1,
                total_time_spent_seconds = total_time_spent_seconds + VALUES(total_time_spent_seconds),
                total_points_earned = total_points_earned + VALUES(total_points_earned),
                activities_this_week = activities_this_week + 1,
                updated_at = NOW()
        ");
        
        $stmt->execute([
            $userId,
            $data['time_spent'],
            $data['experience_points']
        ]);
    }
    
    private function updateDailyMetrics($userId) {
        $stmt = $this->conn->prepare("
            INSERT INTO ss_daily_user_metrics (
                user_id,
                date,
                activities_completed,
                time_spent_minutes,
                points_earned,
                created_at
            ) VALUES (?, CURDATE(), 1, 0, 0, NOW())
            ON DUPLICATE KEY UPDATE
                activities_completed = activities_completed + 1,
                updated_at = NOW()
        ");
        
        $stmt->execute([$userId]);
    }
    
    private function checkAchievements($userId, $activity, $scoreData) {
        // Placeholder for achievement checking logic
        // This would check various conditions and award badges/achievements
        return [];
    }
    
    private function getPeriodCondition($period) {
        switch ($period) {
            case '7d':
                return "started_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
            case '30d':
                return "started_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
            case '90d':
                return "started_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)";
            case '1y':
                return "started_at >= DATE_SUB(NOW(), INTERVAL 1 YEAR)";
            default:
                return "started_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
        }
    }
}