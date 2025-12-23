import { Platform } from "react-native";

interface TheSportsDbConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  retryAttempts?: number;
}

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface TeamDetails {
  idTeam: string;
  strTeam: string;
  strAlternate?: string;
  strLeague: string;
  strDivision?: string;
  strManager?: string;
  strStadium?: string;
  strStadiumThumb?: string;
  strStadiumDescription?: string;
  strStadiumLocation?: string;
  intStadiumCapacity?: string;
  strWebsite?: string;
  strFacebook?: string;
  strTwitter?: string;
  strInstagram?: string;
  strDescriptionEN?: string;
  strTeamBadge?: string;
  strTeamJersey?: string;
  strTeamLogo?: string;
  strYoutube?: string;
  intFormedYear?: string;
  strCountry?: string;
  strLeague2?: string;
  strLeague3?: string;
  strLeague4?: string;
  strLeague5?: string;
  strLeague6?: string;
  strLeague7?: string;
}

interface EventDetails {
  idEvent: string;
  strEvent: string;
  strFilename?: string;
  strSport: string;
  idLeague: string;
  strLeague: string;
  strSeason?: string;
  strDescriptionEN?: string;
  strHomeTeam: string;
  strAwayTeam: string;
  intHomeScore?: string;
  intAwayScore?: string;
  intRound?: string;
  strHomeGoalDetails?: string;
  strHomeRedCards?: string;
  strHomeYellowCards?: string;
  strHomeLineupGoalkeeper?: string;
  strHomeLineupDefense?: string;
  strHomeLineupMidfield?: string;
  strHomeLineupForward?: string;
  strHomeLineupSubstitutes?: string;
  strAwayGoalDetails?: string;
  strAwayRedCards?: string;
  strAwayYellowCards?: string;
  strAwayLineupGoalkeeper?: string;
  strAwayLineupDefense?: string;
  strAwayLineupMidfield?: string;
  strAwayLineupForward?: string;
  strAwayLineupSubstitutes?: string;
  strHomeFormation?: string;
  strAwayFormation?: string;
  dateEvent?: string;
  strTime?: string;
  strTimeLocal?: string;
  strTVStation?: string;
  idHomeTeam?: string;
  idAwayTeam?: string;
  strResult?: string;
  strVenue?: string;
  strCountry?: string;
  strCity?: string;
  strPoster?: string;
  strSquare?: string;
  strFanart?: string;
  strThumb?: string;
  strBanner?: string;
  strMap?: string;
  strVideo?: string;
  strStatus?: string;
  strPostponed?: string;
}

interface LeagueDetails {
  idLeague: string;
  strLeague: string;
  strSport: string;
  strLeagueAlternate?: string;
  intDivision?: string;
  idCup?: string;
  strCurrentSeason?: string;
  intFormedYear?: string;
  dateFirstEvent?: string;
  strGender?: string;
  strCountry?: string;
  strWebsite?: string;
  strFacebook?: string;
  strTwitter?: string;
  strYoutube?: string;
  strRSS?: string;
  strDescriptionEN?: string;
  strBanner?: string;
  strBadge?: string;
  strLogo?: string;
  strPoster?: string;
  strTrophy?: string;
  strNaming?: string;
  strComplete?: string;
}

export class TheSportsDbError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: any,
  ) {
    super(message);
    this.name = "TheSportsDbError";
  }
}

class TheSportsDbCache {
  private cache = new Map<string, CacheItem<any>>();
  private readonly defaultExpiry = 5 * 60 * 1000; // 5 minutes

  constructor(private expiry: number = 5 * 60 * 1000) {}

  set<T>(key: string, data: T, customExpiry?: number): void {
    const now = Date.now();
    const expiresAt = now + (customExpiry || this.expiry);
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt,
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  clear(): void {
    this.cache.clear();
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }
}

export class TheSportsDbService {
  private config: TheSportsDbConfig;
  private cache: TheSportsDbCache;
  private requestCount = 0;
  private lastRequestTime = 0;
  private readonly rateLimitDelay = 1000; // 1 second between requests

