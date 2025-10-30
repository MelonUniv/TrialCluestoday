/**
 * DifficultyAdapter.js
 * Adaptive difficulty engine that adjusts challenge level based on performance
 * Works with ContentSequencer to provide optimal difficulty progression
 */

class DifficultyAdapter {
    constructor() {
        // Performance thresholds
        this.thresholds = {
            excellent: 0.85,
            good: 0.70,
            adequate: 0.55,
            struggling: 0.40
        };
        
        // Difficulty adjustment parameters
        this.adjustmentRates = {
            rapid: 1.0,      // Full level adjustment
            moderate: 0.5,   // Half level adjustment
            gradual: 0.25,   // Quarter level adjustment
            minimal: 0.1     // Minimal adjustment
        };
        
        // Performance history
        this.performanceHistory = [];
        this.maxHistorySize = 10;
        
        // Difficulty curves
        this.curves = {
            linear: this.linearCurve.bind(this),
            exponential: this.exponentialCurve.bind(this),
            logarithmic: this.logarithmicCurve.bind(this),
            sigmoid: this.sigmoidCurve.bind(this),
            adaptive: this.adaptiveCurve.bind(this)
        };
        
        // Current state
        this.currentDifficulty = 2; // Start at medium (1-5 scale)
        this.currentCurve = 'adaptive';
        this.consecutiveSuccesses = 0;
        this.consecutiveFailures = 0;
        this.flowState = false;
        this.struggleState = false;
        
        // Category-specific difficulty tracking
        this.categoryDifficulty = {};
        
        // Challenge spike system
        this.spikeEnabled = true;
        this.timeSinceLastSpike = 0;
        this.spikeInterval = 5; // Activities between spikes
        
        this.init();
    }
    
    init() {
        this.loadPerformanceHistory();
        this.loadSettings();
    }
    
    /**
     * Calculate next difficulty level based on performance
     */
    getNextDifficulty(performance, category = null) {
        // Add to history
        this.addPerformance(performance);
        
        // Get base difficulty using selected curve
        const curve = this.curves[this.currentCurve];
        let nextDifficulty = curve(performance);
        
        // Apply category-specific adjustments
        if (category) {
            nextDifficulty = this.applyCategoryAdjustment(nextDifficulty, category);
        }
        
        // Check for flow or struggle states
        this.updateStates(performance);
        
        // Apply state-based modifications
        if (this.flowState) {
            nextDifficulty = this.applyFlowStateBonus(nextDifficulty);
        } else if (this.struggleState) {
            nextDifficulty = this.applyStruggleReduction(nextDifficulty);
        }
        
        // Consider challenge spikes
        if (this.shouldApplySpike()) {
            nextDifficulty = this.applyChallengeSpike(nextDifficulty);
        }
        
        // Ensure difficulty stays within bounds
        nextDifficulty = this.clampDifficulty(nextDifficulty);
        
        // Update current difficulty
        this.currentDifficulty = nextDifficulty;
        
        // Update category difficulty if specified
        if (category) {
            this.categoryDifficulty[category] = nextDifficulty;
        }
        
        return {
            difficulty: Math.round(nextDifficulty),
            raw: nextDifficulty,
            curve: this.currentCurve,
            state: this.getState(),
            recommendation: this.getRecommendation(performance)
        };
    }
    
    /**
     * Difficulty curves
     */
    linearCurve(performance) {
        const perfScore = this.calculatePerformanceScore(performance);
        const adjustment = this.getAdjustmentRate(perfScore);
        
        if (perfScore >= this.thresholds.excellent) {
            return this.currentDifficulty + adjustment;
        } else if (perfScore >= this.thresholds.good) {
            return this.currentDifficulty + (adjustment * 0.5);
        } else if (perfScore < this.thresholds.struggling) {
            return this.currentDifficulty - adjustment;
        }
        
        return this.currentDifficulty;
    }
    
    exponentialCurve(performance) {
        const perfScore = this.calculatePerformanceScore(performance);
        const factor = Math.exp((perfScore - 0.7) * 2);
        
        return this.currentDifficulty * factor;
    }
    
    logarithmicCurve(performance) {
        const perfScore = this.calculatePerformanceScore(performance);
        const adjustment = Math.log10(perfScore * 10) * 0.5;
        
        return this.currentDifficulty + adjustment;
    }
    
    sigmoidCurve(performance) {
        const perfScore = this.calculatePerformanceScore(performance);
        const x = (perfScore - 0.5) * 10;
        const sigmoid = 1 / (1 + Math.exp(-x));
        
        return 1 + (sigmoid * 4); // Map to 1-5 scale
    }
    
