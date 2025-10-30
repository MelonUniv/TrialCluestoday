import type { QueryKey } from '@tanstack/react-query';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  process.env.REACT_APP_API_BASE_URL ??
  '';

export interface Job {
  id: string | number;
  title: string;
  company?: string;
  location?: string;
  description?: string;
  category?: string;
  posted_at?: string;
  salary?: string;
  url?: string;
  [key: string]: unknown;
}

export interface JobFilters {
  /** Page number as expected by `get_jobs.php` */
  get_app_page?: number;
  /** Category grouping filter */
  cat_group?: string;
  /** Result limit */
  limit?: number;
  /** Results per page */
  per_page?: number;
  /** Free-text search */
  search?: string;
  /** Location filter */
  location?: string;
  /** Any additional filters supported by the API */
  [key: string]: string | number | boolean | undefined;
}

export interface JobsApiResponse {
  jobs?: Job[];
  data?: Job[];
  results?: Job[];
  total?: number;
  total_count?: number;
  totalPages?: number;
  total_pages?: number;
  message?: string;
  [key: string]: unknown;
}

export interface JobsResult {
  jobs: Job[];
  total: number;
  totalPages: number;
  raw: JobsApiResponse;
}

export interface FetchJobsOptions extends JobFilters {
  /** Abort controller signal for cancelling the request */
  signal?: AbortSignal;
}

export const jobsQueryKeys = {
  all: ['jobs'] as const,
  lists(): readonly [...ReturnType<typeof jobsQueryKeys.all>, 'list'] {
    return [...jobsQueryKeys.all, 'list'] as const;
  },
  list(filters: Record<string, unknown>): QueryKey {
    return [...jobsQueryKeys.lists(), filters];
  },
};

const createJobsUrl = (filters: JobFilters): string => {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }

    params.append(key, String(value));
  });

  const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  const path = `${baseUrl}/get_jobs.php`;

  const query = params.toString();
  return query ? `${path}?${query}` : path;
};

const normaliseJobsResponse = (payload: JobsApiResponse, pageSize?: number): JobsResult => {
  const jobs = Array.isArray(payload.jobs)
    ? payload.jobs
    : Array.isArray(payload.data)
    ? payload.data
    : Array.isArray(payload.results)
    ? payload.results
    : [];

  const total = typeof payload.total === 'number'
    ? payload.total
    : typeof payload.total_count === 'number'
    ? payload.total_count
    : jobs.length;

  const totalPagesFromPayload = typeof payload.totalPages === 'number'
    ? payload.totalPages
    : typeof payload.total_pages === 'number'
    ? payload.total_pages
    : undefined;

  const totalPages = totalPagesFromPayload ?? (pageSize ? Math.max(1, Math.ceil(total / pageSize)) : 1);

  return {
    jobs,
    total,
    totalPages,
    raw: payload,
  };
};

export async function fetchJobs(options: FetchJobsOptions = {}): Promise<JobsResult> {
  const { signal, ...filters } = options;
  const url = createJobsUrl(filters);

  const response = await fetch(url, { signal });

  if (!response.ok) {
    const message = `Jobs request failed with status ${response.status}`;
    throw new Error(message);
  }

  const payload = (await response.json()) as JobsApiResponse;

  if (!payload || typeof payload !== 'object') {
    throw new Error('Jobs response was not a valid JSON object');
  }

  const pageSize = typeof filters.per_page === 'number'
    ? filters.per_page
    : typeof filters.limit === 'number'
    ? filters.limit
    : undefined;

  return normaliseJobsResponse(payload, pageSize);
}

export async function prefetchJobs(
  queryClient: { prefetchQuery: (options: { queryKey: QueryKey; queryFn: ({ signal }: { signal?: AbortSignal }) => Promise<JobsResult>; staleTime?: number }) => Promise<unknown>; },
  filters: FetchJobsOptions = {},
  staleTime = 1000 * 60 * 5,
): Promise<void> {
  const { signal, ...rest } = filters;

  await queryClient.prefetchQuery({
    queryKey: jobsQueryKeys.list(rest),
    staleTime,
    queryFn: ({ signal: innerSignal }) => fetchJobs({ ...rest, signal: innerSignal ?? signal }),
  });
}
