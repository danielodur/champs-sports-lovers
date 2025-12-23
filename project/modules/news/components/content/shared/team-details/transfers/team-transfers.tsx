/**
 * Team Transfers Tab
 * Displays recent transfers for a specific team
 * Integrates with API Football
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
} from "react-native";
import { ArrowRight } from "lucide-react-native";
import teamLogoService from "@/services/teamLogoService";
import { createApiSportsService } from "@/services/api-sports-service";

interface TeamTransfersProps {
  teamId?: number;
  teamName: string;
  season: string;
  theme: any;
  sport?: string; // ✅ Sport parameter (football/basketball)
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

export default function TeamTransfers({ teamId, teamName, season, theme, sport = "football" }: TeamTransfersProps) {
  const isDarkMode = theme.colors.backgroundSecondary !== "#F5F5F5";
  const isBasketball = sport === "basketball"; // ✅ Detect basketball
  const [transfers, setTransfers] = useState<TransferItem[]>([]);
  const [monthBuckets, setMonthBuckets] = useState<string[]>(() =>
    buildMonthBuckets(new Date().getFullYear(), 6)
  );
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch transfers from API Football for this specific team
  const fetchTransfers = useCallback(async (forceRefresh = false) => {
    setError(null);
    setLoading(true);
    
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

      // Fetch transfers for this specific team
      if (teamId) {
        try {
          // Use API service instead of direct fetch - ensures proper retry and error handling
          const transfersResponse = await apiSportsService.getTransfers({ teamId });
          const apiTransfers = transfersResponse?.response || [];

            // Track unique transfers to avoid duplicates
            const seenTransferIds = new Set<string>();

            apiTransfers.forEach((item: any) => {
              if (!item.player || !item.transfers || !Array.isArray(item.transfers)) {
                return;
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

                // Create unique ID for this transfer
                const transferId = `${item.player.id}-${transferDateIso}-${transfer.teams.out?.id || 0}-${transfer.teams.in?.id || 0}`;
                
                // Skip if we've already seen this transfer
                if (seenTransferIds.has(transferId)) {
                  return;
                }
                seenTransferIds.add(transferId);

                // Extract fee information
                const transferFee = transfer.fee || null;
                const transferType = transfer.type || "Transfer";
                const feeValue = parseFeeToNumber(transferFee);
                
                // Get player photo - use API photo or fallback to official API Football player image
                let playerPhoto = item.player.photo;
                if (!isValidImageUrl(playerPhoto)) {
                  // Fallback to official API Football player image URL
                  playerPhoto = `https://media.api-sports.io/football/players/${item.player.id}.png`;
                }
                
                parsedTransfers.push({
                  id: transferId,
                  playerId: item.player.id,
                  playerName: item.player.name || "Unknown Player",
                  playerAge: item.player.age,
                  nationality: item.player.nationality || "",
                  photo: playerPhoto,
                  position: item.player.position || "",
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
          console.error("API fetch failed:", err);
          setError("Failed to load transfers. Please try again.");
        }
      } else {
        setError("Team ID not available");
      }

      // Sort by date (most recent first)
      const orderedTransfers = parsedTransfers.sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        if (Number.isNaN(dateA) || Number.isNaN(dateB)) return 0;
        return dateB - dateA; // Most recent first
      });

      setTransfers(orderedTransfers);
    } catch (err) {
      console.error("Failed to load transfers", err);
      setError("Unable to load transfers. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [teamId, teamName, season, apiSportsService]);

  useEffect(() => {
    if (teamId) {
      // Fetch transfers when team or season changes
      fetchTransfers();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }
  }, [teamId, season]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTransfers(true); // Force refresh
    setRefreshing(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId, teamName, season]);

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

    // Use team logo service for consistent logo display
    const fromLogoUrl = teamLogoService.getOfficialTeamLogo(
      item.fromTeam.name,
      undefined,
      item.fromTeam.logo || undefined
    );
    const toLogoUrl = teamLogoService.getOfficialTeamLogo(
      item.toTeam.name,
      undefined,
      item.toTeam.logo || undefined
    );

    // Use official player photo (already processed with fallback in fetch)
    const playerPhoto = item.photo && isValidImageUrl(item.photo) ? item.photo : null;

    const transferDateLabel = formatTransferDate(item.date);

    return (
      <View
        key={item.id}
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
                />
              ) : null}
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

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
          Loading transfers...
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
            {group.transfers.map(renderTransferCard)}
          </View>
        ))
      ) : (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            No transfers available for this team.
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

