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
      originalName: 'Premier League',
      normalizedName: 'English PL',
      country: 'England',
      aliases: ['EPL', 'English Premier League', 'Premier League (England)', 'England Premier League']
    },
    {
      originalName: 'EPL',
      normalizedName: 'English PL',
      country: 'England',
      aliases: ['Premier League', 'English Premier League', 'England Premier League']
    },
    {
      originalName: 'English Premier League',
      normalizedName: 'English PL',
      country: 'England',
      aliases: ['Premier League', 'EPL', 'England Premier League']
    },

    // Ugandan Premier League
    {
      originalName: 'Uganda Premier League',
      normalizedName: 'Ugandan PL',
      country: 'Uganda',
      aliases: ['UPL', 'FUFA Super League', 'Startimes Uganda Premier League']
    },
    {
      originalName: 'UPL',
      normalizedName: 'Ugandan PL',
      country: 'Uganda',
      aliases: ['Uganda Premier League', 'FUFA Super League']
    },
    {
      originalName: 'FUFA Super League',
      normalizedName: 'Ugandan PL',
      country: 'Uganda',
      aliases: ['Uganda Premier League', 'UPL']
    },

    // Russian Premier League
    {
      originalName: 'Russian Premier League',
      normalizedName: 'Russian PL',
      country: 'Russia',
      aliases: ['RPL', 'Russia Premier League']
    },

    // Other Premier Leagues
    {
      originalName: 'Kazakh Premier League',
      normalizedName: 'Kazakh PL',
      country: 'Kazakhstan',
      aliases: ['Kazakhstan Premier League']
    },
    {
      originalName: 'Bangladesh Premier League',
      normalizedName: 'Bangladesh PL',
      country: 'Bangladesh',
      aliases: ['BPL']
    },
    {
      originalName: 'Chinese Super League',
      normalizedName: 'Chinese PL',
      country: 'China',
      aliases: ['CSL', 'China Premier League']
    },
    {
      originalName: 'Indian Super League',
      normalizedName: 'Indian PL',
      country: 'India',
      aliases: ['ISL', 'India Premier League']
    },
    
    // NEW: Asian Premier Leagues (to prevent English PL mislabeling)
    {
      originalName: 'Bhutan Premier League',
      normalizedName: 'Bhutanese PL',
      country: 'Bhutan',
      aliases: ['BPL Bhutan', 'Bhutan PL', 'Bhutanese Premier League']
    },
    {
      originalName: 'Nepal Premier League',
      normalizedName: 'Nepalese PL',
      country: 'Nepal',
      aliases: ['NPL', 'Nepal PL']
    },
    
    // ✅ CRITICAL: African Premier Leagues using "PL" format consistently
    {
      originalName: 'Zimbabwe Premier League',
      normalizedName: 'Zimbabwean PL',
      country: 'Zimbabwe',
      aliases: ['Zimbabwean Premier League', 'Zimbabwe PL', 'ZPL']
    },
    {
      originalName: 'Zimbabwean Premier League',
      normalizedName: 'Zimbabwean PL',
      country: 'Zimbabwe',
      aliases: ['Zimbabwe Premier League', 'Zimbabwe PL', 'ZPL']
    },
    {
      originalName: 'Premier Soccer League',
      normalizedName: 'South African PL',
      country: 'South Africa',
      aliases: ['PSL South Africa', 'South African Premier Soccer League']
    },
    {
      originalName: 'South African Premier League',
      normalizedName: 'South African PL',
      country: 'South Africa',
      aliases: ['PSL South Africa', 'South African PSL']
    },
    {
      originalName: 'Sri Lankan Premier League',
      normalizedName: 'Sri Lankan PL',
      country: 'Sri Lanka',
      aliases: ['SLPL', 'Sri Lanka Premier League']
    },
    {
      originalName: 'Thai Premier League',
      normalizedName: 'Thai PL',
      country: 'Thailand',
      aliases: ['TPL', 'Thailand Premier League']
    },
    {
      originalName: 'Malaysian Premier League',
      normalizedName: 'Malaysian PL',
      country: 'Malaysia',
      aliases: ['MPL', 'Malaysia Premier League']
    },
    {
      originalName: 'Indonesian Premier League',
      normalizedName: 'Indonesian PL',
      country: 'Indonesia',
      aliases: ['IPL Indonesia', 'Indonesia Premier League']
    },
    {
      originalName: 'Australian A-League',
      normalizedName: 'Australian PL',
      country: 'Australia',
      aliases: ['A-League', 'Australia Premier League']
    }
  ];

  private otherLeagueMappings: LeagueMapping[] = [
    // Champions League variants
    {
      originalName: 'UEFA Champions League',
      normalizedName: 'Champions League',
      country: 'Europe',
      aliases: ['Champions League', 'UCL', 'European Cup']
    },
    {
      originalName: 'Champions League',
      normalizedName: 'Champions League',
      country: 'Europe',
      aliases: ['UEFA Champions League', 'UCL']
    },

    // La Liga variants
    {
      originalName: 'La Liga',
      normalizedName: 'Spanish La Liga',
      country: 'Spain',
      aliases: ['Primera División', 'Spanish First Division']
    },

    // Bundesliga variants
    {
      originalName: 'Bundesliga',
      normalizedName: 'German Bundesliga',
      country: 'Germany',
      aliases: ['German First Division', '1. Bundesliga']
    },

    // Serie A variants
    {
      originalName: 'Serie A',
      normalizedName: 'Italian Serie A',
      country: 'Italy',
      aliases: ['Italian First Division', 'Serie A TIM']
    },

    // Ligue 1 variants
    {
      originalName: 'Ligue 1',
      normalizedName: 'French Ligue 1',
      country: 'France',
      aliases: ['French First Division', 'Ligue 1 Uber Eats']
    }
  ];

  private allMappings: LeagueMapping[];

  constructor() {
    this.allMappings = [...this.premierLeagueMappings, ...this.otherLeagueMappings];
  }

  // Normalize a league name to include country prefix
  normalizeLeagueName(leagueName: string, teamNames?: string): string {
    if (!leagueName) return leagueName;

    const cleanName = leagueName.trim();
    const lowerName = cleanName.toLowerCase();
    console.log(`🔍 NORMALIZING LEAGUE: "${leagueName}" → cleaned: "${cleanName}"`);
    
    // ✅ CRITICAL: Handle "Premier L" and "Premier Soccer" variations FIRST
    if ((lowerName.includes('premier l') && !lowerName.includes('premier league')) || 
        lowerName.includes('premier soccer')) {
      const detectedCountry = this.detectCountryFromLeague(leagueName, teamNames);
      if (detectedCountry) {
        const fixedName = `${detectedCountry} PL`;
        console.log(`🚨 PREMIER VARIANT FIX: "${leagueName}" → "${fixedName}" (country: ${detectedCountry})`);
        return fixedName;
      } else {
        // Force to "Premier League" format to avoid truncated names
        console.log(`🚨 PREMIER VARIANT NO COUNTRY: "${leagueName}" - converting to "Premier League"`);
        return 'Premier League';
      }
    }
    
    // ✅ CRITICAL: Handle "Premier Soccer League" specifically FIRST - ALWAYS detect country
    if (lowerName.includes('premier soccer league')) {
      const detectedCountry = this.detectCountryFromLeague(leagueName, teamNames);
      if (detectedCountry) {
        const countryPL = `${detectedCountry} PL`;
        console.log(`🚨 PSL COUNTRY FIX: "${leagueName}" → "${countryPL}" (detected: ${detectedCountry})`);
        return countryPL;
      } else {
        // If no country detected, force to generic Premier League to avoid "Premier Soccer PL"
        console.log(`🚨 PSL NO COUNTRY: "${leagueName}" - converting to "Premier League"`);
        return 'Premier League';
      }
    }
    
    // ✅ ENHANCED: Handle friendlies first for clarity
    const friendlyResult = this.normalizeFriendlyMatches(cleanName);
    if (friendlyResult) {
      console.log(`🤝 FRIENDLY NORMALIZED: "${leagueName}" → "${friendlyResult}"`);
      return friendlyResult;
    }
    
    // ✅ ENHANCED: Handle divisions with country context (FIXED - no more generic "1. Division")
    const divisionResult = this.normalizeDivisionNames(cleanName, teamNames);
    if (divisionResult) {
      console.log(`🏆 DIVISION NORMALIZED: "${leagueName}" → "${divisionResult}"`);
      return divisionResult;
    }
    
    // Check for direct mapping
    const directMapping = this.allMappings.find(mapping => 
      mapping.originalName.toLowerCase() === cleanName.toLowerCase()
    );
    
    if (directMapping) {
      console.log(`🏆 LEAGUE NORMALIZED (direct): "${leagueName}" → "${directMapping.normalizedName}"`);
      return directMapping.normalizedName;
    }

    // Check for alias matching
    const aliasMapping = this.allMappings.find(mapping =>
      mapping.aliases.some(alias => 
        alias.toLowerCase() === cleanName.toLowerCase()
      )
    );

    if (aliasMapping) {
      console.log(`🏆 LEAGUE NORMALIZED (alias): "${leagueName}" → "${aliasMapping.normalizedName}"`);
      return aliasMapping.normalizedName;
    }

    // ✅ FIXED: Only apply Premier League detection to leagues that actually contain "premier"
    if (cleanName.toLowerCase().includes('premier')) {
      console.log(`🔍 PREMIER LEAGUE DETECTED: "${leagueName}" - detecting country...`);
      const detectedCountry = this.detectCountryFromLeague(cleanName, teamNames);
      if (detectedCountry) {
        const normalizedName = `${detectedCountry} PL`;
        console.log(`✅ COUNTRY DETECTED: "${leagueName}" → "${normalizedName}" (country: ${detectedCountry})`);
        return normalizedName;
      } else {
        console.log(`⚠️ NO COUNTRY DETECTED: "${leagueName}" - keeping original name to prevent English PL mislabeling`);
        return cleanName;
      }
    }

    // ✅ ENHANCED: Make league names clearer with country context, preserve API data
    const result = this.makeLeagueNameClear(cleanName, teamNames);
    console.log(`🏆 FINAL NORMALIZATION: "${leagueName}" → "${result}"`);
    return result;
  }

  // ✅ NEW: Normalize friendly matches for clarity
  private normalizeFriendlyMatches(leagueName: string): string | null {
    const lowerName = leagueName.toLowerCase();
    
    // International friendlies
    if (lowerName.includes('international') && lowerName.includes('friendly')) {
      return 'Int Friendlies';
    }
    
    if (lowerName.includes('friendly') && (
        lowerName.includes('national') || 
        lowerName.includes('country') ||
        lowerName.includes('international')
    )) {
      return 'Int Friendlies';
    }
    
    // Club friendlies
    if (lowerName.includes('friendly') && lowerName.includes('club')) {
      return 'Club Friendlies';
    }
    
    if (lowerName.includes('friendlies') && lowerName.includes('club')) {
      return 'Club Friendlies';
    }
    
    // Generic friendlies
    if (lowerName === 'friendlies' || lowerName === 'friendly') {
      return 'Club Friendlies';
    }
    
    return null;
  }

  // ✅ FIXED: Normalize division names WITH COUNTRY CONTEXT (no more generic "1. Division")
  private normalizeDivisionNames(leagueName: string, teamNames?: string): string | null {
    const lowerName = leagueName.toLowerCase();
    
    // ✅ CRITICAL: Don't create generic division names - add country context instead
    
    // Handle numbered divisions WITH country detection
    if (lowerName.match(/^(\d+)\.?\s*division/) || lowerName.includes('division')) {
      console.log(`📋 DIVISION DETECTED: "${leagueName}" - detecting country...`);
      
      // Try to detect country from team names or league context
      const detectedCountry = this.detectCountryFromLeague(leagueName, teamNames);
      
      if (detectedCountry) {
        const match = lowerName.match(/^(\d+)\.?\s*division/);
        if (match) {
          const number = match[1];
          const divisionName = `${detectedCountry} Division ${number}`;
          console.log(`✅ DIVISION WITH COUNTRY: "${leagueName}" → "${divisionName}"`);
          return divisionName;
        } else {
          // Just "division" without number
          const divisionName = `${detectedCountry} Division`;
          console.log(`✅ DIVISION WITH COUNTRY: "${leagueName}" → "${divisionName}"`);
          return divisionName;
        }
      } else {
        // ✅ CRITICAL: If we can't detect country, create a meaningful name anyway
        console.log(`⚠️ DIVISION WITHOUT COUNTRY: "${leagueName}" - creating generic but meaningful name`);
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
    if (lowerName.includes('primera') && lowerName.includes('division')) {
      const detectedCountry = this.detectCountryFromLeague(leagueName, teamNames);
      return detectedCountry ? `${detectedCountry} First Division` : null;
    }
    
    if (lowerName.includes('segunda') && lowerName.includes('division')) {
      const detectedCountry = this.detectCountryFromLeague(leagueName, teamNames);
      return detectedCountry ? `${detectedCountry} Second Division` : null;
    }
    
    return null;
  }

  // ✅ FIXED: Make league names clearer WITHOUT destroying country context
  private makeLeagueNameClear(leagueName: string, teamNames?: string): string {
    const lowerName = leagueName.toLowerCase();
    
    // ✅ CRITICAL: Handle "Premier L" and "Premier Soccer" variations  
    if ((lowerName.includes('premier l') && !lowerName.includes('premier league')) || 
        lowerName.includes('premier soccer')) {
      const detectedCountry = this.detectCountryFromLeague(leagueName, teamNames);
      if (detectedCountry) {
        const fixedName = `${detectedCountry} PL`;
        console.log(`🚨 PREMIER VARIANT FIX: "${leagueName}" → "${fixedName}" (country: ${detectedCountry})`);
        return fixedName;
      } else {
        // Force to "Premier League" format to avoid truncated names
        console.log(`🚨 PREMIER VARIANT NO COUNTRY: "${leagueName}" - converting to "Premier League"`);
        return 'Premier League';
      }
    }
    
    // ✅ CRITICAL: Handle "Premier Soccer League" specifically - ALWAYS detect country
    if (lowerName.includes('premier soccer league')) {
      const detectedCountry = this.detectCountryFromLeague(leagueName, teamNames);
      if (detectedCountry) {
        const countryPL = `${detectedCountry} PL`;
        console.log(`🚨 PSL COUNTRY FIX: "${leagueName}" → "${countryPL}" (detected: ${detectedCountry})`);
        return countryPL;
      } else {
        // If no country detected, force to generic Premier League to avoid "Premier Soccer PL"
        console.log(`🚨 PSL NO COUNTRY: "${leagueName}" - converting to "Premier League"`);
        return 'Premier League';
      }
    }
    
    // ✅ CRITICAL: REMOVED all generic division mappings that lose country context
    // OLD BAD BEHAVIOR: '1. division': 'First Division' - TERRIBLE!
    // NEW BEHAVIOR: Preserve original names or add country context
    
    // Handle ONLY well-known international leagues that don't need country context
    const internationalLeagues: { [key: string]: string } = {
      'serie a': 'Serie A',
      'serie b': 'Serie B', 
      'ligue 1': 'Ligue 1',
      'ligue 2': 'Ligue 2',
      'bundesliga': 'Bundesliga',
      'la liga': 'La Liga',
      'eredivisie': 'Eredivisie',
      'primeira liga': 'Primeira Liga',
      'championship': 'Championship',
      'league one': 'League One',
      'league two': 'League Two'
    };
    
    // Check for well-known international leagues
    if (internationalLeagues[lowerName]) {
      console.log(`🌍 INTERNATIONAL LEAGUE: "${leagueName}" → "${internationalLeagues[lowerName]}"`);
      return internationalLeagues[lowerName];
    }
    
    // ✅ NEW: For division-like names, try to add country context or preserve original
    if (lowerName.includes('division') || lowerName.includes('super') || lowerName.includes('league')) {
      const detectedCountry = this.detectCountryFromLeague(leagueName, teamNames);
      
      if (detectedCountry && !leagueName.toLowerCase().includes(detectedCountry.toLowerCase())) {
        // Add country prefix if not already present
        const enhancedName = `${detectedCountry} ${this.capitalizeLeagueName(leagueName)}`;
        console.log(`🎯 ENHANCED LEAGUE: "${leagueName}" → "${enhancedName}"`);
        return enhancedName;
      }
    }
    
    // ✅ CRITICAL: Default to properly capitalized ORIGINAL name to preserve API data
    const capitalizedOriginal = this.capitalizeLeagueName(leagueName);
    console.log(`📋 PRESERVED ORIGINAL: "${leagueName}" → "${capitalizedOriginal}"`);
    return capitalizedOriginal;
  }

  // ✅ NEW: Proper capitalization for league names
  private capitalizeLeagueName(leagueName: string): string {
    return leagueName
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  // ✅ NEW: Enhanced country detection from league names
  detectCountryFromLeague(leagueName: string, teamNames?: string): string | null {
    const lowerName = leagueName.toLowerCase();
    console.log(`🌍 DETECTING COUNTRY: league="${lowerName}", teams="${teamNames || 'none'}"`);
    
    // Country detection with multiple variants
    const countryMappings: { [key: string]: string[] } = {
      'English': ['england', 'english', 'britain', 'british', 'epl'],
      'Russian': ['russia', 'russian'],
      'Chinese': ['china', 'chinese'],
      'Indian': ['india', 'indian'],
      'Kazakhstani': ['kazakhstan', 'kazakh', 'kazakhstani', 'akademiya ontustik', 'kaspiy', 'irtysh', 'akzhayik', 'ordabasy', 'tobol'],
      'Bangladeshi': ['bangladesh', 'bangladeshi', 'dhaka', 'chittagong', 'sylhet'],
      'Nigerian': ['nigeria', 'nigerian', 'lagos', 'abuja', 'kano', 'enugu', 'rivers united', 'enyimba'],
      'South African': ['south africa', 'south african', 'kaizer chiefs', 'orlando pirates', 'mamelodi sundowns', 'cape town'],
      'Ghanaian': ['ghana', 'ghanaian', 'hearts of oak', 'asante kotoko', 'accra', 'kumasi'],
      'Kenyan': ['kenya', 'kenyan', 'gor mahia', 'afc leopards', 'nairobi', 'mombasa'],
      'Ethiopian': ['ethiopia', 'ethiopian', 'addis ababa', 'dire dawa'],
      'Egyptian': ['egypt', 'egyptian', 'al ahly', 'zamalek', 'cairo', 'alexandria'],
      'Moroccan': ['morocco', 'moroccan', 'raja', 'wydad', 'casablanca', 'rabat'],
      'Tunisian': ['tunisia', 'tunisian', 'esperance', 'club africain', 'tunis'],
      'Algerian': ['algeria', 'algerian', 'mc alger', 'usm alger', 'algiers'],
      'Ugandan': ['uganda', 'ugandan', 'fufa', 'kampala', 'sc villa', 'kcca', 'express'],
      'Tanzanian': ['tanzania', 'tanzanian', 'simba', 'young africans', 'dar es salaam'],
      'Zimbabwean': ['zimbabwe', 'zimbabwean', 'dynamos', 'caps united', 'harare', 'highlanders', 'triangle united', 'triangle', 'manica diamonds', 'manica', 'chicken inn', 'ngezi platinum', 'black rhinos', 'bulawayo', 'bikita', 'scotland'],
      'Zambian': ['zambia', 'zambian', 'power dynamos', 'zanaco', 'lusaka'],
      'Brazilian': ['brazil', 'brazilian', 'sao paulo', 'flamengo', 'corinthians', 'palmeiras', 'santos'],
      'Argentine': ['argentina', 'argentine', 'boca juniors', 'river plate', 'racing', 'independiente'],
      'Chilean': ['chile', 'chilean', 'colo colo', 'universidad', 'santiago'],
      'Colombian': ['colombia', 'colombian', 'millonarios', 'nacional', 'bogota', 'medellin'],
      'Mexican': ['mexico', 'mexican', 'america', 'chivas', 'cruz azul', 'pumas'],
      'Uruguayan': ['uruguay', 'uruguayan', 'penarol', 'nacional', 'montevideo'],
      'Paraguayan': ['paraguay', 'paraguayan', 'olimpia', 'cerro porteno', 'asuncion'],
      'Bolivian': ['bolivia', 'bolivian', 'strongest', 'bolivar', 'la paz'],
      'Peruvian': ['peru', 'peruvian', 'universitario', 'alianza lima', 'lima'],
      'Ecuadorian': ['ecuador', 'ecuadorian', 'barcelona', 'emelec', 'quito', 'guayaquil'],
      'Japanese': ['japan', 'japanese', 'kashima', 'urawa', 'tokyo', 'osaka', 'yokohama'],
      'Korean': ['korea', 'korean', 'seoul', 'jeonbuk', 'ulsan', 'suwon'],
      'Thai': ['thailand', 'thai', 'bangkok', 'buriram', 'chonburi', 'muangthong'],
      'Vietnamese': ['vietnam', 'vietnamese', 'hanoi', 'ho chi minh', 'saigon'],
      'Malaysian': ['malaysia', 'malaysian', 'kuala lumpur', 'selangor', 'johor'],
      'Indonesian': ['indonesia', 'indonesian', 'persija', 'persib', 'jakarta', 'bandung'],
      'Filipino': ['philippines', 'filipino', 'manila', 'cebu', 'davao'],
      'Singaporean': ['singapore', 'singaporean'],
      'Cambodian': ['cambodia', 'cambodian', 'phnom penh'],
      'Laotian': ['laos', 'laotian', 'vientiane'],
      'Australian': ['australia', 'australian', 'sydney', 'melbourne', 'brisbane', 'adelaide', 'perth'],
      'Mongolian': ['mongolia', 'mongolian', 'ulaanbaatar', 'erdenet'],
      'Bhutanese': ['bhutan', 'bhutanese', 'samtse', 'paro', 'thimphu', 'phuntsholing', 'punakha'],
      'Nepalese': ['nepal', 'nepalese', 'kathmandu', 'pokhara', 'lalitpur'],
      'Sri Lankan': ['sri lanka', 'sri lankan', 'colombo', 'kandy', 'galle'],
      'Maldivian': ['maldives', 'maldivian', 'male'],
      'Afghan': ['afghanistan', 'afghan', 'kabul', 'kandahar'],
      'Pakistani': ['pakistan', 'pakistani', 'karachi', 'lahore', 'islamabad', 'rawalpindi'],
      'Myanmar': ['myanmar', 'burma', 'yangon', 'mandalay'],
      // European countries that might show as "1. Division"
      'Romanian': ['romania', 'romanian', 'bucharest', 'steaua', 'dinamo', 'cfr cluj'],
      'Bulgarian': ['bulgaria', 'bulgarian', 'sofia', 'levski', 'cska', 'ludogorets'],
      'Serbian': ['serbia', 'serbian', 'belgrade', 'partizan', 'red star', 'vojvodina'],
      'Croatian': ['croatia', 'croatian', 'zagreb', 'dinamo', 'hajduk', 'rijeka'],
      'Slovenian': ['slovenia', 'slovenian', 'ljubljana', 'maribor', 'olimpija'],
      'Slovak': ['slovakia', 'slovak', 'bratislava', 'slovan', 'zilina'],
      'Czech': ['czech', 'czechoslovakia', 'prague', 'sparta', 'slavia', 'plzen'],
      'Hungarian': ['hungary', 'hungarian', 'budapest', 'ferencvaros', 'honved'],
      'Polish': ['poland', 'polish', 'warsaw', 'krakow', 'legia', 'wisla'],
      'Estonian': ['estonia', 'estonian', 'tallinn', 'flora', 'levadia'],
      'Latvian': ['latvia', 'latvian', 'riga', 'daugavpils'],
      'Lithuanian': ['lithuania', 'lithuanian', 'vilnius', 'kaunas'],
      'Georgian': ['georgia', 'georgian', 'tbilisi', 'dinamo tbilisi'],
      'Armenian': ['armenia', 'armenian', 'yerevan', 'ararat'],
      'Azerbaijani': ['azerbaijan', 'azerbaijani', 'baku', 'qarabag'],
      'Moldovan': ['moldova', 'moldovan', 'chisinau', 'sheriff'],
      'Belarusian': ['belarus', 'belarusian', 'minsk', 'bate', 'dinamo minsk'],
      'Ukrainian': ['ukraine', 'ukrainian', 'kiev', 'dynamo', 'shakhtar', 'dnipro'],
      'Icelandic': ['iceland', 'icelandic', 'reykjavik', 'keflavik'],
      'Faroese': ['faroe', 'faroese', 'torshavn'],
      'Maltese': ['malta', 'maltese', 'valletta', 'floriana'],
      'Andorran': ['andorra', 'andorran'],
      'San Marinese': ['san marino', 'san marinese'],
      'Liechtensteiner': ['liechtenstein', 'liechtensteiner'],
      'Luxembourgish': ['luxembourg', 'luxembourgish']
    };

    // Check for country indicators in the league name first
    for (const [nationality, indicators] of Object.entries(countryMappings)) {
      if (indicators.some(indicator => lowerName.includes(indicator))) {
        console.log(`🎯 COUNTRY FOUND in league: "${nationality}" (indicator: ${indicators.find(i => lowerName.includes(i))})`);
        return nationality;
      }
    }
    
    // ✅ NEW: Also check team names if provided
    if (teamNames) {
      const lowerTeamNames = teamNames.toLowerCase();
      
              // ✅ CRITICAL: Priority check for Zimbabwean teams FIRST to prevent South African misdetection
        const zimbabweanTeams = ['dynamos', 'highlanders', 'triangle united', 'triangle', 'manica diamonds', 'manica', 'caps united', 'chicken inn', 'ngezi platinum', 'black rhinos', 'harare', 'bulawayo', 'bikita', 'scotland'];
        if (zimbabweanTeams.some(team => lowerTeamNames.includes(team))) {
          console.log(`🇿🇼 PRIORITY ZIMBABWEAN DETECTION: Teams "${teamNames}" → Zimbabwean (detected: ${zimbabweanTeams.find(t => lowerTeamNames.includes(t))})`);
          return 'Zimbabwean';
        }
      
      // ✅ CRITICAL: Priority check for Bhutanese teams
      const bhutaneseTeams = ['samtse', 'paro', 'thimphu'];
      if (bhutaneseTeams.some(team => lowerTeamNames.includes(team))) {
        console.log(`🇧🇹 PRIORITY BHUTANESE DETECTION: Teams "${teamNames}" → Bhutanese`);
        return 'Bhutanese';
      }
      
      for (const [nationality, indicators] of Object.entries(countryMappings)) {
        if (indicators.some(indicator => lowerTeamNames.includes(indicator))) {
          console.log(`🎯 COUNTRY FOUND in teams: "${nationality}" (indicator: ${indicators.find(i => lowerTeamNames.includes(i))})`);
          
          // ✅ CRITICAL: Additional validation for problematic cases
          if (nationality === 'South African' && zimbabweanTeams.some(team => lowerTeamNames.includes(team))) {
            console.log(`🚨 OVERRIDING SOUTH AFRICAN: Teams "${teamNames}" contain Zimbabwean teams - returning Zimbabwean!`);
            return 'Zimbabwean';
          }
          
          return nationality;
        }
      }
    }

    // ✅ CRITICAL: Only default to English if it's explicitly "Premier League" with no other context
    if (lowerName === 'premier league' || lowerName === 'epl') {
      console.log(`🏴󠁧󠁢󠁥󠁮󠁧󠁿 DEFAULTING to English for: "${lowerName}"`);
      return 'English';
    }

    console.log(`❌ NO COUNTRY DETECTED for: "${lowerName}"`);
    return null;
  }

  // Get the country for a league
  getLeagueCountry(leagueName: string): string {
    const mapping = this.allMappings.find(mapping => 
      mapping.normalizedName.toLowerCase() === leagueName.toLowerCase() ||
      mapping.originalName.toLowerCase() === leagueName.toLowerCase() ||
      mapping.aliases.some(alias => alias.toLowerCase() === leagueName.toLowerCase())
    );

    return mapping?.country || 'Unknown';
  }

  // Check if a league is a Premier League from a specific country
  isPremierLeagueFromCountry(leagueName: string, country: string): boolean {
    const normalizedName = this.normalizeLeagueName(leagueName);
    const leagueCountry = this.getLeagueCountry(normalizedName);
    
    return leagueCountry.toLowerCase() === country.toLowerCase() && 
           normalizedName.toLowerCase().includes('pl');
  }

  // Get all Premier League countries
  getAllPremierLeagueCountries(): string[] {
    return this.premierLeagueMappings.map(mapping => mapping.country);
  }

  // Get Premier League name for a specific country
  getPremierLeagueForCountry(country: string): string | null {
    const mapping = this.premierLeagueMappings.find(mapping => 
      mapping.country.toLowerCase() === country.toLowerCase()
    );
    
    return mapping?.normalizedName || null;
  }

  // Check if a match belongs to English Premier League specifically
  isEnglishPremierLeague(leagueName: string): boolean {
    return this.isPremierLeagueFromCountry(leagueName, 'England');
  }

  // Check if a match belongs to Ugandan Premier League specifically  
  isUgandanPremierLeague(leagueName: string): boolean {
    return this.isPremierLeagueFromCountry(leagueName, 'Uganda');
  }

  // Enhanced match filtering for Top screen
  filterMatchesForTopCategory(matches: any[], category: string): any[] {
    switch (category) {
      case 'premier':
        // ✅ FIXED: Only ACTUAL English Premier League matches - no friendlies or other leagues
        return matches.filter(match => {
          const league = match.league || '';
          const normalizedLeague = this.normalizeLeagueName(league);
          
          // Must be specifically English Premier League
          const isEnglishPL = normalizedLeague.toLowerCase().includes('english premier');
          
          // Must not be friendlies or international matches
          const isNotFriendly = !league.toLowerCase().includes('friendly') && 
                               !league.toLowerCase().includes('international') &&
                               !this.isInternationalMatch(match);
          
          console.log(`🏆 ENGLISH PL FILTER: "${league}" → normalized: "${normalizedLeague}" → isEnglishPL: ${isEnglishPL}, isNotFriendly: ${isNotFriendly}`);
          
          return isEnglishPL && isNotFriendly;
        });
        
      case 'uganda':
        // ✅ FIXED: Only ACTUAL Ugandan Premier League matches - no friendlies or international games
        return matches.filter(match => {
          const league = match.league || '';
          const normalizedLeague = this.normalizeLeagueName(league);
          
          // Must be specifically Ugandan Premier League
          const isUgandanPL = normalizedLeague.toLowerCase().includes('ugandan premier') ||
                             league.toLowerCase().includes('fufa super league') ||
                             league.toLowerCase().includes('startimes uganda premier');
          
          // Must not be friendlies or international matches
          const isNotFriendly = !league.toLowerCase().includes('friendly') && 
                               !league.toLowerCase().includes('international') &&
                               !this.isInternationalMatch(match);
          
          console.log(`🇺🇬 UGANDAN PL FILTER: "${league}" → normalized: "${normalizedLeague}" → isUgandanPL: ${isUgandanPL}, isNotFriendly: ${isNotFriendly}`);
          
          return isUgandanPL && isNotFriendly;
        });
        
      default:
        return matches;
    }
  }

  // ✅ NEW: Check if a match is an international friendly
  private isInternationalMatch(match: any): boolean {
    if (!match) return false;
    
    const homeTeam = (match.home?.name || match.homeTeam || '').toLowerCase();
    const awayTeam = (match.away?.name || match.awayTeam || '').toLowerCase();
    const league = (match.league || '').toLowerCase();
    
    // International match indicators
    const internationalKeywords = ['friendly', 'international', 'vs', 'national team'];
    const hasInternationalKeyword = internationalKeywords.some(keyword => 
      league.includes(keyword)
    );
    
    // Check if teams are from different countries (common pattern for international matches)
    const countryNames = [
      'uganda', 'congo', 'senegal', 'kenya', 'tanzania', 'rwanda', 'egypt', 'morocco',
      'nigeria', 'ghana', 'cameroon', 'tunisia', 'algeria', 'south africa',
      'england', 'france', 'germany', 'spain', 'italy', 'brazil', 'argentina'
    ];
    
    const homeCountry = countryNames.find(country => homeTeam.includes(country));
    const awayCountry = countryNames.find(country => awayTeam.includes(country));
    
         const isDifferentCountries = Boolean(homeCountry && awayCountry && homeCountry !== awayCountry);
    
    return hasInternationalKeyword || isDifferentCountries;
  }

  // ✅ REMOVED: isUgandanMatch method since we're being more strict about league filtering
}

export const leagueNormalizationService = new LeagueNormalizationService(); 