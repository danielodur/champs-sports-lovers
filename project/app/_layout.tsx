import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { LiveTimerProvider } from '@/contexts/LiveTimerContext';
import { MatchSettingsProvider } from '@/contexts/MatchSettingsContext';
import { MessagesProvider } from '@/contexts/MessagesContext';
import { InvitesProvider } from '@/contexts/InvitesContext';
import GoalNotificationOverlay from '@/components/GoalNotificationOverlay'; // ✅ ADDED: Import goal notification overlay
import './i18n';

// ✅ PERFORMANCE: Import preloading services
import { preloadMatchData } from '@/services/matchService';
import { sportsApiService } from '@/services/sportsApiService';
import { preloadSounds, cleanupSounds } from '@/utils/SoundManager';

// ✅ FONT FIX: Import Inter fonts from Expo Google Fonts
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
      
      // ✅ AGGRESSIVE PRELOADING: Start immediately with no delay
      console.log('🚀 APP STARTUP: IMMEDIATE aggressive data preloading...');
      
      // Start preloading instantly - no timeout
      Promise.allSettled([
        // Preload core match data
        preloadMatchData(),
        // Preload API cache
        sportsApiService.preloadCommonData()
      ]).then(() => {
        console.log('🚀 APP STARTUP: INSTANT data preloading completed - all screens will be lightning fast!');
      }).catch(error => {
        console.log('⚠️ APP STARTUP: Preloading failed, continuing normally:', error);
      });
      
      // ✅ SECOND WAVE: Additional preloading after a brief delay
      setTimeout(() => {
        console.log('🚀 SECOND WAVE: Additional preloading...');
        Promise.allSettled([
          preloadMatchData(),
          sportsApiService.preloadCommonData(),
          preloadSounds() // Preload common sounds for better performance
        ]);
      }, 500); // Half second delay for second wave
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <LanguageProvider>
        <LiveTimerProvider>
          <MatchSettingsProvider>
            <MessagesProvider>
              <InvitesProvider>
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  <Stack.Screen name="match-details" options={{ headerShown: false }} />
                  <Stack.Screen name="top" options={{ headerShown: false }} />
                  <Stack.Screen name="search" options={{ headerShown: false }} />
                  <Stack.Screen name="news-detail" options={{ headerShown: false }} />
                  <Stack.Screen name="profile-page" options={{ headerShown: false }} />
                  <Stack.Screen name="login-register" options={{ headerShown: false }} />
                  <Stack.Screen name="register-and-login" options={{ headerShown: false }} />
                  <Stack.Screen name="about-us" options={{ headerShown: false }} />
                  <Stack.Screen name="help-center" options={{ headerShown: false }} />
                  <Stack.Screen name="competition-details" options={{ headerShown: false }} />
                  <Stack.Screen name="results" options={{ headerShown: false }} />
                  <Stack.Screen name="+not-found" />
                </Stack>
                {/* ✅ ADDED: Global goal notification overlay for all screens */}
                <GoalNotificationOverlay />
              </InvitesProvider>
            </MessagesProvider>
          </MatchSettingsProvider>
        </LiveTimerProvider>
      </LanguageProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});