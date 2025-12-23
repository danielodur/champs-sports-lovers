import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Animated,
  StatusBar,
  Dimensions,
  StyleSheet,
} from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  ArrowLeft,
  Star,
  Share2,
  Trophy,
  ChevronDown,
  Award,
  Zap,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
  competitionZone:
    | "champions-league"
    | "europa-league"
    | "conference-league"
    | "relegation"
    | "safe";
}

interface LeagueTableData {
  id: string;
  name: string;
  englishName: string;
  country: string;
  logo: string;
  season: string;
  currentRound: number;
  totalRounds: number;
  seasonStart: string;
  seasonEnd: string;
  standings: TeamStanding[];
  competitionRules: CompetitionRule[];
}

interface CompetitionRule {
  zone: string;
  description: string;
  positions: string;
  color: string;
}

const generateLeagueTableData = (leagueId: string): LeagueTableData => {
  const leagues: Record<string, Partial<LeagueTableData>> = {
    "spanish-la-liga": {
      id: "spanish-la-liga",
      name: "Spanish La Liga",
      englishName: "Spanish La Liga",
      country: "Spain",
      logo: "LL",
      season: "2024/25",
      currentRound: 8,
      totalRounds: 38,
      seasonStart: "08/16",
      seasonEnd: "05/25",
      competitionRules: [
        {
          zone: "Champions League",
          description:
            "Top 4 teams qualify directly for Champions League group stage",
          positions: "1st-4th",
          color: "#4CAF50",
        },
        {
          zone: "Europa League",
          description: "5th place qualifies for Europa League group stage",
          positions: "5th",
          color: "#FF9800",
        },
        {
          zone: "Conference League",
          description: "6th place qualifies for Conference League playoffs",
          positions: "6th",
          color: "#2196F3",
        },
        {
          zone: "Relegation",
          description: "Bottom 3 teams are relegated to Segunda División",
          positions: "18th-20th",
          color: "#F44336",
        },
      ],
    },
    "english-premier-league": {
      id: "english-premier-league",
      name: "English Premier League",
      englishName: "English Premier League",
      country: "England",
      logo: "EPL",
      season: "2024/25",
      currentRound: 7,
      totalRounds: 38,
      seasonStart: "08/16",
      seasonEnd: "05/25",
      competitionRules: [
        {
          zone: "Champions League",
          description:
            "Top 4 teams qualify directly for Champions League group stage",
          positions: "1st-4th",
          color: "#4CAF50",
        },
        {
          zone: "Europa League",
          description: "5th place qualifies for Europa League group stage",
          positions: "5th",
          color: "#FF9800",
        },
        {
          zone: "Conference League",
          description: "6th place qualifies for Conference League playoffs",
          positions: "6th",
          color: "#2196F3",
        },
        {
          zone: "Relegation",
          description: "Bottom 3 teams are relegated to Championship",
          positions: "18th-20th",
          color: "#F44336",
        },
      ],
    },
    "uganda-premier-league": {
      id: "uganda-premier-league",
      name: "Uganda Premier League",
      englishName: "Uganda Premier League",
      country: "Uganda",
      logo: "UPL",
      season: "2024/25",
      currentRound: 12,
      totalRounds: 30,
      seasonStart: "08/30",
      seasonEnd: "05/25",
      competitionRules: [
        {
          zone: "CAF Champions League",
          description: "1st place qualifies for CAF Champions League",
          positions: "1st",
          color: "#4CAF50",
        },
        {
          zone: "CAF Confederation Cup",
          description: "2nd place qualifies for CAF Confederation Cup",
          positions: "2nd",
          color: "#FF9800",
        },
        {
          zone: "Relegation",
          description: "Bottom 2 teams are relegated to FUFA Big League",
          positions: "15th-16th",
          color: "#F44336",
        },
      ],
    },
  };

  const baseLeague = leagues[leagueId] || leagues["uganda-premier-league"];
  const teams = generateTeamStandings(leagueId);

  return {
    ...baseLeague,
    standings: teams,
  } as LeagueTableData;
};

