// Enhanced La Liga API Service
// Fetches real player data and headshots for La Liga teams using API-Football with TheSportsDB enhancement
// Uses EXPO_PUBLIC_API_FOOTBALL_KEY from environment variables
import theSportsDbApiService from "./theSportsDbApiService";

interface LaLigaPlayer {
  id: number;
  name: string;
  firstname: string;
  lastname: string;
  age: number;
  nationality: string;
  height: string | null;
  weight: string | null;
  photo: string;
  position: string;
  team: {
    id: number;
    name: string;
    logo: string;
  };
}

interface ApiSportsResponse<T> {
  get: string;
  parameters: Record<string, any>;
  errors: any[];
  results: number;
  paging: {
    current: number;
    total: number;
  };
  response: T[];
}

interface PlayerResponse {
  player: {
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
  };
  statistics: Array<{
    team: {
      id: number;
      name: string;
      logo: string;
    };
    league: {
      id: number;
      name: string;
      country: string;
      logo: string;
      flag: string;
      season: number;
    };
    games: {
      appearences: number;
      lineups: number;
      minutes: number;
      number: number;
      position: string;
      rating: string;
      captain: boolean;
    };
  }>;
}

class LaLigaApiService {
  private baseUrl = "https://v3.football.api-sports.io";
  private apiKey: string;
  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheExpiry = 6 * 60 * 60 * 1000; // 6 hours for fresher data
  private lastSquadUpdate = new Map<string, number>();

  // La Liga ID from API-Sports
  private laLigaId = 140;

  constructor() {
    this.apiKey = process.env.EXPO_PUBLIC_API_FOOTBALL_KEY || "";

    if (!this.apiKey) {
      console.warn(
        "EXPO_PUBLIC_API_FOOTBALL_KEY not found in environment variables",
      );
    }
    console.log(
      "🚀 Enhanced La Liga API Service initialized with dual API support",
    );
  }

  private async makeRequest<T>(
    endpoint: string,
    params: Record<string, any> = {},
    retries = 3,
  ): Promise<ApiSportsResponse<T>> {
    const cacheKey = `${endpoint}_${JSON.stringify(params)}`;

    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      console.log(`📦 Using cached data for ${endpoint}`);
      return cached.data;
    }

