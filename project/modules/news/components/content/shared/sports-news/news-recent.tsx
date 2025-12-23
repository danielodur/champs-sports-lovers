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
import { Clock, MessageCircle } from "lucide-react-native";
import { newsService } from "../../../../services/newsService";
import { NewsArticle } from "../../../../types";

interface NewsRecentProps {}

export default function NewsRecent({}: NewsRecentProps) {
  const theme = useTheme();
  const router = useRouter();
  // Initialize with empty array for instant display
  const [recentNews, setRecentNews] = useState<NewsArticle[]>([]);
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
    fetchRecentNews();
  }, []);

  const fetchRecentNews = async () => {
    try {
      setIsLoadingApi(true);
      setError(null);

      console.log("🔍 Fetching recent sports news...");

      const searchQueries = [
        "sports news",
        "football news",
      ];

      console.log(`🔍 Searching with ${searchQueries.length} queries...`);
      
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

      // Sort by published date (most recent first) and limit to 15
      const sortedNews = relevantNews
        .sort((a, b) => {
          return (
            new Date(b.publishedAt).getTime() -
            new Date(a.publishedAt).getTime()
          );
        })
        .slice(0, 15);

      console.log(`✅ Successfully transformed ${sortedNews.length} news items`);
      setRecentNews(sortedNews);
    } catch (err) {
      console.error("❌ Error fetching recent news:", err);
      setError(err instanceof Error ? err.message : "Failed to load news");
      setRecentNews([]);
    } finally {
      setIsLoadingApi(false);
    }
  };

  const renderNewsItem = (item: NewsArticle) => (
    <TouchableOpacity
      key={item.id}
      style={[
        styles.newsItem,
        {
          borderBottomColor: theme.colors.border || "rgba(255, 255, 255, 0.1)",
          backgroundColor: theme.colors.background,
        },
      ]}
      activeOpacity={0.7}
      onPress={() => {
        console.log(`🚀 [NewsRecent] Navigating to news-detail with article: "${item.title}"`);
        
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
      <View style={styles.newsContent}>
        <Text style={[styles.newsTitle, { color: theme.colors.text }]}>
          {item.title}
        </Text>

        <View style={styles.newsMetadata}>
          <View style={styles.timeContainer}>
            <Clock size={12} color={theme.colors.textSecondary} />
            <Text
              style={[styles.timeText, { color: theme.colors.textSecondary }]}
            >
              {formatTimeAgo(item.publishedAt)}
            </Text>
          </View>

          <Text style={[styles.sourceText, { color: "#007AFF" }]}>
            {item.source?.name || "Sports News"}
          </Text>
        </View>
      </View>

      {item.urlToImage ? (
        <Image
          source={{ uri: item.urlToImage }}
          style={[
            styles.newsImage,
            { backgroundColor: theme.colors.backgroundSecondary },
          ]}
          resizeMode="cover"
        />
      ) : null}
    </TouchableOpacity>
  );

  if (isLoadingApi && recentNews.length === 0) {
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
          Loading recent news...
        </Text>
      </View>
    );
  }

  if (error && recentNews.length === 0) {
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
          onPress={fetchRecentNews}
        >
          <Text style={[styles.retryButtonText, { color: theme.colors.primary }]}>
            Retry
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (recentNews.length === 0) {
    return (
      <View
        style={[
          styles.container,
          styles.centerContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
          No recent news available at the moment.
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { backgroundColor: theme.colors.background },
        ]}
      >
        {recentNews.map(renderNewsItem)}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  newsItem: {
    flexDirection: "row",
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  newsContent: {
    flex: 1,
    marginRight: 12,
  },
  newsTitle: {
    fontSize: 15,
    fontWeight: "500",
    lineHeight: 20,
    marginBottom: 8,
  },
  newsMetadata: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  timeText: {
    fontSize: 12,
    marginLeft: 4,
  },
  commentsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  commentsText: {
    fontSize: 12,
    marginLeft: 4,
  },
  sourceText: {
    fontSize: 12,
    fontWeight: "500",
  },
  newsImage: {
    width: 80,
    height: 60,
    borderRadius: 6,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
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
  emptyText: {
    fontSize: 14,
    textAlign: "center",
  },
});
