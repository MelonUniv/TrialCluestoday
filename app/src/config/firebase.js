import { ENV } from './environment';

export const firebaseConfig = ENV.firebase;

export const isFirebaseConfigured = () => Boolean(firebaseConfig.projectId);
