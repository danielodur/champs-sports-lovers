// Simple test to verify logo service functionality
console.log('🚀 Testing Logo Service...');

// Test the team database entries
const testTeams = [
  { name: 'Arouca', league: 'Primeira Liga' },
  { name: 'Lusitânia', league: 'Liga 3' },
  { name: 'Manchester United', league: 'Premier League' },
  { name: 'Barcelona', league: 'La Liga' }
];

// Mock the team logo service structure
const TEAM_LOGOS = {
  'Arouca': {
    id: 'arouca',
    name: 'Arouca',
    logoUrl: 'https://crests.football-data.org/5529.svg',
    fallbackUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/6/6a/FC_Arouca_logo.svg/200px-FC_Arouca_logo.svg.png',
    league: 'Primeira Liga',
    country: 'Portugal',
    aliases: ['FC Arouca', 'Futebol Clube de Arouca', 'Arouca FC']
  },
  'Lusitânia': {
    id: 'lusitania',
    name: 'Lusitânia',
    logoUrl: 'https://crests.football-data.org/5530.svg',
    fallbackUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Lusit%C3%A2nia_FC_logo.svg/200px-Lusit%C3%A2nia_FC_logo.svg.png',
    league: 'Liga 3',
    country: 'Portugal',
    aliases: ['Lusitânia FC', 'Lusitania', 'Lusitânia Futebol Clube']
  }
};

function cleanTeamName(teamName) {
  return teamName
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, '');
}

function findDirectMatch(cleanTeamName, league) {
  for (const [key, team] of Object.entries(TEAM_LOGOS)) {
    if (cleanTeamName(key) === cleanTeamName || 
        team.name.toLowerCase() === cleanTeamName) {
      return team;
    }
  }
  return null;
}

console.log('\n📊 TESTING TEAM DATABASE MATCHES:');
console.log('='.repeat(50));

testTeams.forEach(({ name, league }) => {
  const cleanName = cleanTeamName(name);
  const match = findDirectMatch(cleanName, league);
  
  if (match) {
    console.log(`✅ ${name}: FOUND → ${match.logoUrl}`);
  } else {
    console.log(`❌ ${name}: NOT FOUND`);
  }
});

console.log('\n🎯 LOGO URLS TO TEST:');
console.log('='.repeat(50));

Object.values(TEAM_LOGOS).forEach(team => {
  console.log(`${team.name}: ${team.logoUrl}`);
});

console.log('\n✅ Test completed! Check the URLs above to verify they work.');
