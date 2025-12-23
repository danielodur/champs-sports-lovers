import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { Star, Users, Flag, XCircle } from "lucide-react-native";
import { useTheme } from "@/hooks/useTheme";
import { useFavorites } from "@/hooks/useFavorites";
import { useBackgroundRefresh } from "@/hooks/useBackgroundRefresh";
import { useMatchSettings } from "@/contexts/MatchSettingsContext";
import { Match } from "@/types/match";
import { usePathname, useRouter } from "expo-router";
import goalDetectionService from "@/services/goalDetectionService";
import {
  Fixture,
  FixtureEvent,
  FootballFixturesResponse,
} from "@/types/football-fixtures-response";
import favoritesService from "@/services/favoritesService";
import { formatTeamName } from "@/utils/formatTeamName";
import { playGoalSound } from "@/utils/SoundManager";
import { getLocalDateForApi } from "@/utils/timeUtils";
import enhancedMatchService, {
  EnhancedMatchData,
} from "@/services/enhanced-match-service";
import TeamRanking from "@/components/team-rankings";
import MatchCards from "@/components/match-cards";
import BroadcastIcons from "@/components/BroadcastIcons";
import { getBroadcastInfo } from "@/utils/broadcastUtils";
import {
  smartFormatter,
  getMultiLineTextStyle,
  calculateMatchLayoutDimensions,
} from "../../../utils/teamNameFormatter";
import LeagueLogo from "../../LeagueLogo";
// ✅ REMOVED: smartLeagueNameService - Using 100% API-driven league names
import BasketballMatchItem from "./basketball-match-item";
import { convertFixtureToBasketballMatch } from "./basketball-utils";
import MatchExtraTime, {
  isMatchInExtraTime,
} from "./extra-time/match-extra-time";

// ===== INTERFACES =====
interface AllMatchesProps {
  sport: string; // ✅ Sport identifier (football, basketball, etc.)
  selectedDate?: string;
  onFavoritesChange?: () => void;
  onMatchCountChange?: (count: number) => void;
  refreshing?: boolean;
  onRefresh?: () => void;
  headerComponent?: () => React.ReactElement;
  onMatchesLoaded?: (matches: Match[]) => void;
}

interface MatchItemProps {
  fixture: Fixture;
  onToggleFavorite: (matchId: number) => void;
  onPress: (match: Fixture) => void;
  matchType: "live" | "fixture" | "finished" | "cancelled";
  sport: string; // ✅ Sport identifier (football, basketball, etc.)
}

interface GroupedMatch {
  statusType: "live" | "fixture" | "finished" | "cancelled";
  competition: string;
  fixtures: Fixture[];
  statusLabel: string;
}

// ===== SERVICES INITIALIZATION =====
// ✅ BACKEND API: All API calls go through Supabase Edge Functions
// API keys stored securely in backend, not exposed in frontend
// Backend automatically handles fallback: API-Football → TheSportsDB → RapidAPI → Football-Data.org
import { backendApiService } from "../../../services/backendApiService";

