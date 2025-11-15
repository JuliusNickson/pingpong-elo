import React, { useState } from 'react';
import { View, Text, FlatList, TextInput, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { usePlayers } from '../hooks/usePlayers';
import Button from '../components/Button';
import { COLORS } from '../constants/colors';
import { DEFAULT_ELO } from '../constants/defaults';

export default function PlayersScreen() {
  const { players, addPlayer, removePlayer } = usePlayers();
  const [playerName, setPlayerName] = useState('');

  const handleAddPlayer = () => {
    if (playerName.trim() === '') {
      Alert.alert('Error', 'Please enter a player name');
      return;
    }
    
    addPlayer(playerName.trim());
    setPlayerName('');
  };

  const handleRemovePlayer = (playerId, playerName) => {
    Alert.alert(
      'Remove Player',
      `Are you sure you want to remove ${playerName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => removePlayer(playerId)
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Manage Players</Text>
      
      <View style={styles.addSection}>
        <TextInput
          style={styles.input}
          placeholder="Enter player name"
          placeholderTextColor={COLORS.textSecondary}
          value={playerName}
          onChangeText={setPlayerName}
          onSubmitEditing={handleAddPlayer}
        />
        <Button title="Add Player" onPress={handleAddPlayer} />
      </View>

      <FlatList
        data={players}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.playerItem}>
            <View style={styles.playerInfo}>
              <Text style={styles.playerName}>{item.name}</Text>
              <Text style={styles.playerElo}>ELO: {item.elo}</Text>
            </View>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => handleRemovePlayer(item.id, item.name)}
            >
              <Text style={styles.removeButtonText}>Remove</Text>
            </TouchableOpacity>
          </View>
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No players yet. Add your first player above!</Text>
        }
      />
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
  addSection: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  playerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  playerElo: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  removeButton: {
    backgroundColor: COLORS.error,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 40,
    paddingHorizontal: 40,
  },
});
