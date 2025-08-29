import { Match } from "@/types/match";
import { createApiSportsService } from "./api-sports-service";
import teamLogoService from "./teamLogoService";
import { favoritesService } from "./favoritesService";
import teamRankingsService from "./teamRankingsService"; // ✅ RESTORED: Team rankings import
import { supabase } from "./supabaseClient";
import Constants from "expo-constants";
import {
  Fixture,
  FootballFixturesResponse,
} from "@/types/football-fixtures-response";
import { FixtureEvent } from "@/types/football-fixtures-response";
// ✅ OPTIMIZED: Enhanced cache for faster performance
const cache = new Map<string, { data: Match[]; timestamp: number }>();
const CACHE_DURATION = 600000; // 10 minutes for general matches (longer for better performance)
const LIVE_CACHE_DURATION = 30000; // 30 seconds for live matches (balance between freshness and performance)
const FOLLOWS_CACHE_DURATION = 300000; // 5 minutes for follows (faster access)
const ALL_CACHE_DURATION = 900000; // 15 minutes for 'all' filter (since it's comprehensive and expensive)

// Initialize API Sports service
const apiSportsService = createApiSportsService(
  process.env.EXPO_PUBLIC_API_SPORT_KEY!,
  {
    enableCaching: true,
    cacheExpiry: 5 * 60 * 1000, // 5 minutes
    retryAttempts: 3,
    timeout: 10000,
  },
);

// Test function to verify API Sports service
async function testApiSportsService() {
  try {
    if (!process.env.EXPO_PUBLIC_API_SPORT_KEY) {
      return false;
    }

    // Test a simple API call - get 1 fixture
    const testFixturesResponse = await apiSportsService.getFixtures(
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
    );
    const testFixtures = testFixturesResponse.response || [];

    return true;
  } catch (error) {
    return false;
  }
}

// Subscribers for live updates
type MatchUpdateCallback = (matches: Match[]) => void;
const subscribers = new Set<MatchUpdateCallback>();

// ✅ INSTANT LOADING: Preload cache for immediate data access
let isPreloading = false;
const PRELOAD_SPORTS = ["football"];
const PRELOAD_FILTERS = ["all", "live", "fixture"];

// Subscribe to match updates
export function subscribeToMatchUpdates(
  callback: MatchUpdateCallback,
): () => void {
  subscribers.add(callback);
  return () => subscribers.delete(callback);
}

// Notify all subscribers of match updates
function notifySubscribers(matches: Match[]): void {
  subscribers.forEach((callback) => {
    try {
      callback(matches);
    } catch (error) {
      console.error("Error in match update callback:", error);
    }
  });
}

// Convert API Sports fixture to new Match format
function convertFixtureToMatch(fixture: any): Match {
  const isLive =
    fixture.fixture.status.short === "1H" ||
    fixture.fixture.status.short === "HT" ||
    fixture.fixture.status.short === "2H";
  const isFinished =
    fixture.fixture.status.short === "FT" ||
    fixture.fixture.status.short === "AET" ||
    fixture.fixture.status.short === "PEN";

  let status: "live" | "finished" | "upcoming" = "upcoming";
  if (isLive) status = "live";
  else if (isFinished) status = "finished";

  let statusText = fixture.fixture.status.long || fixture.fixture.status.short;
  if (isLive && fixture.fixture.status.elapsed) {
    statusText = `${fixture.fixture.status.elapsed}'`;
  }

  let time: string | undefined;
  if (isLive && fixture.fixture.status.elapsed) {
    time = fixture.fixture.status.elapsed.toString();
  }

  const startTime = fixture.fixture.date;
  const score = `${fixture.goals.home || 0}-${fixture.goals.away || 0}`;
  const halfTimeScore = score; // API Sports doesn't provide halftime score in this structure

  const convertedMatch = {
    id: fixture.fixture.id.toString(),
    sport: "football",
    league: fixture.league.name,
    status,
    statusText,
    startTime,
    time,
    home: {
      name: fixture.teams.home.name,
      logo: fixture.teams.home.logo,
      score: fixture.goals.home || 0,
    },
    away: {
      name: fixture.teams.away.name,
      logo: fixture.teams.away.logo,
      score: fixture.goals.away || 0,
    },
    score,
    halfTimeScore,
    viewers: "0",
    hasVideo: false,
    isFavorite: false,
    addedTime:
      isLive &&
      fixture.fixture.status.elapsed &&
      fixture.fixture.status.elapsed > 45
        ? "+2"
        : "",
  };

  return convertedMatch;
}

