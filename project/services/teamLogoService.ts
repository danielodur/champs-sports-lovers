// Minimal Team Logo Service - Just returns logos from match data
// This replaces the complex logo service with a simple one that uses API Sports logos

import { Match } from "@/types/match";

class SimpleTeamLogoService {
  /**
   * Get team logo from match data (API Sports already provides this)
   */
  getOfficialTeamLogo(teamName: string, league?: string): string {
    // Return a default logo - the actual logo should come from the match data
    // This is just a fallback for when the match data doesn't have a logo
    return "https://a.espncdn.com/i/teamlogos/soccer/500/default.png";
  }

  /**
   * Get team logo from match data
   */
  getTeamLogo(teamName: string, league?: string): string {
    // Return a default logo - the actual logo should come from the match data
    return "https://a.espncdn.com/i/teamlogos/soccer/500/default.png";
  }

  /**
   * Simple match enhancement - just return the match as-is since logos are already there
   */
  enhanceMatchWithLogos(match: Match): Match {
    // No enhancement needed - API Sports already provides logos
    return match;
  }

  /**
   * Get guaranteed official logo - return default since logos come from API Sports
   */
  async getGuaranteedOfficialLogo(
    teamName: string,
    league?: string
  ): Promise<string> {
    return "https://a.espncdn.com/i/teamlogos/soccer/500/default.png";
  }
}

// Export singleton instance
const teamLogoService = new SimpleTeamLogoService();
export default teamLogoService;
