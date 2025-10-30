import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';

import { useBookmarks, type BookmarkedJob } from '../hooks/useBookmarks';

export interface JobDetailScreenProps {
  route?: {
    params?: {
      job?: BookmarkedJob;
      jobId?: string;
      [key: string]: unknown;
    };
  };
  navigation?: {
    setOptions?: (options: Record<string, unknown>) => void;
  };
  job?: BookmarkedJob;
  onFetchJob?: (jobId: string) => Promise<BookmarkedJob | undefined>;
}

const HEART_OUTLINE = '\u2661';
const HEART_FILLED = '\u2665';

const JobDetailScreen: React.FC<JobDetailScreenProps> = ({ route, navigation, job: jobProp, onFetchJob }) => {
  const initialJobFromParams = route?.params?.job as BookmarkedJob | undefined;
  const jobIdFromParams = (route?.params?.jobId as string | undefined) ?? initialJobFromParams?.id;

  const [job, setJob] = useState<BookmarkedJob | null>(jobProp ?? initialJobFromParams ?? null);

  const { isBookmarked, toggleBookmark, updateBookmark } = useBookmarks();

  useEffect(() => {
    if (jobProp) {
      setJob(current => {
        if (!current) {
          return jobProp;
        }
        if (current.id !== jobProp.id) {
          return jobProp;
        }
        return { ...current, ...jobProp };
      });
    }
  }, [jobProp]);

  useEffect(() => {
    if (initialJobFromParams) {
      setJob(current => {
        if (!current) {
          return initialJobFromParams;
        }
        if (current.id !== initialJobFromParams.id) {
          return initialJobFromParams;
        }
        return { ...current, ...initialJobFromParams };
      });
    }
  }, [initialJobFromParams]);

  useEffect(() => {
    if (!job && jobIdFromParams && onFetchJob) {
      void (async () => {
        const fetched = await onFetchJob(jobIdFromParams);
        if (fetched) {
          setJob(fetched);
        }
      })();
    }
  }, [job, jobIdFromParams, onFetchJob]);

  useEffect(() => {
    if (job) {
      void updateBookmark(job);
      navigation?.setOptions?.({
        title: job.title ?? 'Job details',
      });
    }
  }, [job, navigation, updateBookmark]);

  const bookmarked = useMemo(() => {
    return job ? isBookmarked(job.id) : false;
  }, [isBookmarked, job]);

  const requirements = useMemo(() => {
    if (!job) {
      return [] as unknown[];
    }
    const value = (job as Record<string, unknown>).requirements;
    return Array.isArray(value) ? value : ([] as unknown[]);
  }, [job]);

  const responsibilities = useMemo(() => {
    if (!job) {
      return [] as unknown[];
    }
    const value = (job as Record<string, unknown>).responsibilities;
    return Array.isArray(value) ? value : ([] as unknown[]);
  }, [job]);

  const handleToggleBookmark = useCallback(() => {
    if (!job) {
      return;
    }
    void toggleBookmark(job);
  }, [job, toggleBookmark]);

  const descriptionParagraphs = useMemo(() => {
    if (!job?.description) {
      return [];
    }
    return job.description
      .split('\n')
      .map(paragraph => paragraph.trim())
      .filter(Boolean);
  }, [job?.description]);

  if (!job) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.emptyStateTitle}>Job unavailable</Text>
        <Text style={styles.emptyStateSubtitle}>We couldn't load this job. Try refreshing or checking your connection.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <View style={styles.headerTextGroup}>
          <Text style={styles.title}>{job.title ?? 'Untitled role'}</Text>
          {!!job.company && <Text style={styles.company}>{job.company}</Text>}
          {!!job.location && <Text style={styles.location}>{job.location}</Text>}
        </View>
        <Pressable
          onPress={handleToggleBookmark}
          accessibilityRole="button"
          accessibilityLabel={bookmarked ? 'Remove bookmark' : 'Save job'}
          hitSlop={10}
          style={styles.bookmarkButton}
        >
          <Text style={[styles.heartIcon, bookmarked && styles.heartIconActive]}>{bookmarked ? HEART_FILLED : HEART_OUTLINE}</Text>
        </Pressable>
      </View>

      {!!job.salary && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Compensation</Text>
          <Text style={styles.sectionContent}>{job.salary}</Text>
        </View>
      )}

      {!!descriptionParagraphs.length && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>About the role</Text>
          {descriptionParagraphs.map((paragraph, index) => (
            <Text key={`${job.id}-paragraph-${index}`} style={styles.sectionContent}>
              {paragraph}
            </Text>
          ))}
        </View>
      )}

      {!!requirements.length && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Requirements</Text>
          {requirements.map((req: unknown, index: number) => (
            <Text key={`${job.id}-requirement-${index}`} style={styles.listItem}>
              • {String(req)}
            </Text>
          ))}
        </View>
      )}

      {!!responsibilities.length && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Responsibilities</Text>
          {responsibilities.map((item: unknown, index: number) => (
            <Text key={`${job.id}-responsibility-${index}`} style={styles.listItem}>
              • {String(item)}
            </Text>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
  },
  headerTextGroup: {
    flex: 1,
    gap: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
  },
  company: {
    fontSize: 18,
    color: '#1D2939',
  },
  location: {
    fontSize: 16,
    color: '#475467',
  },
  bookmarkButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  heartIcon: {
    fontSize: 28,
    color: '#98A2B3',
  },
  heartIconActive: {
    color: '#F04438',
  },
  section: {
    marginTop: 24,
    gap: 12,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D2939',
  },
  sectionContent: {
    fontSize: 15,
    color: '#334155',
    lineHeight: 22,
  },
  listItem: {
    fontSize: 15,
    color: '#334155',
    lineHeight: 22,
  },
  centeredContainer: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 15,
    color: '#475467',
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default JobDetailScreen;

