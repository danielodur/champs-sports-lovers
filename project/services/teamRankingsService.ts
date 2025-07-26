import Constants from 'expo-constants';

// TypeScript interfaces
export interface TeamRanking {
  rank: number;
  teamName: string;
  points: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  form: string;
  logo: string;
  lastUpdated: string;
}

export interface FIFARanking {
  team: {
    name: string;
    code: string;
    flag: string;
  };
  rank: number;
  points: number;
}

export interface LeagueStanding {
  rank: number;
  teamId: number;
  teamName: string;
  points: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  form: string;
  logo: string;
}

class TeamRankingsService {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_DURATION = 3600000; // 1 hour

  // All ranking functionality disabled to prevent rate limiting
  async getTeamRanking(teamName: string, leagueName?: string): Promise<number | null> {
    console.log(`⚠️ Rankings disabled to prevent rate limiting for: ${teamName}`);
    return null;
  }

  async getFIFARankings(): Promise<FIFARanking[]> {
    console.log('⚠️ FIFA rankings disabled to prevent rate limiting');
    return [];
  }

  async getLeagueStandings(leagueId: number, season: number): Promise<LeagueStanding[]> {
    console.log(`⚠️ League standings disabled to prevent rate limiting for league: ${leagueId}`);
    return [];
  }

  async getBatchTeamRankings(teams: Array<{name: string, league?: string}>): Promise<Map<string, number>> {
    console.log(`⚠️ Batch rankings disabled to prevent rate limiting`);
    return new Map();
  }

  // Cache management (kept for future use)
  private setCachedData(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  private getCachedData(key: string): any {
    const cached = this.cache.get(key);
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }

  clearExpiredCache(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.CACHE_DURATION) {
        this.cache.delete(key);
      }
    }
  }

  clearCache(): void {
    this.cache.clear();
    console.log('✅ Team rankings cache cleared');
  }
}

const teamRankingsService = new TeamRankingsService();
export default teamRankingsService; 