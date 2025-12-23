// services/match-details-stats-service.ts
import {
  MatchStats,
  TeamWithRating,
  MatchWithRating,
} from "../types/match-details/match-details";
import {
  calculateInitialTeamRatings,
  calculateDynamicRatings,
  generateComprehensivePlayerStats,
} from "@/utils/match-details/old-helpers";

export interface StatsCalculationOptions {
  matchId: string;
  matchStatus: string;
  realData?: any;
  existingCorners?: { home: number; away: number };
  currentMinute?: number;
}

export interface TeamRatings {
  home: number;
  away: number;
}

export interface OddsCalculation {
  handicap: Array<{
    bookmaker: string;
    handicap: string;
    homeOdd: string;
    awayOdd: string;
    trend: "up" | "down";
    isBlocked: boolean;
  }>;
  winDrawLoss: Array<{
    bookmaker: string;
    homeWin: string;
    draw: string;
    awayWin: string;
    trend: "up" | "down";
    isBlocked: boolean;
  }>;
  totalGoals: Array<{
    bookmaker: string;
    line: string;
    overOdd: string;
    underOdd: string;
    trend: "up" | "down";
    isBlocked: boolean;
  }>;
  corners: Array<{
    bookmaker: string;
    line: string;
    overOdd: string;
    underOdd: string;
    trend: "up" | "down";
    isBlocked: boolean;
  }>;
}

export interface PlayerStats {
  id: string;
  name: string;
  position: string;
  rating: number;
  goals: number;
  assists: number;
  passes: number;
  passAccuracy: number;
  tackles: number;
  interceptions: number;
  fouls: number;
  yellowCards: number;
  redCards: number;
  minutesPlayed: number;
  team: "home" | "away";
}

export interface PerformanceAnalytics {
  teamStrength: {
    home: number;
    away: number;
  };
  attackingPower: {
    home: number;
    away: number;
  };
  defensiveSolidity: {
    home: number;
    away: number;
  };
  formIndex: {
    home: number;
    away: number;
  };
  momentumScore: {
    home: number;
    away: number;
  };
}

export class MatchDetailsStatsService {
  private static instance: MatchDetailsStatsService;
  private seedValue: number = 0;

  public static getInstance(): MatchDetailsStatsService {
    if (!MatchDetailsStatsService.instance) {
      MatchDetailsStatsService.instance = new MatchDetailsStatsService();
    }
    return MatchDetailsStatsService.instance;
  }

  /**
   * Generate seeded random number for consistent statistics
   */
  private seedRandom(seed?: number): number {
    if (seed !== undefined) {
      this.seedValue = seed;
    }
    this.seedValue = (this.seedValue * 9301 + 49297) % 233280;
    return this.seedValue / 233280;
  }

  /**
   * Create deterministic seed from match ID
   */
  private createSeedFromMatchId(matchId: string): number {
    let hash = 0;
    for (let i = 0; i < matchId.length; i++) {
      hash = ((hash << 5) - hash + matchId.charCodeAt(i)) & 0xffffffff;
    }
    return Math.abs(hash) / 0xffffffff;
  }

  /**
   * Create statistical range with seed
   */
  private createStatRange(baseSeed: number, min: number, max: number): number {
    return Math.floor(min + baseSeed * (max - min));
  }

