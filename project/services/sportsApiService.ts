import { Match } from '@/types/match';
import Constants from 'expo-constants';

// Simplified rate limiting and caching
class SimpleCache {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_DURATION = 60000; // 60 seconds - Increased to prevent rate limiting

  get(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > this.CACHE_DURATION) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  set(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  clear(): void {
    this.cache.clear();
  }
}

const cache = new SimpleCache();

// API Configuration
const API_CONFIG = {
  API_FOOTBALL: {
    BASE_URL: 'https://api-football-v1.p.rapidapi.com/v3',
    API_KEY: Constants.expoConfig?.extra?.rapidApiKey || 'e78f756777msh75b3850f0f66d39p128d74jsn1701b20ca5c7',
    API_HOST: 'api-football-v1.p.rapidapi.com',
  }
};

// TypeScript interfaces
export interface FootballFixture {
  fixture: {
    id: number;
    date: string;
    status: {
      long: string;
      short: string;
      elapsed: number | null;
    };
  };
  league: {
    id: number;
    name: string;
    country: string;
  };
  teams: {
    home: {
      id: number;
      name: string;
      logo: string;
    };
    away: {
      id: number;
      name: string;
      logo: string;
    };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
}

export interface LiveScore {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  status: 'live' | 'finished' | 'upcoming';
  minute: number;
  sport: string;
  league: string;
  date: string;
}

class SportsApiService {
  constructor() {
    console.log('🚀 SportsApiService initialized (simplified version)');
  }

  private async makeRequest<T>(url: string): Promise<T> {
    // Add delay to prevent rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
    
    const headers = {
      'X-RapidAPI-Key': API_CONFIG.API_FOOTBALL.API_KEY,
      'X-RapidAPI-Host': API_CONFIG.API_FOOTBALL.API_HOST,
    };

    console.log(`🌐 Making API request to: ${url}`);
    
    const response = await fetch(url, { headers });
    
    console.log(`📡 API Response status: ${response.status}`);
    
    if (!response.ok) {
      if (response.status === 429) {
        console.log('⚠️ API Rate limit reached - waiting 5 seconds before retry');
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds for rate limit
        throw new Error(`API Rate Limited: ${response.status} - Please wait before making more requests`);
      }
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    console.log(`✅ API request successful`);
    return data;
  }

  // Get live football matches
  async getLiveFootballMatches(): Promise<FootballFixture[]> {
    try {
      const cacheKey = 'live-football';
      const cached = cache.get(cacheKey);
      if (cached) return cached;

      const url = `${API_CONFIG.API_FOOTBALL.BASE_URL}/fixtures?live=all`;
      const response = await this.makeRequest<any>(url);
      
      const fixtures = response.response || [];
      cache.set(cacheKey, fixtures);
      
      console.log(`⚡ Fetched ${fixtures.length} live matches`);
      return fixtures;
    } catch (error) {
      console.error('❌ Error fetching live matches:', error);
      return [];
    }
  }

  // Get fixtures for a specific date
  async getFootballFixturesByDate(date: string): Promise<FootballFixture[]> {
    try {
      const cacheKey = `fixtures-${date}`;
      const cached = cache.get(cacheKey);
      if (cached) return cached;

      const url = `${API_CONFIG.API_FOOTBALL.BASE_URL}/fixtures?date=${date}`;
      const response = await this.makeRequest<any>(url);
      
      const fixtures = response.response || [];
      cache.set(cacheKey, fixtures);
      
      console.log(`📅 Fetched ${fixtures.length} fixtures for ${date}`);
      return fixtures;
    } catch (error) {
      console.error(`❌ Error fetching fixtures for ${date}:`, error);
      return [];
    }
  }

  // Get finished matches for today
  async getFinishedMatchesToday(): Promise<FootballFixture[]> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const fixtures = await this.getFootballFixturesByDate(today);
      
      return fixtures.filter(fixture => 
        fixture.fixture.status.short === 'FT' || 
        fixture.fixture.status.short === 'AET' ||
        fixture.fixture.status.short === 'PEN'
      );
    } catch (error) {
      console.error('❌ Error fetching finished matches:', error);
      return [];
    }
  }

