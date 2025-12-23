import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert, Platform, Linking } from "react-native";
import goalDetectionService from "../services/goalDetectionService";

// Import notifications with proper error handling
let Notifications: any = null;
try {
  Notifications = require("expo-notifications");
} catch (error) {
  console.warn("expo-notifications not available:", error);
}

interface MatchSettings {
  // Notification settings
  goalNotification: boolean;
  soundNotification: boolean;
  vibrationEnabled: boolean;
  goalAnimation: boolean;

  // Competition range
  competitionRange: "all" | "following";

  // Sound settings
  homeTeamSound: string;
  awayTeamSound: string;
  goalSound: string;
  redCardSound: boolean;

  // Sport-specific settings
  footballEnabled: boolean;
  basketballEnabled: boolean;
  rugbyEnabled: boolean;
  boxingEnabled: boolean;
}

interface GoalNotificationData {
  id: string;
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  scorer: string;
  minute: string;
  score: string;
  league: string;
  sport: string;
  timestamp: number;
  scoringTeam?: "home" | "away";
  eventType?: "goal" | "cancelled" | "red_card";
  isRealData?: boolean;
}

interface MatchSettingsContextType {
  settings: MatchSettings;
  updateSetting: (key: keyof MatchSettings, value: any) => void;
  resetSettings: () => void;
  showGoalNotification: (data: GoalNotificationData) => void;
  goalNotifications: GoalNotificationData[];
  dismissGoalNotification: (id: string) => void;
  dismissAllGoalNotifications: () => void;
  checkNotificationPermission: () => Promise<boolean>;
  requestNotificationPermission: () => Promise<boolean>;
}

const defaultSettings: MatchSettings = {
  goalNotification: true,
  soundNotification: true,
  vibrationEnabled: true,
  goalAnimation: true,
  competitionRange: "all",
  homeTeamSound: "Default",
  awayTeamSound: "Default",
  goalSound: "Drum",
  redCardSound: false,
  footballEnabled: true,
  basketballEnabled: true,
  rugbyEnabled: true,
  boxingEnabled: true,
};

const MatchSettingsContext = createContext<
  MatchSettingsContextType | undefined
>(undefined);

export const useMatchSettings = () => {
  const context = useContext(MatchSettingsContext);
  if (!context) {
    throw new Error(
      "useMatchSettings must be used within a MatchSettingsProvider",
    );
  }
  return context;
};

interface MatchSettingsProviderProps {
  children: ReactNode;
}

