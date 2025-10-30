/**
 * Meditation Player for Stop Scrolling App
 * Handles guided meditation, breathing exercises, and focus timers
 */

class MeditationPlayer {
    constructor(type = 'breathing', duration = 300, container = null) {
        this.type = type; // breathing, guided, focus-timer, visualization
        this.duration = duration; // in seconds
        this.container = container;
        this.sessionState = 'waiting'; // waiting, playing, paused, finished
        
        // Session data
        this.startTime = null;
        this.endTime = null;
        this.elapsedTime = 0;
        this.remainingTime = this.duration;
        this.timer = null;
        this.sessionId = Date.now();
        
        // Breathing exercise settings
        this.breathingPattern = {
            inhale: 4,
            hold: 4,
            exhale: 6,
            pause: 2
        };
        this.breathingPhase = 'inhale'; // inhale, hold, exhale, pause
        this.breathingTimer = null;
        this.breathingCycle = 0;
        this.totalCycles = 0;
        
        // Audio settings
        this.backgroundSounds = {
            'none': null,
            'rain': '/stop-scrolling/assets/audio/rain.mp3',
            'ocean': '/stop-scrolling/assets/audio/ocean.mp3',
            'forest': '/stop-scrolling/assets/audio/forest.mp3',
            'white-noise': '/stop-scrolling/assets/audio/white-noise.mp3'
        };
        this.currentSound = 'none';
        this.audioElement = null;
        
        // UI Elements
        this.elements = {};
        
        this.initialize();
    }
    
    initialize() {
        if (!this.container) {
            console.error('Meditation container not provided');
            return;
        }
        
        this.createUI();
        this.bindEvents();
        this.setupBreathingPattern();
        
        console.log(`Meditation session initialized: ${this.type}, duration: ${this.duration}s`);
    }
    
