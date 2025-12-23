import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  Animated,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Stack } from "expo-router";
import { useTheme } from "@/hooks/useTheme";
import {
  ArrowLeft,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Trophy,
  Users,
  Activity,
  Target,
  TrendingUp,
  Star,
  Share2,
  Database,
} from "lucide-react-native";
import NewsSeasonsSelector from "@/modules/news/components/shared/news-seasons-selector";
import NewsMatchesLeagueRoundSelector from "@/modules/news/components/shared/news-matches-league-round-selector";
import NewsTeamMoments from "@/modules/news/components/shared/news-team-moments";
import NewsTeamDraft from "@/modules/news/components/content/shared/news-team-draft";
import NewsLeagueTableStandings from "@/modules/news/components/shared/news-league-table-standings";
import NewsTeamTransfersScreen from "@/modules/news/screens/news-team-transfers";
import NewsTeamDataScreen from "@/modules/news/screens/news-team-data";
import NewsTeamRankingsScreen from "@/modules/news/screens/news-team-rankings";
import NewsTeamPlayersScreen from "@/modules/news/screens/news-team-players";

const { width } = Dimensions.get("window");

interface Match {
  id: string;
  date: string;
  time: string;
  homeTeam: string;
  awayTeam: string;
  homeScore?: number;
  awayScore?: number;
  homeLogoUrl?: string;
  awayLogoUrl?: string;
  playerName?: string;
  playerRating?: number;
  matchStatus?: string;
  minute?: string;
  competition?: string;
  venue?: string;
}

interface Round {
  id: string;
  name: string;
  matches: Match[];
}

interface LeagueData {
  id: string;
  name: string;
  country: string;
  season: string;
  currentRound: number;
  totalRounds: number;
  teams: string[];
}

interface TeamData {
  id: string;
  name: string;
  englishName: string;
  logo: string;
  primaryColor: string;
  secondaryColor: string;
  league: string;
  country: string;
}

// Global team configurations for different leagues
const getLeagueGradientColors = (league: string): [string, string, string] => {
  switch (league) {
    case "la-liga":
    case "spanish-la-liga":
      return ["#DC143C", "#B91C3C", "#A0152B"];
    case "premier-league":
    case "english-premier-league":
      return ["#37003C", "#6C1D5F", "#8B2F7A"];
    case "bundesliga":
    case "german-bundesliga":
      return ["#D4AF37", "#B8860B", "#A0722C"];
    case "serie-a":
    case "italian-serie-a":
      return ["#004225", "#006837", "#228B22"];
    case "ligue-1":
    case "french-ligue-1":
      return ["#1E3A8A", "#1D4ED8", "#3B82F6"];
    case "uganda-premier-league":
      return ["#FFD700", "#FFA500", "#FF8C00"];
    default:
      return ["#DC143C", "#B91C3C", "#A0152B"];
  }
};