export const MatchSettingsProvider: React.FC<MatchSettingsProviderProps> = ({
  children,
}) => {
  const [settings, setSettings] = useState<MatchSettings>(defaultSettings);
  const [goalNotifications, setGoalNotifications] = useState<
    GoalNotificationData[]
  >([]);

  // Load settings from AsyncStorage on mount and set up goal detection
  useEffect(() => {
    loadSettings();

    // Subscribe to goal notifications
    const unsubscribe = goalDetectionService.subscribe((goalData) => {
      showGoalNotification(goalData);
    });

    // Start monitoring for goals
    goalDetectionService.startMonitoring();

    return () => {
      unsubscribe();
      goalDetectionService.stopMonitoring();
    };
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem("matchSettings");
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings({ ...defaultSettings, ...parsedSettings });
        console.log("✅ Match settings loaded successfully");
      } else {
        console.log("📋 No saved settings found, using defaults");
        setSettings(defaultSettings);
      }
    } catch (error) {
      console.log("❌ Error loading match settings:", error);
      // Fallback to default settings
      setSettings(defaultSettings);
    }
  };

  const saveSettings = async (newSettings: MatchSettings) => {
    try {
      await AsyncStorage.setItem("matchSettings", JSON.stringify(newSettings));
      console.log("✅ Match settings saved successfully");
    } catch (error) {
      console.log("❌ Error saving match settings:", error);
      // Continue operation even if save fails - don't interrupt user experience
    }
  };

  const updateSetting = (key: keyof MatchSettings, value: any) => {
    try {
      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);
      saveSettings(newSettings);
      console.log(`✅ Setting updated: ${key} = ${value}`);
    } catch (error) {
      console.error(`❌ Error updating setting ${key}:`, error);
      // Revert to previous settings if update fails
      console.log("🔄 Reverting to previous settings");
    }
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    saveSettings(defaultSettings);
  };

  const checkNotificationPermission = async (): Promise<boolean> => {
    if (!Notifications?.getPermissionsAsync) {
      console.warn("Notifications not available");
      return false;
    }

    try {
      const { status } = await Notifications.getPermissionsAsync();
      const isGranted = status === "granted";
      console.log(`🔔 Notification permission status: ${status}`);
      return isGranted;
    } catch (error) {
      console.log("❌ Error checking notification permission:", error);
      return false;
    }
  };

  const requestNotificationPermission = async (): Promise<boolean> => {
    if (
      !Notifications?.getPermissionsAsync ||
      !Notifications?.requestPermissionsAsync
    ) {
      console.warn("Notifications not available");
      return false;
    }

    try {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();

      if (existingStatus === "granted") {
        console.log("✅ Notification permission already granted");
        return true;
      }

      if (existingStatus === "denied") {
        console.log(
          "⚠️ Notification permission denied, showing settings prompt",
        );
        Alert.alert(
          "Notifications Required",
          "To receive goal notifications, please enable notifications in your device settings.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Open Settings",
              onPress: () => {
                try {
                  if (Platform.OS === "ios") {
                    Linking.openURL("app-settings:");
                  } else {
                    Linking.openSettings();
                  }
                } catch (linkingError) {
                  console.error("❌ Error opening settings:", linkingError);
                }
              },
            },
          ],
        );
        return false;
      }

      console.log("🔔 Requesting notification permission...");
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
        android: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
          allowVibrate: true,
        },
      });

      const isGranted = status === "granted";
      console.log(`🔔 Permission request result: ${status}`);
      return isGranted;
    } catch (error) {
      console.log("❌ Error requesting notification permission:", error);
      return false;
    }
  };

  const showGoalNotification = (data: GoalNotificationData) => {
    if (!settings.goalNotification) return;

    // Create complete notification data with ID and timestamp
    const notificationData: GoalNotificationData = {
      ...data,
      id:
        data.id ||
        `goal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: data.timestamp || Date.now(),
    };

    console.log("🚨 COMPACT GOAL ALERT (Chinese-style):", {
      teams: `${notificationData.homeTeam} vs ${notificationData.awayTeam}`,
      score: notificationData.score,
      minute: notificationData.minute,
      scorer: notificationData.scorer,
    });

    setGoalNotifications((prevNotifications) => {
      // Add new notification and keep only the last 3 (prevent screen clutter)
      const newNotifications = [...prevNotifications, notificationData];
      return newNotifications.slice(-3); // Keep only last 3 notifications
    });

    // Auto-dismiss after 6 seconds (longer for readability)
    setTimeout(() => {
      setGoalNotifications((prevNotifications) =>
        prevNotifications.filter(
          (notification) => notification.id !== notificationData.id,
        ),
      );
    }, 6000);
  };

  const dismissGoalNotification = (id: string) => {
    setGoalNotifications((prevNotifications) =>
      prevNotifications.filter((notification) => notification.id !== id),
    );
  };

  const dismissAllGoalNotifications = () => {
    setGoalNotifications([]);
  };

  return (
    <MatchSettingsContext.Provider
      value={{
        settings,
        updateSetting,
        resetSettings,
        showGoalNotification,
        goalNotifications,
        dismissGoalNotification,
        dismissAllGoalNotifications,
        checkNotificationPermission,
        requestNotificationPermission,
      }}
    >
      {children}
    </MatchSettingsContext.Provider>
  );
};
