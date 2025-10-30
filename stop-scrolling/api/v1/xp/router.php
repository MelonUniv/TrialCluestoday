<?php
/**
 * XP Router
 * Routes requests to appropriate XP endpoints
 */

// Parse action from path
$action = $pathParts[1] ?? '';

switch ($action) {
    case 'progress':
        require __DIR__ . '/progress.php';
        break;
        
    case 'update':
        require __DIR__ . '/update.php';
        break;
        
    default:
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'XP endpoint not found'
        ]);
        break;
}