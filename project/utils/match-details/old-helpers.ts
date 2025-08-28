import { PlayerData } from "@/services/lineupService";

// ✅ NEW: Generate realistic Extra Time score (after 90 minutes)
export const generateRealisticExtraTimeScore = (
  fullTimeScore: string,
  matchId: string
): string => {
  try {
    const [homeGoals, awayGoals] = fullTimeScore
      .split("-")
      .map((s) => parseInt(s.trim()) || 0);

    // Create deterministic seed for consistency
    let hash = 0;
    for (let i = 0; i < matchId.length; i++) {
      hash = ((hash << 5) - hash + matchId.charCodeAt(i)) & 0xffffffff;
    }
    const seed = Math.abs(hash) / 0xffffffff;

    // Extra time usually adds 0-2 goals per team
    const extraHomeGoals = seed > 0.7 ? 1 : seed > 0.9 ? 2 : 0;
    const extraAwayGoals =
      (seed * 1.3) % 1 > 0.8 ? 1 : (seed * 1.3) % 1 > 0.95 ? 2 : 0;

    const etHomeGoals = homeGoals + extraHomeGoals;
    const etAwayGoals = awayGoals + extraAwayGoals;

    console.log(
      `🏁 GENERATED ET SCORE: ${etHomeGoals}-${etAwayGoals} (added ${extraHomeGoals}-${extraAwayGoals} in ET)`
    );
    return `${etHomeGoals}-${etAwayGoals}`;
  } catch (error) {
    console.log("❌ Error generating ET score:", error);
    return fullTimeScore; // Fallback to full time score
  }
};

// ✅ NEW: Generate realistic Penalty shootout score
export const generateRealisticPenaltyScore = (matchId: string): string => {
  try {
    // Create deterministic seed for consistency
    let hash = 0;
    for (let i = 0; i < matchId.length; i++) {
      hash = ((hash << 5) - hash + matchId.charCodeAt(i)) & 0xffffffff;
    }
    const seed = Math.abs(hash) / 0xffffffff;

    // Penalty scores typically range from 3-0 to 5-4
    const homeScore = Math.floor(3 + seed * 3); // 3-5
    const awayScore = Math.floor(2 + ((seed * 1.7) % 1) * 3); // 2-4

    // Ensure one team wins
    const finalHomeScore = homeScore === awayScore ? homeScore + 1 : homeScore;

    console.log(`🏁 GENERATED PENALTY SCORE: ${finalHomeScore}-${awayScore}`);
    return `${finalHomeScore}-${awayScore}`;
  } catch (error) {
    console.log("❌ Error generating penalty score:", error);
    return "4-2"; // Default penalty score
  }
};

// Generate realistic half-time scores based on final score
export const generateRealisticHalfTimeScore = (
  finalScore: string,
  matchId: string
) => {
  try {
    console.log(`🏁 Generating HT score for final score: "${finalScore}"`);

    // Handle different score formats: "1-1", "1 - 1", "0-0", etc.
    let homeGoals = 0;
    let awayGoals = 0;

    if (finalScore && finalScore !== "vs" && finalScore !== "--") {
      // Try different separators
      let parts: string[] = [];
      if (finalScore.includes(" - ")) {
        parts = finalScore.split(" - ");
      } else if (finalScore.includes("-")) {
        parts = finalScore.split("-");
      } else if (finalScore.includes(" ")) {
        parts = finalScore.split(" ");
      }

      if (parts.length >= 2) {
        homeGoals = parseInt(parts[0].trim()) || 0;
        awayGoals = parseInt(parts[1].trim()) || 0;
      }
    }

    console.log(`🏁 Parsed goals: Home ${homeGoals}, Away ${awayGoals}`);

    // Create deterministic seed based on match ID for consistent results
    let hash = 0;
    for (let i = 0; i < matchId.length; i++) {
      hash = ((hash << 5) - hash + matchId.charCodeAt(i)) & 0xffffffff;
    }
    const seed = Math.abs(hash) / 0xffffffff;

    // Most goals are scored in the second half
    // Realistic distribution: ~60% of goals come in second half
    const firstHalfRatio = 0.4 + seed * 0.3; // 40-70% of goals in first half

    const homeHalfTimeGoals = Math.floor(homeGoals * firstHalfRatio);
    const awayHalfTimeGoals = Math.floor(awayGoals * firstHalfRatio);

    // Add some randomness for edge cases
    const homeAdjustment =
      (seed * 3) % 1 < 0.2 && homeHalfTimeGoals < homeGoals ? 1 : 0;
    const awayAdjustment =
      (seed * 5) % 1 < 0.2 && awayHalfTimeGoals < awayGoals ? 1 : 0;

    const finalHomeHT = Math.min(homeHalfTimeGoals + homeAdjustment, homeGoals);
    const finalAwayHT = Math.min(awayHalfTimeGoals + awayAdjustment, awayGoals);

    const result = `${finalHomeHT}-${finalAwayHT}`;
    console.log(`🏁 Generated HT score: ${result}`);
    return result;
  } catch (error) {
    console.error("🏁 Error generating HT score:", error);
    return "0-0";
  }
};

