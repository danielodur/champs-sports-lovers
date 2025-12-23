import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { ChevronDown, ChevronUp } from "lucide-react-native";
import GoalDistribution from "./goal-distribution";
import LeagueStandings from "./league-standings";
import HeadToHead from "./head-2-head";
import RecentForm from "./recent-form";
import UpcomingFixtures from "./upcoming-fixtures"; // ✅ Import UpcomingFixtures component
import TransferInformation from "./transfer-information"; // ✅ Import TransferInformation component
import PlayerInjuries from "./player-injuries"; // ✅ Import PlayerInjuries component

const { width: screenWidth } = Dimensions.get("window");

interface MatchDetailsDataProps {
  homeTeamName?: string;
  awayTeamName?: string;
  homeTeamLogo?: string;
  awayTeamLogo?: string;
  matchId?: string;
  homeTeamId?: string;
  awayTeamId?: string;
  leagueId?: string;
  leagueName?: string;
  sport?: string; // "football" | "basketball"
}

interface StandingRow {
  position: number;
  team: string;
  logo?: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  rank: number;
}

interface HeadToHeadMatch {
  date: string;
  competition: string;
  homeTeam: string;
  awayTeam: string;
  score: string;
  homeHalfTimeScore: number;
  awayHalfTimeScore: number;
  homeCorners: number;
  awayCorners: number;
}

interface RecentMatch {
  date: string;
  competition: string;
  homeTeam: string;
  awayTeam: string;
  score: string;
  result: "W" | "D" | "L";
  homeHalfTimeScore: number;
  awayHalfTimeScore: number;
  homeCorners: number;
  awayCorners: number;
}

interface UpcomingMatch {
  date: string;
  daysUntil: string;
  competition: string;
  homeTeam: string;
  awayTeam: string;
  venue: string;
}

interface HalfFullTimeStats {
  homeWins: number;
  draws: number;
  awayWins: number;
  homeDraws: number;
  awayDraws: number;
  homeAwayWins: number;
}

interface Transfer {
  playerName: string;
  age: number;
  position: string;
  nationality: string;
  direction: "in" | "out";
  fromTeam: string;
  toTeam: string;
  date: string;
  fee: string;
  photo?: string;
}

