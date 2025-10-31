module.exports = ({ config }) => ({
  ...config,
  name: 'Trial Clues Today',
  slug: 'trial-clues-today',
  version: '1.0.0',
  orientation: 'portrait',
  userInterfaceStyle: 'automatic',
  splash: {
    backgroundColor: '#ffffff',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: process.env.IOS_BUNDLE_IDENTIFIER || 'com.trialcluestoday.app',
  },
  android: {
    package: process.env.ANDROID_PACKAGE || 'com.trialcluestoday.app',
  },
  extra: {
    environment: process.env.APP_ENV || 'development',
    firebase: {
      apiKey: process.env.FIREBASE_API_KEY || 'mock-api-key',
      authDomain: process.env.FIREBASE_AUTH_DOMAIN || 'mock-auth-domain.firebaseapp.com',
      projectId: process.env.FIREBASE_PROJECT_ID || 'mock-project-id',
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'mock-storage-bucket.appspot.com',
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || 'mock-messaging-sender-id',
      appId: process.env.FIREBASE_APP_ID || 'mock-app-id',
      measurementId: process.env.FIREBASE_MEASUREMENT_ID || 'mock-measurement-id',
    },
  },
  plugins: ['expo-notifications'],
});
