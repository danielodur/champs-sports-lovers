import { supabase } from "./supabaseClient";
import { socialService } from "./socialService";
import type {
  SocialUser,
  SocialPost,
  PostComment,
  SocialInteraction,
  PostMedia,
} from "../types/match-details/match-details.ts";

export interface MatchSocialPost {
  id: string;
  match_id: string;
  user_id: string;
  content: string;
  media?: PostMedia[];
  category:
    | "match_discussion"
    | "prediction"
    | "analysis"
    | "celebration"
    | "complaint";
  likes_count: number;
  comments_count: number;
  shares_count: number;
  is_pinned: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  author?: SocialUser;
  user_liked?: boolean;
  user_shared?: boolean;
}

export interface MatchComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  parent_comment_id?: string;
  likes_count: number;
  replies_count: number;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  author?: SocialUser;
  user_liked?: boolean;
  replies?: MatchComment[];
}

export interface PostReaction {
  id: string;
  post_id: string;
  user_id: string;
  reaction_type:
    | "like"
    | "love"
    | "fire"
    | "trophy"
    | "laugh"
    | "angry"
    | "sad";
  created_at: string;
}

export interface UserInteraction {
  user_id: string;
  post_id?: string;
  comment_id?: string;
  interaction_type: "like" | "comment" | "share" | "react" | "report" | "block";
  metadata?: any;
  created_at: string;
}

export interface SocialPostFilter {
  category?: string;
  time_range?: "all" | "live" | "recent" | "popular";
  user_type?: "all" | "verified" | "following";
  sort_by?: "newest" | "popular" | "trending";
}

export interface TrendingTopic {
  id: string;
  topic: string;
  match_id: string;
  posts_count: number;
  engagement_score: number;
  category: string;
  created_at: string;
}

export interface MatchSocialStats {
  total_posts: number;
  total_comments: number;
  total_likes: number;
  total_shares: number;
  active_users: number;
  trending_topics: TrendingTopic[];
  top_contributors: SocialUser[];
}

export interface NotificationPreferences {
  user_id: string;
  match_posts: boolean;
  post_replies: boolean;
  post_likes: boolean;
  mentions: boolean;
  follow_activity: boolean;
  trending_topics: boolean;
}

class MatchDetailsSocialService {
  private currentUserId: string | null = null;
  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheExpiry = 2 * 60 * 1000; // 2 minutes for real-time social data

  constructor() {
    this.initializeService();
  }

