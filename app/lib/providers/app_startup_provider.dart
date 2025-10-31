import 'package:firebase_core/firebase_core.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../config/env.dart';
import '../config/firebase_options.dart';
import '../services/notifications/notification_service.dart';

final notificationServiceProvider = Provider<NotificationService>((ref) {
  return createNotificationService();
});

final appStartupProvider = FutureProvider<void>((ref) async {
  await Env.load();
  await Firebase.initializeApp(
    options: const FirebaseOptionsFactory().build(),
  );
  await ref.read(notificationServiceProvider).initialize();
});