export default function MatchDetailsData({
  homeTeamName = "Home Team",
  awayTeamName = "Away Team",
  homeTeamLogo = "",
  awayTeamLogo = "",
  matchId,
  homeTeamId,
  awayTeamId,
  leagueId,
  leagueName,
  sport = "football", // Default to football for backward compatibility
}: MatchDetailsDataProps) {
  const theme = useTheme();
  const [expandedSection, setExpandedSection] = useState<string | null>("goalDistribution");
  const [h2hFilter, setH2hFilter] = useState<"all" | "home" | "away">("all");
  const [recentFormFilter, setRecentFormFilter] = useState<"home" | "away">("home");
  
  // Determine if this is a basketball match
  const isBasketball = sport === "basketball";
  
  // Removed excessive console.log that causes performance issues
  
  // Loading states
  const [loading, setLoading] = useState(true);
  
  // API-driven data states (initially empty)
  const [homeStandings, setHomeStandings] = useState<StandingRow[]>([]);
  const [awayStandings, setAwayStandings] = useState<StandingRow[]>([]);
  const [headToHeadMatches, setHeadToHeadMatches] = useState<HeadToHeadMatch[]>([]);
  const [homeRecentMatches, setHomeRecentMatches] = useState<RecentMatch[]>([]);
  const [awayRecentMatches, setAwayRecentMatches] = useState<RecentMatch[]>([]);
  const [homeUpcomingMatches, setHomeUpcomingMatches] = useState<UpcomingMatch[]>([]);
  const [awayUpcomingMatches, setAwayUpcomingMatches] = useState<UpcomingMatch[]>([]);
  const [halfFullTimeStats, setHalfFullTimeStats] = useState<HalfFullTimeStats | null>(null);
  const [homeTransfers, setHomeTransfers] = useState<Transfer[]>([]);
  const [awayTransfers, setAwayTransfers] = useState<Transfer[]>([]);

  // Fetch all data on component mount
  useEffect(() => {
    if (matchId && homeTeamName && awayTeamName) {
      fetchAllMatchData();
    }
  }, [matchId, homeTeamName, awayTeamName]);

  const fetchAllMatchData = async () => {
    try {
      setLoading(true);
      
      // TODO: Replace with actual API calls
      // Example API structure:
      // const homeStandingsData = await apiService.getTeamStandings(homeTeamId);
      // const awayStandingsData = await apiService.getTeamStandings(awayTeamId);
      // const h2hData = await apiService.getHeadToHead(homeTeamId, awayTeamId);
      // const homeFormData = await apiService.getRecentForm(homeTeamId);
      // const awayFormData = await apiService.getRecentForm(awayTeamId);
      // const homeFixturesData = await apiService.getUpcomingFixtures(homeTeamId);
      // const awayFixturesData = await apiService.getUpcomingFixtures(awayTeamId);
      // const halfFullData = await apiService.getHalfFullTimeStats(homeTeamId, awayTeamId);
      // const homeTransfersData = await apiService.getTeamTransfers(homeTeamId);
      // const awayTransfersData = await apiService.getTeamTransfers(awayTeamId);
      
      // Set data from API responses
      // setHomeStandings(homeStandingsData);
      // setAwayStandings(awayStandingsData);
      // setHeadToHeadMatches(h2hData);
      // setHomeRecentMatches(homeFormData);
      // setAwayRecentMatches(awayFormData);
      // setHomeUpcomingMatches(homeFixturesData);
      // setAwayUpcomingMatches(awayFixturesData);
      // setHalfFullTimeStats(halfFullData);
      // setHomeTransfers(homeTransfersData);
      // setAwayTransfers(awayTransfersData);

      console.log(`📊 Fetching match data for: ${homeTeamName} vs ${awayTeamName} (Match ID: ${matchId})`);
      console.log("⚠️ API integration needed for Data tab sections");
      
    } catch (error) {
      console.warn("📊 Failed to fetch match data:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const renderSectionHeader = (title: string, subtitle: string, sectionKey: string) => (
    <TouchableOpacity
      style={[styles.sectionHeader, { backgroundColor: theme.colors.backgroundSecondary }]}
      onPress={() => toggleSection(sectionKey)}
      activeOpacity={0.7}
    >
      <View>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{title}</Text>
        <Text style={[styles.sectionSubtitle, { color: theme.colors.textSecondary }]}>{subtitle}</Text>
      </View>
      {expandedSection === sectionKey ? (
        <ChevronUp size={24} color={theme.colors.text} />
      ) : (
        <ChevronDown size={24} color={theme.colors.text} />
      )}
    </TouchableOpacity>
  );

  const renderGoalDistribution = () => {
    return (
      <GoalDistribution
        homeTeamName={homeTeamName}
        awayTeamName={awayTeamName}
        homeTeamLogo={homeTeamLogo}
        awayTeamLogo={awayTeamLogo}
        matchId={matchId}
        homeTeamId={homeTeamId}
        awayTeamId={awayTeamId}
        sport={sport} // ✅ Pass sport parameter
      />
    );
  };

  const renderStandings = () => {
    return (
      <LeagueStandings
        homeTeamName={homeTeamName}
        awayTeamName={awayTeamName}
        homeTeamLogo={homeTeamLogo}
        awayTeamLogo={awayTeamLogo}
        homeTeamId={homeTeamId}
        awayTeamId={awayTeamId}
        leagueId={leagueId}
        leagueName={leagueName || "League"}
        sport={sport} // ✅ Pass sport parameter
      />
    );
  };

  const renderStandingsOld = () => {
    if (homeStandings.length === 0 && awayStandings.length === 0) {
      return (
        <View style={styles.emptyStateContainer}>
          <Text style={[styles.emptyStateText, { color: theme.colors.textSecondary }]}>
            No league standings data available
          </Text>
        </View>
      );
    }

    return (
    <View style={styles.standingsContainer}>
      {/* Home Team Standings */}
      <View style={styles.standingSection}>
        <View style={styles.standingTeamHeader}>
          <Image source={{ uri: homeTeamLogo }} style={styles.standingTeamLogo} />
          <Text style={[styles.standingTeamName, { color: theme.colors.text }]}>{homeTeamName}</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.standingTable}>
            {/* Table Header */}
            <View style={styles.standingHeaderRow}>
              <Text style={[styles.standingHeaderCell, styles.standingRankCell, { color: theme.colors.textSecondary }]}>Date</Text>
              <Text style={[styles.standingHeaderCell, styles.standingMatchesCell, { color: theme.colors.textSecondary }]}>Played</Text>
              <Text style={[styles.standingHeaderCell, styles.standingRecordCell, { color: theme.colors.textSecondary }]}>W/D/L</Text>
              <Text style={[styles.standingHeaderCell, styles.standingGoalsCell, { color: theme.colors.textSecondary }]}>For/Ag</Text>
              <Text style={[styles.standingHeaderCell, styles.standingPointsCell, { color: theme.colors.textSecondary }]}>Points</Text>
              <Text style={[styles.standingHeaderCell, styles.standingRankCell, { color: theme.colors.textSecondary }]}>Rank</Text>
            </View>

            {/* Table Rows */}
            {homeStandings.map((row, index) => (
              <View key={index} style={styles.standingDataRow}>
                <Text style={[styles.standingDataCell, styles.standingRankCell, { color: theme.colors.text }]}>Total</Text>
                <Text style={[styles.standingDataCell, styles.standingMatchesCell, { color: theme.colors.text }]}>{row.played}</Text>
                <Text style={[styles.standingDataCell, styles.standingRecordCell, { color: theme.colors.text }]}>{row.wins}/{row.draws}/{row.losses}</Text>
                <Text style={[styles.standingDataCell, styles.standingGoalsCell, { color: theme.colors.text }]}>{row.goalsFor}/{row.goalsAgainst}</Text>
                <Text style={[styles.standingDataCell, styles.standingPointsCell, { color: theme.colors.text }]}>{row.points}</Text>
                <Text style={[styles.standingDataCell, styles.standingRankCell, { color: "#FF4444" }]}>{row.rank}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Away Team Standings */}
      <View style={[styles.standingSection, { marginTop: 24 }]}>
        <View style={styles.standingTeamHeader}>
          <Image source={{ uri: awayTeamLogo }} style={styles.standingTeamLogo} />
          <Text style={[styles.standingTeamName, { color: theme.colors.text }]}>{awayTeamName}</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.standingTable}>
            {/* Table Header */}
            <View style={styles.standingHeaderRow}>
              <Text style={[styles.standingHeaderCell, styles.standingRankCell, { color: theme.colors.textSecondary }]}>Date</Text>
              <Text style={[styles.standingHeaderCell, styles.standingMatchesCell, { color: theme.colors.textSecondary }]}>Played</Text>
              <Text style={[styles.standingHeaderCell, styles.standingRecordCell, { color: theme.colors.textSecondary }]}>W/D/L</Text>
              <Text style={[styles.standingHeaderCell, styles.standingGoalsCell, { color: theme.colors.textSecondary }]}>For/Ag</Text>
              <Text style={[styles.standingHeaderCell, styles.standingPointsCell, { color: theme.colors.textSecondary }]}>Points</Text>
              <Text style={[styles.standingHeaderCell, styles.standingRankCell, { color: theme.colors.textSecondary }]}>Rank</Text>
            </View>

            {/* Table Rows */}
            {awayStandings.map((row, index) => (
              <View key={index} style={styles.standingDataRow}>
                <Text style={[styles.standingDataCell, styles.standingRankCell, { color: theme.colors.text }]}>Total</Text>
                <Text style={[styles.standingDataCell, styles.standingMatchesCell, { color: theme.colors.text }]}>{row.played}</Text>
                <Text style={[styles.standingDataCell, styles.standingRecordCell, { color: theme.colors.text }]}>{row.wins}/{row.draws}/{row.losses}</Text>
                <Text style={[styles.standingDataCell, styles.standingGoalsCell, { color: theme.colors.text }]}>{row.goalsFor}/{row.goalsAgainst}</Text>
                <Text style={[styles.standingDataCell, styles.standingPointsCell, { color: theme.colors.text }]}>{row.points}</Text>
                <Text style={[styles.standingDataCell, styles.standingRankCell, { color: "#FF4444" }]}>{row.rank}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </View>
    );
  };

  const renderHeadToHead = () => {
    return (
      <HeadToHead
        homeTeamName={homeTeamName}
        awayTeamName={awayTeamName}
        homeTeamLogo={homeTeamLogo}
        awayTeamLogo={awayTeamLogo}
        matchId={matchId}
        homeTeamId={homeTeamId}
        awayTeamId={awayTeamId}
        sport={sport} // ✅ Pass sport parameter
      />
    );
  };

  const renderRecentForm = () => {
    return (
      <RecentForm
        homeTeamName={homeTeamName}
        awayTeamName={awayTeamName}
        homeTeamLogo={homeTeamLogo}
        awayTeamLogo={awayTeamLogo}
        matchId={matchId}
        homeTeamId={homeTeamId}
        awayTeamId={awayTeamId}
        sport={sport} // ✅ Pass sport parameter
      />
    );
  };

  const renderUpcomingFixtures = () => {
    return (
      <UpcomingFixtures
        homeTeamName={homeTeamName}
        awayTeamName={awayTeamName}
        homeTeamLogo={homeTeamLogo}
        awayTeamLogo={awayTeamLogo}
        matchId={matchId}
        homeTeamId={homeTeamId}
        awayTeamId={awayTeamId}
        sport={sport} // ✅ Pass sport parameter
      />
    );
  };

  const renderHalfFullTimeStats = () => {
    if (!halfFullTimeStats) {
      return (
        <View style={styles.emptyStateContainer}>
          <Text style={[styles.emptyStateText, { color: theme.colors.textSecondary }]}>
            No half/full time stats available
          </Text>
        </View>
      );
    }

    return (
    <View style={styles.halfFullContainer}>
      <View style={styles.halfFullFilterRow}>
        <TouchableOpacity style={[styles.halfFullFilterButton, { backgroundColor: "#3C3C3C" }]}>
          <Text style={[styles.halfFullFilterText, { color: "#FFFFFF" }]}>Home/Away</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.halfFullFilterButton, { backgroundColor: theme.colors.backgroundSecondary }]}>
          <Text style={[styles.halfFullFilterText, { color: theme.colors.text }]}>Same Competition</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.halfFullHeader}>
        <View style={styles.halfFullTeamHeader}>
          <Image source={{ uri: homeTeamLogo }} style={styles.halfFullTeamLogo} />
        </View>
        <View style={styles.halfFullLabels}>
          <Text style={[styles.halfFullLabel, { color: theme.colors.textSecondary }]}>Home(6)</Text>
          <Text style={[styles.halfFullLabel, { color: theme.colors.textSecondary }]}>Guest(4)</Text>
          <Text style={[styles.halfFullLabel, { color: theme.colors.textSecondary }]}>Total(10)</Text>
        </View>
        <Image source={{ uri: awayTeamLogo }} style={styles.halfFullTeamLogo} />
      </View>

      <View style={styles.halfFullTable}>
        <View style={styles.halfFullRow}>
          <Text style={[styles.halfFullRowLabel, { color: theme.colors.textSecondary }]}>Win-Win</Text>
          <Text style={[styles.halfFullValue, { color: theme.colors.text }]}>{halfFullTimeStats.homeWins}</Text>
          <Text style={[styles.halfFullValue, { color: theme.colors.text }]}>0</Text>
          <Text style={[styles.halfFullValue, { color: theme.colors.text }]}>{halfFullTimeStats.homeWins}</Text>
          <Text style={[styles.halfFullLabel, { color: theme.colors.textSecondary }]}>Win-Win</Text>
          <Text style={[styles.halfFullValue, { color: theme.colors.text }]}>{halfFullTimeStats.awayWins}</Text>
          <Text style={[styles.halfFullValue, { color: "#FF4444" }]}>{halfFullTimeStats.awayWins}</Text>
          <Text style={[styles.halfFullValue, { color: "#FF4444" }]}>{halfFullTimeStats.awayWins * 2}</Text>
        </View>

        <View style={styles.halfFullRow}>
          <Text style={[styles.halfFullRowLabel, { color: theme.colors.textSecondary }]}>Win-Draw</Text>
          <Text style={[styles.halfFullValue, { color: theme.colors.text }]}>{halfFullTimeStats.homeDraws}</Text>
          <Text style={[styles.halfFullValue, { color: theme.colors.text }]}>0</Text>
          <Text style={[styles.halfFullValue, { color: theme.colors.text }]}>{halfFullTimeStats.homeDraws}</Text>
          <Text style={[styles.halfFullLabel, { color: theme.colors.textSecondary }]}>Draw-Win</Text>
          <Text style={[styles.halfFullValue, { color: theme.colors.text }]}>0</Text>
          <Text style={[styles.halfFullValue, { color: theme.colors.text }]}>0</Text>
          <Text style={[styles.halfFullValue, { color: theme.colors.text }]}>0</Text>
        </View>

        <View style={styles.halfFullRow}>
          <Text style={[styles.halfFullRowLabel, { color: theme.colors.textSecondary }]}>Win-Loss</Text>
          <Text style={[styles.halfFullValue, { color: theme.colors.text }]}>0</Text>
          <Text style={[styles.halfFullValue, { color: theme.colors.text }]}>0</Text>
          <Text style={[styles.halfFullValue, { color: theme.colors.text }]}>0</Text>
          <Text style={[styles.halfFullLabel, { color: theme.colors.textSecondary }]}>Draw-Draw</Text>
          <Text style={[styles.halfFullValue, { color: theme.colors.text }]}>{halfFullTimeStats.draws}</Text>
          <Text style={[styles.halfFullValue, { color: theme.colors.text }]}>0</Text>
          <Text style={[styles.halfFullValue, { color: theme.colors.text }]}>{halfFullTimeStats.draws}</Text>
        </View>
      </View>
    </View>
    );
  };

  const renderTransfers = () => {
    return (
      <TransferInformation
        homeTeamName={homeTeamName}
        awayTeamName={awayTeamName}
        homeTeamLogo={homeTeamLogo}
        awayTeamLogo={awayTeamLogo}
        matchId={matchId}
        homeTeamId={homeTeamId}
        awayTeamId={awayTeamId}
      />
    );
  };

  const renderPlayerInjuries = () => {
    return (
      <PlayerInjuries
        homeTeamName={homeTeamName}
        awayTeamName={awayTeamName}
        homeTeamLogo={homeTeamLogo}
        awayTeamLogo={awayTeamLogo}
        matchId={matchId}
        homeTeamId={homeTeamId}
        awayTeamId={awayTeamId}
      />
    );
  };

  // Show loading state
  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color="#FF9500" />
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
          Loading match data...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      {/* BASKETBALL: Hide Goal Distribution (football-specific) */}
      {!isBasketball && (
        <>
          {renderSectionHeader("Goal Distribution", "Goals scored in different time periods of the match", "goalDistribution")}
          {expandedSection === "goalDistribution" && renderGoalDistribution()}
        </>
      )}

      {/* BASKETBALL: Show Points Distribution instead */}
      {isBasketball && (
        <>
          {renderSectionHeader("Points Distribution", "Points scored across different quarters", "pointsDistribution")}
          {expandedSection === "pointsDistribution" && renderGoalDistribution()}
        </>
      )}

      {/* League Standings - Show for both sports */}
      {renderSectionHeader(
        isBasketball ? "Conference Standings" : "League Standings", 
        isBasketball ? "Current conference position and statistics" : "Current league position and statistics", 
        "standings"
      )}
      {expandedSection === "standings" && renderStandings()}

      {/* Head to Head - Show for both sports */}
      {renderSectionHeader("Head-to-Head", "Historical matches between these teams", "headToHead")}
      {expandedSection === "headToHead" && renderHeadToHead()}

      {/* Recent Form - Show for both sports */}
      {renderSectionHeader(
        "Recent Form", 
        isBasketball ? "Last 10 games for each team" : "Last 10 matches for each team", 
        "recentForm"
      )}
      {expandedSection === "recentForm" && renderRecentForm()}

      {/* Upcoming Fixtures - Show for both sports */}
      {renderSectionHeader(
        "Upcoming Fixtures", 
        isBasketball ? "Next scheduled games for both teams" : "Next scheduled matches for both teams", 
        "upcomingFixtures"
      )}
      {expandedSection === "upcomingFixtures" && renderUpcomingFixtures()}

      {/* BASKETBALL: Hide Transfers (football-specific) */}
      {!isBasketball && (
        <>
          {renderSectionHeader("Transfer Information", "Recent player transfers for both teams", "transfers")}
          {expandedSection === "transfers" && renderTransfers()}
          
          {/* Player Injuries - Show for football only */}
          {renderSectionHeader("Player Injuries", "Current injuries and unavailable players for both teams", "playerInjuries")}
          {expandedSection === "playerInjuries" && renderPlayerInjuries()}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    fontFamily: "Inter-Regular",
  },
  emptyStateContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyStateText: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
    textAlign: "center",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Inter-Bold",
  },
  sectionSubtitle: {
    fontSize: 12,
    fontFamily: "Inter-Regular",
    marginTop: 4,
  },

  // Standings Styles
  standingsContainer: {
    padding: 16,
  },
  standingSection: {
    marginBottom: 8,
  },
  standingTeamHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  standingTeamLogo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  standingTeamName: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Inter-Bold",
  },
  standingTable: {
    borderRadius: 8,
    overflow: "hidden",
  },
  standingHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#1C1C1C",
    paddingVertical: 10,
  },
  standingDataRow: {
    flexDirection: "row",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  standingHeaderCell: {
    fontSize: 11,
    fontWeight: "600",
    fontFamily: "Inter-SemiBold",
    textAlign: "center",
  },
  standingDataCell: {
    fontSize: 13,
    fontFamily: "Inter-Regular",
    textAlign: "center",
  },
  standingRankCell: {
    width: 60,
  },
  standingMatchesCell: {
    width: 60,
  },
  standingRecordCell: {
    width: 80,
  },
  standingGoalsCell: {
    width: 70,
  },
  standingPointsCell: {
    width: 60,
  },

  // Head-to-Head Styles
  h2hContainer: {
    padding: 16,
  },
  h2hFilterRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  h2hTeamHeader: {
    marginRight: 12,
  },
  h2hTeamLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  h2hFilters: {
    flexDirection: "row",
    gap: 8,
    flex: 1,
  },
  h2hFilterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#2C2C2C",
  },
  h2hFilterButtonActive: {
    backgroundColor: "#3C3C3C",
  },
  h2hFilterText: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "Inter-SemiBold",
  },
  h2hFilterTextActive: {
    color: "#FFFFFF",
  },
  h2hStatsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
    padding: 12,
    backgroundColor: "#1C1C1C",
    borderRadius: 8,
  },
  h2hStatBox: {
    alignItems: "center",
  },
  h2hStatLabel: {
    fontSize: 11,
    fontFamily: "Inter-Regular",
  },
  h2hStatValue: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Inter-Bold",
  },
  h2hRecentStats: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: "#1C1C1C",
    borderRadius: 8,
  },
  h2hRecentStatItem: {},
  h2hRecentStatLabel: {
    fontSize: 12,
    fontFamily: "Inter-SemiBold",
    marginBottom: 4,
  },
  h2hRecentStatValues: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 4,
  },
  h2hRecentStatText: {
    fontSize: 13,
    fontFamily: "Inter-Regular",
  },
  h2hRecentStatDetail: {
    fontSize: 11,
    fontFamily: "Inter-Regular",
    marginTop: 2,
  },
  h2hMatchList: {},
  h2hMatchHeader: {
    flexDirection: "row",
    paddingVertical: 8,
    backgroundColor: "#1C1C1C",
    borderRadius: 4,
    marginBottom: 8,
  },
  h2hMatchHeaderText: {
    fontSize: 10,
    fontWeight: "600",
    fontFamily: "Inter-SemiBold",
    flex: 1,
    textAlign: "center",
  },
  h2hMatchRow: {
    flexDirection: "row",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
    alignItems: "center",
  },
  h2hMatchDate: {
    flex: 1,
  },
  h2hMatchDateText: {
    fontSize: 12,
    fontFamily: "Inter-Regular",
  },
  h2hMatchCompetition: {
    fontSize: 10,
    fontFamily: "Inter-Regular",
  },
  h2hMatchTeam: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter-Regular",
    textAlign: "center",
  },
  h2hMatchScore: {
    flex: 0.8,
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Inter-Bold",
    textAlign: "center",
  },
  h2hMatchTrend: {
    flex: 1,
    fontSize: 11,
    fontFamily: "Inter-Regular",
    textAlign: "center",
  },
  h2hMatchGoals: {
    flex: 0.8,
    fontSize: 11,
    fontFamily: "Inter-Regular",
    textAlign: "center",
  },
  h2hMatchCorners: {
    flex: 0.8,
    fontSize: 11,
    fontFamily: "Inter-Regular",
    textAlign: "center",
  },

  // Recent Form Styles
  recentFormContainer: {
    padding: 16,
  },
  recentFormFilterRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  recentFormTeamHeader: {
    marginRight: 12,
  },
  recentFormTeamLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  recentFormFilters: {
    flexDirection: "row",
    gap: 8,
    flex: 1,
  },
  recentFormFilterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#2C2C2C",
  },
  recentFormFilterButtonActive: {
    backgroundColor: "#3C3C3C",
  },
  recentFormFilterText: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "Inter-SemiBold",
  },
  recentFormFilterTextActive: {
    color: "#FFFFFF",
  },
  recentFormStatsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
    padding: 12,
    backgroundColor: "#1C1C1C",
    borderRadius: 8,
  },
  recentFormStatBox: {
    alignItems: "center",
  },
  recentFormStatLabel: {
    fontSize: 11,
    fontFamily: "Inter-Regular",
  },
  recentFormStatValue: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Inter-Bold",
  },
  recentFormMatchList: {},
  recentFormMatchHeader: {
    flexDirection: "row",
    paddingVertical: 8,
    backgroundColor: "#1C1C1C",
    borderRadius: 4,
    marginBottom: 8,
  },
  recentFormMatchHeaderText: {
    fontSize: 10,
    fontWeight: "600",
    fontFamily: "Inter-SemiBold",
    flex: 1,
    textAlign: "center",
  },
  recentFormMatchRow: {
    flexDirection: "row",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
    alignItems: "center",
  },
  recentFormMatchDate: {
    flex: 1,
  },
  recentFormMatchDateText: {
    fontSize: 12,
    fontFamily: "Inter-Regular",
  },
  recentFormMatchCompetition: {
    fontSize: 10,
    fontFamily: "Inter-Regular",
  },
  recentFormMatchTeam: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter-Regular",
    textAlign: "center",
  },
  recentFormMatchScore: {
    flex: 0.8,
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Inter-Bold",
    textAlign: "center",
  },
  recentFormMatchTrend: {
    flex: 1,
    fontSize: 11,
    fontFamily: "Inter-Regular",
    textAlign: "center",
  },
  recentFormMatchGoals: {
    flex: 0.8,
    fontSize: 11,
    fontFamily: "Inter-Regular",
    textAlign: "center",
  },
  recentFormMatchCorners: {
    flex: 0.8,
    fontSize: 11,
    fontFamily: "Inter-Regular",
    textAlign: "center",
  },

  // Upcoming Fixtures Styles
  upcomingContainer: {
    padding: 16,
  },
  upcomingSection: {},
  upcomingTeamHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  upcomingTeamLogo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  upcomingTeamName: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Inter-Bold",
    flex: 1,
  },
  upcomingViewAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FF4444",
  },
  upcomingViewAllText: {
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "Inter-SemiBold",
  },
  upcomingMatchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  upcomingMatchRowHighlight: {
    backgroundColor: "rgba(255, 68, 68, 0.05)",
    borderLeftWidth: 3,
    borderLeftColor: "#FF4444",
    paddingLeft: 12,
  },
  upcomingMatchDate: {
    width: 80,
  },
  upcomingMatchDateText: {
    fontSize: 12,
    fontFamily: "Inter-Regular",
  },
  upcomingMatchCompetition: {
    fontSize: 10,
    fontFamily: "Inter-Regular",
  },
  upcomingMatchTeams: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  upcomingMatchTeam: {
    fontSize: 13,
    fontFamily: "Inter-SemiBold",
  },
  upcomingMatchVS: {
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "Inter-Bold",
  },
  upcomingMatchDays: {
    width: 60,
    fontSize: 11,
    fontFamily: "Inter-Regular",
    textAlign: "right",
  },

  // Half/Full Time Stats Styles
  halfFullContainer: {
    padding: 16,
  },
  halfFullFilterRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  halfFullFilterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  halfFullFilterText: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "Inter-SemiBold",
  },
  halfFullHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    paddingVertical: 8,
    backgroundColor: "#1C1C1C",
    borderRadius: 8,
  },
  halfFullTeamHeader: {
    width: 60,
    alignItems: "center",
  },
  halfFullTeamLogo: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  halfFullLabels: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  halfFullLabel: {
    fontSize: 11,
    fontWeight: "600",
    fontFamily: "Inter-SemiBold",
  },
  halfFullTable: {},
  halfFullRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  halfFullRowLabel: {
    width: 80,
    fontSize: 12,
    fontFamily: "Inter-Regular",
  },
  halfFullValue: {
    width: 40,
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "Inter-SemiBold",
    textAlign: "center",
  },

  // Transfer Styles
  transfersContainer: {
    padding: 16,
  },
  transferSection: {},
  transferTeamHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  transferTeamLogo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  transferTeamName: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Inter-Bold",
    flex: 1,
  },
  transferViewMoreButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FF4444",
  },
  transferViewMoreText: {
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "Inter-SemiBold",
  },
  transferList: {},
  transferListTitle: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Inter-Bold",
    marginBottom: 8,
  },
  transferRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  transferPlayer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 2,
  },
  transferPlayerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#2C2C2C",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  transferPlayerIconText: {
    fontSize: 20,
  },
  transferPlayerInfo: {},
  transferPlayerName: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "Inter-SemiBold",
  },
  transferPlayerDetails: {
    fontSize: 11,
    fontFamily: "Inter-Regular",
  },
  transferDetails: {
    flexDirection: "row",
    alignItems: "center",
    flex: 2,
  },
  transferDirection: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  transferDirectionText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  transferTeamInfo: {},
  transferTeamText: {
    fontSize: 12,
    fontFamily: "Inter-SemiBold",
  },
  transferDateText: {
    fontSize: 10,
    fontFamily: "Inter-Regular",
  },
  transferFee: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter-Regular",
    textAlign: "right",
  },
});
