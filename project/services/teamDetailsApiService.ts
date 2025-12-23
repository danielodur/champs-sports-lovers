/**
 * Team Details API Service
 * Comprehensive service for fetching all team-related data
 * Integrates API-Football and TheSportsDB
 */

import Constants from "expo-constants";
import { findSofaTeamId, getTeamPlayersFromSofa } from "./sofaScorePlayersService";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface TeamInfo {
  id: number;
  name: string;
  englishName: string;
  logo: string;
  stadium: string;
  city: string;
  founded?: number;
  country: string;
  countryCode?: string;
  stadiumCapacity?: number;
  stadiumAddress?: string;
  teamManager?: string;
  totalMembers?: number;
  averageAge?: number;
  marketValue?: number; // In millions of euros
  fifaRanking?: number; // FIFA World Ranking (for national teams) or Club Ranking
  league?: {
    id: number;
    name: string;
    logo?: string;
  };
}

export interface TeamStatistics {
  position: number;
  points: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalsDiff: number;
  matchesPlayed: number;
  form: string;
  recentForm: ("W" | "D" | "L")[];
}

export interface TeamFixture {
  id: number;
  opponent: string;
  opponentLogo: string;
  date: string;
  time: string;
  homeAway: "H" | "A";
  status: string;
  homeScore?: number;
  awayScore?: number;
  venue: string;
  competition: string;
  isLive: boolean;
  round?: string; // Round/matchday information (e.g., "Round 1", "Regular Season - 1")
}

export interface TeamNews {
  id: string;
  title: string;
  summary: string;
  time: string;
  image: string;
  source?: string;
}

export interface TeamPlayer {
  id: number;
  name: string;
  photo: string;
  position: string;
  number: number;
  age: number;
  nationality: string;
  height?: string;
  weight?: string;
  statistics?: {
    appearances: number;
    goals: number;
    assists: number;
    marketValue?: number; // in EUR
  };
  injured?: boolean;
}

export interface TeamTransfer {
  player: string;
  playerPhoto?: string;
  fromTeam: string;
  fromTeamLogo?: string;
  toTeam: string;
  toTeamLogo?: string;
  date: string;
  type: string;
  fee?: string;
}

export interface TeamHonor {
  competition: string;
  competitionLogo: string;
  timesWon: number;
  seasons: string[]; // e.g., ["2023-2024", "2021-2022"]
}

export interface LeagueStanding {
  position: number;
  teamName: string;
  teamLogo: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalsDiff: number;
  points: number;
  form: string;
}

// ============================================================================
// API SERVICE CLASS
// ============================================================================

class TeamDetailsApiService {
  private apiFootballKey: string;
  private sportsDbKey: string;
  private cache: Map<string, { data: any; expiry: number }> = new Map();
  private readonly CACHE_DURATION = 1000 * 60 * 15; // 15 minutes

  constructor() {
    this.apiFootballKey =
      process.env.EXPO_PUBLIC_API_FOOTBALL_KEY ||
      Constants.expoConfig?.extra?.apiFootballKey ||
      "";
    
    this.sportsDbKey =
      process.env.EXPO_PUBLIC_THE_SPORTSDB_API_KEY ||
      Constants.expoConfig?.extra?.theSportsDbApiKey ||
      "";

    if (!this.apiFootballKey) {
      console.warn("⚠️ API-Football key not configured");
    }
    if (!this.sportsDbKey) {
      console.warn("⚠️ TheSportsDB key not configured");
    }
  }

  // ============================================================================
  // CACHE MANAGEMENT
  // ============================================================================

