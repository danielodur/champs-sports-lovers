import React, { useState, useEffect, useMemo } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { useLiveTimer } from "@/contexts/LiveTimerContext";
import {
  isMatchInExtraTime,
  formatExtraTimeDisplay,
} from "@/components/panel/matches-screens/football-extratime/match-extra-time";
import { Flag } from "lucide-react-native";

interface MatchDetailsScoresDisplayProps {
  match: {
    id: string;
    home: {
      name: string;
      logo?: string;
    };
    away: {
      name: string;
      logo?: string;
    };
    score: string;
    status: "upcoming" | "live" | "finished";
    startTime?: string;
    time?: string;
    halftimeScore?: string;
    statusText?: string;
    corners?: {
      home: number;
      away: number;
    };
    extraTime?: {
      home: number;
      away: number;
    };
    penalties?: {
      home: number;
      away: number;
    };
    // ✅ Basketball-specific quarter scores
    quarters?: {
      home: (number | null)[];
      away: (number | null)[];
    };
    fixture?: {
      status: {
        short: string;
        long: string;
        elapsed: number | null;
      };
    };
  };
  currentMinute?: number;
  matchStats?: any;
  sport?: string; // ✅ Add sport parameter
}

interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const MatchDetailsScoresDisplay: React.FC<MatchDetailsScoresDisplayProps> = ({
  match,
  currentMinute = 0,
  matchStats,
  sport = "football", // ✅ Default to football
}) => {
  const theme = useTheme();
  const { isBlinking } = useLiveTimer();

  // State for countdown timer
  const [countdown, setCountdown] = useState<CountdownTime | null>(null);
  const [pulseAnimation] = useState(new Animated.Value(1));
  const [showApostrophe, setShowApostrophe] = useState(true);

  // Enhanced status detection with time-based logic
  const actualStatus = useMemo(() => {
    // If we have fixture status from API, use it
    if (match.fixture?.status?.short) {
      const apiStatus = match.fixture.status.short.toUpperCase();

      // ✅ BASKETBALL STATUS MAPPING
      if (sport === "basketball") {
        if (["NS", "TBD", "CANC", "PST"].includes(apiStatus)) {
          // Double check if match should have started based on time
          if (match.startTime) {
            const startTime = new Date(match.startTime).getTime();
            const now = Date.now();
            // If more than 5 minutes past start time, treat as live
            if (now - startTime > 5 * 60 * 1000) {
              return "live";
            }
          }
          return "upcoming";
        }

        if (["FT", "AOT", "AWD"].includes(apiStatus)) {
          return "finished";
        }

        // Basketball live: Q1-Q4, HT, OT, BT, LIVE
        if (
          ["Q1", "Q2", "Q3", "Q4", "HT", "OT", "BT", "LIVE"].includes(apiStatus)
        ) {
          return "live";
        }

        return "upcoming";
      }

      // FOOTBALL STATUS MAPPING
      if (["NS", "TBD", "CANC", "PST"].includes(apiStatus)) {
        // Double check if match should have started based on time
        if (match.startTime) {
          const startTime = new Date(match.startTime).getTime();
          const now = Date.now();
          // If more than 5 minutes past start time, treat as live
          if (now - startTime > 5 * 60 * 1000) {
            return "live";
          }
        }
        return "upcoming";
      }

      if (["FT", "AET", "PEN", "AWD"].includes(apiStatus)) {
        return "finished";
      }

      // All other statuses are live
      return "live";
    }

    // Fallback to provided status, but with time-based override
    if (match.status === "upcoming" && match.startTime) {
      const startTime = new Date(match.startTime).getTime();
      const now = Date.now();
      // If more than 2 minutes past start time, assume live
      if (now - startTime > 2 * 60 * 1000) {
        return "live";
      }
    }

    return match.status;
  }, [match.status, match.startTime, match.fixture?.status?.short, sport]);

  // Calculate countdown for upcoming matches - using actualStatus
  useEffect(() => {
    // Validate and parse startTime
    let isValidStartTime = false;
    let matchTime = 0;

    if (match.startTime && match.startTime.trim() !== "") {
      // Try parsing as-is first
      let parsedDate = new Date(match.startTime);

      // If invalid, try combining with today's date for time-only strings like "23:00"
      if (
        isNaN(parsedDate.getTime()) &&
        /^\d{1,2}:\d{2}/.test(match.startTime)
      ) {
        const today = new Date();
        const timeParts = match.startTime.match(/^(\d{1,2}):(\d{2})/);
        if (timeParts) {
          parsedDate = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate(),
            parseInt(timeParts[1]),
            parseInt(timeParts[2]),
          );
          console.log(
            `⏱️ [COUNTDOWN] ${sport} - Parsed time-only string "${match.startTime}" as:`,
            parsedDate,
          );
        }
      }

      matchTime = parsedDate.getTime();
      isValidStartTime = !isNaN(matchTime);

      console.log(`⏱️ [COUNTDOWN] ${sport} - StartTime validation:`, {
        original: match.startTime,
        parsed: parsedDate,
        isValid: isValidStartTime,
        matchTime,
      });
    }

    if (actualStatus === "upcoming" && isValidStartTime) {
      console.log(`⏱️ [COUNTDOWN] Calculating for ${sport}:`, {
        startTime: match.startTime,
        actualStatus,
        matchStatus: match.status,
        isValid: isValidStartTime,
      });

      const updateCountdown = () => {
        const now = new Date().getTime();
        const timeDiff = matchTime - now;

        console.log(
          `⏱️ [COUNTDOWN] ${sport} - Time diff: ${timeDiff}ms, Match time: ${new Date(matchTime)}, Now: ${new Date()}`,
        );

        if (timeDiff > 0) {
          const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
          const hours = Math.floor(
            (timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
          );
          const minutes = Math.floor(
            (timeDiff % (1000 * 60 * 60)) / (1000 * 60),
          );
          const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

          setCountdown({ days, hours, minutes, seconds });
          console.log(`⏱️ [COUNTDOWN] ${sport} - Set countdown:`, {
            days,
            hours,
            minutes,
            seconds,
          });
        } else {
          setCountdown(null);
          console.log(`⏱️ [COUNTDOWN] ${sport} - Time passed, countdown null`);
        }
      };

      updateCountdown();
      const interval = setInterval(updateCountdown, 1000);

      return () => clearInterval(interval);
    } else {
      console.log(`⏱️ [COUNTDOWN] ${sport} - No countdown:`, {
        actualStatus,
        hasStartTime: !!match.startTime,
        startTime: match.startTime,
        isValid: isValidStartTime,
      });
      setCountdown(null);
    }
  }, [actualStatus, match.startTime, sport]);

  // Pulse animation for live matches - using actualStatus
  useEffect(() => {
    if (actualStatus === "live") {
      const startPulse = () => {
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]).start(() => {
          if (actualStatus === "live") {
            startPulse();
          }
        });
      };

      startPulse();
    }
  }, [actualStatus, pulseAnimation]);

  // Apostrophe blinking animation effect - using actualStatus
  useEffect(() => {
    if (actualStatus === "live") {
      const interval = setInterval(() => {
        setShowApostrophe((prev) => !prev);
      }, 1000); // Toggle every second

      return () => clearInterval(interval);
    } else {
      setShowApostrophe(true);
    }
  }, [actualStatus]);

  // Get match period for live matches - ✅ CRITICAL: ONLY use API data
  const getMatchPeriod = () => {
    const status = match.fixture?.status?.short || match.statusText || "";
    // ✅ CRITICAL FIX: ONLY use API elapsed - NO currentMinute fallback!
    const elapsed = match.fixture?.status?.elapsed || 0;

    console.log(
      `🕐 Period detection - Status: ${status}, Elapsed: ${elapsed}, Sport: ${sport}`,
    );

    // ✅ BASKETBALL PERIOD DETECTION
    if (sport === "basketball") {
      if (status === "Q1") return "first-quarter";
      if (status === "Q2") return "second-quarter";
      if (status === "Q3") return "third-quarter";
      if (status === "Q4") return "fourth-quarter";
      if (status === "HT") return "half-time";
      if (status === "OT") return "overtime";
      if (status === "BT") return "break-time";
      return "first-quarter"; // Default
    }

    // FOOTBALL PERIOD DETECTION - ✅ Use ONLY API status, no time calculations!
    if (status === "HT") return "half-time";
    if (status === "2H" || (elapsed > 45 && elapsed <= 95))
      return "second-half";
    if (status === "1H") return "first-half";

    // Elapsed-based detection (API data only)
    if (elapsed > 45 && elapsed <= 50) return "half-time";
    if (elapsed > 50) return "second-half";

    return "first-half";
  };

  // Enhanced match timer - ✅ CRITICAL: Use ONLY API elapsed value
  const getMatchTimer = () => {
    const status = match.fixture?.status;
    const statusShort = status?.short;
    // ✅ CRITICAL FIX: ONLY use API elapsed - never use currentMinute fallback!
    // currentMinute might be stale or calculated, causing desync with parent screens
    const elapsed = status?.elapsed || 0;
    const apostrophe = showApostrophe ? "'" : "\u00A0";

    // ✅ BASKETBALL TIMER
    if (sport === "basketball") {
      if (statusShort) {
        switch (statusShort) {
          case "Q1":
            return `Q1`;
          case "Q2":
            return `Q2`;
          case "Q3":
            return `Q3`;
          case "Q4":
            return `Q4`;
          case "HT":
            return "HT";
          case "OT":
            return "OT";
          case "BT":
            return "Break";
          default:
            return statusShort;
        }
      }
      return "Q1"; // Default for basketball
    }

    // ✅ FOOTBALL TIMER - Always respect API status.short first!
    // This ensures match-details stays in sync with parent screens
    if (statusShort) {
      switch (statusShort) {
        case "HT":
          // ✅ CRITICAL: Always show HT when API says HT, never show elapsed time
          return "HT";
        case "1H":
        case "2H":
          // Show progressive added time for 1H and 2H
          if (statusShort === "1H" && elapsed > 45) {
            const addedTime = elapsed - 45;
            return `45+${addedTime}${apostrophe}`;
          }
          if (statusShort === "2H" && elapsed > 90) {
            const addedTime = elapsed - 90;
            return `90+${addedTime}${apostrophe}`;
          }
          return `${elapsed}${apostrophe}`;
        case "ET":
          return `ET ${elapsed}${apostrophe}`;
        case "BT":
          return "Break";
        case "P":
          return "Penalties";
        case "FT":
        case "AET":
        case "PEN":
          return statusShort;
        default:
          return statusShort;
      }
    }

    // ✅ NO FALLBACK CALCULATIONS - If no API status, show 0' or elapsed
    return elapsed > 0 ? `${elapsed}${apostrophe}` : "0'";
  };

  // Format live timer
  const getFormattedLiveTimer = () => {
    return getMatchTimer();
  };

  // Check if match is in extra time
  const isInExtraTime = () => {
    return isMatchInExtraTime(match);
  };

  // Check if match is in penalty shootout
  const isInPenalties = () => {
    const status = match.fixture?.status?.short || match.statusText;
    return (
      status === "PEN" ||
      status === "P" ||
      (status && status.toUpperCase().includes("PEN"))
    );
  };

  // Get display score based on match state
  const getDisplayScore = () => {
    if (isInPenalties() && match.penalties) {
      return `${match.score} (${match.penalties.home}-${match.penalties.away})`;
    }
    return match.score;
  };

  // Get halftime score display
  const getHalftimeScoreDisplay = () => {
    if (!match.halftimeScore || match.halftimeScore === "null-null") {
      return "0-0";
    }
    return match.halftimeScore;
  };

  // Get corners display
  const getCornersDisplay = () => {
    const homeCorners = match.corners?.home ?? 0;
    const awayCorners = match.corners?.away ?? 0;
    return `${homeCorners}-${awayCorners}`;
  };

  // Format countdown display
  const formatCountdownDisplay = (time: CountdownTime) => {
    if (time.days > 0) {
      return `${time.days}d ${time.hours.toString().padStart(2, "0")}:${time.minutes.toString().padStart(2, "0")}`;
    }
    return `${time.hours.toString().padStart(2, "0")}:${time.minutes.toString().padStart(2, "0")}:${time.seconds.toString().padStart(2, "0")}`;
  };

  // Render upcoming match display with enhanced logic
  const renderUpcoming = () => (
    <View style={styles.compactContainer}>
      {countdown ? (
        countdown.days === 0 &&
        countdown.hours === 0 &&
        countdown.minutes <= 10 ? (
          <View style={styles.countdownBox}>
            <Text style={[styles.countdownLabel, { color: "#FF6B6B" }]}>
              Starting soon
            </Text>
            <Text style={[styles.countdownTime, { color: "#FFFFFF" }]}>
              {formatCountdownDisplay(countdown)}
            </Text>
          </View>
        ) : (
          <View style={styles.countdownBox}>
            <Text style={[styles.countdownLabel, { color: "#FFFFFF" }]}>
              Match starts in
            </Text>
            <Text style={[styles.countdownTime, { color: "#FFFFFF" }]}>
              {formatCountdownDisplay(countdown)}
            </Text>
          </View>
        )
      ) : (
        // ✅ When countdown is null (time passed or invalid), show NS status
        <Text style={[styles.mainScore, { color: "#FFFFFF" }]}>NS</Text>
      )}
    </View>
  );

  // Render live match display
  const renderLive = () => {
    const period = getMatchPeriod();
    const status = match.fixture?.status?.short || "";
    const isHalfTime = period === "half-time";
    const isSecondHalf = period === "second-half";
    const isExtraTime = status === "ET" || isInExtraTime();
    const isPenalties = status === "PEN" || status === "P";

    // Extra Time Live Display
    if (isExtraTime) {
      return (
        <View style={styles.compactContainer}>
          {/* ET indicator above score */}
          <Text style={[styles.timerText, { color: "#FF4444" }]}>ET</Text>

          {/* Main score */}
          <Text style={[styles.mainScore, { color: "#FF4444" }]}>
            {match.score}
          </Text>

          {/* HT Score below */}
          <View style={styles.scoreBreakdownRow}>
            <Text style={[styles.scoreBreakdownText, { color: "#FFFFFF" }]}>
              HT: {getHalftimeScoreDisplay()}
            </Text>
          </View>

          {/* Corner kicks - only for football */}
          {sport === "football" && (
            <View style={styles.cornerRow}>
              <Flag size={12} color="#FFFFFF" />
              <Text style={[styles.cornerText, { color: "#FFFFFF" }]}>
                {getCornersDisplay()}
              </Text>
            </View>
          )}
        </View>
      );
    }

    // Penalty Shootout Live Display
    if (isPenalties) {
      return (
        <View style={styles.compactContainer}>
          {/* Penalties indicator above score */}
          <Text style={[styles.timerText, { color: "#FF4444" }]}>
            Penalties
          </Text>

          {/* Main score with penalty score if available */}
          <Text style={[styles.mainScore, { color: "#FF4444" }]}>
            {match.score}
          </Text>

          {/* Score breakdown - HT and ET */}
          <View style={styles.scoreBreakdownRow}>
            <Text style={[styles.scoreBreakdownText, { color: "#FFFFFF" }]}>
              HT: {getHalftimeScoreDisplay()}
            </Text>
            {match.extraTime && (
              <>
                <Text
                  style={[styles.scoreBreakdownSeparator, { color: "#FFFFFF" }]}
                >
                  {" "}
                </Text>
                <Text style={[styles.scoreBreakdownText, { color: "#FFFFFF" }]}>
                  ET: {match.extraTime.home}-{match.extraTime.away}
                </Text>
              </>
            )}
            {match.penalties && (
              <>
                <Text
                  style={[styles.scoreBreakdownSeparator, { color: "#FFFFFF" }]}
                >
                  {" "}
                </Text>
                <Text style={[styles.scoreBreakdownText, { color: "#FF4444" }]}>
                  Pen: {match.penalties.home}-{match.penalties.away}
                </Text>
              </>
            )}
          </View>

          {/* Corner kicks - only for football */}
          {sport === "football" && (
            <View style={styles.cornerRow}>
              <Flag size={12} color="#FFFFFF" />
              <Text style={[styles.cornerText, { color: "#FFFFFF" }]}>
                {getCornersDisplay()}
              </Text>
            </View>
          )}
        </View>
      );
    }

    if (isHalfTime) {
      // Half Time Layout: Timer → Score → Corner kicks (football only)
      return (
        <View style={styles.compactContainer}>
          {/* Timer above score */}
          <Text style={[styles.timerText, { color: "#FF4444" }]}>HT</Text>

          {/* Main score */}
          <Text style={[styles.mainScore, { color: "#FF4444" }]}>
            {getDisplayScore()}
          </Text>

          {/* Corner kicks below score - football only */}
          {sport === "football" && (
            <View style={styles.cornerRow}>
              <Flag size={10} color="#FFFFFF" />
              <Text style={[styles.cornerText, { color: "#FFFFFF" }]}>
                {getCornersDisplay()}
              </Text>
            </View>
          )}
        </View>
      );
    }

    if (isSecondHalf) {
      // Second Half Layout: Timer → Score → HT Score & Corners (horizontal)
      // ✅ BASKETBALL: Show halftime score, NO corners
      // ✅ FOOTBALL: Show halftime score AND corners
      return (
        <View style={styles.compactContainer}>
          {/* Timer above score */}
          <Text style={[styles.timerText, { color: "#FF4444" }]}>
            {getFormattedLiveTimer()}
          </Text>

          {/* Main score */}
          <Text style={[styles.mainScore, { color: "#FF4444" }]}>
            {getDisplayScore()}
          </Text>

          {/* HT Score and Corners horizontally positioned below */}
          <View style={styles.horizontalInfoRow}>
            <Text style={[styles.halftimeText, { color: "#FFFFFF" }]}>
              ({getHalftimeScoreDisplay()})
            </Text>
            {sport === "football" && (
              <View style={styles.cornerRow}>
                <Flag size={12} color="#FFFFFF" />
                <Text style={[styles.cornerText, { color: "#FFFFFF" }]}>
                  {getCornersDisplay()}
                </Text>
              </View>
            )}
          </View>
        </View>
      );
    }

    // First Half or other live states
    return (
      <View style={styles.compactContainer}>
        {/* Timer above score */}
        <Text style={[styles.timerText, { color: "#FF4444" }]}>
          {getFormattedLiveTimer()}
        </Text>

        {/* Main score */}
        <Text style={[styles.mainScore, { color: "#FF4444" }]}>
          {getDisplayScore()}
        </Text>

        {/* Corner kicks below for first half - football only */}
        {sport === "football" && (
          <View style={styles.cornerRow}>
            <Flag size={12} color="#FFFFFF" />
            <Text style={[styles.cornerText, { color: "#FFFFFF" }]}>
              {getCornersDisplay()}
            </Text>
          </View>
        )}
      </View>
    );
  };

  // Render finished match display
  const renderFinished = () => {
    const status = match.fixture?.status?.short || "";
    const isAET = status === "AET";
    const isPEN = status === "PEN";

    // Parse final scores
    const [homeScore, awayScore] = match.score
      .split("-")
      .map((s) => parseInt(s) || 0);
    const pointDifference = Math.abs(homeScore - awayScore);
    const totalPoints = homeScore + awayScore;

    // ✅ BASKETBALL FINISHED DISPLAY
    if (sport === "basketball") {
      return (
        <View style={styles.compactContainer}>
          {/* Status above score */}
          <Text style={[styles.statusText, { color: "#FFFFFF" }]}>FT</Text>

          {/* Final score */}
          <Text style={[styles.mainScore, { color: "#FFFFFF" }]}>
            {match.score}
          </Text>

          {/* Halftime score in parentheses */}
          {match.halftimeScore && match.halftimeScore !== "null-null" && (
            <Text style={[styles.halftimeText, { color: "#FFFFFF" }]}>
              ({match.halftimeScore})
            </Text>
          )}

          {/* Point difference and total points */}
          <Text style={[styles.basketballStatsText, { color: "#FFFFFF" }]}>
            Diff-{pointDifference} Total:{totalPoints}
          </Text>
        </View>
      );
    }

    // ✅ FOOTBALL FINISHED DISPLAY
    // Determine what scores to show
    const showExtraTime = isAET || isPEN;
    const showPenalties = isPEN;

    return (
      <View style={styles.compactContainer}>
        {/* Status above score */}
        <Text style={[styles.statusText, { color: "#FFFFFF" }]}>FT</Text>

        {/* Final score */}
        <Text style={[styles.mainScore, { color: "#FFFFFF" }]}>
          {match.score}
        </Text>

        {/* Score breakdown below - HT, ET (if applicable), Pen (if applicable) */}
        <View style={styles.scoreBreakdownRow}>
          {/* HT Score */}
          <Text style={[styles.scoreBreakdownText, { color: "#FFFFFF" }]}>
            HT: {getHalftimeScoreDisplay()}
          </Text>

          {/* ET Score (only if match went to extra time) */}
          {showExtraTime && match.extraTime && (
            <>
              <Text
                style={[styles.scoreBreakdownSeparator, { color: "#FFFFFF" }]}
              >
                {" "}
              </Text>
              <Text style={[styles.scoreBreakdownText, { color: "#FFFFFF" }]}>
                ET: {match.extraTime.home}-{match.extraTime.away}
              </Text>
            </>
          )}

          {/* Penalty Score (only if match went to penalties) */}
          {showPenalties && match.penalties && (
            <>
              <Text
                style={[styles.scoreBreakdownSeparator, { color: "#FFFFFF" }]}
              >
                {" "}
              </Text>
              <Text style={[styles.scoreBreakdownText, { color: "#FF4444" }]}>
                Pen: {match.penalties.home}-{match.penalties.away}
              </Text>
            </>
          )}
        </View>

        {/* Corner kicks below - only for football */}
        <View style={styles.cornerRow}>
          <Flag size={12} color="#FFFFFF" />
          <Text style={[styles.cornerText, { color: "#FFFFFF" }]}>
            {getCornersDisplay()}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {actualStatus === "upcoming" && renderUpcoming()}
      {actualStatus === "live" && renderLive()}
      {actualStatus === "finished" && renderFinished()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  compactContainer: {
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    minWidth: 80,
  },

  // Status text (Finished/Pending)
  statusText: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Inter-SemiBold",
    textAlign: "center",
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    overflow: "hidden",
  },

  // Timer text for live matches
  timerText: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Inter-Bold",
    textAlign: "center",
    marginBottom: 6,
    letterSpacing: 0.5,
    minWidth: 50,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    overflow: "hidden",
  },

  // Main score
  mainScore: {
    fontSize: 36,
    fontWeight: "800",
    fontFamily: "Inter-ExtraBold",
    textAlign: "center",
    lineHeight: 40,
  },

  // Halftime score
  halftimeText: {
    fontSize: 14,
    fontWeight: "500",
    fontFamily: "Inter-Medium",
    textAlign: "center",
    opacity: 0.95,
  },

  // ✅ Basketball stats text (Diff, Total)
  basketballStatsText: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter-SemiBold",
    textAlign: "center",
    marginTop: 2,
    opacity: 0.9,
  },

  // Countdown box for upcoming matches
  countdownBox: {
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: "center",
    marginTop: 4,
    minWidth: 140,
  },

  countdownLabel: {
    fontSize: 11,
    fontWeight: "700",
    fontFamily: "Inter-Bold",
    textAlign: "center",
    marginBottom: 4,
    letterSpacing: 0.3,
  },

  countdownTime: {
    fontSize: 16,
    fontWeight: "800",
    fontFamily: "Inter-ExtraBold",
    textAlign: "center",
    letterSpacing: 0.5,
  },

  // Corner kick styles
  cornerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    marginTop: 3,
  },

  cornerText: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "Inter-SemiBold",
    textAlign: "center",
  },

  // Info column for second half (keeping for compatibility)
  infoColumn: {
    alignItems: "center",
    gap: 1,
  },

  // Horizontal info row for HT score and corners
  horizontalInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 8,
    width: "100%",
    marginTop: 1,
    marginLeft: -16,
    paddingLeft: 12,
  },

  // Extra time text styling
  extraTimeText: {
    fontSize: 10,
    fontWeight: "500",
    fontFamily: "Inter-Medium",
  },

  // Score breakdown row for finished matches
  scoreBreakdownRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 5,
    marginTop: 4,
  },

  scoreBreakdownText: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter-SemiBold",
    textAlign: "center",
  },

  scoreBreakdownSeparator: {
    fontSize: 14,
    fontWeight: "400",
    opacity: 0.7,
  },
});

export default MatchDetailsScoresDisplay;
