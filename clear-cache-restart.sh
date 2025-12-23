#!/bin/bash

echo "🧹 Clearing React Native/Expo cache and restarting..."

# Navigate to project directory
cd "$(dirname "$0")/project"

echo "📱 Stopping any running Metro bundler processes..."
# Kill any existing Metro processes
pkill -f "expo start" 2>/dev/null || true
pkill -f "metro" 2>/dev/null || true

echo "🗑️  Clearing Expo cache..."
# Clear Expo cache
npx expo r -c 2>/dev/null || expo r -c 2>/dev/null || true

echo "🧽 Clearing npm cache..."
# Clear npm cache
npm cache clean --force

echo "📦 Clearing node_modules cache..."
# Clear watchman cache if available
if command -v watchman >/dev/null 2>&1; then
    echo "👁️  Clearing Watchman cache..."
    watchman watch-del-all
fi

echo "🔄 Clearing Metro cache..."
# Clear Metro cache
npx react-native start --reset-cache 2>/dev/null || true

echo "📱 Starting Expo development server with cleared cache..."
# Start with clear cache
npx expo start --clear

echo "✅ Cache cleared and development server started!"
echo ""
echo "📋 If you're still seeing old icons, try these additional steps:"
echo "1. In your Expo app, shake device and select 'Reload'"
echo "2. Or press 'r' in this terminal to reload"
echo "3. For iOS Simulator: Cmd+R to reload"
echo "4. For Android Emulator: Double tap R or Cmd+M -> Reload"
