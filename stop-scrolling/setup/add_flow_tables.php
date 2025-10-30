<?php
/**
 * Add Flow System Database Tables
 * Creates new tables for interactive flow functionality
 */

require_once __DIR__ . '/../config/database.php';

try {
    $db = Database::getInstance();
    $conn = $db->getConnection();
    
    // Use the correct database
    $conn->exec("USE trialcluestoday_restaurant_ms");
    
    echo "Adding flow system tables...\n";
    
    // Create ss_user_sessions_flow table
    $sql = "CREATE TABLE IF NOT EXISTS ss_user_sessions_flow (
        session_flow_id VARCHAR(36) NOT NULL PRIMARY KEY,
        user_id VARCHAR(36) DEFAULT NULL,
        session_type ENUM('quick', 'focus', 'deep', 'endless', 'daily', 'custom') DEFAULT 'quick',
        session_state ENUM('initializing', 'active', 'paused', 'completed', 'abandoned') DEFAULT 'initializing',
        activities_sequence JSON,
        current_index INT DEFAULT 0,
        total_activities INT DEFAULT 0,
        activities_completed INT DEFAULT 0,
        session_config JSON,
        performance_data JSON,
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        paused_duration INT DEFAULT 0,
        completed_at TIMESTAMP NULL,
        end_reason VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_user_sessions (user_id),
        INDEX idx_session_state (session_state),
        INDEX idx_started_at (started_at),
        FOREIGN KEY (user_id) REFERENCES ss_users(user_id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci";
    
    $conn->exec($sql);
    echo "✓ Created ss_user_sessions_flow table\n";
    
    // Create ss_content_transitions table
    $sql = "CREATE TABLE IF NOT EXISTS ss_content_transitions (
        transition_id VARCHAR(36) PRIMARY KEY,
        from_content_id VARCHAR(36),
        to_content_id VARCHAR(36),
        from_category VARCHAR(50),
        to_category VARCHAR(50),
        transition_score FLOAT DEFAULT 0.5,
        cognitive_load_change INT DEFAULT 0,
        success_rate FLOAT DEFAULT 0,
        avg_performance_change FLOAT DEFAULT 0,
        usage_count INT DEFAULT 0,
        last_used TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_from_content (from_content_id),
        INDEX idx_to_content (to_content_id),
        INDEX idx_categories (from_category, to_category),
        INDEX idx_transition_score (transition_score),
        FOREIGN KEY (from_content_id) REFERENCES ss_contents(content_id) ON DELETE CASCADE,
        FOREIGN KEY (to_content_id) REFERENCES ss_contents(content_id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci";
    
    $conn->exec($sql);
    echo "✓ Created ss_content_transitions table\n";
    
    // Create ss_flow_preferences table
    $sql = "CREATE TABLE IF NOT EXISTS ss_flow_preferences (
        preference_id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) UNIQUE,
        preferred_session_duration INT DEFAULT 15,
        preferred_difficulty_mode ENUM('linear', 'adaptive', 'stepped', 'wave') DEFAULT 'adaptive',
        preferred_pattern ENUM('balanced', 'cognitive', 'relaxed', 'challenge') DEFAULT 'balanced',
        auto_advance_enabled BOOLEAN DEFAULT TRUE,
        transitions_enabled BOOLEAN DEFAULT TRUE,
        break_frequency INT DEFAULT 3,
        break_duration INT DEFAULT 30,
        motivational_messages BOOLEAN DEFAULT TRUE,
        category_preferences JSON,
        exclude_categories JSON,
        custom_settings JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        FOREIGN KEY (user_id) REFERENCES ss_users(user_id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci";
    
    $conn->exec($sql);
    echo "✓ Created ss_flow_preferences table\n";
    
    // Create ss_session_performance table
    $sql = "CREATE TABLE IF NOT EXISTS ss_session_performance (
        performance_id VARCHAR(36) PRIMARY KEY,
        session_flow_id VARCHAR(36),
        user_id VARCHAR(36),
        activity_index INT,
        content_id VARCHAR(36),
        category VARCHAR(50),
        difficulty_level INT,
        target_difficulty INT,
        score INT DEFAULT 0,
        accuracy FLOAT DEFAULT 0,
        speed FLOAT DEFAULT 0,
        cognitive_load INT DEFAULT 0,
        fatigue_level FLOAT DEFAULT 0,
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP NULL,
        duration_seconds INT DEFAULT 0,
        skipped BOOLEAN DEFAULT FALSE,
        
        INDEX idx_session_performance (session_flow_id),
        INDEX idx_user_performance (user_id),
        INDEX idx_content_performance (content_id),
        FOREIGN KEY (session_flow_id) REFERENCES ss_user_sessions_flow(session_flow_id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES ss_users(user_id) ON DELETE CASCADE,
        FOREIGN KEY (content_id) REFERENCES ss_contents(content_id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci";
    
    $conn->exec($sql);
    echo "✓ Created ss_session_performance table\n";
    
    // Create ss_daily_journeys table
    $sql = "CREATE TABLE IF NOT EXISTS ss_daily_journeys (
        journey_id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36),
        journey_date DATE,
        morning_sequence JSON,
        afternoon_sequence JSON,
        evening_sequence JSON,
        daily_goal INT DEFAULT 5,
        activities_completed INT DEFAULT 0,
        total_score INT DEFAULT 0,
        journey_status ENUM('planned', 'active', 'completed', 'partial') DEFAULT 'planned',
        completion_rate FLOAT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        UNIQUE KEY unique_user_date (user_id, journey_date),
        INDEX idx_journey_date (journey_date),
        INDEX idx_journey_status (journey_status),
        FOREIGN KEY (user_id) REFERENCES ss_users(user_id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci";
    
    $conn->exec($sql);
    echo "✓ Created ss_daily_journeys table\n";
    
    // Add flow-related columns to existing tables if they don't exist
    $sql = "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'trialcluestoday_restaurant_ms' 
            AND TABLE_NAME = 'ss_user_statistics' 
            AND COLUMN_NAME = 'flow_sessions_completed'";
    
    $result = $conn->query($sql);
    if ($result->rowCount() == 0) {
        $sql = "ALTER TABLE ss_user_statistics 
                ADD COLUMN flow_sessions_completed INT DEFAULT 0,
                ADD COLUMN avg_flow_duration INT DEFAULT 0,
                ADD COLUMN preferred_flow_time VARCHAR(20),
                ADD COLUMN flow_completion_rate FLOAT DEFAULT 0";
        $conn->exec($sql);
        echo "✓ Added flow columns to ss_user_statistics\n";
    }
    
    // Add sample flow preferences for existing users
    $sql = "INSERT IGNORE INTO ss_flow_preferences (user_id)
            SELECT user_id FROM ss_users 
            WHERE user_id NOT IN (SELECT user_id FROM ss_flow_preferences)";
    $conn->exec($sql);
    echo "✓ Added default flow preferences for existing users\n";
    
    echo "\n✅ Flow system tables created successfully!\n";
    
} catch (Exception $e) {
    echo "❌ Error creating flow tables: " . $e->getMessage() . "\n";
    exit(1);
}
?>