  private async initializeService() {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      this.currentUserId = session?.user?.id || null;

      // Set up real-time subscriptions
      if (this.currentUserId) {
        this.setupRealtimeSubscriptions();
      }
    } catch (error) {
      console.error("❌ MATCH SOCIAL SERVICE: Initialization error:", error);
    }
  }

  private setupRealtimeSubscriptions() {
    // Subscribe to new posts in matches user is viewing
    supabase
      .channel("match-social-posts")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "match_social_posts" },
        (payload) => this.handleRealtimePostUpdate(payload),
      )
      .subscribe();

    // Subscribe to comments on posts user interacted with
    supabase
      .channel("match-social-comments")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "match_social_comments" },
        (payload) => this.handleRealtimeCommentUpdate(payload),
      )
      .subscribe();
  }

  private handleRealtimePostUpdate(payload: any) {
    console.log("🔄 MATCH SOCIAL SERVICE: Real-time post update:", payload);
    // Invalidate relevant cache entries
    this.invalidateCacheByPattern("posts_");
    this.invalidateCacheByPattern("stats_");
  }

  private handleRealtimeCommentUpdate(payload: any) {
    console.log("🔄 MATCH SOCIAL SERVICE: Real-time comment update:", payload);
    // Invalidate relevant cache entries
    this.invalidateCacheByPattern("comments_");
    this.invalidateCacheByPattern("posts_");
  }

  private getCachedData<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }
    return null;
  }

  private setCachedData(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  private invalidateCacheByPattern(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  private async getCurrentUserId(): Promise<string | null> {
    if (this.currentUserId) {
      return this.currentUserId;
    }

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      this.currentUserId = session?.user?.id || null;
      return this.currentUserId;
    } catch (error) {
      console.error("❌ Error getting current user:", error);
      return null;
    }
  }

  /**
   * Create a new social post for a match
   */
  async createPost(
    matchId: string,
    content: string,
    category: string = "match_discussion",
    media?: PostMedia[],
  ): Promise<{ success: boolean; post?: MatchSocialPost; error?: string }> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        return {
          success: false,
          error: "User must be logged in to create posts",
        };
      }

      if (!content.trim()) {
        return { success: false, error: "Post content cannot be empty" };
      }

      const postData = {
        match_id: matchId,
        user_id: userId,
        content: content.trim(),
        category,
        media: media || null,
        likes_count: 0,
        comments_count: 0,
        shares_count: 0,
        is_pinned: false,
        is_verified: false,
      };

      const { data, error } = await supabase
        .from("match_social_posts")
        .insert([postData])
        .select(
          `
          *,
          author:profiles!user_id(
            id, username, full_name, avatar_url,
            champs_username, level, total_points
          )
        `,
        )
        .single();

      if (error) {
        console.error("❌ MATCH SOCIAL SERVICE: Error creating post:", error);
        return { success: false, error: error.message };
      }

      // Transform data to match interface
      const post: MatchSocialPost = {
        ...data,
        author: data.author
          ? this.transformUserProfile(data.author)
          : undefined,
        user_liked: false,
        user_shared: false,
      };

      // Invalidate cache
      this.invalidateCacheByPattern("posts_");
      this.invalidateCacheByPattern("stats_");

      // Update trending topics
      this.updateTrendingTopics(matchId, content);

      console.log("✅ MATCH SOCIAL SERVICE: Post created successfully");
      return { success: true, post };
    } catch (error) {
      console.error("❌ MATCH SOCIAL SERVICE: Error creating post:", error);
      return { success: false, error: "Failed to create post" };
    }
  }

  /**
   * Get posts for a specific match with filtering and pagination
   */
  async getMatchPosts(
    matchId: string,
    filter: SocialPostFilter = {},
    page: number = 1,
    limit: number = 20,
  ): Promise<{ posts: MatchSocialPost[]; total: number; hasMore: boolean }> {
    try {
      const cacheKey = `posts_${matchId}_${JSON.stringify(filter)}_${page}_${limit}`;
      const cached = this.getCachedData<{
        posts: MatchSocialPost[];
        total: number;
        hasMore: boolean;
      }>(cacheKey);

      if (cached) {
        return cached;
      }

      const userId = await this.getCurrentUserId();
      let query = supabase
        .from("match_social_posts")
        .select(
          `
          *,
          author:profiles!user_id(
            id, username, full_name, avatar_url,
            champs_username, level, total_points
          ),
          user_reactions:post_reactions!post_id(reaction_type),
          user_shares:post_shares!post_id(user_id)
        `,
          { count: "exact" },
        )
        .eq("match_id", matchId);

      // Apply filters
      if (filter.category) {
        query = query.eq("category", filter.category);
      }

      if (filter.time_range) {
        const now = new Date();
        let timeFilter: Date;
        switch (filter.time_range) {
          case "live":
            timeFilter = new Date(now.getTime() - 30 * 60 * 1000); // Last 30 minutes
            break;
          case "recent":
            timeFilter = new Date(now.getTime() - 2 * 60 * 60 * 1000); // Last 2 hours
            break;
          case "popular":
            query = query.gte("likes_count", 10);
            break;
        }
        if (timeFilter!) {
          query = query.gte("created_at", timeFilter.toISOString());
        }
      }

      if (filter.user_type === "verified") {
        query = query.eq("is_verified", true);
      } else if (filter.user_type === "following" && userId) {
        // Get posts from users that current user follows
        const following = await socialService.getFollowing(1000);
        const followingIds = following.map((user) => user.id);
        if (followingIds.length > 0) {
          query = query.in("user_id", followingIds);
        }
      }

      // Apply sorting
      switch (filter.sort_by) {
        case "popular":
          query = query.order("likes_count", { ascending: false });
          break;
        case "trending":
          // Custom trending algorithm: likes + comments + recent activity
          query = query.order("created_at", { ascending: false }); // Fallback for now
          break;
        default:
          query = query.order("created_at", { ascending: false });
      }

      // Apply pagination
      const offset = (page - 1) * limit;
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        console.error("❌ MATCH SOCIAL SERVICE: Error fetching posts:", error);
        return { posts: [], total: 0, hasMore: false };
      }

      // Transform posts with user interaction data
      const posts: MatchSocialPost[] = (data || []).map((post) => ({
        ...post,
        author: post.author
          ? this.transformUserProfile(post.author)
          : undefined,
        user_liked: userId
          ? post.user_reactions?.some((r: any) => r.reaction_type === "like") ||
            false
          : false,
        user_shared: userId
          ? post.user_shares?.some((s: any) => s.user_id === userId) || false
          : false,
      }));

      const total = count || 0;
      const hasMore = offset + posts.length < total;

      const result = { posts, total, hasMore };
      this.setCachedData(cacheKey, result);

      console.log(
        `📊 MATCH SOCIAL SERVICE: Retrieved ${posts.length} posts for match ${matchId}`,
      );
      return result;
    } catch (error) {
      console.error("❌ MATCH SOCIAL SERVICE: Error fetching posts:", error);
      return { posts: [], total: 0, hasMore: false };
    }
  }

  /**
   * Like or unlike a post
   */
  async togglePostLike(
    postId: string,
  ): Promise<{ success: boolean; liked: boolean; likesCount: number }> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        return { success: false, liked: false, likesCount: 0 };
      }

      // Check if already liked
      const { data: existingLike } = await supabase
        .from("post_reactions")
        .select("id")
        .eq("post_id", postId)
        .eq("user_id", userId)
        .eq("reaction_type", "like")
        .single();

      let liked = false;
      let likesCount = 0;

      if (existingLike) {
        // Unlike the post
        await supabase
          .from("post_reactions")
          .delete()
          .eq("id", existingLike.id);

        // Decrease likes count
        // Get current likes count and decrement
        const { data: currentPost } = await supabase
          .from("match_social_posts")
          .select("likes_count")
          .eq("id", postId)
          .single();

        const newCount = Math.max(0, (currentPost?.likes_count || 0) - 1);
        const { data: updatedPost } = await supabase
          .from("match_social_posts")
          .update({ likes_count: newCount })
          .eq("id", postId)
          .select("likes_count")
          .single();

        likesCount = updatedPost?.likes_count || 0;
        liked = false;
      } else {
        // Like the post
        await supabase.from("post_reactions").insert([
          {
            post_id: postId,
            user_id: userId,
            reaction_type: "like",
          },
        ]);

        // Increase likes count
        // Get current likes count and increment
        const { data: currentPost } = await supabase
          .from("match_social_posts")
          .select("likes_count")
          .eq("id", postId)
          .single();

        const newCount = (currentPost?.likes_count || 0) + 1;
        const { data: updatedPost } = await supabase
          .from("match_social_posts")
          .update({ likes_count: newCount })
          .eq("id", postId)
          .select("likes_count")
          .single();

        likesCount = updatedPost?.likes_count || 0;
        liked = true;
      }

      // Invalidate cache
      this.invalidateCacheByPattern("posts_");

      console.log(
        `✅ MATCH SOCIAL SERVICE: Post ${liked ? "liked" : "unliked"}`,
      );
      return { success: true, liked, likesCount };
    } catch (error) {
      console.error(
        "❌ MATCH SOCIAL SERVICE: Error toggling post like:",
        error,
      );
      return { success: false, liked: false, likesCount: 0 };
    }
  }

  /**
   * Share a post
   */
  async sharePost(
    postId: string,
    message?: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        return {
          success: false,
          error: "User must be logged in to share posts",
        };
      }

      // Check if already shared
      const { data: existingShare } = await supabase
        .from("post_shares")
        .select("id")
        .eq("post_id", postId)
        .eq("user_id", userId)
        .single();

      if (existingShare) {
        return { success: false, error: "Post already shared" };
      }

      // Create share record
      await supabase.from("post_shares").insert([
        {
          post_id: postId,
          user_id: userId,
          message: message || null,
        },
      ]);

      // Increase shares count
      // Get current shares count and increment
      const { data: currentPost } = await supabase
        .from("match_social_posts")
        .select("shares_count")
        .eq("id", postId)
        .single();

      const newCount = (currentPost?.shares_count || 0) + 1;
      await supabase
        .from("match_social_posts")
        .update({ shares_count: newCount })
        .eq("id", postId);

      // Invalidate cache
      this.invalidateCacheByPattern("posts_");

      console.log("✅ MATCH SOCIAL SERVICE: Post shared successfully");
      return { success: true };
    } catch (error) {
      console.error("❌ MATCH SOCIAL SERVICE: Error sharing post:", error);
      return { success: false, error: "Failed to share post" };
    }
  }

  /**
   * Add a comment to a post
   */
  async addComment(
    postId: string,
    content: string,
    parentCommentId?: string,
  ): Promise<{ success: boolean; comment?: MatchComment; error?: string }> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        return { success: false, error: "User must be logged in to comment" };
      }

      if (!content.trim()) {
        return { success: false, error: "Comment content cannot be empty" };
      }

      const commentData = {
        post_id: postId,
        user_id: userId,
        content: content.trim(),
        parent_comment_id: parentCommentId || null,
        likes_count: 0,
        replies_count: 0,
        is_pinned: false,
      };

      const { data, error } = await supabase
        .from("match_social_comments")
        .insert([commentData])
        .select(
          `
          *,
          author:profiles!user_id(
            id, username, full_name, avatar_url,
            champs_username, level, total_points
          )
        `,
        )
        .single();

      if (error) {
        console.error("❌ MATCH SOCIAL SERVICE: Error adding comment:", error);
        return { success: false, error: error.message };
      }

      // Update post comments count
      // Get current comments count and increment
      const { data: currentPost } = await supabase
        .from("match_social_posts")
        .select("comments_count")
        .eq("id", postId)
        .single();

      const newCount = (currentPost?.comments_count || 0) + 1;
      await supabase
        .from("match_social_posts")
        .update({ comments_count: newCount })
        .eq("id", postId);

      // If this is a reply, update parent comment replies count
      if (parentCommentId) {
        // Get current replies count and increment
        const { data: currentComment } = await supabase
          .from("match_social_comments")
          .select("replies_count")
          .eq("id", parentCommentId)
          .single();

        const newCount = (currentComment?.replies_count || 0) + 1;
        await supabase
          .from("match_social_comments")
          .update({ replies_count: newCount })
          .eq("id", parentCommentId);
      }

      const comment: MatchComment = {
        ...data,
        author: data.author
          ? this.transformUserProfile(data.author)
          : undefined,
        user_liked: false,
        replies: [],
      };

      // Invalidate cache
      this.invalidateCacheByPattern("comments_");
      this.invalidateCacheByPattern("posts_");

      console.log("✅ MATCH SOCIAL SERVICE: Comment added successfully");
      return { success: true, comment };
    } catch (error) {
      console.error("❌ MATCH SOCIAL SERVICE: Error adding comment:", error);
      return { success: false, error: "Failed to add comment" };
    }
  }

  /**
   * Get comments for a post
   */
  async getPostComments(
    postId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ comments: MatchComment[]; total: number; hasMore: boolean }> {
    try {
      const cacheKey = `comments_${postId}_${page}_${limit}`;
      const cached = this.getCachedData<{
        comments: MatchComment[];
        total: number;
        hasMore: boolean;
      }>(cacheKey);

      if (cached) {
        return cached;
      }

      const userId = await this.getCurrentUserId();
      const offset = (page - 1) * limit;

      const { data, error, count } = await supabase
        .from("match_social_comments")
        .select(
          `
          *,
          author:profiles!user_id(
            id, username, full_name, avatar_url,
            champs_username, level, total_points
          ),
          user_likes:comment_likes!comment_id(user_id),
          replies:match_social_comments!parent_comment_id(
            *,
            author:profiles!user_id(
              id, username, full_name, avatar_url,
              champs_username, level, total_points
            )
          )
        `,
          { count: "exact" },
        )
        .eq("post_id", postId)
        .is("parent_comment_id", null)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error(
          "❌ MATCH SOCIAL SERVICE: Error fetching comments:",
          error,
        );
        return { comments: [], total: 0, hasMore: false };
      }

      const comments: MatchComment[] = (data || []).map((comment) => ({
        ...comment,
        author: comment.author
          ? this.transformUserProfile(comment.author)
          : undefined,
        user_liked: userId
          ? comment.user_likes?.some((l: any) => l.user_id === userId) || false
          : false,
        replies: (comment.replies || []).map((reply: any) => ({
          ...reply,
          author: reply.author
            ? this.transformUserProfile(reply.author)
            : undefined,
          user_liked: false,
          replies: [],
        })),
      }));

      const total = count || 0;
      const hasMore = offset + comments.length < total;

      const result = { comments, total, hasMore };
      this.setCachedData(cacheKey, result);

      console.log(
        `📊 MATCH SOCIAL SERVICE: Retrieved ${comments.length} comments for post ${postId}`,
      );
      return result;
    } catch (error) {
      console.error("❌ MATCH SOCIAL SERVICE: Error fetching comments:", error);
      return { comments: [], total: 0, hasMore: false };
    }
  }

  /**
   * Like or unlike a comment
   */
  async toggleCommentLike(
    commentId: string,
  ): Promise<{ success: boolean; liked: boolean; likesCount: number }> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        return { success: false, liked: false, likesCount: 0 };
      }

      // Check if already liked
      const { data: existingLike } = await supabase
        .from("comment_likes")
        .select("id")
        .eq("comment_id", commentId)
        .eq("user_id", userId)
        .single();

      let liked = false;
      let likesCount = 0;

      if (existingLike) {
        // Unlike the comment
        await supabase.from("comment_likes").delete().eq("id", existingLike.id);

        // Decrease likes count
        // Get current likes count and decrement
        const { data: currentComment } = await supabase
          .from("match_social_comments")
          .select("likes_count")
          .eq("id", commentId)
          .single();

        const newCount = Math.max(0, (currentComment?.likes_count || 0) - 1);
        const { data: updatedComment } = await supabase
          .from("match_social_comments")
          .update({ likes_count: newCount })
          .eq("id", commentId)
          .select("likes_count")
          .single();

        likesCount = updatedComment?.likes_count || 0;
        liked = false;
      } else {
        // Like the comment
        await supabase.from("comment_likes").insert([
          {
            comment_id: commentId,
            user_id: userId,
          },
        ]);

        // Increase likes count
        // Get current likes count and increment
        const { data: currentComment } = await supabase
          .from("match_social_comments")
          .select("likes_count")
          .eq("id", commentId)
          .single();

        const newCount = (currentComment?.likes_count || 0) + 1;
        const { data: updatedComment } = await supabase
          .from("match_social_comments")
          .update({ likes_count: newCount })
          .eq("id", commentId)
          .select("likes_count")
          .single();

        likesCount = updatedComment?.likes_count || 0;
        liked = true;
      }

      // Invalidate cache
      this.invalidateCacheByPattern("comments_");

      console.log(
        `✅ MATCH SOCIAL SERVICE: Comment ${liked ? "liked" : "unliked"}`,
      );
      return { success: true, liked, likesCount };
    } catch (error) {
      console.error(
        "❌ MATCH SOCIAL SERVICE: Error toggling comment like:",
        error,
      );
      return { success: false, liked: false, likesCount: 0 };
    }
  }

  /**
   * Get social statistics for a match
   */
  async getMatchSocialStats(matchId: string): Promise<MatchSocialStats> {
    try {
      const cacheKey = `stats_${matchId}`;
      const cached = this.getCachedData<MatchSocialStats>(cacheKey);

      if (cached) {
        return cached;
      }

      // Get basic stats
      const [postsResult, commentsResult, likesResult, sharesResult] =
        await Promise.all([
          supabase
            .from("match_social_posts")
            .select("id", { count: "exact" })
            .eq("match_id", matchId),
          supabase
            .from("match_social_comments")
            .select("id", { count: "exact" }),
          supabase.from("post_reactions").select("id", { count: "exact" }),
          supabase.from("post_shares").select("id", { count: "exact" }),
        ]);

      // Get trending topics
      const trendingTopics = await this.getTrendingTopics(matchId);

      // Get top contributors
      const topContributors = await this.getTopContributors(matchId);

      // Get active users count (users who posted/commented in last hour)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const { count: activeUsers } = await supabase
        .from("match_social_posts")
        .select("user_id", { count: "exact" })
        .eq("match_id", matchId)
        .gte("created_at", oneHourAgo.toISOString());

      const stats: MatchSocialStats = {
        total_posts: postsResult.count || 0,
        total_comments: commentsResult.count || 0,
        total_likes: likesResult.count || 0,
        total_shares: sharesResult.count || 0,
        active_users: activeUsers || 0,
        trending_topics: trendingTopics,
        top_contributors: topContributors,
      };

      this.setCachedData(cacheKey, stats);

      console.log(
        "📊 MATCH SOCIAL SERVICE: Retrieved social stats for match:",
        matchId,
      );
      return stats;
    } catch (error) {
      console.error(
        "❌ MATCH SOCIAL SERVICE: Error fetching social stats:",
        error,
      );
      return {
        total_posts: 0,
        total_comments: 0,
        total_likes: 0,
        total_shares: 0,
        active_users: 0,
        trending_topics: [],
        top_contributors: [],
      };
    }
  }

  /**
   * Get trending topics for a match
   */
  private async getTrendingTopics(matchId: string): Promise<TrendingTopic[]> {
    try {
      const { data, error } = await supabase
        .from("trending_topics")
        .select("*")
        .eq("match_id", matchId)
        .order("engagement_score", { ascending: false })
        .limit(10);

      if (error) {
        console.error("❌ Error fetching trending topics:", error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error("❌ Error fetching trending topics:", error);
      return [];
    }
  }

  /**
   * Get top contributors for a match
   */
  private async getTopContributors(matchId: string): Promise<SocialUser[]> {
    try {
      const { data, error } = await supabase.rpc("get_match_top_contributors", {
        match_id: matchId,
        limit_count: 10,
      });

      if (error) {
        console.error("❌ Error fetching top contributors:", error);
        return [];
      }

      return (data || []).map((user: any) => this.transformUserProfile(user));
    } catch (error) {
      console.error("❌ Error fetching top contributors:", error);
      return [];
    }
  }

  /**
   * Update trending topics based on post content
   */
  private async updateTrendingTopics(matchId: string, content: string) {
    try {
      // Extract hashtags and keywords
      const hashtags = content.match(/#\w+/g) || [];
      const keywords = this.extractKeywords(content);

      for (const topic of [...hashtags, ...keywords]) {
        await supabase.rpc("update_trending_topic", {
          topic_name: topic,
          match_id: matchId,
          category: (hashtags as string[]).includes(topic)
            ? "hashtag"
            : "keyword",
        });
      }
    } catch (error) {
      console.error("❌ Error updating trending topics:", error);
    }
  }

  /**
   * Extract keywords from content
   */
  private extractKeywords(content: string): string[] {
    const commonKeywords = [
      "goal",
      "penalty",
      "red card",
      "yellow card",
      "offside",
      "corner",
      "free kick",
      "substitution",
      "injury",
      "foul",
      "save",
      "miss",
      "amazing",
      "terrible",
      "brilliant",
      "unlucky",
      "referee",
      "VAR",
    ];

    const words = content.toLowerCase().split(/\s+/);
    return commonKeywords.filter((keyword) =>
      words.some((word) => word.includes(keyword)),
    );
  }

  /**
   * Transform user profile to SocialUser interface
   */
  private transformUserProfile(profile: any): SocialUser {
    return {
      id: profile.id,
      username: profile.username || profile.champs_username || "user",
      displayName: profile.full_name || profile.username || "Unknown User",
      avatar: profile.avatar_url || "https://via.placeholder.com/100",
      level: profile.level || 1,
      isVerified: profile.is_verified || false,
      badges: profile.badges || [],
      followerCount: profile.followers_count || 0,
      followingCount: profile.following_count || 0,
      totalLikes: profile.total_likes || 0,
      joinDate: profile.created_at || new Date().toISOString(),
    };
  }

  /**
   * Report inappropriate content
   */
  async reportContent(
    contentId: string,
    contentType: "post" | "comment",
    reason: string,
    details?: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        return {
          success: false,
          error: "User must be logged in to report content",
        };
      }

      await supabase.from("content_reports").insert([
        {
          reporter_id: userId,
          content_id: contentId,
          content_type: contentType,
          reason,
          details: details || null,
        },
      ]);

      console.log("✅ MATCH SOCIAL SERVICE: Content reported successfully");
      return { success: true };
    } catch (error) {
      console.error("❌ MATCH SOCIAL SERVICE: Error reporting content:", error);
      return { success: false, error: "Failed to report content" };
    }
  }

  /**
   * Block a user
   */
  async blockUser(
    userIdToBlock: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        return {
          success: false,
          error: "User must be logged in to block users",
        };
      }

      if (userId === userIdToBlock) {
        return { success: false, error: "Cannot block yourself" };
      }

      await supabase.from("user_blocks").insert([
        {
          blocker_id: userId,
          blocked_id: userIdToBlock,
        },
      ]);

      // Invalidate cache
      this.invalidateCacheByPattern("posts_");

      console.log("✅ MATCH SOCIAL SERVICE: User blocked successfully");
      return { success: true };
    } catch (error) {
      console.error("❌ MATCH SOCIAL SERVICE: Error blocking user:", error);
      return { success: false, error: "Failed to block user" };
    }
  }

  /**
   * Get user's notification preferences
   */
  async getNotificationPreferences(
    userId?: string,
  ): Promise<NotificationPreferences | null> {
    try {
      const targetUserId = userId || (await this.getCurrentUserId());
      if (!targetUserId) {
        return null;
      }

      const { data, error } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", targetUserId)
        .single();

      if (error) {
        // Return default preferences if none exist
        return {
          user_id: targetUserId,
          match_posts: true,
          post_replies: true,
          post_likes: true,
          mentions: true,
          follow_activity: true,
          trending_topics: false,
        };
      }

      return data;
    } catch (error) {
      console.error(
        "❌ MATCH SOCIAL SERVICE: Error fetching notification preferences:",
        error,
      );
      return null;
    }
  }

  /**
   * Update user's notification preferences
   */
  async updateNotificationPreferences(
    preferences: Partial<NotificationPreferences>,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        return {
          success: false,
          error: "User must be logged in to update preferences",
        };
      }

      const { error } = await supabase.from("notification_preferences").upsert([
        {
          user_id: userId,
          ...preferences,
        },
      ]);

      if (error) {
        console.error(
          "❌ MATCH SOCIAL SERVICE: Error updating preferences:",
          error,
        );
        return { success: false, error: error.message };
      }

      console.log("✅ MATCH SOCIAL SERVICE: Notification preferences updated");
      return { success: true };
    } catch (error) {
      console.error(
        "❌ MATCH SOCIAL SERVICE: Error updating preferences:",
        error,
      );
      return { success: false, error: "Failed to update preferences" };
    }
  }

  /**
   * Search posts within a match
   */
  async searchMatchPosts(
    matchId: string,
    query: string,
    limit: number = 20,
  ): Promise<MatchSocialPost[]> {
    try {
      if (!query.trim()) {
        return [];
      }

      const { data, error } = await supabase
        .from("match_social_posts")
        .select(
          `
          *,
          author:profiles!user_id(
            id, username, full_name, avatar_url,
            champs_username, level, total_points
          )
        `,
        )
        .eq("match_id", matchId)
        .textSearch("content", query)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        console.error("❌ MATCH SOCIAL SERVICE: Error searching posts:", error);
        return [];
      }

      const userId = await this.getCurrentUserId();
      return (data || []).map((post) => ({
        ...post,
        author: post.author
          ? this.transformUserProfile(post.author)
          : undefined,
        user_liked: false, // Would need additional query for user interactions
        user_shared: false,
      }));
    } catch (error) {
      console.error("❌ MATCH SOCIAL SERVICE: Error searching posts:", error);
      return [];
    }
  }

  /**
   * Get user's social activity feed
   */
  async getUserActivityFeed(
    userId?: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    posts: MatchSocialPost[];
    comments: MatchComment[];
    total: number;
  }> {
    try {
      const targetUserId = userId || (await this.getCurrentUserId());
      if (!targetUserId) {
        return { posts: [], comments: [], total: 0 };
      }

      const offset = (page - 1) * limit;

      // Get user's posts
      const { data: postsData } = await supabase
        .from("match_social_posts")
        .select(
          `
          *,
          author:profiles!user_id(
            id, username, full_name, avatar_url,
            champs_username, level, total_points
          )
        `,
        )
        .eq("user_id", targetUserId)
        .order("created_at", { ascending: false })
        .limit(limit);

      // Get user's comments
      const { data: commentsData } = await supabase
        .from("match_social_comments")
        .select(
          `
          *,
          author:profiles!user_id(
            id, username, full_name, avatar_url,
            champs_username, level, total_points
          ),
          post:match_social_posts!post_id(id, content)
        `,
        )
        .eq("user_id", targetUserId)
        .order("created_at", { ascending: false })
        .limit(limit);

      const posts: MatchSocialPost[] = (postsData || []).map((post) => ({
        ...post,
        author: post.author
          ? this.transformUserProfile(post.author)
          : undefined,
        user_liked: false,
        user_shared: false,
      }));

      const comments: MatchComment[] = (commentsData || []).map((comment) => ({
        ...comment,
        author: comment.author
          ? this.transformUserProfile(comment.author)
          : undefined,
        user_liked: false,
        replies: [],
      }));

      console.log(
        `📊 MATCH SOCIAL SERVICE: Retrieved activity feed for user ${targetUserId}`,
      );
      return { posts, comments, total: posts.length + comments.length };
    } catch (error) {
      console.error(
        "❌ MATCH SOCIAL SERVICE: Error fetching activity feed:",
        error,
      );
      return { posts: [], comments: [], total: 0 };
    }
  }

  /**
   * Delete a post
   */
  async deletePost(
    postId: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        return {
          success: false,
          error: "User must be logged in to delete posts",
        };
      }

      // Check if user owns the post
      const { data: post } = await supabase
        .from("match_social_posts")
        .select("user_id")
        .eq("id", postId)
        .single();

      if (!post || post.user_id !== userId) {
        return { success: false, error: "You can only delete your own posts" };
      }

      const { error } = await supabase
        .from("match_social_posts")
        .delete()
        .eq("id", postId);

      if (error) {
        console.error("❌ MATCH SOCIAL SERVICE: Error deleting post:", error);
        return { success: false, error: error.message };
      }

      // Invalidate cache
      this.invalidateCacheByPattern("posts_");
      this.invalidateCacheByPattern("stats_");

      console.log("✅ MATCH SOCIAL SERVICE: Post deleted successfully");
      return { success: true };
    } catch (error) {
      console.error("❌ MATCH SOCIAL SERVICE: Error deleting post:", error);
      return { success: false, error: "Failed to delete post" };
    }
  }

  /**
   * Delete a comment
   */
  async deleteComment(
    commentId: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        return {
          success: false,
          error: "User must be logged in to delete comments",
        };
      }

      // Check if user owns the comment
      const { data: comment } = await supabase
        .from("match_social_comments")
        .select("user_id, post_id, parent_comment_id")
        .eq("id", commentId)
        .single();

      if (!comment || comment.user_id !== userId) {
        return {
          success: false,
          error: "You can only delete your own comments",
        };
      }

      const { error } = await supabase
        .from("match_social_comments")
        .delete()
        .eq("id", commentId);

      if (error) {
        console.error(
          "❌ MATCH SOCIAL SERVICE: Error deleting comment:",
          error,
        );
        return { success: false, error: error.message };
      }

      // Update post comments count
      // Get current comments count and decrement
      const { data: currentPost } = await supabase
        .from("match_social_posts")
        .select("comments_count")
        .eq("id", comment.post_id)
        .single();

      const newCount = Math.max(0, (currentPost?.comments_count || 0) - 1);
      await supabase
        .from("match_social_posts")
        .update({ comments_count: newCount })
        .eq("id", comment.post_id);

      // If this was a reply, update parent comment replies count
      if (comment.parent_comment_id) {
        // Get current replies count and decrement
        const { data: currentComment } = await supabase
          .from("match_social_comments")
          .select("replies_count")
          .eq("id", comment.parent_comment_id)
          .single();

        const newCount = Math.max(0, (currentComment?.replies_count || 0) - 1);
        await supabase
          .from("match_social_comments")
          .update({ replies_count: newCount })
          .eq("id", comment.parent_comment_id);
      }

      // Invalidate cache
      this.invalidateCacheByPattern("comments_");
      this.invalidateCacheByPattern("posts_");

      console.log("✅ MATCH SOCIAL SERVICE: Comment deleted successfully");
      return { success: true };
    } catch (error) {
      console.error("❌ MATCH SOCIAL SERVICE: Error deleting comment:", error);
      return { success: false, error: "Failed to delete comment" };
    }
  }

  /**
   * Pin/unpin a post (admin/moderator feature)
   */
  async togglePostPin(
    postId: string,
  ): Promise<{ success: boolean; pinned: boolean; error?: string }> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        return {
          success: false,
          pinned: false,
          error: "User must be logged in",
        };
      }

      // Check if user has moderator permissions
      const { data: userProfile } = await supabase
        .from("profiles")
        .select("is_moderator, is_admin")
        .eq("id", userId)
        .single();

      if (
        !userProfile ||
        (!userProfile.is_moderator && !userProfile.is_admin)
      ) {
        return {
          success: false,
          pinned: false,
          error: "Insufficient permissions",
        };
      }

      // Get current pin status
      const { data: post } = await supabase
        .from("match_social_posts")
        .select("is_pinned")
        .eq("id", postId)
        .single();

      if (!post) {
        return { success: false, pinned: false, error: "Post not found" };
      }

      const newPinnedState = !post.is_pinned;

      const { error } = await supabase
        .from("match_social_posts")
        .update({ is_pinned: newPinnedState })
        .eq("id", postId);

      if (error) {
        console.error("❌ MATCH SOCIAL SERVICE: Error toggling pin:", error);
        return { success: false, pinned: false, error: error.message };
      }

      // Invalidate cache
      this.invalidateCacheByPattern("posts_");

      console.log(
        `✅ MATCH SOCIAL SERVICE: Post ${newPinnedState ? "pinned" : "unpinned"}`,
      );
      return { success: true, pinned: newPinnedState };
    } catch (error) {
      console.error("❌ MATCH SOCIAL SERVICE: Error toggling pin:", error);
      return { success: false, pinned: false, error: "Failed to toggle pin" };
    }
  }

  /**
   * Get real-time post count for a match
   */
  async getRealTimePostCount(matchId: string): Promise<number> {
    try {
      const { count } = await supabase
        .from("match_social_posts")
        .select("*", { count: "exact", head: true })
        .eq("match_id", matchId);

      return count || 0;
    } catch (error) {
      console.error(
        "❌ MATCH SOCIAL SERVICE: Error getting post count:",
        error,
      );
      return 0;
    }
  }

  /**
   * Cleanup expired cache entries
   */
  private cleanupCache() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.cacheExpiry) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Dispose of service resources
   */
  dispose() {
    // Cleanup cache
    this.cache.clear();

    // Unsubscribe from real-time channels
    supabase.removeAllChannels();

    console.log("🧹 MATCH SOCIAL SERVICE: Service disposed");
  }
}

// Export singleton instance
export const matchDetailsSocialService = new MatchDetailsSocialService();
export default matchDetailsSocialService;

// Types are already exported above as interfaces
// No need to re-export them here
