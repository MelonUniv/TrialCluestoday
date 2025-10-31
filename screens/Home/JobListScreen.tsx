import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import JobCard from '../../components/JobCard';
import { fetchJobs, jobsQueryKeys, type Job, type JobFilters } from '../../services/jobs';

interface FilterChip {
  label: string;
  filterKey: string;
  value?: string | number | boolean;
}

type FilterState = Record<string, string | number | boolean | undefined>;

const MAX_RESULTS = 100;
const PAGE_SIZE = 10;

const FILTER_CHIPS: FilterChip[] = [
  { label: 'All', filterKey: 'cat_group' },
  { label: 'Technology', filterKey: 'cat_group', value: 'technology' },
  { label: 'Healthcare', filterKey: 'cat_group', value: 'healthcare' },
  { label: 'Remote', filterKey: 'location', value: 'Remote' },
  { label: 'On-site', filterKey: 'location', value: 'On-site' },
  { label: 'Full-time', filterKey: 'job_type', value: 'full_time' },
  { label: 'Part-time', filterKey: 'job_type', value: 'part_time' },
];

const toQueryFilters = (filters: FilterState): JobFilters => {
  const params: JobFilters = { get_app_page: 1, limit: MAX_RESULTS, per_page: MAX_RESULTS };

  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined) {
      return;
    }

    params[key] = value;
  });

  return params;
};

const renderPaginationRange = (totalPages: number): number[] =>
  Array.from({ length: totalPages }, (_, index) => index + 1);

const JobListScreen: React.FC = () => {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<FilterState>({});

  const queryFilters = useMemo<JobFilters>(() => toQueryFilters(filters), [filters]);

  const { data, error, isError, isFetching, isLoading, refetch } = useQuery({
    queryKey: jobsQueryKeys.list(queryFilters),
    queryFn: ({ signal }) => fetchJobs({ ...queryFilters, signal }),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });

  const limitedJobs = useMemo(() => (data?.jobs ?? []).slice(0, MAX_RESULTS), [data]);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(limitedJobs.length / PAGE_SIZE));
    if (page > maxPage) {
      setPage(1);
    }
  }, [limitedJobs, page]);

  const paginatedJobs = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return limitedJobs.slice(start, start + PAGE_SIZE);
  }, [limitedJobs, page]);

  const toggleFilter = useCallback((chip: FilterChip) => {
    setPage(1);
    setFilters((current) => {
      const next = { ...current };

      if (chip.value === undefined) {
        delete next[chip.filterKey];
        return next;
      }

      if (next[chip.filterKey] === chip.value) {
        delete next[chip.filterKey];
      } else {
        next[chip.filterKey] = chip.value;
      }

      return next;
    });
  }, []);

  const isChipActive = useCallback(
    (chip: FilterChip) => {
      if (chip.value === undefined) {
        return !filters[chip.filterKey];
      }

      return filters[chip.filterKey] === chip.value;
    },
    [filters],
  );

  const totalPages = useMemo(() => Math.max(1, Math.ceil(limitedJobs.length / PAGE_SIZE)), [limitedJobs]);
  const paginationRange = useMemo(() => renderPaginationRange(totalPages), [totalPages]);

  const errorMessage = useMemo(() => {
    if (!isError) {
      return undefined;
    }

    if (error instanceof Error) {
      return error.message;
    }

    return 'Unable to load jobs right now.';
  }, [error, isError]);

  const renderBody = () => {
    if (isLoading && !data) {
      return (
        <View style={styles.statusContainer} accessibilityRole="status">
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.statusText}>Loading job listings…</Text>
        </View>
      );
    }

    if (isError) {
      return (
        <View style={styles.statusContainer} accessibilityRole="alert">
          <Text style={styles.statusText}>{errorMessage}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => refetch()} activeOpacity={0.85}>
            <Text style={styles.retryButtonText}>Try again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!paginatedJobs.length) {
      return (
        <View style={styles.statusContainer} accessibilityRole="status">
          <Text style={styles.statusText}>No jobs found for the selected filters.</Text>
        </View>
      );
    }

    return (
      <View style={styles.jobsContainer}>
        {paginatedJobs.map((job: Job, index) => (
          <View key={`${job.id}-${index}`} style={styles.jobWrapper}>
            <JobCard job={job} highlight={index === 0 && page === 1} />
          </View>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.heading}>Explore opportunities</Text>
          <Text style={styles.subheading}>
            Browse the latest openings pulled directly from our marketplace API.
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContainer}
        >
          {FILTER_CHIPS.map((chip) => {
            const active = isChipActive(chip);

            return (
              <TouchableOpacity
                key={`${chip.filterKey}-${chip.value ?? 'all'}`}
                activeOpacity={0.85}
                onPress={() => toggleFilter(chip)}
                style={[styles.filterChip, active ? styles.filterChipActive : null]}
              >
                <Text style={[styles.filterChipText, active ? styles.filterChipTextActive : null]}>
                  {chip.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {isFetching && !isLoading && paginatedJobs.length > 0 ? (
          <View style={styles.inlineSpinner} accessibilityRole="status">
            <ActivityIndicator size="small" color="#2563eb" />
            <Text style={styles.inlineSpinnerText}>Refreshing…</Text>
          </View>
        ) : null}

        {renderBody()}

        {paginatedJobs.length > 0 && (
          <View style={styles.paginationContainer} accessibilityRole="navigation" accessibilityLabel="Pagination">
            <View style={styles.paginationButtons}>
              {paginationRange.map((pageNumber) => {
                const isCurrent = pageNumber === page;

                return (
                  <TouchableOpacity
                    key={pageNumber}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: isCurrent || isLoading || isFetching, selected: isCurrent }}
                    onPress={() => setPage(pageNumber)}
                    disabled={isCurrent || isLoading || isFetching}
                    activeOpacity={0.8}
                    style={[styles.paginationButton, isCurrent ? styles.paginationButtonActive : null]}
                  >
                    <Text
                      style={[styles.paginationButtonText, isCurrent ? styles.paginationButtonTextActive : null]}
                    >
                      {pageNumber}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 16,
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
  },
  subheading: {
    marginTop: 6,
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  filtersContainer: {
    paddingVertical: 8,
    paddingRight: 12,
  },
  filterChip: {
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(148, 163, 184, 0.35)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 8,
    backgroundColor: '#ffffff',
  },
  filterChipActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  inlineSpinner: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  inlineSpinnerText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#475569',
  },
  statusContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  statusText: {
    marginTop: 12,
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    paddingHorizontal: 16,
    lineHeight: 20,
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: '#2563eb',
  },
  retryButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  jobsContainer: {
    marginTop: 8,
  },
  jobWrapper: {
    marginBottom: 16,
  },
  paginationContainer: {
    marginTop: 24,
  },
  paginationButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  paginationButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(148, 163, 184, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 4,
    backgroundColor: '#ffffff',
  },
  paginationButtonActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  paginationButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  paginationButtonTextActive: {
    color: '#ffffff',
  },
});

export default JobListScreen;
