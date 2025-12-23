// Premier League normalization service to handle country-specific leagues

interface LeagueMapping {
  originalName: string;
  normalizedName: string;
  country: string;
  aliases: string[];
}

class LeagueNormalizationService {
  private premierLeagueMappings: LeagueMapping[] = [
    // English Premier League
    {
      originalName: "Premier League",
      normalizedName: "English PL",
      country: "England",
      aliases: [
        "EPL",
        "English Premier League",
        "Premier League (England)",
        "England Premier League",
      ],
    },
    {
      originalName: "EPL",
      normalizedName: "English PL",
      country: "England",
      aliases: [
        "Premier League",
        "English Premier League",
        "England Premier League",
      ],
    },
    {
      originalName: "English Premier League",
      normalizedName: "English PL",
      country: "England",
      aliases: ["Premier League", "EPL", "England Premier League"],
    },

    // Ugandan Premier League
    {
      originalName: "Uganda Premier League",
      normalizedName: "Ugandan PL",
      country: "Uganda",
      aliases: ["UPL", "FUFA Super League", "Startimes Uganda Premier League"],
    },
    {
      originalName: "UPL",
      normalizedName: "Ugandan PL",
      country: "Uganda",
      aliases: ["Uganda Premier League", "FUFA Super League"],
    },
    {
      originalName: "FUFA Super League",
      normalizedName: "Ugandan PL",
      country: "Uganda",
      aliases: ["Uganda Premier League", "UPL"],
    },

    // Russian Premier League
    {
      originalName: "Russian Premier League",
      normalizedName: "Russian PL",
      country: "Russia",
      aliases: ["RPL", "Russia Premier League"],
    },

    // Other Premier Leagues
    {
      originalName: "Kazakh Premier League",
      normalizedName: "Kazakh PL",
      country: "Kazakhstan",
      aliases: ["Kazakhstan Premier League"],
    },
    {
      originalName: "Bangladesh Premier League",
      normalizedName: "Bangladesh PL",
      country: "Bangladesh",
      aliases: ["BPL"],
    },
    {
      originalName: "Chinese Super League",
      normalizedName: "Chinese PL",
      country: "China",
      aliases: ["CSL", "China Premier League"],
    },
    {
      originalName: "Indian Super League",
      normalizedName: "Indian PL",
      country: "India",
      aliases: ["ISL", "India Premier League"],
    },

    // NEW: Asian Premier Leagues (to prevent English PL mislabeling)
    {
      originalName: "Bhutan Premier League",
      normalizedName: "Bhutanese PL",
      country: "Bhutan",
      aliases: ["BPL Bhutan", "Bhutan PL", "Bhutanese Premier League"],
    },
    {
      originalName: "Nepal Premier League",
      normalizedName: "Nepalese PL",
      country: "Nepal",
      aliases: ["NPL", "Nepal PL"],
    },

    // ✅ CRITICAL: African Premier Leagues using "PL" format consistently
    {
      originalName: "Zimbabwe Premier League",
      normalizedName: "Zimbabwean PL",
      country: "Zimbabwe",
      aliases: ["Zimbabwean Premier League", "Zimbabwe PL", "ZPL"],
    },
    {
      originalName: "Zimbabwean Premier League",
      normalizedName: "Zimbabwean PL",
      country: "Zimbabwe",
      aliases: ["Zimbabwe Premier League", "Zimbabwe PL", "ZPL"],
    },
    {
      originalName: "Premier Soccer League",
      normalizedName: "South African PL",
      country: "South Africa",
      aliases: ["PSL South Africa", "South African Premier Soccer League"],
    },
    {
      originalName: "South African Premier League",
      normalizedName: "South African PL",
      country: "South Africa",
      aliases: ["PSL South Africa", "South African PSL"],
    },
    {
      originalName: "Sri Lankan Premier League",
      normalizedName: "Sri Lankan PL",
      country: "Sri Lanka",
      aliases: ["SLPL", "Sri Lanka Premier League"],
    },
    {
      originalName: "Thai Premier League",
      normalizedName: "Thai PL",
      country: "Thailand",
      aliases: ["TPL", "Thailand Premier League"],
    },
    {
      originalName: "Malaysian Premier League",
      normalizedName: "Malaysian PL",
      country: "Malaysia",
      aliases: ["MPL", "Malaysia Premier League"],
    },
    {
      originalName: "Indonesian Premier League",
      normalizedName: "Indonesian PL",
      country: "Indonesia",
      aliases: ["IPL Indonesia", "Indonesia Premier League"],
    },
    {
      originalName: "Australian A-League",
      normalizedName: "Australian PL",
      country: "Australia",
      aliases: ["A-League", "Australia Premier League"],
    },
  ];

  private otherLeagueMappings: LeagueMapping[] = [
    // Champions League variants
    {
      originalName: "UEFA Champions League",
      normalizedName: "Champions League",
      country: "Europe",
      aliases: ["Champions League", "UCL", "European Cup"],
    },
    {
      originalName: "Champions League",
      normalizedName: "Champions League",
      country: "Europe",
      aliases: ["UEFA Champions League", "UCL"],
    },

    // La Liga variants
    {
      originalName: "La Liga",
      normalizedName: "Spanish La Liga",
      country: "Spain",
      aliases: ["Primera División", "Spanish First Division"],
    },

    // Bundesliga variants
    {
      originalName: "Bundesliga",
      normalizedName: "German Bundesliga",
      country: "Germany",
      aliases: ["German First Division", "1. Bundesliga"],
    },

    // Serie A variants
    {
      originalName: "Serie A",
      normalizedName: "Italian Serie A",
      country: "Italy",
      aliases: ["Italian First Division", "Serie A TIM"],
    },

    // Ligue 1 variants
    {
      originalName: "Ligue 1",
      normalizedName: "French Ligue 1",
      country: "France",
      aliases: ["French First Division", "Ligue 1 Uber Eats"],
    },
  ];

