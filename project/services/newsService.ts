import Constants from 'expo-constants';

interface NewsArticle {
  id: string;
  title: string;
  description: string;
  content: string;
  url: string;
  urlToImage: string;
  publishedAt: string;
  source: {
    id: string;
    name: string;
  };
  category: 'football' | 'basketball' | 'rugby' | 'boxing' | 'general';
  readTime: string;
}

interface NewsApiResponse {
  status: string;
  totalResults: number;
  articles: Array<{
    title: string;
    description: string;
    content: string;
    url: string;
    urlToImage: string;
    publishedAt: string;
    source: {
      id: string;
      name: string;
    };
  }>;
}

class NewsService {
  private baseUrl = 'https://newsapi.org/v2';
  private apiKey = Constants.expoConfig?.extra?.newsApiKey || 'demo_key';
  
  // Cache for news articles
  private cache = new Map<string, { data: NewsArticle[]; timestamp: number }>();
  private readonly CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

  private async makeRequest<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    
    // Add API key and parameters
    url.searchParams.append('apiKey', this.apiKey);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    console.log(`📰 Fetching news from: ${endpoint}`);
    
    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'SportsApp/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`News API Error: ${response.status} - ${response.statusText}`);
    }

    return response.json();
  }

  private convertToNewsArticle(article: any, category: string): NewsArticle {
    // Calculate read time based on content length
    const wordsPerMinute = 200;
    const wordCount = (article.content || article.description || '').split(' ').length;
    const readTime = Math.max(1, Math.ceil(wordCount / wordsPerMinute));

    return {
      id: `${article.url.split('/').pop()}_${Date.now()}`,
      title: article.title || 'No Title',
      description: article.description || 'No description available',
      content: article.content || article.description || 'Content not available',
      url: article.url,
      urlToImage: article.urlToImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(article.source.name)}&background=FF6B35&color=fff&size=400x300`,
      publishedAt: article.publishedAt,
      source: article.source,
      category: category as any,
      readTime: `${readTime} min read`,
    };
  }

  async getSportsNews(sport: string = 'sports', limit: number = 20): Promise<NewsArticle[]> {
    const cacheKey = `news-${sport}-${limit}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log(`📰 Using cached news for: ${sport}`);
      return cached.data;
    }

    // Temporarily use fallback news to avoid timeout errors
    console.log(`📰 Using fallback news for: ${sport} (News API disabled)`);
    return this.getFallbackNews(sport, limit);

    /* Disabled to prevent timeout errors
    try {
      // Map sports to search terms
      const sportKeywords: Record<string, string> = {
        football: 'football OR soccer OR "premier league" OR "champions league"',
        basketball: 'basketball OR NBA OR "march madness"',
        rugby: 'rugby OR "rugby world cup"',
        boxing: 'boxing OR UFC OR "mixed martial arts"',
        sports: 'sports OR football OR basketball OR soccer OR rugby',
      };

      const searchQuery = sportKeywords[sport.toLowerCase()] || sportKeywords.sports;

      const response = await this.makeRequest<NewsApiResponse>('/everything', {
        q: searchQuery,
        sortBy: 'publishedAt',
        language: 'en',
        pageSize: limit.toString(),
        domains: 'bbc.com,espn.com,skysports.com,goal.com,nba.com,nfl.com,reuters.com,theguardian.com',
      });

      const articles = response.articles
        .filter(article => article.title && article.description && !article.title.includes('[Removed]'))
        .slice(0, limit)
        .map(article => this.convertToNewsArticle(article, sport));

      // Cache the results
      this.cache.set(cacheKey, { data: articles, timestamp: Date.now() });
      
      console.log(`📰 Fetched ${articles.length} real news articles for ${sport}`);
      return articles;
      
    } catch (error) {
      console.error('📰 News API Error:', error);
      
      // Return fallback news if API fails
      return this.getFallbackNews(sport, limit);
    }
    */
  }

  async getTopHeadlines(category: string = 'sports', limit: number = 10): Promise<NewsArticle[]> {
    const cacheKey = `headlines-${category}-${limit}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    // Temporarily use fallback news to avoid timeout errors
    console.log(`📰 Using fallback headlines for: ${category} (News API disabled)`);
    return this.getFallbackNews(category, limit);

    /* Disabled to prevent timeout errors
    try {
      const response = await this.makeRequest<NewsApiResponse>('/top-headlines', {
        category: category === 'sports' ? 'sports' : 'general',
        country: 'us',
        pageSize: limit.toString(),
      });

      const articles = response.articles
        .filter(article => article.title && article.description)
        .slice(0, limit)
        .map(article => this.convertToNewsArticle(article, category));

      this.cache.set(cacheKey, { data: articles, timestamp: Date.now() });
      
      return articles;
      
    } catch (error) {
      console.error('Headlines API Error:', error);
      return this.getFallbackNews(category, limit);
    }
    */
  }

  private getFallbackNews(sport: string, limit: number): NewsArticle[] {
    // Generate realistic fallback news when API is unavailable
    const fallbackArticles: NewsArticle[] = [
      {
        id: 'fb1',
        title: 'Premier League: Manchester City vs Arsenal Preview',
        description: 'Two title contenders clash in what promises to be a thrilling encounter at the Etihad Stadium.',
        content: 'Manchester City host Arsenal in a crucial Premier League fixture that could define the title race...',
        url: 'https://example.com/city-arsenal-preview',
        urlToImage: 'https://images.pexels.com/photos/274506/pexels-photo-274506.jpeg',
        publishedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        source: { id: 'bbc-sport', name: 'BBC Sport' },
        category: 'football',
        readTime: '3 min read',
      },
      {
        id: 'fb2',
        title: 'Champions League Draw: Top Teams Await Quarterfinal Opponents',
        description: 'The Champions League quarterfinal draw promises exciting matchups as Europe\'s elite clubs learn their fate.',
        content: 'UEFA Champions League quarterfinal draw has produced some fascinating matchups...',
        url: 'https://example.com/champions-league-draw',
        urlToImage: 'https://images.pexels.com/photos/1884574/pexels-photo-1884574.jpeg',
        publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        source: { id: 'uefa', name: 'UEFA.com' },
        category: 'football',
        readTime: '4 min read',
      },
      {
        id: 'bb1',
        title: 'NBA Finals: Lakers Advance to Championship',
        description: 'Los Angeles Lakers secure their spot in the NBA Finals after a dominant playoff run.',
        content: 'The Lakers have shown exceptional form throughout the playoffs, led by their star players...',
        url: 'https://example.com/lakers-finals',
        urlToImage: 'https://images.pexels.com/photos/1752757/pexels-photo-1752757.jpeg',
        publishedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        source: { id: 'espn', name: 'ESPN' },
        category: 'basketball',
        readTime: '4 min read',
      },
      {
        id: 'bb2',
        title: 'NBA Trade Deadline: Major Moves Reshape Eastern Conference',
        description: 'Several blockbuster trades at the NBA deadline have significantly altered the playoff picture.',
        content: 'The NBA trade deadline brought unexpected moves that will impact the championship race...',
        url: 'https://example.com/nba-trade-deadline',
        urlToImage: 'https://images.pexels.com/photos/358042/pexels-photo-358042.jpeg',
        publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        source: { id: 'nba', name: 'NBA.com' },
        category: 'basketball',
        readTime: '5 min read',
      },
      {
        id: 'rg1',
        title: 'Rugby World Cup: England vs South Africa Semi-Final',
        description: 'A rematch of the 2019 final as England face South Africa in the World Cup semi-final.',
        content: 'England and South Africa prepare for an epic showdown in the Rugby World Cup semi-final...',
        url: 'https://example.com/eng-sa-rugby',
        urlToImage: 'https://images.pexels.com/photos/159841/rugby-player-action-sport-159841.jpeg',
        publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        source: { id: 'sky-sports', name: 'Sky Sports' },
        category: 'rugby',
        readTime: '5 min read',
      },
      {
        id: 'bx1',
        title: 'Boxing: Heavyweight Title Unification Fight Announced',
        description: 'The long-awaited heavyweight unification bout has finally been confirmed for next month.',
        content: 'Boxing fans worldwide are excited about the upcoming heavyweight unification fight...',
        url: 'https://example.com/heavyweight-unification',
        urlToImage: 'https://images.pexels.com/photos/163403/boxing-boxer-fight-sports-163403.jpeg',
        publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        source: { id: 'boxing-news', name: 'Boxing News' },
        category: 'boxing',
        readTime: '6 min read',
      },
      {
        id: 'sp1',
        title: 'Olympic Games: Record-Breaking Performances Expected',
        description: 'Athletes are setting new records in qualifying events ahead of the upcoming Olympic Games.',
        content: 'With the Olympic Games approaching, athletes across all sports are achieving new personal bests...',
        url: 'https://example.com/olympic-records',
        urlToImage: 'https://images.pexels.com/photos/1263349/pexels-photo-1263349.jpeg',
        publishedAt: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(),
        source: { id: 'olympic-channel', name: 'Olympic Channel' },
        category: 'general',
        readTime: '7 min read',
      },
      {
        id: 'sp2',
        title: 'Women\'s Sports: Record Viewership Numbers Continue to Rise',
        description: 'Female athletes are attracting unprecedented global audiences across multiple sports.',
        content: 'The growth of women\'s professional sports continues to break new ground with record viewership...',
        url: 'https://example.com/womens-sports-growth',
        urlToImage: 'https://images.pexels.com/photos/935977/pexels-photo-935977.jpeg',
        publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        source: { id: 'sports-illustrated', name: 'Sports Illustrated' },
        category: 'general',
        readTime: '8 min read',
      },
    ];

    // Filter by sport and limit
    return fallbackArticles
      .filter(article => sport === 'sports' || sport === 'general' || article.category === sport)
      .slice(0, limit);
  }

  async searchNews(query: string, limit: number = 10): Promise<NewsArticle[]> {
    try {
      const response = await this.makeRequest<NewsApiResponse>('/everything', {
        q: query,
        sortBy: 'relevancy',
        language: 'en',
        pageSize: limit.toString(),
      });

      return response.articles
        .filter(article => article.title && article.description)
        .slice(0, limit)
        .map(article => this.convertToNewsArticle(article, 'general'));
        
    } catch (error) {
      console.error('Search News Error:', error);
      return [];
    }
  }
}

export const newsService = new NewsService();
export type { NewsArticle }; 