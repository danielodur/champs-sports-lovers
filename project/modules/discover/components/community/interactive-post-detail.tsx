/**
 * Interactive Post Detail Screen
 * 
 * Full post view with:
 * - Complete post content
 * - Like/Unlike functionality
 * - Comment section
 * - Follow/Unfollow author
 * - Comment input
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Animated,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTheme, useThemeMode } from "@/hooks/useTheme";
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  Send,
  Flame,
  MoreHorizontal,
  AlertCircle,
  Share2,
  Check,
  X,
} from "lucide-react-native";
import CommunityFollowButton from "./CommunityFollowButton";
import PostShareModal from "./PostShareModal";

interface Comment {
  id: string;
  author: {
    id: string;
    name: string;
    avatar: string;
    level: number;
    verified: boolean;
  };
  content: string;
  timestamp: string;
  likes: number;
}

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
  };
  content: string;
  tags?: string[];
  sport: string;
  image?: string;
  timestamp: string;
  likes: number;
  comments: number;
  isHot?: boolean;
  isLiked?: boolean;
  isFollowing?: boolean;
}

export default function InteractivePostDetailScreen() {
  const router = useRouter();
  const { postId, isFollowing: isFollowingParam, sport: sportParam } = useLocalSearchParams();
  const theme = useTheme();
  const { theme: themeMode } = useThemeMode();
  const isDarkMode = themeMode === "dark";

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [sortBy, setSortBy] = useState<"latest" | "earliest">("latest");
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [showReportSuccess, setShowReportSuccess] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [modalAnimation] = useState(new Animated.Value(0));

  useEffect(() => {
    loadPostDetail();
  }, [postId, isFollowingParam, sportParam]);

  const loadPostDetail = () => {
    // Get follow state from route params (passed from parent)
    const initialIsFollowing = isFollowingParam === "true";
    const postSport = (sportParam as string) || "Football";
    
    // Mock data - In real app, fetch from API using postId
    const mockPost: Post = {
      id: postId as string,
      author: {
        id: "1",
        name: "Dream Sister Speed First Disc With You",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100",
        level: 78,
        badge: "Expert",
        verified: true,
        followers: 15400,
      },
      content: "🎯 Seven football games (06:00 ~ 11:00) Central North America, International competition\n\nTime: 11/14 09:48 - 11/14 11:48\n\n😘We do long-term model, which refers to the long stream of water, not the casual manipulation of chaotic frequency. Long-term behavior has great transaction costs. The real master is to buy more when the situation is good, don't wait to see them act, often walk by the river and don't get wet shoes, shoot when you have great opportunities, and make profits quickly. Must rely on high win rate trading model to achieve profit, otherwise it is ground meat.\n\nFamiliar with each major competition gameplay, take your own path, make your own plan, you are good at your needs, I am good at major, stable increase in profit.\n\nFloor quantity: 30 (Interactive Card + Paid Card)",
      tags: ["Confidence Bet"],
      sport: postSport,
      image: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=400",
      timestamp: "11/14 09:48 - 11:48",
      likes: 128,
      comments: 7,
      isLiked: false,
      isFollowing: initialIsFollowing,
    };

    const mockComments: Comment[] = [
      {
        id: "c1",
        author: {
          id: "u1",
          name: "Rush Strike 46 Individual 10 Series",
          avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100",
          level: 66,
          verified: true,
        },
        content: "🏆🏀🏀🏀",
        timestamp: "8 floors yesterday",
        likes: 66,
      },
      {
        id: "c2",
        author: {
          id: "u2",
          name: "Unparalleled Snake Year Big Red",
          avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100",
          level: 58,
          verified: true,
        },
        content: "👑",
        timestamp: "7 floors yesterday",
        likes: 666,
      },
      {
        id: "c3",
        author: {
          id: "u3",
          name: "Hello 18 Winning Red",
          avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100",
          level: 47,
          verified: false,
        },
        content: "👑",
        timestamp: "6 floors yesterday",
        likes: 66,
      },
      {
        id: "c4",
        author: {
          id: "u4",
          name: "Thunder Speed Football God Hua Tsai",
          avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100",
          level: 75,
          verified: true,
        },
        content: "🏆🏆🏆🏆🏆🏆🏆🏆 Sky hits Sky hits Sky hits Sky hits 7 hits 7 hits 7 hits",
        timestamp: "5 floors yesterday",
        likes: 88,
      },
      {
        id: "c5",
        author: {
          id: "u5",
          name: "Thunder Strongest Initial Building King、Old King",
          avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100",
          level: 82,
          verified: true,
        },
        content: "Congratulations Red Package 🧧",
        timestamp: "4 floors yesterday",
        likes: 45,
      },
      {
        id: "c6",
        author: {
          id: "1",
          name: "Dream Sister Speed First Disc With You",
          avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100",
          level: 78,
          verified: true,
        },
        content: "2023 to now take down 16,000+ hands, 30,000 times total series ❤️ highest (3008 times) 14 singles one, stable recommend per week ≥210 fields live broadcast, normal outside one field 38, 230*38=8740, weekly card only needs 1888, processing weekly card is 95% more convenient than single into live broadcast, average one field 3 currency not arrive! Welcome new old fans come to process ❤️\n\nCurrently coming shore fans every day adding, from today start follow me, I dare guarantee short period no dare say, long period definitely come shore!",
        timestamp: "3 floors yesterday",
        likes: 128,
      },
      {
        id: "c7",
        author: {
          id: "1",
          name: "Dream Sister Speed First Disc With You",
          avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100",
          level: 78,
          verified: true,
        },
        content: "'Interactive Archive Single Time Card' enter immediately can view my recommended competitions, have plan long period follow can 【Unlock Weekly Card 7 Days】 discount 80%",
        timestamp: "2 floors yesterday",
        likes: 92,
      },
    ];

    setPost(mockPost);
    setComments(mockComments);
  };

  const handleLike = () => {
    if (!post) return;
    setPost({
      ...post,
      isLiked: !post.isLiked,
      likes: post.isLiked ? post.likes - 1 : post.likes + 1,
    });
  };

  const handleFollowChange = (isFollowing: boolean, newCount: number) => {
    if (!post) return;
    setPost({
      ...post,
      isFollowing,
      author: {
        ...post.author,
        followers: newCount,
      },
    });
  };

  const handleSendComment = () => {
    if (!newComment.trim()) return;

    const newCommentObj: Comment = {
      id: `c${comments.length + 1}`,
      author: {
        id: "currentUser",
        name: "You",
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100",
        level: 42,
        verified: false,
      },
      content: newComment,
      timestamp: "Just now",
      likes: 0,
    };

    setComments([newCommentObj, ...comments]);
    setNewComment("");
    
    if (post) {
      setPost({ ...post, comments: post.comments + 1 });
    }
  };

  const handleOpenOptions = () => {
    setShowOptionsModal(true);
    Animated.spring(modalAnimation, {
      toValue: 1,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  };

  const handleCloseOptions = () => {
    Animated.timing(modalAnimation, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowOptionsModal(false);
    });
  };

  const handleReport = async () => {
    handleCloseOptions();
    
    try {
      // Call the API to submit the report
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportedUserId: post?.author.id,
          reportedUserName: post?.author.name,
          reporterUserId: 'currentUser', // TODO: Replace with actual user ID from auth
          reporterEmail: null, // TODO: Add user email if needed
          postId: post?.id,
          postContent: post?.content.substring(0, 500), // First 500 chars
          postSport: post?.sport,
          reason: 'user_report',
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        console.log('Report submitted successfully:', result.reportId);
        
        // Show success message after a short delay
        setTimeout(() => {
          setShowReportSuccess(true);
          setTimeout(() => {
            setShowReportSuccess(false);
          }, 2000);
        }, 300);
      } else {
        console.error('Failed to submit report:', result.error);
        // Still show success to user (don't reveal technical errors)
        setTimeout(() => {
          setShowReportSuccess(true);
          setTimeout(() => {
            setShowReportSuccess(false);
          }, 2000);
        }, 300);
      }
    } catch (error) {
      console.error('Report submission error:', error);
      // Still show success to user (better UX)
      setTimeout(() => {
        setShowReportSuccess(true);
        setTimeout(() => {
          setShowReportSuccess(false);
        }, 2000);
      }, 300);
    }
  };

  const handleShare = () => {
    handleCloseOptions();
    // Open the share modal
    setTimeout(() => {
      setShowShareModal(true);
    }, 300);
  };

  const renderComment = (comment: Comment) => (
    <View key={comment.id} style={styles.commentCard}>
      <Image source={{ uri: comment.author.avatar }} style={styles.commentAvatar} />
      <View style={styles.commentContent}>
        <View style={styles.commentHeader}>
          <View style={styles.commentAuthorInfo}>
            <Text style={[styles.commentAuthorName, { color: theme.colors.text }]}>
              {comment.author.name}
            </Text>
            {comment.author.verified && (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>✓</Text>
              </View>
            )}
            {comment.author.level && (
              <View style={styles.levelBadge}>
                <Text style={styles.levelText}>Lv {comment.author.level}</Text>
              </View>
            )}
          </View>
        </View>
        <Text style={[styles.commentText, { color: isDarkMode ? "#E0E0E0" : "#333333" }]}>
          {comment.content}
        </Text>
        <View style={styles.commentFooter}>
          <Text style={[styles.commentTimestamp, { color: isDarkMode ? "#888888" : "#999999" }]}>
            {comment.timestamp} · Reply
          </Text>
          <TouchableOpacity style={styles.commentLikeButton}>
            <Text style={[styles.commentLikes, { color: isDarkMode ? "#B0B0B0" : "#666666" }]}>
              Like {comment.likes > 0 && `· ${comment.likes}`}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (!post) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={{ color: theme.colors.text }}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const badgeColor = 
    post.author.badge === "Expert" ? "#FF6B35" :
    post.author.badge === "VIP" ? "#FFD700" :
    post.author.badge === "Pro" ? "#00BCD4" : undefined;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={["top"]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          {post.sport} Post
        </Text>
        <TouchableOpacity style={styles.moreButton} onPress={handleOpenOptions}>
          <MoreHorizontal size={24} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Post Content */}
          <View style={[styles.postCard, { backgroundColor: theme.colors.backgroundSecondary }]}>
            {/* Author Section with Follow Button */}
            <View style={styles.authorSectionWrapper}>
              {/* Follow Button - Top Right */}
              <View style={styles.followButtonWrapper}>
                <CommunityFollowButton
                  authorId={post.author.id}
                  authorName={post.author.name}
                  initialFollowState={post.isFollowing || false}
                  followerCount={post.author.followers}
                  onFollowChange={handleFollowChange}
                />
              </View>

              {/* Author Info - Below */}
              <View style={styles.authorSection}>
                <Image source={{ uri: post.author.avatar }} style={styles.authorAvatar} />
                <View style={styles.authorInfo}>
                  <View style={styles.authorNameRow}>
                    <Text style={[styles.authorName, { color: theme.colors.text }]}>
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
                    <Text style={[styles.followers, { color: isDarkMode ? "#888888" : "#999999" }]}>
                      {post.author.followers.toLocaleString()} followers
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Post Content */}
            <Text style={[styles.postContent, { color: theme.colors.text }]}>
              {post.content}
            </Text>

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <View style={styles.tagsContainer}>
                {post.tags.map((tag, index) => (
                  <View key={index} style={[styles.tag, { backgroundColor: isDarkMode ? "#3A3A3A" : "#F0F0F0" }]}>
                    <Text style={[styles.tagText, { color: isDarkMode ? "#FFD700" : "#FF6B35" }]}>
                      • {tag}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Post Image */}
            {post.image && (
              <Image source={{ uri: post.image }} style={styles.postImage} resizeMode="cover" />
            )}

            {/* Post Metadata */}
            <View style={styles.postMeta}>
              <Text style={[styles.timestamp, { color: isDarkMode ? "#888888" : "#999999" }]}>
                {post.timestamp}
              </Text>
              {post.isHot && (
                <View style={styles.hotBadge}>
                  <Flame size={14} color="#FF6B35" />
                  <Text style={styles.hotText}>HOT</Text>
                </View>
              )}
            </View>

            {/* Actions */}
            <View style={[styles.actionsBar, { borderTopColor: isDarkMode ? "#3A3A3A" : "#E0E0E0" }]}>
              <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
                <Heart size={22} color="#FF6B35" fill={post.isLiked ? "#FF6B35" : "none"} />
                <Text style={[styles.actionText, { color: "#FF6B35" }]}>{post.likes}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <MessageCircle size={22} color={isDarkMode ? "#B0B0B0" : "#666666"} />
                <Text style={[styles.actionText, { color: isDarkMode ? "#B0B0B0" : "#666666" }]}>
                  {post.comments}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Comments Section */}
          <View style={[styles.commentsSection, { backgroundColor: theme.colors.backgroundSecondary }]}>
            <View style={styles.commentsHeader}>
              <Text style={[styles.commentsTitle, { color: theme.colors.text }]}>
                All Comments {comments.length}
              </Text>
              <View style={styles.sortButtons}>
                <TouchableOpacity
                  style={[styles.sortButton, sortBy === "latest" && styles.activeSortButton]}
                  onPress={() => setSortBy("latest")}
                >
                  <Text style={[styles.sortButtonText, { color: sortBy === "latest" ? "#FF6B35" : (isDarkMode ? "#888888" : "#999999") }]}>
                    Latest
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.sortButton, sortBy === "earliest" && styles.activeSortButton]}
                  onPress={() => setSortBy("earliest")}
                >
                  <Text style={[styles.sortButtonText, { color: sortBy === "earliest" ? "#FF6B35" : (isDarkMode ? "#888888" : "#999999") }]}>
                    Earliest
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {comments.map(renderComment)}
          </View>
        </ScrollView>

        {/* Comment Input - Improved UI */}
        <View style={[
          styles.commentInputContainer,
          { 
            backgroundColor: theme.colors.background,
            borderTopColor: theme.colors.border
          }
        ]}>
          <View style={[
            styles.inputWrapper,
            { 
              backgroundColor: theme.colors.backgroundSecondary,
              borderColor: theme.colors.border
            }
          ]}>
            <TextInput
              style={[
                styles.commentInput,
                { color: theme.colors.text }
              ]}
              placeholder="Write a comment..."
              placeholderTextColor={theme.colors.textSecondary}
              value={newComment}
              onChangeText={setNewComment}
              multiline={false}
              maxLength={500}
              returnKeyType="send"
              onSubmitEditing={newComment.trim() ? handleSendComment : undefined}
              blurOnSubmit={false}
            />
          </View>

          {/* Send Button */}
          <TouchableOpacity
            style={[
              styles.sendButton,
              { 
                backgroundColor: newComment.trim()
                  ? theme.colors.primary 
                  : theme.colors.backgroundSecondary
              }
            ]}
            onPress={handleSendComment}
            disabled={!newComment.trim()}
          >
            <Send 
              size={20} 
              color={newComment.trim() ? "#FFFFFF" : theme.colors.textSecondary} 
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Options Modal */}
      <Modal
        visible={showOptionsModal}
        transparent
        animationType="none"
        onRequestClose={handleCloseOptions}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={handleCloseOptions}
        >
          <Animated.View
            style={[
              styles.modalContent,
              {
                backgroundColor: isDarkMode ? "#2C2C2C" : "#E8E8E8",
                transform: [
                  {
                    translateY: modalAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [300, 0],
                    }),
                  },
                ],
                opacity: modalAnimation,
              },
            ]}
          >
            {/* Report Option */}
            <TouchableOpacity
              style={[
                styles.modalOption,
                { borderBottomColor: isDarkMode ? "#505050" : "#D0D0D0" },
              ]}
              onPress={handleReport}
              activeOpacity={0.7}
            >
              <AlertCircle size={22} color={isDarkMode ? "#FFFFFF" : "#000000"} />
              <Text style={[styles.modalOptionText, { color: isDarkMode ? "#FFFFFF" : "#000000" }]}>
                Report
              </Text>
            </TouchableOpacity>

            {/* Share Option */}
            <TouchableOpacity
              style={[
                styles.modalOption,
                { borderBottomColor: isDarkMode ? "#505050" : "#D0D0D0" },
              ]}
              onPress={handleShare}
              activeOpacity={0.7}
            >
              <Share2 size={22} color={isDarkMode ? "#FFFFFF" : "#000000"} />
              <Text style={[styles.modalOptionText, { color: isDarkMode ? "#FFFFFF" : "#000000" }]}>
                Share
              </Text>
            </TouchableOpacity>

            {/* Cancel Option */}
            <TouchableOpacity
              style={styles.modalOption}
              onPress={handleCloseOptions}
              activeOpacity={0.7}
            >
              <X size={22} color={isDarkMode ? "#999999" : "#666666"} />
              <Text style={[styles.modalOptionText, { color: isDarkMode ? "#999999" : "#666666" }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>

      {/* Report Success Alert */}
      {showReportSuccess && (
        <View style={styles.successAlertOverlay}>
          <Animated.View
            style={[
              styles.successAlert,
              {
                backgroundColor: theme.colors.backgroundSecondary,
              },
            ]}
          >
            <View style={styles.successIconContainer}>
              <Check size={28} color="#4CAF50" strokeWidth={3} />
            </View>
            <Text style={[styles.successText, { color: theme.colors.text }]}>
              Author Reported
            </Text>
          </Animated.View>
        </View>
      )}

      {/* Share Modal */}
      {post && (
        <PostShareModal
          visible={showShareModal}
          onClose={() => setShowShareModal(false)}
          postId={post.id}
          authorName={post.author.name}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: "700", fontFamily: "Inter-Bold" },
  moreButton: { padding: 8 },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 20 },
  postCard: { padding: 16, marginBottom: 8 },
  authorSectionWrapper: { marginBottom: 16, minHeight: 70, paddingTop: 8 },
  followButtonWrapper: { position: "absolute", top: 8, right: 0, zIndex: 10 },
  authorSection: { flexDirection: "row", marginTop: 52 },
  authorAvatar: { width: 56, height: 56, borderRadius: 28, marginRight: 12 },
  authorInfo: { flex: 1 },
  authorNameRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  authorName: { fontSize: 16, fontWeight: "600", fontFamily: "Inter-SemiBold", marginRight: 6 },
  verifiedBadge: { width: 18, height: 18, borderRadius: 9, backgroundColor: "#4CAF50", justifyContent: "center", alignItems: "center", marginRight: 6 },
  verifiedText: { color: "#FFFFFF", fontSize: 11, fontWeight: "bold" },
  authorMeta: { flexDirection: "row", alignItems: "center", gap: 8 },
  levelBadge: { backgroundColor: "#FF6B35", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  levelText: { color: "#FFFFFF", fontSize: 11, fontWeight: "600", fontFamily: "Inter-SemiBold" },
  userBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  badgeText: { color: "#FFFFFF", fontSize: 11, fontWeight: "600", fontFamily: "Inter-SemiBold" },
  followers: { fontSize: 12, fontFamily: "Inter-Regular" },
  postContent: { fontSize: 15, lineHeight: 24, marginBottom: 16, fontFamily: "Inter-Regular" },
  tagsContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  tag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  tagText: { fontSize: 12, fontWeight: "600", fontFamily: "Inter-SemiBold" },
  postImage: { width: "100%", height: 250, borderRadius: 12, marginBottom: 16 },
  postMeta: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  timestamp: { fontSize: 13, fontFamily: "Inter-Regular" },
  hotBadge: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFF3E0", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 4 },
  hotText: { color: "#FF6B35", fontSize: 11, fontWeight: "700", fontFamily: "Inter-Bold" },
  actionsBar: { flexDirection: "row", gap: 32, paddingTop: 16, borderTopWidth: 1 },
  actionButton: { flexDirection: "row", alignItems: "center", gap: 8 },
  actionText: { fontSize: 16, fontWeight: "600", fontFamily: "Inter-SemiBold" },
  commentsSection: { padding: 16, marginTop: 8 },
  commentsHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  commentsTitle: { fontSize: 17, fontWeight: "700", fontFamily: "Inter-Bold" },
  sortButtons: { flexDirection: "row", gap: 16 },
  sortButton: { paddingVertical: 4 },
  activeSortButton: {},
  sortButtonText: { fontSize: 14, fontWeight: "600", fontFamily: "Inter-SemiBold" },
  commentCard: { flexDirection: "row", marginBottom: 20 },
  commentAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  commentContent: { flex: 1 },
  commentHeader: { marginBottom: 6 },
  commentAuthorInfo: { flexDirection: "row", alignItems: "center", gap: 6 },
  commentAuthorName: { fontSize: 14, fontWeight: "600", fontFamily: "Inter-SemiBold" },
  commentText: { fontSize: 14, lineHeight: 20, marginBottom: 6, fontFamily: "Inter-Regular" },
  commentFooter: { flexDirection: "row", justifyContent: "space-between" },
  commentTimestamp: { fontSize: 12, fontFamily: "Inter-Regular" },
  commentLikeButton: {},
  commentLikes: { fontSize: 12, fontFamily: "Inter-Regular" },
  commentInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === "ios" ? 30 : 16,
    gap: 12,
    borderTopWidth: 1,
    minHeight: 72,
    position: "relative",
  },
  inputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxHeight: 48,
    minHeight: 48,
    height: 48,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  commentInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Inter-Regular",
    backgroundColor: "transparent",
    paddingRight: 12,
    paddingTop: 0,
    paddingBottom: 0,
    lineHeight: 20,
    textAlignVertical: "center",
    minHeight: 24,
    maxHeight: 24,
    height: 24,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 2,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    paddingHorizontal: 20,
    gap: 16,
    borderBottomWidth: 1,
  },
  modalOptionText: {
    fontSize: 16,
    fontWeight: "500",
    fontFamily: "Inter-Medium",
  },
  // Success Alert Styles
  successAlertOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    zIndex: 9999,
  },
  successAlert: {
    paddingVertical: 24,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    minWidth: 200,
  },
  successIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#4CAF50" + "20",
    justifyContent: "center",
    alignItems: "center",
  },
  successText: {
    fontSize: 18,
    fontWeight: "600",
    fontFamily: "Inter-SemiBold",
  },
});