  /**
   * Generate enhanced match statistics
   */
  public generateEnhancedMatchStats(
    options: StatsCalculationOptions,
  ): MatchStats {
    const { matchId, matchStatus, realData, existingCorners } = options;

    // For upcoming matches, return 50/50 balanced stats
    if (matchStatus === "upcoming") {
      console.log("📊 Generating 50/50 stats for upcoming match");
      return {
        possession: { home: 50, away: 50 },
        attacks: { home: 10, away: 10 },
        dangerousAttacks: { home: 5, away: 5 },
        shotsOnTarget: { home: 0, away: 0 },
        shotsOffTarget: { home: 0, away: 0 },
        corners: { home: 0, away: 0 },
        fouls: { home: 0, away: 0 },
        yellowCards: { home: 0, away: 0 },
        redCards: { home: 0, away: 0 },
        offsides: { home: 0, away: 0 },
        saves: { home: 0, away: 0 },
      };
    }

    // Create deterministic seed for consistency
    const seed = this.createSeedFromMatchId(matchId);

    // Generate multiple seeds for different stats
    const possessionSeed = (seed * 2) % 1;
    const attackSeed = (seed * 3) % 1;
    const dangerSeed = (seed * 5) % 1;
    const shotSeed = (seed * 7) % 1;
    const shotOffSeed = (seed * 11) % 1;
    const cornerSeed = (seed * 13) % 1;
    const foulSeed = (seed * 17) % 1;
    const cardSeed = (seed * 19) % 1;
    const redSeed = (seed * 23) % 1;
    const offsideSeed = (seed * 29) % 1;
    const saveSeed = (seed * 31) % 1;

    // Calculate possession with realistic variance
    const possessionVariance = Math.floor(possessionSeed * 30) - 15; // ±15%
    const homePossession = Math.max(30, Math.min(70, 50 + possessionVariance));
    const awayPossession = 100 - homePossession;

    // Use real data if available
    let corners, fouls, yellowCards, redCards, offsides, possession;

    if (realData) {
      console.log("✅ Using real statistics data from API");

      corners =
        realData.corners &&
        (realData.corners.home > 0 || realData.corners.away > 0)
          ? realData.corners
          : existingCorners || { home: 0, away: 0 };

      fouls = realData.fouls || {
        home: this.createStatRange(foulSeed, 5, 20),
        away: this.createStatRange((foulSeed * 2) % 1, 5, 20),
      };

      yellowCards = realData.yellowCards || { home: 0, away: 0 };

      redCards = realData.redCards || { home: 0, away: 0 };

      offsides = realData.offsides || {
        home: this.createStatRange(offsideSeed, 0, 8),
        away: this.createStatRange((offsideSeed * 2) % 1, 0, 8),
      };

      possession =
        realData.possession &&
        (realData.possession.home > 0 || realData.possession.away > 0)
          ? realData.possession
          : { home: 50, away: 50 };
    } else {
      console.log("⚠️ Generating realistic statistics data");

      corners = { home: 0, away: 0 };

      fouls = {
        home: this.createStatRange(foulSeed, 5, 20),
        away: this.createStatRange((foulSeed * 2) % 1, 5, 20),
      };

      yellowCards = { home: 0, away: 0 };

      redCards = { home: 0, away: 0 };

      offsides = {
        home: this.createStatRange(offsideSeed, 0, 8),
        away: this.createStatRange((offsideSeed * 2) % 1, 0, 8),
      };

      possession = { home: homePossession, away: awayPossession };
    }

    return {
      possession,
      attacks: {
        home: this.createStatRange(attackSeed, 8, 25),
        away: this.createStatRange((attackSeed * 2) % 1, 8, 25),
      },
      dangerousAttacks: {
        home: this.createStatRange(dangerSeed, 2, 15),
        away: this.createStatRange((dangerSeed * 2) % 1, 2, 15),
      },
      shotsOnTarget: {
        home: this.createStatRange(shotSeed, 0, 12),
        away: this.createStatRange((shotSeed * 2) % 1, 0, 12),
      },
      shotsOffTarget: {
        home: this.createStatRange(shotOffSeed, 0, 15),
        away: this.createStatRange((shotOffSeed * 2) % 1, 0, 15),
      },
      corners,
      fouls,
      yellowCards,
      redCards,
      offsides,
      saves: {
        home: this.createStatRange(saveSeed, 0, 10),
        away: this.createStatRange((saveSeed * 2) % 1, 0, 10),
      },
    };
  }

  /**
   * Get statistics for specific match period
   */
  public getStatsForPeriod(
    period: "full" | "first" | "second" | "extratime",
    matchStats: MatchStats | null,
    match: MatchWithRating | null,
    currentMinute?: number,
  ): MatchStats {
    const stats = matchStats || this.getDefaultStats();
    const matchStatus = match?.status || "upcoming";

    // Enhanced extra time detection
    const isExtraTimeMatch = (): boolean => {
      if (!match) return false;
      const status = match.status?.toUpperCase() || "";
      const timeStr = match.time?.toString().toUpperCase() || "";
      return (
        status.includes("ET") ||
        status === "ET" ||
        status.includes("EXTRA") ||
        status.includes("OVERTIME") ||
        timeStr.includes("ET") ||
        status === "AET" ||
        status === "BT" ||
        (match.time && Number(match.time) > 90) ||
        (currentMinute !== undefined && currentMinute > 90)
      );
    };

    // Upcoming matches: balanced data for all periods
    if (matchStatus === "upcoming") {
      return this.getBalancedStats();
    }

    // Live matches: smart handling based on current time
    if (matchStatus === "live") {
      const minute = currentMinute || 0;
      return this.getLiveStatsForPeriod(
        period,
        stats,
        minute,
        isExtraTimeMatch(),
      );
    }

    // Finished matches: calculated data for all periods
    return this.getFinishedStatsForPeriod(period, stats, isExtraTimeMatch());
  }

  /**
   * Get default empty statistics
   */
  private getDefaultStats(): MatchStats {
    return {
      possession: { home: 50, away: 50 },
      attacks: { home: 0, away: 0 },
      dangerousAttacks: { home: 0, away: 0 },
      shotsOnTarget: { home: 0, away: 0 },
      shotsOffTarget: { home: 0, away: 0 },
      corners: { home: 0, away: 0 },
      fouls: { home: 0, away: 0 },
      yellowCards: { home: 0, away: 0 },
      redCards: { home: 0, away: 0 },
      offsides: { home: 0, away: 0 },
      saves: { home: 0, away: 0 },
    };
  }

