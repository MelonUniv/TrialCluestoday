const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const rootDir = path.resolve(__dirname, '..', '..');
const analyticsPath = path.join(rootDir, 'stop-scrolling/assets/js/analytics.js');

function loadAnalytics(config) {
  delete require.cache[analyticsPath];
  global.__APP_ANALYTICS__ = config;
  delete global.Analytics;
  return require(analyticsPath);
}

test('analytics queues screen views and events when enabled', () => {
  const analytics = loadAnalytics({ enabled: true, provider: 'test' });
  analytics.__resetQueue();

  analytics.trackEvent('cta_press', { id: 'get-started' });
  analytics.trackScreen('home', { source: 'unit-test' });

  const queue = analytics.__getQueue();
  assert.equal(queue.length, 2);
  assert.equal(queue[0].name, 'cta_press');
  assert.equal(queue[1].type, 'screen');
  analytics.__resetQueue();
});

test('analytics ignores events when disabled', () => {
  const analytics = loadAnalytics({ enabled: false });
  analytics.__resetQueue();
  analytics.trackEvent('cta_press', {});
  analytics.trackScreen('home', {});
  assert.equal(analytics.__getQueue().length, 0);
});
