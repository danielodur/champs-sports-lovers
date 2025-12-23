// TheSportsDB Handler
import type { FetchParams } from '../types.ts'

export async function handleTheSportsDB(
  apiKey: string,
  params: FetchParams
): Promise<any[]> {
  const { type, date } = params
  
  console.log(`📡 Fetching from TheSportsDB with ${type}...`)
  
  const targetDate = date || new Date().toISOString().split('T')[0]
  
  // ✅ Add timeout to prevent hanging requests (6 seconds per API)
  const controller = new AbortController()
  const timeoutId = setTimeout(() => {
    console.warn(`⏱️ TheSportsDB timeout after 6 seconds`)
    controller.abort()
  }, 6000) // Reduced to 6 seconds to allow multiple API attempts within 20s total

  let response: Response
  try {
    response = await fetch(
      `https://www.thesportsdb.com/api/v1/json/${apiKey}/eventsday.php?d=${targetDate}&s=Soccer`,
      { 
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal
      }
    )
    clearTimeout(timeoutId)
  } catch (error: any) {
    clearTimeout(timeoutId)
    if (error.name === 'AbortError') {
      throw new Error(`TheSportsDB timeout after 6 seconds`)
    }
    throw error
  }
  
  console.log(`📡 TheSportsDB response status: ${response?.status}`)
  
  // ✅ CRITICAL: Handle errors IMMEDIATELY - fail fast for graceful fallback
  if (!response.ok) {
    // ✅ For rate limits and auth errors, fail fast
    if (response.status === 429 || response.status === 401 || response.status === 403) {
      console.warn(`🚫 TheSportsDB Error (${response.status}) - FAILING FAST (no fallback available)`)
      throw new Error(`TheSportsDB error (${response.status}) - no more fallbacks`)
    }
    
    // For other errors, read error text but fail fast
    const errorText = await response.text().catch(() => 'Unable to read response')
    console.warn(`⚠️ TheSportsDB Error (${response.status}) - no more fallbacks available`)
    throw new Error(`TheSportsDB HTTP ${response.status}: ${errorText.substring(0, 100)}`)
  }

  // Check if response is HTML instead of JSON
  const contentType = response.headers.get('content-type')
  if (contentType && contentType.includes('text/html')) {
    console.warn(`⚠️ TheSportsDB returned HTML instead of JSON - will try fallback API`)
    throw new Error('TheSportsDB returned HTML instead of JSON')
  }

  const sportsDbResult = await response.json().catch((err) => {
    console.warn(`⚠️ TheSportsDB: Failed to parse JSON - will try fallback API`)
    throw new Error('Invalid JSON response from TheSportsDB')
  })
  
  // ✅ CRITICAL FIX: Check for errors in response body
  if (sportsDbResult.error || sportsDbResult.errors) {
    const errorMsg = sportsDbResult.error || JSON.stringify(sportsDbResult.errors)
    console.warn(`🚫 TheSportsDB returned error in response: ${errorMsg}`)
    throw new Error(`TheSportsDB error: ${errorMsg.substring(0, 100)}`)
  }
  
  // ✅ Check if events array exists and is valid
  if (!sportsDbResult.events || !Array.isArray(sportsDbResult.events)) {
    console.warn(`⚠️ TheSportsDB returned invalid events structure`)
    throw new Error('TheSportsDB returned invalid response structure')
  }
  
  const events = sportsDbResult.events || []
  console.log(`📊 TheSportsDB raw events: ${events.length}`)
  
  // ✅ If we got 0 events and this is not a live query, it might indicate an issue
  if (events.length === 0 && type !== 'live') {
    console.warn(`⚠️ TheSportsDB returned 0 events for ${type} - this might indicate an API issue`)
    // Don't throw - let Edge Function decide if this is valid or should try cache
  }
  
  // Transform TheSportsDB data to match API-Football structure
  let apiData = events.map((event: any) => ({
    fixture: {
      id: parseInt(event.idEvent),
      date: event.dateEvent + 'T' + event.strTime,
      status: {
        short: event.strStatus === 'Match Finished' ? 'FT' : 
               event.strStatus === 'Not Started' ? 'NS' : 
               event.intHomeScore !== null ? 'LIVE' : 'NS',
        long: event.strStatus,
        elapsed: null
      }
    },
    league: {
      id: parseInt(event.idLeague || '0'),
      name: event.strLeague || 'Unknown',
      country: event.strCountry || 'Unknown',
      sport: 'football'
    },
    teams: {
      home: {
        id: parseInt(event.idHomeTeam || '0'),
        name: event.strHomeTeam,
        logo: event.strHomeTeamBadge || ''
      },
      away: {
        id: parseInt(event.idAwayTeam || '0'),
        name: event.strAwayTeam,
        logo: event.strAwayTeamBadge || ''
      }
    },
    goals: {
      home: event.intHomeScore ? parseInt(event.intHomeScore) : null,
      away: event.intAwayScore ? parseInt(event.intAwayScore) : null
    },
    sportType: 'football'
  }))
  
  console.log(`✅ TheSportsDB transformed ${apiData.length} events to fixtures format`)
  
  // Filter based on type
  if (type === 'fixtures') {
    apiData = apiData.filter((fixture: any) => 
      fixture.fixture.status.short === 'NS' || fixture.fixture.status.short === 'TBD'
    )
  } else if (type === 'finished') {
    apiData = apiData.filter((fixture: any) => fixture.fixture.status.short === 'FT')
  }
  
  return apiData
}
