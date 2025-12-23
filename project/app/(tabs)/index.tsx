/**
 * ═══════════════════════════════════════════════════════════════════════
 * HOME SCREEN (Main App Screen)
 * ═══════════════════════════════════════════════════════════════════════
 * 
 * File: app/(tabs)/index.tsx
 * Route: / (default/home route)
 * 
 * This is the MAIN HOME SCREEN of the app.
 * 
 * Features:
 * - Sports tabs (Football, Basketball, etc.)
 * - Match filters (All, Live, Finished, Fixtures, Follows)
 * - Date selector
 * - Match list display
 * - Pull-to-refresh
 * 
 * Note: This file MUST be named "index.tsx" for Expo Router to use it
 *       as the default home route. Do not rename.
 * ═══════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { View, Text, StyleSheet, StatusBar, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Settings } from "lucide-react-native"; // ✅ Match Settings icon
import { useTheme } from "../../hooks/useTheme";
import { useTranslation } from "react-i18next";
import { useFavorites } from "../../hooks/useFavorites";
import SportsTabs from "../../components/SportsTabs";
import FilterTabs from "../../components/FilterTabs";
import DateSelector from "../../components/DateSelector";
import MatchList from "../../components/match-list";
import ConsecutiveStatsButton from "../../components/ConsecutiveStatsButton";
import { getLocalDateForApi } from "../../utils/timeUtils";

import { fetchMatches, preloadMatchData } from "../../services/matchService";
import goalDetectionService from "../../services/goalDetectionService";
import { useMatchSettings } from "../../contexts/MatchSettingsContext";
import { FCMTokenManager } from "../../components/FCMTokenManager";

// ✅ DATE VALIDATION: Accept valid future dates (including 2025)
const validateAndCorrectDate = (dateString: string): string => {
  const inputDate = new Date(dateString);

  // Only reject truly invalid dates, not future dates
  if (isNaN(inputDate.getTime())) {
    console.warn("⚠️ DATE FIX: Invalid date detected, using current date");
    const now = new Date();
    return now.toISOString().split("T")[0];
  }

  // Accept all valid dates including future years (2025, etc.)
  return dateString;
};

// ✅ SAFE DATE GENERATOR: Always returns a valid current date using centralized utility
const getSafeCurrentDate = (): string => {
  try {
    return getLocalDateForApi();
  } catch (error) {
    console.error("❌ Date generation failed:", error);
    // Ultimate fallback
    return new Date().toISOString().split("T")[0];
  }
};

// export function useNotificationListener() {
//   useEffect(() => {
//     const subscription = Notifications.addNotificationReceivedListener(
//       (notification) => {
//         console.log("Notification received:", notification);
//         Alert.alert("Goal!", notification.request.content.body || ""); // show in-app popup
//       }
//     );

//     return () => subscription.remove();
//   }, []);
// }

export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const [activeFilter, setActiveFilter] = useState<
    "all" | "live" | "fixture" | "finished" | "follows"
  >("all");
  const [activeSport, setActiveSport] = useState("football");
  const [sortMode, setSortMode] = useState<"time" | "relevance">("time");
  const [displayMode, setDisplayMode] = useState<"score" | "odds">("score");
  const [selectedDate, setSelectedDate] = useState(getSafeCurrentDate());
  const [matchCount, setMatchCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentMatches, setCurrentMatches] = useState<any[]>([]);
  const { favoritesCount, refreshFavoritesCount } = useFavorites();

  // Debug utility for favorites troubleshooting
  const debugFavorites = useCallback(async () => {
    console.log("🐛 === HOME SCREEN DEBUG ===");
    console.log(`Active filter: ${activeFilter}`);
    console.log(`Favorites count: ${favoritesCount}`);

    try {
      const { favoritesService } = await import(
        "../../services/favoritesService"
      );
      await favoritesService.debugFavoritesSync();
    } catch (error) {
      console.error("Debug failed:", error);
    }
  }, [activeFilter, favoritesCount]);

  // Expose debug and reset functions globally for testing
  useEffect(() => {
    (global as any).debugFavorites = debugFavorites;
    
    (global as any).showDatabaseFavorites = async () => {
      console.log("🔍 === DATABASE INSPECTION ===");
      try {
        const { favoritesService } = await import("../../services/favoritesService");
        const { supabase } = await import("../../services/supabaseClient");
        
        // Get user ID
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id;
        
        if (!userId) {
          console.log("⚠️ No authenticated user");
          return;
        }
        
        console.log(`👤 User ID: ${userId}`);
        
        // Get all favorites from database
        const { data, error } = await supabase
          .from("favorite_matches")
          .select("*")
          .eq("user_id", userId);
        
        if (error) {
          console.error("❌ Database error:", error);
          return;
        }
        
        console.log(`📊 Total records in database: ${data?.length || 0}`);
        
        if (data && data.length > 0) {
          console.log("📋 Database records:");
          data.forEach((record: any, idx: number) => {
            console.log(`  ${idx + 1}. DB ID: ${record.id}`);
            console.log(`     Match ID: ${record.match_id} (type: ${typeof record.match_id})`);
            console.log(`     Match: ${record.home_team} vs ${record.away_team}`);
            console.log(`     League: ${record.league}`);
            console.log(`     Sport: ${record.sport}`);
            console.log(`     Added: ${record.date_added}`);
            console.log(`     ---`);
          });
        } else {
          console.log("✅ Database is clean - no favorites found");
        }
      } catch (error) {
        console.error("❌ Inspection failed:", error);
      }
    };
    
    (global as any).forceResetAllFavorites = async () => {
      console.log("💥 CALLING NUCLEAR RESET FROM GLOBAL...");
      try {
        const { favoritesService } = await import("../../services/favoritesService");
        await favoritesService.forceResetAllFavorites();
        await refreshFavoritesCount(true);
        console.log("💥 NUCLEAR RESET COMPLETE - Refreshing UI...");
        console.log("📱 Please close and reopen the app to see changes");
      } catch (error) {
        console.error("❌ Nuclear reset failed:", error);
      }
    };
    
    return () => {
      delete (global as any).debugFavorites;
      delete (global as any).forceResetAllFavorites;
      delete (global as any).showDatabaseFavorites;
    };
  }, [debugFavorites, refreshFavoritesCount]);

  // ✅ OPTIMIZED GLOBAL REFRESH FUNCTION: Prevent excessive refreshes for favorites
  useEffect(() => {
    // Enhanced global refresh with better coordination
    (global as any).refreshMatchLists = () => {
      console.log(
        "🔄 GLOBAL REFRESH: Refreshing all match lists from other screens",
      );
      // Only refresh if not on follows filter to prevent blinking
      if (activeFilter !== "follows") {
        setRefreshKey((prev) => prev + 1);
      }
      // Don't call refreshFavoritesCount here to prevent cascading updates
    };

    // Optimized global favorites sync - reduce excessive refreshes
    (global as any).onMatchFavoriteChanged = (
      matchId: string,
      isFavorite: boolean,
    ) => {
      console.log(
        `🔄 HOME SCREEN: Global favorite sync - Match ${matchId} favorite: ${isFavorite}`,
      );
      // Only trigger refresh for non-follows filters to prevent blinking
      if (activeFilter !== "follows") {
        setTimeout(() => {
          setRefreshKey((prev) => prev + 1);
        }, 200);
      }
    };

    // Simplified global count sync - let the hook handle updates
    (global as any).onFavoritesCountChanged = (newCount: number) => {
      console.log(`📊 HOME SCREEN: Global count sync - ${newCount} favorites`);
      // Don't force refresh here - let useFavorites hook handle the updates
    };

    return () => {
      delete (global as any).refreshMatchLists;
      delete (global as any).onMatchFavoriteChanged;
      delete (global as any).onFavoritesCountChanged;
    };
  }, [activeFilter]); // Removed refreshFavoritesCount and favoritesCount dependencies

  // Handle incoming sport parameter from Top screen
  useEffect(() => {
    if (params.sport && typeof params.sport === "string") {
      console.log(
        "✅ Navigation from Top screen - setting sport:",
        params.sport,
      );
      setActiveSport(params.sport);
      router.setParams({ sport: undefined });
    }
  }, [params.sport]);

  // Handle incoming filter parameter (e.g., from Discover Results shortcut)
  useEffect(() => {
    if (params.filter && typeof params.filter === "string") {
      const normalized = params.filter.toLowerCase();
      const allowedFilters = ["all", "live", "fixture", "finished", "follows"] as const;
      if (
        allowedFilters.includes(normalized as typeof allowedFilters[number]) &&
        normalized !== activeFilter
      ) {
        console.log(
          "✅ Navigation parameter - setting active filter:",
          normalized,
        );
        setActiveFilter(normalized as typeof allowedFilters[number]);
        router.setParams({ filter: undefined });
      }
    }
  }, [params.filter, activeFilter, router]);

  // Goal detection and background refresh service startup
  useEffect(() => {
    console.log("🚨 Ensuring goal detection is active");

    if (!goalDetectionService.isMonitoringActive()) {
      goalDetectionService.startMonitoring();
    }

    // ✅ START BACKGROUND REFRESH SERVICE
    const initializeServices = async () => {
      try {
        console.log("⚡ HOME SCREEN: Starting background refresh service...");

        // Start background refresh service
        const { backgroundRefreshService } = await import(
          "../../services/backgroundRefreshService"
        );
        backgroundRefreshService.startBackgroundRefresh();

        // Initial data preload
        preloadMatchData().catch((error) => {
          console.log("⚠️ Preloading failed but continuing:", error);
        });

        console.log("✅ Background services initialized");
      } catch (error) {
        console.log("⚠️ Service initialization failed:", error);
      }
    };

    initializeServices();

    // Cleanup function
    return () => {
      // Stop background refresh when component unmounts
      const stopServices = async () => {
        try {
          const { backgroundRefreshService } = await import(
            "../../services/backgroundRefreshService"
          );
          backgroundRefreshService.stopBackgroundRefresh();
        } catch (error) {
          console.log("⚠️ Service cleanup failed:", error);
        }
      };
      stopServices();
    };
  }, [activeSport]);

  const handleSportChange = (sport: string) => {
    console.log("🏈 Sport changing from", activeSport, "to", sport);

    if (sport === "important") {
      console.log("⚡ ZERO JUMPING: Navigating to Top Football Matches screen");
      router.push("/(tabs)/top-matches");
      return;
    }

    // ✅ SMOOTH SPORT SWITCHING: Update sport and trigger data refresh
    console.log(`🔄 Switching to ${sport} - refreshing matches`);
    setActiveSport(sport);
    
    // Reset to "all" filter for smooth transition
    setActiveFilter("all");
    
    // Clear current matches to show loading state
    setCurrentMatches([]);
    
    // Trigger refresh to fetch new sport data
    setRefreshKey((prev) => prev + 1);
  };

  // ✅ CRITICAL FIX: Force TODAY'S date when entering finished/fixture filters
  // This ensures users always start on "Today" screen, not "Yesterday"
  useEffect(() => {
    if (activeFilter === "finished" || activeFilter === "fixture") {
      const safeToday = getSafeCurrentDate();
      console.log(
        `🏁 ${activeFilter.toUpperCase()} filter - FORCING TODAY'S DATE: ${safeToday}`,
      );
      console.log(`   Previous selectedDate was: ${selectedDate}`);
      
      // ✅ ALWAYS set to today when entering finished/fixture screens  
      setSelectedDate(safeToday);
      console.log(`   ✅ Selected date NOW SET TO TODAY: ${safeToday}`);
      console.log(`   ✅ USER WILL SEE: "Today" screen`);
    }
  }, [activeFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  // ✅ OPTIMIZED FOLLOWS TAB: Prevent excessive refreshes
  useEffect(() => {
    if (activeFilter === "follows") {
      console.log(
        "⭐ FOLLOWS TAB: Activated - loading favorites without excessive refresh...",
      );

      // Only trigger refresh key change, let the natural data flow handle count
      setRefreshKey((prev) => prev + 1);
    }
  }, [activeFilter]); // Removed refreshFavoritesCount dependency

  // Simplified cross-screen synchronization for favorites
  useEffect(() => {
    const syncListenerCleanup = () => {
      try {
        const { favoritesService } = require("../../services/favoritesService");

        const cleanup = favoritesService.addSyncListener(
          (matchId: string, isFavorite: boolean) => {
            console.log(
              `🔄 HOME SCREEN SYNC: Match ${matchId} favorite: ${isFavorite}`,
            );

            // Only refresh if a match was unfavorited from follows tab
            if (activeFilter === "follows" && !isFavorite) {
              setTimeout(() => {
                setRefreshKey((prev) => prev + 1);
              }, 300); // Longer delay to prevent rapid refreshes
            }
          },
        );

        return cleanup;
      } catch (error) {
        console.error("❌ Error setting up sync listener:", error);
        return () => {};
      }
    };

    const cleanup = syncListenerCleanup();
    return cleanup;
  }, [activeFilter]); // Removed refreshFavoritesCount dependency

  const getSortIndicatorText = () => {
    if (activeFilter === "follows") {
      return favoritesCount > 0
        ? `⭐ Your ${favoritesCount} Favorite Match${favoritesCount === 1 ? "" : "es"}`
        : "⭐ No Favorite Matches Yet";
    }

    if (sortMode === "relevance") {
      return "🏆 Sorted by Relevance";
    } else {
      return "⏰ Sorted by Time";
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      console.log(
        `🔄 HOME SCREEN: Refreshing ${activeFilter} matches for ${activeSport}`,
      );

      // Enhanced refresh with favorites sync
      if (activeFilter === "follows") {
        // For follows screen, just log - let natural sync handle the count
        console.log("📊 Favorites screen refreshed during pull-to-refresh");
      }

      // Force refresh through background service
      const { backgroundRefreshService } = await import(
        "../../services/backgroundRefreshService"
      );
      const freshMatches =
        await backgroundRefreshService.forceRefresh(activeFilter);

      // Update current matches state
      setCurrentMatches(freshMatches);

      // Immediate refresh key trigger
      setRefreshKey((prev) => prev + 1);

      console.log(
        `✅ HOME SCREEN: Refresh completed: ${freshMatches.length} matches`,
      );
    } catch (error) {
      console.error("❌ HOME SCREEN: Refresh error:", error);
    } finally {
      // Immediate refresh completion
      setRefreshing(false);
    }
  }, [activeSport, activeFilter, selectedDate, refreshFavoritesCount]);

  // Determine if DateSelector should be sticky (for Fixture and Finished screens)
  const shouldUseStickyDateSelector =
    activeFilter === "fixture" || activeFilter === "finished";

  // Determine if DateSelector should be shown at all (hide for Follows screen)
  const shouldShowDateSelector =
    activeFilter === "fixture" || activeFilter === "finished" || activeFilter === "all";

  // Create the date selector as a header component for non-sticky screens
  const dateHeaderComponent = useCallback(
    () => (
      <DateSelector
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        activeFilter={activeFilter}
      />
    ),
    [selectedDate, activeFilter],
  );

  return (
    <>
      <StatusBar
        barStyle={
          theme.colors.background === "#FFFFFF"
            ? "dark-content"
            : "light-content"
        }
        backgroundColor={theme.colors.backgroundSecondary}
        translucent
      />
      <FCMTokenManager />
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: theme.colors.backgroundSecondary },
        ]}
        edges={["top", "left", "right"]}
      >
        {/* Sports Tabs */}
        <View
          style={[
            styles.sportsSection,
            { backgroundColor: theme.colors.backgroundSecondary },
          ]}
        >
          <SportsTabs active={activeSport} onSelect={handleSportChange} />
          
          {/* Match Settings Button */}
          <TouchableOpacity
            style={styles.matchSettingsButton}
            onPress={() => router.push("/match-settings")}
            activeOpacity={0.7}
          >
            <Settings
              size={20}
              color={theme.colors.text}
            />
          </TouchableOpacity>
        </View>

        {/* Filter Tabs */}
        <View
          style={[
            styles.filterSection,
            { backgroundColor: theme.colors.backgroundSecondary },
          ]}
        >
          <FilterTabs
            active={activeFilter}
            onSelect={(filter) => setActiveFilter(filter as "all" | "live" | "fixture" | "finished" | "follows")}
            currentSport={activeSport}
            onSortChange={(mode: string) =>
              setSortMode(mode as "time" | "relevance")
            }
            onDisplayModeChange={(mode: string) =>
              setDisplayMode(mode as "score" | "odds")
            }
            favoritesCount={favoritesCount}
            currentSortMode={sortMode}
          />

          <View
            style={[
              styles.sortIndicator,
              { borderBottomColor: theme.colors.border },
            ]}
          >
            <Text
              style={[styles.sortText, { color: theme.colors.textSecondary }]}
            >
              {getSortIndicatorText()}
            </Text>
            <Text
              style={[styles.matchCountText, { color: theme.colors.primary }]}
            >
              {activeFilter === "follows"
                ? `${matchCount} match${matchCount === 1 ? "" : "es"} found`
                : `${matchCount} matches`}
            </Text>
          </View>
        </View>

        {/* Sticky Date Selector for Fixture and Finished screens */}
        {shouldUseStickyDateSelector && (
          <View
            style={[
              styles.stickyDateSelector,
              {
                backgroundColor: theme.colors.background,
                borderBottomColor: theme.colors.border,
              },
            ]}
          >
            <DateSelector
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              activeFilter={activeFilter}
            />
          </View>
        )}

        {/* Match List - optimized for scrolling */}
        <View style={styles.matchListContainer}>
          <MatchList
            sport={activeSport}
            filter={activeFilter}
            sortMode={sortMode}
            displayMode={displayMode}
            selectedDate={selectedDate}
            onFavoritesChange={() => {}} // Empty function to prevent cascading refreshes
            onMatchCountChange={setMatchCount}
            hideSortIndicator={true}
            refreshing={refreshing}
            onRefresh={onRefresh}
            headerComponent={
              shouldUseStickyDateSelector ? undefined : (shouldShowDateSelector ? dateHeaderComponent : undefined)
            }
          />
        </View>

        {/* Small Red Button for Consecutive Stats - Only on All and Live screens */}
        {(activeFilter === "all" || activeFilter === "live") && (
          <ConsecutiveStatsButton />
        )}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sportsSection: {
    height: 60,
    flexDirection: "row", // ✅ Enable horizontal layout for tabs + button
    alignItems: "center",
    paddingRight: 12, // ✅ Padding for settings button
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  matchSettingsButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8, // ✅ Space between tabs and button
  },
  filterSection: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  sortIndicator: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  sortText: {
    fontSize: 12,
    fontFamily: "Inter-Medium",
  },
  matchCountText: {
    fontSize: 12,
    fontFamily: "Inter-SemiBold",
  },
  stickyDateSelector: {
    borderBottomWidth: 1,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    zIndex: 5, // Ensure it stays above the match list
  },
  matchListContainer: {
    flex: 1,
    backgroundColor: "transparent",
  },
});