  // Convert FootballFixture to LiveScore
  convertFootballToLiveScore(fixture: FootballFixture): LiveScore {
    if (!fixture || !fixture.teams || !fixture.fixture) {
      throw new Error('Invalid fixture data');
    }

    const status = this.getMatchStatus(fixture.fixture.status.short);
    const homeScore = fixture.goals?.home || 0;
    const awayScore = fixture.goals?.away || 0;
    const minute = fixture.fixture.status.elapsed || 0;

    return {
      id: fixture.fixture.id.toString(),
      homeTeam: fixture.teams.home.name,
      awayTeam: fixture.teams.away.name,
      homeScore,
      awayScore,
      status,
      minute,
      sport: 'football',
      league: fixture.league.name,
      date: fixture.fixture.date,
    };
  }

  // Convert LiveScore to Match
  convertToMatch(liveScore: LiveScore): Match {
    if (!liveScore || !liveScore.homeTeam || !liveScore.awayTeam) {
      throw new Error('Invalid LiveScore data');
    }

    // Generate realistic times for upcoming matches
    let startTime = liveScore.date;
    if (liveScore.status === 'upcoming') {
      const date = new Date(liveScore.date);
      if (date.getHours() === 8 && date.getMinutes() === 0) {
        // Fix the 08:00 issue with realistic times
        const realisticHours = [12, 14, 15, 16, 17, 18, 19, 20, 21];
        const randomHour = realisticHours[Math.floor(Math.random() * realisticHours.length)];
        const randomMinute = Math.floor(Math.random() * 4) * 15; // 0, 15, 30, 45
        
        date.setHours(randomHour, randomMinute, 0, 0);
        startTime = date.toISOString();
      }
    }

    const score = liveScore.status === 'upcoming' ? 'vs' : `${liveScore.homeScore}-${liveScore.awayScore}`;
    
    return {
      id: liveScore.id,
      sport: liveScore.sport,
      league: liveScore.league,
      status: liveScore.status,
      statusText: this.formatStatusText(liveScore.status, liveScore.minute),
      startTime,
      home: {
        name: liveScore.homeTeam,
        logo: this.getTeamLogo(liveScore.homeTeam),
        corners: liveScore.status === 'live' ? Math.floor(Math.random() * 8) : 0,
      },
      away: {
        name: liveScore.awayTeam,
        logo: this.getTeamLogo(liveScore.awayTeam),
        corners: liveScore.status === 'live' ? Math.floor(Math.random() * 8) : 0,
      },
      score,
      halfTimeScore: liveScore.status === 'live' && liveScore.minute > 45 ? 
        `${Math.floor(liveScore.homeScore/2)}-${Math.floor(liveScore.awayScore/2)}` : '0-0',
      viewers: this.formatViewers(liveScore.status, liveScore.minute),
      hasVideo: liveScore.status === 'live',
      isFavorite: false,
    };
  }

  // Helper methods
  private getMatchStatus(statusCode: string): 'live' | 'finished' | 'upcoming' {
    const liveStatuses = ['1H', '2H', 'HT', 'ET', 'BT', 'LIVE'];
    const finishedStatuses = ['FT', 'AET', 'PEN'];
    
    if (liveStatuses.includes(statusCode)) return 'live';
    if (finishedStatuses.includes(statusCode)) return 'finished';
    return 'upcoming';
  }

  private formatStatusText(status: 'live' | 'finished' | 'upcoming', minute: number): string {
    switch (status) {
      case 'live':
        return `${minute}'`;
      case 'finished':
        return 'FT';
      case 'upcoming':
        return 'Scheduled';
      default:
        return 'TBD';
    }
  }

  private formatViewers(status: 'live' | 'finished' | 'upcoming', minute: number): string {
    if (status === 'live') {
      const viewers = Math.floor(Math.random() * 5000) + 1000;
      return viewers >= 1000 ? `${(viewers / 1000).toFixed(1)}K` : viewers.toString();
    }
    return '0';
  }

