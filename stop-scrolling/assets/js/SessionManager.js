/**
 * SessionManager.js
 * Manages user sessions for interactive flow experience
 * Handles session states, persistence, and progress tracking
 */

class SessionManager {
    constructor() {
        this.sessionStates = {
            INITIALIZING: 'initializing',
            ACTIVE: 'active',
            TRANSITIONING: 'transitioning',
            BREAK: 'break',
            PAUSED: 'paused',
            COMPLETED: 'completed'
        };

        this.sessionTypes = {
            QUICK: { duration: 5, name: 'Quick Session', activities: 3 },
            FOCUS: { duration: 15, name: 'Focus Session', activities: 5 },
            DEEP: { duration: 30, name: 'Deep Work', activities: 10 },
            ENDLESS: { duration: null, name: 'Endless Mode', activities: null }
        };

        this.currentSession = null;
        this.sessionTimer = null;
        this.autoSaveInterval = null;
        this.storageKey = 'ss_active_session';
        
        this.init();
    }

    init() {
        // Try to restore any existing session
        this.restoreSession();
        
        // Set up auto-save every 30 seconds
        this.autoSaveInterval = setInterval(() => {
            if (this.currentSession && this.currentSession.state === this.sessionStates.ACTIVE) {
                this.saveSession();
            }
        }, 30000);

        // Listen for page unload to save session
        window.addEventListener('beforeunload', () => {
            if (this.currentSession) {
                this.saveSession();
            }
        });
    }

    /**
     * Start a new session
     * @param {string} type - Session type (QUICK, FOCUS, DEEP, ENDLESS)
     * @param {Object} config - Additional configuration options
     */
    async startSession(type = 'QUICK', config = {}) {
        const sessionType = this.sessionTypes[type] || this.sessionTypes.QUICK;
        
        this.currentSession = {
            id: this.generateSessionId(),
            type: type,
            state: this.sessionStates.INITIALIZING,
            startTime: Date.now(),
            endTime: null,
            pausedTime: 0,
            totalDuration: sessionType.duration * 60 * 1000, // Convert to milliseconds
            activitiesCompleted: 0,
            activitiesTotal: sessionType.activities,
            currentActivityIndex: 0,
            activitySequence: [],
            scores: [],
            categoryProgress: {},
            config: {
                ...sessionType,
                ...config
            }
        };

        // Save initial session state
        this.saveSession();

        // Notify listeners
        this.emit('sessionStarted', this.currentSession);

        // Initialize session timer if not endless mode
        if (sessionType.duration) {
            this.startSessionTimer();
        }

        // Update state to active
        this.updateState(this.sessionStates.ACTIVE);

        return this.currentSession;
    }

    /**
     * Pause the current session
     */
    pauseSession() {
        if (!this.currentSession || this.currentSession.state !== this.sessionStates.ACTIVE) {
            return false;
        }

        this.currentSession.pauseStartTime = Date.now();
        this.updateState(this.sessionStates.PAUSED);
        
        // Stop the session timer
        if (this.sessionTimer) {
            clearInterval(this.sessionTimer);
            this.sessionTimer = null;
        }

        this.saveSession();
        this.emit('sessionPaused', this.currentSession);
        
        return true;
    }

    /**
     * Resume a paused session
     */
    resumeSession() {
        if (!this.currentSession || this.currentSession.state !== this.sessionStates.PAUSED) {
            return false;
        }

        // Calculate pause duration and add to total paused time
        const pauseDuration = Date.now() - this.currentSession.pauseStartTime;
        this.currentSession.pausedTime += pauseDuration;
        delete this.currentSession.pauseStartTime;

        this.updateState(this.sessionStates.ACTIVE);

        // Restart session timer if applicable
        if (this.currentSession.totalDuration) {
            this.startSessionTimer();
        }

        this.saveSession();
        this.emit('sessionResumed', this.currentSession);
        
        return true;
    }

    /**
     * End the current session
     */
    endSession(reason = 'completed') {
        if (!this.currentSession) {
            return false;
        }

        this.currentSession.endTime = Date.now();
        this.currentSession.endReason = reason;
        this.updateState(this.sessionStates.COMPLETED);

        // Calculate final statistics
        const stats = this.calculateSessionStats();
        this.currentSession.finalStats = stats;

        // Stop timers
        if (this.sessionTimer) {
            clearInterval(this.sessionTimer);
            this.sessionTimer = null;
        }

        // Save final session state
        this.saveSession();

        // Archive session and clear current
        this.archiveSession(this.currentSession);
        
        this.emit('sessionEnded', this.currentSession);
        
        this.currentSession = null;
        localStorage.removeItem(this.storageKey);

        return stats;
    }

    /**
     * Update session state
     */
    updateState(newState) {
        if (!this.currentSession) return;
        
        const oldState = this.currentSession.state;
        this.currentSession.state = newState;
        this.currentSession.lastStateChange = Date.now();
        
        this.emit('stateChanged', { oldState, newState, session: this.currentSession });
    }

    /**
     * Add activity result to session
     */
    addActivityResult(activityId, result) {
        if (!this.currentSession) return;

        const activityResult = {
            activityId,
            timestamp: Date.now(),
            score: result.score || 0,
            duration: result.duration || 0,
            completed: result.completed || false,
            category: result.category,
            difficulty: result.difficulty
        };

        this.currentSession.scores.push(activityResult);
        this.currentSession.activitiesCompleted++;
        this.currentSession.currentActivityIndex++;

        // Update category progress
        if (!this.currentSession.categoryProgress[result.category]) {
            this.currentSession.categoryProgress[result.category] = {
                count: 0,
                totalScore: 0,
                avgScore: 0
            };
        }
        
        const catProgress = this.currentSession.categoryProgress[result.category];
        catProgress.count++;
        catProgress.totalScore += activityResult.score;
        catProgress.avgScore = catProgress.totalScore / catProgress.count;

        this.saveSession();
        this.emit('activityCompleted', { activity: activityResult, session: this.currentSession });
    }