    const queryParams = new URLSearchParams(params).toString();
    const url = `${this.baseUrl}${endpoint}${queryParams ? `?${queryParams}` : ""}`;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`📡 API attempt ${attempt}/${retries}: ${endpoint}`);

        const response = await fetch(url, {
          method: "GET",
          headers: {
            "x-rapidapi-key": this.apiKey,
            "x-rapidapi-host": "v3.football.api-sports.io",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log(`✅ API success: ${data.results} results found`);

        // Cache successful response
        this.cache.set(cacheKey, { data, timestamp: Date.now() });
        return data;
      } catch (error) {
        console.error(`❌ API attempt ${attempt} failed:`, error);

        if (attempt < retries) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          console.log(`⏳ Retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        } else {
          throw error;
        }
      }
    }

    throw new Error("All retry attempts failed");
  }

  // La Liga team name to API-Sports team ID mapping - Updated for 2024-25 season
  private teamMapping: Record<string, number> = {
    "Real Madrid": 541,
    "Real Madrid CF": 541,
    Barcelona: 529,
    "FC Barcelona": 529,
    "Atlético Madrid": 530,
    "Atletico Madrid": 530,
    "Athletic Bilbao": 531,
    "Athletic Club": 531,
    Valencia: 532,
    "Valencia CF": 532,
    Villarreal: 533,
    "Villarreal CF": 533,
    Sevilla: 536,
    "Sevilla FC": 536,
    "Real Betis": 543,
    "Real Betis Balompié": 543,
    Getafe: 546,
    "Getafe CF": 546,
    "Real Sociedad": 548,
    "Real Sociedad de Fútbol": 548,
    "Deportivo Alaves": 537,
    "Deportivo Alavés": 537,
    "Celta Vigo": 538,
    "Real Club Celta de Vigo": 538,
    "RC Celta": 538,
    Espanyol: 540,
    "RCD Espanyol": 540,
    "RCD Espanyol de Barcelona": 540,
    Osasuna: 727,
    "Club Atlético Osasuna": 727,
    "Rayo Vallecano": 728,
    "Rayo Vallecano de Madrid": 728,
    Mallorca: 798,
    "RCD Mallorca": 798,
    Girona: 547,
    "Girona FC": 547,
    "Las Palmas": 275,
    "UD Las Palmas": 275,
    Leganes: 721,
    "CD Leganés": 721,
    "Real Valladolid": 720,
    "Real Valladolid CF": 720,
  };

  getTeamId(teamName: string): number | null {
    return this.teamMapping[teamName] || null;
  }

  // Enhanced multi-source photo fetching
  getPlayerPhoto(player: LaLigaPlayer): string {
    const photoSources = [
      // Primary: API-Sports photo
      player.photo,
      // Transfermarkt high-quality portraits
      `https://img.a.transfermarkt.technology/portrait/header/${player.id}-${Date.now()}.jpg`,
      `https://tmssl.akamaized.net/images/portrait/header/${player.id}.jpg`,
      // La Liga official photos
      `https://resources.laliga.com/laliga/photos/players/250x250/p${player.id}.png`,
      `https://resources.laliga.es/photos/players/250x250/${player.id}.png`,
      // FIFA/EA Sports photos
      `https://cdn.sofifa.net/players/${player.id.toString().padStart(6, "0")}/25_120.png`,
      // ESPN player photos
      `https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/${player.id}.png&w=350&h=254`,
      // Alternative API-Sports format
      `https://media.api-sports.io/football/players/${player.id}.png`,
    ];

    for (const source of photoSources) {
      if (source && this.isValidImageUrl(source)) {
        return source;
      }
    }

    // Team-colored placeholder fallback
    return this.generateTeamPlaceholder(player);
  }

  private isValidImageUrl(url: string): boolean {
    if (!url || url.includes("placeholder") || url.includes("default"))
      return false;

    const validExtensions = [".jpg", ".jpeg", ".png", ".webp"];
    const hasValidExtension = validExtensions.some((ext) =>
      url.toLowerCase().includes(ext),
    );

    return (
      url.startsWith("http") &&
      (hasValidExtension ||
        url.includes("api-sports") ||
        url.includes("transfermarkt"))
    );
  }

  private generateTeamPlaceholder(player: LaLigaPlayer): string {
    // Team-specific placeholder colors
    const teamColors: Record<number, string> = {
      541: "#FFFFFF", // Real Madrid
      529: "#004D98", // Barcelona
      530: "#FF0000", // Atlético Madrid
      531: "#FF0000", // Athletic Bilbao
      532: "#FF8C00", // Valencia
      533: "#FFD700", // Villarreal
      536: "#FF0000", // Sevilla
      543: "#006400", // Real Betis
      546: "#000080", // Getafe
      548: "#0033A0", // Real Sociedad
      537: "#0033A0", // Alavés
      538: "#87CEEB", // Celta Vigo
      540: "#0033A0", // Espanyol
      727: "#FF0000", // Osasuna
      728: "#FF0000", // Rayo Vallecano
      798: "#FF0000", // Mallorca
      547: "#FF0000", // Girona
      275: "#FFD700", // Las Palmas
      721: "#0033A0", // Leganés
      720: "#800080", // Valladolid
    };

    const color = teamColors[player.team.id] || "#FF4444";
    return `data:image/svg+xml,${encodeURIComponent(`
      <svg width="120" height="120" xmlns="http://www.w3.org/2000/svg">
        <circle cx="60" cy="60" r="60" fill="${color}"/>
        <text x="60" y="75" text-anchor="middle" font-family="Arial, sans-serif"
              font-size="36" font-weight="bold" fill="white">
          ${((player.firstname?.[0] || "") + (player.lastname?.[0] || "")).toUpperCase() || "P"}
        </text>
      </svg>
    `)}`;
  }

  // Get La Liga team players with enhanced data fetching
  async getLaLigaTeamPlayers(
    teamName: string,
    season: number = 2024,
  ): Promise<LaLigaPlayer[]> {
    try {
      console.log(
        `🔄 Fetching ${teamName} players from La Liga API (original method)...`,
      );
      const teamId = this.getTeamId(teamName);

      if (!teamId) {
        console.warn(`❌ No La Liga team ID found for: ${teamName}`);
        return this.getFallbackPlayers(teamName);
      }

      console.log(
        `🔍 Fetching ${teamName} (ID: ${teamId}) players for season ${season}`,
      );

      // Try multiple seasons for current data
      const seasonsToTry = [2025, 2024, 2023];
      let response: ApiSportsResponse<PlayerResponse>;

      for (const trySeasonYear of seasonsToTry) {
        try {
          console.log(`📡 Trying season ${trySeasonYear} for ${teamName}...`);

          response = await this.makeRequest<PlayerResponse>("/players", {
            team: teamId,
            season: trySeasonYear,
            league: this.laLigaId,
          });

          if (response.response && response.response.length > 0) {
            console.log(
              `✅ Found ${response.response.length} players for ${teamName} (${trySeasonYear})`,
            );
            break;
          }
        } catch (seasonError) {
          console.log(
            `⚠️ Season ${trySeasonYear} failed for ${teamName}, trying next...`,
          );
          continue;
        }
      }

      if (!response! || !response.response || response.response.length === 0) {
        console.warn(`❌ No players found for ${teamName} in any season`);
        return this.getFallbackPlayers(teamName);
      }

      // Process and enhance players
      const players: LaLigaPlayer[] = response.response
        .map((playerData: any) => {
          const player = playerData.player || playerData;
          const stats = playerData.statistics?.[0] || {};

          return {
            id: player.id,
            name:
              player.name ||
              `${player.firstname || ""} ${player.lastname || ""}`.trim(),
            firstname: player.firstname || "",
            lastname: player.lastname || "",
            age: player.age || 25,
            nationality: player.nationality || "Spain",
            height: player.height || null,
            weight: player.weight || null,
            photo: player.photo || "",
            position: stats.games?.position || "Midfielder",
            team: {
              id: teamId,
              name: teamName,
              logo: stats.team?.logo || "",
            },
          };
        })
        .filter((player) => player.name && player.name.trim() !== "");

      console.log(
        `✅ Successfully processed ${players.length} players for ${teamName}`,
      );

      // Update squad tracking
      this.lastSquadUpdate.set(teamName, Date.now());

      // If we have good data, return it. Only try enhancement if we have very few players
      if (players.length >= 15) {
        return players;
      } else if (players.length > 0) {
        console.log(
          `⚠️ Only ${players.length} players found, trying data enhancement...`,
        );
        try {
          const enhancedPlayers = await this.enhancePlayerData(
            teamName,
            players,
          );
          return enhancedPlayers;
        } catch (enhanceError) {
          console.warn(
            `Enhancement failed, using original data:`,
            enhanceError,
          );
          return players;
        }
      } else {
        return this.getFallbackPlayers(teamName);
      }
    } catch (error) {
      console.error(`❌ Error fetching ${teamName} players:`, error);
      return this.getFallbackPlayers(teamName);
    }
  }

  // Check for squad updates and data freshness
  async checkForSquadUpdates(teamName?: string): Promise<{
    hasUpdates: boolean;
    teamsToUpdate: string[];
    lastUpdate: Date | null;
  }> {
    try {
      const teamsToCheck = teamName
        ? [teamName]
        : Object.keys(this.teamMapping);
      const teamsNeedingUpdate: string[] = [];
      const updateThreshold = 24 * 60 * 60 * 1000; // 24 hours

      for (const team of teamsToCheck) {
        const lastUpdate = this.lastSquadUpdate.get(team);

        if (!lastUpdate || Date.now() - lastUpdate > updateThreshold) {
          teamsNeedingUpdate.push(team);
        }
      }

      const hasUpdates = teamsNeedingUpdate.length > 0;
      const mostRecentUpdate = teamName
        ? this.lastSquadUpdate.get(teamName)
        : Math.max(...Array.from(this.lastSquadUpdate.values()));

      console.log(
        `🔄 Squad update check: ${teamsNeedingUpdate.length} teams need updates`,
      );

      return {
        hasUpdates,
        teamsToUpdate: teamsNeedingUpdate,
        lastUpdate: mostRecentUpdate ? new Date(mostRecentUpdate) : null,
      };
    } catch (error) {
      console.error("❌ Error checking squad updates:", error);
      return {
        hasUpdates: false,
        teamsToUpdate: [],
        lastUpdate: null,
      };
    }
  }

  // Optional enhancement method - only used when original API returns insufficient data
  private async enhancePlayerData(
    teamName: string,
    existingPlayers: LaLigaPlayer[],
  ): Promise<LaLigaPlayer[]> {
    try {
      console.log(`🔄 Attempting to enhance ${teamName} player data...`);

      // Try to get additional players from TheSportsDB (safely)
      const additionalPlayers =
        await theSportsDbApiService.getTeamPlayers(teamName);

      if (additionalPlayers.length > 0) {
        const existingNames = new Set(
          existingPlayers.map((p) => p.name.toLowerCase()),
        );
        const newPlayers = additionalPlayers
          .filter((p) => !existingNames.has(p.name.toLowerCase()))
          .slice(0, 10) // Limit to 10 additional players
          .map((player, index) => ({
            id: 9000 + index, // Use high ID to avoid conflicts
            name: player.name,
            firstname: player.name.split(" ")[0] || "",
            lastname: player.name.split(" ").slice(1).join(" ") || "",
            age: player.age || 25,
            nationality: player.nationality || "Unknown",
            height: player.height || "Unknown",
            weight: player.weight || "Unknown",
            photo:
              player.photo ||
              `https://via.placeholder.com/120x120/FF4444/FFFFFF?text=${player.name.charAt(0).toUpperCase()}`,
            position: player.position || "Midfielder",
            team: {
              id: 0,
              name: teamName,
              logo: "",
            },
          }));

        const combined = [...existingPlayers, ...newPlayers];
        console.log(
          `✅ Enhanced ${teamName} data: ${existingPlayers.length} + ${newPlayers.length} = ${combined.length} players`,
        );
        return combined;
      }

      return existingPlayers;
    } catch (error) {
      console.warn(`Data enhancement failed for ${teamName}:`, error);
      return existingPlayers;
    }
  }

  // Generate fallback players for a given team
  private getFallbackPlayers(teamName: string): LaLigaPlayer[] {
    const currentSquads: Record<string, string[]> = {
      "Real Madrid": [
        "Thibaut Courtois",
        "Andriy Lunin",
        "Dani Carvajal",
        "Éder Militão",
        "David Alaba",
        "Antonio Rüdiger",
        "Ferland Mendy",
        "Fran García",
        "Lucas Vázquez",
        "Nacho Fernández",
        "Eduardo Camavinga",
        "Federico Valverde",
        "Aurélien Tchouaméni",
        "Luka Modrić",
        "Arda Güler",
        "Dani Ceballos",
        "Brahim Díaz",
        "Vinícius Júnior",
        "Kylian Mbappé",
        "Jude Bellingham",
        "Rodrygo",
        "Endrick",
        "Jesús Vallejo",
        "Álvaro Rodríguez",
        "Nico Paz",
        "Mario Martin",
        "Jacobo Ramón",
      ],
      Barcelona: [
        "Marc-André ter Stegen",
        "Iñaki Peña",
        "Ronald Araújo",
        "Andreas Christensen",
        "Jules Koundé",
        "Pau Cubarsí",
        "Iñigo Martínez",
        "Alejandro Balde",
        "Jordi Alba",
        "Pedri",
        "Gavi",
        "Frenkie de Jong",
        "Ilkay Gündogan",
        "Pablo Torre",
        "Fermín López",
        "Robert Lewandowski",
        "Raphinha",
        "Ferran Torres",
        "João Félix",
        "Lamine Yamal",
        "Ansu Fati",
        "Vitor Roque",
        "Oriol Romeu",
        "Sergi Roberto",
        "Marcos Alonso",
        "Héctor Fort",
        "Marc Guiu",
      ],
      "Atlético Madrid": [
        "Jan Oblak",
        "Antonio Gomis",
        "José Giménez",
        "Stefan Savić",
        "Mario Hermoso",
        "Reinildo Mandava",
        "Nahuel Molina",
        "Samuel Lino",
        "Marcos Llorente",
        "Koke",
        "Saúl Ñíguez",
        "Rodrigo De Paul",
        "Pablo Barrios",
        "Thomas Lemar",
        "Ángel Correa",
        "Antoine Griezmann",
        "Álvaro Morata",
        "Memphis Depay",
        "Yannick Carrasco",
        "João Félix",
        "Axel Witsel",
        "César Azpilicueta",
        "Rodrigo Riquelme",
        "Arthur Vermeeren",
        "Alexander Sørloth",
        "Conor Gallagher",
        "Julián Alvarez",
      ],
    };

    const playerNames =
      currentSquads[teamName] ||
      Array.from({ length: 27 }, (_, i) => `${teamName} Player ${i + 1}`);

    const teamId = this.getTeamId(teamName) || 999;

    return playerNames.slice(0, 27).map((name, index) => ({
      id: 90000 + teamId + index,
      name: this.formatPlayerName(name),
      firstname: name.split(" ")[0] || "",
      lastname: name.split(" ").slice(1).join(" ") || "",
      age: 20 + Math.floor(Math.random() * 15),
      nationality: "Spain",
      height: null,
      weight: null,
      photo: "",
      position:
        index < 2
          ? "Goalkeeper"
          : index < 10
            ? "Defender"
            : index < 18
              ? "Midfielder"
              : "Forward",
      team: {
        id: teamId,
        name: teamName,
        logo: "",
      },
    }));
  }

  private formatPlayerName(fullName: string): string {
    if (!fullName) return "Unknown";

    const nameParts = fullName.trim().split(" ");

    if (nameParts.length === 1) {
      return nameParts[0].length > 12
        ? nameParts[0].substring(0, 10) + "..."
        : nameParts[0];
    } else if (nameParts.length === 2) {
      const lastName =
        nameParts[1].length > 8
          ? nameParts[1].substring(0, 6) + "..."
          : nameParts[1];
      return `${nameParts[0][0]}. ${lastName}`;
    } else {
      const middleName =
        nameParts[1].length > 8
          ? nameParts[1].substring(0, 6) + "..."
          : nameParts[1];
      return `${nameParts[0][0]}. ${middleName}`;
    }
  }

  // Test API connection
  async testApiConnection(): Promise<{ success: boolean; message: string }> {
    try {
      console.log("🧪 Testing La Liga API connection...");

      if (!this.apiKey) {
        return {
          success: false,
          message:
            "API key missing. Check EXPO_PUBLIC_API_FOOTBALL_KEY in .env.local",
        };
      }

      // Test with Real Madrid (known team)
      const response = await this.makeRequest<PlayerResponse>("/players", {
        team: 541,
        season: 2024,
        league: this.laLigaId,
      });

      const playerCount = response.response?.length || 0;

      if (playerCount > 0) {
        return {
          success: true,
          message: `✅ API connected successfully. Found ${playerCount} Real Madrid players.`,
        };
      } else {
        return {
          success: false,
          message: "❌ API connected but no player data found.",
        };
      }
    } catch (error) {
      console.error("❌ API connection test failed:", error);
      return {
        success: false,
        message: `API connection failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  }

  // Team-specific methods for major clubs
  async getRealMadridPlayers(): Promise<LaLigaPlayer[]> {
    return this.getLaLigaTeamPlayers("Real Madrid");
  }

  async getBarcelonaPlayers(): Promise<LaLigaPlayer[]> {
    return this.getLaLigaTeamPlayers("Barcelona");
  }

  async getAtleticoMadridPlayers(): Promise<LaLigaPlayer[]> {
    return this.getLaLigaTeamPlayers("Atlético Madrid");
  }

  async getValenciaPlayers(): Promise<LaLigaPlayer[]> {
    return this.getLaLigaTeamPlayers("Valencia");
  }

  async getSevillaPlayers(): Promise<LaLigaPlayer[]> {
    return this.getLaLigaTeamPlayers("Sevilla");
  }

  async getRealBetisPlayers(): Promise<LaLigaPlayer[]> {
    return this.getLaLigaTeamPlayers("Real Betis");
  }

  async getVillarrealPlayers(): Promise<LaLigaPlayer[]> {
    return this.getLaLigaTeamPlayers("Villarreal");
  }

  async getRealSociedadPlayers(): Promise<LaLigaPlayer[]> {
    return this.getLaLigaTeamPlayers("Real Sociedad");
  }

  async getAthleticBilbaoPlayers(): Promise<LaLigaPlayer[]> {
    return this.getLaLigaTeamPlayers("Athletic Bilbao");
  }

  async getCeltaVigoPlayers(): Promise<LaLigaPlayer[]> {
    return this.getLaLigaTeamPlayers("Celta Vigo");
  }

  // Cache management
  clearCache(): void {
    this.cache.clear();
    this.lastSquadUpdate.clear();
    console.log("🧹 Cache cleared successfully");
  }

  getCacheStats(): {
    cacheSize: number;
    oldestEntry: Date | null;
    newestEntry: Date | null;
  } {
    const entries = Array.from(this.cache.values());
    const timestamps = entries.map((entry) => entry.timestamp);

    return {
      cacheSize: this.cache.size,
      oldestEntry:
        timestamps.length > 0 ? new Date(Math.min(...timestamps)) : null,
      newestEntry:
        timestamps.length > 0 ? new Date(Math.max(...timestamps)) : null,
    };
  }

  // Get comprehensive team statistics
  async getTeamStatistics(): Promise<{
    totalTeams: number;
    teamsWithFreshData: number;
    teamsNeedingUpdate: number;
    cacheHitRate: number;
  }> {
    const totalTeams = Object.keys(this.teamMapping).length;
    const freshDataThreshold = 6 * 60 * 60 * 1000; // 6 hours

    let teamsWithFreshData = 0;
    let cacheHits = 0;
    let totalRequests = 0;

    for (const [teamName, lastUpdate] of this.lastSquadUpdate.entries()) {
      totalRequests++;
      if (Date.now() - lastUpdate < freshDataThreshold) {
        teamsWithFreshData++;
        cacheHits++;
      }
    }

    return {
      totalTeams,
      teamsWithFreshData,
      teamsNeedingUpdate: totalTeams - teamsWithFreshData,
      cacheHitRate: totalRequests > 0 ? (cacheHits / totalRequests) * 100 : 0,
    };
  }
}

const laLigaApiService = new LaLigaApiService();
export default laLigaApiService;
export { LaLigaPlayer };
