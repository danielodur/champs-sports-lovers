// ✅ NEW: Dedicated Sportradar API Service
// Provides advanced Sportradar features like team profiles, competitions, statistics, and news

export interface SportRadarCompetition {
  id: string;
  name: string;
  category: {
    id: string;
    name: string;
    country_code: string;
  };
  current_season?: {
    id: string;
    name: string;
    start_date: string;
    end_date: string;
  };
}

export interface SportRadarTeamProfile {
  id: string;
  name: string;
  abbreviation?: string;
  country: string;
  country_code: string;
  founded?: number;
  venue?: {
    id: string;
    name: string;
    capacity: number;
    city_name: string;
  };
  manager?: {
    id: string;
    name: string;
    nationality: string;
  };
}

export interface SportRadarPlayerProfile {
  id: string;
  name: string;
  first_name: string;
  last_name: string;
  date_of_birth?: string;
  nationality: string;
  height?: number;
  weight?: number;
  position: string;
  jersey_number?: number;
}

export interface SportRadarStandings {
  season: {
    id: string;
    name: string;
  };
  competition: {
    id: string;
    name: string;
  };
  standings: Array<{
    competitor: {
      id: string;
      name: string;
      abbreviation: string;
    };
    rank: number;
    played: number;
    wins: number;
    draws: number;
    losses: number;
    goals_for: number;
    goals_against: number;
    goal_difference: number;
    points: number;
  }>;
}

export interface SportRadarNews {
  sport_event: {
    id: string;
    competitors: Array<{
      id: string;
      name: string;
    }>;
    competition: {
      id: string;
      name: string;
    };
  };
  title: string;
  content: string;
  published_at: string;
  author?: string;
  category: string;
}

class SportRadarApiService {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes for static data
  private readonly LONG_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes for standings/team profiles
  private lastRequestTime = 0;
  private readonly MIN_REQUEST_INTERVAL = 1000; // 1 second between requests

  // ✅ Sportradar API configuration
  private readonly SPORTRADAR_BASE_URL = 'https://api.sportradar.com/soccer/trial/v4/en';
  private readonly SPORTRADAR_ACCESS_LEVEL = 'trial'; // Change to 'production' when ready
  
  // Get API key from environment variables
  private get sportRadarApiKey(): string {
    const key = process.env.EXPO_PUBLIC_SPORTRADAR_API_KEY;
    if (!key) {
      console.warn('⚠️ SPORTRADAR_API_KEY not found in environment variables');
    }
    return key || '';
  }

