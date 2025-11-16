import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import {
  getMatchRequests,
  acceptMatchRequest,
  declineMatchRequest,
  cancelMatchRequest,
} from '../utils/matchRequests';
import { COLORS } from '../constants/colors';
import { FONTS } from '../constants/fonts';

export default function RequestsScreen() {
  const { user } = useAuth();
  const [requests, setRequests] = useState({ sent: [], received: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  const loadRequests = async () => {
    try {
      const data = await getMatchRequests(user.uid);
      setRequests(data);
    } catch (error) {
      console.error('Error loading requests:', error);
      Alert.alert('Error', 'Failed to load match requests');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [user.uid]);

  const onRefresh = () => {
    setRefreshing(true);
    loadRequests();
  };

  const handleAccept = async (request) => {
    Alert.alert(
      'Confirm Loss',
      `Confirm that you lost to ${request.senderName}?\n\nThis will update both players' ratings.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Confirm Loss',
          style: 'destructive',
          onPress: async () => {
            setProcessingId(request.id);
            try {
              const result = await acceptMatchRequest(request.id, user.uid);
              Alert.alert(
                'Match Recorded!',
                `The match has been recorded.\n\nYour new rating: ${Math.round(result.loserNewRating)}`,
                [{ text: 'OK', onPress: loadRequests }]
              );
            } catch (error) {
              console.error('Error accepting request:', error);
              Alert.alert('Error', error.message || 'Failed to accept match request');
            } finally {
              setProcessingId(null);
            }
          },
        },
      ]
    );
  };

  const handleDecline = async (request) => {
    Alert.alert(
      'Decline Request',
      `Decline match request from ${request.senderName}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            setProcessingId(request.id);
            try {
              await declineMatchRequest(request.id, user.uid);
              Alert.alert('Declined', 'Match request declined', [
                { text: 'OK', onPress: loadRequests },
              ]);
            } catch (error) {
              console.error('Error declining request:', error);
              Alert.alert('Error', 'Failed to decline match request');
            } finally {
              setProcessingId(null);
            }
          },
        },
      ]
    );
  };

  const handleCancel = async (request) => {
    Alert.alert(
      'Cancel Request',
      `Cancel match request to ${request.opponentName}?`,
      [
        {
          text: 'No',
          style: 'cancel',
        },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            setProcessingId(request.id);
            try {
              await cancelMatchRequest(request.id, user.uid);
              Alert.alert('Cancelled', 'Match request cancelled', [
                { text: 'OK', onPress: loadRequests },
              ]);
            } catch (error) {
              console.error('Error cancelling request:', error);
              Alert.alert('Error', 'Failed to cancel match request');
            } finally {
              setProcessingId(null);
            }
          },
        },
      ]
    );
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Just now';
    const date = timestamp.toDate();
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const renderRequest = (request, type) => {
    const isPending = request.status === 'pending';
    const isProcessing = processingId === request.id;

    return (
      <View key={request.id} style={styles.requestCard}>
        <View style={styles.requestHeader}>
          <Text style={styles.requestTitle}>
            {type === 'received'
              ? `${request.senderName} claims they won`
              : `You challenged ${request.opponentName}`}
          </Text>
          <View style={[styles.statusBadge, styles[`status${request.status}`]]}>
            <Text style={styles.statusText}>{request.status}</Text>
          </View>
        </View>

        <Text style={styles.requestTime}>{formatDate(request.createdAt)}</Text>

        {isPending && type === 'received' && (
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.acceptButton, isProcessing && styles.buttonDisabled]}
              onPress={() => handleAccept(request)}
              disabled={isProcessing}
            >
              <Text style={styles.actionButtonText}>
                {isProcessing ? 'Processing...' : 'Confirm Loss'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.declineButton, isProcessing && styles.buttonDisabled]}
              onPress={() => handleDecline(request)}
              disabled={isProcessing}
            >
              <Text style={styles.actionButtonText}>Decline</Text>
            </TouchableOpacity>
          </View>
        )}

        {isPending && type === 'sent' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.cancelButton, isProcessing && styles.buttonDisabled]}
            onPress={() => handleCancel(request)}
            disabled={isProcessing}
          >
            <Text style={styles.actionButtonText}>
              {isProcessing ? 'Cancelling...' : 'Cancel Request'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading requests...</Text>
      </View>
    );
  }

  const pendingReceived = requests.received.filter(r => r.status === 'pending');
  const pendingSent = requests.sent.filter(r => r.status === 'pending');
  const completedRequests = [...requests.sent, ...requests.received]
    .filter(r => r.status !== 'pending')
    .sort((a, b) => {
      const aTime = a.updatedAt?.toMillis() || a.createdAt?.toMillis() || 0;
      const bTime = b.updatedAt?.toMillis() || b.createdAt?.toMillis() || 0;
      return bTime - aTime;
    });

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={COLORS.primary}
        />
      }
    >
      <Text style={styles.title}>Match Requests</Text>

      {pendingReceived.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pending - Confirm Your Losses</Text>
          {pendingReceived.map(request => renderRequest(request, 'received'))}
        </View>
      )}

      {pendingSent.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pending - Awaiting Confirmation</Text>
          {pendingSent.map(request => renderRequest(request, 'sent'))}
        </View>
      )}

      {completedRequests.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {completedRequests.slice(0, 10).map(request => {
            const type = request.senderUid === user.uid ? 'sent' : 'received';
            return renderRequest(request, type);
          })}
        </View>
      )}

      {pendingReceived.length === 0 &&
        pendingSent.length === 0 &&
        completedRequests.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No match requests yet</Text>
            <Text style={styles.emptySubtext}>
              Challenge someone from the leaderboard!
            </Text>
          </View>
        )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    ...FONTS.body,
    color: COLORS.textSecondary,
    marginTop: 12,
  },
  title: {
    ...FONTS.title,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    ...FONTS.subheading,
    marginBottom: 12,
  },
  requestCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  requestTitle: {
    ...FONTS.subheading,
    flex: 1,
    marginRight: 8,
  },
  requestTime: {
    ...FONTS.body,
    color: COLORS.textSecondary,
    fontSize: 14,
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statuspending: {
    backgroundColor: COLORS.warning || '#FFA500',
  },
  statusaccepted: {
    backgroundColor: COLORS.success || '#00C853',
  },
  statusdeclined: {
    backgroundColor: COLORS.error || '#D32F2F',
  },
  statuscancelled: {
    backgroundColor: COLORS.textSecondary,
  },
  statusText: {
    ...FONTS.body,
    fontSize: 12,
    color: COLORS.background,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: COLORS.primary,
  },
  declineButton: {
    backgroundColor: COLORS.error || '#D32F2F',
  },
  cancelButton: {
    backgroundColor: COLORS.textSecondary,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  actionButtonText: {
    ...FONTS.body,
    color: COLORS.background,
    fontWeight: 'bold',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    ...FONTS.subheading,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    ...FONTS.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
