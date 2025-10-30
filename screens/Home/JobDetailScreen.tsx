import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { NavigationProp, RouteProp, useNavigation, useRoute } from '@react-navigation/native';

import {
  JobDetail,
  JobSummary,
  fetchJobDetail,
  fetchRelatedJobsByFilters,
} from '../../services/jobDetail';

type HomeStackParamList = {
  JobDetail: {
    jobId: string;
    initialJob?: JobSummary;
  };
};

type JobDetailRouteProp = RouteProp<HomeStackParamList, 'JobDetail'>;

const palette = {
  background: '#F4F7FB',
  surface: '#FFFFFF',
  primary: '#0F4C81',
  primaryText: '#1A1F36',
  secondaryText: '#4A5A73',
  accent: '#EF6C00',
  border: '#D6DEEB',
  pill: '#E1ECF4',
  success: '#1B9C85',
};

const SECTION_TITLES: Record<keyof JobDetail['sections'], string> = {
  overview: 'Overview',
  eligibility: 'Eligibility Criteria',
  importantDates: 'Important Dates',
  howToApply: 'How to Apply',
  downloads: 'Downloads',
};

const SHARE_FALLBACK_URL = 'https://trial.cluestoday.com/jobs';

const JobDetailScreen: React.FC = () => {
  const route = useRoute<JobDetailRouteProp>();
  const navigation = useNavigation<NavigationProp<HomeStackParamList>>();
  const { jobId, initialJob } = route.params;

  const [job, setJob] = useState<JobDetail | null>(null);
  const [relatedJobs, setRelatedJobs] = useState<JobSummary[]>(initialJob ? [initialJob] : []);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [isSharing, setIsSharing] = useState<boolean>(false);

  const loadJob = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const detail = await fetchJobDetail(jobId);
      setJob(detail);
      if (detail.relatedJobs.length > 0) {
        setRelatedJobs(detail.relatedJobs);
      }
    } catch (err) {
      console.error('Failed to fetch job detail', err);
      setError('Unable to load the job details right now. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    loadJob();
  }, [loadJob]);

  const fetchRelated = useCallback(
    async (detail: JobDetail | null) => {
      if (!detail) {
        return;
      }
      try {
        const results = await fetchRelatedJobsByFilters({
          category: detail.category,
          state: detail.state,
          excludeJobId: detail.id,
        });
        if (results.length > 0) {
          setRelatedJobs(results);
        }
      } catch (err) {
        console.warn('Failed to fetch related jobs', err);
      }
    },
    []
  );

  useEffect(() => {
    if (job) {
      fetchRelated(job);
    }
  }, [job, fetchRelated]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadJob();
    } finally {
      setRefreshing(false);
    }
  }, [loadJob]);

  const handleShare = useCallback(async () => {
    if (!job) {
      return;
    }
    try {
      setIsSharing(true);
      const link = job.shareUrl ?? job.applyUrl ?? `${SHARE_FALLBACK_URL}/${job.id}`;
      const organizationText = job.organization ? `\nOrganization: ${job.organization}` : '';
      const locationText = job.location ? `\nLocation: ${job.location}` : job.state ? `\nState: ${job.state}` : '';
      const message = `${job.title}${organizationText}${locationText}\nApply here: ${link}`;
      await Share.share({
        title: job.title,
        message,
        url: link,
      });
    } catch (err) {
      console.error('Share failed', err);
      Alert.alert('Unable to share', 'We could not open the share dialog. Please try again.');
    } finally {
      setIsSharing(false);
    }
  }, [job]);

  useLayoutEffect(() => {
    const title = job?.title ?? initialJob?.title ?? 'Job Details';
    navigation.setOptions({
      title,
      headerRight: () => (
        <TouchableOpacity
          onPress={handleShare}
          disabled={!job || isSharing}
          accessibilityRole="button"
          accessibilityLabel="Share job details"
          style={styles.headerAction}
        >
          <Text style={[styles.headerActionText, !job && styles.headerActionTextDisabled]}>
            {isSharing ? 'Sharing…' : 'Share'}
          </Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, job, isSharing, initialJob, handleShare]);

  const openDownload = useCallback(async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        Alert.alert('Link unavailable', 'This download link could not be opened on your device.');
        return;
      }
      await Linking.openURL(url);
    } catch (err) {
      console.error('Failed to open download link', err);
      Alert.alert('Error', 'We could not open that link. Please try again later.');
    }
  }, []);

  const filteredRelatedJobs = useMemo(() => {
    if (!job || relatedJobs.length === 0) {
      return relatedJobs;
    }
    return relatedJobs.filter((item) => {
      const matchesCategory = !job.category || !item.category || item.category === job.category;
      const matchesState = !job.state || !item.state || item.state === job.state;
      return matchesCategory && matchesState && item.id !== job.id;
    });
  }, [job, relatedJobs]);

  const renderSection = useCallback(
    (sectionKey: keyof JobDetail['sections']) => {
      if (!job) {
        return null;
      }
      const section = job.sections[sectionKey];
      if (sectionKey === 'importantDates') {
        if (section.length === 0) {
          return null;
        }
        return (
          <View style={styles.section} key={sectionKey}>
            <Text style={styles.sectionTitle}>{SECTION_TITLES[sectionKey]}</Text>
            <View style={styles.dateGrid}>
              {section.map((date) => (
                <View key={`${date.label}-${date.value}`} style={styles.dateCard} accessible accessibilityRole="text">
                  <Text style={styles.dateLabel}>{date.label}</Text>
                  <Text style={styles.dateValue}>{date.value}</Text>
                </View>
              ))}
            </View>
          </View>
        );
      }

      if (sectionKey === 'downloads') {
        if (section.length === 0) {
          return null;
        }
        return (
          <View style={styles.section} key={sectionKey}>
            <Text style={styles.sectionTitle}>{SECTION_TITLES[sectionKey]}</Text>
            {section.map((download) => (
              <TouchableOpacity
                key={`${download.label}-${download.url}`}
                onPress={() => openDownload(download.url)}
                style={styles.downloadButton}
                accessibilityRole="link"
                accessibilityHint="Opens the download link in your browser"
              >
                <Text style={styles.downloadLabel}>{download.label}</Text>
                <Text style={styles.downloadUrl}>{download.url}</Text>
                {download.description ? (
                  <Text style={styles.downloadDescription}>{download.description}</Text>
                ) : null}
              </TouchableOpacity>
            ))}
          </View>
        );
      }

      if (!Array.isArray(section) || section.length === 0) {
        return null;
      }

      return (
        <View style={styles.section} key={sectionKey}>
          <Text style={styles.sectionTitle}>{SECTION_TITLES[sectionKey]}</Text>
          {section.map((item, index) => (
            <Text key={`${sectionKey}-${index}`} style={styles.sectionText}>
              {item}
            </Text>
          ))}
        </View>
      );
    },
    [job, openDownload]
  );

  const navigateToJob = useCallback(
    (item: JobSummary) => {
      navigation.navigate('JobDetail', { jobId: item.id, initialJob: item });
    },
    [navigation]
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.centeredContainer}>
        <ActivityIndicator size="large" color={palette.primary} />
        <Text style={styles.loadingText}>Loading job details…</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.centeredContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadJob} accessibilityRole="button">
          <Text style={styles.retryButtonText}>Try again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (!job) {
    return (
      <SafeAreaView style={styles.centeredContainer}>
        <Text style={styles.errorText}>We could not find this job.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.primary} />}
      >
        <View style={styles.heroCard}>
          <View style={styles.badgeRow}>
            {job.category ? (
              <View style={styles.badge} accessibilityRole="text">
                <Text style={styles.badgeText}>{job.category}</Text>
              </View>
            ) : null}
            {job.state ? (
              <View style={styles.badge} accessibilityRole="text">
                <Text style={styles.badgeText}>{job.state}</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.title}>{job.title}</Text>
          {job.organization ? <Text style={styles.subtitle}>{job.organization}</Text> : null}
          {job.location ? <Text style={styles.locationText}>{job.location}</Text> : null}
          <TouchableOpacity
            style={styles.applyButton}
            onPress={() => job.applyUrl && openDownload(job.applyUrl)}
            disabled={!job.applyUrl}
            accessibilityRole="button"
            accessibilityState={{ disabled: !job.applyUrl }}
          >
            <Text style={styles.applyButtonText}>{job.applyUrl ? 'Apply Now' : 'Application link unavailable'}</Text>
          </TouchableOpacity>
        </View>

        {(
          Object.keys(job.sections) as Array<keyof JobDetail['sections']>
        ).map((sectionKey) => renderSection(sectionKey))}

        <View style={styles.relatedContainer}>
          <Text style={styles.relatedTitle}>Related Jobs</Text>
          {filteredRelatedJobs.length === 0 ? (
            <Text style={styles.relatedEmpty}>No similar jobs found right now. Check back soon!</Text>
          ) : (
            <FlatList
              data={filteredRelatedJobs}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.relatedCard}
                  onPress={() => navigateToJob(item)}
                  accessibilityRole="button"
                  accessibilityLabel={`Open job ${item.title}`}
                >
                  <Text style={styles.relatedJobTitle}>{item.title}</Text>
                  {item.organization ? (
                    <Text style={styles.relatedJobMeta}>{item.organization}</Text>
                  ) : null}
                  <View style={styles.relatedMetaRow}>
                    {item.location ? <Text style={styles.relatedJobMeta}>{item.location}</Text> : null}
                    {item.state && item.location ? <Text style={styles.relatedDivider}>•</Text> : null}
                    {item.state ? <Text style={styles.relatedJobMeta}>{item.state}</Text> : null}
                  </View>
                  {item.publishedAt ? (
                    <Text style={styles.relatedPublished}>Posted {item.publishedAt}</Text>
                  ) : null}
                </TouchableOpacity>
              )}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={styles.relatedSeparator} />}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 48,
  },
  centeredContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.background,
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    color: palette.secondaryText,
    fontSize: 16,
  },
  errorText: {
    textAlign: 'center',
    color: palette.primaryText,
    fontSize: 16,
    lineHeight: 22,
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: palette.primary,
  },
  retryButtonText: {
    color: palette.surface,
    fontWeight: '600',
    fontSize: 16,
  },
  heroCard: {
    backgroundColor: palette.surface,
    borderRadius: 24,
    padding: 24,
    marginTop: 16,
    shadowColor: '#0F0F0F',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  badge: {
    backgroundColor: palette.pill,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginRight: 8,
    marginBottom: 8,
  },
  badgeText: {
    color: palette.primary,
    fontWeight: '600',
    fontSize: 13,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: palette.primaryText,
    marginBottom: 8,
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '500',
    color: palette.secondaryText,
  },
  locationText: {
    marginTop: 6,
    fontSize: 16,
    color: palette.secondaryText,
  },
  applyButton: {
    marginTop: 24,
    backgroundColor: palette.primary,
    paddingVertical: 14,
    borderRadius: 28,
    alignItems: 'center',
  },
  applyButtonText: {
    color: palette.surface,
    fontWeight: '600',
    fontSize: 16,
  },
  section: {
    backgroundColor: palette.surface,
    borderRadius: 20,
    padding: 20,
    marginTop: 20,
    shadowColor: '#0F0F0F',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.primaryText,
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 15,
    lineHeight: 22,
    color: palette.secondaryText,
    marginBottom: 8,
  },
  dateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  dateCard: {
    flexBasis: '48%',
    backgroundColor: palette.pill,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginHorizontal: 6,
    marginBottom: 12,
  },
  dateLabel: {
    fontSize: 13,
    color: palette.secondaryText,
    marginBottom: 6,
  },
  dateValue: {
    fontSize: 16,
    fontWeight: '600',
    color: palette.primaryText,
  },
  downloadButton: {
    backgroundColor: palette.background,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  downloadLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: palette.primaryText,
  },
  downloadUrl: {
    fontSize: 14,
    color: palette.accent,
    marginTop: 4,
  },
  downloadDescription: {
    fontSize: 13,
    color: palette.secondaryText,
    marginTop: 6,
  },
  relatedContainer: {
    marginTop: 28,
  },
  relatedTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: palette.primaryText,
    marginBottom: 16,
  },
  relatedEmpty: {
    fontSize: 15,
    color: palette.secondaryText,
  },
  relatedCard: {
    backgroundColor: palette.surface,
    borderRadius: 16,
    padding: 18,
    shadowColor: '#0F0F0F',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 2,
  },
  relatedJobTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: palette.primaryText,
  },
  relatedJobMeta: {
    marginTop: 6,
    fontSize: 14,
    color: palette.secondaryText,
  },
  relatedMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  relatedDivider: {
    marginHorizontal: 6,
    color: palette.secondaryText,
  },
  relatedPublished: {
    marginTop: 10,
    fontSize: 13,
    color: palette.secondaryText,
  },
  relatedSeparator: {
    height: 16,
  },
  headerAction: {
    marginRight: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  headerActionText: {
    color: palette.primary,
    fontWeight: '600',
    fontSize: 15,
  },
  headerActionTextDisabled: {
    color: palette.secondaryText,
  },
});

export default JobDetailScreen;

