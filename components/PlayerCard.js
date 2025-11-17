import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { COLORS } from '../constants/colors';
import { FONTS, FONT_SIZES } from '../constants/fonts';

export default function PlayerCard({ player, rank }) {
  const [displayElo, setDisplayElo] = useState(player.elo);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;

  // Animate ELO count up when it changes
  useEffect(() => {
    const start = displayElo;
    const end = player.elo;
    const duration = 800;
    const startTime = Date.now();

    const animateElo = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);
      const easeOutQuad = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (end - start) * easeOutQuad);
      
      setDisplayElo(current);
      
      if (progress < 1) {
        requestAnimationFrame(animateElo);
      }
    };

    if (start !== end) {
      requestAnimationFrame(animateElo);
    }
  }, [player.elo]);

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.98,
        useNativeDriver: true,
      }),
      Animated.timing(glowOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        friction: 3,
      }),
      Animated.timing(glowOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const getMedalEmoji = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `${rank}.`;
  };

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={[
        styles.container,
        {
          transform: [{ scale: scaleAnim }],
        },
      ]}>
        {/* Glow layer behind the card */}
        <Animated.View style={[
          styles.glowLayer,
          {
            opacity: glowOpacity,
          },
        ]} />
        
        <Text style={styles.rank}>{getMedalEmoji(rank)}</Text>
        <View style={styles.info}>
          <Text style={styles.name}>{player.name}</Text>
          <Text style={styles.stats}>
            Wins: {player.wins || 0} | Losses: {player.losses || 0}
          </Text>
        </View>
        <View style={styles.eloContainer}>
          <Text style={styles.elo}>{displayElo}</Text>
          <Text style={styles.eloLabel}>ELO</Text>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'visible',
  },
  glowLayer: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
    zIndex: -1,
  },
  rank: {
    fontSize: FONT_SIZES.xlarge,
    fontFamily: FONTS.title,
    marginRight: 16,
    minWidth: 40,
    color: COLORS.text,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: FONT_SIZES.large,
    fontFamily: FONTS.subheading,
    color: COLORS.text,
    marginBottom: 4,
  },
  stats: {
    fontSize: FONT_SIZES.small,
    fontFamily: FONTS.body,
    color: COLORS.textSecondary,
  },
  eloContainer: {
    alignItems: 'center',
  },
  elo: {
    fontSize: FONT_SIZES.xlarge,
    fontFamily: FONTS.numbers,
    color: COLORS.primary,
  },
  eloLabel: {
    fontSize: FONT_SIZES.xsmall,
    fontFamily: FONTS.body,
    color: COLORS.textSecondary,
  },
});
