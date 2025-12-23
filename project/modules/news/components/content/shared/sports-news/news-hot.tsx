import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "@/hooks/useTheme";
import { Flame, MessageCircle, Eye } from "lucide-react-native";
import { newsService } from "../../../../services/newsService";
import { NewsArticle } from "../../../../types";

interface NewsHotProps {}

export default function NewsHot({}: NewsHotProps) {
  const theme = useTheme();
  const router = useRouter();
  // Initialize with empty array for instant display
  const [hotNews, setHotNews] = useState<NewsArticle[]>([]);
  const [isLoadingApi, setIsLoadingApi] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  useEffect(() => {
    fetchHotNews();
  }, []);

  const fetchHotNews = async () => {
    try {
      setIsLoadingApi(true);
      setError(null);

      console.log("🔥 Fetching trending/hot sports news...");

      const searchQueries = [
        "trending sports news",
        "breaking sports news",
      ];

      console.log(`🔥 Searching with ${searchQueries.length} queries...`);
      
      // Add timeout wrapper
      const createTimeoutPromise = (promise: Promise<NewsArticle[]>, timeoutMs: number) => {
        return Promise.race([
          promise,
          new Promise<NewsArticle[]>((resolve) => setTimeout(() => resolve([]), timeoutMs))
        ]);
      };

      const newsPromises = searchQueries.map((query) =>
        createTimeoutPromise(
          newsService.searchNews(query, 8).catch((err) => {
            console.log(`⚠️ Search failed for "${query}":`, err.message);
            return [];
          }),
          4000 // 4 second timeout per query
        )
      );
      const newsResults = await Promise.allSettled(newsPromises);
      const allNews = newsResults
        .filter((result) => result.status === 'fulfilled')
        .flatMap((result) => (result as PromiseFulfilledResult<NewsArticle[]>).value);
      console.log(`✅ Found ${allNews.length} total articles`);

      // Deduplicate by URL, ID, or title+publishedAt
      const uniqueNews = allNews.filter((article, index, self) => {
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
        "coach",
        "transfer",
        "goal",
        "score",
        "breaking",
        "breaking news",
      ];

      const relevantNews = uniqueNews.filter((article) => {
        const titleLower = article.title.toLowerCase();
        const descLower = (article.description || "").toLowerCase();
        const contentLower = (article.content || "").toLowerCase();

        return sportsKeywords.some(
          (keyword) =>
            titleLower.includes(keyword) ||
            descLower.includes(keyword) ||
            contentLower.includes(keyword)
        );
      });

      console.log(`📊 Relevant articles after filtering: ${relevantNews.length}`);

      // Sort by published date (most recent first) and limit to top 20
      const sortedNews = relevantNews
        .slice(0, 20)
        .sort((a, b) => {
          return (
            new Date(b.publishedAt).getTime() -
            new Date(a.publishedAt).getTime()
          );
        });

      console.log(`✅ Successfully transformed ${sortedNews.length} hot news items`);
      setHotNews(sortedNews);
    } catch (err) {
      console.error("❌ Error fetching hot news:", err);
      setError(err instanceof Error ? err.message : "Failed to load hot news");
      setHotNews([]);
    } finally {
      setIsLoadingApi(false);
    }
  };

  const renderHotNewsItem = (item: NewsArticle, index: number) => {
    // Determine if news is "live" (published within last hour)
    const publishedDate = new Date(item.publishedAt);
    const now = new Date();
    const diffHours = (now.getTime() - publishedDate.getTime()) / (1000 * 60 * 60);
    const isLive = diffHours < 1;

    // Extract category from source name or use default
    const category = item.category || item.source?.name || "Sports";

    return (
      <TouchableOpacity
        key={item.id}
        style={[
          styles.hotNewsItem,
          {
            borderBottomColor: theme.colors.border || "rgba(255, 255, 255, 0.1)",
            backgroundColor: theme.colors.background,
          },
        ]}
        activeOpacity={0.7}
        onPress={() => {
          console.log(`🚀 [NewsHot] Navigating to news-detail with article: "${item.title}"`);
          
          // Ensure complete article data
          const validArticle = {
            id: item.id || `news-${Date.now()}`,
            title: item.title || "Untitled",
            description: item.description || "",
            urlToImage: item.urlToImage || "",
            publishedAt: item.publishedAt || new Date().toISOString(),
            source: item.source || { name: "Sports News", id: "sports" },
            url: item.url || "#",
            content: item.content || "",
            category: item.category || "sports",
          };

          router.push({
            pathname: "/news/news-detail",
            params: { data: JSON.stringify(validArticle) },
          });
        }}
      >
        <View style={styles.hotNewsContent}>
          <View style={styles.hotNewsHeader}>
            {isLive && (
              <View style={styles.liveIndicator}>
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            )}
            <View style={styles.hotRanking}>
              <Text style={[styles.hotRankText, { color: "#FF3B30" }]}>
                HOT #{index + 1}
              </Text>
            </View>
          </View>

          <Text style={[styles.hotNewsTitle, { color: theme.colors.text }]}>
            {item.title}
          </Text>

          <View style={styles.hotNewsMetadata}>
            <View style={styles.timeContainer}>
              <Text
                style={[
                  styles.timeText,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {formatTimeAgo(item.publishedAt)}
              </Text>
            </View>

            <Text style={[styles.hotSourceText, { color: "#007AFF" }]}>
              {item.source?.name || "Sports News"}
            </Text>
          </View>
        </View>

        {item.urlToImage ? (
          <View style={styles.hotImageContainer}>
            <Image
              source={{ uri: item.urlToImage }}
              style={[
                styles.hotNewsImage,
                { backgroundColor: theme.colors.backgroundSecondary },
              ]}
              resizeMode="cover"
            />
            <View style={styles.hotCategoryBadge}>
              <Text style={styles.hotCategoryText}>{category}</Text>
            </View>
          </View>
        ) : null}
      </TouchableOpacity>
    );
  };

  if (isLoadingApi && hotNews.length === 0) {
    return (
      <View
        style={[
          styles.container,
          styles.centerContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
          Loading trending news...
        </Text>
      </View>
    );
  }

  if (error && hotNews.length === 0) {
    return (
      <View
        style={[
          styles.container,
          styles.centerContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <Text style={[styles.errorText, { color: theme.colors.textSecondary }]}>
          {error}
        </Text>
        <TouchableOpacity
          style={[styles.retryButton, { borderColor: theme.colors.primary }]}
          onPress={fetchHotNews}
        >
          <Text style={[styles.retryButtonText, { color: theme.colors.primary }]}>
            Retry
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (hotNews.length === 0) {
    return (
      <View
        style={[
          styles.container,
          styles.centerContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
          No trending news available at the moment.
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View
        style={[
          styles.hotHeader,
          {
            backgroundColor: theme.colors.background,
            borderBottomColor:
              theme.colors.border || "rgba(255, 255, 255, 0.1)",
          },
        ]}
      >
        <View style={styles.hotTitleContainer}>
          <Flame size={20} color="#FF3B30" />
          <Text style={[styles.hotHeaderTitle, { color: theme.colors.text }]}>
            Trending Now
          </Text>
        </View>
        <Text
          style={[
            styles.hotHeaderSubtitle,
            { color: theme.colors.textSecondary },
          ]}
        >
          Most viewed sports news today
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { backgroundColor: theme.colors.background },
        ]}
      >
        {hotNews.map(renderHotNewsItem)}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  hotHeader: {
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  hotTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  hotHeaderTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginLeft: 8,
  },
  hotHeaderSubtitle: {
    fontSize: 13,
    marginLeft: 28,
  },
  scrollContent: {
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  hotNewsItem: {
    flexDirection: "row",
    paddingVertical: 14,
    borderBottomWidth: 0.5,
  },
  hotNewsContent: {
    flex: 1,
    marginRight: 12,
  },
  hotNewsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  liveIndicator: {
    backgroundColor: "#FF3B30",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  liveText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "bold",
  },
  hotRanking: {
    backgroundColor: "rgba(255, 59, 48, 0.1)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  hotRankText: {
    fontSize: 10,
    fontWeight: "bold",
  },
  hotNewsTitle: {
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 20,
    marginBottom: 8,
  },
  hotNewsMetadata: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  viewsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  viewsText: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: "500",
  },
  hotCommentsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  hotCommentsText: {
    fontSize: 12,
    marginLeft: 4,
  },
  hotSourceText: {
    fontSize: 12,
    fontWeight: "500",
  },
  hotImageContainer: {
    position: "relative",
  },
  hotNewsImage: {
    width: 90,
    height: 70,
    borderRadius: 8,
  },
  hotCategoryBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  hotCategoryText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "500",
  },
});
