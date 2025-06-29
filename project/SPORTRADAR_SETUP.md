# 🏟️ SportRadar + Highlightly Integration Setup Guide

## 🎯 **What This Gives You:**
- **20-50+ live matches** (instead of 4)
- **Global coverage**: Europe, Asia, Americas, Africa
- **Real-time updates**: Sub-second live score updates
- **Comprehensive leagues**: 600+ competitions worldwide
- **Professional reliability**: Used by major sports broadcasters

## 🚀 **STEP 1: Sign Up for SportRadar**

### Option A: Free Trial (Recommended to Start)
1. Go to: `https://developer.sportradar.com/`
2. Click "Sign Up" and create account
3. Choose **"Soccer/Football API"**
4. Select **"Trial Account"** (free, limited requests)
5. Get your API key from the dashboard

### Option B: Paid Plans (For Production)
- **Basic**: $50-100/month (good coverage)
- **Pro**: $300-500/month (comprehensive coverage)
- **Enterprise**: Custom pricing (unlimited)

## 🔑 **STEP 2: Add Your API Key**

### Method 1: Direct in app.json (Quick Test)
1. Open `app.json`
2. Find the `extra` section
3. Replace the empty `sportRadarApiKey`:
```json
"extra": {
  "sportRadarApiKey": "YOUR_SPORTRADAR_API_KEY_HERE"
}
```

### Method 2: Environment Variable (Recommended)
1. Create `.env` file in project root:
```env
EXPO_PUBLIC_SPORTRADAR_API_KEY=your_sportradar_api_key_here
```
2. The app will automatically use this

## 🧪 **STEP 3: Test the Integration**

After adding your API key:
1. Restart your app: `npx expo start --clear`
2. Go to **Live tab**
3. You should see in console:
   ```
   🏟️ Fetching from SportRadar (PRIMARY API)...
   🏟️ SportRadar live matches: 15
   ```

## 📊 **Expected Results:**

### Before (API-Football only):
- ❌ 3-4 live matches
- ❌ Limited global coverage
- ❌ Cached data issues

### After (SportRadar + API-Football):
- ✅ 20-50+ live matches
- ✅ Global coverage
- ✅ Real-time updates
- ✅ Professional reliability

## 🎥 **Highlightly Integration (Already Setup)**

Your app already uses Highlightly for:
- ✅ **Video highlights**
- ✅ **Match replays** 
- ✅ **Animated broadcasts**
- ✅ **News content**

## 🔄 **How It Works:**

### API Priority System:
1. **🏟️ SportRadar (PRIMARY)**: Gets comprehensive live matches
2. **🔄 API-Football (FALLBACK)**: Fills gaps and provides backup
3. **🎥 Highlightly (CONTENT)**: Provides video highlights and news

### Smart Fallback:
- If SportRadar fails → Falls back to API-Football
- If both fail → Shows cached data
- Always combines results for maximum coverage

## 🚨 **Troubleshooting:**

### If you see "SportRadar: No live matches or API not configured":
1. Check your API key in `app.json`
2. Verify your SportRadar account is active
3. Check console for error messages

### If you still see only 3-4 matches:
1. Your SportRadar API key might not be configured
2. You might be hitting rate limits
3. Check the console logs for detailed errors

## 💰 **Cost Considerations:**

### Free Trial:
- **1,000 requests/month**
- Good for testing and small apps
- Usually 10-20 live matches

### Basic Plan (~$50-100/month):
- **50,000 requests/month** 
- Production-ready
- 20-40 live matches typically

### Pro Plan (~$300-500/month):
- **Unlimited requests**
- Full global coverage
- 40-80+ live matches during peak times

## 🎯 **Next Steps:**

1. **Get SportRadar API key** (start with free trial)
2. **Add it to app.json** 
3. **Test the app** 
4. **See 20-50+ live matches!** 🚀

## 📞 **Support:**

If you need help:
1. Check console logs for detailed error messages
2. Verify API key is correctly configured
3. Test with SportRadar's API documentation: `https://developer.sportradar.com/` 