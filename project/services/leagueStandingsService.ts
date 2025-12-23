/**
 * League Standings Service
 * 
 * This service handles fetching league standings and competition data from API-Football.
 * It provides a unified interface for accessing standings data for all types of competitions:
 * - Club leagues (Premier League, La Liga, etc.)
 * - Continental competitions (Champions League, Copa Libertadores, etc.)
 * - National team competitions (World Cup, AFCON, etc.)
 * 
 * API Documentation: https://www.api-football.com/documentation-v3
 */

import Constants from "expo-constants";

// Get API key with proper fallback logic (same as other services)
function getApiFootballKey(): string {
  // Method 1: Direct environment variable (most reliable for Expo)
  if (process.env.EXPO_PUBLIC_API_FOOTBALL_KEY) {
    console.log("✅ [LeagueStandings] API key found via EXPO_PUBLIC_API_FOOTBALL_KEY");
    return process.env.EXPO_PUBLIC_API_FOOTBALL_KEY;
  }

  // Method 2: Through Constants.expoConfig.extra
  try {
    const extraConfig = Constants.expoConfig?.extra;
    if (extraConfig?.apiFootballKey) {
      const keyRef = extraConfig.apiFootballKey;
      
      // If it's an env var reference, resolve it
      if (typeof keyRef === "string" && keyRef.startsWith("EXPO_")) {
        const resolvedKey = process.env[keyRef];
        if (resolvedKey) {
          console.log(`✅ [LeagueStandings] API key resolved via ${keyRef}`);
          return resolvedKey;
        }
      } else if (typeof keyRef === "string") {
        // Direct value
        console.log("✅ [LeagueStandings] API key found in app.json");
        return keyRef;
      }
    }
  } catch (error) {
    console.warn("⚠️ [LeagueStandings] Could not access Constants.expoConfig.extra:", error);
  }

  // Method 3: Alternative environment variable names
  if (process.env.EXPO_PUBLIC_API_SPORT_KEY) {
    console.log("✅ [LeagueStandings] API key found via EXPO_PUBLIC_API_SPORT_KEY");
    return process.env.EXPO_PUBLIC_API_SPORT_KEY;
  }

  console.error("❌ [LeagueStandings] No API key found! Please check your .env file");
  return "";
}

const API_FOOTBALL_KEY = getApiFootballKey();
const API_FOOTBALL_HOST = "v3.football.api-sports.io";
const API_BASE_URL = `https://${API_FOOTBALL_HOST}`;

// Log initialization status
if (API_FOOTBALL_KEY) {
  console.log("✅ [LeagueStandings] Service initialized with API key");
} else {
  console.error("❌ [LeagueStandings] Service initialized WITHOUT API key - API calls will fail!");
}

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface LeagueInfo {
  id: number;
  name: string;
  type: string; // "League" or "Cup"
  logo: string;
  country: string;
  countryFlag?: string;
  season: number;
}

export interface TeamStanding {
  rank: number;
  team: {
    id: number;
    name: string;
    logo: string;
  };
  points: number;
  goalsDiff: number;
  group?: string;
  form: string;
  status?: string; // "up", "same", "down" for promotion/relegation
  description?: string; // e.g., "Promotion - Champions League"
  all: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: {
      for: number;
      against: number;
    };
  };
  home: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: {
      for: number;
      against: number;
    };
  };
  away: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: {
      for: number;
      against: number;
    };
  };
}

export interface StandingsGroup {
  groupName?: string; // e.g., "Group A", null for single table leagues
  standings: TeamStanding[];
}

export interface LeagueStandingsResponse {
  league: LeagueInfo;
  groups: StandingsGroup[]; // Multiple groups for group stage competitions
}

export interface TeamLeague {
  league: {
    id: number;
    name: string;
    type: string;
    logo: string;
  };
  country: {
    name: string;
    code: string;
    flag: string;
  };
  seasons: {
    year: number;
    start: string;
    end: string;
    current: boolean;
  }[];
}

// ============================================================================
// API FETCH HELPER
// ============================================================================

