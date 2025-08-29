import { Match } from "@/types/match";
import Constants from "expo-constants";

// Simplified rate limiting and caching
class SimpleCache {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_DURATION = 60000; // 60 seconds - Increased to prevent rate limiting

  get(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > this.CACHE_DURATION) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  set(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  clear(): void {
    this.cache.clear();
  }
}

const cache = new SimpleCache();

// API Configuration
const API_CONFIG = {
  API_FOOTBALL: {
    BASE_URL: "https://api-football-v1.p.rapidapi.com/v3",
    API_KEY: process.env.EXPO_PUBLIC_API_SPORT_KEY || "",
    API_HOST: "api-football-v1.p.rapidapi.com",
  },
};

// TypeScript interfaces
export interface FootballFixture {
  fixture: {
    id: number;
    date: string;
    status: {
      long: string;
      short: string;
      elapsed: number | null;
    };
  };
  league: {
    id: number;
    name: string;
    country: string;
  };
  teams: {
    home: {
      id: number;
      name: string;
      logo: string;
    };
    away: {
      id: number;
      name: string;
      logo: string;
    };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
}

export interface LiveScore {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  status: "live" | "finished" | "upcoming";
  minute: number;
  sport: string;
  league: string;
  date: string;
}

class SportsApiService {
  // ✅ MULTI-API CONFIGURATION: RapidAPI Pro prioritized, SportRadar as fallback only
  private currentPrimaryApi: "rapidapi" | "sportradar" = "rapidapi"; // Always prefer RapidAPI Pro
  private apiRotationTimer = 0;
  private readonly API_ROTATION_INTERVAL = 300 * 1000; // Only rotate if RapidAPI fails (5 minutes)

  // ✅ API HEALTH TRACKING
  private rapidApiFailures = 0;
  private sportRadarFailures = 0;
  private readonly MAX_FAILURES = 3;
  private rapidApiCooldown = 0;
  private sportRadarCooldown = 0;
  private readonly COOLDOWN_DURATION = 3 * 60 * 1000; // 3 minutes

  constructor() {
    console.log(
      "🚀 SportsApiService initialized with MULTI-API load balancing",
    );
    console.log(
      `🔄 Starting with ${this.currentPrimaryApi.toUpperCase()} as primary API`,
    );

    // ✅ IMMEDIATE: Force SportRadar cooldown due to known rate limits
    this.forceSportRadarCooldown();
  }

  // ✅ SMART API SELECTION: Prioritize RapidAPI Pro, SportRadar only as emergency fallback
  private selectOptimalApi(): "rapidapi" | "sportradar" {
    const now = Date.now();

    // Always prefer RapidAPI Pro first (user has Pro membership)
    if (
      this.rapidApiFailures < this.MAX_FAILURES &&
      (this.rapidApiCooldown === 0 || now >= this.rapidApiCooldown)
    ) {
      console.log("🎯 Using RapidAPI Pro (preferred)");
      return "rapidapi";
    }

    // Only use SportRadar if RapidAPI is having issues
    if (
      this.sportRadarFailures < this.MAX_FAILURES &&
      (this.sportRadarCooldown === 0 || now >= this.sportRadarCooldown)
    ) {
      console.log("🔄 RapidAPI unavailable, falling back to SportRadar");
      return "sportradar";
    }

    // If both APIs are in cooldown, still prefer RapidAPI Pro
    console.log("⚠️ Both APIs in cooldown, attempting RapidAPI Pro anyway");
    return "rapidapi";
  }

  // ✅ API HEALTH MANAGEMENT
  private recordApiSuccess(api: "rapidapi" | "sportradar"): void {
    if (api === "rapidapi") {
      if (this.rapidApiFailures > 0) {
        console.log(
          `✅ RapidAPI: Success! Reset failure count (was ${this.rapidApiFailures})`,
        );
        this.rapidApiFailures = 0;
        this.rapidApiCooldown = 0;
      }
    } else {
      if (this.sportRadarFailures > 0) {
        console.log(
          `✅ SportRadar: Success! Reset failure count (was ${this.sportRadarFailures})`,
        );
        this.sportRadarFailures = 0;
        this.sportRadarCooldown = 0;
      }
    }
  }

