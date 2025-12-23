import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/hooks/useTheme";
import {
  ArrowLeft,
  Star,
  ChevronDown,
  ChevronRight,
  Users,
  Trophy,
  Calendar,
  Euro,
} from "lucide-react-native";
import { formatEuro, removeCurrencySymbol } from "@/utils/currency";
import NewsMatchesLeagueRoundSelector from "@/modules/news/components/shared/news-matches-league-round-selector";

const { width } = Dimensions.get("window");

interface Player {
  id: string;
  name: string;
  position: string;
  rating: number;
  team: string;
  teamBadge: string;
}

interface Team {
  id: string;
  name: string;
  logo: string;
  titles: number;
  description: string;
}

interface LeagueStats {
  totalRounds: number;
  participatingTeams: number;
  totalPlayers: number;
  foreignPlayers: number;
  totalMarketValue: string;
  currentRound: number;
  seasonStart: string;
  seasonEnd: string;
}

interface NewsTeamDraftProps {
  teamName?: string;
  leagueId?: string;
}

const generateUPLData = () => {
  const bestLineup: Player[] = [
    // Goalkeeper
    {
      id: "1",
      name: "Denis Onyango",
      position: "GK",
      rating: 8.5,
      team: "Mamelodi Sundowns",
      teamBadge: "🟡",
    },
    // Defenders
    {
      id: "2",
      name: "Murushid Juuko",
      position: "CB",
      rating: 8.2,
      team: "KCCA FC",
      teamBadge: "🔵",
    },
    {
      id: "3",
      name: "Isaac Muleme",
      position: "CB",
      rating: 8.0,
      team: "Vipers SC",
      teamBadge: "🟢",
    },
    {
      id: "4",
      name: "Paul Willa",
      position: "LB",
      rating: 7.9,
      team: "KCCA FC",
      teamBadge: "🔵",
    },
    {
      id: "5",
      name: "Gavin Kizito",
      position: "RB",
      rating: 7.8,
      team: "Vipers SC",
      teamBadge: "🟢",
    },
    // Midfielders
    {
      id: "6",
      name: "Moses Waiswa",
      position: "CDM",
      rating: 8.1,
      team: "KCCA FC",
      teamBadge: "🔵",
    },
    {
      id: "7",
      name: "Allan Okello",
      position: "CM",
      rating: 8.4,
      team: "KCCA FC",
      teamBadge: "🔵",
    },
    {
      id: "8",
      name: "Bobosi Byaruhanga",
      position: "CM",
      rating: 8.0,
      team: "Vipers SC",
      teamBadge: "🟢",
    },
    {
      id: "9",
      name: "Milton Karisa",
      position: "CAM",
      rating: 8.2,
      team: "Vipers SC",
      teamBadge: "🟢",
    },
    // Forwards
    {
      id: "10",
      name: "Fahad Bayo",
      position: "ST",
      rating: 8.3,
      team: "Vipers SC",
      teamBadge: "🟢",
    },
    {
      id: "11",
      name: "Caesar Manzoki",
      position: "ST",
      rating: 8.1,
      team: "KCCA FC",
      teamBadge: "🔵",
    },
  ];

  const topTeams: Team[] = [
    {
      id: "vipers",
      name: "Vipers SC",
      logo: "🟢",
      titles: 5,
      description: "Most Titles (5)",
    },
    {
      id: "kcca",
      name: "KCCA FC",
      logo: "🔵",
      titles: 13,
      description: "Record Champions (13)",
    },
    {
      id: "express",
      name: "Express FC",
      logo: "🔴",
      titles: 6,
      description: "Historical Champions (6)",
    },
  ];

  const promotedTeams: Team[] = [
    {
      id: "kitara",
      name: "Kitara FC",
      logo: "KFC",
      titles: 0,
      description: "Promoted 2024/25 Season",
    },
    {
      id: "mbale-heroes",
      name: "Mbale Heroes FC",
      logo: "MH",
      titles: 0,
      description: "Promoted 2024/25 Season",
    },
    {
      id: "calvary",
      name: "Calvary FC",
      logo: "CAL",
      titles: 0,
      description: "Promoted 2024/25 Season",
    },
  ];

  const secondDivision: Team[] = [
    {
      id: "fufa-big-league",
      name: "FUFA Big League",
      logo: "FBL",
      titles: 0,
      description: "Second Division Championship",
    },
    {
      id: "regional-leagues",
      name: "Regional Leagues",
      logo: "REG",
      titles: 0,
      description: "Third Tier Competitions",
    },
  ];

  const leagueStats: LeagueStats = {
    totalRounds: 30,
    participatingTeams: 16,
    totalPlayers: 496,
    foreignPlayers: 124,
    totalMarketValue: formatEuro("2.5M"),
    currentRound: 15,
    seasonStart: "09/15",
    seasonEnd: "05/30",
  };

  return {
    bestLineup,
    topTeams,
    promotedTeams,
    secondDivision,
    leagueStats,
  };
};

