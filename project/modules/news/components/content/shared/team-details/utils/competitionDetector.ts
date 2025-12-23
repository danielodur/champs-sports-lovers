/**
 * Competition Detector Utility
 * 
 * This utility smartly detects which competition/league/tournament a team belongs to
 * and returns the correct table templates and tabs to display.
 * 
 * It analyzes team names, league IDs, competition names, and geographic regions
 * to automatically route to the correct table template.
 */

export interface CompetitionTab {
  id: string;
  label: string;
  component: string; // Component name to render
  confederation?: string; // africa, asia, europe, concacaf, south-america, oceania
}

export interface CompetitionDetectionResult {
  detected: boolean;
  competitions: CompetitionTab[];
  primaryCompetition: string; // The main competition to show first
  confederation?: string;
  competitionType?: "national-team" | "club-league"; // NEW: Distinguishes between national team and club competitions
}

/**
 * Detects competition based on team name, country, or league information
 * 
 * Detection Priority:
 * 1. League/Competition name (most specific)
 * 2. Country (most reliable)
 * 3. Team name (fallback)
 * 4. League ID (additional validation)
 */
export function detectCompetition(
  teamName: string,
  leagueId?: number,
  leagueName?: string,
  country?: string,
): CompetitionDetectionResult {
  if (!teamName) {
    return { detected: false, primaryCompetition: "none", competitions: [] };
  }

  const teamLower = teamName.toLowerCase().trim();
  const leagueNameLower = leagueName?.toLowerCase().trim() || "";
  const countryLower = country?.toLowerCase().trim() || "";

  // First, check league/competition name for direct matches (highest priority)
  if (leagueNameLower) {
    // Africa
    if (leagueNameLower.includes("afcon") || 
        leagueNameLower.includes("africa cup") ||
        leagueNameLower.includes("african nations") ||
        leagueNameLower.includes("caf")) {
      return getAfricaCompetitions();
    }

    // Asia
    if (leagueNameLower.includes("afc") || 
        leagueNameLower.includes("asian cup") ||
        leagueNameLower.includes("asia cup") ||
        leagueNameLower.includes("gulf cup")) {
      return getAsiaCompetitions();
    }

    // Europe
    if (leagueNameLower.includes("uefa") || 
        leagueNameLower.includes("euro") ||
        leagueNameLower.includes("european") ||
        leagueNameLower.includes("nations league") ||
        leagueNameLower.includes("champions league") ||
        leagueNameLower.includes("europa league")) {
      return getEuropeCompetitions();
    }

    // CONCACAF
    if (leagueNameLower.includes("concacaf") || 
        leagueNameLower.includes("gold cup") ||
        leagueNameLower.includes("champions cup")) {
      return getConcacafCompetitions();
    }

    // CONMEBOL
    if (leagueNameLower.includes("conmebol") || 
        leagueNameLower.includes("copa america") ||
        leagueNameLower.includes("copa américa") ||
        leagueNameLower.includes("libertadores")) {
      return getConmebolCompetitions();
    }

    // Oceania
    if (leagueNameLower.includes("ofc") || 
        leagueNameLower.includes("oceania")) {
      return getOceaniaCompetitions();
    }
  }

  // ============================================================================
  // AFRICA (CAF) - 54 countries
  // ============================================================================
  const africanCountries = [
    "algeria", "angola", "benin", "botswana", "burkina faso", "burundi",
    "cameroon", "cape verde", "central african republic", "chad", "comoros",
    "congo", "democratic republic of congo", "djibouti", "egypt",
    "equatorial guinea", "eritrea", "eswatini", "ethiopia", "gabon", "gambia",
    "ghana", "guinea", "guinea-bissau", "ivory coast", "kenya", "lesotho",
    "liberia", "libya", "madagascar", "malawi", "mali", "mauritania", "mauritius",
    "morocco", "mozambique", "namibia", "niger", "nigeria", "rwanda",
    "sao tome and principe", "senegal", "seychelles", "sierra leone", "somalia",
    "south africa", "south sudan", "sudan", "tanzania", "togo", "tunisia",
    "uganda", "zambia", "zimbabwe"
  ];

  const isAfricanTeam = africanCountries.some(c => 
    countryLower.includes(c) || teamLower.includes(c)
  );

  if (isAfricanTeam || leagueNameLower.includes("afcon") || leagueNameLower.includes("africa")) {
    return getAfricaCompetitions();
  }

  // ============================================================================
  // ASIA (AFC) - 47 countries
  // ============================================================================
  const asianCountries = [
    "afghanistan", "bahrain", "bangladesh", "bhutan", "brunei", "cambodia",
    "china", "hong kong", "india", "indonesia", "iran", "iraq", "japan",
    "jordan", "kazakhstan", "kuwait", "kyrgyzstan", "laos", "lebanon",
    "macau", "malaysia", "maldives", "mongolia", "myanmar", "nepal",
    "north korea", "oman", "pakistan", "palestine", "philippines", "qatar",
    "saudi arabia", "singapore", "south korea", "sri lanka", "syria",
    "tajikistan", "thailand", "timor-leste", "turkmenistan", "united arab emirates",
    "uzbekistan", "vietnam", "yemen"
  ];

  const isAsianTeam = asianCountries.some(c => 
    countryLower.includes(c) || teamLower.includes(c)
  );

  if (isAsianTeam || leagueNameLower.includes("afc") || leagueNameLower.includes("asia") || leagueNameLower.includes("gulf cup")) {
    return getAsiaCompetitions();
  }

  // ============================================================================
  // EUROPE (UEFA) - 55 countries
  // ============================================================================
  const europeanCountries = [
    "albania", "andorra", "armenia", "austria", "azerbaijan", "belarus",
    "belgium", "bosnia and herzegovina", "bulgaria", "croatia", "cyprus",
    "czech republic", "denmark", "england", "estonia", "faroe islands",
    "finland", "france", "georgia", "germany", "gibraltar", "greece",
    "hungary", "iceland", "ireland", "israel", "italy", "kosovo", "latvia",
    "liechtenstein", "lithuania", "luxembourg", "malta", "moldova", "monaco",
    "montenegro", "netherlands", "north macedonia", "northern ireland", "norway",
    "poland", "portugal", "romania", "russia", "san marino", "scotland",
    "serbia", "slovakia", "slovenia", "spain", "sweden", "switzerland",
    "turkey", "ukraine", "wales"
  ];

  // Check for club teams from major European leagues
  const europeanClubKeywords = [
    "fc", "united", "city", "real", "atletico", "barcelona", "bayern",
    "juventus", "milan", "inter", "paris", "arsenal", "chelsea", "liverpool",
    "manchester", "tottenham", "roma", "napoli", "lazio", "valencia",
    "sevilla", "lyon", "marseille", "monaco", "dortmund", "leipzig"
  ];

  const isEuropeanTeam = europeanCountries.some(c => 
    countryLower.includes(c) || teamLower.includes(c)
  ) || europeanClubKeywords.some(k => teamLower.includes(k));

  // Check for European league IDs (major leagues)
  const europeanLeagueIds = [39, 61, 78, 135, 140, 2, 3, 88, 94]; // EPL, Ligue 1, Bundesliga, Serie A, La Liga, UCL, UEL, Eredivisie, Liga Portugal

  if (
    isEuropeanTeam || 
    (leagueId && europeanLeagueIds.includes(leagueId)) ||
    leagueNameLower.includes("uefa") || 
    leagueNameLower.includes("europe") ||
    leagueNameLower.includes("champions league") ||
    leagueNameLower.includes("europa league")
  ) {
    return getEuropeCompetitions();
  }

  // ============================================================================
  // CONCACAF (North, Central America & Caribbean) - 41 countries
  // ============================================================================
  const concacafCountries = [
    "antigua and barbuda", "aruba", "bahamas", "barbados", "belize", "bermuda",
    "bonaire", "british virgin islands", "canada", "cayman islands", "costa rica",
    "cuba", "curaçao", "dominica", "dominican republic", "el salvador",
    "grenada", "guatemala", "guyana", "haiti", "honduras", "jamaica",
    "martinique", "mexico", "montserrat", "nicaragua", "panama",
    "puerto rico", "saint kitts and nevis", "saint lucia",
    "saint vincent and the grenadines", "sint maarten", "suriname",
    "trinidad and tobago", "turks and caicos islands", "united states",
    "us virgin islands"
  ];

  const isCONCACAFTeam = concacafCountries.some(c => 
    countryLower.includes(c) || teamLower.includes(c)
  );

  if (
    isCONCACAFTeam || 
    leagueNameLower.includes("concacaf") || 
    leagueNameLower.includes("gold cup") ||
    countryLower === "usa" ||
    countryLower === "mexico" ||
    countryLower === "canada"
  ) {
    return getConcacafCompetitions();
  }

  // ============================================================================
  // SOUTH AMERICA (CONMEBOL) - 10 countries
  // ============================================================================
  const conmebolCountries = [
    "argentina", "bolivia", "brazil", "chile", "colombia", "ecuador",
    "paraguay", "peru", "uruguay", "venezuela"
  ];

  const isCONMEBOLTeam = conmebolCountries.some(c => 
    countryLower.includes(c) || teamLower.includes(c)
  );

  if (
    isCONMEBOLTeam || 
    leagueNameLower.includes("conmebol") || 
    leagueNameLower.includes("copa america") ||
    leagueNameLower.includes("libertadores")
  ) {
    return getConmebolCompetitions();
  }

  // ============================================================================
  // OCEANIA (OFC) - 11 countries
  // ============================================================================
  const oceaniaCountries = [
    "american samoa", "cook islands", "fiji", "kiribati", "new caledonia",
    "new zealand", "papua new guinea", "samoa", "solomon islands", "tahiti",
    "tonga", "vanuatu"
  ];

  const isOceaniaTeam = oceaniaCountries.some(c => 
    countryLower.includes(c) || teamLower.includes(c)
  );

  if (
    isOceaniaTeam || 
    leagueNameLower.includes("ofc") || 
    leagueNameLower.includes("oceania")
  ) {
    return getOceaniaCompetitions();
  }

  // ============================================================================
  // DEFAULT / NO DETECTION
  // ============================================================================
  // If no specific confederation is detected, return a generic message
  return {
    detected: false,
    primaryCompetition: "none",
    competitions: [],
  };
}