  /**
   * Get balanced 50/50 statistics
   */
  private getBalancedStats(): MatchStats {
    return {
      attacks: { home: 10, away: 10 },
      dangerousAttacks: { home: 5, away: 5 },
      possession: { home: 50, away: 50 },
      shotsOnTarget: { home: 0, away: 0 },
      shotsOffTarget: { home: 0, away: 0 },
      corners: { home: 0, away: 0 },
      fouls: { home: 0, away: 0 },
      yellowCards: { home: 0, away: 0 },
      redCards: { home: 0, away: 0 },
      offsides: { home: 0, away: 0 },
      saves: { home: 0, away: 0 },
    };
  }

  /**
   * Get live statistics for specific period
   */
  private getLiveStatsForPeriod(
    period: string,
    stats: MatchStats,
    minute: number,
    isExtraTime: boolean,
  ): MatchStats {
    switch (period) {
      case "first":
        return this.getFirstHalfStats(stats, minute);
      case "second":
        return this.getSecondHalfStats(stats, minute);
      case "extratime":
        return isExtraTime
          ? this.getExtraTimeStats(stats, minute)
          : this.getBalancedStats();
      case "full":
      default:
        return this.getFullTimeStats(stats, minute);
    }
  }

  /**
   * Get finished match statistics for specific period
   */
  private getFinishedStatsForPeriod(
    period: string,
    stats: MatchStats,
    isExtraTime: boolean,
  ): MatchStats {
    switch (period) {
      case "first":
        return this.getCalculatedFirstHalfStats(stats);
      case "second":
        return this.getCalculatedSecondHalfStats(stats);
      case "extratime":
        return isExtraTime
          ? this.getCalculatedExtraTimeStats(stats)
          : this.getBalancedStats();
      default:
        return stats;
    }
  }

  /**
   * Calculate first half statistics
   */
  private getFirstHalfStats(stats: MatchStats, minute: number): MatchStats {
    if (minute >= 45) {
      return this.getCalculatedFirstHalfStats(stats);
    } else {
      const progressRatio = minute / 45;
      return this.applyProgressRatio(
        stats,
        {
          attacks: 0.5,
          dangerousAttacks: 0.4,
          possession: 0.95,
          shotsOnTarget: 0.6,
          shotsOffTarget: 0.5,
          corners: 0.4,
          yellowCards: 0.3,
          fouls: 0.6,
          offsides: 0.5,
          saves: 0.4,
        },
        progressRatio,
      );
    }
  }

  /**
   * Calculate second half statistics
   */
  private getSecondHalfStats(stats: MatchStats, minute: number): MatchStats {
    if (minute > 45 && minute <= 90) {
      const secondHalfProgress = (minute - 45) / 45;
      return this.getSecondHalfProgressStats(stats, secondHalfProgress);
    } else {
      return {
        ...this.getBalancedStats(),
        attacks: { home: 5, away: 5 },
        dangerousAttacks: { home: 2, away: 2 },
      };
    }
  }

  /**
   * Calculate extra time statistics
   */
  private getExtraTimeStats(stats: MatchStats, minute: number): MatchStats {
    const extraTimeProgress = Math.min(1, Math.max(0, (minute - 90) / 30));
    return this.applyProgressRatio(
      stats,
      {
        attacks: 0.3,
        dangerousAttacks: 0.25,
        shotsOnTarget: 0.2,
        shotsOffTarget: 0.15,
        corners: 0.4,
        yellowCards: 0.2,
        redCards: 0.1,
        fouls: 0.25,
        offsides: 0.2,
        saves: 0.3,
      },
      extraTimeProgress,
      {
        possession: {
          home: Math.round(60 - extraTimeProgress * 10),
          away: Math.round(40 + extraTimeProgress * 10),
        },
      },
    );
  }

  /**
   * Calculate full time statistics
   */
  private getFullTimeStats(stats: MatchStats, minute: number): MatchStats {
    if (minute >= 90) {
      return stats;
    } else {
      const matchProgress = minute / 90;
      return this.applyProgressRatio(
        stats,
        {
          attacks: 1,
          dangerousAttacks: 1,
          shotsOnTarget: 1,
          shotsOffTarget: 1,
          corners: 1,
          yellowCards: 1,
          redCards: 1,
          fouls: 1,
          offsides: 1,
          saves: 1,
        },
        matchProgress,
        {
          possession: stats.possession,
        },
      );
    }
  }

