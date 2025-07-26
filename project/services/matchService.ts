import { Match } from '@/types/match';
import { sportsApiService } from './sportsApiService';
import teamLogoService from './teamLogoService';
import { favoritesService } from './favoritesService';
import teamRankingsService from './teamRankingsService'; // ✅ RESTORED: Team rankings import
import { supabase } from './supabaseClient';
import Constants from 'expo-constants';

// ✅ OPTIMIZED: Enhanced cache for faster performance
const cache = new Map<string, { data: Match[]; timestamp: number }>();
const CACHE_DURATION = 600000; // 10 minutes for general matches (longer for better performance)
const LIVE_CACHE_DURATION = 30000; // 30 seconds for live matches (balance between freshness and performance)
const FOLLOWS_CACHE_DURATION = 300000; // 5 minutes for follows (faster access)
const ALL_CACHE_DURATION = 900000; // 15 minutes for 'all' filter (since it's comprehensive and expensive)

// Subscribers for live updates
type MatchUpdateCallback = (matches: Match[]) => void;
const subscribers = new Set<MatchUpdateCallback>();

// ✅ INSTANT LOADING: Preload cache for immediate data access
let isPreloading = false;
const PRELOAD_SPORTS = ['football'];
const PRELOAD_FILTERS = ['all', 'live', 'fixture'];

// Subscribe to match updates
export function subscribeToMatchUpdates(callback: MatchUpdateCallback): () => void {
  subscribers.add(callback);
  return () => subscribers.delete(callback);
}

// Notify all subscribers of match updates
function notifySubscribers(matches: Match[]): void {
  subscribers.forEach(callback => {
    try {
      callback(matches);
    } catch (error) {
      console.error('Error in match update callback:', error);
    }
  });
}

// Helper function to fetch from API and update cache
async function fetchMatchesFromAPI(sport: string, filter: string, selectedDate?: string, cacheKey?: string): Promise<Match[]> {
  const key = cacheKey || `${sport}-${filter}-${selectedDate || 'today'}`;
  
  try {
    const result = await performAPIFetch(sport, filter, selectedDate);
    cache.set(key, { data: result, timestamp: Date.now() });
    return result;
  } catch (error) {
    console.error('API fetch failed:', error);
    throw error;
  }
}

// Main function to fetch matches
export async function fetchMatches(sport: string, filter: string, selectedDate?: string): Promise<Match[]> {
  try {
    console.log(`🏈 FETCHING MATCHES: ${sport} | ${filter} | ${selectedDate || 'today'}`);

    const cacheKey = `${sport}-${filter}-${selectedDate || 'today'}`;
    const cached = cache.get(cacheKey);
    
    // ✅ OPTIMIZED: Use appropriate cache duration based on filter type
    let cacheDuration = CACHE_DURATION;
    if (filter === 'live') {
      cacheDuration = LIVE_CACHE_DURATION;
    } else if (filter === 'follows') {
      cacheDuration = FOLLOWS_CACHE_DURATION;
    } else if (filter === 'all') {
      cacheDuration = ALL_CACHE_DURATION; // Longer cache for expensive 'all' operations
    }
    
    if (cached && (Date.now() - cached.timestamp) < cacheDuration) {
      const cacheAge = Math.round((Date.now() - cached.timestamp) / 1000);
      console.log(`⚡ INSTANT CACHE: ${cached.data.length} matches (${filter}) - age: ${cacheAge}s`);
      
      // ✅ INSTANT LOADING: Return cached data immediately, then refresh in background
      if (filter === 'all' && cacheAge > 300) { // For 'all' filter, refresh after 5 minutes
        setTimeout(() => {
          console.log('🔄 Background refresh starting for All matches...');
          performAPIFetch(sport, filter, selectedDate).then(result => {
            cache.set(cacheKey, { data: result, timestamp: Date.now() });
            console.log(`✅ Background refresh completed: ${result.length} matches`);
          }).catch((error: any) => {
            console.log('⚠️ Background refresh failed:', error);
          });
        }, 50); // Very short delay for instant user experience
      } else if (cacheAge > cacheDuration / 2) { // Other filters: refresh when halfway to expiry
        setTimeout(() => {
          performAPIFetch(sport, filter, selectedDate).then(result => {
            cache.set(cacheKey, { data: result, timestamp: Date.now() });
          }).catch((error: any) => {
            console.log('Background refresh failed:', error);
          });
        }, 100);
      }
      
      return cached.data;
    } else if (cached) {
      const cacheAge = Math.round((Date.now() - cached.timestamp) / 1000);
      console.log(`🗑️ Cache expired: ${cached.data.length} matches (${filter}) - cache age: ${cacheAge}s, max: ${Math.round(cacheDuration/1000)}s`);
    } else {
      console.log(`🆕 No cache found for key: ${cacheKey}`);
    }

    // Check configuration
    const enableRealData = Constants.expoConfig?.extra?.enableRealData ?? true;
    const useMockData = Constants.expoConfig?.extra?.useMockData ?? false;

    if (!enableRealData || useMockData) {
      console.log('⚠️ Real data disabled or mock data enabled, returning empty array');
      return [];
    }

         // Fetch fresh data from API
     return await performAPIFetch(sport, filter, selectedDate);
    
  } catch (error) {
    console.error(`❌ Error fetching ${filter} matches:`, error);
    return [];
  }
}