/**
 * Get confederation from country
 */
export function getConfederationFromCountry(country: string): string | null {
  const countryLower = country.toLowerCase();

  // Quick lookup map for performance
  const confederationMap: { [key: string]: string } = {
    // Africa (sample - full list in detection above)
    "algeria": "africa", "egypt": "africa", "nigeria": "africa", "south africa": "africa",
    "morocco": "africa", "tunisia": "africa", "senegal": "africa", "cameroon": "africa",
    "ghana": "africa", "ivory coast": "africa", "uganda": "africa", "kenya": "africa",
    
    // Asia
    "japan": "asia", "south korea": "asia", "china": "asia", "iran": "asia",
    "saudi arabia": "asia", "qatar": "asia", "australia": "asia", "india": "asia",
    "thailand": "asia", "vietnam": "asia", "iraq": "asia", "united arab emirates": "asia",
    
    // Europe
    "england": "europe", "spain": "europe", "germany": "europe", "italy": "europe",
    "france": "europe", "portugal": "europe", "netherlands": "europe", "belgium": "europe",
    "croatia": "europe", "poland": "europe", "ukraine": "europe", "serbia": "europe",
    
    // CONCACAF
    "mexico": "concacaf", "usa": "concacaf", "united states": "concacaf", "canada": "concacaf",
    "costa rica": "concacaf", "honduras": "concacaf", "jamaica": "concacaf", "panama": "concacaf",
    
    // CONMEBOL
    "brazil": "south-america", "argentina": "south-america", "uruguay": "south-america",
    "colombia": "south-america", "chile": "south-america", "ecuador": "south-america",
    "paraguay": "south-america", "peru": "south-america", "venezuela": "south-america",
    "bolivia": "south-america",
    
    // Oceania
    "new zealand": "oceania", "fiji": "oceania", "papua new guinea": "oceania",
    "solomon islands": "oceania", "new caledonia": "oceania", "tahiti": "oceania",
  };

  return confederationMap[countryLower] || null;
}

