const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const rootDir = path.resolve(__dirname, '..', '..');
const themeModule = require(path.join(rootDir, 'stop-scrolling/assets/js/theme.js'));
const { createThemeManager } = require(path.join(rootDir, 'stop-scrolling/assets/js/hooks/themeHooks.js'));

test('theme manager exposes default light mode', () => {
  const manager = createThemeManager(themeModule);
  assert.equal(manager.getMode(), 'light');
  assert.deepEqual(manager.getAvailableModes().sort(), ['dark', 'light']);
});

test('theme manager updates tokens when setting dark mode', () => {
  const manager = createThemeManager(themeModule);
  let observedMode = manager.getMode();
  const unsubscribe = manager.subscribe((mode) => {
    observedMode = mode;
  });

  const appliedMode = manager.setMode('dark');
  assert.equal(appliedMode, 'dark');
  assert.equal(manager.getMode(), 'dark');
  assert.equal(observedMode, 'dark');

  const tokens = manager.getTokens();
  assert.equal(tokens.primary, '#818CF8');
  assert.equal(tokens.textPrimary, '#E2E8F0');

  unsubscribe();
});

test('theme module builds CSS variables for light mode', () => {
  const vars = themeModule.buildCssVariablesFromMode('light');
  assert.equal(vars['--color-primary'], '#6366F1');
  assert.equal(vars['--font-heading-h1'], "700 2.75rem/1.2 var(--font-family-base)");
});

test('applyCssVariables is a no-op without document', () => {
  // Should not throw when document is undefined in Node environment
  assert.doesNotThrow(() => themeModule.applyCssVariables('light'));
});
