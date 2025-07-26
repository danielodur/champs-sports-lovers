import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials from environment variables - 🔒 Secured API Keys
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔒 SUPABASE CONFIG: Reading from environment variables');
console.log('🔒 SUPABASE URL:', supabaseUrl ? `Found (${supabaseUrl.substring(0, 20)}...)` : 'Not found');
console.log('🔒 SUPABASE KEY:', supabaseAnonKey ? `Found (${supabaseAnonKey.substring(0, 20)}...)` : 'Not found');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ SUPABASE CONFIG: Missing environment variables');
  console.error('❌ Available env vars:', Object.keys(process.env).filter(key => key.startsWith('EXPO_PUBLIC')));
  throw new Error('Missing Supabase environment variables. Please check your .env file configuration.');
}

// Create Supabase client with React Native specific options
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Configure auth to work with React Native
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  // Optional: Configure real-time subscriptions
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Export configuration for use in other parts of the app
export const supabaseConfig = {
  url: supabaseUrl,
  anonKey: supabaseAnonKey,
};

// Helper function to check if Supabase is properly configured
export const isSupabaseConfigured = (): boolean => {
  return !!(supabaseUrl && supabaseAnonKey);
};

// Export the client as default for easier imports
export default supabase; 