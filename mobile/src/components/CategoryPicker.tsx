import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  categories: string[];
  selectedCategories: string[];
  onToggle: (category: string) => void;
};

const CategoryPicker: React.FC<Props> = ({ categories, selectedCategories, onToggle }) => {
  const renderItem = ({ item }: { item: string }) => {
    const selected = selectedCategories.includes(item);
    return (
      <Pressable onPress={() => onToggle(item)} style={[styles.item, selected && styles.itemSelected]}>
        <Text style={[styles.text, selected && styles.textSelected]}>{item}</Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        horizontal
        data={categories}
        keyExtractor={(item) => item}
        renderItem={renderItem}
        contentContainerStyle={styles.content}
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 12
  },
  content: {
    gap: 12
  },
  item: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff'
  },
  itemSelected: {
    backgroundColor: '#10b9811a',
    borderColor: '#10b981'
  },
  text: {
    fontSize: 14,
    color: '#111827'
  },
  textSelected: {
    fontWeight: '600',
    color: '#047857'
  }
});

export default CategoryPicker;