    adaptiveCurve(performance) {
        const perfScore = this.calculatePerformanceScore(performance);
        const recentAvg = this.getRecentAverage();
        const trend = this.getPerformanceTrend();
        
        let adjustment = 0;
        
        // Base adjustment on current performance
        if (perfScore >= this.thresholds.excellent) {
            adjustment = this.adjustmentRates.moderate;
        } else if (perfScore >= this.thresholds.good) {
            adjustment = this.adjustmentRates.gradual;
        } else if (perfScore < this.thresholds.struggling) {
            adjustment = -this.adjustmentRates.moderate;
        } else if (perfScore < this.thresholds.adequate) {
            adjustment = -this.adjustmentRates.gradual;
        }
        
        // Modify based on trend
        if (trend > 0.1) {
            // Improving performance
            adjustment *= 1.2;
        } else if (trend < -0.1) {
            // Declining performance
            adjustment *= 0.8;
        }
        
        // Consider consistency
        const consistency = this.getConsistency();
        if (consistency > 0.8) {
            // Very consistent performance, safe to adjust
            adjustment *= 1.5;
        } else if (consistency < 0.4) {
            // Inconsistent performance, smaller adjustments
            adjustment *= 0.5;
        }
        
        return this.currentDifficulty + adjustment;
    }
    
    /**
     * Calculate performance score
     */
    calculatePerformanceScore(performance) {
        const accuracy = performance.accuracy || 0;
        const speed = performance.speed || 0.5;
        const completion = performance.completed ? 1 : 0.5;
        
        // Weighted average
        return (accuracy * 0.5) + (speed * 0.3) + (completion * 0.2);
    }
    
    /**
     * Update flow and struggle states
     */
    updateStates(performance) {
        const perfScore = this.calculatePerformanceScore(performance);
        
        if (perfScore >= this.thresholds.excellent) {
            this.consecutiveSuccesses++;
            this.consecutiveFailures = 0;
        } else if (perfScore < this.thresholds.adequate) {
            this.consecutiveFailures++;
            this.consecutiveSuccesses = 0;
        } else {
            // Reset streaks for moderate performance
            this.consecutiveSuccesses = Math.max(0, this.consecutiveSuccesses - 1);
            this.consecutiveFailures = Math.max(0, this.consecutiveFailures - 1);
        }
        
        // Check for flow state (3+ consecutive successes)
        this.flowState = this.consecutiveSuccesses >= 3;
        
        // Check for struggle state (2+ consecutive failures)
        this.struggleState = this.consecutiveFailures >= 2;
    }
    
    /**
     * Apply flow state bonus
     */
    applyFlowStateBonus(difficulty) {
        // In flow state, increase difficulty more aggressively
        return Math.min(5, difficulty + this.adjustmentRates.moderate);
    }
    
    /**
     * Apply struggle reduction
     */
    applyStruggleReduction(difficulty) {
        // In struggle state, reduce difficulty more significantly
        return Math.max(1, difficulty - this.adjustmentRates.rapid);
    }
    
    /**
     * Check if challenge spike should be applied
     */
    shouldApplySpike() {
        if (!this.spikeEnabled || this.struggleState) {
            return false;
        }
        
        this.timeSinceLastSpike++;
        
        if (this.timeSinceLastSpike >= this.spikeInterval && this.flowState) {
            this.timeSinceLastSpike = 0;
            return true;
        }
        
        return false;
    }
    
    /**
     * Apply challenge spike
     */
    applyChallengeSpike(difficulty) {
        // Temporary difficulty boost for variety
        return Math.min(5, difficulty + 1);
    }
    
    /**
     * Apply category-specific adjustment
     */
    applyCategoryAdjustment(difficulty, category) {
        if (!this.categoryDifficulty[category]) {
            this.categoryDifficulty[category] = difficulty;
            return difficulty;
        }
        
        // Blend global and category-specific difficulty
        const categoryDiff = this.categoryDifficulty[category];
        return (difficulty * 0.7) + (categoryDiff * 0.3);
    }
    
    /**
     * Get adjustment rate based on performance
     */
    getAdjustmentRate(perfScore) {
        if (perfScore >= this.thresholds.excellent || perfScore < this.thresholds.struggling) {
            return this.adjustmentRates.moderate;
        } else if (perfScore >= this.thresholds.good || perfScore < this.thresholds.adequate) {
            return this.adjustmentRates.gradual;
        }
        
        return this.adjustmentRates.minimal;
    }
    
    /**
     * Get recent performance average
     */
    getRecentAverage(count = 5) {
        const recent = this.performanceHistory.slice(-count);
        if (recent.length === 0) return 0.5;
        
        const sum = recent.reduce((acc, perf) => acc + this.calculatePerformanceScore(perf), 0);
        return sum / recent.length;
    }
    
