/**
 * HYBRID API SERVICE - Best of Both Worlds
 * 
 * STRATEGY:
 * 1. ✅ TRY backend cache first (fast, reduces API calls)
 * 2. ✅ FALLBACK to direct API if backend fails (reliability)
 * 3. ✅ PRESERVE all original behavior (no logic changes)
 * 
 * This ensures:
 * - Fast loading when backend works
 * - Still works even if Edge Function fails
 * - No dependency on backend availability
 */

import { ApiSportsService } from './api-sports-service'
import { backendApiService } from './backendApiService'
import { theSportsDbApiService } from './theSportsDbApiService'
import { directCacheService } from './directCacheService'
import {
  FootballFixturesResponse,
  Fixture,
} from '../types/football-fixtures-response'
import Constants from 'expo-constants'

export class HybridApiService {
  private directApiService: ApiSportsService
  private theSportsDbService = theSportsDbApiService
  private directCacheService = directCacheService
  private backendTimeoutMs = 15000 // 15 seconds max for backend (Edge Functions can be slow on cold start)
  private useDirectCache = true // ✅ ENABLED: Read directly from Supabase cache table (bypasses failing Edge Function)
  private useBackendCache = false // ⚠️ DISABLED: Backend Edge Function is broken, timing out after 15s
  private useTheSportsDb = true // ✅ ENABLED: Use TheSportsDB as fallback

  constructor(config?: any) {
    // Initialize direct API service as fallback
    // ✅ CRITICAL: Read DIRECTLY from process.env, NOT from Constants.expoConfig.extra
    // The app.json stores variable NAMES, not VALUES!
    const apiKey = 
      process.env.EXPO_PUBLIC_API_FOOTBALL_KEY ||
      process.env.EXPO_PUBLIC_THE_SPORTSDB_API_KEY ||
      ''

    console.log('🔍 [HybridAPI] Checking API keys from .env.local:')
    console.log('   - EXPO_PUBLIC_API_FOOTBALL_KEY:', process.env.EXPO_PUBLIC_API_FOOTBALL_KEY ? '✅ Found' : '❌ Not found')
    console.log('   - EXPO_PUBLIC_THE_SPORTSDB_API_KEY:', process.env.EXPO_PUBLIC_THE_SPORTSDB_API_KEY ? '✅ Found' : '❌ Not found')

    if (!apiKey) {
      console.error('❌ [HybridAPI] API key not found! Check your .env.local file')
      console.error('   Expected: EXPO_PUBLIC_API_FOOTBALL_KEY or EXPO_PUBLIC_THE_SPORTSDB_API_KEY')
      console.error('   Make sure your .env.local file exists in the project root')
    } else {
      const keyPreview = apiKey.substring(0, 8)
      // Check if we're accidentally reading the variable name instead of value
      if (keyPreview === 'EXPO_PUB') {
        console.error('❌ [HybridAPI] CRITICAL ERROR: Reading variable NAME instead of VALUE!')
        console.error('   This means environment variables are not loading properly')
        console.error('   Try restarting Metro bundler with: npx expo start -c')
      } else {
        console.log('✅ [HybridAPI] API key loaded successfully:', keyPreview + '...')
      }
    }

    this.directApiService = new ApiSportsService({
      apiKey,
      baseUrl: 'https://v3.football.api-sports.io',
      timeout: 15000,
      retryAttempts: 3,
      enableCaching: true,
      cacheExpiry: 5 * 60 * 1000, // 5 minutes
    })

    console.log('🔄 [HybridAPI] Initialized (Direct API only - backend disabled)')
  }

