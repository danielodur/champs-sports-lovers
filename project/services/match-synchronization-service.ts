import AsyncStorage from "@react-native-async-storage/async-storage";
import { matchDetailsDataLoader } from "./match-details/match-details-data-loader";
import React from "react";

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

  setMaxListeners(n: number): void {
    // No-op for React Native compatibility
  }
}

// Types for match updates
interface MatchUpdate {
  matchId: string;
  status: "upcoming" | "live" | "finished";
  score: string;
  minute?: number;
  statusText?: string;
  timestamp: number;
}

export interface MatchUpdateEvent {
  type: "status_change" | "score_update" | "minute_update" | "full_update";
  matchId: string;
  oldData?: Partial<MatchUpdate>;
  newData: MatchUpdate;
}

interface SyncSubscription {
  screenType: string;
  callback: (event: MatchUpdateEvent) => void;
  matchIds?: string[];
}

class MatchSynchronizationService extends SimpleEventEmitter {
  private subscriptions: Map<string, SyncSubscription> = new Map();
  private matchCache: Map<string, MatchUpdate> = new Map();
  private updateQueues: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private isServiceActive = false;
  private masterInterval: ReturnType<typeof setInterval> | null = null;
  private readonly UPDATE_INTERVAL = 15000; // 15 seconds
  private readonly CACHE_KEY = "match_sync_cache";

  constructor() {
    super();
    this.setMaxListeners(50); // Allow many subscribers
    this.initializeService();
  }

  private async initializeService() {
    try {
      // Load cached match data
      await this.loadCache();
      this.isServiceActive = true;
      this.startMasterSync();
      console.log("🔄 Match Synchronization Service initialized");
    } catch (error) {
      console.error("Failed to initialize Match Sync Service:", error);
    }
  }

