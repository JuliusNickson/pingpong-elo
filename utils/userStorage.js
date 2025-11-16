import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDatabase } from './database';

const USER_PROFILE_KEY = '@current_user_profile';

/**
 * Save current user profile to local storage
 * @param {Object} userProfile - User profile object with uid, displayName, email, rating, etc.
 * @returns {Promise<boolean>} Success status
 */
export async function saveCurrentUserProfile(userProfile) {
  try {
    if (Platform.OS === 'web') {
      await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(userProfile));
    } else {
      const db = getDatabase();
      if (!db) return false;
      
      // Check if profile exists
      const existing = await db.getFirstAsync('SELECT uid FROM user_profile WHERE id = 1');
      
      if (existing) {
        // Update existing profile
        await db.runAsync(
          `UPDATE user_profile SET 
            uid = ?, displayName = ?, email = ?, rating = ?, rd = ?, 
            matchesPlayed = ?, wins = ?, losses = ?, lastPlayed = ?, 
            synced = ?, lastModified = ?
          WHERE id = 1`,
          [
            userProfile.uid,
            userProfile.displayName,
            userProfile.email,
            userProfile.rating || 1000,
            userProfile.rd || 300,
            userProfile.matchesPlayed || 0,
            userProfile.wins || 0,
            userProfile.losses || 0,
            userProfile.lastPlayed || 0,
            userProfile.synced ? 1 : 0,
            Date.now()
          ]
        );
      } else {
        // Insert new profile
        await db.runAsync(
          `INSERT INTO user_profile 
            (id, uid, displayName, email, rating, rd, matchesPlayed, wins, losses, lastPlayed, synced, lastModified)
          VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            userProfile.uid,
            userProfile.displayName,
            userProfile.email,
            userProfile.rating || 1000,
            userProfile.rd || 300,
            userProfile.matchesPlayed || 0,
            userProfile.wins || 0,
            userProfile.losses || 0,
            userProfile.lastPlayed || 0,
            userProfile.synced ? 1 : 0,
            Date.now()
          ]
        );
      }
    }
    return true;
  } catch (error) {
    console.error('Error saving user profile:', error);
    return false;
  }
}

/**
 * Get current user profile from local storage
 * @returns {Promise<Object|null>} User profile or null
 */
export async function getCurrentUserProfile() {
  try {
    if (Platform.OS === 'web') {
      const jsonValue = await AsyncStorage.getItem(USER_PROFILE_KEY);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } else {
      const db = getDatabase();
      if (!db) return null;
      
      const profile = await db.getFirstAsync('SELECT * FROM user_profile WHERE id = 1');
      return profile || null;
    }
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
}

/**
 * Clear current user profile (on logout)
 * @returns {Promise<boolean>} Success status
 */
export async function clearCurrentUserProfile() {
  try {
    if (Platform.OS === 'web') {
      await AsyncStorage.removeItem(USER_PROFILE_KEY);
    } else {
      const db = getDatabase();
      if (!db) return false;
      
      await db.runAsync('DELETE FROM user_profile WHERE id = 1');
      // Also clear opponents cache
      await db.runAsync('DELETE FROM opponents');
    }
    return true;
  } catch (error) {
    console.error('Error clearing user profile:', error);
    return false;
  }
}

/**
 * Update current user's stats after a match
 * @param {Object} updates - Fields to update (rating, rd, wins, losses, etc.)
 * @returns {Promise<boolean>} Success status
 */
export async function updateCurrentUserStats(updates) {
  try {
    const currentProfile = await getCurrentUserProfile();
    if (!currentProfile) return false;
    
    const updatedProfile = {
      ...currentProfile,
      ...updates,
      lastModified: Date.now()
    };
    
    return await saveCurrentUserProfile(updatedProfile);
  } catch (error) {
    console.error('Error updating user stats:', error);
    return false;
  }
}

/**
 * Save/update opponent to cache
 * @param {Object} opponent - Opponent user profile
 * @returns {Promise<boolean>} Success status
 */
export async function cacheOpponent(opponent) {
  try {
    if (Platform.OS === 'web') {
      // For web, we don't need to cache opponents
      return true;
    }
    
    const db = getDatabase();
    if (!db) return false;
    
    const existing = await db.getFirstAsync(
      'SELECT uid FROM opponents WHERE uid = ?',
      [opponent.uid]
    );
    
    if (existing) {
      await db.runAsync(
        `UPDATE opponents SET 
          displayName = ?, email = ?, rating = ?, rd = ?,
          matchesPlayed = ?, wins = ?, losses = ?, lastPlayed = ?, lastFetched = ?
        WHERE uid = ?`,
        [
          opponent.displayName,
          opponent.email,
          opponent.rating || 1000,
          opponent.rd || 300,
          opponent.matchesPlayed || 0,
          opponent.wins || 0,
          opponent.losses || 0,
          opponent.lastPlayed || 0,
          Date.now(),
          opponent.uid
        ]
      );
    } else {
      await db.runAsync(
        `INSERT INTO opponents 
          (uid, displayName, email, rating, rd, matchesPlayed, wins, losses, lastPlayed, lastFetched)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          opponent.uid,
          opponent.displayName,
          opponent.email,
          opponent.rating || 1000,
          opponent.rd || 300,
          opponent.matchesPlayed || 0,
          opponent.wins || 0,
          opponent.losses || 0,
          opponent.lastPlayed || 0,
          Date.now()
        ]
      );
    }
    
    return true;
  } catch (error) {
    console.error('Error caching opponent:', error);
    return false;
  }
}

/**
 * Get cached opponent by UID
 * @param {string} uid - Opponent UID
 * @returns {Promise<Object|null>} Opponent profile or null
 */
export async function getCachedOpponent(uid) {
  try {
    if (Platform.OS === 'web') {
      return null; // Web doesn't cache
    }
    
    const db = getDatabase();
    if (!db) return null;
    
    const opponent = await db.getFirstAsync(
      'SELECT * FROM opponents WHERE uid = ?',
      [uid]
    );
    
    return opponent || null;
  } catch (error) {
    console.error('Error getting cached opponent:', error);
    return null;
  }
}
