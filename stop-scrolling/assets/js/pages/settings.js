/**
 * Settings Page Component
 * Handles user settings and flow preferences
 */

class SettingsManager {
    constructor() {
        this.currentSettings = null;
        this.unsavedChanges = false;
    }

    /**
     * Render the settings page
     */
    render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="min-h-screen bg-gray-50">
                <!-- Navigation -->
                <nav class="bg-indigo-600 text-white p-4 shadow-lg">
                    <div class="container mx-auto flex justify-between items-center">
                        <div class="flex items-center gap-4">
                            <button onclick="navigateTo('dashboard')" class="text-white hover:text-indigo-200 transition-colors">
                                ← Back to Dashboard
                            </button>
                            <h1 class="text-xl font-bold">Settings</h1>
                        </div>
                        <div class="flex items-center gap-4">
                            <span>Welcome, ${AppState.user?.username || 'User'}!</span>
                            <button onclick="handleLogout()" class="bg-indigo-700 px-4 py-2 rounded hover:bg-indigo-800 transition-colors">
                                Logout
                            </button>
                        </div>
                    </div>
                </nav>

                <div class="container mx-auto p-6">
                    <!-- Settings Tabs -->
                    <div class="bg-white rounded-lg shadow-lg overflow-hidden">
                        <div class="border-b border-gray-200">
                            <nav class="flex space-x-8 px-6" aria-label="Tabs">
                                <button class="settings-tab active" data-tab="flow" onclick="switchSettingsTab('flow')">
                                    Flow Preferences
                                </button>
                                <button class="settings-tab" data-tab="general" onclick="switchSettingsTab('general')">
                                    General Settings
                                </button>
                                <button class="settings-tab" data-tab="account" onclick="switchSettingsTab('account')">
                                    Account
                                </button>
                            </nav>
                        </div>

                        <!-- Settings Content -->
                        <div class="p-6">
                            <!-- Flow Preferences Tab -->
                            <div id="flow-settings" class="settings-content active">
                                <h2 class="text-2xl font-bold text-gray-900 mb-6">Flow Preferences</h2>
                                <p class="text-gray-600 mb-8">Customize your brain training flow experience</p>

                                <form id="flow-settings-form" class="space-y-6">
                                    <!-- Session Length -->
                                    <div class="settings-group">
                                        <label class="settings-label">Default Session Length</label>
                                        <select name="flow_session_length" class="settings-select">
                                            <option value="5">5 minutes (Quick)</option>
                                            <option value="10">10 minutes</option>
                                            <option value="15">15 minutes (Default)</option>
                                            <option value="20">20 minutes</option>
                                            <option value="30">30 minutes (Extended)</option>
                                            <option value="45">45 minutes (Deep Focus)</option>
                                        </select>
                                        <p class="settings-description">How long should your default training sessions last?</p>
                                    </div>

                                    <!-- Break Length -->
                                    <div class="settings-group">
                                        <label class="settings-label">Break Length Between Activities</label>
                                        <select name="flow_break_length" class="settings-select">
                                            <option value="0">No breaks</option>
                                            <option value="1">1 minute</option>
                                            <option value="2">2 minutes (Default)</option>
                                            <option value="3">3 minutes</option>
                                            <option value="5">5 minutes</option>
                                        </select>
                                        <p class="settings-description">Short breaks help maintain focus and prevent mental fatigue</p>
                                    </div>

                                    <!-- Auto-start -->
                                    <div class="settings-group">
                                        <label class="settings-checkbox-group">
                                            <input type="checkbox" name="flow_auto_start" class="settings-checkbox">
                                            <span class="settings-label">Auto-start next activity</span>
                                        </label>
                                        <p class="settings-description">Automatically start the next activity after breaks</p>
                                    </div>

                                    <!-- Transition Speed -->
                                    <div class="settings-group">
                                        <label class="settings-label">Transition Speed</label>
                                        <select name="flow_transition_speed" class="settings-select">
                                            <option value="slow">Slow (3 seconds)</option>
                                            <option value="medium">Medium (2 seconds)</option>
                                            <option value="fast">Fast (1 second)</option>
                                        </select>
                                        <p class="settings-description">How quickly should activities transition?</p>
                                    </div>

