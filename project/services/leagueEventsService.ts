/**
 * League Events Service
 * Detects leagues from finished and upcoming matches
 * Provides fast, cached access to recent/upcoming league events
 */

import { createApiSportsService } from "./api-sports-service";
import cacheService from "./cacheService";
import { getLeagueSlug } from "../utils/leagueSlugGenerator";

export interface LeagueEvent {
  leagueId: string;
  leagueName: string;
  leagueLogo: string;
  country: string;
  matchCount: number;
  apiLeagueId: number;
}

const CACHE_TTL = 2 * 60 * 1000; // 2 minutes cache
const MAX_FETCH_TIME = 15000; // 15 seconds max fetch time (for multiple API calls)

/**
 * Detect leagues from finished matches (recent events)
 */
export async function getRecentLeagueEvents(limit: number = 9, sport: string = "football"): Promise<LeagueEvent[]> {
  const cacheKey = `recent_league_events_${sport}_${limit}`;
  
  // Try cache first (instant return) - but only if it has real data (not just empty slots)
  const cached = await cacheService.get<LeagueEvent[]>(cacheKey);
  if (cached !== null && cached.length > 0) {
    const realData = cached.filter(e => e.matchCount > 0 && e.apiLeagueId > 0);
    if (realData.length > 0) {
      console.log(`📦 [LeagueEvents] Using cached recent events for ${sport}: ${realData.length} leagues`);
      return cached;
    }
  }

  try {
    const fetchPromise = fetchRecentLeagueEventsInternal(limit, sport);
    const data = await Promise.race([
      fetchPromise,
      new Promise<LeagueEvent[]>((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), MAX_FETCH_TIME)
      )
    ]);
    
    // Only cache if we have real data (not just empty slots)
    const realData = data.filter(e => e.matchCount > 0 && e.apiLeagueId > 0);
    if (realData.length > 0) {
      await cacheService.set(cacheKey, data, CACHE_TTL);
      console.log(`✅ [LeagueEvents] Recent events fetched for ${sport}: ${realData.length} leagues with data`);
    } else {
      console.warn(`⚠️ [LeagueEvents] No recent events found for ${sport} - not caching empty result`);
    }
    
    return data;
  } catch (error) {
    // Return cached data if available, otherwise empty
    if (cached && cached.length > 0) {
      console.log(`📦 [LeagueEvents] Fetch timed out, using cached recent events for ${sport}: ${cached.filter(e => e.matchCount > 0).length} with data`);
      return cached;
    }
    // Only log error if we have no fallback data
    console.warn(`⚠️ [LeagueEvents] Fetch timed out and no cached data available for ${sport}`);
    return [];
  }
}

/**
 * Internal function to fetch recent league events
 */
