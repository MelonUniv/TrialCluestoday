<?php
require_once dirname(__DIR__) . '/config/database.php';

echo "Starting Stop Scrolling Database Setup...\n";

try {
    $db = Database::getInstance();
    $conn = $db->getConnection();
    
    // Use existing database
    echo "Using database 'trialcluestoday_restaurant_ms' with table prefix 'ss_'...\n";
    $conn->exec("USE trialcluestoday_restaurant_ms");
    
    // Table prefix
    $prefix = 'ss_';
    
    // Drop existing tables if they exist (for clean setup)
    echo "Dropping existing Stop Scrolling tables if they exist...\n";
    
    // Disable foreign key checks temporarily
    $conn->exec("SET FOREIGN_KEY_CHECKS = 0");
    
    $tables = [
        'app_events', 'user_notifications', 'leaderboard_entries', 'leaderboards',
        'user_connections', 'user_feedback', 'user_reports', 'daily_user_metrics',
        'user_statistics', 'user_challenges', 'daily_challenges', 'user_content_progress',
        'badges', 'user_achievements', 'user_streaks', 'user_activities', 'user_sessions',
        'user_settings', 'user_interests', 'user_profiles', 'password_resets',
        'auth_sessions', 'users', 'contents'
    ];
    
    foreach ($tables as $table) {
        $conn->exec("DROP TABLE IF EXISTS {$prefix}{$table}");
    }
    
    // Re-enable foreign key checks
    $conn->exec("SET FOREIGN_KEY_CHECKS = 1");
    
    // Create users table
    echo "Creating {$prefix}users table...\n";
    $conn->exec("
        CREATE TABLE {$prefix}users (
            user_id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
            email VARCHAR(255) UNIQUE NOT NULL,
            username VARCHAR(50) UNIQUE,
            password_hash VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            last_login_at TIMESTAMP NULL,
            is_active BOOLEAN DEFAULT true,
            is_verified BOOLEAN DEFAULT false,
            account_type ENUM('free', 'premium', 'trial') DEFAULT 'free',
            subscription_expires_at TIMESTAMP NULL,
            INDEX idx_email (email),
            INDEX idx_username (username)
        )
    ");
    
    // Create auth_sessions table
    echo "Creating {$prefix}auth_sessions table...\n";
    $conn->exec("
        CREATE TABLE {$prefix}auth_sessions (
            session_id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
            user_id VARCHAR(36),
            token_hash VARCHAR(255),
            device_id VARCHAR(255),
            device_type ENUM('ios', 'android', 'web'),
            ip_address VARCHAR(45),
            expires_at TIMESTAMP NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES {$prefix}users(user_id) ON DELETE CASCADE,
            INDEX idx_user_id (user_id)
        )
    ");
    
    // Create password_resets table
    echo "Creating {$prefix}password_resets table...\n";
    $conn->exec("
        CREATE TABLE {$prefix}password_resets (
            reset_id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
            user_id VARCHAR(36),
            token_hash VARCHAR(255),
            expires_at TIMESTAMP NULL,
            used_at TIMESTAMP NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES {$prefix}users(user_id) ON DELETE CASCADE
        )
    ");
    
    // Create user_profiles table
    echo "Creating {$prefix}user_profiles table...\n";
    $conn->exec("
        CREATE TABLE {$prefix}user_profiles (
            profile_id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
            user_id VARCHAR(36) UNIQUE,
            display_name VARCHAR(100),
            avatar_url TEXT,
            bio TEXT,
            date_of_birth DATE,
            country VARCHAR(2),
            timezone VARCHAR(50),
            language VARCHAR(5) DEFAULT 'en',
            cognitive_type ENUM('visual', 'logical', 'verbal', 'kinesthetic'),
            experience_level ENUM('beginner', 'intermediate', 'advanced') DEFAULT 'beginner',
            daily_goal_minutes INT DEFAULT 15,
            notification_enabled BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES {$prefix}users(user_id) ON DELETE CASCADE
        )
    ");
    
    // Create user_interests table
    echo "Creating {$prefix}user_interests table...\n";
    $conn->exec("
        CREATE TABLE {$prefix}user_interests (
            interest_id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
            user_id VARCHAR(36),
            category ENUM('memory_games', 'puzzles', 'trivia', 'problem_solving', 'news', 'mindfulness', 'languages'),
            interest_level INT CHECK (interest_level >= 1 AND interest_level <= 10),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES {$prefix}users(user_id) ON DELETE CASCADE,
            INDEX idx_user_category (user_id, category)
        )
    ");
    
    // Create user_settings table
    echo "Creating {$prefix}user_settings table...\n";
    $conn->exec("
        CREATE TABLE {$prefix}user_settings (
            setting_id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
            user_id VARCHAR(36) UNIQUE,
            theme ENUM('light', 'dark', 'auto') DEFAULT 'auto',
            sound_enabled BOOLEAN DEFAULT true,
            haptic_feedback BOOLEAN DEFAULT true,
            difficulty_mode ENUM('adaptive', 'easy', 'medium', 'hard') DEFAULT 'adaptive',
            reminder_time TIME,
            weekly_report_enabled BOOLEAN DEFAULT true,
            share_progress BOOLEAN DEFAULT false,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES {$prefix}users(user_id) ON DELETE CASCADE
        )
    ");
    
    // Create user_sessions table
    echo "Creating {$prefix}user_sessions table...\n";
    $conn->exec("
        CREATE TABLE {$prefix}user_sessions (
            session_id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
            user_id VARCHAR(36),
            start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            end_time TIMESTAMP NULL,
            duration_seconds INT,
            activities_completed INT DEFAULT 0,
            session_type ENUM('scheduled', 'spontaneous'),
            device_type VARCHAR(50),
            app_version VARCHAR(20),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES {$prefix}users(user_id) ON DELETE CASCADE,
            INDEX idx_user_date (user_id, start_time)
        )
    ");
    
    // Create contents table
    echo "Creating {$prefix}contents table...\n";
    $conn->exec("
        CREATE TABLE {$prefix}contents (
            content_id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
            title VARCHAR(255),
            description TEXT,
            category ENUM('memory_game', 'puzzle', 'trivia', 'meditation', 'article', 'challenge'),
            sub_category VARCHAR(50),
            difficulty_level INT CHECK (difficulty_level >= 1 AND difficulty_level <= 10),
            estimated_duration_seconds INT,
            content_data JSON,
            thumbnail_url TEXT,
            is_premium BOOLEAN DEFAULT false,
            is_active BOOLEAN DEFAULT true,
            created_by VARCHAR(36),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (created_by) REFERENCES {$prefix}users(user_id) ON DELETE SET NULL,
            INDEX idx_category_difficulty (category, difficulty_level)
        )
    ");
    
    // Create user_activities table
    echo "Creating {$prefix}user_activities table...\n";
    $conn->exec("
        CREATE TABLE {$prefix}user_activities (
            activity_id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
            user_id VARCHAR(36),
            session_id VARCHAR(36),
            content_id VARCHAR(36),
            activity_type ENUM('memory_game', 'puzzle', 'trivia', 'meditation', 'reading', 'challenge'),
            started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            completed_at TIMESTAMP NULL,
            duration_seconds INT,
            score INT,
            accuracy_percentage DECIMAL(5,2),
            difficulty_level INT CHECK (difficulty_level >= 1 AND difficulty_level <= 10),
            attempts INT DEFAULT 1,
            is_completed BOOLEAN DEFAULT false,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES {$prefix}users(user_id) ON DELETE CASCADE,
            FOREIGN KEY (session_id) REFERENCES {$prefix}user_sessions(session_id) ON DELETE SET NULL,
            FOREIGN KEY (content_id) REFERENCES {$prefix}contents(content_id) ON DELETE SET NULL,
            INDEX idx_user_activity (user_id, activity_type, created_at)
        )
    ");
    
    // Create user_streaks table
    echo "Creating {$prefix}user_streaks table...\n";
    $conn->exec("
        CREATE TABLE {$prefix}user_streaks (
            streak_id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
            user_id VARCHAR(36),
            streak_type ENUM('daily', 'weekly', 'activity_specific'),
            current_streak INT DEFAULT 0,
            longest_streak INT DEFAULT 0,
            last_activity_date DATE,
            streak_broken_at TIMESTAMP NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES {$prefix}users(user_id) ON DELETE CASCADE,
            INDEX idx_user_type (user_id, streak_type)
        )
    ");
    
    // Create badges table
    echo "Creating {$prefix}badges table...\n";
    $conn->exec("
        CREATE TABLE {$prefix}badges (
            badge_id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
            name VARCHAR(100),
            description TEXT,
            icon_url TEXT,
            category VARCHAR(50),
            requirement_type ENUM('streak', 'score', 'completion', 'time', 'special'),
            requirement_value INT,
            points INT DEFAULT 10,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ");
    
    // Create user_achievements table
    echo "Creating {$prefix}user_achievements table...\n";
    $conn->exec("
        CREATE TABLE {$prefix}user_achievements (
            achievement_id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
            user_id VARCHAR(36),
            badge_id VARCHAR(36),
            unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            progress_percentage DECIMAL(5,2) DEFAULT 0,
            is_claimed BOOLEAN DEFAULT false,
            FOREIGN KEY (user_id) REFERENCES {$prefix}users(user_id) ON DELETE CASCADE,
            FOREIGN KEY (badge_id) REFERENCES {$prefix}badges(badge_id) ON DELETE CASCADE,
            INDEX idx_user_badge (user_id, badge_id)
        )
    ");
    
    // Create user_content_progress table
    echo "Creating {$prefix}user_content_progress table...\n";
    $conn->exec("
        CREATE TABLE {$prefix}user_content_progress (
            progress_id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
            user_id VARCHAR(36),
            content_id VARCHAR(36),
            times_played INT DEFAULT 0,
            best_score INT,
            average_score DECIMAL(10,2),
            total_time_spent_seconds INT DEFAULT 0,
            last_played_at TIMESTAMP NULL,
            mastery_level INT DEFAULT 0 CHECK (mastery_level >= 0 AND mastery_level <= 100),
            is_favorite BOOLEAN DEFAULT false,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES {$prefix}users(user_id) ON DELETE CASCADE,
            FOREIGN KEY (content_id) REFERENCES {$prefix}contents(content_id) ON DELETE CASCADE,
            INDEX idx_user_content (user_id, content_id)
        )
    ");
    
    // Create daily_challenges table
    echo "Creating {$prefix}daily_challenges table...\n";
    $conn->exec("
        CREATE TABLE {$prefix}daily_challenges (
            challenge_id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
            date DATE UNIQUE,
            content_ids JSON,
            theme VARCHAR(100),
            bonus_points INT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_date (date)
        )
    ");
    
    // Create user_challenges table
    echo "Creating {$prefix}user_challenges table...\n";
    $conn->exec("
        CREATE TABLE {$prefix}user_challenges (
            participation_id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
            user_id VARCHAR(36),
            challenge_id VARCHAR(36),
            started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            completed_at TIMESTAMP NULL,
            total_score INT,
            completion_percentage DECIMAL(5,2),
            earned_bonus BOOLEAN DEFAULT false,
            FOREIGN KEY (user_id) REFERENCES {$prefix}users(user_id) ON DELETE CASCADE,
            FOREIGN KEY (challenge_id) REFERENCES {$prefix}daily_challenges(challenge_id) ON DELETE CASCADE,
            INDEX idx_user_challenge (user_id, challenge_id)
        )
    ");
    
    // Create user_statistics table
    echo "Creating {$prefix}user_statistics table...\n";
    $conn->exec("
        CREATE TABLE {$prefix}user_statistics (
            stat_id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
            user_id VARCHAR(36) UNIQUE,
            total_sessions INT DEFAULT 0,
            total_time_spent_seconds BIGINT DEFAULT 0,
            total_activities_completed INT DEFAULT 0,
            average_session_duration_seconds INT DEFAULT 0,
            average_daily_minutes DECIMAL(10,2) DEFAULT 0,
            total_points INT DEFAULT 0,
            current_level INT DEFAULT 1,
            memory_score DECIMAL(5,2) DEFAULT 0,
            problem_solving_score DECIMAL(5,2) DEFAULT 0,
            focus_score DECIMAL(5,2) DEFAULT 0,
            last_calculated_at TIMESTAMP NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES {$prefix}users(user_id) ON DELETE CASCADE
        )
    ");
    
    // Create daily_user_metrics table
    echo "Creating {$prefix}daily_user_metrics table...\n";
    $conn->exec("
        CREATE TABLE {$prefix}daily_user_metrics (
            metric_id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
            user_id VARCHAR(36),
            date DATE,
            sessions_count INT DEFAULT 0,
            total_duration_seconds INT DEFAULT 0,
            activities_completed INT DEFAULT 0,
            memory_games_played INT DEFAULT 0,
            puzzles_solved INT DEFAULT 0,
            trivia_answered INT DEFAULT 0,
            average_accuracy DECIMAL(5,2),
            points_earned INT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES {$prefix}users(user_id) ON DELETE CASCADE,
            INDEX idx_user_date (user_id, date),
            UNIQUE KEY unique_user_date (user_id, date)
        )
    ");
    
    // Create user_reports table
    echo "Creating {$prefix}user_reports table...\n";
    $conn->exec("
        CREATE TABLE {$prefix}user_reports (
            report_id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
            user_id VARCHAR(36),
            report_type ENUM('weekly', 'monthly'),
            period_start DATE,
            period_end DATE,
            total_sessions INT,
            total_time_minutes INT,
            improvement_percentage DECIMAL(5,2),
            strongest_category VARCHAR(50),
            weakest_category VARCHAR(50),
            recommendations JSON,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES {$prefix}users(user_id) ON DELETE CASCADE,
            INDEX idx_user_period (user_id, period_start)
        )
    ");
    
    // Create user_feedback table
    echo "Creating {$prefix}user_feedback table...\n";
    $conn->exec("
        CREATE TABLE {$prefix}user_feedback (
            feedback_id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
            user_id VARCHAR(36),
            content_id VARCHAR(36),
            rating INT CHECK (rating >= 1 AND rating <= 5),
            feedback_text TEXT,
            feedback_type ENUM('bug', 'suggestion', 'content_quality', 'difficulty'),
            is_resolved BOOLEAN DEFAULT false,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES {$prefix}users(user_id) ON DELETE CASCADE,
            FOREIGN KEY (content_id) REFERENCES {$prefix}contents(content_id) ON DELETE CASCADE,
            INDEX idx_content_rating (content_id, rating)
        )
    ");
    
    // Create user_connections table
    echo "Creating {$prefix}user_connections table...\n";
    $conn->exec("
        CREATE TABLE {$prefix}user_connections (
            connection_id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
            user_id VARCHAR(36),
            friend_id VARCHAR(36),
            connection_type ENUM('friend', 'follower', 'following'),
            status ENUM('pending', 'accepted', 'blocked'),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES {$prefix}users(user_id) ON DELETE CASCADE,
            FOREIGN KEY (friend_id) REFERENCES {$prefix}users(user_id) ON DELETE CASCADE,
            INDEX idx_user_friend (user_id, friend_id),
            UNIQUE KEY unique_connection (user_id, friend_id, connection_type)
        )
    ");
    
    // Create leaderboards table
    echo "Creating {$prefix}leaderboards table...\n";
    $conn->exec("
        CREATE TABLE {$prefix}leaderboards (
            leaderboard_id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
            type ENUM('global', 'friends', 'regional', 'category'),
            category VARCHAR(50),
            period ENUM('daily', 'weekly', 'monthly', 'all_time'),
            period_start DATE,
            period_end DATE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_type_period (type, period, period_start)
        )
    ");
    
    // Create leaderboard_entries table
    echo "Creating {$prefix}leaderboard_entries table...\n";
    $conn->exec("
        CREATE TABLE {$prefix}leaderboard_entries (
            entry_id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
            leaderboard_id VARCHAR(36),
            user_id VARCHAR(36),
            user_rank INT,
            score INT,
            improvement_from_last_period INT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (leaderboard_id) REFERENCES {$prefix}leaderboards(leaderboard_id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES {$prefix}users(user_id) ON DELETE CASCADE,
            INDEX idx_leaderboard_rank (leaderboard_id, user_rank),
            UNIQUE KEY unique_user_board (leaderboard_id, user_id)
        )
    ");
    
    // Create user_notifications table
    echo "Creating {$prefix}user_notifications table...\n";
    $conn->exec("
        CREATE TABLE {$prefix}user_notifications (
            notification_id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
            user_id VARCHAR(36),
            type ENUM('reminder', 'achievement', 'friend_request', 'challenge', 'streak'),
            title VARCHAR(255),
            message TEXT,
            data JSON,
            is_read BOOLEAN DEFAULT false,
            sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            read_at TIMESTAMP NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES {$prefix}users(user_id) ON DELETE CASCADE,
            INDEX idx_user_unread (user_id, is_read, created_at)
        )
    ");
    
    // Create app_events table
    echo "Creating {$prefix}app_events table...\n";
    $conn->exec("
        CREATE TABLE {$prefix}app_events (
            event_id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
            user_id VARCHAR(36),
            event_type VARCHAR(50),
            event_data JSON,
            device_info JSON,
            app_version VARCHAR(20),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES {$prefix}users(user_id) ON DELETE CASCADE,
            INDEX idx_user_type_date (user_id, event_type, created_at)
        )
    ");
    
    echo "\nDatabase structure created successfully!\n";
    echo "All tables created with prefix 'ss_'\n";
    
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}