                                    <!-- Preferred Categories -->
                                    <div class="settings-group">
                                        <label class="settings-label">Preferred Activity Categories</label>
                                        <div class="settings-checkbox-grid">
                                            <label class="settings-checkbox-group">
                                                <input type="checkbox" name="flow_preferred_categories" value="memory_games" class="settings-checkbox">
                                                <span>Memory Games</span>
                                            </label>
                                            <label class="settings-checkbox-group">
                                                <input type="checkbox" name="flow_preferred_categories" value="puzzles" class="settings-checkbox">
                                                <span>Puzzles</span>
                                            </label>
                                            <label class="settings-checkbox-group">
                                                <input type="checkbox" name="flow_preferred_categories" value="trivia" class="settings-checkbox">
                                                <span>Trivia</span>
                                            </label>
                                            <label class="settings-checkbox-group">
                                                <input type="checkbox" name="flow_preferred_categories" value="meditation" class="settings-checkbox">
                                                <span>Mindfulness</span>
                                            </label>
                                            <label class="settings-checkbox-group">
                                                <input type="checkbox" name="flow_preferred_categories" value="problem_solving" class="settings-checkbox">
                                                <span>Problem Solving</span>
                                            </label>
                                        </div>
                                        <p class="settings-description">Select your favorite types of activities (leave blank for balanced mix)</p>
                                    </div>

                                    <!-- Difficulty Progression -->
                                    <div class="settings-group">
                                        <label class="settings-checkbox-group">
                                            <input type="checkbox" name="flow_difficulty_progression" class="settings-checkbox">
                                            <span class="settings-label">Enable Difficulty Progression</span>
                                        </label>
                                        <p class="settings-description">Automatically increase difficulty based on your performance</p>
                                    </div>
                                </form>
                            </div>

                            <!-- General Settings Tab -->
                            <div id="general-settings" class="settings-content">
                                <h2 class="text-2xl font-bold text-gray-900 mb-6">General Settings</h2>
                                <p class="text-gray-600 mb-8">Customize your app experience</p>

                                <form id="general-settings-form" class="space-y-6">
                                    <!-- Theme -->
                                    <div class="settings-group">
                                        <label class="settings-label">Theme</label>
                                        <select name="theme" class="settings-select">
                                            <option value="auto">Auto (System Default)</option>
                                            <option value="light">Light</option>
                                            <option value="dark">Dark</option>
                                        </select>
                                    </div>

                                    <!-- Sound -->
                                    <div class="settings-group">
                                        <label class="settings-checkbox-group">
                                            <input type="checkbox" name="sound_enabled" class="settings-checkbox">
                                            <span class="settings-label">Enable Sound Effects</span>
                                        </label>
                                    </div>

                                    <!-- Haptic Feedback -->
                                    <div class="settings-group">
                                        <label class="settings-checkbox-group">
                                            <input type="checkbox" name="haptic_feedback" class="settings-checkbox">
                                            <span class="settings-label">Enable Haptic Feedback</span>
                                        </label>
                                        <p class="settings-description">Vibration feedback on mobile devices</p>
                                    </div>

                                    <!-- Difficulty Mode -->
                                    <div class="settings-group">
                                        <label class="settings-label">Overall Difficulty</label>
                                        <select name="difficulty_mode" class="settings-select">
                                            <option value="adaptive">Adaptive (Recommended)</option>
                                            <option value="easy">Easy</option>
                                            <option value="medium">Medium</option>
                                            <option value="hard">Hard</option>
                                        </select>
                                    </div>

                                    <!-- Weekly Report -->
                                    <div class="settings-group">
                                        <label class="settings-checkbox-group">
                                            <input type="checkbox" name="weekly_report_enabled" class="settings-checkbox">
                                            <span class="settings-label">Weekly Progress Reports</span>
                                        </label>
                                    </div>

                                    <!-- Share Progress -->
                                    <div class="settings-group">
                                        <label class="settings-checkbox-group">
                                            <input type="checkbox" name="share_progress" class="settings-checkbox">
                                            <span class="settings-label">Share Progress with Friends</span>
                                        </label>
                                    </div>
                                </form>
                            </div>

                            <!-- Account Settings Tab -->
                            <div id="account-settings" class="settings-content">
                                <h2 class="text-2xl font-bold text-gray-900 mb-6">Account Settings</h2>
                                <p class="text-gray-600 mb-8">Manage your account details and privacy</p>

                                <div class="space-y-8">
                                    <!-- Profile Information -->
                                    <div class="border-b border-gray-200 pb-6">
                                        <h3 class="text-lg font-medium text-gray-900 mb-4">Profile Information</h3>
                                        <div class="space-y-4">
                                            <div>
                                                <label class="settings-label">Username</label>
                                                <input type="text" id="username" class="settings-input" value="${AppState.user?.username || ''}" readonly>
                                            </div>
                                            <div>
                                                <label class="settings-label">Email</label>
                                                <input type="email" id="email" class="settings-input" value="${AppState.user?.email || ''}" readonly>
                                            </div>
                                        </div>
                                        <p class="text-sm text-gray-500 mt-2">Contact support to change your username or email</p>
                                    </div>