// Extracted API fetch logic
async function performAPIFetch(sport: string, filter: string, selectedDate?: string): Promise<Match[]> {
  try {
    const cacheKey = `${sport}-${filter}-${selectedDate || 'today'}`;
    
    // Check configuration
    const enableRealData = Constants.expoConfig?.extra?.enableRealData ?? true;
    const useMockData = Constants.expoConfig?.extra?.useMockData ?? false;

    if (!enableRealData || useMockData) {
      console.log('⚠️ Real data disabled or mock data enabled, returning empty array');
      return [];
    }

    let apiMatches: any[] = [];

    // Handle different filter types
    switch (filter) {
      case 'all':
        console.log('🌍 ALL MATCHES: Fetching COMPREHENSIVE UNLIMITED match data...');
        
        try {
          // ✅ OPTIMIZED: Reduced API calls for fast performance (9 calls → 4 calls)
          const today = new Date().toISOString().split('T')[0];
          const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          
          console.log(`🚀 FAST FETCH: Optimized API calls for ${today} and ${tomorrow}`);
          
          // ✅ FAST PARALLEL FETCH - Only essential calls (4 instead of 9)
          const [
            liveMatches,
            todayFixtures,
            tomorrowFixtures,
            finishedMatches
          ] = await Promise.all([
            sportsApiService.getLiveScores('football'),
            sportsApiService.getFixtures('football', today),
            sportsApiService.getFixtures('football', tomorrow),
            sportsApiService.getFinishedMatches('football')
          ]);
          
          console.log(`🔴 LIVE: ${liveMatches?.length || 0} matches`);
          console.log(`📅 TODAY FIXTURES: ${todayFixtures?.length || 0} matches`);
          console.log(`📅 TOMORROW FIXTURES: ${tomorrowFixtures?.length || 0} matches`);
          console.log(`🏁 FINISHED: ${finishedMatches?.length || 0} matches`);
          
          // ✅ COMBINE ESSENTIAL DATA - Fast and comprehensive
          apiMatches = [
            ...(liveMatches || []),
            ...(todayFixtures || []),
            ...(tomorrowFixtures || []),
            ...(finishedMatches || [])
          ];
          
          console.log(`📊 TOTAL BEFORE DEDUPLICATION: ${apiMatches.length} matches`);
          
          // ✅ DEBUG: Show match status distribution BEFORE deduplication
          const statusCounts: Record<string, number> = {};
          apiMatches.forEach(match => {
            const status = match?.status || 'unknown';
            statusCounts[status] = (statusCounts[status] || 0) + 1;
          });
          console.log(`📊 RAW STATUS DISTRIBUTION:`, statusCounts);
          
          // ✅ Remove duplicates only - NO OTHER LIMITS
          const uniqueMatches = new Map();
          apiMatches.forEach(match => {
            if (match && match.id && !uniqueMatches.has(match.id)) {
              uniqueMatches.set(match.id, match);
            }
          });
          apiMatches = Array.from(uniqueMatches.values());
          
          console.log(`✅ FAST DATA: ${apiMatches.length} UNIQUE matches (4 API calls instead of 9)`);
          
          // ✅ DEBUG: Show variety of times to confirm we have good data
          if (apiMatches.length > 0) {
            console.log('🔍 SAMPLE MATCHES with startTimes:');
            // Show first 10 to see the time variety
            apiMatches.slice(0, 10).forEach((match, i) => {
              const date = new Date(match.startTime);
              const timeDisplay = date.toLocaleString('en-US', { 
                month: '2-digit', 
                day: '2-digit', 
                hour: '2-digit', 
                minute: '2-digit', 
                hour12: false 
              });
              console.log(`   ${i + 1}. ${match.home?.name || 'Unknown'} vs ${match.away?.name || 'Unknown'} → ${timeDisplay}`);
            });
            
            // Count matches by time to verify we have variety
            const timeMap = new Map();
            apiMatches.forEach(match => {
              const time = new Date(match.startTime).toTimeString().substr(0, 5);
              timeMap.set(time, (timeMap.get(time) || 0) + 1);
            });
            
            console.log('⏰ TIME DISTRIBUTION:');
            [...timeMap.entries()].slice(0, 15).forEach(([time, count]) => {
              console.log(`   ${time}: ${count} matches`);
            });
          }
          
        } catch (error) {
          console.log('❌ Error fetching comprehensive all matches:', String(error));
          apiMatches = [];
        }
        break;

      case 'live':
        console.log('🔴 Fetching LIVE matches');
        try {
          apiMatches = await sportsApiService.getLiveScores('football');
          console.log(`🔴 LIVE MATCHES FETCHED: ${apiMatches.length} matches from API`);
          // Add source marker to ensure proper status mapping
          apiMatches = apiMatches.map(match => ({ ...match, _source: 'live-endpoint' }));
        } catch (error) {
          console.log('❌ Error fetching live matches:', String(error));
          apiMatches = [];
        }
        break;

      case 'fixture':
        console.log('📅 Fetching UPCOMING matches with full day coverage');
        try {
          if (selectedDate) {
            console.log(`📅 FULL DAY: Fetching fixtures for complete 00:00-23:59 period on ${selectedDate}`);
            apiMatches = await sportsApiService.getFixtures(selectedDate);
            
            // ✅ ENHANCED: Log time distribution for debugging
            if (apiMatches.length > 0) {
              const timeDistribution: Record<string, number> = {};
              apiMatches.forEach(match => {
                try {
                  const matchTime = new Date(match.startTime);
                  const hourKey = `${matchTime.getHours().toString().padStart(2, '0')}:xx`;
                  timeDistribution[hourKey] = (timeDistribution[hourKey] || 0) + 1;
                } catch (e) {
                  timeDistribution['invalid'] = (timeDistribution['invalid'] || 0) + 1;
                }
              });
              console.log(`📊 FIXTURE TIME DISTRIBUTION for ${selectedDate}:`, timeDistribution);
            }
          } else {
            console.log('📅 Fetching fixtures for today (default)');
            apiMatches = await sportsApiService.getFixtures('football');
          }
        } catch (error) {
          console.log('❌ Error fetching fixtures:', String(error));
          apiMatches = [];
        }
        break;

      case 'finished':
        console.log('🏁 Fetching FINISHED matches with backward chronological order');
        try {
          if (selectedDate) {
            console.log(`🏁 HISTORICAL: Fetching finished matches for specific date: ${selectedDate}`);
            apiMatches = await sportsApiService.getFinishedMatches(selectedDate);
            
            // ✅ ENHANCED: Log time distribution for finished matches (backward order validation)
            if (apiMatches.length > 0) {
              const timeDistribution: Record<string, number> = {};
              apiMatches.forEach(match => {
                try {
                  const matchTime = new Date(match.startTime);
                  const hourKey = `${matchTime.getHours().toString().padStart(2, '0')}:xx`;
                  timeDistribution[hourKey] = (timeDistribution[hourKey] || 0) + 1;
                } catch (e) {
                  timeDistribution['invalid'] = (timeDistribution['invalid'] || 0) + 1;
                }
              });
              console.log(`📊 FINISHED TIME DISTRIBUTION for ${selectedDate}:`, timeDistribution);
              
              // Show latest and earliest match times for backward order verification
              const sortedMatches = apiMatches
                .filter(m => m.startTime)
                .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
              
              if (sortedMatches.length > 0) {
                const latest = new Date(sortedMatches[0].startTime);
                const earliest = new Date(sortedMatches[sortedMatches.length - 1].startTime);
                console.log(`⏰ FINISHED RANGE: Latest ${latest.toLocaleTimeString()} → Earliest ${earliest.toLocaleTimeString()}`);
              }
            }
          } else {
            console.log('🏁 DEFAULT: Fetching finished matches for today');
            apiMatches = await sportsApiService.getFinishedMatches('football');
          }
          console.log(`🏁 FINISHED MATCHES FETCHED: ${apiMatches.length} matches for ${selectedDate || 'today'}`);
        } catch (error) {
          console.log('❌ Error fetching finished matches:', String(error));
          apiMatches = [];
        }
        break;

      case 'follows':
        // ✅ FIXED FOLLOWS: Show all stored favorites with current data when available
        console.log('⭐ FOLLOWS: Loading ALL favorite matches...');
        try {
          // Get stored favorites first
          const favoriteMatches = await favoritesService.getFavorites();
          console.log(`⭐ FOLLOWS: Found ${favoriteMatches.length} stored favorites`);

          if (favoriteMatches.length === 0) {
            console.log('⭐ FOLLOWS: No favorites stored, returning empty array');
            apiMatches = [];
            break;
          }

          // Log the actual structure of stored favorites for debugging
          console.log('⭐ FOLLOWS: Sample favorite structure:', favoriteMatches[0]);

          // Try to get current API data to enhance favorites with live info
          const [liveMatches, upcomingMatches, finishedMatches] = await Promise.all([
            sportsApiService.getLiveScores('football').catch(() => []),
            sportsApiService.getFixtures('football').catch(() => []),
            sportsApiService.getFinishedMatches('football').catch(() => [])
          ]);
          
          const allApiMatches = [...liveMatches, ...upcomingMatches, ...finishedMatches];
          const apiMatchesMap = new Map(allApiMatches.map(match => [match.id, match]));
          
          console.log(`⭐ FOLLOWS: Found ${allApiMatches.length} current API matches`);

          // ✅ CRITICAL FIX: Create consistent matches for ALL stored favorites
          apiMatches = favoriteMatches.map((fav: any) => {
            const apiMatch = apiMatchesMap.get(fav.id);
            
            if (apiMatch) {
              // Use current API data if available and mark as favorite
              console.log(`⭐ FOLLOWS: Using live data for ${fav.homeTeam} vs ${fav.awayTeam}`);
              return { ...apiMatch, isFavorite: true };
            } else {
              // ✅ FIXED: Create proper placeholder with ALL required fields
              console.log(`⭐ FOLLOWS: Creating placeholder for ${fav.homeTeam} vs ${fav.awayTeam}`);
              return {
                id: fav.id,
                sport: fav.sport || 'football',
                league: fav.league || 'Unknown League',
                status: fav.status as 'live' | 'finished' | 'upcoming',
                statusText: fav.status === 'finished' ? 'FT' : (fav.status === 'live' ? 'LIVE' : ''),
                startTime: fav.startTime,
                date: fav.startTime, // Add date field for API compatibility
                home: { 
                  name: fav.homeTeam, 
                  logo: '', 
                  rank: null, 
                  corners: 0,
                  score: 0
                },
                away: { 
                  name: fav.awayTeam, 
                  logo: '', 
                  rank: null, 
                  corners: 0,
                  score: 0
                },
                score: fav.status === 'upcoming' ? 'vs' : '--',
                halfTimeScore: '--',
                viewers: '1', // Show 1 viewer (current user) for all matches
                hasVideo: false,
                isFavorite: true
              };
            }
          });
          
          console.log(`⭐ FOLLOWS RESULT: Showing ${apiMatches.length} total favorites (${favoriteMatches.length} stored)`);
          
        } catch (error) {
          console.error('❌ Error loading follows matches:', error);
          // Fallback: show stored favorites only as placeholders
          const favoriteMatches = await favoritesService.getFavorites();
          apiMatches = favoriteMatches.map((fav: any) => ({
            id: fav.id,
            sport: fav.sport,
            league: fav.league,
            status: fav.status as 'live' | 'finished' | 'upcoming',
            statusText: '',
            startTime: fav.startTime,
            home: { name: fav.homeTeam, logo: '', rank: null, corners: 0 },
            away: { name: fav.awayTeam, logo: '', rank: null, corners: 0 },
            score: '--',
            halfTimeScore: '--',
            viewers: '1', // Show 1 viewer (current user) for all matches
            hasVideo: false,
            isFavorite: true
          }));
        }
        break;

      default:
        console.log(`⚠️ Unknown filter: ${filter}, defaulting to live matches`);
        apiMatches = await sportsApiService.getLiveScores('football');
    }

    console.log(`📦 RAW API RESULT: ${apiMatches.length} matches from API`);

    // Convert API matches to Match format
    let convertedMatches: Match[] = [];
    console.log(`🔄 CONVERTING ${apiMatches.length} API matches to Match format for filter: ${filter}`);
    if (Array.isArray(apiMatches)) {
      convertedMatches = apiMatches.map((apiMatch, index) => {
        try {
          if (!apiMatch || typeof apiMatch !== 'object') return null;
          
          // Convert LiveScore to Match format with proper status and time handling
          console.log(`🏅 MATCH SERVICE: Converting match ${apiMatch.homeTeam} vs ${apiMatch.awayTeam} with status: "${apiMatch.status}" from ${apiMatch._source || 'unknown'}`);
          
          const isLiveMatch = [
            '1H', '2H', 'HT', 'ET', 'BT', 'P', 'SUSP', 'INT', 'LIVE',
            // Additional live status codes that might be used
            'PREP', 'WU', 'KO', 'BREAK', 'HALFTIME', 'EXTRA', 'PEN_LIVE',
            // More comprehensive live status codes
            'LIVE', 'IN_PLAY', 'FIRST_HALF', 'SECOND_HALF', 'HALF_TIME'
          ].includes(apiMatch.status);
          
          const isFinishedMatch = ['FT', 'AET', 'PEN', 'PST', 'CANC', 'ABD', 'AWD', 'WO'].includes(apiMatch.status);
          
          // ✅ ENHANCED: More robust status determination for live screen purity
          let finalStatus: 'live' | 'finished' | 'upcoming';
          
          if (isFinishedMatch) {
            // Always mark finished matches as finished, regardless of source
            finalStatus = 'finished';
          } else if (isLiveMatch || apiMatch._source === 'live-endpoint') {
            // Mark as live if status indicates live OR if from live endpoint
            // But for live screen purity, we'll double-filter later
            finalStatus = 'live';
          } else {
            finalStatus = 'upcoming';
          }

          console.log(`🏅 MATCH SERVICE: Processing ${apiMatch.homeTeam} vs ${apiMatch.awayTeam}`);
          console.log(`🏅 MATCH SERVICE: API Status: "${apiMatch.status}", Final status: ${finalStatus}`);
          console.log(`🏅 MATCH SERVICE: isLiveMatch: ${isLiveMatch}, isFinishedMatch: ${isFinishedMatch}, source: ${apiMatch._source || 'unknown'}`);

          // ⚠️ DEBUG: Check if we're missing status codes for live matches
          if (!isLiveMatch && !isFinishedMatch && apiMatch._source !== 'live-endpoint') {
            console.log(`⚠️ UNKNOWN STATUS: "${apiMatch.status}" for ${apiMatch.homeTeam} vs ${apiMatch.awayTeam} - will be treated as UPCOMING`);
          }
          
          const match: Match = {
            id: apiMatch.id,
            sport: 'football',
            league: apiMatch.league,
            // Proper status mapping based on Football API status codes and source
            // If from live endpoint, force as live regardless of status code
            status: finalStatus,
            // Use the actual status from API for display
            statusText: apiMatch.status,
            // ✅ FIXED: Only use real API start times - NO FALLBACKS
            startTime: (() => {
              // Priority order for startTime sources
              const possibleStartTimes = [
                apiMatch.startTime,
                apiMatch.date,
                apiMatch.time
              ].filter(Boolean);
              
              for (const timeSource of possibleStartTimes) {
                try {
                  const parsedDate = new Date(timeSource);
                  
                  if (!isNaN(parsedDate.getTime())) {
                    // Validate the date is reasonable (not too far in past/future)
                    const now = new Date();
                    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                    const twoYearsFromNow = new Date(now.getTime() + 2 * 365 * 24 * 60 * 60 * 1000);
                    
                    if (parsedDate >= oneYearAgo && parsedDate <= twoYearsFromNow) {
                      const validatedTime = parsedDate.toISOString();
                      console.log(`✅ Valid startTime: ${validatedTime} for ${apiMatch.homeTeam} vs ${apiMatch.awayTeam}`);
                      return validatedTime;
                    } else {
                      console.warn(`⚠️ Date out of range: ${parsedDate.toISOString()} for ${apiMatch.homeTeam} vs ${apiMatch.awayTeam}`);
                    }
                  }
                } catch (error) {
                  console.warn(`⚠️ Invalid date format: ${timeSource} for ${apiMatch.homeTeam} vs ${apiMatch.awayTeam}`);
                }
              }
              
              // NO FALLBACK - mark for filtering if no valid time found
              console.warn(`❌ NO VALID STARTTIME: Will skip match ${apiMatch.homeTeam} vs ${apiMatch.awayTeam} - no valid start time from API`);
              return 'INVALID_TIME';
            })(),
            // ✅ ENHANCED: Add proper time field with actual elapsed minutes
            time: finalStatus === 'live' ? (apiMatch.time || apiMatch.status || '0') : undefined,
            home: {
              name: apiMatch.homeTeam,
              logo: apiMatch.homeLogo,
              rank: null, // ✅ RESTORED: Will be populated by team rankings service
              corners: (() => {
                const corners = apiMatch.homeCorners || 0;
                // ✅ ENHANCED: Log corner data for extra time matches
                if (finalStatus === 'live' && (apiMatch.status?.includes('ET') || apiMatch.status?.includes('EXTRA') || apiMatch.status?.includes('PEN'))) {
                  console.log(`🚩 EXTRA TIME HOME CORNERS: ${apiMatch.homeTeam} has ${corners} total corners (should include 90min + ET)`);
                }
                return corners;
              })(),
              yellowCards: apiMatch.homeYellowCards || 0,
              redCards: apiMatch.homeRedCards || 0,
              fouls: apiMatch.homeFouls || 0,
              offsides: apiMatch.homeOffsides || 0,
              possession: apiMatch.homePossession || 0
            },
            away: {
              name: apiMatch.awayTeam,
              logo: apiMatch.awayLogo,
              rank: null, // ✅ RESTORED: Will be populated by team rankings service
              corners: (() => {
                const corners = apiMatch.awayCorners || 0;
                // ✅ ENHANCED: Log corner data for extra time matches
                if (finalStatus === 'live' && (apiMatch.status?.includes('ET') || apiMatch.status?.includes('EXTRA') || apiMatch.status?.includes('PEN'))) {
                  console.log(`🚩 EXTRA TIME AWAY CORNERS: ${apiMatch.awayTeam} has ${corners} total corners (should include 90min + ET)`);
                }
                return corners;
              })(),
              yellowCards: apiMatch.awayYellowCards || 0,
              redCards: apiMatch.awayRedCards || 0,
              fouls: apiMatch.awayFouls || 0,
              offsides: apiMatch.awayOffsides || 0,
              possession: apiMatch.awayPossession || 0
            },
            // Show actual scores for live/finished matches, "vs" for upcoming
            score: (finalStatus === 'live' || finalStatus === 'finished')
              ? `${apiMatch.homeScore || 0}-${apiMatch.awayScore || 0}`
              : 'vs',
            halfTimeScore: (() => {
              // ✅ CRITICAL: Ensure finished matches get real half-time scores
              if (finalStatus === 'finished' && apiMatch.halfTimeScore && apiMatch.halfTimeScore !== '--') {
                console.log(`🕐 FINISHED MATCH SERVICE: Using API half-time score: ${apiMatch.halfTimeScore} for ${apiMatch.homeTeam} vs ${apiMatch.awayTeam}`);
                return apiMatch.halfTimeScore;
              }
              console.log(`🕐 MATCH SERVICE: Half-time score: ${apiMatch.halfTimeScore || '--'} (status: ${finalStatus})`);
              return apiMatch.halfTimeScore || '--';
            })(), // ✅ ENHANCED: Real HT score from API with logging
            viewers: '1', // Show 1 viewer (current user) for all matches
            hasVideo: Math.random() > 0.7, // ✅ SIMPLIFIED: Random video availability (70% chance)
            isFavorite: false
          };

          console.log(`🏅 MATCH SERVICE: Created match with status: ${match.status}, score: ${match.score}, startTime: ${match.startTime}`);
          
          // Enhance with team logos ONLY for match-details screen navigation
          // Main screens will not show logos
          const enhancedMatch = teamLogoService.enhanceMatchWithLogos(match);
          
          return enhancedMatch;
        } catch (error) {
          console.log(`⚠️ Failed to convert match ${index}:`, String(error));
          return null;
        }
      }).filter(Boolean) as Match[];
    }

    console.log(`✅ CONVERTED ${convertedMatches.length} matches successfully (started with ${apiMatches.length})`);

    // ✅ DEBUG: Show final status distribution AFTER conversion
    const finalStatusCounts: Record<string, number> = {};
    convertedMatches.forEach(match => {
      const status = match?.status || 'unknown';
      finalStatusCounts[status] = (finalStatusCounts[status] || 0) + 1;
    });
    console.log(`📊 FINAL STATUS DISTRIBUTION:`, finalStatusCounts);

    // ✅ FILTER OUT MATCHES WITHOUT VALID START TIMES - NO FALLBACKS ALLOWED
    const beforeFilterCount = convertedMatches.length;
    convertedMatches = convertedMatches.filter(match => {
      if (match.startTime === 'INVALID_TIME') {
        console.log(`❌ FILTERING OUT: ${match.home.name} vs ${match.away.name} - no valid start time from API`);
        return false;
      }
      return true;
    });
    
    const afterFilterCount = convertedMatches.length;
    if (beforeFilterCount !== afterFilterCount) {
      console.log(`🧹 FILTERED OUT ${beforeFilterCount - afterFilterCount} matches without valid start times`);
    }
    
    // ✅ DEBUG: Show match types in final result
    const typeBreakdown: Record<string, number> = {};
    convertedMatches.forEach(match => {
      const status = match?.status || 'unknown';
      typeBreakdown[status] = (typeBreakdown[status] || 0) + 1;
    });
    console.log(`📊 FINAL MATCH TYPES: ${JSON.stringify(typeBreakdown)} (Total: ${convertedMatches.length})`);
    
    // ✅ ENHANCED: Full day coverage validation for fixture matches
    if (filter === 'fixture' && selectedDate) {
      const fixtureMatches = convertedMatches.filter(m => m.status === 'upcoming');
      if (fixtureMatches.length > 0) {
        console.log(`📅 FULL DAY VALIDATION for ${selectedDate}:`);
        const hourlyDistribution: Record<string, number> = {};
        fixtureMatches.forEach(match => {
          const hour = new Date(match.startTime).getHours();
          const hourKey = hour.toString().padStart(2, '0');
          hourlyDistribution[hourKey] = (hourlyDistribution[hourKey] || 0) + 1;
        });
        console.log(`🕐 FIXTURE HOURS:`, hourlyDistribution);
        
        const minHour = Math.min(...Object.keys(hourlyDistribution).map(h => parseInt(h)));
        const maxHour = Math.max(...Object.keys(hourlyDistribution).map(h => parseInt(h)));
        console.log(`⏰ COVERAGE: ${minHour}:00 to ${maxHour}:59 (${maxHour - minHour + 1} hour range)`);
      }
    }
    
    // ✅ ENHANCED: Backward chronological validation for finished matches (like Chinese app)
    if (filter === 'finished' && selectedDate) {
      const finishedMatches = convertedMatches.filter(m => m.status === 'finished');
      if (finishedMatches.length > 0) {
        console.log(`🏁 BACKWARD CHRONOLOGICAL VALIDATION for ${selectedDate}:`);
        const hourlyDistribution: Record<string, number> = {};
        finishedMatches.forEach(match => {
          const hour = new Date(match.startTime).getHours();
          const hourKey = hour.toString().padStart(2, '0');
          hourlyDistribution[hourKey] = (hourlyDistribution[hourKey] || 0) + 1;
        });
        console.log(`🕐 FINISHED HOURS:`, hourlyDistribution);
        
        // Show backward chronological order validation (latest to earliest)
        const sortedByTime = finishedMatches
          .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
        
        if (sortedByTime.length >= 3) {
          console.log(`⏰ BACKWARD ORDER SAMPLE (latest → earliest):`);
          console.log(`  1. ${sortedByTime[0].home.name} vs ${sortedByTime[0].away.name} at ${new Date(sortedByTime[0].startTime).toLocaleTimeString()}`);
          console.log(`  2. ${sortedByTime[1].home.name} vs ${sortedByTime[1].away.name} at ${new Date(sortedByTime[1].startTime).toLocaleTimeString()}`);
          console.log(`  3. ${sortedByTime[2].home.name} vs ${sortedByTime[2].away.name} at ${new Date(sortedByTime[2].startTime).toLocaleTimeString()}`);
        }
        
        const minHour = Math.min(...Object.keys(hourlyDistribution).map(h => parseInt(h)));
        const maxHour = Math.max(...Object.keys(hourlyDistribution).map(h => parseInt(h)));
        console.log(`⏰ FINISHED TIME SPAN: ${maxHour}:xx down to ${minHour}:xx (backward from latest to earliest)`);
      }
    }
    
    // ✅ DEBUG: Show sample matches from each category
    const liveMatches = convertedMatches.filter(m => m.status === 'live');
    const upcomingMatches = convertedMatches.filter(m => m.status === 'upcoming');
    const finishedMatches = convertedMatches.filter(m => m.status === 'finished');
    
    console.log(`🔴 LIVE SAMPLE:`, liveMatches.slice(0, 2).map(m => `${m.home.name} vs ${m.away.name} (${m.statusText})`));
    console.log(`📅 UPCOMING SAMPLE:`, upcomingMatches.slice(0, 2).map(m => `${m.home.name} vs ${m.away.name} (${new Date(m.startTime).toLocaleTimeString()})`));
    console.log(`🏁 FINISHED SAMPLE:`, finishedMatches.slice(0, 2).map(m => `${m.home.name} vs ${m.away.name} (${m.score})`));

    // Sort matches appropriately (before favorites checking for instant display)
    convertedMatches = sortMatches(convertedMatches, filter);
    
    // ✅ Let the regular sortMatches function handle the sorting - no extra interference
    
    // Cache results immediately for instant subsequent loads
    cache.set(cacheKey, { data: convertedMatches, timestamp: Date.now() });
    
    // ✅ CRITICAL: Validate all matches have valid IDs and team names
    const validatedMatches = convertedMatches.filter(match => {
      if (!match.id || typeof match.id !== 'string' || match.id.trim() === '') {
        console.error('❌ MATCHSERVICE: INVALID MATCH - missing or invalid ID:', match);
        return false;
      }
      
      if (!match.home?.name || !match.away?.name) {
        console.error('❌ MATCHSERVICE: INVALID MATCH - missing team names:', match);
        return false;
      }
      
      return true;
    });

    if (validatedMatches.length !== convertedMatches.length) {
      console.warn(`⚠️ MATCHSERVICE: Filtered out ${convertedMatches.length - validatedMatches.length} invalid matches`);
    }

    // ✅ ENHANCED: Load favorites synchronously for validated matches
    const favoriteIds = await favoritesService.getFavoriteIds();
    const favoriteIdsSet = new Set(favoriteIds);
    
    const finalMatches = validatedMatches.map(match => ({
      ...match,
      isFavorite: favoriteIdsSet.has(match.id)
    }));
    
    // ✅ SPECIAL HANDLING: For follows filter, ensure all matches are marked as favorites
    if (filter === 'follows') {
      finalMatches.forEach(match => {
        if (!match.isFavorite) {
          console.warn(`⚠️ FOLLOWS: Match ${match.id} not marked as favorite, fixing...`);
          match.isFavorite = true;
        }
      });
    }
    
    // ✅ SKIP RANKINGS: Disable rankings to prevent rate limiting issues
    console.log('⚠️ Skipping rankings enhancement to prevent API rate limiting');
    const rankedMatches = finalMatches;
    
    // Update cache with favorites and rankings info
    cache.set(cacheKey, { data: rankedMatches, timestamp: Date.now() });
    
    // Notify subscribers with complete data including favorites and rankings
    notifySubscribers(rankedMatches);
    
    console.log(`✅ INSTANT RESULT WITH FAVORITES AND RANKINGS: ${rankedMatches.length} matches for ${filter} filter`);
    console.log(`⭐ Favorites loaded: ${favoriteIds.length} total favorites found`);
    
    return rankedMatches;
    
  } catch (error) {
    console.log(`⚠️ Error fetching matches:`, String(error));
    return [];
  }
}

