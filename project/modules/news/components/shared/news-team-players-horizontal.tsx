/**
 * @fileoverview NewsTeamPlayersHorizontal - Horizontal category tabs for player rankings
 *
 * This component handles the horizontal navigation tabs for different player categories
 * (Goal Scorers, Assists, Shots, etc.) matching the Chinese sports app layout.
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
  Activity,
  Award,
  Zap,
  Clock,
  Shield,
  Flag,
  Users,
  BarChart3,
} from "lucide-react-native";

/**
 * Interface for ranking categories and statistics
 */
export interface PlayerRankingCategory {
  id: string;
  label: string;
  icon: React.ReactNode;
  stats: PlayerRankingStat[];
}

export interface PlayerRankingStat {
  id: string;
  label: string;
  key: string;
  unit?: string;
  color?: string;
}

// Player ranking categories with statistics
export const playerRankingCategories: PlayerRankingCategory[] = [
  {
    id: "goalscorers",
    label: "Goal Scorers",
    icon: <Target size={20} />,
    stats: [
      {
        id: "goals",
        label: "Goals",
        key: "value",
        unit: "",
        color: "#4CAF50",
      },
      {
        id: "assists",
        label: "Assists",
        key: "value",
        unit: "",
        color: "#2196F3",
      },
      {
        id: "goals_assists",
        label: "Goals + Assists",
        key: "value",
        unit: "",
        color: "#FF9800",
      },
      {
        id: "shots",
        label: "Shots",
        key: "value",
        unit: "",
        color: "#9C27B0",
      },
      {
        id: "shots_on_target",
        label: "Shots on Target",
        key: "value",
        unit: "",
        color: "#00BCD4",
      },
      {
        id: "shot_accuracy",
        label: "Shot Accuracy",
        key: "value",
        unit: "%",
        color: "#FFC107",
      },
      {
        id: "penalties",
        label: "Penalties",
        key: "value",
        unit: "",
        color: "#795548",
      },
      {
        id: "free_kicks",
        label: "Free Kicks",
        key: "value",
        unit: "",
        color: "#607D8B",
      },
      {
        id: "headers",
        label: "Headers",
        key: "value",
        unit: "",
        color: "#E91E63",
      },
      {
        id: "goals_per_90",
        label: "Goals per 90min",
        key: "average",
        unit: "",
        color: "#3F51B5",
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
        color: "#2196F3",
      },
      {
        id: "key_passes",
        label: "Key Passes",
        key: "value",
        unit: "",
        color: "#4CAF50",
      },
      {
        id: "through_balls",
        label: "Through Balls",
        key: "value",
        unit: "",
        color: "#FF9800",
      },
      {
        id: "crosses",
        label: "Crosses",
        key: "value",
        unit: "",
        color: "#9C27B0",
      },
      {
        id: "successful_crosses",
        label: "Successful Crosses",
        key: "value",
        unit: "",
        color: "#00BCD4",
      },
      {
        id: "pass_accuracy",
        label: "Pass Accuracy",
        key: "value",
        unit: "%",
        color: "#FFC107",
      },
      {
        id: "long_passes",
        label: "Long Passes",
        key: "value",
        unit: "",
        color: "#795548",
      },
      {
        id: "successful_long_passes",
        label: "Successful Long Passes",
        key: "value",
        unit: "",
        color: "#607D8B",
      },
      {
        id: "assists_per_90",
        label: "Assists per 90min",
        key: "average",
        unit: "",
        color: "#E91E63",
      },
    ],
  },
  {
    id: "shots",
    label: "Shots",
    icon: <Activity size={20} />,
    stats: [
      {
        id: "shots",
        label: "Shots",
        key: "value",
        unit: "",
        color: "#9C27B0",
      },
      {
        id: "shots_on_target",
        label: "Shots on Target",
        key: "value",
        unit: "",
        color: "#00BCD4",
      },
      {
        id: "shot_accuracy",
        label: "Shot Accuracy",
        key: "value",
        unit: "%",
        color: "#FFC107",
      },
      {
        id: "shots_blocked",
        label: "Shots Blocked",
        key: "value",
        unit: "",
        color: "#795548",
      },
      {
        id: "shots_per_90",
        label: "Shots per 90min",
        key: "average",
        unit: "",
        color: "#607D8B",
      },
    ],
  },
  {
    id: "dribbles",
    label: "Dribbles",
    icon: <Zap size={20} />,
    stats: [
      {
        id: "dribbles",
        label: "Dribbles",
        key: "value",
        unit: "",
        color: "#E91E63",
      },
      {
        id: "successful_dribbles",
        label: "Successful Dribbles",
        key: "value",
        unit: "",
        color: "#4CAF50",
      },
      {
        id: "dribble_success_rate",
        label: "Dribble Success Rate",
        key: "value",
        unit: "%",
        color: "#2196F3",
      },
      {
        id: "nutmegs",
        label: "Nutmegs",
        key: "value",
        unit: "",
        color: "#FF9800",
      },
      {
        id: "dribbles_per_90",
        label: "Dribbles per 90min",
        key: "average",
        unit: "",
        color: "#9C27B0",
      },
    ],
  },
  {
    id: "passing",
    label: "Passing",
    icon: <BarChart3 size={20} />,
    stats: [
      {
        id: "passes",
        label: "Passes",
        key: "value",
        unit: "",
        color: "#8BC34A",
      },
      {
        id: "successful_passes",
        label: "Successful Passes",
        key: "value",
        unit: "",
        color: "#4CAF50",
      },
      {
        id: "pass_accuracy",
        label: "Pass Accuracy",
        key: "value",
        unit: "%",
        color: "#2196F3",
      },
      {
        id: "key_passes",
        label: "Key Passes",
        key: "value",
        unit: "",
        color: "#FF9800",
      },
      {
        id: "long_passes",
        label: "Long Passes",
        key: "value",
        unit: "",
        color: "#9C27B0",
      },
      {
        id: "crosses",
        label: "Crosses",
        key: "value",
        unit: "",
        color: "#00BCD4",
      },
      {
        id: "passes_per_90",
        label: "Passes per 90min",
        key: "average",
        unit: "",
        color: "#FFC107",
      },
    ],
  },
  {
    id: "defense",
    label: "Defense",
    icon: <Shield size={20} />,
    stats: [
      {
        id: "tackles",
        label: "Tackles",
        key: "value",
        unit: "",
        color: "#795548",
      },
      {
        id: "interceptions",
        label: "Interceptions",
        key: "value",
        unit: "",
        color: "#607D8B",
      },
      {
        id: "blocks",
        label: "Blocks",
        key: "value",
        unit: "",
        color: "#9E9E9E",
      },
      {
        id: "clearances",
        label: "Clearances",
        key: "value",
        unit: "",
        color: "#607D8B",
      },
      {
        id: "aerial_duels_won",
        label: "Aerial Duels Won",
        key: "value",
        unit: "",
        color: "#795548",
      },
      {
        id: "tackles_per_90",
        label: "Tackles per 90min",
        key: "average",
        unit: "",
        color: "#5D4037",
      },
    ],
  },
  {
    id: "discipline",
    label: "Discipline",
    icon: <Flag size={20} />,
    stats: [
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
        id: "fouls_committed",
        label: "Fouls Committed",
        key: "value",
        unit: "",
        color: "#FF9800",
      },
      {
        id: "fouls_suffered",
        label: "Fouls Suffered",
        key: "value",
        unit: "",
        color: "#9C27B0",
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
    id: "appearances",
    label: "Appearances",
    icon: <Clock size={20} />,
    stats: [
      {
        id: "appearances",
        label: "Appearances",
        key: "totalMatches",
        unit: "",
        color: "#3F51B5",
      },
      {
        id: "starting_appearances",
        label: "Starting XI",
        key: "value",
        unit: "",
        color: "#4CAF50",
      },
      {
        id: "minutes_played",
        label: "Minutes Played",
        key: "value",
        unit: "min",
        color: "#2196F3",
      },
      {
        id: "avg_minutes",
        label: "Avg Minutes",
        key: "average",
        unit: "min",
        color: "#FF9800",
      },
      {
        id: "substitutions_on",
        label: "Substitutions On",
        key: "value",
        unit: "",
        color: "#9C27B0",
      },
      {
        id: "substitutions_off",
        label: "Substitutions Off",
        key: "value",
        unit: "",
        color: "#00BCD4",
      },
    ],
  },
];

interface NewsTeamPlayersHorizontalProps {
  activeCategory: string;
  onCategoryChange: (categoryId: string) => void;
}

export default function NewsTeamPlayersHorizontal({
  activeCategory,
  onCategoryChange,
}: NewsTeamPlayersHorizontalProps) {
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
        {playerRankingCategories.map((category) => (
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
