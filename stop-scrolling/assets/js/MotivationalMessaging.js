/**
 * MotivationalMessaging.js
 * Intelligent motivational messaging system that provides contextual encouragement
 * Adapts messages based on user performance, mood, and progress patterns
 */

class MotivationalMessaging {
    constructor() {
        // Message categories with contextual variations
        this.messageLibrary = {
            // Welcome and Starting Messages
            welcome: {
                first_time: [
                    "🌟 Welcome to your cognitive adventure! Every expert was once a beginner.",
                    "🚀 Ready to unlock your brain's potential? Let's start this journey together!",
                    "🎯 Your mind is like a muscle - let's give it an amazing workout!",
                    "✨ Great choice! You're taking the first step toward a sharper, more focused mind."
                ],
                returning: [
                    "🔥 Welcome back, champion! Ready to continue your progress?",
                    "⚡ Your brain missed you! Let's pick up where we left off.",
                    "🎖️ Back for more? I love your dedication!",
                    "🌅 Another day, another chance to grow stronger!"
                ],
                long_absence: [
                    "🤗 Look who's back! No worries about the break - every comeback starts with a single step.",
                    "🌈 Welcome back! Your brain is ready to get back into action.",
                    "💪 It's never too late to restart. Your potential is still there, waiting!",
                    "🔄 Fresh start, fresh energy! Let's rebuild those cognitive muscles."
                ]
            },
            
            // Performance-based Messages
            performance: {
                excellent: [
                    "🏆 Outstanding! You're operating at peak performance!",
                    "💎 Incredible accuracy! Your focus is absolutely razor-sharp today.",
                    "🎯 Bullseye! You're hitting every target with precision.",
                    "⭐ Stellar performance! You're making this look effortless.",
                    "🚀 You're on fire! This level of excellence is inspiring."
                ],
                good: [
                    "👏 Great job! You're building solid momentum.",
                    "✅ Nice work! Your consistency is really paying off.",
                    "📈 You're improving with each activity. Keep it up!",
                    "💪 Strong performance! Your hard work is showing.",
                    "🌟 Good progress! You're getting better and better."
                ],
                improving: [
                    "📊 I can see you getting stronger! Every attempt makes you better.",
                    "🌱 Growth in action! Each challenge is making you more capable.",
                    "⬆️ Upward trend detected! You're definitely on the right track.",
                    "🔧 You're fine-tuning your skills perfectly. Keep adjusting!",
                    "🎯 Each round brings you closer to mastery. Stay focused!"
                ],
                struggling: [
                    "🤝 Everyone has tough moments - what matters is that you keep trying!",
                    "💡 Remember: mistakes are just learning opportunities in disguise.",
                    "🏋️ The hardest workouts build the strongest muscles. You've got this!",
                    "🌟 Your persistence will pay off. Champions aren't made in easy moments.",
                    "🔥 Challenges today become strengths tomorrow. Keep pushing forward!"
                ],
                comeback: [
                    "🎉 What a comeback! That's the spirit of a true champion!",
                    "⚡ From struggle to success - that's how legends are made!",
                    "🦅 You soared back beautifully! Resilience is your superpower.",
                    "💫 Incredible turnaround! You just proved your mental toughness.",
                    "🏆 That's how you bounce back! Adversity revealed your strength."
                ]
            },
            
            // Streak and Consistency Messages
            streaks: {
                new_streak: [
                    "🔥 Streak started! Every journey begins with a single step.",
                    "⚡ Day one of your streak! Consistency builds greatness.",
                    "🌱 A new streak is born! Watch it grow with your dedication.",
                    "🎯 Streak initiated! You're building something special."
                ],
                building: [
                    "📈 Streak growing strong! Your consistency is impressive.",
                    "🔗 Another link in your chain of success! Keep building.",
                    "⭐ Your streak is gaining momentum! Consistency creates magic.",
                    "🏗️ Building day by day! Your dedication is showing."
                ],
                milestone: [
                    "🎉 Milestone achieved! Your consistency is truly remarkable!",
                    "🏆 What a streak! You're proving that persistence pays off!",
                    "💎 This streak is a testament to your commitment! Incredible!",
                    "🌟 Streak milestone unlocked! You're setting an amazing example!"
                ],
                at_risk: [
                    "⏰ Don't let your amazing streak slip away! You've built something special.",
                    "🔥 Your streak needs you today! Keep the flame burning bright.",
                    "💪 One more activity to keep your streak alive! You've got this!",
                    "⚡ Your streak is waiting! Don't break the chain of success."
                ],
                broken: [
                    "🌅 Every ending is a new beginning. Ready to start fresh?",
                    "🔄 Streaks can be rebuilt! Your progress wasn't lost - it was practice.",
                    "💪 Champions rise after every fall. Time to build an even better streak!",
                    "🌟 Your dedication remains! One setback can't dim your potential."
                ]
            },
            
            // Time-based Messages
            time_of_day: {
                morning: [
                    "🌅 Good morning! Perfect time to energize your brain!",
                    "☀️ Morning minds are fresh minds! Great choice to start early.",
                    "🧠 Rise and shine! Your brain is ready for some morning magic.",
                    "🌤️ Morning cognitive workout coming up! Your day is off to a great start."
                ],
                afternoon: [
                    "☀️ Afternoon power session! Keep that momentum going strong!",
                    "⚡ Perfect time for a brain boost! You're making great use of your day.",
                    "🎯 Midday focus time! Your consistency throughout the day is admirable.",
                    "🚀 Afternoon excellence! You're keeping your cognitive engine running!"
                ],
                evening: [
                    "🌙 Evening wind-down with a brain workout! Perfect way to end the day.",
                    "⭐ Night session! You're dedicated to growth even as the day closes.",
                    "🌃 Evening focus time! Ending your day on a high note.",
                    "🔮 Nighttime mental training! You're committed to constant improvement."
                ],
                late_night: [
                    "🌙 Burning the midnight oil for self-improvement! Dedication level: maximum!",
                    "🦉 Night owl mode activated! Your commitment knows no bounds.",
                    "✨ Late-night brain training! Your future self will thank you.",
                    "🌟 Even at this hour, you choose growth! That's true dedication."
                ]
            },
            
            // Progress and Achievement Messages
            progress: {
                level_up: [
                    "🎉 Level up! Your hard work just paid off in a big way!",
                    "⬆️ Next level unlocked! You're climbing the ladder of success!",
                    "🏆 Level advancement! Your progress is absolutely incredible!",
                    "🚀 New level achieved! You're reaching new heights!"
                ],
                badge_earned: [
                    "🏅 Badge unlocked! Your expertise is officially recognized!",
                    "⭐ New achievement earned! You're collecting success stories!",
                    "🎖️ Badge acquired! This one represents your true dedication!",
                    "💎 Achievement unlocked! You're building an impressive collection!"
                ],
                milestone: [
                    "🎯 Major milestone reached! This is a moment to be proud of!",
                    "🏔️ Summit conquered! You've reached an incredible milestone!",
                    "🎉 Milestone celebration! Your journey has reached a special point!",
                    "⭐ Significant achievement unlocked! You're making history!"
                ]
            },
            
            // Encouragement by Category
            category_motivation: {
                memory_game: [
                    "🧠 Memory palace under construction! Each game builds stronger recall.",
                    "🔍 Sharpening your mental filing system! Every repetition counts.",
                    "📚 Your brain is like a library - you're adding new organizational skills!",
                    "💭 Memory muscles getting stronger! You're training your most valuable asset."
                ],
                puzzle: [
                    "🧩 Piece by piece, you're becoming a problem-solving master!",
                    "🔧 Logic circuits firing perfectly! You're thinking like a true strategist.",
                    "🎯 Pattern recognition improving! Your analytical skills are leveling up.",
                    "⚙️ Mental gears turning smoothly! Complex thinking is your specialty."
                ],
                trivia: [
                    "🌍 Your knowledge universe is expanding! Every fact makes you stronger.",
                    "📖 Building your mental encyclopedia! You're becoming a walking database.",
                    "🎓 Academic excellence in progress! Your curiosity drives your growth.",
                    "💡 Illuminating your mind with knowledge! Each answer brightens your intellect."
                ],
                meditation: [
                    "🧘 Inner peace and focus combined! You're mastering the art of mindfulness.",
                    "☯️ Balance and clarity developing! Your mental harmony is beautiful.",
                    "🌸 Mindfulness blooming! You're cultivating incredible inner strength.",
                    "🕯️ Focus flame burning bright! Your concentration powers are growing."
                ],
                challenge: [
                    "⚔️ Challenge accepted and conquered! You're a true mental warrior!",
                    "🏔️ Climbing cognitive mountains! No challenge is too big for you!",
                    "🦾 Mental strength on full display! You tackle challenges fearlessly!",
                    "🎯 Precision under pressure! You thrive when the stakes are high!"
                ]
            },
            
            // Motivational Quotes and Wisdom
            wisdom: [
                "💪 'The mind is not a vessel to be filled, but a fire to be kindled.' - Plutarch",
                "🌟 'Success is the sum of small efforts repeated day in and day out.' - Robert Collier",
                "🚀 'Your limitation—it's only your imagination. Keep pushing boundaries!'",
                "🏆 'Champions keep playing until they get it right.' - Billie Jean King",
                "⚡ 'The brain is like a muscle. The more you use it, the stronger it gets!'",
                "🎯 'Excellence is never an accident. It is always the result of intelligent effort.'",
                "🌱 'What we plant in the soil of contemplation, we shall reap in the harvest of action.'",
                "💎 'Pressure makes diamonds. You're becoming something precious!'"
            ],
            
            // Session Completion Messages
            completion: {
                quick_session: [
                    "⚡ Quick but effective! Sometimes the best workouts are the focused ones.",
                    "🎯 Short and sweet! You made every moment count.",
                    "✨ Quality over quantity! Your focused effort was perfect.",
                    "🚀 Efficient excellence! You maximized your time beautifully."
                ],
                long_session: [
                    "🏅 What dedication! That was an impressive session length!",
                    "💪 Marathon mentality! Your endurance is truly admirable.",
                    "⭐ Extended excellence! You went above and beyond today!",
                    "🎉 Commitment champion! That was a serious training session!"
                ],
                perfect_session: [
                    "💯 Flawless performance! You achieved perfection today!",
                    "🎯 Bullseye session! Every shot hit the target perfectly!",
                    "⭐ Perfect game! Your accuracy was absolutely phenomenal!",
                    "🏆 Precision personified! That was a masterclass in focus!"
                ]
            }
        };
        
        // User context for personalized messaging
        this.userContext = {
            name: null,
            level: 1,
            favoriteCategory: null,
            lastSessionDate: null,
            consecutiveDays: 0,
            totalActivities: 0,
            averageAccuracy: 0,
            preferredTimeOfDay: null,
            motivationalTone: 'balanced' // energetic, calm, balanced, competitive
        };
        
        // Message timing and display settings
        this.displaySettings = {
            showWelcomeMessage: true,
            showProgressMessages: true,
            showEncouragementMessages: true,
            showWisdomQuotes: true,
            messageDisplayDuration: 4000,
            animationStyle: 'slide' // slide, fade, bounce
        };
        
        // Recent messages to avoid repetition
        this.recentMessages = [];
        this.maxRecentMessages = 10;
        
        this.init();
    }
    