// ===== UTILITY FUNCTIONS =====
const groupMatchesByStatus = (fixtures: Fixture[], sport: string): GroupedMatch[] => {
  // First, ensure no duplicates at the input level
  const uniqueFixtures = new Map<number, Fixture>();
  fixtures.forEach((fixture) => {
    if (fixture.fixture?.id && !uniqueFixtures.has(fixture.fixture.id)) {
      uniqueFixtures.set(fixture.fixture.id, fixture);
    }
  });
  const deduplicatedFixtures = Array.from(uniqueFixtures.values());

  // Categorize matches with improved filtering - use mutually exclusive conditions
  const processedIds = new Set<number>();

  const liveFixtures = deduplicatedFixtures.filter((fixture) => {
    // ✅ CRITICAL SPORT FILTER: Remove matches from wrong sport
    const fixtureWithSport = fixture as any;
    const fixtureSport = fixtureWithSport.league?.sport || fixtureWithSport.sportType || 'football';
    if (sport === 'basketball' && fixtureSport !== 'basketball') {
      return false;
    }
    if (sport === 'football' && fixtureSport === 'basketball') {
      return false;
    }
    
    const status = fixture.fixture.status?.short;
    // ✅ BASKETBALL FIX: Include basketball quarter statuses (Q1, Q2, Q3, Q4, OT)
    const isLive = [
      "1H",
      "2H",
      "HT",
      "ET",
      "BT",
      "P",
      "Q1",
      "Q2",
      "Q3",
      "Q4",
      "OT",
    ].includes(status || "");
    if (isLive && fixture.fixture?.id) {
      processedIds.add(fixture.fixture.id);
      return true;
    }
    return false;
  });

  const fixtureMatches = deduplicatedFixtures.filter((fixture) => {
    if (fixture.fixture?.id && processedIds.has(fixture.fixture.id))
      return false;

    const status = fixture.fixture.status?.short as string;
    // ✅ FIX TIMEZONE: Ensure both dates are compared in UTC for accurate comparison
    const matchDate = new Date(fixture.fixture.date);
    const now = new Date();
    // Both getTime() return UTC timestamps, so comparison is timezone-safe
    const matchTimeUTC = matchDate.getTime();
    const nowTimeUTC = now.getTime();

    // More strict filtering for fixtures
    const hasNoScore =
      (fixture.goals?.home === 0 && fixture.goals?.away === 0) ||
      (fixture.goals?.home === null && fixture.goals?.away === null);
    const isNotStarted = status === "NS" || status === "TBD";
    const isFutureMatch = matchTimeUTC > nowTimeUTC - 1800000; // 30min buffer
    const hasNoEvents = !fixture.events || fixture.events.length === 0;

    const isFixture =
      isNotStarted && hasNoScore && hasNoEvents && isFutureMatch;
    if (isFixture && fixture.fixture?.id) {
      processedIds.add(fixture.fixture.id);
      return true;
    }
    return false;
  });

  const finishedMatches = deduplicatedFixtures.filter((fixture) => {
    if (fixture.fixture?.id && processedIds.has(fixture.fixture.id))
      return false;

    const status = fixture.fixture.status?.short as string;
    // ✅ BASKETBALL FIX: Include AOT (After Overtime) for basketball finished games
    const isFinished = ["FT", "AET", "PEN", "AOT"].includes(status);
    if (isFinished && fixture.fixture?.id) {
      processedIds.add(fixture.fixture.id);
      return true;
    }
    return false;
  });

  const cancelledMatches = deduplicatedFixtures.filter((fixture) => {
    if (fixture.fixture?.id && processedIds.has(fixture.fixture.id))
      return false;

    const status = fixture.fixture.status?.short as string;
    const isCancelled = ["CANC", "ABD", "SUSP", "INT", "PST"].includes(status);
    if (isCancelled && fixture.fixture?.id) {
      processedIds.add(fixture.fixture.id);
      return true;
    }
    return false;
  });

  // ✅ DEBUG: Log filtering results (AFTER all filters are complete)
  console.log(
    `📊 FILTERED COUNTS: Live: ${liveFixtures.length}, Fixtures: ${fixtureMatches.length}, Finished: ${finishedMatches.length}, Cancelled: ${cancelledMatches.length}`,
  );

  // Helper function to group by competition with proper time-based sorting
  const groupByCompetitionWithTimeOrder = (
    matchList: Fixture[],
    statusType: "live" | "fixture" | "finished" | "cancelled",
    statusLabel: string,
  ): GroupedMatch[] => {
    // First, sort all matches by time based on status type
    const sortedMatches = matchList.sort((a, b) => {
      if (statusType === "live") {
        // ✅ LIVE MATCHES: Sort by ELAPSED TIME (most advanced first)
        // Professional standard: 90' appears before 75', which appears before 45'
        const elapsedA = a.fixture.status?.elapsed || 0;
        const elapsedB = b.fixture.status?.elapsed || 0;
        
        if (elapsedA !== elapsedB) {
          return elapsedB - elapsedA; // Higher elapsed time first (90' > 45')
        }
        
        // If same elapsed time, sort by start time (earlier first)
        return new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime();
      } else if (statusType === "fixture") {
        // ✅ FIXTURES: Sort by start time (earliest first)
        return new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime();
      } else {
        // ✅ FINISHED/CANCELLED: Sort by end time (most recent first)
        return new Date(b.fixture.date).getTime() - new Date(a.fixture.date).getTime();
      }
    });

    // Group matches while maintaining time order
    const groups: { [competition: string]: Fixture[] } = {};
    const competitionOrder: string[] = [];

    sortedMatches.forEach((fixture) => {
      // ✅ 100% RAW API DATA: Use league name exactly as received from API - NO transformations, NO hardcoded names, NO normalization
      let competitionName = fixture.league?.name || null;
      const leagueCountry = fixture.league?.country || null;

      // ✅ CRITICAL: If API doesn't provide league name, use country + "League" as fallback (still API-driven)
      if (!competitionName || competitionName.trim() === "") {
        if (leagueCountry) {
          competitionName = `${leagueCountry} League`; // Use API country data
        } else {
          competitionName = "Other Competition";
        }
      } else {
        // ✅ MINIMAL CLEANUP: Only remove numerical prefixes (formatting cleanup, not content change)
        competitionName = competitionName
          .replace(/^\[?\d+\]?\s*[-.]?\s*/, "")
          .trim();
        competitionName = competitionName.replace(/\(\d+\)/g, "").trim();
        competitionName = competitionName.replace(/^\d+\s*[-.]?\s*/, "").trim();

        // ✅ CRITICAL: If API returns generic name like "Premier League" for multiple countries,
        // use API country field to differentiate (still 100% API data, no hardcoding)
        if (leagueCountry && 
            competitionName.toLowerCase() === "premier league" &&
            leagueCountry.toLowerCase() !== "england" &&
            leagueCountry.toLowerCase() !== "world") {
          competitionName = `${leagueCountry} ${competitionName}`; // Use API country + API name
        }
      }

      // ✅ CRITICAL: All names come from API - league.name, league.country, or combination of both
      // NO hardcoded mappings, NO normalization services, NO transformations beyond API data

      if (!groups[competitionName]) {
        groups[competitionName] = [];
        competitionOrder.push(competitionName);
      }
      groups[competitionName].push(fixture);
    });

    // Return groups in the order they were encountered (time-based)
    return competitionOrder.map((competition) => ({
      statusType,
      competition,
      fixtures: groups[competition], // Already sorted by time from above
      statusLabel,
    }));
  };

  // Build final result array in the correct order with time-based grouping
  // ✅ ORDER: LIVE → UPCOMING (FIXTURES) → FINISHED → CANCELLED
  const result = [
    ...groupByCompetitionWithTimeOrder(liveFixtures, "live", "LIVE"),
    ...groupByCompetitionWithTimeOrder(fixtureMatches, "fixture", "FIXTURES"),
    ...groupByCompetitionWithTimeOrder(finishedMatches, "finished", "FINISHED"),
    ...groupByCompetitionWithTimeOrder(
      cancelledMatches,
      "cancelled",
      "CANCELLED",
    ),
  ];

  return result;
};

