/**
 * Interactive Hub Screen
 * 
 * Community feed where users can:
 * - View posts from influencers and other users
 * - Post predictions, recommendations, and tips
 * - Filter by sport (All, Football, Basketball, Rugby)
 * - Engage with likes and comments
 * - See trending posts and expert predictions
 */

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTheme, useThemeMode } from "@/hooks/useTheme";
import {
  ArrowLeft,
  Info,
} from "lucide-react-native";
import InteractiveAll from "./interactive-all";
import InteractiveFootball from "./interactive-football";
import InteractiveBasketball from "./interactive-basketball";
import InteractiveRugby from "./interactive-rugby";
import CreateInteractivePlatformModal from "@/app/help-center/common-feature-issues/create-interactive-platform";

const SPORT_TABS = ["All", "Football", "Basketball", "Rugby"];

export default function InteractiveHubScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { theme: themeMode } = useThemeMode();
  const isDarkMode = themeMode === "dark";
  
  const [selectedTab, setSelectedTab] = useState("All");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleCreatePost = () => {
    setShowCreateModal(true);
  };

  const renderTabContent = () => {
    switch (selectedTab) {
      case "All":
        return <InteractiveAll theme={theme} isDarkMode={isDarkMode} />;
      case "Football":
        return <InteractiveFootball theme={theme} isDarkMode={isDarkMode} />;
      case "Basketball":
        return <InteractiveBasketball theme={theme} isDarkMode={isDarkMode} />;
      case "Rugby":
        return <InteractiveRugby theme={theme} isDarkMode={isDarkMode} />;
      default:
        return <InteractiveAll theme={theme} isDarkMode={isDarkMode} />;
    }
  };

  // Get header title based on selected tab
  const getHeaderTitle = () => {
    switch (selectedTab) {
      case "All":
        return "Interactive Hub";
      case "Football":
        return "Football Post";
      case "Basketball":
        return "Basketball Post";
      case "Rugby":
        return "Rugby Post";
      default:
        return "Interactive Hub";
    }
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: theme.colors.background },
      ]}
      edges={["top"]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.colors.background,
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>

        <Text
          style={[
            styles.headerTitle,
            { color: theme.colors.text },
          ]}
        >
          {getHeaderTitle()}
        </Text>

        <TouchableOpacity
          style={styles.createButton}
          onPress={handleCreatePost}
        >
          <Info size={24} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      {/* Sport Filter Tabs */}
      <View
        style={[
          styles.tabsContainer,
          {
            backgroundColor: theme.colors.background,
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScrollContent}
        >
          {SPORT_TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tab,
                selectedTab === tab && styles.activeTab,
                {
                  backgroundColor:
                    selectedTab === tab
                      ? theme.colors.primary
                      : theme.colors.backgroundSecondary,
                },
              ]}
              onPress={() => setSelectedTab(tab)}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color:
                      selectedTab === tab
                        ? "#FFFFFF"
                        : theme.colors.textSecondary,
                  },
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Tab Content */}
      <View style={{ flex: 1 }}>
        {renderTabContent()}
      </View>

      {/* Create Interactive Platform Modal */}
      <CreateInteractivePlatformModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
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
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Inter-Bold",
  },
  createButton: {
    padding: 8,
  },
  tabsContainer: {
    borderBottomWidth: 1,
    paddingVertical: 8,
  },
  tabsScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  activeTab: {
    // Active styles applied via backgroundColor
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter-SemiBold",
  },
});
