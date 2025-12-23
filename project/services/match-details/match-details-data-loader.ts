import { createApiSportsService } from "@/services/api-sports-service";
import teamLogoService from "@/services/teamLogoService";
import teamRankingsService from "@/services/teamRankingsService";
import { matchDetailsDataService } from "@/services/match-details-data-service";
import { leagueNormalizationService } from "@/services/leagueNormalizationService";
import type {
  MatchWithRating,
  MatchStats,
  WeatherData,
  EnhancedWeatherData,
  LineupData,
  MatchEvent,
  ComprehensiveTeamData,
  HeadToHeadData,
} from "@/types/match-details/match-details";

export interface MatchDataLoaderConfig {
  apiKey: string;
  enableCaching?: boolean;
  cacheExpiry?: number;
  retryAttempts?: number;
  timeout?: number;
}

export class MatchDetailsDataLoader {
  private apiSportsService: any;
  private fallbackData: any;

  constructor(config: MatchDataLoaderConfig) {
    this.apiSportsService = createApiSportsService(config.apiKey, {
      enableCaching: config.enableCaching ?? true,
      cacheExpiry: config.cacheExpiry ?? 5 * 60 * 1000, // 5 minutes
      retryAttempts: config.retryAttempts ?? 3,
      timeout: config.timeout ?? 30000, // Increased default timeout
    });

    // Initialize fallback data for when APIs fail
    this.fallbackData = {
      stats: {
        possession: { home: 50, away: 50 },
        attacks: { home: 45, away: 38 },
        dangerousAttacks: { home: 12, away: 8 },
        shotsOnTarget: { home: 3, away: 2 },
        shotsOffTarget: { home: 4, away: 3 },
        corners: { home: 5, away: 3 },
        yellowCards: { home: 2, away: 1 },
        redCards: { home: 0, away: 0 },
      },
    };
  }

