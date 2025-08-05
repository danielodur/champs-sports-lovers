import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import "react-native-reanimated";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StyleSheet } from "react-native";
import * as Linking from "expo-linking";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { LiveTimerProvider } from "@/contexts/LiveTimerContext";
import { MatchSettingsProvider } from "@/contexts/MatchSettingsContext";
import { MessagesProvider } from "@/contexts/MessagesContext";
import { InvitesProvider } from "@/contexts/InvitesContext";
import GoalNotificationOverlay from "@/components/GoalNotificationOverlay"; // ✅ ADDED: Import goal notification overlay
import "./i18n";

// ✅ PERFORMANCE: Import preloading services
import { preloadMatchData } from "@/services/matchService";
import { sportsApiService } from "@/services/sportsApiService";
import { preloadSounds, cleanupSounds } from "@/utils/SoundManager";

// ✅ FONT FIX: Import Inter fonts from Expo Google Fonts
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";

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
      console.log("🚀 APP STARTUP: IMMEDIATE aggressive data preloading...");

      // Start preloading instantly - no timeout
      Promise.allSettled([
        // Preload core match data
        preloadMatchData(),
        // Preload API cache
        sportsApiService.preloadCommonData(),
      ])
        .then(() => {
          console.log(
            "🚀 APP STARTUP: INSTANT data preloading completed - all screens will be lightning fast!"
          );
        })
        .catch((error) => {
          console.log(
            "⚠️ APP STARTUP: Preloading failed, continuing normally:",
            error
          );
        });

      // ✅ SECOND WAVE: Additional preloading after a brief delay
      setTimeout(() => {
        console.log("🚀 SECOND WAVE: Additional preloading...");
        Promise.allSettled([
          preloadMatchData(),
          sportsApiService.preloadCommonData(),
          preloadSounds(), // Preload common sounds for better performance
        ]);
      }, 500); // Half second delay for second wave

      // 🔗 DEEP LINKING: Handle OAuth redirects
      const handleDeepLink = async (url: string) => {
        console.log("🔗 Deep link received:", url);

        // Handle OAuth callback URLs
        if (url.includes("/auth/callback")) {
          console.log("✅ OAuth callback detected, handling authentication...");

          // Check if there are any errors in the callback
          if (url.includes("error=")) {
            console.error("❌ OAuth callback error detected in URL:", url);
            // Extract error details
            const urlParams = new URLSearchParams(url.split("?")[1]);
            const error = urlParams.get("error");
            const errorDescription = urlParams.get("error_description");
            console.error("❌ OAuth Error:", error, errorDescription);
          } else {
            console.log("✅ OAuth callback successful, processing...");

            // Try to manually process the OAuth callback
            try {
              const { supabase } = await import("@/services/supabaseClient");

              // Extract access token from the URL fragment
              const accessToken = url.split("#access_token=")[1]?.split("&")[0];
              const refreshToken = url
                .split("refresh_token=")[1]
                ?.split("&")[0];

              console.log(
                "🔐 Extracted access token:",
                accessToken ? "Found" : "Not found"
              );
              console.log(
                "🔐 Extracted refresh token:",
                refreshToken ? "Found" : "Not found"
              );

              if (accessToken) {
                // Set the session from the URL
                const { data, error } = await supabase.auth.setSession({
                  access_token: accessToken,
                  refresh_token: refreshToken || "",
                });

                if (error) {
                  console.error(
                    "❌ Error setting session after OAuth callback:",
                    error
                  );
                } else if (data.session) {
                  console.log(
                    "✅ Session successfully set after OAuth callback"
                  );
                  console.log(
                    "✅ User authenticated:",
                    data.session.user.email
                  );
                } else {
                  console.log("⚠️ No session found after OAuth callback");
                }
              } else {
                console.error("❌ No access token found in URL");
              }
            } catch (importError) {
              console.error("❌ Error importing supabase client:", importError);
            }
          }

          // The auth state change will be handled by the auth service
          // Supabase should automatically process the callback and update the session
        }

        // Handle custom scheme deep links
        if (url.startsWith("champs://")) {
          console.log("🔗 Custom scheme deep link:", url);
          if (url.includes("auth/callback")) {
            console.log("✅ Custom scheme OAuth callback detected");
          }
        }
      };

      // Handle initial URL if app was opened via deep link
      Linking.getInitialURL().then((url) => {
        if (url) {
          handleDeepLink(url);
        }
      });

      // Listen for incoming deep links
      const subscription = Linking.addEventListener("url", (event) => {
        handleDeepLink(event.url);
      });

      return () => {
        subscription?.remove();
      };
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
                  <Stack.Screen
                    name="(tabs)"
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="match-details"
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen name="top" options={{ headerShown: false }} />
                  <Stack.Screen
                    name="search"
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="news-detail"
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="profile-page"
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="login-register"
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="register-and-login"
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="about-us"
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="help-center"
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="competition-details"
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="results"
                    options={{ headerShown: false }}
                  />
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
