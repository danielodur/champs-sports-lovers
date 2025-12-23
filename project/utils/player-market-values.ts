import unifiedSportsApiService, { UnifiedPlayer } from "@/services/unifiedSportsApiService";
import ugandanPLApiService from "@/services/ugandanPLApiService";
import teamLogoService from "@/services/teamLogoService";
import { findSofaTeamId, getTeamPlayersFromSofa } from "@/services/sofaScorePlayersService";
import { englishPLTeams } from "@/modules/discover/screens/english-pl-teams/english-pl-config";
import { laLigaTeams } from "@/modules/discover/screens/la-liga-teams/la-liga-config";
import { bundesligaTeams } from "@/modules/discover/screens/bundesliga-teams/bundesliga-config";
import { serieATeams } from "@/modules/discover/screens/serie-a-teams/serie-a-config";
import { ligue1Teams } from "@/modules/discover/screens/league-1-teams/league-1-config";
import { ugandanPLTeams } from "@/modules/discover/screens/ugandan-pl-teams/ugandan-pl-config";
import marketValueProviderFactory from "@/services/marketValueDataProvider";

export type MarketValueScope = "global" | "topFive" | "asia" | "domestic";

export interface PlayerMarketValueItem {
  id: string;
  name: string;
  age?: number;
  nationality: string;
  flagEmoji: string;
  position: string;
  teamName: string;
  teamLogo: string;
  headshot: string;
  valueEUR: number;
  source: "api-football" | "sportsdb" | "fallback" | "uganda" | "sofascore";
}

export interface TeamMarketValueItem {
  id: string;
  name: string;
  flagEmoji: string;
  logo: string;
  league: string;
  totalValueEUR: number;
  averageAge?: number;
  playerCount: number;
}

interface TeamSource {
  name: string;
  leagueId?: number;
  leagueName: string;
  country: string;
  scope: MarketValueScope;
  // When true, use Ugandan PL service
  useDomesticSource?: boolean;
  sofaTeamId?: number;
}

type BaseTeamSource = Omit<TeamSource, "scope">;

const PREMIER_LEAGUE_ID = 39;
const LA_LIGA_ID = 140;
const BUNDESLIGA_ID = 78;
const SERIE_A_ID = 135;
const LIGUE_1_ID = 61;
const SAUDI_PRO_LEAGUE_ID = 307;
const J1_LEAGUE_ID = 98;
const K_LEAGUE_ID = 292;

const nationalityFlagMap: Record<string, string> = {
  France: "🇫🇷",
  Norway: "🇳🇴",
  Argentina: "🇦🇷",
  Brazil: "🇧🇷",
  England: "🇬🇧",
  Spain: "🇪🇸",
  Germany: "🇩🇪",
  Portugal: "🇵🇹",
  Belgium: "🇧🇪",
  Netherlands: "🇳🇱",
  Morocco: "🇲🇦",
  Italy: "🇮🇹",
  Croatia: "🇭🇷",
  Egypt: "🇪🇬",
  Sweden: "🇸🇪",
  Uruguay: "🇺🇾",
  Denmark: "🇩🇰",
  Nigeria: "🇳🇬",
  Ghana: "🇬🇭",
  "Côte d'Ivoire": "🇨🇮",
  Japan: "🇯🇵",
  Korea: "🇰🇷",
  "South Korea": "🇰🇷",
  "North Korea": "🇰🇵",
  Saudi: "🇸🇦",
  "Saudi Arabia": "🇸🇦",
  Qatar: "🇶🇦",
  Iran: "🇮🇷",
  Iraq: "🇮🇶",
  Australia: "🇦🇺",
  Mexico: "🇲🇽",
  Canada: "🇨🇦",
  "United States": "🇺🇸",
  Scotland: "🏴",
  Wales: "🏴",
  Ireland: "🇮🇪",
  Poland: "🇵🇱",
  Switzerland: "🇨🇭",
  Austria: "🇦🇹",
  Serbia: "🇷🇸",
  Slovenia: "🇸🇮",
  Ukraine: "🇺🇦",
  Russia: "🇷🇺",
  Colombia: "🇨🇴",
  Chile: "🇨🇱",
  Ecuador: "🇪🇨",
  Peru: "🇵🇪",
  Paraguay: "🇵🇾",
  Bolivia: "🇧🇴",
  "United Arab Emirates": "🇦🇪",
  Uzbekistan: "🇺🇿",
  Thailand: "🇹🇭",
  Vietnam: "🇻🇳",
  Malaysia: "🇲🇾",
  Indonesia: "🇮🇩",
  Uganda: "🇺🇬",
  Kenya: "🇰🇪",
  Tanzania: "🇹🇿",
  Cameroon: "🇨🇲",
  Senegal: "🇸🇳",
  Algeria: "🇩🇿",
  Tunisia: "🇹🇳",
};

