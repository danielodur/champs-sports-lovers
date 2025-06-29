import React, { useEffect } from 'react';
import './i18n';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useFonts } from 'expo-font';
import { SplashScreen } from 'expo-router';
import { Platform, UIManager } from 'react-native';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { MessagesProvider } from '@/contexts/MessagesContext';
import { InvitesProvider } from '@/contexts/InvitesContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { LiveTimerProvider } from '@/contexts/LiveTimerContext';
import { MatchSettingsProvider } from '@/contexts/MatchSettingsContext';
import GoalNotificationOverlay from '@/components/GoalNotificationOverlay';
import useAuth from '@/hooks/useAuth';
import goalDetectionService from '@/services/goalDetectionService';

// ✨ MODERN APP OPTIMIZATION: Enable layout animations for beautiful transitions
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(false); // Disable to prevent conflicts
  }
}

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const isReady = useFrameworkReady();
  const { initializeAuth } = useAuth();

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    // Initialize authentication state on app load
    initializeAuth();
    
    // Start goal detection service
    goalDetectionService.startMonitoring();
    console.log('🚨 Goal detection service started in app layout');
    
    return () => {
      goalDetectionService.stopMonitoring();
    };
  }, []);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <LanguageProvider>
      <LiveTimerProvider>
        <MessagesProvider>
          <InvitesProvider>
            <MatchSettingsProvider>
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: 'transparent' },
                  // ✨ MODERN BEAUTIFUL TRANSITION: Inspired by Instagram/Twitter
                  animation: 'fade',
                  animationDuration: 150, // Quick, modern fade
                  gestureEnabled: false,
                  animationTypeForReplace: 'push',
                }}
              >
                <Stack.Screen 
                  name="(tabs)" 
                  options={{ 
                    headerShown: false,
                    presentation: 'card',
                    // ✨ HOME SCREEN: Instant beautiful entrance
                    animation: 'fade',
                    animationDuration: 150,
                    gestureEnabled: false,
                    animationTypeForReplace: 'push',
                  }} 
                />
                <Stack.Screen 
                  name="top" 
                  options={{ 
                    headerShown: false,
                    presentation: 'card',
                    // ✨ TOP SCREEN: Elegant fade entrance
                    animation: 'fade',
                    animationDuration: 150,
                    gestureEnabled: false,
                    animationTypeForReplace: 'push',
                  }} 
                />
              </Stack>
              <GoalNotificationOverlay />
              <StatusBar style="light" />
            </MatchSettingsProvider>
          </InvitesProvider>
        </MessagesProvider>
      </LiveTimerProvider>
    </LanguageProvider>
  );
}