import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

export interface BookmarkedJob {
  id: string;
  title?: string;
  company?: string;
  location?: string;
  description?: string;
  salary?: string;
  tags?: string[];
  requirements?: unknown[];
  responsibilities?: unknown[];
  savedAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

type BookmarkMap = Record<string, BookmarkedJob>;

interface BookmarksContextValue {
  bookmarks: BookmarkedJob[];
  bookmarksMap: BookmarkMap;
  loading: boolean;
  isBookmarked: (jobId: string | undefined | null) => boolean;
  toggleBookmark: (job: BookmarkedJob) => Promise<void>;
  removeBookmark: (jobId: string) => Promise<void>;
  updateBookmark: (job: BookmarkedJob) => Promise<void>;
  clearBookmarks: () => Promise<void>;
  refreshFromStorage: () => Promise<void>;
}

const STORAGE_KEY = '@trialcluestoday_bookmarked_jobs';

const BookmarksContext = createContext<BookmarksContextValue | undefined>(undefined);

const sanitizeBookmark = (job: BookmarkedJob): BookmarkedJob => {
  const timestamp = new Date().toISOString();
  const { id, savedAt, updatedAt, ...rest } = job;
  const normalizedId = typeof id === 'string' ? id : String(id);
  return {
    id: normalizedId,
    savedAt: savedAt ?? timestamp,
    updatedAt: updatedAt ?? timestamp,
    ...rest,
  };
};

const parseStoredBookmarks = (value: string | null): BookmarkMap => {
  if (!value) {
    return {};
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    if (Array.isArray(parsed)) {
      return parsed.reduce<BookmarkMap>((acc, entry) => {
        if (entry && typeof entry === 'object' && 'id' in entry) {
          const job = sanitizeBookmark(entry as BookmarkedJob);
          acc[job.id] = job;
        }
        return acc;
      }, {});
    }

    if (parsed && typeof parsed === 'object') {
      return Object.values(parsed as Record<string, unknown>).reduce<BookmarkMap>((acc, valueEntry) => {
        if (valueEntry && typeof valueEntry === 'object' && 'id' in valueEntry) {
          const job = sanitizeBookmark(valueEntry as BookmarkedJob);
          acc[job.id] = job;
        }
        return acc;
      }, {});
    }
  } catch (error) {
    console.warn('Failed to parse stored bookmarks', error);
  }

  return {};
};

const serializeBookmarks = (map: BookmarkMap): string | null => {
  const entries = Object.values(map);
  if (!entries.length) {
    return null;
  }
  return JSON.stringify(entries);
};

const useBookmarksState = (): BookmarksContextValue => {
  const [bookmarksMap, setBookmarksMap] = useState<BookmarkMap>({});
  const [hydrated, setHydrated] = useState(false);
  const loadingRef = useRef(false);

  const persistBookmarks = useCallback(async (map: BookmarkMap) => {
    const serialized = serializeBookmarks(map);
    try {
      if (serialized === null) {
        await AsyncStorage.removeItem(STORAGE_KEY);
      } else {
        await AsyncStorage.setItem(STORAGE_KEY, serialized);
      }
    } catch (error) {
      console.warn('Failed to persist bookmarks', error);
    }
  }, []);

  const refreshFromStorage = useCallback(async () => {
    if (loadingRef.current) {
      return;
    }
    loadingRef.current = true;
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      setBookmarksMap(parseStoredBookmarks(stored));
    } catch (error) {
      console.warn('Failed to load bookmarks from storage', error);
      setBookmarksMap({});
    } finally {
      setHydrated(true);
      loadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    void refreshFromStorage();
  }, [refreshFromStorage]);

  const setStateAndPersist = useCallback(
    async (updater: (prev: BookmarkMap) => BookmarkMap) => {
      setBookmarksMap(prev => {
        const next = updater(prev);
        void persistBookmarks(next);
        return next;
      });
    },
    [persistBookmarks],
  );

  const toggleBookmark = useCallback(
    async (job: BookmarkedJob) => {
      if (!job?.id) {
        return;
      }
      await setStateAndPersist(prev => {
        const exists = !!prev[job.id];
        if (exists) {
          const { [job.id]: _removed, ...rest } = prev;
          return rest;
        }
        const sanitized = sanitizeBookmark(job);
        const timestamp = new Date().toISOString();
        return {
          ...prev,
          [job.id]: {
            ...sanitized,
            savedAt: timestamp,
            updatedAt: timestamp,
          },
        };
      });
    },
    [setStateAndPersist],
  );

  const removeBookmark = useCallback(
    async (jobId: string) => {
      if (!jobId) {
        return;
      }
      await setStateAndPersist(prev => {
        if (!prev[jobId]) {
          return prev;
        }
        const { [jobId]: _removed, ...rest } = prev;
        return rest;
      });
    },
    [setStateAndPersist],
  );

  const updateBookmark = useCallback(
    async (job: BookmarkedJob) => {
      if (!job?.id) {
        return;
      }
      await setStateAndPersist(prev => {
        const existing = prev[job.id];
        if (!existing) {
          return prev;
        }
        const timestamp = new Date().toISOString();
        return {
          ...prev,
          [job.id]: {
            ...existing,
            ...job,
            id: job.id,
            savedAt: existing.savedAt ?? timestamp,
            updatedAt: timestamp,
          },
        };
      });
    },
    [setStateAndPersist],
  );

  const clearBookmarks = useCallback(async () => {
    await setStateAndPersist(() => ({}));
  }, [setStateAndPersist]);

  const bookmarks = useMemo(() => {
    return Object.values(bookmarksMap).sort((a, b) => {
      const aSaved = a.savedAt ?? a.updatedAt ?? '';
      const bSaved = b.savedAt ?? b.updatedAt ?? '';
      if (aSaved === bSaved) {
        return (b.updatedAt ?? '').localeCompare(a.updatedAt ?? '');
      }
      return bSaved.localeCompare(aSaved);
    });
  }, [bookmarksMap]);

  const isBookmarked = useCallback(
    (jobId: string | undefined | null) => {
      if (!jobId) {
        return false;
      }
      return Boolean(bookmarksMap[jobId]);
    },
    [bookmarksMap],
  );

  return {
    bookmarks,
    bookmarksMap,
    loading: !hydrated,
    isBookmarked,
    toggleBookmark,
    removeBookmark,
    updateBookmark,
    clearBookmarks,
    refreshFromStorage,
  } satisfies BookmarksContextValue;
};

export const BookmarksProvider = ({ children }: { children: ReactNode }) => {
  const value = useBookmarksState();

  return <BookmarksContext.Provider value={value}>{children}</BookmarksContext.Provider>;
};

export const useBookmarks = (): BookmarksContextValue => {
  const context = useContext(BookmarksContext);
  if (!context) {
    throw new Error('useBookmarks must be used within a BookmarksProvider');
  }
  return context;
};

export const withBookmarksProvider = <P extends object>(Component: React.ComponentType<P>) => {
  const WrappedComponent: React.FC<P> = props => (
    <BookmarksProvider>
      <Component {...props} />
    </BookmarksProvider>
  );
  WrappedComponent.displayName = `withBookmarksProvider(${Component.displayName ?? Component.name ?? 'Component'})`;
  return WrappedComponent;
};