  private allMappings: LeagueMapping[];

  constructor() {
    this.allMappings = [
      ...this.premierLeagueMappings,
      ...this.otherLeagueMappings,
    ];
  }

  // Normalize a league name to include country prefix
  normalizeLeagueName(leagueName: string, teamNames?: string): string {
    // ✅ CRITICAL FIX: Handle undefined/null league names safely
    if (!leagueName || typeof leagueName !== 'string') {
      console.warn(`⚠️ normalizeLeagueName received invalid input:`, leagueName);
      return "Unknown League"; // Safe fallback
    }

    const cleanName = leagueName.trim();
    const lowerName = cleanName.toLowerCase();
    // Reduced logging to prevent console spam (1250+ matches logging per load)
    // console.log(
    //   `🔍 NORMALIZING LEAGUE: "${leagueName}" → cleaned: "${cleanName}"`,
    // );

    // ✅ CRITICAL: Handle "Premier L" and "Premier Soccer" variations FIRST
    if (
      (lowerName.includes("premier l") &&
        !lowerName.includes("premier league")) ||
      lowerName.includes("premier soccer")
    ) {
      const detectedCountry = this.detectCountryFromLeague(
        leagueName,
        teamNames,
      );
      if (detectedCountry) {
        const fixedName = `${detectedCountry} PL`;
        // Reduced logging
        // console.log(
        //   `🚨 PREMIER VARIANT FIX: "${leagueName}" → "${fixedName}" (country: ${detectedCountry})`,
        // );
        return fixedName;
      } else {
        // Force to "Premier League" format to avoid truncated names
        // Reduced logging
        // console.log(
        //   `🚨 PREMIER VARIANT NO COUNTRY: "${leagueName}" - converting to "Premier League"`,
        // );
        return "Premier League";
      }
    }

    // ✅ CRITICAL: Handle "Premier Soccer League" specifically FIRST - ALWAYS detect country
    if (lowerName.includes("premier soccer league")) {
      const detectedCountry = this.detectCountryFromLeague(
        leagueName,
        teamNames,
      );
      if (detectedCountry) {
        const countryPL = `${detectedCountry} PL`;
        // Reduced logging
        // console.log(
        //   `🚨 PSL COUNTRY FIX: "${leagueName}" → "${countryPL}" (detected: ${detectedCountry})`,
        // );
        return countryPL;
      } else {
        // If no country detected, force to generic Premier League to avoid "Premier Soccer PL"
        // Reduced logging
        // console.log(
        //   `🚨 PSL NO COUNTRY: "${leagueName}" - converting to "Premier League"`,
        // );
        return "Premier League";
      }
    }

    // ✅ ENHANCED: Handle friendlies first for clarity
    const friendlyResult = this.normalizeFriendlyMatches(cleanName);
    if (friendlyResult) {
      // Reduced logging
      // console.log(
      //   `🤝 FRIENDLY NORMALIZED: "${leagueName}" → "${friendlyResult}"`,
      // );
      return friendlyResult;
    }

    // ✅ ENHANCED: Handle divisions with country context (FIXED - no more generic "1. Division")
    const divisionResult = this.normalizeDivisionNames(cleanName, teamNames);
    if (divisionResult) {
      // Reduced logging
      // console.log(
      //   `🏆 DIVISION NORMALIZED: "${leagueName}" → "${divisionResult}"`,
      // );
      return divisionResult;
    }

    // Check for direct mapping
    const directMapping = this.allMappings.find(
      (mapping) =>
        mapping.originalName.toLowerCase() === cleanName.toLowerCase(),
    );

    if (directMapping) {
      // Reduced logging
      // console.log(
      //   `🏆 LEAGUE NORMALIZED (direct): "${leagueName}" → "${directMapping.normalizedName}"`,
      // );
      return directMapping.normalizedName;
    }

    // Check for alias matching
    const aliasMapping = this.allMappings.find((mapping) =>
      mapping.aliases.some(
        (alias) => alias.toLowerCase() === cleanName.toLowerCase(),
      ),
    );

    if (aliasMapping) {
      // Reduced logging
      // console.log(
      //   `🏆 LEAGUE NORMALIZED (alias): "${leagueName}" → "${aliasMapping.normalizedName}"`,
      // );
      return aliasMapping.normalizedName;
    }

    // ✅ FIXED: Only apply Premier League detection to leagues that actually contain "premier"
    if (cleanName.toLowerCase().includes("premier")) {
      // Reduced logging
      // console.log(
      //   `🔍 PREMIER LEAGUE DETECTED: "${leagueName}" - detecting country...`,
      // );
      const detectedCountry = this.detectCountryFromLeague(
        cleanName,
        teamNames,
      );
      if (detectedCountry) {
        const normalizedName = `${detectedCountry} PL`;
        // Reduced logging
        // console.log(
        //   `✅ COUNTRY DETECTED: "${leagueName}" → "${normalizedName}" (country: ${detectedCountry})`,
        // );
        return normalizedName;
      } else {
        // Reduced logging
        // console.log(
        //   `⚠️ NO COUNTRY DETECTED: "${leagueName}" - keeping original name to prevent English PL mislabeling`,
        // );
        return cleanName;
      }
    }

    // ✅ ENHANCED: Make league names clearer with country context, preserve API data
    const result = this.makeLeagueNameClear(cleanName, teamNames);
    // Reduced logging - too verbose
    // console.log(`🏆 FINAL NORMALIZATION: "${leagueName}" → "${result}"`);
    return result;
  }

