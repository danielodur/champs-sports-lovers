interface Team {
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
}
