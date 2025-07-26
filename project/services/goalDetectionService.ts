import { Match } from '@/types/match';

interface MatchScore {
  matchId: string;
  homeScore: number;
  awayScore: number;
  lastUpdate: number;
  sport: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  minute: string;
}

class GoalDetectionService {
  private previousScores: Map<string, MatchScore> = new Map();
  private callbacks: Array<(data: any) => void> = [];
  private isMonitoring = false;

  subscribe(callback: (data: any) => void) {
    this.callbacks.push(callback);
    return () => {
      this.callbacks = this.callbacks.filter(cb => cb !== callback);
    };
  }

  private notifyGoal(goalData: any) {
    console.log('🚨 REAL GOAL DETECTED FROM API DATA:', goalData);
    console.log('📢 Notifying', this.callbacks.length, 'subscribers...');
    this.callbacks.forEach((callback, index) => {
      try {
        console.log(`📢 Calling callback ${index + 1}...`);
        callback(goalData);
        console.log(`✅ Callback ${index + 1} completed successfully`);
      } catch (error) {
        console.log(`❌ Error in goal notification callback ${index + 1}:`, error);
      }
    });
    console.log('🏁 All goal notification callbacks completed');
  }

  private parseScore(scoreString: string): { home: number; away: number } {
    if (!scoreString || scoreString === '-' || scoreString === 'vs') {
      return { home: 0, away: 0 };
    }

    const match = scoreString.match(/(\d+)-(\d+)/);
    if (match) {
      return {
        home: parseInt(match[1], 10),
        away: parseInt(match[2], 10),
      };
    }

    return { home: 0, away: 0 };
  }

  private getTeamScorer(teamName: string, scoringTeam: 'home' | 'away'): string {
    // Use real team-based scoring information instead of random names
    const teamShort = teamName.split(' ').pop() || teamName; // Get last word (usually team name)
    return `${teamShort} Player`; // Simple team-based naming
  }

  private getCurrentMinute(match: Match): string {
    if (match.status !== 'live') {
      return "90'";
    }

    // ✅ ENHANCED: Calculate realistic live minute with proper added time progression
    const startTime = new Date(match.startTime).getTime();
    const now = Date.now();
    const elapsedMinutes = Math.floor((now - startTime) / (1000 * 60));
    
    // Realistic football minutes (accounting for delays, warm-up, etc.)
    const adjustedMinutes = Math.max(1, elapsedMinutes - 15); // Account for pre-match time
    const minute = Math.min(adjustedMinutes, 120); // Max 120 minutes (including extra time)
    
    // ✅ ENHANCED 90+ ADDED TIME: Progressive display like Chinese app
    if (minute >= 90) {
      const addedTime = Math.max(1, Math.min(10, minute - 90)); // 1-10 minutes added time
      return `90+${addedTime}'`;
    } 
    
    // ✅ ENHANCED 45+ ADDED TIME: Progressive display for first half injury time
    if (minute >= 45 && minute < 50) {
      const addedTime = Math.max(1, Math.min(8, minute - 45)); // 1-8 minutes added time
      return `45+${addedTime}'`;
    }
    
    // Regular match time
    return `${minute}'`;
  }

