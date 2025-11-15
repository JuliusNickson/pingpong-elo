import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';

export default function PlayerCard({ player, rank }) {
  const getMedalEmoji = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `${rank}.`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.rank}>{getMedalEmoji(rank)}</Text>
      <View style={styles.info}>
        <Text style={styles.name}>{player.name}</Text>
        <Text style={styles.stats}>
          Wins: {player.wins || 0} | Losses: {player.losses || 0}
        </Text>
      </View>
      <View style={styles.eloContainer}>
        <Text style={styles.elo}>{player.elo}</Text>
        <Text style={styles.eloLabel}>ELO</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rank: {
    fontSize: 24,
    fontWeight: 'bold',
    marginRight: 16,
    minWidth: 40,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  stats: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  eloContainer: {
    alignItems: 'center',
  },
  elo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  eloLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
});
