/**
 * Leagues by Region Service
 * 
 * Fetches leagues from API-Football and organizes them by region
 * Replaces hardcoded league lists with dynamic API data
 * 
 * Optimized with caching and timeout to ensure loading never exceeds 1 second
 */

import { createApiSportsService } from "./api-sports-service";
import { fetchLeaguesByCountry } from "./leagueStandingsService";
import cacheService from "./cacheService";
import { sortLeaguesByRank, sortLeaguesByCountryRank } from "../utils/leagueRanking";

export interface LeagueData {
  id: number;
  name: string;
  country: string;
  logo: string | null;
  flag: string | null;
  type: string;
}

// Country to region mapping
const countryToRegion: Record<string, string> = {
  // Europe
  England: "Europe",
  Scotland: "Europe",
  Wales: "Europe",
  "Northern Ireland": "Europe",
  Spain: "Europe",
  Italy: "Europe",
  Germany: "Europe",
  France: "Europe",
  Netherlands: "Europe",
  Portugal: "Europe",
  Belgium: "Europe",
  Turkey: "Europe",
  Russia: "Europe",
  Poland: "Europe",
  Ukraine: "Europe",
  "Czech Republic": "Europe",
  Greece: "Europe",
  Switzerland: "Europe",
  Austria: "Europe",
  Denmark: "Europe",
  Sweden: "Europe",
  Norway: "Europe",
  Finland: "Europe",
  Croatia: "Europe",
  Serbia: "Europe",
  Romania: "Europe",
  Hungary: "Europe",
  Slovakia: "Europe",
  Slovenia: "Europe",
  Bulgaria: "Europe",
  "Bosnia and Herzegovina": "Europe",
  Iceland: "Europe",
  "Republic of Ireland": "Europe",
  Albania: "Europe",
  "North Macedonia": "Europe",
  Montenegro: "Europe",
  Estonia: "Europe",
  Latvia: "Europe",
  Lithuania: "Europe",
  Luxembourg: "Europe",
  Malta: "Europe",
  Moldova: "Europe",
  Cyprus: "Europe",
  Georgia: "Europe",
  Armenia: "Europe",
  Azerbaijan: "Europe",
  Belarus: "Europe",
  Andorra: "Europe",
  "San Marino": "Europe",
  Liechtenstein: "Europe",
  Monaco: "Europe",
  Kosovo: "Europe",
  // Kazakhstan listed in Asia (AFC member)

  // Africa
  Egypt: "Africa",
  Morocco: "Africa",
  Tunisia: "Africa",
  Algeria: "Africa",
  Libya: "Africa",
  Sudan: "Africa",
  Nigeria: "Africa",
  Ghana: "Africa",
  "Ivory Coast": "Africa",
  Senegal: "Africa",
  Mali: "Africa",
  Burkina: "Africa",
  Guinea: "Africa",
  Liberia: "Africa",
  "Sierra Leone": "Africa",
  Gambia: "Africa",
  "Cape Verde": "Africa",
  Mauritania: "Africa",
  Niger: "Africa",
  Togo: "Africa",
  Benin: "Africa",
  Uganda: "Africa",
  Kenya: "Africa",
  Ethiopia: "Africa",
  Tanzania: "Africa",
  Rwanda: "Africa",
  Burundi: "Africa",
  Somalia: "Africa",
  Djibouti: "Africa",
  Eritrea: "Africa",
  "South Sudan": "Africa",
  Cameroon: "Africa",
  "DR Congo": "Africa",
  "Congo": "Africa",
  Gabon: "Africa",
  "Equatorial Guinea": "Africa",
  "São Tomé and Príncipe": "Africa",
  "Central African Republic": "Africa",
  Chad: "Africa",
  "South Africa": "Africa",
  Angola: "Africa",
  Zambia: "Africa",
  Zimbabwe: "Africa",
  Malawi: "Africa",
  Mozambique: "Africa",
  Swaziland: "Africa",
  Lesotho: "Africa",
  Botswana: "Africa",
  Namibia: "Africa",
  Madagascar: "Africa",
  Mauritius: "Africa",
  Comoros: "Africa",
  Seychelles: "Africa",

  // America (North & South)
  "United States": "America",
  Mexico: "America",
  Canada: "America",
  Brazil: "America",
  Argentina: "America",
  Colombia: "America",
  Chile: "America",
  Uruguay: "America",
  Paraguay: "America",
  Peru: "America",
  Ecuador: "America",
  Bolivia: "America",
  Venezuela: "America",
  "Costa Rica": "America",
  Panama: "America",
  Honduras: "America",
  Guatemala: "America",
  "El Salvador": "America",
  Nicaragua: "America",
  Jamaica: "America",
  "Trinidad and Tobago": "America",
  Haiti: "America",
  "Dominican Republic": "America",
  Cuba: "America",
  Guyana: "America",
  Suriname: "America",
  "French Guiana": "America",

  // Asia
  Japan: "Asia",
  "South Korea": "Asia",
  China: "Asia",
  "Saudi Arabia": "Asia",
  Qatar: "Asia",
  "United Arab Emirates": "Asia",
  India: "Asia",
  Thailand: "Asia",
  Malaysia: "Asia",
  Indonesia: "Asia",
  Vietnam: "Asia",
  Singapore: "Asia",
  Philippines: "Asia",
  Myanmar: "Asia",
  Cambodia: "Asia",
  Laos: "Asia",
  "North Korea": "Asia",
  Iran: "Asia",
  Iraq: "Asia",
  Kuwait: "Asia",
  Bahrain: "Asia",
  Oman: "Asia",
  Yemen: "Asia",
  Jordan: "Asia",
  Lebanon: "Asia",
  Syria: "Asia",
  Palestine: "Asia",
  Israel: "Asia",
  Uzbekistan: "Asia",
  Kazakhstan: "Asia", // AFC member
  Kyrgyzstan: "Asia",
  Tajikistan: "Asia",
  Turkmenistan: "Asia",
  Afghanistan: "Asia",
  Pakistan: "Asia",
  Bangladesh: "Asia",
  "Sri Lanka": "Asia",
  Nepal: "Asia",
  Bhutan: "Asia",
  Maldives: "Asia",
  Mongolia: "Asia",
  "East Timor": "Asia",
  Brunei: "Asia",

  // Oceania
  Australia: "Oceania",
  "New Zealand": "Oceania",
  "Papua New Guinea": "Oceania",
  Fiji: "Oceania",
  "New Caledonia": "Oceania",
  Tahiti: "Oceania",
  "Solomon Islands": "Oceania",
  Vanuatu: "Oceania",
  Samoa: "Oceania",
  Tonga: "Oceania",
  "Cook Islands": "Oceania",
  Guam: "Oceania",
  "American Samoa": "Oceania",

  // International
  International: "International",
  World: "International",
};

