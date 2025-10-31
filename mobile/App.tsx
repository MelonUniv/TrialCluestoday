import React from 'react';
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import * as Notifications from 'expo-notifications';
import { PreferencesProvider } from './src/context/PreferencesContext';
import { BookmarksProvider } from './src/context/BookmarksContext';
import SettingsScreen from './src/screens/SettingsScreen';
import NotificationInitializer from './src/hooks/useNotificationSetup';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowAlert: true
  })
});

export default function App() {
  return (
    <PreferencesProvider>
      <BookmarksProvider>
        <SafeAreaView style={styles.container}>
          <StatusBar barStyle="dark-content" />
          <NotificationInitializer />
          <SettingsScreen />
        </SafeAreaView>
      </BookmarksProvider>
    </PreferencesProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  }
});
