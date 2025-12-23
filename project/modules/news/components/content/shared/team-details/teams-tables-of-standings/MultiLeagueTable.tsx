/**
 * Multi-League Table Component
 * 
 * Displays multiple competitions/leagues that a team participates in
 * with horizontal tabs for easy switching between competitions.
 * 
 * Features:
 * - Fetches ALL leagues/competitions for a team
 * - Horizontal scrollable tabs (like Chinese app)
 * - Dynamic standings for each competition
 * - Handles cups, league, FIFA, UEFA, AFC, etc.
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
  Image,
} from "react-native";
import {
  fetchTeamLeagues,
  fetchLeagueStandings,
  TeamLeague,
  LeagueStandingsResponse,
} from "@/services/leagueStandingsService";
import { teamColorService } from "@/services/teamColorService";
import UniversalLeagueTable from "./UniversalLeagueTable";

interface MultiLeagueTableProps {
  teamId: number;
  teamName: string;
  season?: number;
  currentTeamName: string;
  theme: any;
  teamColors: { primary: string; secondary: string };
  isDarkMode: boolean;
}

interface CompetitionTab {
  id: number;
  name: string;
  type: string; // "League" or "Cup"
  logo: string;
  country: string;
}

export default function MultiLeagueTable({
  teamId,
  teamName,
  season,
  currentTeamName,
  theme,
  teamColors,
  isDarkMode,
}: MultiLeagueTableProps) {
  // Helper function to convert hex color to rgba with opacity
  const hexToRgba = (hex: string, opacity: number): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  // Helper function to detect and replace bright yellow with muted yellow (matches Chinese app)
  const getDynamicColor = (primary: string, secondary: string): string => {
    if (!primary) return primary;
    
    // Check if color is bright yellow
    const isYellow = teamColorService.isLightColor(primary) && 
                     (primary.toUpperCase().includes("FFFF") || 
                      primary.toUpperCase().includes("FFD7") ||
                      primary.toUpperCase().includes("FFE5") ||
                      primary.toUpperCase().includes("FDE1"));
    
    if (isYellow) {
      // Use muted golden yellow that matches Chinese app screenshot
      return "#D4AF37"; // Muted golden yellow (matches Chinese app)
    }
    
    return primary;
  };

  // Helper function to get readable text color for team primary color
  // Always uses white text for better contrast on colored backgrounds
  const getReadableTextColor = (teamColor: string): string => {
    return "#FFFFFF";
  };

  // Helper function to get appropriate background color for selected tab
  // Uses dynamic color (with yellow detection) for consistent theming
  const getSelectedTabBackground = (teamColor: string): string => {
    const dynamicColor = getDynamicColor(teamColor, teamColors.secondary);
    const isBright = teamColorService.isLightColor(dynamicColor);
    if (isBright) {
      // For bright colors, darken the color significantly first, then apply higher opacity
      const darkenedColor = teamColorService.getDarkerColor(dynamicColor, 0.5);
      return hexToRgba(darkenedColor, isDarkMode ? 0.6 : 0.55);
    }
    // For dark colors, use standard opacity
    return hexToRgba(dynamicColor, 0.2);
  };

  const [competitions, setCompetitions] = useState<CompetitionTab[]>([]);
  const [selectedCompetition, setSelectedCompetition] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const tabsScrollViewRef = useRef<ScrollView>(null);
  const tabLayouts = useRef<{ [key: number]: { x: number; width: number } }>({});
  const isManualScrolling = useRef(false);
  const { width: screenWidth } = Dimensions.get("window");

  useEffect(() => {
    loadTeamCompetitions();
  }, [teamId]);

  const loadTeamCompetitions = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log(`🏆 [MultiLeague] Fetching all competitions for team ${teamId}...`);
      const startTime = Date.now();

      // Fetch ALL leagues/competitions the team participates in (past, present, future)
      // Set currentOnly = false to get all competitions
      const leagues = await fetchTeamLeagues(teamId, false); // currentOnly = false to get ALL competitions

      const loadTime = Date.now() - startTime;
      console.log(`✅ [MultiLeague] Found ${leagues.length} potential competitions in ${loadTime}ms`);

      if (leagues.length === 0) {
        setError("No competitions found for this team");
        setLoading(false);
        return;
      }

      // CRITICAL: Verify each competition has standings data (in parallel for speed)
      // Also check multiple seasons to find competitions with data
      console.log(`🔍 [MultiLeague] Verifying which competitions have standings data...`);
      const verifyStart = Date.now();
      
      // Get current season and recent seasons to check
      const currentYear = season || new Date().getFullYear();
      const seasonsToCheck = [currentYear, currentYear - 1, currentYear - 2];
      
      const verificationPromises = leagues.map(async (league) => {
        try {
          // Check if this league has any current/active seasons
          const hasCurrentSeason = league.seasons?.some((s: any) => s.current === true);
          const latestSeason = league.seasons?.length > 0 
            ? Math.max(...league.seasons.map((s: any) => s.year))
            : currentYear;
          
          // Try to fetch standings for this competition (check multiple seasons)
          let standings = null;
          for (const checkSeason of seasonsToCheck) {
            try {
              standings = await fetchLeagueStandings(league.league.id, checkSeason, true);
              if (standings && standings.groups && standings.groups.length > 0) {
                break; // Found data, stop checking
              }
            } catch (err) {
              // Try next season
              continue;
            }
          }
          
          // Only include competitions that have actual standings data
          // Don't include competitions without data to avoid errors
          if (standings && standings.groups && standings.groups.length > 0) {
            // Verify the team is actually in this competition's standings
            // standings.groups is an array of StandingsGroup objects
            // Each group has a standings array with TeamStanding objects
            const teamInStandings = standings.groups.some((group) => {
              if (!group.standings || !Array.isArray(group.standings)) return false;
              return group.standings.some((teamStanding) => {
                if (!teamStanding.team) return false;
                // Check by team ID (most reliable)
                if (teamStanding.team.id === teamId) return true;
                // Fallback: check by team name (case-insensitive)
                if (teamName && teamStanding.team.name) {
                  return teamStanding.team.name.toLowerCase().trim() === teamName.toLowerCase().trim();
                }
                return false;
              });
            });
            
            if (teamInStandings) {
              // This competition HAS data AND the team is in it! ✅
              console.log(`✅ [MultiLeague] ${league.league.name} (ID: ${league.league.id}) - HAS DATA and team is in it`);
              console.log(`🖼️ [MultiLeague] Logo URL: ${league.league.logo || 'MISSING'}`);
              return {
                id: league.league.id,
                name: league.league.name,
                type: league.league.type,
                logo: league.league.logo || "",
                country: league.country.name,
              };
            } else {
              // Competition has data but team is not in it - skip it
              console.log(`ℹ️ [MultiLeague] ${league.league.name} (ID: ${league.league.id}) - HAS DATA but team ${teamId} not in standings`);
              return null;
            }
          } else {
            // This competition has NO data - skip it to avoid errors
            console.log(`⚠️ [MultiLeague] ${league.league.name} (ID: ${league.league.id}) - NO DATA, skipping to avoid errors`);
            return null;
          }
        } catch (err) {
          // API error for this competition - skip it silently
          return null;
        }
      });

      // Wait for all verifications to complete
      const results = await Promise.all(verificationPromises);
      
      // Remove duplicates (same league ID)
      const uniqueCompetitions = new Map<number, CompetitionTab>();
      results.forEach((comp) => {
        if (comp && !uniqueCompetitions.has(comp.id)) {
          uniqueCompetitions.set(comp.id, comp);
        }
      });
      
      const validCompetitions = Array.from(uniqueCompetitions.values());
      
      // Sort competitions: current/active first, then by name
      validCompetitions.sort((a, b) => {
        const aIsActive = leagues.find(l => l.league.id === a.id)?.seasons?.some((s: any) => s.current === true) || false;
        const bIsActive = leagues.find(l => l.league.id === b.id)?.seasons?.some((s: any) => s.current === true) || false;
        
        if (aIsActive && !bIsActive) return -1;
        if (!aIsActive && bIsActive) return 1;
        return a.name.localeCompare(b.name);
      });
      
      const verifyTime = Date.now() - verifyStart;
      console.log(`📊 [MultiLeague] ${validCompetitions.length} of ${leagues.length} competitions verified (${verifyTime}ms)`);
      console.log(`📊 [MultiLeague] Competitions:`, validCompetitions.map(c => `${c.name} (${c.type})`).join(", "));
      validCompetitions.forEach(c => {
        console.log(`🖼️ [MultiLeague] Competition "${c.name}" - Logo: ${c.logo || 'MISSING'}`);
      });

      if (validCompetitions.length === 0) {
        setError("No competition standings available for this team");
        setLoading(false);
        return;
      }

      setCompetitions(validCompetitions);
      
      // Select first valid competition by default
      if (validCompetitions.length > 0) {
        setSelectedCompetition(validCompetitions[0].id);
        console.log(`📊 [MultiLeague] Auto-selected: ${validCompetitions[0].name}`);
      }

      setLoading(false);
    } catch (err) {
      console.error("❌ [MultiLeague] Error loading competitions:", err);
      setError("Failed to load competitions");
      setLoading(false);
    }
  };

  // Smooth auto-scroll to selected tab
  const scrollToTab = (competitionId: number) => {
    const layout = tabLayouts.current[competitionId];
    if (layout && tabsScrollViewRef.current && !isManualScrolling.current) {
      // Calculate the center position for the tab
      const containerPadding = 16;
      const tabCenter = layout.x + layout.width / 2;
      // Calculate scroll position to center the tab in visible area
      const scrollToPosition = Math.max(0, tabCenter + containerPadding - screenWidth / 2);
      
      tabsScrollViewRef.current.scrollTo({
        x: scrollToPosition,
        y: 0,
        animated: true,
      });
    }
  };

  // Trigger auto-scroll when selected competition changes
  useEffect(() => {
    if (selectedCompetition && competitions.length > 2) {
      // Small delay to ensure layout is complete
      const timer = setTimeout(() => {
        scrollToTab(selectedCompetition);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [selectedCompetition, competitions.length]);

  const handleTabPress = (competitionId: number, index: number) => {
    const competition = competitions.find(c => c.id === competitionId);
    console.log(`🔄 [MultiLeague] Switching to: ${competition?.name} (ID: ${competitionId})`);
    setSelectedCompetition(competitionId);
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

  // Loading state
  if (loading) {
    const dynamicColor = getDynamicColor(teamColors.primary, teamColors.secondary);
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={dynamicColor} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Loading competitions...
          </Text>
        </View>
      </View>
    );
  }

  // Error state
  if (error || competitions.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.colors.textSecondary }]}>
            {error || "No competitions found"}
          </Text>
          <Text style={[styles.errorSubtext, { color: theme.colors.textSecondary }]}>
            This team may not have any active competitions this season
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Horizontal Competition Tabs */}
      <ScrollView
        ref={tabsScrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsScrollView}
        contentContainerStyle={styles.tabsContainer}
        scrollEnabled={true} // Always enable manual scrolling
        bounces={true}
        scrollEventThrottle={16}
        onScrollBeginDrag={handleScrollBeginDrag}
        onScrollEndDrag={handleScrollEndDrag}
      >
        {competitions.map((competition, index) => {
          const dynamicColor = getDynamicColor(teamColors.primary, teamColors.secondary);
          return (
            <TouchableOpacity
              key={competition.id}
              onLayout={(event) => {
                const { x, width } = event.nativeEvent.layout;
                tabLayouts.current[competition.id] = { x, width };
              }}
              style={[
                styles.competitionTab,
                {
                  backgroundColor:
                    selectedCompetition === competition.id
                      ? getSelectedTabBackground(teamColors.primary)
                      : theme.colors.backgroundSecondary,
                  borderColor:
                    selectedCompetition === competition.id
                      ? dynamicColor
                      : "transparent",
                },
              ]}
              onPress={() => handleTabPress(competition.id, index)}
              activeOpacity={0.7}
            >
              {competition.logo ? (
                <Image
                  source={{ uri: competition.logo }}
                  style={styles.competitionLogo}
                  resizeMode="contain"
                  onError={(error) => {
                    console.warn(`❌ [MultiLeague] Failed to load logo for ${competition.name}:`, error);
                  }}
                  onLoad={() => {
                    console.log(`✅ [MultiLeague] Logo loaded successfully for ${competition.name}`);
                  }}
                />
              ) : null}
              <Text
                style={[
                  styles.tabText,
                  {
                    color:
                      selectedCompetition === competition.id
                        ? getReadableTextColor(dynamicColor)
                        : theme.colors.text,
                    fontWeight: selectedCompetition === competition.id ? "700" : "500",
                  },
                ]}
                numberOfLines={1}
              >
                {competition.name}
              </Text>
              {competition.type === "Cup" && (
                <View
                  style={[
                    styles.typeBadge,
                    {
                      backgroundColor:
                        selectedCompetition === competition.id
                          ? dynamicColor
                          : theme.colors.backgroundTertiary || "#444",
                    },
                  ]}
                >
                  <Text style={styles.typeBadgeText}>CUP</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Separator Line */}
      <View style={styles.separator} />

      {/* Selected Competition Standings */}
      {selectedCompetition && (
        <UniversalLeagueTable
          leagueId={selectedCompetition}
          season={season}
          currentTeamName={currentTeamName}
          theme={theme}
          teamColors={teamColors}
          isDarkMode={isDarkMode}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    textAlign: "center",
  },
  tabsScrollView: {
    flexGrow: 0,
  },
  tabsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  competitionTab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 2,
    minWidth: 120,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    position: "relative",
  },
  competitionLogo: {
    width: 24,
    height: 24,
    marginRight: 6,
    backgroundColor: "transparent",
    opacity: 1, // Ensure full opacity for visibility
  },
  tabText: {
    fontSize: 13,
    fontFamily: "Inter-Medium",
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: "white",
    fontFamily: "Inter-Bold",
  },
  separator: {
    height: 1,
    backgroundColor: "rgba(128, 128, 128, 0.3)",
    width: "100%",
  },
});