    init() {
        this.loadUserContext();
        this.bindEvents();
    }
    
    /**
     * Get personalized welcome message
     */
    getWelcomeMessage() {
        const daysSinceLastSession = this.getDaysSinceLastSession();
        let category;
        
        if (!this.userContext.lastSessionDate || this.userContext.totalActivities === 0) {
            category = 'first_time';
        } else if (daysSinceLastSession > 7) {
            category = 'long_absence';
        } else {
            category = 'returning';
        }
        
        return this.getRandomMessage('welcome', category);
    }
    
    /**
     * Get performance-based message
     */
    getPerformanceMessage(performanceData) {
        const accuracy = performanceData.accuracy || 0;
        const isImproving = performanceData.isImproving || false;
        const isComeback = performanceData.isComeback || false;
        
        let category;
        
        if (isComeback) {
            category = 'comeback';
        } else if (accuracy >= 0.9) {
            category = 'excellent';
        } else if (accuracy >= 0.75) {
            category = 'good';
        } else if (isImproving) {
            category = 'improving';
        } else {
            category = 'struggling';
        }
        
        return this.getRandomMessage('performance', category);
    }
    
    /**
     * Get streak-related message
     */
    getStreakMessage(streakData) {
        const days = streakData.days || 0;
        const isAtRisk = streakData.isAtRisk || false;
        const isBroken = streakData.isBroken || false;
        const isMilestone = streakData.isMilestone || false;
        
        if (isBroken) {
            return this.getRandomMessage('streaks', 'broken');
        } else if (isAtRisk) {
            return this.getRandomMessage('streaks', 'at_risk');
        } else if (isMilestone) {
            return this.getRandomMessage('streaks', 'milestone');
        } else if (days <= 1) {
            return this.getRandomMessage('streaks', 'new_streak');
        } else {
            return this.getRandomMessage('streaks', 'building');
        }
    }
    
