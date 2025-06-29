import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  Platform,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { 
  ChevronLeft, 
  Search,
  Filter,
  Calendar,
  Clock,
  Trophy,
  Target,
  Flag,
  Settings,
  ChevronRight,
  ChevronDown,
  Star,
  Play
} from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';

interface MatchResult {
  id: string;
  competition: string;
  date: string;
  time: string;
  homeTeam: {
    name: string;
    logo: string;
    score: number;
    scorers?: string[];
  };
  awayTeam: {
    name: string;
    logo: string;
    score: number;
    scorers?: string[];
  };
  status: 'FT' | 'HT' | 'LIVE' | 'UPCOMING';
  hasHighlights: boolean;
  hasStats: boolean;
  isFavorite: boolean;
}

export default function ResultsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('Today');
  const [expandedResult, setExpandedResult] = useState<string | null>(null);

  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'football', label: 'Football' },
    { id: 'basketball', label: 'Basketball' },
    { id: 'rugby', label: 'Rugby' },
    { id: 'boxing', label: 'Boxing' }
  ];

  const dateOptions = [
    'Today', 'Yesterday', 'This Week', 'Last Week', 'This Month'
  ];

  const matchResults: MatchResult[] = [
    {
      id: '1',
      competition: 'Premier League',
      date: '2024-01-15',
      time: '19:45',
      homeTeam: {
        name: 'Arsenal',
        logo: 'https://images.pexels.com/photos/274506/pexels-photo-274506.jpeg',
        score: 3,
        scorers: ['Saka (23\')', 'Ødegaard (45\')', 'Martinelli (78\')']
      },
      awayTeam: {
        name: 'Manchester City',
        logo: 'https://images.pexels.com/photos/1884574/pexels-photo-1884574.jpeg',
        score: 1,
        scorers: ['Haaland (56\')']
      },
      status: 'FT',
      hasHighlights: true,
      hasStats: true,
      isFavorite: true
    },
    {
      id: '2',
      competition: 'NBA',
      date: '2024-01-15',
      time: '20:30',
      homeTeam: {
        name: 'Lakers',
        logo: 'https://images.pexels.com/photos/1752757/pexels-photo-1752757.jpeg',
        score: 112,
        scorers: ['James (32 pts)', 'Davis (28 pts)', 'Reaves (18 pts)']
      },
      awayTeam: {
        name: 'Warriors',
        logo: 'https://images.pexels.com/photos/1618200/pexels-photo-1618200.jpeg',
        score: 106,
        scorers: ['Curry (35 pts)', 'Thompson (22 pts)', 'Green (12 pts)']
      },
      status: 'FT',
      hasHighlights: true,
      hasStats: true,
      isFavorite: false
    },
    {
      id: '3',
      competition: 'Champions League',
      date: '2024-01-16',
      time: '20:00',
      homeTeam: {
        name: 'Real Madrid',
        logo: 'https://images.pexels.com/photos/274506/pexels-photo-274506.jpeg',
        score: 2,
        scorers: ['Vinicius Jr. (34\')', 'Bellingham (67\')']
      },
      awayTeam: {
        name: 'Bayern Munich',
        logo: 'https://images.pexels.com/photos/1884574/pexels-photo-1884574.jpeg',
        score: 2,
        scorers: ['Kane (12\')', 'Musiala (89\')']
      },
      status: 'FT',
      hasHighlights: true,
      hasStats: true,
      isFavorite: true
    }
  ];

  const toggleResultExpansion = (resultId: string) => {
    setExpandedResult(expandedResult === resultId ? null : resultId);
  };

  const toggleFavorite = (resultId: string) => {
    // In a real app, this would update the state
    console.log(`Toggle favorite for result ${resultId}`);
  };

  const viewHighlights = (resultId: string) => {
    // In a real app, this would navigate to highlights
    console.log(`View highlights for result ${resultId}`);
  };

  const viewStats = (resultId: string) => {
    // In a real app, this would navigate to stats
    console.log(`View stats for result ${resultId}`);
  };

  const renderHeader = () => (
    <View style={[styles.header, { backgroundColor: theme.colors.backgroundSecondary }]}>
      <TouchableOpacity 
        onPress={() => router.back()} 
        style={styles.backButton}
        activeOpacity={0.7}
      >
        <ChevronLeft size={28} color={theme.colors.text} />
      </TouchableOpacity>
      <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Results</Text>
      <TouchableOpacity style={styles.settingsButton} activeOpacity={0.7}>
        <Settings size={24} color={theme.colors.text} />
      </TouchableOpacity>
    </View>
  );

  const renderTabs = () => (
    <View style={[styles.tabContainer, { backgroundColor: theme.colors.backgroundSecondary }]}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabScrollContent}
      >
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tab,
              activeTab === tab.id && { borderBottomColor: theme.colors.primary }
            ]}
            onPress={() => setActiveTab(tab.id)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText,
                { color: theme.colors.textSecondary },
                activeTab === tab.id && { color: theme.colors.primary }
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderSearchAndFilter = () => (
    <View style={styles.searchFilterContainer}>
      <View style={[styles.searchContainer, { backgroundColor: theme.colors.backgroundSecondary }]}>
        <Search size={20} color={theme.colors.textSecondary} />
        <TextInput
          style={[
            styles.searchInput,
            { 
              color: theme.colors.text,
              ...Platform.select({ web: { outlineStyle: 'none' } })
            }
          ]}
          placeholder="Search results..."
          placeholderTextColor={theme.colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      
      <TouchableOpacity 
        style={[styles.filterButton, { backgroundColor: theme.colors.backgroundSecondary }]}
        activeOpacity={0.7}
      >
        <Filter size={20} color={theme.colors.text} />
      </TouchableOpacity>
    </View>
  );

  const renderDateSelector = () => (
    <View style={styles.dateSelectorContainer}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dateOptions}
      >
        {dateOptions.map((date) => (
          <TouchableOpacity
            key={date}
            style={[
              styles.dateOption,
              {
                backgroundColor: selectedDate === date ? theme.colors.primary : theme.colors.backgroundSecondary,
              }
            ]}
            onPress={() => setSelectedDate(date)}
            activeOpacity={0.7}
          >
            <Calendar 
              size={16} 
              color={selectedDate === date ? '#FFFFFF' : theme.colors.text} 
            />
            <Text
              style={[
                styles.dateOptionText,
                {
                  color: selectedDate === date ? '#FFFFFF' : theme.colors.text,
                }
              ]}
            >
              {date}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderResultCard = (result: MatchResult) => (
    <View
      key={result.id}
      style={[styles.resultCard, { backgroundColor: theme.colors.backgroundSecondary }]}
    >
      <View style={styles.resultHeader}>
        <View style={styles.competitionInfo}>
          <Text style={[styles.competitionText, { color: theme.colors.text }]}>
            {result.competition}
          </Text>
          <View style={styles.dateTimeContainer}>
            <Calendar size={12} color={theme.colors.textSecondary} />
            <Text style={[styles.dateTimeText, { color: theme.colors.textSecondary }]}>
              {result.date}
            </Text>
            <Clock size={12} color={theme.colors.textSecondary} />
            <Text style={[styles.dateTimeText, { color: theme.colors.textSecondary }]}>
              {result.time}
            </Text>
          </View>
        </View>
        
        <TouchableOpacity
          onPress={() => toggleFavorite(result.id)}
          style={styles.favoriteButton}
          activeOpacity={0.7}
        >
          <Star 
            size={20} 
            color={result.isFavorite ? '#FFD700' : theme.colors.textSecondary} 
            fill={result.isFavorite ? '#FFD700' : 'none'} 
          />
        </TouchableOpacity>
      </View>
      
      <View style={styles.matchResult}>
        <View style={styles.teamContainer}>
          <Image source={{ uri: result.homeTeam.logo }} style={styles.teamLogo} />
          <Text style={[styles.teamName, { color: theme.colors.text }]} numberOfLines={1}>
            {result.homeTeam.name}
          </Text>
        </View>
        
        <View style={styles.scoreContainer}>
          <Text style={[styles.score, { color: theme.colors.text }]}>
            {result.homeTeam.score} - {result.awayTeam.score}
          </Text>
          <Text style={[styles.status, { color: theme.colors.primary }]}>
            {result.status}
          </Text>
        </View>
        
        <View style={styles.teamContainer}>
          <Image source={{ uri: result.awayTeam.logo }} style={styles.teamLogo} />
          <Text style={[styles.teamName, { color: theme.colors.text }]} numberOfLines={1}>
            {result.awayTeam.name}
          </Text>
        </View>
      </View>
      
      <View style={styles.resultActions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.colors.background }]}
          onPress={() => toggleResultExpansion(result.id)}
          activeOpacity={0.7}
        >
          <Target size={16} color={theme.colors.text} />
          <Text style={[styles.actionButtonText, { color: theme.colors.text }]}>
            Details
          </Text>
          {expandedResult === result.id ? (
            <ChevronDown size={16} color={theme.colors.text} />
          ) : (
            <ChevronRight size={16} color={theme.colors.text} />
          )}
        </TouchableOpacity>
        
        {result.hasHighlights && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.background }]}
            onPress={() => viewHighlights(result.id)}
            activeOpacity={0.7}
          >
            <Play size={16} color={theme.colors.text} fill={theme.colors.text} />
            <Text style={[styles.actionButtonText, { color: theme.colors.text }]}>
              Highlights
            </Text>
          </TouchableOpacity>
        )}
        
        {result.hasStats && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.background }]}
            onPress={() => viewStats(result.id)}
            activeOpacity={0.7}
          >
            <Trophy size={16} color={theme.colors.text} />
            <Text style={[styles.actionButtonText, { color: theme.colors.text }]}>
              Stats
            </Text>
          </TouchableOpacity>
        )}
      </View>
      
      {expandedResult === result.id && (
        <View style={styles.expandedContent}>
          <View style={styles.scorersContainer}>
            <View style={styles.teamScorers}>
              <Text style={[styles.scorersTitle, { color: theme.colors.text }]}>
                {result.homeTeam.name} Scorers:
              </Text>
              {result.homeTeam.scorers?.map((scorer, index) => (
                <Text key={index} style={[styles.scorerText, { color: theme.colors.textSecondary }]}>
                  • {scorer}
                </Text>
              ))}
            </View>
            
            <View style={styles.teamScorers}>
              <Text style={[styles.scorersTitle, { color: theme.colors.text }]}>
                {result.awayTeam.name} Scorers:
              </Text>
              {result.awayTeam.scorers?.map((scorer, index) => (
                <Text key={index} style={[styles.scorerText, { color: theme.colors.textSecondary }]}>
                  • {scorer}
                </Text>
              ))}
            </View>
          </View>
          
          <View style={styles.matchStats}>
            <Text style={[styles.matchStatsTitle, { color: theme.colors.text }]}>
              Match Stats
            </Text>
            
            <View style={styles.statRow}>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>58%</Text>
              <View style={styles.statBarContainer}>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                  Possession
                </Text>
                <View style={styles.statBar}>
                  <View 
                    style={[
                      styles.statBarFill, 
                      { 
                        width: '58%',
                        backgroundColor: theme.colors.primary 
                      }
                    ]} 
                  />
                  <View 
                    style={[
                      styles.statBarFill, 
                      { 
                        width: '42%',
                        backgroundColor: '#42A5F5' 
                      }
                    ]} 
                  />
                </View>
              </View>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>42%</Text>
            </View>
            
            <View style={styles.statRow}>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>12</Text>
              <View style={styles.statBarContainer}>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                  Shots
                </Text>
                <View style={styles.statBar}>
                  <View 
                    style={[
                      styles.statBarFill, 
                      { 
                        width: '60%',
                        backgroundColor: theme.colors.primary 
                      }
                    ]} 
                  />
                  <View 
                    style={[
                      styles.statBarFill, 
                      { 
                        width: '40%',
                        backgroundColor: '#42A5F5' 
                      }
                    ]} 
                  />
                </View>
              </View>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>8</Text>
            </View>
            
            <View style={styles.statRow}>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>6</Text>
              <View style={styles.statBarContainer}>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                  Shots on Target
                </Text>
                <View style={styles.statBar}>
                  <View 
                    style={[
                      styles.statBarFill, 
                      { 
                        width: '67%',
                        backgroundColor: theme.colors.primary 
                      }
                    ]} 
                  />
                  <View 
                    style={[
                      styles.statBarFill, 
                      { 
                        width: '33%',
                        backgroundColor: '#42A5F5' 
                      }
                    ]} 
                  />
                </View>
              </View>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>3</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {renderHeader()}
      {renderTabs()}
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderSearchAndFilter()}
        {renderDateSelector()}
        
        <View style={styles.resultsContainer}>
          {matchResults.map(renderResultCard)}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    flex: 1,
    textAlign: 'center',
  },
  settingsButton: {
    padding: 4,
  },
  tabContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  tabScrollContent: {
    paddingHorizontal: 16,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  content: {
    flex: 1,
  },
  searchFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateSelectorContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  dateOptions: {
    gap: 8,
  },
  dateOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  dateOptionText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  resultsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 16,
  },
  resultCard: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  competitionInfo: {
    flex: 1,
  },
  competitionText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateTimeText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  favoriteButton: {
    padding: 4,
  },
  matchResult: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  teamContainer: {
    alignItems: 'center',
    width: '35%',
  },
  teamLogo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginBottom: 8,
  },
  teamName: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
  scoreContainer: {
    alignItems: 'center',
    width: '30%',
  },
  score: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  status: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
  },
  resultActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  actionButtonText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  expandedContent: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
  },
  scorersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  teamScorers: {
    flex: 1,
  },
  scorersTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
  scorerText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginBottom: 4,
  },
  matchStats: {
    marginTop: 8,
  },
  matchStatsTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 12,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    width: 40,
    textAlign: 'center',
  },
  statBarContainer: {
    flex: 1,
    marginHorizontal: 8,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    marginBottom: 4,
  },
  statBar: {
    height: 6,
    flexDirection: 'row',
    borderRadius: 3,
    overflow: 'hidden',
    backgroundColor: '#2A2A2A',
  },
  statBarFill: {
    height: '100%',
  },
});