  /**
   * Get fixtures - EXACT same interface as original ApiSportsService
   * 
   * STRATEGY:
   * 1. Try backend (with timeout)
   * 2. If fails, use direct API
   * 3. Return in expected format
   */
  async getFixtures(
    team?: string,
    league?: string,
    season?: string,
    date?: string,
    status?: string,
    live?: string,
    sport: string = 'football',
  ): Promise<FootballFixturesResponse> {
    const startTime = Date.now()
    console.log(`🎯 [HybridAPI] getFixtures:`, {
      team,
      league,
      season,
      date,
      status,
      live,
      sport,
    })

    // STRATEGY 1: Try direct cache (bypasses failing Edge Function!)
    if (this.useDirectCache) {
      try {
        console.log(`📦 [HybridAPI] Trying direct cache first (bypassing Edge Function)...`)
        
        let cacheMatches: any[] = []
        
        // Determine which cache to read based on parameters
        if (live === 'all' || status === '1H' || status === '2H' || status === 'HT') {
          cacheMatches = await this.directCacheService.getLiveMatches(sport)
        } else if (status === 'FT' || status === 'AET' || status === 'PEN') {
          cacheMatches = await this.directCacheService.getFinishedMatches(sport, date)
        } else {
          cacheMatches = await this.directCacheService.getFixtures(sport, date)
        }
        
        if (cacheMatches && cacheMatches.length > 0) {
          const elapsed = Date.now() - startTime
          console.log(`✅ [HybridAPI] Direct cache success! ${cacheMatches.length} matches in ${elapsed}ms`)
          
          // Apply additional filters
          const filtered = this.applyFilters(cacheMatches, { team, league, date, status, live })
          
          return {
            get: 'fixtures',
            parameters: { team, league, season, date, status, live },
            errors: [],
            results: filtered.length,
            paging: { current: 1, total: 1 },
            response: filtered as Fixture[],
          }
        } else {
          console.warn(`⚠️ [HybridAPI] Direct cache empty or old, trying APIs...`)
        }
      } catch (error: any) {
        console.warn(`⚠️ [HybridAPI] Direct cache failed (${error.message}), trying APIs...`)
      }
    }

    // STRATEGY 2: Try backend via Edge Function (if enabled - currently disabled)
    if (this.useBackendCache) {
      try {
        console.log(`⚡ [HybridAPI] Trying backend cache first...`)
        
        const backendPromise = this.fetchFromBackend(sport, date, status, live)
        const timeoutPromise = new Promise<null>((_, reject) => 
          setTimeout(() => reject(new Error('Backend timeout')), this.backendTimeoutMs)
        )

        const backendMatches = await Promise.race([backendPromise, timeoutPromise])
        
        if (backendMatches && backendMatches.length > 0) {
          const elapsed = Date.now() - startTime
          console.log(`✅ [HybridAPI] Backend success! ${backendMatches.length} matches in ${elapsed}ms`)
          
          // Apply additional filters
          const filtered = this.applyFilters(backendMatches, { team, league, date, status, live })
          
          return {
            get: 'fixtures',
            parameters: { team, league, season, date, status, live },
            errors: [],
            results: filtered.length,
            paging: { current: 1, total: 1 },
            response: filtered as Fixture[],
          }
        }
      } catch (error: any) {
        console.warn(`⚠️ [HybridAPI] Backend failed (${error.message}), falling back to direct API...`)
      }
    }

    // STRATEGY 2: Try API-Football direct (primary subscription - comprehensive data)
    try {
      console.log(`🔄 [HybridAPI Priority 2] Using direct API (API-Football)...`)
      
      // ✅ FIX: API-Football requires at least ONE parameter!
      // If ALL parameters are undefined, provide sensible defaults
      const hasAnyParam = team || league || season || date || status || live
      
      let apiDate = date
      let apiLive = live
      
      if (!hasAnyParam) {
        console.warn(`⚠️ [HybridAPI] No parameters provided! Using default: today's date`)
        // Use today's date if no parameters provided
        // ✅ FIX: Correct for system date being 2025+
        const now = new Date()
        const year = now.getFullYear()
        const correctedDate = year > 2024 
          ? new Date(2024, now.getMonth(), now.getDate())
          : now
        apiDate = correctedDate.toISOString().split('T')[0]
        console.log(`📅 [HybridAPI] Using date: ${apiDate} (system year: ${year})`)
      }
      
      console.log(`🔄 [HybridAPI] Calling direct API with params:`, {
        team, league, season, date: apiDate, status, live: apiLive, sport
      })
      
      const result = await this.directApiService.getFixtures(
        team,
        league,
        season,
        apiDate,
        status,
        apiLive,
        sport
      )

      const elapsed = Date.now() - startTime
      console.log(`✅ [HybridAPI] Direct API success! ${result.response?.length || 0} matches in ${elapsed}ms`)
      
      // ✅ Only return if we got matches
      if (result.response && result.response.length > 0) {
        return result
      }
      console.warn(`⚠️ [HybridAPI] API-Football returned 0 matches, trying TheSportsDB fallback...`)
    } catch (error: any) {
      console.warn(`⚠️ [HybridAPI] Direct API error: ${error.message}, falling back to TheSportsDB...`)
      
      // Check if it's an authentication error (403)
      if (error.message?.includes('403') || error.message?.includes('HTTP error')) {
        console.error(`🔑 [HybridAPI] AUTHENTICATION ERROR!`)
        console.error(`   This is likely an API key issue.`)
        console.error(`   Please check your .env.local file has a valid EXPO_PUBLIC_API_FOOTBALL_KEY`)
        // ✅ SECURITY: Never log API keys
        console.error(`   API key status: ${this.directApiService['config']?.apiKey ? 'SET' : 'MISSING'}`)
      }
    }

    // STRATEGY 3: Last resort fallback to TheSportsDB (free tier - limited data)
    if (this.useTheSportsDb) {
      try {
        console.log(`🏀 [HybridAPI Priority 3] Trying TheSportsDB as last resort fallback...`)
        
        const result = await this.theSportsDbService.getFixtures(
          team,
          league,
          season,
          date,
          status,
          live,
          sport
        )

        // ✅ Only use TheSportsDB result if it has matches
        if (result.response && result.response.length > 0) {
          const elapsed = Date.now() - startTime
          console.log(`✅ [HybridAPI] TheSportsDB fallback success! ${result.response.length} matches in ${elapsed}ms`)
          return result
        } else {
          console.warn(`⚠️ [HybridAPI] TheSportsDB returned 0 matches (expected for fallback API)`)
        }
      } catch (error: any) {
        console.warn(`ℹ️ [HybridAPI] TheSportsDB error: ${error.message} (expected for fallback API)`)
      }
    }

    // All strategies failed - return empty response
    console.error(`❌ [HybridAPI] ALL API SOURCES FAILED!`)
    return {
      get: 'fixtures',
      parameters: { team, league, season, date, status, live } as any,
      errors: ['All API sources failed'],
      results: 0,
      paging: { current: 1, total: 1 },
      response: [],
    }
  }

