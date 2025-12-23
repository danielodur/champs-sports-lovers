#!/bin/bash

# 🚀 BEGINNER-FRIENDLY SPORTS API SETUP SCRIPT
# This script will help you set up the TheSports.com API integration with Supabase

echo "🏆 Welcome to the Champs Sports API Setup!"
echo "This script will guide you through setting up your sports data integration."
echo ""

# Colors for better output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_step() {
    echo -e "${BLUE}📋 Step $1:${NC} $2"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if Supabase CLI is installed
print_step "1" "Checking if Supabase CLI is installed..."

if ! command -v supabase &> /dev/null; then
    print_error "Supabase CLI is not installed."
    echo ""
    echo "Please install it first:"
    echo "  npm install -g supabase"
    echo ""
    echo "After installation, run this script again."
    exit 1
else
    print_success "Supabase CLI is installed!"
fi

# Check if user is logged in
print_step "2" "Checking Supabase authentication..."

if ! supabase projects list &> /dev/null; then
    print_warning "You're not logged in to Supabase."
    echo ""
    echo "Let's log you in now:"
    supabase login

    if [ $? -ne 0 ]; then
        print_error "Failed to login to Supabase. Please try again."
        exit 1
    fi
else
    print_success "You're already logged in to Supabase!"
fi

# Show available projects
print_step "3" "Showing your Supabase projects..."
echo ""
supabase projects list

echo ""
echo "👆 Above are your Supabase projects."
echo ""

# Get project reference from user
while true; do
    echo "Please enter your project reference (the part before .supabase.co in your project URL):"
    echo "Example: if your URL is https://abc123def.supabase.co, enter: abc123def"
    read -p "Project Reference: " PROJECT_REF

    if [ -z "$PROJECT_REF" ]; then
        print_error "Project reference cannot be empty. Please try again."
        continue
    fi

    break
done

# Link the project
print_step "4" "Linking to your Supabase project..."

supabase link --project-ref "$PROJECT_REF"

if [ $? -ne 0 ]; then
    print_error "Failed to link project. Please check your project reference and try again."
    exit 1
fi

print_success "Successfully linked to project: $PROJECT_REF"

# Deploy the functions
print_step "5" "Deploying Edge Functions..."

echo ""
echo "Deploying fetch-sports function..."
supabase functions deploy fetch-sports

echo ""
echo "Deploying fetch-football-matches function..."
supabase functions deploy fetch-football-matches

echo ""
echo "Deploying fetch-football-leagues function..."
supabase functions deploy fetch-football-leagues

echo ""
echo "Deploying fetch-football-teams function..."
supabase functions deploy fetch-football-teams

print_success "All functions deployed successfully!"

# Get API credentials
print_step "6" "Setting up your TheSports.com API credentials..."

echo ""
print_warning "You need your TheSports.com API credentials now."
echo ""

while true; do
    echo "Please enter your TheSports.com SECRET KEY:"
    read -p "Secret Key: " SECRET_KEY

    if [ -z "$SECRET_KEY" ]; then
        print_error "Secret key cannot be empty. Please try again."
        continue
    fi

    break
done

while true; do
    echo ""
    echo "Please enter your TheSports.com USER KEY:"
    read -p "User Key: " USER_KEY

    if [ -z "$USER_KEY" ]; then
        print_error "User key cannot be empty. Please try again."
        continue
    fi

    break
done

# Set environment variables
print_step "7" "Setting environment variables in Supabase..."

echo ""
echo "Setting THESPORTS_SECRET_KEY..."
supabase secrets set THESPORTS_SECRET_KEY="$SECRET_KEY"

echo ""
echo "Setting THESPORTS_USER_KEY..."
supabase secrets set THESPORTS_USER_KEY="$USER_KEY"

print_success "Environment variables set successfully!"

# Test the functions
print_step "8" "Testing your setup..."

echo ""
echo "Getting your function URLs..."

# Get project URL
PROJECT_URL="https://$PROJECT_REF.supabase.co"

echo ""
print_success "Setup Complete! 🎉"
echo ""
echo "Your Edge Functions are now available at:"
echo "  🔗 $PROJECT_URL/functions/v1/fetch-sports"
echo "  🔗 $PROJECT_URL/functions/v1/fetch-football-matches"
echo "  🔗 $PROJECT_URL/functions/v1/fetch-football-leagues"
echo "  🔗 $PROJECT_URL/functions/v1/fetch-football-teams"
echo ""

print_step "9" "Next Steps for Your Frontend"

echo ""
echo "1. Make sure your .env.local file has these variables:"
echo "   EXPO_PUBLIC_SUPABASE_URL=$PROJECT_URL"
echo "   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key"
echo ""
echo "2. Test your functions with this command:"
echo "   curl \"$PROJECT_URL/functions/v1/fetch-football-matches?status=live\" \\"
echo "     -H \"Authorization: Bearer YOUR_SUPABASE_ANON_KEY\""
echo ""
echo "3. Use the utility functions in utils/sportsApi.ts to call the API from your app:"
echo ""
echo "   import { fetchFootballMatches } from './utils/sportsApi'"
echo "   const matches = await fetchFootballMatches({ status: 'live' })"
echo ""

print_step "10" "Where to Find Your Anon Key"

echo ""
echo "To get your Supabase Anon Key:"
echo "1. Go to your Supabase Dashboard: https://supabase.com/dashboard"
echo "2. Select your project"
echo "3. Go to Settings → API"
echo "4. Copy the 'anon public' key"
echo "5. Add it to your .env.local file as EXPO_PUBLIC_SUPABASE_ANON_KEY"
echo ""

print_step "11" "Testing Your Setup"

echo ""
echo "You can test your functions work by:"
echo ""
echo "1. Going to your Supabase Dashboard"
echo "2. Navigate to Edge Functions"
echo "3. Click on any function to see logs and test it"
echo ""

print_success "All done! Your sports API integration is ready! 🚀"
echo ""
echo "Need help? Check the SPORTS_API_SETUP.md file for detailed instructions."
echo ""

# Optional: Create a simple test
read -p "Would you like to create a simple test file? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    cat > test-sports-api.js << 'EOF'
// Simple test for your Sports API
// Run with: node test-sports-api.js

const PROJECT_REF = 'YOUR_PROJECT_REF_HERE'; // Replace with your project reference
const ANON_KEY = 'YOUR_ANON_KEY_HERE'; // Replace with your anon key

const testUrl = `https://${PROJECT_REF}.supabase.co/functions/v1/fetch-football-matches?status=live`;

console.log('🧪 Testing Sports API...');
console.log('URL:', testUrl);
console.log('');

fetch(testUrl, {
  headers: {
    'Authorization': `Bearer ${ANON_KEY}`,
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => {
  console.log('✅ Success! API Response:');
  console.log(JSON.stringify(data, null, 2));
})
.catch(error => {
  console.error('❌ Error:', error);
});
EOF

    echo ""
    print_success "Created test-sports-api.js"
    echo "Edit the file with your project reference and anon key, then run: node test-sports-api.js"
fi

echo ""
echo "Happy coding! 🏆⚽"
