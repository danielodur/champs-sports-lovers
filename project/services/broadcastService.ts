import { Fixture } from "../types/football-fixtures-response";

interface BroadcastInfo {
  hasVideoBroadcast: boolean;
  hasAnimationBroadcast: boolean;
  broadcastType: "video" | "animation";
  broadcastQuality?: "HD" | "4K" | "Standard";
  broadcastLanguages?: string[];
}

interface LeagueInfo {
  id: number;
  name: string;
  country: string;
  priority: "high" | "medium" | "low";
  hasRegularBroadcast: boolean;
}

class BroadcastService {
  // Major leagues with regular video broadcasts (based on actual API-Football league IDs)
  private readonly majorLeagues: LeagueInfo[] = [
    // Top European Leagues
    {
      id: 39,
      name: "Premier League",
      country: "England",
      priority: "high",
      hasRegularBroadcast: true,
    },
    {
      id: 140,
      name: "La Liga",
      country: "Spain",
      priority: "high",
      hasRegularBroadcast: true,
    },
    {
      id: 78,
      name: "Bundesliga",
      country: "Germany",
      priority: "high",
      hasRegularBroadcast: true,
    },
    {
      id: 135,
      name: "Serie A",
      country: "Italy",
      priority: "high",
      hasRegularBroadcast: true,
    },
    {
      id: 61,
      name: "Ligue 1",
      country: "France",
      priority: "high",
      hasRegularBroadcast: true,
    },

    // European Competitions
    {
      id: 2,
      name: "UEFA Champions League",
      country: "World",
      priority: "high",
      hasRegularBroadcast: true,
    },
    {
      id: 3,
      name: "UEFA Europa League",
      country: "World",
      priority: "high",
      hasRegularBroadcast: true,
    },
    {
      id: 848,
      name: "UEFA Europa Conference League",
      country: "World",
      priority: "medium",
      hasRegularBroadcast: true,
    },
    {
      id: 5,
      name: "UEFA Nations League",
      country: "World",
      priority: "medium",
      hasRegularBroadcast: true,
    },

    // Domestic Cups
    {
      id: 45,
      name: "FA Cup",
      country: "England",
      priority: "medium",
      hasRegularBroadcast: true,
    },
    {
      id: 48,
      name: "League Cup",
      country: "England",
      priority: "medium",
      hasRegularBroadcast: false,
    },
    {
      id: 143,
      name: "Copa del Rey",
      country: "Spain",
      priority: "medium",
      hasRegularBroadcast: true,
    },
    {
      id: 81,
      name: "DFB-Pokal",
      country: "Germany",
      priority: "medium",
      hasRegularBroadcast: true,
    },
    {
      id: 137,
      name: "Coppa Italia",
      country: "Italy",
      priority: "medium",
      hasRegularBroadcast: true,
    },
    {
      id: 66,
      name: "Coupe de France",
      country: "France",
      priority: "medium",
      hasRegularBroadcast: false,
    },

    // International Tournaments
    {
      id: 1,
      name: "World Cup",
      country: "World",
      priority: "high",
      hasRegularBroadcast: true,
    },
    {
      id: 4,
      name: "Euro Championship",
      country: "World",
      priority: "high",
      hasRegularBroadcast: true,
    },
    {
      id: 9,
      name: "Copa America",
      country: "World",
      priority: "high",
      hasRegularBroadcast: true,
    },

    // Other Major Leagues
    {
      id: 88,
      name: "Eredivisie",
      country: "Netherlands",
      priority: "medium",
      hasRegularBroadcast: true,
    },
    {
      id: 94,
      name: "Primeira Liga",
      country: "Portugal",
      priority: "medium",
      hasRegularBroadcast: true,
    },
    {
      id: 144,
      name: "Belgian Pro League",
      country: "Belgium",
      priority: "medium",
      hasRegularBroadcast: false,
    },
    {
      id: 203,
      name: "Turkish Super League",
      country: "Turkey",
      priority: "medium",
      hasRegularBroadcast: true,
    },

    // Americas
    {
      id: 128,
      name: "Liga MX",
      country: "Mexico",
      priority: "medium",
      hasRegularBroadcast: true,
    },
    {
      id: 253,
      name: "Major League Soccer",
      country: "USA",
      priority: "medium",
      hasRegularBroadcast: true,
    },
    {
      id: 71,
      name: "Brasileirão Serie A",
      country: "Brazil",
      priority: "medium",
      hasRegularBroadcast: true,
    },
    {
      id: 128,
      name: "Argentine Primera División",
      country: "Argentina",
      priority: "medium",
      hasRegularBroadcast: false,
    },

    // Asia & Others
    {
      id: 188,
      name: "J1 League",
      country: "Japan",
      priority: "medium",
      hasRegularBroadcast: false,
    },
    {
      id: 292,
      name: "K League 1",
      country: "South Korea",
      priority: "low",
      hasRegularBroadcast: false,
    },
    {
      id: 169,
      name: "Super League",
      country: "China",
      priority: "low",
      hasRegularBroadcast: false,
    },
  ];