  // Retry helper with exponential backoff
  private async withRetry<T>(
    operation: () => Promise<T>,
    context: string,
    maxRetries: number = 3,
  ): Promise<T> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === maxRetries) {
          console.error(`❌ Final attempt failed for ${context}:`, error);
          throw error;
        }

        const delay = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s
        console.warn(
          `⚠️ Attempt ${attempt} failed for ${context}, retrying in ${delay}ms...`,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
    throw new Error("Max retries exceeded");
  }

  // Load match statistics - REAL API DATA (Football & Basketball)
  async loadMatchStats(matchId: string, sport: string = "football"): Promise<MatchStats | null> {
    if (!matchId) return null;

    try {
      console.log(`📊 Loading REAL ${sport} match statistics for fixture ${matchId}`);
      
      // ✅ BASKETBALL: Different API structure for basketball stats
      if (sport === "basketball") {
        const statisticsResponse = await this.apiSportsService.getMatchStatistics(
          parseInt(matchId),
          sport
        );

        if (statisticsResponse?.response?.length > 0) {
          const realStats = statisticsResponse.response[0];
          
          // Basketball stats have different structure
          const formattedStats = {
            possession: { home: 50, away: 50 }, // Not typically tracked in basketball
            points: {
              home: realStats.statistics?.[0]?.points || 0,
              away: realStats.statistics?.[1]?.points || 0,
            },
            fieldGoals: {
              home: realStats.statistics?.[0]?.fieldGoalsMade || 0,
              away: realStats.statistics?.[1]?.fieldGoalsMade || 0,
            },
            threePointers: {
              home: realStats.statistics?.[0]?.threePointersMade || 0,
              away: realStats.statistics?.[1]?.threePointersMade || 0,
            },
            freeThrows: {
              home: realStats.statistics?.[0]?.freeThrowsMade || 0,
              away: realStats.statistics?.[1]?.freeThrowsMade || 0,
            },
            rebounds: {
              home: realStats.statistics?.[0]?.totalRebounds || 0,
              away: realStats.statistics?.[1]?.totalRebounds || 0,
            },
            assists: {
              home: realStats.statistics?.[0]?.assists || 0,
              away: realStats.statistics?.[1]?.assists || 0,
            },
            fouls: {
              home: realStats.statistics?.[0]?.fouls || 0,
              away: realStats.statistics?.[1]?.fouls || 0,
            },
          };

          console.log("✅ Real basketball statistics loaded:", formattedStats);
          return formattedStats as any;
        }
      } else {
        // ✅ FOOTBALL: Original football statistics logic
        const statisticsResponse = await this.apiSportsService.getMatchStatistics(
          parseInt(matchId),
          sport
        );
        const playerStatsResponse =
          await this.apiSportsService.getMatchPlayerStats(parseInt(matchId));

        if (statisticsResponse?.response?.length > 0) {
          const realStats = statisticsResponse.response[0];
          const playerStats = playerStatsResponse?.response || [];

          // Helper function to safely find statistics
          const findStat = (teamIndex: number, type: string): string => {
            if (
              !realStats?.statistics ||
              !Array.isArray(realStats.statistics[teamIndex])
            ) {
              return "0";
            }
            return (
              realStats.statistics[teamIndex]?.find((s: any) => s.type === type)
                ?.value || "0"
            );
          };

          // Convert API response to our format
          const formattedStats = {
            possession: {
              home: parseInt(
                findStat(0, "Ball Possession").replace("%", "") || "50",
              ),
              away: parseInt(
                findStat(1, "Ball Possession").replace("%", "") || "50",
              ),
            },
            shots: {
              home: parseInt(findStat(0, "Total Shots")),
              away: parseInt(findStat(1, "Total Shots")),
            },
            shotsOnTarget: {
              home: parseInt(findStat(0, "Shots on Goal")),
              away: parseInt(findStat(1, "Shots on Goal")),
            },
            corners: {
              home: parseInt(findStat(0, "Corner Kicks")),
              away: parseInt(findStat(1, "Corner Kicks")),
            },
            fouls: {
              home: parseInt(findStat(0, "Fouls")),
              away: parseInt(findStat(1, "Fouls")),
            },
            cards: {
              home: parseInt(findStat(0, "Yellow Cards")),
              away: parseInt(findStat(1, "Yellow Cards")),
            },
            redCards: {
              home: parseInt(findStat(0, "Red Cards")),
              away: parseInt(findStat(1, "Red Cards")),
            },
            passes: {
              home: parseInt(findStat(0, "Total passes")),
              away: parseInt(findStat(1, "Total passes")),
            },
            passesAccurate: {
              home: parseInt(findStat(0, "Passes accurate")),
              away: parseInt(findStat(1, "Passes accurate")),
            },
            playerStats: playerStats,
          };

          console.log("✅ Real football statistics loaded:", formattedStats);
          return formattedStats as any;
        }
      }
      
      console.log(`⚠️ No statistics available for ${sport}, returning fallback data`);
      return {
        possession: { home: 50, away: 50 },
        attacks: { home: 0, away: 0 },
        dangerousAttacks: { home: 0, away: 0 },
        shotsOnTarget: { home: 0, away: 0 },
        shotsOffTarget: { home: 0, away: 0 },
        corners: { home: 0, away: 0 },
        offsides: { home: 0, away: 0 },
        fouls: { home: 0, away: 0 },
        saves: { home: 0, away: 0 },
        yellowCards: { home: 0, away: 0 },
        redCards: { home: 0, away: 0 },
      } as any;
    } catch (error) {
      console.error(`Error loading ${sport} match stats:`, error);
      return null;
    }
  }

  // Load weather data
  async loadWeatherData(): Promise<{
    weather: WeatherData | null;
    enhanced: EnhancedWeatherData | null;
  }> {
    try {
      const weather = await matchDetailsDataService.fetchWeatherData();

      const enhancedWeather = {
        temperature: weather?.temperature || "22°C",
        condition: weather?.condition || "Clear",
        humidity: weather?.humidity || "45%",
        windSpeed: weather?.windSpeed || "2.5m/s",
        pressure: weather?.pressure || "1013hPa",
        icon: weather?.icon || "🌤️",
        visibility: "10km",
        uvIndex: "5",
        feelsLike: "24°C",
      };

      return { weather, enhanced: enhancedWeather };
    } catch (error) {
      console.error("Error fetching weather data:", error);
      return { weather: null, enhanced: null };
    }
  }

  // Load lineup data - REAL API DATA
  async loadLineupData(
    matchId: string,
    match: MatchWithRating,
  ): Promise<LineupData | null> {
    if (!matchId || !match) return null;

    try {
      console.log(`⚽ Loading REAL lineup data for fixture ${matchId}`);
      const lineupsResponse = await this.apiSportsService.getMatchLineups(
        parseInt(matchId),
      );

      if (lineupsResponse?.response?.length > 0) {
        const lineups = lineupsResponse.response;
        const homeLineup =
          lineups.find((l: any) => l.team.name === match.home.name) ||
          lineups[0];
        const awayLineup =
          lineups.find((l: any) => l.team.name === match.away.name) ||
          lineups[1];

        // Combine starters and substitutes into a single players array with enhanced data
        const homeStarters =
          homeLineup?.startXI?.map((player: any) => ({
            id: player.player?.id?.toString() || "unknown",
            name: player.player?.name || "Unknown Player",
            number: player.player?.number || 0,
            position: player.player?.pos || "N/A",
            isStarting: true,
            photo: player.player?.photo || undefined,
            grid: player.player?.grid || undefined,
          })) || [];

        const homeSubstitutes =
          homeLineup?.substitutes?.map((player: any) => ({
            id: player.player?.id?.toString() || "unknown",
            name: player.player?.name || "Unknown Player",
            number: player.player?.number || 0,
            position: player.player?.pos || "N/A",
            isStarting: false,
            photo: player.player?.photo || undefined,
            grid: player.player?.grid || undefined,
          })) || [];

        const awayStarters =
          awayLineup?.startXI?.map((player: any) => ({
            id: player.player?.id?.toString() || "unknown",
            name: player.player?.name || "Unknown Player",
            number: player.player?.number || 0,
            position: player.player?.pos || "N/A",
            isStarting: true,
            photo: player.player?.photo || undefined,
            grid: player.player?.grid || undefined,
          })) || [];

        const awaySubstitutes =
          awayLineup?.substitutes?.map((player: any) => ({
            id: player.player?.id?.toString() || "unknown",
            name: player.player?.name || "Unknown Player",
            number: player.player?.number || 0,
            position: player.player?.pos || "N/A",
            isStarting: false,
            photo: player.player?.photo || undefined,
            grid: player.player?.grid || undefined,
          })) || [];

        const formattedLineup = {
          homeTeam: {
            formation: homeLineup?.formation || "4-4-2",
            players: [...homeStarters, ...homeSubstitutes],
            coach: homeLineup?.coach
              ? {
                  id: homeLineup.coach.id?.toString() || "unknown",
                  name: homeLineup.coach.name || "Unknown Coach",
                  photo: homeLineup.coach.photo || undefined,
                }
              : undefined,
            colors: homeLineup?.team?.colors
              ? {
                  primary:
                    homeLineup.team.colors.player?.primary || "#FF0000",
                  secondary:
                    homeLineup.team.colors.player?.number || "#FFFFFF",
                  text: homeLineup.team.colors.player?.border || "#000000",
                }
              : undefined,
          },
          awayTeam: {
            formation: awayLineup?.formation || "4-4-2",
            players: [...awayStarters, ...awaySubstitutes],
            coach: awayLineup?.coach
              ? {
                  id: awayLineup.coach.id?.toString() || "unknown",
                  name: awayLineup.coach.name || "Unknown Coach",
                  photo: awayLineup.coach.photo || undefined,
                }
              : undefined,
            colors: awayLineup?.team?.colors
              ? {
                  primary: awayLineup.team.colors.player?.primary || "#0000FF",
                  secondary:
                    awayLineup.team.colors.player?.number || "#FFFFFF",
                  text: awayLineup.team.colors.player?.border || "#000000",
                }
              : undefined,
          },
        };

        console.log("✅ Real lineup data loaded successfully");
        return formattedLineup;
      } else {
        console.log("⚠️ No lineup data available from API");
        return null;
      }
    } catch (error) {
      console.error("Error loading lineup data:", error);
      return null;
    }
  }

  // Load betting odds - REAL API DATA
  async loadBettingOdds(matchId: string): Promise<any> {
    if (!matchId) return null;

    try {
      console.log(`💰 Loading betting odds for fixture ${matchId}`);

      // Check if getMatchOdds method exists on the API service
      if (typeof this.apiSportsService.getMatchOdds === "function") {
        const oddsResponse = await this.apiSportsService.getMatchOdds(
          parseInt(matchId),
        );

        if (oddsResponse?.response?.length > 0) {
          console.log("✅ Real betting odds loaded successfully");
          return oddsResponse.response;
        }
      }

      // Fallback: Generate odds using our internal service
      console.log("📊 Using fallback odds generation");
      const fallbackOdds = {
        homeWin: (2.1 + Math.random() * 1.5).toFixed(2),
        draw: (3.2 + Math.random() * 0.8).toFixed(2),
        awayWin: (2.8 + Math.random() * 1.2).toFixed(2),
        bookmaker: "Generated",
        lastUpdate: new Date().toISOString(),
      };

      console.log("✅ Fallback betting odds generated");
      return fallbackOdds;
    } catch (error) {
      console.error("Error loading betting odds:", error);

      // Return fallback odds even on error
      return {
        homeWin: "2.10",
        draw: "3.40",
        awayWin: "3.20",
        bookmaker: "Fallback",
        lastUpdate: new Date().toISOString(),
      };
    }
  }

  // Load team rankings - REAL API DATA
  async loadTeamRankings(match: MatchWithRating): Promise<{
    home: number | null;
    away: number | null;
  }> {
    if (!match) return { home: null, away: null };

    try {
      console.log(`🏆 Loading REAL team rankings for match`);
      const fixtureResponse = await this.apiSportsService.getFixtureById(
        parseInt(match.id || "0"),
      );

      let leagueId = null;
      let isInternational = false;

      if (fixtureResponse?.response?.length > 0) {
        const fixture = fixtureResponse.response[0];
        leagueId = fixture.league.id;
        // Check if it's an international competition
        isInternational = isInternationalCompetition(fixture.league.name);
      }

      // Get league country from fixture if available
      const leagueCountry = fixtureResponse?.response?.[0]?.league?.country || null;

      const [homeRanking, awayRanking] = await Promise.all([
        teamRankingsService.getTeamRankingForDisplay(
          null,
          match.home.name,
          isInternational ? null : leagueId,
          match.league,
          leagueCountry,
        ),
        teamRankingsService.getTeamRankingForDisplay(
          null,
          match.away.name,
          isInternational ? null : leagueId,
          match.league,
          leagueCountry,
        ),
      ]);

      const rankings = {
        home: homeRanking || null,
        away: awayRanking || null,
      };

      console.log("✅ Real team rankings loaded:", rankings);
      return rankings;
    } catch (error) {
      console.error("Error loading team rankings:", error);
      return { home: null, away: null };
    }
  }

  // Load real fixture data with team logos - REAL API DATA (Football & Basketball)
  async loadRealFixtureData(
    matchId: string,
    match: MatchWithRating,
    sport: string = "football"
  ): Promise<MatchWithRating | null> {
    if (!matchId || !match) return null;

    try {
      console.log(`🔥 Loading REAL ${sport} fixture data for ${matchId}`);

      // Use retry logic for API calls
      const [fixtureResponse, statisticsResponse] = await Promise.allSettled([
        this.withRetry(
          () => this.apiSportsService.getFixtureById(parseInt(matchId), sport),
          `${sport} fixture data for ${matchId}`,
        ),
        this.withRetry(
          () => this.apiSportsService.getMatchStatistics(parseInt(matchId), sport),
          `${sport} statistics for ${matchId}`,
        ),
      ]);

      const fixtureData =
        fixtureResponse.status === "fulfilled" ? fixtureResponse.value : null;
      const statisticsData =
        statisticsResponse.status === "fulfilled"
          ? statisticsResponse.value
          : null;

      if (fixtureData && (fixtureData as any)?.response?.length > 0) {
        const fixture = (fixtureData as any).response[0];

        // Helper function to find statistics
        const findStat = (teamIndex: number, type: string): string => {
          if (
            !statisticsData ||
            !(statisticsData as any)?.response?.length ||
            !(statisticsData as any).response[0]?.statistics ||
            !Array.isArray(
              (statisticsData as any).response[0].statistics[teamIndex],
            )
          ) {
            return "0";
          }
          return (
            (statisticsData as any).response[0].statistics[teamIndex]?.find(
              (s: any) => s.type === type,
            )?.value || "0"
          );
        };

        // Enhanced status mapping with time-based logic and sport support
        const mapStatus = (
          apiStatus: string,
          fixtureDate: string,
          sport: string
        ): "upcoming" | "live" | "finished" => {
          const status = apiStatus.toUpperCase();
          const fixtureTime = new Date(fixtureDate).getTime();
          const now = Date.now();
          const timeDiff = now - fixtureTime;

          // Check if match should have started based on time
          const shouldHaveStarted = timeDiff > 2 * 60 * 1000; // 2 minutes past start time

          // ✅ BASKETBALL STATUS MAPPING
          if (sport === "basketball") {
            if (status === "NS" || status === "TBD" || status === "CANC" || status === "PST") {
              if (shouldHaveStarted && timeDiff < 3 * 60 * 60 * 1000) {
                console.log(`🏀 Status override: ${status} → LIVE (time-based)`);
                return "live";
              }
              return "upcoming";
            }
            if (status === "FT" || status === "AOT" || status === "AWD") {
              return "finished";
            }
            // Live statuses: Q1, Q2, Q3, Q4, HT, OT, BT
            return "live";
          }

          // ✅ FOOTBALL STATUS MAPPING
          // ✅ FIX: Explicitly check for LIVE status first
          if (status === "LIVE") {
            return "live";
          }
          if (
            status === "NS" ||
            status === "TBD" ||
            status === "CANC" ||
            status === "PST"
          ) {
            // If API says NS but time suggests it should have started, treat as live
            if (shouldHaveStarted && timeDiff < 2 * 60 * 60 * 1000) {
              console.log(`⚽ Status override: ${status} → LIVE (time-based)`);
              return "live";
            }
            return "upcoming";
          }
          if (
            status === "FT" ||
            status === "AET" ||
            status === "PEN" ||
            status === "AWD"
          ) {
            return "finished";
          }
          // Live statuses: 1H, 2H, HT, ET, BT, P, SUSP, INT
          return "live";
        };

        // Get halftime score if available
        const getHalftimeScore = (): string => {
          if (fixture.score?.halftime) {
            return `${fixture.score.halftime.home || 0}-${fixture.score.halftime.away || 0}`;
          }
          return "0-0";
        };

        const enhancedMatch = {
          ...match,
          home: {
            ...match.home,
            name: fixture.teams.home.name || match.home.name,
            logo: fixture.teams.home.logo || match.home.logo || undefined, // API only, no fallback
            corners: sport === "football" ? (parseInt(findStat(0, "Corner Kicks")) || 0) : (match.home.corners || 0),
          },
          away: {
            ...match.away,
            name: fixture.teams.away.name || match.away.name,
            logo: fixture.teams.away.logo || match.away.logo || undefined, // API only, no fallback
            corners: sport === "football" ? (parseInt(findStat(1, "Corner Kicks")) || 0) : (match.away.corners || 0),
          },
          league: fixture.league.name || match.league,
          // ✅ BASKETBALL FIX: Use scores.home.total for basketball, goals for football
          score: sport === "basketball" 
            ? `${fixture.scores?.home?.total || 0}-${fixture.scores?.away?.total || 0}`
            : `${fixture.goals?.home || 0}-${fixture.goals?.away || 0}`,
          status: mapStatus(fixture.fixture.status.short || fixture.status?.short, fixture.fixture.date || fixture.date, sport),
          statusText: fixture.fixture.status.short || fixture.status?.short,
          halftimeScore: getHalftimeScore(),
          startTime: fixture.fixture.date || fixture.date || match.startTime,
          time: fixture.fixture.date || fixture.date || match.time,
          fixture: {
            status: {
              short: fixture.fixture.status?.short || fixture.status?.short,
              long: fixture.fixture.status?.long || fixture.status?.long,
              elapsed: fixture.fixture.status?.elapsed || fixture.status?.timer,
            },
          },
          // Add extra time and penalty data if available
          extraTime: fixture.score?.extratime
            ? {
                home: fixture.score.extratime.home || 0,
                away: fixture.score.extratime.away || 0,
              }
            : undefined,
          penalties: fixture.score?.penalty
            ? {
                home: fixture.score.penalty.home || 0,
                away: fixture.score.penalty.away || 0,
              }
            : undefined,
          // ✅ BASKETBALL: Add quarters data
          quarters: sport === "basketball" && fixture.scores
            ? {
                home: [
                  fixture.scores.home?.quarter_1 ?? null,
                  fixture.scores.home?.quarter_2 ?? null,
                  fixture.scores.home?.quarter_3 ?? null,
                  fixture.scores.home?.quarter_4 ?? null,
                ],
                away: [
                  fixture.scores.away?.quarter_1 ?? null,
                  fixture.scores.away?.quarter_2 ?? null,
                  fixture.scores.away?.quarter_3 ?? null,
                  fixture.scores.away?.quarter_4 ?? null,
                ],
              }
            : undefined,
        };

        console.log(`✅ Real ${sport} fixture data loaded with enhanced data:`, {
          status: enhancedMatch.status,
          statusText: enhancedMatch.statusText,
          score: enhancedMatch.score,
          halftimeScore: enhancedMatch.halftimeScore,
          elapsed: fixture.fixture.status?.elapsed || fixture.status?.timer,
          corners: sport === "football" ? {
            home: enhancedMatch.home.corners,
            away: enhancedMatch.away.corners,
          } : "N/A",
        });
        return enhancedMatch;
      } else {
        console.log(`⚠️ No ${sport} fixture data available from API`);
        return match;
      }
    } catch (error) {
      const errorMessage = (error as any)?.message || "Unknown error";

      if (errorMessage.toLowerCase().includes("timeout")) {
        console.error(
          `⏰ API timeout while loading ${sport} fixture data for match ${matchId} - using fallback data:`,
          errorMessage,
        );
      } else if (errorMessage.toLowerCase().includes("network")) {
        console.error(
          `🌐 Network error loading ${sport} fixture data for match ${matchId}:`,
          errorMessage,
        );
      } else {
        console.error(
          `❌ Error loading ${sport} fixture data for match ${matchId}:`,
          errorMessage,
        );
      }

      // Return match with fallback data to prevent complete failure
      return {
        ...match,
        status: match.status || "scheduled",
        statusText: match.statusText || "Match data temporarily unavailable",
        // Ensure basic structure is maintained
        home: match.home || { name: "Home Team", logo: "" },
        away: match.away || { name: "Away Team", logo: "" },
      };
    }
  }

  // Load match events - REAL API DATA (Football & Basketball)
  async loadMatchEvents(matchId: string, sport: string = "football"): Promise<MatchEvent[]> {
    if (!matchId) return [];

    try {
      console.log(`⚡ Loading REAL match events for ${sport} fixture ${matchId}`);
      const eventsResponse = await this.apiSportsService.getMatchEvents(
        parseInt(matchId),
        sport
      );

      if (eventsResponse?.response?.length > 0) {
        const events = eventsResponse.response
          .map((event: any) => {
            // Handle both football and basketball event structures
            const elapsed = sport === "basketball" 
              ? (event.time?.minute || event.minute || "0")
              : (event.time?.elapsed?.toString() || "0");
            
            // Map event type based on sport
            let eventType = "commentary";
            if (sport === "basketball") {
              // Basketball event types: score, foul, timeout, substitution, etc.
              const bballType = event.type?.toLowerCase() || "";
              if (bballType.includes("score") || bballType.includes("point")) eventType = "goal";
              else if (bballType.includes("foul")) eventType = "yellow_card";
              else if (bballType.includes("substitut")) eventType = "substitution";
              else eventType = bballType;
            } else {
              // Football event types
              eventType = event.type?.toLowerCase() || "commentary";
            }
            
            // Get team info
            const teamName = event.team?.name || event.team || "";
            const team = teamName.toLowerCase().includes("home") || event.team?.id === "home" 
              ? "home" 
              : "away";
            
            return {
              id: `${elapsed}-${eventType}-${Math.random()}`,
              minute: elapsed,
              type: eventType,
              team: team,
              player: event.player?.name || event.player || "",
              assist: event.assist?.name || event.assist || "",
              detail: event.detail || event.comment || "",
              comments: event.comments || event.description || "",
              timestamp: new Date(),
              isImportant: ["goal", "penalty", "red card", "score"].includes(
                eventType.toLowerCase(),
              ),
            };
          })
          .sort((a: any, b: any) => {
            const minuteA = parseInt(a.minute) || 0;
            const minuteB = parseInt(b.minute) || 0;
            return minuteB - minuteA; // Newest first
          });

        console.log(`✅ Loaded ${events.length} real ${sport} match events`);
        return events;
      } else {
        console.log(`⚠️ No match events available from API for ${sport}`);
        return [];
      }
    } catch (error) {
      if ((error as any)?.response?.status === 403) {
        console.error("🚫 403 Forbidden Error - API Key Authentication Failed");
      }
      console.error(`Error loading ${sport} match events:`, error);
      return [];
    }
  }

  // Load team data - REAL API DATA
  async loadTeamData(
    matchId: string,
    match: MatchWithRating,
  ): Promise<{
    homeTeamData: ComprehensiveTeamData | null;
    awayTeamData: ComprehensiveTeamData | null;
    headToHeadData: HeadToHeadData | null;
  }> {
    if (!matchId || !match) {
      return { homeTeamData: null, awayTeamData: null, headToHeadData: null };
    }

    try {
      console.log(`🏆 Loading REAL team data for fixture ${matchId}`);
      const fixtureResponse = await this.apiSportsService.getFixtureById(
        parseInt(matchId),
      );

      if (fixtureResponse?.response?.length > 0) {
        const fixture = fixtureResponse.response[0];
        const homeTeamId = fixture.teams.home.id;
        const awayTeamId = fixture.teams.away.id;
        const leagueId = fixture.league.id;
        const season =
          (fixture.league as any).season || new Date().getFullYear();

        // Load team info and statistics
        const [homeTeamInfo, awayTeamInfo, homeStats, awayStats, h2hData] =
          await Promise.allSettled([
            this.apiSportsService.getTeamInfo(homeTeamId || 0),
            this.apiSportsService.getTeamInfo(awayTeamId || 0),
            this.apiSportsService.getTeamStatistics(
              homeTeamId || 0,
              leagueId || 0,
              season,
            ),
            this.apiSportsService.getTeamStatistics(
              awayTeamId || 0,
              leagueId || 0,
              season,
            ),
            this.apiSportsService.getHeadToHead(
              homeTeamId || 0,
              awayTeamId || 0,
            ),
          ]);

        // Process results
        const homeData =
          homeTeamInfo.status === "fulfilled" &&
          homeStats.status === "fulfilled"
            ? {
                team: homeTeamInfo.value?.response?.[0] || null,
                statistics: homeStats.value?.response || null,
              }
            : null;

        const awayData =
          awayTeamInfo.status === "fulfilled" &&
          awayStats.status === "fulfilled"
            ? {
                team: awayTeamInfo.value?.response?.[0] || null,
                statistics: awayStats.value?.response || null,
              }
            : null;

        const headToHead =
          h2hData.status === "fulfilled"
            ? h2hData.value?.response || null
            : null;

        console.log("✅ Real team data loaded successfully");
        return {
          homeTeamData: homeData as any,
          awayTeamData: awayData as any,
          headToHeadData: headToHead,
        };
      }
    } catch (error) {
      console.error("Error fetching team data:", error);
    }

    return { homeTeamData: null, awayTeamData: null, headToHeadData: null };
  }

  // Update live data for live matches (Football & Basketball)
  async updateLiveData(
    matchId: string,
    match: MatchWithRating,
    sport: string = "football"
  ): Promise<{
    updatedMatch: MatchWithRating | null;
    currentMinute: number;
  }> {
    if (!matchId || !match) return { updatedMatch: null, currentMinute: 0 };

    try {
      console.log(`🔄 Updating live ${sport} data for match ${matchId}`);

      // Get real-time fixture data with full update
      const updatedMatch = await this.loadRealFixtureData(matchId, match, sport);

      if (updatedMatch) {
        const elapsed = updatedMatch.fixture?.status?.elapsed || 0;

        console.log(
          `✅ Live ${sport} data updated - Status: ${updatedMatch.status}, Score: ${updatedMatch.score}, Elapsed: ${elapsed}'`,
        );

        return { updatedMatch, currentMinute: elapsed };
      }
    } catch (error) {
      console.error(`Error updating live ${sport} data:`, error);
    }

    return { updatedMatch: match, currentMinute: 0 };
  }

  // Load all data for a match
  async loadAllMatchData(
    matchId: string,
    match: MatchWithRating,
    sport: string = "football"
  ): Promise<{
    matchStats: MatchStats | null;
    weather: WeatherData | null;
    enhancedWeather: EnhancedWeatherData | null;
    lineupData: LineupData | null;
    bettingOdds: any;
    teamRankings: { home: number | null; away: number | null };
    matchEvents: MatchEvent[];
    homeTeamData: ComprehensiveTeamData | null;
    awayTeamData: ComprehensiveTeamData | null;
    headToHeadData: HeadToHeadData | null;
    updatedMatch: MatchWithRating;
  }> {
    console.log(`🚀 Loading ALL REAL DATA for ${sport} match ${matchId}`);

    try {
      // Load fixture data first with error handling
      const updatedMatch = await this.withRetry(
        () => this.loadRealFixtureData(matchId, match, sport), // ✅ Pass sport
        `${sport} fixture data for ${matchId}`,
        2, // Reduced retries for fixture data
      ).catch((error) => {
        console.error(`❌ Failed to load ${sport} fixture data for ${matchId}:`, error);
        return match; // Fallback to original match
      });

      // Load other data in parallel with error logging
      const [
        matchStats,
        weatherData,
        lineupData,
        bettingOdds,
        teamRankings,
        matchEvents,
        teamData,
      ] = await Promise.allSettled([
        this.loadMatchStats(matchId, sport), // ✅ Pass sport
        this.loadWeatherData(),
        this.loadLineupData(matchId, updatedMatch || match),
        this.loadBettingOdds(matchId),
        this.loadTeamRankings(updatedMatch || match),
        this.loadMatchEvents(matchId, sport), // ✅ Pass sport parameter
        this.loadTeamData(matchId, updatedMatch || match),
      ]);

      // Log any failed requests
      const failedRequests: string[] = [];
      if (matchStats.status === "rejected") failedRequests.push("matchStats");
      if (weatherData.status === "rejected") failedRequests.push("weatherData");
      if (lineupData.status === "rejected") failedRequests.push("lineupData");
      if (bettingOdds.status === "rejected") failedRequests.push("bettingOdds");
      if (teamRankings.status === "rejected")
        failedRequests.push("teamRankings");
      if (matchEvents.status === "rejected") failedRequests.push("matchEvents");
      if (teamData.status === "rejected") failedRequests.push("teamData");

      if (failedRequests.length > 0) {
        console.warn(
          `⚠️ Some requests failed for match ${matchId}:`,
          failedRequests.join(", "),
        );
      }

      const weather =
        weatherData.status === "fulfilled" ? weatherData.value.weather : null;
      const enhancedWeather =
        weatherData.status === "fulfilled" ? weatherData.value.enhanced : null;
      const teamDataResult =
        teamData.status === "fulfilled"
          ? teamData.value
          : { homeTeamData: null, awayTeamData: null, headToHeadData: null };

      console.log("✅ ALL REAL DATA loading completed");

      return {
        matchStats: matchStats.status === "fulfilled" ? matchStats.value : null,
        weather,
        enhancedWeather,
        lineupData: lineupData.status === "fulfilled" ? lineupData.value : null,
        bettingOdds:
          bettingOdds.status === "fulfilled" ? bettingOdds.value : null,
        teamRankings:
          teamRankings.status === "fulfilled"
            ? teamRankings.value
            : { home: null, away: null },
        matchEvents:
          matchEvents.status === "fulfilled" ? matchEvents.value : [],
        homeTeamData: teamDataResult.homeTeamData,
        awayTeamData: teamDataResult.awayTeamData,
        headToHeadData: teamDataResult.headToHeadData,
        updatedMatch: updatedMatch || match,
      };
    } catch (error) {
      console.error(
        `❌ Critical error in loadAllMatchData for ${matchId}:`,
        error,
      );

      // Return minimal safe data structure
      return {
        matchStats: null,
        weather: null,
        enhancedWeather: null,
        lineupData: null,
        bettingOdds: null,
        teamRankings: { home: null, away: null },
        matchEvents: [],
        homeTeamData: null,
        awayTeamData: null,
        headToHeadData: null,
        updatedMatch: match,
      };
    }
  }
}

