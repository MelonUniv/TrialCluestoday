<?php
require_once dirname(__DIR__) . '/config/database.php';

echo "Populating Stop Scrolling Database with Light Test Data...\n";

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
    $firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David'];
    $lastNames = ['Smith', 'Johnson', 'Williams', 'Jones', 'Brown'];
    $countries = ['US', 'GB', 'CA', 'AU', 'DE'];
    $timezones = ['America/New_York', 'Europe/London', 'Asia/Tokyo'];
    $contentTitles = [
        'memory_game' => ['Memory Match', 'Pattern Recall', 'Card Flip Challenge'],
        'puzzle' => ['Sudoku Classic', 'Word Search', 'Logic Grid'],
        'trivia' => ['Science Quiz', 'History Trivia', 'Geography Challenge']
    ];
    $badgeNames = ['First Steps', 'Week Warrior', 'Memory Master', 'Puzzle Pro', 'Streak Hero'];
    
    // Create sample users (reduced to 5)
    echo "Creating users...\n";
    $userIds = [];
    for ($i = 0; $i < 5; $i++) {
        $userId = generateUUID();
        $userIds[] = $userId;
        $firstName = $firstNames[$i % count($firstNames)];
        $lastName = $lastNames[$i % count($lastNames)];
        $username = strtolower($firstName . $lastName . rand(100, 999));
        $email = $username . '@example.com';
        $accountType = ['free', 'premium'][rand(0, 1)];
        
        $stmt = $conn->prepare("
            INSERT INTO ss_users (user_id, email, username, password_hash, created_at, last_login_at, 
                             is_active, is_verified, account_type)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $userId,
            $email,
            $username,
            password_hash('password123', PASSWORD_DEFAULT),
            randomDate('-1 month', 'now'),
            randomDate('-7 days', 'now'),
            1,
            1,
            $accountType
        ]);
    }
    
    // Create user profiles
    echo "Creating user profiles...\n";
    foreach ($userIds as $idx => $userId) {
        $stmt = $conn->prepare("
            INSERT INTO ss_user_profiles (profile_id, user_id, display_name, bio, 
                                      country, timezone, cognitive_type, experience_level, 
                                      daily_goal_minutes, notification_enabled)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $displayName = $firstNames[$idx % count($firstNames)] . ' ' . substr($lastNames[$idx % count($lastNames)], 0, 1) . '.';
        $cognitiveTypes = ['visual', 'logical', 'verbal'];
        $experienceLevels = ['beginner', 'intermediate', 'advanced'];
        
        $stmt->execute([
            generateUUID(),
            $userId,
            $displayName,
            'Improving my cognitive skills!',
            $countries[$idx % count($countries)],
            $timezones[$idx % count($timezones)],
            $cognitiveTypes[rand(0, 2)],
            $experienceLevels[rand(0, 2)],
            rand(15, 30),
            1
        ]);
    }
    
    // Create user interests
    echo "Creating user interests...\n";
    $categories = ['memory_games', 'puzzles', 'trivia'];
    foreach ($userIds as $userId) {
        foreach ($categories as $category) {
            $stmt = $conn->prepare("
                INSERT INTO ss_user_interests (interest_id, user_id, category, interest_level)
                VALUES (?, ?, ?, ?)
            ");
            
            $stmt->execute([
                generateUUID(),
                $userId,
                $category,
                rand(5, 10)
            ]);
        }
    }
    
    // Create user settings
    echo "Creating user settings...\n";
    foreach ($userIds as $userId) {
        $stmt = $conn->prepare("
            INSERT INTO ss_user_settings (setting_id, user_id, theme, sound_enabled, 
                                      difficulty_mode, weekly_report_enabled)
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        
        $themes = ['light', 'dark', 'auto'];
        $difficulties = ['adaptive', 'easy', 'medium', 'hard'];
        
        $stmt->execute([
            generateUUID(),
            $userId,
            $themes[rand(0, 2)],
            1,
            $difficulties[rand(0, 3)],
            1
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
                INSERT INTO ss_contents (content_id, title, description, category, 
                                    difficulty_level, estimated_duration_seconds, content_data, 
                                    is_premium, is_active, created_by)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            $contentData = json_encode([
                'instructions' => 'Complete this ' . $category . ' challenge',
                'points' => rand(10, 50)
            ]);
            
            $stmt->execute([
                $contentId,
                $title,
                'Engage your mind with this ' . $category . ' activity',
                $category,
                rand(1, 5),
                rand(60, 300),
                $contentData,
                rand(0, 1),
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
        
        $requirementTypes = ['streak', 'score', 'completion'];
        
        $stmt->execute([
            $badgeId,
            $badgeName,
            'Earn this badge by achieving excellence',
            'achievement',
            $requirementTypes[rand(0, 2)],
            rand(5, 50),
            rand(10, 30),
            1
        ]);
    }
    
    // Create user sessions and activities (reduced)
    echo "Creating user sessions and activities...\n";
    foreach ($userIds as $userId) {
        // Create 2-3 sessions per user
        for ($s = 0; $s < rand(2, 3); $s++) {
            $sessionId = generateUUID();
            $sessionStart = randomDate('-7 days', 'now');
            $sessionDuration = rand(300, 1800);
            
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
                rand(1, 3),
                'spontaneous',
                ['ios', 'android', 'web'][rand(0, 2)],
                '1.0.0'
            ]);
            
            // Create 1-2 activities per session
            for ($a = 0; $a < rand(1, 2); $a++) {
                $content = $contentIds[array_rand($contentIds)];
                
                $stmt = $conn->prepare("
                    INSERT INTO ss_user_activities (activity_id, user_id, session_id, content_id, 
                                                activity_type, started_at, completed_at, 
                                                duration_seconds, score, accuracy_percentage, 
                                                difficulty_level, is_completed)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ");
                
                $stmt->execute([
                    generateUUID(),
                    $userId,
                    $sessionId,
                    $content['id'],
                    $content['category'],
                    $sessionStart,
                    date('Y-m-d H:i:s', strtotime($sessionStart) + 300),
                    300,
                    rand(70, 100),
                    rand(70, 100),
                    rand(1, 5),
                    1
                ]);
            }
        }
    }
    
    // Create user streaks
    echo "Creating user streaks...\n";
    foreach ($userIds as $userId) {
        $stmt = $conn->prepare("
            INSERT INTO ss_user_streaks (streak_id, user_id, streak_type, current_streak, 
                                     longest_streak, last_activity_date)
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        
        $currentStreak = rand(1, 7);
        $stmt->execute([
            generateUUID(),
            $userId,
            'daily',
            $currentStreak,
            rand($currentStreak, 14),
            date('Y-m-d')
        ]);
    }
    
    // Create user achievements
    echo "Creating user achievements...\n";
    foreach ($userIds as $userId) {
        // Give each user 1-2 badges
        $numBadges = rand(1, min(2, count($badgeIds)));
        for ($b = 0; $b < $numBadges; $b++) {
            $stmt = $conn->prepare("
                INSERT INTO ss_user_achievements (achievement_id, user_id, badge_id, 
                                              unlocked_at, progress_percentage, is_claimed)
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                generateUUID(),
                $userId,
                $badgeIds[$b],
                randomDate('-7 days', 'now'),
                100.00,
                1
            ]);
        }
    }
    
    // Create user statistics
    echo "Creating user statistics...\n";
    foreach ($userIds as $userId) {
        $stmt = $conn->prepare("
            INSERT INTO ss_user_statistics (stat_id, user_id, total_sessions, total_time_spent_seconds, 
                                        total_activities_completed, total_points, current_level, 
                                        memory_score, problem_solving_score, focus_score)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            generateUUID(),
            $userId,
            rand(5, 20),
            rand(1800, 7200),
            rand(10, 50),
            rand(100, 1000),
            rand(1, 5),
            rand(60, 90),
            rand(60, 90),
            rand(60, 90)
        ]);
    }
    
    // Create daily challenges
    echo "Creating daily challenges...\n";
    for ($d = 7; $d >= 0; $d--) {
        $challengeDate = date('Y-m-d', strtotime('-' . $d . ' days'));
        $selectedContents = array_slice($contentIds, 0, 3);
        
        $stmt = $conn->prepare("
            INSERT INTO ss_daily_challenges (challenge_id, date, content_ids, theme, bonus_points)
            VALUES (?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            generateUUID(),
            $challengeDate,
            json_encode(array_column($selectedContents, 'id')),
            'Daily Brain Boost',
            rand(50, 100)
        ]);
    }
    
    // Create some notifications
    echo "Creating user notifications...\n";
    foreach ($userIds as $userId) {
        $stmt = $conn->prepare("
            INSERT INTO ss_user_notifications (notification_id, user_id, type, title, 
                                          message, is_read, sent_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            generateUUID(),
            $userId,
            'reminder',
            'Time for your daily brain training!',
            'Keep your streak going!',
            rand(0, 1),
            randomDate('-2 days', 'now')
        ]);
    }
    
    echo "\nDatabase populated successfully with light test data!\n";
    echo "Created:\n";
    echo "- " . count($userIds) . " users\n";
    echo "- " . count($contentIds) . " content items\n";
    echo "- " . count($badgeIds) . " badges\n";
    echo "- User activities, sessions, and basic metrics\n";
    
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}