import {
  Fixture,
  FootballFixturesResponse,
  FixtureLeague,
} from "@/types/football-fixtures-response";
import goalService, { GoalData } from "./api-sports-football-goal-service";
import { SafeNotifications } from "@/utils/notificationUtils";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Import task manager and background fetch with proper error handling
let TaskManager: any = null;
let BackgroundFetch: any = null;

try {
  TaskManager = require("expo-task-manager");
} catch (error) {
  console.warn("expo-task-manager not available:", error);
}

try {
  BackgroundFetch = require("expo-background-fetch");
} catch (error) {
  console.warn("expo-background-fetch not available:", error);
}

const BACKGROUND_TASK = "send-goal-notification-task";

// Types and Interfaces
export interface ApiSportsConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  enableCaching?: boolean;
  cacheExpiry?: number;
}

// Custom Error Classes
export class ApiSportsError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: any,
  ) {
    super(message);
    this.name = "ApiSportsError";
  }
}

export class RateLimitError extends ApiSportsError {
  constructor(message: string, retryAfter?: number) {
    super(message, 429);
    this.name = "RateLimitError";
    this.retryAfter = retryAfter;
  }
  retryAfter?: number;
}

export class AuthenticationError extends ApiSportsError {
  constructor(message: string) {
    super(message, 401);
    this.name = "AuthenticationError";
  }
}

// Cache Implementation
interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

class ApiCache {
  private cache = new Map<string, CacheItem<any>>();
  private readonly defaultExpiry: number;

  constructor(defaultExpiry: number = 5 * 60 * 1000) {
    // 5 minutes default
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
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  clear(): void {
    this.cache.clear();
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }
}

// Main API Service Class
export class ApiSportsService {
  private config: Required<ApiSportsConfig>;
  private cache: ApiCache;
  private requestCount = 0;
  private lastRequestTime = 0;
  private readonly rateLimitDelay = 1000; // 1 second between requests

  constructor(config: ApiSportsConfig) {
    this.config = {
      baseUrl: "https://v3.football.api-sports.io",
      timeout: 10000,
      retryAttempts: 3,
      retryDelay: 1000,
      enableCaching: true,
      cacheExpiry: 5 * 60 * 1000, // 5 minutes
      ...config,
    };

    this.cache = new ApiCache(this.config.cacheExpiry);
  }

  // Private helper methods
  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private generateCacheKey(
    endpoint: string,
    params?: Record<string, any>,
  ): string {
    const paramString = params ? JSON.stringify(params) : "";
    return `${endpoint}:${paramString}`;
  }

  private async handleRateLimiting(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.rateLimitDelay) {
      await this.delay(this.rateLimitDelay - timeSinceLastRequest);
    }

    this.lastRequestTime = Date.now();
  }

