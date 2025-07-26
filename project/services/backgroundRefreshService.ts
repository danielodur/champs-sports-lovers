import { fetchMatches, subscribeToMatchUpdates } from './matchService';
import { Match } from '@/types/match';

class BackgroundRefreshService {
  private refreshInterval: ReturnType<typeof setInterval> | null = null;
  private timerInterval: ReturnType<typeof setInterval> | null = null;
  private isRunning = false;
  private readonly REFRESH_INTERVAL = 30000; // 30 seconds for background refresh
  private readonly TIMER_UPDATE_INTERVAL = 1000; // 1 second for match timers
  private readonly LIVE_REFRESH_INTERVAL = 15000; // 15 seconds for live matches
  
  private subscribers = new Set<(matches: Match[]) => void>();
  private currentMatches: Map<string, Match[]> = new Map();

  // Start background refresh service - DISABLED to prevent 08:00 fallback
  startBackgroundRefresh(): void {
    console.log('🚫 Background refresh PERMANENTLY DISABLED to prevent 08:00 fallback issue');
    console.log('✅ Using manual refresh only for reliable data');
    return; // Completely disabled
  }

  // Stop background refresh service
  stopBackgroundRefresh(): void {
    if (!this.isRunning) return;

    console.log('🛑 Stopping background refresh service...');
    
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }

    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    this.isRunning = false;
    console.log('✅ Background refresh service stopped');
  }

  // Subscribe to background updates
  subscribe(callback: (matches: Match[]) => void): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  // Perform background refresh without user interaction
  private async performBackgroundRefresh(): Promise<void> {
    try {
      console.log('🔄 TEMPORARILY DISABLED: Background refresh to prevent 08:00 override issue');
      
      // ✅ TEMPORARILY DISABLED to prevent 08:00 data from overriding good data
      // Once we identify which API source returns 08:00 times, we'll re-enable this
      return;
      
      console.log('🔄 Performing background data refresh...');

      // Refresh critical data in parallel
      const refreshPromises = [
        this.refreshScreenData('all'),
        this.refreshScreenData('live'),
        this.refreshScreenData('follows'),
      ];

      await Promise.allSettled(refreshPromises);
      
      // Notify subscribers of updates
      this.notifySubscribers();
      
      console.log('✅ Background refresh completed');
    } catch (error) {
      console.warn('⚠️ Background refresh failed:', error);
    }
  }

  // Refresh data for specific screen
  private async refreshScreenData(filter: string): Promise<void> {
    try {
      console.log(`🔄 BACKGROUND REFRESH: Starting ${filter} refresh...`);
      const matches = await fetchMatches('football', filter);
      this.currentMatches.set(filter, matches);
      console.log(`📊 BACKGROUND REFRESH: Updated ${filter} matches: ${matches.length} items`);
      
      // ✅ DEBUG: Check if background refresh is returning 08:00 times
      if (filter === 'all' && matches.length > 0) {
        console.log('🔍 BACKGROUND REFRESH - First 3 match startTimes:');
        matches.slice(0, 3).forEach((match, i) => {
          console.log(`   BG ${i + 1}. ${match.home?.name || 'Unknown'} vs ${match.away?.name || 'Unknown'} - startTime: "${match.startTime}"`);
        });
      }
    } catch (error) {
      console.warn(`⚠️ Failed to refresh ${filter} matches:`, error);
    }
  }

  // Update match timers for live matches
  private updateMatchTimers(): void {
    try {
      const liveMatches = this.currentMatches.get('live') || [];
      const allMatches = this.currentMatches.get('all') || [];
      
      let timersUpdated = 0;
      
      // Update live match timers
      [...liveMatches, ...allMatches].forEach(match => {
        if (match.status === 'live' && match.startTime) {
          const now = new Date();
          const startTime = new Date(match.startTime);
          const minutesElapsed = Math.floor((now.getTime() - startTime.getTime()) / (1000 * 60));
          
          let newStatusText = '';
          
          if (minutesElapsed <= 45) {
            newStatusText = `${Math.max(0, minutesElapsed)}'`;
          } else if (minutesElapsed <= 60) {
            newStatusText = 'HT';
          } else if (minutesElapsed <= 105) {
            const secondHalfMinutes = Math.min(45, minutesElapsed - 60);
            newStatusText = `${45 + secondHalfMinutes}'`;
          } else {
            const extraTime = minutesElapsed - 105;
            newStatusText = `90+${extraTime}'`;
          }
          
          // Update if changed
          if (match.statusText !== newStatusText) {
            match.statusText = newStatusText;
            timersUpdated++;
          }
        }
      });

      if (timersUpdated > 0) {
        console.log(`⏱️ Updated ${timersUpdated} live match timers`);
        this.notifySubscribers();
      }
    } catch (error) {
      console.warn('⚠️ Failed to update match timers:', error);
    }
  }

  // Notify all subscribers of data updates
  private notifySubscribers(): void {
    const allMatches = Array.from(this.currentMatches.values()).flat();
    this.subscribers.forEach(callback => {
      try {
        callback(allMatches);
      } catch (error) {
        console.warn('⚠️ Subscriber callback failed:', error);
      }
    });
  }

  // Force refresh for specific filter
  async forceRefresh(filter: string): Promise<Match[]> {
    try {
      console.log(`🔄 Force refreshing ${filter} matches...`);
      const matches = await fetchMatches('football', filter, undefined);
      this.currentMatches.set(filter, matches);
      this.notifySubscribers();
      return matches;
    } catch (error) {
      console.warn(`⚠️ Force refresh failed for ${filter}:`, error);
      return this.currentMatches.get(filter) || [];
    }
  }

  // Get current cached matches for a filter
  getCachedMatches(filter: string): Match[] {
    return this.currentMatches.get(filter) || [];
  }

  // Check if service is running
  isServiceRunning(): boolean {
    return this.isRunning;
  }
}

export const backgroundRefreshService = new BackgroundRefreshService(); 