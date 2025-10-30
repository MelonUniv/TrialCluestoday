<?php
/**
 * Authentication Middleware
 * Provides authentication and authorization functions for API endpoints
 */

require_once __DIR__ . '/Database.php';
require_once __DIR__ . '/JWT.php';
require_once __DIR__ . '/../helpers/functions.php';

/**
 * Authenticate user from JWT token in Authorization header
 * 
 * @return array|false User data if authenticated, false otherwise
 */
function authenticateUser() {
    $token = getBearerToken();
    
    if (!$token) {
        return false;
    }
    
    try {
        // Decode and validate JWT
        $payload = JWT::decode($token);
        
        if (!$payload || empty($payload['sub'])) {
            return false;
        }
        
        // Get user from database
        $db = Database::getInstance();
        $conn = $db->getConnection();
        $conn->exec("USE trialcluestoday_restaurant_ms");
        
        $stmt = $conn->prepare("
            SELECT u.user_id, u.email, u.username, u.account_type, u.is_active, u.is_verified,
                   up.experience_level, up.cognitive_type
            FROM ss_users u
            LEFT JOIN ss_user_profiles up ON u.user_id = up.user_id
            WHERE u.user_id = ? AND u.is_active = 1
            LIMIT 1
        ");
        
        $stmt->execute([$payload['sub']]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$user) {
            return false;
        }
        
        // Check if session is still valid
        $stmt = $conn->prepare("
            SELECT session_id, expires_at 
            FROM ss_auth_sessions 
            WHERE user_id = ? AND access_token = ? AND expires_at > NOW()
            LIMIT 1
        ");
        
        $stmt->execute([$user['user_id'], $token]);
        $session = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$session) {
            return false;
        }
        
        // Update last activity
        $stmt = $conn->prepare("
            UPDATE ss_auth_sessions 
            SET last_activity = NOW() 
            WHERE session_id = ?
        ");
        $stmt->execute([$session['session_id']]);
        
        return $user;
        
    } catch (Exception $e) {
        error_log("Authentication error: " . $e->getMessage());
        return false;
    }
}

// getBearerToken function is imported from helpers/functions.php

/**
 * Require authentication for the current request
 * Sends 401 response if not authenticated
 * 
 * @return array User data
 */
function requireAuth() {
    $user = authenticateUser();
    
    if (!$user) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'message' => 'Authentication required'
        ]);
        exit;
    }
    
    return $user;
}

/**
 * Check if user has specific role or permission
 * 
 * @param array $user User data
 * @param string $role Required role
 * @return bool
 */
function hasRole($user, $role) {
    return isset($user['account_type']) && $user['account_type'] === $role;
}

/**
 * Require specific role for the current request
 * 
 * @param array $user User data
 * @param string $role Required role
 */
function requireRole($user, $role) {
    if (!hasRole($user, $role)) {
        http_response_code(403);
        echo json_encode([
            'success' => false,
            'message' => 'Insufficient permissions'
        ]);
        exit;
    }
}