// Enhanced Serie A API Service with Dual API Integration
// Fetches real player data and headshots for Serie A teams using unified dual API support
// Uses EXPO_PUBLIC_API_FOOTBALL_KEY and EXPO_PUBLIC_THE_SPORTSDB_API_KEY from environment variables
import theSportsDbApiService from "./theSportsDbApiService";

interface SerieAPlayer {
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

class SerieAApiService {
  private baseUrl = "https://v3.football.api-sports.io";
  private sportsDbUrl = "https://www.thesportsdb.com/api/v1/json";
  private apiKey: string;
  private sportsDbKey: string;
  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours

  // Serie A ID from API-Sports
  private serieAId = 135;

  constructor() {
    // Use both API keys from environment variables
    this.apiKey = process.env.EXPO_PUBLIC_API_FOOTBALL_KEY || "";
    this.sportsDbKey = process.env.EXPO_PUBLIC_THE_SPORTSDB_API_KEY || "";

    if (!this.apiKey) {
      console.warn(
        "EXPO_PUBLIC_API_FOOTBALL_KEY not found in environment variables",
      );
    }
    if (!this.sportsDbKey) {
      console.warn(
        "EXPO_PUBLIC_THE_SPORTSDB_API_KEY not found in environment variables",
      );
    }
  }

  // Test dual API connection
  async testDualApiConnection(): Promise<{ success: boolean; message: string; details: any }> {
    try {
      console.log("🧪 Testing dual API connection for Serie A...");
      
      const apiFootballTest = await this.testApiConnection();
      const sportsDbTest = await this.testTheSportsDbConnection();
      
      return {
        success: apiFootballTest.success || sportsDbTest.success,
        message: `API-Football: ${apiFootballTest.success ? '✅' : '❌'}, TheSportsDB: ${sportsDbTest.success ? '✅' : '❌'}`,
        details: {
          apiFootball: apiFootballTest,
          theSportsDb: sportsDbTest
        }
      };
    } catch (error) {
      return {
        success: false,
        message: `Dual API test failed: ${error}`,
        details: { error }
      };
    }
  }

  // Test TheSportsDB connection
  async testTheSportsDbConnection(): Promise<{ success: boolean; message: string }> {
    try {
      console.log("🧪 Testing TheSportsDB API connection...");
      
      if (!this.sportsDbKey) {
        return {
          success: false,
          message: "TheSportsDB API key is missing"
        };
      }

      // Test with a simple Serie A team lookup
      const response = await fetch(`${this.sportsDbUrl}/1/searchteams.php?t=Juventus`);
      
      if (!response.ok) {
        return {
          success: false,
          message: `TheSportsDB connection failed: ${response.status}`
        };
      }

      const data = await response.json();
      
      return {
        success: true,
        message: `TheSportsDB connected successfully. Found ${data.teams?.length || 0} teams.`
      };
    } catch (error) {
      return {
        success: false,
        message: `TheSportsDB connection error: ${error}`
      };
    }
  }

  private async makeRequest<T>(
    endpoint: string,
    params: Record<string, any> = {},
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

    try {
      console.log(`📡 Making API request: ${url}`);
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "x-rapidapi-key": this.apiKey,
          "x-rapidapi-host": "v3.football.api-sports.io",
        },
      });

      if (!response.ok) {
        throw new Error(
          `API request failed: ${response.status} ${response.statusText}`,
        );
      }

      const data = await response.json();

      // Debug: Log the full API response structure
      console.log(`✅ API request successful: ${data.results} results`);

      if (data.response && data.response.length > 0) {
        console.log(`🔍 Sample photo URLs from first 3 players:`);
        data.response.slice(0, 3).forEach((item: any, index: number) => {
          const player = item.player || item;
          console.log(
            `   Player ${index + 1}: ${player.name || "Unknown"} -> Photo: "${player.photo || "No photo"}"`,
          );
        });
      }