export default function NewsTeamDraft({
  teamName,
  leagueId,
}: NewsTeamDraftProps) {
  const router = useRouter();
  const theme = useTheme();
  const [selectedRound, setSelectedRound] = useState(7);
  const [showRoundSelector, setShowRoundSelector] = useState(false);
  const [data, setData] = useState<any>(null);

  const isDarkMode =
    theme.colors.background === "#2A2A2A" || theme.colors.text === "#FFFFFF";

  useEffect(() => {
    const uplData = generateUPLData();
    setData(uplData);
  }, []);

  const handleRoundChange = (round: string) => {
    setSelectedRound(parseInt(round));
    setShowRoundSelector(false);
  };

  const generateRounds = () => {
    const rounds = [];
    for (let i = 1; i <= 30; i++) {
      rounds.push(i.toString());
    }
    return rounds;
  };

  if (!data) {
    return (
      <View
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <Text style={[styles.loadingText, { color: theme.colors.text }]}>
          Loading...
        </Text>
      </View>
    );
  }

  const getFormationPositions = () => {
    const { bestLineup } = data;
    return {
      goalkeeper: bestLineup.filter((p: Player) => p.position === "GK"),
      defenders: bestLineup.filter((p: Player) =>
        ["CB", "LB", "RB"].includes(p.position),
      ),
      midfielders: bestLineup.filter((p: Player) =>
        ["CDM", "CM", "CAM"].includes(p.position),
      ),
      forwards: bestLineup.filter((p: Player) => ["ST"].includes(p.position)),
    };
  };

  const formation = getFormationPositions();

  const renderPlayer = (player: Player, style: any) => (
    <View key={player.id} style={[styles.playerContainer, style]}>
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
        <Text style={styles.ratingText}>{player.rating}</Text>
      </View>
    </View>
  );

  const getRatingColor = (rating: number) => {
    if (rating >= 8.5) return "#FF4444";
    if (rating >= 8.0) return "#FF6B35";
    if (rating >= 7.5) return "#FFA500";
    return "#FFD700";
  };

  const renderTeamItem = (team: Team, showChevron: boolean = true) => (
    <TouchableOpacity
      key={team.id}
      style={styles.teamItem}
      activeOpacity={0.7}
      onPress={() => {
        if (team.id === "fufa-big-league" || team.id === "regional-leagues") {
          router.push({
            pathname: "/news/news-lower-league-table-standing",
            params: {
              leagueId: team.id,
              leagueName: team.name,
            },
          });
        } else {
          router.push({
            pathname: "/team-details",
            params: {
              teamId: team.id,
              teamName: team.name,
              sport: "football", // ✅ Team draft is football-specific
            },
          });
        }
      }}
    >
      <View style={styles.teamInfo}>
        <View style={styles.teamLogoContainer}>
          <View style={styles.teamLogoImage}>
            <Text style={styles.teamLogoFallback}>
              {team.name
                .split(" ")
                .map((word) => word[0])
                .join("")
                .slice(0, 2)}
            </Text>
          </View>
        </View>
        <View style={styles.teamTextContainer}>
          <Text style={[styles.teamName, { color: theme.colors.text }]}>
            {team.name}
          </Text>
          <Text
            style={[
              styles.teamDescription,
              { color: theme.colors.textSecondary },
            ]}
          >
            {team.description}
          </Text>
        </View>
      </View>
      {showChevron && (
        <ChevronRight size={20} color={theme.colors.textSecondary} />
      )}
    </TouchableOpacity>
  );

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Basic Information
          </Text>

          {/* Top Teams */}
          <View style={styles.topTeamsContainer}>
            <View style={styles.topTeam}>
              <Text style={styles.topTeamLogo}>{data.topTeams[0].logo}</Text>
              <Text style={[styles.topTeamName, { color: theme.colors.text }]}>
                {data.topTeams[0].name}
              </Text>
              <Text
                style={[
                  styles.topTeamDesc,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {data.topTeams[0].description}
              </Text>
            </View>

            <View
              style={[
                styles.teamSeparator,
                { backgroundColor: theme.colors.textSecondary },
              ]}
            />

            <View style={styles.topTeam}>
              <Text style={styles.topTeamLogo}>{data.topTeams[1].logo}</Text>
              <Text style={[styles.topTeamName, { color: theme.colors.text }]}>
                {data.topTeams[1].name}
              </Text>
              <Text
                style={[
                  styles.topTeamDesc,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {data.topTeams[1].description}
              </Text>
            </View>
          </View>

          {/* League Stats */}
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: theme.colors.text }]}>
                Regular Season Rounds
              </Text>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>
                {data.leagueStats.totalRounds}
              </Text>
            </View>

            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: theme.colors.text }]}>
                Participating Teams
              </Text>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>
                {data.leagueStats.participatingTeams}
              </Text>
            </View>

            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: theme.colors.text }]}>
                Player Count (Foreign)
              </Text>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>
                {data.leagueStats.totalPlayers}(
                {data.leagueStats.foreignPlayers})
              </Text>
            </View>

            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: theme.colors.text }]}>
                Total Player Value
              </Text>
              <View style={styles.valueContainer}>
                <Euro size={16} color="#FF6B35" />
                <Text
                  style={[
                    styles.statValue,
                    { color: theme.colors.text, marginLeft: 4 },
                  ]}
                >
                  {removeCurrencySymbol(data.leagueStats.totalMarketValue)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Squad of the Week */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Squad of the Week
            </Text>
            <TouchableOpacity
              style={styles.roundSelector}
              onPress={() => setShowRoundSelector(true)}
            >
              <Text
                style={[styles.roundSelectorText, { color: theme.colors.text }]}
              >
                Round {selectedRound}
              </Text>
              <ChevronDown size={16} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          {/* Football Pitch */}
          <TouchableOpacity
            style={styles.pitchContainer}
            onPress={() => {
              router.push({
                pathname: "/news/news-team-week-squad",
                params: {
                  round: selectedRound.toString(),
                },
              });
            }}
            activeOpacity={0.9}
          >
            <View style={styles.pitch}>
              {/* Goalkeeper */}
              <View style={styles.goalkeepersRow}>
                {formation.goalkeeper.map((player: Player) =>
                  renderPlayer(player, styles.goalkeeper),
                )}
              </View>

              {/* Defenders */}
              <View style={styles.defendersRow}>
                {formation.defenders.map((player: Player, index: number) =>
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
                {formation.midfielders.map((player: Player, index: number) =>
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
                {formation.forwards.map((player: Player, index: number) =>
                  renderPlayer(player, styles.forward),
                )}
              </View>
            </View>

            {/* Formation Info */}
            <View style={styles.formationInfo}>
              <Text style={styles.formationType}>Formation: 4-4-2</Text>
              <Text style={styles.updateDate}>Update Date: 12-01</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Promoted Teams */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Promoted Teams
          </Text>
          <View style={styles.teamsList}>
            {data.promotedTeams.map((team: Team) => renderTeamItem(team))}
          </View>
        </View>

        {/* Second Division */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Second Division
          </Text>
          <View style={styles.teamsList}>
            {data.secondDivision.map((team: Team) => renderTeamItem(team))}
          </View>
        </View>
      </ScrollView>

      {/* Round Selector Modal */}
      {data && (
        <NewsMatchesLeagueRoundSelector
          rounds={generateRounds()}
          selectedRound={selectedRound.toString()}
          onRoundChange={handleRoundChange}
          showModal={showRoundSelector}
          setShowModal={setShowRoundSelector}
          leagueName="Uganda Premier League"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingText: {
    textAlign: "center",
    marginTop: 50,
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    fontFamily: "Inter-SemiBold",
    marginBottom: 16,
  },
  roundSelector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  roundSelectorText: {
    fontSize: 14,
    marginRight: 4,
    fontFamily: "Inter-Medium",
  },
  topTeamsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 24,
  },
  topTeam: {
    alignItems: "center",
    flex: 1,
  },
  teamSeparator: {
    width: 1,
    height: 60,
    opacity: 0.3,
    marginHorizontal: 20,
  },
  topTeamLogo: {
    fontSize: 48,
    marginBottom: 8,
  },
  topTeamName: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Inter-SemiBold",
    marginBottom: 4,
  },
  topTeamDesc: {
    fontSize: 12,
    fontFamily: "Inter-Regular",
  },
  statsGrid: {
    gap: 16,
  },
  statItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  statLabel: {
    fontSize: 16,
    fontFamily: "Inter-Regular",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Inter-SemiBold",
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
  teamsList: {
    // Remove background and border to maintain uniform coloring
  },
  teamItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  teamInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  teamLogoContainer: {
    marginRight: 12,
  },
  valueContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  teamLogoImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#4CAF50",
    alignItems: "center",
    justifyContent: "center",
  },
  teamLogoFallback: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
    fontFamily: "Inter-Bold",
  },
  teamLogo: {
    fontSize: 24,
    marginRight: 0,
  },
  teamTextContainer: {
    flex: 1,
  },
  teamName: {
    fontSize: 16,
    fontFamily: "Inter-Medium",
    marginBottom: 2,
  },
  teamDescription: {
    fontSize: 12,
    fontFamily: "Inter-Regular",
  },
});
