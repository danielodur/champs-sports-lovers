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
import { ArrowLeft, ArrowRight } from "lucide-react-native";
import teamLogoService from "@/services/teamLogoService";

// ==================== INTERFACES ====================

interface Transfer {
  playerId: string;
  playerName: string;
  playerAge: number;
  playerPhoto?: string;
  playerPosition: string;
  playerNationality: string;
  direction: "in" | "out"; // "in" = Transfer In, "out" = Transfer Out
  fromToTeam: string; // From team (for "in"), To team (for "out")
  fromToTeamLogo?: string;
  date: string; // ISO format
  fee?: string;
  transferType: "transfer" | "loan" | "free";
}

interface TeamTransfers {
  teamId: string;
  teamName: string;
  teamLogo: string;
  transfersIn: Transfer[]; // Players who joined
  transfersOut: Transfer[]; // Players who left
}

interface TransferInformationData {
  homeTeamTransfers: TeamTransfers;
  awayTeamTransfers: TeamTransfers;
}

interface TransferInformationProps {
  homeTeamName: string;
  awayTeamName: string;
  homeTeamLogo: string;
  awayTeamLogo: string;
  matchId?: string;
  homeTeamId?: string;
  awayTeamId?: string;
}

// ==================== MAIN COMPONENT ====================

