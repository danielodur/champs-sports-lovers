import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { useRouter, useLocalSearchParams, Stack } from "expo-router";
import { useTheme } from "@/hooks/useTheme";
import {
  ArrowLeft,
  Star,
  Trophy,
  Target,
  Activity,
  Calendar,
} from "lucide-react-native";

const { width } = Dimensions.get("window");

interface WeekSquadPlayer {
  id: string;
  name: string;
  position: string;
  team: string;
  rating: number;
  goals: number;
  assists: number;
  cleanSheets?: number;
  saves?: number;
  teamBadge: string;
  stats: {
    minutesPlayed: number;
    passAccuracy: number;
    shots: number;
    tackles: number;
    interceptions: number;
  };
}

interface NewsTeamWeekSquadProps {
  roundNumber?: number;
}

// Generate squad data based on round
const generateWeekSquad = (round: number): WeekSquadPlayer[] => {
  const baseSquad: WeekSquadPlayer[] = [
    // Goalkeeper
    {
      id: "gk1",
      name: "Denis Onyango",
      position: "GK",
      team: "Mamelodi Sundowns",
      rating: 8.5 + (round % 3) * 0.1,
      goals: 0,
      assists: 0,
      cleanSheets: Math.floor(round / 3) + 1,
      saves: 6 + (round % 4),
      teamBadge: "🟡",
      stats: {
        minutesPlayed: 90,
        passAccuracy: 82 + (round % 10),
        shots: 0,
        tackles: 0,
        interceptions: 2 + (round % 3),
      },
    },
    // Defenders
    {
      id: "def1",
      name: "Murushid Juuko",
      position: "CB",
      team: "KCCA FC",
      rating: 8.2 + (round % 4) * 0.05,
      goals: round % 5 === 0 ? 1 : 0,
      assists: Math.floor(round / 4),
      teamBadge: "🔵",
      stats: {
        minutesPlayed: 90,
        passAccuracy: 85 + (round % 8),
        shots: round % 3,
        tackles: 4 + (round % 3),
        interceptions: 3 + (round % 4),
      },
    },
    {
      id: "def2",
      name: "Isaac Muleme",
      position: "CB",
      team: "Vipers SC",
      rating: 8.0 + (round % 3) * 0.1,
      goals: 0,
      assists: round % 6 === 0 ? 1 : 0,
      teamBadge: "🟢",
      stats: {
        minutesPlayed: 90,
        passAccuracy: 83 + (round % 7),
        shots: 1,
        tackles: 5 + (round % 3),
        interceptions: 4 + (round % 3),
      },
    },
    {
      id: "def3",
      name: "Paul Willa",
      position: "LB",
      team: "KCCA FC",
      rating: 7.9 + (round % 4) * 0.1,
      goals: 0,
      assists: Math.floor(round / 3),
      teamBadge: "🔵",
      stats: {
        minutesPlayed: 90,
        passAccuracy: 78 + (round % 9),
        shots: round % 4,
        tackles: 3 + (round % 3),
        interceptions: 2 + (round % 3),
      },
    },
    {
      id: "def4",
      name: "Gavin Kizito",
      position: "RB",
      team: "Vipers SC",
      rating: 7.8 + (round % 5) * 0.1,
      goals: round % 7 === 0 ? 1 : 0,
      assists: round % 4 === 0 ? 1 : 0,
      teamBadge: "🟢",
      stats: {
        minutesPlayed: 90,
        passAccuracy: 80 + (round % 8),
        shots: 2 + (round % 3),
        tackles: 2 + (round % 4),
        interceptions: 1 + (round % 3),
      },
    },
    // Midfielders
    {
      id: "mid1",
      name: "Moses Waiswa",
      position: "CDM",
      team: "KCCA FC",
      rating: 8.1 + (round % 3) * 0.1,
      goals: Math.floor(round / 5),
      assists: Math.floor(round / 3),
      teamBadge: "🔵",
      stats: {
        minutesPlayed: 90,
        passAccuracy: 88 + (round % 6),
        shots: 2 + (round % 4),
        tackles: 4 + (round % 3),
        interceptions: 3 + (round % 4),
      },
    },
    {
      id: "mid2",
      name: "Allan Okello",
      position: "CM",
      team: "KCCA FC",
      rating: 8.4 + (round % 4) * 0.05,
      goals: Math.floor(round / 2),
      assists: Math.floor(round / 2),
      teamBadge: "🔵",
      stats: {
        minutesPlayed: 90,
        passAccuracy: 86 + (round % 8),
        shots: 4 + (round % 3),
        tackles: 2 + (round % 3),
        interceptions: 2 + (round % 3),
      },
    },
    {
      id: "mid3",
      name: "Bobosi Byaruhanga",
      position: "CM",
      team: "Vipers SC",
      rating: 8.0 + (round % 5) * 0.1,
      goals: Math.floor(round / 4),
      assists: Math.floor(round / 3),
      teamBadge: "🟢",
      stats: {
        minutesPlayed: 90,
        passAccuracy: 84 + (round % 7),
        shots: 3 + (round % 4),
        tackles: 3 + (round % 3),
        interceptions: 2 + (round % 4),
      },
    },
    {
      id: "mid4",
      name: "Milton Karisa",
      position: "CAM",
      team: "Vipers SC",
      rating: 8.2 + (round % 3) * 0.1,
      goals: Math.floor(round / 3),
      assists: Math.floor(round / 2),
      teamBadge: "🟢",
      stats: {
        minutesPlayed: 90,
        passAccuracy: 82 + (round % 9),
        shots: 5 + (round % 3),
        tackles: 1 + (round % 3),
        interceptions: 1 + (round % 3),
      },
    },
    // Forwards
    {
      id: "att1",
      name: "Fahad Bayo",
      position: "ST",
      team: "Vipers SC",
      rating: 8.3 + (round % 4) * 0.1,
      goals: Math.floor(round / 2) + 1,
      assists: Math.floor(round / 4),
      teamBadge: "🟢",
      stats: {
        minutesPlayed: 90,
        passAccuracy: 75 + (round % 10),
        shots: 6 + (round % 4),
        tackles: 1,
        interceptions: 0,
      },
    },
    {
      id: "att2",
      name: "Caesar Manzoki",
      position: "ST",
      team: "KCCA FC",
      rating: 8.1 + (round % 5) * 0.1,
      goals: Math.floor(round / 3) + 1,
      assists: Math.floor(round / 5),
      teamBadge: "🔵",
      stats: {
        minutesPlayed: 90,
        passAccuracy: 73 + (round % 8),
        shots: 5 + (round % 3),
        tackles: 1,
        interceptions: 0,
      },
    },
  ];

  return baseSquad;
};

