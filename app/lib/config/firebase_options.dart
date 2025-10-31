import 'package:firebase_core/firebase_core.dart';

import 'env.dart';

class FirebaseOptionsFactory {
  const FirebaseOptionsFactory();

  FirebaseOptions build() {
    return FirebaseOptions(
      apiKey: Env.firebaseApiKey,
      appId: Env.firebaseAppId,
      messagingSenderId: Env.firebaseSenderId,
      projectId: Env.firebaseProjectId,
      storageBucket: Env.firebaseStorageBucket,
    );
  }
}
