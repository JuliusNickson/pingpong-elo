import { Stack } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAppFonts } from '../hooks/useAppFonts';
import { COLORS } from '../constants/colors';

export default function RootLayout() {
  const fontsLoaded = useAppFonts();

  if (!fontsLoaded) {
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
        name="index" 
        options={{ 
          title: 'Leaderboard',
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
          title: 'Add Match',
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
