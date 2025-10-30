import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Text } from 'react-native-paper';

const bookmarks = [
  {
    id: '1',
    title: 'How to get started with the app',
    description: 'Pin saved items and access them on any device once authentication is added.',
  },
  {
    id: '2',
    title: 'Enable push notifications',
    description: 'Notifications are managed centrally so users can be kept informed about updates.',
  },
];

const BookmarksScreen = () => (
  <View style={styles.container}>
    <Text variant="titleLarge" style={styles.heading}>
      Bookmarks
    </Text>
    {bookmarks.map((bookmark) => (
      <Card key={bookmark.id} style={styles.card}>
        <Card.Title title={bookmark.title} />
        <Card.Content>
          <Text variant="bodyMedium">{bookmark.description}</Text>
        </Card.Content>
      </Card>
    ))}
  </View>
);

const styles = StyleSheet.create({
  container: {
    padding: 16,
    flex: 1,
    backgroundColor: '#f8f5ff',
  },
  heading: {
    marginBottom: 16,
  },
  card: {
    marginBottom: 12,
  },
});

export default BookmarksScreen;
