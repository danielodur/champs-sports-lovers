import { supabase } from './supabaseClient';

interface UserMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  message_type: 'text' | 'image' | 'system';
  content: string;
  image_url?: string;
  is_read: boolean;
  created_at: string;
  read_at?: string;
}

interface NotificationMessage {
  id: string;
  user_id: string;
  title: string;
  message: string;
  notification_type: 'goal' | 'match' | 'social' | 'system' | 'achievement';
  data?: any;
  is_read: boolean;
  created_at: string;
  read_at?: string;
}

interface MessageStats {
  total_messages: number;
  unread_messages: number;
  total_notifications: number;
  unread_notifications: number;
}

interface ConversationPreview {
  user_id: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  is_last_message_from_me: boolean;
}

class MessagesService {
  private currentUserId: string | null = null;

  /**
   * Set current user ID
   */
  setCurrentUser(userId: string | null) {
    this.currentUserId = userId;
    console.log('💬 MESSAGES SERVICE: User set to:', userId || 'none');
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
   * Send a message to another user
   */
  async sendMessage(
    recipientId: string,
    content: string,
    messageType: 'text' | 'image' = 'text',
    imageUrl?: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const currentUserId = await this.getCurrentUserId();
      if (!currentUserId) {
        return { success: false, error: 'User must be logged in to send messages' };
      }

      if (currentUserId === recipientId) {
        return { success: false, error: 'Cannot send message to yourself' };
      }

      if (!content.trim()) {
        return { success: false, error: 'Message content is required' };
      }

      const { data, error } = await supabase
        .from('user_messages')
        .insert([{
          sender_id: currentUserId,
          recipient_id: recipientId,
          message_type: messageType,
          content: content.trim(),
          image_url: imageUrl,
          is_read: false,
        }])
        .select('id')
        .single();

      if (error) {
        console.error('❌ MESSAGES SERVICE: Error sending message:', error);
        return { success: false, error: error.message };
      }

      console.log(`✅ MESSAGES SERVICE: Successfully sent message to ${recipientId}`);
      return { success: true, messageId: data.id };
    } catch (error) {
      console.error('❌ MESSAGES SERVICE: Error sending message:', error);
      return { success: false, error: 'Failed to send message' };
    }
  }

  /**
   * Get conversation between current user and another user
   */
  async getConversation(
    otherUserId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<UserMessage[]> {
    try {
      const currentUserId = await this.getCurrentUserId();
      if (!currentUserId) {
        console.log('⚠️ MESSAGES SERVICE: No authenticated user');
        return [];
      }

      const { data, error } = await supabase
        .from('user_messages')
        .select('*')
        .or(`and(sender_id.eq.${currentUserId},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${currentUserId})`)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('❌ MESSAGES SERVICE: Error fetching conversation:', error);
        return [];
      }

      console.log(`💬 MESSAGES SERVICE: Retrieved ${data?.length || 0} messages in conversation`);
      return data || [];
    } catch (error) {
      console.error('❌ MESSAGES SERVICE: Error fetching conversation:', error);
      return [];
    }
  }

  /**
   * Get all conversations for current user
   */
  async getConversations(): Promise<ConversationPreview[]> {
    try {
      const currentUserId = await this.getCurrentUserId();
      if (!currentUserId) {
        console.log('⚠️ MESSAGES SERVICE: No authenticated user');
        return [];
      }

      // This would typically be a custom database function for performance
      // For now, we'll use a simpler approach
      const { data, error } = await supabase
        .rpc('get_user_conversations', { current_user_id: currentUserId });

      if (error) {
        console.error('❌ MESSAGES SERVICE: Error fetching conversations:', error);
        // Fallback to manual query
        return this.getConversationsFallback();
      }

      console.log(`💬 MESSAGES SERVICE: Retrieved ${data?.length || 0} conversations`);
      return data || [];
    } catch (error) {
      console.error('❌ MESSAGES SERVICE: Error fetching conversations:', error);
      return [];
    }
  }

