// Direct API test to check status codes
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

console.log('🔍 DIRECT API TEST - Checking live match status codes...\n');

fetch('https://api-football-v1.p.rapidapi.com/v3/fixtures?live=all', options)
  .then(response => response.json())
  .then(data => {
    console.log(`📊 Total live matches: ${data.response?.length || 0}\n`);
    
    if (data.response && data.response.length > 0) {
      // Show status codes for all matches
      const statusCounts = {};
      
      data.response.forEach((fixture, index) => {
        const status = fixture.fixture.status.short;
        statusCounts[status] = (statusCounts[status] || 0) + 1;
        
        if (index < 5) { // Show details for first 5 matches
          console.log(`🏈 Match ${index + 1}: ${fixture.teams.home.name} vs ${fixture.teams.away.name}`);
          console.log(`   Status: "${status}" (${fixture.fixture.status.long})`);
          console.log(`   Elapsed: ${fixture.fixture.status.elapsed || 'N/A'}`);
          console.log(`   Score: ${fixture.goals.home || 0} - ${fixture.goals.away || 0}`);
          console.log('');
        }
      });
      
      console.log('📈 STATUS CODE SUMMARY:');
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`   "${status}": ${count} matches`);
      });
    }
    
    console.log('\n✅ API test complete');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