    /**
     * Get time-appropriate message
     */
    getTimeBasedMessage() {
        const hour = new Date().getHours();
        let period;
        
        if (hour >= 5 && hour < 12) {
            period = 'morning';
        } else if (hour >= 12 && hour < 18) {
            period = 'afternoon';
        } else if (hour >= 18 && hour < 23) {
            period = 'evening';
        } else {
            period = 'late_night';
        }
        
        return this.getRandomMessage('time_of_day', period);
    }
    
    /**
     * Get category-specific motivation
     */
    getCategoryMessage(category) {
        if (this.messageLibrary.category_motivation[category]) {
            return this.getRandomMessage('category_motivation', category);
        }
        return null;
    }
    
    /**
     * Get session completion message
     */
    getCompletionMessage(sessionData) {
        const duration = sessionData.duration || 0;
        const accuracy = sessionData.averageAccuracy || 0;
        const activities = sessionData.activitiesCompleted || 0;
        
        let category;
        
        if (accuracy >= 0.95) {
            category = 'perfect_session';
        } else if (duration > 30 * 60 || activities > 15) { // 30 minutes or 15+ activities
            category = 'long_session';
        } else {
            category = 'quick_session';
        }
        
        return this.getRandomMessage('completion', category);
    }
    
    /**
     * Get wisdom quote
     */
    getWisdomMessage() {
        return this.getRandomMessage('wisdom');
    }
    