// Calculate realistic team ratings based on team names, league, and statistics
export const calculateInitialTeamRatings = (
  homeTeam: string,
  awayTeam: string,
  league: string,
  matchId?: string
) => {
  // Base ratings considering team reputation and league quality
  const getBaseRating = (teamName: string, league: string) => {
    const name = teamName.toLowerCase();

    // Premier League top teams
    if (name.includes("manchester united") || name.includes("man united"))
      return 78;
    if (name.includes("manchester city") || name.includes("man city"))
      return 82;
    if (name.includes("liverpool")) return 80;
    if (name.includes("arsenal")) return 76;
    if (name.includes("chelsea")) return 75;
    if (name.includes("tottenham") || name.includes("spurs")) return 73;
    if (name.includes("newcastle")) return 70;
    if (name.includes("west ham")) return 65;
    if (name.includes("brighton")) return 64;
    if (name.includes("leicester")) return 62;

    // Other big European clubs
    if (name.includes("real madrid")) return 85;
    if (name.includes("barcelona") || name.includes("barça")) return 82;
    if (name.includes("atletico madrid")) return 78;
    if (name.includes("bayern munich")) return 84;
    if (name.includes("borussia dortmund")) return 76;
    if (name.includes("juventus")) return 75;
    if (name.includes("ac milan") || name.includes("milan")) return 73;
    if (name.includes("inter milan") || name.includes("inter")) return 74;
    if (name.includes("psg") || name.includes("paris saint-germain")) return 81;

    // League-based default ratings
    const leagueName = league.toLowerCase();
    if (leagueName.includes("premier league")) return 65;
    if (leagueName.includes("champions league")) return 75;
    if (leagueName.includes("europa league")) return 68;
    if (leagueName.includes("bundesliga")) return 62;
    if (leagueName.includes("serie a")) return 60;
    if (leagueName.includes("la liga")) return 63;
    if (leagueName.includes("ligue 1")) return 58;

    // Default for other leagues
    return 55;
  };

  const homeRating = getBaseRating(homeTeam, league);
  const awayRating = getBaseRating(awayTeam, league);

  // Add some variance and home advantage (deterministic based on match ID)
  const homeAdvantage = 3; // 3% home advantage

  // Create deterministic "random" number based on match ID for consistency
  let seedValue = 0.5; // default
  if (matchId) {
    let hash = 0;
    for (let i = 0; i < matchId.length; i++) {
      hash = ((hash << 5) - hash + matchId.charCodeAt(i)) & 0xffffffff;
    }
    seedValue = Math.abs(hash) / 0xffffffff;
  }

  const variance = Math.floor(seedValue * 6) - 3; // ±3% variance but consistent per match

  let adjustedHome = Math.max(
    25,
    Math.min(85, homeRating + homeAdvantage + variance)
  );
  let adjustedAway = Math.max(25, Math.min(85, awayRating + variance));

  // Ensure ratings add up to 100% (approximately)
  const total = adjustedHome + adjustedAway;
  if (total !== 100) {
    const ratio = 100 / total;
    adjustedHome = Math.round(adjustedHome * ratio);
    adjustedAway = 100 - adjustedHome;
  }

  return { home: adjustedHome, away: adjustedAway };
};

