/**
 * Enhanced Team Color Service
 * Provides intelligent team color detection with multiple fallback strategies
 * Integrates with existing teamLogoService and API data
 */

interface TeamColors {
  primary: string;
  secondary: string;
  logo: string;
}

interface TeamInfo {
  colors?: {
    primary?: string;
    secondary?: string;
  };
  code?: string;
  name?: string;
}

class TeamColorService {
  private static instance: TeamColorService;
  
  // Comprehensive team color database
  private readonly teamColorDatabase: Record<string, TeamColors> = {
    // Spanish La Liga
    "Real Madrid": { primary: "#FEBE10", secondary: "#00529F", logo: "RM" },
    Barcelona: { primary: "#004D98", secondary: "#EDBB00", logo: "BAR" },
    Villarreal: { primary: "#FFFF01", secondary: "#005F99", logo: "VIL" },
    "Atletico Madrid": { primary: "#CE2029", secondary: "#244474", logo: "ATM" },
    Sevilla: { primary: "#D41E2C", secondary: "#FFFFFF", logo: "SEV" },
    Valencia: { primary: "#EE7707", secondary: "#000000", logo: "VAL" },
    "Athletic Bilbao": { primary: "#E21E20", secondary: "#FFFFFF", logo: "ATH" },
    "Real Sociedad": { primary: "#003399", secondary: "#FFFFFF", logo: "RSO" },
    "Real Betis": { primary: "#00954C", secondary: "#FFFFFF", logo: "BET" },
    Getafe: { primary: "#005CA9", secondary: "#FFFFFF", logo: "GET" },
    "Celta Vigo": { primary: "#87CEEB", secondary: "#FFFFFF", logo: "CEL" },
    Granada: { primary: "#B41E2F", secondary: "#FFFFFF", logo: "GRA" },

    // Uganda Premier League
    "Vipers SC": { primary: "#4CAF50", secondary: "#2E7D32", logo: "VS" },
    "KCCA FC": { primary: "#FFD700", secondary: "#0066CC", logo: "KC" },
    "SC Villa": { primary: "#800080", secondary: "#FFD700", logo: "VIL" },
    "Express FC": { primary: "#FF0000", secondary: "#FFFFFF", logo: "EXP" },
    "URA FC": { primary: "#FFA500", secondary: "#000000", logo: "URA" },
    "BUL FC": { primary: "#FF4500", secondary: "#FFFFFF", logo: "BUL" },
    "NEC FC": { primary: "#FF8C00", secondary: "#FFFFFF", logo: "NEC" },

    // English Premier League
    "Manchester United": { primary: "#DA020E", secondary: "#FFE500", logo: "MUN" },
    "Manchester City": { primary: "#6CABDD", secondary: "#FFFFFF", logo: "MCI" },
    Liverpool: { primary: "#C8102E", secondary: "#F6EB61", logo: "LIV" },
    Chelsea: { primary: "#034694", secondary: "#FFFFFF", logo: "CHE" },
    Arsenal: { primary: "#EF0107", secondary: "#9C824A", logo: "ARS" },
    Tottenham: { primary: "#132257", secondary: "#FFFFFF", logo: "TOT" },
    Leicester: { primary: "#003090", secondary: "#FFFFFF", logo: "LEI" },
    "West Ham": { primary: "#7A263A", secondary: "#FFFFFF", logo: "WHU" },
    Everton: { primary: "#003399", secondary: "#FFFFFF", logo: "EVE" },
    Newcastle: { primary: "#000000", secondary: "#FFFFFF", logo: "NEW" },

    // Italian Serie A
    Juventus: { primary: "#000000", secondary: "#FFFFFF", logo: "JUV" },
    "AC Milan": { primary: "#FB090B", secondary: "#000000", logo: "MIL" },
    "Inter Milan": { primary: "#0068B5", secondary: "#000000", logo: "INT" },
    Roma: { primary: "#C8102E", secondary: "#FFD700", logo: "ROM" },
    Napoli: { primary: "#87CEEB", secondary: "#FFFFFF", logo: "NAP" },
    Lazio: { primary: "#87CEEB", secondary: "#FFFFFF", logo: "LAZ" },

    // German Bundesliga
    "Bayern Munich": { primary: "#DC052D", secondary: "#FFFFFF", logo: "BAY" },
    "Borussia Dortmund": { primary: "#FDE100", secondary: "#000000", logo: "BVB" },
    "RB Leipzig": { primary: "#DC143C", secondary: "#FFFFFF", logo: "RBL" },
    "Bayer Leverkusen": { primary: "#E32221", secondary: "#000000", logo: "B04" },
    Schalke: { primary: "#004D9F", secondary: "#FFFFFF", logo: "S04" },

    // French Ligue 1
    PSG: { primary: "#004170", secondary: "#FFFFFF", logo: "PSG" },
    "Paris Saint-Germain": { primary: "#004170", secondary: "#FFFFFF", logo: "PSG" },
    Marseille: { primary: "#009ADA", secondary: "#FFFFFF", logo: "OM" },
    Monaco: { primary: "#DC143C", secondary: "#FFFFFF", logo: "MON" },
    Lyon: { primary: "#002E5D", secondary: "#FFFFFF", logo: "OL" },

    // International Teams (from screenshots)
    Iceland: { primary: "#0048E0", secondary: "#FFFFFF", logo: "ISL" },
    Norway: { primary: "#C8102E", secondary: "#FFFFFF", logo: "NOR" },
    Ukraine: { primary: "#FFD700", secondary: "#0057B7", logo: "UKR" },
    France: { primary: "#0055A4", secondary: "#FFFFFF", logo: "FRA" },
    Cameroon: { primary: "#00A651", secondary: "#CE1126", logo: "CMR" },
    Nigeria: { primary: "#00A651", secondary: "#FFFFFF", logo: "NGA" },

    // Additional teams from screenshots
    "Chornomorets II": { primary: "#E53935", secondary: "#FFFFFF", logo: "CHO" },
    Chayka: { primary: "#1976D2", secondary: "#FFFFFF", logo: "CHA" },
  };

