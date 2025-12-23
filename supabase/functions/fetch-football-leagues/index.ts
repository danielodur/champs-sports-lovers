// @ts-nocheck
// Deno Edge Function - Sport-agnostic league fetching (football & basketball)
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

    // Get sport parameter (football or basketball)
    const sport = url.searchParams.get("sport") || "football"
    
    // Get optional query parameters
    const country = url.searchParams.get("country")
    const season = url.searchParams.get("season")
    const leagueId = url.searchParams.get("league_id")

    // Get API credentials from environment variables
    const secretKey = Deno.env.get("THESPORTS_API_KEY")
    const userKey = Deno.env.get("THESPORTS_API_USER")

    if (!secretKey || !userKey) {
      return new Response(
        JSON.stringify({ error: "Missing API credentials in environment variables" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      )
    }

    // Construct the API URL for leagues (sport-agnostic)
    let apiUrl = `https://api.thesports.com/v1/${sport}/league/list?secret=${secretKey}&user=${userKey}`

    // Add optional parameters if provided
    if (country) apiUrl += `&country=${country}`
    if (season) apiUrl += `&season=${season}`
    if (leagueId) apiUrl += `&league_id=${leagueId}`

    console.log(`Fetching ${sport} leagues from: ${apiUrl.replace(secretKey, '***').replace(userKey, '***')}`)

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`${sport} leagues API request failed with status: ${response.status}`)
    }

    const data = await response.json()

    // Add metadata about the request
    const enrichedData = {
      ...data,
      metadata: {
        sport,
        endpoint: `${sport}/league/list`,
        requestTime: new Date().toISOString(),
        filters: {
          country,
          season,
          leagueId
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
    console.error('Error in fetch-leagues function:', error)

    return new Response(
      JSON.stringify({
        error: "Failed to fetch leagues",
        details: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    )
  }
})
