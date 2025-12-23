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
import { Star, Users, Flag, ChevronRight } from "lucide-react-native";
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
import { formatMatchTime, getLocalDateForApi } from "@/utils/timeUtils";
import { playGoalSound } from "@/utils/SoundManager";
import enhancedMatchService, {
  EnhancedMatchData,
} from "@/services/enhanced-match-service";
import TeamRanking from "@/components/team-rankings";
import MatchCards from "@/components/match-cards";
import LeagueLogo from "../../LeagueLogo";
// ✅ REMOVED: smartLeagueNameService - Using 100% API-driven league names
import BasketballMatchItem from "./basketball-match-item";
import { convertFixtureToBasketballMatch } from "./basketball-utils";
import FinishedExtraTime from "./extra-time/finished-extra-time";

// ===== INTERFACES =====
interface FinishedMatchesProps {
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
  sport: string; // Sport identifier
}

// ===== SERVICES INITIALIZATION =====
// ✅ RESTORED: Using original api-sports-service with TheSportsDB fallback (API-Football primary)
// ✅ BACKEND API: All API calls go through Supabase Edge Functions
import { backendApiService } from "../../../services/backendApiService";

// ===== UTILITY FUNCTIONS =====
const groupByChronologicalOrder = (fixtures: Fixture[]) => {
  // First, sort ALL matches by time (most recent first) - this is the key!
  const sortedFixtures = fixtures.sort((a, b) => {
    const timeA = new Date(a.fixture.date).getTime();
    const timeB = new Date(b.fixture.date).getTime();
    return timeB - timeA; // Most recent first
  });

  // Create groups that maintain perfect chronological order like the Chinese app
  const groups: {
    competition: string;
    leagueLogo?: string | null;
    leagueId?: number | null;
    fixtures: Fixture[];
  }[] = [];
  let currentGroup: {
    competition: string;
    leagueLogo?: string | null;
    leagueId?: number | null;
    fixtures: Fixture[];
  } | null = null;

  sortedFixtures.forEach((fixture, index) => {
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

    // Create new group if:
    // 1. No current group exists
    // 2. Competition name changes
    // 3. Time gap is more than 2 hours (to allow natural competition groupings)
    const currentTime = new Date(fixture.fixture.date).getTime();
    const timeDiff =
      index > 0
        ? Math.abs(
            currentTime -
              new Date(sortedFixtures[index - 1].fixture.date).getTime(),
          )
        : 0;

    const shouldCreateNewGroup =
      !currentGroup ||
      currentGroup.competition !== competitionName ||
      timeDiff > 2 * 60 * 60 * 1000; // 2 hours gap

    if (shouldCreateNewGroup) {
      currentGroup = {
        competition: competitionName,
        leagueLogo: fixture.league?.logo || null, // ✅ Store API league logo
        leagueId: fixture.league?.id || null, // ✅ Store API league ID
        fixtures: [fixture],
      };
      groups.push(currentGroup);
    } else if (currentGroup) {
      // Add to existing group, maintaining chronological order within group
      currentGroup.fixtures.push(fixture);
    }
  });

  // Final pass: ensure each group's fixtures are properly sorted
  groups.forEach((group) => {
    group.fixtures.sort((a, b) => {
      const timeA = new Date(a.fixture.date).getTime();
      const timeB = new Date(b.fixture.date).getTime();
      return timeB - timeA; // Most recent first
    });
  });

  return groups;
};