  /**
   * Fallback method for getting conversations
   */
  private async getConversationsFallback(): Promise<ConversationPreview[]> {
    try {
      const currentUserId = await this.getCurrentUserId();
      if (!currentUserId) return [];

      // Get all messages involving current user
      const { data: messages, error } = await supabase
        .from('user_messages')
        .select(`
          *,
          sender:profiles!sender_id(id, username, full_name, avatar_url),
          recipient:profiles!recipient_id(id, username, full_name, avatar_url)
        `)
        .or(`sender_id.eq.${currentUserId},recipient_id.eq.${currentUserId}`)
        .order('created_at', { ascending: false });

      if (error || !messages) return [];

      // Group by conversation partner
      const conversationsMap = new Map<string, any>();

      messages.forEach(message => {
        const isFromMe = message.sender_id === currentUserId;
        const partnerId = isFromMe ? message.recipient_id : message.sender_id;
        const partner = isFromMe ? message.recipient : message.sender;

        if (!conversationsMap.has(partnerId)) {
          conversationsMap.set(partnerId, {
            user_id: partnerId,
            username: partner?.username || 'Unknown',
            full_name: partner?.full_name,
            avatar_url: partner?.avatar_url,
            last_message: message.content,
            last_message_time: message.created_at,
            unread_count: 0,
            is_last_message_from_me: isFromMe,
          });
        }

        // Count unread messages from partner
        if (!isFromMe && !message.is_read) {
          conversationsMap.get(partnerId).unread_count++;
        }
      });

      return Array.from(conversationsMap.values());
    } catch (error) {
      console.error('❌ MESSAGES SERVICE: Error in fallback conversations:', error);
      return [];
    }
  }

