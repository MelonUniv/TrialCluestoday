/**
 * PerformanceAnalytics.js
 * Simple performance analytics and visualization for user insights
 */

class PerformanceAnalytics {
    constructor() {
        this.data = null;
        this.charts = {};
        this.updateInterval = null;
    }
    
    /**
     * Initialize analytics with user data
     */
    async init(userId) {
        try {
            await this.fetchPerformanceData();
            this.startAutoUpdate();
        } catch (error) {
            console.error('Failed to initialize performance analytics:', error);
        }
    }
    
    /**
     * Fetch performance data from API
     */
    async fetchPerformanceData(period = 7) {
        try {
            const response = await fetch(`/stop-scrolling/api/v1/performance/summary?period=${period}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('ss_access_token')}`
                }
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.data = result.data;
                this.emit('dataUpdated', this.data);
                return this.data;
            }
            
            throw new Error(result.message || 'Failed to fetch data');
        } catch (error) {
            console.error('Failed to fetch performance data:', error);
            return null;
        }
    }
    
    /**
     * Render performance dashboard
     */
    renderDashboard(container) {
        if (!this.data) {
            container.innerHTML = '<p>Loading analytics...</p>';
            return;
        }
        
        const { summary, categories, trend, insights } = this.data;
        
        container.innerHTML = `
            <div class="performance-analytics">
                <div class="analytics-header">
                    <h2>Performance Analytics</h2>
                    <div class="period-selector">
                        <button onclick="performanceAnalytics.setPeriod(7)" class="active">7 Days</button>
                        <button onclick="performanceAnalytics.setPeriod(14)">14 Days</button>
                        <button onclick="performanceAnalytics.setPeriod(30)">30 Days</button>
                    </div>
                </div>
                
                <!-- Key Metrics -->
                <div class="metrics-grid">
                    <div class="metric-card">
                        <div class="metric-value">${summary.avgAccuracy}%</div>
                        <div class="metric-label">Average Accuracy</div>
                        <div class="metric-trend ${this.getTrendClass(insights.trend)}">${insights.trend_message || ''}</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${summary.totalActivities}</div>
                        <div class="metric-label">Activities Completed</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${summary.totalScore}</div>
                        <div class="metric-label">Total Points</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${insights.level || 'Beginner'}</div>
                        <div class="metric-label">Performance Level</div>
                    </div>
                </div>
                
                <!-- Performance Trend -->
                <div class="chart-container">
                    <h3>Performance Trend</h3>
                    <div id="trendChart" class="chart"></div>
                </div>
                
                <!-- Category Performance -->
                <div class="category-performance">
                    <h3>Category Performance</h3>
                    <div class="category-list">
                        ${this.renderCategoryList(categories)}
                    </div>
                </div>
                
                <!-- Insights -->
                <div class="insights-panel">
                    <h3>Insights & Recommendations</h3>
                    <div class="insights-content">
                        ${this.renderInsights(insights)}
                    </div>
                </div>
            </div>
        `;
        
        // Render charts
        this.renderTrendChart(trend);
    }
    
    /**
     * Render category performance list
     */
    renderCategoryList(categories) {
        return categories.map(cat => `
            <div class="category-item">
                <div class="category-info">
                    <span class="category-name">${this.formatCategory(cat.name)}</span>
                    <span class="category-count">${cat.count} activities</span>
                </div>
                <div class="category-metrics">
                    <div class="accuracy-bar">
                        <div class="bar-fill" style="width: ${cat.avgAccuracy}%"></div>
                        <span class="bar-text">${cat.avgAccuracy}%</span>
                    </div>
                    <div class="avg-score">${cat.avgScore} pts</div>
                </div>
            </div>
        `).join('');
    }
    
    /**
     * Render insights and recommendations
     */
    renderInsights(insights) {
        const items = [];
        
        if (insights.message) {
            items.push(`<div class="insight-item primary">${insights.message}</div>`);
        }
        
        if (insights.best_category) {
            items.push(`
                <div class="insight-item positive">
                    <strong>Strongest Category:</strong> ${this.formatCategory(insights.best_category)} 
                    (${insights.best_category_accuracy} accuracy)
                </div>
            `);
        }
        
        if (insights.fatigue_warning) {
            items.push(`<div class="insight-item warning">${insights.fatigue_warning}</div>`);
        }
        
        if (insights.fatigue_status) {
            items.push(`<div class="insight-item positive">${insights.fatigue_status}</div>`);
        }
        
        if (insights.trend_message) {
            items.push(`<div class="insight-item info">${insights.trend_message}</div>`);
        }
        
        return items.length > 0 ? items.join('') : '<p>No insights available yet. Complete more activities!</p>';
    }
    
    /**
     * Render simple trend chart (using CSS bars)
     */
    renderTrendChart(trendData) {
        const container = document.getElementById('trendChart');
        if (!container || !trendData.length) return;
        
        const maxAccuracy = Math.max(...trendData.map(d => d.accuracy));
        const minAccuracy = Math.min(...trendData.map(d => d.accuracy));
        const range = maxAccuracy - minAccuracy || 1;
        
        container.innerHTML = `
            <div class="trend-chart">
                <div class="chart-bars">
                    ${trendData.map((day, index) => {
                        const height = ((day.accuracy - minAccuracy) / range) * 100;
                        return `
                            <div class="chart-bar" style="height: ${Math.max(5, height)}%">
                                <div class="bar-value">${day.accuracy}%</div>
                                <div class="bar-date">${this.formatDate(day.date)}</div>
                                <div class="bar-activities">${day.activities} activities</div>
                            </div>
                        `;
                    }).join('')}
                </div>
                <div class="chart-axis">
                    <span>Accuracy over time</span>
                </div>
            </div>
        `;
    }
    
    /**
     * Set time period and refresh data
     */
    async setPeriod(days) {
        // Update active button
        document.querySelectorAll('.period-selector button').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');
        
        // Fetch new data
        await this.fetchPerformanceData(days);
        
        // Re-render if container exists
        const container = document.querySelector('.performance-analytics');
        if (container && container.parentElement) {
            this.renderDashboard(container.parentElement);
        }
    }
    
    /**
     * Get trend CSS class
     */
    getTrendClass(trend) {
        if (trend === 'improving') return 'trend-up';
        if (trend === 'declining') return 'trend-down';
        return 'trend-stable';
    }
    
    /**
     * Format category name
     */
    formatCategory(category) {
        return category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    
    /**
     * Format date
     */
    formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    }
    
    /**
     * Start auto-update
     */
    startAutoUpdate() {
        // Update every 5 minutes
        this.updateInterval = setInterval(() => {
            this.fetchPerformanceData();
        }, 5 * 60 * 1000);
    }
    
    /**
     * Stop auto-update
     */
    stopAutoUpdate() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }
    
    /**
     * Get current statistics
     */
    getStats() {
        return this.data;
    }
    
    /**
     * Emit events
     */
    emit(event, data) {
        window.dispatchEvent(new CustomEvent(`analytics:${event}`, { detail: data }));
    }
    
    /**
     * Destroy analytics
     */
    destroy() {
        this.stopAutoUpdate();
        this.data = null;
        this.charts = {};
    }
}

