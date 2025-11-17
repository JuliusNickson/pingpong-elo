import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { getUserProfile, createUserProfile } from '../utils/userProfile';
import { getCurrentUserProfile, saveCurrentUserProfile, clearCurrentUserProfile } from '../utils/userStorage';
import { signOut } from '../utils/auth';
import { showSimpleAlert, showConfirm } from '../utils/alerts';
import PlayerCard from '../components/PlayerCard';
import { COLORS } from '../constants/colors';
import { FONTS, FONT_SIZES } from '../constants/fonts';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserProfile();
  }, [user]);

  const loadUserProfile = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // First try to get from local storage
      let localProfile = await getCurrentUserProfile();
      
      if (localProfile && localProfile.uid === user.uid) {
        setProfile(localProfile);
      }
      
      // Then fetch from Firestore to get latest data
      const firestoreProfile = await getUserProfile(user.uid);
      
      if (firestoreProfile) {
        setProfile(firestoreProfile);
        // Update local cache
        await saveCurrentUserProfile(firestoreProfile);
      } else if (!localProfile) {
        // No profile found - create one (for users who registered before profile creation was added)
        console.log('Creating profile for existing user...');
        try {
          await createUserProfile(user.uid, user.displayName || 'Player', user.email);
          // Fetch the newly created profile
          const newProfile = await getUserProfile(user.uid);
          if (newProfile) {
            setProfile(newProfile);
            await saveCurrentUserProfile(newProfile);
          }
        } catch (createError) {
          console.error('Error creating profile for user:', createError);
          showSimpleAlert('Profile Error', 'Could not create user profile. Please try again or contact support.');
        }
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    showConfirm(
      'Sign Out',
      'Are you sure you want to sign out?',
      async () => {
        try {
          await clearCurrentUserProfile();
          await signOut();
        } catch (error) {
          showSimpleAlert('Error', 'Failed to sign out');
        }
      },
      undefined,
      'Sign Out',
      'Cancel',
      'destructive'
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello,</Text>
          <Text style={styles.username}>{user?.displayName || 'Player'}</Text>
        </View>
        <Pressable style={({ pressed }) => [styles.signOutButton, pressed && styles.pressed]} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </Pressable>
      </View>
      
      {profile && (
        <View style={styles.profileSection}>
          <Text style={styles.sectionTitle}>Your Stats</Text>
          <PlayerCard 
            player={{
              id: profile.uid,
              name: profile.displayName,
              elo: profile.rating,
              rating: profile.rating,
              rd: profile.rd,
              matchesPlayed: profile.matchesPlayed,
              wins: profile.wins,
              losses: profile.losses
            }} 
            rank={1}
            showRank={false}
          />
        </View>
      )}
      
      <View style={styles.navigation}>
        <Pressable 
          style={({ pressed }) => [styles.navButton, pressed && styles.pressed]}
          onPress={() => router.push('/add-match')}
        >
          <Text style={styles.navButtonIcon}>🏓</Text>
          <Text style={styles.navButtonText}>Challenge Player</Text>
          <Text style={styles.navButtonSubtext}>Send match request</Text>
        </Pressable>
        
        <Pressable 
          style={({ pressed }) => [styles.navButton, pressed && styles.pressed]}
          onPress={() => router.push('/requests')}
        >
          <Text style={styles.navButtonIcon}>📬</Text>
          <Text style={styles.navButtonText}>Match Requests</Text>
          <Text style={styles.navButtonSubtext}>View pending requests</Text>
        </Pressable>
        
        <Pressable 
          style={({ pressed }) => [styles.navButton, pressed && styles.pressed]}
          onPress={() => router.push('/history')}
        >
          <Text style={styles.navButtonIcon}>📜</Text>
          <Text style={styles.navButtonText}>Match History</Text>
          <Text style={styles.navButtonSubtext}>View past matches</Text>
        </Pressable>
        
        <Pressable 
          style={({ pressed }) => [styles.navButton, pressed && styles.pressed]}
          onPress={() => router.push('/players')}
        >
          <Text style={styles.navButtonIcon}>🏆</Text>
          <Text style={styles.navButtonText}>Leaderboard</Text>
          <Text style={styles.navButtonSubtext}>See top players</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 10,
  },
  greeting: {
    fontSize: FONT_SIZES.medium,
    fontFamily: FONTS.body,
    color: COLORS.textSecondary,
  },
  username: {
    fontSize: FONT_SIZES.xlarge,
    fontFamily: FONTS.title,
    color: COLORS.text,
    marginTop: 4,
  },
  signOutButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.textSecondary,
  },
  signOutText: {
    fontSize: FONT_SIZES.small,
    fontFamily: FONTS.subheading,
    color: COLORS.textSecondary,
  },
  profileSection: {
    padding: 20,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.large,
    fontFamily: FONTS.subheading,
    color: COLORS.text,
    marginBottom: 16,
  },
  navigation: {
    padding: 20,
    gap: 16,
  },
  navButton: {
    backgroundColor: COLORS.surface,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  navButtonIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  navButtonText: {
    fontSize: FONT_SIZES.large,
    fontFamily: FONTS.subheading,
    color: COLORS.text,
    marginBottom: 4,
  },
  navButtonSubtext: {
    fontSize: FONT_SIZES.small,
    fontFamily: FONTS.body,
    color: COLORS.textSecondary,
  },
  pressed: {
    opacity: 0.7,
  },
});
