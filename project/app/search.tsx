import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  ActivityIndicator,
  Image,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Search, X, Clock, ExternalLink } from "lucide-react-native";
import { useTheme } from "../hooks/useTheme";
import { newsService, NewsArticle } from "../modules/news";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SEARCH_HISTORY_KEY = "@search_history";
const MAX_HISTORY_ITEMS = 20;

export default function SearchScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<NewsArticle[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [todayHotTopics, setTodayHotTopics] = useState<NewsArticle[]>([]);
  const [loadingHotTopics, setLoadingHotTopics] = useState(true);

  // Load search history on mount
  useEffect(() => {
    loadSearchHistory();
    loadTodayHotTopics();
  }, []);

  const loadSearchHistory = async () => {
    try {
      const savedHistory = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
      if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory);
        setSearchHistory(parsedHistory);
      }
    } catch (error) {
      console.error("Error loading search history:", error);
    }
  };

  const saveSearchHistory = async (query: string) => {
    try {
      if (!query.trim()) return;
      
      const updatedHistory = [
        query,
        ...searchHistory.filter((item) => item.toLowerCase() !== query.toLowerCase()),
      ].slice(0, MAX_HISTORY_ITEMS);
      
      setSearchHistory(updatedHistory);
      await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updatedHistory));
    } catch (error) {
      console.error("Error saving search history:", error);
    }
  };

  // Load Today's Hot Topics from all 6 news APIs - Fetch 10 real articles
  const loadTodayHotTopics = async () => {
    try {
      setLoadingHotTopics(true);
      console.log("🔥 [Search] Loading 10 Today's Hot Topics from 6 news APIs...");

      // Fetch MORE articles from each API to ensure we get 10 unique, high-quality articles
      // Use Promise.allSettled to handle API failures gracefully
      const [sportsNews, headlines, fifaNews, ugandaNews, afconNews, videos] = await Promise.allSettled([
        newsService.getSportsNews("sports", 3).catch(() => []), // Get 3 from each API
        newsService.getTopHeadlines("sports", 3).catch(() => []),
        newsService.getFIFANews(3).catch(() => []),
        newsService.getUgandaSportsNews(3).catch(() => []),
        newsService.getAFCONNews(3).catch(() => []),
        newsService.getSportsVideos(3).catch(() => []),
      ]);

      const allHeadlines: NewsArticle[] = [];
      const seenIds = new Set<string>(); // Track IDs to avoid duplicates
      
      // Extract headlines from each API result
      // Ensure each article has required fields before adding
      const addArticleIfValid = (article: NewsArticle | null | undefined) => {
        if (!article || !article.title || !article.id) {
          return false;
        }

        // Skip duplicates
        if (seenIds.has(article.id)) {
          return false;
        }

        // Ensure source is properly formatted
        if (!article.source || typeof article.source === 'string') {
          const sourceName = typeof article.source === 'string' ? article.source : 'Unknown';
          article.source = { id: sourceName, name: sourceName };
        }

        // Ensure required fields exist with real data (no mock placeholders)
        article.url = article.url || '#';
        article.urlToImage = article.urlToImage || '';
        article.description = article.description || '';
        article.publishedAt = article.publishedAt || new Date().toISOString();
        
        // Only add if article has meaningful content (not just empty strings)
        if (article.title.trim() && article.title !== 'Untitled' && article.title !== 'No title') {
          seenIds.add(article.id);
          allHeadlines.push(article);
          return true;
        }
        return false;
      };

      // Process all articles from each API
      if (sportsNews.status === "fulfilled" && sportsNews.value.length > 0) {
        sportsNews.value.forEach(article => addArticleIfValid(article));
      }
      if (headlines.status === "fulfilled" && headlines.value.length > 0) {
        headlines.value.forEach(article => addArticleIfValid(article));
      }
      if (fifaNews.status === "fulfilled" && fifaNews.value.length > 0) {
        fifaNews.value.forEach(article => addArticleIfValid(article));
      }
      if (ugandaNews.status === "fulfilled" && ugandaNews.value.length > 0) {
        ugandaNews.value.forEach(article => addArticleIfValid(article));
      }
      if (afconNews.status === "fulfilled" && afconNews.value.length > 0) {
        afconNews.value.forEach(article => addArticleIfValid(article));
      }
      if (videos.status === "fulfilled" && videos.value.length > 0) {
        // Convert videos to news article format
        videos.value.forEach((video: any) => {
          const videoSource = typeof video.source === 'string' ? video.source : 'Video Source';
          const videoArticle: NewsArticle = {
            id: video.id || `video-${Date.now()}-${Math.random()}`,
            title: video.title || '',
            description: video.description || '',
            content: video.description || '',
            url: video.videoUrl || '#',
            urlToImage: video.thumbnail || '',
            publishedAt: video.publishedAt || new Date().toISOString(),
            source: { 
              id: videoSource,
              name: videoSource
            },
            category: video.category || "football",
            readTime: "2 min read",
          };
          addArticleIfValid(videoArticle);
        });
      }

      // Sort by published date (newest first) to get the hottest topics
      allHeadlines.sort((a, b) => {
        const dateA = new Date(a.publishedAt).getTime();
        const dateB = new Date(b.publishedAt).getTime();
        return dateB - dateA; // Newest first
      });

      // Take exactly 10 articles (all real API data, no duplicates, no mock data)
      const finalHeadlines = allHeadlines.slice(0, 10);
      
      if (finalHeadlines.length === 0) {
        console.warn("⚠️ [Search] No hot topics found from APIs. APIs may be temporarily unavailable.");
      } else {
        setTodayHotTopics(finalHeadlines);
        console.log(`✅ [Search] Loaded ${finalHeadlines.length} REAL hot topics from APIs`);
        finalHeadlines.forEach((article, index) => {
          console.log(`  ${index + 1}. ${article.title.substring(0, 50)}... (ID: ${article.id}, Source: ${article.source?.name || 'Unknown'})`);
        });
      }
    } catch (error) {
      console.error("❌ [Search] Error loading hot topics:", error);
      setTodayHotTopics([]);
    } finally {
      setLoadingHotTopics(false);
    }
  };

  const getSuggestions = useCallback((query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    // Combine search history and common suggestions
    const allSuggestions = [
      ...searchHistory,
      "Premier League",
      "La Liga",
      "Champions League",
      "Manchester United",
      "Real Madrid",
      "Bayern Munich",
      "Lionel Messi",
      "Cristiano Ronaldo",
      "Arsenal vs Bayern",
      "UEFA Champions League",
      "World Cup 2026",
      "AFCON 2024",
      "Uganda Premier League",
      "Serie A",
      "Bundesliga",
      "PSG vs Barcelona",
      "Liverpool FC",
      "Manchester City",
    ];

    const filtered = allSuggestions
      .filter((item, index, self) => self.indexOf(item) === index) // Remove duplicates
      .filter((item) => item.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 10);
    setSuggestions(filtered);
  }, [searchHistory]);

  const performSearch = async (query: string) => {
    const trimmedQuery = query.trim();
    
    if (!trimmedQuery) {
      console.warn(`⚠️ [Search] Empty query provided`);
      Alert.alert("Search", "Please enter a search term");
      return;
    }

    console.log(`🔍 [Search] ========== PERFORMING SEARCH ==========`);
    console.log(`🔍 [Search] Query: "${trimmedQuery}"`);
    console.log(`🔍 [Search] Router available:`, !!router);
    console.log(`🔍 [Search] Current searchQuery state: "${searchQuery}"`);

    // Ensure search bar shows the query
    if (searchQuery !== trimmedQuery) {
      console.log(`🔍 [Search] Updating search bar to show: "${trimmedQuery}"`);
      setSearchQuery(trimmedQuery);
    }

    // Save to search history
    try {
      await saveSearchHistory(trimmedQuery);
      console.log(`✅ [Search] Saved to search history`);
    } catch (error) {
      console.error(`❌ [Search] Failed to save search history:`, error);
    }

    // Navigate to search results template with query parameter
    console.log(`🚀 [Search] Attempting navigation to: /news/search-news/search-all`);
    console.log(`🚀 [Search] With params:`, { query: trimmedQuery });
    
    try {
      // Use the correct nested route path
      const navigationResult = router.push({
        pathname: "/news/search-news/search-all",
        params: { query: trimmedQuery },
      });
      console.log(`✅ [Search] Navigation triggered successfully`);
      console.log(`✅ [Search] Navigation result:`, navigationResult);
    } catch (error: any) {
      console.error(`❌ [Search] Navigation failed:`, error?.message || error);
      console.error(`❌ [Search] Error stack:`, error?.stack);
      Alert.alert("Navigation Error", `Failed to open search results: ${error?.message || 'Unknown error'}`);
    }
  };

  const handleSearch = (text: string) => {
    console.log(`⌨️ [Search] handleSearch called with: "${text}"`);
    setSearchQuery(text);
    console.log(`⌨️ [Search] Updated searchQuery state to: "${text}"`);
    if (text.trim()) {
      getSuggestions(text);
    } else {
      setSuggestions([]);
      setSearchResults([]);
      setHasSearched(false);
    }
  };

  const handleSelectSuggestion = (suggestion: string) => {
    console.log(`📝 [Search] Selected suggestion: "${suggestion}"`);
    // Update search bar with selected text FIRST
    setSearchQuery(suggestion);
    setSuggestions([]);
    // Use setTimeout to ensure state updates before navigation
    setTimeout(() => {
      console.log(`📝 [Search] Navigating after state update...`);
      performSearch(suggestion);
    }, 100);
  };

  const handleSubmitSearch = () => {
    const query = searchQuery.trim();
    console.log(`⌨️ [Search] User submitted search: "${query}"`);
    console.log(`⌨️ [Search] Current searchQuery state: "${searchQuery}"`);
    
    if (query) {
      console.log(`⌨️ [Search] Calling performSearch with: "${query}"`);
      performSearch(query);
    } else {
      console.warn(`⚠️ [Search] Empty query, cannot search`);
      Alert.alert("Search", "Please enter a search term");
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

  // Maintain hot searches as requested (keep hardcoded)
  const hotSearches = [
    { id: "1", label: "Uganda Premier League", rank: 1 },
    { id: "2", label: "Premier League", rank: 2 },
    { id: "3", label: "La Liga", rank: 3 },
    { id: "4", label: "Serie A", rank: 4 },
    { id: "5", label: "Bundesliga", rank: 5 },
    { id: "6", label: "Ligue 1", rank: 6 },
    { id: "7", label: "Champions League", rank: 7 },
    { id: "8", label: "Europa League", rank: 8 },
    { id: "9", label: "FIFA World Cup", rank: 9 },
    { id: "10", label: "African Cup of Nations(AFCON)", rank: 10 },
  ];

  const handleHotSearchPress = (label: string) => {
    console.log(`🔥 [Search] Hot search pressed: "${label}"`);
    // Update search bar with selected text FIRST
    setSearchQuery(label);
    // Use setTimeout to ensure state updates before navigation
    setTimeout(() => {
      console.log(`🔥 [Search] Navigating after state update...`);
      performSearch(label);
    }, 100);
  };

  const handleHotTopicPress = (article: NewsArticle) => {
    console.log(`🔥 [Search] Hot topic pressed:`, {
      id: article.id,
      title: article.title,
      hasSource: !!article.source,
      hasUrl: !!article.url,
    });

    // Validate article data before navigating
    if (!article || !article.title || !article.id) {
      console.error(`❌ [Search] Invalid article data:`, article);
      Alert.alert("Error", "Invalid article data. Please try again.");
      return;
    }

    // Ensure article has all required fields
    const validArticle: NewsArticle = {
      id: article.id,
      title: article.title,
      description: article.description || '',
      url: article.url || '#',
      urlToImage: article.urlToImage || '',
      publishedAt: article.publishedAt || new Date().toISOString(),
      source: article.source && typeof article.source === 'object' 
        ? article.source 
        : { id: 'unknown', name: typeof article.source === 'string' ? article.source : 'Unknown' },
      category: article.category,
      readTime: article.readTime,
      content: article.content,
    };

    console.log(`🚀 [Search] Navigating to news-detail with article:`, validArticle.title);
    
    try {
      router.push({
        pathname: "/news/news-detail",
        params: { data: JSON.stringify(validArticle) },
      });
    } catch (error) {
      console.error(`❌ [Search] Navigation error:`, error);
      Alert.alert("Navigation Error", "Failed to open article. Please try again.");
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View
        style={[
          styles.searchContainer,
          { backgroundColor: theme.colors.backgroundSecondary },
        ]}
      >
        <View
          style={[
            styles.searchInputContainer,
            {
              backgroundColor: theme.colors.background,
              borderWidth: 1,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Search
            size={20}
            color={theme.colors.textSecondary}
            style={styles.searchIcon}
          />
          <TextInput
            style={[
              styles.searchInput,
              {
                color: theme.colors.text,
              },
              Platform.select({
                web: {
                  outlineStyle: "none" as any,
                } as any,
              }),
            ]}
            placeholder="Search matches, teams, players or news"
            placeholderTextColor={theme.colors.textSecondary}
            value={searchQuery}
            onChangeText={handleSearch}
            onSubmitEditing={handleSubmitSearch}
            autoFocus
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => handleSearch("")}
              style={styles.clearButton}
            >
              <X size={16} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => {
            const trimmed = searchQuery.trim();
            if (trimmed.length > 0) {
              // If there's text, perform search
              handleSubmitSearch();
            } else {
              // If empty, go back
              router.back();
            }
          }}
        >
          <Text style={[styles.cancelText, { color: theme.colors.text }]}>
            {searchQuery && searchQuery.trim().length > 0 ? "Search" : "Cancel"}
          </Text>
        </TouchableOpacity>
      </View>

      {suggestions.length > 0 ? (
        <ScrollView style={styles.suggestionsContainer}>
          {suggestions.map((suggestion, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.suggestionItem,
                { borderBottomColor: theme.colors.border },
              ]}
              onPress={() => handleSelectSuggestion(suggestion)}
            >
              <Search
                size={16}
                color={theme.colors.textSecondary}
                style={styles.suggestionIcon}
              />
              <Text
                style={[styles.suggestionText, { color: theme.colors.text }]}
              >
                {suggestion}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : (
        <ScrollView style={styles.content}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Hot Searches
          </Text>
          <View style={styles.hotSearchGrid}>
            {hotSearches.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.hotSearchItem,
                  { backgroundColor: theme.colors.backgroundSecondary },
                ]}
                onPress={() => handleHotSearchPress(item.label)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.rankNumber,
                    {
                      color:
                        item.rank <= 3
                          ? theme.colors.primary
                          : theme.colors.textSecondary,
                    },
                  ]}
                >
                  {item.rank}
                </Text>
                <Text
                  style={[styles.hotSearchText, { color: theme.colors.text }]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Search History Section */}
          {searchHistory.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: theme.colors.text, marginTop: 24 }]}>
                Recent Searches
              </Text>
              <View style={styles.hotSearchGrid}>
                {searchHistory.slice(0, 10).map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.hotSearchItem,
                      { backgroundColor: theme.colors.backgroundSecondary },
                    ]}
                    onPress={() => handleSelectSuggestion(item)}
                    activeOpacity={0.7}
                  >
                    <Clock size={14} color={theme.colors.textSecondary} style={{ marginRight: 6 }} />
                    <Text
                      style={[styles.hotSearchText, { color: theme.colors.text }]}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          <View style={styles.hotNewsHeader}>
            <Text style={styles.fireEmoji}>🔥</Text>
            <Text style={[styles.hotNewsTitle, { color: theme.colors.text }]}>
              Today's Hot Topics
            </Text>
          </View>

          {loadingHotTopics ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text
                style={[
                  styles.loadingText,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Loading hot topics...
              </Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.hotNewsContainer}
              pagingEnabled
              decelerationRate="fast"
              snapToInterval={320}
            >
              <View
                style={[
                  styles.newsGroup,
                  {
                    backgroundColor: theme.colors.backgroundSecondary,
                    borderColor: theme.colors.primary,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.newsGroupTitle,
                    { color: theme.colors.primary },
                  ]}
                >
                  Today's Hot Topics
                </Text>
                {todayHotTopics.length > 0 ? (
                  todayHotTopics.map((article, index) => (
                    <TouchableOpacity
                      key={article.id || index}
                      style={[
                        styles.newsItem,
                        { borderBottomColor: theme.colors.border },
                      ]}
                      onPress={() => handleHotTopicPress(article)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.newsText} numberOfLines={2}>
                        <Text
                          style={[
                            styles.bulletinNumber,
                            { color: theme.colors.primary },
                          ]}
                        >
                          {index + 1}.{" "}
                        </Text>
                        <Text
                          style={[
                            styles.bulletinText,
                            { color: theme.colors.text },
                          ]}
                        >
                          {article.title}
                        </Text>
                      </Text>
                    </TouchableOpacity>
                  ))
                ) : (
                  <Text
                    style={[
                      styles.bulletinText,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    No hot topics available
                  </Text>
                )}
              </View>
            </ScrollView>
          )}
        </ScrollView>
      )}
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
  suggestionsContainer: {
    flex: 1,
    backgroundColor: "transparent",
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  suggestionIcon: {
    marginRight: 12,
  },
  suggestionText: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Inter-SemiBold",
    marginBottom: 16,
  },
  hotSearchGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  hotSearchItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  rankNumber: {
    fontSize: 14,
    fontFamily: "Inter-Bold",
    marginRight: 8,
  },
  hotSearchText: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
  },
  hotNewsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 24,
    marginBottom: 16,
  },
  fireEmoji: {
    fontSize: 20,
  },
  hotNewsTitle: {
    fontSize: 16,
    fontFamily: "Inter-SemiBold",
  },
  hotNewsContainer: {
    marginHorizontal: -16,
  },
  newsGroup: {
    width: 320,
    height: 380,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 12,
    marginRight: 12,
    padding: 12,
  },
  newsGroupTitle: {
    fontSize: 16,
    fontFamily: "Inter-SemiBold",
    marginBottom: 12,
  },
  newsItem: {
    paddingVertical: 6,
    borderBottomWidth: 1,
  },
  newsText: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
    lineHeight: 20,
  },
  bulletinNumber: {
    fontFamily: "Inter-SemiBold",
  },
  bulletinText: {
    fontFamily: "Inter-Regular",
  },
  // Search Results Styles
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
  },
  loadingText: {
    fontSize: 14,
    marginTop: 12,
    textAlign: "center",
  },
  searchResultsContainer: {
    flex: 1,
  },
  newsResultItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  newsContent: {
    flexDirection: "row",
  },
  newsImage: {
    width: 80,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  newsTextContent: {
    flex: 1,
  },
  newsTitle: {
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 20,
    marginBottom: 4,
  },
  newsDescription: {
    fontSize: 13,
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
    fontWeight: "500",
  },
  newsTime: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeText: {
    fontSize: 12,
    marginLeft: 4,
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
    paddingHorizontal: 20,
  },
  noResultsTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    textAlign: "center",
  },
  noResultsText: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
});
