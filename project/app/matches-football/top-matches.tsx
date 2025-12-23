import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
  Platform,
  Pressable,
  StatusBar,
  TouchableOpacity,
  UIManager,
  InteractionManager,
  BackHandler,
  Vibration,
  ActivityIndicator,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import {
  TrendingUp,
  Trophy,
  Clock,
  Users,
  Star,
  Play,
  Flag,
  CheckCircle,
} from "lucide-react-native";
import { useTheme } from "../../hooks/useTheme";
import { Match } from "../../types/match";
import { fetchHotMatches, fetchMatches } from "../../services/matchService";
import SportsTabs from "../../components/SportsTabs";
import { useFavorites } from "../../hooks/useFavorites";
import MatchList from "../../components/match-list";
import { Fixture } from "../../types/football-fixtures-response";
import favoritesService from "../../services/favoritesService";
import { formatTeamName } from "../../utils/formatTeamName";
import goalDetectionService from "../../services/goalDetectionService";
import { useMatchSettings } from "../../contexts/MatchSettingsContext";
import teamLogoService from "../../services/teamLogoService";

// Import the refactored components
import {
  TopLiveMatches,
  TopUpcomingMatches,
  TopFinishedMatches,
} from "../../components/panel";

const { width, height } = Dimensions.get("window");

interface TopCategory {
  id: string;
  title: string;
  icon: any;
  sport: string;
  description: string;
}

