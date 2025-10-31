import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, List, Text } from 'react-native-paper';
import * as Notifications from 'expo-notifications';
import { ENV } from '../config/environment';

const SettingsScreen = () => {
  const handleScheduleNotification = async () => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Trial Clues Today',
        body: 'Notifications are configured and ready to use.',
      },
      trigger: null,
    });
  };

  return (
    <View style={styles.container}>
      <Text variant="titleLarge" style={styles.heading}>
        Settings
      </Text>
      <List.Section>
        <List.Subheader>Environment</List.Subheader>
        <List.Item title="Mode" description={ENV.environment} left={(props) => <List.Icon {...props} icon="earth" />} />
        <List.Item
          title="Firebase Project"
          description={ENV.firebase.projectId || 'Not configured'}
          left={(props) => <List.Icon {...props} icon="firebase" />}
        />
      </List.Section>
      <Button mode="contained" onPress={handleScheduleNotification}>
        Send Test Notification
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    flex: 1,
  },
  heading: {
    marginBottom: 24,
  },
});

export default SettingsScreen;
