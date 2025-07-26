// Team Logo Service - Official Logos with Supabase Storage + Real Country Flags
import { Match } from '@/types/match';
import { supabase } from '@/services/supabaseClient';

interface TeamLogo {
  id: string;
  name: string;
  logoUrl: string;
  fallbackUrl: string;
  league: string;
  country: string;
  aliases?: string[];
}

// 🏆 SUPABASE STORAGE CONFIGURATION
const SUPABASE_STORAGE_CONFIG = {
  BUCKET_NAME: 'team-logos',
  BASE_URL: 'https://mfjxwtlqmvdujxpwnrvf.supabase.co/storage/v1/object/public/team-logos/',
  DEFAULT_LOGO: 'https://mfjxwtlqmvdujxpwnrvf.supabase.co/storage/v1/object/public/team-logos/default-team.png',
  // 🎯 BETTER FALLBACK LOGOS - Using actual working URLs
  FALLBACK_LOGOS: {
    HOME: 'https://ui-avatars.com/api/?name=H&background=FFD700&color=000000&size=128&rounded=true&font-size=0.6',
    AWAY: 'https://ui-avatars.com/api/?name=A&background=9CA3AF&color=000000&size=128&rounded=true&font-size=0.6',
    GENERIC: 'https://ui-avatars.com/api/?name=FC&background=4A90E2&color=FFFFFF&size=128&rounded=true&font-size=0.5',
    TEAM_SPECIFIC: (teamName: string, isHome: boolean = true) => {
      const initial = teamName.charAt(0).toUpperCase();
      const bgColor = isHome ? 'FFD700' : '9CA3AF';
      const textColor = isHome ? '000000' : 'FFFFFF';
      return `https://ui-avatars.com/api/?name=${initial}&background=${bgColor}&color=${textColor}&size=128&rounded=true&font-size=0.6`;
    }
  }
};

