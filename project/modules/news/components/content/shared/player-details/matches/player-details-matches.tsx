/**
 * Player Details - Matches Tab
 * Displays player match history with league filtering
 * Matches Chinese app design with proper layout and API integration
 */

import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { teamDetailsApi } from "@/services/teamDetailsApiService";
import { ApiSportsService } from "@/services/api-sports-service";

const { width: screenWidth } = Dimensions.get("window");

// Initialize API service instance
const apiSportsService = new ApiSportsService({
  apiKey: process.env.EXPO_PUBLIC_API_FOOTBALL_KEY || "",
});

interface PlayerMatch {
  id: string;
  fixtureId: number;
  date: string;
  time: string;
  competition: string;
  competitionShort: string;
  round: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamLogo: string;
  awayTeamLogo: string;
  homeScore: number | null;
  awayScore: number | null;
  playerGoals: number;
  playerRating: number;
  playerTeamId: number;
  isHome: boolean;
}

interface Competition {
  id: string;
  name: string;
  shortName: string;
  matchCount: number;
}

interface PlayerDetailsMatchesProps {
  matches: any[];
  theme: any;
  playerColors: {
    primary: string;
    secondary: string;
  };
  playerId: string;
  playerTeamId?: number;
  loading?: boolean;
  sport?: string; // ✅ Sport parameter (basketball/football)
}

