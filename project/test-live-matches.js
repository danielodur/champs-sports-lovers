// Test script to check live matches API
const https = require('https');
require('dotenv').config();

const API_KEY = process.env.EXPO_PUBLIC_RAPID_API_KEY_PRO;

if (!API_KEY) {
  console.log('❌ No API key found');
  process.exit(1);
}

function makeAPICall(path) {
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

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const jsonData = JSON.parse(data);
            resolve(jsonData);
          } catch (error) {
            reject(error);
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

async function testLiveMatches() {
  try {
    console.log('🔴 TESTING LIVE MATCHES API...\n');
    
    // Test live matches endpoint
    console.log('📡 Calling: /v3/fixtures?live=all');
    const liveData = await makeAPICall('/v3/fixtures?live=all');
    
    console.log(`📊 API Response:`);
    console.log(`   Status: Success`);
    console.log(`   Total matches: ${liveData.response?.length || 0}`);
    console.log(`   API calls remaining: ${liveData.paging?.current || 'N/A'}/${liveData.paging?.total || 'N/A'}`);
    
    if (liveData.response && liveData.response.length > 0) {
      console.log('\n🏆 LIVE MATCHES FOUND:');
      console.log('='.repeat(80));
      
      liveData.response.forEach((match, i) => {
        console.log(`${i+1}. ${match.teams.home.name} vs ${match.teams.away.name}`);
        console.log(`   Status: ${match.fixture.status.short} (${match.fixture.status.long})`);
        console.log(`   Elapsed: ${match.fixture.status.elapsed || 'N/A'} minutes`);
        console.log(`   Score: ${match.goals.home || 0} - ${match.goals.away || 0}`);
        console.log(`   League: ${match.league.name} (${match.league.country})`);
        console.log(`   Match ID: ${match.fixture.id}`);
        console.log(`   Date: ${match.fixture.date}`);
        console.log('');
      });
      
      // Test statistics for first match
      if (liveData.response[0]) {
        const firstMatch = liveData.response[0];
        console.log('📊 TESTING STATISTICS FOR FIRST MATCH:');
        console.log('='.repeat(80));
        
        try {
          const statsData = await makeAPICall(`/v3/fixtures/statistics?fixture=${firstMatch.fixture.id}`);
          
          if (statsData.response && statsData.response.length > 0) {
            console.log(`✅ Statistics available for match ${firstMatch.fixture.id}`);
            
            statsData.response.forEach(teamStats => {
              console.log(`\n📈 ${teamStats.team.name}:`);
              const relevantStats = teamStats.statistics.filter(stat => 
                ['Corner Kicks', 'Fouls', 'Yellow Cards', 'Red Cards', 'Ball Possession', 'Shots on Goal', 'Total Shots'].includes(stat.type)
              );
              
              relevantStats.forEach(stat => {
                console.log(`   ${stat.type}: ${stat.value}`);
              });
            });
          } else {
            console.log('❌ No statistics available for this match');
          }
        } catch (error) {
          console.log('❌ Error fetching statistics:', error.message);
        }
      }
      
    } else {
      console.log('📭 No live matches currently available');
      
      // Test today's fixtures as fallback
      console.log('\n📅 TESTING TODAY\'S FIXTURES AS FALLBACK...');
      const today = new Date().toISOString().split('T')[0];
      
      try {
        const fixturesData = await makeAPICall(`/v3/fixtures?date=${today}`);
        console.log(`📊 Today's fixtures (${today}): ${fixturesData.response?.length || 0} matches`);
        
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
      } catch (error) {
        console.log('❌ Error fetching today\'s fixtures:', error.message);
      }
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

testLiveMatches();
