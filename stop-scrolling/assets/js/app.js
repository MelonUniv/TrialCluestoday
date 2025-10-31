/**
 * Stop Scrolling - Main Application JavaScript
 */

// App Configuration
const APP_CONFIG = {
    apiUrl: '/stop-scrolling/api/v1',
    appName: 'Stop Scrolling',
    version: '1.0.0',
    tokenKey: 'ss_access_token',
    refreshTokenKey: 'ss_refresh_token',
    userKey: 'ss_user_data'
};

// App State
const AppState = {
    user: null,
    isAuthenticated: false,
    currentPage: 'home',
    theme: localStorage.getItem('ss_theme') || 'light',
    content: {
        items: [],
        categories: [],
        filters: {
            category: '',
            difficulty: '',
            search: ''
        },
        pagination: {
            currentPage: 1,
            totalPages: 1,
            perPage: 20
        },
        loading: false
    },
    // Engagement Systems
    engagement: {
        streakManager: null,
        comboSystem: null,
        badgeSystem: null,
        achievementSystem: null,
        motivationalMessaging: null,
        dailyRecapSystem: null,
        initialized: false
    }
};

const ThemeManager = (typeof ThemeHooks !== 'undefined' && typeof StopScrollingTheme !== 'undefined')
    ? ThemeHooks.createThemeManager(StopScrollingTheme)
    : null;

if (ThemeManager) {
    ThemeManager.subscribe(function(mode) {
        if (typeof document !== 'undefined') {
            document.documentElement.setAttribute('data-theme', mode);
        }
    });
}

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    console.log('Stop Scrolling App Initializing...');
    
    // Apply saved theme
    applyTheme(AppState.theme);
    
    // Check authentication
    checkAuth();
    
    // Initialize engagement systems
    initializeEngagementSystems();

    // Initialize router
    initRouter();

    if (typeof Analytics !== 'undefined' && Analytics.trackEvent) {
        Analytics.trackEvent('app_initialized', {
            theme: AppState.theme,
            authenticated: AppState.isAuthenticated
        });
    }

    // Hide initial loader
    setTimeout(() => {
        const loader = document.getElementById('initial-loader');
        if (loader) {
            loader.style.display = 'none';
        }
    }, 500);
    
    // Render initial page based on authentication status
    if (AppState.isAuthenticated) {
        renderPage('dashboard');
    } else {
        renderPage('landing');
    }
});

// Engagement Systems Initialization
function initializeEngagementSystems() {
    try {
        // Only initialize if user is authenticated and systems aren't already initialized
        if (AppState.isAuthenticated && !AppState.engagement.initialized) {
            console.log('Initializing engagement systems...');
            const initializedSystems = [];

            // Initialize StreakManager
            if (typeof StreakManager !== 'undefined') {
                AppState.engagement.streakManager = new StreakManager();
                console.log('StreakManager initialized');
                initializedSystems.push('streak');
            }

            // Initialize ComboSystem
            if (typeof ComboSystem !== 'undefined') {
                AppState.engagement.comboSystem = new ComboSystem();
                console.log('ComboSystem initialized');
                initializedSystems.push('combo');
            }

            // Initialize BadgeSystem
            if (typeof BadgeSystem !== 'undefined') {
                AppState.engagement.badgeSystem = new BadgeSystem();
                console.log('BadgeSystem initialized');
                initializedSystems.push('badge');
            }

            // Initialize AchievementSystem
            if (typeof AchievementSystem !== 'undefined') {
                AppState.engagement.achievementSystem = new AchievementSystem();
                console.log('AchievementSystem initialized');
                initializedSystems.push('achievement');
            }

            // Initialize MotivationalMessaging
            if (typeof MotivationalMessaging !== 'undefined') {
                AppState.engagement.motivationalMessaging = new MotivationalMessaging();
                console.log('MotivationalMessaging initialized');
                initializedSystems.push('motivation');
            }

            // Initialize DailyRecapSystem
            if (typeof DailyRecapSystem !== 'undefined') {
                AppState.engagement.dailyRecapSystem = new DailyRecapSystem();
                console.log('DailyRecapSystem initialized');
                initializedSystems.push('daily-recap');
            }

            AppState.engagement.initialized = true;
            console.log('All engagement systems initialized successfully');

            if (initializedSystems.length && typeof Analytics !== 'undefined' && Analytics.trackEvent) {
                Analytics.trackEvent('engagement_systems_initialized', {
                    systems: initializedSystems.join(','),
                    total: initializedSystems.length
                });
            }
        }
    } catch (error) {
        console.error('Error initializing engagement systems:', error);
        if (typeof Analytics !== 'undefined' && Analytics.trackError) {
            Analytics.trackError('engagement_initialization_failed', { message: error.message });
        }
    }
}

// Authentication Functions
function checkAuth() {
    const token = localStorage.getItem(APP_CONFIG.tokenKey);
    const userData = localStorage.getItem(APP_CONFIG.userKey);
    
    if (token && userData) {
        try {
            AppState.user = JSON.parse(userData);
            AppState.isAuthenticated = true;
            console.log('User authenticated:', AppState.user.username);
        } catch (e) {
            console.error('Failed to parse user data:', e);
            logout();
        }
    }
}

function saveAuth(tokens, user) {
    localStorage.setItem(APP_CONFIG.tokenKey, tokens.access_token);
    localStorage.setItem(APP_CONFIG.refreshTokenKey, tokens.refresh_token);
    localStorage.setItem(APP_CONFIG.userKey, JSON.stringify(user));
    AppState.user = user;
    AppState.isAuthenticated = true;
    
    // Initialize engagement systems after successful authentication
    initializeEngagementSystems();
}

function logout() {
    localStorage.removeItem(APP_CONFIG.tokenKey);
    localStorage.removeItem(APP_CONFIG.refreshTokenKey);
    localStorage.removeItem(APP_CONFIG.userKey);
    AppState.user = null;
    AppState.isAuthenticated = false;
    renderPage('home');
}

// API Functions
async function apiRequest(endpoint, options = {}) {
    const url = `${APP_CONFIG.apiUrl}${endpoint}`;
    const token = localStorage.getItem(APP_CONFIG.tokenKey);
    
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json'
        }
    };
    
    if (token) {
        defaultOptions.headers['Authorization'] = `Bearer ${token}`;
    }
    
    const config = { ...defaultOptions, ...options };
    
    if (config.body && typeof config.body === 'object') {
        config.body = JSON.stringify(config.body);
    }
    
    try {
        const response = await fetch(url, config);
        
        // Check if response is JSON before parsing
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Server returned non-JSON response');
        }
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'API request failed');
        }
        
        return data;
    } catch (error) {
        console.error('API Request failed:', error);
        throw error;
    }
}

// Router Functions
function initRouter() {
    // Handle browser back/forward
    window.addEventListener('popstate', function(event) {
        if (event.state && event.state.page) {
            if (typeof Analytics !== 'undefined' && Analytics.trackEvent) {
                Analytics.trackEvent('navigation', {
                    destination: event.state.page,
                    source: 'history'
                });
            }
            renderPage(event.state.page);
        }
    });
}

function navigateTo(page) {
    history.pushState({ page: page }, '', `#${page}`);
    if (typeof Analytics !== 'undefined' && Analytics.trackEvent) {
        Analytics.trackEvent('navigation', {
            destination: page,
            source: 'link'
        });
    }
    renderPage(page);
}

// Page Rendering
function renderPage(page) {
    const app = document.getElementById('app');
    AppState.currentPage = page;

    if (typeof Analytics !== 'undefined' && Analytics.trackScreen) {
        Analytics.trackScreen(page, {
            theme: AppState.theme,
            isAuthenticated: AppState.isAuthenticated
        });
    }

    // Clear current content
    app.innerHTML = '';
    
    // Render based on page
    switch(page) {
        case 'home':
            renderHomePage();
            break;
        case 'landing':
            renderLandingPage();
            break;
        case 'login':
            renderLoginPage();
            break;
        case 'register':
            renderRegisterPage();
            break;
        case 'dashboard':
            if (AppState.isAuthenticated) {
                renderDashboard();
            } else {
                navigateTo('login');
            }
            break;
        case 'settings':
            if (AppState.isAuthenticated) {
                renderSettings();
            } else {
                navigateTo('login');
            }
            break;
        default:
            renderHomePage();
    }
}

