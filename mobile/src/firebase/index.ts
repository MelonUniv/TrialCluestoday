import { initializeApp } from 'firebase/app';
import { getExpoExtra } from '../utils/config';

type FirebaseApp = ReturnType<typeof initializeApp>;

let firebaseApp: FirebaseApp | null = null;

export const getFirebaseApp = () => {
  if (firebaseApp) {
    return firebaseApp;
  }

  const firebaseConfig = getExpoExtra().firebase;
  if (!firebaseConfig) {
    throw new Error('Firebase configuration missing in app.config.js');
  }

  firebaseApp = initializeApp(firebaseConfig);
  return firebaseApp;
};
