/**
 * StreakVisualizer.js
 * Visual components for displaying streak progress, milestones, and recovery options
 */

class StreakVisualizer {
    constructor(streakManager) {
        this.streakManager = streakManager;
        this.container = null;
        
        // Visual themes
        this.themes = {
            default: {
                primary: '#667eea',
                secondary: '#764ba2',
                success: '#10b981',
                warning: '#f59e0b',
                danger: '#ef4444',
                neutral: '#6b7280'
            },
            fire: {
                primary: '#ff6b6b',
                secondary: '#ff8e53',
                success: '#4ecdc4',
                warning: '#ffe66d',
                danger: '#a8e6cf',
                neutral: '#95a5a6'
            }
        };
        
        this.currentTheme = this.themes.default;
        
        // Animation settings
        this.animations = {
            streak: 'pulse',
            milestone: 'bounce',
            recovery: 'shake',
            progress: 'smooth'
        };
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.createStylesheet();
    }
    
    /**
     * Render complete streak dashboard
     */
    renderStreakDashboard(container) {
        this.container = container;
        const stats = this.streakManager.getStreakStats();
        const progress = this.streakManager.getStreakProgress();
        
        container.innerHTML = `
            <div class="streak-dashboard">
                ${this.renderCurrentStreak(stats.current, progress)}
                ${this.renderDailyProgress(progress)}
                ${this.renderMilestoneProgress(stats.current)}
                ${this.renderStreakStats(stats)}
                ${this.renderRecoverySection()}
            </div>
        `;
        
        this.attachEventListeners();
        this.startProgressAnimations();
    }
    
    /**
     * Render current streak display
     */
    renderCurrentStreak(currentStreak, progress) {
        const isActive = currentStreak.isActive;
        const statusClass = isActive ? 'active' : 'inactive';
        const fireEmoji = this.getFireEmoji(currentStreak.days);
        
        return `
            <div class="streak-current ${statusClass}">
                <div class="streak-flame">
                    <div class="flame-icon">${fireEmoji}</div>
                    <div class="flame-animation ${isActive ? 'burning' : 'extinguished'}"></div>
                </div>
                <div class="streak-info">
                    <div class="streak-number">
                        <span class="streak-days">${currentStreak.days}</span>
                        <span class="streak-label">${currentStreak.days === 1 ? 'Day' : 'Days'}</span>
                    </div>
                    <div class="streak-status">
                        ${isActive ? 
                            `<span class="status-text active">🔥 Streak Active!</span>` :
                            `<span class="status-text inactive">Streak ended</span>`
                        }
                    </div>
                    ${currentStreak.startDate ? 
                        `<div class="streak-since">Since ${this.formatDate(currentStreak.startDate)}</div>` : ''
                    }
                </div>
                <div class="streak-actions">
                    ${this.renderQuickActions(currentStreak, progress)}
                </div>
            </div>
        `;
    }
    
    /**
     * Render daily progress ring
     */
    renderDailyProgress(progress) {
        const percentage = Math.min(100, progress.progressPercent);
        const circumference = 2 * Math.PI * 45; // radius = 45
        const strokeDashoffset = circumference - (percentage / 100) * circumference;
        
        return `
            <div class="daily-progress">
                <div class="progress-ring">
                    <svg width="120" height="120">
                        <circle
                            cx="60"
                            cy="60"
                            r="45"
                            fill="none"
                            stroke="#e5e7eb"
                            stroke-width="8"
                        />
                        <circle
                            cx="60"
                            cy="60"
                            r="45"
                            fill="none"
                            stroke="${this.currentTheme.primary}"
                            stroke-width="8"
                            stroke-linecap="round"
                            stroke-dasharray="${circumference}"
                            stroke-dashoffset="${strokeDashoffset}"
                            transform="rotate(-90 60 60)"
                            class="progress-circle"
                        />
                    </svg>
                    <div class="progress-text">
                        <span class="progress-number">${progress.activitiesToday}</span>
                        <span class="progress-total">/${progress.dailyGoal}</span>
                        <span class="progress-label">today</span>
                    </div>
                </div>
                <div class="progress-info">
                    <h3>Daily Goal</h3>
                    <p class="progress-message">
                        ${progress.isComplete ? 
                            '🎉 Goal completed! Amazing work!' :
                            `${progress.dailyGoal - progress.activitiesToday} more to go!`
                        }
                    </p>
                </div>
            </div>
        `;
    }
    
