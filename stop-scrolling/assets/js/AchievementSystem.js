/**
 * AchievementSystem.js
 * Comprehensive achievement tracking system that goes beyond badges
 * Handles meta-achievements, milestones, and special accomplishments
 */

class AchievementSystem {
    constructor() {
        // Achievement categories and definitions
        this.achievements = {
            // Consistency Achievements
            consistency: {
                first_steps: {
                    id: 'first_steps',
                    name: 'First Steps',
                    description: 'Complete your very first activity',
                    icon: '👶',
                    tier: 'starter',
                    points: 50,
                    requirements: { activities: 1 },
                    unlockMessage: 'Welcome to your cognitive journey!'
                },
                daily_dedication: {
                    id: 'daily_dedication',
                    name: 'Daily Dedication',
                    description: 'Complete activities for 7 consecutive days',
                    icon: '🗓️',
                    tier: 'bronze',
                    points: 500,
                    requirements: { consecutiveDays: 7 },
                    unlockMessage: 'Consistency is the key to growth!'
                },
                month_master: {
                    id: 'month_master',
                    name: 'Month Master',
                    description: 'Maintain a 30-day streak',
                    icon: '📅',
                    tier: 'gold',
                    points: 2000,
                    requirements: { consecutiveDays: 30 },
                    unlockMessage: 'You\'ve mastered the art of consistency!'
                },
                year_legend: {
                    id: 'year_legend',
                    name: 'Year Legend',
                    description: 'Incredible! 365 consecutive days',
                    icon: '🏆',
                    tier: 'legendary',
                    points: 10000,
                    requirements: { consecutiveDays: 365 },
                    unlockMessage: 'You are truly legendary!'
                }
            },
            
            // Performance Achievements
            performance: {
                perfectionist: {
                    id: 'perfectionist',
                    name: 'Perfectionist',
                    description: 'Achieve 100% accuracy on 25 activities',
                    icon: '💯',
                    tier: 'silver',
                    points: 750,
                    requirements: { perfectActivities: 25 },
                    unlockMessage: 'Perfection is your standard!'
                },
                speed_demon: {
                    id: 'speed_demon',
                    name: 'Speed Demon',
                    description: 'Complete 50 activities in record time',
                    icon: '⚡',
                    tier: 'silver',
                    points: 800,
                    requirements: { fastActivities: 50 },
                    unlockMessage: 'Lightning fast thinking!'
                },
                unstoppable_force: {
                    id: 'unstoppable_force',
                    name: 'Unstoppable Force',
                    description: 'Complete 100 activities without failing any',
                    icon: '🚀',
                    tier: 'gold',
                    points: 1500,
                    requirements: { consecutiveSuccesses: 100 },
                    unlockMessage: 'Nothing can stop you now!'
                },
                cognitive_master: {
                    id: 'cognitive_master',
                    name: 'Cognitive Master',
                    description: 'Achieve 95%+ average accuracy across all categories',
                    icon: '🧠',
                    tier: 'platinum',
                    points: 3000,
                    requirements: { overallAccuracy: 0.95, minActivities: 100 },
                    unlockMessage: 'Your mind is a precision instrument!'
                }
            },
            
            // Variety Achievements
            variety: {
                explorer: {
                    id: 'explorer',
                    name: 'Explorer',
                    description: 'Try activities from all 5 categories',
                    icon: '🗺️',
                    tier: 'bronze',
                    points: 300,
                    requirements: { categoriesCompleted: 5 },
                    unlockMessage: 'Curiosity leads to growth!'
                },
                well_rounded: {
                    id: 'well_rounded',
                    name: 'Well Rounded',
                    description: 'Complete 20+ activities in each category',
                    icon: '🌟',
                    tier: 'silver',
                    points: 1000,
                    requirements: { minPerCategory: 20, allCategories: true },
                    unlockMessage: 'Balance brings strength!'
                },
                content_connoisseur: {
                    id: 'content_connoisseur',
                    name: 'Content Connoisseur',
                    description: 'Experience 100 different activities',
                    icon: '🎭',
                    tier: 'gold',
                    points: 2000,
                    requirements: { uniqueActivities: 100 },
                    unlockMessage: 'You appreciate diversity in learning!'
                }
            },
            
            // Challenge Achievements
            challenge: {
                rising_star: {
                    id: 'rising_star',
                    name: 'Rising Star',
                    description: 'Reach level 10 in the XP system',
                    icon: '⭐',
                    tier: 'bronze',
                    points: 500,
                    requirements: { level: 10 },
                    unlockMessage: 'Your star is rising!'
                },
                difficulty_crusher: {
                    id: 'difficulty_crusher',
                    name: 'Difficulty Crusher',
                    description: 'Complete 50 activities at maximum difficulty',
                    icon: '💪',
                    tier: 'gold',
                    points: 1800,
                    requirements: { maxDifficultyActivities: 50 },
                    unlockMessage: 'You crush challenges like a champion!'
                },
                combo_king: {
                    id: 'combo_king',
                    name: 'Combo King',
                    description: 'Achieve a 5x combo multiplier',
                    icon: '👑',
                    tier: 'platinum',
                    points: 2500,
                    requirements: { maxComboMultiplier: 5.0 },
                    unlockMessage: 'You rule the combo kingdom!'
                },
                experience_master: {
                    id: 'experience_master',
                    name: 'Experience Master',
                    description: 'Accumulate 50,000 total XP',
                    icon: '🎯',
                    tier: 'diamond',
                    points: 5000,
                    requirements: { totalXP: 50000 },
                    unlockMessage: 'Experience is your greatest teacher!'
                }
            },
            
            // Social & Community Achievements
            community: {
                early_adopter: {
                    id: 'early_adopter',
                    name: 'Early Adopter',
                    description: 'Join Stop Scrolling in its first month',
                    icon: '🌱',
                    tier: 'special',
                    points: 1000,
                    requirements: { joinedBefore: '2024-02-01' },
                    unlockMessage: 'Thank you for being an early believer!'
                },
                feedback_hero: {
                    id: 'feedback_hero',
                    name: 'Feedback Hero',
                    description: 'Provide valuable feedback to improve the app',
                    icon: '💬',
                    tier: 'special',
                    points: 750,
                    requirements: { feedbackSubmitted: 5 },
                    unlockMessage: 'Your voice shapes our future!'
                }
            },
            
            // Hidden/Secret Achievements
            secret: {
                night_owl: {
                    id: 'night_owl',
                    name: 'Night Owl',
                    description: 'Complete 20 activities between 11PM and 5AM',
                    icon: '🦉',
                    tier: 'hidden',
                    points: 666,
                    requirements: { nightActivities: 20 },
                    unlockMessage: 'The night is your domain!',
                    hidden: true
                },
                procrastinator_reformed: {
                    id: 'procrastinator_reformed',
                    name: 'Procrastinator Reformed',
                    description: 'Complete 10 activities in the last hour before midnight',
                    icon: '🕚',
                    tier: 'hidden',
                    points: 555,
                    requirements: { lastHourActivities: 10 },
                    unlockMessage: 'Better late than never, but now you\'re on time!',
                    hidden: true
                },
                break_the_system: {
                    id: 'break_the_system',
                    name: 'System Breaker',
                    description: 'Achieve something that shouldn\'t be possible',
                    icon: '🔧',
                    tier: 'hidden',
                    points: 1337,
                    requirements: { special: 'easter_egg' },
                    unlockMessage: 'You found the impossible!',
                    hidden: true
                }
            }
        };
        
        // Achievement tiers with visual styling
        this.tiers = {
            starter: { color: '#22c55e', glow: '#86efac', title: 'Starter' },
            bronze: { color: '#cd7f32', glow: '#fbbf24', title: 'Bronze' },
            silver: { color: '#c0c0c0', glow: '#e5e7eb', title: 'Silver' },
            gold: { color: '#ffd700', glow: '#fef3c7', title: 'Gold' },
            platinum: { color: '#e5e4e2', glow: '#f3f4f6', title: 'Platinum' },
            diamond: { color: '#b9f2ff', glow: '#cffafe', title: 'Diamond' },
            legendary: { color: '#ff6b6b', glow: '#fecaca', title: 'Legendary' },
            special: { color: '#8b5cf6', glow: '#ddd6fe', title: 'Special' },
            hidden: { color: '#374151', glow: '#6b7280', title: 'Hidden' }
        };
        
        // User achievement progress
        this.userProgress = {
            earned: [],
            progress: {},
            totalPoints: 0,
            recentlyEarned: [],
            stats: {
                totalActivities: 0,
                perfectActivities: 0,
                fastActivities: 0,
                consecutiveDays: 0,
                categoriesCompleted: new Set(),
                uniqueActivities: new Set(),
                level: 1,
                totalXP: 0,
                maxComboMultiplier: 1.0,
                joinDate: null,
                nightActivities: 0,
                lastHourActivities: 0
            }
        };
        
        // Achievement notification queue
        this.notificationQueue = [];
        this.isShowingNotification = false;
        
        this.init();
    }
    