  private getCachedData(key: string, duration?: number): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    const cacheTimeout = duration || this.CACHE_DURATION;
    if (Date.now() - cached.timestamp > cacheTimeout) {
      this.cache.delete(key);
      return null;
    }
    return cached.data;
  }

  private setCachedData(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  private async rateLimitedRequest(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL) {
      const waitTime = this.MIN_REQUEST_INTERVAL - timeSinceLastRequest;
      console.log(`⏳ SportRadar Rate limiting: Waiting ${waitTime}ms between requests`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime = Date.now();
  }

  private async makeRequest(endpoint: string, maxRetries: number = 3): Promise<any> {
    if (!this.sportRadarApiKey) {
      console.log('⚠️ SportRadar API key not available - skipping SportRadar data source');
      return null;
    }

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.rateLimitedRequest();
        
        const url = `${this.SPORTRADAR_BASE_URL}${endpoint}?api_key=${this.sportRadarApiKey}`;
        console.log(`🏟️ SportRadar API request (attempt ${attempt}): ${url.replace(this.sportRadarApiKey, '***')}`);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'SportsApp/1.0'
          }
        });

        console.log(`📡 SportRadar API Response status: ${response.status}`);

        if (response.status === 200) {
          const data = await response.json();
          console.log(`✅ SportRadar API success: ${JSON.stringify(data).length} characters received`);
          return data;
        } else if (response.status === 429) {
          const delay = Math.min(15000, 3000 * Math.pow(2, attempt - 1));
          if (attempt < maxRetries) {
            console.log(`⚠️ SportRadar rate limited (429), waiting ${delay}ms before retry ${attempt}/${maxRetries}`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          } else {
            console.error('❌ SportRadar rate limit exceeded after all retries');
            throw new Error('SPORTRADAR_RATE_LIMIT_EXCEEDED');
          }
        } else if (response.status === 403) {
          console.error('🚫 SportRadar API Key Invalid or Access Forbidden (403)');
          throw new Error('SPORTRADAR_API_FORBIDDEN');
        }
        
        throw new Error(`SportRadar API request failed with status: ${response.status}`);
      } catch (error) {
        if (attempt === maxRetries) {
          console.error(`❌ SportRadar API request failed after ${maxRetries} attempts:`, error);
          throw error;
        }
      }
    }
  }

  // ✅ Get all available competitions
  async getCompetitions(): Promise<SportRadarCompetition[]> {
    try {
      console.log('🏆 Fetching competitions from SportRadar...');

      const cacheKey = 'sportradar-competitions';
      const cached = this.getCachedData(cacheKey, this.LONG_CACHE_DURATION);
      if (cached) {
        console.log(`💾 Using cached competitions: ${cached.length} competitions`);
        return cached;
      }

      const data = await this.makeRequest('/competitions.json');
      
      if (data?.competitions) {
        const competitions: SportRadarCompetition[] = data.competitions.map((comp: any) => ({
          id: comp.id,
          name: comp.name,
          category: {
            id: comp.category?.id || '',
            name: comp.category?.name || '',
            country_code: comp.category?.country_code || ''
          },
          current_season: comp.current_season ? {
            id: comp.current_season.id,
            name: comp.current_season.name,
            start_date: comp.current_season.start_date,
            end_date: comp.current_season.end_date
          } : undefined
        }));

        console.log(`✅ SportRadar: Fetched ${competitions.length} competitions`);
        this.setCachedData(cacheKey, competitions);
        return competitions;
      }

      return [];
    } catch (error) {
      console.error('❌ Error getting competitions from SportRadar:', error);
      return [];
    }
  }

  // ✅ Get team profile with detailed information
  async getTeamProfile(teamId: string): Promise<SportRadarTeamProfile | null> {
    try {
      console.log(`👥 Fetching team profile for ${teamId} from SportRadar...`);

      const cacheKey = `sportradar-team-${teamId}`;
      const cached = this.getCachedData(cacheKey, this.LONG_CACHE_DURATION);
      if (cached) {
        console.log(`💾 Using cached team profile for ${teamId}`);
        return cached;
      }

      const data = await this.makeRequest(`/competitors/${teamId}/profile.json`);
      
      if (data?.competitor) {
        const team = data.competitor;
        const profile: SportRadarTeamProfile = {
          id: team.id,
          name: team.name,
          abbreviation: team.abbreviation,
          country: team.country,
          country_code: team.country_code,
          founded: team.founded ? parseInt(team.founded) : undefined,
          venue: team.venue ? {
            id: team.venue.id,
            name: team.venue.name,
            capacity: team.venue.capacity,
            city_name: team.venue.city_name
          } : undefined,
          manager: team.manager ? {
            id: team.manager.id,
            name: team.manager.name,
            nationality: team.manager.nationality
          } : undefined
        };

        console.log(`✅ SportRadar: Fetched team profile for ${team.name}`);
        this.setCachedData(cacheKey, profile);
        return profile;
      }

      return null;
    } catch (error) {
      console.error(`❌ Error getting team profile for ${teamId}:`, error);
      return null;
    }
  }

  // ✅ Get team roster/players
  async getTeamPlayers(teamId: string, seasonId?: string): Promise<SportRadarPlayerProfile[]> {
    try {
      console.log(`👤 Fetching team players for ${teamId} from SportRadar...`);

      const cacheKey = `sportradar-players-${teamId}-${seasonId || 'current'}`;
      const cached = this.getCachedData(cacheKey, this.LONG_CACHE_DURATION);
      if (cached) {
        console.log(`💾 Using cached team players for ${teamId}`);
        return cached;
      }

      // Use current season or specific season
      const endpoint = seasonId 
        ? `/seasons/${seasonId}/competitors/${teamId}/players.json`
        : `/competitors/${teamId}/players.json`;

      const data = await this.makeRequest(endpoint);
      
      if (data?.players) {
        const players: SportRadarPlayerProfile[] = data.players.map((player: any) => ({
          id: player.id,
          name: player.name,
          first_name: player.first_name || '',
          last_name: player.last_name || '',
          date_of_birth: player.date_of_birth,
          nationality: player.nationality || '',
          height: player.height,
          weight: player.weight,
          position: player.position || 'Unknown',
          jersey_number: player.jersey_number
        }));

        console.log(`✅ SportRadar: Fetched ${players.length} players for team ${teamId}`);
        this.setCachedData(cacheKey, players);
        return players;
      }

      return [];
    } catch (error) {
      console.error(`❌ Error getting team players for ${teamId}:`, error);
      return [];
    }
  }

  // ✅ Get season standings
  async getSeasonStandings(seasonId: string): Promise<SportRadarStandings | null> {
    try {
      console.log(`📊 Fetching season standings for ${seasonId} from SportRadar...`);

      const cacheKey = `sportradar-standings-${seasonId}`;
      const cached = this.getCachedData(cacheKey, this.CACHE_DURATION);
      if (cached) {
        console.log(`💾 Using cached standings for season ${seasonId}`);
        return cached;
      }

      const data = await this.makeRequest(`/seasons/${seasonId}/standings.json`);
      
      if (data?.standings && data.standings.length > 0) {
        const standingsData = data.standings[0]; // Usually contains group standings
        
        const standings: SportRadarStandings = {
          season: {
            id: data.season?.id || seasonId,
            name: data.season?.name || 'Unknown Season'
          },
          competition: {
            id: data.competition?.id || '',
            name: data.competition?.name || 'Unknown Competition'
          },
          standings: standingsData.groups?.[0]?.standings?.map((standing: any) => ({
            competitor: {
              id: standing.competitor.id,
              name: standing.competitor.name,
              abbreviation: standing.competitor.abbreviation || ''
            },
            rank: standing.rank,
            played: standing.played,
            wins: standing.wins,
            draws: standing.draws,
            losses: standing.losses,
            goals_for: standing.goals_for,
            goals_against: standing.goals_against,
            goal_difference: standing.goal_difference,
            points: standing.points
          })) || []
        };

        console.log(`✅ SportRadar: Fetched standings with ${standings.standings.length} teams`);
        this.setCachedData(cacheKey, standings);
        return standings;
      }

      return null;
    } catch (error) {
      console.error(`❌ Error getting season standings for ${seasonId}:`, error);
      return null;
    }
  }

  // ✅ Get match timeline with detailed events
  async getMatchTimeline(matchId: string): Promise<any> {
    try {
      console.log(`⏱️ Fetching match timeline for ${matchId} from SportRadar...`);

      const cacheKey = `sportradar-timeline-${matchId}`;
      const cached = this.getCachedData(cacheKey);
      if (cached) {
        console.log(`💾 Using cached timeline for match ${matchId}`);
        return cached;
      }

      const data = await this.makeRequest(`/sport_events/${matchId}/timeline.json`);
      
      if (data?.timeline) {
        console.log(`✅ SportRadar: Fetched timeline with ${data.timeline.length} events for match ${matchId}`);
        this.setCachedData(cacheKey, data);
        return data;
      }

      return null;
    } catch (error) {
      console.error(`❌ Error getting match timeline for ${matchId}:`, error);
      return null;
    }
  }

  // ✅ Get competition info with seasons
  async getCompetitionInfo(competitionId: string): Promise<any> {
    try {
      console.log(`🏆 Fetching competition info for ${competitionId} from SportRadar...`);

      const cacheKey = `sportradar-competition-${competitionId}`;
      const cached = this.getCachedData(cacheKey, this.LONG_CACHE_DURATION);
      if (cached) {
        console.log(`💾 Using cached competition info for ${competitionId}`);
        return cached;
      }

      const data = await this.makeRequest(`/competitions/${competitionId}/info.json`);
      
      if (data?.competition) {
        console.log(`✅ SportRadar: Fetched competition info for ${data.competition.name}`);
        this.setCachedData(cacheKey, data);
        return data;
      }

      return null;
    } catch (error) {
      console.error(`❌ Error getting competition info for ${competitionId}:`, error);
      return null;
    }
  }

  // ✅ Clear cache
  clearCache(): void {
    this.cache.clear();
    console.log('🧹 SportRadar API cache cleared');
  }

  // ✅ Get cache stats
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

export const sportRadarApiService = new SportRadarApiService();
export default sportRadarApiService; 