export default function NewsTeamWeekSquad({
  roundNumber = 7,
}: NewsTeamWeekSquadProps) {
  const router = useRouter();
  const theme = useTheme();
  const params = useLocalSearchParams();

  const round = params.round ? parseInt(params.round as string) : roundNumber;
  const [squadData, setSquadData] = useState<WeekSquadPlayer[]>([]);
  const [loading, setLoading] = useState(true);

  const isDarkMode =
    theme.colors.background === "#2A2A2A" || theme.colors.text === "#FFFFFF";

  useEffect(() => {
    loadSquadData();
  }, [round]);

  const loadSquadData = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      const data = generateWeekSquad(round);
      setSquadData(data);
    } catch (error) {
      console.error("Error loading squad data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getFormationPositions = () => {
    return {
      goalkeeper: squadData.filter((p) => p.position === "GK"),
      defenders: squadData.filter((p) =>
        ["CB", "LB", "RB"].includes(p.position),
      ),
      midfielders: squadData.filter((p) =>
        ["CDM", "CM", "CAM"].includes(p.position),
      ),
      forwards: squadData.filter((p) => ["ST"].includes(p.position)),
    };
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 8.5) return "#FF4444";
    if (rating >= 8.0) return "#FF6B35";
    if (rating >= 7.5) return "#FFA500";
    return "#FFD700";
  };

  const renderPlayer = (player: WeekSquadPlayer, style: any) => (
    <TouchableOpacity
      key={player.id}
      style={[styles.playerContainer, style]}
      onPress={() => {
        // Navigate to player detail screen
        router.push({
          pathname: "/player-details",
          params: {
            playerId: player.id,
            playerName: player.name,
            round: round.toString(),
          },
        });
      }}
    >
      <View style={styles.playerImageContainer}>
        <View style={styles.playerImage}>
          <Text style={styles.playerInitials}>
            {player.name
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </Text>
        </View>
        <View
          style={[
            styles.teamBadge,
            { backgroundColor: theme.colors.background },
          ]}
        >
          <Text style={[styles.teamBadgeText, { color: theme.colors.text }]}>
            {player.teamBadge}
          </Text>
        </View>
      </View>
      <Text style={styles.playerName}>{player.name}</Text>
      <View
        style={[
          styles.ratingBadge,
          { backgroundColor: getRatingColor(player.rating) },
        ]}
      >
        <Text style={styles.ratingText}>{player.rating.toFixed(1)}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderPlayerDetails = (player: WeekSquadPlayer) => (
    <TouchableOpacity
      key={player.id}
      style={[
        styles.playerDetailCard,
        {
          backgroundColor: theme.colors.background,
          borderColor: getRatingColor(player.rating),
        },
      ]}
      onPress={() => {
        router.push({
          pathname: "/player-details",
          params: {
            playerId: player.id,
            playerName: player.name,
            round: round.toString(),
          },
        });
      }}
    >
      <View style={styles.playerDetailHeader}>
        <View style={styles.playerDetailInfo}>
          <View style={styles.playerDetailImageContainer}>
            <View style={styles.playerDetailImage}>
              <Text style={styles.playerDetailInitials}>
                {player.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </Text>
            </View>
            <View
              style={[
                styles.teamBadgeDetail,
                { backgroundColor: theme.colors.background },
              ]}
            >
              <Text
                style={[
                  styles.teamBadgeDetailText,
                  { color: theme.colors.text },
                ]}
              >
                {player.teamBadge}
              </Text>
            </View>
          </View>

          <View style={styles.playerDetailText}>
            <Text
              style={[styles.playerDetailName, { color: theme.colors.text }]}
            >
              {player.name}
            </Text>
            <Text
              style={[
                styles.playerDetailPosition,
                { color: theme.colors.textSecondary },
              ]}
            >
              {player.position} • {player.team}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.playerDetailRating,
            { backgroundColor: getRatingColor(player.rating) },
          ]}
        >
          <Text style={styles.playerDetailRatingText}>
            {player.rating.toFixed(1)}
          </Text>
        </View>
      </View>

      <View style={styles.playerDetailStats}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: theme.colors.text }]}>
            {player.goals}
          </Text>
          <Text
            style={[styles.statLabel, { color: theme.colors.textSecondary }]}
          >
            Goals
          </Text>
        </View>

        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: theme.colors.text }]}>
            {player.assists}
          </Text>
          <Text
            style={[styles.statLabel, { color: theme.colors.textSecondary }]}
          >
            Assists
          </Text>
        </View>

        {player.position === "GK" ? (
          <>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>
                {player.cleanSheets}
              </Text>
              <Text
                style={[
                  styles.statLabel,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Clean Sheets
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>
                {player.saves}
              </Text>
              <Text
                style={[
                  styles.statLabel,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Saves
              </Text>
            </View>
          </>
        ) : (
          <>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>
                {player.stats.passAccuracy}%
              </Text>
              <Text
                style={[
                  styles.statLabel,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Pass Acc.
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>
                {player.stats.shots}
              </Text>
              <Text
                style={[
                  styles.statLabel,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Shots
              </Text>
            </View>
          </>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            Loading Squad of Round {round}...
          </Text>
        </View>
      </View>
    );
  }

  const formation = getFormationPositions();

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View
        style={[styles.header, { backgroundColor: theme.colors.background }]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Squad of Round {round}
        </Text>

        <View style={styles.headerRight}>
          <View style={[styles.roundBadge, { backgroundColor: "#FF6B35" }]}>
            <Text style={styles.roundBadgeText}>R{round}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Formation View */}
        <View style={styles.formationSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Formation (4-4-2)
          </Text>

          <View style={styles.pitchContainer}>
            <View style={styles.pitch}>
              {/* Goalkeeper */}
              <View style={styles.goalkeepersRow}>
                {formation.goalkeeper.map((player) =>
                  renderPlayer(player, styles.goalkeeper),
                )}
              </View>

              {/* Defenders */}
              <View style={styles.defendersRow}>
                {formation.defenders.map((player, index) =>
                  renderPlayer(player, [
                    styles.defender,
                    index === 0
                      ? styles.leftBack
                      : index === formation.defenders.length - 1
                        ? styles.rightBack
                        : styles.centerBack,
                  ]),
                )}
              </View>

              {/* Midfielders */}
              <View style={styles.midfieldersRow}>
                {formation.midfielders.map((player, index) =>
                  renderPlayer(player, [
                    styles.midfielder,
                    index === 0
                      ? styles.leftMid
                      : index === formation.midfielders.length - 1
                        ? styles.rightMid
                        : styles.centerMid,
                  ]),
                )}
              </View>

              {/* Forwards */}
              <View style={styles.forwardsRow}>
                {formation.forwards.map((player) =>
                  renderPlayer(player, styles.forward),
                )}
              </View>
            </View>

            <View style={styles.formationInfo}>
              <Text style={styles.formationType}>Formation: 4-4-2</Text>
              <Text style={styles.updateDate}>Update Date: 12-01</Text>
            </View>
          </View>
        </View>

        {/* Detailed Squad List */}
        <View style={styles.detailSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Squad Details
          </Text>
          <View style={styles.playerDetailsList}>
            {squadData.map(renderPlayerDetails)}
          </View>
        </View>
      </ScrollView>
    </View>
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
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    fontFamily: "Inter-SemiBold",
    flex: 1,
    textAlign: "center",
    marginHorizontal: 16,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  roundBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  roundBadgeText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter-SemiBold",
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    fontFamily: "Inter-Medium",
  },
  formationSection: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    fontFamily: "Inter-SemiBold",
    marginBottom: 16,
  },
  pitchContainer: {
    position: "relative",
    marginHorizontal: -16,
  },
  pitch: {
    backgroundColor: "#4CAF50",
    marginHorizontal: 16,
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 16,
    minHeight: 400,
    position: "relative",
  },
  goalkeepersRow: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
  },
  defendersRow: {
    position: "absolute",
    bottom: 100,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 20,
  },
  midfieldersRow: {
    position: "absolute",
    bottom: 200,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 20,
  },
  forwardsRow: {
    position: "absolute",
    bottom: 300,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 40,
  },
  playerContainer: {
    alignItems: "center",
    width: 70,
  },
  playerImageContainer: {
    position: "relative",
    marginBottom: 4,
  },
  playerImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: "white",
    backgroundColor: "#4CAF50",
    alignItems: "center",
    justifyContent: "center",
  },
  playerInitials: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: "Inter-Bold",
  },
  teamBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  teamBadgeText: {
    fontSize: 12,
  },
  playerName: {
    color: "white",
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 4,
    fontFamily: "Inter-SemiBold",
  },
  ratingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  ratingText: {
    color: "white",
    fontSize: 11,
    fontWeight: "bold",
    fontFamily: "Inter-Bold",
  },
  goalkeeper: {},
  defender: {},
  leftBack: {},
  rightBack: {},
  centerBack: {},
  midfielder: {},
  leftMid: {},
  rightMid: {},
  centerMid: {},
  forward: {},
  formationInfo: {
    position: "absolute",
    bottom: 16,
    right: 32,
  },
  formationType: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter-SemiBold",
    textAlign: "right",
  },
  updateDate: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    fontFamily: "Inter-Regular",
    textAlign: "right",
    marginTop: 2,
  },
  detailSection: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  playerDetailsList: {
    gap: 12,
  },
  playerDetailCard: {
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: "rgba(128,128,128,0.1)",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  playerDetailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  playerDetailInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  playerDetailImageContainer: {
    position: "relative",
    marginRight: 12,
  },
  playerDetailImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#4CAF50",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  playerDetailInitials: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: "Inter-Bold",
  },
  teamBadgeDetail: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  teamBadgeDetailText: {
    fontSize: 12,
  },
  playerDetailText: {
    flex: 1,
  },
  playerDetailName: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Inter-SemiBold",
    marginBottom: 4,
  },
  playerDetailPosition: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
  },
  playerDetailRating: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 50,
    alignItems: "center",
  },
  playerDetailRatingText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: "Inter-Bold",
  },
  playerDetailStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(128,128,128,0.1)",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Inter-SemiBold",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: "Inter-Regular",
  },
});
