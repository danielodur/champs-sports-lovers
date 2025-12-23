// services/match-details-lineup-service.ts
import { Dimensions } from "react-native";
import {
  generateRealHomeLineupPlayers,
  generateRealAwayLineupPlayers,
  generateHomeTeamPlayers,
  generateAwayTeamPlayers,
  generateRealisticPlayerNames,
  generateMatchEvents,
} from "@/utils/match-details/old-helpers";
import { getPlayerFieldPosition } from "@/utils/match-details/getPlayerFieldPosition";

export interface PlayerData {
  id: string;
  name: string;
  number: number;
  position: string;
  isStarter: boolean;
  rating: number;
  nationality: string;
  age: number;
  marketValue: string;
  events?: MatchEvent[];
  photo?: string;
}

export interface MatchEvent {
  type: "goal" | "yellow_card" | "red_card" | "substitution";
  minute: number;
  player?: string;
  icon?: string;
}

export interface FormationConfig {
  name: string;
  positions: {
    [key: string]: {
      count: number;
      line: number;
      priority: number;
    };
  };
}

export interface FieldDimensions {
  width: number;
  height: number;
}

export interface PlayerPosition {
  position: "absolute";
  top: number;
  left: number;
}

export interface TeamLineupData {
  starters: PlayerData[];
  substitutes: PlayerData[];
  formation: string;
  coach: {
    name: string;
    nationality: string;
    age: number;
  };
  teamValue: string;
  averageAge: number;
}

export interface LineupWeatherData {
  temperature: string;
  condition: string;
  humidity: string;
  stadium: string;
  attendance?: number;
}

export interface MatchLineupData {
  home: TeamLineupData;
  away: TeamLineupData;
  weather: LineupWeatherData;
  fieldDimensions: FieldDimensions;
  referee?: {
    name: string;
    nationality: string;
  };
}

export class MatchDetailsLineupService {
  private static instance: MatchDetailsLineupService;

  // Formation configurations
  private formations: { [key: string]: FormationConfig } = {
    "4-2-3-1": {
      name: "4-2-3-1",
      positions: {
        GK: { count: 1, line: 0, priority: 1 },
        LB: { count: 1, line: 1, priority: 1 },
        CB: { count: 2, line: 1, priority: 2 },
        RB: { count: 1, line: 1, priority: 3 },
        CDM: { count: 2, line: 2, priority: 1 },
        LW: { count: 1, line: 3, priority: 1 },
        CAM: { count: 1, line: 3, priority: 2 },
        RW: { count: 1, line: 3, priority: 3 },
        ST: { count: 1, line: 4, priority: 1 },
      },
    },
    "4-3-3": {
      name: "4-3-3",
      positions: {
        GK: { count: 1, line: 0, priority: 1 },
        LB: { count: 1, line: 1, priority: 1 },
        CB: { count: 2, line: 1, priority: 2 },
        RB: { count: 1, line: 1, priority: 3 },
        CM: { count: 3, line: 2, priority: 1 },
        LW: { count: 1, line: 3, priority: 1 },
        ST: { count: 1, line: 3, priority: 2 },
        RW: { count: 1, line: 3, priority: 3 },
      },
    },
    "4-4-2": {
      name: "4-4-2",
      positions: {
        GK: { count: 1, line: 0, priority: 1 },
        LB: { count: 1, line: 1, priority: 1 },
        CB: { count: 2, line: 1, priority: 2 },
        RB: { count: 1, line: 1, priority: 3 },
        LM: { count: 1, line: 2, priority: 1 },
        CM: { count: 2, line: 2, priority: 2 },
        RM: { count: 1, line: 2, priority: 3 },
        ST: { count: 2, line: 3, priority: 1 },
      },
    },
    "3-5-2": {
      name: "3-5-2",
      positions: {
        GK: { count: 1, line: 0, priority: 1 },
        CB: { count: 3, line: 1, priority: 1 },
        LWB: { count: 1, line: 2, priority: 1 },
        CM: { count: 3, line: 2, priority: 2 },
        RWB: { count: 1, line: 2, priority: 3 },
        ST: { count: 2, line: 3, priority: 1 },
      },
    },
  };