// Page Components
function renderLandingPage() {
    const app = document.getElementById('app');
    
    app.innerHTML = `
        <!-- Landing Page -->
        <div class="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
            <!-- Hero Section -->
            <div class="relative overflow-hidden">
                <div class="mx-auto px-6 md:px-10 py-12 max-w-4xl">
                    <div class="text-center">
                        <h1 class="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
                            Stop Scrolling,<br><span class="text-indigo-100">Start Living</span>
                        </h1>
                        <p class="text-lg md:text-xl text-gray-200 mb-8 max-w-3xl mx-auto">
                            Break free from social media addiction with engaging cognitive exercises, games, and mindfulness activities designed to rewire your brain for better focus and productivity.
                        </p>

                        <!-- CTA Buttons -->
                        <div class="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                            <button onclick="navigateTo('register')" aria-label="Create a new Stop Scrolling account" class="bg-white text-indigo-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors shadow-lg focus:ring-2 focus:ring-offset-2 focus:ring-indigo-200">
                                Get Started Free
                            </button>
                            <button onclick="navigateTo('login')" aria-label="Sign in to your Stop Scrolling account" class="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-indigo-600 transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-white">
                                Sign In
                            </button>
                        </div>

                        <!-- Features Preview -->
                        <div class="grid gap-6 mt-12 md:grid-cols-3" role="list">
                            <div class="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-6" role="listitem">
                                <div class="text-4xl mb-4" aria-hidden="true">🧠</div>
                                <h3 class="text-xl font-semibold text-white mb-2">Memory Games</h3>
                                <p class="text-gray-200">Challenge your mind with card matching, sequences, and pattern recognition games.</p>
                            </div>
                            <div class="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-6" role="listitem">
                                <div class="text-4xl mb-4" aria-hidden="true">🧩</div>
                                <h3 class="text-xl font-semibold text-white mb-2">Puzzle Challenges</h3>
                                <p class="text-gray-200">Solve sliding puzzles, word searches, and logic problems to sharpen your focus.</p>
                            </div>
                            <div class="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-6" role="listitem">
                                <div class="text-4xl mb-4" aria-hidden="true">🧘</div>
                                <h3 class="text-xl font-semibold text-white mb-2">Mindfulness</h3>
                                <p class="text-gray-200">Practice breathing exercises and meditation to reduce anxiety and improve well-being.</p>
                            </div>
                        </div>

                        <!-- Stats -->
                        <div class="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-12" role="group" aria-label="Community highlights">
                            <div class="text-center bg-white bg-opacity-10 rounded-lg py-4">
                                <div class="text-3xl font-bold text-white" aria-label="Forty eight active users">48</div>
                                <div class="text-gray-200 text-sm">Active Users</div>
                            </div>
                            <div class="text-center bg-white bg-opacity-10 rounded-lg py-4">
                                <div class="text-3xl font-bold text-white" aria-label="Fifty nine activities available">59</div>
                                <div class="text-gray-200 text-sm">Activities</div>
                            </div>
                            <div class="text-center bg-white bg-opacity-10 rounded-lg py-4">
                                <div class="text-3xl font-bold text-white" aria-label="Always free">100%</div>
                                <div class="text-gray-200 text-sm">Free</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderHomePage() {
    const app = document.getElementById('app');
    const user = AppState.user || { username: 'Guest', level: 1, streak: 0 };
    
    app.innerHTML = `
        <!-- Main Navigation -->
        <nav class="bg-white dark:bg-gray-800 shadow-lg relative" aria-label="Primary">
            <div class="mx-auto px-4 max-w-md">
                <div class="flex justify-between h-16">
                    <!-- Mobile App Navigation -->
                    <div class="text-center mb-4">
                        <h1 class="text-xl font-bold text-indigo-600" aria-label="Stop Scrolling home">Stop Scrolling</h1>
                    </div>

                    <!-- Navigation Links -->
                    <div class="flex flex-col space-y-3" role="menubar">
                            <a href="#" onclick="navigateTo('home')" role="menuitem" aria-current="${AppState.currentPage === 'home' ? 'page' : 'false'}" class="text-gray-900 dark:text-white inline-flex items-center px-1 pt-1 border-b-2 border-indigo-500 text-sm font-medium">
                                Dashboard
                            </a>
                            <a href="#" onclick="navigateTo('activities')" role="menuitem" aria-current="${AppState.currentPage === 'activities' ? 'page' : 'false'}" class="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-gray-300 text-sm font-medium">
                                Activities
                            </a>
                            <a href="#" onclick="navigateTo('progress')" role="menuitem" aria-current="${AppState.currentPage === 'progress' ? 'page' : 'false'}" class="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-gray-300 text-sm font-medium">
                                Progress
                            </a>
                        </div>
                    </div>

                    <!-- Right side - User menu, notifications, theme -->
                    <div class="flex items-center space-x-4">
                        <!-- Notifications -->
                        <button class="p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 relative" aria-label="View notifications" title="Notifications">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-5 5h5m-5-5v-5a6 6 0 10-12 0v5"></path>
                            </svg>
                            <span class="absolute top-0 right-0 block h-2 w-2 bg-red-400 rounded-full"></span>
                        </button>

                        <!-- Theme Toggle -->
                        <button onclick="toggleTheme()" class="p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300" aria-label="Toggle theme" title="Toggle theme">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
                            </svg>
                        </button>

                        <!-- User Dropdown -->
                        <div class="relative">
                            <button class="flex items-center space-x-2 p-2 text-sm rounded-full text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500" onclick="toggleUserDropdown()">
                                <div class="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                    ${user.username.charAt(0).toUpperCase()}
                                </div>
                                <span class="text-gray-700 dark:text-gray-300">${user.username}</span>
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                                </svg>
                            </button>
                            
                            <!-- User Dropdown Menu -->
                            <div id="user-dropdown" class="hidden absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-50">
                                <div class="py-1">
                                    <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                                        <p class="text-sm text-gray-700 dark:text-gray-300">Signed in as</p>
                                        <p class="text-sm font-medium text-gray-900 dark:text-white truncate">${user.username}</p>
                                        <div class="flex items-center mt-2 space-x-2">
                                            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                                                Level ${user.level}
                                            </span>
                                            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                                                🔥 ${user.streak} day${user.streak !== 1 ? 's' : ''}
                                            </span>
                                        </div>
                                    </div>
                                    <a href="#" onclick="navigateTo('profile')" class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                                        <svg class="inline w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                                        </svg>
                                        Your Profile
                                    </a>
                                    <a href="#" onclick="navigateTo('settings')" class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                                        <svg class="inline w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                        </svg>
                                        Settings
                                    </a>
                                    <div class="border-t border-gray-200 dark:border-gray-700"></div>
                                    <button onclick="logout()" class="block w-full text-left px-4 py-2 text-sm text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20">
                                        <svg class="inline w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                                        </svg>
                                        Sign out
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Mobile Menu -->
            <div id="mobile-menu" class="hidden bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                <div class="pt-2 pb-3 space-y-1">
                    <a href="#" onclick="navigateTo('home')" class="bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-200 block pl-3 pr-4 py-2 border-l-4 text-base font-medium">
                        Dashboard
                    </a>
                    <a href="#" onclick="navigateTo('activities')" class="border-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 hover:text-gray-800 dark:hover:text-gray-200 block pl-3 pr-4 py-2 border-l-4 text-base font-medium">
                        Activities
                    </a>
                    <a href="#" onclick="navigateTo('progress')" class="border-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 hover:text-gray-800 dark:hover:text-gray-200 block pl-3 pr-4 py-2 border-l-4 text-base font-medium">
                        Progress
                    </a>
                </div>
            </div>
        </nav>

        <!-- Dashboard Header -->
        <div class="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-8">
            <div class="mx-auto px-4 max-w-md">
                <div class="text-center">
                    <div class="mb-6">
                        <h1 class="text-3xl font-bold mb-2">Welcome back, ${user.username}! 👋</h1>
                        <p class="text-indigo-100">Ready to break some scrolling habits today?</p>
                    </div>
                    <div class="flex flex-col sm:flex-row gap-4">
                        <!-- Daily Streak -->
                        <div class="bg-white bg-opacity-20 rounded-lg p-4 text-center">
                            <div class="text-2xl font-bold">${user.streak}</div>
                            <div class="text-sm text-indigo-100">Day Streak 🔥</div>
                        </div>
                        <!-- Level -->
                        <div class="bg-white bg-opacity-20 rounded-lg p-4 text-center">
                            <div class="text-2xl font-bold">Lvl ${user.level}</div>
                            <div class="text-sm text-indigo-100">Current Level ⭐</div>
                        </div>
                        <!-- Today's Goal -->
                        <div class="bg-white bg-opacity-20 rounded-lg p-4 text-center">
                            <div class="text-2xl font-bold">3/5</div>
                            <div class="text-sm text-indigo-100">Activities Today 🎯</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Quick Actions Bar -->
        <div class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
            <div class="mx-auto px-4 max-w-md">
                <div class="flex items-center justify-between py-4">
                    <div class="flex items-center space-x-4">
                        <div class="max-w-md relative">
                            <input type="text" id="search-input" placeholder="Search activities..." 
                                   class="w-full px-4 py-2 pl-10 pr-4 text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                                </svg>
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center space-x-4">
                        <button class="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                            </svg>
                            Quick Start
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Content Filters -->
        <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
            <div class="mx-auto px-4 max-w-md">
                <div class="flex items-center justify-between py-4">
                    <div class="flex items-center space-x-4 overflow-x-auto">
                        <span class="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">Categories:</span>
                        <button onclick="filterContent('category', '')" 
                                class="px-3 py-1 text-sm rounded-full border hover:bg-gray-50 dark:hover:bg-gray-700 whitespace-nowrap filter-btn"
                                data-filter-type="category" data-filter-value="">
                            All
                        </button>
                        <div id="category-filters" class="flex space-x-2"></div>
                    </div>
                    <div class="flex items-center space-x-4">
                        <span class="text-sm text-gray-500 dark:text-gray-400" id="results-count">
                            Loading...
                        </span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Dashboard Content -->
        <div class="mx-auto px-4 py-6 max-w-md">
            <!-- Quick Start Cards -->
            <div class="mb-8">
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">Quick Start Activities</h2>
                <div class="space-y-4 mb-8">
                    <div class="group cursor-pointer bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white hover:from-blue-600 hover:to-blue-700 transform hover:scale-105 transition-all duration-200">
                        <div class="text-3xl mb-3">🧠</div>
                        <h3 class="font-semibold text-lg mb-2">Memory Challenge</h3>
                        <p class="text-blue-100 text-sm">Quick 5-minute brain booster</p>
                        <div class="mt-4 flex items-center text-sm">
                            <span class="bg-white bg-opacity-20 px-2 py-1 rounded">5 min</span>
                            <span class="ml-2">⭐ Easy</span>
                        </div>
                    </div>
                    
                    <div class="group cursor-pointer bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white hover:from-green-600 hover:to-green-700 transform hover:scale-105 transition-all duration-200">
                        <div class="text-3xl mb-3">🧩</div>
                        <h3 class="font-semibold text-lg mb-2">Logic Puzzle</h3>
                        <p class="text-green-100 text-sm">Sharpen your reasoning skills</p>
                        <div class="mt-4 flex items-center text-sm">
                            <span class="bg-white bg-opacity-20 px-2 py-1 rounded">10 min</span>
                            <span class="ml-2">⭐⭐ Medium</span>
                        </div>
                    </div>
                    
                    <div class="group cursor-pointer bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white hover:from-purple-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-200">
                        <div class="text-3xl mb-3">🧘</div>
                        <h3 class="font-semibold text-lg mb-2">Mindfulness</h3>
                        <p class="text-purple-100 text-sm">Center yourself with meditation</p>
                        <div class="mt-4 flex items-center text-sm">
                            <span class="bg-white bg-opacity-20 px-2 py-1 rounded">3 min</span>
                            <span class="ml-2">⭐ Easy</span>
                        </div>
                    </div>
                    
                    <div class="group cursor-pointer bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white hover:from-orange-600 hover:to-orange-700 transform hover:scale-105 transition-all duration-200">
                        <div class="text-3xl mb-3">🎯</div>
                        <h3 class="font-semibold text-lg mb-2">Daily Challenge</h3>
                        <p class="text-orange-100 text-sm">Today's special challenge</p>
                        <div class="mt-4 flex items-center text-sm">
                            <span class="bg-white bg-opacity-20 px-2 py-1 rounded">15 min</span>
                            <span class="ml-2">⭐⭐⭐ Hard</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Recent & Recommended Content -->
            <div class="space-y-6 mb-8">
                <!-- Recommended for You -->
                <div>
                    <div class="flex items-center justify-between mb-4">
                        <h2 class="text-xl font-bold text-gray-900 dark:text-white">Recommended for You</h2>
                        <a href="#" onclick="navigateTo('activities')" class="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 text-sm font-medium">
                            See all →
                        </a>
                    </div>
                    <div id="recommended-content" class="space-y-4">
                        <!-- Recommended content will be loaded here -->
                        <div class="animate-pulse space-y-4">
                            <div class="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                            <div class="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                            <div class="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                        </div>
                    </div>
                </div>

                <!-- Stats Overview -->
                <div>
                    <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">Your Progress</h2>
                    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                        <div class="space-y-4">
                            <div class="flex justify-between items-center">
                                <span class="text-sm text-gray-600 dark:text-gray-400">This Week</span>
                                <span class="text-lg font-semibold text-gray-900 dark:text-white">12 activities</span>
                            </div>
                            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div class="bg-indigo-600 h-2 rounded-full" style="width: 75%"></div>
                            </div>
                            <div class="grid grid-cols-2 gap-4 pt-2">
                                <div class="text-center">
                                    <div class="text-2xl font-bold text-indigo-600 dark:text-indigo-400">85</div>
                                    <div class="text-xs text-gray-600 dark:text-gray-400">Total Score</div>
                                </div>
                                <div class="text-center">
                                    <div class="text-2xl font-bold text-green-600 dark:text-green-400">4.2</div>
                                    <div class="text-xs text-gray-600 dark:text-gray-400">Avg Rating</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- All Content Section -->
        <div class="bg-gray-50 dark:bg-gray-900 pt-8">
            <div class="mx-auto px-4 max-w-md">
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">Browse All Activities</h2>
                
                <div id="content-loading" class="text-center py-8">
                    <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    <p class="mt-2 text-gray-600 dark:text-gray-400">Loading content...</p>
                </div>
                
                <div id="content-grid" class="space-y-4 hidden pb-8">
                    <!-- Content cards will be inserted here -->
                </div>
            </div>
        </div>
            
            <div id="content-empty" class="text-center py-12 hidden">
                <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.485 0-4.693.993-6.293 2.707M13 19.5v-8.993a4 4 0 011.664-3.247l6.646-4.997L20.336 4.257a1 1 0 011.328.747v8.993z"></path>
                </svg>
                <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No content found</h3>
                <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Try adjusting your search or filters.</p>
            </div>

            <!-- Pagination -->
            <div id="pagination" class="mt-8 flex justify-center"></div>
        </div>
    `;
    
    // Initialize content loading
    setTimeout(() => {
        loadCategories();
        loadContent();
        loadRecommendedContent();
        setupSearchHandlers();
    }, 100);
}

function renderLoginPage() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="min-h-screen flex items-center justify-center p-4">
            <div class="max-w-md w-full">
                <div class="bg-white rounded-lg shadow-lg p-8">
                    <h2 class="text-2xl font-bold mb-6">Login</h2>
                    <form id="loginForm" onsubmit="handleLogin(event)">
                        <div class="mb-4">
                            <label class="block text-gray-700 mb-2">Email</label>
                            <input type="email" name="email" required class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-indigo-500">
                        </div>
                        <div class="mb-6">
                            <label class="block text-gray-700 mb-2">Password</label>
                            <input type="password" name="password" required class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-indigo-500">
                        </div>
                        <button type="submit" class="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors">
                            Login
                        </button>
                    </form>
                    <p class="mt-4 text-center text-gray-600">
                        Don't have an account? 
                        <a href="#" onclick="navigateTo('register')" class="text-indigo-600 hover:underline">Register</a>
                    </p>
                </div>
            </div>
        </div>
    `;
}