// Calculate dynamic ratings based on live match statistics
export const calculateDynamicRatings = (stats: MatchStats) => {
  // Weight different statistics based on their importance
  const weights = {
    possession: 0.35,
    attacks: 0.2,
    shotsOnTarget: 0.25,
    corners: 0.1,
    dangerousAttacks: 0.1,
  };

  // Calculate weighted score for each team
  const homeScore =
    stats.possession.home * weights.possession +
    stats.attacks.home * weights.attacks * 10 + // Scale attacks appropriately
    stats.shotsOnTarget.home * weights.shotsOnTarget * 15 + // Scale shots
    stats.corners.home * weights.corners * 8 + // Scale corners
    stats.dangerousAttacks.home * weights.dangerousAttacks * 12; // Scale dangerous attacks

  const awayScore =
    stats.possession.away * weights.possession +
    stats.attacks.away * weights.attacks * 10 +
    stats.shotsOnTarget.away * weights.shotsOnTarget * 15 +
    stats.corners.away * weights.corners * 8 +
    stats.dangerousAttacks.away * weights.dangerousAttacks * 12;

  // Convert to percentages
  const total = homeScore + awayScore;
  if (total === 0) return { home: 50, away: 50 };

  const homePercentage = Math.round((homeScore / total) * 100);
  const awayPercentage = 100 - homePercentage;

  // Ensure reasonable bounds (no team below 15% or above 85%)
  const boundedHome = Math.max(15, Math.min(85, homePercentage));
  const boundedAway = 100 - boundedHome;

  return { home: boundedHome, away: boundedAway };
};

// Generate realistic player lineups for Deep Data
export const generateHomeTeamPlayers = () => {
  const players = [
    // Goalkeeper
    {
      number: 1,
      name: "David Kim",
      position: "GK",
      goals: 0,
      assists: 0,
      yellowCards: 0,
      shots: 0,
      passes: 15,
    },
    // Defenders
    {
      number: 2,
      name: "Michael Park",
      position: "RB",
      goals: 0,
      assists: 0,
      yellowCards: 0,
      shots: 0,
      passes: 25,
    },
    {
      number: 3,
      name: "James Lee",
      position: "CB",
      goals: 0,
      assists: 0,
      yellowCards: 0,
      shots: 0,
      passes: 30,
    },
    {
      number: 4,
      name: "Robert Kim",
      position: "CB",
      goals: 0,
      assists: 0,
      yellowCards: 0,
      shots: 0,
      passes: 28,
    },
    {
      number: 5,
      name: "Daniel Choi",
      position: "LB",
      goals: 0,
      assists: 0,
      yellowCards: 0,
      shots: 0,
      passes: 22,
    },
    // Midfielders
    {
      number: 6,
      name: "John Smith",
      position: "CM",
      goals: 0,
      assists: 0,
      yellowCards: 0,
      shots: 1,
      passes: 35,
    },
    {
      number: 7,
      name: "Player 7",
      position: "CM",
      goals: 0,
      assists: 0,
      yellowCards: 0,
      shots: 0,
      passes: 32,
    },
    {
      number: 8,
      name: "Chris Brown",
      position: "AM",
      goals: 0,
      assists: 0,
      yellowCards: 0,
      shots: 2,
      passes: 28,
    },
    // Forwards
    {
      number: 9,
      name: "Tom Wilson",
      position: "ST",
      goals: 0,
      assists: 0,
      yellowCards: 0,
      shots: 3,
      passes: 18,
    },
    {
      number: 10,
      name: "Sam Davis",
      position: "LW",
      goals: 0,
      assists: 0,
      yellowCards: 0,
      shots: 2,
      passes: 20,
    },
    {
      number: 11,
      name: "Ben Taylor",
      position: "RW",
      goals: 0,
      assists: 0,
      yellowCards: 0,
      shots: 1,
      passes: 22,
    },
  ];

  return players;
};

