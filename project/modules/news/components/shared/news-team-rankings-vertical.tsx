/**
 * @fileoverview NewsTeamRankingsVertical - Vertical statistics tabs for team rankings
 *
 * This component handles the vertical sidebar tabs for different team statistics
 * within each category, matching the Chinese sports app layout.
 *
 * @author AI Assistant
 * @version 1.0.0
 */

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { RankingCategory, RankingStat } from "./news-team-rankings-horizontal";

interface NewsTeamRankingsVerticalProps {
  currentCategory: RankingCategory | undefined;
  activeStat: string;
  onStatChange: (statId: string) => void;
}

export default function NewsTeamRankingsVertical({
  currentCategory,
  activeStat,
  onStatChange,
}: NewsTeamRankingsVerticalProps) {
  const theme = useTheme();

  if (!currentCategory) {
    return null;
  }

  return (
    <View
      style={[
        styles.verticalTabsContainer,
        { backgroundColor: theme.colors.backgroundSecondary },
      ]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.verticalTabsScroll}
      >
        {currentCategory.stats.map((stat) => (
          <TouchableOpacity
            key={stat.id}
            style={[
              styles.verticalTab,
              activeStat === stat.id && [
                styles.activeVerticalTab,
                { backgroundColor: theme.colors.accent + "20" },
              ],
            ]}
            onPress={() => onStatChange(stat.id)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.verticalTabText,
                {
                  color:
                    activeStat === stat.id
                      ? theme.colors.accent
                      : theme.colors.textSecondary,
                  fontWeight: activeStat === stat.id ? "600" : "400",
                },
              ]}
            >
              {stat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  verticalTabsContainer: {
    width: 120,
    paddingVertical: 8,
  },
  verticalTabsScroll: {
    flex: 1,
  },
  verticalTab: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 8,
    marginVertical: 2,
    minHeight: 40,
    justifyContent: "center",
  },
  activeVerticalTab: {
    borderRadius: 8,
  },
  verticalTabText: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 16,
  },
});