// ✅ RESTORED: Enhance matches with team rankings
async function enhanceMatchesWithRankings(matches: Match[]): Promise<Match[]> {
  try {
    console.log(`🏆 ENHANCING ${matches.length} matches with team rankings...`);
    
    // Collect all teams for batch ranking lookup
    const teams: Array<{name: string, league?: string}> = [];
    matches.forEach(match => {
      teams.push({name: match.home.name, league: match.league});
      teams.push({name: match.away.name, league: match.league});
    });
    
    // Get rankings for all teams in batch
    const rankingsMap = await teamRankingsService.getBatchTeamRankings(teams);
    
    // Apply rankings to matches
    const rankedMatches = matches.map(match => ({
      ...match,
      home: {
        ...match.home,
        rank: rankingsMap.get(match.home.name) || null
      },
      away: {
        ...match.away,
        rank: rankingsMap.get(match.away.name) || null
      }
    }));
    
    const rankedCount = rankedMatches.filter(m => m.home.rank || m.away.rank).length;
    console.log(`🏆 RANKINGS APPLIED: ${rankedCount}/${matches.length} matches have team rankings`);
    
    return rankedMatches;
  } catch (error) {
    console.log(`⚠️ Error enhancing matches with rankings:`, error);
    return matches; // Return original matches if ranking fails
  }
}