const generateTeamStandings = (leagueId: string): TeamStanding[] => {
  const spanishTeams = [
    { name: "Barcelona", logo: "BAR", id: "barcelona" },
    { name: "Real Madrid", logo: "RMA", id: "real-madrid" },
    { name: "Villarreal", logo: "VIL", id: "villarreal" },
    { name: "Elche", logo: "ELC", id: "elche" },
    { name: "Atletico Madrid", logo: "ATM", id: "atletico-madrid" },
    { name: "Real Betis", logo: "BET", id: "real-betis" },
    { name: "Espanyol", logo: "ESP", id: "espanyol" },
    { name: "Getafe", logo: "GET", id: "getafe" },
    { name: "Sevilla", logo: "SEV", id: "sevilla" },
    { name: "Athletic Bilbao", logo: "ATH", id: "athletic-bilbao" },
    { name: "Osasuna", logo: "OSA", id: "osasuna" },
    { name: "Alaves", logo: "ALA", id: "alaves" },
    { name: "Valencia", logo: "VAL", id: "valencia" },
    { name: "Real Oviedo", logo: "OVI", id: "real-oviedo" },
    { name: "Levante", logo: "LEV", id: "levante" },
    { name: "Rayo Vallecano", logo: "RAY", id: "rayo-vallecano" },
    { name: "Celta Vigo", logo: "CEL", id: "celta-vigo" },
    { name: "Real Sociedad", logo: "SOC", id: "real-sociedad" },
    { name: "Real Mallorca", logo: "MAL", id: "real-mallorca" },
    { name: "Granada", logo: "GRA", id: "granada" },
  ];

  const ugandanTeams = [
    { name: "Vipers SC", logo: "VIP", id: "vipers-sc" },
    { name: "KCCA FC", logo: "KCC", id: "kcca-fc" },
    { name: "SC Villa", logo: "VIL", id: "sc-villa" },
    { name: "Express FC", logo: "EXP", id: "express-fc" },
    { name: "URA FC", logo: "URA", id: "ura-fc" },
    { name: "BUL FC", logo: "BUL", id: "bul-fc" },
    { name: "NEC FC", logo: "NEC", id: "nec-fc" },
    { name: "Wakiso Giants", logo: "WAK", id: "wakiso-giants" },
    { name: "Police FC", logo: "POL", id: "police-fc" },
    { name: "Kitara FC", logo: "KIT", id: "kitara-fc" },
    { name: "Mbarara City", logo: "MBA", id: "mbarara-city" },
    { name: "Maroons FC", logo: "MAR", id: "maroons-fc" },
    { name: "Bright Stars", logo: "BRI", id: "bright-stars" },
    { name: "Arua Hill SC", logo: "ARU", id: "arua-hill-sc" },
    { name: "Lugazi FC", logo: "LUG", id: "lugazi-fc" },
    { name: "Gaddafi FC", logo: "GAD", id: "gaddafi-fc" },
  ];

  const teams =
    leagueId === "uganda-premier-league" ? ugandanTeams : spanishTeams;

  return teams.map((team, index) => {
    const position = index + 1;
    const matchesPlayed =
      leagueId === "uganda-premier-league"
        ? Math.floor(Math.random() * 2) + 11
        : Math.floor(Math.random() * 3) + 7;
    const wins = Math.floor(Math.random() * matchesPlayed);
    const losses = Math.floor(Math.random() * (matchesPlayed - wins));
    const draws = matchesPlayed - wins - losses;
    const goalsFor =
      leagueId === "uganda-premier-league"
        ? Math.floor(Math.random() * 20) + 8
        : Math.floor(Math.random() * 25) + 5;
    const goalsAgainst =
      leagueId === "uganda-premier-league"
        ? Math.floor(Math.random() * 15) + 3
        : Math.floor(Math.random() * 20) + 3;
    const points = wins * 3 + draws;

    let competitionZone: TeamStanding["competitionZone"] = "safe";

    // Different competition zones based on league
    if (leagueId === "uganda-premier-league") {
      if (position === 1)
        competitionZone = "champions-league"; // CAF Champions League
      else if (position === 2)
        competitionZone = "europa-league"; // CAF Confederation Cup
      else if (position >= teams.length - 1) competitionZone = "relegation"; // Bottom 2 teams
    } else {
      // European leagues (Spanish La Liga, Premier League, etc.)
      if (position <= 4) competitionZone = "champions-league";
      else if (position === 5) competitionZone = "europa-league";
      else if (position === 6) competitionZone = "conference-league";
      else if (position >= 18) competitionZone = "relegation";
    }

    return {
      position,
      teamId: team.id,
      teamName: team.name,
      teamLogo: team.logo,
      matchesPlayed,
      wins,
      draws,
      losses,
      goalsFor,
      goalsAgainst,
      goalDifference: goalsFor - goalsAgainst,
      points:
        leagueId === "uganda-premier-league"
          ? Math.max(0, 24 - index * 2 + Math.floor(Math.random() * 4))
          : 19 - index + Math.floor(Math.random() * 3),
      form: ["W", "L", "D", "W", "W"].slice(0, 5),
      competitionZone,
    };
  });
};

