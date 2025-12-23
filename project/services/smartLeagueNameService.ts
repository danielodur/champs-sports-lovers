import { leagueNormalizationService } from "./leagueNormalizationService";

interface LeagueNameContext {
  originalName: string;
  normalizedName: string;
  countryDetected?: string;
  isAmbiguous: boolean;
  enhancedName: string;
  confidence: "high" | "medium" | "low";
}

interface AmbiguousLeaguePattern {
  pattern: string;
  variations: string[];
  requiresCountry: boolean;
  fallbackName?: string;
}

class SmartLeagueNameService {
  private ambiguousPatterns: AmbiguousLeaguePattern[] = [
    {
      pattern: "premier league",
      variations: [
        "premier league",
        "premier",
        "pl",
        "premier l",
        "premier soccer league",
      ],
      requiresCountry: true,
      fallbackName: "Premier League",
    },
    {
      pattern: "first division",
      variations: [
        "first division",
        "1st division",
        "1. division",
        "division 1",
        "div 1",
      ],
      requiresCountry: true,
      fallbackName: "First Division",
    },
    {
      pattern: "second division",
      variations: [
        "second division",
        "2nd division",
        "2. division",
        "division 2",
        "div 2",
      ],
      requiresCountry: true,
      fallbackName: "Second Division",
    },
    {
      pattern: "super league",
      variations: ["super league", "super liga", "superliga"],
      requiresCountry: true,
      fallbackName: "Super League",
    },
    {
      pattern: "national league",
      variations: ["national league", "national", "liga nacional"],
      requiresCountry: true,
      fallbackName: "National League",
    },
    {
      pattern: "championship",
      variations: ["championship", "championnat", "campeonato"],
      requiresCountry: true,
      fallbackName: "Championship",
    },
    {
      pattern: "cup",
      variations: ["cup", "copa", "coupe", "fa cup", "league cup"],
      requiresCountry: true,
      fallbackName: "Cup",
    },
    {
      pattern: "league one",
      variations: ["league one", "league 1", "liga one"],
      requiresCountry: true,
      fallbackName: "League One",
    },
    {
      pattern: "league two",
      variations: ["league two", "league 2", "liga two"],
      requiresCountry: true,
      fallbackName: "League Two",
    },
    // Additional patterns for common league names that need country context
    {
      pattern: "ekstraklasa",
      variations: ["ekstraklasa"],
      requiresCountry: true,
      fallbackName: "Ekstraklasa",
    },
    {
      pattern: "liga",
      variations: ["liga", "druha liga", "prva liga", "segunda liga"],
      requiresCountry: true,
      fallbackName: "Liga",
    },
    {
      pattern: "division",
      variations: ["division", "tercera division", "segunda division"],
      requiresCountry: true,
      fallbackName: "Division",
    },
  ];

  private countryPrefixMappings: { [key: string]: string } = {
    English: "English",
    Russian: "Russian",
    Chinese: "Chinese",
    Indian: "Indian",
    Bangladeshi: "Bangladeshi",
    Nigerian: "Nigerian",
    "South African": "South African",
    Ghanaian: "Ghanaian",
    Kenyan: "Kenyan",
    Ethiopian: "Ethiopian",
    Egyptian: "Egyptian",
    Moroccan: "Moroccan",
    Tunisian: "Tunisian",
    Algerian: "Algerian",
    Ugandan: "Ugandan",
    Tanzanian: "Tanzanian",
    Zimbabwean: "Zimbabwean",
    Zambian: "Zambian",
    Brazilian: "Brazilian",
    Argentine: "Argentine",
    Chilean: "Chilean",
    Colombian: "Colombian",
    Mexican: "Mexican",
    Uruguayan: "Uruguayan",
    Paraguayan: "Paraguayan",
    Bolivian: "Bolivian",
    Peruvian: "Peruvian",
    Ecuadorian: "Ecuadorian",
    Japanese: "Japanese",
    Korean: "Korean",
    Thai: "Thai",
    Vietnamese: "Vietnamese",
    Malaysian: "Malaysian",
    Indonesian: "Indonesian",
    Filipino: "Filipino",
    Singaporean: "Singaporean",
    Australian: "Australian",
    Romanian: "Romanian",
    Bulgarian: "Bulgarian",
    Serbian: "Serbian",
    Croatian: "Croatian",
    Slovenian: "Slovenian",
    Slovak: "Slovak",
    Czech: "Czech",
    Hungarian: "Hungarian",
    Polish: "Polish",
    Estonian: "Estonian",
    Latvian: "Latvian",
    Lithuanian: "Lithuanian",
    Georgian: "Georgian",
    Armenian: "Armenian",
    Azerbaijani: "Azerbaijani",
    Moldovan: "Moldovan",
    Belarusian: "Belarusian",
    Ukrainian: "Ukrainian",
    Kazakhstani: "Kazakhstani",
  };

