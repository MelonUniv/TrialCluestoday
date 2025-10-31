import React, { useCallback } from 'react';
import { Button, ScrollView, StyleSheet, Text, View } from 'react-native';
import { US_STATES } from '../constants/states';
import { JOB_CATEGORIES } from '../constants/categories';
import StatePicker from '../components/StatePicker';
import CategoryPicker from '../components/CategoryPicker';
import { usePreferences } from '../context/PreferencesContext';
import { useBookmarks } from '../context/BookmarksContext';

const SettingsScreen: React.FC = () => {
  const { preferredStates, preferredCategories, updatePreferredStates, updatePreferredCategories } =
    usePreferences();
  const { bookmarkJob, removeBookmark, bookmarks } = useBookmarks();

  const handleToggleState = useCallback(
    (state: string) => {
      if (preferredStates.includes(state)) {
        updatePreferredStates(preferredStates.filter((item) => item !== state));
      } else {
        updatePreferredStates([...preferredStates, state]);
      }
    },
    [preferredStates, updatePreferredStates]
  );

  const handleToggleCategory = useCallback(
    (category: string) => {
      if (preferredCategories.includes(category)) {
        updatePreferredCategories(preferredCategories.filter((item) => item !== category));
      } else {
        updatePreferredCategories([...preferredCategories, category]);
      }
    },
    [preferredCategories, updatePreferredCategories]
  );

  const handleBookmarkSample = useCallback(() => {
    const deadline = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
    bookmarkJob({ id: 'sample-job', title: 'Sample bookmarked job', deadline });
  }, [bookmarkJob]);

  const handleRemoveSample = useCallback(() => {
    removeBookmark('sample-job');
  }, [removeBookmark]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Notification Preferences</Text>
      <Text style={styles.subheading}>Select the states you want to receive job notifications for.</Text>
      <StatePicker states={US_STATES} selectedStates={preferredStates} onToggle={handleToggleState} />

      <View style={styles.section}>
        <Text style={styles.subheading}>Choose job categories to prioritise.</Text>
        <CategoryPicker
          categories={JOB_CATEGORIES}
          selectedCategories={preferredCategories}
          onToggle={handleToggleCategory}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>Bookmark reminders</Text>
        <Text style={styles.subheading}>
          Schedule a local reminder when a bookmarked job is approaching its deadline. Use the buttons below to
          simulate bookmarking a job while backend integration is in progress.
        </Text>
        <View style={styles.buttonRow}>
          <Button title="Bookmark sample job" onPress={handleBookmarkSample} />
          <Button title="Clear sample" onPress={handleRemoveSample} color="#ef4444" />
        </View>
        {bookmarks.length > 0 && (
          <View style={styles.bookmarkList}>
            {bookmarks.map((bookmark) => (
              <View key={bookmark.id} style={styles.bookmarkItem}>
                <Text style={styles.bookmarkTitle}>{bookmark.title}</Text>
                <Text style={styles.bookmarkMeta}>
                  Deadline: {new Date(bookmark.deadline).toLocaleString()}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb'
  },
  content: {
    padding: 24,
    paddingBottom: 80
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    color: '#111827'
  },
  subheading: {
    fontSize: 16,
    color: '#4b5563'
  },
  section: {
    marginTop: 24
  },
  buttonRow: {
    flexDirection: 'row',
    columnGap: 12,
    marginTop: 16
  },
  bookmarkList: {
    marginTop: 16,
    rowGap: 12
  },
  bookmarkItem: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb'
  },
  bookmarkTitle: {
    fontWeight: '600',
    color: '#111827'
  },
  bookmarkMeta: {
    marginTop: 4,
    color: '#4b5563'
  }
});

export default SettingsScreen;