  /**
   * Mark message as read
   */
  async markMessageAsRead(messageId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const currentUserId = await this.getCurrentUserId();
      if (!currentUserId) {
        return { success: false, error: 'User must be logged in' };
      }

      const { error } = await supabase
        .from('user_messages')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('id', messageId)
        .eq('recipient_id', currentUserId);

      if (error) {
        console.error('❌ MESSAGES SERVICE: Error marking message as read:', error);
        return { success: false, error: error.message };
      }

      console.log(`✅ MESSAGES SERVICE: Marked message ${messageId} as read`);
      return { success: true };
    } catch (error) {
      console.error('❌ MESSAGES SERVICE: Error marking message as read:', error);
      return { success: false, error: 'Failed to mark message as read' };
    }
  }

  /**
   * Mark all messages in conversation as read
   */
  async markConversationAsRead(otherUserId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const currentUserId = await this.getCurrentUserId();
      if (!currentUserId) {
        return { success: false, error: 'User must be logged in' };
      }

      const { error } = await supabase
        .from('user_messages')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('sender_id', otherUserId)
        .eq('recipient_id', currentUserId)
        .eq('is_read', false);

      if (error) {
        console.error('❌ MESSAGES SERVICE: Error marking conversation as read:', error);
        return { success: false, error: error.message };
      }

      console.log(`✅ MESSAGES SERVICE: Marked conversation with ${otherUserId} as read`);
      return { success: true };
    } catch (error) {
      console.error('❌ MESSAGES SERVICE: Error marking conversation as read:', error);
      return { success: false, error: 'Failed to mark conversation as read' };
    }
  }

  /**
   * Get notifications for current user
   */
  async getNotifications(limit: number = 50): Promise<NotificationMessage[]> {
    try {
      const currentUserId = await this.getCurrentUserId();
      if (!currentUserId) {
        console.log('⚠️ MESSAGES SERVICE: No authenticated user');
        return [];
      }

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', currentUserId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('❌ MESSAGES SERVICE: Error fetching notifications:', error);
        return [];
      }

      console.log(`🔔 MESSAGES SERVICE: Retrieved ${data?.length || 0} notifications`);
      return data || [];
    } catch (error) {
      console.error('❌ MESSAGES SERVICE: Error fetching notifications:', error);
      return [];
    }
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(notificationId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const currentUserId = await this.getCurrentUserId();
      if (!currentUserId) {
        return { success: false, error: 'User must be logged in' };
      }

      const { error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('id', notificationId)
        .eq('user_id', currentUserId);

      if (error) {
        console.error('❌ MESSAGES SERVICE: Error marking notification as read:', error);
        return { success: false, error: error.message };
      }

      console.log(`✅ MESSAGES SERVICE: Marked notification ${notificationId} as read`);
      return { success: true };
    } catch (error) {
      console.error('❌ MESSAGES SERVICE: Error marking notification as read:', error);
      return { success: false, error: 'Failed to mark notification as read' };
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllNotificationsAsRead(): Promise<{ success: boolean; error?: string }> {
    try {
      const currentUserId = await this.getCurrentUserId();
      if (!currentUserId) {
        return { success: false, error: 'User must be logged in' };
      }

      const { error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('user_id', currentUserId)
        .eq('is_read', false);

      if (error) {
        console.error('❌ MESSAGES SERVICE: Error marking all notifications as read:', error);
        return { success: false, error: error.message };
      }

      console.log(`✅ MESSAGES SERVICE: Marked all notifications as read`);
      return { success: true };
    } catch (error) {
      console.error('❌ MESSAGES SERVICE: Error marking all notifications as read:', error);
      return { success: false, error: 'Failed to mark all notifications as read' };
    }
  }

  /**
   * Get message statistics
   */
  async getMessageStats(): Promise<MessageStats> {
    try {
      const currentUserId = await this.getCurrentUserId();
      if (!currentUserId) {
        return { total_messages: 0, unread_messages: 0, total_notifications: 0, unread_notifications: 0 };
      }

      // Get message counts
      const { count: totalMessages } = await supabase
        .from('user_messages')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', currentUserId);

      const { count: unreadMessages } = await supabase
        .from('user_messages')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', currentUserId)
        .eq('is_read', false);

      // Get notification counts
      const { count: totalNotifications } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', currentUserId);

      const { count: unreadNotifications } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', currentUserId)
        .eq('is_read', false);

      const stats = {
        total_messages: totalMessages || 0,
        unread_messages: unreadMessages || 0,
        total_notifications: totalNotifications || 0,
        unread_notifications: unreadNotifications || 0,
      };

      console.log(`📊 MESSAGES SERVICE: Stats - Messages: ${stats.total_messages}/${stats.unread_messages}, Notifications: ${stats.total_notifications}/${stats.unread_notifications}`);
      return stats;
    } catch (error) {
      console.error('❌ MESSAGES SERVICE: Error fetching message stats:', error);
      return { total_messages: 0, unread_messages: 0, total_notifications: 0, unread_notifications: 0 };
    }
  }

  /**
   * Delete a message
   */
  async deleteMessage(messageId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const currentUserId = await this.getCurrentUserId();
      if (!currentUserId) {
        return { success: false, error: 'User must be logged in to delete messages' };
      }

      const { error } = await supabase
        .from('user_messages')
        .delete()
        .eq('id', messageId)
        .eq('sender_id', currentUserId);

      if (error) {
        console.error('❌ MESSAGES SERVICE: Error deleting message:', error);
        return { success: false, error: error.message };
      }

      console.log(`✅ MESSAGES SERVICE: Successfully deleted message ${messageId}`);
      return { success: true };
    } catch (error) {
      console.error('❌ MESSAGES SERVICE: Error deleting message:', error);
      return { success: false, error: 'Failed to delete message' };
    }
  }
}

// Export singleton instance
export const messagesService = new MessagesService();
export default messagesService;
export type { UserMessage, NotificationMessage, MessageStats, ConversationPreview }; 