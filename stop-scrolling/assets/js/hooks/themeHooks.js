(function (global) {
    function assertThemeModule(themeModule) {
        if (!themeModule || !themeModule.theme || !themeModule.theme.modes) {
            throw new Error('A valid theme module with mode definitions is required.');
        }
    }

    function createThemeManager(themeModule) {
        assertThemeModule(themeModule);
        const availableModes = Object.keys(themeModule.theme.modes);
        if (availableModes.length === 0) {
            throw new Error('Theme module must expose at least one mode.');
        }

        let currentMode = availableModes.includes('light') ? 'light' : availableModes[0];
        const listeners = new Set();

        function notify(mode) {
            listeners.forEach(function (listener) {
                try {
                    listener(mode);
                } catch (error) {
                    if (typeof console !== 'undefined' && console.warn) {
                        console.warn('Theme listener failed', error);
                    }
                }
            });
        }

        return {
            getMode: function () {
                return currentMode;
            },
            setMode: function (mode) {
                if (!themeModule.theme.modes[mode]) {
                    return currentMode;
                }

                currentMode = mode;
                if (themeModule.applyCssVariables) {
                    themeModule.applyCssVariables(mode);
                }
                notify(mode);
                return currentMode;
            },
            getAvailableModes: function () {
                return availableModes.slice();
            },
            getTokens: function (mode) {
                const requestedMode = mode || currentMode;
                return themeModule.theme.modes[requestedMode] || themeModule.theme.modes[currentMode];
            },
            subscribe: function (listener) {
                listeners.add(listener);
                return function () {
                    listeners.delete(listener);
                };
            }
        };
    }

    const api = { createThemeManager: createThemeManager };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    } else {
        global.ThemeHooks = api;
    }
})(typeof window !== 'undefined' ? window : globalThis);