const DEFAULT_FLAG = "🏳️";
const UGANDA_FLAG = "🇺🇬";

const createBaseTeamSources = (
  teams: Array<{ apiName: string; sofaTeamId?: number }>,
  leagueId: number,
  leagueName: string,
  country: string,
): BaseTeamSource[] =>
  teams.map((team) => ({
    name: team.apiName,
    leagueId,
    leagueName,
    country,
    sofaTeamId: team.sofaTeamId,
  }));

const premierLeagueBase = createBaseTeamSources(
  englishPLTeams,
  PREMIER_LEAGUE_ID,
  "Premier League",
  "England",
);

const laLigaBase = createBaseTeamSources(
  laLigaTeams,
  LA_LIGA_ID,
  "La Liga",
  "Spain",
);

const bundesligaBase = createBaseTeamSources(
  bundesligaTeams,
  BUNDESLIGA_ID,
  "Bundesliga",
  "Germany",
);

const serieABase = createBaseTeamSources(
  serieATeams,
  SERIE_A_ID,
  "Serie A",
  "Italy",
);

const ligue1Base = createBaseTeamSources(
  ligue1Teams,
  LIGUE_1_ID,
  "Ligue 1",
  "France",
);

const asiaBase: BaseTeamSource[] = [
  {
    name: "Al Hilal",
    leagueId: SAUDI_PRO_LEAGUE_ID,
    leagueName: "Saudi Pro League",
    country: "Saudi Arabia",
  },
  {
    name: "Al Nassr",
    leagueId: SAUDI_PRO_LEAGUE_ID,
    leagueName: "Saudi Pro League",
    country: "Saudi Arabia",
  },
  {
    name: "Al Ahli",
    leagueId: SAUDI_PRO_LEAGUE_ID,
    leagueName: "Saudi Pro League",
    country: "Saudi Arabia",
  },
  {
    name: "Yokohama F. Marinos",
    leagueId: J1_LEAGUE_ID,
    leagueName: "J1 League",
    country: "Japan",
  },
  {
    name: "Kawasaki Frontale",
    leagueId: J1_LEAGUE_ID,
    leagueName: "J1 League",
    country: "Japan",
  },
  {
    name: "Urawa Red Diamonds",
    leagueId: J1_LEAGUE_ID,
    leagueName: "J1 League",
    country: "Japan",
  },
  {
    name: "Jeonbuk Hyundai Motors",
    leagueId: K_LEAGUE_ID,
    leagueName: "K League",
    country: "South Korea",
  },
  {
    name: "Ulsan HD",
    leagueId: K_LEAGUE_ID,
    leagueName: "K League",
    country: "South Korea",
  },
  {
    name: "Al Duhail",
    leagueId: 317,
    leagueName: "Qatar Stars League",
    country: "Qatar",
  },
  {
    name: "Persepolis",
    leagueId: 289,
    leagueName: "Persian Gulf Pro League",
    country: "Iran",
  },
];

const domesticBase: BaseTeamSource[] = ugandanPLTeams.map((team) => ({
  name: team.apiName,
  leagueName: "Ugandan Premier League",
  country: "Uganda",
  useDomesticSource: true,
}));

const topFiveBase: BaseTeamSource[] = [
  ...premierLeagueBase,
  ...laLigaBase,
  ...bundesligaBase,
  ...serieABase,
  ...ligue1Base,
];

const applyScope = (
  teams: BaseTeamSource[],
  scope: MarketValueScope,
): TeamSource[] =>
  teams.map((team) => ({
    ...team,
    scope,
  }));

// Global scope: Top 8 elite clubs for fast loading
const globalTeamSources: TeamSource[] = applyScope(
  [
    premierLeagueBase.find(t => t.name === "Manchester City")!,
    premierLeagueBase.find(t => t.name === "Arsenal")!,
    premierLeagueBase.find(t => t.name === "Liverpool")!,
    laLigaBase.find(t => t.name === "Real Madrid")!,
    laLigaBase.find(t => t.name === "Barcelona")!,
    bundesligaBase.find(t => t.name === "Bayern Munich")!,
    serieABase.find(t => t.name === "Inter")!,
    ligue1Base.find(t => t.name === "PSG")!,
  ].filter(Boolean),
  "global",
);

const topFiveTeamSources: TeamSource[] = applyScope(topFiveBase, "topFive");

