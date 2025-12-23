import Constants from "expo-constants";

export interface EnvTestResult {
  success: boolean;
  foundKeys: string[];
  missingKeys: string[];
  debugInfo: {
    processEnvKeys: string[];
    constantsExtra: any;
    resolvedValues: Record<string, string | undefined>;
  };
}

export function testEnvironmentVariables(): EnvTestResult {
  console.log("🧪 Testing Environment Variables...");

  // Keys we expect to find
  const expectedKeys = [
    "EXPO_PUBLIC_API_FOOTBALL_KEY",
    "EXPO_PUBLIC_SUPABASE_URL",
    "EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    "EXPO_PUBLIC_RAPID_API_KEY_PRO",
    "EXPO_PUBLIC_NEWSDATA_IO_API_KEY",
    "EXPO_PUBLIC_GUARDIAN_API_KEY",
    "EXPO_PUBLIC_GNEWS_API_KEY",
    "EXPO_PUBLIC_MEDIASTACK_API_KEY",
    "EXPO_PUBLIC_SPORTRADAR_API_KEY",
  ];

  const foundKeys: string[] = [];
  const missingKeys: string[] = [];
  const resolvedValues: Record<string, string | undefined> = {};

  // Get all process.env keys that start with EXPO
  const processEnvKeys = Object.keys(process.env).filter(
    (key) => key.startsWith("EXPO_") || key.startsWith("NEXT_"),
  );

  console.log("📋 Available environment keys:", processEnvKeys);
  console.log("📋 Constants.expoConfig.extra:", Constants.expoConfig?.extra);

  // Test each expected key
  expectedKeys.forEach((key) => {
    const value = process.env[key];
    resolvedValues[key] = value;

    if (value) {
      foundKeys.push(key);
      console.log(`✅ ${key}: Found (${value.substring(0, 10)}...)`);
    } else {
      missingKeys.push(key);
      console.log(`❌ ${key}: Not found`);
    }
  });

  // Test Constants.expoConfig.extra access
  const constantsExtra = Constants.expoConfig?.extra;
  if (constantsExtra) {
    console.log("📋 Testing Constants access:");
    Object.entries(constantsExtra).forEach(([key, value]) => {
      if (typeof value === "string" && value.startsWith("EXPO_")) {
        const resolvedValue = process.env[value];
        console.log(
          `🔗 ${key} -> ${value}: ${resolvedValue ? "Found" : "Not found"}`,
        );
      }
    });
  }

  const success = missingKeys.length === 0;

  console.log("🧪 Environment Test Results:");
  console.log(`✅ Found: ${foundKeys.length} keys`);
  console.log(`❌ Missing: ${missingKeys.length} keys`);

  if (missingKeys.length > 0) {
    console.log("❌ Missing keys:", missingKeys);
    console.log(
      "💡 Make sure your .env.local file contains these variables with EXPO_PUBLIC_ prefix",
    );
    console.log("💡 Restart with: npx expo start --dev-client --clear");
  }

  return {
    success,
    foundKeys,
    missingKeys,
    debugInfo: {
      processEnvKeys,
      constantsExtra,
      resolvedValues,
    },
  };
}

export function logEnvironmentStatus(): void {
  console.log("🌍 Environment Status Check:");
  console.log("- Platform:", Constants.platform);
  console.log("- App Version:", Constants.expoConfig?.version);
  console.log(
    "- Environment:",
    Constants.expoConfig?.extra?.environment || "unknown",
  );
  console.log(
    "- Enable Real Data:",
    Constants.expoConfig?.extra?.enableRealData,
  );

  // Quick API key check
  const apiKey = process.env.EXPO_PUBLIC_API_FOOTBALL_KEY;
  console.log(
    "- API Football Key:",
    apiKey ? `Found (${apiKey.length} chars)` : "Not found",
  );

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  console.log("- Supabase URL:", supabaseUrl ? "Found" : "Not found");
}

// Auto-run test when imported in development
if (__DEV__) {
  setTimeout(() => {
    logEnvironmentStatus();
    testEnvironmentVariables();
  }, 1000);
}
