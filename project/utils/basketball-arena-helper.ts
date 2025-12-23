/**
 * Basketball Arena/Country Helper
 * Determines whether to display arena name or country name for basketball teams
 * 
 * Logic:
 * - NBA teams with prominent arenas → Show arena name
 * - Smaller basketball teams → Show country name instead
 */

export interface BasketballTeamVenueInfo {
  teamName: string;
  arenaName?: string;
  country?: string;
  displayValue: string; // What to actually display
}

// NBA teams with prominent, well-known arenas
const NBA_TEAMS_WITH_PROMINENT_ARENAS: Record<string, string> = {
  // Western Conference
  "Los Angeles Lakers": "Crypto.com Arena",
  "Los Angeles Clippers": "Crypto.com Arena",
  "Golden State Warriors": "Chase Center",
  "Phoenix Suns": "Footprint Center",
  "Sacramento Kings": "Golden 1 Center",
  "Portland Trail Blazers": "Moda Center",
  "Dallas Mavericks": "American Airlines Center",
  "Houston Rockets": "Toyota Center",
  "San Antonio Spurs": "AT&T Center",
  "Memphis Grizzlies": "FedExForum",
  "New Orleans Pelicans": "Smoothie King Center",
  "Denver Nuggets": "Ball Arena",
  "Utah Jazz": "Delta Center",
  "Minnesota Timberwolves": "Target Center",
  "Oklahoma City Thunder": "Paycom Center",
  
  // Eastern Conference
  "Boston Celtics": "TD Garden",
  "Brooklyn Nets": "Barclays Center",
  "New York Knicks": "Madison Square Garden",
  "Philadelphia 76ers": "Wells Fargo Center",
  "Toronto Raptors": "Scotiabank Arena",
  "Milwaukee Bucks": "Fiserv Forum",
  "Chicago Bulls": "United Center",
  "Cleveland Cavaliers": "Rocket Mortgage FieldHouse",
  "Detroit Pistons": "Little Caesars Arena",
  "Indiana Pacers": "Gainbridge Fieldhouse",
  "Atlanta Hawks": "State Farm Arena",
  "Charlotte Hornets": "Spectrum Center",
  "Miami Heat": "Kaseya Center",
  "Orlando Magic": "Amway Center",
  "Washington Wizards": "Capital One Arena",
};

// EuroLeague teams with prominent arenas
const EUROLEAGUE_PROMINENT_ARENAS: Record<string, string> = {
  "Real Madrid": "WiZink Center",
  "Barcelona": "Palau Blaugrana",
  "Fenerbahce": "Ülker Sports Arena",
  "CSKA Moscow": "Megasport Arena",
  "Panathinaikos": "OAKA",
  "Olympiacos": "Peace and Friendship Stadium",
  "Maccabi Tel Aviv": "Menora Mivtachim Arena",
  "Zalgiris": "Zalgirio Arena",
};

/**
 * Get venue display information for a basketball team
 * @param teamName - Name of the basketball team
 * @param arenaName - Optional arena name from API
 * @param country - Optional country from API
 * @returns Object with display information
 */
export function getBasketballVenueDisplay(
  teamName: string,
  arenaName?: string,
  country?: string
): BasketballTeamVenueInfo {
  // Check if this is an NBA team with a prominent arena
  const nbaArena = NBA_TEAMS_WITH_PROMINENT_ARENAS[teamName];
  if (nbaArena) {
    return {
      teamName,
      arenaName: nbaArena,
      country: "USA",
      displayValue: nbaArena, // ✅ Show arena for NBA teams
    };
  }
  
  // Check if this is a EuroLeague team with a prominent arena
  const euroArena = EUROLEAGUE_PROMINENT_ARENAS[teamName];
  if (euroArena) {
    return {
      teamName,
      arenaName: euroArena,
      country: country || "Europe",
      displayValue: euroArena, // ✅ Show arena for major EuroLeague teams
    };
  }
  
  // For smaller/unknown teams, prefer showing country
  if (country) {
    return {
      teamName,
      arenaName,
      country,
      displayValue: country, // ✅ Show country for smaller teams
    };
  }
  
  // Fallback: If we have arena name but no country mapping, show arena
  if (arenaName) {
    return {
      teamName,
      arenaName,
      country,
      displayValue: arenaName,
    };
  }
  
  // Ultimate fallback
  return {
    teamName,
    arenaName,
    country,
    displayValue: teamName, // Show team name as last resort
  };
}

/**
 * Check if a team is an NBA team
 */
export function isNBATeam(teamName: string): boolean {
  return teamName in NBA_TEAMS_WITH_PROMINENT_ARENAS;
}

/**
 * Check if a team is a major EuroLeague team
 */
export function isEuroLeagueProminentTeam(teamName: string): boolean {
  return teamName in EUROLEAGUE_PROMINENT_ARENAS;
}

/**
 * Check if team should show arena (vs country)
 */
export function shouldShowArena(teamName: string): boolean {
  return isNBATeam(teamName) || isEuroLeagueProminentTeam(teamName);
}