// Helper function to fetch from API and update cache
async function fetchMatchesFromAPI(
  sport: string,
  filter: string,
  selectedDate?: string,
  cacheKey?: string,
): Promise<Match[]> {
  const key = cacheKey || `${sport}-${filter}-${selectedDate || "today"}`;

  try {
    const result = await performAPIFetch(sport, filter, selectedDate);
    cache.set(key, { data: result, timestamp: Date.now() });
    return result;
  } catch (error) {
    console.error("API fetch failed:", error);
    throw error;
  }
}

// Main function to fetch matches
export async function fetchMatches(
  sport: string,
  filter: string,
  selectedDate?: string,
): Promise<Match[]> {
  try {
    // Test API Sports service first
    const serviceWorking = await testApiSportsService();
    if (!serviceWorking) {
      return [];
    }

    const cacheKey = `${sport}-${filter}-${selectedDate || "today"}`;
    const cached = cache.get(cacheKey);

    // ✅ OPTIMIZED: Use appropriate cache duration based on filter type
    let cacheDuration = CACHE_DURATION;
    if (filter === "live") {
      cacheDuration = LIVE_CACHE_DURATION;
    } else if (filter === "follows") {
      cacheDuration = FOLLOWS_CACHE_DURATION;
    } else if (filter === "all") {
      cacheDuration = ALL_CACHE_DURATION; // Longer cache for expensive 'all' operations
    }

    if (cached && Date.now() - cached.timestamp < cacheDuration) {
      const cacheAge = Math.round((Date.now() - cached.timestamp) / 1000);

      // ✅ INSTANT LOADING: Return cached data immediately, then refresh in background
      if (filter === "all" && cacheAge > 300) {
        // For 'all' filter, refresh after 5 minutes
        setTimeout(() => {
          fetchMatchesFromAPI(sport, filter, selectedDate)
            .then((result) => {
              cache.set(cacheKey, { data: result, timestamp: Date.now() });
              notifySubscribers(result);
            })
            .catch((error) => {});
        }, 1000);
      }

      return cached.data;
    }

    // ✅ INSTANT LOADING: Fetch fresh data immediately
    return await fetchMatchesFromAPI(sport, filter, selectedDate, cacheKey);
  } catch (error) {
    throw error;
  }
}

// Extracted API fetch logic
async function performAPIFetch(
  sport: string,
  filter: string,
  selectedDate?: string,
): Promise<Match[]> {
  try {
    const cacheKey = `${sport}-${filter}-${selectedDate || "today"}`;

    // Check configuration
    const enableRealData = Constants.expoConfig?.extra?.enableRealData ?? true;
    const useMockData = Constants.expoConfig?.extra?.useMockData ?? false;

    if (!enableRealData || useMockData) {
      return [];
    }

    let apiMatches: any[] = [];

    // Handle different filter types using API Sports service
    switch (filter) {
      case "all":
        try {
          // ✅ OPTIMIZED: Reduced API calls for fast performance
          const today = new Date().toISOString().split("T")[0];
          const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0];

          // ✅ FAST PARALLEL FETCH - Only essential calls
          const [
            liveMatchesResponse,
            todayFixturesResponse,
            tomorrowFixturesResponse,
            finishedMatchesResponse,
          ] = await Promise.all([
            apiSportsService.getFixtures(
              undefined,
              undefined,
              undefined,
              undefined,
              undefined,
              "all",
            ),
            apiSportsService.getFixtures(
              undefined,
              undefined,
              undefined,
              today,
            ),
            apiSportsService.getFixtures(
              undefined,
              undefined,
              undefined,
              tomorrow,
            ),
            apiSportsService.getFixtures(
              undefined,
              undefined,
              undefined,
              undefined,
              "FT",
            ),
          ]);

          // Extract data from ApiResponse wrappers
          const liveMatches = liveMatchesResponse.response || [];
          const todayFixtures = todayFixturesResponse.response || [];
          const tomorrowFixtures = tomorrowFixturesResponse.response || [];
          const finishedMatches = finishedMatchesResponse.response || [];
          console.log(
            `🔴 LIVE: ${liveMatches.length || 0} matches`,
            `📅 TODAY FIXTURES: ${todayFixtures.length || 0} matches`,
            `📅 TOMORROW FIXTURES: ${tomorrowFixtures.length || 0} matches`,
            `🏁 FINISHED: ${finishedMatches.length || 0} matches`,
          );

          // ✅ COMBINE ESSENTIAL DATA - Fast and comprehensive
          apiMatches = [
            ...(liveMatches || []),
            ...(todayFixtures || []),
            ...(tomorrowFixtures || []),
            ...(finishedMatches || []),
          ];

          // ✅ Remove duplicates only - NO OTHER LIMITS
          const uniqueMatches = new Map();
          apiMatches.forEach((match) => {
            if (match && match.id && !uniqueMatches.has(match.id)) {
              uniqueMatches.set(match.id, match);
            }
          });
          apiMatches = Array.from(uniqueMatches.values());
        } catch (error) {
          apiMatches = [];
        }
        break;

      case "live":
        try {
          const liveResponse = await apiSportsService.getFixtures(
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            "all",
          );
          apiMatches = liveResponse.response || [];
        } catch (error) {
          apiMatches = [];
        }
        break;

      case "fixture":
        try {
          if (selectedDate) {
            const fixturesResponse = await apiSportsService.getFixtures(
              undefined,
              undefined,
              undefined,
              selectedDate,
            );
            apiMatches = fixturesResponse.response || [];
          } else {
            // Get today's fixtures
            const today = new Date().toISOString().split("T")[0];
            const fixturesResponse = await apiSportsService.getFixtures(
              undefined,
              undefined,
              undefined,
              today,
            );
            apiMatches = fixturesResponse.response || [];
          }
        } catch (error) {
          apiMatches = [];
        }
        break;

      case "finished":
        try {
          if (selectedDate) {
            // For specific date, get finished matches
            const fixturesResponse = await apiSportsService.getFixtures(
              undefined,
              undefined,
              undefined,
              selectedDate,
            );
            const fixtures = fixturesResponse.response || [];
            apiMatches = fixtures.filter(
              (match: any) =>
                match.status.short === "FT" ||
                match.status.short === "AET" ||
                match.status.short === "PEN",
            );
          } else {
            // Get recent finished matches
            const finishedResponse = await apiSportsService.getFixtures(
              undefined,
              undefined,
              undefined,
              undefined,
              "FT",
            );
            apiMatches = finishedResponse.response || [];
          }
        } catch (error) {
          apiMatches = [];
        }
        break;

      default:
        return [];
    }

    if (apiMatches.length > 0) {
    }

    // Convert API Sports data to Match format
    const convertedMatches = apiMatches.map(convertFixtureToMatch);

    return convertedMatches;
  } catch (error) {
    throw error;
  }
}

