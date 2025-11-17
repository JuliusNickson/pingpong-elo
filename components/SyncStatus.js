import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { syncManager } from '../utils/sync';
import { COLORS } from '../constants/colors';

export default function SyncStatus() {
  const [syncState, setSyncState] = useState({
    pendingCount: 0,
    lastSync: null,
    isOnline: true,
    isSyncing: false,
    isConfigured: false
  });
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    loadSyncStatus();
    
    // Listen for sync events
    const unsubscribe = syncManager.addSyncListener((status) => {
      if (status.type === 'sync_started') {
        setStatusMessage('Syncing...');
      } else if (status.type === 'sync_completed') {
        setStatusMessage('Synced');
        loadSyncStatus();
        setTimeout(() => setStatusMessage(''), 2000);
      } else if (status.type === 'sync_error') {
        setStatusMessage('Sync failed');
        setTimeout(() => setStatusMessage(''), 3000);
      }
    });
    
    return () => unsubscribe();
  }, []);

  const loadSyncStatus = async () => {
    const status = await syncManager.getSyncStatus();
    setSyncState(status);
  };

  const handleSyncPress = async () => {
    setStatusMessage('Syncing...');
    try {
      await syncManager.triggerSync();
      setStatusMessage('Synced');
      setTimeout(() => setStatusMessage(''), 2000);
    } catch (error) {
      setStatusMessage('Sync failed');
      setTimeout(() => setStatusMessage(''), 3000);
    }
    await loadSyncStatus();
  };

  if (!syncState.isConfigured) {
    return (
      <View style={styles.container}>
        <View style={styles.offlineBar}>
          <Text style={styles.offlineText}>📱 Offline Mode</Text>
          <Text style={styles.offlineSubtext}>Configure Firebase to enable sync</Text>
        </View>
      </View>
    );
  }

  const formatLastSync = (timestamp) => {
    if (!timestamp) return 'Never';
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={[
          styles.statusBar,
          syncState.pendingCount > 0 && styles.statusBarPending,
          syncState.isSyncing && styles.statusBarSyncing
        ]}
        onPress={handleSyncPress}
        disabled={syncState.isSyncing}
      >
        <View style={styles.statusLeft}>
          {syncState.isSyncing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.icon}>
              {syncState.pendingCount > 0 ? '⏱️' : '☁️'}
            </Text>
          )}
          
          <View style={styles.statusInfo}>
            <Text style={styles.statusText}>
              {statusMessage || (
                syncState.pendingCount > 0 
                  ? `${syncState.pendingCount} pending`
                  : 'Synced'
              )}
            </Text>
            <Text style={styles.statusSubtext}>
              {formatLastSync(syncState.lastSync)}
            </Text>
          </View>
        </View>

        {syncState.pendingCount > 0 && !syncState.isSyncing && (
          <Text style={styles.syncButton}>Sync Now</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  offlineBar: {
    backgroundColor: COLORS.warning + '20',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warning,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  offlineText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  offlineSubtext: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.success,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  statusBarPending: {
    backgroundColor: COLORS.warning,
  },
  statusBarSyncing: {
    backgroundColor: COLORS.info,
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  icon: {
    fontSize: 18,
  },
  statusInfo: {
    flexDirection: 'column',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  statusSubtext: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  syncButton: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
});
