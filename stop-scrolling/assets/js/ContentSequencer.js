/**
 * ContentSequencer.js
 * Intelligent content ordering and category rotation for optimal cognitive flow
 * Manages difficulty progression and content queue
 */

class ContentSequencer {
    constructor() {
        // Category rotation patterns for different session types
        this.rotationPatterns = {
            balanced: ['memory_game', 'puzzle', 'trivia', 'meditation'],
            cognitive: ['puzzle', 'memory_game', 'trivia', 'puzzle', 'meditation'],
            relaxed: ['trivia', 'meditation', 'puzzle', 'meditation', 'memory_game'],
            challenge: ['memory_game', 'puzzle', 'memory_game', 'trivia', 'challenge']
        };

        // Cognitive load values for each category (1-5 scale)
        this.cognitiveLoad = {
            memory_game: 4,
            puzzle: 5,
            trivia: 2,
            meditation: 1,
            challenge: 5,
            reading: 2
        };

        // Difficulty progression curves
        this.difficultyProgression = {
            linear: (current, performance) => this.linearProgression(current, performance),
            adaptive: (current, performance) => this.adaptiveProgression(current, performance),
            stepped: (current, performance) => this.steppedProgression(current, performance),
            wave: (current, performance) => this.waveProgression(current, performance)
        };

        this.contentQueue = [];
        this.contentHistory = [];
        this.categoryIndex = 0;
        this.currentPattern = 'balanced';
        this.difficultyMode = 'adaptive';
        this.lastPerformance = null;
        this.fatigueLevel = 0;
        
        this.init();
    }

    init() {
        // Load user preferences and history
        this.loadUserPreferences();
        this.loadContentHistory();
    }

    /**
     * Generate content sequence for a session
     * @param {Object} sessionConfig - Session configuration
     * @param {Array} availableContent - Available content items
     * @returns {Array} Ordered sequence of content IDs
     */
    async generateSequence(sessionConfig, availableContent) {
        const sequence = [];
        const pattern = this.rotationPatterns[sessionConfig.pattern || this.currentPattern];
        const targetCount = sessionConfig.activityCount || 5;
        
        // Group content by category
        const contentByCategory = this.groupByCategory(availableContent);
        
        // Track used content to avoid repetition
        const usedContent = new Set();
        
        // Build sequence based on pattern
        for (let i = 0; i < targetCount; i++) {
            const categoryIndex = i % pattern.length;
            const targetCategory = pattern[categoryIndex];
            
            // Calculate target difficulty
            const targetDifficulty = this.calculateTargetDifficulty(i, targetCount, sessionConfig);
            
            // Select best content for this slot
            const content = this.selectContent(
                contentByCategory[targetCategory] || [],
                targetDifficulty,
                usedContent,
                i
            );
            
            if (content) {
                sequence.push({
                    ...content,
                    sequenceIndex: i,
                    targetDifficulty,
                    category: targetCategory,
                    estimatedCognitiveLoad: this.cognitiveLoad[targetCategory]
                });
                usedContent.add(content.content_id);
            }
        }
        
        // Add break recommendations
        this.insertBreakPoints(sequence, sessionConfig);
        
        // Store the queue
        this.contentQueue = sequence;
        
        return sequence;
    }

    /**
     * Get next content in sequence
     */
    getNextContent() {
        if (this.contentQueue.length === 0) {
            return null;
        }
        
        const content = this.contentQueue.shift();
        this.contentHistory.push({
            ...content,
            startedAt: Date.now()
        });
        
        return content;
    }

    /**
     * Update performance for last content
     */
    updatePerformance(performance) {
        this.lastPerformance = performance;
        
        // Update fatigue level based on performance
        this.updateFatigueLevel(performance);
        
        // Adjust upcoming content difficulty if needed
        if (this.contentQueue.length > 0) {
            this.adjustUpcomingDifficulty(performance);
        }
        
        // Save performance data
        this.savePerformanceData(performance);
    }

    /**
     * Select best content based on criteria
     */
    selectContent(categoryContent, targetDifficulty, usedContent, sequenceIndex) {
        if (!categoryContent || categoryContent.length === 0) {
            return null;
        }
        
        // Filter out used content
        const available = categoryContent.filter(c => !usedContent.has(c.content_id));
        
        if (available.length === 0) {
            return null;
        }
        
        // Score each content item
        const scored = available.map(content => {
            const difficultyScore = this.calculateDifficultyScore(content.difficulty_level, targetDifficulty);
            const freshnessScore = this.calculateFreshnessScore(content.content_id);
            const varietyScore = this.calculateVarietyScore(content, sequenceIndex);
            
            return {
                content,
                score: (difficultyScore * 0.5) + (freshnessScore * 0.3) + (varietyScore * 0.2)
            };
        });
        
        // Sort by score and return best match
        scored.sort((a, b) => b.score - a.score);
        return scored[0].content;
    }

