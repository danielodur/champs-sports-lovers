import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "@/hooks/useTheme";
import {
  Star,
  Trophy,
  Target,
  Calendar,
  Award,
  TrendingUp,
  Users,
  Activity,
  ChevronRight,
  Medal,
} from "lucide-react-native";

const { width } = Dimensions.get("window");

interface WeekSquadPlayer {
  id: string;
  name: string;
  position: string;
  age: number;
  nationality: string;
  teamName: string;
  rating: number;
  goals: number;
  assists: number;
  cleanSheets?: number;
  saves?: number;
  passAccuracy?: number;
  imageUrl: string;
  weekPerformance: {
    matchesPlayed: number;
    goalsScored: number;
    assistsMade: number;
    rating: number;
    keyStats: string[];
  };
  isMotm?: boolean; // Man of the Match
  isCaptain?: boolean;
}

interface WeekSquadData {
  week: number;
  startDate: string;
  endDate: string;
  formation: string;
  players: {
    goalkeeper: WeekSquadPlayer;
    defenders: WeekSquadPlayer[];
    midfielders: WeekSquadPlayer[];
    forwards: WeekSquadPlayer[];
  };
  topPerformer: WeekSquadPlayer;
  totalGoals: number;
  averageRating: number;
}

interface NewsTeamWeekSquadProps {
  teamName?: string;
  leagueId?: string;
  weekNumber?: number;
}

// Smart function to generate week squad data for any team
const generateWeekSquadData = (
  teamName?: string,
  leagueId?: string,
  weekNumber?: number,
): WeekSquadData => {
  const currentWeek = weekNumber || Math.floor(Math.random() * 15) + 1;

  const generatePlayer = (position: string, index: number): WeekSquadPlayer => {
    const playerId = `${teamName?.toLowerCase().replace(/\s+/g, "-")}-week-${index}`;
    const playerName = generatePlayerName(teamName, index);
    const rating = 7.0 + Math.random() * 2.0; // 7.0-9.0 for week squad

    return {
      id: playerId,
      name: playerName,
      position,
      age: 20 + Math.floor(Math.random() * 15),
      nationality: generateNationality(leagueId),
      teamName: teamName || "Team",
      rating: +rating.toFixed(1),
      goals:
        position.includes("F") || position === "CAM"
          ? Math.floor(Math.random() * 3)
          : position === "GK"
            ? 0
            : Math.floor(Math.random() * 2),
      assists: position !== "GK" ? Math.floor(Math.random() * 3) : 0,
      cleanSheets:
        position === "GK" ? Math.floor(Math.random() * 2) : undefined,
      saves: position === "GK" ? 3 + Math.floor(Math.random() * 8) : undefined,
      passAccuracy:
        position !== "GK" ? 80 + Math.floor(Math.random() * 15) : undefined,
      imageUrl: generatePlayerImage(index),
      weekPerformance: {
        matchesPlayed: 1 + Math.floor(Math.random() * 2),
        goalsScored:
          position.includes("F") || position === "CAM"
            ? Math.floor(Math.random() * 3)
            : Math.floor(Math.random() * 2),
        assistsMade: Math.floor(Math.random() * 3),
        rating: +rating.toFixed(1),
        keyStats: generateKeyStats(position),
      },
      isMotm: Math.random() < 0.2,
      isCaptain: index === 5, // Usually a midfielder or defender
    };
  };

  const goalkeeper = generatePlayer("GK", 1);
  const defenders = [
    generatePlayer("CB", 2),
    generatePlayer("CB", 3),
    generatePlayer("LB", 4),
    generatePlayer("RB", 5),
  ];
  const midfielders = [
    generatePlayer("CDM", 6),
    generatePlayer("CM", 7),
    generatePlayer("CAM", 8),
  ];
  const forwards = [
    generatePlayer("LW", 9),
    generatePlayer("CF", 10),
    generatePlayer("RW", 11),
  ];

  const allPlayers = [goalkeeper, ...defenders, ...midfielders, ...forwards];
  const topPerformer = allPlayers.reduce((prev, current) =>
    prev.weekPerformance.rating > current.weekPerformance.rating
      ? prev
      : current,
  );

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - currentWeek * 7);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6);

  return {
    week: currentWeek,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    formation: "4-3-3",
    players: {
      goalkeeper,
      defenders,
      midfielders,
      forwards,
    },
    topPerformer,
    totalGoals: allPlayers.reduce(
      (sum, p) => sum + p.weekPerformance.goalsScored,
      0,
    ),
    averageRating: +(
      allPlayers.reduce((sum, p) => sum + p.weekPerformance.rating, 0) /
      allPlayers.length
    ).toFixed(1),
  };
};

