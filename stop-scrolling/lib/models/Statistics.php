<?php
/**
 * Statistics Model - Handles user statistics and dashboard data
 */

require_once __DIR__ . '/../core/Database.php';

class Statistics {
    private $db;
    private $conn;
    
    public function __construct() {
        $this->db = Database::getInstance();
        $this->conn = $this->db->getConnection();
        $this->conn->exec("USE trialcluestoday_restaurant_ms");
    }
    
    /**
     * Get overview statistics for dashboard
     */
    public function getOverview($userId) {
        try {
            // Basic user stats
            $stmt = $this->conn->prepare("
                SELECT 
                    total_activities_completed,
                    total_time_spent_seconds,
                    total_points_earned,
                    level,
                    experience_points,
                    activities_this_week,
                    best_streak
                FROM ss_user_statistics 
                WHERE user_id = ?
            ");
            $stmt->execute([$userId]);
            $userStats = $stmt->fetch(PDO::FETCH_ASSOC) ?: [
                'total_activities_completed' => 0,
                'total_time_spent_seconds' => 0,
                'total_points_earned' => 0,
                'level' => 1,
                'experience_points' => 0,
                'activities_this_week' => 0,
                'best_streak' => 0
            ];
            
            // Current streak
            $stmt = $this->conn->prepare("
                SELECT current_streak_days, last_activity_date
                FROM ss_user_streaks 
                WHERE user_id = ?
            ");
            $stmt->execute([$userId]);
            $streakData = $stmt->fetch(PDO::FETCH_ASSOC) ?: [
                'current_streak_days' => 0,
                'last_activity_date' => null
            ];
            
            // Today's activities
            $stmt = $this->conn->prepare("
                SELECT COUNT(*) as activities_today
                FROM ss_user_activities 
                WHERE user_id = ? AND DATE(started_at) = CURDATE() AND status = 'completed'
            ");
            $stmt->execute([$userId]);
            $todayStats = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Level progress
            $currentLevel = $userStats['level'];
            $currentXP = $userStats['experience_points'];
            $xpForCurrentLevel = $this->getXPForLevel($currentLevel);
            $xpForNextLevel = $this->getXPForLevel($currentLevel + 1);
            $levelProgress = $xpForNextLevel > $xpForCurrentLevel ? 
                (($currentXP - $xpForCurrentLevel) / ($xpForNextLevel - $xpForCurrentLevel)) * 100 : 100;
            
            // Rank calculation
            $stmt = $this->conn->prepare("
                SELECT COUNT(*) + 1 as user_rank
                FROM ss_user_statistics 
                WHERE total_points_earned > (
                    SELECT total_points_earned 
                    FROM ss_user_statistics 
                    WHERE user_id = ?
                )
            ");
            $stmt->execute([$userId]);
            $rankData = $stmt->fetch(PDO::FETCH_ASSOC);
            
            return [
                'success' => true,
                'data' => [
                    'total_activities' => (int)$userStats['total_activities_completed'],
                    'total_time_hours' => round($userStats['total_time_spent_seconds'] / 3600, 1),
                    'total_points' => (int)$userStats['total_points_earned'],
                    'current_level' => (int)$userStats['level'],
                    'experience_points' => (int)$userStats['experience_points'],
                    'level_progress' => round($levelProgress, 1),
                    'xp_to_next_level' => max(0, $xpForNextLevel - $currentXP),
                    'current_streak' => (int)$streakData['current_streak_days'],
                    'best_streak' => (int)$userStats['best_streak'],
                    'activities_today' => (int)$todayStats['activities_today'],
                    'activities_this_week' => (int)$userStats['activities_this_week'],
                    'user_rank' => (int)$rankData['user_rank'],
                    'last_activity_date' => $streakData['last_activity_date']
                ]
            ];
            
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Failed to get overview: ' . $e->getMessage()
            ];
        }
    }
    
    /**
     * Get detailed statistics with breakdowns
     */
    public function getDetailed($userId, $period = '30d') {
        try {
            $dateCondition = $this->getPeriodCondition($period);
            
            // Activity breakdown by category
            $stmt = $this->conn->prepare("
                SELECT 
                    activity_type,
                    COUNT(*) as count,
                    SUM(time_spent_seconds) as total_time,
                    AVG(final_score) as avg_score,
                    AVG(accuracy_percentage) as avg_accuracy,
                    SUM(experience_points) as total_xp
                FROM ss_user_activities 
                WHERE user_id = ? AND $dateCondition AND status = 'completed'
                GROUP BY activity_type
                ORDER BY count DESC
            ");
            $stmt->execute([$userId]);
            $categoryBreakdown = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Performance trends (last 30 days)
            $stmt = $this->conn->prepare("
                SELECT 
                    DATE(started_at) as date,
                    COUNT(*) as activities,
                    SUM(time_spent_seconds) as time_spent,
                    AVG(final_score) as avg_score,
                    SUM(experience_points) as total_xp
                FROM ss_user_activities 
                WHERE user_id = ? AND started_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) 
                      AND status = 'completed'
                GROUP BY DATE(started_at)
                ORDER BY date DESC
                LIMIT 30
            ");
            $stmt->execute([$userId]);
            $performanceTrends = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Best performances by category
            $stmt = $this->conn->prepare("
                SELECT 
                    activity_type,
                    MAX(final_score) as best_score,
                    MIN(time_spent_seconds) as fastest_time,
                    MAX(accuracy_percentage) as best_accuracy
                FROM ss_user_activities 
                WHERE user_id = ? AND status = 'completed'
                GROUP BY activity_type
            ");
            $stmt->execute([$userId]);
            $bestPerformances = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Weekly comparison
            $stmt = $this->conn->prepare("
                SELECT 
                    YEARWEEK(started_at) as week,
                    COUNT(*) as activities,
                    SUM(time_spent_seconds) as time_spent,
                    AVG(final_score) as avg_score
                FROM ss_user_activities 
                WHERE user_id = ? AND started_at >= DATE_SUB(NOW(), INTERVAL 8 WEEK)
                      AND status = 'completed'
                GROUP BY YEARWEEK(started_at)
                ORDER BY week DESC
                LIMIT 8
            ");
            $stmt->execute([$userId]);
            $weeklyTrends = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return [
                'success' => true,
                'data' => [
                    'category_breakdown' => $categoryBreakdown,
                    'performance_trends' => $performanceTrends,
                    'best_performances' => $bestPerformances,
                    'weekly_trends' => $weeklyTrends,
                    'period' => $period
                ]
            ];
            
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Failed to get detailed stats: ' . $e->getMessage()
            ];
        }
    }
    
    /**
     * Get chart data for dashboard visualizations
     */
    public function getChartData($userId, $chartType = 'activity_over_time') {
        try {
            switch ($chartType) {
                case 'activity_over_time':
                    return $this->getActivityOverTimeChart($userId);
                    
                case 'score_progression':
                    return $this->getScoreProgressionChart($userId);
                    
                case 'category_distribution':
                    return $this->getCategoryDistributionChart($userId);
                    
                case 'weekly_heatmap':
                    return $this->getWeeklyHeatmapChart($userId);
                    
                case 'skill_radar':
                    return $this->getSkillRadarChart($userId);
                    
                default:
                    throw new Exception('Unknown chart type');
            }
            
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Failed to get chart data: ' . $e->getMessage()
            ];
        }
    }
    
    /**
     * Get insights and recommendations
     */
    public function getInsights($userId) {
        try {
            $insights = [];
            
            // Get user's activity patterns
            $stmt = $this->conn->prepare("
                SELECT 
                    activity_type,
                    COUNT(*) as count,
                    AVG(final_score) as avg_score,
                    AVG(accuracy_percentage) as avg_accuracy,
                    SUM(time_spent_seconds) as total_time
                FROM ss_user_activities 
                WHERE user_id = ? AND status = 'completed' 
                      AND started_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                GROUP BY activity_type
            ");
            $stmt->execute([$userId]);
            $patterns = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            if (empty($patterns)) {
                return [
                    'success' => true,
                    'data' => [
                        'insights' => ['Welcome! Complete some activities to see insights here.'],
                        'recommendations' => []
                    ]
                ];
            }
            
            // Find strongest category
            $strongest = array_reduce($patterns, function($carry, $item) {
                return (!$carry || $item['avg_score'] > $carry['avg_score']) ? $item : $carry;
            });
            
            if ($strongest) {
                $insights[] = "🎯 Your strongest category is " . ucfirst(str_replace('_', ' ', $strongest['activity_type'])) . 
                             " with an average score of " . round($strongest['avg_score']) . " points.";
            }
            
            // Find area for improvement
            $weakest = array_reduce($patterns, function($carry, $item) {
                return (!$carry || $item['avg_score'] < $carry['avg_score']) ? $item : $carry;
            });
            
            if ($weakest && count($patterns) > 1) {
                $insights[] = "📈 You could improve in " . ucfirst(str_replace('_', ' ', $weakest['activity_type'])) . 
                             " activities. Practice makes perfect!";
            }
            
            // Check activity frequency
            $totalActivities = array_sum(array_column($patterns, 'count'));
            if ($totalActivities > 15) {
                $insights[] = "🔥 You've been very active this month with $totalActivities completed activities!";
            } elseif ($totalActivities < 5) {
                $insights[] = "⏰ Try to be more consistent - aim for at least one activity per day.";
            }
            
            // Time analysis
            $totalTime = array_sum(array_column($patterns, 'total_time'));
            $avgTimePerActivity = $totalTime / $totalActivities;
            
            if ($avgTimePerActivity > 300) { // 5+ minutes
                $insights[] = "🎯 You take your time with activities, which often leads to better results!";
            } elseif ($avgTimePerActivity < 120) { // Less than 2 minutes
                $insights[] = "⚡ You complete activities quickly - consider slowing down for better accuracy.";
            }
            
            // Generate recommendations
            $recommendations = $this->generateRecommendations($userId, $patterns);
            
            return [
                'success' => true,
                'data' => [
                    'insights' => $insights,
                    'recommendations' => $recommendations
                ]
            ];
            
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Failed to get insights: ' . $e->getMessage()
            ];
        }
    }
    
    /**
     * Private helper methods
     */
    
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
    
    private function getXPForLevel($level) {
        // XP required for each level (exponential growth)
        return ($level - 1) * 1000 + (($level - 1) * ($level - 1)) * 100;
    }
    
    private function getActivityOverTimeChart($userId) {
        $stmt = $this->conn->prepare("
            SELECT 
                DATE(started_at) as date,
                COUNT(*) as count
            FROM ss_user_activities 
            WHERE user_id = ? AND started_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                  AND status = 'completed'
            GROUP BY DATE(started_at)
            ORDER BY date ASC
        ");
        $stmt->execute([$userId]);
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        return [
            'success' => true,
            'data' => [
                'type' => 'line',
                'labels' => array_column($data, 'date'),
                'datasets' => [
                    [
                        'label' => 'Activities Completed',
                        'data' => array_column($data, 'count'),
                        'borderColor' => '#667eea',
                        'backgroundColor' => 'rgba(102, 126, 234, 0.1)'
                    ]
                ]
            ]
        ];
    }
    
    private function getScoreProgressionChart($userId) {
        $stmt = $this->conn->prepare("
            SELECT 
                DATE(started_at) as date,
                AVG(final_score) as avg_score
            FROM ss_user_activities 
            WHERE user_id = ? AND started_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                  AND status = 'completed' AND final_score IS NOT NULL
            GROUP BY DATE(started_at)
            ORDER BY date ASC
        ");
        $stmt->execute([$userId]);
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        return [
            'success' => true,
            'data' => [
                'type' => 'line',
                'labels' => array_column($data, 'date'),
                'datasets' => [
                    [
                        'label' => 'Average Score',
                        'data' => array_map(function($item) {
                            return round($item['avg_score'], 1);
                        }, $data),
                        'borderColor' => '#48bb78',
                        'backgroundColor' => 'rgba(72, 187, 120, 0.1)'
                    ]
                ]
            ]
        ];
    }
    
    private function getCategoryDistributionChart($userId) {
        $stmt = $this->conn->prepare("
            SELECT 
                activity_type,
                COUNT(*) as count
            FROM ss_user_activities 
            WHERE user_id = ? AND status = 'completed'
            GROUP BY activity_type
        ");
        $stmt->execute([$userId]);
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        return [
            'success' => true,
            'data' => [
                'type' => 'pie',
                'labels' => array_map(function($item) {
                    return ucfirst(str_replace('_', ' ', $item['activity_type']));
                }, $data),
                'datasets' => [
                    [
                        'data' => array_column($data, 'count'),
                        'backgroundColor' => [
                            '#667eea', '#48bb78', '#ed8936', '#9f7aea',
                            '#38b2ac', '#f56565', '#38a169', '#d69e2e'
                        ]
                    ]
                ]
            ]
        ];
    }
    
    private function getWeeklyHeatmapChart($userId) {
        // Implementation for weekly heatmap would go here
        return [
            'success' => true,
            'data' => [
                'type' => 'matrix',
                'message' => 'Heatmap data not implemented yet'
            ]
        ];
    }
    
    private function getSkillRadarChart($userId) {
        $stmt = $this->conn->prepare("
            SELECT 
                activity_type,
                AVG(accuracy_percentage) as avg_accuracy
            FROM ss_user_activities 
            WHERE user_id = ? AND status = 'completed' AND accuracy_percentage IS NOT NULL
            GROUP BY activity_type
        ");
        $stmt->execute([$userId]);
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        return [
            'success' => true,
            'data' => [
                'type' => 'radar',
                'labels' => array_map(function($item) {
                    return ucfirst(str_replace('_', ' ', $item['activity_type']));
                }, $data),
                'datasets' => [
                    [
                        'label' => 'Skill Level (%)',
                        'data' => array_map(function($item) {
                            return round($item['avg_accuracy'], 1);
                        }, $data),
                        'backgroundColor' => 'rgba(102, 126, 234, 0.2)',
                        'borderColor' => '#667eea'
                    ]
                ]
            ]
        ];
    }
    
    private function generateRecommendations($userId, $patterns) {
        $recommendations = [];
        
        // Get user interests for personalized recommendations
        $stmt = $this->conn->prepare("
            SELECT * FROM ss_user_interests WHERE user_id = ?
        ");
        $stmt->execute([$userId]);
        $interests = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Recommend based on performance patterns
        foreach ($patterns as $pattern) {
            if ($pattern['avg_accuracy'] < 70) {
                $activity = ucfirst(str_replace('_', ' ', $pattern['activity_type']));
                $recommendations[] = [
                    'type' => 'improvement',
                    'title' => "Practice $activity",
                    'description' => "Your accuracy in $activity is below 70%. Try some easier difficulty levels first.",
                    'action' => 'practice',
                    'category' => $pattern['activity_type']
                ];
            }
        }
        
        // Recommend new activities based on interests
        if ($interests) {
            if ($interests['memory_games'] && !$this->hasRecentActivity($userId, 'memory_game')) {
                $recommendations[] = [
                    'type' => 'new_activity',
                    'title' => 'Try Memory Games',
                    'description' => 'Based on your interests, you might enjoy our memory challenges.',
                    'action' => 'explore',
                    'category' => 'memory_game'
                ];
            }
        }
        
        return $recommendations;
    }
    
    private function hasRecentActivity($userId, $activityType) {
        $stmt = $this->conn->prepare("
            SELECT COUNT(*) as count
            FROM ss_user_activities 
            WHERE user_id = ? AND activity_type = ? 
                  AND started_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        ");
        $stmt->execute([$userId, $activityType]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result['count'] > 0;
    }
}