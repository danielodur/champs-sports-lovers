/**
 * @fileoverview NewsTeamRankingsHorizontal - Horizontal category tabs for team rankings
 *
 * This component handles the horizontal navigation tabs for different team categories
 * (Goals, Losses, Gains, etc.) matching the Chinese sports app layout.
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
import {
  Target,
  TrendingUp,
  TrendingDown,
  Award,
  Activity,
  BarChart3,
  Shield,
  Zap,
  Clock,
  Flag,
} from "lucide-react-native";

/**
 * Interface for ranking categories and statistics
 */
export interface RankingCategory {
  id: string;
  label: string;
  icon: React.ReactNode;
  stats: RankingStat[];
}

export interface RankingStat {
  id: string;
  label: string;
  key: string;
  unit?: string;
  color?: string;
}

// Ranking categories with statistics
export const rankingCategories: RankingCategory[] = [
  {
    id: "goals",
    label: "Goals",
    icon: <Target size={20} />,
    stats: [
      {
        id: "goals_for",
        label: "Goals For",
        key: "value",
        unit: "",
        color: "#4CAF50",
      },
      {
        id: "goals_against",
        label: "Goals Against",
        key: "value",
        unit: "",
        color: "#F44336",
      },
      {
        id: "goal_points",
        label: "Goal Points",
        key: "value",
        unit: "",
        color: "#FF9800",
      },
      { id: "shots", label: "Shots", key: "value", unit: "", color: "#2196F3" },
      {
        id: "shots_on_target",
        label: "Shots on Target",
        key: "value",
        unit: "",
        color: "#9C27B0",
      },
      {
        id: "key_passes",
        label: "Key Passes",
        key: "value",
        unit: "",
        color: "#00BCD4",
      },
      { id: "saves", label: "Saves", key: "value", unit: "", color: "#FFC107" },
      {
        id: "blocks",
        label: "Blocks",
        key: "value",
        unit: "",
        color: "#795548",
      },
      {
        id: "clearances",
        label: "Clearances",
        key: "value",
        unit: "",
        color: "#607D8B",
      },
      {
        id: "yellow_cards",
        label: "Yellow Cards",
        key: "value",
        unit: "",
        color: "#FFEB3B",
      },
      {
        id: "red_cards",
        label: "Red Cards",
        key: "value",
        unit: "",
        color: "#F44336",
      },
      {
        id: "match_appearances",
        label: "Match Appearances",
        key: "value",
        unit: "",
        color: "#3F51B5",
      },
      {
        id: "pass_success",
        label: "Pass Success",
        key: "value",
        unit: "",
        color: "#4CAF50",
      },
      {
        id: "successful_passes",
        label: "Successful Passes",
        key: "value",
        unit: "",
        color: "#8BC34A",
      },
      {
        id: "assists",
        label: "Assists",
        key: "value",
        unit: "",
        color: "#CDDC39",
      },
      {
        id: "hit_frame",
        label: "Hit Frame",
        key: "value",
        unit: "",
        color: "#FF5722",
      },
      {
        id: "dribbles",
        label: "Dribbles",
        key: "value",
        unit: "",
        color: "#E91E63",
      },
      {
        id: "offsides",
        label: "Offsides",
        key: "value",
        unit: "",
        color: "#9E9E9E",
      },
    ],
  },
  {
    id: "losses",
    label: "Losses",
    icon: <TrendingDown size={20} />,
    stats: [
      {
        id: "losses",
        label: "Losses",
        key: "value",
        unit: "",
        color: "#F44336",
      },
      {
        id: "goals_against",
        label: "Goals Against",
        key: "value",
        unit: "",
        color: "#FF5252",
      },
      {
        id: "goals_conceded",
        label: "Goals Conceded",
        key: "value",
        unit: "",
        color: "#E57373",
      },
    ],
  },
  {
    id: "gains",
    label: "Gains",
    icon: <TrendingUp size={20} />,
    stats: [
      {
        id: "gain_points",
        label: "Gain Points",
        key: "value",
        unit: "",
        color: "#4CAF50",
      },
    ],
  },
  {
    id: "shots",
    label: "Shots",
    icon: <BarChart3 size={20} />,
    stats: [
      { id: "shots", label: "Shots", key: "value", unit: "", color: "#2196F3" },
      {
        id: "shots_on_target",
        label: "Shots on Target",
        key: "value",
        unit: "",
        color: "#1976D2",
      },
    ],
  },
  {
    id: "shots_target",
    label: "Shots on Target",
    icon: <Target size={20} />,
    stats: [
      {
        id: "shots_on_target",
        label: "Shots on Target",
        key: "value",
        unit: "",
        color: "#9C27B0",
      },
    ],
  },
  {
    id: "key_passes",
    label: "Key Passes",
    icon: <Activity size={20} />,
    stats: [
      {
        id: "key_passes",
        label: "Key Passes",
        key: "value",
        unit: "",
        color: "#00BCD4",
      },
    ],
  },
  {
    id: "saves",
    label: "Saves",
    icon: <Shield size={20} />,
    stats: [
      { id: "saves", label: "Saves", key: "value", unit: "", color: "#FFC107" },
    ],
  },
  {
    id: "blocks",
    label: "Blocks",
    icon: <Shield size={20} />,
    stats: [
      {
        id: "blocks",
        label: "Blocks",
        key: "value",
        unit: "",
        color: "#795548",
      },
    ],
  },
  {
    id: "clearances",
    label: "Clearances",
    icon: <Shield size={20} />,
    stats: [
      {
        id: "clearances",
        label: "Clearances",
        key: "value",
        unit: "",
        color: "#607D8B",
      },
    ],
  },
  {
    id: "yellow_cards",
    label: "Yellow Cards",
    icon: <Flag size={20} />,
    stats: [
      {
        id: "yellow_cards",
        label: "Yellow Cards",
        key: "value",
        unit: "",
        color: "#FFEB3B",
      },
    ],
  },
  {
    id: "red_cards",
    label: "Red Cards",
    icon: <Flag size={20} />,
    stats: [
      {
        id: "red_cards",
        label: "Red Cards",
        key: "value",
        unit: "",
        color: "#F44336",
      },
    ],
  },
  {
    id: "match_appearances",
    label: "Match Appearances",
    icon: <Clock size={20} />,
    stats: [
      {
        id: "match_appearances",
        label: "Match Appearances",
        key: "value",
        unit: "",
        color: "#3F51B5",
      },
    ],
  },
  {
    id: "passes",
    label: "Passes",
    icon: <BarChart3 size={20} />,
    stats: [
      {
        id: "pass_success",
        label: "Pass Success",
        key: "value",
        unit: "",
        color: "#4CAF50",
      },
      {
        id: "successful_passes",
        label: "Successful Passes",
        key: "value",
        unit: "",
        color: "#8BC34A",
      },
    ],
  },
  {
    id: "assists",
    label: "Assists",
    icon: <TrendingUp size={20} />,
    stats: [
      {
        id: "assists",
        label: "Assists",
        key: "value",
        unit: "",
        color: "#CDDC39",
      },
      {
        id: "successful_passes",
        label: "Successful Passes",
        key: "value",
        unit: "",
        color: "#8BC34A",
      },
      {
        id: "hit_frame",
        label: "Hit Frame",
        key: "value",
        unit: "",
        color: "#FF5722",
      },
      {
        id: "pass_success",
        label: "Pass Success",
        key: "value",
        unit: "",
        color: "#4CAF50",
      },
      {
        id: "hit_post",
        label: "Hit Post",
        key: "value",
        unit: "",
        color: "#FF6F00",
      },
      {
        id: "dribbles",
        label: "Dribbles",
        key: "value",
        unit: "",
        color: "#E91E63",
      },
      {
        id: "tackles",
        label: "Tackles",
        key: "value",
        unit: "",
        color: "#795548",
      },
      {
        id: "long_passes",
        label: "Long Passes",
        key: "value",
        unit: "",
        color: "#607D8B",
      },
      {
        id: "long_pass_success",
        label: "Long Pass Success",
        key: "value",
        unit: "",
        color: "#8BC34A",
      },
      { id: "fouls", label: "Fouls", key: "value", unit: "", color: "#FFC107" },
      {
        id: "crosses",
        label: "Crosses",
        key: "value",
        unit: "",
        color: "#9C27B0",
      },
      {
        id: "cross_success",
        label: "Cross Success",
        key: "value",
        unit: "",
        color: "#673AB7",
      },
      {
        id: "offsides",
        label: "Offsides",
        key: "value",
        unit: "",
        color: "#9E9E9E",
      },
    ],
  },
];

