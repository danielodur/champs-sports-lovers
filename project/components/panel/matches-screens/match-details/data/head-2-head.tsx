import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
  Dimensions,
} from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { router } from "expo-router";

// ==================== INTERFACES ====================

interface HeadToHeadMatch {
  matchId: string;
  date: string; // ISO format
  leagueName: string;
  leagueId?: string; // ✅ ADD: League ID for navigation
  leagueLogo: string;
  homeTeamId: string;
  homeTeamName: string;
  homeTeamLogo: string;
  homeScore: number;
  awayTeamId: string;
  awayTeamName: string;
  awayTeamLogo: string;
  awayScore: number;
  status: "finished" | "live" | "upcoming";
}

interface TeamH2HStats {
  teamId: string;
  teamName: string;
  teamLogo: string;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  winRate: number; // percentage
}

interface HeadToHeadData {
  homeTeamStats: TeamH2HStats;
  awayTeamStats: TeamH2HStats;
  matches: HeadToHeadMatch[];
  totalMatches: number;
}

interface HeadToHeadProps {
  homeTeamName: string;
  awayTeamName: string;
  homeTeamLogo: string;
  awayTeamLogo: string;
  matchId?: string;
  homeTeamId?: string;
  awayTeamId?: string;
  sport?: string; // "football" | "basketball"
}

// ==================== MAIN COMPONENT ====================