    /**
     * Calculate target difficulty for position in sequence
     */
    calculateTargetDifficulty(index, total, config) {
        const baseDifficulty = config.startDifficulty || 2;
        const maxDifficulty = config.maxDifficulty || 5;
        
        // Apply progression curve
        const progression = this.difficultyProgression[this.difficultyMode];
        const performance = this.lastPerformance || { accuracy: 0.7, speed: 0.5 };
        
        let targetDifficulty = progression(baseDifficulty, performance);
        
        // Adjust for position in sequence (warm-up and cool-down)
        if (index < 2) {
            // Warm-up: slightly easier
            targetDifficulty = Math.max(1, targetDifficulty - 1);
        } else if (index >= total - 2) {
            // Cool-down: slightly easier
            targetDifficulty = Math.max(1, targetDifficulty - 0.5);
        }
        
        // Adjust for fatigue
        if (this.fatigueLevel > 0.7) {
            targetDifficulty = Math.max(1, targetDifficulty - 1);
        }
        
        return Math.min(maxDifficulty, Math.max(1, Math.round(targetDifficulty)));
    }

    /**
     * Insert break points into sequence
     */
    insertBreakPoints(sequence, config) {
        const breakInterval = config.breakInterval || 3;
        const breakDuration = config.breakDuration || 30; // seconds
        
        // Calculate cognitive load accumulation
        let accumulatedLoad = 0;
        const breakPoints = [];
        
        sequence.forEach((item, index) => {
            accumulatedLoad += item.estimatedCognitiveLoad;
            
            // Insert break if load is high or at interval
            if (accumulatedLoad >= 10 || (index > 0 && index % breakInterval === 0)) {
                breakPoints.push(index + 1);
                accumulatedLoad = 0;
            }
        });
        
        // Insert breaks in reverse order to maintain indices
        breakPoints.reverse().forEach(index => {
            if (index < sequence.length) {
                sequence.splice(index, 0, {
                    type: 'break',
                    duration: breakDuration,
                    reason: accumulatedLoad >= 10 ? 'cognitive_load' : 'interval',
                    sequenceIndex: index
                });
            }
        });
    }

    /**
     * Difficulty progression functions
     */
    linearProgression(current, performance) {
        const adjustment = performance.accuracy > 0.8 ? 0.5 : -0.5;
        return current + adjustment;
    }

    adaptiveProgression(current, performance) {
        const accuracyWeight = 0.6;
        const speedWeight = 0.4;
        
        const performanceScore = (performance.accuracy * accuracyWeight) + 
                                 ((performance.speed || 0.5) * speedWeight);
        
        if (performanceScore > 0.85) {
            return Math.min(5, current + 1);
        } else if (performanceScore > 0.7) {
            return Math.min(5, current + 0.5);
        } else if (performanceScore < 0.5) {
            return Math.max(1, current - 1);
        } else if (performanceScore < 0.65) {
            return Math.max(1, current - 0.5);
        }
        
        return current;
    }

    steppedProgression(current, performance) {
        const successStreak = this.getSuccessStreak();
        
        if (successStreak >= 3) {
            return Math.min(5, current + 1);
        } else if (this.getFailureStreak() >= 2) {
            return Math.max(1, current - 1);
        }
        
        return current;
    }

    waveProgression(current, performance) {
        // Create a wave pattern: easy -> hard -> medium -> hard -> easy
        const wavePattern = [1, 2, 3, 4, 3, 2];
        const index = this.contentHistory.length % wavePattern.length;
        const baseLevel = wavePattern[index];
        
        // Adjust based on performance
        const adjustment = performance.accuracy > 0.8 ? 0.5 : 
                          performance.accuracy < 0.6 ? -0.5 : 0;
        
        return Math.max(1, Math.min(5, baseLevel + adjustment));
    }

    /**
     * Calculate scoring functions
     */
    calculateDifficultyScore(contentDifficulty, targetDifficulty) {
        const difference = Math.abs(contentDifficulty - targetDifficulty);
        return Math.max(0, 1 - (difference / 4));
    }

    calculateFreshnessScore(contentId) {
        const lastPlayed = this.getLastPlayedTime(contentId);
        if (!lastPlayed) return 1;
        
        const hoursSincePlay = (Date.now() - lastPlayed) / (1000 * 60 * 60);
        return Math.min(1, hoursSincePlay / 24); // Full score after 24 hours
    }

