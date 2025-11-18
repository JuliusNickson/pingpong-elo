import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs,
  updateDoc,
  query, 
  where,
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { getFirestoreDb } from './firebase';
import { calculateNewElo } from './elo';
import { updateUserProfile, getUserProfile } from './userProfile';
import { saveMatch } from './matches';

/**
 * Create a match request
 * @param {string} senderUid - UID of user sending request (winner)
 * @param {string} opponentUid - UID of opponent (loser)
 * @param {string} senderName - Display name of sender
 * @param {string} opponentName - Display name of opponent
 */
export async function createMatchRequest(senderUid, opponentUid, senderName, opponentName) {
  try {
    const db = getFirestoreDb();
    const requestRef = doc(collection(db, 'matchRequests'));
    const requestData = {
      id: requestRef.id,
      senderUid,
      opponentUid,
      senderName,
      opponentName,
      status: 'pending', // pending, accepted, declined
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(requestRef, requestData);
    console.log('Match request created:', requestRef.id);
    return requestRef.id;
  } catch (error) {
    console.error('Error creating match request:', error);
    throw error;
  }
}

/**
 * Create a bulk match request (multiple games)
 * @param {string} senderUid - UID of user sending request
 * @param {string} opponentUid - UID of opponent
 * @param {string} senderName - Display name of sender
 * @param {string} opponentName - Display name of opponent
 * @param {number} senderWins - Number of wins for sender
 * @param {number} opponentWins - Number of wins for opponent
 */
export async function createBulkMatchRequest(senderUid, opponentUid, senderName, opponentName, senderWins, opponentWins) {
  try {
    const db = getFirestoreDb();
    const requestRef = doc(collection(db, 'matchRequests'));
    const requestData = {
      id: requestRef.id,
      senderUid,
      opponentUid,
      senderName,
      opponentName,
      senderWins,
      opponentWins,
      isBulk: true,
      status: 'pending', // pending, accepted, declined
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(requestRef, requestData);
    console.log('Bulk match request created:', requestRef.id);
    return requestRef.id;
  } catch (error) {
    console.error('Error creating bulk match request:', error);
    throw error;
  }
}

/**
 * Get all match requests for a user (both sent and received)
 * @param {string} userUid - UID of the user
 */
export async function getMatchRequests(userUid) {
  try {
    const db = getFirestoreDb();
    // Get requests sent by user (no orderBy to avoid index requirement)
    const sentQuery = query(
      collection(db, 'matchRequests'),
      where('senderUid', '==', userUid)
    );
    
    // Get requests received by user (no orderBy to avoid index requirement)
    const receivedQuery = query(
      collection(db, 'matchRequests'),
      where('opponentUid', '==', userUid)
    );

    const [sentSnapshot, receivedSnapshot] = await Promise.all([
      getDocs(sentQuery),
      getDocs(receivedQuery)
    ]);

    const sentRequests = sentSnapshot.docs.map(doc => ({
      ...doc.data(),
      type: 'sent'
    }));

    const receivedRequests = receivedSnapshot.docs.map(doc => ({
      ...doc.data(),
      type: 'received'
    }));

    // Sort in memory instead of in query
    const sortByDate = (a, b) => {
      const aTime = a.createdAt?.toMillis() || 0;
      const bTime = b.createdAt?.toMillis() || 0;
      return bTime - aTime;
    };

    return {
      sent: sentRequests.sort(sortByDate),
      received: receivedRequests.sort(sortByDate),
      all: [...receivedRequests, ...sentRequests].sort(sortByDate)
    };
  } catch (error) {
    console.error('Error getting match requests:', error);
    throw error;
  }
}

/**
 * Get pending match requests received by a user
 * @param {string} userUid - UID of the user
 */
export async function getPendingReceivedRequests(userUid) {
  try {
    const db = getFirestoreDb();
    // Simplified query - sort in memory to avoid index requirement
    const q = query(
      collection(db, 'matchRequests'),
      where('opponentUid', '==', userUid),
      where('status', '==', 'pending')
    );

    const snapshot = await getDocs(q);
    const requests = snapshot.docs.map(doc => doc.data());
    
    // Sort by createdAt in memory
    return requests.sort((a, b) => {
      const aTime = a.createdAt?.toMillis() || 0;
      const bTime = b.createdAt?.toMillis() || 0;
      return bTime - aTime;
    });
  } catch (error) {
    console.error('Error getting pending requests:', error);
    throw error;
  }
}

/**
 * Accept a match request (opponent confirms they lost)
 * This will record the match and update both players' ratings
 * @param {string} requestId - ID of the match request
 * @param {string} opponentUid - UID of the user accepting (must be the opponent)
 */
export async function acceptMatchRequest(requestId, opponentUid) {
  try {
    const db = getFirestoreDb();
    // Get the request
    const requestRef = doc(db, 'matchRequests', requestId);
    const requestSnap = await getDoc(requestRef);
    
    if (!requestSnap.exists()) {
      throw new Error('Match request not found');
    }

    const request = requestSnap.data();
    
    // Verify the user accepting is the opponent
    if (request.opponentUid !== opponentUid) {
      throw new Error('Only the opponent can accept this request');
    }

    if (request.status !== 'pending') {
      throw new Error('This request has already been processed');
    }

    // Get both players' profiles
    const [winnerProfile, loserProfile] = await Promise.all([
      getUserProfile(request.senderUid),
      getUserProfile(request.opponentUid)
    ]);

    if (!winnerProfile || !loserProfile) {
      throw new Error('Player profiles not found');
    }

    // Calculate new ELO ratings
    const {
      winnerNewElo,
      loserNewElo,
      winnerNewRd,
      loserNewRd
    } = calculateNewElo(
      winnerProfile.rating,
      loserProfile.rating,
      winnerProfile.rd,
      loserProfile.rd
    );

    // Update both players' profiles and the match request
    await Promise.all([
      updateUserProfile(request.senderUid, {
        rating: winnerNewElo,
        rd: winnerNewRd,
        matchesPlayed: (winnerProfile.matchesPlayed || 0) + 1,
        wins: (winnerProfile.wins || 0) + 1,
        lastPlayed: serverTimestamp()
      }),
      updateUserProfile(request.opponentUid, {
        rating: loserNewElo,
        rd: loserNewRd,
        matchesPlayed: (loserProfile.matchesPlayed || 0) + 1,
        losses: (loserProfile.losses || 0) + 1,
        lastPlayed: serverTimestamp()
      }),
      updateDoc(requestRef, {
        status: 'accepted',
        updatedAt: serverTimestamp()
      })
    ]);

    // Record the match
    await saveMatch({
      userUid: request.senderUid,
      opponentUid: request.opponentUid,
      winnerUid: request.senderUid,
      userName: request.senderName,
      opponentName: request.opponentName,
      userRatingBefore: winnerProfile.rating,
      userRatingAfter: winnerNewElo,
      opponentRatingBefore: loserProfile.rating,
      opponentRatingAfter: loserNewElo,
      requestId: requestId
    });


    // Update request status
    await updateDoc(requestRef, {
      status: 'accepted',
      updatedAt: serverTimestamp()
    });

    console.log('Match request accepted and match recorded');
    return {
      winnerNewRating: winnerNewElo,
      loserNewRating: loserNewElo
    };
  } catch (error) {
    console.error('Error accepting match request:', error);
    throw error;
  }
}

/**
 * Accept a bulk match request (multiple games)
 * @param {string} requestId - ID of the match request
 * @param {string} opponentUid - UID of the user accepting (must be the opponent)
 */
export async function acceptBulkMatchRequest(requestId, opponentUid) {
  try {
    const db = getFirestoreDb();
    const requestRef = doc(db, 'matchRequests', requestId);
    const requestSnap = await getDoc(requestRef);
    
    if (!requestSnap.exists()) {
      throw new Error('Match request not found');
    }

    const request = requestSnap.data();
    
    // Verify the user accepting is the opponent
    if (request.opponentUid !== opponentUid) {
      throw new Error('Only the opponent can accept this request');
    }

    if (request.status !== 'pending') {
      throw new Error('This request has already been processed');
    }

    if (!request.isBulk) {
      throw new Error('This is not a bulk match request');
    }

    // Get both players' profiles
    const [senderProfile, opponentProfile] = await Promise.all([
      getUserProfile(request.senderUid),
      getUserProfile(request.opponentUid)
    ]);

    if (!senderProfile || !opponentProfile) {
      throw new Error('Player profiles not found');
    }

    // Import processBulkMatchResults dynamically to avoid circular dependency
    const { processBulkMatchResults } = await import('./elo');

    // Calculate new ratings using bulk processing
    const { newA, newB } = processBulkMatchResults(
      { rating: senderProfile.rating },
      { rating: opponentProfile.rating },
      request.senderWins,
      request.opponentWins
    );

    const totalMatches = request.senderWins + request.opponentWins;

    // Update both players' profiles
    await Promise.all([
      updateUserProfile(request.senderUid, {
        rating: newA,
        matchesPlayed: (senderProfile.matchesPlayed || 0) + totalMatches,
        wins: (senderProfile.wins || 0) + request.senderWins,
        losses: (senderProfile.losses || 0) + request.opponentWins,
        lastPlayed: serverTimestamp()
      }),
      updateUserProfile(request.opponentUid, {
        rating: newB,
        matchesPlayed: (opponentProfile.matchesPlayed || 0) + totalMatches,
        wins: (opponentProfile.wins || 0) + request.opponentWins,
        losses: (opponentProfile.losses || 0) + request.senderWins,
        lastPlayed: serverTimestamp()
      }),
      updateDoc(requestRef, {
        status: 'accepted',
        updatedAt: serverTimestamp()
      })
    ]);

    // Record the bulk match
    await saveMatch({
      userUid: request.senderUid,
      opponentUid: request.opponentUid,
      winnerUid: request.senderWins > request.opponentWins ? request.senderUid : request.opponentUid,
      userName: request.senderName,
      opponentName: request.opponentName,
      userRatingBefore: senderProfile.rating,
      userRatingAfter: newA,
      opponentRatingBefore: opponentProfile.rating,
      opponentRatingAfter: newB,
      winsA: request.senderWins,
      winsB: request.opponentWins,
      isBulk: true,
      requestId: requestId
    });

    console.log('Bulk match request accepted and matches recorded');
    return {
      senderNewRating: newA,
      opponentNewRating: newB
    };
  } catch (error) {
    console.error('Error accepting bulk match request:', error);
    throw error;
  }
}

/**
 * Decline a match request
 * @param {string} requestId - ID of the match request
 * @param {string} opponentUid - UID of the user declining (must be the opponent)
 */
export async function declineMatchRequest(requestId, opponentUid) {
  try {
    const db = getFirestoreDb();
    const requestRef = doc(db, 'matchRequests', requestId);
    const requestSnap = await getDoc(requestRef);
    
    if (!requestSnap.exists()) {
      throw new Error('Match request not found');
    }

    const request = requestSnap.data();
    
    // Verify the user declining is the opponent
    if (request.opponentUid !== opponentUid) {
      throw new Error('Only the opponent can decline this request');
    }

    if (request.status !== 'pending') {
      throw new Error('This request has already been processed');
    }

    await updateDoc(requestRef, {
      status: 'declined',
      updatedAt: serverTimestamp()
    });

    console.log('Match request declined');
  } catch (error) {
    console.error('Error declining match request:', error);
    throw error;
  }
}

/**
 * Cancel a match request (sender cancels)
 * @param {string} requestId - ID of the match request
 * @param {string} senderUid - UID of the user canceling (must be the sender)
 */
export async function cancelMatchRequest(requestId, senderUid) {
  try {
    const db = getFirestoreDb();
    const requestRef = doc(db, 'matchRequests', requestId);
    const requestSnap = await getDoc(requestRef);
    
    if (!requestSnap.exists()) {
      throw new Error('Match request not found');
    }

    const request = requestSnap.data();
    
    // Verify the user canceling is the sender
    if (request.senderUid !== senderUid) {
      throw new Error('Only the sender can cancel this request');
    }

    if (request.status !== 'pending') {
      throw new Error('This request has already been processed');
    }

    await updateDoc(requestRef, {
      status: 'cancelled',
      updatedAt: serverTimestamp()
    });

    console.log('Match request cancelled');
  } catch (error) {
    console.error('Error cancelling match request:', error);
    throw error;
  }
}
