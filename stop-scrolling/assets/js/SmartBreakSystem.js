/**
 * SmartBreakSystem.js
 * Intelligent break detection and management system
 * Monitors fatigue indicators and suggests breaks at optimal times
 */

class SmartBreakSystem {
    constructor() {
        // Break configuration
        this.breakConfig = {
            microBreak: { duration: 15, activities: ['breathe', 'stretch'] },
            shortBreak: { duration: 30, activities: ['breathe', 'walk', 'hydrate'] },
            longBreak: { duration: 60, activities: ['meditation', 'exercise', 'nature'] },
            mandatory: { duration: 120, activities: ['rest', 'disconnect'] }
        };
        
        // Fatigue indicators
        this.fatigueIndicators = {
            errorRate: 0,
            speedDecline: 0,
            consecutiveActivities: 0,
            totalCognitiveLoad: 0,
            sessionDuration: 0,
            lastBreakTime: Date.now(),
            skippedBreaks: 0
        };
        
        // Thresholds for break triggers
        this.thresholds = {
            errorRate: 0.3,           // 30% error increase
            speedDecline: 0.25,        // 25% speed decrease
            activities: 5,             // Activities before break
            cognitiveLoad: 15,         // Accumulated cognitive load
            sessionMinutes: 20,        // Minutes before break
            breakInterval: 15 * 60000  // 15 minutes minimum between breaks
        };
        
        // Performance baseline
        this.baseline = {
            accuracy: 0.7,
            speed: 0.5,
            avgDuration: 60
        };
        
        // Recent performance tracking
        this.recentPerformance = [];
        this.maxHistorySize = 5;
        
        // Break history
        this.breakHistory = [];
        
        // Current state
        this.breakSuggested = false;
        this.breakMandatory = false;
        this.lastSuggestionTime = 0;
        
        this.init();
    }
    
    init() {
        this.loadBreakHistory();
        this.startMonitoring();
    }
    
    /**
     * Analyze performance and determine if break is needed
     */
    analyzeNeedForBreak(performanceData) {
        // Update indicators
        this.updateIndicators(performanceData);
        
        // Check various break triggers
        const triggers = this.checkTriggers();
        
        // Determine break type and urgency
        const breakRecommendation = this.determineBreakType(triggers);
        
        // Record analysis
        this.recordAnalysis(triggers, breakRecommendation);
        
        return breakRecommendation;
    }
    
    /**
     * Update fatigue indicators based on performance
     */
    updateIndicators(performance) {
        // Add to recent performance
        this.recentPerformance.push(performance);
        if (this.recentPerformance.length > this.maxHistorySize) {
            this.recentPerformance.shift();
        }
        
        // Update consecutive activities
        this.fatigueIndicators.consecutiveActivities++;
        
        // Update cognitive load
        const cognitiveLoad = performance.cognitiveLoad || this.estimateCognitiveLoad(performance);
        this.fatigueIndicators.totalCognitiveLoad += cognitiveLoad;
        
        // Update session duration
        this.fatigueIndicators.sessionDuration = Date.now() - this.fatigueIndicators.lastBreakTime;
        
        // Calculate error rate change
        if (this.recentPerformance.length >= 3) {
            const recent = this.recentPerformance.slice(-2);
            const earlier = this.recentPerformance.slice(0, 2);
            
            const recentAccuracy = this.calculateAverage(recent, 'accuracy');
            const earlierAccuracy = this.calculateAverage(earlier, 'accuracy');
            
            this.fatigueIndicators.errorRate = Math.max(0, earlierAccuracy - recentAccuracy);
            
            // Calculate speed decline
            const recentSpeed = this.calculateAverage(recent, 'speed');
            const earlierSpeed = this.calculateAverage(earlier, 'speed');
            
            this.fatigueIndicators.speedDecline = Math.max(0, earlierSpeed - recentSpeed);
        }
    }
    
