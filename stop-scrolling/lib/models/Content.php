<?php
/**
 * Content Model Class
 * Handles all content-related database operations
 */

require_once __DIR__ . '/../core/Database.php';

class Content {
    private $db;
    
    public function __construct($db = null) {
        $this->db = $db ?: Database::getInstance();
    }
    
    /**
     * Get all content with filters and pagination
     */
    public function getAll($filters = [], $pagination = []) {
        $where = [];
        $params = [];
        
        // Default pagination
        $limit = $pagination['limit'] ?? 20;
        $offset = $pagination['offset'] ?? 0;
        
        // Build WHERE clause
        $where[] = "is_active = 1";
        
        if (!empty($filters['category'])) {
            $where[] = "category = ?";
            $params[] = $filters['category'];
        }
        
        if (!empty($filters['difficulty'])) {
            $where[] = "difficulty_level = ?";
            $params[] = (int) $filters['difficulty'];
        }
        
        if (!empty($filters['is_premium'])) {
            $where[] = "is_premium = ?";
            $params[] = (int) $filters['is_premium'];
        }
        
        if (!empty($filters['search'])) {
            $where[] = "(title LIKE ? OR description LIKE ?)";
            $searchTerm = '%' . $filters['search'] . '%';
            $params[] = $searchTerm;
            $params[] = $searchTerm;
        }
        
        // Build ORDER BY clause
        $orderBy = "created_at DESC";
        if (!empty($filters['sort'])) {
            switch ($filters['sort']) {
                case 'newest':
                    $orderBy = "created_at DESC";
                    break;
                case 'oldest':
                    $orderBy = "created_at ASC";
                    break;
                case 'title':
                    $orderBy = "title ASC";
                    break;
                case 'difficulty':
                    $orderBy = "difficulty_level ASC";
                    break;
                case 'duration':
                    $orderBy = "estimated_duration_seconds ASC";
                    break;
            }
        }
        
        $whereClause = implode(' AND ', $where);
        
        $sql = "SELECT 
                    content_id,
                    title,
                    description,
                    category,
                    sub_category,
                    difficulty_level,
                    estimated_duration_seconds,
                    thumbnail_url,
                    is_premium,
                    created_at,
                    updated_at
                FROM ss_contents 
                WHERE $whereClause
                ORDER BY $orderBy
                LIMIT ? OFFSET ?";
        
        $params[] = $limit;
        $params[] = $offset;
        
        return $this->db->fetchAll($sql, $params);
    }
    
    /**
     * Get total count for pagination
     */
    public function getCount($filters = []) {
        $where = [];
        $params = [];
        
        $where[] = "is_active = 1";
        
        if (!empty($filters['category'])) {
            $where[] = "category = ?";
            $params[] = $filters['category'];
        }
        
        if (!empty($filters['difficulty'])) {
            $where[] = "difficulty_level = ?";
            $params[] = (int) $filters['difficulty'];
        }
        
        if (!empty($filters['is_premium'])) {
            $where[] = "is_premium = ?";
            $params[] = (int) $filters['is_premium'];
        }
        
        if (!empty($filters['search'])) {
            $where[] = "(title LIKE ? OR description LIKE ?)";
            $searchTerm = '%' . $filters['search'] . '%';
            $params[] = $searchTerm;
            $params[] = $searchTerm;
        }
        
        $whereClause = implode(' AND ', $where);
        
        $sql = "SELECT COUNT(*) as total FROM ss_contents WHERE $whereClause";
        
        $result = $this->db->fetchOne($sql, $params);
        return (int) $result['total'];
    }
    
    /**
     * Get content by ID
     */
    public function getById($contentId) {
        $sql = "SELECT 
                    content_id,
                    title,
                    description,
                    category,
                    sub_category,
                    difficulty_level,
                    estimated_duration_seconds,
                    content_data,
                    thumbnail_url,
                    is_premium,
                    is_active,
                    created_by,
                    created_at,
                    updated_at
                FROM ss_contents 
                WHERE content_id = ? AND is_active = 1";
        
        $content = $this->db->fetchOne($sql, [$contentId]);
        
        if ($content && !empty($content['content_data'])) {
            $content['content_data'] = json_decode($content['content_data'], true);
        }
        
        return $content;
    }
    
