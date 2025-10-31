import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { getExpoExtra } from '../utils/config';

const STORAGE_KEY = 'trialcluestoday.bookmarks';

export type JobBookmark = {
  id: string;
  title: string;
  deadline: string; // ISO string
  notificationId?: string;
};

type BookmarksState = {
  bookmarks: JobBookmark[];
  bookmarkJob: (bookmark: JobBookmark) => Promise<void>;
  removeBookmark: (jobId: string) => Promise<void>;
};

const BookmarksContext = createContext<BookmarksState | undefined>(undefined);

async function scheduleDeadlineReminder(bookmark: JobBookmark) {
  const reminderWindowHours = getExpoExtra().reminderWindowHours ?? 24;
  const deadlineDate = new Date(bookmark.deadline);
  const reminderDate = new Date(deadlineDate.getTime() - reminderWindowHours * 60 * 60 * 1000);

  if (Number.isNaN(reminderDate.getTime()) || reminderDate <= new Date()) {
    return null;
  }

  return Notifications.scheduleNotificationAsync({
    content: {
      title: 'Job deadline approaching',
      body: `${bookmark.title} closes on ${deadlineDate.toLocaleDateString()}`,
      data: { jobId: bookmark.id }
    },
    trigger: reminderDate
  });
}

const BookmarksProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [bookmarks, setBookmarks] = useState<JobBookmark[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!raw) {
          return;
        }
        setBookmarks(JSON.parse(raw));
      })
      .catch((error) => console.error('Failed to load bookmarks', error));
  }, []);

  const persist = useCallback((next: JobBookmark[]) => {
    setBookmarks(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch((error) =>
      console.error('Failed to persist bookmarks', error)
    );
  }, []);

  const bookmarkJob = useCallback(
    async (bookmark: JobBookmark) => {
      const existing = bookmarks.find((item) => item.id === bookmark.id);
      if (existing?.notificationId) {
        await Notifications.cancelScheduledNotificationAsync(existing.notificationId).catch(() => {});
      }

      const notificationId = await scheduleDeadlineReminder(bookmark);
      const nextBookmark: JobBookmark = {
        ...bookmark,
        notificationId: notificationId ?? undefined
      };

      const others = bookmarks.filter((item) => item.id !== bookmark.id);
      persist([...others, nextBookmark]);
    },
    [bookmarks, persist]
  );

  const removeBookmark = useCallback(
    async (jobId: string) => {
      const existing = bookmarks.find((bookmark) => bookmark.id === jobId);
      if (existing?.notificationId) {
        await Notifications.cancelScheduledNotificationAsync(existing.notificationId).catch(() => {});
      }
      persist(bookmarks.filter((bookmark) => bookmark.id !== jobId));
    },
    [bookmarks, persist]
  );

  const value = useMemo(
    () => ({ bookmarks, bookmarkJob, removeBookmark }),
    [bookmarkJob, bookmarks, removeBookmark]
  );

  return <BookmarksContext.Provider value={value}>{children}</BookmarksContext.Provider>;
};

const useBookmarks = () => {
  const ctx = useContext(BookmarksContext);
  if (!ctx) {
    throw new Error('useBookmarks must be used inside BookmarksProvider');
  }
  return ctx;
};

export { BookmarksProvider, useBookmarks };
