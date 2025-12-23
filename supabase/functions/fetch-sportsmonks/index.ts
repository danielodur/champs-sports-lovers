import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get API credentials from environment variables
    const rapidApiKey = Deno.env.get("RAPID_SPORTSMONKS_API_KEY");

    if (!rapidApiKey) {
      return new Response(
        JSON.stringify({
          error: "Missing RAPID_SPORTSMONKS_API_KEY in environment variables",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Use the playground endpoint structure from the user's working screenshot
    const apiUrl = "https://sportmonks-data.p.rapidapi.com/football-pro/playground/apiendpoint_66632238-2d59-4ccc-8add-202200c07251";

    console.log("Fetching from SportsMonks playground endpoint");

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "X-RapidAPI-Key": rapidApiKey,
        "X-RapidAPI-Host": "sportmonks-data.p.rapidapi.com",
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
    });

    const responseText = await response.text();
    console.log(`Response status: ${response.status}`);
    console.log(`Response preview: ${responseText.substring(0, 200)}...`);

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          error: "SportsMonks API request failed",
          status: response.status,
          details: responseText,
          endpoint: "playground demo endpoint",
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Try to parse as JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      data = { rawResponse: responseText };
    }

    // Return the data with metadata
    const enrichedData = {
      success: true,
      data: data,
      metadata: {
        provider: "SportsMonks",
        endpoint: "playground demo",
        requestTime: new Date().toISOString(),
        statusCode: response.status,
      },
    };

    return new Response(JSON.stringify(enrichedData), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });

  } catch (error) {
    console.error("Error in fetch-sportsmonks function:", error);

    return new Response(
      JSON.stringify({
        error: "Function execution failed",
        details: error.message,
        stack: error
