import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import Button from '../components/Button';
import { COLORS } from '../constants/colors';
import { DEFAULT_ELO, K_FACTOR } from '../constants/defaults';
import { clearAllData } from '../utils/storage';
import { syncManager } from '../utils/sync';
import { isFirebaseConfigured } from '../utils/firebase';

export default function SettingsScreen() {
  const [syncState, setSyncState] = useState(null);

  useEffect(() => {
    loadSyncState();
  }, []);

  const loadSyncState = async () => {
    const status = await syncManager.getSyncStatus();
    setSyncState(status);
  };

  const handleManualSync = async () => {
    try {
      await syncManager.triggerSync();
      Alert.alert('Success', 'Data synced successfully');
      await loadSyncState();
    } catch (error) {
      Alert.alert('Error', 'Failed to sync data');
    }
  };

  const handleResetData = () => {
    Alert.alert(
      'Reset All Data',
      'Are you sure you want to delete all players and match history? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearAllData();
              Alert.alert('Success', 'All data has been reset');
            } catch (error) {
              Alert.alert('Error', 'Failed to reset data');
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Settings</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ELO System</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Default ELO:</Text>
          <Text style={styles.infoValue}>{DEFAULT_ELO}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>K-Factor:</Text>
          <Text style={styles.infoValue}>{K_FACTOR}</Text>
        </View>
        <Text style={styles.description}>
          The K-factor determines how much ELO points change after each match.
          Higher K-factor means bigger rating changes.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Firebase Sync</Text>
        {isFirebaseConfigured() ? (
          <>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Status:</Text>
              <Text style={[styles.infoValue, { color: COLORS.success }]}>✓ Configured</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Pending Items:</Text>
              <Text style={styles.infoValue}>{syncState?.pendingCount || 0}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Last Sync:</Text>
              <Text style={styles.infoValue}>
                {syncState?.lastSync 
                  ? new Date(syncState.lastSync).toLocaleString() 
                  : 'Never'}
              </Text>
            </View>
            <Button
              title="Sync Now"
              onPress={handleManualSync}
              variant="secondary"
            />
            <Text style={styles.description}>
              Real-time sync with Firestore. Data automatically syncs across all devices.
            </Text>
          </>
        ) : (
          <>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Status:</Text>
              <Text style={[styles.infoValue, { color: COLORS.warning }]}>⚠ Not Configured</Text>
            </View>
            <Text style={styles.description}>
              To enable cloud sync:
              {'\n'}1. Edit utils/firebase.js
              {'\n'}2. Add your Firebase config
              {'\n'}3. Restart the app
              {'\n\n'}Without Firebase, data is stored locally only.
            </Text>
          </>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.description}>
          Ping Pong ELO Tracker helps you track player rankings using the ELO rating system.
          After each match, both players' ratings are adjusted based on the expected outcome.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data Management</Text>
        <Button
          title="Reset All Data"
          onPress={handleResetData}
          variant="danger"
        />
        <Text style={styles.warningText}>
          ⚠️ This will delete all players and match history permanently
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 30,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  description: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginTop: 8,
  },
  warningText: {
    fontSize: 12,
    color: COLORS.error,
    textAlign: 'center',
    marginTop: 8,
  },
});
