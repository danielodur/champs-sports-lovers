import { Match } from '../types/match';
import { fetchMatches, getRealTimeMatchData } from './matchService';

class DataConsistencyService {
  private matchDataCache = new Map<string, Match>();
  private lastSync = new Map<string, number>();
  private readonly SYNC_INTERVAL = 10000; // 10 seconds between syncs

  // Sync match data between screens
  async syncMatchData(matchId: string): Promise<Match | null> {
    try {
      const lastSyncTime = this.lastSync.get(matchId) || 0;
      const now = Date.now();

      // Don't sync too frequently
      if (now - lastSyncTime < this.SYNC_INTERVAL) {
        const cached = this.matchDataCache.get(matchId);
        if (cached) {
          console.log(`📊 Using recent sync data for match ${matchId}`);
          return cached;
        }
      }

      console.log(`🔄 Syncing data for match ${matchId}`);

      // Get fresh data from all sources
      const [allMatches, liveMatches, realtimeData] = await Promise.allSettled([
        fetchMatches('football', 'all'),
        fetchMatches('football', 'live'),
        getRealTimeMatchData(matchId)
      ]);

      // Find the match in any of the sources
      let matchData: Match | null = null;

      if (allMatches.status === 'fulfilled') {
        matchData = allMatches.value.find(m => m.id === matchId) || matchData;
      }

      if (liveMatches.status === 'fulfilled') {
        const liveMatch = liveMatches.value.find(m => m.id === matchId);
        if (liveMatch) {
          matchData = liveMatch; // Prefer live data
        }
      }

      // Enhance with realtime data if available
      if (realtimeData.status === 'fulfilled' && realtimeData.value.liveUpdates && matchData) {
        const liveUpdates = realtimeData.value.liveUpdates;
        
        matchData = {
          ...matchData,
          score: liveUpdates.status === 'upcoming' ? 'vs' : `${liveUpdates.home_score}-${liveUpdates.away_score}`,
          status: liveUpdates.status as 'live' | 'finished' | 'upcoming',
          statusText: this.calculateStatusText(liveUpdates.minute, liveUpdates.status),
        };
      }

      if (matchData) {
        // Cache the synced data
        this.matchDataCache.set(matchId, matchData);
        this.lastSync.set(matchId, now);
        
        console.log(`✅ Synced data for match ${matchId}: ${matchData.score}`);
        return matchData;
      }

      console.warn(`⚠️ No data found for match ${matchId}`);
      return null;

    } catch (error) {
      console.error(`❌ Failed to sync match data for ${matchId}:`, error);
      
      // Return cached data if sync fails
      const cached = this.matchDataCache.get(matchId);
      return cached || null;
    }
  }

  // Calculate proper status text
  private calculateStatusText(minute: string, status: string): string {
    if (status === 'finished') return 'FT';
    if (status === 'upcoming') return '';
    if (minute === 'HT') return 'HT';
    if (minute === 'FT') return 'FT';
    
    // Live match minute formatting
    if (status === 'live') {
      const minuteNum = parseInt(minute);
      if (!isNaN(minuteNum)) {
        if (minuteNum <= 45) return `${minuteNum}'`;
        if (minuteNum <= 90) return `${minuteNum}'`;
        return `90+${minuteNum - 90}'`;
      }
    }
    
    return minute || '';
  }

  // Get cached match data
  getCachedMatchData(matchId: string): Match | null {
    return this.matchDataCache.get(matchId) || null;
  }

  // Clear cache for a specific match
  clearMatchCache(matchId: string): void {
    this.matchDataCache.delete(matchId);
    this.lastSync.delete(matchId);
  }

  // Clear all cached data
  clearAllCache(): void {
    this.matchDataCache.clear();
    this.lastSync.clear();
  }

  // Force sync all matches in current view
  async syncAllMatches(matches: Match[]): Promise<Match[]> {
    try {
      console.log(`🔄 Syncing ${matches.length} matches for consistency`);
      
      const syncPromises = matches.map(async (match) => {
        const syncedMatch = await this.syncMatchData(match.id);
        return syncedMatch || match;
      });

      const syncedMatches = await Promise.all(syncPromises);
      console.log(`✅ Synced all ${syncedMatches.length} matches`);
      
      return syncedMatches;
    } catch (error) {
      console.error('❌ Failed to sync all matches:', error);
      return matches; // Return original if sync fails
    }
  }

  // Subscribe to data changes for a specific match
  subscribeToMatchUpdates(matchId: string, callback: (match: Match) => void): () => void {
    const interval = setInterval(async () => {
      const syncedMatch = await this.syncMatchData(matchId);
      if (syncedMatch) {
        callback(syncedMatch);
      }
    }, this.SYNC_INTERVAL);

    return () => {
      clearInterval(interval);
    };
  }
}

export const dataConsistencyService = new DataConsistencyService(); 