export const generateAwayTeamPlayers = () => {
  const players = [
    // Goalkeeper
    {
      number: 1,
      name: "Mark Wilson",
      position: "GK",
      goals: 0,
      assists: 0,
      yellowCards: 0,
      shots: 0,
      passes: 12,
    },
    // Defenders
    {
      number: 2,
      name: "Steve Anderson",
      position: "RB",
      goals: 0,
      assists: 0,
      yellowCards: 0,
      shots: 0,
      passes: 20,
    },
    {
      number: 3,
      name: "Kevin Martinez",
      position: "CB",
      goals: 0,
      assists: 0,
      yellowCards: 0,
      shots: 0,
      passes: 25,
    },
    {
      number: 4,
      name: "Brian Garcia",
      position: "CB",
      goals: 0,
      assists: 0,
      yellowCards: 0,
      shots: 0,
      passes: 23,
    },
    {
      number: 5,
      name: "Ryan Thomas",
      position: "LB",
      goals: 0,
      assists: 0,
      yellowCards: 0,
      shots: 0,
      passes: 18,
    },
    // Midfielders
    {
      number: 6,
      name: "Carlos Rodriguez",
      position: "CM",
      goals: 0,
      assists: 0,
      yellowCards: 0,
      shots: 0,
      passes: 28,
    },
    {
      number: 7,
      name: "Luis Fernandez",
      position: "CM",
      goals: 0,
      assists: 0,
      yellowCards: 0,
      shots: 1,
      passes: 26,
    },
    {
      number: 8,
      name: "Diego Sanchez",
      position: "AM",
      goals: 0,
      assists: 0,
      yellowCards: 0,
      shots: 1,
      passes: 24,
    },
    // Forwards
    {
      number: 9,
      name: "Pablo Hernandez",
      position: "ST",
      goals: 0,
      assists: 0,
      yellowCards: 0,
      shots: 2,
      passes: 15,
    },
    {
      number: 10,
      name: "Marco Lopez",
      position: "LW",
      goals: 0,
      assists: 0,
      yellowCards: 0,
      shots: 1,
      passes: 17,
    },
    {
      number: 11,
      name: "Jose Gutierrez",
      position: "RW",
      goals: 0,
      assists: 0,
      yellowCards: 0,
      shots: 1,
      passes: 19,
    },
  ];

  return players;
};

// Generate comprehensive player statistics like the Chinese app
// ✅ NEW: Enhanced lineup player generators
// Generate realistic player names based on team
export const generateRealisticPlayerNames = (
  teamName: string,
  league: string,
  matchId: string
): string[] => {
  const ugandanNames = [
    "Okello",
    "Mukasa",
    "Ssemugabi",
    "Lwanga",
    "Namugga",
    "Kasozi",
    "Ssebunya",
    "Nalugo",
    "Mugisha",
    "Katongole",
    "Ssekamatte",
    "Nalwanga",
    "Kasujja",
    "Nakato",
    "Ssebuufu",
    "Namatovu",
    "Kawuki",
    "Nakaweesi",
    "Ssewankambo",
    "Nakimuli",
  ];

  const seed = teamName.length + matchId.length;
  const shuffledNames = [...ugandanNames].sort(
    () => Math.sin(seed) * 10000 - Math.floor(Math.sin(seed) * 10000)
  );

  return shuffledNames.slice(0, 15);
};

