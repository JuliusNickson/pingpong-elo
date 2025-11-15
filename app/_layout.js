import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#2563EB',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
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
