import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Animated,
} from "react-native";
import { useRouter, useLocalSearchParams, Stack } from "expo-router";
import { useTheme } from "@/hooks/useTheme";
import {
  ArrowLeft,
  Star,
  Share2,
  ChevronDown,
  Trophy,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react-native";

const { width } = Dimensions.get("window");

interface TeamStanding {
  position: number;
  teamId: string;
  teamName: string;
  teamLogo: string;
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form: string[];
  status: "promotion" | "playoff" | "relegation" | "safe";
}

interface LeagueData {
  id: string;
  name: string;
  englishName: string;
  logo: string;
  backgroundColor: string;
  season: string;
  currentRound: number;
  totalRounds: number;
  seasonStart: string;
  seasonEnd: string;
  standings: TeamStanding[];
}

// Generate league data based on league ID
const generateLeagueData = (leagueId: string): LeagueData => {
  const leagues: Record<string, Partial<LeagueData>> = {
    "fufa-big-league": {
      id: "fufa-big-league",
      name: "FUFA Big League",
      englishName: "Uganda Second Division",
      logo: "FBL",
      backgroundColor: "#E53E3E",
      season: "2024/25",
      currentRound: 8,
      totalRounds: 42,
      seasonStart: "08/16",
      seasonEnd: "06/01",
    },
    "regional-leagues": {
      id: "regional-leagues",
      name: "Regional Leagues",
      englishName: "Uganda Third Division",
      logo: "REG",
      backgroundColor: "#3182CE",
      season: "2024/25",
      currentRound: 6,
      totalRounds: 30,
      seasonStart: "09/01",
      seasonEnd: "05/15",
    },
  };

  const baseLeague = leagues[leagueId] || leagues["fufa-big-league"];

  // Generate realistic team standings
  const teams = generateTeamStandings(leagueId);

  return {
    ...baseLeague,
    standings: teams,
  } as LeagueData;
};

const generateTeamStandings = (leagueId: string): TeamStanding[] => {
  const fufaBigLeagueTeams = [
    { name: "Kitara FC", logo: "KIT" },
    { name: "Mbale Heroes FC", logo: "MH" },
    { name: "Calvary FC", logo: "CAL" },
    { name: "Ndejje University FC", logo: "NU" },
    { name: "Bukedea TC", logo: "BTC" },
    { name: "Tooro United FC", logo: "TU" },
    { name: "Paidha Black Angels", logo: "PBA" },
    { name: "Adjumani TC", logo: "ATC" },
    { name: "Light SS", logo: "LSS" },
    { name: "Kigezi HomeBoyz", logo: "KHB" },
    { name: "Kataka FC", logo: "KFC" },
    { name: "Kyetume FC", logo: "KYE" },
    { name: "Dove FC", logo: "DOV" },
    { name: "Amuka Bright Stars", logo: "ABS" },
    { name: "Jinja North United", logo: "JNU" },
    { name: "Soroti City FC", logo: "SCF" },
    { name: "Masindi SS", logo: "MSS" },
    { name: "Royal Giants FC", logo: "RGF" },
    { name: "Gulu United FC", logo: "GUF" },
    { name: "Zombo FC", logo: "ZOM" },
    { name: "Kiboga Young FC", logo: "KYF" },
    { name: "Lugazi Municipal FC", logo: "LMF" },
  ];

  const regionalLeagueTeams = [
    { name: "Busoga Province", logo: "BP" },
    { name: "Buganda Province", logo: "BUG" },
    { name: "West Nile Province", logo: "WN" },
    { name: "Eastern Province", logo: "EP" },
    { name: "Central Province", logo: "CP" },
    { name: "Northern Province", logo: "NP" },
    { name: "Karamoja Province", logo: "KP" },
    { name: "Ankole Province", logo: "AP" },
    { name: "Toro Province", logo: "TP" },
    { name: "Kigezi Province", logo: "KG" },
    { name: "Lango Province", logo: "LP" },
    { name: "Acholi Province", logo: "AC" },
    { name: "Bukedi Province", logo: "BD" },
    { name: "Bunyoro Province", logo: "BY" },
    { name: "Sebei Province", logo: "SP" },
    { name: "Rwenzori Province", logo: "RP" },
  ];

  const teams = leagueId === "fufa-big-league" ? fufaBigLeagueTeams : regionalLeagueTeams;

  return teams.map((team, index) => {
    const matchesPlayed = 7;
    const wins = Math.max(0, Math.floor(Math.random() * 6) + (index < 3 ? 2 : 0));
    const losses = Math.floor(Math.random() * (matchesPlayed - wins));
    const draws = matchesPlayed - wins - losses;
    const goalsFor = wins * 2 + draws + Math.floor(Math.random() * 10);
    const goalsAgainst = losses * 2 + Math.floor(Math.random() * 8);
    const points = wins * 3 + draws;

    let status: TeamStanding["status"] = "safe";
    if (index < 2) status = "promotion";
    else if (index === 2) status = "playoff";
    else if (index >= teams.length - 3) status = "relegation";

    const formResults = ["W", "D", "L"];
    const form = Array(5).fill(0).map(() =>
      formResults[Math.floor(Math.random() * formResults.length)]
    );

    return {
      position: index + 1,
      teamId: `${team.name.toLowerCase().replace(/\s+/g, "-")}`,
      teamName: team.name,
      teamLogo: team.logo,
      matchesPlayed,
      wins,
      draws,
      losses,
      goalsFor,
      goalsAgainst,
      goalDifference: goalsFor - goalsAgainst,
      points,
      form,
      status,
    };
  }).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    return b.goalsFor - a.goalsFor;
  }).map((team, index) => ({ ...team, position: index + 1 }));
};

