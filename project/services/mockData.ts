// Mock data for fallback when APIs fail
export const mockLiveMatches = [
  {
    id: 'mock-live-1',
    homeTeam: 'Arsenal',
    awayTeam: 'Chelsea',
    homeScore: 2,
    awayScore: 1,
    status: 'live' as const,
    minute: 67,
    sport: 'football',
    league: 'Premier League',
    date: new Date().toISOString(),
  },
  {
    id: 'mock-live-2', 
    homeTeam: 'Manchester City',
    awayTeam: 'Liverpool',
    homeScore: 1,
    awayScore: 1,
    status: 'live' as const,
    minute: 45,
    sport: 'football',
    league: 'Premier League',
    date: new Date().toISOString(),
  },
  {
    id: 'mock-live-3',
    homeTeam: 'Real Madrid',
    awayTeam: 'Barcelona',
    homeScore: 0,
    awayScore: 2,
    status: 'live' as const,
    minute: 78,
    sport: 'football',
    league: 'La Liga',
    date: new Date().toISOString(),
  },
  {
    id: 'mock-live-4',
    homeTeam: 'Bayern Munich',
    awayTeam: 'Borussia Dortmund',
    homeScore: 3,
    awayScore: 0,
    status: 'live' as const,
    minute: 82,
    sport: 'football',
    league: 'Bundesliga',
    date: new Date().toISOString(),
  },
  {
    id: 'mock-live-5',
    homeTeam: 'PSG',
    awayTeam: 'Marseille',
    homeScore: 1,
    awayScore: 0,
    status: 'live' as const,
    minute: 23,
    sport: 'football',
    league: 'Ligue 1',
    date: new Date().toISOString(),
  }
];

export const mockUpcomingMatches = [
  {
    id: 'mock-upcoming-1',
    homeTeam: 'Tottenham',
    awayTeam: 'West Ham',
    homeScore: 0,
    awayScore: 0,
    status: 'upcoming' as const,
    minute: 0,
    sport: 'football',
    league: 'Premier League',
    date: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
  },
  {
    id: 'mock-upcoming-2',
    homeTeam: 'AC Milan',
    awayTeam: 'Inter Milan',
    homeScore: 0,
    awayScore: 0,
    status: 'upcoming' as const,
    minute: 0,
    sport: 'football',
    league: 'Serie A',
    date: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4 hours from now
  },
  {
    id: 'mock-upcoming-3',
    homeTeam: 'Atletico Madrid',
    awayTeam: 'Valencia',
    homeScore: 0,
    awayScore: 0,
    status: 'upcoming' as const,
    minute: 0,
    sport: 'football',
    league: 'La Liga',
    date: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), // 6 hours from now
  }
];

export const mockFinishedMatches = [
  {
    id: 'mock-finished-1',
    homeTeam: 'Newcastle',
    awayTeam: 'Brighton',
    homeScore: 2,
    awayScore: 0,
    status: 'finished' as const,
    minute: 90,
    sport: 'football',
    league: 'Premier League',
    date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
  },
  {
    id: 'mock-finished-2',
    homeTeam: 'Juventus',
    awayTeam: 'Roma',
    homeScore: 1,
    awayScore: 3,
    status: 'finished' as const,
    minute: 90,
    sport: 'football',
    league: 'Serie A',
    date: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
  }
];
