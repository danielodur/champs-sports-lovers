// ❌ MOCK DATA COMPLETELY DISABLED - REAL API ONLY
// This file has been disabled to ensure only real API data is used
// No mock data should ever be displayed in the app

console.warn(
  "🚫 MOCK DATA SERVICE ACCESSED - This should not happen in production!",
);
console.warn("📋 All mock data has been disabled to ensure real API data only");

export const mockLiveMatches: never[] = [];
export const mockUpcomingMatches: never[] = [];
export const mockFinishedMatches: never[] = [];

// Log warning if any component tries to use mock data
const logMockDataWarning = (dataType: string) => {
  console.error(`❌ ATTEMPTED TO USE MOCK DATA: ${dataType}`);
  console.error("🔧 Fix required: Update component to use real API data only");
  console.error(
    "📋 Check API configuration and ensure EXPO_PUBLIC_API_FOOTBALL_KEY is set",
  );
};

// Override exports to prevent usage
export const getMockLiveMatches = () => {
  logMockDataWarning("Live Matches");
  return [];
};

export const getMockUpcomingMatches = () => {
  logMockDataWarning("Upcoming Matches");
  return [];
};

export const getMockFinishedMatches = () => {
  logMockDataWarning("Finished Matches");
  return [];
};

// Export empty arrays to prevent crashes but ensure no data is returned
export default {
  mockLiveMatches: [],
  mockUpcomingMatches: [],
  mockFinishedMatches: [],
  getMockLiveMatches,
  getMockUpcomingMatches,
  getMockFinishedMatches,
};
