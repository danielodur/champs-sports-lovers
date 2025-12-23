import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Animated, Dimensions } from "react-native";
import { useTheme } from "@/hooks/useTheme";

const { width: screenWidth } = Dimensions.get("window");

interface MatchExtraTimeProps {
  fixture: {
    fixture: {
      status: {
        short: string;
        long: string;
        elapsed: number | null;
      };
    };
    goals: {
      home: number;
      away: number;
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
  };
  regularTimeScore?: {
    home: number;
    away: number;
  };
  showDetailedET?: boolean;
  disableBlink?: boolean; // New prop to disable blinking for match-details
  hideBackground?: boolean; // New prop to hide red background for match-details
}

interface ExtraTimeData {
  isInExtraTime: boolean;
  extraTimeElapsed: number;
  regularTimeElapsed: number;
  displayText: string;
  etIndicator: string;
}

const MatchExtraTime: React.FC<MatchExtraTimeProps> = ({
  fixture,
  regularTimeScore,
  showDetailedET = true,
  disableBlink = false, // Default to false (blinking enabled for live-matches)
  hideBackground = false, // Default to false (red background shown for all screens except match-details)
}) => {
  const theme = useTheme();
  const [etData, setETData] = useState<ExtraTimeData | null>(null);
  const [pulseAnimation] = useState(new Animated.Value(1));
  const [showETIndicator, setShowETIndicator] = useState(true);

  // Calculate extra time data
  const calculateExtraTimeData = (): ExtraTimeData | null => {
    const status = fixture.fixture.status.short;
    const elapsed = fixture.fixture.status.elapsed;

    // Check if match is in extra time or finished after extra time
    if (!isMatchInExtraTime(fixture)) {
      return null;
    }

    // For finished matches (AET/PEN), elapsed might be null
    // Use default 120 minutes for finished extra time matches
    const actualElapsed = elapsed || (status === "AET" || status === "PEN" ? 120 : 90);

    // Extra time starts after 90 minutes
    const regularTimeElapsed = 90;
    const extraTimeElapsed = Math.max(0, actualElapsed - regularTimeElapsed);

    return {
      isInExtraTime: true,
      extraTimeElapsed,
      regularTimeElapsed,
      displayText: `${actualElapsed}'`,
      etIndicator: status === "AET" ? "AET" : status === "PEN" ? "PEN" : "ET",
    };
  };

  // Update ET data when fixture changes
  useEffect(() => {
    const data = calculateExtraTimeData();
    setETData(data);
  }, [fixture.fixture.status.short, fixture.fixture.status.elapsed]);

  // Pulse animation for ET indicator
  useEffect(() => {
    if (etData?.isInExtraTime) {
      const startPulseAnimation = () => {
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.3,
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

  // Blinking ET indicator - Only if blinking is not disabled
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;

    // Only enable blinking if disableBlink is false
    if (etData?.isInExtraTime && !disableBlink) {
      intervalId = setInterval(() => {
        setShowETIndicator((prev) => !prev);
      }, 1000);
    } else {
      setShowETIndicator(true); // Always show when blinking is disabled
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [etData?.isInExtraTime, disableBlink]);

  // Format extra time display text
  const getExtraTimeText = (): string => {
    if (!etData) return "";

    if (showDetailedET) {
      return `${etData.regularTimeElapsed + etData.extraTimeElapsed}'`;
    }

    return etData.displayText;
  };

  // Get extra time period (1st half ET or 2nd half ET)
  const getExtraTimePeriod = (): string => {
    if (!etData) return "";

    // First half of extra time: 91-105 minutes
    // Second half of extra time: 106-120+ minutes
    const totalMinutes = etData.regularTimeElapsed + etData.extraTimeElapsed;

    if (totalMinutes <= 105) {
      return "1st ET";
    } else {
      return "2nd ET";
    }
  };

  // Format regular time final score if available
  const getRegularTimeDisplay = (): string => {
    if (!regularTimeScore) return "";
    return `90' [${regularTimeScore.home}-${regularTimeScore.away}]`;
  };

  // Format current score in extra time
  const getCurrentScoreDisplay = (): string => {
    return `${fixture.goals.home}-${fixture.goals.away}`;
  };

  if (!etData?.isInExtraTime) {
    return null;
  }

  // Get match status
  const status = fixture.fixture.status.short;
  const isAET = status === "AET";
  const isPEN = status === "PEN";

  // Get scores with proper fallback
  const htScore = {
    home: fixture.score?.halftime?.home ?? 0,
    away: fixture.score?.halftime?.away ?? 0,
  };

  const ftScore = {
    home: fixture.score?.fulltime?.home ?? regularTimeScore?.home ?? 0,
    away: fixture.score?.fulltime?.away ?? regularTimeScore?.away ?? 0,
  };

  const etScore = {
    home: fixture.score?.extratime?.home ?? fixture.goals.home ?? 0,
    away: fixture.score?.extratime?.away ?? fixture.goals.away ?? 0,
  };

  const penScore = isPEN
    ? {
        home: fixture.score?.penalty?.home ?? 0,
        away: fixture.score?.penalty?.away ?? 0,
      }
    : null;

  // Simple badge display (top of screen)
  if (!showDetailedET) {
    return (
      <View style={styles.badgeContainer}>
        <Animated.View
          style={[
            styles.etBadge,
            { transform: [{ scale: pulseAnimation }] },
          ]}
        >
          <Text
            style={[
              styles.etBadgeText,
              {
                color: showETIndicator ? "#FF4444" : "transparent",
                backgroundColor: showETIndicator
                  ? "rgba(255, 68, 68, 0.15)"
                  : "transparent",
              },
            ]}
          >
            {isPEN ? "Penalties" : "ET"}
          </Text>
        </Animated.View>
      </View>
    );
  }

  // Detailed ET display (red transparent bar)
  console.log('🔴 ET COMPONENT RENDERING:', {
    hideBackground,
    hideBackgroundType: typeof hideBackground,
    isStrictlyTrue: hideBackground === true,
    shouldShowRed: hideBackground !== true,
    backgroundColor: hideBackground === true ? 'transparent' : 'rgba(255, 68, 68, 0.08)',
  });

  return (
    <View style={styles.detailedContainer}>
      <View
        style={[
          styles.transparentRedBar,
          {
            // Show red background for all screens except match-details-main
            // Explicitly handle undefined as false (show red background by default)
            backgroundColor: hideBackground === true ? "transparent" : "rgba(255, 68, 68, 0.08)",
            borderTopWidth: hideBackground === true ? 0 : 1,
            borderTopColor: hideBackground === true ? "transparent" : "rgba(255, 68, 68, 0.15)",
          },
        ]}
      >
        {/* Scores Row with Compact Formatting */}
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

          {/* Extra Time/Penalty Scores (if AET or PEN) */}
          {(isAET || isPEN) && (
            <>
              {/* Pipe separator */}
              <Text style={[styles.pipeSeparator, { color: theme.colors.textSecondary }]}>|</Text>

              {/* Extra Time Final Score */}
              <Text style={[styles.compactText, { color: theme.colors.textSecondary }]}>
                ET: <Text style={[styles.scoreValue, { color: theme.colors.text }]}>{etScore.home}-{etScore.away}</Text>
              </Text>
            </>
          )}

          {/* Penalty Score (if applicable) */}
          {isPEN && penScore && (
            <>
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
  );
};

const styles = StyleSheet.create({
  // Badge styles (top of screen)
  badgeContainer: {
    alignItems: "center",
    justifyContent: "center",
  },

  etBadge: {
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },

  etBadgeText: {
    fontSize: 13,
    fontWeight: "800",
    fontFamily: "Inter-ExtraBold",
    borderRadius: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    overflow: "hidden",
  },

  // Detailed display styles (red transparent bar)
  detailedContainer: {
    marginTop: 12,
    width: screenWidth,
    marginLeft: -16,
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














