/**
 * Enhanced detection with API data
 */
export function detectCompetitionFromApiData(
  teamName: string,
  leagueId?: number,
  leagueName?: string,
  country?: string,
  competitionName?: string,
): CompetitionDetectionResult {
  // First try standard detection
  const standardDetection = detectCompetition(teamName, leagueId, leagueName, country);
  
  if (standardDetection.detected) {
    return standardDetection;
  }

  // If competition name is provided, use it for additional detection
  if (competitionName) {
    const compLower = competitionName.toLowerCase();
    
    if (compLower.includes("afcon") || compLower.includes("africa cup")) {
      return detectCompetition(teamName, leagueId, leagueName, "nigeria"); // Trigger Africa
    }
    
    if (compLower.includes("asian cup") || compLower.includes("afc")) {
      return detectCompetition(teamName, leagueId, leagueName, "japan"); // Trigger Asia
    }
    
    if (compLower.includes("euro") || compLower.includes("uefa")) {
      return detectCompetition(teamName, leagueId, leagueName, "spain"); // Trigger Europe
    }
    
    if (compLower.includes("gold cup") || compLower.includes("concacaf")) {
      return detectCompetition(teamName, leagueId, leagueName, "mexico"); // Trigger CONCACAF
    }
    
    if (compLower.includes("copa america") || compLower.includes("conmebol")) {
      return detectCompetition(teamName, leagueId, leagueName, "brazil"); // Trigger CONMEBOL
    }
    
    if (compLower.includes("ofc") || compLower.includes("oceania")) {
      return detectCompetition(teamName, leagueId, leagueName, "new zealand"); // Trigger Oceania
    }
  }

  return standardDetection;
}

