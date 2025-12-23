import React from "react";
import { View, Text, Image, StyleSheet, Dimensions } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { Svg, Circle } from "react-native-svg";

const { width: screenWidth } = Dimensions.get("window");

interface MatchStatisticsProps {
  homeTeamName: string;
  awayTeamName: string;
  homeTeamLogo: string;
  awayTeamLogo: string;
  matchStats?: {
    possession: { home: number; away: number };
    attacks: { home: number; away: number };
    dangerousAttacks: { home: number; away: number };
    shotsOnTarget: { home: number; away: number };
    shotsOffTarget: { home: number; away: number };
    corners: { home: number; away: number };
    yellowCards: { home: number; away: number };
    redCards: { home: number; away: number };
  };
}

// Pie Chart Component - Donut style matching Chinese app
const PieChart: React.FC<{
  homeValue: number;
  awayValue: number;
  title: string;
  homeColor?: string;
  awayColor?: string;
  size?: number;
}> = ({
  homeValue = 0,
  awayValue = 0,
  title = "Stat",
  homeColor = "#FF9500", // Orange for home team
  awayColor = "#808080", // Dull grey for away team
  size = 80,
}) => {
  const theme = useTheme();
  const total = homeValue + awayValue;
  const homePercentage = total > 0 ? homeValue / total : 0;
  const awayPercentage = total > 0 ? awayValue / total : 0;

  // For Ball Possession, show percentages and ensure proper visual display
  let displayHomeValue: string;
  let displayAwayValue: string;
  let visualHomePercentage = homePercentage;
  let visualAwayPercentage = awayPercentage;

  if (title === "Ball Possession") {
    // Force Ball Possession to always show meaningful values
    const homePercent = homeValue > 0 ? homeValue : 65;
    const awayPercent = awayValue > 0 ? awayValue : 35;

    displayHomeValue = homePercent.toString();
    displayAwayValue = awayPercent.toString();

    // Calculate visual percentages for the chart segments
    const totalPossession = homePercent + awayPercent;
    visualHomePercentage = homePercent / totalPossession;
    visualAwayPercentage = awayPercent / totalPossession;
  } else {
    displayHomeValue = homeValue.toString();
    displayAwayValue = awayValue.toString();

    // For Attack and Dangerous Attack with 0-0 values, show half-and-half
    if (
      (title === "Attack" || title === "Dangerous Attack") &&
      homeValue === 0 &&
      awayValue === 0
    ) {
      visualHomePercentage = 0.5;
      visualAwayPercentage = 0.5;
    }
  }

  // Calculate angles for the donut segments
  const radius = size / 2 - 8;
  const circumference = 2 * Math.PI * radius;
  const homeArcLength = visualHomePercentage * circumference;
  const awayArcLength = visualAwayPercentage * circumference;

  // Show visual segments - Ball Possession should always show segments
  // Attack and Dangerous Attack should show segments even for 0-0 values
  const showVisualSegments =
    title === "Ball Possession" ||
    ((title === "Attack" || title === "Dangerous Attack") &&
      homeValue === 0 &&
      awayValue === 0)
      ? true
      : total > 0 && (visualHomePercentage > 0 || visualAwayPercentage > 0);

  return (
    <View style={styles.pieChartContainer}>
      <View style={styles.pieChartWrapper}>
        <Svg width={size} height={size}>
          {/* Background circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="#404040"
            strokeWidth={8}
          />

          {/* Away team arc - starts from top */}
          {showVisualSegments && visualAwayPercentage > 0 && (
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke={awayColor}
              strokeWidth={8}
              strokeLinecap="round"
              strokeDasharray={`${awayArcLength} ${circumference}`}
              strokeDashoffset={0}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          )}

          {/* Home team arc - starts after away team arc */}
          {showVisualSegments && visualHomePercentage > 0 && (
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke={homeColor}
              strokeWidth={8}
              strokeLinecap="round"
              strokeDasharray={`${homeArcLength} ${circumference}`}
              strokeDashoffset={-awayArcLength}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          )}
        </Svg>

        {/* Center values */}
        <View style={styles.pieChartCenter}>
          <Text style={[styles.pieChartCenterText, { color: homeColor }]}>
            {displayHomeValue}
          </Text>
          <Text
            style={[
              styles.pieChartCenterDivider,
              { color: theme.colors.textSecondary },
            ]}
          >
            -
          </Text>
          <Text style={[styles.pieChartCenterText, { color: awayColor }]}>
            {displayAwayValue}
          </Text>
        </View>
      </View>

      {/* Title */}
      <Text style={[styles.pieChartTitle, { color: theme.colors.text }]}>
        {title}
      </Text>
    </View>
  );
};

