// Bundesliga Configuration
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
  sofaTeamId?: number;
}

export interface LeagueConfig {
  leagueId: string;
  leagueName: string;
  teams: TeamConfig[];
  apiService: string;
  imageIndex: string;
}

export const bundesligaTeams: TeamConfig[] = [
  // Row 1 - 9 teams
  {
    id: "bayern-munich",
    name: "Bayern Munich",
    displayName: "Bayern",
    fullName: "FC Bayern München",
    apiName: "Bayern Munich",
    logoKey: "Bayern Munich",
    primaryColor: "#DC052D",
    secondaryColor: "#0066B2",
    playerCount: 27,
  },
  {
    id: "borussia-dortmund",
    name: "Borussia Dortmund",
    displayName: "Dortmund",
    fullName: "Borussia Dortmund",
    apiName: "Borussia Dortmund",
    logoKey: "Borussia Dortmund",
    primaryColor: "#FDE100",
    secondaryColor: "#000000",
    playerCount: 27,
  },
  {
    id: "rb-leipzig",
    name: "RB Leipzig",
    displayName: "RB Leipzig",
    fullName: "RasenBallsport Leipzig",
    apiName: "RB Leipzig",
    logoKey: "RB Leipzig",
    primaryColor: "#DD0741",
    secondaryColor: "#FFFFFF",
    playerCount: 27,
  },
  {
    id: "bayer-leverkusen",
    name: "Bayer Leverkusen",
    displayName: "Leverkusen",
    fullName: "Bayer 04 Leverkusen",
    apiName: "Bayer Leverkusen",
    logoKey: "Bayer Leverkusen",
    primaryColor: "#E32221",
    secondaryColor: "#000000",
    playerCount: 27,
  },
  {
    id: "eintracht-frankfurt",
    name: "Eintracht Frankfurt",
    displayName: "Frankfurt",
    fullName: "Eintracht Frankfurt",
    apiName: "Eintracht Frankfurt",
    logoKey: "Eintracht Frankfurt",
    primaryColor: "#DC052D",
    secondaryColor: "#000000",
    playerCount: 27,
  },
  {
    id: "borussia-monchengladbach",
    name: "Borussia M'gladbach",
    displayName: "M'gladbach",
    fullName: "Borussia Mönchengladbach",
    apiName: "Borussia Monchengladbach",
    logoKey: "Borussia Monchengladbach",
    primaryColor: "#00B04F",
    secondaryColor: "#000000",
    playerCount: 27,
  },
  {
    id: "vfl-wolfsburg",
    name: "VfL Wolfsburg",
    displayName: "Wolfsburg",
    fullName: "VfL Wolfsburg",
    apiName: "VfL Wolfsburg",
    logoKey: "VfL Wolfsburg",
    primaryColor: "#65B32E",
    secondaryColor: "#FFFFFF",
    playerCount: 27,
  },
  {
    id: "werder-bremen",
    name: "Werder Bremen",
    displayName: "Bremen",
    fullName: "SV Werder Bremen",
    apiName: "Werder Bremen",
    logoKey: "Werder Bremen",
    primaryColor: "#00A652",
    secondaryColor: "#FFFFFF",
    playerCount: 27,
  },
  {
    id: "sc-freiburg",
    name: "SC Freiburg",
    displayName: "Freiburg",
    fullName: "SC Freiburg",
    apiName: "SC Freiburg",
    logoKey: "SC Freiburg",
    primaryColor: "#E30613",
    secondaryColor: "#FFFFFF",
    playerCount: 27,
  },

  // Row 2 - 9 teams
  {
    id: "union-berlin",
    name: "Union Berlin",
    displayName: "Union Berlin",
    fullName: "1. FC Union Berlin",
    apiName: "Union Berlin",
    logoKey: "Union Berlin",
    primaryColor: "#EB1923",
    secondaryColor: "#FFFFFF",
    playerCount: 27,
  },
  {
    id: "vfb-stuttgart",
    name: "VfB Stuttgart",
    displayName: "Stuttgart",
    fullName: "VfB Stuttgart",
    apiName: "VfB Stuttgart",
    logoKey: "VfB Stuttgart",
    primaryColor: "#E32221",
    secondaryColor: "#FFFFFF",
    playerCount: 27,
  },
  {
    id: "tsg-hoffenheim",
    name: "TSG Hoffenheim",
    displayName: "Hoffenheim",
    fullName: "TSG 1899 Hoffenheim",
    apiName: "Hoffenheim",
    logoKey: "TSG Hoffenheim",
    primaryColor: "#1861AC",
    secondaryColor: "#FFFFFF",
    playerCount: 27,
  },
  {
    id: "fc-augsburg",
    name: "FC Augsburg",
    displayName: "Augsburg",
    fullName: "FC Augsburg",
    apiName: "FC Augsburg",
    logoKey: "FC Augsburg",
    primaryColor: "#BA2234",
    secondaryColor: "#FFFFFF",
    playerCount: 27,
  },
  {
    id: "mainz-05",
    name: "Mainz 05",
    displayName: "Mainz",
    fullName: "1. FSV Mainz 05",
    apiName: "Mainz 05",
    logoKey: "Mainz 05",
    primaryColor: "#C4122E",
    secondaryColor: "#FFFFFF",
    playerCount: 27,
  },
  {
    id: "fc-koln",
    name: "FC Köln",
    displayName: "Köln",
    fullName: "1. FC Köln",
    apiName: "FC Koln",
    logoKey: "FC Koln",
    primaryColor: "#DC052D",
    secondaryColor: "#FFFFFF",
    playerCount: 27,
  },
  {
    id: "hamburger-sv",
    name: "Hamburger SV",
    displayName: "Hamburg",
    fullName: "Hamburger SV",
    apiName: "Hamburg",
    logoKey: "Hamburger SV",
    primaryColor: "#0066B2",
    secondaryColor: "#FFFFFF",
    playerCount: 27,
  },
  {
    id: "st-pauli",
    name: "St. Pauli",
    displayName: "St. Pauli",
    fullName: "FC St. Pauli",
    apiName: "St. Pauli",
    logoKey: "St. Pauli",
    primaryColor: "#8B4513",
    secondaryColor: "#FFFFFF",
    playerCount: 27,
  },
  {
    id: "fc-heidenheim",
    name: "FC Heidenheim",
    displayName: "Heidenheim",
    fullName: "1. FC Heidenheim 1846",
    apiName: "FC Heidenheim",
    logoKey: "FC Heidenheim",
    primaryColor: "#DC052D",
    secondaryColor: "#FFFFFF",
    playerCount: 27,
  },
];

export const bundesligaConfig: LeagueConfig = {
  leagueId: "bundesliga",
  leagueName: "Bundesliga",
  teams: bundesligaTeams,
  apiService: "bundesligaApiService",
  imageIndex: "../../../assets/images/bundesliga/index",
};
