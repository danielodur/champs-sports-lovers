r// Quick test script for team rankings service
import teamRankingsService from './services/teamRankingsService.js';

async function testTeamRankings() {
  console.log('🧪 Testing Team Rankings Service...\n');

  try {
    // Test 1: Test FIFA rankings
    console.log('🌍 Testing FIFA Rankings...');
    const fifaRankings = await teamRankingsService.getFIFARankings();
    console.log(`✅ Loaded ${fifaRankings.length} FIFA rankings`);
    console.log(`   Top 3: ${fifaRankings.slice(0, 3).map(r => `${r.rank}. ${r.team.name}`).join(', ')}\n`);

    // Test 2: Test individual team ranking lookup
    console.log('🔍 Testing Individual Team Rankings...');
    const testTeams = [
      { name: 'Argentina', league: undefined },
      { name: 'Arsenal', league: 'Premier League' },
      { name: 'Real Madrid', league: 'La Liga' },
      { name: 'Bayern Munich', league: 'Bundesliga' },
      { name: 'PSG', league: 'Ligue 1' }
    ];

    for (const team of testTeams) {
      const ranking = await teamRankingsService.getTeamRanking(team.name, team.league);
      console.log(`   ${team.name} (${team.league || 'International'}): Rank #${ranking || 'Not found'}`);
    }

    // Test 3: Test batch rankings
    console.log('\n📦 Testing Batch Rankings...');
    const batchTeams = [
      { name: 'Manchester City', league: 'Premier League' },
      { name: 'Barcelona', league: 'La Liga' },
      { name: 'Brazil', league: undefined },
      { name: 'France', league: undefined }
    ];

    const batchRankings = await teamRankingsService.getBatchTeamRankings(batchTeams);
    console.log(`✅ Batch lookup returned ${batchRankings.size} rankings:`);
    batchRankings.forEach((rank, teamName) => {
      console.log(`   ${teamName}: #${rank}`);
    });

    console.log('\n🎉 All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testTeamRankings(); 