  updateMatches(matches: Match[]) {
    if (!this.isMonitoring) {
      console.log('⚠️ Goal detection service not monitoring, skipping match updates');
      return;
    }

    // Only process live matches for goal detection
    const liveMatches = matches.filter(match => match.status === 'live');
    console.log(`🔍 REAL DATA Goal Detection: Processing ${liveMatches.length} live matches from ${matches.length} total matches`);
    
    if (liveMatches.length === 0) {
      console.log('ℹ️ No live matches available for goal detection. All matches status:', matches.map(m => `${m.home.name} vs ${m.away.name}: ${m.status}`));
    }
    
    liveMatches.forEach(match => {
      const currentScore = this.parseScore(match.score);
      const previousScore = this.previousScores.get(match.id);
      
      console.log(`🔍 Checking match: ${match.home.name} vs ${match.away.name} | Score: ${match.score} | Status: ${match.status}`);
      
      const currentData: MatchScore = {
        matchId: match.id,
        homeScore: currentScore.home,
        awayScore: currentScore.away,
        lastUpdate: Date.now(),
        sport: match.sport,
        homeTeam: match.home.name,
        awayTeam: match.away.name,
        league: match.league,
        minute: this.getCurrentMinute(match),
      };

      if (previousScore) {
        console.log(`📊 Previous: ${previousScore.homeScore}-${previousScore.awayScore} | Current: ${currentScore.home}-${currentScore.away}`);
        
        // ⚽ REAL GOAL DETECTION: Check for home team goal from API data
        if (currentScore.home > previousScore.homeScore) {
          console.log(`🚨 REAL HOME GOAL: ${match.home.name} scored! ${previousScore.homeScore} → ${currentScore.home}`);
          this.notifyGoal({
            id: `goal-${match.id}-${Date.now()}-home`, // Unique ID for notification
            matchId: match.id,
            homeTeam: match.home.name,
            awayTeam: match.away.name,
            scorer: this.getTeamScorer(match.home.name, 'home'),
            minute: currentData.minute,
            score: match.score,
            league: match.league,
            sport: match.sport,
            scoringTeam: 'home',
            eventType: 'goal', // Regular goal
            isRealData: true, // Flag to indicate this is from real API data
            timestamp: Date.now(), // When the goal was detected
          });
        }
        
        // ⚽ REAL GOAL DETECTION: Check for away team goal from API data
        if (currentScore.away > previousScore.awayScore) {
          console.log(`🚨 REAL AWAY GOAL: ${match.away.name} scored! ${previousScore.awayScore} → ${currentScore.away}`);
          this.notifyGoal({
            id: `goal-${match.id}-${Date.now()}-away`, // Unique ID for notification
            matchId: match.id,
            homeTeam: match.home.name,
            awayTeam: match.away.name,
            scorer: this.getTeamScorer(match.away.name, 'away'),
            minute: currentData.minute,
            score: match.score,
            league: match.league,
            sport: match.sport,
            scoringTeam: 'away',
            eventType: 'goal', // Regular goal
            isRealData: true, // Flag to indicate this is from real API data
            timestamp: Date.now(), // When the goal was detected
          });
        }
        
        // 🚫 CANCELLED GOAL DETECTION: Check for home team goal cancellation (VAR/offside)
        if (currentScore.home < previousScore.homeScore) {
          console.log(`🚫 CANCELLED HOME GOAL: ${match.home.name} goal cancelled! ${previousScore.homeScore} → ${currentScore.home}`);
          this.notifyGoal({
            id: `cancelled-${match.id}-${Date.now()}-home`, // Unique ID for notification
            matchId: match.id,
            homeTeam: match.home.name,
            awayTeam: match.away.name,
            scorer: this.getTeamScorer(match.home.name, 'home'),
            minute: currentData.minute,
            score: match.score, // Current corrected score
            league: match.league,
            sport: match.sport,
            scoringTeam: 'home', // Team that lost the goal
            eventType: 'cancelled', // Cancelled goal
            isRealData: true,
            timestamp: Date.now(),
          });
        }
        
        // 🚫 CANCELLED GOAL DETECTION: Check for away team goal cancellation (VAR/offside)
        if (currentScore.away < previousScore.awayScore) {
          console.log(`🚫 CANCELLED AWAY GOAL: ${match.away.name} goal cancelled! ${previousScore.awayScore} → ${currentScore.away}`);
          this.notifyGoal({
            id: `cancelled-${match.id}-${Date.now()}-away`, // Unique ID for notification
            matchId: match.id,
            homeTeam: match.home.name,
            awayTeam: match.away.name,
            scorer: this.getTeamScorer(match.away.name, 'away'),
            minute: currentData.minute,
            score: match.score, // Current corrected score
            league: match.league,
            sport: match.sport,
            scoringTeam: 'away', // Team that lost the goal
            eventType: 'cancelled', // Cancelled goal
            isRealData: true,
            timestamp: Date.now(),
          });
        }
        
        // Log if no score change
        if (currentScore.home === previousScore.homeScore && currentScore.away === previousScore.awayScore) {
          console.log(`✓ No score change for ${match.home.name} vs ${match.away.name}`);
        }
      } else {
        console.log(`🆕 New live match added to goal detection: ${match.home.name} vs ${match.away.name} (${match.score})`);
      }

      this.previousScores.set(match.id, currentData);
    });

    // Clean up old scores for matches that are no longer live
    const liveMatchIds = new Set(liveMatches.map(m => m.id));
    for (const [matchId] of this.previousScores) {
      if (!liveMatchIds.has(matchId)) {
        console.log(`🧹 Removing finished match from goal detection: ${matchId}`);
        this.previousScores.delete(matchId);
      }
    }
    
    console.log(`📊 Goal detection summary: ${this.previousScores.size} matches being monitored`);
  }

