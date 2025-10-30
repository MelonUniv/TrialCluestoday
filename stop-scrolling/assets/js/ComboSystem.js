/**
 * ComboSystem.js
 * Advanced combo and experience point system for enhanced gameplay
 * Tracks activity combinations, multipliers, and XP rewards
 */

class ComboSystem {
    constructor() {
        // Combo configuration
        this.comboConfig = {
            baseMultiplier: 1.0,
            maxMultiplier: 5.0,
            decayRate: 0.1,           // Multiplier decay per failed activity
            perfectBonus: 0.5,        // Additional multiplier for perfect scores
            speedBonus: 0.3,          // Bonus for fast completion
            varietyBonus: 0.2,        // Bonus for category variety
            streakBonus: 0.1,         // Bonus per consecutive perfect
            comboTimeout: 30000       // 30 seconds between activities to maintain combo
        };
        
        // XP system configuration
        this.xpConfig = {
            baseXP: {
                'memory_game': 10,
                'puzzle': 15,
                'trivia': 8,
                'meditation': 12,
                'challenge': 20
            },
            difficultyMultiplier: {
                1: 1.0,    // Easy
                2: 1.2,    // Medium
                3: 1.5,    // Hard
                4: 1.8,    // Expert
                5: 2.0     // Master
            },
            accuracyBonus: {
                0.5: 0.0,   // 50%
                0.6: 0.1,   // 60%
                0.7: 0.2,   // 70%
                0.8: 0.4,   // 80%
                0.9: 0.6,   // 90%
                1.0: 1.0    // 100%
            },
            speedBonus: {
                'lightning': 2.0,  // <30% of average time
                'fast': 1.5,       // <50% of average time
                'quick': 1.2,      // <75% of average time
                'normal': 1.0,     // Average time
                'slow': 0.8        // >125% of average time
            },
            levelThresholds: [
                0, 100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5200, 
                6600, 8200, 10000, 12000, 14500, 17500, 21000, 25000, 29500, 35000
            ]
        };
        
        // Current combo state
        this.currentCombo = {
            multiplier: 1.0,
            consecutiveCount: 0,
            perfectCount: 0,
            lastActivityTime: 0,
            categoriesHit: new Set(),
            activities: [],
            totalXP: 0,
            bestMultiplier: 1.0,
            isActive: false
        };
        
        // User XP and level
        this.userXP = {
            total: 0,
            level: 1,
            currentLevelXP: 0,
            nextLevelXP: 100,
            sessionXP: 0,
            categoryXP: {
                'memory_game': 0,
                'puzzle': 0,
                'trivia': 0,
                'meditation': 0,
                'challenge': 0
            }
        };
        
        // Combo types and their requirements
        this.comboTypes = {
            perfectionist: {
                name: 'Perfectionist',
                description: 'Perfect accuracy on multiple activities',
                requirement: { perfectCount: 3 },
                bonus: 0.5,
                icon: '💯'
            },
            speedster: {
                name: 'Speed Demon',
                description: 'Complete activities quickly',
                requirement: { speedActivities: 3 },
                bonus: 0.4,
                icon: '⚡'
            },
            variety: {
                name: 'Jack of All Trades',
                description: 'Complete activities from different categories',
                requirement: { uniqueCategories: 3 },
                bonus: 0.3,
                icon: '🌟'
            },
            endurance: {
                name: 'Endurance Master',
                description: 'Maintain combo for extended period',
                requirement: { duration: 300000 }, // 5 minutes
                bonus: 0.6,
                icon: '🏃‍♂️'
            },
            difficulty: {
                name: 'Challenge Seeker',
                description: 'Complete high-difficulty activities',
                requirement: { highDifficulty: 3 },
                bonus: 0.4,
                icon: '🎯'
            }
        };
        
        // Special XP bonuses
        this.specialBonuses = {
            firstOfDay: { multiplier: 2.0, message: 'First activity of the day!' },
            comeback: { multiplier: 1.5, message: 'Great comeback!' },
            milestone: { multiplier: 3.0, message: 'Milestone achieved!' },
            perfectWeek: { multiplier: 5.0, message: 'Perfect week bonus!' }
        };
        
        this.init();
    }
    
    async init() {
        await this.loadUserProgress();
        this.bindEvents();
        this.startComboMonitoring();
    }
    
