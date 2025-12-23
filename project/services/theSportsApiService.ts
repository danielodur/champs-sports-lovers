/**
 * ✅ PRIMARY API SERVICE: TheSports.com API
 * 
 * This is now the PRIMARY sports data provider with:
 * - Rich data for BOTH football AND basketball
 * - Live matches, fixtures, statistics, lineups, events
 * - Transfers, trophies, player details
 * - Team and league information
 * 
 * API Documentation: https://api.thesports.com/documentation
 * Subscription: Paid subscription with IP whitelisting
 */

import {
  Fixture,
  FootballFixturesResponse,
  FixtureLeague,
} from "../types/football-fixtures-response";

// Configuration interface
export interface TheSportsApiConfig {
  apiUser: string;
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  enableCaching?: boolean;
  cacheExpiry?: number;
}

// Cache implementation
interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

class Cache {
  private cache = new Map<string, CacheItem<any>>();
  private readonly defaultExpiry: number;

  constructor(defaultExpiry: number = 10 * 60 * 1000) {
    this.defaultExpiry = defaultExpiry;
  }

  set<T>(key: string, data: T, expiry?: number): void {
    const timestamp = Date.now();
    const itemExpiry = expiry || this.defaultExpiry;
    
    this.cache.set(key, {
      data,
      timestamp,
      expiry: itemExpiry,
    });

    console.log(
      `💾 [TheSports Cache] Stored ${key.substring(0, 50)}... (expires in ${Math.round(itemExpiry / 1000)}s)`
    );
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > item.expiry) {
      this.cache.delete(key);
      console.log(`⏱️ [TheSports Cache] Expired: ${key.substring(0, 50)}...`);
      return null;
    }

    console.log(`✅ [TheSports Cache] Hit: ${key.substring(0, 50)}...`);
    return item.data;
  }

  clear(): void {
    this.cache.clear();
    console.log(`🗑️ [TheSports Cache] Cleared`);
  }
}

/**
 * TheSports API Service Class
 */
export class TheSportsApiService {
  private config: Required<TheSportsApiConfig>;
  private cache: Cache;

  constructor(config: TheSportsApiConfig) {
    this.config = {
      baseUrl: "https://api.thesports.com/v1",
      timeout: 15000,
      enableCaching: true,
      cacheExpiry: 10 * 60 * 1000, // 10 minutes default
      ...config,
    };

    this.cache = new Cache(this.config.cacheExpiry);

    // Validate credentials
    if (!this.config.apiKey || !this.config.apiUser) {
      console.error("❌ [TheSports PRIMARY] API credentials missing!");
      throw new Error("TheSports API credentials required");
    }

    console.log("✅ [TheSports PRIMARY] Initialized successfully");
    console.log(`   User: ${this.config.apiUser}`);
    console.log(`   Base URL: ${this.config.baseUrl}`);
  }

  /**
   * Generate cache key
   */
  private generateCacheKey(endpoint: string, params?: Record<string, any>): string {
    const paramString = params ? JSON.stringify(params) : "";
    return `thesports:${endpoint}:${paramString}`;
  }

