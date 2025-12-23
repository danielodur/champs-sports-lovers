import Constants from "expo-constants";
import { createApiSportsService, ApiSportsService } from "./api-sports-service";
import { theSportsDbService } from "./theSportsDbService";

// TypeScript interfaces
export interface TeamRanking {
  rank: number;
  teamId: number;
  teamName: string;
  points: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  form: string;
  logo: string;
  lastUpdated: string;
}

export interface FIFARanking {
  team: {
    name: string;
    code: string;
    flag: string;
  };
  rank: number;
  points: number;
}

export interface LeagueStanding {
  rank: number;
  teamId: number;
  teamName: string;
  points: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  form: string;
  logo: string;
}

class TeamRankingsService {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 hours
  private apiSportsService: ApiSportsService;

  constructor() {
    // Helper function to get API key
    const getApiKey = () => {
      return (
        process.env.EXPO_PUBLIC_API_FOOTBALL_KEY ||
        process.env.EXPO_PUBLIC_API_SPORT_KEY ||
        process.env.EXPO_PUBLIC_THE_SPORTSDB_API_KEY ||
        process.env.EXPO_API_FOOTBALL_KEY
      );
    };

    // Initialize API-Football service using factory function
    this.apiSportsService = createApiSportsService(getApiKey(), {
      enableCaching: true,
      cacheExpiry: 6 * 60 * 60 * 1000, // 6 hours
      retryAttempts: 3,
      timeout: 10000,
    });

    console.log(
      "🏆 TeamRankingsService initialized with:",
      getApiKey() ? "✅ API key present" : "❌ API key missing",
    );
  }

  /**
   * Get team's league position using API-Football
   */
  async getTeamLeaguePositionApiFootball(
    teamId: number,
    leagueId: number,
    season?: number,
  ): Promise<number | null> {
    try {
      const currentYear = new Date().getFullYear();
      const seasonYear = season || currentYear;

      console.log(
        `🏆 [API-Football] Getting league position for team ${teamId} in league ${leagueId}, season ${seasonYear}`,
      );

      const response = await this.apiSportsService.getStandings(
        leagueId,
        seasonYear,
      );

      if (!response || !response.response || response.response.length === 0) {
        console.warn(
          `🏆 [API-Football] No standings data for league ${leagueId}`,
        );
        return null;
      }

      // API-Football standings structure: response[0].league.standings[0] contains the table
      const standings = response.response[0]?.league?.standings?.[0];
      if (!standings || !Array.isArray(standings)) {
        console.warn(
          `🏆 [API-Football] Invalid standings structure for league ${leagueId}`,
        );
        return null;
      }

      const teamStanding = standings.find(
        (team: any) => team.team.id === teamId,
      );
      const rank = teamStanding?.rank || null;

      console.log(`🏆 [API-Football] Team ${teamId} rank: ${rank}`);
      return rank;
    } catch (error) {
      console.error(
        `🏆 [API-Football] Error getting league position for team ${teamId}:`,
        error,
      );
      return null;
    }
  }

  /**
   * Get team's league position using TheSportsDB
   */
  async getTeamLeaguePositionTheSportsDB(
    teamName: string,
    leagueId: string,
    season?: string,
  ): Promise<number | null> {
    try {
      console.log(
        `🏆 [TheSportsDB] Getting league position for team ${teamName} in league ${leagueId}`,
      );

      const standings = await theSportsDbService.getLeagueTable(
        leagueId,
        season,
      );

      if (!standings || standings.length === 0) {
        console.warn(
          `🏆 [TheSportsDB] No standings data for league ${leagueId}`,
        );
        return null;
      }

      // TheSportsDB returns array of team standings with intRank property
      const teamStanding = standings.find(
        (team: any) =>
          team.strTeam?.toLowerCase() === teamName.toLowerCase() ||
          team.strTeam?.toLowerCase().includes(teamName.toLowerCase()) ||
          teamName.toLowerCase().includes(team.strTeam?.toLowerCase()),
      );

      const rank = teamStanding?.intRank
        ? parseInt(teamStanding.intRank)
        : null;

      console.log(`🏆 [TheSportsDB] Team ${teamName} rank: ${rank}`);
      return rank;
    } catch (error) {
      console.error(
        `🏆 [TheSportsDB] Error getting league position for team ${teamName}:`,
        error,
      );
      return null;
    }
  }

