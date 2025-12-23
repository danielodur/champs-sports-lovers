import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Animated,
  Dimensions,
  Image,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Stack } from "expo-router";
import { useTheme } from "@/hooks/useTheme";
import {
  ArrowLeft,
  Star,
  Share2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Calendar,
  Clock,
  MapPin,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import NewsMatchesLeagueRoundSelector from "./news-matches-league-round-selector";
import NewsSeasonsSelector from "./news-seasons-selector";

const { width } = Dimensions.get("window");

interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeLogoUrl?: string;
  awayLogoUrl?: string;
  date: string;
  time: string;
  venue?: string;
  competition: string;
  round: string;
  matchStatus?: "upcoming" | "live" | "FT" | "postponed";
  homeScore?: number;
  awayScore?: number;
  minute?: string;
  playerName?: string;
  playerRating?: number;
}

interface Round {
  name: string;
  matches: Match[];
}

interface LeagueData {
  id: string;
  name: string;
  country: string;
  currentRound: number;
  totalRounds: number;
}

interface NewsTeamMatchesProps {
  teamName?: string;
  leagueId?: string;
}

const LEAGUE_CONFIGURATIONS: Record<string, LeagueData> = {
  "uganda-premier-league": {
    id: "uganda-premier-league",
    name: "Uganda Premier League",
    country: "Uganda",
    currentRound: 8,
    totalRounds: 30,
  },
  "spanish-la-liga": {
    id: "spanish-la-liga",
    name: "Spanish La Liga",
    country: "Spain",
    currentRound: 10,
    totalRounds: 38,
  },
  "english-premier-league": {
    id: "english-premier-league",
    name: "English Premier League",
    country: "England",
    currentRound: 9,
    totalRounds: 38,
  },
};

const generateTeamLogo = (teamName: string): string => {
  const logoMap: Record<string, string> = {
    "Vipers SC":
      "https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=50&h=50&fit=crop",
    "KCCA FC":
      "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=50&h=50&fit=crop",
    "Express FC":
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=50&h=50&fit=crop",
    "SC Villa":
      "https://images.unsplash.com/photo-1606925797300-0b35e9d1794e?w=50&h=50&fit=crop",
  };
  return (
    logoMap[teamName] ||
    "https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=50&h=50&fit=crop"
  );
};

const generateLeagueFixtures = (
  leagueId: string,
  teamName?: string,
): Round[] => {
  const rounds: Round[] = [];
  const totalRounds = LEAGUE_CONFIGURATIONS[leagueId]?.totalRounds || 30;

  for (let i = 1; i <= totalRounds; i++) {
    const matches: Match[] = [];

    // Generate 6-8 matches per round
    for (let j = 1; j <= 6; j++) {
      const teams = [
        "Vipers SC",
        "KCCA FC",
        "Express FC",
        "SC Villa",
        "URA FC",
        "BUL FC",
        "NEC FC",
        "Wakiso Giants",
        "Police FC",
        "UPDF FC",
      ];

      const homeTeam = teams[j % teams.length];
      const awayTeam = teams[(j + 1) % teams.length];

      // Only include matches for the specified team if provided
      if (
        teamName &&
        !homeTeam.includes(teamName) &&
        !awayTeam.includes(teamName)
      ) {
        continue;
      }

      const matchDate = new Date();
      matchDate.setDate(matchDate.getDate() + (i - 8) * 7 + j);

      let matchStatus: Match["matchStatus"] = "upcoming";
      let homeScore: number | undefined;
      let awayScore: number | undefined;

      if (i <= 7) {
        matchStatus = "FT";
        homeScore = Math.floor(Math.random() * 4);
        awayScore = Math.floor(Math.random() * 4);
      } else if (i === 8 && j <= 2) {
        matchStatus = "live";
        homeScore = Math.floor(Math.random() * 3);
        awayScore = Math.floor(Math.random() * 3);
      }

      matches.push({
        id: `${leagueId}-r${i}-m${j}`,
        homeTeam,
        awayTeam,
        homeLogoUrl: generateTeamLogo(homeTeam),
        awayLogoUrl: generateTeamLogo(awayTeam),
        date: matchDate.toISOString().split("T")[0],
        time: `${14 + (j % 4)}:00`,
        venue: `${homeTeam} Stadium`,
        competition: LEAGUE_CONFIGURATIONS[leagueId]?.name || "League",
        round: `Round ${i}`,
        matchStatus,
        homeScore,
        awayScore,
        minute:
          matchStatus === "live"
            ? `${45 + Math.floor(Math.random() * 45)}'`
            : undefined,
        playerName: Math.random() > 0.7 ? "John Doe" : undefined,
        playerRating:
          Math.random() > 0.7 ? +(7 + Math.random() * 2).toFixed(1) : undefined,
      });
    }

    rounds.push({
      name: `Round ${i}`,
      matches,
    });
  }

  return rounds;
};

const getLeagueGradientColors = (leagueId: string): string[] => {
  const gradients: Record<string, string[]> = {
    "spanish-la-liga": ["#8B0000", "#B22222", "#DC143C"],
    "english-premier-league": ["#3B0764", "#6B21A8", "#9333EA"],
    "uganda-premier-league": ["#FFD700", "#FF6B35", "#8B4513"],
  };

  return gradients[leagueId] || gradients["uganda-premier-league"];
};

