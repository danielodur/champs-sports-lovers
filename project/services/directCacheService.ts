/**
 * Direct Cache Service
 * 
 * Reads match data DIRECTLY from Supabase cached_matches table
 * Bypasses the failing Edge Function that keeps timing out
 */

import { supabase } from './supabaseClient'
import { Fixture } from '../types/football-fixtures-response'

class DirectCacheService {
  /**
   * Get live matches directly from cache
   */
  async getLiveMatches(sport: string = 'football'): Promise<Fixture[]> {
    try {
      console.log(`📦 [DirectCache] Reading live ${sport} matches from cache table...`)
      
      const { data, error } = await supabase
        .from('cached_matches')
        .select('*')
        .eq('sport', sport)
        .eq('type', 'live')
        .order('cached_at', { ascending: false })
        .limit(1)

      if (error) {
        console.error(`❌ [DirectCache] Error reading live matches:`, error)
        return []
      }

      if (!data || data.length === 0) {
        console.log(`⚠️ [DirectCache] No cached live ${sport} matches found`)
        return []
      }

      const cachedData = data[0]
      const matches = cachedData.data || []
      
      console.log(`✅ [DirectCache] Found ${matches.length} cached live ${sport} matches (cached ${new Date(cachedData.cached_at).toLocaleTimeString()})`)
      
      return matches
    } catch (error: any) {
      console.error(`❌ [DirectCache] Error:`, error)
      return []
    }
  }

  /**
   * Get fixtures directly from cache
   */
  async getFixtures(sport: string = 'football', date?: string): Promise<Fixture[]> {
    try {
      console.log(`📦 [DirectCache] Reading ${sport} fixtures from cache table...`)
      
      let query = supabase
        .from('cached_matches')
        .select('*')
        .eq('sport', sport)
        .eq('type', 'fixtures')
        .order('cached_at', { ascending: false })
        .limit(1)

      const { data, error } = await query

      if (error) {
        console.error(`❌ [DirectCache] Error reading fixtures:`, error)
        return []
      }

      if (!data || data.length === 0) {
        console.log(`⚠️ [DirectCache] No cached ${sport} fixtures found`)
        return []
      }

      const cachedData = data[0]
      let matches = cachedData.data || []
      
      // Filter by date if specified
      if (date && Array.isArray(matches)) {
        matches = matches.filter((match: any) => {
          const matchDate = match.fixture?.date?.split('T')[0]
          return matchDate === date
        })
      }
      
      console.log(`✅ [DirectCache] Found ${matches.length} cached ${sport} fixtures (cached ${new Date(cachedData.cached_at).toLocaleTimeString()})`)
      
      return matches
    } catch (error: any) {
      console.error(`❌ [DirectCache] Error:`, error)
      return []
    }
  }

  /**
   * Get finished matches directly from cache
   */
  async getFinishedMatches(sport: string = 'football', date?: string): Promise<Fixture[]> {
    try {
      console.log(`📦 [DirectCache] Reading finished ${sport} matches from cache table...`)
      
      const { data, error } = await supabase
        .from('cached_matches')
        .select('*')
        .eq('sport', sport)
        .eq('type', 'finished')
        .order('cached_at', { ascending: false })
        .limit(1)

      if (error) {
        console.error(`❌ [DirectCache] Error reading finished matches:`, error)
        return []
      }

      if (!data || data.length === 0) {
        console.log(`⚠️ [DirectCache] No cached finished ${sport} matches found`)
        return []
      }

      const cachedData = data[0]
      let matches = cachedData.data || []
      
      // Filter by date if specified
      if (date && Array.isArray(matches)) {
        matches = matches.filter((match: any) => {
          const matchDate = match.fixture?.date?.split('T')[0]
          return matchDate === date
        })
      }
      
      console.log(`✅ [DirectCache] Found ${matches.length} cached finished ${sport} matches (cached ${new Date(cachedData.cached_at).toLocaleTimeString()})`)
      
      return matches
    } catch (error: any) {
      console.error(`❌ [DirectCache] Error:`, error)
      return []
    }
  }
}

// Export singleton
export const directCacheService = new DirectCacheService()
export default DirectCacheService













































