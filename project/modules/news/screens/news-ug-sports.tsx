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
  Image,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "react-i18next";
import { Search, Clock, ChevronRight } from "lucide-react-native";
import NewsNotifications from "../components/shared/news-notifications";
import { newsService } from "../services/newsService";
import { ActivityIndicator } from "react-native";

const { width } = Dimensions.get("window");

// Import images explicitly
const fixturesIcon = require("../assets/images/fixtures.png");
const tableIcon = require("../assets/images/table.png");
const awardsIcon = require("../assets/images/awards.png");
const replaysIcon = require("../assets/images/replays.png");
const databaseIcon = require("../assets/images/database.png");

interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamLogo: string;
  awayTeamLogo: string;
  date: string;
  time: string;
  status: "completed" | "upcoming" | "live";
  score?: {
    home: number;
    away: number;
  };
  league: string;
  round: string;
  // ✅ API-driven venue data - 100% from API, no hardcoding
  venueName?: string | null;
  venueCity?: string | null;
  venueCapacity?: number | null;
}

interface NewsItem {
  id: string;
  title: string;
  description: string;
  image: string;
  publishedAt: string;
  category: string;
}

interface UgSportsScreenProps {
  onBackPress?: () => void;
}

export default function UgSportsScreen(props: UgSportsScreenProps = {}) {
  console.log("🇺🇬 🚀 ========== UGANDA SPORTS SCREEN COMPONENT MOUNTED! ==========");
  const { onBackPress } = props;
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();

  // State management
  const [refreshing, setRefreshing] = useState(false);
  const [loadingNews, setLoadingNews] = useState(true);
  const [newsError, setNewsError] = useState<string | null>(null);
  const [loadingMatches, setLoadingMatches] = useState(true); // ✅ ADDED: Track match loading state

  const [notificationCount, setNotificationCount] = useState(1);
  const [matches, setMatches] = useState<Match[]>([]); // ✅ FIXED: Start with empty array, load from API
  const [ugandaNews, setUgandaNews] = useState<NewsItem[]>([]);
  const [isUgSportsActive, setIsUgSportsActive] = useState(true);
  const [activeButton, setActiveButton] = useState<"24h-hot" | "ug-sports" | "headlines" | null>("ug-sports");
  
  // ✅ STICKY TAB: Track scroll position for sticky tab behavior
  const scrollY = useRef(new Animated.Value(0)).current;
  const [headerHeight, setHeaderHeight] = useState(200);
  const screenHeight = Dimensions.get('window').height;
  const tabBarCenterPosition = screenHeight / 2 - 150; // Higher position to show news below
  const maxScrollDistance = screenHeight / 2 - 100; // Maximum distance tab can scroll down (middle of screen)
  
  // Animation for 24H HOT button
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Screen entrance animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  
  // ✅ STICKY TAB: Ref to measure header and tab position
  const headerRef = useRef<View>(null);

  // ❌ DELETED: All hardcoded mock data removed
  // ✅ REAL API DATA ONLY from now on

  // Format timestamp to relative time (e.g., "2 hours ago", "Yesterday")
  const formatTimeAgo = (dateString: string): string => {
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
  };

  // Fetch Uganda sports news using all 6 APIs
  const fetchUgandaNews = async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoadingNews(true);
      }
      setNewsError(null);

      console.log("🔍 Fetching Uganda sports news (local, African, international)...");
      
      // Create multiple search queries for comprehensive coverage
      // Local: Uganda-specific queries
      // African: African sports context
      // International: General sports with Uganda context
      const searchQueries = [
        "Uganda football",
        "Uganda soccer",
        "Uganda sports",
        "Uganda Premier League",
        "Uganda Cranes",
        "African football Uganda",
        "East Africa sports",
        "Uganda basketball",
        "Uganda rugby",
      ];
      
      // Fetch news from all queries in parallel
      console.log(`🔍 Searching with ${searchQueries.length} queries...`);
      const newsPromises = searchQueries.map(query => 
        newsService.searchNews(query, 15).catch(err => {
          console.log(`⚠️ Search failed for "${query}":`, err.message);
          return [];
        })
      );
      const newsResults = await Promise.all(newsPromises);
      const allNews = newsResults.flat();
      console.log(`✅ Found ${allNews.length} total articles`);

      // Remove duplicates based on URL or ID
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

      // Filter to ensure relevance to Uganda sports
      const relevantNews = uniqueNews.filter((article) => {
        const titleLower = article.title.toLowerCase();
        const descLower = (article.description || "").toLowerCase();
        const contentLower = (article.content || "").toLowerCase();
        
        // Check for Uganda-related keywords
        const ugandaKeywords = [
          "uganda", "ugandan", "cranes", "vipers", "kcca", 
          "express fc", "sc villa", "ura fc", "bul fc",
          "african", "east africa", "afcon"
        ];
        
        const hasUgandaContext = ugandaKeywords.some(keyword =>
          titleLower.includes(keyword) || 
          descLower.includes(keyword) ||
          contentLower.includes(keyword)
        );
        
        // Also check if it's sports-related
        const isSportsRelated = titleLower.includes('football') || 
                               titleLower.includes('soccer') ||
                               titleLower.includes('sport') ||
                               titleLower.includes('match') ||
                               titleLower.includes('game') ||
                               titleLower.includes('league') ||
                               descLower.includes('football') ||
                               descLower.includes('soccer') ||
                               descLower.includes('sport');
        
        return hasUgandaContext && isSportsRelated;
      });
      
      console.log(`📊 Relevant articles after filtering: ${relevantNews.length}`);

      // Transform to NewsItem format
      const transformedNews: NewsItem[] = relevantNews
        .slice(0, 30) // Limit to 30 most relevant
        .map((article, index) => ({
          id: article.id || `uganda-news-${index}-${Date.now()}`,
          title: article.title,
          description: article.description || "",
          image: article.urlToImage || "",
          publishedAt: article.publishedAt,
          category: "Uganda Sports",
        }))
        .sort((a, b) => {
          // Sort by published date (newest first)
          return (
            new Date(b.publishedAt).getTime() -
            new Date(a.publishedAt).getTime()
          );
        });

      console.log(`✅ Successfully transformed ${transformedNews.length} news items`);
      setUgandaNews(transformedNews);
      
      if (transformedNews.length === 0) {
        console.warn("⚠️ No Uganda sports news found");
      }
    } catch (err) {
      console.error("❌ Error fetching Uganda sports news:", err);
      setNewsError(err instanceof Error ? err.message : "Failed to load news");
      setUgandaNews([]);
    } finally {
      setLoadingNews(false);
      setRefreshing(false);
    }
  };

  // ✅ Fetch Uganda Premier League matches from API
  const fetchUgandaMatches = async () => {
    console.log("🇺🇬 ⚡ ========== fetchUgandaMatches FUNCTION CALLED! ==========");
    try {
      setLoadingMatches(true);
      console.log("🇺🇬 ✅ Fetching Uganda Premier League matches from API-Sports...");
      
      // Import fetchHotMatches and Match type
      const { fetchHotMatches } = await import("@/services/matchService");
      
      // ✅ ENHANCED: Fetch Uganda matches with detailed logging
      console.log("🔍 Calling fetchHotMatches('uganda')...");
      const ugandaMatches = await fetchHotMatches("uganda");
      
      console.log(`📊 ========== API RESPONSE ANALYSIS ==========`);
      console.log(`✅ Total matches returned: ${ugandaMatches.length}`);
      
      // ✅ ENHANCED: Log ALL matches to see what's being filtered
      if (ugandaMatches.length > 0) {
        console.log("📋 ALL UGANDA MATCHES RECEIVED:");
        ugandaMatches.forEach((match, index) => {
          console.log(`  ${index + 1}. ${match.home.name} vs ${match.away.name}`);
          console.log(`     League: "${match.league}" (ID: ${match.leagueId || 'N/A'})`);
          console.log(`     Date: ${match.startTime}`);
          console.log(`     Status: ${match.status}`);
          console.log(`     Round: ${match.round || 'N/A'}`);
        });
      } else {
        console.warn("⚠️ NO UGANDA MATCHES RETURNED FROM API!");
        console.log("🔍 This could mean:");
        console.log("   1. No Uganda matches scheduled in the current timeframe");
        console.log("   2. Filtering logic is too strict");
        console.log("   3. API is not returning Uganda Premier League data");
        console.log("   4. League ID 288 is not in the API response");
      }
      
      // Transform API Match[] to local Match interface format - KEEP ALL MATCHES
      const transformedMatches: Match[] = ugandaMatches.map((apiMatch) => ({
        id: apiMatch.id,
        homeTeam: apiMatch.home.name,
        awayTeam: apiMatch.away.name,
        homeTeamLogo: apiMatch.home.logo || "",
        awayTeamLogo: apiMatch.away.logo || "",
        date: apiMatch.startTime.split("T")[0], // Extract date part
        time: new Date(apiMatch.startTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
        status: apiMatch.status === "finished" ? "completed" : apiMatch.status === "live" ? "live" : "upcoming",
        score: apiMatch.status === "finished" || apiMatch.status === "live" ? {
          home: apiMatch.home.score || 0,
          away: apiMatch.away.score || 0,
        } : undefined,
        league: apiMatch.league || "Uganda Premier League",
        round: apiMatch.round || "",
        // ✅ API-driven venue data - 100% from API
        venueName: apiMatch.venueName || null,
        venueCity: apiMatch.venueCity || null,
        venueCapacity: apiMatch.venueCapacity || null,
      }));
      
      // ✅ FIXED: Fetch ALL matches, display with scrolling (3 visible by default)
      const finishedMatches = transformedMatches.filter(m => m.status === "completed");
      const upcomingMatches = transformedMatches.filter(m => m.status === "upcoming" || m.status === "live");
      
      // Sort finished (most recent first), upcoming (soonest first)
      finishedMatches.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      upcomingMatches.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      // Combine ALL matches: finished first (most recent at top), then upcoming
      const allMatches = [...finishedMatches, ...upcomingMatches];
      
      console.log(`✅ [Uganda] Loaded ${allMatches.length} total matches (${finishedMatches.length} finished + ${upcomingMatches.length} upcoming)`);
      console.log(`📊 [Uganda] Default viewport: 3 matches visible (1 finished + 2 upcoming), scroll to see ${Math.max(0, allMatches.length - 3)} more`);
      console.log(`🔍 [Uganda] First 3: ${allMatches.slice(0, 3).map(m => `${m.homeTeam} vs ${m.awayTeam} (${m.status})`).join(", ")}`);
      
      setMatches(allMatches); // ✅ Set ALL matches for scrolling
    } catch (error) {
      console.error("❌ Error fetching Uganda matches:", error);
      console.error("Stack trace:", error instanceof Error ? error.stack : "N/A");
      setMatches([]); // ✅ Show empty on error, NOT mock data
    } finally {
      setLoadingMatches(false);
    }
  };

  useEffect(() => {
    console.log("🇺🇬 ⚡ useEffect TRIGGERED - Starting data fetch...");
    fetchUgandaMatches(); // ✅ FIXED: Fetch real API data instead of mock
    fetchUgandaNews();

    // Beautiful entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

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
        setTimeout(animateButton, 2000);
      });
    };

    setTimeout(animateButton, 400);
  }, []);

  const handleRefresh = async () => {
    // ✅ FIXED: Refresh both matches AND news
    await Promise.all([
      fetchUgandaMatches(),
      fetchUgandaNews(true),
    ]);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    
    // ✅ FIXED: Only show "Today" if match is actually today
    if (date.toDateString() === today.toDateString()) {
      return "Today";
    }
    
    // ✅ FIXED: Use standard format: date/month/year (e.g., "2/Dec/2025")
    const day = date.getDate();
    const month = date.toLocaleDateString("en-US", { month: "short" });
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  };

  const getMatchType = (match: Match) => {
    const matchTitle = match.homeTeam + " vs " + match.awayTeam;
    // ✅ CRITICAL FIX: Handle undefined/non-string league safely
    const leagueName = String(match.league || "").toLowerCase();

    // Check if it's a cup match
    if (
      leagueName.includes("cup") ||
      leagueName.includes("fa cup") ||
      leagueName.includes("uganda cup") ||
      leagueName.includes("cecafa") ||
      matchTitle.toLowerCase().includes("cup") ||
      matchTitle.toLowerCase().includes("final") ||
      matchTitle.toLowerCase().includes("semi")
    ) {
      return "Cup";
    }

    // Default to League for regular matches
    return "League";
  };

  const formatTime = (timeString: string) => {
    return timeString.substring(0, 5);
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const publishedDate = new Date(dateString);
    const diffInHours = Math.floor(
      (now.getTime() - publishedDate.getTime()) / (1000 * 60 * 60),
    );

    if (diffInHours < 1) {
      return "Just now";
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  const renderMatch = (match: Match, index: number) => (
    <TouchableOpacity 
      key={match.id} 
      style={styles.matchContainer}
      activeOpacity={0.7}
      onPress={() => {
        console.log(`🏟️ [Uganda] Navigating to match details for: ${match.homeTeam} vs ${match.awayTeam}`);
        console.log(`🔑 [Uganda] Match ID: ${match.id}, Status: ${match.status}`);
        console.log(`📍 [Uganda] Venue: ${match.venueName || 'N/A'}, City: ${match.venueCity || 'N/A'}`);
        
        router.push({
          pathname: "/match-details",
          params: {
            matchId: match.id.toString(),
            sport: "football",
            homeTeam: match.homeTeam || "",
            awayTeam: match.awayTeam || "",
            homeTeamId: "",
            awayTeamId: "",
            leagueId: "585", // Uganda Premier League
            homeLogo: match.homeTeamLogo || "",
            awayLogo: match.awayTeamLogo || "",
            homeScore: match.score?.home?.toString() || "0",
            awayScore: match.score?.away?.toString() || "0",
            status: match.status === "completed" ? "FT" : match.status === "live" ? "LIVE" : "NS",
            elapsed: "0",
            startTime: match.date || new Date().toISOString(),
            league: match.league || "Uganda Premier League",
            halftimeScore: "0-0",
            from: "uganda-sports",
            // ✅ API-driven venue data - 100% from API, no hardcoding
            venueName: match.venueName || "",
            venueCity: match.venueCity || "",
            venueCapacity: match.venueCapacity?.toString() || "",
          },
        });
      }}
    >
      <View style={styles.matchHeader}>
        <View style={styles.leftHeaderSection}>
          <View style={styles.matchDateTimeContainer}>
            <Text
              style={[styles.matchDate, { color: theme.colors.textSecondary }]}
            >
              {formatDate(match.date)}
            </Text>
            <Text
              style={[styles.matchTime, { color: theme.colors.textSecondary }]}
            >
              {formatTime(match.time)}
            </Text>
          </View>
          <View style={styles.matchTypeContainer}>
            <Text style={styles.matchTypeText}>{getMatchType(match)}</Text>
          </View>
        </View>
      </View>
      <View style={styles.matchContent}>
        <View style={styles.homeTeamContainer}>
          <Image source={{ uri: match.homeTeamLogo }} style={styles.teamLogo} />
          <Text style={[styles.teamName, { color: theme.colors.text }]}>
            {match.homeTeam}
          </Text>
        </View>
        <View style={styles.scoreContainer}>
          <Text
            style={[styles.matchRound, { color: theme.colors.textSecondary }]}
          >
            {match.round}
          </Text>
          <View style={styles.scoreRow}>
            {/* ✅ API-DRIVEN: Show score for live and completed, VS for upcoming */}
            {match.status === "completed" && match.score ? (
              <>
                <Text style={[styles.score, { color: theme.colors.text }]}>
                  {match.score.home}
                </Text>
                <Text
                  style={[
                    styles.scoreSeparator,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  -
                </Text>
                <Text style={[styles.score, { color: theme.colors.text }]}>
                  {match.score.away}
                </Text>
              </>
            ) : match.status === "live" && match.score ? (
              <>
                <Text style={[styles.score, { color: "#FF3B30" }]}>
                  {match.score.home}
                </Text>
                <Text
                  style={[
                    styles.scoreSeparator,
                    { color: "#FF3B30" },
                  ]}
                >
                  -
                </Text>
                <Text style={[styles.score, { color: "#FF3B30" }]}>
                  {match.score.away}
                </Text>
              </>
            ) : (
              <Text
                style={[styles.vsText, { color: theme.colors.textSecondary }]}
              >
                VS
              </Text>
            )}
          </View>
        </View>
        <View style={styles.awayTeamContainer}>
          <Text style={[styles.teamName, { color: theme.colors.text }]}>
            {match.awayTeam}
          </Text>
          <Image source={{ uri: match.awayTeamLogo }} style={styles.teamLogo} />
        </View>
        {/* ✅ Navigation Arrow */}
        <View style={styles.matchArrowContainer}>
          <ChevronRight size={20} color={theme.colors.textSecondary} />
        </View>
      </View>
      {/* ✅ API-DRIVEN: Match status - switches between VS/LIVE/Full Time */}
      {match.status === "completed" && (
        <View style={styles.matchStatusContainer}>
          <Text style={[styles.matchStatus, { color: theme.colors.primary }]}>
            Full Time
          </Text>
        </View>
      )}
      {match.status === "live" && (
        <View style={styles.matchStatusContainer}>
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderTabContent = () => {
    // Tab content will be handled by individual screens
    return null;
  };

  const renderNewsItem = (item: NewsItem) => (
    <TouchableOpacity
      key={item.id}
      style={styles.newsItemContainer}
      activeOpacity={0.8}
      onPress={() => {
        console.log(`🚀 [NewsUgSports] Navigating to news-detail with article: "${item.title}"`);
        
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
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.newsImage} resizeMode="cover" />
        ) : null}
        <View style={styles.newsTextContainer}>
          <Text style={[styles.newsTitle, { color: theme.colors.text }]} numberOfLines={2}>
            {item.title}
          </Text>
          <Text
            style={[
              styles.newsDescription,
              { color: theme.colors.textSecondary },
            ]}
            numberOfLines={2}
          >
            {item.description}
          </Text>
          <View style={styles.newsMetadata}>
            <Clock size={12} color={theme.colors.textSecondary} />
            <Text
              style={[styles.newsTime, { color: theme.colors.textSecondary }]}
            >
              {formatTimeAgo(item.publishedAt)}
            </Text>
            <View style={[styles.newsCategoryDot, { backgroundColor: theme.colors.border }]} />
            <Text
              style={[styles.newsCategory, { color: theme.colors.primary }]}
            >
              {item.category}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

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
      <Animated.View
        style={[
          styles.container,
          {
            backgroundColor:
              theme.colors.background === "#FFFFFF" ? "#FFFFFF" : "#2A2A2A",
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Header with Uganda Flag Water Wash Effect */}
        <View
          ref={headerRef}
          onLayout={(event) => {
            const { height } = event.nativeEvent.layout;
            setHeaderHeight(height);
          }}
          style={[
            styles.headerBackground,
            {
              backgroundColor: "#000000", // Black stripe (top)
            },
          ]}
        >
          {/* Uganda Flag Stripes */}
          <View style={styles.flagStripes}>
            <View style={[styles.flagStripe, { backgroundColor: "#000000", height: "14.3%" }]} />
            <View style={[styles.flagStripe, { backgroundColor: "#FFD700", height: "14.3%" }]} />
            <View style={[styles.flagStripe, { backgroundColor: "#FF0000", height: "14.3%" }]} />
            <View style={[styles.flagStripe, { backgroundColor: "#FFD700", height: "14.3%" }]} />
            <View style={[styles.flagStripe, { backgroundColor: "#FF0000", height: "14.3%" }]} />
            <View style={[styles.flagStripe, { backgroundColor: "#000000", height: "14.3%" }]} />
            <View style={[styles.flagStripe, { backgroundColor: "#FFD700", height: "14.3%" }]} />
          </View>

          {/* Water Wash FUFA Logo */}
          <Image
            source={require("../../discover/assets/fufa.png")}
            style={styles.flagWatermark}
            resizeMode="contain"
          />

          {/* Central FUFA Logo - No White Background */}
          <View style={styles.craneLogoContainer}>
            <Image
              source={require("../../discover/assets/fufa.png")}
              style={styles.fufaLogo}
              resizeMode="contain"
            />
          </View>

          <SafeAreaView edges={["top"]} style={{ flex: 0 }} />
          <View style={styles.headerWrapper}>
            <View style={styles.header}>
              <View style={styles.leftHeaderButtons}>
                <TouchableOpacity
                  style={styles.hotButton}
                  onPress={() => {
                    setActiveButton("24h-hot");
                    router.push("/stats/views/hot-topics");
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.hotButtonContainer}>
                    {activeButton === "24h-hot" && (
                      <View style={[styles.activeIndicator, { backgroundColor: "#FF3B30" }]} />
                    )}
                    <Animated.Text
                      style={[
                        styles.hotButtonText,
                        {
                          transform: [{ scale: scaleAnim }],
                          color: activeButton === "24h-hot" ? "#FFFFFF" : "rgba(255, 255, 255, 0.5)",
                          textShadowColor: activeButton === "24h-hot" ? "rgba(0,0,0,0.5)" : "transparent",
                          textShadowOffset: activeButton === "24h-hot" ? { width: 1, height: 1 } : { width: 0, height: 0 },
                          textShadowRadius: activeButton === "24h-hot" ? 3 : 0,
                        },
                      ]}
                    >
                      24H HOT
                    </Animated.Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.ugSportsButton}
                  onPress={() => {
                    setActiveButton("ug-sports");
                    setIsUgSportsActive(true);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.ugSportsButtonContainer}>
                    {activeButton === "ug-sports" && (
                      <View
                        style={[
                          styles.ugSportsActiveIndicator,
                          { backgroundColor: "#FF3B30" },
                        ]}
                      />
                    )}
                    <Text
                      style={[
                        styles.ugSportsButtonText,
                        {
                          color: activeButton === "ug-sports" ? "#FFFFFF" : "rgba(255, 255, 255, 0.5)",
                          textShadowColor: activeButton === "ug-sports" ? "rgba(0,0,0,0.5)" : "transparent",
                          textShadowOffset: activeButton === "ug-sports" ? { width: 1, height: 1 } : { width: 0, height: 0 },
                          textShadowRadius: activeButton === "ug-sports" ? 3 : 0,
                        },
                      ]}
                    >
                      UG Sports
                    </Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.headlinesButton}
                  onPress={() => {
                    setActiveButton("headlines");
                    if (onBackPress) {
                      onBackPress();
                    } else {
                      router.back();
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.headlinesButtonContainer}>
                    {activeButton === "headlines" && (
                      <View style={[styles.activeIndicator, { backgroundColor: "#FF3B30" }]} />
                    )}
                    <Text
                      style={[
                        styles.headlinesButtonText,
                        { 
                          color: activeButton === "headlines" ? "#FFFFFF" : "rgba(255, 255, 255, 0.5)",
                          textShadowColor: activeButton === "headlines" ? "rgba(0,0,0,0.5)" : "transparent",
                          textShadowOffset: activeButton === "headlines" ? { width: 1, height: 1 } : { width: 0, height: 0 },
                          textShadowRadius: activeButton === "headlines" ? 3 : 0,
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
                  <Search size={20} color="rgba(255, 255, 255, 0.5)" />
                </TouchableOpacity>
                <NewsNotifications
                  notificationCount={notificationCount}
                  showBadge={true}
                  iconColor="rgba(255, 255, 255, 0.5)"
                />
              </View>
            </View>
          </View>
        </View>

        {/* Matches Section - FIXED at top, own scroll, never below tab */}
        <View style={styles.matchesFixedSection}>
          {loadingMatches ? (
            <View style={styles.matchesLoadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
                Loading Uganda matches...
              </Text>
            </View>
          ) : matches.length === 0 ? (
            <View style={styles.matchesEmptyContainer}>
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                No Uganda matches available at the moment.
              </Text>
              <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>
                Pull down to refresh
              </Text>
            </View>
          ) : (
            <ScrollView
              style={styles.matchesScrollContainer}
              showsVerticalScrollIndicator={true}
              scrollEnabled={true}
              bounces={false}
            >
              {matches.map((match, index) => (
                <View key={match.id}>
                  {renderMatch(match, index)}
                  {index < matches.length - 1 && <View style={styles.separator} />}
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Tab + News Container - scrolls together */}
        <Animated.ScrollView
          style={[styles.tabNewsContainer, { marginTop: tabBarCenterPosition, backgroundColor: theme.colors.background || "#000", zIndex: 10 }]}
          contentContainerStyle={styles.tabNewsContent}
          showsVerticalScrollIndicator={false}
          bounces={true}
          scrollEventThrottle={16}
          stickyHeaderIndices={[0]}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={theme.colors.primary}
            />
          }
        >
          {/* Tab Bar - scrolls with news, sticky at top */}
          <View style={[styles.fixedTabBarContainer, { backgroundColor: theme.colors.background || "#000" }]}>
            <View style={styles.tabBar}>
              {[
                { id: "fixtures", label: "Fixtures", image: fixturesIcon },
                { id: "table", label: "Table", image: tableIcon },
                { id: "awards", label: "Rewards", image: awardsIcon },
                { id: "replays", label: "Replays", image: replaysIcon },
                { id: "data", label: "Database", image: databaseIcon },
              ].map((tab) => (
                <TouchableOpacity
                  key={tab.id}
                  style={styles.tabButton}
                  onPress={() => {
                    if (tab.id === "fixtures") {
                      router.push({
                        pathname: "/stats/league-details/[leagueId]",
                        params: { leagueId: "uganda-premier-league", tab: "matches" },
                      });
                    } else if (tab.id === "table") {
                      router.push({
                        pathname: "/stats/league-details/[leagueId]",
                        params: { leagueId: "uganda-premier-league", tab: "standings" },
                      });
                    } else if (tab.id === "awards") {
                      router.push({
                        pathname: "/news/news-ug-sports-rewards",
                        params: { leagueId: "uganda-premier-league", source: "uganda-sports" },
                      });
                    } else if (tab.id === "replays") {
                      router.push({
                        pathname: "/news/news-team-replays",
                        params: { leagueId: "uganda-premier-league", source: "uganda-sports" },
                      });
                    } else if (tab.id === "data") {
                      router.push({
                        pathname: "/news/news-team-fixtures",
                        params: { leagueId: "uganda-premier-league", source: "uganda-sports", context: "uganda-sports", activeTab: "draft" },
                      });
                    }
                  }}
                >
                  <Image source={tab.image} style={styles.tabIcon} resizeMode="contain" />
                  <Text style={[styles.tabButtonText, { color: theme.colors.text }]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* News Section - scrolls with tab */}
          <View style={[styles.newsSection, { backgroundColor: theme.colors.background || "#000" }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Uganda Sports News
            </Text>
            {loadingNews && ugandaNews.length === 0 ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
                  Loading Uganda sports news...
                </Text>
              </View>
            ) : newsError ? (
              <View style={styles.errorContainer}>
                <Text style={[styles.errorText, { color: theme.colors.textSecondary }]}>
                  {newsError}
                </Text>
                <TouchableOpacity
                  style={[styles.retryButton, { borderColor: theme.colors.primary }]}
                  onPress={() => fetchUgandaNews()}
                >
                  <Text style={[styles.retryButtonText, { color: theme.colors.primary }]}>
                    Retry
                  </Text>
                </TouchableOpacity>
              </View>
            ) : ugandaNews.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                  No Uganda sports news available at the moment.
                </Text>
              </View>
            ) : (
              ugandaNews.map((item, index) => (
                <View key={item.id}>
                  {renderNewsItem(item)}
                  {index < ugandaNews.length - 1 && (
                    <View
                      style={[
                        styles.separator,
                        { backgroundColor: theme.colors.border },
                      ]}
                    />
                  )}
                </View>
              ))
            )}
          </View>
        </Animated.ScrollView>

      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBackground: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 8,
    minHeight: 200,
    position: "relative",
    overflow: "hidden",
  },
  flagStripes: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "column",
  },
  flagStripe: {
    width: "100%",
  },
  flagWatermark: {
    position: "absolute",
    width: width * 0.9,
    height: width * 0.9,
    opacity: 0.08,
    top: "50%",
    left: "50%",
    marginLeft: -(width * 0.45),
    marginTop: -(width * 0.45),
  },
  craneLogoContainer: {
    position: "absolute",
    top: "45%",
    left: "50%",
    marginLeft: -40,
    marginTop: -40,
    zIndex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  fufaLogo: {
    width: 80,
    height: 80,
    tintColor: undefined, // Ensure no color tinting
  },
  headerWrapper: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.15)",
    borderRadius: 0,
    paddingTop: 20,
    paddingBottom: 16,
    zIndex: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  leftHeaderButtons: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    maxWidth: "65%",
  },
  hotButton: {
    paddingHorizontal: 6,
    paddingVertical: 6,
    marginRight: 12,
  },
  hotButtonText: {
    fontSize: 15,
    fontWeight: "800",
    fontStyle: "italic",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    fontFamily: "System",
    color: "#FFFFFF",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  ugSportsButton: {
    paddingHorizontal: 6,
    paddingVertical: 6,
    marginRight: 12,
    position: "relative",
  },
  ugSportsButtonContainer: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
  },
  ugSportsActiveIndicator: {
    position: "absolute",
    left: -4,
    top: "50%",
    transform: [{ translateY: -6 }],
    width: 4,
    height: 12,
    borderRadius: 2,
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
  },
  headlinesButtonContainer: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
  },
  headlinesButtonText: {
    fontSize: 13,
    fontWeight: "700",
    fontStyle: "italic",
    letterSpacing: 1.0,
    textTransform: "uppercase",
    fontFamily: "System",
  },
  spacer: {
    flex: 1,
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
  tabBarContainer: {
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    marginTop: 8,
    marginBottom: 20,
  },
  fixedTabBarContainer: {
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    zIndex: 100,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
    backgroundColor: "#000",
  },
  overlayTabBarContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    zIndex: 200,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  stickyTabBar: {
    position: 'absolute',
    top: 200,
    left: 0,
    right: 0,
    zIndex: 1000,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  // ✅ STICKY TAB: Overlay that appears at top when scrolled
  stickyTabBarContainer: {
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    zIndex: 10,
    paddingHorizontal: 0,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  tabBar: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: "space-around",
  },
  tabButton: {
    flexDirection: "column",
    alignItems: "center",
    paddingHorizontal: 2,
    paddingVertical: 8,
    borderRadius: 8,
    width: 70,
    backgroundColor: "transparent",
    justifyContent: "center",
  },
  tabIcon: {
    width: 40,
    height: 40,
    marginBottom: 4,
  },
  tabButtonText: {
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 14,
  },
  content: {
    flex: 1,
  },
  tabNewsContainer: {
    flex: 1,
  },
  tabNewsContent: {
    paddingBottom: 100,
  },
  matchesFixedSection: {
    position: 'absolute',
    top: 200,
    left: 0,
    right: 0,
    height: 400,
    zIndex: 1,
    backgroundColor: 'transparent',
  },
  matchesSection: {
    paddingTop: 0,
    paddingBottom: 0,
  },
  matchContainer: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    backgroundColor: "transparent",
  },
  separator: {
    height: 1,
    backgroundColor: "#404040",
    opacity: 0.6,
    marginHorizontal: 0,
    marginVertical: 4,
  },
  tabContent: {
    padding: 16,
  },
  matchHeader: {
    marginBottom: 4,
  },
  leftHeaderSection: {
    alignItems: "flex-start",
  },
  matchDateTimeContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  matchDate: {
    fontSize: 12,
    fontWeight: "600",
    marginRight: 8,
  },
  matchTime: {
    fontSize: 12,
    fontWeight: "500",
  },
  matchTypeContainer: {
    backgroundColor: "#B71C1C",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    opacity: 0.8,
    marginTop: 2,
  },
  matchTypeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  matchRound: {
    fontSize: 10,
    marginBottom: 4,
    textAlign: "center",
  },
  matchContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    position: "relative",
  },
  matchArrowContainer: {
    position: "absolute",
    right: 0,
    top: "50%",
    transform: [{ translateY: -10 }],
  },
  homeTeamContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingRight: 8,
  },
  awayTeamContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingLeft: 8,
  },
  teamLogo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginHorizontal: 6,
  },
  teamName: {
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
    maxWidth: 80,
  },
  scoreContainer: {
    flexDirection: "column",
    alignItems: "center",
    marginHorizontal: 8,
    minWidth: 60,
    justifyContent: "center",
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  score: {
    fontSize: 24,
    fontWeight: "800",
    marginHorizontal: 8,
  },
  scoreSeparator: {
    fontSize: 18,
    fontWeight: "600",
  },
  vsText: {
    fontSize: 14,
    fontWeight: "600",
  },
  matchStatusContainer: {
    alignItems: "center",
    marginTop: 4,
  },
  matchStatus: {
    fontSize: 12,
    fontWeight: "600",
  },
  // ✅ API-DRIVEN: Live status indicator styles
  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FF3B30",
  },
  liveText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FF3B30",
  },

  newsSection: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  sectionBreakingSpace: {
    height: 12, // ✅ Increased from 6 for better visual separation
    marginHorizontal: 0,
    width: "100%",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 16,
  },
  newsItemContainer: {
    padding: 16,
    backgroundColor: "transparent",
  },
  newsContent: {
    flexDirection: "row",
  },
  newsTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  newsTitle: {
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 22,
    marginBottom: 8,
  },
  newsDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  newsMetadata: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  newsTime: {
    fontSize: 12,
  },
  newsCategory: {
    fontSize: 12,
    fontWeight: "600",
  },
  newsImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  newsCategoryDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    marginHorizontal: 4,
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  errorContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  errorText: {
    fontSize: 14,
    textAlign: "center",
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
  emptyContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
  },
  // ✅ ADDED: Styles for matches loading/empty states
  matchesLoadingContainer: {
    padding: 80,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    minHeight: 280, // ✅ Fixed height to keep tab bar positioned correctly
  },
  matchesEmptyContainer: {
    padding: 80,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    minHeight: 280, // ✅ Fixed height to keep tab bar positioned correctly
  },
  emptySubtext: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 4,
    fontStyle: "italic",
  },
  // ✅ SCROLLABLE: Shows all matches in scrollable container
  matchesScrollContainer: {
    maxHeight: 400,
  },
  stickyTabBarOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 1000,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  scrollHintContainer: {
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollHintText: {
    fontSize: 12,
    fontStyle: "italic",
    opacity: 0.7,
  },
  // ✅ ADDED: Missing styles for button indicators
  hotButtonContainer: {
    position: "relative",
  },
  activeIndicator: {
    position: "absolute",
    bottom: -4,
    left: 0,
    right: 0,
    height: 2,
    borderRadius: 1,
  },
});
