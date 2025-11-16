import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDatabase } from './database';
import { syncManager } from './sync';

const PLAYERS_KEY = '@pingpong_players';
const MATCHES_KEY = '@pingpong_matches';

/**
 * Get all players from database or AsyncStorage (web fallback)
 * @returns {Promise<Array>} Array of player objects
 */
export async function getPlayers() {
  try {
    // Web fallback using AsyncStorage
    if (Platform.OS === 'web') {
      const jsonValue = await AsyncStorage.getItem(PLAYERS_KEY);
      const players = jsonValue != null ? JSON.parse(jsonValue) : [];
      return players.map(player => ({
        ...player,
        elo: player.elo || player.rating,
      }));
    }
    
    // Native: Use SQLite
    const db = getDatabase();
    if (!db) return [];
    
    const result = await db.getAllAsync('SELECT * FROM players ORDER BY rating DESC');
    return result.map(player => ({
      ...player,
      wins: player.wins || 0,
      losses: player.losses || 0,
      elo: player.rating, // Map rating to elo for compatibility
    }));
  } catch (error) {
    console.error('Error reading players:', error);
    return [];
  }
}

/**
 * Add a new player
 * @param {string} name - Player name
 * @param {number} rating - Initial rating (default: 1000)
 * @returns {Promise<Object|null>} Created player object or null
 */
export async function addPlayer(name, rating = 1000) {
  try {
    let newPlayer;
    
    // Web fallback
    if (Platform.OS === 'web') {
      const players = await getPlayers();
      newPlayer = {
        id: Date.now(),
        name,
        rating,
        elo: rating,
        matchesPlayed: 0,
        wins: 0,
        losses: 0,
        synced: false
      };
      await AsyncStorage.setItem(PLAYERS_KEY, JSON.stringify([...players, newPlayer]));
    } else {
      // Native: Use SQLite
      const db = getDatabase();
      if (!db) return null;
      
      const result = await db.runAsync(
        'INSERT INTO players (name, rating, matchesPlayed, synced, lastModified) VALUES (?, ?, 0, 0, ?)',
        [name, rating, Date.now()]
      );
      
      newPlayer = {
        id: result.lastInsertRowId,
        name,
        rating,
        elo: rating,
        matchesPlayed: 0,
        wins: 0,
        losses: 0,
        synced: false
      };
    }
    
    // Sync to Firestore (optional - continues even if it fails)
    if (syncManager && typeof syncManager.syncPlayerToFirestore === 'function') {
      try {
        const firestoreId = await syncManager.syncPlayerToFirestore(newPlayer);
        
        // Update local record with Firestore ID
        if (firestoreId) {
          newPlayer.firestoreId = firestoreId;
          if (Platform.OS === 'web') {
            const players = await getPlayers();
            const updated = players.map(p => p.id === newPlayer.id ? { ...p, firestoreId, synced: true } : p);
            await AsyncStorage.setItem(PLAYERS_KEY, JSON.stringify(updated));
          } else {
            const db = getDatabase();
            if (db) {
              await db.runAsync(
                'UPDATE players SET firestoreId = ?, synced = 1 WHERE id = ?',
                [firestoreId, newPlayer.id]
              );
            }
          }
        }
      } catch (error) {
        console.log('Player saved locally, will sync to Firestore later:', error.message);
      }
    }
    
    return newPlayer;
  } catch (error) {
    console.error('Error adding player:', error);
    return null;
  }
}

/**
 * Update player rating
 * @param {number} playerId - Player ID
 * @param {number} newRating - New rating value
 * @returns {Promise<boolean>} Success status
 */
export async function updatePlayerRating(playerId, newRating) {
  try {
    // Web fallback
    if (Platform.OS === 'web') {
      const players = await getPlayers();
      const updated = players.map(p => 
        p.id === playerId 
          ? { ...p, rating: Math.round(newRating), elo: Math.round(newRating), matchesPlayed: (p.matchesPlayed || 0) + 1 }
          : p
      );
      await AsyncStorage.setItem(PLAYERS_KEY, JSON.stringify(updated));
      return true;
    }
    
    // Native: Use SQLite
    const db = getDatabase();
    if (!db) return false;
    
    await db.runAsync(
      'UPDATE players SET rating = ?, matchesPlayed = matchesPlayed + 1 WHERE id = ?',
      [Math.round(newRating), playerId]
    );
    return true;
  } catch (error) {
    console.error('Error updating player rating:', error);
    return false;
  }
}

/**
 * Remove a player
 * @param {number} playerId - Player ID
 * @returns {Promise<boolean>} Success status
 */
export async function removePlayer(playerId) {
  try {
    // Web fallback
    if (Platform.OS === 'web') {
      const players = await getPlayers();
      const filtered = players.filter(p => p.id !== playerId);
      await AsyncStorage.setItem(PLAYERS_KEY, JSON.stringify(filtered));
      return true;
    }
    
    // Native: Use SQLite
    const db = getDatabase();
    if (!db) return false;
    
    await db.runAsync('DELETE FROM players WHERE id = ?', [playerId]);
    return true;
  } catch (error) {
    console.error('Error removing player:', error);
    return false;
  }
}

