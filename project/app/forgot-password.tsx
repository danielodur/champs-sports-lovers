import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, X, Eye, EyeOff } from "lucide-react-native";
import { useTheme } from "../hooks/useTheme";
import { formatPhoneNumber } from "../utils/phoneFormatter";
import { useFocusEffect } from "expo-router";
import { SafeNavigation } from "../utils/navigationUtils";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [phone, setPhone] = useState("");

  const handlePhoneChange = (text: string) => {
    const formattedNumber = formatPhoneNumber(text);
    setPhone(formattedNumber);
  };
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const [codeSent, setCodeSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  React.useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    } else if (interval) {
      clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timer]);

  const handleSendCode = () => {
    if (!phone) {
      Alert.alert("Error", "Please enter your phone number.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setCodeSent(true);
      setTimer(40);
      Alert.alert(
        "Verification Code Sent",
        "A verification code has been sent to your phone number.",
      );
    }, 1200);
  };

  const handleSubmit = () => {
    if (!phone || !password || !confirmPassword || !code) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert(
        "Success",
        "Your password has been reset. Please log in with your new password.",
      );
      router.replace("/login-register");
    }, 1200);
  };

  // Helper to check if form is dirty or waiting for code
  const isDirty =
    phone.length > 0 ||
    password.length > 0 ||
    confirmPassword.length > 0 ||
    code.length > 0 ||
    timer > 0;

  // Intercept back button
  const handleBackPress = () => {
    if (isDirty) {
      Alert.alert(
        "Are you sure?",
        "You are advised to reset your password before leaving this screen. Are you sure you want to go back?",
        [
          { text: "No", style: "cancel" },
          {
            text: "Yes",
            style: "destructive",
            onPress: () =>
              SafeNavigation.goBack(router, "/login-register", "replace"),
          },
        ],
      );
    } else {
      SafeNavigation.goBack(router, "/login-register", "replace");
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
        >
          <View
            style={[
              styles.header,
              { backgroundColor: theme.colors.backgroundSecondary },
            ]}
          >
            <ChevronLeft
              size={28}
              color={theme.colors.text}
              onPress={handleBackPress}
              style={styles.backButton}
            />
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
              Forgot Password
            </Text>
            <View style={styles.headerRight} />
          </View>
          <View style={styles.content}>
            <View style={[styles.row, styles.pickerRow]}>
              <View style={{ flex: 1, position: "relative" }}>
                <TextInput
                  style={[
                    styles.input,
                    styles.inputAligned,
                    {
                      backgroundColor: theme.colors.backgroundSecondary,
                      color: theme.colors.text,
                      borderColor: theme.colors.border,
                    },
                  ]}
                  placeholder="0772 908 010"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={phone}
                  onChangeText={handlePhoneChange}
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {phone.length > 0 && (
                  <TouchableOpacity
                    style={styles.clearButton}
                    onPress={() => setPhone("")}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <X size={18} color="#A0A0A0" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
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
                style={[styles.passwordInput, { color: theme.colors.text }]}
                placeholder="Enter new password"
                placeholderTextColor={theme.colors.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword((v) => !v)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                {showPassword ? (
                  <EyeOff size={20} color={theme.colors.textSecondary} />
                ) : (
                  <Eye size={20} color={theme.colors.textSecondary} />
                )}
              </TouchableOpacity>
            </View>
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
                style={[styles.passwordInput, { color: theme.colors.text }]}
                placeholder="Confirm new password"
                placeholderTextColor={theme.colors.textSecondary}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowConfirmPassword((v) => !v)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                {showConfirmPassword ? (
                  <EyeOff size={20} color={theme.colors.textSecondary} />
                ) : (
                  <Eye size={20} color={theme.colors.textSecondary} />
                )}
              </TouchableOpacity>
            </View>
            <View style={styles.passwordStandardBox}>
              <Text style={styles.passwordStandardTitle}>
                Password must contain:
              </Text>
              <Text style={styles.passwordStandardItem}>
                • At least 6 characters
              </Text>
              <Text style={styles.passwordStandardItem}>
                • At least one uppercase letter
              </Text>
              <Text style={styles.passwordStandardItem}>
                • At least one lowercase letter
              </Text>
              <Text style={styles.passwordStandardItem}>
                • At least one number
              </Text>
            </View>
            <View style={[styles.row, styles.pickerRow]}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <TextInput
                  style={[
                    styles.input,
                    styles.inputAligned,
                    {
                      backgroundColor: theme.colors.backgroundSecondary,
                      color: theme.colors.text,
                      borderColor: theme.colors.border,
                    },
                  ]}
                  placeholder="Enter verification code"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={code}
                  onChangeText={setCode}
                  keyboardType="number-pad"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              <View style={{ width: 130, minWidth: 120 }}>
                <TouchableOpacity
                  style={[
                    styles.codeButton,
                    styles.codeButtonAligned,
                    {
                      backgroundColor:
                        code.length === 0 ? "#CCCCCC" : "#EF5350",
                      minWidth: 120,
                      paddingHorizontal: 18,
                      justifyContent: "center",
                      alignItems: "center",
                    },
                  ]}
                  onPress={handleSendCode}
                  disabled={code.length === 0 || loading}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.codeButtonText,
                      {
                        textAlign: "center",
                        fontSize: 18,
                        fontFamily: "Inter-SemiBold",
                      },
                    ]}
                    allowFontScaling={false}
                  >
                    {timer > 0 ? `Resend in ${timer}s` : "Get Code"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            <TouchableOpacity
              style={[
                styles.submitButton,
                { backgroundColor: theme.colors.primary, marginTop: 32 },
              ]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text style={styles.submitButtonText}>
                {loading ? "Submitting..." : "Submit"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.helpLink}
              activeOpacity={0.7}
              onPress={() =>
                router.push({
                  pathname: "/help-center",
                  params: { showVerificationHelp: "true" },
                })
              }
            >
              <Text style={{ color: "#EF5350", fontSize: 15, marginTop: 32 }}>
                Didn't receive the verification code?
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontFamily: "Inter-SemiBold" },
  headerRight: { width: 36 },
  content: { flex: 1, padding: 24, justifyContent: "flex-start" },
  row: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  pickerRow: { paddingTop: 2, paddingBottom: 2, marginBottom: 16 },
  input: {
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
    fontSize: 16,
    fontFamily: "Inter-Regular",
    borderWidth: 1,
  },
  inputAligned: {
    height: 48,
    paddingTop: 0,
    paddingBottom: 0,
    marginBottom: 0,
    textAlignVertical: "center",
  },
  codeButton: {
    height: 44,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
    paddingHorizontal: 16,
  },
  codeButtonAligned: {
    height: 48,
    marginLeft: 0,
    paddingTop: 0,
    paddingBottom: 0,
    borderRadius: 12,
  },
  submitButton: {
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Inter-SemiBold",
  },
  helpLink: { alignItems: "center" },
  clearButton: {
    position: "absolute",
    right: 12,
    top: "50%",
    transform: [{ translateY: -9 }],
    zIndex: 2,
  },
  codeButtonText: { color: "#fff", fontSize: 18, fontFamily: "Inter-SemiBold" },
  eyeButton: {
    position: "absolute",
    right: 12,
    top: "50%",
    transform: [{ translateY: -10 }],
    zIndex: 2,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    marginBottom: 12,
    position: "relative",
  },
  passwordInput: {
    flex: 1,
    height: "100%",
    backgroundColor: "transparent",
    fontSize: 16,
    fontFamily: "Inter-Regular",
  },
  passwordStandardBox: {
    backgroundColor: "#232326",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    marginTop: -4,
  },
  passwordStandardTitle: {
    color: "#EF5350",
    fontSize: 15,
    fontFamily: "Inter-SemiBold",
    marginBottom: 4,
  },
  passwordStandardItem: {
    color: "#B0B0B0",
    fontSize: 14,
    fontFamily: "Inter-Regular",
    marginBottom: 2,
  },
});
