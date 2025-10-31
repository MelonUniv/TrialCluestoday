import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export const NotificationProvider = ({ children }) => {
  useEffect(() => {
    let isMounted = true;

    const configureNotifications = async () => {
      const settings = await Notifications.getPermissionsAsync();
      if (!settings.granted && isMounted) {
        await Notifications.requestPermissionsAsync();
      }
    };

    configureNotifications();

    return () => {
      isMounted = false;
    };
  }, []);

  return children;
};
