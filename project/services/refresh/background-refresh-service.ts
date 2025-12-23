import AsyncStorage from "@react-native-async-storage/async-storage";

// Simple event emitter for React Native
class SimpleEventEmitter {
  private listeners: { [key: string]: Function[] } = {};

  on(event: string, listener: Function): void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(listener);
  }

  off(event: string, listener: Function): void {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter((l) => l !== listener);
  }

  emit(event: string, ...args: any[]): void {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach((listener) => {
      try {
        listener(...args);
      } catch (error) {
        console.error("Event listener error:", error);
      }
    });
  }

  removeAllListeners(event?: string): void {
    if (event) {
      delete this.listeners[event];
    } else {
      this.listeners = {};
    }
  }
}

// Types for refresh service
interface RefreshConfig {
  intervalMs: number;
  maxRetries: number;
  exponentialBackoff: boolean;
  visualFeedback: boolean;
  smartScheduling: boolean;
}

interface RefreshSubscription {
  id: string;
  screenType:
    | "match-details"
    | "live-matches"
    | "finished-matches"
    | "all-matches"
    | "fixture-matches";
  refreshCallback: () => Promise<void>;
  config: RefreshConfig;
  lastRefresh: number;
  retryCount: number;
  isActive: boolean;
}

interface RefreshStatus {
  isRefreshing: boolean;
  lastRefreshTime: number;
  successCount: number;
  errorCount: number;
  nextRefreshTime: number;
}

class BackgroundRefreshService extends SimpleEventEmitter {
  private subscriptions: Map<string, RefreshSubscription> = new Map();
  private globalStatus: RefreshStatus = {
    isRefreshing: false,
    lastRefreshTime: 0,
    successCount: 0,
    errorCount: 0,
    nextRefreshTime: 0,
  };
  private masterInterval: NodeJS.Timeout | null = null;
  private isServiceActive: boolean = false;
  private startDebounceTimeout: NodeJS.Timeout | null = null;
  private stopDebounceTimeout: NodeJS.Timeout | null = null;

  // Default configurations for different screen types - optimized for smooth experience
  private defaultConfigs: Record<string, RefreshConfig> = {
    "match-details": {
      intervalMs: 6000, // 6 seconds for live match details (very frequent for real-time feel)
      maxRetries: 1, // Minimal retries to avoid interruptions
      exponentialBackoff: false, // Consistent timing for smoothness
      visualFeedback: false, // Completely silent for smoothness
      smartScheduling: true,
    },
    "live-matches": {
      intervalMs: 15000, // 15 seconds for live matches list (more frequent)
      maxRetries: 1,
      exponentialBackoff: false,
      visualFeedback: false, // Completely silent for smoothness
      smartScheduling: true,
    },
    "finished-matches": {
      intervalMs: 300000, // 5 minutes for finished matches (they rarely change)
      maxRetries: 1,
      exponentialBackoff: true,
      visualFeedback: false,
      smartScheduling: true,
    },
    "all-matches": {
      intervalMs: 20000, // 20 seconds for all matches (more frequent)
      maxRetries: 1,
      exponentialBackoff: false,
      visualFeedback: false, // Completely silent for smoothness
      smartScheduling: true,
    },
    "fixture-matches": {
      intervalMs: 60000, // 1 minute for fixture matches (more frequent)
      maxRetries: 1,
      exponentialBackoff: false,
      visualFeedback: false,
      smartScheduling: true,
    },
  };

  constructor() {
    super();
    this.initializeService();
  }

  private async initializeService(): Promise<void> {
    try {
      // Restore previous refresh statistics
      const savedStats = await AsyncStorage.getItem("@refresh_service_stats");
      if (savedStats) {
        const stats = JSON.parse(savedStats);
        this.globalStatus.successCount = stats.successCount || 0;
        this.globalStatus.errorCount = stats.errorCount || 0;
      }
    } catch (error) {
      console.warn("🔄 Failed to restore refresh service statistics:", error);
    }
  }

