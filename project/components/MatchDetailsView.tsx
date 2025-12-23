import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  FlatList,
} from "react-native";
import { Fixture, FixtureEvent } from "../types/football-fixtures-response";
import { MatchCards } from "./Cards";
import { cardsService } from "../services/cardsService";
import { useTheme } from "../hooks/useTheme";
import { Clock, Calendar, MapPin, Users, Trophy } from "lucide-react-native";

interface MatchDetailsViewProps {
  fixture: Fixture;
  showDetails?: boolean;
  onCardPress?: (cardData: any) => void;
}

const { width } = Dimensions.get("window");

const MatchDetailsView: React.FC<MatchDetailsViewProps> = ({
  fixture,
  showDetails = true,
  onCardPress,
}) => {
  const theme = useTheme();
  const [selectedTab, setSelectedTab] = useState<
    "overview" | "cards" | "events"
  >("overview");

  // Get cards statistics
  const cardsStats = useMemo(() => {
    if (!fixture.events) return null;
    return cardsService.getDisciplinaryStats(fixture.events);
  }, [fixture.events]);

  // Get match cards data
  const matchCards = useMemo(() => {
    if (!fixture.events) return null;
    return cardsService.extractCardsFromEvents(
      fixture.events,
      fixture.fixture.id.toString(),
      fixture.teams.home.name || "",
      fixture.teams.away.name || "",
      fixture.teams.home.id,
      fixture.teams.away.id,
    );
  }, [fixture]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "1H":
      case "2H":
      case "HT":
      case "ET":
        return "#00FF00"; // Live green
      case "FT":
      case "AET":
      case "PEN":
        return theme.colors.text;
      case "NS":
        return theme.colors.textSecondary;
      default:
        return theme.colors.text;
    }
  };

  const renderOverview = () => (
    <View style={styles.overviewContainer}>
      {/* Match Header */}
      <View style={styles.matchHeader}>
        <View style={styles.matchInfo}>
          <View style={styles.infoRow}>
            <Calendar size={14} color={theme.colors.textSecondary} />
            <Text
              style={[styles.infoText, { color: theme.colors.textSecondary }]}
            >
              {formatDate(fixture.fixture.date)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Clock size={14} color={theme.colors.textSecondary} />
            <Text
              style={[styles.infoText, { color: theme.colors.textSecondary }]}
            >
              {formatTime(fixture.fixture.date)}
            </Text>
          </View>
          {fixture.fixture.venue?.name && (
            <View style={styles.infoRow}>
              <MapPin size={14} color={theme.colors.textSecondary} />
              <Text
                style={[styles.infoText, { color: theme.colors.textSecondary }]}
              >
                {fixture.fixture.venue.name}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Teams and Score */}
      <View style={styles.teamsContainer}>
        <View style={[styles.teamSection, { position: "relative" }]}>
          <Text style={[styles.teamName, { color: theme.colors.text }]}>
            {fixture.teams.home.name}
          </Text>
          {/* Home team cards positioned under first character of team name */}
          {matchCards?.homeCards && matchCards.homeCards.length > 0 && (
            <View style={[styles.teamCards, styles.homeTeamCards]}>
              {matchCards.homeCards.map((card, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.miniCard,
                    {
                      backgroundColor:
                        card.type === "red"
                          ? "#FF4444"
                          : card.type === "yellow-red"
                            ? "#FF8800"
                            : "#FFD700",
                    },
                  ]}
                  onPress={() => onCardPress?.(card)}
                >
                  <Text
                    style={[
                      styles.miniCardText,
                      { color: card.type === "yellow" ? "#000000" : "#FFFFFF" },
                    ]}
                  >
                    {card.type === "yellow-red"
                      ? "Y/R"
                      : card.type.charAt(0).toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={styles.scoreSection}>
          {fixture.fixture.status.short !== "NS" ? (
            <>
              <Text
                style={[
                  styles.score,
                  { color: getStatusColor(fixture.fixture.status.short || "") },
                ]}
              >
                {fixture.goals.home} - {fixture.goals.away}
              </Text>
              <Text
                style={[
                  styles.status,
                  { color: getStatusColor(fixture.fixture.status.short || "") },
                ]}
              >
                {fixture.fixture.status.short}
              </Text>
              {fixture.fixture.status.elapsed && (
                <Text
                  style={[
                    styles.elapsed,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {fixture.fixture.status.elapsed}'
                </Text>
              )}
            </>
          ) : (
            <Text style={[styles.vsText, { color: theme.colors.text }]}>
              VS
            </Text>
          )}
        </View>

        <View style={[styles.teamSection, { position: "relative" }]}>
          <Text
            style={[
              styles.teamName,
              { color: theme.colors.text, textAlign: "right" },
            ]}
          >
            {fixture.teams.away.name}
          </Text>
          {/* Away team cards positioned under last character of team name */}
          {matchCards?.awayCards && matchCards.awayCards.length > 0 && (
            <View style={[styles.teamCards, styles.awayTeamCards]}>
              {matchCards.awayCards.map((card, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.miniCard,
                    {
                      backgroundColor:
                        card.type === "red"
                          ? "#FF4444"
                          : card.type === "yellow-red"
                            ? "#FF8800"
                            : "#FFD700",
                    },
                  ]}
                  onPress={() => onCardPress?.(card)}
                >
                  <Text
                    style={[
                      styles.miniCardText,
                      { color: card.type === "yellow" ? "#000000" : "#FFFFFF" },
                    ]}
                  >
                    {card.type === "yellow-red"
                      ? "Y/R"
                      : card.type.charAt(0).toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>

      {/* League Info */}
      <View style={styles.leagueContainer}>
        <Trophy size={16} color={theme.colors.textSecondary} />
        <Text style={[styles.leagueName, { color: theme.colors.text }]}>
          {fixture.league.country} {fixture.league.name}
        </Text>
      </View>

      {/* Cards Summary */}
      {cardsStats && cardsStats.totalCards > 0 && (
        <View style={styles.cardsSummary}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Disciplinary Summary
          </Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <View style={[styles.statBadge, { backgroundColor: "#FFD700" }]}>
                <Text style={[styles.statBadgeText, { color: "#000000" }]}>
                  Y
                </Text>
              </View>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>
                {cardsStats.yellowCards}
              </Text>
            </View>
            <View style={styles.statItem}>
              <View style={[styles.statBadge, { backgroundColor: "#FF4444" }]}>
                <Text style={[styles.statBadgeText, { color: "#FFFFFF" }]}>
                  R
                </Text>
              </View>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>
                {cardsStats.redCards + cardsStats.secondYellowCards}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text
                style={[
                  styles.statLabel,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Total: {cardsStats.totalCards}
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );

  const renderCardsDetail = () => (
    <View style={styles.cardsContainer}>
      {matchCards ? (
        <MatchCards
          events={fixture.events}
          homeTeamName={fixture.teams.home.name || ""}
          awayTeamName={fixture.teams.away.name || ""}
          homeTeamId={fixture.teams.home.id}
          awayTeamId={fixture.teams.away.id}
          theme={theme}
          compact={false}
        />
      ) : (
        <Text
          style={[styles.noDataText, { color: theme.colors.textSecondary }]}
        >
          No cards in this match
        </Text>
      )}
    </View>
  );

  const renderEvents = () => {
    if (!fixture.events || fixture.events.length === 0) {
      return (
        <Text
          style={[styles.noDataText, { color: theme.colors.textSecondary }]}
        >
          No events available
        </Text>
      );
    }

    const sortedEvents = fixture.events
      .filter((event) => event.time.elapsed !== null)
      .sort((a, b) => (a.time.elapsed || 0) - (b.time.elapsed || 0));

    const renderEventItem = ({
      item: event,
      index,
    }: {
      item: any;
      index: number;
    }) => (
      <View style={styles.eventItem}>
        <Text style={[styles.eventTime, { color: theme.colors.textSecondary }]}>
          {event.time.elapsed}'
        </Text>
        <View style={styles.eventContent}>
          <Text style={[styles.eventType, { color: theme.colors.text }]}>
            {event.type} - {event.detail}
          </Text>
          <Text
            style={[styles.eventPlayer, { color: theme.colors.textSecondary }]}
          >
            {event.player.name} ({event.team.name})
          </Text>
          {event.assist.name && (
            <Text
              style={[
                styles.eventAssist,
                { color: theme.colors.textSecondary },
              ]}
            >
              Assist: {event.assist.name}
            </Text>
          )}
        </View>
      </View>
    );

    return (
      <FlatList
        data={sortedEvents}
        renderItem={renderEventItem}
        keyExtractor={(item, index) =>
          `${item.time.elapsed}-${item.type}-${index}`
        }
        style={styles.eventsContainer}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        initialNumToRender={8}
        windowSize={5}
        getItemLayout={(data, index) => ({
          length: 60,
          offset: 60 * index,
          index,
        })}
        showsVerticalScrollIndicator={true}
      />
    );
  };

  if (!showDetails) {
    return renderOverview();
  }

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === "overview" && {
              backgroundColor: theme.colors.primary,
            },
          ]}
          onPress={() => setSelectedTab("overview")}
        >
          <Text
            style={[
              styles.tabText,
              {
                color:
                  selectedTab === "overview" ? "#FFFFFF" : theme.colors.text,
              },
            ]}
          >
            Overview
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === "cards" && {
              backgroundColor: theme.colors.primary,
            },
          ]}
          onPress={() => setSelectedTab("cards")}
        >
          <Text
            style={[
              styles.tabText,
              {
                color: selectedTab === "cards" ? "#FFFFFF" : theme.colors.text,
              },
            ]}
          >
            Cards {cardsStats?.totalCards ? `(${cardsStats.totalCards})` : ""}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === "events" && {
              backgroundColor: theme.colors.primary,
            },
          ]}
          onPress={() => setSelectedTab("events")}
        >
          <Text
            style={[
              styles.tabText,
              {
                color: selectedTab === "events" ? "#FFFFFF" : theme.colors.text,
              },
            ]}
          >
            Events
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={true}
        bounces={true}
        scrollEnabled={true}
        nestedScrollEnabled={true}
      >
        {selectedTab === "overview" && renderOverview()}
        {selectedTab === "cards" && renderCardsDetail()}
        {selectedTab === "events" && renderEvents()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 8,
    marginHorizontal: 4,
    marginVertical: 4,
  },
  tabText: {
    fontSize: 14,
    fontFamily: "Inter-Medium",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  overviewContainer: {
    gap: 16,
  },
  matchHeader: {
    backgroundColor: "rgba(0,0,0,0.05)",
    borderRadius: 8,
    padding: 12,
  },
  matchInfo: {
    gap: 6,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoText: {
    fontSize: 12,
    fontFamily: "Inter-Regular",
  },
  teamsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
  },
  teamSection: {
    flex: 1,
    alignItems: "center",
  },
  teamName: {
    fontSize: 16,
    fontFamily: "Inter-SemiBold",
    textAlign: "center",
    marginBottom: 8,
  },
  teamCards: {
    flexDirection: "row",
    gap: 4,
    justifyContent: "center",
    flexWrap: "wrap",
    position: "absolute",
    top: 24,
  },
  homeTeamCards: {
    left: 0,
    alignItems: "flex-start",
  },
  awayTeamCards: {
    right: 0,
    alignItems: "flex-end",
  },
  miniCard: {
    width: 16,
    height: 14,
    borderRadius: 3,
    justifyContent: "center",
    alignItems: "center",
  },
  miniCardText: {
    fontSize: 8,
    fontFamily: "Inter-Bold",
  },
  scoreSection: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 16,
  },
  score: {
    fontSize: 28,
    fontFamily: "Inter-Bold",
    textAlign: "center",
  },
  status: {
    fontSize: 12,
    fontFamily: "Inter-Medium",
    marginTop: 4,
  },
  elapsed: {
    fontSize: 10,
    fontFamily: "Inter-Regular",
    marginTop: 2,
  },
  vsText: {
    fontSize: 20,
    fontFamily: "Inter-Bold",
  },
  leagueContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 8,
  },
  leagueName: {
    fontSize: 14,
    fontFamily: "Inter-Medium",
  },
  cardsSummary: {
    backgroundColor: "rgba(0,0,0,0.05)",
    borderRadius: 8,
    padding: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Inter-SemiBold",
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statBadge: {
    width: 20,
    height: 16,
    borderRadius: 3,
    justifyContent: "center",
    alignItems: "center",
  },
  statBadgeText: {
    fontSize: 10,
    fontFamily: "Inter-Bold",
  },
  statValue: {
    fontSize: 14,
    fontFamily: "Inter-Medium",
  },
  statLabel: {
    fontSize: 12,
    fontFamily: "Inter-Regular",
  },
  cardsContainer: {
    flex: 1,
  },
  eventsContainer: {
    flex: 1,
  },
  eventItem: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  eventTime: {
    width: 40,
    fontSize: 12,
    fontFamily: "Inter-Medium",
    textAlign: "center",
  },
  eventContent: {
    flex: 1,
    marginLeft: 12,
  },
  eventType: {
    fontSize: 14,
    fontFamily: "Inter-Medium",
    marginBottom: 2,
  },
  eventPlayer: {
    fontSize: 12,
    fontFamily: "Inter-Regular",
  },
  eventAssist: {
    fontSize: 11,
    fontFamily: "Inter-Regular",
    fontStyle: "italic",
  },
  noDataText: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
    textAlign: "center",
    marginTop: 32,
  },
});

export default MatchDetailsView;
