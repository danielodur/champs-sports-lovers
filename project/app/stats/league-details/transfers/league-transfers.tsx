/**
 * League Transfers Tab
 * Displays recent transfers in the league
 * Integrates with API Football and TheSportsDB
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  ImageSourcePropType,
} from "react-native";
import { ArrowRight } from "lucide-react-native";
import teamLogoService from "@/services/teamLogoService";

interface LeagueTransfersProps {
  leagueId: string;
  season: string;
  theme: any;
  apiLeagueId?: number | null; // API ID passed from parent
  sport?: string; // ✅ CRITICAL: Add sport parameter
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

import { createApiSportsService } from "@/services/api-sports-service";

const apiSportsService = createApiSportsService();

// Helper functions
const buildMonthBuckets = (seasonStartYear: number, range = 12): string[] => {
  const months: string[] = [];
  // Build months for the season: July of start year to June of end year
  // For season "24-25": July 2024 to June 2025
  const seasonEndYear = seasonStartYear + 1;
  
  // Add months from July to December of start year
  for (let month = 7; month <= 12; month++) {
    const key = `${seasonStartYear}-${`${month}`.padStart(2, "0")}`;
    months.push(key);
  }
  
  // Add months from January to June of end year
  for (let month = 1; month <= 6; month++) {
    const key = `${seasonEndYear}-${`${month}`.padStart(2, "0")}`;
    months.push(key);
  }
  
  return months.reverse(); // Reverse to show most recent first
};

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

// Parse fee string to number (in EUR)
const parseFeeToNumber = (fee?: string | null): number => {
  if (!fee) return 0;
  const lower = fee.toLowerCase();
  
  // Handle "Free" transfers
  if (lower.includes("free")) return 0;
  
  // Extract numbers from strings like "€50M", "50M", "€500K", etc.
  const match = lower.match(/(\d+(?:\.\d+)?)\s*([km])?/);
  if (!match) return 0;
  
  const value = parseFloat(match[1]);
  const multiplier = match[2] === "m" ? 1000000 : match[2] === "k" ? 1000 : 1;
  
  return value * multiplier;
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

// ✅ REMOVED: Local getLeagueApiId function - use the one from parent component instead
// This ensures A-League (188) and all other leagues are properly mapped

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
  };
  return leagueNameMap[leagueId] || "League";
};

export default function LeagueTransfers({ leagueId, season, theme, apiLeagueId: apiLeagueIdProp, sport = "football" }: LeagueTransfersProps) {
  const isDarkMode = theme.colors.backgroundSecondary !== "#F5F5F5";
  const isBasketball = sport === "basketball";
  const [transfers, setTransfers] = useState<TransferItem[]>([]);
  const [monthBuckets, setMonthBuckets] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Show data immediately as it loads (no blocking spinner)
  const [initialLoad, setInitialLoad] = useState(true);

  const leagueName = getLeagueName(leagueId);
  
  // ✅ Safety check: Transfers are only available for football
  if (isBasketball) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
          Transfers are not available for basketball leagues.
        </Text>
      </View>
    );
  }
  
  // ✅ CRITICAL: Use provided API ID or import from parent component to get full mapping including A-League
  const resolvedApiLeagueId = useMemo(() => {
    if (apiLeagueIdProp !== undefined) {
      return apiLeagueIdProp;
    }
    // Import the function from parent component to get complete league mapping
    const { getLeagueApiId: getParentLeagueApiId } = require("../[leagueId]");
    return getParentLeagueApiId(leagueId, undefined, sport);
  }, [apiLeagueIdProp, leagueId, sport]);

  // Fetch transfers from API Football
  const fetchTransfers = useCallback(async (forceRefresh = false) => {
    setError(null);
    // Don't show loading spinner on initial load - display data as it comes
    if (!initialLoad || forceRefresh) {
      setLoading(true);
    }
    
    try {
      // Parse season: handle both "24-25" and "2024-2025" formats
      const seasonParts = season.split("-");
      const firstPart = parseInt(seasonParts[0]);
      // If first part is > 2000, it's already a full year, otherwise add 2000
      const seasonStartYear = firstPart > 2000 ? firstPart : 2000 + firstPart;
      const seasonEndYear = seasonStartYear + 1;
      
      // Build month buckets for the selected season
      const monthKeys = buildMonthBuckets(seasonStartYear, 12);
      setMonthBuckets(monthKeys);
      const monthKeySet = new Set(monthKeys);
      const parsedTransfers: TransferItem[] = [];

      // Fetch transfers using API service
      if (resolvedApiLeagueId) {
        try {
          // Fetch league standings to get teams (faster than separate teams call)
          const standingsResponse = await apiSportsService.getStandings(resolvedApiLeagueId, seasonStartYear);
          const standings = standingsResponse?.response?.[0]?.league?.standings?.[0] || [];

          // OPTIMIZED: Fetch transfers for more teams to get better coverage (top 12 teams)
          const teamIds = standings.slice(0, 12).map((t: any) => t.team.id);
          
          if (teamIds.length === 0) {
            console.warn(`⚠️ No team IDs found! Standings structure:`, JSON.stringify(standingsResponse, null, 2));
          }

          // Process teams in parallel batches to speed up fetching
          const batchSize = 5; // Increased batch size for faster performance
          for (let i = 0; i < teamIds.length; i += batchSize) {
            const batch = teamIds.slice(i, i + batchSize);
            const batchTransfers: TransferItem[] = [];
            
            await Promise.all(
              batch.map(async (teamId: number) => {
                try {
                  const transfersResponse = await apiSportsService.getTransfers({ teamId });
                  const apiTransfers = transfersResponse?.response || [];

                  apiTransfers.forEach((item: any) => {
                    // Validate player data exists
                    if (!item.player || !item.transfers || !Array.isArray(item.transfers)) {
                      return;
                    }

                    // Extract player information once
                    const playerId = item.player?.id;
                    const playerName = item.player?.name || "Unknown Player";
                    const playerAge = item.player?.age;
                    const playerNationality = item.player?.nationality || "";
                    const playerPosition = item.player?.position || "";
                    
                    // Get player photo - use API photo or fallback to official API Football player image
                    let playerPhoto = item.player?.photo;
                    if (!isValidImageUrl(playerPhoto) && playerId) {
                      // Fallback to official API Football player image URL
                      playerPhoto = `https://media.api-sports.io/football/players/${playerId}.png`;
                    }

                    item.transfers.forEach((transfer: any) => {
                      // Extract the original ISO date string
                      const transferDateIso = transfer.date;
                      if (!transferDateIso) {
                        return;
                      }

                      const monthKey = getMonthKeyFromIso(transferDateIso);
                      if (!monthKey || !monthKeySet.has(monthKey)) {
                        return;
                      }

                      const transferYear = parseInt(monthKey.split("-")[0]);
                      const transferMonth = parseInt(monthKey.split("-")[1]);
                      
                      // Strict season filtering: only transfers within the selected season
                      // Season runs from July (month 7) to June (month 6) of next year
                      const isInSeason = 
                        (transferYear === seasonStartYear && transferMonth >= 7) || // July-December of start year
                        (transferYear === seasonEndYear && transferMonth <= 6);     // January-June of end year
                      
                      if (!isInSeason) {
                        return; // Skip transfers outside the selected season
                      }

                      // Create unique ID for this transfer (include both team IDs to avoid duplicates)
                      const transferId = `${playerId}-${transferDateIso}-${transfer.teams.out?.id || 0}-${transfer.teams.in?.id || 0}`;
                      
                      // Extract fee information
                      const transferFee = transfer.fee || null;
                      const transferType = transfer.type || "Transfer";
                      const feeValue = parseFeeToNumber(transferFee);

                      batchTransfers.push({
                        id: transferId,
                        playerId: playerId,
                        playerName: playerName,
                        playerAge: playerAge,
                        nationality: playerNationality,
                        photo: playerPhoto,
                        position: playerPosition,
                        fromTeam: {
                          name: transfer.teams.out?.name || "Unknown",
                          logo: transfer.teams.out?.logo || null,
                        },
                        toTeam: {
                          name: transfer.teams.in?.name || "Unknown",
                          logo: transfer.teams.in?.logo || null,
                        },
                        date: transferDateIso, // Use original ISO date string
                        type: normalizeTransferType(transferType),
                        fee: formatFee(transferFee, feeValue, transferType),
                        feeValue: feeValue,
                        monthKey,
                      });
                    });
                  });
                } catch (err) {
                  console.error(`❌ Failed to fetch transfers for team ${teamId}:`, err instanceof Error ? err.message : String(err));
                }
              })
            );
            
            // Add batch transfers to main array
            parsedTransfers.push(...batchTransfers);
            
            // Update state incrementally after each batch for faster display
            if (parsedTransfers.length > 0) {
              const uniqueTransfersMap = new Map<string, TransferItem>();
              parsedTransfers.forEach((transfer) => {
                if (!uniqueTransfersMap.has(transfer.id)) {
                  uniqueTransfersMap.set(transfer.id, transfer);
                }
              });
              const currentUnique = Array.from(uniqueTransfersMap.values());
              const ordered = currentUnique.sort((a, b) => {
                const dateA = new Date(a.date).getTime();
                const dateB = new Date(b.date).getTime();
                if (Number.isNaN(dateA) || Number.isNaN(dateB)) return 0;
                return dateB - dateA;
              });
              setTransfers(ordered);
              setInitialLoad(false);
            }
              
            // Small delay between batches to respect rate limits
            if (i + batchSize < teamIds.length) {
              await new Promise(resolve => setTimeout(resolve, 100)); // Reduced delay for faster loading
            }
          }
        } catch (err) {
          console.error("❌ API fetch failed:", err instanceof Error ? err.message : String(err));
          setError("Failed to load transfers. Please try again.");
        }
      } else {
        setError("League not found");
      }

      // Remove duplicates based on unique ID
      const uniqueTransfersMap = new Map<string, TransferItem>();
      parsedTransfers.forEach((transfer) => {
        if (!uniqueTransfersMap.has(transfer.id)) {
          uniqueTransfersMap.set(transfer.id, transfer);
        }
      });
      const uniqueTransfers = Array.from(uniqueTransfersMap.values());

      // Sort by date (most recent first)
      const orderedTransfers = uniqueTransfers.sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        if (Number.isNaN(dateA) || Number.isNaN(dateB)) return 0;
        return dateB - dateA; // Most recent first
      });

      setTransfers(orderedTransfers);
      setInitialLoad(false);
    } catch (err) {
      console.error("Failed to load transfers", err);
      setError("Unable to load transfers. Please try again later.");
      setInitialLoad(false);
    } finally {
      setLoading(false);
    }
  }, [leagueId, season, apiSportsService]);

  useEffect(() => {
    // Reset initialLoad when league or season changes
    setInitialLoad(true);
    // Fetch transfers when league or season changes
    fetchTransfers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leagueId, season]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTransfers(true); // Force refresh
    setRefreshing(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leagueId, season]);

  // Group transfers by month (only show months that have transfers)
  const groupedTransfers = useMemo(() => {
    const groups = new Map<string, TransferItem[]>();
    
    // Group transfers by their month key
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
    groups.forEach((items, key) => {
      items.sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateB - dateA;
      });
    });

    // Return groups sorted by month key (most recent first)
    // Only include months that have transfers
    return Array.from(groups.entries())
      .map(([monthKey, transfers]) => ({
        monthKey,
        label: formatMonthLabel(monthKey),
        transfers,
      }))
      .sort((a, b) => {
        // Sort by month key descending (most recent first)
        return b.monthKey.localeCompare(a.monthKey);
      });
  }, [transfers]);

  const renderTransferCard = (item: TransferItem) => {
    // Use normalized type from data
    const transferType = item.type || "Transfer";
    const statusColor = "#FF3B30"; // Red color for all transfers
    
    // Determine display label based on type
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

    const fromLogoUrl = teamLogoService.getOfficialTeamLogo(
      item.fromTeam.name,
      leagueName,
      item.fromTeam.logo || undefined
    );
    const toLogoUrl = teamLogoService.getOfficialTeamLogo(
      item.toTeam.name,
      leagueName,
      item.toTeam.logo || undefined
    );

    // Use official player photo (already processed with fallback in fetch)
    const playerPhoto = item.photo && isValidImageUrl(item.photo) ? item.photo : null;

    const transferDateLabel = formatTransferDate(item.date);

    return (
      <View
        style={[styles.transferCard, { backgroundColor: theme.colors.backgroundSecondary }]}
      >
        <View style={styles.playerRow}>
          {/* Player Photo and Info */}
          <View style={styles.playerSection}>
            <View style={styles.playerPhotoCircle}>
              {playerPhoto ? (
                <Image
                  source={{ uri: playerPhoto }}
                  style={styles.playerPhoto}
                  resizeMode="cover"
                  onError={() => {
                    // Silently handle image load errors - fallback already handled
                    console.log(`Failed to load player photo: ${playerPhoto}`);
                  }}
                />
              ) : (
                // Fallback placeholder when no photo available
                <View style={[styles.playerPhotoFallback, { backgroundColor: theme.colors.backgroundSecondary }]}>
                  <Text style={[styles.playerPhotoInitials, { color: theme.colors.textSecondary }]}>
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
              <Text style={[styles.playerName, { color: theme.colors.text }]} numberOfLines={1}>
                {item.playerName}
              </Text>
              {metaLabel ? (
                <Text style={[styles.playerMeta, { color: theme.colors.textSecondary }]} numberOfLines={1}>
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
                  style={[styles.teamLabel, { color: theme.colors.textSecondary }]}
                  numberOfLines={1}
                >
                  {item.toTeam.name}
                </Text>
              </View>
            </View>

            {/* Date and Fee Row */}
            <View style={styles.dateAndFeeRow}>
              <Text style={[styles.dealText, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                {transferDateLabel}
              </Text>
              <Text style={[styles.dealType, { color: "#FF3B30" }]} numberOfLines={1}>
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
        <ActivityIndicator size="large" color={theme.colors.primary} />
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
          style={[styles.retryButton, { borderColor: theme.colors.primary }]}
          onPress={onRefresh}
        >
          <Text style={[styles.retryButtonText, { color: theme.colors.primary }]}>
            Retry
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.listContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[theme.colors.primary]}
          tintColor={theme.colors.primary}
        />
      }
    >
      {groupedTransfers.length > 0 ? (
        groupedTransfers.map((group) => (
          <View key={`month-${group.monthKey}`} style={styles.monthGroup}>
            <Text style={[styles.monthHeader, { color: theme.colors.text }]}>
              {group.label}
            </Text>
            {group.transfers.map((transfer) => (
              <View key={transfer.id}>
                {renderTransferCard(transfer)}
              </View>
            ))}
          </View>
        ))
      ) : (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            No transfers available for this league.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 16,
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
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
    borderBottomColor: "rgba(128, 128, 128, 0.2)",
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
