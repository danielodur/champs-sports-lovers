import { supabase } from './supabaseClient';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface ChatMessage {
  id: string;
  match_id: string;
  user_id: string;
  username: string;
  level: number;
  content: string;
  created_at: string;
}

export interface User {
  id: string;
  username: string;
  level: number;
}

class ChatService {
  private channels: Map<string, RealtimeChannel> = new Map();
  private messageCallbacks: Map<string, (message: ChatMessage) => void> = new Map();
  private currentUserId: string | null = null;
  private userProfileCache: Map<string, { username: string; level: number; timestamp: number }> = new Map();

  /**
   * Set current user for the chat service
   */
  setCurrentUser(userId: string | null): void {
    this.currentUserId = userId;
    console.log('💬 CHAT SERVICE: Current user set to:', userId);
  }

  /**
   * Get current user ID from auth session
   */
  private async getCurrentUserId(): Promise<string | null> {
    console.log('🔍 CHAT SERVICE: getCurrentUserId called');
    console.log('🔍 CHAT SERVICE: this.currentUserId =', this.currentUserId);
    
    // First try stored user ID (from custom auth system)
    if (this.currentUserId) {
      console.log('💬 CHAT SERVICE: Using stored user ID:', this.currentUserId);
      return this.currentUserId;
    }

    try {
      console.log('🔍 CHAT SERVICE: Trying Supabase session fallback...');
      // Fallback to Supabase auth
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id || null;
      
      console.log('🔍 CHAT SERVICE: Supabase session:', session ? 'exists' : 'null');
      console.log('🔍 CHAT SERVICE: Supabase userId:', userId);
      
      if (userId) {
        console.log('💬 CHAT SERVICE: Using Supabase user ID:', userId);
        this.currentUserId = userId;
        return userId;
      }

      console.log('❌ CHAT SERVICE: No authenticated user found - creating guest fallback');
      // Create a guest user as ultimate fallback
      const guestUserId = `guest_fallback_${Date.now()}`;
      this.currentUserId = guestUserId;
      console.log('💬 CHAT SERVICE: Created guest fallback user:', guestUserId);
      return guestUserId;
    } catch (error) {
      console.error('❌ CHAT SERVICE: Error getting current user:', error);
      // Create a guest user even on error
      const errorGuestUserId = `guest_error_${Date.now()}`;
      this.currentUserId = errorGuestUserId;
      console.log('💬 CHAT SERVICE: Created error guest user:', errorGuestUserId);
      return errorGuestUserId;
    }
  }

  /**
   * Get user profile information for chat display
   */
  private async getUserProfile(userId: string): Promise<{ username: string; level: number }> {
    try {
      console.log('💬 CHAT SERVICE: Fetching profile for user ID:', userId);
      
      // Check cache first (valid for 5 minutes)
      const cached = this.userProfileCache.get(userId);
      if (cached && Date.now() - cached.timestamp < 300000) {
        console.log('💬 CHAT SERVICE: Using cached profile for:', userId);
        return { username: cached.username, level: cached.level };
      }
      
      // Handle guest users specially
      if (userId.startsWith('guest_')) {
        const guestProfile = { username: 'Guest', level: 1 };
        console.log('💬 CHAT SERVICE: Using guest profile:', guestProfile);
        // Cache the result
        this.userProfileCache.set(userId, { ...guestProfile, timestamp: Date.now() });
        return guestProfile;
      }
      
      // Handle custom user IDs specially
      if (userId.startsWith('user_')) {
        const usernameMatch = userId.match(/user_(.+)_\d+/);
        const username = usernameMatch ? usernameMatch[1] : 'User';
        const customProfile = { username, level: 1 };
        console.log('💬 CHAT SERVICE: Using custom user profile:', customProfile);
        // Cache the result
        this.userProfileCache.set(userId, { ...customProfile, timestamp: Date.now() });
        return customProfile;
      }
      
      // Try to get profile from Supabase for real users
      const { data, error } = await supabase
        .from('profiles')
        .select('username, champs_username, level')
        .eq('id', userId)
        .single();

      if (error) {
        console.log('💬 CHAT SERVICE: Profile not found in Supabase, using fallback');
        // Create a fallback profile with a generated username
        const fallbackUsername = `User${userId.slice(-4)}`;
        const fallbackProfile = { username: fallbackUsername, level: 1 };
        console.log('💬 CHAT SERVICE: Using fallback profile:', fallbackProfile);
        // Cache the fallback
        this.userProfileCache.set(userId, { ...fallbackProfile, timestamp: Date.now() });
        return fallbackProfile;
      }

      const profile = {
        username: data.champs_username || data.username || `User${userId.slice(-4)}`,
        level: data.level || 1
      };
      
      console.log('💬 CHAT SERVICE: Found profile:', profile);
      // Cache the result
      this.userProfileCache.set(userId, { ...profile, timestamp: Date.now() });
      return profile;
    } catch (error) {
      console.error('❌ CHAT SERVICE: Error fetching user profile:', error);
      const fallbackProfile = { username: `User${userId.slice(-4)}`, level: 1 };
      console.log('💬 CHAT SERVICE: Using error fallback profile:', fallbackProfile);
      // Cache the error fallback
      this.userProfileCache.set(userId, { ...fallbackProfile, timestamp: Date.now() });
      return fallbackProfile;
    }
  }