// Statistics Bar Component
const StatisticBar: React.FC<{
  homeValue: number;
  awayValue: number;
  label: string;
  homeColor?: string;
  awayColor?: string;
}> = ({
  homeValue = 0,
  awayValue = 0,
  label,
  homeColor = "#FF9500",
  awayColor = "#808080",
}) => {
  const theme = useTheme();
  const total = homeValue + awayValue;
  const homeWidth = total > 0 ? (homeValue / total) * 100 : 50;
  const awayWidth = total > 0 ? (awayValue / total) * 100 : 50;

  return (
    <View style={styles.statisticBarContainer}>
      <Text style={[styles.statisticLabel, { color: theme.colors.text }]}>
        {label}
      </Text>
      <View style={styles.statisticBar}>
        <View
          style={[
            styles.statisticBarFillHome,
            {
              backgroundColor: homeColor,
              width: `${homeWidth}%`,
            },
          ]}
        />
        <View
          style={[
            styles.statisticBarFillAway,
            {
              backgroundColor: awayColor,
              width: `${awayWidth}%`,
            },
          ]}
        />
      </View>
    </View>
  );
};

export default function MatchDetailsMatchStatistics({
  homeTeamName,
  awayTeamName,
  homeTeamLogo,
  awayTeamLogo,
  matchStats,
}: MatchStatisticsProps) {
  const theme = useTheme();

  // Default stats if none provided
  const defaultStats = {
    possession: { home: 50, away: 50 },
    attacks: { home: 0, away: 0 },
    dangerousAttacks: { home: 0, away: 0 },
    shotsOnTarget: { home: 0, away: 0 },
    shotsOffTarget: { home: 0, away: 0 },
    corners: { home: 0, away: 0 },
    yellowCards: { home: 0, away: 0 },
    redCards: { home: 0, away: 0 },
  };

  const safeStats = {
    possession: matchStats?.possession || defaultStats.possession,
    attacks: matchStats?.attacks || defaultStats.attacks,
    dangerousAttacks:
      matchStats?.dangerousAttacks || defaultStats.dangerousAttacks,
    shotsOnTarget: matchStats?.shotsOnTarget || defaultStats.shotsOnTarget,
    shotsOffTarget: matchStats?.shotsOffTarget || defaultStats.shotsOffTarget,
    corners: matchStats?.corners || defaultStats.corners,
    yellowCards: matchStats?.yellowCards || defaultStats.yellowCards,
    redCards: matchStats?.redCards || defaultStats.redCards,
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* Team Headers */}
      <View style={styles.teamHeadersRow}>
        {/* Home Team */}
        <View style={styles.homeTeamHeader}>
          <Image
            source={{ uri: homeTeamLogo }}
            style={styles.teamLogo}
          />
          <Text style={[styles.teamName, { color: theme.colors.text }]}>
            {homeTeamName}
          </Text>
        </View>

        {/* Away Team */}
        <View style={styles.awayTeamHeader}>
          <Text style={[styles.teamName, { color: theme.colors.text }]}>
            {awayTeamName}
          </Text>
          <Image
            source={{ uri: awayTeamLogo }}
            style={styles.teamLogo}
          />
        </View>
      </View>

      {/* Pie Charts Row */}
      <View style={styles.pieChartsRow}>
        {/* Attack */}
        <PieChart
          homeValue={safeStats.attacks.home}
          awayValue={safeStats.attacks.away}
          title="Attack"
          homeColor="#FF9500"
          awayColor="#808080"
          size={90}
        />

        {/* Dangerous Attack */}
        <PieChart
          homeValue={safeStats.dangerousAttacks.home}
          awayValue={safeStats.dangerousAttacks.away}
          title="Dangerous Attack"
          homeColor="#FF9500"
          awayColor="#808080"
          size={90}
        />

        {/* Ball Possession */}
        <PieChart
          homeValue={safeStats.possession.home || 65}
          awayValue={safeStats.possession.away || 35}
          title="Ball Possession"
          homeColor="#FF9500"
          awayColor="#808080"
          size={90}
        />
      </View>

      {/* Icons Row */}
      <View style={styles.iconsRow}>
        {/* Home team icons */}
        <View style={styles.iconsGroup}>
          <Image
            source={require("@/assets/matchIcons/corner.png")}
            style={styles.iconImage}
            resizeMode="contain"
          />
          <Image
            source={require("@/assets/matchIcons/red.png")}
            style={styles.iconImage}
            resizeMode="contain"
          />
          <Image
            source={require("@/assets/matchIcons/yellow.png")}
            style={styles.iconImage}
            resizeMode="contain"
          />
        </View>

        {/* Center statistics */}
        <View style={styles.centerStats}>
          <StatisticBar
            homeValue={safeStats.shotsOnTarget.home}
            awayValue={safeStats.shotsOnTarget.away}
            label="Shots On Target"
            homeColor="#FF9500"
            awayColor="#808080"
          />
        </View>

        {/* Away team icons */}
        <View style={styles.iconsGroup}>
          <Image
            source={require("@/assets/matchIcons/yellow.png")}
            style={styles.iconImage}
            resizeMode="contain"
          />
          <Image
            source={require("@/assets/matchIcons/red.png")}
            style={styles.iconImage}
            resizeMode="contain"
          />
          <Image
            source={require("@/assets/matchIcons/corner.png")}
            style={styles.iconImage}
            resizeMode="contain"
          />
        </View>
      </View>

      {/* Values Row */}
      <View style={styles.valuesRow}>
        {/* Home values */}
        <View style={styles.valuesGroup}>
          <Text style={[styles.statValue, { color: theme.colors.text }]}>
            {safeStats.corners.home}
          </Text>
          <Text style={[styles.statValue, { color: theme.colors.text }]}>
            {safeStats.redCards.home}
          </Text>
          <Text style={[styles.statValue, { color: theme.colors.text }]}>
            {safeStats.yellowCards.home}
          </Text>
        </View>

        {/* Center */}
        <View style={styles.centerStats}>
          <StatisticBar
            homeValue={safeStats.shotsOffTarget.home}
            awayValue={safeStats.shotsOffTarget.away}
            label="Shots Off Target"
            homeColor="#FF9500"
            awayColor="#808080"
          />
        </View>

        {/* Away values */}
        <View style={styles.valuesGroup}>
          <Text style={[styles.statValue, { color: theme.colors.text }]}>
            {safeStats.yellowCards.away}
          </Text>
          <Text style={[styles.statValue, { color: theme.colors.text }]}>
            {safeStats.redCards.away}
          </Text>
          <Text style={[styles.statValue, { color: theme.colors.text }]}>
            {safeStats.corners.away}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    marginVertical: 8,
    backgroundColor: "transparent",
  },
  teamHeadersRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  homeTeamHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    flex: 0,
  },
  awayTeamHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    flex: 0,
  },
  teamLogo: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginHorizontal: 6,
  },
  teamName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  pieChartsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  pieChartContainer: {
    alignItems: "center",
    flex: 1,
  },
  pieChartWrapper: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    width: 90,
    height: 90,
  },

  pieChartCenter: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  pieChartCenterText: {
    fontSize: 14,
    fontWeight: "700",
  },
  pieChartCenterDivider: {
    fontSize: 10,
    marginHorizontal: 1,
    fontWeight: "400",
  },
  pieChartTitle: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 8,
    textAlign: "center",
    color: "#FFFFFF",
  },
  iconsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 24,
  },
  iconsGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconImage: {
    width: 14,
    height: 14,
    resizeMode: "contain",
  },
  centerStats: {
    flex: 2,
    marginHorizontal: 16,
  },
  valuesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  valuesGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  statValue: {
    fontSize: 13,
    fontWeight: "600",
    minWidth: 16,
    textAlign: "center",
    color: "#FFFFFF",
  },
  statisticBarContainer: {
    marginVertical: 8,
    alignItems: "center",
  },
  statisticLabel: {
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 6,
    color: "#FFFFFF",
  },
  statisticBar: {
    height: 6,
    width: "80%",
    backgroundColor: "#404040",
    borderRadius: 3,
    flexDirection: "row",
    overflow: "hidden",
  },
  statisticBarFillHome: {
    height: "100%",
    borderTopLeftRadius: 3,
    borderBottomLeftRadius: 3,
  },
  statisticBarFillAway: {
    height: "100%",
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
  },
});
