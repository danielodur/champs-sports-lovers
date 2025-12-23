/**
 * Player Moments Component
 * Fetches and displays player-related news and team-related moments
 * Matches Chinese app design with clean list layout
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "@/hooks/useTheme";
import { newsService } from "@/modules/news/services/newsService";

interface PlayerMoment {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  timestamp: string;
  publishedAt: string;
  source: string;
  url: string;
  category: "news" | "highlight" | "award" | "transfer";
}

interface PlayerMomentsProps {
  playerId: string;
  playerName: string;
  teamName: string;
  theme: any;
  sport?: string; // ✅ Sport parameter (basketball/football)
}

export default function PlayerMoments({
  playerId,
  playerName,
  teamName,
  theme,
  sport = "football", // ✅ Default to football
}: PlayerMomentsProps) {
  const isBasketball = sport === "basketball";
  console.log(`🏀⚽ [PlayerMoments] Sport: ${sport}, isBasketball: ${isBasketball}`);
  const router = useRouter();
  // Initialize with empty array for instant display
  const [moments, setMoments] = useState<PlayerMoment[]>([]);
  const [isLoadingApi, setIsLoadingApi] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDarkMode = theme.colors.background === "#2A2A2A";

  // Format timestamp to relative time (e.g., "2 hours ago", "Yesterday")
  const formatTimeAgo = useCallback((dateString: string): string => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);

      if (diffDays > 1) {
        return `${diffDays} days ago`;
      } else if (diffDays === 1) {
        return "Yesterday";
      } else if (diffHours > 0) {
        return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
      } else if (diffMinutes > 0) {
        return `${diffMinutes} minute${diffMinutes > 1 ? "s" : ""} ago`;
      } else {
        return "Just now";
      }
    } catch {
      return "Recently";
    }
  }, []);

  // Fetch player and team-related news - non-blocking
  const fetchMoments = useCallback(async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setIsLoadingApi(true);
      }
      setError(null);

      console.log(`🔍 Fetching moments for player: ${playerName}, team: ${teamName}`);
      
      // Create multiple search queries for better API compatibility
      // Some APIs don't handle OR queries well, so we'll search multiple variations
      const playerQueries = [
        `${playerName} football`,
        `${playerName} soccer`,
        `${playerName}`,
      ];
      
      const teamQueries = [
        `${teamName} football`,
        `${teamName} soccer`,
        `${teamName}`,
      ];
      
      // Fetch news related to player name with multiple queries
      console.log(`🔍 Searching player news with queries: ${playerQueries.join(', ')}`);
      const playerNewsPromises = playerQueries.map(query => 
        newsService.searchNews(query, 10).catch(err => {
          console.log(`⚠️ Player search failed for "${query}":`, err.message);
          return [];
        })
      );
      const playerNewsResults = await Promise.all(playerNewsPromises);
      const playerNews = playerNewsResults.flat();
      console.log(`✅ Found ${playerNews.length} player news articles`);
      
      // Fetch news related to team name with multiple queries
      console.log(`🔍 Searching team news with queries: ${teamQueries.join(', ')}`);
      const teamNewsPromises = teamQueries.map(query => 
        newsService.searchNews(query, 10).catch(err => {
          console.log(`⚠️ Team search failed for "${query}":`, err.message);
          return [];
        })
      );
      const teamNewsResults = await Promise.all(teamNewsPromises);
      const teamNews = teamNewsResults.flat();
      console.log(`✅ Found ${teamNews.length} team news articles`);

      // Combine and filter news
      const allNews = [...playerNews, ...teamNews];
      console.log(`📊 Total articles before deduplication: ${allNews.length}`);

      // Remove duplicates based on URL or ID (more reliable than title)
      const uniqueNews = allNews.filter((article, index, self) => {
        const articleKey = (article.url && article.url !== '#') 
          ? article.url 
          : article.id || `${article.title}-${article.publishedAt}`;
        
        return (
          index ===
          self.findIndex(
            (a) => {
              const aKey = (a.url && a.url !== '#') 
                ? a.url 
                : a.id || `${a.title}-${a.publishedAt}`;
              return aKey === articleKey;
            }
          )
        );
      });
      console.log(`📊 Unique articles after deduplication: ${uniqueNews.length}`);

      // More flexible filtering - check for player name variations and team
      // If we have team news, be more lenient - show team-related news even without player name
      const relevantNews = uniqueNews.filter((article) => {
        const titleLower = article.title.toLowerCase();
        const descLower = (article.description || "").toLowerCase();
        const contentLower = (article.content || "").toLowerCase();
        
        // Extract first and last name parts for flexible matching
        const nameParts = playerName.toLowerCase().split(/\s+/).filter(p => p.length > 1);
        const teamNameLower = teamName.toLowerCase();
        
        // Check if any name part appears (for cases like "Q. Hartman" vs "Hartman")
        const hasPlayerName = nameParts.some(part => 
          titleLower.includes(part) || 
          descLower.includes(part) || 
          contentLower.includes(part)
        );
        
        // Check for team name (more flexible - check partial matches)
        const teamWords = teamNameLower.split(/\s+/).filter(w => w.length > 2);
        const hasTeamName = teamWords.some(word => 
          titleLower.includes(word) || 
          descLower.includes(word) ||
          contentLower.includes(word)
        ) || titleLower.includes(teamNameLower) || 
           descLower.includes(teamNameLower) ||
           contentLower.includes(teamNameLower);
        
        // Also check if it's sports-related (football, soccer, etc.)
        const isSportsRelated = titleLower.includes('football') || 
                               titleLower.includes('soccer') ||
                               titleLower.includes('player') ||
                               titleLower.includes('match') ||
                               titleLower.includes('game') ||
                               descLower.includes('football') ||
                               descLower.includes('soccer');
        
        // Include if it has player name, team name, or is sports-related
        // Be more lenient - if we searched for team news, include it
        return hasPlayerName || hasTeamName || isSportsRelated;
      });
      
      console.log(`📊 Relevant articles after filtering: ${relevantNews.length}`);

      // Transform to PlayerMoment format
      const transformedMoments: PlayerMoment[] = relevantNews
        .slice(0, 20) // Limit to 20 most relevant
        .map((article, index) => {
          // Determine category based on content
          let category: "news" | "highlight" | "award" | "transfer" = "news";
          const titleLower = article.title.toLowerCase();
          const descLower = (article.description || "").toLowerCase();

          if (
            titleLower.includes("transfer") ||
            titleLower.includes("sign") ||
            titleLower.includes("deal") ||
            descLower.includes("transfer")
          ) {
            category = "transfer";
          } else if (
            titleLower.includes("goal") ||
            titleLower.includes("score") ||
            titleLower.includes("highlight") ||
            descLower.includes("goal")
          ) {
            category = "highlight";
          } else if (
            titleLower.includes("award") ||
            titleLower.includes("trophy") ||
            titleLower.includes("prize") ||
            descLower.includes("award")
          ) {
            category = "award";
          }

          return {
            id: article.id || `moment-${index}-${Date.now()}`,
            title: article.title,
            description: article.description || "",
            imageUrl: article.urlToImage || "",
            timestamp: formatTimeAgo(article.publishedAt),
            publishedAt: article.publishedAt,
            source: article.source?.name || "Sports News",
            url: article.url,
            category,
          };
        })
        .sort((a, b) => {
          // Sort by published date (newest first)
          return (
            new Date(b.publishedAt).getTime() -
            new Date(a.publishedAt).getTime()
          );
        });

      console.log(`✅ Successfully transformed ${transformedMoments.length} moments`);
      setMoments(transformedMoments);
      
      // If no moments found, log detailed info for debugging
      if (transformedMoments.length === 0) {
        console.warn(`⚠️ No moments found for player: ${playerName}, team: ${teamName}`);
        console.warn(`📊 Debug info: playerNews=${playerNews.length}, teamNews=${teamNews.length}, uniqueNews=${uniqueNews.length}, relevantNews=${relevantNews.length}`);
      }
    } catch (err) {
      console.error("❌ Error fetching player moments:", err);
      setError(err instanceof Error ? err.message : "Failed to load moments");
      setMoments([]);
    } finally {
      setIsLoadingApi(false);
      setRefreshing(false);
    }
  }, [playerName, teamName, formatTimeAgo]);

  useEffect(() => {
    if (playerName && teamName) {
      fetchMoments();
    }
  }, [playerName, teamName, fetchMoments]);

  const handleMomentPress = (moment: PlayerMoment) => {
    console.log(`🚀 [PlayerMoments] Navigating to news-detail with article: "${moment.title}"`);
    
    // Format article data to match the official news detail screen format
    const validArticle = {
      id: moment.id || `news-${Date.now()}`,
      title: moment.title || "Untitled",
      description: moment.description || "",
      urlToImage: moment.imageUrl || "",
      publishedAt: moment.publishedAt || moment.timestamp || new Date().toISOString(),
      source: typeof moment.source === 'string' 
        ? { name: moment.source, id: "sports" }
        : moment.source || { name: "Sports News", id: "sports" },
      url: moment.url || "#",
      content: moment.description || "",
      category: moment.category || "sports",
    };

    router.push({
      pathname: "/news/news-detail",
      params: { data: JSON.stringify(validArticle) },
    });
  };

  // Show error only if we have error AND no data AND not loading
  if (error && moments.length === 0 && !isLoadingApi) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.colors.textSecondary }]}>
            {error}
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => fetchMoments()}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Show empty state only if no data and not loading
  if (moments.length === 0 && !isLoadingApi && !error) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            No moments available
          </Text>
          <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>
            Check back later for updates about {playerName}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => fetchMoments(true)}
          tintColor="#FF3B30"
        />
      }
    >
      {moments.map((moment) => (
        <TouchableOpacity
          key={moment.id}
          style={[
            styles.momentItem,
            {
              borderBottomColor: isDarkMode
                ? "rgba(255, 255, 255, 0.1)"
                : "rgba(0, 0, 0, 0.1)",
            },
          ]}
          onPress={() => handleMomentPress(moment)}
          activeOpacity={0.7}
        >
          <View style={styles.momentContent}>
            <Text
              style={[styles.momentTitle, { color: theme.colors.text }]}
              numberOfLines={2}
            >
              {moment.title}
            </Text>
            <Text
              style={[styles.momentTimestamp, { color: theme.colors.textSecondary }]}
            >
              {moment.timestamp}
            </Text>
          </View>
          {moment.imageUrl ? (
            <Image
              source={{ uri: moment.imageUrl }}
              style={styles.momentImage}
              resizeMode="cover"
            />
          ) : (
            <View
              style={[
                styles.momentImagePlaceholder,
                {
                  backgroundColor: isDarkMode
                    ? "rgba(255, 255, 255, 0.1)"
                    : "rgba(0, 0, 0, 0.1)",
                },
              ]}
            />
          )}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 100,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: "Inter-Medium",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 100,
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
    fontFamily: "Inter-Regular",
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "#FF3B30",
    borderRadius: 8,
  },
  retryButtonText: {
    color: "white",
    fontSize: 14,
    fontFamily: "Inter-SemiBold",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 100,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 8,
    fontFamily: "Inter-Medium",
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: "center",
    fontFamily: "Inter-Regular",
  },
  momentItem: {
    flexDirection: "row",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  momentContent: {
    flex: 1,
    marginRight: 12,
    justifyContent: "center",
  },
  momentTitle: {
    fontSize: 15,
    fontWeight: "500",
    fontFamily: "Inter-Medium",
    lineHeight: 20,
    marginBottom: 6,
  },
  momentTimestamp: {
    fontSize: 12,
    fontFamily: "Inter-Regular",
  },
  momentImage: {
    width: 90,
    height: 90,
    borderRadius: 8,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
  },
  momentImagePlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 8,
  },
});

