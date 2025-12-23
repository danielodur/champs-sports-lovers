// Enhanced Bundesliga API Service with Dual API Integration
// Fetches real player data and headshots for Bundesliga teams using unified dual API support
// Uses EXPO_PUBLIC_API_FOOTBALL_KEY and EXPO_PUBLIC_THE_SPORTSDB_API_KEY from environment variables
import unifiedSportsApiService from "./unifiedSportsApiService";
import theSportsDbApiService from "./theSportsDbApiService";

interface BundesligaPlayer {
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

class BundesligaApiService {
  private baseUrl = "https://v3.football.api-sports.io";
  private sportsDbUrl = "https://www.thesportsdb.com/api/v1/json";
  private apiKey: string;
  private sportsDbKey: string;
  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours

  // Bundesliga ID from API-Sports
  private bundesligaId = 78;

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

  // Bundesliga team name to API-Sports team ID mapping
  private teamMapping: Record<string, number> = {
    "Bayern Munich": 157,
    "FC Bayern München": 157,
    "FC Bayern Munich": 157,
    "Borussia Dortmund": 165,
    BVB: 165,
    "RB Leipzig": 173,
    "RasenBallsport Leipzig": 173,
    "Bayer Leverkusen": 168,
    "Bayer 04 Leverkusen": 168,
    "Eintracht Frankfurt": 169,
    "Borussia Monchengladbach": 163,
    "Borussia Mönchengladbach": 163,
    "VfL Wolfsburg": 170,
    "Werder Bremen": 162,
    "SV Werder Bremen": 162,
    "SC Freiburg": 160,
    "Union Berlin": 182,
    "1. FC Union Berlin": 182,
    "VfB Stuttgart": 161,
    Hoffenheim: 172,
    "TSG 1899 Hoffenheim": 172,
    "TSG Hoffenheim": 172,
    "FC Augsburg": 159,
    "Mainz 05": 164,
    "1. FSV Mainz 05": 164,
    "FC Koln": 167,
    "1. FC Köln": 167,
    "FC Köln": 167,
    "FC Heidenheim": 3709,
    "1. FC Heidenheim 1846": 3709,
    Hamburg: 178,
    "Hamburger SV": 178,
    HSV: 178,
    "St. Pauli": 200,
    "FC St. Pauli": 200,
  };

  // Get Bundesliga team ID by team name
  getTeamId(teamName: string): number | null {
    return this.teamMapping[teamName] || null;
  }

