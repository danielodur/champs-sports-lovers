/**
 * FIFA OFC Qualifiers - Main Router
 * 2026 FIFA World Cup OFC Zone Qualifiers
 * 
 * This component manages the OFC qualifiers tab system with 4 tabs:
 * 1. FIFA OFC Qualifiers Stage 3
 * 2. FIFA OFC Qualifiers Stage 2
 * 3. FIFA OFC Qualifiers Stage 1
 * 4. OFC Oceania Cup
 * 
 * It loads the appropriate table template based on the selected tab.
 */

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import FIFAOceaniaStage3 from "./fifa-oceania-stage-3";
import FIFAOceaniaStage2 from "./fifa-oceania-stage-2";
import FIFAOceaniaStage1 from "./fifa-oceania-stage-1";
import OceaniaCup from "./oceania-cup";

interface FIFAOceaniaGroupsQualifiersProps {
  currentTeamName: string;
  theme: any;
  teamColors: { primary: string; secondary: string };
  isDarkMode: boolean;
}

export default function FIFAOceaniaGroupsQualifiers({
  currentTeamName,
  theme,
  teamColors,
  isDarkMode,
}: FIFAOceaniaGroupsQualifiersProps) {
  const [selectedTab, setSelectedTab] = useState("stage-3");

  const renderTabContent = () => {
    const commonProps = {
      currentTeamName,
      theme,
      teamColors,
      isDarkMode,
    };

    switch (selectedTab) {
      case "stage-3":
        return <FIFAOceaniaStage3 {...commonProps} />;
      case "stage-2":
        return <FIFAOceaniaStage2 {...commonProps} />;
      case "stage-1":
        return <FIFAOceaniaStage1 {...commonProps} />;
      case "oceania-cup":
        return <OceaniaCup {...commonProps} />;
      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Tab Navigation */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            selectedTab === "stage-3" && styles.activeTabButton,
            selectedTab === "stage-3" && { borderBottomColor: teamColors.primary },
          ]}
          onPress={() => setSelectedTab("stage-3")}
        >
          <Text
            style={[
              styles.tabButtonText,
              { color: selectedTab === "stage-3" ? teamColors.primary : theme.colors.textSecondary },
            ]}
          >
            FIFA OFC Qualifiers Stage 3
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            selectedTab === "stage-2" && styles.activeTabButton,
            selectedTab === "stage-2" && { borderBottomColor: teamColors.primary },
          ]}
          onPress={() => setSelectedTab("stage-2")}
        >
          <Text
            style={[
              styles.tabButtonText,
              { color: selectedTab === "stage-2" ? teamColors.primary : theme.colors.textSecondary },
            ]}
          >
            FIFA OFC Qualifiers Stage 2
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            selectedTab === "stage-1" && styles.activeTabButton,
            selectedTab === "stage-1" && { borderBottomColor: teamColors.primary },
          ]}
          onPress={() => setSelectedTab("stage-1")}
        >
          <Text
            style={[
              styles.tabButtonText,
              { color: selectedTab === "stage-1" ? teamColors.primary : theme.colors.textSecondary },
            ]}
          >
            FIFA OFC Qualifiers Stage 1
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            selectedTab === "oceania-cup" && styles.activeTabButton,
            selectedTab === "oceania-cup" && { borderBottomColor: teamColors.primary },
          ]}
          onPress={() => setSelectedTab("oceania-cup")}
        >
          <Text
            style={[
              styles.tabButtonText,
              { color: selectedTab === "oceania-cup" ? teamColors.primary : theme.colors.textSecondary },
            ]}
          >
            OFC Oceania Cup
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Tab Content */}
      {renderTabContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabsContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 16,
  },
  tabButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 8,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTabButton: {
    borderBottomWidth: 2,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
});