function renderRegisterPage() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="min-h-screen flex items-center justify-center p-4">
            <div class="max-w-md w-full">
                <div class="bg-white rounded-lg shadow-lg p-8">
                    <h2 class="text-2xl font-bold mb-6">Create Account</h2>
                    <form id="registerForm" onsubmit="handleRegister(event)">
                        <div class="mb-4">
                            <label class="block text-gray-700 mb-2">Username</label>
                            <input type="text" name="username" required pattern="[a-zA-Z0-9_]{3,20}" class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-indigo-500">
                        </div>
                        <div class="mb-4">
                            <label class="block text-gray-700 mb-2">Email</label>
                            <input type="email" name="email" required class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-indigo-500">
                        </div>
                        <div class="mb-6">
                            <label class="block text-gray-700 mb-2">Password</label>
                            <input type="password" name="password" required minlength="8" class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-indigo-500">
                        </div>
                        <button type="submit" class="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors">
                            Register
                        </button>
                    </form>
                    <p class="mt-4 text-center text-gray-600">
                        Already have an account? 
                        <a href="#" onclick="navigateTo('login')" class="text-indigo-600 hover:underline">Login</a>
                    </p>
                </div>
            </div>
        </div>
    `;
}

function renderDashboard() {
    // Ensure user is logged in
    if (!AppState.user || !localStorage.getItem('ss_access_token')) {
        navigateTo('login');
        return;
    }
    
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="min-h-screen bg-gray-50">
            <nav class="bg-indigo-600 text-white p-4 shadow-lg">
                <div class="container mx-auto flex justify-between items-center">
                    <h1 class="text-xl font-bold">Stop Scrolling</h1>
                    <div class="flex items-center gap-4">
                        <span>Welcome, ${AppState.user.username}!</span>
                        <button onclick="navigateTo('settings')" class="bg-indigo-700 px-4 py-2 rounded hover:bg-indigo-800 transition-colors">
                            ⚙️ Settings
                        </button>
                        <button onclick="handleLogout()" class="bg-indigo-700 px-4 py-2 rounded hover:bg-indigo-800 transition-colors">
                            Logout
                        </button>
                    </div>
                </div>
            </nav>
            <div class="container mx-auto p-4">
                <!-- Interactive Flow Hero Section -->
                <div class="flow-hero">
                    <h1>Ready for Your Brain Training Journey?</h1>
                    <p>Engage your mind with personalized cognitive exercises that adapt to your performance</p>
                    <button onclick="showSessionSelector()" class="start-journey-btn" aria-label="Open session selector">
                        🚀 Start Journey
                    </button>
                </div>
                
                <!-- Quick Stats -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6" id="engagement-stats">
                    <div class="bg-white rounded-lg shadow p-6">
                        <div class="text-3xl font-bold text-indigo-600" id="sessions-today" aria-live="polite" role="text">0</div>
                        <div class="text-gray-600">Sessions Today</div>
                    </div>
                    <div class="bg-white rounded-lg shadow p-6">
                        <div class="text-3xl font-bold text-green-600" id="current-streak" aria-live="polite" role="text">0</div>
                        <div class="text-gray-600">Current Streak</div>
                    </div>
                    <div class="bg-white rounded-lg shadow p-6">
                        <div class="text-3xl font-bold text-purple-600" id="total-xp" aria-live="polite" role="text">0</div>
                        <div class="text-gray-600">Total XP</div>
                    </div>
                    <div class="bg-white rounded-lg shadow p-6">
                        <div class="text-3xl font-bold text-orange-600">0</div>
                        <div class="text-gray-600">Achievements</div>
                    </div>
                </div>
                
                <!-- Recent Activity -->
                <div class="bg-white rounded-lg shadow p-6">
                    <h3 class="text-xl font-semibold mb-4">Recent Activity</h3>
                    <p class="text-gray-500">Start your first journey to see your activity here!</p>
                </div>
            </div>
        </div>
        
        <!-- Session Type Selector Modal -->
        <div id="sessionSelector" class="session-selector">
            <div class="session-modal">
                <h2>Choose Your Journey</h2>
                <div class="session-types">
                    <div class="session-type-card" data-type="quick" onclick="selectSessionType('quick')">
                        <h3>
                            <span class="session-type-icon">⚡</span>
                            Quick Session
                            <span class="session-duration">5 minutes</span>
                        </h3>
                        <p class="session-description">Perfect for a quick mental refresh. 3 activities to boost your focus.</p>
                    </div>
                    <div class="session-type-card" data-type="focus" onclick="selectSessionType('focus')">
                        <h3>
                            <span class="session-type-icon">🎯</span>
                            Focus Session
                            <span class="session-duration">15 minutes</span>
                        </h3>
                        <p class="session-description">Ideal for a productive break. 5 activities with balanced difficulty.</p>
                    </div>
                    <div class="session-type-card" data-type="deep" onclick="selectSessionType('deep')">
                        <h3>
                            <span class="session-type-icon">🧠</span>
                            Deep Work
                            <span class="session-duration">30 minutes</span>
                        </h3>
                        <p class="session-description">Comprehensive brain training. 10 activities with progressive challenges.</p>
                    </div>
                    <div class="session-type-card" data-type="endless" onclick="selectSessionType('endless')">
                        <h3>
                            <span class="session-type-icon">♾️</span>
                            Endless Mode
                            <span class="session-duration">Unlimited</span>
                        </h3>
                        <p class="session-description">Keep going as long as you want. Perfect for marathon training.</p>
                    </div>
                </div>
                <div class="flex justify-between mt-4">
                    <button onclick="closeSessionSelector()" class="px-6 py-2 text-gray-600 hover:text-gray-800">
                        Cancel
                    </button>
                    <button onclick="startSelectedSession()" class="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700" disabled id="startSessionBtn">
                        Start Session
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Update engagement stats after rendering dashboard
    updateEngagementStats();
}

// Update Dashboard with Real Engagement Data
function updateEngagementStats() {
    if (!AppState.engagement.initialized) return;
    
    try {
        // Update Current Streak
        if (AppState.engagement.streakManager) {
            const streakData = AppState.engagement.streakManager.getCurrentStreak();
            const currentStreakEl = document.getElementById('current-streak');
            if (currentStreakEl) {
                currentStreakEl.textContent = streakData.currentStreak || 0;
            }
        }
        
        // Update Total XP
        if (AppState.engagement.comboSystem) {
            const userStats = AppState.engagement.comboSystem.getUserStats();
            const totalXpEl = document.getElementById('total-xp');
            if (totalXpEl) {
                totalXpEl.textContent = userStats.totalXP || 0;
            }
        }
        
        // Update Sessions Today (placeholder - would need session tracking)
        const sessionsToday = localStorage.getItem('ss_sessions_today') || 0;
        const sessionsTodayEl = document.getElementById('sessions-today');
        if (sessionsTodayEl) {
            sessionsTodayEl.textContent = sessionsToday;
        }
        
        console.log('Engagement stats updated successfully');
    } catch (error) {
        console.error('Error updating engagement stats:', error);
    }
}

// Form Handlers
async function handleLogin(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    
    try {
        const response = await apiRequest('/auth/login', {
            method: 'POST',
            body: {
                email: formData.get('email'),
                password: formData.get('password')
            }
        });
        
        if (response.success) {
            saveAuth(response.data.tokens, response.data.user);
            navigateTo('dashboard');
        }
    } catch (error) {
        alert('Login failed: ' + error.message);
    }
}

async function handleRegister(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    
    try {
        const response = await apiRequest('/auth/register', {
            method: 'POST',
            body: {
                username: formData.get('username'),
                email: formData.get('email'),
                password: formData.get('password')
            }
        });
        
        if (response.success) {
            saveAuth(response.data.tokens, response.data.user);
            alert('Registration successful! Please check your email to verify your account.');
            navigateTo('dashboard');
        }
    } catch (error) {
        alert('Registration failed: ' + error.message);
    }
}

async function handleLogout() {
    try {
        await apiRequest('/auth/logout', {
            method: 'POST'
        });
    } catch (error) {
        console.error('Logout error:', error);
    }
    
    logout();
}

// Content Management Functions
async function loadContent(filters = {}, page = 1) {
    // Skip loading if user is not authenticated
    const token = localStorage.getItem('ss_access_token');
    if (!token) {
        console.log('No auth token, skipping content load');
        return;
    }
    
    AppState.content.loading = true;
    updateUI();
    
    try {
        const params = new URLSearchParams({
            limit: AppState.content.pagination.perPage,
            offset: (page - 1) * AppState.content.pagination.perPage,
            ...filters
        });
        
        const response = await apiRequest(`/contents?${params}`);
        
        if (response.success) {
            AppState.content.items = response.data.contents;
            AppState.content.pagination = {
                currentPage: response.data.pagination.current_page,
                totalPages: response.data.pagination.pages,
                perPage: response.data.pagination.per_page,
                total: response.data.pagination.total
            };
            AppState.content.filters = { ...AppState.content.filters, ...filters };
        }
    } catch (error) {
        console.error('Failed to load content:', error);
        showToast('Failed to load content', 'error');
    } finally {
        AppState.content.loading = false;
        updateUI();
    }
}

async function loadCategories() {
    try {
        const response = await apiRequest('/contents/categories');
        if (response.success) {
            AppState.content.categories = response.data;
        }
    } catch (error) {
        console.error('Failed to load categories:', error);
    }
}

async function loadRecommendedContent() {
    try {
        const userId = AppState.user?.user_id || '';
        const response = await apiRequest(`/contents/recommended?user_id=${userId}&limit=3`);
        if (response.success) {
            const container = document.getElementById('recommended-content');
            if (container) {
                container.innerHTML = '';
                
                if (response.data.recommendations.length === 0) {
                    container.innerHTML = `
                        <div class="text-center py-8 text-gray-500 dark:text-gray-400">
                            <p>Complete some activities to get personalized recommendations!</p>
                        </div>
                    `;
                    return;
                }
                
                response.data.recommendations.forEach(content => {
                    const contentCard = createRecommendedCard(content);
                    container.appendChild(contentCard);
                });
            }
        }
    } catch (error) {
        console.error('Failed to load recommended content:', error);
        const container = document.getElementById('recommended-content');
        if (container) {
            container.innerHTML = `
                <div class="text-center py-8 text-red-500">
                    <p>Failed to load recommendations. Please try again later.</p>
                </div>
            `;
        }
    }
}

async function searchContent(query) {
    if (!query.trim()) {
        loadContent();
        return;
    }
    
    AppState.content.loading = true;
    updateUI();
    
    try {
        const params = new URLSearchParams({
            q: query,
            limit: AppState.content.pagination.perPage,
            ...AppState.content.filters
        });
        
        const response = await apiRequest(`/contents/search?${params}`);
        
        if (response.success) {
            AppState.content.items = response.data.results;
            AppState.content.pagination = {
                currentPage: response.data.pagination.current_page,
                totalPages: response.data.pagination.pages,
                perPage: response.data.pagination.per_page,
                total: response.data.pagination.total
            };
            AppState.content.filters.search = query;
        }
    } catch (error) {
        console.error('Search failed:', error);
        showToast('Search failed', 'error');
    } finally {
        AppState.content.loading = false;
        updateUI();
    }
}

function filterContent(filterType, value) {
    AppState.content.filters[filterType] = value;
    loadContent(AppState.content.filters);
}

function loadPage(page) {
    loadContent(AppState.content.filters, page);
}

// UI Helper Functions
function showToast(message, type = 'info') {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 transition-all duration-300 transform translate-x-full`;
    
    const colors = {
        info: 'bg-blue-500 text-white',
        success: 'bg-green-500 text-white',
        error: 'bg-red-500 text-white',
        warning: 'bg-yellow-500 text-black'
    };
    
    toast.className += ` ${colors[type] || colors.info}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
        toast.classList.remove('translate-x-full');
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.add('translate-x-full');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

function createContentCard(content) {
    const duration = content.estimated_duration_seconds ? 
        `${Math.ceil(content.estimated_duration_seconds / 60)} min` : 'N/A';
    
    // Ensure difficulty_level is within valid range (1-5)
    const difficulty = Math.min(Math.max(parseInt(content.difficulty_level) || 1, 1), 5);
    const difficultyStars = '★'.repeat(difficulty) + 
        '☆'.repeat(5 - difficulty);
    
    return `
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-all duration-200 cursor-pointer content-card"
             data-content-id="${content.content_id}" onclick="viewContent('${content.content_id}')">
            <div class="p-4">
                <div class="flex justify-between items-start mb-2">
                    <span class="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                        ${content.category.replace('_', ' ')}
                    </span>
                    ${content.is_premium ? '<span class="text-yellow-500">👑</span>' : ''}
                </div>
                <h3 class="font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
                    ${content.title}
                </h3>
                <p class="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-3">
                    ${content.description || 'No description available'}
                </p>
                <div class="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
                    <span>${difficultyStars}</span>
                    <span>${duration}</span>
                </div>
            </div>
        </div>
    `;
}

function createRecommendedCard(content) {
    const duration = content.estimated_duration_seconds ? 
        `${Math.ceil(content.estimated_duration_seconds / 60)} min` : 'N/A';
    
    const difficultyLevel = content.difficulty_level || 1;
    const difficultyText = ['Easy', 'Medium', 'Hard', 'Expert', 'Master'][difficultyLevel - 1] || 'Easy';
    
    const card = document.createElement('div');
    card.className = 'flex items-center p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer';
    card.onclick = () => viewContent(content.content_id);
    
    card.innerHTML = `
        <div class="flex-shrink-0 w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center">
            <span class="text-xl">${getCategoryIcon(content.category)}</span>
        </div>
        <div class="ml-4 flex-1">
            <h4 class="text-sm font-medium text-gray-900 dark:text-white">${content.title}</h4>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">${content.description || 'No description'}</p>
            <div class="flex items-center mt-2 space-x-3">
                <span class="text-xs text-indigo-600 dark:text-indigo-400 font-medium">${difficultyText}</span>
                <span class="text-xs text-gray-500 dark:text-gray-400">${duration}</span>
                ${content.is_premium ? '<span class="text-xs text-yellow-500">👑 Premium</span>' : ''}
            </div>
        </div>
        <div class="flex-shrink-0">
            <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
            </svg>
        </div>
    `;
    
    return card;
}

function getCategoryIcon(category) {
    const icons = {
        'memory_game': '🧠',
        'puzzle': '🧩', 
        'trivia': '🧠',
        'meditation': '🧘',
        'challenge': '🎯',
        'article': '📖'
    };
    return icons[category] || '🎯';
}

async function viewContent(contentId) {
    try {
        const response = await apiRequest(`/contents/get?id=${contentId}`);
        if (response.success && response.data) {
            showContentModal(response.data.content, response.data.related);
        } else {
            throw new Error('Invalid response structure');
        }
    } catch (error) {
        console.error('Failed to load content details:', error);
        showToast('Failed to load content details', 'error');
    }
}

function showContentModal(content, related = []) {
    const duration = content.estimated_duration_seconds ? 
        `${Math.ceil(content.estimated_duration_seconds / 60)} min` : 'N/A';
    
    // Ensure difficulty_level is within valid range (1-5)
    const difficulty = Math.min(Math.max(parseInt(content.difficulty_level) || 1, 1), 5);
    const difficultyStars = '★'.repeat(difficulty) + 
        '☆'.repeat(5 - difficulty);
    
    const categoryIcon = getCategoryIcon(content.category);
    const categoryName = content.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    const modalHTML = `
        <div id="content-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div class="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl transform animate-slideIn">
                <!-- Modal Header -->
                <div class="relative bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-6 rounded-t-xl">
                    <button onclick="closeContentModal()" class="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                    
                    <div class="flex items-start space-x-4">
                        <div class="flex-shrink-0 w-16 h-16 bg-white bg-opacity-20 rounded-xl flex items-center justify-center text-2xl">
                            ${categoryIcon}
                        </div>
                        <div class="flex-1">
                            <h2 class="text-2xl font-bold mb-2">${content.title}</h2>
                            <div class="flex flex-wrap items-center gap-3 text-sm">
                                <span class="bg-white bg-opacity-20 px-3 py-1 rounded-full">
                                    ${categoryName}
                                </span>
                                <span class="bg-white bg-opacity-20 px-3 py-1 rounded-full">
                                    ${difficultyStars}
                                </span>
                                <span class="bg-white bg-opacity-20 px-3 py-1 rounded-full">
                                    ⏱️ ${duration}
                                </span>
                                ${content.is_premium ? '<span class="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full font-medium">👑 Premium</span>' : ''}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Modal Content -->
                <div class="p-6">
                    <!-- Description -->
                    <div class="mb-6">
                        <h3 class="font-semibold text-gray-900 dark:text-white mb-3">About This Activity</h3>
                        <p class="text-gray-700 dark:text-gray-300 leading-relaxed">${content.description || 'No description available.'}</p>
                    </div>

                    <!-- Activity Details -->
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div class="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div class="text-2xl font-bold text-indigo-600 dark:text-indigo-400">${content.difficulty_level || 1}</div>
                            <div class="text-sm text-gray-600 dark:text-gray-400">Difficulty Level</div>
                        </div>
                        <div class="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div class="text-2xl font-bold text-green-600 dark:text-green-400">${duration}</div>
                            <div class="text-sm text-gray-600 dark:text-gray-400">Estimated Duration</div>
                        </div>
                        <div class="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div class="text-2xl font-bold text-orange-600 dark:text-orange-400">${Math.floor(Math.random() * 50) + 10}</div>
                            <div class="text-sm text-gray-600 dark:text-gray-400">Points Possible</div>
                        </div>
                    </div>

                    <!-- Content Data (if available) -->
                    ${content.content_data && content.content_data.instructions ? `
                        <div class="mb-6">
                            <h3 class="font-semibold text-gray-900 dark:text-white mb-3">Instructions</h3>
                            <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                                <p class="text-blue-800 dark:text-blue-200">${content.content_data.instructions}</p>
                            </div>
                        </div>
                    ` : ''}

                    <!-- Action Buttons -->
                    <div class="flex gap-3 mb-6">
                        <button onclick="startActivity('${content.content_id}')" class="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 font-medium flex items-center justify-center">
                            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.01M15 10h1.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            Start Activity
                        </button>
                        <button onclick="shareContent('${content.content_id}')" class="px-4 py-3 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors flex items-center">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"></path>
                            </svg>
                        </button>
                        <button onclick="addToFavorites('${content.content_id}')" class="px-4 py-3 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors flex items-center">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                            </svg>
                        </button>
                    </div>

                    <!-- Related Content -->
                    ${related.length > 0 ? `
                        <div class="pt-6 border-t border-gray-200 dark:border-gray-600">
                            <div class="flex items-center justify-between mb-4">
                                <h3 class="font-semibold text-gray-900 dark:text-white">You Might Also Like</h3>
                                <span class="text-sm text-gray-500 dark:text-gray-400">${related.length} more activities</span>
                            </div>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                ${related.slice(0, 4).map(item => `
                                    <div class="group p-4 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors border hover:border-indigo-200 dark:hover:border-indigo-700"
                                         onclick="closeContentModal(); setTimeout(() => viewContent('${item.content_id}'), 100)">
                                        <div class="flex items-center space-x-3">
                                            <div class="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center text-lg">
                                                ${getCategoryIcon(item.category)}
                                            </div>
                                            <div class="flex-1">
                                                <h4 class="font-medium text-gray-900 dark:text-white text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">${item.title}</h4>
                                                <div class="flex items-center space-x-2 mt-1">
                                                    <span class="text-xs text-gray-500 dark:text-gray-400">${item.category.replace('_', ' ')}</span>
                                                    <span class="text-xs text-gray-400">•</span>
                                                    <span class="text-xs text-gray-500 dark:text-gray-400">${'★'.repeat(Math.min(Math.max(parseInt(item.difficulty_level) || 1, 1), 5))}</span>
                                                </div>
                                            </div>
                                            <svg class="w-4 h-4 text-gray-400 group-hover:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                                            </svg>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
}