// ===== MATCH ITEM COMPONENT =====
const MatchItem: React.FC<MatchItemProps> = React.memo(
  ({ fixture, onToggleFavorite, onPress, matchType, sport }) => {
    const theme = useTheme();
    const { settings } = useMatchSettings();

    // ===== STATE =====
    const [homeTeamFlash, setHomeTeamFlash] = useState(false);
    const [awayTeamFlash, setAwayTeamFlash] = useState(false);
    const [isFavorite, setIsFavorite] = useState(false);
    const [enhancedData, setEnhancedData] = useState<EnhancedMatchData | null>(
      null,
    );
    const [showApostrophe, setShowApostrophe] = useState(true);

    // ===== GOAL FLASH ANIMATION =====
    const triggerGoalFlash = useCallback(
      (team: "home" | "away") => {
        if (team === "home") {
          setHomeTeamFlash(true);
          setTimeout(() => setHomeTeamFlash(false), 2000);
        } else {
          setAwayTeamFlash(true);
          setTimeout(() => setAwayTeamFlash(false), 2000);
        }

        if (settings?.soundNotification) {
          try {
            playGoalSound(team, settings);
          } catch (error) {
            console.error("Error playing goal sound:", error);
          }
        }
      },
      [settings],
    );

    // ===== GOAL DETECTION EFFECT =====
    useEffect(() => {
      if (!fixture.fixture?.id || matchType !== "live") return;

      const handleGoalDetected = (data: any) => {
        if (data.fixtureId === fixture.fixture.id) {
          const isHomeTeam = data.teamId === fixture.teams.home?.id;
          triggerGoalFlash(isHomeTeam ? "home" : "away");
        }
      };

      const unsubscribe = goalDetectionService.subscribe(handleGoalDetected);
      return unsubscribe;
    }, [
      fixture.fixture?.id,
      fixture.teams.home?.id,
      fixture.teams.away?.id,
      triggerGoalFlash,
      matchType,
    ]);

    // ===== FAVORITE STATUS =====
    useEffect(() => {
      const checkFavoriteStatus = async () => {
        if (fixture.fixture?.id) {
          try {
            const matchIdString = fixture.fixture.id.toString();
            const isFav = await favoritesService.isFavorite(matchIdString);
            setIsFavorite(isFav);
          } catch (error) {
            console.error("Error checking favorite status:", error);
          }
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

    // ===== ENHANCED DATA LOADING (ONLY FOR LIVE MATCHES) =====
    useEffect(() => {
      // Debug logging for card issues
      if (__DEV__) {
        console.log(
          `🃏 Enhanced Data Loading Debug - ${fixture.teams?.home?.name} vs ${fixture.teams?.away?.name}:`,
          {
            matchType,
            fixtureId: fixture.fixture?.id,
            homeTeamId: fixture.teams?.home?.id,
            awayTeamId: fixture.teams?.away?.id,
            leagueId: fixture.league?.id,
            status: fixture.fixture?.status?.short,
            shouldLoad: matchType === "live" || matchType === "finished",
            enhancedDataExists: !!enhancedData,
            currentCards: enhancedData?.cards,
          },
        );
      }

      // Load enhanced data for live and finished matches to get corner kicks
      if (
        (matchType !== "live" && matchType !== "finished") ||
        !fixture.fixture?.id
      ) {
        if (__DEV__) {
          console.log(
            `🃏 Skipping enhanced data load - matchType: ${matchType}, fixtureId: ${fixture.fixture?.id}`,
          );
        }
        return;
      }

      const loadEnhancedData = async () => {
        if (
          fixture.teams?.home?.id &&
          fixture.teams?.away?.id &&
          fixture.league?.id
        ) {
          try {
            if (__DEV__) {
              console.log(
                `🃏 Loading enhanced data for fixture ${fixture.fixture.id}...`,
              );
            }
            const data = await enhancedMatchService.getEnhancedMatchData(
              fixture.fixture.id,
              fixture.teams.home.id,
              fixture.teams.away.id,
              fixture.teams.home?.name || "",
              fixture.teams.away?.name || "",
              fixture.league.id,
              fixture.league?.name || "",
              fixture.events || [],
              fixture.league?.country || null,
            );
            if (__DEV__) {
              console.log(
                `🃏 Enhanced data loaded for ${fixture.teams.home?.name} vs ${fixture.teams.away?.name}:`,
                {
                  homeCards: data.cards?.home,
                  awayCards: data.cards?.away,
                  corners: data.corners,
                  rankings: data.rankings,
                },
              );
            }
            setEnhancedData(data);
          } catch (error) {
            console.error("Error loading enhanced data:", error);
          }
        } else {
          if (__DEV__) {
            console.log(
              `🃏 Missing required IDs - homeId: ${fixture.teams?.home?.id}, awayId: ${fixture.teams?.away?.id}, leagueId: ${fixture.league?.id}`,
            );
          }
        }
      };

      loadEnhancedData();
    }, [
      matchType,
      fixture.fixture?.id,
      fixture.teams?.home?.id,
      fixture.teams?.away?.id,
      fixture.league?.id,
    ]);

    // ===== BLINKING APOSTROPHE EFFECT =====
    useEffect(() => {
      const isCurrentlyLive = isLiveMatch();
      if (!isCurrentlyLive) {
        setShowApostrophe(true);
        return;
      }

      const interval = setInterval(() => {
        setShowApostrophe((prev) => !prev);
      }, 1000); // Blink every second

      return () => clearInterval(interval);
    }, [fixture.fixture?.status?.short]);

    // ===== UTILITY FUNCTIONS =====
    const getCardCount = (
      teamId: number | null,
      cardType: "yellow" | "red",
    ) => {
      if (teamId === null) return 0;
      const count =
        fixture.events?.filter(
          (event) =>
            event.detail ===
              (cardType === "yellow" ? "Yellow Card" : "Red Card") &&
            event.team.id === teamId,
        ).length || 0;
      return count;
    };

    const getMatchTime = () => {
      const status = fixture.fixture.status;
      if (!status) return "";

      switch (status.short) {
        case "1H":
          let elapsed1H = status.elapsed || 0;
          const apostrophe1H = showApostrophe ? "'" : " ";

          // ✅ CLIENT-SIDE STOPPAGE TIME CALCULATION
          // If API caps at 45 (stoppage time), calculate realistic time from match start
          if (elapsed1H === 45 && fixture.fixture.date) {
            const matchStart = new Date(fixture.fixture.date);
            const now = new Date();
            const minutesElapsed = Math.floor((now.getTime() - matchStart.getTime()) / (1000 * 60));
            
            // If more than 45 minutes have passed, use calculated time
            if (minutesElapsed > 45 && minutesElapsed < 60) {
              elapsed1H = minutesElapsed;
            }
          }

          // First half: display 45+1, 45+2, etc. when elapsed > 45
          if (elapsed1H > 45) {
            const addedTime = elapsed1H - 45;
            return `45+${addedTime}${apostrophe1H}`;
          }

          // Regular first half time (1-45)
          return `${elapsed1H}${apostrophe1H}`;

        case "2H":
          let elapsed2H = status.elapsed || 0;
          const apostrophe2H = showApostrophe ? "'" : " ";

          // ✅ CLIENT-SIDE STOPPAGE TIME CALCULATION
          // If API caps at 90 (stoppage time), calculate realistic time from match start
          if (elapsed2H === 90 && fixture.fixture.date) {
            const matchStart = new Date(fixture.fixture.date);
            const now = new Date();
            const minutesElapsed = Math.floor((now.getTime() - matchStart.getTime()) / (1000 * 60));
            
            // Account for halftime (typically 15 minutes), so 2H starts at ~60 min real time
            // If more than 105 real minutes have passed, we're likely in stoppage time
            // Allow up to 150 minutes to handle very long stoppages or data delays
            if (minutesElapsed > 105 && minutesElapsed <= 150) {
              // Convert real time to match time (subtract first half + break)
              elapsed2H = minutesElapsed - 60; // 60 = first half (45) + halftime (15)
            }
          }

          // Second half: display 90+1, 90+2, etc. when elapsed > 90
          if (elapsed2H > 90) {
            const addedTime = elapsed2H - 90;
            return `90+${addedTime}${apostrophe2H}`;
          }

          // Regular second half time (46-90)
          return `${elapsed2H}${apostrophe2H}`;
        case "HT":
          return "HT";
        case "ET":
          // Return empty string - ET badge will be shown above score instead
          return "";
        case "BT":
          // BT (Break Time) - Return empty string, ET badge shown above
          return "";
        case "P":
          return "Penalties";
        case "FT":
        case "AET":
        case "PEN":
          return status.short;
        case "NS":
          return new Date(fixture.fixture.date).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });
        case "CANC":
          return "CANCELLED";
        case "ABD":
          return "ABANDONED";
        case "SUSP":
          return "SUSPENDED";
        case "INT":
          return "INTERRUPTED";
        case "PST":
          return "POSTPONED";
        default:
          return status.short || "";
      }
    };

    const isLiveMatch = () => {
      const status = fixture.fixture.status?.short;
      return ["1H", "2H", "HT", "ET", "BT", "P"].includes(status || "");
    };

    const getCornerKicks = () => {
      // ✅ FIXED: Use real API data - show 0-0 if data hasn't loaded yet
      // Never show fake fallback data
      if (enhancedData?.corners !== undefined) {
        return `${enhancedData.corners.home}-${enhancedData.corners.away}`;
      }
      // Return 0-0 while loading instead of fake data
      return "0-0";
    };

    // ===== EVENT HANDLERS =====
    const handleFavoritePress = () => {
      // Immediate optimistic update
      setIsFavorite(!isFavorite);
      onToggleFavorite(fixture.fixture.id);
    };

    const handleMatchPress = () => {
      onPress(fixture);
    };

    // ===== COMPUTED VALUES =====
    const matchTime = getMatchTime();
    const homeCards = getCardCount(fixture.teams?.home?.id, "yellow");
    const awayCards = getCardCount(fixture.teams?.away?.id, "yellow");
    const isLive = isLiveMatch();

    // ===== RENDER =====
    return (
      <TouchableOpacity
        style={[
          styles.matchItem,
          {
            backgroundColor:
              homeTeamFlash || awayTeamFlash
                ? "#ffa8a8"
                : theme.colors.backgroundSecondary,
          },
        ]}
        onPress={handleMatchPress}
        activeOpacity={0.7}
      >
        {/* Top Row - Start Time and Stats */}
        <View style={styles.topRow}>
          <View style={styles.timeContainer}>
            <Text
              style={[
                styles.startTime,
                {
                  color: theme.colors.textSecondary,
                },
              ]}
            >
              {new Date(fixture.fixture.date).toLocaleTimeString("en-US", {
                hour12: false,
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </View>
          <View style={styles.rightStats}>
            {matchType === "cancelled" && (
              <View style={styles.statusContainer}>
                <XCircle size={14} color="#FF4444" />
                <Text style={[styles.statusText, { color: "#FF4444" }]}>
                  {matchTime}
                </Text>
              </View>
            )}
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
                  <View style={styles.homeTeamWithRanking}>
                    <TeamRanking
                      ranking={enhancedData?.rankings?.home || null}
                      position="home"
                      teamName={fixture.teams.home?.name || ""}
                    />
                    <Text
                      style={[
                        styles.teamName,
                        styles.homeTeamName,
                        {
                          color: homeTeamFlash ? "red" : theme.colors.text,
                          opacity: matchType === "cancelled" ? 0.7 : 1,
                        },
                      ]}
                      numberOfLines={
                        fixture.teams.home?.name &&
                        fixture.teams.home.name.split(" ").length > 2
                          ? 2
                          : 1
                      }
                      ellipsizeMode={
                        (fixture.teams.home?.name?.length || 0) > 30
                          ? "tail"
                          : "clip"
                      }
                    >
                      {fixture.teams.home?.name || ""}
                    </Text>
                  </View>
                  {/* Cards positioned under team name */}
                  {(matchType === "live" || matchType === "finished") && (
                    <View style={styles.homeCardsUnderTeam}>
                      <MatchCards
                        yellowCards={enhancedData?.cards?.home?.yellow || 0}
                        redCards={enhancedData?.cards?.home?.red || 0}
                        position="home"
                        teamName={fixture.teams.home?.name || ""}
                      />
                    </View>
                  )}
                </View>
              </View>

              {/* Score Section with Timer Above */}
              <View style={styles.scoreSection}>
                {/* Match Timer - Above Hyphen for Live Matches (or ET badge for Extra Time) */}
                {isLive && (
                  <View style={styles.matchTimerContainer}>
                    {isMatchInExtraTime(fixture) ? (
                      // Show ET badge for extra time matches
                      <MatchExtraTime
                        fixture={fixture}
                        showDetailedET={false}
                      />
                    ) : (
                      // Show normal timer for other live matches
                      <Text
                        style={[
                          styles.matchTimer,
                          {
                            color: "#FF4444",
                          },
                        ]}
                      >
                        {matchTime}
                      </Text>
                    )}
                  </View>
                )}

                <View style={styles.scoreRow}>
                  {matchType === "cancelled" ? (
                    <Text
                      style={[
                        styles.cancelledScore,
                        {
                          color: "#FF4444",
                          fontSize: 16,
                          fontWeight: "700",
                        },
                      ]}
                    >
                      vs
                    </Text>
                  ) : matchType === "fixture" ? (
                    // Show NS/VS for fixture matches instead of scores
                    <View style={styles.upcomingMatchCenter}>
                      <Text
                        style={[
                          styles.nsStatusCenter,
                          { color: theme.colors.textSecondary },
                        ]}
                      >
                        NS
                      </Text>
                      <Text style={[styles.vsText, { color: "#888888" }]}>
                        VS
                      </Text>
                    </View>
                  ) : (
                    // Show actual scores for live and finished matches
                    <>
                      <Text
                        style={[
                          styles.score,
                          {
                            color: "#FF4444",
                            fontSize: isLive ? 18 : 16,
                            fontWeight: isLive ? "800" : "700",
                          },
                        ]}
                      >
                        {sport === "basketball" 
                          ? ((fixture as any).scores?.home?.total ?? 0)
                          : (fixture.goals?.home ?? 0)}
                      </Text>
                      <Text
                        style={[styles.scoreSeparator, { color: "#FF4444" }]}
                      >
                        -
                      </Text>
                      <Text
                        style={[
                          styles.score,
                          {
                            color: "#FF4444",
                            fontSize: isLive ? 18 : 16,
                            fontWeight: isLive ? "800" : "700",
                          },
                        ]}
                      >
                        {sport === "basketball" 
                          ? ((fixture as any).scores?.away?.total ?? 0)
                          : (fixture.goals?.away ?? 0)}
                      </Text>
                    </>
                  )}
                </View>
              </View>

              {/* Away Team */}
              <View style={styles.awayTeamSection}>
                <View style={styles.awayTeamContainer}>
                  <View style={styles.awayTeamWithRanking}>
                    <Text
                      style={[
                        styles.teamName,
                        styles.awayTeamName,
                        {
                          color: awayTeamFlash ? "red" : theme.colors.text,
                          opacity: matchType === "cancelled" ? 0.7 : 1,
                        },
                      ]}
                      numberOfLines={
                        fixture.teams.away?.name &&
                        fixture.teams.away.name.split(" ").length > 2
                          ? 2
                          : 1
                      }
                      ellipsizeMode={
                        (fixture.teams.away?.name?.length || 0) > 30
                          ? "tail"
                          : "clip"
                      }
                    >
                      {fixture.teams.away?.name || ""}
                    </Text>
                    <TeamRanking
                      ranking={enhancedData?.rankings?.away || null}
                      position="away"
                      teamName={fixture.teams.away?.name || ""}
                    />
                  </View>
                  {/* Cards positioned under team name */}
                  {(matchType === "live" || matchType === "finished") && (
                    <View style={styles.awayCardsUnderTeam}>
                      <MatchCards
                        yellowCards={enhancedData?.cards?.away?.yellow || 0}
                        redCards={enhancedData?.cards?.away?.red || 0}
                        position="away"
                        teamName={fixture.teams.away?.name || ""}
                      />
                    </View>
                  )}
                </View>
              </View>

              {/* Broadcast Icons */}
              <View style={styles.broadcastIconsContainer}>
                <BroadcastIcons
                  hasVideoBroadcast={
                    getBroadcastInfo(fixture).hasVideoBroadcast
                  }
                  size={20}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Bottom Row - Different for each match type */}
        <View style={styles.bottomRow}>
          {matchType === "cancelled" ? (
            <Text
              style={[styles.matchDate, { color: theme.colors.textSecondary }]}
            >
              {new Date(fixture.fixture.date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </Text>
          ) : matchType === "fixture" ? (
            // Empty bottom row for fixture matches
            <View />
          ) : (
            // Show corner kicks for all live matches and halftime scores + corner kicks for finished matches
            (() => {
              const status = fixture.fixture.status?.short;
              const isFirstHalf = status === "1H";
              const isHalfTime = status === "HT";
              const isSecondHalf = status === "2H";
              const isFinished =
                matchType === "finished" ||
                ["FT", "AET", "PEN"].includes(status || "");
              const isLive =
                matchType === "live" ||
                ["1H", "2H", "HT", "ET", "BT", "P"].includes(status || "");

              if (isFirstHalf || isHalfTime) {
                // First half and half time: Show only corner kicks
                return (
                  <View style={styles.cornerKickContainer}>
                    <Flag size={14} color={theme.colors.textSecondary} />
                    <Text
                      style={[
                        styles.cornerStats,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      {getCornerKicks()}
                    </Text>
                  </View>
                );
              } else if (isSecondHalf || isFinished) {
                // Second half and finished matches: Show both halftime score AND corner kicks
                return (
                  <View style={styles.secondHalfStats}>
                    <Text
                      style={[
                        styles.htScore,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      HT:{fixture.score?.halftime?.home ?? 0}-
                      {fixture.score?.halftime?.away ?? 0}
                    </Text>
                    <View style={styles.cornerKickContainer}>
                      <Flag size={12} color={theme.colors.textSecondary} />
                      <Text
                        style={[
                          styles.cornerStats,
                          { color: theme.colors.textSecondary },
                        ]}
                      >
                        {getCornerKicks()}
                      </Text>
                    </View>
                  </View>
                );
              } else if (isLive) {
                // Other live states: Show only corner kicks
                return (
                  <View style={styles.cornerKickContainer}>
                    <Flag size={14} color={theme.colors.textSecondary} />
                    <Text
                      style={[
                        styles.cornerStats,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      {getCornerKicks()}
                    </Text>
                  </View>
                );
              } else {
                // Default: Show only halftime score
                return (
                  <Text
                    style={[
                      styles.htScore,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    HT:{fixture.score?.halftime?.home ?? 0}-
                    {fixture.score?.halftime?.away ?? 0}
                  </Text>
                );
              }
            })()
          )}
        </View>

        {/* Extra Time Detailed Section - Beautiful Red Transparent Bar */}
        {isMatchInExtraTime(fixture) && (
          <MatchExtraTime
            fixture={fixture}
            regularTimeScore={{
              home:
                fixture.score?.fulltime?.home ??
                fixture.score?.halftime?.home ??
                0,
              away:
                fixture.score?.fulltime?.away ??
                fixture.score?.halftime?.away ??
                0,
            }}
            showDetailedET={true}
          />
        )}
      </TouchableOpacity>
    );
  },
);

// ===== MAIN COMPONENT =====
export default function AllMatches({
  sport, // ✅ Sport prop added
  selectedDate,
  onFavoritesChange,
  onMatchCountChange,
  refreshing = false,
  onRefresh,
  headerComponent,
  onMatchesLoaded,
}: AllMatchesProps) {
  const theme = useTheme();
  const { refreshFavoritesCount } = useFavorites();
  const pathname = usePathname();
  const router = useRouter();

  // ===== STATE =====
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [favoritesMap, setFavoritesMap] = useState<{ [key: string]: boolean }>(
    {},
  );

  // ===== GOAL MONITORING =====
  useEffect(() => {
    if (!goalDetectionService.isMonitoringActive()) {
      goalDetectionService.startMonitoring();
    }
  }, []);

  // ===== DATA FETCHING =====
  const fetchAllFixtures = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log(
        `🏀 ALL MATCHES: Fetching comprehensive match data for sport: ${sport}`,
      );
      console.log(`✅ BASKETBALL DEBUG: Current sport parameter value: "${sport}"`);
      console.log(`✅ BASKETBALL DEBUG: Sport type: ${typeof sport}`);
      console.log(`✅ BASKETBALL DEBUG: Is basketball? ${sport === "basketball"}`);

      // ✅ BACKEND API: All API calls go through Supabase Edge Functions
      let allFixtures: Fixture[] = [];

      if (selectedDate) {
        // Fetch matches for selected date from backend
        console.log("🔍 FETCHING ALL MATCHES FOR DATE:", selectedDate);
        console.log(`🏀 BASKETBALL DEBUG: Fetching with sport="${sport}" and date="${selectedDate}"`);

        // Use backend API for selected date
        const liveMatches = await backendApiService.getLiveMatches(
          sport,
          false,
        );
        const fixtureMatches = await backendApiService.getFixtures(
          sport,
          selectedDate,
          false,
        );
        const finishedMatches = await backendApiService.getFinishedMatches(
          sport,
          selectedDate,
          false,
        );

        console.log(`🏀 BASKETBALL DEBUG: API Results - Live: ${liveMatches?.length || 0}, Fixtures: ${fixtureMatches?.length || 0}, Finished: ${finishedMatches?.length || 0}`);

        allFixtures = [
          ...(liveMatches || []),
          ...(fixtureMatches || []),
          ...(finishedMatches || []),
        ];
        
        // ✅ FIX TIMEZONE: Filter by selectedDate in user's local timezone if provided
        if (selectedDate) {
          allFixtures = allFixtures.filter((fixture: any) => {
            if (!fixture?.fixture?.date) return false;
            const matchDate = new Date(fixture.fixture.date);
            const matchDateStr = getLocalDateForApi(matchDate);
            return matchDateStr === selectedDate;
          });
        }
      } else {
        // Comprehensive data fetching for all matches from backend
        console.log("🔍 FETCHING COMPREHENSIVE MATCH DATA FROM BACKEND");
        console.log(`🏀 BASKETBALL DEBUG: Fetching with sport="${sport}" (no specific date)`);

        // ✅ FIX TIMEZONE: Use local date instead of UTC to respect user's timezone
        const todayStr = getLocalDateForApi();

        // Fetch all match types from backend (backend handles all the complex logic)
        const [liveMatches, fixtureMatches, finishedMatches] =
          await Promise.all([
            backendApiService.getLiveMatches(sport, false).catch(() => []),
            backendApiService
              .getFixtures(sport, todayStr, false)
              .catch(() => []),
            backendApiService
              .getFinishedMatches(sport, todayStr, false)
              .catch(() => []),
          ]);

        console.log(`🏀 BASKETBALL DEBUG: API Results - Live: ${liveMatches?.length || 0}, Fixtures: ${fixtureMatches?.length || 0}, Finished: ${finishedMatches?.length || 0}`);

        allFixtures = [
          ...(liveMatches || []),
          ...(fixtureMatches || []),
          ...(finishedMatches || []),
        ];

        console.log(
          `✅ BACKEND API: Retrieved ${allFixtures.length} total matches`,
        );
      }

      // Deduplicate fixtures
      if (allFixtures.length > 0) {
        const fixtureMap = new Map<number, Fixture>();
        allFixtures.forEach((fixture) => {
          if (fixture.fixture?.id && !fixtureMap.has(fixture.fixture.id)) {
            fixtureMap.set(fixture.fixture.id, fixture);
          }
        });
        allFixtures = Array.from(fixtureMap.values());

        // Additional safety check: Remove any remaining duplicates based on multiple criteria
        const uniqueFixtures = new Map<string, Fixture>();
        allFixtures.forEach((fixture) => {
          const uniqueKey = `${fixture.fixture.id}-${fixture.teams.home?.name}-${fixture.teams.away?.name}-${fixture.fixture.date}`;
          if (!uniqueFixtures.has(uniqueKey)) {
            uniqueFixtures.set(uniqueKey, fixture);
          }
        });
        allFixtures = Array.from(uniqueFixtures.values());

        console.log(`📊 TOTAL UNIQUE MATCHES: ${allFixtures.length}`);
      }

      console.log(`✅ ALL MATCHES LOADED: ${allFixtures.length} matches`);

      // ✅ DEBUG: Log match statuses to understand what's being fetched
      const statusCounts: { [key: string]: number } = {};
      allFixtures.forEach((f) => {
        const status = f.fixture.status?.short || "UNKNOWN";
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });
      console.log(`📊 FETCHED MATCH STATUSES:`, statusCounts);

      setFixtures(allFixtures);

      if (onMatchCountChange) {
        onMatchCountChange(allFixtures.length);
      }

      if (onMatchesLoaded) {
        // Convert to Match format for parent callback
        const matches = allFixtures.map((fixture): Match => {
          const getMatchStatus = (
            status: string | undefined,
          ): "live" | "finished" | "upcoming" => {
            if (!status) return "upcoming";
            // ✅ BASKETBALL FIX: Include basketball live statuses (Q1, Q2, Q3, Q4, OT)
            // ✅ FIX: Add LIVE status to live statuses
            if (
              [
                "LIVE",  // ✅ FIX: Add LIVE status
                "1H",
                "2H",
                "HT",
                "ET",
                "BT",
                "P",
                "Q1",
                "Q2",
                "Q3",
                "Q4",
                "OT",
              ].includes(status)
            )
              return "live";
            if (
              [
                "FT",
                "AET",
                "PEN",
                "CANC",
                "PST",
                "ABD",
                "SUSP",
                "INT",
                "AOT",
              ].includes(status)
            )
              return "finished";
            return "upcoming";
          };

          return {
            id: fixture.fixture.id.toString(),
            sport: "football",
            league: fixture.league?.name || "",
            status: getMatchStatus(fixture.fixture.status?.short || undefined),
            statusText: fixture.fixture.status?.long || "Not Started",
            startTime: fixture.fixture.date,
            time: fixture.fixture.status?.elapsed
              ? `${fixture.fixture.status.elapsed}'`
              : undefined,
            home: {
              name: fixture.teams.home?.name || "",
              score: sport === "basketball" 
                ? ((fixture as any).scores?.home?.total ?? 0)
                : (fixture.goals?.home ?? 0),
              logo: fixture.teams.home?.logo || undefined,
            },
            away: {
              name: fixture.teams.away?.name || "",
              score: sport === "basketball" 
                ? ((fixture as any).scores?.away?.total ?? 0)
                : (fixture.goals?.away ?? 0),
              logo: fixture.teams.away?.logo || undefined,
            },
            score: sport === "basketball"
              ? `${(fixture as any).scores?.home?.total ?? 0}-${(fixture as any).scores?.away?.total ?? 0}`
              : `${fixture.goals?.home ?? 0}-${fixture.goals?.away ?? 0}`,
            halfTimeScore: `${fixture.score?.halftime?.home ?? 0}-${fixture.score?.halftime?.away ?? 0}`,
            viewers: "", // API doesn't provide viewer data
            hasVideo: false,
            isFavorite: false,
            addedTime: "",
          };
        });
        onMatchesLoaded(matches);

        // ✅ CRITICAL: Update goal detection service with live matches
        const liveMatches = matches.filter((m) => m.status === "live");
        console.log(
          `🚨 ALL-MATCHES: Updating goal detection with ${liveMatches.length} live matches from ${matches.length} total`,
        );
        goalDetectionService.updateMatches(matches);
      }

      setError(null);
    } catch (err) {
      console.error("Error fetching all matches:", err);
      setError("Failed to load matches");
    } finally {
      setIsLoading(false);
    }
  }, [sport, selectedDate, onMatchCountChange, onMatchesLoaded]); // ✅ Add sport to dependencies

  // Background refresh functionality
  const refreshAllMatches = useCallback(async () => {
    await fetchAllFixtures();
  }, [fetchAllFixtures]);

  const backgroundRefresh = useBackgroundRefresh({
    screenType: "all-matches",
    refreshCallback: refreshAllMatches,
    enabled: true,
    customConfig: {
      intervalMs: 60000, // 1 minute
      visualFeedback: false,
      smartScheduling: true,
    },
  });

  // ===== INITIAL FETCH =====
  useEffect(() => {
    fetchAllFixtures();
  }, [sport, fetchAllFixtures]); // ✅ Add sport to dependencies for smooth switching

  // ===== CHECK FAVORITE STATUS FOR ALL FIXTURES =====
  useEffect(() => {
    const checkAllFavorites = async () => {
      const favMap: { [key: string]: boolean } = {};
      for (const fixture of fixtures) {
        if (fixture.fixture?.id) {
          const matchIdString = fixture.fixture.id.toString();
          const isFav = await favoritesService.isFavorite(matchIdString);
          favMap[matchIdString] = isFav;
        }
      }
      setFavoritesMap(favMap);
    };

    if (fixtures.length > 0) {
      checkAllFavorites();
    }
  }, [fixtures]);

  // ===== REFRESH HANDLER =====
  const handleRefresh = () => {
    console.log("🔄 ALL MATCHES: Manual refresh initiated");
    fetchAllFixtures();

    if (onRefresh) {
      onRefresh();
    }

    if (onFavoritesChange) {
      onFavoritesChange();
    }

    refreshFavoritesCount();
  };

  // ===== FAVORITES MANAGEMENT =====
  const toggleFavorite = useCallback(
    async (matchId: number) => {
      try {
        const fixture = fixtures.find((f) => f.fixture.id === matchId);
        if (!fixture) return;

        const matchIdString = matchId.toString();
        const isCurrentlyFavorite =
          await favoritesService.isFavorite(matchIdString);

        if (isCurrentlyFavorite) {
          await favoritesService.removeFromFavorites(matchIdString);
          // Update local favorites map
          setFavoritesMap((prev) => ({ ...prev, [matchIdString]: false }));
        } else {
          // ✅ BASKETBALL FIX: Get correct scores based on sport
          const scores = (fixture as any).scores;
          const homeScore =
            sport === "basketball"
              ? (scores?.home?.total ?? 0)
              : (fixture.goals?.home ?? 0);
          const awayScore =
            sport === "basketball"
              ? (scores?.away?.total ?? 0)
              : (fixture.goals?.away ?? 0);

          // Convert fixture to match format for the general service
          const matchForService = {
            id: matchIdString,
            sport: sport, // ✅ Use dynamic sport (basketball/football)
            league: fixture.league?.name || "Unknown League",
            status:
              fixture.fixture.status?.short === "1H" ||
              fixture.fixture.status?.short === "2H" ||
              (fixture.fixture.status?.short as string) === "Q1" ||
              (fixture.fixture.status?.short as string) === "Q2" ||
              (fixture.fixture.status?.short as string) === "Q3" ||
              (fixture.fixture.status?.short as string) === "Q4"
                ? "live"
                : fixture.fixture.status?.short === "FT" ||
                    (fixture.fixture.status?.short as string) === "AOT"
                  ? "finished"
                  : "upcoming",
            statusText: fixture.fixture.status?.long || "",
            startTime: fixture.fixture.date || new Date().toISOString(), // Use current date
            home: {
              name: fixture.teams.home?.name || "Home Team",
              logo: fixture.teams.home?.logo || "",
            },
            away: {
              name: fixture.teams.away?.name || "Away Team",
              logo: fixture.teams.away?.logo || "",
            },
            score: `${homeScore}-${awayScore}`,
            halfTimeScore: "0-0",
            viewers: "1",
            hasVideo: false,
            isFavorite: true,
          };

          await favoritesService.addToFavorites(matchForService);
          // Update local favorites map
          setFavoritesMap((prev) => ({ ...prev, [matchIdString]: true }));
        }

        if (onFavoritesChange) {
          onFavoritesChange();
        }
      } catch (error) {
        console.error("Error toggling favorite:", error);
        // Don't throw error to prevent crash - just log it
      }
    },
    [fixtures, onFavoritesChange],
  );

  // ===== NAVIGATION =====
  const handleMatchPress = useCallback(
    (fixture: Fixture) => {
      router.push({
        pathname: "/match-details",
        params: {
          matchId: fixture.fixture.id.toString(),
          sport: sport, // ✅ Pass sport parameter for proper detail screen adaptation
          homeTeam: fixture.teams.home?.name || "",
          awayTeam: fixture.teams.away?.name || "",
          homeTeamId: fixture.teams.home?.id?.toString() || "", // ✅ CRITICAL: Pass team IDs for enhanced data
          awayTeamId: fixture.teams.away?.id?.toString() || "", // ✅ CRITICAL: Pass team IDs for enhanced data
          leagueId: fixture.league?.id?.toString() || "", // ✅ CRITICAL: Pass league ID for enhanced data
          homeScore: sport === "basketball"
            ? ((fixture as any).scores?.home?.total ?? 0).toString()
            : (fixture.goals?.home?.toString() || "0"),
          awayScore: sport === "basketball"
            ? ((fixture as any).scores?.away?.total ?? 0).toString()
            : (fixture.goals?.away?.toString() || "0"),
          status: fixture.fixture.status?.short || "NS",
          elapsed: fixture.fixture.status?.elapsed?.toString() || "0", // ✅ CRITICAL: Pass elapsed time!
          startTime: fixture.fixture.date,
          league: fixture.league?.name || "",
          homeLogo: fixture.teams.home?.logo || "",
          awayLogo: fixture.teams.away?.logo || "",
          halftimeScore: `${fixture.score?.halftime?.home || 0}-${fixture.score?.halftime?.away || 0}`,
          from: "all-matches",
          // ✅ API-DRIVEN: Pass venue data from API (no hardcoding)
          venueName: fixture.fixture.venue?.name || "",
          venueCity: fixture.fixture.venue?.city || "",
        },
      });
    },
    [router, sport], // ✅ Include sport in dependencies
  );

  // ===== GROUPED DATA =====
  const groupedMatches = React.useMemo(
    () => groupMatchesByStatus(fixtures, sport),
    [fixtures, sport],
  );

  // ===== RENDER FUNCTIONS =====
  const renderMatchItem = useCallback(
    ({
      item,
    }: {
      item: Fixture & {
        matchType: "live" | "fixture" | "finished" | "cancelled";
      };
    }) => {
      // ✅ BASKETBALL SUPPORT: Use basketball component for basketball matches
      if (sport === "basketball") {
        // Check favorite status from favorites map
        const matchIdString = item.fixture.id.toString();
        const isFav = favoritesMap[matchIdString] || false;
        const basketballMatch = convertFixtureToBasketballMatch(item, isFav);

        return (
          <BasketballMatchItem
            match={basketballMatch}
            onToggleFavorite={() => toggleFavorite(item.fixture.id)}
            sport={sport}
          />
        );
      }

      // Default: Use football match item
      return (
        <MatchItem
          fixture={item}
          onToggleFavorite={toggleFavorite}
          onPress={handleMatchPress}
          matchType={item.matchType}
          sport={sport}
        />
      );
    },
    [sport, toggleFavorite, handleMatchPress, favoritesMap],
  );

  const renderCompetitionHeader = useCallback(
    ({ item }: { item: GroupedMatch }) => {
      // Get API logo from first fixture in the group
      const firstFixture = item.fixtures[0];
      const apiLogoUrl = firstFixture?.league?.logo || null;
      const leagueId = firstFixture?.league?.id || null;

      return (
        <View
          style={[
            styles.competitionHeader,
            { backgroundColor: theme.colors.background },
          ]}
        >
          <View style={styles.headerContent}>
            <LeagueLogo
              leagueName={item.competition}
              size={24}
              style={styles.leagueLogo}
              apiLogoUrl={apiLogoUrl}
              leagueId={leagueId}
            />
            <Text
              style={[
                styles.competitionHeaderText,
                { color: theme.colors.text },
              ]}
            >
              {item.competition}
            </Text>
          </View>
        </View>
      );
    },
    [theme],
  );

  const renderCompetitionSection = useCallback(
    ({ item }: { item: GroupedMatch }) => (
      <View style={styles.competitionSection}>
        {renderCompetitionHeader({ item })}
        {item.fixtures.map((fixture, index) => (
          <View
            key={`unique-${fixture.fixture.id}-${item.statusType}-${index}`}
          >
            {renderMatchItem({
              item: { ...fixture, matchType: item.statusType } as any,
            })}
            {index < item.fixtures.length - 1 && (
              <View
                style={[
                  styles.matchSpacer,
                  { backgroundColor: theme.colors.border },
                ]}
              />
            )}
          </View>
        ))}
      </View>
    ),
    [renderCompetitionHeader, renderMatchItem, theme],
  );

  // ===== ERROR/LOADING STATES =====
  if (error && fixtures.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={[styles.errorText, { color: theme.colors.textSecondary }]}>
          {error}
        </Text>
      </View>
    );
  }

  if (fixtures.length === 0 && !isLoading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
          No matches available for this date
        </Text>
        <Text
          style={[styles.emptySubText, { color: theme.colors.textSecondary }]}
        >
          Pull down to refresh
        </Text>
      </View>
    );
  }

  // ===== MAIN RENDER =====
  return (
    <View style={styles.container}>
      {isLoading && fixtures.length === 0 && (
        <View style={[styles.loadingContainer, { pointerEvents: "none" }]}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text
            style={[styles.loadingText, { color: theme.colors.textSecondary }]}
          >
            Loading all matches...
          </Text>
        </View>
      )}

      <FlatList
        data={groupedMatches}
        renderItem={renderCompetitionSection}
        keyExtractor={(item, index) =>
          `${item.statusType}-${item.competition}-${index}`
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing || isLoading}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        ListHeaderComponent={headerComponent}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        removeClippedSubviews={false}
        maxToRenderPerBatch={8}
        initialNumToRender={6}
        windowSize={12}
        bounces={true}
        contentContainerStyle={styles.flatListContent}
      />
    </View>
  );
}

// ===== STYLES =====
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flatListContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.05)",
    zIndex: 1,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
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
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
    textAlign: "center",
    opacity: 0.7,
  },
  competitionSection: {
    marginBottom: 0,
  },
  competitionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  leagueLogo: {
    width: 24,
    height: 24,
    marginRight: 8,
    borderRadius: 12,
  },
  competitionHeaderText: {
    fontSize: 14,
    fontFamily: "Inter-Medium",
    fontWeight: "500",
    flex: 1,
  },
  matchItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    marginLeft: 32,
  },
  startTime: {
    fontSize: 12,
    fontFamily: "Inter-Regular",
    marginRight: 8,
  },
  rightStats: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 12,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontFamily: "Inter-Bold",
    fontWeight: "600",
  },
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statsText: {
    fontSize: 12,
    fontFamily: "Inter-Regular",
  },
  mainContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
    paddingHorizontal: 0,
  },
  favoriteButton: {
    paddingRight: 16,
    paddingTop: 4,
    width: 44,
    alignItems: "flex-start",
    justifyContent: "flex-start",
  },
  centeredMatchContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  scoreSectionContainer: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 80,
  },
  matchTimerContainer: {
    marginBottom: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  matchTimer: {
    fontSize: 13,
    fontFamily: "Inter-Bold",
    fontWeight: "700",
  },
  teamsAndScoreRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 0,
  },
  homeTeamSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    justifyContent: "flex-end",
    paddingRight: 12,
  },
  homeTeamContainer: {
    flexDirection: "column",
    alignItems: "flex-end",
    flex: 1,
    minWidth: 0,
  },
  homeCardsUnderTeam: {
    marginTop: 3,
    alignItems: "flex-end",
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  homeTeamWithRanking: {
    flexDirection: "row",
    alignItems: "center",
    gap: 0,
    justifyContent: "flex-end",
  },
  awayTeamSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    justifyContent: "flex-start",
    paddingLeft: 12,
  },
  awayTeamContainer: {
    flexDirection: "column",
    alignItems: "flex-start",
    flex: 1,
    minWidth: 0,
  },
  awayCardsUnderTeam: {
    marginTop: 3,
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  awayTeamWithRanking: {
    flexDirection: "row",
    alignItems: "center",
    gap: 0,
    justifyContent: "flex-start",
  },
  broadcastIconsContainer: {
    paddingLeft: 16,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 44,
  },
  teamName: {
    fontSize: 14,
    fontFamily: "Inter-Medium",
    fontWeight: "500",
    lineHeight: 18,
    flexShrink: 1,
  },
  homeTeamName: {
    textAlign: "right",
  },
  awayTeamName: {
    textAlign: "left",
  },
  yellowCard: {
    backgroundColor: "#FFD700",
    borderRadius: 3,
    minWidth: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 4,
  },
  cardText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#000",
  },
  scoreSection: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 70,
    marginTop: -32,
    paddingHorizontal: 8,
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  score: {
    fontSize: 16,
    fontFamily: "Inter-Bold",
    fontWeight: "700",
    minWidth: 20,
    textAlign: "center",
  },
  cancelledScore: {
    fontSize: 16,
    fontFamily: "Inter-Bold",
    fontWeight: "700",
    minWidth: 20,
    textAlign: "center",
  },
  scoreSeparator: {
    fontSize: 16,
    fontWeight: "700",
    marginHorizontal: 8,
  },
  upcomingMatchCenter: {
    alignItems: "center",
    paddingHorizontal: 8,
  },
  nsStatusCenter: {
    fontSize: 10,
    fontFamily: "Inter-Regular",
    color: "#666666",
    marginBottom: 8,
  },
  vsText: {
    fontSize: 16,
    fontWeight: "700",
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingLeft: 8,
  },
  htScore: {
    fontSize: 11,
    fontFamily: "Inter-Regular",
  },
  cornerStats: {
    fontSize: 11,
    fontFamily: "Inter-Regular",
    marginLeft: 3,
  },
  cornerKickContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  secondHalfStats: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  matchDate: {
    fontSize: 11,
    fontFamily: "Inter-Regular",
  },
  matchSpacer: {
    height: 8,
    backgroundColor: "#F5F5F5",
    opacity: 0.6,
    marginHorizontal: 0,
    width: "100%",
  },
});