const LEAGUE_CONFIGURATIONS: { [key: string]: LeagueData } = {
  "uganda-premier-league": {
    id: "uganda-premier-league",
    name: "Uganda Premier League",
    country: "Uganda",
    season: "2024/25",
    currentRound: 8,
    totalRounds: 30,
    teams: [
      "Vipers SC",
      "NEC FC",
      "BUL FC",
      "URA FC",
      "KCCA FC",
      "SC Villa",
      "Kitara FC",
      "Express FC",
      "Police FC",
      "Lugazi FC",
      "Wakiso Giants",
      "Maroons FC",
      "Arua Hill SC",
      "Bright Stars FC",
    ],
  },
  "premier-league": {
    id: "premier-league",
    name: "Premier League",
    country: "England",
    season: "2024/25",
    currentRound: 12,
    totalRounds: 38,
    teams: [
      "Manchester City",
      "Arsenal",
      "Liverpool",
      "Chelsea",
      "Newcastle United",
      "Manchester United",
      "Tottenham",
      "Brighton",
      "Aston Villa",
      "West Ham",
      "Crystal Palace",
      "Fulham",
      "Brentford",
      "Nottingham Forest",
      "Everton",
      "Wolves",
      "Bournemouth",
      "Sheffield United",
      "Luton Town",
      "Burnley",
    ],
  },
  "la-liga": {
    id: "la-liga",
    name: "La Liga",
    country: "Spain",
    season: "2024/25",
    currentRound: 14,
    totalRounds: 38,
    teams: [
      "Real Madrid",
      "Barcelona",
      "Atletico Madrid",
      "Real Sociedad",
      "Athletic Bilbao",
      "Real Betis",
      "Villarreal",
      "Valencia",
      "Sevilla",
      "Elche",
      "Girona",
      "Las Palmas",
      "Osasuna",
      "Getafe",
      "Rayo Vallecano",
      "Mallorca",
      "Celta Vigo",
      "Cadiz",
      "Alaves",
      "Almeria",
    ],
  },
  bundesliga: {
    id: "bundesliga",
    name: "Bundesliga",
    country: "Germany",
    season: "2024/25",
    currentRound: 11,
    totalRounds: 34,
    teams: [
      "Bayern Munich",
      "Borussia Dortmund",
      "RB Leipzig",
      "Bayer Leverkusen",
      "Eintracht Frankfurt",
      "VfL Wolfsburg",
      "Borussia Monchengladbach",
      "Union Berlin",
      "Freiburg",
      "Stuttgart",
      "Werder Bremen",
      "Augsburg",
      "Mainz",
      "Hoffenheim",
      "Hertha Berlin",
      "Schalke 04",
      "Cologne",
      "Bochum",
    ],
  },
  "serie-a": {
    id: "serie-a",
    name: "Serie A",
    country: "Italy",
    season: "2024/25",
    currentRound: 13,
    totalRounds: 38,
    teams: [
      "Juventus",
      "AC Milan",
      "Inter Milan",
      "Napoli",
      "AS Roma",
      "Lazio",
      "Atalanta",
      "Fiorentina",
      "Bologna",
      "Torino",
      "Udinese",
      "Genoa",
      "Empoli",
      "Lecce",
      "Sassuolo",
      "Cagliari",
      "Verona",
      "Monza",
      "Spezia",
      "Cremonese",
    ],
  },
  "ligue-1": {
    id: "ligue-1",
    name: "Ligue 1",
    country: "France",
    season: "2024/25",
    currentRound: 12,
    totalRounds: 38,
    teams: [
      "Paris Saint-Germain",
      "Marseille",
      "Lyon",
      "Monaco",
      "Lille",
      "Rennes",
      "Nice",
      "Strasbourg",
      "Lens",
      "Montpellier",
      "Nantes",
      "Brest",
      "Reims",
      "Toulouse",
      "Clermont",
      "Lorient",
      "Troyes",
      "Auxerre",
      "Ajaccio",
      "Angers",
    ],
  },
};

// Smart function to generate league-specific fixture data
const generateLeagueFixtures = (
  leagueId: string,
  teamName?: string,
): Round[] => {
  const league =
    LEAGUE_CONFIGURATIONS[leagueId] ||
    LEAGUE_CONFIGURATIONS["uganda-premier-league"];
  const rounds: Round[] = [];

  for (
    let roundNum = 1;
    roundNum <= Math.min(league.totalRounds, 10);
    roundNum++
  ) {
    const matches: Match[] = [];
    const roundTeams = [...league.teams];

    // Generate matches for this round
    for (let i = 0; i < Math.floor(roundTeams.length / 2); i++) {
      const homeIdx = i;
      const awayIdx = roundTeams.length - 1 - i;
      const homeTeam = roundTeams[homeIdx];
      const awayTeam = roundTeams[awayIdx];

      // Generate realistic scores for completed matches
      const isCompleted = roundNum < league.currentRound;
      const homeScore = isCompleted ? Math.floor(Math.random() * 4) : undefined;
      const awayScore = isCompleted ? Math.floor(Math.random() * 4) : undefined;

      // Generate match date (spread over weekend)
      const matchDate = new Date();
      matchDate.setDate(
        matchDate.getDate() + (roundNum - league.currentRound) * 7 + (i % 3),
      );

      matches.push({
        id: `${roundNum}-${i}`,
        date: matchDate.toLocaleDateString("en-CA"),
        time: `${15 + (i % 3)}:${i % 2 === 0 ? "00" : "30"}`,
        homeTeam,
        awayTeam,
        homeScore,
        awayScore,
        homeLogoUrl: generateTeamLogo(homeTeam),
        awayLogoUrl: generateTeamLogo(awayTeam),
        playerName: isCompleted
          ? generatePlayerName(homeScore! > awayScore! ? homeTeam : awayTeam)
          : undefined,
        playerRating: isCompleted
          ? +(6.0 + Math.random() * 3.0).toFixed(1)
          : undefined,
        matchStatus: isCompleted
          ? "FT"
          : roundNum === league.currentRound
            ? "Live"
            : "Upcoming",
        minute: isCompleted ? "90'" : undefined,
        competition: league.name,
        venue: `${homeTeam} Stadium`,
      });
    }

    rounds.push({
      id: `round${roundNum}`,
      name: `Round ${roundNum}`,
      matches: teamName
        ? matches.filter(
            (m) =>
              m.homeTeam.toLowerCase().includes(teamName.toLowerCase()) ||
              m.awayTeam.toLowerCase().includes(teamName.toLowerCase()) ||
              teamName.toLowerCase().includes(m.homeTeam.toLowerCase()) ||
              teamName.toLowerCase().includes(m.awayTeam.toLowerCase()),
          )
        : matches,
    });
  }

  return rounds;
};

