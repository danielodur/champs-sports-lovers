// API-Sports Handler (api-sports.io)
import type { FetchParams } from '../types.ts'

export async function handleApiSports(
  apiKey: string,
  params: FetchParams
): Promise<any[]> {
  const { type, sport, date } = params
  
  // Dynamic endpoint selection based on sport
  const baseUrl = sport === 'basketball' 
    ? 'https://v1.basketball.api-sports.io' 
    : 'https://v3.football.api-sports.io'
  
  console.log(`🏀⚽ API-Sports: Using ${sport} endpoint: ${baseUrl}`)
  
  let endpoint = ''
  
  if (type === 'live') {
    endpoint = sport === 'basketball' 
      ? `${baseUrl}/games?live=all` 
      : `${baseUrl}/fixtures?live=all`
    console.log(`📡 API-Sports LIVE endpoint: ${endpoint}`)
  } else if (type === 'fixtures') {
    const targetDate = date || new Date().toISOString().split('T')[0]
    endpoint = sport === 'basketball'
      ? `${baseUrl}/games?date=${targetDate}`
      : `${baseUrl}/fixtures?date=${targetDate}`
    console.log(`📡 API-Sports FIXTURES endpoint: ${endpoint}`)
  } else if (type === 'finished') {
    const targetDate = date || new Date().toISOString().split('T')[0]
    endpoint = sport === 'basketball'
      ? `${baseUrl}/games?date=${targetDate}`
      : `${baseUrl}/fixtures?date=${targetDate}`
    console.log(`📡 API-Sports FINISHED endpoint: ${endpoint}`)
  }

  // ✅ Add timeout handling (6 seconds max per API call to prevent total timeout)
  const controller = new AbortController()
  const timeoutId = setTimeout(() => {
    console.warn(`⏱️ API-Sports timeout after 6 seconds for ${endpoint}`)
    controller.abort()
  }, 6000) // Reduced to 6 seconds to allow multiple API attempts within 20s total

  let response: Response
  try {
    response = await fetch(endpoint, {
      headers: {
        'x-apisports-key': apiKey,
        'Content-Type': 'application/json',
      },
      signal: controller.signal
    })
    clearTimeout(timeoutId)
  } catch (error: any) {
    clearTimeout(timeoutId)
    if (error.name === 'AbortError') {
      throw new Error(`API-Sports timeout after 6 seconds`)
    }
    throw error
  }

  console.log(`📥 API-Sports response status: ${response?.status}`)
  
  // ✅ CRITICAL: Handle rate limits and errors IMMEDIATELY - check status BEFORE reading body
  if (!response.ok) {
    // ✅ For rate limits (429), fail fast to trigger fallback immediately - DON'T read body
    if (response.status === 429) {
      console.warn(`🚫 API-Sports Rate Limit (429) for ${sport} - FAILING FAST to trigger fallback`)
      // Don't await response.text() - fail immediately
      throw new Error(`API-Sports rate limit (429) - triggering fallback`)
    }
    
    // ✅ For auth errors (401/403), fail fast - DON'T read body
    if (response.status === 401 || response.status === 403) {
      console.warn(`🔐 API-Sports Auth Error (${response.status}) for ${sport} - FAILING FAST to trigger fallback`)
      // Don't await response.text() - fail immediately
      throw new Error(`API-Sports auth error (${response.status}) - triggering fallback`)
    }
    
    // For other errors, read error text but fail fast
    const errorText = await response.text().catch(() => 'Unable to read error response')
    if (response.status === 404) {
      console.warn(`⚠️ API-Sports 404 for ${sport} ${type} - will try fallback API`)
    } else {
      console.warn(`⚠️ API-Sports Error (${response.status}) for ${sport} - will try fallback API`)
    }
    // Throw error to trigger fallback chain in Edge Function
    throw new Error(`API-Sports HTTP ${response.status}: ${errorText.substring(0, 100)}`)
  }

  const result = await response.json()
  console.log(`📦 API-Sports raw result:`, JSON.stringify(result).substring(0, 500))
  console.log(`📊 API-Sports response: {"get":"${result.get || 'unknown'}", "parameters":${JSON.stringify(result.parameters || {})},"errors": ${JSON.stringify(result.errors || [])}, "results":${result.results || 0},"p"...`)
  
  // ✅ CRITICAL FIX: Check for errors in response body (even if HTTP status is 200)
  // API-Sports can return HTTP 200 with {"errors": {...}, "results": 0} when hitting limits or invalid params
  if (result.errors && Array.isArray(result.errors) && result.errors.length > 0) {
    const errorMessages = result.errors.join(', ')
    console.warn(`🚫 API-Sports returned errors in response body: ${errorMessages}`)
    
    // Check if it's a rate limit or usage limit error
    const errorStr = errorMessages.toLowerCase()
    if (errorStr.includes('limit') || errorStr.includes('quota') || errorStr.includes('usage') || 
        errorStr.includes('exceeded') || errorStr.includes('429') || errorStr.includes('rate')) {
      console.warn(`🚫 API-Sports usage limit detected in response - triggering fallback`)
      throw new Error(`API-Sports usage limit exceeded - triggering fallback`)
    }
    
    // For any errors in response body, trigger fallback
    console.warn(`🚫 API-Sports error in response body - triggering fallback`)
    throw new Error(`API-Sports returned errors: ${errorMessages.substring(0, 100)}`)
  }
  
  // ✅ CRITICAL FIX: Also check for errors object (non-array format)
  if (result.errors && typeof result.errors === 'object' && !Array.isArray(result.errors) && Object.keys(result.errors).length > 0) {
    const errorKeys = Object.keys(result.errors)
    const errorMessages = errorKeys.map(key => `${key}: ${result.errors[key]}`).join(', ')
    console.warn(`🚫 API-Sports returned errors object in response body: ${errorMessages}`)
    
    // Check if it's a rate limit or usage limit error
    const errorStr = JSON.stringify(result.errors).toLowerCase()
    if (errorStr.includes('limit') || errorStr.includes('quota') || errorStr.includes('usage') || 
        errorStr.includes('exceeded') || errorStr.includes('429')) {
      console.warn(`🚫 API-Sports usage limit detected in response - triggering fallback`)
      throw new Error(`API-Sports usage limit exceeded - triggering fallback`)
    }
    
    // For any other errors in response body, trigger fallback
    console.warn(`🚫 API-Sports error in response body - triggering fallback`)
    throw new Error(`API-Sports returned errors: ${errorMessages.substring(0, 100)}`)
  }
  
  // ✅ CRITICAL FIX: Check if results count is 0 when we expect data (not valid for live matches)
  // If API returns results: 0 with no errors, it might still indicate an issue
  if (result.results !== undefined && result.results === 0 && type !== 'live') {
    // For fixtures/finished, 0 results might indicate an API issue, try fallback
    console.warn(`⚠️ API-Sports returned 0 results for ${type} - this might indicate an API issue, trying fallback`)
    // Don't throw here - let it return empty array and let Edge Function decide
  }
  
  let apiData = result.response || []
  const originalCount = apiData.length
  console.log(`📊 API-Sports returned ${originalCount} matches BEFORE filtering`)
  
  // ✅ CRITICAL FIX: If we got 0 matches and there were errors or 0 results, this is likely a failure
  if (apiData.length === 0 && result.results === 0 && type !== 'live') {
    console.warn(`⚠️ API-Sports returned 0 matches and 0 results for ${type} - triggering fallback`)
    throw new Error(`API-Sports returned 0 matches for ${type} - triggering fallback`)
  }
  
  // Transform basketball data to match football structure
  if (sport === 'basketball' && apiData.length > 0) {
    apiData = apiData.map((game: any) => ({
      fixture: {
        id: game.id,
        date: game.date,
        status: {
          short: game.status?.short || 'NS',
          long: game.status?.long || 'Not Started',
          elapsed: game.status?.timer || null
        }
      },
      league: {
        id: game.league?.id,
        name: game.league?.name || 'Unknown League',
        country: game.country?.name || game.league?.country,
        logo: game.league?.logo || null,
        flag: game.country?.flag || null,
        sport: 'basketball'
      },
      teams: {
        home: {
          id: game.teams?.home?.id,
          name: game.teams?.home?.name || 'Home Team',
          logo: game.teams?.home?.logo || null
        },
        away: {
          id: game.teams?.away?.id,
          name: game.teams?.away?.name || 'Away Team',
          logo: game.teams?.away?.logo || null
        }
      },
      // ✅ CRITICAL: Preserve original scores structure for basketball quarters extraction
      scores: {
        home: {
          total: game.scores?.home?.total || 0,
          quarter_1: game.scores?.home?.quarter_1 || null,
          quarter_2: game.scores?.home?.quarter_2 || null,
          quarter_3: game.scores?.home?.quarter_3 || null,
          quarter_4: game.scores?.home?.quarter_4 || null,
          over_time: game.scores?.home?.over_time || null
        },
        away: {
          total: game.scores?.away?.total || 0,
          quarter_1: game.scores?.away?.quarter_1 || null,
          quarter_2: game.scores?.away?.quarter_2 || null,
          quarter_3: game.scores?.away?.quarter_3 || null,
          quarter_4: game.scores?.away?.quarter_4 || null,
          over_time: game.scores?.away?.over_time || null
        }
      },
      // ✅ ALSO: Keep goals for backward compatibility (used by some components)
      goals: {
        home: game.scores?.home?.total || 0,
        away: game.scores?.away?.total || 0
      },
      score: {
        halftime: {
          home: game.scores?.home?.quarter_1 || 0,
          away: game.scores?.away?.quarter_1 || 0
        }
      },
      sportType: 'basketball'
    }))
  } else {
    // Add sport identifier to football matches
    apiData = apiData.map((fixture: any) => ({
      ...fixture,
      league: {
        ...fixture.league,
        sport: 'football'
      },
      sportType: 'football'
    }))
  }
  
  // Filter based on type
  let beforeFilter = apiData.length
  if (type === 'live') {
    apiData = apiData.filter((fixture: any) => {
      const status = fixture.fixture?.status?.short
      return !['FT', 'AET', 'PEN', 'AOT', 'CANC', 'PST', 'ABD', 'AWD', 'WO'].includes(status)
    })
    console.log(`✂️ API-Sports LIVE filter: ${beforeFilter} → ${apiData.length} matches (removed ${beforeFilter - apiData.length} finished matches)`)
  } else if (type === 'fixtures') {
    apiData = apiData.filter((fixture: any) => 
      fixture.fixture?.status?.short === 'NS' || fixture.fixture?.status?.short === 'TBD'
    )
    console.log(`✂️ API-Sports FIXTURES filter: ${beforeFilter} → ${apiData.length} matches`)
  } else if (type === 'finished') {
    apiData = apiData.filter((fixture: any) => 
      fixture.fixture?.status?.short === 'FT' || 
      fixture.fixture?.status?.short === 'AET' ||
      fixture.fixture?.status?.short === 'PEN'
    )
    console.log(`✂️ API-Sports FINISHED filter: ${beforeFilter} → ${apiData.length} matches`)
  }

  const afterFilter = apiData.length
  const filterRatio = beforeFilter > 0 ? afterFilter / beforeFilter : 0
  console.log(`📊 API-Sports FINAL: ${afterFilter} matches after filtering (${Math.round(filterRatio * 100)}% retained)`)

  // ✅ CRITICAL FIX: If filtering removed >95% of matches, this might indicate a problem
  // For fixtures/finished, if we had many matches but filtering removed almost all, try fallback
  if (beforeFilter > 10 && afterFilter === 0 && type !== 'live') {
    console.warn(`⚠️ API-Sports filtering removed ALL ${beforeFilter} matches for ${type} - this might indicate a data issue, triggering fallback`)
    throw new Error(`API-Sports filtering removed all matches (${beforeFilter} → 0) - triggering fallback`)
  }
  
  // ✅ Log warning if we got 0 matches after filtering (might indicate an issue)
  if (afterFilter === 0) {
    console.warn(`⚠️ API-Sports returned 0 matches after filtering for ${type} ${sport}`)
    console.warn(`   This might be valid (no matches available) or indicate an API issue`)
    console.warn(`   Edge Function will try fallback APIs if configured`)
  }
  
  // ✅ Return empty array if no matches (this is valid - not an error)
  // The edge function will try the next API if this returns empty
  return apiData
}
