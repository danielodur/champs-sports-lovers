import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService, AuthState as SupabaseAuthState, UserProfile } from '@/services/authService';
import { User, Session } from '@supabase/supabase-js';

interface AuthState {
  isLoggedIn: boolean;
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  userInfo: {
    username: string;
    avatar?: string;
  } | null;
  // ✅ NEW: Track authentication type to prevent conflicts
  authType: 'supabase' | 'test' | null;
  // Supabase methods
  signInWithPhone: (phone: string) => Promise<{ error?: any }>;
  verifyPhoneOtp: (phone: string, token: string) => Promise<{ error?: any }>;
  signInWithEmail: (email: string, password: string) => Promise<{ error?: any }>;
  signUpWithEmail: (email: string, password: string, username?: string) => Promise<{ error?: any }>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error?: any }>;
  resetPassword: (email: string) => Promise<{ error?: any }>;
  // Legacy methods for compatibility
  setLoggedIn: (loggedIn: boolean, userInfo?: { username: string; avatar?: string }) => void;
  logout: () => Promise<void>;
  initializeAuth: () => Promise<void>;
}

const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      isLoggedIn: false,
      user: null,
      profile: null,
      session: null,
      loading: true,
      userInfo: null,
      authType: null,

      // Supabase authentication methods
      signInWithPhone: async (phone: string) => {
        return await authService.signInWithPhone(phone);
      },

      verifyPhoneOtp: async (phone: string, token: string) => {
        return await authService.verifyPhoneOtp(phone, token);
      },

      signInWithEmail: async (email: string, password: string) => {
        return await authService.signInWithEmail(email, password);
      },

      signUpWithEmail: async (email: string, password: string, username?: string) => {
        return await authService.signUpWithEmail(email, password, username);
      },

      updateProfile: async (updates: Partial<UserProfile>) => {
        const { user } = get();
        if (!user) return { error: 'No user logged in' };
        return await authService.updateProfile(user.id, updates);
      },

      resetPassword: async (email: string) => {
        return await authService.resetPassword(email);
      },

      // ✅ ENHANCED: Legacy compatibility method with persistence
      setLoggedIn: (loggedIn, userInfo) => {
        console.log('🔐 setLoggedIn called with:', { loggedIn, userInfo });
        
        if (!loggedIn) {
          // User is logging out - clear all state
          console.log('🚪 Logging out user - clearing all state');
          set({ 
            isLoggedIn: false, 
            userInfo: null,
            user: null,
            profile: null,
            session: null,
            authType: null,
            loading: false 
          });
          return;
        }

        if (userInfo && loggedIn) {
          // For fallback authentication, create a comprehensive user profile
          const mockProfile: UserProfile = {
            id: `test_user_${Date.now()}`,
            username: userInfo.username,
            champs_username: userInfo.username,
            avatar_url: userInfo.avatar,
            profile_picture: userInfo.avatar,
            champs_id: `CH${Math.random().toString().slice(2, 14)}`,
            real_name: `Test User ${Math.random().toString().slice(7, 11)}`,
            quote: '🏆 Sports Wee Champion! Ready to dominate the game! 💪',
            email: `${userInfo.username.toLowerCase()}@sportswee.com`,
            phone: '+256772908010',
            level: 5,
            total_points: 1250,
            app_coins: 500,
            is_vip: false,
            full_name: `Test User ${Math.random().toString().slice(7, 11)}`
          };

          // Create mock user for compatibility
          const mockUser = {
            id: mockProfile.id,
            email: mockProfile.email,
            phone: mockProfile.phone,
            user_metadata: { username: userInfo.username },
            app_metadata: {},
            aud: 'authenticated',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            confirmed_at: new Date().toISOString(),
            email_confirmed_at: new Date().toISOString(),
            phone_confirmed_at: new Date().toISOString(),
            last_sign_in_at: new Date().toISOString(),
            role: 'authenticated',
            factors: []
          } as User;

          console.log('✅ Setting logged in state with persistence:', { 
            isLoggedIn: true, 
            userInfo,
            userId: mockUser.id,
            username: mockProfile.username 
          });
          
          // ✅ CRITICAL FIX: Set authType to 'test' to prevent Supabase override
          set({ 
            isLoggedIn: true, 
            userInfo,
            user: mockUser,
            profile: mockProfile,
            session: null, // Mock session for fallback
            authType: 'test', // ✅ Mark as test authentication
            loading: false 
          });
          
          console.log('✅ Test user profile created and persisted with full features:', mockProfile.username);
        }
      },

      logout: async () => {
        const { authType } = get();
        
        if (authType === 'supabase') {
          const { error } = await authService.signOut();
          if (error) {
            console.error('Error signing out from Supabase:', error);
          }
        }
        
        // Clear all state regardless of auth type
        set({ 
          isLoggedIn: false, 
          userInfo: null,
          user: null,
          profile: null,
          session: null,
          authType: null,
          loading: false 
        });
      },

      initializeAuth: async () => {
        try {
          set({ loading: true });
          
          // ✅ CRITICAL FIX: Check if we have test authentication first
          const currentState = get();
          if (currentState.authType === 'test' && currentState.isLoggedIn) {
            console.log('🔧 Test authentication found, skipping Supabase initialization');
            set({ loading: false });
            return;
          }
          
          // Only initialize Supabase if not using test auth
          await authService.initializeAuth();
          // State will be updated by the auth state listener for Supabase auth
        } catch (error) {
          console.error('Error initializing auth:', error);
          set({ 
            isLoggedIn: false, 
            user: null, 
            profile: null, 
            session: null, 
            userInfo: null, 
            authType: null,
            loading: false 
          });
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // ✅ Persist critical auth state
      partialize: (state) => ({
        isLoggedIn: state.isLoggedIn,
        userInfo: state.userInfo,
        user: state.user,
        profile: state.profile,
        authType: state.authType
      }),
    }
  )
);

// ✅ ENHANCED: Subscribe to auth state changes from Supabase with conflict prevention
authService.onAuthStateChange((authState: SupabaseAuthState) => {
  const { setState, getState } = useAuth;
  const currentState = getState();
  
  // ✅ CRITICAL FIX: Don't override test authentication
  if (currentState.authType === 'test' && currentState.isLoggedIn) {
    console.log('🔧 Preventing Supabase auth override of test authentication');
    return;
  }
  
  console.log('🔐 Supabase auth state change:', authState);
  
  // Convert profile to legacy userInfo format for compatibility
  const userInfo = authState.profile ? {
    username: authState.profile.champs_username || 
              authState.profile.username || 
              authState.profile.real_name || 
              'DefaultUser123',
    avatar: authState.profile.profile_picture || authState.profile.avatar_url
  } : null;

  setState({
    isLoggedIn: authState.isLoggedIn,
    user: authState.user,
    profile: authState.profile,
    session: authState.session,
    loading: authState.loading,
    authType: authState.isLoggedIn ? 'supabase' : null,
    userInfo, // For backward compatibility
  });
});

export default useAuth; 