import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  RefreshControl,
  TouchableOpacity,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "react-i18next";
import { newsService, NewsArticle } from "../services/newsService";
import favoritesService from "../../../services/favoritesService";
import {
  getOptimizedScrollStyles,
  detailsScrollConfig,
} from "../../../utils/scrollPerformance";

// Import the new components
import NewsNotifications from "../components/shared/news-notifications";
import { Search } from "lucide-react-native";
import NewsFilterTab from "../components/shared/news-filter-tab";

// Import content renderers
import {
  NewsRecent,
  NewsHot,
  NewsFollowedMatches,
  NewsAllSports,
  NewsFifa,
  NewsAfcon,
  NewsFootball,
  NewsBasketball,
  NewsRugby,
  NewsVideos,
  NewsEnglishPL,
  NewsLaLiga,
  NewsBundesliga,
  NewsSerieA,
  NewsLigue1,
} from "../components/content/shared/sports-news";
import { NewsUgandaSports } from "../components/content/shared/team-news/uganda-sports";
import UgSportsScreen from "./news-ug-sports";

// Enhanced interfaces for different content types
export interface VideoContent {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  duration: string;
  views: string;
  publishedAt: string;
  source: string;
  category:
    | "highlights"
    | "analysis"
    | "interview"
    | "documentary"
    | "funny"
    | "live";
}

export interface FIFAContent {
  id: string;
  title: string;
  description: string;
  image: string;
  publishedAt: string;
  category: "official" | "tournaments" | "regulations" | "awards";
  importance: "high" | "medium" | "low";
  tags: string[];
}

