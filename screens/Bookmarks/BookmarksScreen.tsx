import React, { useCallback } from 'react';
import { FlatList, StyleSheet, Text, View, Pressable } from 'react-native';

import JobCard from '../../components/JobCard';
import { useBookmarks, type BookmarkedJob } from '../../hooks/useBookmarks';

type NavigationLike = {
  navigate?: (screen: string, params?: Record<string, unknown>) => void;
};

interface BookmarksScreenProps {
  navigation?: NavigationLike;
}

const BookmarksScreen: React.FC<BookmarksScreenProps> = ({ navigation }) => {
  const { bookmarks, removeBookmark } = useBookmarks();

  const handleOpenJob = useCallback(
    (job: BookmarkedJob) => {
      if (navigation?.navigate) {
        navigation.navigate('JobDetail', { jobId: job.id, job });
      }
    },
    [navigation],
  );

  const handleRemove = useCallback(
    async (job: BookmarkedJob) => {
      await removeBookmark(job.id);
    },
    [removeBookmark],
  );

  const renderItem = useCallback(
    ({ item }: { item: BookmarkedJob }) => (
      <View style={styles.itemContainer}>
        <JobCard
          job={item}
          onPress={() => handleOpenJob(item)}
          onBookmarkToggle={() => handleRemove(item)}
          isBookmarkedOverride
        />
        <Pressable style={styles.removeButton} onPress={() => handleRemove(item)}>
          <Text style={styles.removeButtonText}>Remove bookmark</Text>
        </Pressable>
      </View>
    ),
    [handleOpenJob, handleRemove],
  );

  const keyExtractor = useCallback((item: BookmarkedJob) => item.id, []);

  if (!bookmarks.length) {
    return (
      <View style={styles.emptyStateContainer}>
        <Text style={styles.emptyStateTitle}>No saved jobs yet</Text>
        <Text style={styles.emptyStateSubtitle}>
          Tap the heart icon on a job to save it for later. Your saved roles will appear here.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={bookmarks}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      contentContainerStyle={styles.listContent}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
    />
  );
};

const styles = StyleSheet.create({
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  separator: {
    height: 12,
  },
  itemContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 12,
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  removeButton: {
    marginTop: 8,
    alignSelf: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#FEE4E2',
  },
  removeButtonText: {
    color: '#B42318',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyStateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#F8FAFC',
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

export default BookmarksScreen;

