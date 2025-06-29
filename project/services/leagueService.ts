import { League } from '@/types/league';
import { leagues } from '@/data/leagues';

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