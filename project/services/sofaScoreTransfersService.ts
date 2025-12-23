/**
 * SofaScore Transfers Service
 * Fetches player transfer history and player info from SofaScore API
 */

import { sofaGet, SOFA_PLAYER_IMAGE, SOFA_TEAM_IMAGE } from "./sofaScoreApi";

export interface SofaScorePlayerInfo {
  id: number;
  name: string;
  slug?: string;
  shortName?: string;
  position?: string;
  jersey?: number;
  height?: number;
  age?: number;
  dateOfBirthTimestamp?: number;
  country?: {
    name: string;
    slug?: string;
    alpha2?: string;
    alpha3?: string;
  };
  team?: {
    id: number;
    name: string;
    slug?: string;
  };
}

export interface SofaScoreTransfer {
  id?: number;
  transferDate?: number; // Unix timestamp
  transferDateTimestamp?: number;
  fromTeam?: {
    id: number;
    name: string;
    slug?: string;
    nameCode?: string;
  };
  toTeam?: {
    id: number;
    name: string;
    slug?: string;
    nameCode?: string;
  };
  transferFee?: number;
  transferFeeRaw?: string;
  transferFeeDescription?: string;
  currency?: string;
  type?: string;
  fromTeamName?: string;
  toTeamName?: string;
}

export interface SofaScorePlayerResponse {
  player: SofaScorePlayerInfo;
}

export interface SofaScoreTransfersResponse {
  transferHistory?: SofaScoreTransfer[];
  transfers?: SofaScoreTransfer[];
}

export interface FormattedPlayerInfo {
  id: number;
  name: string;
  age?: number;
  position?: string;
  nationality?: string;
  nationalityAlpha2?: string;
  playerPhoto: string;
  teamId?: number;
  teamName?: string;
}

export interface FormattedTransfer {
  id: string;
  playerId: number;
  playerName: string;
  playerAge?: number;
  nationality?: string;
  nationalityAlpha2?: string;
  photo: string;
  position?: string;
  date: string; // ISO date string
  dateTimestamp?: number;
  fromTeam: {
    id?: number;
    name: string;
    logo: string;
  };
  toTeam: {
    id?: number;
    name: string;
    logo: string;
  };
  fee?: string;
  feeValue: number;
  currency?: string;
  type?: string;
}

const cache = new Map<string, { data: any; expiry: number }>();
const CACHE_DURATION = 1000 * 60 * 30; // 30 minutes

function getCached<T>(key: string): T | null {
  const cached = cache.get(key);
  if (cached && Date.now() < cached.expiry) {
    return cached.data as T;
  }
  return null;
}

function setCache(key: string, data: any): void {
  cache.set(key, {
    data,
    expiry: Date.now() + CACHE_DURATION,
  });
}

/**
 * Get player information from SofaScore
 */
export async function getPlayerInfo(playerId: number): Promise<FormattedPlayerInfo | null> {
  const cacheKey = `player-info-${playerId}`;
  const cached = getCached<FormattedPlayerInfo>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const data = await sofaGet<SofaScorePlayerResponse>(`/player/${playerId}`);
    const p = data.player;

    if (!p) {
      return null;
    }

    const formatted: FormattedPlayerInfo = {
      id: p.id,
      name: p.name || p.shortName || "Unknown Player",
      age: p.age,
      position: p.position,
      nationality: p.country?.name,
      nationalityAlpha2: p.country?.alpha2,
      playerPhoto: SOFA_PLAYER_IMAGE(p.id),
      teamId: p.team?.id,
      teamName: p.team?.name,
    };

    setCache(cacheKey, formatted);
    return formatted;
  } catch (error) {
    console.warn(`⚠️ SofaScore: Failed to fetch player info for ${playerId}:`, error);
    return null;
  }
}

/**
 * Get player transfer history from SofaScore
 */