  // Well-known leagues that should never be modified
  private protectedLeagues = [
    "UEFA Champions League",
    "UEFA Europa League",
    "UEFA Europa Conference League",
    "FIFA World Cup",
    "UEFA European Championship",
    "Copa América",
    "Africa Cup of Nations",
    "AFC Asian Cup",
    "CONCACAF Gold Cup",
    "AFC Champions League",
    "CONMEBOL Libertadores",
    "CAF Champions League",
    "International Friendlies",
    "Club Friendlies",
    "World Cup Qualification",
    "Euro Qualification",
    "Nations League",
  ];

  // League names that already have clear country context
  private wellNamedLeagues = [
    "Bundesliga", // German is implied
    "La Liga", // Spanish is implied
    "Serie A", // Italian is implied
    "Ligue 1", // French is implied
    "Eredivisie", // Dutch is implied
    "Primeira Liga", // Portuguese is implied
    "Scottish Premiership", // Already has country
    "Major League Soccer", // American is implied
    "J1 League", // Japanese is implied
    "K League 1", // Korean is implied
    "Chinese Super League", // Already has country
    "Indian Super League", // Already has country
    "A-League Men", // Australian is implied
    "English Premier League", // Already has country
    "Russian Premier League", // Already has country
    "Brazilian Serie A", // Already has country
    "Argentine Primera División", // Already has country
  ];

  /**
   * Normalizes friendlies to group them together regardless of country prefix
   */
  private normalizeFriendlies(leagueName: string): string {
    const lowerName = leagueName.toLowerCase().trim();
    
    // ✅ Normalize all "Club Friendlies" variations to just "Club Friendlies"
    // Matches: "Ecuadorian Club Friendlies", "Mexican Club Friendlies", "Colombian Club Friendlies", etc.
    if (lowerName.includes("club friendlies") || lowerName.includes("club friendly")) {
      return "Club Friendlies";
    }
    
    // ✅ Normalize all "International Friendlies" variations
    if (lowerName.includes("international friendlies") || lowerName.includes("international friendly")) {
      return "International Friendlies";
    }
    
    // ✅ Normalize generic "Friendlies" or "Friendly" to "Friendlies"
    if (lowerName === "friendlies" || lowerName === "friendly") {
      return "Friendlies";
    }
    
    return leagueName;
  }