// ===== MATCH ITEM COMPONENT =====
const MatchItem: React.FC<MatchItemProps> = React.memo(
  ({ fixture, onToggleFavorite, onPress, sport }) => {
    const theme = useTheme();
    const { settings } = useMatchSettings();

    // ===== STATE =====
    const [homeTeamFlash, setHomeTeamFlash] = useState(false);
    const [awayTeamFlash, setAwayTeamFlash] = useState(false);
    const [isFavorite, setIsFavorite] = useState(false);
    const [enhancedData, setEnhancedData] = useState<EnhancedMatchData | null>(
      null,
    );

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

    // ===== ENHANCED DATA LOADING (FOR FINISHED MATCHES) =====
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
        if (__DEV__) {
          console.log(`🃏 Skipping enhanced data load - no fixture ID`);
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
      fixture.fixture?.id,
      fixture.teams?.home?.id,
      fixture.teams?.away?.id,
      fixture.league?.id,
    ]);

    // ===== GOAL DETECTION EFFECT =====
    useEffect(() => {
      if (!fixture.fixture?.id) return;

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

    const getCornerKicks = () => {
      // ✅ FIXED: Use real API data - show 0-0 if data hasn't loaded yet
      // Never show fake fallback data
      if (enhancedData?.corners !== undefined) {
        return `${enhancedData.corners.home}-${enhancedData.corners.away}`;
      }
      // Return 0-0 while loading instead of fake data
      return "0-0";
    };

    const isFinishedMatch = () => {
      const status = fixture.fixture.status?.short;
      return ["FT", "AET", "PEN"].includes(status || "");
    };

    // ✅ Get halftime score from API (100% API-driven)
    const getHalftimeScore = () => {
      // API provides halftime scores in fixture.score.halftime
      const htHome = fixture.score?.halftime?.home;
      const htAway = fixture.score?.halftime?.away;

      // Log for debugging
      if (__DEV__) {
        console.log(
          `🔍 [HT Score] Match: ${fixture.teams.home?.name} vs ${fixture.teams.away?.name}`,
        );
        console.log(`🔍 [HT Score] Raw data:`, {
          htHome,
          htAway,
          fullScore: fixture.score,
        });
      }

      // Check if halftime scores are available and valid (including 0 as valid)
      if ((htHome === 0 || htHome) && (htAway === 0 || htAway)) {
        const result = `${htHome}-${htAway}`;
        if (__DEV__) {
          console.log(`✅ [HT Score] Displaying: ${result}`);
        }
        return result;
      }

      // Fallback: Check if we can derive from match events or other data
      if (__DEV__) {
        console.log(`⚠️ [HT Score] No halftime data available, using fallback`);
      }
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
    const homeCards = getCardCount(fixture.teams?.home?.id, "yellow");
    const awayCards = getCardCount(fixture.teams?.away?.id, "yellow");
    const isFinished = isFinishedMatch();

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
              {formatMatchTime(fixture.fixture.date)}
            </Text>
          </View>
          <View style={styles.rightStats}>
            <View style={styles.statsContainer}>
              <Users size={14} color={theme.colors.textSecondary} />
              <Text
                style={[
                  styles.statsText,
                  { color: theme.colors.textSecondary },
                ]}
              >
                12
              </Text>
            </View>
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
              size={24}
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
                        { color: homeTeamFlash ? "red" : theme.colors.text },
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
                      {formatTeamName(fixture.teams.home?.name || "")}
                    </Text>
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

              {/* Score Section with FT/ET/PEN Indicator */}
              <View style={styles.scoreSection}>
                {/* Status Indicator - Above hyphen for finished matches */}
                {isFinished && (
                  <View style={styles.ftIndicatorContainer}>
                    <Text
                      style={[
                        styles.ftIndicator,
                        {
                          color: fixture.fixture.status?.short === 'PEN' ? '#FF4444' : theme.colors.textSecondary,
                        },
                      ]}
                    >
                      {fixture.fixture.status?.short === 'AET' ? 'ET' : 
                       fixture.fixture.status?.short === 'PEN' ? 'Penalties' : 'FT'}
                    </Text>
                  </View>
                )}
                <View style={styles.scoreRow}>
                  <Text
                    style={[
                      styles.score,
                      {
                        color: "#FF4444",
                        fontSize: 16,
                        fontWeight: "700",
                      },
                    ]}
                  >
                    {sport === "basketball" 
                      ? ((fixture as any).scores?.home?.total ?? 0)
                      : (fixture.goals?.home ?? 0)}
                  </Text>
                  <Text style={[styles.scoreSeparator, { color: "#FF4444" }]}>
                    -
                  </Text>
                  <Text
                    style={[
                      styles.score,
                      {
                        color: "#FF4444",
                        fontSize: 16,
                        fontWeight: "700",
                      },
                    ]}
                  >
                    {sport === "basketball" 
                      ? ((fixture as any).scores?.away?.total ?? 0)
                      : (fixture.goals?.away ?? 0)}
                  </Text>
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
                        { color: awayTeamFlash ? "red" : theme.colors.text },
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
                      {formatTeamName(fixture.teams.away?.name || "")}
                    </Text>
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

              {/* Navigation Button */}
              <TouchableOpacity
                onPress={handleMatchPress}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <View style={styles.navigationRing}>
                  <ChevronRight size={14} color="#FF4444" />
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Bottom Row - HT Score and Corner Stats */}
        <View style={styles.bottomRow}>
          <View style={styles.finishedMatchStats}>
            <Text
              style={[styles.htScore, { color: theme.colors.textSecondary }]}
            >
              HT:{getHalftimeScore()}
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
        </View>

        {/* Extra Time/Penalty Finished Display - Only for Football */}
        {sport === "football" && (
          <FinishedExtraTime
            fixture={fixture}
            homeTeamName={fixture.teams.home?.name || ""}
            awayTeamName={fixture.teams.away?.name || ""}
          />
        )}
      </TouchableOpacity>
    );
  },
);

