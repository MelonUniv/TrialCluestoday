/**
 * Dashboard Page JavaScript
 * Handles user dashboard with statistics, charts, and insights
 */

// Dashboard state
const DashboardState = {
    overviewData: null,
    chartInstances: {},
    currentPeriod: '30d',
    loading: false
};

/**
 * Render dashboard page
 */
function renderDashboard() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
            <!-- Dashboard Header -->
            <div class="bg-white dark:bg-gray-800 shadow-sm">
                <div class="mx-auto px-4 py-4 max-w-md">
                    <div class="text-center mb-4">
                        <h1 class="text-xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
                        <p class="text-sm text-gray-600 dark:text-gray-400">Track your progress</p>
                    </div>
                    <div class="flex flex-col space-y-3">
                        <button onclick="navigateTo('home')" class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-3 rounded-lg transition-colors text-center">
                            Back to Home
                        </button>
                        <select id="period-selector" class="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-3 text-center">
                            <option value="7d">Last 7 Days</option>
                            <option value="30d" selected>Last 30 Days</option>
                            <option value="90d">Last 90 Days</option>
                            <option value="1y">Last Year</option>
                        </select>
                    </div>
                </div>
            </div>

            <!-- Dashboard Content -->
            <div class="mx-auto px-4 py-6 max-w-md">
                <!-- Loading State -->
                <div id="dashboard-loading" class="flex justify-center items-center py-12">
                    <div class="text-center">
                        <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                        <p class="mt-4 text-gray-600 dark:text-gray-400">Loading your dashboard...</p>
                    </div>
                </div>

                <!-- Dashboard Grid -->
                <div id="dashboard-content" class="hidden">
                    <!-- Quick Stats Cards -->
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div class="stats-card bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-6">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-blue-100 text-sm">Total Activities</p>
                                    <p id="total-activities" class="text-2xl font-bold">0</p>
                                </div>
                                <div class="text-3xl opacity-80">🎯</div>
                            </div>
                        </div>

                        <div class="stats-card bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-6">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-green-100 text-sm">Hours Spent</p>
                                    <p id="total-hours" class="text-2xl font-bold">0</p>
                                </div>
                                <div class="text-3xl opacity-80">⏱️</div>
                            </div>
                        </div>

                        <div class="stats-card bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-6">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-purple-100 text-sm">Current Streak</p>
                                    <p id="current-streak" class="text-2xl font-bold">0</p>
                                </div>
                                <div class="text-3xl opacity-80">🔥</div>
                            </div>
                        </div>

                        <div class="stats-card bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl p-6">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-orange-100 text-sm">Level</p>
                                    <p id="current-level" class="text-2xl font-bold">1</p>
                                </div>
                                <div class="text-3xl opacity-80">⭐</div>
                            </div>
                        </div>
                    </div>

                    <!-- Level Progress -->
                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-8">
                        <div class="flex items-center justify-between mb-4">
                            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Level Progress</h3>
                            <span id="level-info" class="text-sm text-gray-600 dark:text-gray-400">Level 1</span>
                        </div>
                        <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                            <div id="level-progress-bar" class="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500" style="width: 0%"></div>
                        </div>
                        <div class="flex justify-between mt-2 text-sm text-gray-600 dark:text-gray-400">
                            <span id="current-xp">0 XP</span>
                            <span id="next-level-xp">1000 XP</span>
                        </div>
                    </div>

                    <!-- Charts Row -->
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                        <!-- Activity Over Time Chart -->
                        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Activity Over Time</h3>
                            <div class="chart-container" style="height: 300px;">
                                <canvas id="activity-chart"></canvas>
                            </div>
                        </div>

                        <!-- Category Distribution Chart -->
                        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Activity Categories</h3>
                            <div class="chart-container" style="height: 300px;">
                                <canvas id="category-chart"></canvas>
                            </div>
                        </div>
                    </div>

                    <!-- Insights and Recent Activities -->
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <!-- Performance Insights -->
                        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Performance Insights</h3>
                            <div id="insights-container" class="space-y-3">
                                <div class="animate-pulse">
                                    <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                                    <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                                </div>
                            </div>
                        </div>

                        <!-- Recent Activities -->
                        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Recent Activities</h3>
                            <div id="recent-activities" class="space-y-3">
                                <div class="animate-pulse">
                                    <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
                                    <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Initialize dashboard
    initializeDashboard();
}

