import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Alert,
  ActivityIndicator,
  Linking,
} from "react-native";
import {
  GoogleSignin,
  GoogleSigninButton,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import { useRouter } from "expo-router";
import { ChevronLeft, Trophy, Eye, EyeOff, Chrome } from "lucide-react-native";
import { useTheme, useThemeMode } from "../hooks/useTheme";
import { useTranslation } from "react-i18next";
import useAuth from "../hooks/useAuth";

import { MaterialCommunityIcons } from "@expo/vector-icons";
import supabase from "../services/supabaseClient";
import OAuthWebView from "../components/OAuthWebView";
import { SafeNavigation } from "../utils/navigationUtils";
import {
  sanitizeErrorMessage,
  AUTH_ERRORS,
  VALIDATION_ERRORS,
} from "../utils/errorUtils";

GoogleSignin.configure({
  scopes: ["openid", "profile", "email"],
  webClientId:
    process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ||
    "65605327855-bbjb8tsm97ee40lquj4053218i1kurt2.apps.googleusercontent.com",
  iosClientId:
    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ||
    "65605327855-bbjb8tsm97ee40lquj4053218i1kurt2.apps.googleusercontent.com",
  offlineAccess: false,
  forceCodeForRefreshToken: true,

  // If you need offline access, uncomment the following and add your server web client ID:
  // offlineAccess: true,
  // serverClientId: process.env.EXPO_PUBLIC_GOOGLE_SERVER_CLIENT_ID,

  // To get a server client ID:
  // 1. Go to Google Cloud Console
  // 2. Navigate to APIs & Services → Credentials
  // 3. Create a new "Web application" client ID
  // 4. Add it to your .env file as EXPO_PUBLIC_GOOGLE_SERVER_CLIENT_ID
});

// Email validation function
function validateEmail(email: string): string | null {
  if (!email) {
    return VALIDATION_ERRORS.EMAIL_REQUIRED;
  }

  if (!email.includes("@")) {
    return VALIDATION_ERRORS.EMAIL_INVALID;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return VALIDATION_ERRORS.EMAIL_INVALID;
  }

  return null;
}

// Password validation function
function validatePassword(
  password: string,
  isRegistering: boolean = false,
): string | null {
  if (!password) {
    return VALIDATION_ERRORS.PASSWORD_REQUIRED;
  }

  if (isRegistering && password.length < 6) {
    return VALIDATION_ERRORS.PASSWORD_TOO_SHORT;
  }

  return null;
}

export default function LoginScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { theme: themeMode } = useThemeMode();
  const { t } = useTranslation();
  const {
    signInWithEmail,
    signUpWithEmail,
    isLoggedIn,
    loading: authLoading,
    signInWithGoogle,
    signInWithFacebook,
  } = useAuth();

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true); // Toggle between login/register
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Loading and error states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittingGoogle, setIsSubmittingGoogle] = useState(false);
  const [isSubmittingFacebook, setIsSubmittingFacebook] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // OAuth WebView state
  const [oauthUrl, setOauthUrl] = useState("");
  const [showOAuthWebView, setShowOAuthWebView] = useState(false);

  // Facebook-style navigation control to prevent race conditions
  const navigationAttempted = useRef(false);
  const authStateChangeListener = useRef<any>(null);

  // Initialize auth state change listener
  useEffect(() => {
    console.log("🔐 Setting up auth state change listener...");

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: string, session: any) => {
      console.log("🔄 Auth state change:", event, session?.user?.email);

      if (event === "SIGNED_IN" && session && !navigationAttempted.current) {
        console.log("✅ Auth state change: SIGNED_IN - navigating to profile");
        navigationAttempted.current = true;

        // Use a small delay to ensure all auth state is properly synchronized
        setTimeout(() => {
          router.replace("/(tabs)/profile");
        }, 300);
      }
    });

    authStateChangeListener.current = subscription;

    return () => {
      if (authStateChangeListener.current) {
        authStateChangeListener.current.unsubscribe();
      }
    };
  }, [router]);

  // Auto-navigate when user is logged in (for direct access)
  useEffect(() => {
    if (isLoggedIn && !authLoading && !navigationAttempted.current) {
      console.log("✅ User is logged in, navigating to main app...");
      navigationAttempted.current = true;

      // Show success message briefly before navigation
      setSuccessMessage("Welcome! Redirecting to your profile...");
      setError("");

      // Small delay to show success message
      setTimeout(() => {
        router.replace("/(tabs)/profile");
      }, 500);
    }
  }, [isLoggedIn, authLoading, router]);

  // Reset navigation flag when component unmounts or user logs out
  useEffect(() => {
    return () => {
      navigationAttempted.current = false;
    };
  }, []);

  // Handle Google Sign-In with enhanced error handling and debugging
  const handleGoogleSignIn = async () => {
    if (!agreedToTerms) {
      setError(AUTH_ERRORS.TERMS_NOT_AGREED);
      return;
    }

    setError("");
    setSuccessMessage("");
    setIsSubmittingGoogle(true);

    try {
      console.log("🔐 Starting enhanced Google Sign-In process...");

      // Check if Google Play Services are available (Android only)
      if (Platform.OS === "android") {
        try {
          await GoogleSignin.hasPlayServices({
            showPlayServicesUpdateDialog: true,
          });
          console.log("✅ Google Play Services check passed");
        } catch (playServicesError) {
          console.log("❌ Google Play Services error");
          throw new Error(
            "Google Play Services is required. Please update Google Play Services and try again.",
          );
        }
      }

      // Attempt Google Sign-In
      const userInfo = await GoogleSignin.signIn();
      console.log("✅ Google Sign-In successful, user info received:", {
        hasIdToken: !!userInfo?.data?.idToken,
        email: userInfo?.data?.user?.email,
        name: userInfo?.data?.user?.name,
        idTokenLength: userInfo?.data?.idToken?.length || 0,
      });

      // Validate we have the required tokens
      if (!userInfo?.data?.idToken) {
        console.log("❌ No ID token received from Google");
        console.log("Full userInfo structure received");

        // Try to get current user as fallback
        const currentUser = await GoogleSignin.getCurrentUser();
        if (currentUser?.idToken) {
          console.log("✅ Found ID token in current user");
          if (userInfo.data) {
            userInfo.data = {
              ...userInfo.data,
              idToken: currentUser.idToken || "",
            };
          }
        } else {
          throw new Error("Google sign-in failed. Please try again.");
        }
      }

      // Authenticate with Supabase
      console.log("🔐 Authenticating with Supabase using ID token...");

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: userInfo.data?.idToken || "",
      });

      if (error) {
        console.log("❌ Supabase authentication failed");

        // Use professional error sanitizer for Supabase errors
        const friendlyMessage = sanitizeErrorMessage(error);
        throw new Error(friendlyMessage);
      }

      if (data?.user) {
        console.log("✅ Supabase authentication successful:", {
          email: data.user.email,
          id: data.user.id,
          provider: data.user.app_metadata?.provider,
        });

        // Set success message
        setSuccessMessage(`Welcome ${data.user.email}! Redirecting...`);

        // The auth state change listener will handle navigation
      } else {
        throw new Error("Authentication failed. Please try again.");
      }
    } catch (error: any) {
      console.log("❌ Google Sign-In failed");

      let errorMessage = "Google sign-in failed. Please try again.";

      // Handle specific error codes with professional messages
      switch (error.code) {
        case statusCodes.SIGN_IN_CANCELLED:
          errorMessage = "Google sign-in was cancelled. Please try again.";
          break;
        case statusCodes.IN_PROGRESS:
          errorMessage =
            "Google sign-in is already in progress. Please wait a moment.";
          break;
        case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
          errorMessage =
            "Google Play Services is required. Please update Google Play Services and try again.";
          break;
        case statusCodes.SIGN_IN_REQUIRED:
          errorMessage = "Please sign in with Google to continue.";
          break;
        default:
          // Use our professional error sanitizer
          errorMessage = sanitizeErrorMessage(error);
      }

      setError(errorMessage);

      // Clean up on error
      try {
        await GoogleSignin.signOut();
        await supabase.auth.signOut();
        console.log("🧹 Cleaned up authentication state after error");
      } catch (cleanupError) {
        console.warn("⚠️ Could not clean up after error:", cleanupError);
      }
    } finally {
      setIsSubmittingGoogle(false);
    }
  };

  // Handle email/password authentication
  const handleEmailAuth = async () => {
    if (!agreedToTerms) {
      setError(AUTH_ERRORS.TERMS_NOT_AGREED);
      return;
    }

    // Validate email format
    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }

    // Validate password
    const passwordError = validatePassword(password, !isLogin);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setSuccessMessage(""); // Clear previous success messages

    try {
      console.log(
        `🔐 ${isLogin ? "Login" : "Registration"} attempt for:`,
        email,
      );

      let result;
      if (isLogin) {
        // Sign in existing user
        result = await signInWithEmail(email, password);
      } else {
        // Sign up new user - username will be auto-generated
        result = await signUpWithEmail(email, password);
      }

      if (result.error) {
        // Log error for debugging without exposing raw error object
        console.log("Authentication failed:", result.error.message);
        // Use the already sanitized error message from authService
        const errorMessage =
          result.error.message || "An error occurred. Please try again.";

        // Add context for better user guidance
        if (errorMessage.includes("Invalid email or password") && !isLogin) {
          setError(
            "Registration failed. This email may already be registered. Try signing in instead.",
          );
        } else {
          setError(errorMessage);
        }
      } else {
        console.log(`✅ ${isLogin ? "Login" : "Registration"} successful`);

        if (isLogin) {
          // Login successful - show immediate feedback and let auth state handle navigation
          setError("");
          setSuccessMessage("Welcome back! Signing you in...");

          // Additional check: if auth state doesn't change within 3 seconds, force navigation
          setTimeout(() => {
            if (!navigationAttempted.current) {
              console.log("🔄 Auth state change delayed, forcing navigation");
              navigationAttempted.current = true;
              router.replace("/(tabs)/profile");
            }
          }, 3000);
        } else {
          // Sign up successful - switch to login mode and show success message
          setIsLogin(true);
          setError(""); // Clear any previous errors
          setSuccessMessage(
            "Registration successful! Please check your email to verify your account, then sign in below.",
          );

          // Clear form for fresh login
          setPassword("");
        }
      }
    } catch (error: any) {
      console.log("Unexpected auth error occurred");
      // Fallback error message for unexpected errors
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFacebookSignIn = async () => {
    if (!agreedToTerms) {
      setError("Please agree to the terms and conditions");
      return;
    }

    setIsSubmittingFacebook(true);
    setError("");
    setSuccessMessage("");
    console.log("🔐 Starting Facebook Sign-In process...");

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "facebook",
        options: {
          redirectTo:
            "https://mfjxwtlqmvdujxpwnrvf.supabase.co/auth/v1/callback",
          queryParams: {
            scope: "email,public_profile",
          },
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        console.log("❌ Facebook OAuth failed");
        const friendlyErrorMessage = sanitizeErrorMessage(error);
        setError(friendlyErrorMessage);
        return;
      }

      if (data?.url) {
        console.log("✅ Facebook OAuth URL received:", data.url);
        setOauthUrl(data.url);
        setShowOAuthWebView(true);
      } else {
        console.log("❌ No OAuth URL received from Facebook");
        setError(AUTH_ERRORS.GENERIC_ERROR);
      }
    } catch (error: any) {
      console.log("Facebook Sign-In failed");
      const friendlyErrorMessage = sanitizeErrorMessage(error);
      setError(friendlyErrorMessage);
    } finally {
      setIsSubmittingFacebook(false);
    }
  };

  // Handle phone OTP authentication
  const handlePhoneAuth = () => {
    router.push("/register-and-login");
  };

  // Handle social login
  const handleSocialLogin = async (provider: string) => {
    console.log(`🔐 ${provider} login pressed`);

    if (!agreedToTerms) {
      setError("Please agree to the terms and conditions");
      return;
    }

    // For now, only Google is implemented with native sign-in
    if (provider.toLowerCase() === "google") {
      await handleGoogleSignIn();
    }
    if (provider.toLowerCase() === "facebook") {
      await handleFacebookSignIn();
    }
  };

  // Handle recover account
  const handleRecoverAccount = () => {
    router.push("/recover-account");
  };

  // Handle forgot password
  const handleForgotPassword = async () => {
    try {
      // Get the password reset website URL from environment variables
      const passwordResetUrl =
        process.env.EXPO_PUBLIC_PASSWORD_RESET_WEBSITE! ||
        "http://localhost:3000";

      console.log("🔐 Opening password reset website:", passwordResetUrl);

      // Check if the URL can be opened
      const canOpen = await Linking.canOpenURL(passwordResetUrl);

      if (canOpen) {
        await Linking.openURL(passwordResetUrl);
        console.log("✅ Password reset website opened successfully");
      } else {
        console.log("⚠️ Cannot open URL, trying fallback");
        // Fallback to localhost for development
        await Linking.openURL("http://localhost:3000");
      }
    } catch (error) {
      console.log("❌ Error opening password reset website");
      Alert.alert(
        "Password Reset",
        "Unable to open password reset website. Please make sure the website is running or contact support.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Try Again", onPress: handleForgotPassword },
        ],
      );
    }
  };

  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
      <ScrollView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Back Button and Recover Account */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              // Navigate immediately without timeout
              SafeNavigation.goBack(router, "/(tabs)/profile", "replace");
            }}
            style={[styles.backButton, { marginTop: 40 }]}
            activeOpacity={0.7}
          >
            <ChevronLeft size={28} color={theme.colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.recoverButton, { marginTop: 40 }]}
            onPress={handleRecoverAccount}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.recoverText,
                { color: theme.colors.textSecondary },
              ]}
            >
              Recover Account
            </Text>
          </TouchableOpacity>
        </View>

        {/* Main Content Area */}
        <View style={styles.mainContent}>
          {/* Logo Section */}
          <View style={styles.logoContainer}>
            <View
              style={[
                styles.logoBackground,
                { backgroundColor: theme.colors.primary },
              ]}
            >
              <Trophy size={40} color="#FFFFFF" />
            </View>
            <Text style={[styles.appName, { color: theme.colors.text }]}>
              Champs
            </Text>
          </View>

          {/* Form Section */}
          <View style={styles.formContainer}>
            {/* Error Message */}
            {error ? (
              <View
                style={[
                  styles.errorContainer,
                  { backgroundColor: theme.colors.error + "20" },
                ]}
              >
                <Text style={[styles.errorText, { color: theme.colors.error }]}>
                  {error}
                </Text>
              </View>
            ) : null}

            {/* Success Message */}
            {successMessage ? (
              <View
                style={[
                  styles.successContainer,
                  { backgroundColor: theme.colors.primary + "20" },
                ]}
              >
                <Text
                  style={[styles.successText, { color: theme.colors.primary }]}
                >
                  {successMessage}
                </Text>
              </View>
            ) : null}

            {/* Email Input */}
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.backgroundSecondary,
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
                },
                Platform.select({ web: { outlineStyle: "none" } as any }),
              ]}
              placeholder={t("Enter your email")}
              placeholderTextColor={theme.colors.textSecondary}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setError(""); // Clear error when user types
                setSuccessMessage(""); // Clear success message when user types
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            {/* Password Input */}
            <View
              style={[
                styles.passwordContainer,
                {
                  backgroundColor: theme.colors.backgroundSecondary,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <TextInput
                style={[
                  styles.passwordInput,
                  {
                    color: theme.colors.text,
                  },
                  Platform.select({ web: { outlineStyle: "none" } as any }),
                ]}
                placeholder={t("Enter your password")}
                placeholderTextColor={theme.colors.textSecondary}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setError(""); // Clear error when user types
                  setSuccessMessage(""); // Clear success message when user types
                }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                {showPassword ? (
                  <EyeOff size={20} color={theme.colors.textSecondary} />
                ) : (
                  <Eye size={20} color={theme.colors.textSecondary} />
                )}
              </TouchableOpacity>
            </View>

            {/* Forgot Password */}
            <TouchableOpacity
              style={styles.forgotPassword}
              activeOpacity={0.7}
              onPress={handleForgotPassword}
            >
              <Text
                style={[
                  styles.forgotPasswordText,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {t("Forgot Password?")}
              </Text>
            </TouchableOpacity>

            {/* Terms and Conditions */}
            <View style={styles.termsContainer}>
              <TouchableOpacity
                style={styles.checkbox}
                onPress={() => setAgreedToTerms(!agreedToTerms)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.checkboxInner,
                    {
                      borderColor: theme.colors.border,
                      backgroundColor: agreedToTerms
                        ? theme.colors.primary
                        : "transparent",
                    },
                  ]}
                />
              </TouchableOpacity>
              <Text
                style={[
                  styles.termsText,
                  { color: theme.colors.textSecondary },
                ]}
              >
                I have read and agree to the{" "}
                <Text style={{ color: theme.colors.primary }}>
                  User Agreement
                </Text>{" "}
                and{" "}
                <Text style={{ color: theme.colors.primary }}>
                  Privacy Policy
                </Text>
              </Text>
            </View>

            {/* Email Auth Button */}
            <TouchableOpacity
              style={[
                styles.loginButton,
                {
                  backgroundColor:
                    agreedToTerms && !isSubmitting ? "#EF5350" : "#CCCCCC",
                  opacity: agreedToTerms && !isSubmitting ? 1 : 0.6,
                },
              ]}
              disabled={!agreedToTerms || isSubmitting}
              onPress={handleEmailAuth}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text
                  style={[
                    styles.loginButtonText,
                    { color: agreedToTerms ? "#FFFFFF" : "#999999" },
                  ]}
                >
                  {isLogin ? t("Login") : t("Register")}
                </Text>
              )}
            </TouchableOpacity>

            {/* Toggle Login/Register */}
            <TouchableOpacity
              style={styles.toggleButton}
              onPress={() => {
                setIsLogin(!isLogin);
                setError("");
                setSuccessMessage("");
              }}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.toggleButtonText,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {isLogin
                  ? t("Need an account? Register")
                  : t("Have an account? Login")}
              </Text>
            </TouchableOpacity>

            {/* Phone OTP Button */}
            <TouchableOpacity
              style={styles.phoneButton}
              onPress={handlePhoneAuth}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.phoneButtonText,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {t("Login/Register with Phone")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom Spacer */}
        <View style={styles.bottomSpacer} />

        {/* Social Login Section */}
        <View style={styles.socialContainer}>
          <TouchableOpacity
            style={[
              styles.socialButton,
              {
                backgroundColor: "#FFFFFF",
                borderWidth: 1,
                borderColor: "#DADCE0",
                opacity: isSubmitting || isSubmittingGoogle ? 0.6 : 1,
              },
            ]}
            onPress={handleGoogleSignIn}
            disabled={isSubmitting || isSubmittingGoogle}
          >
            {isSubmittingGoogle ? (
              <ActivityIndicator size="small" color="#4285F4" />
            ) : (
              <GoogleSigninButton
                size={GoogleSigninButton.Size.Icon}
                color={GoogleSigninButton.Color.Dark}
              />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.socialButton,
              {
                backgroundColor: "#1877F2",
                opacity: isSubmitting ? 0.6 : 1,
              },
            ]}
            onPress={() => handleSocialLogin("facebook")}
            activeOpacity={0.7}
            disabled={isSubmitting}
          >
            {isSubmittingFacebook ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <MaterialCommunityIcons
                name="facebook"
                size={24}
                color="#FFFFFF"
              />
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* OAuth WebView for Facebook Login */}
      <OAuthWebView
        visible={showOAuthWebView}
        url={oauthUrl}
        onClose={() => {
          console.log("🔐 OAuth WebView closed");
          setShowOAuthWebView(false);
          setOauthUrl("");
        }}
        onSuccess={(url) => {
          console.log("✅ OAuth WebView success:", url);
          setShowOAuthWebView(false);
          setOauthUrl("");
          console.log("🔄 OAuth completed, waiting for auth state change...");
        }}
        onError={(error) => {
          console.log("❌ OAuth WebView error occurred");
          setShowOAuthWebView(false);
          setOauthUrl("");

          // Use professional error sanitizer for all OAuth errors
          const friendlyErrorMessage = sanitizeErrorMessage(error);
          setError(friendlyErrorMessage);
        }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 40,
    zIndex: 1,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  recoverButton: {
    padding: 8,
    borderRadius: 8,
  },
  recoverText: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
  },
  mainContent: {
    flex: 1,
    justifyContent: "center",
    minHeight: 500,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoBackground: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  appName: {
    fontSize: 24,
    fontFamily: "Inter-Bold",
  },
  formContainer: {
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
  },
  errorContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: "rgba(239, 83, 80, 0.4)",
    shadowColor: "#EF5350",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  errorText: {
    fontSize: 15,
    fontFamily: "Inter-Medium",
    textAlign: "center",
    lineHeight: 22,
  },
  successContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: "rgba(76, 175, 80, 0.4)",
    shadowColor: "#4CAF50",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  successText: {
    fontSize: 15,
    fontFamily: "Inter-Medium",
    textAlign: "center",
    lineHeight: 22,
  },
  input: {
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
    fontSize: 16,
    fontFamily: "Inter-Regular",
    borderWidth: 1,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
  },
  passwordInput: {
    flex: 1,
    height: "100%",
    backgroundColor: "transparent",
    fontSize: 16,
    fontFamily: "Inter-Regular",
  },
  eyeIcon: {
    padding: 8,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 16,
    padding: 4,
    borderRadius: 4,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
  },
  termsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  checkbox: {
    width: 24,
    height: 24,
    marginRight: 8,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 4,
  },
  checkboxInner: {
    width: 16,
    height: 16,
    borderWidth: 1,
    borderRadius: 4,
  },
  termsText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter-Regular",
  },
  loginButton: {
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loginButtonText: {
    fontSize: 16,
    fontFamily: "Inter-SemiBold",
  },
  toggleButton: {
    alignItems: "center",
    padding: 8,
    borderRadius: 8,
    marginBottom: 16,
  },
  toggleButtonText: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
  },
  phoneButton: {
    alignItems: "center",
    padding: 8,
    borderRadius: 8,
    marginBottom: 16,
  },
  phoneButtonText: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
  },
  bottomSpacer: {
    height: 60,
  },
  socialContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    paddingBottom: 20,
  },
  socialButton: {
    width: 48,
    height: 48,
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  socialIcon: {
    width: 32,
    height: 32,
  },
  facebookIcon: {
    fontSize: 20,
    fontFamily: "Inter-Bold",
    color: "#FFFFFF",
  },
});
