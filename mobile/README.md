# TrialCluesToday Mobile

Expo React Native client implementing push notifications and reminder workflows for TrialCluesToday job alerts.

## Features
- Requests notification permissions and registers Expo/FCM push tokens.
- Persists user preferences for U.S. states and job categories.
- Subscribes FCM device tokens to state-based topics using a backend Cloud Function.
- Schedules local reminders for bookmarked jobs approaching their deadlines.

## Getting Started
1. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```
2. Provide Firebase configuration by setting environment variables or editing `app.config.js`.
3. Add your `google-services.json` for Android (place it in the `mobile/` directory). iOS configuration requires the Apple push notification key via Expo.
4. Start the development server:
   ```bash
   npx expo start
   ```

## Environment Variables
The app reads the following variables at build time:
- `FIREBASE_API_KEY`
- `FIREBASE_AUTH_DOMAIN`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_STORAGE_BUCKET`
- `FIREBASE_SENDER_ID`
- `FIREBASE_APP_ID`
- `FIREBASE_MEASUREMENT_ID`
- `NOTIFICATION_SERVICE_URL` – Base URL of the backend service handling token registration and topic subscriptions.
- `FCM_TOPIC_PREFIX` – Prefix used for state topics (defaults to `state`).
- `REMINDER_WINDOW_HOURS` – Hours before a deadline to schedule the local reminder (defaults to `24`).

## Backend Requirements
The backend must expose endpoints at `/register` and `/subscribe` that interface with the Firebase Admin SDK. Refer to [`docs/fcm-topic-publishing.md`](./docs/fcm-topic-publishing.md) for implementation guidance on publishing state-based job notifications.