    async init() {
        await this.loadProgress();
        this.bindEvents();
        this.startProgressTracking();
    }
    
    /**
     * Load user's achievement progress
     */
    async loadProgress() {
        try {
            const response = await this.apiRequest('/api/v1/achievements/progress');
            
            if (response.success && response.data) {
                this.userProgress.earned = response.data.earned || [];
                this.userProgress.progress = response.data.progress || {};
                this.userProgress.totalPoints = response.data.totalPoints || 0;
                this.userProgress.stats = { ...this.userProgress.stats, ...response.data.stats };
            }
        } catch (error) {
            console.error('Failed to load achievement progress:', error);
            this.loadLocalProgress();
        }
    }
    
    /**
     * Track activity completion for achievements
     */
    async trackActivity(activityData) {
        // Update stats
        this.updateStats(activityData);
        
        // Check for newly earned achievements
        const newAchievements = this.checkForNewAchievements();
        
        // Process new achievements
        if (newAchievements.length > 0) {
            await this.awardAchievements(newAchievements);
        }
        
        // Save progress
        await this.saveProgress();
        
        return {
            newAchievements,
            totalPoints: this.userProgress.totalPoints,
            progress: this.getProgressSummary()
        };
    }
    
    /**
     * Update user statistics
     */
    updateStats(activityData) {
        const stats = this.userProgress.stats;
        
        // Basic activity tracking
        stats.totalActivities++;
        
        // Perfect activities
        if (activityData.accuracy >= 1.0) {
            stats.perfectActivities++;
        }
        
        // Fast activities
        if (this.isFastActivity(activityData)) {
            stats.fastActivities++;
        }
        
        // Category tracking
        stats.categoriesCompleted.add(activityData.category);
        
        // Unique activities
        if (activityData.contentId) {
            stats.uniqueActivities.add(activityData.contentId);
        }
        
        // Time-based achievements
        const hour = new Date().getHours();
        if (hour >= 23 || hour <= 5) {
            stats.nightActivities++;
        }
        if (hour === 23) {
            stats.lastHourActivities++;
        }
        
        // XP and level tracking (from combo system)
        if (activityData.totalXP) {
            stats.totalXP = activityData.totalXP;
        }
        if (activityData.level) {
            stats.level = activityData.level;
        }
        if (activityData.maxComboMultiplier) {
            stats.maxComboMultiplier = Math.max(stats.maxComboMultiplier, activityData.maxComboMultiplier);
        }
        
        // Streak tracking
        if (activityData.streak) {
            stats.consecutiveDays = activityData.streak.days || 0;
        }
        
        // Join date (if not set)
        if (!stats.joinDate) {
            stats.joinDate = new Date().toISOString();
        }
    }
    