  startMonitoring() {
    this.isMonitoring = true;
    console.log('🚨 REAL DATA Goal detection service started - monitoring live API data for score changes');
  }

  stopMonitoring() {
    this.isMonitoring = false;
    this.previousScores.clear();
    console.log('🛑 Goal detection service stopped');
  }

  // DISABLED: No more mock goal simulation - only real API data
  simulateGoal(match: Match, scoringTeam: 'home' | 'away' = 'home') {
    console.log('❌ SIMULATE GOAL DISABLED - App only uses real data');
    console.log('ℹ️ Goal alerts only trigger from real API score changes');
    console.log('📋 To test goal detection:');
    console.log('   1. Wait for real live matches to have score changes');
    console.log('   2. Use the Test Goal Alert button with real match data');
    console.log('   3. Check the Live tab for active matches being monitored');
    
    return false; // Disabled - no mock goals
  }

  // Get current monitoring status
  isMonitoringActive(): boolean {
    return this.isMonitoring;
  }

  // Get number of live matches being monitored
  getLiveMatchesCount(): number {
    return this.previousScores.size;
  }

  // Manually trigger a score change for testing (simulates API returning updated score)
  simulateScoreChange(matchId: string, newHomeScore: number, newAwayScore: number) {
    console.log(`🧪 SIMULATING SCORE CHANGE for match ${matchId}: Setting score to ${newHomeScore}-${newAwayScore}`);
    
    const existingMatch = this.previousScores.get(matchId);
    if (!existingMatch) {
      console.log('❌ Match not found in monitoring list. Available matches:', Array.from(this.previousScores.keys()));
      return false;
    }
    
    console.log(`📊 Previous score: ${existingMatch.homeScore}-${existingMatch.awayScore}`);
    console.log(`📊 New score: ${newHomeScore}-${newAwayScore}`);
    
    // Check for goals
    if (newHomeScore > existingMatch.homeScore) {
      console.log(`🚨 HOME GOAL DETECTED! ${existingMatch.homeTeam} scored!`);
      this.notifyGoal({
        matchId: matchId,
        homeTeam: existingMatch.homeTeam,
        awayTeam: existingMatch.awayTeam,
        scorer: this.getTeamScorer(existingMatch.homeTeam, 'home'),
        minute: existingMatch.minute,
        score: `${newHomeScore}-${newAwayScore}`,
        league: existingMatch.league,
        sport: existingMatch.sport,
        scoringTeam: 'home',
        eventType: 'goal', // Regular goal
        isRealData: false, // This is simulated
      });
    }
    
    if (newAwayScore > existingMatch.awayScore) {
      console.log(`🚨 AWAY GOAL DETECTED! ${existingMatch.awayTeam} scored!`);
      this.notifyGoal({
        matchId: matchId,
        homeTeam: existingMatch.homeTeam,
        awayTeam: existingMatch.awayTeam,
        scorer: this.getTeamScorer(existingMatch.awayTeam, 'away'),
        minute: existingMatch.minute,
        score: `${newHomeScore}-${newAwayScore}`,
        league: existingMatch.league,
        sport: existingMatch.sport,
        scoringTeam: 'away',
        eventType: 'goal', // Regular goal
        isRealData: false, // This is simulated
      });
    }
    
    // Check for cancelled goals (score decreases)
    if (newHomeScore < existingMatch.homeScore) {
      console.log(`🚫 HOME GOAL CANCELLED! ${existingMatch.homeTeam} goal cancelled!`);
      this.notifyGoal({
        matchId: matchId,
        homeTeam: existingMatch.homeTeam,
        awayTeam: existingMatch.awayTeam,
        scorer: this.getTeamScorer(existingMatch.homeTeam, 'home'),
        minute: existingMatch.minute,
        score: `${newHomeScore}-${newAwayScore}`,
        league: existingMatch.league,
        sport: existingMatch.sport,
        scoringTeam: 'home', // Team that lost the goal
        eventType: 'cancelled', // Cancelled goal
        isRealData: false, // This is simulated
      });
    }
    
    if (newAwayScore < existingMatch.awayScore) {
      console.log(`🚫 AWAY GOAL CANCELLED! ${existingMatch.awayTeam} goal cancelled!`);
      this.notifyGoal({
        matchId: matchId,
        homeTeam: existingMatch.homeTeam,
        awayTeam: existingMatch.awayTeam,
        scorer: this.getTeamScorer(existingMatch.awayTeam, 'away'),
        minute: existingMatch.minute,
        score: `${newHomeScore}-${newAwayScore}`,
        league: existingMatch.league,
        sport: existingMatch.sport,
        scoringTeam: 'away', // Team that lost the goal
        eventType: 'cancelled', // Cancelled goal
        isRealData: false, // This is simulated
      });
    }
    
    // Update the stored score
    this.previousScores.set(matchId, {
      ...existingMatch,
      homeScore: newHomeScore,
      awayScore: newAwayScore,
      lastUpdate: Date.now()
    });
    
    return true;
  }

