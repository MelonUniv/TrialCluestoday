<?php
/**
 * Application Configuration
 * Central configuration file for Stop Scrolling app
 */

// Prevent direct access
if (!defined('APP_ROOT')) {
    define('APP_ROOT', dirname(__DIR__));
}

// Environment (development, staging, production)
define('APP_ENV', getenv('APP_ENV') ?: 'development');
define('APP_DEBUG', APP_ENV === 'development');

// Application Settings
define('APP_NAME', 'Stop Scrolling');
define('APP_VERSION', '1.0.0');
define('APP_URL', 'https://trial.cluestoday.com/stop-scrolling');
define('APP_TIMEZONE', 'UTC');

// Database Configuration (using existing connection)
define('DB_HOST', 'localhost');
define('DB_NAME', 'trialcluestoday_restaurant_ms');
define('DB_USER', 'trialcluestoday_root_restaurant');
define('DB_PASS', '[pC]SySmhqdQ]&Z3');
define('DB_PREFIX', 'ss_');
define('DB_CHARSET', 'utf8mb4');

// Session Configuration
define('SESSION_NAME', 'ss_session');
define('SESSION_LIFETIME', 3600); // 1 hour
define('SESSION_PATH', '/stop-scrolling');
define('SESSION_SECURE', true); // Use secure cookies in production
define('SESSION_HTTPONLY', true);

// JWT Configuration
define('JWT_SECRET', 'your-secret-key-change-this-in-production-' . md5(DB_PASS));
define('JWT_ALGORITHM', 'HS256');
define('JWT_EXPIRY', 3600); // 1 hour
define('JWT_REFRESH_EXPIRY', 604800); // 7 days

// File Upload Configuration
define('UPLOAD_MAX_SIZE', 5242880); // 5MB
define('UPLOAD_ALLOWED_TYPES', ['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
define('UPLOAD_PATH', APP_ROOT . '/uploads');

// API Configuration
define('API_VERSION', 'v1');
define('API_RATE_LIMIT', 100); // requests per minute
define('API_RATE_WINDOW', 60); // seconds

// Pagination
define('DEFAULT_PAGE_SIZE', 20);
define('MAX_PAGE_SIZE', 100);

// Cache Configuration
define('CACHE_ENABLED', true);
define('CACHE_TTL', 3600); // 1 hour default

// Email Configuration (update with your SMTP settings)
define('MAIL_FROM_NAME', 'Stop Scrolling');
define('MAIL_FROM_EMAIL', 'noreply@trial.cluestoday.com');
define('MAIL_SMTP_HOST', 'localhost');
define('MAIL_SMTP_PORT', 25);
define('MAIL_SMTP_AUTH', false);
define('MAIL_SMTP_USER', '');
define('MAIL_SMTP_PASS', '');

// Security Configuration
define('BCRYPT_COST', 12);
define('CSRF_TOKEN_NAME', 'ss_csrf_token');
define('CORS_ENABLED', true);
define('CORS_ORIGINS', ['https://trial.cluestoday.com']);

// Feature Flags
define('FEATURE_SOCIAL', true);
define('FEATURE_ACHIEVEMENTS', true);
define('FEATURE_LEADERBOARD', true);
define('FEATURE_DAILY_CHALLENGES', true);
define('FEATURE_PUSH_NOTIFICATIONS', false);

// Game Configuration
define('GAME_MIN_DURATION', 60); // minimum game duration in seconds
define('GAME_MAX_HINTS', 3); // maximum hints per game
define('GAME_STREAK_HOURS', 24); // hours to maintain streak

// Logging Configuration
define('LOG_PATH', APP_ROOT . '/logs');
define('LOG_LEVEL', APP_DEBUG ? 'debug' : 'error');
define('LOG_MAX_FILES', 30);

// Error Reporting
if (APP_DEBUG) {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(E_ERROR | E_WARNING | E_PARSE);
    ini_set('display_errors', 0);
}

// Timezone
date_default_timezone_set(APP_TIMEZONE);

// Autoloader for classes
spl_autoload_register(function ($class) {
    $paths = [
        APP_ROOT . '/lib/core/',
        APP_ROOT . '/lib/models/',
        APP_ROOT . '/lib/helpers/',
    ];
    
    foreach ($paths as $path) {
        $file = $path . $class . '.php';
        if (file_exists($file)) {
            require_once $file;
            return;
        }
    }
});

// Load helper functions
require_once APP_ROOT . '/lib/helpers/functions.php';

// Start session if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_name(SESSION_NAME);
    session_set_cookie_params([
        'lifetime' => SESSION_LIFETIME,
        'path' => SESSION_PATH,
        'secure' => SESSION_SECURE,
        'httponly' => SESSION_HTTPONLY,
        'samesite' => 'Strict'
    ]);
}