/**
 * League Navigation Utility
 * Maps competition names to league IDs and handles navigation
 */

export interface Competition {
  id: string;
  name: string;
  country?: string;
  type?: string;
  tier?: number;
}

/**
 * Maps competition names to standardized league IDs
 */
export const getLeagueId = (competitionName: string, competitionId: string): string => {
  const leagueIdMap: { [key: string]: string } = {
    // Top European Leagues
    "Premier League": "premier-league",
    "English Premier League": "premier-league",
    "La Liga": "la-liga",
    "Spanish La Liga": "la-liga",
    "Serie A": "serie-a",
    "Italian Serie A": "serie-a",
    "Bundesliga": "bundesliga",
    "German Bundesliga": "bundesliga",
    "Ligue 1": "ligue-1",
    "French Ligue 1": "ligue-1",
    
    // Other European Leagues
    "Eredivisie": "eredivisie",
    "Primeira Liga": "primeira-liga",
    "Super Lig": "super-lig",
    "Scottish Premiership": "scottish-premiership",
    "Belgian Pro League": "belgian-pro-league",
    "Austrian Bundesliga": "austrian-bundesliga",
    "Swiss Super League": "swiss-super-league",
    
    // European Cups
    "FA Cup": "fa-cup",
    "Copa del Rey": "copa-del-rey",
    "Coppa Italia": "coppa-italia",
    "DFB Pokal": "dfb-pokal",
    "Coupe de France": "coupe-de-france",
    "EFL Cup": "efl-cup",
    "Carabao Cup": "efl-cup",
    
    // Continental Competitions
    "UEFA Champions League": "champions-league",
    "Champions League": "champions-league",
    "Europa League": "europa-league",
    "UEFA Europa League": "europa-league",
    "UEFA Europa Conference League": "conference-league",
    "Conference League": "conference-league",
    
    // International Tournaments
    "World Cup": "world-cup",
    "FIFA World Cup": "world-cup",
    "European Championship": "euro",
    "UEFA Euro": "euro",
    "Africa Cup of Nations": "afcon",
    "AFCON": "afcon",
    "Copa America": "copa-america",
    "Asian Cup": "asian-cup",
    "AFC Asian Cup": "asian-cup",
    
    // Balkan Leagues
    "Serbian SuperLiga": "serbian-superliga",
    "Greek Super League": "greek-super-league",
    "Croatian First League": "croatian-first-league",
    "Romanian Liga 1": "romanian-liga-1",
    "Bulgarian First League": "bulgarian-first-league",
    
    // Nordic Leagues
    "Allsvenskan": "allsvenskan",
    "Eliteserien": "eliteserien",
    "Danish Superliga": "danish-superliga",
    "Finnish Veikkausliiga": "finnish-veikkausliiga",
    
    // Eastern European Leagues
    "Russian Premier League": "russian-premier-league",
    "Ukrainian Premier League": "ukrainian-premier-league",
    "Polish Ekstraklasa": "polish-ekstraklasa",
    "Czech First League": "czech-first-league",
    
    // Middle East Leagues
    "Saudi Pro League": "saudi-pro-league",
    "UAE Pro League": "uae-pro-league",
    "Qatar Stars League": "qatar-stars-league",
    
    // African Leagues
    "Egyptian Premier League": "egyptian-premier-league",
    "South African Premier Division": "south-african-premier-division",
    "Nigerian Professional Football League": "nigerian-premier-league",
    
    // Asian Leagues
    "J1 League": "j1-league",
    "K League 1": "k-league-1",
    "Chinese Super League": "chinese-super-league",
    "Indian Super League": "indian-super-league",
    
    // American Leagues
    "MLS": "mls",
    "Major League Soccer": "mls",
    "Liga MX": "liga-mx",
    "Brazilian Serie A": "brazilian-serie-a",
    "Argentine Primera División": "argentine-primera-division",
  };

  // Try to get mapped ID, otherwise use sanitized competition ID
  return leagueIdMap[competitionName] || competitionId.toLowerCase().replace(/\s+/g, "-");
};

/**
 * Creates navigation params for league details
 */
export const getLeagueNavigationParams = (competition: Competition) => {
  const leagueId = getLeagueId(competition.name, competition.id);
  
  return {
    pathname: "/stats/league-details/[leagueId]" as const,
    params: {
      leagueId: leagueId,
      tab: "standings" as const, // Default to standings tab
      fromStats: "true", // Flag to indicate navigation from stats screen
    },
  };
};

