/**
 * Universal Sports Team Live Matches Component
 *
 * Real-time team match tracking during live games for sports events app.
 * Features live goal tracking, team performance, match events, and score updates.
 * Designed to integrate with news-team-matches.tsx and match Chinese app functionality.
 *
 * Usage:
 * <NewsTeamLiveMatches teamId="team-id" liveMatchData={liveMatchData} />
 *
 * Features:
 * - Real-time team performance updates
 * - Live goal/event tracking with player info
 * - Match score updates during live games
 * - Animated event indicators
 * - Team-focused live match display
 * - Universal adaptability for all sports
 *
 * Note: Template adaptable for Soccer, Basketball, Rugby with sport-specific metrics
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Animated,
} from "react-native";
import { useTheme } from "@/hooks/useTheme";

interface Goal {
  id: string;
  minute: number;
  playerName: string;
  playerImage: string;
  teamSide: "home" | "away";
  rating: number;
}

interface LiveTeamMatchData {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  homeLogoUrl: string;
  awayLogoUrl: string;
  matchStatus: "Live" | "HT" | "1H" | "2H" | "FT";
  currentMinute: number;
  goals: Goal[];
}

interface NewsTeamLiveMatchesProps {
  matchData: LiveTeamMatchData;
  isLive?: boolean;
}

const NewsTeamLiveMatches: React.FC<NewsTeamLiveMatchesProps> = ({
  matchData,
  isLive = false,
}) => {
  const theme = useTheme();
  const [currentGoalIndex, setCurrentGoalIndex] = useState(0);
  const [fadeAnim] = useState(new Animated.Value(1));

  // Check if we're in dark mode - using proper theme detection
  const isDarkMode = theme.colors.background !== "#FFFFFF";

  // Auto-cycle through goals every 10 seconds if there are multiple goals
  useEffect(() => {
    if (!isLive || matchData.goals.length <= 1) return;

    const interval = setInterval(() => {
      // Fade out animation
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        // Change goal
        setCurrentGoalIndex(
          (prevIndex) => (prevIndex + 1) % matchData.goals.length,
        );

        // Fade in animation
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, [isLive, matchData.goals.length, fadeAnim]);

  const currentGoal = matchData.goals[currentGoalIndex];

  const handleGoalPress = () => {
    if (matchData.goals.length <= 1) return;

    // Fade out animation
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      // Change to next goal
      setCurrentGoalIndex(
        (prevIndex) => (prevIndex + 1) % matchData.goals.length,
      );

      // Fade in animation
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  };

  const generatePlayerImage = (playerName: string): string => {
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(playerName)}&backgroundColor=${isDarkMode ? "4a4a4a" : "f0f0f0"}`;
  };

  const generateTeamLogo = (teamName: string): string => {
    return `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(teamName)}&backgroundColor=${isDarkMode ? "4a4a4a" : "f0f0f0"}`;
  };

  if (!isLive || !matchData) {
    return (
      <View style={[styles.matchScoreContainer, { backgroundColor: theme.colors.background }]}>
        <View style={styles.scoreSection}>
          <Text style={[styles.score, { color: theme.colors.text }]}>
            {matchData?.homeScore !== undefined ? matchData.homeScore : "-"}
          </Text>
          <Text style={[styles.score, { color: theme.colors.text }]}>
            {matchData?.awayScore !== undefined ? matchData.awayScore : "-"}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.matchScoreContainer, { backgroundColor: theme.colors.background }]}>
      {/* Match Scores */}
      <View style={styles.scoreSection}>
        <Text style={[styles.score, { color: theme.colors.text }]}>
          {matchData.homeScore}
        </Text>
        <Text style={[styles.score, { color: theme.colors.text }]}>
          {matchData.awayScore}
        </Text>
      </View>

      {/* Live Goal Information */}
      {currentGoal && (
        <TouchableOpacity
          style={[
            styles.goalInfoContainer,
            {
              backgroundColor: isDarkMode
                ? "rgba(255, 107, 53, 0.15)"
                : "rgba(255, 107, 53, 0.08)",
              borderColor: isDarkMode
                ? "rgba(255, 107, 53, 0.3)"
                : "rgba(255, 107, 53, 0.2)",
            },
          ]}
          onPress={handleGoalPress}
          activeOpacity={0.8}
        >
          <Animated.View style={[styles.goalContent, { opacity: fadeAnim }]}>
            {/* Goal Icon with Team Logo */}
            <View style={styles.goalIconSection}>
              <View style={styles.goalIconWrapper}>
                <View style={styles.goalIconContainer}>
                  <Text style={styles.goalIcon}>⚽</Text>
                </View>
                <View
                  style={[
                    styles.teamLogoBadge,
                    {
                      backgroundColor:
                        currentGoal.teamSide === "home"
                          ? theme.colors.success
                          : theme.colors.primary,
                      borderColor: theme.colors.background,
                    },
                  ]}
                >
                  <Image
                    source={{
                      uri:
                        currentGoal.teamSide === "home"
                          ? matchData.homeLogoUrl ||
                            generateTeamLogo(matchData.homeTeam)
                          : matchData.awayLogoUrl ||
                            generateTeamLogo(matchData.awayTeam),
                    }}
                    style={styles.teamLogoSmall}
                  />
                </View>
              </View>

              {/* Goal Time */}
              <Text
                style={[styles.goalTime, { color: theme.colors.textSecondary }]}
              >
                {currentGoal.minute}'
              </Text>
            </View>

            {/* Player Information */}
            <View style={styles.playerSection}>
              <View style={styles.playerImageWrapper}>
                <Image
                  source={{
                    uri:
                      currentGoal.playerImage ||
                      generatePlayerImage(currentGoal.playerName),
                  }}
                  style={[
                    styles.playerImage,
                    {
                      borderColor: theme.colors.border,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.ratingBadge,
                    {
                      backgroundColor: theme.colors.warning,
                    },
                  ]}
                >
                  <Text style={[styles.ratingText, { color: theme.colors.background }]}>
                    {currentGoal.rating.toFixed(1)}
                  </Text>
                </View>
              </View>

              <View style={styles.playerDetails}>
                <Text
                  style={[styles.playerName, { color: theme.colors.text }]}
                  numberOfLines={1}
                >
                  {currentGoal.playerName}
                </Text>

                {/* Goal indicator with count */}
                <View style={styles.goalIndicators}>
                  <View style={[styles.goalDot, { backgroundColor: theme.colors.success }]} />
                  {matchData.goals.length > 1 && (
                    <Text
                      style={[
                        styles.goalCount,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      {currentGoalIndex + 1}/{matchData.goals.length}
                    </Text>
                  )}
                </View>
              </View>
            </View>

            {/* Live Status Indicator */}
            <View style={styles.liveStatusContainer}>
              <View style={styles.liveIndicator}>
                <View style={[styles.liveDot, { backgroundColor: theme.colors.error }]} />
                <Text style={[styles.liveText, { color: theme.colors.error }]}>
                  {matchData.currentMinute}'
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* Multiple Goals Stack Indicator */}
          {matchData.goals.length > 1 && (
            <View style={styles.stackIndicator}>
              {matchData.goals.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.stackDot,
                    {
                      backgroundColor:
                        index === currentGoalIndex
                          ? theme.colors.accent
                          : theme.colors.border,
                    },
                  ]}
                />
              ))}
            </View>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  matchScoreContainer: {
    alignItems: "center",
    minWidth: 60,
    paddingVertical: 4,
  },
  scoreSection: {
    alignItems: "center",
    gap: 6,
  },
  score: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  goalInfoContainer: {
    marginTop: 8,
    borderRadius: 8,
    padding: 6,
    minWidth: 100,
    maxWidth: 140,
    borderWidth: 1,
  },
  goalContent: {
    alignItems: "center",
    gap: 4,
  },
  goalIconSection: {
    alignItems: "center",
    gap: 2,
  },
  goalIconWrapper: {
    position: "relative",
    alignItems: "center",
  },
  goalIconContainer: {
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  goalIcon: {
    fontSize: 16,
  },
  teamLogoBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 12,
    height: 12,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  teamLogoSmall: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  goalTime: {
    fontSize: 10,
    fontWeight: "500",
  },
  playerSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    width: "100%",
  },
  playerImageWrapper: {
    position: "relative",
  },
  playerImage: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
  },
  ratingBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    borderRadius: 6,
    paddingHorizontal: 3,
    paddingVertical: 1,
  },
  ratingText: {
    fontSize: 8,
    fontWeight: "600",
  },
  playerDetails: {
    flex: 1,
    alignItems: "flex-start",
  },
  playerName: {
    fontSize: 10,
    fontWeight: "500",
  },
  goalIndicators: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 1,
  },
  goalDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  goalCount: {
    fontSize: 8,
  },
  liveStatusContainer: {
    alignSelf: "flex-end",
    marginTop: 2,
  },
  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  liveDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  liveText: {
    fontSize: 8,
    fontWeight: "500",
  },
  stackIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 4,
    alignSelf: "center",
  },
  stackDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
});

export default NewsTeamLiveMatches;
