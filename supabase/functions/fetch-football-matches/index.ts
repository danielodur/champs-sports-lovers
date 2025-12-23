// @ts-nocheck
// Deno Edge Function - Sport-agnostic match fetching (football & basketball)
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
    const date = url.searchParams.get("date") // Format: YYYY-MM-DD
    const league = url.searchParams.get("league")
    const team = url.searchParams.get("team")
    const status = url.searchParams.get("status") // live, finished, upcoming

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

    // Construct the API URL for matches (sport-agnostic)
    let apiUrl = `https://api.thesports.com/v1/${sport}/match/dairy?secret=${secretKey}&user=${userKey}`

    // Add optional parameters if provided
    if (date) apiUrl += `&date=${date}`
    if (league) apiUrl += `&league=${league}`
    if (team) apiUrl += `&team=${team}`
    if (status) apiUrl += `&status=${status}`

    console.log(`Fetching ${sport} matches from: ${apiUrl.replace(secretKey, '***').replace(userKey, '***')}`)

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`${sport} matches API request failed with status: ${response.status}`)
    }

    const data = await response.json()

    // Add metadata about the request
    const enrichedData = {
      ...data,
      metadata: {
        sport,
        endpoint: `${sport}/match/dairy`,
        requestTime: new Date().toISOString(),
        filters: {
          date,
          league,
          team,
          status
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
    console.error('Error in fetch-matches function:', error)

    return new Response(
      JSON.stringify({
        error: "Failed to fetch matches",
        details: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    )
  }
})
