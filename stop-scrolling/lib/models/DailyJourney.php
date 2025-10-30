<?php
/**
 * DailyJourney Model
 * Manages daily activity planning and personalized journeys
 * Creates optimal daily schedules based on user preferences and performance
 */

require_once __DIR__ . '/../core/Database.php';
require_once __DIR__ . '/PerformanceTracker.php';

class DailyJourney {
    private $db;
    private $conn;
    private $performanceTracker;
    
    // Journey templates
    const JOURNEY_TEMPLATES = [
        'balanced' => [
            'morning' => ['trivia', 'memory_game', 'puzzle'],
            'afternoon' => ['puzzle', 'challenge', 'memory_game'],
            'evening' => ['meditation', 'trivia', 'meditation']
        ],
        'cognitive_boost' => [
            'morning' => ['memory_game', 'puzzle', 'memory_game'],
            'afternoon' => ['challenge', 'puzzle', 'challenge'],
            'evening' => ['trivia', 'memory_game', 'meditation']
        ],
        'relaxed' => [
            'morning' => ['trivia', 'meditation', 'trivia'],
            'afternoon' => ['memory_game', 'trivia', 'puzzle'],
            'evening' => ['meditation', 'meditation', 'meditation']
        ],
        'intensive' => [
            'morning' => ['puzzle', 'challenge', 'memory_game'],
            'afternoon' => ['challenge', 'puzzle', 'challenge'],
            'evening' => ['puzzle', 'memory_game', 'meditation']
        ]
    ];
    
    // Time slots
    const TIME_SLOTS = [
        'morning' => ['06:00', '12:00'],
        'afternoon' => ['12:00', '18:00'],
        'evening' => ['18:00', '24:00']
    ];
    
    public function __construct() {
        $this->db = Database::getInstance();
        $this->conn = $this->db->getConnection();
        $this->conn->exec("USE trialcluestoday_restaurant_ms");
        $this->performanceTracker = new PerformanceTracker();
    }
    
