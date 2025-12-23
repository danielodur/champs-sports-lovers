import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { useTheme } from "@/hooks/useTheme";

const { width: screenWidth } = Dimensions.get("window");

interface FinishedExtraTimeProps {
  fixture: {
    fixture: {
      status: {
        short: string | null;
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
    teams: {
      home?: {
        name: string | null;
      };
      away?: {
        name: string | null;
      };
    };
  };
  homeTeamName: string;
  awayTeamName: string;
}

const FinishedExtraTime: React.FC<FinishedExtraTimeProps> = ({
  fixture,
  homeTeamName,
  awayTeamName,
}) => {
  const theme = useTheme();

  // Check if match finished after extra time (AET) or penalties (PEN)
  const status = fixture.fixture.status.short;
  const isAET = status === "AET";
  const isPEN = status === "PEN";

  if (!isAET && !isPEN) {
    return null;
  }

  // Get scores
  const htScore = {
    home: fixture.score?.halftime?.home ?? 0,
    away: fixture.score?.halftime?.away ?? 0,
  };

  const ftScore = {
    home: fixture.score?.fulltime?.home ?? 0,
    away: fixture.score?.fulltime?.away ?? 0,
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

  // Determine winner
  let winner = "";
  if (isPEN && penScore) {
    winner = penScore.home > penScore.away ? homeTeamName : awayTeamName;
  } else if (isAET) {
    winner = etScore.home > etScore.away ? homeTeamName : awayTeamName;
  }

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.transparentRedBar,
          {
            backgroundColor: "rgba(255, 68, 68, 0.08)",
            borderTopWidth: 1,
            borderTopColor: "rgba(255, 68, 68, 0.15)",
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

              {/* Extra Time Final Score (or 1st half ET if available) */}
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

        {/* Winner Display */}
        {winner && (
          <View style={styles.winnerRow}>
            <Text style={[styles.winnerText, { color: "#FF4444" }]}>  
              {winner} Won
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
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

  winnerRow: {
    marginTop: 6,
    alignItems: "center", // ✅ Center the winner text horizontally
  },

  winnerText: {
    fontSize: 12,
    fontWeight: "800",
    fontFamily: "Inter-ExtraBold",
    letterSpacing: 0.3,
  },
});

export default FinishedExtraTime;
