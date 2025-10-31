import React from 'react';
import { StyleSheet, ScrollView, View } from 'react-native';
import { ActivityIndicator, Card, Text } from 'react-native-paper';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import { ENV } from '../config/environment';

const fetchHeadlines = async () => {
  const response = await axios.get('https://jsonplaceholder.typicode.com/posts?_limit=5');
  return response.data;
};

const HomeScreen = () => {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['headlines'],
    queryFn: fetchHeadlines,
  });

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text variant="titleLarge" style={styles.heading}>
        Welcome to Trial Clues Today
      </Text>
      <Text variant="bodyMedium" style={styles.subtitle}>
        Environment: {ENV.environment.toUpperCase()} | Firebase Project: {ENV.firebase.projectId}
      </Text>
      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionHeading}>
          Latest Headlines
        </Text>
        {isLoading && <ActivityIndicator animating />}
        {isError && (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="bodyMedium">
                Could not load headlines. {error?.message || 'Check your connection and try again.'}
              </Text>
            </Card.Content>
          </Card>
        )}
        {data?.map((item) => (
          <Card key={item.id} style={styles.card}>
            <Card.Title title={item.title} titleNumberOfLines={2} />
            <Card.Content>
              <Text variant="bodyMedium" numberOfLines={3}>
                {item.body}
              </Text>
            </Card.Content>
          </Card>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  heading: {
    marginBottom: 8,
  },
  subtitle: {
    marginBottom: 24,
  },
  section: {
    gap: 12,
  },
  sectionHeading: {
    marginBottom: 8,
  },
  card: {
    marginBottom: 12,
  },
});

export default HomeScreen;
