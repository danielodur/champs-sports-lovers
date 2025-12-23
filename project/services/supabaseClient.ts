import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Get Supabase credentials from environment variables - 🔒 Secured API Keys
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
// Try both possible variable names for compatibility
const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Check if both are set and different
if (publishableKey && anonKey && publishableKey !== anonKey) {
  console.warn("⚠️ SUPABASE CONFIG: Both keys are set with different values!");
  console.warn(`⚠️ PUBLISHABLE_KEY (new format): ${publishableKey.substring(0, 20)}...`);
  console.warn(`⚠️ ANON_KEY (legacy JWT): ${anonKey.substring(0, 20)}...`);
  console.warn("");
  
  // Check which one is a valid JWT (starts with 'eyJ')
  const publishableIsValid = publishableKey.startsWith('eyJ');
  const anonIsValid = anonKey.startsWith('eyJ');
  
  if (anonIsValid && !publishableIsValid) {
    console.warn("✅ EXPO_PUBLIC_SUPABASE_ANON_KEY is valid (JWT format: eyJ...)");
    console.warn("❌ EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY is new format (sb_publishable...)");
    console.warn("");
    console.warn("🔧 IMPORTANT: Edge Functions require JWT format (eyJ...)");
    console.warn("💡 RECOMMENDATION:");
    console.warn("   1. Use the anon key (eyJ...) from Legacy API Keys");
    console.warn("   2. Set EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY to the same value");
    console.warn("   3. Or just use EXPO_PUBLIC_SUPABASE_ANON_KEY");
    console.warn("");
    console.warn("📝 The new 'sb_publishable...' format doesn't work with Edge Functions yet");
  } else if (publishableIsValid && !anonIsValid) {
    console.warn("✅ EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY is valid (JWT format: eyJ...)");
    console.warn("❌ EXPO_PUBLIC_SUPABASE_ANON_KEY is NOT valid");
    console.warn("💡 RECOMMENDATION: Use EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  } else if (publishableIsValid && anonIsValid) {
    console.warn("✅ Both keys are valid JWTs!");
    console.warn("💡 RECOMMENDATION: Use either one (they're both valid)");
  } else {
    console.warn("❌ Neither key is a valid JWT (both should start with 'eyJ')");
    console.warn("💡 Get your anon key from Supabase Dashboard → Settings → API → Legacy API Keys");
  }
  console.warn("");
}

// IMPORTANT: Edge Functions require JWT format (eyJ...), not the new sb_publishable format
// Prefer the anon key (legacy JWT) if it's valid, otherwise use publishable key
let supabaseAnonKey: string | undefined;
if (anonKey && anonKey.startsWith('eyJ')) {
  // Anon key is valid JWT - use it (preferred for Edge Functions)
  supabaseAnonKey = anonKey;
  console.log("✅ Using EXPO_PUBLIC_SUPABASE_ANON_KEY (JWT format - compatible with Edge Functions)");
} else if (publishableKey && publishableKey.startsWith('eyJ')) {
  // Publishable key is valid JWT - use it
  supabaseAnonKey = publishableKey;
  console.log("✅ Using EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY (JWT format - compatible with Edge Functions)");
} else {
  // Fallback: use whichever is available (will show warning later if invalid)
  supabaseAnonKey = publishableKey || anonKey;
}

console.log("🔒 SUPABASE CONFIG: Reading from environment variables");
console.log(
  "🔒 SUPABASE URL:",
  supabaseUrl ? `Found (${supabaseUrl.substring(0, 20)}...)` : "Not found",
);
console.log(
  "🔒 SUPABASE PUBLISHABLE KEY:",
  supabaseAnonKey
    ? `Found (${supabaseAnonKey.substring(0, 20)}...)`
    : "Not found",
);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ SUPABASE CONFIG: Missing environment variables");
  console.error(
    "❌ Available env vars:",
    Object.keys(process.env).filter((key) => key.startsWith("EXPO_PUBLIC")),
  );
  console.error("❌ Expected variables:");
  console.error("  - EXPO_PUBLIC_SUPABASE_URL");
  console.error("  - EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or EXPO_PUBLIC_SUPABASE_ANON_KEY)");
  console.error("❌ Check your .env.local file for typos. Common issues:");
  console.error(
    "  - Missing 'L' in EXPO_PUBLIC_SUPABASE_URL (not EXPO_PUBLIC_SUPABASE_UR)",
  );
  throw new Error(
    "Invalid API key - Missing Supabase environment variables. Please check your .env.local file has EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
  );
}

// Validate that the key is a valid JWT format (Supabase anon keys are JWTs)
// Warn instead of throwing so app can still start - Edge Functions will fail with 401 if key is invalid
if (supabaseAnonKey && !supabaseAnonKey.startsWith('eyJ')) {
  console.warn("⚠️ SUPABASE CONFIG: Invalid key format detected!");
  console.warn("⚠️ The Supabase anon key should be a JWT token starting with 'eyJ'");
  console.warn(`⚠️ Your current key starts with: '${supabaseAnonKey.substring(0, 10)}...'`);
  console.warn("⚠️ This is NOT a valid Supabase anon key format");
  console.warn("");
  console.warn("🔧 HOW TO FIX:");
  console.warn("1. Go to your Supabase Dashboard: https://supabase.com/dashboard");
  console.warn("2. Select your project");
  console.warn("3. Go to Settings → API");
  console.warn("4. Copy the 'anon' or 'public' key (it should start with 'eyJ...')");
  console.warn("5. Update EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY in your .env.local file");
  console.warn("6. Restart your app");
  console.warn("");
  console.warn("⚠️ Edge Functions will return 401 errors until you fix this!");
  console.warn("⚠️ The app will continue to run, but API calls will fail.");
}

// Create Supabase client with React Native specific options
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Disable for React Native
  },
});

// Export configuration for use in other parts of the app
export const supabaseConfig = {
  url: supabaseUrl,
  publishableKey: supabaseAnonKey,
};

// Helper function to check if Supabase is properly configured
export const isSupabaseConfigured = (): boolean => {
  return !!(supabaseUrl && supabaseAnonKey);
};

// Export the client as default for easier imports
export default supabase;
