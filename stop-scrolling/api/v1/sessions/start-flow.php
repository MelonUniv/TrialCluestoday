<?php
/**
 * Start Flow Session API Endpoint
 * POST /api/v1/sessions/start-flow
 * 
 * Starts a new interactive flow session for the user
 */

require_once __DIR__ . '/../../../lib/core/Database.php';
require_once __DIR__ . '/../../../lib/core/Auth.php';
require_once __DIR__ . '/../../../lib/helpers/functions.php';

// Set content type
header('Content-Type: application/json');

// Handle preflight CORS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

try {
    // Get JWT token from Authorization header
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? '';
    
    if (!preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Authorization token required']);
        exit();
    }
    
    $token = $matches[1];
    $auth = new Auth();
    $payload = $auth->validateToken($token);
    
    if (!$payload) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Invalid or expired token']);
        exit();
    }
    
    $userId = $payload['sub'];
    
    // Get request data
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Validate input
    $sessionType = $input['type'] ?? 'quick';
    $config = $input['config'] ?? [];
    
    // Validate session type
    $validTypes = ['quick', 'focus', 'deep', 'endless', 'daily', 'custom'];
    if (!in_array($sessionType, $validTypes)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid session type']);
        exit();
    }
    
    // Get database connection
    $db = Database::getInstance();
    $conn = $db->getConnection();
    $conn->exec("USE trialcluestoday_restaurant_ms");
    
    // Check for existing active session
    $stmt = $conn->prepare("
        SELECT session_flow_id 
        FROM ss_user_sessions_flow 
        WHERE user_id = ? 
        AND session_state IN ('initializing', 'active', 'paused')
        LIMIT 1
    ");
    $stmt->execute([$userId]);
    
    if ($stmt->rowCount() > 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'An active session already exists. Please complete or end it first.']);
        exit();
    }
    
    // Get user's flow preferences
    $stmt = $conn->prepare("
        SELECT * FROM ss_flow_preferences 
        WHERE user_id = ?
    ");
    $stmt->execute([$userId]);
    $preferences = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Merge preferences with config
    $sessionConfig = array_merge([
        'pattern' => $preferences['preferred_pattern'] ?? 'balanced',
        'difficultyMode' => $preferences['preferred_difficulty_mode'] ?? 'adaptive',
        'autoAdvance' => $preferences['auto_advance_enabled'] ?? true,
        'transitions' => $preferences['transitions_enabled'] ?? true,
        'breakFrequency' => $preferences['break_frequency'] ?? 3,
        'breakDuration' => $preferences['break_duration'] ?? 30
    ], $config);
    
    // Define session parameters based on type
    $sessionParams = [
        'quick' => ['duration' => 5, 'activities' => 3],
        'focus' => ['duration' => 15, 'activities' => 5],
        'deep' => ['duration' => 30, 'activities' => 10],
        'endless' => ['duration' => null, 'activities' => null],
        'daily' => ['duration' => null, 'activities' => 15],
        'custom' => [
            'duration' => $config['duration'] ?? 15,
            'activities' => $config['activities'] ?? 5
        ]
    ];
    
    $params = $sessionParams[$sessionType];
    
    // Get available content based on preferences
    $excludeCategories = json_decode($preferences['exclude_categories'] ?? '[]', true);
    $categoryPreferences = json_decode($preferences['category_preferences'] ?? '{}', true);
    
    $query = "SELECT * FROM ss_contents WHERE is_active = 1";
    $queryParams = [];
    
    if (!empty($excludeCategories)) {
        $placeholders = array_fill(0, count($excludeCategories), '?');
        $query .= " AND category NOT IN (" . implode(',', $placeholders) . ")";
        $queryParams = array_merge($queryParams, $excludeCategories);
    }
    
    $query .= " ORDER BY RAND() LIMIT 50";
    
    $stmt = $conn->prepare($query);
    $stmt->execute($queryParams);
    $availableContent = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Generate activity sequence
    $sequence = generateActivitySequence(
        $availableContent,
        $params['activities'] ?? 10,
        $sessionConfig['pattern'],
        $userId
    );
    
    // Create session record
    $sessionFlowId = generateUUID();
    $stmt = $conn->prepare("
        INSERT INTO ss_user_sessions_flow (
            session_flow_id,
            user_id,
            session_type,
            session_state,
            activities_sequence,
            total_activities,
            session_config,
            started_at
        ) VALUES (?, ?, ?, 'initializing', ?, ?, ?, NOW())
    ");
    
    $stmt->execute([
        $sessionFlowId,
        $userId,
        $sessionType,
        json_encode($sequence),
        count($sequence),
        json_encode($sessionConfig)
    ]);
    
    // Update session state to active
    $conn->prepare("
        UPDATE ss_user_sessions_flow 
        SET session_state = 'active' 
        WHERE session_flow_id = ?
    ")->execute([$sessionFlowId]);
    
    // Prepare response
    $response = [
        'sessionId' => $sessionFlowId,
        'type' => $sessionType,
        'duration' => $params['duration'],
        'totalActivities' => count($sequence),
        'config' => $sessionConfig,
        'sequence' => array_map(function($item) {
            return [
                'contentId' => $item['content_id'],
                'title' => $item['title'],
                'category' => $item['category'],
                'difficulty' => $item['difficulty_level'],
                'estimatedDuration' => $item['estimated_duration_seconds']
            ];
        }, array_slice($sequence, 0, 3)) // Return first 3 for preview
    ];
    
    echo json_encode([
        'success' => true, 
        'message' => 'Flow session started successfully',
        'data' => $response
    ]);
    
} catch (Exception $e) {
    error_log("Start flow session error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to start flow session']);
}

/**
 * Generate activity sequence based on pattern
 */
function generateActivitySequence($content, $count, $pattern, $userId) {
    $patterns = [
        'balanced' => ['memory_game', 'puzzle', 'trivia', 'meditation'],
        'cognitive' => ['puzzle', 'memory_game', 'trivia', 'puzzle', 'meditation'],
        'relaxed' => ['trivia', 'meditation', 'puzzle', 'meditation', 'memory_game'],
        'challenge' => ['memory_game', 'puzzle', 'memory_game', 'trivia', 'challenge']
    ];
    
    $selectedPattern = $patterns[$pattern] ?? $patterns['balanced'];
    $sequence = [];
    
    // Group content by category
    $contentByCategory = [];
    foreach ($content as $item) {
        $contentByCategory[$item['category']][] = $item;
    }
    
    // Build sequence
    for ($i = 0; $i < $count; $i++) {
        $categoryIndex = $i % count($selectedPattern);
        $targetCategory = $selectedPattern[$categoryIndex];
        
        if (isset($contentByCategory[$targetCategory]) && !empty($contentByCategory[$targetCategory])) {
            // Pick a random content from category
            $categoryContent = $contentByCategory[$targetCategory];
            $randomIndex = array_rand($categoryContent);
            $selectedContent = $categoryContent[$randomIndex];
            
            // Add to sequence
            $sequence[] = $selectedContent;
            
            // Remove from available pool to avoid duplicates
            unset($contentByCategory[$targetCategory][$randomIndex]);
            $contentByCategory[$targetCategory] = array_values($contentByCategory[$targetCategory]);
        } else {
            // Fallback to any available content
            if (!empty($content)) {
                $randomContent = $content[array_rand($content)];
                $sequence[] = $randomContent;
            }
        }
    }
    
    return $sequence;
}

?>