  public static getInstance(): MatchDetailsLineupService {
    if (!MatchDetailsLineupService.instance) {
      MatchDetailsLineupService.instance = new MatchDetailsLineupService();
    }
    return MatchDetailsLineupService.instance;
  }

  /**
   * Get field dimensions based on screen size
   */
  public getFieldDimensions(): FieldDimensions {
    const screenWidth = Dimensions.get("window").width;
    return {
      width: screenWidth,
      height: 480,
    };
  }

  /**
   * Calculate player position on the field
   */
  public calculatePlayerPosition(
    position: string,
    team: "home" | "away",
    index: number,
    fieldDimensions: FieldDimensions,
  ): PlayerPosition {
    return getPlayerFieldPosition(position, team, index, fieldDimensions);
  }

  /**
   * Generate realistic team lineup
   */
  public generateTeamLineup(
    teamName: string,
    matchId: string,
    teamType: "home" | "away",
  ): TeamLineupData {
    const starters =
      teamType === "home"
        ? generateRealHomeLineupPlayers(teamName, matchId)
        : generateRealAwayLineupPlayers(teamName, matchId);

    const substitutes = this.generateSubstitutes(teamName, matchId);

    // Calculate team stats
    const teamValue = this.calculateTeamValue(starters);
    const averageAge = this.calculateAverageAge(starters);

    return {
      starters: starters.slice(0, 11), // Only starting XI
      substitutes,
      formation: "4-2-3-1", // Default formation
      coach: this.generateCoachData(teamName, matchId),
      teamValue,
      averageAge,
    };
  }

  /**
   * Generate substitute players
   */
  public generateSubstitutes(teamName: string, matchId: string): PlayerData[] {
    const subNames = generateRealisticPlayerNames(
      `${teamName} Subs`,
      "Premier League",
      matchId + "subs",
    );

    const positions = ["GK", "CB", "CM", "ST", "LB", "RW", "CDM", "LW"];
    const substitutes: PlayerData[] = [];

    for (let i = 0; i < 7; i++) {
      substitutes.push({
        id: `sub-${i + 1}`,
        name: subNames[i] || `Substitute ${i + 1}`,
        number: 12 + i,
        position: positions[i] || "CM",
        isStarter: false,
        rating: this.generateRating(5.8, 6.5),
        nationality: "UGA",
        age: this.generateAge(18, 35),
        marketValue: this.generateMarketValue(1.0, 3.0),
        events: [],
      });
    }

    return substitutes;
  }

  /**
   * Generate coach data
   */
  private generateCoachData(
    teamName: string,
    matchId: string,
  ): TeamLineupData["coach"] {
    // Create deterministic seed from team name and match ID
    let hash = 0;
    const seedString = teamName + matchId;
    for (let i = 0; i < seedString.length; i++) {
      hash = ((hash << 5) - hash + seedString.charCodeAt(i)) & 0xffffffff;
    }
    const seed = Math.abs(hash) / 0xffffffff;

    const coachNames = [
      "David Thompson",
      "Michael Johnson",
      "Robert Williams",
      "James Anderson",
      "Paul Martinez",
      "Daniel Garcia",
      "Mark Rodriguez",
      "Steven Wilson",
    ];

    const nationalities = ["ENG", "SCO", "IRL", "WAL", "GER", "FRA", "ESP", "ITA"];

    const nameIndex = Math.floor(seed * coachNames.length);
    const nationalityIndex = Math.floor((seed * 7) % nationalities.length);
    const age = 35 + Math.floor((seed * 13) % 25); // Ages 35-60

    return {
      name: coachNames[nameIndex],
      nationality: nationalities[nationalityIndex],
      age,
    };
  }

  /**
   * Calculate total team value
   */
  private calculateTeamValue(players: PlayerData[]): string {
    const totalValue = players.reduce((sum, player) => {
      const value = parseFloat(player.marketValue.replace(/[€M]/g, ""));
      return sum + value;
    }, 0);

    return `€${totalValue.toFixed(1)}M`;
  }

