import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, NativeSyntheticEvent, NativeScrollEvent, Animated, TouchableOpacity } from 'react-native';
import MatchItem from './MatchItem';
import { useTheme } from '@/hooks/useTheme';
import { useFavorites } from '@/hooks/useFavorites';
import { Match } from '@/types/match';
import { fetchMatches } from '@/services/matchService';
import { usePathname } from 'expo-router';
import goalDetectionService from '@/services/goalDetectionService';

interface MatchListProps {
  sport: string;
  filter: string;
  sortMode?: string;
  displayMode?: string;
  selectedDate?: string;
  onFavoritesChange?: () => void;
  onMatchCountChange?: (count: number) => void;
  hideSortIndicator?: boolean;
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

export default function MatchList({
  sport,
  filter,
  sortMode = 'time',
  displayMode = 'score',
  selectedDate,
  onFavoritesChange,
  onMatchCountChange,
  hideSortIndicator = false,
}: MatchListProps) {
  const theme = useTheme();
  const [matches, setMatches] = useState<Match[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false); // ✅ Start with false for instant display
  const { refreshFavoritesCount, addFavorite, removeFavorite } = useFavorites();
  const pathname = usePathname();
  
  // ✅ ZERO-JUMP NAVIGATION: No animations, instant smooth transitions
  const fadeAnim = useRef(new Animated.Value(1)).current; // Always visible
  const contentOpacity = useRef(new Animated.Value(1)).current; // Always visible
  
  // ✅ NO ANIMATIONS: Complete elimination of jumping behavior
  useEffect(() => {
    // 🎯 INSTANT VISIBILITY: No fade effects, completely smooth navigation
    fadeAnim.setValue(1);
    contentOpacity.setValue(1);
    
    // ✅ ZERO ANIMATIONS: No stagger, no timing, no delays - instant response
    console.log('✅ INSTANT SPORT TRANSITION:', sport, filter);
  }, [sport, filter]); // Instant response to sport/filter changes

  // ✅ INSTANT RESPONSE: Optimized sorting with immediate feedback
  const sortMatches = useCallback((matches: Match[]): Match[] => {
    if (matches.length === 0) return matches;
    
    const sortedMatches = [...matches];
    
    console.log(`🔄 INSTANT SORTING ${matches.length} matches by: ${sortMode === 'league' ? 'LEAGUE PRIORITY' : 'TIME'}`);
    
    const result = sortedMatches.sort((a, b) => {
      // CRITICAL: Always prioritize live matches first, regardless of sort mode
      const statusOrder = { 'live': 1, 'upcoming': 2, 'finished': 3 };
      const statusDiff = (statusOrder[a.status] || 4) - (statusOrder[b.status] || 4);
      
      if (statusDiff !== 0) {
        return statusDiff;
      }
      
      // Apply secondary sorting based on sort mode and status
      if (sortMode === 'league') {
        // Sort by League: Higher priority leagues first, then by time within leagues
        const leaguePriorityA = getLeaguePriority(a.league);
        const leaguePriorityB = getLeaguePriority(b.league);
        
        if (leaguePriorityA !== leaguePriorityB) {
          return leaguePriorityA - leaguePriorityB; // Lower number = higher priority
        }
        
        // Within same league priority, sort by time based on status
        const timeA = new Date(a.startTime).getTime();
        const timeB = new Date(b.startTime).getTime();
        
        if (a.status === 'finished' && b.status === 'finished') {
          return timeB - timeA; // Finished: REVERSE chronological (most recent first)
        } else {
          return timeA - timeB; // Upcoming/Live: Forward chronological
        }
      } else {
        // Sort by Time based on match status
        const timeA = new Date(a.startTime).getTime();
        const timeB = new Date(b.startTime).getTime();
        
        if (a.status === 'finished' && b.status === 'finished') {
          // FINISHED MATCHES: REVERSE CHRONOLOGICAL ORDER (most recent first, backwards in time)
          return timeB - timeA; // 23:59 → 00:00 (backwards)
        } else {
          // UPCOMING/LIVE MATCHES: FORWARD CHRONOLOGICAL ORDER (earliest first)
          return timeA - timeB; // 00:00 → 23:59 (forwards)
        }
      }
    });
    
    console.log(`✅ INSTANT SORT COMPLETE: ${result.length} matches organized (finished: reverse chronological, upcoming: forward chronological)`);
    return result;
  }, [sortMode, pathname]);

  // ⚡ INSTANT DATA LOADING: Zero-delay fixture loading with aggressive caching
  const loadMatches = useCallback(async () => {
    try {
      setError(null);
      // No loading state - always instant feel
      
      console.log(`⚡ INSTANT FIXTURE LOADING: ${filter} ${selectedDate ? `for ${selectedDate}` : ''}`);
      
      // Special logging for finished matches
      if (filter === 'finished') {
        const today = new Date().toISOString().split('T')[0];
        const isToday = selectedDate === today;
        console.log(`🏁 MATCHLIST: Loading finished matches for ${selectedDate}${isToday ? ' (TODAY)' : ''}`);
        console.log(`⏰ SORT ORDER: REVERSE CHRONOLOGICAL (most recent first, backwards in time)`);
        if (isToday) {
          console.log(`🔥 TODAY: Will show matches finished 10+ minutes ago → backwards to 00:00`);
        } else {
          console.log(`📅 ${selectedDate}: Will show matches from 23:59 → backwards to 00:00`);
        }
        console.log(`📍 EXPECTED: ${isToday ? 'Today button should be highlighted and today\'s finished matches should display' : 'Selected date button should be highlighted'}`);
      }
      
      // Set loading state to false immediately to prevent delays
      setLoading(false);
      
      // Fetch matches with instant response
      const data = await fetchMatches(sport, filter, selectedDate);
      
      // ✅ INSTANT UI UPDATE: Apply sorting and update immediately
      const sortedData = sortMatches(data);
      
      console.log(`✅ INSTANT DISPLAY: ${sortedData.length} ${filter} matches ${selectedDate ? `for ${selectedDate}` : ''} loaded instantly`);
      setMatches(sortedData);
      onMatchCountChange?.(sortedData.length);
      
      // Update goal detection service with new match data
      goalDetectionService.updateMatches(sortedData);
      
    } catch (err) {
      console.error('Error loading matches:', err);
      setError('Unable to load data. Please check your connection.');
      setLoading(false);
    }
  }, [sport, filter, selectedDate, sortMatches, onMatchCountChange]);

  useEffect(() => {
    // ⚡ LOAD: Real professional sports data
    loadMatches();

    // ✅ INSTANT UPDATES: Real-time data polling for live matches only
    let pollInterval: NodeJS.Timeout | null = null;
    
    if (filter === 'live') {
      pollInterval = setInterval(async () => {
        try {
          console.log('🔄 Polling for live match updates...');
          const liveData = await fetchMatches(sport, 'live');
          
          if (liveData.length > 0) {
            const sortedLiveData = sortMatches(liveData);
            setMatches(sortedLiveData);
            onMatchCountChange?.(sortedLiveData.length);
            
            // Update goal detection service with latest live match data
            goalDetectionService.updateMatches(sortedLiveData);
          }
        } catch (error) {
          console.error('Live polling error:', error);
        }
      }, 60000); // Poll every minute for live matches
    }

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [sport, filter, selectedDate, loadMatches, sortMatches, onMatchCountChange]);

  // Re-sort matches when sortMode changes
  useEffect(() => {
    if (matches.length > 0) {
      setMatches(prev => sortMatches(prev));
    }
  }, [sortMode, sortMatches]);

  const toggleFavorite = async (matchId: string) => {
    try {
      // Find the match in current list
      const match = matches.find(m => m.id === matchId);
      if (!match) {
        console.error('❌ Match not found for favorite toggle:', matchId);
        return;
      }

      // Toggle favorite status using the hook
      let success = false;
      if (match.isFavorite) {
        success = await removeFavorite(matchId);
        console.log('🗑️ Removed from favorites:', `${match.home.name} vs ${match.away.name}`);
      } else {
        success = await addFavorite(match);
        console.log('⭐ Added to favorites:', `${match.home.name} vs ${match.away.name}`);
      }

      if (success) {
        // Update local state immediately for better UX
        setMatches(prev => 
          prev.map(m => 
            m.id === matchId 
              ? { ...m, isFavorite: !m.isFavorite } 
              : m
          )
        );

        // If we're viewing the follows tab and a match was unfavorited, remove it from the list
        if (filter === 'follows' && match.isFavorite) {
          setMatches(prev => prev.filter(m => m.id !== matchId));
        }

        // Refresh favorites count to update badge
        await refreshFavoritesCount();

        // Call the onFavoritesChange callback if provided
        onFavoritesChange?.();
      }

    } catch (error) {
      console.error('❌ Error toggling favorite:', error);
    }
  };

  if (error && matches.length === 0) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
        <Text style={[styles.errorSubtext, { color: theme.colors.textSecondary }]}>
          Check your internet connection and try again
        </Text>
      </View>
    );
  }

