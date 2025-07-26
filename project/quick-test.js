// Quick test to check API
console.log('🔍 Testing API access...');

// Check if we can access environment variables
require('dotenv').config();
const apiKey = process.env.EXPO_PUBLIC_RAPID_API_KEY_PRO;

console.log('API Key found:', apiKey ? 'YES' : 'NO');
console.log('API Key length:', apiKey ? apiKey.length : 0);

if (apiKey) {
  console.log('✅ Environment setup looks good');
  
  // Test a simple HTTP request
  const https = require('https');
  
  const options = {
    hostname: 'api-football-v1.p.rapidapi.com',
    port: 443,
    path: '/v3/status',
    method: 'GET',
    headers: {
      'X-RapidAPI-Key': apiKey,
      'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com'
    }
  };

  console.log('🌐 Testing API connection...');
  
  const req = https.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('📡 Response status:', res.statusCode);
      
      if (res.statusCode === 200) {
        try {
          const jsonData = JSON.parse(data);
          console.log('✅ API is working!');
          console.log('📊 API Status:', jsonData);
        } catch (error) {
          console.log('❌ JSON parse error:', error.message);
        }
      } else {
        console.log('❌ API Error:', res.statusCode);
        console.log('Response:', data.substring(0, 200));
      }
    });
  });

  req.on('error', (error) => {
    console.log('❌ Request error:', error.message);
  });

  req.setTimeout(5000, () => {
    console.log('❌ Request timeout');
    req.destroy();
  });

  req.end();
  
} else {
  console.log('❌ No API key found in environment');
}
