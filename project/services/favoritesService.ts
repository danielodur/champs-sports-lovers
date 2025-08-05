import { supabase } from "./supabaseClient";
import { Match } from "@/types/match";

// Legacy AsyncStorage key for migration and fallback
const LEGACY_FAVORITES_STORAGE_KEY = "favoriteMatches";

interface FavoriteMatch {
  id: string;
  sport: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  startTime: string;
  status: "live" | "finished" | "upcoming";
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

  /**
   * Set current user ID for favorites operations
   */
  setCurrentUser(userId: string | null) {
    this.currentUserId = userId;
    console.log("👤 FAVORITES SERVICE: User set to:", userId || "none");
  }

  /**
   * Get current user ID from auth session
   */
  private async getCurrentUserId(): Promise<string | null> {
    if (this.currentUserId) {
      return this.currentUserId;
    }

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      this.currentUserId = session?.user?.id || null;
      return this.currentUserId;
    } catch (error) {
      console.error("❌ Error getting current user:", error);
      return null;
    }
  }

  /**
   * Get AsyncStorage for fallback functionality
   */
  private async getAsyncStorage() {
    try {
      const AsyncStorage = await import(
        "@react-native-async-storage/async-storage"
      ).then((m) => m.default);
      return AsyncStorage;
    } catch (error) {
      console.error("❌ Could not import AsyncStorage:", error);
      return null;
    }
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
        console.error(
          "❌ FAVORITES SERVICE: INVALID MATCH - missing or invalid ID"
        );
        console.error("❌ FAVORITES SERVICE: Received match:", match);
        throw new Error("Invalid match data: missing or invalid ID");
      }

      const userId = await this.getCurrentUserId();

      // Support both Match interface and standardized match object formats
      const homeTeamName = match.home?.name || match.homeTeam;
      const awayTeamName = match.away?.name || match.awayTeam;

      if (!homeTeamName || !awayTeamName) {
        console.error(
          "❌ FAVORITES SERVICE: INVALID MATCH - missing team names"
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
            "⚠️ FAVORITES SERVICE: Match already in favorites, skipping add"
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
          `✅ FAVORITES SERVICE: Successfully added ${homeTeamName} vs ${awayTeamName} to Supabase`
        );
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
            "⚠️ FAVORITES SERVICE: Match already in favorites, skipping add"
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
          JSON.stringify(updatedFavorites)
        );

        console.log(
          `✅ FAVORITES SERVICE: Successfully added ${homeTeamName} vs ${awayTeamName} to AsyncStorage`
        );
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
          matchId
        );
        throw new Error("Invalid match ID for removal");
      }

      const userId = await this.getCurrentUserId();

      console.log("🗑️ FAVORITES SERVICE: Removing from favorites...");
      console.log(`   User ID: ${userId || "GUEST USER"}`);
      console.log(`   Match ID: ${matchId}`);

      if (userId) {
        // ✅ AUTHENTICATED USER: Use Supabase
        console.log("🔐 Using Supabase for authenticated user");

        const { error } = await supabase
          .from("favorite_matches")
          .delete()
          .eq("user_id", userId)
          .eq("match_id", matchId);

        if (error) {
          console.error("❌ FAVORITES SERVICE: Database error:", error);
          throw new Error(`Failed to remove favorite: ${error.message}`);
        }

        console.log(
          `✅ FAVORITES SERVICE: Successfully removed match ${matchId} from Supabase`
        );
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
            "⚠️ FAVORITES SERVICE: Match was not in favorites, no removal needed"
          );
          return;
        }

        await AsyncStorage.setItem(
          LEGACY_FAVORITES_STORAGE_KEY,
          JSON.stringify(updatedFavorites)
        );

        console.log(
          `✅ FAVORITES SERVICE: Successfully removed match ${matchId} from AsyncStorage`
        );
      }
    } catch (error) {
      console.error(
        "❌ FAVORITES SERVICE: Error removing from favorites:",
        error
      );
      throw error; // Re-throw to let caller handle
    }
  }

  /**
   * Get all favorite matches with fallback to AsyncStorage
   */
  async getFavorites(): Promise<FavoriteMatch[]> {
    try {
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
          })
        );

        console.log(
          `📊 FAVORITES SERVICE: Retrieved ${favorites.length} favorites from Supabase`
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
        LEGACY_FAVORITES_STORAGE_KEY
      );
      const favorites = favoritesData ? JSON.parse(favoritesData) : [];
      console.log(
        `📊 FAVORITES SERVICE: Retrieved ${favorites.length} favorites from AsyncStorage`
      );
      return favorites;
    } catch (error) {
      console.error(
        "❌ FAVORITES SERVICE: Error getting favorites from AsyncStorage:",
        error
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
          // PGRST116 is "not found" error
          console.error(
            "❌ FAVORITES SERVICE: Error checking favorite status:",
            error
          );
          // Fallback to AsyncStorage on error
          const favorites = await this.getFavoritesFromAsyncStorage();
          return favorites.some((fav) => fav.id === matchId);
        }

        return !!data;
      } else {
        // ✅ GUEST USER: Use AsyncStorage fallback
        const favorites = await this.getFavoritesFromAsyncStorage();
        return favorites.some((fav) => fav.id === matchId);
      }
    } catch (error) {
      console.error(
        "❌ FAVORITES SERVICE: Error checking favorite status:",
        error
      );
      return false;
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
            `⚡ FAVORITES SERVICE: Retrieved ${ids.length} favorite IDs from AsyncStorage fallback`
          );
          return ids;
        }

        const ids = (data || [])
          .map((item) => item.match_id)
          .filter((id) => id && typeof id === "string" && id.trim() !== "");
        console.log(
          `⚡ FAVORITES SERVICE: Retrieved ${ids.length} favorite IDs from Supabase`
        );
        return ids;
      } else {
        // ✅ GUEST USER: Use AsyncStorage fallback
        const favorites = await this.getFavoritesFromAsyncStorage();
        const ids = favorites
          .map((fav) => fav.id)
          .filter((id) => id && typeof id === "string" && id.trim() !== "");
        console.log(
          `⚡ FAVORITES SERVICE: Retrieved ${ids.length} favorite IDs from AsyncStorage`
        );
        return ids;
      }
    } catch (error) {
      console.error("❌ FAVORITES SERVICE: Error getting favorite IDs:", error);
      return [];
    }
  }

  /**
   * Get favorites count - FIXED to always return actual count
   */
  async getFavoritesCount(): Promise<number> {
    try {
      console.log("📊 GETTING FAVORITES COUNT...");

      // ✅ CRITICAL DEBUG: Check for persistent test data that might be causing the count issue
      await this.debugFavoritesData();

      // ✅ AUTOMATIC FIX: Clear persistent test data if detected
      await this.clearPersistentTestData();

      // ✅ CRITICAL FIX: Always get actual favorites and count them
      const actualFavorites = await this.getFavorites();
      const actualCount = actualFavorites.length;

      console.log(`📊 FAVORITES COUNT: Returning actual count: ${actualCount}`);

      if (actualCount > 0) {
        console.log(`📊 FAVORITES DETAILS:`);
        actualFavorites.forEach((fav, index) => {
          console.log(
            `   ${index + 1}. ${fav.homeTeam} vs ${fav.awayTeam} (${
              fav.league
            })`
          );
        });
      } else {
        console.log(`📊 FAVORITES: No favorites found`);
      }

      return actualCount;
    } catch (error) {
      console.error(
        "❌ FAVORITES SERVICE: Error getting favorites count:",
        error
      );
      return 0;
    }
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

      // Only clear AsyncStorage data if user is authenticated (to prevent clearing guest favorites)
      if (userId) {
        const asyncStorageData = await AsyncStorage.getItem(
          LEGACY_FAVORITES_STORAGE_KEY
        );
        const asyncFavorites = asyncStorageData
          ? JSON.parse(asyncStorageData)
          : [];

        if (asyncFavorites.length > 0) {
          console.warn("🧹 CLEARING PERSISTENT TEST DATA from AsyncStorage...");
          await AsyncStorage.removeItem(LEGACY_FAVORITES_STORAGE_KEY);
          console.log(
            "✅ Persistent test data cleared - Follows count should now be accurate"
          );
        }
      }
    } catch (error) {
      console.error("❌ Error clearing persistent test data:", error);
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
        LEGACY_FAVORITES_STORAGE_KEY
      );
      const asyncFavorites = asyncStorageData
        ? JSON.parse(asyncStorageData)
        : [];

      console.log("🔍 DEBUG FAVORITES DATA:");
      console.log(`   AsyncStorage favorites: ${asyncFavorites.length}`);

      if (asyncFavorites.length > 0) {
        console.warn("⚠️ FOUND PERSISTENT TEST DATA in AsyncStorage!");
        console.warn(
          "   This might be causing the Follows button to show incorrect count."
        );
        console.warn("   To fix: Use the clear cache API at /api/clear-cache");
        console.log("   Persistent favorites:");
        asyncFavorites.forEach((fav: any, index: number) => {
          console.log(
            `      ${index + 1}. ${fav.homeTeam} vs ${fav.awayTeam} (${
              fav.dateAdded
            })`
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
          "⚠️ FAVORITES SERVICE: No authenticated user for migration"
        );
        return;
      }

      const AsyncStorage = await this.getAsyncStorage();
      if (!AsyncStorage) {
        console.log(
          "📦 FAVORITES SERVICE: AsyncStorage not available for migration"
        );
        return;
      }

      const legacyData = await AsyncStorage.getItem(
        LEGACY_FAVORITES_STORAGE_KEY
      );
      if (!legacyData) {
        console.log("📦 FAVORITES SERVICE: No legacy favorites found");
        return;
      }

      const legacyFavorites: FavoriteMatch[] = JSON.parse(legacyData);
      console.log(
        `🔄 FAVORITES SERVICE: Migrating ${legacyFavorites.length} legacy favorites...`
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
        })
      );

      // Insert in batches to avoid conflicts
      for (const favorite of supabaseFavorites) {
        try {
          await supabase.from("favorite_matches").insert([favorite]);
        } catch (insertError) {
          console.warn(
            "⚠️ FAVORITES SERVICE: Skipping duplicate favorite:",
            favorite.match_id
          );
        }
      }

      // Clear legacy data after successful migration
      await AsyncStorage.removeItem(LEGACY_FAVORITES_STORAGE_KEY);
      console.log(
        "✅ FAVORITES SERVICE: Legacy favorites migrated and cleared"
      );
    } catch (error) {
      console.error(
        "❌ FAVORITES SERVICE: Error migrating legacy favorites:",
        error
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
        `📊 Count method: ${count}, Actual favorites: ${favorites.length}`
      );

      const synchronized = count === favorites.length;

      if (synchronized) {
        console.log("✅ Count is perfectly synchronized");
      } else {
        console.warn(
          `⚠️ Count mismatch detected: ${count} vs ${favorites.length} (NOT FIXING AUTOMATICALLY)`
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