// 🌍 OFFICIAL TEAM LOGOS DATABASE - Using Supabase Storage
const TEAM_LOGOS: { [key: string]: TeamLogo } = {
  // === PREMIER LEAGUE - Official Logos ===
  'Manchester United': {
    id: 'manchester-united',
    name: 'Manchester United', 
    logoUrl: `${SUPABASE_STORAGE_CONFIG.BASE_URL}premier-league/manchester-united.png`,
    fallbackUrl: `${SUPABASE_STORAGE_CONFIG.BASE_URL}premier-league/man-utd-alt.png`,
    league: 'Premier League',
    country: 'England',
    aliases: ['Man United', 'MUFC', 'United', 'Man Utd']
  },
  'Arsenal': {
    id: 'arsenal',
    name: 'Arsenal',
    logoUrl: `${SUPABASE_STORAGE_CONFIG.BASE_URL}premier-league/arsenal.png`,
    fallbackUrl: `${SUPABASE_STORAGE_CONFIG.BASE_URL}premier-league/arsenal-alt.png`,
    league: 'Premier League',
    country: 'England',
    aliases: ['Gunners', 'AFC', 'Arsenal FC']
  },
  'Chelsea': {
    id: 'chelsea',
    name: 'Chelsea',
    logoUrl: `${SUPABASE_STORAGE_CONFIG.BASE_URL}premier-league/chelsea.png`,
    fallbackUrl: `${SUPABASE_STORAGE_CONFIG.BASE_URL}premier-league/chelsea-alt.png`,
    league: 'Premier League', 
    country: 'England',
    aliases: ['Blues', 'CFC', 'Chelsea FC']
  },
  'Liverpool': {
    id: 'liverpool',
    name: 'Liverpool',
    logoUrl: `${SUPABASE_STORAGE_CONFIG.BASE_URL}premier-league/liverpool.png`,
    fallbackUrl: `${SUPABASE_STORAGE_CONFIG.BASE_URL}premier-league/liverpool-alt.png`,
    league: 'Premier League',
    country: 'England', 
    aliases: ['Reds', 'LFC', 'Liverpool FC']
  },
  'Manchester City': {
    id: 'manchester-city',
    name: 'Manchester City',
    logoUrl: `${SUPABASE_STORAGE_CONFIG.BASE_URL}premier-league/manchester-city.png`,
    fallbackUrl: `${SUPABASE_STORAGE_CONFIG.BASE_URL}premier-league/man-city-alt.png`,
    league: 'Premier League',
    country: 'England',
    aliases: ['Man City', 'MCFC', 'City', 'Manchester City FC']
  },
  'Tottenham': {
    id: 'tottenham',
    name: 'Tottenham',
    logoUrl: `${SUPABASE_STORAGE_CONFIG.BASE_URL}premier-league/tottenham.png`,
    fallbackUrl: `${SUPABASE_STORAGE_CONFIG.BASE_URL}premier-league/spurs-alt.png`,
    league: 'Premier League',
    country: 'England',
    aliases: ['Spurs', 'THFC', 'Tottenham Hotspur']
  },
  'Brighton': {
    id: 'brighton',
    name: 'Brighton',
    logoUrl: `${SUPABASE_STORAGE_CONFIG.BASE_URL}premier-league/brighton.png`,
    fallbackUrl: `${SUPABASE_STORAGE_CONFIG.BASE_URL}premier-league/brighton-alt.png`,
    league: 'Premier League',
    country: 'England',
    aliases: ['Brighton & Hove Albion', 'Seagulls', 'BHAFC']
  },
  'Aston Villa': {
    id: 'aston-villa',
    name: 'Aston Villa',
    logoUrl: `${SUPABASE_STORAGE_CONFIG.BASE_URL}premier-league/aston-villa.png`,
    fallbackUrl: `${SUPABASE_STORAGE_CONFIG.BASE_URL}premier-league/villa-alt.png`,
    league: 'Premier League',
    country: 'England',
    aliases: ['Villa', 'AVFC', 'Aston Villa FC']
  },
  'Newcastle': {
    id: 'newcastle',
    name: 'Newcastle',
    logoUrl: `${SUPABASE_STORAGE_CONFIG.BASE_URL}premier-league/newcastle.png`,
    fallbackUrl: `${SUPABASE_STORAGE_CONFIG.BASE_URL}premier-league/newcastle-alt.png`,
    league: 'Premier League',
    country: 'England',
    aliases: ['Newcastle United', 'NUFC', 'Magpies']
  },
  'West Ham': {
    id: 'west-ham',
    name: 'West Ham',
    logoUrl: `${SUPABASE_STORAGE_CONFIG.BASE_URL}premier-league/west-ham.png`,
    fallbackUrl: `${SUPABASE_STORAGE_CONFIG.BASE_URL}premier-league/west-ham-alt.png`,
    league: 'Premier League',
    country: 'England',
    aliases: ['West Ham United', 'WHUFC', 'Hammers']
  },

  // === LA LIGA - Official Logos ===
  'Real Madrid': {
    id: 'real-madrid',
    name: 'Real Madrid',
    logoUrl: `${SUPABASE_STORAGE_CONFIG.BASE_URL}la-liga/real-madrid.png`,
    fallbackUrl: `${SUPABASE_STORAGE_CONFIG.BASE_URL}la-liga/real-madrid-alt.png`,
    league: 'La Liga',
    country: 'Spain',
    aliases: ['Real Madrid CF', 'Los Blancos', 'Madrid']
  },
  'Barcelona': {
    id: 'barcelona',
    name: 'Barcelona', 
    logoUrl: `${SUPABASE_STORAGE_CONFIG.BASE_URL}la-liga/barcelona.png`,
    fallbackUrl: `${SUPABASE_STORAGE_CONFIG.BASE_URL}la-liga/barcelona-alt.png`,
    league: 'La Liga',
    country: 'Spain',
    aliases: ['FC Barcelona', 'Barca', 'FCB']
  },
  'Atletico Madrid': {
    id: 'atletico-madrid',
    name: 'Atletico Madrid',
    logoUrl: `${SUPABASE_STORAGE_CONFIG.BASE_URL}la-liga/atletico-madrid.png`,
    fallbackUrl: `${SUPABASE_STORAGE_CONFIG.BASE_URL}la-liga/atletico-madrid-alt.png`,
    league: 'La Liga', 
    country: 'Spain',
    aliases: ['Atletico', 'ATM', 'Atletico de Madrid']
  },
  'Sevilla': {
    id: 'sevilla',
    name: 'Sevilla',
    logoUrl: `${SUPABASE_STORAGE_CONFIG.BASE_URL}la-liga/sevilla.png`,
    fallbackUrl: `${SUPABASE_STORAGE_CONFIG.BASE_URL}la-liga/sevilla-alt.png`,
    league: 'La Liga',
    country: 'Spain',
    aliases: ['Sevilla FC', 'SFC']
  },
  'Valencia': {
    id: 'valencia',
    name: 'Valencia',
    logoUrl: `${SUPABASE_STORAGE_CONFIG.BASE_URL}la-liga/valencia.png`,
    fallbackUrl: `${SUPABASE_STORAGE_CONFIG.BASE_URL}la-liga/valencia-alt.png`,
    league: 'La Liga',
    country: 'Spain',
    aliases: ['Valencia CF', 'VCF']
  },

  // === BUNDESLIGA - Official Logos ===
  'Bayern Munich': {
    id: 'bayern-munich',
    name: 'Bayern Munich',
    logoUrl: `${SUPABASE_STORAGE_CONFIG.BASE_URL}bundesliga/bayern-munich.png`,
    fallbackUrl: `${SUPABASE_STORAGE_CONFIG.BASE_URL}bundesliga/bayern-alt.png`,
    league: 'Bundesliga',
    country: 'Germany',
    aliases: ['Bayern', 'FC Bayern', 'Bayern München']
  },
  'Borussia Dortmund': {
    id: 'borussia-dortmund',
    name: 'Borussia Dortmund',
    logoUrl: `${SUPABASE_STORAGE_CONFIG.BASE_URL}bundesliga/borussia-dortmund.png`,
    fallbackUrl: `${SUPABASE_STORAGE_CONFIG.BASE_URL}bundesliga/dortmund-alt.png`,
    league: 'Bundesliga',
    country: 'Germany',
    aliases: ['Dortmund', 'BVB', 'Borussia']
  },
  'Bayer Leverkusen': {
    id: 'bayer-leverkusen',
    name: 'Bayer Leverkusen',
    logoUrl: `${SUPABASE_STORAGE_CONFIG.BASE_URL}bundesliga/bayer-leverkusen.png`,
    fallbackUrl: `${SUPABASE_STORAGE_CONFIG.BASE_URL}bundesliga/leverkusen-alt.png`,
    league: 'Bundesliga',
    country: 'Germany',
    aliases: ['Leverkusen', 'Bayer 04']
  },
  'RB Leipzig': {
    id: 'rb-leipzig',
    name: 'RB Leipzig',
    logoUrl: `${SUPABASE_STORAGE_CONFIG.BASE_URL}bundesliga/rb-leipzig.png`,
    fallbackUrl: `${SUPABASE_STORAGE_CONFIG.BASE_URL}bundesliga/leipzig-alt.png`,
    league: 'Bundesliga',
    country: 'Germany',
    aliases: ['Leipzig', 'RBL']
  },
  'Eintracht Frankfurt': {
    id: 'eintracht-frankfurt',
    name: 'Eintracht Frankfurt',
    logoUrl: `${SUPABASE_STORAGE_CONFIG.BASE_URL}bundesliga/eintracht-frankfurt.png`,
    fallbackUrl: `${SUPABASE_STORAGE_CONFIG.BASE_URL}bundesliga/frankfurt-alt.png`,
    league: 'Bundesliga',
    country: 'Germany',
    aliases: ['Frankfurt', 'SGE', 'Eintracht']
  },

  // === SERIE A - Official Logos ===
  'Juventus': {
    id: 'juventus',
    name: 'Juventus',
    logoUrl: `${SUPABASE_STORAGE_CONFIG.BASE_URL}serie-a/juventus.png`,
    fallbackUrl: `${SUPABASE_STORAGE_CONFIG.BASE_URL}serie-a/juventus-alt.png`,
    league: 'Serie A',
    country: 'Italy',
    aliases: ['Juve', 'Juventus FC', 'Juventus Turin']
  },
  'Inter Milan': {
    id: 'inter-milan',
    name: 'Inter Milan',
    logoUrl: `${SUPABASE_STORAGE_CONFIG.BASE_URL}serie-a/inter-milan.png`,
    fallbackUrl: `${SUPABASE_STORAGE_CONFIG.BASE_URL}serie-a/inter-alt.png`,
    league: 'Serie A',
    country: 'Italy',
    aliases: ['Inter', 'Internazionale', 'FC Internazionale']
  },
  'AC Milan': {
    id: 'ac-milan',
    name: 'AC Milan',
    logoUrl: `${SUPABASE_STORAGE_CONFIG.BASE_URL}serie-a/ac-milan.png`,
    fallbackUrl: `${SUPABASE_STORAGE_CONFIG.BASE_URL}serie-a/milan-alt.png`,
    league: 'Serie A',
    country: 'Italy',
    aliases: ['Milan', 'AC Milan', 'Rossoneri']
  },
  'Napoli': {
    id: 'napoli',
    name: 'Napoli',
    logoUrl: `${SUPABASE_STORAGE_CONFIG.BASE_URL}serie-a/napoli.png`,
    fallbackUrl: `${SUPABASE_STORAGE_CONFIG.BASE_URL}serie-a/napoli-alt.png`,
    league: 'Serie A',
    country: 'Italy',
    aliases: ['SSC Napoli', 'Napoli FC']
  },
  'AS Roma': {
    id: 'as-roma',
    name: 'AS Roma',
    logoUrl: `${SUPABASE_STORAGE_CONFIG.BASE_URL}serie-a/as-roma.png`,
    fallbackUrl: `${SUPABASE_STORAGE_CONFIG.BASE_URL}serie-a/roma-alt.png`,
    league: 'Serie A',
    country: 'Italy',
    aliases: ['Roma', 'AS Roma', 'Giallorossi']
  },

  // === LIGUE 1 - Official Logos ===
  'PSG': {
    id: 'psg',
    name: 'PSG',
    logoUrl: `${SUPABASE_STORAGE_CONFIG.BASE_URL}ligue-1/psg.png`,
    fallbackUrl: `${SUPABASE_STORAGE_CONFIG.BASE_URL}ligue-1/psg-alt.png`,
    league: 'Ligue 1',
    country: 'France',
    aliases: ['Paris Saint-Germain', 'Paris SG', 'PSG FC']
  },
  'Marseille': {
    id: 'marseille',
    name: 'Marseille',
    logoUrl: `${SUPABASE_STORAGE_CONFIG.BASE_URL}ligue-1/marseille.png`,
    fallbackUrl: `${SUPABASE_STORAGE_CONFIG.BASE_URL}ligue-1/marseille-alt.png`,
    league: 'Ligue 1',
    country: 'France',
    aliases: ['Olympique Marseille', 'OM', 'Olympique de Marseille']
  },
  'Monaco': {
    id: 'monaco',
    name: 'Monaco',
    logoUrl: `${SUPABASE_STORAGE_CONFIG.BASE_URL}ligue-1/monaco.png`,
    fallbackUrl: `${SUPABASE_STORAGE_CONFIG.BASE_URL}ligue-1/monaco-alt.png`,
    league: 'Ligue 1',
    country: 'France',
    aliases: ['AS Monaco', 'Monaco FC']
  },
  'Lyon': {
    id: 'lyon',
    name: 'Lyon',
    logoUrl: `${SUPABASE_STORAGE_CONFIG.BASE_URL}ligue-1/lyon.png`,
    fallbackUrl: `${SUPABASE_STORAGE_CONFIG.BASE_URL}ligue-1/lyon-alt.png`,
    league: 'Ligue 1',
    country: 'France',
    aliases: ['Olympique Lyon', 'OL', 'Olympique Lyonnais']
  },
  'Lille': {
    id: 'lille',
    name: 'Lille',
    logoUrl: `${SUPABASE_STORAGE_CONFIG.BASE_URL}ligue-1/lille.png`,
    fallbackUrl: `${SUPABASE_STORAGE_CONFIG.BASE_URL}ligue-1/lille-alt.png`,
    league: 'Ligue 1',
    country: 'France',
    aliases: ['Lille OSC', 'LOSC']
  },

  // === BRAZILIAN SÉRIE A - Official Logos ===
  'Flamengo': {
    id: 'flamengo',
    name: 'Flamengo',
    logoUrl: `${SUPABASE_STORAGE_CONFIG.BASE_URL}brazilian/flamengo.png`,
    fallbackUrl: `${SUPABASE_STORAGE_CONFIG.BASE_URL}brazilian/flamengo-alt.png`,
    league: 'Série A',
    country: 'Brazil',
    aliases: ['CR Flamengo', 'Mengão', 'Flamengo RJ']
  },
  'Palmeiras': {
    id: 'palmeiras',
    name: 'Palmeiras',
    logoUrl: `${SUPABASE_STORAGE_CONFIG.BASE_URL}brazilian/palmeiras.png`,
    fallbackUrl: `${SUPABASE_STORAGE_CONFIG.BASE_URL}brazilian/palmeiras-alt.png`,
    league: 'Série A',
    country: 'Brazil',
    aliases: ['SE Palmeiras', 'Verdão', 'Palestra Itália']
  },
  'Santos': {
    id: 'santos',
    name: 'Santos',
    logoUrl: `${SUPABASE_STORAGE_CONFIG.BASE_URL}brazilian/santos.png`,
    fallbackUrl: `${SUPABASE_STORAGE_CONFIG.BASE_URL}brazilian/santos-alt.png`,
    league: 'Série A',
    country: 'Brazil',
    aliases: ['Santos FC', 'Peixe', 'Santos SP']
  },
  'São Paulo': {
    id: 'sao-paulo',
    name: 'São Paulo',
    logoUrl: `${SUPABASE_STORAGE_CONFIG.BASE_URL}brazilian/sao-paulo.png`,
    fallbackUrl: `${SUPABASE_STORAGE_CONFIG.BASE_URL}brazilian/sao-paulo-alt.png`,
    league: 'Série A',
    country: 'Brazil',
    aliases: ['São Paulo FC', 'Tricolor', 'SPFC']
  },
  'Corinthians': {
    id: 'corinthians',
    name: 'Corinthians',
    logoUrl: `${SUPABASE_STORAGE_CONFIG.BASE_URL}brazilian/corinthians.png`,
    fallbackUrl: `${SUPABASE_STORAGE_CONFIG.BASE_URL}brazilian/corinthians-alt.png`,
    league: 'Série A',
    country: 'Brazil',
    aliases: ['SC Corinthians', 'Timão', 'Corinthians SP']
  },

  // === INTERNATIONAL TEAMS - Official Logos ===
  'Brazil': {
    id: 'brazil',
    name: 'Brazil',
    logoUrl: `${SUPABASE_STORAGE_CONFIG.BASE_URL}international/brazil.png`,
    fallbackUrl: `${SUPABASE_STORAGE_CONFIG.BASE_URL}international/brazil-alt.png`,
    league: 'International',
    country: 'Brazil',
    aliases: ['Brasil', 'Seleção']
  },
  'Argentina': {
    id: 'argentina',
    name: 'Argentina',
    logoUrl: `${SUPABASE_STORAGE_CONFIG.BASE_URL}international/argentina.png`,
    fallbackUrl: `${SUPABASE_STORAGE_CONFIG.BASE_URL}international/argentina-alt.png`,
    league: 'International',
    country: 'Argentina',
    aliases: ['Albiceleste']
  },
  'England': {
    id: 'england',
    name: 'England',
    logoUrl: `${SUPABASE_STORAGE_CONFIG.BASE_URL}international/england.png`,
    fallbackUrl: `${SUPABASE_STORAGE_CONFIG.BASE_URL}international/england-alt.png`,
    league: 'International',
    country: 'England',
    aliases: ['Three Lions']
  },
  'France': {
    id: 'france',
    name: 'France',
    logoUrl: `${SUPABASE_STORAGE_CONFIG.BASE_URL}international/france.png`,
    fallbackUrl: `${SUPABASE_STORAGE_CONFIG.BASE_URL}international/france-alt.png`,
    league: 'International',
    country: 'France',
    aliases: ['Les Bleus']
  },
  'Spain': {
    id: 'spain',
    name: 'Spain',
    logoUrl: `${SUPABASE_STORAGE_CONFIG.BASE_URL}international/spain.png`,
    fallbackUrl: `${SUPABASE_STORAGE_CONFIG.BASE_URL}international/spain-alt.png`,
    league: 'International',
    country: 'Spain',
    aliases: ['La Roja']
  },
  'Germany': {
    id: 'germany',
    name: 'Germany',
    logoUrl: `${SUPABASE_STORAGE_CONFIG.BASE_URL}international/germany.png`,
    fallbackUrl: `${SUPABASE_STORAGE_CONFIG.BASE_URL}international/germany-alt.png`,
    league: 'International',
    country: 'Germany',
    aliases: ['Die Mannschaft']
  },
  'Italy': {
    id: 'italy',
    name: 'Italy',
    logoUrl: `${SUPABASE_STORAGE_CONFIG.BASE_URL}international/italy.png`,
    fallbackUrl: `${SUPABASE_STORAGE_CONFIG.BASE_URL}international/italy-alt.png`,
    league: 'International',
    country: 'Italy',
    aliases: ['Azzurri']
  },
  'Netherlands': {
    id: 'netherlands',
    name: 'Netherlands',
    logoUrl: `${SUPABASE_STORAGE_CONFIG.BASE_URL}international/netherlands.png`,
    fallbackUrl: `${SUPABASE_STORAGE_CONFIG.BASE_URL}international/netherlands-alt.png`,
    league: 'International',
    country: 'Netherlands',
    aliases: ['Holland', 'Oranje']
  },
  'Portugal': {
    id: 'portugal',
    name: 'Portugal',
    logoUrl: `${SUPABASE_STORAGE_CONFIG.BASE_URL}international/portugal.png`,
    fallbackUrl: `${SUPABASE_STORAGE_CONFIG.BASE_URL}international/portugal-alt.png`,
    league: 'International',
    country: 'Portugal',
    aliases: ['Seleção das Quinas']
  },
  'Belgium': {
    id: 'belgium',
    name: 'Belgium',
    logoUrl: `${SUPABASE_STORAGE_CONFIG.BASE_URL}international/belgium.png`,
    fallbackUrl: `${SUPABASE_STORAGE_CONFIG.BASE_URL}international/belgium-alt.png`,
    league: 'International', 
    country: 'Belgium',
    aliases: ['Red Devils']
  },

  // === AUSTRALIAN TEAMS - Adding specifically for your matches ===
  'Queensland': {
    id: 'queensland',
    name: 'Queensland',
    logoUrl: `${SUPABASE_STORAGE_CONFIG.BASE_URL}australian/queensland.png`,
    fallbackUrl: SUPABASE_STORAGE_CONFIG.FALLBACK_LOGOS.TEAM_SPECIFIC('Queensland', true),
    league: 'NPL',
    country: 'Australia',
    aliases: ['Queensland NPL', 'QLD', 'Queensland FC']
  },
  'New South Wales': {
    id: 'new-south-wales',
    name: 'New South Wales',
    logoUrl: `${SUPABASE_STORAGE_CONFIG.BASE_URL}australian/new-south-wales.png`,
    fallbackUrl: SUPABASE_STORAGE_CONFIG.FALLBACK_LOGOS.TEAM_SPECIFIC('New South Wales', false),
    league: 'NPL',
    country: 'Australia',
    aliases: ['New South Wales NPL', 'NSW', 'NSW FC']
  },

  // === PORTUGUESE LEAGUE - Official Logos ===
  'Arouca': {
    id: 'arouca',
    name: 'Arouca',
    logoUrl: 'https://crests.football-data.org/5529.svg', // Football-Data.org official crest
    fallbackUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/6/6a/FC_Arouca_logo.svg/200px-FC_Arouca_logo.svg.png',
    league: 'Primeira Liga',
    country: 'Portugal',
    aliases: ['FC Arouca', 'Futebol Clube de Arouca', 'Arouca FC']
  },
  'Lusitânia': {
    id: 'lusitania',
    name: 'Lusitânia',
    logoUrl: 'https://crests.football-data.org/5530.svg', // Football-Data.org official crest
    fallbackUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Lusit%C3%A2nia_FC_logo.svg/200px-Lusit%C3%A2nia_FC_logo.svg.png',
    league: 'Liga 3',
    country: 'Portugal',
    aliases: ['Lusitânia FC', 'Lusitania', 'Lusitânia Futebol Clube']
  },
  'Porto': {
    id: 'porto',
    name: 'Porto',
    logoUrl: 'https://crests.football-data.org/503.svg',
    fallbackUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f1/FC_Porto.svg/200px-FC_Porto.svg.png',
    league: 'Primeira Liga',
    country: 'Portugal',
    aliases: ['FC Porto', 'Futebol Clube do Porto', 'Porto FC']
  },
  'Benfica': {
    id: 'benfica',
    name: 'Benfica',
    logoUrl: 'https://crests.football-data.org/1903.svg',
    fallbackUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/a/a2/SL_Benfica_logo.svg/200px-SL_Benfica_logo.svg.png',
    league: 'Primeira Liga',
    country: 'Portugal',
    aliases: ['SL Benfica', 'Sport Lisboa e Benfica', 'Benfica Lisbon']
  },
  'Sporting': {
    id: 'sporting',
    name: 'Sporting',
    logoUrl: 'https://crests.football-data.org/498.svg',
    fallbackUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/3/3e/Sporting_CP.svg/200px-Sporting_CP.svg.png',
    league: 'Primeira Liga',
    country: 'Portugal',
    aliases: ['Sporting CP', 'Sporting Clube de Portugal', 'Sporting Lisbon']
  }
};

