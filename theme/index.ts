/**
 * Global theme tokens for the Stop Scrolling brand.
 *
 * The web experience is currently powered by Tailwind utility classes,
 * but we maintain a canonical TypeScript definition so the same design
 * language can be shared with native clients (React Native / Expo) and
 * our custom JavaScript renderer.  The `StopScrollingTheme` object maps
 * directly to CSS custom properties that are hydrated at runtime by
 * `stop-scrolling/assets/js/theme.js`.
 */

export type ThemeMode = 'light' | 'dark';

export interface ThemeColorScale {
  primary: string;
  primaryMuted: string;
  primaryStrong: string;
  secondary: string;
  success: string;
  warning: string;
  danger: string;
  surface: string;
  surfaceAlt: string;
  outline: string;
  textPrimary: string;
  textSecondary: string;
  textOnPrimary: string;
}

export interface TypographyScale {
  fontFamily: string;
  heading: {
    h1: string;
    h2: string;
    h3: string;
    h4: string;
  };
  body: string;
  label: string;
}

export interface ThemeDefinition {
  name: 'Stop Scrolling';
  typography: TypographyScale;
  modes: Record<ThemeMode, ThemeColorScale>;
}

export const stopScrollingTheme: ThemeDefinition = {
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

export const themeCssVariableMap = {
  color: {
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
  },
  typography: {
    fontFamily: '--font-family-base',
    heading1: '--font-heading-h1',
    heading2: '--font-heading-h2',
    heading3: '--font-heading-h3',
    heading4: '--font-heading-h4',
    body: '--font-body',
    label: '--font-label'
  }
} as const;

export function buildCssVariables(mode: ThemeMode): Record<string, string> {
  const selectedMode = stopScrollingTheme.modes[mode] ?? stopScrollingTheme.modes.light;
  return {
    [themeCssVariableMap.color.primary]: selectedMode.primary,
    [themeCssVariableMap.color.primaryMuted]: selectedMode.primaryMuted,
    [themeCssVariableMap.color.primaryStrong]: selectedMode.primaryStrong,
    [themeCssVariableMap.color.secondary]: selectedMode.secondary,
    [themeCssVariableMap.color.success]: selectedMode.success,
    [themeCssVariableMap.color.warning]: selectedMode.warning,
    [themeCssVariableMap.color.danger]: selectedMode.danger,
    [themeCssVariableMap.color.surface]: selectedMode.surface,
    [themeCssVariableMap.color.surfaceAlt]: selectedMode.surfaceAlt,
    [themeCssVariableMap.color.outline]: selectedMode.outline,
    [themeCssVariableMap.color.textPrimary]: selectedMode.textPrimary,
    [themeCssVariableMap.color.textSecondary]: selectedMode.textSecondary,
    [themeCssVariableMap.color.textOnPrimary]: selectedMode.textOnPrimary,
    [themeCssVariableMap.typography.fontFamily]: stopScrollingTheme.typography.fontFamily,
    [themeCssVariableMap.typography.heading1]: stopScrollingTheme.typography.heading.h1,
    [themeCssVariableMap.typography.heading2]: stopScrollingTheme.typography.heading.h2,
    [themeCssVariableMap.typography.heading3]: stopScrollingTheme.typography.heading.h3,
    [themeCssVariableMap.typography.heading4]: stopScrollingTheme.typography.heading.h4,
    [themeCssVariableMap.typography.body]: stopScrollingTheme.typography.body,
    [themeCssVariableMap.typography.label]: stopScrollingTheme.typography.label
  };
}

export function getThemeMode(mode: ThemeMode): ThemeColorScale {
  return stopScrollingTheme.modes[mode] ?? stopScrollingTheme.modes.light;
}
