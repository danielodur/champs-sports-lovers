/**
 * @fileoverview NewsTeamRankingsScreen - Refactored team rankings screen
 *
 * This screen provides detailed team rankings using modular components for
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
import NewsTeamRankingsHorizontal, {
  rankingCategories,
  RankingCategory,
  RankingStat,
} from "@/modules/news/components/shared/news-team-rankings-horizontal";
import NewsTeamRankingsVertical from "@/modules/news/components/shared/news-team-rankings-vertical";

const { width } = Dimensions.get("window");

/**
 * Interface for team ranking data
 */
interface TeamRanking {
  position: number;
  teamName: string;
  teamLogo?: string;
  value: number;
  average: number;
  totalMatches: number;
  additional?: number; // For secondary statistics
}

// Sample team data - will be replaced by API data
const sampleTeamData: TeamRanking[] = [
  {
    position: 1,
    teamName: "Barcelona",
    teamLogo: "https://logos.sportmonks.com/football/teams/164/1369.png",
    value: 21,
    average: 3.0,
    totalMatches: 7,
    additional: 21,
  },
  {
    position: 2,
    teamName: "Real Madrid",
    teamLogo: "https://logos.sportmonks.com/football/teams/164/651.png",
    value: 16,
    average: 2.3,
    totalMatches: 7,
    additional: 16,
  },
  {
    position: 3,
    teamName: "Atletico Madrid",
    teamLogo: "https://logos.sportmonks.com/football/teams/164/1654.png",
    value: 14,
    average: 2.0,
    totalMatches: 7,
    additional: 14,
  },
  {
    position: 4,
    teamName: "Villarreal",
    teamLogo: "https://logos.sportmonks.com/football/teams/164/1650.png",
    value: 13,
    average: 1.9,
    totalMatches: 7,
    additional: 13,
  },
  {
    position: 5,
    teamName: "Levante",
    teamLogo: "https://logos.sportmonks.com/football/teams/164/1665.png",
    value: 13,
    average: 1.6,
    totalMatches: 8,
    additional: 13,
  },
  {
    position: 6,
    teamName: "Sevilla",
    teamLogo: "https://logos.sportmonks.com/football/teams/164/1659.png",
    value: 11,
    average: 1.6,
    totalMatches: 7,
    additional: 11,
  },
  {
    position: 7,
    teamName: "Real Betis",
    teamLogo: "https://logos.sportmonks.com/football/teams/164/1658.png",
    value: 11,
    average: 1.6,
    totalMatches: 7,
    additional: 11,
  },
  {
    position: 8,
    teamName: "Huesca",
    teamLogo: "https://logos.sportmonks.com/football/teams/164/1672.png",
    value: 10,
    average: 1.4,
    totalMatches: 7,
    additional: 10,
  },
  {
    position: 9,
    teamName: "Espanyol",
    teamLogo: "https://logos.sportmonks.com/football/teams/164/1652.png",
    value: 10,
    average: 1.4,
    totalMatches: 7,
    additional: 10,
  },
  {
    position: 10,
    teamName: "Valencia",
    teamLogo: "https://logos.sportmonks.com/football/teams/164/1653.png",
    value: 9,
    average: 1.3,
    totalMatches: 7,
    additional: 9,
  },
  {
    position: 11,
    teamName: "Getafe",
    teamLogo: "https://logos.sportmonks.com/football/teams/164/1663.png",
    value: 8,
    average: 1.1,
    totalMatches: 7,
    additional: 8,
  },
  {
    position: 12,
    teamName: "Celta Vigo",
    teamLogo: "https://logos.sportmonks.com/football/teams/164/1671.png",
    value: 8,
    average: 1.1,
    totalMatches: 7,
    additional: 8,
  },
  {
    position: 13,
    teamName: "Real Sociedad",
    teamLogo: "https://logos.sportmonks.com/football/teams/164/1656.png",
    value: 7,
    average: 1.0,
    totalMatches: 7,
    additional: 7,
  },
  {
    position: 14,
    teamName: "Osasuna",
    teamLogo: "https://logos.sportmonks.com/football/teams/164/1674.png",
    value: 7,
    average: 1.0,
    totalMatches: 7,
    additional: 7,
  },
  {
    position: 15,
    teamName: "Athletic Bilbao",
    teamLogo: "https://logos.sportmonks.com/football/teams/164/1655.png",
    value: 6,
    average: 0.9,
    totalMatches: 7,
    additional: 6,
  },
  {
    position: 16,
    teamName: "Mallorca",
    teamLogo: "https://logos.sportmonks.com/football/teams/164/1662.png",
    value: 5,
    average: 0.7,
    totalMatches: 7,
    additional: 5,
  },
  {
    position: 17,
    teamName: "Granada",
    teamLogo: "https://logos.sportmonks.com/football/teams/164/1661.png",
    value: 4,
    average: 0.6,
    totalMatches: 7,
    additional: 4,
  },
  {
    position: 18,
    teamName: "Cadiz",
    teamLogo: "https://logos.sportmonks.com/football/teams/164/1670.png",
    value: 4,
    average: 0.6,
    totalMatches: 7,
    additional: 4,
  },
  {
    position: 19,
    teamName: "Elche",
    teamLogo: "https://logos.sportmonks.com/football/teams/164/1664.png",
    value: 3,
    average: 0.4,
    totalMatches: 7,
    additional: 3,
  },
  {
    position: 20,
    teamName: "Alaves",
    teamLogo: "https://logos.sportmonks.com/football/teams/164/1660.png",
    value: 2,
    average: 0.3,
    totalMatches: 7,
    additional: 2,
  },
];

