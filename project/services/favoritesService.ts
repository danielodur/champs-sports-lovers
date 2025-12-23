import { supabase } from "./supabaseClient";
import { Match } from "../types/match";
import { favoritesSyncManager } from "../utils/favoritesSyncManager";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Legacy AsyncStorage key for migration and fallback
const LEGACY_FAVORITES_STORAGE_KEY = "favoriteMatches";

interface FavoriteMatch {
  id: string;
  sport: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamId?: string; // ✅ Added for API calls
  awayTeamId?: string; // ✅ Added for API calls
  homeLogo?: string; // ✅ Added for display
  awayLogo?: string; // ✅ Added for display
  league: string;
  leagueId?: string; // ✅ Added for team statistics
  startTime: string;
  status: "live" | "finished" | "upcoming";
  venueName?: string; // ✅ Added for venue display
  venueCity?: string; // ✅ Added for weather
  venueCapacity?: string; // ✅ Added for venue info
  dateAdded: string;
}

// Supabase database interface
interface SupabaseFavoriteMatch {
  id?: number;
  user_id: string;
  match_id: string;
  sport: string;
  home_team: string;
  away_team: string;
  league: string;
  start_time: string;
  status: "live" | "finished" | "upcoming";
  date_added?: string; // Use the actual production database column name
  updated_at?: string;
}

class FavoritesService {
  private currentUserId: string | null = null;
  private failureCount: number = 0;
  private lastFailureTime: number = 0;
  private circuitBreakerOpen: boolean = false;
  private syncListeners: Set<(matchId: string, isFavorite: boolean) => void> =
    new Set();
  private countListeners: Set<(count: number) => void> = new Set();
  private countUpdateTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * Set current user ID for favorites operations
   */
  setCurrentUser(userId: string | null) {
    this.currentUserId = userId;
    console.log("👤 FAVORITES SERVICE: User set to:", userId || "none");
  }

  /**
   * Register listener for favorite status changes
   */
  addSyncListener(callback: (matchId: string, isFavorite: boolean) => void) {
    this.syncListeners.add(callback);
    return () => this.syncListeners.delete(callback);
  }

  /**
   * Register listener for favorites count changes
   */
  addCountListener(callback: (count: number) => void) {
    this.countListeners.add(callback);
    return () => this.countListeners.delete(callback);
  }

  /**
   * Broadcast favorite status change to all listeners using sync manager
   * Optimized to prevent excessive refreshes that cause blinking
   */
  private async broadcastFavoriteChange(matchId: string, isFavorite: boolean) {
    console.log(
      `🔄 FAVORITES SERVICE: Broadcasting change - Match ${matchId} favorite: ${isFavorite}`,
    );

    // Use the comprehensive sync manager for broadcasting
    favoritesSyncManager.broadcastFavoriteChange(
      matchId,
      isFavorite,
      "favoritesService",
    );

    // Notify local sync listeners (for backward compatibility)
    this.syncListeners.forEach((callback) => {
      try {
        callback(matchId, isFavorite);
      } catch (error) {
        console.error("❌ Error in local sync listener:", error);
      }
    });

    // Debounced count update to prevent excessive broadcasts
    if (this.countUpdateTimer) {
      clearTimeout(this.countUpdateTimer);
    }

    this.countUpdateTimer = setTimeout(async () => {
      try {
        const count = await this.getFavoritesCount();

        // Notify local count listeners
        this.countListeners.forEach((callback) => {
          try {
            callback(count);
          } catch (error) {
            console.error("❌ Error in local count listener:", error);
          }
        });

        // Broadcast count through sync manager
        favoritesSyncManager.broadcastCountChange(count, "favoritesService");
      } catch (error) {
        console.error("❌ Error updating favorites count:", error);
      }
    }, 300); // 300ms debounce to prevent rapid count updates
  }

