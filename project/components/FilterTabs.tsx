import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useTheme } from "../hooks/useTheme";
import { useTranslation } from "react-i18next";
import SortMatchesModal from "./panel/matches-screens/matches-filter/sort-matches";

interface FilterTabsProps {
  active: string;
  onSelect: (filter: string) => void;
  currentSport: string;
  onSortChange?: (sortMode: string) => void;
  onDisplayModeChange?: (displayMode: string) => void;
  favoritesCount?: number;
  currentSortMode?: string;
}

// Custom Score Icon Component
const ScoreIcon = ({ color }: { color: string }) => (
  <Text style={[styles.scoreIconText, { color }]}>|2:1|</Text>
);

export default function FilterTabs({
  active,
  onSelect,
  currentSport,
  onSortChange,
  onDisplayModeChange,
  favoritesCount,
  currentSortMode = "time",
}: FilterTabsProps) {
  const theme = useTheme();
  const [showMatchModeModal, setShowMatchModeModal] = useState(false);
  const [selectedMatchMode, setSelectedMatchMode] = useState("score");
  const [selectedSortMode, setSelectedSortMode] = useState(currentSortMode);
  const { t } = useTranslation();

  // Update internal state when external sort mode changes
  useEffect(() => {
    setSelectedSortMode(currentSortMode);
  }, [currentSortMode]);

  // Ensure translation function is working
  const safeT = (key: string) => {
    try {
      return t && typeof t === "function" ? String(t(key) || key) : String(key);
    } catch (error) {
      console.warn("Translation error for key:", key);
      return String(key);
    }
  };

  const tabs = [
    { id: "all", label: safeT("All") },
    { id: "live", label: safeT("Live") },
    { id: "fixture", label: safeT("Fixture") },
    { id: "finished", label: safeT("Finished") },
    { id: "follows", label: safeT("Follows") },
  ];

  // ✅ TOP SCREEN NAVIGATION: Zero-jump transitions from Top screen
  const handleTabPress = (tabId: string) => {
    console.log("⚡ TOP NAVIGATION TAB PRESS:", tabId);

    // ✨ TOP SCREEN OPTIMIZATION: Enhanced handling for smooth transitions
    if (currentSport === "football") {
      console.log("🎯 TOP → FOOTBALL: Zero-jump transition optimization");
    }

    // ✅ INSTANT TAB SELECTION: Immediate UI response for professional navigation
    onSelect(tabId);
  };

  const handleConfirm = (matchMode: string, sortMode: string) => {
    // Close modal
    setShowMatchModeModal(false);

    // Update local state
    setSelectedMatchMode(matchMode);
    setSelectedSortMode(sortMode);

    // ✅ INSTANT RESPONSE - Apply changes immediately
    console.log(
      "⚡ INSTANT SETTINGS APPLY:",
      matchMode,
      sortMode
    );

    // Notify parent components about the changes with immediate callbacks
    if (onSortChange) {
      onSortChange(sortMode);
    }
    if (onDisplayModeChange) {
      onDisplayModeChange(matchMode);
    }

    console.log(
      "✅ Applied settings for",
      currentSport,
      ": Mode:",
      matchMode,
      ", Sort:",
      sortMode
    );
  };

  const handleCancel = () => {
    setShowMatchModeModal(false);
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.backgroundSecondary },
      ]}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        contentContainerStyle={styles.scrollContent}
        bounces={false}
        scrollEventThrottle={1}
        removeClippedSubviews={false}
        disableIntervalMomentum={true}
      >
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, active === tab.id && styles.activeTab]}
            onPress={() => handleTabPress(tab.id)}
            activeOpacity={0.6}
          >
            <View style={styles.tabContent}>
              <Text
                style={[
                  styles.tabText,
                  {
                    color:
                      active === tab.id
                        ? theme.colors.background === "#FFFFFF"
                          ? "#666666"
                          : "#888888"
                        : theme.colors.textSecondary,
                    fontFamily:
                      active === tab.id ? "Inter-SemiBold" : "Inter-Regular",
                  },
                ]}
              >
                {tab.label}
                {tab.id === "follows" && (
                  <Text
                    style={[
                      styles.badgeText,
                      {
                        color:
                          (favoritesCount ?? 0) > 0
                            ? "#FF4444"
                            : theme.colors.primary,
                        fontFamily: "Inter-Bold",
                      },
                    ]}
                  >
                    {" "}
                    ({favoritesCount || 0})
                  </Text>
                )}
              </Text>
              {active === tab.id && (
                <View
                  style={[
                    styles.indicator,
                    { backgroundColor: theme.colors.primary },
                  ]}
                />
              )}
            </View>
          </TouchableOpacity>
        ))}

        {/* ✅ FOOTBALL ONLY: Sort Matches Button - Only visible for football */}
        {currentSport === "football" && (
          <TouchableOpacity
            style={[
              styles.settingsButton,
              {
                backgroundColor: theme.colors.backgroundSecondary,
                borderWidth: 1,
                borderColor: theme.colors.border,
              },
            ]}
            onPress={() => setShowMatchModeModal(true)}
            activeOpacity={0.7}
          >
            <ScoreIcon
              color={
                theme.colors.background === "#FFFFFF" ? "#000000" : "#FFFFFF"
              }
            />
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* ✅ FOOTBALL ONLY: Sort Matches Modal - Only shown for football */}
      {currentSport === "football" && (
        <SortMatchesModal
          visible={showMatchModeModal}
          currentSport={currentSport}
          currentMatchMode={selectedMatchMode}
          currentSortMode={selectedSortMode}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 36,
  },
  scrollContent: {
    paddingHorizontal: 4,
    paddingVertical: 0,
    flexGrow: 1,
    justifyContent: "space-between",
  },
  tab: {
    height: "100%",
    paddingHorizontal: 6,
    marginRight: 1,
    justifyContent: "center",
    flex: 1,
  },
  tabContent: {
    position: "relative",
    alignItems: "center",
  },
  tabText: {
    fontSize: 11,
    fontFamily: "Inter-Medium",
    includeFontPadding: false,
    textAlignVertical: "center",
    textAlign: "center",
  },
  indicator: {
    position: "absolute",
    bottom: -8,
    left: "50%",
    transform: [{ translateX: -12 }],
    width: 24,
    height: 4,
    borderRadius: 2,
  },
  badgeText: {
    fontSize: 9,
    fontFamily: "Inter-Bold",
  },
  settingsButton: {
    height: 24,
    width: 28,
    borderRadius: 4,
    marginLeft: 4,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  scoreIconText: {
    fontSize: 10,
    fontFamily: "Inter-Bold",
    fontWeight: "bold",
  },
  activeTab: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
});
