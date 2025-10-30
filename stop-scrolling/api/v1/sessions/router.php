<?php
/**
 * Sessions Router
 * Routes requests to appropriate session endpoints
 */

// Parse action from path
$action = $pathParts[1] ?? '';

switch ($action) {
    case '':
        // Default sessions listing
        require __DIR__ . '/index.php';
        break;
        
    case 'start-flow':
        require __DIR__ . '/start-flow.php';
        break;
        
    case 'next-activity':
        require __DIR__ . '/next-activity.php';
        break;
        
    default:
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'Session endpoint not found'
        ]);
        break;
}