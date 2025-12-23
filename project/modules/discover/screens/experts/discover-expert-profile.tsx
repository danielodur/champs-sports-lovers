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
} from "lucide-react-native";
import DiscoverFollowExpert from "./discover-follow-expert";
import DiscoverExpertPerformanceCharts from "./discover-expert-performance-charts";
import DiscoverExpertAnalysisResults from "./discover-expert-analysis-results";
import DiscoverExpertAvailablePredictions from "./discover-expert-available-predictions";
import DiscoverExpertShare from "./discover-expert-share";

const { width } = Dimensions.get("window");

interface ExpertProfile {
  id: string;
  name: string;
  username: string;
  avatar: string;
  followers: number;
  level: number;
  bio: string;
  specialties: string[];
  stats: {
    recentWins: number;
    recentTotal: number;
    longestStreak: number;
    totalPredictions: number;
  };
  recentPerformance: ("win" | "loss")[];
  isFollowing: boolean;
  isVip: boolean;
  badge?: "crown" | "star" | "diamond";
  wonMatches: WonLeague[];
}

interface WonLeague {
  id: string;
  name: string;
  wins?: number;
  total?: number;
  streak?: number;
  type: "recent" | "streak";
}

interface MatchPrediction {
  id: string;
  match: {
    homeTeam: string;
    awayTeam: string;
    homeTeamLogo: string;
    awayTeamLogo: string;
    league: string;
    date: string;
    time: string;
  };
  prediction: string;
  confidence: number;
  analysis: string;
  result?: "win" | "loss" | "pending";
  likes: number;
  comments: number;
  views: number;
}

