// @ts-ignore - Deno imports work in Deno runtime
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore - Deno imports work in Deno runtime
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // @ts-ignore - Deno global exists in Deno runtime
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    // @ts-ignore - Deno global exists in Deno runtime
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('🔄 Starting automatic data sync...')

    const results: Array<{
      task: string;
      status: string;
      count?: number;
      error?: any;
    }> = []

    // ============================================
    // SYNC SPORTS DATA
    // ============================================

    // Task 1: Sync Live Football Matches
    try {
      console.log('📊 Syncing live football matches...')
      const liveResult = await syncSportsData(supabase, 'live', 'football')
      results.push({
        task: 'live_football_matches',
        status: liveResult.success ? 'success' : 'failed',
        count: liveResult.count || 0,
        error: liveResult.error
      })
      console.log(`✅ Live football matches: ${liveResult.count || 0} records`)
    } catch (error: any) {
      results.push({
        task: 'live_football_matches',
        status: 'failed',
        error: error.message
      })
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Task 1b: Sync Live Basketball Matches
    try {
      console.log('🏀 Syncing live basketball matches...')
      const liveBasketballResult = await syncSportsData(supabase, 'live', 'basketball')
      results.push({
        task: 'live_basketball_matches',
        status: liveBasketballResult.success ? 'success' : 'failed',
        count: liveBasketballResult.count || 0,
        error: liveBasketballResult.error
      })
      console.log(`✅ Live basketball matches: ${liveBasketballResult.count || 0} records`)
    } catch (error: any) {
      results.push({
        task: 'live_basketball_matches',
        status: 'failed',
        error: error.message
      })
    }

    await new Promise(resolve => setTimeout(resolve, 2000))

    // Task 2: Sync Football Fixtures
    try {
      console.log('📊 Syncing football fixtures...')
      const fixturesResult = await syncSportsData(supabase, 'fixtures', 'football')
      results.push({
        task: 'football_fixtures',
        status: fixturesResult.success ? 'success' : 'failed',
        count: fixturesResult.count || 0,
        error: fixturesResult.error
      })
      console.log(`✅ Football fixtures: ${fixturesResult.count || 0} records`)
    } catch (error: any) {
      results.push({
        task: 'football_fixtures',
        status: 'failed',
        error: error.message
      })
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Task 2b: Sync Basketball Fixtures
    try {
      console.log('🏀 Syncing basketball fixtures...')
      const basketballFixturesResult = await syncSportsData(supabase, 'fixtures', 'basketball')
      results.push({
        task: 'basketball_fixtures',
        status: basketballFixturesResult.success ? 'success' : 'failed',
        count: basketballFixturesResult.count || 0,
        error: basketballFixturesResult.error
      })
      console.log(`✅ Basketball fixtures: ${basketballFixturesResult.count || 0} records`)
    } catch (error: any) {
      results.push({
        task: 'basketball_fixtures',
        status: 'failed',
        error: error.message
      })
    }

    await new Promise(resolve => setTimeout(resolve, 2000))

    // Task 3: Sync Finished Football Matches
    try {
      console.log('📊 Syncing finished football matches...')
      const finishedResult = await syncSportsData(supabase, 'finished', 'football')
      results.push({
        task: 'finished_football_matches',
        status: finishedResult.success ? 'success' : 'failed',
        count: finishedResult.count || 0,
        error: finishedResult.error
      })
      console.log(`✅ Finished football matches: ${finishedResult.count || 0} records`)
    } catch (error: any) {
      results.push({
        task: 'finished_football_matches',
        status: 'failed',
        error: error.message
      })
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Task 3b: Sync Finished Basketball Matches
    try {
      console.log('🏀 Syncing finished basketball matches...')
      const finishedBasketballResult = await syncSportsData(supabase, 'finished', 'basketball')
      results.push({
        task: 'finished_basketball_matches',
        status: finishedBasketballResult.success ? 'success' : 'failed',
        count: finishedBasketballResult.count || 0,
        error: finishedBasketballResult.error
      })
      console.log(`✅ Finished basketball matches: ${finishedBasketballResult.count || 0} records`)
    } catch (error: any) {
      results.push({
        task: 'finished_basketball_matches',
        status: 'failed',
        error: error.message
      })
    }

    await new Promise(resolve => setTimeout(resolve, 2000))

    // ============================================
    // SYNC NEWS DATA
    // ============================================

    // Task 4: Sync Sports News
    try {
      console.log('📰 Syncing sports news...')
      const sportsNewsResult = await syncNewsData(supabase, 'sports', 'sports', 20)
      results.push({
        task: 'sports_news',
        status: sportsNewsResult.success ? 'success' : 'failed',
        count: sportsNewsResult.count || 0,
        error: sportsNewsResult.error
      })
      console.log(`✅ Sports news: ${sportsNewsResult.count || 0} articles`)
    } catch (error: any) {
      results.push({
        task: 'sports_news',
        status: 'failed',
        error: error.message
      })
    }

    await new Promise(resolve => setTimeout(resolve, 2000))

    // Task 5: Sync Football News
    try {
      console.log('📰 Syncing football news...')
      const footballNewsResult = await syncNewsData(supabase, 'football', 'football', 20)
      results.push({
        task: 'football_news',
        status: footballNewsResult.success ? 'success' : 'failed',
        count: footballNewsResult.count || 0,
        error: footballNewsResult.error
      })
      console.log(`✅ Football news: ${footballNewsResult.count || 0} articles`)
    } catch (error: any) {
      results.push({
        task: 'football_news',
        status: 'failed',
        error: error.message
      })
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Sync completed',
      results: results,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    })

  } catch (error: any) {
    console.error('❌ Error in sync-all-data:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    })
  }
})

