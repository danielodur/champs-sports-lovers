import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MatchItem from './MatchItem';
import AnimatedFlatList from './AnimatedFlatList';
import { useTheme } from '@/hooks/useTheme';
import { useFavorites } from '@/hooks/useFavorites';
import { Match } from '@/types/match';
import { fetchMatches, subscribeToMatchUpdates } from '@/services/matchService';
import { usePathname, useRouter } from 'expo-router';
import goalDetectionService from '@/services/goalDetectionService';
import teamLogoService from '@/services/teamLogoService';
import { leagueNormalizationService } from '@/services/leagueNormalizationService'; // ✅ CRITICAL: Add league normalization
import { favoritesService } from '@/services/favoritesService';

interface MatchListProps {
  sport: string;
  filter: string;
  sortMode?: string;
  displayMode?: string;
  selectedDate?: string;
  onFavoritesChange?: () => void;
  onMatchCountChange?: (count: number) => void;
  hideSortIndicator?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  headerComponent?: () => React.ReactElement;
  onMatchesLoaded?: (matches: Match[]) => void;
}

// League priority mapping for sorting - Higher ranking leagues come first
const leaguePriority: { [key: string]: number } = {
  // Tier 1: Top European Football Leagues
  'Premier League': 1,
  'UEFA Champions League': 2,
  'La Liga': 3,
  'Bundesliga': 4,
  'Serie A': 5,
  'Ligue 1': 6,
  
  // Tier 2: European Competitions
  'Europa League': 7,
  'UEFA Europa League': 7,
  'Europa Conference League': 8,
  'UEFA Europa Conference League': 8,
  
  // Tier 3: Other Major Leagues
  'Eredivisie': 9,
  'Primeira Liga': 10,
  'Belgium Pro League': 11,
  'Scottish Premiership': 12,
  
  // Basketball
  'NBA': 1,
  'EuroLeague': 2,
  'FIBA': 3,
  
  // Rugby
  'Six Nations': 1,
  'Rugby World Cup': 1,
  'Premiership Rugby': 2,
  
  // Boxing
  'WBC': 1,
  'WBA': 1,
  'IBF': 1,
  'WBO': 1,
  
  // Default priority for unknown leagues
  'Default': 999,
};

// Helper function to get league priority
const getLeaguePriority = (leagueName: string): number => {
  // Check for exact match first
  if (leaguePriority[leagueName]) {
    return leaguePriority[leagueName];
  }
  
  // Check for partial matches (e.g., "England Premier League" should match "Premier League")
  for (const [key, priority] of Object.entries(leaguePriority)) {
    if (leagueName.includes(key) || key.includes(leagueName)) {
      return priority;
    }
  }
  
  // Return default priority for unknown leagues
  return leaguePriority['Default'];
};

// Helper: Group matches by date (returns {date: Match[]})
const groupByDate = (matches: Match[]) => {
  const groups: { [date: string]: Match[] } = {};
  
  matches.forEach(match => {
    try {
      // ✅ STRICT: Only process matches with valid startTime - NO FALLBACKS
      if (!match.startTime) {
        console.warn(`⚠️ SKIPPING match missing startTime: ${match.home.name} vs ${match.away.name}`);
        return; // Skip invalid matches instead of fallback
      }
      
      // Parse and validate the start time
      const parsedDate = new Date(match.startTime);
      
      if (isNaN(parsedDate.getTime())) {
        console.warn(`⚠️ SKIPPING invalid startTime: ${match.startTime} for ${match.home.name} vs ${match.away.name}`);
        return; // Skip invalid matches instead of fallback
      }
      
      // Extract date in YYYY-MM-DD format
      const dateKey = parsedDate.toISOString().split('T')[0];
      
      // ✅ VALIDATION: Ensure the extracted date is reasonable
      const today = new Date();
      const oneYearAgo = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);
      const oneYearFromNow = new Date(today.getTime() + 365 * 24 * 60 * 60 * 1000);
      
      if (parsedDate < oneYearAgo || parsedDate > oneYearFromNow) {
        console.warn(`⚠️ Suspicious date: ${dateKey} for ${match.home.name} vs ${match.away.name}, check if correct`);
        // Still include it but log the warning
      }
      
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(match);
      
      console.log(`📅 Grouped match: ${match.home.name} vs ${match.away.name} → ${dateKey}`);
      
    } catch (error) {
      console.error(`❌ SKIPPING match with error: ${error}`, match);
      // Skip matches with errors instead of fallback to avoid 08:00 times
    }
  });
  
  // ✅ LOG GROUPING RESULTS
  const groupCount = Object.keys(groups).length;
  const totalMatches = Object.values(groups).reduce((sum, arr) => sum + arr.length, 0);
  console.log(`📊 Date grouping complete: ${totalMatches} matches in ${groupCount} date groups`);
  
  // Log each group for debugging
  Object.entries(groups).forEach(([date, matchList]) => {
    console.log(`📅 ${date}: ${matchList.length} matches`);
  });
  
  return groups;
};

