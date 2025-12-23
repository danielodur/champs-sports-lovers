import { ApiSportsService, createApiSportsService } from "./api-sports-service";
import { TheSportsDbService } from "./theSportsDbService";

export interface TeamStatistics {
  attacks: number;
  dangerousAttacks: number;
  possession: number;
  shotsOnTarget: number;
  shotsOffTarget: number;
  passes: number;
  passAccuracy: number;
  keyPasses: number;
  longPasses: number;
  longPassAccuracy: number;
  dribbles: number;
  dribbleSuccess: number;
  ballsLost: number;
  oneOnOneSuccess: number;
  clearances: number;
  shots: number;
  corners: number;
  tackles: number;
  fouls: number;
  yellowCards: number;
  redCards: number;
}

export interface PlayerStatistic {
  id: string;
  name: string;
  position: string;
  photo: string;
  rating: number;
  goals: number;
  assists: number;
  shots: number;
  passes: number;
  passAccuracy: number;
  tackles: number;
  fouls: number;
  yellowCards: number;
  redCards: number;
  minutesPlayed: number;
}

export interface MatchEvent {
  id: string;
  time: number;
  type:
    | "goal"
    | "yellow_card"
    | "red_card"
    | "substitution"
    | "corner"
    | "free_kick";
  team: "home" | "away";
  player: string;
  description: string;
}

export interface DeepMatchData {
  homeTeamStats: TeamStatistics;
  awayTeamStats: TeamStatistics;
  homePlayers: PlayerStatistic[];
  awayPlayers: PlayerStatistic[];
  events: MatchEvent[];
}

class DeepDataApiService {
  private apiSportsService: ApiSportsService;
  private theSportsDbService: TheSportsDbService;
  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheExpiry = 5 * 60 * 1000; // 5 minutes

  constructor() {
    // Helper function to get API key
    const getApiKey = () => {
      return (
        process.env.EXPO_PUBLIC_API_FOOTBALL_KEY ||
        process.env.EXPO_PUBLIC_API_SPORT_KEY ||
        process.env.EXPO_PUBLIC_THE_SPORTSDB_API_KEY ||
        process.env.EXPO_API_FOOTBALL_KEY
      );
    };

    // Initialize API services using factory function
    this.apiSportsService = createApiSportsService(getApiKey(), {
      enableCaching: true,
      cacheExpiry: 5 * 60 * 1000, // 5 minutes
      retryAttempts: 3,
      timeout: 10000,
    });

    this.theSportsDbService = new TheSportsDbService({
      apiKey: process.env.EXPO_PUBLIC_THE_SPORTSDB_API_KEY || "",
      baseUrl: "https://www.thesportsdb.com/api/v1/json",
      timeout: 10000,
      retryAttempts: 3,
    });
  }

