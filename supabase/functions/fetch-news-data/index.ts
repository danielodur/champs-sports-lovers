import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NewsData {
  article_id: string
  title: string
  description: string
  content: string
  url: string
  image_url: string
  source: string
  category: string
  published_at: string
  data: any
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const url = new URL(req.url)
    
    // Try to get parameters from request body first, then fallback to query parameters
    let bodyParams: any = {}
    try {
      if (req.method === 'POST' && req.body) {
        bodyParams = await req.json()
      }
    } catch (e) {
      // Body might be empty or invalid JSON, that's okay
    }
    
    const query = bodyParams.query || url.searchParams.get('query') || 'sports'
    const category = bodyParams.category || url.searchParams.get('category') || 'sports'
    const limit = parseInt(bodyParams.limit || url.searchParams.get('limit') || '20')
    const forceRefresh = bodyParams.refresh === true || url.searchParams.get('refresh') === 'true'

    console.log(`📰 Fetching news for: ${query} (category: ${category})`)

    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const { data: cachedData, error: cacheError } = await supabase
        .from('cached_news')
        .select('*')
        .eq('category', category)
        .order('published_at', { ascending: false })
        .limit(limit)

      if (!cacheError && cachedData && cachedData.length > 0) {
        // Check if cache is fresh (less than 15 minutes old)
        const cacheAge = Date.now() - new Date(cachedData[0].updated_at).getTime()
        const maxAge = 15 * 60 * 1000 // 15 minutes

        if (cacheAge < maxAge) {
          console.log(`✅ Using cached news (${Math.round(cacheAge / 1000)}s old)`)
          return new Response(JSON.stringify({
            success: true,
            cached: true,
            data: cachedData.map(item => item.data),
            count: cachedData.length
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          })
        }
      }
    }

    // Get API keys
    const newsDataApiKey = Deno.env.get('NEWSDATA_API_KEY')
    const guardianApiKey = Deno.env.get('GUARDIAN_API_KEY')
    const newsApiOrgKey = Deno.env.get('NEWS_API_ORG_KEY')
    const gNewsApiKey = Deno.env.get('GNEWS_API_KEY')
    const mediaStackApiKey = Deno.env.get('MEDIASTACK_API_KEY')
    const worldNewsApiKey = Deno.env.get('WORLD_NEWS_API_KEY')

    const allArticles: any[] = []
    const seenUrls = new Set<string>()

    // Helper to add unique articles
    const addUniqueArticles = (articles: any[]) => {
      articles.forEach(article => {
        const url = article.url || article.link || article.webUrl
        if (url && !seenUrls.has(url) && article.title) {
          seenUrls.add(url)
          allArticles.push(article)
        }
      })
    }

    // Try multiple APIs in parallel
    const apiPromises = []

    // 1. NewsAPI.org
    if (newsApiOrgKey) {
      apiPromises.push(
        fetch(`https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&language=en&pageSize=${Math.min(limit, 8)}&apiKey=${newsApiOrgKey}`)
          .then(res => res.json())
          .then(data => data.articles || [])
          .catch(() => [])
      )
    }

    // 2. NewsData.io
    if (newsDataApiKey) {
      apiPromises.push(
        fetch(`https://newsdata.io/api/1/news?apikey=${newsDataApiKey}&q=${encodeURIComponent(query)}&language=en&size=${Math.min(limit, 8)}`)
          .then(res => res.json())
          .then(data => data.results || [])
          .catch(() => [])
      )
    }

    // 3. Guardian API
    if (guardianApiKey) {
      apiPromises.push(
        fetch(`https://content.guardianapis.com/search?q=${encodeURIComponent(query)}&api-key=${guardianApiKey}&page-size=${Math.min(limit, 8)}&show-fields=thumbnail,body`)
          .then(res => res.json())
          .then(data => data.response?.results || [])
          .catch(() => [])
      )
    }

    // 4. GNews API
    if (gNewsApiKey) {
      apiPromises.push(
        fetch(`https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&token=${gNewsApiKey}&lang=en&max=${Math.min(limit, 8)}`)
          .then(res => res.json())
          .then(data => data.articles || [])
          .catch(() => [])
      )
    }

    // 5. MediaStack API
    if (mediaStackApiKey) {
      apiPromises.push(
        fetch(`https://api.mediastack.com/v1/news?access_key=${mediaStackApiKey}&keywords=${encodeURIComponent(query)}&languages=en&limit=${Math.min(limit, 8)}`)
          .then(res => res.json())
          .then(data => data.data || [])
          .catch(() => [])
      )
    }

    // 6. World News API
    if (worldNewsApiKey) {
      apiPromises.push(
        fetch(`https://api.worldnewsapi.com/search-news?text=${encodeURIComponent(query)}&number=${Math.min(limit, 8)}`, {
          headers: {
            'X-API-KEY': worldNewsApiKey
          }
        })
          .then(res => res.json())
          .then(data => data.news || [])
          .catch(() => [])
      )
    }

    // Wait for all APIs and combine results
    const results = await Promise.allSettled(apiPromises)
    results.forEach(result => {
      if (result.status === 'fulfilled') {
        addUniqueArticles(result.value)
      }
    })

    // Transform to our format
    const newsToCache: NewsData[] = allArticles.slice(0, limit).map((article: any) => {
      const articleId = article.url || article.link || article.webUrl || Math.random().toString()
      const title = article.title || article.webTitle || 'No Title'
      const description = article.description || article.fields?.trailText || article.excerpt || ''
      const content = article.content || article.fields?.body || description
      const url = article.url || article.link || article.webUrl || '#'
      const imageUrl = article.urlToImage || article.image_url || article.fields?.thumbnail || article.image || ''
      const source = article.source?.name || article.source_name || article.provider?.[0]?.name || 'Unknown'
      const publishedAt = article.publishedAt || article.pubDate || article.webPublicationDate || article.published_at || new Date().toISOString()

      return {
        article_id: articleId,
        title: title,
        description: description,
        content: content,
        url: url,
        image_url: imageUrl,
        source: source,
        category: category,
        published_at: publishedAt,
        data: article
      }
    })

    // Cache the data
    if (newsToCache.length > 0) {
      const { error: upsertError } = await supabase
        .from('cached_news')
        .upsert(newsToCache, {
          onConflict: 'article_id',
          ignoreDuplicates: false
        })

      if (upsertError) {
        console.error('Error caching news:', upsertError)
      } else {
        console.log(`✅ Cached ${newsToCache.length} news articles`)
      }
    }

    // Log sync
    await supabase.from('api_sync_logs').insert({
      sync_type: 'news',
      status: 'success',
      records_updated: newsToCache.length,
      completed_at: new Date().toISOString()
    })

    return new Response(JSON.stringify({
      success: true,
      cached: false,
      data: allArticles.slice(0, limit),
      count: allArticles.length
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    })

  } catch (error: any) {
    const errorMessage = error?.message || 'Unknown error'
    console.error('❌ Error in fetch-news-data:', errorMessage)
    console.error('Error details:', error)

    // Check if it's a missing API keys issue
    const hasApiKeys = Deno.env.get('NEWSDATA_API_KEY') || 
                      Deno.env.get('GUARDIAN_API_KEY') || 
                      Deno.env.get('NEWS_API_ORG_KEY') || 
                      Deno.env.get('GNEWS_API_KEY') ||
                      Deno.env.get('MEDIASTACK_API_KEY') ||
                      Deno.env.get('WORLD_NEWS_API_KEY')
    
    if (!hasApiKeys) {
      console.error('⚠️ No news API keys configured in Supabase secrets')
    }

    // Log error
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      const supabase = createClient(supabaseUrl, supabaseServiceKey)
      
      await supabase.from('api_sync_logs').insert({
        sync_type: 'news',
        status: 'failed',
        error_message: errorMessage,
        completed_at: new Date().toISOString()
      })
    } catch (logError) {
      console.error('Failed to log error:', logError)
    }

    return new Response(JSON.stringify({
      success: false,
      error: errorMessage,
      message: hasApiKeys ? 'API request failed. Check API keys and rate limits.' : 'No news API keys configured in Supabase secrets.'
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    })
  }
})