// ✅ ENHANCED: Get comprehensive label for finished match group (backward chronological like Chinese app)
const getFinishedGroupLabel = (date: string) => {
  const today = new Date();
  const matchDate = new Date(date + 'T12:00:00'); // Timezone-safe parsing
  const todayStr = today.toISOString().split('T')[0];
  const matchDateStr = matchDate.toISOString().split('T')[0];
  
  // Calculate difference in days
  const diffTime = today.getTime() - matchDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (matchDateStr === todayStr) {
    return `🏁 Today (${matchDate.toLocaleDateString()})`;
  }
  
  if (diffDays === 1) {
    return `🏁 Yesterday (${matchDate.toLocaleDateString()})`;
  }
  
  if (diffDays <= 7) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = days[matchDate.getDay()];
    return `🏁 ${dayName} (${matchDate.toLocaleDateString()})`;
  }
  
  // For dates more than a week ago, show full date with month name
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthName = monthNames[matchDate.getMonth()];
  const day = matchDate.getDate();
  const year = matchDate.getFullYear();
  const currentYear = today.getFullYear();
  
  if (year === currentYear) {
    return `🏁 ${monthName} ${day}`;
  } else {
    return `🏁 ${monthName} ${day}, ${year}`;
  }
};

// Helper: Is match within next hour
const isWithinNextHour = (startTime: string) => {
  const now = new Date();
  const matchTime = new Date(startTime);
  return matchTime > now && matchTime <= new Date(now.getTime() + 60 * 60 * 1000);
};

