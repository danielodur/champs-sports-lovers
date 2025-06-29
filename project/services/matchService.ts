import { Match } from '@/types/match';
import { sportsApiService } from './sportsApiService';
import { favoritesService } from './favoritesService';
import Constants from 'expo-constants';

// Simple cache for match results
const cache = new Map<string, { data: Match[]; timestamp: number }>();
const CACHE_DURATION = 30000; // 30 seconds for general matches
const LIVE_CACHE_DURATION = 15000; // 15 seconds for live matches (faster goal detection)

// Subscribers for live updates
type MatchUpdateCallback = (matches: Match[]) => void;
const subscribers = new Set<MatchUpdateCallback>();

// Subscribe to match updates
export function subscribeToMatchUpdates(callback: MatchUpdateCallback): () => void {
  subscribers.add(callback);
  return () => subscribers.delete(callback);
}

// Notify all subscribers of match updates
function notifySubscribers(matches: Match[]): void {
  subscribers.forEach(callback => {
    try {
      callback(matches);
    } catch (error) {
      console.error('Error in match update callback:', error);
    }
  });
}

// Main function to fetch matches
export async function fetchMatches(sport: string, filter: string, selectedDate?: string): Promise<Match[]> {
  try {
    console.log(`🏈 FETCHING MATCHES: ${sport} | ${filter} | ${selectedDate || 'today'}`);
    
    const cacheKey = `${sport}-${filter}-${selectedDate || 'today'}`;
    const cached = cache.get(cacheKey);
    
    // Use shorter cache duration for live matches for better goal detection
    const cacheDuration = filter === 'live' ? LIVE_CACHE_DURATION : CACHE_DURATION;
    
    if (cached && (Date.now() - cached.timestamp) < cacheDuration) {
      console.log(`💾 Cache hit: ${cached.data.length} matches (${filter})`);
      return cached.data;
    }

    // Check configuration
    const enableRealData = Constants.expoConfig?.extra?.enableRealData ?? true;
    const useMockData = Constants.expoConfig?.extra?.useMockData ?? false;

    if (!enableRealData || useMockData) {
      console.log('⚠️ Real data disabled or mock data enabled, returning empty array');
      return [];
    }

    let apiMatches: any[] = [];

    // Handle different filter types
    switch (filter) {
      case 'all':
        // Fetch comprehensive match data for 'all' filter
        console.log('📊 Fetching ALL matches (live + upcoming + recent finished)');
        try {
          const [liveMatches, upcomingMatches, finishedMatches] = await Promise.all([
            sportsApiService.getLiveScores(sport),
            sportsApiService.getFixtures(sport, selectedDate),
            sportsApiService.getFinishedMatches(sport)
          ]);
          
          // Combine all matches
          apiMatches = [...liveMatches, ...upcomingMatches, ...finishedMatches];
          
          // Remove duplicates based on match ID
          const uniqueMatches = new Map();
          apiMatches.forEach(match => {
            if (match && match.id && !uniqueMatches.has(match.id)) {
              uniqueMatches.set(match.id, match);
            }
          });
          apiMatches = Array.from(uniqueMatches.values());
          
          console.log(`📊 ALL matches: ${liveMatches.length} live + ${upcomingMatches.length} upcoming + ${finishedMatches.length} finished = ${apiMatches.length} unique`);
        } catch (error) {
          console.log('❌ Error fetching all matches:', String(error));
          apiMatches = [];
        }
        break;

      case 'live':
        console.log('🔴 Fetching LIVE matches');
        apiMatches = await sportsApiService.getLiveScores(sport);
        break;

      case 'fixture':
        console.log('📅 Fetching UPCOMING matches');
        apiMatches = await sportsApiService.getFixtures(sport, selectedDate);
        break;

      case 'finished':
        console.log('🏁 Fetching FINISHED matches');
        apiMatches = await sportsApiService.getFinishedMatches(sport);
        break;

      case 'favorites':
        // Get all matches and filter favorites
        const [live, upcoming, finished] = await Promise.all([
          sportsApiService.getLiveScores(sport),
          sportsApiService.getFixtures(sport),
          sportsApiService.getFinishedMatches(sport)
        ]);
        const allMatches = [...live, ...upcoming, ...finished];
        const favoriteMatches = await favoritesService.getFavorites();
        apiMatches = allMatches.filter(match => 
          favoriteMatches.some((fav: any) => fav.id === match.id)
        );
        console.log(`⭐ FAVORITES: ${apiMatches.length} matches from favorites`);
        break;

      default:
        console.log(`⚠️ Unknown filter: ${filter}, defaulting to live matches`);
        apiMatches = await sportsApiService.getLiveScores(sport);
    }

    console.log(`📦 RAW API RESULT: ${apiMatches.length} matches from API`);

    // Convert API matches to Match format
    let convertedMatches: Match[] = [];
    if (Array.isArray(apiMatches)) {
      convertedMatches = apiMatches.map((apiMatch, index) => {
        try {
          if (!apiMatch || typeof apiMatch !== 'object') return null;
          return sportsApiService.convertToMatch(apiMatch);
        } catch (error) {
          console.log(`⚠️ Failed to convert match ${index}:`, String(error));
          return null;
        }
      }).filter(Boolean) as Match[];
    }
    
    // Sort matches appropriately
    convertedMatches = sortMatches(convertedMatches, filter);
    
    // Cache results
    cache.set(cacheKey, { data: convertedMatches, timestamp: Date.now() });
    
    // Notify subscribers
    notifySubscribers(convertedMatches);
    
    console.log(`✅ FINAL RESULT: ${convertedMatches.length} matches for ${filter} filter`);
    return convertedMatches;
    
  } catch (error) {
    console.log(`⚠️ Error fetching matches:`, String(error));
    return [];
  }
}

