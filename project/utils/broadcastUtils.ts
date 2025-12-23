import { Fixture } from "../types/football-fixtures-response";

/**
 * Determines if a fixture has video broadcast based on league importance and match characteristics
 */
export const getBroadcastInfo = (fixture: Fixture): { hasVideoBroadcast: boolean; hasAnimationBroadcast: boolean } => {
  // If broadcast info is already available on fixture, use it
  if (fixture.hasVideoBroadcast !== undefined && fixture.hasAnimationBroadcast !== undefined) {
    return {
      hasVideoBroadcast: fixture.hasVideoBroadcast,
      hasAnimationBroadcast: fixture.hasAnimationBroadcast,
    };
  }

  const leagueId = fixture.league?.id;
  const leagueName = fixture.league?.name?.toLowerCase() || "";

  // Major leagues with regular video broadcasts
  const majorVideoLeagues = [
    39,  // Premier League
    140, // La Liga
    78,  // Bundesliga
    135, // Serie A
    61,  // Ligue 1
    2,   // UEFA Champions League
    3,   // UEFA Europa League
    848, // UEFA Europa Conference League
    5,   // UEFA Nations League
    45,  // FA Cup
    48,  // League Cup
    143, // Copa del Rey
    137, // Coppa Italia
    66,  // Coupe de France
    81,  // DFB Pokal
  ];

  // Secondary leagues that sometimes have video broadcasts
  const mediumVideoLeagues = [
    88,  // Eredivisie (Netherlands)
    94,  // Primeira Liga (Portugal)
    203, // Turkish Super League
    218, // Saudi Pro League
    253, // Major League Soccer (MLS)
    39,  // Championship (England)
    144, // Belgian Pro League
    179, // Scottish Premiership
  ];

  // Check if it's a major league match
  const isMajorLeague = majorVideoLeagues.includes(leagueId || 0);

  // Check if it's a medium priority league
  const isMediumLeague = mediumVideoLeagues.includes(leagueId || 0);

  // Check for important match characteristics
  const isInternationalMatch = leagueName.includes("world cup") ||
                               leagueName.includes("euro") ||
                               leagueName.includes("copa america") ||
                               leagueName.includes("nations league");

  // Check if teams suggest high profile (simplified heuristic)
  const homeTeam = fixture.teams?.home?.name?.toLowerCase() || "";
  const awayTeam = fixture.teams?.away?.name?.toLowerCase() || "";

  const topTeams = [
    "manchester united", "manchester city", "liverpool", "chelsea", "arsenal", "tottenham",
    "real madrid", "barcelona", "atletico madrid", "valencia",
    "bayern munich", "borussia dortmund", "rb leipzig",
    "juventus", "inter", "ac milan", "napoli", "roma",
    "paris saint-germain", "marseille", "lyon",
    "ajax", "psv", "feyenoord"
  ];

  const hasTopTeam = topTeams.some(team =>
    homeTeam.includes(team) || awayTeam.includes(team)
  );

  // Determine broadcast availability
  let hasVideoBroadcast = false;

  if (isMajorLeague) {
    // Major leagues: 90% chance of video broadcast
    hasVideoBroadcast = Math.random() > 0.1;
  } else if (isMediumLeague) {
    // Medium leagues: 60% chance of video broadcast
    hasVideoBroadcast = Math.random() > 0.4;
  } else if (isInternationalMatch) {
    // International matches: 95% chance of video broadcast
    hasVideoBroadcast = Math.random() > 0.05;
  } else if (hasTopTeam) {
    // Matches with top teams: 70% chance of video broadcast
    hasVideoBroadcast = Math.random() > 0.3;
  } else {
    // Lower leagues: 25% chance of video broadcast
    hasVideoBroadcast = Math.random() > 0.75;
  }

  // For consistency, use fixture ID as seed for deterministic results
  const fixtureId = fixture.fixture?.id || 0;
  const seed = fixtureId % 100;

  if (isMajorLeague) {
    hasVideoBroadcast = seed < 90; // 90% for major leagues
  } else if (isMediumLeague) {
    hasVideoBroadcast = seed < 60; // 60% for medium leagues
  } else if (isInternationalMatch) {
    hasVideoBroadcast = seed < 95; // 95% for international matches
  } else if (hasTopTeam) {
    hasVideoBroadcast = seed < 70; // 70% for top team matches
  } else {
    hasVideoBroadcast = seed < 25; // 25% for other matches
  }

  return {
    hasVideoBroadcast,
    hasAnimationBroadcast: !hasVideoBroadcast,
  };
};

/**
 * Updates fixture with broadcast information
 */
export const updateFixtureWithBroadcast = (fixture: Fixture): Fixture => {
  const broadcastInfo = getBroadcastInfo(fixture);

  return {
    ...fixture,
    hasVideoBroadcast: broadcastInfo.hasVideoBroadcast,
    hasAnimationBroadcast: broadcastInfo.hasAnimationBroadcast,
  };
};

/**
 * Updates multiple fixtures with broadcast information
 */
export const updateFixturesWithBroadcast = (fixtures: Fixture[]): Fixture[] => {
  return fixtures.map(updateFixtureWithBroadcast);
};
