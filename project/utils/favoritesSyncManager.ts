/**
 * Favorites Synchronization Manager
 *
 * Provides comprehensive cross-screen synchronization for favorites functionality
 * Ensures all screens stay in perfect sync when favorites are added/removed
 */

export interface FavoritesSyncEvent {
  matchId: string;
  isFavorite: boolean;
  timestamp: number;
  source: string;
}

export interface FavoritesCountEvent {
  count: number;
  timestamp: number;
  source: string;
}

class FavoritesSyncManager {
  private syncListeners: Set<(event: FavoritesSyncEvent) => void> = new Set();
  private countListeners: Set<(event: FavoritesCountEvent) => void> = new Set();
  private refreshListeners: Set<(source: string) => void> = new Set();

  private lastSyncEvent: FavoritesSyncEvent | null = null;
  private lastCountEvent: FavoritesCountEvent | null = null;

  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Register listener for individual match favorite changes
   */
  addSyncListener(
    callback: (event: FavoritesSyncEvent) => void,
    source?: string
  ): () => void {
    this.syncListeners.add(callback);
    console.log(`🔄 SYNC MANAGER: Added sync listener${source ? ` from ${source}` : ""}`);

    return () => {
      this.syncListeners.delete(callback);
      console.log(`🔄 SYNC MANAGER: Removed sync listener${source ? ` from ${source}` : ""}`);
    };
  }

  /**
   * Register listener for favorites count changes
   */
  addCountListener(
    callback: (event: FavoritesCountEvent) => void,
    source?: string
  ): () => void {
    this.countListeners.add(callback);
    console.log(`📊 SYNC MANAGER: Added count listener${source ? ` from ${source}` : ""}`);

    return () => {
      this.countListeners.delete(callback);
      console.log(`📊 SYNC MANAGER: Removed count listener${source ? ` from ${source}` : ""}`);
    };
  }

  /**
   * Register listener for general refresh requests
   */
  addRefreshListener(
    callback: (source: string) => void,
    source?: string
  ): () => void {
    this.refreshListeners.add(callback);
    console.log(`🔄 SYNC MANAGER: Added refresh listener${source ? ` from ${source}` : ""}`);

    return () => {
      this.refreshListeners.delete(callback);
      console.log(`🔄 SYNC MANAGER: Removed refresh listener${source ? ` from ${source}` : ""}`);
    };
  }

  /**
   * Broadcast favorite status change to all listeners
   */
  broadcastFavoriteChange(
    matchId: string,
    isFavorite: boolean,
    source: string = 'unknown'
  ): void {
    const event: FavoritesSyncEvent = {
      matchId,
      isFavorite,
      timestamp: Date.now(),
      source
    };

    // Prevent duplicate broadcasts
    if (this.lastSyncEvent &&
        this.lastSyncEvent.matchId === matchId &&
        this.lastSyncEvent.isFavorite === isFavorite &&
        (event.timestamp - this.lastSyncEvent.timestamp) < 500) {
      console.log(`🔄 SYNC MANAGER: Ignoring duplicate sync event for match ${matchId}`);
      return;
    }

    this.lastSyncEvent = event;

    console.log(
      `🔄 SYNC MANAGER: Broadcasting favorite change - Match ${matchId} favorite: ${isFavorite} (source: ${source})`
    );

    // Debounce broadcasts to prevent excessive updates
    const debounceKey = `sync_${matchId}`;
    const existingTimer = this.debounceTimers.get(debounceKey);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const timer = setTimeout(() => {
      this.syncListeners.forEach((callback) => {
        try {
          callback(event);
        } catch (error) {
          console.error(`❌ SYNC MANAGER: Error in sync listener:`, error);
        }
      });

      this.debounceTimers.delete(debounceKey);
    }, 50);

    this.debounceTimers.set(debounceKey, timer);

    // Also update global listeners for backward compatibility
    this.updateGlobalListeners(matchId, isFavorite);
  }

  /**
   * Broadcast favorites count change to all listeners
   */
  broadcastCountChange(count: number, source: string = 'unknown'): void {
    const event: FavoritesCountEvent = {
      count,
      timestamp: Date.now(),
      source
    };

    // Prevent duplicate broadcasts
    if (this.lastCountEvent &&
        this.lastCountEvent.count === count &&
        (event.timestamp - this.lastCountEvent.timestamp) < 300) {
      console.log(`📊 SYNC MANAGER: Ignoring duplicate count event: ${count}`);
      return;
    }

    this.lastCountEvent = event;

    console.log(`📊 SYNC MANAGER: Broadcasting count change - ${count} favorites (source: ${source})`);

    // Debounce count broadcasts
    const debounceKey = 'count_broadcast';
    const existingTimer = this.debounceTimers.get(debounceKey);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const timer = setTimeout(() => {
      this.countListeners.forEach((callback) => {
        try {
          callback(event);
        } catch (error) {
          console.error(`❌ SYNC MANAGER: Error in count listener:`, error);
        }
      });

      this.debounceTimers.delete(debounceKey);
    }, 100);

    this.debounceTimers.set(debounceKey, timer);

    // Also update global listeners for backward compatibility
    this.updateGlobalCountListeners(count);
  }

