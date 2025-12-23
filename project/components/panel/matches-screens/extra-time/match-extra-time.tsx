import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Animated, Dimensions } from "react-native";
import { useTheme } from "@/hooks/useTheme";

const { width: screenWidth } = Dimensions.get("window");

interface MatchExtraTimeProps {
  fixture: {
    fixture: {
      status: {
        short: string | null;
        long: string | null;
        elapsed: number | null;
      };
    };
    goals: {
      home: number | null;
      away: number | null;
    };
    score?: {
      halftime?: {
        home: number | null;
        away: number | null;
      };
      fulltime?: {
        home: number | null;
        away: number | null;
      };
      extratime?: {
        home: number | null;
        away: number | null;
      };
      penalty?: {
        home: number | null;
        away: number | null;
      };
    };
    events?: Array<{
      type: string;
      time: {
        elapsed: number | null;
      };
      team: {
        id: number | null;
        name: string | null;
      };
    }>;
    teams?: {
      home: {
        id: number | null;
      };
      away: {
        id: number | null;
      };
    };
  };
  regularTimeScore?: {
    home: number;
    away: number;
  };
  showDetailedET?: boolean;
}

interface ExtraTimeData {
  isInExtraTime: boolean;
  extraTimeElapsed: number;
  regularTimeElapsed: number;
  displayText: string;
  etIndicator: string;
  fulltimeScore: {
    home: number;
    away: number;
  };
  currentScore: {
    home: number | null;
    away: number | null;
  };
}

