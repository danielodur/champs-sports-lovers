/**
 * League Players Tab
 * Displays top players rankings in the league with vertical filter buttons
 * Based on the Chinese app design with left sidebar filters
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import teamLogoService from "@/services/teamLogoService";

interface LeaguePlayersProps {
  leagueId: string;
  season: string;
  theme: any;
  apiLeagueId?: number | null; // API ID passed from parent
  sport?: string; // ✅ CRITICAL: Add sport parameter
}

interface PlayerRankingItem {
  rank: number;
  playerId: number;
  playerName: string;
  playerPhoto: string | null;
  team: string;
  teamLogo: string | null;
  value: string;
  rawValue: number;
}

type RankingCategory = 
  | "assists" 
  | "goals" 
  | "shots" 
  | "shots_on_target" 
  | "passes" 
  | "successful_passes"
  | "key_passes"
  | "crosses"
  | "successful_crosses"
  | "dribbles"
  | "successful_dribbles"
  | "fouls"
  | "yellow_cards"
  | "red_cards"
  | "offsides"
  | "minutes_played"
  | "appearances";

interface RankingFilter {
  id: RankingCategory;
  label: string;
  displayHeader: string;
}

const API_FOOTBALL_KEY = process.env.EXPO_PUBLIC_API_FOOTBALL_KEY || "";

// Mock data generator - REMOVED: Now using real API data only
// Keeping function signature for reference but not using it
const _generateMockData = (category: RankingCategory): PlayerRankingItem[] => {
  const mockPlayers = [
    { name: "Erling Haaland", photo: "https://media.api-sports.io/football/players/1100.png", team: "Manchester City", teamId: 50 },
    { name: "Harry Kane", photo: "https://media.api-sports.io/football/players/184.png", team: "Bayern Munich", teamId: 157 },
    { name: "Kylian Mbappé", photo: "https://media.api-sports.io/football/players/984.png", team: "Paris Saint Germain", teamId: 85 },
    { name: "Mohamed Salah", photo: "https://media.api-sports.io/football/players/306.png", team: "Liverpool", teamId: 40 },
    { name: "Kevin De Bruyne", photo: "https://media.api-sports.io/football/players/629.png", team: "Manchester City", teamId: 50 },
    { name: "Bukayo Saka", photo: "https://media.api-sports.io/football/players/284.png", team: "Arsenal", teamId: 42 },
    { name: "Phil Foden", photo: "https://media.api-sports.io/football/players/1484.png", team: "Manchester City", teamId: 50 },
    { name: "Bruno Fernandes", photo: "https://media.api-sports.io/football/players/882.png", team: "Manchester United", teamId: 33 },
    { name: "Heung-Min Son", photo: "https://media.api-sports.io/football/players/645.png", team: "Tottenham", teamId: 47 },
    { name: "Darwin Núñez", photo: "https://media.api-sports.io/football/players/1488.png", team: "Liverpool", teamId: 40 },
    { name: "Gabriel Jesus", photo: "https://media.api-sports.io/football/players/881.png", team: "Arsenal", teamId: 42 },
    { name: "Jack Grealish", photo: "https://media.api-sports.io/football/players/643.png", team: "Manchester City", teamId: 50 },
    { name: "Marcus Rashford", photo: "https://media.api-sports.io/football/players/889.png", team: "Manchester United", teamId: 33 },
    { name: "Martin Ødegaard", photo: "https://media.api-sports.io/football/players/632.png", team: "Arsenal", teamId: 42 },
    { name: "Julián Álvarez", photo: "https://media.api-sports.io/football/players/1487.png", team: "Manchester City", teamId: 50 },
    { name: "James Maddison", photo: "https://media.api-sports.io/football/players/606.png", team: "Tottenham", teamId: 47 },
    { name: "Raheem Sterling", photo: "https://media.api-sports.io/football/players/635.png", team: "Chelsea", teamId: 49 },
    { name: "Diogo Jota", photo: "https://media.api-sports.io/football/players/1480.png", team: "Liverpool", teamId: 40 },
    { name: "Ollie Watkins", photo: "https://media.api-sports.io/football/players/2935.png", team: "Aston Villa", teamId: 66 },
    { name: "Cole Palmer", photo: "https://media.api-sports.io/football/players/161942.png", team: "Chelsea", teamId: 49 },
  ];

  const valuesByCategory: Record<RankingCategory, number[]> = {
    goals: [28, 24, 22, 20, 18, 16, 15, 14, 13, 12, 11, 10, 9, 9, 8, 8, 7, 7, 6, 6],
    assists: [15, 14, 12, 11, 10, 10, 9, 9, 8, 8, 7, 7, 6, 6, 5, 5, 4, 4, 3, 3],
    shots: [142, 138, 125, 118, 112, 108, 102, 98, 94, 88, 85, 82, 78, 75, 72, 68, 65, 62, 58, 55],
    shots_on_target: [68, 65, 58, 54, 51, 48, 45, 42, 39, 36, 34, 32, 30, 28, 26, 24, 22, 20, 18, 16],
    passes: [2245, 2189, 2134, 2078, 1998, 1945, 1892, 1834, 1789, 1723, 1678, 1625, 1578, 1534, 1489, 1445, 1398, 1356, 1312, 1278],
    successful_passes: [2012, 1968, 1915, 1867, 1789, 1745, 1698, 1654, 1612, 1567, 1523, 1478, 1434, 1389, 1345, 1298, 1256, 1212, 1167, 1123],
    key_passes: [78, 72, 68, 65, 62, 58, 55, 52, 48, 45, 42, 39, 36, 34, 31, 28, 25, 23, 20, 18],
    crosses: [145, 138, 132, 125, 118, 112, 105, 98, 92, 85, 78, 72, 68, 62, 58, 52, 48, 42, 38, 34],
    successful_crosses: [42, 39, 36, 34, 31, 28, 26, 24, 22, 20, 18, 16, 15, 14, 12, 11, 10, 9, 8, 7],
    dribbles: [168, 156, 145, 134, 125, 118, 112, 105, 98, 92, 85, 78, 72, 68, 62, 58, 52, 48, 42, 38],
    successful_dribbles: [98, 89, 82, 76, 71, 68, 64, 61, 58, 54, 51, 48, 44, 41, 38, 34, 31, 28, 25, 22],
    fouls: [78, 72, 68, 65, 62, 58, 55, 52, 48, 45, 42, 39, 36, 34, 31, 28, 25, 23, 20, 18],
    yellow_cards: [12, 11, 10, 10, 9, 9, 8, 8, 7, 7, 6, 6, 5, 5, 4, 4, 3, 3, 2, 2],
    red_cards: [2, 2, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    offsides: [28, 26, 24, 22, 20, 18, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3],
    minutes_played: [3150, 3060, 2970, 2880, 2790, 2700, 2610, 2520, 2430, 2340, 2250, 2160, 2070, 1980, 1890, 1800, 1710, 1620, 1530, 1440],
    appearances: [35, 34, 33, 32, 31, 30, 29, 28, 27, 26, 25, 24, 23, 22, 21, 20, 19, 18, 17, 16],
  };

  const values = valuesByCategory[category];

  return mockPlayers.map((player, index) => {
    const rawValue = values[index];
    let displayValue = `${rawValue}`;
    
    // Add penalty info for goals
    if (category === "goals" && index < 5) {
      const penalties = Math.floor(rawValue * 0.2);
      displayValue = `${rawValue}(${penalties})`;
    }

    return {
      rank: index + 1,
      playerId: 1000 + index,
      playerName: player.name,
      playerPhoto: player.photo,
      team: player.team,
      teamLogo: teamLogoService.getOfficialTeamLogo(player.team, "Premier League"),
      value: displayValue,
      rawValue,
    };
  });
};

const getLeagueApiId = (leagueId: string): number | null => {
  const leagueMap: { [key: string]: number } = {
    "premier-league": 39,
    "la-liga": 140,
    "bundesliga": 78,
    "serie-a": 135,
    "ligue-1": 61,
    "champions-league": 2,
    "europa-league": 3,
    "eredivisie": 88,
    "primeira-liga": 94,
  };
  return leagueMap[leagueId] || null;
};

const getLeagueName = (leagueId: string): string => {
  const leagueNameMap: { [key: string]: string } = {
    "premier-league": "Premier League",
    "la-liga": "La Liga",
    "bundesliga": "Bundesliga",
    "serie-a": "Serie A",
    "ligue-1": "Ligue 1",
    "uganda-premier-league": "Uganda Premier League",
    "champions-league": "UEFA Champions League",
    "europa-league": "UEFA Europa League",
  };
  return leagueNameMap[leagueId] || "League";
};

const rankingFilters: RankingFilter[] = [
  { id: "assists", label: "Assists", displayHeader: "Assists" },
  { id: "goals", label: "Goals", displayHeader: "Goals" },
  { id: "shots", label: "Shots", displayHeader: "Shots" },
  { id: "shots_on_target", label: "Shots On Target", displayHeader: "Shots On Target" },
  { id: "passes", label: "Passes", displayHeader: "Passes" },
  { id: "successful_passes", label: "Successful Passes", displayHeader: "Successful Passes" },
  { id: "key_passes", label: "Key Passes", displayHeader: "Key Passes" },
  { id: "crosses", label: "Crosses", displayHeader: "Crosses" },
  { id: "successful_crosses", label: "Successful Crosses", displayHeader: "Successful Crosses" },
  { id: "dribbles", label: "Dribbles", displayHeader: "Dribbles" },
  { id: "successful_dribbles", label: "Successful Dribbles", displayHeader: "Successful Dribbles" },
  { id: "fouls", label: "Fouls", displayHeader: "Fouls" },
  { id: "yellow_cards", label: "Yellow Cards", displayHeader: "Yellow Cards" },
  { id: "red_cards", label: "Red Cards", displayHeader: "Red Cards" },
  { id: "offsides", label: "Offsides", displayHeader: "Offsides" },
  { id: "minutes_played", label: "Minutes Played", displayHeader: "Minutes" },
  { id: "appearances", label: "Appearances", displayHeader: "Appearances" },
];

export default function LeaguePlayers({ leagueId, season, theme, apiLeagueId, sport = "football" }: LeaguePlayersProps) {
  const router = useRouter();
  const isDarkMode = theme.colors.backgroundSecondary !== "#F5F5F5";
  const [selectedCategory, setSelectedCategory] = useState<RankingCategory>("assists");
  const [players, setPlayers] = useState<PlayerRankingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const leagueName = getLeagueName(leagueId);
  
  // ✅ CRITICAL: Use provided API ID or import from parent component to get full mapping including A-League
  const resolvedApiLeagueId = useMemo(() => {
    if (apiLeagueId !== undefined) {
      return apiLeagueId;
    }
    // Import the function from parent component to get complete league mapping
    const { getLeagueApiId: getParentLeagueApiId } = require("../[leagueId]");
    return getParentLeagueApiId(leagueId, undefined, sport);
  }, [apiLeagueId, leagueId, sport]);

  // Helper function to check if a URL is a country flag (not a team logo)
  const isCountryFlagUrl = (url: string | null | undefined): boolean => {
    if (!url) return false;
    const urlLower = url.toLowerCase();
    // Check for common country flag URL patterns
    return (
      urlLower.includes('flagcdn.com') ||
      urlLower.includes('flag') ||
      urlLower.includes('country') ||
      urlLower.includes('national') ||
      urlLower.match(/\/flags?\/|\/country\//) !== null
    );
  };

  // Navigate to player details
  const handlePlayerPress = (player: PlayerRankingItem) => {
    // Validate team logo - reject if it's a country flag
    const validTeamLogo = player.teamLogo && !isCountryFlagUrl(player.teamLogo) 
      ? player.teamLogo 
      : undefined;

    console.log(`👤 [LeaguePlayers] Navigating to player: ${player.playerName}`, {
      team: player.team,
      teamLogo: player.teamLogo,
      validTeamLogo,
      isCountryFlag: isCountryFlagUrl(player.teamLogo),
    });

    router.push({
      pathname: "/player-details/[playerId]",
      params: {
        playerId: player.playerId.toString(),
        playerName: player.playerName,
        playerPhoto: player.playerPhoto || "",
        sourceTeamName: player.team, // Pass as sourceTeamName for watermark
        sourceTeamLogo: validTeamLogo || "", // Pass validated team logo (not country flag) for watermark
      },
    });
  };

  // Fetch player rankings from API Football
  const fetchPlayerRankings = useCallback(async (category: RankingCategory) => {
    setError(null);
    setLoading(true);

    try {
      const seasonYear = parseInt(season.split("-")[0]);
      
      if (!resolvedApiLeagueId) {
        setError("League not available in API-Football. This league may not be supported.");
        setLoading(false);
        return;
      }

      // Map category to API Football endpoint
      const categoryMap: { [key in RankingCategory]: string } = {
        goals: "goals",
        assists: "assists",
        shots: "shots",
        shots_on_target: "shotsOnTarget",
        passes: "passes",
        successful_passes: "passesAccuracy",
        key_passes: "keyPasses",
        crosses: "crosses",
        successful_crosses: "crossesAccuracy",
        dribbles: "dribbles",
        successful_dribbles: "dribblesSuccess",
        fouls: "fouls",
        yellow_cards: "yellowCards",
        red_cards: "redCards",
        offsides: "offsides",
        minutes_played: "minutes",
        appearances: "appearances",
      };

      const apiCategory = categoryMap[category] || "goals";
      
      // Fetch player statistics from API Football
      const API_FOOTBALL_KEY = process.env.EXPO_PUBLIC_API_FOOTBALL_KEY || "";
      
      if (!API_FOOTBALL_KEY) {
        setError("API key not configured");
        setLoading(false);
        return;
      }

      // ✅ CRITICAL: This component is ONLY for football (parent component already filters by sport)
      // If basketball support is needed, this entire API call structure needs to change
      // Use appropriate endpoint based on category
      let endpoint = `https://v3.football.api-sports.io/players/topscorers?league=${resolvedApiLeagueId}&season=${seasonYear}`;
      
      if (category === "assists") {
        endpoint = `https://v3.football.api-sports.io/players/topassists?league=${resolvedApiLeagueId}&season=${seasonYear}`;
      }
      
      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          "x-rapidapi-host": "v3.football.api-sports.io",
          "x-rapidapi-key": API_FOOTBALL_KEY,
        },
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      const players = data.response || [];
      
      // Transform player data based on category
      const transformedPlayers: PlayerRankingItem[] = players.slice(0, 20).map((item: any, index: number) => {
        const stats = item.statistics[0];
        let value = "0";
        let rawValue = 0;
        
        switch (category) {
          case "goals":
            const goals = stats?.goals?.total || 0;
            const penalties = stats?.goals?.penalty || 0;
            value = penalties > 0 ? `${goals}(${penalties})` : `${goals}`;
            rawValue = goals;
            break;
          case "assists":
            value = `${stats?.goals?.assists || 0}`;
            rawValue = stats?.goals?.assists || 0;
            break;
          case "shots":
            value = `${stats?.shots?.total || 0}`;
            rawValue = stats?.shots?.total || 0;
            break;
          case "shots_on_target":
            value = `${stats?.shots?.on || 0}`;
            rawValue = stats?.shots?.on || 0;
            break;
          case "passes":
            value = `${stats?.passes?.total || 0}`;
            rawValue = stats?.passes?.total || 0;
            break;
          case "successful_passes":
            value = `${stats?.passes?.accuracy || 0}%`;
            rawValue = parseInt(stats?.passes?.accuracy || "0");
            break;
          case "key_passes":
            value = `${stats?.passes?.key || 0}`;
            rawValue = stats?.passes?.key || 0;
            break;
          case "crosses":
            value = `${stats?.passes?.crosses?.total || 0}`;
            rawValue = stats?.passes?.crosses?.total || 0;
            break;
          case "successful_crosses":
            value = `${stats?.passes?.crosses?.accuracy || 0}%`;
            rawValue = parseInt(stats?.passes?.crosses?.accuracy || "0");
            break;
          case "dribbles":
            value = `${stats?.dribbles?.attempts || 0}`;
            rawValue = stats?.dribbles?.attempts || 0;
            break;
          case "successful_dribbles":
            value = `${stats?.dribbles?.success || 0}`;
            rawValue = stats?.dribbles?.success || 0;
            break;
          case "fouls":
            value = `${stats?.fouls?.committed || 0}`;
            rawValue = stats?.fouls?.committed || 0;
            break;
          case "yellow_cards":
            value = `${stats?.cards?.yellow || 0}`;
            rawValue = stats?.cards?.yellow || 0;
            break;
          case "red_cards":
            value = `${stats?.cards?.red || 0}`;
            rawValue = stats?.cards?.red || 0;
            break;
          case "offsides":
            value = `${stats?.offsides || 0}`;
            rawValue = stats?.offsides || 0;
            break;
          case "minutes_played":
            value = `${stats?.games?.minutes || 0}`;
            rawValue = stats?.games?.minutes || 0;
            break;
          case "appearances":
            value = `${stats?.games?.appearences || 0}`;
            rawValue = stats?.games?.appearences || 0;
            break;
          default:
            // Default to goals
            const defaultGoals = stats?.goals?.total || 0;
            const defaultPenalties = stats?.goals?.penalty || 0;
            value = defaultPenalties > 0 ? `${defaultGoals}(${defaultPenalties})` : `${defaultGoals}`;
            rawValue = defaultGoals;
        }
        
        return {
          rank: index + 1,
          playerId: item.player.id,
          playerName: item.player.name,
          playerPhoto: item.player.photo,
          team: stats?.team?.name || "Unknown",
          teamLogo: stats?.team?.logo || null,
          value,
          rawValue,
        };
      });
      
      // Sort by rawValue descending for accurate ranking
      transformedPlayers.sort((a, b) => b.rawValue - a.rawValue);
      transformedPlayers.forEach((p, idx) => { p.rank = idx + 1; });
      
      setPlayers(transformedPlayers);
    } catch (err) {
      console.error("Error fetching player rankings:", err);
      setError("Failed to load player rankings");
      // Don't use mock data - show error instead
      setPlayers([]);
    } finally {
      setLoading(false);
    }
  }, [leagueId, season]);

  useEffect(() => {
    fetchPlayerRankings(selectedCategory);
  }, [selectedCategory, season, fetchPlayerRankings]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPlayerRankings(selectedCategory);
    setRefreshing(false);
  }, [selectedCategory, fetchPlayerRankings]);

  const handleCategoryChange = (category: RankingCategory) => {
    setSelectedCategory(category);
  };

  const currentFilter = rankingFilters.find(f => f.id === selectedCategory);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.contentWrapper}>
        {/* Left Sidebar - Vertical Filter Buttons */}
        <View style={[styles.sidebar, { backgroundColor: theme.colors.background }]}>
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.sidebarContent}
          >
            {rankingFilters.map((filter) => {
              const isActive = selectedCategory === filter.id;
              return (
              <TouchableOpacity
                key={filter.id}
                style={[
                  styles.filterButton,
                  isActive && { 
                    backgroundColor: theme.colors.backgroundSecondary
                  },
                ]}
                onPress={() => handleCategoryChange(filter.id)}
                activeOpacity={0.7}
              >
                  <Text
                    style={[
                      styles.filterButtonText,
                      {
                        color: isActive ? theme.colors.primary : theme.colors.textSecondary,
                        fontWeight: isActive ? "700" : "500",
                      },
                    ]}
                    numberOfLines={2}
                  >
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Right Content - Player Rankings List */}
        <View style={styles.mainContent}>
          {/* Combined Header Section with Dark Background */}
          <View style={{ backgroundColor: theme.colors.backgroundSecondary }}>
            {/* Header with current filter title */}
            <View style={styles.headerContainer}>
              <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
                {currentFilter?.displayHeader}
              </Text>
            </View>

            {/* Table Headers */}
            <View style={[styles.tableHeader, { borderBottomColor: theme.colors.textSecondary + "20" }]}>
              <Text style={[styles.headerText, styles.rankCol, { color: theme.colors.textSecondary }]}>
                #
              </Text>
              <Text style={[styles.headerText, styles.playerCol, { color: theme.colors.textSecondary }]}>
                Player
              </Text>
              <Text style={[styles.headerText, styles.teamCol, { color: theme.colors.textSecondary }]}>
                Team
              </Text>
              <Text style={[styles.headerText, styles.valueCol, { color: theme.colors.textSecondary }]}>
                Data
              </Text>
            </View>
          </View>

          {/* Players List */}
          {loading && !refreshing ? (
            <View style={[styles.centerContent, { backgroundColor: theme.colors.backgroundSecondary }]}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
                Loading rankings...
              </Text>
            </View>
          ) : error ? (
            <View style={[styles.centerContent, { backgroundColor: theme.colors.backgroundSecondary }]}>
              <Text style={[styles.errorText, { color: theme.colors.text }]}>{error}</Text>
              <TouchableOpacity
                style={[styles.retryButton, { borderColor: theme.colors.primary }]}
                onPress={onRefresh}
              >
                <Text style={[styles.retryButtonText, { color: theme.colors.primary }]}>
                  Retry
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView
              style={[styles.playersList, { backgroundColor: theme.colors.backgroundSecondary }]}
              contentContainerStyle={styles.playersListContent}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={[theme.colors.primary]}
                  tintColor={theme.colors.primary}
                />
              }
              showsVerticalScrollIndicator={false}
            >
              {players.length > 0 ? (
                players.map((player, index) => (
                  <TouchableOpacity
                    key={`${player.playerId}-${player.rank}`}
                    style={[
                      styles.playerRow, 
                      { 
                        borderBottomWidth: 1,
                        borderBottomColor: "rgba(128, 128, 128, 0.15)", 
                        backgroundColor: theme.colors.backgroundSecondary 
                      }
                    ]}
                    onPress={() => handlePlayerPress(player)}
                    activeOpacity={0.7}
                  >
                    {/* Rank */}
                    <Text style={[styles.rankText, styles.rankCol, { color: theme.colors.text }]}>
                      {player.rank}
                    </Text>

                    {/* Player Info with Photo */}
                    <View style={[styles.playerInfo, styles.playerCol]}>
                      <View style={styles.playerPhotoCircle}>
                        {player.playerPhoto ? (
                          <Image
                            source={{ uri: player.playerPhoto }}
                            style={styles.playerPhoto}
                            resizeMode="cover"
                          />
                        ) : null}
                      </View>
                      <Text 
                        style={[styles.playerName, { color: theme.colors.text }]} 
                        numberOfLines={1}
                      >
                        {player.playerName}
                      </Text>
                    </View>

                    {/* Team Logo - Only logo, no team name */}
                    <View style={[styles.teamCell, styles.teamCol]}>
                      {player.teamLogo ? (
                        <Image
                          source={{ uri: player.teamLogo }}
                          style={styles.teamLogo}
                          resizeMode="contain"
                        />
                      ) : null}
                    </View>

                    {/* Value */}
                    <Text style={[styles.valueText, styles.valueCol, { color: theme.colors.text }]}>
                      {player.value}
                    </Text>
                  </TouchableOpacity>
                ))
              ) : (
                <View style={[styles.emptyState, { backgroundColor: theme.colors.backgroundSecondary }]}>
                  <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                    No player data available for this category.
                  </Text>
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </View>
  );
}

// Generate mock data when API is not available
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 0,
  },
  contentWrapper: {
    flex: 1,
    flexDirection: "row",
  },
  // Left Sidebar Styles
  sidebar: {
    width: 115,
    borderRightWidth: 1,
    borderRightColor: "rgba(128, 128, 128, 0.1)",
  },
  sidebarContent: {
    paddingTop: 0,
    paddingBottom: 12,
    paddingHorizontal: 0,
    paddingRight: 34,
  },
  filterButton: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    paddingLeft: 8,
    marginBottom: 8,
    borderRadius: 0,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    minHeight: 50,
    justifyContent: "center",
  },
  filterButtonText: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 16,
  },
  // Main Content Styles
  mainContent: {
    flex: 1,
    marginLeft: -40,
  },
  headerContainer: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    paddingLeft: 0,
    borderBottomWidth: 0,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  tableHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    paddingLeft: 0,
    borderBottomWidth: 1,
  },
  headerText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  rankCol: {
    width: 40,
    paddingLeft: 8,
  },
  playerCol: {
    flex: 1,
    minWidth: 0,
    paddingLeft: 4,
  },
  teamCol: {
    width: 70,
    alignItems: "center",
  },
  valueCol: {
    width: 70,
    textAlign: "right",
  },
  // Players List Styles
  playersList: {
    flex: 1,
  },
  playersListContent: {
    paddingBottom: 32,
  },
  playerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    paddingLeft: 0,
    borderBottomWidth: 1,
  },
  rankText: {
    fontSize: 14,
    fontWeight: "700",
  },
  playerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minWidth: 0,
  },
  playerPhotoCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: "rgba(128, 128, 128, 0.05)",
    borderColor: "rgba(128, 128, 128, 0.08)",
    overflow: "hidden",
  },
  playerPhoto: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  playerName: {
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
  teamCell: {
    justifyContent: "center",
    alignItems: "center",
  },
  teamLogo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "transparent",
  },
  valueText: {
    fontSize: 14,
    fontWeight: "700",
  },
  // Loading & Error States
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  errorText: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  retryButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
  },
});
