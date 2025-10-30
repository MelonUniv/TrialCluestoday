<?php
/**
 * PerformanceTracker Model
 * Tracks and analyzes user performance across activities
 * Monitors cognitive load, fatigue patterns, and performance trends
 */

require_once __DIR__ . '/../core/Database.php';

class PerformanceTracker {
    private $db;
    private $conn;
    
    // Performance thresholds
    const EXCELLENT_THRESHOLD = 0.85;
    const GOOD_THRESHOLD = 0.70;
    const STRUGGLING_THRESHOLD = 0.50;
    
    // Fatigue indicators
    const FATIGUE_ERROR_INCREASE = 0.20; // 20% increase in errors
    const FATIGUE_SPEED_DECREASE = 0.30; // 30% decrease in speed
    const FATIGUE_ABANDON_RATE = 0.25; // 25% activities abandoned
    
    public function __construct() {
        $this->db = Database::getInstance();
        $this->conn = $this->db->getConnection();
        $this->conn->exec("USE trialcluestoday_restaurant_ms");
    }
    
    /**
     * Track activity performance
     */
    public function trackPerformance($userId, $sessionId, $activityData) {
        try {
            // Calculate performance metrics
            $metrics = $this->calculateMetrics($activityData);
            
            // Store performance record
            $stmt = $this->conn->prepare("
                INSERT INTO ss_session_performance (
                    performance_id,
                    session_flow_id,
                    user_id,
                    activity_index,
                    content_id,
                    category,
                    difficulty_level,
                    target_difficulty,
                    score,
                    accuracy,
                    speed,
                    cognitive_load,
                    fatigue_level,
                    started_at,
                    completed_at,
                    duration_seconds,
                    skipped
                ) VALUES (
                    UUID(),
                    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                    ?, ?, ?, ?
                )
            ");
            
            $stmt->execute([
                $sessionId,
                $userId,
                $activityData['activity_index'] ?? 0,
                $activityData['content_id'],
                $activityData['category'],
                $activityData['difficulty_level'],
                $activityData['target_difficulty'] ?? $activityData['difficulty_level'],
                $metrics['score'],
                $metrics['accuracy'],
                $metrics['speed'],
                $metrics['cognitive_load'],
                $metrics['fatigue_level'],
                $activityData['started_at'] ?? date('Y-m-d H:i:s'),
                $activityData['completed_at'] ?? date('Y-m-d H:i:s'),
                $activityData['duration_seconds'] ?? 0,
                $activityData['skipped'] ?? false
            ]);
            
            // Update user statistics
            $this->updateUserStatistics($userId, $metrics);
            
            // Check for fatigue patterns
            $fatigueAnalysis = $this->analyzeFatigue($userId, $sessionId);
            
            // Update session performance data
            $this->updateSessionPerformance($sessionId, $metrics, $fatigueAnalysis);
            
            return [
                'success' => true,
                'metrics' => $metrics,
                'fatigue' => $fatigueAnalysis
            ];
            
        } catch (Exception $e) {
            error_log("Performance tracking error: " . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Calculate performance metrics
     */
    private function calculateMetrics($activityData) {
        // Base metrics
        $score = $activityData['score'] ?? 0;
        $maxScore = $activityData['max_score'] ?? 100;
        $duration = $activityData['duration_seconds'] ?? 0;
        $expectedDuration = $activityData['expected_duration'] ?? 60;
        
        // Calculate accuracy (0-1 scale)
        $accuracy = $maxScore > 0 ? $score / $maxScore : 0;
        
        // Calculate speed (0-1 scale, where 1 is expected speed or faster)
        $speed = $expectedDuration > 0 ? min(1, $expectedDuration / max(1, $duration)) : 0.5;
        
        // Calculate cognitive load (1-5 scale)
        $cognitiveLoad = $this->calculateCognitiveLoad(
            $activityData['category'],
            $activityData['difficulty_level'],
            $accuracy,
            $speed
        );
        
        // Get current fatigue level
        $fatigueLevel = $this->getCurrentFatigueLevel(
            $activityData['user_id'] ?? null,
            $activityData['session_id'] ?? null
        );
        
        return [
            'score' => $score,
            'accuracy' => round($accuracy, 3),
            'speed' => round($speed, 3),
            'cognitive_load' => $cognitiveLoad,
            'fatigue_level' => round($fatigueLevel, 3),
            'performance_score' => round(($accuracy * 0.7) + ($speed * 0.3), 3)
        ];
    }
    
    /**
     * Calculate cognitive load based on multiple factors
     */
    private function calculateCognitiveLoad($category, $difficulty, $accuracy, $speed) {
        // Base cognitive load by category
        $categoryLoads = [
            'memory_game' => 4,
            'puzzle' => 5,
            'trivia' => 2,
            'meditation' => 1,
            'challenge' => 5,
            'reading' => 2
        ];
        
        $baseLoad = $categoryLoads[$category] ?? 3;
        
        // Adjust for difficulty
        $difficultyMultiplier = 0.8 + ($difficulty * 0.1); // 0.9 to 1.3
        
        // Adjust for performance (struggling increases cognitive load)
        $performanceAdjustment = 0;
        if ($accuracy < 0.5) {
            $performanceAdjustment = 0.5; // Struggling
        } elseif ($accuracy > 0.85 && $speed > 0.8) {
            $performanceAdjustment = -0.3; // In flow state
        }
        
        $finalLoad = ($baseLoad * $difficultyMultiplier) + $performanceAdjustment;
        
        return max(1, min(5, round($finalLoad)));
    }
    
    /**
     * Get current fatigue level
     */
    private function getCurrentFatigueLevel($userId, $sessionId) {
        if (!$userId || !$sessionId) return 0;
        
        try {
            // Get recent performance data
            $stmt = $this->conn->prepare("
                SELECT 
                    AVG(accuracy) as avg_accuracy,
                    AVG(speed) as avg_speed,
                    COUNT(*) as activity_count,
                    SUM(CASE WHEN skipped = 1 THEN 1 ELSE 0 END) as skipped_count,
                    MAX(cognitive_load) as max_load,
                    AVG(cognitive_load) as avg_load
                FROM ss_session_performance
                WHERE session_flow_id = ?
                ORDER BY started_at DESC
                LIMIT 5
            ");
            
            $stmt->execute([$sessionId]);
            $recentPerf = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$recentPerf || $recentPerf['activity_count'] == 0) {
                return 0;
            }
            
            // Calculate fatigue indicators
            $fatigue = 0;
            
            // Low accuracy indicates fatigue
            if ($recentPerf['avg_accuracy'] < 0.6) {
                $fatigue += 0.3;
            }
            
            // Low speed indicates fatigue
            if ($recentPerf['avg_speed'] < 0.5) {
                $fatigue += 0.2;
            }
            
            // High skip rate indicates fatigue
            $skipRate = $recentPerf['skipped_count'] / $recentPerf['activity_count'];
            if ($skipRate > 0.2) {
                $fatigue += 0.3;
            }
            
            // High cognitive load accumulation
            if ($recentPerf['avg_load'] > 3.5) {
                $fatigue += 0.2;
            }
            
            // Time-based fatigue (increases over session duration)
            $stmt = $this->conn->prepare("
                SELECT TIMESTAMPDIFF(MINUTE, started_at, NOW()) as session_minutes
                FROM ss_user_sessions_flow
                WHERE session_flow_id = ?
            ");
            $stmt->execute([$sessionId]);
            $sessionTime = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($sessionTime && $sessionTime['session_minutes'] > 20) {
                $fatigue += min(0.3, ($sessionTime['session_minutes'] - 20) * 0.01);
            }
            
            return min(1, $fatigue);
            
        } catch (Exception $e) {
            error_log("Fatigue calculation error: " . $e->getMessage());
            return 0;
        }
    }
    
    /**
     * Analyze fatigue patterns
     */
    public function analyzeFatigue($userId, $sessionId) {
        try {
            // Get performance trend
            $stmt = $this->conn->prepare("
                SELECT 
                    activity_index,
                    accuracy,
                    speed,
                    cognitive_load,
                    fatigue_level,
                    skipped
                FROM ss_session_performance
                WHERE session_flow_id = ?
                ORDER BY activity_index
            ");
            
            $stmt->execute([$sessionId]);
            $activities = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            if (count($activities) < 3) {
                return ['fatigue_detected' => false, 'level' => 0];
            }
            
            // Analyze trends
            $recentActivities = array_slice($activities, -3);
            $earlierActivities = array_slice($activities, 0, 3);
            
            $recentAvgAccuracy = array_sum(array_column($recentActivities, 'accuracy')) / count($recentActivities);
            $earlierAvgAccuracy = array_sum(array_column($earlierActivities, 'accuracy')) / count($earlierActivities);
            
            $recentAvgSpeed = array_sum(array_column($recentActivities, 'speed')) / count($recentActivities);
            $earlierAvgSpeed = array_sum(array_column($earlierActivities, 'speed')) / count($earlierActivities);
            
            // Check for fatigue indicators
            $fatigueIndicators = [];
            
            // Declining accuracy
            if ($earlierAvgAccuracy - $recentAvgAccuracy > self::FATIGUE_ERROR_INCREASE) {
                $fatigueIndicators[] = 'declining_accuracy';
            }
            
            // Declining speed
            if ($earlierAvgSpeed - $recentAvgSpeed > self::FATIGUE_SPEED_DECREASE) {
                $fatigueIndicators[] = 'declining_speed';
            }
            
            // Recent skips
            $recentSkips = array_sum(array_column($recentActivities, 'skipped'));
            if ($recentSkips > 0) {
                $fatigueIndicators[] = 'recent_skips';
            }
            
            // High cognitive load accumulation
            $totalLoad = array_sum(array_column($activities, 'cognitive_load'));
            if ($totalLoad > count($activities) * 3.5) {
                $fatigueIndicators[] = 'high_cognitive_load';
            }
            
            $fatigueDetected = count($fatigueIndicators) >= 2;
            $fatigueLevel = count($fatigueIndicators) / 4; // 0-1 scale
            
            return [
                'fatigue_detected' => $fatigueDetected,
                'level' => round($fatigueLevel, 2),
                'indicators' => $fatigueIndicators,
                'recommendation' => $this->getFatigueRecommendation($fatigueLevel)
            ];
            
        } catch (Exception $e) {
            error_log("Fatigue analysis error: " . $e->getMessage());
            return ['fatigue_detected' => false, 'level' => 0];
        }
    }
    
    /**
     * Get fatigue recommendation
     */
    private function getFatigueRecommendation($fatigueLevel) {
        if ($fatigueLevel >= 0.75) {
            return [
                'action' => 'immediate_break',
                'duration' => 60,
                'message' => 'You seem tired. Time for a longer break!'
            ];
        } elseif ($fatigueLevel >= 0.5) {
            return [
                'action' => 'short_break',
                'duration' => 30,
                'message' => 'A quick break would help you refocus.'
            ];
        } elseif ($fatigueLevel >= 0.25) {
            return [
                'action' => 'reduce_difficulty',
                'message' => 'Let\'s make the next activity a bit easier.'
            ];
        } else {
            return [
                'action' => 'continue',
                'message' => 'You\'re doing great! Keep going!'
            ];
        }
    }
    
    /**
     * Update user statistics
     */
    private function updateUserStatistics($userId, $metrics) {
        try {
            $stmt = $this->conn->prepare("
                UPDATE ss_user_statistics
                SET 
                    total_score = total_score + ?,
                    activities_completed = activities_completed + 1,
                    last_activity_at = NOW()
                WHERE user_id = ?
            ");
            
            $stmt->execute([$metrics['score'], $userId]);
            
        } catch (Exception $e) {
            error_log("Update statistics error: " . $e->getMessage());
        }
    }
    
    /**
     * Update session performance data
     */
    private function updateSessionPerformance($sessionId, $metrics, $fatigueAnalysis) {
        try {
            $performanceData = json_encode([
                'latest_metrics' => $metrics,
                'fatigue_analysis' => $fatigueAnalysis,
                'timestamp' => date('Y-m-d H:i:s')
            ]);
            
            $stmt = $this->conn->prepare("
                UPDATE ss_user_sessions_flow
                SET 
                    performance_data = JSON_MERGE_PATCH(
                        COALESCE(performance_data, '{}'),
                        ?
                    ),
                    activities_completed = activities_completed + 1,
                    updated_at = NOW()
                WHERE session_flow_id = ?
            ");
            
            $stmt->execute([$performanceData, $sessionId]);
            
        } catch (Exception $e) {
            error_log("Update session performance error: " . $e->getMessage());
        }
    }
    
    /**
     * Get performance summary for a user
     */
    public function getPerformanceSummary($userId, $period = 7) {
        try {
            $stmt = $this->conn->prepare("
                SELECT 
                    COUNT(*) as total_activities,
                    AVG(accuracy) as avg_accuracy,
                    AVG(speed) as avg_speed,
                    AVG(cognitive_load) as avg_cognitive_load,
                    AVG(fatigue_level) as avg_fatigue,
                    SUM(score) as total_score,
                    COUNT(DISTINCT session_flow_id) as total_sessions,
                    COUNT(DISTINCT category) as categories_played,
                    MAX(difficulty_level) as max_difficulty,
                    SUM(CASE WHEN accuracy >= ? THEN 1 ELSE 0 END) as excellent_count,
                    SUM(CASE WHEN accuracy >= ? THEN 1 ELSE 0 END) as good_count,
                    SUM(CASE WHEN accuracy < ? THEN 1 ELSE 0 END) as struggling_count
                FROM ss_session_performance
                WHERE user_id = ?
                AND started_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
            ");
            
            $stmt->execute([
                self::EXCELLENT_THRESHOLD,
                self::GOOD_THRESHOLD,
                self::STRUGGLING_THRESHOLD,
                $userId,
                $period
            ]);
            
            $summary = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Get category breakdown
            $stmt = $this->conn->prepare("
                SELECT 
                    category,
                    COUNT(*) as count,
                    AVG(accuracy) as avg_accuracy,
                    AVG(score) as avg_score
                FROM ss_session_performance
                WHERE user_id = ?
                AND started_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
                GROUP BY category
            ");
            
            $stmt->execute([$userId, $period]);
            $categoryBreakdown = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Get performance trend
            $stmt = $this->conn->prepare("
                SELECT 
                    DATE(started_at) as date,
                    AVG(accuracy) as avg_accuracy,
                    AVG(cognitive_load) as avg_load,
                    COUNT(*) as activities
                FROM ss_session_performance
                WHERE user_id = ?
                AND started_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
                GROUP BY DATE(started_at)
                ORDER BY date
            ");
            
            $stmt->execute([$userId, $period]);
            $trend = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return [
                'summary' => $summary,
                'categories' => $categoryBreakdown,
                'trend' => $trend,
                'period_days' => $period
            ];
            
        } catch (Exception $e) {
            error_log("Performance summary error: " . $e->getMessage());
            return null;
        }
    }
    
    /**
     * Get recommended difficulty for next activity
     */
    public function getRecommendedDifficulty($userId, $category = null) {
        try {
            // Get recent performance
            $sql = "
                SELECT 
                    AVG(accuracy) as avg_accuracy,
                    AVG(difficulty_level) as avg_difficulty
                FROM ss_session_performance
                WHERE user_id = ?
            ";
            
            $params = [$userId];
            
            if ($category) {
                $sql .= " AND category = ?";
                $params[] = $category;
            }
            
            $sql .= " AND started_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
                     ORDER BY started_at DESC
                     LIMIT 5";
            
            $stmt = $this->conn->prepare($sql);
            $stmt->execute($params);
            $recent = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$recent || !$recent['avg_accuracy']) {
                return 2; // Default to medium difficulty
            }
            
            $currentDifficulty = $recent['avg_difficulty'] ?? 2;
            $accuracy = $recent['avg_accuracy'];
            
            // Adjust difficulty based on performance
            if ($accuracy >= self::EXCELLENT_THRESHOLD) {
                // Increase difficulty
                return min(5, ceil($currentDifficulty + 0.5));
            } elseif ($accuracy >= self::GOOD_THRESHOLD) {
                // Maintain or slightly increase
                return min(5, ceil($currentDifficulty + 0.2));
            } elseif ($accuracy < self::STRUGGLING_THRESHOLD) {
                // Decrease difficulty
                return max(1, floor($currentDifficulty - 0.5));
            } else {
                // Maintain current difficulty
                return round($currentDifficulty);
            }
            
        } catch (Exception $e) {
            error_log("Difficulty recommendation error: " . $e->getMessage());
            return 2;
        }
    }
}