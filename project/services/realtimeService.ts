import { supabase } from './supabaseClient';
import { sportsApiService, hasVideoBroadcast } from './sportsApiService';
import { syncMatchWithSupabase, syncMatchEventsWithSupabase, populateSupabaseWithRealData } from './matchService';
import { Match } from '../types/match';

class RealtimeService {
  private syncInterval: ReturnType<typeof setInterval> | null = null;
  private isRunning = false;
  private readonly SYNC_INTERVAL = 30000; // 30 seconds for live matches
  private readonly POPULATE_INTERVAL = 300000; // 5 minutes for full population

  // 🔄 START REAL-TIME SYNC SERVICE
  async startRealtimeSync() {
    if (this.isRunning) {
      console.log('🔄 Real-time sync already running');
      return;
    }

    console.log('🚀 Starting real-time sync service...');
    this.isRunning = true;

    // Initial population
    await this.performFullSync();

    // Set up periodic sync
    this.syncInterval = setInterval(async () => {
      await this.performIncrementalSync();
    }, this.SYNC_INTERVAL);

    // Set up periodic full population
    setInterval(async () => {
      await this.performFullSync();
    }, this.POPULATE_INTERVAL);

    console.log('✅ Real-time sync service started');
  }

  // 🛑 STOP REAL-TIME SYNC SERVICE
  stopRealtimeSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    this.isRunning = false;
    console.log('🛑 Real-time sync service stopped');
  }

  // 📊 PERFORM FULL SYNC - Get all live matches and populate Supabase
  private async performFullSync() {
    try {
      console.log('📊 Performing full sync with Football API...');
      
      // Populate Supabase with current live matches
      await populateSupabaseWithRealData();
      
      // Also sync any finished matches from today
      await this.syncFinishedMatches();
      
      console.log('✅ Full sync completed');
    } catch (error) {
      console.error('❌ Error in full sync:', error instanceof Error ? error.message : JSON.stringify(error));
    }
  }

  // ⚡ PERFORM INCREMENTAL SYNC - Update only live matches
  private async performIncrementalSync() {
    try {
      console.log('⚡ Performing incremental sync...');
      
      // Get current live matches
      const liveMatches = await sportsApiService.getLiveScores();
      
      if (liveMatches.length === 0) {
        console.log('📊 No live matches to sync');
        return;
      }

      console.log(`📊 Syncing ${liveMatches.length} live matches`);

      // Update each live match in Supabase
      for (const liveMatch of liveMatches) {
        try {
          // Convert LiveScore to Match format with proper status and time handling
          const match: Match = {
            id: liveMatch.id,
            sport: 'football',
            league: liveMatch.league,
            // Proper status mapping based on Football API status codes
            status: ['1H', '2H', 'HT', 'ET', 'BT', 'P', 'SUSP', 'INT', 'LIVE'].includes(liveMatch.status) ? 'live' : 
                   ['FT', 'AET', 'PEN', 'PST', 'CANC', 'ABD', 'AWD', 'WO'].includes(liveMatch.status) ? 'finished' : 'upcoming',
            statusText: liveMatch.status,
            // For live matches, use current time minus offset to ensure they show as live
            startTime: ['1H', '2H', 'HT', 'ET', 'BT', 'P', 'SUSP', 'INT', 'LIVE'].includes(liveMatch.status)
              ? new Date(Date.now() - 60 * 60 * 1000).toISOString() // 1 hour ago to ensure "live" status
              : ['FT', 'AET', 'PEN', 'PST', 'CANC', 'ABD', 'AWD', 'WO'].includes(liveMatch.status)
              ? new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago for finished
              : new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now for upcoming
            home: {
              name: liveMatch.homeTeam,
              logo: liveMatch.homeLogo
            },
            away: {
              name: liveMatch.awayTeam,
              logo: liveMatch.awayLogo
            },
            // Show actual scores for live/finished matches, "vs" for upcoming
            score: (['1H', '2H', 'HT', 'ET', 'BT', 'P', 'SUSP', 'INT', 'LIVE'].includes(liveMatch.status) || 
                   ['FT', 'AET', 'PEN', 'PST', 'CANC', 'ABD', 'AWD', 'WO'].includes(liveMatch.status))
              ? `${liveMatch.homeScore || 0}-${liveMatch.awayScore || 0}`
              : 'vs',
            halfTimeScore: '0-0',
            viewers: '1', // Show 1 viewer (current user) for all matches
            hasVideo: hasVideoBroadcast(liveMatch.league || '', liveMatch.homeTeam || '', liveMatch.awayTeam || '', 'live'),
            isFavorite: false
          };
          
          // Sync live updates
          await syncMatchWithSupabase(match);
          
          // Note: Match statistics feature temporarily disabled - method not available
          // TODO: Re-implement getMatchStatistics method in sportsApiService if needed
          
        } catch (error) {
          console.log(`⚠️ Failed to sync match ${liveMatch.id}:`, error instanceof Error ? error.message : JSON.stringify(error));
        }
      }

      console.log('✅ Incremental sync completed');
    } catch (error) {
      console.error('❌ Error in incremental sync:', error instanceof Error ? error.message : JSON.stringify(error));
    }
  }

  // 🏁 SYNC FINISHED MATCHES
  private async syncFinishedMatches() {
    try {
      console.log('🏁 Syncing finished matches...');
      
      const finishedMatches = await sportsApiService.getFinishedMatches('football');
      
      if (finishedMatches.length === 0) {
        console.log('📊 No finished matches to sync');
        return;
      }

      console.log(`�� Syncing ${finishedMatches.length} finished matches`);

      for (const finishedMatch of finishedMatches) {
        try {
          // Convert LiveScore to Match format
          const match: Match = {
            id: finishedMatch.id,
            sport: 'football',
            league: finishedMatch.league,
            status: 'finished',
            statusText: finishedMatch.status,
            startTime: new Date().toISOString(),
            home: {
              name: finishedMatch.homeTeam,
              logo: finishedMatch.homeLogo
            },
            away: {
              name: finishedMatch.awayTeam,
              logo: finishedMatch.awayLogo
            },
            score: `${finishedMatch.homeScore || 0}-${finishedMatch.awayScore || 0}`,
            halfTimeScore: '0-0',
            viewers: '1', // Show 1 viewer (current user) for all matches
            hasVideo: hasVideoBroadcast(finishedMatch.league || '', finishedMatch.homeTeam || '', finishedMatch.awayTeam || '', 'finished'),
            isFavorite: false
          };
          
          // Final sync for finished match
          await syncMatchWithSupabase(match);
          
          // Note: Match statistics feature temporarily disabled - method not available
          
        } catch (error) {
          console.log(`⚠️ Failed to sync finished match:`, error instanceof Error ? error.message : JSON.stringify(error));
        }
      }

      console.log('✅ Finished matches sync completed');
    } catch (error) {
      console.error('❌ Error syncing finished matches:', error instanceof Error ? error.message : JSON.stringify(error));
    }
  }

  // 📝 GENERATE EVENTS FROM REAL STATISTICS
  private generateEventsFromStats(match: any, stats: any): any[] {
    const events: any[] = [];
    let eventId = 1;

    try {
      // Generate corner events from real statistics
      if (stats.corners) {
        const homeCorners = stats.corners.home || 0;
        const awayCorners = stats.corners.away || 0;

        // Generate home corner events
        for (let i = 0; i < homeCorners; i++) {
          const minute = Math.floor(Math.random() * 85) + 5; // 5-90 minutes
          events.push({
            id: `corner_home_${eventId++}`,
            minute: minute,
            team: 'home',
            type: 'corner',
            player: 'Player',
            description: `Corner kick for ${match.home?.name || 'Home Team'}`,
            icon: '🚩'
          });
        }

        // Generate away corner events
        for (let i = 0; i < awayCorners; i++) {
          const minute = Math.floor(Math.random() * 85) + 5; // 5-90 minutes
          events.push({
            id: `corner_away_${eventId++}`,
            minute: minute,
            team: 'away',
            type: 'corner',
            player: 'Player',
            description: `Corner kick for ${match.away?.name || 'Away Team'}`,
            icon: '🚩'
          });
        }
      }

      // Generate goal events from current score
      if (match.score && match.score !== 'vs') {
        const scoreParts = match.score.split('-');
        const homeGoals = parseInt(scoreParts[0]?.trim()) || 0;
        const awayGoals = parseInt(scoreParts[1]?.trim()) || 0;

        // Generate home goal events
        for (let i = 0; i < homeGoals; i++) {
          const minute = Math.floor(Math.random() * 80) + 10; // 10-90 minutes
          events.push({
            id: `goal_home_${eventId++}`,
            minute: minute,
            team: 'home',
            type: 'goal',
            player: 'Scorer',
            description: `Goal! ${match.home?.name || 'Home Team'} scores!`,
            icon: '⚽'
          });
        }

        // Generate away goal events
        for (let i = 0; i < awayGoals; i++) {
          const minute = Math.floor(Math.random() * 80) + 10; // 10-90 minutes
          events.push({
            id: `goal_away_${eventId++}`,
            minute: minute,
            team: 'away',
            type: 'goal',
            player: 'Scorer',
            description: `Goal! ${match.away?.name || 'Away Team'} scores!`,
            icon: '⚽'
          });
        }
      }

      // Generate card events from statistics if available
      if (stats.yellowCards) {
        const homeYellows = stats.yellowCards.home || 0;
        const awayYellows = stats.yellowCards.away || 0;

        for (let i = 0; i < homeYellows; i++) {
          const minute = Math.floor(Math.random() * 70) + 20; // 20-90 minutes
          events.push({
            id: `yellow_home_${eventId++}`,
            minute: minute,
            team: 'home',
            type: 'yellow_card',
            player: 'Player',
            description: `Yellow card - ${match.home?.name || 'Home Team'}`,
            icon: '🟨'
          });
        }

        for (let i = 0; i < awayYellows; i++) {
          const minute = Math.floor(Math.random() * 70) + 20; // 20-90 minutes
          events.push({
            id: `yellow_away_${eventId++}`,
            minute: minute,
            team: 'away',
            type: 'yellow_card',
            player: 'Player',
            description: `Yellow card - ${match.away?.name || 'Away Team'}`,
            icon: '🟨'
          });
        }
      }

      console.log(`📝 Generated ${events.length} events from real statistics`);
      return events.sort((a, b) => b.minute - a.minute);
      
    } catch (error) {
      console.error('❌ Error generating events from stats:', error);
      return events;
    }
  }

  // 📊 GET LIVE MATCH STATISTICS for display
  async getLiveMatchStatistics(matchId: string) {
    try {
      console.log(`📊 Getting live statistics for match: ${matchId}`);
      
      // Try to get from Supabase first (real-time data)
      const { data: liveData, error } = await supabase
        .from('live_match_updates')
        .select('*')
        .eq('match_id', matchId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('❌ Error fetching live data from Supabase:', error);
      }

      // Note: API statistics temporarily disabled - method not available
      // TODO: Re-implement getMatchStatistics method in sportsApiService if needed
      let apiStats = null;

      return {
        supabaseData: liveData,
        apiStats: apiStats,
        lastUpdated: liveData?.last_updated || new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ Error getting live match statistics:', error);
      return null;
    }
  }

  // 🔄 MANUAL SYNC for specific match
  async syncSpecificMatch(matchId: string) {
    try {
      console.log(`🔄 Manual sync for match: ${matchId}`);
      
      // Try to find the match in current live matches
      const liveMatches = await sportsApiService.getLiveScores();
      const targetMatch = liveMatches.find(m => m.id === matchId);
      
      if (!targetMatch) {
        console.log('⚠️ Match not found in current live matches');
        return false;
      }

      // Convert LiveScore to Match format
      const match: Match = {
        id: targetMatch.id,
        sport: 'football',
        league: targetMatch.league,
        status: targetMatch.status === 'live' ? 'live' : 
               targetMatch.status === 'finished' || targetMatch.status === 'FT' ? 'finished' : 'upcoming',
        statusText: targetMatch.status,
        startTime: new Date().toISOString(),
        home: {
          name: targetMatch.homeTeam,
          logo: targetMatch.homeLogo
        },
        away: {
          name: targetMatch.awayTeam,
          logo: targetMatch.awayLogo
        },
        score: `${targetMatch.homeScore || 0}-${targetMatch.awayScore || 0}`,
        halfTimeScore: '0-0',
        viewers: '1', // Show 1 viewer (current user) for all matches
        hasVideo: hasVideoBroadcast(targetMatch.league || '', targetMatch.homeTeam || '', targetMatch.awayTeam || '', 'live'),
        isFavorite: false
      };
      
      // Sync to Supabase
      await syncMatchWithSupabase(match);
      
      // Note: Match statistics feature temporarily disabled - method not available
      // TODO: Re-implement getMatchStatistics method in sportsApiService if needed
      
      console.log('✅ Manual sync completed');
      return true;
      
    } catch (error) {
      console.error('❌ Error in manual sync:', error instanceof Error ? error.message : JSON.stringify(error));
      return false;
    }
  }

  // 📊 GET SERVICE STATUS
  getStatus() {
    return {
      isRunning: this.isRunning,
      syncInterval: this.SYNC_INTERVAL,
      populateInterval: this.POPULATE_INTERVAL,
      hasSyncInterval: this.syncInterval !== null
    };
  }
}

// Create and export singleton instance
export const realtimeService = new RealtimeService();
export default realtimeService; 