    /**
     * Render milestone progress bar
     */
    renderMilestoneProgress(currentStreak) {
        const nextMilestone = this.streakManager.getNextMilestone();
        const daysToNext = this.streakManager.getDaysToNextMilestone();
        
        if (!nextMilestone) {
            return `
                <div class="milestone-progress">
                    <div class="milestone-complete">
                        <h3>🏆 All Milestones Achieved!</h3>
                        <p>You've reached legendary status with ${currentStreak.days} days!</p>
                    </div>
                </div>
            `;
        }
        
        const milestones = this.streakManager.streakConfig.streakMilestones;
        const currentMilestoneIndex = milestones.findIndex(m => m > currentStreak.days) - 1;
        const prevMilestone = currentMilestoneIndex >= 0 ? milestones[currentMilestoneIndex] : 0;
        const progress = ((currentStreak.days - prevMilestone) / (nextMilestone - prevMilestone)) * 100;
        
        return `
            <div class="milestone-progress">
                <div class="milestone-header">
                    <h3>Next Milestone</h3>
                    <span class="milestone-target">${nextMilestone} Days</span>
                </div>
                <div class="milestone-bar">
                    <div class="milestone-track">
                        <div class="milestone-fill" style="width: ${progress}%"></div>
                        <div class="milestone-markers">
                            ${this.renderMilestoneMarkers(prevMilestone, nextMilestone, currentStreak.days)}
                        </div>
                    </div>
                </div>
                <div class="milestone-info">
                    <span class="days-remaining">${daysToNext} days to go</span>
                    <span class="milestone-reward">
                        Reward: ${this.getMilestoneRewardText(nextMilestone)}
                    </span>
                </div>
            </div>
        `;
    }
    
