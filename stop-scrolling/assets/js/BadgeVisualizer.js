/**
 * BadgeVisualizer.js
 * Visual components for displaying badges, progress, and achievements
 */

class BadgeVisualizer {
    constructor(badgeSystem) {
        this.badgeSystem = badgeSystem;
        this.container = null;
        
        // Animation settings
        this.animations = {
            badgeEarn: 'bounceIn',
            progressUpdate: 'fadeIn',
            badgeSelect: 'pulse'
        };
        
        // Display modes
        this.displayModes = {
            grid: 'grid',
            list: 'list',
            showcase: 'showcase'
        };
        
        this.currentMode = this.displayModes.grid;
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.createStylesheet();
    }
    
    /**
     * Render complete badge collection
     */
    renderBadgeCollection(container) {
        this.container = container;
        const collection = this.badgeSystem.getBadgeCollection();
        const nextBadges = this.badgeSystem.getNextBadgeProgress();
        
        container.innerHTML = `
            <div class="badge-collection">
                ${this.renderCollectionHeader(collection)}
                ${this.renderProgressSection(nextBadges)}
                ${this.renderBadgeGrid(collection)}
                ${this.renderRecentBadges(collection.recent)}
                ${this.renderBadgeStats(collection)}
            </div>
        `;
        
        this.attachEventListeners();
        this.startProgressAnimations();
    }
    
    /**
     * Render collection header
     */
    renderCollectionHeader(collection) {
        const completionPercentage = this.calculateCompletionPercentage(collection);
        
        return `
            <div class="collection-header">
                <div class="header-content">
                    <div class="collection-title">
                        <h2>🏆 Badge Collection</h2>
                        <p>Track your progress and achievements across all categories</p>
                    </div>
                    <div class="collection-summary">
                        <div class="badge-count">
                            <span class="count-number">${collection.total}</span>
                            <span class="count-label">Badges Earned</span>
                        </div>
                        <div class="completion-ring">
                            <svg width="80" height="80">
                                <circle cx="40" cy="40" r="35" fill="none" stroke="#e5e7eb" stroke-width="6"/>
                                <circle 
                                    cx="40" 
                                    cy="40" 
                                    r="35" 
                                    fill="none" 
                                    stroke="#667eea" 
                                    stroke-width="6"
                                    stroke-linecap="round"
                                    stroke-dasharray="220"
                                    stroke-dashoffset="${220 - (220 * completionPercentage / 100)}"
                                    transform="rotate(-90 40 40)"
                                    class="completion-progress"
                                />
                            </svg>
                            <div class="ring-text">
                                <span class="percentage">${completionPercentage}%</span>
                                <span class="label">Complete</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="view-controls">
                    <button class="view-btn ${this.currentMode === 'grid' ? 'active' : ''}" 
                            onclick="badgeVisualizer.setDisplayMode('grid')">
                        <span class="btn-icon">⊞</span> Grid
                    </button>
                    <button class="view-btn ${this.currentMode === 'list' ? 'active' : ''}" 
                            onclick="badgeVisualizer.setDisplayMode('list')">
                        <span class="btn-icon">☰</span> List
                    </button>
                    <button class="view-btn ${this.currentMode === 'showcase' ? 'active' : ''}" 
                            onclick="badgeVisualizer.setDisplayMode('showcase')">
                        <span class="btn-icon">★</span> Showcase
                    </button>
                </div>
            </div>
        `;
    }
    
    /**
     * Render progress section for next badges
     */
    renderProgressSection(nextBadges) {
        if (nextBadges.length === 0) {
            return `
                <div class="progress-section">
                    <h3>🎉 All Available Badges Earned!</h3>
                    <p>You've mastered all categories. Keep playing to maintain your skills!</p>
                </div>
            `;
        }
        
        const topProgress = nextBadges.slice(0, 3);
        
        return `
            <div class="progress-section">
                <div class="progress-header">
                    <h3>🎯 Next Badges</h3>
                    <p>Your closest achievements</p>
                </div>
                <div class="progress-cards">
                    ${topProgress.map(badge => this.renderProgressCard(badge)).join('')}
                </div>
            </div>
        `;
    }
    
