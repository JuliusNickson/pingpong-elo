import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { usePlayers } from '../hooks/usePlayers';
import { useMatches } from '../hooks/useMatches';
import Button from '../components/Button';
import { COLORS } from '../constants/colors';
import { calculateNewElo } from '../utils/elo';

export default function AddMatchScreen() {
  const { players, updatePlayerElo } = usePlayers();
  const { addMatch } = useMatches();
  
  const [winner, setWinner] = useState('');
  const [loser, setLoser] = useState('');

  const handleAddMatch = () => {
    if (!winner || !loser) {
      Alert.alert('Error', 'Please select both winner and loser');
      return;
    }

    if (winner === loser) {
      Alert.alert('Error', 'Winner and loser must be different players');
      return;
    }

    const winnerPlayer = players.find(p => p.id === winner);
    const loserPlayer = players.find(p => p.id === loser);

    if (!winnerPlayer || !loserPlayer) {
      Alert.alert('Error', 'Selected players not found');
      return;
    }

    // Calculate new ELO ratings with dynamic K-factor based on RD
    const { 
      winnerNewElo, 
      loserNewElo, 
      winnerNewRd, 
      loserNewRd,
      winnerK,
      loserK,
    } = calculateNewElo(
      winnerPlayer.elo,
      loserPlayer.elo,
      winnerPlayer.rd || 300,
      loserPlayer.rd || 300
    );

    // Update player ELOs, RD, and win/loss records
    updatePlayerElo(winner, winnerNewElo, winnerNewRd, true);
    updatePlayerElo(loser, loserNewElo, loserNewRd, false);

    // Add match to history with database schema
    addMatch({
      playerA: winner,
      playerB: loser,
      winner: winner,
      ratingA_before: winnerPlayer.elo,
      ratingA_after: winnerNewElo,
      ratingB_before: loserPlayer.elo,
      ratingB_after: loserNewElo,
    });

    // Reset form
    setWinner('');
    setLoser('');

    Alert.alert(
      'Match Recorded!',
      `${winnerPlayer.name} defeated ${loserPlayer.name}\n\n` +
      `${winnerPlayer.name}: ${winnerPlayer.elo} → ${winnerNewElo}\n` +
      `${loserPlayer.name}: ${loserPlayer.elo} → ${loserNewElo}`
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Add Match Result</Text>

      {players.length < 2 ? (
        <Text style={styles.emptyText}>
          You need at least 2 players to record a match. Please add players first.
        </Text>
      ) : (
        <>
          <View style={styles.section}>
            <Text style={styles.label}>Winner</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={winner}
                onValueChange={setWinner}
                style={styles.picker}
                itemStyle={styles.pickerItem}
              >
                <Picker.Item label="Select Winner" value="" color={COLORS.textSecondary} />
                {players.map(player => (
                  <Picker.Item
                    key={player.id}
                    label={`${player.name} (${player.elo})`}
                    value={player.id}
                    color={COLORS.text}
                  />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Loser</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={loser}
                onValueChange={setLoser}
                style={styles.picker}
                itemStyle={styles.pickerItem}
              >
                <Picker.Item label="Select Loser" value="" color={COLORS.textSecondary} />
                {players.map(player => (
                  <Picker.Item
                    key={player.id}
                    label={`${player.name} (${player.elo})`}
                    value={player.id}
                    color={COLORS.text}
                  />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <Button title="Record Match" onPress={handleAddMatch} />
          </View>
        </>
      )}
    </ScrollView>
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
    marginBottom: 30,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  pickerContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    minHeight: Platform.OS === 'ios' ? 180 : 50,
  },
  picker: {
    color: COLORS.text,
    height: Platform.OS === 'ios' ? 180 : 50,
  },
  pickerItem: {
    fontSize: 18,
    height: Platform.OS === 'ios' ? 180 : 50,
    color: COLORS.text,
  },
  buttonContainer: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 40,
    paddingHorizontal: 40,
  },
});