  /**
   * Get calculated first half statistics for finished matches
   */
  private getCalculatedFirstHalfStats(stats: MatchStats): MatchStats {
    return {
      attacks: {
        home: Math.round(stats.attacks.home * 0.5),
        away: Math.round(stats.attacks.away * 0.6),
      },
      dangerousAttacks: {
        home: Math.round(stats.dangerousAttacks.home * 0.4),
        away: Math.round(stats.dangerousAttacks.away * 0.7),
      },
      possession: {
        home: Math.round(stats.possession.home * 0.95),
        away: Math.round(stats.possession.away * 1.05),
      },
      shotsOnTarget: {
        home: Math.round(stats.shotsOnTarget.home * 0.6),
        away: Math.round(stats.shotsOnTarget.away * 0.4),
      },
      shotsOffTarget: {
        home: Math.round(stats.shotsOffTarget.home * 0.5),
        away: Math.round(stats.shotsOffTarget.away * 0.3),
      },
      corners: {
        home: Math.round(stats.corners.home * 0.4),
        away: Math.round(stats.corners.away * 0.6),
      },
      yellowCards: {
        home: Math.round(stats.yellowCards.home * 0.3),
        away: Math.round(stats.yellowCards.away * 0.7),
      },
      redCards: { home: 0, away: 0 },
      fouls: {
        home: Math.round(stats.fouls.home * 0.6),
        away: Math.round(stats.fouls.away * 0.4),
      },
      offsides: {
        home: Math.round(stats.offsides.home * 0.5),
        away: Math.round(stats.offsides.away * 0.5),
      },
      saves: {
        home: Math.round(stats.saves.home * 0.4),
        away: Math.round(stats.saves.away * 0.6),
      },
    };
  }

  /**
   * Get calculated second half statistics for finished matches
   */
  private getCalculatedSecondHalfStats(stats: MatchStats): MatchStats {
    return {
      attacks: {
        home: stats.attacks.home - Math.round(stats.attacks.home * 0.5),
        away: stats.attacks.away - Math.round(stats.attacks.away * 0.6),
      },
      dangerousAttacks: {
        home:
          stats.dangerousAttacks.home -
          Math.round(stats.dangerousAttacks.home * 0.4),
        away:
          stats.dangerousAttacks.away -
          Math.round(stats.dangerousAttacks.away * 0.7),
      },
      possession: {
        home: 100 - Math.round(stats.possession.home * 0.95),
        away: 100 - Math.round(stats.possession.away * 1.05),
      },
      shotsOnTarget: {
        home:
          stats.shotsOnTarget.home - Math.round(stats.shotsOnTarget.home * 0.6),
        away:
          stats.shotsOnTarget.away - Math.round(stats.shotsOnTarget.away * 0.4),
      },
      shotsOffTarget: {
        home:
          stats.shotsOffTarget.home -
          Math.round(stats.shotsOffTarget.home * 0.5),
        away:
          stats.shotsOffTarget.away -
          Math.round(stats.shotsOffTarget.away * 0.3),
      },
      corners: {
        home: stats.corners.home - Math.round(stats.corners.home * 0.4),
        away: stats.corners.away - Math.round(stats.corners.away * 0.6),
      },
      yellowCards: {
        home: stats.yellowCards.home - Math.round(stats.yellowCards.home * 0.3),
        away: stats.yellowCards.away - Math.round(stats.yellowCards.away * 0.7),
      },
      redCards: { home: stats.redCards.home, away: stats.redCards.away },
      fouls: {
        home: stats.fouls.home - Math.round(stats.fouls.home * 0.6),
        away: stats.fouls.away - Math.round(stats.fouls.away * 0.4),
      },
      offsides: {
        home: stats.offsides.home - Math.round(stats.offsides.home * 0.5),
        away: stats.offsides.away - Math.round(stats.offsides.away * 0.5),
      },
      saves: {
        home: stats.saves.home - Math.round(stats.saves.home * 0.4),
        away: stats.saves.away - Math.round(stats.saves.away * 0.6),
      },
    };
  }

  /**
   * Get calculated extra time statistics
   */
  private getCalculatedExtraTimeStats(stats: MatchStats): MatchStats {
    return this.applyProgressRatio(
      stats,
      {
        attacks: 0.3,
        dangerousAttacks: 0.25,
        shotsOnTarget: 0.2,
        shotsOffTarget: 0.15,
        corners: 0.4,
        yellowCards: 0.2,
        redCards: 0.1,
        fouls: 0.25,
        offsides: 0.2,
        saves: 0.3,
      },
      1,
      {
        possession: { home: 50, away: 50 },
      },
    );
  }

