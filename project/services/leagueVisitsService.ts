/**
 * League Visits Tracking Service
 * Tracks user's league visits using AsyncStorage
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

const VISITS_STORAGE_KEY = "@league_visits";

export interface LeagueVisit {
  leagueId: string;
  leagueName: string;
  leagueLogo: string;
  country: string;
  lastVisited: number; // timestamp
  visitCount: number;
  sport?: string; // Sport type (football, basketball, etc.)
}

/**
 * Track a league visit
 */
export const trackLeagueVisit = async (
  leagueId: string,
  leagueName: string,
  leagueLogo: string,
  country: string,
  sport: string = "football"
): Promise<void> => {
  try {
    const visitsData = await AsyncStorage.getItem(VISITS_STORAGE_KEY);
    const visits: LeagueVisit[] = visitsData ? JSON.parse(visitsData) : [];

    // Find existing visit
    const existingIndex = visits.findIndex((v) => v.leagueId === leagueId);

    if (existingIndex >= 0) {
      // Update existing visit
      visits[existingIndex].lastVisited = Date.now();
      visits[existingIndex].visitCount += 1;
      visits[existingIndex].leagueName = leagueName; // Update in case it changed
      visits[existingIndex].leagueLogo = leagueLogo;
      visits[existingIndex].country = country;
      visits[existingIndex].sport = sport;
    } else {
      // Add new visit
      visits.push({
        leagueId,
        leagueName,
        leagueLogo,
        country,
        lastVisited: Date.now(),
        visitCount: 1,
        sport,
      });
    }

    // Sort by last visited (most recent first)
    visits.sort((a, b) => b.lastVisited - a.lastVisited);

    // Keep only last 50 visits
    const recentVisits = visits.slice(0, 50);

    await AsyncStorage.setItem(VISITS_STORAGE_KEY, JSON.stringify(recentVisits));
  } catch (error) {
    console.error("Failed to track league visit:", error);
  }
};

/**
 * Get recent league visits filtered by sport
 */
export const getRecentVisits = async (limit: number = 9, sport?: string): Promise<LeagueVisit[]> => {
  try {
    const visitsData = await AsyncStorage.getItem(VISITS_STORAGE_KEY);
    if (!visitsData) return [];

    let visits: LeagueVisit[] = JSON.parse(visitsData);
    
    // Filter by sport if specified
    if (sport) {
      visits = visits.filter((v) => v.sport === sport || (!v.sport && sport === "football")); // Default old visits to football
    }
    
    return visits.slice(0, limit);
  } catch (error) {
    console.error("Failed to get recent visits:", error);
    return [];
  }
};

/**
 * Clear all visits
 */
export const clearVisits = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(VISITS_STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear visits:", error);
  }
};

/**
 * Get time ago string
 */
export const getTimeAgo = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
};

