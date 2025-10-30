<?php
/**
 * Authentication Router
 * Routes authentication-related requests
 */

// Get the action from the path
$action = $pathParts[1] ?? '';

switch ($action) {
    case 'register':
        if ($method === 'POST') {
            require __DIR__ . '/register.php';
        } else {
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Method not allowed']);
        }
        break;
        
    case 'login':
        if ($method === 'POST') {
            require __DIR__ . '/login.php';
        } else {
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Method not allowed']);
        }
        break;
        
    case 'logout':
        if ($method === 'POST') {
            require __DIR__ . '/logout.php';
        } else {
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Method not allowed']);
        }
        break;
        
    case 'refresh':
        if ($method === 'POST') {
            require __DIR__ . '/refresh.php';
        } else {
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Method not allowed']);
        }
        break;
        
    case 'verify':
        if ($method === 'GET') {
            require __DIR__ . '/verify.php';
        } else {
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Method not allowed']);
        }
        break;
        
    case 'forgot-password':
        if ($method === 'POST') {
            require __DIR__ . '/forgot-password.php';
        } else {
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Method not allowed']);
        }
        break;
        
    case 'reset-password':
        if ($method === 'POST') {
            require __DIR__ . '/reset-password.php';
        } else {
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Method not allowed']);
        }
        break;
        
    default:
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Auth endpoint not found']);
        break;
}