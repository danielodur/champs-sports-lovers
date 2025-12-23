/**
 * League Matches Tab
 * Displays league fixtures and results
 */

import React, { useState, useEffect, useMemo } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  ScrollView, 
  Pressable,
  Image,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { ChevronDown, Check } from "lucide-react-native";
import teamLogoService from "@/services/teamLogoService";
import { createApiSportsService } from "../../../../services/api-sports-service";
import { getLeagueApiId } from "../[leagueId]";
import { Fixture } from "../../../../types/football-fixtures-response";

const { width } = Dimensions.get("window");

interface LeagueMatchesProps {
  leagueId: string;
  season: string;
  theme: any;
  primaryColor?: string;
  sport?: string; // Optional sport parameter for basketball/football differentiation
}

// Helper function to get league name from ID
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
    "eredivisie": "Eredivisie",
    "primeira-liga": "Primeira Liga",
    "scottish-premiership": "Scottish Premiership",
    "mls": "Major League Soccer",
    "liga-mx": "Liga MX",
    "brazilian-serie-a": "Brasileirão Série A",
    "argentine-primera": "Primera División",
  };
  
  return leagueNameMap[leagueId] || "League";
};

// Helper function to get official team logo with API support
const getTeamLogo = (teamName: string, leagueId: string, apiLogo?: string): string => {
  const leagueName = getLeagueName(leagueId);
  return teamLogoService.getOfficialTeamLogo(teamName, leagueName, apiLogo);
};

// Helper function to extract round number from API round string (e.g., "Regular Season - 1" -> 1)
const extractRoundNumber = (roundString: string | null | undefined): number => {
  if (!roundString) return 0;
  const match = roundString.match(/\d+/);
  return match ? parseInt(match[0], 10) : 0;
};

// Transform API fixture to match format
const transformFixture = (fixture: Fixture) => {
  // The round property exists in the API response but not in the FixtureLeague type
  // Use type assertion to access it safely
  const round = extractRoundNumber((fixture.league as any)?.round);
  const fixtureDate = new Date(fixture.fixture.date);
  const dateStr = fixtureDate.toISOString().split("T")[0];
  const timeStr = fixtureDate.toTimeString().split(" ")[0].slice(0, 5);
  
  const status = fixture.fixture.status.short;
  let matchStatus = "Upcoming";
  // ✅ BASKETBALL & FOOTBALL: Support all finish status codes
  if (status === "FT" || status === "AET" || status === "PEN" || status === "AOT") {
    matchStatus = "FT";
  } else if (status === "1H" || status === "2H" || status === "HT" || status === "ET" || status === "P") {
    matchStatus = "Live";
  }
  
  return {
    id: fixture.fixture.id,
    round,
    date: dateStr,
    time: timeStr,
    homeTeam: {
      name: fixture.teams.home.name,
      logo: fixture.teams.home.logo,
    },
    awayTeam: {
      name: fixture.teams.away.name,
      logo: fixture.teams.away.logo,
    },
    homeScore: fixture.goals.home,
    awayScore: fixture.goals.away,
    matchStatus,
  };
};