    /**
     * Check if any break triggers are met
     */
    checkTriggers() {
        const triggers = {
            highErrorRate: false,
            speedDecline: false,
            tooManyActivities: false,
            highCognitiveLoad: false,
            longSession: false,
            userRequest: false
        };
        
        // Check error rate
        if (this.fatigueIndicators.errorRate > this.thresholds.errorRate) {
            triggers.highErrorRate = true;
        }
        
        // Check speed decline
        if (this.fatigueIndicators.speedDecline > this.thresholds.speedDecline) {
            triggers.speedDecline = true;
        }
        
        // Check consecutive activities
        if (this.fatigueIndicators.consecutiveActivities >= this.thresholds.activities) {
            triggers.tooManyActivities = true;
        }
        
        // Check cognitive load
        if (this.fatigueIndicators.totalCognitiveLoad >= this.thresholds.cognitiveLoad) {
            triggers.highCognitiveLoad = true;
        }
        
        // Check session duration
        const sessionMinutes = this.fatigueIndicators.sessionDuration / 60000;
        if (sessionMinutes >= this.thresholds.sessionMinutes) {
            triggers.longSession = true;
        }
        
        return triggers;
    }
    
    /**
     * Determine appropriate break type based on triggers
     */
    determineBreakType(triggers) {
        const triggerCount = Object.values(triggers).filter(t => t).length;
        const timeSinceBreak = Date.now() - this.fatigueIndicators.lastBreakTime;
        
        // Determine urgency
        let urgency = 'none';
        let breakType = null;
        let duration = 0;
        let reason = [];
        
        if (triggerCount === 0) {
            return { needed: false };
        }
        
        // Check if enough time has passed since last break
        if (timeSinceBreak < this.thresholds.breakInterval && triggerCount < 3) {
            return { needed: false, nextCheckIn: this.thresholds.breakInterval - timeSinceBreak };
        }
        
        // Determine break type based on triggers
        if (triggerCount >= 4 || this.fatigueIndicators.skippedBreaks >= 3) {
            // Mandatory break
            urgency = 'mandatory';
            breakType = 'mandatory';
            duration = this.breakConfig.mandatory.duration;
            reason.push('Multiple fatigue indicators detected');
        } else if (triggerCount >= 3) {
            // Long break recommended
            urgency = 'high';
            breakType = 'longBreak';
            duration = this.breakConfig.longBreak.duration;
            reason.push('Significant fatigue detected');
        } else if (triggerCount >= 2) {
            // Short break recommended
            urgency = 'medium';
            breakType = 'shortBreak';
            duration = this.breakConfig.shortBreak.duration;
            reason.push('Moderate fatigue detected');
        } else if (triggerCount >= 1) {
            // Micro break suggested
            urgency = 'low';
            breakType = 'microBreak';
            duration = this.breakConfig.microBreak.duration;
            reason.push('Light fatigue detected');
        }
        
        // Add specific reasons
        if (triggers.highErrorRate) reason.push('Increased errors');
        if (triggers.speedDecline) reason.push('Slower performance');
        if (triggers.tooManyActivities) reason.push('Too many consecutive activities');
        if (triggers.highCognitiveLoad) reason.push('High mental load');
        if (triggers.longSession) reason.push('Long session duration');
        
        // Get break activity suggestions
        const activities = this.getBreakActivities(breakType);
        
        return {
            needed: true,
            urgency,
            type: breakType,
            duration,
            reason,
            activities,
            canSkip: urgency !== 'mandatory',
            triggers
        };
    }
    