async function apiFootballFetch<T>(endpoint: string, params: Record<string, any> = {}, sport: string = "football"): Promise<T | null> {
  console.log(`🔄 [apiFootballFetch] Calling ${sport} ${endpoint} with params:`, params);
  try {
    // Check if API key exists
    if (!API_FOOTBALL_KEY) {
      console.warn("⚠️ [LeagueStandings] Cannot make API call - No API key configured");
      return null;
    }

    const queryString = new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null) {
          acc[key] = String(value);
        }
        return acc;
      }, {} as Record<string, string>)
    ).toString();

    // Use different base URL and host for basketball
    const baseUrl = sport === "basketball" 
      ? "https://v1.basketball.api-sports.io"
      : API_BASE_URL;
    const apiHost = sport === "basketball"
      ? "v1.basketball.api-sports.io"
      : API_FOOTBALL_HOST;

    const url = `${baseUrl}/${endpoint}${queryString ? `?${queryString}` : ""}`;

    console.log(`🌐 [LeagueStandings] Fetching ${sport}: ${endpoint}`, params);

    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "x-rapidapi-key": API_FOOTBALL_KEY,
        "x-rapidapi-host": apiHost,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    console.log(`📡 [LeagueStandings] Response status: ${response.status}`);

    // Check for rate limit (429)
    if (response.status === 429) {
      const retryAfter = response.headers.get("Retry-After");
      const retrySeconds = retryAfter ? parseInt(retryAfter) : 60;
      
      // Silent logging in production - only log in __DEV__ mode
      if (__DEV__) {
        console.warn(`[LeagueStandings] Rate limit exceeded - retry after ${retrySeconds}s`);
      }
      
      // Set global rate limit flag (will be read by leaguesByRegionService)
      if (typeof global !== 'undefined') {
        (global as any).__API_FOOTBALL_RATE_LIMITED__ = true;
        (global as any).__API_FOOTBALL_RATE_LIMIT_RESET__ = Date.now() + (retrySeconds * 1000);
      }
      
      return null;
    }

    if (!response.ok) {
      // Silent error handling - don't show errors to users
      if (__DEV__) {
        const errorText = await response.text();
        console.warn(`[LeagueStandings] API Error: ${response.status}`, errorText.substring(0, 100));
      }
      
      return null;
    }

    const data = await response.json();
    
    // ✅ CRITICAL: Enhanced logging to see response structure
    if (__DEV__ && endpoint === "leagues") {
      console.log(`✅ [LeagueStandings] Data received for ${endpoint}`);
      console.log(`   Response structure:`, {
        hasResponse: !!(data as any)?.response,
        responseType: Array.isArray((data as any)?.response) ? 'array' : typeof (data as any)?.response,
        responseLength: Array.isArray((data as any)?.response) ? (data as any).response.length : 'N/A',
        firstItem: Array.isArray((data as any)?.response) && (data as any).response.length > 0 
          ? JSON.stringify((data as any).response[0]).substring(0, 200) 
          : 'N/A'
      });
    } else {
      console.log(`✅ [LeagueStandings] Data received for ${endpoint}`);
    }
    
    // API-Football returns data in { response: [...] } format
    return data as T;
  } catch (error) {
    // Check if it's an abort error (timeout)
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn(`⚠️ [LeagueStandings] Request timeout for ${endpoint}`);
      return null;
    }
    
    // Log other errors only in development
    if (__DEV__) {
      console.warn(`[LeagueStandings] Error fetching from ${endpoint}:`, error);
    }
    return null;
  }
}

// ============================================================================
// MAIN SERVICE FUNCTIONS
// ============================================================================

/**
 * Fetch standings for a specific league and season
 * 
 * @param leagueId - The league ID from API-Football/API-Basketball
 * @param season - The season year (e.g., 2024)
 * @param silent - If true, suppresses error logs (for verification checks)
 * @param sport - The sport type ('football' or 'basketball')
 * @returns League standings with groups (if applicable)
 */
