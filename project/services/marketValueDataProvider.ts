/**
 * Market Value Data Provider - Abstraction Layer
 * 
 * This service provides a unified interface for fetching player and team market values
 * from different sports data providers (SofaScore, Sportradar, Opta, Wyscout).
 * 
 * When switching from one provider to another (e.g., SofaScore → Sportradar),
 * only the active provider needs to be changed - no screen logic modifications required.
 */

export interface PlayerMarketValueData {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  age?: number;
  nationality: string;
  position: string;
  teamId: string;
  teamName: string;
  teamLogo?: string;
  photo?: string;
  marketValueEUR: number;
  height?: string;
  weight?: string;
}

export interface TeamMarketValueData {
  id: string;
  name: string;
  logo?: string;
  league: string;
  country: string;
  totalMarketValueEUR: number;
  averageAge?: number;
  playerCount: number;
}

export interface MarketValueProvider {
  // Provider identification
  name: string;
  requiresApiKey: boolean;

  // Team lookup
  findTeamId(teamName: string, leagueName?: string): Promise<string | null>;
  
  // Player data fetching
  getTeamPlayers(teamId: string): Promise<PlayerMarketValueData[]>;
  
  // Team data fetching
  getTeamInfo(teamId: string): Promise<{
    name: string;
    logo?: string;
    league?: string;
  } | null>;

  // Batch operations for performance
  getMultipleTeamPlayers(teamIds: string[]): Promise<Map<string, PlayerMarketValueData[]>>;
  
  // Image URLs
  getPlayerPhotoUrl(playerId: string): string;
  getTeamLogoUrl(teamId: string): string;
  
  // Cache management
  clearCache(): void;
  getCacheStats(): { size: number; keys: string[] };
}

/**
 * SofaScore Provider (Current - No API key required)
 */
import { 
  findSofaTeamId, 
  getTeamPlayersFromSofa,
  SOFA_PLAYER_IMAGE,
  SOFA_TEAM_IMAGE,
} from "./sofaScorePlayersService";

class SofaScoreProvider implements MarketValueProvider {
  name = "SofaScore";
  requiresApiKey = false;
  private cache = new Map<string, any>();

  async findTeamId(teamName: string, leagueName?: string): Promise<string | null> {
    const id = await findSofaTeamId(teamName);
    return id ? id.toString() : null;
  }

  async getTeamPlayers(teamId: string): Promise<PlayerMarketValueData[]> {
    const players = await getTeamPlayersFromSofa(Number(teamId));
    
    return players.map(player => ({
      id: `sofa-${player.id}`,
      name: player.name,
      age: player.age,
      nationality: player.nationality || "Unknown",
      position: player.position || "Unknown",
      teamId,
      teamName: player.teamName || "Unknown",
      teamLogo: player.teamLogo,
      photo: player.photo,
      marketValueEUR: typeof player.marketValue === "number" 
        ? (player.marketValue > 1000 ? player.marketValue / 1_000_000 : player.marketValue)
        : 0,
    }));
  }

  async getTeamInfo(teamId: string) {
    // SofaScore team info is embedded in player responses
    // We'll extract it from cached player data or make a separate call
    return null;
  }

  async getMultipleTeamPlayers(teamIds: string[]): Promise<Map<string, PlayerMarketValueData[]>> {
    const results = new Map<string, PlayerMarketValueData[]>();
    
    // Batch fetch with concurrency control
    const batchSize = 12;
    for (let i = 0; i < teamIds.length; i += batchSize) {
      const batch = teamIds.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(async (teamId) => ({
          teamId,
          players: await this.getTeamPlayers(teamId),
        }))
      );
      
      batchResults.forEach(({ teamId, players }) => {
        results.set(teamId, players);
      });
    }
    
    return results;
  }

  getPlayerPhotoUrl(playerId: string): string {
    return SOFA_PLAYER_IMAGE(Number(playerId));
  }

  getTeamLogoUrl(teamId: string): string {
    return SOFA_TEAM_IMAGE(Number(teamId));
  }

  clearCache(): void {
    this.cache.clear();
  }

  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

/**
 * Sportradar Provider (Future - Requires API key)
 */
class SportradarProvider implements MarketValueProvider {
  name = "Sportradar";
  requiresApiKey = true;
  private apiKey: string;
  private cache = new Map<string, any>();

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.EXPO_PUBLIC_SPORTRADAR_API_KEY || "";
  }

  async findTeamId(teamName: string, leagueName?: string): Promise<string | null> {
    // TODO: Implement Sportradar team search
    // Endpoint: /soccer/trial/v4/en/teams/search.json?name={teamName}
    console.log(`Sportradar: Finding team ID for ${teamName}`);
    return null;
  }

  async getTeamPlayers(teamId: string): Promise<PlayerMarketValueData[]> {
    // TODO: Implement Sportradar team roster fetch
    // Endpoint: /soccer/trial/v4/en/teams/{teamId}/profile.json
    console.log(`Sportradar: Fetching players for team ${teamId}`);
    return [];
  }

  async getTeamInfo(teamId: string) {
    // TODO: Implement Sportradar team info
    return null;
  }

  async getMultipleTeamPlayers(teamIds: string[]): Promise<Map<string, PlayerMarketValueData[]>> {
    const results = new Map<string, PlayerMarketValueData[]>();
    for (const teamId of teamIds) {
      const players = await this.getTeamPlayers(teamId);
      results.set(teamId, players);
    }
    return results;
  }

  getPlayerPhotoUrl(playerId: string): string {
    // TODO: Return Sportradar player image URL
    return `https://sportradar-images.com/players/${playerId}.png`;
  }

  getTeamLogoUrl(teamId: string): string {
    // TODO: Return Sportradar team logo URL
    return `https://sportradar-images.com/teams/${teamId}.png`;
  }

  clearCache(): void {
    this.cache.clear();
  }

  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

