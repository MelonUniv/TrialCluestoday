<?php
/**
 * User Login Endpoint
 * POST /api/v1/auth/login
 */

require_once __DIR__ . '/../../../lib/core/Database.php';
require_once __DIR__ . '/../../../lib/core/Auth.php';

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

// Validate required fields
if (empty($input['email']) || empty($input['password'])) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Email and password are required'
    ]);
    exit;
}

try {
    $db = Database::getInstance();
    $conn = $db->getConnection();
    
    // Find user by email
    $stmt = $conn->prepare("
        SELECT user_id, email, username, password_hash, is_active, is_verified, account_type, last_login_at
        FROM " . DB_PREFIX . "users 
        WHERE email = ? 
        LIMIT 1
    ");
    $stmt->execute([$input['email']]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Check if user exists
    if (!$user) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'message' => 'Invalid email or password'
        ]);
        exit;
    }
    
    // Verify password
    if (!Auth::verifyPassword($input['password'], $user['password_hash'])) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'message' => 'Invalid email or password'
        ]);
        exit;
    }
    
    // Check if account is active
    if (!$user['is_active']) {
        http_response_code(403);
        echo json_encode([
            'success' => false,
            'message' => 'Your account has been deactivated. Please contact support.'
        ]);
        exit;
    }
    
    // Warning if email not verified (but still allow login)
    $verificationWarning = null;
    if (!$user['is_verified']) {
        $verificationWarning = 'Please verify your email address to access all features.';
    }
    
    // Generate tokens
    $auth = new Auth();
    $accessToken = $auth->generateToken($user['user_id'], 'access');
    $refreshToken = $auth->generateToken($user['user_id'], 'refresh');
    
    // Create session
    $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? '';
    $ipAddress = $_SERVER['REMOTE_ADDR'] ?? '';
    $auth->createSession($user['user_id'], $accessToken, $userAgent, $ipAddress);
    
    // Update last login time
    $stmt = $conn->prepare("
        UPDATE " . DB_PREFIX . "users 
        SET last_login_at = NOW() 
        WHERE user_id = ?
    ");
    $stmt->execute([$user['user_id']]);
    
    // Get user profile data
    $stmt = $conn->prepare("
        SELECT display_name, bio, avatar_url, cognitive_type, experience_level
        FROM " . DB_PREFIX . "user_profiles 
        WHERE user_id = ?
    ");
    $stmt->execute([$user['user_id']]);
    $profile = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Get user statistics
    $stmt = $conn->prepare("
        SELECT total_points, current_level, total_activities_completed
        FROM " . DB_PREFIX . "user_statistics 
        WHERE user_id = ?
    ");
    $stmt->execute([$user['user_id']]);
    $stats = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Get current streak
    $stmt = $conn->prepare("
        SELECT current_streak, longest_streak, last_activity_date
        FROM " . DB_PREFIX . "user_streaks 
        WHERE user_id = ?
    ");
    $stmt->execute([$user['user_id']]);
    $streak = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Return success response
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Login successful',
        'warning' => $verificationWarning,
        'data' => [
            'user' => [
                'id' => $user['user_id'],
                'email' => $user['email'],
                'username' => $user['username'],
                'account_type' => $user['account_type'],
                'is_verified' => (bool)$user['is_verified'],
                'last_login' => $user['last_login_at']
            ],
            'profile' => $profile ?: [
                'display_name' => $user['username'],
                'bio' => null,
                'avatar_url' => null,
                'cognitive_type' => 'logical',
                'experience_level' => 'beginner'
            ],
            'stats' => $stats ?: [
                'total_points' => 0,
                'current_level' => 1,
                'total_activities_completed' => 0
            ],
            'streak' => $streak ?: [
                'current_streak' => 0,
                'longest_streak' => 0,
                'last_activity_date' => null
            ],
            'tokens' => [
                'access_token' => $accessToken,
                'refresh_token' => $refreshToken,
                'token_type' => 'Bearer',
                'expires_in' => JWT_EXPIRY
            ]
        ]
    ]);
    
} catch (Exception $e) {
    error_log("Login failed: " . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => APP_DEBUG ? $e->getMessage() : 'Login failed. Please try again.'
    ]);
}