                                    <!-- Data & Privacy -->
                                    <div class="border-b border-gray-200 pb-6">
                                        <h3 class="text-lg font-medium text-gray-900 mb-4">Data & Privacy</h3>
                                        <div class="space-y-4">
                                            <button onclick="exportUserData()" class="settings-button settings-button-secondary">
                                                📥 Export My Data
                                            </button>
                                            <p class="text-sm text-gray-500">Download all your data including progress, settings, and activity history</p>
                                        </div>
                                    </div>

                                    <!-- Danger Zone -->
                                    <div>
                                        <h3 class="text-lg font-medium text-red-600 mb-4">Danger Zone</h3>
                                        <div class="space-y-4">
                                            <button onclick="confirmDeleteAccount()" class="settings-button settings-button-danger">
                                                🗑️ Delete Account
                                            </button>
                                            <p class="text-sm text-gray-500">Permanently delete your account and all associated data</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Save Button -->
                        <div class="bg-gray-50 px-6 py-4 flex justify-between items-center">
                            <div class="text-sm text-gray-500" id="save-status"></div>
                            <div class="flex gap-3">
                                <button onclick="resetSettings()" class="settings-button settings-button-secondary">
                                    Reset to Defaults
                                </button>
                                <button onclick="saveSettings()" class="settings-button settings-button-primary" id="save-button">
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Load current settings
        this.loadSettings();
        this.attachEventListeners();
    }

    /**
     * Switch between settings tabs
     */
    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.settings-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update content panels
        document.querySelectorAll('.settings-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-settings`).classList.add('active');
    }

    /**
     * Load current user settings
     */
    async loadSettings() {
        try {
            const response = await apiRequest('/users/profile', { method: 'GET' });
            if (response.success) {
                this.currentSettings = response.data.settings || {};
                this.populateForm();
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
            showNotification('Failed to load settings', 'error');
        }
    }

    /**
     * Populate form with current settings
     */
    populateForm() {
        const settings = this.currentSettings;

        // Flow preferences
        if (settings.flow_session_length) {
            document.querySelector('[name="flow_session_length"]').value = settings.flow_session_length;
        }
        if (settings.flow_break_length) {
            document.querySelector('[name="flow_break_length"]').value = settings.flow_break_length;
        }
        if (settings.flow_auto_start) {
            document.querySelector('[name="flow_auto_start"]').checked = settings.flow_auto_start;
        }
        if (settings.flow_transition_speed) {
            document.querySelector('[name="flow_transition_speed"]').value = settings.flow_transition_speed;
        }
        if (settings.flow_preferred_categories) {
            const categories = JSON.parse(settings.flow_preferred_categories || '[]');
            categories.forEach(category => {
                const checkbox = document.querySelector(`[name="flow_preferred_categories"][value="${category}"]`);
                if (checkbox) checkbox.checked = true;
            });
        }
        if (settings.flow_difficulty_progression !== undefined) {
            document.querySelector('[name="flow_difficulty_progression"]').checked = settings.flow_difficulty_progression;
        }

        // General settings
        if (settings.theme) {
            document.querySelector('[name="theme"]').value = settings.theme;
        }
        if (settings.sound_enabled !== undefined) {
            document.querySelector('[name="sound_enabled"]').checked = settings.sound_enabled;
        }
        if (settings.haptic_feedback !== undefined) {
            document.querySelector('[name="haptic_feedback"]').checked = settings.haptic_feedback;
        }
        if (settings.difficulty_mode) {
            document.querySelector('[name="difficulty_mode"]').value = settings.difficulty_mode;
        }
        if (settings.weekly_report_enabled !== undefined) {
            document.querySelector('[name="weekly_report_enabled"]').checked = settings.weekly_report_enabled;
        }
        if (settings.share_progress !== undefined) {
            document.querySelector('[name="share_progress"]').checked = settings.share_progress;
        }
    }

    /**
     * Attach event listeners for form changes
     */
    attachEventListeners() {
        const forms = document.querySelectorAll('#flow-settings-form, #general-settings-form');
        forms.forEach(form => {
            form.addEventListener('change', () => {
                this.unsavedChanges = true;
                this.updateSaveButton();
            });
        });
    }

    /**
     * Update save button state
     */
    updateSaveButton() {
        const saveButton = document.getElementById('save-button');
        const saveStatus = document.getElementById('save-status');
        
        if (this.unsavedChanges) {
            saveButton.classList.add('settings-button-primary-active');
            saveStatus.textContent = 'You have unsaved changes';
            saveStatus.classList.add('text-orange-600');
        } else {
            saveButton.classList.remove('settings-button-primary-active');
            saveStatus.textContent = '';
            saveStatus.classList.remove('text-orange-600');
        }
    }

    /**
     * Save settings
     */
    async saveSettings() {
        try {
            const flowData = new FormData(document.getElementById('flow-settings-form'));
            const generalData = new FormData(document.getElementById('general-settings-form'));

            // Collect flow preferences
            const flowPreferredCategories = [];
            document.querySelectorAll('[name="flow_preferred_categories"]:checked').forEach(checkbox => {
                flowPreferredCategories.push(checkbox.value);
            });

            const settingsData = {
                // Flow preferences
                flow_session_length: parseInt(flowData.get('flow_session_length')),
                flow_break_length: parseInt(flowData.get('flow_break_length')),
                flow_auto_start: flowData.get('flow_auto_start') === 'on',
                flow_transition_speed: flowData.get('flow_transition_speed'),
                flow_preferred_categories: flowPreferredCategories,
                flow_difficulty_progression: flowData.get('flow_difficulty_progression') === 'on',

                // General settings
                theme: generalData.get('theme'),
                sound_enabled: generalData.get('sound_enabled') === 'on',
                haptic_feedback: generalData.get('haptic_feedback') === 'on',
                difficulty_mode: generalData.get('difficulty_mode'),
                weekly_report_enabled: generalData.get('weekly_report_enabled') === 'on',
                share_progress: generalData.get('share_progress') === 'on'
            };

            const response = await apiRequest('/users/settings', {
                method: 'PUT',
                body: settingsData
            });

            if (response.success) {
                this.unsavedChanges = false;
                this.updateSaveButton();
                document.getElementById('save-status').textContent = 'Settings saved successfully';
                document.getElementById('save-status').classList.add('text-green-600');
                setTimeout(() => {
                    document.getElementById('save-status').textContent = '';
                    document.getElementById('save-status').classList.remove('text-green-600');
                }, 3000);
                
                showNotification('Settings saved successfully', 'success');
            }
        } catch (error) {
            console.error('Failed to save settings:', error);
            showNotification('Failed to save settings', 'error');
        }
    }

    /**
     * Reset settings to defaults
     */
    resetSettings() {
        if (confirm('Are you sure you want to reset all settings to defaults?')) {
            // Reset form values to defaults
            document.querySelector('[name="flow_session_length"]').value = '15';
            document.querySelector('[name="flow_break_length"]').value = '2';
            document.querySelector('[name="flow_auto_start"]').checked = false;
            document.querySelector('[name="flow_transition_speed"]').value = 'medium';
            document.querySelector('[name="flow_difficulty_progression"]').checked = true;
            
            // Clear all category checkboxes
            document.querySelectorAll('[name="flow_preferred_categories"]').forEach(checkbox => {
                checkbox.checked = false;
            });

            document.querySelector('[name="theme"]').value = 'auto';
            document.querySelector('[name="sound_enabled"]').checked = true;
            document.querySelector('[name="haptic_feedback"]').checked = true;
            document.querySelector('[name="difficulty_mode"]').value = 'adaptive';
            document.querySelector('[name="weekly_report_enabled"]').checked = true;
            document.querySelector('[name="share_progress"]').checked = false;

            this.unsavedChanges = true;
            this.updateSaveButton();
        }
    }
}

// Global functions for UI interactions
function switchSettingsTab(tabName) {
    if (window.settingsManager) {
        window.settingsManager.switchTab(tabName);
    }
}

function saveSettings() {
    if (window.settingsManager) {
        window.settingsManager.saveSettings();
    }
}

function resetSettings() {
    if (window.settingsManager) {
        window.settingsManager.resetSettings();
    }
}

function exportUserData() {
    // Implementation for data export
    showNotification('Data export feature coming soon', 'info');
}

function confirmDeleteAccount() {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
        if (confirm('This will permanently delete ALL your data. Are you absolutely sure?')) {
            // Implementation for account deletion
            showNotification('Account deletion feature coming soon', 'info');
        }
    }
}

// Initialize settings manager when page is rendered
function renderSettings() {
    window.settingsManager = new SettingsManager();
    window.settingsManager.render();
}

// Export for use in app.js
if (typeof window !== 'undefined') {
    window.renderSettings = renderSettings;
}