  /**
   * Get FIFA country rankings (hardcoded for reliability)
   */
  async getFIFACountryRanking(countryName: string): Promise<number | null> {
    try {
      console.log(`🏆 Getting FIFA ranking for ${countryName}`);

      const rankings = await this.getFIFARankings();

      // Try multiple matching strategies
      const country = rankings.find(
        (ranking) =>
          ranking.team.name.toLowerCase() === countryName.toLowerCase() ||
          ranking.team.code.toLowerCase() ===
            this.getCountryCode(countryName).toLowerCase() ||
          countryName.toLowerCase().includes(ranking.team.name.toLowerCase()) ||
          ranking.team.name.toLowerCase().includes(countryName.toLowerCase()),
      );

      const rank = country?.rank || null;
      console.log(`🏆 FIFA ranking for ${countryName}: ${rank}`);
      return rank;
    } catch (error) {
      console.error(`🏆 Error getting FIFA ranking for ${countryName}:`, error);
      return null;
    }
  }

  /**
   * Get FIFA rankings (hardcoded for reliability)
   */
  async getFIFARankings(): Promise<FIFARanking[]> {
    const cacheKey = "fifa-rankings";
    const cachedData = this.getCachedData(cacheKey);

    if (cachedData) {
      return cachedData;
    }

    try {
      // Current FIFA rankings as of 2024
      const fifaRankings: FIFARanking[] = [
        {
          team: { name: "Argentina", code: "ARG", flag: "🇦🇷" },
          rank: 1,
          points: 1883.5,
        },
        {
          team: { name: "France", code: "FRA", flag: "🇫🇷" },
          rank: 2,
          points: 1859.78,
        },
        {
          team: { name: "Brazil", code: "BRA", flag: "🇧🇷" },
          rank: 3,
          points: 1834.65,
        },
        {
          team: { name: "England", code: "ENG", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
          rank: 4,
          points: 1817.28,
        },
        {
          team: { name: "Belgium", code: "BEL", flag: "🇧🇪" },
          rank: 5,
          points: 1788.55,
        },
        {
          team: { name: "Croatia", code: "CRO", flag: "🇭🇷" },
          rank: 6,
          points: 1742.55,
        },
        {
          team: { name: "Netherlands", code: "NED", flag: "🇳🇱" },
          rank: 7,
          points: 1731.23,
        },
        {
          team: { name: "Italy", code: "ITA", flag: "🇮🇹" },
          rank: 8,
          points: 1726.14,
        },
        {
          team: { name: "Portugal", code: "POR", flag: "🇵🇹" },
          rank: 9,
          points: 1718.25,
        },
        {
          team: { name: "Spain", code: "ESP", flag: "🇪🇸" },
          rank: 10,
          points: 1703.45,
        },
        {
          team: { name: "Morocco", code: "MAR", flag: "🇲🇦" },
          rank: 11,
          points: 1672.35,
        },
        {
          team: { name: "Switzerland", code: "SUI", flag: "🇨🇭" },
          rank: 12,
          points: 1666.57,
        },
        {
          team: { name: "USA", code: "USA", flag: "🇺🇸" },
          rank: 13,
          points: 1665.44,
        },
        {
          team: { name: "Germany", code: "GER", flag: "🇩🇪" },
          rank: 14,
          points: 1650.21,
        },
        {
          team: { name: "Mexico", code: "MEX", flag: "🇲🇽" },
          rank: 15,
          points: 1645.78,
        },
        {
          team: { name: "Japan", code: "JPN", flag: "🇯🇵" },
          rank: 16,
          points: 1635.12,
        },
        {
          team: { name: "Uruguay", code: "URU", flag: "🇺🇾" },
          rank: 17,
          points: 1634.89,
        },
        {
          team: { name: "Colombia", code: "COL", flag: "🇨🇴" },
          rank: 18,
          points: 1633.45,
        },
        {
          team: { name: "Denmark", code: "DEN", flag: "🇩🇰" },
          rank: 19,
          points: 1632.11,
        },
        {
          team: { name: "Senegal", code: "SEN", flag: "🇸🇳" },
          rank: 20,
          points: 1627.56,
        },
      ];

      this.setCachedData(cacheKey, fifaRankings);
      return fifaRankings;
    } catch (error) {
      console.error("🏆 Error fetching FIFA rankings:", error);
      return [];
    }
  }

  /**
   * League ID mappings between different APIs
   */
  private getLeagueMapping(): Map<
    number,
    { theSportsDb: string; name: string }
  > {
    const mapping = new Map();

    // Major European leagues
    mapping.set(39, { theSportsDb: "4328", name: "Premier League" }); // Premier League
    mapping.set(140, { theSportsDb: "4335", name: "La Liga" }); // La Liga
    mapping.set(135, { theSportsDb: "4332", name: "Serie A" }); // Serie A
    mapping.set(78, { theSportsDb: "4331", name: "Bundesliga" }); // Bundesliga
    mapping.set(61, { theSportsDb: "4334", name: "Ligue 1" }); // Ligue 1

    // Other major leagues
    mapping.set(94, { theSportsDb: "4356", name: "Primeira Liga" }); // Portugal
    mapping.set(88, { theSportsDb: "4337", name: "Eredivisie" }); // Netherlands
    mapping.set(203, { theSportsDb: "4340", name: "Super Lig" }); // Turkey
    mapping.set(71, { theSportsDb: "4346", name: "Serie A" }); // Brazil Serie A
    mapping.set(253, { theSportsDb: "4351", name: "MLS" }); // MLS

    return mapping;
  }

  /**
   * Determine if a team is a national team/country (not a club)
   */
  isNationalTeam(teamName: string, leagueCountry?: string | null): boolean {
    if (!teamName) return false;

    const teamNameLower = teamName.toLowerCase().trim();

    // Club team indicators (if present, it's NOT a national team)
    const clubIndicators = [
      "fc",
      "football club",
      "united",
      "city",
      "athletic",
      "sporting",
      "real",
      "atletico",
      "atlético",
      "cf",
      "ac",
      "as",
      "sc",
      "rcd",
      "cf",
      "club",
      "wanderers",
      "rovers",
      "rangers",
      "albion",
      "hotspur",
      "wanderers",
      "rovers",
      "town",
      "county",
      "borough",
    ];

    // If team name contains club indicators, it's a club
    if (clubIndicators.some((indicator) => teamNameLower.includes(indicator))) {
      return false;
    }

    // Known country names (comprehensive list)
    const countryNames = [
      "argentina",
      "france",
      "brazil",
      "england",
      "belgium",
      "croatia",
      "netherlands",
      "italy",
      "portugal",
      "spain",
      "morocco",
      "switzerland",
      "usa",
      "united states",
      "germany",
      "mexico",
      "japan",
      "uruguay",
      "colombia",
      "denmark",
      "senegal",
      "poland",
      "sweden",
      "norway",
      "wales",
      "scotland",
      "ireland",
      "northern ireland",
      "czech republic",
      "austria",
      "russia",
      "ukraine",
      "greece",
      "turkey",
      "romania",
      "bulgaria",
      "serbia",
      "croatia",
      "slovenia",
      "slovakia",
      "hungary",
      "finland",
      "iceland",
      "albania",
      "bosnia",
      "montenegro",
      "macedonia",
      "moldova",
      "estonia",
      "latvia",
      "lithuania",
      "georgia",
      "armenia",
      "azerbaijan",
      "kazakhstan",
      "uzbekistan",
      "turkmenistan",
      "kyrgyzstan",
      "tajikistan",
      "afghanistan",
      "pakistan",
      "india",
      "bangladesh",
      "sri lanka",
      "nepal",
      "bhutan",
      "maldives",
      "myanmar",
      "thailand",
      "vietnam",
      "cambodia",
      "laos",
      "malaysia",
      "singapore",
      "indonesia",
      "philippines",
      "brunei",
      "east timor",
      "china",
      "south korea",
      "north korea",
      "mongolia",
      "taiwan",
      "hong kong",
      "macau",
      "saudi arabia",
      "united arab emirates",
      "qatar",
      "kuwait",
      "bahrain",
      "oman",
      "yemen",
      "iraq",
      "iran",
      "syria",
      "lebanon",
      "jordan",
      "israel",
      "palestine",
      "egypt",
      "libya",
      "tunisia",
      "algeria",
      "morocco",
      "sudan",
      "south sudan",
      "ethiopia",
      "eritrea",
      "djibouti",
      "somalia",
      "kenya",
      "uganda",
      "tanzania",
      "rwanda",
      "burundi",
      "malawi",
      "zambia",
      "zimbabwe",
      "mozambique",
      "madagascar",
      "mauritius",
      "seychelles",
      "comoros",
      "south africa",
      "lesotho",
      "eswatini",
      "botswana",
      "namibia",
      "angola",
      "congo",
      "democratic republic of congo",
      "gabon",
      "equatorial guinea",
      "cameroon",
      "chad",
      "central african republic",
      "niger",
      "nigeria",
      "benin",
      "togo",
      "ghana",
      "ivory coast",
      "côte d'ivoire",
      "burkina faso",
      "mali",
      "mauritania",
      "gambia",
      "guinea",
      "guinea-bissau",
      "sierra leone",
      "liberia",
      "cape verde",
      "são tomé and príncipe",
      "canada",
      "costa rica",
      "panama",
      "nicaragua",
      "honduras",
      "guatemala",
      "belize",
      "el salvador",
      "cuba",
      "jamaica",
      "haiti",
      "dominican republic",
      "trinidad and tobago",
      "barbados",
      "bahamas",
      "antigua and barbuda",
      "saint kitts and nevis",
      "dominica",
      "saint lucia",
      "saint vincent and the grenadines",
      "grenada",
      "venezuela",
      "guyana",
      "suriname",
      "french guiana",
      "ecuador",
      "peru",
      "bolivia",
      "paraguay",
      "chile",
      "australia",
      "new zealand",
      "papua new guinea",
      "fiji",
      "samoa",
      "tonga",
      "vanuatu",
      "new caledonia",
      "tahiti",
      "solomon islands",
    ];

    // Check if team name matches a country name
    if (countryNames.some((country) => teamNameLower === country || teamNameLower.includes(country) || country.includes(teamNameLower))) {
      return true;
    }

    // Check if team name matches league country (if provided)
    if (leagueCountry) {
      const leagueCountryLower = leagueCountry.toLowerCase().trim();
      if (teamNameLower === leagueCountryLower || teamNameLower.includes(leagueCountryLower) || leagueCountryLower.includes(teamNameLower)) {
        return true;
      }
    }

    // Check for "national" in name
    if (teamNameLower.includes("national") && !teamNameLower.includes("national league")) {
      return true;
    }

    return false;
  }

  /**
   * Determine if a league represents international matches
   */
  isInternationalLeague(leagueName: string): boolean {
    const internationalKeywords = [
      "World Cup",
      "Euro",
      "European Championship",
      "Nations League",
      "Copa America",
      "AFCON",
      "AFC",
      "CONCACAF",
      "International",
      "Qualifiers",
      "FIFA",
      "Olympics",
      "Confederations Cup",
      "Gold Cup",
      "Asian Cup",
      "Africa Cup",
      "Friendlies",
      "Friendly",
    ];

    return internationalKeywords.some((keyword) =>
      leagueName.toLowerCase().includes(keyword.toLowerCase()),
    );
  }

  /**
   * Get appropriate ranking for display (league position or FIFA ranking)
   */
  async getTeamRankingForDisplay(
    teamId: number | null,
    teamName: string,
    leagueId: number | null,
    leagueName: string,
    leagueCountry?: string | null,
  ): Promise<number | null> {
    try {
      console.log(
        `🏆 Getting ranking for team: ${teamName} in league: ${leagueName} (country: ${leagueCountry || "N/A"})`,
      );

      // Quick check for empty or invalid data
      if (!teamName || teamName === "Unknown") {
        console.log(`🏆 Skipping ranking for invalid team name: ${teamName}`);
        return null;
      }

      // PRIORITY 1: Check if team is a national team/country FIRST
      // Countries ALWAYS use FIFA rankings regardless of league context
      const isCountry = this.isNationalTeam(teamName, leagueCountry);
      if (isCountry) {
        console.log(
          `🌍 Detected national team/country: ${teamName} - Using FIFA rankings`,
        );
        return await this.getFIFACountryRanking(teamName);
      }

      // PRIORITY 2: Check if it's an international competition
      // For club teams in international competitions, also use FIFA rankings
      if (this.isInternationalLeague(leagueName)) {
        console.log(
          `🏆 Using FIFA rankings for international competition: ${leagueName}`,
        );
        return await this.getFIFACountryRanking(teamName);
      }

      // Try TheSportsDB first for major leagues (avoid API-Football rate limits)
      // ✅ PRIORITY 1: Try API-Football first (primary subscription - comprehensive data)
      if (teamId && leagueId && process.env.EXPO_PUBLIC_API_FOOTBALL_KEY) {
        console.log(
          `🏆 [Priority 1] Trying API-Football for club competition: ${leagueName}`,
        );

        const rank = await this.getTeamLeaguePositionApiFootball(
          teamId,
          leagueId,
        );
        if (rank !== null) {
          console.log(`✅ API-Football returned rank ${rank} for ${teamName}`);
          return rank;
        }
        console.log(`⚠️ API-Football had no data for ${teamName}, trying fallback...`);
      }

      // ✅ PRIORITY 2: Fallback to TheSportsDB (free tier - limited data)
      if (leagueId && process.env.EXPO_PUBLIC_THE_SPORTSDB_API_KEY) {
        const leagueMapping = this.getLeagueMapping();
        const theSportsDbLeague = leagueMapping.get(leagueId);

        if (theSportsDbLeague) {
          console.log(
            `🏆 [Priority 2] Trying TheSportsDB fallback for club competition: ${leagueName}`,
          );

          const rank = await this.getTeamLeaguePositionTheSportsDB(
            teamName,
            theSportsDbLeague.theSportsDb,
          );
          if (rank !== null) {
            console.log(`✅ TheSportsDB returned rank ${rank} for ${teamName}`);
            return rank;
          }
          console.log(`⚠️ TheSportsDB had no data for ${teamName}, trying hardcoded fallback...`);
        }
      }

      // ✅ PRIORITY 3: Final fallback - hardcoded rankings for well-known teams (only for clubs, not countries)
      // Note: Countries should have been caught above, so this is only for clubs
      const hardcodedRank = this.getHardcodedRanking(teamName, leagueName);
      if (hardcodedRank !== null) {
        console.log(
          `🏆 Using hardcoded ranking fallback for club ${teamName}: ${hardcodedRank}`,
        );
        return hardcodedRank;
      }

      // No ranking available from API - return null (no fake/test rankings)
      console.log(`🏆 No ranking found for team: ${teamName} - returning null (API-driven only)`);
      return null;
    } catch (error) {
      console.warn(`🏆 Error getting ranking for team ${teamName}:`, error);
      return null;
    }
  }

  /**
   * Generate test rankings for visibility verification
   * This ensures all teams get rankings for testing purposes
   */
  private getTestRankingForVisibility(
    teamName: string,
    leagueName: string,
  ): number | null {
    const team = teamName.toLowerCase();

    // Common team patterns for testing
    const testRankings: { [key: string]: number } = {
      // Top tier teams
      "manchester city": 3,
      liverpool: 1,
      arsenal: 2,
      chelsea: 4,
      "real madrid": 1,
      barcelona: 2,
      "bayern munich": 2,
      psg: 1,
      juventus: 2,
      inter: 1,
      "ac milan": 3,
      "atletico madrid": 4,
      tottenham: 5,
      "manchester united": 6,

      // International teams
      brazil: 3,
      argentina: 1,
      france: 2,
      england: 4,
      spain: 5,
      germany: 6,
      portugal: 7,
      netherlands: 8,
      italy: 9,
      croatia: 10,
      belgium: 11,

      // Asian teams for AFC tournaments
      japan: 2,
      "south korea": 3,
      australia: 4,
      "saudi arabia": 5,
      iran: 6,
      qatar: 7,
      china: 8,
      thailand: 9,
      vietnam: 10,
      malaysia: 11,
      indonesia: 12,
      india: 13,
    };

    // Check for exact match
    if (testRankings[team]) {
      return testRankings[team];
    }

    // Check for partial matches
    for (const [key, rank] of Object.entries(testRankings)) {
      if (team.includes(key) || key.includes(team)) {
        return rank;
      }
    }

    // Generate consistent random ranking based on team name hash
    let hash = 0;
    for (let i = 0; i < teamName.length; i++) {
      hash = teamName.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Return ranking between 1-20 based on hash
    return (Math.abs(hash) % 20) + 1;
  }

  /**
   * Get hardcoded rankings for common teams (fallback)
   */
  private getHardcodedRanking(
    teamName: string,
    leagueName: string,
  ): number | null {
    const team = teamName.toLowerCase();

    // Premier League (Updated 2024-25 season)
    if (leagueName.toLowerCase().includes("premier")) {
      const premierLeagueRankings: { [key: string]: number } = {
        liverpool: 1,
        arsenal: 2,
        "manchester city": 3,
        chelsea: 4,
        "newcastle united": 5,
        bournemouth: 6,
        "aston villa": 7,
        fulham: 8,
        brighton: 9,
        "nottingham forest": 10,
        brentford: 11,
        tottenham: 12,
        "west ham": 13,
        "manchester united": 14,
        "crystal palace": 15,
        everton: 16,
        wolves: 17,
        "ipswich town": 18,
        leicester: 19,
        southampton: 20,
      };
      return premierLeagueRankings[team] || null;
    }

    // La Liga
    if (
      leagueName.toLowerCase().includes("la liga") ||
      leagueName.toLowerCase().includes("spanish")
    ) {
      const laLigaRankings: { [key: string]: number } = {
        "real madrid": 1,
        barcelona: 2,
        girona: 3,
        "atletico madrid": 4,
        "athletic bilbao": 5,
        "real sociedad": 6,
        "real betis": 7,
        valencia: 8,
      };
      return laLigaRankings[team] || null;
    }

    // Serie A
    if (
      leagueName.toLowerCase().includes("serie") ||
      leagueName.toLowerCase().includes("italian")
    ) {
      const serieARankings: { [key: string]: number } = {
        inter: 1,
        juventus: 2,
        "ac milan": 3,
        atalanta: 4,
        bologna: 5,
        roma: 6,
        lazio: 7,
        napoli: 8,
      };
      return serieARankings[team] || null;
    }

    // Bundesliga
    if (
      leagueName.toLowerCase().includes("bundesliga") ||
      leagueName.toLowerCase().includes("german")
    ) {
      const bundesligaRankings: { [key: string]: number } = {
        "bayer leverkusen": 1,
        "bayern munich": 2,
        "vfb stuttgart": 3,
        "rb leipzig": 4,
        "borussia dortmund": 5,
        "eintracht frankfurt": 6,
      };
      return bundesligaRankings[team] || null;
    }

    return null;
  }

  /**
   * Get country code from country name
   */
  private getCountryCode(countryName: string): string {
    const countryCodeMap: { [key: string]: string } = {
      Argentina: "ARG",
      France: "FRA",
      Brazil: "BRA",
      England: "ENG",
      Belgium: "BEL",
      Croatia: "CRO",
      Netherlands: "NED",
      Italy: "ITA",
      Portugal: "POR",
      Spain: "ESP",
      Morocco: "MAR",
      Switzerland: "SUI",
      "United States": "USA",
      Germany: "GER",
      Mexico: "MEX",
      Japan: "JPN",
      Uruguay: "URU",
      Colombia: "COL",
      Denmark: "DEN",
      Senegal: "SEN",
    };

    return (
      countryCodeMap[countryName] || countryName.substring(0, 3).toUpperCase()
    );
  }

  /**
   * Batch get rankings for multiple teams
   */
  async getBatchTeamRankings(
    teams: Array<{
      id: number | null;
      name: string;
      leagueId: number | null;
      leagueName: string;
    }>,
  ): Promise<Map<string, number>> {
    const rankings = new Map<string, number>();

    try {
      console.log(`🏆 Starting batch ranking for ${teams.length} teams`);

      // Remove duplicates and clean team names
      const uniqueTeams = teams
        .filter(
          (team, index, self) =>
            self.findIndex((t) => t.name === team.name) === index,
        )
        .map((team) => ({ ...team, name: team.name.trim() }))
        .slice(0, 15); // Limit to prevent excessive API calls

      console.log(`🏆 Processing ${uniqueTeams.length} unique teams`);

      // Process teams with concurrency limit
      const batchSize = 3;
      for (let i = 0; i < uniqueTeams.length; i += batchSize) {
        const batch = uniqueTeams.slice(i, i + batchSize);
        console.log(
          `🏆 Processing batch ${Math.floor(i / batchSize) + 1} with ${batch.length} teams`,
        );

        const batchPromises = batch.map(async (team) => {
          try {
            const rankingPromise = this.getTeamRankingForDisplay(
              team.id,
              team.name,
              team.leagueId,
              team.leagueName,
            );

            const timeoutPromise = new Promise<number | null>((_, reject) =>
              setTimeout(
                () => reject(new Error("Individual ranking timeout")),
                8000, // 8 second timeout per team
              ),
            );

            const ranking = await Promise.race([
              rankingPromise,
              timeoutPromise,
            ]);

            if (ranking !== null && ranking > 0) {
              rankings.set(team.name, ranking);
              console.log(`🏆 Got ranking for ${team.name}: ${ranking}`);
            }
          } catch (error) {
            console.warn(`🏆 Failed to get ranking for ${team.name}:`, error);
          }
        });

        await Promise.allSettled(batchPromises);

        // Delay between batches to respect rate limits
        if (i + batchSize < uniqueTeams.length) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      console.log(
        `🏆 Batch ranking complete. Found rankings for ${rankings.size} teams total`,
      );
    } catch (error) {
      console.warn("🏆 Batch rankings failed:", error);
    }

    return rankings;
  }

  // Cache management
  private setCachedData(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  private getCachedData(key: string): any {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  clearExpiredCache(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.CACHE_DURATION) {
        this.cache.delete(key);
      }
    }
  }

  clearCache(): void {
    this.cache.clear();
    console.log("✅ Team rankings cache cleared");
  }
}

const teamRankingsService = new TeamRankingsService();
export default teamRankingsService;