    /**
     * Get appropriate break activities
     */
    getBreakActivities(breakType) {
        const config = this.breakConfig[breakType];
        if (!config) return [];
        
        const activities = [];
        
        config.activities.forEach(activity => {
            switch (activity) {
                case 'breathe':
                    activities.push({
                        type: 'breathing',
                        title: 'Breathing Exercise',
                        description: 'Follow the breathing pattern to relax',
                        duration: 30
                    });
                    break;
                case 'stretch':
                    activities.push({
                        type: 'stretching',
                        title: 'Quick Stretch',
                        description: 'Stretch your neck, shoulders, and back',
                        duration: 30
                    });
                    break;
                case 'walk':
                    activities.push({
                        type: 'movement',
                        title: 'Short Walk',
                        description: 'Take a brief walk to refresh',
                        duration: 60
                    });
                    break;
                case 'hydrate':
                    activities.push({
                        type: 'hydration',
                        title: 'Hydration Break',
                        description: 'Drink water and rest your eyes',
                        duration: 15
                    });
                    break;
                case 'meditation':
                    activities.push({
                        type: 'meditation',
                        title: 'Mini Meditation',
                        description: 'Clear your mind with guided meditation',
                        duration: 120
                    });
                    break;
                case 'exercise':
                    activities.push({
                        type: 'exercise',
                        title: 'Light Exercise',
                        description: 'Do some light physical activity',
                        duration: 180
                    });
                    break;
                case 'nature':
                    activities.push({
                        type: 'nature',
                        title: 'Nature Break',
                        description: 'Step outside or look at nature',
                        duration: 120
                    });
                    break;
                case 'rest':
                    activities.push({
                        type: 'rest',
                        title: 'Complete Rest',
                        description: 'Close your eyes and rest completely',
                        duration: 300
                    });
                    break;
                case 'disconnect':
                    activities.push({
                        type: 'disconnect',
                        title: 'Digital Detox',
                        description: 'Step away from all screens',
                        duration: 300
                    });
                    break;
            }
        });
        
        return activities;
    }
    
    /**
     * Record break taken
     */
    recordBreakTaken(breakType, duration, completed = true) {
        const breakRecord = {
            type: breakType,
            duration,
            completed,
            timestamp: Date.now(),
            fatigueLevel: this.calculateFatigueLevel()
        };
        
        this.breakHistory.push(breakRecord);
        
        if (completed) {
            // Reset indicators
            this.fatigueIndicators.consecutiveActivities = 0;
            this.fatigueIndicators.totalCognitiveLoad = 0;
            this.fatigueIndicators.lastBreakTime = Date.now();
            this.fatigueIndicators.skippedBreaks = 0;
            this.fatigueIndicators.errorRate = 0;
            this.fatigueIndicators.speedDecline = 0;
        } else {
            // Track skipped break
            this.fatigueIndicators.skippedBreaks++;
        }
        
        this.saveBreakHistory();
    }
    
    /**
     * Calculate current fatigue level (0-1 scale)
     */
    calculateFatigueLevel() {
        let fatigue = 0;
        const weights = {
            errorRate: 0.25,
            speedDecline: 0.20,
            activities: 0.15,
            cognitiveLoad: 0.20,
            sessionTime: 0.10,
            skippedBreaks: 0.10
        };
        
        // Error rate contribution
        fatigue += (this.fatigueIndicators.errorRate / 0.5) * weights.errorRate;
        
        // Speed decline contribution
        fatigue += (this.fatigueIndicators.speedDecline / 0.5) * weights.speedDecline;
        
        // Activities contribution
        fatigue += Math.min(1, this.fatigueIndicators.consecutiveActivities / 10) * weights.activities;
        
        // Cognitive load contribution
        fatigue += Math.min(1, this.fatigueIndicators.totalCognitiveLoad / 25) * weights.cognitiveLoad;
        
        // Session time contribution
        const sessionHours = this.fatigueIndicators.sessionDuration / 3600000;
        fatigue += Math.min(1, sessionHours / 2) * weights.sessionTime;
        
        // Skipped breaks contribution
        fatigue += Math.min(1, this.fatigueIndicators.skippedBreaks / 3) * weights.skippedBreaks;
        
        return Math.min(1, Math.max(0, fatigue));
    }
    
    /**
     * Get break effectiveness score
     */
    getBreakEffectiveness() {
        if (this.breakHistory.length < 2) return 0.5;
        
        const recentBreaks = this.breakHistory.slice(-5);
        const completedBreaks = recentBreaks.filter(b => b.completed).length;
        const effectiveness = completedBreaks / recentBreaks.length;
        
        return effectiveness;
    }
    
