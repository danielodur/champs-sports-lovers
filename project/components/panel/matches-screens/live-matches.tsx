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
  Image,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { Star, Users, Flag } from "lucide-react-native";
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
import enhancedMatchService, {
  EnhancedMatchData,
} from "@/services/enhanced-match-service";
import TeamRanking from "@/components/team-rankings";
import MatchCards from "@/components/match-cards";
import BroadcastIcons from "@/components/BroadcastIcons";
import { getBroadcastInfo } from "@/utils/broadcastUtils";
import LeagueLogo from "../../LeagueLogo";
// ✅ REMOVED: smartLeagueNameService - Using 100% API-driven league names
import BasketballMatchItem from "./basketball-match-item";
import { convertFixtureToBasketballMatch } from "./basketball-utils";
import MatchExtraTime, {
  isMatchInExtraTime,
} from "./extra-time/match-extra-time";

// ===== INTERFACES =====
interface LiveMatchesProps {
  sport: string; // ✅ Sport identifier (football, basketball, etc.)
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
}

// ===== SERVICES INITIALIZATION =====
// ✅ RESTORED: Using original api-sports-service with TheSportsDB fallback (API-Football primary)
// ✅ BACKEND API: All API calls go through Supabase Edge Functions
// API keys stored securely in backend, not exposed in frontend
import { backendApiService } from "../../../services/backendApiService";

// ===== CONSTANTS =====
// Goal flash duration - synchronized with banner display (6 seconds)
const GOAL_FLASH_DURATION = 6000; // Match banner auto-dismiss duration

// ===== UTILITY FUNCTIONS =====
const groupByCompetition = (fixtures: Fixture[]) => {
  console.log(`🔍 LIVE SORTING: Starting with ${fixtures.length} fixtures`);
  
  // ✅ SORT BY ELAPSED TIME DESCENDING (most advanced matches first)
  // Since API's fixture.date is unreliable (many matches have same start time),
  // we sort by actual elapsed time: ET/BT → 90' → 89' → 88' → ... → 2' → 1'
  const sortedFixtures = fixtures.sort((a, b) => {
    // Get elapsed times with special handling for ET/BT
    let elapsedA = a.fixture.status.elapsed || 0;
    let elapsedB = b.fixture.status.elapsed || 0;

    // ✅ CRITICAL FIX: Extra Time (ET) and Break Time (BT) should be treated as most advanced
    // ET/BT matches have completed 90 minutes + extra time
    const statusA = a.fixture.status.short;
    const statusB = b.fixture.status.short;

    if (statusA === "ET" || statusA === "BT") {
      elapsedA = 999; // Virtual high value to sort ET/BT to top
    }
    if (statusB === "ET" || statusB === "BT") {
      elapsedB = 999;
    }

    // Primary sort: Higher elapsed time first (999/ET → 90' → 45')
    if (elapsedA !== elapsedB) {
      return elapsedB - elapsedA;
    }

    // Secondary sort: If same elapsed time, sort by fixture.date (API time)
    const dateA = new Date(a.fixture.date).getTime();
    const dateB = new Date(b.fixture.date).getTime();
    return dateA - dateB;
  });

  // Debug: Show sorted order
  console.log('📊 SORTED ORDER (by elapsed time):');
  sortedFixtures.slice(0, 10).forEach((f, i) => {
    const elapsed = f.fixture.status.elapsed || 0;
    const status = f.fixture.status.short;
    console.log(`  ${i + 1}. ${f.teams.home?.name} vs ${f.teams.away?.name} | ${elapsed}' | Status: ${status}`);
  });

  // ✅ THEN group by competition WHILE MAINTAINING the elapsed time order
  const groups: { [competition: string]: Fixture[] } = {};
  const competitionOrder: string[] = []; // Track order of first appearance

  sortedFixtures.forEach((fixture) => {
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
      competitionOrder.push(competitionName); // Track first appearance order
    }
    groups[competitionName].push(fixture);
  });

  const result = competitionOrder.map((competition) => ({
    competition,
    fixtures: groups[competition], // Already sorted by elapsed time
  }));

  // Debug: Show final grouping
  console.log(`📦 FINAL GROUPS: ${result.length} competitions, ${sortedFixtures.length} total matches`);
  result.forEach((group, i) => {
    console.log(`  ${i + 1}. ${group.competition}: ${group.fixtures.length} matches`);
  });

  // ✅ Return groups in order of first appearance (maintains elapsed time order)
  return result;
};

