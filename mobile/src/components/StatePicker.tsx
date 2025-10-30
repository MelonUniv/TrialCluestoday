import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  states: string[];
  selectedStates: string[];
  onToggle: (state: string) => void;
};

const StatePicker: React.FC<Props> = ({ states, selectedStates, onToggle }) => {
  const renderItem = ({ item }: { item: string }) => {
    const selected = selectedStates.includes(item);
    return (
      <Pressable onPress={() => onToggle(item)} style={[styles.item, selected && styles.itemSelected]}>
        <Text style={[styles.text, selected && styles.textSelected]}>{item}</Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={states}
        keyExtractor={(item) => item}
        renderItem={renderItem}
        numColumns={2}
        columnWrapperStyle={styles.column}
        contentContainerStyle={styles.content}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 8
  },
  column: {
    justifyContent: 'space-between'
  },
  content: {
    gap: 12
  },
  item: {
    flex: 1,
    marginHorizontal: 4,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff'
  },
  itemSelected: {
    backgroundColor: '#2563eb1a',
    borderColor: '#2563eb'
  },
  text: {
    fontSize: 14,
    color: '#111827',
    textAlign: 'center'
  },
  textSelected: {
    fontWeight: '600',
    color: '#1d4ed8'
  }
});

export default StatePicker;
