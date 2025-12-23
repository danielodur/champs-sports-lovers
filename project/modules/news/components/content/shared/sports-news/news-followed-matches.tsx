import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Star, Clock } from "lucide-react-native";
import { useTheme } from "@/hooks/useTheme";
import { NewsArticle } from "../../../../types";
import { newsService } from "../../../../services/newsService";
import favoritesService from "@/services/favoritesService";

interface NewsFollowedMatchesProps {
  onRefresh?: () => void;
}

export default function NewsFollowedMatches({
  onRefresh,
}: NewsFollowedMatchesProps) {
  const router = useRouter();
  const theme = useTheme();
  // Initialize with empty array for instant display
  const [followsNews, setFollowsNews] = useState<NewsArticle[]>([]);
  const [isLoadingApi, setIsLoadingApi] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasFollowedMatches, setHasFollowedMatches] = useState(false);

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
    fetchFollowedMatchesNews();
  }, []);

  useEffect(() => {
    if (onRefresh) {
      // Refresh when parent component requests it
      fetchFollowedMatchesNews();
    }
  }, [onRefresh]);

  const fetchFollowedMatchesNews = async () => {
    try {
      setIsLoadingApi(true);
      setError(null);

      console.log("🔍 Fetching news for followed matches...");

      // Get followed matches
      const favorites = await favoritesService.getFavorites();
      
      if (!favorites || favorites.length === 0) {
        setHasFollowedMatches(false);
        setFollowsNews([]);
        setLoading(false);
        return;
      }

      setHasFollowedMatches(true);

      // Extract team names and league names from followed matches
      const teamNames: string[] = [];
      const leagueNames: string[] = [];

      favorites.forEach((fav) => {
        if (fav.homeTeam && !teamNames.includes(fav.homeTeam)) {
          teamNames.push(fav.homeTeam);
        }
        if (fav.awayTeam && !teamNames.includes(fav.awayTeam)) {
          teamNames.push(fav.awayTeam);
        }
        if (fav.league && !leagueNames.includes(fav.league)) {
          leagueNames.push(fav.league);
        }
      });

      console.log(`📊 Found ${teamNames.length} teams and ${leagueNames.length} leagues in followed matches`);

      // Build search queries from team and league names
      const searchQueries: string[] = [];
      
      // Add team-specific queries (limit to first 2 teams to reduce queries)
      teamNames.slice(0, 2).forEach((team) => {
        searchQueries.push(`${team} football`);
      });

      // Add league-specific queries (limit to 1 league)
      if (leagueNames.length > 0) {
        searchQueries.push(`${leagueNames[0]} news`);
      }

      // If no specific queries, use general followed matches queries
      if (searchQueries.length === 0) {
        searchQueries.push("followed matches news");
        searchQueries.push("football news");
      }

      // Limit to max 3 queries
      const limitedQueries = searchQueries.slice(0, 3);

      console.log(`🔍 Searching with ${limitedQueries.length} queries for followed matches...`);

      // Add timeout wrapper
      const createTimeoutPromise = (promise: Promise<NewsArticle[]>, timeoutMs: number) => {
        return Promise.race([
          promise,
          new Promise<NewsArticle[]>((resolve) => setTimeout(() => resolve([]), timeoutMs))
        ]);
      };

      // Fetch news using all queries with timeout
      const newsPromises = limitedQueries.map((query) =>
        createTimeoutPromise(
          newsService.searchNews(query, 6).catch((err) => {
            console.log(`⚠️ Followed matches search failed for "${query}":`, err.message);
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

      // Filter for relevance to followed teams/leagues
      const relevantNews = uniqueNews.filter((article) => {
        const titleLower = article.title.toLowerCase();
        const descLower = (article.description || "").toLowerCase();
        
        // Check if article mentions any followed team or league
        const mentionsTeam = teamNames.some((team) => {
          const teamLower = team.toLowerCase();
          return titleLower.includes(teamLower) || descLower.includes(teamLower);
        });
        
        const mentionsLeague = leagueNames.some((league) => {
          const leagueLower = league.toLowerCase();
          return titleLower.includes(leagueLower) || descLower.includes(leagueLower);
        });

        // Also include general football/sports news
        const isSportsRelated = 
          titleLower.includes("football") ||
          titleLower.includes("soccer") ||
          titleLower.includes("match") ||
          titleLower.includes("game") ||
          descLower.includes("football") ||
          descLower.includes("soccer");

        return mentionsTeam || mentionsLeague || isSportsRelated;
      });

      // Sort by date and limit
      const sortedNews = relevantNews
        .sort(
          (a, b) =>
            new Date(b.publishedAt).getTime() -
            new Date(a.publishedAt).getTime()
        )
        .slice(0, 15);

      console.log(`✅ Found ${sortedNews.length} relevant news articles for followed matches`);
      setFollowsNews(sortedNews);
    } catch (err) {
      console.error("❌ Error fetching followed matches news:", err);
      setError(err instanceof Error ? err.message : "Failed to load news");
      setFollowsNews([]);
    } finally {
      setIsLoadingApi(false);
    }
  };

  if (!hasFollowedMatches || followsNews.length === 0) {
    return (
      <View
        style={[
          styles.newsSection,
          { backgroundColor: theme.colors.backgroundSecondary },
        ]}
      >
        <View style={styles.emptyFollowsContainer}>
          <Star size={48} color={theme.colors.textSecondary} />
          <Text
            style={[styles.emptyFollowsTitle, { color: theme.colors.text }]}
          >
            Follow matches to get News
          </Text>
          <Text
            style={[
              styles.emptyFollowsText,
              { color: theme.colors.textSecondary },
            ]}
          >
            Follow matches to see related news and updates here
          </Text>
          <TouchableOpacity
            style={[
              styles.followButton,
              { backgroundColor: theme.colors.primary },
            ]}
            onPress={() => router.push("/(tabs)/")}
          >
            <Text style={styles.followButtonText}>Browse Matches</Text>
          </TouchableOpacity>
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
          <Star size={16} color={theme.colors.primary} />
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Followed Matches News
          </Text>
        </View>
      </View>

      <View style={styles.newsList}>
        {followsNews.map((article) => (
          <TouchableOpacity
            key={article.id}
            style={[
              styles.newsItem,
              { borderBottomColor: theme.colors.border },
            ]}
            onPress={() => {
              console.log(`🚀 [FollowedMatches] Navigating to news-detail with article: "${article.title}"`);
              
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
  // Empty state styles
  emptyFollowsContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyFollowsTitle: {
    fontSize: 18,
    fontFamily: "Inter-SemiBold",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyFollowsText: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
    textAlign: "center",
    marginBottom: 20,
  },
  followButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  followButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "Inter-SemiBold",
  },
});