export const generateRealHomeLineupPlayers = (
  teamName: string,
  matchId: string
): PlayerData[] => {
  // Use team name to generate realistic players
  const teamBasedNames = generateRealisticPlayerNames(
    teamName,
    "Ugandan Premier League",
    matchId
  );
  const homeEvents = generateMatchEvents(matchId, "home");

  return [
    {
      id: "h1",
      name: teamBasedNames[0],
      number: 1,
      position: "GK",
      isStarter: true,
      rating: 7.2,
      nationality: "UGA",
      age: 28,
      marketValue: "€2.5M",
      events: [],
    },
    {
      id: "h2",
      name: teamBasedNames[1],
      number: 2,
      position: "RB",
      isStarter: true,
      rating: 7.0,
      nationality: "UGA",
      age: 25,
      marketValue: "€3.2M",
      events: [],
    },
    {
      id: "h3",
      name: teamBasedNames[2],
      number: 5,
      position: "CB",
      isStarter: true,
      rating: 7.3,
      nationality: "UGA",
      age: 28,
      marketValue: "€4.1M",
      events: [],
    },
    {
      id: "h4",
      name: teamBasedNames[3],
      number: 6,
      position: "CB",
      isStarter: true,
      rating: 7.1,
      nationality: "UGA",
      age: 30,
      marketValue: "€3.8M",
      events: [],
    },
    {
      id: "h5",
      name: teamBasedNames[4],
      number: 3,
      position: "LB",
      isStarter: true,
      rating: 6.9,
      nationality: "UGA",
      age: 26,
      marketValue: "€3.5M",
      events: [],
    },
    {
      id: "h6",
      name: teamBasedNames[5],
      number: 8,
      position: "CDM",
      isStarter: true,
      rating: 6.8,
      nationality: "UGA",
      age: 29,
      marketValue: "€4.5M",
      events: [],
    },
    {
      id: "h7",
      name: teamBasedNames[6],
      number: 10,
      position: "CM",
      isStarter: true,
      rating: 7.4,
      nationality: "UGA",
      age: 27,
      marketValue: "€5.2M",
      events: homeEvents.slice(0, 1),
    },
    {
      id: "h8",
      name: teamBasedNames[7],
      number: 7,
      position: "RW",
      isStarter: true,
      rating: 7.5,
      nationality: "UGA",
      age: 24,
      marketValue: "€4.8M",
      events: [],
    },
    {
      id: "h9",
      name: teamBasedNames[8],
      number: 11,
      position: "LW",
      isStarter: true,
      rating: 7.2,
      nationality: "UGA",
      age: 25,
      marketValue: "€4.2M",
      events: [],
    },
    {
      id: "h10",
      name: teamBasedNames[9],
      number: 9,
      position: "ST",
      isStarter: true,
      rating: 7.8,
      nationality: "UGA",
      age: 28,
      marketValue: "€6.5M",
      events: homeEvents.slice(1, 2),
    },
    {
      id: "h11",
      name: teamBasedNames[10],
      number: 4,
      position: "CM",
      isStarter: true,
      rating: 6.7,
      nationality: "UGA",
      age: 26,
      marketValue: "€3.9M",
      events: [],
    },
  ];
};

export const generateRealAwayLineupPlayers = (
  teamName: string,
  matchId: string
): PlayerData[] => {
  // Use team name to generate realistic players
  const teamBasedNames = generateRealisticPlayerNames(
    teamName,
    "Ugandan Premier League",
    matchId + "away"
  );
  const awayEvents = generateMatchEvents(matchId, "away");

  return [
    {
      id: "a1",
      name: teamBasedNames[0],
      number: 1,
      position: "GK",
      isStarter: true,
      rating: 6.8,
      nationality: "UGA",
      age: 31,
      marketValue: "€2.2M",
      events: [],
    },
    {
      id: "a2",
      name: teamBasedNames[1],
      number: 2,
      position: "RB",
      isStarter: true,
      rating: 6.5,
      nationality: "UGA",
      age: 28,
      marketValue: "€2.8M",
      events: [],
    },
    {
      id: "a3",
      name: teamBasedNames[2],
      number: 5,
      position: "CB",
      isStarter: true,
      rating: 6.9,
      nationality: "UGA",
      age: 29,
      marketValue: "€3.5M",
      events: [],
    },
    {
      id: "a4",
      name: teamBasedNames[3],
      number: 4,
      position: "CB",
      isStarter: true,
      rating: 6.7,
      nationality: "UGA",
      age: 32,
      marketValue: "€3.1M",
      events: [],
    },
    {
      id: "a5",
      name: teamBasedNames[4],
      number: 3,
      position: "LB",
      isStarter: true,
      rating: 6.6,
      nationality: "UGA",
      age: 27,
      marketValue: "€2.9M",
      events: [],
    },
    {
      id: "a6",
      name: teamBasedNames[5],
      number: 6,
      position: "CDM",
      isStarter: true,
      rating: 6.8,
      nationality: "UGA",
      age: 30,
      marketValue: "€3.8M",
      events: awayEvents.slice(0, 1),
    },
    {
      id: "a7",
      name: teamBasedNames[6],
      number: 8,
      position: "CM",
      isStarter: true,
      rating: 6.4,
      nationality: "UGA",
      age: 26,
      marketValue: "€3.2M",
      events: [],
    },
    {
      id: "a8",
      name: teamBasedNames[7],
      number: 11,
      position: "RW",
      isStarter: true,
      rating: 6.7,
      nationality: "UGA",
      age: 25,
      marketValue: "€3.6M",
      events: [],
    },
    {
      id: "a9",
      name: teamBasedNames[8],
      number: 7,
      position: "LW",
      isStarter: true,
      rating: 6.9,
      nationality: "UGA",
      age: 24,
      marketValue: "€4.1M",
      events: [],
    },
    {
      id: "a10",
      name: teamBasedNames[9],
      number: 9,
      position: "ST",
      isStarter: true,
      rating: 7.1,
      nationality: "UGA",
      age: 27,
      marketValue: "€4.8M",
      events: awayEvents.slice(1, 2),
    },
    {
      id: "a11",
      name: teamBasedNames[10],
      number: 10,
      position: "CAM",
      isStarter: true,
      rating: 6.6,
      nationality: "UGA",
      age: 28,
      marketValue: "€3.4M",
      events: [],
    },
  ];
};