// Helper functions
const generatePlayerName = (teamName?: string, index?: number): string => {
  const firstNames = [
    "Marcus",
    "James",
    "Kevin",
    "David",
    "Michael",
    "Robert",
    "William",
    "John",
    "Luis",
    "Carlos",
    "Juan",
    "Jose",
    "Miguel",
    "Antonio",
    "Manuel",
    "Francisco",
    "Mohamed",
    "Ahmed",
    "Ali",
    "Omar",
    "Hassan",
    "Ibrahim",
    "Youssef",
    "Khalid",
    "Patrick",
    "Steven",
    "Emmanuel",
    "Moses",
    "Joseph",
    "Brian",
    "Allan",
    "Dennis",
  ];

  const lastNames = [
    "Anderson",
    "Wilson",
    "Martinez",
    "Garcia",
    "Rodriguez",
    "Lopez",
    "Gonzalez",
    "Johnson",
    "Williams",
    "Brown",
    "Jones",
    "Miller",
    "Davis",
    "Smith",
    "Kaddu",
    "Lwanga",
    "Mukiibi",
    "Ssekitoleko",
    "Wasswa",
    "Kizza",
    "Mubiru",
    "Al-Rashid",
    "El-Masry",
    "Ben-Salem",
    "Al-Farisi",
    "Al-Mansouri",
  ];

  const hash = ((teamName?.length || 0) + (index || 0)) * 13;
  const firstName = firstNames[hash % firstNames.length];
  const lastName = lastNames[(hash * 7) % lastNames.length];

  return `${firstName} ${lastName}`;
};

const generateNationality = (leagueId?: string): string => {
  const ugandanNats = ["Uganda", "Kenya", "Tanzania", "Rwanda", "South Sudan"];
  const europeanNats = [
    "England",
    "Spain",
    "Germany",
    "Italy",
    "France",
    "Portugal",
  ];
  const globalNats = [
    "Brazil",
    "Argentina",
    "Nigeria",
    "Ghana",
    "Morocco",
    "Japan",
  ];

  if (leagueId === "uganda-premier-league") {
    return Math.random() < 0.6
      ? ugandanNats[Math.floor(Math.random() * ugandanNats.length)]
      : globalNats[Math.floor(Math.random() * globalNats.length)];
  }

  const allNats = [...europeanNats, ...globalNats];
  return allNats[Math.floor(Math.random() * allNats.length)];
};

const generatePlayerImage = (index: number): string => {
  return `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&h=120&fit=crop&crop=face&seed=${index + 100}`;
};

const generateKeyStats = (position: string): string[] => {
  const gkStats = [
    "Clean sheet",
    "Crucial saves",
    "Distribution",
    "Command of area",
  ];
  const defStats = ["Tackles won", "Clearances", "Aerial duels", "Blocks"];
  const midStats = [
    "Pass accuracy",
    "Key passes",
    "Ball recovery",
    "Distance covered",
  ];
  const attStats = [
    "Goals scored",
    "Shots on target",
    "Dribbles",
    "Chances created",
  ];

  let availableStats: string[];
  if (position === "GK") availableStats = gkStats;
  else if (["CB", "LB", "RB"].includes(position)) availableStats = defStats;
  else if (["CDM", "CM", "CAM"].includes(position)) availableStats = midStats;
  else availableStats = attStats;

  return availableStats.slice(0, 2 + Math.floor(Math.random() * 2));
};

// Team theme colors function
const getTeamTheme = (teamName?: string) => {
  if (!teamName) return { primary: "#4CAF50", secondary: "#2E7D32" };

  const teamLower = teamName.toLowerCase();

  if (teamLower.includes("vipers"))
    return { primary: "#4CAF50", secondary: "#2E7D32" };
  if (teamLower.includes("kcca"))
    return { primary: "#9C27B0", secondary: "#7B1FA2" };
  if (teamLower.includes("villa"))
    return { primary: "#E91E63", secondary: "#C2185B" };
  if (teamLower.includes("express"))
    return { primary: "#F44336", secondary: "#D32F2F" };
  if (teamLower.includes("ura"))
    return { primary: "#607D8B", secondary: "#455A64" };
  if (teamLower.includes("nec"))
    return { primary: "#FF9800", secondary: "#F57C00" };
  if (teamLower.includes("bul"))
    return { primary: "#795548", secondary: "#5D4037" };
  if (teamLower.includes("kitara"))
    return { primary: "#FF5722", secondary: "#D84315" };
  if (teamLower.includes("police"))
    return { primary: "#673AB7", secondary: "#512DA8" };
  if (teamLower.includes("lugazi"))
    return { primary: "#2196F3", secondary: "#1976D2" };

  return { primary: "#4CAF50", secondary: "#2E7D32" };
};

