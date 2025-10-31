(function (global) {
    var config = global.__APP_ANALYTICS__ || { enabled: false };
    var queue = [];
    var analyticsInstance = null;
    var initializing = false;
    var nativeBridge = null;

    function ensureFirebaseInstance() {
        if (!config.enabled || config.provider !== 'firebase') {
            return null;
        }

        if (analyticsInstance) {
            return analyticsInstance;
        }

        if (typeof global.firebase === 'undefined' || !global.firebase.apps) {
            return null;
        }

        if (!global.firebase.apps.length) {
            if (initializing) {
                return null;
            }

            initializing = true;
            try {
                global.firebase.initializeApp(config.firebase || {});
            } catch (error) {
                if (typeof console !== 'undefined' && console.error) {
                    console.error('Firebase initialization failed', error);
                }
                initializing = false;
                return null;
            }
            initializing = false;
        }

        if (global.firebase.analytics) {
            analyticsInstance = global.firebase.analytics();
        }

        return analyticsInstance;
    }

    function resolveNativeBridge() {
        if (nativeBridge) {
            return nativeBridge;
        }

        if (config && typeof config.nativeBridge === 'string' && global[config.nativeBridge]) {
            nativeBridge = global[config.nativeBridge];
            return nativeBridge;
        }

        if (global.__STOP_SCROLLING_NATIVE_BRIDGE__) {
            nativeBridge = global.__STOP_SCROLLING_NATIVE_BRIDGE__;
            return nativeBridge;
        }

        if (global.ReactNativeWebView) {
            nativeBridge = global.ReactNativeWebView;
            return nativeBridge;
        }

        return null;
    }

    function dispatchToNative(event) {
        var bridge = resolveNativeBridge();
        if (!bridge) {
            return false;
        }

        var payload = {
            scope: 'stop-scrolling.analytics',
            event: event
        };

        try {
            if (typeof bridge.postMessage === 'function') {
                bridge.postMessage(JSON.stringify(payload));
                return true;
            }

            if (typeof bridge.send === 'function') {
                bridge.send(payload);
                return true;
            }

            if (typeof bridge.emit === 'function') {
                bridge.emit('analytics', payload);
                return true;
            }
        } catch (error) {
            if (typeof console !== 'undefined' && console.warn) {
                console.warn('Native analytics bridge failed', error);
            }
        }

        return false;
    }

    function flushQueue() {
        if (config.provider === 'react-native') {
            if (!resolveNativeBridge()) {
                return;
            }

            while (queue.length) {
                var event = queue[0];
                if (dispatchToNative(event)) {
                    queue.shift();
                } else {
                    break;
                }
            }
            return;
        }

        var instance = ensureFirebaseInstance();
        if (!instance || !instance.logEvent) {
            return;
        }

        while (queue.length) {
            var item = queue.shift();
            if (item.type === 'screen') {
                instance.logEvent('screen_view', {
                    firebase_screen: item.name,
                    firebase_screen_class: item.name,
                    engagement_time_msec: item.params && item.params.duration || undefined
                });
            } else {
                instance.logEvent(item.name, item.params || {});
            }
        }
    }

    function enqueue(event) {
        if (!config.enabled) {
            if (typeof console !== 'undefined' && console.debug) {
                console.debug('Analytics disabled, skipping event', event);
            }
            return;
        }

        queue.push(event);
        flushQueue();
    }

    var analyticsApi = {
        isEnabled: function () {
            return !!config.enabled;
        },
        trackScreen: function (screenName, params) {
            if (!screenName) {
                return;
            }
            enqueue({ type: 'screen', name: screenName, params: params || {} });
        },
        trackEvent: function (eventName, params) {
            if (!eventName) {
                return;
            }
            enqueue({ type: 'event', name: eventName, params: params || {} });
        },
        trackError: function (message, params) {
            enqueue({ type: 'event', name: 'app_error', params: Object.assign({ message: message }, params) });
        },
        setNativeBridge: function (bridge) {
            nativeBridge = bridge || null;
            flushQueue();
        },
        __resolveNativeBridge: resolveNativeBridge,
        __getQueue: function () {
            return queue.slice();
        },
        __resetQueue: function () {
            queue.length = 0;
            analyticsInstance = null;
            initializing = false;
            nativeBridge = null;
        }
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = analyticsApi;
    }

    global.Analytics = analyticsApi;
})(typeof window !== 'undefined' ? window : globalThis);
