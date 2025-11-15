import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useMatches } from '../hooks/useMatches';
import MatchItem from '../components/MatchItem';
import { COLORS } from '../constants/colors';

export default function HistoryScreen() {
  const { matches, loading } = useMatches();

  // Sort matches by timestamp (most recent first)
  const sortedMatches = [...matches].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Match History</Text>
      
      {loading ? (
        <Text style={styles.loadingText}>Loading...</Text>
      ) : sortedMatches.length === 0 ? (
        <Text style={styles.emptyText}>
          No matches recorded yet. Record your first match to see history here!
        </Text>
      ) : (
        <FlatList
          data={sortedMatches}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <MatchItem match={item} />}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 20,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 40,
    paddingHorizontal: 40,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
});
