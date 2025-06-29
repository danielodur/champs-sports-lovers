import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, RefreshControl, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Search, Bell, Star, ChevronRight, Clock, ExternalLink } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from 'react-i18next';
import { newsService, NewsArticle } from '@/services/newsService';

export default function NewsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  
  const [sportsNews, setSportsNews] = useState<NewsArticle[]>([]);
  const [headlines, setHeadlines] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState('sports');

  const loadNews = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      console.log('📰 Loading real news data...');
      
      // Load both sports news and general headlines
      const [sportsArticles, headlineArticles] = await Promise.all([
        newsService.getSportsNews('sports', 15),
        newsService.getTopHeadlines('sports', 10),
      ]);

      setSportsNews(sportsArticles);
      setHeadlines(headlineArticles);
      
      console.log(`📰 Loaded ${sportsArticles.length} sports articles and ${headlineArticles.length} headlines`);
      
    } catch (error) {
      console.error('📰 Error loading news:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadNews();
  }, []);

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const categories = [
    { id: 'sports', label: 'All Sports', icon: Star },
    { id: 'football', label: 'Football', icon: Star },
    { id: 'basketball', label: 'Basketball', icon: Star },
    { id: 'rugby', label: 'Rugby', icon: Star },
  ];

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
            <View style={[styles.header, { backgroundColor: 'transparent' }]}>
              <TouchableOpacity 
                style={[
                  styles.searchButton,
                  { 
                    backgroundColor: theme.colors.background,
                    borderWidth: 1,
                    borderColor: theme.colors.border
                  }
                ]}
                onPress={() => router.push('/search')}
              >
                <Search size={20} color={theme.colors.textSecondary} />
                <Text style={[styles.searchPlaceholder, { color: theme.colors.textSecondary }]}>
                  Search matches, teams, player...
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.bellContainer}
                onPress={() => router.push('/notifications')}
                activeOpacity={0.7}
              >
                <Bell size={20} color={theme.colors.text} />
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationText}>1</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <ScrollView 
          style={styles.content}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={() => loadNews(true)}
              tintColor={theme.colors.primary}
            />
          }
        >
          {/* Category Tabs */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.categoryContainer}
            contentContainerStyle={styles.categoryContent}
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryTab,
                  { 
                    backgroundColor: activeCategory === category.id 
                      ? theme.colors.primary 
                      : theme.colors.backgroundSecondary 
                  }
                ]}
                onPress={() => setActiveCategory(category.id)}
              >
                <Text style={[
                  styles.categoryText,
                  { 
                    color: activeCategory === category.id 
                      ? '#FFFFFF' 
                      : theme.colors.textSecondary 
                  }
                ]}>
                  {category.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
                Loading real sports news...
              </Text>
            </View>
          ) : (
            <>
              {/* Headlines Section */}
              <View style={[styles.newsSection, { backgroundColor: theme.colors.backgroundSecondary }]}>
                <View style={styles.sectionHeader}>
                  <View style={styles.titleContainer}>
                    <Star size={16} color={theme.colors.primary} />
                    <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Breaking News</Text>
                  </View>
                  <TouchableOpacity style={styles.moreButton}>
                    <Text style={[styles.moreText, { color: theme.colors.textSecondary }]}>More</Text>
                    <ChevronRight size={16} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                </View>
                
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.headlinesList}>
                    {headlines.slice(0, 5).map((article) => (
                      <TouchableOpacity 
                        key={article.id}
                        style={[styles.headlineCard, { backgroundColor: theme.colors.background }]}
                      >
                        <Image 
                          source={{ uri: article.urlToImage }} 
                          style={styles.headlineImage}
                          resizeMode="cover"
                        />
                        <View style={styles.headlineContent}>
                          <Text style={[styles.headlineTitle, { color: theme.colors.text }]} numberOfLines={2}>
                            {article.title}
                          </Text>
                          <View style={styles.headlineInfo}>
                            <Text style={[styles.headlineSource, { color: theme.colors.textSecondary }]}>
                              {article.source.name}
                            </Text>
                            <Text style={[styles.headlineTime, { color: theme.colors.textSecondary }]}>
                              {formatTimeAgo(article.publishedAt)}
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              {/* Sports News Section */}
              <View style={[styles.newsSection, { backgroundColor: theme.colors.backgroundSecondary }]}>
                <View style={styles.sectionHeader}>
                  <View style={styles.titleContainer}>
                    <Star size={16} color={theme.colors.primary} />
                    <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Sports News</Text>
                  </View>
                  <TouchableOpacity style={styles.moreButton}>
                    <Text style={[styles.moreText, { color: theme.colors.textSecondary }]}>More</Text>
                    <ChevronRight size={16} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.newsList}>
                  {sportsNews.map((article) => (
                    <TouchableOpacity 
                      key={article.id}
                      style={[styles.newsItem, { borderBottomColor: theme.colors.border }]}
                    >
                      <View style={styles.newsContent}>
                        <Image 
                          source={{ uri: article.urlToImage }} 
                          style={styles.newsImage}
                          resizeMode="cover"
                        />
                        <View style={styles.newsTextContent}>
                          <Text style={[styles.newsTitle, { color: theme.colors.text }]} numberOfLines={2}>
                            {article.title}
                          </Text>
                          <Text style={[styles.newsDescription, { color: theme.colors.textSecondary }]} numberOfLines={2}>
                            {article.description}
                          </Text>
                          <View style={styles.newsInfo}>
                            <View style={styles.newsSource}>
                              <Text style={[styles.sourceText, { color: theme.colors.textSecondary }]}>
                                {article.source.name}
                              </Text>
                              <View style={styles.sourceDot} />
                              <Clock size={12} color={theme.colors.textSecondary} />
                              <Text style={[styles.timeText, { color: theme.colors.textSecondary }]}>
                                {formatTimeAgo(article.publishedAt)}
                              </Text>
                            </View>
                            <View style={styles.readTime}>
                              <Text style={[styles.readTimeText, { color: theme.colors.primary }]}>
                                {article.readTime}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </>
          )}
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
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    borderRadius: 20,
    paddingHorizontal: 12,
    height: 40,
    minHeight: 40,
  },
  searchPlaceholder: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginLeft: 8,
    lineHeight: 20,
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  bellContainer: {
    marginLeft: 16,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF5350',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: 'Inter-Bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  newsSection: {
    borderRadius: 12,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  moreButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moreText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginRight: 4,
  },
  newsList: {
    gap: 12,
  },
  newsItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  newsText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
  categoryContainer: {
    marginBottom: 16,
  },
  categoryContent: {
    paddingHorizontal: 16,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
  },
  categoryText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginTop: 12,
  },
  headlinesList: {
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  headlineCard: {
    width: 280,
    marginRight: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  headlineImage: {
    width: '100%',
    height: 120,
  },
  headlineContent: {
    padding: 12,
  },
  headlineTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    lineHeight: 18,
    marginBottom: 8,
  },
  headlineInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headlineSource: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  headlineTime: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  newsContent: {
    flexDirection: 'row',
  },
  newsImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  newsTextContent: {
    flex: 1,
  },
  newsTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    lineHeight: 18,
    marginBottom: 4,
  },
  newsDescription: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    lineHeight: 16,
    marginBottom: 8,
  },
  newsInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  newsSource: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sourceText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  sourceDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#888',
    marginHorizontal: 6,
  },
  timeText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginLeft: 4,
  },
  readTime: {
    marginLeft: 8,
  },
  readTimeText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
});