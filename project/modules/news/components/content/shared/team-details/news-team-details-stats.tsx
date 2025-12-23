import React from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";

interface TeamStatistics {
  position: number;
  points: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalsDiff: number;
  matchesPlayed: number;
  form: string;
}

interface NewsTeamDetailsStatsProps {
  statistics?: TeamStatistics | null;
  theme: any;
  loading?: boolean;
  sport?: string; // ✅ Add sport parameter
}

export default function NewsTeamDetailsStats({
  statistics,
  theme,
  loading = false,
  sport = "football", // ✅ Default to football
}: NewsTeamDetailsStatsProps) {
  const isBasketball = sport === "basketball";
  const scoreLabel = isBasketball ? "Points" : "Goals"; // ✅ Dynamic label based on sport
  if (loading) {
    return (
      <View style={[styles.tabContent, styles.centered]}>
        <ActivityIndicator size="large" color={theme.colors.primary || "#FF6B35"} />
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
          Loading statistics...
        </Text>
      </View>
    );
  }

  if (!statistics) {
    return (
      <View
        style={[
          styles.tabContent,
          {
            backgroundColor: theme.colors.background,
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
          },
        ]}
      >
        <Text
          style={[
            styles.comingSoonText,
            {
              color: theme.colors.textSecondary,
            },
          ]}
        >
          No statistics available
        </Text>
      </View>
    );
  }

  const winPercentage = statistics.matchesPlayed > 0 
    ? ((statistics.wins / statistics.matchesPlayed) * 100).toFixed(1)
    : "0.0";
  
  const cleanSheets = 0; // Would need to calculate from match data
  const avgGoalsScored = statistics.matchesPlayed > 0
    ? (statistics.goalsFor / statistics.matchesPlayed).toFixed(2)
    : "0.00";
  const avgGoalsConceded = statistics.matchesPlayed > 0
    ? (statistics.goalsAgainst / statistics.matchesPlayed).toFixed(2)
    : "0.00";

  return (
    <View
      style={[
        styles.tabContent,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <View style={[styles.statsCard, { backgroundColor: theme.colors.backgroundSecondary }]}>
        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
          Season Statistics
        </Text>

        <View style={styles.statRow}>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
            Matches Played:
          </Text>
          <Text style={[styles.statValue, { color: theme.colors.text }]}>
            {statistics.matchesPlayed}
          </Text>
        </View>

        <View style={styles.statRow}>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
            Win Percentage:
          </Text>
          <Text style={[styles.statValue, { color: "#4CAF50" }]}>
            {winPercentage}%
          </Text>
        </View>

        <View style={styles.statRow}>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
            {scoreLabel} Scored:
          </Text>
          <Text style={[styles.statValue, { color: theme.colors.text }]}>
            {statistics.goalsFor} ({avgGoalsScored} avg)
          </Text>
        </View>

        <View style={styles.statRow}>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
            {scoreLabel} Conceded:
          </Text>
          <Text style={[styles.statValue, { color: theme.colors.text }]}>
            {statistics.goalsAgainst} ({avgGoalsConceded} avg)
          </Text>
        </View>

        <View style={styles.statRow}>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
            {scoreLabel} Difference:
          </Text>
          <Text style={[
            styles.statValue, 
            { color: statistics.goalsDiff >= 0 ? "#4CAF50" : "#F44336" }
          ]}>
            {statistics.goalsDiff > 0 ? "+" : ""}{statistics.goalsDiff}
          </Text>
        </View>

        <View style={styles.statRow}>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
            Current Form:
          </Text>
          <View style={styles.formContainer}>
            {statistics.form.split('').slice(-5).map((result, index) => (
              <View
                key={index}
                style={[
                  styles.formBadge,
                  {
                    backgroundColor:
                      result === "W"
                        ? "#4CAF50"
                        : result === "D"
                        ? "#FF9800"
                        : "#F44336",
                  },
                ]}
              >
                <Text style={styles.formText}>{result}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabContent: {
    padding: 16,
    flex: 1,
    minHeight: 400,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  comingSoonText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 100,
    fontStyle: "italic",
  },
  statsCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(128,128,128,0.2)",
  },
  statLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  formContainer: {
    flexDirection: "row",
    gap: 6,
  },
  formBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  formText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
});