    /**
     * Load user's XP and combo progress
     */
    async loadUserProgress() {
        try {
            const response = await this.apiRequest('/api/v1/xp/progress');
            
            if (response.success && response.data) {
                this.userXP = { ...this.userXP, ...response.data };
                this.calculateLevel();
            }
        } catch (error) {
            console.error('Failed to load XP progress:', error);
            this.loadLocalProgress();
        }
    }
    
    /**
     * Process activity completion for combo and XP
     */
    async processActivity(activityData) {
        const now = Date.now();
        const timeSinceLastActivity = now - this.currentCombo.lastActivityTime;
        
        // Check if combo continues or breaks
        if (this.currentCombo.isActive && timeSinceLastActivity > this.comboConfig.comboTimeout) {
            await this.breakCombo();
        }
        
        // Calculate base XP
        const baseXP = this.calculateBaseXP(activityData);
        
        // Update combo
        this.updateCombo(activityData, now);
        
        // Apply combo multiplier to XP
        const comboXP = Math.floor(baseXP * this.currentCombo.multiplier);
        
        // Check for special bonuses
        const specialBonus = this.checkSpecialBonuses(activityData);
        const finalXP = Math.floor(comboXP * (specialBonus?.multiplier || 1.0));
        
        // Update user XP
        await this.awardXP(finalXP, activityData.category);
        
        // Check for level up
        const levelUp = this.checkLevelUp();
        
        // Record activity in combo
        this.currentCombo.activities.push({
            ...activityData,
            timestamp: now,
            xpEarned: finalXP,
            multiplier: this.currentCombo.multiplier
        });
        
        // Update combo best
        this.currentCombo.bestMultiplier = Math.max(
            this.currentCombo.bestMultiplier, 
            this.currentCombo.multiplier
        );
        
        // Save progress
        await this.saveProgress();
        
        // Prepare result
        const result = {
            xpEarned: finalXP,
            baseXP: baseXP,
            multiplier: this.currentCombo.multiplier,
            combo: {
                count: this.currentCombo.consecutiveCount,
                type: this.getActiveComboType(),
                multiplier: this.currentCombo.multiplier,
                isActive: this.currentCombo.isActive
            },
            level: this.userXP.level,
            levelUp: levelUp,
            specialBonus: specialBonus,
            totalXP: this.userXP.total
        };
        
        // Emit events
        this.emit('activityProcessed', result);
        
        if (levelUp) {
            this.emit('levelUp', {
                newLevel: this.userXP.level,
                xpEarned: finalXP,
                totalXP: this.userXP.total
            });
        }
        
        return result;
    }
    
    /**
     * Calculate base XP for activity
     */
    calculateBaseXP(activityData) {
        const category = activityData.category;
        const difficulty = activityData.difficulty || 1;
        const accuracy = activityData.accuracy || 0;
        const duration = activityData.duration || 0;
        
        // Base XP from category
        let baseXP = this.xpConfig.baseXP[category] || 10;
        
        // Apply difficulty multiplier
        baseXP *= this.xpConfig.difficultyMultiplier[difficulty] || 1.0;
        
        // Apply accuracy bonus
        const accuracyTier = this.getAccuracyTier(accuracy);
        baseXP *= (1 + this.xpConfig.accuracyBonus[accuracyTier]);
        
        // Apply speed bonus
        const speedTier = this.getSpeedTier(category, duration);
        baseXP *= this.xpConfig.speedBonus[speedTier];
        
        return Math.floor(baseXP);
    }
    
    /**
     * Update combo state
     */
    updateCombo(activityData, timestamp) {
        const accuracy = activityData.accuracy || 0;
        const category = activityData.category;
        const difficulty = activityData.difficulty || 1;
        const isPerfect = accuracy >= 1.0;
        const isFast = this.isFastCompletion(activityData);
        
        if (!this.currentCombo.isActive) {
            // Start new combo
            this.startCombo(timestamp);
        }
        
        // Update combo statistics
        this.currentCombo.consecutiveCount++;
        this.currentCombo.lastActivityTime = timestamp;
        this.currentCombo.categoriesHit.add(category);
        
        if (isPerfect) {
            this.currentCombo.perfectCount++;
        }
        
        // Calculate new multiplier
        this.calculateMultiplier(activityData);
        
        // Check for combo achievements
        this.checkComboAchievements();
    }
    