// Helper function to get API key
export const getApiKey = (): string => {
  const key =
    process.env.EXPO_PUBLIC_API_FOOTBALL_KEY ||
    process.env.EXPO_PUBLIC_API_SPORT_KEY ||
    process.env.EXPO_PUBLIC_THE_SPORTSDB_API_KEY ||
    process.env.EXPO_API_FOOTBALL_KEY;

  // Debug logging for API key
  console.log("🔍 API Key Debug:");
  console.log(
    "EXPO_PUBLIC_API_FOOTBALL_KEY:",
    process.env.EXPO_PUBLIC_API_FOOTBALL_KEY ? "✅ Set" : "❌ Not set",
  );
  console.log(
    "EXPO_PUBLIC_API_SPORT_KEY:",
    process.env.EXPO_PUBLIC_API_SPORT_KEY ? "✅ Set" : "❌ Not set",
  );
  console.log(
    "EXPO_PUBLIC_THE_SPORTSDB_API_KEY:",
    process.env.EXPO_PUBLIC_THE_SPORTSDB_API_KEY ? "✅ Set" : "❌ Not set",
  );
  console.log(
    "EXPO_API_FOOTBALL_KEY:",
    process.env.EXPO_API_FOOTBALL_KEY ? "✅ Set" : "❌ Not set",
  );
  console.log(
    "Final API key:",
    key ? `✅ Found (${key.substring(0, 8)}...)` : "❌ No API key found",
  );

  return key || "";
};

// Helper function to check if a competition is international
function isInternationalCompetition(leagueName: string): boolean {
  const internationalKeywords = [
    "World Cup",
    "Euro",
    "European Championship",
    "Copa America",
    "Africa Cup",
    "AFCON",
    "Asian Cup",
    "CONCACAF",
    "Gold Cup",
    "Nations League",
    "International",
    "Qualifiers",
    "FIFA",
    "Olympics",
    "Confederations",
    "Friendly",
  ];

  return internationalKeywords.some((keyword) =>
    leagueName.toLowerCase().includes(keyword.toLowerCase()),
  );
}

// Export singleton instance with enhanced configuration
export const matchDetailsDataLoader = new MatchDetailsDataLoader({
  apiKey: getApiKey(),
  enableCaching: true,
  cacheExpiry: 5 * 60 * 1000, // 5 minutes
  retryAttempts: 2, // Reduced to prevent excessive retries
  timeout: 25000, // 25 seconds - balanced timeout
});