export const generateRealSubstitutePlayers = (
  teamName: string,
  matchId: string
): PlayerData[] => {
  const subNames = generateRealisticPlayerNames(
    `${teamName} Subs`,
    "Ugandan Premier League",
    matchId + "subs"
  );

  return [
    {
      id: "s1",
      name: subNames[0],
      number: 12,
      position: "GK",
      isStarter: false,
      rating: 6.2,
      nationality: "UGA",
      age: 24,
      marketValue: "€1.5M",
    },
    {
      id: "s2",
      name: subNames[1],
      number: 13,
      position: "CB",
      isStarter: false,
      rating: 6.0,
      nationality: "UGA",
      age: 22,
      marketValue: "€1.8M",
    },
    {
      id: "s3",
      name: subNames[2],
      number: 14,
      position: "CM",
      isStarter: false,
      rating: 6.1,
      nationality: "UGA",
      age: 20,
      marketValue: "€2.1M",
    },
    {
      id: "s4",
      name: subNames[3],
      number: 15,
      position: "ST",
      isStarter: false,
      rating: 6.4,
      nationality: "UGA",
      age: 19,
      marketValue: "€2.5M",
    },
    {
      id: "s5",
      name: subNames[4],
      number: 16,
      position: "LB",
      isStarter: false,
      rating: 5.9,
      nationality: "UGA",
      age: 23,
      marketValue: "€1.7M",
    },
    {
      id: "s6",
      name: subNames[5],
      number: 17,
      position: "RW",
      isStarter: false,
      rating: 6.3,
      nationality: "UGA",
      age: 21,
      marketValue: "€2.2M",
    },
    {
      id: "s7",
      name: subNames[6],
      number: 18,
      position: "CDM",
      isStarter: false,
      rating: 6.0,
      nationality: "UGA",
      age: 25,
      marketValue: "€1.9M",
    },
    {
      id: "s8",
      name: subNames[7],
      number: 19,
      position: "LW",
      isStarter: false,
      rating: 6.2,
      nationality: "UGA",
      age: 22,
      marketValue: "€2.0M",
    },
  ];
};

// Helper function to generate match events for players
export const generateMatchEvents = (matchId: string, team: "home" | "away") => {
  const events = [];
  const seed = parseInt(matchId.slice(-3)) + (team === "away" ? 100 : 0);

  // Simple seeded random implementation
  const seededRandom = () => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };

  // Generate some realistic match events
  if (seededRandom() > 0.7) {
    events.push({
      type: "goal" as const,
      minute: Math.floor(seededRandom() * 90) + 1,
    });
  }
  if (seededRandom() > 0.6) {
    events.push({
      type: "yellow_card" as const,
      minute: Math.floor(seededRandom() * 90) + 1,
    });
  }
  if (seededRandom() > 0.9) {
    events.push({
      type: "red_card" as const,
      minute: Math.floor(seededRandom() * 90) + 1,
    });
  }

  return events;
};

