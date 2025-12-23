// Enhanced League 1 API Service with Dual API Integration
// Fetches real player data and headshots for League 1 teams using unified dual API support
// Uses EXPO_PUBLIC_API_FOOTBALL_KEY and EXPO_PUBLIC_THE_SPORTSDB_API_KEY from environment variables
import theSportsDbApiService from "./theSportsDbApiService";

interface League1Player {
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

class League1ApiService {
  private baseUrl = "https://v3.football.api-sports.io";
  private sportsDbUrl = "https://www.thesportsdb.com/api/v1/json";
  private apiKey: string;
  private sportsDbKey: string;
  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours

  // Ligue 1 ID from API-Sports
  private ligue1Id = 61;

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
      console.log("🧪 Testing dual API connection for League 1...");
      
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

      // Test with a simple League 1 team lookup
      const response = await fetch(`${this.sportsDbUrl}/1/searchteams.php?t=PSG`);
      
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

  // League 1 team name to API-Sports team ID mapping (2025/26 Season)
  private teamMapping: Record<string, number> = {
    "Paris Saint Germain": 85,
    "PSG": 85,
    "Paris Saint-Germain": 85,
    "Marseille": 81,
    "Olympique de Marseille": 81,
    "Lens": 116,
    "RC Lens": 116,
    "Lille": 79,
    "LOSC Lille": 79,
    "Monaco": 91,
    "AS Monaco": 91,
    "Lyon": 80,
    "Olympique Lyonnais": 80,
    "Strasbourg": 167,
    "RC Strasbourg": 167,
    "Nice": 82,
    "OGC Nice": 82,
    "Toulouse": 96,
    "Toulouse FC": 96,
    "Rennes": 94,
    "Stade Rennais FC": 94,
    "Paris FC": 160,
    "Paris Football Club": 160,
    "Le Havre": 144,
    "Le Havre AC": 144,
    "Brest": 512,
    "Stade Brestois 29": 512,
    "Angers": 532,
    "Angers SCO": 532,
    "Nantes": 83,
    "FC Nantes": 83,
    "Lorient": 107,
    "FC Lorient": 107,
    "Metz": 545,
    "FC Metz": 545,
    "Auxerre": 1063,
    "AJ Auxerre": 1063,
  };

  // Get League 1 team ID by team name
  getTeamId(teamName: string): number | null {
    return this.teamMapping[teamName] || null;
  }

