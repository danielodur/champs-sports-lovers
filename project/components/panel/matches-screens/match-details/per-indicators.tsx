import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { ThumbsUp } from "lucide-react-native";
import { useTheme } from "@/hooks/useTheme";

interface MatchStats {
  possession: { home: number; away: number };
  attacks: { home: number; away: number };
  dangerousAttacks: { home: number; away: number };
  shotsOnTarget: { home: number; away: number };
  shotsOffTarget: { home: number; away: number };
  corners: { home: number; away: number };
  shots?: { home: number; away: number };
  fouls?: { home: number; away: number };
  yellowCards?: { home: number; away: number };
  redCards?: { home: number; away: number };
}

interface PercentageIndicatorsProps {
  matchStats?: MatchStats | null;
  homeTeamName?: string;
  awayTeamName?: string;
  homeRating?: number;
  awayRating?: number;
  isLive?: boolean;
  currentMinute?: number;
}

export default function MatchDetailsPercentageIndicators({
  matchStats,
  homeTeamName = "Home",
  awayTeamName = "Away",
  homeRating = 85,
  awayRating = 85,
  isLive = false,
  currentMinute = 0,
}: PercentageIndicatorsProps) {
  const theme = useTheme();
  const [animatedValues, setAnimatedValues] = useState({
    homeProgress: new Animated.Value(0),
    awayProgress: new Animated.Value(0),
  });

  // Calculate team strength based on attacks, ratings, and stats
  const calculateTeamStrength = () => {
    let homeStrength = homeRating;
    let awayStrength = awayRating;

    if (matchStats) {
      const homeAttackBonus =
        ((matchStats.attacks?.home || 0) * 2 +
          (matchStats.dangerousAttacks?.home || 0) * 3 +
          (matchStats.shotsOnTarget?.home || 0) * 4) /
        10;
      const awayAttackBonus =
        ((matchStats.attacks?.away || 0) * 2 +
          (matchStats.dangerousAttacks?.away || 0) * 3 +
          (matchStats.shotsOnTarget?.away || 0) * 4) /
        10;

      homeStrength = Math.min(95, homeRating + homeAttackBonus);
      awayStrength = Math.min(95, awayRating + awayAttackBonus);
    }

    return { home: Math.round(homeStrength), away: Math.round(awayStrength) };
  };

  const teamStrength = calculateTeamStrength();

  // Ensure percentages add up to 100% for proper visual distribution
  const totalStrength = teamStrength.home + teamStrength.away;
  const normalizedHome =
    totalStrength > 0
      ? Math.round((teamStrength.home / totalStrength) * 100)
      : 50;
  const normalizedAway =
    totalStrength > 0
      ? Math.round((teamStrength.away / totalStrength) * 100)
      : 50;

  // Ensure they add up to exactly 100%
  const finalHome = normalizedHome;
  const finalAway = 100 - normalizedHome;

  // Animate values when stats change
  useEffect(() => {
    Animated.parallel([
      Animated.timing(animatedValues.homeProgress, {
        toValue: finalHome,
        duration: 1200,
        useNativeDriver: false,
      }),
      Animated.timing(animatedValues.awayProgress, {
        toValue: finalAway,
        duration: 1200,
        useNativeDriver: false,
      }),
    ]).start();
  }, [matchStats, homeRating, awayRating, finalHome, finalAway]);

  return (
    <View style={styles.container}>
      {/* Percentages and Thumbs at extreme edges */}
      <View style={styles.percentageRow}>
        {/* Home Team (Left edge) */}
        <View style={styles.homePercentageSection}>
          <ThumbsUp size={16} color="#FFFFFF" fill="#FFFFFF" />
          <Text style={[styles.percentageText, { color: "#FFFFFF" }]}>
            {finalHome}%
          </Text>
        </View>

        {/* Away Team (Right edge) */}
        <View style={styles.awayPercentageSection}>
          <Text style={[styles.percentageText, { color: "#FFFFFF" }]}>
            {finalAway}%
          </Text>
          <View style={styles.flippedThumb}>
            <ThumbsUp size={16} color="#FFFFFF" fill="#FFFFFF" />
          </View>
        </View>
      </View>

      {/* Full width progress bars - no grey area, colors based on percentages */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBackground}>
          {/* Home Team Progress Bar (Red - from left) */}
          <Animated.View
            style={[
              styles.progressBarHome,
              {
                width: `${teamStrength.home}%`,
              },
            ]}
          />

          {/* Away Team Progress Bar (Blue - from right) */}
          <Animated.View
            style={[
              styles.progressBarAway,
              {
                width: `${teamStrength.away}%`,
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 0,
    marginTop: 5,
    marginBottom: 0,
  },

  // Percentages positioned at extreme screen edges
  percentageRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 5,
    marginBottom: 4,
  },

  homePercentageSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  awayPercentageSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  percentageText: {
    fontSize: 16,
    fontWeight: "normal",
    fontFamily: "Inter-Regular",
  },

  // Full width progress container that nearly touches screen edges
  progressContainer: {
    marginHorizontal: -5,
    height: 4,
    paddingHorizontal: 0,
    marginBottom: 0,
  },

  progressBackground: {
    flex: 1,
    height: 4,
    position: "relative",
    flexDirection: "row",
    backgroundColor: "transparent",
  },

  progressBarHome: {
    position: "absolute",
    left: 0,
    top: 0,
    height: 4,
    backgroundColor: "#FF4444",
    zIndex: 2,
  },

  progressBarAway: {
    position: "absolute",
    right: 0,
    top: 0,
    height: 4,
    backgroundColor: "#4A90E2",
    zIndex: 2,
  },

  flippedThumb: {
    transform: [{ scaleX: -1 }],
  },
});
