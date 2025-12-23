import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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
    const url = new URL(req.url)

    // Get optional query parameters
    const endpoint = url.searchParams.get("endpoint") || "fixtures" // fixtures, leagues, teams, standings
    const league = url.searchParams.get("league")
    const season = url.searchParams.get("season") || "2024"
    const date = url.searchParams.get("date")
    const status = url.searchParams.get("status") // NS, LIVE, FT, etc.
    const team = url.searchParams.get("team")
    const live = url.searchParams.get("live")

    // Get API credentials from environment variables
    const rapidApiKey = Deno.env.get("RAPIDAPI_KEY")

    if (!rapidApiKey) {
      return new Response(
        JSON.stringify({ error: "Missing RAPIDAPI_KEY in environment variables" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      )
    }

    // Construct the API URL based on endpoint
    let apiUrl = `https://api-football-v1.p.rapidapi.com/v3/${endpoint}`
    let queryParams = new URLSearchParams()

    // Add parameters based on endpoint
    switch (endpoint) {
      case 'fixtures':
        if (league) queryParams.append('league', league)
        if (season) queryParams.append('season', season)
        if (date) queryParams.append('date', date)
        if (status) queryParams.append('status', status)
        if (team) queryParams.append('team', team)
        if (live === 'all') queryParams.append('live', 'all')
        break

      case 'leagues':
        if (season) queryParams.append('season', season)
        break

      case 'teams':
        if (league) queryParams.append('league', league)
        if (season) queryParams.append('season', season)
        break

      case 'standings':
        if (league) queryParams.append('league', league)
        if (season) queryParams.append('season', season)
        break
    }

    if (queryParams.toString()) {
      apiUrl += `?${queryParams.toString()}`
    }

    console.log(`Fetching from API-Football: ${apiUrl}`)

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': rapidApiKey,
        'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com',
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`API-Football request failed with status: ${response.status}`)
    }

    const data = await response.json()

    // Add metadata about the request
    const enrichedData = {
      ...data,
      metadata: {
        provider: 'API-Football',
        endpoint: endpoint,
        requestTime: new Date().toISOString(),
        filters: {
          league,
          season,
          date,
          status,
          team,
          live
        }
      }
    }

    return new Response(JSON.stringify(enrichedData), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    })

  } catch (error) {
    console.error('Error in fetch-api-football function:', error)

    return new Response(
      JSON.stringify({
        error: "Failed to fetch football data from API-Football",
        details: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    )
  }
})
