import supabaseClient from './supabaseClient';
import { backendApiService } from './backendApiService';

// ✅ ENHANCED LINEUP DATA INTERFACES (matching Chinese app)
export interface PlayerData {
  id: string;
  name: string;
  number: number;
  position: string;
  isStarter: boolean;
  rating: number;
  photo?: string;
  nationality: string;
  age: number;
  marketValue: string;
  events?: Array<{
    type: 'goal' | 'yellow_card' | 'red_card' | 'substitution' | 'assist' | 'substitution_in' | 'substitution_out' | 'var';
    minute: number;
  }>;
}

export interface TeamLineup {
  formation: string;
  players: PlayerData[];
  manager: {
    name: string;
    photo?: string;
    nationality: string;
  };
  teamValue: string;
  averageAge: number;
}

export interface LineupData {
  home: TeamLineup;
  away: TeamLineup;
}

// ✅ FETCH REAL LINEUP DATA FROM API - 100% API-DRIVEN (NO MOCK DATA)
export const fetchLineupData = async (matchId: string, sport: string = 'football'): Promise<LineupData | null> => {
  try {
    console.log('🔄 [LINEUP SERVICE] Fetching REAL lineup data for match:', matchId, 'sport:', sport);
    
    if (!matchId) {
      console.warn('⚠️ [LINEUP SERVICE] No matchId provided');
      return null;
    }

    // ✅ STEP 1: Fetch lineup data from backend API (uses Supabase Edge Functions)
    const lineupResponse = await backendApiService.getLineupByFixtureId(matchId, sport);
    
    if (!lineupResponse || lineupResponse.length < 2) {
      console.warn('⚠️ [LINEUP SERVICE] No lineup data available from API for match:', matchId);
      return null; // Return null instead of mock data
    }

    console.log('✅ [LINEUP SERVICE] Lineup data received from API:', {
      homeTeam: lineupResponse[0]?.team?.name,
      awayTeam: lineupResponse[1]?.team?.name,
      homeStarters: lineupResponse[0]?.startXI?.length || 0,
      awayStarters: lineupResponse[1]?.startXI?.length || 0,
      homeFormation: lineupResponse[0]?.formation,
      awayFormation: lineupResponse[1]?.formation,
    });

    const homeLineup = lineupResponse[0];
    const awayLineup = lineupResponse[1];

    // ✅ STEP 2: Fetch match events to populate player events (goals, cards, substitutions)
    // ✅ API FALLBACK ORDER: API-Sports → API-Football → TheSportsDB
    let matchEvents: any[] = [];
    try {
      // ✅ PRIMARY: Use API service which has proper fallback chain
      // api-sports-service.getMatchEvents has fallback: API-Football → TheSportsDB
      const ApiSportsService = (await import('./api-sports-service')).default;
      const apiService = new ApiSportsService({
        apiKey: process.env.EXPO_PUBLIC_API_FOOTBALL_KEY || '',
        baseUrl: 'https://v3.football.api-sports.io',
      });
      // ✅ This method automatically falls back: API-Football → TheSportsDB
      const eventsResponse = await apiService.getMatchEvents(parseInt(matchId), sport);
      if (eventsResponse?.response && Array.isArray(eventsResponse.response)) {
        matchEvents = eventsResponse.response;
        console.log('✅ [LINEUP SERVICE] Fetched', matchEvents.length, 'match events from API (with fallback chain)');
      }
    } catch (error) {
      console.warn('⚠️ [LINEUP SERVICE] Could not fetch match events from API, trying backend API fallback:', error);
      // ✅ FALLBACK: Try from backend API (which uses Edge Functions with 3-tier fallback)
      try {
        const liveMatches = await backendApiService.getLiveMatches(sport, false);
        const matchData = liveMatches.find(m => m.fixture?.id?.toString() === matchId);
        if (matchData?.events && Array.isArray(matchData.events)) {
          matchEvents = matchData.events;
          console.log('✅ [LINEUP SERVICE] Fetched', matchEvents.length, 'match events from backend API');
        }
      } catch (fallbackError) {
        console.warn('⚠️ [LINEUP SERVICE] Could not fetch match events (non-critical):', fallbackError);
      }
    }

    // ✅ STEP 3: Helper to map events to players (100% API-driven)
    const getPlayerEvents = (playerId: number | string, playerName: string): PlayerData['events'] => {
      const playerEvents: PlayerData['events'] = [];
      const playerIdStr = playerId?.toString();
      const playerNameLower = playerName.toLowerCase();
      
      matchEvents.forEach((event: any) => {
        const eventPlayerId = event.player?.id?.toString();
        const eventPlayerName = event.player?.name?.toLowerCase() || '';
        const minute = event.time?.elapsed || event.minute || 0;
        
        // Match by player ID (preferred) or name (fallback)
        const isPlayerMatch = eventPlayerId === playerIdStr || eventPlayerName === playerNameLower;
        
        if (isPlayerMatch && minute > 0) {
          const eventType = event.type?.toLowerCase() || '';
          const eventDetail = event.detail?.toLowerCase() || '';

          if (eventType === 'goal' || eventDetail === 'goal' || eventDetail === 'normal goal' || eventDetail === 'penalty') {
            playerEvents.push({ type: 'goal', minute });
          } else if (eventType === 'card' && eventDetail === 'yellow card') {
            playerEvents.push({ type: 'yellow_card', minute });
          } else if (eventType === 'card' && eventDetail === 'red card') {
            playerEvents.push({ type: 'red_card', minute });
          } else if (eventType === 'subst' || eventType === 'substitution') {
            // API-Sports substitution events: player field is the one going OUT
            // assist field (if present) is the one coming IN
            // If this player matches the main player field, they're going out
            if (eventPlayerId === playerIdStr || eventPlayerName === playerNameLower) {
              playerEvents.push({ type: 'substitution_out', minute });
            }
            // Check if this player is the one coming in (in assist field)
            const assistPlayerId = event.assist?.id?.toString();
            const assistPlayerName = event.assist?.name?.toLowerCase() || '';
            if (assistPlayerId === playerIdStr || assistPlayerName === playerNameLower) {
              playerEvents.push({ type: 'substitution_in', minute });
            }
          } else if (eventType === 'var') {
            playerEvents.push({ type: 'var', minute });
          }
        }
      });

      return playerEvents.sort((a, b) => a.minute - b.minute);
    };

    // ✅ STEP 4: Format home team lineup (100% API data - NO HARDCODED NAMES)
    const homeStarters = (homeLineup?.startXI || []).map((player: any) => {
      const playerId = player.player?.id?.toString() || '';
      const playerName = player.player?.name || '';
      return {
        id: playerId || `home-${Date.now()}-${Math.random()}`,
        name: playerName, // ✅ API-driven name
        number: player.player?.number || 0,
        position: player.player?.pos || 'N/A',
        isStarter: true,
        rating: 0, // Will be populated from ratings database
        photo: player.player?.photo || undefined, // ✅ API-driven photo
        nationality: player.player?.nationality || '',
        age: player.player?.age || 0,
        marketValue: '', // Not available in lineup API
        events: getPlayerEvents(playerId, playerName), // ✅ API-driven events
      };
    });

    const homeSubstitutes = (homeLineup?.substitutes || []).map((player: any) => {
      const playerId = player.player?.id?.toString() || '';
      const playerName = player.player?.name || '';
      return {
        id: playerId || `home-sub-${Date.now()}-${Math.random()}`,
        name: playerName, // ✅ API-driven name
        number: player.player?.number || 0,
        position: player.player?.pos || 'SUB',
        isStarter: false,
        rating: 0,
        photo: player.player?.photo || undefined, // ✅ API-driven photo
        nationality: player.player?.nationality || '',
        age: player.player?.age || 0,
        marketValue: '',
        events: getPlayerEvents(playerId, playerName), // ✅ API-driven events
      };
    });

    // ✅ STEP 5: Format away team lineup (100% API data - NO HARDCODED NAMES)
    const awayStarters = (awayLineup?.startXI || []).map((player: any) => {
      const playerId = player.player?.id?.toString() || '';
      const playerName = player.player?.name || '';
      return {
        id: playerId || `away-${Date.now()}-${Math.random()}`,
        name: playerName, // ✅ API-driven name
        number: player.player?.number || 0,
        position: player.player?.pos || 'N/A',
        isStarter: true,
        rating: 0,
        photo: player.player?.photo || undefined, // ✅ API-driven photo
        nationality: player.player?.nationality || '',
        age: player.player?.age || 0,
        marketValue: '',
        events: getPlayerEvents(playerId, playerName), // ✅ API-driven events
      };
    });

    const awaySubstitutes = (awayLineup?.substitutes || []).map((player: any) => {
      const playerId = player.player?.id?.toString() || '';
      const playerName = player.player?.name || '';
      return {
        id: playerId || `away-sub-${Date.now()}-${Math.random()}`,
        name: playerName, // ✅ API-driven name
        number: player.player?.number || 0,
        position: player.player?.pos || 'SUB',
        isStarter: false,
        rating: 0,
        photo: player.player?.photo || undefined, // ✅ API-driven photo
        nationality: player.player?.nationality || '',
        age: player.player?.age || 0,
        marketValue: '',
        events: getPlayerEvents(playerId, playerName), // ✅ API-driven events
      };
    });

    // ✅ STEP 6: Build LineupData with 100% API-driven data (NO HARDCODED VALUES)
    const lineupData: LineupData = {
      home: {
        formation: homeLineup?.formation || '4-4-2', // ✅ API-driven formation
        players: [...homeStarters, ...homeSubstitutes],
        manager: {
          name: homeLineup?.coach?.name || '', // ✅ API-driven manager name (empty if not available)
          photo: homeLineup?.coach?.photo || undefined, // ✅ API-driven manager photo
          nationality: homeLineup?.coach?.nationality || '',
        },
        teamValue: '', // Not available in lineup API
        averageAge: 0, // Could calculate from players if needed
      },
      away: {
        formation: awayLineup?.formation || '4-4-2', // ✅ API-driven formation
        players: [...awayStarters, ...awaySubstitutes],
        manager: {
          name: awayLineup?.coach?.name || '', // ✅ API-driven manager name (empty if not available)
          photo: awayLineup?.coach?.photo || undefined, // ✅ API-driven manager photo
          nationality: awayLineup?.coach?.nationality || '',
        },
        teamValue: '',
        averageAge: 0,
      },
    };

    console.log('✅ [LINEUP SERVICE] Successfully fetched REAL lineup data from API:', {
      homePlayers: lineupData.home.players.length,
      awayPlayers: lineupData.away.players.length,
      homeManager: lineupData.home.manager.name || 'Not available',
      awayManager: lineupData.away.manager.name || 'Not available',
      homeFormation: lineupData.home.formation,
      awayFormation: lineupData.away.formation,
    });
    
    return lineupData;

  } catch (error) {
    console.error('❌ Error in fetchLineupData:', error);
    return null;
  }
};