// Sort matches based on filter type
function sortMatches(matches: Match[], filter: string): Match[] {
  if (matches.length === 0) return matches;
  
  const sortedMatches = [...matches];
  
  // Always prioritize live matches first
  sortedMatches.sort((a, b) => {
    // Live matches always come first
    if (a.status === 'live' && b.status !== 'live') return -1;
    if (b.status === 'live' && a.status !== 'live') return 1;
    
    // Then sort by filter-specific logic
    if (filter === 'finished') {
      // Finished matches: most recent first (reverse chronological)
      return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
    } else {
      // Live and upcoming: earliest first (chronological)
      return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
    }
  });
  
  return sortedMatches;
}

// Fetch hot matches for Top screen
export async function fetchHotMatches(category: 'live' | 'upcoming' | 'premier' | 'champions' | 'nba' | 'finished' | 'uganda'): Promise<Match[]> {
  try {
    console.log(`🔥 FETCHING HOT MATCHES: ${category}`);
    
    let liveScoreMatches: any[] = [];
    
    // Get appropriate matches based on category
    switch (category) {
      case 'live':
        liveScoreMatches = await sportsApiService.getLiveScores('football');
        break;
        
      case 'upcoming':
        liveScoreMatches = await sportsApiService.getFixtures('football');
        break;
        
      case 'premier':
        liveScoreMatches = await sportsApiService.getHotMatches('premier');
        break;
        
      case 'champions':
        liveScoreMatches = await sportsApiService.getHotMatches('champions');
        break;
        
      case 'nba':
        liveScoreMatches = await sportsApiService.getHotMatches('nba');
        break;
        
      case 'finished':
        liveScoreMatches = await sportsApiService.getFinishedMatches('football');
        break;
        
      case 'uganda':
        // Get all matches and filter for Uganda
        const allMatches = await sportsApiService.getLiveScores('football');
        liveScoreMatches = allMatches.filter(match => {
          if (!match || !match.league) return false;
          const league = match.league.toLowerCase();
          const homeTeam = match.homeTeam?.toLowerCase() || '';
          const awayTeam = match.awayTeam?.toLowerCase() || '';
          
          return league.includes('uganda') || 
                 homeTeam.includes('uganda') || 
                 awayTeam.includes('uganda') ||
                 league.includes('startimes') ||
                 league.includes('fufa');
        });
        break;
        
      default:
        liveScoreMatches = [];
    }
    
    // Convert to Match format
    let hotMatches: Match[] = [];
    if (Array.isArray(liveScoreMatches)) {
      hotMatches = liveScoreMatches.map(liveScore => {
        try {
          if (!liveScore || typeof liveScore !== 'object') return null;
          return sportsApiService.convertToMatch(liveScore);
        } catch (error) {
          console.log(`⚠️ Failed to convert hot match:`, String(error));
          return null;
        }
      }).filter(Boolean) as Match[];
    }
    
    // Sort hot matches
    hotMatches = sortHotMatches(hotMatches, category);
    
    console.log(`✅ HOT MATCHES SUCCESS: ${hotMatches.length} ${category} matches ready`);
    return hotMatches; // Show ALL available matches - no artificial limit
    
  } catch (error) {
    console.log(`⚠️ Error in fetchHotMatches for ${category}:`, String(error));
    return [];
  }
}

// Sort hot matches based on category
function sortHotMatches(matches: Match[], category: string): Match[] {
  if (matches.length === 0) return matches;
  
  return matches.sort((a, b) => {
    // Live matches always first
    if (a.status === 'live' && b.status !== 'live') return -1;
    if (b.status === 'live' && a.status !== 'live') return 1;
    
    // Then by league priority
    const getLeaguePriority = (league: string): number => {
      const l = league.toLowerCase();
      if (l.includes('premier league') && !l.includes('uganda')) return 1;
      if (l.includes('champions league')) return 2;
      if (l.includes('la liga')) return 3;
      if (l.includes('serie a')) return 4;
      if (l.includes('bundesliga')) return 5;
      if (l.includes('nba')) return 1;
      if (l.includes('uganda')) return 1;
      return 10;
    };
    
    const priorityDiff = getLeaguePriority(a.league) - getLeaguePriority(b.league);
    if (priorityDiff !== 0) return priorityDiff;
    
    // Finally by time
    if (category === 'finished') {
      return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
    } else {
      return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
    }
  });
}

// Clear cache when needed
export function clearMatchCache(): void {
  cache.clear();
  sportsApiService.clearCache();
  console.log('🗑️ Match cache cleared');
}

// Auto-refresh live matches every 30 seconds
let autoRefreshInterval: NodeJS.Timeout | null = null;

export function startAutoRefresh(): void {
  if (autoRefreshInterval) return;
  
  autoRefreshInterval = setInterval(async () => {
    try {
      // Only refresh live matches to avoid unnecessary API calls
      const liveMatches = await fetchMatches('football', 'live');
      if (liveMatches.length > 0) {
        console.log(`🔄 Auto-refreshed ${liveMatches.length} live matches for goal detection`);
      }
    } catch (error) {
      console.log('⚠️ Auto-refresh error:', String(error));
    }
  }, 30000); // Every 30 seconds
  
  console.log('🚀 Auto-refresh started for live matches');
}

export function stopAutoRefresh(): void {
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval);
    autoRefreshInterval = null;
    console.log('⏹️ Auto-refresh stopped');
  }
}