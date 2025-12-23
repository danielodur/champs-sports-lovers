/**
 * Basketball-specific utility functions for parsing and formatting game data
 */

import { Fixture } from "../../../types/football-fixtures-response";
import { formatMatchTime } from "../../../utils/timeUtils";

export interface BasketballQuarters {
  home: (number | null)[];
  away: (number | null)[];
}

/**
 * Extract quarter scores from basketball fixture data
 * Basketball API provides scores in quarters (Q1, Q2, Q3, Q4, OT)
 */
export function extractBasketballQuarters(fixture: Fixture): BasketballQuarters {
  // Default: 4 quarters (null if not available)
  const quarters: BasketballQuarters = {
    home: [null, null, null, null],
    away: [null, null, null, null],
  };

  // Try to get quarter scores from the API data
  // Basketball API structure: game.scores.home.quarter_1, quarter_2, etc.
  const scores = (fixture as any).scores;
  
  if (scores) {
    // Extract home quarters
    quarters.home[0] = scores.home?.quarter_1 ?? null;
    quarters.home[1] = scores.home?.quarter_2 ?? null;
    quarters.home[2] = scores.home?.quarter_3 ?? null;
    quarters.home[3] = scores.home?.quarter_4 ?? null;

    // Extract away quarters
    quarters.away[0] = scores.away?.quarter_1 ?? null;
    quarters.away[1] = scores.away?.quarter_2 ?? null;
    quarters.away[2] = scores.away?.quarter_3 ?? null;
    quarters.away[3] = scores.away?.quarter_4 ?? null;

    // Add overtime if exists
    if (scores.home?.over_time !== null || scores.away?.over_time !== null) {
      quarters.home.push(scores.home?.over_time ?? null);
      quarters.away.push(scores.away?.over_time ?? null);
    }
  }

  return quarters;
}

/**
 * Get formatted quarter display text
 * Maps API status codes to display text
 */
export function getBasketballQuarterText(statusShort: string): string {
  const quarterMap: { [key: string]: string } = {
    Q1: "1st Quarter",
    Q2: "2nd Quarter",
    Q3: "3rd Quarter",
    Q4: "4th Quarter",
    OT: "Overtime",
    HT: "Halftime",
    FT: "FT",
    NS: "NS",
    TBD: "TBD",
    PST: "PST",
    AOT: "FT", // After Overtime -> show as FT
  };

  return quarterMap[statusShort] || statusShort;
}

/**
 * Check if fixture has valid quarter data
 */
export function hasQuarterData(quarters: BasketballQuarters): boolean {
  return (
    quarters.home.some((q) => q !== null) ||
    quarters.away.some((q) => q !== null)
  );
}

/**
 * Calculate point difference
 */
export function calculatePointDifference(
  homeScore: number | null,
  awayScore: number | null
): number | null {
  if (homeScore === null || awayScore === null) return null;
  return Math.abs(homeScore - awayScore);
}

/**
 * Calculate total combined score
 */
export function calculateTotalScore(
  homeScore: number | null,
  awayScore: number | null
): number | null {
  if (homeScore === null || awayScore === null) return null;
  return homeScore + awayScore;
}

/**
 * Get basketball match status type
 */
export function getBasketballMatchStatus(
  statusShort: string
): "live" | "finished" | "upcoming" {
  const liveStatuses = ["LIVE", "Q1", "Q2", "Q3", "Q4", "OT", "HT", "BT"]; // ✅ ADDED: "LIVE" for generic live status
  const finishedStatuses = ["FT", "AOT"];
  const upcomingStatuses = ["NS", "TBD", "PST"];

  if (liveStatuses.includes(statusShort)) return "live";
  if (finishedStatuses.includes(statusShort)) return "finished";
  if (upcomingStatuses.includes(statusShort)) return "upcoming";

  return "upcoming"; // Default
}

/**
 * Format match time for basketball (elapsed time in quarter)
 */
export function formatBasketballMatchTime(
  statusShort: string,
  elapsed: number | null
): string {
  // For live matches, show quarter and time
  if (["Q1", "Q2", "Q3", "Q4", "OT"].includes(statusShort)) {
    if (elapsed !== null) {
      const minutes = Math.floor(elapsed / 60);
      const seconds = elapsed % 60;
      return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }
  }
  return "";
}

/**
 * Convert ISO date string to device's local timezone in 24-hour format
 * Now uses centralized utility for consistency
 */
function convertToLocalTime(isoDateString: string | undefined | null): string {
  return formatMatchTime(isoDateString);
}

/**
 * Convert Fixture to Basketball Match Item format
 */
export function convertFixtureToBasketballMatch(
  fixture: Fixture,
  isFavorite: boolean = false
) {
  const quarters = extractBasketballQuarters(fixture);
  const status = getBasketballMatchStatus(fixture.fixture.status?.short || "NS");
  
  // ✅ BASKETBALL FIX: Use basketball-specific scores, not football goals
  // Basketball API uses scores.home.total and scores.away.total
  const scores = (fixture as any).scores;
  const homeScore = scores?.home?.total ?? null;
  const awayScore = scores?.away?.total ?? null;
  
  // ✅ TIMEZONE FIX: Convert match start time to device's local timezone for display
  // ✅ VALIDATION: Always provide a valid value, never undefined to prevent NaN:NaN
  const localStartTime = fixture.fixture.date 
    ? convertToLocalTime(fixture.fixture.date)
    : "--:--"; // Placeholder instead of undefined
  
  // ✅ NAVIGATION FIX: Keep original ISO timestamp for navigation params
  const fullStartTime = fixture.fixture.date || new Date().toISOString();
  
  return {
    id: fixture.fixture.id.toString(),
    homeTeam: fixture.teams.home?.name || "Home Team",
    awayTeam: fixture.teams.away?.name || "Away Team",
    homeScore: homeScore,
    awayScore: awayScore,
    // ✅ NAVIGATION FIX: Include team logos for match-details navigation
    homeLogo: fixture.teams.home?.logo || undefined,
    awayLogo: fixture.teams.away?.logo || undefined,
    status,
    statusText: fixture.fixture.status?.short || "NS",
    matchTime: formatBasketballMatchTime(
      fixture.fixture.status?.short || "NS",
      fixture.fixture.status?.elapsed ?? null
    ),
    // ✅ CRITICAL: Add raw elapsed value for match-details navigation
    elapsed: fixture.fixture.status?.elapsed ?? null,
    // ✅ Display time in device's local timezone (24-hour format like "15:30")
    startTime: localStartTime,
    // ✅ CRITICAL: Full ISO timestamp for navigation/countdown (prevents NaN:NaN)
    fullStartTime: fullStartTime,
    leagueName: fixture.league?.name || undefined,
    leagueLogo: fixture.league?.logo || undefined,
    isFavorite,
    quarters: hasQuarterData(quarters) ? quarters : undefined,
  };
}

