// Ugandan Premier League Configuration - Current Season
export interface TeamConfig {
  id: string;
  name: string;
  displayName: string;
  fullName: string;
  apiName: string;
  logoKey: string;
  primaryColor: string;
  secondaryColor: string;
  playerCount: number;
  website: string;
}

export interface LeagueConfig {
  leagueId: string;
  leagueName: string;
  teams: TeamConfig[];
  apiService: string;
  imageIndex: string;
}

export const ugandanPLTeams: TeamConfig[] = [
  // Row 1 - 8 teams (Current Season)
  {
    id: 'kcca-fc',
    name: 'KCCA FC',
    displayName: 'KCCA FC',
    fullName: 'Kampala Capital City Authority FC',
    apiName: 'KCCA',
    logoKey: 'KCCA FC',
    primaryColor: '#FFD700',
    secondaryColor: '#0066CC',
    playerCount: 27,
    website: 'https://www.kccafc.co.ug/',
  },
  {
    id: 'police-fc',
    name: 'Police FC',
    displayName: 'Police FC',
    fullName: 'Uganda Police FC',
    apiName: 'Police FC',
    logoKey: 'Police FC',
    primaryColor: '#000000',
    secondaryColor: '#FFD700',
    playerCount: 27,
    website: 'https://upl.co.ug/team/police-fc/',
  },
  {
    id: 'sc-villa',
    name: 'SC Villa',
    displayName: 'SC Villa',
    fullName: 'Sports Club Villa',
    apiName: 'SC Villa',
    logoKey: 'SC Villa',
    primaryColor: '#0066CC',
    secondaryColor: '#FFFFFF',
    playerCount: 27,
    website: 'https://scvilla.co.ug/',
  },
  {
    id: 'bul-fc',
    name: 'BUL FC',
    displayName: 'BUL FC',
    fullName: 'Busoga United Lukaya FC',
    apiName: 'BUL FC',
    logoKey: 'BUL FC',
    primaryColor: '#0066CC',
    secondaryColor: '#FFFFFF',
    playerCount: 27,
    website: 'https://bulfc.co.ug/',
  },
  {
    id: 'bahimba-utd',
    name: 'Bahimba Utd',
    displayName: 'Bahimba Utd',
    fullName: 'Bahimba United Saints FC',
    apiName: 'Bahimba United',
    logoKey: 'Bahimba Utd',
    primaryColor: '#00B04F',
    secondaryColor: '#FFD700',
    playerCount: 27,
    website: 'https://upl.co.ug/team/buhimba-united-saints-fc/',
  },
  {
    id: 'express-fc',
    name: 'Express FC',
    displayName: 'Express FC',
    fullName: 'Express Football Club',
    apiName: 'Express FC',
    logoKey: 'Express FC',
    primaryColor: '#C8102E',
    secondaryColor: '#FFFFFF',
    playerCount: 27,
    website: 'https://expressfc.co.ug/',
  },
  {
    id: 'kitara-fc',
    name: 'Kitara FC',
    displayName: 'Kitara FC',
    fullName: 'Kitara Football Club',
    apiName: 'Kitara FC',
    logoKey: 'Kitara FC',
    primaryColor: '#FF6900',
    secondaryColor: '#000000',
    playerCount: 27,
    website: 'https://kitarafc.co.ug/',
  },
  {
    id: 'ura-fc',
    name: 'URA FC',
    displayName: 'URA FC',
    fullName: 'Uganda Revenue Authority FC',
    apiName: 'URA FC',
    logoKey: 'URA FC',
    primaryColor: '#FFD700',
    secondaryColor: '#C8102E',
    playerCount: 27,
    website: 'https://urafc.co.ug/',
  },

  // Row 2 - 8 teams (Current Season)
  {
    id: 'uppc-fc',
    name: 'UPPC FC',
    displayName: 'UPPC FC',
    fullName: 'Uganda Petroleum Pipeline Corporation FC',
    apiName: 'UPPC FC',
    logoKey: 'UPPC FC',
    primaryColor: '#FF6900',
    secondaryColor: '#0066CC',
    playerCount: 27,
    website: 'https://uppcfc.go.ug/',
  },
  {
    id: 'nec-fc',
    name: 'NEC FC',
    displayName: 'NEC FC',
    fullName: 'National Enterprise Corporation FC',
    apiName: 'NEC FC',
    logoKey: 'NEC FC',
    primaryColor: '#C8102E',
    secondaryColor: '#FFD700',
    playerCount: 27,
    website: 'https://necfcuganda.com/',
  },
  {
    id: 'maroons-fc',
    name: 'Maroons FC',
    displayName: 'Maroons FC',
    fullName: 'Maroons Football Club',
    apiName: 'Maroons FC',
    logoKey: 'Maroons FC',
    primaryColor: '#8B0000',
    secondaryColor: '#FFFFFF',
    playerCount: 27,
    website: 'https://upl.co.ug/team/maroons-fc/',
  },
  {
    id: 'lugazi-fc',
    name: 'Lugazi FC',
    displayName: 'Lugazi FC',
    fullName: 'Lugazi Football Club',
    apiName: 'Lugazi FC',
    logoKey: 'Lugazi FC',
    primaryColor: '#0066CC',
    secondaryColor: '#FFFFFF',
    playerCount: 27,
    website: 'https://lugazifc.com/',
  },
  {
    id: 'vipers-sc',
    name: 'Vipers SC',
    displayName: 'Vipers SC',
    fullName: 'Vipers Sports Club',
    apiName: 'Vipers SC',
    logoKey: 'Vipers SC',
    primaryColor: '#00B04F',
    secondaryColor: '#000000',
    playerCount: 27,
    website: 'https://viperssc.co.ug/',
  },
  {
    id: 'updf-fc',
    name: 'UPDF FC',
    displayName: 'UPDF FC',
    fullName: 'Uganda Peoples Defence Forces FC',
    apiName: 'UPDF FC',
    logoKey: 'UPDF FC',
    primaryColor: '#00B04F',
    secondaryColor: '#FFD700',
    playerCount: 27,
    website: 'https://uppcfc.go.ug/',
  },
  {
    id: 'mbarara-fc',
    name: 'Mbarara FC',
    displayName: 'Mbarara FC',
    fullName: 'Mbarara City FC',
    apiName: 'Mbarara FC',
    logoKey: 'Mbarara FC',
    primaryColor: '#6A2C91',
    secondaryColor: '#FFFFFF',
    playerCount: 27,
    website: 'https://upl.co.ug/team/mbarara-city-fc/',
  },
  {
    id: 'calvary-fc',
    name: 'Calvary FC',
    displayName: 'Calvary FC',
    fullName: 'Calvary Football Club',
    apiName: 'Calvary FC',
    logoKey: 'Calvary FC',
    primaryColor: '#8B0000',
    secondaryColor: '#FFD700',
    playerCount: 27,
    website: 'https://calvaryfcofficial.com/',
  },
];

export const ugandanPLConfig: LeagueConfig = {
  leagueId: 'ugandan-pl',
  leagueName: 'Ugandan Premier League',
  teams: ugandanPLTeams,
  apiService: 'ugandanPLApiService',
  imageIndex: '../../../assets/images/ugandan-pl/index',
};
