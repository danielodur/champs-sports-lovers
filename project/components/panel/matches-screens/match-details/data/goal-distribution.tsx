import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useTheme } from "@/hooks/useTheme";

interface GoalDistributionProps {
  homeTeamName: string;
  awayTeamName: string;
  homeTeamLogo: string;
  awayTeamLogo: string;
  matchId?: string;
  homeTeamId?: string;
  awayTeamId?: string;
  sport?: string; // "football" | "basketball"
}

interface TimeIntervalGoals {
  interval: string;
  homeGoals: number;
  awayGoals: number;
}

interface GoalDistributionData {
  homeTotalGoals: number;
  awayTotalGoals: number;
  intervals: TimeIntervalGoals[];
}

export default function GoalDistribution({
  homeTeamName,
  awayTeamName,
  homeTeamLogo,
  awayTeamLogo,
  matchId,
  homeTeamId,
  awayTeamId,
  sport = "football", // Default to football
}: GoalDistributionProps) {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "sameCompetition">("all");
  const [distributionData, setDistributionData] = useState<GoalDistributionData | null>(null);

  // 🏀⚽ BASKETBALL/FOOTBALL: Different time intervals
  const isBasketball = sport === "basketball";
  const TIME_INTERVALS = isBasketball 
    ? ["Q1", "Q2", "Q3", "Q4", "OT"] // Basketball quarters
    : ["00'", "15'", "30'", "45'", "60'", "75'", "90'"]; // Football minutes

  console.log(`🏀⚽ [GoalDistribution] Sport: ${sport}, isBasketball: ${isBasketball}`);

  useEffect(() => {
    fetchGoalDistribution();
  }, [matchId, homeTeamId, awayTeamId, filter]);

  const fetchGoalDistribution = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validate required parameters
      if (!matchId) {
        throw new Error("Match ID is required");
      }

      if (!homeTeamName || !awayTeamName) {
        throw new Error("Team names are required");
      }

      console.log(`📊 Fetching ${isBasketball ? 'points' : 'goal'} distribution for match: ${matchId}`);
      console.log(`🏠 Home Team: ${homeTeamName} (ID: ${homeTeamId})`);
      console.log(`✈️ Away Team: ${awayTeamName} (ID: ${awayTeamId})`);
      console.log(`🔍 Filter: ${filter}`);

      // ✅ REAL API: Fetch match events to calculate goal/points distribution
      const ApiSportsService = (await import("@/services/api-sports-service")).default;
      const apiService = new ApiSportsService({
        apiKey: process.env.EXPO_PUBLIC_API_FOOTBALL_KEY || "",
        baseUrl: isBasketball ? "https://v1.basketball.api-sports.io" : "https://v3.football.api-sports.io",
      });

      // Fetch match events (goals/scoring events)
      const eventsResponse = await apiService.getMatchEvents(parseInt(matchId), sport).catch(() => null);
      
      if (!eventsResponse || !eventsResponse.response || eventsResponse.response.length === 0) {
        console.warn(`⚠️ No events found for match ${matchId} - showing empty state`);
        setDistributionData(null);
        setLoading(false);
        return;
      }

      const events = eventsResponse.response;
      
      // Calculate goal/points distribution by time intervals
      const intervals: TimeIntervalGoals[] = TIME_INTERVALS.map(interval => ({
        interval,
        homeGoals: 0,
        awayGoals: 0,
      }));

      let homeTotalGoals = 0;
      let awayTotalGoals = 0;

      // Process events and distribute by time intervals
      events.forEach((event: any) => {
        // For football: look for "Goal" events
        // For basketball: look for scoring events (2-point, 3-point field goals)
        const isGoalEvent = isBasketball 
          ? (event.type === "2pt" || event.type === "3pt" || event.type === "freethrow")
          : (event.type === "Goal");
        
        if (!isGoalEvent) return;

        const minute = event.time?.elapsed || 0;
        const isHomeTeam = event.team?.id?.toString() === homeTeamId?.toString();

        // Determine which interval this goal belongs to
        let intervalIndex = -1;
        if (isBasketball) {
          // Basketball: Q1, Q2, Q3, Q4, OT
          if (minute <= 12) intervalIndex = 0; // Q1
          else if (minute <= 24) intervalIndex = 1; // Q2
          else if (minute <= 36) intervalIndex = 2; // Q3
          else if (minute <= 48) intervalIndex = 3; // Q4
          else intervalIndex = 4; // OT
        } else {
          // Football: 00', 15', 30', 45', 60', 75', 90'
          if (minute <= 15) intervalIndex = 0;
          else if (minute <= 30) intervalIndex = 1;
          else if (minute <= 45) intervalIndex = 2;
          else if (minute <= 60) intervalIndex = 3;
          else if (minute <= 75) intervalIndex = 4;
          else intervalIndex = 5;
        }

        if (intervalIndex >= 0 && intervalIndex < intervals.length) {
          if (isHomeTeam) {
            intervals[intervalIndex].homeGoals++;
            homeTotalGoals++;
          } else {
            intervals[intervalIndex].awayGoals++;
            awayTotalGoals++;
          }
        }
      });

      // Set distribution data
      setDistributionData({
        homeTotalGoals,
        awayTotalGoals,
        intervals,
      });

      console.log(`✅ ${isBasketball ? 'Points' : 'Goal'} distribution calculated:`, {
        homeTotalGoals,
        awayTotalGoals,
        intervals: intervals.map(i => `${i.interval}: ${i.homeGoals}-${i.awayGoals}`),
      });

    } catch (err) {
      console.error("❌ Failed to fetch goal distribution:", err);
      
      // Handle different error types
      let errorMessage = "Failed to load goal distribution data";
      
      if (err instanceof Error) {
        if (err.message.includes("Network")) {
          errorMessage = "Network error. Please check your connection.";
        } else if (err.message.includes("timeout")) {
          errorMessage = "Request timed out. Please try again.";
        } else if (err.message.includes("Invalid")) {
          errorMessage = "Invalid data received from server.";
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      setDistributionData(null);
    } finally {
      setLoading(false);
    }
  };

  const getHomeTeamColor = (goals: number, maxGoals: number): string => {
    if (goals === 0) return "#1C1C1C";
    
    const intensity = maxGoals > 0 ? goals / maxGoals : 0;
    
    // Orange/yellow gradient for home team (like Chinese app)
    if (intensity > 0.8) return "#FF9500"; // Brightest orange
    if (intensity > 0.6) return "#FFB84D"; // Medium orange
    if (intensity > 0.4) return "#FFC766"; // Light orange
    if (intensity > 0.2) return "#FFD699"; // Lighter orange
    return "#FFE5B3"; // Lightest orange
  };

  const getAwayTeamColor = (goals: number, maxGoals: number): string => {
    if (goals === 0) return "#1C1C1C";
    
    const intensity = maxGoals > 0 ? goals / maxGoals : 0;
    
    // Grey gradient for away team (like Chinese app)
    if (intensity > 0.8) return "#6B6B6B"; // Darkest grey
    if (intensity > 0.6) return "#808080"; // Dark grey
    if (intensity > 0.4) return "#999999"; // Medium grey
    if (intensity > 0.2) return "#B3B3B3"; // Light grey
    return "#CCCCCC"; // Lightest grey
  };

  const getTextColor = (goals: number, maxGoals: number, isHome: boolean): string => {
    if (goals === 0) return "#666666";
    
    const intensity = maxGoals > 0 ? goals / maxGoals : 0;
    
    // For home team (orange background)
    if (isHome) {
      return intensity > 0.5 ? "#000000" : "#333333";
    }
    
    // For away team (grey background)
    return intensity > 0.6 ? "#FFFFFF" : "#333333";
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#FF9500" />
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
          Loading {isBasketball ? 'points' : 'goal'} distribution...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={[styles.errorText, { color: "#FF4444" }]}>
          {error}
        </Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={fetchGoalDistribution}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!distributionData) {
    return (
      <View style={styles.emptyStateContainer}>
        <Text style={[styles.emptyStateText, { color: theme.colors.textSecondary }]}>
          No {isBasketball ? 'points' : 'goal'} distribution data available
        </Text>
        <Text style={[styles.emptyStateSubtext, { color: theme.colors.textSecondary }]}>
          {isBasketball ? 'Points' : 'Goal'} distribution data will appear here when available
        </Text>
      </View>
    );
  }

  // Calculate max goals for color intensity
  const allGoals = distributionData.intervals.flatMap(interval => [
    interval.homeGoals,
    interval.awayGoals
  ]);
  const maxGoals = Math.max(...allGoals, 1);

  return (
    <View style={styles.container}>
      {/* Filter Buttons */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === "all" && styles.filterButtonActive,
            { backgroundColor: filter === "all" ? "#3C3C3C" : theme.colors.backgroundSecondary }
          ]}
          onPress={() => setFilter("all")}
        >
          <Text
            style={[
              styles.filterButtonText,
              { color: filter === "all" ? "#FFFFFF" : theme.colors.textSecondary }
            ]}
          >
            Home/Away
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === "sameCompetition" && styles.filterButtonActive,
            { backgroundColor: filter === "sameCompetition" ? "#3C3C3C" : theme.colors.backgroundSecondary }
          ]}
          onPress={() => setFilter("sameCompetition")}
        >
          <Text
            style={[
              styles.filterButtonText,
              { color: filter === "sameCompetition" ? "#FFFFFF" : theme.colors.textSecondary }
            ]}
          >
            Same Competition
          </Text>
        </TouchableOpacity>
      </View>

      {/* Goal Distribution Table - Horizontal Scroll */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tableContainer}
      >
        <View style={styles.table}>
          {/* Header Row */}
          <View style={styles.headerRow}>
          <View style={[styles.cell, styles.teamCell]}>
            <Text style={[styles.headerText, { color: theme.colors.textSecondary }]}>
              Team
            </Text>
          </View>
          <View style={[styles.cell, styles.totalCell]}>
            <Text style={[styles.headerText, { color: theme.colors.textSecondary }]}>
              Total
            </Text>
          </View>
          {TIME_INTERVALS.map((interval, index) => (
            <View key={index} style={[styles.cell, styles.intervalCell]}>
              <Text style={[styles.headerText, { color: theme.colors.textSecondary }]}>
                {interval}
              </Text>
            </View>
          ))}
        </View>

        {/* Home Team Row */}
        <View style={styles.dataRow}>
          {/* Team Info */}
          <View style={[styles.cell, styles.teamCell, styles.teamInfoCell]}>
            <Image
              source={{ uri: homeTeamLogo || "https://via.placeholder.com/24" }}
              style={styles.teamLogo}
            />
            <Text
              style={[styles.teamNameText, { color: theme.colors.text }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {homeTeamName}
            </Text>
          </View>

          {/* Total Goals Cell - Dark background like Chinese app */}
          <View style={[styles.cell, styles.totalCell, { backgroundColor: "#2C2C2C" }]}>
            <Text style={[styles.totalGoalValue, { color: "#FFD699" }]}>
              {distributionData.homeTotalGoals}
            </Text>
          </View>

          {/* Goal Intervals */}
          {distributionData.intervals.map((interval, index) => (
            <View
              key={index}
              style={[
                styles.cell,
                styles.intervalCell,
                styles.goalCell,
                { backgroundColor: getHomeTeamColor(interval.homeGoals, maxGoals) }
              ]}
            >
              <Text
                style={[
                  styles.goalValue,
                  { color: getTextColor(interval.homeGoals, maxGoals, true) }
                ]}
              >
                {interval.homeGoals}
              </Text>
            </View>
          ))}
        </View>

        {/* Away Team Row */}
        <View style={styles.dataRow}>
          {/* Team Info */}
          <View style={[styles.cell, styles.teamCell, styles.teamInfoCell]}>
            <Image
              source={{ uri: awayTeamLogo || "https://via.placeholder.com/24" }}
              style={styles.teamLogo}
            />
            <Text
              style={[styles.teamNameText, { color: theme.colors.text }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {awayTeamName}
            </Text>
          </View>

          {/* Total Goals Cell - Medium grey background like Chinese app */}
          <View style={[styles.cell, styles.totalCell, { backgroundColor: "#4A4A4A" }]}>
            <Text style={[styles.totalGoalValue, { color: "#FFFFFF" }]}>
              {distributionData.awayTotalGoals}
            </Text>
          </View>

          {/* Goal Intervals */}
          {distributionData.intervals.map((interval, index) => (
            <View
              key={index}
              style={[
                styles.cell,
                styles.intervalCell,
                styles.goalCell,
                { backgroundColor: getAwayTeamColor(interval.awayGoals, maxGoals) }
              ]}
            >
              <Text
                style={[
                  styles.goalValue,
                  { color: getTextColor(interval.awayGoals, maxGoals, false) }
                ]}
              >
                {interval.awayGoals}
              </Text>
            </View>
          ))}
        </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 8,
    fontSize: 13,
    fontFamily: "Inter-Regular",
  },
  errorContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
    textAlign: "center",
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#FF4444",
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter-SemiBold",
  },
  emptyStateContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyStateText: {
    fontSize: 14,
    fontFamily: "Inter-SemiBold",
    textAlign: "center",
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 12,
    fontFamily: "Inter-Regular",
    textAlign: "center",
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterButtonActive: {
    borderWidth: 1,
    borderColor: "rgba(255, 149, 0, 0.3)",
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "Inter-SemiBold",
  },
  tableContainer: {
    minWidth: 600, // Ensure enough width for all columns
  },
  table: {
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    minWidth: 600, // Match container width
  },
  headerRow: {
    flexDirection: "row",
    backgroundColor: "#1C1C1C",
  },
  dataRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.05)",
  },
  cell: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    justifyContent: "center",
    alignItems: "center",
    borderRightWidth: 1,
    borderRightColor: "rgba(255, 255, 255, 0.05)",
  },
  teamCell: {
    width: 110,
    alignItems: "flex-start",
  },
  totalCell: {
    width: 60,
  },
  intervalCell: {
    flex: 1,
    minWidth: 48,
  },
  teamInfoCell: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  teamLogo: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 6,
  },
  teamNameText: {
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "Inter-SemiBold",
    flexShrink: 0, // Prevent shrinking, allow full text
  },
  headerText: {
    fontSize: 11,
    fontWeight: "600",
    fontFamily: "Inter-SemiBold",
    textAlign: "center",
  },
  goalCell: {
    borderRightWidth: 1,
    borderRightColor: "rgba(255, 255, 255, 0.1)",
  },
  goalValue: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Inter-Bold",
    textAlign: "center",
  },
  totalGoalValue: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Inter-Bold",
    textAlign: "center",
  },
});

