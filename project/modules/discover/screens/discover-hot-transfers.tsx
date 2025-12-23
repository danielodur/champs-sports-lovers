import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
} from "react";
import {
  ActivityIndicator,
  Image,
  ImageSourcePropType,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/hooks/useTheme";
import ApiSportsService from "@/services/api-sports-service";
import { ArrowRight, ChevronDown, ArrowLeft } from "lucide-react-native";
import DiscoverHotTransfersFilterSports, {
  DiscoverHotTransfersFilterStatus,
} from "./discover-hot-transfers-filter-sports";
import { useRouter } from "expo-router";
import getPlayerImage, {
  hasRealImage as hasRealPlayerImage,
} from "@/assets/images/players";
import getEnglishPLTeamImage from "@/assets/images/english-pl";
import getLaLigaTeamImage from "@/assets/images/la liga";
import theSportsDbApiService from "@/services/theSportsDbApiService";
import { getPlayerTransfers as getSofaPlayerTransfers, searchPlayers as searchSofaPlayers } from "@/services/sofaScoreTransfersService";
import { englishPLTeams } from "./english-pl-teams/english-pl-config";
import { laLigaTeams } from "./la-liga-teams/la-liga-config";
import { bundesligaTeams } from "./bundesliga-teams/bundesliga-config";
import { serieATeams } from "./serie-a-teams/serie-a-config";
import { ligue1Teams } from "./league-1-teams/league-1-config";

const apiSportsService = new ApiSportsService({
  apiKey: process.env.EXPO_PUBLIC_API_FOOTBALL_KEY || "",
  enableCaching: true,
  cacheExpiry: 2 * 60 * 1000,
});

const statusOptions = [
  { id: "all", label: "All" },
  { id: "done", label: "Done Deal" },
  { id: "loan", label: "On Loan" },
  { id: "transfer", label: "Transfers" },
];

const sportFilters = [
  { id: "football", label: "Football" },
  { id: "basketball", label: "Basketball" },
  { id: "rugby", label: "Rugby" },
];

const footballLeagues: {
  id: string;
  label: string;
  keywords: string[];
  apiLeagueId?: number;
}[] = [
  { id: "english-pl", label: "English PL", keywords: ["premier league", "england"], apiLeagueId: 39 },
  { id: "la-liga", label: "La Liga", keywords: ["la liga", "spain"], apiLeagueId: 140 },
  { id: "bundesliga", label: "Bundesliga", keywords: ["bundesliga", "germany"], apiLeagueId: 78 },
  { id: "serie-a", label: "Serie A", keywords: ["serie a", "italy"], apiLeagueId: 135 },
  { id: "ligue-1", label: "League 1", keywords: ["ligue 1", "france"], apiLeagueId: 61 },
  { id: "ugandan-pl", label: "Ugandan PL", keywords: ["uganda", "ugandan"] },
  { id: "kenyan-pl", label: "Kenyan PL", keywords: ["kenya", "kenyan"] },
  { id: "rwandan-pl", label: "Rwanda PL", keywords: ["rwanda", "rwandan"] },
  { id: "tanzanian-pl", label: "Tanzanian PL", keywords: ["tanzania", "tanzanian"] },
  { id: "nigerian-sl", label: "Nigerian SL", keywords: ["nigeria", "nigerian"] },
  { id: "egyptian-pl", label: "Egyptian PL", keywords: ["egypt", "egyptian"] },
  { id: "senegal-sl", label: "Senegal SL", keywords: ["senegal", "senegalese"] },
  { id: "saudi-pro", label: "Saudi Pro L", keywords: ["saudi", "pro league"] },
  { id: "australian-al", label: "Australian AL", keywords: ["a-league", "australia"] },
  { id: "japanese-jl", label: "Japanese JL", keywords: ["j league", "japanese"] },
];

const mapTeamApiNames = (teams: Array<{ apiName: string }>): string[] =>
  teams.map((team) => team.apiName);

const leagueTeamMap: Record<string, string[]> = {
  "english-pl": mapTeamApiNames(englishPLTeams),
  "la-liga": mapTeamApiNames(laLigaTeams),
  bundesliga: mapTeamApiNames(bundesligaTeams),
  "serie-a": mapTeamApiNames(serieATeams),
  "ligue-1": mapTeamApiNames(ligue1Teams),
};

const SPORTS_DB_TEAM_LIMIT = 8;

type TransferStatusFilter = "all" | "done" | "loan" | "transfer";

const monthsToFetch = 6; // Reduced from 12 to 6 months for faster loading

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
  season?: string;
  league?: string;
  monthKey: string;
}

