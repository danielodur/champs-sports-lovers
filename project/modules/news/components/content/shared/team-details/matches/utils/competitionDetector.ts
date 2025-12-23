/**
 * Competition Detector Utility
 * 
 * Detects and extracts unique competitions/leagues from team matches
 * Used for creating competition filter tabs in the matches screen
 */

export interface Competition {
  id: string;
  name: string;
  type: "league" | "cup" | "international";
  matchCount: number;
}

interface MatchLike {
  id: string | number;
  competition: string;
  matchStatus?: string;
  date?: string;
}

/**
 * Extracts unique competitions from a list of matches
 * @param matches Array of match objects
 * @returns Array of Competition objects sorted by match count
 */
export const extractCompetitions = (matches: MatchLike[]): Competition[] => {
  const competitionMap = new Map<string, Competition>();

  matches.forEach((match) => {
    const competitionName = match.competition?.trim() || "Other";
    
    // Clean up competition name (remove "Round X", "Week X", etc.)
    const cleanName = cleanCompetitionName(competitionName);
    
    if (competitionMap.has(cleanName)) {
      const comp = competitionMap.get(cleanName)!;
      comp.matchCount += 1;
    } else {
      competitionMap.set(cleanName, {
        id: generateCompetitionId(cleanName),
        name: cleanName,
        type: determineCompetitionType(cleanName),
        matchCount: 1,
      });
    }
  });

  // Convert to array and sort by match count (descending)
  const competitions = Array.from(competitionMap.values()).sort(
    (a, b) => b.matchCount - a.matchCount
  );

  return competitions;
};

/**
 * Cleans competition name by removing round/week/matchday information
 * Example: "Premier League - Round 12" => "Premier League"
 */
const cleanCompetitionName = (name: string): string => {
  // Remove patterns like "- Round X", "- Week X", "- Matchday X", etc.
  const cleaned = name
    .replace(/\s*-\s*(Round|Week|Matchday|Jornada|Gameweek|MD)\s+\d+.*$/i, "")
    .replace(/\s*第\d+轮.*$/i, "") // Remove any remaining non-English round indicators
    .trim();
  
  return cleaned || name;
};

/**
 * Generates a URL-safe ID from competition name
 */
const generateCompetitionId = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
};

/**
 * Determines the type of competition based on name patterns
 */
const determineCompetitionType = (name: string): "league" | "cup" | "international" => {
  const lowerName = name.toLowerCase();
  
  // Cup competitions
  if (
    lowerName.includes("cup") ||
    lowerName.includes("trophy") ||
    lowerName.includes("shield") ||
    lowerName.includes("fa ") ||
    lowerName.includes("carabao") ||
    lowerName.includes("efl")
  ) {
    return "cup";
  }
  
  // International competitions
  if (
    lowerName.includes("champions") ||
    lowerName.includes("europa") ||
    lowerName.includes("uefa") ||
    lowerName.includes("fifa") ||
    lowerName.includes("world") ||
    lowerName.includes("continental") ||
    lowerName.includes("african") ||
    lowerName.includes("caf") ||
    lowerName.includes("confederation")
  ) {
    return "international";
  }
  
  // Default to league
  return "league";
};

/**
 * Filters matches by competition
 * @param matches All matches
 * @param competitionId Competition ID to filter by ("all" for all matches)
 * @returns Filtered matches
 */
export const filterMatchesByCompetition = <T extends MatchLike>(
  matches: T[],
  competitionId: string
): T[] => {
  if (competitionId === "all") {
    return matches;
  }
  
  return matches.filter((match) => {
    const cleanName = cleanCompetitionName(match.competition || "");
    const matchCompId = generateCompetitionId(cleanName);
    return matchCompId === competitionId;
  });
};

/**
 * Gets competition display name with match count
 */
export const getCompetitionDisplayName = (
  competition: Competition,
  showCount: boolean = true
): string => {
  if (showCount) {
    return `${competition.name} (${competition.matchCount})`;
  }
  return competition.name;
};

/**
 * Truncates competition name for tab display
 */
export const truncateCompetitionName = (name: string, maxLength: number = 20): string => {
  if (name.length <= maxLength) {
    return name;
  }
  return name.substring(0, maxLength - 3) + "...";
};

