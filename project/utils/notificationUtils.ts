import { Platform, Alert, Linking } from "react-native";

// Notification types for better type safety
export interface NotificationContent {
  title: string;
  body: string;
  data?: any;
  sound?: boolean;
  vibrate?: boolean;
  priority?: "default" | "high" | "max";
}

export interface NotificationPermissionStatus {
  canAskAgain: boolean;
  expires: "never" | number;
  granted: boolean;
  status: "undetermined" | "denied" | "granted";
}

export interface NotificationRequest {
  content: NotificationContent;
  identifier: string;
  trigger?: any;
}

// Safe notification manager class
export class SafeNotifications {
  private static instance: SafeNotifications | null = null;
  private notifications: any = null;
  private isAvailable: boolean = false;
  private initialized: boolean = false;

  private constructor() {
    this.initialize();
  }

  public static getInstance(): SafeNotifications {
    if (!SafeNotifications.instance) {
      SafeNotifications.instance = new SafeNotifications();
    }
    return SafeNotifications.instance;
  }

  private initialize(): void {
    try {
      this.notifications = require("expo-notifications");
      this.isAvailable = true;
      this.setupNotificationHandler();
      console.log("✅ SafeNotifications: expo-notifications loaded successfully");
    } catch (error) {
      console.warn("⚠️ SafeNotifications: expo-notifications not available:", error);
      this.isAvailable = false;
      this.notifications = null;
    }
    this.initialized = true;
  }

  private setupNotificationHandler(): void {
    if (!this.isAvailable || !this.notifications?.setNotificationHandler) {
      return;
    }

    try {
      this.notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
      console.log("✅ SafeNotifications: Notification handler configured");
    } catch (error) {
      console.warn("⚠️ SafeNotifications: Failed to setup notification handler:", error);
    }
  }

  public isNotificationAvailable(): boolean {
    return this.isAvailable && this.notifications !== null;
  }

  public async getPermissionsAsync(): Promise<NotificationPermissionStatus | null> {
    if (!this.isNotificationAvailable() || !this.notifications.getPermissionsAsync) {
      console.warn("SafeNotifications: getPermissionsAsync not available");
      return null;
    }

    try {
      const permissions = await this.notifications.getPermissionsAsync();
      console.log("SafeNotifications: Current permissions:", permissions);
      return permissions;
    } catch (error) {
      console.error("SafeNotifications: Error getting permissions:", error);
      return null;
    }
  }

