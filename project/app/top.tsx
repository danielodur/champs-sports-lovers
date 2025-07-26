import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  RefreshControl,
  Dimensions,
  Platform,
  Pressable,
  StatusBar,
  TouchableOpacity,
  UIManager,
  InteractionManager
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { 
  TrendingUp, 
  Trophy, 
  Clock, 
  Users, 
  Star,
  Play,
  Flag,
  Home,
  Compass,
  Newspaper,
  User,
  ChevronLeft,
  MoreHorizontal,
  Zap
} from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { Match } from '@/types/match';
import { fetchHotMatches, fetchMatches } from '@/services/matchService';
import MatchItem from '@/components/MatchItem';
import SportsTabs from '@/components/SportsTabs';
import { useFavorites } from '@/hooks/useFavorites';
import MatchList from '@/components/MatchList';

import goalDetectionService from '@/services/goalDetectionService';
import { useMatchSettings } from '@/contexts/MatchSettingsContext';
import teamLogoService from '@/services/teamLogoService';

const { width, height } = Dimensions.get('window');

interface TopCategory {
  id: string;
  title: string;
  icon: any;
  sport: string;
  description: string;
}

interface TabButton {
  key: string;
  title: string;
  icon: any;
  route: string;
}

export default function TopScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const scrollViewRef = useRef<ScrollView>(null);
  const [selectedCategory, setSelectedCategory] = useState('live');
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { addFavorite, removeFavorite, refreshFavoritesCount } = useFavorites();
  const { showGoalNotification } = useMatchSettings();
  
  // ✅ COMPLETE ANIMATION DISABLE: Turn off ALL React Native animations
  useEffect(() => {
    if (Platform.OS === 'android') {
      UIManager.setLayoutAnimationEnabledExperimental && UIManager.setLayoutAnimationEnabledExperimental(false);
    }
  }, []);

  // ✅ INSTANT DATA LOAD: Load without any delays
  useEffect(() => {
    // Use InteractionManager to prevent any layout conflicts
    InteractionManager.runAfterInteractions(() => {
      loadTopMatches();
    });
  }, [selectedCategory]); 

  // ✅ GOAL DETECTION: Setup once without layout impact
  useEffect(() => {
    if (!goalDetectionService.isMonitoringActive()) {
      goalDetectionService.startMonitoring();
    }
  }, []); 
  
  const tabButtons: TabButton[] = [
    { key: 'home', title: 'Home', icon: Home, route: '/' },
    { key: 'discover', title: 'Discover', icon: Compass, route: '/discover' },
    { key: 'news', title: 'News', icon: Newspaper, route: '/news' },
    { key: 'stats', title: 'Stats', icon: Trophy, route: '/stats' },
    { key: 'profile', title: 'Profile', icon: User, route: '/profile' },
  ];

  const topCategories: TopCategory[] = [
    {
      id: 'live',
      title: 'Live Now',
      icon: Play,
      sport: 'football',
      description: 'Live top matches happening now'
    },
    {
      id: 'upcoming',
      title: 'Upcoming',
      icon: Clock,
      sport: 'football',
      description: 'Top upcoming matches'
    },
    {
      id: 'uganda',
      title: 'Ugandan Premier League',
      icon: Trophy,
      sport: 'football',
      description: 'Uganda\'s top football league (Currently in off-season)'
    },
    {
      id: 'premier',
      title: 'English Premier League', 
      icon: Trophy,
      sport: 'football',
      description: 'England\'s top football league (Currently in off-season)'
    },
    {
      id: 'champions',
      title: 'Champions League',
      icon: Star,
      sport: 'football',
      description: 'Europe\'s elite football competition'
    },
    {
      id: 'nba',
      title: 'NBA',
      icon: Trophy,
      sport: 'basketball',
      description: 'America\'s major basketball league'
    },
    {
      id: 'finished',
      title: 'Latest Results',
      icon: Flag,
      sport: 'football',
      description: 'Recent top match results'
    }
  ];

  // ✅ INSTANT NAVIGATION: Zero transition time
  const handleSportChange = useCallback((sport: string) => {
    if (sport !== 'important') {
      // Use setTimeout with 0 to ensure instant execution without blocking
      setTimeout(() => {
        router.replace({
          pathname: '/(tabs)',
          params: { sport: sport }
        });
      }, 0);
    }
  }, [router]);

  // ✅ INSTANT TAB NAVIGATION: Zero delay
  const handleTabPress = useCallback((route: string) => {
    setTimeout(() => {
      router.replace(route);
    }, 0);
  }, [router]);

  // ✅ INSTANT MATCH NAVIGATION: Zero delay
  const handleMatchPress = useCallback((match: Match) => {
    setTimeout(() => {
      router.push({
        pathname: '/match-details',
        params: {
          matchId: match.id,
          homeTeam: match.home.name,
          awayTeam: match.away.name,
          homeScore: match.score.split('-')[0]?.trim() || '0',
          awayScore: match.score.split('-')[1]?.trim() || '0',
          status: match.status,
          startTime: match.startTime,
          league: match.league,
          // ✅ PASS RANKING DATA: Include team rankings for match details
          homeRank: match.home.rank?.toString() || '',
          awayRank: match.away.rank?.toString() || '',
          from: 'top'
        }
      });
    }, 0);
  }, [router]);

  // ✅ STABLE DATA LOADING: No layout changes during load
  const loadTopMatches = useCallback(async () => {
    try {
      // Don't set loading to prevent layout changes
      let matches: Match[] = [];
      
      switch (selectedCategory) {
        case 'live':
          matches = await fetchMatches('football', 'live');
          break;
        case 'upcoming':
          matches = await fetchMatches('football', 'fixture'); // Use 'fixture' for consistency
          break;
        case 'finished':
          matches = await fetchMatches('football', 'finished');
          break;
        case 'premier':
          // ✅ FIXED: Get all current matches and filter for ENGLISH Premier League only
          const allPremierMatches = await fetchMatches('football', 'all');
          const { leagueNormalizationService } = await import('@/services/leagueNormalizationService');
          matches = leagueNormalizationService.filterMatchesForTopCategory(allPremierMatches, 'premier');
          console.log(`🏆 English Premier League: Found ${matches.length} matches from ${allPremierMatches.length} total`);
          break;
        case 'champions':
          // ✅ FIXED: Get all current matches and filter for Champions League
          const allChampionsMatches = await fetchMatches('football', 'all');
          matches = allChampionsMatches.filter(match => 
            match.league.toLowerCase().includes('champions league') ||
            match.league.toLowerCase().includes('uefa champions') ||
            match.league.toLowerCase().includes('ucl')
          );
          console.log(`🏆 Champions League: Found ${matches.length} matches from ${allChampionsMatches.length} total`);
          break;
        case 'nba':
          matches = await fetchMatches('basketball', 'all');
          break;
        case 'uganda':
          // ✅ FIXED: Get all current matches and filter for UGANDAN Premier League only
          const allUgandaMatches = await fetchMatches('football', 'all');
          const { leagueNormalizationService: ugandaService } = await import('@/services/leagueNormalizationService');
          matches = ugandaService.filterMatchesForTopCategory(allUgandaMatches, 'uganda');
          console.log(`🇺🇬 Ugandan Premier League: Found ${matches.length} matches from ${allUgandaMatches.length} total`);
          break;
        default:
          // Fallback to fetching hot matches for unknown categories
          const validCategories: Array<'live' | 'upcoming' | 'premier' | 'champions' | 'nba' | 'finished' | 'uganda'> = 
            ['live', 'upcoming', 'premier', 'champions', 'nba', 'finished', 'uganda'];
          if (validCategories.includes(selectedCategory as any)) {
            matches = await fetchHotMatches(selectedCategory as 'live' | 'upcoming' | 'premier' | 'champions' | 'nba' | 'finished' | 'uganda');
          } else {
            console.warn(`⚠️ Unknown category: ${selectedCategory}, showing empty results`);
            matches = [];
          }
      }
      
      // Enhance matches with team logos
      const enhancedMatches = matches.map(match => ({
        ...teamLogoService.enhanceMatchWithLogos(match),
        isFavorite: match.isFavorite || false
      }));
      
      // Update goal detection for live matches
      const liveMatches = enhancedMatches.filter(match => match.status === 'live');
      if (liveMatches.length > 0) {
        goalDetectionService.updateMatches(liveMatches);
      }
      
      // ✅ INSTANT STATE UPDATE: Single update to prevent layout shifts
      setMatches(enhancedMatches);
      
    } catch (error) {
      console.error('❌ Error loading matches:', error);
      setMatches([]);
    }
  }, [selectedCategory]);

  // ✅ STABLE SORTING: No layout changes
  const sortTopMatches = useCallback((matches: Match[]): Match[] => {
    if (matches.length === 0) return matches;
    
    return [...matches].sort((a, b) => {
        // ✅ CRITICAL FIX: Live matches sorted by MATCH PROGRESSION first
        const aIsLive = a.status === 'live';
        const bIsLive = b.status === 'live';
        
        // Live matches always come first
        if (aIsLive && !bIsLive) return -1;
        if (bIsLive && !aIsLive) return 1;
        
        // For live matches, sort by match progression (higher minutes first)
        if (aIsLive && bIsLive) {
          const getMatchMinute = (match: Match): number => {
            if (match.time) {
              if (match.time.includes('+')) {
                // For "90+10", extract the base minute (90) and add extra time
                const parts = match.time.split('+');
                const basePart = parseInt(parts[0]) || 0;
                const extraPart = parseInt(parts[1]) || 0;
                return basePart + (extraPart * 0.1); // 90+10 becomes 91.0
              } else if (!isNaN(parseInt(match.time))) {
                return parseInt(match.time);
              }
            }
            // Fallback to statusText parsing
            if (match.statusText) {
              if (match.statusText.includes('+')) {
                const parts = match.statusText.split('+');
                const basePart = parseInt(parts[0]) || 0;
                const extraPart = parseInt(parts[1]) || 0;
                return basePart + (extraPart * 0.1);
              } else {
                const minuteMatch = match.statusText.match(/\d+/);
                return minuteMatch ? parseInt(minuteMatch[0]) : 0;
              }
            }
            return 0;
          };
          
          const minuteA = getMatchMinute(a);
          const minuteB = getMatchMinute(b);
          
          // ✅ PRIMARY SORT: By match progression (higher minutes first)
          if (minuteA !== minuteB) {
            return minuteB - minuteA; // 90+10 before 12', 12' before 6'
          }
          
          // If same minute, fall through to league priority
        }

        const statusPriority = { 'live': 1, 'upcoming': 2, 'finished': 3 };
        const statusDiff = (statusPriority[a.status] || 4) - (statusPriority[b.status] || 4);
        if (statusDiff !== 0) return statusDiff;

        const leaguePriority = (league: string): number => {
          const priorities = {
            'UEFA Champions League': 1, 'Premier League': 2, 'La Liga': 3, 'Bundesliga': 4, 'Serie A': 5, 'Ligue 1': 6,
            'Europa League': 7, 'Europa Conference League': 8,
            'Eredivisie': 9, 'Primeira Liga': 10, 'Belgium Pro League': 11,
            'Uganda Premier League': 12, 'MLS': 13, 'NBA': 14,
            'Default': 999
          };
          
          for (const [key, priority] of Object.entries(priorities)) {
            if (league.toLowerCase().includes(key.toLowerCase())) {
              return priority;
            }
          }
          return priorities['Default'];
        };

        const leaguePriorityDiff = leaguePriority(a.league) - leaguePriority(b.league);
        if (leaguePriorityDiff !== 0) return leaguePriorityDiff;

        const timeA = new Date(a.startTime).getTime();
        const timeB = new Date(b.startTime).getTime();
        
        if (a.status === 'finished') {
          return timeB - timeA;
        } else {
          return timeA - timeB;
        }
    });
  }, []);

  const sortedMatches = useMemo(() => sortTopMatches(matches), [matches, sortTopMatches]);

  // ✅ STABLE REFRESH: No layout changes
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTopMatches();
    setRefreshing(false);
  }, [loadTopMatches]);

  // ✅ INSTANT FAVORITE TOGGLE: No layout shifts
  const toggleFavorite = useCallback(async (matchId: string) => {
    try {
      if (!matchId || typeof matchId !== 'string' || matchId.trim() === '') {
        return;
      }

      const match = matches.find(m => m.id === matchId);
      if (!match || !match.home?.name || !match.away?.name) {
        return;
      }

      const originalFavoriteStatus = match.isFavorite;
      const targetFavoriteStatus = !originalFavoriteStatus;

      // ✅ INSTANT UI UPDATE: Immediate visual feedback
      setMatches(prevMatches =>
        prevMatches.map(m =>
          m.id === matchId ? { ...m, isFavorite: targetFavoriteStatus } : m
        )
      );

      // Perform backend operation
      const success = originalFavoriteStatus 
        ? await removeFavorite(matchId)
        : await addFavorite(match);

      if (success) {
        await refreshFavoritesCount();
      } else {
        // Revert on failure
        setMatches(prevMatches =>
          prevMatches.map(m =>
            m.id === matchId ? { ...m, isFavorite: originalFavoriteStatus } : m
          )
        );
      }

    } catch (error) {
      // Revert on error
      const match = matches.find(m => m.id === matchId);
      if (match) {
        setMatches(prevMatches =>
          prevMatches.map(m =>
            m.id === matchId ? { ...m, isFavorite: !m.isFavorite } : m
          )
        );
      }
    }
  }, [matches, addFavorite, removeFavorite, refreshFavoritesCount]);

  // ✅ INSTANT CATEGORY BUTTON: Zero delay response
  const renderCategoryButton = useCallback((category: TopCategory) => {
    const isSelected = selectedCategory === category.id;
    const IconComponent = category.icon;

    const selectedBackgroundColor = '#4A1A1A';
    const selectedTextColor = '#E74C3C';
    const selectedBorderColor = '#6B2B2B';

    return (
      <Pressable
        key={category.id}
        style={[
          styles.categoryButton,
          {
            backgroundColor: isSelected ? selectedBackgroundColor : theme.colors.backgroundSecondary,
            borderColor: isSelected ? selectedBorderColor : theme.colors.border,
          }
        ]}
        onPress={() => {
          // ✅ INSTANT CATEGORY CHANGE: No delays or animations
          setSelectedCategory(category.id);
        }}
        hitSlop={{top: 8, left: 8, bottom: 8, right: 8}}
      >
        <View style={styles.categoryButtonContent}>
          <IconComponent 
            size={20} 
            color={isSelected ? selectedTextColor : theme.colors.textSecondary} 
          />
          <Text style={[
            styles.categoryButtonText,
            { 
              color: isSelected ? selectedTextColor : theme.colors.text,
              textAlign: 'center',
            }
          ]}>
            {category.title}
          </Text>
          <Text style={[
            styles.categoryButtonDescription,
            { 
              color: isSelected ? 'rgba(231, 76, 60, 0.8)' : theme.colors.textSecondary,
              textAlign: 'center',
            }
          ]}>
            {category.description}
          </Text>
        </View>
      </Pressable>
    );
  }, [selectedCategory, theme.colors]);

  // ✅ INSTANT TAB BUTTON: Zero delay response
  const renderTabButton = useCallback((tab: TabButton) => {
    const IconComponent = tab.icon;
    
    return (
      <Pressable
        key={tab.key}
        style={styles.tabButton}
        onPress={() => handleTabPress(tab.route)}
        hitSlop={{top: 8, left: 8, bottom: 8, right: 8}}
      >
        <View style={styles.tabButtonContent}>
          <IconComponent 
            size={24} 
            color={theme.colors.textSecondary} 
            strokeWidth={1.8}
          />
          <Text style={[
            styles.tabButtonText, 
            { 
              color: theme.colors.textSecondary,
              textAlign: 'center',
            }
          ]}>
            {tab.title}
          </Text>
        </View>
      </Pressable>
    );
  }, [theme.colors, handleTabPress]);

  // ✅ STABLE OFF-SEASON NOTICE: Fixed layout
  const renderOffSeasonNotice = useCallback(() => {
    const getLeagueInfo = () => {
      switch (selectedCategory) {
        case 'uganda':
          return {
            league: 'Uganda Premier League',
            season: '2024/25 season',
            message: 'The Uganda Premier League is currently in off-season break.',
            comingSoon: 'New season matches coming soon!'
          };
        case 'premier':
          return {
            league: 'Premier League',
            season: '2024/25 season',
            message: 'The Premier League is currently in off-season break.',
            comingSoon: 'New season matches coming soon!'
          };
        case 'champions':
          return {
            league: 'Champions League',
            season: '2024/25 season',
            message: 'The Champions League is currently in off-season break.',
            comingSoon: 'Competition resumes soon!'
          };
        case 'nba':
          return {
            league: 'NBA',
            season: '2024/25 season',
            message: 'The NBA is currently in off-season break.',
            comingSoon: 'New season starts soon!'
          };
        default:
          return {
            league: 'League',
            season: 'Current season',
            message: 'This league is currently in off-season break.',
            comingSoon: 'Matches coming soon!'
          };
      }
    };

    const { league, season, message, comingSoon } = getLeagueInfo();

    return (
      <View style={styles.offSeasonContainer}>
        <View style={[styles.offSeasonCard, { backgroundColor: theme.colors.backgroundSecondary }]}>
          <Trophy size={48} color={theme.colors.primary} />
          <Text style={[styles.offSeasonTitle, { color: theme.colors.text }]}>
            {league}
          </Text>
          <Text style={[styles.offSeasonMessage, { color: theme.colors.textSecondary }]}>
            {message}
          </Text>
          <View style={[styles.comingSoonBadge, { backgroundColor: theme.colors.primary + '20' }]}>
            <Text style={[styles.comingSoonText, { color: theme.colors.primary }]}>
              {comingSoon}
            </Text>
          </View>
          <Text style={[styles.seasonText, { color: theme.colors.textSecondary }]}>
            {season}
          </Text>
        </View>
      </View>
    );
  }, [selectedCategory, theme.colors]);

  // ✅ STABLE MATCH STATISTICS: No layout changes
  const getMatchStats = useCallback(() => {
    const liveCount = matches.filter(m => m.status === 'live').length;
    const upcomingCount = matches.filter(m => m.status === 'upcoming').length;
    const finishedCount = matches.filter(m => m.status === 'finished').length;

    return {
      liveCount,
      upcomingCount,
      finishedCount,
      totalCount: matches.length
    };
  }, [matches]);

  const matchStats = useMemo(() => getMatchStats(), [getMatchStats]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.backgroundSecondary }]}>
      <StatusBar barStyle={theme.colors.background === '#FFFFFF' ? 'dark-content' : 'light-content'} backgroundColor={theme.colors.backgroundSecondary} />
      
      {/* ✅ ABSOLUTE LAYOUT: Prevent any layout shifts */}
      <View style={styles.absoluteContainer}>
        
        {/* Sports Section - Absolute Position */}
        <View style={[styles.sportsSection, { backgroundColor: theme.colors.backgroundSecondary }]}>
          <SportsTabs
            active="important"
            onSelect={handleSportChange}
          />
        </View>

        {/* Categories Section - Absolute Position */}
        <View style={styles.categoriesWrapper}>
          <ScrollView 
            ref={scrollViewRef}
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesContainer}
            contentContainerStyle={styles.categoriesContent}
            decelerationRate="fast"
            scrollEventThrottle={16}
            bounces={false}
          >
            {topCategories.map(renderCategoryButton)}
          </ScrollView>
        </View>

        {/* Stats Bar - Absolute Position */}
        <View style={[styles.statsBar, { backgroundColor: theme.colors.backgroundSecondary }]}>
          <View style={styles.statGroup}>
            <View style={[styles.statBadge, { backgroundColor: theme.colors.primary + '20' }]}>
              <Play size={12} color={theme.colors.primary} />
              <Text style={[styles.statText, { color: theme.colors.primary }]}>
                {matchStats.liveCount} Live
              </Text>
            </View>
            
            <View style={[styles.statBadge, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
              <Clock size={12} color={theme.colors.textSecondary} />
              <Text style={[styles.statText, { color: theme.colors.textSecondary, fontWeight: '400' }]}>
                {matchStats.upcomingCount} Upcoming
              </Text>
            </View>
            
            <View style={[styles.statBadge, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
              <Flag size={12} color={theme.colors.textSecondary} />
              <Text style={[styles.statText, { color: theme.colors.textSecondary, fontWeight: '400' }]}>
                {matchStats.finishedCount} Finished
              </Text>
            </View>
          </View>
        </View>



        {/* Matches Section - Absolute Position */}
        <View style={[styles.matchesSection, { backgroundColor: theme.colors.background }]}>
          <ScrollView
            style={styles.matchesList}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={theme.colors.primary}
                colors={[theme.colors.primary]}
              />
            }
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            scrollEventThrottle={16}
            decelerationRate="fast"
            bounces={false}
          >
            {/* ✅ FIXED CONTENT: Consistent height always */}
            <View style={styles.contentContainer}>
              {sortedMatches.length === 0 ? (
                selectedCategory !== 'live' ? (
                  renderOffSeasonNotice()
                ) : (
                  <View style={styles.emptyContainer}>
                    <Trophy size={48} color={theme.colors.textSecondary} />
                    <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
                      Top Matches
                    </Text>
                    <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
                      {isLoading ? 'Loading top matches...' : 'No matches available'}
                    </Text>
                  </View>
                )
              ) : (
                <View style={styles.matchesContainer}>
                  {sortedMatches.map((match, index) => (
                    <MatchItem
                      key={`${match.id}-${index}`}
                      match={match}
                      onToggleFavorite={toggleFavorite}
                      onPress={handleMatchPress}
                    />
                  ))}
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </View>

      {/* ✅ FIXED BOTTOM TAB BAR: Absolute position */}
      <View style={[styles.bottomTabBar, { 
        backgroundColor: theme.colors.backgroundSecondary,
        borderTopColor: theme.colors.border 
      }]}>
        {tabButtons.map(renderTabButton)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  // ✅ ABSOLUTE LAYOUT: Prevent any layout shifts with absolute positioning
  absoluteContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 25, // Account for status bar
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  // ✅ ANTI-JUMPING: Fixed layout to prevent shifts
  fixedLayout: {
    flex: 1,
    position: 'relative',
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
    // ✅ FIXED HEIGHT: Prevent layout shifts
    height: 48,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 5,
  },
  categoriesWrapper: {
    position: 'absolute',
    top: 48,
    left: 0,
    right: 0,
    height: 100,
    zIndex: 4,
  },
  categoriesContainer: {
    height: 100,
  },
  categoriesContent: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    gap: 8,
    alignItems: 'center',
  },
  categoryButton: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 18,
    borderWidth: 1.5,
    minWidth: 140,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
    height: 80,
  },
  categoryButtonContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  categoryButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 2,
    fontWeight: '600',
  },
  categoryButtonDescription: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 12,
    opacity: 0.85,
    marginTop: 1,
    paddingHorizontal: 2,
  },
  statsBar: {
    position: 'absolute',
    top: 148,
    left: 0,
    right: 0,
    height: 48,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    zIndex: 3,
  },
  statGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  matchesSection: {
    position: 'absolute',
    top: 196,
    left: 0,
    right: 0,
    bottom: Platform.OS === 'ios' ? 84 : 70,
    zIndex: 2,
  },
  matchesList: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    minHeight: 300,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  matchesContainer: {
    paddingBottom: 20,
  },
  contentContainer: {
    minHeight: 400, // Consistent height always
  },
  bottomTabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    borderTopWidth: 1,
    height: Platform.OS === 'ios' ? 84 : 70,
    paddingBottom: Platform.OS === 'ios' ? 25 : 15,
    paddingTop: 8,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
    zIndex: 10,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 6,
    paddingHorizontal: 4,
    marginHorizontal: 2,
  },
  tabButtonContent: {
    alignItems: 'center',
    gap: 4,
  },
  tabButtonText: {
    fontSize: 11,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
    lineHeight: 13,
  },
  offSeasonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
    minHeight: 300,
  },
  offSeasonCard: {
    paddingVertical: 32,
    paddingHorizontal: 24,
    borderRadius: 20,
    alignItems: 'center',
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  offSeasonTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  offSeasonMessage: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  comingSoonBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginBottom: 12,
  },
  comingSoonText: {
    fontSize: 13,
    fontFamily: 'Inter-SemiBold',
    textAlign: 'center',
  },
  seasonText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    opacity: 0.7,
    },
  // ✅ ANTI-JUMPING: Fixed content height to prevent layout shifts
  fixedContentHeight: {
    minHeight: 300, // Ensure consistent height during loading
  },
});  