export async function fetchLeagueStandings(
  leagueId: number,
  season?: number,
  silent: boolean = false,
  sport: string = "football"
): Promise<LeagueStandingsResponse | null> {
  const currentYear = new Date().getFullYear();
  const targetSeason = season || currentYear;

  if (!silent) {
    console.log(`🔍 [LeagueStandings] Fetching ${sport} standings for league ${leagueId}, season ${targetSeason}`);
  }

  // Try current season first
  let data = await apiFootballFetch<{ response: any[] }>("standings", {
    league: leagueId,
    season: targetSeason,
  }, sport);

  // If no data for current season, try previous season
  if (!data || !data.response || data.response.length === 0) {
    if (!silent) {
      console.log(`⚠️ [LeagueStandings] No data for season ${targetSeason}, trying ${targetSeason - 1}...`);
    }
    
    data = await apiFootballFetch<{ response: any[] }>("standings", {
      league: leagueId,
      season: targetSeason - 1,
    }, sport); // ✅ CRITICAL FIX: Pass sport parameter to prevent basketball→football fallback
  }

  // Still no data? League might not exist or have standings
  if (!data || !data.response || data.response.length === 0) {
    if (!silent) {
      console.warn(`⚠️ [LeagueStandings] No standings found for league ${leagueId} (tried ${targetSeason} and ${targetSeason - 1})`);
      console.log(`💡 [LeagueStandings] League ${leagueId} might not exist, not have started yet, or be a cup competition without standings`);
    }
    return null;
  }

  if (!silent) {
    console.log(`✅ [LeagueStandings] Found standings for league ${leagueId}`);
  }

  const apiResponse = data.response[0];
  
  console.log(`📊 [LeagueStandings] Processing ${sport} standings data:`, {
    leagueName: apiResponse?.league?.name,
    hasStandings: !!apiResponse?.league?.standings,
    standingsCount: apiResponse?.league?.standings?.length || 0,
    sport: sport
  });
  
  // Extract league info
  const leagueInfo: LeagueInfo = {
    id: apiResponse.league.id,
    name: apiResponse.league.name,
    type: apiResponse.league.type || "League",
    logo: apiResponse.league.logo,
    country: apiResponse.league.country || "International",
    countryFlag: apiResponse.league.flag,
    season: targetSeason,
  };

  // ✅ BASKETBALL SUPPORT: Basketball API has different structure
  // Basketball standings are in data.response[0].league.standings (flat array)
  // Football standings are in data.response[0].league.standings (array of arrays for groups)
  const standingsArray = apiResponse.league.standings || [];
  
  // Detect if this is basketball or football based on structure
  const isBasketball = sport === 'basketball';
  
  console.log(`🏀 [LeagueStandings] Sport: ${sport}, IsBasketball: ${isBasketball}`);
  
  const groups: StandingsGroup[] = isBasketball 
    ? [
        // 🏀 BASKETBALL: Flat array, convert to single group
        {
          groupName: undefined,
          standings: standingsArray.map((team: any) => ({
            rank: team.position || team.rank,
            team: {
              id: team.team.id,
              name: team.team.name,
              logo: team.team.logo,
            },
            points: team.points || 0,
            goalsDiff: 0, // Basketball doesn't use goal difference
            group: team.group,
            form: team.form || "",
            status: team.status,
            description: team.description,
            all: {
              played: team.games?.played || 0,
              win: team.games?.win?.total || 0,
              draw: 0, // Basketball doesn't have draws
              lose: team.games?.lose?.total || 0,
              goals: {
                for: team.points?.for || 0,
                against: team.points?.against || 0,
              },
            },
            home: {
              played: team.games?.played || 0,
              win: team.games?.win?.home || 0,
              draw: 0,
              lose: team.games?.lose?.home || 0,
              goals: {
                for: 0,
                against: 0,
              },
            },
            away: {
              played: team.games?.played || 0,
              win: team.games?.win?.away || 0,
              draw: 0,
              lose: team.games?.lose?.away || 0,
              goals: {
                for: 0,
                against: 0,
              },
            },
          })),
        }
      ]
    : // ⚽ FOOTBALL: Array of arrays (for groups)
      standingsArray.map((standingsGroup: any[], index: number) => {
        // Determine if this is a group stage
        const firstTeam = standingsGroup[0];
        const groupName = firstTeam?.group || (standingsArray.length > 1 ? `Group ${String.fromCharCode(65 + index)}` : undefined);

        const standings: TeamStanding[] = standingsGroup.map((team: any) => ({
          rank: team.rank,
          team: {
            id: team.team.id,
            name: team.team.name,
            logo: team.team.logo,
          },
          points: team.points,
          goalsDiff: team.goalsDiff,
          group: team.group,
          form: team.form || "",
          status: team.status,
          description: team.description,
          all: team.all,
          home: team.home,
          away: team.away,
        }));

        return {
          groupName,
          standings,
        };
      });

  return {
    league: leagueInfo,
    groups,
  };
}