  private async loadCache() {
    try {
      const cachedData = await AsyncStorage.getItem(this.CACHE_KEY);
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        Object.entries(parsed).forEach(([matchId, data]) => {
          this.matchCache.set(matchId, data as MatchUpdate);
        });
        console.log(`📦 Loaded ${this.matchCache.size} cached matches`);
      }
    } catch (error) {
      console.warn("Failed to load match cache:", error);
    }
  }

  private async saveCache() {
    try {
      const cacheObject = Object.fromEntries(this.matchCache.entries());
      await AsyncStorage.setItem(this.CACHE_KEY, JSON.stringify(cacheObject));
    } catch (error) {
      console.warn("Failed to save match cache:", error);
    }
  }

  private startMasterSync() {
    if (this.masterInterval) {
      clearInterval(this.masterInterval);
    }

    this.masterInterval = setInterval(async () => {
      if (this.subscriptions.size === 0) return;

      try {
        await this.syncLiveMatches();
      } catch (error) {
        console.error("Master sync error:", error);
      }
    }, this.UPDATE_INTERVAL);

    console.log(
      `🔄 Master sync started with ${this.UPDATE_INTERVAL}ms interval`,
    );
  }

  private async syncLiveMatches() {
    const liveMatches = Array.from(this.matchCache.values()).filter(
      (match) => match.status === "live" || this.shouldCheckMatch(match),
    );

    if (liveMatches.length === 0) return;

    console.log(`🔄 Syncing ${liveMatches.length} matches`);

    // Process matches in batches to avoid API rate limits
    const batchSize = 3;
    for (let i = 0; i < liveMatches.length; i += batchSize) {
      const batch = liveMatches.slice(i, i + batchSize);
      await Promise.all(
        batch.map((match) => this.updateSingleMatch(match.matchId)),
      );

      // Small delay between batches
      if (i + batchSize < liveMatches.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  private shouldCheckMatch(match: MatchUpdate): boolean {
    const now = Date.now();
    const timeSinceLastUpdate = now - match.timestamp;

    // Check upcoming matches within 10 minutes of start time
    if (match.status === "upcoming") {
      // This is a simplified check - in reality you'd need the match start time
      return timeSinceLastUpdate > 30000; // Check every 30 seconds
    }

    // Check finished matches less frequently
    if (match.status === "finished") {
      return timeSinceLastUpdate > 300000; // Check every 5 minutes
    }

    return false;
  }

  private async updateSingleMatch(matchId: string): Promise<void> {
    try {
      const currentMatch = this.matchCache.get(matchId);
      if (!currentMatch) return;

      // Create a minimal match object for the data loader
      const matchObj = {
        id: matchId,
        status: currentMatch.status,
        home: { name: "Home Team", logo: "" },
        away: { name: "Away Team", logo: "" },
        score: currentMatch.score,
        startTime: new Date().toISOString(),
        league: "Unknown League",
      };

      // Get updated data from API
      const updatedMatch = await matchDetailsDataLoader.loadRealFixtureData(
        matchId,
        matchObj as any,
      );

      if (updatedMatch) {
        const newUpdate: MatchUpdate = {
          matchId,
          status: updatedMatch.status,
          score: updatedMatch.score || "0-0",
          minute: updatedMatch.fixture?.status?.elapsed || undefined,
          statusText: (updatedMatch as any).statusText,
          timestamp: Date.now(),
        };

        this.processMatchUpdate(currentMatch, newUpdate);
      }
    } catch (error) {
      console.warn(`Failed to update match ${matchId}:`, error);
    }
  }

  private processMatchUpdate(oldData: MatchUpdate, newData: MatchUpdate) {
    const changes = this.detectChanges(oldData, newData);

    if (changes.length === 0) return;

    // Update cache
    this.matchCache.set(newData.matchId, newData);

    // Emit events for each type of change
    changes.forEach((changeType) => {
      const event: MatchUpdateEvent = {
        type: changeType,
        matchId: newData.matchId,
        oldData,
        newData,
      };

      this.emit("match_update", event);
      this.notifySubscribers(event);
    });

    // Save cache periodically
    this.debounceSaveCache();
  }

  private detectChanges(
    oldData: MatchUpdate,
    newData: MatchUpdate,
  ): MatchUpdateEvent["type"][] {
    const changes: MatchUpdateEvent["type"][] = [];

    if (oldData.status !== newData.status) {
      changes.push("status_change");
    }

    if (oldData.score !== newData.score) {
      changes.push("score_update");
    }

    if (oldData.minute !== newData.minute) {
      changes.push("minute_update");
    }

    if (changes.length > 1) {
      changes.push("full_update");
    }

    return changes;
  }

  private notifySubscribers(event: MatchUpdateEvent) {
    this.subscriptions.forEach((subscription) => {
      try {
        // Check if subscriber is interested in this match
        if (
          !subscription.matchIds ||
          subscription.matchIds.includes(event.matchId)
        ) {
          subscription.callback(event);
        }
      } catch (error) {
        console.warn("Error notifying subscriber:", error);
      }
    });
  }

  private debounceSaveCache() {
    const timeoutId = setTimeout(() => {
      this.saveCache();
    }, 5000);

    // Clear previous timeout
    if (this.updateQueues.has("cache_save")) {
      clearTimeout(this.updateQueues.get("cache_save")!);
    }

    this.updateQueues.set("cache_save", timeoutId);
  }

  // Public API

  /**
   * Subscribe to match updates
   */
  subscribe(
    screenType: string,
    callback: (event: MatchUpdateEvent) => void,
    options: { matchIds?: string[] } = {},
  ): string {
    const subscriptionId = `${screenType}_${Date.now()}_${Math.random()}`;

    this.subscriptions.set(subscriptionId, {
      screenType,
      callback,
      matchIds: options.matchIds,
    });

    console.log(
      `📡 Subscribed: ${screenType} (${subscriptionId}) - ${options.matchIds?.length || "all"} matches`,
    );

    return subscriptionId;
  }

  /**
   * Unsubscribe from match updates
   */
  unsubscribe(subscriptionId: string) {
    if (this.subscriptions.has(subscriptionId)) {
      this.subscriptions.delete(subscriptionId);
      console.log(`📡 Unsubscribed: ${subscriptionId}`);
    }
  }

  /**
   * Register a match for synchronization
   */
  registerMatch(
    matchId: string,
    initialData: Partial<MatchUpdate>,
  ): MatchUpdate {
    const matchUpdate: MatchUpdate = {
      matchId,
      status: initialData.status || "upcoming",
      score: initialData.score || "0-0",
      minute: initialData.minute,
      statusText: initialData.statusText,
      timestamp: Date.now(),
    };

    this.matchCache.set(matchId, matchUpdate);
    console.log(`📝 Registered match ${matchId} for sync`);

    return matchUpdate;
  }

  /**
   * Get current match data
   */
  getMatchData(matchId: string): MatchUpdate | null {
    return this.matchCache.get(matchId) || null;
  }

  /**
   * Get all live matches
   */
  getLiveMatches(): MatchUpdate[] {
    return Array.from(this.matchCache.values()).filter(
      (match) => match.status === "live",
    );
  }

  /**
   * Force update a specific match
   */
  async forceUpdate(matchId: string): Promise<void> {
    console.log(`🔄 Force updating match ${matchId}`);
    await this.updateSingleMatch(matchId);
  }

  /**
   * Update match data manually (for when API data is received elsewhere)
   */
  updateMatch(matchId: string, data: Partial<MatchUpdate>) {
    const currentData = this.matchCache.get(matchId);
    if (!currentData) return;

    const newData: MatchUpdate = {
      ...currentData,
      ...data,
      timestamp: Date.now(),
    };

    this.processMatchUpdate(currentData, newData);
  }

  /**
   * Get service statistics
   */
  getStatistics() {
    return {
      totalMatches: this.matchCache.size,
      liveMatches: this.getLiveMatches().length,
      subscribers: this.subscriptions.size,
      isActive: this.isServiceActive,
    };
  }

  /**
   * Clear all cached data
   */
  async clearCache() {
    this.matchCache.clear();
    await AsyncStorage.removeItem(this.CACHE_KEY);
    console.log("🗑️ Match sync cache cleared");
  }

  /**
   * Shutdown the service
   */
  shutdown() {
    if (this.masterInterval) {
      clearInterval(this.masterInterval);
      this.masterInterval = null;
    }

    this.updateQueues.forEach((timeout) => clearTimeout(timeout));
    this.updateQueues.clear();
    this.subscriptions.clear();
    this.isServiceActive = false;

    console.log("🛑 Match Synchronization Service shut down");
  }
}

// Export singleton instance
export const matchSyncService = new MatchSynchronizationService();
export default matchSyncService;

// Hook for React components
export function useMatchSync(
  screenType: string,
  matchIds?: string[],
  onUpdate?: (event: MatchUpdateEvent) => void,
) {
  const [isConnected, setIsConnected] = React.useState(false);
  const subscriptionRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (onUpdate) {
      const subscriptionId = matchSyncService.subscribe(
        screenType,
        (event) => {
          setIsConnected(true);
          onUpdate(event);
        },
        { matchIds },
      );

      subscriptionRef.current = subscriptionId;

      return () => {
        if (subscriptionRef.current) {
          matchSyncService.unsubscribe(subscriptionRef.current);
          subscriptionRef.current = null;
          setIsConnected(false);
        }
      };
    }
  }, [screenType, matchIds, onUpdate]);

  return {
    isConnected,
    forceUpdate: (matchId: string) => matchSyncService.forceUpdate(matchId),
    getMatchData: (matchId: string) => matchSyncService.getMatchData(matchId),
    registerMatch: (matchId: string, data: Partial<MatchUpdate>) =>
      matchSyncService.registerMatch(matchId, data),
    statistics: matchSyncService.getStatistics(),
  };
}
