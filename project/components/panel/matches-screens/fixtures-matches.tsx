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
import {
  Fixture,
  FootballFixturesResponse,
} from "@/types/football-fixtures-response";
import favoritesService from "@/services/favoritesService";
import { formatTeamName } from "@/utils/formatTeamName";
import { formatMatchTime, getLocalDateForApi } from "@/utils/timeUtils";
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

// ===== INTERFACES =====
interface FixturesMatchesProps {
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
}

// ===== CONSTANTS =====
// ✅ RESTORED: Using original api-sports-service with TheSportsDB fallback (API-Football primary)
// ✅ BACKEND API: All API calls go through Supabase Edge Functions
import { backendApiService } from "../../../services/backendApiService";

// ===== UTILITY FUNCTIONS =====
const groupByChronologicalOrder = (fixtures: Fixture[]) => {
  const grouped: {
    [key: string]: { competition: string; fixtures: Fixture[] };
  } = {};

  fixtures.forEach((fixture) => {
    // ✅ 100% RAW API DATA: Use league name exactly as received from API - NO transformations, NO hardcoded names, NO normalization
    let competition = fixture.league?.name || null;
    const leagueCountry = fixture.league?.country || null;

    // ✅ CRITICAL: If API doesn't provide league name, use country + "League" as fallback (still API-driven)
    if (!competition || competition.trim() === "") {
      if (leagueCountry) {
        competition = `${leagueCountry} League`; // Use API country data
      } else {
        competition = "Unknown Competition";
      }
    } else {
      // ✅ MINIMAL CLEANUP: Only remove numerical prefixes (formatting cleanup, not content change)
      competition = competition
        .replace(/^\[?\d+\]?\s*[-.]?\s*/, "")
        .trim();
      competition = competition.replace(/\(\d+\)/g, "").trim();
      competition = competition.replace(/^\d+\s*[-.]?\s*/, "").trim();

      // ✅ CRITICAL: If API returns generic name like "Premier League" for multiple countries,
      // use API country field to differentiate (still 100% API data, no hardcoding)
      if (leagueCountry && 
          competition.toLowerCase() === "premier league" &&
          leagueCountry.toLowerCase() !== "england" &&
          leagueCountry.toLowerCase() !== "world") {
        competition = `${leagueCountry} ${competition}`; // Use API country + API name
      }
    }

    // ✅ CRITICAL: All names come from API - league.name, league.country, or combination of both
    // NO hardcoded mappings, NO normalization services, NO transformations beyond API data

    if (!grouped[competition]) {
      grouped[competition] = {
        competition,
        fixtures: [],
      };
    }

    grouped[competition].fixtures.push(fixture);
  });

  // Sort fixtures within each competition by date (earliest first)
  Object.keys(grouped).forEach((key) => {
    grouped[key].fixtures.sort(
      (a, b) =>
        new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime(),
    );
  });

  // ✅ MAINTAIN CHRONOLOGICAL ORDER: Return competitions in order of earliest match time
  // This ensures time flow is never broken by object key ordering
  const groupedArray = Object.values(grouped);
  groupedArray.sort((a, b) => {
    const firstMatchA = a.fixtures[0];
    const firstMatchB = b.fixtures[0];
    return new Date(firstMatchA.fixture.date).getTime() - new Date(firstMatchB.fixture.date).getTime();
  });

  return groupedArray;
};

