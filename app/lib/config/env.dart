import 'package:flutter_dotenv/flutter_dotenv.dart';

class Env {
  static Future<void> load({String fileName = 'assets/config/.env'}) async {
    await dotenv.load(fileName: fileName);
  }

  static String get firebaseApiKey => _read('FIREBASE_API_KEY');
  static String get firebaseAppId => _read('FIREBASE_APP_ID');
  static String get firebaseSenderId => _read('FIREBASE_MESSAGING_SENDER_ID');
  static String get firebaseProjectId => _read('FIREBASE_PROJECT_ID');
  static String get firebaseStorageBucket => _read('FIREBASE_STORAGE_BUCKET');

  static String _read(String key) {
    final value = dotenv.env[key];
    if (value == null || value.isEmpty) {
      throw StateError('Missing "$key" in environment configuration.');
    }
    return value;
  }
}
