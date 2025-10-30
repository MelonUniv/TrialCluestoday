module.exports = ({ config }) => ({
  ...config,
  name: "TrialCluesToday",
  slug: "trialcluestoday",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  extra: {
    firebase: {
      apiKey: process.env.FIREBASE_API_KEY || "YOUR_FIREBASE_API_KEY",
      authDomain: process.env.FIREBASE_AUTH_DOMAIN || "your-project.firebaseapp.com",
      projectId: process.env.FIREBASE_PROJECT_ID || "your-project-id",
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "your-project.appspot.com",
      messagingSenderId: process.env.FIREBASE_SENDER_ID || "000000000000",
      appId: process.env.FIREBASE_APP_ID || "1:000000000000:web:abc123",
      measurementId: process.env.FIREBASE_MEASUREMENT_ID || "G-XXXXXXXXXX"
    },
    notificationServiceUrl:
      process.env.NOTIFICATION_SERVICE_URL || "https://your-cloud-function-url/notifications",
    topicPrefix: process.env.FCM_TOPIC_PREFIX || "state",
    reminderWindowHours: Number(process.env.REMINDER_WINDOW_HOURS || 24),
    eas: {
      projectId: process.env.EXPO_PROJECT_ID
    }
  },
  assetBundlePatterns: ["**/*"],
  plugins: ["expo-notifications"],
  ios: {
    supportsTablet: false,
    bundleIdentifier: "com.trialcluestoday.mobile",
    config: {
      usesNonExemptEncryption: false
    }
  },
  android: {
    package: "com.trialcluestoday.mobile",
    googleServicesFile: "./google-services.json",
    useNextNotificationsApi: true
  },
  web: {
    bundler: "metro"
  }
});