    /**
     * Get contextual message based on current situation
     */
    getContextualMessage(context = {}) {
        const messages = [];
        
        // Add different types of messages based on context
        if (context.isWelcome) {
            messages.push(this.getWelcomeMessage());
        }
        
        if (context.performance) {
            messages.push(this.getPerformanceMessage(context.performance));
        }
        
        if (context.streak) {
            messages.push(this.getStreakMessage(context.streak));
        }
        
        if (context.category) {
            const categoryMsg = this.getCategoryMessage(context.category);
            if (categoryMsg) messages.push(categoryMsg);
        }
        
        if (context.achievement) {
            messages.push(this.getAchievementMessage(context.achievement));
        }
        
        // Add wisdom quote occasionally (20% chance)
        if (Math.random() < 0.2) {
            messages.push(this.getWisdomMessage());
        }
        
        // Add time-based message occasionally (30% chance)
        if (Math.random() < 0.3) {
            messages.push(this.getTimeBasedMessage());
        }
        
        // Return the most appropriate message
        return messages.length > 0 ? messages[0] : this.getWisdomMessage();
    }
    
    /**
     * Get achievement celebration message
     */
    getAchievementMessage(achievementData) {
        const type = achievementData.type || 'general';
        
        if (type === 'level_up') {
            return this.getRandomMessage('progress', 'level_up');
        } else if (type === 'badge') {
            return this.getRandomMessage('progress', 'badge_earned');
        } else if (type === 'milestone') {
            return this.getRandomMessage('progress', 'milestone');
        }
        
        return this.getRandomMessage('progress', 'milestone');
    }
    