  /**
   * Get second half progress statistics
   */
  private getSecondHalfProgressStats(
    stats: MatchStats,
    progress: number,
  ): MatchStats {
    return {
      attacks: {
        home: Math.round(
          (stats.attacks.home - Math.round(stats.attacks.home * 0.5)) *
            progress,
        ),
        away: Math.round(
          (stats.attacks.away - Math.round(stats.attacks.away * 0.6)) *
            progress,
        ),
      },
      dangerousAttacks: {
        home: Math.round(
          (stats.dangerousAttacks.home -
            Math.round(stats.dangerousAttacks.home * 0.4)) *
            progress,
        ),
        away: Math.round(
          (stats.dangerousAttacks.away -
            Math.round(stats.dangerousAttacks.away * 0.7)) *
            progress,
        ),
      },
      possession: {
        home: 100 - Math.round(stats.possession.home * 0.95),
        away: 100 - Math.round(stats.possession.away * 1.05),
      },
      shotsOnTarget: {
        home: Math.round(
          (stats.shotsOnTarget.home -
            Math.round(stats.shotsOnTarget.home * 0.6)) *
            progress,
        ),
        away: Math.round(
          (stats.shotsOnTarget.away -
            Math.round(stats.shotsOnTarget.away * 0.4)) *
            progress,
        ),
      },
      shotsOffTarget: {
        home: Math.round(
          (stats.shotsOffTarget.home -
            Math.round(stats.shotsOffTarget.home * 0.5)) *
            progress,
        ),
        away: Math.round(
          (stats.shotsOffTarget.away -
            Math.round(stats.shotsOffTarget.away * 0.3)) *
            progress,
        ),
      },
      corners: {
        home: Math.round(
          (stats.corners.home - Math.round(stats.corners.home * 0.4)) *
            progress,
        ),
        away: Math.round(
          (stats.corners.away - Math.round(stats.corners.away * 0.6)) *
            progress,
        ),
      },
      yellowCards: {
        home: Math.round(
          (stats.yellowCards.home - Math.round(stats.yellowCards.home * 0.3)) *
            progress,
        ),
        away: Math.round(
          (stats.yellowCards.away - Math.round(stats.yellowCards.away * 0.7)) *
            progress,
        ),
      },
      redCards: {
        home: Math.round(stats.redCards.home * progress),
        away: Math.round(stats.redCards.away * progress),
      },
      fouls: {
        home: Math.round(
          (stats.fouls.home - Math.round(stats.fouls.home * 0.6)) * progress,
        ),
        away: Math.round(
          (stats.fouls.away - Math.round(stats.fouls.away * 0.4)) * progress,
        ),
      },
      offsides: {
        home: Math.round(
          (stats.offsides.home - Math.round(stats.offsides.home * 0.5)) *
            progress,
        ),
        away: Math.round(
          (stats.offsides.away - Math.round(stats.offsides.away * 0.5)) *
            progress,
        ),
      },
      saves: {
        home: Math.round(
          (stats.saves.home - Math.round(stats.saves.home * 0.4)) * progress,
        ),
        away: Math.round(
          (stats.saves.away - Math.round(stats.saves.away * 0.6)) * progress,
        ),
      },
    };
  }

  /**
   * Apply progress ratio to statistics
   */
  private applyProgressRatio(
    stats: MatchStats,
    multipliers: Record<string, number>,
    progress: number,
    overrides?: Partial<MatchStats>,
  ): MatchStats {
    const result: MatchStats = {
      attacks: {
        home: Math.round(
          stats.attacks.home * (multipliers.attacks || 1) * progress,
        ),
        away: Math.round(
          stats.attacks.away * (multipliers.attacks || 1) * progress,
        ),
      },
      dangerousAttacks: {
        home: Math.round(
          stats.dangerousAttacks.home *
            (multipliers.dangerousAttacks || 1) *
            progress,
        ),
        away: Math.round(
          stats.dangerousAttacks.away *
            (multipliers.dangerousAttacks || 1) *
            progress,
        ),
      },
      possession: overrides?.possession || {
        home: Math.round(stats.possession.home * (multipliers.possession || 1)),
        away: Math.round(stats.possession.away * (multipliers.possession || 1)),
      },
      shotsOnTarget: {
        home: Math.round(
          stats.shotsOnTarget.home *
            (multipliers.shotsOnTarget || 1) *
            progress,
        ),
        away: Math.round(
          stats.shotsOnTarget.away *
            (multipliers.shotsOnTarget || 1) *
            progress,
        ),
      },
      shotsOffTarget: {
        home: Math.round(
          stats.shotsOffTarget.home *
            (multipliers.shotsOffTarget || 1) *
            progress,
        ),
        away: Math.round(
          stats.shotsOffTarget.away *
            (multipliers.shotsOffTarget || 1) *
            progress,
        ),
      },
      corners: {
        home: Math.round(
          stats.corners.home * (multipliers.corners || 1) * progress,
        ),
        away: Math.round(
          stats.corners.away * (multipliers.corners || 1) * progress,
        ),
      },
      yellowCards: {
        home: Math.round(
          stats.yellowCards.home * (multipliers.yellowCards || 1) * progress,
        ),
        away: Math.round(
          stats.yellowCards.away * (multipliers.yellowCards || 1) * progress,
        ),
      },
      redCards: {
        home: Math.round(
          stats.redCards.home * (multipliers.redCards || 1) * progress,
        ),
        away: Math.round(
          stats.redCards.away * (multipliers.redCards || 1) * progress,
        ),
      },
      fouls: {
        home: Math.round(
          stats.fouls.home * (multipliers.fouls || 1) * progress,
        ),
        away: Math.round(
          stats.fouls.away * (multipliers.fouls || 1) * progress,
        ),
      },
      offsides: {
        home: Math.round(
          stats.offsides.home * (multipliers.offsides || 1) * progress,
        ),
        away: Math.round(
          stats.offsides.away * (multipliers.offsides || 1) * progress,
        ),
      },
      saves: {
        home: Math.round(
          stats.saves.home * (multipliers.saves || 1) * progress,
        ),
        away: Math.round(
          stats.saves.away * (multipliers.saves || 1) * progress,
        ),
      },
    };

    return { ...result, ...overrides };
  }

