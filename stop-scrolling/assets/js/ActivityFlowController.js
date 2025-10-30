/**
 * ActivityFlowController.js
 * Manages smooth transitions between activities, pre-loading, and auto-advance
 * Coordinates between SessionManager and ContentSequencer
 */

class ActivityFlowController {
    constructor(sessionManager, contentSequencer) {
        this.sessionManager = sessionManager;
        this.contentSequencer = contentSequencer;
        
        this.currentActivity = null;
        this.nextActivity = null;
        this.transitionState = 'idle'; // idle, loading, transitioning, active
        this.autoAdvanceTimer = null;
        this.preloadQueue = [];
        this.transitionDuration = 1500; // milliseconds
        this.autoAdvanceDelay = 5000; // milliseconds after activity completion
        
        this.config = {
            enablePreload: true,
            enableAutoAdvance: true,
            enableTransitions: true,
            transitionStyle: 'fade', // fade, slide, zoom
            showProgress: true,
            showMotivation: true
        };
        
        this.motivationalMessages = [
            "Great job! Keep going!",
            "You're on fire! 🔥",
            "Excellent progress!",
            "Stay focused, you've got this!",
            "Amazing work so far!",
            "Your brain is getting stronger!",
            "Keep up the momentum!",
            "You're crushing it!",
            "Fantastic effort!",
            "Your focus is impressive!"
        ];
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadConfig();
    }

