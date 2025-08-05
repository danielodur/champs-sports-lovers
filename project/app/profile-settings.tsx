import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  ChevronLeft,
  ChevronRight,
  Shield,
  Bell,
  Trophy,
  Vibrate,
  CircleHelp as HelpCircle,
  Info,
  Handshake,
  Trash2,
  Globe as Globe2,
  Lock,
  Settings as SettingsIcon,
  SunMoon,
  Sun,
  MoonStar,
  LogOut,
  Loader,
} from "lucide-react-native";
import { useTheme, useThemeMode } from "@/hooks/useTheme";
import ThemeSelector from "@/components/ThemeSelector";
import "./i18n";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Language } from "@/contexts/LanguageContext";
import useAuth from "@/hooks/useAuth";

export default function SettingsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { theme: themeMode } = useThemeMode();
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();
  const { isLoggedIn, logout, initializeAuth, logoutLoading } = useAuth();
  const [showAds, setShowAds] = React.useState(true);
  const [showThemeSelector, setShowThemeSelector] = React.useState(false);
  const [showClearModal, setShowClearModal] = React.useState(false);
  const [cacheSize, setCacheSize] = React.useState("71.25MB"); // Default value
  const [showLanguageModal, setShowLanguageModal] = React.useState(false);

  React.useEffect(() => {
    initializeAuth();
  }, []);

  const languages = [{ code: "en", label: t("English") }];

  const renderThemeIcon = () => {
    if (themeMode === "dark") {
      return <MoonStar size={20} color={theme.colors.text} />;
    } else if (themeMode === "light") {
      return <Sun size={20} color={theme.colors.text} />;
    }
    return <SunMoon size={20} color={theme.colors.text} />;
  };

  const settingsGroups = [
    {
      items: [
        {
          icon: Shield,
          label: t("Account & Security"),
          value: "",
          showChevron: true,
        },
        { icon: Bell, label: t("Notifications"), value: "", showChevron: true },
        {
          icon: SettingsIcon,
          label: t("Match Settings"),
          value: "",
          showChevron: true,
        },
        {
          icon: Vibrate,
          label: t("Vibration & Broadcast Settings"),
          value: "",
          showChevron: true,
        },
      ],
    },
    {
      items: [
        {
          icon: Globe2,
          label: t("Language"),
          value: languages.find((l) => l.code === language)?.label,
          showChevron: true,
          onPress: () => setShowLanguageModal(true),
        },
        { icon: Lock, label: t("Privacy"), value: "", showChevron: true },
      ],
    },
    {
      items: [
        {
          icon: SettingsIcon,
          label: t("Suggested Adverts"),
          description: t("As VIP, after closing, no ads will be received."),
          showToggle: true,
          toggleValue: showAds,
          onToggle: () => setShowAds(!showAds),
        },
      ],
    },
    {
      items: [
        {
          icon: HelpCircle,
          label: t("Customer Service"),
          value: "",
          showChevron: true,
        },
        { icon: Info, label: t("About Us"), value: "", showChevron: true },
        {
          icon: Handshake,
          label: t("Partner with Us"),
          value: "",
          showChevron: true,
        },
        {
          icon: Trash2,
          label: t("Clear Memory"),
          value: cacheSize,
          showChevron: true,
        },
      ],
    },
  ];

  const handleClearMemory = () => {
    setCacheSize("0MB");
    setShowClearModal(false);
  };

  const handleLanguageChange = (langCode: Language) => {
    setLanguage(langCode);
    setShowLanguageModal(false);
  };

  const handleLogout = () => {
    // Prevent logout if already in progress
    if (logoutLoading) {
      return;
    }

    Alert.alert(t("Logout"), t("Are you sure you want to logout?"), [
      {
        text: t("Cancel"),
        style: "cancel",
      },
      {
        text: t("Logout"),
        style: "destructive",
        onPress: async () => {
          // Clear authentication state and navigate to profile tab
          await logout();
          router.replace("/(tabs)/profile");
        },
      },
    ]);
  };

  const renderItem = (item: any) => (
    <TouchableOpacity
      key={item.label}
      style={[styles.settingItem, { borderBottomColor: theme.colors.border }]}
      onPress={
        item.onPress
          ? item.onPress
          : () => {
              if (item.label === t("Account & Security")) {
                if (isLoggedIn) {
                  // Navigate to account settings for logged in users
                  router.push("/profile-page");
                } else {
                  // Navigate to login for guests
                  router.push("/login-register");
                }
              } else if (item.label === t("Notifications")) {
                router.push("/notification-settings");
              } else if (item.label === t("Match Settings")) {
                router.push("/match-settings");
              } else if (item.label === t("Vibration & Broadcast Settings")) {
                router.push("/vibrationSettings");
              } else if (item.label === t("Themes")) {
                setShowThemeSelector(true);
              } else if (item.label === t("Privacy")) {
                router.push("/privacy-settings");
              } else if (item.label === t("Customer Service")) {
                router.push("/help-center");
              } else if (item.label === t("About Us")) {
                router.push("/about-us");
              } else if (item.label === t("Partner with Us")) {
                router.push({
                  pathname: "/help-center",
                  params: { showPartnerModal: "true" },
                });
              } else if (item.label === t("Clear Memory")) {
                setShowClearModal(true);
              }
            }
      }
    >
      <View style={styles.settingLeft}>
        {item.label === t("Themes") ? (
          renderThemeIcon()
        ) : (
          <item.icon size={20} color={theme.colors.text} />
        )}
        <View style={styles.settingLabelContainer}>
          <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
            {item.label}
          </Text>
          {item.description && (
            <Text
              style={[
                styles.settingDescription,
                { color: theme.colors.textSecondary },
              ]}
            >
              {item.description}
            </Text>
          )}
        </View>
      </View>
      <View style={styles.settingRight}>
        {item.value ? (
          <Text
            style={[styles.settingValue, { color: theme.colors.textSecondary }]}
          >
            {item.value}
          </Text>
        ) : null}
        {item.showToggle && (
          <Switch
            value={item.toggleValue}
            onValueChange={item.onToggle}
            trackColor={{ false: "#767577", true: theme.colors.primary }}
          />
        )}
        {item.showChevron && (
          <ChevronRight size={20} color={theme.colors.textSecondary} />
        )}
      </View>
    </TouchableOpacity>
  );

  // Insert Themes after Vibration & Broadcast Settings
  const renderSettingsWithThemes = () => {
    return settingsGroups.map((group, groupIdx) => (
      <View
        key={groupIdx}
        style={[
          styles.settingGroup,
          { backgroundColor: theme.colors.backgroundSecondary },
        ]}
      >
        {group.items.map((item, idx) => {
          const isAfterVibration =
            item.label === t("Vibration & Broadcast Settings") &&
            groupIdx === 0;
          return (
            <React.Fragment key={item.label}>
              {renderItem(item)}
              {isAfterVibration && (
                <TouchableOpacity
                  style={[
                    styles.settingItem,
                    { borderBottomColor: theme.colors.border },
                  ]}
                  onPress={() => setShowThemeSelector(true)}
                  activeOpacity={0.7}
                >
                  <View style={styles.settingLeft}>
                    {renderThemeIcon()}
                    <View style={styles.settingLabelContainer}>
                      <Text
                        style={[
                          styles.settingLabel,
                          { color: theme.colors.text },
                        ]}
                      >
                        {t("Themes")}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.settingRight}>
                    <ChevronRight
                      size={20}
                      color={theme.colors.textSecondary}
                    />
                  </View>
                </TouchableOpacity>
              )}
            </React.Fragment>
          );
        })}
      </View>
    ));
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View
        style={[
          styles.header,
          { backgroundColor: theme.colors.backgroundSecondary },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ChevronLeft size={28} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          {t("Settings")}
        </Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content}>
        {renderSettingsWithThemes()}

        {/* Logout Button - Only show when logged in */}
        {isLoggedIn && (
          <TouchableOpacity
            style={[
              styles.logoutButton,
              {
                backgroundColor: theme.colors.backgroundSecondary,
                opacity: logoutLoading ? 0.6 : 1,
              },
            ]}
            onPress={handleLogout}
            activeOpacity={0.7}
            disabled={logoutLoading}
          >
            {logoutLoading ? (
              <Loader size={20} color={theme.colors.error} />
            ) : (
              <LogOut size={20} color={theme.colors.error} />
            )}
            <Text
              style={[styles.logoutButtonText, { color: theme.colors.error }]}
            >
              {logoutLoading ? t("Logging out...") : t("Logout")}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <ThemeSelector
        visible={showThemeSelector}
        onClose={() => setShowThemeSelector(false)}
      />
      {/* Language Picker Modal */}
      <Modal
        visible={showLanguageModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <View style={styles.clearModalOverlay}>
          <View
            style={[
              styles.clearModalContainer,
              {
                backgroundColor: theme.colors.backgroundSecondary,
                maxHeight: 400,
              },
            ]}
          >
            <Text
              style={[styles.clearModalTitle, { color: theme.colors.text }]}
            >
              {t("Select Language")}
            </Text>
            <ScrollView
              style={{ width: "100%" }}
              contentContainerStyle={{
                alignItems: "center",
                paddingBottom: 12,
              }}
            >
              {languages.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.clearModalButton,
                    language === lang.code
                      ? {
                          backgroundColor: theme.colors.primary,
                          borderColor: theme.colors.primary,
                        }
                      : {
                          backgroundColor: "transparent",
                          borderColor: "transparent",
                        },
                  ]}
                  onPress={() => handleLanguageChange(lang.code as Language)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.clearModalButtonText,
                      {
                        color:
                          language === lang.code ? "#fff" : theme.colors.text,
                      },
                    ]}
                  >
                    {lang.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={[
                styles.clearModalButton,
                { backgroundColor: theme.colors.background, minWidth: 120 },
              ]}
              onPress={() => setShowLanguageModal(false)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.clearModalButtonText,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {t("Cancel")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* Clear Memory Modal */}
      <Modal
        visible={showClearModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowClearModal(false)}
      >
        <View style={styles.clearModalOverlay}>
          <View
            style={[
              styles.clearModalContainer,
              { backgroundColor: theme.colors.backgroundSecondary },
            ]}
          >
            <Text
              style={[styles.clearModalTitle, { color: theme.colors.text }]}
            >
              {t("Prompt")}
            </Text>
            <Text
              style={[
                styles.clearModalText,
                { color: theme.colors.textSecondary },
              ]}
            >
              {t(
                "Cache size is {{size}}. Are you sure you want to clear the cache?",
                { size: cacheSize }
              )}
            </Text>
            <View style={styles.clearModalButtons}>
              <TouchableOpacity
                style={[
                  styles.clearModalButton,
                  { backgroundColor: theme.colors.background, flex: 1 },
                ]}
                onPress={() => setShowClearModal(false)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.clearModalButtonText,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {t("Cancel")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.clearModalButton,
                  { backgroundColor: "#EF5350", flex: 1 },
                ]}
                onPress={handleClearMemory}
                activeOpacity={0.7}
              >
                <Text style={[styles.clearModalButtonText, { color: "#fff" }]}>
                  {t("Confirm")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 6,
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
  content: {
    flex: 1,
  },
  settingGroup: {
    marginTop: 8,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
    paddingRight: 16,
  },
  settingLabelContainer: {
    marginLeft: 12,
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontFamily: "Inter-Regular",
  },
  settingDescription: {
    fontSize: 12,
    fontFamily: "Inter-Regular",
    marginTop: 4,
  },
  settingRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  settingValue: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
    marginRight: 4,
  },
  clearModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  clearModalContainer: {
    width: "80%",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
  },
  clearModalTitle: {
    fontSize: 18,
    fontFamily: "Inter-SemiBold",
    marginBottom: 16,
  },
  clearModalText: {
    fontSize: 15,
    fontFamily: "Inter-Regular",
    marginBottom: 24,
    textAlign: "center",
  },
  clearModalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    gap: 16,
  },
  clearModalButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    paddingHorizontal: 24,
    marginVertical: 6,
    minWidth: 120,
    borderWidth: 1,
    borderColor: "#eee",
  },
  clearModalButtonText: {
    fontSize: 16,
    fontFamily: "Inter-SemiBold",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 20,
    borderRadius: 8,
    gap: 8,
  },
  logoutButtonText: {
    fontSize: 16,
    fontFamily: "Inter-SemiBold",
  },
});
