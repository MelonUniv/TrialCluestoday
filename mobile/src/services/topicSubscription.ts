import { getExpoExtra } from '../utils/config';

export const subscribeTokenToTopics = async (fcmToken: string, states: string[]) => {
  const extra = getExpoExtra();
  const endpoint = extra.notificationServiceUrl;
  const topicPrefix = extra.topicPrefix || 'state';

  if (!endpoint) {
    console.warn('Notification service URL not configured. Unable to subscribe to topics.');
    return;
  }

  const topics = Array.from(
    new Set(states.map((state) => `${topicPrefix}-${state.toLowerCase().replace(/\s+/g, '-')}`))
  );

  await fetch(`${endpoint}/subscribe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ token: fcmToken, topics })
  }).catch((error) => console.error('Failed to subscribe to topics', error));
};
