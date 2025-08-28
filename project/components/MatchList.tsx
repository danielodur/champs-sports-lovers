import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ListRenderItem,
  Image,
  ActivityIndicator,
} from "react-native";
import MatchItem from "./MatchItem";
import { useTheme } from "@/hooks/useTheme";
import { useFavorites } from "@/hooks/useFavorites";
import { Match } from "@/types/match";
import { fetchMatches, subscribeToMatchUpdates } from "@/services/matchService";
import { usePathname, useRouter } from "expo-router";
import goalDetectionService from "@/services/goalDetectionService";
import { favoritesService } from "@/services/favoritesService";
import {
  Fixture,
  FixtureEvent,
  FootballFixturesResponse,
} from "@/types/football-fixtures-response";
import ApiSportsService from "@/services/api-sports-service";
import footballFavoritesService from "@/services/football-favorites-service";
import goalService from "@/services/api-sports-football-goal-service";

interface MatchListProps {
  sport: string;
  filter: string;
  sortMode?: string;
  displayMode?: string;
  selectedDate?: string;
  onFavoritesChange?: () => void;
  onMatchCountChange?: (count: number) => void;
  hideSortIndicator?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  headerComponent?: () => React.ReactElement;
  onMatchesLoaded?: (matches: Match[]) => void;
}

const apiSportsService = new ApiSportsService({
  apiKey: process.env.EXPO_PUBLIC_API_SPORTS_KEY!,
});

// TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
//   try {
//     console.log("⏳ Background fetch running...");
//     await apiSportsService.fetchLiveFixturesAndCheckForNewGoals();
//     await apiSportsService.testNotification();
//     return BackgroundFetch.BackgroundFetchResult.NewData;
//   } catch (error) {
//     console.error("Background fetch failed:", error);
//     return BackgroundFetch.BackgroundFetchResult.Failed;
//   }
// });

// const apiSportsService = new ApiSportsService({
//   apiKey: process.env.EXPO_PUBLIC_API_SPORTS_KEY!,
// });

// TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
//   try {
//     console.log("⏳ Background fetch running...");
//     await apiSportsService.fetchLiveFixturesAndCheckForNewGoals();
//     return BackgroundFetch.BackgroundFetchResult.NewData;
//   } catch (error) {
//     console.error("Background fetch failed:", error);
//     return BackgroundFetch.BackgroundFetchResult.Failed;
//   }
// });

// Group matches by competition/league name
const groupByCompetition = (
  matches: Fixture[]
): { competition: string; fixtures: Fixture[] }[] => {
  const groups: { [competition: string]: Fixture[] } = {};

  matches.forEach((match) => {
    // Use the league name directly from the API data
    let competitionName =
      `${match.league?.country} ${match.league?.name}` || "Other Competition";

    // Clean up the competition name - capitalize first letter of each word
    competitionName = competitionName
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");

    // Ensure we have a valid competition name
    if (!competitionName || competitionName.trim() === "") {
      competitionName = "Other Competition";
    }

    if (!groups[competitionName]) {
      groups[competitionName] = [];
    }
    groups[competitionName].push(match);
  });

  return Object.entries(groups).map(([competition, fixtures]) => ({
    competition,
    fixtures,
  }));
};

