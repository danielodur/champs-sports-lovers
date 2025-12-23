// Shared types for fetch-sports-data function

export interface MatchData {
  match_id: string
  sport: string
  league: string
  home_team: string
  away_team: string
  home_score: number
  away_score: number
  status: 'live' | 'finished' | 'upcoming'
  match_time: string
  start_time: string
  data: any
}

export interface ApiConfig {
  name: string
  key: string | null
  priority: number
}

export interface FetchParams {
  type: string
  sport: string
  date?: string
  fixtureId?: string
}

export interface ApiResponse {
  success: boolean
  data?: any[]
  error?: string
  cached?: boolean
  count?: number
}
