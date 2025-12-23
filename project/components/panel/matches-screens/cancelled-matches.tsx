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
import { Star, Users, XCircle } from "lucide-react-native";
import { useTheme } from "@/hooks/useTheme";
import { useFavorites } from "@/hooks/useFavorites";
import { useMatchSettings } from "@/contexts/MatchSettingsContext";
import { Match } from "@/types/match";
import { usePathname, useRouter } from "expo-router";
import {
  Fixture,
  FootballFixturesResponse,
} from "@/types/football-fixtures-response";
import favoritesService from "@/services/favoritesService";
import { formatTeamName } from "@/utils/formatTeamName";
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
interface CancelledMatchesProps {
  sport: string; // ✅ Add sport parameter
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

// ===== SERVICES INITIALIZATION =====
// ✅ BACKEND API: All API calls go through Supabase Edge Functions
// API keys stored securely in backend, not exposed in frontend
// Backend automatically handles fallback: API-Football → TheSportsDB → RapidAPI → Football-Data.org
import { backendApiService } from "../../../services/backendApiService";

// ===== UTILITY FUNCTIONS =====
const groupByCompetition = (fixtures: Fixture[]) => {
  const groups: { [competition: string]: Fixture[] } = {};

  fixtures.forEach((fixture) => {
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
    
    // ✅ API-DRIVEN: Handle Ligue 1 disambiguation
    if (leagueCountry && 
        competitionName.toLowerCase() === "ligue 1" &&
        leagueCountry.toLowerCase() !== "france" &&
        leagueCountry.toLowerCase() !== "world") {
      competitionName = `${leagueCountry} - ${competitionName}`;
    }

    if (!groups[competitionName]) {
      groups[competitionName] = [];
    }
    groups[competitionName].push(fixture);
  });

  // ✅ MAINTAIN CHRONOLOGICAL ORDER: Keep competitions in order of most recent match
  // This ensures time flow is never broken by alphabetical sorting
  const competitionsByTime = Object.keys(groups).sort((a, b) => {
    const firstMatchA = groups[a][0];
    const firstMatchB = groups[b][0];
    return new Date(firstMatchB.fixture.date).getTime() - new Date(firstMatchA.fixture.date).getTime();
  });

  return competitionsByTime.map((competition) => ({
    competition,
    fixtures: groups[competition].sort((a, b) => {
      // Sort by most recent first
      return (
        new Date(b.fixture.date).getTime() - new Date(a.fixture.date).getTime()
      );
    }),
  }));
};

// ===== MATCH ITEM COMPONENT =====
const MatchItem: React.FC<MatchItemProps> = React.memo(
  ({ fixture, onToggleFavorite, onPress }) => {
    const theme = useTheme();
    const [isFavorite, setIsFavorite] = useState(false);
    const [enhancedData, setEnhancedData] = useState<EnhancedMatchData | null>(
      null,
    );

    // ===== ENHANCED DATA LOADING (FOR CANCELLED MATCHES) =====
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
    const getStatusText = () => {
      const status = fixture.fixture.status?.short;
      switch (status) {
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
          return status || "CANCELLED";
      }
    };

    const getStatusColor = () => {
      const status = fixture.fixture.status?.short;
      switch (status) {
        case "CANC":
        case "ABD":
          return "#FF4444";
        case "SUSP":
        case "INT":
          return "#FF8800";
        case "PST":
          return "#888888";
        default:
          return "#FF4444";
      }
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
    const statusText = getStatusText();
    const statusColor = getStatusColor();

    // ===== RENDER =====
    return (
      <TouchableOpacity
        style={[
          styles.matchItem,
          { backgroundColor: theme.colors.backgroundSecondary },
        ]}
        onPress={handleMatchPress}
        activeOpacity={0.7}
      >
        {/* Top Row - Start Time and Status */}
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
            <View style={styles.statusContainer}>
              <XCircle size={14} color={statusColor} />
              <Text style={[styles.statusText, { color: statusColor }]}>
                {statusText}
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
                        { color: theme.colors.text, opacity: 0.7 },
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

              {/* Score - Show as cancelled */}
              <View style={styles.scoreSection}>
                <Text
                  style={[
                    styles.cancelledScore,
                    {
                      color: statusColor,
                      fontSize: 16,
                      fontWeight: "700",
                    },
                  ]}
                >
                  vs
                </Text>
              </View>

              {/* Away Team */}
              <View style={styles.awayTeamSection}>
                <View style={styles.awayTeamContainer}>
                  <View style={styles.awayTeamWithRanking}>
                    <Text
                      style={[
                        styles.teamName,
                        styles.awayTeamName,
                        { color: theme.colors.text, opacity: 0.7 },
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

        {/* Bottom Row - Match Date */}
        <View style={styles.bottomRow}>
          <Text
            style={[styles.matchDate, { color: theme.colors.textSecondary }]}
          >
            {new Date(fixture.fixture.date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </Text>
        </View>
      </TouchableOpacity>
    );
  },
);

// ===== MAIN CANCELLED MATCHES FOOTBALL COMPONENT =====
export default function CancelledMatches({
  sport,
  selectedDate,
  onFavoritesChange,
  onMatchCountChange,
  refreshing = false,
  onRefresh,
  headerComponent,
  onMatchesLoaded,
}: CancelledMatchesProps) {
  const theme = useTheme();
  const { refreshFavoritesCount } = useFavorites();
  const pathname = usePathname();
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);

  // ===== STATE =====
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [internalRefreshing, setInternalRefreshing] = useState(false);
  const [favoritesMap, setFavoritesMap] = useState<{ [key: string]: boolean }>({});

  // ===== DATA FETCHING =====
  const fetchFixtures = useCallback(async () => {
    try {
      // ✅ REMOVED setInternalRefreshing(true) - no loading indicators!
      // Background refresh should be completely invisible to users
      console.log("🔄 [Backend API] CANCELLED MATCHES: Fetching cancelled matches data");

      let allFixtures: Fixture[] = [];

      if (selectedDate) {
        // ✅ BACKEND API: Fetch matches for selected date from Supabase Edge Functions
        console.log(`📡 [Backend API] Fetching cancelled matches for sport: ${sport}, date: ${selectedDate}`);
        const fixtureData = await backendApiService.getFixtures(sport, selectedDate, false);
        const finishedData = await backendApiService.getFinishedMatches(sport, selectedDate, false);
        allFixtures = [...fixtureData, ...finishedData];
      } else {
        // Get cancelled/suspended matches from the last 30 days
        const today = new Date();

        // ✅ BACKEND API: Fetch from multiple days
        const fetchPromises = [];
        for (let i = 0; i < 30; i++) {
          const fetchDate = new Date(today);
          fetchDate.setDate(fetchDate.getDate() - i);
          const dateStr = fetchDate.toISOString().split("T")[0];

          fetchPromises.push(
            Promise.all([
              backendApiService.getFixtures(sport, dateStr, false).catch(() => []),
              backendApiService.getFinishedMatches(sport, dateStr, false).catch(() => []),
            ]).then(([fixtures, finished]) => [...fixtures, ...finished])
          );
        }

        const results = await Promise.all(fetchPromises);
        allFixtures = results.flat();

        // Remove duplicates
        const uniqueFixtures = allFixtures.filter(
          (fixture, index, array) =>
            array.findIndex((f) => f.fixture.id === fixture.fixture.id) ===
            index,
        );
        allFixtures = uniqueFixtures;
      }

      // Filter for cancelled, abandoned, suspended, interrupted, or postponed matches
      const cancelledFixtures = allFixtures.filter((fixture) => {
        if (!fixture || !fixture.fixture || !fixture.fixture.status) {
          return false;
        }
        const status = fixture.fixture.status?.short as string;
        return ["CANC", "ABD", "SUSP", "INT", "PST"].includes(status);
      });

      console.log(
        `✅ [Backend API] CANCELLED MATCHES LOADED: ${cancelledFixtures.length} matches`,
      );

      setFixtures(cancelledFixtures);
      if (onMatchCountChange) {
        onMatchCountChange(cancelledFixtures.length);
      }

      // Convert to Match format for parent callback
      if (onMatchesLoaded) {
        const matches = cancelledFixtures.map(
          (fixture): Match => ({
            id: fixture.fixture.id.toString(),
            sport: "football",
            league: fixture.league?.name || "",
            status: "finished", // Cancelled matches are considered finished
            statusText: fixture.fixture.status?.long || "Cancelled",
            startTime: fixture.fixture.date,
            time: undefined,
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
            score: "CANCELLED",
            halfTimeScore: "-",
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
      console.error("Error fetching cancelled matches:", err);
      setError("Failed to load cancelled matches");
    }
    // ✅ REMOVED finally block - no loading state updates!
  }, [selectedDate, onMatchCountChange, onMatchesLoaded]);

  // ===== INITIAL FETCH =====
  useEffect(() => {
    fetchFixtures();
  }, [fetchFixtures]);

  // ===== MANUAL REFRESH HANDLER =====
  const handleRefresh = useCallback(() => {
    console.log("🔄 MANUAL REFRESH: User pulled to refresh cancelled matches");
    fetchFixtures();
    if (onRefresh) {
      onRefresh();
    }
  }, [fetchFixtures, onRefresh]);

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
        } else {
          // Convert fixture to match format for the general service
          const matchForService = {
            id: matchIdString,
            sport: "football",
            league: fixture.league?.name || "Unknown League",
            status:
              fixture.fixture.status?.short === "1H" ||
              fixture.fixture.status?.short === "2H"
                ? "live"
                : fixture.fixture.status?.short === "FT"
                  ? "finished"
                  : "upcoming",
            statusText: fixture.fixture.status?.long || "",
            startTime:
              fixture.fixture.date ||
              new Date().toISOString(), // Use current date
            home: {
              name: fixture.teams.home?.name || "Home Team",
              logo: fixture.teams.home?.logo || "",
            },
            away: {
              name: fixture.teams.away?.name || "Away Team",
              logo: fixture.teams.away?.logo || "",
            },
            score: `${fixture.goals?.home || 0}-${fixture.goals?.away || 0}`,
            halfTimeScore: "0-0",
            viewers: "1",
            hasVideo: false,
            isFavorite: true,
          };

          await favoritesService.addToFavorites(matchForService);
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
          sport: sport, // ✅ Pass sport parameter
          homeTeam: fixture.teams.home?.name || "",
          awayTeam: fixture.teams.away?.name || "",
          homeTeamId: fixture.teams.home?.id?.toString() || "", // ✅ CRITICAL: Pass team IDs for enhanced data
          awayTeamId: fixture.teams.away?.id?.toString() || "", // ✅ CRITICAL: Pass team IDs for enhanced data
          leagueId: fixture.league?.id?.toString() || "", // ✅ CRITICAL: Pass league ID for enhanced data
          homeScore: fixture.goals?.home?.toString() || "0",
          awayScore: fixture.goals?.away?.toString() || "0",
          status: fixture.fixture.status?.short || "CANC",
          elapsed: fixture.fixture.status?.elapsed?.toString() || "0", // ✅ Pass elapsed time
          startTime: fixture.fixture.date,
          league: fixture.league?.name || "",
          homeLogo: fixture.teams.home?.logo || "",
          awayLogo: fixture.teams.away?.logo || "",
          halftimeScore: `${fixture.score?.halftime?.home || 0}-${fixture.score?.halftime?.away || 0}`,
          from: "cancelled-matches",
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
          No cancelled matches found
        </Text>
        <Text
          style={[styles.emptySubText, { color: theme.colors.textSecondary }]}
        >
          Cancelled matches from the last 30 days will appear here
        </Text>
      </View>
    );
  }

  // ===== MAIN RENDER =====
  return (
    <View style={styles.container}>
      {internalRefreshing && fixtures.length === 0 && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text
            style={[styles.loadingText, { color: theme.colors.textSecondary }]}
          >
            Loading cancelled matches...
          </Text>
        </View>
      )}

      <FlatList
        ref={flatListRef}
        data={competitionGroups}
        renderItem={renderCompetitionSection}
        keyExtractor={(item, index) => `${item.competition}-${index}`}
        refreshing={refreshing || internalRefreshing}
        onRefresh={handleRefresh}
        ListHeaderComponent={headerComponent}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={3}
        updateCellsBatchingPeriod={100}
        initialNumToRender={2}
        windowSize={3}
      />
    </View>
  );
}

// ===== STYLES =====
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
  loadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.1)",
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
  scoreSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 70,
    paddingHorizontal: 8,
  },
  cancelledScore: {
    fontSize: 16,
    fontFamily: "Inter-Bold",
    fontWeight: "700",
    minWidth: 20,
    textAlign: "center",
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingLeft: 8,
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