async function fetchRecentLeagueEventsInternal(limit: number, sport: string = "football"): Promise<LeagueEvent[]> {
  const apiService = createApiSportsService();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const leagueMap = new Map<number, {
    league: any;
    matchCount: number;
    lastMatchDate: Date;
  }>();

  // Fetch matches from last 7 days to get more data
  const datesToFetch: string[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    datesToFetch.push(date.toISOString().split("T")[0]);
  }

  console.log(`📅 [LeagueEvents] Fetching recent events from ${datesToFetch.length} dates`);

  // Fetch matches for each date in parallel (but limit concurrency)
  const fetchPromises = datesToFetch.map(async (dateStr) => {
    try {
      console.log(`🔄 [LeagueEvents] Fetching ${sport} fixtures for ${dateStr}...`);
      const response = await apiService.getFixtures(
        undefined,
        undefined,
        undefined,
        dateStr,
        undefined,
        undefined,
        sport
      );

      if (!response) {
        console.warn(`⚠️ [LeagueEvents] No response object for date ${dateStr}`);
        return;
      }

      if (!response.response || !Array.isArray(response.response)) {
        console.warn(`⚠️ [LeagueEvents] Invalid response structure for ${dateStr}:`, {
          hasResponse: !!response.response,
          isArray: Array.isArray(response.response),
          responseKeys: Object.keys(response),
        });
        return;
      }

      if (response.response.length === 0) {
        console.log(`ℹ️ [LeagueEvents] No fixtures found for ${dateStr}`);
        return;
      }

      let matchCount = 0;
      response.response.forEach((fixture: any) => {
        if (!fixture || !fixture.fixture || !fixture.league) {
          return;
        }

        const status = fixture.fixture?.status?.short;
        if (["FT", "AET", "PEN", "CANC", "ABD"].includes(status)) {
          const league = fixture.league;
          if (league?.id) {
            const existing = leagueMap.get(league.id);
            if (existing) {
              existing.matchCount += 1;
              const matchDate = new Date(fixture.fixture.date);
              if (matchDate > existing.lastMatchDate) {
                existing.lastMatchDate = matchDate;
              }
            } else {
              leagueMap.set(league.id, {
                league,
                matchCount: 1,
                lastMatchDate: new Date(fixture.fixture.date),
              });
            }
            matchCount++;
          }
        }
      });

      if (matchCount > 0) {
        console.log(`✅ [LeagueEvents] Found ${matchCount} finished matches for ${dateStr} (${response.response.length} total fixtures)`);
      } else {
        console.log(`ℹ️ [LeagueEvents] No finished matches found for ${dateStr} (${response.response.length} total fixtures)`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`❌ [LeagueEvents] Error fetching matches for ${dateStr}:`, errorMsg);
    }
  });

  // Wait for all fetches to complete
  await Promise.all(fetchPromises);

  console.log(`📊 [LeagueEvents] Total leagues found: ${leagueMap.size}`);

  // Convert to array and sort by most recent match date
  const leagueEvents: LeagueEvent[] = Array.from(leagueMap.values())
    .sort((a, b) => b.lastMatchDate.getTime() - a.lastMatchDate.getTime())
    .slice(0, limit)
    .map((item) => ({
      leagueId: getLeagueSlug(item.league.id, item.league.name),
      leagueName: item.league.name,
      leagueLogo: item.league.logo || "",
      country: item.league.country || "",
      matchCount: item.matchCount,
      apiLeagueId: item.league.id,
    }));

  console.log(`✅ [LeagueEvents] Returning ${leagueEvents.length} recent league events`);

  // Only fill empty slots if we have less than 3 leagues (to show at least some data)
  // Otherwise, return what we have
  if (leagueEvents.length < 3) {
    while (leagueEvents.length < limit) {
      leagueEvents.push({
        leagueId: `empty-${leagueEvents.length}`,
        leagueName: "No Events",
        leagueLogo: "",
        country: "",
        matchCount: 0,
        apiLeagueId: 0,
      });
    }
  }

  return leagueEvents.slice(0, limit);
}

/**
 * Detect leagues from upcoming matches
 */
export async function getUpcomingLeagueEvents(limit: number = 9, sport: string = "football"): Promise<LeagueEvent[]> {
  const cacheKey = `upcoming_league_events_${sport}_${limit}`;
  
  // Try cache first (instant return) - but only if it has real data (not just empty slots)
  const cached = await cacheService.get<LeagueEvent[]>(cacheKey);
  if (cached !== null && cached.length > 0) {
    const realData = cached.filter(e => e.matchCount > 0 && e.apiLeagueId > 0);
    if (realData.length > 0) {
      console.log(`📦 [LeagueEvents] Using cached upcoming events for ${sport}: ${realData.length} leagues`);
      return cached;
    }
  }

  try {
    const fetchPromise = fetchUpcomingLeagueEventsInternal(limit, sport);
    const data = await Promise.race([
      fetchPromise,
      new Promise<LeagueEvent[]>((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), MAX_FETCH_TIME)
      )
    ]);
    
    // Only cache if we have real data (not just empty slots)
    const realData = data.filter(e => e.matchCount > 0 && e.apiLeagueId > 0);
    if (realData.length > 0) {
      await cacheService.set(cacheKey, data, CACHE_TTL);
      console.log(`✅ [LeagueEvents] Upcoming events fetched for ${sport}: ${realData.length} leagues with data`);
    } else {
      console.warn(`⚠️ [LeagueEvents] No upcoming events found for ${sport} - not caching empty result`);
    }
    
    return data;
  } catch (error) {
    // Return cached data if available, otherwise empty
    if (cached && cached.length > 0) {
      console.log(`📦 [LeagueEvents] Fetch timed out, using cached upcoming events for ${sport}: ${cached.filter(e => e.matchCount > 0).length} with data`);
      return cached;
    }
    // Only log error if we have no fallback data
    console.warn(`⚠️ [LeagueEvents] Fetch timed out and no cached data available for ${sport}`);
    return [];
  }
}

