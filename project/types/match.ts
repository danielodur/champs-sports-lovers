interface Team {
  id?: string; // Team ID from API
  name: string;
  rank?: number | null;
  logo?: string;
  score?: number;
  corners?: number;
  yellowCards?: number;
  redCards?: number;
  fouls?: number;
  offsides?: number;
  possession?: number;
}

export interface Match {
  id: string;
  sport: string;
  league: string;
  leagueLogo?: string | null; // ✅ API-provided league logo URL
  leagueId?: number | null; // ✅ API-provided league ID for logo construction
  status: "live" | "finished" | "upcoming";
  statusText: string;
  startTime: string;
  time?: string; // Match minute for live matches (e.g., "45", "90+2")
  home: Team;
  away: Team;
  score: string;
  halfTimeScore: string;
  viewers: string;
  hasVideo: boolean;
  isFavorite: boolean;
  addedTime: string;
  round?: string; // Round/matchday information (e.g., "Round 18", "Regular Season - 1")
  // ✅ API-driven venue data (from fixture.venue)
  venueName?: string | null;
  venueCity?: string | null;
  venueCapacity?: number | null;
}
