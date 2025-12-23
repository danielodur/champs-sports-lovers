import Constants from "expo-constants";
import theSportsDbApiService, {
  FormattedPlayer as SportsDbPlayer,
} from "./theSportsDbApiService";

interface UnifiedPlayer {
  id: string;
  name: string;
  firstname?: string;
  lastname?: string;
  age?: number;
  nationality: string;
  height?: string;
  weight?: string;
  photo?: string;
  position: string;
  team: {
    id?: string;
    name: string;
    logo?: string;
  };
  source: "api-football" | "sportsdb" | "fallback" | "sofascore";
  marketValueEUR?: number;
  marketValueCurrency?: string;
}

interface ApiFootballResponse<T> {
  get: string;
  parameters: Record<string, any>;
  errors: string[];
  results: number;
  paging: {
    current: number;
    total: number;
  };
  response: T[];
}

interface ApiFootballPlayer {
  id: number;
  name: string;
  firstname: string;
  lastname: string;
  age: number;
  birth: {
    date: string;
    place: string;
    country: string;
  };
  nationality: string;
  height: string;
  weight: string;
  injured: boolean;
  photo: string;
  position: string;
  team: {
    id: number;
    name: string;
    logo: string;
  };
}

interface ApiFootballSquadResponse {
  team: {
    id: number;
    name: string;
    logo: string;
  };
  players: Array<{
    id: number;
    name: string;
    firstname: string;
    lastname: string;
    age: number;
    nationality: string;
    height?: string;
    weight?: string;
    photo?: string;
    position: string;
  }>;
}

class UnifiedSportsApiService {
  private apiFootballBaseUrl = "https://v3.football.api-sports.io";
  private apiFootballKey: string;
  private cache: Map<string, { data: any; expiry: number }> = new Map();
  private cacheExpiry = 1000 * 60 * 30; // 30 minutes
  private dynamicTeamIdCache = new Map<string, number>();
  private rateLimitTracker: { [key: string]: number } = {};
  private paginationCache: Map<
    string,
    { players: UnifiedPlayer[]; fetchedAt: number }
  > = new Map();

  private supportedLeagues = [
    { id: 39, name: "Premier League" },
    { id: 140, name: "La Liga" },
    { id: 78, name: "Bundesliga" },
    { id: 135, name: "Serie A" },
    { id: 61, name: "Ligue 1" },
    { id: 307, name: "Saudi Pro League" },
    { id: 98, name: "J1 League" },
    { id: 292, name: "K League" },
  ];

  constructor() {
    this.apiFootballKey =
      Constants.expoConfig?.extra?.apiFootballKey ||
      process.env.EXPO_PUBLIC_API_FOOTBALL_KEY ||
      "";

    if (!this.apiFootballKey) {
      console.warn("API-Football key not found in environment variables");
    }
  }