  /**
   * Broadcast general refresh request to all listeners
   */
  broadcastRefresh(source: string = 'unknown'): void {
    console.log(`🔄 SYNC MANAGER: Broadcasting refresh request (source: ${source})`);

    // Debounce refresh broadcasts
    const debounceKey = 'refresh_broadcast';
    const existingTimer = this.debounceTimers.get(debounceKey);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const timer = setTimeout(() => {
      this.refreshListeners.forEach((callback) => {
        try {
          callback(source);
        } catch (error) {
          console.error(`❌ SYNC MANAGER: Error in refresh listener:`, error);
        }
      });

      this.debounceTimers.delete(debounceKey);
    }, 200);

    this.debounceTimers.set(debounceKey, timer);

    // Also update global listeners for backward compatibility
    this.updateGlobalRefreshListeners();
  }

  /**
   * Get current sync status
   */
  getSyncStatus() {
    return {
      syncListeners: this.syncListeners.size,
      countListeners: this.countListeners.size,
      refreshListeners: this.refreshListeners.size,
      lastSyncEvent: this.lastSyncEvent,
      lastCountEvent: this.lastCountEvent,
      activeDebounceTimers: this.debounceTimers.size
    };
  }

  /**
   * Clear all listeners and cleanup
   */
  cleanup(): void {
    console.log('🧹 SYNC MANAGER: Cleaning up all listeners and timers');

    this.syncListeners.clear();
    this.countListeners.clear();
    this.refreshListeners.clear();

    this.debounceTimers.forEach((timer) => clearTimeout(timer));
    this.debounceTimers.clear();

    this.lastSyncEvent = null;
    this.lastCountEvent = null;

    // Clean up global listeners
    delete (global as any).onMatchFavoriteChanged;
    delete (global as any).onFavoritesCountChanged;
    delete (global as any).refreshMatchLists;
  }

  /**
   * Update global listeners for backward compatibility
   */
  private updateGlobalListeners(matchId: string, isFavorite: boolean): void {
    if (typeof (global as any).onMatchFavoriteChanged === "function") {
      try {
        (global as any).onMatchFavoriteChanged(matchId, isFavorite);
      } catch (error) {
        console.error(`❌ SYNC MANAGER: Error in global match listener:`, error);
      }
    }
  }

  /**
   * Update global count listeners for backward compatibility
   */
  private updateGlobalCountListeners(count: number): void {
    if (typeof (global as any).onFavoritesCountChanged === "function") {
      try {
        (global as any).onFavoritesCountChanged(count);
      } catch (error) {
        console.error(`❌ SYNC MANAGER: Error in global count listener:`, error);
      }
    }
  }

  /**
   * Update global refresh listeners for backward compatibility
   */
  private updateGlobalRefreshListeners(): void {
    if (typeof (global as any).refreshMatchLists === "function") {
      try {
        (global as any).refreshMatchLists();
      } catch (error) {
        console.error(`❌ SYNC MANAGER: Error in global refresh listener:`, error);
      }
    }
  }

  /**
   * Initialize global compatibility layer
   */
  initializeGlobalCompatibility(): void {
    console.log('🔗 SYNC MANAGER: Initializing global compatibility layer');

    // Setup global functions that delegate to the sync manager
    (global as any).onMatchFavoriteChanged = (matchId: string, isFavorite: boolean) => {
      this.broadcastFavoriteChange(matchId, isFavorite, 'global-legacy');
    };

    (global as any).onFavoritesCountChanged = (count: number) => {
      this.broadcastCountChange(count, 'global-legacy');
    };

    (global as any).refreshMatchLists = () => {
      this.broadcastRefresh('global-legacy');
    };
  }
}

// Export singleton instance
export const favoritesSyncManager = new FavoritesSyncManager();

// Initialize global compatibility layer
favoritesSyncManager.initializeGlobalCompatibility();

// Export utility functions for easy access
export const {
  addSyncListener,
  addCountListener,
  addRefreshListener,
  broadcastFavoriteChange,
  broadcastCountChange,
  broadcastRefresh,
  getSyncStatus,
  cleanup: cleanupSync
} = favoritesSyncManager;

// Debug utility
export const logSyncStatus = () => {
  const status = favoritesSyncManager.getSyncStatus();
  console.log('🔍 SYNC MANAGER STATUS:', status);
  return status;
};
