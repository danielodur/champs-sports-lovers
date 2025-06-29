interface Team {
  name: string;
  rank?: number | null;
  logo?: string;
  corners?: number;
}

export interface Match {
  id: string;
  sport: string;
  league: string;
  status: 'live' | 'finished' | 'upcoming';
  statusText: string;
  startTime: string;
  home: Team;
  away: Team;
  score: string;
  halfTimeScore: string;
  viewers: string;
  hasVideo: boolean;
  isFavorite: boolean;
}