/**
 * TheSportsDB API Service
 * 
 * This service uses TheSportsDB API as an alternative to API-Football
 * when rate limits are hit or API-Football is unavailable.
 * 
 * API Docs: https://www.thesportsdb.com/api.php
 */

import Constants from 'expo-constants'
import {
  FootballFixturesResponse,
  Fixture,
} from '../types/football-fixtures-response'

export class TheSportsDbApiService {
  private apiKey: string
  private baseUrl = 'https://www.thesportsdb.com/api/v1/json'

  constructor() {
    this.apiKey = 
      process.env.EXPO_PUBLIC_THE_SPORTSDB_API_KEY ||
      Constants.expoConfig?.extra?.theSportsDbApiKey ||
      '3' // Free tier key (very limited)

    if (this.apiKey === '3') {
      console.warn(`⚠️ [TheSportsDB] Using FREE tier key! Very limited. Set EXPO_PUBLIC_THE_SPORTSDB_API_KEY for full access.`)
    } else {
      // ✅ SECURITY: Never log API keys or partial keys
      console.log(`✅ [TheSportsDB] Initialized with subscription key from EXPO_PUBLIC_THE_SPORTSDB_API_KEY`)
    }
  }

  /**
   * Get fixtures - compatible interface with ApiSportsService
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
    try {
      // ✅ CRITICAL: Reject basketball requests (user doesn't have subscription)
      if (sport === 'basketball') {
        console.warn(`⚠️ [TheSportsDB] Basketball not supported (no subscription)`)
        return {
          get: 'fixtures',
          parameters: { team, league, season, date, status, live },
          errors: ['Basketball not supported - subscription required'],
          results: 0,
          paging: { current: 1, total: 1 },
          response: [],
        }
      }
      
      console.log(`⚽ [TheSportsDB] Fetching ${sport} fixtures...`)

      // TheSportsDB uses different endpoints
      let matches: any[] = []

      // Get live matches if requested
      if (live === 'all' || status === '1H' || status === '2H' || status === 'HT') {
        matches = await this.getLiveMatches(sport)
      } else {
        // For now, return empty (TheSportsDB has limited fixture support)
        console.warn(`⚠️ [TheSportsDB] Fixture lookups not fully supported, returning empty`)
        matches = []
      }

      return {
        get: 'fixtures',
        parameters: { team, league, season, date, status, live },
        errors: [],
        results: matches.length,
        paging: { current: 1, total: 1 },
        response: matches,
      }
    } catch (error: any) {
      console.error(`❌ [TheSportsDB] Error:`, error)
      return {
        get: 'fixtures',
        parameters: {},
        errors: [error.message],
        results: 0,
        paging: { current: 1, total: 1 },
        response: [],
      }
    }
  }

  /**
   * Get live matches from TheSportsDB
   */
  private async getLiveMatches(sport: string): Promise<Fixture[]> {
    try {
      // ✅ CRITICAL: Reject basketball requests (user doesn't have subscription)
      if (sport === 'basketball') {
        console.warn(`⚠️ [TheSportsDB] Basketball not supported (no subscription)`)
        return []
      }
      
      const sportName = sport === 'basketball' ? 'Basketball' : 'Soccer'
      
      // ✅ SECURITY: Check if we have a valid API key
      if (this.apiKey === '3') {
        console.warn(`⚠️ [TheSportsDB] Free tier key has limited access. Some endpoints may not work.`)
        console.warn(`   Set EXPO_PUBLIC_THE_SPORTSDB_API_KEY in .env.local for full access.`)
      }
      
      // ✅ FIX: Correct TheSportsDB API URL format
      const url = `https://www.thesportsdb.com/api/v1/json/${this.apiKey}/livescore.php?s=${sportName}`
      
      console.log(`🔴 [TheSportsDB] Fetching live ${sportName} matches...`)
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      })
      
      // ✅ IMPROVED: Handle 404 gracefully (invalid key or endpoint doesn't exist)
      if (response.status === 404) {
        console.warn(`⚠️ [TheSportsDB] HTTP 404 - Endpoint not found`)
        console.warn(`   This usually means:`)
        console.warn(`   1. The API key in EXPO_PUBLIC_THE_SPORTSDB_API_KEY is invalid or expired`)
        console.warn(`   2. The endpoint doesn't exist for your subscription tier`)
        console.warn(`   3. TheSportsDB may have changed their API structure`)
        console.warn(`   Please verify your API key at: https://www.thesportsdb.com/`)
        return [] // Return empty instead of throwing
      }
      
      // Check if response is OK
      if (!response.ok) {
        console.error(`❌ [TheSportsDB] HTTP ${response.status}: ${response.statusText}`)
        // ✅ SECURITY: Never log URLs with API keys
        console.error(`   Endpoint: livescore.php?s=${sportName}`)
        return [] // Return empty instead of throwing for non-critical errors
      }
      