/**
 * Fetch all leagues that a team participates in
 * 
 * @param teamId - The team ID from API-Football
 * @param currentOnly - Whether to fetch only current season leagues
 * @returns Array of leagues the team participates in
 */
export async function fetchTeamLeagues(
  teamId: number,
  currentOnly: boolean = true
): Promise<TeamLeague[]> {
  const params: Record<string, any> = { team: teamId };
  if (currentOnly) {
    params.current = "true";
  }

  const data = await apiFootballFetch<{ response: any[] }>("leagues", params);

  if (!data || !data.response) {
    return [];
  }

  return data.response.map((item: any) => ({
    league: {
      id: item.league.id,
      name: item.league.name,
      type: item.league.type,
      logo: item.league.logo,
    },
    country: {
      name: item.country.name,
      code: item.country.code,
      flag: item.country.flag,
    },
    seasons: item.seasons || [],
  }));
}

/**
 * Fetch league information by ID
 * 
 * @param leagueId - The league ID from API-Football
 * @returns League information
 */
export async function fetchLeagueInfo(leagueId: number): Promise<TeamLeague | null> {
  console.log(`🔍 [fetchLeagueInfo] Fetching league info for leagueId: ${leagueId}`);
  
  try {
    const data = await apiFootballFetch<{ response: any[] }>("leagues", { id: leagueId });

    if (!data || !data.response || data.response.length === 0) {
      console.warn(`⚠️ [fetchLeagueInfo] No data returned for leagueId: ${leagueId}`);
      console.warn(`⚠️ [fetchLeagueInfo] Response:`, { hasData: !!data, responseLength: data?.response?.length || 0 });
      console.warn(`⚠️ [fetchLeagueInfo] This usually means:`);
      console.warn(`   1. League ID ${leagueId} doesn't exist in API-Football`);
      console.warn(`   2. League data not available for this league`);
      console.warn(`   3. API structure changed - league may need different ID`);
      console.warn(`💡 Try checking API-Football documentation for correct league ID`);
      return null;
    }

    console.log(`✅ [fetchLeagueInfo] Successfully fetched league info for leagueId: ${leagueId}`);
    return {
      league: {
        id: data.response[0].league.id,
        name: data.response[0].league.name,
        type: data.response[0].league.type,
        logo: data.response[0].league.logo,
      },
      country: {
        name: data.response[0].country.name,
        code: data.response[0].country.code,
        flag: data.response[0].country.flag,
      },
      seasons: data.response[0].seasons || [],
    };
  } catch (error: any) {
    console.error(`❌ [fetchLeagueInfo] Error fetching league info for leagueId: ${leagueId}:`, error);
    console.error(`❌ [fetchLeagueInfo] Error message:`, error?.message || 'Unknown error');
    return null;
  }
}

/**
 * Fetch leagues by country
 * 
 * @param country - Country name (e.g., "England", "Spain")
 * @param season - Season year
 * @returns Array of leagues in that country
 */
