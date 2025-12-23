/**
 * CONMEBOL Competitions - Main Router
 * South American Football Competitions
 * 
 * This component manages the CONMEBOL competitions tab system with 2 tabs:
 * 1. FIFA CONMEBOL Qualifiers
 * 2. Copa América Groups
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
import FIFACONMEBOLQualifiersTable from "./fifa-conmebol-qualifiers-table";
import CopaAmericaGroups from "./copa-america-groups";

interface CONMEBOLCompetitionsProps {
  currentTeamName: string;
  theme: any;
  teamColors: { primary: string; secondary: string };
  isDarkMode: boolean;
}

export default function CONMEBOLCompetitions({
  currentTeamName,
  theme,
  teamColors,
  isDarkMode,
}: CONMEBOLCompetitionsProps) {
  const [selectedTab, setSelectedTab] = useState("qualifiers");

  const renderTabContent = () => {
    const commonProps = {
      currentTeamName,
      theme,
      teamColors,
      isDarkMode,
    };

    switch (selectedTab) {
      case "qualifiers":
        return <FIFACONMEBOLQualifiersTable {...commonProps} />;
      case "copa-america":
        return <CopaAmericaGroups {...commonProps} />;
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
            selectedTab === "qualifiers" && styles.activeTabButton,
            selectedTab === "qualifiers" && { borderBottomColor: teamColors.primary },
          ]}
          onPress={() => setSelectedTab("qualifiers")}
        >
          <Text
            style={[
              styles.tabButtonText,
              { color: selectedTab === "qualifiers" ? teamColors.primary : theme.colors.textSecondary },
            ]}
          >
            FIFA CONMEBOL Qualifiers
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            selectedTab === "copa-america" && styles.activeTabButton,
            selectedTab === "copa-america" && { borderBottomColor: teamColors.primary },
          ]}
          onPress={() => setSelectedTab("copa-america")}
        >
          <Text
            style={[
              styles.tabButtonText,
              { color: selectedTab === "copa-america" ? teamColors.primary : theme.colors.textSecondary },
            ]}
          >
            Copa América Groups
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

