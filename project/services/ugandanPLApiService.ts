// Enhanced Ugandan Premier League API Service with Dual API Integration
// Fetches real player data and headshots for Ugandan PL teams using unified dual API support
// Uses EXPO_PUBLIC_API_FOOTBALL_KEY and EXPO_PUBLIC_THE_SPORTSDB_API_KEY from environment variables
import theSportsDbApiService from "./theSportsDbApiService";

interface UgandanPLPlayer {
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
      number: number | null;
      position: string;
      rating: string | null;
      captain: boolean;
    };
  }>;
}

class UgandanPLApiService {
  private baseUrl = "https://v3.football.api-sports.io";
  private sportsDbUrl = "https://www.thesportsdb.com/api/v1/json";
  private apiKey: string;
  private sportsDbKey: string;
  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours

  // Ugandan Premier League ID from API-Sports
  private ugandanPLId = 288; // This may need verification for actual Ugandan PL

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
    console.log("🇺🇬 Ugandan PL API Service initialized");
  }

  // Test dual API connection
  async testDualApiConnection(): Promise<{ success: boolean; message: string; details: any }> {
    try {
      console.log("🧪 Testing dual API connection for Ugandan PL...");
      
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

      // Test with a simple Ugandan team lookup
      const response = await fetch(`${this.sportsDbUrl}/1/searchteams.php?t=KCCA`);
      
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

  // Ugandan PL team name to API-Sports team ID mapping (Current Season)
  private teamMapping: Record<string, number> = {
    "KCCA": 1001, // Estimated IDs - may need verification
    "KCCA FC": 1001,
    "Police FC": 1002,
    "Uganda Police FC": 1002,
    "SC Villa": 1003,
    "Sports Club Villa": 1003,
    "BUL FC": 1004,
    "Busoga United Lukaya FC": 1004,
    "Bahimba United": 1005,
    "Bahimba United Saints FC": 1005,
    "Express FC": 1006,
    "Express Football Club": 1006,
    "Kitara FC": 1007,
    "Kitara Football Club": 1007,
    "URA FC": 1008,
    "Uganda Revenue Authority FC": 1008,
    "UPPC FC": 1009,
    "Uganda Petroleum Pipeline Corporation FC": 1009,
    "NEC FC": 1010,
    "National Enterprise Corporation FC": 1010,
    "Maroons FC": 1011,
    "Maroons Football Club": 1011,
    "Lugazi FC": 1012,
    "Lugazi Football Club": 1012,
    "Vipers SC": 1013,
    "Vipers Sports Club": 1013,
    "UPDF FC": 1014,
    "Uganda Peoples Defence Forces FC": 1014,
    "Mbarara FC": 1015,
    "Mbarara City FC": 1015,
    "Calvary FC": 1016,
    "Calvary Football Club": 1016,
  };

  // Get Ugandan PL team ID by team name
  getTeamId(teamName: string): number | null {
    return this.teamMapping[teamName] || null;
  }

  // Get Ugandan PL team players
  async getUgandanPLTeamPlayers(
    teamName: string,
    season: number = 2025,
  ): Promise<UgandanPLPlayer[]> {
    try {
      const teamId = this.getTeamId(teamName);

      if (!teamId) {
        console.warn(`No Ugandan PL team found for ${teamName}`);
        return this.getFallbackPlayers(teamName);
      }

      console.log(`🔄 Fetching ${teamName} players from API-Sports...`);
      console.log(`📍 Team ID: ${teamId}, Season: ${season}`);

      // Try different approaches to get player data
      let response;

      try {
        // First try with current season
        console.log(
          `📡 Trying API call: /players?team=${teamId}&season=${season}&league=${this.ugandanPLId}`,
        );
        response = await this.makeRequest<PlayerResponse>("/players", {
          team: teamId,
          season: season,
          league: this.ugandanPLId,
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
            league: this.ugandanPLId,
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

      const players: UgandanPLPlayer[] = response.response.map(
        (playerData: any) => {
          const player = playerData.player || playerData;
          const stats = playerData.statistics ? playerData.statistics[0] : {};

          const processedPlayer = {
            id: player.id || Math.random() * 1000,
            name: player.name || `${teamName} Player`,
            firstname: player.firstname || "Player",
            lastname: player.lastname || "",
            age: player.age || 25,
            nationality: player.nationality || "Uganda",
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
  getPlayerPhoto(player: UgandanPLPlayer): string {
    const sources = [
      player.photo, // API-Sports primary
      `https://img.a.transfermarkt.technology/portrait/header/${player.id}.jpg`,
      `https://resources.ugandan-pl.com/ugandan-pl/photos/players/250x250/p${player.id}.png`,
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
  private getFallbackPlayers(teamName: string): UgandanPLPlayer[] {
    console.log(`🔄 Using fallback players for ${teamName}`);

    const fallbackKCCAPlayers = [
      "Charles Lukwago",
      "Benjamin Ochan",
      "Denis Iguma",
      "Mustafa Kizza",
      "Peter Magambo",
      "Ashraf Mugume",
      "Sadat Anaku",
      "Moses Waiswa",
      "Allan Okello",
      "Muhammad Shaban",
      "Brian Aheebwa",
      "Filbert Obenchan",
      "Julius Poloto",
      "Herbert Achai",
      "Erisa Ssekisambu",
      "Rogers Mato",
      "Gift Ali",
      "Arafat Usama",
      "Patrick Kaddu",
      "Sam Ssimbwa",
      "Ivan Ahimbisibwe",
      "Derrick Nsibambi",
      "Bright Anukani",
    ];

    const fallbackVipersPlayers = [
      "Fabien Mutombora",
      "Alfred Mudekereza",
      "Halid Lwaliwa",
      "Livingstone Mulondo",
      "Aziz Kayondo",
      "Bobosi Byaruhanga",
      "Siraje Sentamu",
      "Milton Karisa",
      "Yunus Sentamu",
      "Caesar Manzoki",
      "Dan Sserunkuma",
      "Cromwell Rwothomio",
      "Paul Mucureezi",
      "Ibrahim Orit",
      "Najib Yiga",
      "Abdu Lumala",
      "Karim Watambala",
      "Richard Basangwa",
      "Marvin Youngman",
      "Bright Anukani",
      "Ashraf Mandela",
      "Kenneth Semakula",
      "Davis Kasirye",
    ];

    const fallbackExpressPlayers = [
      "Mathias Muwanga",
      "Tony Kyamera",
      "Enock Walusimbi",
      "Murushid Juuko",
      "Isa Mubiru",
      "George Senkaaba",
      "Frank Kalanda",
      "Eric Kambale",
      "Mahad Yaya Kakooza",
      "John Byamukama",
      "Abel Eturude",
      "Ivan Bogere",
      "Godfrey Lwesibawa",
      "Richard Wandyaka",
      "Disan Galiwango",
      "Frank Tumwesigye",
      "Martin Kizza",
      "Emmanuel Loki",
      "Baker Lukooya",
      "Shafik Nana Kwikiriza",
      "Joseph Akandwanaho",
      "Marvin Oshaba",
      "Davis Mayanja",
    ];

    // Get team-specific fallback players
    const getTeamFallbackPlayers = () => {
      switch (teamName.toLowerCase()) {
        case "kcca":
        case "kcca fc":
          return fallbackKCCAPlayers;
        case "vipers sc":
        case "vipers sports club":
          return fallbackVipersPlayers;
        case "express fc":
        case "express football club":
          return fallbackExpressPlayers;
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
      nationality: "Uganda",
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
        id: this.getTeamId(teamName) || 1001,
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
      const freshPlayers = await this.getUgandanPLTeamPlayers(teamName, 2025);
      
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
  async forceRefreshTeamData(teamName: string): Promise<UgandanPLPlayer[]> {
    console.log(`🔄 Force refreshing data for ${teamName}...`);
    
    // Clear cache for this team
    const cacheKeys = Array.from(this.cache.keys()).filter(key => key.includes(teamName));
    cacheKeys.forEach(key => this.cache.delete(key));
    
    // Fetch fresh data
    return await this.getUgandanPLTeamPlayers(teamName, 2025);
  }

  // Test API connection and authentication
  async testApiConnection(): Promise<{ success: boolean; message: string }> {
    try {
      console.log("🧪 Testing Ugandan PL API connection...");
      console.log("🔑 API Key status:", this.apiKey ? "Present" : "Missing");

      if (!this.apiKey) {
        return {
          success: false,
          message:
            "API key is missing. Check EXPO_PUBLIC_API_FOOTBALL_KEY in .env.local",
        };
      }

      // Test request to get Ugandan PL teams (may not exist in API-Football)
      const response = await fetch(
        `${this.baseUrl}/teams?league=${this.ugandanPLId}&season=2025`,
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

      console.log("✅ Ugandan PL API connection successful!");
      return {
        success: true,
        message: `Successfully connected to API. Found ${data.results} Ugandan PL teams.`,
      };
    } catch (error) {
      console.error("❌ Ugandan PL API connection test failed:", error);
      return {
        success: false,
        message: `Connection error: ${error}`,
      };
    }
  }

  // Clear cache (useful for development/testing)
  clearCache(): void {
    this.cache.clear();
    console.log("🗑️ Ugandan PL API cache cleared");
  }
}

// Export singleton instance
const ugandanPLApiService = new UgandanPLApiService();
export default ugandanPLApiService;

// Export types for use in components
export type { UgandanPLPlayer };