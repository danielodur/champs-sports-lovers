import { sportRadarApiService } from "./sportRadarApiService";

// 🚫 SPORTRADAR COMPLETELY DISABLED - Mock service to prevent crashes
// This service will be re-enabled when Sportradar integration is ready

export interface CardEvent {
  id: string;
  matchId: string;
  type: "yellow" | "red" | "yellow-red";
  player: string;
  team: string;
  minute: number;
  reason?: string;
}

export interface MatchCards {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  homeCards: CardEvent[];
  awayCards: CardEvent[];
  totalCards: number;
}

class CardsService {
  constructor() {
    console.log(
      "🚫 CardsService: Sportradar completely disabled - using mock data"
    );
  }

  // 🚫 ALL SPORTRADAR METHODS DISABLED - Return empty data to prevent crashes
  async getMatchCards(matchId: string): Promise<MatchCards | null> {
    console.log(
      "🚫 Sportradar API disabled - returning null match cards for",
      matchId
    );
    return null;
  }

  async getTeamCards(teamId: string, seasonId?: string): Promise<CardEvent[]> {
    console.log(
      "🚫 Sportradar API disabled - returning empty team cards for",
      teamId
    );
    return [];
  }

  async getPlayerCards(
    playerId: string,
    seasonId?: string
  ): Promise<CardEvent[]> {
    console.log(
      "🚫 Sportradar API disabled - returning empty player cards for",
      playerId
    );
    return [];
  }

  async getSeasonCards(seasonId: string): Promise<CardEvent[]> {
    console.log(
      "🚫 Sportradar API disabled - returning empty season cards for",
      seasonId
    );
    return [];
  }

  // 🚫 PRIVATE METHODS DISABLED
  private extractSportRadarEventId(matchId: string): string {
    console.log("🚫 Sportradar ID extraction disabled for", matchId);
    return "";
  }

  private extractCardsData(summaryData: any): CardEvent[] {
    console.log("🚫 Sportradar cards data extraction disabled");
    return [];
  }
}

export const cardsService = new CardsService();
export default cardsService;
