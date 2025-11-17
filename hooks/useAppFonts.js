import { useFonts } from 'expo-font';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  Montserrat_600SemiBold,
} from '@expo-google-fonts/montserrat';

export function useAppFonts() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_700Bold,
    Montserrat_600SemiBold,
  });

  return fontsLoaded;
}