  // ✅ NEW: Normalize friendly matches for clarity
  private normalizeFriendlyMatches(leagueName: string): string | null {
    const lowerName = leagueName.toLowerCase();

    // International friendlies
    if (lowerName.includes("international") && lowerName.includes("friendly")) {
      return "Int Friendlies";
    }

    if (
      lowerName.includes("friendly") &&
      (lowerName.includes("national") ||
        lowerName.includes("country") ||
        lowerName.includes("international"))
    ) {
      return "Int Friendlies";
    }

    // Club friendlies
    if (lowerName.includes("friendly") && lowerName.includes("club")) {
      return "Club Friendlies";
    }

    if (lowerName.includes("friendlies") && lowerName.includes("club")) {
      return "Club Friendlies";
    }

    // Generic friendlies
    if (lowerName === "friendlies" || lowerName === "friendly") {
      return "Club Friendlies";
    }

    return null;
  }

  // ✅ FIXED: Normalize division names WITH COUNTRY CONTEXT (no more generic "1. Division")
  private normalizeDivisionNames(
    leagueName: string,
    teamNames?: string,
  ): string | null {
    const lowerName = leagueName.toLowerCase();

    // ✅ CRITICAL: Don't create generic division names - add country context instead

    // Handle numbered divisions WITH country detection
    if (
      lowerName.match(/^(\d+)\.?\s*division/) ||
      lowerName.includes("division")
    ) {
      // Reduced logging
      // console.log(`📋 DIVISION DETECTED: "${leagueName}" - detecting country...`);

      // Try to detect country from team names or league context
      const detectedCountry = this.detectCountryFromLeague(
        leagueName,
        teamNames,
      );

      if (detectedCountry) {
        const match = lowerName.match(/^(\d+)\.?\s*division/);
        if (match) {
          const number = match[1];
          const divisionName = `${detectedCountry} Division ${number}`;
          // Reduced logging
          // console.log(`✅ DIVISION WITH COUNTRY: "${leagueName}" → "${divisionName}"`);
          return divisionName;
        } else {
          // Just "division" without number
          const divisionName = `${detectedCountry} Division`;
          // Reduced logging
          // console.log(`✅ DIVISION WITH COUNTRY: "${leagueName}" → "${divisionName}"`);
          return divisionName;
        }
      } else {
        // ✅ CRITICAL: If we can't detect country, create a meaningful name anyway
        // Reduced logging
        // console.log(`⚠️ DIVISION WITHOUT COUNTRY: "${leagueName}" - creating generic but meaningful name`);
        const match = lowerName.match(/^(\d+)\.?\s*division/);
        if (match) {
          const number = match[1];
          return `Division ${number}`; // At least remove the "1." format and make it readable
        } else {
          return `Division League`; // Generic but better than "1. Division"
        }
      }
    }

    // Handle specific division patterns with country context
    if (lowerName.includes("primera") && lowerName.includes("division")) {
      const detectedCountry = this.detectCountryFromLeague(
        leagueName,
        teamNames,
      );
      return detectedCountry ? `${detectedCountry} First Division` : null;
    }

    if (lowerName.includes("segunda") && lowerName.includes("division")) {
      const detectedCountry = this.detectCountryFromLeague(
        leagueName,
        teamNames,
      );
      return detectedCountry ? `${detectedCountry} Second Division` : null;
    }

    return null;
  }

