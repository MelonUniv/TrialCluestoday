import { getExpoExtra } from '../utils/config';

interface RegisterPayload {
  expoToken: string | null;
  fcmToken: string | null;
}

export const registerTokenWithBackend = async ({ expoToken, fcmToken }: RegisterPayload) => {
  const endpoint = getExpoExtra().notificationServiceUrl;

  if (!endpoint) {
    console.warn('Notification service URL not configured. Skipping token registration.');
    return;
  }

  await fetch(`${endpoint}/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ expoToken, fcmToken })
  }).catch((error) => console.error('Failed to register tokens with backend', error));
};