    /**
     * Get content by category
     */
    public function getByCategory($category, $limit = 10) {
        $sql = "SELECT 
                    content_id,
                    title,
                    description,
                    category,
                    sub_category,
                    difficulty_level,
                    estimated_duration_seconds,
                    thumbnail_url,
                    is_premium,
                    created_at
                FROM ss_contents 
                WHERE category = ? AND is_active = 1
                ORDER BY created_at DESC
                LIMIT ?";
        
        return $this->db->fetchAll($sql, [$category, $limit]);
    }
    
    /**
     * Get recommended content for user
     */
    public function getRecommended($userId, $limit = 10) {
        // Get user interests and statistics for recommendations
        $userInterestsSql = "SELECT category, interest_level 
                            FROM ss_user_interests 
                            WHERE user_id = ?
                            ORDER BY interest_level DESC";
        
        $interests = $this->db->fetchAll($userInterestsSql, [$userId]);
        
        if (empty($interests)) {
            // If no interests, return popular content
            return $this->getPopular($limit);
        }
        
        // Build query to get content from user's interested categories
        $categories = array_column($interests, 'category');
        $placeholders = str_repeat('?,', count($categories) - 1) . '?';
        
        $sql = "SELECT 
                    content_id,
                    title,
                    description,
                    category,
                    sub_category,
                    difficulty_level,
                    estimated_duration_seconds,
                    thumbnail_url,
                    is_premium,
                    created_at
                FROM ss_contents 
                WHERE category IN ($placeholders) 
                AND is_active = 1
                ORDER BY 
                    CASE category " . 
                    implode('', array_map(function($i) {
                        return "WHEN ? THEN $i ";
                    }, range(1, count($categories)))) . 
                    "END,
                    created_at DESC
                LIMIT ?";
        
        $params = array_merge($categories, $categories, [$limit]);
        
        return $this->db->fetchAll($sql, $params);
    }
    
    /**
     * Get popular content
     */
    public function getPopular($limit = 10) {
        $sql = "SELECT 
                    c.content_id,
                    c.title,
                    c.description,
                    c.category,
                    c.sub_category,
                    c.difficulty_level,
                    c.estimated_duration_seconds,
                    c.thumbnail_url,
                    c.is_premium,
                    c.created_at,
                    COUNT(ua.activity_id) as activity_count
                FROM ss_contents c
                LEFT JOIN ss_user_activities ua ON c.content_id = ua.content_id
                WHERE c.is_active = 1
                GROUP BY c.content_id
                ORDER BY activity_count DESC, c.created_at DESC
                LIMIT ?";
        
        return $this->db->fetchAll($sql, [$limit]);
    }
    
    /**
     * Search content
     */
    public function search($query, $filters = [], $limit = 20, $offset = 0) {
        $where = ["is_active = 1"];
        $params = [];
        
        // Add search condition
        if (!empty($query)) {
            $where[] = "(title LIKE ? OR description LIKE ? OR sub_category LIKE ?)";
            $searchTerm = '%' . $query . '%';
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $params[] = $searchTerm;
        }
        
        // Add filters
        if (!empty($filters['category'])) {
            $where[] = "category = ?";
            $params[] = $filters['category'];
        }
        
        if (!empty($filters['difficulty'])) {
            $where[] = "difficulty_level = ?";
            $params[] = (int) $filters['difficulty'];
        }
        
        $whereClause = implode(' AND ', $where);
        
        $sql = "SELECT 
                    content_id,
                    title,
                    description,
                    category,
                    sub_category,
                    difficulty_level,
                    estimated_duration_seconds,
                    thumbnail_url,
                    is_premium,
                    created_at,
                    MATCH(title, description) AGAINST(? IN NATURAL LANGUAGE MODE) as relevance_score
                FROM ss_contents 
                WHERE $whereClause
                ORDER BY relevance_score DESC, created_at DESC
                LIMIT ? OFFSET ?";
        
        // Add query for relevance score if provided
        if (!empty($query)) {
            array_unshift($params, $query);
        } else {
            // Remove relevance score if no query
            $sql = str_replace(", MATCH(title, description) AGAINST(? IN NATURAL LANGUAGE MODE) as relevance_score", "", $sql);
            $sql = str_replace("ORDER BY relevance_score DESC, ", "ORDER BY ", $sql);
        }
        
        $params[] = $limit;
        $params[] = $offset;
        
        return $this->db->fetchAll($sql, $params);
    }
    