export default function MatchList({
  sport,
  filter,
  sortMode = 'time',
  displayMode = 'score',
  selectedDate,
  onFavoritesChange,
  onMatchCountChange,
  hideSortIndicator = false,
  refreshing = false,
  onRefresh,
  headerComponent,
  onMatchesLoaded,
}: MatchListProps) {
  const theme = useTheme();
  const [matches, setMatches] = useState<Match[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [internalRefreshing, setInternalRefreshing] = useState(false);
  const [isPullRefreshing, setIsPullRefreshing] = useState(false);
  const { refreshFavoritesCount, addFavorite, removeFavorite } = useFavorites();
  const pathname = usePathname();
  const router = useRouter();
  const flatListRef = useRef<any>(null);

  // Simplified and optimized sorting function
  const sortMatches = useCallback((matches: Match[]): Match[] => {
    if (matches.length === 0) return matches;
    
    const sortedMatches = [...matches];
    
    console.log(`🔄 Sorting ${matches.length} matches by ${sortMode} for filter: ${filter}`);
    
    return sortedMatches.sort((a, b) => {
      // ✅ FIXED: Use consistent startTime field for all comparisons
      const timeA = new Date(a.startTime).getTime();
      const timeB = new Date(b.startTime).getTime();
      
      // Check for invalid dates
      if (isNaN(timeA) || isNaN(timeB)) {
        console.warn('⚠️ Invalid date found:', { a: a.startTime, b: b.startTime });
        return isNaN(timeA) ? 1 : -1;
      }
      
      // Enhanced live match detection
      const aIsLive = a.status === 'live';
      const bIsLive = b.status === 'live';
      
      if (sortMode === 'league') {
        // Sort by League: Higher priority leagues first, then by status, then by time
        const leaguePriorityA = getLeaguePriority(a.league);
        const leaguePriorityB = getLeaguePriority(b.league);
        
        if (leaguePriorityA !== leaguePriorityB) {
          return leaguePriorityA - leaguePriorityB;
        }
        
        // Within same league priority, live matches first
        if (aIsLive && !bIsLive) return -1;
        if (bIsLive && !aIsLive) return 1;
        
        // Then sort by time
        return timeA - timeB;
      }
      
      // ✅ ENHANCED TIME SORTING: Proper chronological organization
      // 1. Live matches always first (most important)
      if (aIsLive && !bIsLive) return -1;
      if (bIsLive && !aIsLive) return 1;
      
      // 2. For LIVE matches, sort by match minute (latest action first)
      if (aIsLive && bIsLive) {
        const getMinute = (statusText: string): number => {
          const match = statusText?.match(/(\d+)/);
          return match ? parseInt(match[1]) : 0;
        };
        
        const minuteA = getMinute(a.statusText || '');
        const minuteB = getMinute(b.statusText || '');
        
        // Higher minute = later in match = more priority
        if (minuteA !== minuteB) {
          return minuteB - minuteA;
        }
        
        // If same minute, sort by start time
        return timeA - timeB;
      }
      
      // 3. For finished matches, sort by recency (most recently finished first)
      if (a.status === 'finished' && b.status === 'finished') {
        return timeB - timeA; // More recent matches first
      }
      
      // 4. For upcoming matches, sort by start time (earliest first)
      if (a.status === 'upcoming' && b.status === 'upcoming') {
        return timeA - timeB; // Earlier matches first
      }
      
      // 5. Mixed status sorting: upcoming -> live -> finished
      const statusPriority = { 'upcoming': 1, 'live': 2, 'finished': 3 };
      const priorityA = statusPriority[a.status] || 4;
      const priorityB = statusPriority[b.status] || 4;
      
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      
      // 6. Final fallback: sort by start time
      return timeA - timeB;
    });
  }, [sortMode]);

  // ✅ INSTANT LOADING: Enhanced loadMatches with immediate cache check
  const loadMatches = useCallback(async () => {
    try {
      setError(null);
      
      console.log(`⚡ MATCHLIST: INSTANT loading ${filter} matches for ${sport} ${selectedDate ? `on ${selectedDate}` : ''}`);
      
      // ✅ PERFORMANCE: Start loading data immediately, don't wait
      const startTime = Date.now();
      
      const data = await fetchMatches(sport, filter, selectedDate);
      
      const loadTime = Date.now() - startTime;
      console.log(`⚡ MATCHLIST: Data loaded in ${loadTime}ms`);
      
      // ✅ INSTANT UI UPDATE: Apply data immediately
      const enhancedData = data.map(match => ({
        ...teamLogoService.enhanceMatchWithLogos(match),
        isFavorite: match.isFavorite || false
      }));
      
      const sortedData = sortMatches(enhancedData);
      
      console.log(`📊 MATCHLIST: INSTANT UPDATE - ${sortedData.length} matches loaded`);
      
      // ✅ IMMEDIATE STATE UPDATE: No delays
      setMatches(sortedData);
      
      if (onMatchCountChange) {
        onMatchCountChange(sortedData.length);
      }
      
      goalDetectionService.updateMatches(sortedData);
      
      console.log(`✅ MATCHLIST: INSTANT SUCCESS - ${sortedData.length} matches displayed in ${Date.now() - startTime}ms`);
      
    } catch (err) {
      console.error('❌ MATCHLIST: Error loading matches:', err);
      setError('Unable to load data. Please check your connection.');
    }
  }, [sport, filter, selectedDate, sortMatches, onMatchCountChange]);

  // Handle refresh from parent or internal
  const handleRefresh = useCallback(async () => {
    setInternalRefreshing(true);
    try {
      console.log('🔄 MATCHLIST: Handle refresh called');
      // ALWAYS reload local matches to ensure state is maintained
      await loadMatches();
      
      // Also call parent refresh if provided (for additional side effects)
      if (onRefresh) {
        console.log('🔄 MATCHLIST: Also calling parent refresh');
        onRefresh();
      }
    } catch (error) {
      console.error('❌ MATCHLIST: Error in handleRefresh:', error);
    } finally {
      setInternalRefreshing(false);
    }
  }, [loadMatches, onRefresh]);

  useEffect(() => {
    console.log(`📱 MATCHLIST: Loading matches for ${sport}/${filter}${selectedDate ? `/${selectedDate}` : ''}`);
    loadMatches();

    // Subscribe to match updates for real-time favorites updates
    const unsubscribe = subscribeToMatchUpdates((updatedMatches) => {
      console.log(`🔄 MATCHLIST: Received match updates: ${updatedMatches.length} matches`);
      // Only update if we have matches and they're for the current filter/sport
      if (updatedMatches.length > 0) {
        console.log('🔄 MATCHLIST: Updating matches from service subscription');
        setMatches(updatedMatches);
        if (onMatchCountChange) {
          onMatchCountChange(updatedMatches.length);
        }
      } else {
        console.warn('⚠️ MATCHLIST: Received empty match updates - keeping current state');
      }
    });

    return () => {
      console.log(`🧹 MATCHLIST: Cleaning up subscription for ${sport}/${filter}`);
      unsubscribe();
    };
  }, [sport, filter, selectedDate]);

  // Re-sort when sortMode changes
  useEffect(() => {
    if (matches.length > 0) {
      setMatches(prev => sortMatches(prev));
    }
  }, [sortMode, sortMatches]);

  // ✅ FIXED: Notify parent component of matches for betting stats 
  useEffect(() => {
    if (onMatchesLoaded && matches.length > 0) {
      onMatchesLoaded(matches);
    }
  }, [matches, onMatchesLoaded]);

  const toggleFavorite = useCallback(async (matchId: string) => {
    try {
      console.log(`🌟 TOGGLEFAVORITE: Called with matchId: ${matchId}`);
      console.log(`📊 TOGGLEFAVORITE: Current matches state has ${matches.length} matches`);
      console.log(`🔍 TOGGLEFAVORITE: Available match IDs: [${matches.slice(0, 10).map(m => m.id).join(', ')}]${matches.length > 10 ? '...' : ''}`);
      
      // ✅ ENHANCED VALIDATION: Check for valid match ID and match object
      if (!matchId || typeof matchId !== 'string' || matchId.trim() === '') {
        console.error('❌ TOGGLEFAVORITE: INVALID MATCH ID:', matchId);
        return;
      }

      let match = matches.find(m => m.id === matchId);
      
      if (!match) {
        console.error('❌ TOGGLEFAVORITE: MATCH NOT FOUND in current list for ID:', matchId);
        console.error(`❌ TOGGLEFAVORITE: Current matches count: ${matches.length}`);
        console.error(`❌ TOGGLEFAVORITE: Searching for ID '${matchId}' in available IDs`);
        
        // Log all current match IDs for debugging
        const allIds = matches.map(m => m.id);
        console.error(`❌ TOGGLEFAVORITE: All available match IDs: [${allIds.join(', ')}]`);
        
        // Check if the ID exists as a string vs number issue
        const matchWithTypeConversion = matches.find(m => 
          m.id.toString() === matchId || 
          m.id === matchId.toString() ||
          String(m.id) === String(matchId)
        );
        
        if (matchWithTypeConversion) {
          console.log('✅ TOGGLEFAVORITE: Found match with ID type conversion!');
          match = matchWithTypeConversion;
        } else {
          console.error('❌ TOGGLEFAVORITE: No match found even with type conversion');
          console.error('❌ TOGGLEFAVORITE: This indicates the matches array is empty or the match ID is completely wrong');
          return;
        }
      }

      // ✅ SAFETY CHECK: Ensure match has required properties
      if (!match.home?.name || !match.away?.name) {
        console.error('❌ INVALID MATCH DATA:', match);
        return;
      }

      // ✅ MINIMAL DEBOUNCING: Only prevent double-taps within 100ms (instead of 500ms)
      const now = Date.now();
      const lastToggleTime = (match as any).lastToggleTime || 0;
      if (now - lastToggleTime < 100) {
        console.log('⚠️ DEBOUNCED: Double-tap prevented (100ms)');
        return;
      }

      console.log('🌟 STAR TOGGLE INITIATED');
      console.log(`   Match: ${match.home.name} vs ${match.away.name}`);
      console.log(`   Current isFavorite: ${match.isFavorite}`);
      console.log(`   Will become: ${!match.isFavorite ? 'FAVORITED (RED)' : 'UNFAVORITED (GRAY)'}`);

      // Store the original state for potential rollback
      const originalFavoriteStatus = match.isFavorite;
      const targetFavoriteStatus = !originalFavoriteStatus;

      // Update last toggle time to prevent rapid taps
      setMatches(prev => 
        prev.map(m => 
          m.id === matchId 
            ? { ...m, lastToggleTime: now } 
            : m
        )
      );

      // ✅ IMMEDIATE UI UPDATE for instant visual feedback
      setMatches(prev => 
        prev.map(m => 
          m.id === matchId 
            ? { ...m, isFavorite: targetFavoriteStatus } 
            : m
        )
      );

      console.log(`🔄 UI UPDATED: Star should now be ${targetFavoriteStatus ? 'RED' : 'GRAY'}`);

      // ✅ CRITICAL FIX: Perform the actual backend operation based on ORIGINAL state
      let success = false;
      let operation = '';

      if (originalFavoriteStatus) {
        // Was favorited, so remove it
        operation = 'REMOVE';
        console.log('🗑️ REMOVING from favorites...');
        success = await removeFavorite(matchId);
      } else {
        // Was not favorited, so add it
        operation = 'ADD';
        console.log('➕ ADDING to favorites...');
        success = await addFavorite(match);
      }

      if (success) {
        console.log(`✅ ${operation} operation successful!`);
        
        // ✅ CRITICAL: Special handling for follows screen
        if (filter === 'follows' && originalFavoriteStatus) {
          console.log('🗑️ UNFAVORITED ON FOLLOWS SCREEN: Removing match from list and updating count');
          const newMatches = matches.filter(m => m.id !== matchId);
          setMatches(newMatches);
          // Update the match count to reflect the new list size
          onMatchCountChange?.(newMatches.length);
        }
        
        // ✅ ENHANCED: If this was an ADD operation, refresh follows screen
        if (!originalFavoriteStatus && filter !== 'follows') {
          console.log('➕ MATCH FAVORITED: Will appear in Follows screen on next refresh');
        }

        // ✅ ENHANCED: Force refresh of favorites count for button synchronization
        if (onFavoritesChange) {
          onFavoritesChange();
        }
        
        console.log('🔄 FAVORITES COUNT UPDATED - Button should now show correct number');
        console.log(`🎯 FINAL STATE: Match ${originalFavoriteStatus ? 'UNFAVORITED' : 'FAVORITED'}`);
      } else {
        console.error(`❌ ${operation} operation FAILED - reverting UI`);
        console.error(`❌ CRITICAL: ${operation} failed for match ${match.home.name} vs ${match.away.name}`);
        
        // ✅ REVERT UI change if operation failed
        setMatches(prev => 
          prev.map(m => 
            m.id === matchId 
              ? { ...m, isFavorite: originalFavoriteStatus } 
              : m
          )
        );
        
        // ✅ FORCE REFRESH: Try to refresh favorites count even on failure
        if (onFavoritesChange) {
          onFavoritesChange();
        }
      }

    } catch (error) {
      console.error('❌ CRITICAL ERROR in toggleFavorite:', error);
      // ✅ REVERT to original state on any error
      const match = matches.find(m => m.id === matchId);
      if (match) {
        setMatches(prev => 
          prev.map(m => 
            m.id === matchId 
              ? { ...m, isFavorite: !m.isFavorite } 
              : m
          )
        );
      }
    }
  }, [matches, addFavorite, removeFavorite, onFavoritesChange, onMatchCountChange, filter]);

  const handleMatchPress = useCallback((match: Match) => {
    const enhancedHomeLogo = teamLogoService.getOfficialTeamLogo(match.home.name, match.league);
    const enhancedAwayLogo = teamLogoService.getOfficialTeamLogo(match.away.name, match.league);
    
    router.push({
      pathname: '/match-details',
      params: {
        matchId: match.id,
        homeTeam: match.home.name,
        awayTeam: match.away.name,
        league: (() => {
          // ✅ CRITICAL: Pass normalized league name to match-details for consistency
          const teamNames = `${match.home.name} ${match.away.name}`;
          const normalizedLeague = leagueNormalizationService.normalizeLeagueName(match.league, teamNames);
          console.log(`🏆 MATCHLIST NAV: "${match.home.name} vs ${match.away.name}" in "${match.league}" → passing "${normalizedLeague || match.league}" to match-details`);
          console.log(`🔗 NAVIGATION DATA: ID=${match.id}, Status=${match.status}, Score=${match.score}`);
          return normalizedLeague || match.league;
        })(),
        startTime: match.startTime,
        score: match.score,
        status: match.status,
        statusText: match.statusText || '',
        venue: (match as any).venue || '',
        homeScore: (match.home as any).score?.toString() || '0',
        awayScore: (match.away as any).score?.toString() || '0',
        homeLogo: enhancedHomeLogo || match.home.logo || '',
        awayLogo: enhancedAwayLogo || match.away.logo || '',
        // ✅ PASS RANKING DATA: Include team rankings for match details
        homeRank: match.home.rank?.toString() || '',
        awayRank: match.away.rank?.toString() || '',
        isFavorite: match.isFavorite ? 'true' : 'false',
      },
    });
  }, [router]);

  const renderMatchItem = useCallback(({ item }: { item: Match }) => (
    <MatchItem
      match={item}
      onToggleFavorite={toggleFavorite}
      onPress={handleMatchPress}
    />
  ), [toggleFavorite, handleMatchPress]);

  // Removed loading state - matches load instantly

  // Move groupAndSortMatches here so it is in scope
  const groupAndSortMatches = useCallback((matches: Match[]): Array<{ label?: string; matches: Match[] }> => {
    if (matches.length === 0) return [];
    if (filter === 'live') {
      // ✅ ENHANCED: Strict filtering for Live screen purity
      const live = matches.filter(m => {
        // Primary filter: must have live status
        if (m.status !== 'live') return false;
        
        // ✅ ADDITIONAL VALIDATION: Ensure match is actually live
        const hasLiveIndicators = 
          m.statusText && (
            m.statusText.includes("'") ||     // Has minute marker like "67'"
            m.statusText.includes("+") ||     // Has added time like "90+3"
            m.statusText === "HT" ||          // Half time
            m.statusText === "1H" ||          // First half
            m.statusText === "2H" ||          // Second half
            m.statusText === "LIVE"           // Generic live status
          );
        
        // ✅ SCORE VALIDATION: Live matches should have proper scores, not "vs"
        const hasLiveScore = m.score && m.score !== 'vs' && m.score !== 'VS';
        
        const isValidLive = hasLiveIndicators || hasLiveScore;
        
        if (!isValidLive) {
          console.log(`⚠️ LIVE FILTER: Excluding non-live match: ${m.home.name} vs ${m.away.name} (status: ${m.status}, statusText: ${m.statusText}, score: ${m.score})`);
          return false;
        }
        
        console.log(`✅ LIVE FILTER: Including live match: ${m.home.name} vs ${m.away.name} (status: ${m.status}, statusText: ${m.statusText}, score: ${m.score})`);
        return true;
      });
      
      // ✅ ENHANCED: Sort live matches by match progression with proper added time handling
      live.sort((a, b) => {
        // Function to get match priority (higher = more important)
        const getMatchPriority = (match: Match): number => {
          const status = match.statusText?.toUpperCase() || '';
          const timeStr = match.time?.toUpperCase() || '';
          
          // ✅ COMPREHENSIVE PENALTY DETECTION (highest priority)
          const isPenalty = 
            status.includes('PEN') || 
            status === 'P' || 
            status.includes('PENALTY') ||
            status.includes('SHOOTOUT') ||
            timeStr.includes('PEN') ||
            status === 'PSO'; // Penalty Shoot-Out
          
          if (isPenalty) return 1000;
          
          // ✅ COMPREHENSIVE EXTRA TIME DETECTION (high priority)
          const isExtraTime = 
            status.includes('ET') || 
            status === 'ET' || 
            status.includes('EXTRA') ||
            status.includes('OVERTIME') ||
            timeStr.includes('ET') ||
            status === 'AET' || // After Extra Time
            status === 'BT' || // Break Time (in ET)
            (timeStr.includes('+') && parseInt(timeStr) > 90); // 90+ could be extra time
          
          if (isExtraTime) return 900;
          
          // Regular live matches get normal priority
          return 0;
        };
        
        // Function to convert match time to comparable number
        const getMatchProgression = (match: Match): number => {
          const timeStr = match.time || match.statusText || '0';
          
          // Handle special cases
          if (timeStr === 'HT' || timeStr === 'HALFTIME') return 45.5; // Between 45 and 46
          if (timeStr === 'FT' || timeStr === 'FULLTIME') return 100; // After 90+
          
          // Handle added time formats like "90+6", "45+3"
          if (timeStr.includes('+')) {
            const [base, added] = timeStr.split('+');
            const baseMin = parseInt(base) || 0;
            const addedMin = parseInt(added) || 0;
            // Convert to decimal: 90+6 becomes 90.6, 45+3 becomes 45.3
            return baseMin + (addedMin * 0.1);
          }
          
          // Handle regular minute formats like "67'", "23'"
          const parsed = parseInt(timeStr);
          return isNaN(parsed) ? 0 : parsed;
        };
        
        const priorityA = getMatchPriority(a);
        const priorityB = getMatchPriority(b);
        
        // First sort by priority (ET/Penalty matches first)
        if (priorityA !== priorityB) {
          return priorityB - priorityA;
        }
        
        // Then sort by progression within same priority group
        const progressionA = getMatchProgression(a);
        const progressionB = getMatchProgression(b);
        
        // Higher progression first (90+6 before 67', 67' before 23')
        return progressionB - progressionA;
      });
      
      console.log(`🔴 LIVE SCREEN: Showing ${live.length} verified live matches from ${matches.length} total matches`);
      return [{ label: undefined, matches: live }];
    }
    if (filter === 'fixture') {
      let upcoming = matches.filter(m => m.status === 'upcoming');
      
      // ✅ ENHANCED: Filter by selected date for precise 00:00-23:59 coverage
      if (selectedDate) {
        upcoming = upcoming.filter(match => {
          try {
            const matchDate = new Date(match.startTime);
            const selectedDateObj = new Date(selectedDate + 'T12:00:00'); // Timezone-safe
            
            // Check if match is on the same date (YYYY-MM-DD)
            const matchDateStr = matchDate.toISOString().split('T')[0];
            const selectedDateStr = selectedDateObj.toISOString().split('T')[0];
            
            const isMatchingDate = matchDateStr === selectedDateStr;
            
            if (isMatchingDate) {
              console.log(`📅 FIXTURE FILTER: Including match ${match.home.name} vs ${match.away.name} on ${matchDateStr} (selected: ${selectedDateStr})`);
            }
            
            return isMatchingDate;
          } catch (error) {
            console.warn(`⚠️ FIXTURE FILTER: Invalid date for ${match.home.name} vs ${match.away.name}:`, error);
            return false;
          }
        });
        
        console.log(`📅 FIXTURE FILTER: ${upcoming.length} matches found for ${selectedDate}`);
      }
      
      const groups = groupByDate(upcoming);
      
      // ✅ ENHANCED: Better date labels for fixture matches
      const formatFixtureLabel = (dateStr: string): string => {
        const date = new Date(dateStr + 'T12:00:00'); // Timezone-safe parsing
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        
        const isToday = date.toDateString() === today.toDateString();
        const isTomorrow = date.toDateString() === tomorrow.toDateString();
        
        if (isToday) return `📅 Today (${date.toLocaleDateString()})`;
        if (isTomorrow) return `📅 Tomorrow (${date.toLocaleDateString()})`;
        
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayName = dayNames[date.getDay()];
        return `📅 ${dayName} (${date.toLocaleDateString()})`;
      };
      
      return Object.entries(groups)
        .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
        .map(([date, group]) => ({ 
          label: formatFixtureLabel(date), 
          matches: group.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()) 
        }));
    }
    if (filter === 'finished') {
      let finished = matches.filter(m => m.status === 'finished');
      
      // ✅ ENHANCED: Filter by selected date for precise historical date coverage
      if (selectedDate) {
        finished = finished.filter(match => {
          try {
            const matchDate = new Date(match.startTime);
            const selectedDateObj = new Date(selectedDate + 'T12:00:00'); // Timezone-safe
            
            // Check if match is on the same date (YYYY-MM-DD)
            const matchDateStr = matchDate.toISOString().split('T')[0];
            const selectedDateStr = selectedDateObj.toISOString().split('T')[0];
            
            const isMatchingDate = matchDateStr === selectedDateStr;
            
            if (isMatchingDate) {
              console.log(`🏁 FINISHED FILTER: Including match ${match.home.name} vs ${match.away.name} on ${matchDateStr} (selected: ${selectedDateStr})`);
            }
            
            return isMatchingDate;
          } catch (error) {
            console.warn(`⚠️ FINISHED FILTER: Invalid date for ${match.home.name} vs ${match.away.name}:`, error);
            return false;
          }
        });
        
        console.log(`🏁 FINISHED FILTER: ${finished.length} finished matches found for ${selectedDate}`);
      }
      
      const groups = groupByDate(finished);
      
      // ✅ ENHANCED: Backward chronological order exactly like Chinese app
      // Most recent dates first, within each date most recent matches first (latest in the day to earliest)
      return Object.entries(groups)
        .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime()) // Dates: newest first
        .map(([date, group]) => ({ 
          label: getFinishedGroupLabel(date), 
          matches: group.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()) // Within date: latest time first
        }));
    }
    
    // ✅ RESTORED: Proper "All" tab grouping with correct chronological order
    // 1. Live matches (by time progression)
    // 2. Next matches (upcoming within hour) 
    // 3. Upcoming matches (fixture matches)
    // 4. Finished matches
    
    const live = matches.filter(m => m.status === 'live');
    const next = matches.filter(m => m.status === 'upcoming' && isWithinNextHour(m.startTime));
    const upcoming = matches.filter(m => m.status === 'upcoming' && !isWithinNextHour(m.startTime));
    const finished = matches.filter(m => m.status === 'finished');
    
    // Sort each group properly
    live.sort((a, b) => {
      // ✅ ENHANCED: Same priority system as Live screen for consistency
      const getMatchPriority = (match: Match): number => {
        const status = match.statusText?.toUpperCase() || '';
        const timeStr = match.time?.toUpperCase() || '';
        
        // ✅ COMPREHENSIVE PENALTY DETECTION (highest priority)
        const isPenalty = 
          status.includes('PEN') || 
          status === 'P' || 
          status.includes('PENALTY') ||
          status.includes('SHOOTOUT') ||
          timeStr.includes('PEN') ||
          status === 'PSO'; // Penalty Shoot-Out
        
        if (isPenalty) return 1000;
        
        // ✅ COMPREHENSIVE EXTRA TIME DETECTION (high priority)
        const isExtraTime = 
          status.includes('ET') || 
          status === 'ET' || 
          status.includes('EXTRA') ||
          status.includes('OVERTIME') ||
          timeStr.includes('ET') ||
          status === 'AET' || // After Extra Time
          status === 'BT' || // Break Time (in ET)
          (timeStr.includes('+') && parseInt(timeStr) > 90); // 90+ could be extra time
        
        if (isExtraTime) return 900;
        
        // Regular live matches get normal priority
        return 0;
      };
      
      const getMatchProgression = (match: Match): number => {
        const timeStr = match.time || match.statusText || '0';
        
        // Handle special cases
        if (timeStr === 'HT' || timeStr === 'HALFTIME') return 45.5;
        if (timeStr === 'FT' || timeStr === 'FULLTIME') return 100;
        
        // Handle added time formats like "90+6", "45+3"
        if (timeStr.includes('+')) {
          const [base, added] = timeStr.split('+');
          const baseMin = parseInt(base) || 0;
          const addedMin = parseInt(added) || 0;
          return baseMin + (addedMin * 0.1);
        }
        
        // Handle regular minute formats
        const parsed = parseInt(timeStr);
        return isNaN(parsed) ? 0 : parsed;
      };
      
      const priorityA = getMatchPriority(a);
      const priorityB = getMatchPriority(b);
      
      // First sort by priority (ET/Penalty matches first)
      if (priorityA !== priorityB) {
        return priorityB - priorityA;
      }
      
      // Then sort by progression within same priority group
      const progressionA = getMatchProgression(a);
      const progressionB = getMatchProgression(b);
      
      // Higher progression first
      if (progressionA !== progressionB) {
        return progressionB - progressionA;
      }
      
      // If same progression, sort by start time
      return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
    });
    
    // Sort Next matches by start time (earliest first)
    next.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    
    // Sort Upcoming matches by start time (earliest first)
    upcoming.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    
    // Sort Finished matches by start time (most recent first)
    finished.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
    
    // ✅ FIXED: Return properly ordered groups but flatten for single FlatList
    // This prevents the draggable overlap behavior while maintaining correct order
    const orderedMatches: Match[] = [];
    
    // Add in correct order: Live → Next → Upcoming → Finished
    if (live.length > 0) {
      orderedMatches.push(...live);
      console.log(`📊 ALL MATCHES: Added ${live.length} live matches`);
    }
    
    if (next.length > 0) {
      orderedMatches.push(...next);
      console.log(`📊 ALL MATCHES: Added ${next.length} next matches (within hour)`);
    }
    
    if (upcoming.length > 0) {
      orderedMatches.push(...upcoming);
      console.log(`📊 ALL MATCHES: Added ${upcoming.length} upcoming matches`);
    }
    
    if (finished.length > 0) {
      orderedMatches.push(...finished);
      console.log(`📊 ALL MATCHES: Added ${finished.length} finished matches`);
    }
    
    console.log(`📊 ALL MATCHES: Total ordered matches: ${orderedMatches.length}`);
    
    // Return as single group to prevent draggable behavior
    return [{ label: undefined, matches: orderedMatches }];
  }, [filter]);

  const groupedMatches = groupAndSortMatches(matches);

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={[styles.errorText, { color: theme.colors.error }]}> {error} </Text>
      </View>
    );
  }

  if (matches.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}> No matches available </Text>
      </View>
    );
  }

  // ✅ FIXED: Use single FlatList to prevent overlapping behavior
  // Flatten all grouped matches into a single array for one FlatList
  const flattenedMatches = groupedMatches.reduce((acc: Match[], group) => {
    return acc.concat(group.matches);
  }, []);



  return (
    <View style={styles.container}>
      <AnimatedFlatList
        ref={flatListRef}
        data={flattenedMatches}
        renderItem={renderMatchItem}
        refreshing={refreshing || internalRefreshing}
        onRefresh={handleRefresh}
        theme={theme}
        style={styles.container}
        ListHeaderComponent={headerComponent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
});