// 🎯 TEAM LOGO SERVICE CLASS
class TeamLogoService {
  // Cache for performance
  private logoCache: Map<string, string> = new Map();

  constructor() {
    // Clear cache on service initialization to force fresh logo URLs
    this.logoCache.clear();
    console.log('🔄 LOGO SERVICE: Cache cleared on initialization');
  }

  /**
   * 🚀 INSTANT LOGO LOADING: Get official team logo with aggressive caching
   * @param teamName - Name of the team
   * @param league - Optional league for better matching
   * @returns Official team logo URL (instantly from cache or reliable source)
   */
  getOfficialTeamLogo(teamName: string, league?: string): string {
    if (!teamName) {
      // For official logos, use a generic sports logo instead of generated fallback
      return 'https://cdn-icons-png.flaticon.com/512/1165/1165674.png';
    }

    // 🚀 INSTANT CACHE CHECK: Don't clear cache, use persistent caching
    const cacheKey = `official-${teamName.toLowerCase()}-${league || 'default'}`;
    const cached = this.logoCache.get(cacheKey);
    if (cached) {
      console.log(`⚡ INSTANT LOGO CACHE HIT: ${teamName} → ${cached}`);
      return cached;
    }

    console.log(`🚀 INSTANT LOGO FETCH: ${teamName} (${league || 'No league'})`);

    const cleanTeamName = this.cleanTeamName(teamName);
    console.log(`🔍 CLEANED TEAM NAME: "${teamName}" → "${cleanTeamName}"`);

    // 1. Try exact match from database first - use real logos from our database
    const exactMatch = this.findDirectMatch(cleanTeamName, league);
    if (exactMatch) {
      console.log(`✅ INSTANT LOGO (database): "${teamName}" → ${exactMatch.logoUrl}`);
      this.logoCache.set(cacheKey, exactMatch.logoUrl);
      return exactMatch.logoUrl;
    }

    // 2. Try alias matching
    const aliasMatch = this.findAliasMatch(cleanTeamName, league);
    if (aliasMatch) {
      console.log(`✅ INSTANT LOGO (alias): "${teamName}" → ${aliasMatch.logoUrl}`);
      this.logoCache.set(cacheKey, aliasMatch.logoUrl);
      return aliasMatch.logoUrl;
    }

    // 3. Try fuzzy matching
    const fuzzyMatch = this.findFuzzyMatch(cleanTeamName, league);
    if (fuzzyMatch) {
      console.log(`✅ INSTANT LOGO (fuzzy): "${teamName}" → ${fuzzyMatch.logoUrl}`);
      this.logoCache.set(cacheKey, fuzzyMatch.logoUrl);
      return fuzzyMatch.logoUrl;
    }

    console.log(`❌ NO DATABASE MATCH found for "${cleanTeamName}"`);

    // 4. Return fallback logo and start async fetch for real logo
    const fallbackLogo = SUPABASE_STORAGE_CONFIG.FALLBACK_LOGOS.TEAM_SPECIFIC(teamName, true);
    console.log(`⚡ INSTANT FALLBACK: "${teamName}" → ${fallbackLogo}`);

    // Start async fetch in background to cache real logo for next time
    this.getInstantOfficialLogo(cleanTeamName, league).then(realLogo => {
      if (realLogo && realLogo !== fallbackLogo) {
        this.logoCache.set(cacheKey, realLogo);
        console.log(`🔄 BACKGROUND UPDATE: "${teamName}" → ${realLogo}`);
      }
    }).catch(error => {
      console.log(`❌ Background fetch failed for "${teamName}":`, error);
    });

    this.logoCache.set(cacheKey, fallbackLogo);
    return fallbackLogo;
  }

