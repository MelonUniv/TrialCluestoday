<?php
/**
 * API Configuration
 * Settings specific to the REST API
 */

// API Versioning
define('API_CURRENT_VERSION', 'v1');
define('API_SUPPORTED_VERSIONS', ['v1']);
define('API_DEPRECATION_NOTICE', 30); // days before deprecation

// Response Format
define('API_DEFAULT_FORMAT', 'json');
define('API_SUPPORTED_FORMATS', ['json']);

// API Endpoints Configuration
define('API_ENDPOINTS', [
    // Authentication
    'auth' => [
        'login' => ['method' => 'POST', 'auth' => false],
        'register' => ['method' => 'POST', 'auth' => false],
        'logout' => ['method' => 'POST', 'auth' => true],
        'refresh' => ['method' => 'POST', 'auth' => false],
        'verify' => ['method' => 'GET', 'auth' => false],
        'forgot-password' => ['method' => 'POST', 'auth' => false],
        'reset-password' => ['method' => 'POST', 'auth' => false],
    ],
    
    // User Management
    'users' => [
        'profile' => ['method' => 'GET,PUT', 'auth' => true],
        'settings' => ['method' => 'GET,PUT', 'auth' => true],
        'interests' => ['method' => 'GET,PUT', 'auth' => true],
        'avatar' => ['method' => 'POST', 'auth' => true],
        'delete' => ['method' => 'DELETE', 'auth' => true],
    ],
    
    // Content
    'contents' => [
        'list' => ['method' => 'GET', 'auth' => false],
        'get' => ['method' => 'GET', 'auth' => false],
        'categories' => ['method' => 'GET', 'auth' => false],
        'recommended' => ['method' => 'GET', 'auth' => true],
        'search' => ['method' => 'GET', 'auth' => false],
    ],
    
    // Activities
    'activities' => [
        'start' => ['method' => 'POST', 'auth' => true],
        'update' => ['method' => 'PUT', 'auth' => true],
        'complete' => ['method' => 'POST', 'auth' => true],
        'history' => ['method' => 'GET', 'auth' => true],
    ],
    
    // Statistics
    'stats' => [
        'overview' => ['method' => 'GET', 'auth' => true],
        'detailed' => ['method' => 'GET', 'auth' => true],
        'charts' => ['method' => 'GET', 'auth' => true],
    ],
    
    // Gamification
    'gamification' => [
        'achievements' => ['method' => 'GET', 'auth' => true],
        'leaderboard' => ['method' => 'GET', 'auth' => false],
        'challenges' => ['method' => 'GET', 'auth' => true],
        'streaks' => ['method' => 'GET', 'auth' => true],
    ],
]);

// Rate Limiting Configuration
define('RATE_LIMITS', [
    'default' => ['requests' => 100, 'window' => 60],
    'auth/login' => ['requests' => 5, 'window' => 60],
    'auth/register' => ['requests' => 3, 'window' => 60],
    'auth/forgot-password' => ['requests' => 3, 'window' => 300],
    'users/avatar' => ['requests' => 5, 'window' => 300],
]);

// API Response Codes
define('API_CODES', [
    'SUCCESS' => 200,
    'CREATED' => 201,
    'ACCEPTED' => 202,
    'NO_CONTENT' => 204,
    'BAD_REQUEST' => 400,
    'UNAUTHORIZED' => 401,
    'FORBIDDEN' => 403,
    'NOT_FOUND' => 404,
    'METHOD_NOT_ALLOWED' => 405,
    'CONFLICT' => 409,
    'UNPROCESSABLE_ENTITY' => 422,
    'TOO_MANY_REQUESTS' => 429,
    'SERVER_ERROR' => 500,
]);

// API Messages
define('API_MESSAGES', [
    'SUCCESS' => 'Request successful',
    'CREATED' => 'Resource created successfully',
    'UNAUTHORIZED' => 'Authentication required',
    'FORBIDDEN' => 'Access denied',
    'NOT_FOUND' => 'Resource not found',
    'VALIDATION_ERROR' => 'Validation failed',
    'RATE_LIMIT' => 'Too many requests, please try again later',
    'SERVER_ERROR' => 'An error occurred, please try again',
]);

// Validation Rules
define('VALIDATION_RULES', [
    'email' => '/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/',
    'username' => '/^[a-zA-Z0-9_]{3,20}$/',
    'password' => '/^.{8,}$/', // minimum 8 characters
    'uuid' => '/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i',
]);