    /**
     * Render individual progress card
     */
    renderProgressCard(badge) {
        const isSpecial = badge.type === 'special';
        
        return `
            <div class="progress-card ${isSpecial ? 'special' : ''}" data-badge="${badge.id || badge.category}">
                <div class="card-header">
                    <div class="badge-preview">
                        <span class="badge-icon">${badge.icon}</span>
                        ${!isSpecial ? `<span class="tier-indicator">${badge.tier}</span>` : ''}
                    </div>
                    <div class="badge-info">
                        <h4>${badge.name}</h4>
                        <p class="badge-description">${badge.description || this.generateDescription(badge)}</p>
                    </div>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${badge.progress}%"></div>
                    <span class="progress-text">${badge.progress}%</span>
                </div>
                ${this.renderProgressDetails(badge)}
            </div>
        `;
    }
    
    /**
     * Render progress details
     */
    renderProgressDetails(badge) {
        if (badge.type === 'special') {
            return `
                <div class="progress-details special">
                    <div class="requirement">
                        <span class="current">${badge.current}</span>
                        <span class="separator">/</span>
                        <span class="required">${badge.required}</span>
                    </div>
                </div>
            `;
        }
        
        const breakdown = badge.progressBreakdown;
        return `
            <div class="progress-details">
                <div class="detail-item">
                    <span class="label">Activities</span>
                    <div class="mini-bar">
                        <div class="mini-fill" style="width: ${breakdown.activities}%"></div>
                    </div>
                    <span class="value">${badge.current.activities}/${badge.requirements.activities}</span>
                </div>
                <div class="detail-item">
                    <span class="label">Accuracy</span>
                    <div class="mini-bar">
                        <div class="mini-fill" style="width: ${breakdown.accuracy}%"></div>
                    </div>
                    <span class="value">${badge.current.accuracy}%/${badge.requirements.accuracy}%</span>
                </div>
                <div class="detail-item">
                    <span class="label">Time</span>
                    <div class="mini-bar">
                        <div class="mini-fill" style="width: ${breakdown.time}%"></div>
                    </div>
                    <span class="value">${badge.requirements.timeRequired}</span>
                </div>
            </div>
        `;
    }
    
    /**
     * Render badge grid
     */
    renderBadgeGrid(collection) {
        return `
            <div class="badge-grid ${this.currentMode}">
                ${this.renderCategoryBadges(collection.byCategory)}
                ${this.renderSpecialBadges(collection.special)}
            </div>
        `;
    }
    
    /**
     * Render category badges
     */
    renderCategoryBadges(byCategory) {
        const categories = this.badgeSystem.categories;
        
        return `
            <div class="category-sections">
                <h3>🎓 Mastery Badges</h3>
                ${Object.keys(categories).map(categoryKey => {
                    const category = categories[categoryKey];
                    const badges = byCategory[categoryKey] || [];
                    return this.renderCategorySection(categoryKey, category, badges);
                }).join('')}
            </div>
        `;
    }
    
    /**
     * Render individual category section
     */
    renderCategorySection(categoryKey, category, badges) {
        const tiers = Object.keys(this.badgeSystem.badgeTiers);
        const progress = this.badgeSystem.getCategoryProgress(categoryKey);
        
        return `
            <div class="category-section" data-category="${categoryKey}">
                <div class="category-header">
                    <div class="category-info">
                        <span class="category-icon">${category.icon}</span>
                        <h4>${category.name}</h4>
                        <p>${category.description}</p>
                    </div>
                    ${progress ? `
                        <div class="category-stats">
                            <div class="stat">
                                <span class="stat-value">${progress.activities}</span>
                                <span class="stat-label">Activities</span>
                            </div>
                            <div class="stat">
                                <span class="stat-value">${progress.accuracy}%</span>
                                <span class="stat-label">Accuracy</span>
                            </div>
                        </div>
                    ` : ''}
                </div>
                <div class="tier-badges">
                    ${tiers.map(tier => {
                        const badge = badges.find(b => b.tier === tier);
                        return this.renderTierBadge(categoryKey, tier, badge);
                    }).join('')}
                </div>
            </div>
        `;
    }
    