/**
 * Initialize dashboard
 */
async function initializeDashboard() {
    try {
        DashboardState.loading = true;
        
        // Load overview data
        await loadOverviewData();
        
        // Load charts
        await loadCharts();
        
        // Load insights
        await loadInsights();
        
        // Load recent activities
        await loadRecentActivities();
        
        // Setup event listeners
        setupDashboardEventListeners();
        
        // Show content
        document.getElementById('dashboard-loading').classList.add('hidden');
        document.getElementById('dashboard-content').classList.remove('hidden');
        
        DashboardState.loading = false;
        
    } catch (error) {
        console.error('Error initializing dashboard:', error);
        showToast('Failed to load dashboard data', 'error');
        document.getElementById('dashboard-loading').innerHTML = `
            <div class="text-center">
                <div class="text-red-500 text-4xl mb-4">⚠️</div>
                <p class="text-gray-600 dark:text-gray-400">Failed to load dashboard</p>
                <button onclick="initializeDashboard()" class="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg">
                    Try Again
                </button>
            </div>
        `;
    }
}

/**
 * Load overview statistics
 */
async function loadOverviewData() {
    try {
        const response = await window.stopScrollingApp.apiRequest('/stats/overview');
        
        if (response.success) {
            DashboardState.overviewData = response.data;
            updateOverviewCards(response.data);
        }
        
    } catch (error) {
        console.error('Error loading overview data:', error);
    }
}

/**
 * Update overview cards
 */
function updateOverviewCards(data) {
    document.getElementById('total-activities').textContent = data.total_activities || 0;
    document.getElementById('total-hours').textContent = data.total_time_hours || '0.0';
    document.getElementById('current-streak').textContent = data.current_streak || 0;
    document.getElementById('current-level').textContent = data.current_level || 1;
    
    // Update level progress
    const levelProgress = data.level_progress || 0;
    document.getElementById('level-progress-bar').style.width = `${levelProgress}%`;
    document.getElementById('level-info').textContent = `Level ${data.current_level || 1}`;
    document.getElementById('current-xp').textContent = `${data.experience_points || 0} XP`;
    document.getElementById('next-level-xp').textContent = `${(data.experience_points || 0) + (data.xp_to_next_level || 1000)} XP`;
}

/**
 * Load and render charts
 */
async function loadCharts() {
    try {
        // Load Chart.js if not already loaded
        if (typeof Chart === 'undefined') {
            await loadChartJS();
        }
        
        // Load activity over time chart
        const activityResponse = await window.stopScrollingApp.apiRequest('/stats/charts?type=activity_over_time');
        if (activityResponse.success) {
            renderActivityChart(activityResponse.data);
        }
        
        // Load category distribution chart
        const categoryResponse = await window.stopScrollingApp.apiRequest('/stats/charts?type=category_distribution');
        if (categoryResponse.success) {
            renderCategoryChart(categoryResponse.data);
        }
        
    } catch (error) {
        console.error('Error loading charts:', error);
    }
}

/**
 * Load Chart.js library
 */
function loadChartJS() {
    return new Promise((resolve, reject) => {
        if (typeof Chart !== 'undefined') {
            resolve();
            return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

/**
 * Render activity over time chart
 */
function renderActivityChart(chartData) {
    const ctx = document.getElementById('activity-chart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (DashboardState.chartInstances.activity) {
        DashboardState.chartInstances.activity.destroy();
    }
    
    DashboardState.chartInstances.activity = new Chart(ctx, {
        type: chartData.type,
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0,0,0,0.1)'
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(0,0,0,0.1)'
                    }
                }
            }
        }
    });
}