// ✅ RESTORED: Enhance matches with team rankings
async function enhanceMatchesWithRankings(matches: Match[]): Promise<Match[]> {
  try {
    // Collect all teams for batch ranking lookup
    const teams: Array<{ name: string; league?: string }> = [];
    matches.forEach((match) => {
      teams.push({ name: match.home.name, league: match.league });
      teams.push({ name: match.away.name, league: match.league });
    });

    // Get rankings for all teams in batch
    const rankingsMap = await teamRankingsService.getBatchTeamRankings(teams);

    // Apply rankings to matches
    const rankedMatches = matches.map((match) => ({
      ...match,
      home: {
        ...match.home,
        rank: rankingsMap.get(match.home.name) || null,
      },
      away: {
        ...match.away,
        rank: rankingsMap.get(match.away.name) || null,
      },
    }));

    const rankedCount = rankedMatches.filter(
      (m) => m.home.rank || m.away.rank,
    ).length;

    return rankedMatches;
  } catch (error) {
    return matches; // Return original matches if ranking fails
  }
}

// Sort matches based on filter type
function sortMatches(matches: Match[], filter: string): Match[] {
  if (matches.length === 0) return matches;

  const sortedMatches = [...matches];

  console.log();

  // ✅ ENHANCED SORTING: Strict chronological order for "All" filter, smart priority for others
  sortedMatches.sort((a, b) => {
    // Get timestamps for comparison
    const timeA = new Date(a.startTime).getTime();
    const timeB = new Date(b.startTime).getTime();

    // Check for invalid dates
    if (isNaN(timeA) || isNaN(timeB)) {
      return isNaN(timeA) ? 1 : -1;
    }

    // ✅ ENHANCED SORTING for "ALL" filter: Live → Next → Fixture → Finished
    if (filter === "all") {
      // Use the same smart sorting as other filters for proper order
      // Don't return early - continue to the priority-based sorting below
    }

    // Helper function to properly identify live matches
    const isReallyLive = (match: Match): boolean => {
      // Live matches have scores (not "vs") and minutes/status indicators
      return (
        match.status === "live" &&
        match.score !== "vs" &&
        (match.statusText?.includes("'") ||
          match.statusText?.includes("+") ||
          match.statusText === "HT" ||
          match.statusText === "ET")
      );
    };

    // Helper function to identify "Next" matches (immediate upcoming)
    const isNextMatch = (match: Match): boolean => {
      // Next matches are upcoming matches starting very soon (within next 2 hours)
      const now = new Date();
      const matchTime = new Date(match.startTime);
      const timeDiff = matchTime.getTime() - now.getTime();
      const hoursUntilMatch = timeDiff / (1000 * 60 * 60);

      return (
        match.score === "vs" &&
        match.status === "upcoming" &&
        hoursUntilMatch >= 0 &&
        hoursUntilMatch <= 2
      ); // Within next 2 hours
    };

    // Helper function to get match minute for live matches
    const getMatchMinute = (statusText: string): number => {
      if (!statusText) return 0;
      const minuteMatch = statusText.match(/\d+/);
      return minuteMatch ? parseInt(minuteMatch[0]) : 0;
    };

    const aIsReallyLive = isReallyLive(a);
    const bIsReallyLive = isReallyLive(b);
    const aIsNext = isNextMatch(a);
    const bIsNext = isNextMatch(b);

    // PRIORITY 1: Live matches first (matches with actual scores and minutes)
    if (aIsReallyLive && !bIsReallyLive) return -1;
    if (bIsReallyLive && !aIsReallyLive) return 1;

    // PRIORITY 2: Among live matches, sort by progress (almost ending first)
    if (aIsReallyLive && bIsReallyLive) {
      const aMinute = getMatchMinute(a.statusText || "");
      const bMinute = getMatchMinute(b.statusText || "");

      const aIsEnding = aMinute >= 90;
      const bIsEnding = bMinute >= 90;

      if (aIsEnding && !bIsEnding) return -1;
      if (bIsEnding && !aIsEnding) return 1;

      return bMinute - aMinute; // Higher minutes first within ending matches
    }

    // PRIORITY 3: "Next" matches come right after live matches
    if (aIsNext && !bIsNext && !bIsReallyLive) return -1;
    if (bIsNext && !aIsNext && !aIsReallyLive) return 1;

    // PRIORITY 4: Among "Next" matches, sort by time (soonest first)
    if (aIsNext && bIsNext) {
      return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
    }

    // PRIORITY 5: All other upcoming matches sorted chronologically
    // This ensures: 18:00 → 18:30 → 20:30 → 22:30 → 23:00
    return new Date(a.startTime).getTime() - new Date(b.startTime).getTime(); // STRICT chronological order for future matches
  });

  // Enhanced logging to verify order

  sortedMatches.slice(0, 12).forEach((match, index) => {
    const timeStr = new Date(match.startTime).toTimeString().slice(0, 5);
    let statusInfo = "";

    if (match.score !== "vs") {
      statusInfo = `LIVE (${match.statusText || "N/A"})`;
    } else {
      const now = new Date();
      const matchTime = new Date(match.startTime);
      const timeDiff = matchTime.getTime() - now.getTime();
      const hoursUntilMatch = timeDiff / (1000 * 60 * 60);

      if (hoursUntilMatch >= 0 && hoursUntilMatch <= 2) {
        statusInfo = "NEXT";
      } else {
        statusInfo = "UPCOMING";
      }
    }

    console.log(
      `${index + 1}. ${timeStr} | ${statusInfo} | ${match.home.name} vs ${
        match.away.name
      }`,
    );
  });

  return sortedMatches;
}

