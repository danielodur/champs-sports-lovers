/**
 * @fileoverview NewsTeamPlayersScreen - Refactored player rankings screen
 *
 * This screen provides detailed player rankings using modular components for
 * horizontal and vertical tabs, significantly reducing code complexity while
 * maintaining the Chinese sports app layout exactly.
 *
 * @author AI Assistant
 * @version 2.0.0 (Refactored)
 */

import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Dimensions,
} from "react-native";
import { useTheme } from "@/hooks/useTheme";
import NewsTeamPlayersHorizontal, {
  playerRankingCategories,
  PlayerRankingCategory,
  PlayerRankingStat,
} from "@/modules/news/components/shared/news-team-players-horizontal";
import NewsTeamPlayersVertical from "@/modules/news/components/shared/news-team-players-vertical";

const { width } = Dimensions.get("window");

/**
 * Interface for player ranking data
 */
interface PlayerRanking {
  position: number;
  playerName: string;
  playerPhoto?: string;
  teamName: string;
  teamLogo?: string;
  value: number;
  average: number;
  totalMatches: number;
  additional?: number;
}

// Sample player data - will be replaced by API data
const samplePlayerData: PlayerRanking[] = [
  {
    position: 1,
    playerName: "Mbappe",
    playerPhoto: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mbappe",
    teamName: "Real Madrid",
    teamLogo: "https://logos.sportmonks.com/football/teams/164/651.png",
    value: 8,
    average: 2.67,
    totalMatches: 3,
    additional: 2,
  },
  {
    position: 2,
    playerName: "Alvarez",
    playerPhoto: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alvarez",
    teamName: "Atletico Madrid",
    teamLogo: "https://logos.sportmonks.com/football/teams/164/1654.png",
    value: 6,
    average: 2.0,
    totalMatches: 3,
    additional: 1,
  },
  {
    position: 3,
    playerName: "Ayoze",
    playerPhoto: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ayoze",
    teamName: "Levante",
    teamLogo: "https://logos.sportmonks.com/football/teams/164/1665.png",
    value: 5,
    average: 1.67,
    totalMatches: 3,
    additional: 0,
  },
  {
    position: 4,
    playerName: "Torres",
    playerPhoto: "https://api.dicebear.com/7.x/avataaars/svg?seed=Torres",
    teamName: "Barcelona",
    teamLogo: "https://logos.sportmonks.com/football/teams/164/1369.png",
    value: 4,
    average: 1.33,
    totalMatches: 3,
    additional: 0,
  },
  {
    position: 5,
    playerName: "Raphinha",
    playerPhoto: "https://api.dicebear.com/7.x/avataaars/svg?seed=Raphinha",
    teamName: "Barcelona",
    teamLogo: "https://logos.sportmonks.com/football/teams/164/1369.png",
    value: 4,
    average: 1.33,
    totalMatches: 3,
    additional: 0,
  },
  {
    position: 6,
    playerName: "Romelu",
    playerPhoto: "https://api.dicebear.com/7.x/avataaars/svg?seed=Romelu",
    teamName: "Levante",
    teamLogo: "https://logos.sportmonks.com/football/teams/164/1665.png",
    value: 4,
    average: 1.33,
    totalMatches: 3,
    additional: 0,
  },
  {
    position: 7,
    playerName: "Inaki Williams",
    playerPhoto: "https://api.dicebear.com/7.x/avataaars/svg?seed=Inaki",
    teamName: "Celta",
    teamLogo: "https://logos.sportmonks.com/football/teams/164/1671.png",
    value: 4,
    average: 1.33,
    totalMatches: 3,
    additional: 1,
  },
  {
    position: 8,
    playerName: "Modric",
    playerPhoto: "https://api.dicebear.com/7.x/avataaars/svg?seed=Modric",
    teamName: "Real Madrid",
    teamLogo: "https://logos.sportmonks.com/football/teams/164/651.png",
    value: 4,
    average: 1.33,
    totalMatches: 3,
    additional: 1,
  },
  {
    position: 9,
    playerName: "Vinicius",
    playerPhoto: "https://api.dicebear.com/7.x/avataaars/svg?seed=Vinicius",
    teamName: "Real Madrid",
    teamLogo: "https://logos.sportmonks.com/football/teams/164/651.png",
    value: 3,
    average: 1.0,
    totalMatches: 3,
    additional: 0,
  },
  {
    position: 10,
    playerName: "Bellingham",
    playerPhoto: "https://api.dicebear.com/7.x/avataaars/svg?seed=Bellingham",
    teamName: "Real Madrid",
    teamLogo: "https://logos.sportmonks.com/football/teams/164/651.png",
    value: 3,
    average: 1.0,
    totalMatches: 3,
    additional: 0,
  },
  {
    position: 11,
    playerName: "Raphinha",
    playerPhoto: "https://api.dicebear.com/7.x/avataaars/svg?seed=RaphinhaB",
    teamName: "Barcelona",
    teamLogo: "https://logos.sportmonks.com/football/teams/164/1369.png",
    value: 3,
    average: 1.0,
    totalMatches: 3,
    additional: 0,
  },
  {
    position: 12,
    playerName: "Kounde",
    playerPhoto: "https://api.dicebear.com/7.x/avataaars/svg?seed=Kounde",
    teamName: "Barcelona",
    teamLogo: "https://logos.sportmonks.com/football/teams/164/1369.png",
    value: 2,
    average: 0.67,
    totalMatches: 3,
    additional: 0,
  },
  {
    position: 13,
    playerName: "Griezmann",
    playerPhoto: "https://api.dicebear.com/7.x/avataaars/svg?seed=Griezmann",
    teamName: "Atletico Madrid",
    teamLogo: "https://logos.sportmonks.com/football/teams/164/1654.png",
    value: 2,
    average: 0.67,
    totalMatches: 3,
    additional: 0,
  },
  {
    position: 14,
    playerName: "Suso",
    playerPhoto: "https://api.dicebear.com/7.x/avataaars/svg?seed=Suso",
    teamName: "Celta",
    teamLogo: "https://logos.sportmonks.com/football/teams/164/1671.png",
    value: 2,
    average: 0.67,
    totalMatches: 3,
    additional: 0,
  },
  {
    position: 15,
    playerName: "Koke",
    playerPhoto: "https://api.dicebear.com/7.x/avataaars/svg?seed=Koke",
    teamName: "Atletico Madrid",
    teamLogo: "https://logos.sportmonks.com/football/teams/164/1654.png",
    value: 2,
    average: 0.67,
    totalMatches: 3,
    additional: 0,
  },
];