  // ✅ FIXED: Make league names clearer WITHOUT destroying country context
  private makeLeagueNameClear(leagueName: string, teamNames?: string): string {
    const lowerName = leagueName.toLowerCase();

    // ✅ CRITICAL: Handle "Premier L" and "Premier Soccer" variations
    if (
      (lowerName.includes("premier l") &&
        !lowerName.includes("premier league")) ||
      lowerName.includes("premier soccer")
    ) {
      const detectedCountry = this.detectCountryFromLeague(
        leagueName,
        teamNames,
      );
      if (detectedCountry) {
        const fixedName = `${detectedCountry} PL`;
        // Reduced logging
        // console.log(
        //   `🚨 PREMIER VARIANT FIX: "${leagueName}" → "${fixedName}" (country: ${detectedCountry})`,
        // );
        return fixedName;
      } else {
        // Force to "Premier League" format to avoid truncated names
        // Reduced logging
        // console.log(
        //   `🚨 PREMIER VARIANT NO COUNTRY: "${leagueName}" - converting to "Premier League"`,
        // );
        return "Premier League";
      }
    }

    // ✅ CRITICAL: Handle "Premier Soccer League" specifically - ALWAYS detect country
    if (lowerName.includes("premier soccer league")) {
      const detectedCountry = this.detectCountryFromLeague(
        leagueName,
        teamNames,
      );
      if (detectedCountry) {
        const countryPL = `${detectedCountry} PL`;
        // Reduced logging
        // console.log(
        //   `🚨 PSL COUNTRY FIX: "${leagueName}" → "${countryPL}" (detected: ${detectedCountry})`,
        // );
        return countryPL;
      } else {
        // If no country detected, force to generic Premier League to avoid "Premier Soccer PL"
        // Reduced logging
        // console.log(
        //   `🚨 PSL NO COUNTRY: "${leagueName}" - converting to "Premier League"`,
        // );
        return "Premier League";
      }
    }

    // ✅ CRITICAL: REMOVED all generic division mappings that lose country context
    // OLD BAD BEHAVIOR: '1. division': 'First Division' - TERRIBLE!
    // NEW BEHAVIOR: Preserve original names or add country context

    // Handle ONLY well-known international leagues that don't need country context
    const internationalLeagues: { [key: string]: string } = {
      "serie a": "Serie A",
      "serie b": "Serie B",
      "ligue 1": "Ligue 1",
      "ligue 2": "Ligue 2",
      bundesliga: "Bundesliga",
      "la liga": "La Liga",
      eredivisie: "Eredivisie",
      "primeira liga": "Primeira Liga",
      championship: "Championship",
      "league one": "League One",
      "league two": "League Two",
    };

    // Check for well-known international leagues
    if (internationalLeagues[lowerName]) {
      // Reduced logging
      // console.log(`🌍 INTERNATIONAL LEAGUE: "${leagueName}" → "${internationalLeagues[lowerName]}"`);
      return internationalLeagues[lowerName];
    }

    // ✅ NEW: For division-like names, try to add country context or preserve original
    if (
      lowerName.includes("division") ||
      lowerName.includes("super") ||
      lowerName.includes("league")
    ) {
      const detectedCountry = this.detectCountryFromLeague(
        leagueName,
        teamNames,
      );

      if (
        detectedCountry &&
        !leagueName.toLowerCase().includes(detectedCountry.toLowerCase())
      ) {
        // Add country prefix if not already present
        const enhancedName = `${detectedCountry} ${this.capitalizeLeagueName(leagueName)}`;
        // Reduced logging
        // console.log(`🎯 ENHANCED LEAGUE: "${leagueName}" → "${enhancedName}"`);
        return enhancedName;
      }
    }

    // ✅ CRITICAL: Default to properly capitalized ORIGINAL name to preserve API data
    const capitalizedOriginal = this.capitalizeLeagueName(leagueName);
    // Reduced logging
    // console.log(`📋 PRESERVED ORIGINAL: "${leagueName}" → "${capitalizedOriginal}"`);
    return capitalizedOriginal;
  }

  // ✅ NEW: Proper capitalization for league names
  private capitalizeLeagueName(leagueName: string): string {
    return leagueName
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }

