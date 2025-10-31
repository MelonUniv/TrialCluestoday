<?php
/**
 * Stop Scrolling - Main Entry Point
 * Handles routing for the single-page application
 */

session_start();

// Load configuration
require_once __DIR__ . '/config/app.php';
$analyticsConfig = require __DIR__ . '/config/analytics.php';
$analyticsEnabled = !empty($analyticsConfig['enabled'])
    && !empty($analyticsConfig['firebase']['appId'])
    && !empty($analyticsConfig['firebase']['measurementId']);

if (!$analyticsEnabled) {
    $analyticsConfig['enabled'] = false;
}

// Check if it's an API request
if (strpos($_SERVER['REQUEST_URI'], '/api/') !== false) {
    // Redirect to API handler
    require_once __DIR__ . '/api/v1/index.php';
    exit;
}

// For all other requests, serve the main HTML
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <meta name="description" content="Stop Scrolling - Break free from social media addiction with engaging cognitive exercises, games, and mindfulness activities.">
    
    <!-- PWA Meta Tags -->
    <meta name="theme-color" content="#667eea">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    
    <title>Stop Scrolling - Break Your Social Media Addiction</title>
    
    <!-- Manifest -->
    <link rel="manifest" href="/stop-scrolling/manifest.json">
    
    <!-- Icons -->
    <link rel="icon" type="image/png" sizes="32x32" href="/stop-scrolling/assets/images/favicon-32x32.png">
    <link rel="apple-touch-icon" sizes="180x180" href="/stop-scrolling/assets/images/apple-touch-icon.png">
    
    <!-- CSS -->
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    <link rel="stylesheet" href="/stop-scrolling/assets/css/app.css">
    <link rel="stylesheet" href="/stop-scrolling/assets/css/flow.css">
    <link rel="stylesheet" href="/stop-scrolling/assets/css/daily-recap.css">
    <link rel="stylesheet" href="/stop-scrolling/assets/css/settings.css">
    
    <!-- Preconnect to CDNs -->
    <link rel="preconnect" href="https://cdn.jsdelivr.net">
    <link rel="dns-prefetch" href="https://cdn.jsdelivr.net">
    <script>
        window.__APP_ANALYTICS__ = <?php echo json_encode($analyticsConfig, JSON_UNESCAPED_SLASHES); ?>;
    </script>
<?php if ($analyticsEnabled): ?>
    <script src="https://www.gstatic.com/firebasejs/10.13.1/firebase-app-compat.js" defer></script>
    <script src="https://www.gstatic.com/firebasejs/10.13.1/firebase-analytics-compat.js" defer></script>