const MatchExtraTime: React.FC<MatchExtraTimeProps> = ({
  fixture,
  regularTimeScore,
  showDetailedET = true,
}) => {
  const theme = useTheme();
  const [etData, setETData] = useState<ExtraTimeData | null>(null);
  const [pulseAnimation] = useState(new Animated.Value(1));

  // Calculate extra time data
  const calculateExtraTimeData = (): ExtraTimeData | null => {
    const status = fixture.fixture.status.short;
    const elapsed = fixture.fixture.status.elapsed;

    // Check if match is in extra time
    if (!isMatchInExtraTime(fixture) || !elapsed) {
      return null;
    }

    // Extra time starts after 90 minutes
    const regularTimeElapsed = 90;
    const extraTimeElapsed = Math.max(0, elapsed - regularTimeElapsed);

    // Get fulltime (90') score - prioritize regularTimeScore prop, then API fulltime score
    const fulltimeScore = regularTimeScore || {
      home: fixture.score?.fulltime?.home ?? fixture.goals.home ?? 0,
      away: fixture.score?.fulltime?.away ?? fixture.goals.away ?? 0,
    };

    // Current score in extra time
    const currentScore = {
      home: fixture.goals.home ?? 0,
      away: fixture.goals.away ?? 0,
    };

    return {
      isInExtraTime: true,
      extraTimeElapsed,
      regularTimeElapsed,
      displayText: `${elapsed}'`,
      etIndicator: status === "PEN" ? "Penalties" : "ET", // ✅ FIXED: Show "Penalties" if in penalty shootout
      fulltimeScore,
      currentScore,
    };
  };

  // Update ET data when fixture changes
  useEffect(() => {
    const data = calculateExtraTimeData();
    setETData(data);
  }, [fixture.fixture.status.short, fixture.fixture.status.elapsed, fixture.goals]);

  // Pulse animation for ET indicator
  useEffect(() => {
    if (etData?.isInExtraTime) {
      const startPulseAnimation = () => {
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]).start(() => {
          if (etData?.isInExtraTime) {
            startPulseAnimation();
          }
        });
      };

      startPulseAnimation();
    }
  }, [etData?.isInExtraTime, pulseAnimation]);

  if (!etData?.isInExtraTime) {
    return null;
  }

  // ✅ FIXED: Get match status and scores
  const status = fixture.fixture.status.short;
  const isPEN = status === "PEN";
  const elapsed = fixture.fixture.status.elapsed || 0;

  // ✅ Determine ET period (1st ET: 91-105 min, 2nd ET: 106-120 min)
  const isFirstHalfET = elapsed >= 91 && elapsed <= 105;
  const isSecondHalfET = elapsed > 105;

  // Get scores with proper fallback
  const htScore = {
    home: fixture.score?.halftime?.home ?? 0,
    away: fixture.score?.halftime?.away ?? 0,
  };

  const ftScore = {
    home: fixture.score?.fulltime?.home ?? regularTimeScore?.home ?? 0,
    away: fixture.score?.fulltime?.away ?? regularTimeScore?.away ?? 0,
  };

  const currentETScore = {
    home: fixture.goals.home ?? 0,
    away: fixture.goals.away ?? 0,
  };

  // ✅ Calculate 1st ET score (score at 105 minutes) by counting goals between 91-105 minutes
  const calculateFirstETScore = () => {
    if (!isSecondHalfET) {
      // If we're in 1st ET, the current score IS the 1st ET score
      return currentETScore;
    }

    // If we're in 2nd ET, calculate 1st ET score by subtracting goals scored after 105 minutes
    let firstETScore = { ...ftScore };

    // Count goals scored in 1st ET (91-105 minutes)
    if (fixture.events && Array.isArray(fixture.events) && fixture.teams) {
      const homeTeamId = fixture.teams.home?.id;
      const awayTeamId = fixture.teams.away?.id;

      // Method 1: Count goals directly in 1st ET period (91-105 minutes)
      fixture.events.forEach((event: any) => {
        if (
          event.type === "Goal" &&
          event.time?.elapsed != null &&
          event.time.elapsed >= 91 &&
          event.time.elapsed <= 105
        ) {
          const eventTeamId = event.team?.id;
          if (eventTeamId === homeTeamId) {
            firstETScore.home = (firstETScore.home || 0) + 1;
          } else if (eventTeamId === awayTeamId) {
            firstETScore.away = (firstETScore.away || 0) + 1;
          }
        }
      });

      // If no goals found in 1st ET, try fallback: subtract goals scored in 2nd ET from current score
      if (firstETScore.home === ftScore.home && firstETScore.away === ftScore.away) {
        let goalsInSecondET = { home: 0, away: 0 };

        fixture.events.forEach((event: any) => {
          if (
            event.type === "Goal" &&
            event.time?.elapsed != null &&
            event.time.elapsed > 105
          ) {
            const eventTeamId = event.team?.id;
            if (eventTeamId === homeTeamId) {
              goalsInSecondET.home += 1;
            } else if (eventTeamId === awayTeamId) {
              goalsInSecondET.away += 1;
            }
          }
        });

        // Only use fallback if we found goals in 2nd ET
        if (goalsInSecondET.home > 0 || goalsInSecondET.away > 0) {
          firstETScore = {
            home: Math.max(0, (currentETScore.home || 0) - goalsInSecondET.home),
            away: Math.max(0, (currentETScore.away || 0) - goalsInSecondET.away),
          };
        }
      }
    } else {
      // Last resort: assume no goals in 1st ET if we can't calculate (use FT score)
      firstETScore = ftScore;
    }

    return firstETScore;
  };

  const firstETScore = calculateFirstETScore();

  const penScore = isPEN
    ? {
        home: fixture.score?.penalty?.home ?? 0,
        away: fixture.score?.penalty?.away ?? 0,
      }
    : null;

  return (
    <View style={styles.container}>
      {/* ✅ ET Badge - Only show when NOT showing detailed section (detailed section is for bottom) */}
      {!showDetailedET && (
        <View style={styles.etTopIndicator}>
          <Animated.View
            style={[
              styles.etBadge,
              {
                transform: [{ scale: pulseAnimation }],
                backgroundColor: "rgba(255, 68, 68, 0.15)",
              },
            ]}
          >
            <Text style={[styles.etBadgeText, { color: "#FF4444" }]}>
              {etData.etIndicator}
            </Text>
          </Animated.View>
        </View>
      )}

      {/* ✅ FIXED: Beautiful Bottom Section - Compact Format Like Finished Matches */}
      {showDetailedET && (
        <View style={styles.bottomSection}>
          <View
            style={[
              styles.transparentRedBar,
              {
                backgroundColor: "rgba(255, 68, 68, 0.08)", // Beautiful light red background for live matches
                borderTopWidth: 1, // Border for finished-matches style
                borderTopColor: "rgba(255, 68, 68, 0.15)",
              },
            ]}
          >
            {/* ✅ Compact Scores Row */}
            <View style={styles.scoresRow}>
              {/* Half Time Score (45' HT) */}
              <Text style={[styles.compactText, { color: theme.colors.textSecondary }]}>
                45' HT: <Text style={[styles.scoreValue, { color: theme.colors.text }]}>{htScore.home}-{htScore.away}</Text>
              </Text>

              {/* Bolder separator dot */}
              <Text style={[styles.boldSeparator, { color: theme.colors.textSecondary }]}>•</Text>

              {/* Full Time Score (90' FT) */}
              <Text style={[styles.compactText, { color: theme.colors.textSecondary }]}>
                90' FT: <Text style={[styles.scoreValue, { color: theme.colors.text }]}>{ftScore.home}-{ftScore.away}</Text>
              </Text>

              {/* ✅ Current Extra Time Score (1st ET or 2nd ET based on elapsed time) */}
              {!isPEN && (
                <>
                  {/* Pipe separator */}
                  <Text style={[styles.pipeSeparator, { color: theme.colors.textSecondary }]}>|</Text>

                  {/* When in 1st ET: Show only 1st ET score */}
                  {isFirstHalfET && (
                    <Text style={[styles.compactText, { color: "#FF4444" }]}>
                      1st ET: <Text style={[styles.scoreValue, { color: "#FF4444", fontWeight: "800" }]}>{currentETScore.home}-{currentETScore.away}</Text>
                    </Text>
                  )}

                  {/* When in 2nd ET: Show both 1st ET and 2nd ET scores */}
                  {isSecondHalfET && (
                    <>
                      {/* 1st ET Score */}
                      <Text style={[styles.compactText, { color: theme.colors.textSecondary }]}>
                        1st ET: <Text style={[styles.scoreValue, { color: theme.colors.text }]}>{firstETScore.home}-{firstETScore.away}</Text>
                      </Text>

                      {/* Bolder separator dot */}
                      <Text style={[styles.boldSeparator, { color: theme.colors.textSecondary }]}>•</Text>

                      {/* 2nd ET Score */}
                      <Text style={[styles.compactText, { color: "#FF4444" }]}>
                        2nd ET: <Text style={[styles.scoreValue, { color: "#FF4444", fontWeight: "800" }]}>{currentETScore.home}-{currentETScore.away}</Text>
                      </Text>
                    </>
                  )}

                  {/* Fallback for other ET states */}
                  {!isFirstHalfET && !isSecondHalfET && (
                    <Text style={[styles.compactText, { color: "#FF4444" }]}>
                      ET: <Text style={[styles.scoreValue, { color: "#FF4444", fontWeight: "800" }]}>{currentETScore.home}-{currentETScore.away}</Text>
                    </Text>
                  )}
                </>
              )}

              {/* ✅ Penalty Score (if applicable) */}
              {isPEN && penScore && (
                <>
                  {/* Pipe separator before penalties */}
                  <Text style={[styles.pipeSeparator, { color: theme.colors.textSecondary }]}>|</Text>

                  {/* ET final score before penalties */}
                  <Text style={[styles.compactText, { color: theme.colors.textSecondary }]}>
                    ET: <Text style={[styles.scoreValue, { color: theme.colors.text }]}>{currentETScore.home}-{currentETScore.away}</Text>
                  </Text>

                  {/* Bolder separator dot */}
                  <Text style={[styles.boldSeparator, { color: theme.colors.textSecondary }]}>•</Text>

                  {/* Penalty shootout */}
                  <Text style={[styles.compactText, { color: "#FF4444" }]}>
                    Penalties: <Text style={[styles.scoreValue, { color: "#FF4444", fontWeight: "800" }]}>{penScore.home}-{penScore.away}</Text>
                  </Text>
                </>
              )}
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },

  // ET Indicator at top (replaces timer)
  etTopIndicator: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },

  etBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(255, 68, 68, 0.3)",
  },

  etBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    fontFamily: "Inter-ExtraBold",
    letterSpacing: 0.5,
  },

  // Bottom Section - Beautiful Red Transparent Bar
  bottomSection: {
    marginTop: 4, // Minimal spacing from corner kicks
    width: screenWidth, // Full width touching edges
    marginLeft: -16, // Compensate for parent padding
    marginRight: -16,
  },

  transparentRedBar: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    width: "100%",
  },

  scoresRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 6,
  },

  compactText: {
    fontSize: 11,
    fontWeight: "600",
    fontFamily: "Inter-SemiBold",
  },

  scoreValue: {
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "Inter-Bold",
  },

  boldSeparator: {
    fontSize: 16,
    fontWeight: "900",
    marginHorizontal: 4,
    lineHeight: 16,
  },

  pipeSeparator: {
    fontSize: 12,
    fontWeight: "600",
    marginHorizontal: 6,
  },
});

