import { sportsApiService } from '@/services/sportsApiService';
import { clearMatchCache, clearLiveMatchCache } from '@/services/matchService';
import { newsService } from '@/services/newsService';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    switch (action) {
      case 'clear-cache':
        // Clear all caches
        clearMatchCache();
        sportsApiService.clearCache();
        return Response.json({ 
          success: true, 
          message: 'All caches cleared successfully',
          timestamp: new Date().toISOString()
        });

      case 'clear-live-cache':
        // Clear only live match cache
        clearLiveMatchCache();
        return Response.json({ 
          success: true, 
          message: 'Live match cache cleared successfully',
          timestamp: new Date().toISOString()
        });

      case 'test-live':
        // Test live matches API
        console.log('🧪 Testing live matches API...');
        const liveMatches = await sportsApiService.getLiveScores();
        return Response.json({ 
          success: true, 
          count: liveMatches.length,
          matches: liveMatches.slice(0, 3), // Return first 3 for testing
          timestamp: new Date().toISOString()
        });

      case 'test-fixtures':
        // Test fixtures API
        console.log('🧪 Testing fixtures API...');
        const today = new Date().toISOString().split('T')[0];
        const tomorrow = new Date(Date.now() + 24*60*60*1000).toISOString().split('T')[0];
        
        const [defaultFixtures, todayFixtures, tomorrowFixtures] = await Promise.all([
          sportsApiService.getFixtures(),
          sportsApiService.getFixtures(today),
          sportsApiService.getFixtures(tomorrow)
        ]);
        
        return Response.json({ 
          success: true, 
          defaultCount: defaultFixtures.length,
          todayCount: todayFixtures.length,
          tomorrowCount: tomorrowFixtures.length,
          defaultSample: defaultFixtures.slice(0, 2),
          todaySample: todayFixtures.slice(0, 2),
          tomorrowSample: tomorrowFixtures.slice(0, 2),
          timestamp: new Date().toISOString()
        });

      case 'test-finished':
        // Test finished matches API
        console.log('🧪 Testing finished matches API...');
        const finished = await sportsApiService.getFinishedMatches();
        return Response.json({ 
          success: true, 
          count: finished.length,
          matches: finished.slice(0, 3), // Return first 3 for testing
          timestamp: new Date().toISOString()
        });

      case 'test-news':
        // Test news API with rich content
        console.log('🧪 Testing news API with rich content...');
        const news = await newsService.getSportsNews('football', 5);
        const sampleNews = news.slice(0, 2);
        
        // Test rich content for first article
        let richContent = null;
        if (sampleNews.length > 0) {
          richContent = await newsService.getRichContent(sampleNews[0].id, sampleNews[0].url);
        }
        
        return Response.json({ 
          success: true, 
          newsCount: news.length,
          news: sampleNews,
          richContent: richContent ? {
            hasVideos: richContent.videos.length > 0,
            hasRelatedArticles: richContent.relatedArticles.length > 0,
            hasFullText: richContent.fullText.length > 100,
            videosCount: richContent.videos.length,
            relatedCount: richContent.relatedArticles.length
          } : null,
          timestamp: new Date().toISOString()
        });

      case 'test-all-apis':
        // Comprehensive test of all APIs
        console.log('🧪 Testing ALL APIs comprehensively...');
        
        const [liveTest, fixturesTest, finishedTest, newsTest] = await Promise.allSettled([
          sportsApiService.getLiveScores(),
          sportsApiService.getFixtures(),
          sportsApiService.getFinishedMatches(),
          newsService.getSportsNews('sports', 3)
        ]);

        return Response.json({
          success: true,
          results: {
            liveMatches: {
              status: liveTest.status,
              count: liveTest.status === 'fulfilled' ? liveTest.value.length : 0,
              error: liveTest.status === 'rejected' ? liveTest.reason?.message : null
            },
            fixtures: {
              status: fixturesTest.status,
              count: fixturesTest.status === 'fulfilled' ? fixturesTest.value.length : 0,
              error: fixturesTest.status === 'rejected' ? fixturesTest.reason?.message : null
            },
            finishedMatches: {
              status: finishedTest.status,
              count: finishedTest.status === 'fulfilled' ? finishedTest.value.length : 0,
              error: finishedTest.status === 'rejected' ? finishedTest.reason?.message : null
            },
            news: {
              status: newsTest.status,
              count: newsTest.status === 'fulfilled' ? newsTest.value.length : 0,
              error: newsTest.status === 'rejected' ? newsTest.reason?.message : null
            }
          },
          timestamp: new Date().toISOString()
        });

      default:
        return Response.json({ 
          success: false, 
          message: 'Invalid action. Use: clear-cache, clear-live-cache, test-live, test-fixtures, test-finished, test-news, test-all-apis',
          availableActions: ['clear-cache', 'clear-live-cache', 'test-live', 'test-fixtures', 'test-finished', 'test-news', 'test-all-apis']
        });
    }
  } catch (error) {
    console.error('❌ Test API error:', error);
    return Response.json({ 
      success: false, 
      error: String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 