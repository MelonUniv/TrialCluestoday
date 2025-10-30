/**
 * Quiz Game Engine for Stop Scrolling App
 * Handles trivia questions with multiple choice, true/false, and timed challenges
 */

class QuizGame {
    constructor(type = 'multiple-choice', difficulty = 'easy', container = null) {
        this.type = type; // multiple-choice, true-false, timed-challenge
        this.difficulty = difficulty; // easy, medium, hard
        this.container = container;
        this.gameState = 'waiting'; // waiting, playing, paused, finished
        
        // Game data
        this.questions = [];
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.correctAnswers = 0;
        this.totalQuestions = 10;
        this.timeLimit = 30; // seconds per question
        this.timeRemaining = this.timeLimit;
        this.timer = null;
        this.startTime = null;
        this.endTime = null;
        
        // User answer tracking
        this.userAnswers = [];
        this.streakCount = 0;
        this.maxStreak = 0;
        
        // UI Elements
        this.elements = {};
        
        this.initialize();
    }
    
    initialize() {
        if (!this.container) {
            console.error('Quiz container not provided');
            return;
        }
        
        this.generateQuestions();
        this.createUI();
        this.bindEvents();
        
        console.log(`Quiz initialized: ${this.type}, difficulty: ${this.difficulty}`);
    }
    
