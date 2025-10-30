<?php
/**
 * Stop Scrolling Database Setup Script
 * Run this script to create the database and populate it with test data
 */

echo "===========================================\n";
echo " STOP SCROLLING DATABASE SETUP\n";
echo "===========================================\n\n";

// Run database creation
echo "Step 1: Creating database structure...\n";
echo "---------------------------------------\n";
require_once __DIR__ . '/setup/create_database.php';

echo "\n";

// Run data population
echo "Step 2: Populating with test data...\n";
echo "---------------------------------------\n";
require_once __DIR__ . '/setup/populate_data.php';

echo "\n===========================================\n";
echo " SETUP COMPLETE!\n";
echo "===========================================\n\n";

echo "Database 'stop_scrolling' has been created and populated with test data.\n";
echo "You can now start building your Stop Scrolling application.\n\n";

echo "Next steps:\n";
echo "1. Create API endpoints for user registration and authentication\n";
echo "2. Build content management system for games and activities\n";
echo "3. Implement tracking and analytics features\n";
echo "4. Create mobile app interface\n";
echo "5. Set up notification system\n\n";

echo "Database connection details are in: /stop-scrolling/config/database.php\n";