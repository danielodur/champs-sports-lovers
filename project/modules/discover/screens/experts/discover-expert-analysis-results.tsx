import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { useTheme } from "@/hooks/useTheme";

const { width } = Dimensions.get("window");

interface ExpertStats {
  recentWins: number;
  recentTotal: number;
  longestStreak: number;
  totalPredictions: number;
}

interface PerformanceRecord {
  result: "win" | "loss";
}

interface AnalysisResultsProps {
  expertId: string;
  onStatsUpdate?: (stats: ExpertStats) => void;
}

export default function DiscoverExpertAnalysisResults({
  expertId,
  onStatsUpdate,
}: AnalysisResultsProps) {
  const theme = useTheme();
  const [stats, setStats] = useState<ExpertStats>({
    recentWins: 6,
    recentTotal: 10,
    longestStreak: 6,
    totalPredictions: 72,
  });
  const [performanceHistory, setPerformanceHistory] = useState<
    PerformanceRecord[]
  >([
    { result: "loss" },
    { result: "win" },
    { result: "win" },
    { result: "win" },
    { result: "win" },
    { result: "win" },
    { result: "win" },
    { result: "win" },
  ]);

  useEffect(() => {
    loadExpertAnalysisData();
  }, [expertId]);

  const loadExpertAnalysisData = async () => {
    // API call would go here
    if (onStatsUpdate) {
      onStatsUpdate(stats);
    }
  };

  const formatRecentRecord = (): string => {
    return `${stats.recentWins} of ${stats.recentTotal}`;
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor:
            theme.colors.backgroundSecondary ||
            (theme.colors.background === "#FFFFFF" ? "#F5F5F5" : "#2A2A2A"),
          borderColor:
            theme.colors.border ||
            (theme.colors.background === "#FFFFFF"
              ? "#E0E0E0"
              : "rgba(255, 255, 255, 0.1)"),
        },
      ]}
    >
      {/* League Header */}
      <View style={styles.header}>
        <Text style={[styles.leagueTitle, { color: theme.colors.text }]}>
          UEFA Champions League
        </Text>
        <Text style={[styles.seasonText, { color: theme.colors.primary }]}>
          2025 Season
        </Text>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: theme.colors.primary }]}>
            {stats.recentWins}
          </Text>
          <Text
            style={[styles.statLabel, { color: theme.colors.textSecondary }]}
          >
            Recent Wins
          </Text>
        </View>

        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: theme.colors.primary }]}>
            {formatRecentRecord()}
          </Text>
          <Text
            style={[styles.statLabel, { color: theme.colors.textSecondary }]}
          >
            Recent Record
          </Text>
        </View>

        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: theme.colors.primary }]}>
            {stats.longestStreak}
          </Text>
          <Text
            style={[styles.statLabel, { color: theme.colors.textSecondary }]}
          >
            Longest Streak
          </Text>
        </View>

        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: theme.colors.primary }]}>
            {stats.totalPredictions}
          </Text>
          <Text
            style={[styles.statLabel, { color: theme.colors.textSecondary }]}
          >
            Total Predictions
          </Text>
        </View>
      </View>

      {/* Performance Indicators */}
      <View style={styles.performanceContainer}>
        <Text
          style={[
            styles.performanceLabel,
            { color: theme.colors.textSecondary },
          ]}
        >
          Recent:
        </Text>
        <View style={styles.indicators}>
          {performanceHistory.map((record, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                {
                  backgroundColor:
                    record.result === "win"
                      ? theme.colors.primary
                      : theme.colors.textSecondary || "#999999",
                },
              ]}
            />
          ))}
        </View>
        <Text
          style={[
            styles.performanceLabel,
            { color: theme.colors.textSecondary },
          ]}
        >
          Recent
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 20,
    margin: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  leagueTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
    textAlign: "center",
  },
  seasonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 32,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    textAlign: "center",
    fontWeight: "500",
    lineHeight: 16,
  },
  performanceContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  performanceLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  indicators: {
    flexDirection: "row",
    gap: 6,
  },
  indicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
});