    /**
     * Get performance trend
     */
    getPerformanceTrend() {
        if (this.performanceHistory.length < 3) return 0;
        
        const recent = this.performanceHistory.slice(-3);
        const older = this.performanceHistory.slice(-6, -3);
        
        if (older.length === 0) return 0;
        
        const recentAvg = recent.reduce((acc, p) => acc + this.calculatePerformanceScore(p), 0) / recent.length;
        const olderAvg = older.reduce((acc, p) => acc + this.calculatePerformanceScore(p), 0) / older.length;
        
        return recentAvg - olderAvg;
    }
    
    /**
     * Get performance consistency
     */
    getConsistency() {
        if (this.performanceHistory.length < 3) return 0.5;
        
        const recent = this.performanceHistory.slice(-5);
        const scores = recent.map(p => this.calculatePerformanceScore(p));
        
        const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
        const variance = scores.reduce((acc, s) => acc + Math.pow(s - mean, 2), 0) / scores.length;
        const stdDev = Math.sqrt(variance);
        
        // Lower standard deviation means higher consistency
        return Math.max(0, 1 - (stdDev * 2));
    }
    
    /**
     * Clamp difficulty to valid range
     */
    clampDifficulty(difficulty) {
        return Math.max(1, Math.min(5, difficulty));
    }
    
    /**
     * Get current state
     */
    getState() {
        if (this.flowState) return 'flow';
        if (this.struggleState) return 'struggle';
        return 'normal';
    }
    
    /**
     * Get recommendation based on performance
     */
    getRecommendation(performance) {
        const perfScore = this.calculatePerformanceScore(performance);
        
        if (this.flowState) {
            return 'You\'re in the zone! Let\'s increase the challenge.';
        } else if (this.struggleState) {
            return 'Let\'s make things a bit easier to build confidence.';
        } else if (perfScore >= this.thresholds.excellent) {
            return 'Excellent work! Ready for something harder?';
        } else if (perfScore >= this.thresholds.good) {
            return 'Good job! Keep up the great work.';
        } else if (perfScore < this.thresholds.struggling) {
            return 'Don\'t worry, let\'s try something easier.';
        }
        
        return 'You\'re doing well! Let\'s continue.';
    }
    
    /**
     * Add performance to history
     */
    addPerformance(performance) {
        this.performanceHistory.push({
            ...performance,
            timestamp: Date.now()
        });
        
        // Maintain max history size
        if (this.performanceHistory.length > this.maxHistorySize) {
            this.performanceHistory.shift();
        }
        
        this.savePerformanceHistory();
    }
    
    /**
     * Reset adapter
     */
    reset() {
        this.currentDifficulty = 2;
        this.consecutiveSuccesses = 0;
        this.consecutiveFailures = 0;
        this.flowState = false;
        this.struggleState = false;
        this.timeSinceLastSpike = 0;
        this.performanceHistory = [];
        this.categoryDifficulty = {};
    }
    
    /**
     * Load/Save functions
     */
    loadPerformanceHistory() {
        const saved = localStorage.getItem('ss_difficulty_history');
        if (saved) {
            try {
                this.performanceHistory = JSON.parse(saved);
            } catch (e) {
                console.error('Failed to load performance history:', e);
            }
        }
    }
    
    savePerformanceHistory() {
        try {
            localStorage.setItem('ss_difficulty_history', JSON.stringify(this.performanceHistory));
        } catch (e) {
            console.error('Failed to save performance history:', e);
        }
    }
    
    loadSettings() {
        const saved = localStorage.getItem('ss_difficulty_settings');
        if (saved) {
            try {
                const settings = JSON.parse(saved);
                this.currentCurve = settings.curve || this.currentCurve;
                this.spikeEnabled = settings.spikeEnabled !== undefined ? settings.spikeEnabled : this.spikeEnabled;
                this.spikeInterval = settings.spikeInterval || this.spikeInterval;
            } catch (e) {
                console.error('Failed to load difficulty settings:', e);
            }
        }
    }
    
    saveSettings() {
        try {
            const settings = {
                curve: this.currentCurve,
                spikeEnabled: this.spikeEnabled,
                spikeInterval: this.spikeInterval
            };
            localStorage.setItem('ss_difficulty_settings', JSON.stringify(settings));
        } catch (e) {
            console.error('Failed to save difficulty settings:', e);
        }
    }
    
    /**
     * Get statistics
     */
    getStats() {
        return {
            currentDifficulty: this.currentDifficulty,
            currentCurve: this.currentCurve,
            state: this.getState(),
            consecutiveSuccesses: this.consecutiveSuccesses,
            consecutiveFailures: this.consecutiveFailures,
            recentAverage: this.getRecentAverage(),
            trend: this.getPerformanceTrend(),
            consistency: this.getConsistency(),
            historySize: this.performanceHistory.length,
            categoryDifficulties: this.categoryDifficulty
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DifficultyAdapter;
}