<?php
/**
 * Streaks Router
 * Routes requests to appropriate streak endpoints
 */

// Parse action from path
$action = $pathParts[1] ?? '';

switch ($action) {
    case 'current':
        require __DIR__ . '/current.php';
        break;
        
    case 'update':
        require __DIR__ . '/update.php';
        break;
        
    default:
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'Streak endpoint not found'
        ]);
        break;
}