    generateQuestions() {
        // Sample questions - in production, these would come from database
        const questionPools = {
            easy: [
                {
                    question: "What is the capital of France?",
                    answers: ["London", "Berlin", "Paris", "Madrid"],
                    correct: 2,
                    explanation: "Paris is the capital and largest city of France."
                },
                {
                    question: "What is 2 + 2?",
                    answers: ["3", "4", "5", "6"],
                    correct: 1,
                    explanation: "2 + 2 equals 4."
                },
                {
                    question: "Which planet is closest to the Sun?",
                    answers: ["Venus", "Mercury", "Earth", "Mars"],
                    correct: 1,
                    explanation: "Mercury is the planet closest to our Sun."
                },
                {
                    question: "What color do you get when you mix red and blue?",
                    answers: ["Green", "Purple", "Orange", "Yellow"],
                    correct: 1,
                    explanation: "Red and blue combine to make purple."
                },
                {
                    question: "How many days are in a week?",
                    answers: ["5", "6", "7", "8"],
                    correct: 2,
                    explanation: "There are 7 days in a week."
                },
                {
                    question: "What do bees make?",
                    answers: ["Milk", "Honey", "Butter", "Cheese"],
                    correct: 1,
                    explanation: "Bees make honey from flower nectar."
                },
                {
                    question: "Which animal is known as the 'King of the Jungle'?",
                    answers: ["Tiger", "Lion", "Elephant", "Gorilla"],
                    correct: 1,
                    explanation: "Lions are often called the 'King of the Jungle'."
                },
                {
                    question: "What is the largest ocean on Earth?",
                    answers: ["Atlantic", "Indian", "Arctic", "Pacific"],
                    correct: 3,
                    explanation: "The Pacific Ocean is the largest ocean on Earth."
                },
                {
                    question: "How many sides does a triangle have?",
                    answers: ["2", "3", "4", "5"],
                    correct: 1,
                    explanation: "A triangle has 3 sides by definition."
                },
                {
                    question: "What do you call a baby cat?",
                    answers: ["Puppy", "Kitten", "Cub", "Chick"],
                    correct: 1,
                    explanation: "A baby cat is called a kitten."
                }
            ],
            medium: [
                {
                    question: "What is the chemical symbol for gold?",
                    answers: ["Go", "Gd", "Au", "Ag"],
                    correct: 2,
                    explanation: "Au is the chemical symbol for gold, from the Latin 'aurum'."
                },
                {
                    question: "Which planet has the most moons?",
                    answers: ["Jupiter", "Saturn", "Uranus", "Neptune"],
                    correct: 1,
                    explanation: "Saturn has the most confirmed moons with over 80."
                },
                {
                    question: "What is the speed of light in vacuum?",
                    answers: ["299,792,458 m/s", "300,000,000 m/s", "299,792,458 km/s", "186,000 miles/s"],
                    correct: 0,
                    explanation: "The speed of light in vacuum is exactly 299,792,458 meters per second."
                },
                {
                    question: "Who wrote 'Romeo and Juliet'?",
                    answers: ["Charles Dickens", "William Shakespeare", "Jane Austen", "Mark Twain"],
                    correct: 1,
                    explanation: "William Shakespeare wrote the tragic play Romeo and Juliet."
                },
                {
                    question: "What is the smallest prime number?",
                    answers: ["0", "1", "2", "3"],
                    correct: 2,
                    explanation: "2 is the smallest prime number and the only even prime."
                },
                {
                    question: "Which gas makes up about 78% of Earth's atmosphere?",
                    answers: ["Oxygen", "Nitrogen", "Carbon Dioxide", "Argon"],
                    correct: 1,
                    explanation: "Nitrogen makes up about 78% of Earth's atmosphere."
                },
                {
                    question: "What is the currency of Japan?",
                    answers: ["Won", "Yuan", "Yen", "Ringgit"],
                    correct: 2,
                    explanation: "The Yen is the official currency of Japan."
                },
                {
                    question: "How many bones are in an adult human body?",
                    answers: ["206", "196", "216", "186"],
                    correct: 0,
                    explanation: "An adult human body has 206 bones."
                },
                {
                    question: "Which continent is the driest?",
                    answers: ["Africa", "Australia", "Antarctica", "Asia"],
                    correct: 2,
                    explanation: "Antarctica is the driest continent on Earth."
                },
                {
                    question: "What does 'www' stand for?",
                    answers: ["World Wide Web", "World Web Wide", "Web World Wide", "Wide World Web"],
                    correct: 0,
                    explanation: "WWW stands for World Wide Web."
                }
            ],
            hard: [
                {
                    question: "What is the Heisenberg Uncertainty Principle?",
                    answers: [
                        "You cannot know both position and momentum precisely",
                        "Energy cannot be created or destroyed",
                        "Objects at rest stay at rest",
                        "For every action there is an equal reaction"
                    ],
                    correct: 0,
                    explanation: "The Heisenberg Uncertainty Principle states that you cannot simultaneously know both the exact position and momentum of a particle."
                },
                {
                    question: "Who discovered the structure of DNA?",
                    answers: ["Watson & Crick", "Franklin & Wilkins", "Both A & B", "Darwin"],
                    correct: 2,
                    explanation: "The structure of DNA was discovered through the work of Watson, Crick, Franklin, and Wilkins."
                },
                {
                    question: "What is the time complexity of quicksort in the average case?",
                    answers: ["O(n)", "O(n log n)", "O(n²)", "O(log n)"],
                    correct: 1,
                    explanation: "Quicksort has an average time complexity of O(n log n)."
                },
                {
                    question: "Which philosopher wrote 'Critique of Pure Reason'?",
                    answers: ["Hegel", "Kant", "Nietzsche", "Descartes"],
                    correct: 1,
                    explanation: "Immanuel Kant wrote 'Critique of Pure Reason'."
                },
                {
                    question: "What is the half-life of Carbon-14?",
                    answers: ["5,730 years", "1,200 years", "10,000 years", "50,000 years"],
                    correct: 0,
                    explanation: "Carbon-14 has a half-life of approximately 5,730 years."
                }
            ]
        };
        
        const pool = questionPools[this.difficulty] || questionPools.easy;
        
        // Shuffle and select questions
        this.questions = this.shuffleArray([...pool]).slice(0, this.totalQuestions);
    }
    
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
    
