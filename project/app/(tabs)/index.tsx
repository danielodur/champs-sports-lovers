import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, StatusBar, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from 'react-i18next';
import { useFavorites } from '@/hooks/useFavorites';
import SportsTabs from '@/components/SportsTabs';
import FilterTabs from '@/components/FilterTabs';
import DateSelector from '@/components/DateSelector';
import MatchList from '@/components/MatchList';
import ConsecutiveStatsButton from '@/components/ConsecutiveStatsButton';

import { fetchMatches, preloadMatchData } from '@/services/matchService';
import goalDetectionService from '@/services/goalDetectionService';
import { useMatchSettings } from '@/contexts/MatchSettingsContext';

// ✅ DATE VALIDATION: Accept valid future dates (including 2025)
const validateAndCorrectDate = (dateString: string): string => {
  const inputDate = new Date(dateString);
  
  // Only reject truly invalid dates, not future dates
  if (isNaN(inputDate.getTime())) {
    console.warn('⚠️ DATE FIX: Invalid date detected, using current date');
    const now = new Date();
    return now.toISOString().split('T')[0];
  }
  
  // Accept all valid dates including future years (2025, etc.)
  return dateString;
};

// ✅ SAFE DATE GENERATOR: Always returns a valid current date
const getSafeCurrentDate = (): string => {
  try {
    const now = new Date();
    const dateString = now.toISOString().split('T')[0];
    
    // Validate the generated date (now accepts future dates)
    const validatedDate = validateAndCorrectDate(dateString);
    console.log(`📅 SAFE DATE: Generated ${validatedDate} (original: ${dateString})`);
    
    return validatedDate;
  } catch (error) {
    console.error('❌ Date generation failed, using fallback:', error);
    // Ultimate fallback - use actual current date
    const now = new Date();
    return now.toISOString().split('T')[0];
  }
};

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
  const [selectedDate, setSelectedDate] = useState(getSafeCurrentDate());
  const [matchCount, setMatchCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentMatches, setCurrentMatches] = useState<any[]>([]);
  


  // ✅ GLOBAL REFRESH FUNCTION: Allow match-details to trigger refreshes
  useEffect(() => {
    (global as any).refreshMatchLists = () => {
      console.log('🔄 GLOBAL REFRESH: Refreshing all match lists from match-details');
      setRefreshKey(prev => prev + 1);
      refreshFavoritesCount();
    };
    
    return () => {
      delete (global as any).refreshMatchLists;
    };
  }, [refreshFavoritesCount]);

  // Handle incoming sport parameter from Top screen
  useEffect(() => {
    if (params.sport && typeof params.sport === 'string') {
      console.log('✅ Navigation from Top screen - setting sport:', params.sport);
      setActiveSport(params.sport);
      router.setParams({ sport: undefined });
    }
  }, [params.sport]);
  
  // Goal detection and background refresh service startup
  useEffect(() => {
    console.log('🚨 Ensuring goal detection is active');
    
    if (!goalDetectionService.isMonitoringActive()) {
      goalDetectionService.startMonitoring();
    }
    
    // ✅ START BACKGROUND REFRESH SERVICE
    const initializeServices = async () => {
      try {
        console.log('⚡ HOME SCREEN: Starting background refresh service...');
        
        // Start background refresh service
        const { backgroundRefreshService } = await import('@/services/backgroundRefreshService');
        backgroundRefreshService.startBackgroundRefresh();
        
        // Initial data preload
        preloadMatchData().catch(error => {
          console.log('⚠️ Preloading failed but continuing:', error);
        });
        
        console.log('✅ Background services initialized');
      } catch (error) {
        console.log('⚠️ Service initialization failed:', error);
      }
    };

    initializeServices();
    
    // Cleanup function
    return () => {
      // Stop background refresh when component unmounts
      const stopServices = async () => {
        try {
          const { backgroundRefreshService } = await import('@/services/backgroundRefreshService');
          backgroundRefreshService.stopBackgroundRefresh();
        } catch (error) {
          console.log('⚠️ Service cleanup failed:', error);
        }
      };
      stopServices();
    };
  }, [activeSport]);

  const handleSportChange = (sport: string) => {
    console.log('🏈 Sport changing from', activeSport, 'to', sport);
    
    if (sport === 'important') {
      console.log('⚡ ZERO JUMPING: Navigating to Top screen');
      router.push('/top');
      return;
    }
    
    setActiveSport(sport);
  };

  // Force today's date for finished/fixture filters with validation
  useEffect(() => {
    if (activeFilter === 'finished' || activeFilter === 'fixture') {
      const safeToday = getSafeCurrentDate();
      console.log(`🏁 ${activeFilter.toUpperCase()} filter - using safe date: ${safeToday}`);
      setSelectedDate(safeToday);
    }
  }, [activeFilter]);

  // ✅ CORRECTED: Only refresh count when follows tab is activated (NO AUTO-CLEARING)
  useEffect(() => {
    if (activeFilter === 'follows') {
      console.log('⭐ FOLLOWS TAB: Refreshing count without clearing data...');
      
      // ✅ CORRECT BEHAVIOR: Only refresh the count, never clear user data
      refreshFavoritesCount();
    }
  }, [activeFilter, refreshFavoritesCount]);

  const getSortIndicatorText = () => {
    if (activeFilter === 'follows') {
      return '⭐ Your Favorite Matches';
    }
    
    if (sortMode === 'league') {
      return '🏆 Sorted by League';
    } else {
      return '⏰ Sorted by Time';
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      console.log(`🔄 Refreshing ${activeFilter} matches for ${activeSport}`);
      
      // Force refresh through background service
      const { backgroundRefreshService } = await import('@/services/backgroundRefreshService');
      const freshMatches = await backgroundRefreshService.forceRefresh(activeFilter);
      
      // Update current matches state
      setCurrentMatches(freshMatches);
      
      // Also trigger the increment of refresh key to update MatchList
      setRefreshKey(prev => prev + 1);
      
      console.log(`✅ Refresh completed: ${freshMatches.length} matches`);
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  }, [activeSport, activeFilter, selectedDate]);

  // Determine if DateSelector should be sticky (for Fixture and Finished screens)
  const shouldUseStickyDateSelector = activeFilter === 'fixture' || activeFilter === 'finished';

  // Create the date selector as a header component for non-sticky screens
  const renderDateSelectorHeader = useCallback(() => (
    <DateSelector
      selectedDate={selectedDate}
      onSelectDate={setSelectedDate}
      activeFilter={activeFilter}
    />
  ), [selectedDate, activeFilter]);

  return (
    <>
      <StatusBar barStyle={theme.colors.background === '#FFFFFF' ? 'dark-content' : 'light-content'} backgroundColor={theme.colors.backgroundSecondary} translucent />
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.backgroundSecondary }]} edges={['top']}>
        
        {/* Sports Tabs */}
        <View style={[styles.sportsSection, { backgroundColor: theme.colors.backgroundSecondary }]}>
          <SportsTabs
            active={activeSport}
            onSelect={handleSportChange}
          />
        </View>

        {/* Filter Tabs */}
        <View style={[styles.filterSection, { backgroundColor: theme.colors.backgroundSecondary }]}>
          <FilterTabs
            active={activeFilter}
            onSelect={setActiveFilter}
            currentSport={activeSport}
            onSortChange={setSortMode}
            onDisplayModeChange={setDisplayMode}
            favoritesCount={favoritesCount}
            currentSortMode={sortMode}
          />
          
          <View style={[styles.sortIndicator, { borderBottomColor: theme.colors.border }]}>
            <Text style={[styles.sortText, { color: theme.colors.textSecondary }]}>
              {getSortIndicatorText()}
            </Text>
            <Text style={[styles.matchCountText, { color: theme.colors.primary }]}>
              {matchCount} matches
            </Text>
          </View>
        </View>

        {/* Sticky Date Selector for Fixture and Finished screens */}
        {shouldUseStickyDateSelector && (
          <View style={[styles.stickyDateSelector, { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.border }]}>
            <DateSelector
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              activeFilter={activeFilter}
            />
          </View>
        )}

        {/* Match List - restored to original layout */}
        <MatchList
          key={refreshKey}
          sport={activeSport}
          filter={activeFilter}
          sortMode={sortMode}
          displayMode={displayMode}
          selectedDate={selectedDate}
          onFavoritesChange={refreshFavoritesCount}
          onMatchCountChange={setMatchCount}
          hideSortIndicator={true}
          refreshing={refreshing}
          onRefresh={onRefresh}
          headerComponent={shouldUseStickyDateSelector ? undefined : renderDateSelectorHeader}
          onMatchesLoaded={setCurrentMatches}
        />

        {/* Small Red Button for Consecutive Stats - Only on All and Live screens */}
        {(activeFilter === 'all' || activeFilter === 'live') && (
          <ConsecutiveStatsButton />
        )}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sportsSection: {
    height: 60,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  filterSection: {
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
  stickyDateSelector: {
    borderBottomWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    zIndex: 5, // Ensure it stays above the match list
  },

});