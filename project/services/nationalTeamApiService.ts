// National Team API Service
// Fetches real player data and headshots for national teams using API-Sports.io

interface NationalTeamPlayer {
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

interface TeamResponse {
  team: {
    id: number;
    name: string;
    code: string;
    country: string;
    founded: number;
    national: boolean;
    logo: string;
  };
  venue: {
    id: number;
    name: string;
    address: string;
    city: string;
    capacity: number;
    surface: string;
    image: string;
    country: string;
  };
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

class NationalTeamApiService {
  private baseUrl = "https://v3.football.api-sports.io";
  private apiKey: string;
  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours

  constructor() {
    // Use existing API Football key from environment variables
    this.apiKey = process.env.EXPO_PUBLIC_API_FOOTBALL_KEY || "";
    if (!this.apiKey) {
      console.warn(
        "EXPO_PUBLIC_API_FOOTBALL_KEY not found in environment variables",
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
      return cached.data;
    }

    const queryParams = new URLSearchParams(params).toString();
    const url = `${this.baseUrl}${endpoint}${queryParams ? `?${queryParams}` : ""}`;

    try {
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

      // Cache the response
      this.cache.set(cacheKey, { data, timestamp: Date.now() });

      return data;
    } catch (error) {
      console.error(`Error fetching from ${endpoint}:`, error);
      throw error;
    }
  }

  // Country name to API-Sports country mapping
  private countryMapping: Record<string, string> = {
    Uganda: "Uganda",
    Argentina: "Argentina",
    France: "France",
    Portugal: "Portugal",
    Spain: "Spain",
    England: "England",
    Brazil: "Brazil",
    Germany: "Germany",
    Italy: "Italy",
    Netherlands: "Netherlands",
    Saudi: "Saudi-Arabia",
    Belgium: "Belgium",
    Croatia: "Croatia",
    Morocco: "Morocco",
    Mexico: "Mexico",
    Japan: "Japan",
    Egypt: "Egypt",
    Senegal: "Senegal",
    Denmark: "Denmark",
    Switzerland: "Switzerland",
    Colombia: "Colombia",
    "S.Korea": "South-Korea",
  };

  // Get national team ID by country name
  async getNationalTeamId(countryName: string): Promise<number | null> {
    try {
      const apiCountryName = this.countryMapping[countryName] || countryName;

      // First try to get teams by country
      const response = await this.makeRequest<TeamResponse>("/teams", {
        country: apiCountryName,
      });

      if (response.response && response.response.length > 0) {
        // Look for national team specifically
        const nationalTeam = response.response.find(
          (team) =>
            team.team.national === true ||
            team.team.name.toLowerCase().includes("national") ||
            team.team.name.toLowerCase().includes(countryName.toLowerCase()),
        );

        if (nationalTeam) {
          return nationalTeam.team.id;
        }

        // Fallback to first team if no explicit national team found
        return response.response[0].team.id;
      }

      return null;
    } catch (error) {
      console.error(
        `Error getting national team ID for ${countryName}:`,
        error,
      );
      return null;
    }
  }

  // Get national team players
  async getNationalTeamPlayers(
    countryName: string,
    season: number = 2024,
  ): Promise<NationalTeamPlayer[]> {
    try {
      const teamId = await this.getNationalTeamId(countryName);

      if (!teamId) {
        console.warn(`No national team found for ${countryName}`);
        return this.getFallbackPlayers(countryName);
      }

      // Try different approaches to get player data
      let response;

      try {
        // First try with current season
        response = await this.makeRequest<PlayerResponse>("/players", {
          team: teamId,
          season: season,
        });
      } catch (error) {
        console.warn(
          `Failed to fetch players for season ${season}, trying 2023...`,
        );
        try {
          // Fallback to 2023 season
          response = await this.makeRequest<PlayerResponse>("/players", {
            team: teamId,
            season: 2023,
          });
        } catch (error2) {
          console.warn(
            `Failed to fetch players for 2023, trying squads endpoint...`,
          );
          // Try squads endpoint as alternative
          response = await this.makeRequest<any>("/players/squads", {
            team: teamId,
          });
        }
      }

      if (!response || !response.response || response.response.length === 0) {
        console.warn(`No player data found for ${countryName}, using fallback`);
        return this.getFallbackPlayers(countryName);
      }

      const players: NationalTeamPlayer[] = response.response.map(
        (playerData: any) => {
          const player = playerData.player || playerData;
          const stats = playerData.statistics ? playerData.statistics[0] : {};

          return {
            id: player.id || Math.random() * 1000,
            name: player.name || `${countryName} Player`,
            firstname: player.firstname || "Player",
            lastname: player.lastname || "",
            age: player.age || 25,
            nationality: player.nationality || countryName,
            height: player.height || null,
            weight: player.weight || null,
            photo: player.photo || "",
            position: stats.games?.position || player.position || "Unknown",
            team: {
              id: stats.team?.id || teamId,
              name: stats.team?.name || `${countryName} National Team`,
              logo: stats.team?.logo || "",
            },
          };
        },
      );

      // Limit to 22 players and ensure we have at least some data
      const finalPlayers = players.slice(0, 22);
      return finalPlayers.length > 0
        ? finalPlayers
        : this.getFallbackPlayers(countryName);
    } catch (error) {
      console.error(`Error fetching players for ${countryName}:`, error);
      return this.getFallbackPlayers(countryName);
    }
  }

  // Generate fallback players when API fails
  private getFallbackPlayers(countryName: string): NationalTeamPlayer[] {
    return Array.from({ length: 22 }, (_, index) => ({
      id: index + 1,
      name: `${countryName} Player ${index + 1}`,
      firstname: `Player`,
      lastname: `${index + 1}`,
      age: 25,
      nationality: countryName,
      height: null,
      weight: null,
      photo: "",
      position:
        index === 0
          ? "Goalkeeper"
          : index < 5
            ? "Defender"
            : index < 10
              ? "Midfielder"
              : "Forward",
      team: {
        id: 0,
        name: `${countryName} National Team`,
        logo: "",
      },
    }));
  }

  // Get player headshot URL with fallbacks
  getPlayerPhoto(player: NationalTeamPlayer): string {
    if (player.photo && player.photo !== "") {
      return player.photo;
    }

    // Fallback to team logo if no player photo
    if (player.team.logo) {
      return player.team.logo;
    }

    // Final fallback to placeholder
    return (
      "https://via.placeholder.com/150x150/4A8B3B/FFFFFF?text=" +
      encodeURIComponent(player.firstname[0] + (player.lastname[0] || ""))
    );
  }

  // Batch fetch all countries' players
  async getAllNationalTeamPlayers(): Promise<
    Record<string, NationalTeamPlayer[]>
  > {
    const countries = Object.keys(this.countryMapping);
    const results: Record<string, NationalTeamPlayer[]> = {};

    // Process in smaller batches to avoid rate limits
    const batchSize = 3;
    for (let i = 0; i < countries.length; i += batchSize) {
      const batch = countries.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (country) => {
          try {
            const players = await this.getNationalTeamPlayers(country);
            results[country] = players;
            console.log(`✅ Loaded ${players.length} players for ${country}`);
          } catch (error) {
            console.error(`❌ Failed to load players for ${country}:`, error);
            results[country] = [];
          }
        }),
      );

      // Add delay between batches to respect rate limits
      if (i + batchSize < countries.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    return results;
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
  }

  // Get cache stats
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  // Test API connection and authentication
  async testApiConnection(): Promise<{ success: boolean; message: string }> {
    try {
      console.log("🧪 Testing API connection...");
      console.log("🔑 API Key status:", this.apiKey ? "Present" : "Missing");

      if (!this.apiKey) {
        return {
          success: false,
          message:
            "API key is missing. Check EXPO_PUBLIC_API_FOOTBALL_KEY in .env.local",
        };
      }

      // Simple test request to get leagues
      const response = await fetch(`${this.baseUrl}/leagues?country=England`, {
        method: "GET",
        headers: {
          "x-rapidapi-key": this.apiKey,
          "x-rapidapi-host": "v3.football.api-sports.io",
        },
      });

      console.log("📡 API Response status:", response.status);

      if (response.status === 403) {
        return {
          success: false,
          message:
            "API authentication failed (403). Check your API key permissions.",
        };
      }

      if (response.status === 429) {
        return {
          success: false,
          message: "API rate limit exceeded (429). Wait before trying again.",
        };
      }

      if (!response.ok) {
        return {
          success: false,
          message: `API request failed: ${response.status} ${response.statusText}`,
        };
      }

      const data = await response.json();
      console.log("✅ API test successful! Sample data:", {
        results: data.results,
        errors: data.errors,
      });

      return {
        success: true,
        message: `API working! Found ${data.results} results.`,
      };
    } catch (error: any) {
      console.error("❌ API test failed:", error);
      return {
        success: false,
        message: `Connection error: ${error.message}`,
      };
    }
  }
}

// Export singleton instance
const nationalTeamApiService = new NationalTeamApiService();
export default nationalTeamApiService;

// Export types for use in components
export type { NationalTeamPlayer };