    /**
     * Check for newly earned achievements
     */
    checkForNewAchievements() {
        const newAchievements = [];
        
        // Check all achievement categories
        Object.values(this.achievements).forEach(category => {
            Object.values(category).forEach(achievement => {
                if (!this.hasAchievement(achievement.id) && this.meetsRequirements(achievement)) {
                    newAchievements.push(achievement);
                }
            });
        });
        
        return newAchievements;
    }
    
    /**
     * Check if user meets achievement requirements
     */
    meetsRequirements(achievement) {
        const req = achievement.requirements;
        const stats = this.userProgress.stats;
        
        // Activities requirement
        if (req.activities && stats.totalActivities < req.activities) {
            return false;
        }
        
        // Consecutive days requirement
        if (req.consecutiveDays && stats.consecutiveDays < req.consecutiveDays) {
            return false;
        }
        
        // Perfect activities requirement
        if (req.perfectActivities && stats.perfectActivities < req.perfectActivities) {
            return false;
        }
        
        // Fast activities requirement
        if (req.fastActivities && stats.fastActivities < req.fastActivities) {
            return false;
        }
        
        // Categories completed requirement
        if (req.categoriesCompleted && stats.categoriesCompleted.size < req.categoriesCompleted) {
            return false;
        }
        
        // Overall accuracy requirement
        if (req.overallAccuracy) {
            const accuracy = this.calculateOverallAccuracy();
            if (accuracy < req.overallAccuracy) {
                return false;
            }
            if (req.minActivities && stats.totalActivities < req.minActivities) {
                return false;
            }
        }
        
        // Min per category requirement
        if (req.minPerCategory && req.allCategories) {
            if (!this.hasMinActivitiesPerCategory(req.minPerCategory)) {
                return false;
            }
        }
        
        // Unique activities requirement
        if (req.uniqueActivities && stats.uniqueActivities.size < req.uniqueActivities) {
            return false;
        }
        
        // Level requirement
        if (req.level && stats.level < req.level) {
            return false;
        }
        
        // Max difficulty activities requirement
        if (req.maxDifficultyActivities) {
            // This would need to be tracked separately
            return false; // Placeholder
        }
        
        // Max combo multiplier requirement
        if (req.maxComboMultiplier && stats.maxComboMultiplier < req.maxComboMultiplier) {
            return false;
        }
        
        // Total XP requirement
        if (req.totalXP && stats.totalXP < req.totalXP) {
            return false;
        }
        
        // Join date requirement
        if (req.joinedBefore) {
            const joinDate = new Date(stats.joinDate);
            const cutoffDate = new Date(req.joinedBefore);
            if (joinDate >= cutoffDate) {
                return false;
            }
        }
        
        // Night activities requirement
        if (req.nightActivities && stats.nightActivities < req.nightActivities) {
            return false;
        }
        
        // Last hour activities requirement
        if (req.lastHourActivities && stats.lastHourActivities < req.lastHourActivities) {
            return false;
        }
        
        // Special requirements
        if (req.special) {
            return this.checkSpecialRequirement(req.special);
        }
        
        return true;
    }
    
