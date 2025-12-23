/**
 * Player Details - Stats Tab
 * Displays comprehensive player statistics with competition filtering
 * Matches Chinese app design with proper layout and API integration
 */

import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { ChevronDown } from "lucide-react-native";
import { teamDetailsApi } from "@/services/teamDetailsApiService";
import NewsSeasonsSelector from "@/modules/news/components/shared/news-seasons-selector";

const { width: screenWidth } = Dimensions.get("window");

interface Competition {
  id: string;
  name: string;
  shortName: string;
  season: number;
}

interface PlayerStatistics {
  team: {
    id: number;
    name: string;
    logo: string;
  };
  league: {
    id: number;
    name: string;
    logo: string;
    season: number;
  };
  games: {
    appearences: number;
    lineups?: number;
    minutes: number;
    position: string;
    rating: string;
  };
  goals: {
    total: number;
    assists: number;
  };
  cards: {
    yellow: number;
    red: number;
  };
  passes: {
    total?: number;
    key?: number;
    accuracy: number;
    crosses?: number | {
      total?: number;
      accuracy?: number;
    };
    long?: number | {
      total?: number;
      accuracy?: number;
    };
  };
  shots: {
    total?: number;
    on: number;
  };
  dribbles?: {
    attempts?: number;
    success?: number;
  };
  tackles?: {
    total: number;
  };
  duels?: {
    total: number;
    won?: number;
  };
  fouls?: {
    committed?: number;
    drawn?: number;
  };
  offsides?: number;
  interceptions?: number;
  clearances?: number;
  errors?: number;
}

interface PlayerDetailsStatsProps {
  playerInfo: {
    englishName: string;
    birthDate: string;
    birthPlace: string;
    nationality: string;
    nationalityFlag: string;
    height: number;
    weight: number;
    position: string;
    preferredFoot: string;
    jerseyNumber: number;
    biography: string;
    contract: {
      startDate: string;
      endDate: string;
      salary?: number;
    };
    currentTeam: {
      name: string;
      logo: string;
    };
  };
  theme: any;
  loading?: boolean;
  playerId?: string;
  playerColors?: {
    primary: string;
    secondary: string;
  };
  sport?: string; // ✅ Sport parameter (basketball/football)
}

