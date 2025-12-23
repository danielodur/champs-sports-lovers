import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "@/hooks/useTheme";
import { ChevronRight, Play } from "lucide-react-native";
import { backendApiService } from "@/services/backendApiService";

const { width: screenWidth } = Dimensions.get("window");
const CARD_WIDTH = screenWidth * 0.7;
const CARD_MARGIN = 12;

interface MatchPreviewNewsProps {
  homeTeamName: string;
  awayTeamName: string;
  leagueName: string;
  matchId?: string;
}

interface NewsArticle {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  videoUrl?: string;
  source: string;
  publishedAt: string;
  url: string;
  isVideo?: boolean;
}

export default function MatchPreviewNews({
  homeTeamName,
  awayTeamName,
  leagueName,
  matchId,
}: MatchPreviewNewsProps) {
  const theme = useTheme();
  const router = useRouter();
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log(`📰 MatchPreviewNews mounted for: ${homeTeamName} vs ${awayTeamName}`);
    loadMatchNews();
  }, [homeTeamName, awayTeamName, leagueName]);

  const loadMatchNews = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build comprehensive search query for match-related news
      const searchQueries = [
        `${homeTeamName} ${awayTeamName}`,
        `${homeTeamName} vs ${awayTeamName}`,
        homeTeamName,
        awayTeamName,
        leagueName,
      ];

      console.log(`📰 Loading match preview news for: ${homeTeamName} vs ${awayTeamName}`);

      // Fetch news from multiple sources in parallel
      const newsPromises = searchQueries.map((query) =>
        backendApiService.searchNews(query, 5).catch((err) => {
          console.warn(`📰 Failed to fetch news for query "${query}":`, err.message || err);
          return [];
        })
      );

      // Also fetch sports news
      const sportsNewsPromise = backendApiService
        .getSportsNews("football", 10)
        .catch((err) => {
          console.warn(`📰 Failed to fetch sports news:`, err.message || err);
          return [];
        });

      const results = await Promise.all([...newsPromises, sportsNewsPromise]);

      // Flatten and deduplicate news articles
      const allNews = results.flat();
      const uniqueNews = Array.from(
        new Map(
          allNews.map((article: any) => [
            article.url || article.title,
            transformNewsArticle(article),
          ])
        ).values()
      );

      // Filter for hot/relevant news related to the match
      const relevantNews = uniqueNews.filter((article) =>
        isRelevantToMatch(article, homeTeamName, awayTeamName, leagueName)
      );

      // Sort by relevance and date
      const sortedNews = relevantNews.sort((a, b) => {
        const aRelevance = getRelevanceScore(a, homeTeamName, awayTeamName);
        const bRelevance = getRelevanceScore(b, homeTeamName, awayTeamName);
        if (aRelevance !== bRelevance) return bRelevance - aRelevance;
        return (
          new Date(b.publishedAt).getTime() -
          new Date(a.publishedAt).getTime()
        );
      });

      // Limit to top 10 most relevant articles
      setNews(sortedNews.slice(0, 10));
      console.log(`📰 Found ${sortedNews.length} relevant news articles`);
      if (sortedNews.length === 0) {
        console.log(`📰 No relevant news found for ${homeTeamName} vs ${awayTeamName} - hiding section`);
      }
    } catch (err) {
      // Silently handle errors - just log as warning and hide section
      console.warn("📰 Failed to load match news - section will be hidden:", err instanceof Error ? err.message : err);
      setError(null); // Don't show error to user
      setNews([]);
    } finally {
      setLoading(false);
    }
  };

  const transformNewsArticle = (article: any): NewsArticle => {
    return {
      id: article.url || article.title || Math.random().toString(),
      title: article.title || "Untitled",
      description: article.description || article.content || "",
      imageUrl: article.urlToImage || article.image || article.thumbnail,
      videoUrl: article.videoUrl,
      source: article.source?.name || article.source || "Unknown Source",
      publishedAt: article.publishedAt || article.date || new Date().toISOString(),
      url: article.url || "",
      isVideo: !!(article.videoUrl || article.type === "video"),
    };
  };

  const isRelevantToMatch = (
    article: NewsArticle,
    homeTeam: string,
    awayTeam: string,
    league: string
  ): boolean => {
    const searchText = `${article.title} ${article.description}`.toLowerCase();
    const homeTeamLower = homeTeam.toLowerCase();
    const awayTeamLower = awayTeam.toLowerCase();
    const leagueLower = league.toLowerCase();

    // Check if article mentions either team or the league
    return (
      searchText.includes(homeTeamLower) ||
      searchText.includes(awayTeamLower) ||
      searchText.includes(leagueLower) ||
      searchText.includes("preview") ||
      searchText.includes("prediction") ||
      searchText.includes("lineup") ||
      searchText.includes("injury") ||
      searchText.includes("team news")
    );
  };

  const getRelevanceScore = (
    article: NewsArticle,
    homeTeam: string,
    awayTeam: string
  ): number => {
    const searchText = `${article.title} ${article.description}`.toLowerCase();
    let score = 0;

    // Bonus for mentioning both teams
    if (
      searchText.includes(homeTeam.toLowerCase()) &&
      searchText.includes(awayTeam.toLowerCase())
    ) {
      score += 10;
    }

    // Bonus for preview/prediction keywords
    if (searchText.includes("preview")) score += 5;
    if (searchText.includes("prediction")) score += 5;
    if (searchText.includes("vs") || searchText.includes("versus")) score += 3;
    if (searchText.includes("lineup")) score += 4;
    if (searchText.includes("injury")) score += 3;
    if (searchText.includes("team news")) score += 4;

    // Bonus for video content
    if (article.isVideo) score += 2;

    // Bonus for recent articles (last 7 days)
    const daysOld =
      (Date.now() - new Date(article.publishedAt).getTime()) /
      (1000 * 60 * 60 * 24);
    if (daysOld <= 7) score += 3;
    if (daysOld <= 3) score += 2;
    if (daysOld <= 1) score += 3;

    return score;
  };

  const handleViewAll = () => {
    // Navigate to full news screen with match context
    router.push({
      pathname: "/news",
      params: {
        query: `${homeTeamName} ${awayTeamName}`,
        matchId,
      },
    });
  };

  const handleArticlePress = (article: NewsArticle) => {
    // Navigate to article detail or open in browser
    console.log("Opening article:", article.title);
    // You can implement navigation to article detail screen here
  };

  // Check if we have news to display
  const hasNews = !loading && !error && news.length > 0;
  
  // If no news and not loading, hide the entire section
  if (!loading && !hasNews) {
    console.log(`📰 MatchPreviewNews: No news available - section hidden`);
    return null;
  }

  return (
    <>
      {/* Only show separators and content when we have news or are loading */}
      {hasNews && <View style={styles.topSeparator} />}

      {/* News Content - Only show if available */}
      {hasNews && (
        <View style={styles.container}>
          {/* Preview Header */}
          <View style={styles.header}>
            <View style={styles.previewBadge}>
              <Text style={styles.previewText}>Preview</Text>
            </View>
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={handleViewAll}
              activeOpacity={0.7}
            >
              <Text style={[styles.viewAllText, { color: theme.colors.textSecondary }]}>
                View All
              </Text>
              <ChevronRight size={16} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Horizontal Scrollable News Cards */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            snapToInterval={CARD_WIDTH + CARD_MARGIN * 2}
            decelerationRate="fast"
          >
            {news.map((article, index) => (
          <TouchableOpacity
            key={article.id}
            style={[
              styles.newsCard,
              index === 0 && styles.firstCard,
              index === news.length - 1 && styles.lastCard,
            ]}
            onPress={() => handleArticlePress(article)}
            activeOpacity={0.8}
          >
            {/* Image/Video Container */}
            <View style={styles.mediaContainer}>
              {article.imageUrl ? (
                <Image
                  source={{ uri: article.imageUrl }}
                  style={styles.newsImage}
                  resizeMode="cover"
                />
              ) : (
                <View
                  style={[
                    styles.placeholderImage,
                    { backgroundColor: theme.colors.backgroundSecondary },
                  ]}
                >
                  <Text style={styles.placeholderText}>📰</Text>
                </View>
              )}

              {/* Video Play Button Overlay */}
              {article.isVideo && (
                <View style={styles.videoOverlay}>
                  <View style={styles.playButton}>
                    <Play size={24} color="#FFFFFF" fill="#FFFFFF" />
                  </View>
                </View>
              )}

              {/* Source Badge */}
              <View style={styles.sourceBadge}>
                <Text style={styles.sourceText} numberOfLines={1}>
                  {article.source}
                </Text>
              </View>
            </View>

            {/* Content Container */}
            <View style={styles.contentContainer}>
              <Text
                style={[styles.newsTitle, { color: theme.colors.text }]}
                numberOfLines={2}
              >
                {article.title}
              </Text>
              <Text
                style={[styles.newsDescription, { color: theme.colors.textSecondary }]}
                numberOfLines={2}
              >
                {article.description}
              </Text>
              <Text
                style={[styles.newsDate, { color: theme.colors.textSecondary }]}
              >
                {formatDate(article.publishedAt)}
              </Text>
            </View>
          </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Bottom Separator - Only show when we have news */}
      {hasNews && <View style={styles.bottomSeparator} />}
    </>
  );
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

const styles = StyleSheet.create({
  topSeparator: {
    height: 4,
    backgroundColor: "#1A1A1A", // Dark separator like Chinese app
    marginVertical: 0,
  },
  bottomSeparator: {
    height: 4,
    backgroundColor: "#1A1A1A", // Dark separator like Chinese app
    marginVertical: 0,
  },
  container: {
    marginVertical: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  previewBadge: {
    backgroundColor: "#FFE5E5",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#FF4444",
  },
  previewText: {
    color: "#FF4444",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: "600",
  },
  scrollContent: {
    paddingRight: 16,
  },
  newsCard: {
    width: CARD_WIDTH,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginHorizontal: CARD_MARGIN,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: "hidden",
  },
  firstCard: {
    marginLeft: 16,
  },
  lastCard: {
    marginRight: 0,
  },
  mediaContainer: {
    position: "relative",
    width: "100%",
    height: 180,
    backgroundColor: "#F0F0F0",
  },
  newsImage: {
    width: "100%",
    height: "100%",
  },
  placeholderImage: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    fontSize: 48,
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255, 68, 68, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  sourceBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    maxWidth: CARD_WIDTH * 0.5,
  },
  sourceText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
  },
  contentContainer: {
    padding: 16,
  },
  newsTitle: {
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 22,
    marginBottom: 8,
  },
  newsDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  newsDate: {
    fontSize: 11,
    fontWeight: "500",
  },
});

