import { useState, useEffect } from 'react';
import { getUserMatches } from '../utils/matches';
import { useAuth } from '../contexts/AuthContext';

export function useMatches() {
  const { user } = useAuth();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.uid) {
      loadMatches();
    } else {
      setMatches([]);
      setLoading(false);
    }
  }, [user?.uid]);

  const loadMatches = async () => {
    if (!user?.uid) {
      setMatches([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const userMatches = await getUserMatches(user.uid);
      
      console.log('Raw matches from Firestore:', userMatches);
      
      // Transform to match old format for compatibility with MatchItem component
      const transformedMatches = userMatches.map(match => {
        // Determine if current user is the winner
        const isUserWinner = match.winnerUid === user.uid;
        
        // Figure out which UID belongs to the current user and which to opponent
        const currentUserIsFirstPlayer = match.userUid === user.uid;
        const opponentUid = currentUserIsFirstPlayer ? match.opponentUid : match.userUid;
        const opponentName = currentUserIsFirstPlayer ? match.opponentName : match.userName;
        
        console.log('Match transformation:', {
          matchId: match.id,
          currentUserIsFirstPlayer,
          opponentName,
          userName: match.userName,
          opponentNameField: match.opponentName,
          isUserWinner
        });
        
        // Get current user's ratings
        const myRatingBefore = currentUserIsFirstPlayer ? match.userRatingBefore : match.opponentRatingBefore;
        const myRatingAfter = currentUserIsFirstPlayer ? match.userRatingAfter : match.opponentRatingAfter;
        
        // Get opponent's ratings
        const theirRatingBefore = currentUserIsFirstPlayer ? match.opponentRatingBefore : match.userRatingBefore;
        const theirRatingAfter = currentUserIsFirstPlayer ? match.opponentRatingAfter : match.userRatingAfter;
        
        // Construct the match object with correct winner/loser info
        return {
          id: match.id,
          winnerId: match.winnerUid,
          winnerName: isUserWinner ? 'You' : (opponentName || 'Opponent'),
          loserId: isUserWinner ? opponentUid : user.uid,
          loserName: isUserWinner ? (opponentName || 'Opponent') : 'You',
          winnerOldElo: isUserWinner ? myRatingBefore : theirRatingBefore,
          winnerNewElo: isUserWinner ? myRatingAfter : theirRatingAfter,
          loserOldElo: isUserWinner ? theirRatingBefore : myRatingBefore,
          loserNewElo: isUserWinner ? theirRatingAfter : myRatingAfter,
          timestamp: match.createdAt?.toMillis() || Date.now(),
        };
      });
      
      console.log('Transformed matches:', transformedMatches);
      setMatches(transformedMatches);
    } catch (error) {
      console.error('Error loading matches:', error);
      setMatches([]);
    } finally {
      setLoading(false);
    }
  };

  return {
    matches,
    loading,
    refreshMatches: loadMatches,
  };
}
