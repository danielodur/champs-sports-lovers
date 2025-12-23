import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  RefreshControl,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "react-i18next";
import useAuth from "@/hooks/useAuth";
import {
  Star,
  TrendingUp,
  Award,
  Users,
  Eye,
  MessageCircle,
  X,
  Filter,
  Bell,
  Search,
} from "lucide-react-native";
import {
  getOptimizedScrollStyles,
  detailsScrollConfig,
} from "@/utils/scrollPerformance";

interface Expert {
  id: string;
  name: string;
  avatar: string;
  specialization: string;
  winRate: number;
  followers: number;
  predictions: number;
  streak: number;
  badge: string;
  isVerified: boolean;
  recentPredictions: Prediction[];
}

interface Prediction {
  id: string;
  title: string;
  matchInfo: string;
  time: string;
  views: number;
  accuracy: number;
  result: "win" | "lose" | "pending";
  league: string;
}

interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  time: string;
  league: string;
  expertPick?: string;
  confidence: number;
}

interface DiscoverExpertsScreenProps {
  onBackPress?: () => void;
  communityActive?: boolean;
  expertsActive?: boolean;
  onCommunityPress?: () => void;
  onExpertsPress?: () => void;
  hideTopNavigation?: boolean; // Hide header and category tabs for simpler embedded view
}

