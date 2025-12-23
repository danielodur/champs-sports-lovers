import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StatusBar,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Search,
  History,
  TrendingUp,
  ChevronRight,
  Flame,
  RotateCcw,
} from "lucide-react-native";
import { useTheme } from "../../../hooks/useTheme";
import { useRouter } from "expo-router";

interface HotSearchItem {
  id: number;
  rank: number;
  title: string;
  trending?: boolean;
}

const SEARCH_HISTORY_KEY = "@search_history";

interface NewsItem {
  id: number;
  title: string;
  isHot?: boolean;
}

export default function StatsSearchScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showClearHistoryModal, setShowClearHistoryModal] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const searchInputRef = useRef<TextInput>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;

  // Sample search history for demonstration
  const sampleSearchHistory = [
    "Arsenal",
    "Chelsea",
    "Man Utd",
    "Liverpool",
    "Barca",
    "Madrid",
    "Bayern",
    "PSG",
    "Juve",
    "Milan",
    "PL",
    "UCL",
    "World Cup",
    "Euros",
    "Copa",
  ];

  const allSuggestions = [
    "Arsenal",
    "Chelsea",
    "Man Utd",
    "Liverpool",
    "Barcelona",
    "Real Madrid",
    "Bayern Munich",
    "PSG",
    "Juventus",
    "AC Milan",
    "Manchester City",
    "Tottenham",
    "Leicester",
    "West Ham",
    "Wolves",
    "Newcastle",
    "Premier League",
    "Champions League",
    "World Cup",
    "Europa League",
    "La Liga",
    "Serie A",
    "Bundesliga",
    "Ligue 1",
    "Copa America",
    "Euros",
    "AFCON",
    "Asian Cup",
    "MLS",
    "Liga MX",
  ];

  const hotSearches: HotSearchItem[] = [
    { id: 1, rank: 1, title: "Arsenal" },
    { id: 6, rank: 6, title: "Chelsea" },
    { id: 2, rank: 2, title: "Serie A" },
    { id: 7, rank: 7, title: "La Liga" },
    { id: 3, rank: 3, title: "Wolves" },
    { id: 8, rank: 8, title: "Premier League" },
    { id: 4, rank: 4, title: "Ligue 1" },
    { id: 9, rank: 9, title: "Ugandan Premier League" },
    { id: 5, rank: 5, title: "Roma" },
    { id: 10, rank: 10, title: "AFCON" },
  ];

  const todayHotNews: NewsItem[] = [
    {
      id: 1,
      title:
        "Italian journalist: Cardinale's dream of teaching the country about business negotiations...",
      isHot: true,
    },
    {
      id: 2,
      title:
        "Weekly Manager Hotline: Aubameyang and Ozil take classes together, ...",
    },
    {
      id: 3,
      title:
        "Thunder vs Super Selection: Leicester's absolute kill, Yagobi, who is the second...",
    },
    {
      id: 4,
      title:
        "Monday 001 Preview: Millwall vs Crystal Palace defeated by four consecutive defeats, New Year...",
    },
    {
      id: 5,
      title:
        "Weekly Electronics: Steel Beam's foreign aid 'fatal enemy' Atletico, B fee again...",
      isHot: true,
    },
  ];

  useEffect(() => {
    // Load search history from AsyncStorage
    loadSearchHistory();

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Focus search input when screen loads
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 300);

    // Keyboard listeners
    const keyboardWillShow = Keyboard.addListener("keyboardWillShow", (e) => {
      setKeyboardHeight(e.endCoordinates.height / 2); // Half screen height
    });
    const keyboardWillHide = Keyboard.addListener("keyboardWillHide", () => {
      setKeyboardHeight(0);
    });
    const keyboardDidShow = Keyboard.addListener("keyboardDidShow", (e) => {
      setKeyboardHeight(e.endCoordinates.height / 2); // Half screen height
    });
    const keyboardDidHide = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardHeight(0);
    });

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
      keyboardDidShow.remove();
      keyboardDidHide.remove();
    };
  }, []);

  const getRankColor = (rank: number) => {
    if (rank === 1) return "#DC2626"; // Standard red for rank 1
    if (rank === 2) return "#FF6B35"; // Orange for rank 2
    if (rank === 3) return "#FFD700"; // Yellow for rank 3
    return "#95A5A6"; // Gray for 4-10
  };

  const getRankTextColor = (rank: number) => {
    if (rank <= 3) return "#000000"; // Black text for colored backgrounds
    return "#FFFFFF"; // White text for gray background
  };

  const loadSearchHistory = async () => {
    try {
      const savedHistory = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
      if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory);
        setSearchHistory(parsedHistory);
      } else {
        // Set sample search history if none exists
        setSearchHistory(sampleSearchHistory.slice(0, 15));
        await AsyncStorage.setItem(
          SEARCH_HISTORY_KEY,
          JSON.stringify(sampleSearchHistory.slice(0, 15)),
        );
      }
    } catch (error) {
      console.error("Error loading search history:", error);
      // Set default history on error
      setSearchHistory(["Wolves", "Arsenal", "Premier League"]);
    }
  };

  const saveSearchHistory = async (history: string[]) => {
    try {
      await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
    } catch (error) {
      console.error("Error saving search history:", error);
    }
  };

  const handleSearchFunction = async (query: string) => {
    if (query.trim()) {
      const trimmedQuery = query.trim();

      // Create new history array
      let newHistory = [...searchHistory];

      // Remove if already exists
      const existingIndex = newHistory.findIndex(
        (item) => item.toLowerCase() === trimmedQuery.toLowerCase(),
      );
      if (existingIndex > -1) {
        newHistory.splice(existingIndex, 1);
      }

      // Add to beginning and keep only 9 recent items
      newHistory = [trimmedQuery, ...newHistory.slice(0, 8)];

      // Update state and save to storage
      setSearchHistory(newHistory);
      await saveSearchHistory(newHistory);

      // Perform search logic here
      console.log(`🔍 [StatsSearch] Searching for: "${trimmedQuery}"`);

      // DON'T clear search input - keep it visible so user can see what they searched
      // The search bar in search-all.tsx will show this query

      // Navigate to search results template
      console.log(`🚀 [StatsSearch] Navigating to search-all with query: "${trimmedQuery}"`);
      try {
        router.push({
          pathname: "/news/search-news/search-all",
          params: { query: trimmedQuery },
        });
        console.log(`✅ [StatsSearch] Navigation triggered successfully`);
      } catch (error: any) {
        console.error(`❌ [StatsSearch] Navigation failed:`, error?.message || error);
      }
    }
  };

  const handleHistoryItemPress = async (item: string) => {
    console.log(`📝 [StatsSearch] History item pressed: "${item}"`);
    // Update search bar with selected text FIRST
    setSearchQuery(item);
    // Navigate to search results
    await handleSearchFunction(item);
  };

  const clearHistory = () => {
    setShowClearHistoryModal(true);
  };

  const confirmClearHistory = async () => {
    setSearchHistory([]);
    await AsyncStorage.removeItem(SEARCH_HISTORY_KEY);
    setShowClearHistoryModal(false);
  };

  const cancelClearHistory = () => {
    setShowClearHistoryModal(false);
  };

  const handleHotSearchPress = async (item: HotSearchItem) => {
    console.log(`🔥 [StatsSearch] Hot search pressed: "${item.title}"`);
    // Update search bar with selected text FIRST
    setSearchQuery(item.title);
    // Navigate to search results
    await handleSearchFunction(item.title);
  };

  const handleNewsPress = (news: NewsItem) => {
    // Navigate to news detail with full article data
    console.log("Opening news:", news.title);
    // Create a valid NewsArticle object from NewsItem
    const articleData = {
      id: news.id.toString(),
      title: news.title,
      description: '',
      url: '#',
      urlToImage: '',
      publishedAt: new Date().toISOString(),
      source: { id: 'unknown', name: 'Unknown' },
    };
    router.push({
      pathname: "/news/news-detail",
      params: { data: JSON.stringify(articleData) },
    });
  };

  const handleViewAllHotTopics = () => {
    // Navigate to all hot topics screen
    router.push("/stats/views/hot-topics");
  };

  const handleViewAllSearchHistory = () => {
    // Navigate to all search history screen
    router.push("/stats/views/search-history");
  };

  const handleCancel = () => {
    router.back();
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
    searchInputRef.current?.focus();
  };

  const handleSearchInput = (text: string) => {
    setSearchQuery(text);

    if (text.length > 0) {
      const filteredSuggestions = allSuggestions
        .filter((suggestion) =>
          suggestion.toLowerCase().includes(text.toLowerCase()),
        )
        .slice(0, 5);
      setSuggestions(filteredSuggestions);
      setShowSuggestions(filteredSuggestions.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionPress = async (suggestion: string) => {
    console.log(`📝 [StatsSearch] Suggestion pressed: "${suggestion}"`);
    // Update search bar with selected text FIRST
    setSearchQuery(suggestion);
    setSuggestions([]);
    setShowSuggestions(false);
    searchInputRef.current?.blur();
    // Use setTimeout to ensure state updates before navigation
    setTimeout(() => {
      handleSearchFunction(suggestion);
    }, 100);
  };

  return (
    <>
      <StatusBar
        barStyle={
          theme.colors.background === "#FFFFFF"
            ? "dark-content"
            : "light-content"
        }
        backgroundColor={
          theme.colors.background === "#FFFFFF"
            ? theme.colors.background
            : "#2A2A2A"
        }
      />
      <KeyboardAvoidingView
        style={[
          styles.container,
          {
            backgroundColor:
              theme.colors.background === "#FFFFFF"
                ? theme.colors.background
                : "#2A2A2A",
          },
        ]}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={keyboardHeight}
      >
        <SafeAreaView style={styles.flex1} edges={["top", "left", "right"]}>
          <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
            {/* Fixed Search Bar Header */}
            <Animated.View
              style={[
                styles.fixedHeader,
                {
                  backgroundColor:
                    theme.colors.background === "#FFFFFF"
                      ? theme.colors.background
                      : "#2A2A2A",
                  shadowOpacity: scrollY.interpolate({
                    inputRange: [0, 50],
                    outputRange: [0, 0.15],
                    extrapolate: "clamp",
                  }),
                  elevation: scrollY.interpolate({
                    inputRange: [0, 50],
                    outputRange: [0, 8],
                    extrapolate: "clamp",
                  }),
                },
              ]}
            >
              <View
                style={[
                  styles.searchContainer,
                  {
                    backgroundColor:
                      theme.colors.background === "#FFFFFF"
                        ? "#F5F5F5"
                        : "#1F1F1F",
                    borderColor:
                      theme.colors.background === "#FFFFFF"
                        ? "#E0E0E0"
                        : "#444444",
                  },
                ]}
              >
                <Search
                  size={20}
                  color={theme.colors.textSecondary}
                  style={styles.searchIcon}
                />
                <TextInput
                  ref={searchInputRef}
                  style={[styles.searchInput, { color: theme.colors.text }]}
                  placeholder="Search leagues, teams, players..."
                  placeholderTextColor={theme.colors.textSecondary}
                  value={searchQuery}
                  onChangeText={handleSearchInput}
                  onSubmitEditing={() => handleSearchFunction(searchQuery)}
                  returnKeyType="search"
                  autoFocus={true}
                  blurOnSubmit={true}
                  keyboardType="default"
                  multiline={false}
                  editable={true}
                  enablesReturnKeyAutomatically={true}
                  clearButtonMode="never"
                  onFocus={() => {
                    if (searchQuery.length > 0) {
                      setShowSuggestions(suggestions.length > 0);
                    }
                  }}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity
                    onPress={clearSearch}
                    style={[
                      styles.clearButton,
                      {
                        backgroundColor:
                          theme.colors.background === "#FFFFFF"
                            ? "#E0E0E0"
                            : "#555555",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.clearIcon,
                        {
                          color:
                            theme.colors.background === "#FFFFFF"
                              ? "#666666"
                              : "#FFFFFF",
                        },
                      ]}
                    >
                      X
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancel}
              >
                <Text style={[styles.cancelText, { color: theme.colors.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Search Suggestions */}
            {showSuggestions && suggestions.length > 0 && (
              <Animated.View
                style={[
                  styles.suggestionsContainer,
                  {
                    backgroundColor:
                      theme.colors.background === "#FFFFFF"
                        ? "#FFFFFF"
                        : "#2A2A2A",
                  },
                ]}
              >
                <View style={styles.suggestionsList}>
                  {suggestions.map((suggestion, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.suggestionItem,
                        {
                          backgroundColor:
                            theme.colors.background === "#FFFFFF"
                              ? "#F8F8F8"
                              : "#1F1F1F",
                        },
                      ]}
                      onPress={() => handleSuggestionPress(suggestion)}
                    >
                      <Search size={16} color={theme.colors.textSecondary} />
                      <Text
                        style={[
                          styles.suggestionText,
                          { color: theme.colors.text },
                        ]}
                        numberOfLines={1}
                      >
                        {suggestion}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </Animated.View>
            )}

            {/* Scrollable Content */}
            <Animated.ScrollView
              style={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="always"
              keyboardDismissMode="interactive"
              scrollEnabled={true}
              contentContainerStyle={{
                paddingBottom: keyboardHeight + 40,
                paddingTop: 5,
              }}
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                { useNativeDriver: true },
              )}
              onScrollBeginDrag={() => {
                setShowSuggestions(false);
                searchInputRef.current?.blur();
              }}
              scrollEventThrottle={16}
              bounces={true}
              decelerationRate="normal"
            >
              {/* Search History Section */}
              {searchHistory.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <View style={styles.sectionTitleContainer}>
                      <History size={16} color={theme.colors.textSecondary} />
                      <Text
                        style={[
                          styles.sectionTitle,
                          { color: theme.colors.text },
                        ]}
                      >
                        Search History
                      </Text>
                    </View>
                    <TouchableOpacity onPress={clearHistory}>
                      <RotateCcw size={16} color={theme.colors.textSecondary} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.historyContainer}>
                    {searchHistory.slice(0, 9).map((item, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.historyItem,
                          {
                            backgroundColor:
                              theme.colors.background === "#FFFFFF"
                                ? "#F0F0F0"
                                : "#1F1F1F",
                          },
                        ]}
                        onPress={() => handleHistoryItemPress(item)}
                      >
                        <Text
                          style={[
                            styles.historyText,
                            { color: theme.colors.text },
                          ]}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {item}
                        </Text>
                      </TouchableOpacity>
                    ))}
                    <TouchableOpacity
                      style={[
                        styles.historyItem,
                        styles.viewAllHistoryItem,
                        {
                          backgroundColor:
                            theme.colors.background === "#FFFFFF"
                              ? "#F0F0F0"
                              : "#1F1F1F",
                        },
                      ]}
                      onPress={handleViewAllSearchHistory}
                    >
                      <Text
                        style={[
                          styles.historyText,
                          styles.viewAllHistoryText,
                          { color: theme.colors.textSecondary },
                        ]}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        View All
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Hot Searches Section */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleContainer}>
                    <Flame size={16} color="#DC2626" />
                    <Text
                      style={[
                        styles.sectionTitle,
                        { color: theme.colors.text },
                      ]}
                    >
                      Hot Searches
                    </Text>
                  </View>
                </View>

                <View style={styles.hotSearchGrid}>
                  {hotSearches.map((item, index) => (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.hotSearchItem,
                        {
                          backgroundColor: "transparent",
                        },
                      ]}
                      onPress={() => handleHotSearchPress(item)}
                    >
                      <View
                        style={[
                          styles.rankBadge,
                          { backgroundColor: getRankColor(item.rank) },
                        ]}
                      >
                        <Text
                          style={[
                            styles.rankText,
                            { color: getRankTextColor(item.rank) },
                          ]}
                        >
                          {item.rank}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.hotSearchText,
                          { color: theme.colors.text },
                        ]}
                        numberOfLines={1}
                      >
                        {item.title}
                      </Text>
                      {item.trending && (
                        <Flame
                          size={12}
                          color="#DC2626"
                          style={styles.trendingIcon}
                        />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Today's Hot Topics Section */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleContainer}>
                    <Flame size={16} color="#DC2626" />
                    <Text style={[styles.sectionTitle, { color: "#DC2626" }]}>
                      Today's Hot Topics
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={handleViewAllHotTopics}
                    style={styles.viewAllContainer}
                  >
                    <Text
                      style={[
                        styles.viewAllText,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      View All
                    </Text>
                    <ChevronRight
                      size={14}
                      color={theme.colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.newsContainer}>
                  {todayHotNews.map((news) => (
                    <TouchableOpacity
                      key={news.id}
                      style={[
                        styles.newsItem,
                        {
                          backgroundColor:
                            theme.colors.background === "#FFFFFF"
                              ? "#F8F8F8"
                              : "#1F1F1F",
                        },
                      ]}
                      onPress={() => handleNewsPress(news)}
                    >
                      <View style={styles.newsIndicator}>
                        <View
                          style={[
                            styles.newsBullet,
                            {
                              backgroundColor: news.isHot
                                ? "#DC2626"
                                : theme.colors.textSecondary,
                            },
                          ]}
                        />
                      </View>
                      <Text
                        style={[styles.newsText, { color: theme.colors.text }]}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {news.title}
                      </Text>
                      {news.isHot && (
                        <View
                          style={[
                            styles.hotBadge,
                            { backgroundColor: "#DC2626" },
                          ]}
                        >
                          <Flame size={10} color="#FFFFFF" />
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </Animated.ScrollView>
          </Animated.View>
        </SafeAreaView>
      </KeyboardAvoidingView>

      {/* Clear History Confirmation Modal */}
      <Modal
        visible={showClearHistoryModal}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelClearHistory}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.colors.backgroundSecondary },
            ]}
          >
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              Clear All Search History
            </Text>
            <Text
              style={[
                styles.modalMessage,
                { color: theme.colors.textSecondary },
              ]}
            >
              Are you sure you want to clear all search history?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.cancelModalButton,
                  { borderColor: theme.colors.border },
                ]}
                onPress={cancelClearHistory}
              >
                <Text style={[styles.buttonText, { color: theme.colors.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={confirmClearHistory}
              >
                <Text style={[styles.buttonText, { color: "#FFFFFF" }]}>
                  Confirm
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex1: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  fixedHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    paddingTop: 10,
    zIndex: 1000,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    marginRight: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Inter-Regular",
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
    justifyContent: "center",
    alignItems: "center",
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  clearIcon: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 14,
    textAlign: "center",
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  cancelText: {
    fontSize: 16,
    fontFamily: "Inter-Medium",
  },
  scrollContent: {
    flex: 1,
    marginTop: 50,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "transparent",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Inter-SemiBold",
    marginLeft: 8,
  },

  historyContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: -4,
    justifyContent: "flex-start",
  },
  historyItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    width: "18.5%",
    flex: 0,
  },
  historyText: {
    fontSize: 12,
    fontFamily: "Inter-Regular",
    textAlign: "center",
  },
  viewAllHistoryItem: {},
  viewAllHistoryText: {
    fontStyle: "italic",
  },
  hotSearchGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
    marginTop: -4,
  },
  hotSearchItem: {
    flexDirection: "row",
    alignItems: "center",
    width: "48%",
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "transparent",
    marginBottom: 8,
  },
  rankBadge: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  rankText: {
    fontSize: 12,
    fontFamily: "Inter-Bold",
  },
  hotSearchText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter-Medium",
    marginRight: 4,
  },
  trendingIcon: {
    marginLeft: 4,
  },
  viewAllContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  viewAllText: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
    marginRight: 4,
  },
  newsContainer: {
    gap: 8,
    marginTop: -4,
  },
  newsItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
    borderRadius: 12,
    position: "relative",
  },
  newsIndicator: {
    marginTop: 6,
    marginRight: 12,
  },
  newsBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  newsText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter-Regular",
    lineHeight: 20,
  },
  hotBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "80%",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: "Inter-SemiBold",
    marginBottom: 8,
    textAlign: "center",
  },
  modalMessage: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
    marginBottom: 20,
    textAlign: "center",
    lineHeight: 20,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelModalButton: {
    borderWidth: 1,
  },
  confirmButton: {
    backgroundColor: "#DC2626",
  },
  buttonText: {
    fontSize: 14,
    fontFamily: "Inter-Medium",
  },
  suggestionsContainer: {
    position: "absolute",
    top: 70,
    left: 16,
    right: 16,
    zIndex: 999,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  suggestionsList: {
    padding: 8,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  suggestionText: {
    fontSize: 16,
    fontFamily: "Inter-Regular",
    marginLeft: 12,
    flex: 1,
  },
});
