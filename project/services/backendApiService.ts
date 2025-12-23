/**
 * Backend API Service
 * 
 * This service calls Supabase Edge Functions instead of making direct API calls.
 * All API keys are stored securely in Supabase backend.
 * 
 * Usage:
 *   import { backendApiService } from './services/backendApiService'
 *   const matches = await backendApiService.getLiveMatches('football')
 */

import { supabase, supabaseConfig } from './supabaseClient'
import type { Fixture } from '../types/football-fixtures-response'

const FUNCTIONS_URL = process.env.EXPO_PUBLIC_SUPABASE_URL?.replace('/rest/v1', '') || ''

class BackendApiService {
  /**
   * Get live matches from backend cache or API
   */
  async getLiveMatches(sport: string = 'football', forceRefresh: boolean = false): Promise<any[]> {
    try {
      // ✅ Add timeout wrapper to prevent hanging requests
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout after 25 seconds')), 25000);
      });

      // Use Supabase client's invoke method - it should automatically add Authorization header
      const invokePromise = supabase.functions.invoke('fetch-sports-data', {
        body: { type: 'live', sport, refresh: forceRefresh }
      });

      let { data, error } = await Promise.race([invokePromise, timeoutPromise]) as any;

      // Handle network/connection errors with retry logic
      if (error && (error.message?.includes('Failed to send') || error.message?.includes('fetch'))) {
        console.warn('⚠️ [BackendApi] Network error for live matches, retrying once...');
        // Wait a bit before retry
        await new Promise(resolve => setTimeout(resolve, 1000));
        // Retry once
        const retryResult = await supabase.functions.invoke('fetch-sports-data', {
          body: { type: 'live', sport, refresh: forceRefresh }
        });
        if (!retryResult.error) {
          console.log('✅ [BackendApi] Retry succeeded for live matches!');
          data = retryResult.data;
          error = null;
        } else {
          error = retryResult.error;
        }
      }

      // ✅ CRITICAL: Check if Edge Function returned success with empty data (graceful fallback)
      // This is NOT an error - it means all APIs failed gracefully and we should return empty array silently
      if (data && data.success === true) {
        const resultData = data.data || [];
        if (resultData.length === 0 && data.message) {
          // Graceful fallback - all APIs exhausted, return empty array without logging error
          console.log(`ℹ️ [BackendApi] No live ${sport} matches available (all API fallbacks exhausted)`);
          return [];
        }
        return resultData;
      }

      // Check if data has error response (success: false)
      if (data && data.success === false) {
        // Edge Function returned an error response - log it but return empty array gracefully
        const errorMsg = data.error || data.message || 'Unknown error';
        console.warn(`⚠️ [BackendApi] Edge Function error: ${errorMsg}`);
        return [];
      }

      // Handle actual invoke errors (network, timeout, etc.)
      if (error) {
        const errorStatus = (error as any).status || (error as any).context?.status;
        const errorMessage = error.message || '';
        
        // ✅ Detect timeout errors specifically
        if (errorMessage.includes('timeout') || errorMessage.includes('Timeout') || errorMessage.includes('Request timeout')) {
          console.warn(`⏱️ [BackendApi] Edge Function timeout - API may be slow or unavailable`);
          console.warn(`   This is usually temporary. Matches will load on next refresh.`);
          return []; // Return empty array gracefully
        }
        
        // Only log critical errors, not graceful fallbacks
        if (errorStatus >= 500) {
          console.warn(`⚠️ [BackendApi] Edge Function error (${errorStatus}): ${errorMessage.substring(0, 100)}`);
        } else if (errorStatus === 401) {
          console.warn('⚠️ [BackendApi] Authentication error - check API keys in Supabase secrets');
        } else if (errorStatus === 429) {
          console.warn('⚠️ [BackendApi] Rate limit exceeded - APIs will retry automatically');
        } else if (errorMessage.includes('Failed to send') || errorMessage.includes('network')) {
          console.warn('⚠️ [BackendApi] Network error - will retry on next request');
        } else {
          // Silent fallback for other errors - return empty array gracefully
          console.log(`ℹ️ [BackendApi] No live ${sport} matches available`);
        }
        
        return [];
      }