  // Get list of matches currently being monitored
  getMonitoredMatches(): MatchScore[] {
    return Array.from(this.previousScores.values());
  }

  // ✅ PUBLIC TEST METHOD: Manually trigger goal alerts for testing
  triggerTestGoalAlert(goalData: any) {
    console.log('🧪 TRIGGERING TEST GOAL ALERT:', goalData);
    this.notifyGoal(goalData);
  }

  // ✅ ENHANCED: Quick test methods for different alert types
  triggerTestHomeGoal() {
    const testData = {
      id: `test-home-goal-${Date.now()}`,
      matchId: 'test-match-001',
      homeTeam: 'Manchester United',
      awayTeam: 'Liverpool',
      scorer: 'Marcus Rashford',
      minute: "73'",
      score: '2-1',
      league: 'Premier League',
      sport: 'football',
      scoringTeam: 'home',
      eventType: 'goal',
      isRealData: false,
      timestamp: Date.now(),
    };
    console.log('🚨 TEST: Triggering Home Goal Alert');
    this.notifyGoal(testData);
  }

  triggerTestAwayGoal() {
    const testData = {
      id: `test-away-goal-${Date.now()}`,
      matchId: 'test-match-001',
      homeTeam: 'Manchester United',
      awayTeam: 'Liverpool',
      scorer: 'Mohamed Salah',
      minute: "67'",
      score: '1-2',
      league: 'Premier League',
      sport: 'football',
      scoringTeam: 'away',
      eventType: 'goal',
      isRealData: false,
      timestamp: Date.now(),
    };
    console.log('🚨 TEST: Triggering Away Goal Alert');
    this.notifyGoal(testData);
  }

  triggerTestCancelledGoal(team: 'home' | 'away' = 'home') {
    const testData = {
      id: `test-cancelled-${team}-${Date.now()}`,
      matchId: 'test-match-001',
      homeTeam: 'Manchester United',
      awayTeam: 'Liverpool',
      scorer: team === 'home' ? 'Marcus Rashford' : 'Mohamed Salah',
      minute: "81'",
      score: '1-1',
      league: 'Premier League',
      sport: 'football',
      scoringTeam: team,
      eventType: 'cancelled',
      isRealData: false,
      timestamp: Date.now(),
    };
    console.log(`🚫 TEST: Triggering ${team} Cancelled Goal Alert`);
    this.notifyGoal(testData);
  }

  triggerTestRedCard(team: 'home' | 'away' = 'home') {
    const testData = {
      id: `test-redcard-${team}-${Date.now()}`,
      matchId: 'test-match-001',
      homeTeam: 'Manchester United',
      awayTeam: 'Liverpool',
      scorer: team === 'home' ? 'Harry Maguire' : 'Virgil van Dijk',
      minute: "59'",
      score: '1-1',
      league: 'Premier League',
      sport: 'football',
      scoringTeam: team,
      eventType: 'red_card',
      isRealData: false,
      timestamp: Date.now(),
    };
    console.log(`🟥 TEST: Triggering ${team} Red Card Alert`);
    this.notifyGoal(testData);
  }
}

export const goalDetectionService = new GoalDetectionService();
export default goalDetectionService; 