const getLeagueGradientColors = (leagueId: string) => {
  const gradients: Record<string, string[]> = {
    "spanish-la-liga": ["#8B0000", "#B22222", "#DC143C"],
    "english-premier-league": ["#3B0764", "#6B21A8", "#9333EA"],
    "uganda-premier-league": ["#FFD700", "#FF6B35", "#8B4513"],
  };
  return gradients[leagueId] || gradients["uganda-premier-league"];
};

const getCompetitionZoneColor = (zone: TeamStanding["competitionZone"]) => {
  switch (zone) {
    case "champions-league":
      return "#4CAF50";
    case "europa-league":
      return "#FF9800";
    case "conference-league":
      return "#2196F3";
    case "relegation":
      return "#F44336";
    default:
      return "transparent";
  }
};

const getCompetitionZoneLabel = (zone: TeamStanding["competitionZone"]) => {
  switch (zone) {
    case "champions-league":
      return "Champions League";
    case "europa-league":
      return "Europa League";
    case "conference-league":
      return "Conference League";
    case "relegation":
      return "Relegation";
    default:
      return "";
  }
};

interface NewsLeagueTableStandingsProps {
  leagueId?: string;
  teamName?: string;
  embedded?: boolean;
}

export default function NewsLeagueTableStandings({
  leagueId: propLeagueId,
  teamName,
  embedded = false,
}: NewsLeagueTableStandingsProps) {
  const router = useRouter();
  const theme = useTheme();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  // Enhanced league detection with Uganda sports context priority
  const source = params.source as string;
  const context = params.context as string;

  const leagueId =
    propLeagueId ||
    (params.leagueId as string) ||
    (source === "uganda-sports" || context === "uganda-sports"
      ? "uganda-premier-league"
      : "spanish-la-liga");
  const [leagueData, setLeagueData] = useState<LeagueTableData | null>(null);
  const [selectedTab, setSelectedTab] = useState("table");
  const [selectedFilter, setSelectedFilter] = useState("total");
  const [selectedSeason, setSelectedSeason] = useState("24-25");
  const [isStarred, setIsStarred] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [loading, setLoading] = useState(true);

  const isDarkMode =
    theme.colors.background === "#2A2A2A" || theme.colors.text === "#FFFFFF";
  const gradientColors = getLeagueGradientColors(leagueId);

  const tabs = [
    { id: "news", label: "News" },
    { id: "overview", label: "Overview" },
    { id: "table", label: "Table" },
    { id: "matches", label: "Matches" },
    { id: "transfers", label: "Transfers" },
    { id: "data", label: "Data" },
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
      await new Promise((resolve) => setTimeout(resolve, 500));
      const data = generateLeagueTableData(leagueId);
      setLeagueData(data);
    } catch (error) {
      console.error("Error loading league data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStarPress = () => {
    setIsStarred(!isStarred);
  };

  const handleShare = async () => {
    console.log("Share button pressed");
  };

  const renderTeamRow = (team: TeamStanding) => (
    <TouchableOpacity
      key={team.teamId}
      style={[
        styles.teamRow,
        {
          backgroundColor:
            team.competitionZone !== "safe"
              ? `${getCompetitionZoneColor(team.competitionZone)}15`
              : "transparent",
          borderLeftColor: getCompetitionZoneColor(team.competitionZone),
          borderLeftWidth: team.competitionZone !== "safe" ? 3 : 0,
        },
      ]}
      activeOpacity={0.7}
      onPress={() => {
        router.push({
          pathname: "/team-details",
          params: {
            teamId: team.teamId,
            teamName: team.teamName,
            sport: "football", // ✅ Add sport parameter (this component is football-specific)
          },
        });
      }}
    >
      <View style={styles.positionContainer}>
        <Text style={[styles.position, { color: theme.colors.text }]}>
          {team.position}
        </Text>
      </View>

      <View style={styles.teamInfo}>
        <View
          style={[
            styles.teamLogoContainer,
            { backgroundColor: theme.colors.backgroundSecondary },
          ]}
        >
          <Text style={[styles.teamLogo, { color: theme.colors.text }]}>
            {team.teamLogo}
          </Text>
        </View>
        <Text
          style={[styles.teamName, { color: theme.colors.text }]}
          numberOfLines={1}
        >
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

  const renderCompetitionRules = () => (
    <View style={styles.rulesContainer}>
      <TouchableOpacity
        style={styles.rulesHeader}
        onPress={() => setShowRules(!showRules)}
      >
        <Text style={[styles.rulesTitle, { color: theme.colors.text }]}>
          Competition Rules
        </Text>
        <ChevronDown
          size={20}
          color={theme.colors.text}
          style={{
            transform: [{ rotate: showRules ? "180deg" : "0deg" }],
          }}
        />
      </TouchableOpacity>

      {showRules && (
        <View style={styles.rulesContent}>
          <Text
            style={[styles.rulesSectionTitle, { color: theme.colors.text }]}
          >
            {leagueData?.name} Qualification Rules
          </Text>

          <View style={styles.rulesList}>
            <Text style={[styles.ruleItem, { color: theme.colors.text }]}>
              1. Each team earns 3 points for a win, 1 point for a draw, 0
              points for a loss
            </Text>
            <Text style={[styles.ruleItem, { color: theme.colors.text }]}>
              2. At the end of the season, teams with more points are ranked
              higher
            </Text>
            <Text style={[styles.ruleItem, { color: theme.colors.text }]}>
              3. If two or more teams have equal points, ranking is determined
              by:
            </Text>

            <View style={styles.subRules}>
              <Text style={[styles.subRuleItem, { color: theme.colors.text }]}>
                a) Head-to-head record
              </Text>
              <Text style={[styles.subRuleItem, { color: theme.colors.text }]}>
                b) Goal difference
              </Text>
              <Text style={[styles.subRuleItem, { color: theme.colors.text }]}>
                c) Total goals scored
              </Text>
              <Text style={[styles.subRuleItem, { color: theme.colors.text }]}>
                d) Fair play points
              </Text>
            </View>
          </View>

          <Text
            style={[styles.rulesSectionTitle, { color: theme.colors.text }]}
          >
            Qualification and Relegation
          </Text>

          {leagueData?.competitionRules.map((rule, index) => (
            <View
              key={index}
              style={[
                styles.competitionRule,
                { backgroundColor: theme.colors.backgroundSecondary },
              ]}
            >
              <View
                style={[
                  styles.ruleColorIndicator,
                  { backgroundColor: rule.color },
                ]}
              />
              <View style={styles.ruleContent}>
                <Text style={[styles.ruleZone, { color: theme.colors.text }]}>
                  {rule.positions} - {rule.zone}
                </Text>
                <Text
                  style={[
                    styles.ruleDescription,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {rule.description}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  if (loading || !leagueData) {
    return (
      <View
        style={[
          styles.container,
          styles.loadingContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <Text style={[styles.loadingText, { color: theme.colors.text }]}>
          Loading league standings...
        </Text>
      </View>
    );
  }

  // If embedded (used inside another component), render without header
  if (embedded) {
    return (
      <View
        style={[
          styles.embeddedContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        {/* Filter tabs */}
        <View
          style={[
            styles.filtersContainer,
            { backgroundColor: theme.colors.background },
          ]}
        >
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter.id}
              style={[
                styles.filterTab,
                {
                  borderColor: isDarkMode
                    ? theme.colors.border
                    : "rgba(0,0,0,0.2)",
                  backgroundColor: isDarkMode
                    ? theme.colors.backgroundSecondary
                    : "transparent",
                },
                selectedFilter === filter.id && [
                  styles.activeFilterTab,
                  { borderColor: gradientColors[2] },
                ],
              ]}
              onPress={() => setSelectedFilter(filter.id)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: theme.colors.text },
                  selectedFilter === filter.id && [
                    styles.activeFilterText,
                    { color: gradientColors[2] },
                  ],
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Table header */}
        <View
          style={[
            styles.tableHeader,
            { backgroundColor: theme.colors.backgroundSecondary },
          ]}
        >
          <Text style={[styles.headerText, { color: theme.colors.text }]}>
            Team
          </Text>
          <Text style={[styles.headerText, { color: theme.colors.text }]}>
            MP
          </Text>
          <Text style={[styles.headerText, { color: theme.colors.text }]}>
            W/D/L
          </Text>
          <Text style={[styles.headerText, { color: theme.colors.text }]}>
            GF/GA
          </Text>
          <Text style={[styles.headerText, { color: theme.colors.text }]}>
            Pts
          </Text>
        </View>

        {/* League standings */}
        <ScrollView
          style={[
            styles.embeddedScrollView,
            { backgroundColor: theme.colors.background },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[
              styles.standingsContainer,
              { backgroundColor: theme.colors.background },
            ]}
          >
            {leagueData.standings.map(renderTeamRow)}
          </View>

          {/* Competition rules */}
          {renderCompetitionRules()}
        </ScrollView>
      </View>
    );
  }

  // Full standalone component with header
  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      {/* Header with gradient background */}
      <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
        <View
          style={[styles.gradientBase, { backgroundColor: gradientColors[0] }]}
        />
        <View
          style={[
            styles.gradientMiddle,
            { backgroundColor: gradientColors[1] },
          ]}
        />
        <View
          style={[styles.gradientTop, { backgroundColor: gradientColors[2] }]}
        />

        {/* Header content */}
        <View style={styles.headerContent}>
          <View style={styles.topNavBar}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <ArrowLeft size={24} color="white" />
            </TouchableOpacity>

            <View style={styles.topRightButtons}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={handleStarPress}
                activeOpacity={0.7}
              >
                <Star
                  size={24}
                  color={isStarred ? "#FFD700" : "white"}
                  fill={isStarred ? "#FFD700" : "transparent"}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.iconButton}
                onPress={handleShare}
                activeOpacity={0.7}
              >
                <Share2 size={24} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          {/* League info */}
          <View style={styles.leagueInfoContainer}>
            <View style={styles.leagueLogo}>
              <Text style={styles.leagueLogoText}>{leagueData.logo}</Text>
            </View>
            <Text style={styles.leagueName}>{leagueData.name}</Text>
            <Text style={styles.leagueSubtitle}>{leagueData.englishName}</Text>
          </View>

          {/* Season info */}
          <TouchableOpacity style={styles.seasonInfo} activeOpacity={0.7}>
            <Text style={styles.seasonText}>
              {leagueData.seasonStart} - {leagueData.seasonEnd}
            </Text>
            <Text style={styles.roundText}>
              {leagueData.currentRound}/{leagueData.totalRounds} Round
            </Text>
            <ChevronDown size={16} color="rgba(255, 255, 255, 0.8)" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Navigation tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabsContainer}
          contentContainerStyle={styles.tabsContent}
        >
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, selectedTab === tab.id && styles.activeTab]}
              onPress={() => setSelectedTab(tab.id)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: theme.colors.text },
                  selectedTab === tab.id && styles.activeTabText,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Filter tabs */}
        <View style={styles.filtersContainer}>
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter.id}
              style={[
                styles.filterTab,
                selectedFilter === filter.id && [
                  styles.activeFilterTab,
                  { borderColor: gradientColors[2] },
                ],
              ]}
              onPress={() => setSelectedFilter(filter.id)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: theme.colors.text },
                  selectedFilter === filter.id && [
                    styles.activeFilterText,
                    { color: gradientColors[2] },
                  ],
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Table header */}
        <View
          style={[
            styles.tableHeader,
            { backgroundColor: theme.colors.backgroundSecondary },
          ]}
        >
          <Text style={[styles.headerText, { color: theme.colors.text }]}>
            Team
          </Text>
          <Text style={[styles.headerText, { color: theme.colors.text }]}>
            MP
          </Text>
          <Text style={[styles.headerText, { color: theme.colors.text }]}>
            W/D/L
          </Text>
          <Text style={[styles.headerText, { color: theme.colors.text }]}>
            GF/GA
          </Text>
          <Text style={[styles.headerText, { color: theme.colors.text }]}>
            Pts
          </Text>
        </View>

        {/* League standings */}
        <View style={styles.standingsContainer}>
          {leagueData.standings.map(renderTeamRow)}
        </View>

        {/* Competition rules */}
        {renderCompetitionRules()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    textAlign: "center",
  },
  embeddedContainer: {
    flex: 1,
  },
  embeddedScrollView: {
    flex: 1,
  },
  headerContainer: {
    height: 200,
    position: "relative",
  },
  gradientBase: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gradientMiddle: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.8,
  },
  gradientTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.6,
  },
  headerContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  topNavBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  topRightButtons: {
    flexDirection: "row",
  },
  iconButton: {
    padding: 8,
    marginLeft: 12,
  },
  leagueInfoContainer: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  leagueLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  leagueLogoText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  leagueName: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 4,
  },
  leagueSubtitle: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 16,
    textAlign: "center",
  },
  seasonInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
  },
  seasonText: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 14,
    fontWeight: "500",
    marginRight: 8,
  },
  roundText: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 14,
    fontWeight: "500",
    marginRight: 8,
  },
  content: {
    flex: 1,
  },
  tabsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  tabsScroll: {
    flex: 1,
  },
  tabsContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  tab: {
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 20,
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: "#FF6B35",
  },
  tabText: {
    fontSize: 16,
    fontWeight: "500",
  },
  activeTabText: {
    color: "#FF6B35",
    fontWeight: "600",
  },
  tabContent: {
    padding: 16,
  },
  newsItem: {
    flexDirection: "row",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  newsContent: {
    flex: 1,
    paddingRight: 12,
  },
  newsTitle: {
    fontSize: 16,
    fontWeight: "500",
    lineHeight: 22,
    marginBottom: 8,
  },
  newsTime: {
    fontSize: 12,
  },
  newsImage: {
    width: 80,
    height: 60,
    borderRadius: 8,
  },
  comingSoonText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 40,
  },
  seasonSelector: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.05)",
    gap: 4,
  },
  filtersContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  activeFilterTab: {
    backgroundColor: "rgba(220, 20, 60, 0.1)",
    borderColor: "#DC143C",
  },
  filterText: {
    fontSize: 14,
    fontWeight: "500",
  },
  activeFilterText: {
    fontWeight: "600",
  },
  tableHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.2)",
  },
  headerText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    flex: 1,
  },
  standingsContainer: {
    paddingHorizontal: 16,
  },
  teamRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  positionContainer: {
    width: 30,
    alignItems: "center",
  },
  position: {
    fontSize: 14,
    fontWeight: "600",
  },
  teamInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 12,
  },
  teamLogoContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  teamLogo: {
    fontSize: 10,
    fontWeight: "bold",
  },
  teamName: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  stat: {
    fontSize: 12,
    fontWeight: "500",
    width: 50,
    textAlign: "center",
  },
  points: {
    fontSize: 14,
    fontWeight: "bold",
    width: 40,
    textAlign: "center",
  },
  rulesContainer: {
    padding: 16,
    marginTop: 24,
  },
  rulesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  rulesTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  rulesContent: {
    marginTop: 16,
  },
  rulesSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    marginTop: 16,
  },
  rulesList: {
    marginBottom: 16,
  },
  ruleItem: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  subRules: {
    marginLeft: 16,
    marginTop: 8,
  },
  subRuleItem: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  competitionRule: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
    padding: 12,
    borderRadius: 8,
  },
  ruleColorIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 12,
  },
  ruleContent: {
    flex: 1,
  },
  ruleZone: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  ruleDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
});