export default function NewsLowerLeagueTableStanding() {
  const router = useRouter();
  const theme = useTheme();
  const params = useLocalSearchParams();
  const scrollY = useRef(new Animated.Value(0)).current;

  const leagueId = (params.leagueId as string) || "fufa-big-league";
  const [leagueData, setLeagueData] = useState<LeagueData | null>(null);
  const [selectedTab, setSelectedTab] = useState("table");
  const [selectedFilter, setSelectedFilter] = useState("total");
  const [loading, setLoading] = useState(true);

  const isDarkMode = theme.colors.background === "#2A2A2A" || theme.colors.text === "#FFFFFF";

  const tabs = [
    { id: "news", label: "News" },
    { id: "overview", label: "Overview" },
    { id: "table", label: "Table" },
    { id: "matches", label: "Matches" },
    { id: "transfers", label: "Transfers" },
    { id: "stats", label: "Stats" },
    { id: "teams", label: "Teams" },
  ];

  const filters = [
    { id: "total", label: "Total" },
    { id: "home", label: "Home" },
    { id: "away", label: "Away" },
  ];

  useEffect(() => {
    loadLeagueData();
  }, [leagueId]);

  const loadLeagueData = async () => {
    try {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 500));

      const data = generateLeagueData(leagueId);
      setLeagueData(data);
    } catch (error) {
      console.error("Error loading league data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: TeamStanding["status"]) => {
    switch (status) {
      case "promotion": return "#4CAF50";
      case "playoff": return "#FF9800";
      case "relegation": return "#F44336";
      default: return "transparent";
    }
  };

  const getStatusLabel = (status: TeamStanding["status"]) => {
    switch (status) {
      case "promotion": return "Promotion";
      case "playoff": return "Playoff";
      case "relegation": return "Relegation";
      default: return "";
    }
  };

  const renderTeamRow = (team: TeamStanding) => (
    <TouchableOpacity
      key={team.teamId}
      style={[
        styles.teamRow,
        {
          backgroundColor: team.status !== "safe" ? `${getStatusColor(team.status)}20` : "transparent",
          borderLeftColor: getStatusColor(team.status),
          borderLeftWidth: team.status !== "safe" ? 4 : 0,
        }
      ]}
      activeOpacity={0.7}
      onPress={() => {
        router.push({
          pathname: "/team-details",
          params: {
            teamId: team.teamId,
            teamName: team.teamName,
          },
        });
      }}
    >
      <Text style={[styles.position, { color: theme.colors.text }]}>
        {team.position}
      </Text>

      <View style={styles.teamInfo}>
        <View style={styles.teamLogoContainer}>
          <Text style={styles.teamLogo}>{team.teamLogo}</Text>
        </View>
        <Text style={[styles.teamName, { color: theme.colors.text }]} numberOfLines={1}>
          {team.teamName}
        </Text>
      </View>

      <Text style={[styles.stat, { color: theme.colors.text }]}>
        {team.matchesPlayed}
      </Text>

      <Text style={[styles.stat, { color: theme.colors.text }]}>
        {team.wins}/{team.draws}/{team.losses}
      </Text>

      <Text style={[styles.stat, { color: theme.colors.text }]}>
        {team.goalsFor}/{team.goalsAgainst}
      </Text>

      <Text style={[styles.points, { color: theme.colors.text }]}>
        {team.points}
      </Text>
    </TouchableOpacity>
  );

  const renderStatusLegend = () => (
    <View style={styles.legendContainer}>
      {leagueData && leagueData.standings.some(team => team.status === "promotion") && (
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: "#4CAF50" }]} />
          <Text style={[styles.legendText, { color: theme.colors.text }]}>Promotion</Text>
        </View>
      )}
      {leagueData && leagueData.standings.some(team => team.status === "playoff") && (
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: "#FF9800" }]} />
          <Text style={[styles.legendText, { color: theme.colors.text }]}>Playoff</Text>
        </View>
      )}
      {leagueData && leagueData.standings.some(team => team.status === "relegation") && (
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: "#F44336" }]} />
          <Text style={[styles.legendText, { color: theme.colors.text }]}>Relegation</Text>
        </View>
      )}
    </View>
  );

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 200],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  if (loading || !leagueData) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            Loading league table...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

      {/* Animated Header */}
      <Animated.View
        style={[
          styles.animatedHeader,
          {
            backgroundColor: leagueData.backgroundColor,
            opacity: headerOpacity,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.animatedHeaderTitle}>{leagueData.name}</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton}>
            <Star size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Share2 size={24} color="white" />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false },
        )}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={[styles.heroSection, { backgroundColor: leagueData.backgroundColor }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="white" />
          </TouchableOpacity>

          <View style={styles.heroActions}>
            <TouchableOpacity style={styles.actionButton}>
              <Star size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Share2 size={24} color="white" />
            </TouchableOpacity>
          </View>

          <View style={styles.leagueInfo}>
            <View style={styles.leagueLogoContainer}>
              <Text style={styles.leagueLogoText}>{leagueData.logo}</Text>
            </View>
            <Text style={styles.leagueName}>{leagueData.name}</Text>
            <Text style={styles.leagueSubtitle}>{leagueData.englishName}</Text>
          </View>

          <View style={styles.seasonInfo}>
            <Text style={styles.seasonDate}>{leagueData.seasonStart}</Text>
            <Text style={styles.seasonDate}>{leagueData.seasonEnd}</Text>
          </View>

          <View style={styles.roundIndicator}>
            <Text style={styles.roundText}>
              {leagueData.currentRound}/{leagueData.totalRounds} Rounds
            </Text>
          </View>
        </View>

        {/* Navigation Tabs */}
        <View style={[styles.tabsContainer, { backgroundColor: theme.colors.background }]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tabsScroll}
          >
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tab, selectedTab === tab.id && styles.activeTab]}
                onPress={() => setSelectedTab(tab.id)}
              >
                <Text
                  style={[
                    styles.tabText,
                    {
                      color: selectedTab === tab.id ? leagueData.backgroundColor : theme.colors.text,
                    },
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity style={styles.seasonSelector}>
            <Text style={[styles.seasonSelectorText, { color: theme.colors.text }]}>
              25-26
            </Text>
            <ChevronDown size={16} color={theme.colors.text} />
          </TouchableOpacity>
        </View>

        {/* Table Filter Tabs */}
        {selectedTab === "table" && (
          <View style={styles.filterContainer}>
            {filters.map((filter) => (
              <TouchableOpacity
                key={filter.id}
                style={[
                  styles.filterTab,
                  selectedFilter === filter.id && [
                    styles.activeFilterTab,
                    { backgroundColor: leagueData.backgroundColor }
                  ]
                ]}
                onPress={() => setSelectedFilter(filter.id)}
              >
                <Text
                  style={[
                    styles.filterTabText,
                    {
                      color: selectedFilter === filter.id ? "white" : theme.colors.text,
                    },
                  ]}
                >
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Table Content */}
        {selectedTab === "table" && (
          <View style={styles.tableContainer}>
            {/* Table Header */}
            <View style={[styles.tableHeader, { backgroundColor: leagueData.backgroundColor }]}>
              <Text style={styles.headerText}>Teams</Text>
              <Text style={styles.headerText}>MP</Text>
              <Text style={styles.headerText}>W/D/L</Text>
              <Text style={styles.headerText}>GF/GA</Text>
              <Text style={styles.headerText}>Pts</Text>
            </View>

            {/* Promotion Zone Indicator */}
            {leagueData.standings.some(team => team.status === "promotion") && (
              <View style={[styles.zoneIndicator, { backgroundColor: "#4CAF50" }]}>
                <Text style={styles.zoneText}>Promotion</Text>
              </View>
            )}

            {/* Table Rows */}
            {leagueData.standings.map((team, index) => {
              const showPlayoffZone = team.status === "playoff" &&
                (index === 0 || leagueData.standings[index - 1].status !== "playoff");
              const showRelegationZone = team.status === "relegation" &&
                (index === 0 || leagueData.standings[index - 1].status !== "relegation");

              return (
                <View key={team.teamId}>
                  {showPlayoffZone && (
                    <View style={[styles.zoneIndicator, { backgroundColor: "#FF9800" }]}>
                      <Text style={styles.zoneText}>Promotion Playoff</Text>
                    </View>
                  )}
                  {showRelegationZone && (
                    <View style={[styles.zoneIndicator, { backgroundColor: "#F44336" }]}>
                      <Text style={styles.zoneText}>Relegation</Text>
                    </View>
                  )}
                  {renderTeamRow(team)}
                </View>
              );
            })}

            {/* Status Legend */}
            {renderStatusLegend()}
          </View>
        )}

        {/* Other Tab Contents */}
        {selectedTab !== "table" && (
          <View style={styles.comingSoonContainer}>
            <Trophy size={48} color={theme.colors.textSecondary} />
            <Text style={[styles.comingSoonText, { color: theme.colors.textSecondary }]}>
              {selectedTab.charAt(0).toUpperCase() + selectedTab.slice(1)} Coming Soon
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
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
  },
  loadingText: {
    fontSize: 16,
    fontFamily: "Inter-Medium",
  },
  animatedHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 16,
    zIndex: 1000,
  },
  animatedHeaderTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    fontFamily: "Inter-SemiBold",
  },
  headerButton: {
    padding: 8,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  heroSection: {
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 16,
    padding: 8,
    zIndex: 10,
  },
  heroActions: {
    position: "absolute",
    top: 50,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 10,
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  leagueInfo: {
    alignItems: "center",
    marginTop: 40,
    marginBottom: 32,
  },
  leagueLogoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 3,
    borderColor: "white",
  },
  leagueLogoText: {
    color: "white",
    fontSize: 32,
    fontWeight: "bold",
    fontFamily: "Inter-Bold",
  },
  leagueName: {
    color: "white",
    fontSize: 32,
    fontWeight: "bold",
    fontFamily: "Inter-Bold",
    marginBottom: 8,
    textAlign: "center",
  },
  leagueSubtitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 18,
    fontFamily: "Inter-Regular",
    textAlign: "center",
  },
  seasonInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  seasonDate: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    fontFamily: "Inter-SemiBold",
  },
  roundIndicator: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  roundText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter-SemiBold",
  },
  tabsContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(128,128,128,0.2)",
  },
  tabsScroll: {
    flex: 1,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 8,
  },
  activeTab: {
    borderBottomWidth: 3,
  },
  tabText: {
    fontSize: 16,
    fontWeight: "500",
    fontFamily: "Inter-Medium",
  },
  seasonSelector: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: "rgba(255,107,53,0.1)",
    marginRight: 16,
    gap: 4,
  },
  seasonSelectorText: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter-SemiBold",
  },
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(128,128,128,0.3)",
  },
  activeFilterTab: {
    borderColor: "transparent",
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: "500",
    fontFamily: "Inter-Medium",
  },
  tableContainer: {
    flex: 1,
  },
  tableHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter-SemiBold",
    flex: 1,
    textAlign: "center",
  },
  zoneIndicator: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    alignItems: "center",
  },
  zoneText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "Inter-SemiBold",
  },
  teamRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(128,128,128,0.1)",
  },
  position: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Inter-SemiBold",
    width: 30,
    textAlign: "center",
  },
  teamInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 2,
    marginLeft: 8,
  },
  teamLogoContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#4CAF50",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  teamLogo: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
    fontFamily: "Inter-Bold",
  },
  teamName: {
    fontSize: 14,
    fontWeight: "500",
    fontFamily: "Inter-Medium",
    flex: 1,
  },
  stat: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
    flex: 1,
    textAlign: "center",
  },
  points: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Inter-SemiBold",
    flex: 1,
    textAlign: "center",
  },
  legendContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 16,
    paddingVertical: 20,
    flexWrap: "wrap",
    gap: 12,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  legendText: {
    fontSize: 12,
    fontFamily: "Inter-Regular",
  },
  comingSoonContainer: {
    paddingVertical: 60,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  comingSoonText: {
    fontSize: 16,
    fontFamily: "Inter-Medium",
    textAlign: "center",
    opacity: 0.6,
  },
});