const isValidImageUrl = (url?: string | null): boolean => {
  if (!url) return false;
  const invalid = ["null", "placeholder", "default.png", "logo.png"];
  const lower = url.toLowerCase();
  return !invalid.some((pattern) => lower.includes(pattern));
};

const buildMonthBuckets = (reference: Date, range = 12): string[] => {
  const months: string[] = [];
  const current = new Date(reference.getFullYear(), reference.getMonth(), 1);
  for (let i = 0; i < range; i += 1) {
    const month = new Date(current.getFullYear(), current.getMonth() - i, 1);
    const key = `${month.getFullYear()}-${`${month.getMonth() + 1}`.padStart(2, "0")}`;
    months.push(key);
  }
  return months;
};

const toIsoDate = (date: Date): string => date.toISOString().split("T")[0];

const buildMonthDateSamples = (monthKey: string): string[] => {
  const [yearStr, monthStr] = monthKey.split("-");
  const year = Number(yearStr);
  const monthIndex = Number(monthStr) - 1;
  if (Number.isNaN(year) || Number.isNaN(monthIndex)) {
    return [];
  }

  const samples = [1, 10, 20].map(
    (day) => new Date(year, monthIndex, day),
  );
  const lastDay = new Date(year, monthIndex + 1, 0);
  samples.push(lastDay);

  const isoSamples = samples
    .filter((date) => date.getMonth() === monthIndex)
    .map((date) => toIsoDate(date));

  const unique = Array.from(new Set(isoSamples));
  return unique;
};

const parseFeeToNumber = (fee?: string | null): number => {
  if (!fee) return 0;
  const normalized = fee.replace(/,/g, "").toLowerCase();
  const match = normalized.match(/([0-9]+\.?[0-9]*)(\s*)(b|bn|m|mn|k)?/i);
  if (!match) return 0;
  const value = parseFloat(match[1]);
  if (Number.isNaN(value)) return 0;
  const suffix = match[3];
  if (!suffix) return value;
  if (suffix.startsWith("b")) return value * 1_000_000_000;
  if (suffix.startsWith("m")) return value * 1_000_000;
  if (suffix.startsWith("k")) return value * 1_000;
  return value;
};

const extractFeeFromType = (type?: string | null): { label?: string; value: number } => {
  if (!type) return { value: 0 };
  const feeMatch = type.match(/€\s?([0-9]+\.?[0-9]*)(b|m|k)?/i);
  if (!feeMatch) return { value: 0 };
  const numeric = parseFloat(feeMatch[1]);
  if (Number.isNaN(numeric)) return { value: 0 };
  let value = numeric;
  const suffix = feeMatch[2]?.toLowerCase();
  if (suffix === "b") value *= 1_000_000_000;
  if (suffix === "m") value *= 1_000_000;
  if (suffix === "k") value *= 1_000;
  return {
    label: `€${numeric}${suffix ? suffix.toUpperCase() : ""}`,
    value,
  };
};

const formatTransferDate = (isoDate: string): string => {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return isoDate;
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}/${month}/${day}`;
};

const getMonthKeyFromIso = (isoDate?: string | null): string | null => {
  if (!isoDate) return null;
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, "0")}`;
};

