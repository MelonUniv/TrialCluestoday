import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../providers/app_startup_provider.dart';
import '../../services/notifications/notification_service.dart';

final darkModeProvider = StateProvider<bool>((ref) => false);
final notificationsEnabledProvider = StateProvider<bool>((ref) => true);

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final darkMode = ref.watch(darkModeProvider);
    final notificationsEnabled = ref.watch(notificationsEnabledProvider);
    final notificationService = ref.read(notificationServiceProvider);

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        SwitchListTile(
          title: const Text('Dark mode'),
          value: darkMode,
          onChanged: (value) => ref.read(darkModeProvider.notifier).state = value,
        ),
        SwitchListTile(
          title: const Text('Notifications'),
          value: notificationsEnabled,
          onChanged: (value) => ref.read(notificationsEnabledProvider.notifier).state = value,
        ),
        const SizedBox(height: 24),
        ElevatedButton.icon(
          onPressed: notificationsEnabled
              ? () => notificationService.showDemoNotification()
              : null,
          icon: const Icon(Icons.notifications_active_outlined),
          label: const Text('Send test notification'),
        ),
      ],
    );
  }
}
