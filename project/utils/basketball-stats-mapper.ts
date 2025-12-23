/**
 * Basketball Stats Mapper
 * 
 * Maps API stats to basketball-specific statistics
 * Filters out football-specific stats and adds basketball-relevant ones
 */

export interface BasketballPlayerStats {
  // Basic stats
  appearances: number;
  points: number; // ✅ Basketball: Points scored (replaces goals)
  assists: number;
  minutesPlayed: number;
  
  // Basketball-specific shooting stats
  fieldGoalsMade?: number;
  fieldGoalsAttempted?: number;
  fieldGoalPercentage?: number;
  
  threePointersMade?: number;
  threePointersAttempted?: number;
  threePointPercentage?: number;
  
  freeThrowsMade?: number;
  freeThrowsAttempted?: number;
  freeThrowPercentage?: number;
  
  // Rebounding stats
  rebounds?: number;
  offensiveRebounds?: number;
  defensiveRebounds?: number;
  
  // Defensive stats
  steals?: number;
  blocks?: number;
  
  // Other stats
  turnovers?: number;
  fouls?: number;
  plusMinus?: number;
  
  // Advanced metrics (calculated)
  pointsPerGame?: number;
  reboundsPerGame?: number;
  assistsPerGame?: number;
  
  // ❌ NO FOOTBALL STATS (goals, yellowCards, redCards, tackles, etc.)
}

export interface FootballPlayerStats {
  appearances: number;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  minutesPlayed: number;
  passAccuracy: number;
  shotsOnTarget: number;
  tackles: number;
  interceptions: number;
}

/**
 * Maps generic API stats to basketball-specific stats
 * Filters out football-only fields
 */
export function mapToBasketballStats(apiStats: any): BasketballPlayerStats {
  console.log("🏀 [StatsMapper] Mapping API stats to basketball format");
  
  return {
    // Basic stats
    appearances: apiStats.games?.appearences || apiStats.appearances || 0,
    points: apiStats.points || apiStats.goals || 0, // ✅ Map goals → points for basketball
    assists: apiStats.assists || 0,
    minutesPlayed: apiStats.games?.minutes || apiStats.minutesPlayed || 0,
    
    // Shooting stats
    fieldGoalsMade: apiStats.fieldGoalsMade || apiStats.shots?.on || 0,
    fieldGoalsAttempted: apiStats.fieldGoalsAttempted || apiStats.shots?.total || 0,
    fieldGoalPercentage: calculatePercentage(
      apiStats.fieldGoalsMade || apiStats.shots?.on,
      apiStats.fieldGoalsAttempted || apiStats.shots?.total
    ),
    
    threePointersMade: apiStats.threePointersMade || 0,
    threePointersAttempted: apiStats.threePointersAttempted || 0,
    threePointPercentage: calculatePercentage(
      apiStats.threePointersMade,
      apiStats.threePointersAttempted
    ),
    
    freeThrowsMade: apiStats.freeThrowsMade || 0,
    freeThrowsAttempted: apiStats.freeThrowsAttempted || 0,
    freeThrowPercentage: calculatePercentage(
      apiStats.freeThrowsMade,
      apiStats.freeThrowsAttempted
    ),
    
    // Rebounding
    rebounds: apiStats.rebounds || apiStats.totalRebounds || 0,
    offensiveRebounds: apiStats.offensiveRebounds || 0,
    defensiveRebounds: apiStats.defensiveRebounds || 0,
    
    // Defense
    steals: apiStats.steals || 0,
    blocks: apiStats.blocks || 0,
    
    // Other
    turnovers: apiStats.turnovers || 0,
    fouls: apiStats.fouls || 0,
    plusMinus: apiStats.plusMinus || 0,
    
    // Averages (calculated)
    pointsPerGame: calculateAverage(
      apiStats.points || apiStats.goals || 0,
      apiStats.games?.appearences || apiStats.appearances || 0
    ),
    reboundsPerGame: calculateAverage(
      apiStats.rebounds || apiStats.totalRebounds || 0,
      apiStats.games?.appearences || apiStats.appearances || 0
    ),
    assistsPerGame: calculateAverage(
      apiStats.assists || 0,
      apiStats.games?.appearences || apiStats.appearances || 0
    ),
  };
}

