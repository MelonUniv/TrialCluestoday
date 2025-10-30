import React, { useCallback, useEffect, useMemo } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useBookmarks, type BookmarkedJob } from '../hooks/useBookmarks';

export interface JobCardProps {
  job: BookmarkedJob & {
    company?: string;
    location?: string;
    salary?: string;
    tags?: string[];
  };
  onPress?: () => void;
  onBookmarkToggle?: (job: BookmarkedJob) => void;
  isBookmarkedOverride?: boolean;
  style?: StyleProp<ViewStyle>;
}

const HEART_OUTLINE = '\u2661';
const HEART_FILLED = '\u2665';

const JobCard: React.FC<JobCardProps> = ({
  job,
  onPress,
  onBookmarkToggle,
  isBookmarkedOverride,
  style,
}) => {
  const { isBookmarked, toggleBookmark, updateBookmark } = useBookmarks();

  useEffect(() => {
    if (job?.id) {
      void updateBookmark(job);
    }
  }, [job, updateBookmark]);

  const bookmarked = useMemo(() => {
    if (typeof isBookmarkedOverride === 'boolean') {
      return isBookmarkedOverride;
    }
    return isBookmarked(job?.id);
  }, [isBookmarked, isBookmarkedOverride, job?.id]);

  const handleBookmarkPress = useCallback(
    (event: GestureResponderEvent) => {
      event.stopPropagation?.();
      if (!job?.id) {
        return;
      }

      if (onBookmarkToggle) {
        onBookmarkToggle(job);
        return;
      }

      void toggleBookmark(job);
    },
    [job, onBookmarkToggle, toggleBookmark],
  );

  const handleCardPress = useCallback(() => {
    if (onPress) {
      onPress();
    }
  }, [onPress]);

  const renderTags = () => {
    if (!job?.tags?.length) {
      return null;
    }
    return (
      <View style={styles.tagsContainer}>
        {job.tags.map(tag => (
          <View key={tag} style={styles.tagPill}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <Pressable style={[styles.card, style]} onPress={handleCardPress} accessibilityRole={onPress ? 'button' : undefined}>
      <View style={styles.headerRow}>
        <View style={styles.titleContainer}>
          <Text style={styles.titleText} numberOfLines={2}>
            {job?.title ?? 'Untitled role'}
          </Text>
          {!!job?.company && (
            <Text style={styles.subtitleText} numberOfLines={1}>
              {job.company}
            </Text>
          )}
          {!!job?.location && (
            <Text style={styles.metaText} numberOfLines={1}>
              {job.location}
            </Text>
          )}
        </View>
        <Pressable
          onPress={handleBookmarkPress}
          accessibilityRole="button"
          accessibilityLabel={bookmarked ? 'Remove bookmark' : 'Save job'}
          hitSlop={8}
          style={styles.bookmarkButton}
        >
          <Text style={[styles.heartIcon, bookmarked && styles.heartIconActive]}>{bookmarked ? HEART_FILLED : HEART_OUTLINE}</Text>
        </Pressable>
      </View>

      {!!job?.salary && <Text style={styles.salaryText}>{job.salary}</Text>}

      {!!job?.description && (
        <Text style={styles.descriptionText} numberOfLines={3}>
          {job.description}
        </Text>
      )}

      {renderTags()}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    marginVertical: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  titleContainer: {
    flex: 1,
    gap: 4,
  },
  titleText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#101828',
  },
  subtitleText: {
    fontSize: 16,
    color: '#475467',
  },
  metaText: {
    fontSize: 14,
    color: '#667085',
  },
  salaryText: {
    marginTop: 12,
    fontSize: 15,
    fontWeight: '500',
    color: '#1570EF',
  },
  descriptionText: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 20,
    color: '#475467',
  },
  tagsContainer: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagPill: {
    backgroundColor: '#EEF4FF',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagText: {
    fontSize: 13,
    color: '#175CD3',
    fontWeight: '500',
  },
  bookmarkButton: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  heartIcon: {
    fontSize: 24,
    color: '#98A2B3',
  },
  heartIconActive: {
    color: '#F04438',
  },
});

export default JobCard;

