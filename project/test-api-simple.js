// Simple API test without complex imports
const https = require('https');
require('dotenv').config();

const API_KEY = process.env.EXPO_PUBLIC_RAPID_API_KEY_PRO;

console.log('🔑 API Key:', API_KEY ? `Found (${API_KEY.substring(0, 8)}...)` : 'Missing');

if (!API_KEY) {
  console.log('❌ No API key found');
  process.exit(1);
}

function makeRequest(path, description) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api-football-v1.p.rapidapi.com',
      port: 443,
      path: path,
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': API_KEY,
        'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com'
      }
    };

    console.log(`\n🔍 ${description}`);
    console.log(`📡 URL: https://api-football-v1.p.rapidapi.com${path}`);

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`📊 Status: ${res.statusCode}`);
        
        if (res.statusCode === 200) {
          try {
            const jsonData = JSON.parse(data);
            console.log(`✅ Success: ${jsonData.response?.length || 0} items`);
            
            if (jsonData.response && jsonData.response.length > 0) {
              console.log('\n📋 FIRST 3 RESULTS:');
              jsonData.response.slice(0, 3).forEach((item, i) => {
                if (item.teams) {
                  // Live/fixture format
                  console.log(`${i+1}. ${item.teams.home.name} vs ${item.teams.away.name}`);
                  console.log(`   Status: ${item.fixture.status.short} | Elapsed: ${item.fixture.status.elapsed || 'N/A'}`);
                  console.log(`   Score: ${item.goals.home || 0}-${item.goals.away || 0}`);
                  console.log(`   League: ${item.league.name}`);
                } else {
                  // Other format
                  console.log(`${i+1}.`, JSON.stringify(item).substring(0, 100) + '...');
                }
                console.log('');
              });
            } else {
              console.log('📭 No data returned');
            }
            
            resolve(jsonData);
          } catch (error) {
            console.log('❌ JSON Parse Error:', error.message);
            console.log('📄 Raw response:', data.substring(0, 200) + '...');
            reject(error);
          }
        } else {
          console.log(`❌ HTTP Error: ${res.statusCode}`);
          console.log('📄 Response:', data.substring(0, 200));
          
          if (res.statusCode === 403) {
            console.log('🔑 API Key might be invalid or expired');
          } else if (res.statusCode === 429) {
            console.log('⏰ Rate limit exceeded');
          }
          
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      });
    });

    req.on('error', (error) => {
      console.log('❌ Request Error:', error.message);
      reject(error);
    });

    req.setTimeout(10000, () => {
      console.log('❌ Request Timeout');
      req.destroy();
      reject(new Error('Timeout'));
    });

    req.end();
  });
}

async function testAPI() {
  try {
    console.log('🚀 TESTING FOOTBALL API ENDPOINTS...\n');
    
    // Test 1: Live matches
    await makeRequest('/v3/fixtures?live=all', 'LIVE MATCHES');
    
    // Test 2: Today's fixtures
    const today = new Date().toISOString().split('T')[0];
    await makeRequest(`/v3/fixtures?date=${today}`, `TODAY'S FIXTURES (${today})`);
    
    // Test 3: API status
    await makeRequest('/v3/status', 'API STATUS');
    
    console.log('\n✅ API Test Completed');
    
  } catch (error) {
    console.log('\n❌ Test Failed:', error.message);
  }
}

testAPI();