    /**
     * Render tier badge
     */
    renderTierBadge(category, tier, badge) {
        const tierInfo = this.badgeSystem.badgeTiers[tier];
        const isEarned = !!badge;
        
        return `
            <div class="tier-badge ${isEarned ? 'earned' : 'locked'}" 
                 data-tier="${tier}" 
                 data-category="${category}"
                 onclick="badgeVisualizer.showBadgeDetails('${category}_${tier}', ${isEarned})">
                <div class="badge-visual">
                    <div class="badge-ring" style="border-color: ${tierInfo.color}">
                        <span class="tier-icon">${tierInfo.icon}</span>
                    </div>
                    ${isEarned ? '<div class="earned-indicator">✓</div>' : ''}
                </div>
                <div class="badge-label">
                    <span class="tier-name">${tierInfo.name}</span>
                    ${isEarned ? `<span class="earned-date">${this.formatDate(badge.earnedDate)}</span>` : ''}
                </div>
            </div>
        `;
    }
    
    /**
     * Render special badges
     */
    renderSpecialBadges(specialBadges) {
        return `
            <div class="special-badges">
                <h3>⭐ Special Achievements</h3>
                <div class="special-grid">
                    ${Object.entries(this.badgeSystem.specialBadges).map(([id, badge]) => {
                        const earned = specialBadges.find(b => b.id === id);
                        return this.renderSpecialBadge(id, badge, earned);
                    }).join('')}
                </div>
            </div>
        `;
    }
    
    /**
     * Render individual special badge
     */
    renderSpecialBadge(id, badge, earned) {
        const isEarned = !!earned;
        
        return `
            <div class="special-badge ${isEarned ? 'earned' : 'locked'}" 
                 data-badge="${id}"
                 onclick="badgeVisualizer.showBadgeDetails('${id}', ${isEarned})">
                <div class="special-visual">
                    <div class="special-ring" style="background: ${isEarned ? badge.color : '#6b7280'}">
                        <span class="special-icon">${badge.icon}</span>
                    </div>
                    ${isEarned ? '<div class="special-glow"></div>' : ''}
                </div>
                <div class="special-info">
                    <h5>${badge.name}</h5>
                    <p>${badge.description}</p>
                    ${isEarned ? `<span class="earned-date">${this.formatDate(earned.earnedDate)}</span>` : ''}
                </div>
            </div>
        `;
    }
    