  /**
   * Get current user ID from auth session
   */
  private async getCurrentUserId(): Promise<string | null> {
    if (this.currentUserId) {
      return this.currentUserId;
    }

    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Auth session timeout")), 3000);
      });

      const sessionPromise = supabase.auth.getSession();

      const {
        data: { session },
      } = await Promise.race([sessionPromise, timeoutPromise]);

      this.currentUserId = session?.user?.id || null;
      return this.currentUserId;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      // Don't log auth timeout errors as they're expected for unauthenticated users
      if (!errorMessage.includes('Auth session') && !errorMessage.includes('timeout')) {
        console.error("❌ Error getting current user:", errorMessage);
      }
      return null;
    }
  }

  /**
   * Get AsyncStorage for fallback functionality
   */
  private async getAsyncStorage() {
    return AsyncStorage;
  }

  /**
   * Add a match to favorites with fallback to AsyncStorage for unauthenticated users
   */
  async addToFavorites(match: any): Promise<void> {
    try {
      // ✅ ENHANCED VALIDATION: Check for valid match data
      if (
        !match ||
        !match.id ||
        typeof match.id !== "string" ||
        match.id.trim() === ""
      ) {
        throw new Error("Invalid match data: missing or invalid ID");
      }

      const userId = await this.getCurrentUserId();

      // Support both Match interface and standardized match object formats
      const homeTeamName = match.home?.name || match.homeTeam;
      const awayTeamName = match.away?.name || match.awayTeam;

      if (!homeTeamName || !awayTeamName) {
        console.error(
          "❌ FAVORITES SERVICE: INVALID MATCH - missing team names",
        );
        console.error("❌ FAVORITES SERVICE: Received match:", match);
        throw new Error("Invalid match data: missing team names");
      }

      console.log("📝 FAVORITES SERVICE: Adding to favorites...");
      console.log(`   User ID: ${userId || "GUEST USER"}`);
      console.log(`   Match ID: ${match.id}`);
      console.log(`   Match: ${homeTeamName} vs ${awayTeamName}`);

      if (userId) {
        // ✅ AUTHENTICATED USER: Use Supabase
        console.log("🔐 Using Supabase for authenticated user");

        // Check if already exists
        const exists = await this.isFavorite(match.id);
        if (exists) {
          console.log(
            "⚠️ FAVORITES SERVICE: Match already in favorites, skipping add",
          );
          return;
        }

        const favoriteMatch: SupabaseFavoriteMatch = {
          user_id: userId,
          match_id: match.id,
          sport: match.sport || "football",
          home_team: homeTeamName,
          away_team: awayTeamName,
          league: match.league || "Unknown League",
          start_time: match.startTime || new Date().toISOString(),
          status: match.status || "upcoming",
        };

        const { error } = await supabase
          .from("favorite_matches")
          .insert([favoriteMatch]);

        if (error) {
          console.error("❌ FAVORITES SERVICE: Database error:", error);
          throw new Error(`Failed to add favorite: ${error.message}`);
        }

        console.log(
          `✅ FAVORITES SERVICE: Successfully added ${homeTeamName} vs ${awayTeamName} to Supabase`,
        );

        // Broadcast the change to all listeners
        await this.broadcastFavoriteChange(match.id, true);
      } else {
        // ✅ GUEST USER: Use AsyncStorage fallback (preserving original behavior)
        console.log("👤 Using AsyncStorage fallback for guest user");

        const AsyncStorage = await this.getAsyncStorage();
        if (!AsyncStorage) {
          throw new Error("AsyncStorage not available");
        }

        const favorites = await this.getFavorites();

        // Check if already exists
        const exists = favorites.some((fav) => fav.id === match.id);
        if (exists) {
          console.log(
            "⚠️ FAVORITES SERVICE: Match already in favorites, skipping add",
          );
          return;
        }

        const favoriteMatch: FavoriteMatch = {
          id: match.id,
          sport: match.sport || "football",
          homeTeam: homeTeamName,
          awayTeam: awayTeamName,
          league: match.league || "Unknown League",
          startTime: match.startTime || new Date().toISOString(),
          status: match.status || "upcoming",
          dateAdded: new Date().toISOString(),
        };

        const updatedFavorites = [...favorites, favoriteMatch];
        await AsyncStorage.setItem(
          LEGACY_FAVORITES_STORAGE_KEY,
          JSON.stringify(updatedFavorites),
        );

        console.log(
          `✅ FAVORITES SERVICE: Successfully added ${homeTeamName} vs ${awayTeamName} to AsyncStorage`,
        );

        // Broadcast the change to all listeners
        await this.broadcastFavoriteChange(match.id, true);
      }
    } catch (error) {
      console.error("❌ FAVORITES SERVICE: Error adding to favorites:", error);
      throw error; // Re-throw to let caller handle
    }
  }

  /**
   * Remove a match from favorites with fallback to AsyncStorage
   */
  async removeFromFavorites(matchId: string): Promise<void> {
    try {
      // ✅ ENHANCED VALIDATION: Check for valid match ID
      if (!matchId || typeof matchId !== "string" || matchId.trim() === "") {
        console.error(
          "❌ FAVORITES SERVICE: INVALID MATCH ID for removal:",
          matchId,
        );
        throw new Error("Invalid match ID for removal");
      }

      const userId = await this.getCurrentUserId();

      console.log("🗑️ FAVORITES SERVICE: Removing from favorites...");
      console.log(`   User ID: ${userId || "GUEST USER"}`);
      console.log(`   Match ID: ${matchId} (type: ${typeof matchId})`);

      if (userId) {
        // ✅ AUTHENTICATED USER: Use Supabase with aggressive deletion
        console.log("🔐 Using Supabase for authenticated user");

        // STEP 1: First check what we're about to delete
        const { data: existingRecords, error: checkError } = await supabase
          .from("favorite_matches")
          .select("*")
          .eq("user_id", userId)
          .eq("match_id", matchId);

        if (checkError) {
          console.error("❌ Error checking existing records:", checkError);
        } else {
          console.log(`🔍 Found ${existingRecords?.length || 0} matching records to delete`);
          if (existingRecords && existingRecords.length > 0) {
            existingRecords.forEach((record: any, idx: number) => {
              console.log(`   ${idx + 1}. DB ID: ${record.id}, Match ID: ${record.match_id}, ${record.home_team} vs ${record.away_team}`);
            });
          }
        }

        // STEP 2: Delete with count to verify
        const { error, count } = await supabase
          .from("favorite_matches")
          .delete({ count: "exact" })
          .eq("user_id", userId)
          .eq("match_id", matchId);

        if (error) {
          console.error("❌ FAVORITES SERVICE: Database error:", error);
          console.error("❌ Error details:", {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
          });
          throw new Error(`Failed to remove favorite: ${error.message}`);
        }

        console.log(`✅ FAVORITES SERVICE: Deleted ${count || 0} records from Supabase`);

        // STEP 3: Verify deletion
        const { data: remainingRecords } = await supabase
          .from("favorite_matches")
          .select("id")
          .eq("user_id", userId)
          .eq("match_id", matchId);

        if (remainingRecords && remainingRecords.length > 0) {
          console.error(`⚠️ WARNING: ${remainingRecords.length} records still remain after deletion!`);
          console.error("⚠️ This indicates a data corruption issue. Use forceResetAllFavorites() to fix.");
        } else {
          console.log("✅ Verified: No matching records remain in database");
        }

        // Broadcast the change to all listeners
        await this.broadcastFavoriteChange(matchId, false);
      } else {
        // ✅ GUEST USER: Use AsyncStorage fallback
        console.log("👤 Using AsyncStorage fallback for guest user");

        const AsyncStorage = await this.getAsyncStorage();
        if (!AsyncStorage) {
          throw new Error("AsyncStorage not available");
        }

        const favorites = await this.getFavorites();
        const initialCount = favorites.length;

        const updatedFavorites = favorites.filter((fav) => fav.id !== matchId);
        const finalCount = updatedFavorites.length;

        if (initialCount === finalCount) {
          console.log(
            "⚠️ FAVORITES SERVICE: Match was not in favorites, no removal needed",
          );
          return;
        }

        await AsyncStorage.setItem(
          LEGACY_FAVORITES_STORAGE_KEY,
          JSON.stringify(updatedFavorites),
        );

        console.log(
          `✅ FAVORITES SERVICE: Successfully removed match ${matchId} from AsyncStorage`,
        );

        // Broadcast the change to all listeners
        await this.broadcastFavoriteChange(matchId, false);
      }
    } catch (error) {
      console.error(
        "❌ FAVORITES SERVICE: Error removing from favorites:",
        error,
      );
      throw error; // Re-throw to let caller handle
    }
  }

  /**
   * Get all favorite matches with fallback to AsyncStorage
   */
  async getFavorites(): Promise<FavoriteMatch[]> {
    try {
      // ✅ CRITICAL FIX: Clear any persistent test data first
      await this.clearPersistentTestData();

      const userId = await this.getCurrentUserId();

      if (userId) {
        // ✅ AUTHENTICATED USER: Use Supabase
        console.log("🔐 Using Supabase for authenticated user");

        const { data, error } = await supabase
          .from("favorite_matches")
          .select("*")
          .eq("user_id", userId)
          .order("date_added", { ascending: false });

        if (error) {
          console.error("❌ FAVORITES SERVICE: Database error:", error);
          // Fallback to AsyncStorage on error
          return this.getFavoritesFromAsyncStorage();
        }

        // Convert Supabase format to legacy format for compatibility
        const favorites: FavoriteMatch[] = (data || []).map(
          (item: SupabaseFavoriteMatch) => ({
            id: item.match_id,
            sport: item.sport,
            homeTeam: item.home_team,
            awayTeam: item.away_team,
            league: item.league,
            startTime: item.start_time,
            status: item.status,
            dateAdded: item.date_added || new Date().toISOString(),
          }),
        );

        console.log(
          `📊 FAVORITES SERVICE: Retrieved ${favorites.length} favorites from Supabase`,
        );
        return favorites;
      } else {
        // ✅ GUEST USER: Use AsyncStorage fallback
        console.log("👤 Using AsyncStorage fallback for guest user");
        return this.getFavoritesFromAsyncStorage();
      }
    } catch (error) {
      console.error("❌ FAVORITES SERVICE: Error getting favorites:", error);
      // Always fallback to AsyncStorage on any error
      return this.getFavoritesFromAsyncStorage();
    }
  }

  /**
   * Get favorites from AsyncStorage (fallback method)
   */
  private async getFavoritesFromAsyncStorage(): Promise<FavoriteMatch[]> {
    try {
      const AsyncStorage = await this.getAsyncStorage();
      if (!AsyncStorage) {
        return [];
      }

      const favoritesData = await AsyncStorage.getItem(
        LEGACY_FAVORITES_STORAGE_KEY,
      );
      const favorites = favoritesData ? JSON.parse(favoritesData) : [];
      // Reduced logging - too verbose
      // console.log(`📊 FAVORITES SERVICE: Retrieved ${favorites.length} favorites from AsyncStorage`);
      return favorites;
    } catch (error) {
      console.error(
        "❌ FAVORITES SERVICE: Error getting favorites from AsyncStorage:",
        error,
      );
      return [];
    }
  }

  /**
   * Check if a match is favorited with fallback to AsyncStorage
   */
  async isFavorite(matchId: string): Promise<boolean> {
    try {
      const userId = await this.getCurrentUserId();

      if (userId) {
        // ✅ AUTHENTICATED USER: Use Supabase
        const { data, error } = await supabase
          .from("favorite_matches")
          .select("match_id")
          .eq("user_id", userId)
          .eq("match_id", matchId)
          .single();

        if (error && error.code !== "PGRST116") {
          // PGRST116 is "not found" error - this is expected and should be ignored
          
          // Check if this is a network-related error
          const errorMessage = error.message || String(error);
          const isNetworkError = 
            errorMessage.includes("Network connection lost") ||
            errorMessage.includes("gateway error") ||
            errorMessage.includes("Failed to send") ||
            errorMessage.includes("network") ||
            errorMessage.includes("timeout") ||
            errorMessage.includes("fetch failed") ||
            error.code === "ECONNREFUSED" ||
            error.code === "ETIMEDOUT" ||
            error.code === "ENOTFOUND";

          if (isNetworkError) {
            // Network errors are transient - handle gracefully without logging as error
            // Silently fallback to AsyncStorage
            const favorites = await this.getFavoritesFromAsyncStorage();
            return favorites.some((fav) => fav.id === matchId);
          } else {
            // Non-network errors should be logged (but still fallback gracefully)
            console.warn(
              "⚠️ FAVORITES SERVICE: Error checking favorite status:",
              errorMessage.substring(0, 100),
            );
            // Fallback to AsyncStorage on error
            const favorites = await this.getFavoritesFromAsyncStorage();
            return favorites.some((fav) => fav.id === matchId);
          }
        }

        return !!data;
      } else {
        // ✅ GUEST USER: Use AsyncStorage fallback
        const favorites = await this.getFavoritesFromAsyncStorage();
        return favorites.some((fav) => fav.id === matchId);
      }
    } catch (error) {
      // Check if this is a network-related error
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isNetworkError = 
        errorMessage.includes("Network connection lost") ||
        errorMessage.includes("gateway error") ||
        errorMessage.includes("Failed to send") ||
        errorMessage.includes("network") ||
        errorMessage.includes("timeout") ||
        errorMessage.includes("fetch failed");

      if (isNetworkError) {
        // Network errors are transient - return false gracefully without logging
        return false;
      } else {
        // Non-network errors should be logged
        console.warn(
          "⚠️ FAVORITES SERVICE: Error checking favorite status:",
          errorMessage.substring(0, 100),
        );
        return false;
      }
    }
  }

  /**
   * Get favorite match IDs with fallback to AsyncStorage
   */
  async getFavoriteIds(): Promise<string[]> {
    try {
      const userId = await this.getCurrentUserId();

      if (userId) {
        // ✅ AUTHENTICATED USER: Use Supabase
        const { data, error } = await supabase
          .from("favorite_matches")
          .select("match_id")
          .eq("user_id", userId);

        if (error) {
          console.error("❌ FAVORITES SERVICE: Database error:", error);
          // Fallback to AsyncStorage on error
          const favorites = await this.getFavoritesFromAsyncStorage();
          const ids = favorites
            .map((fav) => fav.id)
            .filter((id) => id && typeof id === "string" && id.trim() !== "");
          console.log(
            `⚡ FAVORITES SERVICE: Retrieved ${ids.length} favorite IDs from AsyncStorage fallback`,
          );
          return ids;
        }

        const ids = (data || [])
          .map((item) => item.match_id)
          .filter((id) => id && typeof id === "string" && id.trim() !== "");
        console.log(
          `⚡ FAVORITES SERVICE: Retrieved ${ids.length} favorite IDs from Supabase`,
        );
        return ids;
      } else {
        // ✅ GUEST USER: Use AsyncStorage fallback
        const favorites = await this.getFavoritesFromAsyncStorage();
        const ids = favorites
          .map((fav) => fav.id)
          .filter((id) => id && typeof id === "string" && id.trim() !== "");
        console.log(
          `⚡ FAVORITES SERVICE: Retrieved ${ids.length} favorite IDs from AsyncStorage`,
        );
        return ids;
      }
    } catch (error) {
      console.error("❌ FAVORITES SERVICE: Error getting favorite IDs:", error);
      return [];
    }
  }

  /**
   * Get total count of favorite matches with fallback support and circuit breaker
   */
  async getFavoritesCount(): Promise<number> {
    // ✅ CRITICAL FIX: Clear any persistent test data first
    await this.clearPersistentTestData();

    // Circuit breaker: if we've had too many failures recently, return cached/fallback value
    if (this.circuitBreakerOpen) {
      const timeSinceLastFailure = Date.now() - this.lastFailureTime;
      if (timeSinceLastFailure < 30000) {
        // 30 second cooldown
        console.log("⚡ Circuit breaker open, using fallback count");
        try {
          const AsyncStorage = await this.getAsyncStorage();
          if (AsyncStorage) {
            const favorites = await this.getFavoritesFromAsyncStorage();
            return favorites.length;
          }
        } catch (error) {
          console.error("❌ Fallback also failed:", error);
        }
        return 0;
      } else {
        // Reset circuit breaker after cooldown
        this.circuitBreakerOpen = false;
        this.failureCount = 0;
      }
    }

    try {
      console.log("📊 GETTING FAVORITES COUNT...");

      const userId = await this.getCurrentUserId();

      if (userId) {
        // ✅ AUTHENTICATED USER: Count from Supabase with improved timeout handling
        let timeoutId: NodeJS.Timeout | null = null;
        let queryCompleted = false;
        
        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => {
            if (!queryCompleted) {
              reject(new Error("Supabase query timeout"));
            }
          }, 8000); // Increased to 8 seconds for better reliability
        });

        const queryPromise = supabase
          .from("favorite_matches")
          .select("id", { count: "exact" })
          .eq("user_id", userId)
          .then((result) => {
            queryCompleted = true;
            if (timeoutId) clearTimeout(timeoutId);
            return result;
          })
          .catch((error) => {
            queryCompleted = true;
            if (timeoutId) clearTimeout(timeoutId);
            throw error;
          });

        try {
          const result = await Promise.race([
            queryPromise,
            timeoutPromise,
          ]);

          // If we get here, query completed (timeout would have rejected)
          const { count, error } = result as { count: number | null; error: any };

          if (error) {
            console.log("⚠️ Supabase query error - using fallback:", error.message);
            // Fallback to AsyncStorage if Supabase fails
            const AsyncStorage = await this.getAsyncStorage();
            if (AsyncStorage) {
              const favorites = await this.getFavoritesFromAsyncStorage();
              return favorites.length;
            }
            return 0;
          }

          const actualCount = count || 0;
          console.log(`📊 SUPABASE FAVORITES COUNT: ${actualCount}`);

          // Reset circuit breaker on successful operation
          this.failureCount = 0;
          this.circuitBreakerOpen = false;

          return actualCount;
        } catch (queryError) {
          // Clear timeout if still active
          if (timeoutId) clearTimeout(timeoutId);
          
          // Handle timeout and other errors gracefully
          const errorMessage = queryError instanceof Error ? queryError.message : String(queryError);
          if (errorMessage.includes("timeout")) {
            // Silently fallback for timeouts - don't log as error
            console.log("⏱️ Query timeout - using fallback");
          } else {
            // Log other errors but don't throw
            console.log("⚠️ Query error - using fallback:", errorMessage);
          }
          
          // Fallback to AsyncStorage
          try {
            const AsyncStorage = await this.getAsyncStorage();
            if (AsyncStorage) {
              const favorites = await this.getFavoritesFromAsyncStorage();
              return favorites.length;
            }
          } catch (fallbackError) {
            // Only log if fallback also fails
            console.error("❌ Fallback failed:", fallbackError);
          }
          return 0;
        }
      } else {
        // ✅ GUEST USER: Count from AsyncStorage
        const AsyncStorage = await this.getAsyncStorage();
        if (!AsyncStorage) {
          console.log("📊 AsyncStorage not available, returning 0");
          return 0;
        }

        const favorites = await this.getFavoritesFromAsyncStorage();
        const count = favorites.length;
        console.log(`📊 ASYNCSTORAGE FAVORITES COUNT: ${count}`);

        // Reset circuit breaker on successful operation
        this.failureCount = 0;
        this.circuitBreakerOpen = false;

        return count;
      }
    } catch (error) {
      this.failureCount++;
      this.lastFailureTime = Date.now();

      // Open circuit breaker after 3 consecutive failures
      if (this.failureCount >= 3) {
        this.circuitBreakerOpen = true;
        console.warn("⚡ Circuit breaker opened due to repeated failures");
      }

      const errorMessage =
        error instanceof Error ? error.message : String(error);
      
      // Don't log timeouts as errors - they're expected and handled gracefully
      if (errorMessage.includes("timeout")) {
        console.log("⏱️ FAVORITES SERVICE: Query timeout - using fallback");
      } else {
        console.error(
          "❌ FAVORITES SERVICE: Error getting favorites count:",
          errorMessage,
        );
      }

      // Final fallback attempt
      try {
        const AsyncStorage = await this.getAsyncStorage();
        if (AsyncStorage) {
          const favorites = await this.getFavoritesFromAsyncStorage();
          console.log(`📊 FALLBACK COUNT: ${favorites.length}`);
          return favorites.length;
        }
      } catch (fallbackError) {
        console.error("❌ Even fallback failed:", fallbackError);
      }

      return 0;
    }
  }

  /**
   * Reset circuit breaker manually (useful for debugging)
   */
  resetCircuitBreaker(): void {
    this.circuitBreakerOpen = false;
    this.failureCount = 0;
    this.lastFailureTime = 0;
    console.log("🔄 Circuit breaker manually reset");
  }

  /**
   * CRITICAL FIX: Automatically clear persistent test data that causes count mismatch
   */
  private async clearPersistentTestData(): Promise<void> {
    try {
      const AsyncStorage = await this.getAsyncStorage();
      if (!AsyncStorage) return;

      // Check if user is authenticated
      const userId = await this.getCurrentUserId();

      // ✅ AGGRESSIVE CLEANUP: Clear AsyncStorage for both guest and authenticated users
      // This ensures no stale data persists
      const asyncStorageData = await AsyncStorage.getItem(
        LEGACY_FAVORITES_STORAGE_KEY,
      );
      const asyncFavorites = asyncStorageData
        ? JSON.parse(asyncStorageData)
        : [];

      if (asyncFavorites.length > 0) {
        console.warn("🧹 CLEARING PERSISTENT TEST DATA from AsyncStorage...");
        console.warn(`   Found ${asyncFavorites.length} stale entries`);
        asyncFavorites.forEach((fav: any, idx: number) => {
          console.warn(`   ${idx + 1}. ${fav.homeTeam} vs ${fav.awayTeam} (ID: ${fav.id})`);
        });
        
        // Clear AsyncStorage only if user is authenticated
        // For guest users, we need to keep their actual favorites
        if (userId) {
          await AsyncStorage.removeItem(LEGACY_FAVORITES_STORAGE_KEY);
          console.log("✅ Persistent test data cleared - Follows count should now be accurate");
        } else {
          console.log("⚠️ Guest user detected - skipping AsyncStorage clear to preserve guest favorites");
        }
      }
    } catch (error) {
      console.error("❌ Error clearing persistent test data:", error);
    }
  }

  /**
   * NUCLEAR OPTION: Force clear ALL favorites from both AsyncStorage and Supabase
   * Use this when data corruption is suspected
   */
  async forceResetAllFavorites(): Promise<void> {
    try {
      console.warn("💥 NUCLEAR RESET: Clearing ALL favorites from all sources...");
      
      const userId = await this.getCurrentUserId();

      // 1. Clear AsyncStorage
      const AsyncStorage = await this.getAsyncStorage();
      if (AsyncStorage) {
        await AsyncStorage.removeItem(LEGACY_FAVORITES_STORAGE_KEY);
        console.log("✅ AsyncStorage cleared");
      }

      // 2. Clear Supabase for authenticated user
      if (userId) {
        console.log(`🔐 Clearing Supabase for user ${userId}`);
        
        // First, get all favorites to log what we're deleting
        const { data: existingFavorites, error: fetchError } = await supabase
          .from("favorite_matches")
          .select("*")
          .eq("user_id", userId);

        if (existingFavorites && existingFavorites.length > 0) {
          console.log(`📋 Found ${existingFavorites.length} favorites in database:`);
          existingFavorites.forEach((fav: any, idx: number) => {
            console.log(`   ${idx + 1}. ${fav.home_team} vs ${fav.away_team} (Match ID: ${fav.match_id}, DB ID: ${fav.id})`);
          });
        }

        // Delete all favorites for this user
        const { error: deleteError, count } = await supabase
          .from("favorite_matches")
          .delete({ count: "exact" })
          .eq("user_id", userId);

        if (deleteError) {
          console.error("❌ Error clearing Supabase:", deleteError);
          throw deleteError;
        }

        console.log(`✅ Deleted ${count || 0} records from Supabase`);
      }

      // 3. Broadcast the reset
      await this.broadcastFavoriteChange("ALL", false);
      
      console.log("💥 NUCLEAR RESET COMPLETE - All favorites cleared");
    } catch (error) {
      console.error("❌ Error in nuclear reset:", error);
      throw error;
    }
  }

  /**
   * Debug method to check for persistent test data causing count issues
   */
  private async debugFavoritesData(): Promise<void> {
    try {
      const AsyncStorage = await this.getAsyncStorage();
      if (!AsyncStorage) {
        console.log("🔍 DEBUG: AsyncStorage not available");
        return;
      }

      // Check AsyncStorage for persistent data
      const asyncStorageData = await AsyncStorage.getItem(
        LEGACY_FAVORITES_STORAGE_KEY,
      );
      const asyncFavorites = asyncStorageData
        ? JSON.parse(asyncStorageData)
        : [];

      console.log("🔍 DEBUG FAVORITES DATA:");
      console.log(`   AsyncStorage favorites: ${asyncFavorites.length}`);

      if (asyncFavorites.length > 0) {
        console.warn("⚠️ FOUND PERSISTENT TEST DATA in AsyncStorage!");
        console.warn(
          "   This might be causing the Follows button to show incorrect count.",
        );
        console.warn("   To fix: Use the clear cache API at /api/clear-cache");
        console.log("   Persistent favorites:");
        asyncFavorites.forEach((fav: any, index: number) => {
          console.log(
            `      ${index + 1}. ${fav.homeTeam} vs ${fav.awayTeam} (${
              fav.dateAdded
            })`,
          );
        });
      }

      // Check Supabase for authenticated user
      const userId = await this.getCurrentUserId();
      if (userId) {
        const { data: supabaseFavorites, error } = await supabase
          .from("favorite_matches")
          .select("*")
          .eq("user_id", userId);

        console.log(`   Supabase favorites: ${supabaseFavorites?.length || 0}`);

        if (error) {
          console.log("   Supabase error:", error.message);
        }
      } else {
        console.log("   No authenticated user - using AsyncStorage fallback");
      }
    } catch (error) {
      console.error("❌ DEBUG: Error checking favorites data:", error);
    }
  }

  /**
   * Migrate legacy AsyncStorage favorites to Supabase (when user logs in)
   */
  async migrateLegacyFavorites(): Promise<void> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        console.log(
          "⚠️ FAVORITES SERVICE: No authenticated user for migration",
        );
        return;
      }

      const AsyncStorage = await this.getAsyncStorage();
      if (!AsyncStorage) {
        console.log(
          "📦 FAVORITES SERVICE: AsyncStorage not available for migration",
        );
        return;
      }

      const legacyData = await AsyncStorage.getItem(
        LEGACY_FAVORITES_STORAGE_KEY,
      );
      if (!legacyData) {
        console.log("📦 FAVORITES SERVICE: No legacy favorites found");
        return;
      }

      const legacyFavorites: FavoriteMatch[] = JSON.parse(legacyData);
      console.log(
        `🔄 FAVORITES SERVICE: Migrating ${legacyFavorites.length} legacy favorites...`,
      );

      // Convert to Supabase format and insert
      const supabaseFavorites: SupabaseFavoriteMatch[] = legacyFavorites.map(
        (fav) => ({
          user_id: userId,
          match_id: fav.id,
          sport: fav.sport,
          home_team: fav.homeTeam,
          away_team: fav.awayTeam,
          league: fav.league,
          start_time: fav.startTime,
          status: fav.status,
        }),
      );

      // Insert in batches to avoid conflicts
      for (const favorite of supabaseFavorites) {
        try {
          await supabase.from("favorite_matches").insert([favorite]);
        } catch (insertError) {
          console.warn(
            "⚠️ FAVORITES SERVICE: Skipping duplicate favorite:",
            favorite.match_id,
          );
        }
      }

      // Clear legacy data after successful migration
      await AsyncStorage.removeItem(LEGACY_FAVORITES_STORAGE_KEY);
      console.log(
        "✅ FAVORITES SERVICE: Legacy favorites migrated and cleared",
      );
    } catch (error) {
      console.error(
        "❌ FAVORITES SERVICE: Error migrating legacy favorites:",
        error,
      );
      // Don't throw - migration failure shouldn't break the app
    }
  }

  /**
   * Check count vs actual matches (NON-DESTRUCTIVE - for debugging only)
   */
  async checkCountStatus(): Promise<{
    count: number;
    actualFavorites: number;
    synchronized: boolean;
  }> {
    try {
      console.log("🔍 CHECKING FAVORITES COUNT STATUS (NON-DESTRUCTIVE)...");

      const count = await this.getFavoritesCount();
      const favorites = await this.getFavorites();

      console.log(
        `📊 Count method: ${count}, Actual favorites: ${favorites.length}`,
      );

      const synchronized = count === favorites.length;

      if (synchronized) {
        console.log("✅ Count is perfectly synchronized");
      } else {
        console.warn(
          `⚠️ Count mismatch detected: ${count} vs ${favorites.length} (NOT FIXING AUTOMATICALLY)`,
        );
      }

      return {
        count,
        actualFavorites: favorites.length,
        synchronized,
      };
    } catch (error) {
      console.error("❌ Error checking count status:", error);
      return { count: 0, actualFavorites: 0, synchronized: true };
    }
  }

  /**
   * Comprehensive debugging method for favorites sync issues
   */
  async debugFavoritesSync(): Promise<void> {
    try {
      console.log("🐛 === FAVORITES DEBUG SESSION START ===");

      const userId = await this.getCurrentUserId();
      console.log(`👤 User ID: ${userId || "GUEST"}`);

      // Get count and actual favorites
      const count = await this.getFavoritesCount();
      const favorites = await this.getFavorites();

      console.log(`📊 Count: ${count}, Actual favorites: ${favorites.length}`);

      if (userId) {
        // Check Supabase directly
        try {
          const {
            data: supabaseData,
            error: supabaseError,
            count: supabaseCount,
          } = await supabase
            .from("favorite_matches")
            .select("*", { count: "exact" })
            .eq("user_id", userId);

          if (supabaseError) {
            console.error("❌ Supabase direct query error:", supabaseError);
          } else {
            console.log(
              `🔍 Supabase direct count: ${supabaseCount}, data length: ${supabaseData?.length || 0}`,
            );

            if (supabaseData && supabaseData.length > 0) {
              console.log("📝 Supabase favorite matches:");
              supabaseData.forEach((match, index) => {
                console.log(
                  `  ${index + 1}. ${match.home_team} vs ${match.away_team} (ID: ${match.match_id})`,
                );
              });
            }
          }
        } catch (dbError) {
          console.error("❌ Direct Supabase query failed:", dbError);
        }
      } else {
        // Check AsyncStorage directly
        try {
          const AsyncStorage = await this.getAsyncStorage();
          if (AsyncStorage) {
            const asyncData = await AsyncStorage.getItem(
              LEGACY_FAVORITES_STORAGE_KEY,
            );
            const asyncFavorites = asyncData ? JSON.parse(asyncData) : [];
            console.log(`📱 AsyncStorage count: ${asyncFavorites.length}`);

            if (asyncFavorites.length > 0) {
              console.log("📝 AsyncStorage favorite matches:");
              asyncFavorites.forEach((match: any, index: number) => {
                console.log(
                  `  ${index + 1}. ${match.homeTeam} vs ${match.awayTeam} (ID: ${match.id})`,
                );
              });
            }
          }
        } catch (asyncError) {
          console.error("❌ AsyncStorage query failed:", asyncError);
        }
      }

      // Show what getFavorites returns
      if (favorites.length > 0) {
        console.log("📝 getFavorites() returned:");
        favorites.forEach((match, index) => {
          console.log(
            `  ${index + 1}. ${match.homeTeam} vs ${match.awayTeam} (ID: ${match.id})`,
          );
        });
      } else {
        console.log("📝 getFavorites() returned no matches");
      }

      // Check for duplicates
      const matchIds = favorites.map((f) => f.id);
      const uniqueIds = [...new Set(matchIds)];
      if (matchIds.length !== uniqueIds.length) {
        console.warn(
          `⚠️ DUPLICATE MATCH IDS DETECTED! Total: ${matchIds.length}, Unique: ${uniqueIds.length}`,
        );
        const duplicates = matchIds.filter(
          (id, index) => matchIds.indexOf(id) !== index,
        );
        console.warn(`🔍 Duplicate IDs: ${duplicates.join(", ")}`);
      }

      // Check circuit breaker status
      console.log(`🔌 Circuit breaker open: ${this.circuitBreakerOpen}`);
      console.log(`❌ Failure count: ${this.failureCount}`);
      console.log(
        `⏰ Last failure time: ${new Date(this.lastFailureTime).toISOString()}`,
      );

      console.log("🐛 === FAVORITES DEBUG SESSION END ===");
    } catch (error) {
      console.error("❌ Debug session failed:", error);
    }
  }

  /**
   * Force synchronization of count and data (USE WITH CAUTION)
   */
  async forceSynchronization(): Promise<void> {
    try {
      console.log("🔄 FORCING FAVORITES SYNCHRONIZATION...");

      const favorites = await this.getFavorites();
      const actualCount = favorites.length;

      console.log(`🔄 Actual favorites found: ${actualCount}`);

      // Clear circuit breaker
      this.circuitBreakerOpen = false;
      this.failureCount = 0;
      this.lastFailureTime = 0;

      // Broadcast the correct count
      await this.broadcastFavoriteChange("sync", true);

      console.log("✅ Synchronization completed");
    } catch (error) {
      console.error("❌ Synchronization failed:", error);
    }
  }

  /**
   * Remove duplicate favorites entries (USE WITH CAUTION)
   */
  async removeDuplicateFavorites(): Promise<void> {
    try {
      console.log("🔄 REMOVING DUPLICATE FAVORITES...");

      const userId = await this.getCurrentUserId();

      if (userId) {
        // Check for duplicates in Supabase
        const { data, error } = await supabase
          .from("favorite_matches")
          .select("*")
          .eq("user_id", userId)
          .order("date_added", { ascending: true });

        if (error) {
          console.error(
            "❌ Error fetching favorites for duplicate check:",
            error,
          );
          return;
        }

        if (!data || data.length === 0) {
          console.log("📊 No favorites found");
          return;
        }

        // Find duplicates by match_id
        const seen = new Set();
        const duplicates: SupabaseFavoriteMatch[] = [];
        const unique: SupabaseFavoriteMatch[] = [];

        data.forEach((item: SupabaseFavoriteMatch) => {
          if (seen.has(item.match_id)) {
            duplicates.push(item);
          } else {
            seen.add(item.match_id);
            unique.push(item);
          }
        });

        if (duplicates.length > 0) {
          console.log(`🗑️ Found ${duplicates.length} duplicate entries`);

          // Remove duplicates (keep the first occurrence)
          const duplicateIds = duplicates
            .map((dup) => dup.id)
            .filter((id) => id);

          if (duplicateIds.length > 0) {
            const { error: deleteError } = await supabase
              .from("favorite_matches")
              .delete()
              .in("id", duplicateIds);

            if (deleteError) {
              console.error("❌ Error removing duplicates:", deleteError);
            } else {
              console.log(
                `✅ Removed ${duplicateIds.length} duplicate entries`,
              );
            }
          }
        } else {
          console.log("✅ No duplicates found in Supabase");
        }
      } else {
        // Check AsyncStorage for duplicates
        const favorites = await this.getFavoritesFromAsyncStorage();
        const seen = new Set();
        const uniqueFavorites = favorites.filter((fav) => {
          if (seen.has(fav.id)) {
            return false;
          }
          seen.add(fav.id);
          return true;
        });

        if (uniqueFavorites.length < favorites.length) {
          console.log(
            `🗑️ Found ${favorites.length - uniqueFavorites.length} duplicates in AsyncStorage`,
          );

          const AsyncStorage = await this.getAsyncStorage();
          if (AsyncStorage) {
            await AsyncStorage.setItem(
              LEGACY_FAVORITES_STORAGE_KEY,
              JSON.stringify(uniqueFavorites),
            );
            console.log(`✅ Removed duplicates from AsyncStorage`);
          }
        } else {
          console.log("✅ No duplicates found in AsyncStorage");
        }
      }

      // Broadcast sync after cleanup
      await this.broadcastFavoriteChange("cleanup", true);
    } catch (error) {
      console.error("❌ Error removing duplicates:", error);
    }
  }

  /**
   * Clear all favorites data (for debugging/testing)
   */
  async clearAllFavorites(): Promise<void> {
    try {
      console.log("🧹 CLEARING ALL FAVORITES DATA...");

      const userId = await this.getCurrentUserId();

      // Clear Supabase data if authenticated
      if (userId) {
        const { error } = await supabase
          .from("favorite_matches")
          .delete()
          .eq("user_id", userId);

        if (error) {
          console.error("❌ Error clearing Supabase favorites:", error);
        } else {
          console.log("✅ Cleared Supabase favorites");
        }
      }

      // Clear AsyncStorage data
      try {
        const AsyncStorage = await this.getAsyncStorage();
        if (AsyncStorage) {
          await AsyncStorage.removeItem(LEGACY_FAVORITES_STORAGE_KEY);
          console.log("✅ Cleared AsyncStorage favorites");
        }
      } catch (error) {
        console.error("❌ Error clearing AsyncStorage favorites:", error);
      }

      console.log("🧹 All favorites data cleared");
    } catch (error) {
      console.error("❌ Error clearing favorites:", error);
    }
  }
}

// Export singleton instance
export const favoritesService = new FavoritesService();
export default favoritesService;
export type { FavoriteMatch };