  private async makeRequest(
    endpoint: string,
    params?: Record<string, any>,
    useCache: boolean = true,
  ): Promise<FootballFixturesResponse> {
    try {
      // Rate limiting
      // await this.handleRateLimiting();

      // Check cache first
      if (useCache && this.config.enableCaching) {
        const cacheKey = this.generateCacheKey(endpoint, params);
        const cachedData = this.cache.get<FootballFixturesResponse>(cacheKey);
        if (cachedData) {
          return cachedData;
        }
      }

      // Build URL with query parameters
      const url = new URL(endpoint, this.config.baseUrl);
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            url.searchParams.append(key, String(value));
          }
        });
      }

      // Prepare headers
      const headers: Record<string, string> = {
        "x-rapidapi-key": this.config.apiKey,
        "x-rapidapi-host": "v3.football.api-sports.io",
        "Content-Type": "application/json",
      };

      // Make the request
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        this.config.timeout,
      );

      const response = await fetch(url.toString(), {
        method: "GET",
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle different response statuses
      if (response.status === 429) {
        const retryAfter = response.headers.get("Retry-After");
        throw new RateLimitError(
          "Rate limit exceeded",
          retryAfter ? parseInt(retryAfter) : undefined,
        );
      }

      if (response.status === 401) {
        throw new AuthenticationError("Invalid API key");
      }

      if (!response.ok) {
        throw new ApiSportsError(
          `HTTP error! status: ${response.status}`,
          response.status,
        );
      }

      const data = await response.json();

      // Cache the response if caching is enabled
      if (useCache && this.config.enableCaching) {
        const cacheKey = this.generateCacheKey(endpoint, params);
        this.cache.set(cacheKey, data, this.config.cacheExpiry);
      }

      return data;
    } catch (error: unknown) {
      if (error instanceof ApiSportsError) {
        throw error;
      }

      if (error instanceof Error && error.name === "AbortError") {
        throw new ApiSportsError("Request timeout", 408);
      }

      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new ApiSportsError(`Request failed: ${errorMessage}`);
    }
  }

  private async retryRequest(
    endpoint: string,
    params?: Record<string, any>,
    attempt: number = 1,
  ): Promise<FootballFixturesResponse> {
    try {
      return await this.makeRequest(endpoint, params);
    } catch (error) {
      if (
        attempt >= this.config.retryAttempts ||
        error instanceof AuthenticationError
      ) {
        throw error;
      }

      // Wait before retrying
      await this.delay(this.config.retryDelay * attempt);
      return this.retryRequest(endpoint, params, attempt + 1);
    }
  }

  // Public API Methods

  // Teams
  // async getTeams(
  //   country?: string,
  //   league?: number,
  //   season?: number,
  //   search?: string
  // ): Promise<FootballFixturesResponse> {
  //   const params: Record<string, any> = {};
  //   if (country) params.country = country;
  //   if (league) params.league = league;
  //   if (season) params.season = season;
  //   if (search) params.search = search;

  //   return this.retryRequest("/teams", params);
  // }

  // async getTeamById(teamId: number): Promise<FootballFixturesResponse> {
  //   return this.retryRequest(`/teams`, { id: teamId });
  // }

  // async getTeamStatistics(
  //   teamId: number,
  //   leagueId: number,
  //   season: number
  // ): Promise<FootballFixturesResponse> {
  //   return this.retryRequest("/teams/statistics", {
  //     team: teamId,
  //     league: leagueId,
  //     season,
  //   });
  // }

  // Leagues
  async getLeagues(
    country?: string,
    season?: number,
  ): Promise<FixtureLeague[]> {
    const params: Record<string, any> = {};
    if (country) params.country = country;
    if (season) params.season = season;

    const response = await this.retryRequest("/leagues", params);

    // Transform the real API response to our interface format
    if (response.response) {
      const transformedLeagues: FixtureLeague[] = response.response.map(
        (item: any) => ({
          id: item.league?.id || null,
          name: item.league?.name || null,
          country: item.country?.name || null,
          logo: item.league?.logo || null,
          flag: item.country?.flag || null,
        }),
      );

      return transformedLeagues;
    }

    return [];
  }

  async getLeagueById(
    leagueId: number,
    season?: number,
  ): Promise<FixtureLeague> {
    const params: Record<string, any> = { id: leagueId };
    if (season) params.season = season;

    const response = await this.retryRequest("/leagues", params);

    return response.response[0] as unknown as FixtureLeague;
  }

  // Fixtures
  async getFixtures(
    teamId?: number,
    leagueId?: number,
    season?: number,
    date?: string,
    status?: string,
    live?: string,
  ): Promise<FootballFixturesResponse> {
    const params: Record<string, any> = {};
    if (teamId) params.team = teamId;
    if (leagueId) params.league = leagueId;
    if (season) params.season = season;
    if (date) params.date = date;
    if (status) params.status = status;
    if (live) params.live = live;

    const response = await this.retryRequest("/fixtures", params);

    return response;
  }

  // Fetch live fixtures and check if there is a new goal event which is not already in the goalData and send a notification if there is for each new goal event in the fixtures
  async fetchLiveFixturesAndCheckForNewGoals() {
    const safeNotifications = SafeNotifications.getInstance();
    if (!safeNotifications.isNotificationAvailable()) {
      console.warn("Notifications not available, skipping goal notifications");
      return;
    }
    const fixtures = await this.getFixtures(
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      "all",
    );

    // Get old goal data array from async storage
    const rawOldGoalData = await AsyncStorage.getItem("goalData");
    const oldGoalData = JSON.parse(rawOldGoalData || "[]") as GoalData[];
    console.log("oldGoalData", oldGoalData);

    fixtures.response.forEach((fixture) => {
      const goalEvents = fixture.events?.filter(
        (event) => event.type === "Goal",
      );
      goalEvents?.forEach(async (event) => {
        if (
          !oldGoalData?.find(
            (goal) =>
              goal.events.some(
                (goalEvent) => goalEvent.time.elapsed === event.time.elapsed,
              ) && goal.fixtureId === fixture.fixture.id,
          )
        ) {
          const goalData = { fixtureId: fixture.fixture.id, events: [event] };
          // console.log("goalData added", goalData);
          oldGoalData.push(goalData);
          await AsyncStorage.setItem("goalData", JSON.stringify(oldGoalData));

          try {
            const notificationId = await safeNotifications.sendGoalNotification(
              fixture.teams.home.name || "Home Team",
              fixture.teams.away.name || "Away Team",
              fixture.goals.home || 0,
              fixture.goals.away || 0,
              `${event.time.elapsed}'`,
              event.player.name || "Unknown Player",
            );

            if (notificationId) {
              console.log(
                "Goal notification sent for fixture:",
                fixture.fixture.id,
                "with ID:",
                notificationId,
              );
            } else {
              console.log(
                "Notification not sent, goal data saved for fixture:",
                fixture.fixture.id,
              );
            }
          } catch (notificationError) {
            console.warn("Failed to send notification:", notificationError);
          }
        }
      });
    });
  }

  async testNotification() {
    const safeNotifications = SafeNotifications.getInstance();

    try {
      const notificationId = await safeNotifications.sendTestNotification();

      if (notificationId) {
        console.log("Test notification sent with ID:", notificationId);
        return true;
      } else {
        console.warn(
          "Test notification not sent - notifications not available",
        );
        return false;
      }
    } catch (error) {
      console.warn("Failed to send test notification:", error);
      return false;
    }
  }

  async getFixtureById(fixtureId: number): Promise<FootballFixturesResponse> {
    return this.retryRequest("/fixtures", { id: fixtureId });
  }

  // Utility methods
  clearCache(): void {
    this.cache.clear();
  }

  getRequestCount(): number {
    return this.requestCount;
  }

  updateConfig(newConfig: Partial<ApiSportsConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.makeRequest("/status", {}, false);
      return (
        response.get === "success" &&
        response.results > 0 &&
        Array.isArray(response.errors) &&
        response.errors.length === 0
      );
    } catch {
      return false;
    }
  }
}