export default function TransferInformation({
  homeTeamName,
  awayTeamName,
  homeTeamLogo,
  awayTeamLogo,
  matchId,
  homeTeamId,
  awayTeamId,
}: TransferInformationProps) {
  const theme = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transferData, setTransferData] = useState<TransferInformationData | null>(null);

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
      
      // 5. ESPN player photos
      `https://a.espncdn.com/i/headshots/soccer/players/full/${playerIdNum}.png`,
      
      // 6. FotMob player images
      `https://images.fotmob.com/image_resources/playerimages/${playerIdNum}.png`,
    ];

    // Return the first available source (API-Sports official endpoint is most reliable)
    // The Image component will handle invalid URLs gracefully
    return photoSources.find(source => source !== null) || DEFAULT_PLAYER_PHOTO;
  };

  // Format transfer fee for display
  const formatTransferFee = (fee?: string | null, type?: string): string => {
    // If type is "Free", return "Free Transfer"
    if (type?.toLowerCase().includes("free")) {
      return "Free Transfer";
    }
    
    // If type is "Loan", return "Loan"
    if (type?.toLowerCase().includes("loan")) {
      return "Loan";
    }
    
    // If we have a fee string, use it directly
    if (fee && fee.trim() && fee.toLowerCase() !== "free") {
      return fee;
    }
    
    // Default fallback
    return "Undisclosed";
  };

  // Fetch player details if age/position/nationality are missing
  const enrichPlayerData = async (playerId: number, existingData: { age?: number; position?: string; nationality?: string }): Promise<{ age: number; position: string; nationality: string }> => {
    // If we already have all data, return it
    if (existingData.age && existingData.position && existingData.nationality && 
        existingData.age > 0 && existingData.position !== "Unknown" && existingData.nationality !== "Unknown") {
      return {
        age: existingData.age,
        position: existingData.position,
        nationality: existingData.nationality,
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
          nationality: existingData.nationality && existingData.nationality !== "Unknown"
            ? existingData.nationality
            : (playerDetails.player.nationality || "Unknown"),
        };
      }
    } catch (error) {
      console.log(`⚠️ Could not enrich player data for ${playerId}:`, error);
    }

    // Return existing data or defaults
    return {
      age: existingData.age || 0,
      position: existingData.position || "Unknown",
      nationality: existingData.nationality || "Unknown",
    };
  };

  // ==================== DATA FETCHING ====================

  useEffect(() => {
    if (homeTeamId && awayTeamId) {
      fetchTransferInformation();
    } else {
      console.warn("⚠️ Transfer Information: Team IDs not available");
      setError("Team IDs required for Transfer Information data.");
      setLoading(false);
    }
  }, [homeTeamId, awayTeamId]);

  const fetchTransferInformation = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!homeTeamId || !awayTeamId) {
        setError("Transfer Information requires team IDs from the API.");
        setLoading(false);
        return;
      }

      console.log(`🔄 Fetching Transfer Information`);
      console.log(`🏠 Home Team: ${homeTeamName} (ID: ${homeTeamId})`);
      console.log(`✈️ Away Team: ${awayTeamName} (ID: ${awayTeamId})`);

      // ✅ REAL API: Fetch transfer data for both teams
      const ApiSportsService = (await import("@/services/api-sports-service")).default;
      const apiService = new ApiSportsService({
        apiKey: process.env.EXPO_PUBLIC_API_FOOTBALL_KEY || "",
        baseUrl: "https://v3.football.api-sports.io",
      });

      const currentSeason = new Date().getFullYear();

      // Fetch transfers for both teams
      const [homeTransfersResponse, awayTransfersResponse] = await Promise.all([
        apiService.getTransfers({ teamId: parseInt(homeTeamId) }).catch((err) => {
          console.warn(`⚠️ Failed to fetch transfers for home team ${homeTeamId}:`, err);
          return { response: [] };
        }),
        apiService.getTransfers({ teamId: parseInt(awayTeamId) }).catch((err) => {
          console.warn(`⚠️ Failed to fetch transfers for away team ${awayTeamId}:`, err);
          return { response: [] };
        }),
      ]);

      console.log(`📊 Home Transfers Response:`, homeTransfersResponse?.response?.length || 0, "items");
      console.log(`📊 Away Transfers Response:`, awayTransfersResponse?.response?.length || 0, "items");
      
      // Log sample response structure for debugging
      if (homeTransfersResponse?.response?.[0]) {
        const sample = homeTransfersResponse.response[0];
        console.log(`📊 Sample Transfer Structure:`, {
          player: {
            id: sample.player?.id,
            name: sample.player?.name,
            age: sample.player?.age,
            position: sample.player?.position,
            nationality: sample.player?.nationality,
            photo: sample.player?.photo ? "✅" : "❌",
          },
          transfers: sample.transfers?.map((t: any) => ({
            date: t.date,
            type: t.type,
            fee: t.fee,
            teams: {
              in: t.teams?.in?.name,
              out: t.teams?.out?.name,
            },
          })),
        });
      }

      const transformTransfers = async (transfersData: any[], teamId: string, teamName: string, teamLogo: string): Promise<{ transfersIn: Transfer[]; transfersOut: Transfer[] }> => {
        const transfersIn: Transfer[] = [];
        const transfersOut: Transfer[] = [];

        if (!transfersData || transfersData.length === 0) {
          return { transfersIn, transfersOut };
        }

        // Process transfers from API response
        // API-Sports structure: response is an array of player objects, each with a transfers array
        for (const playerTransfer of transfersData) {
          // Extract player info from the player object
          const player = playerTransfer.player || {};
          const transfers = playerTransfer.transfers || [];
          
          if (!player.id || !player.name || player.name === "Unknown Player") {
            continue; // Skip invalid player data
          }

          // Try to enrich player data if missing
          const enrichedData = await enrichPlayerData(player.id, {
            age: player.age,
            position: player.position,
            nationality: player.nationality,
          });
          
          // Process each transfer for this player
          for (const t of transfers) {
            const teamInId = t.teams?.in?.id?.toString();
            const teamOutId = t.teams?.out?.id?.toString();
            const isIn = teamInId === teamId;
            const isOut = teamOutId === teamId;

            if (isIn || isOut) {
              // ✅ REAL API DATA: Extract all fields from API response
              // API-Sports provides: player.id, player.name, player.age, player.photo, player.position, player.nationality
              // Transfer provides: t.date, t.type, t.fee, t.teams.in, t.teams.out
              const transferData: Transfer = {
                playerId: player.id.toString(),
                playerName: player.name,
                playerAge: enrichedData.age,
                // ✅ ENHANCED: Use multiple photo sources with fallbacks for official player headshots
                playerPhoto: getPlayerPhotoUrl(player.id, player.photo),
                playerPosition: enrichedData.position,
                playerNationality: enrichedData.nationality,
                direction: isIn ? "in" : "out",
                fromToTeam: isIn ? (t.teams?.out?.name || "Unknown") : (t.teams?.in?.name || "Unknown"),
                fromToTeamLogo: isIn ? (t.teams?.out?.logo || "") : (t.teams?.in?.logo || ""),
                // ✅ REAL API: Use date from API response (format: YYYY-MM-DD)
                date: t.date || "",
                // ✅ FIXED: Use transfer.fee directly (API-Sports provides fee as a string)
                fee: formatTransferFee(t.fee, t.type),
                transferType: t.type?.toLowerCase() === "loan" ? "loan" : t.type?.toLowerCase() === "free" ? "free" : "transfer",
              };

              // ✅ REAL API: Only add if we have valid player data and transfer date
              if (transferData.date) {
                if (isIn) {
                  transfersIn.push(transferData);
                } else {
                  transfersOut.push(transferData);
                }
              }
            }
          }
        }

        // Sort by date (most recent first) and limit to 10
        const sortedIn = transfersIn.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);
        const sortedOut = transfersOut.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);

        console.log(`✅ Transformed transfers:`, {
          in: sortedIn.length,
          out: sortedOut.length,
          sample: sortedIn[0] || sortedOut[0],
        });

        return { transfersIn: sortedIn, transfersOut: sortedOut };
      };

      const homeTransfers = await transformTransfers(
        homeTransfersResponse.response || [],
        homeTeamId,
        homeTeamName,
        homeTeamLogo
      );
      const awayTransfers = await transformTransfers(
        awayTransfersResponse.response || [],
        awayTeamId,
        awayTeamName,
        awayTeamLogo
      );

      // If no transfers found, show empty state
      if (homeTransfers.transfersIn.length === 0 && homeTransfers.transfersOut.length === 0 &&
          awayTransfers.transfersIn.length === 0 && awayTransfers.transfersOut.length === 0) {
        console.warn("⚠️ No transfer data found for these teams");
        setTransferData(null);
        setLoading(false);
        return;
      }

      const transferData: TransferInformationData = {
        homeTeamTransfers: {
          teamId: homeTeamId,
          teamName: homeTeamName,
          teamLogo: homeTeamLogo,
          transfersIn: homeTransfers.transfersIn,
          transfersOut: homeTransfers.transfersOut,
        },
        awayTeamTransfers: {
          teamId: awayTeamId,
          teamName: awayTeamName,
          teamLogo: awayTeamLogo,
          transfersIn: awayTransfers.transfersIn,
          transfersOut: awayTransfers.transfersOut,
        },
      };

      setTransferData(transferData);
      console.log(`✅ Transfer Information loaded:`, {
        home: `${homeTransfers.transfersIn.length} in, ${homeTransfers.transfersOut.length} out`,
        away: `${awayTransfers.transfersIn.length} in, ${awayTransfers.transfersOut.length} out`,
      });

    } catch (err: any) {
      console.warn("⚠️ Failed to fetch Transfer Information data:", err);
      setError(err?.message || "Failed to load Transfer Information data.");
    } finally {
      setLoading(false);
    }
  };

  // ==================== HELPER FUNCTIONS ====================

  const formatDate = (isoDate: string): string => {
    // ✅ REAL API: Only format if we have a valid date from API
    if (!isoDate || isoDate.trim() === "") {
      return "N/A";
    }
    
    try {
      // API-Sports provides dates in format: "YYYY-MM-DD" or ISO format
      const date = new Date(isoDate);
      if (isNaN(date.getTime())) {
        // If date is invalid, try parsing as YYYY-MM-DD directly
        const parts = isoDate.split("-");
        if (parts.length === 3) {
          return `${parts[0]}/${parts[1]}/${parts[2]}`;
        }
        return "N/A";
      }
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}/${month}/${day}`;
    } catch {
      return "N/A";
    }
  };

  // Navigate to team's Transfers screen
  const navigateToTeamTransfers = (teamId: string, teamName: string) => {
    router.push({
      pathname: "/team-details",
      params: { 
        teamId, 
        teamName,
        defaultTab: "transfers", // Navigate to Transfers tab by default
        sport: "football", // Transfer information is only for football
      },
    });
  };

  // ==================== RENDER TEAM SECTION ====================

  const renderTeamSection = (teamTransfers: TeamTransfers, isHomeTeam: boolean) => {
    const hasTransfersIn = teamTransfers.transfersIn.length > 0;
    const hasTransfersOut = teamTransfers.transfersOut.length > 0;

    if (!hasTransfersIn && !hasTransfersOut) {
      return (
        <View style={[styles.teamSection, { backgroundColor: theme.colors.backgroundSecondary }]}>
          <View style={styles.teamHeader}>
            <View style={styles.teamHeaderLeft}>
              <Image
                source={{ uri: teamTransfers.teamLogo || DEFAULT_LOGO }}
                style={styles.teamHeaderLogo}
              />
              <Text style={[styles.teamName, { color: theme.colors.text }]}>
                {teamTransfers.teamName}
              </Text>
            </View>
          </View>
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              No transfers available
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View style={[styles.teamSection, { backgroundColor: theme.colors.backgroundSecondary }]}>
        {/* Team Header with View All Button */}
        <View style={styles.teamHeader}>
          <View style={styles.teamHeaderLeft}>
            <Image
              source={{ uri: teamTransfers.teamLogo || DEFAULT_LOGO }}
              style={styles.teamHeaderLogo}
            />
            <Text style={[styles.teamName, { color: theme.colors.text }]} numberOfLines={1}>
              {teamTransfers.teamName}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.viewAllButton, { borderColor: theme.colors.border }]}
            onPress={() => navigateToTeamTransfers(teamTransfers.teamId, teamTransfers.teamName)}
          >
            <Text style={[styles.viewAllText, { color: theme.colors.primary }]}>
              View All
            </Text>
          </TouchableOpacity>
        </View>

        {/* Transfers In Section */}
        {hasTransfersIn && (
          <View style={styles.transferSection}>
            <View style={[styles.transferHeader, { backgroundColor: theme.colors.background }]}>
              <Text style={[styles.transferHeaderTitle, { color: theme.colors.text }]}>
                Transfer In
              </Text>
            </View>

            {/* Table Header - Horizontal Scroll */}
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tableHeaderContainer}
            >
              <View style={[styles.tableHeader, { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.border }]}>
                <Text style={[styles.headerText, { color: theme.colors.textSecondary }]}>Player/Time</Text>
                <Text style={[styles.headerText, { color: theme.colors.textSecondary }]}>Transfer Fee</Text>
              </View>
            </ScrollView>

            {/* Transfer Rows - Horizontal Scroll */}
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.transferRowsContainer}
            >
              {teamTransfers.transfersIn.map((transfer, index) => (
              <TouchableOpacity
                key={`transfer-in-${transfer.playerId}-${transfer.date}-${index}`}
                style={[
                  styles.transferRow,
                  { 
                    backgroundColor: theme.colors.background,
                    borderBottomColor: theme.colors.border,
                    borderBottomWidth: index < teamTransfers.transfersIn.length - 1 ? 1 : 0,
                  },
                ]}
                activeOpacity={0.7}
                onPress={() => {
                  // Navigate to this team's Transfers screen (player is joining this team)
                  navigateToTeamTransfers(teamTransfers.teamId, teamTransfers.teamName);
                }}
              >
                {/* Player Info */}
                <View style={styles.playerColumn}>
                  <View style={styles.playerInfo}>
                    <Image
                      source={{ uri: transfer.playerPhoto || DEFAULT_PLAYER_PHOTO }}
                      style={styles.playerPhoto}
                      resizeMode="cover"
                      onError={(error) => {
                        console.log(`⚠️ Failed to load player photo for ${transfer.playerName}: ${transfer.playerPhoto}`);
                      }}
                    />
                    <View style={styles.playerDetails}>
                      <Text style={[styles.playerName, { color: theme.colors.text }]}>
                        {transfer.playerName}
                      </Text>
                      <Text style={[styles.playerMeta, { color: theme.colors.textSecondary }]}>
                        {transfer.playerAge} years / {transfer.playerPosition} / {transfer.playerNationality}
                      </Text>
                    </View>
                  </View>
                  {/* From Team with Green Circle Arrow */}
                  <View style={styles.transferDirection}>
                    <View style={[styles.arrowCircle, styles.arrowCircleIn]}>
                      <ArrowLeft size={12} color="#FFFFFF" />
                    </View>
                    <Text style={[styles.fromToTeam, { color: theme.colors.text }]}>
                      {transfer.fromToTeam}
                    </Text>
                    <Text style={[styles.transferDate, { color: theme.colors.textSecondary }]}>
                      {formatDate(transfer.date)}
                    </Text>
                  </View>
                </View>

                {/* Transfer Fee */}
                <View style={styles.feeColumn}>
                  <Text style={[styles.feeText, { color: theme.colors.text }]}>
                    {transfer.fee || "Unknown"}
                  </Text>
                </View>
              </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Transfers Out Section */}
        {hasTransfersOut && (
          <View style={[styles.transferSection, hasTransfersIn && styles.transferSectionSpacing]}>
            <View style={[styles.transferHeader, { backgroundColor: theme.colors.background }]}>
              <Text style={[styles.transferHeaderTitle, { color: theme.colors.text }]}>
                Transfer Out
              </Text>
            </View>

            {/* Table Header - Horizontal Scroll */}
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tableHeaderContainer}
            >
              <View style={[styles.tableHeader, { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.border }]}>
                <Text style={[styles.headerText, { color: theme.colors.textSecondary }]}>Player/Time</Text>
                <Text style={[styles.headerText, { color: theme.colors.textSecondary }]}>Transfer Fee</Text>
              </View>
            </ScrollView>

            {/* Transfer Rows - Horizontal Scroll */}
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.transferRowsContainer}
            >
              {teamTransfers.transfersOut.map((transfer, index) => (
              <TouchableOpacity
                key={`transfer-out-${transfer.playerId}-${transfer.date}-${index}`}
                style={[
                  styles.transferRow,
                  { 
                    backgroundColor: theme.colors.background,
                    borderBottomColor: theme.colors.border,
                    borderBottomWidth: index < teamTransfers.transfersOut.length - 1 ? 1 : 0,
                  },
                ]}
                activeOpacity={0.7}
                onPress={() => {
                  // Navigate to this team's Transfers screen (player is leaving this team, but still associated with it)
                  navigateToTeamTransfers(teamTransfers.teamId, teamTransfers.teamName);
                }}
              >
                {/* Player Info */}
                <View style={styles.playerColumn}>
                  <View style={styles.playerInfo}>
                    <Image
                      source={{ uri: transfer.playerPhoto || DEFAULT_PLAYER_PHOTO }}
                      style={styles.playerPhoto}
                      resizeMode="cover"
                      onError={(error) => {
                        console.log(`⚠️ Failed to load player photo for ${transfer.playerName}: ${transfer.playerPhoto}`);
                      }}
                    />
                    <View style={styles.playerDetails}>
                      <Text style={[styles.playerName, { color: theme.colors.text }]}>
                        {transfer.playerName}
                      </Text>
                      <Text style={[styles.playerMeta, { color: theme.colors.textSecondary }]}>
                        {transfer.playerAge} years / {transfer.playerPosition} / {transfer.playerNationality}
                      </Text>
                    </View>
                  </View>
                  {/* To Team with Red Circle Arrow */}
                  <View style={styles.transferDirection}>
                    <View style={[styles.arrowCircle, styles.arrowCircleOut]}>
                      <ArrowRight size={12} color="#FFFFFF" />
                    </View>
                    <Text style={[styles.fromToTeam, { color: theme.colors.text }]}>
                      {transfer.fromToTeam}
                    </Text>
                    <Text style={[styles.transferDate, { color: theme.colors.textSecondary }]}>
                      {formatDate(transfer.date)}
                    </Text>
                  </View>
                </View>

                {/* Transfer Fee */}
                <View style={styles.feeColumn}>
                  <Text style={[styles.feeText, { color: theme.colors.text }]}>
                    {transfer.fee || "Unknown"}
                  </Text>
                </View>
              </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    );
  };

  // ==================== MAIN RENDER ====================

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
          Loading Transfer Information...
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
          onPress={fetchTransferInformation}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!transferData) {
    return (
      <View style={styles.centerContainer}>
        <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
          No transfer information available
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Home Team Transfers */}
      {renderTeamSection(transferData.homeTeamTransfers, true)}

      {/* Spacing */}
      <View style={styles.sectionSpacer} />

      {/* Away Team Transfers */}
      {renderTeamSection(transferData.awayTeamTransfers, false)}
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
    textAlign: "center",
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
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

  // Transfer Section
  transferSection: {
    marginTop: 8,
  },
  transferSectionSpacing: {
    marginTop: 16,
  },
  transferHeader: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  transferHeaderTitle: {
    fontSize: 14,
    fontWeight: "700",
  },

  // Table Header
  tableHeaderContainer: {
    minWidth: 600, // Ensure enough width for all columns
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
    width: 300, // Fixed width for each column
  },

  // Transfer Rows Container
  transferRowsContainer: {
    minWidth: 600, // Match header width
  },
  // Transfer Row
  transferRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    minWidth: 600, // Match header width
  },

  // Player Column
  playerColumn: {
    width: 300, // Fixed width matching header
  },
  playerInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  playerPhoto: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
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
  transferDirection: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 50,
  },
  arrowCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  arrowCircleIn: {
    backgroundColor: "#4CAF50", // Green for Transfer In
  },
  arrowCircleOut: {
    backgroundColor: "#F44336", // Red for Transfer Out
  },
  fromToTeam: {
    fontSize: 12,
    fontWeight: "500",
    marginRight: 8,
  },
  transferDate: {
    fontSize: 11,
  },

  // Fee Column
  feeColumn: {
    flex: 1,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  feeText: {
    fontSize: 13,
    fontWeight: "600",
  },
});
