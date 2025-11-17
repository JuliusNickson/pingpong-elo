import AsyncStorage from '@react-native-async-storage/async-storage';

const PLAYERS_KEY = '@pingpong_players';
const MATCHES_KEY = '@pingpong_matches';

/**
 * Clear all data from AsyncStorage
 */
export async function clearAllData() {
  try {
    // Clear AsyncStorage
    await AsyncStorage.multiRemove([PLAYERS_KEY, MATCHES_KEY]);
    
    return true;
  } catch (error) {
    console.error('Error clearing data:', error);
    throw error;
  }
}
