/**
 * Universal Sports Player Matches Screen Template
 *
 * Comprehensive player matches screen for sports events app covering Soccer, Basketball, and Rugby.
 * Features competition filtering, match history with player performance, ratings, and statistics.
 * Designed to match Chinese app screenshots with full API integration readiness.
 *
 * Usage:
 * <NewsPlayerMatches playerId="player-id" playerData={playerData} />
 *
 * Features:
 * - Competition/League filtering with scrollable tabs
 * - Match history with player performance metrics
 * - Player ratings and statistics per match
 * - Match status indicators (Live, FT, Upcoming)
 * - Goal/assist/card tracking per match
 * - Smart tab management with auto-updates
 * - Universal adaptability for all sports
 *
 * Note: Template adaptable for Soccer, Basketball, Rugby with sport-specific metrics
 */

import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Animated,
} from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { ChevronRight } from "lucide-react-native";
import NewsPlayerLiveMatches from "./news-player-live-matches";

const { width } = Dimensions.get("window");

interface PlayerMatch {
  id: string;
  date: string;
  time: string;
  competition: string;
  competitionShort: string;
  round: string;
  matchday: number;
  homeTeam: string;
  awayTeam: string;
  homeTeamLogo: string;
  awayTeamLogo: string;
  homeScore?: number;
  awayScore?: number;
  matchStatus: "upcoming" | "live" | "FT" | "postponed";
  venue?: string;
  playerPerformance: {
    minutesPlayed: number;
    goals: number;
    assists: number;
    yellowCards: number;
    redCards: number;
    rating: number;
    wasSubstituted: boolean;
    substitutionMinute?: number;
    wasStarting: boolean;
  };
  matchEvents: Array<{
    type: "goal" | "assist" | "yellow_card" | "red_card" | "substitution";
    minute: number;
    description: string;
  }>;
}

interface Competition {
  id: string;
  name: string;
  shortName: string;
  isActive: boolean;
  matchCount: number;
}

interface PlayerMatchesData {
  id: string;
  name: string;
  competitions: Competition[];
  matches: PlayerMatch[];
  currentSeason: string;
}

interface NewsPlayerMatchesProps {
  playerId: string;
  playerData?: PlayerMatchesData;
}