  constructor(config: TheSportsDbConfig) {
    this.config = {
      baseUrl: "https://www.thesportsdb.com/api/v1/json",
      timeout: 10000,
      retryAttempts: 3,
      ...config,
    };
    this.cache = new TheSportsDbCache();

    console.log(
      "🏈 TheSportsDB Service initialized with API key:",
      this.config.apiKey,
    );
  }

  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private generateCacheKey(
    endpoint: string,
    params?: Record<string, any>,
  ): string {
    const paramString = params ? JSON.stringify(params) : "";
    return `thesportsdb_${endpoint}_${paramString}`;
  }

  private async handleRateLimiting(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.rateLimitDelay) {
      const delayTime = this.rateLimitDelay - timeSinceLastRequest;
      await this.delay(delayTime);
    }

    this.lastRequestTime = Date.now();
  }

  private async makeRequest<T>(
    endpoint: string,
    params?: Record<string, any>,
  ): Promise<T> {
    const cacheKey = this.generateCacheKey(endpoint, params);
    const cached = this.cache.get<T>(cacheKey);

    if (cached) {
      console.log(`✅ TheSportsDB Cache hit for: ${endpoint}`);
      return cached;
    }

    await this.handleRateLimiting();

    let url = `${this.config.baseUrl}/${this.config.apiKey}/${endpoint}`;

    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      if (searchParams.toString()) {
        url += `?${searchParams.toString()}`;
      }
    }

