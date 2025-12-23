// @ts-nocheck
// Deno Edge Function - Sport-agnostic team fetching (football & basketball)
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
    const league = url.searchParams.get("league")
    const country = url.searchParams.get("country")
    const teamId = url.searchParams.get("team_id")
    const search = url.searchParams.get("search")

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

    // Construct the API URL for teams (sport-agnostic)
    let apiUrl = `https://api.thesports.com/v1/${sport}/team/list?secret=${secretKey}&user=${userKey}`

    // Add optional parameters if provided
    if (league) apiUrl += `&league=${league}`
    if (country) apiUrl += `&country=${country}`
    if (teamId) apiUrl += `&team_id=${teamId}`
    if (search) apiUrl += `&search=${encodeURIComponent(search)}`

    console.log(`Fetching ${sport} teams from: ${apiUrl.replace(secretKey, '***').replace(userKey, '***')}`)

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`${sport} teams API request failed with status: ${response.status}`)
    }

    const data = await response.json()

    // Add metadata about the request
    const enrichedData = {
      ...data,
      metadata: {
        sport,
        endpoint: `${sport}/team/list`,
        requestTime: new Date().toISOString(),
        filters: {
          league,
          country,
          teamId,
          search
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
    console.error('Error in fetch-teams function:', error)

    return new Response(
      JSON.stringify({
        error: "Failed to fetch teams",
        details: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    )
  }
})
