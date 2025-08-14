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
import { useTheme, useThemeMode } from "@/hooks/useTheme";
import { useTranslation } from "react-i18next";
import useAuth from "@/hooks/useAuth";

import { MaterialCommunityIcons } from "@expo/vector-icons";
import supabase from "@/services/supabaseClient";
import OAuthWebView from "@/components/OAuthWebView";

GoogleSignin.configure({
  scopes: ["https://www.googleapis.com/auth/drive.readonly"],
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
  offlineAccess: true,
});

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
      router.replace("/(tabs)/profile");
    }
  }, [isLoggedIn, authLoading, router]);

  // Reset navigation flag when component unmounts or user logs out
  useEffect(() => {
    return () => {
      navigationAttempted.current = false;
    };
  }, []);

  // Handle Google Sign-In with Supabase OAuth
  const handleGoogleSignIn = async () => {
    if (!agreedToTerms) {
      setError("Please agree to the terms and conditions");
      return;
    }

    setError("");
    setSuccessMessage("");
    setIsSubmittingGoogle(true);

    try {
      console.log("🔐 Starting Google Sign-In process...");

      // Check if Google Play Services are available
      await GoogleSignin.hasPlayServices();

      // Sign in with Google
      const userInfo = await GoogleSignin.signIn();
      console.log("✅ Google Sign-In successful, user info received");

      if (userInfo?.data?.idToken) {
        console.log("🔐 ID token received, signing in with Supabase...");

        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: "google",
          token: userInfo.data.idToken,
        });

        if (error) {
          console.error("❌ Supabase sign-in error:", error);
          throw new Error(
            error.message || "Failed to authenticate with Supabase"
          );
        }

        if (data?.user) {
          console.log(
            "✅ Supabase authentication successful:",
            data.user.email
          );
          // The auth state change listener will handle navigation
        } else {
          throw new Error("No user data received from Supabase");
        }
      } else {
        console.error("❌ No ID token received from Google");
        throw new Error("No ID token received from Google Sign-In");
      }
    } catch (error: any) {
      console.error("❌ Google Sign-In error:", error);

      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        // user cancelled the login flow
        setError("Google Sign-In cancelled");
      } else if (error.code === statusCodes.IN_PROGRESS) {
        // operation (e.g. sign in) is in progress already
        setError("Google Sign-In in progress");
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        // play services not available or outdated
        setError("Google Play Services not available");
      } else {
        // some other error happened
        setError(error.message || "Google Sign-In failed. Please try again.");
      }
    } finally {
      setIsSubmittingGoogle(false);
    }
  };

  // Handle email/password authentication
  const handleEmailAuth = async () => {
    if (!agreedToTerms) {
      setError("Please agree to the terms and conditions");
      return;
    }

    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      console.log(`${isLogin ? "Login" : "Register"} with email:`, email);

      let result;
      if (isLogin) {
        // Sign in existing user
        result = await signInWithEmail(email, password);
      } else {
        // Sign up new user - username will be auto-generated
        result = await signUpWithEmail(email, password);
      }

      if (result.error) {
        console.error("Auth error:", result.error);
        setError(
          result.error.message || `Failed to ${isLogin ? "login" : "register"}`
        );
      } else {
        console.log(`✅ ${isLogin ? "Login" : "Registration"} successful`);

        if (isLogin) {
          // Login successful - navigation will be handled by auth state change
        } else {
          // Sign up successful - switch to login mode and show success message
          setIsLogin(true);
          setError(""); // Clear any previous errors
          setSuccessMessage(
            "Registration successful! Please check your email and verify your account, then sign in."
          );
          Alert.alert(
            "Registration Successful!",
            "Please check your email and click the verification link. Then you can sign in with your email and password.",
            [{ text: "OK" }]
          );
        }
      }
    } catch (error) {
      console.error("Auth error:", error);
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
        console.error("❌ Facebook OAuth error:", error);
        setError("Facebook Sign-In failed. Please try again.");
        return;
      }

      if (data?.url) {
        console.log("✅ Facebook OAuth URL received:", data.url);
        setOauthUrl(data.url);
        setShowOAuthWebView(true);
      } else {
        console.error("❌ No OAuth URL received from Facebook");
        setError("Facebook Sign-In failed. No OAuth URL received.");
      }
    } catch (error) {
      console.error("❌ Facebook Sign-In error:", error);
      setError("Facebook Sign-In failed. Please try again.");
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
      console.error("❌ Error opening password reset website:", error);
      Alert.alert(
        "Password Reset",
        "Unable to open password reset website. Please make sure the website is running or contact support.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Try Again", onPress: handleForgotPassword },
        ]
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
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace("/(tabs)/profile");
              }
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
                opacity: isSubmitting ? 0.6 : 1,
              },
            ]}
            onPress={handleGoogleSignIn}
            activeOpacity={0.7}
            disabled={isSubmitting}
          >
            {isSubmittingGoogle ? (
              <ActivityIndicator color="#5F6368" size="small" />
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

          // Facebook-style: Wait for auth state to be fully synchronized
          // The auth state change listener will handle navigation
          // No need to manually navigate here to prevent race conditions
          console.log("🔄 OAuth completed, waiting for auth state change...");
        }}
        onError={(error) => {
          console.error("❌ OAuth WebView error:", error);
          setShowOAuthWebView(false);
          setOauthUrl("");

          // Provide user-friendly error messages
          if (error.includes("email") || error.includes("Email")) {
            setError(
              "Social login failed: Please ensure your account has a verified email address. You can also try logging in with Google or Facebook instead."
            );
          } else if (error.includes("server_error")) {
            setError(
              "Social login failed: Server error. Please try again later or use a different login method."
            );
          } else if (error.includes("unexpected_failure")) {
            setError(
              "Social login failed: Please try again or use Google/Facebook login instead."
            );
          } else {
            setError(`Social login failed: ${error}`);
          }
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
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(239, 83, 80, 0.3)",
  },
  errorText: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
    textAlign: "center",
  },
  successContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(76, 175, 80, 0.3)",
  },
  successText: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
    textAlign: "center",
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