    /**
     * Start the flow for a session
     */
    async startFlow(sessionConfig) {
        try {
            // Start session
            const session = await this.sessionManager.startSession(
                sessionConfig.type,
                sessionConfig
            );
            
            // Get available content
            const availableContent = await this.fetchAvailableContent();
            
            // Generate content sequence
            const sequence = await this.contentSequencer.generateSequence(
                sessionConfig,
                availableContent
            );
            
            // Start preloading if enabled
            if (this.config.enablePreload) {
                this.startPreloading(sequence.slice(0, 3));
            }
            
            // Load first activity
            await this.loadNextActivity();
            
            return { success: true, session, sequence };
        } catch (error) {
            console.error('Failed to start flow:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Load and display next activity
     */
    async loadNextActivity() {
        this.transitionState = 'loading';
        
        try {
            // Get next content from sequencer
            const nextContent = this.contentSequencer.getNextContent();
            
            if (!nextContent) {
                // No more content - end session
                this.endFlow();
                return;
            }
            
            // Handle break
            if (nextContent.type === 'break') {
                await this.showBreak(nextContent);
                return;
            }
            
            // Pre-load activity if not already loaded
            if (!this.nextActivity || this.nextActivity.content_id !== nextContent.content_id) {
                this.nextActivity = await this.preloadActivity(nextContent);
            }
            
            // Transition to new activity
            await this.transitionToActivity(this.nextActivity);
            
            // Start preloading next items
            if (this.config.enablePreload) {
                const upcoming = this.contentSequencer.contentQueue.slice(0, 2);
                this.startPreloading(upcoming);
            }
            
        } catch (error) {
            console.error('Failed to load next activity:', error);
            this.showError(error);
        }
    }

    /**
     * Transition to a new activity with animation
     */
    async transitionToActivity(activity) {
        this.transitionState = 'transitioning';
        
        // Show transition screen
        if (this.config.enableTransitions) {
            await this.showTransition(activity);
        }
        
        // Clean up current activity
        if (this.currentActivity) {
            await this.cleanupActivity(this.currentActivity);
        }
        
        // Display new activity
        this.currentActivity = activity;
        this.transitionState = 'active';
        await this.displayActivity(activity);
        
        // Emit activity started event
        this.emit('activityStarted', activity);
    }

    /**
     * Show transition screen between activities
     */
    async showTransition(nextActivity) {
        const transitionContainer = this.createTransitionContainer();
        const app = document.getElementById('app');
        
        // Build transition content
        const progress = this.sessionManager.getProgress();
        const motivationalMessage = this.getMotivationalMessage();
        
        transitionContainer.innerHTML = `
            <div class="transition-content">
                ${this.config.showProgress ? this.renderProgressBar(progress) : ''}
                <div class="transition-message">
                    <h2>${motivationalMessage}</h2>
                    <p>Next up: ${nextActivity.title}</p>
                    <p class="category-badge">${this.formatCategory(nextActivity.category)}</p>
                </div>
                <div class="transition-preview">
                    ${this.renderActivityPreview(nextActivity)}
                </div>
                <div class="transition-countdown">
                    <span class="countdown-number">3</span>
                </div>
            </div>
        `;
        
        // Add to DOM
        app.appendChild(transitionContainer);
        
        // Animate in
        await this.animateTransition(transitionContainer, 'in');
        
        // Countdown
        await this.countdown(transitionContainer.querySelector('.countdown-number'), 3);
        
        // Animate out
        await this.animateTransition(transitionContainer, 'out');
        
        // Remove from DOM
        transitionContainer.remove();
    }

    /**
     * Show break screen
     */
    async showBreak(breakConfig) {
        const app = document.getElementById('app');
        const breakContainer = this.createBreakContainer();
        
        breakContainer.innerHTML = `
            <div class="break-content">
                <div class="break-header">
                    <h2>Time for a Quick Break!</h2>
                    <p>Rest your mind for a moment</p>
                </div>
                <div class="break-activity">
                    ${this.renderBreakActivity()}
                </div>
                <div class="break-timer">
                    <div class="timer-circle">
                        <svg viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="45" class="timer-background"/>
                            <circle cx="50" cy="50" r="45" class="timer-progress"/>
                        </svg>
                        <span class="timer-text">${breakConfig.duration}</span>
                    </div>
                </div>
                <button class="skip-break-btn" onclick="activityFlow.skipBreak()">
                    Skip Break
                </button>
            </div>
        `;
        
        app.appendChild(breakContainer);
        
        // Animate break timer
        await this.animateBreakTimer(breakContainer, breakConfig.duration);
        
        // Remove break screen
        breakContainer.remove();
        
        // Load next activity
        this.loadNextActivity();
    }

    /**
     * Display activity content
     */
    async displayActivity(activity) {
        const app = document.getElementById('app');
        
        // Determine activity type and display accordingly
        const gameType = this.mapContentToGameType(activity.category, activity.title);
        
        if (gameType) {
            // Initialize game
            await this.initializeGame(activity, gameType);
        } else {
            // Show generic activity
            this.showGenericActivity(activity);
        }
    }

    /**
     * Handle activity completion
     */
    async onActivityComplete(result) {
        // Update performance in sequencer
        this.contentSequencer.updatePerformance({
            accuracy: result.accuracy || 0,
            speed: result.speed || 0,
            score: result.score || 0
        });
        
        // Add result to session
        this.sessionManager.addActivityResult(this.currentActivity.content_id, {
            ...result,
            category: this.currentActivity.category,
            difficulty: this.currentActivity.difficulty_level
        });
        
        // Check if auto-advance is enabled
        if (this.config.enableAutoAdvance) {
            // Show completion screen with auto-advance countdown
            await this.showCompletionScreen(result);
            
            // Auto-advance after delay
            this.autoAdvanceTimer = setTimeout(() => {
                this.loadNextActivity();
            }, this.autoAdvanceDelay);
        } else {
            // Show completion screen with continue button
            await this.showCompletionScreen(result, false);
        }
    }

    /**
     * Show activity completion screen
     */
    async showCompletionScreen(result, autoAdvance = true) {
        const overlay = document.createElement('div');
        overlay.className = 'completion-overlay';
        
        overlay.innerHTML = `
            <div class="completion-card">
                <div class="completion-header">
                    <h2>${result.completed ? 'Activity Complete!' : 'Good Effort!'}</h2>
                    ${result.score ? `<div class="score-display">Score: ${result.score}</div>` : ''}
                </div>
                <div class="completion-stats">
                    ${this.renderCompletionStats(result)}
                </div>
                ${autoAdvance ? `
                    <div class="auto-advance-notice">
                        <p>Next activity starting in <span class="advance-countdown">5</span> seconds</p>
                        <button onclick="activityFlow.skipToNext()" class="skip-btn">
                            Continue Now
                        </button>
                    </div>
                ` : `
                    <button onclick="activityFlow.continueFlow()" class="continue-btn">
                        Continue
                    </button>
                `}
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // Animate in
        overlay.style.opacity = '0';
        setTimeout(() => {
            overlay.style.transition = 'opacity 0.3s';
            overlay.style.opacity = '1';
        }, 10);
        
        // If auto-advance, update countdown
        if (autoAdvance) {
            this.updateAdvanceCountdown(overlay.querySelector('.advance-countdown'));
        }
    }

    /**
     * End the flow
     */
    async endFlow(reason = 'completed') {
        // Clear any timers
        if (this.autoAdvanceTimer) {
            clearTimeout(this.autoAdvanceTimer);
        }
        
        // End session
        const stats = this.sessionManager.endSession(reason);
        
        // Show session summary
        await this.showSessionSummary(stats);
        
        // Reset controller
        this.reset();
    }

    /**
     * Show session summary
     */
    async showSessionSummary(stats) {
        const app = document.getElementById('app');
        
        app.innerHTML = `
            <div class="session-summary">
                <div class="summary-header">
                    <h1>Session Complete!</h1>
                    <p>Great work on your cognitive training</p>
                </div>
                <div class="summary-stats">
                    <div class="stat-card">
                        <div class="stat-value">${stats.totalActivities}</div>
                        <div class="stat-label">Activities Completed</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${stats.durationFormatted}</div>
                        <div class="stat-label">Total Time</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${stats.averageScore}</div>
                        <div class="stat-label">Average Score</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${Math.round(stats.completionRate)}%</div>
                        <div class="stat-label">Completion Rate</div>
                    </div>
                </div>
                <div class="category-breakdown">
                    <h3>Category Performance</h3>
                    ${this.renderCategoryBreakdown(stats.categoryBreakdown)}
                </div>
                <div class="summary-actions">
                    <button onclick="activityFlow.startNewSession()" class="primary-btn">
                        Start New Session
                    </button>
                    <button onclick="navigateTo('dashboard')" class="secondary-btn">
                        Back to Dashboard
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Preload activities
     */
    async preloadActivity(content) {
        try {
            // Fetch activity data
            const response = await fetch(`/stop-scrolling/api/v1/contents/get?id=${content.content_id}`);
            const data = await response.json();
            
            if (data.success) {
                return {
                    ...content,
                    ...data.data.content,
                    preloaded: true
                };
            }
            
            return content;
        } catch (error) {
            console.error('Failed to preload activity:', error);
            return content;
        }
    }

    startPreloading(contents) {
        contents.forEach(content => {
            if (content && !content.preloaded) {
                this.preloadActivity(content);
            }
        });
    }

    /**
     * Fetch available content from API
     */
    async fetchAvailableContent() {
        try {
            const response = await fetch('/stop-scrolling/api/v1/contents');
            const data = await response.json();
            
            if (data.success) {
                return data.data.contents || [];
            }
            return [];
        } catch (error) {
            console.error('Failed to fetch content:', error);
            return [];
        }
    }
    
    /**
     * Map content to game type
     */
    mapContentToGameType(category, title) {
        // This should match the implementation in the main app
        const mapping = {
            'memory_game': 'MemoryGame',
            'puzzle': 'PuzzleGame',
            'trivia': 'QuizGame',
            'meditation': 'MeditationPlayer'
        };
        return mapping[category] || null;
    }
    
    /**
     * Initialize game
     */
    async initializeGame(activity, gameType) {
        // Load the appropriate game script
        const gameScripts = {
            'MemoryGame': '/stop-scrolling/assets/js/games/MemoryGame.js',
            'PuzzleGame': '/stop-scrolling/assets/js/games/PuzzleGame.js',
            'QuizGame': '/stop-scrolling/assets/js/games/QuizGame.js',
            'MeditationPlayer': '/stop-scrolling/assets/js/games/MeditationPlayer.js'
        };
        
        // Only load script if the class doesn't already exist
        if (gameScripts[gameType] && !window[gameType]) {
            await this.loadScript(gameScripts[gameType]);
        }
        
        // Initialize the game
        const GameClass = window[gameType];
        if (GameClass) {
            const game = new GameClass(
                activity.sub_category || 'default',
                activity.difficulty_level,
                document.getElementById('app')
            );
            
            // Call the appropriate start method based on game type
            if (typeof game.startGame === 'function') {
                game.startGame();
            } else if (typeof game.start === 'function') {
                game.start();
            } else if (typeof game.begin === 'function') {
                game.begin();
            }
            // Game initializes itself in constructor if no explicit start method
        }
    }
    
    /**
     * Load script dynamically
     */
    async loadScript(src) {
        return new Promise((resolve, reject) => {
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
    
    /**
     * Show generic activity
     */
    showGenericActivity(activity) {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center p-4">
                <div class="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full">
                    <h2 class="text-3xl font-bold mb-4">${activity.title}</h2>
                    <p class="text-gray-600 mb-6">${activity.description}</p>
                    <div class="bg-gray-100 rounded-lg p-6 mb-6">
                        <p class="text-center text-gray-700">
                            This activity type is coming soon!
                        </p>
                    </div>
                    <button onclick="activityFlow.onActivityComplete({ completed: true, score: 100 })" 
                            class="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700">
                        Complete Activity
                    </button>
                </div>
            </div>
        `;
    }
    
    /**
     * Render break activity
     */
    renderBreakActivity() {
        return `
            <div class="breathing-exercise">
                <div class="breathing-text">Breathe</div>
            </div>
            <p class="text-white mt-4">Follow the circle as it expands and contracts</p>
        `;
    }
    
    /**
     * Render completion stats
     */
    renderCompletionStats(result) {
        return `
            <div class="stat-item">
                <div class="stat-value">${result.score || 0}</div>
                <div class="stat-label">Points Earned</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${result.accuracy ? Math.round(result.accuracy * 100) : 0}%</div>
                <div class="stat-label">Accuracy</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${result.duration ? Math.round(result.duration / 1000) : 0}s</div>
                <div class="stat-label">Time</div>
            </div>
        `;
    }
    
    /**
     * Render category breakdown
     */
    renderCategoryBreakdown(categories) {
        if (!categories || Object.keys(categories).length === 0) {
            return '<p class="text-gray-500">No category data available</p>';
        }
        
        return Object.entries(categories).map(([category, data]) => `
            <div class="category-item">
                <div class="category-name">
                    ${this.getCategoryIcon(category)}
                    ${this.formatCategory(category)}
                </div>
                <div class="category-score">
                    ${Math.round(data.avgScore || 0)} pts avg
                </div>
            </div>
        `).join('');
    }
    
    /**
     * Update advance countdown
     */
    updateAdvanceCountdown(element) {
        let count = 5;
        const interval = setInterval(() => {
            count--;
            if (count > 0) {
                element.textContent = count;
            } else {
                clearInterval(interval);
            }
        }, 1000);
    }
    
    /**
     * Animate break timer
     */
    async animateBreakTimer(container, duration) {
        return new Promise(resolve => {
            let remaining = duration;
            const timerText = container.querySelector('.timer-text');
            const timerProgress = container.querySelector('.timer-progress');
            
            const interval = setInterval(() => {
                remaining--;
                if (timerText) timerText.textContent = remaining;
                
                if (timerProgress) {
                    const offset = 283 - (283 * (remaining / duration));
                    timerProgress.style.strokeDashoffset = offset;
                }
                
                if (remaining <= 0) {
                    clearInterval(interval);
                    resolve();
                }
            }, 1000);
            
            // Store interval for cleanup
            container.dataset.intervalId = interval;
        });
    }
    
    /**
     * Skip break
     */
    skipBreak() {
        const breakScreen = document.querySelector('.break-screen');
        if (breakScreen) {
            const intervalId = breakScreen.dataset.intervalId;
            if (intervalId) clearInterval(intervalId);
            breakScreen.remove();
        }
        this.loadNextActivity();
    }
    
    /**
     * Start new session
     */
    startNewSession() {
        // Show session selector
        if (window.showSessionSelector) {
            window.showSessionSelector();
        }
    }
    
    /**
     * Helper functions
     */
    createTransitionContainer() {
        const container = document.createElement('div');
        container.className = 'activity-transition';
        container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        `;
        return container;
    }

    createBreakContainer() {
        const container = document.createElement('div');
        container.className = 'break-screen';
        container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(135deg, #2196F3 0%, #4CAF50 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        `;
        return container;
    }

    async animateTransition(element, direction) {
        return new Promise(resolve => {
            if (direction === 'in') {
                element.style.opacity = '0';
                element.style.transform = 'scale(0.9)';
                setTimeout(() => {
                    element.style.transition = 'all 0.5s ease';
                    element.style.opacity = '1';
                    element.style.transform = 'scale(1)';
                    setTimeout(resolve, 500);
                }, 10);
            } else {
                element.style.transition = 'all 0.5s ease';
                element.style.opacity = '0';
                element.style.transform = 'scale(1.1)';
                setTimeout(resolve, 500);
            }
        });
    }

    async countdown(element, seconds) {
        for (let i = seconds; i > 0; i--) {
            element.textContent = i;
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    getMotivationalMessage() {
        return this.motivationalMessages[
            Math.floor(Math.random() * this.motivationalMessages.length)
        ];
    }

    formatCategory(category) {
        return category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    renderProgressBar(progress) {
        return `
            <div class="session-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progress.progressPercent}%"></div>
                </div>
                <div class="progress-text">
                    ${progress.activitiesCompleted} / ${progress.activitiesTotal || '∞'} activities
                </div>
            </div>
        `;
    }

    renderActivityPreview(activity) {
        return `
            <div class="activity-preview">
                <div class="preview-icon">${this.getCategoryIcon(activity.category)}</div>
                <div class="preview-difficulty">
                    ${'★'.repeat(activity.difficulty_level)}${'☆'.repeat(5 - activity.difficulty_level)}
                </div>
            </div>
        `;
    }

    getCategoryIcon(category) {
        const icons = {
            memory_game: '🧠',
            puzzle: '🧩',
            trivia: '❓',
            meditation: '🧘',
            challenge: '🏆'
        };
        return icons[category] || '📝';
    }

    /**
     * Show error message to user
     */
    showError(error) {
        const app = document.getElementById('app');
        const errorMessage = error.message || 'An error occurred while loading the activity';
        
        if (app) {
            const errorElement = document.createElement('div');
            errorElement.className = 'error-notification';
            errorElement.innerHTML = `
                <div class="error-content">
                    <span class="error-icon">⚠️</span>
                    <span class="error-message">${errorMessage}</span>
                </div>
            `;
            errorElement.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #ef4444;
                color: white;
                padding: 16px 24px;
                border-radius: 8px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                z-index: 9999;
                animation: slideIn 0.3s ease;
            `;
            
            app.appendChild(errorElement);
            
            // Auto-remove after 5 seconds
            setTimeout(() => {
                errorElement.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => errorElement.remove(), 300);
            }, 5000);
        }
        
        console.error('Activity Flow Error:', error);
    }

    /**
     * Public methods for UI interaction
     */
    skipBreak() {
        this.loadNextActivity();
    }

    skipToNext() {
        if (this.autoAdvanceTimer) {
            clearTimeout(this.autoAdvanceTimer);
        }
        this.loadNextActivity();
    }

    continueFlow() {
        this.loadNextActivity();
    }

    pauseFlow() {
        this.sessionManager.pauseSession();
    }

    resumeFlow() {
        this.sessionManager.resumeSession();
    }

    /**
     * Setup and cleanup
     */
    setupEventListeners() {
        // Listen for game completion events
        window.addEventListener('gameComplete', (e) => {
            this.onActivityComplete(e.detail);
        });
        
        // Listen for session events
        window.addEventListener('sessionManager:sessionEnded', () => {
            this.endFlow('session_ended');
        });
    }

    loadConfig() {
        const saved = localStorage.getItem('ss_flow_config');
        if (saved) {
            this.config = { ...this.config, ...JSON.parse(saved) };
        }
    }

    saveConfig() {
        localStorage.setItem('ss_flow_config', JSON.stringify(this.config));
    }

    reset() {
        this.currentActivity = null;
        this.nextActivity = null;
        this.transitionState = 'idle';
        this.preloadQueue = [];
        if (this.autoAdvanceTimer) {
            clearTimeout(this.autoAdvanceTimer);
        }
    }

    emit(event, data) {
        window.dispatchEvent(new CustomEvent(`activityFlow:${event}`, { detail: data }));
    }
}

// Immediately assign to window for browser usage
if (typeof window !== 'undefined') {
    window.ActivityFlowController = ActivityFlowController;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ActivityFlowController;
}