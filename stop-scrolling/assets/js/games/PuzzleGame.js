/**
 * Puzzle Game Engine
 * Handles various types of puzzle games including sliding puzzles, word search, and logic puzzles
 */

class PuzzleGame {
    constructor(type, difficulty = 'easy', container = null) {
        this.type = type;
        this.difficulty = difficulty;
        this.container = container;
        this.gameState = 'waiting'; // waiting, playing, paused, finished
        this.score = 0;
        this.moves = 0;
        this.hintsUsed = 0;
        this.startTime = null;
        this.endTime = null;
        this.puzzleData = null;
        this.userSolution = null;
        this.timer = null;
        
        this.init();
    }
    
    init() {
        this.setupPuzzleData();
        this.createGameInterface();
        this.bindEvents();
    }
    
    setupPuzzleData() {
        const configurations = {
            'sliding-puzzle': {
                easy: { gridSize: 3, imageType: 'numbers' },
                medium: { gridSize: 4, imageType: 'pattern' },
                hard: { gridSize: 5, imageType: 'image' }
            },
            'word-search': {
                easy: { gridSize: 10, wordCount: 5, directions: 2 },
                medium: { gridSize: 12, wordCount: 7, directions: 4 },
                hard: { gridSize: 15, wordCount: 10, directions: 8 }
            },
            'logic-puzzle': {
                easy: { gridSize: 4, constraints: 3, complexity: 1 },
                medium: { gridSize: 6, constraints: 5, complexity: 2 },
                hard: { gridSize: 8, constraints: 8, complexity: 3 }
            }
        };
        
        this.puzzleData = configurations[this.type]?.[this.difficulty] || configurations['sliding-puzzle']['easy'];
    }
    
