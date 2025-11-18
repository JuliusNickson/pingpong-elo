import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TextInput,
  ActivityIndicator,
  FlatList,
  Pressable
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { getLeaderboard, getUserProfile } from '../utils/userProfile';
import { createBulkMatchRequest } from '../utils/matchRequests';
import { showSimpleAlert, showConfirm } from '../utils/alerts';
import Button from '../components/Button';
import { COLORS } from '../constants/colors';
import { FONTS } from '../constants/fonts';

export default function BulkMatchScreen() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [allPlayers, setAllPlayers] = useState([]);
  const [filteredPlayers, setFilteredPlayers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Selected opponent and match scores
  const [selectedOpponent, setSelectedOpponent] = useState(null);
  const [myWins, setMyWins] = useState('');
  const [opponentWins, setOpponentWins] = useState('');

  useEffect(() => {
    if (user?.uid) {
      loadPlayers();
    }
  }, [user?.uid]);

  const loadPlayers = async () => {
    if (!user?.uid) return;
    
    setIsLoading(true);
    try {
      const players = await getLeaderboard(500);
      const otherPlayers = players.filter(p => p.uid !== user.uid);
      setAllPlayers(otherPlayers);
      setFilteredPlayers(otherPlayers);
    } catch (error) {
      console.error('Error loading players:', error);
      showSimpleAlert('Error', 'Failed to load players');
    } finally {
      setIsLoading(false);
    }
  };

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

  const handleSelectOpponent = (opponent) => {
    setSelectedOpponent(opponent);
    setMyWins('');
    setOpponentWins('');
  };

  const handleSaveMatches = async () => {
    const winsA = parseInt(myWins) || 0;
    const winsB = parseInt(opponentWins) || 0;

    if (winsA === 0 && winsB === 0) {
      showSimpleAlert('Invalid Input', 'Please enter at least one win');
      return;
    }

    if (winsA < 0 || winsB < 0) {
      showSimpleAlert('Invalid Input', 'Wins cannot be negative');
      return;
    }

    const totalMatches = winsA + winsB;
    const message = `Send match request for ${totalMatches} games?\n\nYou: ${winsA} wins\n${selectedOpponent.displayName}: ${winsB} wins\n\nThey must confirm before ratings are updated.`;

    showConfirm(
      'Send Match Request',
      message,
      async () => {
        setIsSaving(true);
        try {
          // Get current user's display name
          const myProfile = await getUserProfile(user.uid);
          if (!myProfile) {
            throw new Error('Your profile not found');
          }

          // Create bulk match request
          await createBulkMatchRequest(
            user.uid,
            selectedOpponent.uid,
            myProfile.displayName,
            selectedOpponent.displayName,
            winsA,
            winsB
          );

          showSimpleAlert(
            'Request Sent!',
            `Match request sent to ${selectedOpponent.displayName} for ${totalMatches} games.\n\nThey will need to confirm before ratings are updated.`,
            () => {
              setSelectedOpponent(null);
              setMyWins('');
              setOpponentWins('');
              router.push('/');
            }
          );
        } catch (error) {
          console.error('Error sending match request:', error);
          showSimpleAlert('Error', error.message || 'Failed to send match request');
        } finally {
          setIsSaving(false);
        }
      },
      undefined,
      'Send Request',
      'Cancel'
    );
  };

  const renderPlayer = ({ item: opponent }) => (
    <Pressable
      style={({ pressed }) => [
        styles.playerCard,
        selectedOpponent?.uid === opponent.uid && styles.playerCardSelected,
        pressed && styles.pressed
      ]}
      onPress={() => handleSelectOpponent(opponent)}
    >
      <View style={styles.playerInfo}>
        <Text style={styles.playerName}>{opponent.displayName}</Text>
        <Text style={styles.playerEmail}>{opponent.email}</Text>
        <Text style={styles.playerRating}>Rating: {Math.round(opponent.rating)}</Text>
        <Text style={styles.playerStats}>
          {opponent.matchesPlayed || 0} matches • {opponent.wins || 0}W - {opponent.losses || 0}L
        </Text>
      </View>
      {selectedOpponent?.uid === opponent.uid && (
        <View style={styles.checkmark}>
          <Text style={styles.checkmarkText}>✓</Text>
        </View>
      )}
    </Pressable>
  );

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Please sign in to record matches</Text>
      </View>
    );
  }

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
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Record Multiple Matches</Text>
          <Text style={styles.subtitle}>
            Record several games played in a session
          </Text>
        </View>

        {!selectedOpponent ? (
          <>
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
              </View>
            ) : (
              <FlatList
                data={filteredPlayers}
                renderItem={renderPlayer}
                keyExtractor={(item) => item.uid}
                contentContainerStyle={styles.listContent}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                scrollEnabled={false}
              />
            )}
          </>
        ) : (
          <View style={styles.scoreSection}>
            <View style={styles.selectedPlayer}>
              <Text style={styles.selectedLabel}>Playing against:</Text>
              <Text style={styles.selectedName}>{selectedOpponent.displayName}</Text>
              <Text style={styles.selectedRating}>Rating: {Math.round(selectedOpponent.rating)}</Text>
              <Pressable 
                style={({ pressed }) => [styles.changeButton, pressed && styles.pressed]}
                onPress={() => setSelectedOpponent(null)}
              >
                <Text style={styles.changeButtonText}>Change Opponent</Text>
              </Pressable>
            </View>

            <View style={styles.scoreInputs}>
              <View style={styles.scoreInput}>
                <Text style={styles.scoreLabel}>Your Wins</Text>
                <TextInput
                  style={styles.scoreField}
                  placeholder="0"
                  placeholderTextColor={COLORS.textSecondary}
                  value={myWins}
                  onChangeText={setMyWins}
                  keyboardType="number-pad"
                  maxLength={3}
                />
              </View>

              <View style={styles.scoreDivider}>
                <Text style={styles.scoreDividerText}>vs</Text>
              </View>

              <View style={styles.scoreInput}>
                <Text style={styles.scoreLabel}>Their Wins</Text>
                <TextInput
                  style={styles.scoreField}
                  placeholder="0"
                  placeholderTextColor={COLORS.textSecondary}
                  value={opponentWins}
                  onChangeText={setOpponentWins}
                  keyboardType="number-pad"
                  maxLength={3}
                />
              </View>
            </View>

            <View style={styles.buttonContainer}>
              <Button
                title={isSaving ? 'Sending...' : 'Send Request'}
                onPress={handleSaveMatches}
                disabled={isSaving || (!myWins && !opponentWins)}
                style={styles.saveButton}
              />
            </View>

            <View style={styles.infoSection}>
              <Text style={styles.infoTitle}>How it works:</Text>
              <Text style={styles.infoText}>
                • Enter total wins for each player{'\n'}
                • Send request to opponent for confirmation{'\n'}
                • Opponent must accept before ratings update{'\n'}
                • ELO calculates sequentially for each game
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
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
    paddingBottom: 20,
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
  playerCardSelected: {
    borderColor: COLORS.primary,
    borderWidth: 2,
    backgroundColor: COLORS.primary + '10',
  },
  pressed: {
    opacity: 0.7,
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
  checkmark: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  checkmarkText: {
    color: COLORS.background,
    fontSize: 20,
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
  scoreSection: {
    paddingHorizontal: 16,
  },
  selectedPlayer: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  selectedLabel: {
    ...FONTS.body,
    color: COLORS.textSecondary,
    fontSize: 14,
    marginBottom: 4,
  },
  selectedName: {
    ...FONTS.subheading,
    fontSize: 20,
    marginBottom: 4,
  },
  selectedRating: {
    ...FONTS.body,
    color: COLORS.primary,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  changeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  changeButtonText: {
    ...FONTS.body,
    color: COLORS.primary,
    textDecorationLine: 'underline',
  },
  scoreInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  scoreInput: {
    flex: 1,
  },
  scoreLabel: {
    ...FONTS.body,
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: 'bold',
  },
  scoreField: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    fontSize: 24,
    color: COLORS.text,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  scoreDivider: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreDividerText: {
    ...FONTS.subheading,
    color: COLORS.textSecondary,
  },
  buttonContainer: {
    marginBottom: 24,
  },
  saveButton: {
    width: '100%',
  },
  infoSection: {
    padding: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
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
