import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Calendar, TrendingUp, Star, Play, MessageCircle, Heart, Share, Clock, Trophy, Target, Zap, Eye, ThumbsUp, Bookmark, Filter } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from 'react-i18next';

export default function FootmarkScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState('today');
  const [selectedSport, setSelectedSport] = useState('all');
  const { t } = useTranslation();

  const tabs = [
    { id: 'today', label: t('Today'), icon: Calendar },
    { id: 'trending', label: t('Trending'), icon: TrendingUp },
    { id: 'favorites', label: t('Favorites'), icon: Star },
    { id: 'recommendations', label: t('For You'), icon: Target },
  ];

  const sports = [
    { id: 'all', label: t('All Sports'), emoji: '🏆' },
    { id: 'football', label: t('Football'), emoji: '⚽' },
    { id: 'basketball', label: t('Basketball'), emoji: '🏀' },
    { id: 'rugby', label: t('Rugby'), emoji: '🏉' },
    { id: 'boxing', label: t('Boxing'), emoji: '🥊' },
  ];

  const mockContent = {
    today: [
      {
        id: '1',
        type: 'match',
        title: 'Champions League: Arsenal vs Bayern Munich - Tonight\'s Prediction',
        description: 'Key tactical breakdown and match analysis for tonight\'s crucial Champions League encounter.',
        image: 'https://images.pexels.com/photos/274506/pexels-photo-274506.jpeg',
        sport: 'football',
        time: '2 hours ago',
        engagement: { views: '3.2K', likes: '245', comments: '89' },
        isLive: true,
        author: 'SportWee Analysis',
        category: 'Match Preview'
      },
      {
        id: '2',
        type: 'news',
        title: 'Ugandan Premier League Kicks Off This Saturday',
        description: 'The highly anticipated new season begins with exciting matchups across the country.',
        image: 'https://images.pexels.com/photos/1884574/pexels-photo-1884574.jpeg',
        sport: 'football',
        time: '4 hours ago',
        engagement: { views: '1.8K', likes: '156', comments: '34' },
        isLive: false,
        author: 'UPL News',
        category: 'League News'
      },
      {
        id: '3',
        type: 'prediction',
        title: 'NBA Playoffs: Lakers vs Warriors - Statistical Analysis',
        description: 'Deep dive into team statistics and player performance predictions.',
        image: 'https://images.pexels.com/photos/1752757/pexels-photo-1752757.jpeg',
        sport: 'basketball',
        time: '6 hours ago',
        engagement: { views: '2.1K', likes: '198', comments: '67' },
        isLive: false,
        author: 'NBA Insights',
        category: 'Predictions'
      },
    ],
    trending: [
      {
        id: '4',
        type: 'highlight',
        title: 'Incredible Last-Minute Goal Saves Championship',
        description: 'Watch the most dramatic finish to a championship match in recent history.',
        image: 'https://images.pexels.com/photos/1618200/pexels-photo-1618200.jpeg',
        sport: 'football',
        time: '1 day ago',
        engagement: { views: '15.7K', likes: '1.2K', comments: '234' },
        isLive: false,
        author: 'Football Highlights',
        category: 'Highlights',
        trending: true
      },
      {
        id: '5',
        type: 'analysis',
        title: 'Boxing: Heavyweight Division Power Rankings Update',
        description: 'Latest rankings and analysis of the heavyweight boxing scene.',
        image: 'https://images.pexels.com/photos/4761663/pexels-photo-4761663.jpeg',
        sport: 'boxing',
        time: '2 days ago',
        engagement: { views: '8.9K', likes: '567', comments: '123' },
        isLive: false,
        author: 'Boxing Central',
        category: 'Rankings'
      },
    ],
    favorites: [
      {
        id: '6',
        type: 'saved',
        title: 'Your Saved Match: Manchester United vs Liverpool',
        description: 'Classic rivalry match you bookmarked for later viewing.',
        image: 'https://images.pexels.com/photos/1884574/pexels-photo-1884574.jpeg',
        sport: 'football',
        time: '3 days ago',
        engagement: { views: '5.4K', likes: '432', comments: '78' },
        isLive: false,
        author: 'Premier League',
        category: 'Saved Content',
        isFavorite: true
      },
    ],
    recommendations: [
      {
        id: '7',
        type: 'recommendation',
        title: 'Based on Your Interest: Rugby World Cup Preview',
        description: 'Since you follow rugby, here\'s our comprehensive World Cup analysis.',
        image: 'https://images.pexels.com/photos/1618200/pexels-photo-1618200.jpeg',
        sport: 'rugby',
        time: '5 hours ago',
        engagement: { views: '3.7K', likes: '289', comments: '56' },
        isLive: false,
        author: 'Rugby World',
        category: 'Recommended',
        isRecommended: true
      },
    ],
  };

  const userStats = {
    totalViews: '24.7K',
    totalLikes: '1.8K',
    totalComments: '456',
    favoriteTeams: ['Arsenal', 'Lakers', 'Uganda Cranes'],
    recentActivity: [
      { action: 'Watched', content: 'Arsenal vs Bayern highlights', time: '2h ago' },
      { action: 'Liked', content: 'NBA playoff predictions', time: '4h ago' },
      { action: 'Commented on', content: 'UPL season preview', time: '6h ago' },
    ]
  };

  const getContentForTab = (tabId: string) => {
    return mockContent[tabId as keyof typeof mockContent] || [];
  };

  const filteredContent = getContentForTab(activeTab).filter(item => 
    selectedSport === 'all' || item.sport === selectedSport
  );

  const handleContentPress = (contentId: string) => {
    console.log(`Content pressed: ${contentId}`);
    // Add navigation to detailed content view
  };

  const handleEngagementAction = (action: string, contentId: string) => {
    console.log(`${action} pressed for content: ${contentId}`);
    // Add engagement logic (like, share, comment, etc.)
  };

  const renderUserStats = () => (
    <View style={[styles.statsCard, { backgroundColor: theme.colors.backgroundSecondary }]}>
      <Text style={[styles.statsTitle, { color: theme.colors.text }]}>Your Activity</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Eye size={20} color={theme.colors.primary} />
          <Text style={[styles.statValue, { color: theme.colors.text }]}>{userStats.totalViews}</Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Views</Text>
        </View>
        <View style={styles.statItem}>
          <Heart size={20} color={theme.colors.primary} />
          <Text style={[styles.statValue, { color: theme.colors.text }]}>{userStats.totalLikes}</Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Likes</Text>
        </View>
        <View style={styles.statItem}>
          <MessageCircle size={20} color={theme.colors.primary} />
          <Text style={[styles.statValue, { color: theme.colors.text }]}>{userStats.totalComments}</Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Comments</Text>
        </View>
      </View>
    </View>
  );

  const renderSportsFilter = () => (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={styles.sportsFilter}
      contentContainerStyle={styles.sportsFilterContent}
    >
      {sports.map((sport) => (
        <TouchableOpacity
          key={sport.id}
          style={[
            styles.sportChip,
            {
              backgroundColor: selectedSport === sport.id ? theme.colors.primary : theme.colors.backgroundSecondary,
            }
          ]}
          onPress={() => setSelectedSport(sport.id)}
          activeOpacity={0.7}
        >
          <Text style={styles.sportEmoji}>{sport.emoji}</Text>
          <Text
            style={[
              styles.sportLabel,
              {
                color: selectedSport === sport.id ? '#FFFFFF' : theme.colors.text,
              }
            ]}
          >
            {sport.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderContentCard = (item: any) => (
    <TouchableOpacity
      key={item.id}
      style={[styles.contentCard, { backgroundColor: theme.colors.backgroundSecondary }]}
      onPress={() => handleContentPress(item.id)}
      activeOpacity={0.8}
    >
      <View style={styles.contentHeader}>
        <View style={styles.contentMeta}>
          <Text style={[styles.contentAuthor, { color: theme.colors.text }]}>{item.author}</Text>
          <View style={styles.contentMetaRow}>
            <Text style={[styles.contentTime, { color: theme.colors.textSecondary }]}>{item.time}</Text>
            <View style={[styles.categoryBadge, { backgroundColor: theme.colors.primary }]}>
              <Text style={styles.categoryText}>{item.category}</Text>
            </View>
          </View>
        </View>
        {item.isLive && (
          <View style={[styles.liveBadge, { backgroundColor: '#EF5350' }]}>
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        )}
        {item.trending && (
          <View style={[styles.trendingBadge, { backgroundColor: '#FF9800' }]}>
            <TrendingUp size={16} color="#FFFFFF" />
          </View>
        )}
      </View>

      <Image source={{ uri: item.image }} style={styles.contentImage} resizeMode="cover" />
      
      <View style={styles.contentBody}>
        <Text style={[styles.contentTitle, { color: theme.colors.text }]} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={[styles.contentDescription, { color: theme.colors.textSecondary }]} numberOfLines={2}>
          {item.description}
        </Text>
      </View>

      <View style={styles.contentFooter}>
        <View style={styles.engagementStats}>
          <View style={styles.engagementItem}>
            <Eye size={16} color={theme.colors.textSecondary} />
            <Text style={[styles.engagementText, { color: theme.colors.textSecondary }]}>
              {item.engagement.views}
            </Text>
          </View>
          <View style={styles.engagementItem}>
            <ThumbsUp size={16} color={theme.colors.textSecondary} />
            <Text style={[styles.engagementText, { color: theme.colors.textSecondary }]}>
              {item.engagement.likes}
            </Text>
          </View>
          <View style={styles.engagementItem}>
            <MessageCircle size={16} color={theme.colors.textSecondary} />
            <Text style={[styles.engagementText, { color: theme.colors.textSecondary }]}>
              {item.engagement.comments}
            </Text>
          </View>
        </View>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEngagementAction('like', item.id)}
            activeOpacity={0.7}
          >
            <Heart size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEngagementAction('bookmark', item.id)}
            activeOpacity={0.7}
          >
            <Bookmark size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEngagementAction('share', item.id)}
            activeOpacity={0.7}
          >
            <Share size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.backgroundSecondary }]}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <ChevronLeft size={28} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Footmark</Text>
        <TouchableOpacity 
          style={styles.filterButton}
          activeOpacity={0.7}
        >
          <Filter size={24} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
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
              <tab.icon size={18} color={activeTab === tab.id ? theme.colors.primary : theme.colors.textSecondary} />
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

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* User Stats */}
        {activeTab === 'today' && renderUserStats()}

        {/* Sports Filter */}
        {renderSportsFilter()}

        {/* Content List */}
        <View style={styles.contentList}>
          {filteredContent.length > 0 ? (
            filteredContent.map(renderContentCard)
          ) : (
            <View style={styles.emptyState}>
              <Trophy size={64} color={theme.colors.textSecondary} />
              <Text style={[styles.emptyStateText, { color: theme.colors.textSecondary }]}>
                No content available for this filter
              </Text>
              <Text style={[styles.emptyStateSubtext, { color: theme.colors.textSecondary }]}>
                Try selecting a different sport or tab
              </Text>
            </View>
          )}
        </View>

        {/* Recent Activity Section */}
        {activeTab === 'today' && (
          <View style={[styles.activitySection, { backgroundColor: theme.colors.backgroundSecondary }]}>
            <Text style={[styles.activityTitle, { color: theme.colors.text }]}>Recent Activity</Text>
            {userStats.recentActivity.map((activity, index) => (
              <View key={index} style={styles.activityItem}>
                <View style={[styles.activityDot, { backgroundColor: theme.colors.primary }]} />
                <View style={styles.activityContent}>
                  <Text style={[styles.activityText, { color: theme.colors.text }]}>
                    <Text style={{ color: theme.colors.primary }}>{activity.action}</Text> {activity.content}
                  </Text>
                  <Text style={[styles.activityTime, { color: theme.colors.textSecondary }]}>
                    {activity.time}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
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
  filterButton: {
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginLeft: 6,
  },
  content: {
    flex: 1,
  },
  statsCard: {
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
  statsTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  sportsFilter: {
    marginVertical: 16,
  },
  sportsFilterContent: {
    paddingHorizontal: 16,
  },
  sportChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  sportEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  sportLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  contentList: {
    paddingHorizontal: 16,
  },
  contentCard: {
    borderRadius: 12,
    marginBottom: 16,
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
  contentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    paddingBottom: 12,
  },
  contentMeta: {
    flex: 1,
  },
  contentAuthor: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  contentMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contentTime: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginRight: 8,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  categoryText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: 'Inter-Medium',
  },
  liveBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  liveText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: 'Inter-Bold',
  },
  trendingBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentImage: {
    width: '100%',
    height: 200,
  },
  contentBody: {
    padding: 16,
  },
  contentTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    lineHeight: 22,
    marginBottom: 8,
  },
  contentDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
  contentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  engagementStats: {
    flexDirection: 'row',
    flex: 1,
  },
  engagementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  engagementText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginLeft: 4,
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  activitySection: {
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
  activityTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 18,
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
});