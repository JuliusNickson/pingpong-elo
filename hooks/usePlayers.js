import { useState, useEffect } from 'react';
import { getPlayers, addPlayer as addPlayerDb, removePlayer as removePlayerDb, updatePlayerRating, getPlayerStats } from '../utils/storage';
import { initDatabase } from '../utils/database';
import { DEFAULT_ELO } from '../constants/defaults';

export function usePlayers() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeAndLoadPlayers();
  }, []);

  const initializeAndLoadPlayers = async () => {
    try {
      await initDatabase();
      await loadPlayers();
    } catch (error) {
      console.error('Error initializing database:', error);
      setLoading(false);
    }
  };

  const loadPlayers = async () => {
    try {
      const storedPlayers = await getPlayers();
      
      // Fetch wins/losses for each player
      const playersWithStats = await Promise.all(
        storedPlayers.map(async (player) => {
          const stats = await getPlayerStats(player.id);
          return {
            ...player,
            wins: stats.wins,
            losses: stats.losses,
          };
        })
      );
      
      setPlayers(playersWithStats);
    } catch (error) {
      console.error('Error loading players:', error);
    } finally {
      setLoading(false);
    }
  };

  const addPlayer = async (name) => {
    const newPlayer = await addPlayerDb(name, DEFAULT_ELO);
    if (newPlayer) {
      await loadPlayers(); // Reload to get fresh data
    }
  };

  const removePlayer = async (playerId) => {
    const success = await removePlayerDb(playerId);
    if (success) {
      await loadPlayers();
    }
  };

  const updatePlayerElo = async (playerId, newElo) => {
    await updatePlayerRating(playerId, newElo);
    await loadPlayers(); // Reload to reflect changes
  };

  return {
    players,
    loading,
    addPlayer,
    removePlayer,
    updatePlayerElo,
    refreshPlayers: loadPlayers,
  };
}