// ============================================================================
// HELPER FUNCTIONS - Returns competition configurations for each confederation
// ============================================================================

function getAfricaCompetitions(): CompetitionDetectionResult {
  return {
    detected: true,
    confederation: "africa",
    primaryCompetition: "fifa-afcon-qualifiers",
    competitionType: "national-team",
    competitions: [
      { id: "fifa-afcon-qualifiers", label: "FIFA AFCON Qualifiers", component: "FIFAAfconQualifiers", confederation: "africa" },
      { id: "afcon-groups", label: "AFCON Groups", component: "AfconGroups", confederation: "africa" },
      { id: "afcon-qualifiers", label: "AFCON Qualifiers", component: "AfconQualifiers", confederation: "africa" },
      { id: "afcon-championships", label: "AFCON Championships", component: "AfconChampionships", confederation: "africa" },
    ],
  };
}

function getAsiaCompetitions(): CompetitionDetectionResult {
  return {
    detected: true,
    confederation: "asia",
    primaryCompetition: "fifa-stage-4-qualifiers",
    competitionType: "national-team",
    competitions: [
      { id: "fifa-stage-4-qualifiers", label: "Stage 4 AFC Qualifiers", component: "FIFAStage4Qualifiers", confederation: "asia" },
      { id: "fifa-stage-3-qualifiers", label: "Stage 3 AFC Qualifiers", component: "FIFAStage3Qualifiers", confederation: "asia" },
      { id: "fifa-stage-2-qualifiers", label: "Stage 2 AFC Qualifiers", component: "FIFAStage2Qualifiers", confederation: "asia" },
      { id: "gulf-cup-groups", label: "Gulf Cup Group Stage", component: "GulfCupGroups", confederation: "asia" },
    ],
  };
}

function getEuropeCompetitions(): CompetitionDetectionResult {
  return {
    detected: true,
    confederation: "europe",
    primaryCompetition: "fifa-uefa-groups-qualifiers",
    competitionType: "national-team",
    competitions: [
      { id: "fifa-uefa-groups-qualifiers", label: "FIFA UEFA Qualifiers", component: "FIFAUEFAGroupsQualifiers", confederation: "europe" },
      { id: "uefa-nations-league-group-a", label: "UEFA Nations League A", component: "UEFANationsLeagueGroupA", confederation: "europe" },
    ],
  };
}