export default function DiscoverExpertsScreen({
  onBackPress,
  communityActive = false,
  expertsActive = true,
  onCommunityPress,
  onExpertsPress,
  hideTopNavigation = false,
}: DiscoverExpertsScreenProps = {}) {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  const { isLoggedIn, userInfo } = useAuth();
  const [activeCategory, setActiveCategory] = useState("recommend");
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [localCommunityActive, setLocalCommunityActive] =
    useState(communityActive);
  const [localExpertsActive, setLocalExpertsActive] = useState(expertsActive);
  const [savedProfilePicture, setSavedProfilePicture] = useState<string | null>(
    null,
  );

  const categories = [
    { id: "interview", label: "Interview", icon: "📝" },
    { id: "depth", label: "In-Depth Analysis", icon: "🔍" },
    { id: "hot", label: "Hot Picks", icon: "🔥" },
    { id: "matches", label: "Match Predictions", icon: "⚽" },
    { id: "ladder", label: "Ladder Competition", icon: "🏆" },
    { id: "recommend", label: "Quick Picks", icon: "⚡" },
  ];

  const experts = [
    {
      id: "1",
      name: "Mark Johnson",
      avatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
      specialization: "Football Analysis",
      winRate: 93,
      followers: 15600,
      predictions: 245,
      streak: 11,
      badge: "11 Win Streak",
      isVerified: true,
      recentPredictions: [
        {
          id: "p1",
          title:
            "[Prediction] Manchester United vs Liverpool - Can United break their home curse?",
          matchInfo: "Manchester United VS Liverpool",
          time: "Today 20:00",
          views: 4900,
          accuracy: 89,
          result: "pending" as const,
          league: "Premier League",
        },
      ],
    },
    {
      id: "2",
      name: "David Smith",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
      specialization: "Premier League Expert",
      winRate: 92,
      followers: 12400,
      predictions: 198,
      streak: 16,
      badge: "16 Win Streak",
      isVerified: true,
      recentPredictions: [
        {
          id: "p2",
          title: "Champions League Analysis: Bayern Munich tactical advantage",
          matchInfo: "Bayern Munich VS Barcelona",
          time: "10/07 08:00",
          views: 6900,
          accuracy: 92,
          result: "win" as const,
          league: "Champions League",
        },
      ],
    },
    {
      id: "3",
      name: "Michael Brown",
      avatar:
        "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&h=100&fit=crop&crop=face",
      specialization: "Basketball Analytics",
      winRate: 89,
      followers: 9800,
      predictions: 167,
      streak: 9,
      badge: "9 Win Streak",
      isVerified: true,
      recentPredictions: [
        {
          id: "p3",
          title:
            "[Prediction] Lakers vs Warriors - Championship contenders clash",
          matchInfo: "Los Angeles Lakers VS Golden State Warriors",
          time: "Today 22:30",
          views: 7000,
          accuracy: 91,
          result: "pending" as const,
          league: "NBA",
        },
      ],
    },
    {
      id: "4",
      name: "James Wilson",
      avatar:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face",
      specialization: "Multi-Sport Analysis",
      winRate: 91,
      followers: 18200,
      predictions: 312,
      streak: 5,
      badge: "5 Win Streak",
      isVerified: true,
      recentPredictions: [],
    },
  ];

  const upcomingMatches = [
    {
      id: "1",
      homeTeam: "Arsenal",
      awayTeam: "Chelsea",
      time: "10/07 02:30",
      league: "Premier League",
      expertPick: "Expert Professional Pick",
      confidence: 89,
    },
    {
      id: "2",
      homeTeam: "Real Madrid",
      awayTeam: "Barcelona",
      time: "10/07 08:00",
      league: "La Liga",
      expertPick: "Strategy Analysis",
      confidence: 92,
    },
  ];

  const predictionCategories = [
    { id: "all", label: "All", color: "#666" },
    { id: "football", label: "Football", color: "#FF4444" },
    { id: "basketball", label: "Basketball", color: "#4A90E2" },
  ];

  // Generate professional avatar
  const generateProfessionalAvatar = (name: string): string => {
    const colors = [
      "#1f2937",
      "#374151",
      "#4b5563",
      "#6b7280",
      "#9ca3af",
      "#d1d5db",
      "#e5e7eb",
      "#f3f4f6",
      "#ffffff",
      "#fef2f2",
      "#fecaca",
      "#f87171",
      "#ef4444",
      "#dc2626",
      "#b91c1c",
      "#991b1b",
      "#7f1d1d",
      "#fef3c7",
      "#fde68a",
      "#fcd34d",
    ];

    const initials = name
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase())
      .join("")
      .slice(0, 2);

    const backgroundColor = colors[name.length % colors.length];
    const textColor =
      backgroundColor === "#ffffff" || backgroundColor.includes("f")
        ? "#1f2937"
        : "#ffffff";

    return `https://ui-avatars.com/api/?name=${initials}&background=${backgroundColor.slice(1)}&color=${textColor.slice(1)}&size=100&font-size=0.6&bold=true`;
  };

  // Load saved profile picture
  React.useEffect(() => {
    if (
      global.savedProfileData &&
      global.savedProfileData.personalInfo &&
      global.savedProfileData.personalInfo.profilePicture
    ) {
      setSavedProfilePicture(
        global.savedProfileData.personalInfo.profilePicture,
      );
    }
  }, []);

  const handleCommunityPress = () => {
    if (onCommunityPress) {
      onCommunityPress();
    } else {
      setLocalCommunityActive(!localCommunityActive);
      setLocalExpertsActive(false);
      router.push("/(tabs)/discover");
    }
  };

  const handleExpertsPress = () => {
    if (onExpertsPress) {
      onExpertsPress();
    } else {
      setLocalExpertsActive(!localExpertsActive);
      setLocalCommunityActive(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const renderHeader = () => (
    <View style={[styles.header, { backgroundColor: theme.colors.background }]}>
      <View style={styles.headerLeft}>
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/profile")}
          activeOpacity={0.7}
        >
          <Image
            source={{
              uri:
                savedProfilePicture ||
                generateProfessionalAvatar(userInfo?.username || "User"),
            }}
            style={styles.profilePic}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.headerCenter}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleCommunityPress}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.headerButtonText,
              {
                color:
                  communityActive || localCommunityActive
                    ? theme.colors.primary
                    : theme.colors.textSecondary,
              },
            ]}
          >
            Community
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleExpertsPress}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.headerButtonText,
              {
                color:
                  expertsActive || localExpertsActive
                    ? theme.colors.primary
                    : theme.colors.textSecondary,
              },
            ]}
          >
            Experts
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.headerRight}>
        <TouchableOpacity
          style={styles.searchButton}
          onPress={() => router.push("/stats/views/search")}
          activeOpacity={0.7}
        >
          <Search size={24} color={theme.colors.text} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.notificationButton}
          onPress={() => router.push("/notifications")}
          activeOpacity={0.7}
        >
          <Bell size={24} color={theme.colors.text} />
          <View
            style={[
              styles.notificationBadge,
              { backgroundColor: theme.colors.primary },
            ]}
          >
            <Text style={[styles.notificationText, { color: "#FFFFFF" }]}>
              3
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCategoryTabs = () => (
    <View
      style={[
        styles.categoryTabs,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryTabsContent}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryTab,
              activeCategory === category.id && [
                styles.activeCategoryTab,
                { borderColor: theme.colors.primary },
              ],
              {
                backgroundColor:
                  activeCategory === category.id
                    ? "rgba(255, 68, 68, 0.1)"
                    : "transparent",
              },
            ]}
            onPress={() => setActiveCategory(category.id)}
          >
            <Text
              style={[
                styles.categoryTabText,
                {
                  color:
                    activeCategory === category.id
                      ? theme.colors.primary
                      : theme.colors.textSecondary,
                },
              ]}
            >
              {category.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderExpertCard = (expert: Expert) => (
    <TouchableOpacity
      key={expert.id}
      style={[styles.expertCard, { backgroundColor: theme.colors.background }]}
      activeOpacity={0.7}
      onPress={() => {
        router.push({
          pathname: "/discover/expert",
          params: {
            expertId: expert.id,
            expertName: expert.name,
          },
        });
      }}
    >
      <View style={styles.expertHeader}>
        <Image source={{ uri: expert.avatar }} style={styles.expertAvatar} />
        <View style={styles.expertInfo}>
          <View style={styles.expertNameRow}>
            <Text style={[styles.expertName, { color: theme.colors.text }]}>
              {expert.name}
            </Text>
            {expert.isVerified && <Text style={styles.verifiedBadge}>👑</Text>}
          </View>
          <View style={styles.expertStats}>
            <View style={styles.winRateContainer}>
              <Text style={[styles.winRate, { color: theme.colors.primary }]}>
                {expert.winRate}%
              </Text>
              <Text
                style={[
                  styles.statLabel,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {Math.floor((expert.predictions * expert.winRate) / 100)} of{" "}
                {expert.predictions}
              </Text>
            </View>
            {expert.badge && (
              <View
                style={[
                  styles.streakBadge,
                  { backgroundColor: theme.colors.primary },
                ]}
              >
                <Text style={styles.streakText}>{expert.badge}</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {expert.recentPredictions.length > 0 && (
        <View style={styles.predictionContainer}>
          {expert.recentPredictions.map((prediction) => (
            <TouchableOpacity
              key={prediction.id}
              style={styles.predictionItem}
              activeOpacity={0.7}
              onPress={() => {
                router.push({
                  pathname: "/discover/expert",
                  params: {
                    expertId: expert.id,
                    expertName: expert.name,
                  },
                });
              }}
            >
              <Text
                style={[styles.predictionTitle, { color: theme.colors.text }]}
              >
                {prediction.title}
              </Text>
              <View style={styles.matchInfo}>
                <Text
                  style={[
                    styles.matchTeams,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {prediction.time}
                </Text>
                <Text
                  style={[styles.leagueBadge, { color: theme.colors.primary }]}
                >
                  [{prediction.league}]
                </Text>
                <Text
                  style={[
                    styles.matchTeams,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {prediction.matchInfo}
                </Text>
              </View>
              <View style={styles.predictionMeta}>
                <Text
                  style={[
                    styles.viewCount,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {prediction.views} views
                </Text>
                <View style={styles.accuracyContainer}>
                  <Text
                    style={[styles.accuracy, { color: theme.colors.primary }]}
                  >
                    Accuracy {prediction.accuracy}%
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );

  const renderPromotionalBanner = () => (
    <View style={[styles.promoBanner, { backgroundColor: "#4A90E2" }]}>
      <View style={styles.promoContent}>
        <Text style={styles.promoTitle}>Join Our Expert Program ✨</Text>
        <TouchableOpacity style={styles.joinButton}>
          <Text style={styles.joinButtonText}>Apply Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderToolsGrid = () => (
    <View
      style={[styles.toolsGrid, { backgroundColor: theme.colors.background }]}
    >
      {[
        { id: "rankings", label: "Rankings", icon: "📊", color: "#FF9500" },
        {
          id: "calculator",
          label: "Calculator",
          icon: "🔢",
          color: "#4A90E2",
        },
        { id: "pk", label: "Ladder PK", icon: "🏆", color: "#FF4444" },
        { id: "data", label: "Data Models", icon: "⭐", color: "#FFD700" },
        {
          id: "recommend",
          label: "Quick Pick",
          icon: "⚡",
          color: "#9B59B6",
        },
      ].map((tool) => (
        <TouchableOpacity
          key={tool.id}
          style={[
            styles.toolItem,
            {
              backgroundColor: theme.colors.background,
              shadowColor:
                theme.colors.background === "#FFFFFF" ? "#000000" : "#FFFFFF",
            },
          ]}
          activeOpacity={0.7}
        >
          <View style={[styles.toolIcon, { backgroundColor: tool.color }]}>
            <Text style={styles.toolIconText}>{tool.icon}</Text>
          </View>
          <Text style={[styles.toolLabel, { color: theme.colors.text }]}>
            {tool.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderMatchCard = (match: Match) => (
    <View
      key={match.id}
      style={[styles.matchCard, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.matchHeader}>
        <Text style={[styles.matchTime, { color: theme.colors.textSecondary }]}>
          {match.time}
        </Text>
        <Text style={[styles.matchLeague, { color: theme.colors.primary }]}>
          [{match.league}]
        </Text>
      </View>
      <Text style={[styles.matchTeams, { color: theme.colors.text }]}>
        {match.homeTeam} VS {match.awayTeam}
      </Text>
      {match.expertPick && (
        <View style={styles.expertPickContainer}>
          <Image
            source={{
              uri: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face",
            }}
            style={styles.expertPickAvatar}
          />
          <Text style={[styles.expertPickText, { color: theme.colors.text }]}>
            {match.expertPick}
          </Text>
          <View
            style={[
              styles.confidenceBadge,
              { backgroundColor: theme.colors.primary },
            ]}
          >
            <Text style={styles.confidenceText}>
              {match.confidence}% Confidence
            </Text>
          </View>
        </View>
      )}
      <Text style={[styles.matchAction, { color: theme.colors.textSecondary }]}>
        View Analysis
      </Text>
    </View>
  );

  const renderPredictionTabs = () => (
    <View style={styles.predictionTabsContainer}>
      <View style={styles.predictionTabs}>
        {predictionCategories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.predictionTab,
              activeCategory === category.id && [
                styles.activePredictionTab,
                { borderColor: category.color },
              ],
            ]}
          >
            <Text
              style={[
                styles.predictionTabText,
                {
                  color:
                    activeCategory === category.id
                      ? category.color
                      : theme.colors.textSecondary,
                },
              ]}
            >
              {category.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.predictionActions}>
        <TouchableOpacity style={styles.actionButton}>
          <Text
            style={[
              styles.actionButtonText,
              { color: theme.colors.textSecondary },
            ]}
          >
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text
            style={[
              styles.actionButtonText,
              { color: theme.colors.textSecondary },
            ]}
          >
            Featured
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text
            style={[
              styles.actionButtonText,
              { color: theme.colors.textSecondary },
            ]}
          >
            Predictions
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <>
      <StatusBar
        barStyle={
          theme.colors.background === "#FFFFFF"
            ? "dark-content"
            : "light-content"
        }
        backgroundColor={theme.colors.background}
        translucent
      />
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        edges={hideTopNavigation ? [] : ["top"]}
      >
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={hideTopNavigation && { paddingTop: 0 }}
          {...getOptimizedScrollStyles()}
          removeClippedSubviews={detailsScrollConfig.removeClippedSubviews}
          scrollEventThrottle={detailsScrollConfig.scrollEventThrottle}
          bounces={detailsScrollConfig.bounces}
          decelerationRate={detailsScrollConfig.decelerationRate}
          keyboardShouldPersistTaps={
            detailsScrollConfig.keyboardShouldPersistTaps
          }
          keyboardDismissMode={detailsScrollConfig.keyboardDismissMode}
        >
          {/* Header with navigation */}
          {!hideTopNavigation && (
            <View
              style={[
                styles.headerBackground,
                { backgroundColor: theme.colors.background },
              ]}
            >
              {renderHeader()}
            </View>
          )}

          {/* Expert Cards Section */}
          <View style={[
            styles.expertsSection,
            hideTopNavigation && { paddingTop: 0, marginTop: 0 }
          ]}>
            {experts.map(renderExpertCard)}
          </View>

          {/* Promotional Banner */}
          {renderPromotionalBanner()}

          {/* Tools Grid */}
          {renderToolsGrid()}

          {/* Match Cards Section */}
          <View style={styles.matchesSection}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Upcoming Matches
              </Text>
              <TouchableOpacity>
                <Text
                  style={[
                    styles.moreText,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  More
                </Text>
              </TouchableOpacity>
            </View>
            {upcomingMatches.map(renderMatchCard)}
          </View>

          {/* Prediction Tabs */}
          {renderPredictionTabs()}

          {/* Bottom Expert Carousel */}
          <View style={styles.bottomExpertSection}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {experts.slice(0, 4).map((expert) => (
                <TouchableOpacity
                  key={expert.id}
                  style={[
                    styles.bottomExpertCard,
                    { backgroundColor: theme.colors.background },
                  ]}
                >
                  <Image
                    source={{ uri: expert.avatar }}
                    style={styles.bottomExpertAvatar}
                  />
                  <Text
                    style={[
                      styles.bottomExpertName,
                      { color: theme.colors.text },
                    ]}
                  >
                    {expert.name}
                  </Text>
                  <View
                    style={[
                      styles.bottomExpertBadge,
                      { backgroundColor: theme.colors.primary },
                    ]}
                  >
                    <Text style={styles.bottomExpertBadgeText}>
                      {expert.streak} streak
                    </Text>
                  </View>
                  <View style={styles.bottomExpertAccuracy}>
                    <Text
                      style={[
                        styles.bottomExpertAccuracyText,
                        { color: theme.colors.primary },
                      ]}
                    >
                      {expert.winRate}%
                    </Text>
                    <Text
                      style={[
                        styles.bottomExpertAccuracyLabel,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      {Math.floor((expert.predictions * expert.winRate) / 100)}{" "}
                      of {expert.predictions}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  headerBackground: {
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerCenter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 4,
  },
  headerButtonText: {
    fontSize: 18,
    fontFamily: "Inter-SemiBold",
  },
  profilePic: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  searchButton: {
    padding: 4,
    marginRight: 12,
  },
  notificationButton: {
    position: "relative",
    padding: 4,
  },
  notificationBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
  },
  notificationText: {
    fontSize: 12,
    fontFamily: "Inter-Bold",
  },
  categoryTabs: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  categoryTabsContent: {
    paddingHorizontal: 16,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "transparent",
  },
  activeCategoryTab: {
    borderWidth: 1,
  },
  categoryTabText: {
    fontSize: 14,
    fontFamily: "Inter-Medium",
  },
  expertsSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  expertCard: {
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  expertHeader: {
    flexDirection: "row",
    marginBottom: 12,
  },
  expertAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  expertInfo: {
    flex: 1,
  },
  expertNameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  expertName: {
    fontSize: 16,
    fontFamily: "Inter-SemiBold",
    marginRight: 8,
  },
  verifiedBadge: {
    fontSize: 16,
  },
  expertStats: {
    flexDirection: "row",
    alignItems: "center",
  },
  winRateContainer: {
    marginRight: 12,
  },
  winRate: {
    fontSize: 20,
    fontFamily: "Inter-Bold",
  },
  statLabel: {
    fontSize: 12,
    fontFamily: "Inter-Regular",
  },
  streakBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  streakText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontFamily: "Inter-Bold",
  },
  predictionContainer: {
    marginTop: 12,
  },
  predictionItem: {
    marginBottom: 12,
  },
  predictionTitle: {
    fontSize: 15,
    fontFamily: "Inter-SemiBold",
    lineHeight: 20,
    marginBottom: 8,
  },
  matchInfo: {
    marginBottom: 8,
  },
  matchTeams: {
    fontSize: 13,
    fontFamily: "Inter-Regular",
    marginBottom: 4,
  },
  leagueBadge: {
    fontSize: 13,
    fontFamily: "Inter-Medium",
    marginBottom: 4,
  },
  predictionMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  viewCount: {
    fontSize: 12,
    fontFamily: "Inter-Regular",
  },
  accuracyContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  accuracy: {
    fontSize: 12,
    fontFamily: "Inter-Bold",
  },
  promoBanner: {
    marginHorizontal: 16,
    marginVertical: 16,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  promoContent: {
    flex: 1,
  },
  promoTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Inter-Bold",
  },
  joinButton: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 8,
    alignSelf: "flex-start",
  },
  joinButtonText: {
    color: "#4A90E2",
    fontSize: 14,
    fontFamily: "Inter-Bold",
  },
  toolsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 8,
    paddingVertical: 16,
    gap: 8,
    justifyContent: "space-between",
  },
  toolItem: {
    width: "18%",
    aspectRatio: 1,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  toolIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  toolIconText: {
    fontSize: 16,
  },
  toolLabel: {
    fontSize: 10,
    fontFamily: "Inter-Medium",
    textAlign: "center",
  },
  matchesSection: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Inter-Bold",
  },
  moreText: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
  },
  matchCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  matchHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  matchTime: {
    fontSize: 13,
    fontFamily: "Inter-Regular",
    marginRight: 8,
  },
  matchLeague: {
    fontSize: 13,
    fontFamily: "Inter-Medium",
  },
  expertPickContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 8,
  },
  expertPickAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  expertPickText: {
    fontSize: 13,
    fontFamily: "Inter-Regular",
    flex: 1,
  },
  confidenceBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  confidenceText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontFamily: "Inter-Bold",
  },
  matchAction: {
    fontSize: 12,
    fontFamily: "Inter-Regular",
  },
  predictionTabsContainer: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  predictionTabs: {
    flexDirection: "row",
    marginBottom: 16,
  },
  predictionTab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginRight: 16,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activePredictionTab: {
    borderBottomWidth: 2,
  },
  predictionTabText: {
    fontSize: 16,
    fontFamily: "Inter-SemiBold",
  },
  predictionActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  actionButtonText: {
    fontSize: 14,
    fontFamily: "Inter-Medium",
  },
  bottomExpertSection: {
    paddingVertical: 20,
    paddingLeft: 16,
  },
  bottomExpertCard: {
    width: 120,
    padding: 12,
    marginRight: 12,
    borderRadius: 12,
    alignItems: "center",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  bottomExpertAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 8,
  },
  bottomExpertName: {
    fontSize: 12,
    fontFamily: "Inter-SemiBold",
    marginBottom: 4,
    textAlign: "center",
  },
  bottomExpertBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: 8,
  },
  bottomExpertBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontFamily: "Inter-Bold",
  },
  bottomExpertAccuracy: {
    alignItems: "center",
  },
  bottomExpertAccuracyText: {
    fontSize: 16,
    fontFamily: "Inter-Bold",
  },
  bottomExpertAccuracyLabel: {
    fontSize: 10,
    fontFamily: "Inter-Regular",
  },
});