<?php endif; ?>
</head>
<body class="bg-gray-50 dark:bg-gray-900">
    <!-- App Root -->
    <div id="app" class="min-h-screen" role="main" aria-live="polite">
        <!-- Landing Page -->
        <div class="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
            <div class="mx-auto px-4 py-8 max-w-md">
                <div class="text-center">
                    <h1 class="text-3xl font-bold text-white mb-6 leading-tight">
                        Stop Scrolling,<br>Start Living
                    </h1>
                    <p class="text-lg text-gray-200 mb-8">
                        Break free from social media addiction with engaging cognitive exercises, games, and mindfulness activities.
                    </p>
                    
                    <!-- CTA Buttons -->
                    <div class="flex flex-col gap-4 mb-12">
                        <a href="/stop-scrolling/#register" class="bg-white text-indigo-600 px-8 py-4 rounded-lg font-semibold text-center transition-colors">
                            Get Started Free
                        </a>
                        <a href="/stop-scrolling/#login" class="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-center transition-colors">
                            Sign In
                        </a>
                    </div>
                    
                    <!-- Features Preview -->
                    <div class="space-y-6 mt-12">
                        <div class="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-6">
                            <div class="text-3xl mb-3">🧠</div>
                            <h3 class="text-lg font-semibold text-white mb-2">Memory Games</h3>
                            <p class="text-sm text-gray-200">Challenge your mind with card matching and pattern recognition games.</p>
                        </div>
                        <div class="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-6">
                            <div class="text-3xl mb-3">🧩</div>
                            <h3 class="text-lg font-semibold text-white mb-2">Puzzle Challenges</h3>
                            <p class="text-sm text-gray-200">Solve puzzles and logic problems to sharpen your focus.</p>
                        </div>
                        <div class="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-6">
                            <div class="text-3xl mb-3">🧘</div>
                            <h3 class="text-lg font-semibold text-white mb-2">Mindfulness</h3>
                            <p class="text-sm text-gray-200">Practice breathing exercises and meditation to improve well-being.</p>
                        </div>
                    </div>
                    
                    <!-- Stats -->
                    <div class="grid grid-cols-3 gap-4 mt-12">
                        <div class="text-center">
                            <div class="text-2xl font-bold text-white">48</div>
                            <div class="text-xs text-gray-200">Users</div>
                        </div>
                        <div class="text-center">
                            <div class="text-2xl font-bold text-white">59</div>
                            <div class="text-xs text-gray-200">Activities</div>
                        </div>
                        <div class="text-center">
                            <div class="text-2xl font-bold text-white">100%</div>
                            <div class="text-xs text-gray-200">Free</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Noscript fallback -->
    <noscript>
        <div class="min-h-screen flex items-center justify-center p-4">
            <div class="max-w-md text-center">
                <h1 class="text-2xl font-bold mb-4">JavaScript Required</h1>
                <p>Stop Scrolling requires JavaScript to run. Please enable JavaScript in your browser settings.</p>
            </div>
        </div>
    </noscript>
    
    <!-- Core JavaScript -->
    <script>
        // Force show the landing page immediately
        window.addEventListener('load', function() {
            console.log('Window loaded, checking app initialization...');
            setTimeout(() => {
                const loader = document.getElementById('initial-loader');
                if (loader && loader.style.display !== 'none') {
                    console.log('App not initialized, forcing landing page...');
                    const app = document.getElementById('app');
                    app.innerHTML = `
                        <div class="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
                            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                                <div class="text-center">
                                    <h1 class="text-4xl md:text-6xl font-bold text-white mb-6">
                                        Stop Scrolling,<br>Start Living
                                    </h1>
                                    <p class="text-xl text-gray-200 mb-8 max-w-3xl mx-auto">
                                        Break free from social media addiction with engaging cognitive exercises, games, and mindfulness activities.
                                    </p>
                                    <div class="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                                        <button onclick="window.location.href='/stop-scrolling/#register'" class="bg-white text-indigo-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                                            Get Started Free
                                        </button>
                                        <button onclick="window.location.href='/stop-scrolling/#login'" class="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-indigo-600 transition-colors">
                                            Sign In
                                        </button>
                                    </div>
                                    <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
                                        <div class="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-6">
                                            <div class="text-4xl mb-4">🧠</div>
                                            <h3 class="text-xl font-semibold text-white mb-2">Memory Games</h3>
                                            <p class="text-gray-200">Challenge your mind with engaging cognitive exercises.</p>
                                        </div>
                                        <div class="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-6">
                                            <div class="text-4xl mb-4">🧩</div>
                                            <h3 class="text-xl font-semibold text-white mb-2">Puzzle Challenges</h3>
                                            <p class="text-gray-200">Solve puzzles and logic problems to sharpen focus.</p>
                                        </div>
                                        <div class="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-6">
                                            <div class="text-4xl mb-4">🧘</div>
                                            <h3 class="text-xl font-semibold text-white mb-2">Mindfulness</h3>
                                            <p class="text-gray-200">Practice meditation to improve well-being.</p>
                                        </div>
                                    </div>
                                    <div class="grid grid-cols-3 gap-8 mt-16 max-w-2xl mx-auto">
                                        <div class="text-center">
                                            <div class="text-3xl font-bold text-white">48</div>
                                            <div class="text-gray-200">Active Users</div>
                                        </div>
                                        <div class="text-center">
                                            <div class="text-3xl font-bold text-white">59</div>
                                            <div class="text-gray-200">Activities</div>
                                        </div>
                                        <div class="text-center">
                                            <div class="text-3xl font-bold text-white">100%</div>
                                            <div class="text-gray-200">Free</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                }
            }, 1000);
        });
    </script>
    <script src="/stop-scrolling/assets/js/theme.js?v=1.0"></script>
    <script src="/stop-scrolling/assets/js/hooks/themeHooks.js?v=1.0"></script>
    <script src="/stop-scrolling/assets/js/analytics.js?v=1.0"></script>
    <script src="/stop-scrolling/assets/js/games/MemoryGame.js?v=1.0"></script>
    <script src="/stop-scrolling/assets/js/games/PuzzleGame.js?v=1.0"></script>
    <script src="/stop-scrolling/assets/js/games/QuizGame.js?v=1.0"></script>
    <script src="/stop-scrolling/assets/js/games/MeditationPlayer.js?v=1.0"></script>
    <script src="/stop-scrolling/assets/js/pages/dashboard.js?v=1.0"></script>
    <script src="/stop-scrolling/assets/js/pages/settings.js?v=1.0"></script>
    <!-- Engagement Systems -->
    <script src="/stop-scrolling/assets/js/StreakManager.js?v=1.0"></script>
    <script src="/stop-scrolling/assets/js/ComboSystem.js?v=1.0"></script>
    <script src="/stop-scrolling/assets/js/BadgeSystem.js?v=1.0"></script>
    <script src="/stop-scrolling/assets/js/AchievementSystem.js?v=1.0"></script>
    <script src="/stop-scrolling/assets/js/MotivationalMessaging.js?v=1.0"></script>
    <script src="/stop-scrolling/assets/js/DailyRecapSystem.js?v=1.0"></script>
    <script src="/stop-scrolling/assets/js/app.js?v=1.0"></script>
</body>
</html>