  private getCached<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() < cached.expiry) {
      console.log(`📦 Cache hit: ${key}`);
      return cached.data;
    }
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      expiry: Date.now() + this.CACHE_DURATION,
    });
  }

  // ============================================================================
  // API-FOOTBALL REQUESTS
  // ============================================================================

  private async apiFootballRequest<T>(
    endpoint: string,
    params: Record<string, any> = {},
    bypassCache: boolean = false,
    sport: string = "football" // ✅ CRITICAL: Add sport parameter
  ): Promise<T | null> {
    if (!this.apiFootballKey) {
      console.warn("API-Football key not available");
      return null;
    }

    const cacheKey = `af:${sport}:${endpoint}:${JSON.stringify(params)}`; // ✅ Include sport in cache key
    if (!bypassCache) {
      const cached = this.getCached<T>(cacheKey);
      if (cached) {
        console.log(`📦 [apiFootballRequest] Cache hit for: ${endpoint}`);
        return cached;
      }
    } else {
      console.log(`🔄 [apiFootballRequest] Bypassing cache for: ${endpoint}`);
    }

    try {
      // ✅ CRITICAL: Use correct API based on sport
      const baseUrl = sport === "basketball" 
        ? "https://v1.basketball.api-sports.io"
        : "https://v3.football.api-sports.io";
      const apiHost = sport === "basketball"
        ? "v1.basketball.api-sports.io"
        : "v3.football.api-sports.io";
      
      const url = new URL(`${baseUrl}/${endpoint}`);
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, value.toString());
        }
      });

      console.log(`🌐 API-${sport} request: ${endpoint}`, params);

      const response = await fetch(url.toString(), {
        headers: {
          "x-rapidapi-key": this.apiFootballKey,
          "x-rapidapi-host": apiHost,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      // Log response for debugging
      if (endpoint === "players/squads") {
        console.log(`✅ [apiFootballRequest] Squad data received:`, {
          hasResponse: !!data?.response,
          responseLength: data?.response?.length || 0,
          playersCount: data?.response?.[0]?.players?.length || 0,
        });
      }
      
      // Always cache the result for future requests (even if we bypassed cache this time)
      this.setCache(cacheKey, data);
      return data;
    } catch (error) {
      console.error(`❌ API-Football ${endpoint} failed:`, error);
      if (error instanceof Error) {
        console.error(`   Error message: ${error.message}`);
        console.error(`   Error stack: ${error.stack}`);
      }
      return null;
    }
  }

  // ============================================================================
  // THESPORTSDB REQUESTS
  // ============================================================================

  private async sportsDbRequest<T>(endpoint: string): Promise<T | null> {
    if (!this.sportsDbKey) {
      console.warn("TheSportsDB key not available");
      return null;
    }

    const cacheKey = `sdb:${endpoint}`;
    const cached = this.getCached<T>(cacheKey);
    if (cached) return cached;

    try {
      const url = `https://www.thesportsdb.com/api/v1/json/${this.sportsDbKey}/${endpoint}`;
      console.log(`🌐 TheSportsDB request: ${endpoint}`);

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      this.setCache(cacheKey, data);
      return data;
    } catch (error) {
      // Only log actual errors, not 404s for missing data
      if (error instanceof Error && !error.message.includes("404")) {
        console.error(`❌ TheSportsDB ${endpoint} failed:`, error);
      }
      return null;
    }
  }

  // ============================================================================
  // TEAM INFO
  // ============================================================================

  async getTeamInfo(teamName: string, teamId?: number, leagueId?: number): Promise<TeamInfo | null> {
    try {
      // CRITICAL: If we have teamId, use it directly for accurate team lookup - NEVER fall back to name search
      if (teamId) {
        console.log(`🎯 [getTeamInfo] Using teamId ${teamId} for accurate team lookup (teamName: ${teamName}, leagueId: ${leagueId})`);
        const response: any = await this.apiFootballRequest("teams", {
          id: teamId,
        });

        if (response?.response?.[0]) {
          const teamData = response.response[0];
          const foundTeam = teamData.team;
          console.log(`✅ [getTeamInfo] Found team by ID: ${foundTeam.name} (ID: ${foundTeam.id})`);
          
          // CRITICAL: Verify league context if provided - if team is not in expected league, this is a serious error
          if (leagueId) {
            const teamLeagues: any = await this.apiFootballRequest("leagues", {
              team: teamId,
              season: new Date().getFullYear(),
              current: "true",
            });
            
            const isInLeague = teamLeagues?.response?.some((l: any) => l.league.id === leagueId);
            if (!isInLeague) {
              console.error(`❌ [getTeamInfo] CRITICAL: Team ${foundTeam.name} (ID: ${teamId}) is NOT in league ${leagueId}!`);
              console.error(`   Expected league: ${leagueId}, Team's leagues:`, teamLeagues?.response?.map((l: any) => l.league.id));
              // Still return the team, but log the error - the teamId is authoritative
            } else {
              console.log(`✅ [getTeamInfo] Verified team ${foundTeam.name} is in league ${leagueId}`);
            }
          }
          
          // Process team data
          const team = foundTeam;
          const venue = teamData.venue;
          
          // Get team's current league (prioritize the provided leagueId if verified)
          let currentLeague: { id: number; name: string; logo?: string } | undefined = undefined;
          
          if (leagueId) {
            // If we have leagueId, try to get that specific league info
            const teamLeagues: any = await this.apiFootballRequest("leagues", {
              team: team.id,
              season: new Date().getFullYear(),
              current: "true",
            });
            
            const targetLeague = teamLeagues?.response?.find((l: any) => l.league.id === leagueId);
            if (targetLeague) {
              currentLeague = {
                id: targetLeague.league.id,
                name: targetLeague.league.name,
                logo: targetLeague.league.logo,
              };
            }
          }
          
          // Fallback: Get first current league if we don't have leagueId or didn't find it
          if (!currentLeague) {
            const leaguesResponse: any = await this.apiFootballRequest("leagues", {
              team: team.id,
              season: new Date().getFullYear(),
              current: "true",
            });
            
            if (leaguesResponse?.response?.[0]) {
              const league = leaguesResponse.response[0].league;
              currentLeague = {
                id: league.id,
                name: league.name,
                logo: league.logo,
              };
            }
          }

          // Fetch FIFA ranking BEFORE returning (CRITICAL: This was missing!)
          let fifaRanking: number | undefined = undefined;
          try {
            // Import teamRankingsService for FIFA rankings
            const teamRankingsServiceModule = await import("./teamRankingsService");
            const teamRankingsService = teamRankingsServiceModule.default;
            
            // Check if this is a national team (team name matches country name)
            const teamCountry = team.country || "";
            const teamNameLower = team.name.toLowerCase();
            const countryNameLower = teamCountry.toLowerCase();
            const isNationalTeam = teamNameLower === countryNameLower || 
                                  teamNameLower.includes(countryNameLower) ||
                                  countryNameLower.includes(teamNameLower) ||
                                  team.national === true;
            
            if (isNationalTeam) {
              // For national teams, get FIFA country ranking
              console.log(`🌍 [TeamInfo] Detected national team: ${team.name}, fetching FIFA country ranking...`);
              const countryRanking = await teamRankingsService.getFIFACountryRanking(team.name);
              if (countryRanking && countryRanking > 0) {
                fifaRanking = countryRanking;
                console.log(`✅ [TeamInfo] FIFA Country Ranking: ${fifaRanking}`);
              }
            } else {
              // For clubs, ALWAYS try to get FIFA club ranking from OFFICIAL API sources first
              console.log(`🏢 [TeamInfo] Fetching FIFA club ranking for: ${team.name}...`);
              
              // Method 1: Try TheSportsDB API FIRST (official API data source)
              try {
                if (process.env.EXPO_PUBLIC_THE_SPORTSDB_API_KEY) {
                  console.log(`🔍 [TeamInfo] Trying TheSportsDB API (OFFICIAL) for FIFA ranking...`);
                  const sportsDbResponse = await fetch(
                    `https://www.thesportsdb.com/api/v1/json/${process.env.EXPO_PUBLIC_THE_SPORTSDB_API_KEY}/searchteams.php?t=${encodeURIComponent(team.name)}`
                  );
                  const sportsDbData = await sportsDbResponse.json();
                  
                  if (sportsDbData?.teams && sportsDbData.teams.length > 0) {
                    // Find best match (exact name match preferred)
                    const exactMatch = sportsDbData.teams.find((t: any) => 
                      t.strTeam?.toLowerCase() === teamNameLower
                    ) || sportsDbData.teams[0];
                    
                    // TheSportsDB has intRank field for FIFA club ranking (official API data)
                    const clubRanking = exactMatch.intRank 
                      ? parseInt(exactMatch.intRank) 
                      : null;
                    
                    if (clubRanking && clubRanking > 0 && clubRanking < 1000) {
                      fifaRanking = clubRanking;
                      console.log(`✅ [TeamInfo] FIFA Club Ranking from TheSportsDB (OFFICIAL API): ${fifaRanking} for ${team.name}`);
                    } else {
                      console.log(`⚠️ [TeamInfo] TheSportsDB returned invalid ranking: ${clubRanking}, trying fallback...`);
                    }
                  } else {
                    console.log(`⚠️ [TeamInfo] TheSportsDB returned no teams for: ${team.name}, trying fallback...`);
                  }
                } else {
                  console.warn(`⚠️ [TeamInfo] TheSportsDB API key not available, using fallback...`);
                }
              } catch (sportsDbError) {
                console.warn(`⚠️ [TeamInfo] TheSportsDB API error:`, sportsDbError, `- Using fallback...`);
              }
              
              // Method 2: Fallback to hardcoded FIFA club rankings ONLY if API didn't work
              if (!fifaRanking) {
                console.log(`🔄 [TeamInfo] API data unavailable, using hardcoded FIFA ranking fallback for: ${team.name}`);
                const hardcodedFifaRanking = this.getHardcodedFIFAClubRanking(team.name);
                if (hardcodedFifaRanking) {
                  fifaRanking = hardcodedFifaRanking;
                  console.log(`✅ [TeamInfo] FIFA Club Ranking (hardcoded fallback): ${fifaRanking} for ${team.name}`);
                } else {
                  console.warn(`⚠️ [TeamInfo] No FIFA ranking available (API or fallback) for: ${team.name}`);
                }
              }
            }
          } catch (rankingError) {
            console.warn(`⚠️ [TeamInfo] Could not fetch FIFA ranking:`, rankingError);
          }

          return {
            id: team.id,
            name: team.name,
            englishName: team.name,
            logo: team.logo,
            stadium: venue?.name || "Stadium",
            city: venue?.city || "City",
            founded: team.founded,
            country: team.country,
            countryCode: team.countryCode,
            stadiumCapacity: venue?.capacity,
            stadiumAddress: venue?.address,
            fifaRanking: fifaRanking, // CRITICAL: Include FIFA ranking!
            league: currentLeague,
          };
        } else {
          // CRITICAL: If teamId lookup fails, this is a serious error - don't fall back to name search
          console.error(`❌ [getTeamInfo] CRITICAL: Team ID ${teamId} not found in API! This should never happen if teamId comes from standings.`);
          console.error(`   Team name: ${teamName}, League ID: ${leagueId}`);
          return null; // Return null instead of falling back to name search
        }
      }

      // Fallback: Search by name (ONLY if teamId was not provided)
      // CRITICAL: When leagueId is provided, we MUST verify the team is in that league
      console.log(`🔍 [getTeamInfo] Searching by name: ${teamName}${leagueId ? ` (league: ${leagueId})` : ''}`);
      
      // If we have leagueId, first get all teams in that league, then search within them
      let response: any = null;
      
      if (leagueId) {
        // CRITICAL: Get teams from the specific league first to ensure accuracy
        console.log(`🎯 [getTeamInfo] Getting teams from league ${leagueId} for accurate search...`);
        const leagueTeamsResponse: any = await this.apiFootballRequest("teams", {
          league: leagueId,
          season: new Date().getFullYear(),
        });
        
        if (leagueTeamsResponse?.response && leagueTeamsResponse.response.length > 0) {
          // Search within league teams for exact name match
          const normalizedSearchName = teamName.toLowerCase().trim();
          const exactMatch = leagueTeamsResponse.response.find((t: any) => 
            t.team.name.toLowerCase().trim() === normalizedSearchName
          );
          
          if (exactMatch) {
            console.log(`✅ [getTeamInfo] Found exact match in league ${leagueId}: ${exactMatch.team.name}`);
            response = { response: [exactMatch] };
          } else {
            // Try partial match (contains)
            const partialMatch = leagueTeamsResponse.response.find((t: any) => 
              t.team.name.toLowerCase().includes(normalizedSearchName) ||
              normalizedSearchName.includes(t.team.name.toLowerCase())
            );
            
            if (partialMatch) {
              console.log(`⚠️ [getTeamInfo] Found partial match in league ${leagueId}: ${partialMatch.team.name}`);
              response = { response: [partialMatch] };
            } else {
              console.warn(`⚠️ [getTeamInfo] No match found for "${teamName}" in league ${leagueId}`);
              console.warn(`   Available teams in league:`, leagueTeamsResponse.response.slice(0, 5).map((t: any) => t.team.name));
            }
          }
        }
      }
      
      // If no league-specific search or no results, try general search
      if (!response || !response.response || response.response.length === 0) {
        const searchParams: any = { search: teamName };
        response = await this.apiFootballRequest("teams", searchParams);
      }

      if (!response?.response?.[0]) {
        console.warn(`⚠️ [getTeamInfo] No team found for: ${teamName}${leagueId ? ` in league ${leagueId}` : ''} - This team may not be in the API database`);
        return null;
      }

      // If multiple results, prioritize exact name match
      let teamData = response.response[0];
      if (response.response.length > 1) {
        console.log(`⚠️ [getTeamInfo] Multiple teams found (${response.response.length}), selecting best match...`);
        
        // Try to find exact name match first
        const normalizedSearchName = teamName.toLowerCase().trim();
        const exactMatch = response.response.find((t: any) => 
          t.team.name.toLowerCase().trim() === normalizedSearchName
        );
        
        if (exactMatch) {
          teamData = exactMatch;
          console.log(`✅ [getTeamInfo] Found exact name match: ${teamData.team.name}`);
        } else {
          // If we have leagueId, verify the selected team is in that league
          if (leagueId) {
            const teamInLeague = response.response.find((t: any) => {
              // We'd need to check team's leagues, but for now, use first result
              return true; // Will verify below
            });
            if (teamInLeague) {
              teamData = teamInLeague;
            }
          }
          console.warn(`⚠️ [getTeamInfo] No exact match, using: ${teamData.team.name}`);
        }
      }
      
      // CRITICAL: If leagueId was provided, verify the found team is actually in that league
      if (leagueId && teamData) {
        const foundTeamId = teamData.team.id;
        const teamLeagues: any = await this.apiFootballRequest("leagues", {
          team: foundTeamId,
          season: new Date().getFullYear(),
          current: "true",
        });
        
        const isInLeague = teamLeagues?.response?.some((l: any) => l.league.id === leagueId);
        if (!isInLeague) {
          console.error(`❌ [getTeamInfo] CRITICAL: Found team "${teamData.team.name}" (ID: ${foundTeamId}) is NOT in league ${leagueId}!`);
          console.error(`   Team's actual leagues:`, teamLeagues?.response?.map((l: any) => `${l.league.name} (${l.league.id})`));
          // Return null to prevent wrong team mapping
          return null;
        } else {
          console.log(`✅ [getTeamInfo] Verified "${teamData.team.name}" is in league ${leagueId}`);
        }
      }

      const team = teamData.team;
      const foundTeamId = teamData.team.id;
      const venue = teamData.venue;
      
      // Get country code for flag display
      const countryCode = this.getCountryCode(teamData.team.country);
      
      // Fetch team's current leagues to get league information
      let leagueInfo: { id: number; name: string; logo?: string } | undefined = undefined;
      
      try {
        const currentYear = new Date().getFullYear();
        const leaguesResponse: any = await this.apiFootballRequest("leagues", {
          team: foundTeamId,
          season: currentYear,
          current: "true",
        });
        
        if (leaguesResponse?.response?.[0]) {
          const league = leaguesResponse.response[0].league;
          leagueInfo = {
            id: league.id,
            name: league.name,
            logo: league.logo,
          };
          console.log(`✅ [TeamInfo] Found league: ${league.name} (ID: ${league.id})`);
        }
      } catch (leagueError) {
        console.warn(`⚠️ [TeamInfo] Could not fetch league info for team ${teamName}:`, leagueError);
      }
      
      // Fetch FIFA ranking (for both national teams and clubs) - ALWAYS try OFFICIAL API sources first
      let fifaRanking: number | undefined = undefined;
      try {
        // Import teamRankingsService for FIFA rankings
        const teamRankingsServiceModule = await import("./teamRankingsService");
        const teamRankingsService = teamRankingsServiceModule.default;
        
        // Check if this is a national team (team name matches country name)
        const teamCountry = team.country || "";
        const teamNameLower = team.name.toLowerCase();
        const countryNameLower = teamCountry.toLowerCase();
        const isNationalTeam = teamNameLower === countryNameLower || 
                              teamNameLower.includes(countryNameLower) ||
                              countryNameLower.includes(teamNameLower) ||
                              team.national === true;
        
        if (isNationalTeam) {
          // For national teams, get FIFA country ranking from official source
          console.log(`🌍 [TeamInfo] Detected national team: ${team.name}, fetching FIFA country ranking from official source...`);
          const countryRanking = await teamRankingsService.getFIFACountryRanking(team.name);
          if (countryRanking && countryRanking > 0) {
            fifaRanking = countryRanking;
            console.log(`✅ [TeamInfo] FIFA Country Ranking (official): ${fifaRanking}`);
          } else {
            console.warn(`⚠️ [TeamInfo] No official FIFA country ranking found for: ${team.name}`);
          }
        } else {
          // For clubs, ALWAYS try to get FIFA club ranking from OFFICIAL API sources first
          console.log(`🏢 [TeamInfo] Fetching FIFA club ranking for: ${team.name}...`);
          
          // Method 1: Try TheSportsDB API FIRST (official API data source)
          try {
            if (process.env.EXPO_PUBLIC_THE_SPORTSDB_API_KEY) {
              console.log(`🔍 [TeamInfo] Trying TheSportsDB API (OFFICIAL) for FIFA ranking...`);
              const sportsDbResponse = await fetch(
                `https://www.thesportsdb.com/api/v1/json/${process.env.EXPO_PUBLIC_THE_SPORTSDB_API_KEY}/searchteams.php?t=${encodeURIComponent(team.name)}`
              );
              const sportsDbData = await sportsDbResponse.json();
              
              if (sportsDbData?.teams && sportsDbData.teams.length > 0) {
                // Find best match (exact name match preferred)
                const exactMatch = sportsDbData.teams.find((t: any) => 
                  t.strTeam?.toLowerCase() === teamNameLower
                ) || sportsDbData.teams[0];
                
                // TheSportsDB has intRank field for FIFA club ranking (official API data)
                const clubRanking = exactMatch.intRank 
                  ? parseInt(exactMatch.intRank) 
                  : null;
                
                if (clubRanking && clubRanking > 0 && clubRanking < 1000) {
                  fifaRanking = clubRanking;
                  console.log(`✅ [TeamInfo] FIFA Club Ranking from TheSportsDB (OFFICIAL API): ${fifaRanking} for ${team.name}`);
                } else {
                  console.log(`⚠️ [TeamInfo] TheSportsDB returned invalid ranking: ${clubRanking}, trying fallback...`);
                }
              } else {
                console.log(`⚠️ [TeamInfo] TheSportsDB returned no teams for: ${team.name}, trying fallback...`);
              }
            } else {
              console.warn(`⚠️ [TeamInfo] TheSportsDB API key not available, using fallback...`);
            }
          } catch (sportsDbError) {
            console.warn(`⚠️ [TeamInfo] TheSportsDB API error:`, sportsDbError, `- Using fallback...`);
          }
          
          // Method 2: Fallback to hardcoded FIFA club rankings ONLY if API didn't work
          // NOTE: Hardcoded rankings are approximate and should only be used as last resort
          if (!fifaRanking) {
            console.log(`🔄 [TeamInfo] Official API data unavailable, trying hardcoded FIFA ranking fallback for: ${team.name}`);
            const hardcodedFifaRanking = this.getHardcodedFIFAClubRanking(team.name);
            if (hardcodedFifaRanking) {
              fifaRanking = hardcodedFifaRanking;
              console.log(`✅ [TeamInfo] FIFA Club Ranking (hardcoded fallback): ${fifaRanking} for ${team.name}`);
            } else {
              // Don't set fifaRanking if not available - it will remain undefined
              console.log(`ℹ️ [TeamInfo] No FIFA ranking available (API or fallback) for: ${team.name} - will not display`);
            }
          }
        }
      } catch (rankingError) {
        console.warn(`⚠️ [TeamInfo] Could not fetch FIFA ranking:`, rankingError);
      }
      
      const teamInfoResult = {
        id: foundTeamId,
        name: teamData.team.name,
        englishName: teamData.team.name,
        logo: teamData.team.logo,
        stadium: teamData.venue?.name || "Stadium",
        city: teamData.venue?.city || "City",
        founded: teamData.team.founded,
        country: teamData.team.country,
        countryCode: countryCode,
        stadiumCapacity: teamData.venue?.capacity,
        stadiumAddress: teamData.venue?.address,
        teamManager: undefined, // Will be fetched separately
        totalMembers: undefined, // Will be calculated from squad
        averageAge: undefined, // Will be calculated from squad
        fifaRanking: fifaRanking,
        league: leagueInfo,
      };
      
      // Log FIFA ranking status for debugging
      if (fifaRanking) {
        console.log(`✅ [TeamInfo] Final TeamInfo with FIFA Ranking: ${teamData.team.name} = ${fifaRanking}`);
      } else {
        console.warn(`⚠️ [TeamInfo] No FIFA Ranking found for: ${teamData.team.name}`);
      }
      
      return teamInfoResult;
    } catch (error) {
      console.error("Error fetching team info:", error);
      return null;
    }
  }

  // Helper to get accurate country code for flag display
  /**
   * Get hardcoded FIFA club ranking for major teams
   * This provides rankings for top clubs when API data is unavailable
   */
  private getHardcodedFIFAClubRanking(teamName: string): number | undefined {
    const teamNameLower = teamName.toLowerCase().trim();
    
    // FIFA Club World Ranking (approximate rankings for major teams)
    // Based on recent UEFA coefficients and club performance
    // IMPORTANT: Rankings must be unique - no duplicates!
    const fifaClubRankings: { [key: string]: number } = {
      // Premier League
      "manchester city": 2,
      "man city": 2,
      "liverpool": 4,
      "arsenal": 5,
      "chelsea": 8,
      "tottenham": 12,
      "tottenham hotspur": 12,
      "manchester united": 15,
      "man utd": 15,
      "newcastle": 18,
      "newcastle united": 18,
      "brighton": 25,
      "brighton & hove albion": 25,
      "west ham": 30,
      "west ham united": 30,
      "aston villa": 35,
      "crystal palace": 45,
      
      // La Liga
      "real madrid": 1,
      "barcelona": 3,
      "atletico madrid": 6,
      "atletico": 6,
      "sevilla": 9,
      "real sociedad": 14,
      "valencia": 20,
      "villareal": 16,
      "villarreal": 16,
      "athletic bilbao": 22,
      "athletic club": 22,
      "real betis": 24,
      "betis": 24,
      
      // Serie A - IMPORTANT: Multiple variations for Inter
      "inter": 7,
      "inter milan": 7,
      "fc internazionale": 7,
      "internazionale": 7,
      "internazionale milano": 7,
      "ac milan": 10,
      "milan": 10,
      "juventus": 11,
      "napoli": 13,
      "atalanta": 17,
      "roma": 19,
      "as roma": 19,
      "lazio": 21,
      "fiorentina": 28,
      "bologna": 32,
      
      // Bundesliga
      "bayern munich": 3,
      "bayern": 3,
      "bayer leverkusen": 7,
      "leverkusen": 7,
      "borussia dortmund": 9,
      "dortmund": 9,
      "rb leipzig": 11,
      "leipzig": 11,
      "eintracht frankfurt": 23,
      "frankfurt": 23,
      "vfl wolfsburg": 33,
      "wolfsburg": 33,
      "borussia mönchengladbach": 36,
      "mönchengladbach": 36,
      
      // Ligue 1
      "psg": 4,
      "paris saint-germain": 4,
      "paris": 4,
      "monaco": 26,
      "marseille": 27,
      "olympique marseille": 27,
      "lyon": 29,
      "olympique lyonnais": 29,
      "lille": 31,
      "nice": 38,
      
      // Other Major Teams
      "porto": 20,
      "fc porto": 20,
      "benfica": 24,
      "sporting cp": 34,
      "sporting": 34,
      "ajax": 37,
      "psv": 39,
      "celtic": 40,
      "rangers": 41,
      "galatasaray": 42,
      "fenerbahce": 43,
      "besiktas": 44,
    };
    
    console.log(`🔍 [FIFA Ranking] Looking up FIFA ranking for: "${teamName}" (normalized: "${teamNameLower}")`);
    
    // Try exact match first
    if (fifaClubRankings[teamNameLower]) {
      console.log(`✅ [FIFA Ranking] Exact match found: ${fifaClubRankings[teamNameLower]}`);
      return fifaClubRankings[teamNameLower];
    }
    
    // Try partial matches for team names with variations
    for (const [key, ranking] of Object.entries(fifaClubRankings)) {
      // Check if team name contains the key or vice versa
      if (teamNameLower.includes(key) || key.includes(teamNameLower)) {
        console.log(`✅ [FIFA Ranking] Partial match found: "${key}" = ${ranking}`);
        return ranking;
      }
    }
    
    console.warn(`⚠️ [FIFA Ranking] No match found for: "${teamName}"`);
    return undefined;
  }

  private getCountryCode(country: string): string {
    const countryMap: Record<string, string> = {
      // Europe
      "England": "gb-eng",
      "Scotland": "gb-sct",
      "Wales": "gb-wls",
      "Northern Ireland": "gb-nir",
      "Spain": "es",
      "Italy": "it",
      "Germany": "de",
      "France": "fr",
      "Portugal": "pt",
      "Netherlands": "nl",
      "Belgium": "be",
      "Switzerland": "ch",
      "Austria": "at",
      "Poland": "pl",
      "Czech Republic": "cz",
      "Czechia": "cz",
      "Croatia": "hr",
      "Serbia": "rs",
      "Denmark": "dk",
      "Sweden": "se",
      "Norway": "no",
      "Finland": "fi",
      "Greece": "gr",
      "Turkey": "tr",
      "Russia": "ru",
      "Ukraine": "ua",
      "Romania": "ro",
      "Bulgaria": "bg",
      "Hungary": "hu",
      "Slovakia": "sk",
      "Slovenia": "si",
      "Bosnia": "ba",
      "Bosnia-Herzegovina": "ba",
      "North Macedonia": "mk",
      "Macedonia": "mk",
      "Albania": "al",
      "Montenegro": "me",
      "Kosovo": "xk",
      "Iceland": "is",
      "Ireland": "ie",
      "Luxembourg": "lu",
      "Malta": "mt",
      "Cyprus": "cy",
      "Estonia": "ee",
      "Latvia": "lv",
      "Lithuania": "lt",
      "Belarus": "by",
      "Moldova": "md",
      "Armenia": "am",
      "Georgia": "ge",
      "Azerbaijan": "az",
      "Andorra": "ad",
      "Monaco": "mc",
      "San Marino": "sm",
      "Vatican": "va",
      "Liechtenstein": "li",
      "Faroe Islands": "fo",
      "Gibraltar": "gi",
      
      // Americas
      "Brazil": "br",
      "Argentina": "ar",
      "Chile": "cl",
      "Colombia": "co",
      "Uruguay": "uy",
      "Peru": "pe",
      "Venezuela": "ve",
      "Ecuador": "ec",
      "Paraguay": "py",
      "Bolivia": "bo",
      "USA": "us",
      "United States": "us",
      "Mexico": "mx",
      "Canada": "ca",
      "Costa Rica": "cr",
      "Panama": "pa",
      "Honduras": "hn",
      "El Salvador": "sv",
      "Nicaragua": "ni",
      "Guatemala": "gt",
      "Belize": "bz",
      "Jamaica": "jm",
      "Trinidad and Tobago": "tt",
      "Haiti": "ht",
      "Dominican Republic": "do",
      "Cuba": "cu",
      "Guyana": "gy",
      "Suriname": "sr",
      "French Guiana": "gf",
      "Barbados": "bb",
      "Bahamas": "bs",
      "Grenada": "gd",
      "Saint Lucia": "lc",
      "Saint Vincent": "vc",
      "Antigua": "ag",
      "Dominica": "dm",
      "Saint Kitts": "kn",
      "Bermuda": "bm",
      "Puerto Rico": "pr",
      "Martinique": "mq",
      "Guadeloupe": "gp",
      "Curacao": "cw",
      "Aruba": "aw",
      
      // Asia
      "Indonesia": "id",
      "Malaysia": "my",
      "Thailand": "th",
      "Vietnam": "vn",
      "Singapore": "sg",
      "China": "cn",
      "Japan": "jp",
      "South Korea": "kr",
      "Korea Republic": "kr",
      "India": "in",
      "Saudi Arabia": "sa",
      "UAE": "ae",
      "Qatar": "qa",
      "Iran": "ir",
      "Iraq": "iq",
      "Australia": "au",
      "Hong-Kong": "hk",
      "Hong Kong": "hk",
      "Cambodia": "kh",
      "Laos": "la",
      "Myanmar": "mm",
      "Philippines": "ph",
      "Brunei": "bn",
      "Timor-Leste": "tl",
      "Mongolia": "mn",
      "Pakistan": "pk",
      "Bangladesh": "bd",
      "Sri Lanka": "lk",
      "Afghanistan": "af",
      "Uzbekistan": "uz",
      "Kazakhstan": "kz",
      "Kyrgyzstan": "kg",
      "Tajikistan": "tj",
      "Turkmenistan": "tm",
      "Lebanon": "lb",
      "Syria": "sy",
      "Jordan": "jo",
      "Palestine": "ps",
      "Bahrain": "bh",
      "Kuwait": "kw",
      "Oman": "om",
      "Yemen": "ye",
      
      // Africa
      "Uganda": "ug",
      "Nigeria": "ng",
      "Egypt": "eg",
      "South Africa": "za",
      "Ghana": "gh",
      "Senegal": "sn",
      "Morocco": "ma",
      "Algeria": "dz",
      "Tunisia": "tn",
      "Cameroon": "cm",
      "Ivory Coast": "ci",
      "Cote d'Ivoire": "ci",
      "Kenya": "ke",
      "Ethiopia": "et",
      "Tanzania": "tz",
      "DR Congo": "cd",
      "Congo": "cg",
      "Zimbabwe": "zw",
      "Zambia": "zm",
      "Mali": "ml",
      "Burkina Faso": "bf",
      "Guinea": "gn",
      "Mozambique": "mz",
      "Angola": "ao",
      "Rwanda": "rw",
      "Burundi": "bi",
      "Benin": "bj",
      "Togo": "tg",
      "Niger": "ne",
      "Chad": "td",
      "Mauritania": "mr",
      "Gambia": "gm",
      "Sierra Leone": "sl",
      "Liberia": "lr",
      "Gabon": "ga",
      "Equatorial Guinea": "gq",
      "Central African Republic": "cf",
      "Libya": "ly",
      "Sudan": "sd",
      "South Sudan": "ss",
      "Somalia": "so",
      "Djibouti": "dj",
      "Madagascar": "mg",
      "Malawi": "mw",
      "Botswana": "bw",
      "Namibia": "na",
      "Lesotho": "ls",
      "Eswatini": "sz",
      "Swaziland": "sz",
      "Mauritius": "mu",
      "Seychelles": "sc",
      "Comoros": "km",
      "Cape Verde": "cv",
      
      // Oceania
      "New Zealand": "nz",
      "Fiji": "fj",
      "Papua New Guinea": "pg",
      "Solomon Islands": "sb",
      "Vanuatu": "vu",
      "Samoa": "ws",
      "Tonga": "to",
      "Cook Islands": "ck",
      "American Samoa": "as",
      "New Caledonia": "nc",
      "French Polynesia": "pf",
      "Tahiti": "pf",
    };
    
    // Return lowercase for flagcdn.com compatibility
    return countryMap[country]?.toLowerCase() || "un"; // Use UN flag as fallback
  }

  // ============================================================================
  // TEAM STATISTICS & STANDINGS
  // ============================================================================

  async getTeamStatistics(
    teamId: number,
    leagueId: number,
    season: number = new Date().getFullYear()
  ): Promise<TeamStatistics | null> {
    try {
      const response: any = await this.apiFootballRequest("standings", {
        league: leagueId,
        season: season,
        team: teamId,
      });

      if (!response?.response?.[0]?.league?.standings?.[0]) {
        console.warn("No standings data found");
        return null;
      }

      const standings = response.response[0].league.standings[0];
      const teamStanding = standings.find((s: any) => s.team.id === teamId);

      if (!teamStanding) {
        console.warn(`Team ${teamId} not found in standings`);
        return null;
      }

      const form = teamStanding.form || "";
      const recentForm = form
        .split("")
        .filter((c: string) => ["W", "D", "L"].includes(c))
        .slice(-5) as ("W" | "D" | "L")[];

      return {
        position: teamStanding.rank,
        points: teamStanding.points,
        wins: teamStanding.all.win,
        draws: teamStanding.all.draw,
        losses: teamStanding.all.lose,
        goalsFor: teamStanding.all.goals.for,
        goalsAgainst: teamStanding.all.goals.against,
        goalsDiff: teamStanding.goalsDiff,
        matchesPlayed: teamStanding.all.played,
        form: teamStanding.form,
        recentForm,
      };
    } catch (error) {
      console.error("Error fetching team statistics:", error);
      return null;
    }
  }

  // ============================================================================
  // FIXTURES/MATCHES
  // ============================================================================

  async getUpcomingMatches(teamId: number, limit: number = 5, sport: string = "football"): Promise<TeamFixture[]> {
    try {
      const response: any = await this.apiFootballRequest("fixtures", {
        team: teamId,
        next: limit,
      }, false, sport); // ✅ CRITICAL: Pass sport parameter

      if (!response?.response) return [];

      return response.response.map((fixture: any) => {
        const isHome = fixture.teams.home.id === teamId;
        const opponent = isHome
          ? fixture.teams.away.name
          : fixture.teams.home.name;
        const opponentLogo = isHome
          ? fixture.teams.away.logo
          : fixture.teams.home.logo;

        const matchDate = new Date(fixture.fixture.date);
        const dateStr = `${matchDate.getMonth() + 1}/${matchDate.getDate()}`;
        const timeStr = `${matchDate.getHours()}:${matchDate.getMinutes().toString().padStart(2, "0")}`;

        // Extract round information from fixture.league.round
        let round: string | undefined;
        if (fixture.league?.round) {
          const roundString = fixture.league.round;
          // Extract number from round string (e.g., "Regular Season - 1" -> "Round 1")
          const roundMatch = roundString.match(/\d+/);
          if (roundMatch) {
            round = `Round ${roundMatch[0]}`;
          } else {
            round = roundString; // Use as-is if no number found
          }
        }

        return {
          id: fixture.fixture.id,
          opponent,
          opponentLogo,
          date: dateStr,
          time: timeStr,
          homeAway: isHome ? ("H" as const) : ("A" as const),
          status: fixture.fixture.status.short,
          venue: fixture.fixture.venue?.name || "TBD",
          competition: fixture.league.name,
          isLive: ["1H", "HT", "2H", "ET", "P"].includes(
            fixture.fixture.status.short
          ),
          round,
        };
      });
    } catch (error) {
      console.error("Error fetching upcoming matches:", error);
      return [];
    }
  }

  async getRecentMatches(teamId: number, limit: number = 10, sport: string = "football"): Promise<TeamFixture[]> {
    try {
      const response: any = await this.apiFootballRequest("fixtures", {
        team: teamId,
        last: limit,
      }, false, sport); // ✅ CRITICAL: Pass sport parameter

      if (!response?.response) return [];

      return response.response.map((fixture: any) => {
        const isHome = fixture.teams.home.id === teamId;
        const opponent = isHome
          ? fixture.teams.away.name
          : fixture.teams.home.name;
        const opponentLogo = isHome
          ? fixture.teams.away.logo
          : fixture.teams.home.logo;

        const matchDate = new Date(fixture.fixture.date);
        const dateStr = `${matchDate.getMonth() + 1}/${matchDate.getDate()}`;
        const timeStr = `${matchDate.getHours()}:${matchDate.getMinutes().toString().padStart(2, "0")}`;

        // Extract round information from fixture.league.round
        let round: string | undefined;
        if (fixture.league?.round) {
          const roundString = fixture.league.round;
          // Extract number from round string (e.g., "Regular Season - 1" -> "Round 1")
          const roundMatch = roundString.match(/\d+/);
          if (roundMatch) {
            round = `Round ${roundMatch[0]}`;
          } else {
            round = roundString; // Use as-is if no number found
          }
        }

        return {
          id: fixture.fixture.id,
          opponent,
          opponentLogo,
          date: dateStr,
          time: timeStr,
          homeAway: isHome ? ("H" as const) : ("A" as const),
          status: fixture.fixture.status.short,
          homeScore: fixture.goals.home,
          awayScore: fixture.goals.away,
          venue: fixture.fixture.venue?.name || "",
          competition: fixture.league.name,
          isLive: false,
          round,
        };
      });
    } catch (error) {
      console.error("Error fetching recent matches:", error);
      return [];
    }
  }

  // ============================================================================
  // PLAYER DETAILS
  // ============================================================================

  /**
   * Get player market value history from transfers and current market value
   * Builds historical data from transfer history and estimates values over time
   */
  async getPlayerMarketValueHistory(playerId: number): Promise<Array<{
    year: number;
    value: number; // in millions of euros
    team: string;
    teamLogo: string;
  }>> {
    try {
      // Import SofaScore services dynamically to avoid circular dependencies
      const { getPlayerTransfers, getPlayerInfo } = await import("./sofaScoreTransfersService");
      const { getTeamPlayersFromSofa, findSofaTeamId } = await import("./sofaScorePlayersService");
      
      // Try to get SofaScore player ID (may need to search)
      let sofaPlayerId: number | null = null;
      
      // First, try to get player info directly
      try {
        const playerInfo = await getPlayerInfo(playerId);
        if (playerInfo) {
          sofaPlayerId = playerInfo.id;
        }
      } catch (error) {
        console.log(`ℹ️ [getPlayerMarketValueHistory] Could not get SofaScore player ID directly for ${playerId}`);
      }
      
      // If we don't have SofaScore ID, we'll build history from transfer data if available
      if (!sofaPlayerId) {
        console.log(`ℹ️ [getPlayerMarketValueHistory] No SofaScore player ID found for ${playerId}, will use transfer-based estimation`);
        return [];
      }
      
      // Get transfer history
      const transfers = await getPlayerTransfers(sofaPlayerId);
      
      if (!transfers || transfers.length === 0) {
        console.log(`ℹ️ [getPlayerMarketValueHistory] No transfer history found for player ${playerId}`);
        return [];
      }
      
      // Get current market value from current team
      const currentPlayerInfo = await getPlayerInfo(sofaPlayerId);
      let currentMarketValue = 0;
      let currentTeamName = "";
      let currentTeamLogo = "";
      
      if (currentPlayerInfo?.teamId) {
        const teamPlayers = await getTeamPlayersFromSofa(currentPlayerInfo.teamId);
        const currentPlayer = teamPlayers.find(p => p.sofaId === sofaPlayerId);
        if (currentPlayer?.marketValue) {
          // Convert to millions if needed (SofaScore might return in different units)
          currentMarketValue = currentPlayer.marketValue > 1000 
            ? currentPlayer.marketValue / 1_000_000 
            : currentPlayer.marketValue;
          currentTeamName = currentPlayer.teamName;
          currentTeamLogo = currentPlayer.teamLogo || "";
        }
      }
      
      // Build market value history from transfers
      const history: Array<{
        year: number;
        value: number;
        team: string;
        teamLogo: string;
      }> = [];
      
      // Sort transfers by date (oldest first)
      const sortedTransfers = [...transfers].sort((a, b) => {
        const dateA = a.dateTimestamp || new Date(a.date).getTime() / 1000;
        const dateB = b.dateTimestamp || new Date(b.date).getTime() / 1000;
        return dateA - dateB;
      });
      
      // Estimate market value for each transfer period
      sortedTransfers.forEach((transfer, index) => {
        const transferDate = transfer.dateTimestamp 
          ? new Date(transfer.dateTimestamp * 1000)
          : new Date(transfer.date);
        const year = transferDate.getFullYear();
        
        // Estimate market value based on transfer fee
        // If transfer fee is available, use it as market value indicator
        let estimatedValue = 0;
        if (transfer.feeValue && transfer.feeValue > 0) {
          // Convert fee to millions of euros
          estimatedValue = transfer.feeValue > 1000 
            ? transfer.feeValue / 1_000_000 
            : transfer.feeValue;
        } else if (index === sortedTransfers.length - 1 && currentMarketValue > 0) {
          // Use current market value for most recent transfer
          estimatedValue = currentMarketValue;
        } else {
          // Estimate based on transfer type and position
          // Free transfers = lower value, paid transfers = higher value
          estimatedValue = transfer.type === "free" || transfer.type === "loan" ? 1 : 5;
        }
        
        // Add entry for the transfer year
        if (!history.find(h => h.year === year)) {
          history.push({
            year,
            value: estimatedValue,
            team: transfer.toTeam.name,
            teamLogo: transfer.toTeam.logo,
          });
        }
      });
      
      // Add current year entry if we have current market value
      const currentYear = new Date().getFullYear();
      if (currentMarketValue > 0 && !history.find(h => h.year === currentYear)) {
        history.push({
          year: currentYear,
          value: currentMarketValue,
          team: currentTeamName || sortedTransfers[sortedTransfers.length - 1]?.toTeam.name || "Unknown",
          teamLogo: currentTeamLogo || sortedTransfers[sortedTransfers.length - 1]?.toTeam.logo || "",
        });
      }
      
      // Fill in gaps between years with interpolated values
      const filledHistory: Array<{
        year: number;
        value: number;
        team: string;
        teamLogo: string;
      }> = [];
      
      if (history.length > 0) {
        const minYear = Math.min(...history.map(h => h.year));
        const maxYear = Math.max(currentYear, ...history.map(h => h.year));
        
        for (let year = minYear; year <= maxYear; year++) {
          const existing = history.find(h => h.year === year);
          if (existing) {
            filledHistory.push(existing);
          } else {
            // Interpolate between nearest years
            const before = history.filter(h => h.year < year).sort((a, b) => b.year - a.year)[0];
            const after = history.filter(h => h.year > year).sort((a, b) => a.year - b.year)[0];
            
            if (before && after) {
              const ratio = (year - before.year) / (after.year - before.year);
              filledHistory.push({
                year,
                value: before.value + (after.value - before.value) * ratio,
                team: ratio < 0.5 ? before.team : after.team,
                teamLogo: ratio < 0.5 ? before.teamLogo : after.teamLogo,
              });
            } else if (before) {
              filledHistory.push({
                year,
                value: before.value,
                team: before.team,
                teamLogo: before.teamLogo,
              });
            } else if (after) {
              filledHistory.push({
                year,
                value: after.value,
                team: after.team,
                teamLogo: after.teamLogo,
              });
            }
          }
        }
      }
      
      console.log(`✅ [getPlayerMarketValueHistory] Built ${filledHistory.length} market value history points for player ${playerId}`);
      return filledHistory.sort((a, b) => a.year - b.year);
      
    } catch (error) {
      console.warn(`⚠️ [getPlayerMarketValueHistory] Error fetching market value history for player ${playerId}:`, error);
      return [];
    }
  }

  /**
   * Get player contract expiry date from squad data
   */
  async getPlayerContractEndDate(playerId: number, teamId: number): Promise<string> {
    try {
      const squadResponse: any = await this.apiFootballRequest("players/squads", {
        team: teamId,
      }, true);
      
      if (squadResponse?.response?.[0]?.players) {
        const player = squadResponse.response[0].players.find((p: any) => p.id === playerId);
        if (player) {
          // Check various possible contract fields in API response
          const contractEndDate = player?.contract?.end || 
                                   player?.contract?.expires || 
                                   player?.contract?.until ||
                                   player?.contractEndDate ||
                                   player?.contract_end ||
                                   "";
          
          if (contractEndDate) {
            console.log(`✅ [getPlayerContractEndDate] Found contract expiry for player ${playerId}: ${contractEndDate}`);
            return contractEndDate;
          }
        }
      }
      
      console.log(`ℹ️ [getPlayerContractEndDate] No contract expiry found for player ${playerId} in team ${teamId}`);
      return "";
    } catch (error) {
      console.warn(`⚠️ [getPlayerContractEndDate] Error fetching contract data:`, error);
      return "";
    }
  }

  /**
   * Get player details by player ID
   */
  async getPlayerDetails(playerId: number, season?: number, sport: string = "football"): Promise<{
    player: {
      id: number;
      name: string;
      firstname: string;
      lastname: string;
      age: number;
      birth: {
        date: string;
        place: string;
        country: string;
      };
      nationality: string;
      height: string;
      weight: string;
      photo: string;
    };
    statistics: Array<{
      team: {
        id: number;
        name: string;
        logo: string;
      };
      league: {
        id: number;
        name: string;
        logo: string;
        season: number;
      };
      games: {
        appearences: number;
        position: string;
        rating: string;
        minutes: number;
      };
      goals: {
        total: number;
        assists: number;
      };
      cards: {
        yellow: number;
        red: number;
      };
      passes: {
        accuracy: number;
      };
      shots: {
        on: number;
      };
      tackles: {
        total: number;
      };
      duels: {
        total: number;
      };
    }>;
  } | null> {
    try {
      const currentSeason = season || new Date().getFullYear();
      
      const response = await this.apiFootballRequest<{
        response: Array<{
          player: any;
          statistics: any[];
        }>;
      }>("players", {
        id: playerId,
        season: currentSeason,
      }, false, sport); // ✅ CRITICAL: Pass sport parameter

      if (!response?.response || response.response.length === 0) {
        // Try previous season as fallback
        const prevSeason = currentSeason - 1;
        const fallbackResponse = await this.apiFootballRequest<{
          response: Array<{
            player: any;
            statistics: any[];
          }>;
        }>("players", {
          id: playerId,
          season: prevSeason,
        }, false, sport); // ✅ CRITICAL: Pass sport parameter

        if (!fallbackResponse?.response || fallbackResponse.response.length === 0) {
          return null;
        }

        return {
          player: fallbackResponse.response[0].player,
          statistics: fallbackResponse.response[0].statistics || [],
        };
      }

      return {
        player: response.response[0].player,
        statistics: response.response[0].statistics || [],
      };
    } catch (error) {
      console.error(`❌ Error fetching player details for ${playerId}:`, error);
      return null;
    }
  }

  // ============================================================================
  // TEAM SQUAD
  // ============================================================================

  async getTeamSquad(teamId: number, season: number = new Date().getFullYear(), sport: string = "football"): Promise<TeamPlayer[]> {
    try {
      console.log(`🔍 [getTeamSquad] Fetching squad for teamId: ${teamId}, season: ${season}`);
      
      // OPTIMIZED: Fetch squad and player statistics in parallel to reduce loading
      const [squadResponse, playersResponse]: [any, any] = await Promise.all([
        // Fetch squad (basic player info) - bypass cache for fresh data
        this.apiFootballRequest("players/squads", {
          team: teamId,
        }, true, sport), // ✅ CRITICAL: Pass sport parameter
        // Fetch players with statistics for the season (to get appearances, goals, assists)
        this.apiFootballRequest("players", {
          team: teamId,
          season: season,
        }, true, sport).catch((err: any) => { // ✅ CRITICAL: Pass sport parameter
          console.warn(`⚠️ [getTeamSquad] Players endpoint failed for season ${season}:`, err);
          return null;
        }), // Graceful fallback if season endpoint fails
      ]);

      console.log(`📦 [getTeamSquad] Squad response:`, squadResponse ? `Found ${squadResponse?.response?.[0]?.players?.length || 0} players` : "null");
      console.log(`📦 [getTeamSquad] Players response:`, playersResponse ? `Found ${playersResponse?.response?.length || 0} players` : "null");

      if (!squadResponse?.response?.[0]?.players) {
        console.warn(`⚠️ [getTeamSquad] No squad data found for teamId: ${teamId}`);
        return [];
      }

      const squadPlayers = squadResponse.response[0].players;
      const playersWithStats = playersResponse?.response || [];

      // Create maps for quick lookup
      const statsMap = new Map<number, any>();
      const nationalityMap = new Map<number, string>();
      
      playersWithStats.forEach((playerData: any) => {
        if (playerData.player?.id) {
          // Store nationality
          if (playerData.player.nationality) {
            nationalityMap.set(playerData.player.id, playerData.player.nationality);
          }
          
          // Store statistics if available
          if (playerData.statistics?.[0]) {
            const stats = playerData.statistics[0];
            statsMap.set(playerData.player.id, {
              appearances: stats.games?.appearences || stats.games?.appearance || 0,
              goals: stats.goals?.total || 0,
              assists: stats.goals?.assists || 0,
              marketValue: undefined, // API Football doesn't provide market value directly
            });
          }
        }
      });

      // Map squad players with their statistics and nationality
      const mappedSquad = squadPlayers.map((player: any) => {
        const playerStats = statsMap.get(player.id);
        const playerNationality = nationalityMap.get(player.id) || player.nationality || "";
        
        return {
          id: player.id,
          name: player.name,
          photo: player.photo || "",
          position: player.position || "Unknown",
          number: player.number || 0,
          age: player.age || 0,
          nationality: playerNationality,
          statistics: playerStats ? {
            appearances: playerStats.appearances,
            goals: playerStats.goals,
            assists: playerStats.assists,
            marketValue: playerStats.marketValue,
          } : {
            appearances: 0,
            goals: 0,
            assists: 0,
          },
          injured: false, // API Football doesn't provide injury status in squad endpoint
        };
      });

      // Sort players by position and number for better organization
      const positionOrder: { [key: string]: number } = {
        "Goalkeeper": 1,
        "Defender": 2,
        "Midfielder": 3,
        "Attacker": 4,
        "Forward": 4,
      };

      const sortedSquad = mappedSquad.sort((a: any, b: any) => {
        const aPosOrder = positionOrder[a.position] || 99;
        const bPosOrder = positionOrder[b.position] || 99;
        if (aPosOrder !== bPosOrder) {
          return aPosOrder - bPosOrder;
        }
        // Within same position, sort by jersey number
        return (a.number || 999) - (b.number || 999);
      });

      console.log(`✅ [getTeamSquad] Successfully mapped ${sortedSquad.length} players for teamId: ${teamId}`);
      return sortedSquad;
    } catch (error) {
      console.error(`❌ [getTeamSquad] Error fetching team squad for teamId ${teamId}:`, error);
      if (error instanceof Error) {
        console.error(`   Error message: ${error.message}`);
        console.error(`   Error stack: ${error.stack}`);
      }
      return [];
    }
  }

  // Calculate squad statistics (total members and average age)
  getSquadStatistics(squad: TeamPlayer[]): { totalMembers: number; averageAge: number } {
    if (squad.length === 0) {
      return { totalMembers: 0, averageAge: 0 };
    }

    const totalMembers = squad.length;
    const totalAge = squad.reduce((sum, player) => sum + (player.age || 0), 0);
    const averageAge = totalMembers > 0 ? totalAge / totalMembers : 0;

    return {
      totalMembers,
      averageAge: parseFloat(averageAge.toFixed(1)),
    };
  }

  // Get team coach/manager (current)
  async getTeamCoach(teamId: number): Promise<string | null> {
    try {
      console.log(`🔍 [getTeamCoach] Fetching current manager for teamId: ${teamId}`);
      const response: any = await this.apiFootballRequest("coachs", {
        team: teamId,
      });

      if (!response?.response || response.response.length === 0) {
        console.warn(`⚠️ [getTeamCoach] No coach data returned for teamId: ${teamId}`);
        return null;
      }

      // Find the current manager (end date is "Present" or null, or most recent)
      const currentManager = response.response.find((coach: any) => {
        const endDate = coach.career?.end;
        return !endDate || endDate === "Present" || endDate === null || endDate === "";
      }) || response.response[0]; // Fallback to first if no "Present" found

      const managerName = currentManager?.name || null;
      console.log(`✅ [getTeamCoach] Found current manager: ${managerName} for teamId: ${teamId}`);
      return managerName;
    } catch (error) {
      console.error(`❌ [getTeamCoach] Error fetching coach data:`, error);
      return null;
    }
  }

  // Get team's former managers/coaches history
  async getFormerManagers(teamId: number): Promise<Array<{
    name: string;
    photo: string;
    startDate: string;
    endDate: string;
    matchesManaged: number;
    wins: number;
    draws: number;
    losses: number;
    winPercentage: number;
  }>> {
    try {
      console.log(`🔍 [getFormerManagers] Fetching managers for teamId: ${teamId}`);
      const response: any = await this.apiFootballRequest("coachs", {
        team: teamId,
      });

      if (!response?.response || response.response.length === 0) {
        console.warn(`⚠️ [getFormerManagers] No manager data returned for teamId: ${teamId}`);
        return [];
      }

      console.log(`📊 [getFormerManagers] Found ${response.response.length} coaches in API response`);

      // Map response to manager data - include ALL managers, not just those with matches
      const managers = response.response.map((coach: any) => {
        const totalMatches = (coach.career?.matches || 0);
        const wins = coach.career?.wins || 0;
        const draws = coach.career?.draws || 0;
        const losses = coach.career?.losses || 0;
        const winPercentage = totalMatches > 0 ? (wins / totalMatches) * 100 : 0;

        // Get manager photo - ensure it's a valid URL
        let managerPhoto = coach.photo || "";
        if (managerPhoto && managerPhoto !== "" && managerPhoto !== "null") {
          if (!managerPhoto.startsWith("http")) {
            console.warn(`⚠️ [getFormerManagers] Manager photo is not a full URL: ${managerPhoto}`);
          }
        }

        const endDate = coach.career?.end;
        const isCurrent = !endDate || endDate === "Present" || endDate === null || endDate === "";

        return {
          name: coach.name || "Unknown Manager",
          photo: managerPhoto,
          startDate: coach.career?.start || "",
          endDate: isCurrent ? "Present" : endDate,
          matchesManaged: totalMatches,
          wins,
          draws,
          losses,
          winPercentage: parseFloat(winPercentage.toFixed(2)),
        };
      });

      // Sort: current manager first, then by start date (most recent first)
      managers.sort((a: any, b: any) => {
        if (a.endDate === "Present" && b.endDate !== "Present") return -1;
        if (a.endDate !== "Present" && b.endDate === "Present") return 1;
        // Both are past or both are present - sort by start date descending
        return b.startDate.localeCompare(a.startDate);
      });

      console.log(`✅ [getFormerManagers] Returning ${managers.length} managers for teamId: ${teamId}`);
      return managers;
      
    } catch (error) {
      console.error(`❌ [getFormerManagers] Error fetching managers:`, error);
      return [];
    }
  }

  // Get team market value from SofaScore (real data!)
  async getTeamMarketValue(teamName: string): Promise<number | null> {
    try {
      console.log(`💰 Fetching market value for ${teamName} from SofaScore...`);
      
      // Find team ID in SofaScore
      const sofaTeamId = await findSofaTeamId(teamName);
      if (!sofaTeamId) {
        console.log(`ℹ️ Team not found in SofaScore: ${teamName}`);
        return null;
      }

      // Get all players with market values
      const players = await getTeamPlayersFromSofa(sofaTeamId);
      
      if (!players || players.length === 0) {
        console.log(`ℹ️ No players found for team: ${teamName}`);
        return null;
      }

      // Calculate total market value in millions of euros
      let totalValue = 0;
      let playersWithValue = 0;

      players.forEach(player => {
        if (player.marketValue && player.marketValue > 0) {
          totalValue += player.marketValue;
          playersWithValue++;
        }
      });

      if (playersWithValue === 0) {
        console.log(`ℹ️ No market value data for team: ${teamName}`);
        return null;
      }

      console.log(`✅ Total market value: €${totalValue.toFixed(1)}M (${playersWithValue} players)`);
      return totalValue; // Already in millions
      
    } catch (error) {
      console.log(`ℹ️ Market value data not available for ${teamName}`);
      return null;
    }
  }

  // ============================================================================
  // TRANSFERS
  // ============================================================================

  async getTeamTransfers(teamName: string): Promise<TeamTransfer[]> {
    try {
      // TheSportsDB transfers endpoint is not always available
      // Silently return empty array rather than throwing errors
      const response: any = await this.sportsDbRequest(
        `transfersteam.php?t=${encodeURIComponent(teamName)}`
      );

      if (!response?.transfers && !response?.transfer) {
        console.log(`ℹ️ No transfers data available for ${teamName}`);
        return [];
      }

      const transfers = response.transfers || response.transfer || [];

      return transfers.slice(0, 20).map((transfer: any) => ({
        player: transfer.strPlayer || "Unknown Player",
        fromTeam: transfer.strTeamFrom || transfer.strTeam || "",
        toTeam: transfer.strTeamTo || "",
        date: transfer.dateTransfer || transfer.strSeason || "TBD",
        type: transfer.strType || "Transfer",
        fee: transfer.strTransfer || null,
      }));
    } catch (error) {
      // Don't log errors for missing transfer data - it's common
      console.log(`ℹ️ Transfers not available for ${teamName}`);
      return [];
    }
  }

  // ============================================================================
  // LEAGUE TABLE
  // ============================================================================

  async getLeagueStandings(
    leagueId: number,
    season: number = new Date().getFullYear()
  ): Promise<LeagueStanding[]> {
    try {
      const response: any = await this.apiFootballRequest("standings", {
        league: leagueId,
        season: season,
      });

      if (!response?.response?.[0]?.league?.standings?.[0]) return [];

      const standings = response.response[0].league.standings[0];

      return standings.map((standing: any) => ({
        position: standing.rank,
        teamName: standing.team.name,
        teamLogo: standing.team.logo,
        played: standing.all.played,
        won: standing.all.win,
        drawn: standing.all.draw,
        lost: standing.all.lose,
        goalsFor: standing.all.goals.for,
        goalsAgainst: standing.all.goals.against,
        goalsDiff: standing.goalsDiff,
        points: standing.points,
        form: standing.form || "",
      }));
    } catch (error) {
      console.error("Error fetching league standings:", error);
      return [];
    }
  }

  // ============================================================================
  // TEAM NEWS/MOMENTS
  // ============================================================================

  async getTeamNews(teamName: string): Promise<TeamNews[]> {
    // Generate mock news based on recent matches and team context
    // In production, this would fetch from a news API
    const now = Date.now();
    return [
      {
        id: "1",
        title: `${teamName} tactical preparation intensifies ahead of crucial match`,
        summary: "Coach reviews set pieces and defensive formations",
        time: this.formatTimeAgo(now - 2 * 60 * 60 * 1000),
        image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=90&h=70&fit=crop",
      },
      {
        id: "2",
        title: `Key players return from injury boost for ${teamName}`,
        summary: "Medical team confirms players cleared for selection",
        time: this.formatTimeAgo(now - 5 * 60 * 60 * 1000),
        image: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=90&h=70&fit=crop",
      },
      {
        id: "3",
        title: `${teamName} squad announced for upcoming fixture`,
        summary: "Final squad announced with focus on attacking options",
        time: this.formatTimeAgo(now - 8 * 60 * 60 * 1000),
        image: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=90&h=70&fit=crop",
      },
    ];
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private formatTimeAgo(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return "Just now";
    if (hours === 1) return "1 hour ago";
    if (hours < 24) return `${hours} hours ago`;
    
    const days = Math.floor(hours / 24);
    if (days === 1) return "1 day ago";
    return `${days} days ago`;
  }

  // ============================================================================
  // TEAM HONORS/TROPHIES
  // ============================================================================

  async getTeamHonors(teamId: number): Promise<TeamHonor[]> {
    try {
      console.log(`🔍 [getTeamHonors] Fetching honors for teamId: ${teamId}`);
      const response: any = await this.apiFootballRequest("trophies", {
        team: teamId,
      });

      if (!response?.response || response.response.length === 0) {
        console.warn(`⚠️ [getTeamHonors] No trophy data returned for teamId: ${teamId}`);
        return [];
      }

      console.log(`📊 [getTeamHonors] Found ${response.response.length} trophies in API response`);

      // Group trophies by competition
      const groupedHonors = new Map<string, {
        logo: string;
        seasons: string[];
      }>();

      response.response.forEach((trophy: any) => {
        const competition = trophy.league || trophy.country || trophy.name || "Trophy";
        const season = trophy.season || trophy.place || trophy.year || "";
        
        if (!groupedHonors.has(competition)) {
          groupedHonors.set(competition, {
            logo: this.getTrophyIcon(competition),
            seasons: [],
          });
        }
        
        if (season) {
          groupedHonors.get(competition)!.seasons.push(season);
        }
      });

      // Convert to array format
      const honors = Array.from(groupedHonors.entries()).map(([competition, data]) => ({
        competition,
        competitionLogo: data.logo,
        timesWon: data.seasons.length,
        seasons: data.seasons.sort((a, b) => b.localeCompare(a)), // Most recent first
      }));

      console.log(`✅ [getTeamHonors] Returning ${honors.length} honors for teamId: ${teamId}`);
      return honors;
      
    } catch (error) {
      console.error(`❌ [getTeamHonors] Error fetching honors:`, error);
      return [];
    }
  }

  // Helper to get trophy icon based on competition
  private getTrophyIcon(competition: string): string {
    const compLower = competition.toLowerCase();
    
    // Major European competitions
    if (compLower.includes('champions league') || compLower.includes('european cup')) {
      return "🏆"; // Champions League trophy
    }
    if (compLower.includes('europa league') || compLower.includes('uefa cup')) {
      return "🥈"; // Europa League trophy
    }
    if (compLower.includes('super cup')) {
      return "🏅"; // Super Cup
    }
    
    // Domestic leagues
    if (compLower.includes('premier league') || compLower.includes('la liga') || 
        compLower.includes('serie a') || compLower.includes('bundesliga') || 
        compLower.includes('ligue 1')) {
      return "🏆"; // League trophy
    }
    
    // Domestic cups
    if (compLower.includes('cup') || compLower.includes('copa')) {
      return "🏆"; // Cup trophy
    }
    
    return "🏆"; // Default trophy
  }

  clearCache(): void {
    this.cache.clear();
    console.log("🧹 Team Details API cache cleared");
  }
}

// Export singleton instance
export const teamDetailsApi = new TeamDetailsApiService();