// ===== MATCH ITEM COMPONENT =====
const MatchItem: React.FC<MatchItemProps> = React.memo(
  ({ fixture, onToggleFavorite, onPress }) => {
    const theme = useTheme();
    const { settings } = useMatchSettings();

    // ===== STATE =====
    const [isFavorite, setIsFavorite] = useState(false);
    const [enhancedData, setEnhancedData] = useState<EnhancedMatchData | null>(
      null,
    );

    // ===== ENHANCED DATA LOADING (FOR FIXTURE MATCHES) =====
    useEffect(() => {
      if (!fixture.fixture?.id) return;

      const loadEnhancedData = async () => {
        if (
          fixture.teams?.home?.id &&
          fixture.teams?.away?.id &&
          fixture.league?.id
        ) {
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
              fixture.league?.country || null,
            );
            setEnhancedData(data);
          } catch (error) {
            console.error("Error loading enhanced data:", error);
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

    const isUpcomingMatch = () => {
      const status = fixture.fixture.status?.short;
      return ["NS", "TBD", "PST"].includes(status || "");
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
    const isUpcoming = isUpcomingMatch();

    // ===== RENDER =====
    return (
      <TouchableOpacity
        style={[
          styles.matchItem,
          {
            backgroundColor: theme.colors.backgroundSecondary,
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

              {/* VS Section for Fixtures */}
              <View style={styles.scoreSection}>
                <View style={styles.upcomingMatchCenter}>
                  <Text
                    style={[
                      styles.nsStatusCenter,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    NS
                  </Text>
                  <Text style={[styles.vsText, { color: "#888888" }]}>VS</Text>
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

              {/* Broadcast Icons */}
              <View style={styles.broadcastIconsContainer}>
                <BroadcastIcons
                  hasVideoBroadcast={getBroadcastInfo(fixture).hasVideoBroadcast}
                  size={20}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Bottom Row - Empty for fixtures */}
        <View style={styles.bottomRow}></View>
      </TouchableOpacity>
    );
  },
);

// ===== MAIN COMPONENT =====
export default function FixturesMatches({
  sport, // ✅ Sport prop added
  selectedDate,
  onFavoritesChange,
  onMatchCountChange,
  refreshing = false,
  onRefresh,
  headerComponent,
  onMatchesLoaded,
}: FixturesMatchesProps) {
  const theme = useTheme();
  const { refreshFavoritesCount } = useFavorites();
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);

  // ===== STATE =====
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [internalRefreshing, setInternalRefreshing] = useState(false);
  const [favoritesMap, setFavoritesMap] = useState<{ [key: string]: boolean }>({});

  // ===== DATA FETCHING FUNCTION =====
  const fetchFixtures = useCallback(async () => {
    try {
      console.log("🔄 [Backend API] FIXTURE FETCHING START:", { selectedDate });
      // ✅ REMOVED setInternalRefreshing(true) - no loading indicators!
      // Background refresh should be completely invisible to users

      // Backend API handles caching automatically
      let upcomingMatches: Fixture[] = [];

      // ✅ FIX TIMEZONE: Use local date instead of UTC to respect user's timezone
      const targetDate = selectedDate || getLocalDateForApi();
      console.log(`📡 [Backend API] Fetching fixture matches for sport: ${sport}, date: ${targetDate} (local timezone)`);
      
      const fixtureData = await backendApiService.getFixtures(sport, targetDate, false);

      upcomingMatches = fixtureData.filter((fixture: any) => {
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
        const fixtureSport = fixture.league?.sport || fixture.sportType || 'football';
        if (sport === 'basketball' && fixtureSport !== 'basketball') {
          console.warn(`🚫 REMOVING WRONG SPORT: ${fixture.teams?.home?.name || 'Unknown'} vs ${fixture.teams?.away?.name || 'Unknown'} is ${fixtureSport}, expected basketball`);
          return false;
        }
        if (sport === 'football' && fixtureSport === 'basketball') {
          console.warn(`🚫 REMOVING WRONG SPORT: ${fixture.teams?.home?.name || 'Unknown'} vs ${fixture.teams?.away?.name || 'Unknown'} is ${fixtureSport}, expected football`);
          return false;
        }
        
        const status = fixture.fixture.status?.short;
        return ["NS", "TBD", "PST"].includes(status || "");
      });

      setFixtures(upcomingMatches);
      if (onMatchCountChange) onMatchCountChange(upcomingMatches.length);

      if (onMatchesLoaded) {
        const matches = upcomingMatches.map(
          (fixture): Match => ({
            id: fixture.fixture.id.toString(),
            sport: sport, // ✅ Use dynamic sport instead of hardcoded "football"
            league: fixture.league?.name || "",
            status: "upcoming" as const,
            statusText: fixture.fixture.status?.long || "Not Started",
            startTime: fixture.fixture.date,
            home: {
              name: fixture.teams?.home?.name || "",
              logo: fixture.teams?.home?.logo || undefined,
              score: 0,
            },
            away: {
              name: fixture.teams?.away?.name || "",
              logo: fixture.teams?.away?.logo || undefined,
              score: 0,
            },
            score: "0-0",
            halfTimeScore: "0-0",
            viewers: "0",
            hasVideo: false,
            isFavorite: false,
            addedTime: "",
          }),
        );
        onMatchesLoaded(matches);
      }

      setError(null);
    } catch (err) {
      console.error("Error fetching fixture matches:", err);
      setError("Failed to load fixture matches");
    }
    // ✅ REMOVED finally block - no loading state updates!
  }, [sport, selectedDate, onMatchCountChange, onMatchesLoaded]); // ✅ Add sport to dependencies

  // Background refresh functionality
  const backgroundRefresh = useBackgroundRefresh({
    screenType: "fixture-matches",
    refreshCallback: fetchFixtures,
    enabled: true,
    customConfig: {
      intervalMs: 90000, // 1.5 minutes
      visualFeedback: false,
      smartScheduling: true,
    },
  });

  // ===== INITIAL DATA LOADING =====
  useEffect(() => {
    fetchFixtures();
  }, [fetchFixtures]);

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
          setFavoritesMap(prev => ({ ...prev, [matchIdString]: false }));
        } else {
          // ✅ BASKETBALL FIX: Get correct scores based on sport
          const scores = (fixture as any).scores;
          const homeScore = sport === "basketball" 
            ? (scores?.home?.total ?? 0)
            : (fixture.goals?.home ?? 0);
          const awayScore = sport === "basketball"
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
          setFavoritesMap(prev => ({ ...prev, [matchIdString]: true }));
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
          homeScore: "0",
          awayScore: "0",
          status: fixture.fixture.status?.short || "NS",
          elapsed: "0", // ✅ Upcoming matches haven't started
          startTime: fixture.fixture.date,
          league: fixture.league?.name || "",
          homeLogo: fixture.teams.home?.logo || "",
          awayLogo: fixture.teams.away?.logo || "",
          halftimeScore: "0-0",
          from: "fixture-matches",
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
              style={[styles.competitionHeaderText, { color: theme.colors.text }]}
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
          No upcoming fixtures for this date
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
            Loading fixtures...
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
    marginBottom: 1,
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
  centeredMatchContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
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
  fixtureVsSection: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 60,
  },
  fixtureVsContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  fixtureStatusText: {
    fontSize: 12,
    fontFamily: "Inter-Medium",
    marginBottom: 2,
    fontWeight: "500",
  },
  fixtureVsText: {
    fontSize: 16,
    fontFamily: "Inter-Bold",
    fontWeight: "600",
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingLeft: 8,
  },
  fixtureBottomStatus: {
    fontSize: 12,
    fontFamily: "Inter-Regular",
    textAlign: "center",
    opacity: 0.7,
  },
  matchSpacer: {
    height: 8,
    backgroundColor: "#F5F5F5",
    opacity: 0.6,
    marginHorizontal: 0,
    width: "100%",
  },
  // Fixture-specific styles (new ones only)
  nsStatusTop: {
    fontSize: 10,
    fontFamily: "Inter-Regular",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: "rgba(102, 102, 102, 0.1)",
    overflow: "hidden",
  },
  upcomingMatchCenter: {
    alignItems: "center",
    paddingHorizontal: 8,
  },
  vsText: {
    fontSize: 16,
    fontFamily: "Inter-Bold",
    fontWeight: "700",
  },
  scoreSection: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 70,
    marginTop: -20,
    paddingHorizontal: 8,
  },
  yellowCard: {
    backgroundColor: "#FFD700",
    width: 16,
    height: 16,
    borderRadius: 2,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 4,
  },
  cardText: {
    color: "#000",
    fontSize: 10,
    fontWeight: "bold",
  },
  fixtureStatus: {
    fontSize: 10,
    fontFamily: "Inter-Regular",
    textAlign: "center",
  },
  nsStatusCenter: {
    fontSize: 10,
    fontFamily: "Inter-Regular",
    color: "#666666",
    marginBottom: 8,
  },
});
