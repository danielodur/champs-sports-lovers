import { supabase } from './supabaseClient';

interface UserInvite {
  id: string;
  inviter_id: string;
  invitee_name: string;
  invitee_phone?: string;
  invitee_email?: string;
  invite_method: 'sms' | 'email' | 'link' | 'whatsapp';
  invite_status: 'pending' | 'downloaded' | 'registered' | 'active';
  invite_code: string;
  sent_at: string;
  responded_at?: string;
  registered_user_id?: string;
}

interface InviteStats {
  total_invites: number;
  pending_invites: number;
  successful_invites: number;
  registration_rate: number;
}

class InvitesService {
  private currentUserId: string | null = null;

  /**
   * Set current user ID
   */
  setCurrentUser(userId: string | null) {
    this.currentUserId = userId;
    console.log('📤 INVITES SERVICE: User set to:', userId || 'none');
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
   * Generate unique invite code
   */
  private generateInviteCode(): string {
    return 'INV' + Math.random().toString(36).substr(2, 8).toUpperCase();
  }

  /**
   * Send an invitation
   */
  async sendInvite(
    inviteData: {
      invitee_name: string;
      invitee_phone?: string;
      invitee_email?: string;
      invite_method: 'sms' | 'email' | 'link' | 'whatsapp';
    }
  ): Promise<{ success: boolean; inviteCode?: string; error?: string }> {
    try {
      const currentUserId = await this.getCurrentUserId();
      if (!currentUserId) {
        return { success: false, error: 'User must be logged in to send invites' };
      }

      // Validate input
      if (!inviteData.invitee_name.trim()) {
        return { success: false, error: 'Invitee name is required' };
      }

      if (inviteData.invite_method === 'email' && !inviteData.invitee_email) {
        return { success: false, error: 'Email is required for email invites' };
      }

      if ((inviteData.invite_method === 'sms' || inviteData.invite_method === 'whatsapp') && !inviteData.invitee_phone) {
        return { success: false, error: 'Phone number is required for SMS/WhatsApp invites' };
      }

      const inviteCode = this.generateInviteCode();

      const { error } = await supabase
        .from('user_invites')
        .insert([{
          inviter_id: currentUserId,
          invitee_name: inviteData.invitee_name.trim(),
          invitee_phone: inviteData.invitee_phone?.trim(),
          invitee_email: inviteData.invitee_email?.trim(),
          invite_method: inviteData.invite_method,
          invite_status: 'pending',
          invite_code: inviteCode,
        }]);

      if (error) {
        console.error('❌ INVITES SERVICE: Error sending invite:', error);
        return { success: false, error: error.message };
      }

      console.log(`✅ INVITES SERVICE: Successfully sent invite to ${inviteData.invitee_name} via ${inviteData.invite_method}`);
      return { success: true, inviteCode };
    } catch (error) {
      console.error('❌ INVITES SERVICE: Error sending invite:', error);
      return { success: false, error: 'Failed to send invite' };
    }
  }

  /**
   * Get all invites sent by current user
   */
  async getMyInvites(): Promise<UserInvite[]> {
    try {
      const currentUserId = await this.getCurrentUserId();
      if (!currentUserId) {
        console.log('⚠️ INVITES SERVICE: No authenticated user');
        return [];
      }

      const { data, error } = await supabase
        .from('user_invites')
        .select('*')
        .eq('inviter_id', currentUserId)
        .order('sent_at', { ascending: false });

      if (error) {
        console.error('❌ INVITES SERVICE: Error fetching invites:', error);
        return [];
      }

      console.log(`📊 INVITES SERVICE: Retrieved ${data?.length || 0} invites`);
      return data || [];
    } catch (error) {
      console.error('❌ INVITES SERVICE: Error fetching invites:', error);
      return [];
    }
  }

  /**
   * Get invites by status
   */
  async getInvitesByStatus(status: 'pending' | 'downloaded' | 'registered' | 'active'): Promise<UserInvite[]> {
    try {
      const currentUserId = await this.getCurrentUserId();
      if (!currentUserId) {
        return [];
      }

      const { data, error } = await supabase
        .from('user_invites')
        .select('*')
        .eq('inviter_id', currentUserId)
        .eq('invite_status', status)
        .order('sent_at', { ascending: false });

      if (error) {
        console.error('❌ INVITES SERVICE: Error fetching invites by status:', error);
        return [];
      }

      console.log(`📊 INVITES SERVICE: Retrieved ${data?.length || 0} ${status} invites`);
      return data || [];
    } catch (error) {
      console.error('❌ INVITES SERVICE: Error fetching invites by status:', error);
      return [];
    }
  }

  /**
   * Update invite status
   */
  async updateInviteStatus(
    inviteCode: string, 
    status: 'downloaded' | 'registered' | 'active',
    registeredUserId?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const updateData: any = {
        invite_status: status,
        responded_at: new Date().toISOString(),
      };

      if (registeredUserId && status === 'registered') {
        updateData.registered_user_id = registeredUserId;
      }

      const { error } = await supabase
        .from('user_invites')
        .update(updateData)
        .eq('invite_code', inviteCode);

      if (error) {
        console.error('❌ INVITES SERVICE: Error updating invite status:', error);
        return { success: false, error: error.message };
      }

      console.log(`✅ INVITES SERVICE: Successfully updated invite ${inviteCode} to ${status}`);
      return { success: true };
    } catch (error) {
      console.error('❌ INVITES SERVICE: Error updating invite status:', error);
      return { success: false, error: 'Failed to update invite status' };
    }
  }

