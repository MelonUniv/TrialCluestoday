import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { subscribeTokenToTopics } from '../services/topicSubscription';
import { registerTokenWithBackend } from '../services/notifications';
import { usePreferences } from '../context/PreferencesContext';
import Constants from 'expo-constants';
import { getExpoExtra } from '../utils/config';

const NotificationInitializer = () => {
  const hasRegisteredRef = useRef(false);
  const { preferredStates } = usePreferences();
  const [fcmToken, setFcmToken] = useState<string | null>(null);

  const projectId = useMemo(() => {
    const extra = getExpoExtra();
    return extra.eas?.projectId || Constants.easConfig?.projectId;
  }, []);

  const requestPermissionsAsync = useCallback(async () => {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Notification permissions not granted');
      return false;
    }

    return true;
  }, []);

  const registerForNotificationsAsync = useCallback(async () => {
    if (!Device.isDevice) {
      console.warn('Push notifications require a physical device');
      return;
    }

    const permissionsGranted = await requestPermissionsAsync();
    if (!permissionsGranted) {
      return;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX
      });
    }

    const expoToken = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );

    const devicePushToken = await Notifications.getDevicePushTokenAsync();
    if (devicePushToken?.type === 'fcm') {
      setFcmToken(devicePushToken.data);
    }

    await registerTokenWithBackend({
      expoToken: expoToken.data,
      fcmToken: devicePushToken?.type === 'fcm' ? devicePushToken.data : null
    });
  }, [projectId, requestPermissionsAsync]);

  useEffect(() => {
    if (!hasRegisteredRef.current) {
      hasRegisteredRef.current = true;
      registerForNotificationsAsync();
    }
  }, [registerForNotificationsAsync]);

  useEffect(() => {
    if (!fcmToken) {
      return;
    }

    subscribeTokenToTopics(fcmToken, preferredStates).catch((error) => {
      console.error('Failed to subscribe to FCM topics', error);
    });
  }, [fcmToken, preferredStates]);

  return null;
};

export default NotificationInitializer;
