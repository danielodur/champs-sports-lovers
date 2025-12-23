import {
  Fixture,
  FootballFixturesResponse,
  FixtureLeague,
} from "../types/football-fixtures-response";
import goalService, { GoalData } from "./api-sports-football-goal-service";
import { SafeNotifications } from "../utils/notificationUtils";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { theSportsDbApiService } from "./theSportsDbApiService";
import { theSportsApiService } from "./theSportsApiService"; // ✅ NEW PRIMARY API

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

// Cache Implementation with Dynamic Expiry
interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

class ApiCache {
  private cache = new Map<string, CacheItem<any>>();
  private readonly defaultExpiry: number;

  constructor(defaultExpiry: number = 10 * 60 * 1000) {
    // ✅ INCREASED: 10 minutes default (was 5)
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

    // ✅ LOG: Cache storage for debugging
    console.log(
      `💾 [Cache] Stored ${key.substring(0, 50)}... (expires in ${Math.round(itemExpiry / 1000)}s)`,
    );
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > item.expiry) {
      this.cache.delete(key);
      console.log(`⏱️ [Cache] Expired: ${key.substring(0, 50)}...`);
      return null;
    }

    console.log(`✅ [Cache] Hit: ${key.substring(0, 50)}...`);
    return item.data;
  }

  clear(): void {
    this.cache.clear();
    console.log(`🗑️ [Cache] Cleared all entries`);
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  // ✅ NEW: Get cache statistics
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()).map((k) => k.substring(0, 50)),
    };
  }
}

// Request Queue for Rate Limiting with Deduplication
interface QueuedRequest {
  executor: () => Promise<any>;
  resolve: (value: any) => void;
  reject: (reason: any) => void;
  key?: string; // ✅ NEW: For deduplication
}

class RequestQueue {
  private queue: QueuedRequest[] = [];
  private processing = false;
  private readonly delayBetweenRequests = 300; // ✅ INCREASED: 300ms between requests (was 200ms)
  private readonly maxConcurrent = 2; // ✅ REDUCED: Max 2 concurrent requests (was 3) to reduce API load
  private activeRequests = 0;
  private pendingRequests = new Map<string, Promise<any>>(); // ✅ NEW: Deduplication

  async add<T>(executor: () => Promise<T>, dedupKey?: string): Promise<T> {
    // ✅ REQUEST DEDUPLICATION: If same request is already pending, return existing promise
    if (dedupKey && this.pendingRequests.has(dedupKey)) {
      console.log(
        `♻️ [RequestQueue] Deduplicating request: ${dedupKey.substring(0, 50)}...`,
      );
      return this.pendingRequests.get(dedupKey)!;
    }

    const promise = new Promise<T>((resolve, reject) => {
      this.queue.push({ executor, resolve, reject, key: dedupKey });
      this.processQueue();
    });

    if (dedupKey) {
      this.pendingRequests.set(dedupKey, promise);
      promise.finally(() => this.pendingRequests.delete(dedupKey));
    }

    return promise;
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.activeRequests >= this.maxConcurrent) {
      return;
    }

    const request = this.queue.shift();
    if (!request) {
      this.processing = false;
      return;
    }

    this.processing = true;
    this.activeRequests++;

    try {
      const result = await request.executor();
      request.resolve(result);
    } catch (error) {
      request.reject(error);
    } finally {
      this.activeRequests--;

      // Delay before next request to avoid rate limits
      if (this.queue.length > 0) {
        await new Promise((resolve) =>
          setTimeout(resolve, this.delayBetweenRequests),
        );
      }

      this.processing = false;
      this.processQueue(); // Process next in queue
    }
  }

  // ✅ NEW: Get queue statistics
  getStats(): {
    queueSize: number;
    activeRequests: number;
    pendingKeys: string[];
  } {
    return {
      queueSize: this.queue.length,
      activeRequests: this.activeRequests,
      pendingKeys: Array.from(this.pendingRequests.keys()).map((k) =>
        k.substring(0, 50),
      ),
    };
  }
}

// ✅ NEW: Circuit Breaker to prevent requests when rate limited
class CircuitBreaker {
  private isOpen = false;
  private openedAt = 0;
  private readonly resetTimeout = 60 * 1000; // 1 minute
  private failureCount = 0;
  private readonly failureThreshold = 3; // Open circuit after 3 rate limit errors

  recordSuccess(): void {
    this.failureCount = 0;
    if (this.isOpen) {
      console.log("✅ [CircuitBreaker] Circuit closed - API working again");
      this.isOpen = false;
    }
  }

  recordRateLimitFailure(): void {
    this.failureCount++;
    console.warn(
      `⚠️ [CircuitBreaker] Rate limit failure ${this.failureCount}/${this.failureThreshold}`,
    );

    if (this.failureCount >= this.failureThreshold && !this.isOpen) {
      this.isOpen = true;
      this.openedAt = Date.now();
      console.error(
        `🚫 [CircuitBreaker] OPENED - Blocking API requests for ${this.resetTimeout / 1000}s`,
      );
    }
  }

  canMakeRequest(): boolean {
    if (!this.isOpen) return true;

    // Check if timeout has elapsed
    if (Date.now() - this.openedAt > this.resetTimeout) {
      console.log(
        "🔄 [CircuitBreaker] Timeout elapsed, attempting to close...",
      );
      this.isOpen = false;
      this.failureCount = 0;
      return true;
    }

    const remainingTime = Math.round(
      (this.resetTimeout - (Date.now() - this.openedAt)) / 1000,
    );
    console.warn(
      `🚫 [CircuitBreaker] BLOCKED - Circuit open, retry in ${remainingTime}s`,
    );
    return false;
  }