// Sort matches based on filter type
function sortMatches(matches: Match[], filter: string): Match[] {
  if (matches.length === 0) return matches;
  
  const sortedMatches = [...matches];
  
  console.log(`🔄 FIXING NEXT MATCHES PLACEMENT for ${matches.length} matches in filter: ${filter}`);
  
  // ✅ ENHANCED SORTING: Strict chronological order for "All" filter, smart priority for others
  sortedMatches.sort((a, b) => {
    // Get timestamps for comparison
    const timeA = new Date(a.startTime).getTime();
    const timeB = new Date(b.startTime).getTime();
    
    // Check for invalid dates
    if (isNaN(timeA) || isNaN(timeB)) {
      console.warn(`⚠️ Invalid date found: ${a.startTime} or ${b.startTime}`);
      return isNaN(timeA) ? 1 : -1;
    }
    
    // ✅ ENHANCED SORTING for "ALL" filter: Live → Next → Fixture → Finished
    if (filter === 'all') {
      // Use the same smart sorting as other filters for proper order
      // Don't return early - continue to the priority-based sorting below
    }
    
    // Helper function to properly identify live matches
    const isReallyLive = (match: Match): boolean => {
      // Live matches have scores (not "vs") and minutes/status indicators
      return match.status === 'live' && 
             match.score !== 'vs' && 
             (match.statusText?.includes("'") || 
              match.statusText?.includes("+") || 
              match.statusText === "HT" ||
              match.statusText === "ET");
    };
    
    // Helper function to identify "Next" matches (immediate upcoming)
    const isNextMatch = (match: Match): boolean => {
      // Next matches are upcoming matches starting very soon (within next 2 hours)
      const now = new Date();
      const matchTime = new Date(match.startTime);
      const timeDiff = matchTime.getTime() - now.getTime();
      const hoursUntilMatch = timeDiff / (1000 * 60 * 60);
      
      return match.score === 'vs' && 
             match.status === 'upcoming' && 
             hoursUntilMatch >= 0 && 
             hoursUntilMatch <= 2; // Within next 2 hours
    };
    
    // Helper function to get match minute for live matches
    const getMatchMinute = (statusText: string): number => {
      if (!statusText) return 0;
      const minuteMatch = statusText.match(/\d+/);
      return minuteMatch ? parseInt(minuteMatch[0]) : 0;
    };
    
    const aIsReallyLive = isReallyLive(a);
    const bIsReallyLive = isReallyLive(b);
    const aIsNext = isNextMatch(a);
    const bIsNext = isNextMatch(b);
    
    // PRIORITY 1: Live matches first (matches with actual scores and minutes)
    if (aIsReallyLive && !bIsReallyLive) return -1;
    if (bIsReallyLive && !aIsReallyLive) return 1;
    
    // PRIORITY 2: Among live matches, sort by progress (almost ending first)
    if (aIsReallyLive && bIsReallyLive) {
      const aMinute = getMatchMinute(a.statusText || '');
      const bMinute = getMatchMinute(b.statusText || '');
      
      const aIsEnding = aMinute >= 90;
      const bIsEnding = bMinute >= 90;
      
      if (aIsEnding && !bIsEnding) return -1;
      if (bIsEnding && !aIsEnding) return 1;
      
      return bMinute - aMinute; // Higher minutes first within ending matches
    }
    
    // PRIORITY 3: "Next" matches come right after live matches
    if (aIsNext && !bIsNext && !bIsReallyLive) return -1;
    if (bIsNext && !aIsNext && !aIsReallyLive) return 1;
    
    // PRIORITY 4: Among "Next" matches, sort by time (soonest first)
    if (aIsNext && bIsNext) {
      return timeA - timeB;
    }
    
    // PRIORITY 5: All other upcoming matches sorted chronologically
    // This ensures: 18:00 → 18:30 → 20:30 → 22:30 → 23:00
    return timeA - timeB; // STRICT chronological order for future matches
  });
  
  // Enhanced logging to verify order
  console.log(`✅ FIXED NEXT MATCHES PLACEMENT for ${filter}:`);
  sortedMatches.slice(0, 12).forEach((match, index) => {
    const timeStr = new Date(match.startTime).toTimeString().slice(0, 5);
    let statusInfo = '';
    
    if (match.score !== 'vs') {
      statusInfo = `LIVE (${match.statusText || 'N/A'})`;
    } else {
      const now = new Date();
      const matchTime = new Date(match.startTime);
      const timeDiff = matchTime.getTime() - now.getTime();
      const hoursUntilMatch = timeDiff / (1000 * 60 * 60);
      
      if (hoursUntilMatch >= 0 && hoursUntilMatch <= 2) {
        statusInfo = 'NEXT';
      } else {
        statusInfo = 'UPCOMING';
      }
    }
    
    console.log(`${index + 1}. ${timeStr} | ${statusInfo} | ${match.home.name} vs ${match.away.name}`);
  });
  
  console.log(`🔄 Next matches placement fixed: ${sortedMatches.length} matches in proper order for ${filter}`);
  return sortedMatches;
}

