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
import { Star, Users, Flag, Heart, ChevronRight } from "lucide-react-native";
import { Ionicons } from "@expo/vector-icons";
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

// ===== INTERFACES =====
interface FollowedMatchesProps {
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

  // Sort competitions alphabetically (API-driven, no hard-coded priorities)
  const sortedCompetitions = Object.keys(groups).sort((a, b) => {
    return a.localeCompare(b);
  });

  return sortedCompetitions.map((competition) => ({
    competition,
    fixtures: groups[competition].sort((a, b) => {
      // Sort followed matches by status priority and time
      const getPriority = (status: string | null) => {
        if (!status) return 4;
        // ✅ BASKETBALL FIX: Include basketball live statuses (Q1, Q2, Q3, Q4, OT)
        if (["1H", "2H", "HT", "ET", "BT", "P", "Q1", "Q2", "Q3", "Q4", "OT"].includes(status)) return 1; // Live first
        if (status === "NS") return 2; // Upcoming second
        return 3; // Finished third
      };

      const priorityA = getPriority(a.fixture.status.short);
      const priorityB = getPriority(b.fixture.status.short);

      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      const startTimeA = new Date(a.fixture.date).getTime();
      const startTimeB = new Date(b.fixture.date).getTime();

      if (startTimeA !== startTimeB) {
        return startTimeA - startTimeB; // Earlier start times first
      }

      // For matches starting at same time, sort by elapsed time (more advanced first)
      const elapsedA = a.fixture.status?.elapsed || 0;
      const elapsedB = b.fixture.status?.elapsed || 0;
      return elapsedB - elapsedA;
    }),
  }));
};

// ===== HORIZONTAL FOOTBALL MATCH ITEM COMPONENT =====
const MatchItem: React.FC<MatchItemProps> = React.memo(
  ({ fixture, onToggleFavorite, onPress }) => {
    const theme = useTheme();
    const { settings } = useMatchSettings();

    // ===== STATE =====
    const [isFavorite, setIsFavorite] = useState(true); // Always true for followed matches
    const [isRemoving, setIsRemoving] = useState(false);

    // ===== UTILITY FUNCTIONS =====
    const getMatchStatus = () => {
      const status = fixture.fixture.status;
      if (!status) return { text: "", color: theme.colors.textSecondary };

      const short = String(status.short || "");
      
      // Live matches
      if (["1H", "2H", "HT", "ET", "BT", "P"].includes(short)) {
        return { text: "LIVE", color: "#FF4444" };
      }
      
      // Finished matches
      if (["FT", "AET", "PEN"].includes(short)) {
        return { text: "FT", color: theme.colors.textSecondary };
      }
      
      // Upcoming matches
      if (["NS", "TBD", "PST"].includes(short)) {
        return { text: "NS", color: theme.colors.textSecondary };
      }
      
      // Other statuses
      return { text: short, color: theme.colors.textSecondary };
    };

    const getFormattedTime = () => {
      return new Date(fixture.fixture.date).toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
      });
    };

    // ===== EVENT HANDLERS =====
    const handleFavoritePress = async () => {
      if (isRemoving) return;
      setIsRemoving(true);
      try {
        await onToggleFavorite(fixture.fixture.id);
        setIsFavorite(false);
      } catch (error) {
        console.error("❌ Error unfollowing match:", error);
        setIsFavorite(true);
      } finally {
        setIsRemoving(false);
      }
    };

    const handleMatchPress = () => {
      onPress(fixture);
    };

    // ===== COMPUTED VALUES =====
    const matchStatus = getMatchStatus();
    const formattedTime = getFormattedTime();
    const isLive = matchStatus.text === "LIVE";

    // ===== RENDER - HORIZONTAL LAYOUT =====
    return (
      <TouchableOpacity
        style={[
          styles.horizontalMatchItem,
          {
            backgroundColor: theme.colors.backgroundSecondary,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
          },
        ]}
        onPress={handleMatchPress}
        activeOpacity={0.7}
      >
        {/* Left Section - Time and Status */}
        <View style={styles.leftSection}>
          <Text style={[styles.horizontalTime, { color: theme.colors.textSecondary }]}>
            {formattedTime}
          </Text>
          <Text style={[styles.horizontalStatus, { color: matchStatus.color }]}>
            {matchStatus.text}
          </Text>
        </View>

        {/* Star Button */}
        <TouchableOpacity
          style={[styles.horizontalStarButton, { opacity: isRemoving ? 0.5 : 1 }]}
          onPress={handleFavoritePress}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          disabled={isRemoving}
        >
          <Star
            size={20}
            color={isFavorite ? "#FF4444" : "#666666"}
            fill={isFavorite ? "#FF4444" : "none"}
          />
        </TouchableOpacity>

        {/* Middle Section - Teams */}
        <View style={styles.middleSection}>
          <Text
            style={[styles.horizontalTeamName, { color: theme.colors.text }]}
            numberOfLines={
              fixture.teams.home?.name &&
              fixture.teams.home.name.split(" ").length > 2
                ? 2
                : 1
            }
            ellipsizeMode={
              (fixture.teams.home?.name?.length || 0) > 30 ? "tail" : "clip"
            }
          >
            {formatTeamName(fixture.teams.home?.name || "")}
          </Text>
          <Text style={[styles.vsText, { color: theme.colors.textSecondary }]}>
            VS
          </Text>
          <Text
            style={[styles.horizontalTeamName, { color: theme.colors.text }]}
            numberOfLines={
              fixture.teams.away?.name &&
              fixture.teams.away.name.split(" ").length > 2
                ? 2
                : 1
            }
            ellipsizeMode={
              (fixture.teams.away?.name?.length || 0) > 30 ? "tail" : "clip"
            }
          >
            {formatTeamName(fixture.teams.away?.name || "")}
          </Text>
        </View>

        {/* Right Section - Arrow */}
        <View style={styles.rightSection}>
          <ChevronRight size={20} color={theme.colors.textSecondary} />
        </View>
      </TouchableOpacity>
    );
  },
);

