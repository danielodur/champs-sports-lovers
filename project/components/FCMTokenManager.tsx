import React, { useEffect, useState } from "react";
import { Platform } from "react-native";
import { supabase } from "../services/supabaseClient";
import useAuth from "../hooks/useAuth";

// Import notifications with proper error handling
let Notifications: any = null;
try {
  Notifications = require("expo-notifications");
  // Configure notification behavior only if notifications are available
  if (Notifications?.setNotificationHandler) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  }
} catch (error) {
  console.warn("expo-notifications not available:", error);
}

export const FCMTokenManager: React.FC = () => {
  const { user } = useAuth();
  const [fcmToken, setFcmToken] = useState<string | undefined>();

  useEffect(() => {
    if (!user || !Notifications) return;

    // Request permissions
    const requestPermissions = async () => {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        if (!Notifications?.requestPermissionsAsync) {
          console.warn("Cannot request notification permissions");
          return;
        }
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        console.log("Failed to get push token for push notification!");
        return;
      }
    };

    // Get FCM token (Expo automatically provides this for Android)
    const getFCMToken = async () => {
      try {
        // Expo automatically provides FCM tokens for Android
        // This token works with both Expo push service and FCM
        const token = await Notifications.getDevicePushTokenAsync();

        console.log("FCM token (via Expo):", token.data);
        setFcmToken(token.data);

        // Save to database as FCM token
        await saveTokenToDatabase(token.data);
      } catch (error) {
        console.error("Error getting FCM token:", error);
      }
    };

    const saveTokenToDatabase = async (token: string) => {
      try {
        const { error } = await supabase.from("user_devices").upsert(
          {
            user_id: user.id,
            fcm_token: token, // Store as FCM token
            device_type: Platform.OS,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "user_id",
          },
        );

        if (error) {
          console.error("Error saving FCM token to database:", error);
        } else {
          console.log("✅ FCM token saved to database");
        }
      } catch (error) {
        console.error("Error saving token:", error);
      }
    };

    requestPermissions();
    getFCMToken();

    // Listen for token refreshes
    const tokenListener = Notifications.addPushTokenListener((token: any) => {
      console.log("FCM token refreshed:", token);
      setFcmToken(token.data);
      saveTokenToDatabase(token.data);
    });

    return () => {
      tokenListener?.remove();
    };
  }, [user]);

  // Listen to notification interactions
  useEffect(() => {
    const notificationListener = Notifications.addNotificationReceivedListener(
      (notification: any) => {
        console.log("Notification received:", notification);
      },
    );

    const responseListener =
      Notifications.addNotificationResponseReceivedListener((response: any) => {
        const data = response.notification.request.content.data;
        console.log("Notification tapped:", data);

        // Handle notification tap - navigate to match details, etc.
        if (data?.fixtureId) {
          // Navigate to fixture details
          // navigation.navigate('MatchDetails', { fixtureId: data.fixtureId });
        }
      });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    };
  }, []);

  return null; // This component doesn't render anything
};
