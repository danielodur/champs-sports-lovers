/**
 * League Slug Generator
 * Converts league names and API IDs to navigation slugs
 */

// Reverse mapping: API ID -> slug (for known leagues)
const apiIdToSlugMap: Record<number, string> = {
  39: "premier-league",
  140: "la-liga",
  78: "bundesliga",
  135: "serie-a",
  61: "ligue-1",
  2: "champions-league",
  3: "europa-league",
  848: "conference-league",
  88: "eredivisie",
  94: "primeira-liga",
  179: "scottish-premiership",
  45: "fa-cup",
  143: "copa-del-rey",
  137: "coppa-italia",
  81: "dfb-pokal",
  66: "coupe-de-france",
  48: "efl-cup",
  253: "mls",
  262: "liga-mx",
  71: "brasileirao",
  128: "primera-division-argentina",
  98: "j1-league",
  292: "k-league-1",
  169: "chinese-super-league",
  307: "saudi-pro-league",
  1: "fifa-world-cup",
  4: "uefa-euro",
  9: "copa-america",
  6: "afcon",
  386: "afc-asian-cup",
  16: "concacaf-gold-cup",
  15: "fifa-club-world-cup",
  5: "uefa-nations-league",
  13: "copa-libertadores",
  11: "copa-sudamericana",
  12: "caf-champions-league",
  14: "caf-confederation-cup",
  17: "afc-champions-league",
  144: "belgian-pro-league",
  218: "austrian-bundesliga",
  207: "swiss-super-league",
  119: "danish-superliga",
  113: "allsvenskan",
  103: "norwegian-eliteserien",
  106: "polish-ekstraklasa",
  345: "czech-first-league",
  333: "ukrainian-premier-league",
  210: "croatian-first-league",
  286: "serbian-superliga",
  203: "turkish-super-lig",
  235: "russian-premier-league",
  288: "south-african-premier-division",
  233: "egyptian-premier-league",
  200: "moroccan-botola-pro",
  301: "qatar-stars-league",
  316: "thai-league-1",
  318: "malaysian-super-league",
  274: "indonesian-liga-1",
  323: "indian-super-league",
  188: "australian-a-league",
};

/**
 * Generate a slug from league name for navigation
 */
export function generateLeagueSlug(leagueName: string): string {
  return leagueName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Get slug from API ID (if known) or generate from name
 */
export function getLeagueSlug(apiId: number, leagueName: string): string {
  // Try known mapping first
  if (apiIdToSlugMap[apiId]) {
    return apiIdToSlugMap[apiId];
  }
  
  // Fallback to generated slug from name
  return generateLeagueSlug(leagueName);
}

/**
 * Get navigation params for a league from API data
 * ✅ CRITICAL: Uses ONLY raw API data - no hardcoded overrides
 */
export function getLeagueNavigationFromApi(
  league: {
    id: number;
    name: string;
    country: string;
    logo: string | null;
  },
  sport: string = "football" // ✅ Add sport parameter with football as default
) {
  const slug = getLeagueSlug(league.id, league.name);
  
  // ✅ CRITICAL: Use raw API data only - no transformations or hardcoded mappings
  // The league details screen will prioritize API response over these params anyway
  return {
    pathname: "/stats/league-details/[leagueId]" as const,
    params: {
      leagueId: slug,
      leagueName: league.name, // ✅ Raw API name
      country: league.country, // ✅ Raw API country - will be overridden by API response if different
      logoUrl: league.logo || "", // ✅ Raw API logo
      apiLeagueId: league.id.toString(), // Pass API ID for direct lookup
      sport: sport, // ✅ CRITICAL: Pass sport to prevent basketball→football collision
    },
  };
}