function closeContentModal() {
    const modal = document.getElementById('content-modal');
    if (modal) {
        modal.remove();
        // Restore body scroll
        document.body.style.overflow = 'auto';
    }
}

// Modal action functions
async function startActivity(contentId) {
    closeContentModal();
    showToast('Loading activity...', 'info');
    
    try {
        // Check if user is logged in first
        const token = localStorage.getItem('ss_access_token');
        if (!token) {
            showToast('Please log in to start activities', 'error');
            navigateTo('login');
            return;
        }
        
        // Start activity session via API
        const sessionResponse = await apiRequest('/activities/start', {
            method: 'POST',
            body: { content_id: contentId }
        });
        
        if (!sessionResponse.success) {
            throw new Error('Failed to start activity session');
        }
        
        const content = sessionResponse.data.content;
        const sessionId = sessionResponse.data.session_id;
        const gameType = mapContentToGameType(content.category, content.title);
        
        if (gameType) {
            showGamePage(content, gameType, sessionId);
        } else {
            showActivityPlaceholder(content);
        }
        
    } catch (error) {
        console.error('Error starting activity:', error);
        showToast('Failed to load activity. Please try again.', 'error');
    }
}

function mapContentToGameType(category, title) {
    // Map content categories and titles to specific game types
    const gameMapping = {
        'memory_game': {
            'card': 'card-matching',
            'sequence': 'sequence-memorization', 
            'pattern': 'pattern-recognition'
        },
        'puzzle': {
            'sliding': 'sliding-puzzle',
            'word': 'word-search',
            'logic': 'logic-puzzle',
            'jigsaw': 'jigsaw-puzzle'
        },
        'trivia': {
            'multiple': 'multiple-choice',
            'true': 'true-false',
            'timed': 'timed-challenge'
        },
        'meditation': {
            'breathing': 'breathing-exercise',
            'guided': 'guided-meditation', 
            'focus': 'focus-timer',
            'visualization': 'visualization'
        }
    };
    
    if (category === 'memory_game') {
        // Try to determine specific memory game type from title
        const titleLower = title.toLowerCase();
        if (titleLower.includes('card') || titleLower.includes('match')) {
            return 'card-matching';
        } else if (titleLower.includes('sequence')) {
            return 'sequence-memorization';
        } else if (titleLower.includes('pattern')) {
            return 'pattern-recognition';
        }
        // Default to card matching for memory games
        return 'card-matching';
    }
    
    if (category === 'puzzle') {
        // Try to determine specific puzzle type from title
        const titleLower = title.toLowerCase();
        if (titleLower.includes('sliding') || titleLower.includes('slide')) {
            return 'sliding-puzzle';
        } else if (titleLower.includes('word') || titleLower.includes('search')) {
            return 'word-search';
        } else if (titleLower.includes('logic')) {
            return 'logic-puzzle';
        } else if (titleLower.includes('jigsaw')) {
            return 'jigsaw-puzzle';
        }
        // Default to sliding puzzle for puzzle games
        return 'sliding-puzzle';
    }
    
    if (category === 'trivia') {
        // Try to determine specific quiz type from title
        const titleLower = title.toLowerCase();
        if (titleLower.includes('true') || titleLower.includes('false')) {
            return 'true-false';
        } else if (titleLower.includes('timed') || titleLower.includes('speed')) {
            return 'timed-challenge';
        }
        // Default to multiple choice for trivia
        return 'multiple-choice';
    }
    
    if (category === 'meditation') {
        // Try to determine specific meditation type from title
        const titleLower = title.toLowerCase();
        if (titleLower.includes('breathing') || titleLower.includes('breath')) {
            return 'breathing-exercise';
        } else if (titleLower.includes('guided')) {
            return 'guided-meditation';
        } else if (titleLower.includes('focus') || titleLower.includes('concentration')) {
            return 'focus-timer';
        } else if (titleLower.includes('visualization') || titleLower.includes('visualize')) {
            return 'visualization';
        }
        // Default to breathing exercise for meditation
        return 'breathing-exercise';
    }
    
    return null; // Game type not supported yet
}