    /**
     * Estimate cognitive load if not provided
     */
    estimateCognitiveLoad(performance) {
        const categoryLoads = {
            'memory_game': 4,
            'puzzle': 5,
            'trivia': 2,
            'meditation': 1,
            'challenge': 5
        };
        
        const baseLoad = categoryLoads[performance.category] || 3;
        const difficultyMultiplier = 0.8 + (performance.difficulty * 0.1);
        const performanceAdjustment = performance.accuracy < 0.5 ? 0.5 : 0;
        
        return Math.round(baseLoad * difficultyMultiplier + performanceAdjustment);
    }
    
    /**
     * Calculate average of a specific metric
     */
    calculateAverage(data, metric) {
        if (data.length === 0) return 0;
        const sum = data.reduce((acc, item) => acc + (item[metric] || 0), 0);
        return sum / data.length;
    }
    
    /**
     * Record analysis for debugging/improvement
     */
    recordAnalysis(triggers, recommendation) {
        const analysis = {
            timestamp: Date.now(),
            triggers,
            recommendation,
            indicators: { ...this.fatigueIndicators },
            fatigueLevel: this.calculateFatigueLevel()
        };
        
        // Store in session storage for debugging
        const analyses = JSON.parse(sessionStorage.getItem('ss_break_analyses') || '[]');
        analyses.push(analysis);
        if (analyses.length > 20) analyses.shift();
        sessionStorage.setItem('ss_break_analyses', JSON.stringify(analyses));
    }
    
    /**
     * Start monitoring for automatic break detection
     */
    startMonitoring() {
        // Monitor every minute
        this.monitorInterval = setInterval(() => {
            const timeSinceBreak = Date.now() - this.fatigueIndicators.lastBreakTime;
            
            // Auto-suggest break if too much time has passed
            if (timeSinceBreak > 45 * 60000) { // 45 minutes
                this.emit('breakSuggested', {
                    type: 'reminder',
                    message: 'You\'ve been active for a while. Time for a break?'
                });
            }
        }, 60000);
    }
    
    /**
     * Stop monitoring
     */
    stopMonitoring() {
        if (this.monitorInterval) {
            clearInterval(this.monitorInterval);
        }
    }
    
    /**
     * Reset system
     */
    reset() {
        this.fatigueIndicators = {
            errorRate: 0,
            speedDecline: 0,
            consecutiveActivities: 0,
            totalCognitiveLoad: 0,
            sessionDuration: 0,
            lastBreakTime: Date.now(),
            skippedBreaks: 0
        };
        this.recentPerformance = [];
        this.breakSuggested = false;
        this.breakMandatory = false;
    }
    
    /**
     * Load/Save functions
     */
    loadBreakHistory() {
        const saved = localStorage.getItem('ss_break_history');
        if (saved) {
            try {
                this.breakHistory = JSON.parse(saved);
            } catch (e) {
                console.error('Failed to load break history:', e);
            }
        }
    }
    
    saveBreakHistory() {
        try {
            // Keep only last 50 breaks
            if (this.breakHistory.length > 50) {
                this.breakHistory = this.breakHistory.slice(-50);
            }
            localStorage.setItem('ss_break_history', JSON.stringify(this.breakHistory));
        } catch (e) {
            console.error('Failed to save break history:', e);
        }
    }
    
    /**
     * Emit events
     */
    emit(event, data) {
        window.dispatchEvent(new CustomEvent(`smartBreak:${event}`, { detail: data }));
    }
    
    /**
     * Get statistics
     */
    getStats() {
        return {
            currentFatigue: this.calculateFatigueLevel(),
            indicators: this.fatigueIndicators,
            breakEffectiveness: this.getBreakEffectiveness(),
            totalBreaks: this.breakHistory.length,
            completedBreaks: this.breakHistory.filter(b => b.completed).length,
            skippedBreaks: this.breakHistory.filter(b => !b.completed).length,
            timeSinceLastBreak: Date.now() - this.fatigueIndicators.lastBreakTime,
            recentPerformance: this.recentPerformance
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SmartBreakSystem;
}