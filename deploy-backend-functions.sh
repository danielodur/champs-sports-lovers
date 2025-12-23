#!/bin/bash

# Deployment script for Backend API Functions
# This script deploys all Supabase Edge Functions needed for backend API calls

echo "🚀 Starting deployment of Backend API Functions..."
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed."
    echo "   Install it with: npm install -g supabase"
    exit 1
fi

# Check if user is logged in
if ! supabase status &> /dev/null; then
    echo "❌ Not logged in to Supabase."
    echo "   Login with: supabase login"
    exit 1
fi

echo "📦 Deploying fetch-sports-data function..."
supabase functions deploy fetch-sports-data

if [ $? -ne 0 ]; then
    echo "❌ Failed to deploy fetch-sports-data"
    exit 1
fi

echo ""
echo "📰 Deploying fetch-news-data function..."
supabase functions deploy fetch-news-data

if [ $? -ne 0 ]; then
    echo "❌ Failed to deploy fetch-news-data"
    exit 1
fi

echo ""
echo "🔄 Deploying sync-all-data function..."
supabase functions deploy sync-all-data

if [ $? -ne 0 ]; then
    echo "❌ Failed to deploy sync-all-data"
    exit 1
fi

echo ""
echo "✅ All functions deployed successfully!"
echo ""
echo "📝 Next steps:"
echo "1. Set environment variables in Supabase Dashboard:"
echo "   - Go to Settings → Edge Functions → Secrets"
echo "   - Add: RAPIDAPI_KEY_PRO, API_FOOTBALL_KEY, etc."
echo ""
echo "2. Run database migration:"
echo "   - Go to SQL Editor in Supabase Dashboard"
echo "   - Run: supabase/migrations/001_setup_backend_api_tables.sql"
echo ""
echo "3. Test functions:"
echo "   - Go to Edge Functions in Supabase Dashboard"
echo "   - Click 'Invoke' on each function to test"
echo ""
echo "4. Set up cron jobs (see SETUP_BACKEND_APIS.md)"
echo ""
echo "🔗 Function URLs:"
echo "   - fetch-sports-data: https://YOUR_PROJECT.functions.supabase.co/fetch-sports-data"
echo "   - fetch-news-data: https://YOUR_PROJECT.functions.supabase.co/fetch-news-data"
echo "   - sync-all-data: https://YOUR_PROJECT.functions.supabase.co/sync-all-data"
echo ""