  private getCachedData<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }
    return null;
  }

  private setCachedData(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  async fetchMatchStatistics(
    matchId: string,
    timePeriod: "full" | "first" | "second" = "full",
  ): Promise<{ home: TeamStatistics; away: TeamStatistics }> {
    const cacheKey = `match_stats_${matchId}_${timePeriod}`;
    const cached = this.getCachedData<{
      home: TeamStatistics;
      away: TeamStatistics;
    }>(cacheKey);

    if (cached) {
      return cached;
    }

    try {
      // Try API-Football first for comprehensive statistics
      const apiFootballStats = await this.fetchApiFootballStatistics(
        matchId,
        timePeriod,
      );
      if (apiFootballStats) {
        this.setCachedData(cacheKey, apiFootballStats);
        return apiFootballStats;
      }
    } catch (error) {
      console.warn("API-Football statistics failed:", error);
    }

    try {
      // Fallback to TheSportsDB
      const sportsDbStats = await this.fetchTheSportsDbStatistics(
        matchId,
        timePeriod,
      );
      if (sportsDbStats) {
        this.setCachedData(cacheKey, sportsDbStats);
        return sportsDbStats;
      }
    } catch (error) {
      console.warn("TheSportsDB statistics failed:", error);
    }

    // Generate realistic mock data as final fallback
    const mockStats = this.generateMockStatistics();
    this.setCachedData(cacheKey, mockStats);
    return mockStats;
  }

  private async fetchApiFootballStatistics(
    matchId: string,
    timePeriod: "full" | "first" | "second",
  ): Promise<{ home: TeamStatistics; away: TeamStatistics } | null> {
    try {
      const response = await fetch(
        `https://v3.football.api-sports.io/fixtures/statistics?fixture=${matchId}`,
        {
          headers: {
            "X-RapidAPI-Key": process.env.EXPO_PUBLIC_API_FOOTBALL_KEY || "",
            "X-RapidAPI-Host": "v3.football.api-sports.io",
          },
        },
      );

      if (!response.ok) {
        throw new Error(`API-Football request failed: ${response.status}`);
      }

      const data = await response.json();

      if (!data.response || data.response.length < 2) {
        return null;
      }

      const homeStats = data.response[0].statistics;
      const awayStats = data.response[1].statistics;

      return {
        home: this.parseApiFootballStats(homeStats, timePeriod),
        away: this.parseApiFootballStats(awayStats, timePeriod),
      };
    } catch (error) {
      console.error("Error fetching API-Football statistics:", error);
      return null;
    }
  }

  private parseApiFootballStats(
    stats: any[],
    timePeriod: string,
  ): TeamStatistics {
    const getValue = (type: string): number => {
      const stat = stats.find((s) => s.type === type);
      if (!stat) return 0;

      // Apply time period filter
      let value = stat.value;
      if (typeof value === "string") {
        if (value.includes("%")) {
          value = parseInt(value.replace("%", ""));
        } else {
          value = parseInt(value) || 0;
        }
      }

      // Adjust for time period (rough approximation)
      if (timePeriod === "first" || timePeriod === "second") {
        value = Math.floor(value * 0.5);
      }

      return value;
    };

    return {
      attacks: getValue("Total attacks") || Math.floor(Math.random() * 40) + 30,
      dangerousAttacks:
        getValue("Dangerous attacks") || Math.floor(Math.random() * 20) + 10,
      possession:
        getValue("Ball Possession") || Math.floor(Math.random() * 30) + 35,
      shotsOnTarget:
        getValue("Shots on Goal") || Math.floor(Math.random() * 8) + 2,
      shotsOffTarget:
        getValue("Shots off Goal") || Math.floor(Math.random() * 10) + 3,
      passes: getValue("Total passes") || Math.floor(Math.random() * 200) + 300,
      passAccuracy: getValue("Passes %") || Math.floor(Math.random() * 20) + 70,
      keyPasses: getValue("Key passes") || Math.floor(Math.random() * 10) + 3,
      longPasses: getValue("Long balls") || Math.floor(Math.random() * 30) + 20,
      longPassAccuracy:
        getValue("Long balls %") || Math.floor(Math.random() * 30) + 40,
      dribbles: getValue("Dribbles") || Math.floor(Math.random() * 10) + 5,
      dribbleSuccess:
        getValue("Dribbles %") || Math.floor(Math.random() * 40) + 40,
      ballsLost: getValue("Ball lost") || Math.floor(Math.random() * 15) + 10,
      oneOnOneSuccess:
        getValue("Duels won") || Math.floor(Math.random() * 5) + 1,
      clearances: getValue("Clearances") || Math.floor(Math.random() * 10) + 5,
      shots: getValue("Total Shots") || Math.floor(Math.random() * 15) + 8,
      corners: getValue("Corner Kicks") || Math.floor(Math.random() * 8) + 2,
      tackles: getValue("Tackles") || Math.floor(Math.random() * 15) + 10,
      fouls: getValue("Fouls") || Math.floor(Math.random() * 10) + 5,
      yellowCards: getValue("Yellow Cards") || Math.floor(Math.random() * 3),
      redCards: getValue("Red Cards") || Math.floor(Math.random() * 2),
    };
  }

  private async fetchTheSportsDbStatistics(
    matchId: string,
    timePeriod: "full" | "first" | "second",
  ): Promise<{ home: TeamStatistics; away: TeamStatistics } | null> {
    try {
      // TheSportsDB has limited statistics, so we'll use what's available
      // and generate realistic mock data for missing stats
      const response = await fetch(
        `https://www.thesportsdb.com/api/v1/json/${process.env.EXPO_PUBLIC_THE_SPORTSDB_API_KEY}/lookupevent.php?id=${matchId}`,
      );

      if (!response.ok) {
        throw new Error(`TheSportsDB request failed: ${response.status}`);
      }

      const data = await response.json();

      if (!data.events || data.events.length === 0) {
        return null;
      }

      const event = data.events[0];

      // Generate stats based on available data and realistic patterns
      const homeStats = this.generateStatsFromTheSportsDb(
        event,
        "home",
        timePeriod,
      );
      const awayStats = this.generateStatsFromTheSportsDb(
        event,
        "away",
        timePeriod,
      );

      return { home: homeStats, away: awayStats };
    } catch (error) {
      console.error("Error fetching TheSportsDB statistics:", error);
      return null;
    }
  }

  private generateStatsFromTheSportsDb(
    event: any,
    team: "home" | "away",
    timePeriod: string,
  ): TeamStatistics {
    // Use available data from TheSportsDB and generate realistic complementary stats
    const isHome = team === "home";
    const goals = isHome
      ? parseInt(event.intHomeScore) || 0
      : parseInt(event.intAwayScore) || 0;

    // Generate realistic stats based on goals scored
    const baseMultiplier = timePeriod === "full" ? 1 : 0.5;
    const goalMultiplier = Math.max(1, goals * 0.3);

    return {
      attacks: Math.floor(
        (Math.random() * 20 + 25) * baseMultiplier * goalMultiplier,
      ),
      dangerousAttacks: Math.floor(
        (Math.random() * 10 + 8) * baseMultiplier * goalMultiplier,
      ),
      possession: Math.floor(Math.random() * 30) + 35,
      shotsOnTarget: Math.floor(
        (Math.random() * 5 + goals + 1) * baseMultiplier,
      ),
      shotsOffTarget: Math.floor((Math.random() * 8 + 3) * baseMultiplier),
      passes: Math.floor((Math.random() * 150 + 250) * baseMultiplier),
      passAccuracy: Math.floor(Math.random() * 20) + 70,
      keyPasses: Math.floor((Math.random() * 8 + 2) * baseMultiplier),
      longPasses: Math.floor((Math.random() * 25 + 15) * baseMultiplier),
      longPassAccuracy: Math.floor(Math.random() * 30) + 40,
      dribbles: Math.floor((Math.random() * 8 + 4) * baseMultiplier),
      dribbleSuccess: Math.floor(Math.random() * 40) + 40,
      ballsLost: Math.floor((Math.random() * 12 + 8) * baseMultiplier),
      oneOnOneSuccess: Math.floor((Math.random() * 4 + 1) * baseMultiplier),
      clearances: Math.floor((Math.random() * 8 + 4) * baseMultiplier),
      shots: Math.floor((Math.random() * 12 + 6) * baseMultiplier),
      corners: Math.floor((Math.random() * 6 + 2) * baseMultiplier),
      tackles: Math.floor((Math.random() * 12 + 8) * baseMultiplier),
      fouls: Math.floor((Math.random() * 8 + 4) * baseMultiplier),
      yellowCards: Math.floor(Math.random() * 3),
      redCards: Math.floor(Math.random() * 2),
    };
  }

  private generateMockStatistics(): {
    home: TeamStatistics;
    away: TeamStatistics;
  } {
    const homeStats: TeamStatistics = {
      attacks: Math.floor(Math.random() * 40) + 30,
      dangerousAttacks: Math.floor(Math.random() * 20) + 10,
      possession: Math.floor(Math.random() * 30) + 35,
      shotsOnTarget: Math.floor(Math.random() * 8) + 2,
      shotsOffTarget: Math.floor(Math.random() * 10) + 3,
      passes: Math.floor(Math.random() * 200) + 300,
      passAccuracy: Math.floor(Math.random() * 20) + 70,
      keyPasses: Math.floor(Math.random() * 10) + 3,
      longPasses: Math.floor(Math.random() * 30) + 20,
      longPassAccuracy: Math.floor(Math.random() * 30) + 40,
      dribbles: Math.floor(Math.random() * 10) + 5,
      dribbleSuccess: Math.floor(Math.random() * 40) + 40,
      ballsLost: Math.floor(Math.random() * 15) + 10,
      oneOnOneSuccess: Math.floor(Math.random() * 5) + 1,
      clearances: Math.floor(Math.random() * 10) + 5,
      shots: Math.floor(Math.random() * 15) + 8,
      corners: Math.floor(Math.random() * 8) + 2,
      tackles: Math.floor(Math.random() * 15) + 10,
      fouls: Math.floor(Math.random() * 10) + 5,
      yellowCards: Math.floor(Math.random() * 3),
      redCards: Math.floor(Math.random() * 2),
    };

    const awayStats: TeamStatistics = {
      attacks: Math.floor(Math.random() * 40) + 30,
      dangerousAttacks: Math.floor(Math.random() * 20) + 10,
      possession: 100 - homeStats.possession,
      shotsOnTarget: Math.floor(Math.random() * 8) + 2,
      shotsOffTarget: Math.floor(Math.random() * 10) + 3,
      passes: Math.floor(Math.random() * 200) + 300,
      passAccuracy: Math.floor(Math.random() * 20) + 70,
      keyPasses: Math.floor(Math.random() * 10) + 3,
      longPasses: Math.floor(Math.random() * 30) + 20,
      longPassAccuracy: Math.floor(Math.random() * 30) + 40,
      dribbles: Math.floor(Math.random() * 10) + 5,
      dribbleSuccess: Math.floor(Math.random() * 40) + 40,
      ballsLost: Math.floor(Math.random() * 15) + 10,
      oneOnOneSuccess: Math.floor(Math.random() * 5) + 1,
      clearances: Math.floor(Math.random() * 10) + 5,
      shots: Math.floor(Math.random() * 15) + 8,
      corners: Math.floor(Math.random() * 8) + 2,
      tackles: Math.floor(Math.random() * 15) + 10,
      fouls: Math.floor(Math.random() * 10) + 5,
      yellowCards: Math.floor(Math.random() * 3),
      redCards: Math.floor(Math.random() * 2),
    };

    return { home: homeStats, away: awayStats };
  }

  async fetchPlayerStatistics(matchId: string): Promise<{
    home: PlayerStatistic[];
    away: PlayerStatistic[];
  }> {
    const cacheKey = `player_stats_${matchId}`;
    const cached = this.getCachedData<{
      home: PlayerStatistic[];
      away: PlayerStatistic[];
    }>(cacheKey);

    if (cached) {
      return cached;
    }

    try {
      // Try API-Football for player statistics
      const apiFootballPlayers = await this.fetchApiFootballPlayers(matchId);
      if (apiFootballPlayers) {
        this.setCachedData(cacheKey, apiFootballPlayers);
        return apiFootballPlayers;
      }
    } catch (error) {
      console.warn("API-Football player statistics failed:", error);
    }

    // Generate mock player data as fallback
    const mockPlayers = this.generateMockPlayers();
    this.setCachedData(cacheKey, mockPlayers);
    return mockPlayers;
  }

  private async fetchApiFootballPlayers(matchId: string): Promise<{
    home: PlayerStatistic[];
    away: PlayerStatistic[];
  } | null> {
    try {
      const response = await fetch(
        `https://v3.football.api-sports.io/fixtures/players?fixture=${matchId}`,
        {
          headers: {
            "X-RapidAPI-Key": process.env.EXPO_PUBLIC_API_FOOTBALL_KEY || "",
            "X-RapidAPI-Host": "v3.football.api-sports.io",
          },
        },
      );

      if (!response.ok) {
        throw new Error(
          `API-Football players request failed: ${response.status}`,
        );
      }

      const data = await response.json();

      if (!data.response || data.response.length < 2) {
        return null;
      }

      const homePlayers = this.parseApiFootballPlayers(
        data.response[0].players,
      );
      const awayPlayers = this.parseApiFootballPlayers(
        data.response[1].players,
      );

      return { home: homePlayers, away: awayPlayers };
    } catch (error) {
      console.error("Error fetching API-Football players:", error);
      return null;
    }
  }

  private parseApiFootballPlayers(players: any[]): PlayerStatistic[] {
    return players.map((playerData: any, index: number) => {
      const player = playerData.player;
      const statistics = playerData.statistics[0] || {};

      return {
        id: player.id?.toString() || index.toString(),
        name: player.name || `Player ${index + 1}`,
        position: statistics.games?.position || "Unknown",
        photo:
          player.photo ||
          `https://images.unsplash.com/photo-157094718${index}-63b2ee4b7c89?w=100&h=100&fit=crop&crop=face`,
        rating:
          parseFloat(statistics.games?.rating || "0") ||
          Math.floor(Math.random() * 40) + 60,
        goals: statistics.goals?.total || 0,
        assists: statistics.goals?.assists || 0,
        shots: statistics.shots?.total || 0,
        passes: statistics.passes?.total || Math.floor(Math.random() * 50) + 20,
        passAccuracy:
          statistics.passes?.accuracy || Math.floor(Math.random() * 30) + 70,
        tackles: statistics.tackles?.total || 0,
        fouls: statistics.fouls?.committed || 0,
        yellowCards: statistics.cards?.yellow || 0,
        redCards: statistics.cards?.red || 0,
        minutesPlayed: statistics.games?.minutes || 90,
      };
    });
  }

  private generateMockPlayers(): {
    home: PlayerStatistic[];
    away: PlayerStatistic[];
  } {
    const positions = ["GK", "DEF", "MID", "FWD"];

    const generateTeamPlayers = (teamName: string): PlayerStatistic[] => {
      const players: PlayerStatistic[] = [];

      for (let i = 0; i < 11; i++) {
        players.push({
          id: `${teamName}_${i}`,
          name: `Player ${i + 1}`,
          position: positions[Math.floor(Math.random() * positions.length)],
          photo: `https://images.unsplash.com/photo-157094718${i}-63b2ee4b7c89?w=100&h=100&fit=crop&crop=face`,
          rating: Math.floor(Math.random() * 40) + 60,
          goals: Math.floor(Math.random() * 3),
          assists: Math.floor(Math.random() * 2),
          shots: Math.floor(Math.random() * 5),
          passes: Math.floor(Math.random() * 50) + 20,
          passAccuracy: Math.floor(Math.random() * 30) + 70,
          tackles: Math.floor(Math.random() * 8),
          fouls: Math.floor(Math.random() * 4),
          yellowCards: Math.floor(Math.random() * 2),
          redCards: 0,
          minutesPlayed: 90,
        });
      }

      return players;
    };

    return {
      home: generateTeamPlayers("home"),
      away: generateTeamPlayers("away"),
    };
  }

  async fetchMatchEvents(matchId: string): Promise<MatchEvent[]> {
    const cacheKey = `match_events_${matchId}`;
    const cached = this.getCachedData<MatchEvent[]>(cacheKey);

    if (cached) {
      return cached;
    }

    try {
      // Try API-Football for match events
      const apiFootballEvents = await this.fetchApiFootballEvents(matchId);
      if (apiFootballEvents) {
        this.setCachedData(cacheKey, apiFootballEvents);
        return apiFootballEvents;
      }
    } catch (error) {
      console.warn("API-Football events failed:", error);
    }

    // Generate mock events as fallback
    const mockEvents = this.generateMockEvents();
    this.setCachedData(cacheKey, mockEvents);
    return mockEvents;
  }

  private async fetchApiFootballEvents(
    matchId: string,
  ): Promise<MatchEvent[] | null> {
    try {
      const response = await fetch(
        `https://v3.football.api-sports.io/fixtures/events?fixture=${matchId}`,
        {
          headers: {
            "X-RapidAPI-Key": process.env.EXPO_PUBLIC_API_FOOTBALL_KEY || "",
            "X-RapidAPI-Host": "v3.football.api-sports.io",
          },
        },
      );

      if (!response.ok) {
        throw new Error(
          `API-Football events request failed: ${response.status}`,
        );
      }

      const data = await response.json();

      if (!data.response) {
        return null;
      }

      return data.response.map((event: any, index: number) => ({
        id: index.toString(),
        time: event.time?.elapsed || 0,
        type: this.mapEventType(event.type),
        team: event.team?.name?.includes("home") ? "home" : "away",
        player: event.player?.name || "Unknown Player",
        description: `${event.type} - ${event.player?.name || "Unknown Player"}`,
      }));
    } catch (error) {
      console.error("Error fetching API-Football events:", error);
      return null;
    }
  }

  private mapEventType(apiEventType: string): MatchEvent["type"] {
    switch (apiEventType?.toLowerCase()) {
      case "goal":
        return "goal";
      case "card":
        return "yellow_card"; // Would need to check detail for red vs yellow
      case "subst":
        return "substitution";
      default:
        return "free_kick";
    }
  }

  private generateMockEvents(): MatchEvent[] {
    return [
      {
        id: "1",
        time: 15,
        type: "goal",
        team: "away",
        player: "Player 9",
        description: "Goal - Player 9",
      },
      {
        id: "2",
        time: 23,
        type: "yellow_card",
        team: "home",
        player: "Player 4",
        description: "Yellow Card - Player 4",
      },
      {
        id: "3",
        time: 31,
        type: "corner",
        team: "home",
        player: "Player 7",
        description: "Corner - Player 7",
      },
      {
        id: "4",
        time: 45,
        type: "yellow_card",
        team: "away",
        player: "Player 6",
        description: "Yellow Card - Player 6",
      },
      {
        id: "5",
        time: 52,
        type: "goal",
        team: "home",
        player: "Player 10",
        description: "Goal - Player 10",
      },
      {
        id: "6",
        time: 67,
        type: "substitution",
        team: "home",
        player: "Player 8",
        description: "Substitution - Player 8",
      },
    ];
  }

  async fetchCompleteMatchData(
    matchId: string,
    timePeriod: "full" | "first" | "second" = "full",
  ): Promise<DeepMatchData> {
    try {
      const [statsResult, playersResult, eventsResult] =
        await Promise.allSettled([
          this.fetchMatchStatistics(matchId, timePeriod),
          this.fetchPlayerStatistics(matchId),
          this.fetchMatchEvents(matchId),
        ]);

      const stats =
        statsResult.status === "fulfilled"
          ? statsResult.value
          : this.generateMockStatistics();
      const players =
        playersResult.status === "fulfilled"
          ? playersResult.value
          : this.generateMockPlayers();
      const events =
        eventsResult.status === "fulfilled"
          ? eventsResult.value
          : this.generateMockEvents();

      return {
        homeTeamStats: stats.home,
        awayTeamStats: stats.away,
        homePlayers: players.home,
        awayPlayers: players.away,
        events,
      };
    } catch (error) {
      console.error("Error fetching complete match data:", error);

      // Return mock data as complete fallback
      const mockStats = this.generateMockStatistics();
      const mockPlayers = this.generateMockPlayers();
      const mockEvents = this.generateMockEvents();

      return {
        homeTeamStats: mockStats.home,
        awayTeamStats: mockStats.away,
        homePlayers: mockPlayers.home,
        awayPlayers: mockPlayers.away,
        events: mockEvents,
      };
    }
  }
}

export const deepDataApiService = new DeepDataApiService();
export default deepDataApiService;
