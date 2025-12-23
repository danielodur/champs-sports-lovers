import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, TouchableOpacity, Image, Platform } from "react-native";
import { Clock } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "../../hooks/useTheme";
import { useRouter } from "expo-router";
import { getLeagueNavigationFromApi } from "../../utils/leagueSlugGenerator";
import { getUpcomingLeagueEvents, type LeagueEvent } from "../../services/leagueEventsService";

interface StatsUpcomingEventsProps {
  onEventPress?: (event: LeagueEvent) => void;
  sport?: string; // Add sport parameter to filter data by sport type
}

export default function StatsUpcomingEvents({
  onEventPress,
  sport = "football", // Default to football
}: StatsUpcomingEventsProps) {
  const theme = useTheme();
  const router = useRouter();
  const [upcomingEvents, setUpcomingEvents] = useState<LeagueEvent[]>([]);
  const [loading, setLoading] = useState(false); // Start with false for instant render

  useEffect(() => {
    loadUpcomingEvents();
  }, [sport]); // Reload when sport changes

  const loadUpcomingEvents = async () => {
    try {
      // Don't show loading spinner - use cached data instantly
      const events = await getUpcomingLeagueEvents(9, sport);
      console.log(`📊 [UpcomingEvents] Loaded ${events.filter(e => e.matchCount > 0).length} ${sport} leagues with data`);
      setUpcomingEvents(events);
    } catch (error) {
      console.error("Failed to load upcoming events:", error);
      // Keep existing data on error
    } finally {
      setLoading(false);
    }
  };

  const handleEventPress = (event: LeagueEvent) => {
    // Don't navigate if it's an empty slot
    if (event.matchCount === 0 || event.apiLeagueId === 0) return;
    
    // Haptic feedback for smooth UX
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    if (onEventPress) {
      onEventPress(event);
    }
    
    // Navigate to league details Matches tab using API data
    try {
      const navParams = getLeagueNavigationFromApi({
        id: event.apiLeagueId,
        name: event.leagueName,
        country: event.country,
        logo: event.leagueLogo,
      });
      
      // Add tab param to navigate to Matches tab
      router.push({
        ...navParams,
        params: {
          ...navParams.params,
          tab: "matches",
        },
      });
    } catch (error) {
      console.error("Navigation error:", error);
    }
  };

  const renderEventItem = (event: LeagueEvent, index: number) => {
    const isLeftColumn = index % 3 === 0;
    const isRightColumn = index % 3 === 2;
    const isEmpty = event.matchCount === 0 || event.apiLeagueId === 0;

    return (
      <TouchableOpacity
        key={event.leagueId}
        style={[
          styles.eventItem,
          {
            backgroundColor: isEmpty 
              ? (theme.colors.background === "#121212" ? "#1A1A1A" : "#F5F5F5")
              : theme.colors.backgroundSecondary,
            borderColor: theme.colors.border || "rgba(255, 255, 255, 0.1)",
            marginLeft: isLeftColumn ? 0 : 8,
            marginRight: isRightColumn ? 0 : 8,
            opacity: isEmpty ? 0.4 : 1,
          },
        ]}
        onPress={() => handleEventPress(event)}
        activeOpacity={isEmpty ? 1 : 0.7}
        disabled={isEmpty}
      >
        {!isEmpty ? (
          <>
            <View style={styles.eventHeader}>
              {event.leagueLogo ? (
                <Image
                  source={{ uri: event.leagueLogo }}
                  style={styles.leagueLogo}
                  resizeMode="contain"
                />
              ) : (
                <View style={[styles.leagueLogo, { backgroundColor: theme.colors.border }]}>
                  <Text style={{ fontSize: 8 }}>🏆</Text>
                </View>
              )}
              <View style={styles.statusIndicator}>
                <Clock size={6} color="#FFFFFF" />
                <View style={[styles.statusDot, { backgroundColor: "#FF4444" }]} />
              </View>
            </View>

            <Text
              style={[styles.leagueName, { color: theme.colors.text }]}
              numberOfLines={1}
            >
              {event.leagueName}
            </Text>

            <Text
              style={[styles.matchCount, { color: theme.colors.textSecondary }]}
            >
              {event.matchCount} {event.matchCount === 1 ? 'match' : 'matches'}
            </Text>
          </>
        ) : (
          <View style={styles.emptySlot}>
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              0
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.eventsGrid}>
        {upcomingEvents.map((event, index) => renderEventItem(event, index))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 4,
    height: 240,
    paddingBottom: 6,
  },
  eventsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 8,
    justifyContent: "space-around",
  },
  eventItem: {
    width: "30%",
    marginBottom: 8,
    marginHorizontal: "1.5%",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    minHeight: 68,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  eventHeader: {
    position: "relative",
    marginBottom: 3,
    alignItems: "center",
  },
  leagueLogo: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  statusIndicator: {
    position: "absolute",
    top: -2,
    right: -2,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  leagueName: {
    fontSize: 10,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 1,
    lineHeight: 12,
  },
  matchCount: {
    fontSize: 9,
    textAlign: "center",
    fontWeight: "400",
    opacity: 0.7,
  },
  emptySlot: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "bold",
    opacity: 0.3,
  },
});