  /**
   * Enhances league names by adding country context to ambiguous names
   */
  enhanceLeagueName(
    leagueName: string,
    teamNames?: string,
    homeTeamName?: string,
    awayTeamName?: string,
  ): LeagueNameContext {
    // Reduced logging - only log for debugging when needed
    // console.log(`🧠 SMART LEAGUE NAME: Processing "${leagueName}"`);

    if (!leagueName) {
      return {
        originalName: leagueName,
        normalizedName: leagueName,
        isAmbiguous: false,
        enhancedName: leagueName,
        confidence: "low",
      };
    }

    // ✅ FIRST: Normalize friendlies to group them together (100% API-driven)
    const normalizedFriendlies = this.normalizeFriendlies(leagueName);
    const cleanName = normalizedFriendlies.trim();

    // Check if this is a protected league that should not be modified
    if (this.isProtectedLeague(cleanName)) {
      // Reduced logging
      // console.log(`🛡️ PROTECTED LEAGUE: "${cleanName}" - no modification needed`);
      return {
        originalName: cleanName,
        normalizedName: cleanName,
        isAmbiguous: false,
        enhancedName: cleanName,
        confidence: "high",
      };
    }

    // First normalize using existing service
    const allTeamNames = [teamNames, homeTeamName, awayTeamName]
      .filter(Boolean)
      .join(" ");

    const normalizedName = leagueNormalizationService.normalizeLeagueName(
      cleanName,
      allTeamNames,
    );

    // Check if this league already has clear country context
    if (this.isWellNamedLeague(cleanName)) {
      // Reduced logging
      // console.log(`✅ WELL-NAMED LEAGUE: "${cleanName}" - already has clear context`);
      return {
        originalName: cleanName,
        normalizedName: normalizedName,
        isAmbiguous: false,
        enhancedName: normalizedName,
        confidence: "high",
      };
    }

    // For ALL leagues (except protected/well-named), try to add country context
    // Reduced logging
    // console.log(`🔍 CHECKING LEAGUE FOR COUNTRY CONTEXT: "${normalizedName}"`);

    // Try to detect country from multiple sources
    let detectedCountry = this.detectCountryFromMultipleSources(
      cleanName,
      normalizedName,
      allTeamNames,
    );

    // Check if the name is specifically ambiguous (needs country)
    const ambiguousPattern = this.findAmbiguousPattern(normalizedName);

    if (detectedCountry) {
      // We have country context - enhance the name
      let enhancedName: string;

      if (ambiguousPattern) {
        // Use pattern-specific enhancement
        enhancedName = this.buildEnhancedName(
          normalizedName,
          detectedCountry,
          ambiguousPattern,
        );
        // Reduced logging
        // console.log(`🎯 PATTERN ENHANCED: "${cleanName}" → "${enhancedName}" (country: ${detectedCountry})`);
      } else {
        // Use general enhancement for any league
        enhancedName = this.buildGeneralEnhancedName(
          normalizedName,
          detectedCountry,
        );
        // Reduced logging
        // console.log(`🌍 COUNTRY ENHANCED: "${cleanName}" → "${enhancedName}" (country: ${detectedCountry})`);
      }

      // ✅ CRITICAL FIX: Ensure "British Premier League" is never returned - normalize to "English Premier League"
      if (enhancedName.toLowerCase().includes("british premier league")) {
        enhancedName = enhancedName.replace(/British Premier League/gi, "English Premier League");
        // Reduced logging
        // console.log(`🔄 FINAL FIX: Replaced "British Premier League" with "English Premier League"`);
      }

      return {
        originalName: cleanName,
        normalizedName: normalizedName,
        countryDetected: detectedCountry,
        isAmbiguous: !!ambiguousPattern,
        enhancedName: enhancedName,
        confidence: "high",
      };
    }

    // No country detected
    if (!ambiguousPattern) {
      // Reduced logging
      // console.log(`✅ CLEAR LEAGUE NAME: "${normalizedName}" - no enhancement needed`);
      return {
        originalName: cleanName,
        normalizedName: normalizedName,
        isAmbiguous: false,
        enhancedName: normalizedName,
        confidence: "medium",
      };
    }

    // Reduced logging
    // console.log(`🚨 AMBIGUOUS LEAGUE DETECTED: "${normalizedName}" matches pattern "${ambiguousPattern.pattern}"`);

    // Use the already detected country for ambiguous patterns
    if (detectedCountry && ambiguousPattern.requiresCountry) {
      const enhancedName = this.buildEnhancedName(
        normalizedName,
        detectedCountry,
        ambiguousPattern,
      );
      // Reduced logging
      // console.log(`🎯 ENHANCED LEAGUE NAME: "${cleanName}" → "${enhancedName}" (country: ${detectedCountry})`);

      // ✅ CRITICAL FIX: Ensure "British Premier League" is never returned - normalize to "English Premier League"
      let finalEnhancedName = enhancedName;
      if (enhancedName.toLowerCase().includes("british premier league")) {
        finalEnhancedName = enhancedName.replace(/British Premier League/gi, "English Premier League");
        // Reduced logging
        // console.log(`🔄 FINAL FIX: Replaced "British Premier League" with "English Premier League"`);
      }

      return {
        originalName: cleanName,
        normalizedName: normalizedName,
        countryDetected: detectedCountry,
        isAmbiguous: true,
        enhancedName: finalEnhancedName,
        confidence: "high",
      };
    }

    // If no country detected but pattern requires it, try fallback strategies
    if (ambiguousPattern.requiresCountry) {
      const fallbackResult = this.handleAmbiguousWithoutCountry(
        cleanName,
        normalizedName,
        ambiguousPattern,
        allTeamNames,
      );

      // Reduced logging
      // console.log(`⚠️ AMBIGUOUS WITHOUT COUNTRY: "${cleanName}" → "${fallbackResult.enhancedName}"`);
      return fallbackResult;
    }

    // Default case
    return {
      originalName: cleanName,
      normalizedName: normalizedName,
      isAmbiguous: true,
      enhancedName: normalizedName,
      confidence: "medium",
    };
  }

