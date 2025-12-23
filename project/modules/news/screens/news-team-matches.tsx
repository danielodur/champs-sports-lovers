import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Stack } from "expo-router";
import { useTheme } from "@/hooks/useTheme";
import {
  ArrowLeft,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Star,
  Share2,
  Search,
} from "lucide-react-native";
import NewsSeasonsSelector from "@/modules/news/components/shared/news-seasons-selector";
import NewsMatchesLeagueRoundSelector from "@/modules/news/components/shared/news-matches-league-round-selector";
import NewsTeamLiveMatches from "@/modules/news/components/shared/news-team-live-matches";

const { width } = Dimensions.get("window");

interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore?: number;
  awayScore?: number;
  date: string;
  time: string;
  competition: string;
  matchStatus?: "FT" | "Live" | "Upcoming" | "HT" | "1H" | "2H";
  homeLogoUrl?: string;
  awayLogoUrl?: string;
  playerName?: string;
  playerRating?: number;
}

// Sample data for demonstration with live match goals
const sampleMatches: Match[] = [
  {
    id: "1",
    homeTeam: "Vipers SC",
    awayTeam: "Bright Stars FC",
    homeScore: 2,
    awayScore: 1,
    date: "2024-10-04",
    time: "15:00",
    competition: "Uganda Premier League",
    matchStatus: "Live",
    playerName: "John Doe",
    playerRating: 7.6,
  },
  {
    id: "2",
    homeTeam: "NEC FC",
    awayTeam: "Arua Hill SC",
    date: "2024-10-05",
    time: "16:30",
    competition: "Uganda Premier League",
    matchStatus: "Live",
    playerName: "James Smith",
    playerRating: 7.9,
  },
  {
    id: "3",
    homeTeam: "BUL FC",
    awayTeam: "Maroons FC",
    date: "2024-10-06",
    time: "17:00",
    competition: "Uganda Premier League",
    matchStatus: "Live",
    playerName: "Mike Johnson",
    playerRating: 6.8,
  },
];

// Sample live match data with goals
const sampleLiveMatchData = {
  id: "1",
  homeTeam: "Vipers SC",
  awayTeam: "Bright Stars FC",
  homeScore: 2,
  awayScore: 1,
  homeLogoUrl: "",
  awayLogoUrl: "",
  matchStatus: "Live" as const,
  currentMinute: 75,
  goals: [
    {
      id: "goal1",
      minute: 23,
      playerName: "Martin Kizza",
      playerImage: "",
      teamSide: "home" as const,
      rating: 7.6,
    },
    {
      id: "goal2",
      minute: 45,
      playerName: "Patrick Kaddu",
      playerImage: "",
      teamSide: "away" as const,
      rating: 7.2,
    },
    {
      id: "goal3",
      minute: 67,
      playerName: "Yunus Sentamu",
      playerImage: "",
      teamSide: "home" as const,
      rating: 8.1,
    },
  ],
};

const rounds = [
  "Round 1",
  "Round 2",
  "Round 3",
  "Round 4",
  "Round 5",
  "Round 6",
  "Round 7",
  "Round 8",
];

const getLeagueGradientColors = (): string[] => [
  "#1e3a8a",
  "#3b82f6",
  "#60a5fa",
];

const generateTeamLogo = (teamName: string): string => {
  return `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(teamName)}&backgroundColor=f0f0f0`;
};