    /**
     * Create daily journey for user
     */
    public function createDailyJourney($userId, $date = null, $template = 'balanced', $customOptions = []) {
        $date = $date ?: date('Y-m-d');
        
        try {
            // Check if journey already exists for this date
            $existingJourney = $this->getJourneyByDate($userId, $date);
            if ($existingJourney) {
                return $this->updateJourney($existingJourney['journey_id'], $template, $customOptions);
            }
            
            // Get user preferences and performance history
            $userPrefs = $this->getUserPreferences($userId);
            $performance = $this->performanceTracker->getPerformanceSummary($userId, 7);
            
            // Generate personalized journey
            $journey = $this->generateJourney($userId, $template, $userPrefs, $performance, $customOptions);
            
            // Save to database
            $stmt = $this->conn->prepare("
                INSERT INTO ss_daily_journeys (
                    journey_id,
                    user_id,
                    journey_date,
                    morning_sequence,
                    afternoon_sequence,
                    evening_sequence,
                    daily_goal,
                    journey_status,
                    created_at
                ) VALUES (UUID(), ?, ?, ?, ?, ?, ?, 'planned', NOW())
            ");
            
            $stmt->execute([
                $userId,
                $date,
                json_encode($journey['morning']),
                json_encode($journey['afternoon']),
                json_encode($journey['evening']),
                $journey['goal']
            ]);
            
            $journeyId = $this->conn->lastInsertId();
            
            return [
                'success' => true,
                'journey_id' => $journeyId,
                'journey' => $journey,
                'date' => $date
            ];
            
        } catch (Exception $e) {
            error_log("Daily journey creation error: " . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Generate personalized journey
     */
    private function generateJourney($userId, $template, $userPrefs, $performance, $customOptions) {
        // Get base template
        $baseTemplate = self::JOURNEY_TEMPLATES[$template] ?? self::JOURNEY_TEMPLATES['balanced'];
        
        // Get available content
        $availableContent = $this->getAvailableContent($userId);
        
        // Generate each time period
        $journey = [
            'morning' => $this->generateTimeSlot($availableContent, $baseTemplate['morning'], 'morning', $userPrefs, $performance),
            'afternoon' => $this->generateTimeSlot($availableContent, $baseTemplate['afternoon'], 'afternoon', $userPrefs, $performance),
            'evening' => $this->generateTimeSlot($availableContent, $baseTemplate['evening'], 'evening', $userPrefs, $performance),
            'goal' => $customOptions['daily_goal'] ?? $this->calculateDailyGoal($performance),
            'template' => $template,
            'estimated_duration' => 0
        ];
        
        // Calculate total estimated duration
        $totalDuration = 0;
        foreach (['morning', 'afternoon', 'evening'] as $period) {
            foreach ($journey[$period] as $activity) {
                $totalDuration += $activity['estimated_duration'] ?? 60;
            }
        }
        $journey['estimated_duration'] = $totalDuration;
        
        // Add variety and balance checks
        $journey = $this->optimizeJourney($journey, $userPrefs, $performance);
        
        return $journey;
    }
    
    /**
     * Generate activities for a specific time slot
     */
    private function generateTimeSlot($availableContent, $categories, $timeSlot, $userPrefs, $performance) {
        $activities = [];
        $usedContent = [];
        
        // Adjust difficulty based on time of day
        $difficultyAdjustment = $this->getDifficultyAdjustment($timeSlot);
        
        foreach ($categories as $category) {
            // Filter content by category
            $categoryContent = array_filter($availableContent, function($content) use ($category) {
                return $content['category'] === $category;
            });
            
            if (empty($categoryContent)) continue;
            
            // Select best content for this slot
            $selectedContent = $this->selectOptimalContent(
                $categoryContent,
                $usedContent,
                $timeSlot,
                $difficultyAdjustment,
                $userPrefs,
                $performance
            );
            
            if ($selectedContent) {
                $activities[] = [
                    'content_id' => $selectedContent['content_id'],
                    'title' => $selectedContent['title'],
                    'category' => $selectedContent['category'],
                    'difficulty_level' => $selectedContent['difficulty_level'],
                    'estimated_duration' => $selectedContent['estimated_duration_seconds'] ?? 60,
                    'time_slot' => $timeSlot,
                    'order' => count($activities),
                    'reasons' => $selectedContent['selection_reasons'] ?? []
                ];
                
                $usedContent[] = $selectedContent['content_id'];
            }
        }
        
        return $activities;
    }
    
    /**
     * Select optimal content for time slot
     */
    private function selectOptimalContent($categoryContent, $usedContent, $timeSlot, $difficultyAdjustment, $userPrefs, $performance) {
        // Filter out already used content
        $available = array_filter($categoryContent, function($content) use ($usedContent) {
            return !in_array($content['content_id'], $usedContent);
        });
        
        if (empty($available)) {
            // If no unique content, allow repeats but prefer less recent
            $available = $categoryContent;
        }
        
        // Score each content item
        $scoredContent = array_map(function($content) use ($timeSlot, $difficultyAdjustment, $userPrefs, $performance) {
            $score = 0;
            $reasons = [];
            
            // Base score
            $score += 50;
            
            // Time appropriateness
            $timeScore = $this->getTimeAppropriatenessScore($content, $timeSlot);
            $score += $timeScore;
            if ($timeScore > 15) $reasons[] = "Perfect for " . $timeSlot;
            
            // Difficulty appropriateness
            $targetDifficulty = $this->getTargetDifficulty($userPrefs, $performance, $content['category']);
            $adjustedTarget = $targetDifficulty + $difficultyAdjustment;
            $diffScore = 20 - abs($content['difficulty_level'] - $adjustedTarget) * 5;
            $score += $diffScore;
            if ($diffScore > 15) $reasons[] = "Good difficulty match";
            
            // User preference
            $prefScore = $this->getUserPreferenceScore($content, $userPrefs);
            $score += $prefScore;
            if ($prefScore > 15) $reasons[] = "Matches your preferences";
            
            // Performance history
            $perfScore = $this->getPerformanceHistoryScore($content, $performance);
            $score += $perfScore;
            if ($perfScore > 15) $reasons[] = "You perform well in this category";
            
            // Freshness (haven't played recently)
            $freshnessScore = $this->getFreshnessScore($content['content_id']);
            $score += $freshnessScore;
            if ($freshnessScore > 15) $reasons[] = "Fresh content";
            
            // Variety bonus
            $varietyScore = $this->getVarietyScore($content);
            $score += $varietyScore;
            
            return [
                ...$content,
                'selection_score' => $score,
                'selection_reasons' => $reasons
            ];
        }, $available);
        
        // Sort by score and return best
        usort($scoredContent, function($a, $b) {
            return $b['selection_score'] - $a['selection_score'];
        });
        
        return $scoredContent[0] ?? null;
    }
    
    /**
     * Get difficulty adjustment based on time of day
     */
    private function getDifficultyAdjustment($timeSlot) {
        switch ($timeSlot) {
            case 'morning':
                return 0.5; // Slightly easier in the morning
            case 'afternoon':
                return 0.0; // Peak performance time
            case 'evening':
                return -0.3; // Easier in the evening
            default:
                return 0.0;
        }
    }
    
    /**
     * Get time appropriateness score
     */
    private function getTimeAppropriatenessScore($content, $timeSlot) {
        $categoryScores = [
            'morning' => [
                'trivia' => 20,      // Good for warming up
                'memory_game' => 15,  // Moderate cognitive load
                'puzzle' => 10,       // Might be too intense
                'meditation' => 25,   // Great for starting day
                'challenge' => 5      // Too intense for morning
            ],
            'afternoon' => [
                'trivia' => 15,
                'memory_game' => 20,  // Peak performance
                'puzzle' => 25,       // Best time for complex tasks
                'meditation' => 10,   // Less ideal
                'challenge' => 25     // Peak performance time
            ],
            'evening' => [
                'trivia' => 20,       // Light and engaging
                'memory_game' => 15,  // Moderate
                'puzzle' => 10,       // Might be too stimulating
                'meditation' => 30,   // Perfect for winding down
                'challenge' => 5      // Too stimulating
            ]
        ];
        
        return $categoryScores[$timeSlot][$content['category']] ?? 10;
    }
    
    /**
     * Get target difficulty for user
     */
    private function getTargetDifficulty($userPrefs, $performance, $category) {
        // Use performance tracker recommendation
        if ($this->performanceTracker) {
            return $this->performanceTracker->getRecommendedDifficulty(
                $userPrefs['user_id'] ?? null,
                $category
            );
        }
        
        // Fallback to average performance
        if ($performance && $performance['summary']['avg_accuracy']) {
            $avgAccuracy = $performance['summary']['avg_accuracy'];
            if ($avgAccuracy >= 0.85) return 4;
            if ($avgAccuracy >= 0.70) return 3;
            if ($avgAccuracy >= 0.55) return 2;
            return 1;
        }
        
        return 2; // Default medium
    }
    
    /**
     * Calculate daily goal
     */
    private function calculateDailyGoal($performance) {
        if (!$performance || !$performance['summary']['total_activities']) {
            return 9; // Default goal
        }
        
        $avgDaily = $performance['summary']['total_activities'] / $performance['period_days'];
        
        // Set goal slightly above average but achievable
        return max(6, min(15, ceil($avgDaily * 1.2)));
    }
    
    /**
     * Get user preferences
     */
    private function getUserPreferences($userId) {
        try {
            $stmt = $this->conn->prepare("
                SELECT 
                    fp.*,
                    us.total_activities_completed,
                    us.favorite_category
                FROM ss_flow_preferences fp
                LEFT JOIN ss_user_statistics us ON fp.user_id = us.user_id
                WHERE fp.user_id = ?
            ");
            $stmt->execute([$userId]);
            
            $prefs = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$prefs) {
                // Return defaults
                return [
                    'user_id' => $userId,
                    'preferred_session_duration' => 15,
                    'preferred_difficulty_mode' => 'adaptive',
                    'category_preferences' => '{}',
                    'exclude_categories' => '[]'
                ];
            }
            
            return $prefs;
        } catch (Exception $e) {
            error_log("Get user preferences error: " . $e->getMessage());
            return ['user_id' => $userId];
        }
    }
    
    /**
     * Get available content for journey
     */
    private function getAvailableContent($userId) {
        try {
            $stmt = $this->conn->prepare("
                SELECT 
                    content_id,
                    title,
                    description,
                    category,
                    difficulty_level,
                    estimated_duration_seconds,
                    is_premium
                FROM ss_contents
                WHERE is_active = 1
                ORDER BY category, difficulty_level
            ");
            $stmt->execute();
            
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (Exception $e) {
            error_log("Get available content error: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Get journey by date
     */
    public function getJourneyByDate($userId, $date) {
        try {
            $stmt = $this->conn->prepare("
                SELECT * FROM ss_daily_journeys
                WHERE user_id = ? AND journey_date = ?
            ");
            $stmt->execute([$userId, $date]);
            
            $journey = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$journey) return null;
            
            // Parse JSON sequences
            $journey['morning_sequence'] = json_decode($journey['morning_sequence'], true);
            $journey['afternoon_sequence'] = json_decode($journey['afternoon_sequence'], true);
            $journey['evening_sequence'] = json_decode($journey['evening_sequence'], true);
            
            return $journey;
        } catch (Exception $e) {
            error_log("Get journey by date error: " . $e->getMessage());
            return null;
        }
    }
    
    /**
     * Update journey progress
     */
    public function updateProgress($journeyId, $activityCompleted, $timeSlot) {
        try {
            $stmt = $this->conn->prepare("
                UPDATE ss_daily_journeys 
                SET 
                    activities_completed = activities_completed + 1,
                    completion_rate = (activities_completed / daily_goal) * 100,
                    journey_status = CASE 
                        WHEN activities_completed >= daily_goal THEN 'completed'
                        WHEN activities_completed > 0 THEN 'active'
                        ELSE journey_status
                    END,
                    updated_at = NOW()
                WHERE journey_id = ?
            ");
            
            return $stmt->execute([$journeyId]);
        } catch (Exception $e) {
            error_log("Update journey progress error: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Get user's journey stats
     */
    public function getJourneyStats($userId, $days = 30) {
        try {
            $stmt = $this->conn->prepare("
                SELECT 
                    COUNT(*) as total_journeys,
                    SUM(CASE WHEN journey_status = 'completed' THEN 1 ELSE 0 END) as completed_journeys,
                    AVG(completion_rate) as avg_completion_rate,
                    SUM(activities_completed) as total_activities,
                    MAX(activities_completed) as best_day
                FROM ss_daily_journeys
                WHERE user_id = ? 
                AND journey_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
            ");
            
            $stmt->execute([$userId, $days]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (Exception $e) {
            error_log("Get journey stats error: " . $e->getMessage());
            return null;
        }
    }
    
    /**
     * Helper scoring functions
     */
    private function getUserPreferenceScore($content, $userPrefs) {
        // Implementation for user preference scoring
        return rand(10, 20); // Placeholder
    }
    
    private function getPerformanceHistoryScore($content, $performance) {
        // Implementation for performance history scoring
        return rand(10, 20); // Placeholder
    }
    
    private function getFreshnessScore($contentId) {
        // Implementation for freshness scoring
        return rand(10, 20); // Placeholder
    }
    
    private function getVarietyScore($content) {
        // Implementation for variety scoring
        return rand(5, 15); // Placeholder
    }
    
    private function optimizeJourney($journey, $userPrefs, $performance) {
        // Implementation for journey optimization
        return $journey; // Placeholder
    }
    
    private function updateJourney($journeyId, $template, $customOptions) {
        // Implementation for updating existing journey
        return ['success' => true]; // Placeholder
    }
}