function getConcacafCompetitions(): CompetitionDetectionResult {
  return {
    detected: true,
    confederation: "concacaf",
    primaryCompetition: "fifa-concacaf-stage-3",
    competitionType: "national-team",
    competitions: [
      { id: "fifa-concacaf-stage-3", label: "FIFA CONCACAF Stage 3", component: "FIFACONCACAFStage3", confederation: "concacaf" },
      { id: "fifa-concacaf-stage-2", label: "FIFA CONCACAF Stage 2", component: "FIFACONCACAFStage2", confederation: "concacaf" },
      { id: "gold-cup-groups", label: "CONCACAF Gold Cup Groups", component: "GoldCupGroups", confederation: "concacaf" },
      { id: "concacaf-champions-cup", label: "CONCACAF Champions Cup", component: "CONCACAFChampionsCup", confederation: "concacaf" },
    ],
  };
}

function getConmebolCompetitions(): CompetitionDetectionResult {
  return {
    detected: true,
    confederation: "south-america",
    primaryCompetition: "fifa-conmebol-qualifiers",
    competitionType: "national-team",
    competitions: [
      { id: "fifa-conmebol-qualifiers", label: "FIFA CONMEBOL Qualifiers", component: "FIFACONMEBOLQualifiersTable", confederation: "south-america" },
      { id: "copa-america-groups", label: "Copa América Groups", component: "CopaAmericaGroups", confederation: "south-america" },
    ],
  };
}

function getOceaniaCompetitions(): CompetitionDetectionResult {
  return {
    detected: true,
    confederation: "oceania",
    primaryCompetition: "fifa-oceania-stage-3",
    competitionType: "national-team",
    competitions: [
      { id: "fifa-oceania-stage-3", label: "FIFA OFC Qualifiers Stage 3", component: "FIFAOceaniaStage3", confederation: "oceania" },
      { id: "fifa-oceania-stage-2", label: "FIFA OFC Qualifiers Stage 2", component: "FIFAOceaniaStage2", confederation: "oceania" },
      { id: "fifa-oceania-stage-1", label: "FIFA OFC Qualifiers Stage 1", component: "FIFAOceaniaStage1", confederation: "oceania" },
      { id: "oceania-cup", label: "OFC Oceania Cup", component: "OceaniaCup", confederation: "oceania" },
    ],
  };
}

/**
 * Detect if this is a club league competition (should use UniversalLeagueTable)
 * or a national team competition (should use confederation-specific templates)
 */
export function detectCompetitionType(
  leagueId?: number,
  leagueName?: string,
  teamName?: string,
): "national-team" | "club-league" {
  const leagueNameLower = leagueName?.toLowerCase() || "";
  const teamNameLower = teamName?.toLowerCase() || "";

  // National team competition keywords
  const nationalCompetitionKeywords = [
    "world cup", "afcon", "copa america", "copa américa", "euro", "european championship",
    "asian cup", "gold cup", "nations league", "friendlies", "fifa",
    "confederation", "qualifiers", "oceania cup", "gulf cup",
  ];

  // Check league name for national team keywords
  if (nationalCompetitionKeywords.some(keyword => leagueNameLower.includes(keyword))) {
    return "national-team";
  }

  // Check team name patterns (national teams typically don't have "FC", "United", etc.)
  const clubKeywords = ["fc", "united", "city", "athletic", "sporting", "real", "atletico"];
  if (clubKeywords.some(keyword => teamNameLower.includes(keyword))) {
    return "club-league";
  }

  // League IDs for major club competitions (Champions League, Europa League, etc.)
  const clubCompetitionLeagueIds = [2, 3, 848, 13, 11, 12, 531, 848]; // UCL, UEL, UECL, Copa Libertadores, etc.
  if (leagueId && clubCompetitionLeagueIds.includes(leagueId)) {
    return "club-league";
  }

  // Default: if uncertain, treat as club league (will use UniversalLeagueTable which handles everything)
  return "club-league";
}

