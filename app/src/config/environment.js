import Constants from 'expo-constants';

const expoConfig = Constants?.expoConfig || Constants?.manifest || {};
const extra = expoConfig?.extra || {};

export const ENV = {
  environment: extra.environment || 'development',
  firebase: {
    apiKey: extra.firebase?.apiKey || '',
    authDomain: extra.firebase?.authDomain || '',
    projectId: extra.firebase?.projectId || '',
    storageBucket: extra.firebase?.storageBucket || '',
    messagingSenderId: extra.firebase?.messagingSenderId || '',
    appId: extra.firebase?.appId || '',
    measurementId: extra.firebase?.measurementId || '',
  },
};