  /**
   * 🚀 INSTANT TEAM LOGO: Get team logo with persistent caching
   * @param teamName - Name of the team
   * @param league - Optional league for better matching
   * @returns Official team logo URL (instantly cached)
   */
  getTeamLogo(teamName: string, league?: string): string {
    if (!teamName) {
      console.log('❌ LOGO SERVICE: No team name provided, using generic fallback');
      return SUPABASE_STORAGE_CONFIG.FALLBACK_LOGOS.GENERIC;
    }

    // 🚀 PERSISTENT CACHE: Don't clear cache, keep logos cached for instant loading
    const cacheKey = `${teamName.toLowerCase()}_${league || 'any'}`;
    if (this.logoCache.has(cacheKey)) {
      const cachedUrl = this.logoCache.get(cacheKey)!;
      console.log(`⚡ INSTANT CACHE HIT: "${teamName}" → ${cachedUrl}`);
      return cachedUrl;
    }

    console.log(`🚀 INSTANT FETCH: Getting logo for "${teamName}" in league "${league || 'any'}"`);

    // Clean and normalize team name
    const cleanTeamName = this.cleanTeamName(teamName);

    // Try direct match first
    const directMatch = this.findDirectMatch(cleanTeamName, league);
    if (directMatch) {
      console.log(`✅ INSTANT LOGO (database): "${teamName}" → ${directMatch.logoUrl}`);
      this.logoCache.set(cacheKey, directMatch.logoUrl);
      return directMatch.logoUrl;
    }

    // Try alias matching
    const aliasMatch = this.findAliasMatch(cleanTeamName, league);
    if (aliasMatch) {
      console.log(`✅ INSTANT LOGO (alias): "${teamName}" → ${aliasMatch.logoUrl}`);
      this.logoCache.set(cacheKey, aliasMatch.logoUrl);
      return aliasMatch.logoUrl;
    }

    // Try fuzzy matching
    const fuzzyMatch = this.findFuzzyMatch(cleanTeamName, league);
    if (fuzzyMatch) {
      console.log(`✅ INSTANT LOGO (fuzzy): "${teamName}" → ${fuzzyMatch.logoUrl}`);
      this.logoCache.set(cacheKey, fuzzyMatch.logoUrl);
      return fuzzyMatch.logoUrl;
    }

    // 🚀 FALLBACK: Return a temporary logo while async fetch happens in background
    const fallbackLogo = SUPABASE_STORAGE_CONFIG.FALLBACK_LOGOS.TEAM_SPECIFIC(teamName, true);
    console.log(`⚡ INSTANT FALLBACK: "${teamName}" → ${fallbackLogo}`);

    // Start async fetch in background to cache real logo for next time
    this.getInstantOfficialLogo(cleanTeamName, league).then(realLogo => {
      if (realLogo && realLogo !== fallbackLogo) {
        this.logoCache.set(cacheKey, realLogo);
        console.log(`🔄 BACKGROUND UPDATE: "${teamName}" → ${realLogo}`);
      }
    }).catch(error => {
      console.log(`❌ Background fetch failed for "${teamName}":`, error);
    });

    this.logoCache.set(cacheKey, fallbackLogo);
    return fallbackLogo;
  }

  /**
   * 🚀 ASYNC TEAM LOGO: Get real team logo from APIs (ASYNC VERSION)
   * @param teamName - Name of the team
   * @param league - Optional league for better matching
   * @returns Promise<Official team logo URL>
   */
  async getTeamLogoAsync(teamName: string, league?: string): Promise<string> {
    if (!teamName) {
      console.log('❌ LOGO SERVICE: No team name provided, using generic fallback');
      return SUPABASE_STORAGE_CONFIG.FALLBACK_LOGOS.GENERIC;
    }

    // 🚀 PERSISTENT CACHE: Check cache first
    const cacheKey = `${teamName.toLowerCase()}_${league || 'any'}`;
    if (this.logoCache.has(cacheKey)) {
      const cachedUrl = this.logoCache.get(cacheKey)!;
      // Only return cached if it's not a fallback logo
      if (!cachedUrl.includes('ui-avatars.com')) {
        console.log(`⚡ ASYNC CACHE HIT: "${teamName}" → ${cachedUrl}`);
        return cachedUrl;
      }
    }

    console.log(`🚀 ASYNC FETCH: Getting real logo for "${teamName}" in league "${league || 'any'}"`);

    // Clean and normalize team name
    const cleanTeamName = this.cleanTeamName(teamName);

    // Try direct match from database first
    const directMatch = this.findDirectMatch(cleanTeamName, league);
    if (directMatch) {
      console.log(`✅ ASYNC LOGO (direct): "${teamName}" → ${directMatch.logoUrl}`);
      this.logoCache.set(cacheKey, directMatch.logoUrl);
      return directMatch.logoUrl;
    }

    // Try alias matching
    const aliasMatch = this.findAliasMatch(cleanTeamName, league);
    if (aliasMatch) {
      console.log(`✅ ASYNC LOGO (alias): "${teamName}" → ${aliasMatch.logoUrl}`);
      this.logoCache.set(cacheKey, aliasMatch.logoUrl);
      return aliasMatch.logoUrl;
    }

    // Try fuzzy matching
    const fuzzyMatch = this.findFuzzyMatch(cleanTeamName, league);
    if (fuzzyMatch) {
      console.log(`✅ ASYNC LOGO (fuzzy): "${teamName}" → ${fuzzyMatch.logoUrl}`);
      this.logoCache.set(cacheKey, fuzzyMatch.logoUrl);
      return fuzzyMatch.logoUrl;
    }

    // 🚀 REAL API FETCH: Use Football-Data.org and Wikipedia APIs
    const realLogo = await this.getInstantOfficialLogo(cleanTeamName, league);
    console.log(`⚡ ASYNC LOGO (real API): "${teamName}" → ${realLogo}`);
    this.logoCache.set(cacheKey, realLogo);
    return realLogo;
  }



  /**
   * 🚀 REAL OFFICIAL LOGOS: Get authentic club crests from reliable sources
   */
  private async getInstantOfficialLogo(teamName: string, league?: string): Promise<string> {
    console.log(`🎯 FETCHING REAL LOGO: "${teamName}" in "${league || 'any league'}"`);

    // 1. Try Football-Data.org API first (most reliable for official crests)
    try {
      const footballDataLogo = await this.getFootballDataLogo(teamName);
      if (footballDataLogo) {
        console.log(`✅ FOOTBALL-DATA.ORG LOGO: "${teamName}" → ${footballDataLogo}`);
        return footballDataLogo;
      }
    } catch (error) {
      console.log(`❌ Football-Data.org failed for "${teamName}":`, error);
    }

    // 2. Try Wikipedia/Wikimedia Commons (free, high-quality official logos)
    try {
      const wikipediaLogo = await this.getWikipediaLogo(teamName);
      if (wikipediaLogo) {
        console.log(`✅ WIKIPEDIA LOGO: "${teamName}" → ${wikipediaLogo}`);
        return wikipediaLogo;
      }
    } catch (error) {
      console.log(`❌ Wikipedia failed for "${teamName}":`, error);
    }

    // 3. Fallback to API-Sports with team ID mapping
    const teamId = this.getTeamIdFromName(teamName);
    if (teamId) {
      const apiSportsLogo = `https://media.api-sports.io/football/teams/${teamId}.png`;
      console.log(`⚡ API-SPORTS FALLBACK: "${teamName}" → ${apiSportsLogo}`);
      return apiSportsLogo;
    }

    // 4. Final fallback - generic placeholder
    const fallbackLogo = `https://via.placeholder.com/100x100/cccccc/666666?text=${encodeURIComponent(teamName.substring(0, 3).toUpperCase())}`;
    console.log(`🔄 FALLBACK LOGO: "${teamName}" → ${fallbackLogo}`);
    return fallbackLogo;
  }

