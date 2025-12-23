import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Target, Clock } from "lucide-react-native";
import { useTheme } from "@/hooks/useTheme";
import { NewsArticle } from "../../../../types";
import { newsService } from "../../../../services/newsService";
import { horizontalTabScrollConfig } from "@/utils/scrollPerformance";

interface NewsAllSportsProps {}

export default function NewsAllSports({}: NewsAllSportsProps) {
  const router = useRouter();
  const theme = useTheme();
  // Initialize with empty arrays for instant display
  const [headlines, setHeadlines] = useState<NewsArticle[]>([]);
  const [sportsNews, setSportsNews] = useState<NewsArticle[]>([]);
  const [isLoadingApi, setIsLoadingApi] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  useEffect(() => {
    fetchAllSportsNews();
  }, []);

  const fetchAllSportsNews = async () => {
    try {
      setIsLoadingApi(true);
      setError(null);

      console.log("🔍 Fetching all sports news...");

      // Add timeout wrapper
      const createTimeoutPromise = (promise: Promise<NewsArticle[]>, timeoutMs: number) => {
        return Promise.race([
          promise,
          new Promise<NewsArticle[]>((resolve) => setTimeout(() => resolve([]), timeoutMs))
        ]);
      };

      // Fetch breaking news headlines
      const headlineQueries = [
        "breaking sports news",
        "sports headlines",
      ];

      const headlinePromises = headlineQueries.map((query) =>
        createTimeoutPromise(
          newsService.searchNews(query, 6).catch((err) => {
            console.log(`⚠️ Headline search failed for "${query}":`, err.message);
            return [];
          }),
          4000
        )
      );
      const headlineResults = await Promise.allSettled(headlinePromises);
      const allHeadlines = headlineResults
        .filter((result) => result.status === 'fulfilled')
        .flatMap((result) => (result as PromiseFulfilledResult<NewsArticle[]>).value);

      // Fetch general sports news
      const sportsQueries = [
        "sports news",
        "football news",
      ];

      const sportsPromises = sportsQueries.map((query) =>
        createTimeoutPromise(
          newsService.searchNews(query, 8).catch((err) => {
            console.log(`⚠️ Sports search failed for "${query}":`, err.message);
            return [];
          }),
          4000
        )
      );
      const sportsResults = await Promise.allSettled(sportsPromises);
      const allSports = sportsResults
        .filter((result) => result.status === 'fulfilled')
        .flatMap((result) => (result as PromiseFulfilledResult<NewsArticle[]>).value);

      // Deduplicate headlines
      const uniqueHeadlines = allHeadlines.filter((article, index, self) => {
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

      // Deduplicate sports news
      const uniqueSports = allSports.filter((article, index, self) => {
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

      // Filter for sports-related content
      const sportsKeywords = [
        "sport",
        "football",
        "soccer",
        "basketball",
        "rugby",
        "tennis",
        "cricket",
        "hockey",
        "baseball",
        "match",
        "game",
        "league",
        "championship",
        "tournament",
        "player",
        "team",
      ];

      const relevantHeadlines = uniqueHeadlines.filter((article) => {
        const titleLower = article.title.toLowerCase();
        const descLower = (article.description || "").toLowerCase();
        return sportsKeywords.some(
          (keyword) =>
            titleLower.includes(keyword) || descLower.includes(keyword)
        );
      });

      const relevantSports = uniqueSports.filter((article) => {
        const titleLower = article.title.toLowerCase();
        const descLower = (article.description || "").toLowerCase();
        return sportsKeywords.some(
          (keyword) =>
            titleLower.includes(keyword) || descLower.includes(keyword)
        );
      });

      // Sort by date and limit
      const sortedHeadlines = relevantHeadlines
        .sort(
          (a, b) =>
            new Date(b.publishedAt).getTime() -
            new Date(a.publishedAt).getTime()
        )
        .slice(0, 5);

      const sortedSports = relevantSports
        .sort(
          (a, b) =>
            new Date(b.publishedAt).getTime() -
            new Date(a.publishedAt).getTime()
        )
        .slice(0, 15);

      setHeadlines(sortedHeadlines);
      setSportsNews(sortedSports);
    } catch (err) {
      console.error("❌ Error fetching all sports news:", err);
      setError(err instanceof Error ? err.message : "Failed to load news");
      setHeadlines([]);
      setSportsNews([]);
    } finally {
      setIsLoadingApi(false);
    }
  };

  if (error || (headlines.length === 0 && sportsNews.length === 0)) {
    return (
      <View
        style={[
          styles.newsSection,
          { backgroundColor: theme.colors.backgroundSecondary },
        ]}
      >
        <View style={styles.emptyContainer}>
          <Target size={48} color={theme.colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
            No Sports News Available
          </Text>
          <Text
            style={[styles.emptyText, { color: theme.colors.textSecondary }]}
          >
            {error || "Check back later for the latest sports updates"}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <>
      {/* Headlines Section */}
      {headlines.length > 0 && (
        <View
          style={[
            styles.newsSection,
            { backgroundColor: theme.colors.backgroundSecondary },
          ]}
        >
          <View style={styles.sectionHeader}>
            <View style={styles.titleContainer}>
              <Target size={16} color={theme.colors.primary} />
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Breaking News
              </Text>
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            removeClippedSubviews={
              horizontalTabScrollConfig.removeClippedSubviews
            }
            scrollEventThrottle={horizontalTabScrollConfig.scrollEventThrottle}
            bounces={horizontalTabScrollConfig.bounces}
            decelerationRate={horizontalTabScrollConfig.decelerationRate}
            keyboardShouldPersistTaps={
              horizontalTabScrollConfig.keyboardShouldPersistTaps
            }
            keyboardDismissMode={horizontalTabScrollConfig.keyboardDismissMode}
          >
            <View style={styles.headlinesList}>
              {headlines.map((article) => (
                <TouchableOpacity
                  key={article.id}
                  style={[
                    styles.headlineCard,
                    { backgroundColor: theme.colors.background },
                  ]}
                  onPress={() => {
                    console.log("📰 [AllSports] Headline pressed:", article.title);
                    
                    // Validate article data before navigation
                    if (!article || !article.id || !article.title) {
                      console.error("❌ [AllSports] Invalid article data:", article);
                      return;
                    }

                    // Ensure article has all required fields
                    const validArticle = {
                      id: article.id,
                      title: article.title,
                      description: article.description || '',
                      url: article.url || '#',
                      urlToImage: article.urlToImage || '',
                      publishedAt: article.publishedAt || new Date().toISOString(),
                      source: article.source && typeof article.source === 'object' 
                        ? article.source 
                        : { id: 'unknown', name: typeof article.source === 'string' ? article.source : 'Unknown' },
                      category: article.category || 'general',
                      readTime: article.readTime,
                      content: article.content,
                    };

                    console.log(`🚀 [AllSports] Navigating to news-detail with headline: "${validArticle.title}"`);
                    
                    router.push({
                      pathname: "/news/news-detail",
                      params: { data: JSON.stringify(validArticle) },
                    });
                  }}
                  activeOpacity={0.7}
                >
                  <Image
                    source={{ uri: article.urlToImage }}
                    style={styles.headlineImage}
                    resizeMode="cover"
                  />
                  <View style={styles.headlineContent}>
                    <Text
                      style={[styles.headlineTitle, { color: theme.colors.text }]}
                      numberOfLines={2}
                    >
                      {article.title}
                    </Text>
                    <View style={styles.headlineInfo}>
                      <Text
                        style={[
                          styles.headlineSource,
                          { color: theme.colors.textSecondary },
                        ]}
                      >
                        {article.source.name}
                      </Text>
                      <Text
                        style={[
                          styles.headlineTime,
                          { color: theme.colors.textSecondary },
                        ]}
                      >
                        {formatTimeAgo(article.publishedAt)}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Sports News Section */}
      {sportsNews.length > 0 && (
        <View
          style={[
            styles.newsSection,
            { backgroundColor: theme.colors.backgroundSecondary },
          ]}
        >
          <View style={styles.sectionHeader}>
            <View style={styles.titleContainer}>
              <Target size={16} color={theme.colors.primary} />
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Sports News
              </Text>
            </View>
          </View>

          <View style={styles.newsList}>
            {sportsNews.map((article) => (
              <TouchableOpacity
                key={article.id}
                style={[
                  styles.newsItem,
                  { borderBottomColor: theme.colors.border },
                ]}
                onPress={() => {
                  console.log("📰 [AllSports] Sports news pressed:", article.title);
                  
                  // Validate article data before navigation
                  if (!article || !article.id || !article.title) {
                    console.error("❌ [AllSports] Invalid article data:", article);
                    return;
                  }

                  // Ensure article has all required fields
                  const validArticle = {
                    id: article.id,
                    title: article.title,
                    description: article.description || '',
                    url: article.url || '#',
                    urlToImage: article.urlToImage || '',
                    publishedAt: article.publishedAt || new Date().toISOString(),
                    source: article.source && typeof article.source === 'object' 
                      ? article.source 
                      : { id: 'unknown', name: typeof article.source === 'string' ? article.source : 'Unknown' },
                    category: article.category || 'general',
                    readTime: article.readTime,
                    content: article.content,
                  };

                  console.log(`🚀 [AllSports] Navigating to news-detail with article: "${validArticle.title}"`);
                  
                  router.push({
                    pathname: "/news/news-detail",
                    params: { data: JSON.stringify(validArticle) },
                  });
                }}
                activeOpacity={0.7}
              >
                <View style={styles.newsContent}>
                  <Image
                    source={{ uri: article.urlToImage }}
                    style={styles.newsImage}
                    resizeMode="cover"
                  />
                  <View style={styles.newsTextContent}>
                    <Text
                      style={[styles.newsTitle, { color: theme.colors.text }]}
                      numberOfLines={2}
                    >
                      {article.title}
                    </Text>
                    <Text
                      style={[
                        styles.newsDescription,
                        { color: theme.colors.textSecondary },
                      ]}
                      numberOfLines={2}
                    >
                      {article.description}
                    </Text>
                    <View style={styles.newsInfo}>
                      <View style={styles.newsSource}>
                        <Text
                          style={[
                            styles.sourceText,
                            { color: theme.colors.textSecondary },
                          ]}
                        >
                          {article.source.name}
                        </Text>
                        <View style={styles.sourceDot} />
                        <Clock size={12} color={theme.colors.textSecondary} />
                        <Text
                          style={[
                            styles.timeText,
                            { color: theme.colors.textSecondary },
                          ]}
                        >
                          {formatTimeAgo(article.publishedAt)}
                        </Text>
                      </View>
                      {article.readTime && (
                        <View style={styles.readTime}>
                          <Text
                            style={[
                              styles.readTimeText,
                              { color: theme.colors.primary },
                            ]}
                          >
                            {article.readTime}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  newsSection: {
    borderRadius: 12,
    padding: 16,
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Inter-SemiBold",
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
    textAlign: "center",
    marginTop: 12,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Inter-SemiBold",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
    textAlign: "center",
  },
  headlinesList: {
    flexDirection: "row",
  },
  headlineCard: {
    width: 280,
    marginRight: 16,
    borderRadius: 12,
    overflow: "hidden",
  },
  headlineImage: {
    width: "100%",
    height: 120,
  },
  headlineContent: {
    padding: 12,
  },
  headlineTitle: {
    fontSize: 14,
    fontFamily: "Inter-SemiBold",
    lineHeight: 18,
    marginBottom: 8,
  },
  headlineInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headlineSource: {
    fontSize: 12,
    fontFamily: "Inter-Regular",
  },
  headlineTime: {
    fontSize: 12,
    fontFamily: "Inter-Regular",
  },
  newsList: {
    gap: 12,
  },
  newsItem: {
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  newsContent: {
    flexDirection: "row",
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
    fontFamily: "Inter-SemiBold",
    lineHeight: 18,
    marginBottom: 4,
  },
  newsDescription: {
    fontSize: 13,
    fontFamily: "Inter-Regular",
    lineHeight: 16,
    marginBottom: 8,
  },
  newsInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  newsSource: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  sourceText: {
    fontSize: 12,
    fontFamily: "Inter-Regular",
  },
  sourceDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "#888",
    marginHorizontal: 6,
  },
  timeText: {
    fontSize: 12,
    fontFamily: "Inter-Regular",
    marginLeft: 4,
  },
  readTime: {
    marginLeft: 8,
  },
  readTimeText: {
    fontSize: 12,
    fontFamily: "Inter-Medium",
  },
});