export default MatchExtraTime;

// Helper function to check if match is in extra time
export const isMatchInExtraTime = (fixture: any): boolean => {
  const status = fixture?.fixture?.status?.short;
  const elapsed = fixture?.fixture?.status?.elapsed;

  // Direct ET status check for live extra time
  if (status === "ET") {
    return true;
  }

  // Check for finished matches after extra time
  if (status === "AET" || status === "PEN") {
    return true;
  }

  // Check for extended time beyond 90 minutes in live matches
  if ((status === "2H" || status === "1H") && elapsed && elapsed > 90) {
    return true;
  }

  return false;
};

// Helper function to get extra time elapsed minutes
export const getExtraTimeElapsed = (fixture: any): number => {
  if (!isMatchInExtraTime(fixture) || !fixture.fixture.status.elapsed) {
    return 0;
  }

  const elapsed = fixture.fixture.status.elapsed;

  // If elapsed is over 90, calculate ET time
  if (elapsed > 90) {
    return elapsed - 90;
  }

  return 0;
};

// Helper function to format extra time display
export const formatExtraTimeDisplay = (
  fixture: any,
  showET: boolean = true,
): string => {
  if (!isMatchInExtraTime(fixture)) {
    return "";
  }

  const elapsed = fixture.fixture.status.elapsed || 0;
  const etSuffix = showET ? " ET" : "";

  return `${elapsed}'${etSuffix}`;
};