export default function NewsTeamWeekSquad({
  teamName,
  leagueId,
  weekNumber,
}: NewsTeamWeekSquadProps) {
  const router = useRouter();
  const theme = useTheme();
  const [squadData, setSquadData] = useState<WeekSquadData | null>(null);
  const [loading, setLoading] = useState(true);

  const teamTheme = getTeamTheme(teamName);
  const isDarkMode =
    theme.colors.background === "#2A2A2A" || theme.colors.text === "#FFFFFF";

  useEffect(() => {
    loadWeekSquadData();
  }, [teamName, leagueId, weekNumber]);

  const loadWeekSquadData = async () => {
    try {
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 600));

      const data = generateWeekSquadData(teamName, leagueId, weekNumber);
      setSquadData(data);
    } catch (error) {
      console.error("Error loading week squad data:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderWeekHeader = () => {
    if (!squadData) return null;

    return (
      <View style={[styles.weekHeader, { backgroundColor: teamTheme.primary }]}>
        <View style={styles.weekHeaderContent}>
          <Trophy size={24} color="white" />
          <View style={styles.weekInfo}>
            <Text style={styles.weekTitle}>Team of the Week</Text>
            <Text style={styles.weekSubtitle}>
              Week {squadData.week} •{" "}
              {new Date(squadData.startDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}{" "}
              -{" "}
              {new Date(squadData.endDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </Text>
          </View>
          <View style={styles.weekStats}>
            <Text style={styles.weekStatValue}>{squadData.averageRating}</Text>
            <Text style={styles.weekStatLabel}>Avg Rating</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderTopPerformer = () => {
    if (!squadData) return null;

    const player = squadData.topPerformer;

    return (
      <TouchableOpacity
        style={[
          styles.topPerformerCard,
          { backgroundColor: isDarkMode ? "#1E1E1E" : "#FFFFFF" },
        ]}
        activeOpacity={0.7}
        onPress={() => {
          router.push({
            pathname: "/player-details",
            params: {
              playerId: player.id,
              playerName: player.name,
              teamName: player.teamName,
            },
          });
        }}
      >
        <View style={styles.topPerformerHeader}>
          <Medal size={16} color="#FFD700" />
          <Text
            style={[styles.topPerformerTitle, { color: theme.colors.text }]}
          >
            Player of the Week
          </Text>
        </View>

        <View style={styles.topPerformerContent}>
          <Image
            source={{ uri: player.imageUrl }}
            style={styles.topPerformerImage}
          />
          <View style={styles.topPerformerInfo}>
            <Text
              style={[styles.topPerformerName, { color: theme.colors.text }]}
            >
              {player.name}
            </Text>
            <Text
              style={[
                styles.topPerformerDetails,
                { color: theme.colors.textSecondary },
              ]}
            >
              {player.position} • {player.teamName}
            </Text>
            <View style={styles.topPerformerStats}>
              <View style={styles.topPerformerStat}>
                <Text
                  style={[
                    styles.topPerformerStatValue,
                    { color: teamTheme.primary },
                  ]}
                >
                  {player.weekPerformance.rating}
                </Text>
                <Text
                  style={[
                    styles.topPerformerStatLabel,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Rating
                </Text>
              </View>
              <View style={styles.topPerformerStat}>
                <Text
                  style={[
                    styles.topPerformerStatValue,
                    { color: teamTheme.primary },
                  ]}
                >
                  {player.weekPerformance.goalsScored}
                </Text>
                <Text
                  style={[
                    styles.topPerformerStatLabel,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Goals
                </Text>
              </View>
              <View style={styles.topPerformerStat}>
                <Text
                  style={[
                    styles.topPerformerStatValue,
                    { color: teamTheme.primary },
                  ]}
                >
                  {player.weekPerformance.assistsMade}
                </Text>
                <Text
                  style={[
                    styles.topPerformerStatLabel,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Assists
                </Text>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderPlayer = (player: WeekSquadPlayer, index: number) => (
    <TouchableOpacity
      key={player.id}
      style={[
        styles.playerCard,
        {
          backgroundColor: theme.colors.background,
          borderLeftColor: player.isMotm ? "#FFD700" : teamTheme.primary,
          borderWidth: 1,
          borderColor: "rgba(128,128,128,0.1)",
        },
      ]}
      activeOpacity={0.7}
      onPress={() => {
        router.push({
          pathname: "/player-details",
          params: {
            playerId: player.id,
            playerName: player.name,
            teamName: player.teamName,
          },
        });
      }}
    >
      <View style={styles.playerHeader}>
        <View style={styles.playerBasicInfo}>
          <Image source={{ uri: player.imageUrl }} style={styles.playerImage} />
          <View style={styles.playerNameInfo}>
            <View style={styles.playerNameRow}>
              <Text style={[styles.playerName, { color: theme.colors.text }]}>
                {player.name}
              </Text>
              {player.isCaptain && (
                <View style={styles.captainBadge}>
                  <Text style={styles.captainText}>C</Text>
                </View>
              )}
              {player.isMotm && (
                <View style={styles.motmBadge}>
                  <Star size={10} color="#FFD700" fill="#FFD700" />
                </View>
              )}
            </View>
            <Text
              style={[
                styles.playerDetails,
                { color: theme.colors.textSecondary },
              ]}
            >
              {player.position} • {player.teamName}
            </Text>
          </View>
        </View>

        <View style={styles.playerRating}>
          <Text style={[styles.ratingValue, { color: teamTheme.primary }]}>
            {player.weekPerformance.rating}
          </Text>
        </View>
      </View>

      <View style={styles.weekPerformance}>
        <Text style={[styles.performanceTitle, { color: theme.colors.text }]}>
          Week Performance
        </Text>
        <View style={styles.performanceStats}>
          {player.position === "GK" ? (
            <>
              <View style={styles.performanceStat}>
                <Text
                  style={[
                    styles.performanceValue,
                    { color: theme.colors.text },
                  ]}
                >
                  {player.cleanSheets}
                </Text>
                <Text
                  style={[
                    styles.performanceLabel,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Clean Sheets
                </Text>
              </View>
              <View style={styles.performanceStat}>
                <Text
                  style={[
                    styles.performanceValue,
                    { color: theme.colors.text },
                  ]}
                >
                  {player.saves}
                </Text>
                <Text
                  style={[
                    styles.performanceLabel,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Saves
                </Text>
              </View>
            </>
          ) : (
            <>
              <View style={styles.performanceStat}>
                <Text
                  style={[
                    styles.performanceValue,
                    { color: theme.colors.text },
                  ]}
                >
                  {player.weekPerformance.goalsScored}
                </Text>
                <Text
                  style={[
                    styles.performanceLabel,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Goals
                </Text>
              </View>
              <View style={styles.performanceStat}>
                <Text
                  style={[
                    styles.performanceValue,
                    { color: theme.colors.text },
                  ]}
                >
                  {player.weekPerformance.assistsMade}
                </Text>
                <Text
                  style={[
                    styles.performanceLabel,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Assists
                </Text>
              </View>
              <View style={styles.performanceStat}>
                <Text
                  style={[
                    styles.performanceValue,
                    { color: theme.colors.text },
                  ]}
                >
                  {player.passAccuracy}%
                </Text>
                <Text
                  style={[
                    styles.performanceLabel,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Pass Acc.
                </Text>
              </View>
            </>
          )}
        </View>

        {player.weekPerformance.keyStats.length > 0 && (
          <View style={styles.keyStats}>
            <Text
              style={[
                styles.keyStatsTitle,
                { color: theme.colors.textSecondary },
              ]}
            >
              Key Stats:
            </Text>
            <Text style={[styles.keyStatsText, { color: theme.colors.text }]}>
              {player.weekPerformance.keyStats.join(" • ")}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderFormation = () => {
    if (!squadData) return null;

    return (
      <View style={styles.formationContainer}>
        <Text style={[styles.formationTitle, { color: theme.colors.text }]}>
          Formation: {squadData.formation}
        </Text>

        {/* Goalkeeper */}
        <View style={styles.positionGroup}>
          <Text
            style={[
              styles.positionTitle,
              { color: theme.colors.textSecondary },
            ]}
          >
            Goalkeeper
          </Text>
          {renderPlayer(squadData.players.goalkeeper, 0)}
        </View>

        {/* Defenders */}
        <View style={styles.positionGroup}>
          <Text
            style={[
              styles.positionTitle,
              { color: theme.colors.textSecondary },
            ]}
          >
            Defenders
          </Text>
          {squadData.players.defenders.map((player, index) =>
            renderPlayer(player, index + 1),
          )}
        </View>

        {/* Midfielders */}
        <View style={styles.positionGroup}>
          <Text
            style={[
              styles.positionTitle,
              { color: theme.colors.textSecondary },
            ]}
          >
            Midfielders
          </Text>
          {squadData.players.midfielders.map((player, index) =>
            renderPlayer(player, index + 5),
          )}
        </View>

        {/* Forwards */}
        <View style={styles.positionGroup}>
          <Text
            style={[
              styles.positionTitle,
              { color: theme.colors.textSecondary },
            ]}
          >
            Forwards
          </Text>
          {squadData.players.forwards.map((player, index) =>
            renderPlayer(player, index + 8),
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={teamTheme.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.text }]}>
          Loading {teamName ? `${teamName} ` : ""}team of the week...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {renderWeekHeader()}
      {renderTopPerformer()}
      {renderFormation()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: "Inter-Medium",
  },
  weekHeader: {
    padding: 20,
    marginBottom: 16,
  },
  weekHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  weekInfo: {
    flex: 1,
  },
  weekTitle: {
    color: "white",
    fontSize: 18,
    fontFamily: "Inter-Bold",
    marginBottom: 4,
  },
  weekSubtitle: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
    fontFamily: "Inter-Regular",
  },
  weekStats: {
    alignItems: "center",
  },
  weekStatValue: {
    color: "white",
    fontSize: 20,
    fontFamily: "Inter-Bold",
  },
  weekStatLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    fontFamily: "Inter-Regular",
  },
  topPerformerCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: "rgba(128,128,128,0.1)",
  },
  topPerformerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  topPerformerTitle: {
    fontSize: 14,
    fontFamily: "Inter-SemiBold",
    textTransform: "uppercase",
  },
  topPerformerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  topPerformerImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  topPerformerInfo: {
    flex: 1,
  },
  topPerformerName: {
    fontSize: 18,
    fontFamily: "Inter-Bold",
    marginBottom: 4,
  },
  topPerformerDetails: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
    marginBottom: 8,
  },
  topPerformerStats: {
    flexDirection: "row",
    gap: 16,
  },
  topPerformerStat: {
    alignItems: "center",
  },
  topPerformerStatValue: {
    fontSize: 16,
    fontFamily: "Inter-Bold",
  },
  topPerformerStatLabel: {
    fontSize: 11,
    fontFamily: "Inter-Regular",
  },
  formationContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  formationTitle: {
    fontSize: 18,
    fontFamily: "Inter-SemiBold",
    marginBottom: 20,
    textAlign: "center",
  },
  positionGroup: {
    marginBottom: 20,
  },
  positionTitle: {
    fontSize: 16,
    fontFamily: "Inter-SemiBold",
    marginBottom: 12,
    textTransform: "uppercase",
  },
  playerCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 3,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: "rgba(128,128,128,0.1)",
  },
  playerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  playerBasicInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  playerImage: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
  },
  playerNameInfo: {
    flex: 1,
  },
  playerNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  playerName: {
    fontSize: 16,
    fontFamily: "Inter-SemiBold",
  },
  captainBadge: {
    backgroundColor: "#FFD700",
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  captainText: {
    color: "#000",
    fontSize: 10,
    fontFamily: "Inter-Bold",
  },
  motmBadge: {
    backgroundColor: "transparent",
    padding: 2,
  },
  playerDetails: {
    fontSize: 12,
    fontFamily: "Inter-Regular",
  },
  playerRating: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 40,
  },
  ratingValue: {
    fontSize: 18,
    fontFamily: "Inter-Bold",
  },
  weekPerformance: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(128,128,128,0.2)",
  },
  performanceTitle: {
    fontSize: 14,
    fontFamily: "Inter-SemiBold",
    marginBottom: 8,
  },
  performanceStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  performanceStat: {
    alignItems: "center",
    flex: 1,
  },
  performanceValue: {
    fontSize: 16,
    fontFamily: "Inter-Bold",
    marginBottom: 2,
  },
  performanceLabel: {
    fontSize: 10,
    fontFamily: "Inter-Regular",
  },
  keyStats: {
    marginTop: 8,
  },
  keyStatsTitle: {
    fontSize: 12,
    fontFamily: "Inter-SemiBold",
    marginBottom: 4,
  },
  keyStatsText: {
    fontSize: 12,
    fontFamily: "Inter-Regular",
    lineHeight: 16,
  },
});