      // Cache the response
      this.cache.set(cacheKey, { data, timestamp: Date.now() });

      return data;
    } catch (error) {
      console.error(`❌ Error fetching from ${endpoint}:`, error);
      throw error;
    }
  }

  // Serie A team name to API-Sports team ID mapping (2024-25 Season)
  private teamMapping: Record<string, number> = {
    "Juventus": 496,
    "Juventus FC": 496,
    "Inter": 505,
    "FC Internazionale Milano": 505,
    "Internazionale": 505,
    "AC Milan": 489,
    "Milan": 489,
    "Napoli": 492,
    "SSC Napoli": 492,
    "Atalanta": 499,
    "Atalanta BC": 499,
    "Roma": 497,
    "AS Roma": 497,
    "Lazio": 487,
    "SS Lazio": 487,
    "Fiorentina": 502,
    "ACF Fiorentina": 502,
    "Bologna": 500,
    "Bologna FC 1909": 500,
    "Torino": 503,
    "Torino FC": 503,
    "Genoa": 488,
    "Genoa CFC": 488,
    "Udinese": 494,
    "Udinese Calcio": 494,
    "Sassuolo": 488,
    "US Sassuolo Calcio": 488,
    "Hellas Verona": 504,
    "Hellas Verona FC": 504,
    "Verona": 504,
    "Lecce": 867,
    "US Lecce": 867,
    "Cagliari": 490,
    "Cagliari Calcio": 490,
    "Parma": 491,
    "Parma Calcio 1913": 491,
    "Como": 1106,
    "Como 1907": 1106,
    "Pisa": 1579, // Updated team ID for Pisa
    "Pisa Sporting Club": 1579,
    "Cremonese": 511, // Updated team ID for Cremonese
    "US Cremonese": 511,
  };

  // Get Serie A team ID by team name
  getTeamId(teamName: string): number | null {
    return this.teamMapping[teamName] || null;
  }

  // Get Serie A team players
  async getSerieATeamPlayers(
    teamName: string,
    season: number = 2024,
  ): Promise<SerieAPlayer[]> {
    try {
      const teamId = this.getTeamId(teamName);

      if (!teamId) {
        console.warn(`No Serie A team found for ${teamName}`);
        return this.getFallbackPlayers(teamName);
      }

      console.log(`🔄 Fetching ${teamName} players from API-Sports...`);
      console.log(`📍 Team ID: ${teamId}, Season: ${season}`);

      // Try different approaches to get player data
      let response;

      try {
        // First try with current season
        console.log(
          `📡 Trying API call: /players?team=${teamId}&season=${season}&league=${this.serieAId}`,
        );
        response = await this.makeRequest<PlayerResponse>("/players", {
          team: teamId,
          season: season,
          league: this.serieAId,
        });
        console.log(
          `✅ Got ${response.response?.length || 0} players from ${season} season`,
        );
      } catch (error) {
        console.warn(
          `❌ Failed to fetch players for season ${season}, error:`,
          error,
        );
        console.warn(`🔄 Trying 2023 season...`);
        try {
          // Fallback to 2023 season
          response = await this.makeRequest<PlayerResponse>("/players", {
            team: teamId,
            season: 2023,
            league: this.serieAId,
          });
          console.log(
            `✅ Got ${response.response?.length || 0} players from 2023 season`,
          );
        } catch (error2) {
          console.warn(`❌ Failed to fetch players for 2023, error:`, error2);
          console.warn(`🔄 Trying without league filter...`);
          // Try without league filter
          response = await this.makeRequest<PlayerResponse>("/players", {
            team: teamId,
            season: season,
          });
          console.log(
            `✅ Got ${response.response?.length || 0} players without league filter`,
          );
        }
      }

      if (!response || !response.response || response.response.length === 0) {
        console.warn(`No player data found for ${teamName}, using fallback`);
        return this.getFallbackPlayers(teamName);
      }

      const players: SerieAPlayer[] = response.response.map(
        (playerData: any) => {
          const player = playerData.player || playerData;
          const stats = playerData.statistics ? playerData.statistics[0] : {};

          const processedPlayer = {
            id: player.id || Math.random() * 1000,
            name: player.name || `${teamName} Player`,
            firstname: player.firstname || "Player",
            lastname: player.lastname || "",
            age: player.age || 25,
            nationality: player.nationality || "Italy",
            height: player.height || null,
            weight: player.weight || null,
            photo: player.photo || "",
            position: stats.games?.position || player.position || "Unknown",
            team: {
              id: stats.team?.id || teamId,
              name: stats.team?.name || teamName,
              logo: stats.team?.logo || "",
            },
          };

          console.log(`👤 Processing player: ${processedPlayer.name}`);
          console.log(`   📸 Photo URL: "${processedPlayer.photo}"`);
          console.log(`   🆔 Player ID: ${processedPlayer.id}`);
          console.log(`   🏃 Position: ${processedPlayer.position}`);
          console.log(`   🌍 Nationality: ${processedPlayer.nationality}`);

          return processedPlayer;
        },
      );

      console.log(`✅ Successfully processed ${players.length} players`);
      return players;
    } catch (error) {
      console.error(`❌ Error fetching ${teamName} players:`, error);
      return this.getFallbackPlayers(teamName);
    }
  }

  // Get Juventus players specifically
  async getJuventusPlayers(): Promise<SerieAPlayer[]> {
    return this.getSerieATeamPlayers("Juventus");
  }

  // Enhanced photo URL getter with multiple sources and fallbacks
  getPlayerPhoto(player: SerieAPlayer): string {
    const sources = [
      player.photo, // API-Sports primary
      `https://img.a.transfermarkt.technology/portrait/header/${player.id}.jpg`,
      `https://resources.serie-a.com/serie-a/photos/players/250x250/p${player.id}.png`,
      `https://media.api-sports.io/football/players/${player.id}.png`,
      // Fallback to placeholder will be handled by component
    ];

    // Find first valid URL
    for (const url of sources) {
      if (url && this.isValidImageUrl(url)) {
        return this.enhancePhotoUrl(url);
      }
    }

    return ""; // Component will handle placeholder
  }

  // Check if image URL is potentially valid
  private isValidImageUrl(url: string): boolean {
    if (!url || url === "") return false;
    
    // Basic URL validation
    try {
      new URL(url.startsWith('http') ? url : `https://${url}`);
      return true;
    } catch {
      return false;
    }
  }

  // Enhanced photo URL getter with fallbacks
  private enhancePhotoUrl(url: string): string {
    if (!url || url === "") return "";

    // If it's already a full URL, return as is
    if (url.startsWith("http")) {
      return url;
    }

    // If it's a relative path from API-Sports, make it absolute
    if (url.startsWith("/")) {
      return `https://media.api-sports.io/football/players${url}`;
    }

    return url;
  }

  // Fallback players if API fails
  private getFallbackPlayers(teamName: string): SerieAPlayer[] {
    console.log(`🔄 Using fallback players for ${teamName}`);

    const fallbackJuventusPlayers = [
      "Wojciech Szczęsny",
      "Mattia Perin",
      "Danilo",
      "Gleison Bremer",
      "Alex Sandro",
      "Juan Cuadrado",
      "Mattia De Sciglio",
      "Federico Gatti",
      "Weston McKennie",
      "Manuel Locatelli",
      "Adrien Rabiot",
      "Paul Pogba",
      "Fabio Miretti",
      "Nicolò Fagioli",
      "Federico Chiesa",
      "Filip Kostić",
      "Ángel Di María",
      "Dušan Vlahović",
      "Arkadiusz Milik",
      "Moise Kean",
      "Samuel Iling-Junior",
      "Kenan Yıldız",
      "Timothy Weah",
    ];

    const fallbackInterPlayers = [
      "André Onana",
      "Yann Sommer",
      "Alessandro Bastoni",
      "Milan Škriniar",
      "Stefan de Vrij",
      "Matteo Darmian",
      "Denzel Dumfries",
      "Federico Dimarco",
      "Nicolò Barella",
      "Marcelo Brozović",
      "Hakan Çalhanoğlu",
      "Henrikh Mkhitaryan",
      "Kristjan Asllani",
      "Lautaro Martínez",
      "Romelu Lukaku",
      "Edin Džeko",
      "Joaquín Correa",
      "Alexis Sánchez",
      "Marcus Thuram",
      "Marko Arnautović",
      "Carlos Augusto",
      "Yann Bisseck",
      "Davide Frattesi",
    ];

    const fallbackMilanPlayers = [
      "Mike Maignan",
      "Marco Sportiello",
      "Theo Hernández",
      "Pierre Kalulu",
      "Fikayo Tomori",
      "Matteo Gabbia",
      "Malick Thiaw",
      "Davide Calabria",
      "Alessandro Florenzi",
      "Sandro Tonali",
      "Tijjani Reijnders",
      "Yunus Musah",
      "Ruben Loftus-Cheek",
      "Ismaël Bennacer",
      "Rafael Leão",
      "Christian Pulisic",
      "Samuel Chukwueze",
      "Olivier Giroud",
      "Tammy Abraham",
      "Luka Jović",
      "Noah Okafor",
      "Emerson Royal",
      "Strahinja Pavlović",
    ];

    const fallbackNapoliPlayers = [
      "Alex Meret",
      "Pierluigi Gollini",
      "Amir Rrahmani",
      "Juan Jesus",
      "Natan",
      "Mathías Olivera",
      "Giovanni Di Lorenzo",
      "Mario Rui",
      "Stanislav Lobotka",
      "Frank Anguissa",
      "Piotr Zieliński",
      "Jens Cajuste",
      "Jesper Lindstrøm",
      "Khvicha Kvaratskhelia",
      "Matteo Politano",
      "Giacomo Raspadori",
      "Victor Osimhen",
      "Giovanni Simeone",
      "Cyril Ngonge",
      "Scott McTominay",
      "Billy Gilmour",
      "Alessandro Buongiorno",
      "Leonardo Spinazzola",
    ];

    const fallbackPisaPlayers = [
      "Nicolas Andrade",
      "Adrian Rus",
      "Samuele Angori",
      "Pietro Beruatto",
      "Arturo Calabresi",
      "Giovanni Bonfanti",
      "Mattéo Tramoni",
      "Idrissa Touré",
      "Marius Marin",
      "Alessandro Arena",
      "Stefano Moreo",
      "Nicholas Bonfanti",
      "Gabriele Piccinini",
      "Simone Canestrelli",
      "Malthe Højholt",
      "Jan Mlakar",
      "Emanuel Vignato",
      "Oliver Abildgaard",
      "Zan Jevsenak",
      "Mattia Valoti",
      "Luca Lezzerini",
      "Maxime Leverbe",
      "Alessandro De Vitis",
    ];

    const fallbackCremonesePlayers = [
      "Marco Carnesecchi",
      "Mouhamadou Sarr",
      "Matteo Bianchetti",
      "Johan Vásquez",
      "Emanuele Valeri",
      "Michele Castagnetti",
      "Soualiho Meïté",
      "Charles Pickel",
      "Cristian Buonaiuto",
      "Daniel Ciofani",
      "David Okereke",
      "Frank Tsadjout",
      "Luka Lochoshvili",
      "Paolo Ghiglione",
      "Alex Ferrari",
      "Leonardo Sernicola",
      "Giacomo Quagliata",
      "Santiago Ascacíbar",
      "Marco Benassi",
      "Felix Afena-Gyan",
      "Michele Collocolo",
      "Jari Vandeputte",
      "Tommaso Barbieri",
    ];

    // Get team-specific fallback players
    const getTeamFallbackPlayers = () => {
      switch (teamName.toLowerCase()) {
        case "juventus":
        case "juventus fc":
          return fallbackJuventusPlayers;
        case "inter":
        case "fc internazionale milano":
        case "internazionale":
          return fallbackInterPlayers;
        case "ac milan":
        case "milan":
          return fallbackMilanPlayers;
        case "napoli":
        case "ssc napoli":
          return fallbackNapoliPlayers;
        case "pisa":
        case "pisa sporting club":
          return fallbackPisaPlayers;
        case "cremonese":
        case "us cremonese":
          return fallbackCremonesePlayers;
        default:
          return Array.from(
            { length: 23 },
            (_, i) => `${teamName} Player ${i + 1}`,
          );
      }
    };

    const teamPlayers = getTeamFallbackPlayers();

    return teamPlayers.slice(0, 27).map((name, index) => ({
      id: index + 1,
      name: name,
      firstname: name.split(" ")[0],
      lastname: name.split(" ").slice(1).join(" "),
      age: 25,
      nationality: "Italy",
      height: null,
      weight: null,
      photo: "", // Will be empty, forcing initials fallback
      position:
        index < 2
          ? "Goalkeeper"
          : index < 10
            ? "Defender"
            : index < 17
              ? "Midfielder"
              : "Forward",
      team: {
        id: this.getTeamId(teamName) || 496,
        name: teamName,
        logo: "",
      },
    }));
  }



  // Enhanced synchronous photo method with dual API support
  getPlayerPhotoSync(player: SerieAPlayer): string {
    // First priority: Use the photo already assigned to the player
    if (
      player.photo &&
      player.photo !== "" &&
      !player.photo.includes("placeholder")
    ) {
      return this.enhancePhotoUrl(player.photo);
    }

    // Known player photo mappings for immediate use
    const knownPhotos: { [key: string]: string } = {
      // Juventus players
      "Dušan Vlahović": "https://media.api-sports.io/football/players/91845.png",
      "Federico Chiesa": "https://media.api-sports.io/football/players/47709.png",
      "Paul Pogba": "https://media.api-sports.io/football/players/85.png",
      "Weston McKennie": "https://media.api-sports.io/football/players/6306.png",
      "Wojciech Szczęsny": "https://media.api-sports.io/football/players/328.png",
      "Adrien Rabiot": "https://media.api-sports.io/football/players/609.png",

      // Inter players
      "Lautaro Martínez": "https://media.api-sports.io/football/players/1452.png",
      "Romelu Lukaku": "https://media.api-sports.io/football/players/739.png",
      "Nicolò Barella": "https://media.api-sports.io/football/players/47840.png",
      "Alessandro Bastoni": "https://media.api-sports.io/football/players/47881.png",
      "André Onana": "https://media.api-sports.io/football/players/274.png",

      // AC Milan players
      "Rafael Leão": "https://media.api-sports.io/football/players/47531.png",
      "Theo Hernández": "https://media.api-sports.io/football/players/1446.png",
      "Mike Maignan": "https://media.api-sports.io/football/players/276.png",
      "Olivier Giroud": "https://media.api-sports.io/football/players/173.png",
      "Christian Pulisic": "https://media.api-sports.io/football/players/1171.png",

      // Napoli players
      "Victor Osimhen": "https://media.api-sports.io/football/players/47635.png",
      "Khvicha Kvaratskhelia": "https://media.api-sports.io/football/players/100836.png",
      "Piotr Zieliński": "https://media.api-sports.io/football/players/636.png",
      "Giovanni Di Lorenzo": "https://media.api-sports.io/football/players/2416.png",
    };

    const playerKey = player.name.trim();
    if (knownPhotos[playerKey]) {
      console.log(`📷 Using known photo for ${playerKey}`);
      return knownPhotos[playerKey];
    }

    // No immediate photo available
    console.log(`📷 No immediate photo available for ${player.name}`);
    return "";
  }

  // Test API connection and authentication
  async testApiConnection(): Promise<{ success: boolean; message: string }> {
    try {
      console.log("🧪 Testing Serie A API connection...");
      console.log("🔑 API Key status:", this.apiKey ? "Present" : "Missing");

      if (!this.apiKey) {
        return {
          success: false,
          message:
            "API key is missing. Check EXPO_PUBLIC_API_FOOTBALL_KEY in .env.local",
        };
      }

      // Test request to get Serie A teams
      const response = await fetch(
        `${this.baseUrl}/teams?league=${this.serieAId}&season=2024`,
        {
          method: "GET",
          headers: {
            "x-rapidapi-key": this.apiKey,
            "x-rapidapi-host": "v3.football.api-sports.io",
          },
        },
      );

      if (!response.ok) {
        return {
          success: false,
          message: `API connection failed: ${response.status} ${response.statusText}`,
        };
      }

      const data = await response.json();

      if (data.errors && data.errors.length > 0) {
        return {
          success: false,
          message: `API returned errors: ${data.errors.join(", ")}`,
        };
      }

      console.log("✅ Serie A API connection successful!");
      return {
        success: true,
        message: `Successfully connected to API. Found ${data.results} Serie A teams.`,
      };
    } catch (error) {
      console.error("❌ Serie A API connection test failed:", error);
      return {
        success: false,
        message: `Connection error: ${error}`,
      };
    }
  }

  // Simple API test to verify we're getting different players
  async testJuventusAPI(): Promise<void> {
    console.log("🧪 [TEST] Testing Juventus API specifically...");

    try {
      const teamId = 496; // Juventus
      const response = await this.makeRequest<PlayerResponse>("/players", {
        team: teamId,
        season: 2024,
        league: this.serieAId,
      });

      if (response.response && response.response.length > 0) {
        console.log(`🧪 [TEST] Found ${response.response.length} players`);

        // Log first 5 players
        response.response.slice(0, 5).forEach((playerData: any, index) => {
          const player = playerData.player || playerData;
          console.log(
            `   ${index + 1}. ${player.name} (${player.position || "N/A"}) - Photo: ${player.photo ? "✅" : "❌"}`,
          );
        });
      } else {
        console.log("🧪 [TEST] No players found");
      }
    } catch (error) {
      console.error("🧪 [TEST] Error:", error);
    }
  }

  // Get all Serie A teams
  async getSerieATeams(): Promise<any[]> {
    try {
      const response = await this.makeRequest<any>("/teams", {
        league: this.serieAId,
        season: 2024,
      });

      return response.response || [];
    } catch (error) {
      console.error("❌ Error fetching Serie A teams:", error);
      return [];
    }
  }

  // Data freshness check - Compare current squad with API data
  async checkForSquadUpdates(teamName: string): Promise<{
    hasUpdates: boolean;
    outdatedPlayers: string[];
    newPlayers: string[];
    lastUpdated: Date;
  }> {
    try {
      console.log(`🔍 Checking squad updates for ${teamName}...`);
      
      // Get current cached data
      const cacheKey = `/players_${teamName}_2024`;
      const cached = this.cache.get(cacheKey);
      
      // Get fresh data from API
      const freshPlayers = await this.getSerieATeamPlayers(teamName, 2024);
      
      if (!cached) {
        return {
          hasUpdates: true,
          outdatedPlayers: [],
          newPlayers: freshPlayers.map(p => p.name),
          lastUpdated: new Date()
        };
      }
      
      const cachedPlayers = cached.data.response?.map((p: any) => p.player?.name || p.name) || [];
      const freshPlayerNames = freshPlayers.map(p => p.name);
      
      // Find differences
      const outdatedPlayers = cachedPlayers.filter((name: string) => !freshPlayerNames.includes(name));
      const newPlayers = freshPlayerNames.filter(name => !cachedPlayers.includes(name));
      
      const hasUpdates = outdatedPlayers.length > 0 || newPlayers.length > 0;
      
      console.log(`📊 Squad update check for ${teamName}:`);
      console.log(`   - Outdated players: ${outdatedPlayers.length}`);
      console.log(`   - New players: ${newPlayers.length}`);
      console.log(`   - Has updates: ${hasUpdates}`);
      
      return {
        hasUpdates,
        outdatedPlayers,
        newPlayers,
        lastUpdated: new Date(cached.timestamp)
      };
      
    } catch (error) {
      console.error(`❌ Error checking squad updates for ${teamName}:`, error);
      return {
        hasUpdates: false,
        outdatedPlayers: [],
        newPlayers: [],
        lastUpdated: new Date()
      };
    }
  }

  // Force refresh player data for a team
  async forceRefreshTeamData(teamName: string): Promise<SerieAPlayer[]> {
    console.log(`🔄 Force refreshing data for ${teamName}...`);
    
    // Clear cache for this team
    const cacheKeys = Array.from(this.cache.keys()).filter(key => key.includes(teamName));
    cacheKeys.forEach(key => this.cache.delete(key));
    
    // Fetch fresh data
    return await this.getSerieATeamPlayers(teamName, 2024);
  }

  // Get data freshness status for all Serie A teams
  async getDataFreshnessReport(): Promise<{
    totalTeams: number;
    outdatedTeams: string[];
    lastGlobalUpdate: Date;
    recommendRefresh: boolean;
  }> {
    try {
      console.log("📊 Generating data freshness report...");
      
      const teams = [
        "Juventus", "Inter", "AC Milan", "Napoli", "Atalanta", "Roma", "Lazio", 
        "Fiorentina", "Bologna", "Torino", "Genoa", "Udinese", "Sassuolo",
        "Hellas Verona", "Lecce", "Cagliari", "Parma", "Como", "Pisa", "Cremonese"
      ];
      
      const outdatedTeams: string[] = [];
      let oldestUpdate = new Date();
      
      for (const team of teams) {
        const updateCheck = await this.checkForSquadUpdates(team);
        if (updateCheck.hasUpdates) {
          outdatedTeams.push(team);
        }
        if (updateCheck.lastUpdated < oldestUpdate) {
          oldestUpdate = updateCheck.lastUpdated;
        }
      }
      
      const daysSinceUpdate = Math.floor((Date.now() - oldestUpdate.getTime()) / (1000 * 60 * 60 * 24));
      const recommendRefresh = daysSinceUpdate > 7 || outdatedTeams.length > 5;
      
      console.log(`📊 Freshness Report:`);
      console.log(`   - Total teams: ${teams.length}`);
      console.log(`   - Outdated teams: ${outdatedTeams.length}`);
      console.log(`   - Days since oldest update: ${daysSinceUpdate}`);
      console.log(`   - Recommend refresh: ${recommendRefresh}`);
      
      return {
        totalTeams: teams.length,
        outdatedTeams,
        lastGlobalUpdate: oldestUpdate,
        recommendRefresh
      };
      
    } catch (error) {
      console.error("❌ Error generating freshness report:", error);
      return {
        totalTeams: 20,
        outdatedTeams: [],
        lastGlobalUpdate: new Date(),
        recommendRefresh: false
      };
    }
  }

  // Clear cache (useful for development/testing)
  clearCache(): void {
    this.cache.clear();
    console.log("🗑️ Serie A API cache cleared");
  }
}

// Export singleton instance
const serieAApiService = new SerieAApiService();
export default serieAApiService;

// Export types for use in components
export type { SerieAPlayer };
