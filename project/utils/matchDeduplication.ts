import { Match } from "../types/match";

/**
 * Utility functions for match deduplication and consistent key generation
 * to prevent duplicate matches from appearing in lists
 */

/**
 * Removes duplicate matches based on match ID
 * @param matches Array of matches that may contain duplicates
 * @returns Array of unique matches with duplicates removed
 */
export function deduplicateMatches(matches: Match[]): Match[] {
  if (!matches || matches.length === 0) return [];

  // Use Map for better performance with large arrays
  const uniqueMatchesMap = new Map<string, Match>();

  matches.forEach((match) => {
    if (match && match.id) {
      // Only keep the first occurrence of each match ID
      if (!uniqueMatchesMap.has(match.id)) {
        uniqueMatchesMap.set(match.id, match);
      }
    }
  });

  return Array.from(uniqueMatchesMap.values());
}

/**
 * Removes duplicate matches and logs the deduplication process
 * @param matches Array of matches that may contain duplicates
 * @param componentName Name of the component calling this function (for logging)
 * @returns Array of unique matches with duplicates removed
 */
export function deduplicateMatchesWithLogging(
  matches: Match[],
  componentName: string,
): Match[] {
  if (!matches || matches.length === 0) return [];

  const originalCount = matches.length;
  const uniqueMatches = deduplicateMatches(matches);
  const duplicatesRemoved = originalCount - uniqueMatches.length;

  if (duplicatesRemoved > 0) {
    console.log(
      `🔄 ${componentName}: Removed ${duplicatesRemoved} duplicate matches (${originalCount} → ${uniqueMatches.length})`,
    );
  } else {
    console.log(
      `✅ ${componentName}: No duplicates found in ${originalCount} matches`,
    );
  }

  return uniqueMatches;
}

/**
 * Generates consistent keys for FlatList keyExtractor
 * @param match The match object
 * @param prefix Optional prefix to distinguish different list types
 * @returns Unique key string for the match
 */
export function generateMatchKey(
  match: Match,
  prefix: string = "match",
): string {
  if (!match || !match.id) {
    console.warn("⚠️ generateMatchKey: Invalid match object provided");
    return `${prefix}-invalid-${Date.now()}-${Math.random()}`;
  }

  return `${prefix}-${match.id}`;
}

/**
 * Validates that all matches in an array have unique IDs
 * @param matches Array of matches to validate
 * @param componentName Name of the component calling this function (for logging)
 * @returns true if all matches have unique IDs, false otherwise
 */
export function validateUniqueMatches(
  matches: Match[],
  componentName: string,
): boolean {
  if (!matches || matches.length === 0) return true;

  const ids = matches.map((match) => match.id).filter((id) => id);
  const uniqueIds = new Set(ids);

  const isUnique = ids.length === uniqueIds.size;

  if (!isUnique) {
    const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
    console.error(
      `❌ ${componentName}: Found duplicate match IDs:`,
      Array.from(new Set(duplicateIds)),
    );
  }

  return isUnique;
}

/**
 * Comprehensive match processing function that:
 * 1. Removes duplicates
 * 2. Validates uniqueness
 * 3. Logs the process
 * @param matches Array of matches to process
 * @param componentName Name of the component calling this function
 * @returns Processed array of unique matches
 */
export function processMatches(
  matches: Match[],
  componentName: string,
): Match[] {
  if (!matches || matches.length === 0) {
    console.log(`📝 ${componentName}: No matches to process`);
    return [];
  }

  console.log(`📝 ${componentName}: Processing ${matches.length} matches...`);

  // Step 1: Remove duplicates
  const uniqueMatches = deduplicateMatchesWithLogging(matches, componentName);

  // Step 2: Validate uniqueness
  const isValid = validateUniqueMatches(uniqueMatches, componentName);

  if (!isValid) {
    console.error(
      `❌ ${componentName}: Match validation failed after deduplication!`,
    );
  }

  console.log(
    `✅ ${componentName}: Successfully processed ${uniqueMatches.length} unique matches`,
  );

  return uniqueMatches;
}

/**
 * Match key generators for different list types
 */
export const MatchKeyGenerators = {
  live: (match: Match) => generateMatchKey(match, "live"),
  upcoming: (match: Match) => generateMatchKey(match, "upcoming"),
  finished: (match: Match) => generateMatchKey(match, "finished"),
  all: (match: Match) => generateMatchKey(match, "all"),
  fixture: (match: Match) => generateMatchKey(match, "fixture"),
  cancelled: (match: Match) => generateMatchKey(match, "cancelled"),
  followed: (match: Match) => generateMatchKey(match, "followed"),
  topLive: (match: Match) => generateMatchKey(match, "top-live"),
  topUpcoming: (match: Match) => generateMatchKey(match, "top-upcoming"),
  topFinished: (match: Match) => generateMatchKey(match, "top-finished"),
};

/**
 * Default export object with all utilities
 */
const matchDeduplication = {
  deduplicateMatches,
  deduplicateMatchesWithLogging,
  generateMatchKey,
  validateUniqueMatches,
  processMatches,
  MatchKeyGenerators,
};

export default matchDeduplication;
