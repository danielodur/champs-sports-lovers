import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  Animated,
  Dimensions,
  FlatList,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Stack } from "expo-router";
import { useTheme } from "@/hooks/useTheme";
import {
  ArrowLeft,
  ChevronDown,
  Play,
  Calendar,
  Clock,
  Star,
  Share2,
  MoreVertical,
  Menu,
} from "lucide-react-native";
import SeasonsTeamReplaysSelector from "./news-seasons-team-replays-selector";
import NewsTeamRearrangeReplaysTabs from "./news-team-rearrange-replays-tabs";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");

const STORAGE_KEY = "@replays_tabs_arrangement";

interface ReplayMatch {
  id: string;
  date: string;
  time: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  homeTeamLogo: string;
  awayTeamLogo: string;
  league: string;
  round: string;
  status: "finished";
  videoThumbnail: string;
  videoDuration: string;
  highlightType: "full" | "highlights" | "extended";
  views: number;
  publishedAt: string;
}

interface LeagueTab {
  id: string;
  name: string;
  shortName: string;
  country: string;
  isActive?: boolean;
}

const LEAGUE_TABS: LeagueTab[] = [
  {
    id: "uganda-premier-league",
    name: "Uganda Premier League",
    shortName: "Uganda PL",
    country: "Uganda",
    isActive: true,
  },
  {
    id: "premier-league",
    name: "Premier League",
    shortName: "English PL",
    country: "England",
  },
  {
    id: "la-liga",
    name: "La Liga",
    shortName: "Spanish Liga",
    country: "Spain",
  },
  {
    id: "serie-a",
    name: "Serie A",
    shortName: "Italian SA",
    country: "Italy",
  },
  {
    id: "bundesliga",
    name: "Bundesliga",
    shortName: "German BL",
    country: "Germany",
  },
  {
    id: "ligue-1",
    name: "Ligue 1",
    shortName: "French L1",
    country: "France",
  },
  {
    id: "champions-league",
    name: "Champions League",
    shortName: "UCL",
    country: "Europe",
  },
  {
    id: "europa-league",
    name: "Europa League",
    shortName: "UEL",
    country: "Europe",
  },
  {
    id: "africa-cup",
    name: "Africa Cup of Nations",
    shortName: "AFCON",
    country: "Africa",
  },
  {
    id: "caf-cl",
    name: "CAF Champions League",
    shortName: "CAF CL",
    country: "Africa",
  },
];

const SAMPLE_REPLAYS: ReplayMatch[] = [
  {
    id: "1",
    date: "2024-01-20",
    time: "16:00",
    homeTeam: "Vipers SC",
    awayTeam: "KCCA FC",
    homeScore: 3,
    awayScore: 1,
    homeTeamLogo:
      "https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=50&h=50&fit=crop",
    awayTeamLogo:
      "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=50&h=50&fit=crop",
    league: "Uganda Premier League",
    round: "Round 18",
    status: "finished",
    videoThumbnail:
      "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&h=225&fit=crop",
    videoDuration: "11:36",
    highlightType: "highlights",
    views: 15420,
    publishedAt: "2024-01-20T18:30:00Z",
  },
  {
    id: "2",
    date: "2024-01-20",
    time: "19:00",
    homeTeam: "Express FC",
    awayTeam: "SC Villa",
    homeScore: 2,
    awayScore: 1,
    homeTeamLogo:
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=50&h=50&fit=crop",
    awayTeamLogo:
      "https://images.unsplash.com/photo-1606925797300-0b35e9d1794e?w=50&h=50&fit=crop",
    league: "Uganda Premier League",
    round: "Round 18",
    status: "finished",
    videoThumbnail:
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=225&fit=crop",
    videoDuration: "08:09",
    highlightType: "highlights",
    views: 8750,
    publishedAt: "2024-01-20T21:45:00Z",
  },
  {
    id: "3",
    date: "2024-01-19",
    time: "16:00",
    homeTeam: "BUL FC",
    awayTeam: "URA FC",
    homeScore: 0,
    awayScore: 2,
    homeTeamLogo:
      "https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=50&h=50&fit=crop",
    awayTeamLogo:
      "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=50&h=50&fit=crop",
    league: "Uganda Premier League",
    round: "Round 18",
    status: "finished",
    videoThumbnail:
      "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=400&h=225&fit=crop",
    videoDuration: "12:13",
    highlightType: "full",
    views: 12100,
    publishedAt: "2024-01-19T18:45:00Z",
  },
  {
    id: "4",
    date: "2024-01-18",
    time: "20:00",
    homeTeam: "Manchester City",
    awayTeam: "Arsenal",
    homeScore: 2,
    awayScore: 1,
    homeTeamLogo:
      "https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=50&h=50&fit=crop",
    awayTeamLogo:
      "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=50&h=50&fit=crop",
    league: "Premier League",
    round: "Round 22",
    status: "finished",
    videoThumbnail:
      "https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=400&h=225&fit=crop",
    videoDuration: "15:42",
    highlightType: "extended",
    views: 245000,
    publishedAt: "2024-01-18T22:30:00Z",
  },
  {
    id: "5",
    date: "2024-01-18",
    time: "18:00",
    homeTeam: "Real Madrid",
    awayTeam: "Barcelona",
    homeScore: 3,
    awayScore: 2,
    homeTeamLogo:
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=50&h=50&fit=crop",
    awayTeamLogo:
      "https://images.unsplash.com/photo-1606925797300-0b35e9d1794e?w=50&h=50&fit=crop",
    league: "La Liga",
    round: "Round 21",
    status: "finished",
    videoThumbnail:
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=225&fit=crop",
    videoDuration: "18:25",
    highlightType: "full",
    views: 1250000,
    publishedAt: "2024-01-18T20:30:00Z",
  },
];