interface NewsTeamRankingsHorizontalProps {
  activeCategory: string;
  onCategoryChange: (categoryId: string) => void;
}

export default function NewsTeamRankingsHorizontal({
  activeCategory,
  onCategoryChange,
}: NewsTeamRankingsHorizontalProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.horizontalTabsContainer,
        {
          backgroundColor: theme.colors.background,
          borderBottomColor: theme.colors.border,
        },
      ]}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.horizontalTabsScroll}
        contentContainerStyle={styles.horizontalTabsContent}
      >
        {rankingCategories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.horizontalTab,
              activeCategory === category.id && styles.activeHorizontalTab,
              {
                borderColor:
                  activeCategory === category.id
                    ? theme.colors.accent
                    : "transparent",
              },
            ]}
            onPress={() => onCategoryChange(category.id)}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.horizontalTabIcon,
                { opacity: activeCategory === category.id ? 1 : 0.6 },
              ]}
            >
              {React.cloneElement(category.icon as React.ReactElement<any>, {
                color:
                  activeCategory === category.id
                    ? theme.colors.accent
                    : theme.colors.textSecondary,
              })}
            </View>
            <Text
              style={[
                styles.horizontalTabText,
                {
                  color:
                    activeCategory === category.id
                      ? theme.colors.accent
                      : theme.colors.textSecondary,
                  fontWeight: activeCategory === category.id ? "600" : "400",
                },
              ]}
            >
              {category.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  horizontalTabsContainer: {
    borderBottomWidth: 1,
    paddingVertical: 8,
  },
  horizontalTabsScroll: {
    flexGrow: 0,
  },
  horizontalTabsContent: {
    paddingHorizontal: 16,
    alignItems: "center",
  },
  horizontalTab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    borderRadius: 20,
    borderWidth: 1,
    minWidth: 100,
  },
  activeHorizontalTab: {
    backgroundColor: "rgba(255, 107, 53, 0.1)",
  },
  horizontalTabIcon: {
    marginRight: 6,
  },
  horizontalTabText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