const detectLeagueFromTeam = (teamName: string): string => {
  const ugandaTeams = [
    "Vipers SC",
    "KCCA FC",
    "Express FC",
    "SC Villa",
    "URA FC",
    "BUL FC",
  ];
  const spanishTeams = [
    "Real Madrid",
    "Barcelona",
    "Atletico Madrid",
    "Valencia",
  ];
  const englishTeams = [
    "Manchester United",
    "Manchester City",
    "Liverpool",
    "Chelsea",
  ];

  if (
    ugandaTeams.some((team) =>
      team.toLowerCase().includes(teamName.toLowerCase()),
    )
  ) {
    return "uganda-premier-league";
  }
  if (
    spanishTeams.some((team) =>
      team.toLowerCase().includes(teamName.toLowerCase()),
    )
  ) {
    return "spanish-la-liga";
  }
  if (
    englishTeams.some((team) =>
      team.toLowerCase().includes(teamName.toLowerCase()),
    )
  ) {
    return "english-premier-league";
  }

  return "uganda-premier-league";
};

export default function NewsTeamMatches({
  teamName,
  leagueId,
}: NewsTeamMatchesProps) {
  const router = useRouter();
  const theme = useTheme();

  // Smart league detection
  const detectedLeague =
    leagueId ||
    (teamName ? detectLeagueFromTeam(teamName) : "uganda-premier-league");
  const currentLeague = LEAGUE_CONFIGURATIONS[detectedLeague];

  // State management
  const [selectedRound, setSelectedRound] = useState(
    `Round ${currentLeague.currentRound}`,
  );
  const [selectedSeason, setSelectedSeason] = useState("24-25");
  const [showSeasonsModal, setShowSeasonsModal] = useState(false);
  const [showRoundsModal, setShowRoundsModal] = useState(false);

  // Check if we're in dark mode
  const isDarkMode =
    theme.colors.background === "#2A2A2A" || theme.colors.text === "#FFFFFF";

  // Generate fixtures data
  const rounds = generateLeagueFixtures(detectedLeague, teamName);
  const currentRound =
    rounds.find((r) => r.name === selectedRound) || rounds[0];

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
        router.push({
          pathname: "/match-details" as any,
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
                      : match.matchStatus === "live"
                        ? "#FF5722"
                        : "#2196F3",
                },
              ]}
            >
              <Text style={styles.statusText}>{match.matchStatus}</Text>
            </View>
          )}
          {match.venue && (
            <View style={styles.venueContainer}>
              <MapPin size={10} color={theme.colors.textSecondary} />
              <Text
                style={[
                  styles.venueText,
                  { color: theme.colors.textSecondary },
                ]}
                numberOfLines={1}
              >
                {match.venue}
              </Text>
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

  const handlePreviousRound = () => {
    const currentIndex = rounds.findIndex((r) => r.name === selectedRound);
    if (currentIndex > 0) {
      setSelectedRound(rounds[currentIndex - 1].name);
    }
  };

  const handleNextRound = () => {
    const currentIndex = rounds.findIndex((r) => r.name === selectedRound);
    if (currentIndex < rounds.length - 1) {
      setSelectedRound(rounds[currentIndex + 1].name);
    }
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* Content */}
      <ScrollView
        style={[
          styles.content,
          {
            backgroundColor: theme.colors.background,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Round Navigation */}
        <View
          style={[
            styles.roundNavigation,
            {
              backgroundColor: isDarkMode ? "#3A3A3A" : "#F8F9FA",
              borderTopColor: isDarkMode ? "#555555" : "#E5E5E5",
            },
          ]}
        >
          <TouchableOpacity style={styles.navButton} onPress={handlePreviousRound}>
            <ChevronLeft size={16} color={theme.colors.text} />
            <Text style={[styles.navButtonText, { color: theme.colors.text }]}>
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
                borderColor: "#FF6B35",
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

          <TouchableOpacity style={styles.navButton} onPress={handleNextRound}>
            <Text style={[styles.navButtonText, { color: theme.colors.text }]}>
              Next
            </Text>
            <ChevronRight size={16} color={theme.colors.text} />
          </TouchableOpacity>
        </View>

        {/* Season Selector Button */}
        <View style={styles.seasonSelectorContainer}>
          <NewsSeasonsSelector
            selectedSeason={selectedSeason}
            onSeasonChange={setSelectedSeason}
            showModal={showSeasonsModal}
            setShowModal={setShowSeasonsModal}
          />
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
  },
  content: {
    flex: 1,
  },
  roundNavigation: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 0,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.08)",
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
    borderWidth: 1.5,
    gap: 8,
  },
  roundText: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter-SemiBold",
  },
  seasonSelectorContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.08)",
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
    width: 90,
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
  venueContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginTop: 2,
  },
  venueText: {
    fontSize: 9,
    fontFamily: "Inter-Regular",
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
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
    paddingLeft: 106,
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
});
