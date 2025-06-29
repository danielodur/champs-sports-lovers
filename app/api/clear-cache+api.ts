import { sportsApiService } from '@/services/sportsApiService';

export async function POST(request: Request) {
  sportsApiService.clearCache();
  
  return new Response(JSON.stringify({ success: true, message: 'All caches cleared' }), {
    headers: { 'Content-Type': 'application/json' },
  });
}