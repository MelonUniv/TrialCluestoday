/**
 * Memory Game Engine
 * Handles various types of memory games including card matching, sequence memorization, and pattern recognition
 */

class MemoryGame {
    constructor(type, difficulty = 'easy', container = null) {
        this.type = type;
        this.difficulty = difficulty;
        this.container = container;
        this.gameState = 'waiting'; // waiting, playing, paused, finished
        this.score = 0;
        this.moves = 0;
        this.timeLeft = 0;
        this.startTime = null;
        this.endTime = null;
        this.cards = [];
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.totalPairs = 0;
        this.timer = null;
        this.gameData = null;
        
        this.init();
    }
    
    init() {
        this.setupGameData();
        this.createGameInterface();
        this.bindEvents();
    }
    
    setupGameData() {
        const configurations = {
            'card-matching': {
                easy: { gridSize: 4, timeLimit: 300, cardSets: 'animals' },
                medium: { gridSize: 6, timeLimit: 240, cardSets: 'mixed' },
                hard: { gridSize: 8, timeLimit: 180, cardSets: 'symbols' }
            },
            'sequence-memorization': {
                easy: { sequenceLength: 4, timeToShow: 2000, attempts: 3 },
                medium: { sequenceLength: 6, timeToShow: 1500, attempts: 2 },
                hard: { sequenceLength: 8, timeToShow: 1000, attempts: 1 }
            },
            'pattern-recognition': {
                easy: { gridSize: 3, patterns: 3, timeToShow: 3000 },
                medium: { gridSize: 4, patterns: 5, timeToShow: 2000 },
                hard: { gridSize: 5, patterns: 7, timeToShow: 1500 }
            }
        };
        
        this.gameData = configurations[this.type]?.[this.difficulty] || configurations['card-matching']['easy'];
        
        if (this.type === 'card-matching') {
            this.totalPairs = (this.gameData.gridSize * this.gameData.gridSize) / 2;
            this.timeLeft = this.gameData.timeLimit;
        }
    }
    