// Helper function to sync sports data (copied from fetch-sports-data logic)
async function syncSportsData(supabase: any, type: string, sport: string): Promise<any> {
  try {
    // Get all API keys and trim whitespace
    // ✅ CORRECT PRIORITY: API Sports (#1 PRIMARY) → API-Football (#2 FALLBACK) → TheSportsDB (#3 FALLBACK)
    // @ts-ignore - Deno global exists in Deno runtime
    const apiSportsKey = Deno.env.get('API_SPORTS_KEY')?.trim()
    // @ts-ignore - Deno global exists in Deno runtime
    const apiFootballKey = Deno.env.get('API_FOOTBALL_KEY')?.trim()
    // @ts-ignore - Deno global exists in Deno runtime
    const theSportsDbKey = Deno.env.get('THESPORTSDB_API_KEY')?.trim()
    // @ts-ignore - Deno global exists in Deno runtime
    const footballDataOrgKey = Deno.env.get('FOOTBALL_DATA_ORG_API_KEY')?.trim()
    // @ts-ignore - Deno global exists in Deno runtime
    const rapidApiProKey = Deno.env.get('RAPIDAPI_KEY_PRO')?.trim()
    
    const apiConfigs = [
      { name: 'API-Sports', key: apiSportsKey, priority: 1 },
      { name: 'API-Football', key: apiFootballKey, priority: 2 },
      { name: 'TheSportsDB', key: theSportsDbKey, priority: 3 },
      { name: 'Football-Data.org', key: footballDataOrgKey, priority: 999 },
      { name: 'RapidAPI Pro', key: rapidApiProKey, priority: 999 }
    ].filter(api => api.key !== null && api.key !== undefined && api.key !== '' && api.priority < 900)

    // Log which APIs are available
    console.log(`🔑 Available APIs: ${apiConfigs.map(api => `${api.name} (${api.key ? 'key present: ' + api.key.substring(0, 8) + '...' : 'NO KEY'})`).join(', ')}`)
    console.log(`🔑 Total APIs configured: ${apiConfigs.length}`)

    if (apiConfigs.length === 0) {
      return { success: false, error: 'No API credentials configured' }
    }

    let apiData: any[] = []
    let lastError: Error | null = null

    // Try each API in priority order
    for (const apiConfig of apiConfigs) {
      let response: Response | null = null
      try {
        console.log(`🔄 Trying ${apiConfig.name}... (key starts with: ${apiConfig.key?.substring(0, 8)}...)`)

        if (apiConfig.name === 'API-Sports' || apiConfig.name === 'API-Football') {
          // ✅ BASKETBALL SUPPORT: Use basketball endpoint when sport is basketball
          const baseUrl = sport === 'basketball' 
            ? 'https://v1.basketball.api-sports.io' 
            : 'https://v3.football.api-sports.io';
          const apiHost = sport === 'basketball'
            ? 'v1.basketball.api-sports.io'
            : 'v3.football.api-sports.io';
          
          console.log(`📡 Fetching from ${baseUrl} with ${type}...`)
          
          if (type === 'live') {
            const endpoint = sport === 'basketball' 
              ? `${baseUrl}/games?live=all` 
              : `${baseUrl}/fixtures?live=all`;
            response = await fetch(endpoint, {
              headers: { 'x-rapidapi-key': apiConfig.key!, 'x-rapidapi-host': apiHost }
            })
          } else {
            const targetDate = new Date().toISOString().split('T')[0]
            const endpoint = sport === 'basketball'
              ? `${baseUrl}/games?date=${targetDate}`
              : `${baseUrl}/fixtures?date=${targetDate}`;
            response = await fetch(endpoint, {
              headers: { 'x-rapidapi-key': apiConfig.key!, 'x-rapidapi-host': apiHost }
            })
          }
          console.log(`📡 API-Football (${sport}) response status: ${response?.status}`)
        } else if (apiConfig.name === 'TheSportsDB') {
          console.log(`📡 Fetching from TheSportsDB with ${type}...`)
          // TheSportsDB doesn't support filtering by type easily, so we'll get today's events
          // Note: TheSportsDB uses different API structure, returning leagues/events
          const targetDate = new Date().toISOString().split('T')[0]
          response = await fetch(`https://www.thesportsdb.com/api/v1/json/${apiConfig.key}/eventsday.php?d=${targetDate}&s=Soccer`, {
            headers: { 'Content-Type': 'application/json' }
          })
          console.log(`📡 TheSportsDB response status: ${response?.status}`)
          
          // TheSportsDB has different response structure, need to transform it
          if (response && response.ok) {
            const sportsDbResult = await response.json()
            const events = sportsDbResult.events || []
            console.log(`📊 TheSportsDB raw events: ${events.length}`)
            
            // Transform TheSportsDB data to match API-Football structure
            apiData = events.map((event: any) => ({
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
                country: event.strCountry || 'Unknown'
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
              }
            }))
            
            console.log(`✅ TheSportsDB transformed ${apiData.length} events to fixtures format`)
            // Skip the normal response processing since we already transformed the data
            if (apiData.length > 0) {
              console.log(`✅ ${apiConfig.name} succeeded: ${apiData.length} matches`)
              break
            }
            continue // Skip to next API if no data
          }
        } else if (apiConfig.name === 'RapidAPI Pro') {
          if (type === 'live') {
            response = await fetch('https://api-football-v1.p.rapidapi.com/v3/fixtures?live=all', {
              headers: { 'X-RapidAPI-Key': apiConfig.key!, 'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com' }
            })
          } else {
            const targetDate = new Date().toISOString().split('T')[0]
            response = await fetch(`https://api-football-v1.p.rapidapi.com/v3/fixtures?date=${targetDate}`, {
              headers: { 'X-RapidAPI-Key': apiConfig.key!, 'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com' }
            })
          }
        }

        if (response && response.ok) {
          const result = await response.json()
          console.log(`📊 ${apiConfig.name} response:`, JSON.stringify(result).substring(0, 200))
          
          // ✅ CRITICAL FIX: Check for errors in response body (even if HTTP status is 200)
          if (result.errors && (Array.isArray(result.errors) && result.errors.length > 0 || 
              (typeof result.errors === 'object' && Object.keys(result.errors).length > 0))) {
            const errorMessages = Array.isArray(result.errors) 
              ? result.errors.join(', ')
              : Object.keys(result.errors).map(key => `${key}: ${result.errors[key]}`).join(', ')
            console.warn(`🚫 ${apiConfig.name} returned errors in response body: ${errorMessages}`)
            
            // Check if it's a rate limit or usage limit error
            const errorStr = errorMessages.toLowerCase()
            if (errorStr.includes('limit') || errorStr.includes('quota') || errorStr.includes('usage') || 
                errorStr.includes('exceeded') || errorStr.includes('429')) {
              console.warn(`🚫 ${apiConfig.name} usage limit detected - triggering fallback`)
              throw new Error(`RATE_LIMIT_EXCEEDED: ${apiConfig.name} usage limit exceeded`)
            }
            
            // For any errors in response body, trigger fallback
            throw new Error(`API_ERROR: ${apiConfig.name} returned errors: ${errorMessages.substring(0, 100)}`)
          }
          
          const originalCount = result.response?.length || 0
          apiData = result.response || []
          console.log(`📊 ${apiConfig.name} returned ${originalCount} matches BEFORE filtering`)
          
          // ✅ BASKETBALL SUPPORT: Transform basketball data to match football structure
          if (sport === 'basketball' && apiData.length > 0 && (apiConfig.name === 'API-Sports' || apiConfig.name === 'API-Football')) {
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
                country: game.country?.name || game.league?.country
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
              goals: {
                home: game.scores?.home?.total || 0,
                away: game.scores?.away?.total || 0
              }
            }));
            console.log(`✅ Transformed ${apiData.length} basketball games to fixture format`)
          }
          
          const beforeFilter = apiData.length
          if (type === 'fixtures') {
            apiData = apiData.filter((fixture: any) => 
              fixture.fixture?.status?.short === 'NS' || fixture.fixture?.status?.short === 'TBD'
            )
          } else if (type === 'finished') {
            apiData = apiData.filter((fixture: any) => 
              fixture.fixture?.status?.short === 'FT' || 
              fixture.fixture?.status?.short === 'AET' ||
              fixture.fixture?.status?.short === 'PEN'
            )
          }
          
          const afterFilter = apiData.length
          const filterRatio = beforeFilter > 0 ? afterFilter / beforeFilter : 0
          console.log(`✂️ ${apiConfig.name} filter: ${beforeFilter} → ${afterFilter} matches (${Math.round(filterRatio * 100)}% retained)`)

          // ✅ CRITICAL FIX: If filtering removed >95% of matches, this might indicate a problem
          if (beforeFilter > 10 && afterFilter === 0 && type !== 'live') {
            console.warn(`⚠️ ${apiConfig.name} filtering removed ALL ${beforeFilter} matches for ${type} - triggering fallback`)
            throw new Error(`FILTER_ERROR: ${apiConfig.name} filtering removed all matches (${beforeFilter} → 0)`)
          }

          if (apiData.length > 0) {
            // ✅ CRITICAL FIX: For primary API (API-Sports), if we got very few matches (< 5),
            // still try fallback APIs to see if we can get more data
            if (apiConfig.name === 'API-Sports' && apiData.length < 5 && apiConfigs.indexOf(apiConfig) < apiConfigs.length - 1 && type !== 'live') {
              console.warn(`⚠️ API-Sports returned only ${apiData.length} matches - trying fallback APIs to get more data...`)
              // Continue to try next API
              continue
            }
            
            console.log(`✅ ${apiConfig.name} succeeded: ${apiData.length} matches`)
            break
          } else {
            console.warn(`⚠️ ${apiConfig.name} returned 0 matches after filtering`)
            // Continue to next API unless this is the last one
            if (apiConfigs.indexOf(apiConfig) < apiConfigs.length - 1) {
              continue
            }
          }
        } else if (response) {
          const errorBody = await response.text()
          console.error(`❌ ${apiConfig.name} HTTP ${response.status}: ${errorBody.substring(0, 200)}`)
          
          // Specific rate limit detection
          if (response.status === 429) {
            throw new Error(`RATE_LIMIT_EXCEEDED: ${apiConfig.name} has hit rate limits`)
          } else if (response.status === 401 || response.status === 403) {
            throw new Error(`AUTH_FAILED: Invalid API key for ${apiConfig.name}`)
          } else {
            throw new Error(`HTTP ${response.status}: ${errorBody.substring(0, 100)}`)
          }
        }
      } catch (error: any) {
        const errorDetails = error instanceof Error ? error.message : String(error)
        const errorStack = error instanceof Error ? error.stack : 'No stack trace'
        console.warn(`⚠️ ${apiConfig.name} failed:`, errorDetails)
        console.warn(`⚠️ Error stack:`, errorStack)
        console.warn(`⚠️ Response status:`, response?.status || 'No response')
        lastError = error as Error
        continue
      }
    }

    if (apiData.length === 0) {
      return { success: false, error: `All APIs failed. Last error: ${lastError?.message || 'Unknown'}` }
    }

    // Cache the data
    const matchesToCache = apiData.map((fixture: any) => {
      const status = fixture.fixture.status.short === 'NS' || fixture.fixture.status.short === 'TBD' 
        ? 'upcoming'
        : fixture.fixture.status.short === 'FT' || fixture.fixture.status.short === 'AET' || fixture.fixture.status.short === 'PEN'
        ? 'finished'
        : 'live'

      return {
        match_id: fixture.fixture.id.toString(),
        sport: sport,
        league: fixture.league.name || 'Unknown',
        home_team: fixture.teams.home.name,
        away_team: fixture.teams.away.name,
        home_score: fixture.goals?.home || 0,
        away_score: fixture.goals?.away || 0,
        status: status,
        match_time: fixture.fixture.status.elapsed?.toString() || '',
        start_time: fixture.fixture.date,
        data: fixture
      }
    })

    if (matchesToCache.length > 0) {
      await supabase.from('cached_matches').upsert(matchesToCache, {
        onConflict: 'match_id',
        ignoreDuplicates: false
      })
    }

    return { success: true, count: apiData.length }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Helper function to sync news data (simplified version)
