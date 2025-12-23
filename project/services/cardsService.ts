import { FixtureEvent } from "../types/football-fixtures-response";

export interface CardEvent {
  id: string;
  matchId: string;
  type: "yellow" | "red" | "yellow-red";
  player: string;
  team: string;
  teamId: number;
  minute: number;
  reason?: string;
}

export interface MatchCards {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamId: number;
  awayTeamId: number;
  homeCards: CardEvent[];
  awayCards: CardEvent[];
  totalCards: number;
}

class CardsService {
  constructor() {
    console.log("✅ CardsService: Initialized with real fixture data support");
  }

  /**
   * Extract cards data from fixture events with enhanced detection
   */
  extractCardsFromEvents(
    events: FixtureEvent[] | null,
    matchId: string,
    homeTeamName: string,
    awayTeamName: string,
    homeTeamId: number | null,
    awayTeamId: number | null,
  ): MatchCards | null {
    if (!events || !homeTeamId || !awayTeamId) {
      console.log(
        `🔍 CardsService: No events or team IDs for match ${matchId}`,
      );
      return null;
    }

    // Enhanced card event filtering with more card types
    const cardEvents = events
      .filter(
        (event) =>
          event.type === "Card" &&
          event.detail &&
          (event.detail.includes("Yellow") ||
            event.detail.includes("Red") ||
            event.detail.includes("Card")),
      )
      .map((event) =>
        this.convertEventToCardEvent(
          event,
          matchId,
          homeTeamName,
          awayTeamName,
          homeTeamId,
          awayTeamId,
        ),
      )
      .filter(Boolean) as CardEvent[];

    const homeCards = cardEvents.filter((card) => card.teamId === homeTeamId);
    const awayCards = cardEvents.filter((card) => card.teamId === awayTeamId);

    // Log card detection for verification
    if (cardEvents.length > 0) {
      console.log(
        `🟨🟥 Match ${matchId}: ${homeTeamName} (${homeCards.length}) vs ${awayTeamName} (${awayCards.length}) cards`,
      );
    }

    return {
      matchId,
      homeTeam: homeTeamName,
      awayTeam: awayTeamName,
      homeTeamId,
      awayTeamId,
      homeCards,
      awayCards,
      totalCards: cardEvents.length,
    };
  }

  /**
   * Get match cards from fixture events
   */
  async getMatchCards(
    events: FixtureEvent[] | null,
    matchId: string,
    homeTeamName: string,
    awayTeamName: string,
    homeTeamId: number | null,
    awayTeamId: number | null,
  ): Promise<MatchCards | null> {
    try {
      return this.extractCardsFromEvents(
        events,
        matchId,
        homeTeamName,
        awayTeamName,
        homeTeamId,
        awayTeamId,
      );
    } catch (error) {
      console.error("Error extracting match cards:", error);
      return null;
    }
  }

  /**
   * Get cards count for quick display (compact mode) with enhanced detection
   */
  getCardsCount(events: FixtureEvent[] | null): {
    yellow: number;
    red: number;
    total: number;
  } {
    if (!events) {
      return { yellow: 0, red: 0, total: 0 };
    }

    // Enhanced card detection - catch more card variations
    const cardEvents = events.filter(
      (event) =>
        event.type === "Card" &&
        event.detail &&
        (event.detail.includes("Yellow") ||
          event.detail.includes("Red") ||
          event.detail.toLowerCase().includes("card")),
    );

    const yellow = cardEvents.filter(
      (event) =>
        event.detail?.includes("Yellow") && !event.detail?.includes("Second"),
    ).length;

    const red = cardEvents.filter(
      (event) =>
        event.detail?.includes("Red") ||
        event.detail?.includes("Second Yellow"),
    ).length;

    return {
      yellow,
      red,
      total: yellow + red,
    };
  }

  /**
   * Get team-specific cards from events with enhanced detection
   */
  getTeamCards(
    events: FixtureEvent[] | null,
    teamId: number,
    matchId: string,
  ): CardEvent[] {
    if (!events) return [];

    const teamCards = events
      .filter(
        (event) =>
          event.type === "Card" &&
          event.team.id === teamId &&
          event.detail &&
          (event.detail.includes("Yellow") ||
            event.detail.includes("Red") ||
            event.detail.toLowerCase().includes("card")),
      )
      .map((event) =>
        this.convertEventToCardEvent(
          event,
          matchId,
          event.team.name || "Unknown",
          event.team.name || "Unknown",
          teamId,
          teamId,
        ),
      )
      .filter(Boolean) as CardEvent[];

    // Log team-specific cards for verification
    if (teamCards.length > 0) {
      console.log(
        `🎯 Team ${teamId}: ${teamCards.length} cards in match ${matchId}`,
      );
    }

    return teamCards;
  }

  /**
   * Check if a player has received a red card or second yellow
   */
  isPlayerSentOff(events: FixtureEvent[] | null, playerId: number): boolean {
    if (!events) return false;

    return events.some(
      (event) =>
        event.type === "Card" &&
        event.player.id === playerId &&
        (event.detail === "Red Card" || event.detail === "Second Yellow Card"),
    );
  }