export async function getPlayerTransfers(playerId: number): Promise<FormattedTransfer[]> {
  const cacheKey = `player-transfers-${playerId}`;
  const cached = getCached<FormattedTransfer[]>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const data = await sofaGet<SofaScoreTransfersResponse>(`/player/${playerId}/transfers`);
    const history = data.transferHistory || data.transfers || [];

    if (!Array.isArray(history) || history.length === 0) {
      return [];
    }

    // Get player info for metadata
    const playerInfo = await getPlayerInfo(playerId);

    const formatted = history
      .map((t, index) => {
        if (!t.fromTeam && !t.toTeam) {
          return null;
        }

        const timestamp = t.transferDateTimestamp || t.transferDate;
        const date = timestamp
          ? new Date(timestamp * 1000).toISOString().split("T")[0]
          : null;

        if (!date) {
          return null;
        }

        const fromTeamId = t.fromTeam?.id;
        const toTeamId = t.toTeam?.id;

        return {
          id: `sofa-transfer-${playerId}-${timestamp || index}`,
          playerId,
          playerName: playerInfo?.name || "Unknown Player",
          playerAge: playerInfo?.age,
          nationality: playerInfo?.nationality,
          nationalityAlpha2: playerInfo?.nationalityAlpha2,
          photo: playerInfo?.playerPhoto || SOFA_PLAYER_IMAGE(playerId),
          position: playerInfo?.position,
          date,
          dateTimestamp: timestamp,
          fromTeam: {
            id: fromTeamId,
            name: t.fromTeam?.name || t.fromTeamName || "Unknown Club",
            logo: fromTeamId ? SOFA_TEAM_IMAGE(fromTeamId) : "",
          },
          toTeam: {
            id: toTeamId,
            name: t.toTeam?.name || t.toTeamName || "Unknown Club",
            logo: toTeamId ? SOFA_TEAM_IMAGE(toTeamId) : "",
          },
          fee: t.transferFeeDescription || t.transferFeeRaw || undefined,
          feeValue: t.transferFee || 0,
          currency: t.currency || "EUR",
          type: t.type || "Transfer",
        } satisfies FormattedTransfer;
      })
      .filter(Boolean) as FormattedTransfer[];

    setCache(cacheKey, formatted);
    return formatted;
  } catch (error) {
    console.warn(`⚠️ SofaScore: Failed to fetch transfers for player ${playerId}:`, error);
    return [];
  }
}

/**
 * Get transfers for multiple players (batch operation)
 */
export async function getBatchPlayerTransfers(
  playerIds: number[],
  concurrency = 8,
): Promise<FormattedTransfer[]> {
  const allTransfers: FormattedTransfer[] = [];
  
  for (let i = 0; i < playerIds.length; i += concurrency) {
    const batch = playerIds.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(playerId => getPlayerTransfers(playerId))
    );
    
    batchResults.forEach(transfers => {
      allTransfers.push(...transfers);
    });
    
    // Small delay between batches to respect rate limits
    if (i + concurrency < playerIds.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return allTransfers;
}

/**
 * Search for players by name to get their IDs
 */
export async function searchPlayers(query: string): Promise<Array<{ id: number; name: string; teamName?: string }>> {
  try {
    const data = await sofaGet<any>(`/search/all?term=${encodeURIComponent(query)}`);
    
    const players: Array<{ id: number; name: string; teamName?: string }> = [];
    
    if (Array.isArray(data.results)) {
      data.results.forEach((result: any) => {
        if (result.type === "player" && result.entity) {
          players.push({
            id: result.entity.id,
            name: result.entity.name,
            teamName: result.entity.team?.name,
          });
        }
      });
    }
    
    return players;
  } catch (error) {
    console.warn(`⚠️ SofaScore: Player search failed for "${query}":`, error);
    return [];
  }
}

/**
 * Clear all transfer caches
 */
export function clearTransferCache(): void {
  cache.clear();
  console.log("🧹 SofaScore transfers cache cleared");
}

/**
 * Get cache statistics
 */
export function getTransferCacheStats(): { size: number; keys: string[] } {
  return {
    size: cache.size,
    keys: Array.from(cache.keys()),
  };
}