export const generateComprehensivePlayerStats = (
  team: "home" | "away",
  matchId: string,
  matchStatus?: string
) => {
  const players =
    team === "home" ? generateHomeTeamPlayers() : generateAwayTeamPlayers();
  const seed = matchId ? parseInt(matchId.slice(-2), 36) : Math.random() * 1000;

  // ✅ FIXED: For upcoming matches, return just lineup data with zero stats
  if (matchStatus === "upcoming") {
    return players.map((player, index) => ({
      ...player,
      timePlayed: 0,
      goals: 0,
      assists: 0,
      shots: 0,
      shotsOnTarget: 0,
      totalPasses: 0,
      successfulPasses: 0,
      passAccuracy: 0,
      keyPasses: 0,
      tackles: 0,
      interceptions: 0,
      yellowCards: 0,
      redCards: 0,
      fouls: 0,
      foulsSuffered: 0,
      offsides: 0,
    }));
  }

  return players.map((player, index) => {
    const playerSeed = seed + index * 13;
    const random = () => {
      const x = Math.sin(playerSeed + index) * 10000;
      return x - Math.floor(x);
    };

    const isGK = player.position === "GK";
    const isDefender = ["CB", "RB", "LB"].includes(player.position);
    const isMidfielder = ["CDM", "CM", "AM"].includes(player.position);
    const isForward = ["RW", "LW", "ST"].includes(player.position);

    // Time played (minutes)
    const timePlayed = Math.floor(random() * 30) + 60; // 60-90 minutes

    // Goals and assists based on position
    let goals = 0;
    let assists = 0;
    if (isForward) {
      goals = Math.floor(random() * 3); // 0-2 goals
      assists = Math.floor(random() * 2); // 0-1 assists
    } else if (isMidfielder) {
      goals = Math.floor(random() * 2); // 0-1 goals
      assists = Math.floor(random() * 3); // 0-2 assists
    } else if (isDefender && !isGK) {
      goals = random() < 0.1 ? 1 : 0; // Rare defender goal
      assists = Math.floor(random() * 2); // 0-1 assists
    }

    // Shots and shots on target
    const shots = isForward
      ? Math.floor(random() * 6) + 1
      : isMidfielder
      ? Math.floor(random() * 4)
      : Math.floor(random() * 2);
    const shotsOnTarget = Math.floor(shots * (0.3 + random() * 0.4)); // 30-70% accuracy

    // Passing stats
    const totalPasses = isGK
      ? Math.floor(random() * 30) + 20
      : isDefender
      ? Math.floor(random() * 60) + 40
      : isMidfielder
      ? Math.floor(random() * 80) + 60
      : Math.floor(random() * 40) + 20;
    const passAccuracy = 0.75 + random() * 0.2; // 75-95% accuracy
    const successfulPasses = Math.floor(totalPasses * passAccuracy);

    // Key passes
    const keyPasses = isMidfielder
      ? Math.floor(random() * 5) + 1
      : isForward
      ? Math.floor(random() * 3)
      : Math.floor(random() * 2);

    // Defensive stats
    const tackles = isDefender
      ? Math.floor(random() * 6) + 2
      : isMidfielder
      ? Math.floor(random() * 4) + 1
      : Math.floor(random() * 2);

    const interceptions = isDefender
      ? Math.floor(random() * 5) + 1
      : isMidfielder
      ? Math.floor(random() * 3)
      : Math.floor(random() * 1);

    // Cards
    const yellowCards = random() < 0.25 ? 1 : 0;
    const redCards = random() < 0.05 ? 1 : 0;

    // Fouls
    const fouls = Math.floor(random() * 3);
    const foulsSuffered = Math.floor(random() * 3);

    // Offsides (for forwards mainly)
    const offsides = isForward
      ? Math.floor(random() * 3)
      : Math.floor(random() * 1);

    return {
      ...player,
      timePlayed,
      goals,
      assists,
      shots,
      shotsOnTarget,
      totalPasses,
      successfulPasses,
      passAccuracy: Math.round(passAccuracy * 100),
      keyPasses,
      tackles,
      interceptions,
      yellowCards,
      redCards,
      fouls,
      foulsSuffered,
      offsides,
    };
  });
};
