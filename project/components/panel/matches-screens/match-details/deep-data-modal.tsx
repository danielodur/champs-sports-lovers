import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  ActivityIndicator,
  Image,
} from "react-native";
import { X, TrendingUp, Users, Target, ArrowRight } from "lucide-react-native";
import { useTheme } from "@/hooks/useTheme";
import deepDataApiService, {
  TeamStatistics,
  PlayerStatistic,
  MatchEvent,
  DeepMatchData,
} from "@/services/deepDataApiService";
import StatsDisplay from "./stats-display";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

interface DeepDataModalProps {
  visible: boolean;
  onClose: () => void;
  matchId: string;
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName: string;
  awayTeamName: string;
  homeTeamLogo: string;
  awayTeamLogo: string;
  sport?: string; // ✅ Add sport parameter
}

const CircularProgress: React.FC<{
  size: number;
  strokeWidth: number;
  progress: number;
  color: string;
  backgroundColor?: string;
  children?: React.ReactNode;
}> = ({
  size,
  strokeWidth,
  progress,
  color,
  backgroundColor = "#333",
  children,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progressValue = Math.min(100, Math.max(0, progress));

  return (
    <View style={{ width: size, height: size, position: "relative" }}>
      {/* Background circle */}
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: backgroundColor,
          position: "absolute",
        }}
      />
      {/* Progress circle - simplified implementation */}
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: "transparent",
          borderTopColor: color,
          borderRightColor: progressValue > 25 ? color : "transparent",
          borderBottomColor: progressValue > 50 ? color : "transparent",
          borderLeftColor: progressValue > 75 ? color : "transparent",
          position: "absolute",
          transform: [{ rotate: "-90deg" }],
        }}
      />
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {children}
      </View>
    </View>
  );
};

const ComparisonBar: React.FC<{
  leftValue: number;
  rightValue: number;
  leftLabel: string;
  rightLabel: string;
  label: string;
  showPercentage?: boolean;
}> = ({
  leftValue,
  rightValue,
  leftLabel,
  rightLabel,
  label,
  showPercentage = false,
}) => {
  const theme = useTheme();
  const total = leftValue + rightValue;
  const leftPercentage = total > 0 ? (leftValue / total) * 100 : 0;
  const rightPercentage = total > 0 ? (rightValue / total) * 100 : 0;

  return (
    <View
      style={[
        styles.comparisonBarContainer,
        { borderBottomColor: theme.colors.border },
      ]}
    >
      <View style={styles.comparisonBarHeader}>
        <Text style={[styles.comparisonValue, { color: theme.colors.text }]}>
          {showPercentage ? `${leftValue}%` : leftValue}
        </Text>
        <Text style={[styles.comparisonLabel, { color: theme.colors.text }]}>
          {label}
        </Text>
        <Text style={[styles.comparisonValue, { color: theme.colors.text }]}>
          {showPercentage ? `${rightValue}%` : rightValue}
        </Text>
      </View>
      <View style={styles.comparisonBarTrack}>
        <View
          style={[
            styles.comparisonBarLeft,
            {
              width: `${leftPercentage}%`,
              backgroundColor: "#FF9500",
            },
          ]}
        />
        <View
          style={[
            styles.comparisonBarRight,
            {
              width: `${rightPercentage}%`,
              backgroundColor: "#666",
            },
          ]}
        />
      </View>
    </View>
  );
};

