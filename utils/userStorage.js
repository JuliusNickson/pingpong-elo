import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_PROFILE_KEY = '@current_user_profile';

/**
 * Save current user profile to local storage
 * @param {Object} userProfile - User profile object with uid, displayName, email, rating, etc.
 * @returns {Promise<boolean>} Success status
 */
export async function saveCurrentUserProfile(userProfile) {
  try {
    // Use AsyncStorage for all platforms for simplicity and reliability
    await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(userProfile));
    console.log('User profile saved to AsyncStorage');
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
    // Use AsyncStorage for all platforms
    const jsonValue = await AsyncStorage.getItem(USER_PROFILE_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
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
    // Use AsyncStorage for all platforms
    await AsyncStorage.removeItem(USER_PROFILE_KEY);
    console.log('User profile cleared from AsyncStorage');
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
    // Use AsyncStorage to cache opponents
    const key = `@opponent_${opponent.uid}`;
    await AsyncStorage.setItem(key, JSON.stringify(opponent));
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
    const key = `@opponent_${uid}`;
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (error) {
    console.error('Error getting cached opponent:', error);
    return null;
  }
}
