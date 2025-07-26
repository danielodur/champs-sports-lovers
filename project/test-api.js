#!/usr/bin/env node

// Simple Node.js script to test API endpoints
const https = require('https');

console.log('🧪 Starting API Verification Tests...\n');

// Test with current API key
async function testCurrentAPIKey() {
  console.log('🔑 Testing Current RapidAPI Key...');
  
  const options = {
    hostname: 'api-football-v1.p.rapidapi.com',
    port: 443,
    path: '/v3/timezone',
    method: 'GET',
    headers: {
      'X-RapidAPI-Key': process.env.EXPO_PUBLIC_RAPID_API_KEY_PRO || 'your-api-key-here',
      'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com'
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`📡 Status Code: ${res.statusCode}`);
        
        if (res.statusCode === 403) {
          console.log('❌ API Key Invalid or Subscription Issue');
          console.log('💡 Possible solutions:');
          console.log('   1. Check RapidAPI dashboard for subscription status');
          console.log('   2. Verify API key is correct');
          console.log('   3. Check if subscription includes this endpoint');
        } else if (res.statusCode === 429) {
          console.log('⚠️ Rate Limit Exceeded');
          console.log('� Solutions:');
          console.log('   1. Wait before next request');
          console.log('   2. Upgrade subscription plan');
        } else if (res.statusCode === 200) {
          console.log('✅ API Key Working!');
          try {
            const parsed = JSON.parse(data);
            console.log('📊 Response:', JSON.stringify(parsed, null, 2));
          } catch (e) {
            console.log('� Raw response:', data);
          }
        }
        
        resolve(data);
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request Error:', error.message);
      reject(error);
    });

    req.setTimeout(10000, () => {
      console.error('❌ Request Timeout');
      req.destroy();
      reject(new Error('Timeout'));
    });

    req.end();
  });
}

// Run the test
testCurrentAPIKey()
  .then(() => {
    console.log('\n✅ API Test Completed');
    console.log('\n🔧 Next Steps:');
    console.log('1. If API key is invalid, get a new one from RapidAPI');
    console.log('2. If rate limited, the app will now use mock data');
    console.log('3. Restart your app to see mock matches displayed');
  })
  .catch((error) => {
    console.error('\n❌ Test Failed:', error.message);
  });
