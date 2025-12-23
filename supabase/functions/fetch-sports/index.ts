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
    const endpoint = url.searchParams.get("endpoint")

    if (!endpoint) {
      return new Response(
        JSON.stringify({ error: "Missing endpoint parameter" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      )
    }

    // Get API credentials from environment variables
    const secretKey = Deno.env.get("THESPORTS_SECRET_KEY")
    const userKey = Deno.env.get("THESPORTS_USER_KEY")

    if (!secretKey || !userKey) {
      return new Response(
        JSON.stringify({ error: "Missing API credentials in environment variables" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      )
    }

    // Construct the API URL based on thesports.com structure
    const apiUrl = `https://api.thesports.com/v1/${endpoint}?secret=${secretKey}&user=${userKey}`

    console.log(`Fetching data from: ${apiUrl.replace(secretKey, '***').replace(userKey, '***')}`)

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`API request failed with status: ${response.status}`)
    }

    const data = await response.json()

    return new Response(JSON.stringify(data), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    })

  } catch (error) {
    console.error('Error in fetch-sports function:', error)

    return new Response(
      JSON.stringify({
        error: "Failed to fetch sports data",
        details: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    )
  }
})
