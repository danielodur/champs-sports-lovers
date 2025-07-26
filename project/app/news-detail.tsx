import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Linking, Alert, FlatList, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Clock, ExternalLink, Share, Play, Eye, User, Tag, BookOpen, Video } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { newsService, VideoContent, RichNewsContent } from '@/services/newsService';

const { width } = Dimensions.get('window');

export default function NewsDetailScreen() {
  const router = useRouter();
  const theme = useTheme();
  const params = useLocalSearchParams();
  
  // ✅ NEW: Rich content state
  const [richContent, setRichContent] = useState<RichNewsContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'article' | 'videos' | 'related'>('article');

  const newsData = params.data ? JSON.parse(params.data as string) : null;

  // ✅ NEW: Load rich content when component mounts
  useEffect(() => {
    loadRichContent();
  }, []);

  const loadRichContent = async () => {
    if (!newsData?.id) {
      setLoading(false);
      return;
    }

    try {
      console.log('🔍 Loading rich content for:', newsData.title);
      const content = await newsService.getRichContent(newsData.id, newsData.url);
      setRichContent(content);
      console.log('✅ Rich content loaded:', content.videos.length, 'videos,', content.relatedArticles.length, 'related articles');
    } catch (error) {
      console.error('❌ Failed to load rich content:', error);
      Alert.alert('Content Error', 'Failed to load additional content. Basic article is still available.');
    } finally {
      setLoading(false);
    }
  };

  // ✅ NEW: Handle video playback
  const handleVideoPress = (video: VideoContent) => {
    if (video.videoUrl && video.videoUrl !== '#') {
      Alert.alert(
        'Play Video',
        `${video.title}\n\n${video.description}`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Watch', 
            onPress: () => {
              // In a real app, this would open a video player or navigate to video screen
              Linking.openURL(video.videoUrl).catch(() => {
                Alert.alert('Error', 'Unable to play video at this time.');
              });
            }
          }
        ]
      );
    } else {
      Alert.alert('Video Coming Soon', 'This video will be available shortly.');
    }
  };

  // ✅ NEW: Handle related article navigation
  const handleRelatedArticlePress = (article: any) => {
    router.push({
      pathname: '/news-detail',
      params: { data: JSON.stringify(article) }
    });
  };

  if (!newsData || !newsData.title) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.colors.text }]}>
            News article not found
          </Text>
          <TouchableOpacity 
            style={[styles.backButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  const handleOpenUrl = () => {
    if (newsData.url && newsData.url !== '#') {
      Linking.openURL(newsData.url);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>News Article</Text>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={handleOpenUrl}
        >
          <Share size={20} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      {/* ✅ NEW: Content tabs */}
      <View style={[styles.tabContainer, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'article' && { borderBottomColor: theme.colors.primary }]}
          onPress={() => setActiveTab('article')}
        >
          <BookOpen size={16} color={activeTab === 'article' ? theme.colors.primary : theme.colors.textSecondary} />
          <Text style={[styles.tabText, { 
            color: activeTab === 'article' ? theme.colors.primary : theme.colors.textSecondary 
          }]}>Article</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'videos' && { borderBottomColor: theme.colors.primary }]}
          onPress={() => setActiveTab('videos')}
        >
          <Video size={16} color={activeTab === 'videos' ? theme.colors.primary : theme.colors.textSecondary} />
          <Text style={[styles.tabText, { 
            color: activeTab === 'videos' ? theme.colors.primary : theme.colors.textSecondary 
          }]}>Videos ({richContent?.videos.length || 0})</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'related' && { borderBottomColor: theme.colors.primary }]}
          onPress={() => setActiveTab('related')}
        >
          <ExternalLink size={16} color={activeTab === 'related' ? theme.colors.primary : theme.colors.textSecondary} />
          <Text style={[styles.tabText, { 
            color: activeTab === 'related' ? theme.colors.primary : theme.colors.textSecondary 
          }]}>Related ({richContent?.relatedArticles.length || 0})</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'article' && (
          <View>
            <Image 
              source={{ uri: newsData.urlToImage || newsData.image || newsData.thumbnail || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&h=250&fit=crop' }} 
              style={styles.articleImage}
              resizeMode="cover"
            />

            <View style={styles.articleContent}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            {newsData.title}
          </Text>

          <View style={styles.metaContainer}>
            <View style={styles.sourceContainer}>
              <Text style={[styles.source, { color: theme.colors.primary }]}>
                {newsData.source?.name || newsData.source || 'Unknown Source'}
              </Text>
              <View style={styles.timeContainer}>
                <Clock size={14} color={theme.colors.textSecondary} />
                <Text style={[styles.time, { color: theme.colors.textSecondary }]}>
                  {formatTimeAgo(newsData.publishedAt)}
                </Text>
              </View>
            </View>
                          <Text style={[styles.readTime, { color: theme.colors.textSecondary }]}>
                {richContent?.readingTime || newsData.readTime || '3'} min read
              </Text>
            </View>

            {/* ✅ NEW: Author information */}
            {richContent?.author && (
              <View style={[styles.authorContainer, { backgroundColor: theme.colors.backgroundSecondary }]}>
                <Image source={{ uri: richContent.author.avatar }} style={styles.authorAvatar} />
                <View style={styles.authorInfo}>
                  <Text style={[styles.authorName, { color: theme.colors.text }]}>
                    {richContent.author.name}
                  </Text>
                  <Text style={[styles.authorBio, { color: theme.colors.textSecondary }]}>
                    {richContent.author.bio}
                  </Text>
                </View>
              </View>
            )}

            <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
              {newsData.description || 'No description available'}
            </Text>

            {/* ✅ NEW: Full article text with rich formatting */}
            <Text style={[styles.articleText, { color: theme.colors.text }]}>
              {richContent?.fullText || newsData.content || newsData.description || 'Article content not available. Please click "Read Full Article" to view the complete story.'}
            </Text>

            {/* ✅ NEW: Article tags */}
            {richContent?.tags && richContent.tags.length > 0 && (
              <View style={styles.tagsContainer}>
                <Text style={[styles.tagsTitle, { color: theme.colors.text }]}>Tags:</Text>
                <View style={styles.tagsWrapper}>
                  {richContent.tags.map((tag, index) => (
                    <View key={index} style={[styles.tag, { backgroundColor: theme.colors.backgroundSecondary }]}>
                      <Tag size={12} color={theme.colors.primary} />
                      <Text style={[styles.tagText, { color: theme.colors.primary }]}>{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

          {newsData.url && newsData.url !== '#' && (
            <TouchableOpacity 
              style={[styles.readMoreButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleOpenUrl}
            >
              <ExternalLink size={16} color="#FFFFFF" />
              <Text style={styles.readMoreText}>Read Full Article</Text>
            </TouchableOpacity>
          )}

          <View style={[styles.categoryTag, { backgroundColor: theme.colors.backgroundSecondary }]}>
            <Text style={[styles.categoryText, { color: theme.colors.primary }]}>
              #{newsData.category}
            </Text>
          </View>
            </View>
          </View>
        )}

        {activeTab === 'videos' && (
          <View style={styles.articleContent}>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              Related Videos
            </Text>
            {richContent?.videos && richContent.videos.length > 0 ? (
              richContent.videos.map((video, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={[styles.videoItem, { borderColor: theme.colors.border }]}
                  onPress={() => video.videoUrl && Linking.openURL(video.videoUrl)}
                >
                  <Image source={{ uri: video.thumbnail }} style={styles.videoThumbnail} />
                  <View style={styles.videoInfo}>
                    <Text style={[styles.videoTitle, { color: theme.colors.text }]}>
                      {video.title}
                    </Text>
                    <Text style={[styles.videoDuration, { color: theme.colors.textSecondary }]}>
                      {video.duration}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={[styles.noContentText, { color: theme.colors.textSecondary }]}>
                No videos available for this article.
              </Text>
            )}
          </View>
        )}

        {activeTab === 'related' && (
          <View style={styles.articleContent}>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              Related Articles
            </Text>
            {richContent?.relatedArticles && richContent.relatedArticles.length > 0 ? (
              richContent.relatedArticles.map((article, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={[styles.relatedItem, { borderColor: theme.colors.border }]}
                  onPress={() => article.url && Linking.openURL(article.url)}
                >
                  <Image source={{ uri: article.urlToImage }} style={styles.relatedThumbnail} />
                  <View style={styles.relatedInfo}>
                    <Text style={[styles.relatedTitle, { color: theme.colors.text }]}>
                      {article.title}
                    </Text>
                    <Text style={[styles.relatedSource, { color: theme.colors.textSecondary }]}>
                      {article.source?.name || 'Unknown Source'} • {article.publishedAt}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={[styles.noContentText, { color: theme.colors.textSecondary }]}>
                No related articles available.
              </Text>
            )}
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
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  articleImage: {
    width: '100%',
    height: 250,
  },
  articleContent: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 32,
    marginBottom: 16,
  },
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sourceContainer: {
    flex: 1,
  },
  source: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  time: {
    fontSize: 12,
    marginLeft: 4,
  },
  readTime: {
    fontSize: 12,
    fontWeight: '500',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
    fontStyle: 'italic',
  },
  articleText: {
    fontSize: 16,
    lineHeight: 26,
    marginBottom: 24,
  },
  readMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  readMoreText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  categoryTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  backButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  authorContainer: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  authorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  authorInfo: {
    marginLeft: 12,
    flex: 1,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  authorBio: {
    fontSize: 14,
    lineHeight: 20,
  },
  tagsContainer: {
    marginBottom: 20,
  },
  tagsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  tagsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  videoItem: {
    flexDirection: 'row',
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 12,
  },
  videoThumbnail: {
    width: 80,
    height: 60,
    borderRadius: 6,
  },
  videoInfo: {
    marginLeft: 12,
    flex: 1,
  },
  videoTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  videoDuration: {
    fontSize: 12,
  },
  relatedItem: {
    flexDirection: 'row',
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 12,
  },
  relatedThumbnail: {
    width: 80,
    height: 60,
    borderRadius: 6,
  },
  relatedInfo: {
    marginLeft: 12,
    flex: 1,
  },
  relatedTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    lineHeight: 18,
  },
  relatedSource: {
    fontSize: 12,
  },
  noContentText: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 20,
  },
});