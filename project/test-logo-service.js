// Test script to verify the new logo service with real APIs
// Run this with: node test-logo-service.js

const fetch = require('node-fetch');

// Mock the team logo service functionality
class TestLogoService {
  constructor() {
    this.logoCache = new Map();
  }

  /**
   * Test Football-Data.org API
   */
  async testFootballDataAPI(teamName) {
    try {
      const apiKey = process.env['EXPO_PUBLIC_FOOTBALL_DATA.ORG_API'];
      
      console.log(`🔍 Testing Football-Data.org API for: ${teamName}`);
      
      const response = await fetch(`https://api.football-data.org/v4/teams?name=${encodeURIComponent(teamName)}`, {
        headers: {
          'X-Auth-Token': apiKey
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.teams && data.teams.length > 0) {
          const team = data.teams[0];
          console.log(`✅ FOUND: ${team.name} → ${team.crest}`);
          return team.crest;
        } else {
          console.log(`❌ NO RESULTS for ${teamName}`);
        }
      } else {
        console.log(`❌ API ERROR: ${response.status} ${response.statusText}`);
      }
      
      return null;
    } catch (error) {
      console.log(`❌ FETCH ERROR for ${teamName}:`, error.message);
      return null;
    }
  }

  /**
   * Test Wikipedia API
   */
  async testWikipediaAPI(teamName) {
    try {
      console.log(`🔍 Testing Wikipedia API for: ${teamName}`);
      
      const pageNames = [
        `${teamName} F.C.`,
        `${teamName} FC`,
        `${teamName}`,
        `${teamName} Football Club`
      ];
      
      for (const pageName of pageNames) {
        try {
          const response = await fetch(
            `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages&titles=${encodeURIComponent(pageName)}&pithumbsize=500&origin=*`
          );
          
          if (response.ok) {
            const data = await response.json();
            const pages = data.query?.pages;
            
            if (pages) {
              const pageId = Object.keys(pages)[0];
              const page = pages[pageId];
              
              if (page.thumbnail?.source) {
                console.log(`✅ FOUND: ${pageName} → ${page.thumbnail.source}`);
                return page.thumbnail.source;
              }
            }
          }
        } catch (error) {
          console.log(`⚠️ Wikipedia attempt failed for "${pageName}":`, error.message);
        }
      }
      
      console.log(`❌ NO WIKIPEDIA LOGO for ${teamName}`);
      return null;
    } catch (error) {
      console.log(`❌ WIKIPEDIA ERROR for ${teamName}:`, error.message);
      return null;
    }
  }

  /**
   * Test both APIs for a team
   */
  async testTeam(teamName) {
    console.log(`\n🏆 TESTING: ${teamName}`);
    console.log('='.repeat(50));
    
    // Test Football-Data.org
    const footballDataLogo = await this.testFootballDataAPI(teamName);
    
    // Test Wikipedia
    const wikipediaLogo = await this.testWikipediaAPI(teamName);
    
    console.log(`\n📊 RESULTS for ${teamName}:`);
    console.log(`   Football-Data.org: ${footballDataLogo || 'NOT FOUND'}`);
    console.log(`   Wikipedia: ${wikipediaLogo || 'NOT FOUND'}`);
    
    return {
      team: teamName,
      footballData: footballDataLogo,
      wikipedia: wikipediaLogo
    };
  }
}

// Test the problematic teams
async function runTests() {
  const service = new TestLogoService();
  
  console.log('🚀 TESTING REAL LOGO APIs');
  console.log('='.repeat(60));
  
  const teams = [
    'Arouca',
    'Lusitânia',
    'Manchester United',
    'Barcelona',
    'Porto',
    'Benfica'
  ];
  
  const results = [];
  
  for (const team of teams) {
    const result = await service.testTeam(team);
    results.push(result);
    
    // Wait a bit between requests to be nice to the APIs
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n🎯 FINAL SUMMARY');
  console.log('='.repeat(60));
  
  results.forEach(result => {
    const hasFootballData = result.footballData ? '✅' : '❌';
    const hasWikipedia = result.wikipedia ? '✅' : '❌';
    console.log(`${result.team}: Football-Data ${hasFootballData} | Wikipedia ${hasWikipedia}`);
  });
}

// Run the tests
runTests().catch(console.error);
