<?php
/**
 * User Model Class
 * Handles all user-related database operations
 */

require_once __DIR__ . '/../core/Database.php';

class User {
    private $db;
    
    public function __construct() {
        $this->db = Database::getInstance();
    }
    
    /**
     * Get user by ID with full profile information
     */
    public function getById($userId) {
        $sql = "SELECT 
                    u.user_id,
                    u.username,
                    u.email,
                    u.is_verified,
                    u.is_active,
                    u.account_type,
                    u.created_at,
                    u.updated_at,
                    u.last_login_at,
                    u.subscription_expires_at,
                    up.display_name,
                    up.avatar_url,
                    up.bio,
                    up.date_of_birth,
                    up.country,
                    up.timezone,
                    up.language,
                    up.cognitive_type,
                    up.experience_level,
                    up.daily_goal_minutes,
                    up.notification_enabled
                FROM ss_users u
                LEFT JOIN ss_user_profiles up ON u.user_id = up.user_id
                WHERE u.user_id = ?";
        
        return $this->db->fetchOne($sql, [$userId]);
    }
    
    /**
     * Get user by email
     */
    public function getByEmail($email) {
        $sql = "SELECT user_id, username, email, password_hash, is_verified, created_at 
                FROM ss_users WHERE email = ?";
        
        return $this->db->fetchOne($sql, [$email]);
    }
    
    /**
     * Update user basic information
     */
    public function update($userId, $data) {
        // Filter allowed fields for ss_users table
        $allowedFields = [
            'username', 'email', 'is_active', 'is_verified', 'account_type'
        ];
        
        $userData = array_intersect_key($data, array_flip($allowedFields));
        $userData['updated_at'] = date('Y-m-d H:i:s');
        
        if (empty($userData)) {
            return false;
        }
        
        return $this->db->update('users', $userData, 'user_id = ?', [$userId]) > 0;
    }
    
    /**
     * Update user profile information
     */
    public function updateProfile($userId, $profileData) {
        // Filter allowed fields for ss_user_profiles table
        $allowedFields = [
            'display_name', 'avatar_url', 'bio', 'date_of_birth', 'country', 
            'timezone', 'language', 'cognitive_type', 'experience_level', 
            'daily_goal_minutes', 'notification_enabled'
        ];
        
        $filteredData = array_intersect_key($profileData, array_flip($allowedFields));
        $filteredData['updated_at'] = date('Y-m-d H:i:s');
        
        if (empty($filteredData)) {
            return false;
        }
        
        // Check if profile exists
        $existingProfile = $this->db->fetchOne(
            "SELECT user_id FROM ss_user_profiles WHERE user_id = ?", 
            [$userId]
        );
        
        if ($existingProfile) {
            // Update existing profile
            return $this->db->update('user_profiles', $filteredData, 'user_id = ?', [$userId]) > 0;
        } else {
            // Create new profile
            $filteredData['user_id'] = $userId;
            $filteredData['profile_id'] = $this->generateUUID();
            $filteredData['created_at'] = date('Y-m-d H:i:s');
            
            return $this->db->insert('user_profiles', $filteredData) !== false;
        }
    }
    
    /**
     * Get user settings
     */
    public function getSettings($userId) {
        $sql = "SELECT 
                    theme,
                    sound_enabled,
                    haptic_feedback,
                    difficulty_mode,
                    reminder_time,
                    weekly_report_enabled,
                    share_progress,
                    updated_at
                FROM ss_user_settings 
                WHERE user_id = ?";
        
        $settings = $this->db->fetchOne($sql, [$userId]);
        
        // Return default settings if none exist
        if (!$settings) {
            return $this->getDefaultSettings();
        }
        
        return $settings;
    }
    
    /**
     * Update user settings
     */
    public function updateSettings($userId, $settings) {
        $allowedFields = [
            'theme', 'sound_enabled', 'haptic_feedback', 'difficulty_mode',
            'reminder_time', 'weekly_report_enabled', 'share_progress'
        ];
        
        $filteredSettings = array_intersect_key($settings, array_flip($allowedFields));
        $filteredSettings['updated_at'] = date('Y-m-d H:i:s');
        
        if (empty($filteredSettings)) {
            return false;
        }
        
        // Check if settings exist
        $existingSettings = $this->db->fetchOne(
            "SELECT user_id FROM ss_user_settings WHERE user_id = ?", 
            [$userId]
        );
        
        if ($existingSettings) {
            return $this->db->update('user_settings', $filteredSettings, 'user_id = ?', [$userId]) > 0;
        } else {
            // Create new settings record
            $filteredSettings['user_id'] = $userId;
            $filteredSettings['setting_id'] = $this->generateUUID();
            $filteredSettings['created_at'] = date('Y-m-d H:i:s');
            
            return $this->db->insert('user_settings', $filteredSettings) !== false;
        }
    }
    
