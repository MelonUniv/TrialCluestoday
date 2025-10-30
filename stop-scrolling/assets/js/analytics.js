(function (global) {
    var config = global.__APP_ANALYTICS__ || { enabled: false };
    var queue = [];
    var analyticsInstance = null;
    var initializing = false;

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

    function flushQueue() {
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
        __getQueue: function () {
            return queue.slice();
        },
        __resetQueue: function () {
            queue.length = 0;
            analyticsInstance = null;
            initializing = false;
        }
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = analyticsApi;
    }

    global.Analytics = analyticsApi;
})(typeof window !== 'undefined' ? window : globalThis);