    /**
     * Award achievements to user
     */
    async awardAchievements(achievements) {
        achievements.forEach(achievement => {
            // Add to earned list
            const earnedAchievement = {
                ...achievement,
                earnedAt: new Date().toISOString()
            };
            
            this.userProgress.earned.push(earnedAchievement);
            this.userProgress.recentlyEarned.push(earnedAchievement);
            this.userProgress.totalPoints += achievement.points;
            
            // Add to notification queue
            this.queueNotification(earnedAchievement);
            
            // Emit event
            this.emit('achievementEarned', earnedAchievement);
        });
        
        // Keep only last 10 recent achievements
        if (this.userProgress.recentlyEarned.length > 10) {
            this.userProgress.recentlyEarned = this.userProgress.recentlyEarned.slice(-10);
        }
    }
    
    /**
     * Queue achievement notification
     */
    queueNotification(achievement) {
        this.notificationQueue.push(achievement);
        
        if (!this.isShowingNotification) {
            this.showNextNotification();
        }
    }
    
    /**
     * Show next achievement notification
     */
    showNextNotification() {
        if (this.notificationQueue.length === 0) {
            this.isShowingNotification = false;
            return;
        }
        
        this.isShowingNotification = true;
        const achievement = this.notificationQueue.shift();
        
        this.displayAchievementNotification(achievement);
        
        // Show next notification after 4 seconds
        setTimeout(() => {
            this.showNextNotification();
        }, 4000);
    }
    
