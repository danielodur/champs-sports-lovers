import React, { memo } from "react";
import { Text, View, StyleSheet } from "react-native";
import { useTheme } from "../hooks/useTheme";

interface TeamRankingProps {
  ranking: number | null;
  position: "home" | "away";
  teamName: string;
  style?: any;
}

const TeamRanking = memo<TeamRankingProps>(
  ({ ranking, position, teamName, style }) => {
    const theme = useTheme();

    if (!ranking || ranking <= 0) {
      return null;
    }

    const rankingText = `[${ranking}]`;

    return (
      <Text
        style={[
          styles.rankingText,
          { color: style?.color || theme.colors.textSecondary },
          position === "home" ? styles.homeRanking : styles.awayRanking,
          style,
        ]}
        numberOfLines={1}
      >
        {rankingText}
      </Text>
    );
  },
);

TeamRanking.displayName = "TeamRanking";

const styles = StyleSheet.create({
  rankingText: {
    fontSize: 12,
    fontWeight: "600",
    opacity: 0.9,
  },
  homeRanking: {
    marginRight: 4,
  },
  awayRanking: {
    marginLeft: 4,
  },
});

export default TeamRanking;
export { TeamRanking };
export type { TeamRankingProps };
