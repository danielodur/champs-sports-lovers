import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Trophy, Clock } from "lucide-react-native";
import { useTheme } from "@/hooks/useTheme";
import { NewsArticle } from "../../../../types";
import { newsService } from "../../../../services/newsService";

interface NewsFifaProps {}

export default function NewsFifa({}: NewsFifaProps) {
  const router = useRouter();
  const theme = useTheme();
  // Initialize with empty array for instant display
  const [fifaNews, setFifaNews] = useState<NewsArticle[]>([]);
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

  const fetchFifaNews = async () => {
    try {
      setIsLoadingApi(true);
      setError(null);

      console.log("🔍 Fetching FIFA news...");

      const searchQueries = [
        "FIFA",
        "World Cup",
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
          newsService.searchNews(query, 8).catch((err) => {
            console.log(`⚠️ FIFA search failed for "${query}":`, err.message);
            return [];
          }),
          4000
        )
      );
      const newsResults = await Promise.allSettled(newsPromises);
      const allNews = newsResults
        .filter((result) => result.status === 'fulfilled')
        .flatMap((result) => (result as PromiseFulfilledResult<NewsArticle[]>).value);

      // Deduplicate
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

      // Filter for FIFA-related content
      const fifaKeywords = [
        "fifa",
        "world cup",
        "international",
        "qualifiers",
        "confederations",
        "qatar",
        "messi",
        "ronaldo",
      ];

      const relevantNews = uniqueNews.filter((article) => {
        const titleLower = article.title.toLowerCase();
        const descLower = (article.description || "").toLowerCase();
        return fifaKeywords.some(
          (keyword) =>
            titleLower.includes(keyword) || descLower.includes(keyword)
        );
      });

      // Sort by date and limit
      const sortedNews = relevantNews
        .sort(
          (a, b) =>
            new Date(b.publishedAt).getTime() -
            new Date(a.publishedAt).getTime()
        )
        .slice(0, 15);

      setFifaNews(sortedNews);
    } catch (err) {
      console.error("❌ Error fetching FIFA news:", err);
      setError(err instanceof Error ? err.message : "Failed to load news");
      setFifaNews([]);
    } finally {
      setIsLoadingApi(false);
    }
  };

  useEffect(() => {
    // Fetch immediately in background - don't block UI
    fetchFifaNews();
  }, []);

  if (error || fifaNews.length === 0) {
    return (
      <View
        style={[
          styles.newsSection,
          { backgroundColor: theme.colors.backgroundSecondary },
        ]}
      >
        <View style={styles.sectionHeader}>
          <View style={styles.titleContainer}>
            <Trophy size={16} color={theme.colors.primary} />
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              FIFA Official News
            </Text>
          </View>
        </View>
        <View style={styles.emptyContainer}>
          <Trophy size={48} color={theme.colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
            No FIFA News Available
          </Text>
          <Text
            style={[styles.emptyText, { color: theme.colors.textSecondary }]}
          >
            {error || "Check back later for the latest FIFA updates"}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.newsSection,
        { backgroundColor: theme.colors.backgroundSecondary },
      ]}
    >
      <View style={styles.sectionHeader}>
        <View style={styles.titleContainer}>
          <Trophy size={16} color={theme.colors.primary} />
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            FIFA Official News
          </Text>
        </View>
      </View>

      <View style={styles.newsList}>
        {fifaNews.map((article) => (
          <TouchableOpacity
            key={article.id}
            style={[
              styles.newsItem,
              { borderBottomColor: theme.colors.border },
            ]}
            onPress={() => {
              console.log(`🚀 [FIFA] Navigating to news-detail with article: "${article.title}"`);
              
              const validArticle = {
                id: article.id || `news-${Date.now()}`,
                title: article.title || "Untitled",
                description: article.description || "",
                urlToImage: article.urlToImage || "",
                publishedAt: article.publishedAt || new Date().toISOString(),
                source: article.source || { name: "Sports News", id: "sports" },
                url: article.url || "#",
                content: article.content || "",
                category: article.category || "sports",
              };

              router.push({
                pathname: "/news/news-detail",
                params: { data: JSON.stringify(validArticle) },
              });
            }}
          >
            <View style={styles.newsContent}>
              <Image
                source={{ uri: article.urlToImage }}
                style={styles.newsImage}
                resizeMode="cover"
              />
              <View style={styles.newsTextContent}>
                <View style={styles.fifaHeaderContainer}>
                  <Text
                    style={[styles.newsTitle, { color: theme.colors.text }]}
                    numberOfLines={2}
                  >
                    {article.title}
                  </Text>
                </View>
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
                      FIFA Official
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
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
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
  fifaHeaderContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  newsTitle: {
    fontSize: 14,
    fontFamily: "Inter-SemiBold",
    lineHeight: 18,
    flex: 1,
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
});
