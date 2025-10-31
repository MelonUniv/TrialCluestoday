import Constants from 'expo-constants';

type Extra = Record<string, any>;

export const getExpoExtra = (): Extra => {
  return (Constants?.expoConfig?.extra as Extra) ?? (Constants?.manifest?.extra as Extra) ?? {};
};