    /**
     * Get user interests
     */
    public function getInterests($userId) {
        $sql = "SELECT 
                    category,
                    interest_level,
                    updated_at
                FROM ss_user_interests 
                WHERE user_id = ?
                ORDER BY category";
        
        $interests = $this->db->fetchAll($sql, [$userId]);
        
        // Convert to associative array format
        $result = [];
        foreach ($interests as $interest) {
            $result[$interest['category']] = $interest['interest_level'];
        }
        
        return $result;
    }
    
    /**
     * Update user interests
     */
    public function updateInterests($userId, $interests) {
        $validCategories = [
            'memory_games', 'puzzles', 'trivia', 'problem_solving',
            'news', 'mindfulness', 'languages'
        ];
        
        try {
            // Begin transaction
            $this->db->beginTransaction();
            
            // Delete existing interests for this user
            $this->db->delete('user_interests', 'user_id = ?', [$userId]);
            
            // Insert new interests
            foreach ($interests as $category => $interestLevel) {
                if (!in_array($category, $validCategories)) {
                    continue;
                }
                
                $interestLevel = (int) $interestLevel;
                if ($interestLevel < 0 || $interestLevel > 10) {
                    $interestLevel = 5; // Default to medium interest
                }
                
                if ($interestLevel > 0) { // Only insert if there's interest
                    $data = [
                        'interest_id' => $this->generateUUID(),
                        'user_id' => $userId,
                        'category' => $category,
                        'interest_level' => $interestLevel,
                        'created_at' => date('Y-m-d H:i:s'),
                        'updated_at' => date('Y-m-d H:i:s')
                    ];
                    
                    $this->db->insert('user_interests', $data);
                }
            }
            
            // Commit transaction
            $this->db->commit();
            return true;
            
        } catch (Exception $e) {
            // Rollback transaction on error
            $this->db->rollback();
            return false;
        }
    }
    
    /**
     * Get user statistics
     */
    public function getStatistics($userId) {
        $sql = "SELECT 
                    total_sessions,
                    total_time_spent_seconds,
                    total_activities_completed,
                    average_session_duration_seconds,
                    average_daily_minutes,
                    total_points,
                    current_level,
                    memory_score,
                    problem_solving_score,
                    focus_score,
                    last_calculated_at,
                    updated_at
                FROM ss_user_statistics 
                WHERE user_id = ?";
        
        $stats = $this->db->fetchOne($sql, [$userId]);
        
        // Return default stats if none exist
        if (!$stats) {
            return $this->getDefaultStatistics();
        }
        
        return $stats;
    }
    
    /**
     * Soft delete user account
     */
    public function delete($userId) {
        // In a real implementation, we might want to soft delete
        // For now, we'll update a deleted_at timestamp if the column exists
        $userData = [
            'deleted_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s')
        ];
        
        return $this->db->update('users', $userData, 'user_id = ?', [$userId]) > 0;
    }
    
    /**
     * Get complete user profile with all related data
     */
    public function getProfile($userId) {
        $profile = [
            'user' => $this->getById($userId),
            'settings' => $this->getSettings($userId),
            'interests' => $this->getInterests($userId),
            'statistics' => $this->getStatistics($userId)
        ];
        
        return $profile;
    }
    
    /**
     * Check if user exists
     */
    public function exists($userId) {
        $sql = "SELECT COUNT(*) as count FROM ss_users WHERE user_id = ?";
        $result = $this->db->fetchOne($sql, [$userId]);
        return $result['count'] > 0;
    }
    
    /**
     * Generate UUID for new records
     */
    private function generateUUID() {
        // Use MySQL's UUID() function
        $result = $this->db->fetchOne("SELECT UUID() as uuid");
        return $result['uuid'];
    }
    
    /**
     * Get default settings for new users
     */
    private function getDefaultSettings() {
        return [
            'theme' => 'auto',
            'sound_enabled' => true,
            'haptic_feedback' => true,
            'difficulty_mode' => 'adaptive',
            'reminder_time' => null,
            'weekly_report_enabled' => true,
            'share_progress' => false
        ];
    }
    
    /**
     * Get default statistics for new users
     */
    private function getDefaultStatistics() {
        return [
            'total_sessions' => 0,
            'total_time_spent_seconds' => 0,
            'total_activities_completed' => 0,
            'average_session_duration_seconds' => 0,
            'average_daily_minutes' => 0.0,
            'total_points' => 0,
            'current_level' => 1,
            'memory_score' => 0.0,
            'problem_solving_score' => 0.0,
            'focus_score' => 0.0,
            'last_calculated_at' => null
        ];
    }
}