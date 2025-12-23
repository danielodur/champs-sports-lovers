import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "react-i18next";
import {
  Users,
  ChevronRight,
  ArrowRight,
  Play,
  BarChart3,
  Calculator,
  Activity,
  Star,
  Eye,
  Thermometer,
  TrendingUp,
} from "lucide-react-native";
// Removed react-native-svg import since it's no longer installed
import DiscoverHotCommunityPosts from "./discover-hot-community-posts";

// Simple Results Icon Component - Replace SVG with View
const ResultsIcon = ({ size = 24, color = "#FFFFFF", ...props }) => (
  <View
    style={{
      width: size,
      height: size,
      backgroundColor: color,
      borderRadius: 4,
      justifyContent: "center",
      alignItems: "center",
    }}
  >
    <Text style={{ color: "#FF6B35", fontSize: 8, fontWeight: "bold" }}>
      FT
    </Text>
  </View>
);

// Simple Odds Icon Component - Replace SVG with View
const OddsIcon = ({ size = 24, color = "#FFFFFF", ...props }) => (
  <View
    style={{
      width: size,
      height: size,
      backgroundColor: color,
      borderRadius: 4,
      justifyContent: "center",
      alignItems: "center",
    }}
  >
    <Text style={{ color: "#FF6B35", fontSize: 8, fontWeight: "bold" }}>%</Text>
  </View>
);

interface ExpertUser {
  id: string;
  name: string;
  avatar: string;
  level: number;
  specialty: string;
  followers: string;
  winRate: string;
  status: "online" | "offline";
  badge?: string;
}

