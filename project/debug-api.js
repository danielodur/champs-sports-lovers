// Quick debug script to check API response
require('dotenv').config();

const API_KEY = process.env.EXPO_PUBLIC_RAPID_API_KEY_PRO;

if (!API_KEY) {
  console.log('❌ No API key found');
  process.exit(1);
}

const options = {
  method: 'GET',
  headers: {
    'X-RapidAPI-Key': API_KEY,
    'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com'
  }
};

console.log('🔴 STARTING DEBUG - Checking API status codes for live matches...');

// Test live matches endpoint with timeout
Promise.race([
  fetch('https://api-football-v1.p.rapidapi.com/v3/fixtures?live=all', options),
  new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
])
  .then(response => response.json())
  .then(data => {
    console.log('\n🔴 LIVE MATCHES API RESPONSE:');
    console.log('Total live matches:', data.response?.length || 0);
    
    if (data.response && data.response.length > 0) {
      // Show first 3 matches with their status details
      data.response.slice(0, 3).forEach((fixture, index) => {
        console.log(`\n--- Live Match ${index + 1} ---`);
        console.log('Teams:', fixture.teams.home.name, 'vs', fixture.teams.away.name);
        console.log('Status Short:', fixture.fixture.status.short);
        console.log('Status Long:', fixture.fixture.status.long);
        console.log('Elapsed Time:', fixture.fixture.status.elapsed);
        console.log('Goals:', fixture.goals.home, '-', fixture.goals.away);
        console.log('Date:', fixture.fixture.date);
      });
    }
    
    console.log('\n🔚 DEBUG COMPLETE');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