  /**
   * Calculate team ratings
   */
  public calculateTeamRatings(
    homeTeam: string,
    awayTeam: string,
    league: string,
    matchId: string,
  ): TeamRatings {
    return calculateInitialTeamRatings(homeTeam, awayTeam, league, matchId);
  }

  /**
   * Calculate dynamic ratings
   */
  public calculateDynamicTeamRatings(
    homeTeam: string,
    awayTeam: string,
    league: string,
    matchId: string,
    currentMinute: number,
  ): TeamRatings {
    // Use initial ratings for now as the old helper function signature changed
    return calculateInitialTeamRatings(homeTeam, awayTeam, league, matchId);
  }

  /**
   * Generate comprehensive odds calculation
   */
  public generateOddsCalculation(
    homeTeam: string,
    awayTeam: string,
    matchId: string,
    matchStats?: MatchStats,
  ): OddsCalculation {
    const seed = this.createSeedFromMatchId(matchId);
    this.seedRandom(seed);

    const bookmakers = [
      "Bet365",
      "William Hill",
      "Paddy Power",
      "Ladbrokes",
      "Coral",
      "Sky Bet",
      "BetVictor",
      "Unibet",
      "888sport",
      "BetFred*",
      "Marathon*",
    ];

    const generateHandicapOdds = (): OddsCalculation["handicap"] => {
      const homeRating = this.calculateTeamRatings(
        homeTeam,
        awayTeam,
        "Premier League",
        matchId,
      ).home;
      const awayRating = this.calculateTeamRatings(
        homeTeam,
        awayTeam,
        "Premier League",
        matchId,
      ).away;
      const strengthDifference = homeRating - awayRating;

      const handicap =
        strengthDifference > 0
          ? -(Math.abs(strengthDifference) * 0.5 + 0.25)
          : Math.abs(strengthDifference) * 0.5 + 0.25;

      return bookmakers.map((bookie) => {
        const variation = (this.seedRandom() - 0.5) * 0.1;
        const baseHomeOdd = 0.9 + strengthDifference * 0.02;
        const baseAwayOdd = 0.9 - strengthDifference * 0.02;

        const homeOdd = Math.max(0.75, Math.min(1.05, baseHomeOdd + variation));
        const awayOdd = Math.max(0.75, Math.min(1.05, baseAwayOdd - variation));

        return {
          bookmaker: bookie,
          handicap: handicap.toFixed(2),
          homeOdd: homeOdd.toFixed(2),
          awayOdd: awayOdd.toFixed(2),
          trend: this.seedRandom() > 0.5 ? "up" : "down",
          isBlocked: this.seedRandom() > 0.9,
        };
      });
    };

    const generateWinDrawLossOdds = (): OddsCalculation["winDrawLoss"] => {
      const homeRating = this.calculateTeamRatings(
        homeTeam,
        awayTeam,
        "Premier League",
        matchId,
      ).home;
      const awayRating = this.calculateTeamRatings(
        homeTeam,
        awayTeam,
        "Premier League",
        matchId,
      ).away;

      const homeWinProb = 0.33 + (homeRating - awayRating) * 0.1;
      const awayWinProb = 0.33 - (homeRating - awayRating) * 0.08;
      const drawProb = 1 - homeWinProb - awayWinProb;

      return bookmakers.map((bookie) => {
        const variation = (this.seedRandom() - 0.5) * 0.3;

        const homeWin = Math.max(
          1.2,
          Math.min(8.0, 1 / homeWinProb + variation),
        );
        const draw = Math.max(2.8, Math.min(6.0, 1 / drawProb + variation));
        const awayWin = Math.max(
          1.2,
          Math.min(8.0, 1 / awayWinProb + variation),
        );

        return {
          bookmaker: bookie,
          homeWin: homeWin.toFixed(2),
          draw: draw.toFixed(2),
          awayWin: awayWin.toFixed(2),
          trend: this.seedRandom() > 0.5 ? "up" : "down",
          isBlocked: this.seedRandom() > 0.9,
        };
      });
    };

    const generateTotalGoalsOdds = (): OddsCalculation["totalGoals"] => {
      const homeRating = this.calculateTeamRatings(
        homeTeam,
        awayTeam,
        "Premier League",
        matchId,
      ).home;
      const awayRating = this.calculateTeamRatings(
        homeTeam,
        awayTeam,
        "Premier League",
        matchId,
      ).away;
      const avgRating = (homeRating + awayRating) / 2;

      const line = Math.max(1.5, Math.min(3.5, 2.0 + (avgRating - 70) * 0.02));

      return bookmakers.map((bookie) => {
        const variation = (this.seedRandom() - 0.5) * 0.1;
        const overOdd = Math.max(0.75, Math.min(1.2, 0.9 + variation));
        const underOdd = Math.max(0.75, Math.min(1.2, 0.9 - variation));

        return {
          bookmaker: bookie,
          line: line.toFixed(1),
          overOdd: overOdd.toFixed(2),
          underOdd: underOdd.toFixed(2),
          trend: this.seedRandom() > 0.5 ? "up" : "down",
          isBlocked: this.seedRandom() > 0.9,
        };
      });
    };

    const generateCornerOdds = (): OddsCalculation["corners"] => {
      const homeRating = this.calculateTeamRatings(
        homeTeam,
        awayTeam,
        "Premier League",
        matchId,
      ).home;
      const awayRating = this.calculateTeamRatings(
        homeTeam,
        awayTeam,
        "Premier League",
        matchId,
      ).away;

      const expectedCorners = 8 + (homeRating + awayRating - 140) * 0.05;
      const line = Math.max(7.5, Math.min(12.5, expectedCorners));

      return bookmakers.map((bookie) => {
        const variation = (this.seedRandom() - 0.5) * 0.08;
        const overOdd = Math.max(0.8, Math.min(1.15, 0.88 + variation));
        const underOdd = Math.max(0.8, Math.min(1.15, 0.92 - variation));

        return {
          bookmaker: bookie,
          line: line.toFixed(1),
          overOdd: overOdd.toFixed(2),
          underOdd: underOdd.toFixed(2),
          trend: this.seedRandom() > 0.5 ? "up" : "down",
          isBlocked: this.seedRandom() > 0.9,
        };
      });
    };

    return {
      handicap: generateHandicapOdds(),
      winDrawLoss: generateWinDrawLossOdds(),
      totalGoals: generateTotalGoalsOdds(),
      corners: generateCornerOdds(),
    };
  }

