import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { usePlayers } from '../hooks/usePlayers';
import PlayerCard from '../components/PlayerCard';
import Button from '../components/Button';
import { COLORS } from '../constants/colors';

export default function HomeScreen() {
  const router = useRouter();
  const { players, loading } = usePlayers();

  // Sort players by ELO rating (highest first)
  const sortedPlayers = [...players].sort((a, b) => b.elo - a.elo);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ping Pong Leaderboard</Text>
      
      <View style={styles.navigation}>
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => router.push('/players')}
        >
          <Text style={styles.navButtonText}>👥 Manage Players</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => router.push('/add-match')}
        >
          <Text style={styles.navButtonText}>🏓 Add Match</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => router.push('/history')}
        >
          <Text style={styles.navButtonText}>📜 History</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => router.push('/settings')}
        >
          <Text style={styles.navButtonText}>⚙️ Settings</Text>
        </TouchableOpacity>
      </View>
      
      {loading ? (
        <Text style={styles.loadingText}>Loading...</Text>
      ) : sortedPlayers.length === 0 ? (
        <Text style={styles.emptyText}>No players yet. Add some players to get started!</Text>
      ) : (
        <FlatList
          data={sortedPlayers}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <PlayerCard player={item} rank={index + 1} />
          )}
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
  navigation: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 20,
  },
  navButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  navButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
    marginTop: 20,
    paddingHorizontal: 40,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
});