  /**
   * Checks if a league name matches known ambiguous patterns
   */
  private findAmbiguousPattern(
    leagueName: string,
  ): AmbiguousLeaguePattern | null {
    const lowerName = leagueName.toLowerCase().trim();

    return (
      this.ambiguousPatterns.find((pattern) =>
        pattern.variations.some(
          (variation) =>
            lowerName === variation.toLowerCase() ||
            lowerName.includes(variation.toLowerCase()),
        ),
      ) || null
    );
  }

  /**
   * Checks if a league is in the protected list from modification
   */
  private isProtectedLeague(leagueName: string): boolean {
    const lowerName = leagueName.toLowerCase().trim();
    return this.protectedLeagues.some(
      (leagueItem) =>
        leagueItem.toLowerCase() === lowerName ||
        lowerName.includes(leagueItem.toLowerCase()),
    );
  }

  /**
   * Checks if a league already has clear country context
   */
  private isWellNamedLeague(leagueName: string): boolean {
    const lowerName = leagueName.toLowerCase().trim();
    return this.wellNamedLeagues.some(
      (leagueItem) =>
        leagueItem.toLowerCase() === lowerName ||
        lowerName.includes(leagueItem.toLowerCase()),
    );
  }

  /**
   * Detects country from multiple sources
   */
  private detectCountryFromMultipleSources(
    originalName: string,
    normalizedName: string,
    teamNames: string,
  ): string | null {
    // Try detecting from original name first
    let country = leagueNormalizationService.detectCountryFromLeague(
      originalName,
      teamNames,
    );
    if (country) {
      // ✅ CRITICAL FIX: Normalize "British" to "English" to prevent "British Premier League"
      if (country === "British" || country.toLowerCase() === "british") {
        country = "English";
        // Reduced logging
        // console.log(`🔄 NORMALIZED: "British" → "English"`);
      }
      // Reduced logging
      // console.log(`🌍 COUNTRY FROM ORIGINAL: ${country}`);
      return country;
    }

    // Try detecting from normalized name
    country = leagueNormalizationService.detectCountryFromLeague(
      normalizedName,
      teamNames,
    );
    if (country) {
      // ✅ CRITICAL FIX: Normalize "British" to "English" to prevent "British Premier League"
      if (country === "British" || country.toLowerCase() === "british") {
        country = "English";
        // Reduced logging
        // console.log(`🔄 NORMALIZED: "British" → "English"`);
      }
      // Reduced logging
      // console.log(`🌍 COUNTRY FROM NORMALIZED: ${country}`);
      return country;
    }

    // Try detecting from team names only
    if (teamNames) {
      country = leagueNormalizationService.detectCountryFromLeague(
        "",
        teamNames,
      );
      if (country) {
        // Reduced logging
        // console.log(`🌍 COUNTRY FROM TEAMS: ${country}`);
        return country;
      }
    }

    // Reduced logging
    // console.log(`🌍 NO COUNTRY DETECTED for "${originalName}"`);
    return null;
  }

  /**
   * Builds enhanced name with country prefix
   */
  private buildEnhancedName(
    leagueName: string,
    country: string,
    pattern: AmbiguousLeaguePattern,
  ): string {
    const countryPrefix = this.countryPrefixMappings[country] || country;

    // Special handling for Premier League variations
    if (pattern.pattern === "premier league") {
      if (country === "English") {
        return "English Premier League";
      }
      return `${countryPrefix} Premier League`;
    }

    // Special handling for divisions
    if (pattern.pattern.includes("division")) {
      return `${countryPrefix} ${this.capitalizeFirst(pattern.pattern)}`;
    }

    // Special handling for specific leagues
    if (pattern.pattern === "ekstraklasa") {
      return `${countryPrefix} Ekstraklasa`;
    }

    if (pattern.pattern === "liga") {
      return `${countryPrefix} Liga`;
    }

    // Default pattern
    return `${countryPrefix} ${this.capitalizeFirst(leagueName)}`;
  }

