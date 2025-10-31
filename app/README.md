# Trial Clues Today (Flutter)

A Flutter-based cross-platform starter that targets Android and iOS with bottom tab navigation, bookmarking, and environment-driven Firebase configuration.

## Getting started

1. Install the Flutter SDK (>=3.2.0) and ensure that `flutter doctor` reports no issues.
2. Copy the sample environment file:

   ```bash
   cp assets/config/.env.example assets/config/.env
   ```

3. Update the `.env` file with your Firebase project credentials.
4. Fetch the project dependencies:

   ```bash
   flutter pub get
   ```

5. To run on Android from your local SDK/emulator:

   ```bash
   flutter run -d android
   ```

   Ensure an Android emulator or a connected device is available. The included Gradle wrapper works with Android Studio or the command line (`./android/gradlew assembleDebug`).

## Features

- Riverpod-powered state management with a demo API request via Dio.
- Bookmark toggling shared across Home and Bookmarks tabs.
- Local notification demo configured through `flutter_local_notifications`.
- Environment-aware Firebase initialization via `.env` assets.
- Material 3 theming with light/dark mode toggle.

## Folder structure

- `lib/` — Dart source with feature-first organization.
- `android/` — Android Studio ready project wrapper using the Flutter Gradle plugin.
- `assets/config/` — Environment configuration bundled with the app build.
