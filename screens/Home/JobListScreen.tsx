import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import JobCard from '../../components/JobCard';
import { fetchJobs, jobsQueryKeys, type FetchJobsOptions, type Job } from '../../services/jobs';

interface FilterChip {
  label: string;
  filterKey: string;
  value?: string | number | boolean;
}

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

const toQueryFilters = (filters: Record<string, string | number | boolean | undefined>): FetchJobsOptions => {
  const params: FetchJobsOptions = { get_app_page: 1, limit: MAX_RESULTS, per_page: MAX_RESULTS };

  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined) {
      return;
    }

    params[key] = value;
  });

  return params;
};

const renderPaginationRange = (totalPages: number): number[] => {
  return Array.from({ length: totalPages }, (_, index) => index + 1);
};

const JobListScreen: React.FC = () => {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Record<string, string | number | boolean | undefined>>({});

  const queryFilters = useMemo(() => toQueryFilters(filters), [filters]);

  const { data, error, isError, isLoading, isFetching, refetch } = useQuery({
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

  const statusMessage = useMemo(() => {
    if (isLoading) {
      return 'Loading job listings…';
    }

    if (isError) {
      return (error as Error).message ?? 'Unable to load jobs right now.';
    }

    if (!paginatedJobs.length) {
      return 'No jobs found for the selected filters.';
    }

    return undefined;
  }, [error, isError, isLoading, paginatedJobs.length]);

  const renderContent = () => {
    if (statusMessage) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4rem 1rem',
            textAlign: 'center',
            color: 'var(--job-screen-muted, #475569)',
          }}
        >
          <span>{statusMessage}</span>
          {isError && (
            <button
              type="button"
              onClick={() => refetch()}
              style={{
                padding: '0.6rem 1.25rem',
                borderRadius: '9999px',
                border: 'none',
                background: '#2563eb',
                color: '#ffffff',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Try again
            </button>
          )}
        </div>
      );
    }

    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.25rem',
        }}
      >
        {paginatedJobs.map((job: Job, index) => (
          <JobCard key={`${job.id}-${index}`} job={job} highlight={index === 0 && page === 1} />
        ))}
      </div>
    );
  };

  return (
    <section
      aria-label="Job listings"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        padding: '1.5rem 1rem',
        margin: '0 auto',
        width: 'min(1100px, 100%)',
      }}
    >
      <header
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.35rem',
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: '1.75rem',
              fontWeight: 700,
              color: 'var(--job-screen-title, #0f172a)',
            }}
          >
            Explore opportunities
          </h2>
          <p
            style={{
              margin: 0,
              color: 'var(--job-screen-muted, #475569)',
            }}
          >
            Browse the latest openings pulled directly from our marketplace API.
          </p>
        </div>

        <div
          aria-label="Job filters"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.6rem',
          }}
        >
          {FILTER_CHIPS.map((chip) => {
            const active = isChipActive(chip);

            return (
              <button
                key={`${chip.filterKey}-${chip.value ?? 'all'}`}
                type="button"
                onClick={() => toggleFilter(chip)}
                style={{
                  padding: '0.55rem 1.1rem',
                  borderRadius: '9999px',
                  border: active ? '1px solid transparent' : '1px solid rgba(148, 163, 184, 0.35)',
                  background: active ? 'linear-gradient(135deg, #2563eb, #7c3aed)' : '#ffffff',
                  color: active ? '#ffffff' : '#0f172a',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: active ? '0 10px 20px -15px rgba(79, 70, 229, 0.95)' : 'none',
                }}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
      </header>

      <div>{renderContent()}</div>

      <nav aria-label="Pagination" style={{ display: 'flex', justifyContent: 'center' }}>
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          {paginationRange.map((pageNumber) => (
            <button
              key={pageNumber}
              type="button"
              onClick={() => setPage(pageNumber)}
              disabled={pageNumber === page || isLoading || isFetching}
              style={{
                width: '2.5rem',
                height: '2.5rem',
                borderRadius: '0.75rem',
                border: '1px solid rgba(148, 163, 184, 0.35)',
                background:
                  pageNumber === page
                    ? 'linear-gradient(135deg, #2563eb, #7c3aed)'
                    : '#ffffff',
                color: pageNumber === page ? '#ffffff' : '#1f2937',
                fontWeight: 600,
                cursor: pageNumber === page ? 'default' : 'pointer',
              }}
            >
              {pageNumber}
            </button>
          ))}
        </div>
      </nav>
    </section>
  );
};

export default JobListScreen;