  /**
   * Builds general enhanced name for any league with country context
   */
  private buildGeneralEnhancedName(
    leagueName: string,
    country: string,
  ): string {
    const countryPrefix = this.countryPrefixMappings[country] || country;

    // Handle long league names by shortening them intelligently
    let processedName = this.shortenLongLeagueName(leagueName);

    // Avoid duplicate country names
    if (
      processedName.toLowerCase().includes(country.toLowerCase()) ||
      processedName.toLowerCase().includes(countryPrefix.toLowerCase())
    ) {
      return processedName;
    }

    return `${countryPrefix} ${processedName}`;
  }

  /**
   * Shortens long league names intelligently while preserving meaning
   */
  private shortenLongLeagueName(leagueName: string): string {
    let name = leagueName.trim();

    // Handle specific long name patterns
    if (name.includes("Tercera División") && name.includes("Group")) {
      // "Tercera División Rfef - Group 11" → "3rd Division Grp 11"
      return name
        .replace("Tercera División", "3rd Division")
        .replace("Group", "Grp")
        .replace(" - ", " ");
    }

    if (name.includes("Segunda División") && name.includes("Group")) {
      return name
        .replace("Segunda División", "2nd Division")
        .replace("Group", "Grp")
        .replace(" - ", " ");
    }

    if (name.includes("Primera División") && name.includes("Group")) {
      return name
        .replace("Primera División", "1st Division")
        .replace("Group", "Grp")
        .replace(" - ", " ");
    }

    // General shortening rules
    name = name.replace(/\bDivisión\b/g, "Division");
    name = name.replace(/\bChampionship\b/g, "Champ");
    name = name.replace(/\bQualification\b/g, "Qual");
    name = name.replace(/\bFederación\b/g, "Fed");
    name = name.replace(/\b - Group\b/g, " Grp");
    name = name.replace(/\b- Group\b/g, " Grp");

    // If still too long (over 25 characters), truncate intelligently
    if (name.length > 25) {
      // Try to keep the most important parts
      const words = name.split(" ");
      if (words.length > 3) {
        name = words.slice(0, 3).join(" ") + "...";
      }
    }

    return name;
  }

  /**
   * Handles ambiguous leagues when no country can be detected
   */
  private handleAmbiguousWithoutCountry(
    originalName: string,
    normalizedName: string,
    pattern: AmbiguousLeaguePattern,
    teamNames: string,
  ): LeagueNameContext {
    // For Premier League without country, default to generic but clear name
    if (pattern.pattern === "premier league") {
      // If we have team context, try one more aggressive detection
      if (teamNames) {
        const aggressiveCountry = this.aggressiveCountryDetection(teamNames);
        if (aggressiveCountry) {
          const enhancedName =
            aggressiveCountry === "English"
              ? "English Premier League"
              : `${aggressiveCountry} Premier League`;

          return {
            originalName: originalName,
            normalizedName: normalizedName,
            countryDetected: aggressiveCountry,
            isAmbiguous: true,
            enhancedName: enhancedName,
            confidence: "medium",
          };
        }
      }

      // Default to "Premier League (Country TBD)" or just "Premier League"
      return {
        originalName: originalName,
        normalizedName: normalizedName,
        isAmbiguous: true,
        enhancedName: "Premier League",
        confidence: "low",
      };
    }

    // For other ambiguous patterns, use fallback name
    const fallbackName = pattern.fallbackName || normalizedName;
    return {
      originalName: originalName,
      normalizedName: normalizedName,
      isAmbiguous: true,
      enhancedName: fallbackName,
      confidence: "low",
    };
  }