    createUI() {
        this.container.innerHTML = `
            <div class="quiz-game h-full flex flex-col">
                <!-- Quiz Header -->
                <div class="quiz-header bg-white dark:bg-gray-800 p-4 border-b border-gray-200 dark:border-gray-700">
                    <div class="flex justify-between items-center">
                        <div class="quiz-progress">
                            <span class="text-sm text-gray-600 dark:text-gray-400">Question</span>
                            <span class="quiz-question-counter font-semibold">1/${this.totalQuestions}</span>
                        </div>
                        <div class="quiz-score">
                            <span class="text-sm text-gray-600 dark:text-gray-400">Score:</span>
                            <span class="quiz-score-value font-semibold text-green-600">0</span>
                        </div>
                        <div class="quiz-timer">
                            <div class="flex items-center space-x-2">
                                <svg class="w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"></path>
                                </svg>
                                <span class="quiz-timer-value font-mono font-semibold">${this.timeLimit}</span>
                            </div>
                            <div class="quiz-timer-bar mt-1">
                                <div class="w-16 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                                    <div class="quiz-timer-progress h-full bg-orange-500 transition-all duration-1000 ease-linear" style="width: 100%"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Question Area -->
                <div class="quiz-content flex-1 p-6">
                    <div class="max-w-2xl mx-auto">
                        <!-- Question -->
                        <div class="quiz-question-container mb-8">
                            <h2 class="quiz-question text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                                Loading question...
                            </h2>
                        </div>
                        
                        <!-- Answers -->
                        <div class="quiz-answers space-y-3">
                            <!-- Answer options will be inserted here -->
                        </div>
                        
                        <!-- Feedback -->
                        <div class="quiz-feedback hidden mt-6 p-4 rounded-lg">
                            <div class="quiz-feedback-content">
                                <div class="quiz-feedback-result font-semibold mb-2"></div>
                                <div class="quiz-feedback-explanation text-sm"></div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Controls -->
                <div class="quiz-controls p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                    <div class="flex justify-between items-center max-w-2xl mx-auto">
                        <button class="quiz-hint-btn bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg transition-colors">
                            💡 Hint
                        </button>
                        <div class="flex space-x-3">
                            <button class="quiz-skip-btn bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors">
                                Skip
                            </button>
                            <button class="quiz-next-btn bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors hidden">
                                Next Question
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Game Over Modal -->
            <div class="quiz-gameover-modal fixed inset-0 bg-black bg-opacity-50 items-center justify-center z-50 hidden">
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
                    <div class="text-center">
                        <div class="quiz-final-score-icon mb-4">
                            <div class="w-16 h-16 bg-green-500 rounded-full mx-auto flex items-center justify-content">
                                <span class="text-2xl text-white">🎉</span>
                            </div>
                        </div>
                        <h3 class="text-xl font-bold mb-2 text-gray-900 dark:text-gray-100">Quiz Complete!</h3>
                        <div class="quiz-final-stats space-y-2 mb-6">
                            <p class="text-lg">Final Score: <span class="quiz-final-score font-semibold text-green-600">0</span></p>
                            <p class="text-sm text-gray-600 dark:text-gray-400">
                                Correct: <span class="quiz-final-correct">0</span>/<span class="quiz-final-total">10</span>
                            </p>
                            <p class="text-sm text-gray-600 dark:text-gray-400">
                                Best Streak: <span class="quiz-final-streak">0</span>
                            </p>
                            <p class="text-sm text-gray-600 dark:text-gray-400">
                                Time: <span class="quiz-final-time">0:00</span>
                            </p>
                        </div>
                        <div class="flex space-x-3 justify-center">
                            <button class="quiz-play-again-btn bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors">
                                Play Again
                            </button>
                            <button class="quiz-menu-btn bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors">
                                Menu
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Store references to UI elements
        this.elements = {
            questionCounter: this.container.querySelector('.quiz-question-counter'),
            scoreValue: this.container.querySelector('.quiz-score-value'),
            timerValue: this.container.querySelector('.quiz-timer-value'),
            timerProgress: this.container.querySelector('.quiz-timer-progress'),
            question: this.container.querySelector('.quiz-question'),
            answersContainer: this.container.querySelector('.quiz-answers'),
            feedback: this.container.querySelector('.quiz-feedback'),
            feedbackResult: this.container.querySelector('.quiz-feedback-result'),
            feedbackExplanation: this.container.querySelector('.quiz-feedback-explanation'),
            hintBtn: this.container.querySelector('.quiz-hint-btn'),
            skipBtn: this.container.querySelector('.quiz-skip-btn'),
            nextBtn: this.container.querySelector('.quiz-next-btn'),
            gameOverModal: this.container.querySelector('.quiz-gameover-modal'),
            finalScore: this.container.querySelector('.quiz-final-score'),
            finalCorrect: this.container.querySelector('.quiz-final-correct'),
            finalTotal: this.container.querySelector('.quiz-final-total'),
            finalStreak: this.container.querySelector('.quiz-final-streak'),
            finalTime: this.container.querySelector('.quiz-final-time'),
            playAgainBtn: this.container.querySelector('.quiz-play-again-btn'),
            menuBtn: this.container.querySelector('.quiz-menu-btn')
        };
    }
    
    bindEvents() {
        // Control buttons
        this.elements.hintBtn.addEventListener('click', () => this.showHint());
        this.elements.skipBtn.addEventListener('click', () => this.skipQuestion());
        this.elements.nextBtn.addEventListener('click', () => this.nextQuestion());
        this.elements.playAgainBtn.addEventListener('click', () => this.restartGame());
        this.elements.menuBtn.addEventListener('click', () => this.exitToMenu());
        
        // Close modal on outside click
        this.elements.gameOverModal.addEventListener('click', (e) => {
            if (e.target === this.elements.gameOverModal) {
                this.exitToMenu();
            }
        });
    }
    
    startGame() {
        this.gameState = 'playing';
        this.startTime = Date.now();
        this.loadCurrentQuestion();
        this.startTimer();
    }
    
    loadCurrentQuestion() {
        const question = this.questions[this.currentQuestionIndex];
        if (!question) return;
        
        // Update UI
        this.elements.questionCounter.textContent = `${this.currentQuestionIndex + 1}/${this.totalQuestions}`;
        this.elements.question.textContent = question.question;
        
        // Create answer options
        this.elements.answersContainer.innerHTML = '';
        question.answers.forEach((answer, index) => {
            const button = document.createElement('button');
            button.className = 'quiz-answer-option w-full text-left p-4 bg-gray-100 dark:bg-gray-700 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-lg transition-colors border border-transparent hover:border-blue-300';
            button.innerHTML = `
                <div class="flex items-center space-x-3">
                    <div class="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-sm font-semibold">
                        ${String.fromCharCode(65 + index)}
                    </div>
                    <span class="flex-1">${answer}</span>
                </div>
            `;
            
            button.addEventListener('click', () => this.selectAnswer(index));
            this.elements.answersContainer.appendChild(button);
        });
        
        // Hide feedback and next button
        this.elements.feedback.classList.add('hidden');
        this.elements.nextBtn.classList.add('hidden');
        this.elements.skipBtn.classList.remove('hidden');
        
        // Reset and start timer
        this.resetTimer();
    }
    
    selectAnswer(answerIndex) {
        if (this.gameState !== 'playing') return;
        
        this.pauseTimer();
        const question = this.questions[this.currentQuestionIndex];
        const isCorrect = answerIndex === question.correct;
        
        // Record answer
        this.userAnswers.push({
            questionIndex: this.currentQuestionIndex,
            selectedAnswer: answerIndex,
            correct: isCorrect,
            timeSpent: this.timeLimit - this.timeRemaining
        });
        
        // Update score and stats
        if (isCorrect) {
            this.correctAnswers++;
            this.streakCount++;
            this.maxStreak = Math.max(this.maxStreak, this.streakCount);
            
            // Calculate score with time bonus
            const timeBonus = Math.max(0, (this.timeRemaining / this.timeLimit) * 50);
            const streakBonus = Math.min(this.streakCount * 10, 50);
            this.score += 100 + Math.round(timeBonus + streakBonus);
        } else {
            this.streakCount = 0;
        }
        
        // Update UI
        this.elements.scoreValue.textContent = this.score;
        
        // Show feedback
        this.showAnswerFeedback(isCorrect, question);
        
        // Highlight selected answer
        const answerButtons = this.elements.answersContainer.querySelectorAll('.quiz-answer-option');
        answerButtons.forEach((btn, index) => {
            btn.disabled = true;
            if (index === answerIndex) {
                btn.classList.add(isCorrect ? 'bg-green-100 border-green-500 dark:bg-green-900' : 'bg-red-100 border-red-500 dark:bg-red-900');
            }
            if (index === question.correct) {
                btn.classList.add('bg-green-100', 'border-green-500', 'dark:bg-green-900');
            }
        });
        
        // Show next button or end game
        if (this.currentQuestionIndex < this.questions.length - 1) {
            this.elements.nextBtn.classList.remove('hidden');
        } else {
            setTimeout(() => this.endGame(), 2000);
        }
        
        this.elements.skipBtn.classList.add('hidden');
    }
    
    showAnswerFeedback(isCorrect, question) {
        this.elements.feedbackResult.textContent = isCorrect ? '✅ Correct!' : '❌ Incorrect';
        this.elements.feedbackResult.className = `quiz-feedback-result font-semibold mb-2 ${isCorrect ? 'text-green-600' : 'text-red-600'}`;
        this.elements.feedbackExplanation.textContent = question.explanation;
        this.elements.feedback.classList.remove('hidden');
        this.elements.feedback.className = `quiz-feedback mt-6 p-4 rounded-lg ${isCorrect ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`;
    }
    
    showHint() {
        const question = this.questions[this.currentQuestionIndex];
        if (!question) return;
        
        // Remove one wrong answer (50/50 style)
        const answerButtons = this.elements.answersContainer.querySelectorAll('.quiz-answer-option');
        const wrongAnswers = [];
        
        answerButtons.forEach((btn, index) => {
            if (index !== question.correct) {
                wrongAnswers.push({ button: btn, index });
            }
        });
        
        if (wrongAnswers.length > 1) {
            const toRemove = wrongAnswers[Math.floor(Math.random() * wrongAnswers.length)];
            toRemove.button.style.opacity = '0.3';
            toRemove.button.disabled = true;
            this.elements.hintBtn.disabled = true;
            this.elements.hintBtn.textContent = 'Hint Used';
        }
    }
    
    skipQuestion() {
        this.streakCount = 0;
        this.userAnswers.push({
            questionIndex: this.currentQuestionIndex,
            selectedAnswer: -1,
            correct: false,
            timeSpent: this.timeLimit - this.timeRemaining,
            skipped: true
        });
        
        this.nextQuestion();
    }
    
    nextQuestion() {
        this.currentQuestionIndex++;
        
        if (this.currentQuestionIndex < this.questions.length) {
            this.loadCurrentQuestion();
            this.startTimer();
        } else {
            this.endGame();
        }
    }
    
    startTimer() {
        this.timeRemaining = this.timeLimit;
        this.updateTimerDisplay();
        
        this.timer = setInterval(() => {
            this.timeRemaining--;
            this.updateTimerDisplay();
            
            if (this.timeRemaining <= 0) {
                this.handleTimeUp();
            }
        }, 1000);
    }
    
    pauseTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }
    
    resetTimer() {
        this.pauseTimer();
        this.timeRemaining = this.timeLimit;
        this.updateTimerDisplay();
        this.startTimer();
    }
    
    updateTimerDisplay() {
        this.elements.timerValue.textContent = this.timeRemaining;
        const progress = (this.timeRemaining / this.timeLimit) * 100;
        this.elements.timerProgress.style.width = `${progress}%`;
        
        // Change color based on time remaining
        if (this.timeRemaining <= 5) {
            this.elements.timerProgress.className = 'quiz-timer-progress h-full bg-red-500 transition-all duration-1000 ease-linear';
        } else if (this.timeRemaining <= 10) {
            this.elements.timerProgress.className = 'quiz-timer-progress h-full bg-yellow-500 transition-all duration-1000 ease-linear';
        } else {
            this.elements.timerProgress.className = 'quiz-timer-progress h-full bg-orange-500 transition-all duration-1000 ease-linear';
        }
    }
    
    handleTimeUp() {
        this.pauseTimer();
        this.streakCount = 0;
        
        this.userAnswers.push({
            questionIndex: this.currentQuestionIndex,
            selectedAnswer: -1,
            correct: false,
            timeSpent: this.timeLimit,
            timedOut: true
        });
        
        const question = this.questions[this.currentQuestionIndex];
        this.showAnswerFeedback(false, question);
        
        // Highlight correct answer
        const answerButtons = this.elements.answersContainer.querySelectorAll('.quiz-answer-option');
        answerButtons.forEach((btn, index) => {
            btn.disabled = true;
            if (index === question.correct) {
                btn.classList.add('bg-green-100', 'border-green-500', 'dark:bg-green-900');
            }
        });
        
        // Show next button or end game
        if (this.currentQuestionIndex < this.questions.length - 1) {
            this.elements.nextBtn.classList.remove('hidden');
        } else {
            setTimeout(() => this.endGame(), 2000);
        }
        
        this.elements.skipBtn.classList.add('hidden');
    }
    
    endGame() {
        this.gameState = 'finished';
        this.endTime = Date.now();
        this.pauseTimer();
        
        const totalTime = Math.round((this.endTime - this.startTime) / 1000);
        const minutes = Math.floor(totalTime / 60);
        const seconds = totalTime % 60;
        const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        // Update final stats
        this.elements.finalScore.textContent = this.score;
        this.elements.finalCorrect.textContent = this.correctAnswers;
        this.elements.finalTotal.textContent = this.questions.length;
        this.elements.finalStreak.textContent = this.maxStreak;
        this.elements.finalTime.textContent = timeString;
        
        // Show appropriate icon based on performance
        const percentage = (this.correctAnswers / this.questions.length) * 100;
        const icon = this.container.querySelector('.quiz-final-score-icon span');
        if (percentage >= 80) {
            icon.textContent = '🏆';
        } else if (percentage >= 60) {
            icon.textContent = '🎉';
        } else if (percentage >= 40) {
            icon.textContent = '👍';
        } else {
            icon.textContent = '📚';
        }
        
        // Save statistics
        this.saveGameStats();
        
        // Show modal
        this.elements.gameOverModal.classList.remove('hidden');
        this.elements.gameOverModal.classList.add('flex');
    }
    
    saveGameStats() {
        const stats = {
            game: 'quiz',
            type: this.type,
            difficulty: this.difficulty,
            score: this.score,
            correctAnswers: this.correctAnswers,
            totalQuestions: this.questions.length,
            maxStreak: this.maxStreak,
            completionTime: this.endTime - this.startTime,
            timestamp: Date.now()
        };
        
        // Save to localStorage
        const gameHistory = JSON.parse(localStorage.getItem('ss_quiz_history') || '[]');
        gameHistory.push(stats);
        
        // Keep only last 50 games
        if (gameHistory.length > 50) {
            gameHistory.splice(0, gameHistory.length - 50);
        }
        
        localStorage.setItem('ss_quiz_history', JSON.stringify(gameHistory));
        
        // Update high scores
        const highScores = JSON.parse(localStorage.getItem('ss_quiz_highscores') || '{}');
        const key = `${this.type}-${this.difficulty}`;
        
        if (!highScores[key] || this.score > highScores[key].score) {
            highScores[key] = {
                score: this.score,
                correctAnswers: this.correctAnswers,
                totalQuestions: this.questions.length,
                maxStreak: this.maxStreak,
                date: new Date().toISOString()
            };
            localStorage.setItem('ss_quiz_highscores', JSON.stringify(highScores));
        }
        
        console.log('Quiz stats saved:', stats);
    }
    
    restartGame() {
        // Reset game state
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.correctAnswers = 0;
        this.streakCount = 0;
        this.maxStreak = 0;
        this.userAnswers = [];
        this.gameState = 'waiting';
        
        // Generate new questions and restart
        this.generateQuestions();
        this.elements.scoreValue.textContent = '0';
        this.elements.gameOverModal.classList.add('hidden');
        this.elements.gameOverModal.classList.remove('flex');
        
        setTimeout(() => {
            this.startGame();
        }, 500);
    }
    
    exitToMenu() {
        this.pauseTimer();
        this.gameState = 'finished';
        
        // Navigate back to main menu
        if (window.navigateTo) {
            window.navigateTo('home');
        }
    }
    
    // Public method to start the game
    start() {
        setTimeout(() => {
            this.startGame();
        }, 500);
    }
}

// Make QuizGame available globally
if (typeof window !== 'undefined') {
    window.QuizGame = QuizGame;
}