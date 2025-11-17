import { useFonts } from 'expo-font';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  Montserrat_600SemiBold,
} from '@expo-google-fonts/montserrat';

export function useAppFonts() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_700Bold,
    Montserrat_600SemiBold,
  });
  const [forceReady, setForceReady] = useState(false);

  useEffect(() => {
    // On web, if fonts don't load in 3 seconds, continue anyway
    if (Platform.OS === 'web') {
      const timeout = setTimeout(() => {
        if (!fontsLoaded) {
          console.warn('Fonts taking too long to load, continuing with system fonts');
          setForceReady(true);
        }
      }, 3000);

      return () => clearTimeout(timeout);
    }
  }, [fontsLoaded]);

  // If there's an error loading fonts, continue with system fonts
  useEffect(() => {
    if (fontError) {
      console.error('Font loading error:', fontError);
      setForceReady(true);
    }
  }, [fontError]);

  return fontsLoaded || forceReady;
}
