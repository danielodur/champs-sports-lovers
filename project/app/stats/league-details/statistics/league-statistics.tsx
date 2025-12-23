/**
 * League Statistics Tab
 * Displays league-wide statistics
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface LeagueStatisticsProps {
  leagueId: string;
  season: string;
  theme: any;
}

export default function LeagueStatistics({ leagueId, season, theme }: LeagueStatisticsProps) {
  const isDarkMode = theme.colors.backgroundSecondary !== "#F5F5F5";

  const stats = [
    { label: "Total Goals", value: "120" },
    { label: "Goals Per Match", value: "3.2" },
    { label: "Home Wins", value: "58 (48.3%)" },
    { label: "Draws", value: "48 (40.0%)" },
    { label: "Away Wins", value: "14 (11.7%)" },
    { label: "Clean Sheets", value: "35" },
    { label: "Yellow Cards", value: "283" },
    { label: "Red Cards", value: "12" },
  ];

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: theme.colors.text }]}>
        Season Statistics
      </Text>
      
      <View style={styles.statsContainer}>
        {stats.map((stat, index) => (
          <View
            key={index}
            style={styles.statRow}
          >
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              {stat.label}
            </Text>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {stat.value}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  statsContainer: {
    overflow: "hidden",
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(128, 128, 128, 0.2)",
  },
  statLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  statValue: {
    fontSize: 14,
    fontWeight: "700",
  },
});