  /**
   * More aggressive country detection based on common team name patterns
   */
  private aggressiveCountryDetection(teamNames: string): string | null {
    const lowerTeams = teamNames.toLowerCase();

    // English indicators
    if (
      lowerTeams.match(
        /\b(manchester|liverpool|chelsea|arsenal|tottenham|everton|leicester|brighton|crystal palace|west ham|aston villa|newcastle|wolves|leeds|burnley|watford|norwich|southampton|brentford|fulham|sheffield|blackburn|preston|millwall|reading|cardiff|swansea|bristol|bolton|wigan|oldham|stockport|crewe|carlisle|barrow|hartlepool|grimsby|scunthorpe|doncaster|rotherham|wycombe|port vale|exeter|plymouth|torquay|yeovil|dag & red|dagenham)\b/,
      )
    ) {
      return "English";
    }

    // More specific patterns for other countries
    const patterns: { [key: string]: RegExp } = {
      Russian:
        /\b(cska moscow|spartak moscow|dynamo moscow|lokomotiv moscow|zenit|rubin kazan|rostov|krasnodar|akhmat|arsenal tula|tambov|orenberg|khimki|ural|sochi)\b/,
      Nigerian:
        /\b(rivers united|enyimba|kano pillars|plateau united|akwa united|lobi stars|wikki tourists|niger tornadoes|heartland|sunshine stars)\b/,
      "South African":
        /\b(kaizer chiefs|orlando pirates|mamelodi sundowns|supersport united|bidvest wits|cape town city|golden arrows|baroka|black leopards|polokwane city)\b/,
      Brazilian:
        /\b(flamengo|corinthians|palmeiras|santos|sao paulo|vasco|botafogo|fluminense|gremio|internacional|cruzeiro|atletico mineiro|bahia|ceara|fortaleza)\b/,
      Japanese:
        /\b(kashima antlers|urawa reds|gamba osaka|fc tokyo|yokohama|kawasaki frontale|nagoya grampus|cerezo osaka|vissel kobe|sagan tosu|shonan bellmare|shimizu s-pulse)\b/,
      Korean:
        /\b(jeonbuk motors|ulsan hyundai|suwon samsung|seoul fc|pohang steelers|daegu fc|gwangju fc|gangwon fc|seongnam fc|incheon united)\b/,
      Ugandan:
        /\b(kcca|sc villa|express|vipers|bul|bright stars|wakiso giants|onduparaka|mbarara city|tooro united|kyetume|proline|police|maroons)\b/,
      Polish:
        /\b(legia warsaw|wisla krakow|lech poznan|cracovia|pogon szczecin|slask wroclaw|jagiellonia|gornik zabrze|piast gliwice)\b/,
      Ukrainian:
        /\b(dynamo kyiv|shakhtar donetsk|zorya luhansk|olimpik donetsk|metalist kharkiv|chornomorets odesa|karpaty lviv)\b/,
      Spanish:
        /\b(real madrid|barcelona|atletico madrid|valencia|sevilla|real sociedad|athletic bilbao|villarreal|betis|espanyol)\b/,
      Croatian:
        /\b(dinamo zagreb|hajduk split|rijeka|osijek|lokomotiva|inter zapresic|slaven belupo|istra|gorica)\b/,
    };

    for (const [country, pattern] of Object.entries(patterns)) {
      if (pattern.test(lowerTeams)) {
        // Reduced logging
        // console.log(
        //   `🎯 AGGRESSIVE COUNTRY DETECTION: Found ${country} from teams`,
        // );
        return country;
      }
    }

    return null;
  }

  /**
   * Capitalizes first letter of each word
   */
  private capitalizeFirst(text: string): string {
    return text
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }

  /**
   * Batch process multiple league names
   */
  enhanceMultipleLeagueNames(
    leagues: Array<{
      name: string;
      teamNames?: string;
      homeTeamName?: string;
      awayTeamName?: string;
    }>,
  ): LeagueNameContext[] {
    return leagues.map((league) =>
      this.enhanceLeagueName(
        league.name,
        league.teamNames,
        league.homeTeamName,
        league.awayTeamName,
      ),
    );
  }

  /**
   * Get statistics about league name enhancements
   */
  getEnhancementStats(contexts: LeagueNameContext[]): {
    total: number;
    enhanced: number;
    ambiguous: number;
    withCountry: number;
    highConfidence: number;
    mediumConfidence: number;
    lowConfidence: number;
  } {
    return {
      total: contexts.length,
      enhanced: contexts.filter((c) => c.enhancedName !== c.originalName)
        .length,
      ambiguous: contexts.filter((c) => c.isAmbiguous).length,
      withCountry: contexts.filter((c) => c.countryDetected).length,
      highConfidence: contexts.filter((c) => c.confidence === "high").length,
      mediumConfidence: contexts.filter((c) => c.confidence === "medium")
        .length,
      lowConfidence: contexts.filter((c) => c.confidence === "low").length,
    };
  }
}

// Export singleton instance
const smartLeagueNameService = new SmartLeagueNameService();
export default smartLeagueNameService;