  private async makeApiFootballRequest<T>(
    endpoint: string,
    params: Record<string, any> = {},
  ): Promise<ApiFootballResponse<T>> {
    const cacheKey = `api-football:${endpoint}:${JSON.stringify(params)}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() < cached.expiry) {
      console.log(`📦 API-Football Cache hit for: ${endpoint}`);
      return cached.data;
    }

    try {
      const url = new URL(`${this.apiFootballBaseUrl}/${endpoint}`);
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, value.toString());
        }
      });

      console.log(`🌐 API-Football Request: ${url.toString()}`);

      let attempt = 0;
      let lastError: Error | null = null;
      const maxAttempts = 3;
      while (attempt < maxAttempts) {
        attempt += 1;
        try {
          const response = await fetch(url.toString(), {
            headers: {
              "X-RapidAPI-Key": this.apiFootballKey,
              "X-RapidAPI-Host": "v3.football.api-sports.io",
              Accept: "application/json",
            },
          });

          if (response.status === 429) {
            const retryAfter = Number(response.headers.get("retry-after")) || 2;
            console.warn(
              `⏳ API-Football rate limited (${endpoint}). Waiting ${retryAfter}s before retry ${attempt}/${maxAttempts}`,
            );
            await new Promise((resolve) =>
              setTimeout(resolve, retryAfter * 1000),
            );
            continue;
          }

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const data = await response.json();

          if (data.errors && data.errors.length > 0) {
            throw new Error(`API Error: ${data.errors.join(", ")}`);
          }

          this.cache.set(cacheKey, {
            data,
            expiry: Date.now() + this.cacheExpiry,
          });

          return data;
        } catch (fetchError) {
          lastError =
            fetchError instanceof Error
              ? fetchError
              : new Error(String(fetchError));
          console.warn(
            `⚠️ API-Football attempt ${attempt}/${maxAttempts} failed for ${endpoint}:`,
            lastError.message,
          );
          if (attempt < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
          }
        }
      }

      throw lastError || new Error("Unknown API-Football error");
    } catch (error) {
      console.error(`❌ API-Football Error for ${endpoint}:`, error);
      throw error;
    }
  }

  private teamAliasMap: Record<string, string> = {
    "man utd": "manchester united",
    "man united": "manchester united",
    "man city": "manchester city",
    "psg": "paris saint germain",
    "paris sg": "paris saint germain",
    "paris saint-germain": "paris saint germain",
    "fc bayern munich": "bayern munich",
    "fc barcelona": "barcelona",
    "fc porto": "porto",
    "sporting cp": "sporting",
    "sporting lisbon": "sporting",
    "internazionale": "inter milan",
    "newcastle united": "newcastle",
    "tottenham hotspur": "tottenham",
    "bayer 04 leverkusen": "bayer leverkusen",
    "bayern munchen": "bayern munich",
    "paris st germain": "paris saint germain",
    "paris saint germain fc": "paris saint germain",
    "afc bournemouth": "bournemouth",
    "as roma": "roma",
    "acf fiorentina": "fiorentina",
    "real betis balompie": "real betis",
    "ulsan hyundai": "ulsan hd",
  };

  private normalizeTeamKey(teamName: string): string {
    if (!teamName) return "";

    const withoutDiacritics = teamName
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    const sanitized = withoutDiacritics
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(
        /\b(fc|cf|club|ac|sc|ua|sa|the|de|la|el|cd|ud|ss|calcio|afc)\b/g,
        "",
      )
      .replace(/\s+/g, " ")
      .trim();

    if (!sanitized) return "";

    return this.teamAliasMap[sanitized] || sanitized;
  }

  // Team name mappings for API-Football
  private apiFootballTeamMappings: Record<string, number> = {
    // Premier League
    arsenal: 42,
    liverpool: 40,
    "manchester united": 33,
    "manchester city": 50,
    chelsea: 49,
    tottenham: 47,
    newcastle: 34,
    "brighton hove albion": 51,
    brighton: 51,
    "west ham": 48,
    "west ham united": 48,
    "aston villa": 66,
    "crystal palace": 52,
    fulham: 36,
    wolves: 39,
    "wolverhampton wanderers": 39,
    everton: 45,
    brentford: 55,
    "nottingham forest": 65,
    "leeds united": 63,
    burnley: 44,
    bournemouth: 35,
    "sheffield united": 62,
    "leicester city": 46,

    // La Liga
    "real madrid": 541,
    barcelona: 529,
    "atletico madrid": 530,
    "atlético madrid": 530,
    sevilla: 536,
    "real betis": 543,
    valencia: 532,
    villarreal: 533,
    "real sociedad": 548,
    "athletic bilbao": 531,
    "celta vigo": 538,
    espanyol: 540,
    getafe: 546,
    granada: 715,
    mallorca: 798,
    osasuna: 727,
    "rayo vallecano": 728,
    "las palmas": 472,
    girona: 784,
    "deportivo alaves": 263,
    "real valladolid": 720,
    leganes: 745,

    // Serie A
    juventus: 496,
    "juventus fc": 496,
    "inter milan": 505,
    "internazionale": 505,
    "ac milan": 489,
    "milan": 489,
    napoli: 492,
    roma: 497,
    lazio: 487,
    atalanta: 499,
    fiorentina: 502,

    // Bundesliga
    "bayern munich": 157,
    "fc bayern munich": 157,
    "borussia dortmund": 165,
    "rb leipzig": 173,
    "bayer leverkusen": 168,
    "eintracht frankfurt": 169,
    "borussia monchengladbach": 163,
    "borussia mönchengladbach": 163,

    // Ligue 1
    "paris saint germain": 85,
    "olympique lyonnais": 80,
    "olympique marseille": 81,
    "as monaco": 91,
    lille: 79,
    rennes: 94,

    // Saudi Pro League / Asia
    "al hilal": 797,
    "al nassr": 734,
    "al ahli": 733,
    "al ittihad": 736,
    "al fateh": 7340,

    // J1 League
    "yokohama f marinos": 1025,
    "kawasaki frontale": 1026,
    "urawa red diamonds": 1027,

    // K League
    "jeonbuk hyundai motors": 149,
    "ulsan hd": 2900,

    // Qatar Stars League
    "al duhail": 978,

    // Persian Gulf Pro League
    persepolis: 2815,
  };

  private async getApiFootballTeamId(
    teamName: string,
    leagueId?: number,
  ): Promise<number | null> {
    const normalized = this.normalizeTeamKey(teamName);
    if (!normalized) {
      return null;
    }

    if (this.apiFootballTeamMappings[normalized]) {
      return this.apiFootballTeamMappings[normalized];
    }

    if (this.dynamicTeamIdCache.has(normalized)) {
      return this.dynamicTeamIdCache.get(normalized) || null;
    }

    try {
      const params: Record<string, any> = {
        search: teamName,
      };
      if (leagueId) {
        params.league = leagueId;
      }

      const response = await this.makeApiFootballRequest<any>("teams", params);
      const resolvedTeamId = response?.response?.[0]?.team?.id;
      if (resolvedTeamId) {
        this.dynamicTeamIdCache.set(normalized, resolvedTeamId);
        return resolvedTeamId;
      }
    } catch (error) {
      console.warn(
        `⚠️ API-Football lookup failed for ${teamName} (${leagueId}):`,
        error,
      );
    }

    return null;
  }

  async listLeagueTeams(leagueId: number): Promise<
    Array<{ id: number; name: string; logo?: string }>
  > {
    const cacheKey = `league-teams-${leagueId}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)?.data || [];
    }

    const response = await this.makeApiFootballRequest<any>("teams", {
      league: leagueId,
      season: new Date().getFullYear(),
    });

    const teams = (response?.response || []).map((entry: any) => ({
      id: entry.team?.id,
      name: entry.team?.name,
      logo: entry.team?.logo,
    }));

    this.cache.set(cacheKey, {
      data: teams,
      expiry: Date.now() + this.cacheExpiry,
    });

    return teams;
  }

  async paginateLeaguePlayers(
    leagueId: number,
    season = new Date().getFullYear(),
  ): Promise<UnifiedPlayer[]> {
    const cacheKey = `league-${leagueId}-${season}`;
    const cached = this.paginationCache.get(cacheKey);
    if (cached && Date.now() - cached.fetchedAt < this.cacheExpiry) {
      return cached.players;
    }

    const collected: UnifiedPlayer[] = [];
    let page = 1;
    const pageSize = 40;

    while (true) {
      const response = await this.makeApiFootballRequest<any>("players", {
        league: leagueId,
        season,
        page,
      });

      if (!response?.response?.length) {
        break;
      }

      const mapped = response.response
        .map((entry: any) => {
          const playerData = entry.player || entry;
          const teamData =
            entry.statistics?.[0]?.team ||
            entry.statistics?.team ||
            entry.team ||
            {};
          if (!playerData?.id || !playerData?.name) {
            return null;
          }
          return this.formatApiFootballPlayer(playerData, teamData);
        })
        .filter(Boolean) as UnifiedPlayer[];

      collected.push(...mapped);

      if (page >= (response.paging?.total || 1)) {
        break;
      }

      page += 1;

      if (page >= 30) {
        break;
      }
    }

    this.paginationCache.set(cacheKey, {
      players: collected,
      fetchedAt: Date.now(),
    });

    return collected;
  }

  async getLeagueSummaries(): Promise<
    Array<{ leagueId: number; teamCount: number; playerCount: number }>
  > {
    const summaries: Array<{
      leagueId: number;
      teamCount: number;
      playerCount: number;
    }> = [];

    for (const league of this.supportedLeagues) {
      try {
        const teams = await this.listLeagueTeams(league.id);
        const players = await this.paginateLeaguePlayers(league.id);

        summaries.push({
          leagueId: league.id,
          teamCount: teams.length,
          playerCount: players.length,
        });
      } catch (error) {
        console.warn(
          `⚠️ Failed to gather summary for league ${league.name}:`,
          error,
        );
      }
    }

    return summaries;
  }

  async getTeamPlayers(
    teamName: string,
    leagueId?: number,
  ): Promise<UnifiedPlayer[]> {
    console.log(`🔍 Unified API: Fetching players for ${teamName}...`);

    const allPlayers: UnifiedPlayer[] = [];

    // Strategy 1: Try API-Football first
    try {
      const apiFootballPlayers = await this.getApiFootballPlayers(
        teamName,
        leagueId,
      );
      if (apiFootballPlayers && apiFootballPlayers.length > 0) {
        allPlayers.push(...apiFootballPlayers);
        console.log(
          `✅ API-Football: Found ${apiFootballPlayers.length} players for ${teamName}`,
        );
      }
    } catch (error) {
      console.warn(`⚠️ API-Football failed for ${teamName}:`, error);
    }

    // Strategy 2: Try TheSportsDB as fallback or supplement
    if (allPlayers.length < 18) {
      try {
        const sportsDbPlayers = await this.getSportsDbPlayers(teamName);

        if (sportsDbPlayers && sportsDbPlayers.length > 0) {
          const existingNames = new Set(
            allPlayers.map((p) => p.name.toLowerCase()),
          );
          const uniqueSportsDbPlayers = sportsDbPlayers.filter(
            (p) => !existingNames.has(p.name.toLowerCase()),
          );

          allPlayers.push(...uniqueSportsDbPlayers);
          console.log(
            `✅ TheSportsDB: Added ${uniqueSportsDbPlayers.length} additional players for ${teamName}`,
          );
        }
      } catch (error) {
        console.warn(`⚠️ TheSportsDB failed for ${teamName}:`, error);
      }
    }

    // Strategy 3: If both APIs fail, provide fallback players
    if (allPlayers.length === 0) {
      console.warn(
        `⚠️ Both APIs failed for ${teamName}, using fallback players`,
      );
      const fallbackPlayers = this.createFallbackPlayers(teamName);
      allPlayers.push(...fallbackPlayers);
    }

    console.log(
      `🎯 Unified API: Total ${allPlayers.length} players collected for ${teamName}`,
    );
    return allPlayers;
  }

  private async getApiFootballPlayers(
    teamName: string,
    leagueId?: number,
  ): Promise<UnifiedPlayer[]> {
    const teamId = await this.getApiFootballTeamId(teamName, leagueId);
    if (!teamId) {
      throw new Error(`No API-Football team ID found for ${teamName}`);
    }

    const currentYear = new Date().getFullYear();
    const seasons = [currentYear, currentYear - 1];

    // Preferred endpoint: players/squads (if plan allows)
    try {
      const squadResponse =
        await this.makeApiFootballRequest<ApiFootballSquadResponse>(
          "players/squads",
          { team: teamId },
        );

      if (squadResponse.response && squadResponse.response.length > 0) {
        const squad = squadResponse.response[0];
        if (squad?.players?.length) {
          return squad.players.map((player) =>
            this.formatApiFootballSquadPlayer(player, squad.team, teamName),
          );
        }
      }
    } catch (error: any) {
      if (
        error instanceof Error &&
        /http\s*403/i.test(error.message || "")
      ) {
        console.warn(
          `⚠️ API-Football squad endpoint unavailable for ${teamName}, trying season players endpoint.`,
        );
      } else {
        console.warn(
          `⚠️ API-Football squad endpoint failed for ${teamName}:`,
          error,
        );
      }
    }

    // Fallback endpoint: players?team=...&season=...
    for (const season of seasons) {
      try {
        const response = await this.makeApiFootballRequest<ApiFootballPlayer>(
          "players",
          {
            team: teamId,
            season,
          },
        );

        if (response.response && response.response.length > 0) {
          return response.response.map((player) =>
            this.formatApiFootballPlayer(player, teamName),
          );
        }
      } catch (error) {
        console.warn(
          `⚠️ API-Football players endpoint season ${season} failed for ${teamName}`,
        );
        continue;
      }
    }

    throw new Error(`No players found in API-Football for ${teamName}`);
  }

  private async getSportsDbPlayers(teamName: string): Promise<UnifiedPlayer[]> {
    const sportsDbPlayers =
      await theSportsDbApiService.getTeamPlayers(teamName);
    return sportsDbPlayers.map((player) =>
      this.formatSportsDbPlayer(player, teamName),
    );
  }

  private formatApiFootballPlayer(
    player: ApiFootballPlayer,
    teamData?: { id?: number; name?: string; logo?: string },
    teamName?: string,
  ): UnifiedPlayer {
    return {
      id: `af-${player.id}`,
      name: player.name || `${player.firstname} ${player.lastname}`.trim(),
      firstname: player.firstname,
      lastname: player.lastname,
      age: player.age,
      nationality: player.nationality || "Unknown",
      height: player.height,
      weight: player.weight,
      photo: this.isValidImageUrl(player.photo) ? player.photo : undefined,
      position: this.normalizePosition(player.position),
      team: {
        id: (player.team?.id ?? teamData?.id)?.toString(),
        name: player.team?.name || teamData?.name || teamName || "Unknown Club",
        logo: this.isValidImageUrl(player.team?.logo || teamData?.logo)
          ? player.team?.logo || teamData?.logo
          : undefined,
      },
      source: "api-football",
    };
  }

  private formatApiFootballSquadPlayer(
    player: ApiFootballSquadResponse["players"][number],
    team: ApiFootballSquadResponse["team"],
    defaultTeamName: string,
  ): UnifiedPlayer {
    return {
      id: `af-${player.id}`,
      name: player.name || `${player.firstname} ${player.lastname}`.trim(),
      firstname: player.firstname,
      lastname: player.lastname,
      age: player.age,
      nationality: player.nationality || "Unknown",
      height: player.height,
      weight: player.weight,
      photo: this.isValidImageUrl(player.photo) ? player.photo : undefined,
      position: this.normalizePosition(player.position),
      team: {
        id: team?.id?.toString(),
        name: team?.name || defaultTeamName,
        logo: this.isValidImageUrl(team?.logo) ? team.logo : undefined,
      },
      source: "api-football",
    };
  }

  private formatSportsDbPlayer(
    player: SportsDbPlayer,
    teamName: string,
  ): UnifiedPlayer {
    const nameParts = player.name.split(" ");
    const firstname = nameParts[0];
    const lastname = nameParts.slice(1).join(" ");

    return {
      id: `sdb-${player.id}`,
      name: player.name,
      firstname,
      lastname,
      age: player.age,
      nationality: player.nationality,
      height: player.height,
      weight: player.weight,
      photo: player.photo,
      position: this.normalizePosition(player.position),
      team: {
        name: teamName,
      },
      source: "sportsdb",
    };
  }

  private normalizePosition(position: string): string {
    if (!position) return "Unknown";

    const positionMappings: Record<string, string> = {
      Goalkeeper: "Goalkeeper",
      Defender: "Defender",
      Midfielder: "Midfielder",
      Attacker: "Attacker",
      Forward: "Attacker",
      "Centre-Back": "Defender",
      "Left-Back": "Defender",
      "Right-Back": "Defender",
      "Defensive Midfield": "Midfielder",
      "Central Midfield": "Midfielder",
      "Attacking Midfield": "Midfielder",
      "Left Winger": "Midfielder",
      "Right Winger": "Midfielder",
      "Centre-Forward": "Attacker",
      Winger: "Midfielder",
    };

    // Normalize the input
    const normalized =
      position.charAt(0).toUpperCase() + position.slice(1).toLowerCase();

    return (
      positionMappings[position] || positionMappings[normalized] || position
    );
  }

  private isValidImageUrl(url?: string): boolean {
    if (!url) return false;

    try {
      const urlObj = new URL(url);
      return (
        urlObj.protocol === "https:" &&
        (url.includes(".jpg") ||
          url.includes(".png") ||
          url.includes(".jpeg") ||
          url.includes(".webp"))
      );
    } catch {
      return false;
    }
  }

  private createFallbackPlayers(teamName: string): UnifiedPlayer[] {
    // Create 20 placeholder players with realistic positions
    const positions = [
      "Goalkeeper",
      "Goalkeeper",
      "Defender",
      "Defender",
      "Defender",
      "Defender",
      "Defender",
      "Defender",
      "Midfielder",
      "Midfielder",
      "Midfielder",
      "Midfielder",
      "Midfielder",
      "Midfielder",
      "Midfielder",
      "Attacker",
      "Attacker",
      "Attacker",
      "Attacker",
      "Attacker",
    ];

    return Array.from({ length: 20 }, (_, index) => ({
      id: `fallback-${teamName}-${index + 1}`,
      name: `Player ${index + 1}`,
      nationality: "Unknown",
      position: positions[index] || "Midfielder",
      team: {
        name: teamName,
      },
      source: "fallback" as const,
    }));
  }

  async testApiConnections(): Promise<{
    apiFootball: { success: boolean; message: string };
    sportsDb: { success: boolean; message: string };
  }> {
    console.log("🔄 Testing all API connections...");

    // Test API-Football
    let apiFootballResult: { success: boolean; message: string };
    try {
      const response = await this.makeApiFootballRequest<any>("teams", {
        league: 39, // Premier League
        season: new Date().getFullYear(),
      });

      apiFootballResult = {
        success: response.results > 0,
        message:
          response.results > 0
            ? `API-Football connection successful. Found ${response.results} teams.`
            : "API-Football connection successful but no data returned",
      };
    } catch (error) {
      apiFootballResult = {
        success: false,
        message: `API-Football connection failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }

    // Test TheSportsDB
    const sportsDbResult = await theSportsDbApiService.testApiConnection();

    console.log("📊 API Connection Results:");
    console.log(
      `  API-Football: ${apiFootballResult.success ? "✅" : "❌"} ${apiFootballResult.message}`,
    );
    console.log(
      `  TheSportsDB: ${sportsDbResult.success ? "✅" : "❌"} ${sportsDbResult.message}`,
    );

    return {
      apiFootball: apiFootballResult,
      sportsDb: sportsDbResult,
    };
  }

  clearCache(): void {
    this.cache.clear();
    theSportsDbApiService.clearCache();
    console.log("🧹 All caches cleared");
  }

  getCacheStats(): {
    apiFootball: { size: number; keys: string[] };
    sportsDb: { size: number; keys: string[] };
  } {
    return {
      apiFootball: {
        size: this.cache.size,
        keys: Array.from(this.cache.keys()),
      },
      sportsDb: theSportsDbApiService.getCacheStats(),
    };
  }

  // Enhanced player search with fuzzy matching
  async searchPlayers(
    query: string,
    teamName?: string,
  ): Promise<UnifiedPlayer[]> {
    const results: UnifiedPlayer[] = [];

    if (teamName) {
      const teamPlayers = await this.getTeamPlayers(teamName);
      const filtered = teamPlayers.filter(
        (player) =>
          player.name.toLowerCase().includes(query.toLowerCase()) ||
          player.firstname?.toLowerCase().includes(query.toLowerCase()) ||
          player.lastname?.toLowerCase().includes(query.toLowerCase()),
      );
      results.push(...filtered);
    }

    return results;
  }

  // Get team logo from both APIs
  async getTeamLogo(teamName: string): Promise<string | null> {
    // Try API-Football first
    try {
      const teamId = this.getApiFootballTeamId(teamName);
      if (teamId) {
        const response = await this.makeApiFootballRequest<any>("teams", {
          id: teamId,
        });

        if (response.response && response.response[0]?.team?.logo) {
          return response.response[0].team.logo;
        }
      }
    } catch (error) {
      console.warn(`⚠️ API-Football logo fetch failed for ${teamName}`);
    }

    // Fallback to TheSportsDB
    try {
      return await theSportsDbApiService.getTeamBadge(teamName);
    } catch (error) {
      console.warn(`⚠️ TheSportsDB logo fetch failed for ${teamName}`);
    }

    return null;
  }
}

const unifiedSportsApiService = new UnifiedSportsApiService();
export default unifiedSportsApiService;
export type { UnifiedPlayer };
