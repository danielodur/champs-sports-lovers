// Account Appeal Types
export type AppealStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export type AppealType = 
  | 'account_suspension'
  | 'account_restriction'
  | 'content_removal'
  | 'verification_issue'
  | 'payment_issue'
  | 'other';

export interface AccountAppeal {
  id: string;
  user_id: string;
  appeal_type: AppealType;
  status: AppealStatus;
  reason: string;
  description: string;
  submitted_at: string;
  reviewed_at?: string;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface SupabaseAccountAppeal {
  id: string;
  user_id: string;
  appeal_type: AppealType;
  status: AppealStatus;
  reason: string;
  description: string;
  submitted_at: string;
  reviewed_at: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

