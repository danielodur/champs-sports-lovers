import { sofaGet, SOFA_BASE_URL, SOFA_IMAGE_BASE } from "./sofaScoreApi";

export interface SofaScorePlayerMarketValue {
  value: number;
  currency: string;
  lastUpdated?: string;
}

export interface SofaScorePlayer {
  id: number;
  name: string;
  shortName?: string;
  position?: string;
  age?: number;
  height?: number;
  weight?: number;
  marketValue?: SofaScorePlayerMarketValue | null;
  photo?: string | null;
  country?: {
    name: string;
    alpha2?: string;
  };
}

export interface SofaScoreTeamPlayer {
  player: SofaScorePlayer;
  shirtNumber?: number;
  statistics?: {
    appearances?: number;
    goals?: number;
    assists?: number;
  };
}

export interface SofaScoreTeamPlayersResponse {
  team: {
    id: number;
    name: string;
    nameCode?: string;
    country?: {
      name: string;
      alpha2?: string;
    };
    slug?: string;
  };
  players: SofaScoreTeamPlayer[];
}

export interface SofaScoreFormattedPlayer {
  id: string;
  name: string;
  position: string;
  age?: number;
  nationality?: string;
  flagEmoji?: string;
  marketValue?: number | null;
  currency?: string | null;
  photo: string | null;
  sofaId: number;
  teamName: string;
  teamLogo: string | null;
}

const SOFA_PLAYER_IMAGE = (playerId: number) =>
  `${SOFA_IMAGE_BASE}/player/${playerId}/image`;
const SOFA_TEAM_IMAGE = (teamId: number) =>
  `${SOFA_IMAGE_BASE}/team/${teamId}/image`;

