// Sports API Integration Utility
// This file provides easy-to-use functions for calling the Supabase Edge Functions
// that securely access TheSports.com API

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

// Base function URL
const FUNCTIONS_URL = `${SUPABASE_URL}/functions/v1`

// Types for better TypeScript support
export interface FootballMatch {
  id: string
  home_team: string
  away_team: string
  league: string
  date: string
  status: 'live' | 'finished' | 'upcoming'
  score?: string
  minute?: number
}

export interface FootballLeague {
  id: string
  name: string
  country: string
  logo?: string
  season?: string
}

export interface FootballTeam {
  id: string
  name: string
  logo?: string
  country?: string
  league?: string
}

export interface ApiResponse<T> {
  data?: T
  matches?: T
  leagues?: T
  teams?: T
  metadata?: {
    endpoint: string
    requestTime: string
    filters: Record<string, any>
  }
  error?: string
  details?: string
}

// Generic function to call any sports API endpoint
const callSportsApi = async <T = any>(
  endpoint: string,
  params?: Record<string, string | number | boolean>
): Promise<T> => {
  const url = new URL(`${FUNCTIONS_URL}/${endpoint}`)

  // Add query parameters if provided
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.append(key, String(value))
      }
    })
  }

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
        errorData.error ||
        errorData.details ||
        `HTTP error! status: ${response.status}`
      )
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error(`Error calling sports API (${endpoint}):`, error)
    throw error
  }
}

// Specific API functions

/**
 * Fetch football matches with optional filters
 */
export const fetchFootballMatches = async (params?: {
  date?: string // Format: YYYY-MM-DD
  league?: string
  team?: string
  status?: 'live' | 'finished' | 'upcoming'
}): Promise<ApiResponse<FootballMatch[]>> => {
  return callSportsApi('fetch-football-matches', params)
}

/**
 * Fetch football leagues with optional filters
 */
export const fetchFootballLeagues = async (params?: {
  country?: string
  season?: string
  league_id?: string
}): Promise<ApiResponse<FootballLeague[]>> => {
  return callSportsApi('fetch-football-leagues', params)
}

/**
 * Fetch football teams with optional filters
 */
export const fetchFootballTeams = async (params?: {
  league?: string
  country?: string
  team_id?: string
  search?: string
}): Promise<ApiResponse<FootballTeam[]>> => {
  return callSportsApi('fetch-football-teams', params)
}

/**
 * Generic function to call any sports API endpoint
 * Use this for custom endpoints not covered by specific functions
 */
export const fetchSportsData = async (endpoint: string, params?: Record<string, string>): Promise<any> => {
  return callSportsApi('fetch-sports', { endpoint, ...params })
}

// Utility functions for common use cases

/**
 * Get today's live matches
 */
export const getTodaysLiveMatches = async (): Promise<FootballMatch[]> => {
  const today = new Date().toISOString().split('T')[0]
  const response = await fetchFootballMatches({
    date: today,
    status: 'live'
  })
  return response.matches || response.data || []
}

/**
 * Get upcoming matches for today
 */
export const getTodaysUpcomingMatches = async (): Promise<FootballMatch[]> => {
  const today = new Date().toISOString().split('T')[0]
  const response = await fetchFootballMatches({
    date: today,
    status: 'upcoming'
  })
  return response.matches || response.data || []
}

/**
 * Get finished matches for today
 */
export const getTodaysFinishedMatches = async (): Promise<FootballMatch[]> => {
  const today = new Date().toISOString().split('T')[0]
  const response = await fetchFootballMatches({
    date: today,
    status: 'finished'
  })
  return response.matches || response.data || []
}

/**
 * Search for teams by name
 */
export const searchTeams = async (teamName: string): Promise<FootballTeam[]> => {
  const response = await fetchFootballTeams({ search: teamName })
  return response.teams || response.data || []
}

/**
 * Get teams from a specific league
 */
export const getLeagueTeams = async (leagueId: string): Promise<FootballTeam[]> => {
  const response = await fetchFootballTeams({ league: leagueId })
  return response.teams || response.data || []
}

/**
 * Get leagues from a specific country
 */
export const getCountryLeagues = async (country: string): Promise<FootballLeague[]> => {
  const response = await fetchFootballLeagues({ country })
  return response.leagues || response.data || []
}

// Error handling utility
export const handleSportsApiError = (error: any): string => {
  if (error?.message) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  return 'An unexpected error occurred while fetching sports data'
}

// Date utilities for sports data
export const formatMatchDate = (dateString: string): string => {
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return dateString
  }
}

export const getDateRange = (days: number): { start: string; end: string } => {
  const start = new Date()
  const end = new Date()
  end.setDate(start.getDate() + days)

  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0]
  }
}

// Cache management (optional, for better performance)
interface CacheItem<T> {
  data: T
  timestamp: number
  ttl: number
}

class SimpleCache {
  private cache = new Map<string, CacheItem<any>>()

  set<T>(key: string, data: T, ttlMinutes: number = 5): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMinutes * 60 * 1000
    })
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key)
    if (!item) return null

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key)
      return null
    }

    return item.data
  }

  clear(): void {
    this.cache.clear()
  }
}

export const sportsApiCache = new SimpleCache()

// Cached versions of API calls (optional to use)
export const fetchFootballMatchesCached = async (
  params?: Parameters<typeof fetchFootballMatches>[0],
  cacheMinutes: number = 2
): Promise<ApiResponse<FootballMatch[]>> => {
  const cacheKey = `matches_${JSON.stringify(params || {})}`
  const cached = sportsApiCache.get<ApiResponse<FootballMatch[]>>(cacheKey)

  if (cached) {
    return cached
  }

  const data = await fetchFootballMatches(params)
  sportsApiCache.set(cacheKey, data, cacheMinutes)
  return data
}

export default {
  fetchFootballMatches,
  fetchFootballLeagues,
  fetchFootballTeams,
  fetchSportsData,
  getTodaysLiveMatches,
  getTodaysUpcomingMatches,
  getTodaysFinishedMatches,
  searchTeams,
  getLeagueTeams,
  getCountryLeagues,
  handleSportsApiError,
  formatMatchDate,
  getDateRange,
  sportsApiCache,
  fetchFootballMatchesCached
}