export default function MatchDetailsDeepDataModal({
  visible,
  onClose,
  matchId,
  homeTeamId,
  awayTeamId,
  homeTeamName,
  awayTeamName,
  homeTeamLogo,
  awayTeamLogo,
  sport = "football", // ✅ Default to football
}: DeepDataModalProps) {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState<"teams" | "players">("teams");
  const [timePeriod, setTimePeriod] = useState<"full" | "first" | "second">(
    "full",
  );
  const [loading, setLoading] = useState(true);
  const [homeTeamStats, setHomeTeamStats] = useState<TeamStatistics | null>(
    null,
  );
  const [awayTeamStats, setAwayTeamStats] = useState<TeamStatistics | null>(
    null,
  );
  const [homePlayers, setHomePlayers] = useState<PlayerStatistic[]>([]);
  const [awayPlayers, setAwayPlayers] = useState<PlayerStatistic[]>([]);
  const [matchEvents, setMatchEvents] = useState<MatchEvent[]>([]);

  useEffect(() => {
    if (visible) {
      fetchMatchData();
    }
  }, [visible, matchId, timePeriod]);

  const fetchMatchData = async () => {
    setLoading(true);
    try {
      const matchData = await deepDataApiService.fetchCompleteMatchData(
        matchId,
        timePeriod,
      );

      setHomeTeamStats(matchData.homeTeamStats);
      setAwayTeamStats(matchData.awayTeamStats);
      setHomePlayers(matchData.homePlayers);
      setAwayPlayers(matchData.awayPlayers);
      setMatchEvents(matchData.events);
    } catch (error) {
      console.error("Error fetching match data:", error);
      // Fallback to mock data
      await fetchMockData();
    } finally {
      setLoading(false);
    }
  };

  const fetchMockData = async () => {
    // Fallback mock data generation
    const homeStats: TeamStatistics = {
      attacks: Math.floor(Math.random() * 40) + 30,
      dangerousAttacks: Math.floor(Math.random() * 20) + 10,
      possession: Math.floor(Math.random() * 30) + 35,
      shotsOnTarget: Math.floor(Math.random() * 8) + 2,
      shotsOffTarget: Math.floor(Math.random() * 10) + 3,
      passes: Math.floor(Math.random() * 200) + 300,
      passAccuracy: Math.floor(Math.random() * 20) + 70,
      keyPasses: Math.floor(Math.random() * 10) + 3,
      longPasses: Math.floor(Math.random() * 30) + 20,
      longPassAccuracy: Math.floor(Math.random() * 30) + 40,
      dribbles: Math.floor(Math.random() * 10) + 5,
      dribbleSuccess: Math.floor(Math.random() * 40) + 40,
      ballsLost: Math.floor(Math.random() * 15) + 10,
      oneOnOneSuccess: Math.floor(Math.random() * 5) + 1,
      clearances: Math.floor(Math.random() * 10) + 5,
      shots: Math.floor(Math.random() * 15) + 8,
      corners: Math.floor(Math.random() * 8) + 2,
      tackles: Math.floor(Math.random() * 15) + 10,
      fouls: Math.floor(Math.random() * 10) + 5,
      yellowCards: Math.floor(Math.random() * 3),
      redCards: Math.floor(Math.random() * 2),
    };

    const awayStats: TeamStatistics = {
      attacks: Math.floor(Math.random() * 40) + 30,
      dangerousAttacks: Math.floor(Math.random() * 20) + 10,
      possession: 100 - homeStats.possession,
      shotsOnTarget: Math.floor(Math.random() * 8) + 2,
      shotsOffTarget: Math.floor(Math.random() * 10) + 3,
      passes: Math.floor(Math.random() * 200) + 300,
      passAccuracy: Math.floor(Math.random() * 20) + 70,
      keyPasses: Math.floor(Math.random() * 10) + 3,
      longPasses: Math.floor(Math.random() * 30) + 20,
      longPassAccuracy: Math.floor(Math.random() * 30) + 40,
      dribbles: Math.floor(Math.random() * 10) + 5,
      dribbleSuccess: Math.floor(Math.random() * 40) + 40,
      ballsLost: Math.floor(Math.random() * 15) + 10,
      oneOnOneSuccess: Math.floor(Math.random() * 5) + 1,
      clearances: Math.floor(Math.random() * 10) + 5,
      shots: Math.floor(Math.random() * 15) + 8,
      corners: Math.floor(Math.random() * 8) + 2,
      tackles: Math.floor(Math.random() * 15) + 10,
      fouls: Math.floor(Math.random() * 10) + 5,
      yellowCards: Math.floor(Math.random() * 3),
      redCards: Math.floor(Math.random() * 2),
    };

    const generatePlayers = (teamName: string): PlayerStatistic[] => {
      const positions = ["GK", "DEF", "MID", "FWD"];
      const players: PlayerStatistic[] = [];

      for (let i = 0; i < 11; i++) {
        players.push({
          id: `${teamName}_${i}`,
          name: `Player ${i + 1}`,
          position: positions[Math.floor(Math.random() * positions.length)],
          photo: `https://images.unsplash.com/photo-157094718${i}-63b2ee4b7c89?w=100&h=100&fit=crop&crop=face`,
          rating: Math.floor(Math.random() * 40) + 60,
          goals: Math.floor(Math.random() * 3),
          assists: Math.floor(Math.random() * 2),
          shots: Math.floor(Math.random() * 5),
          passes: Math.floor(Math.random() * 50) + 20,
          passAccuracy: Math.floor(Math.random() * 30) + 70,
          tackles: Math.floor(Math.random() * 8),
          fouls: Math.floor(Math.random() * 4),
          yellowCards: Math.floor(Math.random() * 2),
          redCards: 0,
          minutesPlayed: 90,
        });
      }
      return players;
    };

    const mockEvents: MatchEvent[] = [
      {
        id: "1",
        time: 15,
        type: "goal",
        team: "away",
        player: "Player 9",
        description: "Goal - Player 9",
      },
      {
        id: "2",
        time: 23,
        type: "yellow_card",
        team: "home",
        player: "Player 4",
        description: "Yellow Card - Player 4",
      },
      {
        id: "3",
        time: 31,
        type: "corner",
        team: "home",
        player: "Player 7",
        description: "Corner - Player 7",
      },
    ];

    setHomeTeamStats(homeStats);
    setAwayTeamStats(awayStats);
    setHomePlayers(generatePlayers("home"));
    setAwayPlayers(generatePlayers("away"));
    setMatchEvents(mockEvents);
  };

  const renderCircularStats = () => {
    if (!homeTeamStats || !awayTeamStats) return null;

    return (
      <View style={styles.circularStatsContainer}>
        <View style={styles.circularStatItem}>
          <View style={styles.circularStatTeam}>
            <Text
              style={[styles.circularStatValue, { color: theme.colors.text }]}
            >
              {homeTeamStats.attacks}
            </Text>
            <CircularProgress
              size={60}
              strokeWidth={4}
              progress={
                (homeTeamStats.attacks /
                  (homeTeamStats.attacks + awayTeamStats.attacks)) *
                100
              }
              color="#FF9500"
            />
          </View>
          <View style={styles.circularStatCenter}>
            <Text
              style={[styles.circularStatLabel, { color: theme.colors.text }]}
            >
              Attacks
            </Text>
          </View>
          <View style={styles.circularStatTeam}>
            <Text
              style={[styles.circularStatValue, { color: theme.colors.text }]}
            >
              {awayTeamStats.attacks}
            </Text>
            <CircularProgress
              size={60}
              strokeWidth={4}
              progress={
                (awayTeamStats.attacks /
                  (homeTeamStats.attacks + awayTeamStats.attacks)) *
                100
              }
              color="#666"
            />
          </View>
        </View>

        <View style={styles.circularStatItem}>
          <View style={styles.circularStatTeam}>
            <Text
              style={[styles.circularStatValue, { color: theme.colors.text }]}
            >
              {homeTeamStats.dangerousAttacks}
            </Text>
            <CircularProgress
              size={60}
              strokeWidth={4}
              progress={
                (homeTeamStats.dangerousAttacks /
                  (homeTeamStats.dangerousAttacks +
                    awayTeamStats.dangerousAttacks)) *
                100
              }
              color="#FF9500"
            />
          </View>
          <View style={styles.circularStatCenter}>
            <Text
              style={[styles.circularStatLabel, { color: theme.colors.text }]}
            >
              Dangerous Attacks
            </Text>
          </View>
          <View style={styles.circularStatTeam}>
            <Text
              style={[styles.circularStatValue, { color: theme.colors.text }]}
            >
              {awayTeamStats.dangerousAttacks}
            </Text>
            <CircularProgress
              size={60}
              strokeWidth={4}
              progress={
                (awayTeamStats.dangerousAttacks /
                  (homeTeamStats.dangerousAttacks +
                    awayTeamStats.dangerousAttacks)) *
                100
              }
              color="#666"
            />
          </View>
        </View>

        <View style={styles.circularStatItem}>
          <View style={styles.circularStatTeam}>
            <Text
              style={[styles.circularStatValue, { color: theme.colors.text }]}
            >
              {homeTeamStats.possession}
            </Text>
            <CircularProgress
              size={60}
              strokeWidth={4}
              progress={homeTeamStats.possession}
              color="#FF9500"
            />
          </View>
          <View style={styles.circularStatCenter}>
            <Text
              style={[styles.circularStatLabel, { color: theme.colors.text }]}
            >
              Possession
            </Text>
          </View>
          <View style={styles.circularStatTeam}>
            <Text
              style={[styles.circularStatValue, { color: theme.colors.text }]}
            >
              {awayTeamStats.possession}
            </Text>
            <CircularProgress
              size={60}
              strokeWidth={4}
              progress={awayTeamStats.possession}
              color="#666"
            />
          </View>
        </View>
      </View>
    );
  };

  const renderShootingStats = () => {
    if (!homeTeamStats || !awayTeamStats) return null;

    return (
      <View style={styles.shootingStatsContainer}>
        <View style={styles.shootingStatRow}>
          <View style={styles.shootingStatTeam}>
            <View style={styles.cardIndicators}>
              <View style={[styles.cardIndicator, styles.cornerCard]} />
              <View style={[styles.cardIndicator, styles.yellowCard]} />
              <View style={[styles.cardIndicator, styles.redCard]} />
            </View>
            <Text
              style={[styles.shootingStatValue, { color: theme.colors.text }]}
            >
              {homeTeamStats.shotsOnTarget}
            </Text>
          </View>
          <View style={styles.shootingStatCenter}>
            <Text
              style={[styles.shootingStatLabel, { color: theme.colors.text }]}
            >
              Shots On Target
            </Text>
          </View>
          <View style={styles.shootingStatTeam}>
            <Text
              style={[styles.shootingStatValue, { color: theme.colors.text }]}
            >
              {awayTeamStats.shotsOnTarget}
            </Text>
            <View style={styles.cardIndicators}>
              <View style={[styles.cardIndicator, styles.cornerCard]} />
              <View style={[styles.cardIndicator, styles.yellowCard]} />
              <View style={[styles.cardIndicator, styles.redCard]} />
            </View>
          </View>
        </View>

        <View style={styles.shootingStatRow}>
          <View style={styles.shootingStatTeam}>
            <View style={styles.shootingNumbers}>
              <Text
                style={[styles.shootingNumber, { color: theme.colors.text }]}
              >
                {homeTeamStats.shotsOffTarget}
              </Text>
              <Text
                style={[styles.shootingNumber, { color: theme.colors.text }]}
              >
                0
              </Text>
              <Text
                style={[styles.shootingNumber, { color: theme.colors.text }]}
              >
                0
              </Text>
              <Text
                style={[styles.shootingNumber, { color: theme.colors.text }]}
              >
                {homeTeamStats.yellowCards}
              </Text>
            </View>
          </View>
          <View style={styles.shootingStatCenter}>
            <Text
              style={[styles.shootingStatLabel, { color: theme.colors.text }]}
            >
              Shots Off Target
            </Text>
          </View>
          <View style={styles.shootingStatTeam}>
            <View style={styles.shootingNumbers}>
              <Text
                style={[styles.shootingNumber, { color: theme.colors.text }]}
              >
                {awayTeamStats.shotsOffTarget}
              </Text>
              <Text
                style={[styles.shootingNumber, { color: theme.colors.text }]}
              >
                0
              </Text>
              <Text
                style={[styles.shootingNumber, { color: theme.colors.text }]}
              >
                0
              </Text>
              <Text
                style={[styles.shootingNumber, { color: theme.colors.text }]}
              >
                {awayTeamStats.yellowCards}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderComparisonStats = () => {
    if (!homeTeamStats || !awayTeamStats) return null;

    return (
      <View style={styles.comparisonStatsContainer}>
        <ComparisonBar
          leftValue={homeTeamStats.passes}
          rightValue={awayTeamStats.passes}
          leftLabel={homeTeamName}
          rightLabel={awayTeamName}
          label="Passes"
        />
        <ComparisonBar
          leftValue={homeTeamStats.passAccuracy}
          rightValue={awayTeamStats.passAccuracy}
          leftLabel={homeTeamName}
          rightLabel={awayTeamName}
          label="Pass Success Rate %"
          showPercentage
        />
        <ComparisonBar
          leftValue={homeTeamStats.keyPasses}
          rightValue={awayTeamStats.keyPasses}
          leftLabel={homeTeamName}
          rightLabel={awayTeamName}
          label="Key Passes"
        />
        <ComparisonBar
          leftValue={homeTeamStats.longPasses}
          rightValue={awayTeamStats.longPasses}
          leftLabel={homeTeamName}
          rightLabel={awayTeamName}
          label="Long Passes"
        />
        <ComparisonBar
          leftValue={homeTeamStats.longPassAccuracy}
          rightValue={awayTeamStats.longPassAccuracy}
          leftLabel={homeTeamName}
          rightLabel={awayTeamName}
          label="Long Pass Success Rate %"
          showPercentage
        />
        <ComparisonBar
          leftValue={homeTeamStats.dribbles}
          rightValue={awayTeamStats.dribbles}
          leftLabel={homeTeamName}
          rightLabel={awayTeamName}
          label="Dribbles"
        />
        <ComparisonBar
          leftValue={homeTeamStats.dribbleSuccess}
          rightValue={awayTeamStats.dribbleSuccess}
          leftLabel={homeTeamName}
          rightLabel={awayTeamName}
          label="Dribble Success Rate %"
          showPercentage
        />
        <ComparisonBar
          leftValue={homeTeamStats.ballsLost}
          rightValue={awayTeamStats.ballsLost}
          leftLabel={homeTeamName}
          rightLabel={awayTeamName}
          label="Balls Lost"
        />
        <ComparisonBar
          leftValue={homeTeamStats.oneOnOneSuccess}
          rightValue={awayTeamStats.oneOnOneSuccess}
          leftLabel={homeTeamName}
          rightLabel={awayTeamName}
          label="1v1 Success"
        />
        <ComparisonBar
          leftValue={homeTeamStats.clearances}
          rightValue={awayTeamStats.clearances}
          leftLabel={homeTeamName}
          rightLabel={awayTeamName}
          label="Clearances"
        />
      </View>
    );
  };

  const renderPlayersTab = () => {
    const players =
      activeTab === "teams" ? [] : [...homePlayers, ...awayPlayers];

    return (
      <ScrollView style={styles.playersContainer}>
        <View style={styles.playersGrid}>
          {players.map((player) => (
            <View
              key={player.id}
              style={[
                styles.playerCard,
                { backgroundColor: theme.colors.backgroundSecondary },
              ]}
            >
              <Image
                source={{ uri: player.photo }}
                style={styles.playerPhoto}
              />
              <Text style={[styles.playerName, { color: theme.colors.text }]}>
                {player.name}
              </Text>
              <Text
                style={[
                  styles.playerPosition,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {player.position}
              </Text>
              <View style={styles.playerStats}>
                <Text style={[styles.playerRating, { color: "#FF9500" }]}>
                  {player.rating}
                </Text>
                <Text
                  style={[
                    styles.playerStatText,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  G: {player.goals} A: {player.assists}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        {/* Header */}
        <View
          style={[styles.header, { borderBottomColor: theme.colors.border }]}
        >
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            Deep Data
          </Text>
          <View style={styles.headerRight} />
        </View>

        {/* Team Headers */}
        <View
          style={[
            styles.teamHeaders,
            { borderBottomColor: theme.colors.border },
          ]}
        >
          <View style={styles.teamHeader}>
            <Image source={{ uri: homeTeamLogo }} style={styles.teamLogo} />
            <Text style={[styles.teamName, { color: theme.colors.text }]}>
              {homeTeamName}
            </Text>
          </View>
          <Text style={[styles.vs, { color: theme.colors.textSecondary }]}>
            vs
          </Text>
          <View style={styles.teamHeader}>
            <Text style={[styles.teamName, { color: theme.colors.text }]}>
              {awayTeamName}
            </Text>
            <Image source={{ uri: awayTeamLogo }} style={styles.teamLogo} />
          </View>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabNavigation}>
          <TouchableOpacity
            onPress={() => setActiveTab("teams")}
            style={[
              styles.tabButton,
              activeTab === "teams" && styles.activeTab,
              {
                borderBottomColor:
                  activeTab === "teams" ? "#FF9500" : "transparent",
              },
            ]}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color:
                    activeTab === "teams"
                      ? "#FF9500"
                      : theme.colors.textSecondary,
                },
              ]}
            >
              Teams
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab("players")}
            style={[
              styles.tabButton,
              activeTab === "players" && styles.activeTab,
              {
                borderBottomColor:
                  activeTab === "players" ? "#FF9500" : "transparent",
              },
            ]}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color:
                    activeTab === "players"
                      ? "#FF9500"
                      : theme.colors.textSecondary,
                },
              ]}
            >
              Players
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === "teams" && (
          <>
            {/* Time Period Filter */}
            <View style={styles.timePeriodFilter}>
              <TouchableOpacity
                onPress={() => setTimePeriod("full")}
                style={[
                  styles.timePeriodButton,
                  timePeriod === "full" && styles.activeTimePeriod,
                  {
                    backgroundColor:
                      timePeriod === "full"
                        ? "#FF9500"
                        : theme.colors.backgroundSecondary,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.timePeriodText,
                    {
                      color: timePeriod === "full" ? "#fff" : theme.colors.text,
                    },
                  ]}
                >
                  Full Match
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setTimePeriod("first")}
                style={[
                  styles.timePeriodButton,
                  timePeriod === "first" && styles.activeTimePeriod,
                  {
                    backgroundColor:
                      timePeriod === "first"
                        ? "#FF9500"
                        : theme.colors.backgroundSecondary,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.timePeriodText,
                    {
                      color:
                        timePeriod === "first" ? "#fff" : theme.colors.text,
                    },
                  ]}
                >
                  1st Half
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setTimePeriod("second")}
                style={[
                  styles.timePeriodButton,
                  timePeriod === "second" && styles.activeTimePeriod,
                  {
                    backgroundColor:
                      timePeriod === "second"
                        ? "#FF9500"
                        : theme.colors.backgroundSecondary,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.timePeriodText,
                    {
                      color:
                        timePeriod === "second" ? "#fff" : theme.colors.text,
                    },
                  ]}
                >
                  2nd Half
                </Text>
              </TouchableOpacity>
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FF9500" />
                <Text
                  style={[styles.loadingText, { color: theme.colors.text }]}
                >
                  Loading match data...
                </Text>
              </View>
            ) : (
              <ScrollView style={styles.content}>
                {/* Key Statistics and Additional Statistics Sections */}
                {homeTeamStats && awayTeamStats && (
                  <StatsDisplay
                    sport={sport}
                    homeTeamName={homeTeamName}
                    awayTeamName={awayTeamName}
                    homeTeamLogo={homeTeamLogo}
                    awayTeamLogo={awayTeamLogo}
                    homeStats={{
                      possession: homeTeamStats.possession,
                      attacks: homeTeamStats.attacks,
                      dangerousAttacks: homeTeamStats.dangerousAttacks,
                      shots: homeTeamStats.shots || (homeTeamStats.shotsOnTarget + homeTeamStats.shotsOffTarget),
                      shotsOnTarget: homeTeamStats.shotsOnTarget,
                      shotsOffTarget: homeTeamStats.shotsOffTarget,
                      corners: homeTeamStats.corners,
                      fouls: homeTeamStats.fouls,
                      yellowCards: homeTeamStats.yellowCards,
                      redCards: homeTeamStats.redCards,
                      offsides: 0, // Not available in TeamStatistics
                      passes: homeTeamStats.passes,
                      passAccuracy: homeTeamStats.passAccuracy,
                      keyPasses: homeTeamStats.keyPasses,
                      longPasses: homeTeamStats.longPasses,
                      longPassAccuracy: homeTeamStats.longPassAccuracy,
                      dribbles: homeTeamStats.dribbles,
                      dribbleSuccess: homeTeamStats.dribbleSuccess,
                      ballsLost: homeTeamStats.ballsLost,
                      oneOnOneSuccess: homeTeamStats.oneOnOneSuccess,
                      clearances: homeTeamStats.clearances,
                      tackles: homeTeamStats.tackles,
                    }}
                    awayStats={{
                      possession: awayTeamStats.possession,
                      attacks: awayTeamStats.attacks,
                      dangerousAttacks: awayTeamStats.dangerousAttacks,
                      shots: awayTeamStats.shots || (awayTeamStats.shotsOnTarget + awayTeamStats.shotsOffTarget),
                      shotsOnTarget: awayTeamStats.shotsOnTarget,
                      shotsOffTarget: awayTeamStats.shotsOffTarget,
                      corners: awayTeamStats.corners,
                      fouls: awayTeamStats.fouls,
                      yellowCards: awayTeamStats.yellowCards,
                      redCards: awayTeamStats.redCards,
                      offsides: 0, // Not available in TeamStatistics
                      passes: awayTeamStats.passes,
                      passAccuracy: awayTeamStats.passAccuracy,
                      keyPasses: awayTeamStats.keyPasses,
                      longPasses: awayTeamStats.longPasses,
                      longPassAccuracy: awayTeamStats.longPassAccuracy,
                      dribbles: awayTeamStats.dribbles,
                      dribbleSuccess: awayTeamStats.dribbleSuccess,
                      ballsLost: awayTeamStats.ballsLost,
                      oneOnOneSuccess: awayTeamStats.oneOnOneSuccess,
                      clearances: awayTeamStats.clearances,
                      tackles: awayTeamStats.tackles,
                    }}
                  />
                )}
                
                {/* Additional Deep Data Stats */}
                {renderCircularStats()}
                {renderShootingStats()}
                {renderComparisonStats()}
              </ScrollView>
            )}
          </>
        )}

        {activeTab === "players" && renderPlayersTab()}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  headerRight: {
    width: 40,
  },
  teamHeaders: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  teamHeader: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  teamLogo: {
    width: 24,
    height: 24,
    marginHorizontal: 8,
  },
  teamName: {
    fontSize: 14,
    fontWeight: "500",
  },
  vs: {
    fontSize: 12,
    marginHorizontal: 16,
  },
  tabNavigation: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  tabButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
    borderBottomWidth: 2,
  },
  activeTab: {
    borderBottomColor: "#FF9500",
  },
  tabText: {
    fontSize: 16,
    fontWeight: "500",
  },
  timePeriodFilter: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  timePeriodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: "center",
  },
  activeTimePeriod: {
    backgroundColor: "#FF9500",
  },
  timePeriodText: {
    fontSize: 14,
    fontWeight: "500",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  circularStatsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  circularStatItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  circularStatTeam: {
    flex: 1,
    alignItems: "center",
  },
  circularStatCenter: {
    flex: 2,
    alignItems: "center",
  },
  circularStatValue: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  circularStatLabel: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  shootingStatsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  shootingStatRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  shootingStatTeam: {
    flex: 1,
    alignItems: "center",
  },
  shootingStatCenter: {
    flex: 2,
    alignItems: "center",
  },
  shootingStatValue: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  shootingStatLabel: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  cardIndicators: {
    flexDirection: "row",
    marginBottom: 8,
    gap: 4,
  },
  cardIndicator: {
    width: 12,
    height: 8,
    borderRadius: 2,
  },
  cornerCard: {
    backgroundColor: "#4CAF50",
  },
  yellowCard: {
    backgroundColor: "#FFC107",
  },
  redCard: {
    backgroundColor: "#F44336",
  },
  shootingNumbers: {
    flexDirection: "row",
    gap: 8,
  },
  shootingNumber: {
    fontSize: 14,
    fontWeight: "500",
    minWidth: 20,
    textAlign: "center",
  },
  comparisonStatsContainer: {
    paddingHorizontal: 16,
  },
  comparisonBarContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  comparisonBarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  comparisonValue: {
    fontSize: 16,
    fontWeight: "600",
    minWidth: 40,
    textAlign: "center",
  },
  comparisonLabel: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
    textAlign: "center",
  },
  comparisonBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "#333",
    flexDirection: "row",
    overflow: "hidden",
  },
  comparisonBarLeft: {
    height: "100%",
    borderRadius: 3,
  },
  comparisonBarRight: {
    height: "100%",
    borderRadius: 3,
  },
  playersContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  playersGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingVertical: 16,
  },
  playerCard: {
    width: (screenWidth - 48) / 2,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: "center",
  },
  playerPhoto: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 8,
  },
  playerName: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 4,
  },
  playerPosition: {
    fontSize: 12,
    marginBottom: 8,
  },
  playerStats: {
    alignItems: "center",
  },
  playerRating: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  playerStatText: {
    fontSize: 12,
  },
});