const generatePlayerPhoto = (playerName: string): string => {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(playerName)}`;
};

/**
 * Main component for player rankings display
 */
export default function NewsTeamPlayersScreen({
  leagueInfo,
  teamContext,
}: {
  leagueInfo?: {
    id: string;
    name: string;
    country: string;
    season: string;
    teams: string[];
  };
  teamContext?: {
    teamName?: string;
    leagueId?: string;
  };
}) {
  const theme = useTheme();
  const [activeCategory, setActiveCategory] = useState("goalscorers");
  const [activeStat, setActiveStat] = useState("goals");
  const [refreshing, setRefreshing] = useState(false);

  const isDarkMode = theme.colors.background === "#2A2A2A";

  // Get current category and stat configurations
  const currentCategory = playerRankingCategories.find(
    (cat) => cat.id === activeCategory,
  );
  const currentStat = currentCategory?.stats.find(
    (stat) => stat.id === activeStat,
  );

  /**
   * Generate league-specific player rankings based on current league context
   */
  const generateLeagueSpecificPlayerRankings = (
    baseData: PlayerRanking[],
    league: typeof leagueInfo,
  ): PlayerRanking[] => {
    if (!league || !league.teams) return baseData;

    const leagueTeams = league.teams.slice(
      0,
      Math.min(league.teams.length, 20),
    );
    const playersPerTeam = 2;
    const leaguePlayers: PlayerRanking[] = [];

    leagueTeams.forEach((teamName, teamIndex) => {
      const numPlayersForTeam = Math.random() > 0.3 ? 2 : 1;

      for (
        let playerIndex = 0;
        playerIndex < numPlayersForTeam;
        playerIndex++
      ) {
        const baseTemplate = baseData[leaguePlayers.length % baseData.length];
        const playerNames = [
          `${teamName.split(" ")[0]} Star`,
          `${teamName.split(" ")[0]} Ace`,
          `${teamName.substring(0, 3)}${playerIndex + 1}`,
          `Player ${leaguePlayers.length + 1}`,
        ];

        leaguePlayers.push({
          ...baseTemplate,
          position: leaguePlayers.length + 1,
          playerName:
            playerNames[playerIndex] || `Player ${leaguePlayers.length + 1}`,
          teamName: teamName,
          teamLogo: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(teamName)}&backgroundColor=f0f0f0`,
          playerPhoto: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(`${teamName}-${playerIndex}`)}`,
        });
      }
    });

    return leaguePlayers.slice(0, 30);
  };

  // Generate league-specific data
  const displayData = React.useMemo(() => {
    return generateLeagueSpecificPlayerRankings(samplePlayerData, leagueInfo);
  }, [leagueInfo]);

  /**
   * Handle refresh functionality - will integrate with API
   */
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // TODO: Fetch fresh data from API
      console.log(
        `Refreshing ${leagueInfo?.name || "league"} player rankings: ${activeCategory} - ${activeStat}`,
      );
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error("Failed to refresh player rankings:", error);
    } finally {
      setRefreshing(false);
    }
  };

  /**
   * Handle category change from horizontal tabs
   */
  const handleCategoryChange = (categoryId: string) => {
    setActiveCategory(categoryId);
    const newCategory = playerRankingCategories.find(
      (cat) => cat.id === categoryId,
    );
    if (newCategory && newCategory.stats.length > 0) {
      setActiveStat(newCategory.stats[0].id);
    }
  };

  /**
   * Handle stat change from vertical tabs
   */
  const handleStatChange = (statId: string) => {
    setActiveStat(statId);
  };

  /**
   * Render player ranking row
   */
  const renderPlayerRow = (player: PlayerRanking, index: number) => (
    <TouchableOpacity
      key={`${player.position}-${player.playerName}`}
      style={[
        styles.playerRow,
        {
          backgroundColor:
            index % 2 === 0 ? "transparent" : theme.colors.backgroundSecondary,
          borderBottomColor: theme.colors.border,
        },
      ]}
      activeOpacity={0.7}
    >
      {/* Position */}
      <Text style={[styles.position, { color: theme.colors.text }]}>
        {player.position}
      </Text>

      {/* Player Info */}
      <View style={styles.playerInfo}>
        <Image
          source={{
            uri: player.playerPhoto || generatePlayerPhoto(player.playerName),
          }}
          style={styles.playerPhoto}
          resizeMode="cover"
        />
        <View style={styles.playerDetails}>
          <Text
            style={[styles.playerName, { color: theme.colors.text }]}
            numberOfLines={1}
          >
            {player.playerName}
          </Text>
          <View style={styles.teamInfo}>
            <Image
              source={{ uri: player.teamLogo }}
              style={styles.teamLogo}
              resizeMode="contain"
            />
            <Text
              style={[styles.teamName, { color: theme.colors.textSecondary }]}
              numberOfLines={1}
            >
              {player.teamName}
            </Text>
          </View>
        </View>
      </View>

      {/* Team */}
      <View style={styles.teamColumn}>
        <Text style={[styles.teamText, { color: theme.colors.text }]}>
          {player.teamName.length > 8
            ? player.teamName.substring(0, 8) + "..."
            : player.teamName}
        </Text>
      </View>

      {/* Data */}
      <Text style={[styles.data, { color: theme.colors.text }]}>
        {player.additional !== undefined ? player.additional : player.value}
        {currentStat?.unit || ""}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* League Context Header */}
      <View
        style={[
          styles.leagueContextHeader,
          {
            backgroundColor: theme.colors.backgroundSecondary,
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        <View style={styles.leagueContextContent}>
          <Text
            style={[styles.leagueContextTitle, { color: theme.colors.text }]}
          >
            {leagueInfo?.name || "League"} Player Rankings
          </Text>
          <Text
            style={[
              styles.leagueContextSubtitle,
              { color: theme.colors.textSecondary },
            ]}
          >
            {displayData.length} players • {leagueInfo?.country || "Unknown"} •{" "}
            Season {leagueInfo?.season || "2024/25"}
          </Text>
        </View>
      </View>

      {/* Horizontal Category Tabs */}
      <NewsTeamPlayersHorizontal
        activeCategory={activeCategory}
        onCategoryChange={handleCategoryChange}
      />

      {/* Main Content Area */}
      <View style={styles.mainContent}>
        {/* Vertical Statistics Tabs */}
        <NewsTeamPlayersVertical
          currentCategory={currentCategory}
          activeStat={activeStat}
          onStatChange={handleStatChange}
        />

        {/* Rankings Content */}
        <View style={styles.rankingsContainer}>
          {/* Table Headers */}
          <View
            style={[
              styles.tableHeader,
              { backgroundColor: theme.colors.backgroundSecondary },
            ]}
          >
            <Text style={[styles.headerText, { color: theme.colors.text }]}>
              Player
            </Text>
            <Text style={[styles.headerText, { color: theme.colors.text }]}>
              Team
            </Text>
            <Text style={[styles.headerText, { color: theme.colors.text }]}>
              Data
            </Text>
          </View>

          {/* Players List */}
          <ScrollView
            style={styles.playersScroll}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[theme.colors.accent]}
                tintColor={theme.colors.accent}
              />
            }
          >
            {displayData.map(renderPlayerRow)}
          </ScrollView>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  leagueContextHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  leagueContextContent: {
    alignItems: "center",
  },
  leagueContextTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  leagueContextSubtitle: {
    fontSize: 13,
    textAlign: "center",
  },
  mainContent: {
    flex: 1,
    flexDirection: "row",
  },
  rankingsContainer: {
    flex: 1,
  },
  tableHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerText: {
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
  },
  playersScroll: {
    flex: 1,
  },
  playerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    minHeight: 60,
  },
  position: {
    fontSize: 16,
    fontWeight: "700",
    width: 35,
    textAlign: "center",
    color: "#666",
  },
  playerInfo: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 12,
  },
  playerPhoto: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  playerDetails: {
    flex: 1,
    marginLeft: 12,
  },
  playerName: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  teamInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  teamLogo: {
    width: 18,
    height: 18,
    marginRight: 6,
    borderRadius: 2,
  },
  teamName: {
    fontSize: 12,
    flex: 1,
  },
  teamColumn: {
    flex: 1,
    alignItems: "center",
  },
  teamText: {
    fontSize: 11,
    textAlign: "center",
    fontWeight: "500",
  },
  data: {
    fontSize: 16,
    fontWeight: "700",
    width: 50,
    textAlign: "center",
    color: "#FF6B35",
  },
});