// Mock comprehensive matches data
const mockPlayerMatchesData: PlayerMatchesData = {
  id: "kylian-mbappe",
  name: "Kylian Mbappé",
  competitions: [
    {
      id: "all",
      name: "All Competitions",
      shortName: "All",
      isActive: true,
      matchCount: 28,
    },
    {
      id: "champions-league",
      name: "UEFA Champions League",
      shortName: "UCL",
      isActive: false,
      matchCount: 8,
    },
    {
      id: "la-liga",
      name: "La Liga",
      shortName: "La Liga",
      isActive: false,
      matchCount: 15,
    },
    {
      id: "europa-league",
      name: "UEFA Europa League",
      shortName: "UEL",
      isActive: false,
      matchCount: 0,
    },
    {
      id: "club-friendlies",
      name: "Club Friendlies",
      shortName: "Friendlies",
      isActive: false,
      matchCount: 3,
    },
    {
      id: "world-cup",
      name: "FIFA World Cup",
      shortName: "World Cup",
      isActive: false,
      matchCount: 2,
    },
  ],
  currentSeason: "2024-25",
  matches: [
    {
      id: "match-1",
      date: "25/10/01",
      time: "00:45",
      competition: "UEFA Champions League",
      competitionShort: "UCL",
      round: "Group Stage",
      matchday: 2,
      homeTeam: "Villarreal",
      awayTeam: "Real Madrid",
      homeTeamLogo: "https://logos.footyrenders.com/villarreal.png",
      awayTeamLogo: "https://logos.footyrenders.com/real-madrid.png",
      homeScore: 0,
      awayScore: 5,
      matchStatus: "FT",
      venue: "Estadio de la Cerámica",
      playerPerformance: {
        minutesPlayed: 81,
        goals: 1,
        assists: 0,
        yellowCards: 0,
        redCards: 0,
        rating: 9.3,
        wasSubstituted: true,
        substitutionMinute: 81,
        wasStarting: true,
      },
      matchEvents: [{ type: "goal", minute: 23, description: "Goal scored" }],
    },
    {
      id: "match-2",
      date: "25/09/27",
      time: "22:15",
      competition: "La Liga",
      competitionShort: "La Liga",
      round: "Matchday 7",
      matchday: 7,
      homeTeam: "Atletico Madrid",
      awayTeam: "Real Madrid",
      homeTeamLogo: "https://logos.footyrenders.com/atletico-madrid.png",
      awayTeamLogo: "https://logos.footyrenders.com/real-madrid.png",
      homeScore: 5,
      awayScore: 2,
      matchStatus: "FT",
      playerPerformance: {
        minutesPlayed: 90,
        goals: 0,
        assists: 1,
        yellowCards: 0,
        redCards: 0,
        rating: 7.8,
        wasSubstituted: false,
        wasStarting: true,
      },
      matchEvents: [
        { type: "assist", minute: 45, description: "Assist for goal" },
      ],
    },
    {
      id: "match-3",
      date: "25/09/24",
      time: "03:30",
      competition: "La Liga",
      competitionShort: "La Liga",
      round: "Matchday 6",
      matchday: 6,
      homeTeam: "Levante",
      awayTeam: "Real Madrid",
      homeTeamLogo: "https://logos.footyrenders.com/levante.png",
      awayTeamLogo: "https://logos.footyrenders.com/real-madrid.png",
      homeScore: 1,
      awayScore: 4,
      matchStatus: "FT",
      playerPerformance: {
        minutesPlayed: 82,
        goals: 2,
        assists: 0,
        yellowCards: 0,
        redCards: 0,
        rating: 8.1,
        wasSubstituted: true,
        substitutionMinute: 82,
        wasStarting: true,
      },
      matchEvents: [
        { type: "goal", minute: 34, description: "Goal scored" },
        { type: "goal", minute: 67, description: "Goal scored" },
      ],
    },
    {
      id: "match-4",
      date: "25/09/20",
      time: "22:15",
      competition: "La Liga",
      competitionShort: "La Liga",
      round: "Matchday 5",
      matchday: 5,
      homeTeam: "Real Madrid",
      awayTeam: "Espanyol",
      homeTeamLogo: "https://logos.footyrenders.com/real-madrid.png",
      awayTeamLogo: "https://logos.footyrenders.com/espanyol.png",
      homeScore: 2,
      awayScore: 0,
      matchStatus: "FT",
      playerPerformance: {
        minutesPlayed: 89,
        goals: 1,
        assists: 1,
        yellowCards: 0,
        redCards: 0,
        rating: 7.4,
        wasSubstituted: true,
        substitutionMinute: 89,
        wasStarting: true,
      },
      matchEvents: [
        { type: "goal", minute: 67, description: "Goal scored" },
        { type: "assist", minute: 23, description: "Assist for goal" },
      ],
    },
    {
      id: "match-5",
      date: "25/09/17",
      time: "03:00",
      competition: "UEFA Champions League",
      competitionShort: "UCL",
      round: "Group Stage",
      matchday: 1,
      homeTeam: "Real Madrid",
      awayTeam: "Marseille",
      homeTeamLogo: "https://logos.footyrenders.com/real-madrid.png",
      awayTeamLogo: "https://logos.footyrenders.com/marseille.png",
      homeScore: 2,
      awayScore: 1,
      matchStatus: "FT",
      playerPerformance: {
        minutesPlayed: 90,
        goals: 1,
        assists: 1,
        yellowCards: 0,
        redCards: 0,
        rating: 8.5,
        wasSubstituted: false,
        wasStarting: true,
      },
      matchEvents: [
        { type: "goal", minute: 23, description: "Goal scored" },
        { type: "assist", minute: 78, description: "Assist for goal" },
      ],
    },
    {
      id: "match-6",
      date: "25/09/13",
      time: "22:15",
      competition: "La Liga",
      competitionShort: "La Liga",
      round: "Matchday 4",
      matchday: 4,
      homeTeam: "Real Sociedad",
      awayTeam: "Real Madrid",
      homeTeamLogo: "https://logos.footyrenders.com/real-sociedad.png",
      awayTeamLogo: "https://logos.footyrenders.com/real-madrid.png",
      homeScore: 1,
      awayScore: 2,
      matchStatus: "FT",
      playerPerformance: {
        minutesPlayed: 90,
        goals: 2,
        assists: 0,
        yellowCards: 0,
        redCards: 0,
        rating: 9.0,
        wasSubstituted: false,
        wasStarting: true,
      },
      matchEvents: [
        { type: "goal", minute: 45, description: "Goal scored" },
        { type: "goal", minute: 78, description: "Goal scored" },
      ],
    },
  ],
};