export default function NewsTeamReplaysScreen() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();

  // State management
  const [activeLeague, setActiveLeague] = useState("uganda-premier-league");
  const [showAllMatchesDropdown, setShowAllMatchesDropdown] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [replays, setReplays] = useState<ReplayMatch[]>(SAMPLE_REPLAYS);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showSeasonsSelector, setShowSeasonsSelector] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState("all-seasons");
  const [selectedTeam, setSelectedTeam] = useState("all-teams");
  const [selectedRound, setSelectedRound] = useState("all-rounds");
  const [showRearrangeModal, setShowRearrangeModal] = useState(false);
  const [visibleLeagues, setVisibleLeagues] = useState(LEAGUE_TABS);
  const [activeLeagueIds, setActiveLeagueIds] = useState<string[]>(
    LEAGUE_TABS.map((tab) => tab.id),
  );

  const scrollX = useRef(new Animated.Value(0)).current;

  // Check if we're in dark mode
  const isDarkMode =
    theme.colors.background === "#2A2A2A" || theme.colors.text === "#FFFFFF";

  // Load saved arrangement on mount
  useEffect(() => {
    loadSavedArrangement();
  }, []);

  const loadSavedArrangement = async () => {
    try {
      const savedArrangement = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedArrangement) {
        const arrangement = JSON.parse(savedArrangement);
        let activeIds = arrangement.active || LEAGUE_TABS.map((tab) => tab.id);

        // Ensure Uganda PL is always first
        const orderedActiveIds = [
          "uganda-premier-league",
          ...activeIds.filter((id: string) => id !== "uganda-premier-league"),
        ];

        // Filter leagues to show only active ones in order
        const orderedLeagues = orderedActiveIds
          .map((id: string) => LEAGUE_TABS.find((tab) => tab.id === id))
          .filter((tab): tab is (typeof LEAGUE_TABS)[0] => Boolean(tab));

        setVisibleLeagues(orderedLeagues);
        setActiveLeagueIds(orderedActiveIds);
      } else {
        // If no saved arrangement, show all tabs by default
        setVisibleLeagues(LEAGUE_TABS);
        setActiveLeagueIds(LEAGUE_TABS.map((tab) => tab.id));
      }
    } catch (error) {
      console.error("Error loading saved arrangement:", error);
      // If error, show all tabs by default
      setVisibleLeagues(LEAGUE_TABS);
      setActiveLeagueIds(LEAGUE_TABS.map((tab) => tab.id));
    }
  };

  const handleSaveArrangement = (activeIds: string[], hiddenIds: string[]) => {
    // Ensure Uganda PL is always first
    const orderedActiveIds = [
      "uganda-premier-league",
      ...activeIds.filter((id: string) => id !== "uganda-premier-league"),
    ];

    // Update visible leagues based on new arrangement
    const orderedLeagues = orderedActiveIds
      .map((id: string) => LEAGUE_TABS.find((tab) => tab.id === id))
      .filter((tab): tab is (typeof LEAGUE_TABS)[0] => Boolean(tab));

    setVisibleLeagues(orderedLeagues);
    setActiveLeagueIds(orderedActiveIds);
  };

  // Filter replays by active league, season, team, and round
  const filteredReplays = replays.filter((replay) => {
    // League filter
    let leagueMatch = false;
    if (activeLeague === "uganda-premier-league") {
      leagueMatch = replay.league === "Uganda Premier League";
    } else if (activeLeague === "premier-league") {
      leagueMatch = replay.league === "Premier League";
    } else if (activeLeague === "la-liga") {
      leagueMatch = replay.league === "La Liga";
    } else {
      leagueMatch = replay.league
        .toLowerCase()
        .includes(activeLeague.replace("-", " "));
    }

    if (!leagueMatch) return false;

    // Season filter (if not "all-seasons")
    if (selectedSeason !== "all-seasons") {
      // Add season logic here when API is integrated
      // For now, show all matches
    }

    // Team filter (if not "all-teams")
    if (selectedTeam !== "all-teams") {
      // Extract team name without season suffix for matching
      const teamName = selectedTeam.replace(/-\d+$/, "").replace(/-/g, " ");
      const teamMatch =
        replay.homeTeam.toLowerCase().includes(teamName.toLowerCase()) ||
        replay.awayTeam.toLowerCase().includes(teamName.toLowerCase());
      if (!teamMatch) return false;
    }

    // Round filter (if not "all-rounds")
    if (selectedRound !== "all-rounds") {
      // Add round logic here when API is integrated
      // For now, show all matches
    }

    return true;
  });

  // Group replays by date
  const groupedReplays = filteredReplays.reduce(
    (groups, replay) => {
      const date = replay.date;
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(replay);
      return groups;
    },
    {} as { [key: string]: ReplayMatch[] },
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        weekday: "short",
      });
    }
  };

  const formatViews = (views: number) => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    }
    return views.toString();
  };

  const getHighlightLabel = (type: string) => {
    switch (type) {
      case "full":
        return "Full Match";
      case "extended":
        return "Extended";
      default:
        return "Highlights";
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  };

  const loadMore = () => {
    if (!loading) {
      setLoading(true);
      // Simulate loading more data
      setTimeout(() => {
        setPage((prev) => prev + 1);
        setLoading(false);
      }, 1500);
    }
  };

  const renderFiltersDropdown = () => (
    <View style={styles.filtersRow}>
      <TouchableOpacity
        style={[
          styles.dropdownContainer,
          {
            backgroundColor: isDarkMode ? "#3A3A3A" : "#F5F5F5",
            borderColor: isDarkMode ? "#555555" : "#E0E0E0",
          },
        ]}
        onPress={() => setShowSeasonsSelector(true)}
      >
        <Text style={[styles.dropdownText, { color: theme.colors.text }]}>
          {selectedSeason === "all-seasons"
            ? "All Matches"
            : selectedSeason === "25-26"
              ? "25-26"
              : selectedSeason === "24-25"
                ? "24-25"
                : "All Matches"}
        </Text>
        <ChevronDown size={16} color={theme.colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );

  const renderReplayCard = (replay: ReplayMatch) => (
    <TouchableOpacity
      key={replay.id}
      style={[
        styles.replayCard,
        {
          backgroundColor: theme.colors.background,
          borderColor: isDarkMode ? "#2F2F2F" : "#F5F5F5",
        },
      ]}
      onPress={() => {
        // Navigate to video player or match details
        router.push({
          pathname: "/match-details",
          params: {
            matchId: replay.id,
            homeTeam: replay.homeTeam,
            awayTeam: replay.awayTeam,
            league: replay.league,
            showVideo: "true",
          },
        });
      }}
    >
      {/* Video Thumbnail */}
      <View style={styles.videoContainer}>
        <Image
          source={{ uri: replay.videoThumbnail }}
          style={styles.videoThumbnail}
          resizeMode="cover"
        />
        <View style={styles.playButtonOverlay}>
          <View style={styles.playButton}>
            <Play size={24} color="#FFFFFF" fill="#FFFFFF" />
          </View>
        </View>
        <View style={styles.videoDurationBadge}>
          <Text style={styles.videoDurationText}>{replay.videoDuration}</Text>
        </View>
        <View style={styles.highlightTypeBadge}>
          <Text style={styles.highlightTypeText}>
            {getHighlightLabel(replay.highlightType)}
          </Text>
        </View>
      </View>

      {/* Match Information */}
      <View style={styles.matchInfo}>
        <View style={styles.matchHeader}>
          <Text
            style={[styles.leagueRound, { color: theme.colors.textSecondary }]}
          >
            {replay.league} • {replay.round}
          </Text>
          <TouchableOpacity>
            <MoreVertical size={16} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.teamsContainer}>
          <View style={styles.teamInfo}>
            <Image
              source={{ uri: replay.homeTeamLogo }}
              style={styles.teamLogo}
              resizeMode="cover"
            />
            <Text
              style={[styles.teamName, { color: theme.colors.text }]}
              numberOfLines={1}
            >
              {replay.homeTeam}
            </Text>
          </View>

          <View style={styles.scoreContainer}>
            <Text style={[styles.score, { color: theme.colors.text }]}>
              {replay.homeScore} - {replay.awayScore}
            </Text>
          </View>

          <View style={styles.teamInfo}>
            <Image
              source={{ uri: replay.awayTeamLogo }}
              style={styles.teamLogo}
              resizeMode="cover"
            />
            <Text
              style={[styles.teamName, { color: theme.colors.text }]}
              numberOfLines={1}
            >
              {replay.awayTeam}
            </Text>
          </View>
        </View>

        <View style={styles.videoStats}>
          <View style={styles.viewsContainer}>
            <Text
              style={[styles.viewsText, { color: theme.colors.textSecondary }]}
            >
              {formatViews(replay.views)} views
            </Text>
          </View>
          <Text
            style={[styles.publishTime, { color: theme.colors.textSecondary }]}
          >
            {new Date(replay.publishedAt).toLocaleDateString()}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderDateSection = ({ item }: { item: [string, ReplayMatch[]] }) => {
    const [date, dayReplays] = item;

    return (
      <View style={styles.dateSection}>
        <View
          style={[
            styles.dateSectionHeader,
            {
              backgroundColor: isDarkMode ? "#2A2A2A" : "#F8F8F8",
              borderBottomColor: isDarkMode ? "#2F2F2F" : "#F0F0F0",
            },
          ]}
        >
          <Text style={[styles.dateText, { color: theme.colors.text }]}>
            {formatDate(date)}
          </Text>
        </View>
        {dayReplays.map((replay) => renderReplayCard(replay))}
      </View>
    );
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <StatusBar
        barStyle={isDarkMode ? "light-content" : "dark-content"}
        backgroundColor={theme.colors.background}
        translucent={false}
      />

      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: "Match Replays",
          headerTitleStyle: {
            color: theme.colors.text,
            fontSize: 18,
            fontWeight: "600",
          },
          headerStyle: {
            backgroundColor: theme.colors.background,
          },
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.headerBackButton}
            >
              <ArrowLeft size={24} color={theme.colors.text} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity style={styles.headerShareButton}>
              <Share2 size={20} color={theme.colors.text} />
            </TouchableOpacity>
          ),
        }}
      />

      {/* League Tabs */}
      <View
        style={[
          styles.leagueTabsContainer,
          { borderBottomColor: isDarkMode ? "#3A3A3A" : "#E0E0E0" },
        ]}
      >
        <View style={styles.tabsWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.leagueTabsScroll}
            contentContainerStyle={styles.leagueTabsContent}
          >
            {visibleLeagues.map((league) => (
              <TouchableOpacity
                key={league.id}
                style={[
                  styles.leagueTab,
                  {
                    borderBottomColor: "transparent",
                  },
                ]}
                onPress={() => setActiveLeague(league.id)}
              >
                <Text
                  style={[
                    styles.leagueTabText,
                    {
                      color:
                        activeLeague === league.id
                          ? isDarkMode
                            ? "#FF6B6B"
                            : "#FF4444"
                          : theme.colors.textSecondary,
                      fontWeight: activeLeague === league.id ? "700" : "400",
                    },
                  ]}
                >
                  {league.shortName}
                </Text>
                {activeLeague === league.id && (
                  <View
                    style={[
                      styles.activeTabIndicator,
                      {
                        backgroundColor: isDarkMode ? "#FF6B6B" : "#FF4444",
                      },
                    ]}
                  />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Menu button for rearranging tabs */}
          <TouchableOpacity
            style={[
              styles.menuButton,
              { backgroundColor: theme.colors.background },
            ]}
            onPress={() => setShowRearrangeModal(true)}
            activeOpacity={0.7}
          >
            <Menu size={20} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filters Dropdown */}
      <View style={styles.filtersContainer}>{renderFiltersDropdown()}</View>

      {/* Replays List */}
      <FlatList
        data={Object.entries(groupedReplays)}
        renderItem={renderDateSection}
        keyExtractor={([date]) => date}
        style={styles.replaysList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={isDarkMode ? "#FF6B6B" : "#FF4444"}
            colors={["#FF4444"]}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Calendar size={48} color={theme.colors.textSecondary} />
            <Text
              style={[styles.emptyText, { color: theme.colors.textSecondary }]}
            >
              No replays available for this league
            </Text>
          </View>
        }
      />

      {/* Seasons Team Selector Modal */}
      <SeasonsTeamReplaysSelector
        visible={showSeasonsSelector}
        onClose={() => setShowSeasonsSelector(false)}
        selectedLeague={activeLeague}
        selectedSeason={selectedSeason}
        selectedTeam={selectedTeam}
        selectedRound={selectedRound}
        onSeasonSelect={setSelectedSeason}
        onTeamSelect={setSelectedTeam}
        onRoundSelect={setSelectedRound}
      />

      {/* Rearrange Tabs Modal */}
      {showRearrangeModal && (
        <NewsTeamRearrangeReplaysTabs
          visible={showRearrangeModal}
          onClose={() => setShowRearrangeModal(false)}
          currentActiveLeagues={activeLeagueIds}
          onSaveArrangement={handleSaveArrangement}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBackButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerShareButton: {
    padding: 8,
    marginRight: -8,
  },
  leagueTabsContainer: {
    borderBottomWidth: 1,
  },
  tabsWrapper: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
  },
  leagueTabsScroll: {
    flex: 1,
  },
  leagueTabsContent: {
    paddingLeft: 16,
    paddingRight: 60,
  },
  leagueTab: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 8,
    borderBottomWidth: 3,
    position: "relative",
    alignItems: "center",
  },
  leagueTabText: {
    fontSize: 14,
    textAlign: "center",
  },
  filtersContainer: {
    padding: 16,
    backgroundColor: "transparent",
    alignItems: "center",
  },
  filtersRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  dropdownContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 140,
  },
  dropdownText: {
    fontSize: 14,
    fontWeight: "500",
    marginRight: 8,
  },
  replaysList: {
    flex: 1,
  },
  dateSection: {
    marginBottom: 8,
  },
  dateSectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  dateText: {
    fontSize: 16,
    fontWeight: "600",
  },
  replayCard: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  videoContainer: {
    position: "relative",
    width: "100%",
    height: 200,
  },
  videoThumbnail: {
    width: "100%",
    height: "100%",
  },
  playButtonOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  videoDurationBadge: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  videoDurationText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  highlightTypeBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "#FF4444",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  highlightTypeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "600",
  },
  matchInfo: {
    padding: 16,
  },
  matchHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  leagueRound: {
    fontSize: 12,
    fontWeight: "500",
  },
  teamsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  teamInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  teamLogo: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  teamName: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
  },
  scoreContainer: {
    paddingHorizontal: 16,
  },
  score: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  videoStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  viewsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  viewsText: {
    fontSize: 12,
  },
  publishTime: {
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: "center",
  },
  activeTabIndicator: {
    position: "absolute",
    bottom: 0,
    left: "50%",
    marginLeft: -15,
    width: 30,
    height: 3,
    borderRadius: 1.5,
  },
  menuButton: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    zIndex: 10,
  },
});