    /**
     * Render streak statistics
     */
    renderStreakStats(stats) {
        return `
            <div class="streak-stats">
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-value">${stats.allTime.longestStreak}</div>
                        <div class="stat-label">Longest Streak</div>
                        <div class="stat-icon">🏆</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${stats.allTime.totalActivities}</div>
                        <div class="stat-label">Total Activities</div>
                        <div class="stat-icon">⚡</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${stats.allTime.milestonesAchieved}</div>
                        <div class="stat-label">Milestones</div>
                        <div class="stat-icon">🎖️</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${stats.allTime.totalStreaks}</div>
                        <div class="stat-label">Total Streaks</div>
                        <div class="stat-icon">📊</div>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Render recovery section (shown when streak can be recovered)
     */
    renderRecoverySection() {
        if (!this.streakManager.canOfferRecovery()) {
            return '';
        }
        
        const options = this.streakManager.getRecoveryOptions();
        
        return `
            <div class="streak-recovery">
                <div class="recovery-header">
                    <h3>🔄 Streak Recovery Available</h3>
                    <p>Don't let your streak end! Choose a recovery option:</p>
                </div>
                <div class="recovery-options">
                    ${options.map(option => this.renderRecoveryOption(option)).join('')}
                </div>
                <div class="recovery-timer">
                    <span class="timer-label">Recovery expires in:</span>
                    <span class="timer-countdown" data-deadline="${this.streakManager.getRecoveryDeadline()}">
                        Calculating...
                    </span>
                </div>
            </div>
        `;
    }
    
    /**
     * Render individual recovery option
     */
    renderRecoveryOption(option) {
        const difficultyClass = `difficulty-${option.difficulty}`;
        
        return `
            <div class="recovery-option ${difficultyClass}" data-option="${option.type}">
                <div class="option-header">
                    <h4>${option.title}</h4>
                    <span class="difficulty-badge ${difficultyClass}">${option.difficulty}</span>
                </div>
                <div class="option-description">${option.description}</div>
                <div class="option-details">
                    ${option.timeRequired ? `<span class="time-req">⏱️ ${option.timeRequired}</span>` : ''}
                    ${option.tokensRequired ? `<span class="tokens-req">🎫 ${option.tokensRequired} token(s)</span>` : ''}
                    ${option.tokensAvailable !== undefined ? `<span class="tokens-available">(${option.tokensAvailable} available)</span>` : ''}
                </div>
                <button class="recovery-button" onclick="streakVisualizer.selectRecoveryOption('${option.type}')">
                    Choose This Option
                </button>
            </div>
        `;
    }
    
    /**
     * Render milestone celebration modal
     */
    renderMilestoneModal(milestone) {
        const modal = document.createElement('div');
        modal.className = 'streak-milestone-modal';
        modal.innerHTML = `
            <div class="modal-backdrop" onclick="this.parentElement.remove()"></div>
            <div class="modal-content milestone-celebration">
                <div class="celebration-animation">
                    <div class="confetti"></div>
                    <div class="fireworks"></div>
                </div>
                <div class="milestone-badge">
                    <div class="badge-ring"></div>
                    <div class="badge-number">${milestone.days}</div>
                    <div class="badge-label">Days</div>
                </div>
                <h2 class="milestone-title">🎉 Milestone Achieved!</h2>
                <p class="milestone-message">
                    Congratulations! You've reached ${milestone.days} consecutive days!
                </p>
                <div class="milestone-rewards">
                    <h3>Rewards Earned:</h3>
                    <div class="rewards-list">
                        ${this.renderMilestoneRewards(milestone.reward)}
                    </div>
                </div>
                <div class="modal-actions">
                    <button class="btn-primary" onclick="this.closest('.streak-milestone-modal').remove()">
                        Continue Streak! 🔥
                    </button>
                    <button class="btn-secondary" onclick="streakVisualizer.shareAchievement(${milestone.days})">
                        Share Achievement
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Start celebration animations
        setTimeout(() => modal.querySelector('.milestone-celebration').classList.add('animate'), 100);
    }
    