// Fetch hot matches for Top screen
export async function fetchHotMatches(
  category:
    | "live"
    | "upcoming"
    | "premier"
    | "champions"
    | "nba"
    | "finished"
    | "uganda",
): Promise<Match[]> {
  try {
    let hotMatches: any[] = [];

    // Get appropriate matches based on category
    switch (category) {
      case "live":
        const liveResponse = await apiSportsService.getFixtures(
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          "all",
        );
        hotMatches = liveResponse.response || [];
        break;

      case "upcoming":
        const upcomingResponse = await apiSportsService.getFixtures(
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          "upcoming",
        );
        hotMatches = upcomingResponse.response || [];
        break;

      case "premier":
        // Get all matches and filter for English Premier League only
        const allPremierResponse = await apiSportsService.getFixtures(
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          "all",
        );
        const allPremierMatches = allPremierResponse.response || [];
        const { leagueNormalizationService } = await import(
          "./leagueNormalizationService"
        );
        hotMatches = leagueNormalizationService.filterMatchesForTopCategory(
          allPremierMatches,
          "premier",
        );

        break;

      case "champions":
        // For specific leagues, we'll get live scores and filter later
        const championsResponse = await apiSportsService.getFixtures(
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          "all",
        );
        hotMatches = championsResponse.response || [];
        break;

      case "nba":
        // For NBA, we'll get live scores and filter later
        const nbaResponse = await apiSportsService.getFixtures(
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          "all",
        );
        hotMatches = nbaResponse.response || [];
        break;

      case "finished":
        const finishedResponse = await apiSportsService.getFixtures(
          undefined,
          undefined,
          undefined,
          undefined,
          "FT",
        );
        hotMatches = finishedResponse.response || [];
        break;

      case "uganda":
        // Get all matches and filter for Ugandan Premier League only
        const allUgandaResponse = await apiSportsService.getFixtures(
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          "all",
        );
        const allUgandaMatches = allUgandaResponse.response || [];
        const { leagueNormalizationService: ugandaService } = await import(
          "./leagueNormalizationService"
        );
        hotMatches = ugandaService.filterMatchesForTopCategory(
          allUgandaMatches,
          "uganda",
        );

        break;

      default:
        hotMatches = [];
    }

    // Convert to Match format
    hotMatches = hotMatches.map(convertFixtureToMatch);

    // Sort hot matches
    hotMatches = sortHotMatches(hotMatches, category);

    return hotMatches; // Show ALL available matches - no artificial limit
  } catch (error) {
    return [];
  }
}