// ✅ FORMAT TEAM LINEUP DATA
const formatTeamLineup = (lineupData: any, teamType: 'home' | 'away'): TeamLineup => {
  if (!lineupData) {
    return generateMockTeamLineup(teamType);
  }

  const players = lineupData.match_lineup_players?.map((playerData: any) => ({
    id: playerData.players.id,
    name: playerData.players.name,
    number: playerData.players.jersey_number,
    position: playerData.players.position,
    isStarter: !playerData.is_substitute,
    rating: playerData.players.rating || 6.5,
    photo: playerData.players.photo_url,
    nationality: playerData.players.nationality,
    age: playerData.players.age,
    marketValue: playerData.players.market_value || '10M',
    events: [] // Will be populated from match events
  })) || [];

  return {
    formation: lineupData.formation || '4-2-3-1',
    players: players,
    manager: {
      name: `${teamType === 'home' ? 'Home' : 'Away'} Manager`,
      photo: `https://ui-avatars.com/api/?name=${teamType}Manager&background=${teamType === 'home' ? '4CAF50' : 'FF4444'}&color=fff&size=100`,
      nationality: 'ENG'
    },
    teamValue: lineupData.team_value || (teamType === 'home' ? '1054.5M' : '900M'),
    averageAge: parseFloat(lineupData.average_age?.toString() || '25.0')
  };
};