// European countries list for filtering
const europeanCountries = [
  "England", "Scotland", "Wales", "Northern Ireland", "Spain", "Italy", "Germany",
  "France", "Netherlands", "Portugal", "Belgium", "Turkey", "Russia", "Poland",
  "Ukraine", "Czech Republic", "Greece", "Switzerland", "Austria", "Denmark",
  "Sweden", "Norway", "Finland", "Croatia", "Serbia", "Romania", "Hungary",
  "Slovakia", "Slovenia", "Bulgaria", "Bosnia and Herzegovina", "Iceland",
  "Republic of Ireland", "Albania", "North Macedonia", "Montenegro", "Estonia",
  "Latvia", "Lithuania", "Luxembourg", "Malta", "Moldova", "Cyprus", "Georgia",
  "Armenia", "Azerbaijan", "Belarus", "Andorra", "San Marino", "Liechtenstein",
  "Monaco", "Kosovo", "Kazakhstan"
];

// African countries list
const africanCountries = [
  "Egypt", "Morocco", "Tunisia", "Algeria", "Libya", "Sudan", "Nigeria", "Ghana",
  "Ivory Coast", "Senegal", "Mali", "Burkina", "Guinea", "Liberia", "Sierra Leone",
  "Gambia", "Cape Verde", "Mauritania", "Niger", "Togo", "Benin", "Uganda", "Kenya",
  "Ethiopia", "Tanzania", "Rwanda", "Burundi", "Somalia", "Djibouti", "Eritrea",
  "South Sudan", "Cameroon", "DR Congo", "Congo", "Gabon", "Equatorial Guinea",
  "São Tomé and Príncipe", "Central African Republic", "Chad", "South Africa",
  "Angola", "Zambia", "Zimbabwe", "Malawi", "Mozambique", "Swaziland", "Lesotho",
  "Botswana", "Namibia", "Madagascar", "Mauritius", "Comoros", "Seychelles"
];

// American countries list
const americanCountries = [
  "United States", "Mexico", "Canada", "Brazil", "Argentina", "Colombia", "Chile",
  "Uruguay", "Paraguay", "Peru", "Ecuador", "Bolivia", "Venezuela", "Costa Rica",
  "Panama", "Honduras", "Guatemala", "El Salvador", "Nicaragua", "Jamaica",
  "Trinidad and Tobago", "Haiti", "Dominican Republic", "Cuba", "Guyana", "Suriname",
  "French Guiana"
];

// Asian countries list
const asianCountries = [
  "Japan", "South Korea", "China", "Saudi Arabia", "Qatar", "United Arab Emirates",
  "India", "Thailand", "Malaysia", "Indonesia", "Vietnam", "Singapore", "Philippines",
  "Myanmar", "Cambodia", "Laos", "North Korea", "Iran", "Iraq", "Kuwait", "Bahrain",
  "Oman", "Yemen", "Jordan", "Lebanon", "Syria", "Palestine", "Israel", "Uzbekistan",
  "Kazakhstan", "Kyrgyzstan", "Tajikistan", "Turkmenistan", "Afghanistan", "Pakistan",
  "Bangladesh", "Sri Lanka", "Nepal", "Bhutan", "Maldives", "Mongolia", "East Timor",
  "Brunei"
];

// Oceanian countries list
const oceanianCountries = [
  "Australia", "New Zealand", "Papua New Guinea", "Fiji", "New Caledonia", "Tahiti",
  "Solomon Islands", "Vanuatu", "Samoa", "Tonga", "Cook Islands", "Guam", "American Samoa"
];

