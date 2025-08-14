# 🚫 Sportradar Integration - Complete Disconnection Guide

## Overview

All Sportradar API features have been **completely disabled** to prevent background retries and API calls that were causing app crashes during deep link handling. This guide explains what was disabled and how to re-enable it.

## 🚫 What Was Disabled

### 1. **SportsApiService** (`project/services/sportsApiService.ts`)

- **Status**: Completely disabled - returns empty data
- **Methods Disabled**:
  - `getLiveScores()` - Returns empty array
  - `getFixtures()` - Returns empty array
  - `getFinishedMatches()` - Returns empty array
  - `getMatchStatistics()` - Returns null
  - `preloadCommonData()` - No API calls (was causing crashes)
  - All other API methods

### 2. **SportRadarApiService** (`project/services/sportRadarApiService.ts`)

- **Status**: Completely disabled - returns empty data
- **Methods Disabled**:
  - `getCompetitions()` - Returns empty array
  - `getTeamProfile()` - Returns null
  - `getTeamPlayers()` - Returns empty array
  - `getSeasonStandings()` - Returns null
  - `getMatchSummary()` - Returns null
  - `getMatchTimeline()` - Returns null
  - `getCompetitionInfo()` - Returns null

### 3. **App Startup Preloading**

- **Status**: Disabled in both `app/_layout.tsx` and `project/app/_layout.tsx`
- **What Was Disabled**: `sportsApiService.preloadCommonData()` calls
- **Why**: These were causing automatic API calls on app startup

### 4. **User Authentication Services**

- **Status**: Disabled in `project/services/authService.ts`
- **What Was Disabled**: `realtimeService.startRealtimeSync()` calls
- **Why**: These were causing automatic API calls when users logged in

## 🔧 How to Re-enable Sportradar

### **Step 1: Restore SportsApiService**

```tsx
// In project/services/sportsApiService.ts
// Replace the mock service with the original implementation

// Remove these lines:
// 🚫 SPORTRADAR COMPLETELY DISABLED - Mock service to prevent crashes

// Restore the original class with:
class SportsApiService {
  private lastRequestTime = 0;
  private readonly MIN_REQUEST_INTERVAL = 1000; // 1 second between requests

  constructor() {
    console.log("🚀 SportsApiService initialized with SportRadar API only");
  }

  // Restore all original methods...
}
```

### **Step 2: Restore SportRadarApiService**

```tsx
// In project/services/sportRadarApiService.ts
// Replace the mock service with the original implementation

// Remove these lines:
// 🚫 SPORTRADAR COMPLETELY DISABLED - Mock service to prevent crashes

// Restore the original class with:
class SportRadarApiService {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes for static data

  // Restore all original methods...
}
```

### **Step 3: Re-enable App Startup Preloading**

```tsx
// In both app/_layout.tsx and project/app/_layout.tsx
// Uncomment these lines:

Promise.allSettled([
  // Preload core match data
  preloadMatchData(),
  // ✅ RE-ENABLED: Sportradar integration
  sportsApiService.preloadCommonData(),
]);

// And in the second wave:
Promise.allSettled([
  preloadMatchData(),
  // ✅ RE-ENABLED: Sportradar integration
  sportsApiService.preloadCommonData(),
  preloadSounds(),
]);
```

### **Step 4: Re-enable User Authentication Services**

```tsx
// In project/services/authService.ts
// Uncomment these lines:

// Initialize realtime service for real-time features
const { realtimeService } = await import("./realtimeService");
await realtimeService.startRealtimeSync();
console.log("📡 REALTIME: Service initialized for user");

// And in the cleanup:
const { realtimeService } = await import("./realtimeService");
realtimeService.stopRealtimeSync();
console.log("📡 REALTIME: Service cleaned up on sign out");
```

### **Step 5: Verify Environment Variables**

```bash
# Ensure these are set in your .env file:
EXPO_PUBLIC_SPORTRADAR_API_KEY=your_actual_api_key_here
```

### **Step 6: Test the Integration**

1. **Start the app** - Check console for Sportradar initialization messages
2. **Test live scores** - Navigate to live matches screen
3. **Test fixtures** - Navigate to fixtures screen
4. **Test match details** - Open a match to see statistics
5. **Monitor console** - Look for Sportradar API success messages

## 🚨 Important Considerations

### **1. Rate Limiting**

- Sportradar has strict rate limits (especially on trial accounts)
- The service includes built-in rate limiting (1 second between requests)
- Monitor for 429 (rate limit) errors in console

### **2. API Key Validation**

- Ensure your Sportradar API key is valid and active
- Check account status at https://developer.sportradar.com/
- Verify trial vs production access levels

### **3. Background Processing**

- The services include retry logic (up to 3 attempts)
- Exponential backoff for rate limit errors
- Cache management to reduce API calls

### **4. Error Handling**

- All methods include comprehensive error handling
- Fallback to empty data if API fails
- Console logging for debugging

## 📊 Monitoring and Debugging

### **Console Messages to Look For**

```bash
# ✅ Success messages:
🚀 SportsApiService initialized with SportRadar API only
🏟️ Fetching live football matches from SportRadar...
✅ SportRadar: Fetched 15 live fixtures

# ⚠️ Warning messages:
⚠️ SPORTRADAR_API_KEY not found in environment variables
⚠️ SportRadar rate limited (429), waiting 3000ms before retry

# ❌ Error messages:
❌ Error fetching live matches from SportRadar: [error details]
❌ SportRadar API Key Invalid or Access Forbidden (403)
```

### **Common Issues and Solutions**

#### **Issue: "SPORTRADAR_API_KEY not found"**

**Solution**: Set `EXPO_PUBLIC_SPORTRADAR_API_KEY` in your `.env` file

#### **Issue: "Access Forbidden (403)"**

**Solution**: Check API key validity and account status

#### **Issue: "Rate limit exceeded"**

**Solution**: Wait for rate limit to reset or upgrade account

#### **Issue: "No live matches available"**

**Solution**: This is normal - not all times have live matches

## 🔄 Gradual Re-enablement

### **Phase 1: Basic Integration**

1. Re-enable `SportsApiService` only
2. Test basic functionality (live scores, fixtures)
3. Monitor for crashes or errors

### **Phase 2: Advanced Features**

1. Re-enable `SportRadarApiService`
2. Test team profiles, statistics, standings
3. Monitor performance impact

### **Phase 3: Full Integration**

1. Re-enable app startup preloading
2. Re-enable realtime services
3. Test complete user flow

## 📝 Testing Checklist

- [ ] App starts without crashes
- [ ] Live scores load (may be empty if no live matches)
- [ ] Fixtures load for today/tomorrow
- [ ] Match details show statistics
- [ ] Team profiles display correctly
- [ ] No excessive API calls in background
- [ ] Console shows success messages
- [ ] No rate limit errors

## 🎯 When to Re-enable

**Re-enable Sportradar when:**

- ✅ Deep link crashes are completely resolved
- ✅ App stability is confirmed
- ✅ You have a valid Sportradar API key
- ✅ You're ready to handle rate limiting
- ✅ You have time to monitor and debug

**Keep disabled if:**

- ❌ App is still experiencing crashes
- ❌ Deep link issues persist
- ❌ You don't have valid API credentials
- ❌ You need to focus on core app stability

## 📞 Support

If you encounter issues when re-enabling Sportradar:

1. Check the console for specific error messages
2. Verify your API key and account status
3. Test with minimal integration first
4. Monitor rate limiting and API quotas

---

**Remember**: The goal is app stability first, then feature richness. Sportradar integration can always be added back once the core app is stable.