      // Check content type
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text()
        console.error(`❌ [TheSportsDB] Expected JSON, got:`, text.substring(0, 200))
        return [] // Return empty instead of throwing
      }
      
      const data = await response.json()

      if (!data.events || !Array.isArray(data.events)) {
        console.log(`⚠️ [TheSportsDB] No live matches found (events: ${data.events})`)
        return []
      }

      console.log(`✅ [TheSportsDB] Found ${data.events.length} live matches`)

      // Transform TheSportsDB format to our internal format
      return data.events.map((event: any) => this.transformToFixture(event))
    } catch (error: any) {
      console.error(`❌ [TheSportsDB] Error fetching live matches:`, error.message || error)
      console.warn(`   Returning empty array to prevent app crash`)
      return [] // Return empty instead of throwing
    }
  }

  /**
   * Transform TheSportsDB event to Fixture format
   */
  private transformToFixture(event: any): Fixture {
    return {
      fixture: {
        id: parseInt(event.idEvent) || 0,
        referee: null,
        timezone: 'UTC',
        date: event.dateEvent + 'T' + (event.strTime || '00:00:00') + 'Z',
        timestamp: Date.parse(event.dateEvent) / 1000,
        periods: {
          first: null,
          second: null,
        },
        venue: {
          id: null,
          name: event.strVenue || null,
          city: null,
        },
        status: {
          long: event.strStatus || 'Not Started',
          short: this.mapStatus(event.strStatus),
          elapsed: event.strProgress ? parseInt(event.strProgress) : null,
        },
      },
      league: {
        id: parseInt(event.idLeague) || 0,
        name: event.strLeague || 'Unknown League',
        country: event.strCountry || '',
        logo: event.strLeagueBadge || null,
        flag: null,
        season: parseInt(event.strSeason) || new Date().getFullYear(),
        round: event.intRound ? `Round ${event.intRound}` : null,
      },
      teams: {
        home: {
          id: parseInt(event.idHomeTeam) || 0,
          name: event.strHomeTeam || 'Home Team',
          logo: event.strHomeTeamBadge || event.strTeamBadge || null,
          winner: this.determineWinner(event, 'home'),
        },
        away: {
          id: parseInt(event.idAwayTeam) || 0,
          name: event.strAwayTeam || 'Away Team',
          logo: event.strAwayTeamBadge || null,
          winner: this.determineWinner(event, 'away'),
        },
      },
      goals: {
        home: parseInt(event.intHomeScore) || 0,
        away: parseInt(event.intAwayScore) || 0,
      },
      score: {
        halftime: {
          home: null,
          away: null,
        },
        fulltime: {
          home: parseInt(event.intHomeScore) || 0,
          away: parseInt(event.intAwayScore) || 0,
        },
        extratime: {
          home: null,
          away: null,
        },
        penalty: {
          home: null,
          away: null,
        },
      },
    }
  }

  /**
   * Map TheSportsDB status to API-Football status codes
   */
  private mapStatus(status: string | null): string {
    if (!status) return 'NS'
    
    const statusLower = status.toLowerCase()
    
    if (statusLower.includes('live') || statusLower.includes('1h') || statusLower.includes('2h')) {
      return '2H' // Live match
    }
    if (statusLower.includes('finished') || statusLower.includes('ft')) {
      return 'FT'
    }
    if (statusLower.includes('halftime') || statusLower.includes('ht')) {
      return 'HT'
    }
    
    return 'NS' // Not started
  }

  /**
   * Determine winner from scores
   */
  private determineWinner(event: any, team: 'home' | 'away'): boolean | null {
    const homeScore = parseInt(event.intHomeScore) || 0
    const awayScore = parseInt(event.intAwayScore) || 0
    
    if (homeScore === awayScore) return null
    
    if (team === 'home') {
      return homeScore > awayScore
    } else {
      return awayScore > homeScore
    }
  }

  /**
   * Clear cache - no-op for TheSportsDB (no caching implemented)
   */
  clearCache(): void {
    console.log(`🗑️ [TheSportsDB] Cache cleared`)
  }

  /**
   * Get fixture by ID
   */
  async getFixtureById(fixtureId: number, sport: string = 'football'): Promise<any> {
    console.warn(`⚠️ [TheSportsDB] getFixtureById not implemented, returning null`)
    return null
  }

  /**
   * Get match statistics
   */
  async getMatchStatistics(fixtureId: number, sport: string = 'football'): Promise<any> {
    console.warn(`⚠️ [TheSportsDB] getMatchStatistics not implemented, returning null`)
    return null
  }

  /**
   * Get match events
   */
  async getMatchEvents(fixtureId: number, sport: string = 'football'): Promise<any> {
    console.warn(`⚠️ [TheSportsDB] getMatchEvents not implemented, returning null`)
    return null
  }

  /**
   * Get match lineups
   */
  async getMatchLineups(fixtureId: number, sport: string = 'football'): Promise<any> {
    console.warn(`⚠️ [TheSportsDB] getMatchLineups not implemented, returning null`)
    return null
  }

  /**
   * Get match player stats
   */
  async getMatchPlayerStats(fixtureId: number): Promise<any> {
    console.warn(`⚠️ [TheSportsDB] getMatchPlayerStats not implemented, returning null`)
    return null
  }

  /**
   * Get team info
   */
  async getTeamInfo(teamId: number): Promise<any> {
    console.warn(`⚠️ [TheSportsDB] getTeamInfo not implemented, returning null`)
    return null
  }
}

// Export singleton
export const theSportsDbApiService = new TheSportsDbApiService()
export default TheSportsDbApiService