export default function LeagueMatches({ leagueId, season, theme, primaryColor = "#FF6B35", sport = "football" }: LeagueMatchesProps) {
  const isDarkMode = theme.colors.backgroundSecondary !== "#F5F5F5";
  const [selectedMatchday, setSelectedMatchday] = useState<number>(1);
  const [showRoundsModal, setShowRoundsModal] = useState(false);
  
  // Initialize with empty array for instant display
  const [matches, setMatches] = useState<any[]>([]);
  const [isLoadingApi, setIsLoadingApi] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Memoize API service to prevent recreation
  const apiSportsService = useMemo(() => createApiSportsService(), []);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        setIsLoadingApi(true);
        setError(null);
        setMatches([]); // ✅ Clear previous matches immediately
        
        // ✅ CRITICAL: Pass sport parameter to get correct API ID
        const apiLeagueId = getLeagueApiId(leagueId, undefined, sport);
        
        if (!apiLeagueId) {
          console.warn(`⚠️ [LeagueMatches] No API ID found for leagueId: ${leagueId} (sport: ${sport}) - League data not yet available`);
          setError(`Match data not yet available for this league.\n\nThis league is supported but data will be available when we integrate a better API provider.`);
          setIsLoadingApi(false);
          return;
        }

        const seasonYear = parseInt(season.split("-")[0]);
        const fixturesResponse = await apiSportsService.getFixtures(
          undefined,
          apiLeagueId,
          seasonYear,
          undefined,
          undefined,
          undefined,
          sport // Pass sport parameter to API
        );

        const fixtures = fixturesResponse?.response || [];
        const transformedMatches = fixtures.map(transformFixture);
        
        // Sort by round and date
        transformedMatches.sort((a, b) => {
          if (a.round !== b.round) return a.round - b.round;
          return a.date.localeCompare(b.date);
        });

        setMatches(transformedMatches);

        // Set default selected matchday to first round with matches, or current round
        if (transformedMatches.length > 0) {
          const rounds = Array.from(new Set(transformedMatches.map(m => m.round))).sort((a, b) => a - b);
          setSelectedMatchday(rounds[0] || 1);
        }
      } catch (err) {
        console.error("Error fetching matches:", err);
        setError("Failed to load matches");
      } finally {
        setIsLoadingApi(false);
      }
    };

    // Fetch in background - don't block UI
    fetchMatches();
  }, [leagueId, season]);

  // Get available rounds from fetched matches
  const availableRounds = Array.from(
    new Set(matches.map((m) => m.round))
  ).sort((a, b) => a - b).filter(r => r > 0);

  const totalRounds = availableRounds.length > 0 ? Math.max(...availableRounds) : 1;
  const minRound = availableRounds.length > 0 ? Math.min(...availableRounds) : 1;

  // Filter matches by selected round
  const roundMatches = matches.filter((m) => m.round === selectedMatchday);

  // Format date to DD/MM/YYYY
  const formatMatchDate = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  };

  if (error && matches.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <Text style={[styles.errorText, { color: theme.colors.textSecondary }]}>
          {error}
        </Text>
      </View>
    );
  }

  const renderMatch = (match: any, index: number) => {
    // Get official team logos using the enhanced service
    const homeLogoUrl = getTeamLogo(
      match.homeTeam.name, 
      leagueId, 
      match.homeTeam.logo || undefined
    );
    const awayLogoUrl = getTeamLogo(
      match.awayTeam.name, 
      leagueId, 
      match.awayTeam.logo || undefined
    );

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
      >
        <View style={styles.matchLayout}>
          {/* Left Section - Date, Time, Status */}
          <View style={styles.leftSection}>
            <Text style={[styles.matchDate, { color: theme.colors.textSecondary }]}>
              {formatMatchDate(match.date)}
            </Text>
            <Text style={[styles.matchTime, { color: theme.colors.textSecondary }]}>
              {match.time}
            </Text>
            {match.matchStatus && (
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor:
                      match.matchStatus === "FT"
                        ? "#4CAF50"
                        : match.matchStatus === "Live"
                          ? "#FF5722"
                          : "#2196F3",
                  },
                ]}
              >
                <Text style={styles.statusText}>{match.matchStatus}</Text>
              </View>
            )}
          </View>

          {/* Middle Section - Teams */}
          <View style={styles.middleSection}>
            <View style={styles.teamContainer}>
              <View style={styles.teamRow}>
                <Image
                  source={{ uri: homeLogoUrl }}
                  style={styles.teamLogo}
                />
                <Text
                  style={[styles.teamName, { color: theme.colors.text }]}
                  numberOfLines={1}
                >
                  {match.homeTeam.name}
                </Text>
              </View>
              <View style={styles.teamRow}>
                <Image
                  source={{ uri: awayLogoUrl }}
                  style={styles.teamLogo}
                />
                <Text
                  style={[styles.teamName, { color: theme.colors.text }]}
                  numberOfLines={1}
                >
                  {match.awayTeam.name}
                </Text>
              </View>
            </View>
          </View>

          {/* Right Section - Scores */}
          <View style={styles.rightSection}>
            <Text style={[styles.score, { color: theme.colors.text }]}>
              {match.homeScore !== undefined && match.homeScore !== null ? match.homeScore : "-"}
            </Text>
            <Text style={[styles.score, { color: theme.colors.text }]}>
              {match.awayScore !== undefined && match.awayScore !== null ? match.awayScore : "-"}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {availableRounds.length === 0 && !isLoadingApi && matches.length === 0 && (
        <View style={styles.noMatches}>
          <Text style={[styles.noMatchesText, { color: theme.colors.textSecondary }]}>
            No matches available for this season
          </Text>
        </View>
      )}
      {/* Round Selector */}
      <View style={styles.roundSelector}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => setSelectedMatchday(Math.max(minRound, selectedMatchday - 1))}
          disabled={selectedMatchday <= minRound}
        >
          <Text 
            style={[
              styles.navButtonText, 
              { 
                color: selectedMatchday <= minRound 
                  ? theme.colors.textSecondary 
                  : theme.colors.text 
              }
            ]}
          >
            Previous
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.roundButton,
            {
              borderColor: primaryColor,
              backgroundColor: isDarkMode ? theme.colors.backgroundSecondary : theme.colors.background,
            },
          ]}
          onPress={() => setShowRoundsModal(true)}
        >
          <Text style={[styles.roundText, { color: primaryColor }]}>
            Round {selectedMatchday}
          </Text>
          <ChevronDown size={20} color={primaryColor} />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => setSelectedMatchday(Math.min(totalRounds, selectedMatchday + 1))}
          disabled={selectedMatchday >= totalRounds}
        >
          <Text 
            style={[
              styles.navButtonText, 
              { 
                color: selectedMatchday >= totalRounds 
                  ? theme.colors.textSecondary 
                  : theme.colors.text 
              }
            ]}
          >
            Next
          </Text>
        </TouchableOpacity>
      </View>

      {/* Matches List */}
      {roundMatches.length > 0 ? (
        <>
          {roundMatches.map(renderMatch)}
        </>
      ) : (
        <View style={styles.noMatches}>
          <Text style={[styles.noMatchesText, { color: theme.colors.textSecondary }]}>
            No matches available for Round {selectedMatchday}
          </Text>
        </View>
      )}

      {/* Rounds Modal */}
      <Modal
        visible={showRoundsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRoundsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowRoundsModal(false)}
          />

          <View
            style={[
              styles.roundModal,
              {
                backgroundColor: theme.colors.background,
                borderTopColor: isDarkMode ? "#444" : "#E0E0E0",
              },
            ]}
          >
            {/* Drag Handle */}
            <View
              style={{
                width: 40,
                height: 4,
                backgroundColor: "rgba(0,0,0,0.3)",
                borderRadius: 2,
                alignSelf: "center",
                marginTop: 8,
                marginBottom: 16,
              }}
            />

            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                Select League Round
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowRoundsModal(false)}
              >
                <Text
                  style={[
                    styles.closeButtonText,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  ×
                </Text>
              </TouchableOpacity>
            </View>

            {/* Rounds List */}
            <ScrollView
              style={styles.roundsContainer}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={styles.roundsContentContainer}
              bounces={true}
              decelerationRate="normal"
              scrollEventThrottle={16}
            >
              {availableRounds.map((round, index) => {
                const isSelected = selectedMatchday === round;
                return (
                  <TouchableOpacity
                    key={`${round}-${index}`}
                    style={[
                      styles.roundOption,
                      isSelected && {
                        backgroundColor: isDarkMode
                          ? `${primaryColor}26`
                          : `${primaryColor}14`,
                        borderLeftWidth: 3,
                        borderLeftColor: primaryColor,
                      },
                    ]}
                    onPress={() => {
                      setSelectedMatchday(round);
                      setShowRoundsModal(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.roundOptionText,
                        {
                          color: isSelected ? primaryColor : theme.colors.text,
                          fontWeight: isSelected ? "700" : "400",
                        },
                      ]}
                    >
                      Round {round}
                    </Text>
                    {isSelected && (
                      <Check size={20} color={primaryColor} style={styles.checkIcon} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => setShowRoundsModal(false)}
              >
                <Text style={styles.actionButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, { backgroundColor: primaryColor }]}
                onPress={() => setShowRoundsModal(false)}
              >
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  errorText: {
    fontSize: 14,
    textAlign: "center",
  },
  // Round Selector
  roundSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 8,
  },
  navButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  roundButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  roundText: {
    fontSize: 17,
    fontWeight: "600",
  },
  // Match Container
  matchContainer: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  matchLayout: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  // Left Section - Date, Time, Status
  leftSection: {
    width: 80,
    alignItems: "flex-start",
  },
  matchDate: {
    fontSize: 11,
    fontWeight: "500",
    marginBottom: 4,
  },
  matchTime: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  // Middle Section - Teams
  middleSection: {
    flex: 1,
    paddingHorizontal: 16,
  },
  teamContainer: {
    gap: 12,
  },
  teamRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  teamLogo: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#f0f0f0",
  },
  teamName: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  // Right Section - Scores
  rightSection: {
    width: 40,
    alignItems: "center",
    gap: 12,
  },
  score: {
    fontSize: 16,
    fontWeight: "700",
  },
  // No Matches
  noMatches: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  noMatchesText: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "transparent",
  },
  roundModal: {
    height: "60%",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 34,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(128,128,128,0.2)",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(128,128,128,0.1)",
  },
  closeButtonText: {
    fontSize: 20,
  },
  roundsContainer: {
    flex: 1,
    paddingVertical: 0,
  },
  roundsContentContainer: {
    paddingBottom: 16,
  },
  roundOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(128,128,128,0.1)",
    position: "relative",
  },
  roundOptionText: {
    fontSize: 18,
    textAlign: "center",
  },
  checkIcon: {
    position: "absolute",
    right: 20,
  },
  modalFooter: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(128,128,128,0.2)",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
    backgroundColor: "rgba(128,128,128,0.1)",
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#666",
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
    borderRadius: 8,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "white",
  },
});

