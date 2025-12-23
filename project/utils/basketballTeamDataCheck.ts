/**
 * Basketball Team Data Validation Utility
 * 
 * Checks if a basketball team has API data before allowing navigation.
 * This prevents users from accessing empty team-details screens for teams
 * without API coverage.
 * 
 * Football teams always return true (good API coverage).
 */

import { teamDetailsApi } from "@/services/teamDetailsApiService";

export interface TeamDataCheckResult {
  hasData: boolean;
  teamName?: string;
  teamId?: string;
}

/**
 * Check if a team has API data available
 * 
 * @param teamId - Team ID (optional)
 * @param teamName - Team name (optional)
 * @param sport - Sport type ("football" | "basketball")
 * @returns Promise<boolean> - true if team has data or is football, false otherwise
 */
export const checkTeamHasData = async (
  teamId?: string | number,
  teamName?: string,
  sport?: string
): Promise<boolean> => {
  // Football teams generally have good data coverage, allow navigation
  if (sport !== "basketball") {
    return true;
  }

  // Basketball: Check if team has API data - 100% determined by API
  if (!teamId && !teamName) {
    return false;
  }

  try {
    console.log(`🏀 [checkTeamHasData] Checking data availability for ${teamName} (ID: ${teamId})`);
    
    // Try to fetch basic team info to verify team exists in API
    const teamData = await teamDetailsApi.getTeamInfo(
      teamName || "",
      typeof teamId === "string" ? parseInt(teamId) : teamId,
      undefined // leagueId - not needed for this check
    );

    const hasData = teamData !== null && (
      teamData.id !== undefined || 
      teamData.name !== undefined
    );

    console.log(`🏀 [checkTeamHasData] Result for ${teamName}: ${hasData ? '✅ HAS DATA' : '❌ NO DATA'}`);
    return hasData;
  } catch (error) {
    console.error(`❌ [checkTeamHasData] Error checking team data:`, error);
    // On error, allow navigation (API might be temporarily down)
    return true;
  }
};