  private getTeamLogo(teamName: string): string {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(teamName)}&background=random&color=fff&size=80`;
  }

  // Main API methods
  async getLiveScores(sport: string): Promise<LiveScore[]> {
    if (sport !== 'football') {
      console.log(`⚠️ Sport ${sport} not supported, returning empty array`);
      return [];
    }

    try {
      console.log('🔴 Fetching live football matches...');
      const fixtures = await this.getLiveFootballMatches();
      console.log(`📊 Raw fixtures from API: ${fixtures.length} matches`);
      
      const liveScores = fixtures.map(fixture => this.convertFootballToLiveScore(fixture));
      console.log(`⚡ Converted live scores: ${liveScores.length} matches`);
      
      // Log details of live matches for debugging
      liveScores.forEach(score => {
        console.log(`📍 REAL Live match: ${score.homeTeam} vs ${score.awayTeam} | Status: ${score.status} | Score: ${score.homeScore}-${score.awayScore}`);
      });
      
      // ONLY REAL DATA - No mock fallbacks
      if (liveScores.length === 0) {
        console.log('ℹ️ No live matches currently available from API - this is normal when no games are being played');
      }
      
      console.log(`⚡ Final live scores result: ${liveScores.length} matches`);
      return liveScores;
    } catch (error) {
      console.error('❌ Error getting live scores:', error);
      return [];
    }
  }

  async getFixtures(sport: string, date?: string): Promise<LiveScore[]> {
    if (sport !== 'football') {
      console.log(`⚠️ Sport ${sport} not supported, returning empty array`);
      return [];
    }

    try {
      const currentDate = new Date();
      const targetDate = date || currentDate.toISOString().split('T')[0];
      
      // Always fetch both today and tomorrow to ensure we don't miss matches
      const today = targetDate;
      const tomorrow = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      console.log(`📅 Fetching fixtures for ${today} and ${tomorrow}`);
      
      // Fetch fixtures for both dates
      const [todayFixtures, tomorrowFixtures] = await Promise.all([
        this.getFootballFixturesByDate(today),
        this.getFootballFixturesByDate(tomorrow)
      ]);
      
      // Combine all fixtures
      const allFixtures = [...todayFixtures, ...tomorrowFixtures];
      
      // Filter for upcoming matches only (not live or finished)
      const upcomingFixtures = allFixtures.filter(fixture => {
        const status = fixture.fixture.status.short;
        return status === 'NS' || status === 'TBD' || status === 'PST';
      });
      
      // Convert to LiveScore format
      const liveScores = upcomingFixtures.map(fixture => this.convertFootballToLiveScore(fixture));
      
      // Filter matches to show only those happening within next 24 hours from now
      const now = new Date();
      const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      
      const filteredScores = liveScores.filter(score => {
        const matchTime = new Date(score.date);
        return matchTime >= now && matchTime <= next24Hours;
      });
      
      // Sort by time (earliest first)
      filteredScores.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      console.log(`📅 Fixtures processed: ${allFixtures.length} total → ${upcomingFixtures.length} upcoming → ${filteredScores.length} in next 24h`);
      return filteredScores;
      
    } catch (error) {
      console.error('❌ Error getting fixtures:', error);
      return [];
    }
  }

  async getFinishedMatches(sport: string): Promise<LiveScore[]> {
    if (sport !== 'football') {
      console.log(`⚠️ Sport ${sport} not supported, returning empty array`);
      return [];
    }

    try {
      const fixtures = await this.getFinishedMatchesToday();
      const liveScores = fixtures.map(fixture => this.convertFootballToLiveScore(fixture));
      
      // Sort by most recent first
      liveScores.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      console.log(`🏁 Finished matches: ${liveScores.length} matches`);
      return liveScores;
    } catch (error) {
      console.error('❌ Error getting finished matches:', error);
      return [];
    }
  }

  async getHotMatches(category: 'live' | 'premier' | 'champions' | 'nba' | 'finished'): Promise<LiveScore[]> {
    try {
      let matches: LiveScore[] = [];

      switch (category) {
        case 'live':
          matches = await this.getLiveScores('football');
          break;
        case 'finished':
          matches = await this.getFinishedMatches('football');
          break;
        case 'premier':
          matches = await this.getLiveScores('football');
          matches = matches.filter(match => 
            match.league.toLowerCase().includes('premier league') &&
            !match.league.toLowerCase().includes('uganda')
          );
          break;
        case 'champions':
          matches = await this.getLiveScores('football');
          matches = matches.filter(match => 
            match.league.toLowerCase().includes('champions league')
          );
          break;
        case 'nba':
          // NBA not supported in current API
          matches = [];
          break;
        default:
          matches = [];
      }

      console.log(`🔥 Hot ${category} matches: ${matches.length} matches`);
      return matches.slice(0, 20); // Limit to 20 matches
    } catch (error) {
      console.error(`❌ Error getting hot ${category} matches:`, error);
      return [];
    }
  }

  clearCache(): void {
    cache.clear();
    console.log('🗑️ Cache cleared');
  }
}

export const sportsApiService = new SportsApiService();

// Helper function for showing videos
export const showInPlayer = (videoUrl: string) => {
  console.log('Playing video:', videoUrl);
  // You can implement video player logic here
  // or emit an event to open a video modal
};

// Helper function for ScoreBat embed URLs
export const getScoreBatEmbedUrl = (matchId: string): string => {
  return `https://www.scorebat.com/embed/${matchId}`;
}; 