  // Dynamic color palette for unknown teams
  private readonly dynamicColorPalette: TeamColors[] = [
    { primary: "#E53935", secondary: "#FFFFFF", logo: "FC" }, // Red
    { primary: "#1976D2", secondary: "#FFFFFF", logo: "FC" }, // Blue  
    { primary: "#388E3C", secondary: "#FFFFFF", logo: "FC" }, // Green
    { primary: "#F57C00", secondary: "#FFFFFF", logo: "FC" }, // Orange
    { primary: "#7B1FA2", secondary: "#FFFFFF", logo: "FC" }, // Purple
    { primary: "#00796B", secondary: "#FFFFFF", logo: "FC" }, // Teal
    { primary: "#5D4037", secondary: "#FFFFFF", logo: "FC" }, // Brown
    { primary: "#455A64", secondary: "#FFFFFF", logo: "FC" }, // Blue Grey
    { primary: "#C2185B", secondary: "#FFFFFF", logo: "FC" }, // Pink
    { primary: "#FF5722", secondary: "#FFFFFF", logo: "FC" }, // Deep Orange
    { primary: "#795548", secondary: "#FFFFFF", logo: "FC" }, // Brown
    { primary: "#607D8B", secondary: "#FFFFFF", logo: "FC" }, // Blue Grey
  ];

  public static getInstance(): TeamColorService {
    if (!TeamColorService.instance) {
      TeamColorService.instance = new TeamColorService();
    }
    return TeamColorService.instance;
  }