  // Get Bundesliga team players with enhanced dual API support
  async getBundesligaTeamPlayers(
    teamName: string,
    season: number = 2024,
  ): Promise<BundesligaPlayer[]> {
    try {
      const teamId = this.getTeamId(teamName);

      if (!teamId) {
        console.warn(`No Bundesliga team found for ${teamName}`);
        // Try unified API service as fallback
        const unifiedPlayers = await this.getPlayersViaUnifiedService(teamName);
        if (unifiedPlayers.length > 0) {
          console.log(
            `✅ Found ${unifiedPlayers.length} players via unified service for ${teamName}`,
          );
          return unifiedPlayers;
        }
        return this.getFallbackPlayers(teamName);
      }

      console.log(
        `🔄 Fetching ${teamName} players from enhanced dual API system...`,
      );
      console.log(`📍 Team ID: ${teamId}, Season: ${season}`);

      // Try different approaches to get player data
      let response;

      try {
        // First try with current season
        console.log(
          `📡 Trying API call: /players?team=${teamId}&season=${season}&league=${this.bundesligaId}`,
        );
        response = await this.makeRequest<PlayerResponse>("/players", {
          team: teamId,
          season: season,
          league: this.bundesligaId,
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
            league: this.bundesligaId,
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

      const players: BundesligaPlayer[] = response.response.map(
        (playerData: any) => {
          const player = playerData.player || playerData;
          const stats = playerData.statistics ? playerData.statistics[0] : {};

          const processedPlayer = {
            id: player.id || Math.random() * 1000,
            name: player.name || `${teamName} Player`,
            firstname: player.firstname || "Player",
            lastname: player.lastname || "",
            age: player.age || 25,
            nationality: player.nationality || "Germany",
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
      console.log(
        `✅ Successfully fetched ${players.length} players for ${teamName} via primary API`,
      );

      // If we have fewer than 15 players, try to enhance with unified service
      if (players.length < 15) {
        console.log(
          `🔄 Enhancing ${teamName} squad with unified API service...`,
        );
        try {
          const additionalPlayers =
            await this.getPlayersViaUnifiedService(teamName);
          const combinedPlayers = this.mergePlayerData(
            players,
            additionalPlayers,
          );
          console.log(
            `✅ Enhanced squad: ${players.length} → ${combinedPlayers.length} players`,
          );
          return combinedPlayers;
        } catch (enhanceError) {
          console.warn(`⚠️ Enhancement failed for ${teamName}:`, enhanceError);
        }
      }

      return players;
    } catch (error) {
      console.error(`❌ Primary API failed for ${teamName}:`, error);
      console.log(`🔄 Trying unified API service as fallback...`);

      try {
        const unifiedPlayers = await this.getPlayersViaUnifiedService(teamName);
        if (unifiedPlayers.length > 0) {
          console.log(
            `✅ Fallback successful: ${unifiedPlayers.length} players via unified service`,
          );
          return unifiedPlayers;
        }
      } catch (fallbackError) {
        console.error(`❌ Unified API fallback failed:`, fallbackError);
      }

      return this.getFallbackPlayers(teamName);
    }
  }

  // Get players via unified sports API service
  private async getPlayersViaUnifiedService(
    teamName: string,
  ): Promise<BundesligaPlayer[]> {
    try {
      const unifiedData = await unifiedSportsApiService.getTeamPlayers(
        teamName,
        78, // Bundesliga league ID
      );

      return unifiedData.map((player: any) => ({
        id: player.id || Math.floor(Math.random() * 100000),
        name: player.name,
        firstname: player.firstname || player.name.split(" ")[0] || "",
        lastname:
          player.lastname || player.name.split(" ").slice(1).join(" ") || "",
        age: player.age || 25,
        nationality: player.nationality || "Unknown",
        height: player.height || null,
        weight: player.weight || null,
        photo: player.photo || "",
        position: player.position || "Unknown",
        team: {
          id: this.getTeamId(teamName) || 0,
          name: teamName,
          logo: player.team?.logo || "",
        },
      }));
    } catch (error) {
      console.error(`❌ Unified service failed for ${teamName}:`, error);
      return [];
    }
  }

  // Merge player data from multiple sources, avoiding duplicates
  private mergePlayerData(
    primaryPlayers: BundesligaPlayer[],
    additionalPlayers: BundesligaPlayer[],
  ): BundesligaPlayer[] {
    const merged = [...primaryPlayers];
    const existingNames = new Set(
      primaryPlayers.map((p) => p.name.toLowerCase()),
    );

    for (const player of additionalPlayers) {
      if (!existingNames.has(player.name.toLowerCase())) {
        merged.push(player);
        existingNames.add(player.name.toLowerCase());
      }
    }

    return merged;
  }

  // Get Bayern Munich players specifically
  async getBayernMunichPlayers(): Promise<BundesligaPlayer[]> {
    return this.getBundesligaTeamPlayers("Bayern Munich");
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
  private getFallbackPlayers(teamName: string): BundesligaPlayer[] {
    console.log(`🔄 Using fallback players for ${teamName}`);

    const fallbackBayernMunichPlayers = [
      "Manuel Neuer",
      "Sven Ulreich",
      "Joshua Kimmich",
      "Dayot Upamecano",
      "Min-jae Kim",
      "Matthijs de Ligt",
      "Alphonso Davies",
      "Noussair Mazraoui",
      "Raphaël Guerreiro",
      "Leon Goretzka",
      "Jamal Musiala",
      "Leroy Sané",
      "Serge Gnabry",
      "Kingsley Coman",
      "Thomas Müller",
      "Harry Kane",
      "Mathys Tel",
      "Eric Maxim Choupo-Moting",
      "Konrad Laimer",
      "Aleksandar Pavlović",
      "Eric Dier",
      "Bouna Sarr",
      "João Cancelo",
    ];

    const fallbackDortmundPlayers = [
      "Gregor Kobel",
      "Alexander Meyer",
      "Mats Hummels",
      "Nico Schlotterbeck",
      "Julian Ryerson",
      "Ian Maatsen",
      "Ramy Bensebaini",
      "Emre Can",
      "Marcel Sabitzer",
      "Felix Nmecha",
      "Julian Brandt",
      "Marco Reus",
      "Karim Adeyemi",
      "Jadon Sancho",
      "Donyell Malen",
      "Niclas Füllkrug",
      "Youssoufa Moukoko",
      "Sebastien Haller",
      "Giovanni Reyna",
      "Jamie Bynoe-Gittens",
      "Salih Özcan",
      "Niklas Süle",
      "Antonios Papadopoulos",
    ];

    // Get team-specific fallback players
    const getTeamFallbackPlayers = () => {
      switch (teamName.toLowerCase()) {
        case "bayern munich":
        case "fc bayern münchen":
          return fallbackBayernMunichPlayers;
        case "borussia dortmund":
        case "bvb":
          return fallbackDortmundPlayers;
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
      nationality: "Germany",
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
        id: this.getTeamId(teamName) || 157,
        name: teamName,
        logo: "",
      },
    }));
  }

  // Enhanced player photo with multiple sources and fallbacks
  getPlayerPhoto(player: BundesligaPlayer): string {
    const sources = [
      player.photo, // API-Sports primary
      `https://img.a.transfermarkt.technology/portrait/header/${player.id}-${Date.now()}.jpg?lm=1`,
      `https://resources.bundesliga.com/bundesliga/photos/players/250x250/p${player.id}.png`,
      `https://media.api-sports.io/football/players/${player.id}.png`,
      // Team-specific fallbacks
      this.getTeamSpecificPlayerPhoto(player),
      // Generic fallback
      "https://media.api-sports.io/football/players/placeholder.png",
    ];

    return this.findValidImageUrl(sources);
  }

  // Get team-specific player photo URLs
  private getTeamSpecificPlayerPhoto(player: BundesligaPlayer): string {
    const teamId = player.team?.id;
    if (!teamId) return "";

    // Use team's official website structure where possible
    const teamSpecificUrls: { [key: number]: string } = {
      157: `https://fcbayern.com/binaries/content/gallery/fc-bayern/homepage/saison-22-23/profis/${player.name.toLowerCase().replace(/\s+/g, "-")}.jpg`, // Bayern Munich
      165: `https://www.bvb.de/var/ezdemo_site/storage/images/media/bilder/galerie/fussball/profis/${player.name.toLowerCase().replace(/\s+/g, "-")}/image.jpg`, // Dortmund
      173: `https://rbleipzig.com/images/players/${player.id}.jpg`, // RB Leipzig
    };

    return teamSpecificUrls[teamId] || "";
  }

  // Check if image URL is valid (synchronous check for known patterns)
  private findValidImageUrl(sources: string[]): string {
    for (const url of sources) {
      if (
        url &&
        url !== "" &&
        !url.includes("placeholder") &&
        this.isValidImagePattern(url)
      ) {
        return url;
      }
    }
    return "https://media.api-sports.io/football/players/placeholder.png";
  }

  // Check if URL follows valid image patterns
  private isValidImagePattern(url: string): boolean {
    if (!url || url === "") return false;

    const validPatterns = [
      /^https:\/\/media\.api-sports\.io\/football\/players\/\d+\.png$/,
      /^https:\/\/img\.a\.transfermarkt\.technology\/portrait\/header\/\d+.*\.jpg/,
      /^https:\/\/resources\.bundesliga\.com\/bundesliga\/photos\/players/,
      /^https:\/\/fcbayern\.com\/binaries\/content/,
      /^https:\/\/www\.bvb\.de\/var\/ezdemo_site/,
      /^https:\/\/rbleipzig\.com\/images\/players/,
    ];

    return validPatterns.some((pattern) => pattern.test(url));
  }

  // Enhanced synchronous photo method with dual API support
  getPlayerPhotoSync(player: BundesligaPlayer): string {
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
      // Bayern Munich players
      "Harry Kane": "https://media.api-sports.io/football/players/184.png",
      "Manuel Neuer": "https://media.api-sports.io/football/players/25.png",
      "Joshua Kimmich": "https://media.api-sports.io/football/players/28.png",
      "Jamal Musiala": "https://media.api-sports.io/football/players/215.png",
      "Leroy Sané": "https://media.api-sports.io/football/players/655.png",
      "Thomas Müller": "https://media.api-sports.io/football/players/34.png",
      "Serge Gnabry": "https://media.api-sports.io/football/players/188.png",
      "Alphonso Davies": "https://media.api-sports.io/football/players/626.png",

      // Borussia Dortmund players
      "Marco Reus": "https://media.api-sports.io/football/players/37.png",
      "Mats Hummels": "https://media.api-sports.io/football/players/40.png",
      "Julian Brandt": "https://media.api-sports.io/football/players/1100.png",
      "Niclas Füllkrug":
        "https://media.api-sports.io/football/players/1138.png",
      "Karim Adeyemi": "https://media.api-sports.io/football/players/47533.png",
      "Youssoufa Moukoko":
        "https://media.api-sports.io/football/players/331622.png",
      "Jadon Sancho": "https://media.api-sports.io/football/players/1148.png",
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

  // Check for squad updates and data freshness
  async checkForSquadUpdates(teamName: string): Promise<{
    hasUpdates: boolean;
    lastUpdated: Date | null;
    newPlayersCount: number;
    message: string;
  }> {
    try {
      const cacheKey = `squad_check_${teamName}`;
      const cached = this.cache.get(cacheKey);

      // Check if we've checked recently (within 6 hours)
      if (cached && Date.now() - cached.timestamp < 6 * 60 * 60 * 1000) {
        return {
          hasUpdates: false,
          lastUpdated: new Date(cached.timestamp),
          newPlayersCount: 0,
          message: "Squad data is current",
        };
      }

      // Fetch latest data from API
      const currentPlayers = await this.getBundesligaTeamPlayers(
        teamName,
        2024,
      );
      const lastKnownCount = cached?.data?.playerCount || 0;

      const hasUpdates = currentPlayers.length !== lastKnownCount;
      const newPlayersCount = Math.max(
        0,
        currentPlayers.length - lastKnownCount,
      );

      // Update cache with new data
      this.cache.set(cacheKey, {
        data: {
          playerCount: currentPlayers.length,
          players: currentPlayers.slice(0, 5),
        },
        timestamp: Date.now(),
      });

      return {
        hasUpdates,
        lastUpdated: new Date(),
        newPlayersCount,
        message: hasUpdates
          ? `Found ${newPlayersCount} squad changes for ${teamName}`
          : `Squad data is up to date for ${teamName}`,
      };
    } catch (error) {
      console.error(`❌ Error checking squad updates for ${teamName}:`, error);
      return {
        hasUpdates: false,
        lastUpdated: null,
        newPlayersCount: 0,
        message: `Unable to check squad updates: ${error}`,
      };
    }
  }

  // Enhanced API connection test with dual API support
  async testDualApiConnection(): Promise<{
    apiFootball: { success: boolean; message: string };
    sportsDb: { success: boolean; message: string };
    recommendation: string;
  }> {
    const apiFootballTest = await this.testApiConnection();
    const sportsDbTest = await this.testSportsDbConnection();

    let recommendation = "";
    if (apiFootballTest.success && sportsDbTest.success) {
      recommendation = "Both APIs working - optimal data coverage available";
    } else if (apiFootballTest.success) {
      recommendation = "API-Football working - primary data source available";
    } else if (sportsDbTest.success) {
      recommendation =
        "TheSportsDB working - alternative data source available";
    } else {
      recommendation = "Both APIs unavailable - using fallback data";
    }

    return {
      apiFootball: apiFootballTest,
      sportsDb: sportsDbTest,
      recommendation,
    };
  }

  // Test TheSportsDB API connection
  private async testSportsDbConnection(): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      if (!this.sportsDbKey) {
        return {
          success: false,
          message: "TheSportsDB API key missing",
        };
      }

      const response = await fetch(
        `${this.sportsDbUrl}/${this.sportsDbKey}/search_all_teams.php?l=German%20Bundesliga`,
      );

      if (!response.ok) {
        return {
          success: false,
          message: `TheSportsDB connection failed: ${response.status}`,
        };
      }

      const data = await response.json();
      return {
        success: true,
        message: `TheSportsDB connected - found ${data.teams?.length || 0} teams`,
      };
    } catch (error) {
      return {
        success: false,
        message: `TheSportsDB error: ${error}`,
      };
    }
  }

  // Test API connection and authentication
  async testApiConnection(): Promise<{ success: boolean; message: string }> {
    try {
      console.log("🧪 Testing Bundesliga API connection...");
      console.log("🔑 API Key status:", this.apiKey ? "Present" : "Missing");

      if (!this.apiKey) {
        return {
          success: false,
          message:
            "API key is missing. Check EXPO_PUBLIC_API_FOOTBALL_KEY in .env.local",
        };
      }

      // Test request to get Bundesliga teams
      const response = await fetch(
        `${this.baseUrl}/teams?league=${this.bundesligaId}&season=2024`,
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

      console.log("✅ Bundesliga API connection successful!");
      return {
        success: true,
        message: `Successfully connected to API. Found ${data.results} Bundesliga teams.`,
      };
    } catch (error) {
      console.error("❌ Bundesliga API connection test failed:", error);
      return {
        success: false,
        message: `Connection error: ${error}`,
      };
    }
  }

  // Simple API test to verify we're getting different players
  async testBayernMunichAPI(): Promise<void> {
    console.log("🧪 [TEST] Testing Bayern Munich API specifically...");

    try {
      const teamId = 157; // Bayern Munich
      const response = await this.makeRequest<PlayerResponse>("/players", {
        team: teamId,
        season: 2024,
        league: this.bundesligaId,
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

  // Get all Bundesliga teams
  async getBundesligaTeams(): Promise<any[]> {
    try {
      const response = await this.makeRequest<any>("/teams", {
        league: this.bundesligaId,
        season: 2024,
      });

      return response.response || [];
    } catch (error) {
      console.error("❌ Error fetching Bundesliga teams:", error);
      return [];
    }
  }

  // Clear cache (useful for development/testing)
  clearCache(): void {
    this.cache.clear();
    unifiedSportsApiService.clearCache();
    console.log("🗑️ Bundesliga API cache cleared (including unified service)");
  }
}

// Export singleton instance
const bundesligaApiService = new BundesligaApiService();
export default bundesligaApiService;

// Export types for use in components
export type { BundesligaPlayer };