const getMonthKeyFromDate = (date: Date): string => {
  return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, "0")}`;
};

const computeSeasonYears = (date: Date, span = 2): number[] => {
  const month = date.getMonth() + 1;
  const baseSeason = month >= 7 ? date.getFullYear() : date.getFullYear() - 1;
  return Array.from({ length: span }, (_, index) => baseSeason - index);
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

const hashStringToNumber = (value: string): number => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const getTeamLogoSource = (
  teamName?: string,
  fallbackLogo?: string | null,
): ImageSourcePropType | null => {
  if (!teamName) {
    if (fallbackLogo && isValidImageUrl(fallbackLogo)) {
      return { uri: fallbackLogo };
    }
    return null;
  }

  const trimmedName = teamName.trim();
  const englishBadge = getEnglishPLTeamImage(trimmedName);
  if (englishBadge) return englishBadge;

  const laLigaBadge = getLaLigaTeamImage(trimmedName);
  if (laLigaBadge) return laLigaBadge;

  if (fallbackLogo && isValidImageUrl(fallbackLogo)) {
    return { uri: fallbackLogo };
  }

  return null;
};

const getTeamNamesForLeague = (leagueLabel: string): string[] => {
  const league = footballLeagues.find((item) => item.label === leagueLabel);
  if (!league) return [];
  const teamNames = leagueTeamMap[league.id];
  if (!teamNames) return [];
  return teamNames;
};

export default function DiscoverHotTransfersScreen() {
  const theme = useTheme();
  const [statusFilter, setStatusFilter] = useState<TransferStatusFilter>("all");
  const [sportFilter, setSportFilter] = useState("football");
  const [selectedLeague, setSelectedLeague] = useState("All Teams");
  const [transfers, setTransfers] = useState<TransferItem[]>([]);
  const [monthBuckets, setMonthBuckets] = useState<string[]>(() =>
    buildMonthBuckets(new Date(), monthsToFetch),
  );
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sportMenuVisible, setSportMenuVisible] = useState(false);
  const [statusMenuVisible, setStatusMenuVisible] = useState(false);
  const [statusAnchor, setStatusAnchor] = useState<
    {
      x: number;
      y: number;
      width: number;
      height: number;
    } | null
  >(null);
  const router = useRouter();
  const statusButtonRef = useRef<React.ComponentRef<typeof TouchableOpacity> | null>(null);

  const fetchTransfers = useCallback(async (referenceDate: Date) => {
    if (sportFilter !== "football") {
      setTransfers([]);
      setMonthBuckets(buildMonthBuckets(referenceDate, monthsToFetch));
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const monthKeys = buildMonthBuckets(referenceDate, monthsToFetch);
      setMonthBuckets(monthKeys);
      const monthKeySet = new Set(monthKeys);

      const parsedTransfers: TransferItem[] = [];
      const ingestTransferPayload = (payload: any[] | undefined | null) => {
        if (!Array.isArray(payload)) return;
        payload.forEach((playerBlock) => {
          const player = playerBlock?.player;
          const history = playerBlock?.transfers;
          if (!player || !Array.isArray(history)) return;

          history.forEach((move: any, index: number) => {
            const moveId = `${player.id || "player"}-${move.date || index}-${move?.teams?.in?.id || move?.teams?.in?.name || "dest"}`;
            if (!move?.teams?.in || !move?.teams?.out || !move?.date) {
              return;
            }

            const monthKey = getMonthKeyFromIso(move.date);
            if (!monthKey || !monthKeySet.has(monthKey)) {
              return;
            }

            const basePhoto = player.photo;
            const photo = isValidImageUrl(basePhoto)
              ? basePhoto
              : `https://media.api-sports.io/football/players/${player.id}.png`;

            const incomingLogo = isValidImageUrl(move.teams.in.logo)
              ? move.teams.in.logo
              : null;
            const outgoingLogo = isValidImageUrl(move.teams.out.logo)
              ? move.teams.out.logo
              : null;

            const feeInfo = move.fee || move.type;
            const feeFromType = extractFeeFromType(move.type);

            parsedTransfers.push({
              id: moveId,
              playerId: player.id,
              playerName: player.name || "Unknown Player",
              playerAge: player.age,
              nationality: player.nationality,
              photo,
              position: player.position,
              fromTeam: {
                name: move.teams.out.name || "Unknown Club",
                logo: outgoingLogo,
              },
              toTeam: {
                name: move.teams.in.name || "Unknown Club",
                logo: incomingLogo,
              },
              date: move.date,
              type: move.type || "Transfer",
              fee: feeInfo,
              feeValue:
                feeFromType.value > 0
                  ? feeFromType.value
                  : parseFeeToNumber(move.fee),
              season: move.season,
              league: move.league?.name || move.teams.in?.name || undefined,
              monthKey,
            });
          });
        });
      };

      const seasonYears = computeSeasonYears(referenceDate, 3);
      const selectedLeagueOption = footballLeagues.find(
        (league) => league.label === selectedLeague,
      );

      // Skip API-Football for now (returns 403 errors)
      // Will re-enable when official API keys are available
      console.log("⏭️ Skipping API-Football (not available in dev mode)");

      // Strategy: Use SofaScore for transfers (optimized parallel fetching)
      console.log("🔍 Fetching SofaScore transfers for popular players...");
      console.log(`📅 Looking for transfers in months: ${monthKeys.join(", ")}`);
      
      // Reduced to top 8 players for faster loading
      const popularPlayerIds = [
        827, 800, 847, 889, 796, 750, 935, 819,
      ];

      // Optimized: Higher concurrency, timeout handling, early return
      const batchSize = 8; // Fetch all at once for speed
      const timeoutMs = 5000; // 5 second timeout per player
      
      const createTimeoutPromise = (ms: number) => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), ms)
        );

      // Fetch all players in parallel with timeout
      const batchResults = await Promise.allSettled(
        popularPlayerIds.map(async (playerId) => {
          try {
            const transferPromise = getSofaPlayerTransfers(playerId);
            const timeoutPromise = createTimeoutPromise(timeoutMs);
            const sofaTransfers = await Promise.race([transferPromise, timeoutPromise]) as any[];
            return { playerId, transfers: sofaTransfers || [] };
          } catch (error) {
            console.warn(`⚠️ Player ${playerId} transfer fetch failed or timed out`);
            return { playerId, transfers: [] };
          }
        })
      );

      let sofaTransfersFound = 0;
      batchResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          const { transfers: sofaTransfers } = result.value;
          sofaTransfers.forEach((transfer: any) => {
            const monthKey = getMonthKeyFromIso(transfer.date);
            const fallbackMonthKey = monthKey || getMonthKeyFromDate(new Date());

            parsedTransfers.push({
              id: transfer.id,
              playerId: transfer.playerId,
              playerName: transfer.playerName,
              playerAge: transfer.playerAge,
              nationality: transfer.nationality,
              photo: transfer.photo,
              position: transfer.position,
              fromTeam: {
                name: transfer.fromTeam.name,
                logo: transfer.fromTeam.logo || null,
              },
              toTeam: {
                name: transfer.toTeam.name,
                logo: transfer.toTeam.logo || null,
              },
              date: transfer.date,
              type: transfer.type || "Transfer",
              fee: transfer.fee,
              feeValue: transfer.feeValue,
              season: undefined,
              league: transfer.toTeam.name,
              monthKey: fallbackMonthKey,
            });
            sofaTransfersFound++;
          });
        }
      });
      
      console.log(`✅ SofaScore: Found ${sofaTransfersFound} total transfers`);
      
      // Progressive loading: Show data immediately if we have transfers
      if (parsedTransfers.length > 0) {
        const deduped = new Map<string, TransferItem>();
        parsedTransfers.forEach((item) => {
          if (!deduped.has(item.id)) {
            deduped.set(item.id, item);
          }
        });
        const orderedTransfers = Array.from(deduped.values()).sort((a, b) => {
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          if (Number.isNaN(dateA) || Number.isNaN(dateB)) return 0;
          return dateB - dateA;
        });
        setTransfers(orderedTransfers);
        setLoading(false); // Stop loading spinner, but continue fetching in background
        
        // Early return if we have enough transfers
        if (parsedTransfers.length >= 20) {
          console.log(`✅ Early return: Found ${parsedTransfers.length} transfers`);
          return;
        }
      }

      // Only fetch from TheSportsDB if we don't have enough transfers (optimized)
      if (parsedTransfers.length < 15) {
        console.log("🔍 Fetching additional transfers from TheSportsDB...");
        const teamNames =
          selectedLeague === "All Teams"
            ? Object.values(leagueTeamMap).flat()
            : getTeamNamesForLeague(selectedLeague);

        // Reduced to top 5 teams for faster loading
        const limitedTeams = teamNames.slice(0, 5);
        
        // Fetch teams in parallel with timeout
        const teamTransferPromises = limitedTeams.map(async (teamName) => {
          try {
            const transferPromise = theSportsDbApiService.getTeamTransfers(teamName);
            const timeoutPromise = createTimeoutPromise(3000); // 3 second timeout
            const transfers = await Promise.race([transferPromise, timeoutPromise]) as any[];
            return { teamName, transfers: transfers || [] };
          } catch (error) {
            console.warn(`⚠️ Failed to fetch transfers for ${teamName}:`, error);
            return { teamName, transfers: [] };
          }
        });

        const teamResults = await Promise.allSettled(teamTransferPromises);
        
        // Try to resolve real player IDs for TheSportsDB transfers
        const playerNameToIdMap = new Map<string, number>();
        const uniquePlayerNames = new Set<string>();
        
        teamResults.forEach((result) => {
          if (result.status === 'fulfilled') {
            const { transfers } = result.value;
            transfers.forEach((transfer: any) => {
              if (transfer.player && transfer.player.trim()) {
                uniquePlayerNames.add(transfer.player.trim());
              }
            });
          }
        });

        // Search for player IDs in parallel (limited to top 10 for speed)
        const playerNamesArray = Array.from(uniquePlayerNames).slice(0, 10);
        const playerSearchPromises = playerNamesArray.map(async (playerName) => {
          try {
            const searchPromise = searchSofaPlayers(playerName);
            const timeoutPromise = createTimeoutPromise(2000); // 2 second timeout
            const players = await Promise.race([searchPromise, timeoutPromise]) as any[];
            if (players && players.length > 0) {
              // Find best match (exact name match preferred)
              const exactMatch = players.find(p => p.name.toLowerCase() === playerName.toLowerCase());
              const match = exactMatch || players[0];
              return { playerName, playerId: match.id };
            }
            return { playerName, playerId: null };
          } catch (error) {
            return { playerName, playerId: null };
          }
        });

        const playerSearchResults = await Promise.allSettled(playerSearchPromises);
        playerSearchResults.forEach((result) => {
          if (result.status === 'fulfilled' && result.value.playerId) {
            playerNameToIdMap.set(result.value.playerName, result.value.playerId);
          }
        });
        
        teamResults.forEach((result) => {
          if (result.status === 'fulfilled') {
            const { transfers } = result.value;
            transfers.forEach((transfer: any, index: number) => {
              const monthKey = getMonthKeyFromIso(transfer.date);
              if (!monthKey || !monthKeySet.has(monthKey)) return;
              
              // Stop if we have enough transfers
              if (parsedTransfers.length >= 30) return;
              
              // Try to get real player ID, fallback to hash
              const playerName = transfer.player?.trim() || "";
              const realPlayerId = playerName ? playerNameToIdMap.get(playerName) : null;
              const transferId =
                transfer.date && transfer.player
                  ? hashStringToNumber(`${transfer.player}-${transfer.date}`)
                  : hashStringToNumber(`${result.value.teamName}-${index}-${monthKey}`);

              const feeLabel = transfer.description || transfer.type || null;

              parsedTransfers.push({
                id: `sportsdb-${result.value.teamName}-${transfer.player}-${transfer.date || index}`,
                playerId: realPlayerId || transferId, // Use real ID if available, otherwise hash
                playerName: transfer.player || "Unknown Player",
                photo: null,
                fromTeam: {
                  name: transfer.fromTeam || "Unknown Club",
                  logo: null,
                },
                toTeam: {
                  name: transfer.toTeam || "Unknown Club",
                  logo: null,
                },
                date: transfer.date || `${monthKey}-01`,
                type: transfer.type || "Transfer",
                fee: feeLabel || undefined,
                feeValue: parseFeeToNumber(feeLabel || undefined),
                season: undefined,
                league: selectedLeague === "All Teams" ? undefined : selectedLeague,
                monthKey,
              });
            });
          }
        });
      }

      // Final deduplication and sorting
      const deduped = new Map<string, TransferItem>();
      parsedTransfers.forEach((item) => {
        if (!deduped.has(item.id)) {
          deduped.set(item.id, item);
        }
      });
      const orderedTransfers = Array.from(deduped.values()).sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        if (Number.isNaN(dateA) || Number.isNaN(dateB)) return 0;
        return dateB - dateA;
      });
      
      // Update transfers (may have been updated earlier for progressive loading)
      setTransfers(orderedTransfers);
    } catch (err) {
      console.error("Failed to load transfers", err);
      console.error("Failed to load transfers", err);
      setError("Unable to load transfers right now. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [sportFilter, selectedLeague]);

  useEffect(() => {
    fetchTransfers(new Date());
  }, [fetchTransfers]);

  const onRefresh = useCallback(async () => {
    setSportMenuVisible(false);
    setStatusMenuVisible(false);
    setRefreshing(true);
    await fetchTransfers(new Date());
    setRefreshing(false);
  }, [fetchTransfers]);

  const leagueMatchesFilter = useCallback((item: TransferItem) => {
    if (selectedLeague === "All Teams") return true;
    const option = footballLeagues.find((league) => league.label === selectedLeague);
    if (!option) return true;
    const target = `${item.league || ""} ${item.fromTeam.name} ${item.toTeam.name}`.toLowerCase();
    return option.keywords.some((keyword) => target.includes(keyword.toLowerCase()));
  }, [selectedLeague]);

  const getStatusCategory = useCallback((item: TransferItem): TransferStatusFilter => {
    const type = (item.type || "").toLowerCase();
    if (type.includes("loan")) return "loan";
    if (
      type.includes("signed") ||
      type.includes("deal") ||
      type.includes("contract") ||
      type.includes("agreement")
    ) {
      return "done";
    }
    if (type.includes("transfer")) return "transfer";
    return "transfer";
  }, []);

  const filteredTransfers = useMemo(() => {
    if (sportFilter !== "football") {
      return [];
    }
    const bucketSet = new Set(monthBuckets);
    return transfers.filter((item) => {
      if (!bucketSet.has(item.monthKey)) {
        return false;
      }
      if (!leagueMatchesFilter(item)) {
        return false;
      }
      const category = getStatusCategory(item);
      if (statusFilter === "all") return true;
      return category === statusFilter;
    });
  }, [transfers, sportFilter, leagueMatchesFilter, statusFilter, getStatusCategory, monthBuckets]);

  const groupedTransfers = useMemo(() => {
    const groups = new Map<string, TransferItem[]>();
    filteredTransfers.forEach((item) => {
      const existing = groups.get(item.monthKey);
      if (existing) {
        existing.push(item);
      } else {
        groups.set(item.monthKey, [item]);
      }
    });

    return monthBuckets
      .map((monthKey) => {
        const items = groups.get(monthKey);
        if (!items || items.length === 0) return null;
        const sorted = [...items].sort((a, b) => {
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          if (Number.isNaN(dateA) || Number.isNaN(dateB)) return 0;
          return dateB - dateA;
        });
        return {
          monthKey,
          label: formatMonthLabel(monthKey),
          transfers: sorted,
        };
      })
      .filter(Boolean) as Array<{
        monthKey: string;
        label: string;
        transfers: TransferItem[];
      }>;
  }, [filteredTransfers, monthBuckets]);

  const currentMonthLabel = useMemo(() => {
    if (monthBuckets.length > 0) {
      return formatMonthLabel(monthBuckets[0]);
    }
    return formatMonthLabel(getMonthKeyFromDate(new Date()));
  }, [monthBuckets]);

  const renderTransferCard = (item: TransferItem) => {
    const transferStatus = item.type?.toLowerCase() || "transfer";
    let statusLabel = "Done Deal";
    if (transferStatus.includes("loan")) statusLabel = "Loan Deal";
    if (transferStatus.includes("free")) statusLabel = "Free Transfer";
    if (transferStatus.includes("option")) statusLabel = "Loan With Option";

    const normalizedPlayerName = item.playerName?.trim() || "Unknown Player";
    const localHeadshot = hasRealPlayerImage(normalizedPlayerName)
      ? getPlayerImage(normalizedPlayerName)
      : null;
    const playerPhotoSource: ImageSourcePropType =
      localHeadshot ||
      (item.photo
        ? { uri: item.photo }
        : { uri: "https://media.api-sports.io/football/players/1.png" });

    const metaParts: string[] = [];
    if (item.nationality) metaParts.push(item.nationality);
    if (item.playerAge) metaParts.push(`${item.playerAge} yrs`);
    if (item.position) metaParts.push(item.position);
    const metaLabel = metaParts.join(" / ");

    const fromLogoSource = getTeamLogoSource(item.fromTeam.name, item.fromTeam.logo);
    const toLogoSource = getTeamLogoSource(item.toTeam.name, item.toTeam.logo);

    const feeLabel =
      item.fee && item.fee.trim().length > 0 ? item.fee.trim() : statusLabel;
    const transferDateLabel = formatTransferDate(item.date);

    return (
      <View
        key={item.id}
        style={[styles.transferCard, { backgroundColor: theme.colors.backgroundSecondary }]}
      >
        <TouchableOpacity
          style={styles.playerRow}
          activeOpacity={0.7}
          onPress={() => {
            console.log("Player pressed:", item.playerName, "playerId:", item.playerId);
            // Navigate if playerId is valid (real player IDs from SofaScore/API-Football)
            // Hash IDs from TheSportsDB are typically very large (> 10000000), real IDs are usually smaller
            if (item.playerId && item.playerId > 0 && item.playerId < 10000000) {
              router.push({
                pathname: "/player-details/[playerId]",
                params: {
                  playerId: item.playerId.toString(),
                },
              });
            } else {
              console.warn("Invalid or hash playerId (too large):", item.playerId, "for player:", item.playerName);
            }
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Image
            source={playerPhotoSource}
            style={styles.playerPhoto}
            resizeMode="cover"
            pointerEvents="none"
          />
          <View style={styles.playerInfo} pointerEvents="none">
            <Text style={[styles.playerName, { color: theme.colors.text }]} numberOfLines={1}>
              {normalizedPlayerName}
            </Text>
            {metaLabel ? (
              <Text style={[styles.playerMeta, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                {metaLabel}
              </Text>
            ) : null}
          </View>
        </TouchableOpacity>

        <View style={styles.teamsRowDetails}>
          <View style={styles.teamColumnLeft}>
            <View style={styles.teamInfoRowLeft}>
              <Text
                style={[
                  styles.teamLabel,
                  styles.teamLabelRight,
                  { color: theme.colors.textSecondary },
                ]}
                numberOfLines={1}
              >
                {item.fromTeam.name}
              </Text>
              {fromLogoSource ? (
                <Image source={fromLogoSource} style={styles.teamInlineLogoLeft} resizeMode="contain" />
              ) : (
                <View style={styles.logoPlaceholder} />
              )}
            </View>
          </View>

          <View style={styles.arrowBadge}>
            <ArrowRight size={14} color={theme.colors.background} />
          </View>

          <View style={styles.teamColumnRight}>
            <View style={styles.teamInfoRowRight}>
              {toLogoSource ? (
                <Image source={toLogoSource} style={styles.teamInlineLogoRight} resizeMode="contain" />
              ) : (
                <View style={styles.logoPlaceholder} />
              )}
              <Text
                style={[styles.teamLabel, { color: theme.colors.textSecondary }]}
                numberOfLines={1}
              >
                {item.toTeam.name}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.dealRow}>
          <Text style={[styles.dealText, { color: theme.colors.textSecondary }]} numberOfLines={1}>
            {transferDateLabel} • {feeLabel}
          </Text>
        </View>
      </View>
    );
  };

  const selectedSportLabel =
    sportFilters.find((f) => f.id === sportFilter)?.label || "Football";
  const leagueLabel = selectedLeague === "All Teams" ? selectedSportLabel : selectedLeague;
  const selectedStatusOption = statusOptions.find((opt) => opt.id === statusFilter);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => router.back?.()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.screenTitle, { color: theme.colors.text }]}>Transfers</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            styles.filterButtonLeft,
            { borderColor: theme.colors.border },
          ]}
          onPress={() => {
            setSportMenuVisible((prev) => !prev);
            setStatusMenuVisible(false);
          }}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.filterButtonText,
              {
                color:
                  selectedLeague === "All Teams"
                    ? theme.colors.text
                    : theme.colors.primary,
              },
            ]}
          >
            {leagueLabel}
          </Text>
          <ChevronDown size={16} color={theme.colors.text} />
        </TouchableOpacity>

        <TouchableOpacity
          ref={statusButtonRef}
          style={[
            styles.filterButton,
            styles.filterButtonRight,
            { borderColor: theme.colors.border },
          ]}
          onPress={() => {
            if (statusMenuVisible) {
              setStatusMenuVisible(false);
              setStatusAnchor(null);
              return;
            }

            const target = statusButtonRef.current;
            if (target && target.measureInWindow) {
              target.measureInWindow((x: number, y: number, width: number, height: number) => {
                setStatusAnchor({ x, y, width, height });
                setStatusMenuVisible(true);
                setSportMenuVisible(false);
              });
            } else {
              setStatusAnchor(null);
              setStatusMenuVisible(true);
              setSportMenuVisible(false);
            }
          }}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.filterButtonText,
              {
                color:
                  statusFilter === "all"
                    ? theme.colors.text
                    : theme.colors.primary,
              },
            ]}
          >
            {selectedStatusOption?.label || "All"}
          </Text>
          <ChevronDown size={16} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      {sportMenuVisible && (
        <DiscoverHotTransfersFilterSports
          visible={sportMenuVisible}
          selectedSport={sportFilter}
          selectedLeague={selectedLeague}
          onSelectSport={(sportId) => {
            setSportFilter(sportId);
            if (sportId !== "football") {
              setSelectedLeague("All Teams");
            }
          }}
          onSelectLeague={(leagueId) => {
            if (leagueId === "all") {
              setSelectedLeague("All Teams");
            } else {
              const league = footballLeagues.find((item) => item.id === leagueId);
              if (league) {
                setSelectedLeague(league.label);
              }
            }
            setSportMenuVisible(false);
          }}
          onClose={() => setSportMenuVisible(false)}
        />
      )}

      <DiscoverHotTransfersFilterStatus
        visible={statusMenuVisible}
        anchor={statusAnchor}
        selectedStatus={statusFilter}
        onSelectStatus={(value) => {
          setStatusFilter(value);
          setStatusMenuVisible(false);
          setSportMenuVisible(false);
          setStatusAnchor(null);
        }}
        onClose={() => {
          setStatusMenuVisible(false);
          setStatusAnchor(null);
        }}
      />

      <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

      <View style={styles.columnHeaders}>
        <Text style={[styles.columnHeaderText, { color: theme.colors.text }]}>Player</Text>
        <Text style={[styles.columnHeaderTextRight, { color: theme.colors.text }]}
        >
          Player / Transfer (€)
        </Text>
      </View>

      <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

      <Text style={[styles.dateLabel, { color: theme.colors.textSecondary }]}
      >
        {currentMonthLabel}
      </Text>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}
          >
            Loading transfers…
          </Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.colors.text }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryButton, { borderColor: theme.colors.primary }]}
            onPress={onRefresh}
            activeOpacity={0.7}
          >
            <Text style={[styles.retryButtonText, { color: theme.colors.primary }]}
            >
              Retry
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.listContainer}
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
                <Text style={[styles.monthHeader, { color: theme.colors.text }]}>{group.label}</Text>
                <View style={styles.monthTransferList}>
                  {group.transfers.map(renderTransferCard)}
                </View>
              </View>
            ))
          ) : (
            <View style={styles.syncState}>
              <Text style={[styles.syncStateText, { color: theme.colors.textSecondary }]}>
                No transfers available for the selected filters.
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  backButton: {
    padding: 6,
    borderRadius: 16,
  },
  screenTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  headerSpacer: {
    width: 32,
  },
  filterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 10,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  filterButtonLeft: {
    flex: 1,
  },
  filterButtonRight: {
    flex: 0,
    marginLeft: "auto",
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: "600",
    marginRight: 6,
  },
  dropdownMenu: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.12)",
    paddingVertical: 6,
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  dropdownText: {
    fontSize: 14,
    fontWeight: "600",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 0,
    marginBottom: 10,
  },
  columnHeaders: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 6,
  },
  columnHeaderText: {
    fontSize: 13,
    fontWeight: "700",
  },
  columnHeaderTextRight: {
    fontSize: 13,
    fontWeight: "700",
  },
  dateLabel: {
    marginHorizontal: 16,
    marginBottom: 12,
    fontSize: 12,
    fontWeight: "500",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  loadingText: {
    fontSize: 14,
  },
  errorContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    marginTop: 40,
    gap: 12,
  },
  errorText: {
    fontSize: 14,
    textAlign: "center",
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
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  transferCard: {
    borderRadius: 16,
    padding: 16,
    gap: 12,
    marginBottom: 12,
  },
  playerRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    paddingVertical: 4,
    minHeight: 60,
    width: "100%",
  },
  playerPhoto: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#1F2937",
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: "700",
  },
  playerMeta: {
    fontSize: 13,
    marginTop: 2,
  },
  transferFee: {
    fontSize: 12,
    marginTop: 4,
  },
  teamsRowDetails: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  teamColumnLeft: {
    flex: 1,
    alignItems: "flex-end",
  },
  teamColumnRight: {
    flex: 1,
    alignItems: "flex-start",
  },
  teamInfoRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
  },
  teamInfoRowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  teamInlineLogoLeft: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  teamInlineLogoRight: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  logoPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  teamLabel: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    flexShrink: 1,
  },
  teamLabelRight: {
    textAlign: "right",
  },
  arrowBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255, 59, 48, 0.85)",
    alignItems: "center",
    justifyContent: "center",
  },
  dealRow: {
    marginTop: 10,
  },
  dealText: {
    fontSize: 12,
    fontWeight: "600",
  },
  syncState: {
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  syncStateText: {
    fontSize: 13,
    textAlign: "center",
  },
  monthGroup: {
    marginBottom: 32,
  },
  monthHeader: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 16,
  },
  monthTransferList: {
    // spacing handled by transferCard marginBottom
  },
});
