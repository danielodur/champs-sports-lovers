/**
 * Player Details - Transfers Component
 * Displays comprehensive transfer history for a specific player
 * Based on league-transfers.tsx logic but filtered for a single player
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { ArrowRight, ChevronDown, ChevronUp } from "lucide-react-native";
import teamLogoService from "@/services/teamLogoService";

interface PlayerDetailsTransfersProps {
  playerId: string | number;
  playerName?: string;
  playerPhoto?: string;
  playerAge?: number;
  nationality?: string;
  position?: string;
  theme: any;
  playerColors: {
    primary: string;
    secondary: string;
  };
  transferHistory?: Array<{
    id: string;
    date: string;
    fromTeam: string;
    fromTeamLogo: string;
    toTeam: string;
    toTeamLogo: string;
    fee: number;
    type: "transfer" | "loan" | "free" | "contract";
  }>;
  sport?: string; // ✅ Sport parameter (basketball/football)
}

interface TransferItem {
  id: string;
  playerId: number;
  playerName: string;
  playerAge?: number;
  nationality?: string;
  photo: string | null;
  position?: string;
  fromTeam: {
    name: string;
    logo: string | null;
  };
  toTeam: {
    name: string;
    logo: string | null;
  };
  date: string;
  type: string;
  fee?: string;
  feeValue: number;
  monthKey: string;
}

// Helper functions
const formatMonthLabel = (monthKey: string): string => {
  const [yearStr, monthStr] = monthKey.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr) - 1;
  if (Number.isNaN(year) || Number.isNaN(month)) {
    return monthKey;
  }
  return new Date(year, month, 1).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
  });
};

const getMonthKeyFromIso = (isoDate?: string | null): string | null => {
  if (!isoDate) return null;
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, "0")}`;
};

const formatTransferDate = (isoDate: string): string => {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return isoDate;
  const day = `${date.getDate()}`.padStart(2, "0");
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const isValidImageUrl = (url?: string | null): boolean => {
  if (!url) return false;
  const invalid = ["null", "placeholder", "default.png", "logo.png"];
  const lower = url.toLowerCase();
  return !invalid.some((pattern) => lower.includes(pattern));
};

// Format fee for display
const formatFee = (fee?: string | null, feeValue?: number, type?: string): string => {
  // If type is "Free", return "Free"
  if (type?.toLowerCase().includes("free")) {
    return "Free";
  }
  
  // If we have a fee string, use it
  if (fee && fee.trim() && fee.toLowerCase() !== "free") {
    return fee;
  }
  
  // If we have a numeric fee value, format it
  if (feeValue && feeValue > 0) {
    if (feeValue >= 1000000) {
      return `€${(feeValue / 1000000).toFixed(1)}M`;
    } else if (feeValue >= 1000) {
      return `€${(feeValue / 1000).toFixed(0)}K`;
    }
    return `€${feeValue.toFixed(0)}`;
  }
  
  // Default based on type
  return type || "Transfer";
};

// Normalize transfer type for display
const normalizeTransferType = (type?: string | null): string => {
  if (!type) return "Transfer";
  
  const lower = type.toLowerCase();
  
  if (lower.includes("loan")) return "Loan";
  if (lower.includes("free")) return "Free";
  if (lower.includes("signed") || lower.includes("sign") || lower.includes("done")) return "Done";
  if (lower.includes("transfer")) return "Transfer";
  
  return type;
};

export default function PlayerDetailsTransfers({
  playerId,
  playerName = "",
  playerPhoto,
  playerAge,
  nationality,
  position,
  theme,
  playerColors,
  transferHistory = [],
  sport = "football", // ✅ Default to football
}: PlayerDetailsTransfersProps) {
  const isBasketball = sport === "basketball";
  console.log(`🏀⚽ [PlayerDetailsTransfers] Sport: ${sport}, isBasketball: ${isBasketball}`);
  console.log(`🎬 [PlayerDetailsTransfers] Component function called with playerId: ${playerId}`);
  
  const isDarkMode = theme.colors.background === "#2A2A2A";
  const [transfers, setTransfers] = useState<TransferItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialLoad, setInitialLoad] = useState(true);
  const [showAllTransfers, setShowAllTransfers] = useState(false);
  
  console.log(`🎬 [PlayerDetailsTransfers] Component state initialized, playerId: ${playerId}`);

  // ✅ 100% API-driven: Removed convertTransferHistory function - no longer using prop data fallback

  // Helper function to parse fee string to number
  const parseFeeToNumber = (feeStr: string | null | undefined): number => {
    if (!feeStr) return 0;
    const str = feeStr.toLowerCase().trim();
    if (str.includes("free") || str === "0") return 0;
    
    // Extract number from strings like "€1.5M", "$2M", "1.5M", etc.
    const match = str.match(/(\d+\.?\d*)/);
    if (!match) return 0;
    
    const num = parseFloat(match[1]);
    if (str.includes("m") || str.includes("million")) return num * 1000000;
    if (str.includes("k") || str.includes("thousand")) return num * 1000;
    return num;
  };

  // Fetch transfers from all available APIs (API-Football, SofaScore, etc.)
  const fetchTransfers = useCallback(async (forceRefresh = false) => {
    setError(null);
    if (!initialLoad || forceRefresh) {
      setLoading(true);
    }
    
    try {
      console.log(`🔍 [PlayerDetailsTransfers] Starting fetch for playerId: ${playerId} (type: ${typeof playerId})`);
      
      // Handle empty string, null, undefined, or invalid values
      if (!playerId || playerId === "" || playerId === "0" || playerId === 0) {
        console.warn(`⚠️ [PlayerDetailsTransfers] Empty or invalid playerId provided: ${playerId}`);
        setTransfers([]);
        setInitialLoad(false);
        return;
      }
      
      const numericPlayerId = typeof playerId === "string" ? parseInt(playerId, 10) : Number(playerId);
      console.log(`🔍 [PlayerDetailsTransfers] Parsed numericPlayerId: ${numericPlayerId}`);
      
      if (isNaN(numericPlayerId) || numericPlayerId <= 0) {
        console.error(`❌ [PlayerDetailsTransfers] Invalid player ID: ${playerId} -> ${numericPlayerId}`);
        setTransfers([]);
        setInitialLoad(false);
        return;
      }

      let allApiTransfers: any[] = [];
      const apiSources: string[] = [];
      const seenTransferIds = new Set<string>();

      console.log(`🚀 [PlayerDetailsTransfers] Starting API fetch sequence for player ${numericPlayerId}`);

      // Helper to add transfer if not duplicate
      const addTransferIfUnique = (transfer: any) => {
        const transferKey = `${transfer.date}-${transfer.fromTeam.name}-${transfer.toTeam.name}`;
        if (!seenTransferIds.has(transferKey)) {
          seenTransferIds.add(transferKey);
          allApiTransfers.push(transfer);
          console.log(`➕ [PlayerDetailsTransfers] Added transfer: ${transfer.fromTeam.name} -> ${transfer.toTeam.name} on ${transfer.date}`);
        } else {
          console.log(`⏭️ [PlayerDetailsTransfers] Skipped duplicate transfer: ${transfer.fromTeam.name} -> ${transfer.toTeam.name} on ${transfer.date}`);
        }
      };

      // Try API-Football first (via api-sports-service)
      console.log(`📍 [PlayerDetailsTransfers] About to attempt API-Football fetch...`);
      try {
        console.log(`🔄 [PlayerDetailsTransfers] Attempting API-Football fetch for player ${numericPlayerId}...`);
        
        console.log(`📥 [PlayerDetailsTransfers] Importing api-sports-service...`);
        const { createApiSportsService } = await import("@/services/api-sports-service");
        console.log(`✅ [PlayerDetailsTransfers] Successfully imported api-sports-service`);
        
        console.log(`🏭 [PlayerDetailsTransfers] Creating API service instance...`);
        const apiSportsService = createApiSportsService();
        console.log(`✅ [PlayerDetailsTransfers] API service instance created`);
        
        console.log(`📞 [PlayerDetailsTransfers] Calling API-Football getTransfers with playerId: ${numericPlayerId}...`);
        const response = await apiSportsService.getTransfers({ playerId: numericPlayerId });
        
        console.log(`📦 [PlayerDetailsTransfers] API-Football response received:`, {
          hasResponse: !!response,
          responseKeys: response ? Object.keys(response) : [],
          responseType: typeof response,
          responsePreview: JSON.stringify(response, null, 2).substring(0, 1000)
        });
        
        if (response?.response && Array.isArray(response.response)) {
          console.log(`📊 [PlayerDetailsTransfers] API-Football returned ${response.response.length} items`);
          
          if (response.response.length === 0) {
            console.log(`ℹ️ [PlayerDetailsTransfers] API-Football returned empty array - no transfers for player ${numericPlayerId}`);
          } else {
            // API-Football returns array of objects with player and transfers array
            response.response.forEach((item: any, index: number) => {
              console.log(`📋 [PlayerDetailsTransfers] Processing API-Football item ${index + 1}:`, {
                hasPlayer: !!item.player,
                hasTransfers: !!item.transfers,
                transfersCount: Array.isArray(item.transfers) ? item.transfers.length : 0,
                playerName: item.player?.name
              });
              
              if (item.player && item.transfers && Array.isArray(item.transfers)) {
                const playerInfo = item.player;
                console.log(`👤 [PlayerDetailsTransfers] Player info:`, playerInfo.name, `(${item.transfers.length} transfers)`);
                
                if (item.transfers.length === 0) {
                  console.log(`ℹ️ [PlayerDetailsTransfers] Player ${playerInfo.name} has no transfers in API-Football response`);
                }
                
                item.transfers.forEach((transfer: any, transferIndex: number) => {
                  console.log(`🔄 [PlayerDetailsTransfers] Processing transfer ${transferIndex + 1}:`, {
                    date: transfer.date,
                    hasTeams: !!transfer.teams,
                    fromTeam: transfer.teams?.out?.name,
                    toTeam: transfer.teams?.in?.name,
                    type: transfer.type
                  });
                  
                  if (transfer.date && transfer.teams) {
                    addTransferIfUnique({
                      id: `api-football-${numericPlayerId}-${transfer.date}-${transfer.teams.out?.id || 0}-${transfer.teams.in?.id || 0}`,
                      playerId: numericPlayerId,
                      playerName: playerInfo.name || playerName || "Unknown Player",
                      playerAge: playerInfo.age || playerAge,
                      nationality: playerInfo.nationality || nationality,
                      photo: playerInfo.photo || (playerInfo.id ? `https://media.api-sports.io/football/players/${playerInfo.id}.png` : null) || playerPhoto,
                      position: playerInfo.position || position,
                      fromTeam: {
                        name: transfer.teams.out?.name || "Unknown",
                        logo: transfer.teams.out?.logo || null,
                      },
                      toTeam: {
                        name: transfer.teams.in?.name || "Unknown",
                        logo: transfer.teams.in?.logo || null,
                      },
                      date: transfer.date,
                      type: transfer.type || "Transfer",
                      fee: transfer.fee || null,
                      feeValue: parseFeeToNumber(transfer.fee),
                    });
                  } else {
                    console.warn(`⚠️ [PlayerDetailsTransfers] Skipping transfer ${transferIndex + 1} - missing date or teams:`, {
                      hasDate: !!transfer.date,
                      hasTeams: !!transfer.teams,
                      transfer: transfer
                    });
                  }
                });
              } else {
                console.warn(`⚠️ [PlayerDetailsTransfers] Skipping item ${index + 1} - missing player or transfers array:`, {
                  hasPlayer: !!item.player,
                  hasTransfers: !!item.transfers,
                  isTransfersArray: Array.isArray(item.transfers)
                });
              }
            });
            
            if (allApiTransfers.length > 0) {
              apiSources.push("API-Football");
              console.log(`✅ [PlayerDetailsTransfers] API-Football successfully fetched ${allApiTransfers.length} transfers`);
            } else {
              console.log(`ℹ️ [PlayerDetailsTransfers] API-Football returned data but no valid transfers found after processing`);
            }
          }
        } else {
          console.log(`ℹ️ [PlayerDetailsTransfers] API-Football response format unexpected:`, {
            hasResponse: !!response?.response,
            isArray: Array.isArray(response?.response),
            responseType: typeof response?.response,
            responseStructure: response ? Object.keys(response) : []
          });
        }
      } catch (apiFootballError: any) {
        console.error(`❌ [PlayerDetailsTransfers] API-Football fetch failed:`, apiFootballError?.message || apiFootballError);
        console.error(`❌ [PlayerDetailsTransfers] API-Football error stack:`, apiFootballError?.stack);
        console.error(`❌ [PlayerDetailsTransfers] API-Football error details:`, {
          name: apiFootballError?.name,
          message: apiFootballError?.message,
          code: apiFootballError?.code,
          statusCode: apiFootballError?.statusCode,
          response: apiFootballError?.response
        });
      }

      // Try SofaScore API as additional/secondary source (combine with API-Football results)
      try {
        console.log(`🔄 [PlayerDetailsTransfers] Attempting SofaScore fetch for player ${numericPlayerId}...`);
        const { getPlayerTransfers } = await import("@/services/sofaScoreTransfersService");
        const sofaTransfers = await getPlayerTransfers(numericPlayerId) || [];
        
        console.log(`📦 [PlayerDetailsTransfers] SofaScore returned ${sofaTransfers.length} transfers`);
        
        if (sofaTransfers.length > 0) {
          sofaTransfers.forEach((t: any, index: number) => {
            console.log(`🔄 [PlayerDetailsTransfers] Processing SofaScore transfer ${index + 1}:`, {
              date: t.date,
              fromTeam: t.fromTeam?.name,
              toTeam: t.toTeam?.name
            });
            
            addTransferIfUnique({
              id: t.id,
              playerId: numericPlayerId,
              playerName: t.playerName || playerName || "Unknown Player",
              playerAge: t.playerAge || playerAge,
              nationality: t.nationality || nationality,
              photo: t.photo || playerPhoto || null,
              position: t.position || position,
              fromTeam: {
                name: t.fromTeam.name || "Unknown",
                logo: t.fromTeam.logo || null,
              },
              toTeam: {
                name: t.toTeam.name || "Unknown",
                logo: t.toTeam.logo || null,
              },
              date: t.date,
              type: t.type || "Transfer",
              fee: t.fee || null,
              feeValue: t.feeValue || 0,
            });
          });
          apiSources.push("SofaScore");
          console.log(`✅ [PlayerDetailsTransfers] SofaScore successfully fetched ${sofaTransfers.length} transfers`);
        } else {
          console.log(`ℹ️ [PlayerDetailsTransfers] SofaScore returned empty array`);
        }
      } catch (sofaError: any) {
        console.error(`❌ [PlayerDetailsTransfers] SofaScore fetch failed:`, sofaError?.message || sofaError);
        console.error(`❌ [PlayerDetailsTransfers] SofaScore error details:`, sofaError);
      }

      console.log(`📊 [PlayerDetailsTransfers] Summary: ${allApiTransfers.length} total transfers collected from ${apiSources.length} API(s)`);

      // ✅ 100% API-driven: Only use API data, no fallback to prop data
      if (allApiTransfers && allApiTransfers.length > 0) {
        console.log(`✅ [PlayerDetailsTransfers] Processing ${allApiTransfers.length} API transfers...`);
        
        const parsedTransfers: TransferItem[] = allApiTransfers.map((t, index) => {
          const monthKey = getMonthKeyFromIso(t.date) || "";
          const transfer = {
            id: t.id,
            playerId: numericPlayerId,
            playerName: t.playerName || playerName || "Unknown Player",
            playerAge: t.playerAge || playerAge,
            nationality: t.nationality || nationality,
            photo: t.photo || playerPhoto || null,
            position: t.position || position,
            fromTeam: {
              name: t.fromTeam.name || "Unknown",
              logo: t.fromTeam.logo || null,
            },
            toTeam: {
              name: t.toTeam.name || "Unknown",
              logo: t.toTeam.logo || null,
            },
            date: t.date,
            type: normalizeTransferType(t.type),
            fee: formatFee(t.fee, t.feeValue, t.type),
            feeValue: t.feeValue || 0,
            monthKey,
          };
          
          if (index < 3) {
            console.log(`📝 [PlayerDetailsTransfers] Parsed transfer ${index + 1}:`, {
              date: transfer.date,
              fromTeam: transfer.fromTeam.name,
              toTeam: transfer.toTeam.name,
              monthKey: transfer.monthKey
            });
          }
          
          return transfer;
        });

        // Sort by date (most recent first)
        const orderedTransfers = parsedTransfers.sort((a, b) => {
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          if (Number.isNaN(dateA) || Number.isNaN(dateB)) return 0;
          return dateB - dateA; // Most recent first
        });

        const apiSourceLabel = apiSources.length > 0 ? apiSources.join(" + ") : "Unknown";
        console.log(`✅ [PlayerDetailsTransfers] ✅ SUCCESS: Loaded ${orderedTransfers.length} transfers from ${apiSourceLabel} for player ${numericPlayerId}`);
        setTransfers(orderedTransfers);
        setInitialLoad(false);
      } else {
        // ✅ 100% API-driven: No fallback to prop data - show empty state if API returns no data
        console.log(`ℹ️ [PlayerDetailsTransfers] No transfers found from API for player ${numericPlayerId}`);
        setTransfers([]);
        setInitialLoad(false);
      }
    } catch (err) {
      console.error("Failed to load transfers", err);
      setError("Unable to load transfers. Please try again later.");
      setInitialLoad(false);
    } finally {
      setLoading(false);
    }
  }, [playerId, playerName, playerPhoto, playerAge, nationality, position, initialLoad]);

  // Log component props on mount/update
  useEffect(() => {
    console.log(`🎯 [PlayerDetailsTransfers] Component mounted/updated with props:`, {
      playerId,
      playerIdType: typeof playerId,
      playerName,
    });
  }, [playerId, playerName]);

  useEffect(() => {
    console.log(`🔄 [PlayerDetailsTransfers] useEffect triggered - playerId changed to: ${playerId}`);
    setInitialLoad(true);
    fetchTransfers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTransfers(true);
    setRefreshing(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerId]);

  // Group transfers by month (only show months that have transfers)
  const groupedTransfers = useMemo(() => {
    const groups = new Map<string, TransferItem[]>();
    
    transfers.forEach((item) => {
      if (!item.monthKey) return;
      const existing = groups.get(item.monthKey);
      if (existing) {
        existing.push(item);
      } else {
        groups.set(item.monthKey, [item]);
      }
    });

    // Sort transfers within each group by date (most recent first)
    groups.forEach((items) => {
      items.sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateB - dateA;
      });
    });

    // Return groups sorted by month key (most recent first)
    return Array.from(groups.entries())
      .map(([monthKey, transfers]) => ({
        monthKey,
        label: formatMonthLabel(monthKey),
        transfers,
      }))
      .sort((a, b) => {
        return b.monthKey.localeCompare(a.monthKey);
      });
  }, [transfers]);

  const renderTransferCard = (item: TransferItem) => {
    const transferType = item.type || "Transfer";
    const statusColor = playerColors.primary || "#FF3B30";
    
    let statusLabel = transferType;
    if (transferType === "Done") {
      statusLabel = "Done";
    } else if (transferType === "Loan") {
      statusLabel = "Loan";
    } else if (transferType === "Free") {
      statusLabel = "Free";
    } else {
      statusLabel = "Transfer";
    }

    const metaParts: string[] = [];
    if (item.nationality) metaParts.push(item.nationality);
    if (item.playerAge) metaParts.push(`${item.playerAge}`);
    if (item.position) metaParts.push(item.position);
    const metaLabel = metaParts.join(" / ");

    // Use team logo service for better logo resolution
    const fromLogoUrl = teamLogoService.getOfficialTeamLogo(
      item.fromTeam.name,
      "",
      item.fromTeam.logo || undefined
    );
    const toLogoUrl = teamLogoService.getOfficialTeamLogo(
      item.toTeam.name,
      "",
      item.toTeam.logo || undefined
    );

    const playerPhotoUrl = item.photo && isValidImageUrl(item.photo) ? item.photo : null;
    const transferDateLabel = formatTransferDate(item.date);

    return (
      <View
        style={[
          styles.transferCard,
          {
            backgroundColor: isDarkMode ? "#3A3A3A" : "#F5F5F5",
            borderBottomColor: isDarkMode
              ? "rgba(255, 255, 255, 0.1)"
              : "rgba(0, 0, 0, 0.1)",
          },
        ]}
      >
        <View style={styles.playerRow}>
          {/* Player Photo and Info */}
          <View style={styles.playerSection}>
            <View style={styles.playerPhotoCircle}>
              {playerPhotoUrl ? (
                <Image
                  source={{ uri: playerPhotoUrl }}
                  style={styles.playerPhoto}
                  resizeMode="cover"
                  onError={() => {
                    console.log(`Failed to load player photo: ${playerPhotoUrl}`);
                  }}
                />
              ) : (
                <View
                  style={[
                    styles.playerPhotoFallback,
                    { backgroundColor: isDarkMode ? "#2A2A2A" : "#FFFFFF" },
                  ]}
                >
                  <Text
                    style={[
                      styles.playerPhotoInitials,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    {item.playerName
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")
                      .substring(0, 2)
                      .toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.playerTextInfo}>
              <Text
                style={[styles.playerName, { color: theme.colors.text }]}
                numberOfLines={1}
              >
                {item.playerName}
              </Text>
              {metaLabel ? (
                <Text
                  style={[styles.playerMeta, { color: theme.colors.textSecondary }]}
                  numberOfLines={1}
                >
                  {metaLabel}
                </Text>
              ) : null}
            </View>
          </View>

          {/* Transfer Details Section */}
          <View style={styles.transferDetailsSection}>
            {/* Teams Row */}
            <View style={styles.teamsRow}>
              <View style={styles.teamInfoFrom}>
                <Text
                  style={[
                    styles.teamLabel,
                    { color: theme.colors.textSecondary },
                  ]}
                  numberOfLines={1}
                >
                  {item.fromTeam.name}
                </Text>
                <Image
                  source={{ uri: fromLogoUrl }}
                  style={styles.teamLogo}
                  resizeMode="contain"
                />
              </View>

              <View style={[styles.arrowBadge, { backgroundColor: statusColor }]}>
                <ArrowRight size={14} color="#FFFFFF" strokeWidth={3} />
              </View>

              <View style={styles.teamInfoTo}>
                <Image
                  source={{ uri: toLogoUrl }}
                  style={styles.teamLogo}
                  resizeMode="contain"
                />
                <Text
                  style={[
                    styles.teamLabel,
                    { color: theme.colors.textSecondary },
                  ]}
                  numberOfLines={1}
                >
                  {item.toTeam.name}
                </Text>
              </View>
            </View>

            {/* Date and Fee Row */}
            <View style={styles.dateAndFeeRow}>
              <Text
                style={[styles.dealText, { color: theme.colors.textSecondary }]}
                numberOfLines={1}
              >
                {transferDateLabel}
              </Text>
              <Text
                style={[styles.dealType, { color: statusColor }]}
                numberOfLines={1}
              >
                {item.fee || statusLabel}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  // Only show loading spinner if refreshing, not on initial load
  if (loading && refreshing) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={playerColors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
          Refreshing transfers...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={[styles.errorText, { color: theme.colors.text }]}>{error}</Text>
        <TouchableOpacity
          style={[styles.retryButton, { borderColor: playerColors.primary }]}
          onPress={onRefresh}
        >
          <Text style={[styles.retryButtonText, { color: playerColors.primary }]}>
            Retry
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Flatten all transfers for counting and limiting
  const allTransfers = useMemo(() => {
    return groupedTransfers.flatMap(group => group.transfers);
  }, [groupedTransfers]);

  const hasMoreThanThree = allTransfers.length > 3;
  
  // Get displayed transfers (first 3 if collapsed, all if expanded)
  const displayedTransfersList = showAllTransfers 
    ? allTransfers 
    : allTransfers.slice(0, 3);

  // Re-group displayed transfers by month
  const displayedTransfers = useMemo(() => {
    const groups = new Map<string, TransferItem[]>();
    
    displayedTransfersList.forEach((item) => {
      if (!item.monthKey) return;
      const existing = groups.get(item.monthKey);
      if (existing) {
        existing.push(item);
      } else {
        groups.set(item.monthKey, [item]);
      }
    });

    return Array.from(groups.entries())
      .map(([monthKey, transfers]) => ({
        monthKey,
        label: formatMonthLabel(monthKey),
        transfers,
      }))
      .sort((a, b) => {
        return b.monthKey.localeCompare(a.monthKey);
      });
  }, [displayedTransfersList]);

  console.log(`🎨 [PlayerDetailsTransfers] Rendering component - transfers: ${transfers.length}, displayedTransfers: ${displayedTransfers.length}, loading: ${loading}, error: ${error}, playerId: ${playerId}`);

  return (
    <View style={[styles.section, { backgroundColor: isDarkMode ? "#3A3A3A" : "#F5F5F5" }]}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Transfers (EUR)
        </Text>
        {hasMoreThanThree && (
          <TouchableOpacity
            style={styles.expandButton}
            onPress={() => setShowAllTransfers(!showAllTransfers)}
          >
            {showAllTransfers ? (
              <ChevronUp size={20} color={playerColors.primary || "#FF3B30"} />
            ) : (
              <ChevronDown size={20} color={playerColors.primary || "#FF3B30"} />
            )}
          </TouchableOpacity>
        )}
      </View>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[playerColors.primary]}
            tintColor={playerColors.primary}
          />
        }
      >
        {displayedTransfers.length > 0 ? (
          displayedTransfers.map((group) => (
            <View key={`month-${group.monthKey}`} style={styles.monthGroup}>
              <Text style={[styles.monthHeader, { color: theme.colors.text }]}>
                {group.label}
              </Text>
              {group.transfers.map((transfer) => (
                <View key={transfer.id}>{renderTransferCard(transfer)}</View>
              ))}
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              No transfer history available
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 4,
    marginBottom: 4,
    paddingTop: 16,
    paddingBottom: 16,
    borderRadius: 0,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  expandButton: {
    padding: 4,
    borderRadius: 20,
    backgroundColor: "transparent",
  },
  container: {
    flex: 1,
    maxHeight: 600, // Limit height for scrollable content
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
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
    borderRadius: 20,
    borderWidth: 1,
  },
  retryButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },
  listContent: {
    paddingHorizontal: 0,
    paddingBottom: 32,
  },
  monthGroup: {
    marginBottom: 24,
  },
  monthHeader: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  transferCard: {
    borderRadius: 0,
    padding: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
    borderBottomWidth: 1,
  },
  playerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  playerSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  playerPhotoCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: "rgba(128, 128, 128, 0.05)",
    borderColor: "rgba(128, 128, 128, 0.08)",
    overflow: "hidden",
  },
  playerPhoto: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  playerPhotoFallback: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(128, 128, 128, 0.2)",
  },
  playerPhotoInitials: {
    fontSize: 10,
    fontWeight: "600",
    fontFamily: "Inter-SemiBold",
  },
  playerTextInfo: {
    justifyContent: "center",
  },
  playerName: {
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 2,
  },
  playerMeta: {
    fontSize: 9,
  },
  transferDetailsSection: {
    flex: 1,
    alignItems: "flex-end",
    paddingLeft: 8,
  },
  teamsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
    marginBottom: 8,
    width: "100%",
  },
  teamInfoFrom: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    flex: 1,
    justifyContent: "flex-end",
    minWidth: 0,
  },
  teamInfoTo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    flex: 1,
    justifyContent: "flex-start",
    minWidth: 0,
  },
  teamLogo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "transparent",
  },
  teamLabel: {
    fontSize: 11,
    fontWeight: "600",
    flexShrink: 1,
  },
  arrowBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  dateAndFeeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  dealText: {
    fontSize: 10,
    fontWeight: "500",
  },
  dealType: {
    fontSize: 11,
    fontWeight: "700",
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
  },
});

