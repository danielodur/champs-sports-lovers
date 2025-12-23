/**
 * Smart League Detector Service
 * 
 * Intelligently detects, fetches, and organizes countries and leagues
 * based on horizontal button selection and sport type.
 * 
 * This service ensures:
 * - Dynamic country detection from API data
 * - Sport-specific filtering (basketball vs football)
 * - Proper league and cup categorization
 * - Efficient caching and data organization
 */

import { leaguesByRegionService, LeagueData } from "./leaguesByRegionService";
import cacheService from "./cacheService";

export interface CountryLeagueData {
  countryName: string;
  countryFlag: string | null;
  leagues: LeagueData[];
  cups: LeagueData[];
  totalCompetitions: number;
}

export interface RegionData {
  regionName: string;
  countries: CountryLeagueData[];
  totalLeagues: number;
  totalCups: number;
}

type Region = "Hot" | "Top" | "Int'l" | "Africa" | "Europe" | "America" | "Oceania" | "Asia";

class SmartLeagueDetectorService {
  private readonly CACHE_TTL = 10 * 60 * 1000; // 10 minutes cache

  /**
   * Smart Country Detector
   * Detects all countries with leagues/cups for a given region and sport
   */
  async detectCountriesForRegion(
    region: Region,
    sport: string = "football"
  ): Promise<string[]> {
    const cacheKey = `smart_countries_${region}_${sport}`;
    
    // Try cache first
    const cached = await cacheService.get<string[]>(cacheKey);
    if (cached !== null && cached.length > 0) {
      console.log(`🎯 [SmartDetector] Using cached countries for ${region} ${sport}: ${cached.length} countries`);
      return cached;
    }

    try {
      // Fetch all leagues for the region
      const leagues = await leaguesByRegionService.getLeaguesByRegion(region, sport);
      
      // Extract unique countries
      const countriesSet = new Set<string>();
      leagues.forEach(league => {
        if (league.country && 
            league.country !== "World" && 
            league.country !== "International") {
          countriesSet.add(league.country);
        }
      });

      const countries = Array.from(countriesSet).sort();
      
      // Cache the result
      await cacheService.set(cacheKey, countries, this.CACHE_TTL);
      
      console.log(`✅ [SmartDetector] Detected ${countries.length} countries for ${region} ${sport}`);
      return countries;
    } catch (error) {
      console.error(`❌ [SmartDetector] Error detecting countries for ${region} ${sport}:`, error);
      return cached || [];
    }
  }

  /**
   * Smart League and Cup Detector
   * Intelligently categorizes leagues and cups for a country
   */
  async detectLeaguesAndCupsForCountry(
    region: Region,
    countryName: string,
    sport: string = "football"
  ): Promise<{ leagues: LeagueData[]; cups: LeagueData[] }> {
    try {
      // Fetch all leagues for the region
      const allLeagues = await leaguesByRegionService.getLeaguesByRegion(region, sport);
      
      // Filter by country
      const countryCompetitions = allLeagues.filter(
        league => league.country === countryName
      );

      // Categorize into leagues and cups
      const leagues: LeagueData[] = [];
      const cups: LeagueData[] = [];

      countryCompetitions.forEach(competition => {
        const name = competition.name.toLowerCase();
        const type = competition.type.toLowerCase();

        // Smart detection logic
        const isCup = 
          type === "cup" ||
          name.includes("cup") ||
          name.includes("trophy") ||
          name.includes("championship") && name.includes("cup") ||
          name.includes("fa cup") ||
          name.includes("copa") ||
          name.includes("coupe") ||
          name.includes("pokal");

        if (isCup) {
          cups.push(competition);
        } else {
          leagues.push(competition);
        }
      });

      console.log(`🎯 [SmartDetector] ${countryName} ${sport}: ${leagues.length} leagues, ${cups.length} cups`);
      
      return { leagues, cups };
    } catch (error) {
      console.error(`❌ [SmartDetector] Error detecting leagues/cups for ${countryName}:`, error);
      return { leagues: [], cups: [] };
    }
  }