  /**
   * Fetch from backend (all match types in parallel)
   */
  private async fetchFromBackend(
    sport: string,
    date?: string,
    status?: string,
    live?: string
  ): Promise<any[]> {
    // Fetch ALL types in parallel
    const [liveMatches, upcomingMatches, finishedMatches] = await Promise.all([
      backendApiService.getLiveMatches(sport, false).catch(() => []),
      backendApiService.getFixtures(sport, date, false).catch(() => []),
      backendApiService.getFinishedMatches(sport, date, false).catch(() => []),
    ])

    // Combine all
    return [...liveMatches, ...upcomingMatches, ...finishedMatches]
  }

  /**
   * Apply filters (preserve original behavior)
   */
  private applyFilters(
    matches: any[],
    filters: {
      team?: string
      league?: string
      date?: string
      status?: string
      live?: string
    }
  ): any[] {
    let filtered = matches

    // Filter by live status
    if (filters.live === 'all') {
      filtered = filtered.filter((match: any) => {
        const matchStatus = match.fixture?.status?.short
        return ['1H', '2H', 'HT', 'ET', 'BT', 'P', 'LIVE', 'Q1', 'Q2', 'Q3', 'Q4', 'OT'].includes(matchStatus || '')
      })
    }

    // Filter by specific status
    if (filters.status && filters.live !== 'all') {
      filtered = filtered.filter((match: any) => 
        match.fixture?.status?.short === filters.status
      )
    }

    // Filter by team
    if (filters.team) {
      filtered = filtered.filter((match: any) =>
        match.teams?.home?.name?.toLowerCase().includes(filters.team!.toLowerCase()) ||
        match.teams?.away?.name?.toLowerCase().includes(filters.team!.toLowerCase())
      )
    }

    // Filter by league
    if (filters.league) {
      filtered = filtered.filter((match: any) =>
        match.league?.name?.toLowerCase().includes(filters.league!.toLowerCase()) ||
        match.league?.id?.toString() === filters.league
      )
    }

    // Filter by date
    if (filters.date) {
      filtered = filtered.filter((match: any) => {
        const matchDate = match.fixture?.date?.split('T')[0]
        return matchDate === filters.date
      })
    }

    return filtered
  }