// Factory function for easy instantiation
export function createApiSportsService(
  apiKey?: string,
  config?: Partial<ApiSportsConfig>,
): ApiSportsService {
  // Use environment variable as default if no apiKey provided
  const defaultApiKey = process.env.EXPO_PUBLIC_API_SPORT_KEY!;

  if (!defaultApiKey) {
    throw new Error(
      "API key is required. Please set EXPO_PUBLIC_API_SPORT_KEY in your .env file or pass it as a parameter.",
    );
  }

  // Use environment variables as defaults for configuration
  const defaultConfig: Partial<ApiSportsConfig> = {
    baseUrl:
      process.env.EXPO_PUBLIC_API_SPORTS_BASE_URL ||
      "https://v3.football.api-sports.io",
    timeout: process.env.EXPO_PUBLIC_API_SPORTS_TIMEOUT
      ? parseInt(process.env.EXPO_PUBLIC_API_SPORTS_TIMEOUT)
      : 30000,
    retryAttempts: process.env.EXPO_PUBLIC_API_SPORTS_RETRY_ATTEMPTS
      ? parseInt(process.env.EXPO_PUBLIC_API_SPORTS_RETRY_ATTEMPTS)
      : 3,
    retryDelay: process.env.EXPO_PUBLIC_API_SPORTS_RETRY_DELAY
      ? parseInt(process.env.EXPO_PUBLIC_API_SPORTS_RETRY_DELAY)
      : 1000,
    enableCaching: process.env.EXPO_PUBLIC_API_SPORTS_ENABLE_CACHING === "true",
    cacheExpiry: process.env.EXPO_PUBLIC_API_SPORTS_CACHE_EXPIRY
      ? parseInt(process.env.EXPO_PUBLIC_API_SPORTS_CACHE_EXPIRY)
      : 300000,
  };

  return new ApiSportsService({
    apiKey: defaultApiKey,
    ...defaultConfig,
    ...config,
  });
}

// Export default instance (if you want to use it directly)
export default ApiSportsService;
