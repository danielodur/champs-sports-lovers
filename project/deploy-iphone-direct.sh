#!/bin/bash

# Direct iPhone Deployment Script for Champs App
# This script bypasses interactive prompts and deploys directly to your iPhone

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Your iPhone details
DEVICE_UDID="27B7103F-CF72-53F6-9A87-356E19283540"
DEVICE_NAME="Obrian's Iphone 💕🎶"

echo -e "${BLUE}🚀 Champs Direct iPhone Deployment${NC}"
echo -e "${BLUE}📱 Target: ${DEVICE_NAME}${NC}"
echo -e "${BLUE}🆔 UDID: ${DEVICE_UDID}${NC}"

# Check if device is connected
echo -e "${YELLOW}🔍 Checking device connection...${NC}"
if ! xcrun devicectl list devices | grep -q "${DEVICE_UDID}"; then
    echo -e "${RED}❌ Device not found. Please ensure:${NC}"
    echo -e "${RED}   - iPhone is connected via USB${NC}"
    echo -e "${RED}   - iPhone is unlocked${NC}"
    echo -e "${RED}   - You've trusted this computer${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Device connected!${NC}"

# Navigate to project root
cd "$(dirname "$0")"

# Kill any existing processes
echo -e "${YELLOW}🛑 Cleaning up existing processes...${NC}"
pkill -f "expo start" 2>/dev/null || true
pkill -f "metro" 2>/dev/null || true
sleep 2

# Start Metro in background
echo -e "${YELLOW}🚀 Starting Metro bundler...${NC}"
npx expo start --dev-client --clear &
METRO_PID=$!

# Wait for Metro to initialize
echo -e "${YELLOW}⏳ Waiting for Metro to start...${NC}"
sleep 8

# Verify Metro is running
if ! kill -0 $METRO_PID 2>/dev/null; then
    echo -e "${RED}❌ Failed to start Metro${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Metro running (PID: ${METRO_PID})${NC}"

# Install pods
echo -e "${YELLOW}📦 Installing CocoaPods dependencies...${NC}"
cd ios
pod install --silent
cd ..

echo -e "${YELLOW}🔨 Building and installing on iPhone...${NC}"

# Build and install directly using xcodebuild
cd ios

xcodebuild \
    -workspace Champs.xcworkspace \
    -scheme Champs \
    -configuration Debug \
    -destination "platform=iOS,id=${DEVICE_UDID}" \
    -derivedDataPath ./build \
    -allowProvisioningUpdates \
    build install

if [ $? -eq 0 ]; then
    echo -e "${GREEN}🎉 SUCCESS! App deployed to your iPhone!${NC}"
    echo -e "${GREEN}📱 Look for 'Champs' on your iPhone home screen${NC}"
    echo -e "${BLUE}💡 Metro is running - keep this terminal open for hot reload${NC}"
    echo -e "${YELLOW}🛑 Press Ctrl+C when done developing${NC}"

    # Keep Metro alive
    cd ..
    wait $METRO_PID
else
    echo -e "${RED}❌ Deployment failed${NC}"
    kill $METRO_PID 2>/dev/null || true
    exit 1
fi