  /**
   * Subscribe a screen to background refresh
   */
  public subscribe(
    screenType: RefreshSubscription["screenType"],
    refreshCallback: () => Promise<void>,
    customConfig?: Partial<RefreshConfig>,
  ): string {
    const subscriptionId = `${screenType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const config = {
      ...this.defaultConfigs[screenType],
      ...customConfig,
    };

    // Wrap callback to ensure it never throws unhandled errors
    const safeCallback = async () => {
      try {
        await refreshCallback();
      } catch (error) {
        // Silently handle callback errors to prevent service disruption
        if (screenType === "match-details") {
          console.warn("🔄 Match details refresh callback error:", error);
        }
        throw error; // Re-throw to allow retry logic to work
      }
    };

    const subscription: RefreshSubscription = {
      id: subscriptionId,
      screenType,
      refreshCallback: safeCallback,
      config,
      lastRefresh: 0,
      retryCount: 0,
      isActive: true,
    };

    this.subscriptions.set(subscriptionId, subscription);

    // Debounced start - prevent rapid start/stop cycles
    this.debouncedStart();

    // Only log in debug mode to reduce console noise
    if (__DEV__) {
      console.log(`🔄 Background refresh subscribed: ${screenType}`);
    }

    return subscriptionId;
  }

  /**
   * Unsubscribe from background refresh
   */
  public unsubscribe(subscriptionId: string): void {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription) {
      subscription.isActive = false;
      this.subscriptions.delete(subscriptionId);
      console.log(
        `🔄 Background refresh unsubscribed: ${subscription.screenType} (${subscriptionId})`,
      );
      this.emit("subscriptionRemoved", {
        subscriptionId,
        screenType: subscription.screenType,
      });
    }

    // Debounced stop - prevent rapid start/stop cycles
    this.debouncedStop();
  }

  /**
   * Manually trigger refresh for a specific subscription
   */
  public async triggerRefresh(subscriptionId: string): Promise<void> {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription || !subscription.isActive) {
      return;
    }

    await this.executeRefresh(subscription);
  }

  /**
   * Pause refresh for a specific subscription
   */
  public pauseRefresh(subscriptionId: string): void {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription) {
      subscription.isActive = false;
      console.log(
        `🔄 Refresh paused: ${subscription.screenType} (${subscriptionId})`,
      );
      this.emit("refreshPaused", {
        subscriptionId,
        screenType: subscription.screenType,
      });
    }
  }

  /**
   * Resume refresh for a specific subscription
   */
  public resumeRefresh(subscriptionId: string): void {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription) {
      subscription.isActive = true;
      subscription.retryCount = 0; // Reset retry count on resume
      console.log(
        `🔄 Refresh resumed: ${subscription.screenType} (${subscriptionId})`,
      );
      this.emit("refreshResumed", {
        subscriptionId,
        screenType: subscription.screenType,
      });
    }
  }

  /**
   * Get current refresh status
   */
  public getRefreshStatus(): RefreshStatus {
    return { ...this.globalStatus };
  }

  /**
   * Get active subscriptions info
   */
  public getActiveSubscriptions(): Array<{
    id: string;
    screenType: string;
    lastRefresh: number;
    isActive: boolean;
  }> {
    return Array.from(this.subscriptions.values()).map((sub) => ({
      id: sub.id,
      screenType: sub.screenType,
      lastRefresh: sub.lastRefresh,
      isActive: sub.isActive,
    }));
  }

  private debouncedStart(): void {
    // Clear any pending stop
    if (this.stopDebounceTimeout) {
      clearTimeout(this.stopDebounceTimeout);
      this.stopDebounceTimeout = null;
    }

    // Only start if not already active and has subscriptions
    if (!this.isServiceActive && this.subscriptions.size > 0) {
      if (this.startDebounceTimeout) {
        clearTimeout(this.startDebounceTimeout);
      }

      this.startDebounceTimeout = setTimeout(() => {
        this.startMasterInterval();
        this.startDebounceTimeout = null;
      }, 100); // 100ms debounce
    }
  }

  private debouncedStop(): void {
    // Clear any pending start
    if (this.startDebounceTimeout) {
      clearTimeout(this.startDebounceTimeout);
      this.startDebounceTimeout = null;
    }

    // Only stop if active and no subscriptions
    if (this.isServiceActive && this.subscriptions.size === 0) {
      if (this.stopDebounceTimeout) {
        clearTimeout(this.stopDebounceTimeout);
      }

      this.stopDebounceTimeout = setTimeout(() => {
        this.stopMasterInterval();
        this.stopDebounceTimeout = null;
      }, 1000); // 1 second debounce for stop
    }
  }

  private startMasterInterval(): void {
    if (this.masterInterval || this.subscriptions.size === 0) {
      return;
    }

    this.isServiceActive = true;
    // Check every 2 seconds for due refreshes (more responsive and smooth)
    this.masterInterval = setInterval(() => {
      this.processRefreshQueue();
    }, 2000);

    console.log("🔄 Background refresh service started");
    this.emit("serviceStarted");
  }

  private stopMasterInterval(): void {
    if (this.masterInterval) {
      clearInterval(this.masterInterval);
      this.masterInterval = null;
    }

    this.isServiceActive = false;
    console.log("🔄 Background refresh service stopped");
    this.emit("serviceStopped");
  }

  private async processRefreshQueue(): Promise<void> {
    const now = Date.now();
    const refreshPromises: Promise<void>[] = [];

    for (const subscription of this.subscriptions.values()) {
      if (!subscription.isActive) {
        continue;
      }

      const timeSinceLastRefresh = now - subscription.lastRefresh;
      const shouldRefresh = this.shouldRefreshNow(
        subscription,
        timeSinceLastRefresh,
      );

      if (shouldRefresh) {
        // Execute refreshes in parallel but limit concurrent operations
        const refreshPromise = this.executeRefresh(subscription).catch(
          (error) => {
            // Silently handle errors to maintain smooth operation
            // Only log if it's a critical subscription like match-details
            if (subscription.screenType === "match-details") {
              console.warn(
                `🔄 Critical refresh failed: ${subscription.screenType}`,
              );
            }
          },
        );

        refreshPromises.push(refreshPromise);
      }
    }

    // Wait for all refreshes to complete, but don't block the service
    if (refreshPromises.length > 0) {
      try {
        await Promise.allSettled(refreshPromises);
      } catch {
        // Ignore any remaining errors
      }
    }
  }

  private shouldRefreshNow(
    subscription: RefreshSubscription,
    timeSinceLastRefresh: number,
  ): boolean {
    // Always refresh if never refreshed
    if (subscription.lastRefresh === 0) {
      return true;
    }

    // Calculate effective interval (with exponential backoff if enabled)
    let effectiveInterval = subscription.config.intervalMs;

    if (subscription.config.exponentialBackoff && subscription.retryCount > 0) {
      effectiveInterval = Math.min(
        effectiveInterval * Math.pow(2, subscription.retryCount),
        300000, // Max 5 minutes
      );
    }

    // Smart scheduling: reduce frequency during low activity periods
    if (subscription.config.smartScheduling) {
      const hour = new Date().getHours();
      // Reduce frequency during typical low activity hours (2 AM - 6 AM)
      if (hour >= 2 && hour <= 6) {
        effectiveInterval *= 1.5; // Less aggressive reduction for better UX
      }
    }

    return timeSinceLastRefresh >= effectiveInterval;
  }

  private async executeRefresh(
    subscription: RefreshSubscription,
  ): Promise<void> {
    const startTime = Date.now();

    try {
      // No visual feedback emitted for completely silent operation
      this.globalStatus.isRefreshing = true;

      // ✅ Execute the refresh callback with timeout protection (25 seconds to match API timeout)
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Refresh timeout")), 25000),
      );

      await Promise.race([subscription.refreshCallback(), timeoutPromise]);

      // Success - update statistics
      subscription.lastRefresh = Date.now();
      subscription.retryCount = 0;
      this.globalStatus.successCount += 1;
      this.globalStatus.lastRefreshTime = Date.now();

      const duration = Date.now() - startTime;
      // Only log in development or if duration is unusually long
      if (duration > 5000) {
        console.log(
          `🔄 Background refresh: ${subscription.screenType} (${duration}ms)`,
        );
      }
    } catch (error) {
      // Handle refresh failure gracefully - don't interrupt user experience
      subscription.retryCount += 1;
      this.globalStatus.errorCount += 1;

      const duration = Date.now() - startTime;
      const errorMessage = (refreshError as Error)?.message || String(refreshError);

      // ✅ Detect timeout errors specifically
      const isTimeout = errorMessage.includes('timeout') || errorMessage.includes('Timeout') || duration > 20000;

      // Only log errors that might affect user experience
      if (subscription.retryCount === 1) {
        if (isTimeout) {
          console.warn(
            `⏱️ Refresh timeout for ${subscription.screenType} (${duration}ms) - API may be slow`,
          );
        } else {
          console.warn(
            `🔄 Refresh failed for ${subscription.screenType} (${duration}ms), will retry`,
          );
        }
      }

      // For match-details, be more lenient with retries to maintain smooth UX
      const maxRetries =
        subscription.screenType === "match-details"
          ? 2
          : subscription.config.maxRetries;

      if (subscription.retryCount >= maxRetries) {
        // ✅ For timeouts, wait longer before retry (60 seconds instead of 30)
        const waitTime = isTimeout ? 60000 : 30000;
        subscription.lastRefresh = Date.now() + waitTime;
        subscription.retryCount = 0; // Reset retry count to keep trying
        console.warn(
          `🔄 Temporary slowdown for ${subscription.screenType} due to ${isTimeout ? 'timeout' : 'errors'}`,
        );
      }
    } finally {
      this.globalStatus.isRefreshing = false;

      // Save statistics asynchronously without blocking
      this.saveStatistics().catch(() => {
        // Silently ignore storage errors to maintain smooth operation
      });
    }
  }

  private async saveStatistics(): Promise<void> {
    try {
      const stats = {
        successCount: this.globalStatus.successCount,
        errorCount: this.globalStatus.errorCount,
        lastSaved: Date.now(),
      };
      await AsyncStorage.setItem(
        "@refresh_service_stats",
        JSON.stringify(stats),
      );
    } catch (error) {
      // Ignore storage errors
    }
  }

  /**
   * Get refresh statistics for monitoring
   */
  public getStatistics(): {
    successCount: number;
    errorCount: number;
    successRate: number;
    activeSubscriptions: number;
    isServiceActive: boolean;
  } {
    const total = this.globalStatus.successCount + this.globalStatus.errorCount;
    const successRate =
      total > 0 ? (this.globalStatus.successCount / total) * 100 : 100;

    return {
      successCount: this.globalStatus.successCount,
      errorCount: this.globalStatus.errorCount,
      successRate: Math.round(successRate * 100) / 100,
      activeSubscriptions: Array.from(this.subscriptions.values()).filter(
        (sub) => sub.isActive,
      ).length,
      isServiceActive: this.isServiceActive,
    };
  }

  /**
   * Reset all statistics
   */
  public resetStatistics(): void {
    this.globalStatus.successCount = 0;
    this.globalStatus.errorCount = 0;
    this.globalStatus.lastRefreshTime = 0;
    console.log("🔄 Refresh statistics reset");
    this.emit("statisticsReset");
  }

  /**
   * Clean up service and stop all refresh operations
   */
  public destroy(): void {
    // Clear debounce timeouts
    if (this.startDebounceTimeout) {
      clearTimeout(this.startDebounceTimeout);
      this.startDebounceTimeout = null;
    }
    if (this.stopDebounceTimeout) {
      clearTimeout(this.stopDebounceTimeout);
      this.stopDebounceTimeout = null;
    }

    this.stopMasterInterval();
    this.subscriptions.clear();
    this.removeAllListeners();
    console.log("🔄 Background refresh service destroyed");
  }
}

// Export singleton instance
export const backgroundRefreshService = new BackgroundRefreshService();
export default backgroundRefreshService;

// Export types for use in components
export type { RefreshConfig, RefreshSubscription, RefreshStatus };