export default function NewsTeamMatchesScreen() {
  const router = useRouter();
  const theme = useTheme();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const teamName = Array.isArray(params.teamName)
    ? params.teamName[0]
    : (params.teamName as string);

  const [selectedRound, setSelectedRound] = useState("Round 8");
  const [selectedSeason, setSelectedSeason] = useState("24-25");
  const [showSeasonsModal, setShowSeasonsModal] = useState(false);
  const [showRoundsModal, setShowRoundsModal] = useState(false);
  const [isStarred, setIsStarred] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);

  const isDarkMode =
    theme.colors.background === "#2A2A2A" || theme.colors.text === "#FFFFFF";
  const gradientColors = getLeagueGradientColors();

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handlePreviousRound = () => {
    const currentIndex = rounds.findIndex((r) => r === selectedRound);
    if (currentIndex > 0) {
      setSelectedRound(rounds[currentIndex - 1]);
    }
  };

  const handleNextRound = () => {
    const currentIndex = rounds.findIndex((r) => r === selectedRound);
    if (currentIndex < rounds.length - 1) {
      setSelectedRound(rounds[currentIndex + 1]);
    }
  };

  const renderMatch = (match: Match) => (
    <TouchableOpacity
      key={match.id}
      style={[
        styles.matchContainer,
        {
          backgroundColor: theme.colors.background,
          borderBottomColor: isDarkMode ? "#555555" : "#E0E0E0",
        },
      ]}
      activeOpacity={0.7}
      onPress={() => {
        router.push({
          pathname: "/match-details",
          params: {
            matchId: match.id,
            homeTeam: match.homeTeam,
            awayTeam: match.awayTeam,
            league: match.competition,
          },
        });
      }}
    >
      <View style={styles.matchLayout}>
        <View style={styles.leftSection}>
          <Text
            style={[styles.matchDate, { color: theme.colors.textSecondary }]}
          >
            {new Date(match.date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </Text>
          <Text
            style={[styles.matchTime, { color: theme.colors.textSecondary }]}
          >
            {match.time}
          </Text>
          {match.matchStatus && (
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    match.matchStatus === "FT"
                      ? "#4CAF50"
                      : match.matchStatus === "Live"
                        ? "#FF5722"
                        : "#2196F3",
                },
              ]}
            >
              <Text style={styles.statusText}>{match.matchStatus}</Text>
            </View>
          )}
        </View>

        <View style={styles.middleSection}>
          <View style={styles.teamContainer}>
            <View style={styles.teamRow}>
              <Image
                source={{
                  uri: match.homeLogoUrl || generateTeamLogo(match.homeTeam),
                }}
                style={styles.teamLogo}
              />
              <Text
                style={[
                  styles.teamName,
                  {
                    color: theme.colors.text,
                    fontWeight:
                      teamName &&
                      match.homeTeam
                        .toLowerCase()
                        .includes(teamName.toLowerCase())
                        ? "700"
                        : "500",
                  },
                ]}
                numberOfLines={1}
              >
                {match.homeTeam}
              </Text>
            </View>
            <View style={styles.teamRow}>
              <Image
                source={{
                  uri: match.awayLogoUrl || generateTeamLogo(match.awayTeam),
                }}
                style={styles.teamLogo}
              />
              <Text
                style={[
                  styles.teamName,
                  {
                    color: theme.colors.text,
                    fontWeight:
                      teamName &&
                      match.awayTeam
                        .toLowerCase()
                        .includes(teamName.toLowerCase())
                        ? "700"
                        : "500",
                  },
                ]}
                numberOfLines={1}
              >
                {match.awayTeam}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.rightSection}>
          {match.matchStatus === "Live" && match.id === "1" ? (
            <NewsTeamLiveMatches
              matchData={sampleLiveMatchData}
              isLive={true}
            />
          ) : (
            <View style={styles.scoreSection}>
              <Text style={[styles.score, { color: theme.colors.text }]}>
                {match.homeScore !== undefined ? match.homeScore : "-"}
              </Text>
              <Text style={[styles.score, { color: theme.colors.text }]}>
                {match.awayScore !== undefined ? match.awayScore : "-"}
              </Text>
            </View>
          )}
        </View>
      </View>

      {match.playerName && (
        <View style={styles.playerContainer}>
          <View
            style={[
              styles.playerAvatar,
              { backgroundColor: theme.colors.primary },
            ]}
          >
            <Text style={styles.playerInitials}>
              {match.playerName
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </Text>
          </View>
          <View style={styles.playerInfo}>
            <Text style={[styles.playerName, { color: theme.colors.text }]}>
              {match.playerName}
            </Text>
            <Text style={[styles.playerRating, { color: "#ff6b35" }]}>
              ⭐ {match.playerRating}
            </Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      {/* Header */}
      <View style={[styles.headerImageContainer, { paddingTop: insets.top }]}>
        <View
          style={[styles.gradientBase, { backgroundColor: gradientColors[0] }]}
        />
        <View
          style={[
            styles.gradientMiddle,
            { backgroundColor: gradientColors[1] },
          ]}
        />
        <View
          style={[styles.gradientTop, { backgroundColor: gradientColors[2] }]}
        />

        <View style={styles.headerContent}>
          <View style={styles.topNavBar}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <ArrowLeft size={24} color="white" />
            </TouchableOpacity>

            <View style={styles.topRightButtons}>
              <TouchableOpacity style={styles.iconButton} activeOpacity={0.7}>
                <Search size={20} color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => setIsStarred(!isStarred)}
                activeOpacity={0.7}
              >
                <Star
                  size={20}
                  color={isStarred ? "#FFD700" : "white"}
                  fill={isStarred ? "#FFD700" : "transparent"}
                />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton} activeOpacity={0.7}>
                <Share2 size={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.leagueInfoContainer}>
          <View style={styles.leagueLogo}>
            <View style={styles.leagueLogoInner}>
              <Text style={styles.leagueLogoText}>UP</Text>
            </View>
          </View>
          <Text style={styles.leagueNameHeader}>Uganda Premier League</Text>
          <Text style={styles.leagueSubtitle}>
            {teamName ? `${teamName} - Uganda` : "Uganda"}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.seasonInfo}
          onPress={() => setShowSeasonsModal(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.seasonText}>08/30</Text>
          <Text style={styles.seasonLabel}>8th Round</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View
        style={[
          styles.tabsContainer,
          { backgroundColor: isDarkMode ? "#2A2A2A" : "#FFFFFF" },
        ]}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabsScrollView}
        >
          <TouchableOpacity
            style={[styles.tab, styles.firstTab]}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color: isDarkMode ? "#FFFFFF" : "#6B7280",
                  fontWeight: "400",
                },
              ]}
            >
              Moments
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tab} activeOpacity={0.7}>
            <Text
              style={[
                styles.tabText,
                {
                  color: isDarkMode ? "#FFFFFF" : "#6B7280",
                  fontWeight: "400",
                },
              ]}
            >
              Draft
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tab} activeOpacity={0.7}>
            <Text
              style={[
                styles.tabText,
                {
                  color: isDarkMode ? "#FFFFFF" : "#6B7280",
                  fontWeight: "400",
                },
              ]}
            >
              Table
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, styles.activeTab]}
            activeOpacity={0.7}
          >
            <Text
              style={[styles.tabText, { color: "#FF6B35", fontWeight: "600" }]}
            >
              Matches
            </Text>
            <View style={styles.activeTabIndicator} />
          </TouchableOpacity>
        </ScrollView>

        <View style={styles.seasonSelectorContainer}>
          <NewsSeasonsSelector
            selectedSeason={selectedSeason}
            onSeasonChange={setSelectedSeason}
            showModal={showSeasonsModal}
            setShowModal={setShowSeasonsModal}
          />
        </View>
      </View>

      {/* Round Navigation */}
      <View style={styles.roundNavigation}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={handlePreviousRound}
        >
          <ChevronLeft size={16} color={theme.colors.text} />
          <Text style={[styles.navButtonText, { color: theme.colors.text }]}>
            Previous
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.roundSelector}
          onPress={() => setShowRoundsModal(true)}
          activeOpacity={0.7}
        >
          <Text style={[styles.roundText, { color: theme.colors.text }]}>
            {selectedRound}
          </Text>
          <ChevronDown size={10} color={theme.colors.text} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.navButton} onPress={handleNextRound}>
          <Text style={[styles.navButtonText, { color: theme.colors.text }]}>
            Next
          </Text>
          <ChevronRight size={16} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      {/* Matches List */}
      <ScrollView
        style={[styles.content, { backgroundColor: theme.colors.background }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={["#FF6B35"]}
            tintColor="#FF6B35"
          />
        }
      >
        <View style={styles.matchesList}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FF6B35" />
              <Text
                style={[
                  styles.loadingText,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Loading matches...
              </Text>
            </View>
          ) : sampleMatches.length > 0 ? (
            sampleMatches.map(renderMatch)
          ) : (
            <View style={styles.noMatchesContainer}>
              <Calendar size={48} color={theme.colors.textSecondary} />
              <Text
                style={[
                  styles.noMatchesText,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {teamName
                  ? `No matches found for ${teamName}`
                  : "No matches scheduled"}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modals */}
      <NewsMatchesLeagueRoundSelector
        rounds={rounds}
        selectedRound={selectedRound}
        onRoundChange={setSelectedRound}
        showModal={showRoundsModal}
        setShowModal={setShowRoundsModal}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerImageContainer: {
    position: "relative",
    height: 220,
    overflow: "hidden",
  },
  gradientBase: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 1,
  },
  gradientMiddle: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.8,
  },
  gradientTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.6,
  },
  headerContent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
  },
  topNavBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  topRightButtons: {
    flexDirection: "row",
    gap: 12,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  leagueInfoContainer: {
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    top: "50%",
    left: 0,
    right: 0,
    transform: [{ translateY: -40 }],
  },
  leagueLogo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  leagueLogoInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  leagueLogoText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a1a1a",
    fontFamily: "Inter-Bold",
  },
  leagueNameHeader: {
    fontSize: 20,
    fontWeight: "700",
    color: "white",
    textAlign: "center",
    fontFamily: "Inter-Bold",
    marginBottom: 4,
  },
  leagueSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
    fontFamily: "Inter-Medium",
  },
  seasonInfo: {
    position: "absolute",
    top: 80,
    right: 20,
    alignItems: "center",
  },
  seasonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
    fontFamily: "Inter-SemiBold",
  },
  seasonLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    fontFamily: "Inter-Regular",
    marginTop: 2,
  },
  seasonSelectorContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 16,
  },
  tabsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tabsScrollView: {
    flex: 1,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 8,
  },
  firstTab: {
    marginLeft: 0,
  },
  activeTab: {
    position: "relative",
  },
  tabText: {
    fontSize: 16,
    fontFamily: "Inter-Medium",
  },
  activeTabIndicator: {
    position: "absolute",
    bottom: 0,
    left: 16,
    right: 16,
    height: 2,
    backgroundColor: "#FF6B35",
    borderRadius: 1,
  },
  roundNavigation: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "transparent",
  },
  navButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 4,
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: "500",
    fontFamily: "Inter-Medium",
  },
  roundSelector: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 4,
    paddingVertical: 2,
    gap: 2,
  },
  roundText: {
    fontSize: 11,
    fontWeight: "600",
    fontFamily: "Inter-SemiBold",
  },
  content: {
    flex: 1,
  },
  matchesList: {
    paddingBottom: 20,
  },
  matchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  matchLayout: {
    flexDirection: "row",
    alignItems: "center",
  },
  leftSection: {
    width: 80,
    alignItems: "center",
  },
  matchDate: {
    fontSize: 12,
    fontWeight: "500",
    fontFamily: "Inter-Medium",
    textAlign: "center",
  },
  matchTime: {
    fontSize: 11,
    fontFamily: "Inter-Regular",
    textAlign: "center",
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
    color: "white",
    fontFamily: "Inter-SemiBold",
  },
  middleSection: {
    flex: 1,
    paddingHorizontal: 12,
  },
  teamContainer: {
    gap: 8,
  },
  teamRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  teamLogo: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  teamName: {
    fontSize: 14,
    fontFamily: "Inter-Medium",
    flex: 1,
  },
  rightSection: {
    width: 60,
    alignItems: "center",
    gap: 8,
  },
  scoreSection: {
    alignItems: "center",
    gap: 8,
  },
  score: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Inter-SemiBold",
    textAlign: "center",
  },
  playerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(128,128,128,0.1)",
    gap: 12,
  },
  playerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  playerInitials: {
    fontSize: 12,
    fontWeight: "600",
    color: "white",
    fontFamily: "Inter-SemiBold",
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 13,
    fontWeight: "500",
    fontFamily: "Inter-Medium",
  },
  playerRating: {
    fontSize: 12,
    fontWeight: "500",
    fontFamily: "Inter-Medium",
    marginTop: 1,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
    marginTop: 12,
  },
  noMatchesContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  noMatchesText: {
    fontSize: 16,
    fontFamily: "Inter-Medium",
    textAlign: "center",
    marginTop: 16,
  },
});