    /**
     * Get session progress
     */
    getProgress() {
        if (!this.currentSession) return null;

        const elapsed = this.getElapsedTime();
        const remaining = this.currentSession.totalDuration ? 
            Math.max(0, this.currentSession.totalDuration - elapsed) : null;

        return {
            elapsed,
            remaining,
            elapsedFormatted: this.formatTime(elapsed),
            remainingFormatted: remaining ? this.formatTime(remaining) : 'Endless',
            activitiesCompleted: this.currentSession.activitiesCompleted,
            activitiesTotal: this.currentSession.activitiesTotal,
            progressPercent: this.currentSession.activitiesTotal ? 
                (this.currentSession.activitiesCompleted / this.currentSession.activitiesTotal) * 100 : 0,
            state: this.currentSession.state,
            categoryProgress: this.currentSession.categoryProgress
        };
    }

    /**
     * Get elapsed time accounting for pauses
     */
    getElapsedTime() {
        if (!this.currentSession) return 0;
        
        const now = Date.now();
        const totalElapsed = now - this.currentSession.startTime;
        const activeTime = totalElapsed - this.currentSession.pausedTime;
        
        // If currently paused, subtract current pause duration
        if (this.currentSession.state === this.sessionStates.PAUSED && this.currentSession.pauseStartTime) {
            const currentPauseDuration = now - this.currentSession.pauseStartTime;
            return activeTime - currentPauseDuration;
        }
        
        return activeTime;
    }

    /**
     * Start session timer for timed sessions
     */
    startSessionTimer() {
        if (this.sessionTimer) {
            clearInterval(this.sessionTimer);
        }

        this.sessionTimer = setInterval(() => {
            const progress = this.getProgress();
            
            // Check if time is up
            if (progress.remaining !== null && progress.remaining <= 0) {
                this.endSession('timeout');
            }
            
            // Emit progress update
            this.emit('progressUpdate', progress);
        }, 1000);
    }

    /**
     * Save session to localStorage
     */
    saveSession() {
        if (!this.currentSession) return;
        
        try {
            const sessionData = JSON.stringify(this.currentSession);
            localStorage.setItem(this.storageKey, sessionData);
            return true;
        } catch (error) {
            console.error('Failed to save session:', error);
            return false;
        }
    }

    /**
     * Restore session from localStorage
     */
    restoreSession() {
        try {
            const sessionData = localStorage.getItem(this.storageKey);
            if (!sessionData) return null;

            const session = JSON.parse(sessionData);
            
            // Check if session is still valid (not older than 24 hours)
            const age = Date.now() - session.startTime;
            if (age > 24 * 60 * 60 * 1000) {
                localStorage.removeItem(this.storageKey);
                return null;
            }

            // Restore session
            this.currentSession = session;
            
            // If session was active, resume timers
            if (session.state === this.sessionStates.ACTIVE && session.totalDuration) {
                this.startSessionTimer();
            }

            this.emit('sessionRestored', this.currentSession);
            return this.currentSession;
        } catch (error) {
            console.error('Failed to restore session:', error);
            localStorage.removeItem(this.storageKey);
            return null;
        }
    }

    /**
     * Archive completed session
     */
    archiveSession(session) {
        try {
            const archiveKey = 'ss_session_archive';
            let archive = JSON.parse(localStorage.getItem(archiveKey) || '[]');
            
            // Keep only last 50 sessions
            if (archive.length >= 50) {
                archive = archive.slice(-49);
            }
            
            archive.push({
                ...session,
                archivedAt: Date.now()
            });
            
            localStorage.setItem(archiveKey, JSON.stringify(archive));
        } catch (error) {
            console.error('Failed to archive session:', error);
        }
    }

    /**
     * Calculate session statistics
     */
    calculateSessionStats() {
        if (!this.currentSession) return null;

        const totalScore = this.currentSession.scores.reduce((sum, s) => sum + s.score, 0);
        const avgScore = this.currentSession.scores.length > 0 ? 
            totalScore / this.currentSession.scores.length : 0;

        return {
            totalActivities: this.currentSession.activitiesCompleted,
            totalScore,
            averageScore: Math.round(avgScore),
            duration: this.getElapsedTime(),
            durationFormatted: this.formatTime(this.getElapsedTime()),
            completionRate: this.currentSession.activitiesTotal ? 
                (this.currentSession.activitiesCompleted / this.currentSession.activitiesTotal) * 100 : 100,
            categoryBreakdown: this.currentSession.categoryProgress
        };
    }

    /**
     * Format time in mm:ss or hh:mm:ss
     */
    formatTime(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }

    /**
     * Generate unique session ID
     */
    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Event emitter functionality
     */
    emit(event, data) {
        window.dispatchEvent(new CustomEvent(`sessionManager:${event}`, { detail: data }));
    }

    /**
     * Clean up
     */
    destroy() {
        if (this.sessionTimer) {
            clearInterval(this.sessionTimer);
        }
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }
        this.saveSession();
    }
}

// Immediately assign to window for browser usage
if (typeof window !== 'undefined') {
    window.SessionManager = SessionManager;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SessionManager;
}