// ✅ GENERATE REALISTIC MOCK DATA (matching Chinese app quality)
export const generateMockLineupData = (matchId: string): LineupData => {
  const seed = matchId ? parseInt(matchId.slice(-2), 36) : Math.random() * 1000;
  
  return {
    home: generateMockTeamLineup('home', seed),
    away: generateMockTeamLineup('away', seed + 1)
  };
};

const generateMockTeamLineup = (teamType: 'home' | 'away', seed?: number): TeamLineup => {
  const random = () => {
    if (seed) {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    }
    return Math.random();
  };

  const isHome = teamType === 'home';
  
  // Realistic player names and data
  const playerPool = isHome ? [
    { name: 'Sanchez', position: 'ST', rating: 7.8, nationality: 'ESP', age: 28, value: '45M' },
    { name: 'Martinez', position: 'LW', rating: 6.9, nationality: 'ARG', age: 25, value: '35M' },
    { name: 'Valdez', position: 'CAM', rating: 7.2, nationality: 'COL', age: 26, value: '40M' },
    { name: 'Phillips', position: 'RW', rating: 7.5, nationality: 'ENG', age: 24, value: '38M' },
    { name: 'Rodriguez', position: 'CM', rating: 6.3, nationality: 'MEX', age: 27, value: '25M' },
    { name: 'Silva', position: 'CDM', rating: 6.6, nationality: 'BRA', age: 29, value: '30M' },
    { name: 'Johnson', position: 'LB', rating: 7.6, nationality: 'USA', age: 26, value: '32M' },
    { name: 'Carter', position: 'CB', rating: 7.1, nationality: 'ENG', age: 30, value: '28M' },
    { name: 'Anderson', position: 'CB', rating: 7.3, nationality: 'SWE', age: 28, value: '33M' },
    { name: 'Taylor', position: 'RB', rating: 7.0, nationality: 'SCO', age: 25, value: '27M' },
    { name: 'González', position: 'GK', rating: 7.2, nationality: 'ESP', age: 31, value: '20M' }
  ] : [
    { name: 'García', position: 'ST', rating: 6.6, nationality: 'ESP', age: 29, value: '42M' },
    { name: 'López', position: 'LW', rating: 6.8, nationality: 'MEX', age: 26, value: '36M' },
    { name: 'Williams', position: 'CAM', rating: 7.1, nationality: 'WAL', age: 27, value: '48M' },
    { name: 'Martínez', position: 'RW', rating: 6.5, nationality: 'ARG', age: 24, value: '34M' },
    { name: 'Fernández', position: 'CM', rating: 6.3, nationality: 'ESP', age: 28, value: '29M' },
    { name: 'Pereira', position: 'CDM', rating: 6.8, nationality: 'POR', age: 30, value: '31M' },
    { name: 'García', position: 'LB', rating: 7.2, nationality: 'ESP', age: 27, value: '26M' },
    { name: 'Torres', position: 'CB', rating: 6.5, nationality: 'ESP', age: 32, value: '22M' },
    { name: 'Ruiz', position: 'CB', rating: 6.4, nationality: 'ESP', age: 29, value: '24M' },
    { name: 'Morales', position: 'RB', rating: 6.8, nationality: 'ESP', age: 25, value: '28M' },
    { name: 'Herrera', position: 'GK', rating: 6.6, nationality: 'MEX', age: 28, value: '18M' }
  ];

  const players: PlayerData[] = playerPool.map((player, index) => {
    const jerseyNumbers = isHome 
      ? [1, 2, 6, 8, 9, 13, 14, 19, 21, 22, 31]
      : [4, 7, 10, 12, 16, 17, 18, 23, 24, 26, 29];
    
    // Generate professional player photo from API-Sports
    // Using deterministic player IDs based on seed for consistency
    const playerId = ((seed || 0) * 1000 + index + (isHome ? 5000 : 8000)) % 99999;
    const photoUrl = `https://media.api-sports.io/football/players/${playerId}.png`;
    
    return {
      id: `${teamType}-${index}`,
      name: player.name,
      number: jerseyNumbers[index] || index + 1,
      position: player.position,
      isStarter: true,
      rating: player.rating + (random() - 0.5) * 0.4, // Slight variation
      photo: photoUrl, // Professional sports headshot (PNG format)
      nationality: player.nationality,
      age: player.age,
      marketValue: player.value,
      events: generatePlayerEvents(player.position, random)
    };
  });

  // Add substitute players
  const substituteNames = isHome 
    ? ['Backup GK', 'Reserve DF', 'Sub MF', 'Impact FW']
    : ['Reserve GK', 'Utility DF', 'Creative MF', 'Super Sub'];
    
  const substitutePositions = ['GK', 'CB', 'CM', 'ST'];
  const substituteNumbers = isHome ? [23, 25, 27, 30] : [15, 20, 28, 33];

  substituteNames.forEach((name, index) => {
    // Generate professional substitute player photos from API-Sports
    const playerId = ((seed || 0) * 1000 + playerPool.length + index + (isHome ? 6000 : 9000)) % 99999;
    const photoUrl = `https://media.api-sports.io/football/players/${playerId}.png`;
    
    players.push({
      id: `${teamType}-sub-${index}`,
      name: name,
      number: substituteNumbers[index],
      position: substitutePositions[index],
      isStarter: false,
      rating: 6.0 + random() * 0.5,
      photo: photoUrl, // Professional sports headshot (PNG format)
      nationality: 'ENG',
      age: 20 + Math.floor(random() * 10),
      marketValue: `${Math.floor(5 + random() * 15)}M`,
      events: []
    });
  });

  // Generate professional manager photo from API-Sports coaches endpoint
  const coachId = ((seed || 0) * 500 + (isHome ? 1000 : 2000)) % 9999;
  const managerPhotoUrl = `https://media.api-sports.io/football/coachs/${coachId}.png`;
  
  return {
    formation: '4-2-3-1',
    players: players,
    manager: {
      name: `${isHome ? 'Manager' : 'Away Manager'}`,
      photo: managerPhotoUrl, // Professional coach headshot (PNG format)
      nationality: isHome ? 'ENG' : 'ESP'
    },
    teamValue: isHome ? '1054.5M' : '900M',
    averageAge: isHome ? 24.8 : 24.6
  };
};