/**
 * Get all matches from database or AsyncStorage
 * @returns {Promise<Array>} Array of match objects
 */
export async function getMatches() {
  try {
    // Web fallback
    if (Platform.OS === 'web') {
      const jsonValue = await AsyncStorage.getItem(MATCHES_KEY);
      return jsonValue != null ? JSON.parse(jsonValue) : [];
    }
    
    // Native: Use SQLite
    const db = getDatabase();
    if (!db) return [];
    
    const result = await db.getAllAsync(`
      SELECT 
        m.*,
        p1.name as playerA_name,
        p2.name as playerB_name,
        w.name as winner_name
      FROM matches m
      JOIN players p1 ON m.playerA = p1.id
      JOIN players p2 ON m.playerB = p2.id
      JOIN players w ON m.winner = w.id
      ORDER BY m.date DESC
    `);
    
    return result.map(match => ({
      id: match.id.toString(),
      winnerId: match.winner.toString(),
      winnerName: match.winner_name,
      loserId: (match.winner === match.playerA ? match.playerB : match.playerA).toString(),
      loserName: match.winner === match.playerA ? match.playerB_name : match.playerA_name,
      winnerOldElo: match.winner === match.playerA ? match.ratingA_before : match.ratingB_before,
      winnerNewElo: match.winner === match.playerA ? match.ratingA_after : match.ratingB_after,
      loserOldElo: match.winner === match.playerA ? match.ratingB_before : match.ratingA_before,
      loserNewElo: match.winner === match.playerA ? match.ratingB_after : match.ratingA_after,
      timestamp: match.date,
    }));
  } catch (error) {
    console.error('Error reading matches:', error);
    return [];
  }
}

/**
 * Add a new match
 * @param {Object} matchData - Match data
 * @returns {Promise<boolean>} Success status
 */
