// Comprehensive API test to check all match data including cards and corners
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

console.log('🔍 COMPREHENSIVE API TEST - Checking all match data...\n');

async function testAPI() {
  try {
    // Test live matches
    console.log('📡 Testing live matches...');
    const liveResponse = await fetch('https://api-football-v1.p.rapidapi.com/v3/fixtures?live=all', options);
    const liveData = await liveResponse.json();
    
    console.log(`✅ Live matches: ${liveData.response?.length || 0} found`);
    
    if (liveData.response && liveData.response.length > 0) {
      const match = liveData.response[0];
      console.log('\n📊 Sample live match structure:');
      console.log('ID:', match.fixture.id);
      console.log('Status:', match.fixture.status.short, '(' + match.fixture.status.long + ')');
      console.log('Teams:', match.teams.home.name, 'vs', match.teams.away.name);
      console.log('Score:', match.goals.home, '-', match.goals.away);
      console.log('Elapsed:', match.fixture.status.elapsed || 'N/A');
      
      // Check if statistics are included
      if (match.statistics) {
        console.log('\n📈 Statistics available:');
        const homeStats = match.statistics.find(s => s.team.id === match.teams.home.id);
        const awayStats = match.statistics.find(s => s.team.id === match.teams.away.id);
        
        if (homeStats && homeStats.statistics) {
          console.log('Home team stats available:', homeStats.statistics.length, 'categories');
          homeStats.statistics.forEach(stat => {
            if (stat.type.includes('Corner') || stat.type.includes('Card')) {
              console.log(`  ${stat.type}: ${stat.value}`);
            }
          });
        }
      } else {
        console.log('⚠️ No statistics in live matches response');
      }
    }

    // Test fixtures endpoint for comparison
    console.log('\n📡 Testing fixtures endpoint...');
    const today = new Date().toISOString().split('T')[0];
    const fixturesResponse = await fetch(`https://api-football-v1.p.rapidapi.com/v3/fixtures?date=${today}`, options);
    const fixturesData = await fixturesResponse.json();
    
    console.log(`✅ Fixtures today: ${fixturesData.response?.length || 0} found`);

    // Test if we can get statistics separately for a specific match
    if (liveData.response && liveData.response.length > 0) {
      const matchId = liveData.response[0].fixture.id;
      console.log(`\n📡 Testing statistics for match ${matchId}...`);
      
      const statsResponse = await fetch(`https://api-football-v1.p.rapidapi.com/v3/fixtures/statistics?fixture=${matchId}`, options);
      const statsData = await statsResponse.json();
      
      if (statsData.response && statsData.response.length > 0) {
        console.log('✅ Statistics endpoint works');
        console.log('Available stats categories:');
        statsData.response.forEach(teamStats => {
          console.log(`${teamStats.team.name}:`);
          teamStats.statistics.forEach(stat => {
            console.log(`  ${stat.type}: ${stat.value}`);
          });
        });
      } else {
        console.log('⚠️ No statistics from separate endpoint');
      }
    }

    console.log('\n✅ API test complete');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testAPI();
