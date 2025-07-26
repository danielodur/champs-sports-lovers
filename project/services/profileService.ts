import { supabase } from './supabaseClient';
import { UserProfile } from './authService';

export interface ProfileUpdateData {
  username?: string;
  full_name?: string;
  avatar_url?: string;
  phone?: string;
  email?: string;
  date_of_birth?: string;
  gender?: string;
  location?: string;
  bio?: string;
  champs_username?: string;
  real_name?: string;
  quote?: string;
  profile_picture?: string;
  champs_id?: string;
}

class ProfileService {
  
  /**
   * Get user profile by ID
   */
  async getProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('❌ Error fetching profile:', error);
        return null;
      }

      return data as UserProfile;
    } catch (error) {
      console.error('❌ Error fetching profile:', error);
      return null;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updates: ProfileUpdateData): Promise<{ error?: any }> {
    try {
      console.log('👤 Updating profile for user:', userId, 'with data:', updates);
      
      const { error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) {
        console.error('❌ Profile update error:', error);
        return { error };
      }

      console.log('✅ Profile updated successfully');
      return {};
    } catch (error) {
      console.error('❌ Profile update error:', error);
      return { error };
    }
  }

  /**
   * Create or update profile picture
   */
  async updateProfilePicture(userId: string, imageUrl: string): Promise<{ error?: any }> {
    return this.updateProfile(userId, {
      profile_picture: imageUrl,
      avatar_url: imageUrl, // Update both fields for consistency
    });
  }

  /**
   * Get profile by username
   */
  async getProfileByUsername(username: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`username.eq.${username},champs_username.eq.${username}`)
        .single();

      if (error) {
        console.error('❌ Error fetching profile by username:', error);
        return null;
      }

      return data as UserProfile;
    } catch (error) {
      console.error('❌ Error fetching profile by username:', error);
      return null;
    }
  }

  /**
   * Check if username is available
   */
  async isUsernameAvailable(username: string, excludeUserId?: string): Promise<boolean> {
    try {
      let query = supabase
        .from('profiles')
        .select('id')
        .or(`username.eq.${username},champs_username.eq.${username}`);

      if (excludeUserId) {
        query = query.neq('id', excludeUserId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Error checking username availability:', error);
        return false;
      }

      return data.length === 0;
    } catch (error) {
      console.error('❌ Error checking username availability:', error);
      return false;
    }
  }

  /**
   * Get user stats (following, fans, etc.)
   */
  async getUserStats(userId: string): Promise<{
    following: number;
    fans: number;
    messages: number;
    posts: number;
  }> {
    try {
      // Get following count
      const { count: followingCount } = await supabase
        .from('user_follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', userId);

      // Get fans count (people following this user)
      const { count: fansCount } = await supabase
        .from('user_follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', userId);

      // Get unread messages count
      const { count: messagesCount } = await supabase
        .from('user_messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', userId)
        .eq('is_read', false);

      return {
        following: followingCount || 0,
        fans: fansCount || 0,
        messages: messagesCount || 0,
        posts: 0, // TODO: Implement posts/content system
      };
    } catch (error) {
      console.error('❌ Error fetching user stats:', error);
      return {
        following: 0,
        fans: 0,
        messages: 0,
        posts: 0,
      };
    }
  }

  /**
   * Migrate legacy profile data from global storage to Supabase
   */
  async migrateLegacyProfile(userId: string): Promise<{ error?: any }> {
    try {
      // Check if global savedProfileData exists
      if (typeof global !== 'undefined' && global.savedProfileData?.personalInfo) {
        const legacyData = global.savedProfileData.personalInfo;
        
        console.log('🔄 Migrating legacy profile data to Supabase for user:', userId);
        
        const profileUpdates: ProfileUpdateData = {
          real_name: legacyData.realName || undefined,
          champs_username: legacyData.champsUsername || undefined,
          phone: legacyData.phoneNumber || undefined,
          email: legacyData.email || undefined,
          gender: legacyData.gender || undefined,
          quote: legacyData.quote || undefined,
          profile_picture: legacyData.profilePicture || undefined,
          avatar_url: legacyData.profilePicture || undefined,
          location: legacyData.location || undefined,
        };

        // Convert birthday to proper date format
        if (legacyData.birthday) {
          try {
            // Assume legacy date is in DD MMM YYYY format
            const dateStr = legacyData.birthday;
            const date = new Date(dateStr);
            if (!isNaN(date.getTime())) {
              profileUpdates.date_of_birth = date.toISOString().split('T')[0];
            }
          } catch (dateError) {
            console.warn('⚠️ Could not parse legacy birthday:', legacyData.birthday);
          }
        }

        // Filter out undefined values
        const cleanUpdates = Object.fromEntries(
          Object.entries(profileUpdates).filter(([_, value]) => value !== undefined)
        );

        if (Object.keys(cleanUpdates).length > 0) {
          const result = await this.updateProfile(userId, cleanUpdates);
          
          if (!result.error) {
            console.log('✅ Legacy profile data migrated successfully');
            // Clear legacy data after successful migration
            if (typeof global !== 'undefined') {
              global.savedProfileData = null;
            }
          }
          
          return result;
        }
      }

      return {};
    } catch (error) {
      console.error('❌ Error migrating legacy profile:', error);
      return { error };
    }
  }

  /**
   * Generate Champs ID if not exists
   */
  generateChampsId(): string {
    return `CHP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`.toUpperCase();
  }

  /**
   * Generate professional avatar URL
   */
  generateProfessionalAvatar(seed: string): string {
    const backgroundColors = ['ffdfbf', 'f0f0f0', 'e8f4fd', 'fff2e6', 'f8f8ff', 'f0fff0', 'fffacd', 'f5f5dc'];
    const seedHash = seed.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    const colorIndex = Math.abs(seedHash) % backgroundColors.length;
    const backgroundColor = backgroundColors[colorIndex];
    
    return `https://api.dicebear.com/7.x/adventurer/png?seed=${encodeURIComponent(seed)}&backgroundColor=${backgroundColor}&size=160`;
  }

  /**
   * Get current username with priority
   */
  getCurrentUsername(userProfile: UserProfile | null, authUserInfo?: { username?: string } | null): string {
    // Priority 1: Champs username from profile
    if (userProfile?.champs_username) {
      return userProfile.champs_username;
    }
    
    // Priority 2: Regular username from profile
    if (userProfile?.username && userProfile.username !== 'DefaultUser123') {
      return userProfile.username;
    }
    
    // Priority 3: Real name from profile
    if (userProfile?.real_name) {
      return userProfile.real_name;
    }
    
    // Priority 4: Auth username (if not default)
    if (authUserInfo?.username && authUserInfo.username !== 'DefaultUser123') {
      return authUserInfo.username;
    }
    
    // Fallback
    return 'DefaultUser123';
  }

  /**
   * Get current profile picture with priority
   */
  getCurrentProfilePicture(userProfile: UserProfile | null, authUserInfo?: { username?: string; avatar?: string } | null): string {
    // Priority 1: Profile picture from Supabase profile
    if (userProfile?.profile_picture) {
      return userProfile.profile_picture;
    }
    
    // Priority 2: Avatar URL from profile
    if (userProfile?.avatar_url) {
      return userProfile.avatar_url;
    }
    
    // Priority 3: Avatar from auth
    if (authUserInfo?.avatar) {
      return authUserInfo.avatar;
    }
    
    // Priority 4: Generate avatar using current username
    const currentUsername = this.getCurrentUsername(userProfile, authUserInfo);
    return this.generateProfessionalAvatar(currentUsername);
  }
}

// Export singleton instance
export const profileService = new ProfileService();
export default profileService; 