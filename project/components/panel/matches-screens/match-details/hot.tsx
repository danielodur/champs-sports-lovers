import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Heart, MessageCircle, Share, ThumbsUp } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';

interface SocialPost {
  id: string;
  user: {
    id: string;
    name: string;
    avatar: string;
    verified?: boolean;
  };
  content: string;
  timestamp: string;
  likes: number;
  comments: number;
  shares: number;
  isLiked: boolean;
  media?: {
    type: 'image' | 'video';
    url: string;
  };
}

interface MatchDetailsHotProps {
  homeTeamName?: string;
  awayTeamName?: string;
  matchId?: string;
}

export default function MatchDetailsHot({
  homeTeamName = 'Home',
  awayTeamName = 'Away',
  matchId,
}: MatchDetailsHotProps) {
  const theme = useTheme();

  // Generate sample social media posts
  const generateSocialPosts = (): SocialPost[] => [
    {
      id: '1',
      user: {
        id: 'user1',
        name: 'Football Fan',
        avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg',
        verified: true,
      },
      content: `What a match! ${homeTeamName} vs ${awayTeamName} is getting intense! 🔥⚽`,
      timestamp: '2 minutes ago',
      likes: 24,
      comments: 8,
      shares: 3,
      isLiked: false,
    },
    {
      id: '2',
      user: {
        id: 'user2',
        name: 'Sports Analyst',
        avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg',
      },
      content: 'The tactical setup from both teams is brilliant today. Expecting goals in the second half!',
      timestamp: '5 minutes ago',
      likes: 156,
      comments: 42,
      shares: 18,
      isLiked: true,
    },
    {
      id: '3',
      user: {
        id: 'user3',
        name: 'Match Reporter',
        avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg',
        verified: true,
      },
      content: `BREAKING: Key player injury update for ${awayTeamName}. This could change everything! 🚨`,
      timestamp: '8 minutes ago',
      likes: 89,
      comments: 67,
      shares: 45,
      isLiked: false,
      media: {
        type: 'image',
        url: 'https://images.pexels.com/photos/274506/pexels-photo-274506.jpeg',
      },
    },
    {
      id: '4',
      user: {
        id: 'user4',
        name: 'Fan Club Official',
        avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg',
        verified: true,
      },
      content: 'Our supporters are creating an amazing atmosphere tonight! You can hear them from miles away! 📢💙',
      timestamp: '12 minutes ago',
      likes: 312,
      comments: 95,
      shares: 67,
      isLiked: true,
    },
    {
      id: '5',
      user: {
        id: 'user5',
        name: 'Ex-Player Commentary',
        avatar: 'https://images.pexels.com/photos/1300402/pexels-photo-1300402.jpeg',
      },
      content: `Having played in matches like this, I can tell you the pressure is immense. Both ${homeTeamName} and ${awayTeamName} need to stay composed.`,
      timestamp: '15 minutes ago',
      likes: 278,
      comments: 134,
      shares: 89,
      isLiked: false,
    },
  ];

  const socialPosts = generateSocialPosts();

  const handleLikePost = (postId: string) => {
    // Handle like functionality
    console.log('Liked post:', postId);
  };

  const handleCommentPost = (postId: string) => {
    // Handle comment functionality
    console.log('Comment on post:', postId);
  };

  const handleSharePost = (postId: string) => {
    // Handle share functionality
    console.log('Share post:', postId);
  };

  const renderSocialPost = (post: SocialPost) => (
    <View key={post.id} style={[styles.postContainer, { backgroundColor: theme.colors.backgroundSecondary }]}>
      {/* User Header */}
      <View style={styles.postHeader}>
        <View style={styles.userInfo}>
          <Image source={{ uri: post.user.avatar }} style={styles.userAvatar} />
          <View style={styles.userDetails}>
            <View style={styles.userNameRow}>
              <Text style={[styles.userName, { color: theme.colors.text }]}>
                {post.user.name}
              </Text>
              {post.user.verified && (
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedIcon}>✓</Text>
                </View>
              )}
            </View>
            <Text style={[styles.postTimestamp, { color: theme.colors.textSecondary }]}>
              {post.timestamp}
            </Text>
          </View>
        </View>
      </View>

      {/* Post Content */}
      <Text style={[styles.postContent, { color: theme.colors.text }]}>
        {post.content}
      </Text>

      {/* Media */}
      {post.media && (
        <View style={styles.mediaContainer}>
          <Image source={{ uri: post.media.url }} style={styles.postImage} />
        </View>
      )}

      {/* Engagement Stats */}
      <View style={styles.engagementStats}>
        <Text style={[styles.statText, { color: theme.colors.textSecondary }]}>
          {post.likes} likes • {post.comments} comments • {post.shares} shares
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleLikePost(post.id)}
        >
          <ThumbsUp
            size={18}
            color={post.isLiked ? theme.colors.primary : theme.colors.textSecondary}
            fill={post.isLiked ? theme.colors.primary : 'transparent'}
          />
          <Text
            style={[
              styles.actionButtonText,
              {
                color: post.isLiked ? theme.colors.primary : theme.colors.textSecondary,
              },
            ]}
          >
            Like
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleCommentPost(post.id)}
        >
          <MessageCircle size={18} color={theme.colors.textSecondary} />
          <Text style={[styles.actionButtonText, { color: theme.colors.textSecondary }]}>
            Comment
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleSharePost(post.id)}
        >
          <Share size={18} color={theme.colors.textSecondary} />
          <Text style={[styles.actionButtonText, { color: theme.colors.textSecondary }]}>
            Share
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Hot Takes & Social Feed
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Live reactions from fans and analysts
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {socialPosts.map(renderSocialPost)}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  scrollView: {
    flex: 1,
  },
  postContainer: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  postHeader: {
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  verifiedBadge: {
    backgroundColor: '#1DA1F2',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  verifiedIcon: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  postTimestamp: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginTop: 2,
  },
  postContent: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: 'Inter-Regular',
    marginBottom: 12,
  },
  mediaContainer: {
    marginBottom: 12,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  engagementStats: {
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 8,
  },
  statText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  actionButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginLeft: 6,
  },
});