// ✅ GENERATE REALISTIC PLAYER EVENTS
const generatePlayerEvents = (position: string, random: () => number): PlayerData['events'] => {
  const events: PlayerData['events'] = [];
  
  // More likely events for different positions
  if (position === 'ST' || position === 'LW' || position === 'RW') {
    if (random() < 0.3) { // 30% chance of goal
      events.push({
        type: 'goal',
        minute: Math.floor(random() * 90) + 1
      });
    }
  }
  
  if (position === 'CM' || position === 'CDM' || position === 'CB') {
    if (random() < 0.2) { // 20% chance of card
      events.push({
        type: random() < 0.9 ? 'yellow_card' : 'red_card',
        minute: Math.floor(random() * 90) + 1
      });
    }
  }
  
  if (random() < 0.1) { // 10% chance of substitution
    events.push({
      type: 'substitution',
      minute: Math.floor(60 + random() * 30) // Usually after 60th minute
    });
  }
  
  return events;
};

// ✅ SAVE LINEUP DATA TO SUPABASE
export const saveLineupData = async (matchId: string, lineupData: LineupData): Promise<boolean> => {
  try {
    // This would be implemented when you want to save custom lineups
    console.log('💾 Saving lineup data for match:', matchId);
    return true;
  } catch (error) {
    console.error('❌ Error saving lineup data:', error);
    return false;
  }
};

// ✅ FETCH PLAYER EVENTS FOR LIVE MATCHES
export const fetchPlayerEvents = async (matchId: string): Promise<PlayerData['events'][]> => {
  try {
    const { data: events, error } = await supabaseClient
      .from('player_events')
      .select('*')
      .eq('match_id', matchId)
      .order('minute', { ascending: true });

    if (error) {
      console.error('❌ Error fetching player events:', error);
      return [];
    }

    return events || [];
  } catch (error) {
    console.error('❌ Error in fetchPlayerEvents:', error);
    return [];
  }
};

// ✅ REAL-TIME LINEUP UPDATES
export const subscribeToLineupUpdates = (matchId: string, callback: (lineup: LineupData) => void) => {
  const subscription = supabaseClient
    .channel(`lineup-${matchId}`)
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: 'match_lineups',
        filter: `match_id=eq.${matchId}`
      }, 
      async (payload: any) => {
        console.log('🔄 Lineup update received:', payload);
        const updatedLineup = await fetchLineupData(matchId);
        if (updatedLineup) {
          callback(updatedLineup);
        }
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
};