export default function DiscoverExpertProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const theme = useTheme();
  const { t } = useTranslation();

  const [expertProfile, setExpertProfile] = useState<ExpertProfile | null>(
    null,
  );
  const [predictions, setPredictions] = useState<MatchPrediction[]>([]);
  const [activeTab, setActiveTab] = useState<"analysis" | "predictions">(
    "analysis",
  );
  const [activeAnalysisTab, setActiveAnalysisTab] = useState<
    "results" | "performance"
  >("results");
  const [performanceTimeRange, setPerformanceTimeRange] = useState<
    "7days" | "15days" | "30days"
  >("7days");

  const [refreshing, setRefreshing] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    loadExpertData();
  }, [params.expertId]);

  const loadExpertData = async () => {
    // Mock expert data - in real app, this would come from API
    const mockExpert: ExpertProfile = {
      id: (params.expertId as string) || "1",
      name: "Football Master",
      username: "@footballscript",
      avatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face",
      followers: 23,
      level: 13,
      bio: "11 years of football analysis experience. Professional analyst who brings you winning predictions consistently.",
      specialties: ["European Leagues • Recent 5 Mid 4"],
      stats: {
        recentWins: 2,
        recentTotal: 13,
        longestStreak: 10,
        totalPredictions: 101,
      },
      recentPerformance: [
        "win",
        "loss",
        "win",
        "win",
        "win",
        "loss",
        "win",
        "win",
      ],
      isFollowing: false,
      isVip: true,
      badge: "crown",
      wonMatches: [
        {
          id: "1",
          name: "UEFA Champions League",
          wins: 8,
          total: 10,
          type: "recent",
        },
        {
          id: "2",
          name: "Premier League",
          wins: 12,
          total: 15,
          type: "recent",
        },
        {
          id: "3",
          name: "Serie A",
          streak: 6,
          type: "streak",
        },
        {
          id: "4",
          name: "La Liga",
          wins: 9,
          total: 11,
          type: "recent",
        },
        {
          id: "5",
          name: "Bundesliga",
          streak: 4,
          type: "streak",
        },
      ],
    };

    const mockPredictions: MatchPrediction[] = [
      {
        id: "1",
        match: {
          homeTeam: "Chelsea",
          awayTeam: "Manchester United",
          homeTeamLogo:
            "https://logos-world.net/wp-content/uploads/2020/06/Chelsea-Logo.png",
          awayTeamLogo:
            "https://logos-world.net/wp-content/uploads/2020/06/Manchester-United-Logo.png",
          league: "Premier League",
          date: "Today",
          time: "19:03",
        },
        prediction:
          "Chelsea confidence boost, can they regain their winning form against United tonight? Strong analysis suggests home advantage.",
        confidence: 85,
        analysis: "Chelsea showing strong momentum at home",
        result: "pending",
        likes: 58,
        comments: 12,
        views: 1247,
      },
      {
        id: "2",
        match: {
          homeTeam: "Arsenal",
          awayTeam: "Liverpool",
          homeTeamLogo:
            "https://logos-world.net/wp-content/uploads/2020/06/Arsenal-Logo.png",
          awayTeamLogo:
            "https://logos-world.net/wp-content/uploads/2020/06/Liverpool-Logo.png",
          league: "Premier League",
          date: "10/06",
          time: "04:49:32",
        },
        prediction:
          "Arsenal has been on a 12-game winning streak, tonight's match is crucial for title race positioning.",
        confidence: 92,
        analysis: "Arsenal youth team vs Liverpool central defense analysis",
        result: "win",
        likes: 98,
        comments: 24,
        views: 2156,
      },
    ];

    setExpertProfile(mockExpert);
    setPredictions(mockPredictions);
    setIsFollowing(mockExpert.isFollowing);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadExpertData();
    setRefreshing(false);
  };

  const handleFollow = () => {
    setIsFollowing(!isFollowing);
    // This will be handled by the follow component
  };

  const handleFollowChange = (
    newIsFollowing: boolean,
    newFollowerCount: number,
  ) => {
    setIsFollowing(newIsFollowing);
    if (expertProfile) {
      setExpertProfile({
        ...expertProfile,
        followers: newFollowerCount,
        isFollowing: newIsFollowing,
      });
    }
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View
        style={[
          styles.headerGradient,
          { backgroundColor: theme.colors.primary },
        ]}
      />
      <View style={styles.headerOverlay}>
        <View
          style={[
            styles.headerGradientSecondary,
            { backgroundColor: theme.colors.error },
          ]}
        />
      </View>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" />
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Expert Profile</Text>

          <TouchableOpacity
            style={styles.shareButton}
            onPress={() => setShowShareModal(true)}
          >
            <Share2 size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {expertProfile && (
          <View style={styles.profileSection}>
            <View style={styles.profileInfo}>
              <View style={styles.avatarContainer}>
                <Image
                  source={{ uri: expertProfile.avatar }}
                  style={styles.avatar}
                />
              </View>
              {expertProfile.badge && (
                <View style={styles.badgeContainerBottom}>
                  <Text style={styles.badgeText}>13 of 15</Text>
                </View>
              )}

              <View style={styles.profileText}>
                <Text style={styles.expertName}>{expertProfile.name}</Text>
                <Text style={styles.followersCount}>
                  Followers {expertProfile.followers}
                </Text>
              </View>

              <DiscoverFollowExpert
                expertId={expertProfile.id}
                expertName={expertProfile.name}
                initialFollowState={isFollowing}
                followerCount={expertProfile.followers}
                onFollowChange={handleFollowChange}
              />
            </View>

            <Text style={styles.bioText}>{expertProfile.bio}</Text>

            {/* Won Matches Section */}
            <View style={styles.wonMatchesSection}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.wonMatchesScroll}
                decelerationRate="fast"
                snapToInterval={180}
                snapToAlignment="start"
                scrollEventThrottle={16}
                bounces={false}
              >
                <View style={styles.wonMatchesHeaderContainer}>
                  <Text style={styles.wonMatchesHeader}>Won Matches:</Text>
                </View>
                {expertProfile.wonMatches.map((league) => (
                  <TouchableOpacity
                    key={league.id}
                    style={styles.leagueTab}
                    onPress={() => {
                      // Navigate to wins screen
                      router.push({
                        pathname: "/discover/discover-expert-wins",
                        params: {
                          expertId: expertProfile.id,
                          expertName: expertProfile.name,
                          leagueId: league.id,
                          leagueName: league.name,
                        },
                      });
                    }}
                  >
                    <View style={styles.leagueTabContent}>
                      <Text style={styles.leagueName} numberOfLines={1}>
                        {league.name}
                      </Text>
                      <Text style={styles.leagueRecord}>
                        {league.type === "streak"
                          ? `${league.streak} Win Streak`
                          : `${league.wins} of ${league.total}`}
                      </Text>
                    </View>
                    <View style={styles.leagueNavButton}>
                      <ChevronRight
                        size={16}
                        color="rgba(255, 255, 255, 0.9)"
                      />
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        )}
      </SafeAreaView>
    </View>
  );

  const renderTabs = () => (
    <View
      style={[
        styles.tabContainer,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <View style={styles.tabs}>
        {[
          { key: "analysis", label: "Analysis", icon: BarChart3 },
          { key: "predictions", label: "Predictions", icon: Target },
        ].map((tab, index) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, index === 0 ? styles.tabLeft : styles.tabRight]}
            onPress={() => setActiveTab(tab.key as any)}
          >
            <tab.icon
              size={20}
              color={
                activeTab === tab.key
                  ? theme.colors.primary
                  : theme.colors.textSecondary
              }
            />
            <Text
              style={[
                styles.tabText,
                {
                  color:
                    activeTab === tab.key
                      ? theme.colors.primary
                      : theme.colors.textSecondary,
                },
              ]}
            >
              {tab.label}
            </Text>
            {activeTab === tab.key && (
              <View
                style={[
                  styles.activeTabIndicator,
                  { backgroundColor: theme.colors.primary },
                ]}
              />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === "analysis" && (
        <View style={styles.analysisSubTabs}>
          {[
            { key: "results", label: "Results" },
            { key: "performance", label: "Performance" },
          ].map((subTab) => (
            <TouchableOpacity
              key={subTab.key}
              style={[
                styles.analysisSubTab,
                activeAnalysisTab === subTab.key && styles.analysisSubTabActive,
                {
                  backgroundColor:
                    activeAnalysisTab === subTab.key
                      ? "rgba(255, 107, 107, 0.15)"
                      : theme.colors.backgroundSecondary,
                  borderColor:
                    activeAnalysisTab === subTab.key
                      ? "#FF6B6B"
                      : "transparent",
                },
              ]}
              onPress={() => setActiveAnalysisTab(subTab.key as any)}
            >
              <Text
                style={[
                  styles.analysisSubTabText,
                  {
                    color:
                      activeAnalysisTab === subTab.key
                        ? "#FF6B6B"
                        : theme.colors.text,
                  },
                ]}
              >
                {subTab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  const renderStatsSection = () => {
    if (!expertProfile) return null;

    return (
      <DiscoverExpertAnalysisResults
        expertId={expertProfile.id}
        onStatsUpdate={(stats) => {
          // Update parent component stats if needed
          setExpertProfile((prev) =>
            prev
              ? {
                  ...prev,
                  stats: stats,
                }
              : null,
          );
        }}
      />
    );
  };

  const renderPredictionCard = (prediction: MatchPrediction) => (
    <View
      key={prediction.id}
      style={[
        styles.predictionCard,
        { backgroundColor: theme.colors.backgroundSecondary },
      ]}
    >
      <View style={styles.predictionHeader}>
        <View style={styles.matchInfo}>
          <View style={styles.matchTeams}>
            <Image
              source={{ uri: prediction.match.homeTeamLogo }}
              style={styles.teamLogo}
            />
            <Text style={[styles.teamName, { color: theme.colors.text }]}>
              {prediction.match.homeTeam}
            </Text>
            <Text style={[styles.vs, { color: theme.colors.textSecondary }]}>
              VS
            </Text>
            <Text style={[styles.teamName, { color: theme.colors.text }]}>
              {prediction.match.awayTeam}
            </Text>
            <Image
              source={{ uri: prediction.match.awayTeamLogo }}
              style={styles.teamLogo}
            />
          </View>

          <Text
            style={[styles.matchTime, { color: theme.colors.textSecondary }]}
          >
            {prediction.match.date} {prediction.match.time}
          </Text>
        </View>

        {prediction.result && (
          <View
            style={[
              styles.resultBadge,
              {
                backgroundColor:
                  prediction.result === "win"
                    ? theme.colors.success
                    : theme.colors.error,
              },
            ]}
          >
            <Text style={styles.resultText}>
              {prediction.result === "win"
                ? "Win"
                : prediction.result === "loss"
                  ? "Loss"
                  : "Live"}
            </Text>
          </View>
        )}
      </View>

      <Text style={[styles.predictionText, { color: theme.colors.text }]}>
        {prediction.prediction}
      </Text>

      <View style={styles.predictionFooter}>
        <View style={styles.engagementStats}>
          <View style={styles.stat}>
            <Eye size={14} color={theme.colors.textSecondary} />
            <Text
              style={[styles.statText, { color: theme.colors.textSecondary }]}
            >
              {prediction.views}
            </Text>
          </View>

          <View style={styles.stat}>
            <MessageCircle size={14} color={theme.colors.textSecondary} />
            <Text
              style={[styles.statText, { color: theme.colors.textSecondary }]}
            >
              {prediction.comments}
            </Text>
          </View>

          <View style={styles.stat}>
            <ThumbsUp size={14} color={theme.colors.textSecondary} />
            <Text
              style={[styles.statText, { color: theme.colors.textSecondary }]}
            >
              {prediction.likes}
            </Text>
          </View>
        </View>

        <View style={styles.confidenceContainer}>
          <Text
            style={[
              styles.confidenceText,
              { color: theme.colors.textSecondary },
            ]}
          >
            Confidence: {prediction.confidence}%
          </Text>
        </View>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIllustration}>
        <View style={styles.emptyBox}>
          <Activity size={48} color={theme.colors.textSecondary} />
        </View>
      </View>
      <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
        No data available
      </Text>
    </View>
  );

  const renderAnalysisContent = () => {
    if (activeAnalysisTab === "results") {
      return renderStatsSection();
    } else {
      return (
        <DiscoverExpertPerformanceCharts
          expertId={expertProfile?.id || "1"}
          timeRange={performanceTimeRange}
          onTimeRangeChange={setPerformanceTimeRange}
        />
      );
    }
  };

  const renderContent = () => {
    if (activeTab === "analysis") {
      return (
        <View style={styles.contentContainer}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Available Predictions
            </Text>
          </View>
          <DiscoverExpertAvailablePredictions
            expertId={expertProfile?.id || "1"}
            onRefresh={onRefresh}
            showFilterTabs={false}
          />
        </View>
      );
    }

    if (activeTab === "predictions") {
      return (
        <DiscoverExpertAvailablePredictions
          expertId={expertProfile?.id || "1"}
          onRefresh={onRefresh}
          showFilterTabs={true}
        />
      );
    }

    return renderEmptyState();
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
          />
        }
      >
        {renderHeader()}
        {renderTabs()}
        {activeTab === "analysis" && renderAnalysisContent()}
        {renderContent()}
      </ScrollView>

      <View style={styles.bottomSportsBar}>
        <TouchableOpacity
          style={[
            styles.sportsBarItem,
            { backgroundColor: theme.colors.primary },
          ]}
        >
          <Text style={styles.sportsBarText}>Football</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.sportsBarItem}>
          <Text style={[styles.sportsBarText, { color: theme.colors.text }]}>
            Basketball
          </Text>
        </TouchableOpacity>
      </View>

      {/* Share Modal */}
      {expertProfile && (
        <DiscoverExpertShare
          visible={showShareModal}
          onClose={() => setShowShareModal(false)}
          expertName={expertProfile.name}
          expertId={expertProfile.id}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  headerContainer: {
    position: "relative",
  },
  headerGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    paddingBottom: 20,
    minHeight: 300,
  },
  headerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.3,
  },
  headerGradientSecondary: {
    flex: 1,
    paddingBottom: 20,
    minHeight: 300,
  },
  safeArea: {
    flex: 1,
    position: "relative",
    zIndex: 10,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
    minHeight: 60,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    textAlign: "center",
    flex: 1,
  },
  shareButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  profileSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  profileInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 24,
    paddingRight: 8,
  },
  avatarContainer: {
    position: "relative",
    marginRight: 16,
    alignItems: "center",
    marginBottom: 0,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  badgeContainer: {
    position: "absolute",
    bottom: -2,
    right: -8,
    backgroundColor: "#FF6B35",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  badgeContainerBottom: {
    position: "absolute",
    top: 68,
    left: 5,
    backgroundColor: "#FF6B35",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  profileText: {
    flex: 1,
    paddingTop: 4,
    paddingRight: 12,
    minWidth: 0,
  },
  expertName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 6,
    letterSpacing: 0.3,
    flexShrink: 1,
  },
  followersCount: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "500",
    flexShrink: 1,
  },

  bioText: {
    fontSize: 15,
    color: "rgba(255, 255, 255, 0.95)",
    lineHeight: 22,
    marginBottom: 20,
    fontWeight: "400",
  },

  // Won Matches Section
  wonMatchesSection: {
    marginBottom: 8,
  },
  wonMatchesHeaderContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingRight: 16,
    minWidth: 120,
  },
  wonMatchesHeader: {
    fontSize: 16,
    fontWeight: "700",
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
  },
  wonMatchesScroll: {
    paddingLeft: 0,
    paddingRight: 16,
    gap: 8,
    alignItems: "center",
  },
  leagueTab: {
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 16,
    paddingRight: 44,
    position: "relative",
    width: 220,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.3)",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  leagueTabContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingRight: 8,
  },
  leagueName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 3,
    letterSpacing: 0.3,
  },
  leagueRecord: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.9)",
  },
  leagueNavButton: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    right: 10,
    top: "50%",
    marginTop: -12,
  },
  tabContainer: {},
  tabs: {
    flexDirection: "row",
    paddingHorizontal: 16,
    justifyContent: "space-between",
    position: "relative",
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingBottom: 4,
    gap: 6,
    position: "relative",
  },
  tabLeft: {
    justifyContent: "flex-start",
    paddingLeft: 0,
  },
  tabRight: {
    justifyContent: "flex-end",
    paddingRight: 0,
  },
  activeTabIndicator: {
    position: "absolute",
    bottom: -2,
    height: 3,
    width: 60,
    borderRadius: 1.5,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
  },
  analysisSubTabs: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    gap: 12,
  },
  analysisSubTab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 80,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  analysisSubTabActive: {
    borderWidth: 1.5,
  },
  analysisSubTabText: {
    fontSize: 14,
    fontWeight: "600",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  sectionActions: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
  },
  actionText: {
    fontSize: 12,
    fontWeight: "500",
  },
  statsSection: {
    backgroundColor: "transparent",
  },
  contentContainer: {
    paddingVertical: 16,
    gap: 16,
  },
  predictionCard: {
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  predictionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  matchInfo: {
    flex: 1,
  },
  matchTeams: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  teamLogo: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  teamName: {
    fontSize: 14,
    fontWeight: "600",
  },
  vs: {
    fontSize: 12,
    marginHorizontal: 4,
  },
  matchTime: {
    fontSize: 12,
  },
  resultBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  resultText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "600",
  },
  predictionText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  predictionFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  engagementStats: {
    flexDirection: "row",
    gap: 16,
  },
  stat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    fontSize: 12,
  },
  confidenceContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: "500",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyIllustration: {
    marginBottom: 20,
  },
  emptyBox: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
  },
  bottomSportsBar: {
    flexDirection: "row",
    position: "absolute",
    bottom: 20,
    left: "50%",
    transform: [{ translateX: -80 }],
    borderRadius: 25,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  sportsBarItem: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    minWidth: 80,
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
  },
  sportsBarText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});


















