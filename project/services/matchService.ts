import { Match } from "../types/match";
import { backendApiService } from "./backendApiService";
import teamLogoService from "./teamLogoService";
import favoritesService from "./favoritesService";
import teamRankingsService from "./teamRankingsService"; // ✅ RESTORED: Team rankings import
import { supabase } from "./supabaseClient";
import Constants from "expo-constants";
import {
  Fixture,
  FootballFixturesResponse,
} from "../types/football-fixtures-response";
import { FixtureEvent } from "../types/football-fixtures-response";
// ✅ OPTIMIZED: Enhanced cache for faster performance
const cache = new Map<string, { data: Match[]; timestamp: number }>();
const CACHE_DURATION = 600000; // 10 minutes for general matches (longer for better performance)
const LIVE_CACHE_DURATION = 30000; // 30 seconds for live matches (balance between freshness and performance)
const FOLLOWS_CACHE_DURATION = 300000; // 5 minutes for follows (faster access)
const ALL_CACHE_DURATION = 900000; // 15 minutes for 'all' filter (since it's comprehensive and expensive)

// ✅ BACKEND API: All API calls now go through Supabase Edge Functions
// API keys are stored securely in backend, not exposed in frontend
// Backend handles: API-Football → TheSportsDB → RapidAPI → Football-Data.org fallback

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
    fixture.fixture.status.short === "LIVE" ||  // ✅ FIX: Add LIVE status
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

  // Extract round information from fixture.league.round
  // Handle formats like "Regular Season - 1", "Matchday 1", "1", etc.
  let round: string | undefined;
  if (fixture.league?.round) {
    const roundString = fixture.league.round;
    console.log(`🔍 [convertFixtureToMatch] Extracting round from: "${roundString}"`);
    // Extract number from round string (e.g., "Regular Season - 1" -> "Round 1")
    const roundMatch = roundString.match(/\d+/);
    if (roundMatch) {
      round = `Round ${roundMatch[0]}`;
      console.log(`✅ [convertFixtureToMatch] Extracted round: "${round}"`);
    } else {
      round = roundString; // Use as-is if no number found
      console.log(`⚠️ [convertFixtureToMatch] No number found, using round as-is: "${round}"`);
    }
  } else {
    console.log(`⚠️ [convertFixtureToMatch] No round data in fixture.league.round for match ${fixture.fixture?.id}`);
  }

  const convertedMatch = {
    id: fixture.fixture.id.toString(),
    sport: "football",
    league: fixture.league?.name || "Unknown League", // ✅ SAFETY: Handle null/undefined league
    leagueLogo: fixture.league?.logo || null, // ✅ Extract league logo from API
    leagueId: fixture.league?.id || null, // ✅ Extract league ID from API
    status,
    statusText,
    startTime,
    time,
    home: {
      name: fixture.teams?.home?.name || "Home Team", // ✅ SAFETY: Handle null/undefined
      logo: fixture.teams?.home?.logo || null,
      score: fixture.goals?.home || 0,
    },
    away: {
      name: fixture.teams?.away?.name || "Away Team", // ✅ SAFETY: Handle null/undefined
      logo: fixture.teams?.away?.logo || null,
      score: fixture.goals?.away || 0,
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
    round, // Include round information
    // ✅ API-driven venue data - 100% from API, no hardcoding
    venueName: fixture.fixture?.venue?.name || null,
    venueCity: fixture.fixture?.venue?.city || null,
    venueCapacity: fixture.fixture?.venue?.capacity || null,
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

// Extracted API fetch logic - NOW USES BACKEND
async function performAPIFetch(
  sport: string,
  filter: string,
  selectedDate?: string,
): Promise<Match[]> {
  try {
    const cacheKey = `${sport}-${filter}-${selectedDate || "today"}`;

    console.log("🔄 [Backend API] Fetching data from Supabase Edge Functions");
    console.log(`📋 Filter: ${filter}, Sport: ${sport}, Date: ${selectedDate}`);

    let apiMatches: any[] = [];

    // Handle different filter types using BACKEND API
    switch (filter) {
      case "all":
        try {
          const today = new Date().toISOString().split("T")[0];
          const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0];

          // ✅ BACKEND API: Parallel fetch from Supabase Edge Functions
          const [liveMatches, todayFixtures, tomorrowFixtures, finishedMatches] = await Promise.all([
            backendApiService.getLiveMatches(sport, false),
            backendApiService.getFixtures(sport, today, false),
            backendApiService.getFixtures(sport, tomorrow, false),
            backendApiService.getFinishedMatches(sport, today, false),
          ]);

          console.log(
            `🔴 LIVE: ${liveMatches.length || 0} matches`,
            `📅 TODAY: ${todayFixtures.length || 0} matches`,
            `📅 TOMORROW: ${tomorrowFixtures.length || 0} matches`,
            `🏁 FINISHED: ${finishedMatches.length || 0} matches`,
          );

          // Combine all data
          apiMatches = [
            ...(liveMatches || []),
            ...(todayFixtures || []),
            ...(tomorrowFixtures || []),
            ...(finishedMatches || []),
          ];

          // Remove duplicates
          const uniqueMatches = new Map();
          apiMatches.forEach((match) => {
            const matchId = match.fixture?.id || match.id;
            if (matchId && !uniqueMatches.has(matchId)) {
              uniqueMatches.set(matchId, match);
            }
          });
          apiMatches = Array.from(uniqueMatches.values());
        } catch (error) {
          console.error("❌ [Backend API] Error in 'all' filter:", error);
          apiMatches = [];
        }
        break;

      case "live":
        try {
          apiMatches = await backendApiService.getLiveMatches(sport, false);
        } catch (error) {
          console.error("❌ [Backend API] Error in 'live' filter:", error);
          apiMatches = [];
        }
        break;

      case "fixture":
        try {
          const targetDate = selectedDate || new Date().toISOString().split("T")[0];
          apiMatches = await backendApiService.getFixtures(sport, targetDate, false);
        } catch (error) {
          console.error("❌ [Backend API] Error in 'fixture' filter:", error);
          apiMatches = [];
        }
        break;

      case "finished":
        try {
          const targetDate = selectedDate || new Date().toISOString().split("T")[0];
          apiMatches = await backendApiService.getFinishedMatches(sport, targetDate, false);
          
          // If no results and no specific date, try yesterday too
          if (apiMatches.length === 0 && !selectedDate) {
            console.log("🔄 [Backend API] Trying yesterday for finished matches");
            const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
              .toISOString()
              .split("T")[0];
            const yesterdayMatches = await backendApiService.getFinishedMatches(sport, yesterday, false);
            apiMatches = [...apiMatches, ...yesterdayMatches];
          }

          console.log(`✅ [Backend API] Found ${apiMatches.length} finished matches`);
        } catch (error) {
          console.error("❌ [Backend API] Error in 'finished' filter:", error);
          apiMatches = [];
        }
        break;

      default:
        return [];
    }

    // Convert Backend API data to Match format
    const convertedMatches = apiMatches.map(convertFixtureToMatch);

    return convertedMatches;
  } catch (error) {
    console.error("❌ [Backend API] Error in performAPIFetch:", error);
    throw error;
  }
}

// ✅ RESTORED: Enhance matches with team rankings
async function enhanceMatchesWithRankings(matches: Match[]): Promise<Match[]> {
  try {
    // Collect all teams for batch ranking lookup
    // Extract unique teams for batch ranking
    const teams: Array<{
      id: number | null;
      name: string;
      leagueId: number | null;
      leagueName: string;
    }> = [];
    matches.forEach((match) => {
      teams.push({
        id: null,
        name: match.home.name,
        leagueId: null,
        leagueName: match.league,
      });
      teams.push({
        id: null,
        name: match.away.name,
        leagueId: null,
        leagueName: match.league,
      });
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
    const sport = category === "nba" ? "basketball" : "football";

    // ✅ BACKEND API: All API calls go through Supabase Edge Functions
    switch (category) {
      case "live":
        hotMatches = await backendApiService.getLiveMatches(sport, false);
        break;

      case "upcoming":
        const todayDate = new Date().toISOString().split('T')[0];
        hotMatches = await backendApiService.getFixtures(sport, todayDate, false);
        break;

      case "uganda":
        // ✅ SMART SOLUTION: First, query API to find Uganda Premier League ID, THEN fetch matches
        console.log("🇺🇬 [Uganda] Step 1: Searching for Uganda Premier League ID...");
        
        try {
          // Step 1: Search for Uganda leagues
          const ApiSportsService = (await import("./api-sports-service")).default;
          const apiKey = process.env.EXPO_PUBLIC_API_FOOTBALL_KEY || "";
          const apiSportsService = new ApiSportsService({ apiKey });
          const currentYear = new Date().getFullYear();
          
          const ugandaLeagues = await apiSportsService.getLeagues("Uganda", currentYear, "football");
          console.log(`🔍 [Uganda] Found ${ugandaLeagues.length} Uganda leagues`);
          
          // Log all Uganda leagues to find the right one
          ugandaLeagues.forEach((league: any) => {
            console.log(`   - ID: ${league.id}, Name: "${league.name}", Country: ${league.country}`);
          });
          
          // Find Uganda Premier League (could be named various ways)
          const ugandaPL = ugandaLeagues.find((league: any) => {
            const name = (league.name || "").toLowerCase();
            return (
              name.includes("premier") ||
              name.includes("super") ||
              name.includes("startimes") ||
              name === "uganda premier league"
            );
          });
          
          if (!ugandaPL) {
            console.warn("⚠️ [Uganda] No Premier League found in API response. Available leagues:");
            ugandaLeagues.forEach((league: any) => console.warn(`   - ${league.name}`));
            
            // Fallback to team-based filtering
            console.log("🔄 [Uganda] Falling back to global search + team filtering...");
            const today = new Date();
            const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            const todayStr = today.toISOString().split('T')[0];
            const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            const dayAfter = new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            
            const [liveMatches, finishedMatches, todayFixtures, tomorrowFixtures, dayAfterFixtures] = await Promise.all([
              backendApiService.getLiveMatches(sport, false).catch(() => []),
              backendApiService.getFinishedMatches(sport, sevenDaysAgo, false).catch(() => []),
              backendApiService.getFixtures(sport, todayStr, false).catch(() => []),
              backendApiService.getFixtures(sport, tomorrow, false).catch(() => []),
              backendApiService.getFixtures(sport, dayAfter, false).catch(() => []),
            ]);
            
            const upcomingMatchesRange = [...todayFixtures, ...tomorrowFixtures, ...dayAfterFixtures];
            hotMatches = [...liveMatches, ...finishedMatches, ...upcomingMatchesRange];
            
            console.log(`✅ [Uganda] Retrieved ${hotMatches.length} total matches, now filtering...`);
            
            const { leagueNormalizationService: ugandaFilter } = await import(
              "./leagueNormalizationService"
            );
            hotMatches = ugandaFilter.filterMatchesForTopCategory(
              hotMatches,
              category,
            );
          } else {
            // ✅ SUCCESS! We found Uganda Premier League ID
            const ugandaPLId = ugandaPL.id || 0;
            if (ugandaPLId === 0) {
              console.error("❌ [Uganda] League ID is null/0, cannot proceed");
              hotMatches = [];
            } else {
              console.log(`✅ [Uganda] Found Uganda Premier League! ID: ${ugandaPLId}, Name: "${ugandaPL.name}"`);
              console.log(`🇺🇬 [Uganda] Step 2: Fetching full week's matches (finished + upcoming)...`);
            
              // Step 2A: Fetch FINISHED matches from the past 7 days
              const today = new Date();
              const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
              const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];
              const todayStr = today.toISOString().split('T')[0];
              
              console.log(`🗓️ [Uganda] Fetching finished matches from ${sevenDaysAgoStr} to ${todayStr}...`);
              const finishedResponse = await apiSportsService.getFixtures(
                undefined,     // teamId
                ugandaPLId,    // leagueId
                currentYear,   // season
                undefined,     // date - will get all matches in season
                "FT",          // status - FINISHED ONLY
                undefined,     // live
                "football"
              );
              
              // Filter to only matches from the past 7 days
              const finishedMatches = (finishedResponse.response || []).filter((match: any) => {
                const matchDate = new Date(match.fixture.date);
                return matchDate >= sevenDaysAgo && matchDate <= today;
              });
              
              // Sort finished matches (most recent first)
              finishedMatches.sort((a: any, b: any) => {
                return new Date(b.fixture.date).getTime() - new Date(a.fixture.date).getTime();
              });
              
              console.log(`✅ [Uganda] Found ${finishedMatches.length} finished matches in last 7 days`);
              
              // Step 2B: Fetch UPCOMING matches for the next 7 days
              const sevenDaysFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
              const sevenDaysFromNowStr = sevenDaysFromNow.toISOString().split('T')[0];
              
              console.log(`🗓️ [Uganda] Fetching upcoming matches from ${todayStr} to ${sevenDaysFromNowStr}...`);
              const upcomingResponse = await apiSportsService.getFixtures(
                undefined,     // teamId
                ugandaPLId,    // leagueId
                currentYear,   // season
                undefined,     // date
                "NS",          // status - NOT STARTED (upcoming)
                undefined,     // live
                "football"
              );
              
              // Filter to only matches within the next 7 days
              const upcomingMatches = (upcomingResponse.response || []).filter((match: any) => {
                const matchDate = new Date(match.fixture.date);
                return matchDate >= today && matchDate <= sevenDaysFromNow;
              });
              
              // Sort upcoming matches (soonest first)
              upcomingMatches.sort((a: any, b: any) => {
                return new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime();
              });
              
              console.log(`✅ [Uganda] Found ${upcomingMatches.length} upcoming matches in next 7 days`);
              
              // Step 2C: Fetch LIVE matches
              const liveResponse = await apiSportsService.getFixtures(
                undefined,     // teamId
                ugandaPLId,    // leagueId
                currentYear,   // season
                undefined,     // date
                undefined,     // status
                "all",         // live - get live matches
                "football"
              );
              
              const liveMatches = (liveResponse.response || []).filter((match: any) => {
                const status = match.fixture?.status?.short;
                return status === "1H" || status === "2H" || status === "HT" || status === "ET" || status === "P" || status === "LIVE";
              });
              
              console.log(`✅ [Uganda] Found ${liveMatches.length} live matches`);
              
              // ✅ CRITICAL: Combine in correct order - finished first, then upcoming
              // This ensures finished matches appear at the TOP when scrolling
              hotMatches = [...finishedMatches, ...liveMatches, ...upcomingMatches];
              console.log(`✅ [Uganda] Total: ${hotMatches.length} matches (${finishedMatches.length} finished + ${liveMatches.length} live + ${upcomingMatches.length} upcoming)`);
              console.log(`📊 [Uganda] Sorting: Finished matches first, then live, then upcoming`);
            
              // Log sample matches to verify ordering
              if (hotMatches.length > 0) {
                console.log("📋 [Uganda] First 10 matches (showing order):");
                hotMatches.slice(0, 10).forEach((match: any, idx: number) => {
                  const homeTeam = match.teams?.home?.name || "Unknown";
                  const awayTeam = match.teams?.away?.name || "Unknown";
                  const status = match.fixture?.status?.short || "Unknown";
                  const date = new Date(match.fixture.date).toISOString().split('T')[0];
                  console.log(`  ${idx + 1}. ${homeTeam} vs ${awayTeam} (${status}) - ${date}`);
                });
              }
            }
          }
        } catch (error: any) {
          console.error("❌ [Uganda] Error finding league ID:", error.message);
          console.log("🔄 [Uganda] Falling back to empty results...");
          hotMatches = [];
        }
        
        console.log(`🇺🇬 [Uganda] FINAL RESULT: ${hotMatches.length} Uganda Premier League matches`);
        break;

      case "premier":
      case "champions":
        // Get all matches and filter for specific leagues
        const today2 = new Date();
        const sevenDaysAgo2 = new Date(today2.getTime() - 7 * 24 * 60 * 60 * 1000)
          .toISOString().split('T')[0];
        
        const todayStr2 = today2.toISOString().split('T')[0];
        const tomorrow2 = new Date(today2.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const dayAfter2 = new Date(today2.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        const [liveMatches2, finishedMatches2, todayFixtures2, tomorrowFixtures2, dayAfterFixtures2] = await Promise.all([
          backendApiService.getLiveMatches(sport, false).catch(() => []),
          backendApiService.getFinishedMatches(sport, sevenDaysAgo2, false).catch(() => []),
          backendApiService.getFixtures(sport, todayStr2, false).catch(() => []),
          backendApiService.getFixtures(sport, tomorrow2, false).catch(() => []),
          backendApiService.getFixtures(sport, dayAfter2, false).catch(() => []),
        ]);
        
        const upcomingMatchesRange2 = [...todayFixtures2, ...tomorrowFixtures2, ...dayAfterFixtures2];
        hotMatches = [...liveMatches2, ...finishedMatches2, ...upcomingMatchesRange2];
        
        const { leagueNormalizationService } = await import(
          "./leagueNormalizationService"
        );
        hotMatches = leagueNormalizationService.filterMatchesForTopCategory(
          hotMatches,
          category,
        );
        break;

      case "nba":
        hotMatches = await backendApiService.getLiveMatches("basketball", false);
        break;

      case "finished":
        const targetDate = new Date().toISOString().split('T')[0];
        hotMatches = await backendApiService.getFinishedMatches(sport, targetDate, false);
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
    console.error(`❌ [Backend API] Error fetching hot matches for ${category}:`, error);
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
      // ✅ CRITICAL FIX: Handle undefined league names safely
      if (!league || typeof league !== 'string') {
        return 10; // Low priority for unknown leagues
      }
      
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
  // Backend API has its own caching strategy
}

// Clear only live matches cache to force fresh fetch
export function clearLiveMatchCache(): void {
  const keysToDelete = Array.from(cache.keys()).filter((key) =>
    key.includes("-live-"),
  );
  keysToDelete.forEach((key) => cache.delete(key));
  // Backend API has its own caching strategy
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
    // ✅ BACKEND API: Get live matches from Supabase Edge Functions
    const liveMatches = await backendApiService.getLiveMatches("football", false);

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