    /**
     * Calculate current combo multiplier
     */
    calculateMultiplier(activityData) {
        let multiplier = this.comboConfig.baseMultiplier;
        const accuracy = activityData.accuracy || 0;
        const category = activityData.category;
        const difficulty = activityData.difficulty || 1;
        
        // Base combo multiplier (increases with consecutive count)
        const comboBonus = Math.min(
            this.currentCombo.consecutiveCount * 0.1,
            this.comboConfig.maxMultiplier - 1
        );
        multiplier += comboBonus;
        
        // Perfect score bonus
        if (accuracy >= 1.0) {
            multiplier += this.comboConfig.perfectBonus;
        }
        
        // Speed bonus
        if (this.isFastCompletion(activityData)) {
            multiplier += this.comboConfig.speedBonus;
        }
        
        // Variety bonus
        if (this.currentCombo.categoriesHit.size >= 3) {
            multiplier += this.comboConfig.varietyBonus;
        }
        
        // Difficulty bonus
        if (difficulty >= 4) {
            multiplier += (difficulty - 3) * 0.1;
        }
        
        // Perfect streak bonus
        if (this.currentCombo.perfectCount >= 3) {
            multiplier += this.currentCombo.perfectCount * this.comboConfig.streakBonus;
        }
        
        // Apply combo type bonuses
        const activeComboType = this.getActiveComboType();
        if (activeComboType) {
            multiplier += this.comboTypes[activeComboType].bonus;
        }
        
        // Cap the multiplier
        this.currentCombo.multiplier = Math.min(multiplier, this.comboConfig.maxMultiplier);
    }
    
    /**
     * Start new combo
     */
    startCombo(timestamp) {
        this.currentCombo = {
            multiplier: this.comboConfig.baseMultiplier,
            consecutiveCount: 0,
            perfectCount: 0,
            lastActivityTime: timestamp,
            categoriesHit: new Set(),
            activities: [],
            totalXP: 0,
            bestMultiplier: this.currentCombo.bestMultiplier || 1.0,
            isActive: true,
            startTime: timestamp
        };
        
        this.emit('comboStarted', {
            timestamp,
            multiplier: this.currentCombo.multiplier
        });
    }
    
    /**
     * Break current combo
     */
    async breakCombo() {
        if (!this.currentCombo.isActive) return;
        
        const comboStats = {
            count: this.currentCombo.consecutiveCount,
            duration: Date.now() - this.currentCombo.startTime,
            bestMultiplier: this.currentCombo.multiplier,
            totalXP: this.currentCombo.totalXP,
            perfectCount: this.currentCombo.perfectCount,
            categoriesHit: this.currentCombo.categoriesHit.size
        };
        
        // Save combo to history
        await this.saveComboToHistory(comboStats);
        
        // Reset combo
        this.currentCombo.isActive = false;
        this.currentCombo.multiplier = this.comboConfig.baseMultiplier;
        
        this.emit('comboBroken', comboStats);
    }
    
    /**
     * Award XP to user
     */
    async awardXP(amount, category) {
        this.userXP.total += amount;
        this.userXP.sessionXP += amount;
        this.userXP.categoryXP[category] = (this.userXP.categoryXP[category] || 0) + amount;
        this.currentCombo.totalXP += amount;
        
        // Update level progress
        this.calculateLevel();
    }
    
    /**
     * Calculate user level based on XP
     */
    calculateLevel() {
        const thresholds = this.xpConfig.levelThresholds;
        let level = 1;
        
        for (let i = thresholds.length - 1; i >= 0; i--) {
            if (this.userXP.total >= thresholds[i]) {
                level = i + 1;
                break;
            }
        }
        
        this.userXP.level = level;
        
        // Calculate progress to next level
        const currentThreshold = thresholds[level - 1] || 0;
        const nextThreshold = thresholds[level] || thresholds[thresholds.length - 1];
        
        this.userXP.currentLevelXP = this.userXP.total - currentThreshold;
        this.userXP.nextLevelXP = nextThreshold - currentThreshold;
    }
    
    /**
     * Check if user leveled up
     */
    checkLevelUp() {
        const thresholds = this.xpConfig.levelThresholds;
        const currentLevel = this.userXP.level;
        
        // Check if we've crossed a threshold
        for (let i = currentLevel; i < thresholds.length; i++) {
            if (this.userXP.total >= thresholds[i] && currentLevel <= i) {
                const oldLevel = currentLevel;
                this.calculateLevel();
                return this.userXP.level > oldLevel;
            }
        }
        
        return false;
    }
    
