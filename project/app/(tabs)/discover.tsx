import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Platform, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, ChevronRight } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from 'react-i18next';
import useAuth from '@/hooks/useAuth';

// Generate professional realistic avatar using Dicebear adventurer style
const generateProfessionalAvatar = (seed: string) => {
  // Generate consistent background colors for professional look
  const backgroundColors = ['ffdfbf', 'f0f0f0', 'e8f4fd', 'fff2e6', 'f8f8ff', 'f0fff0', 'fffacd', 'f5f5dc'];
  const seedHash = seed.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  const colorIndex = Math.abs(seedHash) % backgroundColors.length;
  const backgroundColor = backgroundColors[colorIndex];
  
  // Use Dicebear adventurer style for realistic professional avatars
  return `https://api.dicebear.com/7.x/adventurer/png?seed=${encodeURIComponent(seed)}&backgroundColor=${backgroundColor}&size=160`;
};

export default function DiscoverScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { isLoggedIn, userInfo } = useAuth();
  const [activeTab, setActiveTab] = useState('hot');
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  const [savedProfilePicture, setSavedProfilePicture] = useState<string | null>(null);

  // Load saved profile picture
  useEffect(() => {
    if (global.savedProfileData && global.savedProfileData.personalInfo && global.savedProfileData.personalInfo.profilePicture) {
      setSavedProfilePicture(global.savedProfileData.personalInfo.profilePicture);
    }
  }, []);

  // Handle tab parameter from navigation
  useEffect(() => {
    if (params.tab && typeof params.tab === 'string') {
      const validTabs = ['following', 'hot', 'membership', 'football', 'basketball', 'community'];
      if (validTabs.includes(params.tab)) {
        setActiveTab(params.tab);
      }
    }
  }, [params.tab]);

  const categories = [
    { id: 'following', label: t('Following') },
    { id: 'hot', label: t('Hot') },
    { id: 'membership', label: t('Membership') },
    { id: 'football', label: t('Football') },
    { id: 'basketball', label: t('Basketball') },
    { id: 'community', label: t('Community') },
  ];

  // Base tools that are available across all categories
  const baseTools = [
    { id: 'video', label: t('Video Record'), icon: '📹', route: '/video-records' },
    { id: 'tactics', label: t('Tactics Board'), icon: '📋', route: '/tactics-board' },
    { id: 'rankings', label: t('Rankings'), icon: '📊', route: '/rankings' },
    { id: 'value', label: t('Value Rankings'), icon: '💎', route: '/value-rankings' },
    { id: 'calculator', label: t('Calculator'), icon: '🔢', route: '/calculator' },
    { id: 'trends', label: t('Trend Charts'), icon: '📈', route: '/trend-charts' },
    { id: 'data', label: t('Data Models'), icon: '📊', route: '/data-models' },
    { id: 'results', label: t('Results'), icon: '🎯', route: '/results' },
    { id: 'index', label: t('Heat Index'), icon: '🌡️', route: '/heat-index' },
    { id: 'indicators', label: t('Indicators'), icon: '📉', route: '/indicators' },
  ];

  // Category-specific tools
  const categoryTools = {
    following: [
      { id: 'video', label: 'Video Record', icon: '📹', route: '/video-records' },
      { id: 'results', label: 'Results', icon: '🎯', route: '/results' },
      { id: 'trends', label: 'Trend Charts', icon: '📈', route: '/trend-charts' },
      { id: 'index', label: 'Heat Index', icon: '🌡️', route: '/heat-index' },
      { id: 'calculator', label: 'Calculator', icon: '🔢', route: '/calculator' },
      { id: 'indicators', label: 'Indicators', icon: '📉', route: '/indicators' },
    ],
    hot: [
      { id: 'video', label: 'Video Record', icon: '📹', route: '/video-records' },
      { id: 'tactics', label: 'Tactics Board', icon: '📋', route: '/tactics-board' },
      { id: 'rankings', label: 'Rankings', icon: '📊', route: '/rankings' },
      { id: 'value', label: 'Value Rankings', icon: '💎', route: '/value-rankings' },
      { id: 'calculator', label: 'Calculator', icon: '🔢', route: '/calculator' },
      { id: 'trends', label: 'Trend Charts', icon: '📈', route: '/trend-charts' },
      { id: 'data', label: 'Data Models', icon: '📊', route: '/data-models' },
      { id: 'results', label: 'Results', icon: '🎯', route: '/results' },
      { id: 'index', label: 'Heat Index', icon: '🌡️', route: '/heat-index' },
      { id: 'indicators', label: 'Indicators', icon: '📉', route: '/indicators' },
    ],
    membership: [
      { id: 'video', label: 'Premium Videos', icon: '🎬', route: '/video-records' },
      { id: 'data', label: 'Premium Models', icon: '🔍', route: '/data-models' },
      { id: 'calculator', label: 'Pro Calculator', icon: '🧮', route: '/calculator' },
      { id: 'indicators', label: 'VIP Indicators', icon: '📊', route: '/indicators' },
      { id: 'value', label: 'Market Analysis', icon: '📈', route: '/value-rankings' },
      { id: 'results', label: 'Exclusive Results', icon: '🏆', route: '/results' },
    ],
    football: [
      { id: 'tactics', label: 'Football Tactics', icon: '⚽', route: '/tactics-board' },
      { id: 'rankings', label: 'Team Rankings', icon: '🏆', route: '/rankings' },
      { id: 'value', label: 'Player Values', icon: '💰', route: '/value-rankings' },
      { id: 'data', label: 'Match Predictions', icon: '🔮', route: '/data-models' },
      { id: 'results', label: 'Match Results', icon: '📋', route: '/results' },
      { id: 'index', label: 'Team Form', icon: '📈', route: '/heat-index' },
      { id: 'video', label: 'Match Highlights', icon: '🎥', route: '/video-records' },
      { id: 'indicators', label: 'Performance Stats', icon: '📊', route: '/indicators' },
    ],
    basketball: [
      { id: 'tactics', label: 'Court Tactics', icon: '🏀', route: '/tactics-board' },
      { id: 'rankings', label: 'NBA Rankings', icon: '🏆', route: '/rankings' },
      { id: 'value', label: 'Player Values', icon: '💰', route: '/value-rankings' },
      { id: 'data', label: 'Game Predictions', icon: '🔮', route: '/data-models' },
      { id: 'results', label: 'Game Results', icon: '📋', route: '/results' },
      { id: 'index', label: 'Player Form', icon: '📈', route: '/heat-index' },
      { id: 'video', label: 'Game Highlights', icon: '🎥', route: '/video-records' },
      { id: 'indicators', label: 'Performance Stats', icon: '📊', route: '/indicators' },
    ],
    community: [
      { id: 'video', label: 'Community Videos', icon: '👥', route: '/video-records' },
      { id: 'tactics', label: 'Shared Tactics', icon: '🤝', route: '/tactics-board' },
      { id: 'data', label: 'Fan Predictions', icon: '🔮', route: '/data-models' },
      { id: 'results', label: 'Discussion Boards', icon: '💬', route: '/results' },
      { id: 'trends', label: 'Fan Sentiment', icon: '📊', route: '/trend-charts' },
      { id: 'index', label: 'Trending Topics', icon: '🔥', route: '/heat-index' },
    ],
  };

  // Get tools based on active tab
  const getToolsForCategory = () => {
    return categoryTools[activeTab as keyof typeof categoryTools] || baseTools;
  };

  const tools = getToolsForCategory();

  const posts = [
    {
      id: '1',
      author: 'John Smith',
      avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg',
      level: 61,
      verified: true,
      content: "Tonight's match analysis: Arsenal vs Bayern Munich - Key tactical breakdown and predictions",
      timestamp: '2 minutes ago',
      category: 'Football',
      engagement: '3.2K',
      comments: 245,
    },
    {
      id: '2',
      author: 'Sarah Wilson',
      avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg',
      level: 45,
      verified: true,
      content: "NBA Playoffs: Lakers' defensive strategy against Warriors - What to expect tonight",
      timestamp: '15 minutes ago',
      category: 'Basketball',
      engagement: '2.8K',
      comments: 189,
    },
    {
      id: '3',
      author: 'Mike Johnson',
      avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg',
      level: 35,
      content: "Premier League title race: Statistical analysis of remaining fixtures",
      timestamp: '32 minutes ago',
      category: 'Football',
      engagement: '1.5K',
      comments: 127,
    },
  ];

  // Filter posts based on active tab
  const getFilteredPosts = () => {
    if (activeTab === 'following' || activeTab === 'hot' || activeTab === 'membership') {
      return posts;
    } else if (activeTab === 'football') {
      return posts.filter(post => post.category === 'Football');
    } else if (activeTab === 'basketball') {
      return posts.filter(post => post.category === 'Basketball');
    } else if (activeTab === 'community') {
      // For community, show all posts but could be filtered differently in a real app
      return posts;
    }
    return posts;
  };

  const filteredPosts = getFilteredPosts();

  const handleToolPress = (route: string) => {
    router.push(route as any);
  };

  const renderHeader = () => (
    <View style={[styles.header, { backgroundColor: theme.colors.backgroundSecondary }]}>
      <View style={styles.headerLeft}>
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/profile')}
          activeOpacity={0.7}
        >
          <Image
            source={{ 
              uri: savedProfilePicture || (isLoggedIn && userInfo?.username 
                ? generateProfessionalAvatar(userInfo.username)
                : generateProfessionalAvatar('DefaultUser'))
            }}
            style={styles.profilePic}
          />
        </TouchableOpacity>
      </View>
      <TouchableOpacity 
        style={styles.notificationButton}
        onPress={() => router.push('/notifications')}
      >
        <Bell size={24} color={theme.colors.text} />
        <View style={[styles.notificationBadge, { backgroundColor: theme.colors.primary }]}>
          <Text style={styles.notificationText}>3</Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  const renderCategories = () => (
    <View style={[styles.categoriesContainer, { backgroundColor: theme.colors.backgroundSecondary }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesScrollContent}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryButton,
              activeTab === category.id && { borderBottomColor: theme.colors.primary }
            ]}
            onPress={() => setActiveTab(category.id)}
          >
            <Text
              style={[
                styles.categoryText,
                { color: theme.colors.textSecondary },
                activeTab === category.id && { color: theme.colors.text }
              ]}
            >
              {category.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderTools = () => (
    <View style={[styles.toolsGrid, { backgroundColor: theme.colors.backgroundSecondary }]}>
      {tools.map((tool) => (
        <TouchableOpacity
          key={tool.id}
          style={[styles.toolItem, { backgroundColor: theme.colors.background }]}
          onPress={() => handleToolPress(tool.route)}
          activeOpacity={0.7}
        >
          <Text style={styles.toolIcon}>{tool.icon}</Text>
          <Text style={[styles.toolLabel, { color: theme.colors.text }]}>{tool.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderPosts = () => (
    <View style={styles.postsContainer}>
      {filteredPosts.map((post) => (
        <View
          key={post.id}
          style={[styles.postCard, { backgroundColor: theme.colors.backgroundSecondary }]}
        >
          <View style={styles.postHeader}>
            <View style={styles.authorInfo}>
              <Image source={{ uri: post.avatar }} style={styles.authorAvatar} />
              <View>
                <View style={styles.authorNameContainer}>
                  <Text style={[styles.authorName, { color: theme.colors.text }]}>
                    {post.author}
                  </Text>
                  {post.verified && <Text style={styles.verifiedBadge}>👑</Text>}
                  <Text style={[styles.authorLevel, { color: theme.colors.textSecondary }]}>
                    Lv{post.level}
                  </Text>
                </View>
                <Text style={[styles.postMeta, { color: theme.colors.textSecondary }]}>
                  {post.timestamp} • {post.category}
                </Text>
              </View>
            </View>
            <TouchableOpacity>
              <ChevronRight size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.postContent, { color: theme.colors.text }]}>
            {post.content}
          </Text>
          <View style={styles.postFooter}>
            <Text style={[styles.engagementText, { color: theme.colors.textSecondary }]}>
              {post.engagement} views • {post.comments} comments
            </Text>
          </View>
        </View>
      ))}
    </View>
  );

  return (
    <>
      <StatusBar barStyle={theme.colors.background === '#FFFFFF' ? 'dark-content' : 'light-content'} backgroundColor={theme.colors.backgroundSecondary} translucent />
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Grey header background that extends from top */}
        <View style={[
          styles.headerBackground, 
          { 
            backgroundColor: theme.colors.backgroundSecondary,
            shadowColor: theme.colors.background === '#FFFFFF' ? '#000000' : '#000000',
          }
        ]}>
          {/* Safe area for status bar */}
          <SafeAreaView edges={['top']} />
          
          {/* Header content */}
          <View style={styles.headerWrapper}>
            {renderHeader()}
            {renderCategories()}
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {renderTools()}
          {renderPosts()}
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBackground: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 8,
  },
  headerWrapper: {
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profilePic: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  notificationButton: {
    position: 'relative',
    padding: 4,
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Inter-Bold',
  },
  categoriesContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  categoriesScrollContent: {
    paddingHorizontal: 16,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  categoryText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  content: {
    flex: 1,
  },
  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
    paddingTop: 12,
    paddingBottom: 12,
    gap: 8,
    justifyContent: 'flex-start',
  },
  toolItem: {
    width: '19%',
    aspectRatio: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  toolIcon: {
    fontSize: 24,
    marginBottom: 4,
    marginRight: 1,
  },
  toolLabel: {
    fontSize: 10,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
  postsContainer: {
    padding: 16,
    gap: 16,
  },
  postCard: {
    borderRadius: 12,
    padding: 16,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  authorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  authorNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  authorName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  verifiedBadge: {
    fontSize: 14,
  },
  authorLevel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  postMeta: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginTop: 2,
  },
  postContent: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    marginBottom: 12,
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  engagementText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
});