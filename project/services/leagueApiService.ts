/**
 * League API Service
 * 100% API-driven league data fetching for Football and Basketball
 * With intelligent fallback to static data when API limits are hit
 */

import { League } from '../types/league';
import { leagues as staticLeagues } from '../data/leagues';

const RAPIDAPI_KEY = process.env.EXPO_PUBLIC_RAPIDAPI_KEY || '';
const RAPIDAPI_HOST_FOOTBALL = 'api-football-v1.p.rapidapi.com';
const RAPIDAPI_HOST_BASKETBALL = 'api-basketball.p.rapidapi.com';

// Cache for API responses (1 hour TTL)
const CACHE_TTL = 60 * 60 * 1000; // 1 hour
const cache: { [key: string]: { data: League[]; timestamp: number } } = {};

/**
 * Check if cached data is still valid
 */
function isCacheValid(key: string): boolean {
  if (!cache[key]) return false;
  return Date.now() - cache[key].timestamp < CACHE_TTL;
}

/**
 * Get cached data if valid
 */
function getCachedData(key: string): League[] | null {
  if (isCacheValid(key)) {
    return cache[key].data;
  }
  return null;
}

/**
 * Set cache data
 */
function setCacheData(key: string, data: League[]): void {
  cache[key] = { data, timestamp: Date.now() };
}

/**
 * Get fallback data from static leagues
 * Silent fallback - no console messages shown to users
 */
function getFallbackLeagues(sport: string): League[] {
  return staticLeagues[sport] || [];
}

/**
 * Fetch all leagues for Football from RapidAPI
 */
export async function fetchFootballLeagues(): Promise<League[]> {
  const cacheKey = 'football';
  
  // Check cache first
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    // Silently try to fetch from API
    const response = await fetch(
      'https://api-football-v1.p.rapidapi.com/v3/leagues',
      {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': RAPIDAPI_HOST_FOOTBALL,
        },
      }
    );

    if (!response.ok) {
      // Silently fall back to static data when API is unavailable
      // Cache fallback data to prevent repeated API calls when rate-limited
      const fallbackData = getFallbackLeagues('football');
      setCacheData(cacheKey, fallbackData);
      return fallbackData;
    }

    const data = await response.json();
    
    // Check if API returned valid data
    if (!data.response || data.response.length === 0) {
      const fallbackData = getFallbackLeagues('football');
      setCacheData(cacheKey, fallbackData);
      return fallbackData;
    }
    
    // Transform API response to League format
    const leagues = data.response.map((item: any) => ({
      id: `league-${item.league.id}`,
      name: item.league.name,
      country: item.country.name,
      logo: item.league.logo,
      type: item.league.type,
      apiId: item.league.id.toString(),
    }));
    
    // Cache the API result
    setCacheData(cacheKey, leagues);
    
    return leagues;
  } catch (error) {
    // Silently fall back to static data - cache it to prevent repeated failures
    const fallbackData = getFallbackLeagues('football');
    setCacheData(cacheKey, fallbackData);
    return fallbackData;
  }
}

/**
 * Fetch all leagues for Basketball from RapidAPI
 */
export async function fetchBasketballLeagues(): Promise<League[]> {
  const cacheKey = 'basketball';
  
  // Check cache first
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    // Silently try to fetch from API
    const response = await fetch(
      'https://api-basketball.p.rapidapi.com/leagues',
      {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': RAPIDAPI_HOST_BASKETBALL,
        },
      }
    );

    if (!response.ok) {
      // Silently fall back to static data when API is unavailable
      // Cache fallback data to prevent repeated API calls when rate-limited
      const fallbackData = getFallbackLeagues('basketball');
      setCacheData(cacheKey, fallbackData);
      return fallbackData;
    }

    const data = await response.json();
    
    // Check if API returned valid data
    if (!data.response || data.response.length === 0) {
      const fallbackData = getFallbackLeagues('basketball');
      setCacheData(cacheKey, fallbackData);
      return fallbackData;
    }
    
    // Transform API response to League format
    const leagues = data.response.map((item: any) => ({
      id: `league-${item.id}`,
      name: item.name,
      country: item.country?.name || 'International',
      logo: item.logo,
      type: item.type || 'league',
      apiId: item.id.toString(),
    }));
    
    // Cache the API result
    setCacheData(cacheKey, leagues);
    
    return leagues;
  } catch (error) {
    // Silently fall back to static data - cache it to prevent repeated failures
    const fallbackData = getFallbackLeagues('basketball');
    setCacheData(cacheKey, fallbackData);
    return fallbackData;
  }
}

/**
 * Fetch leagues by sport type
 * @param sport - 'football' or 'basketball'
 */
export async function fetchLeaguesBySport(sport: string): Promise<League[]> {
  if (sport === 'basketball') {
    return await fetchBasketballLeagues();
  } else {
    return await fetchFootballLeagues();
  }
}

/**
 * Get hot/featured leagues from API data
 */
export function getHotLeaguesFromData(
  allLeagues: League[],
  sport: string
): League[] {
  // Hot leagues for football (by name matching)
  const footballHotNames = [
    'Premier League',
    'La Liga',
    'Bundesliga',
    'Serie A',
    'Ligue 1',
    'UEFA Champions League',
    'UEFA Europa League',
  ];

  // Hot leagues for basketball (by name matching)
  const basketballHotNames = [
    'NBA',
    'NBL',
    'NCAA',
    'EuroLeague',
    'EuroCup',
    'CBA',
  ];

  const hotNames =
    sport === 'basketball' ? basketballHotNames : footballHotNames;

  return allLeagues
    .filter((league) =>
      hotNames.some((name) =>
        league.name.toLowerCase().includes(name.toLowerCase())
      )
    )
    .slice(0, 7);
}

/**
 * Organize leagues alphabetically
 */
export function organizeLeaguesByAlphabet(
  leagues: League[]
): Record<string, League[]> {
  return leagues.reduce((acc, league) => {
    const firstLetter = league.name[0].toUpperCase();
    if (!acc[firstLetter]) {
      acc[firstLetter] = [];
    }
    acc[firstLetter].push(league);
    return acc;
  }, {} as Record<string, League[]>);
}