    createGameInterface() {
        if (!this.container) return;
        
        this.container.innerHTML = `
            <div class="puzzle-game-container">
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
                                <div class="text-2xl font-bold text-orange-600 dark:text-orange-400" id="hints-display">${this.hintsUsed}</div>
                                <div class="text-xs text-gray-500 dark:text-gray-400">Hints Used</div>
                            </div>
                            <div class="text-center">
                                <div class="text-2xl font-bold text-blue-600 dark:text-blue-400" id="time-display">0:00</div>
                                <div class="text-xs text-gray-500 dark:text-gray-400">Time</div>
                            </div>
                        </div>
                        <div class="game-controls flex space-x-2">
                            <button id="hint-btn" class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
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
                        ${this.renderPuzzleContent()}
                    </div>
                </div>
                
                <!-- Game Over Modal (hidden initially) -->
                <div id="game-over-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div class="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 text-center">
                        <div class="text-6xl mb-4" id="result-emoji">🎉</div>
                        <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4" id="result-title">Puzzle Solved!</h2>
                        <div class="grid grid-cols-2 gap-4 mb-6">
                            <div class="text-center">
                                <div class="text-xl font-bold text-indigo-600 dark:text-indigo-400" id="final-score">${this.score}</div>
                                <div class="text-sm text-gray-500">Score</div>
                            </div>
                            <div class="text-center">
                                <div class="text-xl font-bold text-green-600 dark:text-green-400" id="final-moves">${this.moves}</div>
                                <div class="text-sm text-gray-500">Moves</div>
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
    
    renderPuzzleContent() {
        switch (this.type) {
            case 'sliding-puzzle':
                return this.renderSlidingPuzzle();
            case 'word-search':
                return this.renderWordSearch();
            case 'logic-puzzle':
                return this.renderLogicPuzzle();
            default:
                return '<div class="text-center py-8">Puzzle type not supported</div>';
        }
    }
    
    renderSlidingPuzzle() {
        const gridSize = this.puzzleData.gridSize;
        this.generateSlidingPuzzle();
        
        return `
            <div class="sliding-puzzle text-center">
                <div class="mb-4">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Sliding Puzzle</h3>
                    <p class="text-gray-600 dark:text-gray-400">Arrange the tiles in order from 1 to ${gridSize * gridSize - 1}</p>
                </div>
                
                <div class="puzzle-grid grid gap-2 max-w-md mx-auto mb-4" style="grid-template-columns: repeat(${gridSize}, 1fr);">
                    ${this.tiles.map((tile, index) => `
                        <div class="puzzle-tile ${tile === 0 ? 'empty' : ''} w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-lg flex items-center justify-center font-bold text-xl cursor-pointer hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
                             data-tile-index="${index}" 
                             data-tile-value="${tile}"
                             ${tile === 0 ? 'style="opacity: 0; cursor: default;"' : ''}>
                            ${tile === 0 ? '' : tile}
                        </div>
                    `).join('')}
                </div>
                
                <div class="flex gap-2 justify-center">
                    <button id="shuffle-btn" class="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors">
                        Shuffle
                    </button>
                    <button id="solve-btn" class="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors">
                        Show Solution
                    </button>
                </div>
            </div>
        `;
    }
    
    renderWordSearch() {
        this.generateWordSearch();
        
        return `
            <div class="word-search text-center">
                <div class="mb-4">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Word Search</h3>
                    <p class="text-gray-600 dark:text-gray-400">Find all the hidden words in the grid</p>
                </div>
                
                <div class="flex flex-col gap-6 items-start justify-center">
                    <!-- Word Grid -->
                    <div class="word-grid grid gap-1" style="grid-template-columns: repeat(${this.puzzleData.gridSize}, 1fr); font-family: monospace;">
                        ${this.grid.map((letter, index) => `
                            <div class="word-cell w-8 h-8 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 flex items-center justify-center text-sm font-bold cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
                                 data-cell-index="${index}">
                                ${letter}
                            </div>
                        `).join('')}
                    </div>
                    
                    <!-- Word List -->
                    <div class="word-list bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <h4 class="font-semibold text-gray-900 dark:text-white mb-3">Find these words:</h4>
                        <div class="space-y-2">
                            ${this.wordsToFind.map(word => `
                                <div class="word-item flex items-center space-x-2" data-word="${word}">
                                    <span class="word-checkbox w-4 h-4 border-2 border-gray-400 rounded"></span>
                                    <span class="word-text text-gray-700 dark:text-gray-300">${word.toUpperCase()}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    renderLogicPuzzle() {
        return `
            <div class="logic-puzzle text-center">
                <div class="mb-4">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Logic Puzzle</h3>
                    <p class="text-gray-600 dark:text-gray-400">Complete logic puzzles will be available in future updates!</p>
                </div>
                
                <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                    <div class="text-6xl mb-4">🧩</div>
                    <h4 class="font-semibold text-blue-800 dark:text-blue-200 mb-2">Coming Soon!</h4>
                    <p class="text-blue-700 dark:text-blue-300 text-sm">
                        Logic puzzles, Sudoku variants, and constraint-based puzzles are being developed for the next update.
                    </p>
                </div>
            </div>
        `;
    }
    
    generateSlidingPuzzle() {
        const gridSize = this.puzzleData.gridSize;
        const totalTiles = gridSize * gridSize;
        
        // Create solved state (1, 2, 3, ..., n-1, 0)
        this.tiles = Array.from({length: totalTiles - 1}, (_, i) => i + 1);
        this.tiles.push(0); // Empty space at the end
        
        // Shuffle the puzzle
        this.shufflePuzzle();
    }
    
    shufflePuzzle() {
        // Perform random valid moves to ensure solvability
        for (let i = 0; i < 1000; i++) {
            const emptyIndex = this.tiles.indexOf(0);
            const validMoves = this.getValidMoves(emptyIndex);
            if (validMoves.length > 0) {
                const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
                this.swapTiles(emptyIndex, randomMove);
            }
        }
    }
    
    getValidMoves(emptyIndex) {
        const gridSize = this.puzzleData.gridSize;
        const row = Math.floor(emptyIndex / gridSize);
        const col = emptyIndex % gridSize;
        const validMoves = [];
        
        // Check all four directions
        if (row > 0) validMoves.push((row - 1) * gridSize + col); // Up
        if (row < gridSize - 1) validMoves.push((row + 1) * gridSize + col); // Down
        if (col > 0) validMoves.push(row * gridSize + col - 1); // Left
        if (col < gridSize - 1) validMoves.push(row * gridSize + col + 1); // Right
        
        return validMoves;
    }
    
    swapTiles(index1, index2) {
        [this.tiles[index1], this.tiles[index2]] = [this.tiles[index2], this.tiles[index1]];
    }
    
    generateWordSearch() {
        const gridSize = this.puzzleData.gridSize;
        const wordCount = this.puzzleData.wordCount;
        
        // Simple word list for word search
        const allWords = [
            'FOCUS', 'MIND', 'CALM', 'PEACE', 'BRAIN', 'THINK', 'SOLVE', 'LEARN',
            'SMART', 'LOGIC', 'MEMORY', 'PUZZLE', 'GAME', 'FUN', 'SKILL', 'GROW',
            'SHARP', 'QUICK', 'WISE', 'CLEAR', 'BOOST', 'POWER', 'ENERGY', 'FLOW'
        ];
        
        // Select random words
        this.wordsToFind = [];
        while (this.wordsToFind.length < wordCount && this.wordsToFind.length < allWords.length) {
            const word = allWords[Math.floor(Math.random() * allWords.length)];
            if (!this.wordsToFind.includes(word)) {
                this.wordsToFind.push(word);
            }
        }
        
        // Create empty grid
        this.grid = Array(gridSize * gridSize).fill('');
        this.wordPositions = [];
        
        // Place words in grid
        this.wordsToFind.forEach(word => {
            this.placeWordInGrid(word);
        });
        
        // Fill empty cells with random letters
        for (let i = 0; i < this.grid.length; i++) {
            if (this.grid[i] === '') {
                this.grid[i] = String.fromCharCode(65 + Math.floor(Math.random() * 26));
            }
        }
        
        this.foundWords = [];
    }
    
    placeWordInGrid(word) {
        const gridSize = this.puzzleData.gridSize;
        const directions = [
            [0, 1],   // Horizontal
            [1, 0],   // Vertical
            [1, 1],   // Diagonal down-right
            [-1, 1]   // Diagonal up-right
        ];
        
        let placed = false;
        let attempts = 0;
        
        while (!placed && attempts < 100) {
            const direction = directions[Math.floor(Math.random() * Math.min(directions.length, this.puzzleData.directions))];
            const startRow = Math.floor(Math.random() * gridSize);
            const startCol = Math.floor(Math.random() * gridSize);
            
            if (this.canPlaceWord(word, startRow, startCol, direction)) {
                this.placeWord(word, startRow, startCol, direction);
                placed = true;
            }
            attempts++;
        }
    }
    
    canPlaceWord(word, startRow, startCol, direction) {
        const gridSize = this.puzzleData.gridSize;
        
        for (let i = 0; i < word.length; i++) {
            const row = startRow + direction[0] * i;
            const col = startCol + direction[1] * i;
            
            if (row < 0 || row >= gridSize || col < 0 || col >= gridSize) {
                return false;
            }
            
            const index = row * gridSize + col;
            if (this.grid[index] !== '' && this.grid[index] !== word[i]) {
                return false;
            }
        }
        return true;
    }
    
    placeWord(word, startRow, startCol, direction) {
        const gridSize = this.puzzleData.gridSize;
        const positions = [];
        
        for (let i = 0; i < word.length; i++) {
            const row = startRow + direction[0] * i;
            const col = startCol + direction[1] * i;
            const index = row * gridSize + col;
            
            this.grid[index] = word[i];
            positions.push(index);
        }
        
        this.wordPositions.push({
            word: word,
            positions: positions
        });
    }
    
    bindEvents() {
        if (!this.container) return;
        
        this.container.addEventListener('click', (e) => {
            // Sliding puzzle events
            if (e.target.closest('.puzzle-tile') && this.type === 'sliding-puzzle') {
                this.handleTileClick(e.target.closest('.puzzle-tile'));
            } else if (e.target.closest('#shuffle-btn')) {
                this.shufflePuzzle();
                this.updatePuzzleDisplay();
            }
            
            // Word search events
            if (e.target.closest('.word-cell') && this.type === 'word-search') {
                this.handleCellClick(e.target.closest('.word-cell'));
            }
            
            // Control buttons
            if (e.target.closest('#hint-btn')) {
                this.provideHint();
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
    
    handleTileClick(tileElement) {
        if (this.gameState !== 'playing') {
            this.startGame();
        }
        
        const tileIndex = parseInt(tileElement.dataset.tileIndex);
        const tileValue = parseInt(tileElement.dataset.tileValue);
        
        if (tileValue === 0) return; // Can't click empty tile
        
        const emptyIndex = this.tiles.indexOf(0);
        const validMoves = this.getValidMoves(emptyIndex);
        
        if (validMoves.includes(tileIndex)) {
            this.swapTiles(tileIndex, emptyIndex);
            this.moves++;
            this.updatePuzzleDisplay();
            this.updateUI();
            
            if (this.isPuzzleSolved()) {
                this.score += this.calculatePuzzleScore();
                this.endGame(true);
            }
        }
    }
    
    handleCellClick(cellElement) {
        if (this.gameState !== 'playing') {
            this.startGame();
        }
        
        // Simple word search interaction (placeholder)
        cellElement.classList.toggle('selected');
    }
    
    isPuzzleSolved() {
        for (let i = 0; i < this.tiles.length - 1; i++) {
            if (this.tiles[i] !== i + 1) {
                return false;
            }
        }
        return this.tiles[this.tiles.length - 1] === 0;
    }
    
    calculatePuzzleScore() {
        const baseScore = 1000;
        const moveBonus = Math.max(0, (200 - this.moves) * 5);
        const hintPenalty = this.hintsUsed * 100;
        return Math.max(100, baseScore + moveBonus - hintPenalty);
    }
    
    updatePuzzleDisplay() {
        if (this.type === 'sliding-puzzle') {
            const tiles = this.container.querySelectorAll('.puzzle-tile');
            tiles.forEach((tile, index) => {
                const value = this.tiles[index];
                tile.dataset.tileValue = value;
                tile.textContent = value === 0 ? '' : value;
                tile.style.opacity = value === 0 ? '0' : '1';
                tile.style.cursor = value === 0 ? 'default' : 'pointer';
            });
        }
    }
    
    provideHint() {
        this.hintsUsed++;
        this.updateUI();
        
        if (this.type === 'sliding-puzzle') {
            // Simple hint: highlight a tile that can be moved towards correct position
            this.showToast('Hint: Try to get number 1 in the top-left corner first!', 'info');
        } else if (this.type === 'word-search') {
            // Highlight the first letter of an unfound word
            this.showToast('Hint: Look for words horizontally, vertically, and diagonally!', 'info');
        }
        
        this.score = Math.max(0, this.score - 50); // Penalty for hint
    }
    
    startGame() {
        if (this.gameState === 'playing') return;
        
        this.gameState = 'playing';
        this.startTime = Date.now();
        this.startTimer();
        this.updateUI();
    }
    
    startTimer() {
        if (this.timer) {
            clearInterval(this.timer);
        }
        
        this.timer = setInterval(() => {
            this.updateUI();
        }, 1000);
    }
    
    endGame(success) {
        this.gameState = 'finished';
        this.endTime = Date.now();
        
        if (this.timer) {
            clearInterval(this.timer);
        }
        
        this.showGameOverModal(success);
        
        // Save game statistics
        this.saveGameStats({
            type: this.type,
            difficulty: this.difficulty,
            success: success,
            score: this.score,
            moves: this.moves,
            hintsUsed: this.hintsUsed,
            playTime: Math.floor((this.endTime - this.startTime) / 1000)
        });
    }
    
    showGameOverModal(success) {
        const modal = this.container.querySelector('#game-over-modal');
        const resultEmoji = this.container.querySelector('#result-emoji');
        const resultTitle = this.container.querySelector('#result-title');
        const finalScore = this.container.querySelector('#final-score');
        const finalMoves = this.container.querySelector('#final-moves');
        
        resultEmoji.textContent = success ? '🎉' : '😅';
        resultTitle.textContent = success ? 'Puzzle Solved!' : 'Keep Trying!';
        finalScore.textContent = this.score;
        finalMoves.textContent = this.moves;
        
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
        this.hintsUsed = 0;
        this.startTime = null;
        this.endTime = null;
        
        if (this.timer) {
            clearInterval(this.timer);
        }
        
        // Re-generate puzzle
        this.setupPuzzleData();
        const gameContent = this.container.querySelector('#game-content');
        gameContent.innerHTML = this.renderPuzzleContent();
        
        this.updateUI();
    }
    
    quitGame() {
        if (this.timer) {
            clearInterval(this.timer);
        }
        
        // Return to main menu
        if (window.StopScrolling && window.StopScrolling.navigateTo) {
            window.StopScrolling.navigateTo('home');
        }
    }
    
    updateUI() {
        const scoreDisplay = this.container.querySelector('#score-display');
        const movesDisplay = this.container.querySelector('#moves-display');
        const hintsDisplay = this.container.querySelector('#hints-display');
        const timeDisplay = this.container.querySelector('#time-display');
        
        if (scoreDisplay) scoreDisplay.textContent = this.score;
        if (movesDisplay) movesDisplay.textContent = this.moves;
        if (hintsDisplay) hintsDisplay.textContent = this.hintsUsed;
        
        if (timeDisplay && this.startTime) {
            const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
            const mins = Math.floor(elapsed / 60);
            const secs = elapsed % 60;
            timeDisplay.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
        }
    }
    
    showToast(message, type) {
        if (window.StopScrolling && window.StopScrolling.showToast) {
            window.StopScrolling.showToast(message, type);
        }
    }
    
    saveGameStats(stats) {
        // Store in localStorage for now
        const gameHistory = JSON.parse(localStorage.getItem('ss_game_history') || '[]');
        gameHistory.push({
            ...stats,
            timestamp: new Date().toISOString()
        });
        localStorage.setItem('ss_game_history', JSON.stringify(gameHistory));
    }
}

// Export for use in main application
if (typeof window !== 'undefined') {
    window.PuzzleGame = PuzzleGame;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = PuzzleGame;
}