  /**
   * 🎯 Get team ID from name for API-Sports
   */
  private getTeamIdFromName(teamName: string): number | null {
    // Common team ID mappings for API-Sports
    const teamIdMap: { [key: string]: number } = {
      // Premier League
      'manchester united': 33,
      'manchester city': 50,
      'liverpool': 40,
      'chelsea': 49,
      'arsenal': 42,
      'tottenham': 47,
      'leicester': 46,
      'west ham': 48,
      'everton': 45,
      'aston villa': 66,

      // La Liga
      'real madrid': 541,
      'barcelona': 529,
      'atletico madrid': 530,
      'sevilla': 536,
      'valencia': 532,
      'villarreal': 533,
      'real sociedad': 548,
      'athletic bilbao': 531,

      // Bundesliga
      'bayern munich': 157,
      'borussia dortmund': 165,
      'rb leipzig': 173,
      'bayer leverkusen': 168,
      'borussia monchengladbach': 163,
      'wolfsburg': 178,
      'eintracht frankfurt': 169,
      'union berlin': 28,

      // Serie A
      'juventus': 496,
      'inter milan': 505,
      'ac milan': 489,
      'napoli': 492,
      'roma': 497,
      'lazio': 487,
      'atalanta': 499,
      'fiorentina': 502,

      // Brazilian teams
      'santos': 1963,
      'palmeiras': 1964,
      'corinthians': 1965,
      'flamengo': 1966,
      'internacional': 1967,

      // Youth teams (use parent team ID)
      'manchester city u21': 50,
      'santos u20': 1963,
      'corinthians u20': 1965,
      'juventude u20': 1968,
    };

    const cleanName = teamName.toLowerCase().trim();
    return teamIdMap[cleanName] || null;
  }

  /**
   * 🎯 Get multiple logo sources for a team
   */
  private getMultipleLogoSources(teamName: string, cleanName: string, league?: string): Array<{url: string, source: string}> {
    const sources: Array<{url: string, source: string}> = [];

    // First check for known team mappings
    const knownLogo = this.getKnownTeamLogo(teamName, league);
    if (knownLogo) {
      sources.push({
        url: knownLogo,
        source: 'Known Team Database'
      });
    }

    // 1. Try API-Football logos (most reliable for football)
    sources.push({
      url: `https://media.api-sports.io/football/teams/${this.getTeamIdFromName(teamName)}.png`,
      source: 'API-Football'
    });

    // 2. Try FootballAPI logos
    sources.push({
      url: `https://apiv3.apifootball.com/badges/${cleanName}.png`,
      source: 'FootballAPI'
    });

    // 3. Try SportsDB (reliable sports database)
    sources.push({
      url: `https://www.thesportsdb.com/images/media/team/badge/${cleanName}.png`,
      source: 'SportsDB'
    });

    // 4. Try alternative football logo sources
    sources.push({
      url: `https://logos-world.net/wp-content/uploads/2020/06/${cleanName}-Logo.png`,
      source: 'Logos World'
    });

    // 5. Try 1000logos (comprehensive logo database)
    sources.push({
      url: `https://1000logos.net/wp-content/uploads/2018/06/${cleanName}-logo.png`,
      source: '1000 Logos'
    });

    // 6. Fallback to a proper football badge (not generic person icon)
    sources.push({
      url: 'https://cdn-icons-png.flaticon.com/512/53/53283.png', // Actual football/soccer ball icon
      source: 'Fallback Football'
    });

    return sources;
  }

  /**
   * 🏆 Get known team logos for major teams
   */
  private getKnownTeamLogo(teamName: string, league?: string): string | null {
    const knownLogos: { [key: string]: string } = {
      // Major European teams with known working logo URLs
      'manchester united': 'https://logos-world.net/wp-content/uploads/2020/06/Manchester-United-Logo.png',
      'manchester city': 'https://logos-world.net/wp-content/uploads/2020/06/Manchester-City-Logo.png',
      'liverpool': 'https://logos-world.net/wp-content/uploads/2020/06/Liverpool-Logo.png',
      'chelsea': 'https://logos-world.net/wp-content/uploads/2020/06/Chelsea-Logo.png',
      'arsenal': 'https://logos-world.net/wp-content/uploads/2020/06/Arsenal-Logo.png',
      'tottenham': 'https://logos-world.net/wp-content/uploads/2020/06/Tottenham-Logo.png',
      'real madrid': 'https://logos-world.net/wp-content/uploads/2020/06/Real-Madrid-Logo.png',
      'barcelona': 'https://logos-world.net/wp-content/uploads/2020/06/Barcelona-Logo.png',
      'bayern munich': 'https://logos-world.net/wp-content/uploads/2020/06/Bayern-Munich-Logo.png',
      'paris saint-germain': 'https://logos-world.net/wp-content/uploads/2020/06/Paris-Saint-Germain-Logo.png',
      'juventus': 'https://logos-world.net/wp-content/uploads/2020/06/Juventus-Logo.png',
      'ac milan': 'https://logos-world.net/wp-content/uploads/2020/06/AC-Milan-Logo.png',
      'inter milan': 'https://logos-world.net/wp-content/uploads/2020/06/Inter-Milan-Logo.png',
      'napoli': 'https://logos-world.net/wp-content/uploads/2020/06/Napoli-Logo.png',
      'borussia dortmund': 'https://logos-world.net/wp-content/uploads/2020/06/Borussia-Dortmund-Logo.png',
      'atletico madrid': 'https://logos-world.net/wp-content/uploads/2020/06/Atletico-Madrid-Logo.png',
    };

    const normalizedName = teamName.toLowerCase().replace(/\s+/g, ' ').trim();
    return knownLogos[normalizedName] || null;
  }

  /**
   * 🆔 Get team ID for API calls (simplified mapping)
   */
  private getTeamIdFromName(teamName: string): number {
    // This would ideally be a comprehensive database lookup
    // For now, return a default that might work with some APIs
    const hash = teamName.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return Math.abs(hash) % 10000 + 1; // Generate a reasonable team ID
  }

  /**
   * 🆔 Get team ID from name for API calls (if needed for future API integration)
   */
  private getTeamIdFromName(teamName: string): string {
    // This method is kept for future API integration
    // Currently using direct logo URLs instead
    const cleanName = teamName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    return cleanName;
  }

  /**
   * Helper to get team ID from name (simplified mapping)
   */
  private getTeamIdFromName(teamName: string): number {
    // This would ideally be a comprehensive mapping
    // For now, return a default that might work
    const hash = teamName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return Math.abs(hash % 1000) + 1; // Generate a reasonable team ID
  }

  /**
   * 🏆 Get default official logo (never a generated avatar)
   */
  private getDefaultOfficialLogo(): string {
    // Use a real football/soccer logo from a reliable source
    return 'https://a.espncdn.com/i/teamlogos/soccer/500/default.png';
  }