    /**
     * Check for special XP bonuses
     */
    checkSpecialBonuses(activityData) {
        // First activity of the day
        if (this.isFirstActivityOfDay()) {
            return this.specialBonuses.firstOfDay;
        }
        
        // Comeback bonus (after poor performance)
        if (this.isComebackActivity(activityData)) {
            return this.specialBonuses.comeback;
        }
        
        // Milestone bonus
        if (this.isMilestoneActivity()) {
            return this.specialBonuses.milestone;
        }
        
        return null;
    }
    
    /**
     * Get active combo type
     */
    getActiveComboType() {
        const combo = this.currentCombo;
        
        // Check each combo type
        for (const [type, config] of Object.entries(this.comboTypes)) {
            if (this.meetsComboRequirements(type, config.requirement, combo)) {
                return type;
            }
        }
        
        return null;
    }
    
    /**
     * Check if combo meets requirements for type
     */
    meetsComboRequirements(type, requirement, combo) {
        switch (type) {
            case 'perfectionist':
                return combo.perfectCount >= requirement.perfectCount;
            case 'speedster':
                return this.countSpeedActivities(combo) >= requirement.speedActivities;
            case 'variety':
                return combo.categoriesHit.size >= requirement.uniqueCategories;
            case 'endurance':
                return (Date.now() - combo.startTime) >= requirement.duration;
            case 'difficulty':
                return this.countHighDifficultyActivities(combo) >= requirement.highDifficulty;
            default:
                return false;
        }
    }
    
    /**
     * Utility functions
     */
    getAccuracyTier(accuracy) {
        const tiers = [1.0, 0.9, 0.8, 0.7, 0.6, 0.5];
        return tiers.find(tier => accuracy >= tier) || 0.5;
    }
    
    getSpeedTier(category, duration) {
        // This would typically use historical data to determine average times
        // For now, use simplified logic
        const averageTime = this.getAverageTime(category);
        
        if (duration <= averageTime * 0.3) return 'lightning';
        if (duration <= averageTime * 0.5) return 'fast';
        if (duration <= averageTime * 0.75) return 'quick';
        if (duration <= averageTime * 1.25) return 'normal';
        return 'slow';
    }
    
    getAverageTime(category) {
        // Default average times (in seconds)
        const averages = {
            'memory_game': 45,
            'puzzle': 60,
            'trivia': 30,
            'meditation': 120,
            'challenge': 90
        };
        return averages[category] || 60;
    }
    
    isFastCompletion(activityData) {
        const speedTier = this.getSpeedTier(activityData.category, activityData.duration);
        return ['lightning', 'fast', 'quick'].includes(speedTier);
    }
    
    isFirstActivityOfDay() {
        const today = new Date().toDateString();
        const lastActivity = localStorage.getItem('ss_last_activity_date');
        return lastActivity !== today;
    }
    
    isComebackActivity(activityData) {
        // Check if this activity shows significant improvement
        // Simplified implementation
        return activityData.accuracy > 0.8 && this.currentCombo.consecutiveCount === 1;
    }
    
    isMilestoneActivity() {
        // Check if this activity triggers a milestone
        const total = this.userXP.total;
        const milestones = [500, 1000, 2500, 5000, 10000, 25000, 50000];
        return milestones.some(milestone => 
            total >= milestone && (total - 50) < milestone
        );
    }
    
    countSpeedActivities(combo) {
        return combo.activities.filter(activity => 
            this.isFastCompletion(activity)
        ).length;
    }
    
    countHighDifficultyActivities(combo) {
        return combo.activities.filter(activity => 
            (activity.difficulty || 1) >= 4
        ).length;
    }
    
    /**
     * Get combo and XP statistics
     */
    getComboStats() {
        return {
            current: {
                isActive: this.currentCombo.isActive,
                count: this.currentCombo.consecutiveCount,
                multiplier: this.currentCombo.multiplier,
                type: this.getActiveComboType(),
                duration: this.currentCombo.isActive ? 
                    Date.now() - this.currentCombo.startTime : 0,
                xpEarned: this.currentCombo.totalXP,
                perfectCount: this.currentCombo.perfectCount,
                categoriesHit: this.currentCombo.categoriesHit.size
            },
            best: {
                multiplier: this.currentCombo.bestMultiplier,
                // Additional best stats would come from saved history
            }
        };
    }
    
