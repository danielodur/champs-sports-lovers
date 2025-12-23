/**
 * League Ranking Utility
 * 
 * Determines the official rank/popularity of leagues within a country
 * to ensure proper sorting by importance (top-tier leagues first)
 */

import { LeagueData } from "../services/leaguesByRegionService";

/**
 * Calculate league rank based on name patterns and type
 * Lower rank number = higher priority (1 = most popular, 100 = least popular)
 */
export function getLeagueRank(league: LeagueData): number {
  const name = league.name.toLowerCase();
  const type = league.type?.toLowerCase() || "";
  
  // ✅ Tier 1: Top-tier premier leagues (highest priority)
  if (
    name.includes("premier league") ||
    name.includes("premier l") ||
    name.match(/^premier\s+league/i) ||
    name.includes("la liga") ||
    name.includes("serie a") ||
    name.includes("bundesliga") ||
    name.includes("ligue 1") ||
    name.includes("ligue-1") ||
    name.includes("eredivisie") ||
    name.includes("primeira liga") ||
    name.includes("super lig") ||
    name.includes("superliga") ||
    name.includes("j1 league") ||
    name.includes("j.league") ||
    name.includes("k-league 1") ||
    name.includes("k league 1") ||
    name.includes("chinese super league") ||
    name.includes("a-league") ||
    name.includes("mls") ||
    name.includes("brasileirão") ||
    name.includes("brasileirao") ||
    name.includes("primera división") ||
    name.includes("primera division") ||
    name.includes("serie a") ||
    name.match(/^1\.?\s*bundesliga/i) ||
    name.match(/^1\.?\s*division/i) ||
    name.match(/^first\s+division/i) ||
    name.match(/^1st\s+division/i) ||
    name.includes("top division") ||
    name.includes("first tier") ||
    name.includes("top tier")
  ) {
    return 1;
  }
  
  // ✅ Tier 2: Second division leagues
  if (
    name.includes("championship") ||
    name.includes("2. bundesliga") ||
    name.includes("2nd bundesliga") ||
    name.includes("second division") ||
    name.includes("2nd division") ||
    name.match(/^2\.?\s*division/i) ||
    name.includes("segunda división") ||
    name.includes("segunda division") ||
    name.includes("serie b") ||
    name.includes("ligue 2") ||
    name.includes("ligue-2") ||
    name.includes("j2 league") ||
    name.includes("k-league 2") ||
    name.includes("second tier") ||
    name.includes("2nd tier")
  ) {
    return 2;
  }
  
  // ✅ Tier 3: Third division leagues
  if (
    name.includes("league one") ||
    name.includes("league 1") ||
    name.includes("3. bundesliga") ||
    name.includes("3rd bundesliga") ||
    name.includes("third division") ||
    name.includes("3rd division") ||
    name.match(/^3\.?\s*division/i) ||
    name.includes("tercera división") ||
    name.includes("tercera division") ||
    name.includes("serie c") ||
    name.includes("j3 league") ||
    name.includes("third tier") ||
    name.includes("3rd tier")
  ) {
    return 3;
  }
  
  // ✅ Tier 4: Fourth division and lower
  if (
    name.includes("league two") ||
    name.includes("league 2") ||
    name.includes("fourth division") ||
    name.includes("4th division") ||
    name.match(/^4\.?\s*division/i) ||
    name.includes("fourth tier") ||
    name.includes("4th tier") ||
    name.match(/^[5-9]\.?\s*division/i) ||
    name.match(/^[5-9]th\s+division/i)
  ) {
    return 4;
  }
  
  // ✅ Tier 5: National leagues (generic)
  if (
    name.includes("national league") ||
    name.includes("national") ||
    name.includes("liga nacional") ||
    name.includes("super league") ||
    name.includes("superliga") ||
    name.includes("pro league") ||
    name.includes("professional league")
  ) {
    return 5;
  }
  
  // ✅ Tier 6: Cups and tournaments (lower priority than leagues)
  if (type === "cup" || type === "tournament") {
    // Major cups (FA Cup, Copa del Rey, etc.) get higher priority
    if (
      name.includes("fa cup") ||
      name.includes("copa del rey") ||
      name.includes("coppa italia") ||
      name.includes("dfb pokal") ||
      name.includes("coupe de france") ||
      name.includes("champions league") ||
      name.includes("europa league") ||
      name.includes("world cup") ||
      name.includes("euro") ||
      name.includes("afcon") ||
      name.includes("copa america")
    ) {
      return 6;
    }
    // Other cups
    return 7;
  }
  
  // ✅ Tier 8: League type but no specific pattern (generic leagues)
  if (type === "league") {
    return 8;
  }
  
  // ✅ Tier 9: Everything else (lowest priority)
  return 9;
}

/**
 * Sort leagues by official rank within a country
 * Higher priority leagues appear first
 */
export function sortLeaguesByRank(leagues: LeagueData[]): LeagueData[] {
  return [...leagues].sort((a, b) => {
    const rankA = getLeagueRank(a);
    const rankB = getLeagueRank(b);
    
    // First sort by rank (lower number = higher priority)
    if (rankA !== rankB) {
      return rankA - rankB;
    }
    
    // If same rank, prioritize League type over Cup
    if (a.type === "League" && b.type !== "League") {
      return -1;
    }
    if (a.type !== "League" && b.type === "League") {
      return 1;
    }
    
    // If same rank and type, sort alphabetically
    return a.name.localeCompare(b.name);
  });
}

/**
 * Sort leagues grouped by country
 * Each country's leagues are sorted by rank
 */
export function sortLeaguesByCountryRank(
  leaguesByCountry: Record<string, LeagueData[]>
): Record<string, LeagueData[]> {
  const sorted: Record<string, LeagueData[]> = {};
  
  Object.entries(leaguesByCountry).forEach(([country, leagues]) => {
    sorted[country] = sortLeaguesByRank(leagues);
  });
  
  return sorted;
}
