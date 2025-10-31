import 'package:flutter_local_notifications/flutter_local_notifications.dart';

class NotificationService {
  NotificationService(this._plugin);

  final FlutterLocalNotificationsPlugin _plugin;

  Future<void> initialize() async {
    const androidInit = AndroidInitializationSettings('@mipmap/ic_launcher');
    const initializationSettings = InitializationSettings(android: androidInit);

    await _plugin.initialize(initializationSettings);
  }

  Future<void> showDemoNotification() async {
    const androidDetails = AndroidNotificationDetails(
      'demo_channel',
      'Demo Notifications',
      channelDescription: 'Channel for showcasing local notifications.',
      importance: Importance.defaultImportance,
      priority: Priority.defaultPriority,
    );

    await _plugin.show(
      0,
      'Hello from Flutter',
      'Local notifications are ready to use!',
      const NotificationDetails(android: androidDetails),
    );
  }
}

NotificationService createNotificationService() {
  return NotificationService(FlutterLocalNotificationsPlugin());
}
