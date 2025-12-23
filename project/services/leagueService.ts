import { League } from '../types/league';
import { leagues } from '../data/leagues';

export function getLeaguesBySport(sport: string): League[] {
  return leagues[sport] || [];
}

export function organizeLeaguesByAlphabet(leagues: League[]): Record<string, League[]> {
  return leagues.reduce((acc, league) => {
    const firstLetter = league.name[0].toUpperCase();
    if (!acc[firstLetter]) {
      acc[firstLetter] = [];
    }
    acc[firstLetter].push(league);
    return acc;
  }, {} as Record<string, League[]>);
}

export function getAllLeagueIds(sport: string): string[] {
  return leagues[sport]?.map(league => league.id) || [];
}

// ✅ Get hot/featured leagues for a sport
export function getHotLeagues(sport: string): League[] {
  const allLeagues = getLeaguesBySport(sport);
  
  // Hot leagues for football
  const footballHot = [
    'premier-league',
    'la-liga',
    'bundesliga',
    'serie-a',
    'ligue-1',
    'uefa-champions-league',
    'uefa-europa-league'
  ];
  
  // Hot leagues for basketball
  const basketballHot = [
    'nba',
    'euroleague',
    'nbl',
    'cba',
    'euroleague-women',
    'ncaa'
  ];
  
  const hotIds = sport === 'basketball' ? basketballHot : footballHot;
  
  return allLeagues.filter(league => 
    hotIds.includes(league.id)
  ).slice(0, 7); // Return top 7 hot leagues
}