async function syncNewsData(supabase: any, query: string, category: string, limit: number): Promise<any> {
  try {
    // Get news API keys
    // @ts-ignore - Deno global exists in Deno runtime
    const newsDataApiKey = Deno.env.get('NEWSDATA_API_KEY')
    // @ts-ignore - Deno global exists in Deno runtime
    const guardianApiKey = Deno.env.get('GUARDIAN_API_KEY')
    // @ts-ignore - Deno global exists in Deno runtime
    const newsApiOrgKey = Deno.env.get('NEWS_API_ORG_KEY')
    // @ts-ignore - Deno global exists in Deno runtime
    const gNewsApiKey = Deno.env.get('GNEWS_API_KEY')
    // @ts-ignore - Deno global exists in Deno runtime
    const mediaStackApiKey = Deno.env.get('MEDIASTACK_API_KEY')
    // @ts-ignore - Deno global exists in Deno runtime
    const worldNewsApiKey = Deno.env.get('WORLD_NEWS_API_KEY')

    const allArticles: any[] = []
    const seenUrls = new Set<string>()

    // Try NewsAPI.org first
    if (newsApiOrgKey) {
      try {
        const response = await fetch(`https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&language=en&pageSize=${Math.min(limit, 8)}&apiKey=${newsApiOrgKey}`)
        if (response.ok) {
          const data = await response.json()
          const articles = (data.articles || []).filter((a: any) => a.url && !seenUrls.has(a.url))
          articles.forEach((a: any) => seenUrls.add(a.url))
          allArticles.push(...articles)
        }
      } catch (e) {
        console.warn('NewsAPI.org failed:', e)
      }
    }

    // Try NewsData.io
    if (newsDataApiKey && allArticles.length < limit) {
      try {
        const response = await fetch(`https://newsdata.io/api/1/news?apikey=${newsDataApiKey}&q=${encodeURIComponent(query)}&language=en&size=${Math.min(limit, 8)}`)
        if (response.ok) {
          const data = await response.json()
          const articles = (data.results || []).filter((a: any) => a.link && !seenUrls.has(a.link))
          articles.forEach((a: any) => seenUrls.add(a.link))
          allArticles.push(...articles)
        }
      } catch (e) {
        console.warn('NewsData.io failed:', e)
      }
    }

    if (allArticles.length === 0) {
      return { success: false, error: 'All news APIs failed' }
    }

    // Cache the data
    const newsToCache = allArticles.slice(0, limit).map((article: any) => {
      const articleId = article.url || article.link || Math.random().toString()
      return {
        article_id: articleId,
        title: article.title || 'No Title',
        description: article.description || '',
        content: article.content || article.description || '',
        url: article.url || article.link || '#',
        image_url: article.urlToImage || article.image_url || '',
        source: article.source?.name || article.source_name || 'Unknown',
        category: category,
        published_at: article.publishedAt || article.pubDate || new Date().toISOString(),
        data: article
      }
    })

    if (newsToCache.length > 0) {
      await supabase.from('cached_news').upsert(newsToCache, {
        onConflict: 'article_id',
        ignoreDuplicates: false
      })
    }

    return { success: true, count: allArticles.length }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