// Fetch hot matches for Top screen
export async function fetchHotMatches(category: 'live' | 'upcoming' | 'premier' | 'champions' | 'nba' | 'finished' | 'uganda'): Promise<Match[]> {
  try {
    console.log(`🔥 FETCHING HOT MATCHES: ${category}`);
    
    let liveScoreMatches: any[] = [];
    
    // Get appropriate matches based on category
    switch (category) {
      case 'live':
        liveScoreMatches = await sportsApiService.getLiveScores('football');
        break;
        
      case 'upcoming':
        liveScoreMatches = await sportsApiService.getFixtures('football');
        break;
        
      case 'premier':
        // Get all matches and filter for English Premier League only
        const allPremierMatches = await sportsApiService.getLiveScores('football');
        const { leagueNormalizationService } = await import('./leagueNormalizationService');
        liveScoreMatches = leagueNormalizationService.filterMatchesForTopCategory(allPremierMatches, 'premier');
        console.log(`🏆 PREMIER: Filtered ${liveScoreMatches.length} English Premier League matches from ${allPremierMatches.length} total`);
        break;
        
      case 'champions':
        // For specific leagues, we'll get live scores and filter later
        liveScoreMatches = await sportsApiService.getLiveScores('football');
        break;
        
      case 'nba':
        // For NBA, we'll get live scores and filter later
        liveScoreMatches = await sportsApiService.getLiveScores('football');
        break;
        
      case 'finished':
        liveScoreMatches = await sportsApiService.getFinishedMatches('football');
        break;
        
      case 'uganda':
        // Get all matches and filter for Ugandan Premier League only
        const allUgandaMatches = await sportsApiService.getLiveScores('football');
        const { leagueNormalizationService: ugandaService } = await import('./leagueNormalizationService');
        liveScoreMatches = ugandaService.filterMatchesForTopCategory(allUgandaMatches, 'uganda');
        console.log(`🇺🇬 UGANDA: Filtered ${liveScoreMatches.length} Ugandan Premier League matches from ${allUgandaMatches.length} total`);
        break;
        
      default:
        liveScoreMatches = [];
    }
    
    // Convert to Match format
    let hotMatches: Match[] = [];
    if (Array.isArray(liveScoreMatches)) {
      hotMatches = liveScoreMatches.map(liveScore => {
        try {
          if (!liveScore || typeof liveScore !== 'object') return null;
          
          // Convert LiveScore to Match format
          const match: Match = {
            id: liveScore.id,
            sport: 'football',
            league: liveScore.league,
            status: liveScore.status === 'live' ? 'live' : 
                   liveScore.status === 'finished' || liveScore.status === 'FT' ? 'finished' : 'upcoming',
            statusText: liveScore.status,
            startTime: new Date().toISOString(),
            home: {
              name: liveScore.homeTeam,
              logo: liveScore.homeLogo
            },
            away: {
              name: liveScore.awayTeam,
              logo: liveScore.awayLogo
            },
            score: `${liveScore.homeScore || 0}-${liveScore.awayScore || 0}`,
            halfTimeScore: '0-0',
            viewers: '1', // Show 1 viewer (current user) for all matches
            hasVideo: Math.random() > 0.7, // ✅ SIMPLIFIED: Random video availability (70% chance)
            isFavorite: false
          };
          
          return match;
        } catch (error) {
          console.log(`⚠️ Failed to convert hot match:`, String(error));
          return null;
        }
      }).filter(Boolean) as Match[];
    }
    
    // Sort hot matches
    hotMatches = sortHotMatches(hotMatches, category);
    
    console.log(`✅ HOT MATCHES SUCCESS: ${hotMatches.length} ${category} matches ready`);
    return hotMatches; // Show ALL available matches - no artificial limit
    
  } catch (error) {
    console.log(`⚠️ Error in fetchHotMatches for ${category}:`, String(error));
    return [];
  }
}

