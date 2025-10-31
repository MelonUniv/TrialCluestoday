import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'trialcluestoday.preferences';

type PreferencesState = {
  preferredStates: string[];
  preferredCategories: string[];
  updatePreferredStates: (states: string[]) => void;
  updatePreferredCategories: (categories: string[]) => void;
};

const PreferencesContext = createContext<PreferencesState | undefined>(undefined);

const PreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [preferredStates, setPreferredStates] = useState<string[]>([]);
  const [preferredCategories, setPreferredCategories] = useState<string[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!raw) {
          return;
        }

        const parsed = JSON.parse(raw);
        setPreferredStates(parsed.preferredStates ?? []);
        setPreferredCategories(parsed.preferredCategories ?? []);
      })
      .catch((error) => {
        console.error('Failed to load preferences', error);
      });
  }, []);

  const persist = useMemo(() => {
    return (states: string[], categories: string[]) => {
      AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ preferredStates: states, preferredCategories: categories })
      ).catch((error) => console.error('Failed to persist preferences', error));
    };
  }, []);

  const updatePreferredStates = (states: string[]) => {
    setPreferredStates(states);
    persist(states, preferredCategories);
  };

  const updatePreferredCategories = (categories: string[]) => {
    setPreferredCategories(categories);
    persist(preferredStates, categories);
  };

  const value = useMemo(
    () => ({ preferredStates, preferredCategories, updatePreferredStates, updatePreferredCategories }),
    [preferredCategories, preferredStates]
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
};

const usePreferences = () => {
  const ctx = useContext(PreferencesContext);
  if (!ctx) {
    throw new Error('usePreferences must be used inside PreferencesProvider');
  }

  return ctx;
};

export { PreferencesProvider, usePreferences };
