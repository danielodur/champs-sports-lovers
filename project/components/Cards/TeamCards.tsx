import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { FixtureEvent } from "../../types/football-fixtures-response";

interface TeamCardsProps {
  events: FixtureEvent[] | null;
  teamId: number | null;
  theme: any;
  compact?: boolean;
}

const TeamCards: React.FC<TeamCardsProps> = ({
  events,
  teamId,
  theme,
  compact = true,
}) => {
  // Get card counts for the specific team
  const getTeamCardCounts = () => {
    if (!events || !teamId) return { yellowCount: 0, redCount: 0 };

    const teamCards = events.filter(
      (event) =>
        event.type === "Card" &&
        (event.team.id === teamId ||
          event.team.name ===
            events.find((e) => e.team.id === teamId)?.team.name) &&
        event.detail &&
        (event.detail.toLowerCase().includes("yellow") ||
          event.detail.toLowerCase().includes("red")),
    );

    const yellowCount = teamCards.filter(
      (event) =>
        event.detail &&
        event.detail.toLowerCase().includes("yellow") &&
        !event.detail.toLowerCase().includes("second"),
    ).length;

    const redCount = teamCards.filter(
      (event) =>
        event.detail &&
        (event.detail.toLowerCase().includes("red") ||
          event.detail.toLowerCase().includes("second yellow")),
    ).length;

    return { yellowCount, redCount };
  };

  const { yellowCount, redCount } = getTeamCardCounts();

  // Log card detection for debugging
  if (events && events.length > 0) {
    const cardEvents = events.filter(
      (event) =>
        event.type === "Card" &&
        (event.team.id === teamId ||
          event.team.name ===
            events.find((e) => e.team.id === teamId)?.team.name),
    );

    if (cardEvents.length > 0) {
      console.log(
        `🃏 Cards found for team ${teamId}: ${yellowCount} yellow, ${redCount} red`,
      );
    }
  }

  return (
    <View style={styles.container}>
      {yellowCount > 0 && (
        <View
          style={[
            styles.cardBadge,
            styles.yellowCard,
            {
              width: compact ? 16 : 20,
              height: compact ? 22 : 28,
            },
          ]}
        >
          <Text
            style={[
              styles.cardText,
              styles.yellowCardText,
              {
                fontSize: compact ? 10 : 12,
              },
            ]}
          >
            {yellowCount}
          </Text>
        </View>
      )}
      {redCount > 0 && (
        <View
          style={[
            styles.cardBadge,
            styles.redCard,
            {
              marginLeft: yellowCount > 0 ? 2 : 0,
              width: compact ? 16 : 20,
              height: compact ? 22 : 28,
            },
          ]}
        >
          <Text
            style={[
              styles.cardText,
              styles.redCardText,
              {
                fontSize: compact ? 10 : 12,
              },
            ]}
          >
            {redCount}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 2,
  },
  cardBadge: {
    borderRadius: 3,
    justifyContent: "center",
    alignItems: "center",
    // Vertical rectangular shape like real football cards
    width: 16,
    height: 22,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 3,
    borderWidth: 0.5,
  },
  yellowCard: {
    backgroundColor: "#FFD700",
    borderColor: "#FFC107",
  },
  redCard: {
    backgroundColor: "#FF4444",
    borderColor: "#D32F2F",
  },
  cardText: {
    fontFamily: "Inter-ExtraBold",
    textAlign: "center",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  yellowCardText: {
    color: "#1A1A1A",
    textShadowColor: "rgba(255, 255, 255, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  redCardText: {
    color: "#FFFFFF",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
});

export default TeamCards;
