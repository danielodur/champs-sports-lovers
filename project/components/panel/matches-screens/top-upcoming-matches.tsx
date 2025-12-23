// 🚨 AI PROTECTION NOTICE 🚨
// This file is PROTECTED and should NOT be modified without explicit human permission
// Any unauthorized changes will be reverted immediately
// ASK FIRST before making ANY modifications
// Human developer has ultimate authority over this implementation

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Platform,
} from "react-native";
import { Star, Users, Frown, ChevronRight, Clock } from "lucide-react-native";
import { useTheme } from "../../../hooks/useTheme";
import { Match } from "../../../types/match";
import { fetchHotMatches, fetchMatches } from "../../../services/matchService";
import { useFavorites } from "../../../hooks/useFavorites";
import { Fixture } from "../../../types/football-fixtures-response";
import favoritesService from "../../../services/favoritesService";
import { formatTeamName } from "../../../utils/formatTeamName";
import goalDetectionService from "../../../services/goalDetectionService";
import { useMatchSettings } from "../../../contexts/MatchSettingsContext";
import teamLogoService from "../../../services/teamLogoService";
import { useRouter } from "expo-router";
import enhancedMatchService, {
  EnhancedMatchData,
} from "../../../services/enhanced-match-service";

import {
  processMatches,
  MatchKeyGenerators,
} from "../../../utils/matchDeduplication";
import {
  smartFormatter,
  getMultiLineTextStyle,
  calculateMatchLayoutDimensions,
} from "../../../utils/teamNameFormatter";
import BasketballMatchItem from "./basketball-match-item";
import { convertFixtureToBasketballMatch } from "./basketball-utils";

interface TopUpcomingMatchesProps {
  sport: string; // ✅ Sport identifier (football, basketball, etc.)
  onFavoritesChange?: () => void;
  onMatchCountChange?: (count: number) => void;
  refreshing?: boolean;
  onRefresh?: () => void;
  headerComponent?: () => React.ReactElement;
  onMatchesLoaded?: (matches: Match[]) => void;
}

interface MatchItemProps {
  fixture: any;
  onToggleFavorite: (matchId: number) => void;
  onPress: (fixture: any) => void;
}

