/**
 * Competition Tabs Component
 * 
 * Horizontal scrollable tabs for filtering matches by competition
 * Displays "All" + detected competitions (leagues/cups)
 */

import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { teamColorService } from "@/services/teamColorService";
import { Competition, truncateCompetitionName } from "../utils/competitionDetector";

interface CompetitionTabsProps {
  competitions: Competition[];
  selectedCompetitionId: string;
  onCompetitionSelect: (competitionId: string) => void;
  primaryColor: string;
  isDarkMode: boolean;
}

export default function CompetitionTabs({
  competitions,
  selectedCompetitionId,
  onCompetitionSelect,
  primaryColor,
  isDarkMode,
}: CompetitionTabsProps) {
  const theme = useTheme();
  const scrollViewRef = useRef<ScrollView>(null);

  // Helper function to get readable text color for team primary color
  // If team color is bright (like yellow), use white/light text for better contrast
  // Otherwise, use the team color itself
  const getReadableTextColor = (teamColor: string): string => {
    const isBright = teamColorService.isLightColor(teamColor);
    if (isBright) {
      // For bright colors (yellow, light blue, etc.), use white/light text
      return isDarkMode ? "#FFFFFF" : theme.colors.text;
    }
    // For dark colors, use the team color itself
    return teamColor;
  };

  // Auto-scroll to selected tab when it changes
  useEffect(() => {
    // Implementation for auto-scrolling can be added here if needed
  }, [selectedCompetitionId]);

  const renderTab = (
    id: string,
    label: string,
    isSelected: boolean
  ) => {
    const displayLabel = truncateCompetitionName(label, 30);
    
    return (
      <TouchableOpacity
        key={id}
        style={[
          styles.tab,
          {
            backgroundColor: isSelected
              ? `${primaryColor}20`
              : isDarkMode
              ? "rgba(255, 255, 255, 0.05)"
              : "rgba(0, 0, 0, 0.03)",
            borderColor: isSelected ? primaryColor : "transparent",
            borderWidth: isSelected ? 2 : 0,
          },
        ]}
        onPress={() => onCompetitionSelect(id)}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.tabLabel,
            {
              color: isSelected
                ? getReadableTextColor(primaryColor)
                : isDarkMode
                ? "#FFFFFF"
                : "#333333",
              fontWeight: isSelected ? "700" : "500",
            },
          ]}
        >
          {displayLabel}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* "All" Tab */}
        {renderTab(
          "all",
          "All",
          selectedCompetitionId === "all"
        )}

        {/* Competition Tabs */}
        {competitions.map((competition) =>
          renderTab(
            competition.id,
            competition.name,
            selectedCompetitionId === competition.id
          )
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
  },
  scrollView: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 10,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 22,
    marginRight: 10,
    minHeight: 40,
  },
  tabLabel: {
    fontSize: 14,
    fontFamily: "Inter-SemiBold",
  },
});

