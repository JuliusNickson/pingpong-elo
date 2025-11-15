import { useState, useEffect } from 'react';
import { getMatches, addMatch as addMatchDb } from '../utils/storage';
import { syncManager } from '../utils/sync';

export function useMatches() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState(null);

  useEffect(() => {
    loadMatches();
    
    // Set up sync listener
    const unsubscribe = syncManager.addSyncListener((status) => {
      setSyncStatus(status);
      if (status.type === 'matches_synced') {
        loadMatches();
      }
    });
    
    return () => {
      unsubscribe();
    };
  }, []);

  const loadMatches = async () => {
    try {
      const storedMatches = await getMatches();
      setMatches(storedMatches);
    } catch (error) {
      console.error('Error loading matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const addMatch = async (matchData) => {
    const success = await addMatchDb(matchData);
    if (success) {
      await loadMatches(); // Reload to get fresh data
    }
  };

  const clearMatches = async () => {
    // This would require a new database function
    setMatches([]);
  };

  return {
    matches,
    loading,
    syncStatus,
    addMatch,
    clearMatches,
    refreshMatches: loadMatches,
  };
}
