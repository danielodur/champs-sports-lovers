import React, { useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
import * as Notifications from "expo-notifications";
import { supabase } from "../services/supabaseClient";
import useAuth from "../hooks/useAuth";

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

interface GoalNotification {
  id: string;
  user_id: string;
  fixture_id: number;
  goal_time: number;
  player_name: string;
  home_team: string;
  away_team: string;
  home_score: number;
  away_score: number;
  created_at: string;
  read: boolean;
}

export const GoalNotificationListener: React.FC = () => {
  const { user } = useAuth();
  const appState = useRef(AppState.currentState);
  const subscription = useRef<any>(null);

  // Request notification permissions
  useEffect(() => {
    const requestPermissions = async () => {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        console.log("Failed to get push token for push notification!");
        return;
      }
    };

    requestPermissions();
  }, []);

  // Listen to app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        // App came to foreground - refresh notifications
        console.log("App has come to the foreground!");
        checkForNewNotifications();
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );
    return () => subscription?.remove();
  }, []);

  // Check for new notifications when app becomes active
  const checkForNewNotifications = async () => {
    if (!user) return;

    try {
      const { data: notifications, error } = await supabase
        .from("goal_notifications")
        .select("*")
        .eq("user_id", user.id)
        .eq("read", false)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) {
        console.error("Error fetching notifications:", error);
        return;
      }

      // Mark as read
      if (notifications && notifications.length > 0) {
        const notificationIds = notifications.map((n) => n.id);
        await supabase
          .from("goal_notifications")
          .update({ read: true })
          .in("id", notificationIds);
      }
    } catch (error) {
      console.error("Error checking notifications:", error);
    }
  };

  // Listen to real-time goal notifications
  useEffect(() => {
    if (!user) return;

    // Subscribe to new goal notifications
    subscription.current = supabase
      .channel("goal_notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "goal_notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const notification = payload.new as GoalNotification;
          console.log("🎉 New goal notification received:", notification);

          // Show local notification
          showLocalNotification(notification);
        }
      )
      .subscribe();

    return () => {
      if (subscription.current) {
        supabase.removeChannel(subscription.current);
      }
    };
  }, [user]);

  // Show local notification
  const showLocalNotification = async (notification: GoalNotification) => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "⚽ Goal!",
          body: `${notification.home_team} ${notification.home_score} - ${notification.away_score} ${notification.away_team} (${notification.goal_time}') ${notification.player_name}`,
          data: {
            fixtureId: notification.fixture_id,
            type: "goal",
            notificationId: notification.id,
          },
          sound: "default",
          priority: "high",
        },
        trigger: null, // Show immediately
      });

      console.log("✅ Local notification scheduled");
    } catch (error) {
      console.error("❌ Error scheduling notification:", error);
    }
  };

  // Listen to notification interactions
  useEffect(() => {
    const notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log("Notification received:", notification);
      }
    );

    const responseListener =
      Notifications.addNotificationResponseReceivedListener((response) => {
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
