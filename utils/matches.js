import { 
  collection, 
  doc, 
  setDoc, 
  getDocs,
  query, 
  where,
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { getFirestoreDb } from './firebase';

/**
 * Save a match to Firestore
 * @param {Object} matchData - Match data
 */
export async function saveMatch(matchData) {
  try {
    const db = getFirestoreDb();
    const matchRef = doc(collection(db, 'matches'));
    const match = {
      id: matchRef.id,
      userUid: matchData.userUid,
      opponentUid: matchData.opponentUid,
      winnerUid: matchData.winnerUid,
      userName: matchData.userName || null,
      opponentName: matchData.opponentName || null,
      userRatingBefore: matchData.userRatingBefore,
      userRatingAfter: matchData.userRatingAfter,
      opponentRatingBefore: matchData.opponentRatingBefore,
      opponentRatingAfter: matchData.opponentRatingAfter,
      requestId: matchData.requestId || null,
      // Bulk match fields
      winsA: matchData.winsA || null,
      winsB: matchData.winsB || null,
      isBulk: matchData.isBulk || false,
      createdAt: serverTimestamp(),
    };

    await setDoc(matchRef, match);
    console.log('Match saved:', matchRef.id);
    return matchRef.id;
  } catch (error) {
    console.error('Error saving match:', error);
    throw error;
  }
}

/**
 * Get matches for a user
 * @param {string} userUid - UID of the user
 */
export async function getUserMatches(userUid) {
  try {
    const db = getFirestoreDb();
    // Get matches where user is either player (no orderBy to avoid index requirement)
    const q1 = query(
      collection(db, 'matches'),
      where('userUid', '==', userUid)
    );
    
    const q2 = query(
      collection(db, 'matches'),
      where('opponentUid', '==', userUid)
    );

    const [snapshot1, snapshot2] = await Promise.all([
      getDocs(q1),
      getDocs(q2)
    ]);

    const matches1 = snapshot1.docs.map(doc => doc.data());
    const matches2 = snapshot2.docs.map(doc => doc.data());

    // Combine and deduplicate
    const allMatches = [...matches1, ...matches2];
    const uniqueMatches = Array.from(
      new Map(allMatches.map(m => [m.id, m])).values()
    );

    // Sort by createdAt descending in memory
    return uniqueMatches.sort((a, b) => {
      const aTime = a.createdAt?.toMillis() || 0;
      const bTime = b.createdAt?.toMillis() || 0;
      return bTime - aTime;
    });
  } catch (error) {
    console.error('Error getting user matches:', error);
    throw error;
  }
}
