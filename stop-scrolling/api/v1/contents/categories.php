<?php
/**
 * Content Categories API Endpoint
 * Handle GET requests for content categories
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
    // Get categories with content count
    $categories = $contentModel->getCategories();
    
    // Add category metadata (icons, descriptions)
    $categoryMeta = [
        'memory_game' => [
            'name' => 'Memory Games',
            'icon' => '🧠',
            'description' => 'Enhance your memory with challenging games',
            'color' => '#667eea'
        ],
        'puzzle' => [
            'name' => 'Puzzles',
            'icon' => '🧩', 
            'description' => 'Logic puzzles to sharpen your mind',
            'color' => '#48bb78'
        ],
        'trivia' => [
            'name' => 'Trivia',
            'icon' => '❓',
            'description' => 'Test your knowledge across various topics',
            'color' => '#ed8936'
        ],
        'meditation' => [
            'name' => 'Meditation',
            'icon' => '🧘',
            'description' => 'Mindfulness and relaxation exercises',
            'color' => '#9f7aea'
        ],
        'article' => [
            'name' => 'Articles',
            'icon' => '📖',
            'description' => 'Educational content and insights',
            'color' => '#38b2ac'
        ],
        'challenge' => [
            'name' => 'Challenges',
            'icon' => '🏆',
            'description' => 'Multi-part challenges to test your skills',
            'color' => '#f56565'
        ]
    ];
    
    // Merge category data with metadata
    $categoriesWithMeta = array_map(function($category) use ($categoryMeta) {
        $categoryKey = $category['category'];
        $meta = $categoryMeta[$categoryKey] ?? [
            'name' => ucfirst(str_replace('_', ' ', $categoryKey)),
            'icon' => '📋',
            'description' => 'Various activities',
            'color' => '#4a5568'
        ];
        
        return array_merge($category, $meta);
    }, $categories);
    
    // Sort by content count (most popular first)
    usort($categoriesWithMeta, function($a, $b) {
        return $b['content_count'] - $a['content_count'];
    });
    
    Response::success($categoriesWithMeta, 'Categories retrieved successfully');
    
} catch (Exception $e) {
    error_log("Categories API Error: " . $e->getMessage());
    Response::serverError('Failed to retrieve categories');
}