  // ✅ NEW: Enhanced country detection from league names
  detectCountryFromLeague(
    leagueName: string,
    teamNames?: string,
  ): string | null {
    const lowerName = leagueName.toLowerCase();
    // Reduced logging
    // console.log(`🌍 DETECTING COUNTRY: league="${lowerName}", teams="${teamNames || "none"}"`);

    // Country detection with multiple variants
    const countryMappings: { [key: string]: string[] } = {
      English: ["england", "english", "britain", "british", "epl"],
      Russian: ["russia", "russian"],
      Chinese: ["china", "chinese"],
      Indian: ["india", "indian"],
      Kazakhstani: [
        "kazakhstan",
        "kazakh",
        "kazakhstani",
        "akademiya ontustik",
        "kaspiy",
        "irtysh",
        "akzhayik",
        "ordabasy",
        "tobol",
      ],
      Bangladeshi: [
        "bangladesh",
        "bangladeshi",
        "dhaka",
        "chittagong",
        "sylhet",
      ],
      Nigerian: [
        "nigeria",
        "nigerian",
        "lagos",
        "abuja",
        "kano",
        "enugu",
        "rivers united",
        "enyimba",
      ],
      "South African": [
        "south africa",
        "south african",
        "kaizer chiefs",
        "orlando pirates",
        "mamelodi sundowns",
        "cape town",
      ],
      Ghanaian: [
        "ghana",
        "ghanaian",
        "hearts of oak",
        "asante kotoko",
        "accra",
        "kumasi",
      ],
      Kenyan: [
        "kenya",
        "kenyan",
        "gor mahia",
        "afc leopards",
        "nairobi",
        "mombasa",
      ],
      Ethiopian: ["ethiopia", "ethiopian", "addis ababa", "dire dawa"],
      Egyptian: [
        "egypt",
        "egyptian",
        "al ahly",
        "zamalek",
        "cairo",
        "alexandria",
      ],
      Moroccan: ["morocco", "moroccan", "raja", "wydad", "casablanca", "rabat"],
      Tunisian: ["tunisia", "tunisian", "esperance", "club africain", "tunis"],
      Algerian: ["algeria", "algerian", "mc alger", "usm alger", "algiers"],
      Ugandan: [
        "uganda",
        "ugandan",
        "fufa",
        "kampala",
        "sc villa",
        "kcca",
        "express",
      ],
      Tanzanian: [
        "tanzania",
        "tanzanian",
        "simba",
        "young africans",
        "dar es salaam",
      ],
      Zimbabwean: [
        "zimbabwe",
        "zimbabwean",
        "dynamos",
        "caps united",
        "harare",
        "highlanders",
        "triangle united",
        "triangle",
        "manica diamonds",
        "manica",
        "chicken inn",
        "ngezi platinum",
        "black rhinos",
        "bulawayo",
        "bikita",
        "scotland",
      ],
      Zambian: ["zambia", "zambian", "power dynamos", "zanaco", "lusaka"],
      Brazilian: [
        "brazil",
        "brazilian",
        "sao paulo",
        "flamengo",
        "corinthians",
        "palmeiras",
        "santos",
      ],
      Argentine: [
        "argentina",
        "argentine",
        "boca juniors",
        "river plate",
        "racing",
        "independiente",
      ],
      Chilean: ["chile", "chilean", "colo colo", "universidad", "santiago"],
      Colombian: [
        "colombia",
        "colombian",
        "millonarios",
        "nacional",
        "bogota",
        "medellin",
      ],
      Mexican: ["mexico", "mexican", "america", "chivas", "cruz azul", "pumas"],
      Uruguayan: ["uruguay", "uruguayan", "penarol", "nacional", "montevideo"],
      Paraguayan: [
        "paraguay",
        "paraguayan",
        "olimpia",
        "cerro porteno",
        "asuncion",
      ],
      Bolivian: ["bolivia", "bolivian", "strongest", "bolivar", "la paz"],
      Peruvian: ["peru", "peruvian", "universitario", "alianza lima", "lima"],
      Ecuadorian: [
        "ecuador",
        "ecuadorian",
        "barcelona",
        "emelec",
        "quito",
        "guayaquil",
      ],
      Japanese: [
        "japan",
        "japanese",
        "kashima",
        "urawa",
        "tokyo",
        "osaka",
        "yokohama",
      ],
      Korean: ["korea", "korean", "seoul", "jeonbuk", "ulsan", "suwon"],
      Thai: [
        "thailand",
        "thai",
        "bangkok",
        "buriram",
        "chonburi",
        "muangthong",
      ],
      Vietnamese: ["vietnam", "vietnamese", "hanoi", "ho chi minh", "saigon"],
      Malaysian: ["malaysia", "malaysian", "kuala lumpur", "selangor", "johor"],
      Indonesian: [
        "indonesia",
        "indonesian",
        "persija",
        "persib",
        "jakarta",
        "bandung",
      ],
      Filipino: ["philippines", "filipino", "manila", "cebu", "davao"],
      Singaporean: ["singapore", "singaporean"],
      Cambodian: ["cambodia", "cambodian", "phnom penh"],
      Laotian: ["laos", "laotian", "vientiane"],
      // COMPREHENSIVE EUROPEAN COUNTRIES
      Spanish: [
        "spain",
        "spanish",
        "espanyol",
        "madrid",
        "barcelona",
        "valencia",
        "sevilla",
        "atletico",
        "real madrid",
        "athletic bilbao",
        "villarreal",
        "betis",
        "getafe",
        "osasuna",
        "tercera",
        "segunda",
        "primera",
      ],
      Polish: [
        "poland",
        "polish",
        "ekstraklasa",
        "legia",
        "wisla",
        "lech",
        "cracovia",
        "pogon",
        "slask",
        "jagiellonia",
        "gornik",
        "piast",
        "warsaw",
        "krakow",
        "poznan",
        "szczecin",
        "wroclaw",
        "bialystok",
        "zabrze",
        "gliwice",
      ],
      Ukrainian: [
        "ukraine",
        "ukrainian",
        "dynamo",
        "shakhtar",
        "zorya",
        "olimpik",
        "metalist",
        "chornomorets",
        "karpaty",
        "kyiv",
        "kiev",
        "donetsk",
        "luhansk",
        "kharkiv",
        "odesa",
        "lviv",
        "druha liga",
        "persha liga",
      ],
      Croatian: [
        "croatia",
        "croatian",
        "dinamo zagreb",
        "hajduk split",
        "rijeka",
        "osijek",
        "lokomotiva",
        "inter zapresic",
        "slaven belupo",
        "istra",
        "gorica",
        "zagreb",
        "split",
        "prva hnl",
      ],
      German: [
        "germany",
        "german",
        "bayern",
        "dortmund",
        "schalke",
        "hamburg",
        "werder",
        "stuttgart",
        "frankfurt",
        "koln",
        "gladbach",
        "berlin",
        "munich",
        "bundesliga",
      ],
      Italian: [
        "italy",
        "italian",
        "juventus",
        "milan",
        "inter",
        "napoli",
        "roma",
        "lazio",
        "atalanta",
        "fiorentina",
        "torino",
        "serie a",
        "serie b",
      ],
      French: [
        "france",
        "french",
        "psg",
        "marseille",
        "lyon",
        "monaco",
        "lille",
        "rennes",
        "strasbourg",
        "bordeaux",
        "toulouse",
        "ligue 1",
        "ligue 2",
      ],
      Dutch: [
        "netherlands",
        "dutch",
        "ajax",
        "psv",
        "feyenoord",
        "az",
        "fc utrecht",
        "groningen",
        "vitesse",
        "heerenveen",
        "amsterdam",
        "eindhoven",
        "rotterdam",
        "eredivisie",
      ],
      Portuguese: [
        "portugal",
        "portuguese",
        "benfica",
        "porto",
        "sporting",
        "braga",
        "vitoria",
        "boavista",
        "maritimo",
        "primeira liga",
      ],
      Turkish: [
        "turkey",
        "turkish",
        "galatasaray",
        "fenerbahce",
        "besiktas",
        "trabzonspor",
        "istanbul",
        "ankara",
        "izmir",
        "super lig",
      ],
      Greek: [
        "greece",
        "greek",
        "olympiacos",
        "panathinaikos",
        "aek",
        "paok",
        "aris",
        "athens",
        "thessaloniki",
        "super league",
      ],
      Belgian: [
        "belgium",
        "belgian",
        "anderlecht",
        "club brugge",
        "standard liege",
        "genk",
        "gent",
        "antwerp",
        "brussels",
        "pro league",
      ],
      Swiss: [
        "switzerland",
        "swiss",
        "basel",
        "young boys",
        "zurich",
        "grasshoppers",
        "st gallen",
        "lugano",
        "super league",
      ],
      Austrian: [
        "austria",
        "austrian",
        "salzburg",
        "rapid wien",
        "austria wien",
        "sturm graz",
        "linz",
        "innsbruck",
        "bundesliga",
      ],
      Czech: [
        "czech",
        "czechia",
        "sparta prague",
        "slavia prague",
        "viktoria plzen",
        "banik ostrava",
        "mlada boleslav",
        "prague",
        "plzen",
        "fortuna liga",
      ],
      Slovak: [
        "slovakia",
        "slovak",
        "slovan bratislava",
        "spartak trnava",
        "zilina",
        "dunajska streda",
        "bratislava",
        "fortuna liga",
      ],
      Hungarian: [
        "hungary",
        "hungarian",
        "ferencvaros",
        "ujpest",
        "honved",
        "mtk budapest",
        "debrecen",
        "budapest",
        "nb i",
      ],
      Romanian: [
        "romania",
        "romanian",
        "steaua",
        "dinamo bucuresti",
        "cfr cluj",
        "craiova",
        "rapid bucuresti",
        "bucharest",
        "cluj",
        "liga i",
      ],
      Bulgarian: [
        "bulgaria",
        "bulgarian",
        "levski sofia",
        "cska sofia",
        "ludogorets",
        "lokomotiv plovdiv",
        "cherno more",
        "sofia",
        "plovdiv",
        "parva liga",
      ],
      Serbian: [
        "serbia",
        "serbian",
        "red star",
        "partizan",
        "vojvodina",
        "cukaricki",
        "radnicki nis",
        "belgrade",
        "novi sad",
        "super liga",
      ],
      Bosnian: [
        "bosnia",
        "bosnian",
        "sarajevo",
        "zeljeznicar",
        "siroki brijeg",
        "borac",
        "velez",
        "premijer liga",
      ],
      Slovenian: [
        "slovenia",
        "slovenian",
        "olimpija",
        "maribor",
        "celje",
        "domzale",
        "koper",
        "ljubljana",
        "prva liga",
      ],
      Montenegrin: [
        "montenegro",
        "montenegrin",
        "buducnost",
        "sutjeska",
        "rudar",
        "petrovac",
        "podgorica",
        "prva liga",
      ],
      "North Macedonian": [
        "north macedonia",
        "macedonian",
        "vardar",
        "shkendija",
        "rabotnicki",
        "akademija pandev",
        "skopje",
        "prva liga",
      ],
      Albanian: [
        "albania",
        "albanian",
        "tirana",
        "partizani",
        "skenderbeu",
        "vllaznia",
        "kategoria superiore",
      ],
      Lithuanian: [
        "lithuania",
        "lithuanian",
        "zalgiris",
        "suduva",
        "kauno zalgiris",
        "vilnius",
        "kaunas",
        "a lyga",
      ],
      Latvian: [
        "latvia",
        "latvian",
        "riga",
        "ventspils",
        "liepaja",
        "daugavpils",
        "virsliga",
      ],
      Estonian: [
        "estonia",
        "estonian",
        "flora",
        "levadia",
        "kalju",
        "tallinn",
        "tartu",
        "meistriliiga",
      ],
      Finnish: [
        "finland",
        "finnish",
        "hel",
        "inter turku",
        "honka",
        "helsinki",
        "turku",
        "veikkausliiga",
      ],
      Swedish: [
        "sweden",
        "swedish",
        "malmo",
        "gothenburg",
        "aik",
        "djurgardens",
        "hammarby",
        "stockholm",
        "allsvenskan",
      ],
      Norwegian: [
        "norway",
        "norwegian",
        "rosenborg",
        "molde",
        "brann",
        "valerenga",
        "oslo",
        "trondheim",
        "eliteserien",
      ],
      Danish: [
        "denmark",
        "danish",
        "fc copenhagen",
        "brondby",
        "midtjylland",
        "aalborg",
        "copenhagen",
        "superliga",
      ],
      Icelandic: [
        "iceland",
        "icelandic",
        "keflavik",
        "valur",
        "fylkir",
        "reykjavik",
        "urvalsdeild",
      ],
      Australian: [
        "australia",
        "australian",
        "sydney",
        "melbourne",
        "brisbane",
        "adelaide",
        "perth",
      ],
      Mongolian: ["mongolia", "mongolian", "ulaanbaatar", "erdenet"],
      Bhutanese: [
        "bhutan",
        "bhutanese",
        "samtse",
        "paro",
        "thimphu",
        "phuntsholing",
        "punakha",
      ],
      Nepalese: ["nepal", "nepalese", "kathmandu", "pokhara", "lalitpur"],
      "Sri Lankan": ["sri lanka", "sri lankan", "colombo", "kandy", "galle"],
      Maldivian: ["maldives", "maldivian", "male"],
      Afghan: ["afghanistan", "afghan", "kabul", "kandahar"],
      Pakistani: [
        "pakistan",
        "pakistani",
        "karachi",
        "lahore",
        "islamabad",
        "rawalpindi",
      ],
      Myanmar: ["myanmar", "burma", "yangon", "mandalay"],
    };

    // Check for country indicators in the league name first
    for (const [nationality, indicators] of Object.entries(countryMappings)) {
      if (indicators.some((indicator) => lowerName.includes(indicator))) {
        // Reduced logging
        // console.log(`🎯 COUNTRY FOUND in league: "${nationality}" (indicator: ${indicators.find((i) => lowerName.includes(i))})`);
        return nationality;
      }
    }

    // ✅ NEW: Also check team names if provided
    if (teamNames) {
      const lowerTeamNames = teamNames.toLowerCase();

      // ✅ CRITICAL: Priority check for Zimbabwean teams FIRST to prevent South African misdetection
      const zimbabweanTeams = [
        "dynamos",
        "highlanders",
        "triangle united",
        "triangle",
        "manica diamonds",
        "manica",
        "caps united",
        "chicken inn",
        "ngezi platinum",
        "black rhinos",
        "harare",
        "bulawayo",
        "bikita",
        "scotland",
      ];
      if (zimbabweanTeams.some((team) => lowerTeamNames.includes(team))) {
        // Reduced logging
        // console.log(`🇿🇼 PRIORITY ZIMBABWEAN DETECTION: Teams "${teamNames}" → Zimbabwean (detected: ${zimbabweanTeams.find((t) => lowerTeamNames.includes(t))})`);
        return "Zimbabwean";
      }

      // ✅ CRITICAL: Priority check for Bhutanese teams
      const bhutaneseTeams = ["samtse", "paro", "thimphu"];
      if (bhutaneseTeams.some((team) => lowerTeamNames.includes(team))) {
        // Reduced logging
        // console.log(`🇧🇹 PRIORITY BHUTANESE DETECTION: Teams "${teamNames}" → Bhutanese`);
        return "Bhutanese";
      }

      for (const [nationality, indicators] of Object.entries(countryMappings)) {
        if (
          indicators.some((indicator) => lowerTeamNames.includes(indicator))
        ) {
          // Reduced logging
          // console.log(`🎯 COUNTRY FOUND in teams: "${nationality}" (indicator: ${indicators.find((i) => lowerTeamNames.includes(i))})`);

          // ✅ CRITICAL: Additional validation for problematic cases
          if (
            nationality === "South African" &&
            zimbabweanTeams.some((team) => lowerTeamNames.includes(team))
          ) {
            // Reduced logging
            // console.log(`🚨 OVERRIDING SOUTH AFRICAN: Teams "${teamNames}" contain Zimbabwean teams - returning Zimbabwean!`);
            return "Zimbabwean";
          }

          return nationality;
        }
      }
    }

    // ✅ CRITICAL: Only default to English if it's explicitly "Premier League" with no other context
    if (lowerName === "premier league" || lowerName === "epl") {
      // Reduced logging
      // console.log(`🏴󠁧󠁢󠁥󠁮󠁧󠁿 DEFAULTING to English for: "${lowerName}"`);
      return "English";
    }

    // Reduced logging
    // console.log(`❌ NO COUNTRY DETECTED for: "${lowerName}"`);
    return null;
  }