  /**
   * Resend an invitation
   */
  async resendInvite(inviteId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const currentUserId = await this.getCurrentUserId();
      if (!currentUserId) {
        return { success: false, error: 'User must be logged in to resend invites' };
      }

      // Verify the invite belongs to current user
      const { data: invite, error: fetchError } = await supabase
        .from('user_invites')
        .select('*')
        .eq('id', inviteId)
        .eq('inviter_id', currentUserId)
        .single();

      if (fetchError || !invite) {
        return { success: false, error: 'Invite not found or access denied' };
      }

      // Generate new invite code
      const newInviteCode = this.generateInviteCode();

      const { error } = await supabase
        .from('user_invites')
        .update({
          invite_code: newInviteCode,
          sent_at: new Date().toISOString(),
          invite_status: 'pending',
          responded_at: null,
        })
        .eq('id', inviteId);

      if (error) {
        console.error('❌ INVITES SERVICE: Error resending invite:', error);
        return { success: false, error: error.message };
      }

      console.log(`✅ INVITES SERVICE: Successfully resent invite to ${invite.invitee_name}`);
      return { success: true };
    } catch (error) {
      console.error('❌ INVITES SERVICE: Error resending invite:', error);
      return { success: false, error: 'Failed to resend invite' };
    }
  }

  /**
   * Get invite statistics for current user
   */
  async getInviteStats(): Promise<InviteStats> {
    try {
      const currentUserId = await this.getCurrentUserId();
      if (!currentUserId) {
        return { total_invites: 0, pending_invites: 0, successful_invites: 0, registration_rate: 0 };
      }

      const { data, error } = await supabase
        .from('user_invites')
        .select('invite_status')
        .eq('inviter_id', currentUserId);

      if (error) {
        console.error('❌ INVITES SERVICE: Error fetching invite stats:', error);
        return { total_invites: 0, pending_invites: 0, successful_invites: 0, registration_rate: 0 };
      }

      const invites = data || [];
      const totalInvites = invites.length;
      const pendingInvites = invites.filter(inv => inv.invite_status === 'pending').length;
      const successfulInvites = invites.filter(inv => ['registered', 'active'].includes(inv.invite_status)).length;
      const registrationRate = totalInvites > 0 ? (successfulInvites / totalInvites) * 100 : 0;

      const stats = {
        total_invites: totalInvites,
        pending_invites: pendingInvites,
        successful_invites: successfulInvites,
        registration_rate: Math.round(registrationRate * 100) / 100,
      };

      console.log(`📊 INVITES SERVICE: Stats - Total: ${stats.total_invites}, Pending: ${stats.pending_invites}, Successful: ${stats.successful_invites}, Rate: ${stats.registration_rate}%`);
      return stats;
    } catch (error) {
      console.error('❌ INVITES SERVICE: Error fetching invite stats:', error);
      return { total_invites: 0, pending_invites: 0, successful_invites: 0, registration_rate: 0 };
    }
  }

  /**
   * Get invite by code (for processing when someone uses invite link)
   */
  async getInviteByCode(inviteCode: string): Promise<UserInvite | null> {
    try {
      const { data, error } = await supabase
        .from('user_invites')
        .select('*')
        .eq('invite_code', inviteCode)
        .single();

      if (error) {
        console.error('❌ INVITES SERVICE: Error fetching invite by code:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('❌ INVITES SERVICE: Error fetching invite by code:', error);
      return null;
    }
  }

  /**
   * Generate invite link for sharing
   */
  generateInviteLink(inviteCode: string): string {
    // In a real app, this would be your actual app URL/deep link
    return `https://champs.app/invite/${inviteCode}`;
  }

  /**
   * Generate invite message for sharing
   */
  generateInviteMessage(inviteCode: string, inviterName?: string): string {
    const inviteLink = this.generateInviteLink(inviteCode);
    const message = inviterName 
      ? `${inviterName} invited you to join Champs - the best sports prediction app! Use code ${inviteCode} or download here: ${inviteLink}`
      : `Join me on Champs - the best sports prediction app! Use invite code ${inviteCode} or download here: ${inviteLink}`;
    
    return message;
  }

  /**
   * Delete an invite
   */
  async deleteInvite(inviteId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const currentUserId = await this.getCurrentUserId();
      if (!currentUserId) {
        return { success: false, error: 'User must be logged in to delete invites' };
      }

      const { error } = await supabase
        .from('user_invites')
        .delete()
        .eq('id', inviteId)
        .eq('inviter_id', currentUserId);

      if (error) {
        console.error('❌ INVITES SERVICE: Error deleting invite:', error);
        return { success: false, error: error.message };
      }

      console.log(`✅ INVITES SERVICE: Successfully deleted invite ${inviteId}`);
      return { success: true };
    } catch (error) {
      console.error('❌ INVITES SERVICE: Error deleting invite:', error);
      return { success: false, error: 'Failed to delete invite' };
    }
  }
}

// Export singleton instance
export const invitesService = new InvitesService();
export default invitesService;
export type { UserInvite, InviteStats }; 