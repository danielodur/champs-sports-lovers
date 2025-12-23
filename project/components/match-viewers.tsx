import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Users } from "lucide-react-native";
import followersService from "../services/followersService";
import { useTheme } from "../hooks/useTheme";

interface MatchViewersProps {
  matchId: number;
  size?: "small" | "medium";
  style?: any;
}

export default function MatchViewers({
  matchId,
  size = "medium",
  style
}: MatchViewersProps) {
  const theme = useTheme();

  const iconSize = size === "small" ? 12 : 14;
  const fontSize = size === "small" ? 10 : 11;

  const followersCount = followersService.getFormattedFollowersCount(matchId);

  return (
    <View style={[styles.viewersContainer, style]}>
      <Users
        size={iconSize}
        color={theme.colors.textSecondary}
      />
      <Text
        style={[
          styles.viewersCount,
          {
            color: theme.colors.textSecondary,
            fontSize: fontSize
          },
        ]}
      >
        {followersCount}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  viewersContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  viewersCount: {
    fontWeight: "500",
    letterSpacing: 0.2,
  },
});