    /**
     * Helper functions
     */
    getFireEmoji(days) {
        if (days === 0) return '💨';
        if (days < 3) return '🔥';
        if (days < 7) return '🚀';
        if (days < 30) return '💪';
        if (days < 100) return '⭐';
        return '🏆';
    }
    
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString(undefined, { 
            month: 'short', 
            day: 'numeric',
            year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
        });
    }
    
    renderQuickActions(currentStreak, progress) {
        if (!currentStreak.isActive) {
            return `
                <button class="quick-action restart" onclick="streakVisualizer.startNewStreak()">
                    Start New Streak
                </button>
            `;
        }
        
        if (progress.isComplete) {
            return `
                <div class="streak-complete">
                    <span class="complete-icon">✅</span>
                    <span class="complete-text">Goal Complete!</span>
                </div>
            `;
        }
        
        return `
            <button class="quick-action continue" onclick="streakVisualizer.continueStreak()">
                Continue Activities
            </button>
        `;
    }
    
    renderMilestoneMarkers(prevMilestone, nextMilestone, currentDays) {
        const markers = [];
        const range = nextMilestone - prevMilestone;
        
        // Add start marker
        markers.push(`
            <div class="milestone-marker start" style="left: 0%">
                <span class="marker-value">${prevMilestone}</span>
            </div>
        `);
        
        // Add current position marker
        const currentPosition = ((currentDays - prevMilestone) / range) * 100;
        markers.push(`
            <div class="milestone-marker current" style="left: ${currentPosition}%">
                <span class="marker-value">${currentDays}</span>
                <div class="marker-pulse"></div>
            </div>
        `);
        
        // Add end marker
        markers.push(`
            <div class="milestone-marker end" style="left: 100%">
                <span class="marker-value">${nextMilestone}</span>
            </div>
        `);
        
        return markers.join('');
    }
    
    getMilestoneRewardText(days) {
        const reward = this.streakManager.getMilestoneReward(days);
        if (reward.name) {
            return `${reward.name} Badge + ${reward.xp} XP`;
        }
        return `${reward.amount} XP`;
    }
    
    renderMilestoneRewards(reward) {
        const rewards = [];
        
        if (reward.name) {
            rewards.push(`
                <div class="reward-item badge">
                    <span class="reward-icon">🏅</span>
                    <span class="reward-text">${reward.name} Badge</span>
                </div>
            `);
        }
        
        if (reward.xp) {
            rewards.push(`
                <div class="reward-item xp">
                    <span class="reward-icon">⚡</span>
                    <span class="reward-text">${reward.xp} Experience Points</span>
                </div>
            `);
        }
        
        if (reward.streakFreeze) {
            rewards.push(`
                <div class="reward-item freeze">
                    <span class="reward-icon">🧊</span>
                    <span class="reward-text">${reward.streakFreeze} Streak Freeze Token${reward.streakFreeze > 1 ? 's' : ''}</span>
                </div>
            `);
        }
        
        return rewards.join('');
    }
    
    /**
     * Event handlers
     */
    async selectRecoveryOption(optionType) {
        const result = await this.streakManager.recoverStreak({ type: optionType });
        
        if (result.success) {
            this.showRecoverySuccess(optionType);
            this.refreshDisplay();
        } else {
            this.showRecoveryError(result.reason);
        }
    }
    
    startNewStreak() {
        // Navigate to start activity
        if (typeof navigateTo === 'function') {
            navigateTo('session-selector');
        }
    }
    
    continueStreak() {
        // Navigate to continue activities
        if (typeof navigateTo === 'function') {
            navigateTo('session-selector');
        }
    }
    
    shareAchievement(days) {
        if (navigator.share) {
            navigator.share({
                title: 'Stop Scrolling Achievement!',
                text: `🔥 I just reached ${days} consecutive days on Stop Scrolling! Join me in breaking social media addiction through cognitive exercises.`,
                url: window.location.href
            });
        } else {
            // Fallback to clipboard
            const text = `🔥 I just reached ${days} consecutive days on Stop Scrolling! Join me in breaking social media addiction through cognitive exercises. ${window.location.href}`;
            navigator.clipboard.writeText(text);
            this.showNotification('Achievement copied to clipboard!');
        }
    }
    
    /**
     * Animation and UI functions
     */
    startProgressAnimations() {
        // Animate progress ring
        const circle = this.container?.querySelector('.progress-circle');
        if (circle) {
            circle.style.transition = 'stroke-dashoffset 2s ease-in-out';
        }
        
        // Animate milestone bar
        const fill = this.container?.querySelector('.milestone-fill');
        if (fill) {
            fill.style.transition = 'width 2s ease-in-out';
        }
        
        // Start countdown timer if present
        const countdown = this.container?.querySelector('.timer-countdown');
        if (countdown) {
            this.startCountdown(countdown);
        }
    }
    
    startCountdown(element) {
        const deadline = new Date(element.dataset.deadline).getTime();
        
        const updateCountdown = () => {
            const now = new Date().getTime();
            const timeLeft = deadline - now;
            
            if (timeLeft <= 0) {
                element.textContent = 'Expired';
                element.classList.add('expired');
                return;
            }
            
            const hours = Math.floor(timeLeft / (1000 * 60 * 60));
            const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            
            element.textContent = `${hours}h ${minutes}m`;
        };
        
        updateCountdown();
        setInterval(updateCountdown, 60000); // Update every minute
    }
    
    showRecoverySuccess(optionType) {
        this.showNotification('🎉 Streak recovered successfully!', 'success');
    }
    
    showRecoveryError(reason) {
        const messages = {
            'no_recovery_available': 'No recovery options available',
            'recovery_failed': 'Recovery attempt failed. Please try again.'
        };
        
        this.showNotification(messages[reason] || 'Recovery failed', 'error');
    }
    
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `streak-notification ${type}`;
        notification.textContent = message;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Remove after delay
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    refreshDisplay() {
        if (this.container) {
            this.renderStreakDashboard(this.container);
        }
    }
    
    /**
     * Event binding
     */
    bindEvents() {
        // Listen for streak events
        window.addEventListener('streak:milestone', (e) => {
            this.renderMilestoneModal(e.detail);
        });
        
        window.addEventListener('streak:streakBroken', (e) => {
            if (e.detail.canRecover) {
                this.streakManager.offerStreakRecovery();
            }
            this.refreshDisplay();
        });
        
        window.addEventListener('streak:activityRecorded', (e) => {
            this.refreshDisplay();
        });
    }
    
    attachEventListeners() {
        // Additional event listeners for interactive elements
        this.container?.querySelectorAll('.recovery-option').forEach(option => {
            option.addEventListener('click', (e) => {
                if (!e.target.classList.contains('recovery-button')) {
                    option.querySelector('.recovery-button').click();
                }
            });
        });
    }
    
    /**
     * Create CSS styles
     */
    createStylesheet() {
        if (document.getElementById('streak-visualizer-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'streak-visualizer-styles';
        style.textContent = `
            /* Streak Dashboard Styles */
            .streak-dashboard {
                max-width: 800px;
                margin: 0 auto;
                padding: 1rem;
                display: grid;
                gap: 1.5rem;
            }
            
            /* Current Streak */
            .streak-current {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 20px;
                padding: 2rem;
                color: white;
                display: flex;
                align-items: center;
                gap: 1.5rem;
                box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);
            }
            
            .streak-current.inactive {
                background: linear-gradient(135deg, #6b7280 0%, #9ca3af 100%);
            }
            
            .streak-flame {
                position: relative;
                display: flex;
                flex-direction: column;
                align-items: center;
            }
            
            .flame-icon {
                font-size: 3rem;
                animation: flame-dance 2s ease-in-out infinite alternate;
            }
            
            @keyframes flame-dance {
                0% { transform: scale(1) rotate(-2deg); }
                100% { transform: scale(1.1) rotate(2deg); }
            }
            
            .streak-current.inactive .flame-icon {
                animation: none;
                opacity: 0.5;
            }
            
            .streak-number {
                display: flex;
                flex-direction: column;
                align-items: center;
            }
            
            .streak-days {
                font-size: 3rem;
                font-weight: bold;
                line-height: 1;
            }
            
            .streak-label {
                font-size: 1rem;
                text-transform: uppercase;
                letter-spacing: 0.1em;
                opacity: 0.9;
            }
            
            .status-text.active {
                color: #fbbf24;
                font-weight: bold;
            }
            
            .streak-since {
                font-size: 0.9rem;
                opacity: 0.8;
                margin-top: 0.5rem;
            }
            
            .quick-action {
                background: rgba(255, 255, 255, 0.2);
                border: 2px solid rgba(255, 255, 255, 0.3);
                color: white;
                padding: 0.75rem 1.5rem;
                border-radius: 25px;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            .quick-action:hover {
                background: rgba(255, 255, 255, 0.3);
                transform: translateY(-2px);
            }
            
            .streak-complete {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                background: rgba(16, 185, 129, 0.2);
                padding: 0.75rem 1.5rem;
                border-radius: 25px;
                border: 2px solid rgba(16, 185, 129, 0.3);
            }
            
            /* Daily Progress */
            .daily-progress {
                background: white;
                border-radius: 20px;
                padding: 2rem;
                display: flex;
                align-items: center;
                gap: 2rem;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
            }
            
            .progress-ring {
                position: relative;
                flex-shrink: 0;
            }
            
            .progress-text {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                text-align: center;
            }
            
            .progress-number {
                font-size: 2rem;
                font-weight: bold;
                color: #667eea;
            }
            
            .progress-total {
                font-size: 1.2rem;
                color: #6b7280;
            }
            
            .progress-label {
                display: block;
                font-size: 0.8rem;
                color: #9ca3af;
                text-transform: uppercase;
                letter-spacing: 0.05em;
            }
            
            .progress-info h3 {
                color: #1f2937;
                margin-bottom: 0.5rem;
            }
            
            .progress-message {
                color: #6b7280;
            }
            
            /* Milestone Progress */
            .milestone-progress {
                background: white;
                border-radius: 20px;
                padding: 2rem;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
            }
            
            .milestone-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1.5rem;
            }
            
            .milestone-target {
                background: linear-gradient(135deg, #667eea, #764ba2);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                font-weight: bold;
                font-size: 1.2rem;
            }
            
            .milestone-track {
                position: relative;
                height: 12px;
                background: #e5e7eb;
                border-radius: 6px;
                overflow: hidden;
            }
            
            .milestone-fill {
                height: 100%;
                background: linear-gradient(90deg, #667eea, #764ba2);
                border-radius: 6px;
                transition: width 0.3s ease;
            }
            
            .milestone-markers {
                position: absolute;
                top: -20px;
                left: 0;
                right: 0;
                height: 50px;
            }
            
            .milestone-marker {
                position: absolute;
                transform: translateX(-50%);
            }
            
            .milestone-marker.current .marker-value {
                background: #667eea;
                color: white;
                padding: 0.25rem 0.5rem;
                border-radius: 12px;
                font-size: 0.8rem;
                font-weight: bold;
            }
            
            .milestone-info {
                display: flex;
                justify-content: space-between;
                margin-top: 1rem;
                font-size: 0.9rem;
                color: #6b7280;
            }
            
            .milestone-reward {
                color: #10b981;
                font-weight: 500;
            }
            
            /* Streak Stats */
            .streak-stats {
                background: white;
                border-radius: 20px;
                padding: 2rem;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
            }
            
            .stats-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 1rem;
            }
            
            .stat-card {
                text-align: center;
                padding: 1.5rem;
                background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
                border-radius: 15px;
                position: relative;
            }
            
            .stat-value {
                font-size: 2rem;
                font-weight: bold;
                color: #667eea;
                margin-bottom: 0.5rem;
            }
            
            .stat-label {
                font-size: 0.9rem;
                color: #6b7280;
                text-transform: uppercase;
                letter-spacing: 0.05em;
            }
            
            .stat-icon {
                position: absolute;
                top: 10px;
                right: 10px;
                font-size: 1.2rem;
            }
            
            /* Recovery Section */
            .streak-recovery {
                background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
                border-radius: 20px;
                padding: 2rem;
                color: white;
            }
            
            .recovery-header h3 {
                margin-bottom: 0.5rem;
            }
            
            .recovery-options {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                gap: 1rem;
                margin: 1.5rem 0;
            }
            
            .recovery-option {
                background: rgba(255, 255, 255, 0.15);
                border-radius: 15px;
                padding: 1.5rem;
                border: 2px solid rgba(255, 255, 255, 0.2);
                transition: all 0.3s ease;
                cursor: pointer;
            }
            
            .recovery-option:hover {
                background: rgba(255, 255, 255, 0.25);
                transform: translateY(-2px);
            }
            
            .option-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 0.75rem;
            }
            
            .difficulty-badge {
                padding: 0.25rem 0.75rem;
                border-radius: 12px;
                font-size: 0.8rem;
                font-weight: bold;
                text-transform: uppercase;
            }
            
            .difficulty-easy { background: #10b981; }
            .difficulty-medium { background: #f59e0b; }
            .difficulty-hard { background: #ef4444; }
            
            .recovery-button {
                width: 100%;
                background: rgba(255, 255, 255, 0.9);
                color: #1f2937;
                border: none;
                padding: 0.75rem;
                border-radius: 10px;
                font-weight: bold;
                margin-top: 1rem;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            .recovery-button:hover {
                background: white;
                transform: translateY(-1px);
            }
            
            .recovery-timer {
                text-align: center;
                padding: 1rem;
                background: rgba(0, 0, 0, 0.1);
                border-radius: 10px;
                margin-top: 1rem;
            }
            
            .timer-countdown {
                font-weight: bold;
                font-size: 1.1rem;
            }
            
            .timer-countdown.expired {
                color: #ef4444;
            }
            
            /* Milestone Modal */
            .streak-milestone-modal {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                z-index: 1000;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .modal-backdrop {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
            }
            
            .milestone-celebration {
                background: white;
                border-radius: 25px;
                padding: 3rem;
                max-width: 500px;
                text-align: center;
                position: relative;
                z-index: 1001;
                transform: scale(0.8) translateY(50px);
                opacity: 0;
                transition: all 0.5s ease;
            }
            
            .milestone-celebration.animate {
                transform: scale(1) translateY(0);
                opacity: 1;
            }
            
            .milestone-badge {
                position: relative;
                width: 120px;
                height: 120px;
                margin: 0 auto 2rem;
                background: linear-gradient(135deg, #667eea, #764ba2);
                border-radius: 50%;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                color: white;
                box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
            }
            
            .badge-number {
                font-size: 2.5rem;
                font-weight: bold;
                line-height: 1;
            }
            
            .badge-label {
                font-size: 0.8rem;
                text-transform: uppercase;
                letter-spacing: 0.1em;
                margin-top: 0.25rem;
            }
            
            .milestone-title {
                color: #1f2937;
                margin-bottom: 1rem;
            }
            
            .milestone-message {
                color: #6b7280;
                font-size: 1.1rem;
                margin-bottom: 2rem;
            }
            
            .rewards-list {
                display: flex;
                flex-direction: column;
                gap: 0.75rem;
                margin-top: 1rem;
            }
            
            .reward-item {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                padding: 0.75rem;
                background: #f8fafc;
                border-radius: 10px;
            }
            
            .modal-actions {
                display: flex;
                gap: 1rem;
                margin-top: 2rem;
            }
            
            .btn-primary {
                flex: 1;
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white;
                border: none;
                padding: 1rem 2rem;
                border-radius: 15px;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            .btn-primary:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
            }
            
            .btn-secondary {
                flex: 1;
                background: white;
                color: #6b7280;
                border: 2px solid #e5e7eb;
                padding: 1rem 2rem;
                border-radius: 15px;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            .btn-secondary:hover {
                background: #f8fafc;
                border-color: #d1d5db;
            }
            
            /* Notifications */
            .streak-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: white;
                padding: 1rem 1.5rem;
                border-radius: 10px;
                box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
                z-index: 1002;
                transform: translateX(100%);
                transition: transform 0.3s ease;
            }
            
            .streak-notification.show {
                transform: translateX(0);
            }
            
            .streak-notification.success {
                border-left: 4px solid #10b981;
            }
            
            .streak-notification.error {
                border-left: 4px solid #ef4444;
            }
            
            /* Mobile Responsive */
            @media (max-width: 768px) {
                .streak-dashboard {
                    padding: 0.5rem;
                    gap: 1rem;
                }
                
                .streak-current {
                    flex-direction: column;
                    text-align: center;
                    padding: 1.5rem;
                }
                
                .daily-progress {
                    flex-direction: column;
                    text-align: center;
                }
                
                .stats-grid {
                    grid-template-columns: repeat(2, 1fr);
                }
                
                .recovery-options {
                    grid-template-columns: 1fr;
                }
                
                .milestone-celebration {
                    margin: 1rem;
                    padding: 2rem;
                }
                
                .modal-actions {
                    flex-direction: column;
                }
            }
        `;
        
        document.head.appendChild(style);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StreakVisualizer;
}