// ===== MAIN COMPONENT =====
export default function FinishedMatches({
  sport, // ✅ Sport prop added
  selectedDate,
  onFavoritesChange,
  onMatchCountChange,
  refreshing = false,
  onRefresh,
  headerComponent,
  onMatchesLoaded,
}: FinishedMatchesProps) {
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

  // Background refresh functionality

  // ===== AUTO-REFRESH INTERVAL =====
  useEffect(() => {
    // Set up auto-refresh every 30 seconds for finished matches
    const interval = setInterval(() => {
      console.log("🔄 AUTO-REFRESH: Fetching latest finished matches");
      fetchFinishedFixtures();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [selectedDate]);

  // ===== DATA FETCHING =====
  const fetchFinishedFixtures = useCallback(async () => {
    try {
      // ✅ REMOVED setInternalRefreshing(true) - no loading indicators!
      // Background refresh should be completely invisible to users
      console.log(
        "🏁 [Backend API] FINISHED MATCHES: Fetching data for",
        selectedDate || "recent matches",
      );

      // Backend API handles caching automatically
      let finishedFixtures: Fixture[];

      // ✅ FIX TIMEZONE: Use local date instead of UTC to respect user's timezone
      const targetDate = selectedDate || getLocalDateForApi();
      console.log(
        `📡 [Backend API] Fetching finished matches for sport: ${sport}, date: ${targetDate} (local timezone)`,
      );

      finishedFixtures = await backendApiService.getFinishedMatches(
        sport,
        targetDate,
        false,
      );

      // Filter to ensure only finished matches AND correct sport
      finishedFixtures = finishedFixtures.filter((fixture: any) => {
        // ✅ BASKETBALL SUPPORT: Add null checks for data validation
        if (!fixture || !fixture.fixture || !fixture.fixture.status) {
          console.warn("⚠️ Invalid fixture data, skipping:", fixture);
          return false;
        }
        
        // ✅ FIX TIMEZONE: Filter by date in user's local timezone
        if (selectedDate && fixture.fixture?.date) {
          const matchDate = new Date(fixture.fixture.date);
          const matchDateStr = getLocalDateForApi(matchDate);
          if (matchDateStr !== selectedDate) {
            return false; // Skip matches not on selected date
          }
        }
        
        // ✅ CRITICAL SPORT FILTER: Remove matches from wrong sport
        // API should already filter by sport, but this is a safety check
        const fixtureSport = fixture.league?.sport || fixture.sportType || 'football';
        if (sport === 'basketball' && fixtureSport !== 'basketball') {
          console.warn(`🚫 REMOVING WRONG SPORT: ${fixture.teams?.home?.name || 'Unknown'} vs ${fixture.teams?.away?.name || 'Unknown'} is ${fixtureSport}, expected basketball`);
          return false;
        }
        if (sport === 'football' && fixtureSport === 'basketball') {
          console.warn(`🚫 REMOVING WRONG SPORT: ${fixture.teams?.home?.name || 'Unknown'} vs ${fixture.teams?.away?.name || 'Unknown'} is ${fixtureSport}, expected football`);
          return false;
        }
        
        const status = fixture.fixture.status?.short as string;
        // ✅ BASKETBALL: Add AOT (After OverTime) for basketball
        return ["FT", "AET", "PEN", "CANC", "ABD", "AOT"].includes(status);
      });

      console.log(
        `✅ [Backend API] Found ${finishedFixtures.length} finished matches`,
      );

      // Sort by match date (most recent first)
      finishedFixtures = finishedFixtures.sort((a: any, b: any) => {
        const dateA = new Date(a.fixture.date).getTime();
        const dateB = new Date(b.fixture.date).getTime();
        return dateB - dateA;
      });

      console.log(
        `📊 [Backend API] FINISHED MATCHES LOADED: ${finishedFixtures.length} total`,
        {
          totalCount: finishedFixtures.length,
        },
      );

      setFixtures(finishedFixtures);
      if (onMatchCountChange) {
        onMatchCountChange(finishedFixtures.length);
      }
      setError(null);
      if (onMatchesLoaded) {
        // Convert Fixture[] to Match[] format
        const matches = finishedFixtures.map((fixture): Match => {
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
              ["FT", "AET", "PEN", "CANC", "PST", "ABD", "AOT"].includes(status)
            )
              return "finished";
            return "upcoming";
          };

          return {
            id: fixture.fixture.id.toString(),
            sport: sport, // ✅ Use dynamic sport instead of hardcoded "football"
            league: fixture.league?.name || "",
            home: {
              name: fixture.teams.home?.name || "",
              logo: fixture.teams.home?.logo || "",
              score: sport === "basketball" 
                ? ((fixture as any).scores?.home?.total ?? 0)
                : (fixture.goals?.home || 0),
            },
            away: {
              name: fixture.teams.away?.name || "",
              logo: fixture.teams.away?.logo || "",
              score: sport === "basketball" 
                ? ((fixture as any).scores?.away?.total ?? 0)
                : (fixture.goals?.away || 0),
            },
            startTime: fixture.fixture.date,
            status: getMatchStatus(fixture.fixture.status?.short || undefined),
            statusText: fixture.fixture.status?.long || "",
            score: sport === "basketball"
              ? `${(fixture as any).scores?.home?.total ?? 0}-${(fixture as any).scores?.away?.total ?? 0}`
              : `${fixture.goals?.home || 0}-${fixture.goals?.away || 0}`,
            halfTimeScore: `${fixture.score?.halftime?.home || 0}-${fixture.score?.halftime?.away || 0}`,
            viewers: (Math.floor(Math.random() * 10000) + 1000).toString(),
            hasVideo: Math.random() > 0.5,
            addedTime: "0",
            isFavorite: false,
          };
        });
        onMatchesLoaded(matches);
      }
      setError(null);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error("Error fetching finished matches:", error);

      if (
        errorMessage.includes("timeout") ||
        errorMessage.includes("Request timeout")
      ) {
        setError(
          "Request timed out. Please check your connection and try again.",
        );
      } else if (errorMessage.includes("Rate limit")) {
        setError("Too many requests. Please wait a moment and try again.");
      } else if (
        errorMessage.includes("401") ||
        errorMessage.includes("unauthorized")
      ) {
        setError("API authentication failed. Please check configuration.");
      } else {
        setError("Failed to load finished matches. Please try again.");
      }
    }
    // ✅ REMOVED finally block - no loading state updates!
  }, [sport, selectedDate, onMatchCountChange, onMatchesLoaded]); // ✅ Add sport to dependencies

  // ===== INITIAL FETCH =====
  useEffect(() => {
    fetchFinishedFixtures();
  }, [fetchFinishedFixtures]);

  // ===== BACKGROUND REFRESH =====
  const refreshFinishedMatches = useCallback(async () => {
    await fetchFinishedFixtures();
  }, [fetchFinishedFixtures]);

  const backgroundRefresh = useBackgroundRefresh({
    screenType: "finished-matches",
    refreshCallback: refreshFinishedMatches,
    enabled: true,
    customConfig: {
      intervalMs: 180000,
      visualFeedback: false,
      smartScheduling: true,
    },
  });

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

  // ===== MANUAL REFRESH HANDLER =====
  const handleRefresh = useCallback(() => {
    console.log("🔄 MANUAL REFRESH: User pulled to refresh finished matches");
    fetchFinishedFixtures();
    if (onRefresh) {
      onRefresh();
    }
  }, [fetchFinishedFixtures, onRefresh]);

  // ===== FAVORITES MANAGEMENT =====
  const toggleFavorite = useCallback(
    async (matchId: number) => {
      const fixture = fixtures.find((f) => f.fixture.id === matchId);
      if (!fixture) return;

      try {
        const matchIdString = matchId.toString();
        const isCurrentlyFavorite =
          await favoritesService.isFavorite(matchIdString);

        if (isCurrentlyFavorite) {
          await removeFavorite(matchIdString);
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

          // ✅ Build full match object for addFavorite
          const matchForService = {
            id: matchIdString,
            sport: sport, // ✅ Use dynamic sport (basketball/football)
            league: fixture.league?.name || "Unknown League",
            status: (() => {
              const shortStatus = String(fixture.fixture.status?.short || "");
              if (
                shortStatus === "1H" ||
                shortStatus === "2H" ||
                shortStatus === "Q1" ||
                shortStatus === "Q2" ||
                shortStatus === "Q3" ||
                shortStatus === "Q4"
              ) {
                return "live";
              }
              if (shortStatus === "FT" || shortStatus === "AOT") {
                return "finished";
              }
              return "upcoming";
            })(),
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
            halfTimeScore: `${fixture.score?.halftime?.home || 0}-${fixture.score?.halftime?.away || 0}`,
            viewers: "1",
            hasVideo: false,
            isFavorite: true,
          };
          await addFavorite(matchForService);
          // Update local favorites map
          setFavoritesMap((prev) => ({ ...prev, [matchIdString]: true }));
        }

        refreshFavoritesCount();
        if (onFavoritesChange) {
          onFavoritesChange();
        }
      } catch (error) {
        console.error("Error toggling favorite:", error);
      }
    },
    [
      fixtures,
      sport,
      addFavorite,
      removeFavorite,
      refreshFavoritesCount,
      onFavoritesChange,
    ],
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
          status: fixture.fixture.status?.short || "FT",
          elapsed: fixture.fixture.status?.elapsed?.toString() || "90", // ✅ Finished matches typically at 90'
          league: fixture.league?.name || "",
          startTime: fixture.fixture.date,
          homeLogo: fixture.teams.home?.logo || "",
          awayLogo: fixture.teams.away?.logo || "",
          halftimeScore: `${fixture.score?.halftime?.home || 0}-${fixture.score?.halftime?.away || 0}`,
          from: "finished-matches",
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
    () => groupByChronologicalOrder(fixtures),
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
          sport={sport}
        />
      );
    },
    [sport, toggleFavorite, handleMatchPress, favoritesMap],
  );

  const renderCompetitionHeader = useCallback(
    ({ item }: { item: { competition: string; fixtures: Fixture[] } }) => (
      <View
        style={[
          styles.competitionHeader,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <View style={styles.headerContent}>
          <LeagueLogo
            leagueName={item.competition}
            apiLogoUrl={item.fixtures[0]?.league?.logo}
            leagueId={item.fixtures[0]?.league?.id}
            size={24}
            style={styles.leagueLogo}
          />
          <Text
            style={[styles.competitionHeaderText, { color: theme.colors.text }]}
          >
            {item.competition}
          </Text>
        </View>
      </View>
    ),
    [theme],
  );

  const renderCompetitionSection = useCallback(
    ({ item }: { item: { competition: string; fixtures: Fixture[] } }) => (
      <View style={styles.competitionSection}>
        {renderCompetitionHeader({ item })}
        {item.fixtures.map((fixture, index) => (
          <View key={`${fixture.fixture.id}-${fixture.fixture.date}-${index}`}>
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
          No finished matches for this date
        </Text>
        <Text
          style={[styles.emptySubText, { color: theme.colors.textSecondary }]}
        >
          Try selecting a different date
        </Text>
      </View>
    );
  }

  // ===== MAIN RENDER =====
  return (
    <View style={styles.container}>
      {internalRefreshing && fixtures.length === 0 && (
        <View style={[styles.loadingContainer, { pointerEvents: "none" }]}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text
            style={[styles.loadingText, { color: theme.colors.textSecondary }]}
          >
            Loading finished matches...
          </Text>
        </View>
      )}

      <FlatList
        ref={flatListRef}
        data={competitionGroups}
        renderItem={renderCompetitionSection}
        keyExtractor={(item, index) =>
          `${item.competition}-${index}-${item.fixtures[0]?.fixture?.id || index}`
        }
        refreshing={refreshing || internalRefreshing}
        onRefresh={handleRefresh}
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
    marginBottom: 8,
    paddingHorizontal: 0,
  },
  favoriteButton: {
    paddingRight: 16,
    paddingTop: 4,
    width: 44,
    alignItems: "flex-start",
    justifyContent: "flex-start",
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
    marginLeft: 8,
  },
  centeredMatchContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  ftIndicatorContainer: {
    marginBottom: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  ftIndicator: {
    fontSize: 11,
    fontFamily: "Inter-Bold",
    fontWeight: "700",
    lineHeight: 11,
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
    marginTop: -20,
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
  finishedMatchStats: {
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
