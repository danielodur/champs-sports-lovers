#!/bin/bash

# ========================================
# TheSports API Edge Functions Deployment
# ========================================
# This script deploys all edge functions that use TheSports API
# Run this after adding the secrets to Supabase

echo "🚀 Deploying TheSports API Edge Functions..."
echo "============================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI not found!${NC}"
    echo "Please install it first: npm install -g supabase"
    exit 1
fi

echo -e "${YELLOW}📋 Before deploying, make sure you have added these secrets in Supabase Dashboard:${NC}"
echo "   Settings → Edge Functions → Secrets"
echo ""
echo "   Required secrets:"
echo "   - THESPORTS_API_KEY"
echo "   - THESPORTS_API_USER"
echo "   - API_FOOTBALL_KEY (existing)"
echo "   - RAPIDAPI_KEY_PRO (existing)"
echo "   - THESPORTSDB_API_KEY (existing)"
echo "   - FOOTBALL_DATA_ORG_API_KEY (existing)"
echo ""
read -p "Have you added the THESPORTS_API_KEY and THESPORTS_API_USER secrets? (y/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}❌ Deployment cancelled. Please add the secrets first.${NC}"
    echo ""
    echo "To add secrets:"
    echo "1. Go to: https://supabase.com/dashboard"
    echo "2. Select your project"
    echo "3. Go to: Settings → Edge Functions → Secrets"
    echo "4. Click 'Add Secret' and add:"
    echo "   - Name: THESPORTS_API_KEY, Value: a29cb6d591341faacdb8889a08dc5f93"
    echo "   - Name: THESPORTS_API_USER, Value: thecobuer"
    exit 0
fi

echo ""
echo -e "${GREEN}✅ Starting deployment...${NC}"
echo ""

# Deploy function 1: Main sports data function (with TheSports as primary)
echo -e "${YELLOW}📦 Deploying fetch-sports-data (main function with TheSports as primary API)...${NC}"
supabase functions deploy fetch-sports-data
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ fetch-sports-data deployed successfully${NC}"
else
    echo -e "${RED}❌ fetch-sports-data deployment failed${NC}"
fi
echo ""

# Deploy function 2: Football matches
echo -e "${YELLOW}📦 Deploying fetch-football-matches...${NC}"
supabase functions deploy fetch-football-matches
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ fetch-football-matches deployed successfully${NC}"
else
    echo -e "${RED}❌ fetch-football-matches deployment failed${NC}"
fi
echo ""

# Deploy function 3: Football leagues
echo -e "${YELLOW}📦 Deploying fetch-football-leagues...${NC}"
supabase functions deploy fetch-football-leagues
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ fetch-football-leagues deployed successfully${NC}"
else
    echo -e "${RED}❌ fetch-football-leagues deployment failed${NC}"
fi
echo ""

# Deploy function 4: Football teams
echo -e "${YELLOW}📦 Deploying fetch-football-teams...${NC}"
supabase functions deploy fetch-football-teams
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ fetch-football-teams deployed successfully${NC}"
else
    echo -e "${RED}❌ fetch-football-teams deployment failed${NC}"
fi
echo ""

echo "============================================="
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo ""
echo "📝 Next steps:"
echo "1. Test the functions in Supabase Dashboard"
echo "2. Restart your app to use the new TheSports API integration"
echo "3. Monitor the logs to verify TheSports API is being called first"
echo ""
echo "🧪 To test from Dashboard:"
echo "   1. Go to Edge Functions → fetch-sports-data"
echo "   2. Click 'Invoke' with body: {\"type\": \"live\", \"sport\": \"football\"}"
echo "   3. Check logs for: '🔄 Trying TheSports...'"
echo "   4. Should see: '✅ TheSports succeeded: X matches'"
echo ""
echo -e "${YELLOW}📖 Full documentation: THESPORTS_API_SETUP.md${NC}"
