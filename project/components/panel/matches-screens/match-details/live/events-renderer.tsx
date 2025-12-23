import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { MatchEvent } from "../../types/match-details/match-details";

interface EventsRendererProps {
  events: MatchEvent[];
  activeTab: "live_commentary" | "key_events";
  onTabChange: (tab: "live_commentary" | "key_events") => void;
}

export const EventsRenderer: React.FC<EventsRendererProps> = ({
  events,
  activeTab,
  onTabChange,
}) => {
  const theme = useTheme();

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case "goal":
        return "#4CAF50";
      case "yellow_card":
        return "#FFC107";
      case "red_card":
        return "#F44336";
      case "corner":
        return "#2196F3";
      case "substitution":
        return "#9C27B0";
      case "commentary":
        return theme.colors.textSecondary;
      default:
        return theme.colors.textSecondary;
    }
  };

  const getEventIcon = (event: MatchEvent) => {
    const iconMap: { [key: string]: string } = {
      goal: "⚽",
      yellow_card: "🟨",
      red_card: "🟥",
      corner: "🚩",
      substitution: "🔄",
      commentary: "🎺",
      whistle: "🎺",
      weather: "🌤️",
      field: "🏟️",
      announcement: "📢",
    };

    return event.icon || iconMap[event.type] || "⚽";
  };

  const renderEventItem = (event: MatchEvent, index: number) => {
    const isKeyEvent = [
      "goal",
      "yellow_card",
      "red_card",
      "substitution",
    ].includes(event.type);
    const shouldShow =
      activeTab === "live_commentary" ||
      (activeTab === "key_events" && isKeyEvent);

    if (!shouldShow) return null;

    return (
      <View
        key={event.id}
        style={[
          styles.eventItem,
          {
            backgroundColor:
              index % 2 === 0
                ? theme.colors.backgroundSecondary + "10"
                : "transparent",
          },
        ]}
      >
        <View style={styles.eventIconContainer}>
          <Text style={styles.eventIcon}>{getEventIcon(event)}</Text>
          <View
            style={[
              styles.eventLine,
              { backgroundColor: getEventTypeColor(event.type) },
            ]}
          />
        </View>

        <View style={styles.eventContent}>
          <View style={styles.eventHeader}>
            <Text
              style={[
                styles.eventMinute,
                { color: getEventTypeColor(event.type) },
              ]}
            >
              {event.minute > 0 ? `${event.minute}'` : "-"}
            </Text>
            {event.type !== "commentary" && (
              <View
                style={[
                  styles.eventTeamIndicator,
                  {
                    backgroundColor:
                      event.team === "home" ? "#FF6B6B" : "#4A9EFF",
                  },
                ]}
              />
            )}
          </View>

          <Text style={[styles.eventDescription, { color: theme.colors.text }]}>
            {event.description}
          </Text>

          {event.player && event.type !== "commentary" && (
            <Text
              style={[
                styles.eventPlayer,
                { color: theme.colors.textSecondary },
              ]}
            >
              {event.player}
            </Text>
          )}
        </View>
      </View>
    );
  };

  const renderTabNavigation = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[
          styles.tabButton,
          {
            borderBottomColor:
              activeTab === "live_commentary" ? "#FF6B6B" : "transparent",
            borderBottomWidth: activeTab === "live_commentary" ? 2 : 0,
          },
        ]}
        onPress={() => onTabChange("live_commentary")}
      >
        <Text
          style={[
            styles.tabButtonText,
            {
              color:
                activeTab === "live_commentary"
                  ? "#FF6B6B"
                  : theme.colors.textSecondary,
              fontWeight: activeTab === "live_commentary" ? "600" : "normal",
            },
          ]}
        >
          Live Commentary
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.tabButton,
          {
            borderBottomColor:
              activeTab === "key_events" ? "#FF6B6B" : "transparent",
            borderBottomWidth: activeTab === "key_events" ? 2 : 0,
          },
        ]}
        onPress={() => onTabChange("key_events")}
      >
        <Text
          style={[
            styles.tabButtonText,
            {
              color:
                activeTab === "key_events"
                  ? "#FF6B6B"
                  : theme.colors.textSecondary,
              fontWeight: activeTab === "key_events" ? "600" : "normal",
            },
          ]}
        >
          Key Events
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderEventLegend = () => (
    <View style={styles.legendContainer}>
      <View style={styles.legendGrid}>
        <View style={styles.legendItem}>
          <Text style={styles.legendIcon}>⚽</Text>
          <Text
            style={[styles.legendText, { color: theme.colors.textSecondary }]}
          >
            Goal
          </Text>
        </View>
        <View style={styles.legendItem}>
          <Text style={styles.legendIcon}>🎯</Text>
          <Text
            style={[styles.legendText, { color: theme.colors.textSecondary }]}
          >
            Shot on Target
          </Text>
        </View>
        <View style={styles.legendItem}>
          <Text style={styles.legendIcon}>⭕</Text>
          <Text
            style={[styles.legendText, { color: theme.colors.textSecondary }]}
          >
            Shot off Target
          </Text>
        </View>
        <View style={styles.legendItem}>
          <Text style={styles.legendIcon}>🟢</Text>
          <Text
            style={[styles.legendText, { color: theme.colors.textSecondary }]}
          >
            Penalty
          </Text>
        </View>
        <View style={styles.legendItem}>
          <Text style={styles.legendIcon}>❌</Text>
          <Text
            style={[styles.legendText, { color: theme.colors.textSecondary }]}
          >
            Penalty Missed
          </Text>
        </View>
        <View style={styles.legendItem}>
          <Text style={styles.legendIcon}>🟢</Text>
          <Text
            style={[styles.legendText, { color: theme.colors.textSecondary }]}
          >
            Penalty Shootout
          </Text>
        </View>
        <View style={styles.legendItem}>
          <Text style={styles.legendIcon}>🔴</Text>
          <Text
            style={[styles.legendText, { color: theme.colors.textSecondary }]}
          >
            Own Goal
          </Text>
        </View>
        <View style={styles.legendItem}>
          <Text style={styles.legendIcon}>👟</Text>
          <Text
            style={[styles.legendText, { color: theme.colors.textSecondary }]}
          >
            Assist
          </Text>
        </View>
        <View style={styles.legendItem}>
          <Text style={styles.legendIcon}>🟩</Text>
          <Text
            style={[styles.legendText, { color: theme.colors.textSecondary }]}
          >
            Corner
          </Text>
        </View>
        <View style={styles.legendItem}>
          <Text style={styles.legendIcon}>🟨</Text>
          <Text
            style={[styles.legendText, { color: theme.colors.textSecondary }]}
          >
            Yellow Card
          </Text>
        </View>
        <View style={styles.legendItem}>
          <Text style={styles.legendIcon}>🔴</Text>
          <Text
            style={[styles.legendText, { color: theme.colors.textSecondary }]}
          >
            Red Card
          </Text>
        </View>
        <View style={styles.legendItem}>
          <Text style={styles.legendIcon}>🩹</Text>
          <Text
            style={[styles.legendText, { color: theme.colors.textSecondary }]}
          >
            Injury Sub
          </Text>
        </View>
      </View>
    </View>
  );

  const filteredEvents = events.filter((event) => {
    if (activeTab === "live_commentary") return true;
    return ["goal", "yellow_card", "red_card", "substitution"].includes(
      event.type,
    );
  });

  return (
    <View style={styles.container}>
      {renderTabNavigation()}

      <ScrollView
        style={styles.eventsContainer}
        showsVerticalScrollIndicator={false}
      >
        {filteredEvents.length === 0 ? (
          <View style={styles.noEventsContainer}>
            <Text
              style={[
                styles.noEventsText,
                { color: theme.colors.textSecondary },
              ]}
            >
              {activeTab === "live_commentary"
                ? "No commentary available yet"
                : "No key events yet"}
            </Text>
          </View>
        ) : (
          filteredEvents.map((event, index) => renderEventItem(event, index))
        )}
      </ScrollView>

      {renderEventLegend()}
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
    borderBottomColor: "rgba(255,255,255,0.1)",
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
  },
  tabButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
  eventsContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  noEventsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  noEventsText: {
    fontSize: 16,
    fontStyle: "italic",
  },
  eventItem: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginBottom: 8,
    borderRadius: 8,
  },
  eventIconContainer: {
    width: 40,
    alignItems: "center",
    marginRight: 12,
  },
  eventIcon: {
    fontSize: 18,
    marginBottom: 4,
  },
  eventLine: {
    width: 2,
    height: 20,
    borderRadius: 1,
  },
  eventContent: {
    flex: 1,
  },
  eventHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  eventMinute: {
    fontSize: 12,
    fontWeight: "bold",
    minWidth: 30,
  },
  eventTeamIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  eventDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  eventPlayer: {
    fontSize: 12,
    fontStyle: "italic",
  },
  legendContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  legendGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    width: "48%",
    marginBottom: 8,
  },
  legendIcon: {
    fontSize: 12,
    marginRight: 6,
  },
  legendText: {
    fontSize: 10,
    flex: 1,
  },
});