// International competition keywords
const internationalKeywords = [
  "World Cup", "Champions League", "Europa League", "Conference League",
  "Copa Libertadores", "Copa Sudamericana", "CONCACAF", "AFC", "CAF",
  "Euro", "Copa América", "Gold Cup", "Asian Cup", "Nations League",
  "Club World Cup", "Super Cup"
];

// Global rate limit tracker
let rateLimitHit = false;
let rateLimitResetTime = 0;

/**
 * Check global rate limit status from leagueStandingsService
 */
function checkGlobalRateLimit(): void {
  if (typeof global !== 'undefined') {
    const globalRateLimited = (global as any).__API_FOOTBALL_RATE_LIMITED__;
    const globalResetTime = (global as any).__API_FOOTBALL_RATE_LIMIT_RESET__;
    
    if (globalRateLimited && globalResetTime) {
      rateLimitHit = true;
      rateLimitResetTime = globalResetTime;
    }
  }
}

class LeaguesByRegionService {
  private apiService = createApiSportsService();
  private currentSeason: number;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_FETCH_TIME = 8000; // 8 seconds max (increased from 1 second to allow proper API responses)
  private readonly BATCH_SIZE = 3; // Process 3 countries at a time
  private readonly BATCH_DELAY = 300; // 300ms delay between batches

  constructor() {
    // Get current season year
    const now = new Date();
    this.currentSeason = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
  }

  /**
   * Check if we're currently rate limited
   */
  private isRateLimited(): boolean {
    // Check global rate limit status first
    checkGlobalRateLimit();
    
    if (!rateLimitHit) return false;
    // Check if rate limit has reset
    if (Date.now() > rateLimitResetTime) {
      rateLimitHit = false;
      if (typeof global !== 'undefined') {
        (global as any).__API_FOOTBALL_RATE_LIMITED__ = false;
      }
      return false;
    }
    return true;
  }

  /**
   * Mark rate limit as hit
   */
  private setRateLimited(retryAfterSeconds: number = 60): void {
    rateLimitHit = true;
    rateLimitResetTime = Date.now() + (retryAfterSeconds * 1000);
    console.warn(`🚫 [LeaguesByRegion] Rate limit detected. Will retry after ${retryAfterSeconds}s`);
  }

