import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, RefreshControl, StatusBar, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Search, Bell, Star, ChevronRight, Clock, ExternalLink, Heart, Play, Eye, Users, Trophy, MapPin, Video } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from 'react-i18next';
import { newsService, NewsArticle } from '@/services/newsService';
import { favoritesService } from '@/services/favoritesService';

// Enhanced interfaces for different content types
interface VideoContent {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  duration: string;
  views: string;
  publishedAt: string;
  source: string;
  category: 'highlights' | 'analysis' | 'interview' | 'documentary' | 'funny';
}

interface FIFAContent {
  id: string;
  title: string;
  description: string;
  image: string;
  publishedAt: string;
  category: 'official' | 'tournaments' | 'regulations' | 'awards';
  importance: 'high' | 'medium' | 'low';
  tags: string[];
}

export default function NewsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  
  const [sportsNews, setSportsNews] = useState<NewsArticle[]>([]);
  const [headlines, setHeadlines] = useState<NewsArticle[]>([]);
  const [followsNews, setFollowsNews] = useState<NewsArticle[]>([]);
  const [fifaNews, setFifaNews] = useState<FIFAContent[]>([]);
  const [ugandaNews, setUgandaNews] = useState<NewsArticle[]>([]);
  const [afconNews, setAfconNews] = useState<NewsArticle[]>([]);
  const [videoContent, setVideoContent] = useState<VideoContent[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState('follows');



  const loadFollowsNews = async () => {
    try {
      const favorites = await favoritesService.getFavorites();
      if (favorites.length === 0) {
        setFollowsNews([]);
        return;
      }

      // Generate news related to favorite teams with different images
      const relatedNews: NewsArticle[] = [];
      const newsImages = [
        'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&h=250&fit=crop', // Football stadium
        'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=250&fit=crop', // Soccer ball
        'https://images.unsplash.com/photo-1606925797300-0b35e9d1794e?w=400&h=250&fit=crop', // Stadium crowd
        'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=400&h=250&fit=crop', // Soccer field
        'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=250&fit=crop', // Sports action
        'https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=400&h=250&fit=crop', // Football players
        'https://images.unsplash.com/photo-1553778263-73a83bab9b0c?w=400&h=250&fit=crop', // Sports equipment
        'https://images.unsplash.com/photo-1579952363873-27d3bfad9c0d?w=400&h=250&fit=crop'  // Football match
      ];

      favorites.forEach((favorite, index) => {
        const imageIndex = index % newsImages.length;
        const newsTypes = [
          {
            title: `${favorite.homeTeam} vs ${favorite.awayTeam}: Match Preview`,
            description: `Tactical analysis and key players to watch in this ${favorite.league} clash.`
          },
          {
            title: `${favorite.homeTeam} Team News and Updates`,
            description: `Latest squad updates, injuries, and formation changes for ${favorite.homeTeam}.`
          },
          {
            title: `${favorite.awayTeam} Pre-Match Analysis`,
            description: `How ${favorite.awayTeam} plans to approach this crucial ${favorite.league} fixture.`
          },
          {
            title: `${favorite.league}: Title Race Implications`,
            description: `How this match between ${favorite.homeTeam} and ${favorite.awayTeam} affects the standings.`
          }
        ];
        
        const newsType = newsTypes[index % newsTypes.length];
        
        relatedNews.push({
          id: `follows_${favorite.id}_${index}`,
          title: newsType.title,
          description: newsType.description,
          content: `${newsType.description}\n\nDetailed coverage of this important ${favorite.league} match with expert insights and predictions.`,
          url: '#',
          urlToImage: newsImages[imageIndex],
          publishedAt: new Date(Date.now() - (index + 1) * 60 * 60 * 1000).toISOString(),
          source: { id: 'team_news', name: `${favorite.league} News` },
          category: 'football',
          readTime: '4 min read'
        });
      });

      setFollowsNews(relatedNews);
    } catch (error) {
      console.error('Error loading follows news:', error);
      setFollowsNews([]);
    }
  };

  const loadNews = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      }

      console.log('📰 Loading real news data from APIs with rate limiting...');
      
      // 🔄 SEQUENTIAL LOADING: Load APIs one by one to prevent rate limiting
      console.log('📰 [1/6] Loading sports news...');
      const sportsArticles = await newsService.getSportsNews('sports', 15);
      setSportsNews(sportsArticles);
      
      // Small delay between requests to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('📰 [2/6] Loading headlines...');
      const headlineArticles = await newsService.getTopHeadlines('sports', 10);
      setHeadlines(headlineArticles);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('📰 [3/6] Loading FIFA news...');
      const fifaArticles = await newsService.getFIFANews(10);
      setFifaNews(fifaArticles.map(article => ({
        id: article.id,
        title: article.title,
        description: article.description,
        image: article.urlToImage,
        publishedAt: article.publishedAt,
        category: 'official' as const,
        importance: 'high' as const,
        tags: ['FIFA', 'Official']
      })));
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('📰 [4/6] Loading Uganda sports news...');
      const ugandaArticles = await newsService.getUgandaSportsNews(10);
      setUgandaNews(ugandaArticles);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('📰 [5/6] Loading AFCON news...');
      const afconArticles = await newsService.getAFCONNews(10);
      setAfconNews(afconArticles);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('📰 [6/6] Loading sports videos...');
      const videoArticles = await newsService.getSportsVideos(10);
      setVideoContent(videoArticles);
      
      // Load category-specific content (doesn't use external APIs)
      await loadFollowsNews();
      
      console.log(`📰 ✅ All news content loaded successfully with rate limiting`);
      
    } catch (error) {
      console.error('📰 Error loading news:', error);
    } finally {
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

  const renderFollowsContent = () => {
    if (followsNews.length === 0) {
      return (
        <View style={[styles.newsSection, { backgroundColor: theme.colors.backgroundSecondary }]}>
          <View style={styles.emptyFollowsContainer}>
            <Heart size={48} color={theme.colors.textSecondary} />
            <Text style={[styles.emptyFollowsTitle, { color: theme.colors.text }]}>
              No Followed Matches
            </Text>
            <Text style={[styles.emptyFollowsText, { color: theme.colors.textSecondary }]}>
              Follow matches to see related news and updates here
            </Text>
            <TouchableOpacity 
              style={[styles.followButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => router.push('/(tabs)/')}
            >
              <Text style={styles.followButtonText}>Browse Matches</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <View style={[styles.newsSection, { backgroundColor: theme.colors.backgroundSecondary }]}>
        <View style={styles.sectionHeader}>
          <View style={styles.titleContainer}>
            <Heart size={16} color={theme.colors.primary} />
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Followed Matches News</Text>
          </View>
        </View>
        
        <View style={styles.newsList}>
          {followsNews.map((article) => (
            <TouchableOpacity 
              key={article.id}
              style={[styles.newsItem, { borderBottomColor: theme.colors.border }]}
              onPress={() => router.push({
                pathname: '/news-detail',
                params: { data: JSON.stringify(article) }
              })}
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
    );
  };

  const CategoryNewsView = ({ sport, icon: Icon, title }: { sport: string, icon: any, title: string }) => {
    const [categoryNews, setCategoryNews] = useState<NewsArticle[]>([]);

    useEffect(() => {
      const loadCategoryNews = async () => {
        try {
          console.log(`📰 Loading category news for: ${sport}`);
          
          // 🔄 SEQUENTIAL LOADING: Try APIs one by one to prevent rate limiting
          let articles: NewsArticle[] = [];
          
          // Try Bing first (usually more reliable)
          try {
            console.log(`📰 Trying Bing News for ${sport}...`);
            const bingArticles = await newsService.getBingNewsForSport(sport, 8);
            if (bingArticles.length > 0) {
              articles.push(...bingArticles);
              console.log(`📰 Got ${bingArticles.length} articles from Bing for ${sport}`);
            }
          } catch (error) {
            console.log(`📰 Bing News failed for ${sport}:`, error);
          }
          
          // Small delay before trying NewsCatcher
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Try NewsCatcher only if we need more articles
          if (articles.length < 10) {
            try {
              console.log(`📰 Trying NewsCatcher for ${sport}...`);
              const newsCatcherArticles = await newsService.getNewsCatcherSports(sport, 7);
              if (newsCatcherArticles.length > 0) {
                articles.push(...newsCatcherArticles);
                console.log(`📰 Got ${newsCatcherArticles.length} articles from NewsCatcher for ${sport}`);
              }
            } catch (error) {
              console.log(`📰 NewsCatcher failed for ${sport}:`, error);
            }
          }

          // If still no articles, use fallback
          if (articles.length === 0) {
            console.log(`📰 Using fallback news for ${sport}`);
            const fallbackNews = await newsService.getSportsNews(sport, 10);
            setCategoryNews(fallbackNews);
          } else {
            setCategoryNews(articles.slice(0, 15));
            console.log(`📰 Set ${articles.length} articles for ${sport} category`);
          }
        } catch (error) {
          console.error(`Error loading ${sport} news:`, error);
          // Set fallback news on error to ensure content is always shown
          const fallbackNews = await newsService.getSportsNews(sport, 10);
          setCategoryNews(fallbackNews);
        }
      };

      loadCategoryNews();
    }, [sport]);

    return (
      <View style={[styles.newsSection, { backgroundColor: theme.colors.backgroundSecondary }]}>
        <View style={styles.sectionHeader}>
          <View style={styles.titleContainer}>
            <Icon size={16} color={theme.colors.primary} />
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{title}</Text>
          </View>
        </View>
        
        <View style={styles.newsList}>
                      {categoryNews.map((article) => (
              <TouchableOpacity 
                key={article.id}
                style={[styles.newsItem, { borderBottomColor: theme.colors.border }]}
                onPress={() => router.push({
                  pathname: '/news-detail',
                  params: { data: JSON.stringify(article) }
                })}
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
    );
  };

  const renderCategoryContent = () => {
    switch (activeCategory) {
      case 'follows':
        return renderFollowsContent();
      case 'fifa':
        return (
          <View style={[styles.newsSection, { backgroundColor: theme.colors.backgroundSecondary }]}>
            <View style={styles.sectionHeader}>
              <View style={styles.titleContainer}>
                <Trophy size={16} color={theme.colors.primary} />
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>FIFA Official News</Text>
              </View>
            </View>
            
            <View style={styles.newsList}>
              {fifaNews.map((article) => (
                <TouchableOpacity 
                  key={article.id}
                  style={[styles.newsItem, { borderBottomColor: theme.colors.border }]}
                  onPress={() => router.push({
                    pathname: '/news-detail',
                    params: { data: JSON.stringify(article) }
                  })}
                >
                  <View style={styles.newsContent}>
                    <Image 
                      source={{ uri: article.image }} 
                      style={styles.newsImage}
                      resizeMode="cover"
                    />
                    <View style={styles.newsTextContent}>
                      <View style={styles.fifaHeaderContainer}>
                        <Text style={[styles.newsTitle, { color: theme.colors.text }]} numberOfLines={2}>
                          {article.title}
                        </Text>
                        {article.importance === 'high' && (
                          <View style={[styles.importanceBadge, { backgroundColor: theme.colors.primary }]}>
                            <Text style={styles.importanceText}>HIGH</Text>
                          </View>
                        )}
                      </View>
                      <Text style={[styles.newsDescription, { color: theme.colors.textSecondary }]} numberOfLines={2}>
                        {article.description}
                      </Text>
                      <View style={styles.fifaTagsContainer}>
                        {article.tags.slice(0, 2).map((tag, index) => (
                          <View key={index} style={[styles.fifaTag, { backgroundColor: theme.colors.background }]}>
                            <Text style={[styles.fifaTagText, { color: theme.colors.primary }]}>{tag}</Text>
                          </View>
                        ))}
                      </View>
                      <View style={styles.newsInfo}>
                        <View style={styles.newsSource}>
                          <Text style={[styles.sourceText, { color: theme.colors.textSecondary }]}>
                            FIFA Official
                          </Text>
                          <View style={styles.sourceDot} />
                          <Clock size={12} color={theme.colors.textSecondary} />
                          <Text style={[styles.timeText, { color: theme.colors.textSecondary }]}>
                            {formatTimeAgo(article.publishedAt)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      case 'uganda':
        return (
          <View style={[styles.newsSection, { backgroundColor: theme.colors.backgroundSecondary }]}>
            <View style={styles.sectionHeader}>
              <View style={styles.titleContainer}>
                <MapPin size={16} color={theme.colors.primary} />
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Uganda Sports News</Text>
              </View>
            </View>
            <View style={styles.newsList}>
              {ugandaNews.map((article) => (
                <TouchableOpacity 
                  key={article.id}
                  style={[styles.newsItem, { borderBottomColor: theme.colors.border }]}
                  onPress={() => router.push({
                    pathname: '/news-detail',
                    params: { data: JSON.stringify(article) }
                  })}
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
        );
      case 'afcon':
        return (
          <View style={[styles.newsSection, { backgroundColor: theme.colors.backgroundSecondary }]}>
            <View style={styles.sectionHeader}>
              <View style={styles.titleContainer}>
                <Users size={16} color={theme.colors.primary} />
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>AFCON News</Text>
              </View>
            </View>
            <View style={styles.newsList}>
              {afconNews.map((article) => (
                <TouchableOpacity 
                  key={article.id}
                  style={[styles.newsItem, { borderBottomColor: theme.colors.border }]}
                  onPress={() => router.push({
                    pathname: '/news-detail',
                    params: { data: JSON.stringify(article) }
                  })}
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
        );
      case 'videos':
        return (
          <View style={[styles.newsSection, { backgroundColor: theme.colors.backgroundSecondary }]}>
            <View style={styles.sectionHeader}>
              <View style={styles.titleContainer}>
                <Video size={16} color={theme.colors.primary} />
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Sports Videos</Text>
              </View>
            </View>
            
            <View style={styles.newsList}>
              {videoContent.map((video) => (
                <TouchableOpacity 
                  key={video.id}
                  style={[styles.newsItem, { borderBottomColor: theme.colors.border }]}
                  onPress={() => router.push({
                    pathname: '/news-detail',
                    params: { data: JSON.stringify(video) }
                  })}
                >
                  <View style={styles.newsContent}>
                    <View style={styles.videoThumbnailContainer}>
                      <Image 
                        source={{ uri: video.thumbnail }} 
                        style={styles.newsImage}
                        resizeMode="cover"
                      />
                      <View style={styles.playIconOverlay}>
                        <Play size={24} color="#FFFFFF" fill="#FFFFFF" />
                      </View>
                      <View style={styles.videoDurationBadge}>
                        <Text style={styles.videoDurationText}>{video.duration}</Text>
                      </View>
                    </View>
                    <View style={styles.newsTextContent}>
                      <Text style={[styles.newsTitle, { color: theme.colors.text }]} numberOfLines={2}>
                        {video.title}
                      </Text>
                      <Text style={[styles.newsDescription, { color: theme.colors.textSecondary }]} numberOfLines={2}>
                        {video.description}
                      </Text>
                      <View style={styles.videoInfoContainer}>
                        <View style={styles.videoStats}>
                          <Eye size={14} color={theme.colors.textSecondary} />
                          <Text style={[styles.videoViews, { color: theme.colors.textSecondary }]}>
                            {video.views} views
                          </Text>
                        </View>
                        <View style={styles.videoCategoryBadge}>
                          <Text style={[styles.videoCategoryText, { color: theme.colors.primary }]}>
                            {video.category.toUpperCase()}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.newsInfo}>
                        <View style={styles.newsSource}>
                          <Text style={[styles.sourceText, { color: theme.colors.textSecondary }]}>
                            {video.source}
                          </Text>
                          <View style={styles.sourceDot} />
                          <Clock size={12} color={theme.colors.textSecondary} />
                          <Text style={[styles.timeText, { color: theme.colors.textSecondary }]}>
                            {formatTimeAgo(video.publishedAt)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      case 'football':
      case 'basketball':
      case 'rugby':
        return (
          <CategoryNewsView 
            sport={activeCategory}
            icon={Star}
            title={activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1) + ' News'}
          />
        );
      default:
        return (
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
                      onPress={() => router.push({
                        pathname: '/news-detail',
                        params: { data: JSON.stringify(article) }
                      })}
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
                    onPress={() => router.push({
                      pathname: '/news-detail',
                      params: { data: JSON.stringify(article) }
                    })}
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
        );
    }
  };

  const categories = [
    { id: 'follows', label: 'Follows', icon: Heart },
    { id: 'sports', label: 'All Sports', icon: Star },
    { id: 'fifa', label: 'FIFA', icon: Trophy },
    { id: 'uganda', label: 'Uganda', icon: MapPin },
    { id: 'afcon', label: 'AFCON', icon: Users },
    { id: 'football', label: 'Football', icon: Star },
    { id: 'basketball', label: 'Basketball', icon: Star },
    { id: 'rugby', label: 'Rugby', icon: Star },
    { id: 'videos', label: 'Videos', icon: Video },
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
          {/* Enhanced Category Tabs with Ho
          rizontal Scrolling */}
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
                <category.icon 
                  size={16} 
                  color={activeCategory === category.id ? '#FFFFFF' : theme.colors.textSecondary}
                  style={{ marginRight: 6 }}
                />
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

          {/* Dynamic Content Based on Selected Category */}
          {renderCategoryContent()}
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
  },
  newsSection: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
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
    paddingLeft: 16,
    paddingRight: 16,
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    marginRight: 12,
    minWidth: 100,
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
  // Follows content styles
  emptyFollowsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyFollowsTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyFollowsText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    marginBottom: 20,
  },
  followButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  followButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  // FIFA content styles
  fifaHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  importanceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  importanceText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: 'Inter-Bold',
  },
  fifaTagsContainer: {
    flexDirection: 'row',
    marginVertical: 6,
    gap: 6,
  },
  fifaTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  fifaTagText: {
    fontSize: 10,
    fontFamily: 'Inter-Medium',
  },
  // Video content styles
  videoThumbnailContainer: {
    position: 'relative',
  },
  playIconOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -12,
    marginLeft: -12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 20,
    padding: 8,
  },
  videoDurationBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  videoDurationText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: 'Inter-SemiBold',
  },
  videoInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 6,
  },
  videoStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  videoViews: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginLeft: 4,
  },
  videoCategoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  videoCategoryText: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
  },
});