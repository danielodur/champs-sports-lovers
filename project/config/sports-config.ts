/**
 * Sport Configuration System
 * 
 * This file defines configurations for all supported sports in the app.
 * It provides a centralized, API-driven approach to handle different sports
 * without hardcoding sport-specific logic throughout the application.
 * 
 * Benefits:
 * - Easy to add new sports (just add config here)
 * - No hardcoded sport checks in components
 * - Consistent sport handling across the app
 * - Type-safe sport configurations
 */

export interface SportConfig {
  id: string;
  name: string;
  emoji: string;
  apiSport: string; // Identifier used for API calls
  stats: {
    primary: string[];    // Main stats to display prominently
    secondary: string[];  // Additional stats to show
  };
  matchStates: string[];
  detailTabs: string[];
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

/**
 * Complete sport configurations for Football and Basketball
 * Add more sports here as needed (Tennis, Cricket, Rugby, etc.)
 */
export const SPORTS_CONFIG: Record<string, SportConfig> = {
  football: {
    id: "football",
    name: "Football",
    emoji: "⚽",
    apiSport: "football",
    stats: {
      primary: [
        "possession",
        "shots",
        "shotsOnTarget",
        "corners",
      ],
      secondary: [
        "shotsOffTarget",
        "fouls",
        "yellowCards",
        "redCards",
        "offsides",
        "attacks",
        "dangerousAttacks",
      ]
    },
    matchStates: [
      "live",
      "fixture",
      "finished",
      "postponed",
      "cancelled",
      "halftime",
      "fulltime"
    ],
    detailTabs: [
      "live",
      "chat",
      "index",
      "plan",
      "hot",
      "data",
      "lineup",
      "member"
    ],
    colors: {
      primary: "#00A86B",   // Green
      secondary: "#FFD700",  // Gold
      accent: "#1E90FF",     // Blue
    }
  },
  
  basketball: {
    id: "basketball",
    name: "Basketball",
    emoji: "🏀",
    apiSport: "basketball",
    stats: {
      primary: [
        "points",
        "fieldGoals",
        "threePointers",
        "freeThrows",
      ],
      secondary: [
        "rebounds",
        "assists",
        "steals",
        "blocks",
        "turnovers",
        "fouls",
        "fieldGoalPercentage",
        "threePointPercentage",
      ]
    },
    matchStates: [
      "live",
      "fixture",
      "finished",
      "postponed",
      "cancelled",
      "quarter1",
      "quarter2",
      "quarter3",
      "quarter4",
      "overtime"
    ],
    detailTabs: [
      "live",
      "chat",
      "index",
      "plan",
      "hot",
      "data",
      "lineup",
      "member"
    ],
    colors: {
      primary: "#FF6B35",   // Orange
      secondary: "#FFA500",  // Bright Orange
      accent: "#FF4500",     // Red-Orange
    }
  }
};

/**
 * Get configuration for a specific sport
 * Falls back to football if sport is not found
 * 
 * @param sportId - The sport identifier (e.g., "football", "basketball")
 * @returns SportConfig for the requested sport
 */
export const getSportConfig = (sportId: string): SportConfig => {
  const config = SPORTS_CONFIG[sportId.toLowerCase()];
  
  if (!config) {
    console.warn(`⚠️ Sport "${sportId}" not found in config, falling back to football`);
    return SPORTS_CONFIG.football;
  }
  
  return config;
};

/**
 * Get statistics configuration for a specific sport
 * 
 * @param sportId - The sport identifier
 * @returns Object containing primary and secondary stats arrays
 */
export const getSportStats = (sportId: string) => {
  return getSportConfig(sportId).stats;
};

/**
 * Get all available sports configurations
 * Useful for generating dynamic sport tabs/selectors
 * 
 * @returns Array of all sport configurations
 */
export const getAllSports = (): SportConfig[] => {
  return Object.values(SPORTS_CONFIG);
};

/**
 * Get all available sport IDs
 * 
 * @returns Array of sport identifiers
 */
export const getAllSportIds = (): string[] => {
  return Object.keys(SPORTS_CONFIG);
};

/**
 * Check if a sport is supported
 * 
 * @param sportId - The sport identifier to check
 * @returns Boolean indicating if sport is supported
 */
export const isSportSupported = (sportId: string): boolean => {
  return sportId.toLowerCase() in SPORTS_CONFIG;
};

/**
 * Get sport colors for theming
 * 
 * @param sportId - The sport identifier
 * @returns Object containing color values
 */
export const getSportColors = (sportId: string) => {
  return getSportConfig(sportId).colors;
};

/**
 * Format stat label from camelCase to Title Case
 * 
 * @param stat - The stat key in camelCase
 * @returns Formatted stat label
 * 
 * @example
 * formatStatLabel("shotsOnTarget") // "Shots On Target"
 * formatStatLabel("yellowCards") // "Yellow Cards"
 */
export const formatStatLabel = (stat: string): string => {
  return stat
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, str => str.toUpperCase())
    .trim();
};

/**
 * Get user-friendly display name for a stat
 * Provides custom labels for specific stats
 * 
 * @param stat - The stat key
 * @param sportId - The sport identifier
 * @returns Display-friendly stat name
 */
export const getStatDisplayName = (stat: string, sportId: string = "football"): string => {
  // Sport-specific custom names
  const customNames: Record<string, Record<string, string>> = {
    football: {
      shotsOnTarget: "Shots on Target",
      shotsOffTarget: "Shots off Target",
      yellowCards: "Yellow Cards",
      redCards: "Red Cards",
      dangerousAttacks: "Dangerous Attacks",
    },
    basketball: {
      fieldGoals: "Field Goals",
      threePointers: "3-Pointers",
      freeThrows: "Free Throws",
      fieldGoalPercentage: "FG%",
      threePointPercentage: "3P%",
    }
  };
  
  const sportCustomNames = customNames[sportId] || {};
  return sportCustomNames[stat] || formatStatLabel(stat);
};

/**
 * Default export for convenience
 */
export default {
  SPORTS_CONFIG,
  getSportConfig,
  getSportStats,
  getAllSports,
  getAllSportIds,
  isSportSupported,
  getSportColors,
  formatStatLabel,
  getStatDisplayName,
};

