// Debug script to test live matches API
require('dotenv').config();

// Use node-fetch for older Node versions
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

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

console.log('🔴 TESTING LIVE MATCHES API...\n');

async function testLiveMatches() {
  try {
    console.log('📡 Fetching live matches...');
    const response = await fetch('https://api-football-v1.p.rapidapi.com/v3/fixtures?live=all', options);
    
    console.log(`📊 Response Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`📊 Total live matches: ${data.response?.length || 0}\n`);
      
      if (data.response && data.response.length > 0) {
        console.log('🏆 LIVE MATCHES DETAILS:');
        console.log('='.repeat(60));
        
        data.response.forEach((match, i) => {
          console.log(`${i+1}. ${match.teams.home.name} vs ${match.teams.away.name}`);
          console.log(`   Status: ${match.fixture.status.short} | Elapsed: ${match.fixture.status.elapsed || 'N/A'} min`);
          console.log(`   Score: ${match.goals.home || 0}-${match.goals.away || 0}`);
          console.log(`   League: ${match.league.name} (${match.league.country})`);
          console.log(`   Date: ${match.fixture.date}`);
          console.log(`   ID: ${match.fixture.id}`);
          console.log('');
        });
        
        // Test statistics for first match
        if (data.response[0]) {
          const firstMatch = data.response[0];
          console.log('📊 TESTING STATISTICS FOR FIRST MATCH:');
          console.log('='.repeat(60));
          
          try {
            const statsUrl = `https://api-football-v1.p.rapidapi.com/v3/fixtures/statistics?fixture=${firstMatch.fixture.id}`;
            const statsResponse = await fetch(statsUrl, options);
            
            if (statsResponse.ok) {
              const statsData = await statsResponse.json();
              console.log('✅ Statistics available:', statsData.response?.length || 0, 'teams');
              
              if (statsData.response && statsData.response.length > 0) {
                statsData.response.forEach(teamStats => {
                  console.log(`\n📈 ${teamStats.team.name} Statistics:`);
                  teamStats.statistics.forEach(stat => {
                    if (['Corner Kicks', 'Fouls', 'Yellow Cards', 'Red Cards', 'Ball Possession'].includes(stat.type)) {
                      console.log(`   ${stat.type}: ${stat.value}`);
                    }
                  });
                });
              }
            } else {
              console.log('❌ Statistics not available');
            }
          } catch (error) {
            console.log('❌ Error fetching statistics:', error.message);
          }
        }
      } else {
        console.log('📭 No live matches currently available');
        
        // Test today's fixtures instead
        console.log('\n📅 TESTING TODAY\'S FIXTURES...');
        const today = new Date().toISOString().split('T')[0];
        const fixturesUrl = `https://api-football-v1.p.rapidapi.com/v3/fixtures?date=${today}`;
        
        const fixturesResponse = await fetch(fixturesUrl, options);
        if (fixturesResponse.ok) {
          const fixturesData = await fixturesResponse.json();
          console.log(`📊 Today's fixtures: ${fixturesData.response?.length || 0}`);
          
          if (fixturesData.response && fixturesData.response.length > 0) {
            console.log('\n🏆 FIRST 5 TODAY\'S MATCHES:');
            fixturesData.response.slice(0, 5).forEach((match, i) => {
              console.log(`${i+1}. ${match.teams.home.name} vs ${match.teams.away.name}`);
              console.log(`   Status: ${match.fixture.status.short}`);
              console.log(`   Time: ${new Date(match.fixture.date).toLocaleTimeString()}`);
              console.log(`   League: ${match.league.name}`);
              console.log('');
            });
          }
        }
      }
    } else {
      console.log(`❌ API Error: ${response.status} ${response.statusText}`);
      
      if (response.status === 403) {
        console.log('🔑 API Key might be invalid or expired');
      } else if (response.status === 429) {
        console.log('⏰ Rate limit exceeded');
      }
    }
  } catch (error) {
    console.log('❌ Request failed:', error.message);
  }
}

testLiveMatches();
