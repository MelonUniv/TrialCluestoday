import { Platform } from 'react-native';

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  process.env.API_BASE_URL ??
  'https://trial.cluestoday.com/api';

export interface JobImportantDate {
  label: string;
  value: string;
}

export interface JobDownloadLink {
  label: string;
  url: string;
  description?: string;
}

export interface JobSummary {
  id: string;
  title: string;
  organization?: string;
  location?: string;
  state?: string;
  category?: string;
  publishedAt?: string;
  applyUrl?: string;
}

export interface JobDetailSections {
  overview: string[];
  eligibility: string[];
  importantDates: JobImportantDate[];
  howToApply: string[];
  downloads: JobDownloadLink[];
}

export interface JobDetail {
  id: string;
  title: string;
  organization?: string;
  category?: string;
  state?: string;
  location?: string;
  shareUrl?: string;
  applyUrl?: string;
  sections: JobDetailSections;
  relatedJobs: JobSummary[];
  raw: unknown;
}

type NullableRecord = Record<string, unknown> | null | undefined;

const DEFAULT_SECTIONS: JobDetailSections = {
  overview: [],
  eligibility: [],
  importantDates: [],
  howToApply: [],
  downloads: [],
};

const DEFAULT_HEADERS: Record<string, string> = {
  Accept: 'application/json',
};

const HTML_BREAK_REGEX = /<\s*(br|\/p|\/div)\s*>/gi;
const HTML_TAG_REGEX = /<[^>]+>/g;

const SECTION_KEYS: Array<{ key: keyof JobDetailSections; aliases: string[] }> = [
  { key: 'overview', aliases: ['overview', 'about', 'introduction'] },
  { key: 'eligibility', aliases: ['eligibility', 'qualification', 'qualifications', 'who can apply'] },
  {
    key: 'importantDates',
    aliases: ['important dates', 'key dates', 'schedule', 'timeline'],
  },
  { key: 'howToApply', aliases: ['how to apply', 'application process', 'application steps'] },
  { key: 'downloads', aliases: ['downloads', 'important links', 'download'] },
];

function sanitizeHtml(value: string): string {
  return value
    .replace(HTML_BREAK_REGEX, '\n')
    .replace(HTML_TAG_REGEX, '')
    .replace(/\u00a0/g, ' ')
    .replace(/\r/g, '')
    .replace(/\t/g, ' ')
    .replace(/\s+\n/g, '\n')
    .trim();
}

function toLines(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => toLines(item))
      .flat()
      .filter((line) => line.length > 0);
  }

  if (typeof value === 'number') {
    return [String(value)];
  }

  if (typeof value !== 'string') {
    return [];
  }

  const sanitized = sanitizeHtml(value);
  if (!sanitized) {
    return [];
  }

  return sanitized
    .split(/\n|\u2022|\*/g)
    .map((item) => item.replace(/^[-\s•]+/, '').trim())
    .filter((item) => item.length > 0);
}

function ensureObject(value: unknown): NullableRecord {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function resolveDataEnvelope(response: unknown): Record<string, unknown> {
  if (!response || typeof response !== 'object') {
    return {};
  }

  const candidates: unknown[] = [response];
  const record = response as Record<string, unknown>;
  if (record.data) {
    candidates.push(record.data);
  }
  if (record.job) {
    candidates.push(record.job);
  }
  if (record.result) {
    candidates.push(record.result);
  }

  for (const candidate of candidates) {
    const obj = ensureObject(candidate);
    if (obj) {
      return obj;
    }
  }

  return {};
}

function parseImportantDates(source: unknown): JobImportantDate[] {
  if (!source) {
    return [];
  }

  if (Array.isArray(source)) {
    return source
      .map((item) => {
        if (!item || typeof item !== 'object') {
          return null;
        }
        const record = item as Record<string, unknown>;
        const label = String(record.label ?? record.title ?? record.name ?? '').trim();
        const value = String(record.value ?? record.date ?? record.deadline ?? '').trim();
        if (!label || !value) {
          return null;
        }
        return { label, value };
      })
      .filter((item): item is JobImportantDate => Boolean(item));
  }

  if (typeof source === 'object') {
    return Object.entries(source as Record<string, unknown>)
      .map(([label, value]) => {
        const normalizedLabel = label.replace(/_/g, ' ').replace(/\b\w/g, (match) => match.toUpperCase());
        const normalizedValue = String(value ?? '').trim();
        if (!normalizedValue) {
          return null;
        }
        return { label: normalizedLabel, value: normalizedValue };
      })
      .filter((item): item is JobImportantDate => Boolean(item));
  }

  return toLines(source).map((value) => ({ label: value, value }));
}

function parseDownloads(source: unknown): JobDownloadLink[] {
  if (!source) {
    return [];
  }

  if (Array.isArray(source)) {
    return source
      .map((item) => {
        if (typeof item === 'string') {
          return createDownloadFromString(item);
        }
        if (!item || typeof item !== 'object') {
          return null;
        }
        const record = item as Record<string, unknown>;
        const label = String(record.label ?? record.title ?? record.name ?? record.text ?? '').trim();
        const url = String(record.url ?? record.link ?? record.href ?? '').trim();
        if (!url) {
          return null;
        }
        const description = String(record.description ?? record.summary ?? '').trim() || undefined;
        return {
          label: label || url,
          url,
          description,
        };
      })
      .filter((item): item is JobDownloadLink => Boolean(item));
  }

  if (typeof source === 'object') {
    return Object.entries(source as Record<string, unknown>)
      .map(([label, value]) => {
        const url = String(value ?? '').trim();
        if (!url) {
          return null;
        }
        return { label, url };
      })
      .filter((item): item is JobDownloadLink => Boolean(item));
  }

  return toLines(source).map(createDownloadFromString).filter((item): item is JobDownloadLink => Boolean(item));
}

function createDownloadFromString(value: string): JobDownloadLink | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const parts = trimmed.split(/\s+-\s+/);
  if (parts.length === 2 && /^https?:\/\//i.test(parts[1])) {
    return { label: parts[0], url: parts[1] };
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return { label: trimmed, url: trimmed };
  }

  return null;
}

