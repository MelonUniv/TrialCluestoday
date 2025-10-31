import React from 'react';
import type { Job } from '../services/jobs';

export interface JobCardProps {
  job: Job;
  onSelect?: (job: Job) => void;
  highlight?: boolean;
}

const formatDate = (value?: string): string | undefined => {
  if (!value) {
    return undefined;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const truncate = (value: string | undefined, maxLength = 160): string | undefined => {
  if (!value) {
    return value;
  }

  return value.length > maxLength ? `${value.slice(0, maxLength).trimEnd()}…` : value;
};

export const JobCard: React.FC<JobCardProps> = ({ job, onSelect, highlight = false }) => {
  const postedDate = formatDate((job.posted_at ?? job.raw_posted_at ?? job.date_posted) as string | undefined);
  const description = truncate((job.description ?? job.summary ?? job.snippet) as string | undefined);

  return (
    <article
      className="job-card"
      style={{
        display: 'grid',
        gap: '0.75rem',
        padding: '1.25rem',
        borderRadius: '1rem',
        border: '1px solid var(--job-card-border, rgba(15, 23, 42, 0.08))',
        background: highlight
          ? 'var(--job-card-highlight, linear-gradient(135deg, rgba(59,130,246,0.1), rgba(129,140,248,0.1)))'
          : 'var(--job-card-background, #ffffff)',
        boxShadow: 'var(--job-card-shadow, 0 10px 25px -15px rgba(15, 23, 42, 0.35))',
        transition: 'transform 160ms ease, box-shadow 160ms ease',
        cursor: onSelect ? 'pointer' : 'default',
      }}
      onClick={() => onSelect?.(job)}
    >
      <header
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.35rem',
        }}
      >
        <span
          style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--job-card-meta, rgba(71, 85, 105, 0.75))',
          }}
        >
          {job.company ?? job.company_name ?? 'Unknown company'}
        </span>
        <h3
          style={{
            margin: 0,
            fontSize: '1.1rem',
            fontWeight: 700,
            color: 'var(--job-card-title, #0f172a)',
            lineHeight: 1.35,
          }}
        >
          {job.title}
        </h3>
      </header>

      <p
        style={{
          margin: 0,
          color: 'var(--job-card-body, #1e293b)',
          lineHeight: 1.55,
          fontSize: '0.95rem',
        }}
      >
        {description ?? 'No description provided.'}
      </p>

      <footer
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.5rem',
          alignItems: 'center',
          color: 'var(--job-card-meta, rgba(71, 85, 105, 0.75))',
          fontSize: '0.8rem',
        }}
      >
        {job.location && (
          <span
            style={{
              padding: '0.35rem 0.65rem',
              borderRadius: '9999px',
              background: 'rgba(59,130,246,0.12)',
              color: 'var(--job-card-chip-text, #2563eb)',
              fontWeight: 600,
            }}
          >
            {job.location}
          </span>
        )}
        {job.category && (
          <span
            style={{
              padding: '0.35rem 0.65rem',
              borderRadius: '9999px',
              background: 'rgba(129,140,248,0.12)',
              color: 'var(--job-card-chip-text, #4f46e5)',
              fontWeight: 600,
            }}
          >
            {job.category}
          </span>
        )}
        {postedDate && <span>Posted {postedDate}</span>}
        {job.salary && <span>{job.salary}</span>}
      </footer>
    </article>
  );
};

export default JobCard;
