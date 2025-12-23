import { useState, useEffect, useCallback, useRef } from "react";
import favoritesService from "../services/favoritesService";

export function useFavorites() {
  const [favoritesCount, setFavoritesCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const debounceTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const isRefreshingRef = useRef<boolean>(false); // ✅ Use ref for isRefreshing to avoid dependency issues
  const syncListenerRef = useRef<(() => void) | null>(null);
  const countListenerRef = useRef<(() => void) | null>(null);
  const previousCountRef = useRef<number>(0);

  // Enhanced debounced refresh to prevent excessive calls and blinking
  const refreshFavoritesCount = useCallback(
    async (immediate = false) => {
      // Clear existing timer for this operation
      const timerId = debounceTimers.current.get("refreshCount");
      if (timerId) {
        clearTimeout(timerId);
      }

      const performRefresh = async () => {
        // Prevent infinite loops and rapid consecutive calls
        // Use ref instead of state to avoid dependency issues
        if (isRefreshingRef.current) {
          console.log("⚠️ Already refreshing favorites count, skipping...");
          return;
        }

        try {
          isRefreshingRef.current = true;
          setIsRefreshing(true);
          // Don't show loading for count refresh to prevent UI blinking
          // setLoading(true);

          // ✅ SAFE: Only get the count, never clear user data
          const count = await favoritesService.getFavoritesCount();
          const previousCount = previousCountRef.current;

          // Only update state if count actually changed to prevent unnecessary re-renders
          if (previousCount !== count) {
            setFavoritesCount(count);
            previousCountRef.current = count;
            console.log(
              `⭐ FAVORITES COUNT UPDATED: ${previousCount} → ${count}`,
            );
          } else {
            console.log(`⭐ Favorites count confirmed: ${count}`);
          }
        } catch (error) {
          console.error("❌ Error refreshing favorites count:", error);
          // Don't reset to 0 as it might cause blinking - keep previous count
          // setFavoritesCount(0);
        } finally {
          // setLoading(false);
          setIsRefreshing(false);
          isRefreshingRef.current = false;
        }
      };

      if (immediate) {
        await performRefresh();
      } else {
        // Longer debounce to prevent rapid updates that cause blinking
        const newTimer = setTimeout(performRefresh, 500);
        debounceTimers.current.set("refreshCount", newTimer);
      }
    },
    [], // ✅ FIXED: Remove isRefreshing from dependencies to prevent infinite loop
  );

  // Setup sync listeners and initialize
  useEffect(() => {
    const initializeFavorites = async () => {
      try {
        console.log("⚡ INITIALIZING FAVORITES...");

        // Setup sync listener for individual match changes - minimal logging to reduce noise
        syncListenerRef.current = favoritesService.addSyncListener(
          (matchId: string, isFavorite: boolean) => {
            console.log(
              `🔄 SYNC: Match ${matchId} favorite status: ${isFavorite}`,
            );
            // No need to refresh count here as the service handles it
          },
        );

        // Setup count listener for immediate count updates with anti-blinking protection
        countListenerRef.current = favoritesService.addCountListener(
          (count: number) => {
            console.log(`📊 COUNT UPDATE: ${count} favorites`);
            // Double-check to prevent unnecessary updates that cause blinking
            if (previousCountRef.current !== count && !isRefreshingRef.current) {
              setFavoritesCount(count);
              previousCountRef.current = count;
            }
          },
        );

        // Initial load without using the callback to avoid circular dependency
        try {
          const count = await favoritesService.getFavoritesCount();
          setFavoritesCount(count);
          previousCountRef.current = count;
          console.log(`⭐ Initial favorites count: ${count}`);
        } catch (error) {
          console.error("❌ Error getting initial favorites count:", error);
          setFavoritesCount(0);
        }
        console.log("⚡ FAVORITES INITIALIZED SUCCESSFULLY");
      } catch (error) {
        console.error("❌ Error initializing favorites:", error);
        setFavoritesCount(0);
      }
    };

    initializeFavorites();

    // Cleanup listeners on unmount
    return () => {
      if (syncListenerRef.current) {
        syncListenerRef.current();
      }
      if (countListenerRef.current) {
        countListenerRef.current();
      }
      // Clear all debounce timers
      debounceTimers.current.forEach((timer) => clearTimeout(timer));
      debounceTimers.current.clear();
    };
  }, []);

  // Enhanced add favorite with debouncing and better error handling
  const addFavorite = useCallback(async (matchInput: any) => {
    try {
      // Handle both string ID and match object formats
      let match: any;

      if (typeof matchInput === "string" || typeof matchInput === "number") {
        // If just an ID is passed, reject it with helpful error
        console.error(
          "❌ useFavorites: addFavorite requires full match object, not just ID:",
          matchInput,
        );
        return false;
      }

      match = matchInput;

      // ✅ ENHANCED VALIDATION: Check for valid match data
      if (
        !match ||
        !match.id ||
        (typeof match.id !== "string" && typeof match.id !== "number") ||
        match.id.toString().trim() === ""
      ) {
        console.error("❌ useFavorites: INVALID MATCH for addFavorite:", match);
        return false;
      }

      const matchIdString = match.id.toString();

      // Debounce rapid calls for the same match
      const debounceKey = `add_${matchIdString}`;
      const existingTimer = debounceTimers.current.get(debounceKey);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      return new Promise<boolean>((resolve) => {
        const timer = setTimeout(async () => {
          try {
            const homeTeamName = match.home?.name || match.homeTeam;
            const awayTeamName = match.away?.name || match.awayTeam;

            if (!homeTeamName || !awayTeamName) {
              console.error(
                "❌ useFavorites: INVALID MATCH DATA - missing team names:",
                match,
              );
              resolve(false);
              return;
            }

            console.log(
              `➕ ADDING TO FAVORITES: ${homeTeamName} vs ${awayTeamName}`,
            );
            console.log(`   Match ID: ${matchIdString}`);

            // Create a standardized match object for the favorites service
            const standardizedMatch = {
              id: matchIdString,
              sport: match.sport || "football",
              league: match.league || "Unknown League",
              status: match.status || "upcoming",
              statusText: match.statusText || "",
              startTime: match.startTime || new Date().toISOString(),
              home: {
                name: homeTeamName,
                logo: match.home?.logo || "",
              },
              away: {
                name: awayTeamName,
                logo: match.away?.logo || "",
              },
              score: match.score || "0-0",
              halfTimeScore: match.halfTimeScore || "0-0",
              viewers: match.viewers || "1",
              hasVideo: match.hasVideo || false,
              isFavorite: true,
            };

            await favoritesService.addToFavorites(standardizedMatch);

            console.log("✅ Added to favorites successfully");
            resolve(true);
          } catch (error) {
            console.error("❌ Error adding favorite:", error);
            resolve(false);
          } finally {
            debounceTimers.current.delete(debounceKey);
          }
        }, 100);

        debounceTimers.current.set(debounceKey, timer);
      });
    } catch (error) {
      console.error("❌ Error in addFavorite:", error);
      return false;
    }
  }, []);

  // Enhanced remove favorite with debouncing and better error handling
  const removeFavorite = useCallback(async (matchId: string) => {
    try {
      // ✅ ENHANCED VALIDATION: Check for valid match ID
      if (
        !matchId ||
        (typeof matchId !== "string" && typeof matchId !== "number") ||
        matchId.toString().trim() === ""
      ) {
        console.error(
          "❌ useFavorites: INVALID MATCH ID for removeFavorite:",
          matchId,
        );
        return false;
      }

      const matchIdString = matchId.toString();

      // Debounce rapid calls for the same match
      const debounceKey = `remove_${matchIdString}`;
      const existingTimer = debounceTimers.current.get(debounceKey);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      return new Promise<boolean>((resolve) => {
        const timer = setTimeout(async () => {
          try {
            console.log(`🗑️ REMOVING FROM FAVORITES: ${matchIdString}`);
            await favoritesService.removeFromFavorites(matchIdString);

            console.log("✅ Removed from favorites successfully");
            resolve(true);
          } catch (error) {
            console.error("❌ Error removing favorite:", error);
            resolve(false);
          } finally {
            debounceTimers.current.delete(debounceKey);
          }
        }, 100);

        debounceTimers.current.set(debounceKey, timer);
      });
    } catch (error) {
      console.error("❌ Error in removeFavorite:", error);
      return false;
    }
  }, []);

  // Function to check if match is favorite with caching
  const isFavorite = useCallback(async (matchId: string): Promise<boolean> => {
    try {
      if (!matchId || typeof matchId !== "string") {
        return false;
      }
      return await favoritesService.isFavorite(matchId.toString());
    } catch (error) {
      console.error("❌ Error checking favorite status:", error);
      return false;
    }
  }, []);

  // Function to get all favorite matches with error handling
  const getFavorites = useCallback(async () => {
    try {
      return await favoritesService.getFavorites();
    } catch (error) {
      console.error("❌ Error getting favorites:", error);
      return [];
    }
  }, []);

  return {
    favoritesCount,
    loading,
    isRefreshing,
    refreshFavoritesCount,
    addFavorite,
    removeFavorite,
    isFavorite,
    getFavorites,
  };
}
