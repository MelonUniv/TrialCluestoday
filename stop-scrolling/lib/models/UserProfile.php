<?php
/**
 * UserProfile Model - Handles user profile and settings management
 */

require_once __DIR__ . '/../core/Database.php';

class UserProfile {
    private $db;
    private $conn;
    
    public function __construct() {
        $this->db = Database::getInstance();
        $this->conn = $this->db->getConnection();
        $this->conn->exec("USE trialcluestoday_restaurant_ms");
    }
    
    /**
     * Get user profile data
     */
    public function getProfile($userId) {
        try {
            // Get user basic info
            $stmt = $this->conn->prepare("
                SELECT user_id, username, email, created_at, avatar_url, bio
                FROM ss_users 
                WHERE user_id = ?
            ");
            $stmt->execute([$userId]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$user) {
                throw new Exception('User not found');
            }
            
            // Get user profile details
            $stmt = $this->conn->prepare("
                SELECT cognitive_type, experience_level, preferred_language, 
                       timezone, date_format, time_format
                FROM ss_user_profiles 
                WHERE user_id = ?
            ");
            $stmt->execute([$userId]);
            $profile = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Get user interests
            $stmt = $this->conn->prepare("
                SELECT memory_games, puzzles, trivia, problem_solving,
                       news, mindfulness, languages
                FROM ss_user_interests 
                WHERE user_id = ?
            ");
            $stmt->execute([$userId]);
            $interests = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Get user settings
            $stmt = $this->conn->prepare("
                SELECT theme, sound_enabled, haptic_feedback, difficulty_mode,
                       reminder_time, weekly_report_enabled, share_progress,
                       flow_session_length, flow_break_length, flow_auto_start,
                       flow_transition_speed, flow_preferred_categories, flow_difficulty_progression
                FROM ss_user_settings 
                WHERE user_id = ?
            ");
            $stmt->execute([$userId]);
            $settings = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Get user statistics
            $stmt = $this->conn->prepare("
                SELECT total_activities_completed, total_time_spent_seconds,
                       total_points_earned, level, experience_points, best_streak
                FROM ss_user_statistics 
                WHERE user_id = ?
            ");
            $stmt->execute([$userId]);
            $stats = $stmt->fetch(PDO::FETCH_ASSOC);
            
            return [
                'success' => true,
                'data' => [
                    'user' => $user,
                    'profile' => $profile ?: [],
                    'interests' => $interests ?: [],
                    'settings' => $settings ?: [],
                    'statistics' => $stats ?: []
                ]
            ];
            
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Failed to get profile: ' . $e->getMessage()
            ];
        }
    }
    
    /**
     * Update user profile
     */
    public function updateProfile($userId, $profileData) {
        try {
            $this->conn->beginTransaction();
            
            // Update basic user info if provided
            if (isset($profileData['username']) || isset($profileData['bio'])) {
                $updateFields = [];
                $params = [];
                
                if (isset($profileData['username'])) {
                    // Check if username is already taken
                    $stmt = $this->conn->prepare("
                        SELECT user_id FROM ss_users 
                        WHERE username = ? AND user_id != ?
                    ");
                    $stmt->execute([$profileData['username'], $userId]);
                    if ($stmt->fetch()) {
                        throw new Exception('Username already taken');
                    }
                    
                    $updateFields[] = "username = ?";
                    $params[] = $profileData['username'];
                }
                
                if (isset($profileData['bio'])) {
                    $updateFields[] = "bio = ?";
                    $params[] = $profileData['bio'];
                }
                
                if (!empty($updateFields)) {
                    $params[] = $userId;
                    $stmt = $this->conn->prepare("
                        UPDATE ss_users SET " . implode(', ', $updateFields) . ", updated_at = NOW()
                        WHERE user_id = ?
                    ");
                    $stmt->execute($params);
                }
            }
            
            // Update or insert profile data
            if (isset($profileData['cognitive_type']) || isset($profileData['experience_level']) || 
                isset($profileData['preferred_language']) || isset($profileData['timezone'])) {
                
                $stmt = $this->conn->prepare("
                    INSERT INTO ss_user_profiles (
                        user_id, cognitive_type, experience_level, preferred_language, 
                        timezone, date_format, time_format, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
                    ON DUPLICATE KEY UPDATE
                        cognitive_type = VALUES(cognitive_type),
                        experience_level = VALUES(experience_level),
                        preferred_language = VALUES(preferred_language),
                        timezone = VALUES(timezone),
                        date_format = VALUES(date_format),
                        time_format = VALUES(time_format),
                        updated_at = NOW()
                ");
                
                $stmt->execute([
                    $userId,
                    $profileData['cognitive_type'] ?? null,
                    $profileData['experience_level'] ?? null,
                    $profileData['preferred_language'] ?? 'en',
                    $profileData['timezone'] ?? 'UTC',
                    $profileData['date_format'] ?? 'Y-m-d',
                    $profileData['time_format'] ?? 'H:i'
                ]);
            }
            
            // Update interests if provided
            if (isset($profileData['interests'])) {
                $interests = $profileData['interests'];
                
                $stmt = $this->conn->prepare("
                    INSERT INTO ss_user_interests (
                        user_id, memory_games, puzzles, trivia, problem_solving,
                        news, mindfulness, languages, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
                    ON DUPLICATE KEY UPDATE
                        memory_games = VALUES(memory_games),
                        puzzles = VALUES(puzzles),
                        trivia = VALUES(trivia),
                        problem_solving = VALUES(problem_solving),
                        news = VALUES(news),
                        mindfulness = VALUES(mindfulness),
                        languages = VALUES(languages),
                        updated_at = NOW()
                ");
                
                $stmt->execute([
                    $userId,
                    $interests['memory_games'] ?? false,
                    $interests['puzzles'] ?? false,
                    $interests['trivia'] ?? false,
                    $interests['problem_solving'] ?? false,
                    $interests['news'] ?? false,
                    $interests['mindfulness'] ?? false,
                    $interests['languages'] ?? false
                ]);
            }
            
            $this->conn->commit();
            
            return [
                'success' => true,
                'message' => 'Profile updated successfully'
            ];
            
        } catch (Exception $e) {
            $this->conn->rollBack();
            return [
                'success' => false,
                'message' => 'Failed to update profile: ' . $e->getMessage()
            ];
        }
    }
    
    /**
     * Update user settings
     */
    public function updateSettings($userId, $settingsData) {
        try {
            $stmt = $this->conn->prepare("
                INSERT INTO ss_user_settings (
                    user_id, theme, sound_enabled, haptic_feedback, difficulty_mode,
                    reminder_time, weekly_report_enabled, share_progress,
                    flow_session_length, flow_break_length, flow_auto_start,
                    flow_transition_speed, flow_preferred_categories, flow_difficulty_progression,
                    created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
                ON DUPLICATE KEY UPDATE
                    theme = VALUES(theme),
                    sound_enabled = VALUES(sound_enabled),
                    haptic_feedback = VALUES(haptic_feedback),
                    difficulty_mode = VALUES(difficulty_mode),
                    reminder_time = VALUES(reminder_time),
                    weekly_report_enabled = VALUES(weekly_report_enabled),
                    share_progress = VALUES(share_progress),
                    flow_session_length = VALUES(flow_session_length),
                    flow_break_length = VALUES(flow_break_length),
                    flow_auto_start = VALUES(flow_auto_start),
                    flow_transition_speed = VALUES(flow_transition_speed),
                    flow_preferred_categories = VALUES(flow_preferred_categories),
                    flow_difficulty_progression = VALUES(flow_difficulty_progression),
                    updated_at = NOW()
            ");
            
            $stmt->execute([
                $userId,
                $settingsData['theme'] ?? 'auto',
                $settingsData['sound_enabled'] ?? true,
                $settingsData['haptic_feedback'] ?? true,
                $settingsData['difficulty_mode'] ?? 'adaptive',
                $settingsData['reminder_time'] ?? null,
                $settingsData['weekly_report_enabled'] ?? true,
                $settingsData['share_progress'] ?? false,
                $settingsData['flow_session_length'] ?? 15,
                $settingsData['flow_break_length'] ?? 2,
                $settingsData['flow_auto_start'] ?? false,
                $settingsData['flow_transition_speed'] ?? 'medium',
                isset($settingsData['flow_preferred_categories']) ? json_encode($settingsData['flow_preferred_categories']) : null,
                $settingsData['flow_difficulty_progression'] ?? true
            ]);
            
            return [
                'success' => true,
                'message' => 'Settings updated successfully'
            ];
            
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Failed to update settings: ' . $e->getMessage()
            ];
        }
    }
    
    /**
     * Change user password
     */
    public function changePassword($userId, $currentPassword, $newPassword) {
        try {
            // Get current password hash
            $stmt = $this->conn->prepare("
                SELECT password_hash FROM ss_users WHERE user_id = ?
            ");
            $stmt->execute([$userId]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$user) {
                throw new Exception('User not found');
            }
            
            // Verify current password
            if (!password_verify($currentPassword, $user['password_hash'])) {
                throw new Exception('Current password is incorrect');
            }
            
            // Validate new password
            if (strlen($newPassword) < 6) {
                throw new Exception('New password must be at least 6 characters');
            }
            
            // Update password
            $newPasswordHash = password_hash($newPassword, PASSWORD_DEFAULT);
            
            $stmt = $this->conn->prepare("
                UPDATE ss_users SET password_hash = ?, updated_at = NOW()
                WHERE user_id = ?
            ");
            $stmt->execute([$newPasswordHash, $userId]);
            
            return [
                'success' => true,
                'message' => 'Password changed successfully'
            ];
            
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Upload user avatar
     */
    public function uploadAvatar($userId, $file) {
        try {
            // Validate file
            $allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
            $maxSize = 5 * 1024 * 1024; // 5MB
            
            if (!in_array($file['type'], $allowedTypes)) {
                throw new Exception('Invalid file type. Only JPEG, PNG, and GIF are allowed.');
            }
            
            if ($file['size'] > $maxSize) {
                throw new Exception('File size too large. Maximum size is 5MB.');
            }
            
            // Create upload directory if it doesn't exist
            $uploadDir = __DIR__ . '/../../assets/uploads/avatars/';
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0755, true);
            }
            
            // Generate unique filename
            $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
            $filename = $userId . '_' . time() . '.' . $extension;
            $uploadPath = $uploadDir . $filename;
            $avatarUrl = '/stop-scrolling/assets/uploads/avatars/' . $filename;
            
            // Move uploaded file
            if (!move_uploaded_file($file['tmp_name'], $uploadPath)) {
                throw new Exception('Failed to upload file');
            }
            
            // Update user avatar URL
            $stmt = $this->conn->prepare("
                UPDATE ss_users SET avatar_url = ?, updated_at = NOW()
                WHERE user_id = ?
            ");
            $stmt->execute([$avatarUrl, $userId]);
            
            return [
                'success' => true,
                'message' => 'Avatar uploaded successfully',
                'data' => ['avatar_url' => $avatarUrl]
            ];
            
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Failed to upload avatar: ' . $e->getMessage()
            ];
        }
    }
    
    /**
     * Delete user account
     */
    public function deleteAccount($userId, $password) {
        try {
            // Verify password before deletion
            $stmt = $this->conn->prepare("
                SELECT password_hash FROM ss_users WHERE user_id = ?
            ");
            $stmt->execute([$userId]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$user) {
                throw new Exception('User not found');
            }
            
            if (!password_verify($password, $user['password_hash'])) {
                throw new Exception('Password is incorrect');
            }
            
            $this->conn->beginTransaction();
            
            // Due to foreign key constraints with CASCADE, 
            // deleting the user will automatically delete related records
            $stmt = $this->conn->prepare("DELETE FROM ss_users WHERE user_id = ?");
            $stmt->execute([$userId]);
            
            $this->conn->commit();
            
            return [
                'success' => true,
                'message' => 'Account deleted successfully'
            ];
            
        } catch (Exception $e) {
            $this->conn->rollBack();
            return [
                'success' => false,
                'message' => 'Failed to delete account: ' . $e->getMessage()
            ];
        }
    }
    
    /**
     * Export user data
     */
    public function exportUserData($userId) {
        try {
            $exportData = [];
            
            // Get user profile data
            $profileResult = $this->getProfile($userId);
            if ($profileResult['success']) {
                $exportData['profile'] = $profileResult['data'];
            }
            
            // Get activity history
            require_once __DIR__ . '/Activity.php';
            $activityModel = new Activity();
            $historyResult = $activityModel->getHistory($userId, ['limit' => 1000]);
            
            if ($historyResult['success']) {
                $exportData['activity_history'] = $historyResult['activities'];
            }
            
            // Get achievements (if they exist)
            $stmt = $this->conn->prepare("
                SELECT b.badge_name, ua.earned_at, ua.progress
                FROM ss_user_achievements ua
                JOIN ss_badges b ON ua.badge_id = b.badge_id
                WHERE ua.user_id = ?
                ORDER BY ua.earned_at DESC
            ");
            $stmt->execute([$userId]);
            $exportData['achievements'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Add export metadata
            $exportData['exported_at'] = date('Y-m-d H:i:s');
            $exportData['version'] = '1.0';
            
            return [
                'success' => true,
                'data' => $exportData
            ];
            
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Failed to export data: ' . $e->getMessage()
            ];
        }
    }
}