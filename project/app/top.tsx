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
  Animated,
  StatusBar,
  TouchableOpacity
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
import { fetchHotMatches } from '@/services/matchService';
import MatchItem from '@/components/MatchItem';
import SportsTabs from '@/components/SportsTabs';
import { useFavorites } from '@/hooks/useFavorites';
import MatchList from '@/components/MatchList';
import { fetchMatches } from '@/services/matchService';
import goalDetectionService from '@/services/goalDetectionService';
import { useMatchSettings } from '@/contexts/MatchSettingsContext';

const { width } = Dimensions.get('window');

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
  const [selectedCategory, setSelectedCategory] = useState('live');
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { addFavorite, removeFavorite } = useFavorites();
  const { showGoalNotification } = useMatchSettings();
  
  // ✨ BEAUTIFUL ENTRANCE: Modern app-style fade-in animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    // 🎨 TWITTER-STYLE ENTRANCE: Smooth fade-in on mount
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, []);

  // ✅ GOAL DETECTION AUTO-START: Ensure goal monitoring is active for live matches on Top screen
  useEffect(() => {
    console.log('🚨 TOP SCREEN: Ensuring goal detection is active for real-time alerts');
    
    if (!goalDetectionService.isMonitoringActive()) {
      goalDetectionService.startMonitoring();
      console.log('🔄 Goal detection service started from Top screen');
    }
    
    // Auto-refresh live matches every 30 seconds to catch score changes
    const liveMatchInterval = setInterval(async () => {
      try {
        const liveMatches = await fetchMatches('football', 'live');
        if (liveMatches.length > 0) {
          console.log(`🔄 Top screen auto-updating ${liveMatches.length} live matches for goal detection`);
          goalDetectionService.updateMatches(liveMatches);
        }
      } catch (error) {
        console.log('❌ Top screen error in auto-refresh for goal detection:', error);
      }
    }, 30000); // Every 30 seconds
    
    return () => {
      clearInterval(liveMatchInterval);
    };
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
      sport: 'all',
      description: 'Live top matches happening now'
    },
    {
      id: 'upcoming',
      title: 'Upcoming',
      icon: Clock,
      sport: 'all',
      description: 'Top upcoming matches'
    },
    {
      id: 'uganda',
      title: 'Uganda Premier League',
      icon: Trophy,
      sport: 'football',
      description: 'Uganda\'s top football league'
    },
    {
      id: 'premier',
      title: 'Premier League',
      icon: Trophy,
      sport: 'football',
      description: 'England\'s top football league'
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
      sport: 'all',
      description: 'Recent top match results'
    }
  ];

  // ✅ ZERO-JUMP Navigation (Completely immediate, no delays)
  const handleSportChange = (sport: string) => {
    if (sport !== 'important') {
      console.log(`⚡ INSTANT ZERO-JUMP: Top → Home with sport: ${sport}`);
      
      // ✅ BEAUTIFUL SPORTS NAVIGATION: Pass sport parameter to prevent jumping
      router.replace({
        pathname: '/(tabs)',
        params: { sport: sport }
      });
    }
  };

  // ✅ ZERO-JUMP TAB NAVIGATION
  const handleTabPress = (route: string) => {
    console.log(`⚡ INSTANT ZERO-JUMP tab: Top → ${route}`);
    
    // ✅ IMMEDIATE NAVIGATION - Remove setTimeout for instant response
    router.replace(route);
  };

  // ✅ COMPREHENSIVE TOP MATCHES FILTER: Include ALL countries' leagues and international matches
  const isTopMatch = (match: any): boolean => {
    const league = match.league?.toLowerCase() || '';
    const country = match.country?.toLowerCase() || '';
    const homeTeam = match.home?.name?.toLowerCase() || '';
    const awayTeam = match.away?.name?.toLowerCase() || '';
    
    // ✅ INTERNATIONAL COMPETITIONS (ALL should be included)
    const internationalKeywords = [
      'world cup', 'euro', 'copa america', 'afcon', 'asian cup', 'afc', 'uefa',
      'nations league', 'confederation cup', 'olympics', 'olympic', 'continental',
      'international', 'friendly', 'qualifier', 'qualification', 'qualifying',
      'under-21', 'under-20', 'under-19', 'under-17', 'under-16', 'u21', 'u20', 'u19', 'u17', 'u16',
      'youth', 'junior', 'women', 'female', 'ladies', 'feminino', 'femminile',
      'champions league', 'europa league', 'europa conference', 'libertadores', 'sudamericana',
      'caf champions', 'caf confederation', 'concacaf', 'asian champions', 'oceania',
      'club world cup', 'intercontinental', 'super cup', 'supercup', 'uefa super'
    ];
    
    // ✅ LEAGUE KEYWORDS (ANY league from ANY country)
    const leagueKeywords = [
      'league', 'liga', 'serie', 'division', 'bundesliga', 'ligue', 'premier',
      'primera', 'segunda', 'tercera', 'championship', 'superliga', 'premiership',
      'primera división', 'segunda división', 'pro league', 'super league',
      'national league', 'regional league', 'state league', 'provincial league',
      // ✅ ASIAN SPECIFIC LEAGUES (for matches like in screenshot)
      '超', '甲', '乙', '丙', '联赛', 'j联赛', 'k联赛', 'chinese super', 'lebanon', 'lebanese'
    ];
    
    // ✅ CUP KEYWORDS (ANY cup from ANY country)
    const cupKeywords = [
      'cup', 'copa', 'coupe', 'pokal', 'trophy', 'trofeo', 'trophée',
      'championship', 'tournoi', 'torneo', 'tournament', 'competition',
      'kings cup', 'fa cup', 'league cup', 'capital one', 'carabao',
      'dfb pokal', 'coppa italia', 'coupe de france', 'copa del rey',
      'scottish cup', 'irish cup', 'welsh cup', 'community shield',
      // ✅ ASIAN SPECIFIC CUPS (for matches like in screenshot)
      '杯', '总统杯', '亚洲杯', '越南杯', '马总统杯', 'asian cup', 'vietnam cup', 'malaysia cup'
    ];
    
    // ✅ MAJOR COUNTRIES WITH MULTIPLE TIERS
    const majorCountriesLeagues = {
      // UK (England, Scotland, Wales, Northern Ireland)
      'england': ['premier league', 'championship', 'league one', 'fa cup', 'league cup', 'community shield'],
      'scotland': ['premiership', 'championship', 'league one', 'scottish cup', 'league cup'],
      'wales': ['premier league', 'championship', 'welsh cup', 'welsh league'],
      
      // Germany
      'germany': ['bundesliga', '2. bundesliga', '3. liga', 'dfb pokal', 'supercup'],
      'deutschland': ['bundesliga', '2. bundesliga', '3. liga', 'dfb pokal'],
      
      // Spain
      'spain': ['la liga', 'segunda', 'segunda división', 'copa del rey', 'supercopa'],
      'españa': ['primera', 'segunda', 'copa del rey', 'supercopa'],
      
      // Italy
      'italy': ['serie a', 'serie b', 'coppa italia', 'supercoppa italiana'],
      'italia': ['serie a', 'serie b', 'coppa italia', 'supercoppa'],
      
      // France
      'france': ['ligue 1', 'ligue 2', 'championnat national', 'coupe de france', 'coupe de la ligue'],
      
      // Other major countries
      'brazil': ['série a', 'série b', 'série c', 'copa do brasil', 'supercopa'],
      'argentina': ['primera división', 'primera b', 'copa argentina', 'supercopa'],
      'netherlands': ['eredivisie', 'eerste divisie', 'knvb beker'],
      'portugal': ['primeira liga', 'segunda liga', 'taça de portugal'],
      'russia': ['premier league', 'first league', 'cup of russia'],
      'turkey': ['süper lig', 'tff first league', 'turkish cup'],
      'mexico': ['liga mx', 'ascenso mx', 'copa mx'],
      'usa': ['mls', 'usl championship', 'us open cup'],
      'japan': ['j1 league', 'j2 league', 'j3 league', 'emperor cup'],
      'south korea': ['k league 1', 'k league 2', 'fa cup'],
      'china': ['super league', 'league one', 'fa cup'],
      'australia': ['a-league', 'ffa cup', 'npl'],
      'india': ['super league', 'i-league', 'federation cup']
    };
    
    // ✅ CHECK INTERNATIONAL MATCHES
    const isInternational = internationalKeywords.some(keyword => 
      league.includes(keyword) || 
      homeTeam.includes(keyword) || 
      awayTeam.includes(keyword) ||
      match.tournament?.toLowerCase().includes(keyword)
    );
    
    // ✅ CHECK LEAGUE MATCHES (ANY country's league)
    const isLeague = leagueKeywords.some(keyword => league.includes(keyword));
    
    // ✅ CHECK CUP MATCHES (ANY country's cup)
    const isCup = cupKeywords.some(keyword => league.includes(keyword));
    
    // ✅ CHECK MAJOR COUNTRIES SPECIFIC LEAGUES
    const isMajorCountryMatch = Object.entries(majorCountriesLeagues).some(([countryName, leagues]) => {
      const isFromCountry = country.includes(countryName) || league.includes(countryName);
      const isTopTierInCountry = leagues.some(leagueName => league.includes(leagueName));
      return isFromCountry && isTopTierInCountry;
    });
    
    // ✅ SPECIAL CHECKS FOR SPECIFIC REGIONS
    
    // African competitions and leagues
    const isAfricanMatch = league.includes('caf') || 
                          country.includes('africa') || 
                          league.includes('african') ||
                          ['egypt', 'morocco', 'tunisia', 'algeria', 'nigeria', 'ghana', 'cameroon', 
                           'senegal', 'ivory coast', 'south africa', 'uganda', 'kenya', 'tanzania',
                           'ethiopia', 'zambia', 'zimbabwe', 'mali', 'burkina faso'].some(africanCountry => 
                            country.includes(africanCountry) || league.includes(africanCountry));
    
    // Asian competitions and leagues
    const isAsianMatch = league.includes('afc') || 
                        league.includes('asian') ||
                        country.includes('asia') ||
                        ['china', 'japan', 'south korea', 'thailand', 'vietnam', 'malaysia', 'singapore',
                         'indonesia', 'philippines', 'india', 'saudi arabia', 'uae', 'qatar', 'iran',
                         'iraq', 'lebanon', 'jordan', 'uzbekistan', 'kazakhstan'].some(asianCountry => 
                          country.includes(asianCountry) || league.includes(asianCountry));
    
    // American competitions and leagues
    const isAmericanMatch = league.includes('concacaf') || 
                           league.includes('conmebol') ||
                           ['usa', 'canada', 'mexico', 'brazil', 'argentina', 'chile', 'colombia',
                            'uruguay', 'peru', 'ecuador', 'venezuela', 'bolivia', 'paraguay'].some(americanCountry => 
                             country.includes(americanCountry) || league.includes(americanCountry));
    
    // European competitions and leagues (comprehensive)
    const isEuropeanMatch = league.includes('uefa') || 
                           ['england', 'spain', 'italy', 'germany', 'france', 'netherlands', 'portugal',
                            'belgium', 'scotland', 'turkey', 'russia', 'ukraine', 'poland', 'czech',
                            'austria', 'switzerland', 'denmark', 'sweden', 'norway', 'croatia',
                            'serbia', 'greece', 'romania', 'bulgaria', 'hungary', 'slovakia'].some(europeanCountry => 
                             country.includes(europeanCountry) || league.includes(europeanCountry));
    
    console.log(`🏆 MATCH ANALYSIS: ${match.home?.name} vs ${match.away?.name}`);
    console.log(`   League: "${league}"`);
    console.log(`   Country: "${country}"`);
    console.log(`   International: ${isInternational}, League: ${isLeague}, Cup: ${isCup}`);
    console.log(`   Major Country: ${isMajorCountryMatch}, African: ${isAfricanMatch}, Asian: ${isAsianMatch}`);
    console.log(`   American: ${isAmericanMatch}, European: ${isEuropeanMatch}`);
    
    // ✅ INCLUDE ALL QUALIFYING MATCHES
    return isInternational || 
           isLeague || 
           isCup || 
           isMajorCountryMatch || 
           isAfricanMatch || 
           isAsianMatch || 
           isAmericanMatch || 
           isEuropeanMatch;
  };

  // ✅ INSTANT match loading with zero delays
  const loadTopMatches = useCallback(async () => {
    try {
      console.log(`⚡ INSTANT CATEGORY SWITCH: ${selectedCategory}`);
      
      // ✅ NO LOADING STATE - Instant display with pre-cached data
      const allMatches = await fetchHotMatches(selectedCategory as 'live' | 'upcoming' | 'premier' | 'champions' | 'nba' | 'finished' | 'uganda');
      
      // ✅ FILTER FOR TOP MATCHES ONLY: Elite leagues, top countries, international matches
      const shouldFilterTopMatches = ['live', 'upcoming', 'finished'].includes(selectedCategory);
      const topMatches = shouldFilterTopMatches 
        ? allMatches.filter(isTopMatch) 
        : allMatches; // League-specific categories show all matches from that league
      
      console.log(`🏆 TOP MATCHES FILTER: ${topMatches.length} top-tier matches from ${allMatches.length} total matches (Category: ${selectedCategory})`);
      
      // ✅ FOR LIVE MATCHES: If filtered results are too few, show more matches
      const hotMatches = selectedCategory === 'live' && topMatches.length < 5 
        ? allMatches // Show ALL live matches if top filter gives too few results
        : topMatches;
      
      console.log(`🔴 LIVE MATCHES FINAL: ${hotMatches.length} matches will be displayed (Original: ${allMatches.length}, Top: ${topMatches.length})`);

      // ✅ LIVE NOW CHRONOLOGICAL SORTING - Early matches first, latest matches last
      hotMatches.sort((a, b) => {
        const statusOrder = { 'live': 1, 'upcoming': 2, 'finished': 3 };
        const statusDiff = (statusOrder[a.status] || 4) - (statusOrder[b.status] || 4);
        
        if (statusDiff !== 0) return statusDiff;
        
        // ✅ LIVE MATCHES: Sort by start time (early matches at top)
        if (a.status === 'live' && b.status === 'live') {
          const timeA = new Date(a.startTime).getTime();
          const timeB = new Date(b.startTime).getTime();
          console.log(`🔴 LIVE SORTING: ${a.home.name} vs ${a.away.name} (${new Date(a.startTime).toLocaleTimeString()}) vs ${b.home.name} vs ${b.away.name} (${new Date(b.startTime).toLocaleTimeString()})`);
          return timeA - timeB; // Earlier matches first (chronological order)
        }
        
        // For non-live matches, sort by league priority then time
        const leaguePriority = (league: string): number => {
          if (league.includes('Premier League')) return 1;
          if (league.includes('Champions')) return 2;
          if (league.includes('La Liga')) return 3;
          if (league.includes('NBA')) return 1;
          if (league.includes('Serie A')) return 4;
          if (league.includes('Bundesliga')) return 5;
          return 10;
        };
        
        const leagueDiff = leaguePriority(a.league) - leaguePriority(b.league);
        if (leagueDiff !== 0) return leagueDiff;
        
        // Within same league, sort by time
        const timeA = new Date(a.startTime).getTime();
        const timeB = new Date(b.startTime).getTime();
        return timeA - timeB; // Chronological order
      });

      // ✅ INSTANT STATE UPDATE - Zero delay display
      setMatches(hotMatches);
      setLoading(false); // Always set loading to false immediately
      console.log(`⚡ INSTANT LOADED ${hotMatches.length} matches for: ${selectedCategory}`);
      
    } catch (error) {
      console.error('Error loading top matches:', error);
      setMatches([]);
      setLoading(false); // Ensure loading is always false
    }
  }, [selectedCategory]);

  useEffect(() => {
    // ✅ INSTANT DATA LOAD - no delays
    loadTopMatches();
  }, [selectedCategory]); // Only depend on category change for faster updates

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTopMatches();
    setRefreshing(false);
  };

  const toggleFavorite = async (matchId: string) => {
    try {
      const match = matches.find(m => m.id === matchId);
      if (!match) return;

      if (match.isFavorite) {
        await removeFavorite(matchId);
      } else {
        await addFavorite(match);
      }

      setMatches(prev => 
        prev.map(m => 
          m.id === matchId 
            ? { ...m, isFavorite: !m.isFavorite } 
            : m
        )
      );
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const renderCategoryButton = (category: TopCategory) => {
    const isSelected = selectedCategory === category.id;
    const IconComponent = category.icon;

    return (
      <Pressable
        key={category.id}
        style={[
          styles.categoryButton,
          {
            backgroundColor: isSelected ? theme.colors.primary : theme.colors.backgroundSecondary,
            borderColor: isSelected ? theme.colors.primary : theme.colors.border,
            shadowColor: isSelected ? theme.colors.primary : '#000',
            shadowOffset: { width: 0, height: isSelected ? 6 : 4 },
            shadowOpacity: isSelected ? 0.25 : 0.15,
            shadowRadius: isSelected ? 8 : 6,
            elevation: isSelected ? 8 : 6,
          }
        ]}
        onPress={() => {
          console.log('⚡ INSTANT CATEGORY:', category.id);
          
          // ✅ IMMEDIATE CATEGORY CHANGE - no animations, no delays
          setSelectedCategory(category.id);
        }}
      >
        <View style={styles.categoryButtonContent}>
          <IconComponent 
            size={20} 
            color={isSelected ? '#FFFFFF' : theme.colors.textSecondary} 
          />
          <Text style={[
            styles.categoryButtonText,
            { 
              color: isSelected ? '#FFFFFF' : theme.colors.text,
              textAlign: 'center',
            }
          ]}>
            {category.title}
          </Text>
          <Text style={[
            styles.categoryButtonDescription,
            { 
              color: isSelected ? 'rgba(255,255,255,0.8)' : theme.colors.textSecondary,
              textAlign: 'center',
            }
          ]}>
            {category.description}
          </Text>
        </View>
      </Pressable>
    );
  };

  const renderTabButton = (tab: TabButton) => {
    const IconComponent = tab.icon;
    
    return (
      <Pressable
        key={tab.key}
        style={[
          styles.tabButton,
          { 
            backgroundColor: 'transparent',
            borderRadius: 12,
          }
        ]}
        onPress={() => handleTabPress(tab.route)}
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
  };

  // ✅ Off-season announcement component
  const renderOffSeasonNotice = () => {
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
  };

  // ✅ TOP MATCH COUNTS: Get upcoming and finished top matches for stats
  const getTopMatchCounts = useCallback(async () => {
    try {
      // Get upcoming top matches
      const upcomingMatches = await fetchHotMatches('upcoming');
      
      // Get finished top matches  
      const finishedMatches = await fetchHotMatches('finished');
      
      return {
        upcomingCount: upcomingMatches.length,
        finishedCount: finishedMatches.length
      };
    } catch (error) {
      console.error('Error fetching top match counts:', error);
      return { upcomingCount: 0, finishedCount: 0 };
    }
  }, []);

  // ✅ ENHANCED MATCH STATS: Include upcoming and finished top match counts
  const getMatchStats = () => {
    const liveCount = matches.filter(m => m.status === 'live').length;
    const upcomingCount = matches.filter(m => m.status === 'upcoming').length;
    const finishedCount = matches.filter(m => m.status === 'finished').length;

    return {
      liveCount,
      upcomingCount,
      finishedCount,
      totalCount: matches.length
    };
  };

  // ✅ STATE FOR TOP MATCH COUNTS
  const [topMatchCounts, setTopMatchCounts] = useState({ upcomingCount: 0, finishedCount: 0 });

  // ✅ LOAD TOP MATCH COUNTS ON MOUNT
  useEffect(() => {
    const loadCounts = async () => {
      const counts = await getTopMatchCounts();
      setTopMatchCounts(counts);
      console.log('🏆 TOP MATCH COUNTS:', counts);
    };
    loadCounts();
  }, [getTopMatchCounts]);

  const matchStats = getMatchStats();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.backgroundSecondary }]}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <Animated.View style={[{ flex: 1 }, { opacity: fadeAnim }]}>
        <View style={[styles.sportsSection, { backgroundColor: theme.colors.backgroundSecondary }]}>
          <SportsTabs
            active="important"
            onSelect={handleSportChange}
          />
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
          contentContainerStyle={styles.categoriesContent}
        >
          {topCategories.map(renderCategoryButton)}
        </ScrollView>

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
                <Text style={[styles.statText, { color: '#FFFFFF', fontWeight: '600' }]}>
                  {topMatchCounts.upcomingCount}
                </Text>
                {' '}Upcoming
              </Text>
            </View>
            
            <View style={[styles.statBadge, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
              <Flag size={12} color={theme.colors.textSecondary} />
              <Text style={[styles.statText, { color: theme.colors.textSecondary, fontWeight: '400' }]}>
                <Text style={[styles.statText, { color: '#FFFFFF', fontWeight: '600' }]}>
                  {topMatchCounts.finishedCount}
                </Text>
                {' '}Finished
              </Text>
            </View>
          </View>
        </View>

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
          >
            {matches.length === 0 ? (
              selectedCategory !== 'live' ? renderOffSeasonNotice() : (
                <View style={styles.emptyContainer}>
                  <Trophy size={48} color={theme.colors.textSecondary} />
                  <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
                    No Live Matches
                  </Text>
                  <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
                    Try refreshing or check again later
                  </Text>
                </View>
              )
            ) : (
              <View style={styles.matchesContainer}>
                {matches.map((match, index) => (
                  <MatchItem
                    key={`${match.id}-${index}`}
                    match={match}
                    onToggleFavorite={toggleFavorite}
                    showLeague={true}
                  />
                ))}
              </View>
            )}
          </ScrollView>
        </View>
        </Animated.View>
      </SafeAreaView>

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
  categoriesContainer: {
    maxHeight: 100,
    marginVertical: 4,
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
    minHeight: 80,
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
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
    flex: 1,
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
    paddingBottom: 100,
  },
  bottomTabBar: {
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
}); 