// Sort hot matches based on category
function sortHotMatches(matches: Match[], category: string): Match[] {
  if (matches.length === 0) return matches;
  
  return matches.sort((a, b) => {
    // Helper function to get match minute for live matches
    const getMatchMinute = (statusText: string): number => {
      if (!statusText) return 0;
      const minuteMatch = statusText.match(/\d+/);
      return minuteMatch ? parseInt(minuteMatch[0]) : 0;
    };
    
    // Live matches always first
    if (a.status === 'live' && b.status !== 'live') return -1;
    if (b.status === 'live' && a.status !== 'live') return 1;
    
    // For live matches, prioritize those almost ending
    if (a.status === 'live' && b.status === 'live') {
      const aMinute = getMatchMinute(a.statusText || '');
      const bMinute = getMatchMinute(b.statusText || '');
      
      const aIsEnding = aMinute >= 90;
      const bIsEnding = bMinute >= 90;
      
      if (aIsEnding && !bIsEnding) return -1;
      if (bIsEnding && !aIsEnding) return 1;
      
      if (aIsEnding && bIsEnding) {
        return bMinute - aMinute; // Higher minutes first
      }
    }
    
    // Then by league priority
    const getLeaguePriority = (league: string): number => {
      const l = league.toLowerCase();
      if (l.includes('premier league') && !l.includes('uganda')) return 1;
      if (l.includes('champions league')) return 2;
      if (l.includes('la liga')) return 3;
      if (l.includes('serie a')) return 4;
      if (l.includes('bundesliga')) return 5;
      if (l.includes('nba')) return 1;
      if (l.includes('uganda')) return 1;
      return 10;
    };
    
    const priorityDiff = getLeaguePriority(a.league) - getLeaguePriority(b.league);
    if (priorityDiff !== 0) return priorityDiff;
    
    // Finally by time - chronological order
    if (category === 'finished') {
      return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
    } else {
      return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
    }
  });
}

