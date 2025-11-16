import { doc, setDoc, getDoc, collection, query, where, getDocs, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import { getFirestoreDb } from './firebase';
import { DEFAULT_ELO, DEFAULT_RD } from '../constants/defaults';

/**
 * Create user profile in Firestore
 * @param {string} uid - User ID from Firebase Auth
 * @param {string} displayName - User display name
 * @param {string} email - User email
 * @returns {Promise<void>}
 */
export async function createUserProfile(uid, displayName, email) {
  try {
    const db = getFirestoreDb();
    await setDoc(doc(db, 'users', uid), {
      displayName,
      email,
      rating: DEFAULT_ELO,
      rd: DEFAULT_RD,
      matchesPlayed: 0,
      wins: 0,
      losses: 0,
      lastPlayed: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    console.log('User profile created successfully');
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
}

/**
 * Get user profile from Firestore
 * @param {string} uid - User ID
 * @returns {Promise<Object|null>} User profile or null
 */
export async function getUserProfile(uid) {
  try {
    const db = getFirestoreDb();
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { uid, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
}

/**
 * Update user profile in Firestore
 * @param {string} uid - User ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<void>}
 */
export async function updateUserProfile(uid, updates) {
  try {
    const db = getFirestoreDb();
    await setDoc(doc(db, 'users', uid), {
      ...updates,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}

/**
 * Search for users by email or display name
 * @param {string} searchTerm - Search term
 * @returns {Promise<Array>} Array of user profiles
 */
export async function searchUsers(searchTerm) {
  try {
    const db = getFirestoreDb();
    const usersRef = collection(db, 'users');
    
    // Search by email (exact match)
    const emailQuery = query(usersRef, where('email', '==', searchTerm.toLowerCase()));
    const emailResults = await getDocs(emailQuery);
    
    const users = [];
    emailResults.forEach((doc) => {
      users.push({ uid: doc.id, ...doc.data() });
    });
    
    // Note: Firestore doesn't support case-insensitive substring search natively
    // For production, consider using Algolia or similar search service
    
    return users;
  } catch (error) {
    console.error('Error searching users:', error);
    return [];
  }
}

/**
 * Get leaderboard (top users by rating)
 * @param {number} maxResults - Number of users to fetch
 * @returns {Promise<Array>} Array of user profiles
 */
export async function getLeaderboard(maxResults = 50) {
  try {
    const db = getFirestoreDb();
    const usersRef = collection(db, 'users');
    const q = query(usersRef, orderBy('rating', 'desc'), limit(maxResults));
    
    const querySnapshot = await getDocs(q);
    const users = [];
    querySnapshot.forEach((doc) => {
      users.push({ uid: doc.id, ...doc.data() });
    });
    
    return users;
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    return [];
  }
}
