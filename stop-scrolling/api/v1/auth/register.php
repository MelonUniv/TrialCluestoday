<?php
/**
 * User Registration Endpoint
 * POST /api/v1/auth/register
 */

require_once __DIR__ . '/../../../lib/core/Database.php';
require_once __DIR__ . '/../../../lib/core/Auth.php';

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

// Validate required fields
$requiredFields = ['email', 'password', 'username'];
$errors = [];

foreach ($requiredFields as $field) {
    if (empty($input[$field])) {
        $errors[] = ucfirst($field) . ' is required';
    }
}

// Validate email format
if (!empty($input['email']) && !filter_var($input['email'], FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'Invalid email format';
}

// Validate username format (3-20 characters, alphanumeric and underscore)
if (!empty($input['username']) && !preg_match('/^[a-zA-Z0-9_]{3,20}$/', $input['username'])) {
    $errors[] = 'Username must be 3-20 characters and contain only letters, numbers, and underscores';
}

// Validate password strength (minimum 8 characters)
if (!empty($input['password']) && strlen($input['password']) < 8) {
    $errors[] = 'Password must be at least 8 characters long';
}

// Return validation errors
if (!empty($errors)) {
    http_response_code(422);
    echo json_encode([
        'success' => false,
        'message' => 'Validation failed',
        'errors' => $errors
    ]);
    exit;
}

try {
    $db = Database::getInstance();
    $conn = $db->getConnection();
    
    // Check if email already exists
    $stmt = $conn->prepare("
        SELECT user_id FROM " . DB_PREFIX . "users 
        WHERE email = ? LIMIT 1
    ");
    $stmt->execute([$input['email']]);
    
    if ($stmt->rowCount() > 0) {
        http_response_code(409);
        echo json_encode([
            'success' => false,
            'message' => 'Email already registered'
        ]);
        exit;
    }
    
    // Check if username already exists
    $stmt = $conn->prepare("
        SELECT user_id FROM " . DB_PREFIX . "users 
        WHERE username = ? LIMIT 1
    ");
    $stmt->execute([$input['username']]);
    
    if ($stmt->rowCount() > 0) {
        http_response_code(409);
        echo json_encode([
            'success' => false,
            'message' => 'Username already taken'
        ]);
        exit;
    }
    
    // Begin transaction
    $conn->beginTransaction();
    
    // Generate user ID
    $stmt = $conn->query("SELECT UUID() as uuid");
    $userId = $stmt->fetch()['uuid'];
    
    // Hash password
    $passwordHash = Auth::hashPassword($input['password']);
    
    // Generate verification token
    $verificationToken = Auth::generateRandomToken();
    
    // Insert user
    $stmt = $conn->prepare("
        INSERT INTO " . DB_PREFIX . "users 
        (user_id, email, username, password_hash, is_active, is_verified, account_type, created_at, updated_at) 
        VALUES (?, ?, ?, ?, 1, 0, 'free', NOW(), NOW())
    ");
    
    $stmt->execute([
        $userId,
        $input['email'],
        $input['username'],
        $passwordHash
    ]);
    
    // Create user profile (cognitive_type defaults to 'logical')
    $stmt = $conn->prepare("
        INSERT INTO " . DB_PREFIX . "user_profiles 
        (profile_id, user_id, display_name, cognitive_type, experience_level, created_at) 
        VALUES (UUID(), ?, ?, 'logical', 'beginner', NOW())
    ");
    $stmt->execute([$userId, $input['username']]);
    
    // Create user settings with correct columns
    $stmt = $conn->prepare("
        INSERT INTO " . DB_PREFIX . "user_settings 
        (setting_id, user_id, theme, sound_enabled, haptic_feedback, difficulty_mode, weekly_report_enabled, share_progress, created_at) 
        VALUES (UUID(), ?, 'light', 1, 1, 'adaptive', 1, 0, NOW())
    ");
    $stmt->execute([$userId]);
    
    // Create user statistics entry with correct columns
    $stmt = $conn->prepare("
        INSERT INTO " . DB_PREFIX . "user_statistics 
        (stat_id, user_id, total_sessions, total_time_spent_seconds, total_activities_completed, total_points, current_level, created_at) 
        VALUES (UUID(), ?, 0, 0, 0, 0, 1, NOW())
    ");
    $stmt->execute([$userId]);
    
    // Store verification token (for email verification)
    $stmt = $conn->prepare("
        INSERT INTO " . DB_PREFIX . "password_resets 
        (reset_id, user_id, token_hash, expires_at, created_at) 
        VALUES (UUID(), ?, ?, DATE_ADD(NOW(), INTERVAL 24 HOUR), NOW())
    ");
    $verificationTokenHash = hash('sha256', $verificationToken);
    $stmt->execute([$userId, $verificationTokenHash]);
    
    // Commit transaction
    $conn->commit();
    
    // Generate tokens
    $auth = new Auth();
    $accessToken = $auth->generateToken($userId, 'access');
    $refreshToken = $auth->generateToken($userId, 'refresh');
    
    // Create session
    $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? '';
    $ipAddress = $_SERVER['REMOTE_ADDR'] ?? '';
    $auth->createSession($userId, $accessToken, $userAgent, $ipAddress);
    
    // TODO: Send verification email
    // For now, we'll include the verification token in the response (remove in production)
    
    // Return success response
    http_response_code(201);
    echo json_encode([
        'success' => true,
        'message' => 'Registration successful. Please verify your email.',
        'data' => [
            'user' => [
                'id' => $userId,
                'email' => $input['email'],
                'username' => $input['username'],
                'account_type' => 'free',
                'is_verified' => false
            ],
            'tokens' => [
                'access_token' => $accessToken,
                'refresh_token' => $refreshToken,
                'token_type' => 'Bearer',
                'expires_in' => JWT_EXPIRY
            ],
            'verification_token' => $verificationToken // Remove in production
        ]
    ]);
    
} catch (Exception $e) {
    // Rollback transaction on error
    if (isset($conn) && $conn->inTransaction()) {
        $conn->rollback();
    }
    
    error_log("Registration failed: " . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => APP_DEBUG ? $e->getMessage() : 'Registration failed. Please try again.'
    ]);
}