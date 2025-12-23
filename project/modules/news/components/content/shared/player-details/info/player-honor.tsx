/**
 * Player Honor Component
 * Displays player honors with trophy icons and season badges
 * Fetches honors from API-Football and other sports APIs
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import leagueLogoService from "@/services/leagueLogoService";

interface PlayerHonor {
  id: string;
  competition: string;
  competitionLogo: string;
  timesWon: number;
  seasons: Array<{
    year: string;
    team: string;
    teamLogo?: string;
  }>;
}

interface PlayerHonorProps {
  honors?: PlayerHonor[];
  theme: any;
  playerColors: {
    primary: string;
    secondary: string;
  };
  playerId?: string | number;
  playerName?: string;
  currentTeam?: {
    id: string;
    name: string;
    logo?: string;
  };
  transferHistory?: Array<{
    id: string;
    date: string;
    fromTeam: string;
    fromTeamLogo?: string;
    toTeam: string;
    toTeamLogo?: string;
    fee?: number;
    type?: string;
  }>;
}

// Get trophy emoji based on competition
const getTrophyEmoji = (competition: string): string => {
  const compLower = competition.toLowerCase();
  if (compLower.includes("champions league") || compLower.includes("european cup")) {
    return "🏆";
  }
  if (compLower.includes("world cup")) {
    return "🏆";
  }
  if (compLower.includes("ballon") || compLower.includes("best player")) {
    return "🥇";
  }
  if (compLower.includes("golden") || compLower.includes("boot")) {
    return "👟";
  }
  if (compLower.includes("super cup")) {
    return "🏅";
  }
  return "🏆";
};

export default function PlayerHonor({
  honors: propHonors = [],
  theme,
  playerColors,
  playerId,
  playerName = "",
  currentTeam,
  transferHistory = [],
}: PlayerHonorProps) {
  const [showAllHonors, setShowAllHonors] = useState(false);
  const [expandedHonor, setExpandedHonor] = useState<number | null>(null);
  const [honors, setHonors] = useState<PlayerHonor[]>(propHonors);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  const isDarkMode = theme.colors.background === "#2A2A2A";
  const greyBackground = isDarkMode ? "#3A3A3A" : "#F5F5F5";
  const borderColor = isDarkMode ? "#4A4A4A" : "#E0E0E0";

  // Helper to determine team name for a given season based on transfer history
  const getTeamForSeason = useCallback((season: string): { name: string; logo?: string } | null => {
    if (!transferHistory || transferHistory.length === 0) {
      return currentTeam ? { name: currentTeam.name, logo: currentTeam.logo } : null;
    }

    // Extract year from season (handle formats like "2023-2024", "2023/2024", "2023")
    const seasonYear = parseInt(season.split(/[-/]/)[0] || season);
    if (isNaN(seasonYear)) {
      return currentTeam ? { name: currentTeam.name, logo: currentTeam.logo } : null;
    }

    // Sort transfers by date (most recent first)
    const sortedTransfers = [...transferHistory].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA;
    });

    // Find the most recent transfer before or during the season year
    // The team the player was with during the season is the team they transferred TO
    // before or during that season
    for (const transfer of sortedTransfers) {
      const transferDate = new Date(transfer.date);
      const transferYear = transferDate.getFullYear();
      
      // If transfer happened before or during the season year, use the toTeam
      if (transferYear <= seasonYear) {
        return {
          name: transfer.toTeam,
          logo: transfer.toTeamLogo,
        };
      }
    }

    // If no transfer found, check if there's a transfer after the season
    // In that case, use the fromTeam of the first transfer after the season
    for (const transfer of sortedTransfers.reverse()) {
      const transferDate = new Date(transfer.date);
      const transferYear = transferDate.getFullYear();
      
      if (transferYear > seasonYear) {
        return {
          name: transfer.fromTeam,
          logo: transfer.fromTeamLogo,
        };
      }
    }

    // Fallback to current team
    return currentTeam ? { name: currentTeam.name, logo: currentTeam.logo } : null;
  }, [transferHistory, currentTeam]);

  // Fetch honors from API-Football
  const fetchHonors = useCallback(async () => {
    if (!playerId) {
      console.log(`ℹ️ [PlayerHonor] No playerId provided, using prop honors`);
      setHonors(propHonors);
      setInitialLoad(false);
      return;
    }

    const numericPlayerId = typeof playerId === "string" ? parseInt(playerId, 10) : Number(playerId);
    if (isNaN(numericPlayerId) || numericPlayerId <= 0) {
      console.warn(`⚠️ [PlayerHonor] Invalid playerId: ${playerId}`);
      setHonors(propHonors);
      setInitialLoad(false);
      return;
    }

    // If honors are already provided via props, use them
    if (propHonors && propHonors.length > 0) {
      console.log(`✅ [PlayerHonor] Using ${propHonors.length} honors from props`);
      setHonors(propHonors);
      setInitialLoad(false);
      return;
    }

    setLoading(true);
    console.log(`🔍 [PlayerHonor] Fetching honors for player ${numericPlayerId}...`);

    try {
      // Try API-Football trophies endpoint with player parameter
      const { createApiSportsService } = await import("@/services/api-sports-service");
      const apiSportsService = createApiSportsService();
      
      console.log(`🔄 [PlayerHonor] Attempting API-Football trophies fetch for player ${numericPlayerId}...`);
      
      // API-Football trophies endpoint supports player parameter
      const response = await apiSportsService.getTrophies({ playerId: numericPlayerId });
      
      console.log(`📦 [PlayerHonor] API-Football full response:`, JSON.stringify(response, null, 2).substring(0, 1000));
      console.log(`📦 [PlayerHonor] API-Football response summary:`, {
        hasResponse: !!response?.response,
        results: response?.results || 0,
        responseLength: Array.isArray(response?.response) ? response.response.length : 0,
        responseType: typeof response?.response,
        errors: response?.errors || [],
        responseKeys: response ? Object.keys(response) : []
      });

      if (response?.response && Array.isArray(response.response) && response.response.length > 0) {
        console.log(`📊 [PlayerHonor] API-Football returned ${response.response.length} trophies`);

        // Group trophies by competition
        const groupedHonors = new Map<string, {
          logo: string | null;
          seasons: Array<{ year: string; team: string; teamLogo?: string }>;
        }>();

        response.response.forEach((trophy: any, index: number) => {
          console.log(`🏆 [PlayerHonor] Processing trophy ${index + 1}:`, {
            league: trophy.league,
            country: trophy.country,
            name: trophy.name,
            season: trophy.season,
            year: trophy.year,
            place: trophy.place,
            team: trophy.team,
            trophyKeys: Object.keys(trophy)
          });
          
          // Extract competition name - prioritize league name, then country, then name
          const competition = trophy.league?.name || trophy.league || trophy.country?.name || trophy.country || trophy.name || "Trophy";
          const leagueId = trophy.league?.id || null;
          const leagueLogo = trophy.league?.logo || null;
          
          // Extract season - try multiple fields
          const season = trophy.season || trophy.year || trophy.place || "";
          
          // Extract team information - API-Football trophies endpoint provides team info
          // The team field contains the team the player was with when winning the trophy
          let teamName = "";
          let teamLogo = null;
          
          // Try multiple ways to extract team name from API response
          if (trophy.team) {
            // Handle both object and string formats
            if (typeof trophy.team === "string") {
              teamName = trophy.team;
            } else if (typeof trophy.team === "object") {
              teamName = trophy.team.name || trophy.team.title || "";
              teamLogo = trophy.team.logo || trophy.team.image || null;
            }
          }
          
          // Try alternative fields that might contain team info
          if (!teamName || teamName.trim() === "") {
            // Check for team in different structures
            if (trophy.league?.team) {
              teamName = trophy.league.team.name || trophy.league.team.title || "";
              teamLogo = trophy.league.team.logo || trophy.league.team.image || null;
            }
            
            // Check for club field
            if ((!teamName || teamName.trim() === "") && trophy.club) {
              teamName = typeof trophy.club === "string" ? trophy.club : (trophy.club.name || trophy.club.title || "");
              teamLogo = trophy.club?.logo || trophy.club?.image || null;
            }
            
            // Check for winner field
            if ((!teamName || teamName.trim() === "") && trophy.winner) {
              teamName = typeof trophy.winner === "string" ? trophy.winner : (trophy.winner.name || trophy.winner.title || "");
              teamLogo = trophy.winner?.logo || trophy.winner?.image || null;
            }
          }
          
          console.log(`🏆 [PlayerHonor] Extracted: competition="${competition}", season="${season}", team="${teamName}", leagueId=${leagueId}, teamLogo=${teamLogo ? "yes" : "no"}`);
          
          if (!groupedHonors.has(competition)) {
            // Get competition logo - use only official API logos, no hardcoded fallbacks
            let logoUrl = "";
            
            // Priority 1: API-provided league logo
            if (leagueLogo && leagueLogo.trim() !== "" && leagueLogo.includes("api-sports.io")) {
              logoUrl = leagueLogo;
            } 
            // Priority 2: Construct official API logo URL from league ID
            else if (leagueId) {
              logoUrl = `https://media.api-sports.io/football/leagues/${leagueId}.png`;
            }
            // Priority 3: Try leagueLogoService (which uses official API sources)
            else {
              const serviceLogo = leagueLogoService.getOfficialLeagueLogoSync(competition);
              // Only use if it's an official API URL
              if (serviceLogo && (serviceLogo.includes("api-sports.io") || serviceLogo.includes("media.api-sports.io"))) {
                logoUrl = serviceLogo;
              }
            }
            
            groupedHonors.set(competition, {
              logo: logoUrl, // Empty string if no official logo available - will use emoji fallback in render
              seasons: [],
            });
            
            console.log(`🏆 [PlayerHonor] Set logo for ${competition}: ${logoUrl || "none (will use emoji)"}`);
          }
          
          if (season) {
            // If no team name from API, try to determine from transfer history
            if (!teamName || teamName.trim() === "") {
              const teamFromHistory = getTeamForSeason(season);
              if (teamFromHistory) {
                teamName = teamFromHistory.name;
                teamLogo = teamFromHistory.logo || null;
                console.log(`🔄 [PlayerHonor] Determined team "${teamName}" for season ${season} from transfer history`);
              }
            }
            
            // Only add if we have a valid team name
            if (teamName && teamName.trim() !== "") {
              groupedHonors.get(competition)!.seasons.push({
                year: season,
                team: teamName,
                teamLogo: teamLogo || undefined,
              });
              console.log(`✅ [PlayerHonor] Added season ${season} for ${competition} with team ${teamName}`);
            } else {
              console.warn(`⚠️ [PlayerHonor] Skipping trophy ${index + 1} - no team name found for season ${season} (tried API and transfer history)`);
            }
          } else {
            console.warn(`⚠️ [PlayerHonor] Skipping trophy ${index + 1} - no season/year found`);
          }
        });

        // Convert to PlayerHonor format
        const formattedHonors: PlayerHonor[] = Array.from(groupedHonors.entries()).map(([competition, data], index) => ({
          id: `honor-${numericPlayerId}-${index}`,
          competition,
          competitionLogo: data.logo || "",
          timesWon: data.seasons.length,
          seasons: data.seasons.sort((a, b) => b.year.localeCompare(a.year)), // Most recent first
        }));

        console.log(`✅ [PlayerHonor] Successfully formatted ${formattedHonors.length} honors from API-Football`);
        setHonors(formattedHonors);
      } else {
        console.log(`ℹ️ [PlayerHonor] API-Football returned no trophies for player ${numericPlayerId}`);
        setHonors([]);
      }
    } catch (error: any) {
      console.error(`❌ [PlayerHonor] API-Football fetch failed:`, error?.message || error);
      console.error(`❌ [PlayerHonor] Error details:`, {
        name: error?.name,
        message: error?.message,
        code: error?.code,
        statusCode: error?.statusCode
      });
      // Fallback to prop honors if available
      setHonors(propHonors);
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  }, [playerId, propHonors, getTeamForSeason]);

  useEffect(() => {
    console.log(`🎯 [PlayerHonor] Component mounted/updated with playerId: ${playerId}, propHonors: ${propHonors?.length || 0}`);
    fetchHonors();
  }, [playerId]);

  // Update honors when propHonors changes
  useEffect(() => {
    if (propHonors && propHonors.length > 0 && honors.length === 0) {
      console.log(`🔄 [PlayerHonor] Updating honors from props: ${propHonors.length} items`);
      setHonors(propHonors);
    }
  }, [propHonors]);

  // Show loading state during initial load
  if (initialLoad && loading) {
    return (
      <View style={[styles.honorsSection, { backgroundColor: greyBackground }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Honors</Text>
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="small" color={playerColors.primary} />
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary, marginTop: 12 }]}>
            Loading honors...
          </Text>
        </View>
      </View>
    );
  }

  if (!honors || honors.length === 0) {
    return (
      <View style={[styles.honorsSection, { backgroundColor: greyBackground }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Honors</Text>
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            No honors available
          </Text>
        </View>
      </View>
    );
  }

  const displayedHonors = showAllHonors ? honors : honors.slice(0, 3);
  const hasMoreHonors = honors.length > 3;

  return (
    <View style={[styles.honorsSection, { backgroundColor: greyBackground }]}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Honors</Text>
      {displayedHonors.map((honor, index) => {
        const isExpanded = expandedHonor === index;
        const displaySeasons = isExpanded
          ? honor.seasons
          : honor.seasons.slice(0, 6);
        const hasMoreSeasons = honor.seasons.length > 6;

        return (
          <View
            key={honor.id}
            style={[
              styles.honorRow,
              {
                borderBottomColor: isDarkMode
                  ? "rgba(255, 255, 255, 0.1)"
                  : "rgba(0, 0, 0, 0.1)",
                borderBottomWidth: index < displayedHonors.length - 1 ? 1 : 0,
              },
            ]}
          >
            <View style={[styles.honorHeader, { paddingHorizontal: 16 }]}>
              {/* League/Cup Logo on Left */}
              {honor.competitionLogo && honor.competitionLogo.trim() !== "" ? (
                <Image
                  source={{ uri: honor.competitionLogo }}
                  style={styles.trophyLogo}
                  resizeMode="contain"
                  onError={() => {
                    console.log(`Failed to load competition logo: ${honor.competitionLogo}`);
                  }}
                />
              ) : (
                <Text style={styles.trophyIcon}>{getTrophyEmoji(honor.competition)}</Text>
              )}
              <View style={styles.honorInfo}>
                <Text style={[styles.competitionName, { color: theme.colors.text }]}>
                  {honor.competition}{honor.timesWon > 1 ? ` (${honor.timesWon} times)` : ""}
                </Text>
              </View>
              {hasMoreSeasons && (
                <TouchableOpacity onPress={() => setExpandedHonor(isExpanded ? null : index)}>
                  <Text style={[styles.expandButton, { color: playerColors.primary }]}>
                    {isExpanded ? "Less" : "More"} &gt;
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Orange Season Badges - matching Chinese app - full width */}
            <View style={[styles.seasonsGrid, { paddingHorizontal: 16 }]}>
              {displaySeasons.map((season, seasonIndex) => (
                <View
                  key={seasonIndex}
                  style={[styles.seasonBadge, { backgroundColor: "#FF9800" }]}
                >
                  <Text style={styles.seasonText} numberOfLines={1}>
                    {season.year} {season.team}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        );
      })}

      {hasMoreHonors && (
        <TouchableOpacity
          style={[styles.showAllButton, { marginHorizontal: 0 }]}
          onPress={() => setShowAllHonors(!showAllHonors)}
        >
          <Text style={[styles.showAllText, { color: playerColors.primary }]}>
            {showAllHonors ? "Show Less Honors" : "Show All Honors"}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  honorsSection: {
    marginTop: 4,
    marginBottom: 4,
    paddingTop: 16,
    paddingBottom: 16,
    borderRadius: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  honorRow: {
    paddingHorizontal: 0,
    paddingVertical: 16,
  },
  honorHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 12,
  },
  trophyIcon: {
    fontSize: 32,
    width: 40,
    height: 40,
    textAlign: "center",
  },
  trophyLogo: {
    width: 40,
    height: 40,
    marginRight: 12,
  },
  honorInfo: {
    flex: 1,
  },
  competitionName: {
    fontSize: 15,
    fontWeight: "600",
  },
  expandButton: {
    fontSize: 14,
    fontWeight: "500",
  },
  seasonsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
    paddingHorizontal: 0,
  },
  seasonBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: "#FF9800",
    marginRight: 8,
    marginBottom: 8,
    shadowColor: "#FF9800",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  seasonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  showAllButton: {
    marginTop: 16,
    padding: 12,
    alignItems: "center",
    marginHorizontal: 0,
    borderRadius: 0,
    backgroundColor: "rgba(255, 107, 53, 0.1)",
  },
  showAllText: {
    fontSize: 14,
    fontWeight: "600",
  },
  emptyContainer: {
    paddingVertical: 40,
    paddingHorizontal: 0,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
  },
});