export default function PlayerDetailsMatches({
  matches: propMatches,
  theme,
  playerColors,
  playerId,
  playerTeamId,
  loading = false,
  sport = "football", // ✅ Default to football
}: PlayerDetailsMatchesProps) {
  const isBasketball = sport === "basketball";
  console.log(`🏀⚽ [PlayerDetailsMatches] Sport: ${sport}, isBasketball: ${isBasketball}`);
  const [allMatches, setAllMatches] = useState<PlayerMatch[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [selectedCompetition, setSelectedCompetition] = useState<string>("all");
  const tabScrollRef = useRef<ScrollView>(null);
  const tabPositionsRef = useRef<{ [key: string]: number }>({});
  const isManualScrolling = useRef(false);
  const isDarkMode = theme.colors.background === "#2A2A2A";

  // Fetch player matches from API
  useEffect(() => {
    const fetchPlayerMatches = async () => {
      if (!playerId || propMatches?.length > 0) {
        // If matches are provided as prop, use them
        if (propMatches && propMatches.length > 0) {
          processMatches(propMatches);
        }
        return;
      }

      try {
        const numericPlayerId = parseInt(playerId);
        if (isNaN(numericPlayerId)) {
          return;
        }

        // Fetch player fixtures from API
        // Note: API-Football doesn't have direct player fixtures endpoint
        // We'll need to fetch team fixtures and filter by player participation
        // For now, we'll use the matches prop if available
        
        // If we have playerTeamId, fetch team fixtures and filter
        if (playerTeamId) {
          // Fetch both recent and upcoming matches to get all competitions
          const [recentFixtures, upcomingFixtures] = await Promise.all([
            teamDetailsApi.getRecentMatches(playerTeamId, 50, sport), // ✅ CRITICAL: Pass sport
            teamDetailsApi.getUpcomingMatches(playerTeamId, 50, sport).catch(() => []), // ✅ CRITICAL: Pass sport - Fallback to empty array if not available
          ]);
          
          // Combine recent and upcoming fixtures
          const allFixtures = [...recentFixtures, ...upcomingFixtures];
          
          // Fetch player stats for each fixture to check participation
          const playerMatches: PlayerMatch[] = [];
          
          // Process more fixtures to ensure we capture all competitions (increased from 20 to 50)
          for (const fixture of allFixtures.slice(0, 50)) {
            try {
              // Get fixture details first to check if match is upcoming
              const fixtureDetails = await apiSportsService.getFixtureById(fixture.id);
              const fixtureData = fixtureDetails?.response?.[0];
              
              if (!fixtureData) continue;
              
              const matchDate = new Date(fixtureData.fixture.date);
              const isUpcoming = matchDate > new Date();
              
              // For upcoming matches, include them even without player stats (player will participate)
              // For past matches, check if player actually participated
              if (isUpcoming) {
                // Include upcoming match - player is expected to participate
                const isHome = fixtureData.teams.home.id === playerTeamId;
                playerMatches.push({
                  id: fixture.id.toString(),
                  fixtureId: fixture.id,
                  date: formatDate(fixtureData.fixture.date),
                  time: formatTime(fixtureData.fixture.date),
                  competition: fixtureData.league.name,
                  competitionShort: getCompetitionShortName(fixtureData.league.name),
                  round: extractRound(fixtureData.league.round),
                  homeTeam: fixtureData.teams.home.name,
                  awayTeam: fixtureData.teams.away.name,
                  homeTeamLogo: fixtureData.teams.home.logo,
                  awayTeamLogo: fixtureData.teams.away.logo,
                  homeScore: null, // Upcoming match, no score yet
                  awayScore: null,
                  playerGoals: 0, // Upcoming match, no goals yet
                  playerRating: 0, // Upcoming match, no rating yet
                  playerTeamId: playerTeamId || 0,
                  isHome: isHome,
                });
              } else {
                // For past matches, check player participation via stats
                const playerStats = await apiSportsService.getMatchPlayerStats(fixture.id);
                
                if (playerStats?.response) {
                  // Check if player participated in this match
                  const homePlayers = playerStats.response[0]?.players || [];
                  const awayPlayers = playerStats.response[1]?.players || [];
                  const allPlayers = [...homePlayers, ...awayPlayers];
                  
                  const playerData = allPlayers.find((p: any) => p.player.id === numericPlayerId);
                  
                  if (playerData) {
                    const isHome = homePlayers.some((p: any) => p.player.id === numericPlayerId);
                    // Extract goals from multiple possible locations in API response
                    const goals = playerData.statistics?.[0]?.goals?.total || 
                                 playerData.statistics?.[0]?.goals || 
                                 playerData.goals?.total ||
                                 playerData.goals ||
                                 0;
                    const rating = parseFloat(playerData.statistics?.[0]?.games?.rating || "0");
                    
                    // Debug: Log goals for verification
                    if (goals > 0) {
                      console.log(`⚽ [PlayerMatches] Player ${numericPlayerId} scored ${goals} goal(s) in fixture ${fixture.id}`);
                    }
                    
                    playerMatches.push({
                      id: fixture.id.toString(),
                      fixtureId: fixture.id,
                      date: formatDate(fixtureData.fixture.date),
                      time: formatTime(fixtureData.fixture.date),
                      competition: fixtureData.league.name,
                      competitionShort: getCompetitionShortName(fixtureData.league.name),
                      round: extractRound(fixtureData.league.round),
                      homeTeam: fixtureData.teams.home.name,
                      awayTeam: fixtureData.teams.away.name,
                      homeTeamLogo: fixtureData.teams.home.logo,
                      awayTeamLogo: fixtureData.teams.away.logo,
                      homeScore: fixtureData.goals.home,
                      awayScore: fixtureData.goals.away,
                      playerGoals: goals,
                      playerRating: rating,
                      playerTeamId: playerTeamId || 0,
                      isHome: isHome,
                    });
                  }
                }
              }
            } catch (error) {
              console.warn(`Failed to process fixture ${fixture.id}:`, error);
            }
          }
          
          processMatches(playerMatches);
        } else {
          // Fallback: process prop matches if available
          if (propMatches && propMatches.length > 0) {
            processMatches(propMatches);
          }
        }
      } catch (error) {
        console.error("Error fetching player matches:", error);
      }
    };

    fetchPlayerMatches();
  }, [playerId, playerTeamId, propMatches]);

  const processMatches = (matchesData: any[]) => {
    // Transform matches to PlayerMatch format
    const processedMatches: PlayerMatch[] = matchesData.map((match: any) => {
      // Handle different match data formats
      if (match.fixtureId || match.id) {
        return {
          id: match.fixtureId?.toString() || match.id,
          fixtureId: match.fixtureId || parseInt(match.id),
          date: match.date || formatDate(match.fixture?.date),
          time: match.time || formatTime(match.fixture?.date),
          competition: match.competition || match.league?.name || "Unknown",
          competitionShort: match.competitionShort || getCompetitionShortName(match.competition || match.league?.name || ""),
          round: match.round || extractRound(match.league?.round) || "",
          homeTeam: match.homeTeam || match.teams?.home?.name || "",
          awayTeam: match.awayTeam || match.teams?.away?.name || "",
          homeTeamLogo: match.homeTeamLogo || match.teams?.home?.logo || "",
          awayTeamLogo: match.awayTeamLogo || match.teams?.away?.logo || "",
          homeScore: match.homeScore ?? match.goals?.home ?? null,
          awayScore: match.awayScore ?? match.goals?.away ?? null,
          // Extract player goals from multiple possible locations
          playerGoals: match.playerGoals ?? 
                      match.goals?.player ?? 
                      match.playerStats?.goals?.total ??
                      match.statistics?.[0]?.goals?.total ??
                      match.goals ?? 
                      0,
          playerRating: match.playerRating ?? match.rating ?? 0,
          playerTeamId: match.playerTeamId || playerTeamId || 0,
          isHome: match.isHome ?? match.homeAway === "H",
        };
      }
      return null;
    }).filter(Boolean) as PlayerMatch[];

    setAllMatches(processedMatches);

    // Enhanced competition detection - ensures all competitions are captured
    const competitionMap = new Map<string, Competition>();
    
    processedMatches.forEach((match) => {
      // Normalize competition name for consistent detection
      const competitionName = match.competition || "Unknown";
      const normalizedName = competitionName.trim();
      
      // Create a more robust competition ID that handles variations
      const compId = normalizedName
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "") // Remove special characters
        .replace(/-+/g, "-") // Replace multiple hyphens with single
        .replace(/^-|-$/g, ""); // Remove leading/trailing hyphens
      
      // Use existing competition if ID matches, or create new one
      if (!competitionMap.has(compId)) {
        competitionMap.set(compId, {
          id: compId,
          name: normalizedName,
          shortName: match.competitionShort || getCompetitionShortName(normalizedName),
          matchCount: 0,
        });
      }
      const comp = competitionMap.get(compId)!;
      comp.matchCount++;
    });

    // Sort competitions by match count (most matches first), then alphabetically
    const sortedCompetitions = Array.from(competitionMap.values()).sort((a, b) => {
      if (b.matchCount !== a.matchCount) {
        return b.matchCount - a.matchCount;
      }
      return a.name.localeCompare(b.name);
    });

    const comps: Competition[] = [
      { id: "all", name: "All", shortName: "All", matchCount: processedMatches.length },
      ...sortedCompetitions,
    ];

    // Debug: Log detected competitions
    console.log(`🏆 [PlayerMatches] Detected ${comps.length - 1} competitions:`, 
      sortedCompetitions.map(c => `${c.name} (${c.matchCount} matches)`).join(", "));

    setCompetitions(comps);
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const year = date.getFullYear().toString().slice(-2);
    return `${year}/${month}/${day}`;
  };

  const formatTime = (dateString?: string): string => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  const extractRound = (roundString?: string): string => {
    if (!roundString) return "";
    // Extract round number (e.g., "Regular Season - 11" -> "Round 11")
    const match = roundString.match(/\d+/);
    if (match) {
      return `Round ${match[0]}`;
    }
    return roundString;
  };

  const getCompetitionShortName = (competitionName: string): string => {
    const name = competitionName.toLowerCase();
    if (name.includes("premier league")) return "Premier League";
    if (name.includes("champions league")) return "UCL";
    if (name.includes("europa league")) return "UEL";
    if (name.includes("la liga")) return "La Liga";
    if (name.includes("serie a")) return "Serie A";
    if (name.includes("bundesliga")) return "Bundesliga";
    if (name.includes("league cup")) return "League Cup";
    if (name.includes("fa cup")) return "FA Cup";
    if (name.includes("friendlies") || name.includes("friendly")) return "Friendlies";
    return competitionName.length > 15 ? competitionName.substring(0, 15) + "..." : competitionName;
  };

  const getRatingColor = (rating: number): string => {
    if (rating >= 9.0) return "#FF3B30"; // Red - Excellent
    if (rating >= 8.0) return "#FF9800"; // Orange - Very Good
    if (rating >= 7.0) return "#4CAF50"; // Green - Good
    if (rating >= 6.0) return "#9E9E9E"; // Grey - Average
    return "#9E9E9E"; // Grey - Poor
  };

  const filteredMatches =
    selectedCompetition === "all"
      ? allMatches
      : allMatches.filter((match) => {
          const compId = match.competition.toLowerCase().replace(/\s+/g, "-");
          return compId === selectedCompetition;
        });

  // Auto-scroll to selected tab
  const scrollToTab = (compId: string) => {
    const tabPosition = tabPositionsRef.current[compId];
    if (tabPosition !== undefined && tabScrollRef.current && !isManualScrolling.current) {
      // Calculate the center position for the tab
      const scrollToPosition = Math.max(0, tabPosition - screenWidth / 2 + 50);
      
      tabScrollRef.current.scrollTo({
        x: scrollToPosition,
        y: 0,
        animated: true,
      });
    }
  };

  // Trigger auto-scroll when selected competition changes
  useEffect(() => {
    if (selectedCompetition && competitions.length > 0) {
      // Small delay to ensure layout is complete
      const timer = setTimeout(() => {
        scrollToTab(selectedCompetition);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [selectedCompetition, competitions.length]);

  const handleCompetitionSelect = (compId: string) => {
    setSelectedCompetition(compId);
  };

  const handleScrollBeginDrag = () => {
    isManualScrolling.current = true;
  };

  const handleScrollEndDrag = () => {
    // Reset manual scrolling flag after a delay
    setTimeout(() => {
      isManualScrolling.current = false;
    }, 500);
  };

  if (allMatches.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
          No recent matches available
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Competition Tabs */}
      {competitions.length > 0 && (
        <View style={styles.tabsContainer}>
          <ScrollView
            ref={tabScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsContent}
            bounces={true}
            scrollEventThrottle={16}
            onScrollBeginDrag={handleScrollBeginDrag}
            onScrollEndDrag={handleScrollEndDrag}
          >
            <TouchableOpacity
              style={[
                styles.tab,
                {
                  backgroundColor:
                    selectedCompetition === "all"
                      ? `${playerColors.primary}20`
                      : isDarkMode
                      ? "rgba(255, 255, 255, 0.05)"
                      : "rgba(0, 0, 0, 0.03)",
                  borderColor: selectedCompetition === "all" ? playerColors.primary : "transparent",
                  borderWidth: selectedCompetition === "all" ? 2 : 0,
                },
              ]}
              onPress={() => handleCompetitionSelect("all")}
              onLayout={(event) => {
                const { x } = event.nativeEvent.layout;
                tabPositionsRef.current["all"] = x;
              }}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color:
                      selectedCompetition === "all"
                        ? playerColors.primary
                        : isDarkMode
                        ? "#FFFFFF"
                        : "#333333",
                    fontWeight: selectedCompetition === "all" ? "700" : "500",
                  },
                ]}
              >
                All
              </Text>
            </TouchableOpacity>
            {competitions.filter(c => c.id !== "all").map((comp) => (
              <TouchableOpacity
                key={comp.id}
                style={[
                  styles.tab,
                  {
                    backgroundColor:
                      selectedCompetition === comp.id
                        ? `${playerColors.primary}20`
                        : isDarkMode
                        ? "rgba(255, 255, 255, 0.05)"
                        : "rgba(0, 0, 0, 0.03)",
                    borderColor: selectedCompetition === comp.id ? playerColors.primary : "transparent",
                    borderWidth: selectedCompetition === comp.id ? 2 : 0,
                  },
                ]}
                onPress={() => handleCompetitionSelect(comp.id)}
                onLayout={(event) => {
                  const { x } = event.nativeEvent.layout;
                  tabPositionsRef.current[comp.id] = x;
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.tabText,
                    {
                      color:
                        selectedCompetition === comp.id
                          ? playerColors.primary
                          : isDarkMode
                          ? "#FFFFFF"
                          : "#333333",
                      fontWeight: selectedCompetition === comp.id ? "700" : "500",
                    },
                  ]}
                  numberOfLines={1}
                >
                  {comp.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Matches List */}
      <ScrollView
        style={styles.matchesList}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.matchesContent}
      >
        {filteredMatches.map((match) => (
          <View
            key={match.id}
            style={[
              styles.matchItem,
              {
                borderBottomColor: isDarkMode
                  ? "rgba(255, 255, 255, 0.1)"
                  : "rgba(0, 0, 0, 0.1)",
              },
            ]}
          >
            {/* Left Section: League, Round, Date, Time */}
            <View style={styles.leftSection}>
              <Text style={[styles.competitionText, { color: theme.colors.text }]}>
                {match.competition} {match.round}
              </Text>
              <Text style={[styles.dateText, { color: theme.colors.textSecondary }]}>
                {match.date}
              </Text>
              <Text style={[styles.timeText, { color: theme.colors.textSecondary }]}>
                {match.time}
              </Text>
            </View>

            {/* Middle Section: Teams with Logos */}
            <View style={styles.middleSection}>
              <View style={styles.teamRow}>
                {match.homeTeamLogo ? (
                  <Image
                    source={{ uri: match.homeTeamLogo }}
                    style={styles.teamLogo}
                  />
                ) : (
                  <View style={[styles.teamLogo, { backgroundColor: theme.colors.textSecondary + "20" }]} />
                )}
                <Text
                  style={[styles.teamName, { color: theme.colors.text }]}
                  numberOfLines={1}
                >
                  {match.homeTeam}
                </Text>
              </View>
              <View style={styles.teamRow}>
                {match.awayTeamLogo ? (
                  <Image
                    source={{ uri: match.awayTeamLogo }}
                    style={styles.teamLogo}
                  />
                ) : (
                  <View style={[styles.teamLogo, { backgroundColor: theme.colors.textSecondary + "20" }]} />
                )}
                <Text
                  style={[styles.teamName, { color: theme.colors.text }]}
                  numberOfLines={1}
                >
                  {match.awayTeam}
                </Text>
              </View>
            </View>

            {/* Right Section: Scores, Rating, and Goal Icon */}
            <View style={styles.rightSection}>
              {/* Scores and Rating Row */}
              <View style={styles.scoresRatingRow}>
                {/* Scores Column */}
                <View style={styles.scoresColumn}>
                  <Text style={[styles.scoreText, { color: theme.colors.text }]}>
                    {match.homeScore !== null ? match.homeScore : "-"}
                  </Text>
                  <Text style={[styles.scoreText, { color: theme.colors.text }]}>
                    {match.awayScore !== null ? match.awayScore : "-"}
                  </Text>
                </View>
                
                {/* Player Rating - Positioned to the right of scores */}
                {match.playerRating > 0 && (
                  <View
                    style={[
                      styles.ratingBadge,
                      { backgroundColor: getRatingColor(match.playerRating) },
                    ]}
                  >
                    <Text style={styles.ratingText}>
                      {match.playerRating.toFixed(1)}
                    </Text>
                  </View>
                )}
              </View>
              
              {/* Goal Icon - Only show if player scored, positioned under scores */}
              {match.playerGoals > 0 && (
                <View style={styles.goalIconContainer}>
                  {Array.from({ length: match.playerGoals }).map((_, index) => {
                    // Simple positioning: first goal at right, additional goals stack leftward
                    const iconSpacing = 16;
                    const iconStyle: any = {
                      position: "absolute",
                      right: iconSpacing * index, // First goal at right (0), second at -16px, third at -32px, etc.
                    };
                    
                    return (
                      <Text key={index} style={[styles.goalIcon, iconStyle]}>
                        ⚽
                      </Text>
                    );
                  })}
                </View>
              )}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 20,
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 40,
    paddingHorizontal: 16,
  },
  tabsContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingLeft: 16,
    paddingRight: 0,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  tabsContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 8,
    flex: 1,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 60,
    alignItems: "center",
  },
  tabText: {
    fontSize: 14,
    fontFamily: "Inter-Medium",
  },
  matchesList: {
    flex: 1,
  },
  matchesContent: {
    paddingVertical: 8,
  },
  matchItem: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  leftSection: {
    width: 130,
    marginRight: 12,
  },
  competitionText: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
  },
  dateText: {
    fontSize: 12,
    marginBottom: 4,
  },
  timeText: {
    fontSize: 12,
  },
  middleSection: {
    flex: 1,
    justifyContent: "flex-start",
    marginRight: 12,
    paddingTop: 0,
  },
  teamRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    height: 24,
  },
  teamLogo: {
    width: 24,
    height: 24,
    marginRight: 8,
    borderRadius: 12,
  },
  teamName: {
    fontSize: 13,
    fontWeight: "500",
    flex: 1,
  },
  rightSection: {
    width: 100,
    alignItems: "flex-end",
    justifyContent: "flex-start",
    paddingTop: 0,
    position: "relative",
  },
  scoresRatingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
  },
  scoresColumn: {
    alignItems: "flex-end",
    gap: 8,
  },
  scoreText: {
    fontSize: 16,
    fontWeight: "700",
    minWidth: 20,
    textAlign: "right",
    lineHeight: 24,
    height: 24,
  },
  ratingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 40,
    alignItems: "center",
    height: 24,
    justifyContent: "center",
  },
  goalIconContainer: {
    position: "relative",
    width: "100%",
    height: 24,
    marginTop: 8,
    alignItems: "flex-end",
    justifyContent: "flex-start",
    paddingTop: 2,
  },
  goalIcon: {
    fontSize: 16,
    lineHeight: 20,
  },
  ratingText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
});
