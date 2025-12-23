import React, { useState, useRef, useEffect } from "react";
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
  FlatList,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, Headset, ChevronDown } from "lucide-react-native";
import { useTheme } from "../hooks/useTheme";
import { SafeNavigation } from "../utils/navigationUtils";
import {
  countryCodes,
  getMaxPhoneLength,
  createFlatListData,
  type CountryCode,
} from "../utils/countryData";
import {
  formatPhoneNumber,
  formatPhoneNumberWithoutCountryCode,
  formatPhoneNumberByCountry,
} from "../utils/phoneFormatter";

export default function RecoverAccountScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [countryCode, setCountryCode] = useState("+256"); // Uganda default
  const [phoneNumber, setPhoneNumber] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [sendCodeUsed, setSendCodeUsed] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
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
            .includes(searchQuery.toLowerCase()),
      )
    : flatListData;

  useEffect(() => {
    if (timer > 0) {
      timerRef.current = setTimeout(() => setTimer(timer - 1), 1000);
    } else if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timer]);

  useEffect(() => {
    // Reset sendCodeUsed when the screen is mounted
    setSendCodeUsed(false);
  }, []);

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
    setSearchQuery("");
  };

  const isValidPhone = (value: string) => {
    const maxLength = getMaxPhoneLengthForCurrentCountry();
    const cleanValue = value.replace(/[^0-9]/g, "");
    return (
      cleanValue.length >= maxLength - 2 && cleanValue.length <= maxLength + 2
    );
  };

  const handleSendCode = () => {
    if (!isValidPhone(phoneNumber)) {
      Alert.alert(
        "Invalid Phone Number",
        "Please enter a valid phone number and try again.",
      );
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setCodeSent(true);
      setSendCodeUsed(true);
      setTimer(40);
      Alert.alert(
        "Code Sent",
        "A verification code has been sent to your phone number.",
      );
    }, 1200);
  };

  const handleResendCode = () => {
    if (!isValidPhone(phoneNumber)) {
      Alert.alert(
        "Invalid Phone Number",
        "Please enter a valid phone number and try again.",
      );
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setTimer(40);
      Alert.alert(
        "Code Sent",
        "A new verification code has been sent to your phone number.",
      );
    }, 1200);
  };

  const handleVerifyCode = () => {
    if (!code) {
      Alert.alert("Missing Code", "Please enter the verification code.");
      return;
    }
    // Simulate code verification
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      // Navigate to reset-password screen, passing phone as param
      const fullPhone = `${countryCode}${phoneNumber.replace(/[^0-9]/g, "")}`;
      router.push({
        pathname: "/reset-password",
        params: { phone: fullPhone },
      });
    }, 1000);
  };

  const handleCustomerService = () => {
    router.push("/help-center");
  };

  const handleBack = () => {
    if (phoneNumber || codeSent || timer > 0) {
      Alert.alert(
        "Are you sure?",
        "If you go back now, your progress will be lost. Do you want to continue?",
        [
          { text: "Cancel", style: "cancel" },
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
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={{ flex: 1 }}>
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
              <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                <ChevronLeft size={28} color={theme.colors.text} />
              </TouchableOpacity>
              <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
                Recover Account
              </Text>
              <TouchableOpacity
                onPress={handleCustomerService}
                style={styles.headerRight}
                activeOpacity={0.7}
              >
                <Headset size={26} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.content}>
              <Text
                style={[
                  styles.instructions,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Enter your registered phone number to receive a verification
                code.
              </Text>

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
                    style={[
                      styles.countryCodeText,
                      { color: theme.colors.text },
                    ]}
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
                      : `Enter Phone Number (${getMaxPhoneLengthForCurrentCountry()} digits)`
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

              {/* Country Picker Modal */}
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
                      Select Country
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
                        Close
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

              <TouchableOpacity
                style={[
                  styles.sendCodeButton,
                  {
                    backgroundColor:
                      !isValidPhone(phoneNumber) || sendCodeUsed
                        ? "#CCCCCC"
                        : "#EF5350",
                    opacity: loading ? 0.7 : 1,
                  },
                ]}
                onPress={handleSendCode}
                disabled={
                  !isValidPhone(phoneNumber) ||
                  loading ||
                  timer > 0 ||
                  sendCodeUsed
                }
                activeOpacity={0.8}
              >
                <Text style={styles.sendCodeButtonText}>
                  {loading
                    ? "Sending..."
                    : timer > 0
                      ? `Resend in ${timer}s`
                      : "Send Code"}
                </Text>
              </TouchableOpacity>

              {codeSent && timer === 0 && (
                <TouchableOpacity
                  style={[styles.resendButton, { backgroundColor: "#EF5350" }]}
                  onPress={handleResendCode}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  <Text style={styles.resendButtonText}>Resend Code</Text>
                </TouchableOpacity>
              )}

              {codeSent && (
                <>
                  <Text
                    style={[
                      styles.instructions,
                      { color: theme.colors.textSecondary, marginTop: 24 },
                    ]}
                  >
                    Enter the verification code sent to your phone.
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.colors.backgroundSecondary,
                        color: theme.colors.text,
                        borderColor: theme.colors.border,
                      },
                    ]}
                    placeholder="Verification Code"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={code}
                    onChangeText={setCode}
                    keyboardType="number-pad"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    style={[
                      styles.verifyButton,
                      {
                        backgroundColor: code ? "#EF5350" : "#CCCCCC",
                        opacity: loading ? 0.7 : 1,
                      },
                    ]}
                    onPress={handleVerifyCode}
                    disabled={!code || loading}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.verifyButtonText}>
                      {loading ? "Verifying..." : "Verify Code"}
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </KeyboardAvoidingView>

          <View
            style={[
              styles.reminderBox,
              {
                backgroundColor: theme.colors.backgroundSecondary,
                borderTopLeftRadius: 0,
                borderTopRightRadius: 0,
                borderBottomWidth: 0,
                borderColor: "transparent",
                shadowColor: "transparent",
              },
            ]}
          >
            <Text
              style={[
                styles.reminderTitle,
                { color: theme.colors.text, opacity: 0.7 },
              ]}
            >
              Note:
            </Text>
            <Text
              style={[
                styles.reminderText,
                { color: theme.colors.textSecondary, opacity: 0.7 },
              ]}
            >
              • Ensure your phone has enough credit to receive SMS messages.
            </Text>
            <Text
              style={[
                styles.reminderText,
                { color: theme.colors.textSecondary, opacity: 0.7 },
              ]}
            >
              • If you do not receive the code, check your network connection
              and try again.
            </Text>
            <Text
              style={[
                styles.reminderText,
                { color: theme.colors.textSecondary, opacity: 0.7 },
              ]}
            >
              • Clear your SMS inbox if it is full or check your spam/junk
              messages.
            </Text>
            <Text
              style={[
                styles.reminderText,
                { color: theme.colors.textSecondary, opacity: 0.7 },
              ]}
            >
              • If your number is out of service or blocked, contact your mobile
              provider.
            </Text>
            <Text
              style={[
                styles.reminderText,
                { color: theme.colors.textSecondary, opacity: 0.7 },
              ]}
            >
              • For further assistance, contact{" "}
              <Text style={{ color: "#EF5350", fontWeight: "bold" }}>
                Champs Support
              </Text>
              .
            </Text>
          </View>
        </View>
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
  headerRight: { width: 36, alignItems: "flex-end", justifyContent: "center" },
  content: { flex: 1, padding: 24, justifyContent: "flex-start" },
  instructions: { fontSize: 14, fontFamily: "Inter-Regular", marginBottom: 12 },
  input: {
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
    fontSize: 16,
    fontFamily: "Inter-Regular",
    borderWidth: 1,
  },

  // Phone input styles
  phoneInputContainer: {
    flexDirection: "row",
    marginBottom: 12,
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

  // Country picker styles
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
  searchInput: {
    height: 48,
    margin: 16,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
    fontFamily: "Inter-Regular",
  },
  countryList: {
    flex: 1,
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

  sendCodeButton: {
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  sendCodeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Inter-SemiBold",
  },
  resendButton: {
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  resendButtonText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Inter-SemiBold",
  },
  verifyButton: {
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  verifyButtonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Inter-SemiBold",
  },
  reminderBox: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 0,
    borderRadius: 0,
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    minHeight: 120,
    justifyContent: "flex-end",
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderWidth: 0,
    borderColor: "transparent",
    shadowColor: "transparent",
    zIndex: 10,
  },
  reminderTitle: {
    fontSize: 15,
    fontFamily: "Inter-SemiBold",
    marginBottom: 6,
  },
  reminderText: { fontSize: 13, fontFamily: "Inter-Regular", marginBottom: 2 },
});