/**
 * Maps generic API stats to football-specific stats
 */
export function mapToFootballStats(apiStats: any): FootballPlayerStats {
  console.log("⚽ [StatsMapper] Mapping API stats to football format");
  
  return {
    appearances: apiStats.games?.appearences || apiStats.appearances || 0,
    goals: apiStats.goals || 0,
    assists: apiStats.assists || 0,
    yellowCards: apiStats.cards?.yellow || apiStats.yellowCards || 0,
    redCards: apiStats.cards?.red || apiStats.redCards || 0,
    minutesPlayed: apiStats.games?.minutes || apiStats.minutesPlayed || 0,
    passAccuracy: apiStats.passes?.accuracy || apiStats.passAccuracy || 0,
    shotsOnTarget: apiStats.shots?.on || apiStats.shotsOnTarget || 0,
    tackles: apiStats.tackles?.total || apiStats.tackles || 0,
    interceptions: apiStats.tackles?.interceptions || apiStats.interceptions || 0,
  };
}

/**
 * Smart stat mapper - detects sport and maps appropriately
 */
export function mapPlayerStats(apiStats: any, sport: string = "football"): BasketballPlayerStats | FootballPlayerStats {
  if (sport === "basketball") {
    return mapToBasketballStats(apiStats);
  }
  return mapToFootballStats(apiStats);
}

/**
 * Check if stats object contains basketball-specific fields
 */
export function hasBasketballStats(stats: any): boolean {
  const basketballFields = [
    'points', 'rebounds', 'steals', 'blocks', 'turnovers',
    'fieldGoalsMade', 'threePointersMade', 'freeThrowsMade'
  ];
  
  return basketballFields.some(field => stats[field] !== undefined && stats[field] !== null);
}

/**
 * Check if stats object contains football-specific fields
 */
export function hasFootballStats(stats: any): boolean {
  const footballFields = [
    'goals', 'yellowCards', 'redCards', 'tackles', 'passAccuracy'
  ];
  
  return footballFields.some(field => stats[field] !== undefined && stats[field] !== null);
}

// Helper functions
function calculatePercentage(made?: number, attempted?: number): number {
  if (!made || !attempted || attempted === 0) return 0;
  return Math.round((made / attempted) * 100 * 10) / 10; // Round to 1 decimal
}

function calculateAverage(total?: number, games?: number): number {
  if (!total || !games || games === 0) return 0;
  return Math.round((total / games) * 10) / 10; // Round to 1 decimal
}

/**
 * Get stat display name based on sport
 */
export function getStatDisplayName(statKey: string, sport: string): string {
  if (sport === "basketball") {
    const basketballNames: Record<string, string> = {
      'appearances': 'Games',
      'points': 'Points',
      'assists': 'Assists',
      'rebounds': 'Rebounds',
      'steals': 'Steals',
      'blocks': 'Blocks',
      'turnovers': 'Turnovers',
      'fouls': 'Fouls',
      'fieldGoalPercentage': 'FG%',
      'threePointPercentage': '3P%',
      'freeThrowPercentage': 'FT%',
      'minutesPlayed': 'Minutes',
    };
    return basketballNames[statKey] || statKey;
  }
  
  // Football
  const footballNames: Record<string, string> = {
    'appearances': 'Appearances',
    'goals': 'Goals',
    'assists': 'Assists',
    'yellowCards': 'Yellow Cards',
    'redCards': 'Red Cards',
    'passAccuracy': 'Pass Accuracy',
    'shotsOnTarget': 'Shots on Target',
    'tackles': 'Tackles',
    'interceptions': 'Interceptions',
    'minutesPlayed': 'Minutes',
  };
  return footballNames[statKey] || statKey;
}

console.log("🏀⚽ [BasketballStatsMapper] Initialized - Ready to map sport-specific stats");