export default function TopMatchesScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const scrollViewRef = useRef<ScrollView>(null);
  const [selectedCategory, setSelectedCategory] = useState("live");
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [navigationReady, setNavigationReady] = useState(true);
  const { addFavorite, removeFavorite, refreshFavoritesCount } = useFavorites();
  const { showGoalNotification } = useMatchSettings();
  const insets = useSafeAreaInsets();

  console.log("🎯 TOP MATCHES SCREEN RENDERING - Sports tabs should be visible!");
  console.log("🎯 Theme colors:", theme.colors.backgroundSecondary);

  // Enable smooth animations for better user experience
  useEffect(() => {
    if (Platform.OS === "android") {
      UIManager.setLayoutAnimationEnabledExperimental &&
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
    console.log("🎯 TOP MATCHES SCREEN MOUNTED - Check if SportsTabs is visible above Live Now/Upcoming/Finished buttons");
  }, []);

  // Load matches when category changes
  useEffect(() => {
    loadTopMatches();
  }, [selectedCategory]);

  // Initialize data on component mount
  useEffect(() => {
    loadTopMatches();
  }, []);

  // ✅ GOAL DETECTION: Setup once without layout impact
  useEffect(() => {
    if (!goalDetectionService.isMonitoringActive()) {
      goalDetectionService.startMonitoring();
    }
  }, []);

  // ✅ BACK BUTTON HANDLING: Proper navigation flow
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (!navigationReady) return true; // Prevent navigation during transitions

        try {
          // Navigate back to home screen with smooth transition
          router.push("/(tabs)");
          return true;
        } catch (error) {
          console.warn("Back navigation error:", error);
          return false;
        }
      };

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );

      return () => subscription?.remove();
    }, [router, navigationReady]),
  );

  // ✅ PERFORMANCE: Debounced refresh with haptic feedback
  const handleRefresh = useCallback(async () => {
    if (refreshing) return;

    try {
      // Provide haptic feedback on refresh
      if (Platform.OS === "ios") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } else {
        Vibration.vibrate(50);
      }

      setRefreshing(true);
      await loadTopMatches();
    } catch (error) {
      console.warn("Refresh error:", error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshing, selectedCategory]);

  // ✅ OPTIMIZED DATA LOADING: Single function with proper error handling
  const loadTopMatches = useCallback(async () => {
    if (isLoading) return; // Prevent concurrent loads

    try {
      setIsLoading(true);

      // Add delay for better UX during navigation
      await InteractionManager.runAfterInteractions();

      // Fetch comprehensive data from multiple sources
      const [hotMatches, regularMatches, premierMatches] = await Promise.all([
        fetchHotMatches("live").catch(() => []),
        fetchMatches("football", "live").catch(() => []),
        fetchHotMatches("premier").catch(() => []),
      ]);

      // Combine all data sources for richer content
      const allMatches = [
        ...(hotMatches || []),
        ...(regularMatches || []),
        ...(premierMatches || []),
      ];

      if (allMatches && Array.isArray(allMatches) && allMatches.length > 0) {
        // Filter matches by category with comprehensive validation
        const filteredMatches = allMatches.filter((match: Match) => {
          if (!match || !match.status) return false;

          const status = match.status.toLowerCase();
          switch (selectedCategory) {
            case "live":
              return (
                status === "live" ||
                status === "1h" ||
                status === "2h" ||
                status === "ht"
              );
            case "upcoming":
              return (
                status === "upcoming" || status === "ns" || status === "tbd"
              );
            case "finished":
              return (
                status === "finished" ||
                status === "ft" ||
                status === "aet" ||
                status === "pen"
              );
            default:
              return true;
          }
        });

        // Remove duplicates based on match ID
        const uniqueMatches = filteredMatches.filter(
          (match, index, arr) =>
            arr.findIndex((m) => m.id === match.id) === index,
        );

        setMatches(uniqueMatches.slice(0, 20)); // Limit to top 20 matches
      } else {
        setMatches([]);
      }
    } catch (error) {
      console.error("Error loading top matches:", error);
      setMatches([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, isLoading]);

  // ✅ FAVORITES MANAGEMENT: Optimized with batch operations
  const toggleFavorite = useCallback(
    async (matchId: number) => {
      if (!matchId) return;

      try {
        // Find the match
        const match = matches.find((m) => parseInt(m.id) === matchId);
        if (!match) return;

        // Convert to Fixture format
        const fixture = {
          fixture: {
            id: matchId,
            referee: null,
            timezone: "UTC",
            date: match.startTime,
            timestamp: new Date(match.startTime).getTime() / 1000,
            periods: { first: null, second: null },
            venue: { id: null, name: null, city: null },
            status: {
              long: match.statusText,
              short: (match.status === "live"
                ? "1H"
                : match.status === "finished"
                  ? "FT"
                  : "NS") as any,
              elapsed:
                match.status === "live" ? parseInt(match.time || "0") : null,
              extra: null,
            },
          },
          league: {
            id: null,
            name: match.league,
            country: null,
            logo: null,
            flag: null,
          },
          teams: {
            home: {
              id: null,
              name: match.home.name,
              logo: match.home.logo || null,
            },
            away: {
              id: null,
              name: match.away.name,
              logo: match.away.logo || null,
            },
          },
          goals: {
            home: match.home.score || 0,
            away: match.away.score || 0,
          },
          score: {
            halftime: { home: 0, away: 0 },
            fulltime: {
              home: match.home.score || 0,
              away: match.away.score || 0,
            },
            extratime: { home: null, away: null },
            penalty: { home: null, away: null },
          },
          events: null,
        };

        // Check current favorite status
        const matchIdString = matchId.toString();
        const isFavorite = await favoritesService.isFavorite(matchIdString);

        if (isFavorite) {
          await favoritesService.removeFromFavorites(matchIdString);
          removeFavorite(match.id);
        } else {
          // Convert fixture to match format for the general service
          const matchForService = {
            id: matchIdString,
            sport: "football",
            league: fixture.league?.name || "Unknown League",
            status:
              fixture.fixture.status?.short === "1H" ||
              fixture.fixture.status?.short === "2H"
                ? "live"
                : fixture.fixture.status?.short === "FT"
                  ? "finished"
                  : "upcoming",
            statusText: fixture.fixture.status?.long || "",
            startTime: fixture.fixture.date || new Date().toISOString(),
            home: {
              name: fixture.teams.home?.name || "Home Team",
              logo: fixture.teams.home?.logo || "",
            },
            away: {
              name: fixture.teams.away?.name || "Away Team",
              logo: fixture.teams.away?.logo || "",
            },
            score: `${fixture.goals?.home || 0}-${fixture.goals?.away || 0}`,
            halfTimeScore: "0-0",
            viewers: "1",
            hasVideo: false,
            isFavorite: true,
          };

          await favoritesService.addToFavorites(matchForService);
          addFavorite({
            id: match.id,
            title: `${match.home.name} vs ${match.away.name}`,
            time: match.startTime,
          });
        }

        // Provide haptic feedback
        if (Platform.OS === "ios") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }

        // Refresh favorites count
        refreshFavoritesCount();
      } catch (error) {
        console.error("Error toggling favorite:", error);
      }
    },
    [matches, addFavorite, removeFavorite, refreshFavoritesCount],
  );

  // ✅ NAVIGATION: Optimized match press handler
  const handleMatchPress = useCallback(
    (fixture: Fixture) => {
      if (!navigationReady || !fixture?.fixture?.id) return;

      try {
        setNavigationReady(false);

        // Provide haptic feedback
        if (Platform.OS === "ios") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }

        router.push({
          pathname: "/match-details",
          params: {
            matchId: fixture.fixture.id.toString(),
            sport: "football", // ✅ CRITICAL: Pass sport parameter
            homeTeam: fixture.teams.home.name,
            awayTeam: fixture.teams.away.name,
            homeScore: fixture.goals.home?.toString() || "0",
            awayScore: fixture.goals.away?.toString() || "0",
            status: fixture.fixture.status.long,
            league: fixture.league.name || "",
            date: fixture.fixture.date,
            startTime: fixture.fixture.date,
            homeLogo: fixture.teams.home.logo || "",
            awayLogo: fixture.teams.away.logo || "",
            venue: fixture.fixture.venue?.name || "",
            referee: fixture.fixture.referee || "",
            elapsed: fixture.fixture.status?.elapsed?.toString() || "",
            homeCorners: "0", // Will be updated from API
            awayCorners: "0", // Will be updated from API
            homeRank: fixture.teams.home?.id
              ? fixture.teams.home.id.toString()
              : undefined,
            awayRank: fixture.teams.away?.id
              ? fixture.teams.away.id.toString()
              : undefined,
            halftimeScore: "0-0", // Will be updated from API
            from: "top-matches",
            // ✅ API-DRIVEN: Pass venue data from API (no hardcoding)
            venueName: fixture.fixture.venue?.name || "",
            venueCity: fixture.fixture.venue?.city || "",
          },
        });

        // Reset navigation state after delay
        setTimeout(() => setNavigationReady(true), 500);
      } catch (error) {
        console.error("Navigation error:", error);
        setNavigationReady(true);
      }
    },
    [router, navigationReady],
  );

  // ✅ CATEGORIES: Properly typed and organized
  const topCategories: TopCategory[] = useMemo(
    () => [
      {
        id: "live",
        title: "Live Now",
        icon: Play,
        sport: "football",
        description: "Currently playing matches",
      },
      {
        id: "upcoming",
        title: "Upcoming",
        icon: Clock,
        sport: "football",
        description: "Matches starting soon",
      },
      {
        id: "finished",
        title: "Finished",
        icon: CheckCircle,
        sport: "football",
        description: "Recently completed matches",
      },
    ],
    [],
  );

  // ✅ CATEGORY SELECTION: Smooth transitions
  useEffect(() => {
    if (typeof params.category === "string") {
      const normalizedCategory = params.category.toLowerCase();
      if (
        ["live", "upcoming", "finished"].includes(normalizedCategory) &&
        normalizedCategory !== selectedCategory
      ) {
        setSelectedCategory(normalizedCategory);
        scrollViewRef.current?.scrollTo({ y: 0, animated: false });
      }
    }
  }, [params.category, selectedCategory]);

  const handleCategorySelect = useCallback(
    (categoryId: string) => {
      if (categoryId === selectedCategory || isLoading) return;

      // Provide haptic feedback
      if (Platform.OS === "ios") {
        Haptics.selectionAsync();
      }

      setSelectedCategory(categoryId);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    },
    [selectedCategory, isLoading],
  );

  // ✅ CATEGORY RENDERING: Memoized with proper styling
  const renderCategoryButton = useCallback(
    (category: TopCategory) => (
      <TouchableOpacity
        key={category.id}
        style={styles.categoryButtonContainer}
        onPress={() => handleCategorySelect(category.id)}
        activeOpacity={0.8}
      >
        <View
          style={[
            styles.categoryButton,
            {
              backgroundColor:
                selectedCategory === category.id
                  ? "rgba(220, 38, 38, 0.1)"
                  : "transparent",
              borderColor:
                selectedCategory === category.id
                  ? "#DC2626"
                  : theme.colors.border,
              borderWidth: 1,
            },
          ]}
        >
          <category.icon
            size={18}
            color={
              selectedCategory === category.id
                ? "#DC2626"
                : theme.colors.textSecondary
            }
          />
          <Text
            style={[
              styles.categoryButtonText,
              {
                color:
                  selectedCategory === category.id
                    ? "#DC2626"
                    : theme.colors.text,
                fontWeight: selectedCategory === category.id ? "600" : "500",
              },
            ]}
          >
            {category.title}
          </Text>
        </View>
      </TouchableOpacity>
    ),
    [selectedCategory, theme, handleCategorySelect],
  );

  // ✅ PERFORMANCE: Memoized sorted matches
  const sortedMatches = useMemo(() => {
    if (!matches || !Array.isArray(matches)) return [];

    return matches
      .filter(Boolean) // Remove null/undefined matches
      .sort((a, b) => {
        // Sort by status priority first
        const statusPriority = { live: 1, upcoming: 2, finished: 3 };
        const statusDiff =
          (statusPriority[a.status] || 4) - (statusPriority[b.status] || 4);
        if (statusDiff !== 0) return statusDiff;

        // Then by start time
        return (
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
        );
      });
  }, [matches]);

  // ✅ RENDER SELECTED COMPONENT: Use the refactored components
  const renderSelectedComponent = () => {
    console.log(
      "🔄 MAIN: renderSelectedComponent called with category:",
      selectedCategory,
    );

    const commonProps = {
      sport: "football", // Top Matches shows both sports, but components need a default
      refreshing,
      onRefresh: handleRefresh,
      onMatchesLoaded: setMatches,
    };

    // Let individual components handle their own empty states
    switch (selectedCategory) {
      case "live":
        console.log("✅ MAIN: Rendering TopLiveMatches component");
        return <TopLiveMatches {...commonProps} />;
      case "upcoming":
        console.log("✅ MAIN: Rendering TopUpcomingMatches component");
        return <TopUpcomingMatches {...commonProps} />;
      case "finished":
        console.log("✅ MAIN: Rendering TopFinishedMatches component");
        return <TopFinishedMatches {...commonProps} />;
      default:
        console.log(
          "⚠️ MAIN: Default case - Rendering TopLiveMatches component",
        );
        return <TopLiveMatches {...commonProps} />;
    }
  };

  // Fixed: Remove ScrollView wrapper to prevent VirtualizedList nesting issue
  if (Platform.OS === "web" || (__DEV__ && Platform.OS === "ios")) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.colors.background,
          },
        ]}
      >
        <StatusBar
          barStyle="light-content"
          backgroundColor={theme.colors.backgroundSecondary}
        />

        {/* ✅ SPORTS TABS: At the top of the screen */}
        <View style={styles.sportsTabsContainer}>
          <SportsTabs
            active="important"
            onSelect={(sport) => {
              console.log("🎯 TOP MATCHES - Sports tab selected:", sport);
              // Handle sport selection
              if (sport === "important") {
                // Stay on current screen (Top Matches)
                return;
              } else if (sport === "football") {
                // Navigate to Home tab with football selected
                router.push("/(tabs)?sport=football");
              } else if (sport === "basketball") {
                // Navigate to Home tab with basketball selected
                router.push("/(tabs)?sport=basketball");
              } else if (sport === "filter") {
                // Navigate to filter screen
                router.push("/filter");
              }
            }}
          />
        </View>

        {/* ✅ CATEGORIES: Fixed layout without scrolling */}
        <View style={styles.categoriesContainer}>
          <View style={styles.categoriesContent}>
            {topCategories.map((category, index) => {
              console.log(
                `✅ Rendering category ${index + 1}/3: ${category.title}`,
              );
              return renderCategoryButton(category);
            })}
          </View>
        </View>

        {/* ✅ MAIN CONTENT: Use refactored components with flex container */}
        <View style={styles.contentContainer}>{renderSelectedComponent()}</View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.background,
        },
      ]}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor={theme.colors.backgroundSecondary}
      />

      {/* ✅ SPORTS TABS: Visible at the top - League Filter, Top, Football, Basketball */}
      <View 
        style={styles.sportsTabsContainer}
      >
        <SportsTabs
          active="important"
          onSelect={(sport) => {
            console.log("🎯 TOP MATCHES - Sports tab selected:", sport);
            // Handle sport selection
            if (sport === "important") {
              // Stay on current screen (Top Matches)
              return;
            } else if (sport === "football") {
              // Navigate to Home tab with football selected
              router.push("/(tabs)?sport=football");
            } else if (sport === "basketball") {
              // Navigate to Home tab with basketball selected
              router.push("/(tabs)?sport=basketball");
            } else if (sport === "filter") {
              // Navigate to filter screen
              router.push("/filter");
            }
          }}
        />
      </View>

      {/* ✅ CATEGORIES: Fixed layout without scrolling */}
      <View style={styles.categoriesContainer}>
        <View style={styles.categoriesContent}>
          {topCategories.map((category, index) => {
            console.log(
              `✅ Rendering category ${index + 1}/3: ${category.title}`,
            );
            return renderCategoryButton(category);
          })}
        </View>
      </View>

      {/* ✅ MAIN CONTENT: Use refactored components */}
      <View style={styles.contentContainer}>{renderSelectedComponent()}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fixedHeader: {
    backgroundColor: "transparent",
  },
  sportsTabsContainer: {
    width: "100%",
    paddingBottom: 12,
    zIndex: 1000,
    minHeight: 56,
  },
  categoriesContainer: {
    height: 60,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "transparent",
    width: "100%",
    marginTop: 8,
  },
  categoriesContent: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
    flex: 1,
  },
  categoryButtonContainer: {
    flex: 1,
    position: "relative",
    alignItems: "center",
  },
  categoryButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    justifyContent: "center",
    borderRadius: 8,
    minHeight: 36,
  },
  categoryButtonText: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
  },
  contentContainer: {
    flex: 1,
  },
});