export default function NewsPlayerMatches({
  playerId,
  playerData: propPlayerData,
}: NewsPlayerMatchesProps) {
  const theme = useTheme();
  const [selectedCompetition, setSelectedCompetition] = useState<string>("all");
  const tabScrollRef = useRef<ScrollView>(null);
  const [tabScrollOffset, setTabScrollOffset] = useState(0);

  // Use provided data or fallback to mock data
  const playerData = propPlayerData || mockPlayerMatchesData;

  // Check for live matches
  const liveMatches = playerData.matches.filter(
    (match) => match.matchStatus === "live",
  );
  const hasLiveMatch = liveMatches.length > 0;

  // Filter matches based on selected competition
  const filteredMatches =
    selectedCompetition === "all"
      ? playerData.matches
      : playerData.matches.filter(
          (match) =>
            match.competition
              .toLowerCase()
              .includes(selectedCompetition.replace("-", " ")) ||
            match.competitionShort.toLowerCase() ===
              selectedCompetition.toLowerCase(),
        );

  // Update competition match counts (in real app, this would come from API)
  useEffect(() => {
    // This would typically trigger an API call to update competition data
    // when player participates in new matches
    console.log(`Updating competition data for player: ${playerId}`);
  }, [playerId]);

  const handleCompetitionSelect = (competitionId: string) => {
    setSelectedCompetition(competitionId);
  };

  const getRatingColor = (rating: number): string => {
    if (rating >= 9.0) return "#4CAF50"; // Green - Excellent
    if (rating >= 8.0) return "#FF9800"; // Orange - Very Good
    if (rating >= 7.0) return "#FFC107"; // Yellow - Good
    if (rating >= 6.0) return "#9C27B0"; // Purple - Average
    return "#F44336"; // Red - Poor
  };

  const getMatchStatusColor = (status: string): string => {
    switch (status) {
      case "live":
        return theme.colors.error;
      case "FT":
        return theme.colors.success;
      case "postponed":
        return theme.colors.warning;
      default:
        return theme.colors.textSecondary;
    }
  };

  const formatPlayerStats = (
    performance: PlayerMatch["playerPerformance"],
  ): string => {
    const events = [];
    if (performance.goals > 0) events.push(`⚽${performance.goals}`);
    if (performance.assists > 0) events.push(`🅰️${performance.assists}`);
    if (performance.yellowCards > 0)
      events.push(`🟨${performance.yellowCards}`);
    if (performance.redCards > 0) events.push(`🟥${performance.redCards}`);
    return events.join(" ");
  };

  const renderCompetitionTabs = () => (
    <View style={styles.tabContainer}>
      <ScrollView
        ref={tabScrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabScrollView}
        contentContainerStyle={styles.tabContent}
        onScroll={(event) =>
          setTabScrollOffset(event.nativeEvent.contentOffset.x)
        }
        scrollEventThrottle={16}
      >
        {playerData.competitions.map((competition) => (
          <TouchableOpacity
            key={competition.id}
            style={[
              styles.tab,
              {
                backgroundColor:
                  selectedCompetition === competition.id
                    ? theme.colors.primary
                    : "transparent",
                borderColor:
                  selectedCompetition === competition.id
                    ? theme.colors.primary
                    : theme.colors.border,
              },
            ]}
            onPress={() => handleCompetitionSelect(competition.id)}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color:
                    selectedCompetition === competition.id
                      ? "white"
                      : theme.colors.text,
                },
              ]}
            >
              {competition.shortName}
            </Text>
            {competition.matchCount > 0 && (
              <View
                style={[
                  styles.matchCountBadge,
                  {
                    backgroundColor:
                      selectedCompetition === competition.id
                        ? "rgba(255,255,255,0.3)"
                        : theme.colors.primary,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.matchCountText,
                    {
                      color:
                        selectedCompetition === competition.id
                          ? "white"
                          : "white",
                    },
                  ]}
                >
                  {competition.matchCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Tab scroll indicator */}
      <View style={styles.scrollIndicator}>
        <ChevronRight size={16} color={theme.colors.textSecondary} />
      </View>
    </View>
  );

  const renderMatchItem = (match: PlayerMatch) => {
    const isHome = match.homeTeam.includes("Real Madrid"); // In real app, check against player's team
    const playerTeam = isHome ? match.homeTeam : match.awayTeam;
    const opponentTeam = isHome ? match.awayTeam : match.homeTeam;
    const playerTeamLogo = isHome ? match.homeTeamLogo : match.awayTeamLogo;
    const opponentTeamLogo = isHome ? match.awayTeamLogo : match.homeTeamLogo;
    const playerTeamScore = isHome ? match.homeScore : match.awayScore;
    const opponentTeamScore = isHome ? match.awayScore : match.homeScore;

    // Show live component for live matches
    if (match.matchStatus === "live") {
      const liveMatchData = {
        id: match.id,
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        homeScore: match.homeScore || 0,
        awayScore: match.awayScore || 0,
        homeTeamLogo: match.homeTeamLogo,
        awayTeamLogo: match.awayTeamLogo,
        matchStatus: "Live" as const,
        currentMinute: 75, // This would come from live API
        competition: match.competition,
        playerPerformance: {
          playerId: playerId,
          playerName: playerData.name,
          playerImage:
            "https://api.dicebear.com/7.x/avataaars/svg?seed=" +
            encodeURIComponent(playerData.name),
          teamSide: isHome ? ("home" as const) : ("away" as const),
          currentRating: match.playerPerformance.rating,
          minutesPlayed: match.playerPerformance.minutesPlayed,
          goals: match.playerPerformance.goals,
          assists: match.playerPerformance.assists,
          yellowCards: match.playerPerformance.yellowCards,
          redCards: match.playerPerformance.redCards,
          isOnField: !match.playerPerformance.wasSubstituted,
          events: match.matchEvents.map((event) => ({
            id: `${match.id}-${event.minute}`,
            minute: event.minute,
            type: event.type,
            playerName: playerData.name,
            description: event.description,
            rating: match.playerPerformance.rating,
            teamSide: isHome ? ("home" as const) : ("away" as const),
          })),
        },
      };

      return (
        <NewsPlayerLiveMatches
          key={match.id}
          playerId={playerId}
          liveMatchData={liveMatchData}
        />
      );
    }

    return (
      <View
        key={match.id}
        style={[
          styles.matchItem,
          { backgroundColor: theme.colors.backgroundSecondary },
        ]}
      >
        <View style={styles.matchHeader}>
          <Text style={[styles.matchCompetition, { color: theme.colors.text }]}>
            {match.competitionShort} {match.round}
          </Text>
          <View
            style={[
              styles.ratingBadge,
              {
                backgroundColor: getRatingColor(match.playerPerformance.rating),
              },
            ]}
          >
            <Text style={styles.ratingText}>
              {match.playerPerformance.rating.toFixed(1)}
            </Text>
          </View>
        </View>

        <View style={styles.matchDateTime}>
          <Text
            style={[styles.matchDate, { color: theme.colors.textSecondary }]}
          >
            {match.date}
          </Text>
          <Text
            style={[styles.matchTime, { color: theme.colors.textSecondary }]}
          >
            {match.time}
          </Text>
        </View>

        <View style={styles.matchContent}>
          <View style={styles.matchTeams}>
            <View style={styles.team}>
              <Image
                source={{ uri: opponentTeamLogo }}
                style={styles.teamLogo}
              />
              <Text
                style={[styles.teamName, { color: theme.colors.text }]}
                numberOfLines={1}
              >
                {opponentTeam}
              </Text>
            </View>

            <View style={styles.scoreContainer}>
              <Text style={[styles.score, { color: theme.colors.text }]}>
                {opponentTeamScore !== undefined ? opponentTeamScore : "-"}
              </Text>
              <Text style={[styles.score, { color: theme.colors.text }]}>
                {playerTeamScore !== undefined ? playerTeamScore : "-"}
              </Text>
            </View>

            <View style={styles.team}>
              <Image source={{ uri: playerTeamLogo }} style={styles.teamLogo} />
              <Text
                style={[styles.teamName, { color: theme.colors.text }]}
                numberOfLines={1}
              >
                {playerTeam}
              </Text>
            </View>
          </View>

          {/* Player Performance */}
          <View style={styles.playerStats}>
            <View style={styles.playerStatsLeft}>
              {match.playerPerformance.goals > 0 && (
                <View style={styles.statIndicator}>
                  <Text style={styles.statIcon}>⚽</Text>
                  <Text
                    style={[styles.statText, { color: theme.colors.success }]}
                  >
                    {match.playerPerformance.goals}
                  </Text>
                </View>
              )}
              {match.playerPerformance.assists > 0 && (
                <View style={styles.statIndicator}>
                  <Text style={styles.statIcon}>🅰️</Text>
                  <Text
                    style={[styles.statText, { color: theme.colors.primary }]}
                  >
                    {match.playerPerformance.assists}
                  </Text>
                </View>
              )}
              {match.playerPerformance.yellowCards > 0 && (
                <View style={styles.statIndicator}>
                  <Text style={styles.statIcon}>🟨</Text>
                  <Text
                    style={[styles.statText, { color: theme.colors.warning }]}
                  >
                    {match.playerPerformance.yellowCards}
                  </Text>
                </View>
              )}
              {match.playerPerformance.redCards > 0 && (
                <View style={styles.statIndicator}>
                  <Text style={styles.statIcon}>🟥</Text>
                  <Text
                    style={[styles.statText, { color: theme.colors.error }]}
                  >
                    {match.playerPerformance.redCards}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.playerStatsRight}>
              <Text
                style={[
                  styles.matchStatus,
                  { color: getMatchStatusColor(match.matchStatus) },
                ]}
              >
                {match.matchStatus === "FT" ? "Full Time" : match.matchStatus}
              </Text>
              <Text
                style={[
                  styles.minutesPlayed,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {match.playerPerformance.minutesPlayed}'
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {renderCompetitionTabs()}

      <ScrollView
        style={styles.matchesList}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.matchesContent}
      >
        {hasLiveMatch && (
          <View style={styles.liveMatchesSection}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Live Matches
            </Text>
          </View>
        )}
        {filteredMatches.map(renderMatchItem)}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  tabScrollView: {
    flex: 1,
  },
  tabContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
    gap: 6,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
  },
  matchCountBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  matchCountText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  scrollIndicator: {
    paddingHorizontal: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  matchesList: {
    flex: 1,
  },
  matchesContent: {
    padding: 16,
    gap: 12,
  },
  matchItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 4,
  },
  matchHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  matchCompetition: {
    fontSize: 14,
    fontWeight: "600",
  },
  ratingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  matchDateTime: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  matchDate: {
    fontSize: 12,
  },
  matchTime: {
    fontSize: 12,
  },
  matchContent: {
    gap: 12,
  },
  matchTeams: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  team: {
    flex: 1,
    alignItems: "center",
    gap: 8,
  },
  teamLogo: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  teamName: {
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
  },
  scoreContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
  },
  score: {
    fontSize: 24,
    fontWeight: "bold",
    minWidth: 24,
    textAlign: "center",
  },
  playerStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
  },
  playerStatsLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  statIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  statIcon: {
    fontSize: 12,
  },
  statText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  playerStatsRight: {
    alignItems: "flex-end",
    gap: 2,
  },
  matchStatus: {
    fontSize: 12,
    fontWeight: "500",
  },
  minutesPlayed: {
    fontSize: 11,
  },
  liveMatchesSection: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
});
