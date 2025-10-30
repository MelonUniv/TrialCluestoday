<?php
require_once dirname(__DIR__) . '/config/database.php';

echo "Populating Stop Scrolling Database with Test Data...\n";

try {
    $db = Database::getInstance();
    $conn = $db->getConnection();
    $conn->exec("USE trialcluestoday_restaurant_ms");
    
    // Helper functions
    function generateUUID() {
        return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            mt_rand(0, 0xffff), mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0x0fff) | 0x4000,
            mt_rand(0, 0x3fff) | 0x8000,
            mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
        );
    }
    
    function randomDate($start, $end) {
        $timestamp = rand(strtotime($start), strtotime($end));
        return date('Y-m-d H:i:s', $timestamp);
    }
    
    // Sample data arrays
    $firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'James', 'Emma', 'Robert', 'Lisa'];
    $lastNames = ['Smith', 'Johnson', 'Williams', 'Jones', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor'];
    $countries = ['US', 'GB', 'CA', 'AU', 'DE', 'FR', 'JP', 'BR', 'IN', 'MX'];
    $timezones = ['America/New_York', 'Europe/London', 'Asia/Tokyo', 'Australia/Sydney', 'America/Los_Angeles'];
    $contentTitles = [
        'memory_game' => ['Memory Match', 'Pattern Recall', 'Card Flip Challenge', 'Sequence Memory', 'Visual Memory Test'],
        'puzzle' => ['Sudoku Classic', 'Word Search', 'Crossword Daily', 'Logic Grid', 'Jigsaw Master'],
        'trivia' => ['Science Quiz', 'History Trivia', 'Geography Challenge', 'Pop Culture Test', 'Sports Knowledge'],
        'meditation' => ['Mindful Breathing', 'Body Scan', 'Guided Relaxation', 'Focus Timer', 'Stress Relief'],
        'challenge' => ['Daily Brain Workout', 'Speed Challenge', 'Memory Marathon', 'Puzzle Rush', 'Mixed Challenge']
    ];
    $badgeNames = ['First Steps', 'Week Warrior', 'Memory Master', 'Puzzle Pro', 'Trivia Champion', 'Streak Hero', 'Focus Expert'];
    
    // Create sample users
    echo "Creating users...\n";
    $userIds = [];
    for ($i = 0; $i < 20; $i++) {
        $userId = generateUUID();
        $userIds[] = $userId;
        $firstName = $firstNames[array_rand($firstNames)];
        $lastName = $lastNames[array_rand($lastNames)];
        $username = strtolower($firstName . $lastName . rand(100, 999));
        $email = $username . '@example.com';
        $accountType = ['free', 'premium', 'trial'][array_rand(['free', 'premium', 'trial'])];
        
        $stmt = $conn->prepare("
            INSERT INTO ss_users (user_id, email, username, password_hash, created_at, last_login_at, 
                             is_active, is_verified, account_type, subscription_expires_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $userId,
            $email,
            $username,
            password_hash('password123', PASSWORD_DEFAULT),
            randomDate('-3 months', 'now'),
            randomDate('-7 days', 'now'),
            rand(0, 10) > 1 ? 1 : 0,
            rand(0, 10) > 3 ? 1 : 0,
            $accountType,
            $accountType == 'premium' ? randomDate('+1 month', '+1 year') : null
        ]);
    }
    
    // Create user profiles
    echo "Creating user profiles...\n";
    foreach ($userIds as $userId) {
        $stmt = $conn->prepare("
            INSERT INTO ss_user_profiles (profile_id, user_id, display_name, bio, date_of_birth, 
                                      country, timezone, cognitive_type, experience_level, 
                                      daily_goal_minutes, notification_enabled)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $displayName = $firstNames[array_rand($firstNames)] . ' ' . substr($lastNames[array_rand($lastNames)], 0, 1) . '.';
        $cognitiveTypes = ['visual', 'logical', 'verbal', 'kinesthetic'];
        $experienceLevels = ['beginner', 'intermediate', 'advanced'];
        
        $stmt->execute([
            generateUUID(),
            $userId,
            $displayName,
            'Improving my cognitive skills with Stop Scrolling!',
            randomDate('-50 years', '-18 years'),
            $countries[array_rand($countries)],
            $timezones[array_rand($timezones)],
            $cognitiveTypes[array_rand($cognitiveTypes)],
            $experienceLevels[array_rand($experienceLevels)],
            rand(10, 60),
            rand(0, 10) > 2 ? 1 : 0
        ]);
    }
    
    // Create user interests
    echo "Creating user interests...\n";
    $categories = ['memory_games', 'puzzles', 'trivia', 'problem_solving', 'news', 'mindfulness', 'languages'];
    foreach ($userIds as $userId) {
        $numInterests = rand(2, 5);
        $selectedCategories = array_rand(array_flip($categories), $numInterests);
        if (!is_array($selectedCategories)) {
            $selectedCategories = [$selectedCategories];
        }
        
        foreach ($selectedCategories as $category) {
            $stmt = $conn->prepare("
                INSERT INTO ss_user_interests (interest_id, user_id, category, interest_level)
                VALUES (?, ?, ?, ?)
            ");
            
            $stmt->execute([
                generateUUID(),
                $userId,
                $category,
                rand(3, 10)
            ]);
        }
    }
    
    // Create user settings
    echo "Creating user settings...\n";
    foreach ($userIds as $userId) {
        $stmt = $conn->prepare("
            INSERT INTO ss_user_settings (setting_id, user_id, theme, sound_enabled, 
                                      haptic_feedback, difficulty_mode, reminder_time, 
                                      weekly_report_enabled, share_progress)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $themes = ['light', 'dark', 'auto'];
        $difficulties = ['adaptive', 'easy', 'medium', 'hard'];
        
        $stmt->execute([
            generateUUID(),
            $userId,
            $themes[array_rand($themes)],
            rand(0, 10) > 3 ? 1 : 0,
            rand(0, 10) > 4 ? 1 : 0,
            $difficulties[array_rand($difficulties)],
            sprintf('%02d:%02d:00', rand(6, 22), rand(0, 59)),
            rand(0, 10) > 3 ? 1 : 0,
            rand(0, 10) > 7 ? 1 : 0
        ]);
    }
    
    // Create content items
    echo "Creating content items...\n";
    $contentIds = [];
    foreach ($contentTitles as $category => $titles) {
        foreach ($titles as $title) {
            $contentId = generateUUID();
            $contentIds[] = ['id' => $contentId, 'category' => $category];
            
            $stmt = $conn->prepare("
                INSERT INTO ss_contents (content_id, title, description, category, sub_category, 
                                    difficulty_level, estimated_duration_seconds, content_data, 
                                    is_premium, is_active, created_by)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            $contentData = json_encode([
                'instructions' => 'Complete this ' . $category . ' challenge',
                'points' => rand(10, 100),
                'time_limit' => rand(60, 600)
            ]);
            
            $stmt->execute([
                $contentId,
                $title,
                'Engage your mind with this ' . $category . ' activity',
                $category,
                'general',
                rand(1, 10),
                rand(60, 900),
                $contentData,
                rand(0, 10) > 7 ? 1 : 0,
                1,
                $userIds[0]
            ]);
        }
    }
    
    // Create badges
    echo "Creating badges...\n";
    $badgeIds = [];
    foreach ($badgeNames as $badgeName) {
        $badgeId = generateUUID();
        $badgeIds[] = $badgeId;
        
        $stmt = $conn->prepare("
            INSERT INTO ss_badges (badge_id, name, description, category, requirement_type, 
                              requirement_value, points, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $requirementTypes = ['streak', 'score', 'completion', 'time', 'special'];
        
        $stmt->execute([
            $badgeId,
            $badgeName,
            'Earn this badge by achieving excellence in ' . strtolower($badgeName),
            'achievement',
            $requirementTypes[array_rand($requirementTypes)],
            rand(5, 100),
            rand(10, 50),
            1
        ]);
    }
    
    // Create user sessions and activities
    echo "Creating user sessions and activities...\n";
    foreach ($userIds as $userId) {
        $numSessions = rand(5, 20);
        
        for ($s = 0; $s < $numSessions; $s++) {
            $sessionId = generateUUID();
            $sessionStart = randomDate('-30 days', 'now');
            $sessionDuration = rand(300, 3600);
            $activitiesCount = rand(1, 5);
            
            $stmt = $conn->prepare("
                INSERT INTO ss_user_sessions (session_id, user_id, start_time, end_time, 
                                          duration_seconds, activities_completed, session_type, 
                                          device_type, app_version)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $sessionId,
                $userId,
                $sessionStart,
                date('Y-m-d H:i:s', strtotime($sessionStart) + $sessionDuration),
                $sessionDuration,
                $activitiesCount,
                ['scheduled', 'spontaneous'][array_rand(['scheduled', 'spontaneous'])],
                ['ios', 'android', 'web'][array_rand(['ios', 'android', 'web'])],
                '1.0.0'
            ]);
            
            // Create activities for this session
            for ($a = 0; $a < $activitiesCount; $a++) {
                $content = $contentIds[array_rand($contentIds)];
                $activityStart = date('Y-m-d H:i:s', strtotime($sessionStart) + ($a * 300));
                $activityDuration = rand(60, 600);
                
                $stmt = $conn->prepare("
                    INSERT INTO ss_user_activities (activity_id, user_id, session_id, content_id, 
                                                activity_type, started_at, completed_at, 
                                                duration_seconds, score, accuracy_percentage, 
                                                difficulty_level, attempts, is_completed)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ");
                
                $isCompleted = rand(0, 10) > 2 ? 1 : 0;
                
                $stmt->execute([
                    generateUUID(),
                    $userId,
                    $sessionId,
                    $content['id'],
                    $content['category'],
                    $activityStart,
                    $isCompleted ? date('Y-m-d H:i:s', strtotime($activityStart) + $activityDuration) : null,
                    $activityDuration,
                    $isCompleted ? rand(50, 100) : rand(0, 50),
                    $isCompleted ? rand(60, 100) : rand(20, 60),
                    rand(1, 10),
                    rand(1, 3),
                    $isCompleted
                ]);
            }
        }
    }
    
    // Create user streaks
    echo "Creating user streaks...\n";
    foreach ($userIds as $userId) {
        $streakTypes = ['daily', 'weekly', 'activity_specific'];
        
        foreach ($streakTypes as $streakType) {
            $stmt = $conn->prepare("
                INSERT INTO ss_user_streaks (streak_id, user_id, streak_type, current_streak, 
                                         longest_streak, last_activity_date)
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            
            $currentStreak = rand(0, 30);
            $stmt->execute([
                generateUUID(),
                $userId,
                $streakType,
                $currentStreak,
                rand($currentStreak, 50),
                date('Y-m-d', strtotime('-' . rand(0, 7) . ' days'))
            ]);
        }
    }
    
    // Create user achievements
    echo "Creating user achievements...\n";
    foreach ($userIds as $userId) {
        $numAchievements = rand(0, count($badgeIds));
        $earnedBadges = array_rand(array_flip($badgeIds), min($numAchievements, count($badgeIds)));
        if (!is_array($earnedBadges)) {
            $earnedBadges = [$earnedBadges];
        }
        
        foreach ($earnedBadges as $badgeId) {
            $stmt = $conn->prepare("
                INSERT INTO ss_user_achievements (achievement_id, user_id, badge_id, 
                                              unlocked_at, progress_percentage, is_claimed)
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                generateUUID(),
                $userId,
                $badgeId,
                randomDate('-30 days', 'now'),
                100.00,
                rand(0, 10) > 3 ? 1 : 0
            ]);
        }
    }
    
    // Create user statistics
    echo "Creating user statistics...\n";
    foreach ($userIds as $userId) {
        $stmt = $conn->prepare("
            INSERT INTO ss_user_statistics (stat_id, user_id, total_sessions, total_time_spent_seconds, 
                                        total_activities_completed, average_session_duration_seconds, 
                                        average_daily_minutes, total_points, current_level, 
                                        memory_score, problem_solving_score, focus_score)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $totalSessions = rand(10, 100);
        $totalTime = rand(3600, 36000);
        
        $stmt->execute([
            generateUUID(),
            $userId,
            $totalSessions,
            $totalTime,
            rand(20, 200),
            intval($totalTime / $totalSessions),
            round($totalTime / 30 / 60, 2),
            rand(100, 5000),
            rand(1, 20),
            rand(40, 95) + rand(0, 99) / 100,
            rand(40, 95) + rand(0, 99) / 100,
            rand(40, 95) + rand(0, 99) / 100
        ]);
    }
    
    // Create daily challenges
    echo "Creating daily challenges...\n";
    for ($d = 30; $d >= 0; $d--) {
        $challengeDate = date('Y-m-d', strtotime('-' . $d . ' days'));
        $selectedContents = array_rand(array_column($contentIds, 'id'), 3);
        
        $stmt = $conn->prepare("
            INSERT INTO ss_daily_challenges (challenge_id, date, content_ids, theme, bonus_points)
            VALUES (?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            generateUUID(),
            $challengeDate,
            json_encode($selectedContents),
            'Daily Brain Boost',
            rand(50, 200)
        ]);
    }
    
    // Create some user connections (friends)
    echo "Creating user connections...\n";
    for ($i = 0; $i < 30; $i++) {
        $user1 = $userIds[array_rand($userIds)];
        $user2 = $userIds[array_rand($userIds)];
        
        if ($user1 != $user2) {
            try {
                $stmt = $conn->prepare("
                    INSERT INTO ss_user_connections (connection_id, user_id, friend_id, 
                                                 connection_type, status)
                    VALUES (?, ?, ?, ?, ?)
                ");
                
                $stmt->execute([
                    generateUUID(),
                    $user1,
                    $user2,
                    'friend',
                    ['pending', 'accepted', 'accepted', 'accepted'][array_rand(['pending', 'accepted', 'accepted', 'accepted'])]
                ]);
            } catch (PDOException $e) {
                // Ignore duplicate connections
            }
        }
    }
    
    // Create daily user metrics
    echo "Creating daily user metrics...\n";
    foreach ($userIds as $userId) {
        for ($d = 30; $d >= 0; $d--) {
            if (rand(0, 10) > 3) { // Not every user has metrics every day
                $metricsDate = date('Y-m-d', strtotime('-' . $d . ' days'));
                
                try {
                    $stmt = $conn->prepare("
                        INSERT INTO ss_daily_user_metrics (metric_id, user_id, date, sessions_count, 
                                                       total_duration_seconds, activities_completed, 
                                                       memory_games_played, puzzles_solved, 
                                                       trivia_answered, average_accuracy, points_earned)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ");
                    
                    $stmt->execute([
                        generateUUID(),
                        $userId,
                        $metricsDate,
                        rand(1, 5),
                        rand(300, 3600),
                        rand(2, 15),
                        rand(0, 5),
                        rand(0, 5),
                        rand(0, 5),
                        rand(60, 95) + rand(0, 99) / 100,
                        rand(10, 200)
                    ]);
                } catch (PDOException $e) {
                    // Ignore duplicate date entries
                }
            }
        }
    }
    
    // Create some notifications
    echo "Creating user notifications...\n";
    $notificationTypes = ['reminder', 'achievement', 'friend_request', 'challenge', 'streak'];
    $notificationTitles = [
        'reminder' => 'Time for your daily brain training!',
        'achievement' => 'New achievement unlocked!',
        'friend_request' => 'You have a new friend request',
        'challenge' => 'New daily challenge available',
        'streak' => 'Keep your streak going!'
    ];
    
    foreach ($userIds as $userId) {
        $numNotifications = rand(2, 8);
        
        for ($n = 0; $n < $numNotifications; $n++) {
            $notificationType = $notificationTypes[array_rand($notificationTypes)];
            
            $stmt = $conn->prepare("
                INSERT INTO ss_user_notifications (notification_id, user_id, type, title, 
                                              message, is_read, sent_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                generateUUID(),
                $userId,
                $notificationType,
                $notificationTitles[$notificationType],
                'Click to learn more about your ' . $notificationType,
                rand(0, 10) > 5 ? 1 : 0,
                randomDate('-7 days', 'now')
            ]);
        }
    }
    
    echo "\nDatabase populated successfully!\n";
    echo "Created:\n";
    echo "- " . count($userIds) . " users\n";
    echo "- " . count($contentIds) . " content items\n";
    echo "- " . count($badgeIds) . " badges\n";
    echo "- Various user activities, sessions, and metrics\n";
    
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}