// Sort hot matches based on category
function sortHotMatches(matches: Match[], category: string): Match[] {
  if (matches.length === 0) return matches;

  return matches.sort((a, b) => {
    // Helper function to get match minute for live matches
    const getMatchMinute = (statusText: string): number => {
      if (!statusText) return 0;
      const minuteMatch = statusText.match(/\d+/);
      return minuteMatch ? parseInt(minuteMatch[0]) : 0;
    };

    // Live matches always first
    if (a.status === "live" && b.status !== "live") return -1;
    if (b.status === "live" && a.status !== "live") return 1;

    // For live matches, prioritize those almost ending
    if (a.status === "live" && b.status === "live") {
      const aMinute = getMatchMinute(a.statusText || "");
      const bMinute = getMatchMinute(b.statusText || "");

      const aIsEnding = aMinute >= 90;
      const bIsEnding = bMinute >= 90;

      if (aIsEnding && !bIsEnding) return -1;
      if (bIsEnding && !aIsEnding) return 1;

      if (aIsEnding && bIsEnding) {
        return bMinute - aMinute; // Higher minutes first
      }
    }

    // Then by league priority
    const getLeaguePriority = (league: string): number => {
      const l = league.toLowerCase();
      if (l.includes("premier league") && !l.includes("uganda")) return 1;
      if (l.includes("champions league")) return 2;
      if (l.includes("la liga")) return 3;
      if (l.includes("serie a")) return 4;
      if (l.includes("bundesliga")) return 5;
      if (l.includes("nba")) return 1;
      if (l.includes("uganda")) return 1;
      return 10;
    };

    const priorityDiff =
      getLeaguePriority(a.league) - getLeaguePriority(b.league);
    if (priorityDiff !== 0) return priorityDiff;

    // Finally by time - chronological order
    if (category === "finished") {
      return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
    } else {
      return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
    }
  });
}

// Clear cache when needed
export function clearMatchCache(): void {
  cache.clear();
  apiSportsService.clearCache();
}

// Clear only live matches cache to force fresh fetch
export function clearLiveMatchCache(): void {
  const keysToDelete = Array.from(cache.keys()).filter((key) =>
    key.includes("-live-"),
  );
  keysToDelete.forEach((key) => cache.delete(key));
  apiSportsService.clearCache();
}

// Removed aggressive auto-refresh that was causing UI jumping
// Manual refresh can still be triggered by user pull-to-refresh

export function startAutoRefresh(): void {}

export function stopAutoRefresh(): void {}