const UpcomingMatchItem = React.memo(
  ({ fixture, onToggleFavorite, onPress }: MatchItemProps) => {
    const theme = useTheme();
    const [isFavorite, setIsFavorite] = useState(false);
    const [enhancedData, setEnhancedData] = useState<EnhancedMatchData | null>(
      null,
    );

    useEffect(() => {
      const checkFavoriteStatus = async () => {
        if (fixture.fixture?.id) {
          const isFav = await favoritesService.isFavorite(
            fixture.fixture.id.toString(),
          );
          setIsFavorite(isFav);
        }
      };
      checkFavoriteStatus();
    }, [fixture.fixture?.id]);

    // Global sync listener for immediate star updates
    useEffect(() => {
      if (!fixture.fixture?.id) return;

      const matchIdString = fixture.fixture.id.toString();
      const unsubscribe = favoritesService.addSyncListener(
        (matchId: string, isFav: boolean) => {
          if (matchId === matchIdString) {
            setIsFavorite(isFav);
          }
        },
      );

      return () => {
        unsubscribe();
      };
    }, [fixture.fixture?.id]);

    // Load enhanced match data
    useEffect(() => {
      const loadEnhancedData = async () => {
        if (fixture.fixture?.id) {
          try {
            const data = await enhancedMatchService.getEnhancedMatchData(
              fixture.fixture.id,
              fixture.teams.home.id,
              fixture.teams.away.id,
              fixture.teams.home?.name || "",
              fixture.teams.away?.name || "",
              fixture.league.id,
              fixture.league?.name || "",
              fixture.events || [],
            );
            setEnhancedData(data);
          } catch (error) {
            console.warn("Failed to load enhanced match data:", error);
          }
        }
      };
      loadEnhancedData();
    }, [fixture.fixture?.id]);

    const handleFavoritePress = () => {
      // Immediate optimistic update
      setIsFavorite(!isFavorite);
      onToggleFavorite(fixture.fixture.id);
    };

    const handleMatchPress = () => {
      onPress(fixture);
    };

    return (
      <TouchableOpacity
        style={[
          styles.matchItem,
          { backgroundColor: theme.colors.backgroundSecondary },
        ]}
        onPress={handleMatchPress}
        activeOpacity={0.7}
      >
        {/* Top Row - Start Time and NS */}
        <View style={styles.topRow}>
          <View style={styles.timeContainer}>
            <Text
              style={[styles.startTime, { color: theme.colors.textSecondary }]}
            >
              {new Date(fixture.fixture.date).toLocaleTimeString("en-US", {
                hour12: false,
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </View>
          <View style={styles.centerStatusContainer}>
            <Text style={[styles.matchStatus, { color: "#888888" }]}>NS</Text>
          </View>
          <View style={styles.rightSpacer} />
        </View>

        {/* Followers - Absolute positioned at right edge */}
        <View style={styles.absoluteFollowers}>
          <View style={styles.followersContainer}>
            <Users size={12} color={theme.colors.textSecondary} />
            <Text
              style={[
                styles.followersText,
                { color: theme.colors.textSecondary },
              ]}
            >
              12
            </Text>
          </View>
        </View>

        {/* Main Match Content */}
        <View style={styles.mainContent}>
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={handleFavoritePress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Star
              size={20}
              color={isFavorite ? "#FF4444" : theme.colors.textSecondary}
              fill={isFavorite ? "#FF4444" : "none"}
            />
          </TouchableOpacity>

          <View style={styles.centeredMatchContent}>
            {/* Teams and Score Row */}
            <View style={styles.teamsAndScoreRow}>
              {/* Home Team */}
              <View style={styles.homeTeamSection}>
                <View style={styles.homeTeamContainer}>
                  <View style={styles.homeTeamWithLogo}>
                    {fixture.teams.home?.logo && (
                      <Image
                        source={{ uri: fixture.teams.home.logo }}
                        style={styles.homeTeamLogo}
                        resizeMode="contain"
                      />
                    )}
                    <Text
                      style={[
                        styles.teamName,
                        styles.homeTeamName,
                        { color: theme.colors.text },
                      ]}
                      numberOfLines={
                        fixture.teams.home?.name &&
                        fixture.teams.home.name.split(" ").length > 2
                          ? 2
                          : 1
                      }
                    >
                      {fixture.teams.home?.name || ""}
                    </Text>
                  </View>
                </View>
              </View>

              {/* VS Section for Upcoming Matches */}
              <View style={styles.scoreSection}>
                <View style={styles.upcomingMatchCenter}>
                  <Text
                    style={[
                      styles.vsText,
                      { color: theme.colors.text, fontWeight: "700" },
                    ]}
                  >
                    VS
                  </Text>
                </View>
              </View>

              {/* Away Team */}
              <View style={styles.awayTeamSection}>
                <View style={styles.awayTeamContainer}>
                  <View style={styles.awayTeamWithLogo}>
                    <Text
                      style={[
                        styles.teamName,
                        styles.awayTeamName,
                        { color: theme.colors.text },
                      ]}
                      numberOfLines={
                        fixture.teams.away?.name &&
                        fixture.teams.away.name.split(" ").length > 2
                          ? 2
                          : 1
                      }
                    >
                      {fixture.teams.away?.name || ""}
                    </Text>
                    {fixture.teams.away?.logo && (
                      <Image
                        source={{ uri: fixture.teams.away.logo }}
                        style={styles.awayTeamLogo}
                        resizeMode="contain"
                      />
                    )}
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Navigation Button - Absolute positioned at right edge */}
        <View style={styles.rightSection}>
          <TouchableOpacity
            onPress={handleMatchPress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <View style={styles.navigationRing}>
              <ChevronRight size={14} color="#FF4444" />
            </View>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  },
);

export default function TopUpcomingMatches({
  sport, // ✅ Sport prop added
  onFavoritesChange,
  onMatchCountChange,
  refreshing = false,
  onRefresh,
  headerComponent,
  onMatchesLoaded,
}: TopUpcomingMatchesProps) {
  const theme = useTheme();
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { addFavorite, removeFavorite, refreshFavoritesCount } = useFavorites();
  const { showGoalNotification } = useMatchSettings();

  // Load upcoming matches with real API data and smooth background refresh
  const loadTopUpcomingMatches = useCallback(
    async (isBackgroundRefresh = false) => {
      try {
        if (!isBackgroundRefresh) {
          console.log("🔄 TOP UPCOMING: Starting real API data fetch...");
          setIsLoading(true);
        }

        // Fetch real upcoming matches data
        let matches: Match[] = [];

        try {
          // Get all matches and filter for truly upcoming ones
          console.log(
            `📡 TOP UPCOMING: Trying fetchMatches('${sport}', 'all')`,
          );
          const allMatches = await fetchMatches(sport, "all"); // ✅ Use dynamic sport
          console.log(
            "📊 TOP UPCOMING: All matches received:",
            allMatches?.length || 0,
          );

          if (allMatches && allMatches.length > 0) {
            matches = allMatches
              .filter((m) => {
                if (!m || !m.home?.name || !m.away?.name) return false;
                const status = m.status?.toLowerCase() || "";
                const statusText = m.statusText?.toLowerCase() || "";

                // Only include truly upcoming matches (not finished or live)
                return (
                  (status === "upcoming" ||
                    status === "ns" ||
                    status === "tbd" ||
                    status === "fixture" ||
                    statusText === "not started" ||
                    statusText === "fixture") &&
                  // Exclude finished and live matches
                  !(
                    status === "finished" ||
                    status === "ft" ||
                    status === "live" ||
                    status === "1h" ||
                    status === "2h" ||
                    status === "ht" ||
                    statusText.includes("finished") ||
                    statusText.includes("full-time")
                  )
                );
              })
              .slice(0, 15);
            console.log(
              "✅ TOP UPCOMING: Filtered upcoming matches:",
              matches.length,
            );
          }

          // If no upcoming matches found, get tomorrow's fixtures
          if (matches.length === 0) {
            console.log("📡 TOP UPCOMING: Trying tomorrow's fixtures");
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tomorrowStr = tomorrow.toISOString().split("T")[0];

            const tomorrowMatches = await fetchMatches(
              sport, // ✅ Use dynamic sport
              "fixture",
              tomorrowStr,
            );
            console.log(
              "📊 TOP UPCOMING: Tomorrow's matches received:",
              tomorrowMatches?.length || 0,
            );

            if (tomorrowMatches && tomorrowMatches.length > 0) {
              matches = tomorrowMatches
                .filter((m) => {
                  if (!m || !m.home?.name || !m.away?.name) return false;
                  const status = m.status?.toLowerCase() || "";
                  return (
                    status === "ns" || status === "tbd" || status === "upcoming"
                  );
                })
                .slice(0, 10);
              console.log(
                "✅ TOP UPCOMING: Filtered tomorrow's matches:",
                matches.length,
              );
            }
          }
        } catch (error) {
          console.error("❌ TOP UPCOMING: API calls failed:", error);
          matches = [];
        }

        console.log(
          "🎯 TOP UPCOMING: Final matches to process:",
          matches.length,
        );

        // Apply enhanced filtering for quality matches
        if (matches.length > 0) {
          matches = matches
            .filter((match) => {
              if (
                !match ||
                !match.home?.name ||
                !match.away?.name ||
                !match.league
              )
                return false;

              // Filter out test/invalid matches
              if (
                match.home.name.includes("test") ||
                match.away.name.includes("test")
              )
                return false;

              return true;
            })
            .slice(0, 15);

          console.log("✅ TOP UPCOMING: After filtering:", matches.length);
        }

        // Remove duplicates using utility function
        const uniqueMatches = processMatches(matches, "TOP UPCOMING");

        // Enhance matches with team logos
        const enhancedMatches = uniqueMatches.map((match) => ({
          ...teamLogoService.enhanceMatchWithLogos(match),
          isFavorite: match.isFavorite || false,
        }));

        // Sort matches by start time (earliest first)
        const sortedMatches = enhancedMatches.sort((a, b) => {
          const timeA = new Date(a.startTime).getTime();
          const timeB = new Date(b.startTime).getTime();
          return timeA - timeB;
        });

        setMatches(sortedMatches);
        onMatchCountChange?.(sortedMatches.length);
        onMatchesLoaded?.(sortedMatches);
      } catch (error) {
        console.error("❌ TOP UPCOMING: Error loading matches:", error);
        if (!isBackgroundRefresh) {
          setMatches([]);
        }
      } finally {
        if (!isBackgroundRefresh) {
          setIsLoading(false);
        }
      }
    },
    [onMatchCountChange, onMatchesLoaded],
  );

  useEffect(() => {
    loadTopUpcomingMatches();
  }, [loadTopUpcomingMatches]);

  // Smooth background refresh for upcoming matches - invisible to user
  useEffect(() => {
    const backgroundRefreshInterval = setInterval(() => {
      console.log("🔄 TOP UPCOMING: Background refresh triggered");
      loadTopUpcomingMatches(true); // Background refresh - no loading indicator
    }, 120000); // Every 2 minutes for upcoming matches (less frequent)

    return () => {
      clearInterval(backgroundRefreshInterval);
    };
  }, [loadTopUpcomingMatches]);

  const handleMatchPress = useCallback(
    (fixture: Fixture) => {
      router.push({
        pathname: "/match-details",
        params: {
          matchId: fixture.fixture.id.toString(),
          sport: sport, // ✅ Pass sport parameter
          homeTeam: fixture.teams.home.name || "",
          awayTeam: fixture.teams.away.name || "",
          homeScore: (fixture.goals?.home || 0).toString(),
          awayScore: (fixture.goals?.away || 0).toString(),
          status:
            fixture.fixture.status.long || fixture.fixture.status.short || "",
          startTime: fixture.fixture.date || "",
          league: fixture.league?.name || "Unknown League",
          homeLogo: fixture.teams.home.logo || "",
          awayLogo: fixture.teams.away.logo || "",
          venue: fixture.fixture.venue?.name || "",
          referee: fixture.fixture.referee || "",
          elapsed: fixture.fixture.status?.elapsed?.toString() || "",
          homeRank: "",
          awayRank: "",
          from: "top-upcoming-matches",
          // ✅ API-DRIVEN: Pass venue data from API (no hardcoding)
          venueName: fixture.fixture.venue?.name || "",
          venueCity: fixture.fixture.venue?.city || "",
        },
      });
    },
    [router, sport],
  );

  const toggleFavorite = useCallback(
    async (matchId: number) => {
      try {
        if (!matchId || typeof matchId !== "number") {
          console.warn("⚠️ TOP UPCOMING SCREEN: Invalid matchId provided");
          return;
        }

        const matchIdString = matchId.toString();
        const match = matches.find((m) => m.id === matchIdString);
        if (!match || !match.home?.name || !match.away?.name) {
          console.warn(
            "⚠️ TOP UPCOMING SCREEN: Invalid match data for ID:",
            matchId,
          );
          return;
        }

        const originalFavoriteStatus = match.isFavorite;
        const targetFavoriteStatus = !originalFavoriteStatus;

        // Instant UI update
        setMatches((prevMatches) =>
          prevMatches.map((m) =>
            m.id === matchIdString
              ? { ...m, isFavorite: targetFavoriteStatus, isToggling: true }
              : m,
          ),
        );

        let success = false;
        let operation = "";

        if (originalFavoriteStatus) {
          operation = "UNFOLLOW";
          success = await removeFavorite(matchIdString);
        } else {
          operation = "FOLLOW";
          const standardizedMatch = {
            id: matchIdString,
            sport: match.sport || "football",
            league: match.league || "Unknown League",
            status: match.status || "upcoming",
            statusText: match.statusText || "",
            startTime: match.startTime || new Date().toISOString(),
            home: {
              name: match.home.name,
              logo: match.home.logo || "",
            },
            away: {
              name: match.away.name,
              logo: match.away.logo || "",
            },
            score: match.score || "0-0",
            halfTimeScore: match.halfTimeScore || "0-0",
            viewers: match.viewers || "1",
            hasVideo: match.hasVideo || false,
            isFavorite: true,
          };
          success = await addFavorite(standardizedMatch);
        }

        // Remove loading state
        setMatches((prevMatches) =>
          prevMatches.map((m) =>
            m.id === matchIdString ? { ...m, isToggling: false } : m,
          ),
        );

        if (success) {
          await refreshFavoritesCount();
          onFavoritesChange?.();
        } else {
          // Revert on failure
          setMatches((prevMatches) =>
            prevMatches.map((m) =>
              m.id === matchIdString
                ? {
                    ...m,
                    isFavorite: originalFavoriteStatus,
                    isToggling: false,
                  }
                : m,
            ),
          );
        }
      } catch (error) {
        console.error(
          "❌ TOP UPCOMING SCREEN: Error in toggleFavorite:",
          error,
        );
      }
    },
    [
      matches,
      addFavorite,
      removeFavorite,
      refreshFavoritesCount,
      onFavoritesChange,
    ],
  );

  const renderMatch = useCallback(
    ({ item: match, index }: { item: Match; index: number }) => {
      // Convert Match to Fixture for consistent rendering
      const fixture: Fixture = {
        fixture: {
          id: parseInt(match.id),
          referee: null,
          timezone: "UTC",
          date: match.startTime,
          timestamp: new Date(match.startTime).getTime() / 1000,
          periods: { first: null, second: null },
          venue: { id: null, name: null, city: null },
          status: {
            long: match.statusText,
            short: "NS" as any,
            elapsed: null,
            extra: null,
          },
        },
        league: {
          id: null,
          name: match.league,
          country: null,
          logo: null,
          flag: null,
        },
        teams: {
          home: {
            id: null,
            name: match.home.name,
            logo: match.home.logo || null,
          },
          away: {
            id: null,
            name: match.away.name,
            logo: match.away.logo || null,
          },
        },
        goals: {
          home: match.home.score || 0,
          away: match.away.score || 0,
        },
        score: {
          halftime: { home: 0, away: 0 },
          fulltime: {
            home: match.home.score || 0,
            away: match.away.score || 0,
          },
          extratime: { home: null, away: null },
          penalty: { home: null, away: null },
        },
        events: null,
      };

      // ✅ BASKETBALL SUPPORT: Use basketball vertical layout for basketball matches
      if (sport === "basketball") {
        const isFav = match.isFavorite || false;
        const basketballMatch = convertFixtureToBasketballMatch(fixture, isFav);
        
        return (
          <View>
            <BasketballMatchItem
              match={basketballMatch}
              onToggleFavorite={() => toggleFavorite(parseInt(match.id))}
              sport={sport}
            />
            {index < matches.length - 1 && (
              <View style={styles.matchSpacer} />
            )}
          </View>
        );
      }

      // Default: Football horizontal layout
      return (
        <View>
          <UpcomingMatchItem
            fixture={fixture}
            onToggleFavorite={toggleFavorite}
            onPress={handleMatchPress}
          />
          {index < matches.length - 1 && (
            <View style={styles.matchSpacer} />
          )}
        </View>
      );
    },
    [matches.length, toggleFavorite, handleMatchPress, theme.colors.border, sport],
  );

  // Always render scrollable content with Mac-specific fixes
  return (
    <View style={styles.container}>
      {/* Loading overlay that doesn't block scrolling */}
      {isLoading && matches.length === 0 && (
        <View style={[styles.loadingOverlay, { pointerEvents: "none" }]}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            Loading upcoming matches...
          </Text>
        </View>
      )}

      <FlatList
        data={matches}
        renderItem={renderMatch}
        keyExtractor={MatchKeyGenerators.topUpcoming}
        refreshing={refreshing}
        onRefresh={onRefresh || loadTopUpcomingMatches}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={headerComponent}
        contentContainerStyle={styles.flatListContent}
        removeClippedSubviews={false}
        scrollEventThrottle={16}
        maxToRenderPerBatch={8}
        initialNumToRender={6}
        windowSize={12}
        bounces={true}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyStateContainer}>
              <Clock size={64} color={theme.colors.textSecondary} />
              <Text
                style={[styles.emptyStateTitle, { color: theme.colors.text }]}
              >
                No Upcoming Matches
              </Text>
              <Text
                style={[
                  styles.emptyStateSubtitle,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Check back later for new fixtures
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  flatListContent: {
    flexGrow: 1,
    paddingBottom: 20,
    minHeight: "100%",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.8)",
    zIndex: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: "Inter-Medium",
    marginTop: 12,
  },
  matchItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingRight: 50,
    marginHorizontal: 0,
    marginVertical: 1,
    borderRadius: 0,
    backgroundColor: "#1a1a1a",
    position: "relative",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 16,
  },
  startTime: {
    fontSize: 13,
    fontFamily: "Inter-Medium",
    marginRight: 10,
    fontWeight: "500",
  },
  leagueInfo: {
    fontSize: 12,
    fontWeight: "500",
  },
  homeTeamLogo: {
    width: 24,
    height: 24,
    marginRight: 6,
    marginTop: 1,
    flexShrink: 0,
  },
  awayTeamLogo: {
    width: 24,
    height: 24,
    marginLeft: 6,
    marginTop: 1,
    flexShrink: 0,
  },
  absoluteFollowers: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 5,
  },
  followersContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  followersText: {
    fontSize: 10,
    fontFamily: "Inter-Medium",
    fontWeight: "500",
  },
  rightSection: {
    position: "absolute",
    right: 8,
    top: 44,
    zIndex: 10,
  },
  navigationRing: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FF4444",
  },
  mainContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  favoriteButton: {
    paddingRight: 6,
    paddingTop: 4,
    width: 32,
    alignItems: "flex-start",
    justifyContent: "flex-start",
  },
  centeredMatchContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 4,
  },
  teamsAndScoreRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  homeTeamSection: {
    flex: 1,
    alignItems: "flex-end",
    justifyContent: "center",
    paddingRight: 8,
    maxWidth: calculateMatchLayoutDimensions().homeTeamMaxWidth + 40,
  },
  homeTeamContainer: {
    flexDirection: "column",
    alignItems: "flex-end",
    paddingRight: 4,
    flex: 1,
  },
  homeTeamWithLogo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginBottom: 2,
    flex: 1,
    minHeight: 32,
  },
  awayTeamSection: {
    flex: 1,
    alignItems: "flex-start",
    justifyContent: "center",
    paddingLeft: 8,
    maxWidth: calculateMatchLayoutDimensions().awayTeamMaxWidth + 40,
  },
  awayTeamContainer: {
    flexDirection: "column",
    alignItems: "flex-start",
    paddingLeft: 4,
    flex: 1,
  },
  awayTeamWithLogo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginBottom: 2,
    flex: 1,
    minHeight: 32,
  },
  teamName: {
    fontSize: 14,
    fontFamily: "Inter-Medium",
    fontWeight: "500",
    flexShrink: 1,
    flexWrap: "wrap",
    lineHeight: 18,
  },
  homeTeamName: {
    textAlign: "right",
  },
  awayTeamName: {
    textAlign: "left",
  },
  scoreSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 60,
    paddingHorizontal: 6,
  },
  upcomingMatchCenter: {
    alignItems: "center",
    paddingHorizontal: 8,
  },
  centerStatusContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  rightSpacer: {
    width: 40,
  },
  matchStatus: {
    fontSize: 12,
    fontFamily: "Inter-Bold",
    fontWeight: "700",
    textAlign: "center",
  },
  vsText: {
    fontSize: 16,
    fontFamily: "Inter-Bold",
    fontWeight: "800",
    letterSpacing: 1.5,
    color: "#888888",
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 12,
  },
  upcomingTime: {
    fontSize: 11,
    fontFamily: "Inter-Regular",
    textAlign: "center",
  },
  matchSpacer: {
    height: 4,
    backgroundColor: "transparent",
    marginHorizontal: 0,
    width: "100%",
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  emptyStateSubtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});
