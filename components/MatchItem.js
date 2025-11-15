import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';

export default function MatchItem({ match }) {
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const eloChange = match.winnerNewElo - match.winnerOldElo;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.date}>{formatDate(match.timestamp)}</Text>
      </View>
      
      <View style={styles.matchInfo}>
        <View style={styles.playerSection}>
          <Text style={styles.winnerName}>{match.winnerName} 🏆</Text>
          <View style={styles.eloChange}>
            <Text style={styles.oldElo}>{match.winnerOldElo}</Text>
            <Text style={styles.arrow}>→</Text>
            <Text style={styles.newElo}>{match.winnerNewElo}</Text>
            <Text style={styles.change}>+{eloChange}</Text>
          </View>
        </View>

        <Text style={styles.vs}>vs</Text>

        <View style={styles.playerSection}>
          <Text style={styles.loserName}>{match.loserName}</Text>
          <View style={styles.eloChange}>
            <Text style={styles.oldElo}>{match.loserOldElo}</Text>
            <Text style={styles.arrow}>→</Text>
            <Text style={styles.newElo}>{match.loserNewElo}</Text>
            <Text style={[styles.change, styles.negative]}>
              {match.loserNewElo - match.loserOldElo}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    marginBottom: 12,
  },
  date: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  matchInfo: {
    flexDirection: 'column',
    gap: 12,
  },
  playerSection: {
    flexDirection: 'column',
    gap: 6,
  },
  winnerName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  loserName: {
    fontSize: 16,
    fontWeight: '400',
    color: COLORS.textSecondary,
  },
  vs: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontWeight: '600',
  },
  eloChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  oldElo: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  arrow: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  newElo: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  change: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.success,
  },
  negative: {
    color: COLORS.error,
  },
});