  /**
   * Subscribe to real-time chat messages for a specific match
   */
  async subscribeToMatchChat(matchId: string, onMessage: (message: ChatMessage) => void): Promise<void> {
    try {
      const matchIdStr = String(matchId);
      console.log('💬 CHAT SERVICE: Subscribing to chat for match:', matchIdStr);
      
      // Unsubscribe from previous match if any
      const existingChannel = this.channels.get(matchIdStr);
      if (existingChannel) {
        await supabase.removeChannel(existingChannel);
        this.channels.delete(matchIdStr);
      }

      // Create new channel for this match
      const channel = supabase
        .channel(`match_chat_${matchIdStr}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages',
            filter: `match_id=eq.${matchIdStr}`
          },
          (payload) => {
            console.log('💬 CHAT SERVICE: New message received:', payload);
            const message = payload.new as ChatMessage;
            onMessage(message);
          }
        )
        .subscribe();

      this.channels.set(matchIdStr, channel);
      this.messageCallbacks.set(matchIdStr, onMessage);
      
      console.log(`💬 CHAT SERVICE: Subscribed to chat for match ${matchIdStr}`);
    } catch (error) {
      console.error('❌ CHAT SERVICE: Error subscribing to match chat:', error);
    }
  }

  /**
   * Unsubscribe from match chat
   */
  async unsubscribeFromMatchChat(matchId: string): Promise<void> {
    try {
      const matchIdStr = String(matchId);
      const channel = this.channels.get(matchIdStr);
      if (channel) {
        await supabase.removeChannel(channel);
        this.channels.delete(matchIdStr);
        this.messageCallbacks.delete(matchIdStr);
        console.log(`💬 CHAT SERVICE: Unsubscribed from chat for match ${matchIdStr}`);
      }
    } catch (error) {
      console.error('❌ CHAT SERVICE: Error unsubscribing from match chat:', error);
    }
  }

  /**
   * Fetch existing messages for a match
   */
  async getMatchMessages(matchId: string, limit: number = 50): Promise<ChatMessage[]> {
    try {
      const matchIdStr = String(matchId);
      console.log('💬 CHAT SERVICE: Fetching messages for match:', matchIdStr);
      
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('match_id', matchIdStr)
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error) {
        console.log('💬 CHAT SERVICE: No existing messages for match:', matchIdStr);
        return [];
      }

      console.log(`💬 CHAT SERVICE: Fetched ${data?.length || 0} messages for match ${matchIdStr}`);
      return data || [];
    } catch (error) {
      console.error('❌ CHAT SERVICE: Error fetching messages:', error);
      return [];
    }
  }

  /**
   * Send a new message to the match chat
   */
  async sendMessage(matchId: string, content: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('💬 CHAT SERVICE: sendMessage called with:', { matchId, content: content.substring(0, 50) + '...' });
      
      if (!content.trim()) {
        return { success: false, error: 'Message cannot be empty' };
      }

      const matchIdStr = String(matchId);
      const userId = await this.getCurrentUserId();
      
      console.log('💬 CHAT SERVICE: Got userId for sendMessage:', userId);
      
      // Since getCurrentUserId now always returns a user (guest fallback), this should never fail
      if (!userId) {
        console.error('❌ CHAT SERVICE: Unexpected: getCurrentUserId returned null');
        return { success: false, error: 'Authentication system error' };
      }

      // Get user profile for username and level
      const userProfile = await this.getUserProfile(userId);
      console.log('💬 CHAT SERVICE: Got userProfile for sendMessage:', userProfile);

      console.log('💬 CHAT SERVICE: Sending message to match:', matchIdStr);
      console.log('💬 CHAT SERVICE: Message data:', {
        match_id: matchIdStr,
        user_id: userId,
        username: userProfile.username,
        level: userProfile.level,
        content: content.trim()
      });
      
      const { error } = await supabase
        .from('chat_messages')
        .insert([{
          match_id: matchIdStr,
          user_id: userId,
          username: userProfile.username,
          level: userProfile.level,
          content: content.trim()
        }]);

      if (error) {
        console.error('❌ CHAT SERVICE: Error sending message:', error);
        console.error('Match ID used:', matchIdStr);
        return { success: false, error: error.message };
      }

      console.log('💬 CHAT SERVICE: Message sent successfully to match:', matchIdStr);
      return { success: true };
    } catch (error) {
      console.error('❌ CHAT SERVICE: Error sending message:', error);
      return { success: false, error: 'Failed to send message' };
    }
  }

  /**
   * Get recent active users in the chat
   */
  async getActiveChatUsers(matchId: string, minutes: number = 30): Promise<string[]> {
    try {
      // Convert matchId to string and add debugging
      const matchIdStr = String(matchId);
      console.log('💬 CHAT SERVICE: Getting active users for match:', matchIdStr);
      
      const timeAgo = new Date(Date.now() - minutes * 60 * 1000).toISOString();
      
      const { data, error } = await supabase
        .from('chat_messages')
        .select('username')
        .eq('match_id', matchIdStr)
        .gte('created_at', timeAgo)
        .order('created_at', { ascending: false });

      if (error) {
        console.log('💬 CHAT SERVICE: No active users found for match:', matchIdStr);
        return [];
      }

      // Get unique usernames
      const uniqueUsers = [...new Set((data || []).map(msg => msg.username))];
      console.log('💬 CHAT SERVICE: Found active users:', uniqueUsers);
      return uniqueUsers.slice(0, 10); // Return max 10 recent users
    } catch (error) {
      console.error('❌ CHAT SERVICE: Error fetching active users:', error);
      return [];
    }
  }

  /**
   * Clean up all subscriptions
   */
  async cleanup(): Promise<void> {
    try {
      for (const [matchId, channel] of this.channels) {
        await supabase.removeChannel(channel);
      }
      this.channels.clear();
      this.messageCallbacks.clear();
      this.currentUserId = null;
      console.log('💬 CHAT SERVICE: Cleanup completed');
    } catch (error) {
      console.error('❌ CHAT SERVICE: Error during cleanup:', error);
    }
  }

  /**
   * Format message timestamp for display
   */
  formatMessageTime(timestamp: string): string {
    const messageTime = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - messageTime.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} min ago`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours}h ago`;
    } else {
      return messageTime.toLocaleDateString();
    }
  }

  /**
   * Get chat statistics for a match
   */
  async getChatStats(matchId: string): Promise<{ messageCount: number; activeUsers: number }> {
    try {
      const matchIdStr = String(matchId);
      console.log('💬 CHAT SERVICE: Getting stats for match:', matchIdStr);
      
      // Get total message count
      const { count: messageCount, error: countError } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('match_id', matchIdStr);

      if (countError) {
        console.log('💬 CHAT SERVICE: No message count available for match:', matchIdStr);
      }

      // Get active users in last hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { data: recentMessages, error: recentError } = await supabase
        .from('chat_messages')
        .select('username')
        .eq('match_id', matchIdStr)
        .gte('created_at', oneHourAgo);

      if (recentError) {
        console.log('💬 CHAT SERVICE: No recent messages for match:', matchIdStr);
      }

      const activeUsers = new Set((recentMessages || []).map(msg => msg.username)).size;

      console.log(`💬 CHAT SERVICE: Stats for match ${matchIdStr}: ${messageCount || 0} messages, ${activeUsers} active users`);

      return {
        messageCount: messageCount || 0,
        activeUsers
      };
    } catch (error) {
      console.error('❌ CHAT SERVICE: Error fetching chat stats:', error);
      return { messageCount: 0, activeUsers: 0 };
    }
  }
}

// Export singleton instance
export const chatService = new ChatService();
export default chatService; 