<?php
/**
 * Performance Summary API Endpoint
 * GET /api/v1/performance/summary
 * 
 * Returns user's performance summary and analytics
 */

require_once __DIR__ . '/../../../lib/helpers/Response.php';
require_once __DIR__ . '/../../../lib/core/JWT.php';
require_once __DIR__ . '/../../../lib/models/PerformanceTracker.php';

// Apply CORS headers
Response::applyCorsHeaders();

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::methodNotAllowed(['GET']);
}

try {
    // Verify JWT token
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? '';
    
    if (!preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
        Response::error('Authorization token required', 401);
    }
    
    $token = $matches[1];
    $jwt = new JWT();
    $payload = $jwt->decode($token);
    
    if (!$payload) {
        Response::error('Invalid or expired token', 401);
    }
    
    $userId = $payload['sub'];
    
    // Get query parameters
    $period = isset($_GET['period']) ? intval($_GET['period']) : 7;
    $period = min(30, max(1, $period)); // Limit to 1-30 days
    
    // Get performance summary
    $tracker = new PerformanceTracker();
    $summary = $tracker->getPerformanceSummary($userId, $period);
    
    if (!$summary) {
        Response::error('Failed to retrieve performance data', 500);
    }
    
    // Calculate additional insights
    $insights = [];
    
    if ($summary['summary']['total_activities'] > 0) {
        // Performance level
        $avgAccuracy = $summary['summary']['avg_accuracy'] ?? 0;
        if ($avgAccuracy >= 0.85) {
            $insights['level'] = 'Expert';
            $insights['message'] = 'Outstanding performance! You\'re mastering the challenges.';
        } elseif ($avgAccuracy >= 0.70) {
            $insights['level'] = 'Proficient';
            $insights['message'] = 'Great work! You\'re performing well across activities.';
        } elseif ($avgAccuracy >= 0.55) {
            $insights['level'] = 'Developing';
            $insights['message'] = 'Good progress! Keep practicing to improve.';
        } else {
            $insights['level'] = 'Beginner';
            $insights['message'] = 'You\'re learning! Focus on easier activities to build confidence.';
        }
        
        // Fatigue insights
        $avgFatigue = $summary['summary']['avg_fatigue'] ?? 0;
        if ($avgFatigue > 0.7) {
            $insights['fatigue_warning'] = 'You may be overworking. Consider more breaks.';
        } elseif ($avgFatigue < 0.3) {
            $insights['fatigue_status'] = 'Your energy levels are great!';
        }
        
        // Best category
        if (!empty($summary['categories'])) {
            $bestCategory = array_reduce($summary['categories'], function($best, $cat) {
                return (!$best || $cat['avg_accuracy'] > $best['avg_accuracy']) ? $cat : $best;
            });
            $insights['best_category'] = $bestCategory['category'];
            $insights['best_category_accuracy'] = round($bestCategory['avg_accuracy'] * 100) . '%';
        }
        
        // Improvement trend
        if (!empty($summary['trend']) && count($summary['trend']) > 1) {
            $firstDay = reset($summary['trend']);
            $lastDay = end($summary['trend']);
            $improvement = $lastDay['avg_accuracy'] - $firstDay['avg_accuracy'];
            
            if ($improvement > 0.1) {
                $insights['trend'] = 'improving';
                $insights['trend_message'] = 'Your performance is improving!';
            } elseif ($improvement < -0.1) {
                $insights['trend'] = 'declining';
                $insights['trend_message'] = 'Your performance has declined. Consider easier activities.';
            } else {
                $insights['trend'] = 'stable';
                $insights['trend_message'] = 'Your performance is consistent.';
            }
        }
    }
    
    // Format response
    $response = [
        'period' => $period,
        'summary' => [
            'totalActivities' => $summary['summary']['total_activities'] ?? 0,
            'avgAccuracy' => round(($summary['summary']['avg_accuracy'] ?? 0) * 100, 1),
            'avgSpeed' => round(($summary['summary']['avg_speed'] ?? 0) * 100, 1),
            'totalScore' => $summary['summary']['total_score'] ?? 0,
            'totalSessions' => $summary['summary']['total_sessions'] ?? 0,
            'categoriesPlayed' => $summary['summary']['categories_played'] ?? 0,
            'maxDifficulty' => $summary['summary']['max_difficulty'] ?? 1,
            'excellentCount' => $summary['summary']['excellent_count'] ?? 0,
            'goodCount' => $summary['summary']['good_count'] ?? 0,
            'strugglingCount' => $summary['summary']['struggling_count'] ?? 0
        ],
        'categories' => array_map(function($cat) {
            return [
                'name' => $cat['category'],
                'count' => $cat['count'],
                'avgAccuracy' => round($cat['avg_accuracy'] * 100, 1),
                'avgScore' => round($cat['avg_score'])
            ];
        }, $summary['categories']),
        'trend' => array_map(function($day) {
            return [
                'date' => $day['date'],
                'accuracy' => round($day['avg_accuracy'] * 100, 1),
                'cognitiveLoad' => round($day['avg_load'], 1),
                'activities' => $day['activities']
            ];
        }, $summary['trend']),
        'insights' => $insights
    ];
    
    Response::success($response, 'Performance summary retrieved successfully');
    
} catch (Exception $e) {
    error_log("Performance summary error: " . $e->getMessage());
    Response::serverError('Failed to retrieve performance summary');
}