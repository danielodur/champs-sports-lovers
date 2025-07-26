import { League } from '@/types/league';

// Enhanced competition types
export interface EnhancedCompetition extends League {
  type: 'league' | 'cup' | 'international' | 'continental';
  tier: number; // 1 = top tier, 2 = second tier, etc.
  logo?: string;
  startDate?: string;
  endDate?: string;
  participantCount?: number;
  currentSeason?: string;
  isActive: boolean;
  apiId?: string; // For SportRadar/RapidAPI integration
}

export const competitions: Record<string, EnhancedCompetition[]> = {
  football: [
    // ================ INTERNATIONAL TOURNAMENTS ================
    {
      id: 'fifa-world-cup',
      name: 'FIFA World Cup',
      country: 'International',
      type: 'international',
      tier: 1,
      logo: 'https://logos-world.net/wp-content/uploads/2020/06/FIFA-World-Cup-Logo.png',
      participantCount: 32,
      currentSeason: '2026',
      isActive: true,
      apiId: 'world-cup-2026'
    },
    {
      id: 'fifa-club-world-cup',
      name: 'FIFA Club World Cup',
      country: 'International',
      type: 'international',
      tier: 1,
      logo: 'https://logoeps.com/wp-content/uploads/2014/05/fifa-club-world-cup-vector-logo.png',
      participantCount: 32,
      currentSeason: '2025',
      isActive: true,
      apiId: 'club-world-cup'
    },
    {
      id: 'uefa-euro',
      name: 'UEFA Euro Championship',
      country: 'Europe',
      type: 'international',
      tier: 1,
      logo: 'https://logos-world.net/wp-content/uploads/2021/04/UEFA-Euro-Logo.png',
      participantCount: 24,
      currentSeason: '2024',
      isActive: true,
      apiId: 'euro-2024'
    },
    {
      id: 'copa-america',
      name: 'Copa América',
      country: 'South America',
      type: 'international',
      tier: 1,
      logo: 'https://logoeps.com/wp-content/uploads/2014/06/copa-america-vector-logo.png',
      participantCount: 16,
      currentSeason: '2024',
      isActive: true,
      apiId: 'copa-america'
    },
    {
      id: 'afcon',
      name: 'Africa Cup of Nations',
      country: 'Africa',
      type: 'international',
      tier: 1,
      logo: 'https://logoeps.com/wp-content/uploads/2013/03/africa-cup-of-nations-vector-logo.png',
      participantCount: 24,
      currentSeason: '2025',
      isActive: true,
      apiId: 'afcon'
    },
    {
      id: 'afc-asian-cup',
      name: 'AFC Asian Cup',
      country: 'Asia',
      type: 'international',
      tier: 1,
      logo: 'https://logoeps.com/wp-content/uploads/2014/05/afc-asian-cup-vector-logo.png',
      participantCount: 24,
      currentSeason: '2027',
      isActive: true,
      apiId: 'asian-cup'
    },
    {
      id: 'concacaf-gold-cup',
      name: 'CONCACAF Gold Cup',
      country: 'North America',
      type: 'international',
      tier: 1,
      logo: 'https://logoeps.com/wp-content/uploads/2014/05/concacaf-gold-cup-vector-logo.png',
      participantCount: 16,
      currentSeason: '2025',
      isActive: true,
      apiId: 'gold-cup'
    },
    {
      id: 'uefa-nations-league',
      name: 'UEFA Nations League',
      country: 'Europe',
      type: 'international',
      tier: 1,
      logo: 'https://logoeps.com/wp-content/uploads/2018/09/uefa-nations-league-vector-logo.png',
      participantCount: 55,
      currentSeason: '2024-25',
      isActive: true,
      apiId: 'nations-league'
    },
    {
      id: 'olympics-football',
      name: 'Olympic Football Tournament',
      country: 'International',
      type: 'international',
      tier: 1,
      logo: 'https://logoeps.com/wp-content/uploads/2012/05/olympics-logo-vector.png',
      participantCount: 16,
      currentSeason: '2024',
      isActive: true,
      apiId: 'olympics'
    },

    // ================ CONTINENTAL COMPETITIONS ================
    {
      id: 'uefa-champions-league',
      name: 'UEFA Champions League',
      country: 'Europe',
      type: 'continental',
      tier: 1,
      logo: 'https://logoeps.com/wp-content/uploads/2013/03/uefa-champions-league-vector-logo.png',
      participantCount: 36,
      currentSeason: '2024-25',
      isActive: true,
      apiId: 'champions-league'
    },
    {
      id: 'uefa-europa-league',
      name: 'UEFA Europa League',
      country: 'Europe',
      type: 'continental',
      tier: 2,
      logo: 'https://logoeps.com/wp-content/uploads/2013/03/uefa-europa-league-vector-logo.png',
      participantCount: 36,
      currentSeason: '2024-25',
      isActive: true,
      apiId: 'europa-league'
    },
    {
      id: 'uefa-conference-league',
      name: 'UEFA Conference League',
      country: 'Europe',
      type: 'continental',
      tier: 3,
      logo: 'https://logoeps.com/wp-content/uploads/2021/05/uefa-europa-conference-league-vector-logo.png',
      participantCount: 36,
      currentSeason: '2024-25',
      isActive: true,
      apiId: 'conference-league'
    },
    {
      id: 'caf-champions-league',
      name: 'CAF Champions League',
      country: 'Africa',
      type: 'continental',
      tier: 1,
      logo: 'https://logoeps.com/wp-content/uploads/2014/05/caf-champions-league-vector-logo.png',
      participantCount: 16,
      currentSeason: '2024',
      isActive: true,
      apiId: 'caf-champions'
    },
    {
      id: 'caf-confederation-cup',
      name: 'CAF Confederation Cup',
      country: 'Africa',
      type: 'continental',
      tier: 2,
      logo: 'https://logoeps.com/wp-content/uploads/2014/05/caf-confederation-cup-vector-logo.png',
      participantCount: 16,
      currentSeason: '2024',
      isActive: true,
      apiId: 'caf-confederation'
    },
    {
      id: 'afc-champions-league',
      name: 'AFC Champions League',
      country: 'Asia',
      type: 'continental',
      tier: 1,
      logo: 'https://logoeps.com/wp-content/uploads/2014/05/afc-champions-league-vector-logo.png',
      participantCount: 24,
      currentSeason: '2024',
      isActive: true,
      apiId: 'afc-champions'
    },
    {
      id: 'concacaf-champions-cup',
      name: 'CONCACAF Champions Cup',
      country: 'North America',
      type: 'continental',
      tier: 1,
      logo: 'https://logoeps.com/wp-content/uploads/2014/05/concacaf-champions-league-vector-logo.png',
      participantCount: 27,
      currentSeason: '2024',
      isActive: true,
      apiId: 'concacaf-champions'
    },
    {
      id: 'copa-libertadores',
      name: 'Copa Libertadores',
      country: 'South America',
      type: 'continental',
      tier: 1,
      logo: 'https://logoeps.com/wp-content/uploads/2013/03/copa-libertadores-vector-logo.png',
      participantCount: 47,
      currentSeason: '2024',
      isActive: true,
      apiId: 'libertadores'
    },
    {
      id: 'copa-sudamericana',
      name: 'Copa Sudamericana',
      country: 'South America',
      type: 'continental',
      tier: 2,
      logo: 'https://logoeps.com/wp-content/uploads/2014/05/copa-sudamericana-vector-logo.png',
      participantCount: 44,
      currentSeason: '2024',
      isActive: true,
      apiId: 'sudamericana'
    },
    {
      id: 'ofc-champions-league',
      name: 'OFC Champions League',
      country: 'Oceania',
      type: 'continental',
      tier: 1,
      logo: 'https://logoeps.com/wp-content/uploads/2014/05/ofc-champions-league-vector-logo.png',
      participantCount: 16,
      currentSeason: '2024',
      isActive: true,
      apiId: 'ofc-champions'
    },

    // ================ TOP EUROPEAN LEAGUES ================
    {
      id: 'premier-league',
      name: 'Premier League',
      country: 'England',
      type: 'league',
      tier: 1,
      logo: 'https://logoeps.com/wp-content/uploads/2013/03/premier-league-vector-logo.png',
      participantCount: 20,
      currentSeason: '2024-25',
      isActive: true,
      apiId: 'premier-league'
    },
    {
      id: 'la-liga',
      name: 'La Liga',
      country: 'Spain',
      type: 'league',
      tier: 1,
      logo: 'https://logoeps.com/wp-content/uploads/2013/03/la-liga-vector-logo.png',
      participantCount: 20,
      currentSeason: '2024-25',
      isActive: true,
      apiId: 'la-liga'
    },
    {
      id: 'bundesliga',
      name: 'Bundesliga',
      country: 'Germany',
      type: 'league',
      tier: 1,
      logo: 'https://logoeps.com/wp-content/uploads/2013/03/bundesliga-vector-logo.png',
      participantCount: 18,
      currentSeason: '2024-25',
      isActive: true,
      apiId: 'bundesliga'
    },
    {
      id: 'serie-a',
      name: 'Serie A',
      country: 'Italy',
      type: 'league',
      tier: 1,
      logo: 'https://logoeps.com/wp-content/uploads/2013/03/serie-a-vector-logo.png',
      participantCount: 20,
      currentSeason: '2024-25',
      isActive: true,
      apiId: 'serie-a'
    },
    {
      id: 'ligue-1',
      name: 'Ligue 1',
      country: 'France',
      type: 'league',
      tier: 1,
      logo: 'https://logoeps.com/wp-content/uploads/2013/03/ligue-1-vector-logo.png',
      participantCount: 18,
      currentSeason: '2024-25',
      isActive: true,
      apiId: 'ligue-1'
    },
    {
      id: 'eredivisie',
      name: 'Eredivisie',
      country: 'Netherlands',
      type: 'league',
      tier: 1,
      logo: 'https://logoeps.com/wp-content/uploads/2013/03/eredivisie-vector-logo.png',
      participantCount: 18,
      currentSeason: '2024-25',
      isActive: true,
      apiId: 'eredivisie'
    },
    {
      id: 'primeira-liga',
      name: 'Primeira Liga',
      country: 'Portugal',
      type: 'league',
      tier: 1,
      logo: 'https://logoeps.com/wp-content/uploads/2013/03/primeira-liga-vector-logo.png',
      participantCount: 18,
      currentSeason: '2024-25',
      isActive: true,
      apiId: 'primeira-liga'
    },
    {
      id: 'belgian-pro-league',
      name: 'Belgian Pro League',
      country: 'Belgium',
      type: 'league',
      tier: 1,
      logo: 'https://logoeps.com/wp-content/uploads/2013/03/belgian-pro-league-vector-logo.png',
      participantCount: 16,
      currentSeason: '2024-25',
      isActive: true,
      apiId: 'belgian-pro-league'
    },

    // ================ EUROPEAN CUPS ================
    {
      id: 'fa-cup',
      name: 'FA Cup',
      country: 'England',
      type: 'cup',
      tier: 1,
      logo: 'https://logoeps.com/wp-content/uploads/2013/03/fa-cup-vector-logo.png',
      participantCount: 124,
      currentSeason: '2024-25',
      isActive: true,
      apiId: 'fa-cup'
    },
    {
      id: 'efl-cup',
      name: 'EFL Cup',
      country: 'England',
      type: 'cup',
      tier: 2,
      logo: 'https://logoeps.com/wp-content/uploads/2013/03/efl-cup-vector-logo.png',
      participantCount: 92,
      currentSeason: '2024-25',
      isActive: true,
      apiId: 'efl-cup'
    },
    {
      id: 'copa-del-rey',
      name: 'Copa del Rey',
      country: 'Spain',
      type: 'cup',
      tier: 1,
      logo: 'https://logoeps.com/wp-content/uploads/2013/03/copa-del-rey-vector-logo.png',
      participantCount: 116,
      currentSeason: '2024-25',
      isActive: true,
      apiId: 'copa-del-rey'
    },
    {
      id: 'dfb-pokal',
      name: 'DFB-Pokal',
      country: 'Germany',
      type: 'cup',
      tier: 1,
      logo: 'https://logoeps.com/wp-content/uploads/2013/03/dfb-pokal-vector-logo.png',
      participantCount: 64,
      currentSeason: '2024-25',
      isActive: true,
      apiId: 'dfb-pokal'
    },
    {
      id: 'coppa-italia',
      name: 'Coppa Italia',
      country: 'Italy',
      type: 'cup',
      tier: 1,
      logo: 'https://logoeps.com/wp-content/uploads/2013/03/coppa-italia-vector-logo.png',
      participantCount: 44,
      currentSeason: '2024-25',
      isActive: true,
      apiId: 'coppa-italia'
    },
    {
      id: 'coupe-de-france',
      name: 'Coupe de France',
      country: 'France',
      type: 'cup',
      tier: 1,
      logo: 'https://logoeps.com/wp-content/uploads/2013/03/coupe-de-france-vector-logo.png',
      participantCount: 7216,
      currentSeason: '2024-25',
      isActive: true,
      apiId: 'coupe-de-france'
    },

    // ================ AMERICAN LEAGUES ================
    {
      id: 'mls',
      name: 'Major League Soccer',
      country: 'USA',
      type: 'league',
      tier: 1,
      logo: 'https://logoeps.com/wp-content/uploads/2013/03/mls-vector-logo.png',
      participantCount: 30,
      currentSeason: '2024',
      isActive: true,
      apiId: 'mls'
    },
    {
      id: 'liga-mx',
      name: 'Liga MX',
      country: 'Mexico',
      type: 'league',
      tier: 1,
      logo: 'https://logoeps.com/wp-content/uploads/2013/03/liga-mx-vector-logo.png',
      participantCount: 18,
      currentSeason: '2024',
      isActive: true,
      apiId: 'liga-mx'
    },
    {
      id: 'brasileirao',
      name: 'Brasileirão Série A',
      country: 'Brazil',
      type: 'league',
      tier: 1,
      logo: 'https://logoeps.com/wp-content/uploads/2013/03/brasileirao-vector-logo.png',
      participantCount: 20,
      currentSeason: '2024',
      isActive: true,
      apiId: 'brasileirao'
    },
    {
      id: 'argentine-primera',
      name: 'Argentine Primera División',
      country: 'Argentina',
      type: 'league',
      tier: 1,
      logo: 'https://logoeps.com/wp-content/uploads/2013/03/argentine-primera-vector-logo.png',
      participantCount: 28,
      currentSeason: '2024',
      isActive: true,
      apiId: 'argentine-primera'
    },

    // ================ ASIAN LEAGUES ================
    {
      id: 'j1-league',
      name: 'J1 League',
      country: 'Japan',
      type: 'league',
      tier: 1,
      logo: 'https://logoeps.com/wp-content/uploads/2013/03/j1-league-vector-logo.png',
      participantCount: 20,
      currentSeason: '2024',
      isActive: true,
      apiId: 'j1-league'
    },
    {
      id: 'k-league-1',
      name: 'K League 1',
      country: 'South Korea',
      type: 'league',
      tier: 1,
      logo: 'https://logoeps.com/wp-content/uploads/2013/03/k-league-vector-logo.png',
      participantCount: 12,
      currentSeason: '2024',
      isActive: true,
      apiId: 'k-league-1'
    },
    {
      id: 'chinese-super-league',
      name: 'Chinese Super League',
      country: 'China',
      type: 'league',
      tier: 1,
      logo: 'https://logoeps.com/wp-content/uploads/2013/03/chinese-super-league-vector-logo.png',
      participantCount: 16,
      currentSeason: '2024',
      isActive: true,
      apiId: 'chinese-super-league'
    },
    {
      id: 'saudi-pro-league',
      name: 'Saudi Pro League',
      country: 'Saudi Arabia',
      type: 'league',
      tier: 1,
      logo: 'https://logoeps.com/wp-content/uploads/2013/03/saudi-pro-league-vector-logo.png',
      participantCount: 18,
      currentSeason: '2024-25',
      isActive: true,
      apiId: 'saudi-pro-league'
    },
    {
      id: 'indian-super-league',
      name: 'Indian Super League',
      country: 'India',
      type: 'league',
      tier: 1,
      logo: 'https://logoeps.com/wp-content/uploads/2013/03/indian-super-league-vector-logo.png',
      participantCount: 12,
      currentSeason: '2024-25',
      isActive: true,
      apiId: 'indian-super-league'
    },

    // ================ AFRICAN LEAGUES ================
    {
      id: 'egyptian-premier-league',
      name: 'Egyptian Premier League',
      country: 'Egypt',
      type: 'league',
      tier: 1,
      logo: 'https://logoeps.com/wp-content/uploads/2013/03/egyptian-premier-league-vector-logo.png',
      participantCount: 18,
      currentSeason: '2024-25',
      isActive: true,
      apiId: 'egyptian-premier'
    },
    {
      id: 'south-african-premier-division',
      name: 'DStv Premiership',
      country: 'South Africa',
      type: 'league',
      tier: 1,
      logo: 'https://logoeps.com/wp-content/uploads/2013/03/dstv-premiership-vector-logo.png',
      participantCount: 16,
      currentSeason: '2024-25',
      isActive: true,
      apiId: 'south-african-premier'
    },
    {
      id: 'moroccan-botola-pro',
      name: 'Botola Pro',
      country: 'Morocco',
      type: 'league',
      tier: 1,
      logo: 'https://logoeps.com/wp-content/uploads/2013/03/botola-pro-vector-logo.png',
      participantCount: 16,
      currentSeason: '2024-25',
      isActive: true,
      apiId: 'botola-pro'
    },

    // ================ UGANDA LEAGUES ================
    {
      id: 'uganda-premier-league',
      name: 'Uganda Premier League',
      country: 'Uganda',
      type: 'league',
      tier: 1,
      logo: 'https://logoeps.com/wp-content/uploads/2013/03/uganda-premier-league-vector-logo.png',
      participantCount: 16,
      currentSeason: '2024-25',
      isActive: true,
      apiId: 'uganda-premier'
    },
    {
      id: 'uganda-cup',
      name: 'Uganda Cup',
      country: 'Uganda',
      type: 'cup',
      tier: 1,
      logo: 'https://logoeps.com/wp-content/uploads/2013/03/uganda-cup-vector-logo.png',
      participantCount: 32,
      currentSeason: '2024',
      isActive: true,
      apiId: 'uganda-cup'
    },
    {
      id: 'cecafa-kagame-cup',
      name: 'CECAFA Kagame Cup',
      country: 'East Africa',
      type: 'continental',
      tier: 1,
      logo: 'https://logoeps.com/wp-content/uploads/2013/03/cecafa-kagame-cup-vector-logo.png',
      participantCount: 12,
      currentSeason: '2024',
      isActive: true,
      apiId: 'cecafa-kagame'
    },

    // ================ OCEANIA COMPETITIONS ================
    {
      id: 'a-league-men',
      name: 'A-League Men',
      country: 'Australia',
      type: 'league',
      tier: 1,
      logo: 'https://logoeps.com/wp-content/uploads/2013/03/a-league-vector-logo.png',
      participantCount: 12,
      currentSeason: '2024-25',
      isActive: true,
      apiId: 'a-league-men'
    },
    {
      id: 'nz-premiership',
      name: 'New Zealand Football Premiership',
      country: 'New Zealand',
      type: 'league',
      tier: 1,
      logo: 'https://logoeps.com/wp-content/uploads/2013/03/nz-premiership-vector-logo.png',
      participantCount: 10,
      currentSeason: '2024-25',
      isActive: true,
      apiId: 'nz-premiership'
    },
    {
      id: 'ofc-nations-cup',
      name: 'OFC Nations Cup',
      country: 'Oceania',
      type: 'international',
      tier: 1,
      logo: 'https://logoeps.com/wp-content/uploads/2013/03/ofc-nations-cup-vector-logo.png',
      participantCount: 8,
      currentSeason: '2024',
      isActive: true,
      apiId: 'ofc-nations-cup'
    }
  ]
};

// Legacy support for existing code
export const leagues = competitions;