// Helper functions
const generateTeamLogo = (teamName: string): string => {
  const hash = teamName.split("").reduce((a, b) => a + b.charCodeAt(0), 0);
  return `https://images.unsplash.com/photo-157462981036${hash % 10}-7efbbe195018?w=40&h=40&fit=crop`;
};

const generatePlayerName = (teamName: string): string => {
  const firstNames = [
    "James",
    "John",
    "Michael",
    "David",
    "Robert",
    "William",
    "Richard",
    "Charles",
    "Joseph",
    "Thomas",
  ];
  const lastNames = [
    "Smith",
    "Johnson",
    "Williams",
    "Brown",
    "Jones",
    "Garcia",
    "Miller",
    "Davis",
    "Rodriguez",
    "Martinez",
  ];
  const hash = teamName.split("").reduce((a, b) => a + b.charCodeAt(0), 0);
  const firstName = firstNames[hash % firstNames.length];
  const lastName = lastNames[(hash * 7) % lastNames.length];
  return `${firstName} ${lastName}`;
};

// Smart function to detect league from team name
const detectLeagueFromTeam = (teamName: string): string => {
  const teamLower = teamName.toLowerCase();

  // Uganda Premier League teams
  if (
    [
      "vipers",
      "kcca",
      "villa",
      "express",
      "ura",
      "nec",
      "bul",
      "kitara",
      "police",
      "lugazi",
      "wakiso giants",
      "maroons",
      "arua hill",
      "bright stars",
    ].some((t) => teamLower.includes(t))
  ) {
    return "uganda-premier-league";
  }

  // Premier League teams
  if (
    [
      "manchester city",
      "manchester united",
      "arsenal",
      "liverpool",
      "chelsea",
      "tottenham",
      "brighton",
      "newcastle",
      "aston villa",
      "west ham",
      "crystal palace",
      "fulham",
      "brentford",
      "nottingham forest",
      "everton",
      "wolves",
      "bournemouth",
      "sheffield united",
      "luton town",
      "burnley",
    ].some((t) => teamLower.includes(t))
  ) {
    return "premier-league";
  }

  // La Liga teams
  if (
    [
      "real madrid",
      "barcelona",
      "atletico madrid",
      "valencia",
      "sevilla",
      "elche",
      "real sociedad",
      "athletic bilbao",
      "real betis",
      "villarreal",
      "girona",
      "las palmas",
      "osasuna",
      "getafe",
      "rayo vallecano",
      "mallorca",
      "celta vigo",
      "cadiz",
      "alaves",
      "almeria",
    ].some((t) => teamLower.includes(t))
  ) {
    return "la-liga";
  }

  // Bundesliga teams
  if (
    [
      "bayern munich",
      "borussia dortmund",
      "rb leipzig",
      "bayer leverkusen",
      "eintracht frankfurt",
      "vfl wolfsburg",
      "borussia monchengladbach",
      "union berlin",
      "freiburg",
      "stuttgart",
      "werder bremen",
      "augsburg",
      "mainz",
      "hoffenheim",
      "hertha berlin",
      "schalke 04",
      "cologne",
      "bochum",
      "bayern",
      "dortmund",
      "leipzig",
      "leverkusen",
      "frankfurt",
    ].some((t) => teamLower.includes(t))
  ) {
    return "bundesliga";
  }

  // Serie A teams
  if (
    [
      "juventus",
      "ac milan",
      "inter milan",
      "napoli",
      "as roma",
      "lazio",
      "atalanta",
      "fiorentina",
      "bologna",
      "torino",
      "udinese",
      "genoa",
      "empoli",
      "lecce",
      "sassuolo",
      "cagliari",
      "verona",
      "monza",
      "spezia",
      "cremonese",
      "milan",
      "inter",
      "roma",
    ].some((t) => teamLower.includes(t))
  ) {
    return "serie-a";
  }

  // Ligue 1 teams
  if (
    [
      "paris saint-germain",
      "marseille",
      "lyon",
      "monaco",
      "lille",
      "rennes",
      "nice",
      "strasbourg",
      "lens",
      "montpellier",
      "nantes",
      "brest",
      "reims",
      "toulouse",
      "clermont",
      "lorient",
      "troyes",
      "auxerre",
      "ajaccio",
      "angers",
      "psg",
    ].some((t) => teamLower.includes(t))
  ) {
    return "ligue-1";
  }

  return "uganda-premier-league"; // Default fallback
};