function parseSections(raw: Record<string, unknown>): JobDetailSections {
  const sections: JobDetailSections = { ...DEFAULT_SECTIONS };
  const content = ensureObject(raw.content) ?? ensureObject(raw.sections) ?? ensureObject(raw.details);

  if (content) {
    for (const [key, value] of Object.entries(content)) {
      const normalizedKey = key.toLowerCase();
      const match = SECTION_KEYS.find((entry) => entry.aliases.some((alias) => normalizedKey.includes(alias)));
      if (!match) {
        continue;
      }

      if (match.key === 'importantDates') {
        sections.importantDates = parseImportantDates(value);
      } else if (match.key === 'downloads') {
        sections.downloads = parseDownloads(value);
      } else {
        sections[match.key] = toLines(value);
      }
    }
  }

  const overview = raw.overview ?? raw.summary ?? raw.description;
  if (sections.overview.length === 0) {
    sections.overview = toLines(overview);
  }

  const eligibility = raw.eligibility ?? raw.qualifications;
  if (sections.eligibility.length === 0) {
    sections.eligibility = toLines(eligibility);
  }

  if (sections.importantDates.length === 0) {
    sections.importantDates = parseImportantDates(raw.important_dates ?? raw.timeline ?? raw.dates);
  }

  if (sections.howToApply.length === 0) {
    sections.howToApply = toLines(raw.how_to_apply ?? raw.application_process ?? raw.instructions);
  }

  if (sections.downloads.length === 0) {
    sections.downloads = parseDownloads(raw.downloads ?? raw.links);
  }

  return sections;
}

function parseRelatedJobs(raw: unknown): JobSummary[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }
      const record = item as Record<string, unknown>;
      const id = String(record.id ?? record.job_id ?? '').trim();
      const title = String(record.title ?? record.job_title ?? '').trim();
      if (!id || !title) {
        return null;
      }
      const organization = String(record.organization ?? record.department ?? record.company ?? '').trim() || undefined;
      const location = String(record.location ?? record.city ?? '').trim() || undefined;
      const state = String(record.state ?? record.region ?? '').trim() || undefined;
      const category = String(record.category ?? record.job_category ?? '').trim() || undefined;
      const publishedAt = String(record.published_at ?? record.posted_at ?? record.date ?? '').trim() || undefined;
      const applyUrl = String(record.apply_url ?? record.url ?? '').trim() || undefined;
      return {
        id,
        title,
        organization,
        location,
        state,
        category,
        publishedAt,
        applyUrl,
      };
    })
    .filter((item): item is JobSummary => Boolean(item));
}

async function httpGet<T>(path: string, searchParams?: Record<string, string | number | undefined>): Promise<T> {
  const url = new URL(path.replace(/^\//, ''), API_BASE_URL.endsWith('/') ? API_BASE_URL : `${API_BASE_URL}/`);

  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value === undefined || value === null) {
        return;
      }
      url.searchParams.set(key, String(value));
    });
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: DEFAULT_HEADERS,
  });

  if (!response.ok) {
    const error = new Error(`Request failed with status ${response.status}`);
    (error as Error & { status?: number }).status = response.status;
    throw error;
  }

  if (response.status === 204) {
    return {} as T;
  }

  const text = await response.text();
  if (!text) {
    return {} as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[jobDetail] Failed to parse JSON', error);
    }
    throw error;
  }
}

export async function fetchJobDetail(jobId: string): Promise<JobDetail> {
  if (!jobId) {
    throw new Error('A job id is required to fetch job details');
  }

  const response = await httpGet<Record<string, unknown>>(`/jobs/${jobId}`);
  const data = resolveDataEnvelope(response);

  const id = String(data.id ?? data.job_id ?? jobId);
  const title = String(data.title ?? data.job_title ?? '').trim();
  const organization = String(data.organization ?? data.department ?? data.company ?? '').trim() || undefined;
  const category = String(data.category ?? data.job_category ?? '').trim() || undefined;
  const state = String(data.state ?? data.region ?? data.location_state ?? '').trim() || undefined;
  const location = String(data.location ?? data.city ?? data.job_location ?? '').trim() || undefined;
  const shareUrl = String(data.share_url ?? data.permalink ?? data.url ?? '').trim() || undefined;
  const applyUrl = String(data.apply_url ?? data.application_url ?? data.application_link ?? '').trim() || undefined;

  const sections = parseSections(data);
  const relatedJobs = parseRelatedJobs((data.related_jobs ?? data.relatedJobs) as unknown);

  return {
    id,
    title: title || id,
    organization,
    category,
    state,
    location,
    shareUrl,
    applyUrl,
    sections,
    relatedJobs,
    raw: data,
  };
}

export async function fetchRelatedJobsByFilters(
  filters: Partial<Pick<JobDetail, 'category' | 'state'>> & { excludeJobId?: string }
): Promise<JobSummary[]> {
  const response = await httpGet<Record<string, unknown>>('/jobs', {
    category: filters.category,
    state: filters.state,
    exclude: filters.excludeJobId,
    platform: Platform.OS,
    limit: 10,
  });

  const data = resolveDataEnvelope(response);
  const items = Array.isArray(data) ? data : (data.jobs as unknown[] | undefined) ?? (data.items as unknown[] | undefined);

  if (!items) {
    return [];
  }

  return parseRelatedJobs(items);
}