const asiaTeamSources: TeamSource[] = applyScope(asiaBase, "asia");

const domesticTeamSources: TeamSource[] = applyScope(domesticBase, "domestic");

const scopeToTeams: Record<MarketValueScope, TeamSource[]> = {
  global: globalTeamSources,
  topFive: topFiveTeamSources,
  asia: asiaTeamSources,
  domestic: domesticTeamSources,
};

const playerCache = new Map<string, PlayerMarketValueItem>();
const teamLogoCache = new Map<string, string>();
const playerRetryCache = new Set<string>();

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  iteratee: (item: T, index: number) => Promise<R>,
  fallback: (item: T, index: number, error: unknown) => R,
): Promise<R[]> {
  if (items.length === 0) {
    return [];
  }

  const results: R[] = new Array(items.length);
  let currentIndex = 0;

  const worker = async () => {
    while (true) {
      const index = currentIndex;
      currentIndex += 1;
      if (index >= items.length) {
        break;
      }

      try {
        results[index] = await iteratee(items[index], index);
      } catch (error) {
        console.warn("⚠️ Concurrency worker caught error:", error);
        results[index] = fallback(items[index], index, error);
      }
    }
  };

  const workerCount = Math.min(limit, items.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return results;
}

const POSITION_BASE_VALUES: Record<string, number> = {
  Goalkeeper: 28,
  Defender: 42,
  Midfielder: 58,
  Attacker: 72,
};

const DOMESTIC_SCALER = 0.18;
const ASIA_SCALER = 0.46;

function getFlagEmoji(nationality: string, scope: MarketValueScope): string {
  if (scope === "domestic") {
    return UGANDA_FLAG;
  }

  if (!nationality) {
    return scope === "asia" ? "🌏" : DEFAULT_FLAG;
  }

  return (
    nationalityFlagMap[nationality] ||
    nationalityFlagMap[getNormalizedNationality(nationality)] ||
    (scope === "asia" ? "🌏" : DEFAULT_FLAG)
  );
}

function getNormalizedNationality(nationality: string): string {
  const trimmed = nationality.trim();
  if (trimmed === "England") {
    return "England";
  }
  if (trimmed === "United Kingdom") {
    return "England";
  }
  if (trimmed === "Korea Republic") {
    return "South Korea";
  }
  if (trimmed === "Korea DPR") {
    return "North Korea";
  }
  if (trimmed === "USA") {
    return "United States";
  }
  if (trimmed === "UAE") {
    return "United Arab Emirates";
  }
  if (trimmed === "Congo DR") {
    return "Congo (DRC)";
  }
  if (trimmed === "Congo") {
    return "Congo";
  }
  if (trimmed === "Ivory Coast") {
    return "Côte d'Ivoire";
  }
  return trimmed;
}

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

function pseudoRandom(seed: string): number {
  const hash = hashString(seed);
  const x = Math.sin(hash) * 10000;
  return x - Math.floor(x);
}

function estimateMarketValueMillions(
  player: UnifiedPlayer,
  scope: MarketValueScope,
): number {
  const positionKey =
    player.position && POSITION_BASE_VALUES[player.position]
      ? player.position
      : "Midfielder";
  const base = POSITION_BASE_VALUES[positionKey];

  const age = player.age || 26;
  let ageFactor = 1;
  if (age >= 21 && age <= 26) {
    ageFactor = 1.25;
  } else if (age < 21) {
    ageFactor = 1.1;
  } else if (age >= 27 && age <= 30) {
    ageFactor = 1.05;
  } else if (age > 30 && age <= 33) {
    ageFactor = 0.75;
  } else if (age > 33) {
    ageFactor = 0.55;
  }

  const seed = `${player.id}-${player.name}-${player.team?.name}-${scope}`;
  const variance = 0.65 + pseudoRandom(seed) * 1.4; // between 0.65 and ~2.05

  let estimated = base * ageFactor * variance;

  if (scope === "domestic") {
    estimated = Math.max(0.2, estimated * DOMESTIC_SCALER);
  } else if (scope === "asia") {
    estimated = estimated * ASIA_SCALER;
  }

  // Cap values to keep realistic ranges
  if (scope === "global" || scope === "topFive") {
    estimated = Math.min(estimated, 220);
  } else if (scope === "asia") {
    estimated = Math.min(estimated, 80);
  } else {
    estimated = Math.min(estimated, 12);
  }

  return Number(estimated.toFixed(2));
}

function getTeamLogo(team: TeamSource, apiLogo?: string): string {
  const cacheKey = `${team.name}-${team.leagueName}`;
  if (teamLogoCache.has(cacheKey)) {
    return teamLogoCache.get(cacheKey) || "";
  }

  const logo = teamLogoService.getOfficialTeamLogo(
    team.name,
    team.leagueName,
    apiLogo,
  );
  teamLogoCache.set(cacheKey, logo);
  return logo;
}

async function fetchTeamPlayers(
  team: TeamSource,
): Promise<UnifiedPlayer[]> {
  try {
    if (team.useDomesticSource) {
      const ugPlayers = await ugandanPLApiService.getUgandanPLTeamPlayers(team.name);
      // Use teamLogoService to get Ugandan team logos (which will use local assets or fallbacks)
      const ugandanLogo = teamLogoService.getOfficialTeamLogo(
        team.name,
        "Ugandan Premier League",
        undefined
      );
      return ugPlayers.map((player) => ({
        id: `uganda-${player.id}`,
        name: player.name,
        firstname: player.firstname,
        lastname: player.lastname,
        age: player.age,
        nationality: player.nationality || "Uganda",
        height: player.height || undefined,
        weight: player.weight || undefined,
        photo: ugandanPLApiService.getPlayerPhoto(player),
        position: player.position || "Midfielder",
        team: {
          id: player.team?.id?.toString(),
          name: player.team?.name || team.name,
          // Use teamLogoService for consistent logo handling
          logo: ugandanLogo,
        },
        source: "uganda" as const,
      }));
    }

    let sofaTeamId = team.sofaTeamId || null;

    if (!sofaTeamId) {
      sofaTeamId =
        (await findSofaTeamId(team.name)) ||
        (team.leagueName ? await findSofaTeamId(`${team.name} ${team.leagueName}`) : null);
    }

    if (!sofaTeamId) {
      console.warn(`⚠️ SofaScore team id missing for ${team.name}. Skipping.`);
      return [];
    }

    const sofaPlayers = await getTeamPlayersFromSofa(sofaTeamId);
    if (!sofaPlayers.length) {
      console.warn(`⚠️ SofaScore returned no players for ${team.name} (${sofaTeamId}).`);
      return [];
    }

    return sofaPlayers.map((player) => {
      const marketValueMillions =
        typeof player.marketValue === "number"
          ? player.marketValue > 1000
            ? player.marketValue / 1_000_000
            : player.marketValue
          : undefined;

      return {
        id: player.id,
        name: player.name,
        age: player.age,
        nationality: player.nationality || "Unknown",
        position: player.position,
        photo: player.photo || undefined,
        team: {
          id: sofaTeamId?.toString(),
          // Use the actual team name from SofaScore (not our source definition)
          name: player.teamName || team.name,
          // Use the actual team logo from SofaScore
          logo: player.teamLogo || undefined,
        },
        source: "sofascore" as const,
        marketValueEUR: marketValueMillions,
      };
    });
  } catch (error) {
    console.warn(`⚠️ Failed to load players for ${team.name}:`, error);
    return [];
  }
}

export async function getPlayerMarketValues(
  scope: MarketValueScope,
  limit = 150,
): Promise<PlayerMarketValueItem[]> {
  const provider = marketValueProviderFactory.getProvider();
  console.log(`📊 Fetching market values using ${provider.name} provider`);

  const teamSources = scopeToTeams[scope];
  teamSources.forEach((team) => {
    teamLogoCache.delete(`${team.name}-${team.leagueName}`);
  });

  const teamResults = await mapWithConcurrency(
    teamSources,
    12,
    async (team) => ({
      team,
      players: await fetchTeamPlayers(team),
    }),
    (team) => ({
      team,
      players: [] as UnifiedPlayer[],
    }),
  );

  const aggregated: PlayerMarketValueItem[] = [];

  teamResults.forEach(({ team, players }) => {
    const relevantPlayers = players.filter((player) => {
      if (team.useDomesticSource) {
        return player.source === "uganda";
      }
      return player.source === "sofascore";
    });

    relevantPlayers.forEach((player) => {
      const cacheKey = `${player.id}-${scope}`;
      if (playerCache.has(cacheKey)) {
        aggregated.push(playerCache.get(cacheKey)!);
        return;
      }

      const teamLogo = player.team?.logo || getTeamLogo(team, player.team?.logo);
      const headshot = player.photo || teamLogo;

      let value = estimateMarketValueMillions(player, scope);
      if (typeof player.marketValueEUR === "number") {
        value = player.marketValueEUR;
      }

      const formatted: PlayerMarketValueItem = {
        id: cacheKey,
        name: player.name || "Unknown Player",
        age: player.age,
        nationality: getNormalizedNationality(
          player.nationality || (scope === "domestic" ? "Uganda" : "International"),
        ),
        flagEmoji: getFlagEmoji(
          player.nationality || (scope === "domestic" ? "Uganda" : "International"),
          scope,
        ),
        position: player.position || "Midfielder",
        teamName: player.team?.name || team.name,
        teamLogo,
        headshot,
        valueEUR: value,
        source: player.source || "fallback",
      };

      playerCache.set(cacheKey, formatted);
      aggregated.push(formatted);
    });
  });

  // Deduplicate by ID to prevent duplicate keys
  const uniquePlayers = new Map<string, PlayerMarketValueItem>();
  aggregated.forEach((player) => {
    if (!uniquePlayers.has(player.id)) {
      uniquePlayers.set(player.id, player);
    }
  });

  return Array.from(uniquePlayers.values())
    .filter((player) => player.valueEUR > 0)
    .sort((a, b) => b.valueEUR - a.valueEUR)
    .slice(0, limit);
}

export async function getTeamMarketValues(
  scope: MarketValueScope,
  limit = 100,
): Promise<TeamMarketValueItem[]> {
  const teamSources = scopeToTeams[scope];
  const teamResults = await mapWithConcurrency(
    teamSources,
    12,
    async (team) => ({
      team,
      players: await fetchTeamPlayers(team),
    }),
    (team) => ({
      team,
      players: [] as UnifiedPlayer[],
    }),
  );

  const results: TeamMarketValueItem[] = [];

  teamResults.forEach(({ team, players }) => {
    const relevantPlayers = players.filter((player) => {
      if (team.useDomesticSource) {
        return player.source === "uganda";
      }
      return player.source === "sofascore";
    });

    if (!relevantPlayers.length) {
      return;
    }

    const transformed = relevantPlayers.map((player) => ({
      value:
        typeof player.marketValueEUR === "number"
          ? player.marketValueEUR
          : estimateMarketValueMillions(player, scope),
      age: player.age || 25,
      teamLogo: player.team?.logo,
    }));

    const totalValue = transformed.reduce((sum, entry) => sum + entry.value, 0);
    const averageAge =
      transformed.reduce((sum, entry) => sum + entry.age, 0) / transformed.length;

    // Use the actual team logo from SofaScore (already in player data)
    const teamLogo = transformed.find((entry) => entry.teamLogo)?.teamLogo || "";

    const teamId = `${team.name}-${scope}`;
    // Check if team already exists, if so, merge values (take the one with higher total value)
    const existingIndex = results.findIndex((t) => t.id === teamId);
    if (existingIndex >= 0) {
      const existing = results[existingIndex];
      const newTotalValue = Number(totalValue.toFixed(2));
      if (newTotalValue > existing.totalValueEUR) {
        results[existingIndex] = {
          ...existing,
          totalValueEUR: newTotalValue,
          averageAge: Number(averageAge.toFixed(1)),
          playerCount: relevantPlayers.length,
          logo: teamLogo || existing.logo,
        };
      }
    } else {
      results.push({
        id: teamId,
        name: team.name,
        flagEmoji: scope === "domestic" ? UGANDA_FLAG : getFlagEmoji(team.country, scope),
        logo: teamLogo,
        league: team.leagueName,
        totalValueEUR: Number(totalValue.toFixed(2)),
        averageAge: Number(averageAge.toFixed(1)),
        playerCount: relevantPlayers.length,
      });
    }
  });

  // Deduplicate teams by ID to prevent duplicate keys
  const uniqueTeams = new Map<string, TeamMarketValueItem>();
  results.forEach((team) => {
    if (!uniqueTeams.has(team.id)) {
      uniqueTeams.set(team.id, team);
    }
  });

  return Array.from(uniqueTeams.values()).sort((a, b) => b.totalValueEUR - a.totalValueEUR).slice(0, limit);
}

export function formatEuroValue(valueMillions: number): string {
  if (valueMillions >= 1000) {
    return `€${(valueMillions / 1000).toFixed(1)}B`;
  }
  return `€${valueMillions.toFixed(1)}M`;
}

export function formatDomesticValue(valueMillions: number): string {
  if (valueMillions >= 1000) {
    return `UGX ${(valueMillions * 3.85).toFixed(0)}B`;
  }
  if (valueMillions >= 1) {
    return `UGX ${(valueMillions * 3.85).toFixed(1)}B`;
  }
  return `UGX ${(valueMillions * 3850).toFixed(0)}M`;
}

export function formatValueForScope(
  valueMillions: number,
  scope: MarketValueScope,
): string {
  // Always use Euro formatting for consistency across all scopes
  return formatEuroValue(valueMillions);
}

