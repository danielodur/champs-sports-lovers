import React, { memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../hooks/useTheme";

interface MatchCardsProps {
  yellowCards: number;
  redCards: number;
  position: "home" | "away";
  teamName: string;
  style?: any;
}

const MatchCards = memo<MatchCardsProps>(
  ({ yellowCards, redCards, position, teamName, style }) => {
    const theme = useTheme();

    // Debug logging to see what data we're getting
    if (__DEV__) {
      console.log(`🃏 MatchCards Debug - ${teamName} (${position}):`, {
        yellowCards,
        redCards,
        hasCards: yellowCards > 0 || redCards > 0,
      });
    }

    // Don't render if no cards
    const hasCards = yellowCards > 0 || redCards > 0;

    if (!hasCards) {
      return null;
    }

    const totalCards = yellowCards + redCards;

    return (
      <View
        style={[
          styles.cardsContainer,
          position === "home" ? styles.homeCards : styles.awayCards,
          style,
        ]}
      >
        {/* Debug info in dev mode - always visible */}
        {__DEV__ && !hasCards && (
          <View style={styles.debugContainer}>
            <Text style={styles.debugText}>
              {teamName}: Y:{yellowCards} R:{redCards}
            </Text>
          </View>
        )}

        {/* Yellow Cards */}
        {yellowCards > 0 && (
          <View style={styles.yellowCard}>
            <Text style={styles.cardText}>{yellowCards}</Text>
          </View>
        )}

        {/* Red Cards */}
        {redCards > 0 && (
          <View style={styles.redCard}>
            <Text style={[styles.cardText, { color: "#FFFFFF" }]}>
              {redCards}
            </Text>
          </View>
        )}

        {/* Total cards indicator (optional, for debugging) */}
        {__DEV__ && totalCards > 3 && (
          <Text
            style={[
              styles.totalCardsText,
              { color: theme.colors.textSecondary },
            ]}
          >
            ({totalCards})
          </Text>
        )}
      </View>
    );
  },
);

MatchCards.displayName = "MatchCards";

const styles = StyleSheet.create({
  cardsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
    minHeight: 16,
  },
  homeCards: {
    justifyContent: "flex-start", // Left-aligned for home team
  },
  awayCards: {
    justifyContent: "flex-end", // Right-aligned for away team
  },
  yellowCard: {
    backgroundColor: "#FFD700", // Golden yellow
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingVertical: 1,
    marginHorizontal: 2,
    minWidth: 18,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  redCard: {
    backgroundColor: "#DC2626", // Red
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingVertical: 1,
    marginHorizontal: 2,
    minWidth: 18,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  cardText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#000000",
    textAlign: "center",
    fontFamily: "Inter-Bold",
  },
  totalCardsText: {
    fontSize: 9,
    marginLeft: 4,
    opacity: 0.7,
  },
  debugContainer: {
    backgroundColor: "rgba(255, 0, 0, 0.2)",
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
    marginHorizontal: 2,
  },
  debugText: {
    fontSize: 8,
    color: "#FF0000",
    fontWeight: "bold",
  },
});

export default MatchCards;
export { MatchCards };
