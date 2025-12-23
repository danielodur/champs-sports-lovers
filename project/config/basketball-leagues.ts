/**
 * Basketball Leagues Configuration
 * 
 * This file contains all basketball league IDs and configurations
 * for API-Sports.io Basketball API
 * 
 * API Documentation: https://www.api-football.com/documentation-v3#tag/Basketball
 */

export interface BasketballLeague {
  id: number;           // API-Sports Basketball league ID
  name: string;
  country: string;
  type: 'league' | 'cup' | 'international';
  tier: number;
  isActive: boolean;
  season: string;
}

/**
 * Major Basketball Leagues
 * League IDs are from API-Sports.io Basketball API
 */
export const BASKETBALL_LEAGUES: Record<string, BasketballLeague> = {
  // ===== NORTH AMERICA =====
  NBA: {
    id: 12,                    // NBA league ID in API-Sports Basketball
    name: "NBA",
    country: "USA",
    type: 'league',
    tier: 1,
    isActive: true,
    season: "2024-2025",
  },
  
  WNBA: {
    id: 16,                    // WNBA league ID
    name: "WNBA",
    country: "USA",
    type: 'league',
    tier: 1,
    isActive: true,
    season: "2024",
  },
  
  NCAA_MEN: {
    id: 127,                   // NCAA Men's Basketball
    name: "NCAA Men",
    country: "USA",
    type: 'league',
    tier: 1,
    isActive: true,
    season: "2024-2025",
  },
  
  G_LEAGUE: {
    id: 123,                   // G League
    name: "G League",
    country: "USA",
    type: 'league',
    tier: 2,
    isActive: true,
    season: "2024-2025",
  },

  // ===== EUROPE =====
  EUROLEAGUE: {
    id: 120,                   // EuroLeague
    name: "EuroLeague",
    country: "Europe",
    type: 'international',
    tier: 1,
    isActive: true,
    season: "2024-2025",
  },
  
  EUROCUP: {
    id: 121,                   // EuroCup
    name: "EuroCup",
    country: "Europe",
    type: 'international',
    tier: 2,
    isActive: true,
    season: "2024-2025",
  },
  
  SPAIN_ACB: {
    id: 144,                   // Spanish ACB League
    name: "Liga ACB",
    country: "Spain",
    type: 'league',
    tier: 1,
    isActive: true,
    season: "2024-2025",
  },
  
  GERMANY_BBL: {
    id: 146,                   // German Basketball Bundesliga
    name: "BBL",
    country: "Germany",
    type: 'league',
    tier: 1,
    isActive: true,
    season: "2024-2025",
  },
  
  FRANCE_LNB: {
    id: 140,                   // French LNB Pro A
    name: "LNB Pro A",
    country: "France",
    type: 'league',
    tier: 1,
    isActive: true,
    season: "2024-2025",
  },
  
  ITALY_LEGA_A: {
    id: 142,                   // Italian Lega Basket Serie A
    name: "Lega Basket Serie A",
    country: "Italy",
    type: 'league',
    tier: 1,
    isActive: true,
    season: "2024-2025",
  },
  
  TURKEY_BSL: {
    id: 148,                   // Turkish Basketball Super League
    name: "BSL",
    country: "Turkey",
    type: 'league',
    tier: 1,
    isActive: true,
    season: "2024-2025",
  },

  // ===== ASIA & OCEANIA =====
  CHINA_CBA: {
    id: 132,                   // Chinese Basketball Association
    name: "CBA",
    country: "China",
    type: 'league',
    tier: 1,
    isActive: true,
    season: "2024-2025",
  },
  
  AUSTRALIA_NBL: {
    id: 136,                   // Australian NBL
    name: "NBL",
    country: "Australia",
    type: 'league',
    tier: 1,
    isActive: true,
    season: "2024-2025",
  },
  
  JAPAN_B_LEAGUE: {
    id: 138,                   // Japanese B.League
    name: "B.League",
    country: "Japan",
    type: 'league',
    tier: 1,
    isActive: true,
    season: "2024-2025",
  },
  
  KOREA_KBL: {
    id: 134,                   // Korean Basketball League
    name: "KBL",
    country: "South Korea",
    type: 'league',
    tier: 1,
    isActive: true,
    season: "2024-2025",
  },

  // ===== INTERNATIONAL =====
  FIBA_WORLD_CUP: {
    id: 1,                     // FIBA Basketball World Cup
    name: "FIBA World Cup",
    country: "International",
    type: 'international',
    tier: 1,
    isActive: false,           // Only during tournament years
    season: "2023",
  },
  
  OLYMPICS: {
    id: 2,                     // Olympic Basketball
    name: "Olympics",
    country: "International",
    type: 'international',
    tier: 1,
    isActive: false,           // Only during Olympic years
    season: "2024",
  },
};

/**
 * Get all basketball league IDs as an array
 * Useful for fetching matches from multiple leagues
 */
export const getAllBasketballLeagueIds = (): number[] => {
  return Object.values(BASKETBALL_LEAGUES).map(league => league.id);
};

/**
 * Get active basketball league IDs
 * Filters out inactive/seasonal leagues
 */
export const getActiveBasketballLeagueIds = (): number[] => {
  return Object.values(BASKETBALL_LEAGUES)
    .filter(league => league.isActive)
    .map(league => league.id);
};

/**
 * Get basketball league by ID
 */
export const getBasketballLeagueById = (id: number): BasketballLeague | undefined => {
  return Object.values(BASKETBALL_LEAGUES).find(league => league.id === id);
};

/**
 * Get basketball league by name
 */
export const getBasketballLeagueByName = (name: string): BasketballLeague | undefined => {
  return Object.values(BASKETBALL_LEAGUES).find(
    league => league.name.toLowerCase() === name.toLowerCase()
  );
};

/**
 * Priority leagues for fetching (most popular first)
 */
export const PRIORITY_BASKETBALL_LEAGUES = [
  BASKETBALL_LEAGUES.NBA.id,
  BASKETBALL_LEAGUES.EUROLEAGUE.id,
  BASKETBALL_LEAGUES.CHINA_CBA.id,
  BASKETBALL_LEAGUES.SPAIN_ACB.id,
  BASKETBALL_LEAGUES.AUSTRALIA_NBL.id,
];

export default {
  BASKETBALL_LEAGUES,
  getAllBasketballLeagueIds,
  getActiveBasketballLeagueIds,
  getBasketballLeagueById,
  getBasketballLeagueByName,
  PRIORITY_BASKETBALL_LEAGUES,
};