// ===== MAIN FOLLOWED MATCHES FOOTBALL COMPONENT =====
export default function FollowedMatches({
  sport, // ✅ Sport prop added
  onFavoritesChange,
  onMatchCountChange,
  refreshing = false,
  onRefresh,
  headerComponent,
  onMatchesLoaded,
}: FollowedMatchesProps): React.JSX.Element {
  const theme = useTheme();
  const { refreshFavoritesCount, addFavorite, removeFavorite } = useFavorites();
  const pathname = usePathname();
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);

  // ===== STATE =====
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [internalRefreshing, setInternalRefreshing] = useState(false);
  const [favoritesMap, setFavoritesMap] = useState<{ [key: string]: boolean }>({});
  const [sportFilter, setSportFilter] = useState<"all" | "football" | "basketball">("all");

  // ===== DATA FETCHING FUNCTION =====
  const fetchFollowedMatches = useCallback(async () => {
    try {
      // ✅ REMOVED setInternalRefreshing(true) - no loading indicators!
      // Background refresh should be completely invisible to users
      console.log("🔄 FOLLOWED MATCHES: Fetching followed matches data");

      // Get user's favorite matches using the general service
      const favorites = await favoritesService.getFavorites();
      
      console.log(`📋 RETRIEVED FAVORITES:`, favorites);
      console.log(`📋 Total favorites: ${favorites.length}`);
      favorites.forEach((fav, index) => {
        console.log(`   ${index + 1}. ID: ${fav.id}, Sport: ${fav.sport}, Match: ${fav.homeTeam} vs ${fav.awayTeam}`);
      });

      if (!favorites || favorites.length === 0) {
        console.log("⚠️ NO FAVORITES FOUND - Showing empty state");
        setFixtures([]);
        if (onMatchCountChange) onMatchCountChange(0);
        if (onMatchesLoaded) onMatchesLoaded([]);
        setError(null);
        return;
      }

      // ✅ API-DRIVEN: Fetch actual match data from API using saved match IDs
      console.log(`🔄 Fetching actual match data from API for ${favorites.length} favorites`);
      
      const allFixtures: (Fixture & { sportType?: string })[] = [];
      
      // Fetch all matches from API (live, upcoming, finished)
      const [liveMatches, upcomingMatches, finishedMatches] = await Promise.allSettled([
        backendApiService.getLiveMatches(sport, true),
        backendApiService.getFixtures(sport, undefined, true),
        backendApiService.getFinishedMatches(sport, undefined, true),
      ]);
      
      // Combine all matches
      const allApiMatches: Fixture[] = [];
      if (liveMatches.status === 'fulfilled') allApiMatches.push(...liveMatches.value);
      if (upcomingMatches.status === 'fulfilled') allApiMatches.push(...upcomingMatches.value);
      if (finishedMatches.status === 'fulfilled') allApiMatches.push(...finishedMatches.value);
      
      console.log(`📊 Fetched ${allApiMatches.length} total matches from API`);
      
      // Match favorites with API data
      for (const favorite of favorites) {
        const fixtureId = parseInt(favorite.id);
        
        // Find match in API data
        const apiFixture = allApiMatches.find(m => m.fixture?.id === fixtureId);
        
        if (apiFixture) {
          // ✅ USE REAL API DATA: Complete fixture with all IDs, logos, venue, etc.
          console.log(`✅ Found API data for ${favorite.homeTeam} vs ${favorite.awayTeam}`);
          allFixtures.push({
            ...apiFixture,
            sportType: favorite.sport
          });
        } else {
          // ⚠️ FALLBACK: Create basic fixture from saved data (for old/removed matches)
          console.log(`⚠️ No API data for ${favorite.homeTeam} vs ${favorite.awayTeam} - using local data`);
          const localFixture: Fixture & { sportType?: string } = {
            fixture: {
              id: fixtureId,
              referee: null,
              timezone: "UTC",
              date: favorite.startTime,
              timestamp: Math.floor(new Date(favorite.startTime).getTime() / 1000),
              periods: { first: null, second: null },
              venue: { id: null, name: null, city: null },
              status: {
                long: favorite.status === "live" ? "In Play" : favorite.status === "finished" ? "Match Finished" : "Not Started",
                short: favorite.status === "live" ? "1H" : favorite.status === "finished" ? "FT" : "NS",
                elapsed: favorite.status === "live" ? 45 : null,
                extra: null
              }
            },
            league: {
              id: 0,
              name: favorite.league,
              country: "",
              logo: null,
              flag: null
            },
            teams: {
              home: { id: 0, name: favorite.homeTeam, logo: null },
              away: { id: 0, name: favorite.awayTeam, logo: null }
            },
            goals: { home: 0, away: 0 },
            score: {
              halftime: { home: 0, away: 0 },
              fulltime: { home: null, away: null },
              extratime: { home: null, away: null },
              penalty: { home: null, away: null }
            },
            events: [],
            sportType: favorite.sport
          };
          
          allFixtures.push(localFixture);
        }
      }
      
      console.log(`📊 FINAL RESULT: ${allFixtures.length} fixtures fetched out of ${favorites.length} favorites`);
      if (allFixtures.length > 0) {
        console.log(`📋 Successfully fetched fixtures:`, allFixtures.map(f => ({ 
          id: f.fixture.id, 
          sport: f.sportType, 
          teams: `${f.teams.home?.name} vs ${f.teams.away?.name}`,
          status: f.fixture.status?.short
        })));
      } else {
        console.error(`❌ CRITICAL: NO FIXTURES WERE FETCHED! All API calls failed.`);
      }

      setFixtures(allFixtures);
      if (onMatchCountChange) onMatchCountChange(allFixtures.length);

      if (onMatchesLoaded) {
        const matches = allFixtures.map(
          (fixture): Match => ({
            id: fixture.fixture.id.toString(),
            sport: sport, // ✅ Use dynamic sport instead of hardcoded "football"
            league: fixture.league?.name || "",
            status:
              fixture.fixture.status?.short === "FT"
                ? "finished"
                : ["1H", "2H", "HT", "ET", "BT", "P"].includes(
                      fixture.fixture.status?.short || "",
                    )
                  ? "live"
                  : "upcoming",
            statusText: fixture.fixture.status?.long || "Not Started",
            startTime: fixture.fixture.date,
            home: {
              name: fixture.teams?.home?.name || "",
              logo: fixture.teams?.home?.logo || undefined,
              score: fixture.goals?.home ?? 0,
            },
            away: {
              name: fixture.teams?.away?.name || "",
              logo: fixture.teams?.away?.logo || undefined,
              score: fixture.goals?.away ?? 0,
            },
            score: `${fixture.goals?.home ?? 0}-${fixture.goals?.away ?? 0}`,
            halfTimeScore: `${fixture.score?.halftime?.home ?? 0}-${fixture.score?.halftime?.away ?? 0}`,
            viewers: "", // API doesn't provide viewer data
            hasVideo: false,
            isFavorite: true,
            addedTime: "",
          }),
        );
        onMatchesLoaded(matches);
      }

      setError(null);
    } catch (err) {
      console.error("Error fetching followed matches:", err);
      setError("Failed to load followed matches");
    }
    // ✅ REMOVED finally block - no loading state updates!
  }, [sport, onMatchCountChange, onMatchesLoaded]); // ✅ Add sport to dependencies

  // Background refresh functionality
  const backgroundRefresh = useBackgroundRefresh({
    screenType: "live-matches", // Use live-matches config for followed matches
    refreshCallback: fetchFollowedMatches,
    enabled: true,
    customConfig: {
      intervalMs: 25000, // 25 seconds for followed matches
      visualFeedback: false,
      smartScheduling: true,
    },
  });

  // ===== INITIAL DATA LOADING =====
  useEffect(() => {
    console.log("🔄 FOLLOWED MATCHES: Initial load triggered");
    // Force refresh favorites count to trigger cleanup
    refreshFavoritesCount(true);
    fetchFollowedMatches();
  }, [fetchFollowedMatches, refreshFavoritesCount]);

  // ===== CHECK FAVORITE STATUS FOR ALL FIXTURES =====
  useEffect(() => {
    const checkAllFavorites = async () => {
      const favMap: { [key: string]: boolean } = {};
      for (const fixture of fixtures) {
        if (fixture.fixture?.id) {
          const matchIdString = fixture.fixture.id.toString();
          // All followed matches should be favorites
          favMap[matchIdString] = true;
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
        console.log(`🔄 === TOGGLE FAVORITE START ===`);
        console.log(`   Match ID: ${matchId} (type: ${typeof matchId})`);
        
        const fixture = fixtures.find((f) => f.fixture.id === matchId);
        if (!fixture) {
          console.error(`❌ Fixture not found for ID: ${matchId}`);
          return;
        }

        console.log(`   Fixture: ${fixture.teams.home?.name} vs ${fixture.teams.away?.name}`);

        const matchIdString = matchId.toString();
        console.log(`   Match ID string: "${matchIdString}"`);

        // Check if it's currently a favorite using the general service
        console.log(`🔍 Checking favorite status...`);
        const isCurrentlyFavorite = await favoritesService.isFavorite(matchIdString);
        console.log(`   Is currently favorite: ${isCurrentlyFavorite}`);

        if (isCurrentlyFavorite) {
          // ✅ INSTANT UI UPDATE: Remove from local state FIRST for immediate feedback
          console.log(`🗑️ === INSTANT REMOVAL FROM UI ===`);
          setFixtures((prev) => {
            const newFixtures = prev.filter((f) => f.fixture.id !== matchId);
            console.log(`📊 Local state updated instantly: ${prev.length} → ${newFixtures.length} fixtures`);
            return newFixtures;
          });
          
          // Update match count immediately
          if (onMatchCountChange) {
            const newCount = Math.max(0, fixtures.length - 1);
            console.log(`📊 Updating match count instantly to: ${newCount}`);
            onMatchCountChange(newCount);
          }
          
          // ✅ BACKGROUND SYNC: Remove from storage (don't wait for it)
          console.log(`🔄 === BACKGROUND REMOVAL FROM STORAGE ===`);
          console.log(`   Removing match ${matchIdString} from favorites...`);
          
          // Run storage removal in background - don't block UI
          favoritesService.removeFromFavorites(matchIdString)
            .then(() => {
              console.log(`✅ Background removal completed for match ${matchIdString}`);
              
              // Trigger callbacks
              if (onFavoritesChange) {
                console.log(`🔄 Calling onFavoritesChange callback`);
                onFavoritesChange();
              }
              
              // Force refresh favorites count to update UI globally
              refreshFavoritesCount(true);
              
              console.log(`✅ === TOGGLE FAVORITE COMPLETE ===`);
            })
            .catch((removeError) => {
              console.error(`❌ === BACKGROUND REMOVAL FAILED ===`);
              console.error(`   Error:`, removeError);
              console.error(`   Match may still appear in favorites - refresh to see actual state`);
              // Note: We already removed from UI, so user sees instant feedback
              // If removal fails, it will reappear on next refresh
            });
        } else {
          // This shouldn't happen in followed matches, but handle it gracefully
          console.log(
            `⚠️ Match ${matchIdString} was not in favorites, adding it back...`,
          );
          let success = false;
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
            startTime: fixture.fixture.date || new Date().toISOString(),
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
          success = true;

          if (success && onFavoritesChange) {
            onFavoritesChange();
          }

          console.log(
            `✅ Successfully re-added match ${matchIdString} to favorites`,
          );
        }
      } catch (error) {
        console.error("❌ CRITICAL ERROR in toggleFavorite:", error);
        console.error("❌ Error details:", {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          matchId,
        });
        // Don't throw error to prevent crash - just log it thoroughly
      }
    },
    [fixtures, onFavoritesChange, onMatchCountChange],
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
          homeTeamId: fixture.teams.home?.id?.toString() || "",
          awayTeamId: fixture.teams.away?.id?.toString() || "",
          homeLogo: fixture.teams.home?.logo || "",
          awayLogo: fixture.teams.away?.logo || "",
          homeScore: fixture.goals?.home?.toString() || "0",
          awayScore: fixture.goals?.away?.toString() || "0",
          status: fixture.fixture.status?.short || "NS",
          startTime: fixture.fixture.date,
          league: fixture.league?.name || "",
          leagueId: fixture.league?.id?.toString() || "",
          currentMinute: fixture.fixture.status?.elapsed?.toString() || "0",
          halfTimeScore: `${fixture.score?.halftime?.home || 0}-${fixture.score?.halftime?.away || 0}`,
          venueName: fixture.fixture.venue?.name || "",
          venueCity: fixture.fixture.venue?.city || "",
          venueCapacity: fixture.fixture.venue?.id?.toString() || "",
          from: "followed-matches",
        },
      });
    },
    [router, sport], // ✅ Include sport in dependencies
  );

  // ===== MEMOIZED VALUES =====
  // ✅ Filter fixtures based on sportFilter AND remove duplicates
  const filteredFixtures = useMemo(() => {
    let filtered = sportFilter === "all" 
      ? fixtures 
      : fixtures.filter((fixture) => {
          const fixtureWithSport = fixture as Fixture & { sportType?: string };
          return fixtureWithSport.sportType === sportFilter;
        });
    
    // ✅ REMOVE DUPLICATES: Some matches might be duplicated in the database
    // Use fixture ID as unique key to filter out duplicates
    const uniqueFixtures = filtered.filter((fixture, index, self) => 
      index === self.findIndex((f) => f.fixture.id === fixture.fixture.id)
    );
    
    console.log(`📊 Filtered fixtures: ${filtered.length}, Unique fixtures: ${uniqueFixtures.length}`);
    if (filtered.length !== uniqueFixtures.length) {
      console.warn(`⚠️ Found ${filtered.length - uniqueFixtures.length} duplicate matches in followed list`);
    }
    
    return uniqueFixtures;
  }, [fixtures, sportFilter]);

  const competitionGroups = useMemo(
    () => groupByCompetition(filteredFixtures),
    [filteredFixtures],
  );

  // ===== RENDER FUNCTIONS =====
  const renderMatchItem = useCallback(
    ({ item }: { item: Fixture }) => {
      // ✅ BASKETBALL SUPPORT: Check fixture's sportType instead of sport prop
      const fixtureWithSport = item as Fixture & { sportType?: string };
      const isBasketball = fixtureWithSport.sportType === "basketball";
      
      console.log(`🏀 Rendering match ${item.fixture.id}: sportType=${fixtureWithSport.sportType}, isBasketball=${isBasketball}`);
      
      if (isBasketball) {
        // Check favorite status from favorites map (should always be true for followed matches)
        const matchIdString = item.fixture.id.toString();
        const isFav = favoritesMap[matchIdString] !== undefined ? favoritesMap[matchIdString] : true;
        const basketballMatch = convertFixtureToBasketballMatch(item, isFav);
        
        console.log(`🏀 Using BasketballMatchItem for match ${item.fixture.id}`);
        return (
          <BasketballMatchItem
            match={basketballMatch}
            onToggleFavorite={() => toggleFavorite(item.fixture.id)}
            sport="basketball"
          />
        );
      }
      
      // Default: Use football match item (horizontal display removed HT/Corners)
      console.log(`⚽ Using MatchItem for football match ${item.fixture.id}`);
      return (
        <MatchItem
          fixture={item}
          onToggleFavorite={toggleFavorite}
          onPress={handleMatchPress}
        />
      );
    },
    [toggleFavorite, handleMatchPress, favoritesMap],
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
            {/* ✅ Show number of followed matches for this league */}
            <Text
              style={[styles.followedCountText, { color: theme.colors.textSecondary }]}
            >
              {item.fixtures.length} Followed
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

  // ✅ Create header component with sport filters (replaces "Your 1 Favorite Match")
  // MUST be defined before any conditional returns to follow React hooks rules
  const sportFilterHeader = useCallback(() => {
    if (fixtures.length === 0) return null;
    
    return (
      <View style={[styles.sportFilterContainer, { backgroundColor: theme.colors.backgroundSecondary }]}>
        <View style={styles.sportFilterButtons}>
          {/* All Button - Left Side */}
          <TouchableOpacity
            style={[
              styles.filterButton,
              sportFilter === "all" && styles.filterButtonActive,
              sportFilter === "all" && { borderColor: "#FF4444" },
            ]}
            onPress={() => setSportFilter("all")}
          >
            <Text
              style={[
                styles.filterButtonText,
                sportFilter === "all" && styles.filterButtonTextActive,
                { color: sportFilter === "all" ? "#FF4444" : theme.colors.textSecondary },
              ]}
            >
              All
            </Text>
          </TouchableOpacity>

          {/* Sport Icons Group - Right Side */}
          <View style={styles.iconButtonsGroup}>
            {/* Football Icon */}
            <TouchableOpacity
              style={[
                styles.iconButton,
                sportFilter === "football" && styles.iconButtonActive,
              ]}
              onPress={() => setSportFilter("football")}
            >
              <Ionicons
                name="football"
                size={22}
                color={sportFilter === "football" ? "#FF4444" : theme.colors.textSecondary}
              />
            </TouchableOpacity>

            {/* Basketball Icon */}
            <TouchableOpacity
              style={[
                styles.iconButton,
                sportFilter === "basketball" && styles.iconButtonActive,
              ]}
              onPress={() => setSportFilter("basketball")}
            >
              <Ionicons
                name="basketball"
                size={22}
                color={sportFilter === "basketball" ? "#FF4444" : theme.colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }, [fixtures.length, sportFilter, theme.colors.backgroundSecondary, theme.colors.textSecondary]);

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

  // Show empty state if no fixtures after filtering
  if (filteredFixtures.length === 0 && !internalRefreshing) {
    return (
      <View style={styles.container}>
        {/* Show filter UI even when empty */}
        {fixtures.length > 0 && (
          <View style={[styles.sportFilterContainer, { backgroundColor: theme.colors.backgroundSecondary }]}>
            <View style={styles.sportFilterButtons}>
              {/* All Button - Left Side */}
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  sportFilter === "all" && styles.filterButtonActive,
                  sportFilter === "all" && { borderColor: "#FF4444" },
                ]}
                onPress={() => setSportFilter("all")}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    sportFilter === "all" && styles.filterButtonTextActive,
                    { color: sportFilter === "all" ? "#FF4444" : theme.colors.textSecondary },
                  ]}
                >
                  All
                </Text>
              </TouchableOpacity>

              {/* Sport Icons Group - Right Side */}
              <View style={styles.iconButtonsGroup}>
                {/* Football Icon */}
                <TouchableOpacity
                  style={[
                    styles.iconButton,
                    sportFilter === "football" && styles.iconButtonActive,
                  ]}
                  onPress={() => setSportFilter("football")}
                >
                  <Ionicons
                    name="football"
                    size={22}
                    color={sportFilter === "football" ? "#FF4444" : theme.colors.textSecondary}
                  />
                </TouchableOpacity>

                {/* Basketball Icon */}
                <TouchableOpacity
                  style={[
                    styles.iconButton,
                    sportFilter === "basketball" && styles.iconButtonActive,
                  ]}
                  onPress={() => setSportFilter("basketball")}
                >
                  <Ionicons
                    name="basketball"
                    size={22}
                    color={sportFilter === "basketball" ? "#FF4444" : theme.colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
        
        <View style={styles.centerContainer}>
          <Heart size={48} color={theme.colors.textSecondary} />
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            {fixtures.length === 0 ? "No followed matches yet" : `No ${sportFilter === "all" ? "" : sportFilter} matches followed`}
          </Text>
          <Text
            style={[styles.emptySubText, { color: theme.colors.textSecondary }]}
          >
            {fixtures.length === 0 ? "Tap the star icon on matches to follow them" : "Switch to another sport or follow more matches"}
          </Text>
        </View>
      </View>
    );
  }

  // ===== MAIN RENDER =====
  return (
    <View style={styles.container}>
      {internalRefreshing && fixtures.length === 0 && (
        <View style={[styles.loadingContainer, { pointerEvents: "none" }]}>
          <ActivityIndicator size="large" color="#FFD700" />
          <Text
            style={[styles.loadingText, { color: theme.colors.textSecondary }]}
          >
            Loading followed matches...
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
        ListHeaderComponent={sportFilterHeader}
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
  // ✅ Sport Filter Styles
  sportFilterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0,
  },
  sportFilterButtons: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconButtonsGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#444",
    backgroundColor: "transparent",
  },
  filterButtonActive: {
    backgroundColor: "rgba(255, 68, 68, 0.15)", // Beautiful light red background
    borderColor: "#FF4444",
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter-SemiBold",
  },
  filterButtonTextActive: {
    fontWeight: "700",
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(68, 68, 68, 0.2)",
  },
  iconButtonActive: {
    backgroundColor: "rgba(255, 68, 68, 0.15)",
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
    marginTop: 16,
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
  followedCountText: {
    fontSize: 12,
    fontFamily: "Inter-Medium",
    fontWeight: "500",
    marginLeft: 8,
  },
  followedMatchesIndicator: {
    backgroundColor: "#FFD700",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  followedMatchesCount: {
    color: "white",
    fontSize: 10,
    fontFamily: "Inter-Bold",
    fontWeight: "700",
  },
  matchItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  // ===== HORIZONTAL LAYOUT STYLES FOR FOOTBALL =====
  horizontalMatchItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  leftSection: {
    width: 60,
    alignItems: "flex-start",
  },
  horizontalTime: {
    fontSize: 13,
    fontFamily: "Inter-Medium",
    marginBottom: 2,
  },
  horizontalStatus: {
    fontSize: 12,
    fontFamily: "Inter-SemiBold",
    fontWeight: "600",
  },
  horizontalStarButton: {
    padding: 4,
  },
  middleSection: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  horizontalTeamName: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter-Medium",
  },
  vsText: {
    fontSize: 12,
    fontFamily: "Inter-Regular",
    paddingHorizontal: 4,
  },
  rightSection: {
    width: 24,
    alignItems: "center",
    justifyContent: "center",
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
  matchTimeStatus: {
    fontSize: 12,
    fontFamily: "Inter-Medium",
    fontWeight: "600",
  },
  liveIndicator: {
    backgroundColor: "#FF4444",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  liveText: {
    color: "white",
    fontSize: 10,
    fontFamily: "Inter-Bold",
    fontWeight: "700",
  },
  upcomingIndicator: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  upcomingText: {
    color: "white",
    fontSize: 10,
    fontFamily: "Inter-Bold",
    fontWeight: "700",
  },
  rightStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  followedIndicator: {
    backgroundColor: "#FFD700",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  followedText: {
    color: "white",
    fontSize: 9,
    fontFamily: "Inter-Bold",
    fontWeight: "700",
  },
  statusText: {
    fontSize: 12,
    fontFamily: "Inter-Medium",
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
    marginBottom: 8,
    paddingHorizontal: 0,
  },
  favoriteButton: {
    paddingRight: 12,
    paddingTop: 4,
    width: 36,
    alignItems: "flex-start",
    justifyContent: "flex-start",
  },
  centeredMatchContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  matchTimerContainer: {
    marginBottom: 4,
    alignItems: "center",
  },
  matchTimer: {
    fontSize: 13,
    fontFamily: "Inter-Bold",
    fontWeight: "700",
  },
  teamsAndScoreRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
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
    paddingRight: 8,
  },
  homeCardsUnderTeam: {
    marginTop: 4,
    alignItems: "flex-end",
  },
  homeTeamWithRanking: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
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
    paddingLeft: 8,
  },
  awayCardsUnderTeam: {
    marginTop: 4,
    alignItems: "flex-start",
  },
  awayTeamWithRanking: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    justifyContent: "flex-start",
  },
  teamName: {
    fontSize: 14,
    fontFamily: "Inter-Medium",
    fontWeight: "500",
    lineHeight: 18,
    flexShrink: 1,
    flexWrap: "wrap",
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
    marginTop: -20, // ✅ Pull up to keep scores aligned with team names
    paddingHorizontal: 8,
  },
  statusAboveScore: {
    marginBottom: 12, // ✅ Same as finished-matches ftIndicatorContainer
    alignItems: "center",
    justifyContent: "center",
  },
  centerStatus: {
    fontSize: 11,
    fontFamily: "Inter-Bold", // ✅ Match finished-matches ftIndicator
    fontWeight: "700", // ✅ Match finished-matches ftIndicator
    lineHeight: 11, // ✅ Match finished-matches ftIndicator
    textAlign: "center",
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
  },
  secondHalfStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  matchSpacer: {
    height: 8,
    backgroundColor: "#F5F5F5",
    opacity: 0.6,
    marginHorizontal: 0,
    width: "100%",
  },
});
