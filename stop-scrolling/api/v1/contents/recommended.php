<?php
/**
 * Recommended Content API Endpoint
 * Handle GET requests for personalized content recommendations
 */

require_once __DIR__ . '/../../../lib/helpers/Response.php';
require_once __DIR__ . '/../../../lib/models/Content.php';
require_once __DIR__ . '/../../../config/app.php';

// Apply CORS headers
Response::applyCorsHeaders();

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::methodNotAllowed(['GET']);
}

// Initialize content model
$contentModel = new Content();

try {
    // Get user ID (in a real app with auth, this would come from the token)
    $userId = $_GET['user_id'] ?? '';
    
    // Get limit
    $limit = min((int)($_GET['limit'] ?? 10), 20); // Max 20 recommendations
    
    if (empty($userId)) {
        // If no user ID provided, return popular content
        $recommendations = $contentModel->getPopular($limit);
        $recommendationType = 'popular';
    } else {
        // Get personalized recommendations
        $recommendations = $contentModel->getRecommended($userId, $limit);
        $recommendationType = 'personalized';
        
        // If no personalized content found, fall back to popular
        if (empty($recommendations)) {
            $recommendations = $contentModel->getPopular($limit);
            $recommendationType = 'popular_fallback';
        }
    }
    
    // Format response
    $response = [
        'recommendations' => $recommendations,
        'type' => $recommendationType,
        'count' => count($recommendations),
        'generated_at' => date('Y-m-d H:i:s')
    ];
    
    Response::success($response, 'Recommendations retrieved successfully');
    
} catch (Exception $e) {
    error_log("Recommendations API Error: " . $e->getMessage());
    Response::serverError('Failed to retrieve recommendations');
}