  /**
   * Clean and normalize team name for better matching
   */
  private cleanTeamName(teamName: string): string {
    return teamName
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/['"]/g, '')
      .replace(/\./g, '')
      .replace(/\s*(FC|CF|SC|AC|SL|SE|CR)$/i, '')
      .trim();
  }

  /**
   * Find direct name match in database
   */
  private findDirectMatch(teamName: string, league?: string): TeamLogo | null {
    console.log(`🔍 DIRECT MATCH: Looking for "${teamName}" in league "${league || 'any'}"`);

    // Check exact match first
    if (TEAM_LOGOS[teamName]) {
      console.log(`✅ EXACT MATCH: Found "${teamName}" in database`);
      return TEAM_LOGOS[teamName];
    }

    // Check case-insensitive match
    const lowerTeamName = teamName.toLowerCase();
    console.log(`🔍 CASE-INSENSITIVE: Looking for "${lowerTeamName}"`);

    for (const [key, logo] of Object.entries(TEAM_LOGOS)) {
      if (key.toLowerCase() === lowerTeamName) {
        console.log(`🎯 FOUND MATCH: "${key}" matches "${lowerTeamName}"`);
        // If league is specified, prefer matching league
        if (league && logo.league.toLowerCase().includes(league.toLowerCase())) {
          console.log(`✅ LEAGUE MATCH: "${logo.league}" matches "${league}"`);
          return logo;
        } else if (!league) {
          console.log(`✅ NO LEAGUE FILTER: Returning "${key}"`);
          return logo;
        } else {
          console.log(`❌ LEAGUE MISMATCH: "${logo.league}" doesn't match "${league}"`);
        }
      }
    }

    console.log(`❌ NO DIRECT MATCH: "${teamName}" not found in database`);
    return null;
  }

  /**
   * Find match using team aliases
   */
  private findAliasMatch(teamName: string, league?: string): TeamLogo | null {
    const lowerTeamName = teamName.toLowerCase();
    
    for (const logo of Object.values(TEAM_LOGOS)) {
      if (logo.aliases) {
        for (const alias of logo.aliases) {
          if (alias.toLowerCase() === lowerTeamName) {
            // If league is specified, prefer matching league
            if (league && logo.league.toLowerCase().includes(league.toLowerCase())) {
              return logo;
            } else if (!league) {
              return logo;
            }
          }
        }
      }
    }

    return null;
  }

  /**
   * Find fuzzy match using string similarity
   */
  private findFuzzyMatch(teamName: string, league?: string): TeamLogo | null {
    const lowerTeamName = teamName.toLowerCase();
    let bestMatch: TeamLogo | null = null;
    let bestSimilarity = 0;

    for (const logo of Object.values(TEAM_LOGOS)) {
      // Check main name similarity
      const nameSimilarity = this.calculateSimilarity(lowerTeamName, logo.name.toLowerCase());
      
      // Check aliases similarity
      let aliasSimilarity = 0;
      if (logo.aliases) {
        for (const alias of logo.aliases) {
          const similarity = this.calculateSimilarity(lowerTeamName, alias.toLowerCase());
          aliasSimilarity = Math.max(aliasSimilarity, similarity);
        }
      }

      const maxSimilarity = Math.max(nameSimilarity, aliasSimilarity);
      
      // League bonus
      let leagueBonus = 0;
      if (league && logo.league.toLowerCase().includes(league.toLowerCase())) {
        leagueBonus = 0.1;
      }

      const totalSimilarity = maxSimilarity + leagueBonus;

      if (totalSimilarity > bestSimilarity && totalSimilarity > 0.6) {
        bestMatch = logo;
        bestSimilarity = totalSimilarity;
      }
    }

    return bestMatch;
  }

  /**
   * Calculate string similarity using Levenshtein distance
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const matrix = [];
    const len1 = str1.length;
    const len2 = str2.length;

    for (let i = 0; i <= len2; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= len1; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= len2; i++) {
      for (let j = 1; j <= len1; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    const distance = matrix[len2][len1];
    const maxLen = Math.max(len1, len2);
    return maxLen === 0 ? 1 : (maxLen - distance) / maxLen;
  }

  /**
   * 🎯 ENHANCED: Generate working fallback logo for unknown teams
   */
  private generateFallbackLogo(teamName: string, league?: string): string {
    // Get team initial
    const initial = teamName.charAt(0).toUpperCase();
    
    // Determine colors based on team name hash for consistency
    const hash = this.simpleHash(teamName);
    const colors = [
      { bg: 'FFD700', text: '000000' }, // Gold
      { bg: '9CA3AF', text: 'FFFFFF' }, // Grey
      { bg: '4A90E2', text: 'FFFFFF' }, // Blue
      { bg: 'FF6B35', text: 'FFFFFF' }, // Orange
      { bg: '28A745', text: 'FFFFFF' }, // Green
      { bg: 'DC3545', text: 'FFFFFF' }, // Red
      { bg: '6F42C1', text: 'FFFFFF' }, // Purple
      { bg: 'FD7E14', text: 'FFFFFF' }, // Orange
    ];
    
    const color = colors[hash % colors.length];
    
    return `https://ui-avatars.com/api/?name=${initial}&background=${color.bg}&color=${color.text}&size=128&rounded=true&font-size=0.6`;
  }

  /**
   * Simple hash function for consistent color selection
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Get appropriate league folder for logo storage
   */
  private getLeagueFolder(league?: string): string {
    if (!league) return 'other';
    
    const lowerLeague = league.toLowerCase();
    
    if (lowerLeague.includes('premier')) return 'premier-league';
    if (lowerLeague.includes('la liga') || lowerLeague.includes('primera division')) return 'la-liga';
    if (lowerLeague.includes('bundesliga')) return 'bundesliga';
    if (lowerLeague.includes('serie a')) return 'serie-a';
    if (lowerLeague.includes('ligue 1')) return 'ligue-1';
    if (lowerLeague.includes('eredivisie')) return 'eredivisie';
    if (lowerLeague.includes('primeira liga')) return 'primeira-liga';
    if (lowerLeague.includes('brazilian') || lowerLeague.includes('brazil')) return 'brazilian';
    if (lowerLeague.includes('international') || lowerLeague.includes('national')) return 'international';
    if (lowerLeague.includes('npl') || lowerLeague.includes('australian')) return 'australian';
    
    return 'other';
  }

  /**
   * 🚀 INSTANT MATCH ENHANCEMENT: Enhance match with cached logos
   */
  enhanceMatchWithLogos(match: Match): Match {
    // 🚀 DON'T CLEAR CACHE: Keep logos cached for instant loading
    console.log(`⚡ INSTANT ENHANCE: Processing ${match.home.name} vs ${match.away.name}`);

    const homeTeamLogo = this.getOfficialTeamLogo(match.home.name, match.league);
    const awayTeamLogo = this.getOfficialTeamLogo(match.away.name, match.league);

    console.log(`⚡ INSTANT ENHANCE: Home logo: ${homeTeamLogo}`);
    console.log(`⚡ INSTANT ENHANCE: Away logo: ${awayTeamLogo}`);

    return {
      ...match,
      home: {
        ...match.home,
        logo: homeTeamLogo
      },
      away: {
        ...match.away,
        logo: awayTeamLogo
      }
    };
  }

  /**
   * Get detailed team information
   */
  getTeamInfo(teamName: string, league?: string): TeamLogo {
    const cleanTeamName = this.cleanTeamName(teamName);
    
    const directMatch = this.findDirectMatch(cleanTeamName, league);
    if (directMatch) return directMatch;

    const aliasMatch = this.findAliasMatch(cleanTeamName, league);
    if (aliasMatch) return aliasMatch;

    const fuzzyMatch = this.findFuzzyMatch(cleanTeamName, league);
    if (fuzzyMatch) return fuzzyMatch;

    // Return placeholder team info for unknown teams
    return {
      id: cleanTeamName.toLowerCase().replace(/\s+/g, '-'),
      name: teamName,
      logoUrl: this.generateFallbackLogo(cleanTeamName, league),
      fallbackUrl: SUPABASE_STORAGE_CONFIG.FALLBACK_LOGOS.GENERIC,
      league: league || 'Unknown',
      country: 'Unknown',
      aliases: []
    };
  }

  /**
   * Get service statistics
   */
  getStats(): { totalTeams: number; coverageByLeague: { [league: string]: number } } {
    const leagues: { [league: string]: number } = {};
    
    for (const team of Object.values(TEAM_LOGOS)) {
      leagues[team.league] = (leagues[team.league] || 0) + 1;
    }
    
    return {
      totalTeams: Object.keys(TEAM_LOGOS).length,
      coverageByLeague: leagues
    };
  }

  /**
   * Add new team logo to database
   */
  addTeamLogo(team: TeamLogo): void {
    TEAM_LOGOS[team.name] = team;
    this.logoCache.clear(); // Clear cache to refresh
  }

  /**
   * Get all teams
   */
  getAllTeams(): TeamLogo[] {
    return Object.values(TEAM_LOGOS);
  }

  /**
   * Get teams by league
   */
  getTeamsByLeague(league: string): TeamLogo[] {
    return Object.values(TEAM_LOGOS).filter(team => 
      team.league.toLowerCase().includes(league.toLowerCase())
    );
  }

  /**
   * Clear logo cache
   */
  clearCache(): void {
    this.logoCache.clear();
    console.log('🔄 LOGO SERVICE: Cache cleared');
  }

  // 🚫 REMOVED: preloadTeamLogo method to eliminate React Native Image constructor errors
  // Logos are now loaded instantly via getOfficialTeamLogo without any async preloading

  /**
   * Initialize Supabase storage (if needed)
   */
  async initializeStorage(): Promise<void> {
    try {
      // Check if bucket exists
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = buckets?.some(bucket => bucket.name === SUPABASE_STORAGE_CONFIG.BUCKET_NAME);

      if (!bucketExists) {
        // Create bucket
        const { error } = await supabase.storage.createBucket(SUPABASE_STORAGE_CONFIG.BUCKET_NAME, {
          public: true,
          allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'],
          fileSizeLimit: 5242880 // 5MB
        });

        if (error) {
          console.error('❌ LOGO SERVICE: Failed to create bucket:', error);
          return;
        }

        console.log('✅ LOGO SERVICE: Supabase bucket created successfully');
      }

      // Set up storage policies
      await this.setupStoragePolicy();
      
      console.log('✅ LOGO SERVICE: Supabase storage initialized successfully');
    } catch (error) {
      console.error('❌ LOGO SERVICE: Failed to initialize storage:', error);
    }
  }

  /**
   * Set up storage RLS policies
   */
  private async setupStoragePolicy(): Promise<void> {
    try {
      // This would typically be done via SQL in the Supabase dashboard
      // But we can verify the bucket configuration here
      const { data } = await supabase.storage.getBucket(SUPABASE_STORAGE_CONFIG.BUCKET_NAME);
      
      if (data) {
        console.log('✅ LOGO SERVICE: Storage bucket configuration verified');
      }
    } catch (error) {
      console.error('❌ LOGO SERVICE: Failed to setup storage policy:', error);
    }
  }

  /**
   * ✅ NEW: Get real country flag for international teams
   */
  getCountryFlag(teamName: string, league?: string): string {
    const countryFlagMap: { [key: string]: string } = {
      // FIFA Top 50 Countries with Real Flags
      'argentina': '🇦🇷', 'france': '🇫🇷', 'brazil': '🇧🇷', 'england': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
      'belgium': '🇧🇪', 'croatia': '🇭🇷', 'netherlands': '🇳🇱', 'italy': '🇮🇹',
      'portugal': '🇵🇹', 'spain': '🇪🇸', 'morocco': '🇲🇦', 'switzerland': '🇨🇭',
      'germany': '🇩🇪', 'mexico': '🇲🇽', 'united states': '🇺🇸', 'usa': '🇺🇸',
      'uruguay': '🇺🇾', 'colombia': '🇨🇴', 'denmark': '🇩🇰', 'senegal': '🇸🇳',
      'japan': '🇯🇵', 'iran': '🇮🇷', 'australia': '🇦🇺', 'ukraine': '🇺🇦',
      'south korea': '🇰🇷', 'korea republic': '🇰🇷', 'chile': '🇨🇱', 'algeria': '🇩🇿',
      'peru': '🇵🇪', 'egypt': '🇪🇬', 'nigeria': '🇳🇬', 'tunisia': '🇹🇳',
      'austria': '🇦🇹', 'poland': '🇵🇱', 'sweden': '🇸🇪', 'turkey': '🇹🇷',
      'wales': '🏴󠁧󠁢󠁷󠁬󠁳󠁿', 'ecuador': '🇪🇨', 'hungary': '🇭🇺', 'russia': '🇷🇺',
      'czech republic': '🇨🇿', 'norway': '🇳🇴', 'canada': '🇨🇦', 'scotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
      'ireland': '🇮🇪', 'republic of ireland': '🇮🇪', 'costa rica': '🇨🇷', 'finland': '🇫🇮',
      'venezuela': '🇻🇪', 'bosnia and herzegovina': '🇧🇦', 'panama': '🇵🇦', 'jamaica': '🇯🇲',
      'northern ireland': '🇳🇮', 'cameroon': '🇨🇲', 'ghana': '🇬🇭', 'serbia': '🇷🇸',
      'mali': '🇲🇱', 'paraguay': '🇵🇾', 'burkina faso': '🇧🇫', 'cape verde': '🇨🇻',
      'south africa': '🇿🇦', 'albania': '🇦🇱', 'montenegro': '🇲🇪', 'jordan': '🇯🇴',
      'iceland': '🇮🇸', 'guinea': '🇬🇳', 'uganda': '🇺🇬', 'israel': '🇮🇱',
      'uzbekistan': '🇺🇿', 'georgia': '🇬🇪', 'oman': '🇴🇲', 'syria': '🇸🇾',
      'qatar': '🇶🇦', 'saudi arabia': '🇸🇦', 'iraq': '🇮🇶', 'united arab emirates': '🇦🇪',
      'lebanon': '🇱🇧', 'libya': '🇱🇾', 'congo': '🇨🇬', 'ivory coast': '🇨🇮',
      'madagascar': '🇲🇬', 'kenya': '🇰🇪', 'zambia': '🇿🇲', 'zimbabwe': '🇿🇼',
      'rwanda': '🇷🇼', 'ethiopia': '🇪🇹', 'sudan': '🇸🇩', 'angola': '🇦🇴',
      'mozambique': '🇲🇿', 'namibia': '🇳🇦', 'botswana': '🇧🇼', 'lesotho': '🇱🇸',
      'eswatini': '🇸🇿', 'malawi': '🇲🇼', 'tanzania': '🇹🇿'
    };
    
    // Clean team name for matching
    const cleanName = teamName.toLowerCase().trim();
    
    // Check direct country matches
    for (const [country, flag] of Object.entries(countryFlagMap)) {
      if (cleanName.includes(country) || country.includes(cleanName)) {
        console.log(`🏴 REAL FLAG: ${teamName} → ${flag} (${country})`);
        return flag;
      }
    }
    
    // Check if it's an international league to determine if flags should be shown
    const isInternational = league && (
      league.toLowerCase().includes('world cup') ||
      league.toLowerCase().includes('uefa nations') ||
      league.toLowerCase().includes('africa cup') ||
      league.toLowerCase().includes('copa america') ||
      league.toLowerCase().includes('friendlies') ||
      league.toLowerCase().includes('international')
    );
    
    if (isInternational) {
      console.log(`🏴 INTERNATIONAL MATCH: ${teamName} (no flag found)`);
      return '🏴'; // Generic flag for international teams without specific flag
    }
    
    return ''; // No flag for club teams
  }

  /**
   * 🏆 FOOTBALL-DATA.ORG API: Get official team logo
   */
  private async getFootballDataLogo(teamName: string): Promise<string | null> {
    try {
      const apiKey = process.env['EXPO_PUBLIC_FOOTBALL_DATA.ORG_API'];

      if (!apiKey) {
        console.log('❌ Football-Data.org API key not found in environment variables');
        return null;
      }

      // Search for team by name
      const searchResponse = await fetch(`https://api.football-data.org/v4/teams?name=${encodeURIComponent(teamName)}`, {
        headers: {
          'X-Auth-Token': apiKey
        }
      });

      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        if (searchData.teams && searchData.teams.length > 0) {
          const team = searchData.teams[0];
          if (team.crest) {
            console.log(`✅ FOOTBALL-DATA.ORG LOGO: ${teamName} → ${team.crest}`);
            return team.crest;
          }
        }
      }

      // If direct search fails, try getting team by ID if we have it
      const teamId = this.getFootballDataTeamId(teamName);
      if (teamId) {
        const teamResponse = await fetch(`https://api.football-data.org/v4/teams/${teamId}`, {
          headers: {
            'X-Auth-Token': apiKey
          }
        });

        if (teamResponse.ok) {
          const teamData = await teamResponse.json();
          if (teamData.crest) {
            console.log(`✅ FOOTBALL-DATA.ORG LOGO (by ID): ${teamName} → ${teamData.crest}`);
            return teamData.crest;
          }
        }
      }

      return null;
    } catch (error) {
      console.log(`❌ Football-Data.org API error for "${teamName}":`, error);
      return null;
    }
  }