  // Get the country for a league
  getLeagueCountry(leagueName: string): string {
    const mapping = this.allMappings.find(
      (mapping) =>
        mapping.normalizedName.toLowerCase() === leagueName.toLowerCase() ||
        mapping.originalName.toLowerCase() === leagueName.toLowerCase() ||
        mapping.aliases.some(
          (alias) => alias.toLowerCase() === leagueName.toLowerCase(),
        ),
    );

    return mapping?.country || "Unknown";
  }

  // Check if a league is a Premier League from a specific country
  isPremierLeagueFromCountry(leagueName: string, country: string): boolean {
    const normalizedName = this.normalizeLeagueName(leagueName);
    const leagueCountry = this.getLeagueCountry(normalizedName);

    return (
      leagueCountry.toLowerCase() === country.toLowerCase() &&
      normalizedName.toLowerCase().includes("pl")
    );
  }

  // Get all Premier League countries
  getAllPremierLeagueCountries(): string[] {
    return this.premierLeagueMappings.map((mapping) => mapping.country);
  }

  // Get Premier League name for a specific country
  getPremierLeagueForCountry(country: string): string | null {
    const mapping = this.premierLeagueMappings.find(
      (mapping) => mapping.country.toLowerCase() === country.toLowerCase(),
    );

    return mapping?.normalizedName || null;
  }

