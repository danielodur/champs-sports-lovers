import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, ScrollView, Animated, Alert, Dimensions, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Clock } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from 'react-i18next';
import { useFavorites } from '@/hooks/useFavorites';
import SportsTabs from '@/components/SportsTabs';
import FilterTabs from '@/components/FilterTabs';
import DateSelector from '@/components/DateSelector';
import MatchList from '@/components/MatchList';
import ThemeAwareHeader from '@/components/ThemeAwareHeader';
import { fetchMatches } from '@/services/matchService';
import goalDetectionService from '@/services/goalDetectionService';
import { useMatchSettings } from '@/contexts/MatchSettingsContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const theme = useTheme();
  const { t } = useTranslation();
  const { favoritesCount, refreshFavoritesCount } = useFavorites();
  const { showGoalNotification } = useMatchSettings();
  const [activeSport, setActiveSport] = useState('football');
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortMode, setSortMode] = useState('time');
  const [displayMode, setDisplayMode] = useState('score');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [matchCount, setMatchCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  
  // ✅ ZERO-JUMP NAVIGATION: No animations, always visible
  const fadeAnim = useRef(new Animated.Value(1)).current; // Always visible
  
  // ✅ INSTANT SPORTS NAVIGATION: Handle incoming sport parameter from Top screen
  useEffect(() => {
    // Check if sport parameter was passed from Top screen
    if (params.sport && typeof params.sport === 'string') {
      console.log('✅ INSTANT TOP NAVIGATION: Received sport parameter:', params.sport);
      
      // ✅ ZERO-DELAY SPORT UPDATE: Instant sport change, no jumping
      setActiveSport(params.sport);
      
      // Clear the parameter to prevent re-triggering
      router.setParams({ sport: undefined });
      
      console.log('✅ INSTANT SPORT SET:', params.sport);
    }
  }, [params.sport]);
  
  // ✅ GOAL DETECTION AUTO-START: Ensure goal monitoring is active for live matches
  useEffect(() => {
    console.log('🚨 HOME SCREEN: Ensuring goal detection is active for real-time alerts');
    
    if (!goalDetectionService.isMonitoringActive()) {
      goalDetectionService.startMonitoring();
      console.log('🔄 Goal detection service started from Home screen');
    }
    
    // Auto-refresh live matches every 30 seconds to catch score changes
    const liveMatchInterval = setInterval(async () => {
      if (activeSport === 'football') {
        try {
          const liveMatches = await fetchMatches('football', 'live');
          if (liveMatches.length > 0) {
            console.log(`🔄 Auto-updating ${liveMatches.length} live matches for goal detection`);
            goalDetectionService.updateMatches(liveMatches);
          }
        } catch (error) {
          console.log('❌ Error in auto-refresh for goal detection:', error);
        }
      }
    }, 30000); // Every 30 seconds
    
    return () => {
      clearInterval(liveMatchInterval);
    };
  }, [activeSport]);
  
  // ✅ NO ENTRANCE ANIMATIONS: Instant visibility for zero jumping
  useEffect(() => {
    // 🎯 ALWAYS VISIBLE: No fade-in animations to prevent jumping
    fadeAnim.setValue(1);
    console.log('✅ HOME SCREEN: Always visible, no animations');
  }, []);
  
  console.log('🚨 HOME SCREEN RENDERING IN TABS LAYOUT');
  console.log('🏈 HOME SCREEN - Active sport:', activeSport);

  // ✅ REMOVED PARAMETER HANDLING - No more jumping from state conflicts
  // Direct navigation eliminates need for parameter-based sport changes

  const handleSportChange = (sport: string) => {
    console.log('🏈 HOME SCREEN - Sport changing from', activeSport, 'to', sport);
    
    // Handle "important" (Top) tab selection - zero-jump navigation to Top screen
    if (sport === 'important') {
      console.log('⚡ INSTANT ZERO-JUMP navigation to Top screen');
      
      // ✅ IMMEDIATE NAVIGATION - Remove setTimeout for instant response
      router.replace('/top');
      return;
    }
    
    // ✨ FOOTBALL BUTTON OPTIMIZATION: Beautiful state transition
    if (sport === 'football') {
      console.log('⚽ FOOTBALL BUTTON: Beautiful entrance with zero jumping');
    }
    
    // ✅ IMMEDIATE STATE UPDATE: No delays for instant visual feedback
    setActiveSport(sport);
  };

  // ✅ FORCE TODAY'S MATCHES: When Finished or Fixture filter is selected, immediately force Today's date and matches
  useEffect(() => {
    if (activeFilter === 'finished' || activeFilter === 'fixture') {
      const todayStr = new Date().toISOString().split('T')[0];
      console.log(`🏁 ${activeFilter.toUpperCase()} FILTER PRESSED: MUST show TODAY button and TODAY'S matches FIRST`);
      console.log(`🔥 FORCING: Today button must be visible and selected immediately`);
      console.log(`📍 REQUIREMENT: Today button and Today's screen must be the FIRST thing user sees`);
      
      // Force immediate update to today's date - this MUST make Today visible first
      setSelectedDate(todayStr);
    }
  }, [activeFilter]);

  // Refresh favorites count when user switches to or is on the Follows tab
  useEffect(() => {
    if (activeFilter === 'follows') {
      refreshFavoritesCount();
      
      const interval = setInterval(() => {
        refreshFavoritesCount();
      }, 2000);
      
      return () => clearInterval(interval);
    }
  }, [activeFilter, refreshFavoritesCount]);

  // Create the sort indicator text
  const getSortIndicatorText = () => {
    if (activeFilter === 'follows') {
      return '⭐ Your Favorite Matches';
    }
    
    if (sortMode === 'league') {
      return '🏆 Sorted by League'; // Higher ranking leagues first
    } else {
      return '⏰ Sorted by Time'; // Chronological order
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Clear caches and fetch fresh data
      await fetchMatches(activeSport, activeFilter, selectedDate);
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  }, [activeSport, activeFilter, selectedDate]);



  return (
    <>
      <StatusBar barStyle={theme.colors.background === '#FFFFFF' ? 'dark-content' : 'light-content'} backgroundColor={theme.colors.backgroundSecondary} translucent />
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.backgroundSecondary }]} edges={['top']}>
        <Animated.View style={[{ flex: 1 }, { opacity: fadeAnim }]}>
                     <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[theme.colors.primary]}
                tintColor={theme.colors.primary}
              />
            }
            showsVerticalScrollIndicator={false}
          >
                         <View style={styles.content}>
               <SportsTabs
                active={activeSport}
                onSelect={handleSportChange}
              />
              
              <FilterTabs
                active={activeFilter}
                onSelect={setActiveFilter}
                currentSport={activeSport}
                onSortChange={setSortMode}
                onDisplayModeChange={setDisplayMode}
                favoritesCount={favoritesCount}
                currentSortMode={sortMode}
              />
              
              {/* Sort indicator connected to FilterTabs */}
              <View style={[styles.sortIndicator, { borderBottomColor: theme.colors.border }]}>
                <Text style={[styles.sortText, { color: theme.colors.textSecondary }]}>
                  {getSortIndicatorText()}
                </Text>
                <Text style={[styles.matchCountText, { color: theme.colors.primary }]}>
                  {matchCount} matches
                </Text>
              </View>
              
              <DateSelector
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
                activeFilter={activeFilter}
              />
              
              <MatchList
                sport={activeSport}
                filter={activeFilter}
                sortMode={sortMode}
                displayMode={displayMode}
                selectedDate={selectedDate}
                onFavoritesChange={refreshFavoritesCount}
                onMatchCountChange={setMatchCount}
                hideSortIndicator={true}
              />
            </View>
          </ScrollView>
        </Animated.View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingBottom: 100, // Space for bottom tabs
  },

  sportsSection: {
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  stickySection: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  sortIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  sortText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  matchCountText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
  },
  fixedDateLayout: {
    flex: 1,
  },
  fixedDateSelector: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  scrollableMatches: {
    flex: 1,
  },
  scrollableMatchesContent: {
    paddingBottom: 100, // Account for bottom tab bar
  },
});