    /**
     * Get all categories with content count
     */
    public function getCategories() {
        $sql = "SELECT 
                    category,
                    COUNT(*) as content_count
                FROM ss_contents 
                WHERE is_active = 1
                GROUP BY category
                ORDER BY content_count DESC";
        
        return $this->db->fetchAll($sql);
    }
    
    /**
     * Get difficulty levels with content count
     */
    public function getDifficultyLevels() {
        $sql = "SELECT 
                    difficulty_level,
                    COUNT(*) as content_count
                FROM ss_contents 
                WHERE is_active = 1 AND difficulty_level IS NOT NULL
                GROUP BY difficulty_level
                ORDER BY difficulty_level ASC";
        
        return $this->db->fetchAll($sql);
    }
    
    /**
     * Get content tags (from sub_category)
     */
    public function getTags() {
        $sql = "SELECT 
                    sub_category as tag,
                    COUNT(*) as usage_count
                FROM ss_contents 
                WHERE is_active = 1 AND sub_category IS NOT NULL
                GROUP BY sub_category
                ORDER BY usage_count DESC
                LIMIT 50";
        
        return $this->db->fetchAll($sql);
    }
    
    /**
     * Get content durations with count
     */
    public function getDurations() {
        $sql = "SELECT 
                    CASE 
                        WHEN estimated_duration_seconds <= 300 THEN '0-5 minutes'
                        WHEN estimated_duration_seconds <= 900 THEN '5-15 minutes'
                        WHEN estimated_duration_seconds <= 1800 THEN '15-30 minutes'
                        WHEN estimated_duration_seconds <= 3600 THEN '30-60 minutes'
                        ELSE '60+ minutes'
                    END as duration_range,
                    COUNT(*) as content_count
                FROM ss_contents 
                WHERE is_active = 1 AND estimated_duration_seconds IS NOT NULL
                GROUP BY duration_range
                ORDER BY 
                    CASE duration_range
                        WHEN '0-5 minutes' THEN 1
                        WHEN '5-15 minutes' THEN 2
                        WHEN '15-30 minutes' THEN 3
                        WHEN '30-60 minutes' THEN 4
                        WHEN '60+ minutes' THEN 5
                    END";
        
        return $this->db->fetchAll($sql);
    }
    
    /**
     * Increment view count for content
     */
    public function incrementViews($contentId) {
        // This would typically be tracked in a separate views table
        // For now, we'll just log the view
        try {
            $sql = "INSERT INTO ss_content_views (view_id, content_id, viewed_at, ip_address) 
                    VALUES (UUID(), ?, NOW(), ?)";
            
            $ipAddress = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? 
                        $_SERVER['HTTP_X_REAL_IP'] ?? 
                        $_SERVER['REMOTE_ADDR'] ?? 
                        'unknown';
            
            $this->db->execute($sql, [$contentId, $ipAddress]);
            return true;
        } catch (Exception $e) {
            // Table might not exist, ignore error
            return false;
        }
    }
    
    /**
     * Get related content based on category and tags
     */
    public function getRelated($contentId, $limit = 5) {
        // First get the current content's category and sub_category
        $currentContent = $this->getById($contentId);
        if (!$currentContent) {
            return [];
        }
        
        $sql = "SELECT 
                    content_id,
                    title,
                    description,
                    category,
                    sub_category,
                    difficulty_level,
                    estimated_duration_seconds,
                    thumbnail_url,
                    is_premium,
                    created_at
                FROM ss_contents 
                WHERE content_id != ? 
                AND is_active = 1
                AND (category = ? OR sub_category = ?)
                ORDER BY 
                    CASE WHEN category = ? AND sub_category = ? THEN 1
                         WHEN category = ? THEN 2
                         WHEN sub_category = ? THEN 3
                         ELSE 4
                    END,
                    created_at DESC
                LIMIT ?";
        
        $params = [
            $contentId,
            $currentContent['category'],
            $currentContent['sub_category'],
            $currentContent['category'],
            $currentContent['sub_category'],
            $currentContent['category'],
            $currentContent['sub_category'],
            $limit
        ];
        
        return $this->db->fetchAll($sql, $params);
    }
    
    /**
     * Check if content exists and is active
     */
    public function exists($contentId) {
        $sql = "SELECT COUNT(*) as count FROM ss_contents WHERE content_id = ? AND is_active = 1";
        $result = $this->db->fetchOne($sql, [$contentId]);
        return $result['count'] > 0;
    }
}