  // Check if a match belongs to English Premier League specifically
  isEnglishPremierLeague(leagueName: string): boolean {
    return this.isPremierLeagueFromCountry(leagueName, "England");
  }

  // Check if a match belongs to Ugandan Premier League specifically
  isUgandanPremierLeague(leagueName: string): boolean {
    return this.isPremierLeagueFromCountry(leagueName, "Uganda");
  }

  // Enhanced match filtering for Top screen
  filterMatchesForTopCategory(matches: any[], category: string): any[] {
    switch (category) {
      case "premier":
        // ✅ FIXED: Only ACTUAL English Premier League matches - no friendlies or other leagues
        return matches.filter((match) => {
          // ✅ CRITICAL FIX: Ensure league is always a string
          const league = String(match.league || "");
          const normalizedLeague = this.normalizeLeagueName(league);

          // Must be specifically English Premier League
          const isEnglishPL = normalizedLeague
            .toLowerCase()
            .includes("english premier");

          // Must not be friendlies or international matches
          const isNotFriendly =
            !league.toLowerCase().includes("friendly") &&
            !league.toLowerCase().includes("international") &&
            !this.isInternationalMatch(match);

          console.log(
            `🏆 ENGLISH PL FILTER: "${league}" → normalized: "${normalizedLeague}" → isEnglishPL: ${isEnglishPL}, isNotFriendly: ${isNotFriendly}`,
          );

          return isEnglishPL && isNotFriendly;
        });

      case "uganda":
        // ✅ ULTRA-STRICT: Filter for ONLY Ugandan teams, BLOCK all other leagues
        console.log(`🔍 [Uganda Filter] Processing ${matches.length} total matches...`);
        
        const ugandaMatches = matches.filter((match) => {
          const leagueObj = match.league || {};
          const league = String(leagueObj.name || match.league || "");
          const leagueId = leagueObj.id || match.leagueId || match.league_id || null;
          const leagueLower = league.toLowerCase();
          const homeTeam = (match.teams?.home?.name || match.home?.name || match.homeTeam || "").toLowerCase();
          const awayTeam = (match.teams?.away?.name || match.away?.name || match.awayTeam || "").toLowerCase();
          
          // ✅ WHITELIST: EXACT Ugandan team names only
          const ugandanTeamNames = [
            "vipers sc", "vipers",
            "kcca fc", "kcca",
            "sc villa",
            "bul fc",
            "buhimba saints", "buhimba united", "bahimba",
            "express fc", "express",
            "kitara fc", "kitara",
            "ura fc",
            "entebbe uppc", "uppc fc",
            "nec fc",
            "maroons fc", "maroons",
            "lugazi fc", "lugazi",
            "updf fc",
            "mbarara city", "mbarara fc",
            "calvary fc", "calvary"
          ];
          
          // Check if BOTH teams are Ugandan (not just one)
          const homeIsUgandan = ugandanTeamNames.some(team => homeTeam === team || homeTeam.includes(team));
          const awayIsUgandan = ugandanTeamNames.some(team => awayTeam === team || awayTeam.includes(team));
          const bothTeamsUgandan = homeIsUgandan && awayIsUgandan;
          
          // ✅ BLACKLIST: Explicitly block these league IDs
          const blockedLeagueIds = [
            39,   // English Premier League
            140,  // Spanish La Liga
            276,  // Kenya FKF Premier League
            277,  // Kenya Super League
            288,  // South African PSL
            398,  // Bangladesh Premier League
            412,  // Botswana Premier League
            585,  // Another SA league
          ];
          
          const isBlockedLeague = blockedLeagueIds.includes(leagueId);
          
          // ✅ BLACKLIST: Block English/SA/other league names
          const blockedLeagueKeywords = [
            "english premier",
            "epl",
            "barclays",
            "south africa",
            "dstv premiership",
            "psl",
            "kenya",
            "bangladesh",
            "botswana",
            "tanzania",
            "rwanda",
            "la liga",
            "serie a",
            "bundesliga",
            "ligue 1"
          ];
          
          const hasBlockedKeyword = blockedLeagueKeywords.some(keyword => leagueLower.includes(keyword));
          
          // ✅ Exclude friendlies/internationals
          const isNotFriendly =
            !leagueLower.includes("friendly") &&
            !leagueLower.includes("international") &&
            !leagueLower.includes("cecafa") &&
            !this.isInternationalMatch(match);
          
          // ✅ FINAL DECISION: MUST have both Ugandan teams AND not be blocked
          const isMatch = (
            bothTeamsUgandan &&
            !isBlockedLeague &&
            !hasBlockedKeyword &&
            isNotFriendly
          );
          
          if (isMatch) {
            console.log(`✅ Uganda match: ${match.teams?.home?.name || match.home?.name} vs ${match.teams?.away?.name || match.away?.name} (League: "${league}", ID: ${leagueId})`);
          } else if (homeIsUgandan || awayIsUgandan) {
            // Log rejected matches that have at least one Ugandan team
            if (isBlockedLeague) {
              console.log(`❌ BLOCKED (League ID ${leagueId}): ${match.teams?.home?.name || match.home?.name} vs ${match.teams?.away?.name || match.away?.name}`);
            } else if (hasBlockedKeyword) {
              console.log(`❌ BLOCKED (League "${league}"): ${match.teams?.home?.name || match.home?.name} vs ${match.teams?.away?.name || match.away?.name}`);
            } else if (!bothTeamsUgandan) {
              console.log(`❌ BLOCKED (Only 1 Ugandan team): ${match.teams?.home?.name || match.home?.name} vs ${match.teams?.away?.name || match.away?.name}`);
            }
          }
          
          return isMatch;
        });

        console.log(`🇺🇬 ✅ UGANDA FILTER RESULT: ${ugandaMatches.length} Uganda Premier League matches found`);
        return ugandaMatches;

      default:
        return matches;
    }
  }