  public async requestPermissionsAsync(options?: any): Promise<NotificationPermissionStatus | null> {
    if (!this.isNotificationAvailable() || !this.notifications.requestPermissionsAsync) {
      console.warn("SafeNotifications: requestPermissionsAsync not available");
      return null;
    }

    try {
      const defaultOptions = {
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
          allowDisplayInCarPlay: false,
          allowCriticalAlerts: false,
          provideAppNotificationSettings: false,
          allowProvisional: false,
          allowAnnouncements: false,
        },
        android: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      };

      const permissions = await this.notifications.requestPermissionsAsync(
        options || defaultOptions
      );
      console.log("SafeNotifications: Permission request result:", permissions);
      return permissions;
    } catch (error) {
      console.error("SafeNotifications: Error requesting permissions:", error);
      return null;
    }
  }

  public async scheduleNotificationAsync(
    request: Omit<NotificationRequest, 'identifier'> & { identifier?: string }
  ): Promise<string | null> {
    if (!this.isNotificationAvailable() || !this.notifications.scheduleNotificationAsync) {
      console.warn("SafeNotifications: scheduleNotificationAsync not available");
      return null;
    }

    try {
      const notificationRequest: NotificationRequest = {
        identifier: request.identifier || `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        content: request.content,
        trigger: request.trigger || null,
      };

      const identifier = await this.notifications.scheduleNotificationAsync(notificationRequest);
      console.log("SafeNotifications: Notification scheduled with ID:", identifier);
      return identifier;
    } catch (error) {
      console.error("SafeNotifications: Error scheduling notification:", error);
      return null;
    }
  }

  public async cancelNotificationAsync(identifier: string): Promise<boolean> {
    if (!this.isNotificationAvailable() || !this.notifications.cancelScheduledNotificationAsync) {
      console.warn("SafeNotifications: cancelScheduledNotificationAsync not available");
      return false;
    }

    try {
      await this.notifications.cancelScheduledNotificationAsync(identifier);
      console.log("SafeNotifications: Notification cancelled:", identifier);
      return true;
    } catch (error) {
      console.error("SafeNotifications: Error cancelling notification:", error);
      return false;
    }
  }

  public async cancelAllNotificationsAsync(): Promise<boolean> {
    if (!this.isNotificationAvailable() || !this.notifications.cancelAllScheduledNotificationsAsync) {
      console.warn("SafeNotifications: cancelAllScheduledNotificationsAsync not available");
      return false;
    }

    try {
      await this.notifications.cancelAllScheduledNotificationsAsync();
      console.log("SafeNotifications: All notifications cancelled");
      return true;
    } catch (error) {
      console.error("SafeNotifications: Error cancelling all notifications:", error);
      return false;
    }
  }

  public addNotificationReceivedListener(listener: (notification: any) => void): (() => void) | null {
    if (!this.isNotificationAvailable() || !this.notifications.addNotificationReceivedListener) {
      console.warn("SafeNotifications: addNotificationReceivedListener not available");
      return null;
    }

    try {
      const subscription = this.notifications.addNotificationReceivedListener(listener);
      console.log("SafeNotifications: Notification received listener added");
      return () => {
        if (subscription && subscription.remove) {
          subscription.remove();
          console.log("SafeNotifications: Notification received listener removed");
        }
      };
    } catch (error) {
      console.error("SafeNotifications: Error adding notification received listener:", error);
      return null;
    }
  }

  public addNotificationResponseReceivedListener(listener: (response: any) => void): (() => void) | null {
    if (!this.isNotificationAvailable() || !this.notifications.addNotificationResponseReceivedListener) {
      console.warn("SafeNotifications: addNotificationResponseReceivedListener not available");
      return null;
    }

    try {
      const subscription = this.notifications.addNotificationResponseReceivedListener(listener);
      console.log("SafeNotifications: Notification response listener added");
      return () => {
        if (subscription && subscription.remove) {
          subscription.remove();
          console.log("SafeNotifications: Notification response listener removed");
        }
      };
    } catch (error) {
      console.error("SafeNotifications: Error adding notification response listener:", error);
      return null;
    }
  }

  public async getPushTokenAsync(): Promise<string | null> {
    if (!this.isNotificationAvailable() || !this.notifications.getExpoPushTokenAsync) {
      console.warn("SafeNotifications: getExpoPushTokenAsync not available");
      return null;
    }

    try {
      const token = await this.notifications.getExpoPushTokenAsync();
      console.log("SafeNotifications: Push token retrieved:", token?.data || "No token");
      return token?.data || null;
    } catch (error) {
      console.error("SafeNotifications: Error getting push token:", error);
      return null;
    }
  }

  // High-level convenience methods
  public async ensurePermissions(): Promise<boolean> {
    const permissions = await this.getPermissionsAsync();

    if (!permissions) {
      console.warn("SafeNotifications: Cannot check permissions - notifications not available");
      return false;
    }

    if (permissions.granted) {
      console.log("SafeNotifications: Permissions already granted");
      return true;
    }

    if (!permissions.canAskAgain) {
      console.warn("SafeNotifications: Cannot ask for permissions again");
      this.showPermissionAlert();
      return false;
    }

    const result = await this.requestPermissionsAsync();
    return result?.granted || false;
  }

  private showPermissionAlert(): void {
    Alert.alert(
      "Notifications Required",
      "To receive notifications, please enable them in your device settings.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Open Settings",
          onPress: () => {
            if (Platform.OS === "ios") {
              Linking.openURL("app-settings:");
            } else {
              Linking.openSettings();
            }
          },
        },
      ]
    );
  }

  public async sendGoalNotification(
    homeTeam: string,
    awayTeam: string,
    homeScore: number,
    awayScore: number,
    minute: string,
    scorer: string
  ): Promise<string | null> {
    const hasPermissions = await this.ensurePermissions();
    if (!hasPermissions) {
      console.warn("SafeNotifications: No permissions for goal notification");
      return null;
    }

    return this.scheduleNotificationAsync({
      content: {
        title: "⚽ Goal!",
        body: `${homeTeam} [${homeScore} - ${awayScore}] ${awayTeam}\n${minute}' ${scorer}`,
        data: {
          type: "goal",
          homeTeam,
          awayTeam,
          homeScore,
          awayScore,
          minute,
          scorer,
        },
        sound: true,
        vibrate: true,
        priority: "high",
      },
    });
  }

  public async sendTestNotification(): Promise<string | null> {
    const hasPermissions = await this.ensurePermissions();
    if (!hasPermissions) {
      console.warn("SafeNotifications: No permissions for test notification");
      return null;
    }

    return this.scheduleNotificationAsync({
      content: {
        title: "🔔 Test Notification",
        body: "This is a test notification from Champs!",
        data: { type: "test" },
        sound: true,
      },
    });
  }

  // Static convenience methods
  public static async sendGoal(
    homeTeam: string,
    awayTeam: string,
    homeScore: number,
    awayScore: number,
    minute: string,
    scorer: string
  ): Promise<string | null> {
    return SafeNotifications.getInstance().sendGoalNotification(
      homeTeam,
      awayTeam,
      homeScore,
      awayScore,
      minute,
      scorer
    );
  }

  public static async sendTest(): Promise<string | null> {
    return SafeNotifications.getInstance().sendTestNotification();
  }

  public static async checkPermissions(): Promise<boolean> {
    const permissions = await SafeNotifications.getInstance().getPermissionsAsync();
    return permissions?.granted || false;
  }

  public static async requestPermissions(): Promise<boolean> {
    return SafeNotifications.getInstance().ensurePermissions();
  }

  public static isAvailable(): boolean {
    return SafeNotifications.getInstance().isNotificationAvailable();
  }
}

// Export singleton instance for convenience
export const safeNotifications = SafeNotifications.getInstance();

// Export common notification utilities
export const NotificationUtils = {
  // Check if notifications are supported on this platform
  isSupported: (): boolean => SafeNotifications.isAvailable(),

  // Quick permission check
  hasPermissions: (): Promise<boolean> => SafeNotifications.checkPermissions(),

  // Quick permission request
  requestPermissions: (): Promise<boolean> => SafeNotifications.requestPermissions(),

  // Send a goal notification
  sendGoal: (
    homeTeam: string,
    awayTeam: string,
    homeScore: number,
    awayScore: number,
    minute: string,
    scorer: string
  ): Promise<string | null> =>
    SafeNotifications.sendGoal(homeTeam, awayTeam, homeScore, awayScore, minute, scorer),

  // Send a test notification
  sendTest: (): Promise<string | null> => SafeNotifications.sendTest(),

  // Get the singleton instance for advanced usage
  getInstance: (): SafeNotifications => SafeNotifications.getInstance(),
};

// Default export
export default SafeNotifications;
