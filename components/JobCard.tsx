import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
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
    <Pressable
      accessibilityRole={onSelect ? 'button' : undefined}
      accessibilityHint={onSelect ? 'Open job details' : undefined}
      onPress={onSelect ? () => onSelect(job) : undefined}
      android_ripple={onSelect ? { color: '#d1d5db' } : undefined}
      style={({ pressed }) => [
        styles.card,
        highlight && styles.cardHighlight,
        pressed && onSelect ? styles.cardPressed : null,
      ]}
    >
      <View style={styles.header}>
        <Text style={styles.company} numberOfLines={1}>
          {job.company ?? job.company_name ?? 'Unknown company'}
        </Text>
        <Text style={styles.title} numberOfLines={2}>
          {job.title}
        </Text>
      </View>

      <Text style={styles.description} numberOfLines={4}>
        {description ?? 'No description provided.'}
      </Text>

      <View style={styles.metaContainer}>
        {job.location && (
          <View style={[styles.chip, styles.locationChip]}>
            <Text style={styles.chipText}>{job.location}</Text>
          </View>
        )}
        {job.category && (
          <View style={[styles.chip, styles.categoryChip]}>
            <Text style={styles.chipText}>{job.category}</Text>
          </View>
        )}
        {postedDate && (
          <Text style={styles.metaText} numberOfLines={1}>
            Posted {postedDate}
          </Text>
        )}
        {job.salary && (
          <Text style={styles.metaText} numberOfLines={1}>
            {job.salary}
          </Text>
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(15, 23, 42, 0.12)',
    backgroundColor: '#ffffff',
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  cardHighlight: {
    borderColor: '#2563eb',
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
  },
  cardPressed: {
    opacity: 0.85,
  },
  header: {
    marginBottom: 8,
  },
  company: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: 'rgba(71, 85, 105, 0.9)',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: '#1e293b',
    marginBottom: 10,
  },
  metaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginHorizontal: -4,
    marginBottom: -8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(148, 163, 184, 0.16)',
    marginHorizontal: 4,
    marginBottom: 8,
  },
  locationChip: {
    backgroundColor: 'rgba(59, 130, 246, 0.16)',
  },
  categoryChip: {
    backgroundColor: 'rgba(129, 140, 248, 0.16)',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563eb',
  },
  metaText: {
    fontSize: 12,
    color: 'rgba(71, 85, 105, 0.9)',
    marginHorizontal: 4,
    marginBottom: 8,
  },
});

export default JobCard;
