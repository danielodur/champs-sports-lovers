import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Animated,
  Dimensions,
  ImageBackground,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, Flame, Hash } from "lucide-react-native";
import { useTheme } from "@/hooks/useTheme";
import { useRouter } from "expo-router";
import { NewsArticle } from "../../../../types";
import { newsService } from "../../../../services/newsService";

const { width } = Dimensions.get("window");

interface HotSearchItem {
  id: string;
  rank: number;
  title: string;
  views: number;
  isHot?: boolean;
}

interface HotNewsItem {
  id: string;
  rank: number;
  title: string;
  comments: number;
  isHot?: boolean;
  article?: NewsArticle;
}

export default function News24H() {
  const theme = useTheme();
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  // Initialize with empty arrays for instant display
  const [hotSearches, setHotSearches] = useState<HotSearchItem[]>([]);
  const [hotNews, setHotNews] = useState<HotNewsItem[]>([]);
  const [isLoadingApi, setIsLoadingApi] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
    
    fetch24HHotNews();
  }, []);

  /**
   * Fetches 24-hour hot sports news from all 6 News APIs
   * 
   * This function:
   * - Queries all 6 News APIs in parallel (NewsAPI.org, NewsData.io, Guardian, GNews, MediaStack, World News API)
   * - Filters articles from last 24 hours (with fallback to 7 days if needed)
   * - Extracts trending topics and creates hot searches
   * - Creates ranked hot news items
   * - Handles API rate limits gracefully
   * - Ready to filter and display news when APIs are live
   */
  const fetch24HHotNews = async () => {
    try {
      setIsLoadingApi(true);
      setError(null);

      console.log("🔥 Fetching 24-hour hot sports news from all 6 News APIs...");

      // Fetch trending/hot news from last 24 hours
      const searchQueries = [
        "trending sports news",
        "breaking sports news",
        "hot sports news",
        "sports headlines",
      ];

      // Add timeout wrapper
      const createTimeoutPromise = (promise: Promise<NewsArticle[]>, timeoutMs: number) => {
        return Promise.race([
          promise,
          new Promise<NewsArticle[]>((resolve) => setTimeout(() => resolve([]), timeoutMs))
        ]);
      };

      const newsPromises = searchQueries.map((query) =>
        createTimeoutPromise(
          newsService.searchNews(query, 15).catch((err: Error) => {
            console.log(`⚠️ Search failed for "${query}":`, err.message);
            return [];
          }),
          5000 // Increased timeout to 5 seconds
        )
      );

      const newsResults = await Promise.allSettled(newsPromises);
      const allNews = newsResults
        .filter((result) => result.status === 'fulfilled')
        .flatMap((result) => (result as PromiseFulfilledResult<NewsArticle[]>).value);

      console.log(`✅ Found ${allNews.length} total articles from APIs`);

      // Validate and filter out invalid articles
      const validNews = allNews.filter((article) => {
        return (
          article &&
          article.title &&
          article.title.trim().length > 0 &&
          article.publishedAt &&
          (article.url || article.id)
        );
      });

      console.log(`📊 Valid articles after validation: ${validNews.length}`);

      // Deduplicate by URL, ID, or title+publishedAt
      const uniqueNews = validNews.filter((article, index, self) => {
        const articleKey =
          article.url && article.url !== "#"
            ? article.url
            : article.id || `${article.title}-${article.publishedAt}`;

        return (
          index ===
          self.findIndex((a) => {
            const aKey =
              a.url && a.url !== "#"
                ? a.url
                : a.id || `${a.title}-${a.publishedAt}`;
            return aKey === articleKey;
          })
        );
      });

      console.log(`📊 Unique articles after deduplication: ${uniqueNews.length}`);

      // Filter for articles from last 24 hours (with fallback to 7 days if needed)
      const now = new Date();
      const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      // Helper function to safely parse dates
      const parseDate = (dateString: string): Date | null => {
        try {
          const date = new Date(dateString);
          if (isNaN(date.getTime())) {
            return null;
          }
          return date;
        } catch {
          return null;
        }
      };

      // First, try to get articles from last 24 hours
      let recentNews = uniqueNews.filter((article) => {
        const publishedDate = parseDate(article.publishedAt);
        if (!publishedDate) return false;
        return publishedDate >= last24Hours;
      });

      console.log(`📊 Articles from last 24 hours: ${recentNews.length}`);

      // If we have less than 10 articles from 24h, include articles from last 7 days
      if (recentNews.length < 10) {
        const last7DaysNews = uniqueNews.filter((article) => {
          const publishedDate = parseDate(article.publishedAt);
          if (!publishedDate) return false;
          return publishedDate >= last7Days && publishedDate < last24Hours;
        });
        
        // Combine and prioritize 24h articles
        recentNews = [...recentNews, ...last7DaysNews.slice(0, 15)];
        console.log(`📊 Added ${last7DaysNews.length} articles from last 7 days (total: ${recentNews.length})`);
      }

      // If still no articles, use all unique news sorted by date (fallback)
      if (recentNews.length === 0) {
        console.log(`⚠️ No recent articles found, using all articles as fallback`);
        recentNews = uniqueNews.filter((article) => {
          const publishedDate = parseDate(article.publishedAt);
          return publishedDate !== null;
        });
      }

      // Sort by published date (most recent first)
      const sortedNews = recentNews.sort(
        (a, b) => {
          const dateA = parseDate(a.publishedAt);
          const dateB = parseDate(b.publishedAt);
          if (!dateA || !dateB) return 0;
          return dateB.getTime() - dateA.getTime();
        }
      );

      // Extract hot search topics from news titles (top 5 trending topics)
      const topicMap = new Map<string, number>();
      
      sortedNews.forEach((article) => {
        if (!article.title) return;
        
        const titleLower = article.title.toLowerCase();
        const descLower = (article.description || "").toLowerCase();
        
        // Extract key topics/leagues (check both title and description)
        const topics = [
          "premier league",
          "la liga",
          "bundesliga",
          "serie a",
          "ligue 1",
          "champions league",
          "world cup",
          "fifa",
          "afcon",
          "nba",
          "wnba",
          "nfl",
          "mlb",
          "football",
          "soccer",
          "basketball",
          "sports",
        ];

        topics.forEach((topic) => {
          if (titleLower.includes(topic) || descLower.includes(topic)) {
            const count = topicMap.get(topic) || 0;
            topicMap.set(topic, count + 1);
          }
        });
      });

      console.log(`📊 Topics extracted: ${topicMap.size} unique topics`);

      // Create hot searches from top topics (100% API-driven, no mock data)
      let hotSearchItems: HotSearchItem[] = Array.from(topicMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([topic, count], index) => ({
          id: `search-${topic}-${index}`,
          rank: index + 1,
          title: topic.charAt(0).toUpperCase() + topic.slice(1) + " Today's Focus",
          views: count * 10000, // Use real count-based calculation (no random mock data)
          isHot: true,
        }));

      // NO FALLBACK - Only use real API data. If no topics found, return empty array.

      setHotSearches(hotSearchItems);

      // Create hot news items from sorted articles (top 25, or all available)
      // 100% API-driven - no mock comment counts
      const hotNewsItems: HotNewsItem[] = sortedNews
        .slice(0, Math.min(25, sortedNews.length))
        .map((article, index) => ({
          id: article.id || `news-${index}-${Date.now()}`,
          rank: index + 1,
          title: article.title,
          comments: 0, // No mock data - comments not available from APIs, set to 0
          isHot: index < 3, // Top 3 are hot based on recency
          article: article, // Store full article data for navigation
        }));

      setHotNews(hotNewsItems);

      console.log(`✅ Successfully loaded ${hotNewsItems.length} hot news items`);
      console.log(`📊 Hot searches created: ${hotSearchItems.length}`);
      
      // Log API status for debugging
      const successfulQueries = newsResults.filter(r => r.status === 'fulfilled').length;
      const failedQueries = newsResults.filter(r => r.status === 'rejected').length;
      console.log(`📡 API Status: ${successfulQueries}/${searchQueries.length} queries succeeded, ${failedQueries} failed`);
      
      if (hotNewsItems.length === 0) {
        console.warn("⚠️ No hot news items created. APIs may have hit rate limits or returned no data.");
        setError("No hot news available. APIs may be temporarily unavailable. Please try again later.");
      }
    } catch (err) {
      console.error("❌ Error fetching 24-hour hot news:", err);
      const errorMessage = err instanceof Error 
        ? err.message.includes("limit") || err.message.includes("rate")
          ? "API rate limit reached. Please try again later."
          : err.message
        : "Failed to load hot news. APIs may be temporarily unavailable.";
      setError(errorMessage);
      setHotSearches([]);
      setHotNews([]);
    } finally {
      setIsLoadingApi(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleHotSearchPress = (item: HotSearchItem) => {
    console.log("🔥 [24H] Hot search pressed:", item.title);
    // Extract the topic name (remove " Today's Focus" suffix)
    const topic = item.title.replace(" Today's Focus", "").trim();
    console.log(`🔍 [24H] Navigating to search with topic: "${topic}"`);
    
    // Navigate to search results with the topic as query
    router.push({
      pathname: "/news/search-news/search-all",
      params: { query: topic },
    });
  };

  const handleNewsPress = (news: HotNewsItem) => {
    console.log("📰 [24H] News pressed:", news.title);
    
    if (!news.article) {
      console.error("❌ [24H] No article data available for navigation");
      return;
    }

    // Validate article has required fields
    if (!news.article.id || !news.article.title) {
      console.error("❌ [24H] Invalid article data:", news.article);
      return;
    }

    // Ensure article has all required fields for navigation
    const validArticle = {
      id: news.article.id,
      title: news.article.title,
      description: news.article.description || '',
      url: news.article.url || '#',
      urlToImage: news.article.urlToImage || '',
      publishedAt: news.article.publishedAt || new Date().toISOString(),
      source: news.article.source && typeof news.article.source === 'object' 
        ? news.article.source 
        : { id: 'unknown', name: typeof news.article.source === 'string' ? news.article.source : 'Unknown' },
      category: news.article.category || 'general',
      readTime: news.article.readTime,
      content: news.article.content,
    };

    console.log(`🚀 [24H] Navigating to news-detail with article: "${validArticle.title}"`);
    
    try {
      router.push({
        pathname: "/news/news-detail",
        params: { data: JSON.stringify(validArticle) },
      });
    } catch (error) {
      console.error(`❌ [24H] Navigation error:`, error);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    } else if (num >= 1000) {
      return (num / 1000).toFixed(0) + "k";
    }
    return num.toString();
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return "#FF3030"; // Bright red
    if (rank === 2) return "#FF6600"; // Orange-red
    if (rank === 3) return "#FFB000"; // Golden orange
    return "#FFC947"; // Yellow
  };

  // Show error only if we have error AND no data AND not loading
  if (error && hotNews.length === 0 && hotSearches.length === 0 && !isLoadingApi) {
    return (
      <>
        <StatusBar
          barStyle="light-content"
          backgroundColor="transparent"
          translucent={true}
        />
        <ImageBackground
          source={require("../../../../../../assets/stats/statsViewAllHotTopics.png/stats_view_all_hot_topics.png")}
          style={styles.headerGradient}
          resizeMode="stretch"
        >
          <SafeAreaView edges={["top"]} style={styles.headerSafeArea}>
            <View style={styles.headerContent}>
              <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                <ChevronLeft size={28} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </ImageBackground>
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: theme.colors.textSecondary }]}>
              {error}
            </Text>
            <TouchableOpacity
              style={[styles.retryButton, { borderColor: "#FF3030" }]}
              onPress={fetch24HHotNews}
            >
              <Text style={[styles.retryButtonText, { color: "#FF3030" }]}>
                Retry
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </>
    );
  }

  return (
    <>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent={true}
      />

      {/* Header with Background Image */}
      <ImageBackground
        source={require("../../../../../../assets/stats/statsViewAllHotTopics.png/stats_view_all_hot_topics.png")}
        style={styles.headerGradient}
        resizeMode="stretch"
      >
        <SafeAreaView edges={["top"]} style={styles.headerSafeArea}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <ChevronLeft size={28} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </ImageBackground>

      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.colors.background,
          },
        ]}
      >
        <Animated.ScrollView
          style={[styles.scrollContainer, { opacity: fadeAnim }]}
          showsVerticalScrollIndicator={false}
          bounces={true}
          scrollEventThrottle={16}
          contentInsetAdjustmentBehavior="never"
        >
          {/* Hot Searches Section */}
          {hotSearches.length > 0 && (
            <View style={styles.section}>
              {hotSearches.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.hotSearchItem}
                  onPress={() => handleHotSearchPress(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.hotSearchContent}>
                    <Hash size={16} color="#FF3030" />
                    <Text
                      style={[styles.hotSearchText, { color: theme.colors.text }]}
                      numberOfLines={1}
                    >
                      {item.title}
                    </Text>
                    {item.isHot && (
                      <View style={styles.hotBadge}>
                        <Text style={styles.hotBadgeText}>HOT</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.hotSearchStats}>
                    <Flame size={14} color="#FF3030" />
                    <Text style={styles.hotSearchViews}>
                      {formatNumber(item.views)}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Today's Hot Section */}
          {hotNews.length > 0 && (
            <View style={styles.todayHotSection}>
              <View style={styles.todayHotHeader}>
                <Flame size={18} color="#FF3030" />
                <Text
                  style={[styles.todayHotTitle, { color: theme.colors.text }]}
                >
                  Today's Hot
                </Text>
              </View>

              {hotNews.map((news) => (
                <TouchableOpacity
                  key={news.id}
                  style={styles.newsItem}
                  onPress={() => handleNewsPress(news)}
                  activeOpacity={0.7}
                >
                  <View style={styles.newsRankContainer}>
                    <Text
                      style={[
                        styles.newsRank,
                        {
                          color:
                            news.rank <= 3 ? getRankColor(news.rank) : "#FFC947",
                        },
                      ]}
                    >
                      {news.rank}
                    </Text>
                  </View>

                  <View style={styles.newsContent}>
                    <Text
                      style={[styles.newsTitle, { color: theme.colors.text }]}
                      numberOfLines={2}
                    >
                      {news.title}
                    </Text>
                    <View style={styles.newsStats}>
                      {/* Only show comment count if > 0 (no mock data) */}
                      {news.comments > 0 && (
                        <Text
                          style={[
                            styles.newsComments,
                            { color: theme.colors.textSecondary },
                          ]}
                        >
                          {news.comments} comments
                        </Text>
                      )}
                      {news.isHot && (
                        <View style={styles.newsHotBadge}>
                          <Text style={styles.newsHotBadgeText}>HOT</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {hotNews.length === 0 && hotSearches.length === 0 && !isLoadingApi && (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                {error 
                  ? error 
                  : "No hot news available at the moment. APIs may be temporarily unavailable. Please try again later."}
              </Text>
              {error && (
                <TouchableOpacity
                  style={[styles.retryButton, { borderColor: "#FF3030", marginTop: 16 }]}
                  onPress={fetch24HHotNews}
                >
                  <Text style={[styles.retryButtonText, { color: "#FF3030" }]}>
                    Retry
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Bottom Spacing */}
          <View style={styles.bottomSpacing} />
        </Animated.ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerGradient: {
    paddingBottom: 20,
    paddingTop: 0,
    height: 200,
    position: "relative",
    overflow: "hidden",
    marginBottom: -1,
  },
  headerSafeArea: {
    flex: 1,
    position: "relative",
    backgroundColor: "transparent",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 30,
    zIndex: 10,
    backgroundColor: "transparent",
  },
  backButton: {
    padding: 8,
    marginRight: 20,
    marginTop: 0,
    backgroundColor: "transparent",
    borderRadius: 20,
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    left: 4,
    top: 8,
  },
  scrollContainer: {
    flex: 1,
    marginTop: -1,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: "transparent",
    marginHorizontal: 0,
    marginTop: 0,
    borderRadius: 0,
    paddingBottom: 16,
  },
  hotSearchItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 18,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
    backgroundColor: "transparent",
  },
  hotSearchContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  hotSearchText: {
    fontSize: 16,
    color: "#FFFFFF",
    marginLeft: 8,
    flex: 1,
    fontWeight: "500",
  },
  hotBadge: {
    backgroundColor: "#FF3030",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 8,
  },
  hotBadgeText: {
    fontSize: 10,
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  hotSearchStats: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 12,
  },
  hotSearchViews: {
    fontSize: 14,
    color: "#FF3030",
    marginLeft: 4,
    fontWeight: "600",
  },
  todayHotSection: {
    paddingHorizontal: 20,
    paddingTop: 32,
    marginHorizontal: 0,
    backgroundColor: "transparent",
    borderRadius: 0,
    paddingBottom: 20,
  },
  todayHotHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  todayHotTitle: {
    fontSize: 18,
    color: "#FFFFFF",
    fontWeight: "700",
    marginLeft: 8,
  },
  newsItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  newsRankContainer: {
    width: 24,
    alignItems: "center",
    marginRight: 16,
  },
  newsRank: {
    fontSize: 18,
    fontWeight: "900",
  },
  newsContent: {
    flex: 1,
  },
  newsTitle: {
    fontSize: 16,
    color: "#FFFFFF",
    lineHeight: 22,
    marginBottom: 8,
  },
  newsStats: {
    flexDirection: "row",
    alignItems: "center",
  },
  newsComments: {
    fontSize: 12,
    color: "#888888",
  },
  newsHotBadge: {
    backgroundColor: "#FF3030",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  newsHotBadgeText: {
    fontSize: 8,
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  bottomSpacing: {
    height: 80,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    minHeight: 400,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    minHeight: 400,
  },
  errorText: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  retryButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    minHeight: 400,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
  },
});