export async function addMatch(matchData) {
  try {
    let matchId;
    const timestamp = Date.now();
    
    // Web fallback
    if (Platform.OS === 'web') {
      const matches = await getMatches();
      const { playerA, playerB, winner, ratingA_before, ratingA_after, ratingB_before, ratingB_after } = matchData;
      const players = await getPlayers();
      const winnerPlayer = players.find(p => p.id === playerA || p.id === playerB && p.id === winner);
      const loserPlayer = players.find(p => (p.id === playerA || p.id === playerB) && p.id !== winner);
      
      const newMatch = {
        id: timestamp.toString(),
        winnerId: winner.toString(),
        winnerName: winnerPlayer?.name || '',
        loserId: (winner === playerA ? playerB : playerA).toString(),
        loserName: loserPlayer?.name || '',
        winnerOldElo: winner === playerA ? ratingA_before : ratingB_before,
        winnerNewElo: winner === playerA ? ratingA_after : ratingB_after,
        loserOldElo: winner === playerA ? ratingB_before : ratingA_before,
        loserNewElo: winner === playerA ? ratingB_after : ratingA_after,
        timestamp,
        synced: false
      };
      
      await AsyncStorage.setItem(MATCHES_KEY, JSON.stringify([newMatch, ...matches]));
      matchId = newMatch.id;
    } else {
      // Native: Use SQLite
      const db = getDatabase();
      if (!db) return false;
      
      const { playerA, playerB, winner, ratingA_before, ratingA_after, ratingB_before, ratingB_after } = matchData;
      
      const result = await db.runAsync(
        `INSERT INTO matches (playerA, playerB, winner, date, ratingA_before, ratingA_after, ratingB_before, ratingB_after, synced, lastModified)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
        [playerA, playerB, winner, timestamp, ratingA_before, ratingA_after, ratingB_before, ratingB_after, timestamp]
      );
      
      matchId = result.lastInsertRowId;

      // Update both players' ratings, match counts, and win/loss records in database
      
      // Update winner: increment wins
      await db.runAsync(
        'UPDATE players SET rating = ?, matchesPlayed = matchesPlayed + 1, wins = wins + 1, lastModified = ? WHERE id = ?',
        [winner === playerA ? ratingA_after : ratingB_after, timestamp, winner]
      );
      
      // Update loser: increment losses
      const loser = winner === playerA ? playerB : playerA;
      const loserRating = loser === playerA ? ratingA_after : ratingB_after;
      await db.runAsync(
        'UPDATE players SET rating = ?, matchesPlayed = matchesPlayed + 1, losses = losses + 1, lastModified = ? WHERE id = ?',
        [loserRating, timestamp, loser]
      );
    }
    
    // Update player stats on web
    if (Platform.OS === 'web') {
      const playersJson = await AsyncStorage.getItem(PLAYERS_KEY);
      const players = playersJson ? JSON.parse(playersJson) : [];
      
      const updatedPlayers = players.map(p => {
        if (p.id === playerA) {
          const isWinner = winner === playerA;
          return { 
            ...p, 
            rating: ratingA_after, 
            elo: ratingA_after, 
            matchesPlayed: (p.matchesPlayed || 0) + 1,
            wins: (p.wins || 0) + (isWinner ? 1 : 0),
            losses: (p.losses || 0) + (isWinner ? 0 : 1)
          };
        }
        if (p.id === playerB) {
          const isWinner = winner === playerB;
          return { 
            ...p, 
            rating: ratingB_after, 
            elo: ratingB_after, 
            matchesPlayed: (p.matchesPlayed || 0) + 1,
            wins: (p.wins || 0) + (isWinner ? 1 : 0),
            losses: (p.losses || 0) + (isWinner ? 0 : 1)
          };
        }
        return p;
      });
      
      await AsyncStorage.setItem(PLAYERS_KEY, JSON.stringify(updatedPlayers));
    }
    
    // Sync players to Firestore (their ratings changed)
    if (syncManager && typeof syncManager.syncPlayerToFirestore === 'function') {
      const { playerA, playerB, ratingA_after, ratingB_after } = matchData;
      
      try {
        // Get updated player data
        const players = await getPlayers();
        const playerAData = players.find(p => p.id === playerA);
        const playerBData = players.find(p => p.id === playerB);
        
        if (playerAData) {
          await syncManager.syncPlayerToFirestore({
            ...playerAData,
            rating: ratingA_after,
            matchesPlayed: (playerAData.matchesPlayed || 0) + 1
          });
        }
        
        if (playerBData) {
          await syncManager.syncPlayerToFirestore({
            ...playerBData,
            rating: ratingB_after,
            matchesPlayed: (playerBData.matchesPlayed || 0) + 1
          });
        }
      } catch (error) {
        console.log('Player updates will sync later:', error.message);
      }
    }
    
    // Sync to Firestore (optional - continues even if it fails)
    if (syncManager && typeof syncManager.syncMatchToFirestore === 'function') {
      try {
        const firestoreId = await syncManager.syncMatchToFirestore({
          ...matchData,
          timestamp
        });
        
        // Update local record with Firestore ID
        if (firestoreId) {
          if (Platform.OS === 'web') {
            const matches = await getMatches();
            const updated = matches.map(m => m.id === matchId ? { ...m, firestoreId, synced: true } : m);
            await AsyncStorage.setItem(MATCHES_KEY, JSON.stringify(updated));
          } else {
            const db = getDatabase();
            if (db) {
              await db.runAsync(
                'UPDATE matches SET firestoreId = ?, synced = 1 WHERE id = ?',
                [firestoreId, matchId]
              );
            }
          }
        }
      } catch (error) {
        console.log('Match saved locally, will sync to Firestore later:', error.message);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error adding match:', error);
    return false;
  }
}

/**
 * Clear all data from database or AsyncStorage
 * @returns {Promise<boolean>} Success status
 */
export async function clearAllData() {
  try {
    // Web fallback
    if (Platform.OS === 'web') {
      await AsyncStorage.multiRemove([PLAYERS_KEY, MATCHES_KEY]);
      return true;
    }
    
    // Native: Use SQLite
    const db = getDatabase();
    if (!db) return false;
    
    await db.execAsync(`
      DELETE FROM matches;
      DELETE FROM players;
    `);
    return true;
  } catch (error) {
    console.error('Error clearing data:', error);
    return false;
  }
}

/**
 * Get a single player by ID
 * @param {number} playerId - Player ID
 * @returns {Promise<Object|null>} Player object or null
 */
export async function getPlayerById(playerId) {
  try {
    // Web fallback
    if (Platform.OS === 'web') {
      const players = await getPlayers();
      return players.find(p => p.id === playerId) || null;
    }
    
    // Native: Use SQLite
    const db = getDatabase();
    if (!db) return null;
    
    const result = await db.getFirstAsync('SELECT * FROM players WHERE id = ?', [playerId]);
    if (result) {
      return {
        ...result,
        elo: result.rating,
        wins: 0,
        losses: 0,
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting player by ID:', error);
    return null;
  }
}

/**
 * Get player statistics (wins and losses)
 * @param {number} playerId - Player ID
 * @returns {Promise<Object>} Object with wins and losses
 */
export async function getPlayerStats(playerId) {
  try {
    // Web fallback
    if (Platform.OS === 'web') {
      const matches = await getMatches();
      const wins = matches.filter(m => m.winnerId === playerId.toString()).length;
      const totalMatches = matches.filter(m => 
        m.winnerId === playerId.toString() || m.loserId === playerId.toString()
      ).length;
      return {
        wins,
        losses: totalMatches - wins,
      };
    }
    
    // Native: Use SQLite
    const db = getDatabase();
    if (!db) return { wins: 0, losses: 0 };
    
    const wins = await db.getFirstAsync(
      'SELECT COUNT(*) as count FROM matches WHERE winner = ?',
      [playerId]
    );
    const totalMatches = await db.getFirstAsync(
      'SELECT COUNT(*) as count FROM matches WHERE playerA = ? OR playerB = ?',
      [playerId, playerId]
    );
    
    return {
      wins: wins?.count || 0,
      losses: (totalMatches?.count || 0) - (wins?.count || 0),
    };
  } catch (error) {
    console.error('Error getting player stats:', error);
    return { wins: 0, losses: 0 };
  }
}
