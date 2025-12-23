// services/match-details-data-service.ts
import { sportsApiService } from "./sportsApiService";
import { getWeatherIcon } from "@/utils/match-details/helpers";
import {
  MatchStats,
  TeamWithRating,
  MatchWithRating,
  WeatherData,
  MatchEvent,
  EnhancedWeatherData,
  LineupData,
  TeamFormData,
  HalfTimeFullTimeStats,
  HeadToHeadData,
  TeamDataAnalytics,
  InjuredPlayer,
  TransferPlayer,
  UpcomingMatch,
  LeagueStanding,
  ComprehensiveTeamData,
  SocialUser,
  PostMedia,
  SocialPost,
  PostComment,
  SocialInteraction,
} from "../types/match-details/match-details";
import {
  calculateInitialTeamRatings,
  calculateDynamicRatings,
} from "@/utils/match-details/old-helpers";

export class MatchDetailsDataService {
  /**
   * Fetch weather data from OpenWeather API with fallback
   */
  async fetchWeatherData(): Promise<EnhancedWeatherData> {
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=London&appid=${process.env.EXPO_PUBLIC_WEATHER_API_KEY}&units=metric`,
      );

      if (response.ok) {
        const data = await response.json();
        return {
          temperature: `${Math.round(data.main.temp)}°C`,
          condition: data.weather[0].main,
          humidity: `${data.main.humidity}%`,
          windSpeed: `${data.wind.speed}m/s`,
          pressure: `${data.main.pressure}hPa`,
          icon: getWeatherIcon(data.weather[0].main),
          visibility: `${(data.visibility / 1000).toFixed(1)}km`,
          uvIndex: "6",
          feelsLike: `${Math.round(data.main.feels_like)}°C`,
        };
      }
    } catch (error) {
      console.log("Weather API failed:", error);
    }

    // Fallback data
    return {
      temperature: "22°C",
      condition: "Clear",
      humidity: "45%",
      windSpeed: "2.5m/s",
      pressure: "1013hPa",
      icon: "🌤️",
      visibility: "10km",
      uvIndex: "5",
      feelsLike: "24°C",
    };
  }

  /**
   * Generate realistic player names based on team name and league
   */
  generateRealisticPlayerNames(
    teamName: string,
    league: string,
    matchId: string,
  ): string[] {
    // Create deterministic seed based on team name and matchId
    let seed = 0;
    for (let i = 0; i < (teamName + matchId).length; i++) {
      seed += (teamName + matchId).charCodeAt(i);
    }

    const random = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    // League-specific player names
    const playerNamesByLeague: { [key: string]: string[] } = {
      "Premier League": [
        "Johnson",
        "Smith",
        "Williams",
        "Brown",
        "Jones",
        "Garcia",
        "Miller",
        "Davis",
        "Rodriguez",
        "Martinez",
        "Hernandez",
        "Lopez",
        "Gonzalez",
        "Wilson",
        "Anderson",
        "Thomas",
        "Taylor",
        "Moore",
        "Jackson",
        "Martin",
      ],
      "La Liga": [
        "González",
        "Rodríguez",
        "García",
        "Fernández",
        "López",
        "Martínez",
        "Sánchez",
        "Pérez",
        "Gómez",
        "Martín",
        "Jiménez",
        "Ruiz",
        "Hernández",
        "Díaz",
        "Moreno",
        "Álvarez",
        "Muñoz",
        "Romero",
        "Alonso",
        "Gutiérrez",
      ],
      "Serie A": [
        "Rossi",
        "Russo",
        "Ferrari",
        "Esposito",
        "Bianchi",
        "Romano",
        "Colombo",
        "Ricci",
        "Marino",
        "Greco",
        "Bruno",
        "Galli",
        "Conti",
        "De Luca",
        "Mancini",
        "Costa",
        "Giordano",
        "Rizzo",
        "Lombardi",
        "Moretti",
      ],
      Bundesliga: [
        "Müller",
        "Schmidt",
        "Schneider",
        "Fischer",
        "Weber",
        "Meyer",
        "Wagner",
        "Becker",
        "Schulz",
        "Hoffmann",
        "Schäfer",
        "Koch",
        "Richter",
        "Klein",
        "Wolf",
        "Schröder",
        "Neumann",
        "Schwarz",
        "Zimmermann",
        "Braun",
      ],
      "Ligue 1": [
        "Martin",
        "Bernard",
        "Dubois",
        "Thomas",
        "Robert",
        "Petit",
        "Durand",
        "Leroy",
        "Moreau",
        "Simon",
        "Laurent",
        "Lefebvre",
        "Michel",
        "Garcia",
        "David",
        "Bertrand",
        "Roux",
        "Vincent",
        "Fournier",
        "Morel",
      ],
      Eredivisie: [
        "de Jong",
        "van der Berg",
        "van Dijk",
        "Bakker",
        "Janssen",
        "Visser",
        "Smit",
        "Meijer",
        "de Boer",
        "Mulder",
        "de Groot",
        "Bos",
        "Vos",
        "Peters",
        "Hendriks",
        "van Leeuwen",
        "Dekker",
        "Brouwer",
        "de Wit",
        "Dijkstra",
      ],
    };

    // Default international names if league not found
    const defaultNames = [
      "Anderson",
      "Silva",
      "Santos",
      "Costa",
      "Pereira",
      "Oliveira",
      "Souza",
      "Lima",
      "Gomes",
      "Ribeiro",
      "Carvalho",
      "Almeida",
      "Ferreira",
      "Rodrigues",
      "Nascimento",
      "Correia",
      "Mendes",
      "Nunes",
      "Soares",
      "Teixeira",
    ];

    const names = playerNamesByLeague[league] || defaultNames;

    // Generate 5-8 realistic player names for this team
    const playerCount = Math.floor(random() * 4) + 5; // 5-8 players
    const selectedNames = [];

    for (let i = 0; i < playerCount; i++) {
      const nameIndex = Math.floor(random() * names.length);
      selectedNames.push(names[nameIndex]);
    }

    return selectedNames;
  }

  /**
   * Generate enhanced match statistics
   */
  generateEnhancedMatchStats(
    matchId: string,
    matchStatus: string,
    realData?: any,
    existingCorners?: { home: number; away: number },
  ): MatchStats {
    // ✅ FIXED: For upcoming matches, return 50/50 stats for all pie charts
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

    // Create deterministic seed based on match ID for consistency (live/finished matches only)
    let hash = 0;
    for (let i = 0; i < matchId.length; i++) {
      hash = ((hash << 5) - hash + matchId.charCodeAt(i)) & 0xffffffff;
    }
    const seed = Math.abs(hash) / 0xffffffff;

    // 🎯 REALISTIC STAT RANGES based on real football data
    const createStatRange = (baseSeed: number, min: number, max: number) => {
      return Math.floor(min + baseSeed * (max - min));
    };

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

    // 🎯 USE REAL DATA if available for all statistics
    let corners, fouls, yellowCards, redCards, offsides, possession;

    if (realData) {
      console.log(
        "✅ Using real statistics data from API for consistency with match list",
      );
      corners =
        realData.corners &&
        (realData.corners.home > 0 || realData.corners.away > 0)
          ? realData.corners
          : existingCorners || { home: 0, away: 0 };

      fouls = realData.fouls || {
        home: createStatRange(foulSeed, 5, 20),
        away: createStatRange((foulSeed * 2) % 1, 5, 20),
      };
      yellowCards = realData.yellowCards || { home: 0, away: 0 };
      redCards = realData.redCards || { home: 0, away: 0 };
      offsides = realData.offsides || {
        home: createStatRange(offsideSeed, 0, 8),
        away: createStatRange((offsideSeed * 2) % 1, 0, 8),
      };

      if (
        realData.possession &&
        (realData.possession.home > 0 || realData.possession.away > 0)
      ) {
        possession = realData.possession;
      } else {
        possession = { home: 50, away: 50 };
      }
    } else {
      console.log(
        "⚠️ No real statistics available, generating enhanced realistic data",
      );
      corners = { home: 0, away: 0 };
      fouls = {
        home: createStatRange(foulSeed, 5, 20),
        away: createStatRange((foulSeed * 2) % 1, 5, 20),
      };
      yellowCards = { home: 0, away: 0 };
      redCards = { home: 0, away: 0 };
      offsides = {
        home: createStatRange(offsideSeed, 0, 8),
        away: createStatRange((offsideSeed * 2) % 1, 0, 8),
      };

      const possessionVariance = Math.floor(possessionSeed * 30) - 15;
      const homePossession = Math.max(
        30,
        Math.min(70, 50 + possessionVariance),
      );
      possession = { home: homePossession, away: 100 - homePossession };
    }

    return {
      possession: possession,
      attacks: {
        home: createStatRange(attackSeed, 8, 25),
        away: createStatRange((attackSeed * 2) % 1, 8, 25),
      },
      dangerousAttacks: {
        home: createStatRange(dangerSeed, 2, 15),
        away: createStatRange((dangerSeed * 2) % 1, 2, 15),
      },
      shotsOnTarget: {
        home: createStatRange(shotSeed, 0, 12),
        away: createStatRange((shotSeed * 2) % 1, 0, 12),
      },
      shotsOffTarget: {
        home: createStatRange(shotOffSeed, 0, 15),
        away: createStatRange((shotOffSeed * 2) % 1, 0, 15),
      },
      corners: corners,
      fouls: fouls,
      yellowCards: yellowCards,
      redCards: redCards,
      offsides: offsides,
      saves: {
        home: createStatRange(saveSeed, 0, 10),
        away: createStatRange((saveSeed * 2) % 1, 0, 10),
      },
    };
  }

  /**
   * Generate enhanced match events
   */
  generateEnhancedMatchEvents(
    currentMinute: number,
    stats: MatchStats,
    matchId: string,
    match: any,
    league: string,
  ): MatchEvent[] {
    const events: MatchEvent[] = [];

    // Create deterministic seed for consistent event generation
    let eventSeed =
      matchId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) %
      1000;
    const seededEventRandom = () => {
      eventSeed = (eventSeed * 9301 + 49297) % 233280;
      return eventSeed / 233280;
    };

    // Generate realistic player names for both teams
    const homePlayerNames = this.generateRealisticPlayerNames(
      match?.home.name || "Home Team",
      league,
      matchId,
    );
    const awayPlayerNames = this.generateRealisticPlayerNames(
      match?.away.name || "Away Team",
      league,
      matchId,
    );

    let eventId = 1;
    const maxMinute = Math.min(currentMinute, 90);

    // 🎯 ADD REALISTIC GOALS (based on match score)
    if (match?.score && match.score !== "0-0") {
      const scoreParts = match.score.split("-");
      const homeGoals = parseInt(scoreParts[0]?.trim()) || 0;
      const awayGoals = parseInt(scoreParts[1]?.trim()) || 0;

      // Add home goals with realistic descriptions
      for (let i = 0; i < homeGoals; i++) {
        const minute = Math.floor(seededEventRandom() * maxMinute) + 5;
        const playerName =
          homePlayerNames[
            Math.floor(seededEventRandom() * homePlayerNames.length)
          ];
        events.push({
          id: `goal_home_${eventId++}`,
          minute: Math.min(minute, maxMinute),
          team: "home",
          type: "goal",
          player: playerName,
          description: `${minute}' - Goal! ${playerName} scores for ${match?.home.name}! Great finish!`,
          icon: "⚽",
        });
      }

      // Add away goals with realistic descriptions
      for (let i = 0; i < awayGoals; i++) {
        const minute = Math.floor(seededEventRandom() * maxMinute) + 5;
        const playerName =
          awayPlayerNames[
            Math.floor(seededEventRandom() * awayPlayerNames.length)
          ];
        events.push({
          id: `goal_away_${eventId++}`,
          minute: Math.min(minute, maxMinute),
          team: "away",
          type: "goal",
          player: playerName,
          description: `${minute}' - Goal! ${playerName} scores for ${match?.away.name}! Brilliant strike!`,
          icon: "⚽",
        });
      }
    }

    // 🚩 ADD REALISTIC CORNER EVENTS
    for (let i = 0; i < Math.min(stats.corners.home, 4); i++) {
      const minute = Math.floor(seededEventRandom() * maxMinute) + 1;
      const playerName =
        homePlayerNames[
          Math.floor(seededEventRandom() * homePlayerNames.length)
        ];
      events.push({
        id: `corner_home_${eventId++}`,
        minute: Math.min(minute, maxMinute),
        team: "home",
        type: "corner",
        player: playerName,
        description: `${minute}' - Corner for ${match?.home.name}. ${playerName} to take.`,
        icon: "🚩",
      });
    }

    for (let i = 0; i < Math.min(stats.corners.away, 4); i++) {
      const minute = Math.floor(seededEventRandom() * maxMinute) + 1;
      const playerName =
        awayPlayerNames[
          Math.floor(seededEventRandom() * awayPlayerNames.length)
        ];
      events.push({
        id: `corner_away_${eventId++}`,
        minute: Math.min(minute, maxMinute),
        team: "away",
        type: "corner",
        player: playerName,
        description: `${minute}' - Corner for ${match?.away.name}. ${playerName} prepares to deliver.`,
        icon: "🚩",
      });
    }

    // 🟨 ADD REALISTIC YELLOW CARD EVENTS
    if (stats.yellowCards.home > 0) {
      for (let i = 0; i < Math.min(stats.yellowCards.home, 2); i++) {
        const minute = Math.floor(seededEventRandom() * maxMinute) + 10;
        const playerName =
          homePlayerNames[
            Math.floor(seededEventRandom() * homePlayerNames.length)
          ];
        events.push({
          id: `yellow_home_${eventId++}`,
          minute: Math.min(minute, maxMinute),
          team: "home",
          type: "yellow_card",
          player: playerName,
          description: `${minute}' - Yellow card for ${playerName} (${match?.home.name}). Cautioned for foul.`,
          icon: "🟨",
        });
      }
    }

    if (stats.yellowCards.away > 0) {
      for (let i = 0; i < Math.min(stats.yellowCards.away, 2); i++) {
        const minute = Math.floor(seededEventRandom() * maxMinute) + 10;
        const playerName =
          awayPlayerNames[
            Math.floor(seededEventRandom() * awayPlayerNames.length)
          ];
        events.push({
          id: `yellow_away_${eventId++}`,
          minute: Math.min(minute, maxMinute),
          team: "away",
          type: "yellow_card",
          player: playerName,
          description: `${minute}' - Yellow card for ${playerName} (${match?.away.name}). Booked for dissent.`,
          icon: "🟨",
        });
      }
    }

    // 🟥 ADD REALISTIC RED CARD EVENTS (if any)
    if (stats.redCards.home > 0) {
      const minute = Math.floor(seededEventRandom() * maxMinute) + 20;
      const playerName =
        homePlayerNames[
          Math.floor(seededEventRandom() * homePlayerNames.length)
        ];
      events.push({
        id: `red_home_${eventId++}`,
        minute: Math.min(minute, maxMinute),
        team: "home",
        type: "red_card",
        player: playerName,
        description: `${minute}' - Red card! ${playerName} (${match?.home.name}) sent off! Serious foul play.`,
        icon: "🟥",
      });
    }

    if (stats.redCards.away > 0) {
      const minute = Math.floor(seededEventRandom() * maxMinute) + 20;
      const playerName =
        awayPlayerNames[
          Math.floor(seededEventRandom() * awayPlayerNames.length)
        ];
      events.push({
        id: `red_away_${eventId++}`,
        minute: Math.min(minute, maxMinute),
        team: "away",
        type: "red_card",
        player: playerName,
        description: `${minute}' - Red card! ${playerName} (${match?.away.name}) dismissed! Second yellow card.`,
        icon: "🟥",
      });
    }

    // Add realistic match commentary events
    const commentaryEvents = [
      {
        id: `commentary_start_${eventId++}`,
        minute: 0,
        team: "home" as const,
        type: "commentary" as const,
        player: "Referee",
        description: `Welcome to today's match! ${match?.home.name} vs ${match?.away.name}. Players warming up, match about to begin.`,
        icon: "🎺",
      },
      {
        id: `commentary_kickoff_${eventId++}`,
        minute: 1,
        team: "home" as const,
        type: "commentary" as const,
        player: "Referee",
        description: `Kick-off! ${match?.home.name} get the match underway.`,
        icon: "⚽",
      },
      {
        id: `commentary_conditions_${eventId++}`,
        minute: 0,
        team: "home" as const,
        type: "commentary" as const,
        player: "Weather",
        description: `Perfect conditions for football today. Clear skies, 26°C, light breeze.`,
        icon: "🌤️",
      },
    ];

    events.push(...commentaryEvents);
    return events.sort((a, b) => b.minute - a.minute);
  }

  /**
   * Generate betting odds
   */
  generateBettingOdds(matchId: string, homeTeam: string, awayTeam: string) {
    let seed = parseInt(matchId.slice(-3)) || 123;
    const seedRandom = () => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };

    // Real English betting companies for Ugandan market
    const bookmakers = [
      "Bet365*",
      "William Hill*",
      "Ladbrokes*",
      "Coral*",
      "Betfair*",
      "Unibet*",
      "Betway*",
      "SportsBet*",
      "888Sport*",
      "BetVictor*",
      "Paddy Power*",
      "SkyBet*",
      "BetFred*",
      "Marathon*",
    ];

    const generateHandicapOdds = () => {
      const homeRating = calculateInitialTeamRatings(
        homeTeam,
        awayTeam,
        "Premier League",
        matchId,
      ).home;
      const awayRating = calculateInitialTeamRatings(
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
        const variation = (seedRandom() - 0.5) * 0.1;
        const baseHomeOdd = 0.9 + strengthDifference * 0.02;
        const baseAwayOdd = 0.9 - strengthDifference * 0.02;
        const homeOdd = Math.max(0.75, Math.min(1.05, baseHomeOdd + variation));
        const awayOdd = Math.max(0.75, Math.min(1.05, baseAwayOdd - variation));

        return {
          bookmaker: bookie,
          handicap: handicap.toFixed(2),
          homeOdd: homeOdd.toFixed(2),
          awayOdd: awayOdd.toFixed(2),
          trend: seedRandom() > 0.5 ? "up" : "down",
          isBlocked: seedRandom() > 0.9,
        };
      });
    };

    const generateWinDrawLossOdds = () => {
      const homeRating = calculateInitialTeamRatings(
        homeTeam,
        awayTeam,
        "Premier League",
        matchId,
      ).home;
      const awayRating = calculateInitialTeamRatings(
        homeTeam,
        awayTeam,
        "Premier League",
        matchId,
      ).away;
      const homeWinProb = 0.33 + (homeRating - awayRating) * 0.1;
      const awayWinProb = 0.33 - (homeRating - awayRating) * 0.08;
      const drawProb = 1 - homeWinProb - awayWinProb;

      return bookmakers.map((bookie) => {
        const variation = (seedRandom() - 0.5) * 0.3;
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
          trend: seedRandom() > 0.5 ? "up" : "down",
          isBlocked: seedRandom() > 0.9,
        };
      });
    };

    const generateTotalGoalsOdds = () => {
      const homeRating = calculateInitialTeamRatings(
        homeTeam,
        awayTeam,
        "Premier League",
        matchId,
      ).home;
      const awayRating = calculateInitialTeamRatings(
        homeTeam,
        awayTeam,
        "Premier League",
        matchId,
      ).away;
      const avgRating = (homeRating + awayRating) / 2;
      const line = Math.max(1.5, Math.min(3.5, 2.0 + (avgRating - 70) * 0.02));

      return bookmakers.map((bookie) => {
        const variation = (seedRandom() - 0.5) * 0.1;
        const overOdd = Math.max(0.75, Math.min(1.2, 0.9 + variation));
        const underOdd = Math.max(0.75, Math.min(1.2, 0.9 - variation));

        return {
          bookmaker: bookie,
          line: line.toFixed(1),
          overOdd: overOdd.toFixed(2),
          underOdd: underOdd.toFixed(2),
          trend: seedRandom() > 0.5 ? "up" : "down",
          isBlocked: seedRandom() > 0.9,
        };
      });
    };

    const generateCornerOdds = () => {
      const homeRating = calculateInitialTeamRatings(
        homeTeam,
        awayTeam,
        "Premier League",
        matchId,
      ).home;
      const awayRating = calculateInitialTeamRatings(
        homeTeam,
        awayTeam,
        "Premier League",
        matchId,
      ).away;
      const expectedCorners = 8 + (homeRating + awayRating - 140) * 0.05;
      const line = Math.max(7.5, Math.min(12.5, expectedCorners));

      return bookmakers.map((bookie) => {
        const variation = (seedRandom() - 0.5) * 0.08;
        const overOdd = Math.max(0.8, Math.min(1.15, 0.88 + variation));
        const underOdd = Math.max(0.8, Math.min(1.15, 0.92 - variation));

        return {
          bookmaker: bookie,
          line: line.toFixed(1),
          overOdd: overOdd.toFixed(2),
          underOdd: underOdd.toFixed(2),
          trend: seedRandom() > 0.5 ? "up" : "down",
          isBlocked: seedRandom() > 0.9,
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
   * Generate realistic transfers for teams
   */
  generateTransfers(teamName: string, matchId: string): TransferPlayer[] {
    let seed = parseInt(matchId.slice(-3)) + teamName.length || 123;
    const random = () => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };

    const transfers: TransferPlayer[] = [];
    const transferCount = Math.floor(random() * 4) + 1; // 1-4 transfers

    const positions = ["Forward", "Midfielder", "Defender", "Goalkeeper"];
    const firstNames = [
      "James",
      "John",
      "Robert",
      "Michael",
      "William",
      "David",
      "Richard",
      "Joseph",
      "Thomas",
      "Christopher",
      "Charles",
      "Daniel",
      "Matthew",
      "Anthony",
      "Mark",
      "Donald",
      "Steven",
      "Paul",
      "Andrew",
      "Kenneth",
    ];
    const lastNames = [
      "Smith",
      "Johnson",
      "Williams",
      "Brown",
      "Jones",
      "Garcia",
      "Miller",
      "Davis",
      "Rodriguez",
      "Martinez",
      "Hernandez",
      "Lopez",
      "Gonzalez",
      "Wilson",
      "Anderson",
      "Thomas",
      "Taylor",
      "Moore",
      "Jackson",
      "Martin",
    ];

    const commonTeams = [
      "Arsenal",
      "Chelsea",
      "Liverpool",
      "Manchester United",
      "Manchester City",
      "Tottenham",
      "Newcastle",
      "Brighton",
      "West Ham",
      "Aston Villa",
      "Crystal Palace",
      "Brentford",
      "Fulham",
      "Wolves",
      "Sheffield United",
      "Burnley",
      "Luton Town",
      "Nottingham Forest",
    ];

    for (let i = 0; i < transferCount; i++) {
      const transferType = random() > 0.5 ? "in" : "out";
      const firstName = firstNames[Math.floor(random() * firstNames.length)];
      const lastName = lastNames[Math.floor(random() * lastNames.length)];
      const position = positions[Math.floor(random() * positions.length)];

      const baseFee = Math.floor(random() * 50000000) + 5000000;
      const feeInMillions = (baseFee / 1000000).toFixed(1);

      const daysAgo = Math.floor(random() * 90) + 1;
      const transferDate = new Date();
      transferDate.setDate(transferDate.getDate() - daysAgo);

      let otherTeam = commonTeams[Math.floor(random() * commonTeams.length)];
      if (otherTeam === teamName) {
        otherTeam =
          commonTeams[
            (Math.floor(random() * commonTeams.length) + 1) % commonTeams.length
          ];
      }

      transfers.push({
        id: `transfer-${teamName}-${i}`,
        name: `${firstName} ${lastName}`,
        position: position,
        photo: `https://randomuser.me/api/portraits/men/${Math.floor(random() * 99)}.jpg`,
        fromTeam: transferType === "in" ? otherTeam : teamName,
        toTeam: transferType === "in" ? teamName : otherTeam,
        transferDate: transferDate.toISOString().split("T")[0],
        fee: `€${feeInMillions}M`,
        type: transferType,
      });
    }

    return transfers;
  }

  /**
   * Generate realistic injuries for teams
   */
  generateInjuries(teamName: string, matchId: string): InjuredPlayer[] {
    let seed = parseInt(matchId.slice(-3)) + teamName.length + 50 || 173;
    const random = () => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };

    const injuries: InjuredPlayer[] = [];
    const injuryCount = Math.floor(random() * 4); // 0-3 injuries

    if (injuryCount === 0) return injuries;

    const positions = ["Forward", "Midfielder", "Defender", "Goalkeeper"];
    const firstNames = [
      "Alex",
      "Jordan",
      "Taylor",
      "Cameron",
      "Morgan",
      "Jamie",
      "Riley",
      "Avery",
      "Quinn",
      "Casey",
    ];
    const lastNames = [
      "Johnson",
      "Williams",
      "Brown",
      "Jones",
      "Garcia",
      "Miller",
      "Davis",
      "Rodriguez",
      "Martinez",
      "Wilson",
    ];

    const injuryTypes = [
      "Hamstring strain",
      "Knee injury",
      "Ankle sprain",
      "Muscle fatigue",
      "Back strain",
      "Shoulder injury",
      "Groin strain",
      "Calf strain",
    ];
    const severities: ("minor" | "moderate" | "serious")[] = [
      "minor",
      "moderate",
      "serious",
    ];

    for (let i = 0; i < injuryCount; i++) {
      const firstName = firstNames[Math.floor(random() * firstNames.length)];
      const lastName = lastNames[Math.floor(random() * lastNames.length)];
      const position = positions[Math.floor(random() * positions.length)];
      const injury = injuryTypes[Math.floor(random() * injuryTypes.length)];
      const severity = severities[Math.floor(random() * severities.length)];

      const daysOut =
        severity === "minor"
          ? Math.floor(random() * 14) + 1
          : severity === "moderate"
            ? Math.floor(random() * 30) + 15
            : Math.floor(random() * 60) + 30;
      const returnDate = new Date();
      returnDate.setDate(returnDate.getDate() + daysOut);

      injuries.push({
        id: `injury-${teamName}-${i}`,
        name: `${firstName} ${lastName}`,
        position: position,
        photo: `https://randomuser.me/api/portraits/men/${Math.floor(random() * 99)}.jpg`,
        injury: injury,
        expectedReturn: returnDate.toISOString().split("T")[0],
        severity: severity,
      });
    }

    return injuries;
  }

  /**
   * Generate realistic social media users for Hot section
   */
  generateSocialUsers(matchId: string): SocialUser[] {
    let seed = parseInt(matchId.slice(-3)) + 100 || 200;
    const random = () => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };

    const usernames = [
      "UgandaSportsKing",
      "FootballFan88",
      "ChampsPredictions",
      "SportsAnalyzer2025",
      "UgandaFootballLover",
      "MatchExpert",
      "GoalMaster",
      "TopScorer",
      "FootballGuru",
      "SportsEnthusiast",
      "MatchPredictor",
      "GameAnalyst",
      "UgandaCranes",
      "PremierLeagueFan",
      "SoccerPro",
      "SportsFanatic",
    ];

    const displayNames = [
      "John Mugisha",
      "Sarah Nakato",
      "David Ssekandi",
      "Mary Nambi",
      "Peter Okello",
      "Grace Achieng",
      "Joseph Kato",
      "Esther Nanozi",
      "Samuel Ouma",
      "Ruth Nakimuli",
      "Patrick Ssali",
      "Jane Akello",
      "Robert Mubiru",
      "Alice Nalwoga",
      "Charles Wamala",
      "Susan Nabirye",
    ];

    const avatars = [
      "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg",
      "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg",
      "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg",
      "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg",
      "https://images.pexels.com/photos/1300402/pexels-photo-1300402.jpeg",
      "https://images.pexels.com/photos/1674752/pexels-photo-1674752.jpeg",
      "https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg",
      "https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg",
    ];

    const badges = ["👑", "⭐", "🏆", "💎", "🔥", "⚡", "🎯", "💪"];
    const users: SocialUser[] = [];

    for (let i = 0; i < 20; i++) {
      const level = Math.floor(random() * 100) + 1;
      const isVerified = random() > 0.7;
      const userBadges: string[] = [];

      if (level >= 50)
        userBadges.push(badges[Math.floor(random() * badges.length)]);
      if (level >= 80)
        userBadges.push(badges[Math.floor(random() * badges.length)]);
      if (isVerified) userBadges.push("👑");

      users.push({
        id: `user_${i}_${matchId}`,
        username: usernames[Math.floor(random() * usernames.length)],
        displayName: displayNames[Math.floor(random() * displayNames.length)],
        avatar: avatars[Math.floor(random() * avatars.length)],
        level,
        isVerified,
        badges: userBadges,
        followerCount: Math.floor(random() * 10000),
        followingCount: Math.floor(random() * 500),
        totalLikes: Math.floor(random() * 50000),
        joinDate: new Date(
          2020 + Math.floor(random() * 5),
          Math.floor(random() * 12),
          Math.floor(random() * 28),
        ).toISOString(),
      });
    }

    return users;
  }

  /**
   * Generate realistic social posts for Hot section
   */
  generateSocialPosts(
    matchId: string,
    homeTeam: string,
    awayTeam: string,
  ): SocialPost[] {
    const users = this.generateSocialUsers(matchId);
    let seed = parseInt(matchId.slice(-3)) + 150 || 250;
    const random = () => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };

    const postTemplates = [
      `Tonight's ${homeTeam} vs ${awayTeam} match is going to be EPIC! 🔥 My prediction: 2-1 to ${homeTeam}. What do you think?`,
      `${homeTeam} looking strong in warmups! 💪 Ready for this massive clash against ${awayTeam}. #UgandaFootball`,
      `Analysis: ${awayTeam} has won 3 of their last 5 matches, but ${homeTeam} has home advantage. This could go either way! ⚽`,
      `Just arrived at the stadium! The atmosphere is ELECTRIC! ⚡ ${homeTeam} vs ${awayTeam} - can't wait! 🏟️`,
      `Prediction time! 🎯 I'm going with Over 2.5 goals for this match. Both teams love to attack! What's your pick?`,
      `${homeTeam}'s striker is in amazing form - 5 goals in last 3 games! 🎯 He's my pick for first goalscorer tonight.`,
      `Weather conditions perfect for football tonight! 🌤️ Should see some great attacking play from both teams.`,
      `Historical data shows ${homeTeam} vs ${awayTeam} matches average 2.8 goals. Expecting fireworks! 🎆`,
      `The tactical battle between these coaches will be fascinating to watch! 🧠 Both known for their attacking philosophy.`,
      `Stadium is filling up fast! 🏟️ Love seeing this passion for football in Uganda. Let's support our teams! 🇺🇬`,
      `Key player to watch: ${homeTeam}'s midfielder. His vision and passing could unlock ${awayTeam}'s defense! 👀`,
      `Betting tip: Both teams to score looks solid! 💰 Neither side has kept a clean sheet in their last 3 matches.`,
    ];

    const mediaUrls = [
      "https://images.pexels.com/photos/274506/pexels-photo-274506.jpeg",
      "https://images.pexels.com/photos/1884574/pexels-photo-1884574.jpeg",
      "https://images.pexels.com/photos/1752757/pexels-photo-1752757.jpeg",
      "https://images.pexels.com/photos/358042/pexels-photo-358042.jpeg",
    ];

    const categories: SocialPost["category"][] = [
      "match_discussion",
      "prediction",
      "analysis",
      "celebration",
    ];
    const tags = [
      "#UgandaFootball",
      "#PremierLeague",
      "#MatchPrediction",
      "#Football",
      "#Soccer",
      "#UgandaSports",
    ];
    const posts: SocialPost[] = [];

    for (let i = 0; i < 15; i++) {
      const author = users[Math.floor(random() * users.length)];
      const hasMedia = random() > 0.7;
      const isHot = random() > 0.8;
      const category = categories[Math.floor(random() * categories.length)];

      const hoursAgo = Math.floor(random() * 6);
      const minutesAgo = Math.floor(random() * 60);
      const timestamp = new Date(
        Date.now() - hoursAgo * 60 * 60 * 1000 - minutesAgo * 60 * 1000,
      );

      const post: SocialPost = {
        id: `post_${i}_${matchId}`,
        author,
        content: postTemplates[Math.floor(random() * postTemplates.length)],
        media: hasMedia
          ? [
              {
                type: "image",
                url: mediaUrls[Math.floor(random() * mediaUrls.length)],
                description: "Match related image",
              },
            ]
          : undefined,
        timestamp: timestamp.toISOString(),
        matchId,
        category,
        likes: Math.floor(random() * 500) + 10,
        comments: Math.floor(random() * 100) + 5,
        shares: Math.floor(random() * 50) + 2,
        isHot,
        isSticky: false,
        tags: [
          tags[Math.floor(random() * tags.length)],
          tags[Math.floor(random() * tags.length)],
        ],
        location: random() > 0.5 ? "Kampala, Uganda" : undefined,
        engagement: {
          viewCount: Math.floor(random() * 2000) + 100,
          reactionCounts: {
            like: Math.floor(random() * 300),
            love: Math.floor(random() * 50),
            fire: Math.floor(random() * 80),
            trophy: Math.floor(random() * 30),
            laugh: Math.floor(random() * 20),
          },
        },
      };

      posts.push(post);
    }

    return posts.sort((a, b) => {
      if (a.isHot && !b.isHot) return -1;
      if (!a.isHot && b.isHot) return 1;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  }
}

export const matchDetailsDataService = new MatchDetailsDataService();