  /**
   * Smart Region Data Organizer
   * Organizes all data for a region with intelligent grouping
   */
  async getOrganizedRegionData(
    region: Region,
    sport: string = "football"
  ): Promise<RegionData> {
    const cacheKey = `smart_region_data_${region}_${sport}`;
    
    // Try cache first
    const cached = await cacheService.get<RegionData>(cacheKey);
    if (cached !== null) {
      console.log(`🎯 [SmartDetector] Using cached region data for ${region} ${sport}`);
      return cached;
    }

    try {
      // Detect all countries
      const countries = await this.detectCountriesForRegion(region, sport);
      
      // Organize data for each country
      const countryDataPromises = countries.map(async (countryName) => {
        const { leagues, cups } = await this.detectLeaguesAndCupsForCountry(
          region,
          countryName,
          sport
        );

        // Get country flag from first league
        const firstCompetition = leagues[0] || cups[0];
        const countryFlag = firstCompetition?.flag || null;

        const countryData: CountryLeagueData = {
          countryName,
          countryFlag,
          leagues,
          cups,
          totalCompetitions: leagues.length + cups.length,
        };

        return countryData;
      });

      const countryData = await Promise.all(countryDataPromises);

      // Calculate totals
      const totalLeagues = countryData.reduce((sum, c) => sum + c.leagues.length, 0);
      const totalCups = countryData.reduce((sum, c) => sum + c.cups.length, 0);

      const regionData: RegionData = {
        regionName: region,
        countries: countryData.filter(c => c.totalCompetitions > 0), // Only countries with data
        totalLeagues,
        totalCups,
      };

      // Cache the result
      await cacheService.set(cacheKey, regionData, this.CACHE_TTL);
      
      console.log(`✅ [SmartDetector] Organized ${region} ${sport}: ${regionData.countries.length} countries, ${totalLeagues} leagues, ${totalCups} cups`);
      
      return regionData;
    } catch (error) {
      console.error(`❌ [SmartDetector] Error organizing region data for ${region} ${sport}:`, error);
      return cached || {
        regionName: region,
        countries: [],
        totalLeagues: 0,
        totalCups: 0,
      };
    }
  }

  /**
   * Smart Vertical Tab Data
   * Gets data for vertical tabs based on horizontal selection
   */
  async getVerticalTabData(
    horizontalTab: Region,
    sport: string = "football"
  ): Promise<{ id: string; label: string; count: number }[]> {
    try {
      const countries = await this.detectCountriesForRegion(horizontalTab, sport);
      
      // Get league count for each country
      const tabDataPromises = countries.map(async (country) => {
        const { leagues, cups } = await this.detectLeaguesAndCupsForCountry(
          horizontalTab,
          country,
          sport
        );
        
        return {
          id: country,
          label: country.length > 15 ? country.substring(0, 13) + "..." : country,
          count: leagues.length + cups.length,
        };
      });

      const tabData = await Promise.all(tabDataPromises);
      
      // Sort by count (descending)
      return tabData
        .filter(t => t.count > 0)
        .sort((a, b) => b.count - a.count);
    } catch (error) {
      console.error(`❌ [SmartDetector] Error getting vertical tab data:`, error);
      return [];
    }
  }

  /**
   * Clear cache for a specific region and sport
   */
  async clearCache(region?: Region, sport?: string): Promise<void> {
    if (region && sport) {
      const keys = [
        `smart_countries_${region}_${sport}`,
        `smart_region_data_${region}_${sport}`,
      ];
      
      for (const key of keys) {
        await cacheService.delete(key);
      }
      
      console.log(`🗑️ [SmartDetector] Cleared cache for ${region} ${sport}`);
    } else {
      // Clear all smart detector cache
      console.log(`🗑️ [SmartDetector] Cache clearing not fully implemented for all keys`);
    }
  }
}

export const smartLeagueDetectorService = new SmartLeagueDetectorService();
export default smartLeagueDetectorService;