  /**
   * Make HTTP request to TheSports API
   */
  private async makeRequest<T = any>(
    endpoint: string,
    params?: Record<string, any>,
    useCache: boolean = true
  ): Promise<T> {
    try {
      // Check cache first
      if (useCache && this.config.enableCaching) {
        const cacheKey = this.generateCacheKey(endpoint, params);
        const cachedData = this.cache.get<T>(cacheKey);
        if (cachedData) {
          return cachedData;
        }
      }

      // Build URL with query parameters
      const url = new URL(endpoint, this.config.baseUrl);
      
      // Add authentication parameters
      url.searchParams.append("user", this.config.apiUser);
      url.searchParams.append("secret", this.config.apiKey);
      
      // Add other parameters
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            url.searchParams.append(key, String(value));
          }
        });
      }

      console.log(`🔄 [TheSports PRIMARY] ${endpoint}`);

      // Make request with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle response
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Check for API errors
      if (data.code !== 0) {
        throw new Error(`API Error (code: ${data.code}): ${data.message || "Unknown error"}`);
      }

      console.log(`✅ [TheSports PRIMARY] Success - ${data.query?.total || 0} results`);

      // Cache successful response
      if (useCache && this.config.enableCaching) {
        const cacheKey = this.generateCacheKey(endpoint, params);
        this.cache.set(cacheKey, data);
      }

      return data as T;
    } catch (error: any) {
      if (error.name === "AbortError") {
        throw new Error("Request timeout");
      }
      // ✅ GRACEFUL FALLBACK: Use warn instead of error for expected failures (404, rate limits, etc.)
      // Only log as error for unexpected failures (network errors, timeouts)
      const isExpectedFailure = error.message?.includes('HTTP 404') || 
                                 error.message?.includes('HTTP 429') ||
                                 error.message?.includes('HTTP 401');
      
      if (isExpectedFailure) {
        console.warn(`⚠️ [TheSports PRIMARY] ${error.message} - Falling back to API-Football...`);
      } else {
        console.error(`❌ [TheSports PRIMARY] Unexpected error:`, error.message);
      }
      throw error;
    }
  }

  /**
   * Transform TheSports fixture to our standard Fixture format
   */
  private transformFixture(match: any, sport: string): Fixture {
    return {
      fixture: {
        id: match.id ? this.hashIdToNumber(match.id) : 0,
        referee: null,
        timezone: "UTC",
        date: new Date(match.match_time * 1000).toISOString(),
        timestamp: match.match_time,
        periods: {
          first: null,
          second: null,
        },
        venue: {
          id: match.venue_id ? this.hashIdToNumber(match.venue_id) : null,
          name: null,
          city: null,
        },
        status: {
          long: this.mapStatusLong(match.status_id),
          short: this.mapStatusShort(match.status_id),
          elapsed: this.getElapsedTime(match),
          extra: null,
        },
      },
      league: {
        id: match.competition_id ? this.hashIdToNumber(match.competition_id) : 0,
        name: null,
        country: null,
        logo: null,
        flag: null,
      },
      teams: {
        home: {
          id: match.home_team_id ? this.hashIdToNumber(match.home_team_id) : 0,
          name: null,
          logo: null,
        },
        away: {
          id: match.away_team_id ? this.hashIdToNumber(match.away_team_id) : 0,
          name: null,
          logo: null,
        },
      },
      goals: {
        home: match.home_scores?.[0] || 0,
        away: match.away_scores?.[0] || 0,
      },
      score: {
        halftime: {
          home: match.home_scores?.[1] || null,
          away: match.away_scores?.[1] || null,
        },
        fulltime: {
          home: match.home_scores?.[0] || null,
          away: match.away_scores?.[0] || null,
        },
        extratime: {
          home: null,
          away: null,
        },
        penalty: {
          home: null,
          away: null,
        },
      },
      events: null,
      // Preserve TheSports-specific data
      _theSportsData: {
        originalId: match.id,
        coverage: match.coverage,
        environment: match.environment,
      },
    } as Fixture;
  }

  /**
   * Convert TheSports hash ID to numeric ID for compatibility
   */
  private hashIdToNumber(hashId: string): number {
    let hash = 0;
    for (let i = 0; i < hashId.length; i++) {
      const char = hashId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Extract year from season ID
   */
  private extractSeasonYear(seasonId: string): number {
    // For now, return current year
    // TODO: Implement season lookup if needed
    return new Date().getFullYear();
  }

  /**
   * Map TheSports status ID to status short code
   */
  private mapStatusShort(statusId: number): "NS" | "1H" | "HT" | "2H" | "ET" | "BT" | "P" | "FT" | "AET" | "PEN" | "AOT" | "CANC" | "ABD" | "SUSP" | "INT" | "PST" | null {
    // Based on common status codes
    switch (statusId) {
      case 0:
      case 1:
        return "NS"; // Not Started
      case 2:
      case 3:
        return "1H"; // First Half
      case 4:
        return "HT"; // Halftime
      case 5:
      case 6:
        return "2H"; // Second Half
      case 7:
      case 8:
        return "FT"; // Finished
      case 9:
        return "PST"; // Postponed
      case 10:
        return "CANC"; // Cancelled
      default:
        return "NS";
    }
  }

  /**
   * Map status ID to long description
   */
  private mapStatusLong(statusId: number): string {
    switch (statusId) {
      case 0:
      case 1:
        return "Not Started";
      case 2:
      case 3:
        return "First Half";
      case 4:
        return "Halftime";
      case 5:
      case 6:
        return "Second Half";
      case 7:
      case 8:
        return "Match Finished";
      case 9:
        return "Postponed";
      case 10:
        return "Cancelled";
      default:
        return "Not Started";
    }
  }

  /**
   * Get elapsed time based on status
   */
  private getElapsedTime(match: any): number | null {
    const statusId = match.status_id;
    if (statusId >= 2 && statusId <= 6) {
      // Live match - calculate elapsed time
      const startTime = match.match_time;
      const now = Math.floor(Date.now() / 1000);
      return Math.floor((now - startTime) / 60); // Minutes elapsed
    }
    return null;
  }

  /**
   * Determine winner
   */
  private determineWinner(match: any, team: "home" | "away"): boolean | null {
    const homeScore = match.home_scores?.[0] || 0;
    const awayScore = match.away_scores?.[0] || 0;
    
    if (homeScore === awayScore) return null;
    
    return team === "home" ? homeScore > awayScore : awayScore > homeScore;
  }

  /**
   * PUBLIC API METHODS
   */

  /**
   * Get fixtures (matches)
   */
  async getFixtures(
    teamId?: string,
    leagueId?: string,
    season?: string,
    date?: string,
    status?: string,
    live?: string,
    sport: string = "football"
  ): Promise<FootballFixturesResponse> {
    try {
      const params: Record<string, any> = {
        type: "diary", // Match diary/schedule
      };

      if (date) params.date = date;
      if (leagueId) params.comp = leagueId;
      if (teamId) params.team = teamId;

      const endpoint = sport === "basketball" ? "/basketball/match/diary" : "/football/match/diary";
      const response = await this.makeRequest(endpoint, params);

      // Transform to our standard format
      const fixtures: Fixture[] = (response.results || []).map((match: any) =>
        this.transformFixture(match, sport)
      );

      return {
        get: "fixtures",
        parameters: {
          live: live || "all",
          date: date || null,
        },
        errors: [],
        results: fixtures.length,
        paging: {
          current: 1,
          total: 1,
        },
        response: fixtures,
      };
    } catch (error: any) {
      // ✅ GRACEFUL FALLBACK: Don't log errors here - already logged in makeRequest
      // Just re-throw to allow fallback chain to work
      throw error;
    }
  }

  /**
   * Get fixture by ID
   */
  async getFixtureById(fixtureId: number, sport: string = "football"): Promise<any> {
    try {
      const endpoint = sport === "basketball" ? "/basketball/match/detail" : "/football/match/detail";
      const response = await this.makeRequest(endpoint, { id: fixtureId });
      
      if (!response.results || response.results.length === 0) {
        return null;
      }

      return this.transformFixture(response.results[0], sport);
    } catch (error: any) {
      // ✅ GRACEFUL: Don't log errors here - already logged in makeRequest
      return null;
    }
  }

  /**
   * Get match statistics
   */
  async getMatchStatistics(fixtureId: number, sport: string = "football"): Promise<any> {
    try {
      const endpoint = sport === "basketball" ? "/basketball/match/statistics" : "/football/match/statistics";
      return await this.makeRequest(endpoint, { id: fixtureId });
    } catch (error: any) {
      // ✅ GRACEFUL: Don't log errors here - already logged in makeRequest
      return null;
    }
  }

  /**
   * Get match events
   */
  async getMatchEvents(fixtureId: number, sport: string = "football"): Promise<any> {
    try {
      const endpoint = sport === "basketball" ? "/basketball/match/events" : "/football/match/events";
      return await this.makeRequest(endpoint, { id: fixtureId });
    } catch (error: any) {
      // ✅ GRACEFUL: Don't log errors here - already logged in makeRequest
      return null;
    }
  }

  /**
   * Get match lineups
   */
  async getMatchLineups(fixtureId: number, sport: string = "football"): Promise<any> {
    try {
      const endpoint = sport === "basketball" ? "/basketball/match/lineup" : "/football/match/lineup";
      return await this.makeRequest(endpoint, { id: fixtureId });
    } catch (error: any) {
      // ✅ GRACEFUL: Don't log errors here - already logged in makeRequest
      return null;
    }
  }

  /**
   * Get match player statistics
   */
  async getMatchPlayerStats(fixtureId: number): Promise<any> {
    try {
      return await this.makeRequest("/football/match/player_stats", { id: fixtureId });
    } catch (error: any) {
      // ✅ GRACEFUL: Don't log errors here - already logged in makeRequest
      return null;
    }
  }

  /**
   * Get team information
   */
  async getTeamInfo(teamId: number): Promise<any> {
    try {
      return await this.makeRequest("/football/team/detail", { id: teamId });
    } catch (error: any) {
      // ✅ GRACEFUL: Don't log errors here - already logged in makeRequest
      return null;
    }
  }

  /**
   * Get standings
   */
  async getStandings(leagueId: number, season?: number): Promise<any> {
    try {
      const params: Record<string, any> = { comp: leagueId };
      if (season) params.season = season;
      
      return await this.makeRequest("/football/competition/standings", params);
    } catch (error: any) {
      // ✅ GRACEFUL: Don't log errors here - already logged in makeRequest
      return null;
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// Create and export singleton instance
const apiUser = process.env.EXPO_PUBLIC_THE_SPORTS_API_USER || "";
const apiKey = process.env.EXPO_PUBLIC_THE_SPORTS_API_KEY || "";

if (!apiUser || !apiKey) {
  console.warn("⚠️ [TheSports API] DISABLED - Missing credentials (this is expected)");
  console.warn("   TheSports API is currently disabled in favor of API-Sports backend");
  console.warn("   If you see errors from TheSports API, they can be safely ignored");
}

// ✅ CRITICAL FIX: Prevent TheSports API calls if credentials are missing
const isTheSportsEnabled = Boolean(apiUser && apiKey);

export const theSportsApiService = isTheSportsEnabled 
  ? new TheSportsApiService({ apiUser, apiKey })
  : null as any; // Return null to prevent API calls when disabled

export default theSportsApiService;
