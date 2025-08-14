import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Alert,
  FlatList,
  Vibration,
  BackHandler,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { ChevronLeft, Trophy, ChevronDown } from "lucide-react-native";
import { useTheme, useThemeMode } from "@/hooks/useTheme";
import { useTranslation } from "react-i18next";
import useAuth from "@/hooks/useAuth";
import {
  formatPhoneNumber,
  formatPhoneNumberWithoutCountryCode,
  formatPhoneNumberByCountry,
} from "@/utils/phoneFormatter";
import {
  countryCodes,
  getMaxPhoneLength,
  createFlatListData,
  type CountryCode,
} from "@/utils/countryData";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { AuthError } from "@supabase/supabase-js";

export default function RegisterAndLoginScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { theme: themeMode } = useThemeMode();
  const { t } = useTranslation();
  const { setLoggedIn, signInWithPhone, verifyPhoneOtp, signInWithWhatsapp } =
    useAuth();
  const [countryCode, setCountryCode] = useState("+256"); // Uganda default
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isCountdownActive, setIsCountdownActive] = useState(false);
  const [hasInitiatedVerification, setHasInitiatedVerification] =
    useState(false);
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const countryListRef = useRef<FlatList>(null);
  const countdownRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<"phone" | "whatsapp">(
    "phone"
  ); // phone or whatsapp
  const [searchQuery, setSearchQuery] = useState("");

  // Create flat list data for country picker
  const flatListData = createFlatListData(countryCodes);

  // Filter countries based on search query
  const filteredData = searchQuery
    ? flatListData.filter(
        (item) =>
          item.type === "country" &&
          item.country?.country
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
      )
    : flatListData;

  // Get maximum phone number length for current country
  const getMaxPhoneLengthForCurrentCountry = () => {
    return getMaxPhoneLength(countryCode);
  };

  // Handle phone number input with length validation
  const handlePhoneNumberChange = (text: string) => {
    // Use the comprehensive formatting function for all countries
    const formattedNumber = formatPhoneNumberByCountry(text, countryCode);
    setPhoneNumber(formattedNumber);
  };

  // Handle country code selection
  const handleCountrySelect = (selectedCountry: CountryCode) => {
    setCountryCode(selectedCountry.code);
    setPhoneNumber(""); // Reset phone number when country changes
    setShowCountryPicker(false);
    setSearchQuery(""); // Clear search query when country is selected
  };

  // Start countdown timer
  const startCountdown = () => {
    setCountdown(40);
    setIsCountdownActive(true);
    setHasInitiatedVerification(true);

    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setIsCountdownActive(false);
          if (countdownRef.current) {
            clearInterval(countdownRef.current);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Clear countdown on unmount
  React.useEffect(() => {
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, []);

  // Handle Android back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (showCountryPicker) {
          setShowCountryPicker(false);
          return true;
        }
        return false;
      }
    );

    return () => backHandler.remove();
  }, [showCountryPicker]);

  // Handle send verification code
  const handleSendVerificationCode = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert("Error", "Please enter your phone number");
      return;
    }

    if (!agreedToTerms) {
      Alert.alert("Error", "Please agree to the terms and conditions");
      return;
    }

    try {
      setIsLoginLoading(true);

      // Format phone number for Supabase (international format)
      const formattedPhone = `${countryCode}${phoneNumber.replace(
        /[^0-9]/g,
        ""
      )}`;

      if (selectedMethod === "phone") {
        await signInWithPhone(formattedPhone);
      } else {
        await signInWithWhatsapp(formattedPhone);
      }

      startCountdown();
      Vibration.vibrate(100);

      // Show success alert
      Alert.alert("Success", `Verification code sent to ${formattedPhone}`, [
        { text: "OK" },
      ]);
    } catch (error) {
      console.error("Error sending verification code:", error);

      if (error instanceof AuthError) {
        Alert.alert("Error", error.message);
      } else {
        Alert.alert(
          "Error",
          "SMS provider not configured. For testing, use code 1234 with any phone number."
        );
      }
    } finally {
      setIsLoginLoading(false);
    }
  };

  // Handle verify OTP
  const handleVerifyOtp = async () => {
    if (!verificationCode.trim()) {
      Alert.alert("Error", "Please enter the verification code");
      return;
    }

    try {
      setIsLoginLoading(true);

      // Format phone number for Supabase (international format)
      const formattedPhone = `${countryCode}${phoneNumber.replace(
        /[^0-9]/g,
        ""
      )}`;

      await verifyPhoneOtp(formattedPhone, verificationCode);
      setLoggedIn(true);
      router.replace("/(tabs)");
      Vibration.vibrate(100);
    } catch (error) {
      console.error("Error verifying OTP:", error);

      if (error instanceof AuthError) {
        Alert.alert("Error", error.message);
      } else {
        Alert.alert("Error", "Invalid verification code. Please try again.");
      }
    } finally {
      setIsLoginLoading(false);
    }
  };

  // Render country picker item
  const renderCountryItem = ({ item }: { item: any }) => {
    if (item.type === "header") {
      return (
        <View style={styles.countryHeader}>
          <Text
            style={[
              styles.countryHeaderText,
              { color: theme.colors.textSecondary },
            ]}
          >
            {item.letter}
          </Text>
        </View>
      );
    }

    return (
      <TouchableOpacity
        style={styles.countryItem}
        onPress={() => handleCountrySelect(item.country)}
        activeOpacity={0.7}
      >
        <Text style={styles.countryFlag}>{item.country.flag}</Text>
        <View style={styles.countryInfo}>
          <Text style={[styles.countryName, { color: theme.colors.text }]}>
            {item.country.country}
          </Text>
          <Text
            style={[styles.countryCode, { color: theme.colors.textSecondary }]}
          >
            {item.country.code}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
              activeOpacity={0.7}
            >
              <ChevronLeft size={28} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
              {t("Welcome to Champs")}
            </Text>
            <View style={styles.headerRight} />
          </View>

          {/* Logo and Title */}
          <View style={styles.logoContainer}>
            <View
              style={[styles.logo, { backgroundColor: theme.colors.primary }]}
            >
              <Trophy size={40} color="#FFFFFF" />
            </View>
            <Text style={[styles.appTitle, { color: theme.colors.text }]}>
              Champs
            </Text>
            <Text
              style={[
                styles.appSubtitle,
                { color: theme.colors.textSecondary },
              ]}
            >
              {t("Your Ultimate Sports Companion")}
            </Text>
          </View>

          {/* Method Selection */}
          <View style={styles.methodContainer}>
            <TouchableOpacity
              style={[
                styles.methodButton,
                {
                  backgroundColor:
                    selectedMethod === "phone"
                      ? theme.colors.primary
                      : theme.colors.backgroundSecondary,
                  borderColor:
                    selectedMethod === "phone"
                      ? theme.colors.primary
                      : theme.colors.border,
                },
              ]}
              onPress={() => setSelectedMethod("phone")}
              activeOpacity={0.8}
            >
              <Ionicons
                name="call"
                size={20}
                color={
                  selectedMethod === "phone" ? "#FFFFFF" : theme.colors.text
                }
              />
              <Text
                style={[
                  styles.methodButtonText,
                  {
                    color:
                      selectedMethod === "phone"
                        ? "#FFFFFF"
                        : theme.colors.text,
                  },
                ]}
              >
                {t("Phone")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.methodButton,
                {
                  backgroundColor:
                    selectedMethod === "whatsapp"
                      ? theme.colors.primary
                      : theme.colors.backgroundSecondary,
                  borderColor:
                    selectedMethod === "whatsapp"
                      ? theme.colors.primary
                      : theme.colors.border,
                },
              ]}
              onPress={() => setSelectedMethod("whatsapp")}
              activeOpacity={0.8}
            >
              <Ionicons
                name="logo-whatsapp"
                size={20}
                color={
                  selectedMethod === "whatsapp" ? "#FFFFFF" : theme.colors.text
                }
              />
              <Text
                style={[
                  styles.methodButtonText,
                  {
                    color:
                      selectedMethod === "whatsapp"
                        ? "#FFFFFF"
                        : theme.colors.text,
                  },
                ]}
              >
                WhatsApp
              </Text>
            </TouchableOpacity>
          </View>

          {/* Country Code and Phone Number */}
          <View style={styles.phoneInputContainer}>
            <TouchableOpacity
              style={[
                styles.countryCodeButton,
                {
                  backgroundColor: theme.colors.backgroundSecondary,
                  borderColor: theme.colors.border,
                },
              ]}
              onPress={() => setShowCountryPicker(!showCountryPicker)}
              activeOpacity={0.7}
            >
              <Text
                style={[styles.countryCodeText, { color: theme.colors.text }]}
              >
                {countryCode}
              </Text>
              <ChevronDown size={16} color={theme.colors.textSecondary} />
            </TouchableOpacity>

            <TextInput
              style={[
                styles.phoneInput,
                {
                  backgroundColor: theme.colors.backgroundSecondary,
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
                },
                Platform.select({ web: { outlineStyle: "none" } as any }),
              ]}
              placeholder={
                countryCode === "+256"
                  ? "7729 080 10"
                  : `${t(
                      "Enter Phone Number"
                    )} (${getMaxPhoneLengthForCurrentCountry()} ${t("digits")})`
              }
              placeholderTextColor={theme.colors.textSecondary}
              value={phoneNumber}
              onChangeText={handlePhoneNumberChange}
              keyboardType="phone-pad"
              maxLength={
                countryCode === "+256"
                  ? 12
                  : getMaxPhoneLengthForCurrentCountry() + 4
              }
            />
          </View>

          {/* Verification Code Input with Send Button */}
          <View style={styles.verificationContainer}>
            <TextInput
              style={[
                styles.verificationInput,
                {
                  backgroundColor: theme.colors.backgroundSecondary,
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
                },
                Platform.select({ web: { outlineStyle: "none" } as any }),
              ]}
              placeholder={t("Enter Verification Code")}
              placeholderTextColor={theme.colors.textSecondary}
              value={verificationCode}
              onChangeText={setVerificationCode}
              keyboardType="number-pad"
              maxLength={6}
            />

            <TouchableOpacity
              style={[
                styles.sendCodeButton,
                {
                  backgroundColor: isCountdownActive
                    ? "#CCCCCC"
                    : theme.colors.primary,
                  opacity: isCountdownActive ? 0.6 : 1,
                },
              ]}
              onPress={handleSendVerificationCode}
              activeOpacity={0.8}
              disabled={isCountdownActive}
            >
              <Text
                style={[
                  styles.sendCodeButtonText,
                  { color: isCountdownActive ? "#999999" : "#FFFFFF" },
                ]}
              >
                {isCountdownActive
                  ? `${t("Resend")} (${countdown}s)`
                  : hasInitiatedVerification
                  ? t("Resend Code")
                  : t("Send Code")}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Terms and Conditions */}
          <View style={styles.termsContainer}>
            <TouchableOpacity
              style={styles.termsCheckbox}
              onPress={() => setAgreedToTerms(!agreedToTerms)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.checkbox,
                  {
                    backgroundColor: agreedToTerms
                      ? theme.colors.primary
                      : "transparent",
                    borderColor: agreedToTerms
                      ? theme.colors.primary
                      : theme.colors.border,
                  },
                ]}
              >
                {agreedToTerms && (
                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                )}
              </View>
              <Text style={[styles.termsText, { color: theme.colors.text }]}>
                {t("I agree to the")}{" "}
                <Text
                  style={[styles.termsLink, { color: theme.colors.primary }]}
                  onPress={() => router.push("/user-service-agreement")}
                >
                  {t("Terms of Service")}
                </Text>{" "}
                {t("and")}{" "}
                <Text
                  style={[styles.termsLink, { color: theme.colors.primary }]}
                  onPress={() => router.push("/privacy-policy")}
                >
                  {t("Privacy Policy")}
                </Text>
              </Text>
            </TouchableOpacity>
          </View>

          {/* Verify Button */}
          <TouchableOpacity
            style={[
              styles.verifyButton,
              {
                backgroundColor:
                  verificationCode && agreedToTerms
                    ? theme.colors.primary
                    : "#CCCCCC",
                opacity: isLoginLoading ? 0.7 : 1,
              },
            ]}
            onPress={handleVerifyOtp}
            disabled={!verificationCode || !agreedToTerms || isLoginLoading}
            activeOpacity={0.8}
          >
            {isLoginLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.verifyButtonText}>
                {t("Verify & Continue")}
              </Text>
            )}
          </TouchableOpacity>

          {/* Additional Options */}
          <View style={styles.additionalOptions}>
            <TouchableOpacity
              onPress={() => router.push("/recover-account")}
              style={styles.additionalOption}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.additionalOptionText,
                  { color: theme.colors.primary },
                ]}
              >
                {t("Forgot Password?")}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Country Picker Modal - Moved outside ScrollView to avoid nesting */}
        {showCountryPicker && (
          <View style={styles.countryPickerContainer}>
            <View
              style={[
                styles.countryPickerHeader,
                { backgroundColor: theme.colors.backgroundSecondary },
              ]}
            >
              <Text
                style={[
                  styles.countryPickerTitle,
                  { color: theme.colors.text },
                ]}
              >
                {t("Select Country")}
              </Text>
              <TouchableOpacity
                onPress={() => setShowCountryPicker(false)}
                style={styles.closeButton}
              >
                <Text
                  style={[
                    styles.closeButtonText,
                    { color: theme.colors.primary },
                  ]}
                >
                  {t("Close")}
                </Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={[
                styles.searchInput,
                {
                  backgroundColor: theme.colors.backgroundSecondary,
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
                },
              ]}
              placeholder="Search countries..."
              placeholderTextColor={theme.colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />

            <FlatList
              data={filteredData}
              renderItem={renderCountryItem}
              keyExtractor={(item) => item.key}
              style={styles.countryList}
              showsVerticalScrollIndicator={false}
              getItemLayout={(data, index) => ({
                length: 48,
                offset: 48 * index,
                index,
              })}
            />
          </View>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Inter-SemiBold",
  },
  headerRight: {
    width: 36,
  },
  logoContainer: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 40,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  appTitle: {
    fontSize: 32,
    fontFamily: "Inter-Bold",
    marginBottom: 8,
  },
  appSubtitle: {
    fontSize: 16,
    fontFamily: "Inter-Regular",
    textAlign: "center",
  },
  methodContainer: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  methodButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  methodButtonText: {
    fontSize: 16,
    fontFamily: "Inter-Medium",
  },
  phoneInputContainer: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  countryCodeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 80,
  },
  countryCodeText: {
    fontSize: 16,
    fontFamily: "Inter-Medium",
    marginRight: 8,
  },
  phoneInput: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: "Inter-Regular",
    borderWidth: 1,
  },
  countryPickerContainer: {
    position: "absolute",
    top: 120,
    left: 24,
    right: 24,
    backgroundColor: "white",
    borderRadius: 12,
    maxHeight: 400,
    zIndex: 1000,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  countryPickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  countryPickerTitle: {
    fontSize: 18,
    fontFamily: "Inter-SemiBold",
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 16,
    fontFamily: "Inter-Medium",
  },
  countryList: {
    flex: 1,
  },
  searchInput: {
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginVertical: 12,
    fontSize: 16,
    fontFamily: "Inter-Regular",
    borderWidth: 1,
  },
  countryHeader: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#F5F5F5",
  },
  countryHeaderText: {
    fontSize: 16,
    fontFamily: "Inter-SemiBold",
  },
  countryItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: "#E0E0E0",
  },
  countryFlag: {
    fontSize: 24,
    marginRight: 12,
  },
  countryInfo: {
    flex: 1,
  },
  countryName: {
    fontSize: 16,
    fontFamily: "Inter-Medium",
    marginBottom: 2,
  },
  countryCode: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
  },
  verificationContainer: {
    marginHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  verificationInput: {
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: "Inter-Regular",
    borderWidth: 1,
  },
  sendCodeButton: {
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  sendCodeButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Inter-SemiBold",
  },
  termsContainer: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  termsCheckbox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  termsText: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
    flex: 1,
    lineHeight: 20,
  },
  termsLink: {
    fontFamily: "Inter-SemiBold",
  },
  verifyButton: {
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 24,
  },
  verifyButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Inter-SemiBold",
  },
  additionalOptions: {
    alignItems: "center",
  },
  additionalOption: {
    padding: 8,
  },
  additionalOptionText: {
    fontSize: 14,
    fontFamily: "Inter-Medium",
  },
});