function showGamePage(content, gameType, sessionId) {
    const app = document.getElementById('app');
    const difficultyMap = { 1: 'easy', 2: 'easy', 3: 'medium', 4: 'medium', 5: 'hard' };
    const difficulty = difficultyMap[content.difficulty_level] || 'easy';
    
    app.innerHTML = `
        <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
            <!-- Game Navigation -->
            <nav class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
                <div class="mx-auto px-4 max-w-md">
                    <div class="flex justify-between items-center h-16">
                        <div class="flex items-center space-x-4">
                            <button onclick="navigateTo('home')" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                                </svg>
                            </button>
                            <div>
                                <h1 class="text-lg font-semibold text-gray-900 dark:text-white">${content.title}</h1>
                                <p class="text-sm text-gray-500 dark:text-gray-400">${content.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} • ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}</p>
                            </div>
                        </div>
                        <div class="flex items-center space-x-4">
                            <div class="text-sm text-gray-600 dark:text-gray-400">
                                ${content.is_premium ? '<span class="text-yellow-500">👑 Premium</span>' : ''}
                            </div>
                        </div>
                    </div>
                </div>
            </nav>
            
            <!-- Game Container -->
            <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div id="game-container" class="relative">
                    <div class="text-center py-8">
                        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                        <p class="mt-2 text-gray-600 dark:text-gray-400">Initializing game...</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Initialize the game after a brief delay to show loading
    setTimeout(() => {
        const gameContainer = document.getElementById('game-container');
        
        // Check if it's a memory game type
        if (['card-matching', 'sequence-memorization', 'pattern-recognition'].includes(gameType)) {
            if (gameContainer && window.MemoryGame) {
                try {
                    const game = new MemoryGame(gameType, difficulty, gameContainer, sessionId);
                    showToast('Game ready! Click any card to start.', 'success');
                } catch (error) {
                    console.error('Error initializing memory game:', error);
                    showGameError(gameContainer, 'Failed to initialize game. Please try again.');
                }
            } else {
                showGameError(gameContainer, 'Memory game engine not available.');
            }
        }
        // Check if it's a puzzle game type
        else if (['sliding-puzzle', 'word-search', 'logic-puzzle', 'jigsaw-puzzle'].includes(gameType)) {
            if (gameContainer && window.PuzzleGame) {
                try {
                    const game = new PuzzleGame(gameType, difficulty, gameContainer, sessionId);
                    showToast('Game ready! Start solving the puzzle!', 'success');
                } catch (error) {
                    console.error('Error initializing puzzle game:', error);
                    showGameError(gameContainer, 'Failed to initialize puzzle. Please try again.');
                }
            } else {
                showGameError(gameContainer, 'Puzzle game engine not available.');
            }
        }
        // Check if it's a quiz game type
        else if (['multiple-choice', 'true-false', 'timed-challenge'].includes(gameType)) {
            if (gameContainer && window.QuizGame) {
                try {
                    const game = new QuizGame(gameType, difficulty, gameContainer, sessionId);
                    game.start();
                    showToast('Quiz ready! Answer the questions!', 'success');
                } catch (error) {
                    console.error('Error initializing quiz game:', error);
                    showGameError(gameContainer, 'Failed to initialize quiz. Please try again.');
                }
            } else {
                showGameError(gameContainer, 'Quiz game engine not available.');
            }
        }
        // Check if it's a meditation session type
        else if (['breathing-exercise', 'guided-meditation', 'focus-timer', 'visualization'].includes(gameType)) {
            if (gameContainer && window.MeditationPlayer) {
                try {
                    // Map game types to meditation player types
                    const meditationTypeMap = {
                        'breathing-exercise': 'breathing',
                        'guided-meditation': 'guided',
                        'focus-timer': 'focus-timer',
                        'visualization': 'visualization'
                    };
                    
                    const meditationType = meditationTypeMap[gameType];
                    const defaultDuration = difficulty === 'easy' ? 300 : difficulty === 'medium' ? 600 : 900;
                    
                    const meditation = new MeditationPlayer(meditationType, defaultDuration, gameContainer, sessionId);
                    meditation.start();
                    showToast('Meditation session ready. Press play to begin.', 'success');
                } catch (error) {
                    console.error('Error initializing meditation session:', error);
                    showGameError(gameContainer, 'Failed to initialize meditation session. Please try again.');
                }
            } else {
                showGameError(gameContainer, 'Meditation player not available.');
            }
        }
        else {
            showGameError(gameContainer, 'Game type not supported yet.');
        }
    }, 1000);
}

function shareContent(contentId) {
    if (navigator.share) {
        navigator.share({
            title: 'Stop Scrolling Activity',
            text: 'Check out this cognitive exercise!',
            url: `${window.location.origin}/stop-scrolling/activity/${contentId}`
        }).catch(err => console.log('Share failed:', err));
    } else {
        // Fallback: copy to clipboard
        const url = `${window.location.origin}/stop-scrolling/activity/${contentId}`;
        navigator.clipboard.writeText(url).then(() => {
            showToast('Link copied to clipboard!', 'success');
        }).catch(() => {
            showToast('Unable to share content', 'error');
        });
    }
}

function addToFavorites(contentId) {
    // TODO: Implement favorites functionality with user API
    showToast('Added to favorites!', 'success');
}

function showActivityPlaceholder(content) {
    const app = document.getElementById('app');
    const categoryName = content.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    app.innerHTML = `
        <div class="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center p-4">
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 max-w-2xl w-full text-center">
                <div class="text-6xl mb-6">${getCategoryIcon(content.category)}</div>
                <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-4">${content.title}</h1>
                <p class="text-gray-600 dark:text-gray-400 mb-2">
                    <strong>${categoryName}</strong> activities are coming in future updates!
                </p>
                <p class="text-gray-600 dark:text-gray-400 mb-8">
                    ${content.description || 'This interactive activity will challenge your cognitive abilities.'}
                </p>
                <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                    <h3 class="font-semibold text-blue-800 dark:text-blue-200 mb-2">What's Available Now:</h3>
                    <ul class="text-blue-700 dark:text-blue-300 text-sm space-y-1">
                        <li>✅ Memory Games (Card Matching, Sequences, Patterns)</li>
                        <li>🔄 Puzzle Games (Coming Next)</li>
                        <li>🔄 Trivia Challenges (Coming Next)</li>
                        <li>🔄 Mindfulness Exercises (Coming Next)</li>
                    </ul>
                </div>
                <div class="flex gap-4 justify-center">
                    <button onclick="navigateTo('home')" class="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors">
                        Back to Dashboard
                    </button>
                    <button onclick="viewContent('${content.content_id}')" class="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">
                        View Details
                    </button>
                </div>
            </div>
        </div>
    `;
}

function showGameError(container, message) {
    if (!container) return;
    
    container.innerHTML = `
        <div class="text-center py-12">
            <div class="text-6xl mb-4">😕</div>
            <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-4">Oops! Something went wrong</h3>
            <p class="text-gray-600 dark:text-gray-400 mb-6">${message}</p>
            <div class="flex gap-4 justify-center">
                <button onclick="location.reload()" class="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors">
                    Try Again
                </button>
                <button onclick="navigateTo('home')" class="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors">
                    Back to Dashboard
                </button>
            </div>
        </div>
    `;
}

// UI Update Functions
function updateUI() {
    // Update loading state
    const loadingEl = document.getElementById('content-loading');
    const gridEl = document.getElementById('content-grid');
    const emptyEl = document.getElementById('content-empty');
    
    if (loadingEl) {
        loadingEl.classList.toggle('hidden', !AppState.content.loading);
    }
    
    if (gridEl && !AppState.content.loading) {
        gridEl.classList.toggle('hidden', AppState.content.items.length === 0);
        
        // Update content grid
        if (AppState.content.items.length > 0) {
            gridEl.innerHTML = AppState.content.items.map(createContentCard).join('');
        }
    }
    
    if (emptyEl && !AppState.content.loading) {
        emptyEl.classList.toggle('hidden', AppState.content.items.length > 0);
    }
    
    // Update results count
    const countEl = document.getElementById('results-count');
    if (countEl) {
        countEl.textContent = `${AppState.content.pagination.total || 0} items`;
    }
    
    // Update category filters
    updateCategoryFilters();
    
    // Update pagination
    updatePagination();
}

function updateCategoryFilters() {
    const filtersEl = document.getElementById('category-filters');
    if (!filtersEl || AppState.content.categories.length === 0) return;
    
    filtersEl.innerHTML = AppState.content.categories.map(category => `
        <button onclick="filterContent('category', '${category.category}')" 
                class="px-3 py-1 text-sm rounded-full border hover:bg-gray-50 dark:hover:bg-gray-700 whitespace-nowrap filter-btn
                       ${AppState.content.filters.category === category.category ? 
                         'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-900 dark:text-indigo-200' : 
                         'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'}"
                data-filter-type="category" data-filter-value="${category.category}">
            ${category.icon} ${category.name} (${category.content_count})
        </button>
    `).join('');
    
    // Update "All" button state
    const allButton = document.querySelector('.filter-btn[data-filter-value=""]');
    if (allButton) {
        const isActive = AppState.content.filters.category === '';
        allButton.className = allButton.className.replace(
            /bg-(indigo|white|gray)-(100|800|900) text-(indigo|gray)-(800|700|300|200) border-(indigo|gray)-(300|600)/g, 
            ''
        );
        allButton.classList.add(
            ...(isActive ? 
                ['bg-indigo-100', 'text-indigo-800', 'border-indigo-300', 'dark:bg-indigo-900', 'dark:text-indigo-200'] :
                ['bg-white', 'dark:bg-gray-800', 'text-gray-700', 'dark:text-gray-300', 'border-gray-300', 'dark:border-gray-600'])
        );
    }
}

function updatePagination() {
    const paginationEl = document.getElementById('pagination');
    if (!paginationEl) return;
    
    const { currentPage, totalPages } = AppState.content.pagination;
    
    if (totalPages <= 1) {
        paginationEl.innerHTML = '';
        return;
    }
    
    let paginationHTML = '';
    
    // Previous button
    if (currentPage > 1) {
        paginationHTML += `
            <button onclick="loadPage(${currentPage - 1})" 
                    class="px-3 py-2 mx-1 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-white">
                Previous
            </button>
        `;
    }
    
    // Page numbers (show max 7 pages)
    const startPage = Math.max(1, currentPage - 3);
    const endPage = Math.min(totalPages, startPage + 6);
    
    for (let page = startPage; page <= endPage; page++) {
        const isActive = page === currentPage;
        paginationHTML += `
            <button onclick="loadPage(${page})" 
                    class="px-3 py-2 mx-1 text-sm rounded-lg border ${isActive ? 
                        'bg-indigo-600 text-white border-indigo-600' : 
                        'bg-white border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-white'}">
                ${page}
            </button>
        `;
    }
    
    // Next button
    if (currentPage < totalPages) {
        paginationHTML += `
            <button onclick="loadPage(${currentPage + 1})" 
                    class="px-3 py-2 mx-1 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-white">
                Next
            </button>
        `;
    }
    
    paginationEl.innerHTML = `<div class="flex items-center">${paginationHTML}</div>`;
}

function setupSearchHandlers() {
    const searchInput = document.getElementById('search-input');
    if (!searchInput) return;
    
    let searchTimeout;
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        const query = this.value.trim();
        
        searchTimeout = setTimeout(() => {
            if (query.length === 0) {
                AppState.content.filters.search = '';
                loadContent(AppState.content.filters);
            } else if (query.length >= 2) {
                searchContent(query);
            }
        }, 500); // Debounce for 500ms
    });
    
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            clearTimeout(searchTimeout);
            const query = this.value.trim();
            if (query.length >= 2) {
                searchContent(query);
            } else if (query.length === 0) {
                AppState.content.filters.search = '';
                loadContent(AppState.content.filters);
            }
        }
    });
}

// Theme Functions
function applyTheme(theme) {
    const nextTheme = ThemeManager ? ThemeManager.setMode(theme) : theme;

    if (!ThemeManager && typeof StopScrollingTheme !== 'undefined' && StopScrollingTheme.applyCssVariables) {
        StopScrollingTheme.applyCssVariables(nextTheme);
    }

    if (typeof document !== 'undefined' && document.documentElement) {
        document.documentElement.setAttribute('data-theme', nextTheme);
    }

    localStorage.setItem('ss_theme', nextTheme);
    AppState.theme = nextTheme;

    if (typeof Analytics !== 'undefined' && Analytics.trackEvent) {
        Analytics.trackEvent('theme_applied', { mode: nextTheme });
    }

    return nextTheme;
}

function toggleTheme() {
    const newTheme = AppState.theme === 'light' ? 'dark' : 'light';
    const appliedTheme = applyTheme(newTheme);
    if (typeof Analytics !== 'undefined' && Analytics.trackEvent) {
        Analytics.trackEvent('theme_toggle', { mode: appliedTheme });
    }
}

// Navigation Functions
function toggleMobileMenu() {
    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileMenu) {
        mobileMenu.classList.toggle('hidden');
    }
}

function toggleUserDropdown() {
    const dropdown = document.getElementById('user-dropdown');
    if (dropdown) {
        dropdown.classList.toggle('hidden');
    }
}

// Close dropdowns when clicking outside
document.addEventListener('click', function(event) {
    const userDropdown = document.getElementById('user-dropdown');
    const mobileMenu = document.getElementById('mobile-menu');
    
    // Close user dropdown if clicking outside
    if (userDropdown && !userDropdown.classList.contains('hidden')) {
        const userButton = event.target.closest('[onclick="toggleUserDropdown()"]');
        if (!userButton && !userDropdown.contains(event.target)) {
            userDropdown.classList.add('hidden');
        }
    }
    
    // Close mobile menu if clicking outside
    if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
        const menuButton = event.target.closest('[onclick="toggleMobileMenu()"]');
        if (!menuButton && !mobileMenu.contains(event.target)) {
            mobileMenu.classList.add('hidden');
        }
    }
});

// Export for use in other modules
window.StopScrolling = {
    apiRequest,
    navigateTo,
    logout,
    toggleTheme,
    toggleMobileMenu,
    toggleUserDropdown,
    loadContent,
    loadCategories,
    loadRecommendedContent,
    searchContent,
    filterContent,
    loadPage,
    viewContent,
    showToast,
    createContentCard,
    createRecommendedCard,
    getCategoryIcon,
    showContentModal,
    closeContentModal,
    startActivity,
    shareContent,
    addToFavorites,
    showActivityPlaceholder,
    showGamePage,
    showGameError,
    mapContentToGameType,
    updateActivityProgress,
    completeActivity,
    getActivityHistory,
    AppState,
    APP_CONFIG
};

// Activity Tracking Functions
async function updateActivityProgress(sessionId, progressData) {
    try {
        const response = await apiRequest('/activities/update', {
            method: 'POST',
            body: JSON.stringify({
                session_id: sessionId,
                ...progressData
            })
        });
        
        if (!response.success) {
            console.warn('Failed to update activity progress:', response.message);
        }
        
        return response;
    } catch (error) {
        console.error('Error updating activity progress:', error);
        return { success: false, message: error.message };
    }
}

async function completeActivity(sessionId, scoreData) {
    try {
        const response = await apiRequest('/activities/complete', {
            method: 'POST',
            body: JSON.stringify({
                session_id: sessionId,
                ...scoreData
            })
        });
        
        if (response.success) {
            // Show completion message with experience points
            const xp = response.data.experience_points;
            showToast(`Activity completed! +${xp} XP earned`, 'success');
            
            // Check for achievements
            if (response.data.achievements && response.data.achievements.length > 0) {
                response.data.achievements.forEach(achievement => {
                    showToast(`🏆 Achievement: ${achievement.name}!`, 'success');
                });
            }
        }
        
        return response;
    } catch (error) {
        console.error('Error completing activity:', error);
        return { success: false, message: error.message };
    }
}

async function getActivityHistory(filters = {}) {
    try {
        const params = new URLSearchParams(filters);
        const response = await apiRequest(`/activities/history?${params}`);
        return response;
    } catch (error) {
        console.error('Error getting activity history:', error);
        return { success: false, message: error.message };
    }
}

// ============================================
// Flow System Functions
// ============================================
let selectedSessionType = null;
let sessionManager = null;
let contentSequencer = null;
let activityFlowController = null;

function showSessionSelector() {
    const selector = document.getElementById('sessionSelector');
    if (selector) {
        selector.classList.add('active');
    }
}

function closeSessionSelector() {
    const selector = document.getElementById('sessionSelector');
    if (selector) {
        selector.classList.remove('active');
    }
    selectedSessionType = null;
    
    // Reset selection
    document.querySelectorAll('.session-type-card').forEach(card => {
        card.classList.remove('selected');
    });
    const startBtn = document.getElementById('startSessionBtn');
    if (startBtn) startBtn.disabled = true;
}

function selectSessionType(type) {
    selectedSessionType = type;
    
    // Update UI
    document.querySelectorAll('.session-type-card').forEach(card => {
        card.classList.remove('selected');
    });
    const selectedCard = document.querySelector(`[data-type="${type}"]`);
    if (selectedCard) selectedCard.classList.add('selected');
    
    const startBtn = document.getElementById('startSessionBtn');
    if (startBtn) startBtn.disabled = false;
}

async function startSelectedSession() {
    if (!selectedSessionType) return;
    
    showToast('Starting your journey...', 'info');
    closeSessionSelector();
    
    try {
        // Initialize flow system if not already done
        if (!sessionManager) {
            await initializeFlowSystem();
        }
        
        // Start flow session via API
        const response = await apiRequest('/sessions/start-flow', {
            method: 'POST',
            body: {
                type: selectedSessionType,
                config: {
                    pattern: 'balanced',
                    autoAdvance: true,
                    transitions: true
                }
            }
        });
        
        if (response.success) {
            // Start the flow
            const result = await activityFlowController.startFlow({
                type: selectedSessionType,
                sessionId: response.data.sessionId,
                sequence: response.data.sequence
            });
            
            if (result.success) {
                showToast('Journey started!', 'success');
            }
        }
    } catch (error) {
        console.error('Failed to start session:', error);
        showToast('Failed to start journey. Please try again.', 'error');
    }
}

async function initializeFlowSystem() {
    try {
        console.log('Loading flow system scripts...');
        
        // Load flow system scripts
        await loadScript('/stop-scrolling/assets/js/SessionManager.js');
        console.log('SessionManager loaded, type:', typeof window.SessionManager);
        
        await loadScript('/stop-scrolling/assets/js/ContentSequencer.js');
        console.log('ContentSequencer loaded, type:', typeof window.ContentSequencer);
        
        await loadScript('/stop-scrolling/assets/js/ActivityFlowController.js');
        console.log('ActivityFlowController loaded, type:', typeof window.ActivityFlowController);
        
        // Wait a bit for classes to be available
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Debug what's available on window
        console.log('Available constructors:', {
            SessionManager: typeof window.SessionManager,
            ContentSequencer: typeof window.ContentSequencer,
            ActivityFlowController: typeof window.ActivityFlowController
        });
        
        // Check if classes are available
        if (typeof window.SessionManager !== 'function') {
            console.error('SessionManager not available. Window keys:', Object.keys(window).filter(k => k.includes('Session')));
            throw new Error('SessionManager class not available');
        }
        if (typeof window.ContentSequencer !== 'function') {
            throw new Error('ContentSequencer class not available');
        }
        if (typeof window.ActivityFlowController !== 'function') {
            throw new Error('ActivityFlowController class not available');
        }
        
        // Initialize components
        console.log('Creating SessionManager instance...');
        sessionManager = new window.SessionManager();
        
        console.log('Creating ContentSequencer instance...');
        contentSequencer = new window.ContentSequencer();
        
        console.log('Creating ActivityFlowController instance...');
        activityFlowController = new window.ActivityFlowController(sessionManager, contentSequencer);
        
        // Make flow controller globally accessible
        window.activityFlow = activityFlowController;
        
        console.log('Flow system initialized successfully');
    } catch (error) {
        console.error('Failed to initialize flow system:', error);
        throw error;
    }
}

function loadScript(src) {
    return new Promise((resolve, reject) => {
        // Check if script already loaded
        const existing = document.querySelector(`script[src="${src}"]`);
        if (existing) {
            resolve();
            return;
        }
        
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// Make functions globally available
window.showSessionSelector = showSessionSelector;
window.closeSessionSelector = closeSessionSelector;
window.selectSessionType = selectSessionType;
window.startSelectedSession = startSelectedSession;