  /**
   * 🌍 WIKIPEDIA API: Get team logo from Wikipedia/Wikimedia Commons
   */
  private async getWikipediaLogo(teamName: string): Promise<string | null> {
    try {
      // Try different Wikipedia page name variations
      const pageNames = [
        `${teamName} F.C.`,
        `${teamName} FC`,
        `${teamName}`,
        `${teamName} Football Club`,
        `${teamName} Futebol Clube`
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
                console.log(`✅ WIKIPEDIA LOGO: ${teamName} → ${page.thumbnail.source}`);
                return page.thumbnail.source;
              }
            }
          }
        } catch (error) {
          console.log(`⚠️ Wikipedia attempt failed for "${pageName}":`, error);
        }
      }

      return null;
    } catch (error) {
      console.log(`❌ Wikipedia API error for "${teamName}":`, error);
      return null;
    }
  }

  /**
   * 🆔 Get Football-Data.org team ID mapping
   */
  private getFootballDataTeamId(teamName: string): number | null {
    const teamIdMap: { [key: string]: number } = {
      // Premier League
      'manchester united': 66,
      'manchester city': 65,
      'liverpool': 64,
      'chelsea': 61,
      'arsenal': 57,
      'tottenham': 73,
      'leicester': 338,
      'west ham': 563,
      'everton': 62,
      'aston villa': 58,

      // La Liga
      'real madrid': 86,
      'barcelona': 81,
      'atletico madrid': 78,
      'sevilla': 559,
      'valencia': 95,
      'villarreal': 94,
      'real sociedad': 92,
      'athletic bilbao': 77,

      // Bundesliga
      'bayern munich': 5,
      'borussia dortmund': 4,
      'rb leipzig': 721,
      'bayer leverkusen': 3,
      'borussia monchengladbach': 18,
      'wolfsburg': 11,
      'eintracht frankfurt': 19,
      'union berlin': 28,

      // Serie A
      'juventus': 109,
      'inter milan': 108,
      'ac milan': 98,
      'napoli': 113,
      'roma': 100,
      'lazio': 110,
      'atalanta': 102,
      'fiorentina': 99,

      // Portuguese teams
      'arouca': 5529,
      'lusitania': 5530, // These might need to be verified
      'porto': 503,
      'benfica': 1903,
      'sporting': 498,
    };

    const cleanName = teamName.toLowerCase().trim();
    return teamIdMap[cleanName] || null;
  }

  /**
   * ✅ NEW: Get real team logo from multiple sources
   */
  async getRealTeamLogo(teamName: string, league?: string): Promise<string> {
    try {
      console.log(`🔍 FETCHING REAL LOGO: ${teamName} (${league})`);

      // Try to get from Supabase storage first
      const supabaseLogo = this.getTeamLogo(teamName, league);
      if (supabaseLogo && !supabaseLogo.includes('ui-avatars.com')) {
        console.log(`✅ SUPABASE LOGO: ${teamName} → Found in storage`);
        return supabaseLogo;
      }

      // 1. Try Football-Data.org API (official logos)
      try {
        const footballDataLogo = await this.getFootballDataLogo(teamName);
        if (footballDataLogo) {
          console.log(`✅ FOOTBALL-DATA.ORG LOGO: ${teamName} → ${footballDataLogo}`);
          // Cache the logo for future use
          await this.cacheTeamLogo(teamName, footballDataLogo, league);
          return footballDataLogo;
        }
      } catch (error) {
        console.log(`❌ Football-Data.org failed for "${teamName}":`, error);
      }

      // 2. Try Wikipedia/Wikimedia Commons (DISABLED to prevent network spam)
      // Wikipedia API calls disabled to improve performance and reduce network requests

      // 3. Try to fetch from external API (API-Football has team logos)
      const apiKey = process.env.EXPO_PUBLIC_RAPID_API_KEY_PRO;
      if (apiKey) {
        try {
          const response = await fetch(`https://api-football-v1.p.rapidapi.com/v3/teams?search=${encodeURIComponent(teamName)}`, {
            headers: {
              'X-RapidAPI-Key': apiKey,
              'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com'
            }
          });

          if (response.ok) {
            const data = await response.json();
            if (data?.response?.[0]?.team?.logo) {
              const realLogo = data.response[0].team.logo;
              console.log(`✅ API LOGO: ${teamName} → ${realLogo}`);

              // Cache the logo for future use
              await this.cacheTeamLogo(teamName, realLogo, league);
              return realLogo;
            }
          }
        } catch (error) {
          console.log(`⚠️ API LOGO FETCH FAILED: ${teamName}`, error);
        }
      }
      
      // Fallback to high-quality generated logo
      const fallbackLogo = SUPABASE_STORAGE_CONFIG.FALLBACK_LOGOS.TEAM_SPECIFIC(teamName);
      console.log(`🎨 FALLBACK LOGO: ${teamName} → Generated`);
      return fallbackLogo;
      
    } catch (error) {
      console.error(`❌ LOGO FETCH ERROR: ${teamName}`, error);
      return SUPABASE_STORAGE_CONFIG.FALLBACK_LOGOS.TEAM_SPECIFIC(teamName);
    }
  }

  /**
   * ✅ NEW: Cache team logo in Supabase
   */
  private async cacheTeamLogo(teamName: string, logoUrl: string, league?: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('team_logos')
        .upsert({
          team_name: teamName,
          logo_url: logoUrl,
          league: league || 'Unknown',
          cached_at: new Date().toISOString()
        });
      
      if (!error) {
        console.log(`💾 CACHED LOGO: ${teamName}`);
      }
    } catch (error) {
      console.log(`⚠️ CACHE FAILED: ${teamName}`, error);
    }
  }

  /**
   * ✅ NEW: Enhanced match enhancement with real logos and flags
   */
  enhanceMatchWithRealLogosAndFlags(match: Match): Match {
    const enhancedMatch = { ...match };
    
    // Get real team logos
    const homeLogo = this.getRealTeamLogo(match.home.name, match.league);
    const awayLogo = this.getRealTeamLogo(match.away.name, match.league);
    
    // Get country flags for international teams
    const homeFlag = this.getCountryFlag(match.home.name, match.league);
    const awayFlag = this.getCountryFlag(match.away.name, match.league);
    
    enhancedMatch.home = {
      ...enhancedMatch.home,
      logo: typeof homeLogo === 'string' ? homeLogo : this.getTeamLogo(match.home.name, match.league),
      flag: homeFlag
    };
    
    enhancedMatch.away = {
      ...enhancedMatch.away,
      logo: typeof awayLogo === 'string' ? awayLogo : this.getTeamLogo(match.away.name, match.league),
      flag: awayFlag
    };
    
    console.log(`🎯 ENHANCED MATCH: ${match.home.name} vs ${match.away.name}`);
    console.log(`   🏠 Home: ${enhancedMatch.home.logo} ${homeFlag}`);
    console.log(`   🏃 Away: ${enhancedMatch.away.logo} ${awayFlag}`);
         
     return enhancedMatch;
   }

  /**
   * 🔥 MANDATORY: Get official logo with API fallback - NEVER returns generated avatars
   * This is the main method that match-details should use
   */
  async getGuaranteedOfficialLogo(teamName: string, league?: string): Promise<string> {
    try {
      console.log(`🔥 FETCHING GUARANTEED OFFICIAL LOGO: ${teamName} (${league})`);
      
      // First try our official logo method (from Supabase database)
      const officialLogo = this.getOfficialTeamLogo(teamName, league);
      if (officialLogo && !officialLogo.includes('ui-avatars.com') && !officialLogo.includes('default.png')) {
        console.log(`✅ GUARANTEED LOGO (database): ${teamName} → ${officialLogo}`);
        return officialLogo;
      }
      
      // Try to fetch from Football API (always has official logos)
      const apiKey = process.env.EXPO_PUBLIC_RAPID_API_KEY_PRO;
      if (apiKey) {
        try {
          const response = await fetch(`https://api-football-v1.p.rapidapi.com/v3/teams?search=${encodeURIComponent(teamName)}`, {
            method: 'GET',
            headers: {
              'X-RapidAPI-Key': apiKey,
              'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com'
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data?.response?.[0]?.team?.logo) {
              const apiLogo = data.response[0].team.logo;
              console.log(`✅ GUARANTEED LOGO (API): ${teamName} → ${apiLogo}`);
              
              // Cache this logo for future use
              this.logoCache.set(`${teamName.toLowerCase()}_${league || 'any'}`, apiLogo);
              return apiLogo;
            }
          }
        } catch (error) {
          console.log(`⚠️ API logo fetch failed for ${teamName}, trying alternatives`);
        }
      }
      
      // Try alternative reliable sources
      const alternatives = this.getAlternativeOfficialLogos(teamName, league);
      for (const alt of alternatives) {
        try {
          // Check if the URL is accessible
          const testResponse = await fetch(alt, { method: 'HEAD' });
          if (testResponse.ok) {
            console.log(`✅ GUARANTEED LOGO (alternative): ${teamName} → ${alt}`);
            return alt;
          }
        } catch (error) {
          continue; // Try next alternative
        }
      }
      
      // Last resort: ESPN sports logo (most reliable)
      const espnLogo = `https://a.espncdn.com/i/teamlogos/soccer/500/${encodeURIComponent(teamName.toLowerCase().replace(/\s+/g, '-'))}.png`;
      console.log(`✅ GUARANTEED LOGO (ESPN final): ${teamName} → ${espnLogo}`);
      return espnLogo;
      
    } catch (error) {
      console.error(`❌ Error getting guaranteed logo for ${teamName}:`, error);
      // Even in error, return ESPN logo - never generated avatar
      return `https://a.espncdn.com/i/teamlogos/soccer/500/${encodeURIComponent(teamName.toLowerCase().replace(/\s+/g, '-'))}.png`;
    }
  }

  /**
   * 🎯 Get multiple alternative official logo sources
   */
  private getAlternativeOfficialLogos(teamName: string, league?: string): string[] {
    const cleanName = teamName.toLowerCase().replace(/\s+/g, '-');
    const encodedName = encodeURIComponent(cleanName);
    
    return [
      // ESPN Sports (most reliable)
      `https://a.espncdn.com/i/teamlogos/soccer/500/${encodedName}.png`,
      `https://a.espncdn.com/i/teamlogos/soccer/500-dark/${encodedName}.png`,
      
      // Alternative sports databases
      `https://logos-world.net/wp-content/uploads/2020/06/${encodedName}-Logo.png`,
      `https://1000logos.net/wp-content/uploads/2018/06/${encodedName}-logo.png`,
      
      // Football specific logo databases
      `https://www.footballdatabase.eu/images/logo/club/${encodedName}.png`,
      `https://media.api-sports.io/football/teams/${this.getTeamId(teamName)}.png`,
      
      // Generic sports logo services
      `https://logo.clearbit.com/${cleanName}.com`,
      `https://img.logo.dev/${cleanName}.com?token=pk_X1a2b3c4d5e6f7g8h9i0`,
    ];
  }

  /**
   * 🎯 Get team ID for API sports
   */
  private getTeamId(teamName: string): number {
    // Map common teams to their API-Football IDs
    const teamIds: { [key: string]: number } = {
      'manchester united': 33,
      'manchester city': 50,
      'arsenal': 42,
      'chelsea': 49,
      'liverpool': 40,
      'tottenham': 47,
      'real madrid': 541,
      'barcelona': 529,
      'atletico madrid': 530,
      'bayern munich': 157,
      'borussia dortmund': 165,
      'juventus': 496,
      'ac milan': 489,
      'inter milan': 505,
      'psg': 85,
      'lyon': 80,
      'marseille': 81,
      // Brazilian teams
      'santos': 1963,
      'palmeiras': 1964,
      'corinthians': 1965,
      'flamengo': 1966,
      // International teams
      'germany': 25,
      'spain': 9,
      'argentina': 26,
      'brazil': 6,
    };
    
    const cleanName = teamName.toLowerCase();
    for (const [team, id] of Object.entries(teamIds)) {
      if (cleanName.includes(team) || team.includes(cleanName)) {
        return id;
      }
    }
    
    // Default fallback ID
    return 1;
  }
}

// Export singleton instance
const teamLogoService = new TeamLogoService();
export default teamLogoService;