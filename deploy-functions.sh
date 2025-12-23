#!/bin/bash

# Deployment script for Supabase Edge Functions
# Make sure you have Supabase CLI installed and are logged in

echo "🚀 Starting deployment of Supabase Edge Functions..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed. Please install it first:"
    echo "   npm install -g supabase"
    exit 1
fi

# Check if user is logged in to Supabase
if ! supabase status &> /dev/null; then
    echo "❌ Not logged in to Supabase. Please login first:"
    echo "   supabase login"
    exit 1
fi

# Navigate to the project directory
cd "$(dirname "$0")"

echo "📁 Current directory: $(pwd)"

# Deploy all functions
echo "📦 Deploying fetch-sports function..."
supabase functions deploy fetch-sports

echo "⚽ Deploying fetch-football-matches function..."
supabase functions deploy fetch-football-matches

echo "🏆 Deploying fetch-football-leagues function..."
supabase functions deploy fetch-football-leagues

echo "👥 Deploying fetch-football-teams function..."
supabase functions deploy fetch-football-teams

echo ""
echo "✅ All functions deployed successfully!"
echo ""
echo "📝 Next steps:"
echo "1. Set environment variables in your Supabase dashboard:"
echo "   - Go to Settings → API → Environment Variables"
echo "   - Add: THESPORTS_SECRET_KEY=your_secret_key_here"
echo "   - Add: THESPORTS_USER_KEY=your_user_key_here"
echo ""
echo "2. Test your functions using the URLs provided in Supabase dashboard"
echo "3. Use these endpoints in your frontend application"
echo ""
echo "🔗 Function endpoints will be available at:"
echo "   https://your-project-ref.functions.supabase.co/fetch-sports"
echo "   https://your-project-ref.functions.supabase.co/fetch-football-matches"
echo "   https://your-project-ref.functions.supabase.co/fetch-football-leagues"
echo "   https://your-project-ref.functions.supabase.co/fetch-football-teams"
echo ""
echo "🔑 Remember to use your Supabase anon key in the Authorization header when calling these functions!"
