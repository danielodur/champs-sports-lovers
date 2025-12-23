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

interface RecentFormMatch {
  matchId: string;
  date: string; // ISO format
  leagueName: string;
  leagueId: string;
  leagueLogo?: string;
  homeTeamId: string;
  homeTeamName: string;
  homeTeamLogo: string;
  homeScore: number | null; // null for upcoming matches
  awayTeamId: string;
  awayTeamName: string;
  awayTeamLogo: string;
  awayScore: number | null; // null for upcoming matches
  status: "finished" | "live" | "upcoming";
  isCurrentMatch?: boolean; // For star indicator
}

interface TeamRecentForm {
  teamId: string;
  teamName: string;
  teamLogo: string;
  recentMatches: RecentFormMatch[]; // 6-10 already played matches with scores
}

interface RecentFormData {
  homeTeamForm: TeamRecentForm;
  awayTeamForm: TeamRecentForm;
}

interface RecentFormProps {
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

export default function RecentForm({
  homeTeamName,
  awayTeamName,
  homeTeamLogo,
  awayTeamLogo,
  matchId,
  homeTeamId,
  awayTeamId,
  currentMatchDate,
  sport = "football", // Default to football
}: RecentFormProps) {
  const theme = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recentFormData, setRecentFormData] = useState<RecentFormData | null>(null);

  const DEFAULT_LOGO = "https://via.placeholder.com/24";

  const isBasketball = sport === "basketball";
  console.log(`🏀⚽ [RecentForm] Sport: ${sport}, isBasketball: ${isBasketball}`);

  // ==================== DATA FETCHING ====================

  useEffect(() => {
    if (homeTeamId && awayTeamId) {
      fetchRecentFormData();
    } else {
      console.warn("⚠️ Recent Form: Team IDs not available");
      setError("Team IDs required for Recent Form data.");
      setLoading(false);
    }
  }, [homeTeamId, awayTeamId]);

