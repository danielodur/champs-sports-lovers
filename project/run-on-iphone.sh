#!/bin/bash

# Script to build and run Champs app on iPhone
# Make sure your iPhone is connected and trusted

set -e

echo "🚀 Starting Champs iPhone Deployment Script..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# iPhone device ID - update this if your device ID changes
IPHONE_UDID="00008120-0014516C2261A01E"
IPHONE_NAME="Obrian's Iphone 💕🎶"

echo -e "${BLUE}📱 Target Device: ${IPHONE_NAME}${NC}"
echo -e "${BLUE}🆔 Device UDID: ${IPHONE_UDID}${NC}"

# Check if iPhone is connected
echo -e "${YELLOW}🔍 Checking if iPhone is connected...${NC}"
if ! xcrun xctrace list devices | grep -q "${IPHONE_UDID}"; then
    echo -e "${RED}❌ iPhone not found. Please make sure:${NC}"
    echo -e "${RED}   1. Your iPhone is connected via USB${NC}"
    echo -e "${RED}   2. You have trusted this computer on your iPhone${NC}"
    echo -e "${RED}   3. Your iPhone is unlocked${NC}"
    exit 1
fi

echo -e "${GREEN}✅ iPhone detected!${NC}"

# Navigate to project directory
cd "$(dirname "$0")"

# Kill any existing Metro processes
echo -e "${YELLOW}🛑 Stopping any existing Metro processes...${NC}"
pkill -f "expo start" || true
pkill -f "metro" || true
sleep 2

# Start Metro server in background
echo -e "${YELLOW}🚀 Starting Metro server...${NC}"
npx expo start --dev-client --clear &
METRO_PID=$!

# Give Metro time to start
echo -e "${YELLOW}⏳ Waiting for Metro to start...${NC}"
sleep 5

# Check if Metro is running
if ! ps -p $METRO_PID > /dev/null 2>&1; then
    echo -e "${RED}❌ Failed to start Metro server${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Metro server started (PID: ${METRO_PID})${NC}"

# Clean iOS build folder
echo -e "${YELLOW}🧹 Cleaning iOS build...${NC}"
cd ios
rm -rf build/ || true
cd ..

# Install CocoaPods dependencies
echo -e "${YELLOW}📦 Installing CocoaPods dependencies...${NC}"
cd ios
pod install --repo-update
cd ..

# Build and deploy to iPhone
echo -e "${YELLOW}🔨 Building and deploying to iPhone...${NC}"
echo -e "${BLUE}This may take a few minutes...${NC}"

cd ios

# Build with proper signing
xcodebuild \
    -workspace Champs.xcworkspace \
    -scheme Champs \
    -configuration Debug \
    -destination "platform=iOS,id=${IPHONE_UDID}" \
    -allowProvisioningUpdates \
    build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build successful!${NC}"

    # Install on device
    echo -e "${YELLOW}📲 Installing app on iPhone...${NC}"
    xcodebuild \
        -workspace Champs.xcworkspace \
        -scheme Champs \
        -configuration Debug \
        -destination "platform=iOS,id=${IPHONE_UDID}" \
        -allowProvisioningUpdates \
        install

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}🎉 SUCCESS! App installed on your iPhone!${NC}"
        echo -e "${GREEN}📱 Look for 'Champs' app on your iPhone home screen${NC}"
        echo -e "${BLUE}💡 Metro server is still running. Keep this terminal open.${NC}"
        echo -e "${BLUE}🔄 Any changes you make will hot-reload on your device.${NC}"
        echo -e "${YELLOW}🛑 Press Ctrl+C to stop Metro server when done.${NC}"

        # Keep script running so Metro stays alive
        wait $METRO_PID
    else
        echo -e "${RED}❌ Failed to install app on iPhone${NC}"
        kill $METRO_PID 2>/dev/null || true
        exit 1
    fi
else
    echo -e "${RED}❌ Build failed${NC}"
    kill $METRO_PID 2>/dev/null || true
    exit 1
fi

cd ..