  /**
   * Get broadcast information for a fixture
   */
  public getBroadcastInfo(fixture: Fixture): BroadcastInfo {
    const leagueInfo = this.getLeagueInfo(fixture.league?.id || undefined);
    const matchCharacteristics = this.analyzeMatchCharacteristics(fixture);

    const hasVideoBroadcast = this.determineVideoBroadcast(
      leagueInfo,
      matchCharacteristics,
    );

    return {
      hasVideoBroadcast,
      hasAnimationBroadcast: !hasVideoBroadcast,
      broadcastType: hasVideoBroadcast ? "video" : "animation",
      broadcastQuality: this.determineBroadcastQuality(
        leagueInfo,
        matchCharacteristics,
      ),
      broadcastLanguages: this.getBroadcastLanguages(leagueInfo),
    };
  }

  /**
   * Get league information by ID
   */
  private getLeagueInfo(leagueId?: number): LeagueInfo | null {
    if (!leagueId) return null;
    return this.majorLeagues.find((league) => league.id === leagueId) || null;
  }

  /**
   * Analyze match characteristics for broadcast determination
   */
  private analyzeMatchCharacteristics(fixture: Fixture) {
    const matchDate = new Date(fixture.fixture.date);
    const currentTime = new Date();
    const hourOfDay = matchDate.getHours();
    const dayOfWeek = matchDate.getDay();

    return {
      isLive: ["1H", "2H", "HT", "ET", "BT"].includes(
        fixture.fixture.status.short || "",
      ),
      isFinished: fixture.fixture.status.short === "FT",
      isUpcoming: fixture.fixture.status.short === "NS",
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6, // Saturday or Sunday
      isPrimeTime: hourOfDay >= 19 && hourOfDay <= 22, // 7PM - 10PM
      isEarlyKickoff: hourOfDay >= 12 && hourOfDay <= 15, // 12PM - 3PM
      isLateNight: hourOfDay >= 23 || hourOfDay <= 6, // 11PM - 6AM
      isToday: matchDate.toDateString() === currentTime.toDateString(),
      isThisWeek: this.isWithinDays(matchDate, currentTime, 7),
      hasVenue: !!fixture.fixture.venue?.name,
      isNeutralVenue: fixture.fixture.venue?.name
        ?.toLowerCase()
        .includes("neutral"),
    };
  }

  /**
   * Determine if match has video broadcast based on league and match characteristics
   */
  private determineVideoBroadcast(
    leagueInfo: LeagueInfo | null,
    characteristics: any,
  ): boolean {
    // Always have video broadcast for high priority leagues
    if (leagueInfo?.priority === "high") {
      return true;
    }

    // Live matches get priority
    if (characteristics.isLive) {
      return true;
    }

    // Medium priority leagues with regular broadcasts
    if (leagueInfo?.priority === "medium" && leagueInfo.hasRegularBroadcast) {
      // Weekend prime time matches
      if (characteristics.isWeekend && characteristics.isPrimeTime) {
        return true;
      }
      // Today's matches
      if (characteristics.isToday) {
        return true;
      }
      // Early weekend kickoffs for popular leagues
      if (characteristics.isWeekend && characteristics.isEarlyKickoff) {
        return true;
      }
    }

    // Special cases for international or high-profile matches
    if (leagueInfo?.country === "World") {
      return true;
    }

    // Default to animation broadcast
    return false;
  }