  // ✅ NEW: Check if a match is an international friendly
  private isInternationalMatch(match: any): boolean {
    if (!match) return false;

    const homeTeam = (match.home?.name || match.homeTeam || "").toLowerCase();
    const awayTeam = (match.away?.name || match.awayTeam || "").toLowerCase();
    // ✅ CRITICAL FIX: Handle non-string league values
    const league = String(match.league || "").toLowerCase();

    // International match indicators
    const internationalKeywords = [
      "friendly",
      "international",
      "vs",
      "national team",
    ];
    const hasInternationalKeyword = internationalKeywords.some((keyword) =>
      league.includes(keyword),
    );

    // Check if teams are from different countries (common pattern for international matches)
    const countryNames = [
      "uganda",
      "congo",
      "senegal",
      "kenya",
      "tanzania",
      "rwanda",
      "egypt",
      "morocco",
      "nigeria",
      "ghana",
      "cameroon",
      "tunisia",
      "algeria",
      "south africa",
      "england",
      "france",
      "germany",
      "spain",
      "italy",
      "brazil",
      "argentina",
    ];

    const homeCountry = countryNames.find((country) =>
      homeTeam.includes(country),
    );
    const awayCountry = countryNames.find((country) =>
      awayTeam.includes(country),
    );

    const isDifferentCountries = Boolean(
      homeCountry && awayCountry && homeCountry !== awayCountry,
    );

    return hasInternationalKeyword || isDifferentCountries;
  }

  // ✅ REMOVED: isUgandanMatch method since we're being more strict about league filtering
}

export const leagueNormalizationService = new LeagueNormalizationService();
