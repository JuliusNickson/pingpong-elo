import { Stack, useRouter, useSegments } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useEffect } from 'react';
import { useAppFonts } from '../hooks/useAppFonts';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { initDatabase } from '../utils/database';
import { COLORS } from '../constants/colors';

function RootLayoutNav() {
  const fontsLoaded = useAppFonts();
  const { user, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  // Initialize database on mount
  useEffect(() => {
    initDatabase();
  }, []);

  useEffect(() => {
    if (loading || !fontsLoaded) return;

    const inAuthGroup = segments[0] === '(auth)' || segments[0] === 'login' || segments[0] === 'register';

    if (!user && !inAuthGroup) {
      // Redirect to login if not authenticated
      router.replace('/login');
    } else if (user && inAuthGroup) {
      // Redirect to home if authenticated
      router.replace('/');
    }
  }, [user, loading, fontsLoaded, segments]);

  if (!fontsLoaded || loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.background,
        },
        headerTintColor: COLORS.text,
        headerTitleStyle: {
          fontFamily: 'Inter_700Bold',
        },
      }}
    >
      <Stack.Screen 
        name="login" 
        options={{ 
          title: 'Sign In',
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="register" 
        options={{ 
          title: 'Register',
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'My Stats',
          headerShown: true,
        }} 
      />
      <Stack.Screen 
        name="players" 
        options={{ 
          title: 'Players',
          headerShown: true,
        }} 
      />
      <Stack.Screen 
        name="add-match" 
        options={{ 
          title: 'Challenge Player',
          headerShown: true,
        }} 
      />
      <Stack.Screen 
        name="requests" 
        options={{ 
          title: 'Match Requests',
          headerShown: true,
        }} 
      />
      <Stack.Screen 
        name="history" 
        options={{ 
          title: 'Match History',
          headerShown: true,
        }} 
      />
      <Stack.Screen 
        name="settings" 
        options={{ 
          title: 'Settings',
          headerShown: true,
        }} 
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
