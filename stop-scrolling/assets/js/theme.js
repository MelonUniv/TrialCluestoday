(function (global) {
    const documentRef = typeof global.document !== 'undefined' ? global.document : null;

    const stopScrollingTheme = {
        name: 'Stop Scrolling',
        typography: {
            fontFamily: "'Inter', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
            heading: {
                h1: '700 2.75rem/1.2 var(--font-family-base)',
                h2: '700 2.25rem/1.3 var(--font-family-base)',
                h3: '600 1.75rem/1.35 var(--font-family-base)',
                h4: '600 1.35rem/1.4 var(--font-family-base)'
            },
            body: '400 1rem/1.6 var(--font-family-base)',
            label: '500 0.875rem/1.6 var(--font-family-base)'
        },
        modes: {
            light: {
                primary: '#6366F1',
                primaryMuted: '#818CF8',
                primaryStrong: '#4C51BF',
                secondary: '#EC4899',
                success: '#22C55E',
                warning: '#F59E0B',
                danger: '#EF4444',
                surface: '#FFFFFF',
                surfaceAlt: '#F8FAFC',
                outline: '#E2E8F0',
                textPrimary: '#1E293B',
                textSecondary: '#475569',
                textOnPrimary: '#FFFFFF'
            },
            dark: {
                primary: '#818CF8',
                primaryMuted: '#A5B4FC',
                primaryStrong: '#4C51BF',
                secondary: '#F472B6',
                success: '#4ADE80',
                warning: '#FBBF24',
                danger: '#F87171',
                surface: '#0F172A',
                surfaceAlt: '#1E293B',
                outline: '#334155',
                textPrimary: '#E2E8F0',
                textSecondary: '#CBD5F5',
                textOnPrimary: '#1E1B4B'
            }
        }
    };

    const variableMap = {
        primary: '--color-primary',
        primaryMuted: '--color-primary-muted',
        primaryStrong: '--color-primary-strong',
        secondary: '--color-secondary',
        success: '--color-success',
        warning: '--color-warning',
        danger: '--color-danger',
        surface: '--color-surface',
        surfaceAlt: '--color-surface-alt',
        outline: '--color-outline',
        textPrimary: '--color-text-primary',
        textSecondary: '--color-text-secondary',
        textOnPrimary: '--color-text-on-primary'
    };

    function buildCssVariables(mode) {
        const tokens = stopScrollingTheme.modes[mode] || stopScrollingTheme.modes.light;
        return Object.keys(variableMap).reduce(function (acc, key) {
            acc[variableMap[key]] = tokens[key];
            return acc;
        }, {
            '--font-family-base': stopScrollingTheme.typography.fontFamily,
            '--font-heading-h1': stopScrollingTheme.typography.heading.h1,
            '--font-heading-h2': stopScrollingTheme.typography.heading.h2,
            '--font-heading-h3': stopScrollingTheme.typography.heading.h3,
            '--font-heading-h4': stopScrollingTheme.typography.heading.h4,
            '--font-body': stopScrollingTheme.typography.body,
            '--font-label': stopScrollingTheme.typography.label
        });
    }

    function applyCssVariables(mode) {
        if (!documentRef || !documentRef.documentElement) {
            return;
        }

        const vars = buildCssVariables(mode);
        const root = documentRef.documentElement;
        Object.keys(vars).forEach(function (key) {
            root.style.setProperty(key, vars[key]);
        });
    }

    const themeModule = {
        theme: stopScrollingTheme,
        buildCssVariablesFromMode: buildCssVariables,
        applyCssVariables: applyCssVariables
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = themeModule;
    } else {
        global.StopScrollingTheme = themeModule;
    }
})(typeof window !== 'undefined' ? window : globalThis);
