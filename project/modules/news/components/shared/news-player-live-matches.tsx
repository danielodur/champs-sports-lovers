/**
 * Universal Sports Player Live Matches Component
 *
 * Real-time player performance tracking during live matches for sports events app.
 * Features live goal/assist tracking, player ratings, match events, and performance metrics.
 * Designed to integrate with news-player-matches.tsx and match Chinese app functionality.
 *
 * Usage:
 * <NewsPlayerLiveMatches playerId="player-id" liveMatchData={liveMatchData} />
 *
 * Features:
 * - Real-time player performance updates
 * - Live goal/assist/card tracking
 * - Player rating updates during match
 * - Match event timeline
 * - Animated performance indicators
 * - Universal adaptability for all sports
 *
 * Note: Template adaptable for Soccer, Basketball, Rugby with sport-specific metrics
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Animated,
  Dimensions,
} from "react-native";
import { useTheme } from "@/hooks/useTheme";

const { width } = Dimensions.get("window");

interface PlayerLiveEvent {
  id: string;
  minute: number;
  type: "goal" | "assist" | "yellow_card" | "red_card" | "substitution" | "save" | "tackle";
  playerName: string;
  playerImage?: string;
  description: string;
  rating?: number;
  teamSide: "home" | "away";
}

interface LivePlayerPerformance {
  playerId: string;
  playerName: string;
  playerImage: string;
  teamSide: "home" | "away";
  currentRating: number;
  minutesPlayed: number;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  isOnField: boolean;
  events: PlayerLiveEvent[];
}

interface LiveMatchData {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  homeTeamLogo: string;
  awayTeamLogo: string;
  matchStatus: "Live" | "HT" | "1H" | "2H" | "FT";
  currentMinute: number;
  competition: string;
  playerPerformance: LivePlayerPerformance;
  lastEventTime?: number;
}

interface NewsPlayerLiveMatchesProps {
  playerId: string;
  liveMatchData: LiveMatchData;
  onEventUpdate?: (event: PlayerLiveEvent) => void;
}

export default function NewsPlayerLiveMatches({
  playerId,
  liveMatchData,
  onEventUpdate,
}: NewsPlayerLiveMatchesProps) {
  const theme = useTheme();
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [fadeAnim] = useState(new Animated.Value(1));
  const [pulseAnim] = useState(new Animated.Value(1));
  const [showEventDetails, setShowEventDetails] = useState(false);

  const { playerPerformance } = liveMatchData;
  const events = playerPerformance.events;

  // Auto-cycle through player events every 8 seconds if there are multiple events
  useEffect(() => {
    if (events.length <= 1) return;

    const interval = setInterval(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setCurrentEventIndex((prevIndex) => (prevIndex + 1) % events.length);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }, 8000);

    return () => clearInterval(interval);
  }, [events.length, fadeAnim]);

  // Pulse animation for live indicator
  useEffect(() => {
    const pulseInterval = setInterval(() => {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    }, 1200);

    return () => clearInterval(pulseInterval);
  }, [pulseAnim]);

  // Trigger callback when new events are added
  useEffect(() => {
    if (events.length > 0 && onEventUpdate) {
      const latestEvent = events[events.length - 1];
      if (liveMatchData.lastEventTime && latestEvent.minute >= liveMatchData.lastEventTime) {
        onEventUpdate(latestEvent);
      }
    }
  }, [events.length, onEventUpdate, liveMatchData.lastEventTime]);

  const getRatingColor = (rating: number): string => {
    if (rating >= 9.0) return "#4CAF50"; // Green - Excellent
    if (rating >= 8.0) return "#FF9800"; // Orange - Very Good
    if (rating >= 7.0) return "#FFC107"; // Yellow - Good
    if (rating >= 6.0) return "#9C27B0"; // Purple - Average
    return "#F44336"; // Red - Poor
  };

  const getEventIcon = (type: string): string => {
    switch (type) {
      case "goal": return "⚽";
      case "assist": return "🅰️";
      case "yellow_card": return "🟨";
      case "red_card": return "🟥";
      case "substitution": return "🔄";
      case "save": return "🥅";
      case "tackle": return "⚡";
      default: return "📝";
    }
  };

  const getEventColor = (type: string): string => {
    switch (type) {
      case "goal": return theme.colors.success;
      case "assist": return theme.colors.primary;
      case "yellow_card": return theme.colors.warning;
      case "red_card": return theme.colors.error;
      case "substitution": return theme.colors.secondary;
      default: return theme.colors.textSecondary;
    }
  };

  const handleEventPress = () => {
    if (events.length <= 1) return;

    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setCurrentEventIndex((prevIndex) => (prevIndex + 1) % events.length);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  };

  const currentEvent = events[currentEventIndex];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.backgroundSecondary }]}>
      {/* Live Match Header */}
      <View style={styles.liveHeader}>
        <View style={styles.matchInfo}>
          <Text style={[styles.competition, { color: theme.colors.text }]}>
            {liveMatchData.competition}
          </Text>
          <View style={styles.scoreContainer}>
            <Text style={[styles.score, { color: theme.colors.text }]}>
              {liveMatchData.homeScore} - {liveMatchData.awayScore}
            </Text>
          </View>
        </View>

        <View style={styles.liveStatus}>
          <Animated.View style={[styles.liveDot, { transform: [{ scale: pulseAnim }] }]} />
          <Text style={[styles.liveText, { color: theme.colors.error }]}>
            LIVE {liveMatchData.currentMinute}'
          </Text>
        </View>
      </View>

      {/* Player Performance Summary */}
      <View style={styles.playerSummary}>
        <View style={styles.playerInfo}>
          <Image
            source={{ uri: playerPerformance.playerImage }}
            style={styles.playerImage}
          />
          <View style={styles.playerDetails}>
            <Text style={[styles.playerName, { color: theme.colors.text }]}>
              {playerPerformance.playerName}
            </Text>
            <Text style={[styles.minutesPlayed, { color: theme.colors.textSecondary }]}>
              {playerPerformance.minutesPlayed}' played
            </Text>
          </View>
        </View>

        <View style={styles.performanceStats}>
          <View style={[styles.ratingBadge, { backgroundColor: getRatingColor(playerPerformance.currentRating) }]}>
            <Text style={styles.ratingText}>{playerPerformance.currentRating.toFixed(1)}</Text>
          </View>

          <View style={styles.statsRow}>
            {playerPerformance.goals > 0 && (
              <View style={styles.statItem}>
                <Text style={styles.statIcon}>⚽</Text>
                <Text style={[styles.statValue, { color: theme.colors.success }]}>
                  {playerPerformance.goals}
                </Text>
              </View>
            )}
            {playerPerformance.assists > 0 && (
              <View style={styles.statItem}>
                <Text style={styles.statIcon}>🅰️</Text>
                <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                  {playerPerformance.assists}
                </Text>
              </View>
            )}
            {playerPerformance.yellowCards > 0 && (
              <View style={styles.statItem}>
                <Text style={styles.statIcon}>🟨</Text>
                <Text style={[styles.statValue, { color: theme.colors.warning }]}>
                  {playerPerformance.yellowCards}
                </Text>
              </View>
            )}
            {playerPerformance.redCards > 0 && (
              <View style={styles.statItem}>
                <Text style={styles.statIcon}>🟥</Text>
                <Text style={[styles.statValue, { color: theme.colors.error }]}>
                  {playerPerformance.redCards}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Live Event Display */}
      {currentEvent && (
        <TouchableOpacity
          style={[styles.eventContainer, { borderLeftColor: getEventColor(currentEvent.type) }]}
          onPress={handleEventPress}
          activeOpacity={0.8}
        >
          <Animated.View style={[styles.eventContent, { opacity: fadeAnim }]}>
            <View style={styles.eventHeader}>
              <View style={styles.eventIconContainer}>
                <Text style={styles.eventIcon}>{getEventIcon(currentEvent.type)}</Text>
                <Text style={[styles.eventMinute, { color: getEventColor(currentEvent.type) }]}>
                  {currentEvent.minute}'
                </Text>
              </View>

              <View style={styles.eventDetails}>
                <Text style={[styles.eventDescription, { color: theme.colors.text }]}>
                  {currentEvent.description}
                </Text>
                <Text style={[styles.eventType, { color: theme.colors.textSecondary }]}>
                  {currentEvent.type.replace('_', ' ').toUpperCase()}
                </Text>
              </View>

              {currentEvent.rating && (
                <View style={[styles.eventRating, { backgroundColor: getRatingColor(currentEvent.rating) }]}>
                  <Text style={styles.eventRatingText}>{currentEvent.rating.toFixed(1)}</Text>
                </View>
              )}
            </View>

            {/* Event indicators for multiple events */}
            {events.length > 1 && (
              <View style={styles.eventIndicators}>
                {events.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.eventDot,
                      {
                        backgroundColor: index === currentEventIndex
                          ? theme.colors.primary
                          : theme.colors.border,
                      },
                    ]}
                  />
                ))}
                <Text style={[styles.eventCount, { color: theme.colors.textSecondary }]}>
                  {currentEventIndex + 1}/{events.length}
                </Text>
              </View>
            )}
          </Animated.View>
        </TouchableOpacity>
      )}

      {/* Player Status Indicator */}
      <View style={styles.statusContainer}>
        <View
          style={[
            styles.statusIndicator,
            {
              backgroundColor: playerPerformance.isOnField
                ? theme.colors.success
                : theme.colors.error,
            },
          ]}
        />
        <Text style={[styles.statusText, { color: theme.colors.textSecondary }]}>
          {playerPerformance.isOnField ? "On Field" : "Substituted"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    margin: 8,
    borderWidth: 2,
    borderColor: "#FF5722",
  },
  liveHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  matchInfo: {
    flex: 1,
  },
  competition: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  scoreContainer: {
    alignSelf: "flex-start",
  },
  score: {
    fontSize: 20,
    fontWeight: "bold",
  },
  liveStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF5722",
  },
  liveText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  playerSummary: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  playerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  playerImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  playerDetails: {
    gap: 2,
  },
  playerName: {
    fontSize: 16,
    fontWeight: "600",
  },
  minutesPlayed: {
    fontSize: 12,
  },
  performanceStats: {
    alignItems: "center",
    gap: 8,
  },
  ratingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  statIcon: {
    fontSize: 12,
  },
  statValue: {
    fontSize: 12,
    fontWeight: "bold",
  },
  eventContainer: {
    borderLeftWidth: 4,
    backgroundColor: "rgba(255, 107, 53, 0.05)",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  eventContent: {
    gap: 8,
  },
  eventHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  eventIconContainer: {
    alignItems: "center",
    gap: 2,
  },
  eventIcon: {
    fontSize: 20,
  },
  eventMinute: {
    fontSize: 12,
    fontWeight: "bold",
  },
  eventDetails: {
    flex: 1,
    gap: 2,
  },
  eventDescription: {
    fontSize: 14,
    fontWeight: "500",
  },
  eventType: {
    fontSize: 11,
    textTransform: "uppercase",
  },
  eventRating: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  eventRatingText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  eventIndicators: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  eventDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  eventCount: {
    fontSize: 10,
    marginLeft: 4,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    justifyContent: "center",
  },
  statusIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
  },
});
