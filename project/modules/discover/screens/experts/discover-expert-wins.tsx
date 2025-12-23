import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  SafeAreaView,
  Dimensions,
  RefreshControl,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  Share2,
  TrendingUp,
  BarChart3,
  Users,
  Calendar,
  Clock,
  Target,
  Trophy,
  Activity,
  Star,
  Eye,
  MessageCircle,
  ThumbsUp,
  ChevronRight,
  TrendingDown,
} from "lucide-react-native";
import DiscoverExpertPaidPredictions from "./discover-expert-paid-predictions";
import DiscoverExpertPublicPredictions from "./discover-expert-public-predictions";
import DiscoverFollowExpert from "./discover-follow-expert";

const { width } = Dimensions.get("window");

interface ExpertWinData {
  id: string;
  name: string;
  username: string;
  avatar: string;
  followers: number;
  level: number;
  badge?: "crown" | "star" | "diamond";
}

interface LeagueStats {
  id: string;
  name: string;
  logo: string;
  season: string;
  recentWins: number;
  recentTotal: number;
  longestStreak: number;
  totalPredictions: number;
  accuracy: number;
  recentPerformance: ("win" | "loss")[];
}

interface MatchPredictionResult {
  id: string;
  match: {
    homeTeam: string;
    awayTeam: string;
    homeTeamLogo: string;
    awayTeamLogo: string;
    league: string;
    date: string;
    time: string;
    result?: string;
  };
  prediction: string;
  confidence: number;
  analysis: string;
  result: "win" | "loss" | "pending";
  likes: number;
  comments: number;
  views: number;
  publishedAt: string;
  finalScore?: string;
}

function DiscoverExpertWinsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  const params = useLocalSearchParams();

  const [refreshing, setRefreshing] = useState(false);
  const [expertData, setExpertData] = useState<ExpertWinData | null>(null);
  const [leagueStats, setLeagueStats] = useState<LeagueStats | null>(null);
  const [predictions, setPredictions] = useState<MatchPredictionResult[]>([]);
  const [selectedTab, setSelectedTab] = useState<"paid" | "public">("paid");
  const [followerCount, setFollowerCount] = useState<number>(12547);

  useEffect(() => {
    loadExpertWinsData();
    console.log("Theme debug:", {
      background: theme.colors.background,
      text: theme.colors.text,
      border: theme.colors.border,
      backgroundSecondary: theme.colors.backgroundSecondary,
    });
  }, [theme]);

  const loadExpertWinsData = async () => {
    try {
      // Extract parameters from navigation
      const expertId = params.expertId as string;
      const expertName = params.expertName as string;
      const leagueId = params.leagueId as string;
      const leagueName = params.leagueName as string;

      // Mock data - in real app this would come from API using params.expertId and params.leagueId
      const mockExpertData: ExpertWinData = {
        id: expertId || "1",
        name: expertName || "Football Expert",
        username: "football_expert",
        avatar: "https://randomuser.me/api/portraits/men/1.jpg",
        followers: 12547,
        level: 8,
        badge: "crown",
      };

      const getLeagueLogo = (leagueName: string) => {
        const logoMap: { [key: string]: string } = {
          "UEFA Champions League":
            "https://logos-world.net/wp-content/uploads/2020/06/UEFA-Champions-League-Logo.png",
          "Premier League":
            "https://logos-world.net/wp-content/uploads/2020/06/Premier-League-Logo.png",
          "Serie A":
            "https://logos-world.net/wp-content/uploads/2020/06/Serie-A-Logo.png",
          "La Liga":
            "https://logos-world.net/wp-content/uploads/2020/06/La-Liga-Logo.png",
          Bundesliga:
            "https://logos-world.net/wp-content/uploads/2020/06/Bundesliga-Logo.png",
        };
        return (
          logoMap[leagueName] ||
          "https://logos-world.net/wp-content/uploads/2020/06/Premier-League-Logo.png"
        );
      };

      const mockLeagueStats: LeagueStats = {
        id: leagueId || "premier-league",
        name: leagueName || "Premier League",
        logo: getLeagueLogo(leagueName || "Premier League"),
        season: "2025 Season",
        recentWins: 6,
        recentTotal: 10,
        longestStreak: 6,
        totalPredictions: 72,
        accuracy: 78,
        recentPerformance: [
          "loss",
          "win",
          "win",
          "win",
          "win",
          "win",
          "win",
          "win",
        ],
      };

      // Generate league-specific predictions based on the selected league
      const getLeagueSpecificPredictions = (
        leagueName: string,
      ): MatchPredictionResult[] => {
        const baseTeams: { [key: string]: string[] } = {
          "UEFA Champions League": [
            "Real Madrid",
            "Barcelona",
            "Manchester City",
            "Bayern Munich",
            "PSG",
            "Liverpool",
          ],
          "Premier League": [
            "Manchester City",
            "Arsenal",
            "Liverpool",
            "Chelsea",
            "Tottenham",
            "Manchester United",
          ],
          "Serie A": [
            "Juventus",
            "Inter Milan",
            "AC Milan",
            "Napoli",
            "Roma",
            "Lazio",
          ],
          "La Liga": [
            "Real Madrid",
            "Barcelona",
            "Atletico Madrid",
            "Sevilla",
            "Valencia",
            "Villarreal",
          ],
          Bundesliga: [
            "Bayern Munich",
            "Borussia Dortmund",
            "RB Leipzig",
            "Bayer Leverkusen",
            "Eintracht Frankfurt",
            "Wolfsburg",
          ],
        };

        const teams = baseTeams[leagueName] || baseTeams["Premier League"];

        return [
          {
            id: "1",
            match: {
              homeTeam: teams[0],
              awayTeam: teams[1],
              homeTeamLogo: "https://via.placeholder.com/40x40",
              awayTeamLogo: "https://via.placeholder.com/40x40",
              league: leagueName,
              date: "10/04",
              time: "21:00",
              result: "2-1",
            },
            prediction: `High accuracy prediction! Can ${teams[0]} maintain their winning streak against ${teams[1]}?`,
            confidence: 88,
            analysis: `${teams[0]} showing strong home form with key tactical advantages`,
            result: "win",
            likes: 98,
            comments: 23,
            views: 1547,
            publishedAt: "10/04 15:54",
            finalScore: "2-1",
          },
          {
            id: "2",
            match: {
              homeTeam: teams[2],
              awayTeam: teams[3],
              homeTeamLogo: "https://via.placeholder.com/40x40",
              awayTeamLogo: "https://via.placeholder.com/40x40",
              league: leagueName,
              date: "09/30",
              time: "01:00",
              result: "3-1",
            },
            prediction: `Expert analysis! ${teams[2]} vs ${teams[3]} - Key tactical matchup ahead`,
            confidence: 82,
            analysis: `${teams[2]} defensive strategy against ${teams[3]}'s attacking prowess`,
            result: "win",
            likes: 98,
            comments: 18,
            views: 1203,
            publishedAt: "09/29 19:58",
            finalScore: "3-1",
          },
          {
            id: "3",
            match: {
              homeTeam: teams[4],
              awayTeam: teams[5],
              homeTeamLogo: "https://via.placeholder.com/40x40",
              awayTeamLogo: "https://via.placeholder.com/40x40",
              league: leagueName,
              date: "09/14",
              time: "22:30",
              result: "1-2",
            },
            prediction: `Ultra-high accuracy! ${teams[4]} home advantage vs ${teams[5]}'s away form`,
            confidence: 85,
            analysis: `Home advantage crucial for ${teams[4]} against ${teams[5]}'s strong away record`,
            result: "loss",
            likes: 98,
            comments: 31,
            views: 1456,
            publishedAt: "09/14 19:15",
            finalScore: "1-2",
          },
          {
            id: "4",
            match: {
              homeTeam: teams[1],
              awayTeam: teams[4],
              homeTeamLogo: "https://via.placeholder.com/40x40",
              awayTeamLogo: "https://via.placeholder.com/40x40",
              league: leagueName,
              date: "09/13",
              time: "23:30",
              result: "0-1",
            },
            prediction: `Stable high win rate! ${teams[1]} defensive test against ${teams[4]}'s pressure`,
            confidence: 79,
            analysis: `${teams[1]}'s defensive capabilities tested against ${teams[4]}'s attacking style`,
            result: "win",
            likes: 98,
            comments: 22,
            views: 1123,
            publishedAt: "09/13 20:46",
            finalScore: "0-1",
          },
          {
            id: "5",
            match: {
              homeTeam: teams[0],
              awayTeam: teams[2],
              homeTeamLogo: "https://via.placeholder.com/40x40",
              awayTeamLogo: "https://via.placeholder.com/40x40",
              league: leagueName,
              date: "09/13",
              time: "21:00",
              result: "4-0",
            },
            prediction: `Championship level prediction! ${teams[0]} dominance continues at home`,
            confidence: 92,
            analysis: `${teams[0]}'s home fortress record against ${teams[2]}'s away form struggles`,
            result: "win",
            likes: 168,
            comments: 45,
            views: 2108,
            publishedAt: "09/13 23:19",
            finalScore: "4-0",
          },
        ];
      };

      const mockPredictions = getLeagueSpecificPredictions(
        leagueName || "Premier League",
      );

      setExpertData(mockExpertData);
      setLeagueStats(mockLeagueStats);
      setPredictions(mockPredictions);
    } catch (error) {
      console.error("Error loading expert wins data:", error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadExpertWinsData();
    setRefreshing(false);
  };

  const getResultColor = (result: string) => {
    switch (result) {
      case "win":
        return "#FF4444";
      case "loss":
        return "#666666";
      default:
        return "#FFA500";
    }
  };

  const getResultText = (result: string) => {
    switch (result) {
      case "win":
        return "Win";
      case "loss":
        return "Loss";
      default:
        return "Pending";
    }
  };

  const renderHeader = () => (
    <SafeAreaView
      style={[
        styles.headerContainer,
        {
          backgroundColor: theme.colors.background,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
        },
      ]}
    >
      <View style={styles.headerContent}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Expert Wins
        </Text>
        <TouchableOpacity style={styles.shareButton}>
          <Share2 size={20} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  const renderExpertInfo = () => (
    <View style={styles.expertInfoWrapper}>
      <View
        style={[
          styles.expertInfoContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <Image
          source={{ uri: expertData?.avatar }}
          style={styles.expertAvatar}
        />
        <View style={styles.expertDetails}>
          <View style={styles.expertNameRow}>
            <Text style={[styles.expertName, { color: theme.colors.text }]}>
              {expertData?.name}
            </Text>
            {expertData?.badge === "crown" && (
              <View style={styles.crownBadge}>
                <Trophy size={14} color="#FFD700" />
              </View>
            )}
          </View>
          <Text
            style={[styles.expertLabel, { color: theme.colors.textSecondary }]}
          >
            Expert
          </Text>
        </View>
        <DiscoverFollowExpert
          expertId={expertData?.id || ""}
          expertName={expertData?.name || ""}
          initialFollowState={false}
          followerCount={followerCount}
          onFollowChange={(isFollowing, newCount) => {
            setFollowerCount(newCount);
            console.log("Follow status changed:", isFollowing, newCount);
          }}
          style={styles.followButtonContainer}
        />
      </View>
    </View>
  );

  const renderLeagueStats = () => (
    <View style={styles.leagueStatsWrapper}>
      <View
        style={[
          styles.leagueStatsContainer,
          {
            backgroundColor:
              theme.colors.text === "#FFFFFF"
                ? "rgba(255, 255, 255, 0.05)"
                : "rgba(0, 0, 0, 0.05)",
            borderColor:
              theme.colors.text === "#FFFFFF"
                ? "rgba(255, 255, 255, 0.3)"
                : "rgba(0, 0, 0, 0.1)",
          },
        ]}
      >
        <View style={styles.leagueHeader}>
          <Image
            source={{ uri: leagueStats?.logo }}
            style={styles.leagueLogo}
          />
          <View style={styles.leagueInfo}>
            <Text style={[styles.leagueName, { color: theme.colors.text }]}>
              {leagueStats?.name}
            </Text>
            <Text
              style={[styles.leagueSeason, { color: theme.colors.primary }]}
            >
              {leagueStats?.season}
            </Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: theme.colors.primary }]}>
              {leagueStats?.recentWins}
            </Text>
            <Text
              style={[styles.statLabel, { color: theme.colors.textSecondary }]}
            >
              Recent Wins
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: theme.colors.primary }]}>
              {leagueStats?.recentWins} of {leagueStats?.recentTotal}
            </Text>
            <Text
              style={[styles.statLabel, { color: theme.colors.textSecondary }]}
            >
              Recent Record
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: theme.colors.primary }]}>
              {leagueStats?.longestStreak}
            </Text>
            <Text
              style={[styles.statLabel, { color: theme.colors.textSecondary }]}
            >
              Longest Streak
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: theme.colors.primary }]}>
              {leagueStats?.totalPredictions}
            </Text>
            <Text
              style={[styles.statLabel, { color: theme.colors.textSecondary }]}
            >
              Total Predictions
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.performanceContainer,
            {
              borderTopColor:
                theme.colors.text === "#FFFFFF"
                  ? "rgba(255, 255, 255, 0.1)"
                  : "rgba(0, 0, 0, 0.1)",
            },
          ]}
        >
          <Text
            style={[
              styles.performanceLabel,
              { color: theme.colors.textSecondary },
            ]}
          >
            Recent:
          </Text>
          <View style={styles.performanceIndicators}>
            {leagueStats?.recentPerformance.map((result, index) => (
              <View
                key={index}
                style={[
                  styles.performanceCircle,
                  {
                    backgroundColor: result === "win" ? "#FF4444" : "#666666",
                  },
                ]}
              />
            ))}
          </View>
          <Text
            style={[
              styles.performanceLabel,
              { color: theme.colors.textSecondary },
            ]}
          >
            Recent
          </Text>
        </View>
      </View>
      <View
        style={[styles.screenBreak, { backgroundColor: theme.colors.border }]}
      />
    </View>
  );

  const renderActiveContent = () => {
    switch (selectedTab) {
      case "paid":
        return (
          <DiscoverExpertPaidPredictions
            leagueStats={leagueStats}
            expertId={expertData?.id || ""}
          />
        );
      case "public":
        return (
          <DiscoverExpertPublicPredictions
            leagueStats={leagueStats}
            expertId={expertData?.id || ""}
          />
        );
      default:
        return (
          <DiscoverExpertPaidPredictions
            leagueStats={leagueStats}
            expertId={expertData?.id || ""}
          />
        );
    }
  };

  const renderTabBar = () => (
    <View style={styles.tabBarWrapper}>
      <View
        style={[styles.tabSeparator, { backgroundColor: theme.colors.border }]}
      />
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            {
              backgroundColor:
                selectedTab === "paid"
                  ? theme.colors.backgroundSecondary
                  : "transparent",
              borderBottomLeftRadius: selectedTab === "paid" ? 0 : 8,
              borderBottomRightRadius: selectedTab === "paid" ? 0 : 8,
            },
          ]}
          onPress={() => setSelectedTab("paid")}
        >
          <Text
            style={[
              styles.tabText,
              {
                color:
                  selectedTab === "paid"
                    ? "#FF4757"
                    : theme.colors.textSecondary,
              },
            ]}
          >
            Paid Predictions
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            {
              backgroundColor:
                selectedTab === "public"
                  ? theme.colors.backgroundSecondary
                  : "transparent",
              borderBottomLeftRadius: selectedTab === "public" ? 0 : 8,
              borderBottomRightRadius: selectedTab === "public" ? 0 : 8,
            },
          ]}
          onPress={() => setSelectedTab("public")}
        >
          <Text
            style={[
              styles.tabText,
              {
                color:
                  selectedTab === "public"
                    ? "#FF4757"
                    : theme.colors.textSecondary,
              },
            ]}
          >
            Public Predictions
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (!expertData || !leagueStats) {
    return (
      <View
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <StatusBar
          barStyle={
            theme.colors.text === "#FFFFFF" ? "light-content" : "dark-content"
          }
        />
        {renderHeader()}
        <View
          style={[
            styles.loadingContainer,
            { backgroundColor: theme.colors.background },
          ]}
        >
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            Loading expert wins...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <StatusBar
        barStyle={
          theme.colors.text === "#FFFFFF" ? "light-content" : "dark-content"
        }
        backgroundColor={theme.colors.background}
        translucent={false}
      />
      {renderHeader()}

      <ScrollView
        style={[
          styles.scrollContainer,
          { backgroundColor: theme.colors.background },
        ]}
        contentContainerStyle={{ backgroundColor: theme.colors.background }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.text}
            colors={[theme.colors.text]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderExpertInfo()}
        {renderLeagueStats()}
        {renderTabBar()}

        {selectedTab && (
          <View
            style={[
              styles.activeTabContentContainer,
              {
                backgroundColor: theme.colors.backgroundSecondary,
              },
            ]}
          >
            {renderActiveContent()}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    fontWeight: "500",
  },
  headerContainer: {
    paddingTop: 0,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    height: 56,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
  },
  shareButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
  },
  scrollContainer: {
    flex: 1,
  },
  expertInfoWrapper: {
    paddingBottom: 0,
  },
  expertInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  expertAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  expertDetails: {
    flex: 1,
  },
  expertNameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  expertName: {
    fontSize: 18,
    fontWeight: "700",
    marginRight: 8,
  },
  crownBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(255, 215, 0, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  expertLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  followButtonContainer: {
    alignItems: "flex-end",
  },
  leagueStatsWrapper: {
    paddingBottom: 0,
  },
  leagueStatsContainer: {
    padding: 16,
    margin: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  leagueHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  leagueLogo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  leagueInfo: {
    flex: 1,
  },
  leagueName: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 2,
  },
  leagueSeason: {
    fontSize: 14,
    fontWeight: "500",
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
  },
  performanceContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 12,
    borderTopWidth: 1,
  },
  performanceLabel: {
    fontSize: 12,
    fontWeight: "500",
    marginHorizontal: 8,
  },
  performanceIndicators: {
    flexDirection: "row",
    gap: 6,
  },
  performanceCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  tabBarWrapper: {
    paddingBottom: 0,
  },
  tabSeparator: {
    height: 1,
    marginHorizontal: 0,
  },
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: 0,
    backgroundColor: "transparent",
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    marginHorizontal: 1,
    marginBottom: 0,
  },
  activeTabContentContainer: {
    flex: 1,
    marginTop: -1,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    paddingBottom: 20,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
  },
  screenBreak: {
    height: 8,
    marginHorizontal: 0,
  },
});

export default DiscoverExpertWinsScreen;
