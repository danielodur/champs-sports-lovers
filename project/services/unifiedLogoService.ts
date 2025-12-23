/**
 * Unified Logo Service
 * 
 * Provides team and league logos for multiple sports (football, basketball, etc.)
 * Falls back to existing services and provides placeholder logos when needed
 */

import teamLogoService from "./teamLogoService";
import leagueLogoService from "./leagueLogoService";

class UnifiedLogoService {
  // Basketball team logos (can be expanded with real URLs)
  private basketballTeams: Record<string, string> = {
    "Los Angeles Lakers": "https://cdn.nba.com/logos/nba/1610612747/primary/L/logo.svg",
    "Boston Celtics": "https://cdn.nba.com/logos/nba/1610612738/primary/L/logo.svg",
    "Golden State Warriors": "https://cdn.nba.com/logos/nba/1610612744/primary/L/logo.svg",
    "Chicago Bulls": "https://cdn.nba.com/logos/nba/1610612741/primary/L/logo.svg",
    "Miami Heat": "https://cdn.nba.com/logos/nba/1610612748/primary/L/logo.svg",
    "Brooklyn Nets": "https://cdn.nba.com/logos/nba/1610612751/primary/L/logo.svg",
    "Phoenix Suns": "https://cdn.nba.com/logos/nba/1610612756/primary/L/logo.svg",
    "Milwaukee Bucks": "https://cdn.nba.com/logos/nba/1610612749/primary/L/logo.svg",
    // Add more teams as needed
  };
  
  // Basketball league logos
  private basketballLeagues: Record<string, string> = {
    "NBA": "https://cdn.nba.com/logos/leagues/logo-nba.svg",
    "EuroLeague": "https://www.euroleague.net/rs/images/logo.png",
    "CBA": "https://upload.wikimedia.org/wikipedia/en/thumb/6/6a/Chinese_Basketball_Association.svg/200px-Chinese_Basketball_Association.svg.png",
    "ACB": "https://upload.wikimedia.org/wikipedia/en/thumb/4/4b/Liga_ACB_logo.svg/200px-Liga_ACB_logo.svg.png",
    // Add more leagues as needed
  };
  
  /**
   * Get team logo based on sport
   * 
   * @param teamName - Name of the team
   * @param sport - Sport identifier (football, basketball, etc.)
   * @returns URL to team logo
   */
  getTeamLogo(teamName: string, sport: string = "football"): string {
    if (sport === "basketball") {
      // Check if we have a specific basketball team logo
      const basketballLogo = this.basketballTeams[teamName];
      if (basketballLogo) {
        return basketballLogo;
      }
      
      // Fallback to generated logo for basketball
      return this.getDefaultLogo(teamName, "🏀");
    }
    
    // For football, use existing service
    if (sport === "football") {
      return teamLogoService.getTeamLogo(teamName);
    }
    
    // Default fallback for any other sport
    return this.getDefaultLogo(teamName);
  }
  
  /**
   * Get league logo based on sport
   * 
   * @param leagueName - Name of the league
   * @param sport - Sport identifier (football, basketball, etc.)
   * @returns URL to league logo
   */
  getLeagueLogo(leagueName: string, sport: string = "football"): string {
    if (sport === "basketball") {
      // Check if we have a specific basketball league logo
      const basketballLogo = this.basketballLeagues[leagueName];
      if (basketballLogo) {
        return basketballLogo;
      }
      
      // Fallback to generated logo for basketball
      return this.getDefaultLogo(leagueName, "🏀");
    }
    
    // For football, use existing service
    if (sport === "football") {
      return leagueLogoService.getLeagueLogo(leagueName);
    }
    
    // Default fallback for any other sport
    return this.getDefaultLogo(leagueName);
  }
  
  /**
   * Generate a default logo using UI Avatars
   * 
   * @param name - Team or league name
   * @param emoji - Optional emoji to include in the avatar
   * @returns URL to generated avatar
   */
  private getDefaultLogo(name: string, emoji?: string): string {
    const encodedName = encodeURIComponent(emoji ? `${emoji} ${name}` : name);
    return `https://ui-avatars.com/api/?name=${encodedName}&background=random&color=fff&size=80&bold=true`;
  }
  
  /**
   * Add custom basketball team logo
   * Useful for dynamically adding teams from API responses
   * 
   * @param teamName - Name of the team
   * @param logoUrl - URL to the logo
   */
  addBasketballTeam(teamName: string, logoUrl: string): void {
    this.basketballTeams[teamName] = logoUrl;
  }
  
  /**
   * Add custom basketball league logo
   * 
   * @param leagueName - Name of the league
   * @param logoUrl - URL to the logo
   */
  addBasketballLeague(leagueName: string, logoUrl: string): void {
    this.basketballLeagues[leagueName] = logoUrl;
  }
  
  /**
   * Bulk add basketball teams
   * Useful when receiving multiple teams from API
   * 
   * @param teams - Record of team name to logo URL
   */
  bulkAddBasketballTeams(teams: Record<string, string>): void {
    Object.assign(this.basketballTeams, teams);
  }
  
  /**
   * Get all basketball teams
   * 
   * @returns Record of team names to logo URLs
   */
  getBasketballTeams(): Record<string, string> {
    return { ...this.basketballTeams };
  }
  
  /**
   * Get all basketball leagues
   * 
   * @returns Record of league names to logo URLs
   */
  getBasketballLeagues(): Record<string, string> {
    return { ...this.basketballLeagues };
  }
}

// Export singleton instance
export default new UnifiedLogoService();

