# Stop Scrolling - Break Your Social Media Addiction

## Overview
Stop Scrolling is a progressive web application designed to help users overcome social media addiction through engaging cognitive exercises, games, and mindfulness activities. The app provides a healthier alternative to endless scrolling by offering memory games, puzzles, trivia, and meditation exercises.

## Features
- 🧠 **Cognitive Games**: Memory games, puzzles, and trivia to keep your mind sharp
- 🧘 **Mindfulness Activities**: Guided meditation and breathing exercises
- 📊 **Progress Tracking**: Monitor your improvement and maintain streaks
- 🏆 **Gamification**: Earn badges, compete on leaderboards, complete daily challenges
- 👥 **Social Features**: Connect with friends and share achievements
- 📱 **Mobile-First Design**: Optimized for mobile devices with PWA support

## Tech Stack
- **Backend**: PHP 8.2
- **Database**: MySQL (MariaDB)
- **Frontend**: HTML5, CSS3 (Tailwind), Vanilla JavaScript
- **Authentication**: JWT tokens
- **API**: RESTful architecture

## Installation

### Prerequisites
- PHP 8.2 or higher
- MySQL 5.7 or higher
- Apache with mod_rewrite enabled
- SSL certificate (for production)

### Setup Instructions

1. **Clone/Upload Files**
   ```bash
   # Upload all files to your web server
   # Ensure the document root points to /stop-scrolling
   ```

2. **Database Setup**
   - Database is already configured with 24 tables (ss_ prefix)
   - 45 test users and 59 content items pre-populated
   - Connection details in `config/database.php`

3. **Configuration**
   - Update `config/app.php` with your settings
   - Modify JWT_SECRET in production
   - Configure email settings if needed

4. **Permissions**
   ```bash
   chmod 755 logs/
   chmod 755 uploads/
   ```

5. **Access the App**
   Navigate to: `https://trial.cluestoday.com/stop-scrolling`

## Project Structure
```
stop-scrolling/
├── api/                 # API endpoints
│   ├── v1/             # Version 1 API
│   └── middleware/     # API middleware
├── assets/             # Static assets
│   ├── css/           # Stylesheets
│   ├── js/            # JavaScript files
│   └── images/        # Images and icons
├── config/             # Configuration files
├── lib/                # Core libraries
│   ├── core/          # Core classes
│   ├── helpers/       # Helper functions
│   └── models/        # Data models
├── templates/          # HTML templates
├── logs/              # Application logs
├── error/             # Error pages
└── index.php          # Main entry point
```

## API Documentation

### Authentication Endpoints
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/logout` - User logout
- `POST /api/v1/auth/refresh` - Refresh JWT token

### Content Endpoints
- `GET /api/v1/contents` - List all content
- `GET /api/v1/contents/{id}` - Get specific content
- `GET /api/v1/contents/recommended` - Get personalized recommendations

### Activity Endpoints
- `POST /api/v1/activities/start` - Start an activity
- `POST /api/v1/activities/complete` - Complete an activity
- `GET /api/v1/activities/history` - Get activity history

## Development

### Running Locally
1. Set up a local PHP development environment
2. Configure Apache/Nginx to serve the application
3. Update database connection in config files
4. Enable debug mode in `config/app.php`

### Testing
- Use the 45 existing test users for authentication testing
- Test with 59 pre-populated content items
- Check all 4 game types: memory, puzzle, trivia, meditation

## Security
- JWT-based authentication
- Password hashing with bcrypt
- SQL injection prevention via prepared statements
- XSS protection through output escaping
- CSRF protection on state-changing operations
- Rate limiting on API endpoints

## Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari, Chrome Android)

## Contributing
This is a private project. For issues or suggestions, contact the development team.

## License
Proprietary - All rights reserved

## Support
For support, email: support@trial.cluestoday.com

---

## Quick Start Guide

### For Users
1. Visit the app URL
2. Register for a new account or login
3. Complete your profile and select interests
4. Start with recommended activities
5. Track your progress and earn achievements

### For Developers
1. Check `pending/task-to-do/` for development tasks
2. Follow the phase-wise implementation plan
3. Test each feature thoroughly
4. Update documentation as needed

## Current Status
- ✅ Phase 1: Foundation & Security (In Progress)
- ⏳ Phase 2: UI & Content Delivery
- ⏳ Phase 3: Interactive Activities
- ⏳ Phase 4: Progress & User Features
- ⏳ Phase 5: Gamification & Social
- ⏳ Phase 6: Polish & Testing