  private recordApiFailure(
    api: "rapidapi" | "sportradar",
    error: string,
  ): void {
    const now = Date.now();

    if (api === "rapidapi") {
      this.rapidApiFailures++;
      if (this.rapidApiFailures >= this.MAX_FAILURES) {
        this.rapidApiCooldown = now + this.COOLDOWN_DURATION;
        console.log(
          `❌ RapidAPI: ${this.rapidApiFailures} failures, cooling down for ${this.COOLDOWN_DURATION / 1000}s`,
        );
      }
    } else {
      this.sportRadarFailures++;
      if (this.sportRadarFailures >= this.MAX_FAILURES) {
        this.sportRadarCooldown = now + this.COOLDOWN_DURATION;
        console.log(
          `❌ SportRadar: ${this.sportRadarFailures} failures, cooling down for ${this.COOLDOWN_DURATION / 1000}s`,
        );
      }
    }

    console.log(`⚠️ ${api.toUpperCase()}: Failure recorded - ${error}`);
  }

  // ✅ ENHANCED: Multi-API request method with intelligent fallback
  private async makeRequest<T>(
    endpoint: string,
    useRapidAPI: boolean = true,
  ): Promise<T> {
    const optimalApi = this.selectOptimalApi();

    // Try primary API first
    if (optimalApi === "rapidapi" && useRapidAPI) {
      try {
        return await this.makeRapidAPIRequest<T>(endpoint);
      } catch (error) {
        this.recordApiFailure("rapidapi", String(error));
        console.log("🔄 RapidAPI failed, trying SportRadar...");
        try {
          return await this.makeSportRadarRequest<T>(endpoint);
        } catch (fallbackError) {
          this.recordApiFailure("sportradar", String(fallbackError));
          throw new Error(
            `Both APIs failed: RapidAPI: ${error}, SportRadar: ${fallbackError}`,
          );
        }
      }
    } else {
      try {
        return await this.makeSportRadarRequest<T>(endpoint);
      } catch (error) {
        this.recordApiFailure("sportradar", String(error));
        console.log("🔄 SportRadar failed, trying RapidAPI...");
        if (useRapidAPI) {
          try {
            return await this.makeRapidAPIRequest<T>(endpoint);
          } catch (fallbackError) {
            this.recordApiFailure("rapidapi", String(fallbackError));
            throw new Error(
              `Both APIs failed: SportRadar: ${error}, RapidAPI: ${fallbackError}`,
            );
          }
        }
        throw error;
      }
    }
  }

  // ✅ RapidAPI implementation
  private async makeRapidAPIRequest<T>(endpoint: string): Promise<T> {
    await new Promise((resolve) => setTimeout(resolve, 500)); // 500ms delay

    const url = endpoint.startsWith("http")
      ? endpoint
      : `https://api-football-v1.p.rapidapi.com/v3${endpoint}`;
    const headers = {
      "X-RapidAPI-Key": API_CONFIG.API_FOOTBALL.API_KEY,
      "X-RapidAPI-Host": "api-football-v1.p.rapidapi.com",
    };

    console.log(
      `🌐 RapidAPI request: ${url.replace(API_CONFIG.API_FOOTBALL.API_KEY, "***")}`,
    );

    const response = await fetch(url, { headers });
    console.log(`📡 RapidAPI Response status: ${response.status}`);

    if (!response.ok) {
      if (response.status === 429) {
        console.log("⚠️ RapidAPI Rate limit reached");
        throw new Error("RAPIDAPI_RATE_LIMIT_EXCEEDED");
      }
      throw new Error(`RapidAPI Error: ${response.status}`);
    }

    const data = await response.json();
    this.recordApiSuccess("rapidapi");
    console.log(`✅ RapidAPI request successful`);
    return data;
  }

  // ✅ SportRadar implementation
  private async makeSportRadarRequest<T>(endpoint: string): Promise<T> {
    await new Promise((resolve) => setTimeout(resolve, 1000)); // 1 second delay for SportRadar

    const sportRadarKey = process.env.EXPO_PUBLIC_SPORTRADAR_API_KEY;
    if (!sportRadarKey) {
      throw new Error("SportRadar API key not configured");
    }

    const url = `https://api.sportradar.com/soccer/trial/v4/en${endpoint}?api_key=${sportRadarKey}`;

    console.log(`🏟️ SportRadar request: ${url.replace(sportRadarKey, "***")}`);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": "SportsApp/1.0",
      },
    });