export async function fetchLeaguesByCountry(
  country: string,
  season?: number,
  sport: string = "football"
): Promise<TeamLeague[]> {
  const currentYear = new Date().getFullYear();
  const targetSeason = season || currentYear;
  
  // ✅ Try current season first
  let params: Record<string, any> = { country, season: targetSeason };
  let data = await apiFootballFetch<{ response: any[] }>("leagues", params, sport);

  // ✅ CRITICAL: Log response for debugging
  console.log(`🔍 [fetchLeaguesByCountry] ${country} (${targetSeason}):`, {
    hasData: !!data,
    hasResponse: !!(data?.response),
    responseLength: data?.response?.length || 0,
    responseType: Array.isArray(data?.response) ? 'array' : typeof data?.response
  });

  // ✅ If no data for current season, try previous season
  if (!data || !data.response || data.response.length === 0) {
    console.log(`⚠️ [fetchLeaguesByCountry] No leagues for ${country} in ${targetSeason}, trying ${targetSeason - 1}...`);
    params = { country, season: targetSeason - 1 };
    data = await apiFootballFetch<{ response: any[] }>("leagues", params, sport);
    
    console.log(`🔍 [fetchLeaguesByCountry] ${country} (${targetSeason - 1}):`, {
      hasData: !!data,
      hasResponse: !!(data?.response),
      responseLength: data?.response?.length || 0
    });
  }

  // ✅ If still no data, try without season parameter (get all available leagues)
  if (!data || !data.response || data.response.length === 0) {
    console.log(`⚠️ [fetchLeaguesByCountry] No leagues for ${country} with season, trying without season...`);
    params = { country };
    data = await apiFootballFetch<{ response: any[] }>("leagues", params, sport);
    
    console.log(`🔍 [fetchLeaguesByCountry] ${country} (no season):`, {
      hasData: !!data,
      hasResponse: !!(data?.response),
      responseLength: data?.response?.length || 0
    });
  }

  if (!data || !data.response) {
    console.warn(`⚠️ [fetchLeaguesByCountry] No data returned for ${country}`);
    return [];
  }

  if (!Array.isArray(data.response)) {
    console.warn(`⚠️ [fetchLeaguesByCountry] Response is not an array for ${country}:`, typeof data.response);
    return [];
  }

  const leagues = data.response.map((item: any) => ({
    league: {
      id: item.league?.id,
      name: item.league?.name,
      type: item.league?.type,
      logo: item.league?.logo,
    },
    country: {
      name: item.country?.name,
      code: item.country?.code,
      flag: item.country?.flag,
    },
    seasons: item.seasons || [],
  }));

  console.log(`✅ [fetchLeaguesByCountry] ${country}: Found ${leagues.length} leagues`);
  if (leagues.length > 0) {
    console.log(`   Leagues:`, leagues.map(l => l.league.name).join(', '));
  }

  return leagues;
}

/**
 * Search for leagues by name
 * 
 * @param searchTerm - Search term (e.g., "Premier", "Champions")
 * @returns Array of matching leagues
 */
export async function searchLeagues(searchTerm: string): Promise<TeamLeague[]> {
  const data = await apiFootballFetch<{ response: any[] }>("leagues", {
    search: searchTerm,
  });

  if (!data || !data.response) {
    return [];
  }

  return data.response.map((item: any) => ({
    league: {
      id: item.league.id,
      name: item.league.name,
      type: item.league.type,
      logo: item.league.logo,
    },
    country: {
      name: item.country.name,
      code: item.country.code,
      flag: item.country.flag,
    },
    seasons: item.seasons || [],
  }));
}

/**
 * Helper function to determine if a team is in a specific league's standings
 * 
 * @param standings - League standings response
 * @param teamName - Team name to search for
 * @returns True if team is in the standings
 */
export function isTeamInLeague(
  standings: LeagueStandingsResponse | null,
  teamName: string
): boolean {
  if (!standings) return false;

  const teamNameLower = teamName.toLowerCase();
  return standings.groups.some(group =>
    group.standings.some(team =>
      team.team.name.toLowerCase().includes(teamNameLower) ||
      teamNameLower.includes(team.team.name.toLowerCase())
    )
  );
}

/**
 * Helper function to get team's current position in standings
 * 
 * @param standings - League standings response
 * @param teamName - Team name to search for
 * @returns Team's standing information or null
 */
export function getTeamStanding(
  standings: LeagueStandingsResponse | null,
  teamName: string
): TeamStanding | null {
  if (!standings) return null;

  const teamNameLower = teamName.toLowerCase();
  
  for (const group of standings.groups) {
    const team = group.standings.find(team =>
      team.team.name.toLowerCase().includes(teamNameLower) ||
      teamNameLower.includes(team.team.name.toLowerCase())
    );
    
    if (team) return team;
  }

  return null;
}
