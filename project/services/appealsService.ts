/**
 * Account Appeals Service
 * Handles account appeal operations using Supabase
 */

import { supabase } from './supabaseClient';
import { AccountAppeal, SupabaseAccountAppeal } from '../types/appeal';

class AppealsService {
  private currentUserId: string | null = null;

  /**
   * Get current authenticated user ID
   */
  private async getCurrentUserId(): Promise<string | null> {
    try {
      // Use getSession instead of getUser to avoid throwing errors for guest users
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.log('⚠️ APPEALS SERVICE: No active session:', error.message);
        return null;
      }
      
      if (!session || !session.user) {
        console.log('⚠️ APPEALS SERVICE: User not authenticated (guest user)');
        return null;
      }
      
      this.currentUserId = session.user.id;
      return this.currentUserId;
    } catch (error) {
      console.log('⚠️ APPEALS SERVICE: Error checking session:', error);
      return null;
    }
  }

  /**
   * Get all account appeals for current user
   */
  async getAccountAppeals(): Promise<AccountAppeal[]> {
    try {
      const currentUserId = await this.getCurrentUserId();
      if (!currentUserId) {
        console.log('⚠️ APPEALS SERVICE: No authenticated user');
        return [];
      }

      const { data, error } = await supabase
        .from('account_appeals')
        .select('*')
        .eq('user_id', currentUserId)
        .order('submitted_at', { ascending: false });

      if (error) {
        console.error('❌ APPEALS SERVICE: Error fetching appeals:', error);
        return [];
      }

      // Convert Supabase format to app format
      const appeals: AccountAppeal[] = (data || []).map((item: SupabaseAccountAppeal) => ({
        id: item.id,
        user_id: item.user_id,
        appeal_type: item.appeal_type,
        status: item.status,
        reason: item.reason,
        description: item.description,
        submitted_at: item.submitted_at,
        reviewed_at: item.reviewed_at || undefined,
        admin_notes: item.admin_notes || undefined,
        created_at: item.created_at,
        updated_at: item.updated_at,
      }));

      console.log(`📊 APPEALS SERVICE: Retrieved ${appeals.length} appeals`);
      return appeals;
    } catch (error) {
      console.error('❌ APPEALS SERVICE: Error getting appeals:', error);
      return [];
    }
  }

  /**
   * Get specific appeal by ID
   */
  async getAppealById(appealId: string): Promise<AccountAppeal | null> {
    try {
      const currentUserId = await this.getCurrentUserId();
      if (!currentUserId) {
        console.log('⚠️ APPEALS SERVICE: No authenticated user');
        return null;
      }

      const { data, error } = await supabase
        .from('account_appeals')
        .select('*')
        .eq('id', appealId)
        .eq('user_id', currentUserId)
        .single();

      if (error) {
        console.error('❌ APPEALS SERVICE: Error fetching appeal:', error);
        return null;
      }

      if (!data) {
        return null;
      }

      const appeal: AccountAppeal = {
        id: data.id,
        user_id: data.user_id,
        appeal_type: data.appeal_type,
        status: data.status,
        reason: data.reason,
        description: data.description,
        submitted_at: data.submitted_at,
        reviewed_at: data.reviewed_at || undefined,
        admin_notes: data.admin_notes || undefined,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };

      console.log(`📄 APPEALS SERVICE: Retrieved appeal ${appealId}`);
      return appeal;
    } catch (error) {
      console.error('❌ APPEALS SERVICE: Error getting appeal:', error);
      return null;
    }
  }

  /**
   * Submit a new appeal
   */
  async submitAppeal(appealData: {
    appeal_type: AccountAppeal['appeal_type'];
    reason: string;
    description: string;
  }): Promise<{ success: boolean; appealId?: string; error?: string }> {
    try {
      const currentUserId = await this.getCurrentUserId();
      if (!currentUserId) {
        return { success: false, error: 'User not authenticated' };
      }

      const { data, error } = await supabase
        .from('account_appeals')
        .insert({
          user_id: currentUserId,
          appeal_type: appealData.appeal_type,
          status: 'pending',
          reason: appealData.reason,
          description: appealData.description,
          submitted_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('❌ APPEALS SERVICE: Error submitting appeal:', error);
        return { success: false, error: error.message };
      }

      console.log(`✅ APPEALS SERVICE: Appeal submitted successfully - ${data.id}`);
      return { success: true, appealId: data.id };
    } catch (error) {
      console.error('❌ APPEALS SERVICE: Error submitting appeal:', error);
      return { success: false, error: 'Failed to submit appeal' };
    }
  }

  /**
   * Cancel a pending appeal
   */
  async cancelAppeal(appealId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const currentUserId = await this.getCurrentUserId();
      if (!currentUserId) {
        return { success: false, error: 'User not authenticated' };
      }

      const { error } = await supabase
        .from('account_appeals')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', appealId)
        .eq('user_id', currentUserId)
        .eq('status', 'pending'); // Can only cancel pending appeals

      if (error) {
        console.error('❌ APPEALS SERVICE: Error cancelling appeal:', error);
        return { success: false, error: error.message };
      }

      console.log(`✅ APPEALS SERVICE: Appeal cancelled successfully - ${appealId}`);
      return { success: true };
    } catch (error) {
      console.error('❌ APPEALS SERVICE: Error cancelling appeal:', error);
      return { success: false, error: 'Failed to cancel appeal' };
    }
  }

  /**
   * Get appeals count by status
   */
  async getAppealsCountByStatus(status: AccountAppeal['status']): Promise<number> {
    try {
      const currentUserId = await this.getCurrentUserId();
      if (!currentUserId) {
        return 0;
      }

      const { count, error } = await supabase
        .from('account_appeals')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', currentUserId)
        .eq('status', status);

      if (error) {
        console.error('❌ APPEALS SERVICE: Error counting appeals:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('❌ APPEALS SERVICE: Error counting appeals:', error);
      return 0;
    }
  }
}

// Export singleton instance
export const appealsService = new AppealsService();
export default appealsService;