// Global instance
window.performanceAnalytics = new PerformanceAnalytics();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceAnalytics;
}

// CSS for analytics (inject into page)
const analyticsCSS = `
.performance-analytics {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
}

.analytics-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
}

.period-selector {
    display: flex;
    gap: 0.5rem;
}

.period-selector button {
    padding: 0.5rem 1rem;
    border: 1px solid #ccc;
    background: white;
    cursor: pointer;
    border-radius: 4px;
}

.period-selector button.active {
    background: #667eea;
    color: white;
    border-color: #667eea;
}

.metrics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
}

.metric-card {
    background: white;
    padding: 1.5rem;
    border-radius: 10px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    text-align: center;
}

.metric-value {
    font-size: 2rem;
    font-weight: bold;
    color: #667eea;
    margin-bottom: 0.5rem;
}

.metric-label {
    color: #666;
    font-size: 0.9rem;
    margin-bottom: 0.5rem;
}

.metric-trend {
    font-size: 0.8rem;
    padding: 0.25rem 0.5rem;
    border-radius: 12px;
}

.trend-up { background: #d4edda; color: #155724; }
.trend-down { background: #f8d7da; color: #721c24; }
.trend-stable { background: #e2e3e5; color: #383d41; }

.chart-container, .category-performance, .insights-panel {
    background: white;
    padding: 1.5rem;
    border-radius: 10px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    margin-bottom: 1.5rem;
}

.chart-container h3, .category-performance h3, .insights-panel h3 {
    margin-bottom: 1rem;
    color: #333;
}

.trend-chart {
    width: 100%;
}

.chart-bars {
    display: flex;
    align-items: end;
    height: 200px;
    gap: 0.5rem;
    padding: 1rem 0;
}

.chart-bar {
    flex: 1;
    background: linear-gradient(to top, #667eea, #764ba2);
    border-radius: 4px 4px 0 0;
    position: relative;
    min-height: 20px;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    color: white;
    font-size: 0.7rem;
    text-align: center;
    padding: 0.25rem;
}

.bar-value {
    font-weight: bold;
}

.bar-date {
    margin-top: 0.5rem;
    opacity: 0.9;
}

.bar-activities {
    opacity: 0.8;
    font-size: 0.6rem;
}

.chart-axis {
    text-align: center;
    color: #666;
    font-size: 0.9rem;
    margin-top: 0.5rem;
}

.category-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.category-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: #f8f9fa;
    border-radius: 8px;
}

.category-info {
    flex: 1;
}

.category-name {
    font-weight: 500;
    color: #333;
}

.category-count {
    color: #666;
    font-size: 0.9rem;
    margin-left: 0.5rem;
}

.category-metrics {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.accuracy-bar {
    width: 100px;
    height: 20px;
    background: #e9ecef;
    border-radius: 10px;
    position: relative;
    overflow: hidden;
}

.bar-fill {
    height: 100%;
    background: linear-gradient(90deg, #28a745, #20c997);
    border-radius: 10px;
    transition: width 0.3s ease;
}

.bar-text {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 0.75rem;
    font-weight: bold;
    color: white;
    text-shadow: 0 1px 2px rgba(0,0,0,0.5);
}

.avg-score {
    font-weight: 500;
    color: #667eea;
}

.insights-content {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.insight-item {
    padding: 0.75rem 1rem;
    border-radius: 6px;
    border-left: 4px solid;
}

.insight-item.primary {
    background: #e7f3ff;
    border-color: #667eea;
    color: #1a365d;
}

.insight-item.positive {
    background: #d4edda;
    border-color: #28a745;
    color: #155724;
}

.insight-item.warning {
    background: #fff3cd;
    border-color: #ffc107;
    color: #856404;
}

.insight-item.info {
    background: #cce7ff;
    border-color: #17a2b8;
    color: #0c5460;
}

@media (max-width: 768px) {
    .performance-analytics {
        padding: 1rem;
    }
    
    .analytics-header {
        flex-direction: column;
        gap: 1rem;
        align-items: stretch;
    }
    
    .metrics-grid {
        grid-template-columns: repeat(2, 1fr);
    }
    
    .category-item {
        flex-direction: column;
        align-items: stretch;
        gap: 0.5rem;
    }
    
    .category-metrics {
        justify-content: space-between;
    }
}
`;

// Inject CSS
if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = analyticsCSS;
    document.head.appendChild(style);
}