// ===== MATCH ITEM COMPONENT =====
const MatchItem: React.FC<MatchItemProps> = React.memo(
  ({ fixture, onToggleFavorite, onPress }) => {
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
        // ✅ SYNCHRONIZED: Flash duration matches banner display (6 seconds)
        if (team === "home") {
          setHomeTeamFlash(true);
          setTimeout(() => setHomeTeamFlash(false), GOAL_FLASH_DURATION);
        } else {
          setAwayTeamFlash(true);
          setTimeout(() => setAwayTeamFlash(false), GOAL_FLASH_DURATION);
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
      if (!fixture.fixture?.id) return;

      const handleGoalDetected = (data: any) => {
        console.log('🎯 LIVE-MATCHES: Goal detected callback triggered:', {
          notificationMatchId: data.matchId,
          currentFixtureId: fixture.fixture.id.toString(),
          scoringTeam: data.scoringTeam,
          eventType: data.eventType,
        });
        
        // ✅ CRITICAL FIX: Match by matchId string comparison instead of fixtureId
        if (data.matchId === fixture.fixture.id.toString()) {
          console.log('✅ LIVE-MATCHES: Match ID matches! Triggering flash for:', data.scoringTeam);
          
          // ✅ ENHANCED: Only flash for regular goals, not cancelled goals or red cards
          if (data.eventType === 'goal') {
            triggerGoalFlash(data.scoringTeam);
          }
        } else {
          console.log('❌ LIVE-MATCHES: Match ID does not match');
        }
      };

      const unsubscribe = goalDetectionService.subscribe(handleGoalDetected);
      return unsubscribe;
    }, [
      fixture.fixture?.id,
      triggerGoalFlash,
    ]);

    // ===== FAVORITE STATUS =====
    useEffect(() => {
      const checkFavoriteStatus = async () => {
        if (fixture.fixture?.id) {
          const matchIdString = fixture.fixture.id.toString();
          const isFav = await favoritesService.isFavorite(matchIdString);
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

    // ===== ENHANCED DATA LOADING =====
    useEffect(() => {
      // Debug logging for card issues
      if (__DEV__) {
        console.log(
          `🃏 Enhanced Data Loading Debug - ${fixture.teams?.home?.name} vs ${fixture.teams?.away?.name}:`,
          {
            fixtureId: fixture.fixture?.id,
            homeTeamId: fixture.teams?.home?.id,
            awayTeamId: fixture.teams?.away?.id,
            leagueId: fixture.league?.id,
            status: fixture.fixture?.status?.short,
            shouldLoad: true,
            enhancedDataExists: !!enhancedData,
            currentCards: enhancedData?.cards,
          },
        );
      }

      if (!fixture.fixture?.id) {
        console.log(
          `🃏 CORNER DEBUG: Skipping enhanced data load - no fixture ID`,
        );
        return;
      }

      const loadEnhancedData = async () => {
        if (
          fixture.teams?.home?.id &&
          fixture.teams?.away?.id &&
          fixture.league?.id
        ) {
          try {
            console.log(
              `🃏 CORNER DEBUG: Loading enhanced data for fixture ${fixture.fixture.id} - ${fixture.teams.home?.name} vs ${fixture.teams.away?.name}`,
            );
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
            console.log(
              `🃏 CORNER DEBUG: Enhanced data loaded for ${fixture.teams.home?.name} vs ${fixture.teams.away?.name}:`,
              {
                corners: data.corners,
                homeCards: data.cards?.home,
                awayCards: data.cards?.away,
                rankings: data.rankings,
                isDataLoaded: data.isDataLoaded,
              },
            );
            console.log(
              `🃏 CORNER DEBUG: Corner kicks result: ${data.corners.home}-${data.corners.away}`,
            );
            setEnhancedData(data);
          } catch (error) {
            console.error(
              "🃏 CORNER DEBUG: Error loading enhanced data:",
              error,
            );
          }
        } else {
          console.log(
            `🃏 CORNER DEBUG: Missing required IDs - homeId: ${fixture.teams?.home?.id}, awayId: ${fixture.teams?.away?.id}, leagueId: ${fixture.league?.id}`,
          );
        }
      };

      loadEnhancedData();
    }, [
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
              console.log(`🕐 CLIENT-SIDE CALC (1H): Match started ${minutesElapsed} min ago, API shows ${status.elapsed}`);
            }
          }

          console.log(
            `⏱️ LIVE-MATCHES TIMER (1H): ${fixture.teams.home?.name} vs ${fixture.teams.away?.name} | elapsed: ${elapsed1H} | API: ${status.elapsed}`,
          );

          // First half: display 45+1, 45+2, etc. when elapsed > 45
          if (elapsed1H > 45) {
            const addedTime = elapsed1H - 45;
            console.log(`🟢 SHOWING FIRST HALF ADDED TIME: 45+${addedTime}`);
            return `45+${addedTime}${apostrophe1H}`;
          }

          // Regular first half time (1-45)
          console.log(`🔵 SHOWING REGULAR 1H TIME: ${elapsed1H}'`);
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
              console.log(`🕐 CLIENT-SIDE CALC (2H): Match started ${minutesElapsed} min ago, calculated 2H: ${elapsed2H}`);
            }
          }

          console.log(
            `⏱️ LIVE-MATCHES TIMER (2H): ${fixture.teams.home?.name} vs ${fixture.teams.away?.name} | elapsed: ${elapsed2H} | API: ${status.elapsed}`,
          );

          // Second half: display 90+1, 90+2, etc. when elapsed > 90
          if (elapsed2H > 90) {
            const addedTime = elapsed2H - 90;
            console.log(`🟢 SHOWING SECOND HALF ADDED TIME: 90+${addedTime}`);
            return `90+${addedTime}${apostrophe2H}`;
          }

          // Regular second half time (46-90)
          console.log(`🔵 SHOWING REGULAR 2H TIME: ${elapsed2H}'`);
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
        default:
          return status.short || "";
      }
    };

    const isLiveMatch = () => {
      const status = fixture.fixture.status?.short;
      return ["1H", "2H", "HT", "ET", "BT", "P"].includes(status || "");
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

    // Get corner kick data - use enhanced data if available, otherwise fallback
    const getCornerKicks = () => {
      // ✅ FIXED: Use real API data - show 0-0 if data hasn't loaded yet
      // Never show fake fallback data
      if (enhancedData?.corners !== undefined) {
        const cornerValue = `${enhancedData.corners.home}-${enhancedData.corners.away}`;
        console.log(`🃏 CORNER DEBUG: Displaying corner kicks: ${cornerValue}`);
        return cornerValue;
      }
      console.log(`🃏 CORNER DEBUG: No enhanced data yet, showing 0-0`);
      // Return 0-0 while loading instead of fake data
      return "0-0";
    };

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
          <View style={styles.rightStats} />
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
                    {homeTeamFlash && settings?.goalAnimation ? (
                      <View style={styles.teamNameWrapperHome}>
                        <Text
                          style={[
                            styles.teamName,
                            styles.homeTeamName,
                            styles.teamNameScored,
                          ]}
                          numberOfLines={
                            fixture.teams.home?.name &&
                            fixture.teams.home.name.split(" ").length > 2
                              ? 2
                              : 1
                          }
                          ellipsizeMode="tail"
                        >
                          {fixture.teams.home?.name || ""}
                        </Text>
                      </View>
                    ) : (
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
                        ellipsizeMode="tail"
                      >
                        {fixture.teams.home?.name || ""}
                      </Text>
                    )}
                  </View>
                  {/* Cards positioned under team name */}
                  <View style={styles.homeCardsUnderTeam}>
                    <MatchCards
                      yellowCards={enhancedData?.cards?.home?.yellow || 0}
                      redCards={enhancedData?.cards?.home?.red || 0}
                      position="home"
                      teamName={fixture.teams.home?.name || ""}
                    />
                  </View>
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
                    {fixture.goals?.home ?? 0}
                  </Text>
                  <Text style={[styles.scoreSeparator, { color: "#FF4444" }]}>
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
                    {fixture.goals?.away ?? 0}
                  </Text>
                </View>
              </View>

              {/* Away Team */}
              <View style={styles.awayTeamSection}>
                <View style={styles.awayTeamContainer}>
                  <View style={styles.awayTeamWithRanking}>
                    {awayTeamFlash && settings?.goalAnimation ? (
                      <View style={styles.teamNameWrapperAway}>
                        <Text
                          style={[
                            styles.teamName,
                            styles.awayTeamName,
                            styles.teamNameScored,
                          ]}
                          numberOfLines={
                            fixture.teams.away?.name &&
                            fixture.teams.away.name.split(" ").length > 2
                              ? 2
                              : 1
                          }
                          ellipsizeMode="tail"
                        >
                          {fixture.teams.away?.name || ""}
                        </Text>
                      </View>
                    ) : (
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
                        ellipsizeMode="tail"
                      >
                        {fixture.teams.away?.name || ""}
                      </Text>
                    )}
                    <TeamRanking
                      ranking={enhancedData?.rankings?.away || null}
                      position="away"
                      teamName={fixture.teams.away?.name || ""}
                    />
                  </View>
                  {/* Cards positioned under team name */}
                  <View style={styles.awayCardsUnderTeam}>
                    <MatchCards
                      yellowCards={enhancedData?.cards?.away?.yellow || 0}
                      redCards={enhancedData?.cards?.away?.red || 0}
                      position="away"
                      teamName={fixture.teams.away?.name || ""}
                    />
                  </View>
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

        {/* Bottom Row - HT Score and Corner Stats */}
        <View style={styles.bottomRow}>
          {fixture.fixture.status?.short === "1H" ? (
            // First half: only show corner kicks
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
          ) : fixture.fixture.status?.short === "HT" ? (
            // Half time: only show corner kicks with icon (no HT scores since halftime is still ongoing)
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
          ) : fixture.fixture.status?.short === "2H" ? (
            // Second half: show HT score and corner kicks side by side
            <View style={styles.secondHalfStats}>
              <Text
                style={[styles.htScore, { color: theme.colors.textSecondary }]}
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
          ) : isMatchInExtraTime(fixture) ? (
            // ✅ Extra Time: Don't show HT score here - detailed ET shown below
            null
          ) : (
            // Finished matches or other states: show only HT score
            <Text
              style={[styles.htScore, { color: theme.colors.textSecondary }]}
            >
              HT:{fixture.score?.halftime?.home ?? 0}-
              {fixture.score?.halftime?.away ?? 0}
            </Text>
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

// ===== MAIN LIVE MATCHES FOOTBALL COMPONENT =====
export default function LiveMatches({
  sport, // ✅ Sport prop added
  onFavoritesChange,
  onMatchCountChange,
  refreshing = false,
  onRefresh,
  headerComponent,
  onMatchesLoaded,
}: LiveMatchesProps) {
  const theme = useTheme();
  const { refreshFavoritesCount, addFavorite, removeFavorite } = useFavorites();
  const pathname = usePathname();
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);

  // ===== STATE =====
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [internalRefreshing, setInternalRefreshing] = useState(false);
  const [favoritesMap, setFavoritesMap] = useState<{ [key: string]: boolean }>(
    {},
  );

  // ===== DATA FETCHING FUNCTION =====
  const fetchLiveFixtures = useCallback(async () => {
    try {
      // ✅ Show loading indicator during fetch
      setInternalRefreshing(true);

      console.log(`🏀 Fetching live matches for sport: ${sport}`);

      // ✅ BACKEND API: Fetch live matches from Supabase Edge Functions
      // ✅ CRITICAL FIX: ALWAYS force refresh (true) for live matches to bypass cache
      // Live match statuses change rapidly (NS → 1H → HT → 2H → FT)
      console.log(`📡 [Backend API] Fetching live ${sport} matches with FORCE REFRESH...`);
      const liveMatches = await backendApiService.getLiveMatches(sport, true); // ✅ CHANGED: false → true
      
      // 🔍 DEBUG: Log API response details
      console.log(`✅ [API DEBUG] Total matches received: ${liveMatches.length}`);
      
      // 🔍 DEBUG: Check status distribution
      const statusBreakdown: {[key: string]: number} = {};
      liveMatches.forEach(m => {
        const status = m.fixture?.status?.short || 'UNKNOWN';
        statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;
      });
      console.log(`📊 [STATUS BREAKDOWN]:`, statusBreakdown);
      
      if (liveMatches.length > 0) {
        console.log(`✅ [API DEBUG] First match:`, {
          id: liveMatches[0].fixture?.id,
          home: liveMatches[0].teams?.home?.name,
          away: liveMatches[0].teams?.away?.name,
          status: liveMatches[0].fixture?.status?.short,
          statusLong: liveMatches[0].fixture?.status?.long,
          league: liveMatches[0].league?.name
        });
      }

      // Convert to FootballFixturesResponse format for compatibility
      const response: FootballFixturesResponse = {
        get: "fixtures",
        parameters: { live: "all", date: null },
        errors: [],
        results: liveMatches.length,
        paging: { current: 1, total: 1 },
        response: liveMatches,
      };

      // ✅ BACKEND DEBUG: Log response details
      console.log(`📊 [Backend API] Response for ${sport}:`, {
        totalMatches: response.response?.length || 0,
        firstMatch: response.response?.[0]
          ? {
              id: response.response[0].fixture?.id,
              status: response.response[0].fixture?.status?.short,
              home: response.response[0].teams?.home?.name,
              away: response.response[0].teams?.away?.name,
            }
          : "No matches",
      });

      // Filter only live matches
      const liveFixtures = response.response.filter((fixture) => {
        // ✅ BASKETBALL SUPPORT: Add null checks for data validation
        if (!fixture || !fixture.fixture || !fixture.fixture.status) {
          console.warn("⚠️ Invalid fixture data, skipping:", fixture);
          return false;
        }
        
        // ✅ CRITICAL SPORT FILTER: Remove matches from wrong sport
        const fixtureWithSport = fixture as any;
        const fixtureSport = fixtureWithSport.league?.sport || fixtureWithSport.sportType || 'football';
        if (sport === 'basketball' && fixtureSport !== 'basketball') {
          console.warn(`🚫 REMOVING WRONG SPORT: ${fixture.teams?.home?.name || 'Unknown'} vs ${fixture.teams?.away?.name || 'Unknown'} is ${fixtureSport}, expected basketball`);
          return false;
        }
        if (sport === 'football' && fixtureSport === 'basketball') {
          console.warn(`🚫 REMOVING WRONG SPORT: ${fixture.teams?.home?.name || 'Unknown'} vs ${fixture.teams?.away?.name || 'Unknown'} is ${fixtureSport}, expected football`);
          return false;
        }
        
        const status = fixture.fixture.status?.short;
        const isLive = [
          "LIVE",  // ✅ ADDED: Generic live status
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
        
        // 🔍 DEBUG: Log why matches are being filtered
        if (!isLive && status) {
          console.log(`❌ FILTERED OUT: ${fixture.teams?.home?.name} vs ${fixture.teams?.away?.name} | Status: "${status}" not in live list`);
        }
        
        return isLive;
      });

      // ✅ BASKETBALL DEBUG: Log filtered results
      console.log(
        `🎯 Filtered ${sport} live matches: ${liveFixtures.length}`,
        liveFixtures.map((f) => ({
          id: f.fixture.id,
          status: f.fixture.status?.short,
          home: f.teams.home?.name,
          away: f.teams.away?.name,
        })),
      );

      setFixtures(liveFixtures);
      if (onMatchCountChange) {
        onMatchCountChange(liveFixtures.length);
      }
      if (onMatchesLoaded) {
        // Convert Fixture[] to Match[] format
        const matches = liveFixtures.map((fixture): Match => {
          const getMatchStatus = (
            status: string | undefined,
          ): "live" | "finished" | "upcoming" => {
            if (!status) return "upcoming";
            // ✅ FIXED: Include "LIVE" status
            if (
              [
                "LIVE",  // ✅ ADDED: Generic live status from API-Football
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
              ["FT", "AET", "PEN", "CANC", "PST", "ABD", "AOT"].includes(status)
            )
              return "finished";
            return "upcoming";
          };

          return {
            id: fixture.fixture.id.toString(),
            sport: sport, // ✅ Use dynamic sport instead of hardcoded "football"
            league: fixture.league?.name || "",
            status: getMatchStatus(fixture.fixture.status?.short || undefined),
            statusText: fixture.fixture.status?.long || "Not Started",
            startTime: fixture.fixture.date,
            time: fixture.fixture.status?.elapsed
              ? `${fixture.fixture.status.elapsed}'`
              : undefined,
            home: {
              name: fixture.teams.home?.name || "",
              score: fixture.goals?.home ?? 0,
              logo: fixture.teams.home?.logo || undefined,
            },
            away: {
              name: fixture.teams.away?.name || "",
              score: fixture.goals?.away ?? 0,
              logo: fixture.teams.away?.logo || undefined,
            },
            score: `${fixture.goals?.home ?? 0}-${fixture.goals?.away ?? 0}`,
            halfTimeScore: `${fixture.score?.halftime?.home ?? 0}-${fixture.score?.halftime?.away ?? 0}`,
            viewers: "", // API doesn't provide viewer data
            hasVideo: false,
            isFavorite: false,
            addedTime: "",
          };
        });
        onMatchesLoaded(matches);

        // ✅ CRITICAL: Update goal detection service with live matches
        console.log(
          `🚨 LIVE-MATCHES: Updating goal detection with ${matches.filter((m) => m.status === "live").length} live matches`,
        );
        goalDetectionService.updateMatches(matches);
      }

      setError(null);
    } catch (err) {
      console.error("Error fetching live matches:", err);
      setError("Failed to load live matches");
    } finally {
      // ✅ Hide loading indicator after fetch completes
      setInternalRefreshing(false);
    }
  }, [sport, onMatchCountChange, onMatchesLoaded]); // ✅ Add sport to dependencies

  // Background refresh functionality
  const backgroundRefresh = useBackgroundRefresh({
    screenType: "live-matches",
    refreshCallback: fetchLiveFixtures,
    enabled: true,
    customConfig: {
      intervalMs: 30000, // 30 seconds
      visualFeedback: false,
      smartScheduling: true,
    },
  });

  // ===== GOAL MONITORING =====
  useEffect(() => {
    if (!goalDetectionService.isMonitoringActive()) {
      goalDetectionService.startMonitoring();
    }
  }, []);

  // ===== INITIAL DATA LOADING =====
  useEffect(() => {
    fetchLiveFixtures();

    // Set up auto-refresh for live matches every 30 seconds
    const interval = setInterval(fetchLiveFixtures, 30000);

    return () => clearInterval(interval);
  }, [sport, fetchLiveFixtures]); // ✅ Add sport to dependencies for smooth switching

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

  // ✅ CRITICAL: Update goal detection service when fixtures change
  useEffect(() => {
    if (fixtures.length > 0) {
      // Convert fixtures to matches format for goal detection
      const matches = fixtures.map((fixture): Match => {
        const getMatchStatus = (
          status: string | undefined,
        ): "live" | "finished" | "upcoming" => {
          if (!status) return "upcoming";
          if (
            [
              "LIVE",  // ✅ FIX: Add LIVE status to live statuses
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
            ["FT", "AET", "PEN", "CANC", "PST", "ABD", "AOT"].includes(status)
          )
            return "finished";
          return "upcoming";
        };

        return {
          id: fixture.fixture.id.toString(),
          sport: sport,
          league: fixture.league?.name || "",
          status: getMatchStatus(fixture.fixture.status?.short || undefined),
          statusText: fixture.fixture.status?.long || "Not Started",
          startTime: fixture.fixture.date,
          time: fixture.fixture.status?.elapsed
            ? `${fixture.fixture.status.elapsed}'`
            : undefined,
          home: {
            name: fixture.teams.home?.name || "",
            score: fixture.goals?.home ?? 0,
            logo: fixture.teams.home?.logo || undefined,
          },
          away: {
            name: fixture.teams.away?.name || "",
            score: fixture.goals?.away ?? 0,
            logo: fixture.teams.away?.logo || undefined,
          },
          score: `${fixture.goals?.home ?? 0}-${fixture.goals?.away ?? 0}`,
          halfTimeScore: `${fixture.score?.halftime?.home ?? 0}-${fixture.score?.halftime?.away ?? 0}`,
          viewers: "0",
          hasVideo: false,
          isFavorite: false,
          addedTime: "",
          round: "",
        };
      });

      console.log(
        `🚨 LIVE-MATCHES useEffect: Updating goal detection with ${matches.filter((m) => m.status === "live").length} live matches`,
      );
      goalDetectionService.updateMatches(matches);
    }
  }, [fixtures, sport]);

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
            sport: sport, // ✅ Use dynamic sport instead of hardcoded "football"
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
            startTime: fixture.fixture.date || new Date().toISOString(),
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
          homeScore: fixture.goals?.home?.toString() || "0",
          awayScore: fixture.goals?.away?.toString() || "0",
          status: fixture.fixture.status?.short || "NS",
          elapsed: fixture.fixture.status?.elapsed?.toString() || "0", // ✅ CRITICAL: Pass elapsed time!
          startTime: fixture.fixture.date,
          league: fixture.league?.name || "",
          homeLogo: fixture.teams.home?.logo || "",
          awayLogo: fixture.teams.away?.logo || "",
          halftimeScore: `${fixture.score?.halftime?.home || 0}-${fixture.score?.halftime?.away || 0}`,
          from: "live-matches",
          // ✅ API-DRIVEN: Pass venue data from API (no hardcoding)
          venueName: fixture.fixture.venue?.name || "",
          venueCity: fixture.fixture.venue?.city || "",
        },
      });
    },
    [router, sport], // ✅ Include sport in dependencies
  );

  // ===== MEMOIZED VALUES =====
  const competitionGroups = useMemo(
    () => groupByCompetition(fixtures),
    [fixtures],
  );

  // ===== RENDER FUNCTIONS =====
  const renderMatchItem = useCallback(
    ({ item }: { item: Fixture }) => {
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
        />
      );
    },
    [sport, toggleFavorite, handleMatchPress, favoritesMap],
  );

  const renderCompetitionHeader = useCallback(
    ({ item }: { item: { competition: string; fixtures: Fixture[] } }) => {
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
    ({ item }: { item: { competition: string; fixtures: Fixture[] } }) => (
      <View style={styles.competitionSection}>
        {renderCompetitionHeader({ item })}
        {item.fixtures.map((fixture, index) => (
          <View key={`${fixture.fixture.id}-${index}`}>
            {renderMatchItem({ item: fixture })}
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

  if (fixtures.length === 0 && !internalRefreshing) {
    return (
      <View style={styles.centerContainer}>
        <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
          No live matches at the moment
        </Text>
        <Text
          style={[styles.emptySubText, { color: theme.colors.textSecondary }]}
        >
          Check back when matches are in progress
        </Text>
      </View>
    );
  }

  // ===== MAIN RENDER =====
  return (
    <View style={styles.container}>
      {internalRefreshing && fixtures.length === 0 && (
        <View style={[styles.loadingContainer, { pointerEvents: "none" }]}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text
            style={[styles.loadingText, { color: theme.colors.textSecondary }]}
          >
            Loading live matches...
          </Text>
        </View>
      )}

      <FlatList
        ref={flatListRef}
        data={competitionGroups}
        renderItem={renderCompetitionSection}
        keyExtractor={(item) => item.competition}
        refreshing={refreshing || internalRefreshing}
        onRefresh={onRefresh}
        ListHeaderComponent={headerComponent}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={false}
        scrollEventThrottle={16}
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
  teamNameWrapperHome: {
    // Wrapper for home team (right aligned) - doesn't affect layout
    alignSelf: 'flex-end',
  },
  teamNameWrapperAway: {
    // Wrapper for away team (left aligned) - doesn't affect layout
    alignSelf: 'flex-start',
  },
  teamNameScored: {
    backgroundColor: '#EF5350',
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: "Inter-Medium",
    fontWeight: "500",
    paddingHorizontal: 0, // No horizontal padding - background fits text exactly
    paddingVertical: 2, // Keep vertical padding for readability
    borderRadius: 2,
    overflow: 'hidden',
    // Ensure text doesn't add extra font padding
    includeFontPadding: false,
    textAlignVertical: 'center',
    lineHeight: 18,
    flexShrink: 1,
    // Maintain original text alignment
    textAlign: 'inherit', // Inherits from homeTeamName/awayTeamName
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
  scoreSeparator: {
    fontSize: 16,
    fontFamily: "Inter-Medium",
    marginHorizontal: 8,
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
  matchSpacer: {
    height: 8,
    backgroundColor: "#F5F5F5",
    opacity: 0.6,
    marginHorizontal: 0,
    width: "100%",
  },
});