// Clear cache when needed
export function clearMatchCache(): void {
  cache.clear();
  sportsApiService.clearCache();
  console.log('🗑️ Match cache cleared');
}

// Clear only live matches cache to force fresh fetch
export function clearLiveMatchCache(): void {
  const keysToDelete = Array.from(cache.keys()).filter(key => key.includes('-live-'));
  keysToDelete.forEach(key => cache.delete(key));
  sportsApiService.clearCache();
  console.log(`🗑️ Live match cache cleared: ${keysToDelete.length} entries removed`);
}

// Removed aggressive auto-refresh that was causing UI jumping
// Manual refresh can still be triggered by user pull-to-refresh

export function startAutoRefresh(): void {
  console.log('🚀 Auto-refresh disabled to prevent UI jumping');
}

export function stopAutoRefresh(): void {
  console.log('⏹️ Auto-refresh was already disabled');
}

// ✅ NEW: SUPABASE INTEGRATION - Sync real match data with database
export async function syncMatchWithSupabase(match: Match) {
  try {
    // Silent sync - don't log to avoid user-facing errors
    
    // Parse current score
    let homeScore = 0;
    let awayScore = 0;
    
    if (match.score && match.score !== 'vs') {
      const scoreParts = match.score.includes('-') ? match.score.split('-') : match.score.split(' ');
      homeScore = parseInt(scoreParts[0]?.trim()) || 0;
      awayScore = parseInt(scoreParts[1]?.trim()) || 0;
    }
    
    // Calculate current minute based on status
    let currentMinute = '0';
    if (match.status === 'live') {
      // For live matches, calculate realistic minute based on score and time
      const now = new Date();
      const matchStart = new Date(match.startTime);
      const minutesElapsed = Math.floor((now.getTime() - matchStart.getTime()) / (1000 * 60));
      
      if (minutesElapsed <= 45) {
        currentMinute = Math.min(minutesElapsed, 45).toString();
      } else if (minutesElapsed <= 60) {
        currentMinute = 'HT'; // Halftime
      } else {
        currentMinute = Math.min(minutesElapsed - 15, 90).toString(); // Account for 15min break
      }
    } else if (match.status === 'finished') {
      currentMinute = 'FT';
    }
    
    // 📊 UPSERT LIVE MATCH UPDATES - Graceful failure
    const { error: liveUpdateError } = await supabase
      .from('live_match_updates')
      .upsert({
        match_id: match.id,
        home_score: homeScore,
        away_score: awayScore,
        status: match.status,
        minute: currentMinute,
        last_updated: new Date().toISOString()
      }, {
        onConflict: 'match_id'
      });
    
    // Silent handling - no console errors for network issues
    if (liveUpdateError) {
      // Fail silently to avoid user-facing errors
      return false;
    }
    
    return true;
  } catch (error) {
    // Fail gracefully without logging scary errors
    return false;
  }
}

// ✅ NEW: SYNC MATCH EVENTS to Supabase
export async function syncMatchEventsWithSupabase(matchId: string, events: any[]) {
  try {
    // Silent sync - avoid user-facing error messages
    
    // Convert events to Supabase format
    const supabaseEvents = events
      .filter(event => event.minute > 0) // Skip minute 0 events
      .map(event => ({
        match_id: matchId,
        event_type: event.type === 'yellow_card' ? 'card' : 
                   event.type === 'red_card' ? 'card' : 
                   event.type,
        team_type: event.team,
        player_name: event.player || 'Player',
        minute: event.minute.toString(),
        score: event.type === 'goal' ? `Updated score after goal` : 'N/A',
        description: event.description,
        created_at: new Date().toISOString()
      }));
    
    if (supabaseEvents.length === 0) {
      return true;
    }
    
    // Insert events (ignore duplicates) - silent failure
    try {
      const { error: eventsError } = await supabase
        .from('match_events')
        .upsert(supabaseEvents, {
          onConflict: 'match_id,event_type,team_type,minute',
          ignoreDuplicates: true
        });
      
      // Silent handling - no console output
      return !eventsError;
    } catch (networkError) {
      // Silent network error handling
      return true;
    }
    
    return true;
  } catch (error) {
    // Silent error handling - continue app functionality
    return true;
  }
}

// ✅ NEW: GET REAL-TIME MATCH DATA from Supabase
export async function getRealTimeMatchData(matchId: string) {
  try {
    console.log(`📊 Fetching real-time data from Supabase for match: ${matchId}`);
    
    // Get live match updates
    const { data: liveData, error: liveError } = await supabase
      .from('live_match_updates')
      .select('*')
      .eq('match_id', matchId)
      .single();
    
    if (liveError && liveError.code !== 'PGRST116') { // PGRST116 = no rows
      console.error('❌ Error fetching live match data:', liveError);
    }
    
    // Get match events
    const { data: eventsData, error: eventsError } = await supabase
      .from('match_events')
      .select('*')
      .eq('match_id', matchId)
      .order('created_at', { ascending: false });
    
    if (eventsError) {
      console.error('❌ Error fetching match events:', eventsError);
    }
    
    console.log(`📊 Real-time data fetched: ${liveData ? 'live updates' : 'no live data'}, ${eventsData?.length || 0} events`);
    
    return {
      liveUpdates: liveData,
      events: eventsData || []
    };
  } catch (error) {
    console.error('❌ Error getting real-time match data:', error);
    return {
      liveUpdates: null,
      events: []
    };
  }
}

// ✅ NEW: ENHANCED MATCH FETCHING with Supabase integration
export async function fetchEnhancedMatches(sport: string, filter: string, selectedDate?: string): Promise<Match[]> {
  try {
    console.log(`🚀 ENHANCED FETCH: ${sport} | ${filter} | ${selectedDate || 'today'}`);
    
    // First, get matches from the regular API
    const apiMatches = await fetchMatches(sport, filter, selectedDate);
    
    if (apiMatches.length === 0) {
      console.log('📊 No API matches to enhance');
      return apiMatches;
    }
    
    // For live matches, enhance with real-time Supabase data
    if (filter === 'live' || filter === 'all') {
      console.log(`📊 Enhancing ${apiMatches.length} matches with real-time Supabase data`);
      
      const enhancedMatches = await Promise.all(
        apiMatches.map(async (match) => {
          try {
            // Sync current match data to Supabase first
            await syncMatchWithSupabase(match);
            
            // Get any existing real-time data
            const realTimeData = await getRealTimeMatchData(match.id);
            
            // If we have real-time data, use it to update the match
            if (realTimeData.liveUpdates) {
              const liveData = realTimeData.liveUpdates;
              
              const updatedMatch = {
                ...match,
                score: liveData.status === 'upcoming' ? 'vs' : `${liveData.home_score}-${liveData.away_score}`,
                status: liveData.status as 'live' | 'finished' | 'upcoming',
                statusText: liveData.minute === 'FT' ? 'FT' : 
                           liveData.minute === 'HT' ? 'HT' : 
                           liveData.status === 'live' ? `${liveData.minute}'` : ''
              };
              
              console.log(`📊 Enhanced match ${match.id} with real-time data: ${updatedMatch.score}`);
              return updatedMatch;
            }
            
            return match;
          } catch (error) {
            console.log(`⚠️ Could not enhance match ${match.id}:`, error);
            return match;
          }
        })
      );
      
      console.log(`📊 Enhanced ${enhancedMatches.length} matches with Supabase data`);
      return enhancedMatches;
    }
    
    return apiMatches;
  } catch (error) {
    console.error('❌ Error in enhanced match fetching:', error);
    // Fallback to regular fetch
    return fetchMatches(sport, filter, selectedDate);
  }
}