export default function NewsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();

  // State management
  const [sportsNews, setSportsNews] = useState<NewsArticle[]>([]);
  const [headlines, setHeadlines] = useState<NewsArticle[]>([]);
  const [followsNews, setFollowsNews] = useState<NewsArticle[]>([]);
  const [fifaNews, setFifaNews] = useState<FIFAContent[]>([]);
  const [ugandaNews, setUgandaNews] = useState<NewsArticle[]>([]);
  const [afconNews, setAfconNews] = useState<NewsArticle[]>([]);
  const [videoContent, setVideoContent] = useState<VideoContent[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState("recent");
  const [notificationCount, setNotificationCount] = useState(1);
  const [showUgSportsScreen, setShowUgSportsScreen] = useState(false);

  // Animation for 24H HOT button
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Load follows news based on favorite teams
  const loadFollowsNews = async () => {
    try {
      const favorites = await favoritesService.getFavorites();
      if (favorites.length === 0) {
        setFollowsNews([]);
        return;
      }

      const relatedNews: NewsArticle[] = [];
      const newsImages = [
        "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&h=250&fit=crop",
        "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=250&fit=crop",
        "https://images.unsplash.com/photo-1606925797300-0b35e9d1794e?w=400&h=250&fit=crop",
        "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=400&h=250&fit=crop",
        "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=250&fit=crop",
        "https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=400&h=250&fit=crop",
        "https://images.unsplash.com/photo-1553778263-73a83bab9b0c?w=400&h=250&fit=crop",
        "https://images.unsplash.com/photo-1579952363873-27d3bfad9c0d?w=400&h=250&fit=crop",
      ];

      favorites.forEach((favorite, index) => {
        const imageIndex = index % newsImages.length;
        const newsTypes = [
          {
            title: `${favorite.homeTeam} vs ${favorite.awayTeam}: Match Preview`,
            description: `Tactical analysis and key players to watch in this ${favorite.league} clash.`,
          },
          {
            title: `${favorite.homeTeam} Team News and Updates`,
            description: `Latest squad updates, injuries, and formation changes for ${favorite.homeTeam}.`,
          },
          {
            title: `${favorite.awayTeam} Pre-Match Analysis`,
            description: `How ${favorite.awayTeam} plans to approach this crucial ${favorite.league} fixture.`,
          },
          {
            title: `${favorite.league}: Title Race Implications`,
            description: `How this match between ${favorite.homeTeam} and ${favorite.awayTeam} affects the standings.`,
          },
        ];

        const newsType = newsTypes[index % newsTypes.length];

        relatedNews.push({
          id: `follows_${favorite.id}_${index}`,
          title: newsType.title,
          description: newsType.description,
          content: `${newsType.description}\n\nDetailed coverage of this important ${favorite.league} match with expert insights and predictions.`,
          url: "#",
          urlToImage: newsImages[imageIndex],
          publishedAt: new Date(
            Date.now() - (index + 1) * 60 * 60 * 1000,
          ).toISOString(),
          source: { id: "team_news", name: `${favorite.league} News` },
          category: "football",
          readTime: "4 min read",
        });
      });

      setFollowsNews(relatedNews);
    } catch (error) {
      console.error("Error loading follows news:", error);
      setFollowsNews([]);
    }
  };

  // Main news loading function with rate limiting
  const loadNews = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      }

      console.log("📰 Loading real news data from APIs with rate limiting...");

      // Sequential loading to prevent rate limiting
      console.log("📰 [1/6] Loading sports news...");
      const sportsArticles = await newsService.getSportsNews("sports", 15);
      setSportsNews(sportsArticles);

      await new Promise((resolve) => setTimeout(resolve, 1000));

      console.log("📰 [2/6] Loading headlines...");
      const headlineArticles = await newsService.getTopHeadlines("sports", 10);
      setHeadlines(headlineArticles);

      await new Promise((resolve) => setTimeout(resolve, 1000));

      console.log("📰 [3/6] Loading FIFA news...");
      const fifaArticles = await newsService.getFIFANews(10);
      setFifaNews(
        fifaArticles.map((article) => ({
          id: article.id,
          title: article.title,
          description: article.description,
          image: article.urlToImage,
          publishedAt: article.publishedAt,
          category: "official" as const,
          importance: "high" as const,
          tags: ["FIFA", "Official"],
        })),
      );

      await new Promise((resolve) => setTimeout(resolve, 1000));

      console.log("📰 [4/6] Loading Uganda sports news...");
      const ugandaArticles = await newsService.getUgandaSportsNews(10);
      setUgandaNews(ugandaArticles);

      await new Promise((resolve) => setTimeout(resolve, 1000));

      console.log("📰 [5/6] Loading AFCON news...");
      const afconArticles = await newsService.getAFCONNews(10);
      setAfconNews(afconArticles);

      await new Promise((resolve) => setTimeout(resolve, 1000));

      console.log("📰 [6/6] Loading sports videos...");
      const videoArticles = await newsService.getSportsVideos(10);
      setVideoContent(videoArticles);

      await loadFollowsNews();

      console.log("📰 ✅ All news content loaded successfully");
    } catch (error) {
      console.error("📰 Error loading news:", error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadNews();

    // Start zoom animation for 24H HOT button
    const animateButton = () => {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.05,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setTimeout(animateButton, 2000); // Repeat every 2 seconds
      });
    };

    animateButton();
  }, []);

  // Handle category changes
  const handleCategoryChange = (categoryId: string) => {
    setActiveCategory(categoryId);
  };

  // Render content based on active category
  const renderCategoryContent = () => {
    switch (activeCategory) {
      case "recent":
        return <NewsRecent />;
      case "hot":
        return <NewsHot />;
      case "follows":
        return <NewsFollowedMatches onRefresh={loadFollowsNews} />;
      case "fifa":
        return <NewsFifa />;
      case "uganda":
        return <NewsUgandaSports />;
      case "afcon":
        return <NewsAfcon />;
      case "videos":
        return <NewsVideos />;
      case "football":
        return <NewsFootball />;
      case "basketball":
        return <NewsBasketball />;
      case "rugby":
        return <NewsRugby />;
      case "english-pl":
        return <NewsEnglishPL />;
      case "la-liga":
        return <NewsLaLiga />;
      case "bundesliga":
        return <NewsBundesliga />;
      case "serie-a":
        return <NewsSerieA />;
      case "ligue-1":
        return <NewsLigue1 />;
      default:
        return <NewsAllSports />;
    }
  };

  const handleUgSportsNavigation = () => {
    setShowUgSportsScreen(true);
  };

  return (
    <>
      <StatusBar
        barStyle={
          theme.colors.background === "#FFFFFF"
            ? "dark-content"
            : "light-content"
        }
        backgroundColor={theme.colors.backgroundSecondary}
        translucent
      />
      <View
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        {/* Header with search and notifications */}
        <View
          style={[
            styles.headerBackground,
            {
              backgroundColor: theme.colors.backgroundSecondary,
              shadowColor:
                theme.colors.background === "#FFFFFF" ? "#000000" : "#000000",
            },
          ]}
        >
          <SafeAreaView edges={["top"]} />
          <View style={styles.headerWrapper}>
            <View style={[styles.header, { backgroundColor: "transparent" }]}>
              <View style={styles.leftHeaderButtons}>
                <TouchableOpacity
                  style={styles.hotButton}
                  onPress={() => router.push("/stats/views/hot-topics")}
                  activeOpacity={0.7}
                >
                  <Animated.Text
                    style={[
                      styles.hotButtonText,
                      {
                        color: theme.colors.textSecondary,
                        transform: [{ scale: scaleAnim }],
                      },
                    ]}
                  >
                    24H HOT
                  </Animated.Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.ugSportsButton}
                  onPress={handleUgSportsNavigation}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.ugSportsButtonText,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    UG Sports
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.headlinesButton}
                  onPress={() => setActiveCategory("hot")}
                  activeOpacity={0.7}
                >
                  <View style={styles.headlinesButtonContainer}>
                    {activeCategory === "hot" && (
                      <View
                        style={[
                          styles.headlinesActiveIndicator,
                          { backgroundColor: theme.colors.primary },
                        ]}
                      />
                    )}
                    <Text
                      style={[
                        styles.headlinesButtonText,
                        {
                          color:
                            activeCategory === "hot"
                              ? theme.colors.background === "#FFFFFF"
                                ? "#121212"
                                : "#FFFFFF"
                              : theme.colors.textSecondary,
                        },
                      ]}
                    >
                      Headlines
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
              <View style={styles.spacer} />
              <View style={styles.rightHeaderButtons}>
                <TouchableOpacity
                  style={styles.searchButton}
                  onPress={() => router.push("/stats/views/search")}
                  activeOpacity={0.7}
                >
                  <Search size={20} color={theme.colors.text} />
                </TouchableOpacity>
                <NewsNotifications
                  notificationCount={notificationCount}
                  showBadge={true}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Sticky Category Filter Tabs */}
        <View
          style={[
            styles.stickyTabContainer,
            { backgroundColor: theme.colors.backgroundSecondary },
          ]}
        >
          <NewsFilterTab
            activeCategory={activeCategory}
            onCategoryChange={handleCategoryChange}
          />
        </View>

        {/* Main content with filter tabs and news */}
        <ScrollView
          style={[styles.content, getOptimizedScrollStyles()]}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={detailsScrollConfig.removeClippedSubviews}
          scrollEventThrottle={detailsScrollConfig.scrollEventThrottle}
          bounces={detailsScrollConfig.bounces}
          decelerationRate={detailsScrollConfig.decelerationRate}
          keyboardShouldPersistTaps={
            detailsScrollConfig.keyboardShouldPersistTaps
          }
          keyboardDismissMode={detailsScrollConfig.keyboardDismissMode}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadNews(true)}
              tintColor={theme.colors.primary}
            />
          }
        >
          {/* Dynamic Content Based on Selected Category */}
          {renderCategoryContent()}
        </ScrollView>
      </View>

      {/* UG Sports Overlay */}
      {showUgSportsScreen && (
        <View style={styles.overlayContainer}>
          <UgSportsScreen
            onBackPress={() => {
              setShowUgSportsScreen(false);
            }}
          />
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBackground: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 8,
  },
  headerWrapper: {
    paddingTop: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  spacer: {
    flex: 1,
    minWidth: 40,
  },
  leftHeaderButtons: {
    flexDirection: "row",
    alignItems: "center",
    flex: 0,
    maxWidth: "65%",
  },
  hotButton: {
    paddingHorizontal: 6,
    paddingVertical: 6,
    marginRight: 12,
  },
  hotButtonText: {
    fontSize: 13,
    fontWeight: "800",
    fontStyle: "italic",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    fontFamily: "System",
    textShadowColor: "rgba(0,0,0,0.1)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  ugSportsButton: {
    paddingHorizontal: 6,
    paddingVertical: 6,
    marginRight: 12,
  },
  ugSportsButtonText: {
    fontSize: 13,
    fontWeight: "700",
    fontStyle: "italic",
    letterSpacing: 1.0,
    textTransform: "uppercase",
    fontFamily: "System",
  },
  headlinesButton: {
    paddingHorizontal: 6,
    paddingVertical: 6,
    marginRight: 20,
    position: "relative",
  },
  headlinesButtonContainer: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
  },
  headlinesActiveIndicator: {
    position: "absolute",
    left: -4,
    top: "50%",
    transform: [{ translateY: -6 }],
    width: 4,
    height: 12,
    borderRadius: 2,
  },
  headlinesButtonText: {
    fontSize: 13,
    fontWeight: "700",
    fontStyle: "italic",
    letterSpacing: 1.0,
    textTransform: "uppercase",
    fontFamily: "System",
  },
  rightHeaderButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  searchButton: {
    padding: 8,
    marginRight: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
  },
  stickyTabContainer: {
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    zIndex: 15,
  },
  overlayContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    backgroundColor: "transparent",
  },
});
