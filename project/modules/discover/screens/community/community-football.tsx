import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Animated,
} from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "@/hooks/useTheme";
import {
  Users,
  ArrowRight,
  Eye,
  MessageCircle,
  Heart,
  Share2,
  TrendingUp,
} from "lucide-react-native";

interface Post {
  id: string;
  author: {
    name: string;
    avatar: string;
    level: number;
    verified: boolean;
    badges?: string[];
  };
  content: string;
  timeAgo: string;
  engagement: {
    views?: number;
    comments: number;
    likes: number;
    shares?: number;
  };
  matchInfo?: {
    team1: string;
    team2: string;
    logo1?: string;
    logo2?: string;
    score?: string;
    league?: string;
    status?: string;
  };
  images?: string[];
  isLive?: boolean;
}

export default function CommunityFootballScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [activeUsers, setActiveUsers] = useState(103);
  const [activeFilter, setActiveFilter] = useState("latest-post");
  const pulseAnim = new Animated.Value(1);
  const arrowAnim = new Animated.Value(0);

  const filterButtons = [
    { id: "latest-reply", label: "Latest Reply" },
    { id: "latest-post", label: "Latest Post" },
    { id: "featured", label: "Featured" },
    { id: "interactive", label: "Interactive" },
    { id: "rules", label: "Rules", isSpecial: true },
  ];

  const footballPosts: Post[] = [
    {
      id: "1",
      author: {
        name: "Football Tactician",
        avatar: "https://i.pravatar.cc/150?img=12",
        level: 67,
        verified: true,
        badges: ["crown", "fire"],
      },
      content:
        "Manchester United's tactical masterclass! Dominating possession with 65% and creating 12 clear chances. Their pressing game is unstoppable tonight!",
      timeAgo: "2 minutes ago",
      engagement: {
        comments: 24,
        likes: 156,
        shares: 12,
      },
      matchInfo: {
        team1: "Manchester United",
        team2: "Chelsea",
        score: "3-1",
        league: "Premier League",
        status: "Live 78'",
      },
      isLive: true,
    },
    {
      id: "2",
      author: {
        name: "Goal Predictor Pro",
        avatar: "https://i.pravatar.cc/150?img=33",
        level: 89,
        verified: true,
        badges: ["star", "trophy"],
      },
      content:
        "🔥 Bayern Munich unstoppable streak continues! 15 wins in a row with clinical finishing. Tonight's analysis shows 92% win probability.",
      timeAgo: "8 minutes ago",
      engagement: {
        comments: 47,
        likes: 289,
        shares: 34,
      },
      matchInfo: {
        team1: "Bayern Munich",
        team2: "Dortmund",
        score: "4-2",
        league: "Bundesliga",
        status: "FT",
      },
    },
    {
      id: "3",
      author: {
        name: "Stats Master",
        avatar: "https://i.pravatar.cc/150?img=45",
        level: 74,
        verified: true,
      },
      content:
        "Liverpool's comeback king status! Statistical breakdown: 87% pass accuracy, 23 shots on target. Their second-half performance is legendary ⚽",
      timeAgo: "15 minutes ago",
      engagement: {
        comments: 18,
        likes: 124,
        shares: 9,
      },
    },
    {
      id: "4",
      author: {
        name: "Soccer Analytics",
        avatar: "https://i.pravatar.cc/150?img=28",
        level: 92,
        verified: true,
        badges: ["diamond"],
      },
      content:
        "Real Madrid vs Barcelona - El Clasico preview! Key player matchups and tactical analysis. This will be the match of the season! 🏆",
      timeAgo: "1 hour ago",
      engagement: {
        comments: 156,
        likes: 542,
        shares: 67,
      },
      matchInfo: {
        team1: "Real Madrid",
        team2: "Barcelona",
        league: "La Liga",
        status: "Upcoming",
      },
    },
  ];

  useEffect(() => {
    // Simulate active users counter
    const interval = setInterval(() => {
      setActiveUsers((prev) => prev + Math.floor(Math.random() * 5) - 2);
    }, 4000);

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

    // Arrow animation
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

  const renderInteractiveHub = () => (
    <View style={styles.interactiveSection}>
      <TouchableOpacity
        style={[
          styles.hubCard,
          { backgroundColor: theme.colors.primary + "20" },
        ]}
        onPress={() => router.push("/interactive-hub")}
        activeOpacity={0.8}
      >
        <View style={styles.hubHeader}>
          <View style={styles.hubLeft}>
            <Users size={18} color={theme.colors.text} />
            <Text style={[styles.hubTitle, { color: theme.colors.text }]}>
              Interactive Hub
            </Text>
          </View>
          <View style={styles.liveContainer}>
            <Animated.View
              style={[
                styles.arrowIcon,
                {
                  opacity: arrowAnim,
                  transform: [
                    {
                      translateX: arrowAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 6],
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
                styles.liveBadge,
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
        <View style={styles.hubContent}>
          <Text style={[styles.activeText, { color: theme.colors.text }]}>
            {activeUsers} users currently active
          </Text>
          <View style={styles.avatarsRow}>
            {[1, 2, 3, 4, 5].map((i) => (
              <View
                key={i}
                style={[styles.miniAvatar, { marginLeft: i === 1 ? 0 : -10 }]}
              >
                <Image
                  source={{ uri: `https://i.pravatar.cc/100?img=${i + 10}` }}
                  style={styles.avatarImage}
                />
              </View>
            ))}
            <TouchableOpacity style={styles.viewMore}>
              <Eye size={14} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );

  const renderFilterButtons = () => (
    <View style={styles.filtersContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersScroll}
      >
        {filterButtons.map((filter) => (
          <TouchableOpacity
            key={filter.id}
            style={[
              styles.filterButton,
              {
                backgroundColor:
                  activeFilter === filter.id
                    ? theme.colors.primary + "30"
                    : "transparent",
                borderColor:
                  activeFilter === filter.id
                    ? theme.colors.primary
                    : filter.isSpecial
                      ? "#FF4444"
                      : theme.colors.border || "rgba(255,255,255,0.2)",
              },
            ]}
            onPress={() => setActiveFilter(filter.id)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterText,
                {
                  color: filter.isSpecial
                    ? "#FF4444"
                    : activeFilter === filter.id
                      ? theme.colors.primary
                      : theme.colors.textSecondary,
                },
              ]}
            >
              {filter.label}
            </Text>
            {filter.isSpecial && (
              <View style={styles.rulesDot}>
                <Text style={styles.rulesDotText}>!</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderPost = (post: Post) => (
    <TouchableOpacity
      key={post.id}
      style={[
        styles.postCard,
        { backgroundColor: theme.colors.background, borderColor: theme.colors.border || "rgba(255,255,255,0.1)" },
      ]}
      activeOpacity={0.9}
    >
      {/* Author Header */}
      <View style={styles.postHeader}>
        <View style={styles.authorInfo}>
          <Image source={{ uri: post.author.avatar }} style={styles.avatar} />
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>Lv {post.author.level}</Text>
          </View>
        </View>
        <View style={styles.authorDetails}>
          <View style={styles.nameRow}>
            <Text style={[styles.authorName, { color: theme.colors.text }]}>
              {post.author.name}
            </Text>
            {post.author.verified && <Text style={styles.verifiedIcon}>👑</Text>}
            {post.author.badges?.map((badge, i) => (
              <Text key={i} style={styles.badgeIcon}>
                {badge === "crown" ? "👑" : badge === "fire" ? "🔥" : badge === "star" ? "⭐" : badge === "trophy" ? "🏆" : badge === "diamond" ? "💎" : ""}
              </Text>
            ))}
          </View>
          <Text style={[styles.timeAgo, { color: theme.colors.textSecondary }]}>
            {post.timeAgo}
          </Text>
        </View>
        {post.isLive && (
          <View style={styles.postLiveTag}>
            <Text style={styles.postLiveText}>LIVE</Text>
          </View>
        )}
      </View>

      {/* Post Content */}
      <Text style={[styles.postContent, { color: theme.colors.text }]}>
        {post.content}
      </Text>

      {/* Match Info Card */}
      {post.matchInfo && (
        <View
          style={[
            styles.matchCard,
            {
              backgroundColor: theme.colors.backgroundSecondary,
              borderColor: theme.colors.border || "rgba(255,255,255,0.1)",
            },
          ]}
        >
          <View style={styles.matchHeader}>
            <View style={styles.leagueBadge}>
              <Text style={[styles.leagueText, { color: theme.colors.text }]}>
                {post.matchInfo.league || "Match"}
              </Text>
            </View>
            {post.matchInfo.status && (
              <Text
                style={[
                  styles.matchStatus,
                  {
                    color: post.matchInfo.status.includes("Live")
                      ? "#FF4444"
                      : theme.colors.textSecondary,
                  },
                ]}
              >
                {post.matchInfo.status}
              </Text>
            )}
          </View>
          <View style={styles.teamsRow}>
            <Text style={[styles.teamName, { color: theme.colors.text }]}>
              {post.matchInfo.team1}
            </Text>
            <Text style={[styles.vsText, { color: theme.colors.textSecondary }]}>
              VS
            </Text>
            <Text style={[styles.teamName, { color: theme.colors.text }]}>
              {post.matchInfo.team2}
            </Text>
          </View>
          {post.matchInfo.score && (
            <Text style={[styles.scoreText, { color: theme.colors.primary }]}>
              {post.matchInfo.score}
            </Text>
          )}
        </View>
      )}

      {/* Engagement Footer */}
      <View style={styles.engagementBar}>
        <View style={styles.engagementLeft}>
          <TouchableOpacity style={styles.engageButton}>
            <Heart size={16} color={theme.colors.textSecondary} />
            <Text style={[styles.engageCount, { color: theme.colors.textSecondary }]}>
              {post.engagement.likes}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.engageButton}>
            <MessageCircle size={16} color={theme.colors.textSecondary} />
            <Text style={[styles.engageCount, { color: theme.colors.textSecondary }]}>
              {post.engagement.comments}
            </Text>
          </TouchableOpacity>
          {post.engagement.shares && (
            <TouchableOpacity style={styles.engageButton}>
              <Share2 size={16} color={theme.colors.textSecondary} />
              <Text style={[styles.engageCount, { color: theme.colors.textSecondary }]}>
                {post.engagement.shares}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        {post.engagement.views && (
          <View style={styles.viewsCount}>
            <Eye size={14} color={theme.colors.textSecondary} />
            <Text style={[styles.viewsText, { color: theme.colors.textSecondary }]}>
              {post.engagement.views}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {renderInteractiveHub()}
        {renderFilterButtons()}
        <View style={styles.postsContainer}>
          {footballPosts.map((post) => renderPost(post))}
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        activeOpacity={0.9}
      >
        <TrendingUp size={24} color="#FFFFFF" />
      </TouchableOpacity>
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
  scrollContent: {
    paddingBottom: 100,
  },

  // Interactive Hub
  interactiveSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    marginBottom: 4,
  },
  hubCard: {
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  hubHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  hubLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  hubTitle: {
    fontSize: 16,
    fontFamily: "Inter-SemiBold",
  },
  liveContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  arrowIcon: {
    marginRight: 6,
  },
  liveBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  liveText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontFamily: "Inter-Bold",
  },
  hubContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  activeText: {
    fontSize: 14,
    fontFamily: "Inter-Medium",
  },
  avatarsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  miniAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  viewMore: {
    marginLeft: 8,
    padding: 4,
  },

  // Filters
  filtersContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  filtersScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  filterText: {
    fontSize: 13,
    fontFamily: "Inter-Medium",
  },
  rulesDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#FF4444",
    justifyContent: "center",
    alignItems: "center",
  },
  rulesDotText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontFamily: "Inter-Bold",
  },

  // Posts
  postsContainer: {
    paddingTop: 8,
  },
  postCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  postHeader: {
    flexDirection: "row",
    marginBottom: 12,
    alignItems: "flex-start",
  },
  authorInfo: {
    position: "relative",
    marginRight: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  levelBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    backgroundColor: "#FFD700",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  levelText: {
    fontSize: 8,
    fontFamily: "Inter-Bold",
    color: "#000",
  },
  authorDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 2,
  },
  authorName: {
    fontSize: 15,
    fontFamily: "Inter-SemiBold",
  },
  verifiedIcon: {
    fontSize: 14,
  },
  badgeIcon: {
    fontSize: 12,
  },
  timeAgo: {
    fontSize: 12,
    fontFamily: "Inter-Regular",
  },
  postLiveTag: {
    backgroundColor: "#FF4444",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  postLiveText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontFamily: "Inter-Bold",
  },
  postContent: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
    lineHeight: 20,
    marginBottom: 12,
  },

  // Match Card
  matchCard: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  matchHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  leagueBadge: {
    backgroundColor: "#FF6B35",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  leagueText: {
    fontSize: 10,
    fontFamily: "Inter-Bold",
    color: "#FFFFFF",
  },
  matchStatus: {
    fontSize: 12,
    fontFamily: "Inter-SemiBold",
  },
  teamsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginBottom: 8,
  },
  teamName: {
    fontSize: 13,
    fontFamily: "Inter-SemiBold",
  },
  vsText: {
    fontSize: 12,
    fontFamily: "Inter-Medium",
  },
  scoreText: {
    fontSize: 18,
    fontFamily: "Inter-Bold",
    textAlign: "center",
  },

  // Engagement
  engagementBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
  },
  engagementLeft: {
    flexDirection: "row",
    gap: 16,
  },
  engageButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  engageCount: {
    fontSize: 12,
    fontFamily: "Inter-Medium",
  },
  viewsCount: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  viewsText: {
    fontSize: 11,
    fontFamily: "Inter-Regular",
  },

  // FAB
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