export default function HeadToHead({
  homeTeamName,
  awayTeamName,
  homeTeamLogo,
  awayTeamLogo,
  matchId,
  homeTeamId,
  awayTeamId,
  sport = "football", // Default to football
}: HeadToHeadProps) {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [h2hData, setH2hData] = useState<HeadToHeadData | null>(null);
  const [allMatches, setAllMatches] = useState<HeadToHeadMatch[]>([]);

  // Filter states
  const [matchLimit, setMatchLimit] = useState<6 | 10>(6);
  const [filterMode, setFilterMode] = useState<"homeVsAway" | "randomly">("homeVsAway");

  // ✅ FIX: Remove hardcoded placeholder - use generic football icon
  const DEFAULT_LOGO = "https://cdn-icons-png.flaticon.com/512/53/53283.png";

  const isBasketball = sport === "basketball";
  // Removed excessive console.log that causes performance issues
  
  // Ref for filter buttons ScrollView
  const filterScrollViewRef = useRef<ScrollView>(null);
  const filterButtonPositionsRef = useRef<{ [key: string]: number }>({});
  
  // Auto-scroll to center pressed button
  const scrollToFilterButton = (buttonId: string) => {
    const buttonPosition = filterButtonPositionsRef.current[buttonId];
    if (buttonPosition !== undefined && filterScrollViewRef.current) {
      const screenWidth = Dimensions.get('window').width;
      const scrollPosition = Math.max(0, buttonPosition - (screenWidth / 2) + 50);
      filterScrollViewRef.current.scrollTo({
        x: scrollPosition,
        animated: true,
      });
    }
  };

  // ==================== DATA FETCHING ====================

  // ✅ FIX: Only fetch once on mount, then filter locally
  useEffect(() => {
    if (homeTeamId && awayTeamId) {
      fetchHeadToHeadData();
    } else {
      console.warn("⚠️ Head-to-Head: Team IDs not available from API yet");
      console.warn(`🏠 Home Team ID: ${homeTeamId || "undefined"}`);
      console.warn(`✈️ Away Team ID: ${awayTeamId || "undefined"}`);
      setError("Team IDs not available from API. Please ensure the API provides home and away team IDs.");
      setLoading(false);
    }
  }, [homeTeamId, awayTeamId]);

  // ✅ FIX: Update filtered matches when filters change (no refetch)
  useEffect(() => {
    if (allMatches.length > 0 && h2hData) {
      updateFilteredMatches();
    }
  }, [matchLimit, filterMode]);

  const fetchHeadToHeadData = async () => {
    setLoading(true);
    setError(null);
    setH2hData(null);

    try {
      // Parameter validation
      if (!homeTeamId || !awayTeamId) {
        console.warn(
          `⚠️ Head-to-Head: Missing team IDs. Home ID: ${homeTeamId || "undefined"}, Away ID: ${awayTeamId || "undefined"}`
        );
        setError("Head-to-Head data requires team IDs from the API. Please ensure your API provides team identifiers in the match data.");
        setLoading(false);
        return;
      }

      console.log(`⚔️ Fetching REAL Head-to-Head data from API`);
      console.log(`🏠 Home Team: ${homeTeamName} (ID: ${homeTeamId})`);
      console.log(`✈️ Away Team: ${awayTeamName} (ID: ${awayTeamId})`);
      console.log(`🔢 Match Limit: ${matchLimit}`);
      console.log(`🎲 Filter Mode: ${filterMode}`);

      // ✅ REAL API: Use api-sports-service to get actual head-to-head data
      const ApiSportsService = (await import("@/services/api-sports-service")).default;
      const apiService = new ApiSportsService({
        apiKey: process.env.EXPO_PUBLIC_API_FOOTBALL_KEY || "",
        baseUrl: "https://v3.football.api-sports.io",
      });
      
      // Fetch head-to-head matches
      const h2hResponse = await apiService.getHeadToHead(
        parseInt(homeTeamId),
        parseInt(awayTeamId)
      );

      console.log(`📊 H2H API Response:`, h2hResponse);

      if (!h2hResponse || !h2hResponse.response || h2hResponse.response.length === 0) {
        console.warn(`⚠️ No head-to-head data found for these teams`);
        setError("No head-to-head matches found between these teams.");
        setLoading(false);
        return;
      }

      // Transform API data to component format
      const apiMatches = h2hResponse.response;
      
      // Calculate stats from actual matches
      let homeWins = 0, homeDraws = 0, homeLosses = 0;
      let homeGoalsFor = 0, homeGoalsAgainst = 0;
      let awayWins = 0, awayDraws = 0, awayLosses = 0;
      let awayGoalsFor = 0, awayGoalsAgainst = 0;

      const transformedMatches: HeadToHeadMatch[] = apiMatches.map((fixture: any) => {
        const homeTeamIsHome = fixture.teams.home.id.toString() === homeTeamId;
        const homeTeamScore = homeTeamIsHome ? fixture.goals.home : fixture.goals.away;
        const awayTeamScore = homeTeamIsHome ? fixture.goals.away : fixture.goals.home;

        // Calculate result
        if (homeTeamScore > awayTeamScore) {
          homeWins++;
          awayLosses++;
        } else if (homeTeamScore < awayTeamScore) {
          homeLosses++;
          awayWins++;
        } else {
          homeDraws++;
          awayDraws++;
        }

        // Track goals
        homeGoalsFor += homeTeamScore || 0;
        homeGoalsAgainst += awayTeamScore || 0;
        awayGoalsFor += awayTeamScore || 0;
        awayGoalsAgainst += homeTeamScore || 0;

        // ✅ FIX: Better logo fallback - check all sources before using placeholder
        const getTeamLogo = (apiLogo: string | null | undefined, teamId: string): string => {
          // First: Try API logo
          if (apiLogo && apiLogo.trim() !== "" && !apiLogo.includes("placeholder")) {
            return apiLogo;
          }
          
          // Second: Try props logos based on team ID
          if (teamId === homeTeamId) {
            if (homeTeamLogo && homeTeamLogo.trim() !== "" && !homeTeamLogo.includes("placeholder")) {
              return homeTeamLogo;
            }
          }
          if (teamId === awayTeamId) {
            if (awayTeamLogo && awayTeamLogo.trim() !== "" && !awayTeamLogo.includes("placeholder")) {
              return awayTeamLogo;
            }
          }
          
          // Third: Use generic football team icon as last resort
          return "https://cdn-icons-png.flaticon.com/512/53/53283.png";
        };

        return {
          matchId: fixture.fixture.id.toString(),
          date: fixture.fixture.date,
          leagueName: fixture.league?.name || "Unknown League",
          leagueId: fixture.league?.id?.toString() || undefined, // ✅ ADD: Store league ID
          leagueLogo: fixture.league?.logo || "https://media.api-sports.io/football/leagues/1.png",
          homeTeamId: fixture.teams.home.id.toString(),
          homeTeamName: fixture.teams.home.name,
          homeTeamLogo: getTeamLogo(fixture.teams.home.logo, fixture.teams.home.id.toString()),
          homeScore: fixture.goals.home || 0,
          awayTeamId: fixture.teams.away.id.toString(),
          awayTeamName: fixture.teams.away.name,
          awayTeamLogo: getTeamLogo(fixture.teams.away.logo, fixture.teams.away.id.toString()),
          awayScore: fixture.goals.away || 0,
          status: "finished" as const,
        };
      });

      const totalMatches = transformedMatches.length;
      const homeWinRate = totalMatches > 0 ? (homeWins / totalMatches) * 100 : 0;
      const awayWinRate = totalMatches > 0 ? (awayWins / totalMatches) * 100 : 0;

      const realData: HeadToHeadData = {
        homeTeamStats: {
          teamId: homeTeamId,
          teamName: homeTeamName,
          teamLogo: homeTeamLogo,
          wins: homeWins,
          draws: homeDraws,
          losses: homeLosses,
          goalsFor: homeGoalsFor,
          goalsAgainst: homeGoalsAgainst,
          winRate: homeWinRate,
        },
        awayTeamStats: {
          teamId: awayTeamId,
          teamName: awayTeamName,
          teamLogo: awayTeamLogo,
          wins: awayWins,
          draws: awayDraws,
          losses: awayLosses,
          goalsFor: awayGoalsFor,
          goalsAgainst: awayGoalsAgainst,
          winRate: awayWinRate,
        },
        matches: transformedMatches.slice(0, matchLimit),
        totalMatches: totalMatches,
      };

      // ✅ FIX: Store ALL matches for local filtering
      setAllMatches(transformedMatches);
      setH2hData(realData);
      console.log(`✅ Head-to-Head data loaded from REAL API: ${transformedMatches.length} total matches`);
    } catch (err: any) {
      console.error("❌ Failed to fetch Head-to-Head data:", err);
      let errorMessage = "Failed to load Head-to-Head data.";
      if (err instanceof Error) {
        if (err.message.includes("Network"))
          errorMessage = "Network error. Please check your connection.";
        else if (err.message.includes("timed out"))
          errorMessage = "Request timed out. Please try again.";
        else if (err.message.includes("Invalid data"))
          errorMessage = "Invalid data received from server.";
        else errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // ==================== HELPER FUNCTIONS ====================

  // ✅ FIX: Update matches based on current filters (no refetch)
  const updateFilteredMatches = () => {
    if (!h2hData || allMatches.length === 0) return;

    // Apply filters
    let filteredMatches = [...allMatches];

    // Filter by mode (homeVsAway vs randomly)
    if (filterMode === "homeVsAway") {
      // Show only matches where homeTeam played at home and awayTeam played away
      filteredMatches = filteredMatches.filter(match => 
        match.homeTeamId === homeTeamId && match.awayTeamId === awayTeamId
      );
    }
    // If "randomly", show all matches between these teams (no additional filter)

    // Apply match limit
    const limitedMatches = filteredMatches.slice(0, matchLimit);

    // Update h2hData with new filtered matches (keeps stats same)
    setH2hData({
      ...h2hData,
      matches: limitedMatches,
    });

    console.log(`🔄 Filters updated: ${limitedMatches.length} matches (limit: ${matchLimit}, mode: ${filterMode})`);
  };

  const formatDate = (isoDate: string): string => {
    try {
      const date = new Date(isoDate);
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${month}-${day}`;
    } catch {
      return "N/A";
    }
  };

  const getMatchResultForTeam = (
    match: HeadToHeadMatch,
    teamId: string
  ): "W" | "D" | "L" => {
    const isHome = match.homeTeamId === teamId;
    const teamScore = isHome ? match.homeScore : match.awayScore;
    const opponentScore = isHome ? match.awayScore : match.homeScore;

    if (teamScore > opponentScore) return "W";
    if (teamScore < opponentScore) return "L";
    return "D";
  };

  const getResultColor = (result: "W" | "D" | "L"): string => {
    switch (result) {
      case "W":
        return "#4CAF50"; // Green
      case "D":
        return "#FFA726"; // Orange
      case "L":
        return "#EF5350"; // Red
      default:
        return theme.colors.textSecondary;
    }
  };

  // ==================== RENDER METHODS ====================

  if (loading) {
    return (
      <View style={styles.messageContainer}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
        <Text
          style={[styles.messageText, { color: theme.colors.textSecondary }]}
        >
          Loading Head-to-Head data...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.messageContainer}>
        <Text style={[styles.errorText, { color: theme.colors.error }]}>
          {error}
        </Text>
        <TouchableOpacity
          onPress={fetchHeadToHeadData}
          style={[
            styles.retryButton,
            { backgroundColor: theme.colors.primary },
          ]}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!h2hData || h2hData.matches.length === 0) {
    return (
      <View style={styles.messageContainer}>
        <Text
          style={[styles.messageText, { color: theme.colors.textSecondary }]}
        >
          No Head-to-Head data available.
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.backgroundSecondary },
      ]}
    >
      {/* Filter Buttons Row - Scrollable for smaller screens */}
      <ScrollView
        ref={filterScrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScrollContent}
        style={[styles.filterRow, { backgroundColor: theme.colors.background }]}
      >
        {/* Match Limit Group */}
        <View style={styles.filterGroup}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              matchLimit === 6 && styles.activeFilterButton,
            ]}
            onPress={() => {
              setMatchLimit(6);
              scrollToFilterButton("limit-6");
            }}
            onLayout={(event) => {
              filterButtonPositionsRef.current["limit-6"] = event.nativeEvent.layout.x;
            }}
          >
            <Text
              style={[
                styles.filterButtonText,
                { color: theme.colors.text },
                matchLimit === 6 && styles.activeFilterButtonText,
              ]}
            >
              6 Recent
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              matchLimit === 10 && styles.activeFilterButton,
            ]}
            onPress={() => {
              setMatchLimit(10);
              scrollToFilterButton("limit-10");
            }}
            onLayout={(event) => {
              filterButtonPositionsRef.current["limit-10"] = event.nativeEvent.layout.x;
            }}
          >
            <Text
              style={[
                styles.filterButtonText,
                { color: theme.colors.text },
                matchLimit === 10 && styles.activeFilterButtonText,
              ]}
            >
              10 Recent
            </Text>
          </TouchableOpacity>
        </View>

        {/* Visual separator between groups */}
        <View style={[styles.filterDivider, { backgroundColor: theme.colors.border }]} />

        {/* Mode Filter Group */}
        <View style={styles.filterGroup}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filterMode === "homeVsAway" && styles.activeFilterButton,
            ]}
            onPress={() => {
              setFilterMode("homeVsAway");
              scrollToFilterButton("mode-homeVsAway");
            }}
            onLayout={(event) => {
              filterButtonPositionsRef.current["mode-homeVsAway"] = event.nativeEvent.layout.x;
            }}
          >
            <Text
              style={[
                styles.filterButtonText,
                { color: theme.colors.text },
                filterMode === "homeVsAway" && styles.activeFilterButtonText,
              ]}
            >
              Home VS Away
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filterMode === "randomly" && styles.activeFilterButton,
            ]}
            onPress={() => {
              setFilterMode("randomly");
              scrollToFilterButton("mode-randomly");
            }}
            onLayout={(event) => {
              filterButtonPositionsRef.current["mode-randomly"] = event.nativeEvent.layout.x;
            }}
          >
            <Text
              style={[
                styles.filterButtonText,
                { color: theme.colors.text },
                filterMode === "randomly" && styles.activeFilterButtonText,
              ]}
            >
              Random
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Stats Summary Section */}
      <View
        style={[
          styles.statsSummaryContainer,
          {
            backgroundColor: theme.colors.background,
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        {/* Home Team Stats */}
        <View style={styles.teamStatsColumn}>
          <Text
            style={[
              styles.teamStatName,
              { color: theme.colors.text },
            ]}
          >
            {h2hData.homeTeamStats.teamName}
          </Text>
          <Image
            source={{ uri: h2hData.homeTeamStats.teamLogo || DEFAULT_LOGO }}
            style={styles.teamStatLogo}
          />
          <Text
            style={[
              styles.winRateText,
              { color: theme.colors.primary },
            ]}
          >
            {h2hData.homeTeamStats.winRate.toFixed(1)}% Win Rate
          </Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text
                style={[
                  styles.statLabel,
                  { color: theme.colors.textSecondary },
                ]}
              >
                W/D/L
              </Text>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>
                {h2hData.homeTeamStats.wins}/{h2hData.homeTeamStats.draws}/
                {h2hData.homeTeamStats.losses}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text
                style={[
                  styles.statLabel,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Goals
              </Text>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>
                {h2hData.homeTeamStats.goalsFor}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text
                style={[
                  styles.statLabel,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Against
              </Text>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>
                {h2hData.homeTeamStats.goalsAgainst}
              </Text>
            </View>
          </View>
        </View>

        {/* VS Divider */}
        <View style={styles.vsDivider}>
          <Text
            style={[styles.vsText, { color: theme.colors.textSecondary }]}
          >
            VS
          </Text>
          <Text
            style={[
              styles.totalMatchesText,
              { color: theme.colors.textSecondary },
            ]}
          >
            {h2hData.totalMatches} Total
          </Text>
        </View>

        {/* Away Team Stats */}
        <View style={styles.teamStatsColumn}>
          <Image
            source={{ uri: h2hData.awayTeamStats.teamLogo || DEFAULT_LOGO }}
            style={styles.teamStatLogo}
          />
          <Text
            style={[
              styles.teamStatName,
              { color: theme.colors.text },
            ]}
          >
            {h2hData.awayTeamStats.teamName}
          </Text>
          <Text
            style={[
              styles.winRateText,
              { color: theme.colors.primary },
            ]}
          >
            {h2hData.awayTeamStats.winRate.toFixed(1)}% Win Rate
          </Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text
                style={[
                  styles.statLabel,
                  { color: theme.colors.textSecondary },
                ]}
              >
                W/D/L
              </Text>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>
                {h2hData.awayTeamStats.wins}/{h2hData.awayTeamStats.draws}/
                {h2hData.awayTeamStats.losses}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text
                style={[
                  styles.statLabel,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Goals
              </Text>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>
                {h2hData.awayTeamStats.goalsFor}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text
                style={[
                  styles.statLabel,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Against
              </Text>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>
                {h2hData.awayTeamStats.goalsAgainst}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Match History List */}
      <ScrollView
        style={styles.matchListContainer}
        showsVerticalScrollIndicator={false}
      >
        {h2hData.matches.map((match, index) => {
          // ✅ FIX: Calculate ONE result per match (from home team perspective in the match)
          const matchHomeScore = match.homeScore;
          const matchAwayScore = match.awayScore;
          const matchResult: "W" | "D" | "L" = 
            matchHomeScore > matchAwayScore ? "W" : 
            matchHomeScore < matchAwayScore ? "L" : "D";

          return (
            <View key={match.matchId}>
              <TouchableOpacity
                style={[
                  styles.matchCard,
                  { backgroundColor: theme.colors.background },
                ]}
                activeOpacity={0.7}
                onPress={() => {
                  // Navigate to match details screen
                  router.push({
                    pathname: "/match-details",
                    params: {
                      matchId: match.matchId,
                      sport: sport || "football",
                      homeTeam: match.homeTeamName,
                      awayTeam: match.awayTeamName,
                      homeTeamId: match.homeTeamId,
                      awayTeamId: match.awayTeamId,
                      homeLogo: match.homeTeamLogo,
                      awayLogo: match.awayTeamLogo,
                      homeScore: match.homeScore.toString(),
                      awayScore: match.awayScore.toString(),
                      status: match.status === "finished" ? "FT" : match.status === "live" ? "LIVE" : "NS",
                      elapsed: "0",
                      startTime: match.date,
                      league: match.leagueName,
                      leagueId: match.leagueId || "", // ✅ Pass league ID if available
                      halftimeScore: "0-0",
                      from: "head-to-head",
                    },
                  });
                }}
              >
                {/* Date and League */}
                <View style={styles.matchHeader}>
                  <Text
                    style={[
                      styles.matchDate,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    {formatDate(match.date)}
                  </Text>
                  <View style={styles.leagueInfo}>
                    <Image
                      source={{ uri: match.leagueLogo || DEFAULT_LOGO }}
                      style={styles.leagueLogo}
                    />
                    <Text
                      style={[
                        styles.leagueName,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      {match.leagueName}
                    </Text>
                  </View>
                </View>

                {/* Match Details - Teams and Score in ONE horizontal row */}
                <View style={styles.matchDetails}>
                  {/* Home Team */}
                  <View style={styles.homeTeamContainer}>
                    <Text
                      style={[
                        styles.matchTeamName,
                        { color: theme.colors.text },
                      ]}
                    >
                      {match.homeTeamName}
                    </Text>
                    <Image
                      source={{ uri: match.homeTeamLogo || DEFAULT_LOGO }}
                      style={styles.matchTeamLogo}
                    />
                  </View>

                  {/* Score ONLY (no badge here) */}
                  <Text
                    style={[
                      styles.scoreText,
                      { color: theme.colors.text },
                    ]}
                  >
                    {match.homeScore} - {match.awayScore}
                  </Text>

                  {/* Away Team */}
                  <View style={styles.awayTeamContainer}>
                    <Image
                      source={{ uri: match.awayTeamLogo || DEFAULT_LOGO }}
                      style={styles.matchTeamLogo}
                    />
                    <Text
                      style={[
                        styles.matchTeamName,
                        { color: theme.colors.text },
                      ]}
                    >
                      {match.awayTeamName}
                    </Text>
                  </View>
                </View>

                {/* ✅ FIX: W/D/L Badge in SEPARATE row below */}
                <View style={styles.resultBadgeRow}>
                  <View
                    style={[
                      styles.singleResultBadge,
                      { backgroundColor: getResultColor(matchResult) },
                    ]}
                  >
                    <Text style={styles.resultText}>{matchResult}</Text>
                  </View>
                </View>
              </TouchableOpacity>

              {/* Separator */}
              {index < h2hData.matches.length - 1 && (
                <View
                  style={[
                    styles.matchSeparator,
                    { backgroundColor: theme.colors.border },
                  ]}
                />
              )}
            </View>
          );
        })}

        {/* ✅ NEW: View All Button (if more matches available) */}
        {h2hData.totalMatches > h2hData.matches.length && (
          <TouchableOpacity
            style={[
              styles.viewAllButton,
              { backgroundColor: theme.colors.background, borderColor: theme.colors.border },
            ]}
            onPress={() => {
              // Navigate to home team's team-details with matches tab open
              router.push({
                pathname: "/team-details",
                params: {
                  teamId: homeTeamId,
                  teamName: homeTeamName,
                  teamLogo: homeTeamLogo,
                  defaultTab: "matches", // Navigate to Matches tab by default
                  sport: sport, // Pass sport parameter
                },
              });
            }}
          >
            <Text style={[styles.viewAllText, { color: theme.colors.primary }]}>
              View All {h2hData.totalMatches} Matches
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

// ==================== STYLES ====================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 12,
  },
  messageContainer: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 150,
  },
  messageText: {
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
  errorText: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 12,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },

  // Filter Row - Scrollable
  filterRow: {
    paddingVertical: 8, // Reduced from 12
  },
  filterScrollContent: {
    paddingHorizontal: 16,
    gap: 8, // Reduced from 12
    alignItems: "center",
  },
  filterGroup: {
    flexDirection: "row",
    gap: 6, // Reduced from 8
  },
  filterDivider: {
    width: 1,
    height: 24, // Reduced from 28 to match smaller buttons
    marginHorizontal: 4,
  },
  filterButton: {
    paddingVertical: 6, // Reduced from 8
    paddingHorizontal: 12, // Reduced from 16
    borderRadius: 6, // Changed from 20 (curvy circles) to 6 (rectangles)
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    minWidth: 70, // Reduced from 90
  },
  activeFilterButton: {
    backgroundColor: "#FFE5E5",
    borderColor: "#E53935",
    borderWidth: 2,
  },
  filterButtonText: {
    fontSize: 12, // Reduced from 13
    fontWeight: "500",
  },
  activeFilterButtonText: {
    color: "#E53935",
    fontWeight: "700",
  },

  // Stats Summary
  statsSummaryContainer: {
    flexDirection: "row",
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    justifyContent: "space-between",
    alignItems: "center",
  },
  teamStatsColumn: {
    flex: 1,
    alignItems: "center",
  },
  teamStatLogo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginBottom: 8,
  },
  teamStatName: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
    textAlign: "center",
  },
  winRateText: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "center",
  },
  statItem: {
    alignItems: "center",
  },
  statLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 13,
    fontWeight: "600",
  },
  vsDivider: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  vsText: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  totalMatchesText: {
    fontSize: 11,
  },

  // Match List
  matchListContainer: {
    flex: 1,
  },
  matchCard: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  matchHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  matchDate: {
    fontSize: 12,
    fontWeight: "500",
  },
  leagueInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  leagueLogo: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  leagueName: {
    fontSize: 12,
    maxWidth: 150,
  },
  matchDetails: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
    paddingVertical: 8,
  },
  teamContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  // ✅ FIX: Equal spacing - both teams same width, no flex
  homeTeamContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minWidth: 150, // Increased for longer team names
    justifyContent: "flex-end",
  },
  awayTeamContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minWidth: 150, // Increased for longer team names
    justifyContent: "flex-start",
  },
  matchTeamLogo: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  matchTeamName: {
    fontSize: 13,
    fontWeight: "500",
    flexShrink: 0, // Prevent shrinking, allow full text
  },
  // ✅ FIX: Score centered with fixed spacing
  scoreText: {
    fontSize: 16,
    fontWeight: "700",
    minWidth: 60,
    textAlign: "center",
  },
  // ✅ FIX: Badge row centered below match details
  resultBadgeRow: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
    marginBottom: 8,
  },
  singleResultBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 4,
    minWidth: 32,
    alignItems: "center",
  },
  resultIndicators: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 32,
  },
  resultBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    minWidth: 30,
    alignItems: "center",
  },
  resultText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  matchSeparator: {
    height: 1,
    marginHorizontal: 16,
  },

  // ✅ NEW: View All Button
  viewAllButton: {
    marginHorizontal: 16,
    marginVertical: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: "600",
  },
});