    getXPStats() {
        return {
            total: this.userXP.total,
            level: this.userXP.level,
            currentLevelXP: this.userXP.currentLevelXP,
            nextLevelXP: this.userXP.nextLevelXP,
            progressPercent: Math.round((this.userXP.currentLevelXP / this.userXP.nextLevelXP) * 100),
            sessionXP: this.userXP.sessionXP,
            categoryXP: this.userXP.categoryXP,
            nextLevelReward: this.getLevelReward(this.userXP.level + 1)
        };
    }
    
    /**
     * Get user statistics (combines combo and XP stats)
     */
    getUserStats() {
        return {
            combo: this.getComboStats(),
            xp: this.getXPStats()
        };
    }
    
    getLevelReward(level) {
        // Define rewards for reaching levels
        const rewards = {
            5: { type: 'badge', name: 'Rising Star' },
            10: { type: 'feature', name: 'Custom Themes' },
            15: { type: 'badge', name: 'Dedicated Learner' },
            20: { type: 'boost', name: '2x XP Weekend' }
        };
        
        return rewards[level] || { type: 'xp', amount: level * 100 };
    }
    
    /**
     * Combo monitoring and timeout
     */
    startComboMonitoring() {
        // Check combo timeout every 5 seconds
        this.monitorInterval = setInterval(() => {
            if (this.currentCombo.isActive) {
                const timeSinceActivity = Date.now() - this.currentCombo.lastActivityTime;
                if (timeSinceActivity > this.comboConfig.comboTimeout) {
                    this.breakCombo();
                }
            }
        }, 5000);
    }
    
    stopComboMonitoring() {
        if (this.monitorInterval) {
            clearInterval(this.monitorInterval);
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
            await this.apiRequest('/api/v1/xp/update', {
                method: 'POST',
                body: {
                    xp: this.userXP,
                    combo: this.getComboStats()
                }
            });
            
            // Save locally as backup
            this.saveLocalProgress();
        } catch (error) {
            console.error('Failed to save XP progress:', error);
            this.saveLocalProgress();
        }
    }
    
    saveLocalProgress() {
        try {
            localStorage.setItem('ss_xp_data', JSON.stringify({
                xp: this.userXP,
                combo: this.currentCombo
            }));
            localStorage.setItem('ss_last_activity_date', new Date().toDateString());
        } catch (error) {
            console.error('Failed to save local XP progress:', error);
        }
    }
    
    loadLocalProgress() {
        try {
            const saved = localStorage.getItem('ss_xp_data');
            if (saved) {
                const data = JSON.parse(saved);
                this.userXP = { ...this.userXP, ...data.xp };
                
                // Don't restore combo state from local storage (too unreliable)
                this.calculateLevel();
            }
        } catch (error) {
            console.error('Failed to load local XP progress:', error);
        }
    }
    
    async saveComboToHistory(comboStats) {
        try {
            await this.apiRequest('/api/v1/combos/save', {
                method: 'POST',
                body: comboStats
            });
        } catch (error) {
            console.error('Failed to save combo history:', error);
        }
    }
    
    checkComboAchievements() {
        // Check for combo-related achievements
        // This could trigger badge system events
        const combo = this.currentCombo;
        
        if (combo.consecutiveCount === 5) {
            this.emit('achievement', { type: 'combo_5', count: 5 });
        } else if (combo.consecutiveCount === 10) {
            this.emit('achievement', { type: 'combo_10', count: 10 });
        } else if (combo.multiplier >= 3.0) {
            this.emit('achievement', { type: 'high_multiplier', multiplier: combo.multiplier });
        }
    }
    
    /**
     * Event system
     */
    bindEvents() {
        // Listen for activity completion
        window.addEventListener('activity:completed', (e) => {
            this.processActivity(e.detail);
        });
        
        // Listen for session end (break combo)
        window.addEventListener('session:ended', () => {
            this.breakCombo();
        });
    }
    
    emit(event, data) {
        window.dispatchEvent(new CustomEvent(`combo:${event}`, { detail: data }));
    }
    
    /**
     * Reset session data
     */
    resetSession() {
        this.userXP.sessionXP = 0;
        this.breakCombo();
    }
    
    /**
     * Destroy combo system
     */
    destroy() {
        this.stopComboMonitoring();
        this.saveProgress();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ComboSystem;
}