  /**
   * Get team colors with intelligent fallback strategy
   */
  public getTeamColors(teamName: string, teamInfo?: TeamInfo): TeamColors {
    if (!teamName) {
      return this.getDefaultColors();
    }

    // Priority 1: Use API-provided colors if available
    if (teamInfo?.colors?.primary) {
      return {
        primary: teamInfo.colors.primary,
        secondary: teamInfo.colors.secondary || "#FFFFFF",
        logo: teamInfo.code || this.generateTeamLogo(teamName),
      };
    }

    // Priority 2: Exact match from database
    if (this.teamColorDatabase[teamName]) {
      return this.teamColorDatabase[teamName];
    }

    // Priority 3: Case-insensitive match
    const normalizedName = teamName.toLowerCase();
    for (const [key, colors] of Object.entries(this.teamColorDatabase)) {
      if (key.toLowerCase() === normalizedName) {
        return colors;
      }
    }

    // Priority 4: Partial match (useful for team variations)
    for (const [key, colors] of Object.entries(this.teamColorDatabase)) {
      const keyLower = key.toLowerCase();
      if (normalizedName.includes(keyLower) || keyLower.includes(normalizedName)) {
        return colors;
      }
    }

    // Priority 5: Generate consistent color based on team name hash
    return this.generateDynamicColors(teamName);
  }

  /**
   * Generate team logo abbreviation from team name
   */
  private generateTeamLogo(teamName: string): string {
    return teamName
      .split(" ")
      .map(word => word[0])
      .join("")
      .slice(0, 3)
      .toUpperCase() || "FC";
  }

  /**
   * Generate consistent colors based on team name hash
   */
  private generateDynamicColors(teamName: string): TeamColors {
    let hash = 0;
    for (let i = 0; i < teamName.length; i++) {
      hash = teamName.charCodeAt(i) + ((hash << 5) - hash);
    }

    const colorIndex = Math.abs(hash) % this.dynamicColorPalette.length;
    const selectedColor = this.dynamicColorPalette[colorIndex];
    
    return {
      ...selectedColor,
      logo: this.generateTeamLogo(teamName),
    };
  }

  /**
   * Get default colors for fallback
   */
  private getDefaultColors(): TeamColors {
    return {
      primary: "#E53935",
      secondary: "#FFFFFF",
      logo: "FC",
    };
  }

  /**
   * Check if a color is light (for text contrast)
   */
  public isLightColor(color: string | undefined | null): boolean {
    // Safety check: if color is undefined/null/invalid, default to dark
    if (!color || typeof color !== 'string' || color.length < 6) {
      return false; // Default to dark color
    }
    
    try {
      const hex = color.replace('#', '');
      if (hex.length < 6) {
        return false; // Invalid hex color, default to dark
      }
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      
      // Check if parsing was successful
      if (isNaN(r) || isNaN(g) || isNaN(b)) {
        return false; // Invalid color values, default to dark
      }
      
      // Calculate relative luminance
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      return luminance > 0.5;
    } catch (error) {
      // If any error occurs, default to dark color
      return false;
    }
  }

  /**
   * Get contrasting text color for a background
   */
  public getContrastingTextColor(backgroundColor: string): string {
    return this.isLightColor(backgroundColor) ? "#000000" : "#FFFFFF";
  }

  /**
   * Add transparency to a color
   */
  public addTransparency(color: string, opacity: number): string {
    const hex = color.replace('#', '');
    const alpha = Math.round(opacity * 255).toString(16).padStart(2, '0');
    return `#${hex}${alpha}`;
  }

  /**
   * Get a lighter version of a color
   */
  public getLighterColor(color: string, amount: number = 0.1): string {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    const newR = Math.min(255, Math.round(r + (255 - r) * amount));
    const newG = Math.min(255, Math.round(g + (255 - g) * amount));
    const newB = Math.min(255, Math.round(b + (255 - b) * amount));
    
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
  }

  /**
   * Get a darker version of a color
   */
  public getDarkerColor(color: string, amount: number = 0.1): string {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    const newR = Math.max(0, Math.round(r * (1 - amount)));
    const newG = Math.max(0, Math.round(g * (1 - amount)));
    const newB = Math.max(0, Math.round(b * (1 - amount)));
    
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
  }
}

// Export singleton instance
export const teamColorService = TeamColorService.getInstance();
export type { TeamColors, TeamInfo };
