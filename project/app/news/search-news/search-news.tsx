import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Search, X, Clock, ChevronRight } from "lucide-react-native";
import { useTheme } from "../../../hooks/useTheme";
import { newsService, NewsArticle } from "../../../modules/news";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function SearchNewsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const params = useLocalSearchParams();
  const searchQuery = (params.query as string) || "";

  const [activeTab, setActiveTab] = useState<"all" | "player" | "manager" | "news">("news");
  const [searchInput, setSearchInput] = useState(searchQuery);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    console.log(`📱 [SearchNews] Mounted with query: "${searchQuery}"`);
    if (searchQuery && searchQuery.trim()) {
      performSearch(searchQuery);
    } else {
      // If no query, set loading to false to show empty state
      setLoading(false);
    }
  }, [searchQuery]);

  const performSearch = async (query: string, isRefreshing = false) => {
    if (!query.trim()) {
      console.warn(`⚠️ [SearchNews] Empty query provided`);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    console.log(`🔍 [SearchNews] Starting search for: "${query}"`);
    
    if (isRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setSearchInput(query);
    setNews([]); // Clear previous results

    try {
      // Search news using all 6 APIs via newsService with timeout
      const newsResults = await Promise.race([
        newsService.searchNews(query, 50),
        new Promise<NewsArticle[]>((resolve) => setTimeout(() => {
          console.warn(`⚠️ [SearchNews] Search timeout after 20s`);
          resolve([]);
        }, 20000)) // 20s timeout
      ]);
      
      console.log(`📊 [SearchNews] Raw results: ${newsResults.length} articles`);
      
      // Remove duplicates based on URL or title
      const uniqueNews = newsResults.filter((article, index, self) => {
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

      // Sort by published date (newest first)
      const sortedNews = uniqueNews.sort((a, b) => {
        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      });

      setNews(sortedNews);
      console.log(`✅ [SearchNews] Found ${sortedNews.length} unique news articles`);
    } catch (error: any) {
      console.error(`❌ [SearchNews] News search error:`, error?.message || error);
      setNews([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
      console.log(`✅ [SearchNews] Search completed for: "${query}"`);
    }
  };

  const handleSearch = () => {
    if (searchInput.trim()) {
      performSearch(searchInput.trim());
    }
  };

  const handleRefresh = () => {
    if (searchInput.trim()) {
      performSearch(searchInput.trim(), true);
    }
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays}d ago`;
    } else if (diffHours > 0) {
      return `${diffHours}h ago`;
    } else {
      return "Just now";
    }
  };

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    const parts = text.split(new RegExp(`(${query})`, "gi"));
    return parts.map((part, index) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <Text key={index} style={{ color: theme.colors.primary, fontWeight: "bold" }}>
          {part}
        </Text>
      ) : (
        part
      )
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={["top"]}>
      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: theme.colors.backgroundSecondary }]}>
        <View
          style={[
            styles.searchInputContainer,
            {
              backgroundColor: theme.colors.background,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Search size={20} color={theme.colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: theme.colors.text }]}
            placeholder="Search news"
            placeholderTextColor={theme.colors.textSecondary}
            value={searchInput}
            onChangeText={setSearchInput}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchInput.length > 0 && (
            <TouchableOpacity onPress={() => setSearchInput("")} style={styles.clearButton}>
              <X size={16} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity 
          style={styles.cancelButton} 
          onPress={() => {
            if (searchInput.trim().length > 0) {
              handleSearch();
            } else {
              router.back();
            }
          }}
        >
          <Text style={[styles.cancelText, { color: theme.colors.text }]}>
            {searchInput && searchInput.trim().length > 0 ? "Search" : "Cancel"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={[styles.tabsContainer, { backgroundColor: theme.colors.background }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "all" && styles.activeTab]}
          onPress={() => {
            router.push({
              pathname: "/news/search-news/search-all",
              params: { query: searchInput },
            });
          }}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === "all" ? theme.colors.primary : theme.colors.textSecondary },
            ]}
          >
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "player" && styles.activeTab]}
          onPress={() => {
            router.push({
              pathname: "/news/search-news/search-player",
              params: { query: searchInput },
            });
          }}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === "player" ? theme.colors.primary : theme.colors.textSecondary },
            ]}
          >
            Player
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "manager" && styles.activeTab]}
          onPress={() => {
            router.push({
              pathname: "/news/search-news/search-manager",
              params: { query: searchInput },
            });
          }}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === "manager" ? theme.colors.primary : theme.colors.textSecondary },
            ]}
          >
            Manager
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "news" && styles.activeTab]}
          onPress={() => setActiveTab("news")}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === "news" ? theme.colors.primary : theme.colors.textSecondary },
            ]}
          >
            News
          </Text>
          {activeTab === "news" && (
            <View style={[styles.tabIndicator, { backgroundColor: theme.colors.primary }]} />
          )}
        </TouchableOpacity>
      </View>

      {/* News Results */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.colors.primary} />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
              Searching news from multiple sources...
            </Text>
          </View>
        ) : news.length > 0 ? (
          <View style={styles.newsListContainer}>
            <View style={styles.newsList}>
              {news.map((article) => (
                <TouchableOpacity
                  key={article.id}
                  style={[styles.newsItem, { borderBottomColor: theme.colors.border }]}
                onPress={() => {
                  router.push({
                    pathname: "/news/news-detail",
                    params: { data: JSON.stringify(article) },
                  });
                }}
                activeOpacity={0.7}
              >
                <View style={styles.newsContent}>
                  <View style={styles.newsTextContent}>
                    <Text style={[styles.newsTitle, { color: theme.colors.text }]} numberOfLines={2}>
                      {highlightText(article.title, searchInput)}
                    </Text>
                    {article.description && (
                      <Text
                        style={[styles.newsDescription, { color: theme.colors.textSecondary }]}
                        numberOfLines={2}
                      >
                        {article.description}
                      </Text>
                    )}
                    <View style={styles.newsInfo}>
                      <Text style={[styles.newsSource, { color: theme.colors.primary }]}>
                        {article.source.name}
                      </Text>
                      <View style={styles.newsTime}>
                        <Clock size={12} color={theme.colors.textSecondary} />
                        <Text style={[styles.timeText, { color: theme.colors.textSecondary }]}>
                          {formatTimeAgo(article.publishedAt)}
                        </Text>
                      </View>
                    </View>
                  </View>
                  {article.urlToImage && (
                    <Image source={{ uri: article.urlToImage }} style={styles.newsThumbnail} />
                  )}
                </View>
              </TouchableOpacity>
            ))}
            </View>
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.colors.text }]}>No news found</Text>
            <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>
              Try searching with different keywords or check your spelling
            </Text>
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
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    paddingHorizontal: 12,
    height: 36,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter-Regular",
    padding: 0,
    height: "100%",
  },
  clearButton: {
    padding: 4,
  },
  cancelButton: {
    marginLeft: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  cancelText: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
  },
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    position: "relative",
  },
  activeTab: {
    // Active tab styling handled by text color
  },
  tabText: {
    fontSize: 14,
    fontFamily: "Inter-SemiBold",
  },
  tabIndicator: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
  },
  content: {
    flex: 1,
  },
  newsListContainer: {
    paddingHorizontal: 16,
  },
  newsList: {
    marginTop: 0,
  },
  newsItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  newsContent: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  newsTextContent: {
    flex: 1,
    marginRight: 12,
  },
  newsTitle: {
    fontSize: 15,
    fontFamily: "Inter-Medium",
    lineHeight: 20,
    marginBottom: 8,
  },
  newsDescription: {
    fontSize: 13,
    fontFamily: "Inter-Regular",
    lineHeight: 18,
    marginBottom: 8,
  },
  newsInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  newsSource: {
    fontSize: 12,
    fontFamily: "Inter-Medium",
  },
  newsTime: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  timeText: {
    fontSize: 12,
    fontFamily: "Inter-Regular",
  },
  newsThumbnail: {
    width: 80,
    height: 60,
    borderRadius: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
  },
  loadingText: {
    fontSize: 14,
    marginTop: 12,
    fontFamily: "Inter-Regular",
    textAlign: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    fontFamily: "Inter-SemiBold",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
    textAlign: "center",
  },
});
