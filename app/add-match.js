import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Alert, 
  ScrollView, 
  TextInput,
  TouchableOpacity,
  ActivityIndicator 
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { searchUsers } from '../utils/userProfile';
import { createMatchRequest } from '../utils/matchRequests';
import Button from '../components/Button';
import { COLORS } from '../constants/colors';
import { FONTS } from '../constants/fonts';

export default function AddMatchScreen() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      Alert.alert('Error', 'Please enter an email to search');
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchUsers(searchQuery.trim());
      // Filter out current user
      const filteredResults = results.filter(u => u.uid !== user.uid);
      setSearchResults(filteredResults);
      
      if (filteredResults.length === 0) {
        Alert.alert('No Results', 'No users found with that email');
      }
    } catch (error) {
      console.error('Error searching users:', error);
      Alert.alert('Error', 'Failed to search for users');
    } finally {
      setIsSearching(false);
    }
  };

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
                      setSearchResults([]);
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

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Request Match</Text>
      <Text style={styles.subtitle}>
        Search for your opponent and send a match request
      </Text>

      <View style={styles.searchSection}>
        <Text style={styles.label}>Opponent's Email</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter email address"
          placeholderTextColor={COLORS.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          keyboardType="email-address"
          autoCorrect={false}
        />
        <Button 
          title={isSearching ? "Searching..." : "Search"}
          onPress={handleSearch}
          disabled={isSearching || !searchQuery.trim()}
        />
      </View>

      {isSearching && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      )}

      {searchResults.length > 0 && (
        <View style={styles.resultsSection}>
          <Text style={styles.resultsTitle}>Search Results</Text>
          {searchResults.map((opponent) => (
            <View key={opponent.uid} style={styles.resultCard}>
              <View style={styles.resultInfo}>
                <Text style={styles.resultName}>{opponent.displayName}</Text>
                <Text style={styles.resultEmail}>{opponent.email}</Text>
                <Text style={styles.resultRating}>Rating: {Math.round(opponent.rating)}</Text>
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
          ))}
        </View>
      )}

      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>How it works:</Text>
        <Text style={styles.infoText}>
          1. Search for your opponent by their email{'\n'}
          2. Click "I Won" to send them a match request{'\n'}
          3. They must confirm the loss{'\n'}
          4. Once confirmed, both ratings will be updated
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
    ...FONTS.title,
    textAlign: 'center',
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  subtitle: {
    ...FONTS.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  searchSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  label: {
    ...FONTS.subheading,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 12,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  resultsSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  resultsTitle: {
    ...FONTS.subheading,
    marginBottom: 12,
  },
  resultCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    ...FONTS.subheading,
    marginBottom: 4,
  },
  resultEmail: {
    ...FONTS.body,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  resultRating: {
    ...FONTS.body,
    color: COLORS.primary,
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
  infoSection: {
    paddingHorizontal: 16,
    marginTop: 24,
    marginBottom: 40,
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
