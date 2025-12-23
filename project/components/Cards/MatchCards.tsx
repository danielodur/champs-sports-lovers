import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { FixtureEvent } from "../../types/football-fixtures-response";

export interface CardData {
  type: "yellow" | "red" | "yellow-red";
  player: string;
  team: "home" | "away";
  minute: number;
  teamName: string;
}

interface MatchCardsProps {
  events: FixtureEvent[] | null;
  homeTeamName: string;
  awayTeamName: string;
  homeTeamId: number | null;
  awayTeamId: number | null;
  theme: any;
  compact?: boolean;
}

const MatchCards: React.FC<MatchCardsProps> = ({
  events,
  homeTeamName,
  awayTeamName,
  homeTeamId,
  awayTeamId,
  theme,
  compact = false,
}) => {
  // Extract card events from fixture events
  const getCardEvents = (): CardData[] => {
    if (!events) return [];

    return events
      .filter(
        (event) =>
          event.type === "Card" &&
          (event.detail === "Yellow Card" ||
            event.detail === "Red Card" ||
            event.detail === "Second Yellow Card"),
      )
      .map((event) => {
        let cardType: "yellow" | "red" | "yellow-red" = "yellow";

        if (event.detail === "Red Card") {
          cardType = "red";
        } else if (event.detail === "Second Yellow Card") {
          cardType = "yellow-red";
        }

        const isHome = event.team.id === homeTeamId;

        return {
          type: cardType,
          player: event.player.name || "Unknown Player",
          team: isHome ? ("home" as const) : ("away" as const),
          minute: event.time.elapsed || 0,
          teamName: isHome ? homeTeamName : awayTeamName,
        };
      })
      .sort((a, b) => a.minute - b.minute);
  };

  const cardEvents = getCardEvents();
  const homeCards = cardEvents.filter((card) => card.team === "home");
  const awayCards = cardEvents.filter((card) => card.team === "away");

  if (cardEvents.length === 0) {
    return null;
  }

  // Count cards by type for each team
  const getCardCounts = (cards: CardData[]) => {
    const yellowCount = cards.filter((card) => card.type === "yellow").length;
    const redCount = cards.filter(
      (card) => card.type === "red" || card.type === "yellow-red",
    ).length;
    return { yellowCount, redCount };
  };

  const renderTeamCards = (cards: CardData[], teamSide: "home" | "away") => {
    const { yellowCount, redCount } = getCardCounts(cards);

    if (yellowCount === 0 && redCount === 0) return null;

    return (
      <View style={styles.teamCardsContainer}>
        {yellowCount > 0 && (
          <View style={[styles.cardBadge, { backgroundColor: "#FFD700" }]}>
            <Text
              style={[
                styles.cardText,
                { color: "#000000", fontSize: compact ? 8 : 10 },
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
              {
                backgroundColor: "#FF4444",
                marginLeft: yellowCount > 0 ? 2 : 0,
              },
            ]}
          >
            <Text
              style={[
                styles.cardText,
                { color: "#FFFFFF", fontSize: compact ? 8 : 10 },
              ]}
            >
              {redCount}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderCompactCards = () => {
    const homeCardCounts = getCardCounts(homeCards);
    const awayCardCounts = getCardCounts(awayCards);

    if (
      homeCardCounts.yellowCount === 0 &&
      homeCardCounts.redCount === 0 &&
      awayCardCounts.yellowCount === 0 &&
      awayCardCounts.redCount === 0
    )
      return null;

    return (
      <View style={styles.compactCardsContainer}>
        {/* Home team cards */}
        {renderTeamCards(homeCards, "home")}

        {/* Separator */}
        {(homeCardCounts.yellowCount > 0 || homeCardCounts.redCount > 0) &&
          (awayCardCounts.yellowCount > 0 || awayCardCounts.redCount > 0) && (
            <Text
              style={[styles.separator, { color: theme.colors.textSecondary }]}
            >
              |
            </Text>
          )}

        {/* Away team cards */}
        {renderTeamCards(awayCards, "away")}
      </View>
    );
  };

  const renderDetailedCards = (cards: CardData[], teamName: string) => {
    const { yellowCount, redCount } = getCardCounts(cards);

    if (yellowCount === 0 && redCount === 0) return null;

    return (
      <View style={styles.teamSection}>
        <Text style={[styles.teamTitle, { color: theme.colors.text }]}>
          {teamName}
        </Text>
        <View style={styles.cardContainer}>
          {yellowCount > 0 && (
            <View style={styles.cardItem}>
              <View style={[styles.cardBadge, { backgroundColor: "#FFD700" }]}>
                <Text style={[styles.cardText, { color: "#000000" }]}>
                  {yellowCount}
                </Text>
              </View>
              <Text
                style={[
                  styles.cardLabel,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Yellow Card{yellowCount > 1 ? "s" : ""}
              </Text>
            </View>
          )}
          {redCount > 0 && (
            <View style={styles.cardItem}>
              <View
                style={[
                  styles.cardBadge,
                  {
                    backgroundColor: "#FF4444",
                    marginLeft: yellowCount > 0 ? 8 : 0,
                  },
                ]}
              >
                <Text style={[styles.cardText, { color: "#FFFFFF" }]}>
                  {redCount}
                </Text>
              </View>
              <Text
                style={[
                  styles.cardLabel,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Red Card{redCount > 1 ? "s" : ""}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (compact) {
    return renderCompactCards();
  }

  return (
    <View style={styles.container}>
      {renderDetailedCards(homeCards, homeTeamName)}
      {renderDetailedCards(awayCards, awayTeamName)}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  teamSection: {
    marginBottom: 12,
  },
  teamTitle: {
    fontSize: 14,
    fontFamily: "Inter-SemiBold",
    marginBottom: 6,
  },
  cardContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  cardItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 8,
  },
  cardBadge: {
    width: 16,
    height: 20,
    borderRadius: 2,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 2,
    paddingVertical: 1,
  },
  cardText: {
    fontSize: 10,
    fontFamily: "Inter-Bold",
  },
  cardLabel: {
    fontSize: 12,
    fontFamily: "Inter-Regular",
    marginLeft: 4,
  },
  compactCardsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  teamCardsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  compactCard: {
    width: 12,
    height: 16,
    borderRadius: 2,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 2,
    paddingVertical: 1,
  },
  compactCardText: {
    fontSize: 8,
    fontFamily: "Inter-Bold",
  },
  separator: {
    fontSize: 12,
    fontFamily: "Inter-Regular",
    marginHorizontal: 4,
  },
});

export default MatchCards;