export default function DiscoverHotCommunityScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  const [activeUsers, setActiveUsers] = useState(36);
  const [experts, setExperts] = useState<ExpertUser[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const pulseAnim = new Animated.Value(1);
  const arrowAnim = new Animated.Value(0);

  useEffect(() => {
    // Mock data for experts
    const mockExperts: ExpertUser[] = [
      {
        id: "1",
        name: "Football Master",
        avatar:
          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
        level: 58,
        specialty: "Football Analysis",
        followers: "15.4K",
        winRate: "78%",
        status: "online",
        badge: "crown",
      },
      {
        id: "2",
        name: "Betting Pro",
        avatar:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
        level: 74,
        specialty: "Market Analysis",
        followers: "12.8K",
        winRate: "82%",
        status: "online",
        badge: "star",
      },
      {
        id: "3",
        name: "Stats Expert",
        avatar:
          "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face",
        level: 96,
        specialty: "Data Analytics",
        followers: "23.1K",
        winRate: "91%",
        status: "online",
        badge: "diamond",
      },
      {
        id: "4",
        name: "Match Predictor",
        avatar:
          "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=100&h=100&fit=crop&crop=face",
        level: 65,
        specialty: "Predictions",
        followers: "9.2K",
        winRate: "75%",
        status: "offline",
      },
    ];

    // Mock data for posts
    const mockPosts: any[] = [
      {
        id: "1",
        author: {
          name: "Football Analyst Pro",
          avatar:
            "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face",
          level: 31,
          verified: true,
        },
        content:
          "Liverpool's winning streak continues! Tonight they face Manchester City in what promises to be the match of the season.",
        timeAgo: "15 minutes ago",
        category: "Football",
        engagement: {
          views: 1247,
          comments: 32,
          likes: 158,
        },
        matchInfo: {
          team1: "Liverpool",
          team2: "Manchester City",
          odds: "-1.5",
        },
      },
      {
        id: "2",
        author: {
          name: "Statistical King",
          avatar:
            "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop&crop=face",
          level: 58,
          verified: true,
        },
        content:
          "Breaking: Real Madrid showing incredible form with 12 consecutive wins! Tonight's match prediction analysis inside.",
        timeAgo: "16 minutes ago",
        category: "Football",
        engagement: {
          views: 892,
          comments: 20,
          likes: 94,
        },
        image:
          "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=300&h=200&fit=crop",
      },
      {
        id: "3",
        author: {
          name: "Basketball Guru",
          avatar:
            "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=50&h=50&fit=crop&crop=face",
          level: 74,
          verified: true,
        },
        content:
          "Lakers vs Warriors tonight! Analysis shows 85% probability for over 220 points. Key stats and predictions available.",
        timeAgo: "24 minutes ago",
        category: "Basketball",
        engagement: {
          views: 654,
          comments: 17,
          likes: 73,
        },
      },
    ];

    setExperts(mockExperts);
    setPosts(mockPosts);

    // Simulate active users counter
    const interval = setInterval(() => {
      setActiveUsers((prev) => prev + Math.floor(Math.random() * 3) - 1);
    }, 5000);

    // Pulse animation for LIVE indicator
    const pulse = () => {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start();
    };

    const pulseInterval = setInterval(pulse, 2000);

    // Arrow animation for LIVE indicator
    const animateArrow = () => {
      Animated.sequence([
        Animated.timing(arrowAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(arrowAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start();
    };

    const arrowInterval = setInterval(animateArrow, 1600);

    return () => {
      clearInterval(interval);
      clearInterval(pulseInterval);
      clearInterval(arrowInterval);
    };
  }, []);

  const tools = [
    { id: "replays", icon: Play, label: "Replays", color: "#FF6B35" },
    { id: "charts", icon: BarChart3, label: "My Lineup", color: "#FF6B35" },
    {
      id: "calculator",
      icon: Calculator,
      label: "Calculator",
      color: "#FF6B35",
    },
    { id: "upset", icon: OddsIcon, label: "Upset", color: "#FF6B35" },
    { id: "results", icon: ResultsIcon, label: "Results", color: "#FF6B35" },
    {
      id: "stats",
      icon: Activity,
      label: "Live Stats",
      color: "#FF6B35",
    },
    {
      id: "predictions",
      icon: Star,
      label: "Predictions",
      color: "#FF6B35",
    },
    {
      id: "transfers",
      icon: Eye,
      label: "Transfers",
      color: "#FF6B35",
    },
    {
      id: "player-values",
      icon: Thermometer,
      label: "Values",
      color: "#FF6B35",
    },
    {
      id: "performance",
      icon: TrendingUp,
      label: "Performance",
      color: "#FF6B35",
    },
  ];

  const renderInteractiveSection = () => (
    <View style={styles.interactiveSection}>
      <TouchableOpacity
        style={[
          styles.liveCard,
          { backgroundColor: theme.colors.primary + "20" },
        ]}
        onPress={() => {
          // Navigate to interactive hub details
          router.push("/interactive-hub");
        }}
        activeOpacity={0.8}
      >
        <View style={styles.liveHeader}>
          <View style={styles.liveHeaderLeft}>
            <View style={styles.liveIcon}>
              <Users size={16} color={theme.colors.text} />
            </View>
            <Text style={[styles.liveTitle, { color: theme.colors.text }]}>
              Interactive Hub
            </Text>
          </View>
          <View style={styles.liveIndicatorContainer}>
            <Animated.View
              style={[
                styles.liveArrow,
                {
                  opacity: arrowAnim,
                  transform: [
                    {
                      translateX: arrowAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 8],
                      }),
                    },
                  ],
                },
              ]}
            >
              <ArrowRight size={14} color={theme.colors.text} />
            </Animated.View>
            <Animated.View
              style={[
                styles.liveIndicator,
                {
                  backgroundColor: theme.colors.primary,
                  transform: [{ scale: pulseAnim }],
                },
              ]}
            >
              <Text style={styles.liveText}>LIVE</Text>
            </Animated.View>
          </View>
        </View>
        <View style={styles.liveContent}>
          <Text style={[styles.activeCount, { color: theme.colors.text }]}>
            {activeUsers} users currently active
          </Text>
          <View style={styles.userAvatars}>
            {experts.slice(0, 5).map((expert, index) => (
              <View
                key={expert.id}
                style={[styles.avatarContainer, { marginLeft: index * -8 }]}
              >
                <Image
                  source={{ uri: expert.avatar }}
                  style={styles.smallAvatar}
                />
                {expert.status === "online" && (
                  <View style={styles.onlineIndicator} />
                )}
              </View>
            ))}
            <TouchableOpacity style={styles.moreButton}>
              <Eye size={16} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );

  const renderSectionSeparator = () => (
    <View style={styles.sectionSeparatorContainer}>
      <View
        style={[
          styles.sectionSeparator,
          {
            backgroundColor: theme.colors.border,
            shadowColor: theme.colors.text,
          },
        ]}
      />
    </View>
  );

  const renderToolsGrid = () => (
    <View style={styles.toolsSection}>
      <View style={styles.toolsGrid}>
        {tools.map((tool, index) => (
          <TouchableOpacity
            key={`${tool.id}-${index}-new`}
            style={styles.toolItem}
            onPress={() => {
              // Navigate to specific tool
              if (tool.id === "replays") {
                router.push("/news/news-team-replays");
              } else if (tool.id === "charts") {
                router.push("/discover-my-football-lineup");
              } else if (tool.id === "upset") {
                router.push("/discover-hot-community-upset");
              } else if (tool.id === "results") {
                router.push({
                  pathname: "/(tabs)",
                  params: { sport: "football", filter: "finished" },
                });
              } else if (tool.id === "transfers") {
                router.push("/discover-hot-transfers");
              } else if (tool.id === "player-values") {
                router.push("/discover-hot-player-values");
              } else {
                router.push(`/${tool.id}`);
              }
            }}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.toolIconContainer,
                { backgroundColor: tool.color },
              ]}
            >
              <tool.icon size={24} color="#FFFFFF" />
            </View>
            <Text
              style={[styles.toolLabel, { color: theme.colors.text }]}
              numberOfLines={1}
            >
              {tool.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderExpertSection = () => (
    <View style={styles.expertSection}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Recommended Experts
        </Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.expertScroll}
        decelerationRate="normal"
        bounces={true}
        scrollEventThrottle={16}
        removeClippedSubviews={false}
        pagingEnabled={false}
        directionalLockEnabled={true}
        alwaysBounceHorizontal={true}
        showsVerticalScrollIndicator={false}
      >
        {experts.map((expert) => (
          <TouchableOpacity
            key={expert.id}
            style={styles.expertCard}
            onPress={() => {
              // Navigate to expert screen
              router.push(`/discover/expert?expertId=${expert.id}`);
            }}
            activeOpacity={0.8}
          >
            <View style={styles.expertHeader}>
              <Image
                source={{ uri: expert.avatar }}
                style={styles.expertAvatar}
              />
              <View style={styles.expertBadge}>
                <Text style={styles.badgeText}>Lv {expert.level}</Text>
              </View>
              {expert.status === "online" && (
                <View style={styles.onlineIndicator} />
              )}
            </View>
            <Text
              style={[styles.expertName, { color: theme.colors.text }]}
              numberOfLines={1}
            >
              {expert.name}
            </Text>
            <Text
              style={[
                styles.expertStats,
                { color: theme.colors.textSecondary },
              ]}
              numberOfLines={1}
            >
              {expert.followers} followers
            </Text>
            <View
              style={[
                styles.expertFooter,
                { backgroundColor: theme.colors.primary },
              ]}
            >
              <Text style={styles.winRate}>{expert.winRate}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
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
      <View
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <ScrollView
          style={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          bounces={true}
          contentContainerStyle={styles.scrollContent}
        >
          {renderInteractiveSection()}
          {renderSectionSeparator()}
          {renderToolsGrid()}
          {renderSectionSeparator()}
          {renderExpertSection()}
          {renderSectionSeparator()}
          <DiscoverHotCommunityPosts posts={posts} />
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
    marginTop: 0,
  },

  // Interactive Section
  interactiveSection: {
    paddingHorizontal: 16,
    paddingTop: 8,
    marginTop: 0,
  },
  liveCard: {
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionSeparatorContainer: {
    width: "100%",
    paddingVertical: 16,
  },
  sectionSeparator: {
    height: 3,
    width: "100%",
    borderRadius: 1.5,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  liveHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  liveHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  liveIcon: {
    marginRight: 8,
  },
  liveTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  liveIndicatorContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  liveArrow: {
    marginRight: 6,
  },
  liveIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  liveText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "bold",
  },
  liveContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  activeCount: {
    fontSize: 14,
    fontWeight: "500",
  },
  userAvatars: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    position: "relative",
  },
  smallAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4CAF50",
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  moreButton: {
    marginLeft: 8,
    padding: 4,
  },

  // Tools Grid
  toolsSection: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  toolsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  toolItem: {
    width: "18%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    marginBottom: 16,
  },
  toolIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
    position: "relative",
    overflow: "hidden",
  },

  toolLabel: {
    fontSize: 10,
    fontWeight: "500",
    textAlign: "center",
  },

  // Expert Section
  expertSection: {
    paddingTop: 20,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },

  expertScroll: {
    paddingHorizontal: 16,
    paddingRight: 32,
    flexGrow: 0,
  },
  expertCard: {
    width: 120,
    padding: 12,
    borderRadius: 12,
    marginRight: 16,
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  expertHeader: {
    position: "relative",
    marginBottom: 8,
  },
  expertAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  expertBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    backgroundColor: "#FFD700",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#000",
  },
  expertName: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 2,
  },
  expertStats: {
    fontSize: 10,
    textAlign: "center",
    marginBottom: 8,
  },
  expertFooter: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  winRate: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "500",
  },
});
