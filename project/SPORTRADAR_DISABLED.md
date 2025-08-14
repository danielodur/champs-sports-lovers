# Sportradar Integration Temporarily Disabled

## Overview

The Sportradar API integration has been temporarily disabled to prevent automatic data fetching and retries when the app loads. This will be re-enabled in the future when the integration is ready.

## What Was Disabled

### 1. App Startup Preloading

**Files Modified:**

- `app/_layout.tsx`
- `project/app/_layout.tsx`

**Changes:**

- Commented out `sportsApiService.preloadCommonData()` calls
- These were causing automatic Sportradar API calls on app startup

### 2. User Authentication Realtime Service

**Files Modified:**

- `project/services/authService.ts`

**Changes:**

- Commented out `realtimeService.startRealtimeSync()` call
- Commented out `realtimeService.stopRealtimeSync()` call
- This was causing automatic Sportradar API calls when users logged in

## What Remains Active

### User-Initiated API Calls

The following Sportradar API calls remain active and will only execute when users explicitly request data:

- Match details viewing
- Team details viewing
- Manual data refresh
- Search functionality

These calls are in:

- `project/app/match-details.tsx`
- `project/app/team-details.tsx`
- `project/services/matchService.ts`

## How to Re-Enable

### 1. Re-enable App Startup Preloading

In both `app/_layout.tsx` and `project/app/_layout.tsx`:

```typescript
// Remove the TODO comments and uncomment:
sportsApiService.preloadCommonData();
```

### 2. Re-enable Realtime Service

In `project/services/authService.ts`:

```typescript
// Remove the TODO comments and uncomment:
const { realtimeService } = await import("./realtimeService");
await realtimeService.startRealtimeSync();
console.log("📡 REALTIME: Service initialized for user");

// And in the cleanup section:
const { realtimeService } = await import("./realtimeService");
realtimeService.stopRealtimeSync();
console.log("📡 REALTIME: Service cleaned up on sign out");
```

## Benefits of Current State

1. **No Automatic API Calls**: App won't make Sportradar API calls on startup
2. **No Retry Loops**: Eliminates potential retry mechanisms that could cause issues
3. **Faster App Startup**: App loads faster without waiting for external API calls
4. **User Control**: Users only get data when they explicitly request it
5. **Reduced API Usage**: Prevents unnecessary API calls and potential rate limiting

## Future Considerations

When re-enabling:

1. Ensure Sportradar API credentials are properly configured
2. Implement proper error handling and retry logic
3. Add rate limiting to prevent API abuse
4. Consider implementing offline-first data strategy
5. Add user preferences for automatic data fetching

## Files Modified Summary

- ✅ `app/_layout.tsx` - Disabled startup preloading
- ✅ `project/app/_layout.tsx` - Disabled startup preloading
- ✅ `project/services/authService.ts` - Disabled realtime service
- ✅ `project/services/realtimeService.ts` - No changes needed (service remains intact)

All changes are clearly marked with TODO comments for easy re-enabling.