/**
 * Render category distribution chart
 */
function renderCategoryChart(chartData) {
    const ctx = document.getElementById('category-chart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (DashboardState.chartInstances.category) {
        DashboardState.chartInstances.category.destroy();
    }
    
    DashboardState.chartInstances.category = new Chart(ctx, {
        type: chartData.type,
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

/**
 * Load performance insights
 */
async function loadInsights() {
    try {
        const response = await window.stopScrollingApp.apiRequest('/stats/insights');
        
        if (response.success && response.data.insights) {
            renderInsights(response.data.insights);
        }
        
    } catch (error) {
        console.error('Error loading insights:', error);
        document.getElementById('insights-container').innerHTML = `
            <p class="text-gray-600 dark:text-gray-400 text-sm">Unable to load insights at this time.</p>
        `;
    }
}

/**
 * Render performance insights
 */
function renderInsights(insights) {
    const container = document.getElementById('insights-container');
    
    if (insights.length === 0) {
        container.innerHTML = `
            <p class="text-gray-600 dark:text-gray-400 text-sm">Complete some activities to see insights!</p>
        `;
        return;
    }
    
    container.innerHTML = insights.map(insight => `
        <div class="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div class="text-lg">💡</div>
            <p class="text-sm text-gray-700 dark:text-gray-300">${insight}</p>
        </div>
    `).join('');
}

/**
 * Load recent activities
 */
async function loadRecentActivities() {
    try {
        const response = await window.stopScrollingApp.getActivityHistory({ limit: 5 });
        
        if (response.success && response.data) {
            renderRecentActivities(response.data);
        }
        
    } catch (error) {
        console.error('Error loading recent activities:', error);
        document.getElementById('recent-activities').innerHTML = `
            <p class="text-gray-600 dark:text-gray-400 text-sm">Unable to load recent activities.</p>
        `;
    }
}

/**
 * Render recent activities
 */
function renderRecentActivities(activities) {
    const container = document.getElementById('recent-activities');
    
    if (!activities || activities.length === 0) {
        container.innerHTML = `
            <p class="text-gray-600 dark:text-gray-400 text-sm">No recent activities yet. Start playing!</p>
        `;
        return;
    }
    
    container.innerHTML = activities.map(activity => {
        const date = new Date(activity.started_at);
        const timeAgo = getTimeAgo(date);
        const categoryName = activity.content_category || activity.activity_type;
        
        return `
            <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div class="flex-1">
                    <h4 class="font-medium text-gray-900 dark:text-gray-100 text-sm">
                        ${activity.content_title || 'Unknown Activity'}
                    </h4>
                    <p class="text-xs text-gray-600 dark:text-gray-400">
                        ${categoryName} • ${activity.final_score || 0} points • ${timeAgo}
                    </p>
                </div>
                <div class="text-right">
                    <div class="text-sm font-medium ${activity.status === 'completed' ? 'text-green-600' : 'text-orange-600'}">
                        ${activity.status === 'completed' ? '✓' : '⏱️'}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Setup event listeners
 */
function setupDashboardEventListeners() {
    // Period selector
    const periodSelector = document.getElementById('period-selector');
    if (periodSelector) {
        periodSelector.addEventListener('change', (e) => {
            DashboardState.currentPeriod = e.target.value;
            loadCharts(); // Reload charts with new period
        });
    }
}

/**
 * Utility function to get time ago string
 */
function getTimeAgo(date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString();
}

// Export functions
if (typeof window.stopScrollingApp === 'object') {
    window.stopScrollingApp.renderDashboard = renderDashboard;
    window.stopScrollingApp.DashboardState = DashboardState;
}