  /**
   * Generate comprehensive player statistics
   */
  public generatePlayerStats(
    team: "home" | "away",
    matchId: string,
    matchStatus?: string,
  ): PlayerStats[] {
    const stats = generateComprehensivePlayerStats(team, matchId, matchStatus);
    return stats.map((player, index) => ({
      id: `${team}-player-${index}`,
      name: player.name,
      position: player.position,
      rating: Math.round(60 + Math.random() * 30), // Generate rating since it's not in original
      goals: player.goals,
      assists: player.assists,
      passes: player.totalPasses || player.passes,
      passAccuracy: player.passAccuracy,
      tackles: player.tackles,
      interceptions: player.interceptions,
      fouls: player.fouls,
      yellowCards: player.yellowCards,
      redCards: player.redCards,
      minutesPlayed: player.timePlayed,
      team: team,
    }));
  }

  /**
   * Calculate performance analytics
   */
  public calculatePerformanceAnalytics(
    homeTeam: string,
    awayTeam: string,
    matchId: string,
    matchStats?: MatchStats,
  ): PerformanceAnalytics {
    const ratings = this.calculateTeamRatings(
      homeTeam,
      awayTeam,
      "Premier League",
      matchId,
    );
    const seed = this.createSeedFromMatchId(matchId);

    // Calculate team strength based on ratings
    const homeStrength = Math.max(0, Math.min(100, ratings.home));
    const awayStrength = Math.max(0, Math.min(100, ratings.away));

    // Calculate attacking power based on stats and ratings
    const homeAttacking = matchStats
      ? Math.round(
          (matchStats.attacks.home + matchStats.dangerousAttacks.home) * 0.7 +
            homeStrength * 0.3,
        )
      : homeStrength;
    const awayAttacking = matchStats
      ? Math.round(
          (matchStats.attacks.away + matchStats.dangerousAttacks.away) * 0.7 +
            awayStrength * 0.3,
        )
      : awayStrength;

    // Calculate defensive solidity (inverse of conceded stats)
    const homeDefensive = matchStats
      ? Math.round(
          100 -
            (matchStats.shotsOnTarget.away + matchStats.dangerousAttacks.away) *
              2 +
            homeStrength * 0.4,
        )
      : homeStrength;
    const awayDefensive = matchStats
      ? Math.round(
          100 -
            (matchStats.shotsOnTarget.home + matchStats.dangerousAttacks.home) *
              2 +
            awayStrength * 0.4,
        )
      : awayStrength;

    // Calculate form index (seed-based consistent form)
    const homeFormSeed = (seed * 7) % 1;
    const awayFormSeed = (seed * 11) % 1;
    const homeForm = Math.round(70 + homeFormSeed * 30);
    const awayForm = Math.round(70 + awayFormSeed * 30);

    // Calculate momentum score
    const homeMomentumSeed = (seed * 13) % 1;
    const awayMomentumSeed = (seed * 17) % 1;
    const homeMomentum = Math.round(50 + (homeMomentumSeed - 0.5) * 60);
    const awayMomentum = Math.round(50 + (awayMomentumSeed - 0.5) * 60);

    return {
      teamStrength: {
        home: homeStrength,
        away: awayStrength,
      },
      attackingPower: {
        home: Math.max(0, Math.min(100, homeAttacking)),
        away: Math.max(0, Math.min(100, awayAttacking)),
      },
      defensiveSolidity: {
        home: Math.max(0, Math.min(100, homeDefensive)),
        away: Math.max(0, Math.min(100, awayDefensive)),
      },
      formIndex: {
        home: homeForm,
        away: awayForm,
      },
      momentumScore: {
        home: Math.max(0, Math.min(100, homeMomentum)),
        away: Math.max(0, Math.min(100, awayMomentum)),
      },
    };
  }