/**
 * Internal function to fetch upcoming league events
 */
async function fetchUpcomingLeagueEventsInternal(limit: number, sport: string = "football"): Promise<LeagueEvent[]> {
  const apiService = createApiSportsService();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const leagueMap = new Map<number, {
    league: any;
    matchCount: number;
  }>();

  // Fetch matches from next 14 days to get more data
  const datesToFetch: string[] = [];
  for (let i = 0; i < 14; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    datesToFetch.push(date.toISOString().split("T")[0]);
  }

  console.log(`📅 [LeagueEvents] Fetching upcoming events from ${datesToFetch.length} dates`);

  // Fetch matches for each date (limit concurrency to avoid rate limits)
  const batchSize = 3;
  for (let i = 0; i < datesToFetch.length; i += batchSize) {
    const batch = datesToFetch.slice(i, i + batchSize);
    const batchPromises = batch.map(async (dateStr) => {
      try {
        console.log(`🔄 [LeagueEvents] Fetching upcoming ${sport} fixtures for ${dateStr}...`);
        const response = await apiService.getFixtures(
          undefined,
          undefined,
          undefined,
          dateStr,
          undefined,
          undefined,
          sport
        );

        if (!response) {
          console.warn(`⚠️ [LeagueEvents] No response object for date ${dateStr}`);
          return;
        }

        if (!response.response || !Array.isArray(response.response)) {
          console.warn(`⚠️ [LeagueEvents] Invalid response structure for ${dateStr}:`, {
            hasResponse: !!response.response,
            isArray: Array.isArray(response.response),
          });
          return;
        }

        if (response.response.length === 0) {
          console.log(`ℹ️ [LeagueEvents] No fixtures found for ${dateStr}`);
          return;
        }

        let matchCount = 0;
        response.response.forEach((fixture: any) => {
          if (!fixture || !fixture.fixture || !fixture.league) {
            return;
          }

          const status = fixture.fixture?.status?.short;
          const matchDate = new Date(fixture.fixture.date);
          const todayDate = new Date(today);

          // Only include future matches (not started)
          if (matchDate >= todayDate) {
            if (["NS", "TBD", "PST"].includes(status)) {
              const league = fixture.league;
              if (league?.id) {
                const existing = leagueMap.get(league.id);
                if (existing) {
                  existing.matchCount += 1;
                } else {
                  leagueMap.set(league.id, {
                    league,
                    matchCount: 1,
                  });
                }
                matchCount++;
              }
            }
          }
        });

        if (matchCount > 0) {
          console.log(`✅ [LeagueEvents] Found ${matchCount} upcoming matches for ${dateStr} (${response.response.length} total fixtures)`);
        } else {
          console.log(`ℹ️ [LeagueEvents] No upcoming matches found for ${dateStr} (${response.response.length} total fixtures)`);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`❌ [LeagueEvents] Error fetching upcoming matches for ${dateStr}:`, errorMsg);
      }
    });

    await Promise.all(batchPromises);
    
    // Small delay between batches to avoid rate limits
    if (i + batchSize < datesToFetch.length) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  console.log(`📊 [LeagueEvents] Total upcoming leagues found: ${leagueMap.size}`);

  // Convert to array and sort by match count (most matches first)
  const leagueEvents: LeagueEvent[] = Array.from(leagueMap.values())
    .sort((a, b) => b.matchCount - a.matchCount)
    .slice(0, limit)
    .map((item) => ({
      leagueId: getLeagueSlug(item.league.id, item.league.name),
      leagueName: item.league.name,
      leagueLogo: item.league.logo || "",
      country: item.league.country || "",
      matchCount: item.matchCount,
      apiLeagueId: item.league.id,
    }));

  console.log(`✅ [LeagueEvents] Returning ${leagueEvents.length} upcoming league events`);

  // Only fill empty slots if we have less than 3 leagues (to show at least some data)
  // Otherwise, return what we have
  if (leagueEvents.length < 3) {
    while (leagueEvents.length < limit) {
      leagueEvents.push({
        leagueId: `empty-${leagueEvents.length}`,
        leagueName: "No Events",
        leagueLogo: "",
        country: "",
        matchCount: 0,
        apiLeagueId: 0,
      });
    }
  }

  return leagueEvents.slice(0, limit);
}