    createUI() {
        this.container.innerHTML = `
            <div class="meditation-player h-full flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-indigo-900">
                <!-- Header -->
                <div class="meditation-header p-4 text-center border-b border-white/20">
                    <div class="flex justify-between items-center max-w-lg mx-auto">
                        <button class="meditation-back-btn text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                            </svg>
                        </button>
                        <div class="meditation-session-info">
                            <h1 class="meditation-title text-xl font-semibold text-gray-800 dark:text-gray-200">
                                ${this.getSessionTitle()}
                            </h1>
                            <p class="meditation-duration text-sm text-gray-600 dark:text-gray-400">
                                ${this.formatTime(this.duration)} session
                            </p>
                        </div>
                        <button class="meditation-settings-btn text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                            </svg>
                        </button>
                    </div>
                </div>
                
                <!-- Main Content -->
                <div class="meditation-content flex-1 flex flex-col items-center justify-center p-6">
                    <!-- Timer Display -->
                    <div class="meditation-timer-section mb-8 text-center">
                        <div class="meditation-time-display text-6xl font-mono font-light text-gray-800 dark:text-gray-200 mb-4">
                            ${this.formatTime(this.remainingTime)}
                        </div>
                        <div class="meditation-progress-bar w-64 h-2 bg-white/30 rounded-full overflow-hidden">
                            <div class="meditation-progress h-full bg-blue-500 transition-all duration-1000 ease-linear" style="width: 0%"></div>
                        </div>
                    </div>
                    
                    <!-- Breathing Animation -->
                    <div class="meditation-breathing-area ${this.type === 'breathing' ? '' : 'hidden'} mb-8">
                        <div class="breathing-circle-container relative">
                            <div class="breathing-circle w-48 h-48 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center shadow-lg transition-all duration-1000 ease-in-out">
                                <div class="breathing-inner-circle w-32 h-32 rounded-full bg-white/20 flex items-center justify-center">
                                    <div class="breathing-instruction text-white font-semibold text-lg">
                                        Press Play
                                    </div>
                                </div>
                            </div>
                            <!-- Breathing guide rings -->
                            <div class="breathing-ring-1 absolute inset-0 rounded-full border-4 border-white/20 animate-pulse"></div>
                            <div class="breathing-ring-2 absolute inset-0 rounded-full border-2 border-white/10" style="transform: scale(1.2);"></div>
                        </div>
                        
                        <!-- Breathing Info -->
                        <div class="breathing-info mt-6 text-center">
                            <div class="breathing-pattern text-sm text-gray-600 dark:text-gray-400 mb-2">
                                Pattern: ${this.breathingPattern.inhale}-${this.breathingPattern.hold}-${this.breathingPattern.exhale}-${this.breathingPattern.pause}
                            </div>
                            <div class="breathing-cycle-count text-sm text-gray-600 dark:text-gray-400">
                                Cycles: <span class="breathing-cycle-number">0</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Focus Timer -->
                    <div class="meditation-focus-area ${this.type === 'focus-timer' ? '' : 'hidden'} text-center mb-8">
                        <div class="focus-circle w-32 h-32 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
                            <div class="text-white text-2xl font-semibold">Focus</div>
                        </div>
                        <p class="text-gray-600 dark:text-gray-400 text-sm max-w-md mx-auto">
                            Concentrate on your breath, a word, or simply be present in the moment.
                        </p>
                    </div>
                    
                    <!-- Visualization Area -->
                    <div class="meditation-visualization-area ${this.type === 'visualization' ? '' : 'hidden'} text-center mb-8">
                        <div class="visualization-scene w-48 h-32 bg-gradient-to-br from-purple-400 to-pink-500 rounded-lg flex items-center justify-center mx-auto mb-4 shadow-lg">
                            <div class="text-white text-lg font-semibold">🌅 Peaceful Scene</div>
                        </div>
                        <p class="text-gray-600 dark:text-gray-400 text-sm max-w-md mx-auto">
                            Imagine yourself in a calm, peaceful place. Let your mind wander to this serene environment.
                        </p>
                    </div>
                </div>
                
                <!-- Controls -->
                <div class="meditation-controls p-6 border-t border-white/20">
                    <div class="flex justify-center items-center space-x-6 mb-4">
                        <!-- Play/Pause Button -->
                        <button class="meditation-play-btn w-16 h-16 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg transition-all">
                            <svg class="play-icon w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd"></path>
                            </svg>
                            <svg class="pause-icon w-8 h-8 hidden" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                            </svg>
                        </button>
                        
                        <!-- Stop Button -->
                        <button class="meditation-stop-btn w-12 h-12 bg-gray-500 hover:bg-gray-600 rounded-full flex items-center justify-center text-white shadow-lg transition-all">
                            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 000 2h4a1 1 0 100-2H8z" clip-rule="evenodd"></path>
                            </svg>
                        </button>
                    </div>
                    
                    <!-- Background Sound Selection -->
                    <div class="meditation-sound-controls">
                        <div class="text-center mb-3">
                            <span class="text-sm text-gray-600 dark:text-gray-400">Background Sound</span>
                        </div>
                        <div class="flex justify-center space-x-2 flex-wrap">
                            <button class="sound-btn bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full text-xs transition-all" data-sound="none">Silent</button>
                            <button class="sound-btn bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full text-xs transition-all" data-sound="rain">Rain</button>
                            <button class="sound-btn bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full text-xs transition-all" data-sound="ocean">Ocean</button>
                            <button class="sound-btn bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full text-xs transition-all" data-sound="forest">Forest</button>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Settings Modal -->
            <div class="meditation-settings-modal fixed inset-0 bg-black bg-opacity-50 items-center justify-center z-50 hidden">
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
                    <div class="flex justify-between items-center mb-6">
                        <h3 class="text-lg font-semibold">Session Settings</h3>
                        <button class="settings-close-btn text-gray-500 hover:text-gray-700">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>
                    
                    <!-- Duration Settings -->
                    <div class="mb-6">
                        <label class="block text-sm font-medium mb-2">Session Duration</label>
                        <div class="grid grid-cols-4 gap-2">
                            <button class="duration-btn px-3 py-2 text-sm border rounded hover:bg-gray-100 dark:hover:bg-gray-700" data-duration="180">3m</button>
                            <button class="duration-btn px-3 py-2 text-sm border rounded hover:bg-gray-100 dark:hover:bg-gray-700" data-duration="300">5m</button>
                            <button class="duration-btn px-3 py-2 text-sm border rounded hover:bg-gray-100 dark:hover:bg-gray-700" data-duration="600">10m</button>
                            <button class="duration-btn px-3 py-2 text-sm border rounded hover:bg-gray-100 dark:hover:bg-gray-700" data-duration="900">15m</button>
                        </div>
                    </div>
                    
                    <!-- Breathing Pattern Settings -->
                    <div class="mb-6 ${this.type === 'breathing' ? '' : 'hidden'}">
                        <label class="block text-sm font-medium mb-2">Breathing Pattern</label>
                        <div class="space-y-2">
                            <button class="pattern-btn w-full text-left p-2 border rounded hover:bg-gray-100 dark:hover:bg-gray-700" data-pattern="4,4,6,2">
                                4-4-6-2 (Relaxing)
                            </button>
                            <button class="pattern-btn w-full text-left p-2 border rounded hover:bg-gray-100 dark:hover:bg-gray-700" data-pattern="4,4,4,4">
                                4-4-4-4 (Box Breathing)
                            </button>
                            <button class="pattern-btn w-full text-left p-2 border rounded hover:bg-gray-100 dark:hover:bg-gray-700" data-pattern="4,7,8,0">
                                4-7-8 (Sleep)
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Completion Modal -->
            <div class="meditation-complete-modal fixed inset-0 bg-black bg-opacity-50 items-center justify-center z-50 hidden">
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
                    <div class="text-center">
                        <div class="w-16 h-16 bg-green-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                        </div>
                        <h3 class="text-xl font-bold mb-4">Session Complete! 🧘</h3>
                        <div class="space-y-2 mb-6 text-sm text-gray-600 dark:text-gray-400">
                            <p>Duration: <span class="completion-duration font-medium">5:00</span></p>
                            <p class="completion-cycles ${this.type === 'breathing' ? '' : 'hidden'}">Breathing Cycles: <span class="completion-cycle-count font-medium">0</span></p>
                            <p>Great job on completing your meditation session!</p>
                        </div>
                        <div class="flex space-x-3 justify-center">
                            <button class="meditation-another-btn bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors">
                                Another Session
                            </button>
                            <button class="meditation-done-btn bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors">
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Store references to UI elements
        this.elements = {
            backBtn: this.container.querySelector('.meditation-back-btn'),
            settingsBtn: this.container.querySelector('.meditation-settings-btn'),
            timeDisplay: this.container.querySelector('.meditation-time-display'),
            progressBar: this.container.querySelector('.meditation-progress'),
            playBtn: this.container.querySelector('.meditation-play-btn'),
            stopBtn: this.container.querySelector('.meditation-stop-btn'),
            playIcon: this.container.querySelector('.play-icon'),
            pauseIcon: this.container.querySelector('.pause-icon'),
            breathingCircle: this.container.querySelector('.breathing-circle'),
            breathingInstruction: this.container.querySelector('.breathing-instruction'),
            cycleNumber: this.container.querySelector('.breathing-cycle-number'),
            soundBtns: this.container.querySelectorAll('.sound-btn'),
            settingsModal: this.container.querySelector('.meditation-settings-modal'),
            settingsCloseBtn: this.container.querySelector('.settings-close-btn'),
            durationBtns: this.container.querySelectorAll('.duration-btn'),
            patternBtns: this.container.querySelectorAll('.pattern-btn'),
            completeModal: this.container.querySelector('.meditation-complete-modal'),
            completionDuration: this.container.querySelector('.completion-duration'),
            completionCycleCount: this.container.querySelector('.completion-cycle-count'),
            anotherBtn: this.container.querySelector('.meditation-another-btn'),
            doneBtn: this.container.querySelector('.meditation-done-btn')
        };
    }
    
    bindEvents() {
        // Control buttons
        this.elements.playBtn.addEventListener('click', () => this.togglePlayPause());
        this.elements.stopBtn.addEventListener('click', () => this.stopSession());
        this.elements.backBtn.addEventListener('click', () => this.exitToMenu());
        this.elements.settingsBtn.addEventListener('click', () => this.showSettings());
        this.elements.settingsCloseBtn.addEventListener('click', () => this.hideSettings());
        
        // Sound selection
        this.elements.soundBtns.forEach(btn => {
            btn.addEventListener('click', () => this.changeBackgroundSound(btn.dataset.sound));
        });
        
        // Settings
        this.elements.durationBtns.forEach(btn => {
            btn.addEventListener('click', () => this.changeDuration(parseInt(btn.dataset.duration)));
        });
        
        this.elements.patternBtns.forEach(btn => {
            btn.addEventListener('click', () => this.changeBreathingPattern(btn.dataset.pattern));
        });
        
        // Completion modal
        this.elements.anotherBtn.addEventListener('click', () => this.startAnotherSession());
        this.elements.doneBtn.addEventListener('click', () => this.exitToMenu());
        
        // Close modals on outside click
        this.elements.settingsModal.addEventListener('click', (e) => {
            if (e.target === this.elements.settingsModal) {
                this.hideSettings();
            }
        });
        
        this.elements.completeModal.addEventListener('click', (e) => {
            if (e.target === this.elements.completeModal) {
                this.exitToMenu();
            }
        });
    }
    
    setupBreathingPattern() {
        if (this.type !== 'breathing') return;
        
        // Calculate total cycle time
        const { inhale, hold, exhale, pause } = this.breathingPattern;
        this.breathingCycleTime = (inhale + hold + exhale + pause) * 1000; // Convert to milliseconds
    }
    
    getSessionTitle() {
        const titles = {
            'breathing': 'Breathing Exercise',
            'guided': 'Guided Meditation',
            'focus-timer': 'Focus Session',
            'visualization': 'Visualization'
        };
        return titles[this.type] || 'Meditation Session';
    }
    
    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
    
    togglePlayPause() {
        if (this.sessionState === 'waiting' || this.sessionState === 'paused') {
            this.startSession();
        } else if (this.sessionState === 'playing') {
            this.pauseSession();
        }
    }
    
    startSession() {
        this.sessionState = 'playing';
        if (!this.startTime) {
            this.startTime = Date.now();
        }
        
        // Update UI
        this.elements.playIcon.classList.add('hidden');
        this.elements.pauseIcon.classList.remove('hidden');
        
        // Start main timer
        this.timer = setInterval(() => {
            this.elapsedTime++;
            this.remainingTime = Math.max(0, this.duration - this.elapsedTime);
            this.updateUI();
            
            if (this.remainingTime <= 0) {
                this.completeSession();
            }
        }, 1000);
        
        // Start breathing animation if breathing exercise
        if (this.type === 'breathing') {
            this.startBreathingAnimation();
        }
        
        // Start background sound
        this.playBackgroundSound();
        
        console.log('Meditation session started');
    }
    
    pauseSession() {
        this.sessionState = 'paused';
        
        // Update UI
        this.elements.playIcon.classList.remove('hidden');
        this.elements.pauseIcon.classList.add('hidden');
        
        // Pause timers
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        
        if (this.breathingTimer) {
            clearInterval(this.breathingTimer);
            this.breathingTimer = null;
        }
        
        // Pause audio
        if (this.audioElement) {
            this.audioElement.pause();
        }
        
        console.log('Meditation session paused');
    }
    
    stopSession() {
        this.sessionState = 'waiting';
        
        // Reset timers
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        
        if (this.breathingTimer) {
            clearInterval(this.breathingTimer);
            this.breathingTimer = null;
        }
        
        // Stop audio
        if (this.audioElement) {
            this.audioElement.pause();
            this.audioElement.currentTime = 0;
        }
        
        // Reset state
        this.elapsedTime = 0;
        this.remainingTime = this.duration;
        this.breathingCycle = 0;
        this.startTime = null;
        
        // Update UI
        this.elements.playIcon.classList.remove('hidden');
        this.elements.pauseIcon.classList.add('hidden');
        this.elements.breathingInstruction.textContent = 'Press Play';
        this.resetBreathingCircle();
        this.updateUI();
        
        console.log('Meditation session stopped');
    }
    
    completeSession() {
        this.sessionState = 'finished';
        this.endTime = Date.now();
        
        // Stop all timers and audio
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        
        if (this.breathingTimer) {
            clearInterval(this.breathingTimer);
            this.breathingTimer = null;
        }
        
        if (this.audioElement) {
            this.audioElement.pause();
        }
        
        // Save session stats
        this.saveSessionStats();
        
        // Show completion modal
        this.elements.completionDuration.textContent = this.formatTime(this.duration);
        if (this.type === 'breathing') {
            this.elements.completionCycleCount.textContent = this.totalCycles;
        }
        
        this.elements.completeModal.classList.remove('hidden');
        this.elements.completeModal.classList.add('flex');
        
        console.log('Meditation session completed');
    }
    
    updateUI() {
        // Update time display
        this.elements.timeDisplay.textContent = this.formatTime(this.remainingTime);
        
        // Update progress bar
        const progress = ((this.duration - this.remainingTime) / this.duration) * 100;
        this.elements.progressBar.style.width = `${progress}%`;
        
        // Update breathing cycle counter
        if (this.type === 'breathing') {
            this.elements.cycleNumber.textContent = this.totalCycles;
        }
    }
    
    startBreathingAnimation() {
        if (this.type !== 'breathing') return;
        
        this.breathingPhase = 'inhale';
        this.updateBreathingUI();
        
        const cycle = () => {
            const phases = ['inhale', 'hold', 'exhale', 'pause'];
            const currentIndex = phases.indexOf(this.breathingPhase);
            const nextPhase = phases[(currentIndex + 1) % phases.length];
            
            // If completing a full cycle
            if (this.breathingPhase === 'pause') {
                this.totalCycles++;
            }
            
            this.breathingPhase = nextPhase;
            this.updateBreathingUI();
        };
        
        // Start the breathing cycle
        this.breathingTimer = setInterval(() => {
            cycle();
        }, this.getPhaseTime() * 1000);
        
        // Initial phase
        setTimeout(() => cycle(), this.getPhaseTime() * 1000);
    }
    
    updateBreathingUI() {
        const { inhale, hold, exhale, pause } = this.breathingPattern;
        const phaseTime = this.getPhaseTime();
        
        switch (this.breathingPhase) {
            case 'inhale':
                this.elements.breathingInstruction.textContent = 'Breathe In';
                this.elements.breathingCircle.style.transform = 'scale(1.3)';
                this.elements.breathingCircle.style.background = 'linear-gradient(135deg, #60a5fa, #3b82f6)';
                break;
            case 'hold':
                this.elements.breathingInstruction.textContent = 'Hold';
                break;
            case 'exhale':
                this.elements.breathingInstruction.textContent = 'Breathe Out';
                this.elements.breathingCircle.style.transform = 'scale(1)';
                this.elements.breathingCircle.style.background = 'linear-gradient(135deg, #a78bfa, #8b5cf6)';
                break;
            case 'pause':
                this.elements.breathingInstruction.textContent = 'Rest';
                break;
        }
        
        this.elements.breathingCircle.style.transition = `all ${phaseTime}s ease-in-out`;
    }
    
    getPhaseTime() {
        return this.breathingPattern[this.breathingPhase];
    }
    
    resetBreathingCircle() {
        this.elements.breathingCircle.style.transform = 'scale(1)';
        this.elements.breathingCircle.style.transition = 'all 0.3s ease';
    }
    
    changeBackgroundSound(soundKey) {
        this.currentSound = soundKey;
        
        // Update UI
        this.elements.soundBtns.forEach(btn => {
            btn.classList.toggle('bg-blue-500', btn.dataset.sound === soundKey);
            btn.classList.toggle('text-white', btn.dataset.sound === soundKey);
        });
        
        // Stop current audio
        if (this.audioElement) {
            this.audioElement.pause();
            this.audioElement = null;
        }
        
        // Start new audio if playing
        if (this.sessionState === 'playing') {
            this.playBackgroundSound();
        }
    }
    
    playBackgroundSound() {
        if (this.currentSound === 'none') return;
        
        const soundUrl = this.backgroundSounds[this.currentSound];
        if (!soundUrl) return;
        
        // Note: In a real implementation, you would have actual audio files
        // For now, we'll just log the audio attempt
        console.log(`Playing background sound: ${this.currentSound}`);
        
        // Create audio element (commented out since we don't have actual audio files)
        /*
        this.audioElement = new Audio(soundUrl);
        this.audioElement.loop = true;
        this.audioElement.volume = 0.3;
        this.audioElement.play().catch(e => {
            console.log('Audio playback failed:', e);
        });
        */
    }
    
    showSettings() {
        this.elements.settingsModal.classList.remove('hidden');
        this.elements.settingsModal.classList.add('flex');
    }
    
    hideSettings() {
        this.elements.settingsModal.classList.add('hidden');
        this.elements.settingsModal.classList.remove('flex');
    }
    
    changeDuration(newDuration) {
        this.duration = newDuration;
        this.remainingTime = newDuration;
        
        // Update UI
        this.container.querySelector('.meditation-duration').textContent = `${this.formatTime(newDuration)} session`;
        this.updateUI();
        
        // Highlight selected duration
        this.elements.durationBtns.forEach(btn => {
            btn.classList.toggle('bg-blue-500', parseInt(btn.dataset.duration) === newDuration);
            btn.classList.toggle('text-white', parseInt(btn.dataset.duration) === newDuration);
        });
        
        this.hideSettings();
    }
    
    changeBreathingPattern(patternString) {
        const [inhale, hold, exhale, pause] = patternString.split(',').map(n => parseInt(n));
        this.breathingPattern = { inhale, hold, exhale, pause };
        
        // Update UI display
        this.container.querySelector('.breathing-pattern').textContent = 
            `Pattern: ${inhale}-${hold}-${exhale}-${pause}`;
        
        // Highlight selected pattern
        this.elements.patternBtns.forEach(btn => {
            btn.classList.toggle('bg-blue-500', btn.dataset.pattern === patternString);
            btn.classList.toggle('text-white', btn.dataset.pattern === patternString);
        });
        
        this.setupBreathingPattern();
        this.hideSettings();
    }
    
    startAnotherSession() {
        this.elements.completeModal.classList.add('hidden');
        this.elements.completeModal.classList.remove('flex');
        
        // Reset for new session
        this.stopSession();
        
        setTimeout(() => {
            this.startSession();
        }, 1000);
    }
    
    saveSessionStats() {
        const sessionData = {
            type: this.type,
            duration: this.duration,
            completedTime: this.elapsedTime,
            breathingCycles: this.totalCycles,
            backgroundSound: this.currentSound,
            startTime: this.startTime,
            endTime: this.endTime,
            sessionId: this.sessionId,
            timestamp: Date.now()
        };
        
        // Save to localStorage
        const meditationHistory = JSON.parse(localStorage.getItem('ss_meditation_history') || '[]');
        meditationHistory.push(sessionData);
        
        // Keep only last 100 sessions
        if (meditationHistory.length > 100) {
            meditationHistory.splice(0, meditationHistory.length - 100);
        }
        
        localStorage.setItem('ss_meditation_history', JSON.stringify(meditationHistory));
        
        // Update streak tracking
        const today = new Date().toDateString();
        const streakData = JSON.parse(localStorage.getItem('ss_meditation_streak') || '{"count": 0, "lastDate": null}');
        
        if (streakData.lastDate !== today) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            
            if (streakData.lastDate === yesterday.toDateString()) {
                streakData.count++;
            } else {
                streakData.count = 1;
            }
            
            streakData.lastDate = today;
            localStorage.setItem('ss_meditation_streak', JSON.stringify(streakData));
        }
        
        console.log('Meditation session saved:', sessionData);
    }
    
    exitToMenu() {
        this.stopSession();
        
        // Navigate back to main menu
        if (window.navigateTo) {
            window.navigateTo('home');
        }
    }
    
    // Public method to start the session
    start() {
        setTimeout(() => {
            console.log('Meditation session ready. Press play to begin.');
        }, 500);
    }
}

// Make MeditationPlayer available globally
if (typeof window !== 'undefined') {
    window.MeditationPlayer = MeditationPlayer;
}