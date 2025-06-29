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
  Thermometer,
  TrendingUp,
  TrendingDown,
  Flame,
  Calendar,
  Settings,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Star,
  Info,
  Eye,
  MessageCircle,
  Share
} from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';

interface HeatItem {
  id: string;
  type: 'team' | 'player' | 'match';
  name: string;
  image: string;
  heatIndex: number;
  previousIndex?: number;
  trend: 'up' | 'down' | 'stable';
  trendValue: number;
  category: string;
  views: number;
  comments: number;
  lastUpdated: string;
  description: string;
  expanded?: boolean;
}

export default function HeatIndexScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [timeframe, setTimeframe] = useState('24h');
  const [heatItems, setHeatItems] = useState<HeatItem[]>([
    {
      id: '1',
      type: 'team',
      name: 'Arsenal FC',
      image: 'https://images.pexels.com/photos/274506/pexels-photo-274506.jpeg',
      heatIndex: 92,
      previousIndex: 85,
      trend: 'up',
      trendValue: 7,
      category: 'Football',
      views: 125000,
      comments: 8500,
      lastUpdated: '2 hours ago',
      description: 'Arsenal\'s recent form has sparked significant interest, with their tactical approach against top teams drawing particular attention.',
      expanded: false
    },
    {
      id: '2',
      type: 'player',
      name: 'Erling Haaland',
      image: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg',
      heatIndex: 95,
      previousIndex: 94,
      trend: 'up',
      trendValue: 1,
      category: 'Football',
      views: 180000,
      comments: 12000,
      lastUpdated: '1 hour ago',
      description: 'Haaland continues to dominate discussions with his record-breaking goal scoring rate in the Premier League.',
      expanded: false
    },
    {
      id: '3',
      type: 'match',
      name: 'Lakers vs Warriors',
      image: 'https://images.pexels.com/photos/1752757/pexels-photo-1752757.jpeg',
      heatIndex: 88,
      previousIndex: 75,
      trend: 'up',
      trendValue: 13,
      category: 'Basketball',
      views: 95000,
      comments: 6200,
      lastUpdated: '3 hours ago',
      description: 'The upcoming Lakers vs Warriors matchup has generated significant buzz due to the playoff implications and star player matchups.',
      expanded: false
    },
    {
      id: '4',
      type: 'player',
      name: 'Bukayo Saka',
      image: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg',
      heatIndex: 87,
      previousIndex: 82,
      trend: 'up',
      trendValue: 5,
      category: 'Football',
      views: 85000,
      comments: 5800,
      lastUpdated: '5 hours ago',
      description: 'Saka\'s recent performances have elevated his profile, with his creative output and goal contributions drawing praise from analysts.',
      expanded: false
    }
  ]);

  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'teams', label: 'Teams' },
    { id: 'players', label: 'Players' },
    { id: 'matches', label: 'Matches' }
  ];

  const timeframes = [
    { id: '24h', label: '24h' },
    { id: '7d', label: '7 days' },
    { id: '30d', label: '30 days' },
    { id: '90d', label: '90 days' }
  ];

  const toggleItemExpansion = (itemId: string) => {
    setHeatItems(heatItems.map(item => 
      item.id === itemId 
        ? { ...item, expanded: !item.expanded } 
        : item
    ));
  };

  const getHeatColor = (index: number) => {
    if (index >= 90) return '#F44336'; // Hot
    if (index >= 80) return '#FF9800'; // Warm
    if (index >= 70) return '#FFC107'; // Moderate
    if (index >= 60) return '#4CAF50'; // Cool
    return '#2196F3'; // Cold
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp size={16} color="#4CAF50" />;
      case 'down':
        return <TrendingDown size={16} color="#F44336" />;
      default:
        return <TrendingUp size={16} color="#9E9E9E" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return '#4CAF50';
      case 'down':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
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
      <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Heat Index</Text>
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
          placeholder="Search heat index..."
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

  const renderTimeframeSelector = () => (
    <View style={[styles.timeframeContainer, { backgroundColor: theme.colors.backgroundSecondary }]}>
      <View style={styles.timeframeHeader}>
        <Text style={[styles.timeframeTitle, { color: theme.colors.text }]}>
          Timeframe
        </Text>
        <TouchableOpacity style={styles.refreshButton} activeOpacity={0.7}>
          <RefreshCw size={16} color={theme.colors.text} />
          <Text style={[styles.refreshText, { color: theme.colors.text }]}>
            Refresh
          </Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.timeframeButtons}>
        {timeframes.map((tf) => (
          <TouchableOpacity
            key={tf.id}
            style={[
              styles.timeframeButton,
              {
                backgroundColor: timeframe === tf.id ? theme.colors.primary : theme.colors.background,
              }
            ]}
            onPress={() => setTimeframe(tf.id)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.timeframeButtonText,
                {
                  color: timeframe === tf.id ? '#FFFFFF' : theme.colors.text,
                }
              ]}
            >
              {tf.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderHeatIndexExplanation = () => (
    <View style={[styles.explanationCard, { backgroundColor: theme.colors.backgroundSecondary }]}>
      <View style={styles.explanationHeader}>
        <Thermometer size={20} color={theme.colors.primary} />
        <Text style={[styles.explanationTitle, { color: theme.colors.text }]}>
          What is Heat Index?
        </Text>
      </View>
      
      <Text style={[styles.explanationText, { color: theme.colors.textSecondary }]}>
        Heat Index measures the popularity and engagement level of teams, players, and matches based on views, comments, shares, and other metrics. Higher values indicate more community interest and discussion.
      </Text>
      
      <View style={styles.heatLegend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#F44336' }]} />
          <Text style={[styles.legendText, { color: theme.colors.textSecondary }]}>
            90-100: Very Hot
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#FF9800' }]} />
          <Text style={[styles.legendText, { color: theme.colors.textSecondary }]}>
            80-89: Hot
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#FFC107' }]} />
          <Text style={[styles.legendText, { color: theme.colors.textSecondary }]}>
            70-79: Warm
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#4CAF50' }]} />
          <Text style={[styles.legendText, { color: theme.colors.textSecondary }]}>
            60-69: Moderate
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#2196F3' }]} />
          <Text style={[styles.legendText, { color: theme.colors.textSecondary }]}>
            0-59: Cool
          </Text>
        </View>
      </View>
    </View>
  );

  const renderHeatItem = (item: HeatItem) => {
    const isVisible = activeTab === 'all' || activeTab === `${item.type}s`;
    
    if (!isVisible) return null;
    
    return (
      <View
        key={item.id}
        style={[styles.heatItemCard, { backgroundColor: theme.colors.backgroundSecondary }]}
      >
        <TouchableOpacity
          style={styles.heatItemHeader}
          onPress={() => toggleItemExpansion(item.id)}
          activeOpacity={0.7}
        >
          <View style={styles.heatItemLeft}>
            <Image source={{ uri: item.image }} style={styles.itemImage} />
            <View style={styles.itemInfo}>
              <Text style={[styles.itemName, { color: theme.colors.text }]}>
                {item.name}
              </Text>
              <Text style={[styles.itemCategory, { color: theme.colors.textSecondary }]}>
                {item.category} • {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
              </Text>
            </View>
          </View>
          
          <View style={styles.heatIndexContainer}>
            <View style={[styles.heatBadge, { backgroundColor: getHeatColor(item.heatIndex) }]}>
              <Flame size={12} color="#FFFFFF" />
              <Text style={styles.heatIndexText}>{item.heatIndex}</Text>
            </View>
            <View style={styles.trendContainer}>
              {getTrendIcon(item.trend)}
              <Text style={[styles.trendText, { color: getTrendColor(item.trend) }]}>
                {item.trendValue > 0 ? '+' : ''}{item.trendValue}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
        
        {item.expanded && (
          <View style={styles.expandedContent}>
            <Text style={[styles.itemDescription, { color: theme.colors.textSecondary }]}>
              {item.description}
            </Text>
            
            <View style={styles.engagementStats}>
              <View style={styles.engagementItem}>
                <Eye size={16} color={theme.colors.textSecondary} />
                <Text style={[styles.engagementValue, { color: theme.colors.text }]}>
                  {item.views.toLocaleString()}
                </Text>
                <Text style={[styles.engagementLabel, { color: theme.colors.textSecondary }]}>
                  Views
                </Text>
              </View>
              <View style={styles.engagementItem}>
                <MessageCircle size={16} color={theme.colors.textSecondary} />
                <Text style={[styles.engagementValue, { color: theme.colors.text }]}>
                  {item.comments.toLocaleString()}
                </Text>
                <Text style={[styles.engagementLabel, { color: theme.colors.textSecondary }]}>
                  Comments
                </Text>
              </View>
              <View style={styles.engagementItem}>
                <Calendar size={16} color={theme.colors.textSecondary} />
                <Text style={[styles.engagementValue, { color: theme.colors.text }]}>
                  {item.lastUpdated}
                </Text>
                <Text style={[styles.engagementLabel, { color: theme.colors.textSecondary }]}>
                  Updated
                </Text>
              </View>
            </View>
            
            <View style={styles.itemActions}>
              <TouchableOpacity
                style={[styles.itemAction, { backgroundColor: theme.colors.background }]}
                activeOpacity={0.7}
              >
                <Star size={16} color={theme.colors.text} />
                <Text style={[styles.itemActionText, { color: theme.colors.text }]}>
                  Follow
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.itemAction, { backgroundColor: theme.colors.background }]}
                activeOpacity={0.7}
              >
                <Share size={16} color={theme.colors.text} />
                <Text style={[styles.itemActionText, { color: theme.colors.text }]}>
                  Share
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.itemAction, { backgroundColor: theme.colors.background }]}
                activeOpacity={0.7}
              >
                <Info size={16} color={theme.colors.text} />
                <Text style={[styles.itemActionText, { color: theme.colors.text }]}>
                  Details
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {renderHeader()}
      {renderTabs()}
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderSearchAndFilter()}
        {renderTimeframeSelector()}
        {renderHeatIndexExplanation()}
        
        <View style={styles.heatItemsContainer}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Trending Now
          </Text>
          {heatItems.map(renderHeatItem)}
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
  timeframeContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  timeframeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeframeTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  refreshText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  timeframeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeframeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    minWidth: 60,
    alignItems: 'center',
  },
  timeframeButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  explanationCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  explanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  explanationTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  explanationText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    marginBottom: 16,
  },
  heatLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: '45%',
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  heatItemsContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 16,
  },
  heatItemCard: {
    borderRadius: 12,
    marginBottom: 12,
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
  heatItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  heatItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  itemCategory: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  heatIndexContainer: {
    alignItems: 'flex-end',
  },
  heatBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    marginBottom: 4,
  },
  heatIndexText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Inter-Bold',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
  },
  expandedContent: {
    padding: 16,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
  },
  itemDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    marginBottom: 16,
  },
  engagementStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  engagementItem: {
    alignItems: 'center',
  },
  engagementValue: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginTop: 4,
    marginBottom: 2,
  },
  engagementLabel: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
  },
  itemActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  itemAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  itemActionText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
});