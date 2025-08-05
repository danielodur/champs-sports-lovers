import { supabase } from "./supabaseClient";
import { Session, User, AuthError } from "@supabase/supabase-js";

export interface UserProfile {
  id: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  phone?: string;
  email?: string;
  champs_username?: string;
  real_name?: string;
  quote?: string;
  profile_picture?: string;
  champs_id?: string;
  level?: number;
  total_points?: number;
  app_coins?: number;
  is_vip?: boolean;
}

export interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  isLoggedIn: boolean;
}

class AuthService {
  private authStateCallbacks: ((state: AuthState) => void)[] = [];

  /**
   * Get the appropriate redirect URL for OAuth
   */
  private getRedirectUrl(): string {
    // For React Native/Expo, use a custom scheme
    // For web, use window.location.origin
    if (typeof window !== "undefined" && window.location) {
      return `${window.location.origin}/auth/callback`;
    }

    // For mobile apps, use the custom app scheme
    return "champs://auth/callback";
  }

  constructor() {
    // Listen to auth state changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔐 Auth state changed:", event);

      if (event === "SIGNED_IN" && session?.user) {
        try {
          await this.handleUserSignIn(session.user);
        } catch (error) {
          console.error("❌ Error handling user sign in:", error);
          // Still notify auth state change even if profile creation fails
          this.notifyAuthStateChange({
            user: session.user,
            profile: null,
            session,
            loading: false,
            isLoggedIn: true,
          });
        }
      } else if (event === "SIGNED_OUT") {
        // Clear current user from favorites service
        try {
          const { favoritesService } = await import("./favoritesService");
          favoritesService.setCurrentUser(null);
        } catch (error) {
          console.warn("⚠️ Warning: Could not clear favorites user:", error);
        }

        // Cleanup all user-specific services
        try {
          // Cleanup realtime service subscriptions
          const { realtimeService } = await import("./realtimeService");
          realtimeService.stopRealtimeSync();
          console.log("📡 REALTIME: Service cleaned up on sign out");

          // Clear social service user
          const { socialService } = await import("./socialService");
          socialService.setCurrentUser(null);
          console.log("👥 SOCIAL: Service cleared on sign out");

          // Clear invites service user
          const { invitesService } = await import("./invitesService");
          invitesService.setCurrentUser(null);
          console.log("📤 INVITES: Service cleared on sign out");

          // Clear messages service user
          const { messagesService } = await import("./messagesService");
          messagesService.setCurrentUser(null);
          console.log("💬 MESSAGES: Service cleared on sign out");

          // Clear chat service user
          const { chatService } = await import("./chatService");
          await chatService.cleanup();
          console.log("💬 CHAT: Service cleaned up on sign out");
        } catch (serviceError) {
          console.warn(
            "⚠️ Warning: Could not cleanup all services:",
            serviceError
          );
        }

        this.notifyAuthStateChange({
          user: null,
          profile: null,
          session: null,
          loading: false,
          isLoggedIn: false,
        });
      }
    });
  }

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChange(callback: (state: AuthState) => void): () => void {
    this.authStateCallbacks.push(callback);

    // Return unsubscribe function
    return () => {
      this.authStateCallbacks = this.authStateCallbacks.filter(
        (cb) => cb !== callback
      );
    };
  }

  /**
   * Notify all subscribers of auth state changes
   */
  private notifyAuthStateChange(state: AuthState) {
    this.authStateCallbacks.forEach((callback) => callback(state));
  }

  /**
   * Handle user sign in - fetch profile data and migrate legacy data if needed
   */
  private async handleUserSignIn(user: User) {
    try {
      // Set current user in favorites service
      const { favoritesService } = await import("./favoritesService");
      favoritesService.setCurrentUser(user.id);

      let profile = await this.getUserProfile(user.id);

      // If no profile exists, create one (new user) or migrate legacy data
      if (!profile) {
        console.log("👤 Creating new profile for user:", user.id);
        await this.createUserProfile(user);

        // Try to migrate legacy profile data if exists
        await this.migrateLegacyProfileData(user.id);

        // Fetch the updated profile
        profile = await this.getUserProfile(user.id);
      } else {
        // For existing users, try to migrate any remaining legacy data
        await this.migrateLegacyProfileData(user.id);

        // Refresh profile data after potential migration
        profile = await this.getUserProfile(user.id);
      }

      // Migrate legacy favorites after profile is set up
      try {
        await favoritesService.migrateLegacyFavorites();
      } catch (favError) {
        console.warn(
          "⚠️ Warning: Could not migrate legacy favorites:",
          favError
        );
      }

      // Initialize all user-specific services
      try {
        // Initialize realtime service for real-time features
        const { realtimeService } = await import("./realtimeService");
        await realtimeService.startRealtimeSync();
        console.log("📡 REALTIME: Service initialized for user");

        // Initialize social service for follows/fans
        const { socialService } = await import("./socialService");
        socialService.setCurrentUser(user.id);
        console.log("👥 SOCIAL: Service initialized for user");

        // Initialize invites service
        const { invitesService } = await import("./invitesService");
        invitesService.setCurrentUser(user.id);
        console.log("📤 INVITES: Service initialized for user");

        // Initialize messages service
        const { messagesService } = await import("./messagesService");
        messagesService.setCurrentUser(user.id);
        console.log("💬 MESSAGES: Service initialized for user");

        // Initialize chat service
        const { chatService } = await import("./chatService");
        chatService.setCurrentUser(user.id);
        console.log("💬 CHAT: Service initialized for user");
      } catch (serviceError) {
        console.warn(
          "⚠️ Warning: Could not initialize all services:",
          serviceError
        );
      }

      this.notifyAuthStateChange({
        user,
        profile,
        session: await supabase.auth
          .getSession()
          .then(({ data }) => data.session),
        loading: false,
        isLoggedIn: true,
      });
    } catch (error) {
      console.error("❌ Error handling user sign in:", error);
      this.notifyAuthStateChange({
        user,
        profile: null,
        session: await supabase.auth
          .getSession()
          .then(({ data }) => data.session),
        loading: false,
        isLoggedIn: true,
      });
    }
  }

  /**
   * Initialize auth state on app start
   */
  async initializeAuth(): Promise<AuthState> {
    try {
      console.log("🔐 Initializing auth state...");

      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error("❌ Error getting session:", error);
        return {
          user: null,
          profile: null,
          session: null,
          loading: false,
          isLoggedIn: false,
        };
      }

      if (session?.user) {
        const profile = await this.getUserProfile(session.user.id);

        const authState: AuthState = {
          user: session.user,
          profile,
          session,
          loading: false,
          isLoggedIn: true,
        };

        this.notifyAuthStateChange(authState);
        return authState;
      }

      const authState: AuthState = {
        user: null,
        profile: null,
        session: null,
        loading: false,
        isLoggedIn: false,
      };

      this.notifyAuthStateChange(authState);
      return authState;
    } catch (error) {
      console.error("❌ Error initializing auth:", error);
      const authState: AuthState = {
        user: null,
        profile: null,
        session: null,
        loading: false,
        isLoggedIn: false,
      };

      this.notifyAuthStateChange(authState);
      return authState;
    }
  }

  /**
   * Sign in with phone number (OTP)
   */
  async signInWithPhone(phone: string): Promise<{ error?: AuthError }> {
    try {
      console.log("📱 Signing in with phone:", phone);

      const { error } = await supabase.auth.signInWithOtp({
        phone,
        options: {
          channel: "sms",
        },
      });

      if (error) {
        console.error("❌ Phone sign in error:", error);
        return { error };
      }

      console.log("✅ OTP sent to phone:", phone);
      return {};
    } catch (error) {
      console.error("❌ Phone sign in error:", error);
      return { error: error as AuthError };
    }
  }

  //Sign in with WhatsApp number (OTP)
  async signInWithWhatsapp(phone: string): Promise<{ error?: AuthError }> {
    try {
      console.log("📱 Signing in with WhatsApp:", phone);

      // Validate phone number format
      if (!phone.startsWith("+")) {
        const error = new Error(
          "Phone number must be in international format (e.g., +1234567890)"
        ) as AuthError;
        console.error("❌ WhatsApp sign in error: Invalid phone format");
        return { error };
      }

      const { error } = await supabase.auth.signInWithOtp({
        phone,
        options: {
          channel: "whatsapp",
        },
      });

      if (error) {
        console.error("❌ WhatsApp sign in error:", error.message);

        // Provide more specific error messages
        if (
          error.message.includes("SMS provider") ||
          error.message.includes("configuration")
        ) {
          error.message =
            "WhatsApp provider not configured. Please contact support.";
        } else if (
          error.message.includes("channel") ||
          error.message.includes("WhatsApp")
        ) {
          error.message = "WhatsApp channel not supported by your provider.";
        } else if (
          error.message.includes("rate limit") ||
          error.message.includes("too many")
        ) {
          error.message =
            "Rate limit exceeded. Please wait before trying again.";
        }

        return { error };
      }

      console.log("✅ OTP sent to WhatsApp:", phone);
      return {};
    } catch (error) {
      console.error("❌ WhatsApp sign in error:", error);
      return { error: error as AuthError };
    }
  }

  /**
   * Verify phone OTP
   */
  async verifyPhoneOtp(
    phone: string,
    token: string
  ): Promise<{ error?: AuthError }> {
    try {
      console.log("🔐 Verifying OTP for phone:", phone);

      const { error } = await supabase.auth.verifyOtp({
        phone,
        token,
        type: "sms",
      });

      if (error) {
        console.error("❌ OTP verification error:", error);
        return { error };
      }

      console.log("✅ Phone OTP verified successfully");
      return {};
    } catch (error) {
      console.error("❌ OTP verification error:", error);
      return { error: error as AuthError };
    }
  }

  /**
   * Sign in with email and password
   */
  async signInWithEmail(
    email: string,
    password: string
  ): Promise<{ error?: AuthError }> {
    try {
      console.log("📧 Signing in with email:", email);

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("❌ Email sign in error:", error);
        return { error };
      }

      console.log("✅ Email sign in successful");
      return {};
    } catch (error) {
      console.error("❌ Email sign in error:", error);
      return { error: error as AuthError };
    }
  }

  /**
   * Generate a unique username that's not already in the database
   */
  private async generateUniqueUsername(baseUsername: string): Promise<string> {
    let username = baseUsername;
    let counter = 1;
    const maxAttempts = 100; // Prevent infinite loops

    while (counter <= maxAttempts) {
      try {
        // Check if username exists
        const { data, error } = await supabase
          .from("profiles")
          .select("username")
          .eq("username", username)
          .single();

        if (error && error.code === "PGRST116") {
          // Username doesn't exist, we can use it
          console.log(`✅ Generated unique username: ${username}`);
          return username;
        }

        if (error) {
          console.error("❌ Error checking username:", error);
          break;
        }

        // Username exists, try with counter
        username = `${baseUsername}${counter}`;
        counter++;
      } catch (error) {
        console.error("❌ Error in username generation:", error);
        break;
      }
    }

    // Fallback: use timestamp-based username
    const fallbackUsername = `user_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 5)}`;
    console.log(`🔄 Using fallback username: ${fallbackUsername}`);
    return fallbackUsername;
  }

  /**
   * Sign up with email and password
   */
  async signUpWithEmail(
    email: string,
    password: string,
    username?: string
  ): Promise<{ error?: AuthError }> {
    try {
      console.log("📧 Signing up with email:", email);

      // Generate unique username if not provided
      let uniqueUsername: string;
      if (username) {
        uniqueUsername = await this.generateUniqueUsername(username);
      } else {
        // Generate username from email
        const emailUsername = email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "");
        uniqueUsername = await this.generateUniqueUsername(emailUsername);
      }

      console.log(`🎯 Using unique username: ${uniqueUsername}`);

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: uniqueUsername,
          },
        },
      });

      if (error) {
        console.error("❌ Email sign up error:", error);
        return { error };
      }

      console.log("✅ Email sign up successful with unique username");

      // Note: User needs to verify email before they can sign in
      // Return success without auto sign-in - user will need to sign in manually after email verification
      return {};
    } catch (error) {
      console.error("❌ Email sign up error:", error);
      return { error: error as AuthError };
    }
  }

  /**
   * Sign out user
   */
  async signOut(): Promise<{ error?: AuthError }> {
    try {
      console.log("🔐 Signing out user...");

      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("❌ Sign out error:", error);
        return { error };
      }

      console.log("✅ User signed out successfully");
      return {};
    } catch (error) {
      console.error("❌ Sign out error:", error);
      return { error: error as AuthError };
    }
  }

  /**
   * Get user profile from database
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("❌ Error fetching user profile:", error);
        return null;
      }

      return data as UserProfile;
    } catch (error) {
      console.error("❌ Error fetching user profile:", error);
      return null;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(
    userId: string,
    updates: Partial<UserProfile>
  ): Promise<{ error?: any }> {
    try {
      console.log("👤 Updating user profile:", userId);

      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", userId);

      if (error) {
        console.error("❌ Profile update error:", error);
        return { error };
      }

      console.log("✅ Profile updated successfully");

      // Refresh auth state with updated profile
      const session = await supabase.auth.getSession();
      if (session.data.session?.user) {
        await this.handleUserSignIn(session.data.session.user);
      }

      return {};
    } catch (error) {
      console.error("❌ Profile update error:", error);
      return { error };
    }
  }

  /**
   * Get current session
   */
  async getCurrentSession(): Promise<Session | null> {
    const { data } = await supabase.auth.getSession();
    return data.session;
  }

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<User | null> {
    const { data } = await supabase.auth.getUser();
    return data.user;
  }

  /**
   * Reset password with email
   */
  async resetPassword(email: string): Promise<{ error?: AuthError }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);

      if (error) {
        console.error("❌ Password reset error:", error);
        return { error };
      }

      return {};
    } catch (error) {
      console.error("❌ Password reset error:", error);
      return { error: error as AuthError };
    }
  }

  /**
   * Sign in with Google
   */
  async signInWithGoogle(): Promise<{ error?: AuthError; url?: string }> {
    try {
      console.log("🔐 Signing in with Google");

      const redirectUrl = this.getRedirectUrl();
      console.log("🔐 Using redirect URL:", redirectUrl);

      const { error, data } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
          skipBrowserRedirect: true,
        },
      });

      console.log("🔐 OAuth response data:", data);
      console.log("🔐 OAuth response error:", error);

      if (error) {
        console.error("❌ Google sign in error:", error);
        return { error };
      }

      if (data?.url) {
        console.log("🌐 OAuth URL generated for WebView:", data.url);
        return { url: data.url };
      }

      console.log("✅ Google sign in initiated");
      return {};
    } catch (error) {
      console.error("❌ Google sign in error:", error);
      return { error: error as AuthError };
    }
  }

  /**
   * Sign in with Facebook
   */
  async signInWithFacebook(): Promise<{ error?: AuthError; url?: string }> {
    try {
      console.log("🔐 Signing in with Facebook");

      const { error, data } = await supabase.auth.signInWithOAuth({
        provider: "facebook",
        options: {
          redirectTo: this.getRedirectUrl(),
          queryParams: {
            scope: "email,public_profile",
          },
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        console.error("❌ Facebook sign in error:", error);
        return { error };
      }

      if (data?.url) {
        console.log("🌐 Facebook OAuth URL generated for WebView:", data.url);
        return { url: data.url };
      }

      console.log("✅ Facebook sign in initiated");
      return {};
    } catch (error) {
      console.error("❌ Facebook sign in error:", error);
      return { error: error as AuthError };
    }
  }

  /**
   * Generic social sign in method
   */
  async signInWithSocial(
    provider: "google" | "facebook"
  ): Promise<{ error?: AuthError; url?: string }> {
    try {
      console.log(`🔐 Signing in with ${provider}`);

      const { error, data } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: this.getRedirectUrl(),
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        console.error(`❌ ${provider} sign in error:`, error);
        return { error };
      }

      if (data?.url) {
        console.log(
          `🌐 ${provider} OAuth URL generated for WebView:`,
          data.url
        );
        return { url: data.url };
      }

      console.log(`✅ ${provider} sign in initiated`);
      return {};
    } catch (error) {
      console.error(`❌ ${provider} sign in error:`, error);
      return { error: error as AuthError };
    }
  }

  /**
   * Create user profile when new user signs up
   */
  private async createUserProfile(user: User): Promise<void> {
    try {
      const { profileService } = await import("./profileService");

      // Handle cases where user doesn't have email
      const userEmail = user.email || user.user_metadata?.email || null;

      const profileData = {
        id: user.id,
        username:
          user.user_metadata?.username ||
          user.user_metadata?.name ||
          `user_${Date.now()}`,
        email: userEmail,
        phone: user.phone,
        champs_id: profileService.generateChampsId(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from("profiles").insert([profileData]);

      if (error) {
        console.error("❌ Error creating user profile:", error);
      } else {
        console.log("✅ User profile created successfully");
      }
    } catch (error) {
      console.error("❌ Error creating user profile:", error);
    }
  }

  /**
   * Migrate legacy profile data to Supabase
   */
  private async migrateLegacyProfileData(userId: string): Promise<void> {
    try {
      const { profileService } = await import("./profileService");
      await profileService.migrateLegacyProfile(userId);
    } catch (error) {
      console.error("❌ Error migrating legacy profile data:", error);
    }
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;
