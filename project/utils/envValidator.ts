// 🔒 Environment Variables Validator
// This utility helps verify that all API keys are properly loaded from .env

export interface EnvValidationResult {
  isValid: boolean;
  missingKeys: string[];
  loadedKeys: string[];
  message: string;
}

export const validateEnvironmentVariables = (): EnvValidationResult => {
  const requiredKeys = [
    // ✅ NEWS APIs - All actively used for multi-source news aggregation
    'EXPO_PUBLIC_NEWSDATA.IO_API_KEY',
    'EXPO_PUBLIC_GUARDIAN_API_KEY', 
    'EXPO_PUBLIC_GNEWS_API_KEY',
    'EXPO_PUBLIC_MEDIASTACK_API_KEY',
    
    // ✅ SPORTS DATA APIs - All actively used for match data
    'EXPO_PUBLIC_SPORTRADAR_API_KEY', // Primary source for rich sports data
    'EXPO_PUBLIC_RAPID_API_KEY_PRO', // Fallback source for match data
    'EXPO_PUBLIC_FOOTBALL_DATA.ORG_API', // Third source for enhanced coverage
    
    // ✅ DATABASE AND STORAGE
    'EXPO_PUBLIC_SUPABASE_URL',
    'EXPO_PUBLIC_SUPABASE_ANON_KEY'
  ];

  const loadedKeys: string[] = [];
  const missingKeys: string[] = [];

  requiredKeys.forEach(key => {
    const value = process.env[key];
    if (value && value.trim() !== '' && !value.includes('your_') && !value.includes('_here')) {
      loadedKeys.push(key);
    } else {
      missingKeys.push(key);
    }
  });

  const isValid = missingKeys.length === 0;
  const message = isValid 
    ? `✅ All ${loadedKeys.length} environment variables loaded successfully!`
    : `⚠️ Missing ${missingKeys.length} environment variables: ${missingKeys.join(', ')}`;

  return {
    isValid,
    missingKeys,
    loadedKeys,
    message
  };
};

// Development helper function to log env status
export const logEnvironmentStatus = (): void => {
  const result = validateEnvironmentVariables();
  console.log('🔒 Environment Variables Status:');
  console.log(result.message);
  
  if (!result.isValid) {
    console.log('🔧 To fix: Add missing keys to your .env file');
    console.log('📁 Location: project/.env');
  }
}; 