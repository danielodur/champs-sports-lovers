import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/hooks/useTheme";

interface BasketballQuartersTableProps {
  homeTeamName: string;
  awayTeamName: string;
  quarters: {
    home: (number | null)[];
    away: (number | null)[];
  };
  homeScore: number;
  awayScore: number;
}

export default function BasketballQuartersTable({
  homeTeamName,
  awayTeamName,
  quarters,
  homeScore,
  awayScore,
}: BasketballQuartersTableProps) {
  const theme = useTheme();

  // Check if we have valid quarter data
  const hasQuarterData = quarters.home.some(q => q !== null) || quarters.away.some(q => q !== null);

  if (!hasQuarterData) {
    return null; // Don't show if no quarter data available
  }

  // Determine number of quarters (including overtime if exists)
  const quarterCount = Math.max(quarters.home.length, quarters.away.length);
  
  // Generate quarter labels (Q1, Q2, Q3, Q4, OT)
  const quarterLabels = Array.from({ length: quarterCount }, (_, i) => {
    if (i < 4) return `Q${i + 1}`;
    return "OT";
  });

  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.colors.backgroundSecondary,
      borderRadius: 12,
      padding: 16,
      marginHorizontal: 16,
      marginVertical: 12,
    },
    title: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.colors.text,
      marginBottom: 12,
    },
    table: {
      borderRadius: 8,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    headerRow: {
      flexDirection: "row",
      backgroundColor: theme.colors.background,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    row: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    lastRow: {
      borderBottomWidth: 0,
    },
    teamCell: {
      flex: 2,
      padding: 12,
      justifyContent: "center",
      backgroundColor: theme.colors.backgroundSecondary,
    },
    teamName: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.colors.text,
    },
    headerCell: {
      flex: 1,
      padding: 12,
      justifyContent: "center",
      alignItems: "center",
      borderLeftWidth: 1,
      borderLeftColor: theme.colors.border,
    },
    quarterCell: {
      flex: 1,
      padding: 12,
      justifyContent: "center",
      alignItems: "center",
      borderLeftWidth: 1,
      borderLeftColor: theme.colors.border,
      backgroundColor: theme.colors.backgroundSecondary,
    },
    totalCell: {
      flex: 1,
      padding: 12,
      justifyContent: "center",
      alignItems: "center",
      borderLeftWidth: 1,
      borderLeftColor: theme.colors.border,
      backgroundColor: theme.colors.background,
    },
    headerText: {
      fontSize: 12,
      fontWeight: "700",
      color: theme.colors.textSecondary,
      textTransform: "uppercase",
    },
    scoreText: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.colors.text,
    },
    totalText: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.colors.primary,
    },
    emptyText: {
      fontSize: 14,
      fontWeight: "400",
      color: theme.colors.textSecondary,
    },
    winningScore: {
      color: "#EF4444", // Red for winning team
    },
  });

  // Determine winning team
  const homeWinning = homeScore > awayScore;
  const awayWinning = awayScore > homeScore;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quarter Scores</Text>
      
      <View style={styles.table}>
        {/* Header Row */}
        <View style={styles.headerRow}>
          <View style={styles.teamCell}>
            <Text style={styles.headerText}>Team</Text>
          </View>
          {quarterLabels.map((label, index) => (
            <View key={`header-${index}`} style={styles.headerCell}>
              <Text style={styles.headerText}>{label}</Text>
            </View>
          ))}
          <View style={styles.totalCell}>
            <Text style={styles.headerText}>Total</Text>
          </View>
        </View>

        {/* Home Team Row */}
        <View style={styles.row}>
          <View style={styles.teamCell}>
            <Text style={styles.teamName} numberOfLines={1}>
              {homeTeamName}
            </Text>
          </View>
          {quarters.home.map((score, index) => (
            <View key={`home-${index}`} style={styles.quarterCell}>
              <Text style={styles.scoreText}>
                {score !== null ? score : "-"}
              </Text>
            </View>
          ))}
          <View style={styles.totalCell}>
            <Text style={[styles.totalText, homeWinning && styles.winningScore]}>
              {homeScore}
            </Text>
          </View>
        </View>

        {/* Away Team Row */}
        <View style={[styles.row, styles.lastRow]}>
          <View style={styles.teamCell}>
            <Text style={styles.teamName} numberOfLines={1}>
              {awayTeamName}
            </Text>
          </View>
          {quarters.away.map((score, index) => (
            <View key={`away-${index}`} style={styles.quarterCell}>
              <Text style={styles.scoreText}>
                {score !== null ? score : "-"}
              </Text>
            </View>
          ))}
          <View style={styles.totalCell}>
            <Text style={[styles.totalText, awayWinning && styles.winningScore]}>
              {awayScore}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

















































