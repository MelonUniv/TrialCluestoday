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

test('analytics waits for native bridge before flushing in react-native mode', () => {
  const analytics = loadAnalytics({ enabled: true, provider: 'react-native' });
  analytics.__resetQueue();

  analytics.trackEvent('native_event', { value: 1 });
  assert.equal(analytics.__getQueue().length, 1);

  const messages = [];
  const bridge = {
    postMessage(payload) {
      messages.push(JSON.parse(payload));
    }
  };

  analytics.setNativeBridge(bridge);
  assert.equal(analytics.__getQueue().length, 0);
  assert.equal(messages.length, 1);
  assert.equal(messages[0].event.name, 'native_event');
  assert.equal(messages[0].event.params.value, 1);
  analytics.__resetQueue();
});

test('analytics resolves bridge automatically from global hints', () => {
  global.__STOP_SCROLLING_NATIVE_BRIDGE__ = {
    emit(eventName, payload) {
      this.lastPayload = { eventName, payload };
    }
  };

  const analytics = loadAnalytics({ enabled: true, provider: 'react-native' });
  analytics.__resetQueue();

  analytics.trackScreen('native-home');
  flushNativeQueue(analytics);

  assert(global.__STOP_SCROLLING_NATIVE_BRIDGE__.lastPayload);
  assert.equal(global.__STOP_SCROLLING_NATIVE_BRIDGE__.lastPayload.eventName, 'analytics');
  assert.equal(global.__STOP_SCROLLING_NATIVE_BRIDGE__.lastPayload.payload.event.name, 'native-home');

  delete global.__STOP_SCROLLING_NATIVE_BRIDGE__;
  analytics.__resetQueue();
});

function flushNativeQueue(analytics) {
  // Force queue processing by toggling the bridge reference. This mirrors
  // what would happen when the React Native layer becomes available.
  const bridge = analytics.__resolveNativeBridge();
  if (bridge && analytics.setNativeBridge) {
    analytics.setNativeBridge(bridge);
  }
}
