import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Alert, 
  ScrollView, 
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  FlatList 
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { getLeaderboard } from '../utils/userProfile';
import { createMatchRequest } from '../utils/matchRequests';
import Button from '../components/Button';
import { COLORS } from '../constants/colors';
import { FONTS } from '../constants/fonts';

export default function AddMatchScreen() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [allPlayers, setAllPlayers] = useState([]);
  const [filteredPlayers, setFilteredPlayers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  // Load all players on mount
  useEffect(() => {
    loadPlayers();
  }, [user.uid]);

  const loadPlayers = async () => {
    setIsLoading(true);
    try {
      // Get all players from leaderboard (up to 500)
      const players = await getLeaderboard(500);
      // Filter out current user
      const otherPlayers = players.filter(p => p.uid !== user.uid);
      setAllPlayers(otherPlayers);
      setFilteredPlayers(otherPlayers);
    } catch (error) {
      console.error('Error loading players:', error);
      Alert.alert('Error', 'Failed to load players');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter players based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredPlayers(allPlayers);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = allPlayers.filter(player => 
        player.displayName.toLowerCase().includes(query) ||
        player.email.toLowerCase().includes(query)
      );
      setFilteredPlayers(filtered);
    }
  }, [searchQuery, allPlayers]);

  const handleSendRequest = async (opponent) => {
    Alert.alert(
      'Confirm Match Request',
      `Send match request to ${opponent.displayName}?\n\nYou are claiming you WON against them.\nThey must confirm the loss.`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Send Request',
          onPress: async () => {
            setIsSending(true);
            try {
              // Get current user's display name from local profile or auth
              const currentUserName = user.displayName || user.email;
              
              await createMatchRequest(
                user.uid,
                opponent.uid,
                currentUserName,
                opponent.displayName
              );
              
              Alert.alert(
                'Request Sent!',
                `Match request sent to ${opponent.displayName}. They will need to confirm the loss for the match to be recorded.`,
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      setSearchQuery('');
                      router.push('/');
                    }
                  }
                ]
              );
            } catch (error) {
              console.error('Error sending match request:', error);
              Alert.alert('Error', 'Failed to send match request');
            } finally {
              setIsSending(false);
            }
          }
        }
      ]
    );
  };

  const renderPlayer = ({ item: opponent }) => (
    <View style={styles.playerCard}>
      <View style={styles.playerInfo}>
        <Text style={styles.playerName}>{opponent.displayName}</Text>
        <Text style={styles.playerEmail}>{opponent.email}</Text>
        <Text style={styles.playerRating}>Rating: {Math.round(opponent.rating)}</Text>
        <Text style={styles.playerStats}>
          {opponent.matchesPlayed || 0} matches • {opponent.wins || 0}W - {opponent.losses || 0}L
        </Text>
      </View>
      <TouchableOpacity
        style={[styles.sendButton, isSending && styles.sendButtonDisabled]}
        onPress={() => handleSendRequest(opponent)}
        disabled={isSending}
      >
        <Text style={styles.sendButtonText}>
          {isSending ? 'Sending...' : 'I Won'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading players...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Challenge Player</Text>
        <Text style={styles.subtitle}>
          Select your opponent and claim your victory
        </Text>
      </View>

      <View style={styles.searchSection}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or email..."
          placeholderTextColor={COLORS.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {filteredPlayers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {searchQuery ? 'No players found' : 'No other players registered yet'}
          </Text>
          <Text style={styles.emptySubtext}>
            {searchQuery ? 'Try a different search term' : 'Invite friends to join!'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredPlayers}
          renderItem={renderPlayer}
          keyExtractor={(item) => item.uid}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}

      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>How it works:</Text>
        <Text style={styles.infoText}>
          1. Find your opponent in the list{'\n'}
          2. Click "I Won" to send them a match request{'\n'}
          3. They must confirm the loss{'\n'}
          4. Once confirmed, both ratings will be updated
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    ...FONTS.title,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    ...FONTS.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  searchSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    fontSize: 16,
    color: COLORS.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    ...FONTS.body,
    color: COLORS.textSecondary,
    marginTop: 12,
  },
  listContent: {
    paddingHorizontal: 16,
  },
  separator: {
    height: 12,
  },
  playerCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    ...FONTS.subheading,
    marginBottom: 4,
  },
  playerEmail: {
    ...FONTS.body,
    color: COLORS.textSecondary,
    fontSize: 14,
    marginBottom: 4,
  },
  playerRating: {
    ...FONTS.body,
    color: COLORS.primary,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  playerStats: {
    ...FONTS.body,
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  sendButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginLeft: 12,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    ...FONTS.body,
    color: COLORS.background,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
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
  infoSection: {
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 20,
    padding: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  infoTitle: {
    ...FONTS.subheading,
    marginBottom: 8,
  },
  infoText: {
    ...FONTS.body,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
});