  /**
   * Clear cache (both backend and direct API)
   */
  clearCache(): void {
    console.log('🗑️ [HybridAPI] Clearing caches...')
    this.directApiService.clearCache()
    // Backend cache is managed server-side
  }

  /**
   * Get match details by ID
   */
  async getMatchById(matchId: string | number, sport: string = 'football'): Promise<Fixture | null> {
    try {
      const response = await this.getFixtures(undefined, undefined, undefined, undefined, undefined, undefined, sport)
      const match = response.response.find((m: Fixture) => m.fixture.id.toString() === matchId.toString())
      return match || null
    } catch (error) {
      console.error('❌ [HybridAPI] Error getting match by ID:', error)
      return null
    }
  }

  /**
   * Get fixture by ID (alias for compatibility with original ApiSportsService)
   * This is what screens are calling!
   */
  async getFixtureById(fixtureId: number, sport: string = 'football'): Promise<any> {
    try {
      console.log(`🔍 [HybridAPI] Fetching fixture details for ${fixtureId} (${sport})`)
      
      // Try backend first (if enabled)
      if (this.useBackendCache) {
        try {
          // Just delegate to direct API for now since backend doesn't have getFixtureById
          return await this.directApiService.getFixtureById(fixtureId, sport)
        } catch (error) {
          console.warn(`⚠️ [HybridAPI] Backend failed for fixture ${fixtureId}, using direct API`)
        }
      }
      
      // Use direct API
      return await this.directApiService.getFixtureById(fixtureId, sport)
    } catch (error) {
      console.error(`❌ [HybridAPI] Error fetching fixture ${fixtureId} (${sport}):`, error)
      throw error
    }
  }

  /**
   * Get match statistics (delegate to direct API)
   */
  async getMatchStatistics(fixtureId: number, sport: string = 'football'): Promise<any> {
    try {
      return await this.directApiService.getMatchStatistics(fixtureId, sport)
    } catch (error) {
      console.error(`❌ [HybridAPI] Error getting match statistics:`, error)
      throw error
    }
  }

  /**
   * Get match events (delegate to direct API)
   */
  async getMatchEvents(fixtureId: number, sport: string = 'football'): Promise<any> {
    try {
      return await this.directApiService.getMatchEvents(fixtureId, sport)
    } catch (error) {
      console.error(`❌ [HybridAPI] Error getting match events:`, error)
      throw error
    }
  }

  /**
   * Get match lineups (delegate to direct API)
   */
  async getMatchLineups(fixtureId: number, sport: string = 'football'): Promise<any> {
    try {
      return await this.directApiService.getMatchLineups(fixtureId, sport)
    } catch (error) {
      console.error(`❌ [HybridAPI] Error getting match lineups:`, error)
      throw error
    }
  }

  /**
   * Get match player stats (delegate to direct API)
   */
  async getMatchPlayerStats(fixtureId: number): Promise<any> {
    try {
      return await this.directApiService.getMatchPlayerStats(fixtureId)
    } catch (error) {
      console.error(`❌ [HybridAPI] Error getting player stats:`, error)
      throw error
    }
  }

  /**
   * Get team info (delegate to direct API)
   */
  async getTeamInfo(teamId: number): Promise<any> {
    try {
      return await this.directApiService.getTeamInfo(teamId)
    } catch (error) {
      console.error(`❌ [HybridAPI] Error getting team info:`, error)
      throw error
    }
  }

  /**
   * Toggle backend cache usage (for debugging)
   */
  setUseBackendCache(enabled: boolean): void {
    this.useBackendCache = enabled
    console.log(`🔧 [HybridAPI] Backend cache ${enabled ? 'ENABLED' : 'DISABLED'}`)
  }
}

// Export singleton instance
export const hybridApiService = new HybridApiService()
export default HybridApiService