  /**
   * Calculate average team age
   */
  private calculateAverageAge(players: PlayerData[]): number {
    const totalAge = players.reduce((sum, player) => sum + player.age, 0);
    return Math.round((totalAge / players.length) * 10) / 10;
  }

  /**
   * Generate weather data for lineup display
   */
  public generateWeatherData(
    homeTeamName: string,
    matchId?: string,
  ): LineupWeatherData {
    // Create deterministic weather based on match ID or team name
    const seed = matchId || homeTeamName;
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = ((hash << 5) - hash + seed.charCodeAt(i)) & 0xffffffff;
    }
    const randomValue = Math.abs(hash) / 0xffffffff;

    const temperatures = ["15°C", "17°C", "19°C", "21°C", "23°C", "25°C"];
    const conditions = ["Clear", "Partly Cloudy", "Overcast", "Light Rain"];
    const humidityLevels = ["65%", "70%", "75%", "80%", "85%"];

    const tempIndex = Math.floor(randomValue * temperatures.length);
    const conditionIndex = Math.floor((randomValue * 7) % conditions.length);
    const humidityIndex = Math.floor((randomValue * 11) % humidityLevels.length);

    return {
      temperature: temperatures[tempIndex],
      condition: conditions[conditionIndex],
      humidity: humidityLevels[humidityIndex],
      stadium: `${homeTeamName} Stadium`,
      attendance: Math.floor(15000 + randomValue * 35000), // 15k-50k attendance
    };
  }

  /**
   * Get formation by name
   */
  public getFormation(formationName: string): FormationConfig | null {
    return this.formations[formationName] || null;
  }

  /**
   * Get all available formations
   */
  public getAvailableFormations(): FormationConfig[] {
    return Object.values(this.formations);
  }

  /**
   * Set custom formation for a team
   */
  public setTeamFormation(
    lineup: TeamLineupData,
    formationName: string,
  ): TeamLineupData {
    const formation = this.getFormation(formationName);
    if (formation) {
      return {
        ...lineup,
        formation: formation.name,
      };
    }
    return lineup;
  }

  /**
   * Generate complete match lineup data
   */
  public generateMatchLineup(
    homeTeamName: string,
    awayTeamName: string,
    matchId: string,
  ): MatchLineupData {
    const fieldDimensions = this.getFieldDimensions();
    const weather = this.generateWeatherData(homeTeamName, matchId);

    const homeLineup = this.generateTeamLineup(homeTeamName, matchId, "home");
    const awayLineup = this.generateTeamLineup(awayTeamName, matchId, "away");

    return {
      home: homeLineup,
      away: awayLineup,
      weather,
      fieldDimensions,
      referee: this.generateRefereeData(matchId),
    };
  }

  /**
   * Generate referee data
   */
  private generateRefereeData(
    matchId: string,
  ): MatchLineupData["referee"] {
    let hash = 0;
    for (let i = 0; i < matchId.length; i++) {
      hash = ((hash << 5) - hash + matchId.charCodeAt(i)) & 0xffffffff;
    }
    const seed = Math.abs(hash) / 0xffffffff;

    const refereeNames = [
      "John Smith",
      "Michael Brown",
      "David Jones",
      "Robert Taylor",
      "James Wilson",
      "William Johnson",
      "Thomas Anderson",
      "Christopher Martin",
    ];

    const nationalities = ["ENG", "SCO", "WAL", "IRL"];

    const nameIndex = Math.floor(seed * refereeNames.length);
    const nationalityIndex = Math.floor((seed * 5) % nationalities.length);

    return {
      name: refereeNames[nameIndex],
      nationality: nationalities[nationalityIndex],
    };
  }

  /**
   * Get players by position
   */
  public getPlayersByPosition(
    lineup: TeamLineupData,
    position: string,
  ): PlayerData[] {
    return lineup.starters.filter((player) => player.position === position);
  }

  /**
   * Get starting XI arranged by formation
   */
  public getStartingXIByFormation(
    lineup: TeamLineupData,
  ): { [line: number]: PlayerData[] } {
    const formation = this.getFormation(lineup.formation);
    if (!formation) {
      // Return default arrangement if formation not found
      return this.getDefaultLineArrangement(lineup.starters);
    }

    const lines: { [line: number]: PlayerData[] } = {};
    const assignedPlayers: Set<string> = new Set();

    // Group positions by formation lines
    Object.entries(formation.positions).forEach(([position, config]) => {
      if (!lines[config.line]) {
        lines[config.line] = [];
      }

      const playersInPosition = lineup.starters.filter(
        (player) =>
          player.position === position && !assignedPlayers.has(player.id),
      );

      playersInPosition.slice(0, config.count).forEach((player) => {
        lines[config.line].push(player);
        assignedPlayers.add(player.id);
      });
    });

    // Add any remaining unassigned players to appropriate lines
    lineup.starters
      .filter((player) => !assignedPlayers.has(player.id))
      .forEach((player) => {
        const line = this.getDefaultLineForPosition(player.position);
        if (!lines[line]) lines[line] = [];
        lines[line].push(player);
      });

    return lines;
  }

  /**
   * Get default line arrangement when formation is unknown
   */
  private getDefaultLineArrangement(
    players: PlayerData[],
  ): { [line: number]: PlayerData[] } {
    const lines: { [line: number]: PlayerData[] } = {
      0: [], // Goalkeepers
      1: [], // Defenders
      2: [], // Midfielders
      3: [], // Forwards
    };

    players.forEach((player) => {
      const line = this.getDefaultLineForPosition(player.position);
      lines[line].push(player);
    });

    return lines;
  }

  /**
   * Get default line number for a position
   */
  private getDefaultLineForPosition(position: string): number {
    const positionLines: { [key: string]: number } = {
      GK: 0,
      LB: 1,
      CB: 1,
      RB: 1,
      LWB: 1,
      RWB: 1,
      CDM: 2,
      CM: 2,
      LM: 2,
      RM: 2,
      CAM: 2,
      LW: 3,
      RW: 3,
      ST: 3,
      CF: 3,
    };

    return positionLines[position] || 2; // Default to midfield
  }

  /**
   * Generate random rating within range
   */
  private generateRating(min: number, max: number): number {
    return Math.round((min + Math.random() * (max - min)) * 10) / 10;
  }

  /**
   * Generate random age within range
   */
  private generateAge(min: number, max: number): number {
    return min + Math.floor(Math.random() * (max - min + 1));
  }

  /**
   * Generate market value string
   */
  private generateMarketValue(min: number, max: number): string {
    const value = min + Math.random() * (max - min);
    return `€${value.toFixed(1)}M`;
  }

  /**
   * Get player events for display
   */
  public getPlayerEvents(player: PlayerData): MatchEvent[] {
    return player.events || [];
  }

  /**
   * Add event to player
   */
  public addPlayerEvent(
    player: PlayerData,
    event: MatchEvent,
  ): PlayerData {
    return {
      ...player,
      events: [...(player.events || []), event],
    };
  }

  /**
   * Update player rating
   */
  public updatePlayerRating(
    player: PlayerData,
    newRating: number,
  ): PlayerData {
    return {
      ...player,
      rating: Math.max(1.0, Math.min(10.0, newRating)),
    };
  }

  /**
   * Get team statistics summary
   */
  public getTeamStatsSummary(lineup: TeamLineupData): {
    totalValue: string;
    averageAge: number;
    averageRating: number;
    nationalityCount: { [nationality: string]: number };
    positionCount: { [position: string]: number };
  } {
    const players = [...lineup.starters, ...lineup.substitutes];

    // Calculate average rating
    const totalRating = players.reduce((sum, player) => sum + player.rating, 0);
    const averageRating = Math.round((totalRating / players.length) * 10) / 10;

    // Count nationalities
    const nationalityCount: { [nationality: string]: number } = {};
    players.forEach((player) => {
      nationalityCount[player.nationality] =
        (nationalityCount[player.nationality] || 0) + 1;
    });

    // Count positions
    const positionCount: { [position: string]: number } = {};
    players.forEach((player) => {
      positionCount[player.position] =
        (positionCount[player.position] || 0) + 1;
    });

    return {
      totalValue: this.calculateTeamValue(players),
      averageAge: this.calculateAverageAge(players),
      averageRating,
      nationalityCount,
      positionCount,
    };
  }

  /**
   * Validate lineup formation
   */
  public validateLineup(lineup: TeamLineupData): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    const players = lineup.starters;

    // Check if we have exactly 11 players
    if (players.length !== 11) {
      errors.push(`Starting XI must have exactly 11 players (found ${players.length})`);
    }

    // Check if we have exactly one goalkeeper
    const goalkeepers = players.filter((p) => p.position === "GK");
    if (goalkeepers.length !== 1) {
      errors.push(`Must have exactly 1 goalkeeper (found ${goalkeepers.length})`);
    }

    // Check if all players have unique numbers
    const numbers = players.map((p) => p.number);
    const uniqueNumbers = new Set(numbers);
    if (numbers.length !== uniqueNumbers.size) {
      errors.push("All players must have unique jersey numbers");
    }

    // Check formation validity
    const formation = this.getFormation(lineup.formation);
    if (!formation) {
      errors.push(`Invalid formation: ${lineup.formation}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get formation tactical analysis
   */
  public getFormationAnalysis(formationName: string): {
    strengths: string[];
    weaknesses: string[];
    tacticalNotes: string[];
  } {
    const formationAnalysis: {
      [key: string]: {
        strengths: string[];
        weaknesses: string[];
        tacticalNotes: string[];
      };
    } = {
      "4-2-3-1": {
        strengths: [
          "Excellent defensive stability",
          "Strong midfield control",
          "Flexible attacking options",
          "Good width in attack",
        ],
        weaknesses: [
          "Can lack numbers in midfield against 3-man midfields",
          "Striker can become isolated",
          "Full-backs need high fitness levels",
        ],
        tacticalNotes: [
          "CDMs provide defensive shield",
          "CAM links play between midfield and attack",
          "Wide players can drift inside or stay wide",
        ],
      },
      "4-3-3": {
        strengths: [
          "Strong midfield presence",
          "Natural attacking width",
          "Good pressing structure",
          "Balanced across all areas",
        ],
        weaknesses: [
          "Can be outnumbered in central midfield",
          "Wingers need to track back defensively",
          "Less creativity in final third without CAM",
        ],
        tacticalNotes: [
          "Midfield triangle provides control",
          "Wingers stretch the pitch",
          "Central striker leads the line",
        ],
      },
      "4-4-2": {
        strengths: [
          "Simple and effective structure",
          "Strong central presence",
          "Good defensive solidity",
          "Two strikers provide partnership",
        ],
        weaknesses: [
          "Can be outnumbered in midfield",
          "Lacks natural width in attack",
          "Vulnerable to overloads on flanks",
        ],
        tacticalNotes: [
          "Wide midfielders must provide width",
          "Strike partnership crucial",
          "Compact defensive shape",
        ],
      },
      "3-5-2": {
        strengths: [
          "Numerical advantage in midfield",
          "Wing-backs provide width",
          "Central defensive stability",
          "Flexible formation",
        ],
        weaknesses: [
          "Vulnerable on the flanks if wing-backs pushed up",
          "Requires specific player profiles",
          "Can lack width if wing-backs don't advance",
        ],
        tacticalNotes: [
          "Three center-backs provide stability",
          "Wing-backs are key to width",
          "Midfield overload creates control",
        ],
      },
    };

    return (
      formationAnalysis[formationName] || {
        strengths: ["Balanced formation"],
        weaknesses: ["Analysis not available"],
        tacticalNotes: ["Standard tactical approach"],
      }
    );
  }
}

// Export singleton instance
export const matchDetailsLineupService = MatchDetailsLineupService.getInstance();
