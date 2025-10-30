<?php
/**
 * Single Content API Endpoint
 * Handle GET requests for individual content items
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
    // Get content ID from URL parameter
    $contentId = $_GET['id'] ?? '';
    
    if (empty($contentId)) {
        Response::error('Content ID is required', 400);
    }
    
    // Validate UUID format
    if (!preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i', $contentId)) {
        Response::error('Invalid content ID format', 400);
    }
    
    // Get content
    $content = $contentModel->getById($contentId);
    
    if (!$content) {
        Response::notFound('Content not found');
    }
    
    // Get related content
    $relatedContent = $contentModel->getRelated($contentId, 5);
    
    // Increment view count
    $contentModel->incrementViews($contentId);
    
    // Format response
    $response = [
        'content' => $content,
        'related' => $relatedContent
    ];
    
    Response::success($response, 'Content retrieved successfully');
    
} catch (Exception $e) {
    error_log("Content Get API Error: " . $e->getMessage());
    Response::serverError('Failed to retrieve content');
}