/**
 * Opta/StatsPerform Provider (Future - Requires API key)
 */
class OptaProvider implements MarketValueProvider {
  name = "Opta/StatsPerform";
  requiresApiKey = true;
  private apiKey: string;
  private cache = new Map<string, any>();

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.EXPO_PUBLIC_OPTA_API_KEY || "";
  }

  async findTeamId(teamName: string, leagueName?: string): Promise<string | null> {
    // TODO: Implement Opta team search
    console.log(`Opta: Finding team ID for ${teamName}`);
    return null;
  }

  async getTeamPlayers(teamId: string): Promise<PlayerMarketValueData[]> {
    // TODO: Implement Opta team squad fetch
    console.log(`Opta: Fetching players for team ${teamId}`);
    return [];
  }

  async getTeamInfo(teamId: string) {
    // TODO: Implement Opta team info
    return null;
  }

  async getMultipleTeamPlayers(teamIds: string[]): Promise<Map<string, PlayerMarketValueData[]>> {
    const results = new Map<string, PlayerMarketValueData[]>();
    for (const teamId of teamIds) {
      const players = await this.getTeamPlayers(teamId);
      results.set(teamId, players);
    }
    return results;
  }

  getPlayerPhotoUrl(playerId: string): string {
    // TODO: Return Opta player image URL
    return `https://opta-images.com/players/${playerId}.png`;
  }

  getTeamLogoUrl(teamId: string): string {
    // TODO: Return Opta team logo URL
    return `https://opta-images.com/teams/${teamId}.png`;
  }

  clearCache(): void {
    this.cache.clear();
  }

  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

/**
 * Wyscout Provider (Future - Requires API key)
 */
class WyscoutProvider implements MarketValueProvider {
  name = "Wyscout";
  requiresApiKey = true;
  private apiKey: string;
  private cache = new Map<string, any>();

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.EXPO_PUBLIC_WYSCOUT_API_KEY || "";
  }

  async findTeamId(teamName: string, leagueName?: string): Promise<string | null> {
    // TODO: Implement Wyscout team search
    console.log(`Wyscout: Finding team ID for ${teamName}`);
    return null;
  }

  async getTeamPlayers(teamId: string): Promise<PlayerMarketValueData[]> {
    // TODO: Implement Wyscout team squad fetch
    console.log(`Wyscout: Fetching players for team ${teamId}`);
    return [];
  }

  async getTeamInfo(teamId: string) {
    // TODO: Implement Wyscout team info
    return null;
  }

  async getMultipleTeamPlayers(teamIds: string[]): Promise<Map<string, PlayerMarketValueData[]>> {
    const results = new Map<string, PlayerMarketValueData[]>();
    for (const teamId of teamIds) {
      const players = await this.getTeamPlayers(teamId);
      results.set(teamId, players);
    }
    return results;
  }

  getPlayerPhotoUrl(playerId: string): string {
    // TODO: Return Wyscout player image URL
    return `https://wyscout-images.com/players/${playerId}.png`;
  }

  getTeamLogoUrl(teamId: string): string {
    // TODO: Return Wyscout team logo URL
    return `https://wyscout-images.com/teams/${teamId}.png`;
  }

  clearCache(): void {
    this.cache.clear();
  }

  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

/**
 * Provider Factory
 * Controls which market value provider is active
 */
class MarketValueProviderFactory {
  private activeProvider: MarketValueProvider;

  constructor() {
    // Default to SofaScore for development
    this.activeProvider = this.createProvider();
  }

  private createProvider(): MarketValueProvider {
    const providerType = process.env.EXPO_PUBLIC_MARKET_VALUE_PROVIDER || "sofascore";

    switch (providerType.toLowerCase()) {
      case "sportradar":
        console.log("🏆 Market Value Provider: Sportradar (Official)");
        return new SportradarProvider();
      
      case "opta":
      case "statsperform":
        console.log("🏆 Market Value Provider: Opta/StatsPerform (Official)");
        return new OptaProvider();
      
      case "wyscout":
        console.log("🏆 Market Value Provider: Wyscout (Official)");
        return new WyscoutProvider();
      
      case "sofascore":
      default:
        console.log("🏆 Market Value Provider: SofaScore (Development)");
        return new SofaScoreProvider();
    }
  }

  getProvider(): MarketValueProvider {
    return this.activeProvider;
  }

  switchProvider(providerType: string): void {
    const oldProvider = this.activeProvider.name;
    this.activeProvider = this.createProvider();
    console.log(`🔄 Switched market value provider from ${oldProvider} to ${this.activeProvider.name}`);
  }

  clearAllCaches(): void {
    this.activeProvider.clearCache();
  }
}

// Singleton instance
const marketValueProviderFactory = new MarketValueProviderFactory();

export default marketValueProviderFactory;
export { SofaScoreProvider, SportradarProvider, OptaProvider, WyscoutProvider };
export type { MarketValueProvider, PlayerMarketValueData, TeamMarketValueData };