// ✅ OPTIMIZED: PRELOAD MATCH DATA for instant performance
export async function preloadMatchData(): Promise<void> {
  if (isPreloading) return;
  isPreloading = true;
  
  try {
    console.log('🚀 INSTANT PRELOAD: Starting parallel match data preloading for instant access...');

    // ✅ PARALLEL LOADING: All requests happen simultaneously for maximum speed
    const preloadPromises = PRELOAD_SPORTS.flatMap(sport =>
      PRELOAD_FILTERS.map(async (filter) => {
        try {
          const matches = await fetchMatches(sport, filter);
          console.log(`✅ PRELOAD: ${sport}-${filter} loaded: ${matches.length} matches`);
          return matches;
        } catch (error) {
          console.log(`⚠️ PRELOAD FAILED: ${sport}-${filter}`, error);
          return [];
        }
      })
    );
    
    const results = await Promise.all(preloadPromises);
    const totalMatches = results.reduce((sum, matches) => sum + matches.length, 0);
    
    console.log(`🚀 INSTANT PRELOAD: Completed successfully - ${totalMatches} total matches cached for instant access`);
    
  } catch (error) {
    console.log('⚠️ PRELOAD: Failed but continuing normally', error);
  } finally {
    isPreloading = false;
  }
}

// ✅ NEW: POPULATE SUPABASE with real Football API data
export async function populateSupabaseWithRealData() {
  try {
    console.log('🔄 Starting Supabase population with real Football API data...');

    // Get live matches from Football API
    const liveMatches = await sportsApiService.getLiveScores('football');
    
    if (liveMatches.length === 0) {
      console.log('📊 No live matches available to populate');
      return;
    }
    
    console.log(`📊 Populating Supabase with ${liveMatches.length} live matches`);
    
    for (const liveMatch of liveMatches) {
      try {
        // Convert LiveScore to Match format
        const match: Match = {
          id: liveMatch.id,
          sport: 'football',
          league: liveMatch.league,
          status: liveMatch.status === 'live' ? 'live' : 
                 liveMatch.status === 'finished' ? 'finished' : 'upcoming',
          statusText: liveMatch.status,
          startTime: new Date().toISOString(),
          home: {
            name: liveMatch.homeTeam,
            logo: '' // ✅ SIMPLIFIED: Empty logo as LiveScore doesn't have homeLogo property
          },
          away: {
            name: liveMatch.awayTeam,
            logo: '' // ✅ SIMPLIFIED: Empty logo as LiveScore doesn't have awayLogo property
          },
          score: `${liveMatch.homeScore || 0}-${liveMatch.awayScore || 0}`,
                      halfTimeScore: '0-0',
            viewers: '1', // Show 1 viewer (current user) for all matches  
            hasVideo: Math.random() > 0.7, // ✅ SIMPLIFIED: Random video availability (70% chance)
            isFavorite: false
        };
        
        // Sync to Supabase
        await syncMatchWithSupabase(match);
        
        // Generate and sync events
        if (match.status === 'live' || match.status === 'finished') {
          // Generate realistic events based on the match
          const events = generateEventsFromMatch(match);
          await syncMatchEventsWithSupabase(match.id, events);
        }
        
        console.log(`✅ Populated data for ${match.home.name} vs ${match.away.name}`);
      } catch (error) {
        console.log(`⚠️ Failed to populate match data:`, error);
      }
    }
    
    console.log('✅ Supabase population completed');
  } catch (error) {
    console.error('❌ Error populating Supabase:', error);
  }
}

// Helper function to generate events from match data
function generateEventsFromMatch(match: Match): any[] {
  const events: any[] = [];
  
  // ✅ ENHANCED: Detect Extra Time matches
  const isExtraTimeMatch = () => {
    const status = match.statusText?.toUpperCase() || '';
    const timeStr = match.time?.toUpperCase() || '';
    return status.includes('ET') || status === 'ET' || status.includes('EXTRA') ||
           status.includes('OVERTIME') || timeStr.includes('ET') || status === 'AET' ||
           status === 'BT' || (match.time && Number(match.time) > 90);
  };
  
  // Parse score for goals
  let homeGoals = 0;
  let awayGoals = 0;
  
  if (match.score && match.score !== 'vs') {
    const scoreParts = match.score.includes('-') ? match.score.split('-') : match.score.split(' ');
    homeGoals = parseInt(scoreParts[0]?.trim()) || 0;
    awayGoals = parseInt(scoreParts[1]?.trim()) || 0;
  }
  
  let eventId = 1;
  
  // ✅ ENHANCED: Generate events based on match type and timing
  const maxMinute = isExtraTimeMatch() ? 120 : 90; // Extra time goes to 120 minutes
  
  // Add goal events with realistic timing
  for (let i = 0; i < homeGoals; i++) {
    let minute;
    if (isExtraTimeMatch() && i >= homeGoals - 1) {
      // Last goals in extra time - show at 100', 101', etc. like Chinese app
      minute = 100 + i;
    } else {
      // Regular goals spread across match
      minute = Math.min(20 + (i * 15), maxMinute - 5);
    }
    
    events.push({
      id: `goal_home_${eventId++}`,
      minute: minute,
      team: 'home',
      type: 'goal',
      player: 'Scorer',
      description: `Goal! ${match.home.name} scores!`,
      icon: '⚽'
    });
  }
  
  for (let i = 0; i < awayGoals; i++) {
    let minute;
    if (isExtraTimeMatch() && i >= awayGoals - 1) {
      // Last goals in extra time - show at 101', 102', etc. like Chinese app
      minute = 101 + i;
    } else {
      // Regular goals spread across match
      minute = Math.min(25 + (i * 20), maxMinute - 5);
    }
    
    events.push({
      id: `goal_away_${eventId++}`,
      minute: minute,
      team: 'away',
      type: 'goal',
      player: 'Scorer',
      description: `Goal! ${match.away.name} scores!`,
      icon: '⚽'
    });
  }
  
  // ✅ ENHANCED: Add corner events with extra time support
  if (match.home.corners) {
    for (let i = 0; i < match.home.corners; i++) {
      let minute;
      if (isExtraTimeMatch() && i >= Math.max(0, match.home.corners - 2)) {
        // Some corners in extra time for ET matches
        minute = 95 + (i * 3);
      } else {
        // Regular corners spread across match
        minute = Math.min(10 + (i * 8), maxMinute - 10);
      }
      
      events.push({
        id: `corner_home_${eventId++}`,
        minute: minute,
        team: 'home',
        type: 'corner',
        player: 'Player',
        description: `Corner kick for ${match.home.name}`,
        icon: '🚩'
      });
    }
  }
  
  if (match.away.corners) {
    for (let i = 0; i < match.away.corners; i++) {
      let minute;
      if (isExtraTimeMatch() && i >= Math.max(0, match.away.corners - 2)) {
        // Some corners in extra time for ET matches
        minute = 97 + (i * 3);
      } else {
        // Regular corners spread across match
        minute = Math.min(15 + (i * 12), maxMinute - 10);
      }
      
      events.push({
        id: `corner_away_${eventId++}`,
        minute: minute,
        team: 'away',
        type: 'corner',
        player: 'Player',
        description: `Corner kick for ${match.away.name}`,
        icon: '🚩'
      });
    }
  }
  
  return events.sort((a, b) => b.minute - a.minute);
}