  const fetchRecentFormData = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!homeTeamId || !awayTeamId) {
        setError("Recent Form requires team IDs from the API.");
        setLoading(false);
        return;
      }

      console.log(`📅 Fetching Recent Form data`);
      console.log(`🏠 Home Team: ${homeTeamName} (ID: ${homeTeamId})`);
      console.log(`✈️ Away Team: ${awayTeamName} (ID: ${awayTeamId})`);

      // ✅ REAL API: Fetch recent fixtures for both teams
      const ApiSportsService = (await import("@/services/api-sports-service")).default;
      const apiService = new ApiSportsService({
        apiKey: process.env.EXPO_PUBLIC_API_FOOTBALL_KEY || "",
        baseUrl: isBasketball ? "https://v1.basketball.api-sports.io" : "https://v3.football.api-sports.io",
      });

      const currentSeason = new Date().getFullYear();

      // Fetch last 10 finished matches for each team
      const [homeFixturesResponse, awayFixturesResponse] = await Promise.all([
        apiService.getFixtures(
          parseInt(homeTeamId),
          undefined,
          currentSeason,
          undefined,
          "FT", // Finished matches only
          undefined,
          sport
        ).catch(() => ({ response: [] })),
        apiService.getFixtures(
          parseInt(awayTeamId),
          undefined,
          currentSeason,
          undefined,
          "FT", // Finished matches only
          undefined,
          sport
        ).catch(() => ({ response: [] })),
      ]);

      const transformFixturesToRecentForm = (fixtures: any[], teamId: string, teamName: string, teamLogo: string): RecentFormMatch[] => {
        return fixtures
          .slice(0, 10) // Limit to last 10 matches
          .map((fixture: any) => {
            const isHomeTeam = fixture.teams?.home?.id?.toString() === teamId;
            const homeTeam = fixture.teams?.home || {};
            const awayTeam = fixture.teams?.away || {};
            
            // Extract scores based on sport
            const homeScore = isBasketball 
              ? (fixture.scores?.home?.total ?? fixture.goals?.home ?? 0)
              : (fixture.goals?.home ?? 0);
            const awayScore = isBasketball
              ? (fixture.scores?.away?.total ?? fixture.goals?.away ?? 0)
              : (fixture.goals?.away ?? 0);

            // Determine result (W/D/L) for the team
            let result: "W" | "D" | "L" = "D";
            if (isHomeTeam) {
              result = homeScore > awayScore ? "W" : homeScore < awayScore ? "L" : "D";
            } else {
              result = awayScore > homeScore ? "W" : awayScore < homeScore ? "L" : "D";
            }

            return {
              matchId: fixture.fixture?.id?.toString() || "",
              date: fixture.fixture?.date || new Date().toISOString(),
              leagueName: fixture.league?.name || "League",
              leagueId: fixture.league?.id?.toString() || "",
              leagueLogo: fixture.league?.logo || "",
              homeTeamId: homeTeam.id?.toString() || "",
              homeTeamName: homeTeam.name || "",
              homeTeamLogo: homeTeam.logo || "",
              homeScore,
              awayTeamId: awayTeam.id?.toString() || "",
              awayTeamName: awayTeam.name || "",
              awayTeamLogo: awayTeam.logo || "",
              awayScore,
              status: "finished",
              isCurrentMatch: fixture.fixture?.id?.toString() === matchId,
            };
          })
          .reverse(); // Most recent first
      };

      const homeMatches = transformFixturesToRecentForm(
        homeFixturesResponse.response || [],
        homeTeamId,
        homeTeamName,
        homeTeamLogo
      );
      const awayMatches = transformFixturesToRecentForm(
        awayFixturesResponse.response || [],
        awayTeamId,
        awayTeamName,
        awayTeamLogo
      );

      const formData: RecentFormData = {
        homeTeamForm: {
          teamId: homeTeamId,
          teamName: homeTeamName,
          teamLogo: homeTeamLogo,
          recentMatches: homeMatches,
        },
        awayTeamForm: {
          teamId: awayTeamId,
          teamName: awayTeamName,
          teamLogo: awayTeamLogo,
          recentMatches: awayMatches,
        },
      };

      setRecentFormData(formData);
      console.log(`✅ Recent Form data loaded:`, {
        home: `${homeMatches.length} matches`,
        away: `${awayMatches.length} matches`,
      });
    } catch (err: any) {
      console.warn("⚠️ Failed to fetch Recent Form data:", err);
      setError(err?.message || "Failed to load Recent Form data.");
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
      if (diffDays < 0) return `${Math.abs(diffDays)} Days Ago`;
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

  const renderTeamSection = (teamForm: TeamRecentForm) => {
    const matches = teamForm.recentMatches;

    return (
      <View style={[styles.teamSection, { backgroundColor: theme.colors.backgroundSecondary }]}>
        {/* Team Header with View All Button */}
        <View style={styles.teamHeader}>
          <View style={styles.teamHeaderLeft}>
            <Image
              source={{ uri: teamForm.teamLogo || DEFAULT_LOGO }}
              style={styles.teamHeaderLogo}
            />
            <Text style={[styles.teamName, { color: theme.colors.text }]}>
              {teamForm.teamName}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.viewAllButton, { borderColor: theme.colors.border }]}
            onPress={() => navigateToTeamDetails(teamForm.teamId, teamForm.teamName, teamForm.teamLogo)}
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
                      homeScore: match.homeScore?.toString() || "0",
                      awayScore: match.awayScore?.toString() || "0",
                      status: match.status === "finished" ? "FT" : match.status === "live" ? "LIVE" : "NS",
                      elapsed: "0",
                      startTime: match.date,
                      league: match.leagueName,
                      leagueId: match.leagueId || "",
                      halftimeScore: "0-0",
                      from: "recent-form",
                    },
                  });
                }}
              >
                {/* Date/Event Column */}
                <View style={styles.dateColumn}>
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

                {/* Score Column */}
                <View style={styles.scoreColumn}>
                  <Text style={[styles.scoreText, { color: theme.colors.text }]}>
                    {match.homeScore} - {match.awayScore}
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
                            : match.status === "finished"
                            ? theme.colors.success
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
          Loading Recent Form...
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
          onPress={fetchRecentFormData}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!recentFormData) {
    return (
      <View style={styles.centerContainer}>
        <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
          No recent form data available
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Home Team Recent Form */}
      {renderTeamSection(recentFormData.homeTeamForm)}

      {/* Spacing */}
      <View style={styles.sectionSpacer} />

      {/* Away Team Recent Form */}
      {renderTeamSection(recentFormData.awayTeamForm)}
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
    minWidth: 700, // Reduced from 800 to decrease spacing
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
    width: 130, // Reduced from 150 to decrease spacing
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
    width: 130, // Reduced from 150 to match header
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
    width: 130, // Reduced from 150 to match header
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
    width: 130, // Reduced from 150 to match header
    alignItems: "center",
  },
  scoreText: {
    fontSize: 13,
    fontWeight: "700",
  },
  vsText: {
    fontSize: 11,
    fontWeight: "600",
  },

  // Status Column
  statusColumn: {
    width: 130, // Reduced from 150 to match header
    alignItems: "flex-end",
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
});