export default function NewsTeamFixturesScreen() {
  const router = useRouter();
  const theme = useTheme();
  const params = useLocalSearchParams();

  // Extract parameters
  const teamName = Array.isArray(params.teamName)
    ? params.teamName[0]
    : (params.teamName as string);
  const leagueId = Array.isArray(params.leagueId)
    ? params.leagueId[0]
    : (params.leagueId as string);
  const teamId = Array.isArray(params.teamId)
    ? params.teamId[0]
    : (params.teamId as string);
  const source = Array.isArray(params.source)
    ? params.source[0]
    : (params.source as string);
  const context = Array.isArray(params.context)
    ? params.context[0]
    : (params.context as string);
  const activeTabParam = Array.isArray(params.activeTab)
    ? params.activeTab[0]
    : (params.activeTab as string);

  // Enhanced league detection with Uganda sports context priority
  const detectedLeague =
    leagueId ||
    (source === "uganda-sports" || context === "uganda-sports"
      ? "uganda-premier-league"
      : teamName
        ? detectLeagueFromTeam(teamName)
        : "uganda-premier-league");
  const currentLeague = LEAGUE_CONFIGURATIONS[detectedLeague];

  // State management
  const [activeTab, setActiveTab] = useState(activeTabParam || "matches");
  const [selectedRound, setSelectedRound] = useState(
    `Round ${currentLeague.currentRound}`,
  );
  const [selectedSeason, setSelectedSeason] = useState("24-25");
  const [showSeasonsModal, setShowSeasonsModal] = useState(false);
  const [showRoundsModal, setShowRoundsModal] = useState(false);
  const [isStarred, setIsStarred] = useState(false);
  const scrollX = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  // Check if we're in dark mode
  const isDarkMode =
    theme.colors.background === "#2A2A2A" || theme.colors.text === "#FFFFFF";

  // Generate fixtures data
  const rounds = generateLeagueFixtures(detectedLeague, teamName);
  const currentRound =
    rounds.find((r) => r.name === selectedRound) || rounds[0];

  // Get league-specific gradient colors
  const gradientColors = getLeagueGradientColors(detectedLeague);

  const tabs = [
    {
      id: "moments",
      label: "Moments",
      icon: <Activity size={16} color={theme.colors.text} />,
    },
    {
      id: "draft",
      label: "Draft",
      icon: <Database size={16} color={theme.colors.text} />,
    },
    {
      id: "table",
      label: "Table",
      icon: <Trophy size={16} color={theme.colors.text} />,
    },
    {
      id: "matches",
      label: "Matches",
      icon: <Calendar size={16} color={theme.colors.text} />,
    },
    {
      id: "transfers",
      label: "Transfers",
      icon: <TrendingUp size={16} color={theme.colors.text} />,
    },
    {
      id: "data",
      label: "Data",
      icon: <Target size={16} color={theme.colors.text} />,
    },
    {
      id: "teams",
      label: "Teams",
      icon: <Trophy size={16} color={theme.colors.text} />,
    },
    {
      id: "players",
      label: "Players",
      icon: <Star size={16} color={theme.colors.text} />,
    },
  ];

  const renderMatch = (match: Match) => (
    <TouchableOpacity
      key={match.id}
      style={[
        styles.matchContainer,
        {
          backgroundColor: theme.colors.background,
          borderBottomColor: isDarkMode ? "#555555" : "#E0E0E0",
        },
      ]}
      activeOpacity={0.7}
      onPress={() => {
        // Navigate to match details
        router.push({
          pathname: "/match-details",
          params: {
            matchId: match.id,
            homeTeam: match.homeTeam,
            awayTeam: match.awayTeam,
            league: match.competition,
          },
        });
      }}
    >
      <View style={styles.matchLayout}>
        {/* Left Side - Date and Time */}
        <View style={styles.leftSection}>
          <Text
            style={[styles.matchDate, { color: theme.colors.textSecondary }]}
          >
            {new Date(match.date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </Text>
          <Text
            style={[styles.matchTime, { color: theme.colors.textSecondary }]}
          >
            {match.time}
          </Text>
          {match.matchStatus && (
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    match.matchStatus === "FT"
                      ? "#4CAF50"
                      : match.matchStatus === "Live"
                        ? "#FF5722"
                        : "#2196F3",
                },
              ]}
            >
              <Text style={styles.statusText}>{match.matchStatus}</Text>
            </View>
          )}
        </View>

        {/* Middle Section - Teams */}
        <View style={styles.middleSection}>
          <View style={styles.teamContainer}>
            <View style={styles.teamRow}>
              <Image
                source={{
                  uri: match.homeLogoUrl || generateTeamLogo(match.homeTeam),
                }}
                style={styles.teamLogo}
              />
              <Text
                style={[
                  styles.teamName,
                  {
                    color: theme.colors.text,
                    fontWeight:
                      teamName &&
                      match.homeTeam
                        .toLowerCase()
                        .includes(teamName.toLowerCase())
                        ? "700"
                        : "500",
                  },
                ]}
                numberOfLines={1}
              >
                {match.homeTeam}
              </Text>
            </View>
            <View style={styles.teamRow}>
              <Image
                source={{
                  uri: match.awayLogoUrl || generateTeamLogo(match.awayTeam),
                }}
                style={styles.teamLogo}
              />
              <Text
                style={[
                  styles.teamName,
                  {
                    color: theme.colors.text,
                    fontWeight:
                      teamName &&
                      match.awayTeam
                        .toLowerCase()
                        .includes(teamName.toLowerCase())
                        ? "700"
                        : "500",
                  },
                ]}
                numberOfLines={1}
              >
                {match.awayTeam}
              </Text>
            </View>
          </View>
        </View>

        {/* Right Side - Scores */}
        <View style={styles.rightSection}>
          <Text style={[styles.score, { color: theme.colors.text }]}>
            {match.homeScore !== undefined ? match.homeScore : "-"}
          </Text>
          <Text style={[styles.score, { color: theme.colors.text }]}>
            {match.awayScore !== undefined ? match.awayScore : "-"}
          </Text>
        </View>
      </View>

      {match.playerName && (
        <View style={styles.playerContainer}>
          <View
            style={[
              styles.playerAvatar,
              { backgroundColor: theme.colors.primary },
            ]}
          >
            <Text style={styles.playerInitials}>
              {match.playerName
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </Text>
          </View>
          <View style={styles.playerInfo}>
            <Text style={[styles.playerName, { color: theme.colors.text }]}>
              {match.playerName}
            </Text>
            <Text style={[styles.playerRating, { color: "#ff6b35" }]}>
              ⭐ {match.playerRating}
            </Text>
          </View>
          {match.matchStatus === "FT" && (
            <View style={styles.matchIcons}>
              <Text
                style={[
                  styles.minuteText,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {match.minute}
              </Text>
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "moments":
        return (
          <NewsTeamMoments teamName={teamName} leagueId={detectedLeague} />
        );
      case "draft":
        return <NewsTeamDraft teamName={teamName} leagueId={detectedLeague} />;
      case "matches":
        return (
          <ScrollView
            style={[
              styles.content,
              {
                backgroundColor: theme.colors.background,
              },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {/* League Info Header */}
            {/* League info is now in header, so we can remove this section */}

            {/* Round Navigation */}
            <View
              style={[
                styles.roundNavigation,
                {
                  backgroundColor: theme.colors.background,
                  borderTopColor: isDarkMode ? "#555555" : "#E5E5E5",
                },
              ]}
            >
              <TouchableOpacity
                style={styles.navButton}
                onPress={() => {
                  const currentIndex = rounds.findIndex(
                    (r) => r.name === selectedRound,
                  );
                  if (currentIndex > 0) {
                    setSelectedRound(rounds[currentIndex - 1].name);
                  }
                }}
              >
                <ChevronLeft size={16} color={theme.colors.text} />
                <Text
                  style={[styles.navButtonText, { color: theme.colors.text }]}
                >
                  Previous
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.roundSelector,
                  {
                    backgroundColor: isDarkMode
                      ? "#2A2A2A"
                      : "rgba(255,255,255,0.9)",
                  },
                ]}
                onPress={() => setShowRoundsModal(true)}
                activeOpacity={0.7}
              >
                <Text style={[styles.roundText, { color: theme.colors.text }]}>
                  {selectedRound}
                </Text>
                <ChevronDown size={16} color={theme.colors.text} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.navButton}
                onPress={() => {
                  const currentIndex = rounds.findIndex(
                    (r) => r.name === selectedRound,
                  );
                  if (currentIndex < rounds.length - 1) {
                    setSelectedRound(rounds[currentIndex + 1].name);
                  }
                }}
              >
                <Text
                  style={[styles.navButtonText, { color: theme.colors.text }]}
                >
                  Next
                </Text>
                <ChevronRight size={16} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            {/* Matches List */}
            <View style={styles.matchesList}>
              {currentRound.matches.length > 0 ? (
                currentRound.matches.map(renderMatch)
              ) : (
                <View style={styles.noMatchesContainer}>
                  <Calendar size={48} color={theme.colors.textSecondary} />
                  <Text
                    style={[
                      styles.noMatchesText,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    {teamName
                      ? `No matches found for ${teamName}`
                      : "No matches scheduled"}
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>
        );
      case "table":
        return (
          <NewsLeagueTableStandings
            leagueId={detectedLeague}
            teamName={teamName}
            embedded={true}
          />
        );
      case "transfers":
        return <NewsTeamTransfersScreen />;
      case "data":
        return (
          <NewsTeamDataScreen
            leagueInfo={{
              id: detectedLeague,
              name: currentLeague.name,
              country: currentLeague.country,
              season: currentLeague.season,
              teams: currentLeague.teams,
            }}
            teamContext={{
              teamName: teamName,
              leagueId: detectedLeague,
            }}
          />
        );
      case "teams":
        return (
          <NewsTeamRankingsScreen
            leagueInfo={{
              id: detectedLeague,
              name: currentLeague.name,
              country: currentLeague.country,
              season: currentLeague.season,
              teams: currentLeague.teams,
            }}
            teamContext={{
              teamName: teamName,
              leagueId: detectedLeague,
            }}
          />
        );
      case "players":
        return (
          <NewsTeamPlayersScreen
            leagueInfo={{
              id: detectedLeague,
              name: currentLeague.name,
              country: currentLeague.country,
              season: currentLeague.season,
              teams: currentLeague.teams,
            }}
            teamContext={{
              teamName: teamName,
              leagueId: detectedLeague,
            }}
          />
        );
      default:
        return null;
    }
  };

  const handleShare = async () => {
    // TODO: Implement share functionality
    console.log("Share button pressed");
  };

  const handleStarPress = () => {
    setIsStarred(!isStarred);
    // TODO: Implement favorite functionality
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      {/* Header with custom gradient background */}
      <View style={[styles.headerImageContainer, { paddingTop: insets.top }]}>
        {/* Base gradient layer */}
        <View
          style={[styles.gradientBase, { backgroundColor: gradientColors[0] }]}
        />
        {/* Middle gradient layer */}
        <View
          style={[
            styles.gradientMiddle,
            { backgroundColor: gradientColors[1] },
          ]}
        />
        {/* Top gradient layer */}
        <View
          style={[styles.gradientTop, { backgroundColor: gradientColors[2] }]}
        />

        {/* Content overlay */}
        <View style={styles.headerContent}>
          {/* Top navigation bar */}
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
        </View>

        {/* League info section - perfectly centered */}
        <View style={styles.leagueInfoContainer}>
          <View style={styles.leagueLogo}>
            <View style={styles.leagueLogoInner}>
              <Text style={styles.leagueLogoText}>
                {currentLeague.name
                  .split(" ")
                  .map((word) => word.charAt(0))
                  .join("")
                  .substring(0, 2)}
              </Text>
            </View>
          </View>

          <Text style={styles.leagueNameHeader}>{currentLeague.name}</Text>

          <Text style={styles.leagueSubtitle}>{currentLeague.country}</Text>
        </View>

        {/* Season info */}
        <TouchableOpacity
          style={styles.seasonInfo}
          onPress={() => setShowSeasonsModal(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.seasonText}>
            {currentLeague.currentRound < 10 ? "0" : ""}
            {currentLeague.currentRound}/
            {currentLeague.totalRounds < 10 ? "0" : ""}
            {currentLeague.totalRounds}
          </Text>
          <Text style={styles.seasonLabel}>
            {currentLeague.currentRound}th Round
          </Text>
        </TouchableOpacity>

        {/* Date range display in bottom right */}
        <View style={styles.dateRangeInfo}>
          <Text style={styles.dateRangeText}>05/25</Text>
        </View>
      </View>

      {/* Tabs */}
      <View
        style={[
          styles.tabsContainer,
          {
            backgroundColor: isDarkMode ? "#2A2A2A" : "#FFFFFF",
            borderBottomWidth: 1,
            borderBottomColor: isDarkMode ? "#333333" : "#E5E5E5",
          },
        ]}
      >
        <View style={styles.tabsWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tabsScrollView}
            contentContainerStyle={styles.tabsContentContainer}
            bounces={true}
            decelerationRate="normal"
            scrollEventThrottle={16}
          >
            {tabs.map((tab, index) => (
              <TouchableOpacity
                key={tab.id}
                style={[
                  styles.tab,
                  index === 0 && styles.firstTab,
                  activeTab === tab.id && styles.activeTab,
                ]}
                onPress={() => setActiveTab(tab.id)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.tabText,
                    {
                      color:
                        activeTab === tab.id
                          ? "#FF6B35"
                          : isDarkMode
                            ? "#FFFFFF"
                            : "#6B7280",
                      fontWeight: activeTab === tab.id ? "600" : "400",
                    },
                  ]}
                >
                  {tab.label}
                </Text>
                {activeTab === tab.id && (
                  <View style={styles.activeTabIndicator} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Season Selector Button - positioned at right edge */}
          <View
            style={[
              styles.seasonSelectorContainer,
              {
                opacity:
                  activeTab === "moments" || activeTab === "transfers"
                    ? 0.3
                    : 1,
              },
            ]}
            pointerEvents={
              activeTab === "moments" || activeTab === "transfers"
                ? "none"
                : "auto"
            }
          >
            <NewsSeasonsSelector
              selectedSeason={selectedSeason}
              onSeasonChange={setSelectedSeason}
              showModal={showSeasonsModal}
              setShowModal={setShowSeasonsModal}
            />
          </View>
        </View>
      </View>

      {/* Content */}
      <View
        style={[
          styles.contentWrapper,
          { backgroundColor: theme.colors.background },
        ]}
      >
        {renderTabContent()}
      </View>

      {/* Modals */}
      <NewsMatchesLeagueRoundSelector
        rounds={rounds.map((r) => r.name)}
        selectedRound={selectedRound}
        onRoundChange={setSelectedRound}
        showModal={showRoundsModal}
        setShowModal={setShowRoundsModal}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 0,
    padding: 0,
  },
  headerImageContainer: {
    position: "relative",
    paddingTop: 0,
    marginTop: 0,
    backgroundColor: "#C41E3A",
  },
  gradientBase: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 1,
  },
  gradientMiddle: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: "30%",
    opacity: 0.8,
  },
  gradientTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: "40%",
    bottom: "60%",
    opacity: 0.6,
  },
  headerContent: {
    paddingTop: 8,
    paddingBottom: 8,
    position: "relative",
    zIndex: 10,
    height: 120,
    justifyContent: "space-between",
  },
  topNavBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
    marginBottom: 0,
  },
  backButton: {
    padding: 8,
  },
  topRightButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  iconButton: {
    padding: 8,
  },
  leagueInfoContainer: {
    alignItems: "center",
    marginTop: -10,
    marginBottom: 20,
  },
  leagueLogo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  leagueLogoInner: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 4,
  },
  leagueLogoText: {
    fontSize: 16,
    fontWeight: "900",
    color: "white",
    fontFamily: "Inter-Black",
    letterSpacing: 0.5,
  },
  leagueNameHeader: {
    fontSize: 16,
    fontWeight: "700",
    color: "white",
    fontFamily: "Inter-Bold",
    textAlign: "center",
    marginBottom: 1,
    letterSpacing: 0.3,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  leagueSubtitle: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.85)",
    fontFamily: "Inter-Medium",
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  seasonInfo: {
    position: "absolute",
    left: 16,
    bottom: 4,
    alignItems: "flex-start",
  },
  seasonText: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.95)",
    fontFamily: "Inter-SemiBold",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginBottom: 1,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    overflow: "hidden",
  },
  seasonLabel: {
    fontSize: 8,
    color: "rgba(255, 255, 255, 0.75)",
    fontFamily: "Inter-Medium",
    marginLeft: 2,
  },
  dateRangeInfo: {
    position: "absolute",
    right: 16,
    bottom: 4,
    alignItems: "flex-end",
  },
  dateRangeText: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.95)",
    fontFamily: "Inter-SemiBold",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  tabsContainer: {
    paddingVertical: 4,
    marginTop: -2,
    position: "relative",
  },
  tabsWrapper: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
  },
  seasonSelectorContainer: {
    position: "absolute",
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    paddingVertical: 4,
  },
  tabsScrollView: {
    flex: 1,
    marginRight: 80,
  },
  tabsContentContainer: {
    paddingHorizontal: 12,
    paddingRight: 20,
    alignItems: "center",
  },
  tab: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    position: "relative",
    marginRight: 8,
  },
  firstTab: {
    marginLeft: 0,
  },
  activeTab: {
    position: "relative",
  },
  activeTabIndicator: {
    position: "absolute",
    bottom: -1,
    left: 18,
    right: 18,
    height: 2,
    backgroundColor: "#FF6B35",
    borderRadius: 1,
    zIndex: 2,
  },
  tabText: {
    fontSize: 13,
    fontFamily: "Inter-Medium",
  },
  contentWrapper: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  // Removed leagueHeader styles as info is now in header
  roundNavigation: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 0,
    borderTopWidth: 0,
    borderBottomWidth: 0,
  },
  navButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "rgba(255, 107, 53, 0.1)",
  },
  navButtonText: {
    fontSize: 13,
    fontFamily: "Inter-Medium",
    fontWeight: "500",
  },
  roundSelector: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 25,
    gap: 8,
  },
  roundText: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter-SemiBold",
  },
  matchesList: {
    paddingBottom: 20,
  },
  matchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    marginHorizontal: 0,
  },
  matchLayout: {
    flexDirection: "row",
    alignItems: "center",
  },
  leftSection: {
    width: 80,
    alignItems: "center",
  },
  matchDate: {
    fontSize: 12,
    fontFamily: "Inter-Medium",
    marginBottom: 2,
  },
  matchTime: {
    fontSize: 11,
    fontFamily: "Inter-Regular",
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    color: "white",
    fontSize: 9,
    fontWeight: "600",
    fontFamily: "Inter-SemiBold",
  },
  middleSection: {
    flex: 1,
    paddingHorizontal: 16,
  },
  teamContainer: {
    gap: 8,
  },
  teamRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  teamLogo: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  teamName: {
    fontSize: 14,
    fontFamily: "Inter-Medium",
    flex: 1,
    fontWeight: "500",
  },
  rightSection: {
    width: 40,
    alignItems: "center",
    gap: 8,
  },
  score: {
    fontSize: 17,
    fontWeight: "700",
    fontFamily: "Inter-Bold",
    letterSpacing: 0.5,
  },
  playerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    paddingLeft: 96,
    gap: 10,
  },
  playerAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  playerInitials: {
    color: "white",
    fontSize: 11,
    fontWeight: "600",
    fontFamily: "Inter-SemiBold",
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 12,
    fontWeight: "500",
    fontFamily: "Inter-Medium",
  },
  playerRating: {
    fontSize: 11,
    fontFamily: "Inter-Regular",
    marginTop: 1,
  },
  matchIcons: {
    alignItems: "flex-end",
  },
  minuteText: {
    fontSize: 11,
    fontFamily: "Inter-Regular",
  },
  noMatchesContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 16,
  },
  noMatchesText: {
    fontSize: 16,
    fontFamily: "Inter-Medium",
    textAlign: "center",
  },
  comingSoonContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  comingSoonText: {
    fontSize: 16,
    fontFamily: "Inter-Medium",
    opacity: 0.6,
  },
});
