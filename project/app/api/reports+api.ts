import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Create Supabase client with service role for server-side operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// POST - Create a new report
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const {
      reportedUserId,
      reportedUserName,
      reporterUserId,
      reporterEmail,
      postId,
      postContent,
      postSport,
      reason,
    } = body;

    // Validate required fields
    if (!reportedUserId || !reportedUserName || !postId) {
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Insert report into database
    const { data, error } = await supabase
      .from('reports')
      .insert([
        {
          reported_user_id: reportedUserId,
          reported_user_name: reportedUserName,
          reporter_user_id: reporterUserId || 'anonymous',
          reporter_email: reporterEmail || null,
          post_id: postId,
          post_content: postContent || '',
          post_sport: postSport || 'unknown',
          reason: reason || 'user_report',
          status: 'pending',
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return Response.json(
        { error: 'Failed to create report', details: error.message },
        { status: 500 }
      );
    }

    console.log('✅ Report created successfully:', data.id);

    return Response.json(
      {
        success: true,
        message: 'Report submitted successfully',
        reportId: data.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('API error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - List all reports (for testing/admin)
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const limit = url.searchParams.get('limit') || '50';
    const status = url.searchParams.get('status') || 'all';

    let query = supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    // Filter by status if provided
    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return Response.json(
        { error: 'Failed to fetch reports', details: error.message },
        { status: 500 }
      );
    }

    return Response.json(
      {
        success: true,
        reports: data,
        count: data.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('API error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