    console.log(
      `🌐 TheSportsDB API Request: ${url.replace(this.config.apiKey, "***")}`,
    );

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        this.config.timeout,
      );

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      this.requestCount++;

      if (!response.ok) {
        throw new TheSportsDbError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status,
        );
      }

      const data = await response.json();

      if (!data) {
        throw new TheSportsDbError("No data received from TheSportsDB API");
      }

      // Cache the successful response
      this.cache.set(cacheKey, data, 10 * 60 * 1000); // 10 minutes for API data

      console.log(`✅ TheSportsDB API Success: ${endpoint}`);
      return data;
    } catch (error: any) {
      console.error(`❌ TheSportsDB API Error for ${endpoint}:`, error);

      if (error.name === "AbortError") {
        throw new TheSportsDbError("Request timeout");
      }

      if (error instanceof TheSportsDbError) {
        throw error;
      }

      throw new TheSportsDbError(`Network error: ${error.message}`, 0, error);
    }
  }

  // Get team details by name
  async getTeamByName(teamName: string): Promise<TeamDetails[]> {
    try {
      const response = await this.makeRequest<{ teams: TeamDetails[] | null }>(
        `searchteams.php?t=${encodeURIComponent(teamName)}`,
      );
      console.log(
        `🏈 TheSportsDB search result for ${teamName}:`,
        response.teams
          ? `Found ${response.teams.length} teams`
          : "No teams found",
      );
      return response.teams || [];
    } catch (error) {
      console.error("Error fetching team by name:", error);
      return [];
    }
  }

  // Get team details by ID
  async getTeamById(teamId: string): Promise<TeamDetails | null> {
    try {
      const response = await this.makeRequest<{ teams: TeamDetails[] | null }>(
        `lookupteam.php?id=${teamId}`,
      );
      return response.teams?.[0] || null;
    } catch (error) {
      console.error("Error fetching team by ID:", error);
      return null;
    }
  }

  // Get next 5 fixtures for a team
  async getNextFixtures(teamId: string): Promise<EventDetails[]> {
    try {
      const response = await this.makeRequest<{
        events: EventDetails[] | null;
      }>(`eventsnext.php?id=${teamId}`);
      console.log(
        `🏈 TheSportsDB next fixtures for team ${teamId}:`,
        response.events
          ? `Found ${response.events.length} fixtures`
          : "No fixtures found",
      );
      return response.events || [];
    } catch (error) {
      console.error("Error fetching next fixtures:", error);
      return [];
    }
  }

  // Get last 5 results for a team
  async getLastResults(teamId: string): Promise<EventDetails[]> {
    try {
      const response = await this.makeRequest<{
        results: EventDetails[] | null;
      }>(`eventslast.php?id=${teamId}`);
      console.log(
        `🏈 TheSportsDB last results for team ${teamId}:`,
        response.results
          ? `Found ${response.results.length} results`
          : "No results found",
      );
      return response.results || [];
    } catch (error) {
      console.error("Error fetching last results:", error);
      return [];
    }
  }

  // Get event details by ID
  async getEventById(eventId: string): Promise<EventDetails | null> {
    try {
      const response = await this.makeRequest<{
        events: EventDetails[] | null;
      }>(`lookupevent.php?id=${eventId}`);
      return response.events?.[0] || null;
    } catch (error) {
      console.error("Error fetching event by ID:", error);
      return null;
    }
  }

  // Get league details by ID
  async getLeagueById(leagueId: string): Promise<LeagueDetails | null> {
    try {
      const response = await this.makeRequest<{
        leagues: LeagueDetails[] | null;
      }>(`lookupleague.php?id=${leagueId}`);
      return response.leagues?.[0] || null;
    } catch (error) {
      console.error("Error fetching league by ID:", error);
      return null;
    }
  }

  // Search for leagues by name
  async searchLeagues(leagueName: string): Promise<LeagueDetails[]> {
    try {
      const response = await this.makeRequest<{
        countrys: LeagueDetails[] | null;
      }>(`search_all_leagues.php?s=${encodeURIComponent(leagueName)}`);
      return response.countrys || [];
    } catch (error) {
      console.error("Error searching leagues:", error);
      return [];
    }
  }

  // Get events for a specific date
  async getEventsByDate(
    date: string,
    sport: string = "Soccer",
  ): Promise<EventDetails[]> {
    try {
      const response = await this.makeRequest<{
        events: EventDetails[] | null;
      }>(`eventsday.php?d=${date}&s=${encodeURIComponent(sport)}`);
      console.log(
        `🏈 TheSportsDB events for ${date}:`,
        response.events
          ? `Found ${response.events.length} events`
          : "No events found",
      );
      return response.events || [];
    } catch (error) {
      console.error("Error fetching events by date:", error);
      return [];
    }
  }

  // Get live scores (only for premium API key)
  async getLiveScores(): Promise<EventDetails[]> {
    try {
      console.log("🏈 Fetching live scores with premium API key...");
      const response = await this.makeRequest<{
        events: EventDetails[] | null;
      }>("livescore.php");
      console.log(
        `🏈 TheSportsDB live scores:`,
        response.events
          ? `Found ${response.events.length} live events`
          : "No live events found",
      );
      return response.events || [];
    } catch (error: any) {
      console.warn(
        "⚠️ Live scores not available (premium feature):",
        error.message,
      );
      // Return empty array instead of throwing - this is expected for free tier
      return [];
    }
  }

  // Get league table/standings
  async getLeagueTable(leagueId: string, season?: string): Promise<any[]> {
    try {
      const endpoint = season
        ? `lookuptable.php?l=${leagueId}&s=${season}`
        : `lookuptable.php?l=${leagueId}`;

      const response = await this.makeRequest<{ table: any[] | null }>(
        endpoint,
      );
      console.log(
        `🏈 TheSportsDB table for league ${leagueId}:`,
        response.table
          ? `Found ${response.table.length} teams`
          : "No table found",
      );
      return response.table || [];
    } catch (error) {
      // ℹ️ 404 errors are expected when TheSportsDB doesn't have data for a league
      // This is normal for the fallback API - it has limited coverage
      if (error instanceof Error && (error.message.includes('404') || error.message.includes('HTTP 404'))) {
        console.log(`ℹ️ TheSportsDB: No league table data available for league ${leagueId} (expected for fallback API)`);
      } else {
        console.error("❌ TheSportsDB: Error fetching league table:", error);
      }
      return [];
    }
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
    console.log("🧹 TheSportsDB cache cleared");
  }

  // Get request count
  getRequestCount(): number {
    return this.requestCount;
  }

  // Update configuration
  updateConfig(newConfig: Partial<TheSportsDbConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      // Try to fetch a simple league lookup as a health check
      await this.makeRequest("lookupleague.php?id=4328"); // Premier League
      console.log("✅ TheSportsDB health check passed");
      return true;
    } catch (error) {
      console.error("❌ TheSportsDB health check failed:", error);
      return false;
    }
  }
}

// Create and export service instance
export const theSportsDbService = new TheSportsDbService({
  apiKey: process.env.EXPO_PUBLIC_THE_SPORTSDB_API_KEY || "test", // Fallback to test API
});

export default theSportsDbService;