    /**
     * Display message to user
     */
    displayMessage(message, type = 'info', duration = null) {
        if (!message || !this.displaySettings.showProgressMessages) return;
        
        // Avoid showing the same message too recently
        if (this.recentMessages.includes(message)) {
            return;
        }
        
        // Create message element
        const messageElement = document.createElement('div');
        messageElement.className = `motivational-message ${type}`;
        messageElement.innerHTML = `
            <div class="message-content">
                <div class="message-text">${message}</div>
                <button class="message-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        // Add to page
        document.body.appendChild(messageElement);
        
        // Animate in
        setTimeout(() => messageElement.classList.add('show'), 100);
        
        // Auto remove
        const displayDuration = duration || this.displaySettings.messageDisplayDuration;
        setTimeout(() => {
            messageElement.classList.remove('show');
            setTimeout(() => {
                if (messageElement.parentElement) {
                    messageElement.remove();
                }
            }, 500);
        }, displayDuration);
        
        // Track recent message
        this.addToRecentMessages(message);
        
        // Emit event
        this.emit('messageDisplayed', { message, type });
    }
    
    /**
     * Display floating motivation bubble
     */
    displayMotivationBubble(message, element = null) {
        if (!element) {
            element = document.body;
        }
        
        const bubble = document.createElement('div');
        bubble.className = 'motivation-bubble';
        bubble.textContent = message;
        
        // Position relative to element
        const rect = element.getBoundingClientRect();
        bubble.style.position = 'absolute';
        bubble.style.left = (rect.left + rect.width / 2) + 'px';
        bubble.style.top = (rect.top - 10) + 'px';
        bubble.style.transform = 'translateX(-50%)';
        bubble.style.zIndex = '1005';
        
        document.body.appendChild(bubble);
        
        // Animate up and fade
        setTimeout(() => {
            bubble.style.transform = 'translateX(-50%) translateY(-20px)';
            bubble.style.opacity = '0';
        }, 100);
        
        // Remove after animation
        setTimeout(() => {
            if (bubble.parentElement) {
                bubble.remove();
            }
        }, 2000);
    }
    
    /**
     * Utility functions
     */
    getRandomMessage(category, subcategory = null) {
        let messages;
        
        if (subcategory) {
            messages = this.messageLibrary[category][subcategory];
        } else {
            messages = this.messageLibrary[category];
        }
        
        if (!messages || messages.length === 0) {
            return "Keep up the great work! 🌟";
        }
        
        // Filter out recently used messages if possible
        let availableMessages = messages.filter(msg => !this.recentMessages.includes(msg));
        if (availableMessages.length === 0) {
            availableMessages = messages;
        }
        
        return availableMessages[Math.floor(Math.random() * availableMessages.length)];
    }
    
    addToRecentMessages(message) {
        this.recentMessages.unshift(message);
        if (this.recentMessages.length > this.maxRecentMessages) {
            this.recentMessages = this.recentMessages.slice(0, this.maxRecentMessages);
        }
    }
    
    getDaysSinceLastSession() {
        if (!this.userContext.lastSessionDate) return Infinity;
        
        const lastSession = new Date(this.userContext.lastSessionDate);
        const now = new Date();
        const diffTime = Math.abs(now - lastSession);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    
    /**
     * Context management
     */
    updateUserContext(newContext) {
        this.userContext = { ...this.userContext, ...newContext };
        this.saveUserContext();
    }
    
    loadUserContext() {
        try {
            const saved = localStorage.getItem('ss_motivational_context');
            if (saved) {
                this.userContext = { ...this.userContext, ...JSON.parse(saved) };
            }
        } catch (error) {
            console.error('Failed to load motivational context:', error);
        }
    }
    
    saveUserContext() {
        try {
            localStorage.setItem('ss_motivational_context', JSON.stringify(this.userContext));
        } catch (error) {
            console.error('Failed to save motivational context:', error);
        }
    }
    
    /**
     * Event handling
     */
    bindEvents() {
        // Listen for various app events
        window.addEventListener('activity:completed', (e) => {
            const message = this.getPerformanceMessage(e.detail);
            this.displayMessage(message, 'success');
        });
        
        window.addEventListener('streak:milestone', (e) => {
            const message = this.getStreakMessage({ ...e.detail, isMilestone: true });
            this.displayMessage(message, 'celebration');
        });
        
        window.addEventListener('achievements:achievementEarned', (e) => {
            const message = this.getAchievementMessage({ type: 'badge' });
            this.displayMessage(message, 'achievement');
        });
        
        window.addEventListener('combo:levelUp', (e) => {
            const message = this.getAchievementMessage({ type: 'level_up' });
            this.displayMessage(message, 'level-up');
        });
        
        window.addEventListener('session:started', (e) => {
            if (this.displaySettings.showWelcomeMessage) {
                setTimeout(() => {
                    const message = this.getWelcomeMessage();
                    this.displayMessage(message, 'welcome');
                }, 1000);
            }
        });
        
        window.addEventListener('session:completed', (e) => {
            const message = this.getCompletionMessage(e.detail);
            this.displayMessage(message, 'completion');
        });
    }
    
    emit(event, data) {
        window.dispatchEvent(new CustomEvent(`motivation:${event}`, { detail: data }));
    }
    
    /**
     * Settings management
     */
    updateSettings(newSettings) {
        this.displaySettings = { ...this.displaySettings, ...newSettings };
        this.saveSettings();
    }
    
    saveSettings() {
        try {
            localStorage.setItem('ss_motivational_settings', JSON.stringify(this.displaySettings));
        } catch (error) {
            console.error('Failed to save motivational settings:', error);
        }
    }
    
    loadSettings() {
        try {
            const saved = localStorage.getItem('ss_motivational_settings');
            if (saved) {
                this.displaySettings = { ...this.displaySettings, ...JSON.parse(saved) };
            }
        } catch (error) {
            console.error('Failed to load motivational settings:', error);
        }
    }
    
    /**
     * Manual message triggers
     */
    showEncouragement() {
        const message = this.getRandomMessage('performance', 'good');
        this.displayMessage(message, 'encouragement');
    }
    
    showWisdom() {
        const message = this.getWisdomMessage();
        this.displayMessage(message, 'wisdom');
    }
    
    showCelebration(text = null) {
        const message = text || this.getRandomMessage('progress', 'milestone');
        this.displayMessage(message, 'celebration');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MotivationalMessaging;
}