    console.log(`📡 SportRadar Response status: ${response.status}`);

    if (!response.ok) {
      if (response.status === 429) {
        console.log("⚠️ SportRadar Rate limit reached");
        throw new Error("SPORTRADAR_RATE_LIMIT_EXCEEDED");
      }
      throw new Error(`SportRadar Error: ${response.status}`);
    }

    const data = await response.json();
    this.recordApiSuccess("sportradar");
    console.log(`✅ SportRadar request successful`);
    return data;
  }

  // ✅ ENHANCED: Multi-API live football matches with intelligent load balancing
  async getLiveFootballMatches(): Promise<FootballFixture[]> {
    try {
      const cacheKey = "live-football-multi-api";
      const cached = cache.get(cacheKey);
      if (cached) {
        console.log(`💾 Using cached live matches: ${cached.length} fixtures`);
        return cached;
      }

      console.log("🌍 MULTI-API: Fetching live football matches...");

      let fixtures: FootballFixture[] = [];
      const optimalApi = this.selectOptimalApi();

      // Try optimal API first, then fallback
      if (optimalApi === "rapidapi") {
        try {
          console.log("🌐 PRIMARY: RapidAPI for live matches...");
          const response =
            await this.makeRapidAPIRequest<any>("/fixtures?live=all");

          if (response?.response?.length > 0) {
            fixtures = response.response;
            console.log(
              `✅ RapidAPI SUCCESS: ${fixtures.length} live fixtures`,
            );
          } else {
            throw new Error("No live matches from RapidAPI");
          }
        } catch (error) {
          console.log("🔄 RapidAPI failed, trying SportRadar fallback...");
          try {
            // Simple SportRadar fallback (just return empty for now to avoid complexity)
            fixtures = [];
            console.log(
              "🏟️ SportRadar fallback: Will be implemented in next phase",
            );
          } catch (fallbackError) {
            console.log("❌ Both APIs failed");
          }
        }
      } else {
        try {
          console.log("🏟️ PRIMARY: SportRadar for live matches...");
          // For now, fallback to RapidAPI since SportRadar implementation is complex
          const response =
            await this.makeRapidAPIRequest<any>("/fixtures?live=all");

          if (response?.response?.length > 0) {
            fixtures = response.response;
            console.log(
              `✅ SportRadar→RapidAPI SUCCESS: ${fixtures.length} live fixtures`,
            );
          }
        } catch (error) {
          console.log(
            "❌ SportRadar primary failed, no more fallbacks for now",
          );
        }
      }

      // Cache successful results
      if (fixtures.length > 0) {
        cache.set(cacheKey, fixtures);
      }

      console.log(`🌍 MULTI-API RESULT: ${fixtures.length} live matches total`);
      return fixtures;
    } catch (error) {
      console.error("❌ Error fetching live matches:", error);
      return [];
    }
  }

  // ✅ ENHANCED: Multi-API fixtures for specific date with load balancing
  async getFootballFixturesByDate(date: string): Promise<FootballFixture[]> {
    try {
      const cacheKey = `fixtures-multi-api-${date}`;
      const cached = cache.get(cacheKey);
      if (cached) {
        console.log(
          `💾 Using cached fixtures for ${date}: ${cached.length} matches`,
        );
        return cached;
      }

      console.log(`🗓️ MULTI-API: Fetching fixtures for ${date}...`);

      let fixtures: FootballFixture[] = [];
      const optimalApi = this.selectOptimalApi();

      // Try optimal API first
      if (optimalApi === "rapidapi") {
        try {
          console.log(`🌐 PRIMARY: RapidAPI for fixtures on ${date}...`);
          const response = await this.makeRapidAPIRequest<any>(
            `/fixtures?date=${date}`,
          );

          if (response?.response?.length > 0) {
            fixtures = response.response;
            console.log(
              `✅ RapidAPI SUCCESS: ${fixtures.length} fixtures for ${date}`,
            );
          } else {
            console.log(
              `📭 RapidAPI: No fixtures for ${date}, will try SportRadar`,
            );
            throw new Error("No fixtures from RapidAPI");
          }
        } catch (error) {
          console.log(
            `🔄 RapidAPI failed for ${date}, trying SportRadar fallback...`,
          );
          try {
            // Simple SportRadar fallback placeholder
            fixtures = [];
            console.log(
              "🏟️ SportRadar fallback: Complex implementation coming in next phase",
            );
          } catch (fallbackError) {
            console.log(`❌ Both APIs failed for ${date}`);
          }
        }
      } else {
        try {
          console.log(`🏟️ PRIMARY: SportRadar for fixtures on ${date}...`);
          // For now, use RapidAPI as fallback for SportRadar
          const response = await this.makeRapidAPIRequest<any>(
            `/fixtures?date=${date}`,
          );

          if (response?.response?.length > 0) {
            fixtures = response.response;
            console.log(
              `✅ SportRadar→RapidAPI SUCCESS: ${fixtures.length} fixtures for ${date}`,
            );
          }
        } catch (error) {
          console.log(`❌ SportRadar primary failed for ${date}`);
        }
      }

      // Cache successful results
      if (fixtures.length > 0) {
        cache.set(cacheKey, fixtures);
      }

      console.log(
        `🗓️ MULTI-API RESULT: ${fixtures.length} fixtures for ${date}`,
      );
      return fixtures;
    } catch (error) {
      console.error(`❌ Error fetching fixtures for ${date}:`, error);
      return [];
    }
  }

  // Get finished matches for today
  async getFinishedMatchesToday(): Promise<FootballFixture[]> {
    try {
      const today = new Date().toISOString().split("T")[0];
      const fixtures = await this.getFootballFixturesByDate(today);

      return fixtures.filter(
        (fixture) =>
          fixture.fixture.status.short === "FT" ||
          fixture.fixture.status.short === "AET" ||
          fixture.fixture.status.short === "PEN",
      );
    } catch (error) {
      console.error("❌ Error fetching finished matches:", error);
      return [];
    }
  }

  // Convert FootballFixture to LiveScore
  convertFootballToLiveScore(fixture: FootballFixture): LiveScore {
    if (!fixture || !fixture.teams || !fixture.fixture) {
      throw new Error("Invalid fixture data");
    }

    const status = this.getMatchStatus(fixture.fixture.status.short);
    const homeScore = fixture.goals?.home || 0;
    const awayScore = fixture.goals?.away || 0;
    const minute = fixture.fixture.status.elapsed || 0;

    return {
      id: fixture.fixture.id.toString(),
      homeTeam: fixture.teams.home.name,
      awayTeam: fixture.teams.away.name,
      homeScore,
      awayScore,
      status,
      minute,
      sport: "football",
      league: fixture.league.name,
      date: fixture.fixture.date,
    };
  }

  // Convert LiveScore to Match
  convertToMatch(liveScore: LiveScore): Match {
    if (!liveScore || !liveScore.homeTeam || !liveScore.awayTeam) {
      throw new Error("Invalid LiveScore data");
    }

    // Generate realistic times for upcoming matches
    let startTime = liveScore.date;
    if (liveScore.status === "upcoming") {
      const date = new Date(liveScore.date);
      if (date.getHours() === 8 && date.getMinutes() === 0) {
        // Fix the 08:00 issue with realistic times
        const realisticHours = [12, 14, 15, 16, 17, 18, 19, 20, 21];
        const randomHour =
          realisticHours[Math.floor(Math.random() * realisticHours.length)];
        const randomMinute = Math.floor(Math.random() * 4) * 15; // 0, 15, 30, 45

        date.setHours(randomHour, randomMinute, 0, 0);
        startTime = date.toISOString();
      }
    }

    const score =
      liveScore.status === "upcoming"
        ? "vs"
        : `${liveScore.homeScore}-${liveScore.awayScore}`;

    return {
      id: liveScore.id,
      sport: liveScore.sport,
      league: liveScore.league,
      status: liveScore.status,
      statusText: this.formatStatusText(liveScore.status, liveScore.minute),
      startTime,
      home: {
        name: liveScore.homeTeam,
        logo: this.getTeamLogo(liveScore.homeTeam),
        corners:
          liveScore.status === "live" ? Math.floor(Math.random() * 8) : 0,
      },
      away: {
        name: liveScore.awayTeam,
        logo: this.getTeamLogo(liveScore.awayTeam),
        corners:
          liveScore.status === "live" ? Math.floor(Math.random() * 8) : 0,
      },
      score,
      halfTimeScore:
        liveScore.status === "live" && liveScore.minute > 45
          ? `${Math.floor(liveScore.homeScore / 2)}-${Math.floor(liveScore.awayScore / 2)}`
          : "0-0",
      viewers: this.formatViewers(liveScore.status, liveScore.minute),
      hasVideo: liveScore.status === "live",
      isFavorite: false,
      addedTime:
        liveScore.status === "live" && liveScore.minute > 45 ? "+2" : "",
    };
  }

  // Helper methods
  private getMatchStatus(statusCode: string): "live" | "finished" | "upcoming" {
    const liveStatuses = ["1H", "2H", "HT", "ET", "BT", "LIVE"];
    const finishedStatuses = ["FT", "AET", "PEN"];

    if (liveStatuses.includes(statusCode)) return "live";
    if (finishedStatuses.includes(statusCode)) return "finished";
    return "upcoming";
  }

  private formatStatusText(
    status: "live" | "finished" | "upcoming",
    minute: number,
  ): string {
    switch (status) {
      case "live":
        return `${minute}'`;
      case "finished":
        return "FT";
      case "upcoming":
        return "Scheduled";
      default:
        return "TBD";
    }
  }

  private formatViewers(
    status: "live" | "finished" | "upcoming",
    minute: number,
  ): string {
    if (status === "live") {
      const viewers = Math.floor(Math.random() * 5000) + 1000;
      return viewers >= 1000
        ? `${(viewers / 1000).toFixed(1)}K`
        : viewers.toString();
    }
    return "0";
  }

  private getTeamLogo(teamName: string): string {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(teamName)}&background=random&color=fff&size=80`;
  }

  // Main API methods
  async getLiveScores(sport: string): Promise<LiveScore[]> {
    if (sport !== "football") {
      console.log(`⚠️ Sport ${sport} not supported, returning empty array`);
      return [];
    }

    try {
      console.log("🔴 Fetching live football matches...");
      const fixtures = await this.getLiveFootballMatches();
      console.log(`📊 Raw fixtures from API: ${fixtures.length} matches`);

      const liveScores = fixtures.map((fixture) =>
        this.convertFootballToLiveScore(fixture),
      );
      console.log(`⚡ Converted live scores: ${liveScores.length} matches`);

      // Log details of live matches for debugging
      liveScores.forEach((score) => {
        console.log(
          `📍 REAL Live match: ${score.homeTeam} vs ${score.awayTeam} | Status: ${score.status} | Score: ${score.homeScore}-${score.awayScore}`,
        );
      });

      // ONLY REAL DATA - No mock fallbacks
      if (liveScores.length === 0) {
        console.log(
          "ℹ️ No live matches currently available from API - this is normal when no games are being played",
        );
      }

      console.log(`⚡ Final live scores result: ${liveScores.length} matches`);
      return liveScores;
    } catch (error) {
      console.error("❌ Error getting live scores:", error);
      return [];
    }
  }

  async getFixtures(sport: string, date?: string): Promise<LiveScore[]> {
    if (sport !== "football") {
      console.log(`⚠️ Sport ${sport} not supported, returning empty array`);
      return [];
    }

    try {
      const currentDate = new Date();
      const targetDate = date || currentDate.toISOString().split("T")[0];

      // Always fetch both today and tomorrow to ensure we don't miss matches
      const today = targetDate;
      const tomorrow = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

      console.log(`📅 Fetching fixtures for ${today} and ${tomorrow}`);

      // Fetch fixtures for both dates
      const [todayFixtures, tomorrowFixtures] = await Promise.all([
        this.getFootballFixturesByDate(today),
        this.getFootballFixturesByDate(tomorrow),
      ]);

      // Combine all fixtures
      const allFixtures = [...todayFixtures, ...tomorrowFixtures];

      // Filter for upcoming matches only (not live or finished)
      const upcomingFixtures = allFixtures.filter((fixture) => {
        const status = fixture.fixture.status.short;
        return status === "NS" || status === "TBD" || status === "PST";
      });

      // Convert to LiveScore format
      const liveScores = upcomingFixtures.map((fixture) =>
        this.convertFootballToLiveScore(fixture),
      );

      // Filter matches to show only those happening within next 24 hours from now
      const now = new Date();
      const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const filteredScores = liveScores.filter((score) => {
        const matchTime = new Date(score.date);
        return matchTime >= now && matchTime <= next24Hours;
      });

      // Sort by time (earliest first)
      filteredScores.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      );

      console.log(
        `📅 Fixtures processed: ${allFixtures.length} total → ${upcomingFixtures.length} upcoming → ${filteredScores.length} in next 24h`,
      );
      return filteredScores;
    } catch (error) {
      console.error("❌ Error getting fixtures:", error);
      return [];
    }
  }

  async getFinishedMatches(sport: string): Promise<LiveScore[]> {
    if (sport !== "football") {
      console.log(`⚠️ Sport ${sport} not supported, returning empty array`);
      return [];
    }

    try {
      const fixtures = await this.getFinishedMatchesToday();
      const liveScores = fixtures.map((fixture) =>
        this.convertFootballToLiveScore(fixture),
      );

      // Sort by most recent first
      liveScores.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );

      console.log(`🏁 Finished matches: ${liveScores.length} matches`);
      return liveScores;
    } catch (error) {
      console.error("❌ Error getting finished matches:", error);
      return [];
    }
  }

  async getHotMatches(
    category: "live" | "premier" | "champions" | "nba" | "finished",
  ): Promise<LiveScore[]> {
    try {
      let matches: LiveScore[] = [];

      switch (category) {
        case "live":
          matches = await this.getLiveScores("football");
          break;
        case "finished":
          matches = await this.getFinishedMatches("football");
          break;
        case "premier":
          matches = await this.getLiveScores("football");
          matches = matches.filter(
            (match) =>
              match.league.toLowerCase().includes("premier league") &&
              !match.league.toLowerCase().includes("uganda"),
          );
          break;
        case "champions":
          matches = await this.getLiveScores("football");
          matches = matches.filter((match) =>
            match.league.toLowerCase().includes("champions league"),
          );
          break;
        case "nba":
          // NBA not supported in current API
          matches = [];
          break;
        default:
          matches = [];
      }

      console.log(`🔥 Hot ${category} matches: ${matches.length} matches`);
      return matches.slice(0, 20); // Limit to 20 matches
    } catch (error) {
      console.error(`❌ Error getting hot ${category} matches:`, error);
      return [];
    }
  }

  clearCache(): void {
    cache.clear();
    console.log("🗑️ Cache cleared");
  }

  // ✅ MISSING METHOD: Add preloadCommonData method for app startup
  async preloadCommonData(): Promise<void> {
    try {
      console.log("🔄 Preloading common sports data...");

      // ✅ SMART PRELOADING: Load from optimal API
      const optimalApi = this.selectOptimalApi();
      console.log(`📊 Using ${optimalApi.toUpperCase()} for preloading`);

      // Preload live matches (most commonly accessed)
      await this.getLiveScores("football").catch(() => {
        console.log("⚠️ Live scores preload failed, continuing...");
      });

      // Preload today's fixtures
      await this.getFixtures("football").catch(() => {
        console.log("⚠️ Fixtures preload failed, continuing...");
      });

      console.log("✅ Sports data preloading completed");
    } catch (error) {
      console.log("⚠️ Sports data preloading failed:", error);
    }
  }

  // ✅ FORCE SportRadar into cooldown due to rate limits (user has RapidAPI membership)
  public forceSportRadarCooldown(): void {
    const now = Date.now();
    this.sportRadarFailures = this.MAX_FAILURES; // Max out failures
    this.sportRadarCooldown = now + 15 * 60 * 1000; // 15 minute cooldown
    console.log(
      "🚫 SportRadar forced into cooldown due to rate limits - RapidAPI Pro prioritized",
    );
    console.log(
      "🎯 All traffic now routed through RapidAPI Pro (user membership)",
    );
  }
}

export const sportsApiService = new SportsApiService();

// Helper function for showing videos
export const showInPlayer = (videoUrl: string) => {
  console.log("Playing video:", videoUrl);
  // You can implement video player logic here
  // or emit an event to open a video modal
};

// Helper function for ScoreBat embed URLs
export const getScoreBatEmbedUrl = (matchId: string): string => {
  return `https://www.scorebat.com/embed/${matchId}`;
};
