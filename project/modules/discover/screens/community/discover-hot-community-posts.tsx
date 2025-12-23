import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "@/hooks/useTheme";
import { MessageCircle, Eye, Heart, Star } from "lucide-react-native";

interface CommunityPost {
  id: string;
  author: {
    name: string;
    avatar: string;
    level: number;
    verified: boolean;
  };
  content: string;
  timeAgo: string;
  category: string;
  engagement: {
    views: number;
    comments: number;
    likes: number;
  };
  image?: string;
  matchInfo?: {
    team1: string;
    team2: string;
    odds?: string;
  };
}

interface DiscoverHotCommunityPostsProps {
  posts: CommunityPost[];
}

export default function DiscoverHotCommunityPosts({
  posts,
}: DiscoverHotCommunityPostsProps) {
  const router = useRouter();
  const theme = useTheme();

  const handlePostPress = (postId: string) => {
    // Navigate to post details
    router.push(`/post/${postId}`);
  };

  return (
    <View style={styles.postsSection}>
      {posts.map((post, index) => (
        <TouchableOpacity
          key={post.id}
          style={[
            styles.postCard,
            {
              borderBottomColor: theme.colors.border,
            },
          ]}
          onPress={() => handlePostPress(post.id)}
          activeOpacity={0.8}
        >
          {/* Match info banner for some posts */}
          {post.matchInfo && (
            <View
              style={[
                styles.matchBanner,
                { backgroundColor: theme.colors.primary },
              ]}
            >
              <Text style={styles.matchText}>
                {post.matchInfo.team1} VS {post.matchInfo.team2}
              </Text>
            </View>
          )}

          <View style={styles.postHeader}>
            <View style={styles.authorInfo}>
              <Image
                source={{ uri: post.author.avatar }}
                style={styles.authorAvatar}
              />
              <View style={styles.levelBadge}>
                <Text style={styles.levelText}>Lv {post.author.level}</Text>
              </View>
            </View>
            <View style={styles.authorDetails}>
              <View style={styles.authorNameRow}>
                <Text style={[styles.authorName, { color: theme.colors.text }]}>
                  {post.author.name}
                </Text>
                {post.author.verified && (
                  <Star size={14} color="#FFD700" fill="#FFD700" />
                )}
              </View>
              <Text
                style={[styles.postMeta, { color: theme.colors.textSecondary }]}
              >
                {post.timeAgo} • {post.category}
              </Text>
            </View>
            {post.image && (
              <Image source={{ uri: post.image }} style={styles.postImage} />
            )}
          </View>

          <Text
            style={[styles.postContent, { color: theme.colors.text }]}
            numberOfLines={3}
          >
            {post.content}
          </Text>

          <View style={styles.postFooter}>
            <View style={styles.engagementStats}>
              <View style={styles.statItem}>
                <MessageCircle size={16} color={theme.colors.textSecondary} />
                <Text
                  style={[
                    styles.statText,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {post.engagement.comments}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Eye size={16} color={theme.colors.textSecondary} />
                <Text
                  style={[
                    styles.statText,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {post.engagement.views}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Heart size={16} color={theme.colors.textSecondary} />
                <Text
                  style={[
                    styles.statText,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {post.engagement.likes}
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  // Posts Section
  postsSection: {
    paddingTop: 0,
  },
  postCard: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  matchBanner: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginBottom: 12,
  },
  matchText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  postHeader: {
    flexDirection: "row",
    marginBottom: 12,
  },
  authorInfo: {
    position: "relative",
    marginRight: 12,
  },
  authorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  levelBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: "#FFD700",
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 8,
  },
  levelText: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#000",
  },
  authorDetails: {
    flex: 1,
    justifyContent: "center",
  },
  authorNameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  authorName: {
    fontSize: 14,
    fontWeight: "600",
    marginRight: 4,
  },
  postMeta: {
    fontSize: 12,
  },
  postImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginLeft: 12,
  },
  postContent: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  postFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  engagementStats: {
    flexDirection: "row",
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  statText: {
    fontSize: 12,
    marginLeft: 4,
  },
});
