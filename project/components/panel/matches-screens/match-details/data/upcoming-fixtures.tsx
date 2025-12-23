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
import { Ionicons } from "@expo/vector-icons";

// ==================== INTERFACES ====================

interface UpcomingFixture {
  matchId: string;
  date: string; // ISO format
  leagueName: string;
  leagueId: string;
  leagueLogo?: string;
  homeTeamId: string;
  homeTeamName: string;
  homeTeamLogo: string;
  awayTeamId: string;
  awayTeamName: string;
  awayTeamLogo: string;
  status: "upcoming";
  isCurrentMatch?: boolean; // For star indicator (current match being viewed)
}

interface TeamUpcomingFixtures {
  teamId: string;
  teamName: string;
  teamLogo: string;
  upcomingMatches: UpcomingFixture[]; // 6-10 upcoming matches
}

interface UpcomingFixturesData {
  homeTeamFixtures: TeamUpcomingFixtures;
  awayTeamFixtures: TeamUpcomingFixtures;
}

interface UpcomingFixturesProps {
  homeTeamName: string;
  awayTeamName: string;
  homeTeamLogo: string;
  awayTeamLogo: string;
  matchId?: string;
  homeTeamId?: string;
  awayTeamId?: string;
  currentMatchDate?: string; // The date of the current match being viewed
  sport?: string; // "football" | "basketball"
}

// ==================== MAIN COMPONENT ====================

