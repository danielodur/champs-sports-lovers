import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  ChevronLeft,
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  Minus,
  Trophy,
  Medal,
  Award,
  Star,
  Crown,
  Target,
  BarChart3,
  Calendar,
  Users,
  Settings,
} from "lucide-react-native";
import { useTheme } from "../hooks/useTheme";
import { useTranslation } from "react-i18next";

interface TeamRanking {
  id: string;
  position: number;
  previousPosition: number;
  team: string;
  logo: string;
  league: string;
  points: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  form: string[];
  trend: "up" | "down" | "same";
}

interface PlayerRanking {
  id: string;
  position: number;
  previousPosition: number;
  name: string;
  photo: string;
  team: string;
  league: string;
  goals: number;
  assists: number;
  appearances: number;
  rating: number;
  trend: "up" | "down" | "same";
}

export default function RankingsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState("teams");
  const [selectedLeague, setSelectedLeague] = useState("premier-league");
  const [searchQuery, setSearchQuery] = useState("");
  const { t } = useTranslation();

  const tabs = [
    { id: "teams", label: "Teams", icon: Users },
    { id: "players", label: "Players", icon: Star },
    { id: "leagues", label: "Leagues", icon: Trophy },
  ];

  const leagues = [
    { id: "premier-league", name: "Premier League", country: "England" },
    { id: "la-liga", name: "La Liga", country: "Spain" },
    { id: "bundesliga", name: "Bundesliga", country: "Germany" },
    { id: "serie-a", name: "Serie A", country: "Italy" },
    { id: "ligue-1", name: "Ligue 1", country: "France" },
    {
      id: "ugandan-premier",
      name: "Ugandan Premier League",
      country: "Uganda",
    },
  ];

  const teamRankings: TeamRanking[] = [
    {
      id: "1",
      position: 1,
      previousPosition: 2,
      team: "Arsenal",
      logo: "https://images.pexels.com/photos/274506/pexels-photo-274506.jpeg",
      league: "Premier League",
      points: 84,
      played: 32,
      won: 26,
      drawn: 6,
      lost: 0,
      goalsFor: 78,
      goalsAgainst: 24,
      goalDifference: 54,
      form: ["W", "W", "D", "W", "W"],
      trend: "up",
    },
    {
      id: "2",
      position: 2,
      previousPosition: 1,
      team: "Manchester City",
      logo: "https://images.pexels.com/photos/1884574/pexels-photo-1884574.jpeg",
      league: "Premier League",
      points: 82,
      played: 31,
      won: 26,
      drawn: 4,
      lost: 1,
      goalsFor: 89,
      goalsAgainst: 31,
      goalDifference: 58,
      form: ["W", "W", "W", "L", "W"],
      trend: "down",
    },
    {
      id: "3",
      position: 3,
      previousPosition: 3,
      team: "Newcastle United",
      logo: "https://images.pexels.com/photos/1752757/pexels-photo-1752757.jpeg",
      league: "Premier League",
      points: 65,
      played: 32,
      won: 19,
      drawn: 8,
      lost: 5,
      goalsFor: 58,
      goalsAgainst: 33,
      goalDifference: 25,
      form: ["D", "W", "W", "D", "W"],
      trend: "same",
    },
  ];

  const playerRankings: PlayerRanking[] = [
    {
      id: "1",
      position: 1,
      previousPosition: 1,
      name: "Erling Haaland",
      photo: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg",
      team: "Manchester City",
      league: "Premier League",
      goals: 32,
      assists: 5,
      appearances: 28,
      rating: 8.9,
      trend: "same",
    },
    {
      id: "2",
      position: 2,
      previousPosition: 3,
      name: "Harry Kane",
      photo: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg",
      team: "Tottenham",
      league: "Premier League",
      goals: 28,
      assists: 3,
      appearances: 31,
      rating: 8.5,
      trend: "up",
    },
    {
      id: "3",
      position: 3,
      previousPosition: 2,
      name: "Marcus Rashford",
      photo:
        "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg",
      team: "Manchester United",
      league: "Premier League",
      goals: 25,
      assists: 8,
      appearances: 30,
      rating: 8.3,
      trend: "down",
    },
  ];

  const getTrendIcon = (trend: "up" | "down" | "same") => {
    switch (trend) {
      case "up":
        return <TrendingUp size={16} color="#4CAF50" />;
      case "down":
        return <TrendingDown size={16} color="#F44336" />;
      default:
        return <Minus size={16} color="#9E9E9E" />;
    }
  };

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Crown size={20} color="#FFD700" />;
      case 2:
        return <Medal size={20} color="#C0C0C0" />;
      case 3:
        return <Award size={20} color="#CD7F32" />;
      default:
        return null;
    }
  };

  const getFormColor = (result: string) => {
    switch (result) {
      case "W":
        return "#4CAF50";
      case "D":
        return "#FF9800";
      case "L":
        return "#F44336";
      default:
        return "#9E9E9E";
    }
  };

  // Helper function to format team names with smart word breaking
  const formatTeamName = (teamName: string) => {
    if (!teamName) return "Team";

    const cleanName = teamName.trim();

    // CRITICAL: If name is longer than 13 characters, ALWAYS break or abbreviate
    if (cleanName.length > 13) {
      // Check if the name might be concatenated words
      const smartSplit = (name: string): string[] => {
        const patterns = [
          /([A-Z][a-z]+)([A-Z][a-z]+)/g,
          /(san|new|los|las|st|mount|fort)([A-Z][a-z]+)/gi,
          /(duque)([A-Z][a-z]+)/gi,
          /(real|fc|ac|sc)([A-Z][a-z]+)/gi,
        ];

        for (const pattern of patterns) {
          const match = name.match(pattern);
          if (match) {
            const words = name.replace(/([a-z])([A-Z])/g, "$1 $2").split(" ");
            if (words.length > 1 && words.every((word) => word.length > 1)) {
              return words;
            }
          }
        }

        return name.split(/\s+/);
      };

      const words = smartSplit(cleanName);

      if (words.length === 1) {
        // Single long word - keep if reasonably short, otherwise show first 12 chars
        if (cleanName.length <= 15) {
          return cleanName;
        }
        return cleanName.substring(0, 12) + "...";
      }

      if (words.length >= 2) {
        const [firstWord, secondWord, ...remainingWords] = words;

        // Check for geographic names
        const geographic = [
          "san",
          "new",
          "los",
          "las",
          "st.",
          "st",
          "mount",
          "fort",
          "real",
          "duque",
        ];
        const isGeographic = geographic.some(
          (geo) =>
            firstWord.toLowerCase().includes(geo) ||
            secondWord.toLowerCase().includes(geo),
        );

        if (isGeographic) {
          const geographicBase = firstWord + " " + secondWord;
          if (remainingWords.length === 0) {
            return geographicBase.length > 15
              ? geographicBase.substring(0, 12) + "..."
              : geographicBase;
          }
          // Add first letter of remaining words
          const abbreviated = remainingWords
            .map((w) => w.charAt(0).toUpperCase())
            .join("");
          const result = geographicBase + " " + abbreviated;
          return result.length > 15 ? result.substring(0, 12) + "..." : result;
        }

        // Standard case - try to fit first two words, abbreviate rest
        if (remainingWords.length > 0) {
          const abbreviated = remainingWords
            .map((w) => w.charAt(0).toUpperCase())
            .join("");
          const result = firstWord + " " + secondWord + " " + abbreviated;
          return result.length > 15 ? result.substring(0, 12) + "..." : result;
        }

        // Just two words
        const result = firstWord + " " + secondWord;
        return result.length > 15 ? result.substring(0, 12) + "..." : result;
      }

      return cleanName.substring(0, 12) + "...";
    }

    // Name is 13 characters or less - keep as is
    return cleanName;
  };

  const renderHeader = () => (
    <View
      style={[
        styles.header,
        { backgroundColor: theme.colors.backgroundSecondary },
      ]}
    >
      <TouchableOpacity
        onPress={() => router.back()}
        style={styles.backButton}
        activeOpacity={0.7}
      >
        <ChevronLeft size={28} color={theme.colors.text} />
      </TouchableOpacity>
      <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
        {t("rankings")}
      </Text>
      <TouchableOpacity style={styles.settingsButton} activeOpacity={0.7}>
        <Settings size={24} color={theme.colors.text} />
      </TouchableOpacity>
    </View>
  );

  const renderTabs = () => (
    <View
      style={[
        styles.tabContainer,
        { backgroundColor: theme.colors.backgroundSecondary },
      ]}
    >
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.id}
          style={[
            styles.tab,
            activeTab === tab.id && { borderBottomColor: theme.colors.primary },
          ]}
          onPress={() => setActiveTab(tab.id)}
          activeOpacity={0.7}
        >
          <tab.icon
            size={18}
            color={
              activeTab === tab.id
                ? theme.colors.primary
                : theme.colors.textSecondary
            }
          />
          <Text
            style={[
              styles.tabText,
              { color: theme.colors.textSecondary },
              activeTab === tab.id && { color: theme.colors.primary },
            ]}
          >
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderSearchAndFilter = () => (
    <View style={styles.searchFilterContainer}>
      <View
        style={[
          styles.searchContainer,
          { backgroundColor: theme.colors.backgroundSecondary },
        ]}
      >
        <Search size={20} color={theme.colors.textSecondary} />
        <TextInput
          style={[
            styles.searchInput,
            {
              color: theme.colors.text,
            },
          ]}
          placeholder={t("searchTeamsPlayersLeagues")}
          placeholderTextColor={theme.colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.leagueScroll}
        contentContainerStyle={styles.leagueContainer}
      >
        {leagues.map((league) => (
          <TouchableOpacity
            key={league.id}
            style={[
              styles.leagueButton,
              {
                backgroundColor:
                  selectedLeague === league.id
                    ? theme.colors.primary
                    : theme.colors.backgroundSecondary,
              },
            ]}
            onPress={() => setSelectedLeague(league.id)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.leagueButtonText,
                {
                  color:
                    selectedLeague === league.id
                      ? "#FFFFFF"
                      : theme.colors.text,
                },
              ]}
            >
              {league.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderTeamRankings = () => (
    <View style={styles.rankingsContainer}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        {t("teamRankings")} -{" "}
        {leagues.find((l) => l.id === selectedLeague)?.name}
      </Text>

      <View style={styles.tableHeader}>
        <Text
          style={[
            styles.tableHeaderText,
            { color: theme.colors.textSecondary },
          ]}
        >
          {t("pos")}
        </Text>
        <Text
          style={[
            styles.tableHeaderText,
            { color: theme.colors.textSecondary },
          ]}
        >
          {t("team")}
        </Text>
        <Text
          style={[
            styles.tableHeaderText,
            { color: theme.colors.textSecondary },
          ]}
        >
          {t("p")}
        </Text>
        <Text
          style={[
            styles.tableHeaderText,
            { color: theme.colors.textSecondary },
          ]}
        >
          {t("w")}
        </Text>
        <Text
          style={[
            styles.tableHeaderText,
            { color: theme.colors.textSecondary },
          ]}
        >
          {t("d")}
        </Text>
        <Text
          style={[
            styles.tableHeaderText,
            { color: theme.colors.textSecondary },
          ]}
        >
          {t("l")}
        </Text>
        <Text
          style={[
            styles.tableHeaderText,
            { color: theme.colors.textSecondary },
          ]}
        >
          {t("gd")}
        </Text>
        <Text
          style={[
            styles.tableHeaderText,
            { color: theme.colors.textSecondary },
          ]}
        >
          {t("pts")}
        </Text>
      </View>

      {teamRankings.map((team) => (
        <View
          key={team.id}
          style={[
            styles.teamRow,
            { backgroundColor: theme.colors.backgroundSecondary },
          ]}
        >
          <View style={styles.positionContainer}>
            <View style={styles.positionInfo}>
              {getPositionIcon(team.position)}
              <Text style={[styles.positionText, { color: theme.colors.text }]}>
                {team.position}
              </Text>
            </View>
            {getTrendIcon(team.trend)}
          </View>

          <View style={styles.teamInfo}>
            <Image source={{ uri: team.logo }} style={styles.teamLogo} />
            <Text
              style={[styles.teamName, { color: theme.colors.text }]}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {formatTeamName(team.team)}
            </Text>
          </View>

          <Text style={[styles.statText, { color: theme.colors.text }]}>
            {team.played}
          </Text>
          <Text style={[styles.statText, { color: theme.colors.text }]}>
            {team.won}
          </Text>
          <Text style={[styles.statText, { color: theme.colors.text }]}>
            {team.drawn}
          </Text>
          <Text style={[styles.statText, { color: theme.colors.text }]}>
            {team.lost}
          </Text>
          <Text
            style={[
              styles.statText,
              { color: team.goalDifference >= 0 ? "#4CAF50" : "#F44336" },
            ]}
          >
            {team.goalDifference >= 0 ? "+" : ""}
            {team.goalDifference}
          </Text>
          <Text style={[styles.pointsText, { color: theme.colors.primary }]}>
            {team.points}
          </Text>

          <View style={styles.formContainer}>
            {team.form.map((result, index) => (
              <View
                key={index}
                style={[
                  styles.formResult,
                  { backgroundColor: getFormColor(result) },
                ]}
              >
                <Text style={styles.formResultText}>{result}</Text>
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );

  const renderPlayerRankings = () => (
    <View style={styles.rankingsContainer}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        {t("topScorers")} - {leagues.find((l) => l.id === selectedLeague)?.name}
      </Text>

      {playerRankings.map((player) => (
        <View
          key={player.id}
          style={[
            styles.playerRow,
            { backgroundColor: theme.colors.backgroundSecondary },
          ]}
        >
          <View style={styles.playerPosition}>
            {getPositionIcon(player.position)}
            <Text style={[styles.positionText, { color: theme.colors.text }]}>
              {player.position}
            </Text>
            {getTrendIcon(player.trend)}
          </View>

          <Image source={{ uri: player.photo }} style={styles.playerPhoto} />

          <View style={styles.playerInfo}>
            <Text style={[styles.playerName, { color: theme.colors.text }]}>
              {player.name}
            </Text>
            <Text
              style={[styles.playerTeam, { color: theme.colors.textSecondary }]}
            >
              {player.team}
            </Text>
          </View>

          <View style={styles.playerStats}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                {player.goals}
              </Text>
              <Text
                style={[
                  styles.statLabel,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {t("goals")}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>
                {player.assists}
              </Text>
              <Text
                style={[
                  styles.statLabel,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {t("assists")}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>
                {player.rating}
              </Text>
              <Text
                style={[
                  styles.statLabel,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {t("rating")}
              </Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );

  const renderLeagueRankings = () => (
    <View style={styles.rankingsContainer}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        {t("leagueRankingsByStrength")}
      </Text>

      {leagues.map((league, index) => (
        <View
          key={league.id}
          style={[
            styles.leagueRow,
            { backgroundColor: theme.colors.backgroundSecondary },
          ]}
        >
          <View style={styles.leaguePosition}>
            {getPositionIcon(index + 1)}
            <Text style={[styles.positionText, { color: theme.colors.text }]}>
              {index + 1}
            </Text>
          </View>

          <View style={styles.leagueInfo}>
            <Text style={[styles.leagueName, { color: theme.colors.text }]}>
              {league.name}
            </Text>
            <Text
              style={[
                styles.leagueCountry,
                { color: theme.colors.textSecondary },
              ]}
            >
              {league.country}
            </Text>
          </View>

          <View style={styles.leagueRating}>
            <Text style={[styles.ratingValue, { color: theme.colors.primary }]}>
              {(95 - index * 5).toFixed(1)}
            </Text>
            <Text
              style={[
                styles.ratingLabel,
                { color: theme.colors.textSecondary },
              ]}
            >
              {t("rating")}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "teams":
        return renderTeamRankings();
      case "players":
        return renderPlayerRankings();
      case "leagues":
        return renderLeagueRankings();
      default:
        return renderTeamRankings();
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {renderHeader()}
      {renderTabs()}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderSearchAndFilter()}
        {renderContent()}
      </ScrollView>
    </SafeAreaView>
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#2A2A2A",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Inter-SemiBold",
    flex: 1,
    textAlign: "center",
  },
  settingsButton: {
    padding: 4,
  },
  tabContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#2A2A2A",
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
    gap: 6,
  },
  tabText: {
    fontSize: 14,
    fontFamily: "Inter-Medium",
  },
  content: {
    flex: 1,
  },
  searchFilterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Inter-Regular",
  },
  leagueScroll: {
    marginBottom: 8,
  },
  leagueContainer: {
    gap: 8,
  },
  leagueButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  leagueButtonText: {
    fontSize: 14,
    fontFamily: "Inter-Medium",
  },
  rankingsContainer: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Inter-SemiBold",
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  tableHeaderText: {
    fontSize: 12,
    fontFamily: "Inter-SemiBold",
    flex: 1,
    textAlign: "center",
  },
  teamRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  positionContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: 50,
    gap: 4,
  },
  positionInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  positionText: {
    fontSize: 14,
    fontFamily: "Inter-SemiBold",
  },
  teamInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 2,
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
  },
  statText: {
    fontSize: 12,
    fontFamily: "Inter-Regular",
    flex: 0.5,
    textAlign: "center",
  },
  pointsText: {
    fontSize: 14,
    fontFamily: "Inter-Bold",
    flex: 0.5,
    textAlign: "center",
  },
  formContainer: {
    flexDirection: "row",
    gap: 2,
    flex: 1,
    justifyContent: "flex-end",
  },
  formResult: {
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  formResultText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontFamily: "Inter-Bold",
  },
  playerRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  playerPosition: {
    flexDirection: "row",
    alignItems: "center",
    width: 60,
    gap: 4,
  },
  playerPhoto: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontFamily: "Inter-SemiBold",
    marginBottom: 4,
  },
  playerTeam: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
  },
  playerStats: {
    flexDirection: "row",
    gap: 16,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 16,
    fontFamily: "Inter-Bold",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    fontFamily: "Inter-Regular",
  },
  leagueRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  leaguePosition: {
    flexDirection: "row",
    alignItems: "center",
    width: 60,
    gap: 8,
  },
  leagueInfo: {
    flex: 1,
  },
  leagueName: {
    fontSize: 16,
    fontFamily: "Inter-SemiBold",
    marginBottom: 4,
  },
  leagueCountry: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
  },
  leagueRating: {
    alignItems: "center",
  },
  ratingValue: {
    fontSize: 18,
    fontFamily: "Inter-Bold",
    marginBottom: 2,
  },
  ratingLabel: {
    fontSize: 10,
    fontFamily: "Inter-Regular",
  },
});
