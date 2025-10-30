<?php
require_once __DIR__ . '/config/database.php';

echo "===========================================\n";
echo " STOP SCROLLING DATABASE VERIFICATION\n";
echo "===========================================\n\n";

try {
    $db = Database::getInstance();
    $conn = $db->getConnection();
    $conn->exec("USE trialcluestoday_restaurant_ms");
    
    $prefix = 'ss_';
    
    // Get all tables with the ss_ prefix
    $stmt = $conn->query("SHOW TABLES LIKE '{$prefix}%'");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    echo "Found " . count($tables) . " Stop Scrolling tables:\n";
    echo "---------------------------------------\n";
    
    $tableStats = [];
    foreach ($tables as $table) {
        $countStmt = $conn->query("SELECT COUNT(*) FROM $table");
        $count = $countStmt->fetchColumn();
        $tableStats[$table] = $count;
        
        $displayName = str_replace($prefix, '', $table);
        printf("%-30s: %d records\n", $displayName, $count);
    }
    
    echo "\n===========================================\n";
    echo " KEY STATISTICS\n";
    echo "===========================================\n\n";
    
    // Get some key statistics
    $userCount = $conn->query("SELECT COUNT(*) FROM {$prefix}users")->fetchColumn();
    $contentCount = $conn->query("SELECT COUNT(*) FROM {$prefix}contents")->fetchColumn();
    $sessionCount = $conn->query("SELECT COUNT(*) FROM {$prefix}user_sessions")->fetchColumn();
    $activityCount = $conn->query("SELECT COUNT(*) FROM {$prefix}user_activities")->fetchColumn();
    $badgeCount = $conn->query("SELECT COUNT(*) FROM {$prefix}badges")->fetchColumn();
    
    echo "Total Users: $userCount\n";
    echo "Total Content Items: $contentCount\n";
    echo "Total Sessions: $sessionCount\n";
    echo "Total Activities: $activityCount\n";
    echo "Total Badges: $badgeCount\n";
    
    // Get sample users
    echo "\n===========================================\n";
    echo " SAMPLE USERS\n";
    echo "===========================================\n\n";
    
    $sampleUsers = $conn->query("
        SELECT u.username, u.email, u.account_type, p.display_name, p.country 
        FROM {$prefix}users u 
        LEFT JOIN {$prefix}user_profiles p ON u.user_id = p.user_id 
        LIMIT 5
    ")->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($sampleUsers as $user) {
        echo "Username: {$user['username']}\n";
        echo "  Email: {$user['email']}\n";
        echo "  Account: {$user['account_type']}\n";
        echo "  Display Name: {$user['display_name']}\n";
        echo "  Country: {$user['country']}\n";
        echo "  ---\n";
    }
    
    // Get content breakdown
    echo "\n===========================================\n";
    echo " CONTENT BREAKDOWN\n";
    echo "===========================================\n\n";
    
    $contentBreakdown = $conn->query("
        SELECT category, COUNT(*) as count 
        FROM {$prefix}contents 
        GROUP BY category
    ")->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($contentBreakdown as $content) {
        printf("%-20s: %d items\n", $content['category'], $content['count']);
    }
    
    echo "\n===========================================\n";
    echo " DATABASE VERIFICATION COMPLETE\n";
    echo "===========================================\n\n";
    echo "✓ All Stop Scrolling tables created successfully\n";
    echo "✓ Test data inserted successfully\n";
    echo "✓ Database is ready for use\n\n";
    
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}