export default function UpcomingFixtures({
  homeTeamName,
  awayTeamName,
  homeTeamLogo,
  awayTeamLogo,
  matchId,
  homeTeamId,
  awayTeamId,
  currentMatchDate,
  sport = "football", // Default to football
}: UpcomingFixturesProps) {
  const theme = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fixturesData, setFixturesData] = useState<UpcomingFixturesData | null>(null);

  const DEFAULT_LOGO = "https://via.placeholder.com/24";

  const isBasketball = sport === "basketball";
  console.log(`🏀⚽ [UpcomingFixtures] Sport: ${sport}, isBasketball: ${isBasketball}`);

  // ==================== DATA FETCHING ====================

  useEffect(() => {
    if (homeTeamId && awayTeamId) {
      fetchUpcomingFixtures();
    } else {
      console.warn("⚠️ Upcoming Fixtures: Team IDs not available");
      setError("Team IDs required for Upcoming Fixtures data.");
      setLoading(false);
    }
  }, [homeTeamId, awayTeamId]);

  const fetchUpcomingFixtures = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!homeTeamId || !awayTeamId) {
        setError("Upcoming Fixtures requires team IDs from the API.");
        setLoading(false);
        return;
      }

      console.log(`📅 Fetching Upcoming Fixtures data`);
      console.log(`🏠 Home Team: ${homeTeamName} (ID: ${homeTeamId})`);
      console.log(`✈️ Away Team: ${awayTeamName} (ID: ${awayTeamId})`);

      // ✅ REAL API: Fetch upcoming fixtures for both teams
      const ApiSportsService = (await import("@/services/api-sports-service")).default;
      const apiService = new ApiSportsService({
        apiKey: process.env.EXPO_PUBLIC_API_FOOTBALL_KEY || "",
        baseUrl: isBasketball ? "https://v1.basketball.api-sports.io" : "https://v3.football.api-sports.io",
      });

      const currentSeason = new Date().getFullYear();
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

      // Fetch upcoming fixtures (not finished, not live)
      const [homeFixturesResponse, awayFixturesResponse] = await Promise.all([
        apiService.getFixtures(
          parseInt(homeTeamId),
          undefined,
          currentSeason,
          undefined,
          undefined, // No status filter - get all upcoming
          undefined,
          sport
        ).catch(() => ({ response: [] })),
        apiService.getFixtures(
          parseInt(awayTeamId),
          undefined,
          currentSeason,
          undefined,
          undefined, // No status filter - get all upcoming
          undefined,
          sport
        ).catch(() => ({ response: [] })),
      ]);

      const transformFixturesToUpcoming = (fixtures: any[], teamId: string, teamName: string, teamLogo: string): UpcomingFixture[] => {
        const currentDate = currentMatchDate ? new Date(currentMatchDate) : new Date();
        
        return fixtures
          .filter((fixture: any) => {
            // Filter for upcoming matches only (not finished, not live)
            const fixtureDate = new Date(fixture.fixture?.date || 0);
            const status = fixture.fixture?.status?.short || "";
            const isFinished = status === "FT" || status === "AET" || status === "PEN";
            const isLive = status === "LIVE" || status === "HT" || status === "1H" || status === "2H";
            
            return !isFinished && !isLive && fixtureDate >= currentDate;
          })
          .slice(0, 10) // Limit to next 10 matches
          .map((fixture: any) => {
            const homeTeam = fixture.teams?.home || {};
            const awayTeam = fixture.teams?.away || {};

            return {
              matchId: fixture.fixture?.id?.toString() || "",
              date: fixture.fixture?.date || new Date().toISOString(),
              leagueName: fixture.league?.name || "League",
              leagueId: fixture.league?.id?.toString() || "",
              leagueLogo: fixture.league?.logo || "",
              homeTeamId: homeTeam.id?.toString() || "",
              homeTeamName: homeTeam.name || "",
              homeTeamLogo: homeTeam.logo || "",
              awayTeamId: awayTeam.id?.toString() || "",
              awayTeamName: awayTeam.name || "",
              awayTeamLogo: awayTeam.logo || "",
              status: "upcoming",
              isCurrentMatch: fixture.fixture?.id?.toString() === matchId,
            };
          })
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // Sort by date
      };

      const homeFixtures = transformFixturesToUpcoming(
        homeFixturesResponse.response || [],
        homeTeamId,
        homeTeamName,
        homeTeamLogo
      );
      const awayFixtures = transformFixturesToUpcoming(
        awayFixturesResponse.response || [],
        awayTeamId,
        awayTeamName,
        awayTeamLogo
      );

      const fixturesData: UpcomingFixturesData = {
        homeTeamFixtures: {
          teamId: homeTeamId,
          teamName: homeTeamName,
          teamLogo: homeTeamLogo,
          upcomingMatches: homeFixtures,
        },
        awayTeamFixtures: {
          teamId: awayTeamId,
          teamName: awayTeamName,
          teamLogo: awayTeamLogo,
          upcomingMatches: awayFixtures,
        },
      };

      setFixturesData(fixturesData);
      console.log(`✅ Upcoming Fixtures data loaded:`, {
        home: `${homeFixtures.length} matches`,
        away: `${awayFixtures.length} matches`,
      });
    } catch (err: any) {
      console.warn("⚠️ Failed to fetch Upcoming Fixtures data:", err);
      setError(err?.message || "Failed to load Upcoming Fixtures data.");
    } finally {
      setLoading(false);
    }
  };

  // ==================== HELPER FUNCTIONS ====================

  const formatMatchDate = (isoDate: string): string => {
    try {
      const date = new Date(isoDate);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}/${month}/${day}`;
    } catch {
      return "N/A";
    }
  };

  const getDaysInfo = (isoDate: string): string => {
    try {
      const matchDate = new Date(isoDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      matchDate.setHours(0, 0, 0, 0);
      
      const diffTime = matchDate.getTime() - today.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) return "Today";
      if (diffDays === 1) return "Tomorrow";
      return `${diffDays} Days`;
    } catch {
      return "";
    }
  };

  const navigateToTeamDetails = (teamId: string, teamName: string, teamLogo: string) => {
    router.push({
      pathname: "/team-details",
      params: { 
        teamId,
        teamName,
        teamLogo,
        defaultTab: "matches", // Navigate to Matches tab by default
        sport: sport, // Pass sport parameter
      },
    });
  };

  // ==================== RENDER TEAM SECTION ====================

  const renderTeamSection = (teamFixtures: TeamUpcomingFixtures) => {
    const matches = teamFixtures.upcomingMatches;

    return (
      <View style={[styles.teamSection, { backgroundColor: theme.colors.backgroundSecondary }]}>
        {/* Team Header with View All Button */}
        <View style={styles.teamHeader}>
          <View style={styles.teamHeaderLeft}>
            <Image
              source={{ uri: teamFixtures.teamLogo || DEFAULT_LOGO }}
              style={styles.teamHeaderLogo}
            />
            <Text style={[styles.teamName, { color: theme.colors.text }]}>
              {teamFixtures.teamName}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.viewAllButton, { borderColor: theme.colors.border }]}
            onPress={() => navigateToTeamDetails(teamFixtures.teamId, teamFixtures.teamName, teamFixtures.teamLogo)}
          >
            <Text style={[styles.viewAllText, { color: theme.colors.primary }]}>
              View All
            </Text>
          </TouchableOpacity>
        </View>

        {/* Horizontal Scrollable Content */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={true}
          contentContainerStyle={styles.scrollableContent}
        >
          <View style={styles.tableContainer}>
            {/* Table Header */}
            <View style={[styles.tableHeader, { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.border }]}>
              <Text style={[styles.headerText, styles.headerTextLeft, { color: theme.colors.textSecondary }]}>Date/Event</Text>
              <Text style={[styles.headerText, { color: theme.colors.textSecondary }]}>Home</Text>
              <Text style={[styles.headerText, { color: theme.colors.textSecondary }]}>Score</Text>
              <Text style={[styles.headerText, { color: theme.colors.textSecondary }]}>Away</Text>
              <Text style={[styles.headerText, styles.headerTextRight, { color: theme.colors.textSecondary }]}>Status</Text>
            </View>

            {/* Match Rows */}
            {matches.map((match, index) => (
              <TouchableOpacity
                key={match.matchId}
                style={[
                  styles.matchRow,
                  { 
                    backgroundColor: theme.colors.background,
                    borderBottomColor: theme.colors.border,
                    borderBottomWidth: index < matches.length - 1 ? 1 : 0,
                  },
                ]}
                activeOpacity={0.7}
                onPress={() => {
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
                      homeScore: "0",
                      awayScore: "0",
                      status: "NS",
                      elapsed: "0",
                      startTime: match.date,
                      league: match.leagueName,
                      leagueId: match.leagueId || "",
                      halftimeScore: "0-0",
                      from: "upcoming-fixtures",
                    },
                  });
                }}
              >
                {/* Date/Event Column */}
                <View style={styles.dateColumn}>
                  {match.isCurrentMatch && (
                    <Ionicons name="star" size={14} color="#FFD700" style={styles.starIcon} />
                  )}
                  <Text style={[styles.matchDate, { color: theme.colors.text }]}>
                    {formatMatchDate(match.date)}
                  </Text>
                  <Text style={[styles.leagueName, { color: theme.colors.textSecondary }]}>
                    {match.leagueName}
                  </Text>
                </View>

                {/* Home Team Column */}
                <View style={styles.teamColumn}>
                  <Image
                    source={{ uri: match.homeTeamLogo || DEFAULT_LOGO }}
                    style={styles.matchTeamLogo}
                  />
                  <Text style={[styles.matchTeamName, { color: theme.colors.text }]}>
                    {match.homeTeamName}
                  </Text>
                </View>

                {/* Score Column (VS for upcoming matches) */}
                <View style={styles.scoreColumn}>
                  <Text style={[styles.vsText, { color: theme.colors.textSecondary }]}>
                    VS
                  </Text>
                </View>

                {/* Away Team Column */}
                <View style={styles.teamColumn}>
                  <Image
                    source={{ uri: match.awayTeamLogo || DEFAULT_LOGO }}
                    style={styles.matchTeamLogo}
                  />
                  <Text style={[styles.matchTeamName, { color: theme.colors.text }]}>
                    {match.awayTeamName}
                  </Text>
                </View>

                {/* Status Column */}
                <View style={styles.statusColumn}>
                  <Text
                    style={[
                      styles.statusText,
                      {
                        color:
                          getDaysInfo(match.date) === "Today"
                            ? theme.colors.error
                            : getDaysInfo(match.date) === "Tomorrow"
                            ? "#FF9800"
                            : theme.colors.textSecondary,
                      },
                    ]}
                  >
                    {getDaysInfo(match.date)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  };

  // ==================== MAIN RENDER ====================

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
          Loading Upcoming Fixtures...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
          onPress={fetchUpcomingFixtures}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!fixturesData) {
    return (
      <View style={styles.centerContainer}>
        <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
          No upcoming fixtures available
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Home Team Upcoming Fixtures */}
      {renderTeamSection(fixturesData.homeTeamFixtures)}

      {/* Spacing */}
      <View style={styles.sectionSpacer} />

      {/* Away Team Upcoming Fixtures */}
      {renderTeamSection(fixturesData.awayTeamFixtures)}
    </ScrollView>
  );
}

// ==================== STYLES ====================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 12,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    minHeight: 200,
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
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  emptyText: {
    fontSize: 14,
  },

  // Team Section
  teamSection: {
    marginHorizontal: 16,
    borderRadius: 8,
    overflow: "hidden",
  },
  sectionSpacer: {
    height: 16,
  },

  // Team Header
  teamHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingBottom: 12,
  },
  teamHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  teamHeaderLogo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
  },
  teamName: {
    fontSize: 16,
    fontWeight: "700",
    flex: 1,
  },
  viewAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: "600",
  },

  // Scrollable Content Container
  scrollableContent: {
    paddingRight: 16, // Add padding at the end for better scrolling experience
  },
  tableContainer: {
    minWidth: 700, // Minimum width to allow horizontal scrolling and give breathing space
  },
  // Table Header
  tableHeader: {
    flexDirection: "row",
    paddingVertical: 8, // Reduced from 10
    paddingHorizontal: 10, // Reduced from 12
    borderBottomWidth: 1,
    alignItems: "center",
    minWidth: 700, // Match container width for proper alignment
  },
  headerText: {
    fontSize: 11,
    fontWeight: "600",
    width: 130, // Fixed width for consistent column alignment
    textAlign: "center",
  },
  headerTextLeft: {
    textAlign: "left", // Align Date/Event header to the left to match date/event content
  },
  headerTextRight: {
    textAlign: "right", // Align Status header to the right to match status values
  },

  // Match Row
  matchRow: {
    flexDirection: "row",
    paddingVertical: 10, // Reduced from 14
    paddingHorizontal: 10, // Reduced from 12
    alignItems: "center",
    minWidth: 700, // Match header width for proper alignment
  },

  // Date/Event Column
  dateColumn: {
    width: 130, // Fixed width matching header
    flexDirection: "column",
    alignItems: "flex-start",
  },
  starIcon: {
    marginBottom: 2,
  },
  matchDate: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 2,
  },
  leagueName: {
    fontSize: 10,
  },

  // Team Column
  teamColumn: {
    width: 130, // Fixed width matching header
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 2, // Reduced from 4
  },
  matchTeamLogo: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 6,
  },
  matchTeamName: {
    fontSize: 11,
    fontWeight: "500",
    flexShrink: 0, // Prevent shrinking, allow full text
  },

  // Score Column
  scoreColumn: {
    width: 130, // Fixed width matching header
    alignItems: "center",
  },
  vsText: {
    fontSize: 11,
    fontWeight: "600",
  },

  // Status Column
  statusColumn: {
    width: 130, // Fixed width matching header
    alignItems: "flex-end",
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
});