const generateTeamLogo = (teamName: string): string => {
  return `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(teamName)}&backgroundColor=f0f0f0`;
};

/**
 * Main component for team rankings display
 */
export default function NewsTeamRankingsScreen({
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
  const [activeCategory, setActiveCategory] = useState("goals");
  const [activeStat, setActiveStat] = useState("goals_for");
  const [refreshing, setRefreshing] = useState(false);

  const isDarkMode = theme.colors.background === "#2A2A2A";

  // Get current category and stat configurations
  const currentCategory = rankingCategories.find(
    (cat) => cat.id === activeCategory,
  );
  const currentStat = currentCategory?.stats.find(
    (stat) => stat.id === activeStat,
  );

  /**
   * Generate league-specific team rankings based on current league context
   */
  const generateLeagueSpecificRankings = (
    baseData: TeamRanking[],
    league: typeof leagueInfo,
  ): TeamRanking[] => {
    if (!league || !league.teams) return baseData;

    // Generate rankings for teams in the current league
    const leagueTeams = league.teams.slice(
      0,
      Math.min(league.teams.length, 20),
    );

    return leagueTeams.map((teamName, index) => {
      // Use base data as template but with league-specific team names
      const baseTemplate = baseData[index % baseData.length];

      return {
        ...baseTemplate,
        position: index + 1,
        teamName: teamName,
        // Generate league-appropriate logo URL
        teamLogo: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(teamName)}&backgroundColor=f0f0f0`,
      };
    });
  };

  /**
   * Generate league-specific team rankings based on current league context
   */
  const generateLeagueSpecificTeamRankings = (
    baseData: TeamRanking[],
    league: typeof leagueInfo,
  ): TeamRanking[] => {
    if (!league || !league.teams) return baseData;

    // Generate rankings for teams in the current league
    const leagueTeams = league.teams.slice(
      0,
      Math.min(league.teams.length, 20),
    );

    return leagueTeams.map((teamName, index) => {
      // Use base data as template but with league-specific team names
      const baseTemplate = baseData[index % baseData.length];

      return {
        ...baseTemplate,
        position: index + 1,
        teamName: teamName,
        // Generate league-appropriate logo URL
        teamLogo: generateTeamLogo(teamName),
      };
    });
  };

  // Generate league-specific data
  const displayData = React.useMemo(() => {
    return generateLeagueSpecificTeamRankings(sampleTeamData, leagueInfo);
  }, [leagueInfo]);

  /**
   * Handle refresh functionality - will integrate with API
   */
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // TODO: Fetch fresh team rankings data from API
      console.log(
        `Refreshing ${leagueInfo?.name || "league"} team rankings: ${activeCategory} - ${activeStat}`,
      );

      // Future API integration point:
      // const freshData = await apiService.getTeamRankings({
      //   leagueId: leagueInfo?.id,
      //   category: activeCategory,
      //   stat: activeStat,
      //   season: leagueInfo?.season
      // });
      // setDisplayData(freshData);

      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error("Failed to refresh team rankings:", error);
    } finally {
      setRefreshing(false);
    }
  };

  /**
   * Handle category change from horizontal tabs
   */
  const handleCategoryChange = (categoryId: string) => {
    setActiveCategory(categoryId);
    const newCategory = rankingCategories.find((cat) => cat.id === categoryId);
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
   * Render team ranking row
   */
  const renderTeamRow = (team: TeamRanking, index: number) => (
    <TouchableOpacity
      key={`${team.position}-${team.teamName}`}
      style={[
        styles.teamRow,
        {
          backgroundColor:
            index % 2 === 0 ? "transparent" : theme.colors.backgroundSecondary,
          borderBottomColor: theme.colors.border,
        },
      ]}
      activeOpacity={0.7}
      onPress={() => {
        // TODO: Navigate to team details screen
        console.log(`Navigate to team details for: ${team.teamName}`);
        // Future navigation implementation:
        // router.push({
        //   pathname: '/news-team-details',
        //   params: {
        //     teamName: team.teamName,
        //     teamId: team.teamName.toLowerCase().replace(/\s+/g, '-'),
        //     leagueId: leagueInfo?.id,
        //     season: leagueInfo?.season
        //   }
        // });
      }}
    >
      {/* Position */}
      <Text style={[styles.position, { color: theme.colors.text }]}>
        {team.position}
      </Text>

      {/* Team Info */}
      <View style={styles.teamInfo}>
        <Image
          source={{ uri: team.teamLogo || generateTeamLogo(team.teamName) }}
          style={styles.teamLogo}
          resizeMode="contain"
        />
        <Text
          style={[styles.teamName, { color: theme.colors.text }]}
          numberOfLines={1}
        >
          {team.teamName}
        </Text>
      </View>

      {/* Average */}
      <Text style={[styles.average, { color: theme.colors.text }]}>
        {team.average}
      </Text>

      {/* Data/Total */}
      <Text style={[styles.data, { color: theme.colors.text }]}>
        {team.additional || team.value}
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
            {leagueInfo?.name || "League"} Rankings
          </Text>
          <Text
            style={[
              styles.leagueContextSubtitle,
              { color: theme.colors.textSecondary },
            ]}
          >
            {displayData.length} teams • {leagueInfo?.country || "Unknown"} •{" "}
            Season {leagueInfo?.season || "2024/25"}
          </Text>
        </View>
      </View>

      {/* Horizontal Category Tabs */}
      <NewsTeamRankingsHorizontal
        activeCategory={activeCategory}
        onCategoryChange={handleCategoryChange}
      />

      {/* Main Content Area */}
      <View style={styles.mainContent}>
        {/* Vertical Statistics Tabs */}
        <NewsTeamRankingsVertical
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
              Team
            </Text>
            <Text style={[styles.headerText, { color: theme.colors.text }]}>
              Avg
            </Text>
            <Text style={[styles.headerText, { color: theme.colors.text }]}>
              Data
            </Text>
          </View>

          {/* Teams List */}
          <ScrollView
            style={styles.teamsScroll}
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
            {displayData.map(renderTeamRow)}
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
  teamRow: {
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
  },
  teamInfo: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 12,
  },
  teamLogo: {
    width: 32,
    height: 32,
    marginRight: 12,
    borderRadius: 4,
  },
  teamName: {
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  average: {
    fontSize: 14,
    fontWeight: "500",
    width: 60,
    textAlign: "center",
  },
  data: {
    fontSize: 16,
    fontWeight: "700",
    width: 50,
    textAlign: "center",
  },
  teamsScroll: {
    flex: 1,
  },
});