  // Get League 1 team players
  async getLeague1TeamPlayers(
    teamName: string,
    season: number = 2025,
  ): Promise<League1Player[]> {
    try {
      const teamId = this.getTeamId(teamName);

      if (!teamId) {
        console.warn(`No League 1 team found for ${teamName}`);
        return this.getFallbackPlayers(teamName);
      }

      console.log(`🔄 Fetching ${teamName} players from API-Sports...`);
      console.log(`📍 Team ID: ${teamId}, Season: ${season}`);

      // Try different approaches to get player data
      let response;

      try {
        // First try with current season
        console.log(
          `📡 Trying API call: /players?team=${teamId}&season=${season}&league=${this.ligue1Id}`,
        );
        response = await this.makeRequest<PlayerResponse>("/players", {
          team: teamId,
          season: season,
          league: this.ligue1Id,
        });
        console.log(
          `✅ Got ${response.response?.length || 0} players from ${season} season`,
        );
      } catch (error) {
        console.warn(
          `❌ Failed to fetch players for season ${season}, error:`,
          error,
        );
        console.warn(`🔄 Trying 2024 season...`);
        try {
          // Fallback to 2024 season
          response = await this.makeRequest<PlayerResponse>("/players", {
            team: teamId,
            season: 2024,
            league: this.ligue1Id,
          });
          console.log(
            `✅ Got ${response.response?.length || 0} players from 2024 season`,
          );
        } catch (error2) {
          console.warn(`❌ Failed to fetch players for 2024, error:`, error2);
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

      const players: League1Player[] = response.response.map(
        (playerData: any) => {
          const player = playerData.player || playerData;
          const stats = playerData.statistics ? playerData.statistics[0] : {};

          const processedPlayer = {
            id: player.id || Math.random() * 1000,
            name: player.name || `${teamName} Player`,
            firstname: player.firstname || "Player",
            lastname: player.lastname || "",
            age: player.age || 25,
            nationality: player.nationality || "France",
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

  // Enhanced photo URL getter with multiple sources and fallbacks
  getPlayerPhoto(player: League1Player): string {
    const sources = [
      player.photo, // API-Sports primary
      `https://img.a.transfermarkt.technology/portrait/header/${player.id}.jpg`,
      `https://resources.ligue1.com/ligue1/photos/players/250x250/p${player.id}.png`,
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
  private getFallbackPlayers(teamName: string): League1Player[] {
    console.log(`🔄 Using fallback players for ${teamName}`);

    const fallbackPSGPlayers = [
      "Gianluigi Donnarumma",
      "Keylor Navas",
      "Achraf Hakimi",
      "Marquinhos",
      "Presnel Kimpembe",
      "Nuno Mendes",
      "Sergio Ramos",
      "Danilo Pereira",
      "Marco Verratti",
      "Vitinha",
      "Warren Zaïre-Emery",
      "Fabián Ruiz",
      "Carlos Soler",
      "Lee Kang-in",
      "Ousmane Dembélé",
      "Bradley Barcola",
      "Kylian Mbappé",
      "Gonçalo Ramos",
      "Randal Kolo Muani",
      "Marco Asensio",
      "Milan Škriniar",
      "Lucas Hernández",
      "Manuel Ugarte",
    ];

    const fallbackMarseilleePlayers = [
      "Pau López",
      "Rubén Blanco",
      "Jonathan Clauss",
      "Chancel Mbemba",
      "Leonardo Balerdi",
      "Samuel Gigot",
      "Quentin Merlin",
      "Ulisses Garcia",
      "Jordan Veretout",
      "Valentin Rongier",
      "Geoffrey Kondogbia",
      "Azzedine Ounahi",
      "Amine Harit",
      "Pierre-Emerick Aubameyang",
      "Vitinha",
      "Iliman Ndiaye",
      "Ismaïla Sarr",
      "Luis Henrique",
      "Faris Moumbagna",
      "Joaquín Correa",
      "Bamo Meïté",
      "Amir Murillo",
      "Derek Cornelius",
    ];

    const fallbackMonacoPlayers = [
      "Alexander Nübel",
      "Radosław Majecki",
      "Vanderson",
      "Thilo Kehrer",
      "Wilfried Singo",
      "Caio Henrique",
      "Denis Zakaria",
      "Youssouf Fofana",
      "Aurélien Tchouaméni",
      "Aleksandr Golovin",
      "Takumi Minamino",
      "Wissam Ben Yedder",
      "Folarin Balogun",
      "Breel Embolo",
      "Eliesse Ben Seghir",
      "Maghnes Akliouche",
      "Ismail Jakobs",
      "Soungoutou Magassa",
      "Mamadou Coulibaly",
      "Chrislain Matsima",
      "Edan Diop",
      "Myron Boadu",
      "Krépin Diatta",
    ];

    const fallbackLyonPlayers = [
      "Anthony Lopes",
      "Lucas Perri",
      "Nicolás Tagliafico",
      "Duje Ćaleta-Car",
      "Jake O'Brien",
      "Ainsley Maitland-Niles",
      "Maxence Caqueret",
      "Nemanja Matić",
      "Corentin Tolisso",
      "Jordan Veretout",
      "Rayan Cherki",
      "Alexandre Lacazette",
      "Georges Mikautadze",
      "Malick Fofana",
      "Ernest Nuamah",
      "Gift Orban",
      "Saïd Benrahma",
      "Abner Vinícius",
      "Clinton Mata",
      "Moussa Niakhaté",
      "Warmed Omari",
      "Tanner Tessmann",
      "Saël Kumbedi",
    ];

    // Get team-specific fallback players
    const getTeamFallbackPlayers = () => {
      switch (teamName.toLowerCase()) {
        case "psg":
        case "paris saint germain":
        case "paris saint-germain":
          return fallbackPSGPlayers;
        case "marseille":
        case "olympique de marseille":
          return fallbackMarseilleePlayers;
        case "monaco":
        case "as monaco":
          return fallbackMonacoPlayers;
        case "lyon":
        case "olympique lyonnais":
          return fallbackLyonPlayers;
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
      nationality: "France",
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
        id: this.getTeamId(teamName) || 85,
        name: teamName,
        logo: "",
      },
    }));
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
      const cacheKey = `/players_${teamName}_2025`;
      const cached = this.cache.get(cacheKey);
      
      // Get fresh data from API
      const freshPlayers = await this.getLeague1TeamPlayers(teamName, 2025);
      
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
  async forceRefreshTeamData(teamName: string): Promise<League1Player[]> {
    console.log(`🔄 Force refreshing data for ${teamName}...`);
    
    // Clear cache for this team
    const cacheKeys = Array.from(this.cache.keys()).filter(key => key.includes(teamName));
    cacheKeys.forEach(key => this.cache.delete(key));
    
    // Fetch fresh data
    return await this.getLeague1TeamPlayers(teamName, 2025);
  }

  // Test API connection and authentication
  async testApiConnection(): Promise<{ success: boolean; message: string }> {
    try {
      console.log("🧪 Testing League 1 API connection...");
      console.log("🔑 API Key status:", this.apiKey ? "Present" : "Missing");

      if (!this.apiKey) {
        return {
          success: false,
          message:
            "API key is missing. Check EXPO_PUBLIC_API_FOOTBALL_KEY in .env.local",
        };
      }

      // Test request to get League 1 teams
      const response = await fetch(
        `${this.baseUrl}/teams?league=${this.ligue1Id}&season=2025`,
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

      console.log("✅ League 1 API connection successful!");
      return {
        success: true,
        message: `Successfully connected to API. Found ${data.results} League 1 teams.`,
      };
    } catch (error) {
      console.error("❌ League 1 API connection test failed:", error);
      return {
        success: false,
        message: `Connection error: ${error}`,
      };
    }
  }

  // Clear cache (useful for development/testing)
  clearCache(): void {
    this.cache.clear();
    console.log("🗑️ League 1 API cache cleared");
  }
}

// Export singleton instance
const league1ApiService = new League1ApiService();
export default league1ApiService;

// Export types for use in components
export type { League1Player };