      // Fallback: return empty array if no data
      return data?.data || [];
    } catch (error: any) {
      // ✅ Handle timeout errors specifically
      const errorMessage = error.message || '';
      if (errorMessage.includes('timeout') || errorMessage.includes('Timeout') || errorMessage.includes('Request timeout')) {
        console.warn(`⏱️ [BackendApi] Request timeout fetching live ${sport} matches - API may be slow`);
        console.warn(`   This is usually temporary. Matches will load on next refresh.`);
      } else {
        // Silent error handling for other errors - return empty array gracefully
        console.log(`ℹ️ [BackendApi] Exception fetching live ${sport} matches: ${errorMessage.substring(0, 50) || 'Unknown'}`);
      }
      return [];
    }
  }

  /**
   * Get upcoming fixtures from backend cache or API
   */
  async getFixtures(sport: string = 'football', date?: string, forceRefresh: boolean = false): Promise<any[]> {
    try {
      // Verify Supabase client is properly initialized
      if (!supabase) {
        console.error('❌ [BackendApi] Supabase client not initialized')
        return []
      }

      // Verify Supabase config is available
      if (!supabaseConfig?.publishableKey) {
        console.error('❌ [BackendApi] Supabase publishable key not available')
        console.error('❌ [BackendApi] Check EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY environment variable')
        return []
      }

      console.log(`📡 [BackendApi] Invoking fetch-sports-data for fixtures (sport: ${sport}, date: ${date || 'today'})`)
      console.log(`🔑 [BackendApi] Using Supabase URL: ${supabaseConfig.url?.substring(0, 30)}...`)
      console.log(`🔑 [BackendApi] Auth key available: ${supabaseConfig.publishableKey ? 'Yes' : 'No'}`)

      // ✅ Add timeout wrapper to prevent hanging requests
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout after 25 seconds')), 25000);
      });

      // Use Supabase client's invoke method - it should automatically add Authorization header
      const invokePromise = supabase.functions.invoke('fetch-sports-data', {
        body: { type: 'fixtures', sport, date, refresh: forceRefresh }
      });

      let { data, error } = await Promise.race([invokePromise, timeoutPromise]) as any;

      // Handle network/connection errors with retry logic
      if (error && (error.message?.includes('Failed to send') || error.message?.includes('fetch'))) {
        console.warn('⚠️ [BackendApi] Network error, retrying once...');
        // Wait a bit before retry
        await new Promise(resolve => setTimeout(resolve, 1000));
        // Retry once
        const retryResult = await supabase.functions.invoke('fetch-sports-data', {
          body: { type: 'fixtures', sport, date, refresh: forceRefresh }
        });
        if (!retryResult.error) {
          console.log('✅ [BackendApi] Retry succeeded!');
          data = retryResult.data;
          error = null;
        } else {
          error = retryResult.error;
        }
      }

      // If we get 401, try direct fetch as fallback (in case invoke isn't adding headers properly)
      if (error && (error as any).context?.status === 401) {
        console.warn('⚠️ [BackendApi] Got 401 from invoke, trying direct fetch with explicit headers...')
        
        try {
          const functionUrl = `${supabaseConfig.url}/functions/v1/fetch-sports-data`;
          const response = await fetch(functionUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${supabaseConfig.publishableKey}`,
              'Content-Type': 'application/json',
              'apikey': supabaseConfig.publishableKey || '',
            },
            body: JSON.stringify({ type: 'fixtures', sport, date, refresh: forceRefresh })
          });

          if (response.ok) {
            const responseData = await response.json();
            data = responseData;
            error = null;
            console.log('✅ [BackendApi] Direct fetch succeeded!')
          } else {
            const errorText = await response.text();
            console.error(`❌ [BackendApi] Direct fetch failed: ${response.status} - ${errorText}`);
            error = { message: `HTTP ${response.status}: ${errorText}`, status: response.status } as any;
          }
        } catch (fetchError: any) {
          console.error('❌ [BackendApi] Direct fetch exception:', fetchError);
          error = fetchError;
        }
      }

      // ✅ CRITICAL: Check if Edge Function returned success with empty data (graceful fallback)
      if (data && data.success === true) {
        const resultData = data.data || [];
        if (resultData.length === 0 && data.message) {
          // Graceful fallback - all APIs exhausted, return empty array without logging error
          console.log(`ℹ️ [BackendApi] No ${sport} fixtures available for ${date || 'today'} (all API fallbacks exhausted)`);
          return [];
        }
        return resultData;
      }

      // Check if data has error response (success: false)
      if (data && data.success === false) {
        const errorMsg = data.error || data.message || 'Unknown error';
        console.warn(`⚠️ [BackendApi] Edge Function error: ${errorMsg}`);
        return [];
      }

      // Handle actual invoke errors
      if (error) {
        const errorStatus = (error as any).status || (error as any).context?.status;
        const errorMessage = error.message || '';
        
        // Only log critical errors
        if (errorStatus >= 500) {
          console.warn(`⚠️ [BackendApi] Edge Function error (${errorStatus}): ${errorMessage.substring(0, 100)}`);
        } else if (errorStatus === 401) {
          console.warn('⚠️ [BackendApi] Authentication error - check API keys in Supabase secrets');
        } else if (errorStatus === 429) {
          console.warn('⚠️ [BackendApi] Rate limit exceeded - APIs will retry automatically');
        } else {
          console.log(`ℹ️ [BackendApi] No ${sport} fixtures available for ${date || 'today'}`);
        }
        
        return [];
      }

      return data?.data || []
    } catch (error: any) {
      // ✅ Handle timeout errors specifically
      const errorMessage = error.message || '';
      if (errorMessage.includes('timeout') || errorMessage.includes('Timeout') || errorMessage.includes('Request timeout')) {
        console.warn(`⏱️ [BackendApi] Request timeout fetching fixtures - API may be slow`);
        console.warn(`   This is usually temporary. Matches will load on next refresh.`);
      } else {
        console.error('Error in getFixtures:', error);
        if (error.message) {
          console.error('Error message:', error.message);
        }
      }
      return [];
    }
  }

  /**
   * Get finished matches from backend cache or API
   */
  async getFinishedMatches(sport: string = 'football', date?: string, forceRefresh: boolean = false): Promise<any[]> {
    try {
      console.log(`📡 [BackendApi] Invoking fetch-sports-data for finished matches (sport: ${sport}, date: ${date || 'today'})`);

      // ✅ Add timeout wrapper to prevent hanging requests
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout after 25 seconds')), 25000);
      });

      // Use Supabase client's invoke method - it should automatically add Authorization header
      const invokePromise = supabase.functions.invoke('fetch-sports-data', {
        body: { type: 'finished', sport, date, refresh: forceRefresh }
      });

      let { data, error } = await Promise.race([invokePromise, timeoutPromise]) as any;

      // Handle network/connection errors with retry logic
      if (error && (error.message?.includes('Failed to send') || error.message?.includes('fetch') || error.message?.includes('FunctionsFetchError'))) {
        console.warn('⚠️ [BackendApi] Network error for finished matches, retrying once...');
        // Wait a bit before retry
        await new Promise(resolve => setTimeout(resolve, 1500));
        // Retry once
        const retryResult = await supabase.functions.invoke('fetch-sports-data', {
          body: { type: 'finished', sport, date, refresh: forceRefresh }
        });
        if (!retryResult.error) {
          console.log('✅ [BackendApi] Retry succeeded for finished matches!');
          data = retryResult.data;
          error = null;
        } else {
          error = retryResult.error;
        }
      }

      // ✅ CRITICAL: Check if Edge Function returned success with empty data (graceful fallback)
      if (data && data.success === true) {
        const resultData = data.data || [];
        if (resultData.length === 0 && data.message) {
          // Graceful fallback - all APIs exhausted
          console.log(`ℹ️ [BackendApi] No finished ${sport} matches available for ${date || 'today'} (all API fallbacks exhausted)`);
          return [];
        }
        return resultData;
      }

      // Check if data has error response (success: false)
      if (data && !data.success) {
        const errorMsg = data.error || data.message || 'Unknown error';
        console.warn(`⚠️ [BackendApi] Edge Function error: ${errorMsg}`);
        return [];
      }

      // Handle actual invoke errors
      if (error) {
        const errorMessage = error.message || '';
        
        // ✅ Detect timeout errors specifically
        if (errorMessage.includes('timeout') || errorMessage.includes('Timeout') || errorMessage.includes('Request timeout')) {
          console.warn(`⏱️ [BackendApi] Edge Function timeout for finished matches - API may be slow`);
          return [];
        }
        
        if (errorMessage.includes('Failed to send') || errorMessage.includes('fetch') || errorMessage.includes('FunctionsFetchError')) {
          console.warn('⚠️ [BackendApi] Network error - will retry on next request');
        } else {
          console.log(`ℹ️ [BackendApi] No finished ${sport} matches available for ${date || 'today'}`);
        }
        return [];
      }

      return data?.data || []
    } catch (error: any) {
      // ✅ Handle timeout errors specifically
      const errorMessage = error.message || '';
      if (errorMessage.includes('timeout') || errorMessage.includes('Timeout') || errorMessage.includes('Request timeout')) {
        console.warn(`⏱️ [BackendApi] Request timeout fetching finished matches - API may be slow`);
      } else {
        console.log(`ℹ️ [BackendApi] Exception fetching finished ${sport} matches: ${errorMessage.substring(0, 50) || 'Unknown'}`);
      }
      return [];
    }
  }

  /**
   * Get news articles from backend cache or API
   */
  async getNews(query: string = 'sports', category: string = 'sports', limit: number = 20, forceRefresh: boolean = false): Promise<any[]> {
    try {
      // Use Supabase client's invoke method - it should automatically add Authorization header
      const { data, error } = await supabase.functions.invoke('fetch-news-data', {
        body: { query, category, limit, refresh: forceRefresh }
      })

      if (error) {
        // Handle different error types
        const errorMessage = error.message || 'Unknown error'
        const isNon2xxError = errorMessage.includes('non-2xx') || errorMessage.includes('status code')
        
        if (isNon2xxError) {
          // Edge Function returned an error status - check if we have error details in data
          if (data && data.error) {
            console.warn(`⚠️ [getNews] Edge Function error: ${data.error}`)
          } else {
            console.warn(`⚠️ [getNews] Edge Function returned non-2xx status. This may indicate missing API keys or API errors. Check Supabase Edge Function logs for details.`)
          }
        } else {
          console.error('❌ [getNews] Error fetching news:', errorMessage)
        }
        return []
      }

      // Check if data has error response
      if (data && !data.success) {
        console.warn(`⚠️ [getNews] Function returned error: ${data.error || data.message}`)
        return []
      }

      return data?.data || []
    } catch (error: any) {
      console.error('❌ [getNews] Exception:', error.message || 'Unknown error')
      return []
    }
  }

  /**
   * Get sports news
   */
  async getSportsNews(sport: string = 'sports', limit: number = 20): Promise<any[]> {
    return this.getNews(sport, 'sports', limit)
  }

  /**
   * Search news
   */
  async searchNews(query: string, limit: number = 10): Promise<any[]> {
    return this.getNews(query, 'general', limit)
  }

  /**
   * Get top headlines
   */
  async getTopHeadlines(category: string = 'sports', limit: number = 10): Promise<any[]> {
    return this.getNews(category, category, limit)
  }

  /**
   * Get FIFA news
   */
  async getFIFANews(limit: number = 10): Promise<any[]> {
    return this.getNews('FIFA World Cup', 'football', limit)
  }

  /**
   * Get Uganda sports news
   */
  async getUgandaSportsNews(limit: number = 10): Promise<any[]> {
    return this.getNews('Uganda football', 'sports', limit)
  }

  /**
   * Get AFCON news
   */
  async getAFCONNews(limit: number = 10): Promise<any[]> {
    return this.getNews('AFCON Africa Cup of Nations', 'football', limit)
  }

  /**
   * Get sports videos (using news API)
   */
  async getSportsVideos(limit: number = 10): Promise<any[]> {
    return this.getNews('sports highlights OR football video', 'sports', limit)
  }

  /**
   * Get lineup data for a specific fixture
   */
  async getLineupByFixtureId(
    fixtureId: number | string,
    sport: string = 'football'
  ): Promise<any[] | null> {
    try {
      console.log(`🎽 [Backend API] Fetching lineup for fixture ${fixtureId}...`)
      
      const { data, error } = await supabase.functions.invoke('fetch-sports-data', {
        body: {
          type: 'lineup',
          sport: sport,
          fixtureId: fixtureId.toString()
        }
      })
      
      if (error) {
        // ℹ️ 404 errors are expected when lineup data isn't available for a match
        if (error.message?.includes('404') || error.message?.includes('non-2xx')) {
          console.log(`ℹ️ [Backend API] No lineup data available for fixture ${fixtureId} (expected for some matches)`);
        } else {
          console.error(`❌ [Backend API] Error fetching lineup for fixture ${fixtureId}:`, error);
        }
        return null;
      }
      
      if (!data || !data.success) {
        console.warn(`⚠️ [Backend API] No lineup data available for fixture ${fixtureId}`)
        return null
      }
      
      console.log(`✅ [Backend API] Successfully fetched lineup for fixture ${fixtureId}:`, data.data?.length, 'teams')
      return data.data || null
    } catch (error: any) {
      console.error(`❌ [Backend API] Exception fetching lineup for fixture ${fixtureId}:`, error)
      return null
    }
  }

  /**
   * Get a specific fixture by ID
   */
  async getFixtureById(
    fixtureId: number,
    sport: string,
  ): Promise<Fixture | null> {
    try {
      console.log(`🔍 [Backend API] Fetching fixture ${fixtureId} for ${sport}`);
      
      const { data, error } = await supabase.functions.invoke("fetch-sports-data", {
        body: {
          action: "fixture-by-id",
          sport: sport,
          fixtureId: fixtureId,
        },
      });

      if (error) {
        console.error(`❌ [Backend API] Error fetching fixture ${fixtureId}:`, error);
        return null;
      }

      if (!data || !data.data || data.data.length === 0) {
        console.warn(`⚠️ [Backend API] No data found for fixture ${fixtureId}`);
        return null;
      }

      console.log(`✅ [Backend API] Successfully fetched fixture ${fixtureId}`);
      return data.data[0] as Fixture;
    } catch (error) {
      console.error(`❌ [Backend API] Exception fetching fixture ${fixtureId}:`, error);
      return null;
    }
  }
}

export const backendApiService = new BackendApiService()