    /**
     * Display achievement notification
     */
    displayAchievementNotification(achievement) {
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        
        const tier = this.tiers[achievement.tier];
        
        notification.innerHTML = `
            <div class="achievement-glow" style="background: ${tier.glow}"></div>
            <div class="achievement-content">
                <div class="achievement-icon" style="background: ${tier.color}">
                    ${achievement.icon}
                </div>
                <div class="achievement-text">
                    <div class="achievement-header">
                        <span class="achievement-earned">🎉 Achievement Unlocked!</span>
                        <span class="achievement-tier">${tier.title}</span>
                    </div>
                    <div class="achievement-name">${achievement.name}</div>
                    <div class="achievement-description">${achievement.description}</div>
                    <div class="achievement-reward">+${achievement.points} Points</div>
                    <div class="achievement-message">${achievement.unlockMessage}</div>
                </div>
            </div>
            <button class="achievement-close" onclick="this.parentElement.remove()">×</button>
        `;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Auto remove after 3.5 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 500);
        }, 3500);
        
        // Play achievement sound if available
        this.playAchievementSound(achievement.tier);
    }
    
    /**
     * Get achievement progress summary
     */
    getProgressSummary() {
        const summary = {
            totalEarned: this.userProgress.earned.length,
            totalPoints: this.userProgress.totalPoints,
            byTier: {},
            byCategory: {},
            recent: this.userProgress.recentlyEarned,
            nextAchievements: this.getNextAchievements(5),
            completionPercent: 0
        };
        
        // Count by tier
        Object.keys(this.tiers).forEach(tier => {
            summary.byTier[tier] = this.userProgress.earned.filter(a => a.tier === tier).length;
        });
        
        // Count by category
        Object.keys(this.achievements).forEach(category => {
            const categoryAchievements = Object.values(this.achievements[category]);
            const earned = this.userProgress.earned.filter(a => 
                categoryAchievements.some(ca => ca.id === a.id)
            ).length;
            summary.byCategory[category] = {
                earned,
                total: categoryAchievements.length,
                percent: Math.round((earned / categoryAchievements.length) * 100)
            };
        });
        
        // Calculate completion percent
        const totalPossible = this.getTotalAchievementCount();
        summary.completionPercent = Math.round((summary.totalEarned / totalPossible) * 100);
        
        return summary;
    }
    
    /**
     * Get next achievable achievements
     */
    getNextAchievements(count = 5) {
        const nextAchievements = [];
        
        Object.values(this.achievements).forEach(category => {
            Object.values(category).forEach(achievement => {
                if (!this.hasAchievement(achievement.id) && !achievement.hidden) {
                    const progress = this.calculateAchievementProgress(achievement);
                    nextAchievements.push({
                        ...achievement,
                        progress
                    });
                }
            });
        });
        
        // Sort by progress (closest to completion first)
        nextAchievements.sort((a, b) => b.progress.percent - a.progress.percent);
        
        return nextAchievements.slice(0, count);
    }
    
    /**
     * Calculate progress towards specific achievement
     */
    calculateAchievementProgress(achievement) {
        const req = achievement.requirements;
        const stats = this.userProgress.stats;
        
        let current = 0;
        let total = 1;
        let label = '';
        
        if (req.activities) {
            current = Math.min(stats.totalActivities, req.activities);
            total = req.activities;
            label = `${current}/${total} activities`;
        } else if (req.consecutiveDays) {
            current = Math.min(stats.consecutiveDays, req.consecutiveDays);
            total = req.consecutiveDays;
            label = `${current}/${total} consecutive days`;
        } else if (req.perfectActivities) {
            current = Math.min(stats.perfectActivities, req.perfectActivities);
            total = req.perfectActivities;
            label = `${current}/${total} perfect activities`;
        } else if (req.categoriesCompleted) {
            current = Math.min(stats.categoriesCompleted.size, req.categoriesCompleted);
            total = req.categoriesCompleted;
            label = `${current}/${total} categories`;
        } else if (req.level) {
            current = Math.min(stats.level, req.level);
            total = req.level;
            label = `Level ${current}/${total}`;
        } else if (req.totalXP) {
            current = Math.min(stats.totalXP, req.totalXP);
            total = req.totalXP;
            label = `${current.toLocaleString()}/${total.toLocaleString()} XP`;
        }
        
        const percent = Math.round((current / total) * 100);
        
        return {
            current,
            total,
            percent,
            label
        };
    }
    
    /**
     * Utility functions
     */
    hasAchievement(achievementId) {
        return this.userProgress.earned.some(a => a.id === achievementId);
    }
    
    isFastActivity(activityData) {
        // Simple heuristic - this would be more sophisticated in practice
        const averageTime = 60; // seconds
        return (activityData.duration || 0) < averageTime * 0.75;
    }
    
    calculateOverallAccuracy() {
        // This would need to be calculated from actual activity data
        // Placeholder calculation
        return 0.75;
    }
    
    hasMinActivitiesPerCategory(minCount) {
        // This would need category-specific activity counts
        // Placeholder
        return false;
    }
    
    checkSpecialRequirement(special) {
        // Handle special requirements like easter eggs
        if (special === 'easter_egg') {
            // Check for specific conditions
            return false; // Placeholder
        }
        return false;
    }
    
    getTotalAchievementCount() {
        let total = 0;
        Object.values(this.achievements).forEach(category => {
            total += Object.keys(category).length;
        });
        return total;
    }
    
    playAchievementSound(tier) {
        // Play different sounds based on achievement tier
        try {
            const audio = new Audio();
            
            switch (tier) {
                case 'legendary':
                case 'diamond':
                    audio.src = '/stop-scrolling/assets/sounds/legendary-achievement.mp3';
                    break;
                case 'gold':
                case 'platinum':
                    audio.src = '/stop-scrolling/assets/sounds/major-achievement.mp3';
                    break;
                default:
                    audio.src = '/stop-scrolling/assets/sounds/achievement.mp3';
            }
            
            audio.volume = 0.3;
            audio.play().catch(() => {
                // Ignore audio play errors (user interaction required)
            });
        } catch (error) {
            // Ignore audio errors
        }
    }
    
    /**
     * API and storage functions
     */
    async apiRequest(endpoint, options = {}) {
        const token = localStorage.getItem('ss_access_token');
        
        try {
            const response = await fetch(`https://trial.cluestoday.com/stop-scrolling${endpoint}`, {
                method: options.method || 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    ...options.headers
                },
                body: options.body ? JSON.stringify(options.body) : undefined
            });
            
            // Get response text first
            const responseText = await response.text();
            
            // Try to parse as JSON
            try {
                return JSON.parse(responseText);
            } catch (jsonError) {
                console.error('Non-JSON response from API:', endpoint, responseText.substring(0, 200));
                return {
                    success: false,
                    message: 'Invalid response format from server'
                };
            }
        } catch (error) {
            console.error('API request failed:', endpoint, error);
            return {
                success: false,
                message: 'Network error'
            };
        }
    }
    
    async saveProgress() {
        try {
            await this.apiRequest('/api/v1/achievements/update', {
                method: 'POST',
                body: {
                    earned: this.userProgress.earned,
                    stats: this.userProgress.stats,
                    totalPoints: this.userProgress.totalPoints
                }
            });
            
            this.saveLocalProgress();
        } catch (error) {
            console.error('Failed to save achievement progress:', error);
            this.saveLocalProgress();
        }
    }
    
    saveLocalProgress() {
        try {
            // Convert Sets to Arrays for JSON storage
            const statsToSave = {
                ...this.userProgress.stats,
                categoriesCompleted: Array.from(this.userProgress.stats.categoriesCompleted),
                uniqueActivities: Array.from(this.userProgress.stats.uniqueActivities)
            };
            
            localStorage.setItem('ss_achievement_data', JSON.stringify({
                earned: this.userProgress.earned,
                stats: statsToSave,
                totalPoints: this.userProgress.totalPoints
            }));
        } catch (error) {
            console.error('Failed to save local achievement progress:', error);
        }
    }
    
    loadLocalProgress() {
        try {
            const saved = localStorage.getItem('ss_achievement_data');
            if (saved) {
                const data = JSON.parse(saved);
                this.userProgress.earned = data.earned || [];
                this.userProgress.totalPoints = data.totalPoints || 0;
                
                if (data.stats) {
                    // Convert Arrays back to Sets
                    this.userProgress.stats = {
                        ...this.userProgress.stats,
                        ...data.stats,
                        categoriesCompleted: new Set(data.stats.categoriesCompleted || []),
                        uniqueActivities: new Set(data.stats.uniqueActivities || [])
                    };
                }
            }
        } catch (error) {
            console.error('Failed to load local achievement progress:', error);
        }
    }
    
    /**
     * Event system
     */
    bindEvents() {
        // Listen for activity completion
        window.addEventListener('activity:completed', (e) => {
            this.trackActivity(e.detail);
        });
        
        // Listen for combo and XP updates
        window.addEventListener('combo:activityProcessed', (e) => {
            this.trackActivity(e.detail);
        });
        
        // Listen for streak updates
        window.addEventListener('streak:activityRecorded', (e) => {
            this.trackActivity(e.detail);
        });
    }
    
    startProgressTracking() {
        // Auto-save every 30 seconds
        this.saveInterval = setInterval(() => {
            this.saveProgress();
        }, 30000);
    }
    
    emit(event, data) {
        window.dispatchEvent(new CustomEvent(`achievements:${event}`, { detail: data }));
    }
    
    /**
     * Get user's achievement collection
     */
    getAchievementCollection() {
        return {
            earned: this.userProgress.earned,
            totalPoints: this.userProgress.totalPoints,
            summary: this.getProgressSummary(),
            available: this.getAllAchievements()
        };
    }
    
    getAllAchievements() {
        const allAchievements = [];
        
        Object.entries(this.achievements).forEach(([category, achievements]) => {
            Object.entries(achievements).forEach(([id, achievement]) => {
                allAchievements.push({
                    ...achievement,
                    category,
                    earned: this.hasAchievement(id),
                    progress: this.hasAchievement(id) ? null : this.calculateAchievementProgress(achievement)
                });
            });
        });
        
        return allAchievements;
    }
    
    /**
     * Destroy achievement system
     */
    destroy() {
        if (this.saveInterval) {
            clearInterval(this.saveInterval);
        }
        this.saveProgress();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AchievementSystem;
}