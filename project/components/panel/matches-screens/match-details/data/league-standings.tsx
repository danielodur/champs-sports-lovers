import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { useRouter } from "expo-router";

interface LeagueStandingsProps {
  homeTeamName: string;
  awayTeamName: string;
  homeTeamLogo: string;
  awayTeamLogo: string;
  homeTeamId?: string;
  awayTeamId?: string;
  leagueId?: string;
  leagueName?: string;
  sport?: string; // "football" | "basketball"
}

interface StandingRow {
  type: string; // "Total", "Home", "Away", "Recent"
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  rank: number;
}

interface TeamStandingsData {
  teamName: string;
  teamLogo: string;
  leagueName: string;
  leagueId: string;
  standings: StandingRow[];
}

export default function LeagueStandings({
  homeTeamName,
  awayTeamName,
  homeTeamLogo,
  awayTeamLogo,
  homeTeamId,
  awayTeamId,
  leagueId,
  leagueName,
  sport = "football", // Default to football
}: LeagueStandingsProps) {
  const theme = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [homeStandings, setHomeStandings] = useState<TeamStandingsData | null>(null);
  const [awayStandings, setAwayStandings] = useState<TeamStandingsData | null>(null);

  const isBasketball = sport === "basketball";
  // Removed excessive console.log that causes performance issues

  useEffect(() => {
    if (homeTeamName && awayTeamName) {
      fetchLeagueStandings();
    }
  }, [homeTeamId, awayTeamId, leagueId]);

  const fetchLeagueStandings = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validate required parameters
      if (!homeTeamName || !awayTeamName) {
        throw new Error("Team names are required");
      }

      if (!leagueId) {
        console.warn("⚠️ League ID not available, cannot fetch standings");
        setHomeStandings(null);
        setAwayStandings(null);
        setLoading(false);
        return;
      }

      console.log(`📊 Fetching league standings`);
      console.log(`🏠 Home Team: ${homeTeamName} (ID: ${homeTeamId})`);
      console.log(`✈️ Away Team: ${awayTeamName} (ID: ${awayTeamId})`);
      console.log(`🏆 League: ${leagueName} (ID: ${leagueId})`);

      // ✅ REAL API: Fetch league standings
      const { fetchLeagueStandings } = await import("@/services/leagueStandingsService");
      const currentSeason = new Date().getFullYear();
      
      const standingsResponse = await fetchLeagueStandings(
        parseInt(leagueId),
        currentSeason,
        false,
        sport
      );

      if (!standingsResponse || !standingsResponse.groups || standingsResponse.groups.length === 0) {
        console.warn("⚠️ No standings data found");
        setHomeStandings(null);
        setAwayStandings(null);
        setLoading(false);
        return;
      }

      // Extract standings for both teams
      const allStandings = standingsResponse.groups[0]?.standings || [];
      
      const findTeamStandings = (teamId?: string, teamName: string) => {
        if (!teamId) return null;
        
        const teamStanding = allStandings.find((standing: any) => 
          standing.team?.id?.toString() === teamId?.toString() ||
          standing.team?.name?.toLowerCase() === teamName.toLowerCase()
        );

        if (!teamStanding) return null;

        // Transform to component format
        const standings: StandingRow[] = [
          {
            type: "Total",
            played: teamStanding.all?.played || 0,
            wins: teamStanding.all?.win || 0,
            draws: teamStanding.all?.draw || 0,
            losses: teamStanding.all?.lose || 0,
            goalsFor: teamStanding.all?.goals?.for || 0,
            goalsAgainst: teamStanding.all?.goals?.against || 0,
            points: teamStanding.points || 0,
            rank: teamStanding.rank || 0,
          },
          {
            type: "Home",
            played: teamStanding.home?.played || 0,
            wins: teamStanding.home?.win || 0,
            draws: teamStanding.home?.draw || 0,
            losses: teamStanding.home?.lose || 0,
            goalsFor: teamStanding.home?.goals?.for || 0,
            goalsAgainst: teamStanding.home?.goals?.against || 0,
            points: 0, // Home points not typically shown separately
            rank: teamStanding.rank || 0,
          },
          {
            type: "Away",
            played: teamStanding.away?.played || 0,
            wins: teamStanding.away?.win || 0,
            draws: teamStanding.away?.draw || 0,
            losses: teamStanding.away?.lose || 0,
            goalsFor: teamStanding.away?.goals?.for || 0,
            goalsAgainst: teamStanding.away?.goals?.against || 0,
            points: 0, // Away points not typically shown separately
            rank: teamStanding.rank || 0,
          },
        ];

        return {
          teamName,
          teamLogo: teamStanding.team?.logo || "",
          leagueName: leagueName || "League",
          leagueId: leagueId,
          standings,
        };
      };

      const homeData = findTeamStandings(homeTeamId, homeTeamName);
      const awayData = findTeamStandings(awayTeamId, awayTeamName);

      setHomeStandings(homeData);
      setAwayStandings(awayData);

      console.log(`✅ League standings loaded:`, {
        home: homeData ? `${homeData.teamName} - Rank ${homeData.standings[0]?.rank}` : "Not found",
        away: awayData ? `${awayData.teamName} - Rank ${awayData.standings[0]?.rank}` : "Not found",
      });

    } catch (err) {
      console.error("❌ Failed to fetch league standings:", err);
      
      let errorMessage = "Failed to load league standings";
      
      if (err instanceof Error) {
        if (err.message.includes("Network")) {
          errorMessage = "Network error. Please check your connection.";
        } else if (err.message.includes("timeout")) {
          errorMessage = "Request timed out. Please try again.";
        } else if (err.message.includes("Invalid")) {
          errorMessage = "Invalid data received from server.";
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      setHomeStandings(null);
      setAwayStandings(null);
    } finally {
      setLoading(false);
    }
  };

  const handleViewFullTable = (teamId?: string, teamName?: string, leagueIdParam?: string) => {
    if (!leagueIdParam) {
      console.warn("League ID not available for navigation");
      return;
    }

    // Navigate to league details page
    router.push({
      pathname: `/stats/league-details/${leagueIdParam}`,
      params: {
        leagueName: leagueName || "League",
        highlightTeam: teamName || "",
      }
    });
  };

  const renderStandingsTable = (data: TeamStandingsData, isHome: boolean) => (
    <View style={styles.teamSection}>
      {/* Team Header with "Whole Table" button */}
      <View style={styles.teamHeader}>
        <View style={styles.teamInfo}>
          <Image
            source={{ uri: data.teamLogo || "https://via.placeholder.com/32" }}
            style={styles.teamLogo}
          />
          <Text style={[styles.teamName, { color: theme.colors.text }]}>
            {data.teamName}
          </Text>
        </View>
        
        {/* Whole Table Button - Red ring with red text like Chinese app */}
        <TouchableOpacity
          style={styles.wholeTableButton}
          onPress={() => handleViewFullTable(
            isHome ? homeTeamId : awayTeamId,
            data.teamName,
            data.leagueId
          )}
          activeOpacity={0.7}
        >
          <Text style={styles.wholeTableText}>Whole Table</Text>
        </TouchableOpacity>
      </View>

      {/* League Name */}
      <Text style={[styles.leagueName, { color: theme.colors.textSecondary }]}>
        {data.leagueName}
      </Text>

      {/* Standings Table - Horizontal Scroll */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tableContainer}
      >
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.headerCell, styles.typeCell, { color: theme.colors.textSecondary }]}>
              Type
            </Text>
            <Text style={[styles.headerCell, styles.playedCell, { color: theme.colors.textSecondary }]}>
              Played
            </Text>
            <Text style={[styles.headerCell, styles.recordCell, { color: theme.colors.textSecondary }]}>
              W/D/L
            </Text>
            <Text style={[styles.headerCell, styles.goalsCell, { color: theme.colors.textSecondary }]}>
              GF/GA
            </Text>
            <Text style={[styles.headerCell, styles.pointsCell, { color: theme.colors.textSecondary }]}>
              Points
            </Text>
            <Text style={[styles.headerCell, styles.rankCell, { color: theme.colors.textSecondary }]}>
              Rank
            </Text>
          </View>

          {/* Table Rows */}
          {data.standings.map((row, index) => (
          <View key={index} style={styles.tableRow}>
            <Text style={[styles.dataCell, styles.typeCell, { color: theme.colors.text }]}>
              {row.type}
            </Text>
            <Text style={[styles.dataCell, styles.playedCell, { color: theme.colors.text }]}>
              {row.played}
            </Text>
            <Text style={[styles.dataCell, styles.recordCell, { color: theme.colors.text }]}>
              {row.wins}/{row.draws}/{row.losses}
            </Text>
            <Text style={[styles.dataCell, styles.goalsCell, { color: theme.colors.text }]}>
              {row.goalsFor}/{row.goalsAgainst}
            </Text>
            <Text style={[styles.dataCell, styles.pointsCell, { color: theme.colors.text }]}>
              {row.points}
            </Text>
            <Text style={[styles.dataCell, styles.rankCell, { color: "#FF4444" }]}>
              {row.rank}
            </Text>
          </View>
        ))}
        </View>
      </ScrollView>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#FF9500" />
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
          Loading league standings...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={[styles.errorText, { color: "#FF4444" }]}>
          {error}
        </Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={fetchLeagueStandings}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!homeStandings && !awayStandings) {
    return (
      <View style={styles.emptyStateContainer}>
        <Text style={[styles.emptyStateText, { color: theme.colors.textSecondary }]}>
          No league standings data available
        </Text>
        <Text style={[styles.emptyStateSubtext, { color: theme.colors.textSecondary }]}>
          League standings will appear here when available
        </Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Home Team Standings */}
      {homeStandings && renderStandingsTable(homeStandings, true)}

      {/* Spacing between teams */}
      {homeStandings && awayStandings && <View style={styles.teamSpacing} />}

      {/* Away Team Standings */}
      {awayStandings && renderStandingsTable(awayStandings, false)}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 8,
    fontSize: 13,
    fontFamily: "Inter-Regular",
  },
  errorContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
    textAlign: "center",
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#FF4444",
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter-SemiBold",
  },
  emptyStateContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyStateText: {
    fontSize: 14,
    fontFamily: "Inter-SemiBold",
    textAlign: "center",
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 12,
    fontFamily: "Inter-Regular",
    textAlign: "center",
  },
  teamSection: {
    marginBottom: 8,
  },
  teamHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  teamInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  teamLogo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  teamName: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Inter-Bold",
  },
  wholeTableButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#FF4444",
    backgroundColor: "transparent",
  },
  wholeTableText: {
    color: "#FF4444",
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "Inter-SemiBold",
  },
  leagueName: {
    fontSize: 12,
    fontFamily: "Inter-Regular",
    marginBottom: 12,
    marginLeft: 40, // Align with team name (after logo)
  },
  tableContainer: {
    minWidth: 500, // Ensure enough width for all columns
  },
  table: {
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    minWidth: 500, // Match container width
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#1C1C1C",
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.05)",
  },
  headerCell: {
    fontSize: 11,
    fontWeight: "600",
    fontFamily: "Inter-SemiBold",
    textAlign: "center",
  },
  dataCell: {
    fontSize: 13,
    fontFamily: "Inter-Regular",
    textAlign: "center",
  },
  typeCell: {
    width: 60,
    textAlign: "left",
    paddingLeft: 8,
  },
  playedCell: {
    width: 50,
  },
  recordCell: {
    width: 70,
  },
  goalsCell: {
    width: 60,
  },
  pointsCell: {
    width: 50,
  },
  rankCell: {
    width: 40,
  },
  teamSpacing: {
    height: 24,
  },
});
