  /**
   * Determine broadcast quality based on league importance and match characteristics
   */
  private determineBroadcastQuality(
    leagueInfo: LeagueInfo | null,
    characteristics: any,
  ): "HD" | "4K" | "Standard" {
    if (!leagueInfo) return "Standard";

    // 4K for top tier matches
    if (
      leagueInfo.priority === "high" &&
      (characteristics.isPrimeTime || characteristics.isLive)
    ) {
      return "4K";
    }

    // HD for major leagues and important matches
    if (
      leagueInfo.priority === "high" ||
      (leagueInfo.priority === "medium" && characteristics.isWeekend)
    ) {
      return "HD";
    }

    return "Standard";
  }

  /**
   * Get available broadcast languages based on league
   */
  private getBroadcastLanguages(leagueInfo: LeagueInfo | null): string[] {
    if (!leagueInfo) return ["en"];

    const languageMap: { [key: string]: string[] } = {
      England: ["en", "ar", "es"],
      Spain: ["es", "en", "ar"],
      Germany: ["de", "en", "ar"],
      Italy: ["it", "en", "ar"],
      France: ["fr", "en", "ar"],
      World: ["en", "es", "fr", "de", "it", "ar", "zh", "pt"],
      Netherlands: ["nl", "en"],
      Portugal: ["pt", "en"],
      Brazil: ["pt", "en", "es"],
      Mexico: ["es", "en"],
      USA: ["en", "es"],
    };

    return languageMap[leagueInfo.country] || ["en"];
  }

  /**
   * Check if date is within specified number of days from reference date
   */
  private isWithinDays(date: Date, referenceDate: Date, days: number): boolean {
    const timeDiff = Math.abs(date.getTime() - referenceDate.getTime());
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    return daysDiff <= days;
  }

  /**
   * Get all leagues with video broadcast capability
   */
  public getVideoEnabledLeagues(): LeagueInfo[] {
    return this.majorLeagues.filter((league) => league.hasRegularBroadcast);
  }

  /**
   * Check if a league typically has video broadcasts
   */
  public isVideoEnabledLeague(leagueId: number): boolean {
    const league = this.getLeagueInfo(leagueId);
    return league?.hasRegularBroadcast || false;
  }

  /**
   * Get broadcast statistics for analytics
   */
  public getBroadcastStats(fixtures: Fixture[]) {
    const stats = {
      totalMatches: fixtures.length,
      videoMatches: 0,
      animationMatches: 0,
      liveMatches: 0,
      upcomingMatches: 0,
      finishedMatches: 0,
      highPriorityLeagues: 0,
      mediumPriorityLeagues: 0,
      lowPriorityLeagues: 0,
    };

    fixtures.forEach((fixture) => {
      const broadcastInfo = this.getBroadcastInfo(fixture);
      const leagueInfo = this.getLeagueInfo(fixture.league?.id || undefined);

      if (broadcastInfo.hasVideoBroadcast) stats.videoMatches++;
      if (broadcastInfo.hasAnimationBroadcast) stats.animationMatches++;

      switch (fixture.fixture.status.short) {
        case "1H":
        case "2H":
        case "HT":
        case "ET":
        case "BT":
          stats.liveMatches++;
          break;
        case "NS":
          stats.upcomingMatches++;
          break;
        case "FT":
          stats.finishedMatches++;
          break;
      }

      switch (leagueInfo?.priority) {
        case "high":
          stats.highPriorityLeagues++;
          break;
        case "medium":
          stats.mediumPriorityLeagues++;
          break;
        case "low":
          stats.lowPriorityLeagues++;
          break;
      }
    });

    return stats;
  }
}

// Export singleton instance
export const broadcastService = new BroadcastService();
export default broadcastService;
