/**
 * Interactive Hub - Basketball Tab
 * 
 * Shows only basketball-related posts
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "@/hooks/useTheme";
import { Heart, MessageCircle, Flame } from "lucide-react-native";
import CommunityFollowButton from "./CommunityFollowButton";

interface Post {
  id: string;
  author: {
    id: string;
    name: string;
    avatar: string;
    level: number;
    badge?: string;
    verified: boolean;
    followers: number;
    isFollowing?: boolean;
  };
  content: string;
  tags?: string[];
  sport: "Basketball";
  image?: string;
  timestamp: string;
  likes: number;
  comments: number;
  isHot?: boolean;
}

interface InteractiveBasketballProps {
  theme: any;
  isDarkMode: boolean;
}

export default function InteractiveBasketball({ theme, isDarkMode }: InteractiveBasketballProps) {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    setLoading(true);
    
    // Mock data - Basketball only
    const mockPosts: Post[] = [
      {
        id: "b1",
        author: {
          id: "4",
          name: "Friday NBA Three Games",
          avatar: "https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?w=100",
          level: 45,
          verified: false,
          followers: 3200,
        },
        content: "Friday / NBA Three Games Chicken Brother Self-bring Team!\n\nTime: 11/13 08:31 - 10:00\n\nThree confident NBA picks for tonight!",
        sport: "Basketball",
        timestamp: "11/13 08:31 - 10:00",
        likes: 58,
        comments: 8,
      },
      {
        id: "b2",
        author: {
          id: "5",
          name: "Detective Red Cannon",
          avatar: "https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?w=100",
          level: 72,
          badge: "Pro",
          verified: true,
          followers: 9800,
        },
        content: "8 o'clock Fierce Dragon vs Knight, super top level ♠️ focus ❤️ 3 first single recommendation, sleep wake up harvest\n\nTop tier NBA matchup analysis!",
        tags: ["Top Pick", "NBA"],
        sport: "Basketball",
        image: "https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=400",
        timestamp: "11/13 07:48 - 08:49",
        likes: 68,
        comments: 15,
      },
      {
        id: "b3",
        author: {
          id: "6",
          name: "Little Basketball Bring You Fly",
          avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100",
          level: 55,
          badge: "Expert",
          verified: true,
          followers: 7100,
        },
        content: "Thursday /8:00 NBA 🏀 /3 👊 Strike consecutive red 🏆🏆🏆 !\n\nHot winning streak continues!",
        tags: ["Hot Streak", "3-Pick"],
        sport: "Basketball",
        timestamp: "11/12 05:18 - 08:18",
        likes: 38,
        comments: 6,
        isHot: true,
      },
      {
        id: "b4",
        author: {
          id: "7",
          name: "Super Invincible Red Artillery Cavalry",
          avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100",
          level: 68,
          badge: "VIP",
          verified: true,
          followers: 11500,
        },
        content: "《17 win 17》 record entire network first win rate league 💕 8 o'clock NBA three hands profit 1674 hands package shoreline\n\nNear period 17 consecutive red record",
        tags: ["Record Breaking", "High Win Rate"],
        sport: "Basketball",
        timestamp: "11/12 07:00 - 08:20",
        likes: 128,
        comments: 18,
        isHot: true,
      },
    ];

    setTimeout(() => {
      setPosts(mockPosts);
      setLoading(false);
      setRefreshing(false);
    }, 500);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPosts();
  };

  const handleLike = (postId: string) => {
    setPosts(prev =>
      prev.map(post =>
        post.id === postId
          ? { ...post, likes: post.likes + 1 }
          : post
      )
    );
  };

  const handleFollowChange = (postId: string, isFollowing: boolean, newCount: number) => {
    setPosts(prev =>
      prev.map(post =>
        post.id === postId
          ? {
              ...post,
              author: {
                ...post.author,
                isFollowing,
                followers: newCount,
              },
            }
          : post
      )
    );
  };

  const handlePostPress = (post: Post) => {
    // Navigate to post detail screen with full state
    router.push({
      pathname: "/interactive-post-detail",
      params: {
        postId: post.id,
        isFollowing: post.author.isFollowing ? "true" : "false",
        sport: post.sport,
      },
    });
  };

  const renderPost = (post: Post) => {
    const badgeColor = 
      post.author.badge === "Expert" ? "#FF6B35" :
      post.author.badge === "VIP" ? "#FFD700" :
      post.author.badge === "Pro" ? "#00BCD4" : undefined;

    return (
      <TouchableOpacity
        key={post.id}
        style={[
          styles.postCard,
          {
            backgroundColor: theme.colors.backgroundSecondary,
            borderColor: post.isHot ? "#FF6B35" : "transparent",
            borderWidth: post.isHot ? 2 : 0,
          },
        ]}
        onPress={() => handlePostPress(post)}
        activeOpacity={0.7}
      >
        <View style={styles.postHeaderWrapper}>
          {/* Follow/Bell Button - Top Right */}
          <View style={styles.followButtonContainer}>
            <CommunityFollowButton
              authorId={post.author.id}
              authorName={post.author.name}
              initialFollowState={post.author.isFollowing || false}
              followerCount={post.author.followers}
              onFollowChange={(isFollowing, newCount) => {
                handleFollowChange(post.id, isFollowing, newCount);
              }}
            />
          </View>

          {/* Author Info - Below */}
          <View style={styles.postHeader}>
            <Image source={{ uri: post.author.avatar }} style={styles.authorAvatar} />
            <View style={styles.authorDetails}>
              <View style={styles.authorNameRow}>
                <Text
                  style={[styles.authorName, { color: isDarkMode ? "#FFFFFF" : "#000000" }]}
                  numberOfLines={1}
                >
                  {post.author.name}
                </Text>
                {post.author.verified && (
                  <View style={styles.verifiedBadge}>
                    <Text style={styles.verifiedText}>✓</Text>
                  </View>
                )}
              </View>
              <View style={styles.authorMeta}>
                {post.author.level && (
                  <View style={styles.levelBadge}>
                    <Text style={styles.levelText}>Lv {post.author.level}</Text>
                  </View>
                )}
                {post.author.badge && (
                  <View style={[styles.userBadge, { backgroundColor: badgeColor }]}>
                    <Text style={styles.badgeText}>{post.author.badge}</Text>
                  </View>
                )}
                {post.isHot && (
                  <View style={styles.hotBadge}>
                    <Flame size={12} color="#FF6B35" />
                    <Text style={styles.hotText}>HOT</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>

        <Text
          style={[styles.postContent, { color: theme.colors.text }]}
          numberOfLines={4}
        >
          {post.content}
        </Text>

        {post.tags && post.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {post.tags.map((tag, index) => (
              <View
                key={index}
                style={[styles.tag, { backgroundColor: isDarkMode ? "#3A3A3A" : "#F0F0F0" }]}
              >
                <Text style={[styles.tagText, { color: isDarkMode ? "#FFD700" : "#FF6B35" }]}>
                  • {tag}
                </Text>
              </View>
            ))}
          </View>
        )}

        {post.image && <Image source={{ uri: post.image }} style={styles.postImage} resizeMode="cover" />}

        <View style={styles.postFooter}>
          <Text style={[styles.timestamp, { color: isDarkMode ? "#888888" : "#999999" }]}>
            {post.timestamp}
          </Text>
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={(e) => {
                e.stopPropagation();
                handleLike(post.id);
              }}
            >
              <Heart size={18} color="#FF6B35" fill="none" />
              <Text style={[styles.actionText, { color: "#FF6B35" }]}>{post.likes}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <MessageCircle size={18} color={isDarkMode ? "#B0B0B0" : "#666666"} />
              <Text style={[styles.actionText, { color: isDarkMode ? "#B0B0B0" : "#666666" }]}>
                {post.comments}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#FF6B35"
          colors={["#FF6B35"]}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {posts.map(renderPost)}
      <View style={styles.endIndicator}>
        <Text style={[styles.endText, { color: isDarkMode ? "#666666" : "#999999" }]}>
          — End of Feed —
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingTop: 0, paddingBottom: 0 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 40 },
  postCard: { borderRadius: 0, padding: 16, marginBottom: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  postHeaderWrapper: { marginBottom: 12, minHeight: 70, paddingTop: 8 },
  followButtonContainer: { position: "absolute", top: 8, right: 0, zIndex: 10 },
  postHeader: { flexDirection: "row", alignItems: "flex-start", marginTop: 52 },
  authorAvatar: { width: 48, height: 48, borderRadius: 24, marginRight: 12 },
  authorDetails: { flex: 1 },
  authorNameRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  authorName: { fontSize: 15, fontWeight: "600", fontFamily: "Inter-SemiBold", marginRight: 6, flex: 1 },
  verifiedBadge: { width: 16, height: 16, borderRadius: 8, backgroundColor: "#4CAF50", justifyContent: "center", alignItems: "center" },
  verifiedText: { color: "#FFFFFF", fontSize: 10, fontWeight: "bold" },
  authorMeta: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  levelBadge: { backgroundColor: "#FF6B35", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  levelText: { color: "#FFFFFF", fontSize: 11, fontWeight: "600", fontFamily: "Inter-SemiBold" },
  userBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  badgeText: { color: "#FFFFFF", fontSize: 11, fontWeight: "600", fontFamily: "Inter-SemiBold" },
  hotBadge: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFF3E0", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 4 },
  hotText: { color: "#FF6B35", fontSize: 11, fontWeight: "700", fontFamily: "Inter-Bold" },
  postContent: { fontSize: 15, lineHeight: 22, marginBottom: 12, fontFamily: "Inter-Regular" },
  tagsContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  tag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  tagText: { fontSize: 12, fontWeight: "600", fontFamily: "Inter-SemiBold" },
  postImage: { width: "100%", height: 200, borderRadius: 12, marginBottom: 12 },
  postFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  timestamp: { fontSize: 12, fontFamily: "Inter-Regular" },
  actions: { flexDirection: "row", gap: 16 },
  actionButton: { flexDirection: "row", alignItems: "center", gap: 6 },
  actionText: { fontSize: 14, fontWeight: "600", fontFamily: "Inter-SemiBold" },
  endIndicator: { alignItems: "center", paddingVertical: 24 },
  endText: { fontSize: 14, fontFamily: "Inter-Regular" },
});

