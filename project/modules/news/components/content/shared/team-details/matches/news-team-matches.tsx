/**
 * Universal Team Matches Component
 * 
 * Displays all team matches (previous/live/upcoming) with real API data
 * from API Football and TheSportsDB integrated services.
 * 
 * Features:
 * - Real-time match data from API Football
 * - Competition tabs for filtering by league/cup
 * - Season selector (25-26, 24-25, etc.)
 * - Live match indicators
 * - Team logos and scores
 * - Match date and time display
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "@/hooks/useTheme";
import { Calendar, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react-native";
import { teamDetailsApi } from "@/services/teamDetailsApiService";
import { teamColorService } from "@/services/teamColorService";
import CompetitionTabs from "./components/CompetitionTabs";
import NewsMatchesLeagueRoundSelector from "@/modules/news/components/shared/news-matches-league-round-selector";
import {
  extractCompetitions,
  filterMatchesByCompetition,
  type Competition,
} from "./utils/competitionDetector";

// ============================================================================
// INTERFACES
// ============================================================================

interface Match {
  id: string | number;
  homeTeam: string;
  awayTeam: string;
  homeLogoUrl?: string;
  awayLogoUrl?: string;
  date: string;
  time: string;
  venue?: string;
  competition: string;
  round?: string;
  matchStatus?: "upcoming" | "live" | "FT" | "HT" | "1H" | "2H" | "postponed" | "AET" | "PEN" | "AOT"; // ✅ Add basketball/football finish statuses
  homeScore?: number | null;
  awayScore?: number | null;
  minute?: string;
  isLive?: boolean;
}

interface NewsTeamMatchesProps {
  teamName?: string;
  teamId?: number;
  leagueId?: number;
  selectedSeason: string; // From parent component (e.g., "25-26")
  teamLogoUrl?: string; // Current team's logo URL
  teamColors?: {
    primary: string;
    secondary: string;
  };
  sport?: string; // ✅ CRITICAL: Add sport parameter
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const generateTeamLogo = (teamName: string): string => {
  return `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(teamName)}&backgroundColor=f0f0f0`;
};

const groupMatchesByRound = (matches: Match[]): Record<string, Match[]> => {
  const grouped: Record<string, Match[]> = {};
  
  matches.forEach((match) => {
    const round = match.round || "Round 1";
    if (!grouped[round]) {
      grouped[round] = [];
    }
    grouped[round].push(match);
  });
  
  return grouped;
};

const formatMatchDate = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      console.warn("Invalid date:", dateStr);
      return dateStr;
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    // Western format: DD/MM/YYYY
    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error("Error formatting date:", error, dateStr);
    return dateStr;
  }
};

const formatMatchTime = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  } catch {
    return "00:00";
  }
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function NewsTeamMatches({
  teamName,
  teamId,
  leagueId,
  selectedSeason,
  teamLogoUrl,
  teamColors = { primary: "#FF6B35", secondary: "#FF8C61" },
  sport = "football", // ✅ CRITICAL: Add sport parameter with default
}: NewsTeamMatchesProps) {
  const router = useRouter();
  const theme = useTheme();

  // State management
  const [selectedCompetitionId, setSelectedCompetitionId] = useState("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [filteredMatches, setFilteredMatches] = useState<Match[]>([]);
  const [selectedRound, setSelectedRound] = useState<string>("");
  const [availableRounds, setAvailableRounds] = useState<string[]>([]);
  const [lastPressedButton, setLastPressedButton] = useState<"previous" | "next" | null>(null);
  const [showRoundsModal, setShowRoundsModal] = useState(false);

  // Check if we're in dark mode
  const isDarkMode =
    theme.colors.background === "#2A2A2A" || theme.colors.text === "#FFFFFF";

  // Helper function to get readable text color for team primary color
  // If team color is bright (like yellow), use white/light text for better contrast
  // Otherwise, use the team color itself
  const getReadableTextColor = (teamColor: string): string => {
    const isBright = teamColorService.isLightColor(teamColor);
    if (isBright) {
      // For bright colors (yellow, light blue, etc.), use white/light text
      return isDarkMode ? "#FFFFFF" : theme.colors.text;
    }
    // For dark colors, use the team color itself
    return teamColor;
  };

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const fetchTeamMatches = async (refresh: boolean = false) => {
    if (!teamId) {
      console.log("⚠️ No team ID provided");
      setLoading(false);
      return;
    }

    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // Convert season format from "25-26" to 2025 for API
      const seasonYear = parseInt(selectedSeason.split("-")[0]) + 2000;
      
      console.log(`📊 Fetching matches for team ID: ${teamId}, Season: ${seasonYear}`);

      // Fetch both upcoming and recent matches from API Football
      const [upcomingMatches, recentMatches] = await Promise.all([
        teamDetailsApi.getUpcomingMatches(teamId, 20, sport), // ✅ CRITICAL: Pass sport
        teamDetailsApi.getRecentMatches(teamId, 20, sport), // ✅ CRITICAL: Pass sport
      ]);

      console.log(`✅ Fetched ${upcomingMatches.length} upcoming, ${recentMatches.length} recent matches`);
      console.log(`🎨 Current team logo: ${teamLogoUrl ? 'Available' : 'Missing'}`);
      if (!teamLogoUrl) {
        console.warn(`⚠️ No team logo provided for ${teamName}. Both team logos will not display properly.`);
      }

      // Helper to extract round from match data
      const extractRound = (match: any): string => {
        // Check if round is available in the match object (from API)
        if (match.round) {
          return match.round;
        }
        // If no round data, return default
        return "Round 1";
      };

      // Convert to our Match interface format
      const convertedMatches: Match[] = [
        ...recentMatches.map((m: any) => ({
          id: m.id,
          homeTeam: m.homeAway === "H" ? (teamName || "Home") : m.opponent,
          awayTeam: m.homeAway === "A" ? (teamName || "Away") : m.opponent,
          // Set both team logos: current team's logo + opponent's logo
          homeLogoUrl: m.homeAway === "H" ? teamLogoUrl : m.opponentLogo,
          awayLogoUrl: m.homeAway === "A" ? teamLogoUrl : m.opponentLogo,
          date: formatMatchDate(m.date),
          time: m.time || "00:00",
          venue: m.venue,
          competition: m.competition || "Other",
          round: extractRound(m),
          matchStatus: m.status === "FT" ? ("FT" as const) : (m.status as any),
          homeScore: m.homeAway === "H" ? m.homeScore : m.awayScore,
          awayScore: m.homeAway === "A" ? m.homeScore : m.awayScore,
          isLive: m.isLive,
        })),
        ...upcomingMatches.map((m: any) => ({
          id: m.id,
          homeTeam: m.homeAway === "H" ? (teamName || "Home") : m.opponent,
          awayTeam: m.homeAway === "A" ? (teamName || "Away") : m.opponent,
          // Set both team logos: current team's logo + opponent's logo
          homeLogoUrl: m.homeAway === "H" ? teamLogoUrl : m.opponentLogo,
          awayLogoUrl: m.homeAway === "A" ? teamLogoUrl : m.opponentLogo,
          date: formatMatchDate(m.date),
          time: m.time || "00:00",
          venue: m.venue,
          competition: m.competition || "Other",
          round: extractRound(m),
          matchStatus: m.isLive ? ("live" as const) : ("upcoming" as const),
          homeScore: null, // Upcoming matches have no scores
          awayScore: null, // Upcoming matches have no scores
          isLive: m.isLive,
        })),
      ];

      // Sort matches by date (most recent first for better UX)
      convertedMatches.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateB.getTime() - dateA.getTime();
      });

      setAllMatches(convertedMatches);

      // Extract competitions from matches
      const detectedCompetitions = extractCompetitions(convertedMatches);
      console.log(`🏆 Found ${detectedCompetitions.length} competitions for season ${selectedSeason}:`, detectedCompetitions.map(c => `${c.name} (${c.matchCount})`));
      setCompetitions(detectedCompetitions);

      // Extract rounds from matches
      const rounds = Array.from(new Set(convertedMatches.map(m => m.round || "Round 1").filter(Boolean))).sort((a, b) => {
        // Extract round number for sorting
        const numA = parseInt(a.match(/\d+/)?.[0] || "0");
        const numB = parseInt(b.match(/\d+/)?.[0] || "0");
        return numA - numB;
      });
      setAvailableRounds(rounds);
      
      // Set default selected round to first round if available
      if (rounds.length > 0 && !selectedRound) {
        setSelectedRound(rounds[0]);
      }

      // Filter matches based on selected competition
      const filtered = filterMatchesByCompetition(convertedMatches, selectedCompetitionId);
      setFilteredMatches(filtered);
      
      console.log(`✅ Season ${selectedSeason}: ${convertedMatches.length} total matches, ${filtered.length} in current view`);
      
      if (detectedCompetitions.length > 0) {
        console.log(`📋 Available competitions: All (${convertedMatches.length}), ${detectedCompetitions.map(c => `${c.name} (${c.matchCount})`).join(', ')}`);
      }

    } catch (error) {
      console.error("❌ Error fetching team matches:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    // Reset to "All" tab and clear selected round when season changes for better UX
    console.log(`🔄 Season changed to: ${selectedSeason} - Resetting to "All" tab and clearing round selection`);
    setSelectedCompetitionId("all");
    setSelectedRound(""); // Reset round selection
    fetchTeamMatches();
  }, [teamId, selectedSeason]); // Refetch when season changes

  // Update filtered matches when competition or round selection changes
  useEffect(() => {
    let filtered = filterMatchesByCompetition(allMatches, selectedCompetitionId);
    
    // Filter by round if a round is selected
    if (selectedRound && selectedRound !== "all") {
      filtered = filtered.filter(m => (m.round || "Round 1") === selectedRound);
    }
    
    setFilteredMatches(filtered);
    
    // Update available rounds based on filtered competition matches
    const competitionMatches = filterMatchesByCompetition(allMatches, selectedCompetitionId);
    const rounds = Array.from(new Set(competitionMatches.map(m => m.round || "Round 1").filter(Boolean))).sort((a, b) => {
      const numA = parseInt(a.match(/\d+/)?.[0] || "0");
      const numB = parseInt(b.match(/\d+/)?.[0] || "0");
      return numA - numB;
    });
    setAvailableRounds(rounds);
    
    // If current selected round is not in available rounds, reset to first round
    if (selectedRound && !rounds.includes(selectedRound) && rounds.length > 0) {
      setSelectedRound(rounds[0]);
    } else if (!selectedRound && rounds.length > 0) {
      setSelectedRound(rounds[0]);
    }
    
    console.log(`🔍 Filtered to ${filtered.length} matches for competition: ${selectedCompetitionId}, round: ${selectedRound || "all"}`);
  }, [selectedCompetitionId, allMatches, selectedRound]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  // Note: Pull-to-refresh is handled by parent ScrollView
  // Individual refresh can be triggered by re-fetching when needed

  const handleCompetitionSelect = (competitionId: string) => {
    const competition = competitions.find(c => c.id === competitionId);
    const competitionName = competitionId === "all" ? "All Matches" : (competition?.name || competitionId);
    console.log(`🏆 Selected competition: ${competitionName} (${competitionId})`);
    setSelectedCompetitionId(competitionId);
  };

  const handlePreviousRound = () => {
    const currentIndex = availableRounds.findIndex(r => r === selectedRound);
    if (currentIndex > 0) {
      setSelectedRound(availableRounds[currentIndex - 1]);
      setLastPressedButton("previous"); // Mark Previous as pressed - makes it bright
    }
  };

  const handleNextRound = () => {
    const currentIndex = availableRounds.findIndex(r => r === selectedRound);
    if (currentIndex < availableRounds.length - 1) {
      setSelectedRound(availableRounds[currentIndex + 1]);
      setLastPressedButton("next"); // Mark Next as pressed - makes it bright
    }
  };

  const canGoPrevious = availableRounds.findIndex(r => r === selectedRound) > 0;
  const canGoNext = availableRounds.findIndex(r => r === selectedRound) < availableRounds.length - 1;
  
  // Determine button brightness based on last pressed button
  const isPreviousBright = lastPressedButton === "previous";
  const isNextBright = lastPressedButton === "next";

  // ============================================================================
  // RENDER FUNCTIONS
  // ============================================================================

  const renderMatch = (match: Match) => {
    const isTeamHome = teamName && match.homeTeam.toLowerCase().includes(teamName.toLowerCase());
    
    // Log match rendering for debugging (only for upcoming matches with no scores)
    if (match.matchStatus === "upcoming" && (match.homeScore === null || match.homeScore === undefined)) {
      console.log(`📅 Rendering upcoming match: ${match.homeTeam} vs ${match.awayTeam} - Scores: ${match.homeScore}, ${match.awayScore} (should show -, -)`);
    }
    
    // Date is already in DD/MM/YYYY format from formatMatchDate
    const formatFullDate = (dateStr: string): string => {
      // If already in DD/MM/YYYY format, return as is
      if (dateStr && dateStr.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        return dateStr;
      }
      
      // Fallback for other formats
      try {
        if (dateStr.includes("/")) {
          const parts = dateStr.split("/");
          if (parts.length === 3) {
            // Already formatted
            return dateStr;
          } else if (parts.length === 2) {
            // Format: "MM/DD" - add year
            const [month, day] = parts;
            const year = parseInt(selectedSeason.split("-")[0]) + 2000;
            return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`;
          }
        }
        return dateStr;
      } catch (error) {
        console.error("Date formatting error:", error, "for date:", dateStr);
        return dateStr;
      }
    };

    // Determine result badge (W/L/D) for finished matches
    // ✅ BASKETBALL: No draws in basketball - only W/L
    const getMatchResult = (): "W" | "L" | "D" | null => {
      // Check if match is finished - support both football and basketball status codes
      const isFinished = match.matchStatus === "FT" || 
                        match.matchStatus === "AET" ||  // Football: After Extra Time
                        match.matchStatus === "PEN" ||  // Football: Penalties
                        match.matchStatus === "AOT";    // Basketball: After OverTime
      
      if (!isFinished || match.homeScore === null || match.awayScore === null || 
          match.homeScore === undefined || match.awayScore === undefined) {
        return null;
      }
      
      const currentTeamScore = isTeamHome ? match.homeScore : match.awayScore;
      const opponentScore = isTeamHome ? match.awayScore : match.homeScore;
      
      if (currentTeamScore !== undefined && opponentScore !== undefined) {
        if (currentTeamScore > opponentScore) return "W";
        if (currentTeamScore < opponentScore) return "L";
        // ✅ BASKETBALL: Draws are rare/impossible in basketball (overtime resolves ties)
        // But keep "D" for football compatibility
        return "D";
      }
      
      return null;
    };

    const result = getMatchResult();
    
    return (
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
              matchId: match.id.toString(),
              homeTeam: match.homeTeam,
              awayTeam: match.awayTeam,
              homeScore: match.homeScore?.toString() || "0",
              awayScore: match.awayScore?.toString() || "0",
              status: match.matchStatus === "FT" ? "FT" : match.matchStatus || "upcoming",
              league: match.competition,
              startTime: match.date + " " + match.time,
              homeLogo: match.homeLogoUrl || "",
              awayLogo: match.awayLogoUrl || "",
            },
          });
        }}
      >
        <View style={styles.matchLayout}>
          {/* Left Side - Competition, Date, Time */}
          <View style={styles.leftSection}>
            <Text
              style={[styles.competitionName, { color: theme.colors.textSecondary }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {match.competition}
            </Text>
            <Text
              style={[styles.matchDate, { color: theme.colors.textSecondary }]}
            >
              {formatFullDate(match.date)}
            </Text>
            <Text
              style={[styles.matchTime, { color: theme.colors.textSecondary }]}
            >
              {match.time}
            </Text>
          </View>

          {/* Middle Section - Teams with Logos */}
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
                      fontWeight: isTeamHome ? "700" : "500",
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
                      fontWeight: !isTeamHome ? "700" : "500",
                    },
                  ]}
                  numberOfLines={1}
                >
                  {match.awayTeam}
                </Text>
              </View>
            </View>
          </View>

          {/* Right Side - Scores and Result Badge */}
          <View style={styles.rightSection}>
            <View style={styles.scoreContainer}>
              <Text style={[styles.score, { color: theme.colors.text }]}>
                {match.homeScore !== undefined && match.homeScore !== null
                  ? match.homeScore
                  : "-"}
              </Text>
              <Text style={[styles.score, { color: theme.colors.text }]}>
                {match.awayScore !== undefined && match.awayScore !== null
                  ? match.awayScore
                  : "-"}
              </Text>
            </View>
            
            {/* Result Badge (W/L/D) - Circular */}
            {result && (
              <View
                style={[
                  styles.resultBadge,
                  {
                    backgroundColor:
                      result === "W"
                        ? "#4CAF50" // Green for Win (matches hero section)
                        : result === "D"
                          ? "#FF9800" // Orange for Draw (matches hero section)
                          : "#F44336", // Red for Loss (matches hero section)
                  },
                ]}
              >
                <Text style={styles.resultText}>{result}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* Competition Tabs */}
      {!loading && competitions.length > 0 && (
        <CompetitionTabs
          competitions={competitions}
          selectedCompetitionId={selectedCompetitionId}
          onCompetitionSelect={handleCompetitionSelect}
          primaryColor={teamColors.primary}
          isDarkMode={isDarkMode}
        />
      )}

      {/* Round Navigation */}
      {!loading && availableRounds.length > 0 && (
        <View
          style={[
            styles.roundNavigation,
            {
              backgroundColor: isDarkMode ? "#2A2A2A" : "#F8F9FA",
              borderTopColor: isDarkMode ? "#555555" : "#E5E5E5",
            },
          ]}
        >
          <TouchableOpacity
            style={[styles.navButton, { opacity: 1 }]}
            onPress={canGoPrevious ? handlePreviousRound : undefined}
            activeOpacity={0.7}
          >
            <ChevronLeft 
              size={16} 
              color={isPreviousBright 
                ? (isDarkMode ? "#FFFFFF" : "#000000")  // BRIGHT when pressed
                : (isDarkMode ? "#666666" : "#CCCCCC")   // DULL when not pressed
              } 
            />
            <Text
              style={[
                styles.navButtonText,
                {
                  color: isPreviousBright
                    ? (isDarkMode ? "#FFFFFF" : "#000000")  // BRIGHT when pressed
                    : (isDarkMode ? "#666666" : "#CCCCCC"), // DULL when not pressed
                  fontWeight: isPreviousBright ? "600" : "500", // Make pressed button bolder
                },
              ]}
            >
              Previous
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.roundSelector,
              {
                backgroundColor: isDarkMode
                  ? "#1A1A1A"
                  : "rgba(255,255,255,0.9)",
                borderColor: teamColors.primary,
              },
            ]}
            onPress={() => setShowRoundsModal(true)}
            activeOpacity={0.7}
          >
            <Text style={[styles.roundText, { color: getReadableTextColor(teamColors.primary) }]}>
              {selectedRound || "Round 1"}
            </Text>
            <ChevronDown size={16} color={teamColors.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navButton, { opacity: 1 }]}
            onPress={canGoNext ? handleNextRound : undefined}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.navButtonText,
                {
                  color: isNextBright
                    ? (isDarkMode ? "#FFFFFF" : "#000000")  // BRIGHT when pressed
                    : (isDarkMode ? "#666666" : "#CCCCCC"), // DULL when not pressed
                  fontWeight: isNextBright ? "600" : "500", // Make pressed button bolder
                },
              ]}
            >
              Next
            </Text>
            <ChevronRight 
              size={16} 
              color={isNextBright 
                ? (isDarkMode ? "#FFFFFF" : "#000000")  // BRIGHT when pressed
                : (isDarkMode ? "#666666" : "#CCCCCC")   // DULL when not pressed
              } 
            />
          </TouchableOpacity>
        </View>
      )}

      {/* Note: Season selector is managed by parent component (news-team-details.tsx) */}

      {/* Round Selector Modal */}
      {availableRounds.length > 0 && (
        <NewsMatchesLeagueRoundSelector
          rounds={availableRounds}
          selectedRound={selectedRound || availableRounds[0] || ""}
          onRoundChange={(round) => {
            setSelectedRound(round);
            setShowRoundsModal(false);
          }}
          showModal={showRoundsModal}
          setShowModal={setShowRoundsModal}
          leagueName={competitions.find(c => c.id === selectedCompetitionId)?.name || "League"}
          primaryColor={teamColors.primary}
          sport={sport} // ✅ CRITICAL: Pass sport parameter
        />
      )}

      {/* Matches List - No ScrollView needed, parent handles scrolling */}
      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={teamColors.primary} />
            <Text
              style={[
                styles.loadingText,
                { color: theme.colors.textSecondary },
              ]}
            >
              Loading matches...
            </Text>
          </View>
        ) : filteredMatches.length > 0 ? (
          <View style={styles.matchesList}>
            {filteredMatches.map(renderMatch)}
          </View>
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
                ? `No matches found for ${teamName} in this competition`
                : `No matches scheduled for this competition`}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
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
    justifyContent: "space-between",
  },
  leftSection: {
    width: 100,
    paddingRight: 8,
  },
  competitionName: {
    fontSize: 11,
    fontFamily: "Inter-Medium",
    marginBottom: 4,
    fontWeight: "500",
  },
  matchDate: {
    fontSize: 11,
    fontFamily: "Inter-Regular",
    marginBottom: 2,
  },
  matchTime: {
    fontSize: 11,
    fontFamily: "Inter-Regular",
  },
  middleSection: {
    flex: 1,
    paddingHorizontal: 12,
  },
  teamContainer: {
    gap: 10,
  },
  teamRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  teamLogo: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  teamName: {
    fontSize: 14,
    fontFamily: "Inter-Medium",
    flex: 1,
    fontWeight: "500",
  },
  rightSection: {
    width: 70,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 12,
  },
  scoreContainer: {
    alignItems: "center",
    gap: 10,
  },
  score: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Inter-Bold",
    letterSpacing: 0.5,
  },
  resultBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  resultText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
    fontFamily: "Inter-Bold",
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
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
    paddingHorizontal: 40,
  },
  roundNavigation: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  navButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    opacity: 1, // Ensure full opacity even when disabled
  },
  navButtonText: {
    fontSize: 14,
    fontFamily: "Inter-Medium",
    fontWeight: "500",
  },
  roundSelector: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  roundText: {
    fontSize: 14,
    fontFamily: "Inter-Medium",
    fontWeight: "600",
  },
});