  /**
   * Get cards by minute ranges (useful for statistics)
   */
  getCardsByMinuteRange(
    events: FixtureEvent[] | null,
    startMinute: number,
    endMinute: number,
  ): CardEvent[] {
    if (!events) return [];

    return events
      .filter(
        (event) =>
          event.type === "Card" &&
          event.time.elapsed !== null &&
          event.time.elapsed >= startMinute &&
          event.time.elapsed <= endMinute &&
          (event.detail === "Yellow Card" ||
            event.detail === "Red Card" ||
            event.detail === "Second Yellow Card"),
      )
      .map((event) =>
        this.convertEventToCardEvent(
          event,
          "temp",
          event.team.name || "Unknown",
          event.team.name || "Unknown",
          event.team.id || 0,
          event.team.id || 0,
        ),
      )
      .filter(Boolean) as CardEvent[];
  }

  /**
   * Private method to convert FixtureEvent to CardEvent with enhanced detection
   */
  private convertEventToCardEvent(
    event: FixtureEvent,
    matchId: string,
    homeTeamName: string,
    awayTeamName: string,
    homeTeamId: number,
    awayTeamId: number,
  ): CardEvent | null {
    if (
      !event.team.id ||
      !event.player.name ||
      !event.time.elapsed ||
      !event.detail
    ) {
      return null;
    }

    let cardType: "yellow" | "red" | "yellow-red" = "yellow";

    // Enhanced card type detection
    const detail = event.detail.toLowerCase();
    if (detail.includes("red") && !detail.includes("second")) {
      cardType = "red";
    } else if (detail.includes("second") && detail.includes("yellow")) {
      cardType = "yellow-red";
    } else if (detail.includes("yellow")) {
      cardType = "yellow";
    }

    const isHome = event.team.id === homeTeamId;
    const teamName = isHome ? homeTeamName : awayTeamName;

    // Create unique card event
    const cardEvent: CardEvent = {
      id: `${matchId}_${event.team.id}_${event.player.id}_${event.time.elapsed}_${Date.now()}`,
      matchId,
      type: cardType,
      player: event.player.name,
      team: teamName,
      teamId: event.team.id,
      minute: event.time.elapsed,
      reason: event.comments || event.detail,
    };

    // Log individual card for verification
    console.log(
      `🟨 Card detected: ${cardType} for ${event.player.name} (${teamName}) at ${event.time.elapsed}'`,
    );

    return cardEvent;
  }

  /**
   * Format cards for display (useful for UI components)
   */
  formatCardsForDisplay(cards: CardEvent[]): string {
    if (cards.length === 0) return "";

    const yellowCards = cards.filter((card) => card.type === "yellow").length;
    const redCards = cards.filter(
      (card) => card.type === "red" || card.type === "yellow-red",
    ).length;

    const parts = [];
    if (yellowCards > 0) parts.push(`${yellowCards}Y`);
    if (redCards > 0) parts.push(`${redCards}R`);

    return parts.join(" ");
  }

  /**
   * Get disciplinary statistics for a match
   */
  getDisciplinaryStats(events: FixtureEvent[] | null): {
    totalCards: number;
    yellowCards: number;
    redCards: number;
    secondYellowCards: number;
    homeCards: number;
    awayCards: number;
    cardsByHalf: { firstHalf: number; secondHalf: number };
  } {
    const defaultStats = {
      totalCards: 0,
      yellowCards: 0,
      redCards: 0,
      secondYellowCards: 0,
      homeCards: 0,
      awayCards: 0,
      cardsByHalf: { firstHalf: 0, secondHalf: 0 },
    };

    if (!events) return defaultStats;

    const cardEvents = events.filter(
      (event) =>
        event.type === "Card" &&
        (event.detail === "Yellow Card" ||
          event.detail === "Red Card" ||
          event.detail === "Second Yellow Card"),
    );

    const yellowCards = cardEvents.filter(
      (event) => event.detail === "Yellow Card",
    ).length;
    const redCards = cardEvents.filter(
      (event) => event.detail === "Red Card",
    ).length;
    const secondYellowCards = cardEvents.filter(
      (event) => event.detail === "Second Yellow Card",
    ).length;

    const firstHalfCards = cardEvents.filter(
      (event) => event.time.elapsed !== null && event.time.elapsed <= 45,
    ).length;
    const secondHalfCards = cardEvents.length - firstHalfCards;

    return {
      totalCards: cardEvents.length,
      yellowCards,
      redCards,
      secondYellowCards,
      homeCards: 0, // Would need team context to calculate
      awayCards: 0, // Would need team context to calculate
      cardsByHalf: {
        firstHalf: firstHalfCards,
        secondHalf: secondHalfCards,
      },
    };
  }
}

export const cardsService = new CardsService();
export default cardsService;