    createGameInterface() {
        if (!this.container) return;
        
        this.container.innerHTML = `
            <div class="memory-game-container">
                <!-- Game Header -->
                <div class="game-header bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
                    <div class="flex justify-between items-center">
                        <div class="game-info flex space-x-6">
                            <div class="text-center">
                                <div class="text-2xl font-bold text-indigo-600 dark:text-indigo-400" id="score-display">${this.score}</div>
                                <div class="text-xs text-gray-500 dark:text-gray-400">Score</div>
                            </div>
                            <div class="text-center">
                                <div class="text-2xl font-bold text-green-600 dark:text-green-400" id="moves-display">${this.moves}</div>
                                <div class="text-xs text-gray-500 dark:text-gray-400">Moves</div>
                            </div>
                            <div class="text-center">
                                <div class="text-2xl font-bold text-orange-600 dark:text-orange-400" id="time-display">${this.formatTime(this.timeLeft)}</div>
                                <div class="text-xs text-gray-500 dark:text-gray-400">Time</div>
                            </div>
                        </div>
                        <div class="game-controls flex space-x-2">
                            <button id="pause-btn" class="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors" ${this.gameState !== 'playing' ? 'disabled' : ''}>
                                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                                </svg>
                            </button>
                            <button id="restart-btn" class="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors">
                                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
                                </svg>
                            </button>
                            <button id="quit-btn" class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
                                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Game Area -->
                <div class="game-area bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                    <div id="game-content">
                        ${this.renderGameContent()}
                    </div>
                </div>
                
                <!-- Game Over Modal (hidden initially) -->
                <div id="game-over-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div class="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 text-center">
                        <div class="text-6xl mb-4" id="result-emoji">🎉</div>
                        <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4" id="result-title">Game Complete!</h2>
                        <div class="grid grid-cols-3 gap-4 mb-6">
                            <div class="text-center">
                                <div class="text-xl font-bold text-indigo-600 dark:text-indigo-400" id="final-score">${this.score}</div>
                                <div class="text-sm text-gray-500">Score</div>
                            </div>
                            <div class="text-center">
                                <div class="text-xl font-bold text-green-600 dark:text-green-400" id="final-moves">${this.moves}</div>
                                <div class="text-sm text-gray-500">Moves</div>
                            </div>
                            <div class="text-center">
                                <div class="text-xl font-bold text-orange-600 dark:text-orange-400" id="final-time">0:00</div>
                                <div class="text-sm text-gray-500">Time</div>
                            </div>
                        </div>
                        <div class="flex gap-3">
                            <button id="play-again-btn" class="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
                                Play Again
                            </button>
                            <button id="back-to-menu-btn" class="flex-1 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors">
                                Back to Menu
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    renderGameContent() {
        switch (this.type) {
            case 'card-matching':
                return this.renderCardMatchingGame();
            case 'sequence-memorization':
                return this.renderSequenceGame();
            case 'pattern-recognition':
                return this.renderPatternGame();
            default:
                return '<div class="text-center py-8">Game type not supported</div>';
        }
    }
    
    renderCardMatchingGame() {
        const gridSize = this.gameData.gridSize;
        this.generateCardDeck();
        
        return `
            <div class="card-grid grid gap-3" style="grid-template-columns: repeat(${gridSize}, 1fr);">
                ${this.cards.map((card, index) => `
                    <div class="card-wrapper aspect-square">
                        <div class="memory-card w-full h-full rounded-lg shadow-md cursor-pointer transform transition-all duration-300 hover:scale-105" 
                             data-card-id="${index}" 
                             data-card-value="${card.value}">
                            <div class="card-front bg-gradient-to-br from-indigo-500 to-purple-600 text-white w-full h-full rounded-lg flex items-center justify-center">
                                <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM9.5 6L12 8.5 14.5 6 17 8.5 14.5 11 17 13.5 14.5 16 12 13.5 9.5 16 7 13.5 9.5 11 7 8.5 9.5 6z"/>
                                </svg>
                            </div>
                            <div class="card-back bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 w-full h-full rounded-lg flex items-center justify-center text-4xl absolute top-0 left-0 opacity-0 transform rotate-y-180">
                                ${card.symbol}
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    renderSequenceGame() {
        return `
            <div class="sequence-game text-center">
                <div class="sequence-display mb-6">
                    <div id="sequence-grid" class="grid grid-cols-4 gap-2 max-w-md mx-auto mb-4">
                        ${Array.from({length: 16}, (_, i) => `
                            <div class="sequence-cell w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center text-xl font-bold cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                                 data-cell-id="${i}">
                                ${i + 1}
                            </div>
                        `).join('')}
                    </div>
                    <div id="sequence-instruction" class="text-gray-600 dark:text-gray-400 mb-4">
                        Watch the sequence carefully, then repeat it!
                    </div>
                    <button id="start-sequence-btn" class="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors">
                        Start Sequence
                    </button>
                </div>
            </div>
        `;
    }
    
    renderPatternGame() {
        const gridSize = this.gameData.gridSize;
        return `
            <div class="pattern-game text-center">
                <div class="pattern-display mb-6">
                    <div id="pattern-grid" class="grid gap-1 max-w-md mx-auto mb-4" style="grid-template-columns: repeat(${gridSize}, 1fr);">
                        ${Array.from({length: gridSize * gridSize}, (_, i) => `
                            <div class="pattern-cell w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                                 data-cell-id="${i}">
                            </div>
                        `).join('')}
                    </div>
                    <div id="pattern-instruction" class="text-gray-600 dark:text-gray-400 mb-4">
                        Study the pattern, then recreate it!
                    </div>
                    <button id="start-pattern-btn" class="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors">
                        Show Pattern
                    </button>
                </div>
            </div>
        `;
    }
    
    generateCardDeck() {
        const symbols = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🦄', '🦋', '🐝', '🐛', '🦆', '🐧', '🐦', '🕊️', '🦅', '🦉', '🐺', '🐴', '🦓', '🦒', '🐘', '🦏', '🐪'];
        
        // Select random symbols based on total pairs needed
        const selectedSymbols = symbols.slice(0, this.totalPairs);
        
        // Create pairs
        this.cards = [];
        selectedSymbols.forEach(symbol => {
            this.cards.push({ value: symbol, symbol: symbol });
            this.cards.push({ value: symbol, symbol: symbol });
        });
        
        // Shuffle the deck
        this.shuffleArray(this.cards);
    }
    
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
    
    bindEvents() {
        if (!this.container) return;
        
        this.container.addEventListener('click', (e) => {
            // Card matching game
            if (e.target.closest('.memory-card') && this.type === 'card-matching') {
                this.handleCardClick(e.target.closest('.memory-card'));
            }
            
            // Sequence memorization game
            if (e.target.closest('#start-sequence-btn') && this.type === 'sequence-memorization') {
                this.startSequenceGame();
            } else if (e.target.closest('.sequence-cell') && this.type === 'sequence-memorization') {
                this.handleSequenceClick(e.target.closest('.sequence-cell'));
            }
            
            // Pattern recognition game
            if (e.target.closest('#start-pattern-btn') && this.type === 'pattern-recognition') {
                this.startPatternGame();
            } else if (e.target.closest('.pattern-cell') && this.type === 'pattern-recognition') {
                this.handlePatternClick(e.target.closest('.pattern-cell'));
            }
            
            // Control buttons
            if (e.target.closest('#pause-btn')) {
                this.pauseGame();
            } else if (e.target.closest('#restart-btn')) {
                this.restartGame();
            } else if (e.target.closest('#quit-btn')) {
                this.quitGame();
            } else if (e.target.closest('#play-again-btn')) {
                this.restartGame();
                this.hideGameOverModal();
            } else if (e.target.closest('#back-to-menu-btn')) {
                this.quitGame();
            }
        });
    }
    
    handleCardClick(cardElement) {
        if (this.gameState !== 'playing') {
            this.startGame();
        }
        
        const cardId = parseInt(cardElement.dataset.cardId);
        const cardValue = cardElement.dataset.cardValue;
        
        // Prevent clicking already flipped or matched cards
        if (this.flippedCards.includes(cardId) || cardElement.classList.contains('matched')) {
            return;
        }
        
        // Prevent more than 2 cards being flipped
        if (this.flippedCards.length >= 2) {
            return;
        }
        
        this.flipCard(cardElement, cardId);
        this.flippedCards.push(cardId);
        
        if (this.flippedCards.length === 2) {
            this.moves++;
            this.updateUI();
            setTimeout(() => this.checkMatch(), 1000);
        }
    }
    
    flipCard(cardElement, cardId) {
        cardElement.classList.add('flipped');
        const cardBack = cardElement.querySelector('.card-back');
        const cardFront = cardElement.querySelector('.card-front');
        
        cardBack.style.opacity = '1';
        cardBack.style.transform = 'rotateY(0deg)';
        cardFront.style.opacity = '0';
        cardFront.style.transform = 'rotateY(180deg)';
    }
    
    unflipCard(cardElement) {
        cardElement.classList.remove('flipped');
        const cardBack = cardElement.querySelector('.card-back');
        const cardFront = cardElement.querySelector('.card-front');
        
        cardBack.style.opacity = '0';
        cardBack.style.transform = 'rotateY(180deg)';
        cardFront.style.opacity = '1';
        cardFront.style.transform = 'rotateY(0deg)';
    }
    
    checkMatch() {
        const [firstCardId, secondCardId] = this.flippedCards;
        const firstCard = this.container.querySelector(`[data-card-id="${firstCardId}"]`);
        const secondCard = this.container.querySelector(`[data-card-id="${secondCardId}"]`);
        
        const firstValue = firstCard.dataset.cardValue;
        const secondValue = secondCard.dataset.cardValue;
        
        if (firstValue === secondValue) {
            // Match found
            firstCard.classList.add('matched');
            secondCard.classList.add('matched');
            this.matchedPairs++;
            this.score += this.calculateMatchScore();
            
            // Add match animation
            firstCard.style.transform = 'scale(1.1)';
            secondCard.style.transform = 'scale(1.1)';
            setTimeout(() => {
                firstCard.style.transform = 'scale(1)';
                secondCard.style.transform = 'scale(1)';
            }, 300);
            
            if (this.matchedPairs === this.totalPairs) {
                this.endGame(true);
            }
        } else {
            // No match - flip cards back
            this.unflipCard(firstCard);
            this.unflipCard(secondCard);
        }
        
        this.flippedCards = [];
        this.updateUI();
    }
    
    calculateMatchScore() {
        // Base score for a match, with time and move bonuses
        let baseScore = 100;
        let timeBonus = Math.max(0, this.timeLeft * 2);
        let moveBonus = Math.max(0, (50 - this.moves) * 10);
        
        return baseScore + timeBonus + moveBonus;
    }
    
    startGame() {
        if (this.gameState === 'playing') return;
        
        this.gameState = 'playing';
        this.startTime = Date.now();
        
        if (this.type === 'card-matching') {
            this.startTimer();
        }
        
        this.updateUI();
    }
    
    pauseGame() {
        if (this.gameState !== 'playing') return;
        
        this.gameState = 'paused';
        if (this.timer) {
            clearInterval(this.timer);
        }
        
        // Hide cards when paused
        const cards = this.container.querySelectorAll('.memory-card');
        cards.forEach(card => card.style.visibility = 'hidden');
        
        // Show pause overlay
        const gameContent = this.container.querySelector('#game-content');
        gameContent.insertAdjacentHTML('beforeend', `
            <div id="pause-overlay" class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div class="bg-white dark:bg-gray-800 rounded-lg p-6 text-center">
                    <h3 class="text-xl font-bold mb-4">Game Paused</h3>
                    <button id="resume-btn" class="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
                        Resume Game
                    </button>
                </div>
            </div>
        `);
        
        this.container.querySelector('#resume-btn').addEventListener('click', () => this.resumeGame());
    }
    
    resumeGame() {
        this.gameState = 'playing';
        
        // Show cards
        const cards = this.container.querySelectorAll('.memory-card');
        cards.forEach(card => card.style.visibility = 'visible');
        
        // Remove pause overlay
        const pauseOverlay = this.container.querySelector('#pause-overlay');
        if (pauseOverlay) {
            pauseOverlay.remove();
        }
        
        if (this.type === 'card-matching') {
            this.startTimer();
        }
    }
    
    startTimer() {
        if (this.timer) {
            clearInterval(this.timer);
        }
        
        this.timer = setInterval(() => {
            this.timeLeft--;
            this.updateUI();
            
            if (this.timeLeft <= 0) {
                this.endGame(false);
            }
        }, 1000);
    }
    
    endGame(success) {
        this.gameState = 'finished';
        this.endTime = Date.now();
        
        if (this.timer) {
            clearInterval(this.timer);
        }
        
        const playTime = Math.floor((this.endTime - this.startTime) / 1000);
        
        this.showGameOverModal(success, playTime);
        
        // Save game statistics (placeholder for Phase 4)
        this.saveGameStats({
            type: this.type,
            difficulty: this.difficulty,
            success: success,
            score: this.score,
            moves: this.moves,
            playTime: playTime
        });
    }
    
    showGameOverModal(success, playTime) {
        const modal = this.container.querySelector('#game-over-modal');
        const resultEmoji = this.container.querySelector('#result-emoji');
        const resultTitle = this.container.querySelector('#result-title');
        const finalScore = this.container.querySelector('#final-score');
        const finalMoves = this.container.querySelector('#final-moves');
        const finalTime = this.container.querySelector('#final-time');
        
        resultEmoji.textContent = success ? '🎉' : '⏰';
        resultTitle.textContent = success ? 'Congratulations!' : 'Time\'s Up!';
        finalScore.textContent = this.score;
        finalMoves.textContent = this.moves;
        finalTime.textContent = this.formatTime(playTime);
        
        modal.classList.remove('hidden');
    }
    
    hideGameOverModal() {
        const modal = this.container.querySelector('#game-over-modal');
        modal.classList.add('hidden');
    }
    
    restartGame() {
        this.gameState = 'waiting';
        this.score = 0;
        this.moves = 0;
        this.timeLeft = this.gameData.timeLimit || 300;
        this.startTime = null;
        this.endTime = null;
        this.flippedCards = [];
        this.matchedPairs = 0;
        
        if (this.timer) {
            clearInterval(this.timer);
        }
        
        // Re-render the game
        this.setupGameData();
        const gameContent = this.container.querySelector('#game-content');
        gameContent.innerHTML = this.renderGameContent();
        
        this.updateUI();
    }
    
    quitGame() {
        if (this.timer) {
            clearInterval(this.timer);
        }
        
        // Return to content selection or main menu
        if (window.StopScrolling && window.StopScrolling.navigateTo) {
            window.StopScrolling.navigateTo('home');
        }
    }
    
    updateUI() {
        const scoreDisplay = this.container.querySelector('#score-display');
        const movesDisplay = this.container.querySelector('#moves-display');
        const timeDisplay = this.container.querySelector('#time-display');
        
        if (scoreDisplay) scoreDisplay.textContent = this.score;
        if (movesDisplay) movesDisplay.textContent = this.moves;
        if (timeDisplay) timeDisplay.textContent = this.formatTime(this.timeLeft);
        
        // Update button states
        const pauseBtn = this.container.querySelector('#pause-btn');
        if (pauseBtn) {
            pauseBtn.disabled = this.gameState !== 'playing';
        }
    }
    
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    
    saveGameStats(stats) {
        // Placeholder for saving game statistics
        // This will be implemented in Phase 4 with user progress tracking
        console.log('Game Stats:', stats);
        
        // Store in localStorage for now
        const gameHistory = JSON.parse(localStorage.getItem('ss_game_history') || '[]');
        gameHistory.push({
            ...stats,
            timestamp: new Date().toISOString()
        });
        localStorage.setItem('ss_game_history', JSON.stringify(gameHistory));
    }
    
    // Sequence Memorization Game Methods
    startSequenceGame() {
        this.gameState = 'playing';
        this.startTime = Date.now();
        this.currentSequence = [];
        this.userSequence = [];
        this.sequenceStep = 0;
        
        // Generate random sequence
        for (let i = 0; i < this.gameData.sequenceLength; i++) {
            this.currentSequence.push(Math.floor(Math.random() * 16));
        }
        
        this.showSequence();
    }
    
    showSequence() {
        const instruction = this.container.querySelector('#sequence-instruction');
        const startBtn = this.container.querySelector('#start-sequence-btn');
        
        instruction.textContent = 'Watch carefully...';
        startBtn.style.display = 'none';
        
        let currentStep = 0;
        const showNextStep = () => {
            if (currentStep < this.currentSequence.length) {
                const cellId = this.currentSequence[currentStep];
                const cell = this.container.querySelector(`[data-cell-id="${cellId}"]`);
                
                // Highlight the cell
                cell.classList.add('highlight');
                
                setTimeout(() => {
                    cell.classList.remove('highlight');
                    currentStep++;
                    setTimeout(showNextStep, 200);
                }, 500);
            } else {
                // Sequence shown, now let user input
                instruction.textContent = 'Now repeat the sequence by clicking the numbers!';
                this.enableSequenceInput();
            }
        };
        
        setTimeout(showNextStep, 1000);
    }
    
    enableSequenceInput() {
        const cells = this.container.querySelectorAll('.sequence-cell');
        cells.forEach(cell => {
            cell.style.cursor = 'pointer';
            cell.style.opacity = '1';
        });
    }
    
    handleSequenceClick(cellElement) {
        if (this.gameState !== 'playing') return;
        
        const cellId = parseInt(cellElement.dataset.cellId);
        this.userSequence.push(cellId);
        
        // Check if this step is correct
        const currentStep = this.userSequence.length - 1;
        if (this.userSequence[currentStep] === this.currentSequence[currentStep]) {
            // Correct step
            cellElement.classList.add('correct');
            
            if (this.userSequence.length === this.currentSequence.length) {
                // Sequence completed successfully!
                this.score += this.calculateSequenceScore();
                setTimeout(() => {
                    this.endGame(true);
                }, 1000);
            }
        } else {
            // Wrong step
            cellElement.classList.add('incorrect');
            setTimeout(() => {
                this.endGame(false);
            }, 1000);
        }
    }
    
    calculateSequenceScore() {
        const baseScore = 200 * this.gameData.sequenceLength;
        const timeBonus = Math.max(0, (this.endTime - this.startTime) / 1000 * 10);
        return Math.floor(baseScore + timeBonus);
    }
    
    // Pattern Recognition Game Methods
    startPatternGame() {
        this.gameState = 'playing';
        this.startTime = Date.now();
        this.currentPattern = [];
        this.userPattern = [];
        
        // Generate random pattern
        const totalCells = this.gameData.gridSize * this.gameData.gridSize;
        const patternCells = Math.min(this.gameData.patterns, Math.floor(totalCells / 2));
        
        while (this.currentPattern.length < patternCells) {
            const cellId = Math.floor(Math.random() * totalCells);
            if (!this.currentPattern.includes(cellId)) {
                this.currentPattern.push(cellId);
            }
        }
        
        this.showPattern();
    }
    
    showPattern() {
        const instruction = this.container.querySelector('#pattern-instruction');
        const startBtn = this.container.querySelector('#start-pattern-btn');
        
        instruction.textContent = 'Study this pattern...';
        startBtn.style.display = 'none';
        
        // Show pattern
        this.currentPattern.forEach(cellId => {
            const cell = this.container.querySelector(`[data-cell-id="${cellId}"]`);
            cell.classList.add('active');
        });
        
        // Hide pattern after showing time
        setTimeout(() => {
            this.currentPattern.forEach(cellId => {
                const cell = this.container.querySelector(`[data-cell-id="${cellId}"]`);
                cell.classList.remove('active');
            });
            
            instruction.textContent = 'Now recreate the pattern by clicking the cells!';
            this.enablePatternInput();
        }, this.gameData.timeToShow);
    }
    
    enablePatternInput() {
        const cells = this.container.querySelectorAll('.pattern-cell');
        cells.forEach(cell => {
            cell.style.cursor = 'pointer';
            cell.style.opacity = '1';
        });
    }
    
    handlePatternClick(cellElement) {
        if (this.gameState !== 'playing') return;
        
        const cellId = parseInt(cellElement.dataset.cellId);
        
        if (this.userPattern.includes(cellId)) {
            // Remove from user pattern
            this.userPattern = this.userPattern.filter(id => id !== cellId);
            cellElement.classList.remove('user-selected');
        } else {
            // Add to user pattern
            this.userPattern.push(cellId);
            cellElement.classList.add('user-selected');
        }
        
        // Check if pattern is complete and correct
        if (this.userPattern.length === this.currentPattern.length) {
            setTimeout(() => {
                this.checkPatternMatch();
            }, 500);
        }
    }
    
    checkPatternMatch() {
        // Sort both arrays to compare
        const userSorted = [...this.userPattern].sort((a, b) => a - b);
        const patternSorted = [...this.currentPattern].sort((a, b) => a - b);
        
        const isMatch = userSorted.length === patternSorted.length && 
                       userSorted.every((val, index) => val === patternSorted[index]);
        
        if (isMatch) {
            this.score += this.calculatePatternScore();
            this.endGame(true);
        } else {
            this.endGame(false);
        }
    }
    
    calculatePatternScore() {
        const baseScore = 150 * this.gameData.patterns;
        const difficultyBonus = this.gameData.gridSize * 50;
        const timeBonus = Math.max(0, (this.gameData.timeToShow - (this.endTime - this.startTime)) / 100);
        return Math.floor(baseScore + difficultyBonus + timeBonus);
    }
}

// Export for use in main application
if (typeof window !== 'undefined') {
    window.MemoryGame = MemoryGame;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = MemoryGame;
}