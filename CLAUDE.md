# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Stop Scrolling is a mobile app designed to help users overcome social media addiction by providing cognitive-enhancing alternatives including memory games, puzzles, trivia, and mindfulness exercises. The app tracks user progress, provides personalized content based on interests, and uses gamification to maintain engagement.

## Environment Configuration

- **PHP Version**: PHP 8.2 (ea-php82)
- **Server**: Apache with mod_rewrite enabled
- **Database**: MySQL database `trialcluestoday_restaurant_ms`
- **Base URL**: https://trial.cluestoday.com/
- **Working Directory**: `/home/trialcluestoday/public_html`

## Database Architecture

### Database Configuration
- **Database**: Uses `trialcluestoday_restaurant_ms` database with table prefix `ss_`
- **Connection**: Singleton pattern via `Database::getInstance()` in `/stop-scrolling/config/database.php`
- **All tables use prefix**: `ss_` (e.g., `ss_users`, `ss_contents`, `ss_user_activities`)

### Database Connection
```php
$host = 'localhost';
$dbname = 'trialcluestoday_restaurant_ms';
$username = 'trialcluestoday_root_restaurant';
$password = '[pC]SySmhqdQ]&Z3';
```

### Core Database Relationships
- **Central entity**: `ss_users` - all other user-related tables reference this via `user_id`
- **Content system**: `ss_contents` stores all activities/games with JSONB `content_data` field for flexible content storage
- **Activity tracking**: `ss_user_sessions` → `ss_user_activities` → `ss_contents` tracks all user interactions
- **Gamification**: `ss_badges` → `ss_user_achievements`, `ss_user_streaks` for engagement
- **Analytics**: `ss_user_statistics`, `ss_daily_user_metrics` for aggregated performance data

### Key Design Patterns
- UUID primary keys for all tables (generated via MySQL `UUID()` function)
- JSONB columns for flexible data storage (`content_data`, `recommendations`, `event_data`)
- Soft relationships using `ON DELETE CASCADE` for data integrity
- Comprehensive indexing on foreign keys and commonly queried columns

## Common Development Commands

### Database Setup and Management
```bash
# Full database setup (creates tables and populates with test data)
php stop-scrolling/setup.php

# Create/recreate database tables only
php stop-scrolling/setup/create_database.php

# Populate with light test data (5 users, minimal data)
php stop-scrolling/setup/populate_data_light.php

# Populate with full test data (20+ users, comprehensive data) - WARNING: slow
php stop-scrolling/setup/populate_data.php

# Verify database structure and data
php stop-scrolling/verify_database.php
```

### Database Queries
```bash
# Connect to database
mysql -u trialcluestoday_root_restaurant -p'[pC]SySmhqdQ]&Z3' trialcluestoday_restaurant_ms

# Common queries
SHOW TABLES LIKE 'ss_%';  # List all Stop Scrolling tables
SELECT * FROM ss_users LIMIT 5;  # View sample users
SELECT COUNT(*) FROM ss_user_activities;  # Check activity count
```

## Code Conventions

### PHP Database Access Pattern
```php
$db = Database::getInstance();
$conn = $db->getConnection();
$conn->exec("USE trialcluestoday_restaurant_ms");

// Always use prepared statements
$stmt = $conn->prepare("INSERT INTO ss_table_name (...) VALUES (?, ?, ?)");
$stmt->execute([...]);
```

### Table Naming Convention
- All tables prefixed with `ss_`
- Snake_case naming (e.g., `user_activities`, not `userActivities`)
- Singular for main entities (`user`, `badge`), plural for collections (`users`, `badges`)

## User Profiling System

The app profiles users based on multiple dimensions:

1. **Cognitive Type**: visual, logical, verbal, kinesthetic (in `ss_user_profiles`)
2. **Interest Categories**: memory_games, puzzles, trivia, problem_solving, news, mindfulness, languages (in `ss_user_interests`)
3. **Experience Level**: beginner, intermediate, advanced
4. **Engagement Metrics**: tracked via `ss_user_statistics` and `ss_daily_user_metrics`

## Content Categories

Content is organized into these main types (stored in `ss_contents.category`):
- `memory_game` - Memory enhancement exercises
- `puzzle` - Logic and problem-solving challenges
- `trivia` - Knowledge-based questions
- `meditation` - Mindfulness and focus exercises
- `challenge` - Daily/weekly combined challenges
- `article` - Educational reading content

## Important Implementation Notes

1. **Foreign Key Constraints**: When dropping tables, must disable foreign key checks first:
   ```sql
   SET FOREIGN_KEY_CHECKS = 0;
   -- drop tables
   SET FOREIGN_KEY_CHECKS = 1;
   ```

2. **Reserved Keywords**: The column name `rank` is reserved in MySQL; use `user_rank` instead

3. **UUID Generation**: Using MySQL's native `UUID()` function for primary keys, not PHP generation

4. **Performance**: Full data population (`populate_data.php`) can timeout; use `populate_data_light.php` for testing

5. **File Permissions**: Ensure proper permissions (755 for directories, 644 for files)