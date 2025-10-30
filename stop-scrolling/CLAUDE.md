# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Stop Scrolling is a Progressive Web Application (PWA) designed to help users overcome social media addiction through cognitive exercises, games, and mindfulness activities. The app is currently in active development with Phase 1 (Foundation & Security) ~60% complete.

## Current Implementation Status

### ✅ Completed Components
- **Authentication System**: JWT-based auth with register, login, logout endpoints
- **Database Structure**: 24 tables with `ss_` prefix, 46 test users, 59 content items
- **API Router**: RESTful API structure at `/api/v1/`
- **Basic Frontend**: Single-page application with login/register functionality
- **Configuration**: Environment configs for app, API, and CORS

### 🚧 In Progress
- User management endpoints
- Session management features
- Security middleware (rate limiting, input validation)
- Content delivery system
- Activity tracking

## Architecture

### Database
- **Connection**: Singleton pattern via `Database::getInstance()` in `/lib/core/Database.php`
- **Database**: `trialcluestoday_restaurant_ms` (shared hosting constraint)
- **Table Prefix**: All tables use `ss_` prefix
- **Primary Keys**: UUID generated via MySQL `UUID()` function

### API Structure
```
/api/v1/
├── index.php          # Main API router
├── auth/
│   ├── router.php     # Auth sub-router
│   ├── register.php   # User registration
│   ├── login.php      # User login
│   └── logout.php     # User logout
└── [other endpoints to be implemented]
```

### Authentication Flow
1. User registers/logs in → receives JWT access token (1hr) + refresh token (7 days)
2. Token stored in `localStorage` with key `ss_access_token`
3. API requests include token in `Authorization: Bearer {token}` header
4. Sessions tracked in `ss_auth_sessions` table

### Frontend Architecture
- **Single Page Application** using vanilla JavaScript
- **Entry Point**: `/index.php` serves the HTML shell
- **App Logic**: `/assets/js/app.js` handles routing and state
- **State Management**: Global `AppState` object
- **API Client**: `apiRequest()` function with automatic token handling

## Development Commands

### Testing API Endpoints
```bash
# Test registration
curl -X POST https://trial.cluestoday.com/stop-scrolling/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","username":"testuser","password":"password123"}'

# Test login
curl -X POST https://trial.cluestoday.com/stop-scrolling/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Test logout (requires token)
curl -X POST https://trial.cluestoday.com/stop-scrolling/api/v1/auth/logout \
  -H "Authorization: Bearer {token}"
```

### Database Operations
```bash
# Connect to database
mysql -u trialcluestoday_root_restaurant -p'[pC]SySmhqdQ]&Z3' trialcluestoday_restaurant_ms

# View Stop Scrolling tables
SHOW TABLES LIKE 'ss_%';

# Check user count
SELECT COUNT(*) FROM ss_users;

# View recent registrations
SELECT user_id, username, email, created_at FROM ss_users ORDER BY created_at DESC LIMIT 5;
```

### Development Setup
```bash
# Check error logs
tail -f /home/trialcluestoday/public_html/stop-scrolling/error_log

# Test database connection
php /home/trialcluestoday/public_html/stop-scrolling/verify_database.php

# Run setup (creates tables and test data)
php /home/trialcluestoday/public_html/stop-scrolling/setup.php
```

## Key Implementation Details

### Table Structure Quirks
- `ss_user_profiles.cognitive_type`: enum('visual','logical','verbal','kinesthetic') - no 'balanced' option
- `ss_user_settings`: Different columns than typical (no notifications_enabled, has sound_enabled, haptic_feedback)
- `ss_user_statistics`: Uses `total_time_spent_seconds` not `total_time_spent`
- `ss_auth_sessions`: Uses `device_type` enum, not `user_agent` string

### JWT Implementation
- Custom JWT class at `/lib/core/JWT.php` (not using Composer/Firebase)
- Secret key: `JWT_SECRET` in `/config/app.php`
- Algorithm: HS256
- Token structure includes: iss, iat, exp, nbf, jti, sub, type

### Security Considerations
- Apache requires special handling for Authorization header (configured in .htaccess)
- CORS headers applied via `applyCorsHeaders()` function
- Password hashing using `password_hash()` with bcrypt
- All database queries use prepared statements

## Development Workflow

### Adding New API Endpoints
1. Create endpoint file in appropriate directory (e.g., `/api/v1/users/profile.php`)
2. Add route to sub-router (e.g., `/api/v1/users/router.php`)
3. Update main router if new resource (`/api/v1/index.php`)
4. Use `Database::getInstance()` for DB access
5. Return JSON with consistent structure: `{success: bool, message: string, data: object}`

### Frontend Development
1. Add new pages as functions in `/assets/js/app.js` (e.g., `renderDashboard()`)
2. Use `navigateTo(page)` for routing
3. Use `apiRequest(endpoint, options)` for API calls
4. Update `AppState` for global state changes
5. Store auth tokens using `saveAuth(tokens, user)`

## Task Tracking

Development tasks are tracked in `/pending/task-to-do/`:
- `phase-1` through `phase-6` contain detailed task breakdowns
- Each task has checkboxes for tracking completion
- Update files as tasks are completed

## Common Issues & Solutions

### Authorization Header Not Working
- Already configured in `.htaccess` with `RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]`
- `getBearerToken()` function checks multiple header locations

### Database Connection Issues
- Ensure using full database name: `trialcluestoday_restaurant_ms`
- Check table prefix is included: `DB_PREFIX . "table_name"`

### Token Validation Failing
- Check token hasn't expired (1 hour for access tokens)
- Verify token is being sent in Authorization header
- Ensure JWT_SECRET matches between generation and validation