export default function MatchList({
  sport,
  filter,
  sortMode = "time",
  displayMode = "score",
  selectedDate,
  onFavoritesChange,
  onMatchCountChange,
  hideSortIndicator = false,
  refreshing = false,
  onRefresh,
  headerComponent,
  onMatchesLoaded,
}: MatchListProps) {
  const theme = useTheme();
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [internalRefreshing, setInternalRefreshing] = useState(false);
  const [isPullRefreshing, setIsPullRefreshing] = useState(false);
  const { refreshFavoritesCount, addFavorite, removeFavorite } = useFavorites();
  const pathname = usePathname();
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);

  // Register background fetch task to call apiSportsService.fetchLiveFixturesAndCheckForNewGoals every 60 seconds
  // useEffect(() => {
  //   const registerTask = async () => {
  //     const isRegistered = await TaskManager.isTaskRegisteredAsync(
  //       BACKGROUND_FETCH_TASK
  //     );

  //     if (!isRegistered) {
  //       await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
  //         minimumInterval: 60, // run every ~60 seconds (OS may delay)
  //         stopOnTerminate: false, // keep running after app is closed (Android)
  //         startOnBoot: true, // run after device restart (Android)
  //       });
  //       console.log("✅ Background fetch task registered");
  //     }
  //   };

  //   registerTask();
  // }, []);

  const selectedFilter = useCallback(() => {
    let params: {
      teamId: number | undefined;
      leagueId: number | undefined;
      season: number | undefined;
      date: string | undefined;
      status: string | undefined;
      live: string | undefined;
    } = {
      teamId: undefined,
      leagueId: undefined,
      season: undefined,
      date: undefined,
      status: undefined,
      live: undefined,
    };
    if (filter === "all") {
      params = {
        teamId: undefined,
        leagueId: undefined,
        season: undefined,
        date: selectedDate,
        status: undefined,
        live: undefined,
      };
    }
    if (filter === "live") {
      params = {
        teamId: undefined,
        leagueId: undefined,
        season: undefined,
        date: undefined,
        status: undefined,
        live: "all",
      };
    }
    if (filter === "fixture") {
      params = {
        teamId: undefined,
        leagueId: undefined,
        season: undefined,
        date: selectedDate,
        status: "NS",
        live: undefined,
      };
    }
    if (filter === "finished") {
      params = {
        teamId: undefined,
        leagueId: undefined,
        season: undefined,
        date: selectedDate,
        status: "FT",
        live: undefined,
      };
    }
    if (filter === "follows") {
      params = {
        teamId: undefined,
        leagueId: undefined,
        season: undefined,
        date: selectedDate,
        status: undefined,
        live: undefined,
      };
    }
    return params;
  }, [filter, selectedDate]);

  // const fetchFixtures = useCallback(async () => {
  //   try {
  //     const response = await apiSportsService.getFixtures(
  //       selectedFilter().teamId,
  //       selectedFilter().leagueId,
  //       selectedFilter().season,
  //       selectedFilter().date,
  //       selectedFilter().status,
  //       selectedFilter().live
  //     );

  //     const fixtures = response.response;

  //     if (onMatchCountChange) {
  //       onMatchCountChange(fixtures.length);
  //     }

  //     return BackgroundFetch.BackgroundFetchResult.NewData;
  //   } catch (error) {
  //     return BackgroundFetch.BackgroundFetchResult.Failed;
  //   }
  // }, [
  //   selectedFilter,
  //   apiSportsService.getFixtures,
  //   selectedDate,
  //   onMatchCountChange,
  // ]);

  // useEffect(() => {
  //   const registerTask = async () => {
  //     const status = await BackgroundFetch.getStatusAsync();
  //     if (
  //       status === BackgroundFetch.BackgroundFetchStatus.Restricted ||
  //       status === BackgroundFetch.BackgroundFetchStatus.Denied
  //     ) {
  //       console.log("Background fetch not available");
  //       return;
  //     }

  //     await BackgroundFetch.registerTaskAsync(BACKGROUND_TASK, {
  //       minimumInterval: 60, // seconds (system may throttle)
  //       stopOnTerminate: false, // keep running after app close (Android)
  //       startOnBoot: true, // auto start on device boot (Android)
  //     });
  //   };
  //   registerTask();
  // }, [fetchFixtures]);

  // TaskManager.defineTask(BACKGROUND_TASK, async () => {
  //   try {
  //     const response = await apiSportsService.getFixtures(/* your filters */);

  //     setFixtures(response.response);

  //     if (onMatchCountChange) {
  //       onMatchCountChange(response.response.length);
  //     }

  //     // send notification
  //     await goalService.sendGoalNotification({
  //       fixtureId: 1,
  //       event: {
  //         time: { elapsed: 10, extra: 0 },
  //         player: { id: 1, name: "John Doe" },
  //       },
  //       team: {
  //         id: 1,
  //         name: "Chelsea",
  //         logo: "https://via.placeholder.com/150",
  //       },
  //       assist: { id: 1, name: "John Doe" },
  //       type: "goal",
  //       detail: "goal",
  //       comments: "goal",
  //     });

  //     return BackgroundFetch.Result.NewData;
  //   } catch (error) {
  //     return BackgroundFetch.Result.Failed;
  //   }
  // });

  useEffect(() => {
    const fetchFixtures = async () => {
      if (filter === "follows") {
        const favoriteMatches =
          await footballFavoritesService.getFavoriteMatches();
        const fixtures = favoriteMatches?.map((match) => match.fixture);
        fixtures?.forEach(async (fixture) => {
          if (
            fixture.fixture.status.short !== "FT" &&
            fixture.fixture.status.short !== "AET" &&
            fixture.fixture.status.short !== "PEN" &&
            fixture.fixture.status.short !== "NS"
          ) {
            await goalService.addGoalData({
              fixtureId: fixture.fixture.id,
              events: fixture.events as FixtureEvent[],
            });
          } else if (
            fixture.fixture.status.short === "FT" ||
            fixture.fixture.status.short === "AET" ||
            fixture.fixture.status.short === "PEN"
          ) {
            await goalService.removeGoalData(fixture.fixture.id);
          }
        });

        // compare latest events from each fixture and check if there is a new goal
        fixtures?.forEach(async (fixture) => {
          if (
            fixture.fixture.status.short !== "FT" &&
            fixture.fixture.status.short !== "AET" &&
            fixture.fixture.status.short !== "PEN" &&
            fixture.fixture.status.short !== "NS"
          ) {
            const result = await goalService.compareLatestEvents(
              fixture.fixture.id,
              fixture.events as FixtureEvent[]
            );
            if (result === "goal_scored") {
              fixture.goalStatus = "goal_scored";
            } else if (result === "goal_cancelled") {
              fixture.goalStatus = "goal_cancelled";
            }
          }
        });

        setFixtures(fixtures as Fixture[]);

        if (onMatchCountChange) {
          onMatchCountChange(fixtures?.length || 0);
        }
        return;
      }
      const response = await apiSportsService.getFixtures(
        selectedFilter().teamId,
        selectedFilter().leagueId,
        selectedFilter().season,
        selectedFilter().date,
        selectedFilter().status,
        selectedFilter().live
      );
      const fixtures = response.response;

      fixtures?.forEach(async (fixture) => {
        if (
          fixture.fixture.status.short !== "FT" &&
          fixture.fixture.status.short !== "AET" &&
          fixture.fixture.status.short !== "PEN" &&
          fixture.fixture.status.short !== "NS"
        ) {
          await goalService.addGoalData({
            fixtureId: fixture.fixture.id,
            events: fixture.events as FixtureEvent[],
          });
        } else if (
          fixture.fixture.status.short === "FT" ||
          fixture.fixture.status.short === "AET" ||
          fixture.fixture.status.short === "PEN"
        ) {
          await goalService.removeGoalData(fixture.fixture.id);
        }
      });

      // compare latest events from each fixture and check if there is a new goal
      fixtures?.forEach(async (fixture) => {
        if (
          fixture.fixture.status.short !== "FT" &&
          fixture.fixture.status.short !== "AET" &&
          fixture.fixture.status.short !== "PEN" &&
          fixture.fixture.status.short !== "NS"
        ) {
          const result = await goalService.compareLatestEvents(
            fixture.fixture.id,
            fixture.events as FixtureEvent[]
          );
          if (result === "goal_scored") {
            fixture.goalStatus = "goal_scored";
          } else if (result === "goal_cancelled") {
            fixture.goalStatus = "goal_cancelled";
          }
        }
      });
      setFixtures(fixtures as Fixture[]);

      if (onMatchCountChange) {
        onMatchCountChange(response.response.length);
      }
      setError(null);
    };
    fetchFixtures();
    const interval = setInterval(async () => {
      if (filter !== "all" && filter !== "fixture" && filter !== "finished") {
        console.log("Fetching fixtures every 60 seconds");
        await fetchFixtures();
        console.log("Fetched fixtures every 60 seconds");
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [
    selectedFilter,
    selectedDate,
    onMatchCountChange,
    apiSportsService.getFixtures,
    goalService.compareLatestEvents,
    goalService.addGoalData,
    goalService.removeGoalData,
  ]);

  // const getLeaguePriority = useCallback((league: FixtureLeague) => {
  //   if (league.name === "Premier League") return 1;
  //   if (league.name === "Championship") return 2;
  //   if (league.name === "League One") return 3;
  //   if (league.name === "League Two") return 4;
  //   return 5;
  // }, []);

  // // Simplified and optimized sorting function
  // const sortMatches = useCallback(
  //   (matches: Match[]): Match[] => {
  //     if (matches.length === 0) return matches;

  //     const sortedMatches = [...matches];

  //     return sortedMatches.sort((a, b) => {
  //       // ✅ FIXED: Use consistent startTime field for all comparisons
  //       const timeA = new Date(a.startTime).getTime();
  //       const timeB = new Date(b.startTime).getTime();

  //       // Check for invalid dates
  //       if (isNaN(timeA) || isNaN(timeB)) {
  //         return isNaN(timeA) ? 1 : -1;
  //       }

  //       // Enhanced live match detection
  //       const aIsLive = a.status === "live";
  //       const bIsLive = b.status === "live";

  //       if (sortMode === "league") {
  //         // Sort by League: Higher priority leagues first, then by status, then by time
  //         const leaguePriorityA = getLeaguePriority(a.league);
  //         const leaguePriorityB = getLeaguePriority(b.league);

  //         if (leaguePriorityA !== leaguePriorityB) {
  //           return leaguePriorityA - leaguePriorityB;
  //         }

  //         // Within same league priority, live matches first
  //         if (aIsLive && !bIsLive) return -1;
  //         if (bIsLive && !aIsLive) return 1;

  //         // Then sort by time
  //         return timeA - timeB;
  //       }

  //       // ✅ ENHANCED TIME SORTING: Proper chronological organization
  //       // 1. Live matches always first (most important)
  //       if (aIsLive && !bIsLive) return -1;
  //       if (bIsLive && !aIsLive) return 1;

  //       // 2. For LIVE matches, sort by match minute (latest action first)
  //       if (aIsLive && bIsLive) {
  //         const getMinute = (statusText: string): number => {
  //           const match = statusText?.match(/(\d+)/);
  //           return match ? parseInt(match[1]) : 0;
  //         };

  //         const minuteA = getMinute(a.statusText || "");
  //         const minuteB = getMinute(b.statusText || "");

  //         // Higher minute = later in match = more priority
  //         if (minuteA !== minuteB) {
  //           return minuteB - minuteA;
  //         }

  //         // If same minute, sort by start time
  //         return timeA - timeB;
  //       }

  //       // 3. For finished matches, sort by recency (most recently finished first)
  //       if (a.status === "finished" && b.status === "finished") {
  //         return timeB - timeA; // More recent matches first
  //       }

  //       // 4. For upcoming matches, sort by start time (earliest first)
  //       if (a.status === "upcoming" && b.status === "upcoming") {
  //         return timeA - timeB; // Earlier matches first
  //       }

  //       // 5. Mixed status sorting: upcoming -> live -> finished
  //       const statusPriority = { upcoming: 1, live: 2, finished: 3 };
  //       const priorityA = statusPriority[a.status] || 4;
  //       const priorityB = statusPriority[b.status] || 4;

  //       if (priorityA !== priorityB) {
  //         return priorityA - priorityB;
  //       }

  //       // 6. Final fallback: sort by start time
  //       return timeA - timeB;
  //     });
  //   },
  //   [sortMode]
  // );

  // ✅ INSTANT LOADING: Enhanced loadMatches with immediate cache check
  // const loadMatches = useCallback(async () => {
  //   try {
  //     setError(null);

  //     // ✅ PERFORMANCE: Start loading data immediately, don't wait
  //     const startTime = Date.now();

  //     const data = await apiSportsService.getFixtures(
  //       undefined,
  //       undefined,
  //       undefined,
  //       selectedDate,
  //       undefined,
  //       undefined
  //     );

  //     const loadTime = Date.now() - startTime;

  //     // ✅ INSTANT UI UPDATE: Apply data immediately
  //     const enhancedData = data.response.map((fixture) => ({
  //       ...fixture,
  //       isFavorite: fixture.isFavorite || false,
  //     }));

  //     // ✅ IMMEDIATE STATE UPDATE: No delays
  //     setFixtures(enhancedData);

  //     if (onMatchCountChange) {
  //       onMatchCountChange(enhancedData.length);
  //     }

  //     // goalDetectionService.updateMatches(enhancedData as unknown as Fixture[]);
  //   } catch (err) {
  //     setError("Unable to load data. Please check your connection.");
  //   }
  // }, [selectedDate, onMatchCountChange]);

  // // Handle refresh from parent or internal
  // const handleRefresh = useCallback(async () => {
  //   setInternalRefreshing(true);
  //   try {
  //     // ALWAYS reload local matches to ensure state is maintained
  //     await loadMatches();

  //     // Also call parent refresh if provided (for additional side effects)
  //     if (onRefresh) {
  //       onRefresh();
  //     }
  //   } catch (error) {
  //   } finally {
  //     setInternalRefreshing(false);
  //   }
  // }, [loadMatches, onRefresh]);

  // useEffect(() => {
  //   loadMatches();

  //   // Subscribe to match updates for real-time favorites updates
  //   const unsubscribe = subscribeToMatchUpdates((updatedMatches) => {
  //     // Only update if we have matches and they're for the current filter/sport
  //     if (updatedMatches.length > 0) {
  //       setMatches(updatedMatches);
  //       if (onMatchCountChange) {
  //         onMatchCountChange(updatedMatches.length);
  //       }
  //     } else {
  //     }
  //   });

  //   return () => {
  //     unsubscribe();
  //   };
  // }, [sport, filter, selectedDate]);

  // Re-sort when sortMode changes
  // useEffect(() => {
  //   if (matches.length > 0) {
  //     setMatches((prev) => sortMatches(prev));
  //   }
  // }, [sortMode, sortMatches]);

  // ✅ FIXED: Notify parent component of matches for betting stats
  // useEffect(() => {
  //   if (onMatchesLoaded && matches.length > 0) {
  //     onMatchesLoaded(matches);
  //   }
  // }, [matches, onMatchesLoaded]);

  const toggleFavorite = useCallback(
    async (matchId: number) => {
      try {
        // ✅ ENHANCED VALIDATION: Check for valid match ID and match object
        if (!matchId) {
          return;
        }

        let fixture = fixtures.find((m) => m.fixture.id === matchId);

        if (!fixture) {
          return;
        }

        // ✅ SAFETY CHECK: Ensure match has required properties
        if (!fixture.teams?.home?.name || !fixture.teams?.away?.name) {
          return;
        }

        // ✅ MINIMAL DEBOUNCING: Only prevent double-taps within 100ms (instead of 500ms)
        const now = Date.now();
        const lastToggleTime = (fixture as any).lastToggleTime || 0;
        if (now - lastToggleTime < 100) {
          return;
        }

        // Store the original state for potential rollback
        const originalFavoriteStatus = fixture.isFavorite;
        const targetFavoriteStatus = !originalFavoriteStatus;

        // Update last toggle time to prevent rapid taps
        setFixtures((prev) =>
          prev.map((m) =>
            m.fixture.id === matchId
              ? { ...m, isFavorite: targetFavoriteStatus }
              : m
          )
        );

        // ✅ IMMEDIATE UI UPDATE for instant visual feedback
        setFixtures((prev) =>
          prev.map((m) =>
            m.fixture.id === matchId
              ? { ...m, isFavorite: targetFavoriteStatus }
              : m
          )
        );

        // ✅ CRITICAL FIX: Perform the actual backend operation based on ORIGINAL state
        let success = false;
        let operation = "";

        if (originalFavoriteStatus) {
          // Was favorited, so remove it
          operation = "REMOVE";

          success = await removeFavorite(matchId.toString());
        } else {
          // Was not favorited, so add it
          operation = "ADD";

          success = await addFavorite(fixture.fixture.id.toString());
        }

        if (success) {
          // ✅ CRITICAL: Special handling for follows screen
          if (filter === "follows" && originalFavoriteStatus) {
            const newFixtures = fixtures.filter(
              (m) => m.fixture.id !== matchId
            );
            setFixtures(newFixtures);
            // Update the match count to reflect the new list size
            onMatchCountChange?.(newFixtures.length);
          }

          // ✅ ENHANCED: If this was an ADD operation, refresh follows screen
          if (!originalFavoriteStatus && filter !== "follows") {
          }

          // ✅ ENHANCED: Force refresh of favorites count for button synchronization
          if (onFavoritesChange) {
            onFavoritesChange();
          }
        } else {
          // ✅ REVERT UI change if operation failed
          setFixtures((prev) =>
            prev.map((m) =>
              m.fixture.id === matchId
                ? { ...m, isFavorite: originalFavoriteStatus }
                : m
            )
          );

          // ✅ FORCE REFRESH: Try to refresh favorites count even on failure
          if (onFavoritesChange) {
            onFavoritesChange();
          }
        }
      } catch (error) {
        // ✅ REVERT to original state on any error
        const fixture = fixtures.find((m) => m.fixture.id === matchId);
        if (fixture) {
          setFixtures((prev) =>
            prev.map((m) =>
              m.fixture.id === matchId ? { ...m, isFavorite: !m.isFavorite } : m
            )
          );
        }
      }
    },
    [
      fixtures,
      addFavorite,
      removeFavorite,
      onFavoritesChange,
      onMatchCountChange,
      filter,
    ]
  );

  const handleMatchPress = useCallback(
    (fixture: Fixture) => {
      router.push({
        pathname: "/match-details",
        params: {
          fixtureId: fixture.fixture.id,
        },
      });
    },
    [router]
  );

  const renderMatchItem = useCallback(
    ({ item }: { item: Fixture }) => (
      <MatchItem
        fixture={item}
        onToggleFavorite={toggleFavorite}
        onPress={handleMatchPress}
      />
    ),
    [toggleFavorite, handleMatchPress]
  );

  const renderCompetitionHeader = useCallback(
    ({ item }: { item: { competition: string; fixtures: Fixture[] } }) => (
      <View
        style={[
          styles.competitionHeader,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <View style={styles.competitionHeaderTextContainer}>
          <Image
            source={{ uri: item.fixtures[0].league.logo || "" }}
            style={styles.competitionHeaderLogo}
          />
          <Text
            style={[styles.competitionHeaderText, { color: theme.colors.text }]}
          >
            {item.competition}
          </Text>
        </View>
      </View>
    ),
    [theme]
  );

  const renderCompetitionSection: ListRenderItem<{
    competition: string;
    fixtures: Fixture[];
  }> = useCallback(
    ({ item }) => (
      <View style={styles.competitionSection}>
        {/* {renderCompetitionHeader({ item })} */}
        {item.fixtures.map((fixture, index) => (
          <View key={`${fixture.fixture.id}-${index}`}>
            {renderMatchItem({ item: fixture })}
          </View>
        ))}
      </View>
    ),
    [renderCompetitionHeader, renderMatchItem]
  );

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={[styles.errorText, { color: theme.colors.error }]}>
          {" "}
          {error}{" "}
        </Text>
      </View>
    );
  }

  if (fixtures.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
          {" "}
          No matches available{" "}
        </Text>
      </View>
    );
  }

  // Group matches by competition/league
  const competitionGroups = groupByCompetition(fixtures);

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={competitionGroups}
        renderItem={renderCompetitionSection}
        keyExtractor={(item) => item.competition}
        refreshing={refreshing || internalRefreshing}
        // onRefresh={handleRefresh}
        ListHeaderComponent={headerComponent}
        showsVerticalScrollIndicator={true}
        removeClippedSubviews={true}
        maxToRenderPerBatch={5}
        updateCellsBatchingPeriod={100}
        initialNumToRender={3}
        windowSize={5}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    fontFamily: "Inter-Medium",
  },
  errorText: {
    fontSize: 16,
    fontFamily: "Inter-Medium",
    textAlign: "center",
  },
  emptyText: {
    fontSize: 16,
    fontFamily: "Inter-Medium",
    textAlign: "center",
  },
  competitionHeader: {
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  competitionHeaderText: {
    fontSize: 14,
    fontFamily: "Inter-SemiBold",
  },
  competitionSection: {
    // marginBottom: 10,
  },
  competitionHeaderTextContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  competitionHeaderLogo: {
    width: 24,
    height: 24,
  },
});
function useQuery(arg0: {
  queryKey: string[];
  queryFn: () => Promise<FootballFixturesResponse>;
}) {
  throw new Error("Function not implemented.");
}
