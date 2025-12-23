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
import teamLogoService from "@/services/teamLogoService";

// ==================== INTERFACES ====================

interface PlayerInjury {
  playerId: string;
  playerName: string;
  playerAge?: number;
  playerPhoto?: string;
  playerPosition: string;
  reason: string; // Injury reason (e.g., "Knee injury", "Achilles injury")
  startDate?: string; // ISO format - when injury started
  expectedReturn?: string; // ISO format - expected return date or "Unknown"
}

interface TeamInjuries {
  teamId: string;
  teamName: string;
  teamLogo: string;
  injuries: PlayerInjury[];
}

interface PlayerInjuriesData {
  homeTeamInjuries: TeamInjuries;
  awayTeamInjuries: TeamInjuries;
}

interface PlayerInjuriesProps {
  homeTeamName: string;
  awayTeamName: string;
  homeTeamLogo: string;
  awayTeamLogo: string;
  matchId?: string;
  homeTeamId?: string;
  awayTeamId?: string;
}

// ==================== MAIN COMPONENT ====================

export default function PlayerInjuries({
  homeTeamName,
  awayTeamName,
  homeTeamLogo,
  awayTeamLogo,
  matchId,
  homeTeamId,
  awayTeamId,
}: PlayerInjuriesProps) {
  const theme = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [injuriesData, setInjuriesData] = useState<PlayerInjuriesData | null>(null);

  const DEFAULT_LOGO = "https://via.placeholder.com/40";
  const DEFAULT_PLAYER_PHOTO = "https://via.placeholder.com/50";

  // ==================== HELPER FUNCTIONS ====================

  // Get player photo URL with multiple fallback sources
  const getPlayerPhotoUrl = (playerId: string | number | undefined, apiPhoto: string | undefined): string => {
    if (!playerId) return DEFAULT_PLAYER_PHOTO;

    const playerIdNum = typeof playerId === "string" ? parseInt(playerId) : playerId;
    if (isNaN(playerIdNum)) return DEFAULT_PLAYER_PHOTO;

    // Priority order: Try multiple official photo sources
    const photoSources = [
      // 1. API-Sports primary photo (if provided and valid)
      apiPhoto && apiPhoto.trim() !== "" && !apiPhoto.includes("placeholder") ? apiPhoto : null,
      
      // 2. API-Sports official player photo endpoint
      `https://media.api-sports.io/football/players/${playerIdNum}.png`,
      
      // 3. Transfermarkt high-quality portraits
      `https://img.a.transfermarkt.technology/portrait/header/${playerIdNum}.jpg`,
      
      // 4. Alternative Transfermarkt format
      `https://tmssl.akamaized.net/images/portrait/header/${playerIdNum}.jpg`,
    ];

    // Return the first available source
    return photoSources.find(source => source !== null) || DEFAULT_PLAYER_PHOTO;
  };

  // Format date for display
  const formatDate = (isoDate?: string | null): string => {
    if (!isoDate || isoDate.trim() === "" || isoDate === "Unknown") {
      return "Unknown";
    }
    
    try {
      const date = new Date(isoDate);
      if (isNaN(date.getTime())) {
        // If date is invalid, try parsing as YYYY-MM-DD directly
        const parts = isoDate.split("-");
        if (parts.length === 3) {
          return `${parts[0]}/${parts[1]}/${parts[2]}`;
        }
        return "Unknown";
      }
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}/${month}/${day}`;
    } catch {
      return "Unknown";
    }
  };

  // Fetch player details if age/position are missing
  const enrichPlayerData = async (playerId: number, existingData: { age?: number; position?: string }): Promise<{ age: number; position: string }> => {
    // If we already have all data, return it
    if (existingData.age && existingData.position && 
        existingData.age > 0 && existingData.position !== "Unknown") {
      return {
        age: existingData.age,
        position: existingData.position,
      };
    }

    try {
      // Try to fetch player details from teamDetailsApiService
      const { teamDetailsApi } = await import("@/services/teamDetailsApiService");
      const playerDetails = await teamDetailsApi.getPlayerDetails(playerId);
      
      if (playerDetails?.player) {
        return {
          age: existingData.age || playerDetails.player.age || 0,
          position: existingData.position && existingData.position !== "Unknown" 
            ? existingData.position 
            : (playerDetails.statistics?.[0]?.games?.position || "Unknown"),
        };
      }
    } catch (error) {
      console.log(`⚠️ Could not enrich player data for ${playerId}:`, error);
    }

    // Return existing data or defaults
    return {
      age: existingData.age || 0,
      position: existingData.position || "Unknown",
    };
  };

  // ==================== DATA FETCHING ====================

  useEffect(() => {
    if (matchId && homeTeamId && awayTeamId) {
      fetchPlayerInjuries();
    } else {
      console.warn("⚠️ Player Injuries: Match ID and Team IDs required");
      setError("Match ID and Team IDs required for Player Injuries data.");
      setLoading(false);
    }
  }, [matchId, homeTeamId, awayTeamId]);

  const fetchPlayerInjuries = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!matchId || !homeTeamId || !awayTeamId) {
        setError("Player Injuries requires match ID and team IDs from the API.");
        setLoading(false);
        return;
      }

      console.log(`🔄 Fetching Player Injuries`);
      console.log(`🏠 Home Team: ${homeTeamName} (ID: ${homeTeamId})`);
      console.log(`✈️ Away Team: ${awayTeamName} (ID: ${awayTeamId})`);
      console.log(`📋 Match ID: ${matchId}`);

      // ✅ REAL API: Fetch fixture players data which includes injury information
      const ApiSportsService = (await import("@/services/api-sports-service")).default;
      const apiService = new ApiSportsService({
        apiKey: process.env.EXPO_PUBLIC_API_FOOTBALL_KEY || "",
        baseUrl: "https://v3.football.api-sports.io",
      });

      // Fetch fixture players data (includes injury/suspension info)
      let playersResponse;
      let lineupsResponse;
      try {
        // Try fixture players endpoint first (more detailed injury info)
        playersResponse = await apiService.getMatchPlayerStats(parseInt(matchId));
        console.log(`📊 Fixture Players Response:`, playersResponse?.response?.length || 0, "teams");
      } catch (err: any) {
        console.warn(`⚠️ Failed to fetch fixture players for match ${matchId}:`, err);
        playersResponse = null;
      }

      // Also fetch lineups as fallback
      try {
        lineupsResponse = await apiService.getMatchLineups(parseInt(matchId));
        console.log(`📊 Lineups Response:`, lineupsResponse?.response?.length || 0, "teams");
      } catch (err: any) {
        console.warn(`⚠️ Failed to fetch lineups for match ${matchId}:`, err);
        lineupsResponse = null;
      }

      const transformInjuries = async (
        playersData: any, 
        lineupData: any, 
        teamId: string, 
        teamName: string, 
        teamLogo: string
      ): Promise<PlayerInjury[]> => {
        const injuries: PlayerInjury[] = [];

        // API-Football fixture players structure includes:
        // - players: Array of players with statistics
        //   - player: Player info (id, name, photo)
        //   - statistics: Array of stats (may include injury info)
        //   - events: Array of events (may include injury events)

        // Check fixture players data for injury information
        if (playersData?.players && Array.isArray(playersData.players)) {
          for (const playerData of playersData.players) {
            const player = playerData.player;
            if (!player?.id) continue;

            // Check for injury events or injury-related statistics
            const events = playerData.events || [];
            const hasInjuryEvent = events.some((event: any) => 
              event.type === "Injury" || 
              event.type === "Substitution" && event.detail === "Injury"
            );

            // Check if player is not in lineup but should be (potential injury)
            const isInLineup = lineupData?.startXI?.some((p: any) => 
              p.player?.id === player.id
            ) || lineupData?.substitutes?.some((p: any) => 
              p.player?.id === player.id
            );

            // Only add to injuries if there's an explicit injury event
            // Note: We don't add players just because they're not in lineup (they might be rested/rotated)
            if (hasInjuryEvent) {
              const enrichedData = await enrichPlayerData(
                player.id,
                {
                  age: player.age,
                  position: playerData.statistics?.[0]?.games?.position || "Unknown",
                }
              );

              const injury: PlayerInjury = {
                playerId: player.id.toString(),
                playerName: player.name || "Unknown Player",
                playerAge: enrichedData.age,
                playerPhoto: getPlayerPhotoUrl(player.id, player.photo),
                playerPosition: enrichedData.position,
                reason: hasInjuryEvent ? "Injury" : "Unavailable",
                expectedReturn: "Unknown",
              };

              // Avoid duplicates
              if (!injuries.find(i => i.playerId === injury.playerId)) {
                injuries.push(injury);
              }
            }
          }
        }

        // Fallback: Check lineup data for sidelined players
        if (lineupData?.sidelined && Array.isArray(lineupData.sidelined)) {
          for (const sidelinedPlayer of lineupData.sidelined) {
            const playerId = sidelinedPlayer.player?.id?.toString();
            if (!playerId) continue;

            const enrichedData = await enrichPlayerData(
              parseInt(playerId),
              {
                age: sidelinedPlayer.player?.age,
                position: sidelinedPlayer.player?.position,
              }
            );

            const injury: PlayerInjury = {
              playerId: playerId,
              playerName: sidelinedPlayer.player?.name || "Unknown Player",
              playerAge: enrichedData.age,
              playerPhoto: getPlayerPhotoUrl(sidelinedPlayer.player?.id, sidelinedPlayer.player?.photo),
              playerPosition: enrichedData.position,
              reason: sidelinedPlayer.reason || sidelinedPlayer.player?.reason || "Injury",
              startDate: sidelinedPlayer.start || undefined,
              expectedReturn: sidelinedPlayer.end || "Unknown",
            };

            // Avoid duplicates
            if (!injuries.find(i => i.playerId === playerId)) {
              injuries.push(injury);
            }
          }
        }

        // If still no injuries found, try squad-based approach
        if (injuries.length === 0 && lineupData) {
          try {
            const { teamDetailsApi } = await import("@/services/teamDetailsApiService");
            const currentSeason = new Date().getFullYear();
            
            const squad = await teamDetailsApi.getTeamSquad(parseInt(teamId), currentSeason);
            
            // Get players in lineup (starters + substitutes)
            const lineupPlayerIds = new Set<string>();
            if (lineupData.startXI) {
              lineupData.startXI.forEach((player: any) => {
                if (player.player?.id) {
                  lineupPlayerIds.add(player.player.id.toString());
                }
              });
            }
            if (lineupData.substitutes) {
              lineupData.substitutes.forEach((player: any) => {
                if (player.player?.id) {
                  lineupPlayerIds.add(player.player.id.toString());
                }
              });
            }

            // Check squad for players not in lineup (potential injuries)
            for (const squadPlayer of squad) {
              const playerId = squadPlayer.id?.toString();
              if (!playerId || lineupPlayerIds.has(playerId)) {
                continue; // Player is in lineup, skip
              }

              // Only flag as potentially injured if player is a regular starter/substitute
              // This is a heuristic - players not in lineup might be injured, rested, or suspended
              // We'll be conservative and only show if they have significant recent appearances
              const hasRecentAppearances = squadPlayer.statistics?.some((stat: any) => 
                stat.games?.appearences && stat.games.appearences > 5 // At least 5 appearances indicates regular player
              );

              // If player is a regular but not in lineup, they might be injured/sidelined
              // Note: This is a heuristic and may include rested players
              if (hasRecentAppearances) {
                const enrichedData = await enrichPlayerData(
                  parseInt(playerId),
                  {
                    age: squadPlayer.age,
                    position: squadPlayer.position || "Unknown",
                  }
                );

                const injury: PlayerInjury = {
                  playerId: playerId,
                  playerName: squadPlayer.name || "Unknown Player",
                  playerAge: enrichedData.age,
                  playerPhoto: getPlayerPhotoUrl(squadPlayer.id, squadPlayer.photo),
                  playerPosition: enrichedData.position,
                  reason: "Injury",
                  expectedReturn: "Unknown",
                };

                // Avoid duplicates
                if (!injuries.find(i => i.playerId === playerId)) {
                  injuries.push(injury);
                }
              }
            }
          } catch (squadError) {
            console.warn(`⚠️ Failed to fetch squad for injury detection:`, squadError);
          }
        }

        // Sort by player name
        const sortedInjuries = injuries.sort((a, b) => 
          a.playerName.localeCompare(b.playerName)
        );

        console.log(`✅ Transformed injuries:`, {
          count: sortedInjuries.length,
          sample: sortedInjuries[0],
        });

        return sortedInjuries;
      };

      // Process injuries for both teams
      let homeInjuries: PlayerInjury[] = [];
      let awayInjuries: PlayerInjury[] = [];

      // Find home and away data from responses
      let homePlayersData: any = null;
      let awayPlayersData: any = null;
      let homeLineup: any = null;
      let awayLineup: any = null;

      if (playersResponse?.response && Array.isArray(playersResponse.response)) {
        homePlayersData = playersResponse.response.find((p: any) => 
          p.team?.id?.toString() === homeTeamId || 
          p.team?.name?.toLowerCase() === homeTeamName.toLowerCase()
        ) || playersResponse.response[0];

        awayPlayersData = playersResponse.response.find((p: any) => 
          p.team?.id?.toString() === awayTeamId || 
          p.team?.name?.toLowerCase() === awayTeamName.toLowerCase()
        ) || playersResponse.response[1];
      }

      if (lineupsResponse?.response && Array.isArray(lineupsResponse.response)) {
        homeLineup = lineupsResponse.response.find((l: any) => 
          l.team?.id?.toString() === homeTeamId || 
          l.team?.name?.toLowerCase() === homeTeamName.toLowerCase()
        ) || lineupsResponse.response[0];

        awayLineup = lineupsResponse.response.find((l: any) => 
          l.team?.id?.toString() === awayTeamId || 
          l.team?.name?.toLowerCase() === awayTeamName.toLowerCase()
        ) || lineupsResponse.response[1];
      }

      // Transform injuries for both teams
      homeInjuries = await transformInjuries(homePlayersData, homeLineup, homeTeamId, homeTeamName, homeTeamLogo);
      awayInjuries = await transformInjuries(awayPlayersData, awayLineup, awayTeamId, awayTeamName, awayTeamLogo);

      // If no injuries found, show empty state
      if (homeInjuries.length === 0 && awayInjuries.length === 0) {
        console.log("ℹ️ No injury data found for these teams");
        setInjuriesData({
          homeTeamInjuries: {
            teamId: homeTeamId,
            teamName: homeTeamName,
            teamLogo: homeTeamLogo,
            injuries: [],
          },
          awayTeamInjuries: {
            teamId: awayTeamId,
            teamName: awayTeamName,
            teamLogo: awayTeamLogo,
            injuries: [],
          },
        });
        setLoading(false);
        return;
      }

      const injuriesDataResult: PlayerInjuriesData = {
        homeTeamInjuries: {
          teamId: homeTeamId,
          teamName: homeTeamName,
          teamLogo: homeTeamLogo,
          injuries: homeInjuries,
        },
        awayTeamInjuries: {
          teamId: awayTeamId,
          teamName: awayTeamName,
          teamLogo: awayTeamLogo,
          injuries: awayInjuries,
        },
      };

      setInjuriesData(injuriesDataResult);
      console.log(`✅ Player Injuries loaded:`, {
        home: `${homeInjuries.length} injuries`,
        away: `${awayInjuries.length} injuries`,
      });

    } catch (err: any) {
      console.warn("⚠️ Failed to fetch Player Injuries data:", err);
      setError(err?.message || "Failed to load Player Injuries data.");
    } finally {
      setLoading(false);
    }
  };

  // ==================== HELPER FUNCTIONS ====================

  const navigateToTeamDetails = (teamId: string, teamName: string) => {
    router.push({
      pathname: "/team-details",
      params: { 
        teamId, 
        teamName,
        defaultTab: "squad", // Navigate to Squad tab (where injuries are shown)
        sport: "football", // Player injuries are only for football
      },
    });
  };

  // ==================== RENDER TEAM SECTION ====================

  const renderTeamSection = (teamInjuries: TeamInjuries) => {
    const hasInjuries = teamInjuries.injuries.length > 0;

    if (!hasInjuries) {
      return (
        <View style={[styles.teamSection, { backgroundColor: theme.colors.backgroundSecondary }]}>
          <View style={styles.teamHeader}>
            <View style={styles.teamHeaderLeft}>
              <Image
                source={{ uri: teamInjuries.teamLogo || DEFAULT_LOGO }}
                style={styles.teamHeaderLogo}
              />
              <Text style={[styles.teamName, { color: theme.colors.text }]}>
                {teamInjuries.teamName}
              </Text>
            </View>
          </View>
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              No injuries reported
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View style={[styles.teamSection, { backgroundColor: theme.colors.backgroundSecondary }]}>
        {/* Team Header */}
        <View style={styles.teamHeader}>
          <View style={styles.teamHeaderLeft}>
            <Image
              source={{ uri: teamInjuries.teamLogo || DEFAULT_LOGO }}
              style={styles.teamHeaderLogo}
            />
            <Text style={[styles.teamName, { color: theme.colors.text }]} numberOfLines={1}>
              {teamInjuries.teamName}
            </Text>
          </View>
        </View>

        {/* Table Header - Horizontal Scroll */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tableHeaderContainer}
        >
          <View style={[styles.tableHeader, { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.border }]}>
            <Text style={[styles.headerText, { color: theme.colors.textSecondary }]}>Player</Text>
            <Text style={[styles.headerText, { color: theme.colors.textSecondary }]}>Reason</Text>
            <Text style={[styles.headerText, { color: theme.colors.textSecondary }]}>Expected Return</Text>
          </View>
        </ScrollView>

        {/* Injury Rows - Horizontal Scroll */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.injuryRowsContainer}
        >
          {teamInjuries.injuries.map((injury, index) => (
            <View
              key={`injury-${injury.playerId}-${index}`}
              style={[
                styles.injuryRow,
                { 
                  backgroundColor: theme.colors.background,
                  borderBottomColor: theme.colors.border,
                  borderBottomWidth: index < teamInjuries.injuries.length - 1 ? 1 : 0,
                },
              ]}
            >
              {/* Player Info */}
              <View style={styles.playerColumn}>
                <View style={styles.playerInfo}>
                  <View style={styles.playerPhotoContainer}>
                    <Image
                      source={{ uri: injury.playerPhoto || DEFAULT_PLAYER_PHOTO }}
                      style={styles.playerPhoto}
                      resizeMode="cover"
                      onError={(error) => {
                        console.log(`⚠️ Failed to load player photo for ${injury.playerName}: ${injury.playerPhoto}`);
                      }}
                    />
                    {/* Injury Icon Overlay */}
                    <View style={styles.injuryIconContainer}>
                      <Image
                        source={require("@/assets/matchIcons/injury.png")}
                        style={styles.injuryIcon}
                        resizeMode="contain"
                      />
                    </View>
                  </View>
                  <View style={styles.playerDetails}>
                    <Text style={[styles.playerName, { color: theme.colors.text }]}>
                      {injury.playerName}
                    </Text>
                    <Text style={[styles.playerMeta, { color: theme.colors.textSecondary }]}>
                      {injury.playerAge ? `${injury.playerAge} years` : ""} {injury.playerAge && injury.playerPosition ? "/ " : ""}{injury.playerPosition}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Reason Column */}
              <View style={styles.reasonColumn}>
                <Text style={[styles.reasonText, { color: theme.colors.text }]} numberOfLines={2}>
                  {injury.reason || "Unknown"}
                </Text>
              </View>

              {/* Expected Return Column */}
              <View style={styles.returnColumn}>
                <Text style={[styles.returnText, { color: theme.colors.textSecondary }]}>
                  {formatDate(injury.expectedReturn)}
                </Text>
              </View>
            </View>
          ))}
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
          Loading Player Injuries...
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
          onPress={fetchPlayerInjuries}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!injuriesData) {
    return (
      <View style={styles.centerContainer}>
        <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
          No injury information available
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Player Injuries Header */}
      <View style={[styles.sectionHeader, { backgroundColor: theme.colors.backgroundSecondary }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Player Injuries
        </Text>
      </View>

      {/* Home Team Injuries */}
      {renderTeamSection(injuriesData.homeTeamInjuries)}

      {/* Spacing */}
      <View style={styles.sectionSpacer} />

      {/* Away Team Injuries */}
      {renderTeamSection(injuriesData.awayTeamInjuries)}
    </View>
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
    textAlign: "center",
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
  },

  // Section Header - Edge to edge
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
  },

  // Team Section - Edge to edge (no horizontal margins)
  teamSection: {
    marginBottom: 8,
    overflow: "hidden",
  },
  sectionSpacer: {
    height: 16,
  },
  // Scrollable content wrapper for horizontal scrolling
  scrollableContent: {
    flex: 1,
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

  // Table Header - Horizontal scroll support
  tableHeaderContainer: {
    minWidth: 600, // Ensure enough width for all columns (matches Transfer Information)
  },
  tableHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    minWidth: 600, // Match content width
  },
  headerText: {
    fontSize: 11,
    fontWeight: "600",
    width: 200, // Fixed width for each column (600 / 3)
  },

  // Injury Rows Container - Horizontal scroll support
  injuryRowsContainer: {
    minWidth: 600, // Match header width
  },
  // Injury Row
  injuryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    minWidth: 600, // Match header width
  },

  // Player Column
  playerColumn: {
    width: 200, // Fixed width matching header
  },
  playerInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  playerPhotoContainer: {
    position: "relative",
    marginRight: 10,
  },
  playerPhoto: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  injuryIconContainer: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  injuryIcon: {
    width: 12,
    height: 12,
  },
  playerDetails: {
    flex: 1,
  },
  playerName: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  playerMeta: {
    fontSize: 11,
  },

  // Reason Column
  reasonColumn: {
    width: 200, // Fixed width matching header
    justifyContent: "center",
    paddingRight: 8,
  },
  reasonText: {
    fontSize: 13,
    fontWeight: "500",
  },

  // Expected Return Column
  returnColumn: {
    width: 200, // Fixed width matching header
    justifyContent: "center",
    alignItems: "flex-end",
  },
  returnText: {
    fontSize: 12,
    fontWeight: "500",
  },
});

