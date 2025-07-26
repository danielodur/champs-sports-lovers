import { supabase } from './supabaseClient';

interface UserFollow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

interface UserProfile {
  id: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  champs_username?: string;
  level?: number;
  total_points?: number;
}

interface FollowStats {
  following_count: number;
  followers_count: number;
}

class SocialService {
  private currentUserId: string | null = null;

  /**
   * Set current user ID
   */
  setCurrentUser(userId: string | null) {
    this.currentUserId = userId;
    console.log('👥 SOCIAL SERVICE: User set to:', userId || 'none');
  }

  /**
   * Get current user ID from auth session
   */
  private async getCurrentUserId(): Promise<string | null> {
    if (this.currentUserId) {
      return this.currentUserId;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      this.currentUserId = session?.user?.id || null;
      return this.currentUserId;
    } catch (error) {
      console.error('❌ Error getting current user:', error);
      return null;
    }
  }

  /**
   * Follow a user
   */
  async followUser(userIdToFollow: string): Promise<{ success: boolean; error?: string }> {
    try {
      const currentUserId = await this.getCurrentUserId();
      if (!currentUserId) {
        return { success: false, error: 'User must be logged in to follow others' };
      }

      if (currentUserId === userIdToFollow) {
        return { success: false, error: 'Cannot follow yourself' };
      }

      // Check if already following
      const isAlreadyFollowing = await this.isFollowing(userIdToFollow);
      if (isAlreadyFollowing) {
        return { success: false, error: 'Already following this user' };
      }

      const { error } = await supabase
        .from('user_follows')
        .insert([{
          follower_id: currentUserId,
          following_id: userIdToFollow,
        }]);

      if (error) {
        console.error('❌ SOCIAL SERVICE: Error following user:', error);
        return { success: false, error: error.message };
      }

      console.log(`✅ SOCIAL SERVICE: Successfully followed user ${userIdToFollow}`);
      return { success: true };
    } catch (error) {
      console.error('❌ SOCIAL SERVICE: Error following user:', error);
      return { success: false, error: 'Failed to follow user' };
    }
  }

  /**
   * Unfollow a user
   */
  async unfollowUser(userIdToUnfollow: string): Promise<{ success: boolean; error?: string }> {
    try {
      const currentUserId = await this.getCurrentUserId();
      if (!currentUserId) {
        return { success: false, error: 'User must be logged in to unfollow others' };
      }

      const { error } = await supabase
        .from('user_follows')
        .delete()
        .eq('follower_id', currentUserId)
        .eq('following_id', userIdToUnfollow);

      if (error) {
        console.error('❌ SOCIAL SERVICE: Error unfollowing user:', error);
        return { success: false, error: error.message };
      }

      console.log(`✅ SOCIAL SERVICE: Successfully unfollowed user ${userIdToUnfollow}`);
      return { success: true };
    } catch (error) {
      console.error('❌ SOCIAL SERVICE: Error unfollowing user:', error);
      return { success: false, error: 'Failed to unfollow user' };
    }
  }

