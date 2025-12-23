import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { Filter } from "lucide-react-native";
import { useTheme } from "../hooks/useTheme";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { getAllSports } from "@/config/sports-config"; // ✅ Import sports config

interface SportsTabsProps {
  active: string;
  onSelect: (sport: string) => void;
}

// Custom Score Icon Component
const ScoreIcon = ({ color }: { color: string }) => (
  <Text style={[styles.scoreIcon, { color }]}>|2:1|</Text>
);

const SportsTabs = React.memo(function SportsTabs({
  active,
  onSelect,
}: SportsTabsProps) {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();

  console.log("🏈 SportsTabs - Active sport:", active);

  // ✅ Generate tabs dynamically from sports config
  const sportConfigs = getAllSports();
  const tabs = [
    { id: "filter", icon: Filter },
    { id: "important", label: t("Top") },
    ...sportConfigs.map(sport => ({
      id: sport.id,
      label: t(sport.name),
      emoji: sport.emoji,
    })),
  ];

  const handleTabPress = (tabId: string) => {
    console.log("✅ INSTANT SPORTS TAB:", tabId);
    if (tabId === "filter") {
      router.push(`/filter?sport=${active}`);
    } else {
      console.log("✅ ZERO-JUMP TAB SELECTION:", tabId);
      // ✅ INSTANT TAB RESPONSE: Completely immediate, no delays whatsoever
      onSelect(tabId);
    }
  };

  // Separate filter button from other tabs
  const filterTab = tabs.find(tab => tab.id === "filter");
  const otherTabs = tabs.filter(tab => tab.id !== "filter");

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.backgroundSecondary },
      ]}
    >
      {/* Filter button positioned at left edge */}
      {filterTab && (
        <Pressable
          style={[styles.filterButton, styles.iconTab]}
          onPress={() => handleTabPress(filterTab.id)}
          android_ripple={{ color: "transparent" }}
          unstable_pressDelay={0}
          hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
          pressRetentionOffset={{
            top: 20,
            bottom: 20,
            left: 20,
            right: 20,
          }}
        >
          <Filter
            size={18}
            color={
              theme.colors.background === "#FFFFFF"
                ? "#000000"
                : "#FFFFFF"
            }
          />
        </Pressable>
      )}

      {/* Scrollable tabs container for other tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        bounces={false}
        scrollEventThrottle={1}
        // ✅ ZERO-JUMP SCROLLING: Complete layout stability
        removeClippedSubviews={false}
        keyboardShouldPersistTaps="handled"
        disableIntervalMomentum={true}
        disableScrollViewPanResponder={true}
      >
        {otherTabs.map((tab) => {
          const isActive = active === tab.id;
          console.log(
            `🏈 Tab ${tab.id}: active=${isActive}, current active=${active}`,
          );

          return (
            <Pressable
              key={tab.id}
              style={[styles.tab, tab.icon && styles.iconTab]}
              onPress={() => handleTabPress(tab.id)}
              android_ripple={{ color: "transparent" }}
              unstable_pressDelay={0}
              // ✨ BEAUTIFUL PRESS: Modern button behavior without jumping
              hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
              pressRetentionOffset={{
                top: 20,
                bottom: 20,
                left: 20,
                right: 20,
              }}
            >
              {tab.icon ? (
                <tab.icon
                  size={18}
                  color={
                    theme.colors.background === "#FFFFFF"
                      ? "#000000"
                      : "#FFFFFF"
                  }
                />
              ) : (
                <View style={styles.tabContent}>
                  {isActive && (
                    <View
                      style={[
                        styles.redVerticalLine,
                        { backgroundColor: theme.colors.primary },
                      ]}
                    />
                  )}
                  <Text
                    style={[
                      styles.tabText,
                      { color: theme.colors.textSecondary },
                      isActive && {
                        color:
                          theme.colors.background === "#FFFFFF"
                            ? "#666666"
                            : "#888888",
                      },
                    ]}
                  >
                    {tab.label}
                    {tab.emoji && (
                      <Text style={styles.emojiText}> {tab.emoji}</Text>
                    )}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
});

export default SportsTabs;

const styles = StyleSheet.create({
  container: {
    height: 40,
    flex: 1, // ✅ Allow space for settings button
    flexDirection: "row",
    // ✨ LAYOUT STABILITY: Prevent layout shifts
    overflow: "hidden",
    // ✨ TOP SCREEN NAVIGATION: Stable container during transitions
    flexShrink: 0,
  },
  filterButton: {
    height: "100%",
    paddingHorizontal: 10,
    marginLeft: 6,
    marginRight: 8,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 6,
    flexShrink: 0,
  },
  scrollContent: {
    paddingHorizontal: 6,
    paddingVertical: 0,
    // ✨ STABLE LAYOUT: Consistent container sizing
    minHeight: 40,
    // ✨ ANTI-JUMP: Prevent content shifting during navigation
    flexGrow: 1,
    // ✨ CENTER ALIGNMENT: With fewer tabs, center them nicely
    justifyContent: "center",
  },
  tab: {
    height: "100%",
    paddingHorizontal: 6,
    marginRight: 3,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    borderRadius: 6,
    // ✨ ANTI-JUMP: Stable button dimensions
    minWidth: 32,
    // ✨ TOP NAVIGATION: Prevent button size changes during transitions
    flexShrink: 0,
  },
  activeTab: {
    // Bright grey background added dynamically based on theme
  },
  iconTab: {
    width: 30,
  },
  tabContent: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    height: "100%",
    justifyContent: "center",
  },
  tabText: {
    fontSize: 13,
    fontFamily: "Inter-Medium",
    includeFontPadding: false,
    textAlignVertical: "center",
  },
  emojiText: {
    fontSize: 14,
    marginLeft: 2,
  },
  redVerticalLine: {
    position: "absolute",
    left: -4,
    top: "50%",
    marginTop: -8,
    width: 3,
    height: 16,
    borderRadius: 1.5,
  },
  scoreIcon: {
    fontSize: 12,
    fontFamily: "Inter-Bold",
    fontWeight: "bold",
  },
});
