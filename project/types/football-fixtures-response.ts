// RESPONSE EXAMPLE
// https://dashboard.api-football.com/soccer/fixtures response

// TYPES
export interface FootballFixturesResponse {
  get: string;
  parameters: {
    live: string;
    date: string | null;
  };
  errors: string[] | { requests: string; token: string };
  results: number;
  paging: {
    current: number;
    total: number;
  };
  response: Fixture[];
}

export interface Fixture {
  fixture: {
    id: number;
    referee: string | null;
    timezone: string;
    date: string;
    timestamp: number;
    periods: {
      first: number | null;
      second: number | null;
    };
    venue: {
      id: number | null;
      name: string | null;
      city: string | null;
    };
    status: {
      long: string | null;
      short:
        | "NS"
        | "1H"
        | "HT"
        | "2H"
        | "ET"
        | "BT"
        | "P"
        | "FT"
        | "AET"
        | "PEN"
        | "AOT"  // ✅ BASKETBALL: After OverTime
        | "CANC"
        | "ABD"
        | "SUSP"
        | "INT"
        | "PST"
        | null;
      elapsed: number | null;
      extra: number | null;
    };
  };
  league: FixtureLeague;
  teams: {
    home: {
      id: number | null;
      name: string | null;
      logo: string | null;
    };
    away: {
      id: number | null;
      name: string | null;
      logo: string | null;
    };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
  score: {
    halftime: {
      home: number | null;
      away: number | null;
    };
    fulltime: {
      home: number | null;
      away: number | null;
    };
    extratime: {
      home: number | null;
      away: number | null;
    };
    penalty: {
      home: number | null;
      away: number | null;
    };
  };
  events: FixtureEvent[] | null;
  isFavorite?: boolean;
  goalStatus?: "goal_scored" | "goal_cancelled" | undefined;
  hasVideoBroadcast?: boolean;
  hasAnimationBroadcast?: boolean;
  homeTeamRank?: number | null;
  awayTeamRank?: number | null;
}

export interface FixtureLeague {
  id: number | null;
  name: string | null;
  country: string | null;
  logo: string | null;
  flag: string | null;
}

export interface FixtureEvent {
  time: {
    elapsed: number | null;
    extra: number | null;
  };
  team: FixtureEventTeam;
  player: FixtureEventPlayer;
  assist: FixtureEventAssist;
  type: string | null;
  detail: string | null;
  comments: string | null;
}

export interface FixtureEventPlayer {
  id: number | null;
  name: string | null;
}

export interface FixtureEventAssist {
  id: number | null;
  name: string | null;
}

export interface FixtureEventTeam {
  id: number | null;
  name: string | null;
  logo: string | null;
}