  if (matches.length === 0) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
          {filter === 'follows' 
            ? '⭐ No favorites yet\n\nTap ⭐ to add matches!' 
            : filter === 'live'
            ? '🔴 No live matches\n\nCheck back during match times'
            : filter === 'fixture'
            ? '📅 No upcoming fixtures\n\nCheck different dates'
            : filter === 'finished'
            ? '🏁 No finished matches\n\nTry a different date'
            : '🌐 No matches available\n\nTry refreshing or check later'}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Animated.View style={[{ flex: 1 }, { opacity: fadeAnim }]}>
        {matches.length > 0 && !hideSortIndicator && (
          <Animated.View 
            style={[
              styles.sortIndicator, 
              { backgroundColor: theme.colors.backgroundSecondary },
              { opacity: contentOpacity }
            ]}
          >
            <Text style={[styles.sortText, { color: theme.colors.textSecondary }]}>
              {filter === 'follows' 
                ? '⭐ Your Favorite Matches' 
                : sortMode === 'league' 
                ? '🏆 Sorted by League'
                : '⏰ Sorted by Time'
              }
            </Text>
            <Text style={[styles.matchCountText, { color: theme.colors.primary }]}>
              {matches.length} matches
            </Text>
          </Animated.View>
        )}
        
        <Animated.View style={[styles.matchesContainer, { opacity: contentOpacity }]}>
          {matches.map((match, index) => (
            <MatchItem
              key={`${match.id}-${index}`}
              match={match}
              onToggleFavorite={toggleFavorite}
            />
          ))}
          

        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sortIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  sortText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  matchCountText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 150, // Extra space for bottom tabs
  },
  emptyText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
  },
  loadingText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
  },
  errorText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    textAlign: 'center',
    marginHorizontal: 20,
  },
  errorSubtext: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    textAlign: 'center',
    marginHorizontal: 20,
    marginTop: 8,
  },
  matchesContainer: {
    flex: 1,
  },

});