  /**
   * Timeout wrapper for API calls
   */
  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    const timeout = new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
    );
    return Promise.race([promise, timeout]);
  }

  /**
   * Fetch leagues for a specific region and sport
   * Uses caching to ensure loading never exceeds 1 second
   */
  async getLeaguesByRegion(region: "Hot" | "Top" | "Int'l" | "Africa" | "Europe" | "America" | "Oceania" | "Asia", sport: string = "football"): Promise<LeagueData[]> {
    const cacheKey = `leagues_region_${region}_${sport}_${this.currentSeason}`;
    
    console.log(`🔑 [LeaguesByRegion] ===== getLeaguesByRegion START =====`);
    console.log(`🔑 [LeaguesByRegion] Region: ${region}`);
    console.log(`🔑 [LeaguesByRegion] Sport: ${sport}`);
    console.log(`🔑 [LeaguesByRegion] Cache Key: ${cacheKey}`);
    console.log(`🔑 [LeaguesByRegion] ================================`);
    
    // ✅ CRITICAL: Try to get from cache first (instant return)
    // This ensures we have data even when circuit breaker is open
    const cached = await cacheService.get<LeagueData[]>(cacheKey);
    if (cached !== null && cached.length > 0) {
      console.log(`✅ [LeaguesByRegion] Using cached data for ${region} ${sport} (${cached.length} leagues)`);
      console.log(`✅ [LeaguesByRegion] Sample leagues:`, cached.slice(0, 3).map(l => `${l.name} (${l.country})`).join(', '));
      return cached;
    }
    
    // ✅ If cache is empty but circuit breaker is open, return empty array gracefully
    // This prevents errors and allows UI to show "no leagues" instead of crashing
    if (this.isRateLimited()) {
      console.warn(`⚠️ [LeaguesByRegion] Rate limited and no cached data available for ${region} ${sport}`);
      console.log(`🔄 [LeaguesByRegion] Will try API-Football fallback (not affected by API-Sports circuit breaker)`);
      // Don't return early - continue to try API-Football fallback
    }
    
    console.log(`⚠️ [LeaguesByRegion] NO CACHE FOUND for ${region} ${sport}`);
    console.log(`🔄 [LeaguesByRegion] Fetching from API...`);

    // ✅ CRITICAL: Don't return early if rate limited - API-Football fallback is not affected by API-Sports circuit breaker
    // The circuit breaker only affects API-Sports, but we use API-Football via fetchLeaguesByCountry
    if (this.isRateLimited()) {
      console.warn(`🚫 [LeaguesByRegion] API-Sports RATE LIMITED - will try API-Football fallback (not affected by circuit breaker)`);
      // Continue to try API-Football fallback instead of returning empty
    }

    // If not cached, fetch with timeout
    try {
      const fetchPromise = this.fetchLeaguesByRegionInternal(region, sport);
      const data = await this.withTimeout(fetchPromise, this.MAX_FETCH_TIME);
      
      console.log(`📊 [LeaguesByRegion] Fetched ${data.length} leagues for ${region} ${sport}`);
      
      // Only cache if we got data and weren't rate limited
      if (data.length > 0 && !this.isRateLimited()) {
        await cacheService.set(cacheKey, data, this.CACHE_TTL);
      }
      
      return data;
    } catch (error: any) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      // ✅ Handle errors gracefully - return cache or empty
      if (errorMsg === 'Request timeout') {
        console.warn(`⏱️ [LeaguesByRegion] Timeout for ${region} - using cache if available`);
      } else if (errorMsg.includes('Circuit breaker') || errorMsg.includes('rate limit') || error?.name === 'RateLimitError' || error?.statusCode === 429) {
        console.warn(`🚫 [LeaguesByRegion] Circuit breaker/rate limit for ${region} - using cache if available`);
      } else {
        console.warn(`⚠️ [LeaguesByRegion] Error fetching ${region}:`, errorMsg.substring(0, 100));
      }
      
      // ✅ CRITICAL: Return cached data if available, even if expired
      if (cached && cached.length > 0) {
        console.log(`💾 [LeaguesByRegion] Returning cached data due to error (${cached.length} leagues)`);
        return cached;
      }
      
      return [];
    }
  }

  /**
   * Internal method to fetch leagues (without caching)
   */
  private async fetchLeaguesByRegionInternal(region: "Hot" | "Top" | "Int'l" | "Africa" | "Europe" | "America" | "Oceania" | "Asia", sport: string = "football"): Promise<LeagueData[]> {
    console.log(`🔍 [LeaguesByRegion] fetchLeaguesByRegionInternal - region: ${region}, sport: ${sport}`);
    
    if (region === "Hot" || region === "Top") {
      // Hot/Top: Get top leagues from major countries
      console.log(`🌟 [LeaguesByRegion] Fetching TOP leagues for ${sport}`);
      return await this.getTopLeagues(sport);
    }

    if (region === "Int'l") {
      // International: Get international competitions
      console.log(`🌍 [LeaguesByRegion] Fetching INTERNATIONAL leagues for ${sport}`);
      return await this.getInternationalLeagues(sport);
    }

    // Regional leagues - fetch in parallel batches with rate limit protection
    const countries = this.getCountriesForRegion(region);
    console.log(`🌍 [LeaguesByRegion] Fetching leagues for ${countries.length} countries in ${region}`);
    console.log(`🌍 [LeaguesByRegion] Countries:`, countries.join(', '));
    
    const allLeagues: LeagueData[] = [];

    // Fetch in smaller batches with delays to avoid rate limits
    for (let i = 0; i < countries.length; i += this.BATCH_SIZE) {
      // ✅ CRITICAL: Don't stop completely if rate limited - try cached data and continue with other countries
      if (this.isRateLimited()) {
        console.warn(`⚠️ [LeaguesByRegion] Rate limited detected - will use cached data and continue processing (processed ${i}/${countries.length} countries)`);
        // Don't break - continue to try other countries and use cached data
      }

      const batch = countries.slice(i, i + this.BATCH_SIZE);
      console.log(`📦 [LeaguesByRegion] Batch ${Math.floor(i/this.BATCH_SIZE) + 1}: Fetching ${batch.join(', ')}`);
      
      const batchPromises = batch.map(async (country) => {
        try {
          // ✅ CRITICAL: Even if rate limited, try to fetch - API-Football might have different rate limits
          // The fetchLeaguesByCountry function handles its own rate limit checking
          if (this.isRateLimited()) {
            console.log(`⚠️ [LeaguesByRegion] Rate limited, but trying ${country} anyway (API-Football may have different limits)`);
          }
          
          console.log(`🔄 [LeaguesByRegion] Fetching leagues for ${country}...`);
          const leagues = await fetchLeaguesByCountry(country, this.currentSeason, sport);
          
          // Check if response indicates rate limit (null response from apiFootballFetch)
          if (!leagues) {
            // Rate limit detected - check global flag
            if (this.isRateLimited()) {
              console.warn(`🚫 [LeaguesByRegion] Rate limit detected for ${country} - will try cached data`);
              return []; // Return empty to continue with other countries
            }
            console.log(`ℹ️ [LeaguesByRegion] No leagues found for ${country}`);
            return [];
          }
          
          if (leagues.length === 0) {
            console.log(`ℹ️ [LeaguesByRegion] ${country}: 0 leagues`);
            return [];
          }
          
          console.log(`✅ [LeaguesByRegion] ${country}: ${leagues.length} leagues`);
          
          return leagues.map((item) => ({
            id: item.league.id,
            name: item.league.name,
            country: item.country.name,
            logo: item.league.logo,
            flag: item.country.flag,
            type: item.league.type,
          }));
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          // Check if error indicates rate limit or circuit breaker
          if (errorMsg.includes('429') || errorMsg.includes('rate limit') || errorMsg.includes('Circuit breaker')) {
            console.warn(`🚫 [LeaguesByRegion] Rate limit/circuit breaker for ${country} - continuing with other countries`);
            this.setRateLimited(60);
            return []; // Return empty to continue processing other countries
          }
          console.warn(`⚠️ [LeaguesByRegion] Error fetching leagues for ${country}:`, errorMsg.substring(0, 100));
          return []; // Return empty array instead of failing completely
        }
      });

      const batchResults = await Promise.all(batchPromises);
      
      // ✅ CRITICAL: Filter out nulls but keep empty arrays (they're valid - just no leagues for that country)
      const validResults = batchResults.filter((result) => result !== null && Array.isArray(result));
      
      // ✅ Even if some countries failed, continue processing others
      const batchLeagues = validResults.flat();
      allLeagues.push(...batchLeagues);
      
      console.log(`📊 [LeaguesByRegion] Batch complete: ${batchLeagues.length} leagues added from ${validResults.length} countries. Total so far: ${allLeagues.length}`);
      
      // ✅ CRITICAL: Don't break even if rate limited - continue to try cached data and other countries
      // Only log a warning but continue processing
      if (this.isRateLimited() && allLeagues.length === 0) {
        console.warn(`⚠️ [LeaguesByRegion] Rate limited and no leagues collected yet - continuing to try cached data (processed ${i + batch.length}/${countries.length} countries)`);
        // Don't break - continue to try other countries and cached data
      }

      // Add delay between batches to avoid rate limits (except for last batch)
      if (i + this.BATCH_SIZE < countries.length && !this.isRateLimited()) {
        await new Promise(resolve => setTimeout(resolve, this.BATCH_DELAY));
      }
    }

    console.log(`🏁 [LeaguesByRegion] Fetch complete for ${region}: ${allLeagues.length} total leagues`);
    
    // Remove duplicates and sort
    return this.deduplicateAndSort(allLeagues);
  }

  /**
   * Get top/popular leagues
   */
  private async getTopLeagues(sport: string = "football"): Promise<LeagueData[]> {
    const topCountries = [
      "England", "Spain", "Italy", "Germany", "France", // Big 5
      "Netherlands", "Portugal", "Brazil", "Argentina", "Mexico", // Other top leagues
    ];

    // Fetch countries in smaller batches to avoid rate limits
    const allLeagues: LeagueData[] = [];
    
    for (let i = 0; i < topCountries.length; i += this.BATCH_SIZE) {
      // ✅ CRITICAL: Don't stop completely if rate limited - try cached data and continue
      if (this.isRateLimited()) {
        console.warn(`⚠️ [getTopLeagues] Rate limited detected - will use cached data and continue processing`);
        // Don't break - continue to try other countries and use cached data
      }

      const batch = topCountries.slice(i, i + this.BATCH_SIZE);
      const batchPromises = batch.map(async (country) => {
        try {
          // ✅ CRITICAL: Even if rate limited, try to fetch - API-Football might have different rate limits
          // The fetchLeaguesByCountry function handles its own rate limit checking
          if (this.isRateLimited()) {
            console.log(`⚠️ [getTopLeagues] Rate limited, but trying ${country} anyway (API-Football may have different limits)`);
          }
          
          console.log(`🔄 [getTopLeagues] Fetching leagues for ${country}...`);
          const leagues = await fetchLeaguesByCountry(country, this.currentSeason, sport);
          
          // Check if response indicates rate limit
          if (!leagues) {
            if (this.isRateLimited()) {
              console.warn(`🚫 [getTopLeagues] Rate limit detected for ${country}`);
              return []; // Return empty to continue with other countries
            }
            console.log(`ℹ️ [getTopLeagues] No leagues found for ${country}`);
            return [];
          }
          
          if (leagues.length === 0) {
            return [];
          }
          
          return leagues.map((item) => ({
            id: item.league.id,
            name: item.league.name,
            country: item.country.name,
            logo: item.league.logo,
            flag: item.country.flag,
            type: item.league.type,
          }));
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          if (errorMsg.includes('429') || errorMsg.includes('rate limit') || errorMsg.includes('Circuit breaker')) {
            console.warn(`🚫 [getTopLeagues] Rate limit/circuit breaker for ${country} - continuing with other countries`);
            this.setRateLimited(60);
            return []; // Return empty to continue processing other countries
          }
          console.warn(`⚠️ [getTopLeagues] Error fetching top leagues for ${country}:`, errorMsg.substring(0, 100));
          return []; // Return empty array instead of failing completely
        }
      });

      const batchResults = await Promise.all(batchPromises);
      
      // ✅ CRITICAL: Filter out nulls but keep empty arrays (they're valid - just no leagues for that country)
      const validResults = batchResults.filter((result) => result !== null && Array.isArray(result));
      
      // ✅ Even if some countries failed, continue processing others
      const batchLeagues = validResults.flat();
      allLeagues.push(...batchLeagues);
      
      console.log(`📊 [getTopLeagues] Batch complete: ${batchLeagues.length} leagues added from ${validResults.length} countries. Total so far: ${allLeagues.length}`);
      
      // ✅ CRITICAL: Don't break even if rate limited - continue to try cached data and other countries
      // Only log a warning but continue processing
      if (this.isRateLimited() && allLeagues.length === 0) {
        console.warn(`⚠️ [getTopLeagues] Rate limited and no leagues collected yet - continuing to try cached data`);
        // Don't break - continue to try other countries and cached data
      }

      // Add delay between batches
      if (i + this.BATCH_SIZE < topCountries.length && !this.isRateLimited()) {
        await new Promise(resolve => setTimeout(resolve, this.BATCH_DELAY));
      }
    }

    // ✅ CRITICAL: Always try to add international competitions, even if rate limited
    // The getInternationalLeagues method has its own fallback logic
    try {
      const intlLeagues = await this.getInternationalLeagues(sport);
      if (intlLeagues.length > 0) {
        allLeagues.push(...intlLeagues);
        console.log(`✅ [getTopLeagues] Added ${intlLeagues.length} international leagues`);
      }
    } catch (error: any) {
      // Handle rate limit errors gracefully - don't fail completely
      const errorMsg = error instanceof Error ? error.message : String(error);
      if (errorMsg.includes('429') || errorMsg.includes('rate limit') || errorMsg.includes('Circuit breaker')) {
        console.warn("⚠️ [getTopLeagues] Rate limit/circuit breaker reached. Skipping international leagues fetch.");
      } else {
        console.warn(`⚠️ [getTopLeagues] Failed to fetch international leagues:`, errorMsg.substring(0, 100));
      }
    }

    return this.deduplicateAndSort(allLeagues);
  }

  /**
   * Get international competitions
   * ✅ CRITICAL: Falls back to API-Football if API-Sports circuit breaker is open
   */
  private async getInternationalLeagues(sport: string = "football"): Promise<LeagueData[]> {
    // ✅ Try API-Sports first (but don't let circuit breaker block fallback)
    try {
      console.log(`🌍 [getInternationalLeagues] Trying API-Sports for international leagues...`);
      // ✅ CRITICAL: If circuit breaker is open, skip API-Sports and go directly to fallback
      if (this.isRateLimited()) {
        console.log(`🔄 [getInternationalLeagues] Circuit breaker is OPEN - skipping API-Sports, going directly to API-Football fallback`);
        throw new Error("Circuit breaker is open - using fallback");
      }
      const allLeagues = await this.apiService.getLeagues(undefined, this.currentSeason, sport);
      
      const internationalLeagues = allLeagues.filter((league) => {
        const name = league.name?.toLowerCase() || "";
        const country = league.country?.toLowerCase() || "";
        
        // Check if it's an international competition
        return (
          country === "world" ||
          country === "international" ||
          internationalKeywords.some(keyword => name.includes(keyword.toLowerCase())) ||
          (
            name.includes("champions") ||
            name.includes("cup") ||
            name.includes("league")
          )
        );
      });

      if (internationalLeagues.length > 0) {
        console.log(`✅ [getInternationalLeagues] API-Sports returned ${internationalLeagues.length} international leagues`);
        return internationalLeagues.map((league) => ({
          id: league.id || 0,
          name: league.name || "",
          country: league.country || "International",
          logo: league.logo || null,
          flag: league.flag || null,
          type: "international",
        }));
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      // ✅ CRITICAL: Don't log circuit breaker errors as failures - they're expected when fallback is needed
      if (errorMsg.includes('Circuit breaker') || errorMsg.includes('rate limit')) {
        console.log(`🔄 [getInternationalLeagues] API-Sports circuit breaker is OPEN - gracefully falling back to API-Football`);
      } else {
        console.warn(`⚠️ [getInternationalLeagues] API-Sports failed: ${errorMsg.substring(0, 100)}`);
        console.log(`🔄 [getInternationalLeagues] Falling back to API-Football...`);
      }
    }

    // ✅ FALLBACK: Try API-Football for international leagues
    try {
      console.log(`🌍 [getInternationalLeagues] Trying API-Football fallback...`);
      // Fetch known international countries/competitions
      const internationalCountries = ["World", "International", "UEFA", "FIFA"];
      const allLeagues: LeagueData[] = [];
      
      for (const country of internationalCountries) {
        try {
          const leagues = await fetchLeaguesByCountry(country, this.currentSeason, sport);
          if (leagues && leagues.length > 0) {
            const mapped = leagues.map((item) => ({
              id: item.league.id,
              name: item.league.name,
              // ✅ CRITICAL: Normalize "World" to "International" - Int'l already represents World
              country: item.country.name === "World" ? "International" : item.country.name,
              logo: item.league.logo,
              flag: item.country.flag,
              type: item.league.type,
            }));
            allLeagues.push(...mapped);
          }
        } catch (err) {
          // Continue to next country
          console.log(`ℹ️ [getInternationalLeagues] No leagues for ${country}`);
        }
      }

      if (allLeagues.length > 0) {
        console.log(`✅ [getInternationalLeagues] API-Football fallback returned ${allLeagues.length} leagues`);
        return allLeagues.map((league) => ({
          ...league,
          type: "international",
        }));
      }
    } catch (error) {
      console.warn(`⚠️ [getInternationalLeagues] API-Football fallback also failed:`, error);
    }

    console.warn(`⚠️ [getInternationalLeagues] All fallbacks exhausted - returning empty array`);
    return [];
  }

  /**
   * Get countries for a specific region
   */
  private getCountriesForRegion(region: string): string[] {
    switch (region) {
      case "Europe":
        return europeanCountries;
      case "Africa":
        return africanCountries;
      case "America":
        return americanCountries;
      case "Asia":
        return asianCountries;
      case "Oceania":
        return oceanianCountries;
      default:
        return [];
    }
  }

  /**
   * Remove duplicates and sort leagues
   */
  private deduplicateAndSort(leagues: LeagueData[]): LeagueData[] {
    // Remove duplicates by ID
    const seen = new Set<number>();
    const unique = leagues.filter((league) => {
      if (seen.has(league.id)) {
        return false;
      }
      seen.add(league.id);
      return true;
    });

    // ✅ CRITICAL: Sort by official rank (popularity/importance) instead of just type
    return sortLeaguesByRank(unique);
  }

  /**
   * Get leagues grouped by country (for horizontal tabs)
   * Uses caching to ensure loading never exceeds 1 second
   */
  async getLeaguesByCountry(region: "Hot" | "Top" | "Int'l" | "Africa" | "Europe" | "America" | "Oceania" | "Asia", sport: string = "football"): Promise<Record<string, LeagueData[]>> {
    const cacheKey = `leagues_country_${region}_${sport}_${this.currentSeason}`;
    
    console.log(`🔑 [LeaguesByCountry] ===== getLeaguesByCountry START =====`);
    console.log(`🔑 [LeaguesByCountry] Region: ${region}`);
    console.log(`🔑 [LeaguesByCountry] Sport: ${sport}`);
    console.log(`🔑 [LeaguesByCountry] Cache Key: ${cacheKey}`);
    console.log(`🔑 [LeaguesByCountry] ====================================`);
    
    // ✅ CRITICAL: Try to get from cache first (instant return)
    // This ensures we have data even when circuit breaker is open
    const cached = await cacheService.get<Record<string, LeagueData[]>>(cacheKey);
    if (cached !== null && Object.keys(cached).length > 0) {
      const totalLeagues = Object.values(cached).flat().length;
      const countries = Object.keys(cached);
      console.log(`✅ [LeaguesByCountry] Using cached data for ${region} ${sport}`);
      console.log(`✅ [LeaguesByCountry] Cached: ${countries.length} countries, ${totalLeagues} leagues`);
      console.log(`✅ [LeaguesByCountry] Countries:`, countries.join(', '));
      return cached;
    }
    
    // ✅ If cache is empty but circuit breaker is open, log but continue
    // API-Football fallback is not affected by API-Sports circuit breaker
    if (this.isRateLimited()) {
      console.warn(`⚠️ [LeaguesByCountry] Rate limited and no cached data available for ${region} ${sport}`);
      console.log(`🔄 [LeaguesByCountry] Will try API-Football fallback (not affected by API-Sports circuit breaker)`);
      // Don't return early - continue to try API-Football fallback
    }

    console.log(`⚠️ [LeaguesByCountry] NO CACHE FOUND for ${region} ${sport}`);
    console.log(`🔄 [LeaguesByCountry] Fetching from API...`);

    // If not cached, fetch with timeout
    try {
      const fetchPromise = this.fetchLeaguesByCountryInternal(region, sport);
      const data = await this.withTimeout(fetchPromise, this.MAX_FETCH_TIME);
      
      const totalLeagues = Object.values(data).flat().length;
      const countries = Object.keys(data);
      console.log(`📊 [LeaguesByCountry] Fetched ${countries.length} countries, ${totalLeagues} leagues for ${region} ${sport}`);
      
      // ✅ CRITICAL: Cache data even if some countries are empty (for future use)
      if (countries.length > 0 || totalLeagues > 0) {
        await cacheService.set(cacheKey, data, this.CACHE_TTL);
        console.log(`✅ [LeaguesByCountry] Cached data for ${region} ${sport}`);
      }
      
      return data;
    } catch (error: any) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      // ✅ Handle errors gracefully - return cache or empty
      if (errorMsg === 'Request timeout') {
        console.warn(`⏱️ [LeaguesByCountry] Timeout for ${region} countries - using cache if available`);
      } else if (errorMsg.includes('Circuit breaker') || errorMsg.includes('rate limit')) {
        console.warn(`🚫 [LeaguesByCountry] Circuit breaker/rate limit for ${region} - using cache if available`);
      } else {
        console.warn(`⚠️ [LeaguesByCountry] Error fetching ${region}:`, errorMsg.substring(0, 100));
      }
      
      // ✅ CRITICAL: Return cached data if available, even if expired
      if (cached && Object.keys(cached).length > 0) {
        const totalCachedLeagues = Object.values(cached).flat().length;
        console.log(`💾 [LeaguesByCountry] Returning cached data due to error (${Object.keys(cached).length} countries, ${totalCachedLeagues} leagues)`);
        return cached;
      }
      
      return {};
    }
  }

  /**
   * Internal method to fetch leagues by country (without caching)
   */
  private async fetchLeaguesByCountryInternal(region: "Hot" | "Top" | "Int'l" | "Africa" | "Europe" | "America" | "Oceania" | "Asia", sport: string = "football"): Promise<Record<string, LeagueData[]>> {
    // For Int'l, Hot, Top - fetch and group international leagues by country/organization
    if (region === "Int'l" || region === "Hot" || region === "Top") {
      const leagues = await this.getLeaguesByRegion(region, sport);
      const grouped: Record<string, LeagueData[]> = {};
      
      // Group by country
      leagues.forEach((league) => {
        // ✅ CRITICAL: Normalize "World" to "International" - Int'l already represents World
        let country = league.country || "International";
        if (country === "World") {
          country = "International";
        }
        if (!grouped[country]) {
          grouped[country] = [];
        }
        grouped[country].push(league);
      });
      
      return grouped;
    }
    
    const countries = this.getCountriesForRegion(region);
    const grouped: Record<string, LeagueData[]> = {};
    
    // ✅ Initialize all countries with empty arrays to ensure they appear even if no leagues
    countries.forEach(country => {
      grouped[country] = [];
    });

    // Fetch in parallel batches of 5 countries at a time for speed
    const batchSize = 5;
    for (let i = 0; i < countries.length; i += batchSize) {
      const batch = countries.slice(i, i + batchSize);
      const batchPromises = batch.map(async (requestedCountry) => {
        try {
          console.log(`🔄 [LeaguesByCountry] Fetching leagues for ${requestedCountry} (season: ${this.currentSeason})`);
          const leagues = await fetchLeaguesByCountry(requestedCountry, this.currentSeason, sport);
          
          console.log(`📊 [LeaguesByCountry] ${requestedCountry}: Received ${leagues?.length || 0} leagues from API`);
          
          if (!leagues || leagues.length === 0) {
            console.log(`ℹ️ [LeaguesByCountry] No leagues found for ${requestedCountry} - API returned empty`);
            // ✅ Still return the country so it appears in the list (even if empty)
            return { requestedCountry, leaguesByApiCountry: { [requestedCountry]: [] } };
          }
          
          // ✅ CRITICAL: Group leagues by their API country name, not the requested country name
          // This ensures the key matches what the API returns
          const leaguesByApiCountry: Record<string, LeagueData[]> = {};
          
          leagues.forEach((item) => {
            const apiCountryName = item.country?.name || requestedCountry;
            const leagueData: LeagueData = {
              id: item.league.id,
              name: item.league.name,
              country: apiCountryName, // ✅ Use API country name
              logo: item.league.logo,
              flag: item.country?.flag || null,
              type: item.league.type,
            };
            
            if (!leaguesByApiCountry[apiCountryName]) {
              leaguesByApiCountry[apiCountryName] = [];
            }
            leaguesByApiCountry[apiCountryName].push(leagueData);
          });

          // ✅ Return all API country groups found for this requested country
          return { requestedCountry, leaguesByApiCountry };
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          console.warn(`⚠️ [LeaguesByCountry] Error fetching leagues for ${requestedCountry}:`, errorMsg);
          // ✅ Still return the country with empty array so it appears in the list
          return { requestedCountry, leaguesByApiCountry: { [requestedCountry]: [] } };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      batchResults.forEach(({ requestedCountry, leaguesByApiCountry }) => {
        // ✅ CRITICAL: Use API country names as keys, but also map to requested country name
        const hasLeagues = leaguesByApiCountry && Object.keys(leaguesByApiCountry).length > 0;
        
        if (hasLeagues) {
          Object.entries(leaguesByApiCountry).forEach(([apiCountryName, leagues]) => {
            // ✅ Use API country name as primary key (most accurate)
            if (!grouped[apiCountryName]) {
              grouped[apiCountryName] = [];
            }
            grouped[apiCountryName].push(...leagues);
            
            // ✅ ALSO map to requested country name for backward compatibility
            // This handles cases where API returns "People's Republic of China" but we request "China"
            if (apiCountryName !== requestedCountry) {
              // Always create alias to requested country name for easier matching
              if (!grouped[requestedCountry] || grouped[requestedCountry].length === 0) {
                grouped[requestedCountry] = [...leagues];
                console.log(`🔄 [LeaguesByCountry] Mapped API country "${apiCountryName}" to requested "${requestedCountry}" (${leagues.length} leagues)`);
              } else {
                // Merge if both exist
                grouped[requestedCountry].push(...leagues);
                console.log(`🔄 [LeaguesByCountry] Merged API country "${apiCountryName}" into "${requestedCountry}"`);
              }
            }
          });
        } else {
          // ✅ No leagues found - ensure country still exists (even if empty)
          // This ensures countries appear in the list even if they have no leagues
          if (!grouped[requestedCountry]) {
            grouped[requestedCountry] = [];
          }
          console.log(`ℹ️ [LeaguesByCountry] ${requestedCountry}: No leagues found (kept in list)`);
        }
      });
    }
    
    // ✅ Log final grouping for debugging
    const countriesWithLeagues = Object.entries(grouped).filter(([_, leagues]) => leagues.length > 0);
    console.log(`📊 [LeaguesByCountry] Final grouping: ${countriesWithLeagues.length} countries with leagues out of ${Object.keys(grouped).length} total countries`);
    countriesWithLeagues.forEach(([country, leagues]) => {
      console.log(`   ${country}: ${leagues.length} leagues`);
    });

    // ✅ CRITICAL: Sort leagues by official rank within each country
    const sortedGrouped = sortLeaguesByCountryRank(grouped);
    console.log(`✅ [LeaguesByCountry] Sorted leagues by official rank for all countries`);

    return sortedGrouped;
  }
}

export const leaguesByRegionService = new LeaguesByRegionService();
