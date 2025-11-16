import { Platform } from 'react-native';
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  onSnapshot, 
  query, 
  orderBy,
  serverTimestamp,
  enableNetwork,
  disableNetwork
} from 'firebase/firestore';
import { getFirestoreDb, isFirebaseConfigured } from './firebase';
import { getDatabase } from './database';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SYNC_QUEUE_KEY = '@sync_queue';
const LAST_SYNC_KEY = '@last_sync';

/**
 * Sync Manager
 * Handles bidirectional sync between Firestore and local storage
 */
class SyncManager {
  constructor() {
    this.isOnline = true;
    this.isSyncing = false;
    this.listeners = [];
    this.unsubscribers = [];
  }

  /**
   * Initialize sync manager and start listeners
   */
  async initialize() {
    if (!isFirebaseConfigured()) {
      console.log('Firebase not configured, running in offline-only mode');
      return;
    }

    try {
      // Start real-time listeners for both collections
      this.startPlayersListener();
      this.startMatchesListener();
      
      // Process any pending sync queue
      await this.processSyncQueue();
      
      console.log('Sync manager initialized');
    } catch (error) {
      console.error('Error initializing sync:', error);
    }
  }

  /**
   * Add a listener for sync status changes
   */
  addSyncListener(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  /**
   * Notify all listeners of sync status change
   */
  notifyListeners(status) {
    this.listeners.forEach(callback => callback(status));
  }

  /**
   * Start real-time listener for players collection
   */
  startPlayersListener() {
    if (!isFirebaseConfigured()) return;

    try {
      const db = getFirestoreDb();
      const playersRef = collection(db, 'players');
      const q = query(playersRef, orderBy('rating', 'desc'));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
          const playerData = { id: change.doc.id, ...change.doc.data() };
          
          if (change.type === 'added' || change.type === 'modified') {
            await this.updateLocalPlayer(playerData);
          } else if (change.type === 'removed') {
            await this.removeLocalPlayer(playerData.id);
          }
        });

        this.notifyListeners({ type: 'players_synced', timestamp: Date.now() });
      }, (error) => {
        console.error('Players listener error:', error);
        this.notifyListeners({ type: 'sync_error', error });
      });

      this.unsubscribers.push(unsubscribe);
    } catch (error) {
      console.error('Error starting players listener:', error);
    }
  }

  /**
   * Start real-time listener for matches collection
   */
  startMatchesListener() {
    if (!isFirebaseConfigured()) return;

    try {
      const db = getFirestoreDb();
      const matchesRef = collection(db, 'matches');
      const q = query(matchesRef, orderBy('timestamp', 'desc'));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
          const matchData = { id: change.doc.id, ...change.doc.data() };
          
          if (change.type === 'added' || change.type === 'modified') {
            await this.updateLocalMatch(matchData);
          }
        });

        this.notifyListeners({ type: 'matches_synced', timestamp: Date.now() });
      }, (error) => {
        console.error('Matches listener error:', error);
        this.notifyListeners({ type: 'sync_error', error });
      });

      this.unsubscribers.push(unsubscribe);
    } catch (error) {
      console.error('Error starting matches listener:', error);
    }
  }

  /**
   * Update local player from Firestore data
   */
  async updateLocalPlayer(playerData) {
    try {
      // Validate playerData
      if (!playerData || !playerData.id) {
        console.warn('Invalid player data received from Firestore');
        return;
      }

      if (Platform.OS === 'web') {
        // Web: Use AsyncStorage
        const playersJson = await AsyncStorage.getItem('@pingpong_players');
        const players = playersJson ? JSON.parse(playersJson) : [];
        
        const existingIndex = players.findIndex(p => p.id === playerData.id);
        const updatedPlayer = {
          id: playerData.id,
          name: playerData.name,
          rating: playerData.rating,
          elo: playerData.rating,
          matchesPlayed: playerData.matchesPlayed || 0,
          wins: playerData.wins || 0,
          losses: playerData.losses || 0,
          firestoreId: playerData.id,
          synced: true
        };

        if (existingIndex >= 0) {
          players[existingIndex] = updatedPlayer;
        } else {
          players.push(updatedPlayer);
        }

        await AsyncStorage.setItem('@pingpong_players', JSON.stringify(players));
      } else {
        // Native: Use SQLite
        const db = getDatabase();
        if (!db) {
          console.warn('Database not available for player sync');
          return;
        }

        // Check if player exists
        const existing = await db.getFirstAsync(
          'SELECT id FROM players WHERE firestoreId = ?',
          [playerData.id]
        );

        if (existing) {
          await db.runAsync(
            `UPDATE players SET name = ?, rating = ?, matchesPlayed = ?, wins = ?, losses = ?, synced = 1 
             WHERE firestoreId = ?`,
            [playerData.name, playerData.rating, playerData.matchesPlayed || 0, 
             playerData.wins || 0, playerData.losses || 0, playerData.id]
          );
        } else {
          try {
            await db.runAsync(
              `INSERT INTO players (name, rating, matchesPlayed, wins, losses, firestoreId, synced) 
               VALUES (?, ?, ?, ?, ?, ?, 1)`,
              [playerData.name, playerData.rating, playerData.matchesPlayed || 0, 
               playerData.wins || 0, playerData.losses || 0, playerData.id]
            );
          } catch (insertError) {
            // If unique constraint fails, update the existing record instead
            if (insertError.message && insertError.message.includes('UNIQUE constraint')) {
              console.log('Player already exists, updating instead');
              await db.runAsync(
                `UPDATE players SET name = ?, rating = ?, matchesPlayed = ?, wins = ?, losses = ?, synced = 1 
                 WHERE firestoreId = ?`,
                [playerData.name, playerData.rating, playerData.matchesPlayed || 0, 
                 playerData.wins || 0, playerData.losses || 0, playerData.id]
              );
            } else {
              throw insertError;
            }
          }
        }
      }
    } catch (error) {
      console.error('Error updating local player:', error?.message || error);
      // Don't throw - continue with other syncs
    }
  }

  /**
   * Update local match from Firestore data
   */
  async updateLocalMatch(matchData) {
    try {
      // Validate matchData
      if (!matchData || !matchData.id) {
        console.warn('Invalid match data received from Firestore');
        return;
      }

      if (Platform.OS === 'web') {
        // Web: Use AsyncStorage
        const matchesJson = await AsyncStorage.getItem('@pingpong_matches');
        const matches = matchesJson ? JSON.parse(matchesJson) : [];
        
        const existingIndex = matches.findIndex(m => m.id === matchData.id || m.firestoreId === matchData.id);
        if (existingIndex < 0) {
          matches.push({
            ...matchData,
            firestoreId: matchData.id,
            synced: true
          });
          await AsyncStorage.setItem('@pingpong_matches', JSON.stringify(matches));
        }
      } else {
        // Native: Use SQLite
        const db = getDatabase();
        if (!db) {
          console.warn('Database not available for match sync');
          return;
        }

        // First check if already exists by firestoreId
        const existing = await db.getFirstAsync(
          'SELECT id FROM matches WHERE firestoreId = ?',
          [matchData.id]
        );

        if (existing) {
          // Already exists, just return
          console.log('Match already exists locally, skipping');
          return;
        }

        // Check if there's a recent unsynced match with same data (this is the one we just created)
        const recentMatch = await db.getFirstAsync(
          `SELECT id FROM matches 
           WHERE playerA = ? AND playerB = ? AND winner = ? 
           AND firestoreId IS NULL 
           AND ABS(date - ?) < 5000
           ORDER BY date DESC LIMIT 1`,
          [matchData.playerA, matchData.playerB, matchData.winner, matchData.timestamp]
        );

        if (recentMatch) {
          // This is our local match, just update it with the Firestore ID
          await db.runAsync(
            'UPDATE matches SET firestoreId = ?, synced = 1 WHERE id = ?',
            [matchData.id, recentMatch.id]
          );
          console.log('Updated local match with Firestore ID');
          return;
        }

        // New match from another device, insert it
        try {
          await db.runAsync(
            `INSERT INTO matches (playerA, playerB, winner, date, ratingA_before, ratingA_after, 
             ratingB_before, ratingB_after, firestoreId, synced) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
            [
              matchData.playerA, matchData.playerB, matchData.winner, matchData.timestamp,
              matchData.ratingA_before, matchData.ratingA_after,
              matchData.ratingB_before, matchData.ratingB_after,
              matchData.id
            ]
          );
          console.log('Inserted new match from Firebase');
        } catch (insertError) {
          // If unique constraint still fails somehow, just update
          if (insertError.message && insertError.message.includes('UNIQUE constraint')) {
            console.log('Match collision detected, updating existing');
            await db.runAsync(
              `UPDATE matches SET playerA = ?, playerB = ?, winner = ?, date = ?, 
               ratingA_before = ?, ratingA_after = ?, ratingB_before = ?, ratingB_after = ?, synced = 1
               WHERE firestoreId = ?`,
              [
                matchData.playerA, matchData.playerB, matchData.winner, matchData.timestamp,
                matchData.ratingA_before, matchData.ratingA_after,
                matchData.ratingB_before, matchData.ratingB_after,
                matchData.id
              ]
            );
          } else {
            throw insertError;
          }
        }
      }
    } catch (error) {
      console.error('Error updating local match:', error?.message || error);
      // Don't throw - continue with other syncs
    }
  }

  /**
   * Remove local player
   */
  async removeLocalPlayer(playerId) {
    try {
      if (Platform.OS === 'web') {
        const playersJson = await AsyncStorage.getItem('@pingpong_players');
        const players = playersJson ? JSON.parse(playersJson) : [];
        const filtered = players.filter(p => p.id !== playerId);
        await AsyncStorage.setItem('@pingpong_players', JSON.stringify(filtered));
      } else {
        const db = getDatabase();
        if (!db) return;
        await db.runAsync('DELETE FROM players WHERE firestoreId = ?', [playerId]);
      }
    } catch (error) {
      console.error('Error removing local player:', error);
    }
  }

  /**
   * Sync player to Firestore
   */
  async syncPlayerToFirestore(playerData) {
    if (!isFirebaseConfigured()) {
      await this.addToSyncQueue({ type: 'player', data: playerData });
      return;
    }

    try {
      const db = getFirestoreDb();
      const playerId = playerData.firestoreId || doc(collection(db, 'players')).id;
      
      await setDoc(doc(db, 'players', playerId), {
        name: playerData.name,
        rating: playerData.rating || playerData.elo,
        matchesPlayed: playerData.matchesPlayed || 0,
        wins: playerData.wins || 0,
        losses: playerData.losses || 0,
        updatedAt: serverTimestamp()
      });

      return playerId;
    } catch (error) {
      console.error('Error syncing player to Firestore:', error);
      await this.addToSyncQueue({ type: 'player', data: playerData });
      throw error;
    }
  }

  /**
   * Sync match to Firestore
   */
  async syncMatchToFirestore(matchData) {
    if (!isFirebaseConfigured()) {
      await this.addToSyncQueue({ type: 'match', data: matchData });
      return;
    }

    try {
      const db = getFirestoreDb();
      const matchId = matchData.firestoreId || doc(collection(db, 'matches')).id;
      
      await setDoc(doc(db, 'matches', matchId), {
        playerA: matchData.playerA,
        playerB: matchData.playerB,
        winner: matchData.winner,
        timestamp: matchData.timestamp || Date.now(),
        ratingA_before: matchData.ratingA_before,
        ratingA_after: matchData.ratingA_after,
        ratingB_before: matchData.ratingB_before,
        ratingB_after: matchData.ratingB_after,
        createdAt: serverTimestamp()
      });

      return matchId;
    } catch (error) {
      console.error('Error syncing match to Firestore:', error);
      await this.addToSyncQueue({ type: 'match', data: matchData });
      throw error;
    }
  }

  /**
   * Add item to sync queue for later processing
   */
  async addToSyncQueue(item) {
    try {
      const queueJson = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
      const queue = queueJson ? JSON.parse(queueJson) : [];
      queue.push({ ...item, queuedAt: Date.now() });
      await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
      console.log('Added to sync queue:', item.type);
    } catch (error) {
      console.error('Error adding to sync queue:', error);
    }
  }

  /**
   * Process pending sync queue
   */
  async processSyncQueue() {
    if (!isFirebaseConfigured() || this.isSyncing) return;

    try {
      this.isSyncing = true;
      const queueJson = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
      const queue = queueJson ? JSON.parse(queueJson) : [];

      if (queue.length === 0) {
        this.isSyncing = false;
        return;
      }

      console.log(`Processing ${queue.length} items in sync queue`);
      this.notifyListeners({ type: 'sync_started', count: queue.length });

      for (const item of queue) {
        try {
          if (item.type === 'player') {
            await this.syncPlayerToFirestore(item.data);
          } else if (item.type === 'match') {
            await this.syncMatchToFirestore(item.data);
          }
        } catch (error) {
          console.error('Error processing queue item:', error);
          // Keep item in queue if sync fails
          continue;
        }
      }

      // Clear processed queue
      await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify([]));
      await AsyncStorage.setItem(LAST_SYNC_KEY, JSON.stringify(Date.now()));
      
      this.notifyListeners({ type: 'sync_completed', timestamp: Date.now() });
      console.log('Sync queue processed successfully');
    } catch (error) {
      console.error('Error processing sync queue:', error);
      this.notifyListeners({ type: 'sync_error', error });
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Get sync queue status
   */
  async getSyncStatus() {
    try {
      const queueJson = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
      const queue = queueJson ? JSON.parse(queueJson) : [];
      const lastSyncJson = await AsyncStorage.getItem(LAST_SYNC_KEY);
      const lastSync = lastSyncJson ? JSON.parse(lastSyncJson) : null;

      return {
        pendingCount: queue.length,
        lastSync,
        isOnline: this.isOnline,
        isSyncing: this.isSyncing,
        isConfigured: isFirebaseConfigured()
      };
    } catch (error) {
      console.error('Error getting sync status:', error);
      return {
        pendingCount: 0,
        lastSync: null,
        isOnline: false,
        isSyncing: false,
        isConfigured: false
      };
    }
  }

  /**
   * Manually trigger sync
   */
  async triggerSync() {
    await this.processSyncQueue();
  }

  /**
   * Clean up listeners
   */
  cleanup() {
    this.unsubscribers.forEach(unsubscribe => unsubscribe());
    this.unsubscribers = [];
    this.listeners = [];
  }
}

// Export singleton instance
export const syncManager = new SyncManager();