// ✅ NEW: SUPABASE INTEGRATION - Sync real match data with database
export async function syncMatchWithSupabase(match: Fixture) {
  try {
    // Silent sync - don't log to avoid user-facing errors

    // Parse current score
    let homeScore = 0;
    let awayScore = 0;

    if (
      match.score &&
      match.score.fulltime.home !== null &&
      match.score.fulltime.away !== null
    ) {
      homeScore = match.score.fulltime.home;
      awayScore = match.score.fulltime.away;
    }

    // Calculate current minute based on status
    let currentMinute = "0";
    if (
      match.fixture.status.short === "1H" ||
      match.fixture.status.short === "2H"
    ) {
      // For live matches, calculate realistic minute based on score and time
      const now = new Date();
      const matchStart = new Date(match.fixture.date);
      const minutesElapsed = Math.floor(
        (now.getTime() - matchStart.getTime()) / (1000 * 60),
      );

      if (minutesElapsed <= 45) {
        currentMinute = Math.min(minutesElapsed, 45).toString();
      } else if (minutesElapsed <= 60) {
        currentMinute = "HT"; // Halftime
      } else {
        currentMinute = Math.min(minutesElapsed - 15, 90).toString(); // Account for 15min break
      }
    } else if (match.fixture.status.short === "FT") {
      currentMinute = "FT";
    }

    // 📊 UPSERT LIVE MATCH UPDATES - Graceful failure
    const { error: liveUpdateError } = await supabase
      .from("live_match_updates")
      .upsert(
        {
          match_id: match.fixture.id,
          home_score: homeScore,
          away_score: awayScore,
          status:
            match.fixture.status.short === "1H" ||
            match.fixture.status.short === "2H"
              ? "live"
              : "finished",
          minute: currentMinute,
          last_updated: new Date().toISOString(),
        },
        {
          onConflict: "match_id",
        },
      );

    // Silent handling - no console errors for network issues
    if (liveUpdateError) {
      // Fail silently to avoid user-facing errors
      return false;
    }

    return true;
  } catch (error) {
    // Fail gracefully without logging scary errors
    return false;
  }
}

// ✅ NEW: SYNC MATCH EVENTS to Supabase
export async function syncMatchEventsWithSupabase(
  matchId: string,
  events: any[],
) {
  try {
    // Silent sync - avoid user-facing error messages

    // Convert events to Supabase format
    const supabaseEvents = events
      .filter((event) => event.minute > 0) // Skip minute 0 events
      .map((event) => ({
        match_id: matchId,
        event_type:
          event.type === "yellow_card"
            ? "card"
            : event.type === "red_card"
              ? "card"
              : event.type,
        team_type: event.team,
        player_name: event.player || "Player",
        minute: event.minute.toString(),
        score: event.type === "goal" ? `Updated score after goal` : "N/A",
        description: event.description,
        created_at: new Date().toISOString(),
      }));

    if (supabaseEvents.length === 0) {
      return true;
    }

    // Insert events (ignore duplicates) - silent failure
    try {
      const { error: eventsError } = await supabase
        .from("match_events")
        .upsert(supabaseEvents, {
          onConflict: "match_id,event_type,team_type,minute",
          ignoreDuplicates: true,
        });

      // Silent handling - no console output
      return !eventsError;
    } catch (networkError) {
      // Silent network error handling
      return true;
    }

    return true;
  } catch (error) {
    // Silent error handling - continue app functionality
    return true;
  }
}

// ✅ NEW: GET REAL-TIME MATCH DATA from Supabase
export async function getRealTimeMatchData(matchId: string) {
  try {
    // Get live match updates
    const { data: liveData, error: liveError } = await supabase
      .from("live_match_updates")
      .select("*")
      .eq("match_id", matchId)
      .single();

    if (liveError && liveError.code !== "PGRST116") {
      // PGRST116 = no rows
    }

    // Get match events
    const { data: eventsData, error: eventsError } = await supabase
      .from("match_events")
      .select("*")
      .eq("match_id", matchId)
      .order("created_at", { ascending: false });

    if (eventsError) {
    }

    return {
      liveUpdates: liveData,
      events: eventsData || [],
    };
  } catch (error) {
    return {
      liveUpdates: null,
      events: [],
    };
  }
}