  getStatus(): {
    isOpen: boolean;
    failureCount: number;
    remainingTime?: number;
  } {
    return {
      isOpen: this.isOpen,
      failureCount: this.failureCount,
      remainingTime: this.isOpen
        ? Math.round((this.resetTimeout - (Date.now() - this.openedAt)) / 1000)
        : undefined,
    };
  }
}

// Main API Service Class
export class ApiSportsService {
  private config: Required<ApiSportsConfig>;
  private cache: ApiCache;
  private requestCount = 0;
  private lastRequestTime = 0;
  private readonly rateLimitDelay = 1000; // 1 second between requests
  private requestQueue: RequestQueue;
  private circuitBreaker: CircuitBreaker; // ✅ NEW: Circuit breaker

  constructor(config: ApiSportsConfig) {
    this.config = {
      baseUrl: "https://v3.football.api-sports.io",
      timeout: 15000, // Increased to 15 seconds for better reliability
      retryAttempts: 2, // ✅ REDUCED: 2 attempts instead of 3 to reduce API calls
      retryDelay: 2000, // ✅ INCREASED: 2s delay between retries (was 1s)
      enableCaching: true,
      cacheExpiry: 10 * 60 * 1000, // ✅ 10 minutes default cache
      ...config,
    };

    this.cache = new ApiCache(this.config.cacheExpiry);
    this.requestQueue = new RequestQueue();
    this.circuitBreaker = new CircuitBreaker(); // ✅ NEW: Initialize circuit breaker

    // ✅ VALIDATE API KEY
    if (!this.config.apiKey || this.config.apiKey.trim() === "") {
      console.error(
        "❌ [ApiSportsService] CRITICAL: API key is EMPTY or MISSING!",
      );
      console.error(
        "   Please check your .env.local file for EXPO_PUBLIC_API_FOOTBALL_KEY",
      );
      throw new Error("API key is required but was not provided");
    } else {
      // ✅ SECURITY: Never log API keys
      console.log(
        `✅ [ApiSportsService] Initialized with API key from EXPO_PUBLIC_API_FOOTBALL_KEY`,
      );
      console.log(
        `🛡️ [Rate Limit Protection] Queue: Max 2 concurrent, 300ms delay`,
      );
      console.log(
        `🔥 [Circuit Breaker] Enabled: Opens after 3 rate limit errors`,
      );
    }
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

  private async makeRequest<T = FootballFixturesResponse>(
    endpoint: string,
    params?: Record<string, any>,
    useCache: boolean = true,
    sport: string = "football", // ✅ Add sport parameter
    bypassCircuitBreaker: boolean = false, // ✅ NEW: Allow bypassing circuit breaker for fallback APIs
  ): Promise<T> {
    // ✅ CIRCUIT BREAKER: Check if we should make request (only for primary API, not fallbacks)
    if (!bypassCircuitBreaker && !this.circuitBreaker.canMakeRequest()) {
      console.error(
        `🚫 [API BLOCKED] Circuit breaker is OPEN - using fallback/cached data only`,
      );

      // Try to return cached data even if expired
      const cacheKey = this.generateCacheKey(endpoint, params);
      const cachedData = this.cache.get<T>(cacheKey);
      if (cachedData) {
        console.log(
          `💾 [Fallback] Returning cached data despite circuit breaker`,
        );
        return cachedData;
      }

      throw new RateLimitError(
        "Circuit breaker is open - API rate limit exceeded",
      );
    }

    // ✅ REQUEST DEDUPLICATION: Create unique key for this request
    const dedupKey = this.generateCacheKey(endpoint, params);

    // ✅ RATE LIMIT PROTECTION: Queue all requests with deduplication
    return this.requestQueue.add(async () => {
      return this._makeRequestInternal<T>(endpoint, params, useCache, sport, bypassCircuitBreaker);
    }, dedupKey);
  }

  private async _makeRequestInternal<T = FootballFixturesResponse>(
    endpoint: string,
    params?: Record<string, any>,
    useCache: boolean = true,
    sport: string = "football",
    bypassCircuitBreaker: boolean = false,
  ): Promise<T> {
    try {
      // Rate limiting
      // await this.handleRateLimiting();

      // Check cache first
      if (useCache && this.config.enableCaching) {
        const cacheKey = this.generateCacheKey(endpoint, params);
        const cachedData = this.cache.get<T>(cacheKey);
        if (cachedData) {
          return cachedData;
        }
      }

      // ✅ BASKETBALL SUPPORT: Dynamic API endpoint selection
      const baseUrl =
        sport === "basketball"
          ? "https://v1.basketball.api-sports.io"
          : this.config.baseUrl;
      const apiHost =
        sport === "basketball"
          ? "v1.basketball.api-sports.io"
          : "v3.football.api-sports.io";

      console.log(`🏀 Making ${sport} API request to ${baseUrl}${endpoint}`);

      // Build URL with query parameters
      const url = new URL(endpoint, baseUrl);
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            url.searchParams.append(key, String(value));
          }
        });
      }

      // Prepare headers for direct API-Sports.io subscription
      const headers: Record<string, string> = {
        "x-apisports-key": this.config.apiKey, // Direct API-Sports.io subscription only
        "Content-Type": "application/json",
      };

      // Make the request with enhanced timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.warn(
          `⏰ API Request timeout after ${this.config.timeout}ms for ${endpoint}`,
        );
        controller.abort();
      }, this.config.timeout);

      console.log(`🔄 Making API request to ${endpoint}...`);
      const response = await fetch(url.toString(), {
        method: "GET",
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle different response statuses
      if (response.status === 429) {
        const retryAfter = response.headers.get("Retry-After");
        // ✅ RECORD RATE LIMIT FAILURE in circuit breaker ONLY for primary API (not fallbacks)
        if (!bypassCircuitBreaker) {
          this.circuitBreaker.recordRateLimitFailure();
        } else {
          console.log(
            `🔄 [Fallback API] 429 rate limit hit but not recording in circuit breaker (fallback attempt)`,
          );
        }
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

      let data = (await response.json()) as any;

      // ✅ DEBUG: Log API response details
      console.log(`📡 API Response:`, {
        status: response.status,
        resultsCount: data.results || data.response?.length || 0,
        hasErrors: data.errors && Object.keys(data.errors || {}).length > 0,
        errors: data.errors,
        parameters: data.parameters,
      });

      // ✅ CRITICAL FIX: Check for API errors in response body (rate limits, etc.)
      // API-Football returns status 200 but includes errors object when rate limited
      if (data.errors && typeof data.errors === "object") {
        const errorKeys = Object.keys(data.errors);
        if (errorKeys.length > 0) {
          const firstErrorKey = errorKeys[0];
          const errorMessage = data.errors[firstErrorKey];

          // Check if it's a rate limit error
          if (
            typeof errorMessage === "string" &&
            (errorMessage.includes("request limit") ||
              errorMessage.includes("rate limit") ||
              errorMessage.includes("quota"))
          ) {
            console.warn(
              `⚠️ [API-Football] Rate limit exceeded: ${errorMessage}`,
            );
            // ✅ RECORD RATE LIMIT FAILURE in circuit breaker ONLY for primary API (not fallbacks)
            if (!bypassCircuitBreaker) {
              this.circuitBreaker.recordRateLimitFailure();
            } else {
              console.log(
                `🔄 [Fallback API] Rate limit hit but not recording in circuit breaker (fallback attempt)`,
              );
            }
            throw new RateLimitError("API rate limit exceeded");
          }

          // Other API errors
          console.warn(`⚠️ [API-Football] API returned error: ${errorMessage}`);
          throw new ApiSportsError(
            `API error: ${errorMessage}`,
            response.status,
          );
        }
      }

      // ✅ RECORD SUCCESS in circuit breaker ONLY for primary API (not fallbacks)
      if (!bypassCircuitBreaker) {
        this.circuitBreaker.recordSuccess();
      }

      // ✅ BASKETBALL SUPPORT: Transform basketball data to match football structure
      if (
        sport === "basketball" &&
        data.response &&
        Array.isArray(data.response)
      ) {
        console.log(
          `🏀 Transforming ${data.response.length} basketball games to fixture format`,
        );
        data.response = data.response.map((game: any) => {
          // Basketball API returns flat structure, transform to nested fixture structure
          if (game.id && !game.fixture) {
            return {
              fixture: {
                id: game.id,
                date: game.date,
                timestamp: game.timestamp,
                timezone: game.timezone,
                venue: game.venue ? { name: game.venue } : null,
                status: {
                  short: game.status?.short || "NS",
                  long: game.status?.long || "Not Started",
                  elapsed: game.status?.timer || null,
                },
              },
              league: {
                id: game.league?.id,
                name: game.league?.name || "Unknown League",
                country: game.country?.name || game.league?.country,
                logo: game.league?.logo || null,
                flag: game.country?.flag || null,
                season: game.league?.season,
                type: game.league?.type,
              },
              teams: {
                home: {
                  id: game.teams?.home?.id,
                  name: game.teams?.home?.name || "Home Team",
                  logo: game.teams?.home?.logo || null,
                },
                away: {
                  id: game.teams?.away?.id,
                  name: game.teams?.away?.name || "Away Team",
                  logo: game.teams?.away?.logo || null,
                },
              },
              goals: {
                home: game.scores?.home?.total || null,
                away: game.scores?.away?.total || null,
              },
              score: {
                halftime: {
                  home: game.scores?.home?.quarter_1 || null,
                  away: game.scores?.away?.quarter_1 || null,
                },
                fulltime: {
                  home: game.scores?.home?.total || null,
                  away: game.scores?.away?.total || null,
                },
              },
              // ✅ Preserve original basketball scores for quarter-by-quarter display
              scores: game.scores,
            };
          }
          // Already in correct format
          return game;
        });
        console.log(`✅ Basketball transformation complete`);
      }

      // ✅ SMART CACHING: Cache based on match status
      if (useCache && this.config.enableCaching) {
        const cacheKey = this.generateCacheKey(endpoint, params);

        // ✅ DYNAMIC CACHE EXPIRY: Longer for finished matches, shorter for live
        let cacheExpiry = this.config.cacheExpiry; // Default 10 minutes

        // Check if this is a finished match (longer cache)
        if (
          data.response &&
          Array.isArray(data.response) &&
          data.response.length > 0
        ) {
          const firstItem = data.response[0];
          const status =
            firstItem?.fixture?.status?.short || firstItem?.status?.short;

          if (
            status === "FT" ||
            status === "AET" ||
            status === "PEN" ||
            status === "AWD" ||
            status === "AOT"
          ) {
            cacheExpiry = 60 * 60 * 1000; // ✅ 60 minutes for finished matches
            console.log(
              `💾 [Cache] Storing finished match data (60min expiry)`,
            );
          } else if (status === "NS" || status === "TBD" || status === "PST") {
            cacheExpiry = 30 * 60 * 1000; // ✅ 30 minutes for upcoming matches
            console.log(
              `💾 [Cache] Storing upcoming match data (30min expiry)`,
            );
          } else {
            cacheExpiry = 3 * 60 * 1000; // ✅ 3 minutes for live matches
            console.log(`💾 [Cache] Storing live match data (3min expiry)`);
          }
        }

        this.cache.set(cacheKey, data, cacheExpiry);
      }

      return data as T;
    } catch (error: unknown) {
      if (error instanceof ApiSportsError) {
        throw error;
      }

      if (error instanceof Error && error.name === "AbortError") {
        throw new ApiSportsError(
          "Request timeout - please check your connection and try again",
          408,
        );
      }

      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new ApiSportsError(`Request failed: ${errorMessage}`);
    }
  }

  private async retryRequest<T = FootballFixturesResponse>(
    endpoint: string,
    params?: Record<string, any>,
    attempt: number = 1,
    sport: string = "football", // ✅ Add sport parameter
    bypassCircuitBreaker: boolean = false, // ✅ NEW: Allow bypassing circuit breaker for fallback APIs
  ): Promise<T> {
    try {
      return await this.makeRequest<T>(endpoint, params, true, sport, bypassCircuitBreaker); // ✅ Pass sport and bypass flag
    } catch (error) {
      // ✅ CRITICAL: Check for rate limit errors FIRST - don't retry at all
      if (error instanceof RateLimitError) {
        console.warn(
          `🚫 Rate limit hit on attempt ${attempt}. Skipping all retries to avoid wasting API calls. Triggering fallback immediately...`,
        );
        throw error; // Immediately throw to trigger fallback - NO RETRIES
      }

      // Handle authentication errors (rate limits) gracefully
      if (error instanceof AuthenticationError) {
        console.warn(
          `⚠️ API authentication issue for ${endpoint} (likely rate limit). Using cached/fallback data.`,
        );
        // Return empty response structure instead of throwing
        return { response: [], results: 0 } as T;
      }

      // Check if we've exhausted retry attempts
      if (attempt >= this.config.retryAttempts) {
        // Log detailed error information
        const errorDetails =
          error instanceof ApiSportsError
            ? `Status: ${error.statusCode}, Message: ${error.message}`
            : error instanceof Error
              ? error.message
              : String(error);

        console.error(
          `❌ Final attempt failed for ${endpoint} after ${attempt} attempts`,
        );
        console.error(`   Error details: ${errorDetails}`);
        console.error(`   This will trigger fallback mechanisms if available`);

        throw error;
      }

      // Enhanced retry logic with exponential backoff
      const isTimeoutError =
        error instanceof ApiSportsError &&
        (error.statusCode === 408 || error.message.includes("timeout"));

      if (isTimeoutError) {
        const backoffDelay = Math.min(
          this.config.retryDelay * Math.pow(2, attempt - 1),
          10000,
        );
        console.warn(
          `⏰ Request timeout on attempt ${attempt}. Retrying in ${backoffDelay}ms...`,
        );
        await this.delay(backoffDelay);
        return this.retryRequest(endpoint, params, attempt + 1, sport, bypassCircuitBreaker); // ✅ Pass sport and bypass flag
      }

      // For non-timeout errors, use standard retry delay
      console.warn(
        `⚠️ Request failed on attempt ${attempt}. Retrying in ${this.config.retryDelay * attempt}ms...`,
      );
      await this.delay(this.config.retryDelay * attempt);
      return this.retryRequest(endpoint, params, attempt + 1, sport, bypassCircuitBreaker); // ✅ Pass sport and bypass flag
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
    sport: string = "football",
    bypassCircuitBreaker: boolean = false, // ✅ NEW: Allow bypassing circuit breaker for fallback APIs
  ): Promise<FixtureLeague[]> {
    const params: Record<string, any> = {};
    if (country) params.country = country;
    if (season) params.season = season;

    // For basketball, we would use a different endpoint or API
    // For now, we'll keep football implementation and add sport to cache key
    // ✅ CRITICAL: Use makeRequest instead of retryRequest to support bypassCircuitBreaker
    const response = await this.makeRequest<{ response: any[] }>(
      "leagues",
      params,
      true, // useCache
      sport, // sport parameter
      bypassCircuitBreaker, // ✅ Pass bypassCircuitBreaker flag
    );

    // Transform the real API response to our interface format
    if (response && response.response && Array.isArray(response.response)) {
      const transformedLeagues: FixtureLeague[] = response.response.map(
        (item: any) => ({
          id: item.league?.id || null,
          name: item.league?.name || null,
          country: item.country?.name || null,
          logo: item.league?.logo || null,
          flag: item.country?.flag || null,
          sport: sport, // Add sport identifier
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
    sport?: string, // ✅ Add sport parameter for basketball/football switching
  ): Promise<FootballFixturesResponse> {
    const actualSport = sport || "football";

    // ✅ CRITICAL FIX: Skip TheSports API if it's disabled (null)
    if (!theSportsApiService) {
      console.log(
        `⚠️ [TheSports API] SKIPPED - API is disabled, using backend fallback`,
      );
      
      // Jump directly to API-Football/Backend fallback
      try {
        const params: Record<string, any> = {};
        if (teamId) params.team = teamId;
        if (leagueId) params.league = leagueId;
        if (season) params.season = season;
        if (date) params.date = date;
        if (status) params.status = status;
        if (live) params.live = live;
        params.timezone = "UTC";

        const endpoint = actualSport === "basketball" ? "/games" : "/fixtures";

        console.log(
          `🔄 [Backend API] Fetching ${actualSport} data from ${endpoint}...`,
        );

        const response = await this.retryRequest(
          endpoint,
          params,
          1,
          actualSport,
          true, // ✅ BYPASS circuit breaker for backend fallback
        );

        console.log(
          `✅ [Backend API] Success! ${response.response?.length || 0} matches`,
        );
        return response;
      } catch (error: any) {
        console.error(`❌ [Backend API] All APIs failed: ${error.message}`);
        return {
          get: "fixtures",
          parameters: {
            live: live ?? "all",
            date: date ?? null,
          },
          errors: [error.message],
          results: 0,
          paging: { current: 1, total: 1 },
          response: [],
        };
      }
    }

    // ✅✅✅ PRIMARY: TheSports API (Rich Data for Football & Basketball)
    // ✅ SKIP if circuit breaker is open (rate limits hit)
    let primaryError: any = null;
    
    if (!this.circuitBreaker.canMakeRequest()) {
      console.warn(
        `🚫 [TheSports PRIMARY] Circuit breaker is OPEN - skipping primary API, going directly to fallback`,
      );
      // Jump directly to fallback without trying primary API
      primaryError = new Error("Circuit breaker is open - rate limit exceeded");
    } else {
      try {
        console.log(
          `🎯 [TheSports PRIMARY] Fetching ${actualSport} data...`,
        );

        const response = await theSportsApiService.getFixtures(
          teamId?.toString(),
          leagueId?.toString(),
          season?.toString(),
          date,
          status,
          live,
          actualSport,
        );

        console.log(
          `✅ [TheSports PRIMARY] Success! ${response.response?.length || 0} matches`,
        );
        return response;
      } catch (error: any) {
        primaryError = error;
        console.warn(
          `⚠️ [TheSports PRIMARY] Failed: ${primaryError.message}`,
        );
        // Continue to fallback logic below
      }
    }

    // ✅ FALLBACK LOGIC: Try API-Football and TheSportsDB
    if (!primaryError) {
      primaryError = new Error("Primary API failed");
    }
    
    // ✅ FIRST FALLBACK: API-Football (for both sports) - Bypass circuit breaker
      try {
        const params: Record<string, any> = {};
        if (teamId) params.team = teamId;
        if (leagueId) params.league = leagueId;
        if (season) params.season = season;
        if (date) params.date = date;
        if (status) params.status = status;
        if (live) params.live = live;
        params.timezone = "UTC";

        const endpoint = actualSport === "basketball" ? "/games" : "/fixtures";

        console.log(
          `🔄 [API-Football FALLBACK] Attempting ${actualSport} data from ${endpoint}... (bypassing circuit breaker)`,
        );

        const response = await this.retryRequest(
          endpoint,
          params,
          1,
          actualSport,
          true, // ✅ BYPASS circuit breaker for fallback API
        );

        console.log(
          `✅ [API-Football FALLBACK] Success! ${response.response?.length || 0} matches`,
        );
        return response;
      } catch (fallbackError: any) {
        console.warn(
          `⚠️ [API-Football FALLBACK] Failed: ${fallbackError.message}`,
        );

        // ✅ SECOND FALLBACK: TheSportsDB (ONLY for FOOTBALL)
        if (actualSport === "basketball") {
          console.warn(
            `⚠️ [Basketball] No more fallbacks available - returning empty results`,
          );
          return {
            get: "fixtures",
            parameters: {
              live: live ?? "all",
              date: date ?? null,
            },
            errors: [primaryError.message, fallbackError.message],
            results: 0,
            paging: { current: 1, total: 1 },
            response: [],
          };
        }

        console.log(
          `🔄 [TheSportsDB FALLBACK] Final attempt for FOOTBALL...`,
        );

        try {
          const fallbackResponse = await theSportsDbApiService.getFixtures(
            teamId ? teamId.toString() : undefined,
            leagueId ? leagueId.toString() : undefined,
            season ? season.toString() : undefined,
            date,
            status,
            live,
            "football",
          );

          console.log(
            `✅ [TheSportsDB FALLBACK] Success! ${fallbackResponse.response?.length || 0} matches`,
          );
          return fallbackResponse;
        } catch (finalError: any) {
          console.error(
            `❌ [TheSportsDB FALLBACK] All APIs failed: ${finalError.message}`,
          );
          return {
            get: "fixtures",
            parameters: {
              live: live ?? "all",
              date: date ?? null,
            },
            errors: [
              primaryError.message,
              fallbackError.message,
              finalError.message,
            ],
            results: 0,
            paging: { current: 1, total: 1 },
            response: [],
          };
        }
      }
  }

  async getFixtureOdds(fixtureId: number, bookmakerId?: number): Promise<any> {
    const params: Record<string, any> = { fixture: fixtureId };
    if (bookmakerId) params.bookmaker = bookmakerId;
    return this.retryRequest<any>("/odds", params);
  }

  async getTransfers(
    options: {
      playerId?: number;
      teamId?: number;
      leagueId?: number;
      season?: number;
      date?: string;
      forceRefresh?: boolean;
    } = {},
  ): Promise<any> {
    const params: Record<string, any> = {};
    if (options.playerId) params.player = options.playerId;
    if (options.teamId) params.team = options.teamId;
    if (options.leagueId) params.league = options.leagueId;
    if (options.season) params.season = options.season;
    if (options.date) params.date = options.date;

    // Note: API-Football transfers endpoint doesn't support timezone parameter
    // Removing timezone to avoid API errors

    // For transfers, bypass cache to ensure fresh data (transfers change frequently)
    return this.makeRequest<any>("/transfers", params, false); // useCache = false
  }

  async getTrophies(
    options: {
      playerId?: number;
      teamId?: number;
      coachId?: number;
    } = {},
  ): Promise<any> {
    const params: Record<string, any> = {};
    if (options.playerId) params.player = options.playerId;
    if (options.teamId) params.team = options.teamId;
    if (options.coachId) params.coach = options.coachId;

    // API-Football trophies endpoint
    return this.makeRequest<any>("/trophies", params, true); // useCache = true (trophies don't change often)
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

  // Standings
  async getStandings(leagueId: number, season?: number): Promise<any> {
    const params: Record<string, any> = { league: leagueId };
    if (season) params.season = season;

    const response = await this.retryRequest("/standings", params);
    return response;
  }

  // Match Details - Statistics
  async getMatchStatistics(
    fixtureId: number,
    sport: string = "football",
  ): Promise<any> {
    try {
      console.log(
        `📊 [API-Football PRIMARY] Fetching statistics for fixture ${fixtureId}`,
      );
      const response = await this.retryRequest("/fixtures/statistics", {
        fixture: fixtureId,
      });

      // ✅ CORNER DEBUG: Log the full statistics response structure
      console.log(
        `📊 CORNER DEBUG: Statistics API response for fixture ${fixtureId}:`,
        {
          hasResponse: !!response?.response,
          responseLength: response?.response?.length,
          responseType: Array.isArray(response?.response)
            ? "array"
            : typeof response?.response,
          hasErrors: !!response?.errors,
          errors: response?.errors,
        },
      );

      if (response?.response && Array.isArray(response.response)) {
        console.log(`📊 CORNER DEBUG: Statistics response structure:`, {
          firstElementType: typeof response.response[0],
          firstElementKeys: response.response[0]
            ? Object.keys(response.response[0])
            : "none",
          hasStatistics: (response.response[0] as any)?.statistics
            ? true
            : false,
          statisticsLength:
            (response.response[0] as any)?.statistics?.length || 0,
        });

        // Log sample statistics if available
        if (
          (response.response[0] as any)?.statistics &&
          Array.isArray((response.response[0] as any).statistics)
        ) {
          const statTypes = (response.response[0] as any).statistics
            .map((s: any) => (s as any).type)
            .slice(0, 10);
          console.log(
            `📊 CORNER DEBUG: Sample stat types: ${statTypes.join(", ")}`,
          );
        }
      }

      return response;
    } catch (error: any) {
      console.warn(
        `⚠️ [API-Football] getMatchStatistics failed: ${error.message}`,
      );
      console.log(`🔄 [TheSportsDB FALLBACK] Attempting TheSportsDB...`);

      try {
        const fallbackResponse = await theSportsDbApiService.getMatchStatistics(
          fixtureId,
          sport,
        );
        console.log(
          `✅ [TheSportsDB FALLBACK] Success for statistics ${fixtureId}`,
        );
        return fallbackResponse;
      } catch (fallbackError: any) {
        console.error(
          `❌ [TheSportsDB FALLBACK] Also failed: ${fallbackError.message}`,
        );
        throw error; // Throw original error
      }
    }
  }

  // Match Details - Lineups
  async getMatchLineups(
    fixtureId: number,
    sport: string = "football",
  ): Promise<any> {
    try {
      console.log(
        `⚽ [API-Football PRIMARY] Fetching lineups for fixture ${fixtureId}`,
      );
      const response = await this.retryRequest("/fixtures/lineups", {
        fixture: fixtureId,
      });
      return response;
    } catch (error: any) {
      console.warn(
        `⚠️ [API-Football] getMatchLineups failed: ${error.message}`,
      );
      console.log(`🔄 [TheSportsDB FALLBACK] Attempting TheSportsDB...`);

      try {
        const fallbackResponse = await theSportsDbApiService.getMatchLineups(
          fixtureId,
          sport,
        );
        console.log(
          `✅ [TheSportsDB FALLBACK] Success for lineups ${fixtureId}`,
        );
        return fallbackResponse;
      } catch (fallbackError: any) {
        console.error(
          `❌ [TheSportsDB FALLBACK] Also failed: ${fallbackError.message}`,
        );
        throw error; // Throw original error
      }
    }
  }

  // Match Details - Events (goals, cards, substitutions)
  async getMatchEvents(
    fixtureId: number,
    sport: string = "football",
  ): Promise<any> {
    try {
      console.log(
        `🎯 [API-Football PRIMARY] Fetching events for ${sport} fixture ${fixtureId}`,
      );

      // ✅ BASKETBALL SUPPORT: Use correct endpoint based on sport
      const endpoint =
        sport === "basketball" ? "/games/events" : "/fixtures/events";
      const paramKey = sport === "basketball" ? "game" : "fixture";

      const response = await this.retryRequest(
        endpoint,
        { [paramKey]: fixtureId },
        1,
        sport,
      );
      return response;
    } catch (error: any) {
      console.warn(`⚠️ [API-Football] getMatchEvents failed: ${error.message}`);
      console.log(`🔄 [TheSportsDB FALLBACK] Attempting TheSportsDB...`);

      try {
        const fallbackResponse = await theSportsDbApiService.getMatchEvents(
          fixtureId,
          sport,
        );
        console.log(
          `✅ [TheSportsDB FALLBACK] Success for events ${fixtureId}`,
        );
        return fallbackResponse;
      } catch (fallbackError: any) {
        console.error(
          `❌ [TheSportsDB FALLBACK] Also failed: ${fallbackError.message}`,
        );
        throw error; // Throw original error
      }
    }
  }

  // Match Details - Head to Head
  async getHeadToHead(team1Id: number, team2Id: number): Promise<any> {
    try {
      console.log(`🔄 Fetching H2H for teams ${team1Id} vs ${team2Id}`);
      const response = await this.retryRequest("/fixtures/headtohead", {
        h2h: `${team1Id}-${team2Id}`,
      });
      return response;
    } catch (error) {
      console.error(`Error fetching H2H for ${team1Id}-${team2Id}:`, error);
      throw error;
    }
  }

  // Match Details - Player Statistics
  async getMatchPlayerStats(
    fixtureId: number,
    sport: string = "football",
  ): Promise<any> {
    try {
      console.log(
        `👤 [API-Football PRIMARY] Fetching player stats for fixture ${fixtureId}`,
      );
      const response = await this.retryRequest("/fixtures/players", {
        fixture: fixtureId,
      });
      return response;
    } catch (error: any) {
      console.warn(
        `⚠️ [API-Football] getMatchPlayerStats failed: ${error.message}`,
      );
      console.log(`🔄 [TheSportsDB FALLBACK] Attempting TheSportsDB...`);

      try {
        const fallbackResponse =
          await theSportsDbApiService.getMatchPlayerStats(fixtureId);
        console.log(
          `✅ [TheSportsDB FALLBACK] Success for player stats ${fixtureId}`,
        );
        return fallbackResponse;
      } catch (fallbackError: any) {
        console.error(
          `❌ [TheSportsDB FALLBACK] Also failed: ${fallbackError.message}`,
        );
        throw error; // Throw original error
      }
    }
  }

  // Get specific fixture details by ID
  async getFixtureById(
    fixtureId: number,
    sport: string = "football",
  ): Promise<any> {
    try {
      console.log(
        `🔍 [API-Football PRIMARY] Fetching fixture details for ${fixtureId} (${sport})`,
      );
      const response = await this.retryRequest(
        "/fixtures",
        {
          id: fixtureId,
        },
        1,
        sport,
      ); // ✅ Pass sport parameter
      return response;
    } catch (error: any) {
      console.warn(`⚠️ [API-Football] getFixtureById failed: ${error.message}`);
      console.log(`🔄 [TheSportsDB FALLBACK] Attempting TheSportsDB...`);

      try {
        const fallbackResponse = await theSportsDbApiService.getFixtureById(
          fixtureId,
          sport,
        );
        console.log(
          `✅ [TheSportsDB FALLBACK] Success for fixture ${fixtureId}`,
        );
        return fallbackResponse;
      } catch (fallbackError: any) {
        console.error(
          `❌ [TheSportsDB FALLBACK] Also failed: ${fallbackError.message}`,
        );
        throw error; // Throw original error
      }
    }
  }

  // ✅ BATCH FETCHING: Get multiple fixtures in one API call (RATE LIMIT OPTIMIZATION)
  async getFixturesByIds(
    fixtureIds: number[],
    sport: string = "football",
  ): Promise<any> {
    if (fixtureIds.length === 0) {
      return { response: [] };
    }

    try {
      console.log(
        `📦 [BATCH API] Fetching ${fixtureIds.length} fixtures in one request (${sport})`,
      );

      // API-Football supports comma-separated IDs: ?ids=123,456,789
      const response = await this.retryRequest(
        "/fixtures",
        {
          ids: fixtureIds.join(","),
        },
        1,
        sport,
      );

      console.log(
        `✅ [BATCH API] Successfully fetched ${response?.response?.length || 0} fixtures`,
      );
      return response;
    } catch (error: any) {
      console.warn(`⚠️ [BATCH API] Failed: ${error.message}`);

      // Fallback: Fetch individually (preserves original logic)
      console.log(`🔄 [BATCH API] Falling back to individual requests...`);
      const results = [];
      for (const id of fixtureIds) {
        try {
          const result = await this.getFixtureById(id, sport);
          if (result?.response?.[0]) {
            results.push(result.response[0]);
          }
        } catch (err) {
          console.warn(`⚠️ Failed to fetch fixture ${id}:`, err);
        }
      }

      return { response: results };
    }
  }

  // ✅ BATCH STATISTICS: Get statistics for multiple fixtures (RATE LIMIT OPTIMIZATION)
  async getBatchMatchStatistics(
    fixtureIds: number[],
    sport: string = "football",
  ): Promise<Map<number, any>> {
    const results = new Map<number, any>();

    if (fixtureIds.length === 0) {
      return results;
    }

    console.log(
      `📊 [BATCH STATS] Fetching statistics for ${fixtureIds.length} fixtures...`,
    );

    // Process in small batches to avoid overwhelming the API
    const batchSize = 5;
    for (let i = 0; i < fixtureIds.length; i += batchSize) {
      const batch = fixtureIds.slice(i, i + batchSize);

      // Fetch batch with controlled concurrency (handled by RequestQueue)
      const batchPromises = batch.map(async (fixtureId) => {
        try {
          const stats = await this.getMatchStatistics(fixtureId, sport);
          return { fixtureId, stats };
        } catch (error) {
          console.warn(`⚠️ Stats failed for fixture ${fixtureId}`);
          return { fixtureId, stats: null };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      batchResults.forEach(({ fixtureId, stats }) => {
        if (stats) {
          results.set(fixtureId, stats);
        }
      });
    }

    console.log(
      `✅ [BATCH STATS] Fetched statistics for ${results.size}/${fixtureIds.length} fixtures`,
    );
    return results;
  }

  // Team Information
  async getTeamInfo(teamId: number): Promise<any> {
    try {
      console.log(`🏆 Fetching team info for ${teamId}`);
      const response = await this.retryRequest("/teams", {
        id: teamId,
      });
      return response;
    } catch (error) {
      console.error(`Error fetching team info for ${teamId}:`, error);
      throw error;
    }
  }

  // Team Statistics for a season
  async getTeamStatistics(
    teamId: number,
    leagueId: number,
    season: number,
  ): Promise<any> {
    try {
      console.log(
        `📈 Fetching team statistics for team ${teamId}, league ${leagueId}, season ${season}`,
      );
      const response = await this.retryRequest("/teams/statistics", {
        team: teamId,
        league: leagueId,
        season: season,
      });
      return response;
    } catch (error) {
      console.error(`Error fetching team statistics:`, error);
      throw error;
    }
  }

  // Get live commentary/events for a match
  async getLiveCommentary(fixtureId: number): Promise<any> {
    try {
      // API-Football doesn't have a specific commentary endpoint,
      // but we can get detailed events which include commentary-like information
      const events = await this.getMatchEvents(fixtureId);
      const fixture = await this.getFixtureById(fixtureId);

      return {
        fixture: fixture?.response?.[0] || null,
        events: events?.response || [],
        live:
          fixture?.response?.[0]?.fixture?.status?.short === "1H" ||
          fixture?.response?.[0]?.fixture?.status?.short === "2H" ||
          fixture?.response?.[0]?.fixture?.status?.short === "HT",
      };
    } catch (error) {
      console.error(`Error fetching live commentary for ${fixtureId}:`, error);
      throw error;
    }
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

  // ✅ NEW: Get API service statistics for debugging
  getApiStats(): {
    cache: { size: number; keys: string[] };
    queue: { queueSize: number; activeRequests: number; pendingKeys: string[] };
    circuitBreaker: {
      isOpen: boolean;
      failureCount: number;
      remainingTime?: number;
    };
  } {
    return {
      cache: this.cache.getStats(),
      queue: this.requestQueue.getStats(),
      circuitBreaker: this.circuitBreaker.getStatus(),
    };
  }

  // ✅ NEW: Log API statistics for debugging
  logApiStats(): void {
    const stats = this.getApiStats();
    console.log("📊 [API Stats] ===================================");
    console.log(`   Cache: ${stats.cache.size} items`);
    console.log(
      `   Queue: ${stats.queue.queueSize} pending, ${stats.queue.activeRequests} active`,
    );
    console.log(
      `   Circuit Breaker: ${stats.circuitBreaker.isOpen ? "🚫 OPEN" : "✅ CLOSED"} (${stats.circuitBreaker.failureCount} failures)`,
    );
    if (stats.circuitBreaker.remainingTime) {
      console.log(`   ⏰ Retry in: ${stats.circuitBreaker.remainingTime}s`);
    }
    console.log("================================================");
  }
}

// Factory function for easy instantiation
export function createApiSportsService(
  apiKey?: string,
  config?: Partial<ApiSportsConfig>,
): ApiSportsService {
  // Use provided apiKey first, if available
  if (apiKey) {
    console.log("🔑 Using provided API key");
    return new ApiSportsService({
      apiKey,
      ...config,
    });
  }

  // For development builds with expo-dev-client, try multiple sources
  let defaultApiKey: string | undefined;

  console.log("🔍 Searching for API key in development build...");

  // Method 1: Try EXPO_PUBLIC_ prefixed variable (recommended for dev builds)
  if (process.env.EXPO_PUBLIC_API_FOOTBALL_KEY) {
    defaultApiKey = process.env.EXPO_PUBLIC_API_FOOTBALL_KEY;
    console.log("✅ Found API key via EXPO_PUBLIC_API_FOOTBALL_KEY");
  }

  // Method 2: Try through Constants.expoConfig.extra resolution
  if (!defaultApiKey) {
    try {
      const extraConfig = Constants.expoConfig?.extra;
      if (extraConfig?.apiFootballKey) {
        const keyRef = extraConfig.apiFootballKey;
        console.log("🔗 App.json references:", keyRef);

        if (typeof keyRef === "string") {
          // If it's an env var reference, resolve it
          if (keyRef.startsWith("EXPO_")) {
            const resolvedKey = process.env[keyRef];
            if (resolvedKey) {
              defaultApiKey = resolvedKey;
              console.log(`✅ Resolved API key via ${keyRef}`);
            } else {
              console.log(`❌ Environment variable ${keyRef} not found`);
            }
          } else {
            // Treat as direct value (not recommended but supported)
            defaultApiKey = keyRef;
            console.log("✅ Using direct value from app.json");
          }
        }
      }
    } catch (error) {
      console.warn("⚠️ Could not access Constants.expoConfig.extra:", error);
    }
  }

  // Method 3: Legacy fallback
  if (!defaultApiKey && process.env.EXPO_API_FOOTBALL_KEY) {
    defaultApiKey = process.env.EXPO_API_FOOTBALL_KEY;
    console.log("✅ Found API key via legacy EXPO_API_FOOTBALL_KEY");
  }

  // Debug information for troubleshooting
  if (!defaultApiKey) {
    console.error("❌ API Football Key Resolution Failed!");
    console.error("🔍 Debug Information:");

    const allEnvKeys = Object.keys(process.env);
    const expoKeys = allEnvKeys.filter((k) => k.startsWith("EXPO_"));
    const footballKeys = allEnvKeys.filter((k) => k.includes("FOOTBALL"));

    console.error("- All EXPO_ env vars:", expoKeys);
    console.error("- Football-related env vars:", footballKeys);
    console.error("- Constants.expoConfig.extra:", Constants.expoConfig?.extra);
    console.error("- __DEV__ mode:", __DEV__);

    throw new Error(
      "API key not found! For development builds:\n" +
        "1. Ensure your .env.local contains: EXPO_PUBLIC_API_FOOTBALL_KEY=your_key_here\n" +
        "2. Restart with: npx expo start --dev-client --clear\n" +
        "3. If using iOS simulator: npx expo run:ios\n" +
        "4. Check console logs above for available environment variables",
    );
  }

  console.log("✅ API key successfully resolved, creating service...");

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
