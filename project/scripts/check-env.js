/**
 * Quick script to check if environment variables are loading
 * Run with: node scripts/check-env.js
 */

console.log('\n🔍 Checking Environment Variables...\n');

const varsToCheck = [
  'EXPO_PUBLIC_API_FOOTBALL_KEY',
  'EXPO_PUBLIC_THE_SPORTSDB_API_KEY',
  'EXPO_PUBLIC_SUPABASE_URL',
  'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
];

varsToCheck.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    const preview = value.length > 8 ? value.substring(0, 8) + '...' : value;
    console.log(`✅ ${varName}: ${preview} (length: ${value.length})`);
  } else {
    console.log(`❌ ${varName}: NOT FOUND`);
  }
});

console.log('\n');













