  /**
   * Check if current user is following another user
   */
  async isFollowing(userId: string): Promise<boolean> {
    try {
      const currentUserId = await this.getCurrentUserId();
      if (!currentUserId) {
        return false;
      }

      const { data, error } = await supabase
        .from('user_follows')
        .select('id')
        .eq('follower_id', currentUserId)
        .eq('following_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
        console.error('❌ SOCIAL SERVICE: Error checking follow status:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('❌ SOCIAL SERVICE: Error checking follow status:', error);
      return false;
    }
  }

  /**
   * Get users that current user is following
   */
  async getFollowing(limit: number = 50): Promise<UserProfile[]> {
    try {
      const currentUserId = await this.getCurrentUserId();
      if (!currentUserId) {
        console.log('⚠️ SOCIAL SERVICE: No authenticated user');
        return [];
      }

      const { data, error } = await supabase
        .from('user_follows')
        .select(`
          following_id,
          created_at,
          following:profiles!following_id (
            id,
            username,
            full_name,
            avatar_url,
            champs_username,
            level,
            total_points
          )
        `)
        .eq('follower_id', currentUserId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('❌ SOCIAL SERVICE: Error fetching following:', error);
        return [];
      }

      const following = (data || []).map((item: any) => item.following).filter(Boolean);
      console.log(`📊 SOCIAL SERVICE: Retrieved ${following.length} following`);
      return following;
    } catch (error) {
      console.error('❌ SOCIAL SERVICE: Error fetching following:', error);
      return [];
    }
  }

  /**
   * Get users that follow the current user (fans)
   */
  async getFollowers(limit: number = 50): Promise<UserProfile[]> {
    try {
      const currentUserId = await this.getCurrentUserId();
      if (!currentUserId) {
        console.log('⚠️ SOCIAL SERVICE: No authenticated user');
        return [];
      }

      const { data, error } = await supabase
        .from('user_follows')
        .select(`
          follower_id,
          created_at,
          follower:profiles!follower_id (
            id,
            username,
            full_name,
            avatar_url,
            champs_username,
            level,
            total_points
          )
        `)
        .eq('following_id', currentUserId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('❌ SOCIAL SERVICE: Error fetching followers:', error);
        return [];
      }

      const followers = (data || []).map((item: any) => item.follower).filter(Boolean);
      console.log(`📊 SOCIAL SERVICE: Retrieved ${followers.length} followers`);
      return followers;
    } catch (error) {
      console.error('❌ SOCIAL SERVICE: Error fetching followers:', error);
      return [];
    }
  }

  /**
   * Get follow statistics for current user
   */
  async getFollowStats(): Promise<FollowStats> {
    try {
      const currentUserId = await this.getCurrentUserId();
      if (!currentUserId) {
        return { following_count: 0, followers_count: 0 };
      }

      // Get following count
      const { count: followingCount, error: followingError } = await supabase
        .from('user_follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', currentUserId);

      // Get followers count
      const { count: followersCount, error: followersError } = await supabase
        .from('user_follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', currentUserId);

      if (followingError || followersError) {
        console.error('❌ SOCIAL SERVICE: Error fetching follow stats:', followingError || followersError);
        return { following_count: 0, followers_count: 0 };
      }

      const stats = {
        following_count: followingCount || 0,
        followers_count: followersCount || 0,
      };

      console.log(`📊 SOCIAL SERVICE: Follow stats - Following: ${stats.following_count}, Followers: ${stats.followers_count}`);
      return stats;
    } catch (error) {
      console.error('❌ SOCIAL SERVICE: Error fetching follow stats:', error);
      return { following_count: 0, followers_count: 0 };
    }
  }

  /**
   * Search users by username or name
   */
  async searchUsers(query: string, limit: number = 20): Promise<UserProfile[]> {
    try {
      if (!query.trim()) {
        return [];
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, champs_username, level, total_points')
        .or(`username.ilike.%${query}%,full_name.ilike.%${query}%,champs_username.ilike.%${query}%`)
        .limit(limit);

      if (error) {
        console.error('❌ SOCIAL SERVICE: Error searching users:', error);
        return [];
      }

      console.log(`🔍 SOCIAL SERVICE: Found ${data?.length || 0} users for query: "${query}"`);
      return data || [];
    } catch (error) {
      console.error('❌ SOCIAL SERVICE: Error searching users:', error);
      return [];
    }
  }

  /**
   * Get suggested users to follow (users with most followers, excluding current following)
   */
  async getSuggestedUsers(limit: number = 10): Promise<UserProfile[]> {
    try {
      const currentUserId = await this.getCurrentUserId();
      if (!currentUserId) {
        return [];
      }

      // Get users that current user is not following
      const { data, error } = await supabase
        .rpc('get_suggested_users', {
          current_user_id: currentUserId,
          limit_count: limit
        });

      if (error) {
        console.error('❌ SOCIAL SERVICE: Error fetching suggested users:', error);
        // Fallback to simple query
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url, champs_username, level, total_points')
          .neq('id', currentUserId)
          .order('total_points', { ascending: false })
          .limit(limit);

        return fallbackData || [];
      }

      console.log(`💡 SOCIAL SERVICE: Found ${data?.length || 0} suggested users`);
      return data || [];
    } catch (error) {
      console.error('❌ SOCIAL SERVICE: Error fetching suggested users:', error);
      return [];
    }
  }

  /**
   * Get user profile by ID
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, champs_username, level, total_points')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('❌ SOCIAL SERVICE: Error fetching user profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('❌ SOCIAL SERVICE: Error fetching user profile:', error);
      return null;
    }
  }
}

// Export singleton instance
export const socialService = new SocialService();
export default socialService;
export type { UserProfile, FollowStats }; 