    /**
     * Render recent badges section
     */
    renderRecentBadges(recentBadges) {
        if (recentBadges.length === 0) return '';
        
        return `
            <div class="recent-badges">
                <h3>🔥 Recent Achievements</h3>
                <div class="recent-list">
                    ${recentBadges.slice(0, 5).map(badge => `
                        <div class="recent-badge" onclick="badgeVisualizer.showBadgeDetails('${badge.id}', true)">
                            <span class="recent-icon">${badge.icon}</span>
                            <div class="recent-info">
                                <span class="recent-name">${badge.name}</span>
                                <span class="recent-date">${this.formatRelativeDate(badge.earnedDate)}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    /**
     * Render badge statistics
     */
    renderBadgeStats(collection) {
        const tierCounts = Object.keys(this.badgeSystem.badgeTiers).map(tier => ({
            tier,
            count: collection.byTier[tier]?.length || 0,
            info: this.badgeSystem.badgeTiers[tier]
        }));
        
        return `
            <div class="badge-stats">
                <h3>📊 Collection Statistics</h3>
                <div class="stats-grid">
                    <div class="stat-card total">
                        <span class="stat-icon">🏆</span>
                        <span class="stat-value">${collection.total}</span>
                        <span class="stat-label">Total Badges</span>
                    </div>
                    ${tierCounts.map(tier => `
                        <div class="stat-card tier">
                            <span class="stat-icon">${tier.info.icon}</span>
                            <span class="stat-value">${tier.count}</span>
                            <span class="stat-label">${tier.info.name}</span>
                        </div>
                    `).join('')}
                    <div class="stat-card special">
                        <span class="stat-icon">⭐</span>
                        <span class="stat-value">${collection.special.length}</span>
                        <span class="stat-label">Special</span>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Show badge details modal
     */
    showBadgeDetails(badgeId, isEarned) {
        const modal = document.createElement('div');
        modal.className = 'badge-detail-modal';
        
        const badgeInfo = this.getBadgeInfo(badgeId, isEarned);
        
        modal.innerHTML = `
            <div class="modal-backdrop" onclick="this.parentElement.remove()"></div>
            <div class="modal-content">
                <div class="badge-showcase">
                    <div class="showcase-badge ${isEarned ? 'earned' : 'locked'}">
                        <div class="showcase-ring" style="border-color: ${badgeInfo.color}">
                            <span class="showcase-icon">${badgeInfo.icon}</span>
                        </div>
                        ${isEarned ? '<div class="showcase-glow"></div>' : ''}
                    </div>
                </div>
                <div class="badge-details">
                    <h2>${badgeInfo.name}</h2>
                    <p class="badge-description">${badgeInfo.description}</p>
                    
                    ${isEarned ? `
                        <div class="earned-info">
                            <div class="earned-status">
                                <span class="status-icon">✅</span>
                                <span class="status-text">Earned on ${this.formatDate(badgeInfo.earnedDate)}</span>
                            </div>
                            ${badgeInfo.stats ? this.renderBadgeStats(badgeInfo.stats) : ''}
                        </div>
                    ` : `
                        <div class="requirements-info">
                            <h3>Requirements</h3>
                            ${this.renderRequirements(badgeInfo.requirements)}
                            ${badgeInfo.progress ? `
                                <div class="progress-info">
                                    <h4>Your Progress</h4>
                                    ${this.renderProgressDetails(badgeInfo.progress)}
                                </div>
                            ` : ''}
                        </div>
                    `}
                </div>
                <div class="modal-actions">
                    <button class="btn-primary" onclick="this.closest('.badge-detail-modal').remove()">
                        Close
                    </button>
                    ${isEarned ? `
                        <button class="btn-secondary" onclick="badgeVisualizer.shareBadge('${badgeId}')">
                            Share Achievement
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Animate in
        setTimeout(() => modal.querySelector('.modal-content').classList.add('animate'), 100);
    }
    
    /**
     * Display mode functions
     */
    setDisplayMode(mode) {
        this.currentMode = mode;
        if (this.container) {
            this.renderBadgeCollection(this.container);
        }
    }
    
    /**
     * Badge earned celebration
     */
    showBadgeEarnedCelebration(badges) {
        badges.forEach((badge, index) => {
            setTimeout(() => {
                this.createBadgeNotification(badge);
            }, index * 500);
        });
    }
    
    createBadgeNotification(badge) {
        const notification = document.createElement('div');
        notification.className = 'badge-notification';
        notification.innerHTML = `
            <div class="notification-badge">
                <span class="notification-icon">${badge.icon}</span>
            </div>
            <div class="notification-content">
                <h4>🎉 Badge Earned!</h4>
                <p><strong>${badge.name}</strong></p>
                <p class="description">${badge.description}</p>
            </div>
            <button class="notification-close" onclick="this.parentElement.remove()">×</button>
        `;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }
    
    /**
     * Utility functions
     */
    calculateCompletionPercentage(collection) {
        const totalPossible = 
            Object.keys(this.badgeSystem.categories).length * 
            Object.keys(this.badgeSystem.badgeTiers).length +
            Object.keys(this.badgeSystem.specialBadges).length;
            
        return Math.round((collection.total / totalPossible) * 100);
    }
    
    generateDescription(badge) {
        if (badge.tier) {
            return `Achieve ${badge.tier} level mastery in ${this.badgeSystem.categories[badge.category].name}`;
        }
        return badge.description || 'Special achievement';
    }
    
    getBadgeInfo(badgeId, isEarned) {
        // This would fetch detailed badge information
        // For now, return mock data
        return {
            name: 'Badge Name',
            description: 'Badge description',
            icon: '🏆',
            color: '#667eea',
            earnedDate: new Date().toISOString(),
            requirements: {},
            stats: {}
        };
    }
    
    renderRequirements(requirements) {
        return '<p>Requirements information</p>';
    }
    
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString();
    }
    
    formatRelativeDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        const days = Math.floor(diff / (24 * 60 * 60 * 1000));
        
        if (days === 0) return 'Today';
        if (days === 1) return 'Yesterday';
        if (days < 7) return `${days} days ago`;
        return this.formatDate(dateString);
    }
    
    shareBadge(badgeId) {
        const badge = this.getBadgeInfo(badgeId, true);
        const text = `🏆 Just earned the "${badge.name}" badge in Stop Scrolling! Join me in breaking social media addiction through cognitive exercises.`;
        
        if (navigator.share) {
            navigator.share({
                title: 'Stop Scrolling Achievement!',
                text,
                url: window.location.href
            });
        } else {
            navigator.clipboard.writeText(text + ' ' + window.location.href);
            this.showNotification('Achievement copied to clipboard!');
        }
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `simple-notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        setTimeout(() => notification.classList.add('show'), 100);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    /**
     * Event binding and animations
     */
    bindEvents() {
        window.addEventListener('badges:badgesEarned', (e) => {
            this.showBadgeEarnedCelebration(e.detail);
        });
        
        window.addEventListener('badges:progressUpdated', (e) => {
            if (this.container) {
                this.renderBadgeCollection(this.container);
            }
        });
    }
    
    attachEventListeners() {
        // Progress card hover effects
        this.container?.querySelectorAll('.progress-card').forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.classList.add('hover');
            });
            card.addEventListener('mouseleave', () => {
                card.classList.remove('hover');
            });
        });
    }
    
    startProgressAnimations() {
        // Animate progress bars
        this.container?.querySelectorAll('.progress-fill').forEach(fill => {
            fill.style.transition = 'width 2s ease-in-out';
        });
        
        // Animate completion ring
        const completionProgress = this.container?.querySelector('.completion-progress');
        if (completionProgress) {
            completionProgress.style.transition = 'stroke-dashoffset 2s ease-in-out';
        }
    }
    
    /**
     * Create CSS styles
     */
    createStylesheet() {
        if (document.getElementById('badge-visualizer-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'badge-visualizer-styles';
        style.textContent = `
            /* Badge Collection Styles */
            .badge-collection {
                max-width: 1200px;
                margin: 0 auto;
                padding: 1rem;
                display: flex;
                flex-direction: column;
                gap: 2rem;
            }
            
            .collection-header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 20px;
                padding: 2rem;
                color: white;
                display: flex;
                justify-content: space-between;
                align-items: center;
                flex-wrap: wrap;
                gap: 1rem;
            }
            
            .header-content {
                display: flex;
                align-items: center;
                gap: 2rem;
                flex: 1;
            }
            
            .collection-summary {
                display: flex;
                align-items: center;
                gap: 1.5rem;
            }
            
            .badge-count {
                text-align: center;
            }
            
            .count-number {
                display: block;
                font-size: 2.5rem;
                font-weight: bold;
                line-height: 1;
            }
            
            .count-label {
                font-size: 0.9rem;
                opacity: 0.9;
            }
            
            .completion-ring {
                position: relative;
            }
            
            .ring-text {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                text-align: center;
            }
            
            .percentage {
                display: block;
                font-size: 1.2rem;
                font-weight: bold;
            }
            
            .label {
                font-size: 0.7rem;
                opacity: 0.9;
            }
            
            .view-controls {
                display: flex;
                gap: 0.5rem;
            }
            
            .view-btn {
                background: rgba(255, 255, 255, 0.2);
                border: 2px solid rgba(255, 255, 255, 0.3);
                color: white;
                padding: 0.5rem 1rem;
                border-radius: 12px;
                cursor: pointer;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            
            .view-btn:hover, .view-btn.active {
                background: rgba(255, 255, 255, 0.3);
                border-color: rgba(255, 255, 255, 0.5);
            }
            
            /* Progress Section */
            .progress-section {
                background: white;
                border-radius: 20px;
                padding: 2rem;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
            }
            
            .progress-cards {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 1.5rem;
                margin-top: 1.5rem;
            }
            
            .progress-card {
                background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
                border-radius: 15px;
                padding: 1.5rem;
                border: 2px solid transparent;
                transition: all 0.3s ease;
                cursor: pointer;
            }
            
            .progress-card:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 25px rgba(102, 126, 234, 0.15);
                border-color: #667eea;
            }
            
            .progress-card.special {
                background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
                color: white;
            }
            
            .card-header {
                display: flex;
                align-items: center;
                gap: 1rem;
                margin-bottom: 1rem;
            }
            
            .badge-preview {
                position: relative;
                display: flex;
                align-items: center;
                justify-content: center;
                width: 60px;
                height: 60px;
                background: rgba(102, 126, 234, 0.1);
                border-radius: 15px;
            }
            
            .badge-icon {
                font-size: 1.8rem;
            }
            
            .tier-indicator {
                position: absolute;
                bottom: -5px;
                right: -5px;
                background: #667eea;
                color: white;
                font-size: 0.7rem;
                padding: 0.2rem 0.5rem;
                border-radius: 8px;
                text-transform: uppercase;
            }
            
            .progress-bar {
                position: relative;
                height: 8px;
                background: rgba(0, 0, 0, 0.1);
                border-radius: 4px;
                margin-bottom: 1rem;
                overflow: hidden;
            }
            
            .progress-fill {
                height: 100%;
                background: linear-gradient(90deg, #667eea, #764ba2);
                border-radius: 4px;
                transition: width 0.3s ease;
            }
            
            .progress-text {
                position: absolute;
                top: 50%;
                right: 8px;
                transform: translateY(-50%);
                font-size: 0.8rem;
                font-weight: bold;
                color: white;
                text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
            }
            
            .progress-details {
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
            }
            
            .detail-item {
                display: flex;
                align-items: center;
                gap: 1rem;
                font-size: 0.9rem;
            }
            
            .label {
                flex: 0 0 60px;
                font-weight: 500;
            }
            
            .mini-bar {
                flex: 1;
                height: 4px;
                background: rgba(0, 0, 0, 0.1);
                border-radius: 2px;
                overflow: hidden;
            }
            
            .mini-fill {
                height: 100%;
                background: #10b981;
                border-radius: 2px;
            }
            
            .value {
                flex: 0 0 auto;
                font-size: 0.8rem;
                color: #6b7280;
            }
            
            /* Badge Grid */
            .badge-grid {
                display: flex;
                flex-direction: column;
                gap: 2rem;
            }
            
            .category-sections, .special-badges {
                background: white;
                border-radius: 20px;
                padding: 2rem;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
            }
            
            .category-section {
                margin-bottom: 2rem;
            }
            
            .category-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1.5rem;
                padding-bottom: 1rem;
                border-bottom: 2px solid #f1f5f9;
            }
            
            .category-info {
                display: flex;
                align-items: center;
                gap: 1rem;
            }
            
            .category-icon {
                font-size: 2rem;
            }
            
            .category-stats {
                display: flex;
                gap: 1rem;
            }
            
            .stat {
                text-align: center;
                padding: 0.5rem 1rem;
                background: #f8fafc;
                border-radius: 10px;
            }
            
            .stat-value {
                display: block;
                font-size: 1.2rem;
                font-weight: bold;
                color: #667eea;
            }
            
            .stat-label {
                font-size: 0.8rem;
                color: #6b7280;
            }
            
            .tier-badges {
                display: flex;
                gap: 1rem;
                flex-wrap: wrap;
            }
            
            .tier-badge {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 0.5rem;
                padding: 1rem;
                background: #f8fafc;
                border-radius: 15px;
                cursor: pointer;
                transition: all 0.3s ease;
                min-width: 100px;
            }
            
            .tier-badge:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
            }
            
            .tier-badge.earned {
                background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
            }
            
            .tier-badge.locked {
                opacity: 0.5;
            }
            
            .badge-visual {
                position: relative;
            }
            
            .badge-ring {
                width: 60px;
                height: 60px;
                border: 3px solid #e5e7eb;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                background: white;
            }
            
            .tier-badge.earned .badge-ring {
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white;
            }
            
            .tier-icon {
                font-size: 1.5rem;
            }
            
            .earned-indicator {
                position: absolute;
                top: -5px;
                right: -5px;
                width: 20px;
                height: 20px;
                background: #10b981;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 0.8rem;
                font-weight: bold;
            }
            
            .badge-label {
                text-align: center;
            }
            
            .tier-name {
                display: block;
                font-weight: 500;
                margin-bottom: 0.25rem;
            }
            
            .earned-date {
                font-size: 0.7rem;
                color: #6b7280;
            }
            
            /* Special Badges */
            .special-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 1.5rem;
            }
            
            .special-badge {
                display: flex;
                align-items: center;
                gap: 1rem;
                padding: 1.5rem;
                background: #f8fafc;
                border-radius: 15px;
                cursor: pointer;
                transition: all 0.3s ease;
                border: 2px solid transparent;
            }
            
            .special-badge:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
            }
            
            .special-badge.earned {
                background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
                border-color: #667eea;
            }
            
            .special-badge.locked {
                opacity: 0.6;
            }
            
            .special-visual {
                position: relative;
                flex-shrink: 0;
            }
            
            .special-ring {
                width: 60px;
                height: 60px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 1.5rem;
            }
            
            .special-glow {
                position: absolute;
                top: -5px;
                left: -5px;
                right: -5px;
                bottom: -5px;
                border-radius: 50%;
                background: radial-gradient(circle, rgba(102, 126, 234, 0.3) 0%, transparent 70%);
                animation: glow 2s ease-in-out infinite alternate;
            }
            
            @keyframes glow {
                0% { opacity: 0.5; }
                100% { opacity: 1; }
            }
            
            .special-info h5 {
                margin-bottom: 0.5rem;
                color: #1f2937;
            }
            
            .special-info p {
                color: #6b7280;
                font-size: 0.9rem;
                margin-bottom: 0.5rem;
            }
            
            /* Recent Badges */
            .recent-badges {
                background: white;
                border-radius: 20px;
                padding: 2rem;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
            }
            
            .recent-list {
                display: flex;
                flex-direction: column;
                gap: 1rem;
            }
            
            .recent-badge {
                display: flex;
                align-items: center;
                gap: 1rem;
                padding: 1rem;
                background: #f8fafc;
                border-radius: 12px;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            .recent-badge:hover {
                background: #e2e8f0;
                transform: translateX(5px);
            }
            
            .recent-icon {
                font-size: 1.5rem;
            }
            
            .recent-info {
                flex: 1;
            }
            
            .recent-name {
                display: block;
                font-weight: 500;
                margin-bottom: 0.25rem;
            }
            
            .recent-date {
                font-size: 0.8rem;
                color: #6b7280;
            }
            
            /* Badge Stats */
            .badge-stats {
                background: white;
                border-radius: 20px;
                padding: 2rem;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
            }
            
            .stats-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                gap: 1rem;
                margin-top: 1rem;
            }
            
            .stat-card {
                text-align: center;
                padding: 1.5rem 1rem;
                background: #f8fafc;
                border-radius: 15px;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 0.5rem;
            }
            
            .stat-card.total {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
            }
            
            .stat-icon {
                font-size: 1.5rem;
            }
            
            .stat-value {
                font-size: 1.8rem;
                font-weight: bold;
            }
            
            .stat-label {
                font-size: 0.8rem;
                opacity: 0.8;
            }
            
            /* Badge Detail Modal */
            .badge-detail-modal {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                z-index: 1000;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 1rem;
            }
            
            .modal-backdrop {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
            }
            
            .modal-content {
                background: white;
                border-radius: 25px;
                padding: 3rem;
                max-width: 500px;
                width: 100%;
                position: relative;
                z-index: 1001;
                text-align: center;
                transform: scale(0.8) translateY(50px);
                opacity: 0;
                transition: all 0.5s ease;
            }
            
            .modal-content.animate {
                transform: scale(1) translateY(0);
                opacity: 1;
            }
            
            .badge-showcase {
                margin-bottom: 2rem;
            }
            
            .showcase-badge {
                position: relative;
                display: inline-block;
            }
            
            .showcase-ring {
                width: 120px;
                height: 120px;
                border: 6px solid #e5e7eb;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                background: white;
                margin: 0 auto;
            }
            
            .showcase-badge.earned .showcase-ring {
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white;
            }
            
            .showcase-icon {
                font-size: 3rem;
            }
            
            .showcase-glow {
                position: absolute;
                top: -10px;
                left: -10px;
                right: -10px;
                bottom: -10px;
                border-radius: 50%;
                background: radial-gradient(circle, rgba(102, 126, 234, 0.3) 0%, transparent 70%);
                animation: glow 2s ease-in-out infinite alternate;
            }
            
            .modal-actions {
                display: flex;
                gap: 1rem;
                margin-top: 2rem;
            }
            
            .btn-primary {
                flex: 1;
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white;
                border: none;
                padding: 1rem 2rem;
                border-radius: 15px;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            .btn-primary:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
            }
            
            .btn-secondary {
                flex: 1;
                background: white;
                color: #6b7280;
                border: 2px solid #e5e7eb;
                padding: 1rem 2rem;
                border-radius: 15px;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            .btn-secondary:hover {
                background: #f8fafc;
                border-color: #d1d5db;
            }
            
            /* Badge Notifications */
            .badge-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: white;
                border-radius: 15px;
                padding: 1.5rem;
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
                display: flex;
                align-items: center;
                gap: 1rem;
                max-width: 350px;
                z-index: 1002;
                transform: translateX(100%);
                transition: transform 0.3s ease;
                border-left: 4px solid #10b981;
            }
            
            .badge-notification.show {
                transform: translateX(0);
            }
            
            .notification-badge {
                width: 50px;
                height: 50px;
                background: linear-gradient(135deg, #667eea, #764ba2);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                flex-shrink: 0;
            }
            
            .notification-icon {
                font-size: 1.5rem;
            }
            
            .notification-content h4 {
                color: #1f2937;
                margin-bottom: 0.5rem;
            }
            
            .notification-content p {
                color: #6b7280;
                margin: 0.25rem 0;
            }
            
            .notification-content .description {
                font-size: 0.8rem;
            }
            
            .notification-close {
                position: absolute;
                top: 10px;
                right: 10px;
                background: none;
                border: none;
                font-size: 1.2rem;
                color: #6b7280;
                cursor: pointer;
                padding: 0.25rem;
            }
            
            /* Simple Notifications */
            .simple-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: white;
                padding: 1rem 1.5rem;
                border-radius: 10px;
                box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
                z-index: 1003;
                transform: translateX(100%);
                transition: transform 0.3s ease;
            }
            
            .simple-notification.show {
                transform: translateX(0);
            }
            
            .simple-notification.success {
                border-left: 4px solid #10b981;
            }
            
            .simple-notification.error {
                border-left: 4px solid #ef4444;
            }
            
            /* Mobile Responsive */
            @media (max-width: 768px) {
                .badge-collection {
                    padding: 0.5rem;
                    gap: 1rem;
                }
                
                .collection-header {
                    flex-direction: column;
                    text-align: center;
                    padding: 1.5rem;
                }
                
                .header-content {
                    flex-direction: column;
                    text-align: center;
                }
                
                .progress-cards {
                    grid-template-columns: 1fr;
                }
                
                .category-header {
                    flex-direction: column;
                    align-items: stretch;
                    gap: 1rem;
                }
                
                .tier-badges {
                    justify-content: center;
                }
                
                .special-grid {
                    grid-template-columns: 1fr;
                }
                
                .stats-grid {
                    grid-template-columns: repeat(2, 1fr);
                }
                
                .modal-content {
                    margin: 1rem;
                    padding: 2rem;
                }
                
                .modal-actions {
                    flex-direction: column;
                }
            }
        `;
        
        document.head.appendChild(style);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BadgeVisualizer;
}