  /**
   * Calculate countdown for match start
   */
  public calculateCountdown(startTime: string): string | null {
    try {
      const matchDate = new Date(
        startTime.replace(/\s*TBD\s*/g, "").replace(" ", "T"),
      );
      const now = new Date();
      const diffMs = matchDate.getTime() - now.getTime();

      if (diffMs <= 0) return null;

      const totalSeconds = Math.floor(diffMs / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      return `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    } catch {
      return null;
    }
  }

  /**
   * Get team analytics data
   */
  public getTeamAnalytics(
    homeTeam: string,
    awayTeam: string,
    matchId: string,
  ): {
    homeAnalytics: any;
    awayAnalytics: any;
  } {
    const seed = this.createSeedFromMatchId(matchId);
    const ratings = this.calculateTeamRatings(
      homeTeam,
      awayTeam,
      "Premier League",
      matchId,
    );

    // Generate consistent analytics based on team ratings and seed
    const generateTeamAnalytics = (
      team: string,
      rating: number,
      teamSeed: number,
    ) => {
      return {
        averageGoalsScored: Math.max(
          0.5,
          Math.min(3.0, 1.2 + (rating - 70) * 0.02 + (teamSeed - 0.5) * 0.5),
        ),
        averageGoalsConceded: Math.max(
          0.3,
          Math.min(2.5, 1.0 - (rating - 70) * 0.015 + (teamSeed - 0.5) * 0.3),
        ),
        cleanSheetPercentage: Math.round(
          Math.max(10, Math.min(70, 30 + (rating - 70) * 0.5 + teamSeed * 20)),
        ),
        averagePossession: Math.round(
          Math.max(
            35,
            Math.min(65, 50 + (rating - 70) * 0.2 + (teamSeed - 0.5) * 10),
          ),
        ),
        averageShots: Math.round(
          Math.max(8, Math.min(20, 12 + (rating - 70) * 0.1 + teamSeed * 4)),
        ),
        averageShotsOnTarget: Math.round(
          Math.max(3, Math.min(10, 5 + (rating - 70) * 0.05 + teamSeed * 2)),
        ),
        averageCorners: Math.round(
          Math.max(3, Math.min(10, 5 + (rating - 70) * 0.04 + teamSeed * 2)),
        ),
        disciplineIndex: Math.round(
          Math.max(20, Math.min(90, 60 + (rating - 70) * 0.3 + teamSeed * 15)),
        ),
      };
    };

    const homeSeed = (seed * 3) % 1;
    const awaySeed = (seed * 5) % 1;

    return {
      homeAnalytics: generateTeamAnalytics(homeTeam, ratings.home, homeSeed),
      awayAnalytics: generateTeamAnalytics(awayTeam, ratings.away, awaySeed),
    };
  }
}

// Export singleton instance
export const matchDetailsStatsService = MatchDetailsStatsService.getInstance();