// ✅ NEW: ENHANCED MATCH FETCHING with Supabase integration
export async function fetchEnhancedMatches(
  sport: string,
  filter: string,
  selectedDate?: string,
): Promise<Match[]> {
  try {
    // First, get matches from the regular API
    const apiMatches = await fetchMatches(sport, filter, selectedDate);

    if (apiMatches.length === 0) {
      return apiMatches;
    }

    // For live matches, enhance with real-time Supabase data
    if (filter === "live" || filter === "all") {
      const enhancedMatches = await Promise.all(
        apiMatches.map(async (match) => {
          try {
            // Sync current match data to Supabase first
            // Convert Match to Fixture format for syncMatchWithSupabase
            const fixture: Fixture = {
              fixture: {
                id: parseInt(match.id),
                referee: null,
                timezone: "UTC",
                date: match.startTime,
                timestamp: Date.parse(match.startTime) / 1000,
                periods: { first: null, second: null },
                venue: { id: null, name: null, city: null },
                status: {
                  long: match.statusText,
                  short:
                    match.status === "live"
                      ? "1H"
                      : match.status === "finished"
                        ? "FT"
                        : "NS",
                  elapsed: match.time ? parseInt(match.time) : null,
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
                home: match.home.score || null,
                away: match.away.score || null,
              },
              score: {
                halftime: { home: null, away: null },
                fulltime: {
                  home: match.home.score || null,
                  away: match.away.score || null,
                },
                extratime: { home: null, away: null },
                penalty: { home: null, away: null },
              },
              events: null,
            };
            await syncMatchWithSupabase(fixture);

            // Get any existing real-time data
            const realTimeData = await getRealTimeMatchData(match.id);

            // If we have real-time data, use it to update the match
            if (realTimeData.liveUpdates) {
              const liveData = realTimeData.liveUpdates;

              const updatedMatch = {
                ...match,
                score:
                  liveData.status === "upcoming"
                    ? "vs"
                    : `${liveData.home_score}-${liveData.away_score}`,
                status: liveData.status as "live" | "finished" | "upcoming",
                statusText:
                  liveData.minute === "FT"
                    ? "FT"
                    : liveData.minute === "HT"
                      ? "HT"
                      : liveData.status === "live"
                        ? `${liveData.minute}'`
                        : "",
              };

              return updatedMatch;
            }

            return match;
          } catch (error) {
            return match;
          }
        }),
      );

      return enhancedMatches;
    }

    return apiMatches;
  } catch (error) {
    // Fallback to regular fetch
    return fetchMatches(sport, filter, selectedDate);
  }
}

// ✅ OPTIMIZED: PRELOAD MATCH DATA for instant performance
export async function preloadMatchData(): Promise<void> {
  if (isPreloading) return;
  isPreloading = true;

  try {
    // ✅ PARALLEL LOADING: All requests happen simultaneously for maximum speed
    const preloadPromises = PRELOAD_SPORTS.flatMap((sport) =>
      PRELOAD_FILTERS.map(async (filter) => {
        try {
          const matches = await fetchMatches(sport, filter);
          return matches;
        } catch (error) {
          return [];
        }
      }),
    );

    const results = await Promise.all(preloadPromises);
    const totalMatches = results.reduce(
      (sum, matches) => sum + matches.length,
      0,
    );
  } catch (error) {
  } finally {
    isPreloading = false;
  }
}

// ✅ NEW: POPULATE SUPABASE with real Football API data
export async function populateSupabaseWithRealData() {
  try {
    // Get live matches from Football API
    const liveMatchesResponse = await apiSportsService.getFixtures(
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      "all",
    );
    const liveMatches = liveMatchesResponse.response || [];

    if (liveMatches.length === 0) {
      return;
    }

    for (const liveMatch of liveMatches) {
      try {
        // Convert LiveScore to Match format
        const match: Fixture = {
          fixture: {
            id: liveMatch.fixture.id,
            referee: liveMatch.fixture.referee,
            timezone: liveMatch.fixture.timezone,
            date: liveMatch.fixture.date,
            timestamp: liveMatch.fixture.timestamp,
            periods: {
              first: liveMatch.fixture.periods.first,
              second: liveMatch.fixture.periods.second,
            },
            venue: {
              id: liveMatch.fixture.venue.id,
              name: liveMatch.fixture.venue.name,
              city: liveMatch.fixture.venue.city,
            },
            status: {
              long: liveMatch.fixture.status.long,
              short: liveMatch.fixture.status.short,
              elapsed: liveMatch.fixture.status.elapsed,
              extra: liveMatch.fixture.status.extra,
            },
          },
          league: liveMatch.league,
          teams: {
            home: liveMatch.teams.home,
            away: liveMatch.teams.away,
          },
          goals: {
            home: liveMatch.goals.home,
            away: liveMatch.goals.away,
          },
          score: {
            halftime: {
              home: liveMatch.score.halftime.home,
              away: liveMatch.score.halftime.away,
            },
            fulltime: {
              home: liveMatch.score.fulltime.home,
              away: liveMatch.score.fulltime.away,
            },
            extratime: {
              home: liveMatch.score.extratime.home,
              away: liveMatch.score.extratime.away,
            },
            penalty: {
              home: liveMatch.score.penalty.home,
              away: liveMatch.score.penalty.away,
            },
          },
          events: liveMatch.events,
        };

        // Sync to Supabase
        await syncMatchWithSupabase(match);

        // Generate and sync events
        if (
          match.fixture.status.short === "1H" ||
          match.fixture.status.short === "2H" ||
          match.fixture.status.short === "FT"
        ) {
          // Convert Fixture to Match format for generateEventsFromMatch
          const matchForEvents: Match = {
            id: match.fixture.id.toString(),
            sport: "football",
            league: match.league.name || "",
            status: match.fixture.status.short === "FT" ? "finished" : "live",
            statusText: match.fixture.status.long || "",
            startTime: match.fixture.date,
            time: match.fixture.status.elapsed?.toString(),
            home: {
              name: match.teams.home.name || "",
              logo: match.teams.home.logo || undefined,
              score: match.goals.home || undefined,
            },
            away: {
              name: match.teams.away.name || "",
              logo: match.teams.away.logo || undefined,
              score: match.goals.away || undefined,
            },
            score: `${match.goals.home || 0}-${match.goals.away || 0}`,
            halfTimeScore: `${match.score.halftime.home || 0}-${match.score.halftime.away || 0}`,
            viewers: "0",
            hasVideo: false,
            isFavorite: false,
            addedTime: "",
          };
          const events = generateEventsFromMatch(matchForEvents);
          await syncMatchEventsWithSupabase(
            match.fixture.id.toString(),
            events,
          );
        }
      } catch (error) {}
    }
  } catch (error) {}
}

// Helper function to generate events from match data
function generateEventsFromMatch(match: Match): any[] {
  const events: any[] = [];

  // ✅ ENHANCED: Detect Extra Time matches
  const isExtraTimeMatch = () => {
    const status = match.statusText?.toUpperCase() || "";
    const timeStr = match.time?.toUpperCase() || "";
    return (
      status.includes("ET") ||
      status === "ET" ||
      status.includes("EXTRA") ||
      status.includes("OVERTIME") ||
      timeStr.includes("ET") ||
      status === "AET" ||
      status === "BT" ||
      (match.time && Number(match.time) > 90)
    );
  };

  // Parse score for goals
  let homeGoals = 0;
  let awayGoals = 0;

  if (match.score && match.score !== "vs") {
    const scoreParts = match.score.includes("-")
      ? match.score.split("-")
      : match.score.split(" ");
    homeGoals = parseInt(scoreParts[0]?.trim()) || 0;
    awayGoals = parseInt(scoreParts[1]?.trim()) || 0;
  }

  let eventId = 1;

  // ✅ ENHANCED: Generate events based on match type and timing
  const maxMinute = isExtraTimeMatch() ? 120 : 90; // Extra time goes to 120 minutes

  // Add goal events with realistic timing
  for (let i = 0; i < homeGoals; i++) {
    let minute;
    if (isExtraTimeMatch() && i >= homeGoals - 1) {
      // Last goals in extra time - show at 100', 101', etc. like Chinese app
      minute = 100 + i;
    } else {
      // Regular goals spread across match
      minute = Math.min(20 + i * 15, maxMinute - 5);
    }

    events.push({
      id: `goal_home_${eventId++}`,
      minute: minute,
      team: "home",
      type: "goal",
      player: "Scorer",
      description: `Goal! ${match.home.name} scores!`,
      icon: "⚽",
    });
  }

  for (let i = 0; i < awayGoals; i++) {
    let minute;
    if (isExtraTimeMatch() && i >= awayGoals - 1) {
      // Last goals in extra time - show at 101', 102', etc. like Chinese app
      minute = 101 + i;
    } else {
      // Regular goals spread across match
      minute = Math.min(25 + i * 20, maxMinute - 5);
    }

    events.push({
      id: `goal_away_${eventId++}`,
      minute: minute,
      team: "away",
      type: "goal",
      player: "Scorer",
      description: `Goal! ${match.away.name} scores!`,
      icon: "⚽",
    });
  }

  // ✅ ENHANCED: Add corner events with extra time support
  if (match.home.corners) {
    for (let i = 0; i < match.home.corners; i++) {
      let minute;
      if (isExtraTimeMatch() && i >= Math.max(0, match.home.corners - 2)) {
        // Some corners in extra time for ET matches
        minute = 95 + i * 3;
      } else {
        // Regular corners spread across match
        minute = Math.min(10 + i * 8, maxMinute - 10);
      }

      events.push({
        id: `corner_home_${eventId++}`,
        minute: minute,
        team: "home",
        type: "corner",
        player: "Player",
        description: `Corner kick for ${match.home.name}`,
        icon: "🚩",
      });
    }
  }

  if (match.away.corners) {
    for (let i = 0; i < match.away.corners; i++) {
      let minute;
      if (isExtraTimeMatch() && i >= Math.max(0, match.away.corners - 2)) {
        // Some corners in extra time for ET matches
        minute = 97 + i * 3;
      } else {
        // Regular corners spread across match
        minute = Math.min(15 + i * 12, maxMinute - 10);
      }

      events.push({
        id: `corner_away_${eventId++}`,
        minute: minute,
        team: "away",
        type: "corner",
        player: "Player",
        description: `Corner kick for ${match.away.name}`,
        icon: "🚩",
      });
    }
  }

  return events.sort((a, b) => b.minute - a.minute);
}
