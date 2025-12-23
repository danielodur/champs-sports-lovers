// types/match-details/match-details.ts

export interface MatchStats {
  possession: { home: number; away: number };
  attacks: { home: number; away: number };
  dangerousAttacks: { home: number; away: number };
  shotsOnTarget: { home: number; away: number };
  shotsOffTarget: { home: number; away: number };
  corners: { home: number; away: number };
  fouls: { home: number; away: number };
  yellowCards: { home: number; away: number };
  redCards: { home: number; away: number };
  offsides: { home: number; away: number };
  saves: { home: number; away: number };
}

export interface WeatherData {
  temperature: string;
  condition: string;
  humidity: string;
  windSpeed: string;
  pressure: string;
  icon: string;
  city?: string; // City name from API
  stadium?: string; // Stadium name
}

export interface EnhancedWeatherData extends WeatherData {
  visibility: string;
  uvIndex: string;
  feelsLike: string;
}

export interface MatchEvent {
  id: string;
  minute: number;
  team: "home" | "away";
  type:
    | "goal"
    | "yellow_card"
    | "red_card"
    | "corner"
    | "substitution"
    | "commentary";
  player: string;
  description: string;
  icon: string;
}

export interface TeamWithRating {
  name: string;
  logo?: string;
  rank?: number | null;
  corners: number;
  rating?: number;
}

export interface MatchWithRating {
  id: string;
  time: string;
  league: string;
  status: "upcoming" | "live" | "finished";
  home: TeamWithRating;
  away: TeamWithRating;
  score?: string;
  halftimeScore?: string;
  result?: "win" | "draw" | "loss";
  startTime?: string;
  statusText?: string;
  fixture?: {
    status: {
      short: string;
      long: string;
      elapsed: number | null;
    };
  };
  extraTime?: {
    home: number;
    away: number;
  };
  penalties?: {
    home: number;
    away: number;
  };
}

export interface LineupPlayer {
  id: string;
  name: string;
  position: string;
  number: number;
  isStarting: boolean;
  photo?: string;
  grid?: string; // Grid position like "4:2" for tactical positioning
  captain?: boolean; // Captain indicator from API
  age?: number; // Player age from API
}

export interface LineupTeamData {
  formation: string;
  players: LineupPlayer[];
  coach?: {
    id: string;
    name: string;
    photo?: string;
  };
  colors?: {
    primary: string;
    secondary: string;
    text: string;
  };
}

export interface LineupData {
  homeTeam: LineupTeamData;
  awayTeam: LineupTeamData;
}

export interface TeamFormData {
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  form: Array<"W" | "D" | "L">;
}

export interface HalfTimeFullTimeStats {
  homeWinHT_FT: number;
  drawHT_HomeWinFT: number;
  awayWinHT_FT: number;
  homeWinHT_DrawFT: number;
  drawHT_DrawFT: number;
  awayWinHT_DrawFT: number;
  homeWinHT_AwayWinFT: number;
  drawHT_AwayWinFT: number;
  awayWinHT_AwayWinFT: number;
}

export interface HeadToHeadData {
  totalMatches: number;
  homeWins: number;
  draws: number;
  awayWins: number;
  homeGoals: number;
  awayGoals: number;
  recentMatches: Array<{
    date: string;
    homeTeam: string;
    awayTeam: string;
    score: string;
    competition: string;
  }>;
}

export interface InjuredPlayer {
  id: string;
  name: string;
  position: string;
  photo: string;
  injury: string;
  expectedReturn: string;
  severity: "minor" | "moderate" | "serious";
}

export interface TransferPlayer {
  id: string;
  name: string;
  position: string;
  photo: string;
  fromTeam: string;
  toTeam: string;
  transferDate: string;
  fee: string;
  type: "in" | "out";
}

export interface UpcomingMatch {
  id: string;
  date: string;
  opponent: string;
  opponentLogo: string;
  competition: string;
  isHome: boolean;
  daysUntil: number;
}

export interface LeagueStanding {
  position: number;
  points: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}

export interface TeamDataAnalytics {
  recentForm: Array<{
    date: string;
    opponent: string;
    homeTeam: string;
    awayTeam: string;
    score: string;
    halfTimeScore: string;
    result: "win" | "draw" | "loss";
    handicap?: string;
    overUnder: string;
    corners: string;
  }>;
  formStats: {
    wins: number;
    draws: number;
    losses: number;
    goalsFor: number;
    goalsAgainst: number;
    points: number;
  };
  goalTrends: {
    averageGoalsFor: number;
    averageGoalsAgainst: number;
    overUnderTrend: number;
  };
  leagueStanding: LeagueStanding;
}

export interface ComprehensiveTeamData {
  teamName: string;
  teamLogo: string;
  analytics: TeamDataAnalytics;
  upcomingMatches: UpcomingMatch[];
  transfers: TransferPlayer[];
  injuries: InjuredPlayer[];
}

export interface SocialUser {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  level: number;
  isVerified: boolean;
  badges: string[];
  followerCount: number;
  followingCount: number;
  totalLikes: number;
  joinDate: string;
}

export interface PostMedia {
  type: "image" | "video" | "gif";
  url: string;
  description?: string;
  thumbnail?: string;
}

export interface PostComment {
  id: string;
  author: SocialUser;
  content: string;
  timestamp: string;
  likes: number;
  replies?: PostComment[];
}

export interface SocialPost {
  id: string;
  author: SocialUser;
  content: string;
  media?: PostMedia[];
  timestamp: string;
  matchId: string;
  category: "match_discussion" | "prediction" | "analysis" | "celebration";
  likes: number;
  comments: number;
  shares: number;
  isHot: boolean;
  isSticky: boolean;
  tags: string[];
  location?: string;
  engagement: {
    viewCount: number;
    reactionCounts: {
      like: number;
      love: number;
      fire: number;
      trophy: number;
      laugh: number;
    };
  };
}

export interface SocialInteraction {
  userId: string;
  postId: string;
  type: "like" | "comment" | "share" | "react";
  timestamp: string;
  reactionType?: "like" | "love" | "fire" | "trophy" | "laugh";
}