export default function PlayerDetailsStats({
  playerInfo,
  theme,
  loading = false,
  playerId,
  playerColors,
  sport = "football", // ✅ Default to football
}: PlayerDetailsStatsProps) {
  const isBasketball = sport === "basketball";
  console.log(`🏀⚽ [PlayerDetailsStats] Sport: ${sport}, isBasketball: ${isBasketball}`);
  const [allStatistics, setAllStatistics] = useState<PlayerStatistics[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [selectedCompetition, setSelectedCompetition] = useState<string>("all");
  const [selectedSeason, setSelectedSeason] = useState<string>("");
  const [showSeasonModal, setShowSeasonModal] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const tabScrollRef = useRef<ScrollView>(null);
  const tabPositionsRef = useRef<{ [key: string]: number }>({});
  const isManualScrolling = useRef(false);
  const isDarkMode = theme.colors.background === "#2A2A2A";

  // Fetch player statistics from API
  useEffect(() => {
    const fetchPlayerStatistics = async () => {
      if (!playerId) return;

      setIsLoadingStats(true);
      try {
        const numericPlayerId = parseInt(playerId);
        if (isNaN(numericPlayerId)) {
          setIsLoadingStats(false);
          return;
        }

        // Parse selected season (format: "2024-2025" or "24-25")
        let seasonYear: number | undefined;
        if (selectedSeason) {
          const seasonMatch = selectedSeason.match(/(\d{2,4})/);
          if (seasonMatch) {
            const year = parseInt(seasonMatch[1]);
            seasonYear = year > 2000 ? year : 2000 + year;
          }
        }

        // Fetch stats for selected season, or current season if none selected
        const targetSeason = seasonYear || new Date().getFullYear();
        const currentStats = await teamDetailsApi.getPlayerDetails(numericPlayerId, targetSeason, sport); // ✅ CRITICAL: Pass sport
        
        // Also fetch previous season stats to populate competition list
        const prevSeason = targetSeason - 1;
        const prevStats = await teamDetailsApi.getPlayerDetails(numericPlayerId, prevSeason, sport); // ✅ CRITICAL: Pass sport

        const allStats: PlayerStatistics[] = [];
        
        if (currentStats?.statistics) {
          allStats.push(...currentStats.statistics);
        }
        
        if (prevStats?.statistics) {
          // Only add if not already present (avoid duplicates)
          prevStats.statistics.forEach((stat: PlayerStatistics) => {
            const exists = allStats.some(
              (s) => s.league.id === stat.league.id && s.league.season === stat.league.season
            );
            if (!exists) {
              allStats.push(stat);
            }
          });
        }

        setAllStatistics(allStats);

        // Extract unique competitions - use full league names
        const compMap = new Map<string, Competition>();
        allStats.forEach((stat) => {
          const key = `${stat.league.id}-${stat.league.season}`;
          if (!compMap.has(key)) {
            compMap.set(key, {
              id: key,
              name: stat.league.name, // Use full name, not short name
              shortName: stat.league.name, // Use full name for display
              season: stat.league.season,
            });
          }
        });

        const comps = Array.from(compMap.values()).sort((a, b) => {
          // Sort by season (newest first), then by name
          if (b.season !== a.season) return b.season - a.season;
          return a.name.localeCompare(b.name);
        });

        setCompetitions(comps);
        
        // Set default season to most recent if not already set
        if (!selectedSeason && comps.length > 0) {
          const mostRecentSeason = comps[0].season;
          setSelectedSeason(`${mostRecentSeason}-${mostRecentSeason + 1}`);
        }
      } catch (error) {
        console.error("Error fetching player statistics:", error);
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchPlayerStatistics();
  }, [playerId, selectedSeason]);

  // Filter statistics by selected competition and season
  const getFilteredStatistics = (): PlayerStatistics | null => {
    // First filter by season if selected
    let filteredBySeason = allStatistics;
    if (selectedSeason) {
      const seasonMatch = selectedSeason.match(/(\d{2,4})/);
      if (seasonMatch) {
        const year = parseInt(seasonMatch[1]);
        const seasonYear = year > 2000 ? year : 2000 + year;
        filteredBySeason = allStatistics.filter(
          (stat) => stat.league.season === seasonYear
        );
      }
    }

    if (selectedCompetition === "all") {
      // Return aggregated stats from filtered competitions
      if (filteredBySeason.length === 0) return null;
      
      // Aggregate stats from all competitions
      const aggregated: PlayerStatistics = {
        team: filteredBySeason[0].team,
        league: filteredBySeason[0].league,
        games: {
          appearences: filteredBySeason.reduce((sum, s) => sum + (s.games.appearences || 0), 0),
          lineups: filteredBySeason.reduce((sum, s) => sum + (s.games.lineups || 0), 0),
          minutes: filteredBySeason.reduce((sum, s) => sum + (s.games.minutes || 0), 0),
          position: filteredBySeason[0].games.position,
          rating: filteredBySeason.length > 0 
            ? (filteredBySeason.reduce((sum, s) => sum + parseFloat(s.games.rating || "0"), 0) / filteredBySeason.length).toFixed(2)
            : "0",
        },
        goals: {
          total: filteredBySeason.reduce((sum, s) => sum + (s.goals.total || 0), 0),
          assists: filteredBySeason.reduce((sum, s) => sum + (s.goals.assists || 0), 0),
        },
        cards: {
          yellow: filteredBySeason.reduce((sum, s) => sum + (s.cards.yellow || 0), 0),
          red: filteredBySeason.reduce((sum, s) => sum + (s.cards.red || 0), 0),
        },
        passes: {
          total: filteredBySeason.reduce((sum, s) => sum + (s.passes.total || 0), 0),
          key: filteredBySeason.reduce((sum, s) => sum + (s.passes.key || 0), 0),
          accuracy: filteredBySeason.length > 0
            ? filteredBySeason.reduce((sum, s) => sum + (s.passes.accuracy || 0), 0) / filteredBySeason.length
            : 0,
          long: {
            total: filteredBySeason.reduce((sum, s) => {
              if (s.passes.long) {
                return sum + (typeof s.passes.long === 'number' ? s.passes.long : (s.passes.long.total || 0));
              }
              return sum;
            }, 0),
            accuracy: 0,
          },
          crosses: {
            total: filteredBySeason.reduce((sum, s) => {
              if (s.passes.crosses) {
                return sum + (typeof s.passes.crosses === 'number' ? s.passes.crosses : (s.passes.crosses.total || 0));
              }
              return sum;
            }, 0),
            accuracy: 0,
          },
        },
        shots: {
          total: filteredBySeason.reduce((sum, s) => sum + (s.shots.total || 0), 0),
          on: filteredBySeason.reduce((sum, s) => sum + (s.shots.on || 0), 0),
        },
        dribbles: {
          attempts: filteredBySeason.reduce((sum, s) => sum + (s.dribbles?.attempts || 0), 0),
          success: filteredBySeason.reduce((sum, s) => sum + (s.dribbles?.success || 0), 0),
        },
        tackles: {
          total: filteredBySeason.reduce((sum, s) => sum + (s.tackles?.total || 0), 0),
        },
        duels: {
          total: filteredBySeason.reduce((sum, s) => sum + (s.duels?.total || 0), 0),
          won: filteredBySeason.reduce((sum, s) => sum + (s.duels?.won || 0), 0),
        },
        fouls: {
          committed: filteredBySeason.reduce((sum, s) => sum + (s.fouls?.committed || 0), 0),
          drawn: filteredBySeason.reduce((sum, s) => sum + (s.fouls?.drawn || 0), 0),
        },
        offsides: filteredBySeason.reduce((sum, s) => sum + (s.offsides || 0), 0),
        interceptions: filteredBySeason.reduce((sum, s) => sum + (s.interceptions || 0), 0),
        clearances: filteredBySeason.reduce((sum, s) => sum + (s.clearances || 0), 0),
        errors: filteredBySeason.reduce((sum, s) => sum + (s.errors || 0), 0),
      };
      
      return aggregated;
    }

    return filteredBySeason.find((stat) => {
      const key = `${stat.league.id}-${stat.league.season}`;
      return key === selectedCompetition;
    }) || null;
  };


  const currentStats = getFilteredStatistics();

  // Calculate averages
  const appearances = currentStats?.games.appearences || 0;
  const starts = currentStats?.games.lineups || 0;
  const goals = currentStats?.goals.total || 0;
  const assists = currentStats?.goals.assists || 0;
  const minutes = currentStats?.games.minutes || 0;
  const avgGoals = appearances > 0 ? (goals / appearances).toFixed(1) : "0.0";
  const avgAssists = appearances > 0 ? (assists / appearances).toFixed(1) : "0.0";
  const avgMinutes = appearances > 0 ? (minutes / appearances).toFixed(1) : "0.0";

  // Offense stats
  const shotsTotal = currentStats?.shots.total || 0;
  const shotsOnTarget = currentStats?.shots.on || 0;
  const avgShots = appearances > 0 ? (shotsTotal / appearances).toFixed(1) : "0.0";
  const avgShotsOnTarget = appearances > 0 ? (shotsOnTarget / appearances).toFixed(1) : "0.0";
  const dribblesAttempts = currentStats?.dribbles?.attempts || 0;
  const dribblesSuccess = currentStats?.dribbles?.success || 0;
  const dribblesSuccessRate = dribblesAttempts > 0 
    ? ((dribblesSuccess / dribblesAttempts) * 100).toFixed(1) 
    : "0.0";
  const duelsTotal = currentStats?.duels?.total || 0;
  const duelsWon = currentStats?.duels?.won || 0;
  const duelsSuccessRate = duelsTotal > 0 
    ? ((duelsWon / duelsTotal) * 100).toFixed(1) 
    : "0.0";
  const offsides = currentStats?.offsides || 0;
  const timePerGoal = goals > 0 ? (minutes / goals).toFixed(1) : "0.0";

  // Passing stats
  const keyPasses = currentStats?.passes.key || 0;
  const passesTotal = currentStats?.passes.total || 0;
  const passesAccuracy = currentStats?.passes.accuracy || 0;
  const avgKeyPasses = appearances > 0 ? (keyPasses / appearances).toFixed(1) : "0.0";
  const avgPasses = appearances > 0 ? (passesTotal / appearances).toFixed(1) : "0.0";
  
  // Handle long passes - could be number or object
  let longPassesTotal = 0;
  let longPassesAccuracy = 0;
  if (currentStats?.passes.long) {
    if (typeof currentStats.passes.long === 'number') {
      longPassesTotal = currentStats.passes.long;
    } else {
      longPassesTotal = currentStats.passes.long.total || 0;
      longPassesAccuracy = currentStats.passes.long.accuracy || 0;
    }
  }
  const avgLongPasses = appearances > 0 ? (longPassesTotal / appearances).toFixed(1) : "0.0";
  
  // Handle crosses - could be number or object
  let crossesTotal = 0;
  let crossesAccuracy = 0;
  if (currentStats?.passes.crosses) {
    if (typeof currentStats.passes.crosses === 'number') {
      crossesTotal = currentStats.passes.crosses;
    } else {
      crossesTotal = currentStats.passes.crosses.total || 0;
      crossesAccuracy = currentStats.passes.crosses.accuracy || 0;
    }
  }
  const avgCrosses = appearances > 0 ? (crossesTotal / appearances).toFixed(1) : "0.0";

  // Defense stats
  const tackles = currentStats?.tackles?.total || 0;
  const interceptions = currentStats?.interceptions || 0;
  const clearances = currentStats?.clearances || 0;
  const avgTackles = appearances > 0 ? (tackles / appearances).toFixed(1) : "0.0";
  const avgInterceptions = appearances > 0 ? (interceptions / appearances).toFixed(1) : "0.0";
  const avgClearances = appearances > 0 ? (clearances / appearances).toFixed(1) : "0.0";

  // Other stats
  const yellowCards = currentStats?.cards.yellow || 0;
  const redCards = currentStats?.cards.red || 0;
  const foulsCommitted = currentStats?.fouls?.committed || 0;
  const foulsDrawn = currentStats?.fouls?.drawn || 0;
  const errors = currentStats?.errors || 0;
  const avgFouls = appearances > 0 ? (foulsCommitted / appearances).toFixed(1) : "0.0";
  const avgFoulsDrawn = appearances > 0 ? (foulsDrawn / appearances).toFixed(1) : "0.0";
  const avgErrors = appearances > 0 ? (errors / appearances).toFixed(1) : "0.0";

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

  const handleSeasonChange = (season: string) => {
    setSelectedSeason(season);
    setShowSeasonModal(false);
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

  const StatRow = ({ label, value }: { label: string; value: string }) => (
    <View
      style={[
        styles.statRow,
        {
          borderBottomColor: isDarkMode
            ? "rgba(255, 255, 255, 0.1)"
            : "rgba(0, 0, 0, 0.1)",
        },
      ]}
    >
      <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
        {label}
      </Text>
      <Text style={[styles.statValue, { color: theme.colors.text }]}>
        {value}
      </Text>
    </View>
  );

  const StatSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          {title}
        </Text>
      </View>
      <View
        style={[
          styles.sectionContent,
          {
            backgroundColor: isDarkMode
              ? "rgba(255, 255, 255, 0.02)"
              : "rgba(0, 0, 0, 0.01)",
          },
        ]}
      >
        {children}
      </View>
      <View
        style={[
          styles.sectionSeparator,
          {
            backgroundColor: isDarkMode
              ? "rgba(255, 255, 255, 0.1)"
              : "rgba(0, 0, 0, 0.1)",
          },
        ]}
      />
    </View>
  );

  if (loading || isLoadingStats) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.text} />
      </View>
    );
  }

  if (!currentStats) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
          No statistics available
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Competition Filter Tabs */}
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
                      ? "rgba(255, 59, 48, 0.2)"
                      : isDarkMode
                      ? "rgba(255, 255, 255, 0.05)"
                      : "rgba(0, 0, 0, 0.03)",
                  borderColor: selectedCompetition === "all" ? "#FF3B30" : "transparent",
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
                        ? "#FF3B30"
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
            {competitions.map((comp) => (
              <TouchableOpacity
                key={comp.id}
                style={[
                  styles.tab,
                  {
                    backgroundColor:
                      selectedCompetition === comp.id
                        ? "rgba(255, 59, 48, 0.2)"
                        : isDarkMode
                        ? "rgba(255, 255, 255, 0.05)"
                        : "rgba(0, 0, 0, 0.03)",
                    borderColor: selectedCompetition === comp.id ? "#FF3B30" : "transparent",
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
                          ? "#FF3B30"
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
          {selectedSeason && (
            <TouchableOpacity
              style={[
                styles.seasonSelector,
                {
                  backgroundColor: isDarkMode
                    ? "#3A3A3A"
                    : theme.colors.border || "#F5F5F5",
                },
              ]}
              onPress={() => setShowSeasonModal(true)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.seasonText,
                  {
                    color: isDarkMode ? "#B0B0B0" : theme.colors.text,
                  },
                ]}
              >
                {selectedSeason}
              </Text>
              <ChevronDown
                size={16}
                color={isDarkMode ? "#B0B0B0" : theme.colors.text}
              />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Season Selector Modal */}
      {showSeasonModal && (
        <NewsSeasonsSelector
          selectedSeason={selectedSeason}
          onSeasonChange={handleSeasonChange}
          showModal={showSeasonModal}
          setShowModal={setShowSeasonModal}
          primaryColor={playerColors?.primary || "#FF3B30"}
        />
      )}

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Key Statistics Summary */}
        <View style={styles.summarySection}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: theme.colors.text }]}>
                {starts}/{appearances}
              </Text>
              <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
                Appearances/Starts
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: theme.colors.text }]}>
                {goals}/{avgGoals}
              </Text>
              <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
                Goals/Avg
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: theme.colors.text }]}>
                {assists}/{avgAssists}
              </Text>
              <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
                Assists/Avg
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: theme.colors.text }]}>
                {avgMinutes}
              </Text>
              <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
                Avg Time
              </Text>
            </View>
          </View>
        </View>

        {/* Offense Section */}
        <StatSection title="Offense">
          <StatRow label="Time/Goal" value={timePerGoal} />
          <StatRow label="Avg Shots" value={avgShots} />
          <StatRow label="Avg Shots on Target" value={avgShotsOnTarget} />
          <StatRow label="Successful Dribbles" value={dribblesSuccess.toFixed(1)} />
          <StatRow label="Dribble Success Rate" value={`${dribblesSuccessRate}%`} />
          <StatRow label="1v1 Success" value={duelsWon.toFixed(1)} />
          <StatRow label="1v1 Success Rate" value={`${duelsSuccessRate}%`} />
          <StatRow label="Offsides" value={offsides.toFixed(1)} />
        </StatSection>

        {/* Passing Section */}
        <StatSection title="Passing">
          <StatRow label="Key Passes" value={avgKeyPasses} />
          <StatRow label="Successful Passes" value={avgPasses} />
          <StatRow label="Pass Success Rate" value={`${passesAccuracy.toFixed(1)}%`} />
          <StatRow label="Successful Long Passes" value={avgLongPasses} />
          <StatRow label="Long Pass Success Rate" value={`${longPassesAccuracy.toFixed(1)}%`} />
          <StatRow label="Successful Crosses" value={avgCrosses} />
          <StatRow label="Cross Success Rate" value={`${crossesAccuracy.toFixed(1)}%`} />
        </StatSection>

        {/* Defense Section */}
        <StatSection title="Defense">
          <StatRow label="Tackles" value={avgTackles} />
          <StatRow label="Interceptions" value={avgInterceptions} />
          <StatRow label="Clearances" value={avgClearances} />
        </StatSection>

        {/* Other Section */}
        <StatSection title="Other">
          <StatRow label="Yellow Cards" value={yellowCards.toString()} />
          <StatRow label="Red Cards" value={redCards.toString()} />
          <StatRow label="Errors" value={avgErrors} />
          <StatRow label="Fouls" value={avgFouls} />
          <StatRow label="Times Fouled" value={avgFoulsDrawn} />
        </StatSection>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  tabsScrollView: {
    flex: 1,
  },
  tabsContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 8,
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
    fontWeight: "500",
  },
  seasonSelector: {
    marginLeft: 8,
    marginRight: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  seasonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  summarySection: {
    marginTop: 16,
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 16,
  },
  summaryItem: {
    alignItems: "center",
    flex: 1,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    textAlign: "center",
  },
  section: {
    marginTop: 0,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  sectionContent: {
    marginHorizontal: 0,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  statLabel: {
    fontSize: 14,
    flex: 1,
  },
  statValue: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "right",
    minWidth: 80,
  },
  sectionSeparator: {
    height: 1,
    marginTop: 8,
    marginHorizontal: 0,
    width: "100%",
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 40,
    paddingHorizontal: 16,
  },
});