function getFlagEmoji(alpha2?: string): string | undefined {
  if (!alpha2 || alpha2.length !== 2) return undefined;
  const codePoints = alpha2
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

const teamIdCache = new Map<string, number>();

const sofaTeamMap: Record<string, number> = {
  // La Liga
  "FC Barcelona": 2817,
  Barcelona: 2817,
  "Real Madrid": 2829,
  "Atlético Madrid": 2836,
  "Atletico Madrid": 2836,
  "Real Sociedad": 2828,
  "Real Betis": 2841,
  Sevilla: 2819,
  Valencia: 2827,
  Villarreal: 2824,
  Girona: 2822,
  Athletic: 2735,
  "Athletic Bilbao": 2735,
  "Celta Vigo": 2816,
  Mallorca: 2833,
  Osasuna: 2832,
  Getafe: 2831,
  Cadiz: 2820,
  Almeria: 2826,
  Granada: 2825,
  LasPalmas: 2845,
  "Las Palmas": 2845,

  // Premier League
  Arsenal: 2780,
  Liverpool: 2824,
  "Manchester City": 2818,
  "Manchester United": 2821,
  Chelsea: 2829,
  Tottenham: 2789,
  "Tottenham Hotspur": 2789,
  Newcastle: 2677,
  "Newcastle United": 2677,
  "Aston Villa": 2899,
  Brighton: 2792,
  Brentford: 2822,
  Bournemouth: 2823,
  "Crystal Palace": 2805,
  Everton: 2794,
  Fulham: 2798,
  "Nottingham Forest": 2701,
  Wolves: 2784,
  "Wolverhampton Wanderers": 2784,
  WestHam: 2785,
  "West Ham": 2785,
  "West Ham United": 2785,
  "Sheffield United": 2662,
  Burnley: 2783,

  // Serie A
  "AC Milan": 2820,
  "Inter Milan": 2904,
  Juventus: 2937,
  Napoli: 2708,
  Roma: 2826,
  Lazio: 2827,
  Atalanta: 2692,
  Fiorentina: 2756,
  Bologna: 2729,
  Torino: 2839,
  Sassuolo: 2714,
  Udinese: 2840,
  Genoa: 2737,
  Lecce: 2793,
  Empoli: 2712,
  Verona: 2740,
  Monza: 2693,
  Cagliari: 2721,
  Frosinone: 2717,
  Salernitana: 2733,

  // Bundesliga
  "Bayern Munich": 2833,
  "Borussia Dortmund": 2826,
  "RB Leipzig": 2830,
  Leverkusen: 2834,
  "Bayer Leverkusen": 2834,
  "Union Berlin": 2819,
  "Eintracht Frankfurt": 2817,
  Freiburg: 2813,
  Wolfsburg: 2842,
  Stuttgart: 2837,
  "Borussia Monchengladbach": 2818,
  "Werder Bremen": 2844,
  Mainz: 2828,
  Cologne: 2825,
  Augsburg: 2812,
  Bochum: 2811,
  Heidenheim: 3512,
  Darmstadt: 2810,
  Hoffenheim: 2843,

  // Ligue 1
  "Paris Saint-Germain": 2816,
  PSG: 2816,
  Marseille: 2809,
  Lyon: 2807,
  "AS Monaco": 2808,
  Lille: 2810,
  Rennes: 2806,
  Nice: 2815,
  "Montpellier": 2805,
  "Reims": 2804,
  "Nantes": 2799,
  "Strasbourg": 2795,
  "Toulouse": 2790,
  "Lens": 2803,
  "Lorient": 2802,
  "Metz": 2797,
  "Brest": 2796,
  "Clermont": 2801,
  "Le Havre": 2800,
  "Ajaccio": 2791,
};

function normalizeTeamName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function findSofaTeamId(teamName: string): Promise<number | null> {
  const normalized = normalizeTeamName(teamName);
  if (!normalized) return null;

  if (teamIdCache.has(normalized)) {
    return teamIdCache.get(normalized) || null;
  }

  if (sofaTeamMap[teamName]) {
    const id = sofaTeamMap[teamName];
    teamIdCache.set(normalized, id);
    return id;
  }

  const query = encodeURIComponent(teamName);
  const endpoints = [
    `/search/all?term=${query}`,
    `/search/multi?term=${query}`,
    `/search/team?name=${query}`,
  ];

  const extractCandidates = (payload: any): any[] => {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload.teams)) return payload.teams;
    if (Array.isArray(payload.results)) return payload.results;
    if (Array.isArray(payload.data)) return payload.data;
    if (Array.isArray(payload.teams?.data)) return payload.teams.data;
    return [];
  };

  for (const endpoint of endpoints) {
    try {
      const response = await sofaGet<any>(endpoint);
      const candidates = extractCandidates(response);
      if (!candidates.length) continue;

      const exact =
        candidates.find(
          (team: any) =>
            normalizeTeamName(team.name || team.shortName || "") === normalized,
        ) || candidates[0];

      const candidateId = exact?.team?.id || exact?.id;
      if (candidateId) {
        const numericId = Number(candidateId);
        teamIdCache.set(normalized, numericId);
        if (__DEV__) {
          console.log(
            `✅ SofaScore team resolved: ${teamName} -> ${numericId} via ${endpoint}`,
          );
        }
        return numericId;
      }
    } catch (error) {
      console.warn(`⚠️ SofaScore search failed (${endpoint}):`, error);
    }
  }

  if (__DEV__) {
    console.warn(`⚠️ SofaScore team not found for ${teamName}`);
  }

  return null;
}

export async function getTeamPlayersFromSofa(
  teamId: number,
): Promise<SofaScoreFormattedPlayer[]> {
  const data = await sofaGet<SofaScoreTeamPlayersResponse>(
    `/team/${teamId}/players`,
  );

  if (!data?.players?.length) {
    return [];
  }

  const teamName =
    data.team?.name || data.team?.nameCode || data.team?.slug || "Unknown Team";
  const teamLogo = SOFA_TEAM_IMAGE(teamId);

  // Debug logging to understand SofaScore response structure
  if (__DEV__ && teamName === "Unknown Team") {
    console.log(`⚠️ SofaScore team data for ${teamId}:`, JSON.stringify(data.team));
  } else if (__DEV__) {
    console.log(`✅ SofaScore team resolved: ${teamName} (ID: ${teamId})`);
  }

  return data.players
    .map((entry) => {
      const player = entry.player;
      if (!player?.id) {
        return null;
      }

      return {
        id: `sofa-${player.id}-${teamId}`,
        name: player.name,
        position: player.position || "Unknown",
        age: player.age,
        nationality: player.country?.name,
        flagEmoji: getFlagEmoji(player.country?.alpha2),
        marketValue: player.marketValue?.value ?? null,
        currency: player.marketValue?.currency ?? null,
        photo: SOFA_PLAYER_IMAGE(player.id),
        sofaId: player.id,
        teamName,
        teamLogo,
      } satisfies SofaScoreFormattedPlayer;
    })
    .filter(Boolean) as SofaScoreFormattedPlayer[];
}