    calculateVarietyScore(content, sequenceIndex) {
        if (sequenceIndex === 0) return 1;
        
        // Check similarity to recent content
        const recentContent = this.contentHistory.slice(-3);
        const similarityScore = recentContent.reduce((score, recent) => {
            if (recent.sub_category === content.sub_category) score -= 0.3;
            if (recent.difficulty_level === content.difficulty_level) score -= 0.2;
            return score;
        }, 1);
        
        return Math.max(0, similarityScore);
    }

    /**
     * Update fatigue level based on performance
     */
    updateFatigueLevel(performance) {
        const errorRate = 1 - performance.accuracy;
        const slowdown = 1 - (performance.speed || 0.5);
        
        // Increase fatigue based on errors and slowdown
        this.fatigueLevel = Math.min(1, this.fatigueLevel + (errorRate * 0.1) + (slowdown * 0.05));
        
        // Decrease fatigue over time and with good performance
        if (performance.accuracy > 0.85) {
            this.fatigueLevel = Math.max(0, this.fatigueLevel - 0.1);
        }
    }

    /**
     * Adjust upcoming content difficulty based on performance
     */
    adjustUpcomingDifficulty(performance) {
        if (performance.accuracy < 0.5 && this.contentQueue.length > 0) {
            // User struggling - make next content easier
            const next = this.contentQueue[0];
            if (next && next.type !== 'break') {
                next.targetDifficulty = Math.max(1, next.targetDifficulty - 1);
            }
        } else if (performance.accuracy > 0.95 && performance.speed > 0.8) {
            // User excelling - make next content harder
            const next = this.contentQueue[0];
            if (next && next.type !== 'break') {
                next.targetDifficulty = Math.min(5, next.targetDifficulty + 1);
            }
        }
    }

    /**
     * Helper functions
     */
    groupByCategory(content) {
        return content.reduce((groups, item) => {
            if (!groups[item.category]) {
                groups[item.category] = [];
            }
            groups[item.category].push(item);
            return groups;
        }, {});
    }

    getLastPlayedTime(contentId) {
        const history = JSON.parse(localStorage.getItem('ss_content_history') || '{}');
        return history[contentId] || null;
    }

    getSuccessStreak() {
        let streak = 0;
        for (let i = this.contentHistory.length - 1; i >= 0; i--) {
            if (this.contentHistory[i].performance?.accuracy >= 0.7) {
                streak++;
            } else {
                break;
            }
        }
        return streak;
    }

    getFailureStreak() {
        let streak = 0;
        for (let i = this.contentHistory.length - 1; i >= 0; i--) {
            if (this.contentHistory[i].performance?.accuracy < 0.6) {
                streak++;
            } else {
                break;
            }
        }
        return streak;
    }

    /**
     * Load and save functions
     */
    loadUserPreferences() {
        const prefs = localStorage.getItem('ss_sequencer_prefs');
        if (prefs) {
            const parsed = JSON.parse(prefs);
            this.currentPattern = parsed.pattern || this.currentPattern;
            this.difficultyMode = parsed.difficultyMode || this.difficultyMode;
        }
    }

    loadContentHistory() {
        const history = localStorage.getItem('ss_sequencer_history');
        if (history) {
            this.contentHistory = JSON.parse(history);
        }
    }

    savePerformanceData(performance) {
        if (this.contentHistory.length > 0) {
            const last = this.contentHistory[this.contentHistory.length - 1];
            last.performance = performance;
            last.completedAt = Date.now();
            
            // Save to localStorage
            localStorage.setItem('ss_sequencer_history', JSON.stringify(this.contentHistory));
            
            // Update content-specific history
            const contentHistory = JSON.parse(localStorage.getItem('ss_content_history') || '{}');
            contentHistory[last.content_id] = Date.now();
            localStorage.setItem('ss_content_history', JSON.stringify(contentHistory));
        }
    }

    /**
     * Reset sequencer
     */
    reset() {
        this.contentQueue = [];
        this.contentHistory = [];
        this.categoryIndex = 0;
        this.lastPerformance = null;
        this.fatigueLevel = 0;
    }

    /**
     * Get sequencer stats
     */
    getStats() {
        return {
            queueLength: this.contentQueue.length,
            historyLength: this.contentHistory.length,
            currentPattern: this.currentPattern,
            difficultyMode: this.difficultyMode,
            fatigueLevel: this.fatigueLevel,
            lastPerformance: this.lastPerformance
        };
    }
}

// Immediately assign to window for browser usage
if (typeof window !== 'undefined') {
    window.ContentSequencer = ContentSequencer;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ContentSequencer;
}