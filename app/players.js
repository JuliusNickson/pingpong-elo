import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { getLeaderboard } from '../utils/userProfile';
import PlayerCard from '../components/PlayerCard';
import { COLORS } from '../constants/colors';
import { FONTS, FONT_SIZES } from '../constants/fonts';

export default function PlayersScreen() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const leaderboard = await getLeaderboard(50);
      setPlayers(leaderboard);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Top Players</Text>
      
      {players.length === 0 ? (
        <Text style={styles.emptyText}>No players yet. Be the first to play!</Text>
      ) : (
        <FlatList
          data={players}
          keyExtractor={(item) => item.uid}
          renderItem={({ item, index }) => (
            <PlayerCard 
              player={{
                id: item.uid,
                name: item.displayName,
                elo: item.rating,
                rating: item.rating,
                rd: item.rd,
                matchesPlayed: item.matchesPlayed,
                wins: item.wins,
                losses: item.losses
              }} 
              rank={index + 1}
            />
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  title: {
    fontSize: FONT_SIZES.xlarge,
    fontFamily: FONTS.title,
    color: COLORS.text,
    textAlign: 'center',
    padding: 20,
    paddingBottom: 10,
  },
  listContent: {
    padding: 16,
  },
  emptyText: {
    fontSize: FONT_SIZES.medium,
    fontFamily: FONTS.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 40,
    paddingHorizontal: 40,
  },
});
