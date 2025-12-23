/**
 * Player Details Main Screen
 * 
 * Comprehensive player information display with:
 * - Hero section with team color background
 * - Transparent watermark (team logo with player headshot overlay)
 * - Smart hero stats detection
 * - Tab-based navigation
 * - API-ready data structure
 */

import React, { useState, useRef, useMemo, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Animated,
  Dimensions,
  Image,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTheme } from "@/hooks/useTheme";
import { ArrowLeft, Share2, ChevronRight } from "lucide-react-native";
import ShareModal from "../share-modal";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { teamColorService } from "@/services/teamColorService";
import teamLogoService from "@/services/teamLogoService";
import { teamDetailsApi } from "@/services/teamDetailsApiService";
import PlayerDetailsMoments from "./moments/player-details-moments";
import PlayerMoments from "./moments/player-moments";
import PlayerDetailsInfo from "./info/player-details-info";
import PlayerDetailsStats from "./stats/player-details-stats";
import PlayerDetailsMatches from "./matches/player-details-matches";
import PlayerDetailsAbility from "./ability/player-details-ability";
import { mapToBasketballPosition, getBasketballPositionDisplay } from "@/utils/basketball-position-mapper";
import { mapPlayerStats } from "@/utils/basketball-stats-mapper";
import { checkTeamHasData } from "@/utils/basketballTeamDataCheck";

const { width } = Dimensions.get("window");

// Helper function to get country flag URL
const getCountryFlagUrl = (nationality?: string): string | null => {
  if (!nationality) return null;
  
  // Country name to code mapping
  const countryCodeMap: Record<string, string> = {
    "England": "gb-eng",
    "Scotland": "gb-sct",
    "Wales": "gb-wls",
    "Northern Ireland": "gb-nir",
    "United States": "us",
    "South Korea": "kr",
    "Czech Republic": "cz",
    "Bosnia and Herzegovina": "ba",
    "Ivory Coast": "ci",
    "Côte d'Ivoire": "ci",
    "UAE": "ae",
    "Saudi Arabia": "sa",
    "South Africa": "za",
    "Costa Rica": "cr",
    "El Salvador": "sv",
    "Trinidad and Tobago": "tt",
    "Dominican Republic": "do",
  };
  
  // Get country code
  let countryCode = countryCodeMap[nationality];
  
  // If not in map, try to convert to lowercase 2-letter code
  if (!countryCode) {
    // Common countries with simple conversions
    const simpleMap: Record<string, string> = {
      "Spain": "es", "France": "fr", "Germany": "de", "Italy": "it",
      "Portugal": "pt", "Brazil": "br", "Argentina": "ar", "Belgium": "be",
      "Netherlands": "nl", "Croatia": "hr", "Uruguay": "uy", "Colombia": "co",
      "Mexico": "mx", "Switzerland": "ch", "Denmark": "dk", "Sweden": "se",
      "Norway": "no", "Austria": "at", "Poland": "pl", "Turkey": "tr",
      "Morocco": "ma", "Senegal": "sn", "Nigeria": "ng", "Ghana": "gh",
      "Egypt": "eg", "Tunisia": "tn", "Algeria": "dz", "Cameroon": "cm",
      "Japan": "jp", "Australia": "au", "Iran": "ir", "Ukraine": "ua",
      "Serbia": "rs", "Greece": "gr", "Romania": "ro", "Chile": "cl",
      "Peru": "pe", "Ecuador": "ec", "Paraguay": "py", "Venezuela": "ve",
      "Canada": "ca", "Jamaica": "jm", "Panama": "pa", "Honduras": "hn",
      "Finland": "fi", "Ireland": "ie", "Russia": "ru", "Iceland": "is",
    };
    countryCode = simpleMap[nationality];
  }
  
  if (!countryCode) return null;
  
  // Return flagcdn.com URL
  return `https://flagcdn.com/20x15/${countryCode}.png`;
};

interface PlayerData {
  id: string;
  name: string;
  englishName: string;
  photo: string;
  backgroundImage: string;
  age: number;
  height: number;
  weight: number;
  nationality: string;
  nationalityFlag: string;
  position: string;
  preferredFoot: string;
  jerseyNumber: number; // Club team jersey number
  nationalTeamJerseyNumber?: number; // National team jersey number (optional)
  marketValue: number;
  currentTeam: {
    id: string;
    name: string;
    logo: string;
    colors: {
      primary: string;
      secondary: string;
    };
  };
  biography: string;
  birthDate: string;
  birthPlace: string;
  contract: {
    startDate: string;
    endDate: string;
    salary?: number;
  };
  stats: {
    appearances: number;
    goals: number;
    assists: number;
    yellowCards: number;
    redCards: number;
    minutesPlayed: number;
    passAccuracy: number;
    shotsOnTarget: number;
    tackles: number;
    interceptions: number;
  };
  abilities: {
    overall: number;
    pace: number;
    shooting: number;
    passing: number;
    dribbling: number;
    defending: number;
    physical: number;
  };
  detailedAbilities?: any;
  recentMatches: Array<{
    id: string;
    date: string;
    opponent: string;
    opponentLogo: string;
    homeAway: "H" | "A";
    result: string;
    goals: number;
    assists: number;
    rating: number;
    minutesPlayed: number;
  }>;
  moments: Array<{
    id: string;
    title: string;
    summary: string;
    time: string;
    image: string;
    type: "news" | "highlight" | "award" | "transfer";
  }>;
  marketValueHistory?: Array<{
    year: number;
    value: number;
    team: string;
    teamLogo: string;
  }>;
  transferHistory?: Array<{
    id: string;
    date: string;
    fromTeam: string;
    fromTeamLogo: string;
    toTeam: string;
    toTeamLogo: string;
    fee: number;
    type: "transfer" | "loan" | "free" | "contract";
  }>;
  honors?: Array<{
    id: string;
    competition: string;
    competitionLogo: string;
    timesWon: number;
    seasons: Array<{
      year: string;
      team: string;
      teamLogo?: string;
    }>;
  }>;
  strengths?: string[];
  weaknesses?: string[];
}

// Mock data
const mockPlayerData: PlayerData = {
  id: "julian-alvarez",
  name: "Julián Álvarez",
  englishName: "Julian Alvarez",
  photo: "https://img.a.transfermarkt.technology/portrait/big/532826-1659947765.jpg",
  backgroundImage: "https://assets.laliga.com/assets/2023/08/15/medium/1692100234.jpg",
  age: 25,
  height: 170,
  weight: 68,
  nationality: "Argentina",
  nationalityFlag: "🇦🇷",
  position: "Forward",
  preferredFoot: "Right",
  jerseyNumber: 19,
  marketValue: 100.0,
  currentTeam: {
    id: "atletico-madrid",
    name: "Atletico Madrid",
    logo: "https://logos.footyrenders.com/atletico-madrid.png",
    colors: {
      primary: "#CE2029",
      secondary: "#244474",
    },
  },
  biography: "Julián Álvarez is an Argentine professional footballer who plays as a forward for La Liga club Atlético Madrid and the Argentina national team. Known for his pace, versatility, and clinical finishing.",
  birthDate: "31/01/2000",
  birthPlace: "Calchín, Argentina",
  contract: {
    startDate: "2024/08/12",
    endDate: "2030/06/30",
  },
  stats: {
    appearances: 45,
    goals: 23,
    assists: 8,
    yellowCards: 3,
    redCards: 0,
    minutesPlayed: 3780,
    passAccuracy: 85.2,
    shotsOnTarget: 67,
    tackles: 23,
    interceptions: 15,
  },
  abilities: {
    overall: 86,
    pace: 89,
    shooting: 88,
    passing: 82,
    dribbling: 85,
    defending: 45,
    physical: 78,
  },
  recentMatches: [
    {
      id: "match1",
      date: "15/01/2025",
      opponent: "Real Madrid",
      opponentLogo: "https://logos.footyrenders.com/real-madrid.png",
      homeAway: "H",
      result: "2-1 W",
      goals: 1,
      assists: 1,
      rating: 8.5,
      minutesPlayed: 90,
    },
    {
      id: "match2",
      date: "10/01/2025",
      opponent: "Barcelona",
      opponentLogo: "https://logos.footyrenders.com/barcelona.png",
      homeAway: "A",
      result: "1-1 D",
      goals: 0,
      assists: 1,
      rating: 7.8,
      minutesPlayed: 85,
    },
  ],
  moments: [
    {
      id: "moment1",
      title: "5 Goals 3 Assists! Álvarez Wins September Player of the Month Award",
      summary: "Outstanding performance in September makes him the standout player",
      time: "Yesterday",
      image: "https://assets.laliga.com/assets/2023/08/15/medium/1692100234.jpg",
      type: "award",
    },
    {
      id: "moment2",
      title: "Argentina Announces Latest Squad: Messi Leading, Lautaro, Spider in the List",
      summary: "National team call-up for upcoming international fixtures",
      time: "1 day ago",
      image: "https://assets.laliga.com/assets/2023/08/15/medium/1692100235.jpg",
      type: "news",
    },
  ],
};

interface NewsPlayerDetailsProps {
  playerId: string;
  playerData?: PlayerData;
  sport?: string; // ✅ Add sport parameter
}

export default function NewsPlayerDetails({
  playerId,
  playerData: propPlayerData,
  sport = "football", // ✅ Default to football
}: NewsPlayerDetailsProps) {
  const router = useRouter();
  const params = useLocalSearchParams();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [selectedTab, setSelectedTab] = useState("moments");
  const [showShareModal, setShowShareModal] = useState(false);
  
  // ✅ Get sport from params or props
  const activeSport = useMemo(() => {
    return (params.sport as string) || sport || "football";
  }, [params.sport, sport]);
  
  const isBasketball = activeSport === "basketball";
  
  console.log(`🏀⚽ [PlayerDetails] Sport: ${activeSport}, isBasketball: ${isBasketball}`);
  
  // Extract stable primitive values from params to prevent infinite loops
  const paramPlayerId = useMemo(() => params.playerId as string | undefined, [params.playerId]);
  const paramPlayerName = useMemo(() => params.playerName as string | undefined, [params.playerName]);
  const paramSourceTeamName = useMemo(() => params.sourceTeamName as string | undefined, [params.sourceTeamName]);
  const paramSourceTeamLogo = useMemo(() => params.sourceTeamLogo as string | undefined, [params.sourceTeamLogo]);
  
  // Create default empty PlayerData structure - always show template
  const createEmptyPlayerData = (playerId?: string, playerName?: string): PlayerData => ({
    id: playerId || "",
    name: playerName || "Unknown Player",
    englishName: playerName || "Unknown Player",
    photo: "",
    backgroundImage: "",
    age: 0,
    height: 0,
    weight: 0,
    nationality: "",
    nationalityFlag: "",
    position: "",
    preferredFoot: "",
    jerseyNumber: 0, // Club team jersey number
    nationalTeamJerseyNumber: undefined, // National team jersey number (optional)
    marketValue: 0,
    currentTeam: {
      id: "",
      name: "",
      logo: "",
      colors: {
        primary: "#CE2029",
        secondary: "#FFFFFF",
      },
    },
    biography: "",
    birthDate: "",
    birthPlace: "",
    contract: {
      startDate: "",
      endDate: "",
    },
    stats: {
      appearances: 0,
      goals: 0,
      assists: 0,
      yellowCards: 0,
      redCards: 0,
      minutesPlayed: 0,
      passAccuracy: 0,
      shotsOnTarget: 0,
      tackles: 0,
      interceptions: 0,
    },
    abilities: {
      overall: 0,
      pace: 0,
      shooting: 0,
      passing: 0,
      dribbling: 0,
      defending: 0,
      physical: 0,
    },
    recentMatches: [],
    moments: [],
  });
  
  // Get stable player ID and name
  const effectivePlayerId = useMemo(() => playerId || paramPlayerId || "", [playerId, paramPlayerId]);
  const playerNameFromParams = useMemo(() => paramPlayerName, [paramPlayerName]);
  
  // Initialize with prop data if available, otherwise empty structure - always show template
  const initialPlayerData = useMemo(() => {
    if (propPlayerData) {
      return propPlayerData;
    }
    return createEmptyPlayerData(
      effectivePlayerId,
      playerNameFromParams || "Unknown Player"
    );
  }, [propPlayerData, effectivePlayerId, playerNameFromParams]);
  
  const [playerData, setPlayerData] = useState<PlayerData>(initialPlayerData);
  const [isLoadingApi, setIsLoadingApi] = useState(false); // Track API loading separately
  const [error, setError] = useState<string | null>(null);
  const [teamLogoBlocked, setTeamLogoBlocked] = useState(false); // Track if team logo was blocked after load
  const scrollY = useRef(new Animated.Value(0)).current;
  const tabsScrollViewRef = useRef<ScrollView>(null);
  const tabPositionsRef = useRef<{ [key: string]: number }>({});
  const hasUpdatedNameRef = useRef(false); // Track if we've updated name from params
  const hasFetchedRef = useRef<string | null>(null); // Track which playerId we've fetched

  const isDarkMode = theme.colors.background === "#2A2A2A";

  // Reset refs when playerId changes
  useEffect(() => {
    hasUpdatedNameRef.current = false;
    hasFetchedRef.current = null;
    setTeamLogoBlocked(false); // Reset logo blocking state
  }, [effectivePlayerId]);
  
  // Note: Logo URL validation logic moved below after currentTeamLogoUrl is defined

  // Update player name from params if available and data is still empty (only once)
  useEffect(() => {
    if (playerNameFromParams && !hasUpdatedNameRef.current) {
      setPlayerData(prev => {
        // Only update if name is still "Unknown Player" or empty
        if (prev.name === "Unknown Player" || !prev.name) {
          hasUpdatedNameRef.current = true;
          return {
            ...prev,
            name: playerNameFromParams,
            englishName: playerNameFromParams,
          };
        }
        return prev; // Return unchanged if already set
      });
    }
  }, [playerNameFromParams]); // Only depend on playerNameFromParams to prevent infinite loop

  // Fetch player data from API in background - always show template
  useEffect(() => {
    // Prevent multiple fetches for the same playerId
    if (hasFetchedRef.current === effectivePlayerId) {
      return;
    }
    
    if (propPlayerData) {
      // If playerData is provided as prop, use it
      setPlayerData(propPlayerData);
      setIsLoadingApi(false);
      hasFetchedRef.current = effectivePlayerId;
      return;
    }

    if (!effectivePlayerId) {
      console.warn(`⚠️ [PlayerDetails] No player ID provided - showing empty template`);
      setIsLoadingApi(false);
      hasFetchedRef.current = effectivePlayerId; // Mark as fetched even if empty
      return;
    }
    
    // Fetch real API data in background - template already showing
    hasFetchedRef.current = effectivePlayerId;

    const fetchPlayerData = async () => {
      try {
        setIsLoadingApi(true);
        setError(null);

        const numericPlayerId = parseInt(effectivePlayerId);
        if (isNaN(numericPlayerId) || numericPlayerId <= 0) {
          console.warn(`⚠️ [PlayerDetails] Invalid player ID: ${effectivePlayerId} - showing empty template`);
          setIsLoadingApi(false);
          return; // Don't throw error - just show empty template
        }

        console.log(`🔍 [PlayerDetails] Fetching data for player ID: ${numericPlayerId}`);

        const currentSeason = new Date().getFullYear();
        
        // Try to get player data from current season first
        let apiData = await teamDetailsApi.getPlayerDetails(numericPlayerId, currentSeason, activeSport); // ✅ CRITICAL: Pass sport
        
        // If no data for current season, try previous season
        if (!apiData) {
          const prevSeason = currentSeason - 1;
          console.log(`⚠️ [PlayerDetails] No data for ${currentSeason}, trying ${prevSeason}...`);
          apiData = await teamDetailsApi.getPlayerDetails(numericPlayerId, prevSeason, activeSport); // ✅ CRITICAL: Pass sport
        }
        
        // If still no data, try one more season back
        if (!apiData) {
          const prevPrevSeason = currentSeason - 2;
          console.log(`⚠️ [PlayerDetails] No data for ${currentSeason - 1}, trying ${prevPrevSeason}...`);
          apiData = await teamDetailsApi.getPlayerDetails(numericPlayerId, prevPrevSeason, activeSport); // ✅ CRITICAL: Pass sport
        }
        
        if (!apiData) {
          // Don't throw error - just log and keep empty template
          console.warn(`⚠️ [PlayerDetails] Player not found (ID: ${numericPlayerId}) - showing empty template. Future API integrations (e.g., Sportradar) will populate this data.`);
          setIsLoadingApi(false);
          return;
        }

        const { player, statistics } = apiData;
        
        // Log raw API response to debug jersey numbers
        console.log(`🔍 [PlayerDetails] Raw API response for ${player?.name}:`, {
          statisticsCount: statistics?.length || 0,
          sampleStats: statistics?.[0] ? {
            team: statistics[0].team?.name,
            league: statistics[0].league?.name,
            season: statistics[0].league?.season,
            gamesKeys: Object.keys(statistics[0].games || {}),
          } : null,
        });
        
        // Filter and get the most relevant statistics
        // Priority: 1) Current season CLUB stats (not national team), 2) Most recent CLUB season, 3) First available CLUB stats
        // Note: currentSeason is already declared above, reusing it
        let latestStats = null;
        let nationalTeamStats = null;
        let clubJerseyNumber: number | null = null;
        let nationalJerseyNumber: number | null = null;
        let clubStats: any[] = []; // Declare outside if block for use in transfer detection
        let nationalStats: any[] = []; // Declare outside if block
        
        if (statistics && statistics.length > 0) {
          console.log(`📊 [PlayerDetails] Found ${statistics.length} statistics entries for player ${playerId}`);
          
          // Separate club stats from national team stats
          // National teams usually have league names like "World Cup", "Euro", "Copa America", etc.
          // Or league.country matches player nationality
          clubStats = statistics.filter((stat: any) => {
            const leagueName = stat?.league?.name?.toLowerCase() || '';
            const leagueCountry = stat?.league?.country?.toLowerCase() || '';
            const playerNationalityLower = (player?.nationality || '').toLowerCase();
            
            // Filter out national team competitions
            const isNationalTeam = 
              leagueName.includes('world cup') ||
              leagueName.includes('euro') ||
              leagueName.includes('copa america') ||
              leagueName.includes('africa cup') ||
              leagueName.includes('asian cup') ||
              leagueName.includes('nations league') ||
              leagueName.includes('qualifying') ||
              (leagueCountry === playerNationalityLower && !leagueName.includes('league') && !leagueName.includes('premier') && !leagueName.includes('serie') && !leagueName.includes('liga'));
            
            return !isNationalTeam;
          });
          
          nationalStats = statistics.filter((stat: any) => {
            const leagueName = stat?.league?.name?.toLowerCase() || '';
            const leagueCountry = stat?.league?.country?.toLowerCase() || '';
            const playerNationalityLower = (player?.nationality || '').toLowerCase();
            
            const isNationalTeam = 
              leagueName.includes('world cup') ||
              leagueName.includes('euro') ||
              leagueName.includes('copa america') ||
              leagueName.includes('africa cup') ||
              leagueName.includes('asian cup') ||
              leagueName.includes('nations league') ||
              leagueName.includes('qualifying') ||
              (leagueCountry === playerNationalityLower && !leagueName.includes('league') && !leagueName.includes('premier') && !leagueName.includes('serie') && !leagueName.includes('liga'));
            
            return isNationalTeam;
          });
          
          console.log(`🏆 [PlayerDetails] Club stats: ${clubStats.length}, National team stats: ${nationalStats.length}`);
          
          // Get most recent national team stats
          if (nationalStats.length > 0) {
            const sortedNationalStats = nationalStats
              .filter((stat: any) => stat?.league?.season)
              .sort((a: any, b: any) => (b.league.season || 0) - (a.league.season || 0));
            nationalTeamStats = sortedNationalStats[0] || nationalStats[0];
            
            // Try to find jersey number from national team stats (check all entries)
            for (const stat of nationalStats) {
              if (stat?.games?.number && stat.games.number > 0) {
                nationalJerseyNumber = stat.games.number;
                break;
              }
            }
            
            console.log(`🌍 [PlayerDetails] National team stats: ${nationalTeamStats?.team?.name || 'N/A'}, Season: ${nationalTeamStats?.league?.season || 'N/A'}, Jersey: ${nationalJerseyNumber || nationalTeamStats?.games?.number || 'N/A'}`);
          }
          
          // CRITICAL: Always prioritize CURRENT season (2025) for up-to-date team info
          // Sort club stats: current season first, then most recent
          const sortedClubStats = clubStats
            .filter((stat: any) => stat?.league?.season)
            .sort((a: any, b: any) => {
              // Prioritize current season
              const aIsCurrent = a.league.season === currentSeason;
              const bIsCurrent = b.league.season === currentSeason;
              if (aIsCurrent && !bIsCurrent) return -1;
              if (!aIsCurrent && bIsCurrent) return 1;
              // Then sort by season (most recent first)
              return (b.league.season || 0) - (a.league.season || 0);
            });
          
          // Use the first sorted stat (current season if available, otherwise most recent)
          latestStats = sortedClubStats[0] || clubStats[0];
          
          if (latestStats) {
            const selectedSeason = latestStats?.league?.season || "unknown";
            const isCurrentSeason = selectedSeason === currentSeason;
            console.log(`✅ [PlayerDetails] Using ${isCurrentSeason ? 'CURRENT' : 'MOST RECENT'} CLUB season (${selectedSeason}) statistics`, {
              team: latestStats?.team?.name || "Unknown",
              teamId: latestStats?.team?.id || "Unknown",
              league: latestStats?.league?.name || "Unknown",
              isCurrentSeason,
            });
            
            // WARNING: If not using current season, log it prominently
            if (!isCurrentSeason) {
              console.warn(`⚠️ [PlayerDetails] WARNING: Using ${selectedSeason} season data (not current ${currentSeason}). Player's current team may be outdated!`);
            }
          }
          
          // Try to find jersey number from club stats (STRICTLY prioritize current season)
          // First pass: Only current season
          for (const stat of clubStats) {
            if (stat?.league?.season === currentSeason && stat?.games?.number && stat.games.number > 0) {
              clubJerseyNumber = stat.games.number;
              console.log(`✅ [PlayerDetails] Found current season (${currentSeason}) jersey number: ${clubJerseyNumber}`);
              break;
            }
          }
          
          // Second pass: Fallback to most recent season only if current season not found
          if (!clubJerseyNumber || clubJerseyNumber === 0) {
            const sortedForJersey = clubStats
              .filter((stat: any) => stat?.games?.number && stat.games.number > 0)
              .sort((a: any, b: any) => (b.league.season || 0) - (a.league.season || 0));
            
            if (sortedForJersey.length > 0) {
              clubJerseyNumber = sortedForJersey[0].games.number;
              console.log(`⚠️ [PlayerDetails] Using jersey number from ${sortedForJersey[0].league.season} season: ${clubJerseyNumber} (current season ${currentSeason} not available)`);
            }
          }
          
          // Log filtered stats summary
          if (latestStats) {
            console.log(`📈 [PlayerDetails] Filtered CLUB stats:`, {
              team: latestStats?.team?.name || "Unknown",
              league: latestStats?.league?.name || "Unknown",
              season: latestStats?.league?.season || "Unknown",
              jerseyNumberFromLatest: latestStats?.games?.number || 0,
              jerseyNumberFromAll: clubJerseyNumber || 0,
              appearances: latestStats?.games?.appearences || 0,
              goals: latestStats?.goals?.total || 0,
              assists: latestStats?.goals?.assists || 0,
            });
          }
        } else {
          console.warn(`⚠️ [PlayerDetails] No statistics found for player ${playerId}`);
        }

        // CRITICAL: Always fetch from CURRENT season team squad to ensure up-to-date data
        // This ensures we get the player's CURRENT team and jersey number, not former team
        let verifiedCurrentTeam = false;
        let currentTeamFromSquad = null;
        let contractEndDate = ""; // Declare contractEndDate in outer scope
        
        // Declare team variables early (before first use) to avoid "used before declaration" errors
        const rawTeamName = latestStats?.team?.name || "";
        const rawTeamLogo = latestStats?.team?.logo || "";
        const rawTeamId = latestStats?.team?.id || "";
        const playerNationality = player?.nationality || "";
        let finalTeamName = rawTeamName;
        let finalTeamLogo = rawTeamLogo;
        let finalTeamId: string = rawTeamId ? rawTeamId.toString() : "";
        
        if (latestStats?.team?.id) {
          try {
            console.log(`🔍 [PlayerDetails] STEP 1: Verifying team ${latestStats.team.id} (${latestStats.team.name}) for CURRENT season (${currentSeason})...`);
            console.log(`🔍 [PlayerDetails] Player ID: ${numericPlayerId}, Player Name: ${player?.name}`);
            
            const currentTeamSquad = await teamDetailsApi.getTeamSquad(latestStats.team.id, currentSeason, activeSport); // ✅ CRITICAL: Pass sport
            console.log(`📊 [PlayerDetails] Team squad size: ${currentTeamSquad.length} players`);
            
            const squadPlayer = currentTeamSquad.find((p: any) => p.id === numericPlayerId);
            
            // Try to fetch contract expiry date from API for current team
            try {
              contractEndDate = await teamDetailsApi.getPlayerContractEndDate(numericPlayerId, latestStats.team.id);
            } catch (contractError) {
              console.warn(`⚠️ [PlayerDetails] Could not fetch contract data:`, contractError);
            }
            
            if (squadPlayer) {
              // Player found in current squad - this is their CURRENT team
              verifiedCurrentTeam = true;
              currentTeamFromSquad = {
                id: latestStats.team.id,
                name: latestStats.team.name,
                logo: latestStats.team.logo,
              };
              
              if (squadPlayer.number && squadPlayer.number > 0) {
                clubJerseyNumber = squadPlayer.number;
                console.log(`✅ [PlayerDetails] VERIFIED: Player is in CURRENT team. Updated jersey number to ${clubJerseyNumber}`);
              }
              console.log(`✅ [PlayerDetails] VERIFIED: Player ${player?.name} is in ${latestStats.team.name}'s CURRENT season (${currentSeason}) squad`);
            } else {
              // Player NOT in this team's current squad - they have TRANSFERRED
              // This is expected behavior - we'll search for their current team
              console.log(`ℹ️ [PlayerDetails] Transfer detected: Player ${player?.name} not in ${latestStats.team.name}'s current season (${currentSeason}) squad.`);
              console.log(`ℹ️ [PlayerDetails] Searching for player's current team...`);
              
              // Strategy 1: Check if there's a MORE RECENT season with a different team
              // Sort all club stats by season (most recent first) and check each team
              console.log(`🔍 [PlayerDetails] STEP 2: Searching for player in teams from MOST RECENT seasons...`);
              const allTeamsToCheck = clubStats
                .filter((stat: any) => stat?.team?.id)
                .map((stat: any) => ({
                  teamId: stat.team.id,
                  teamName: stat.team.name,
                  teamLogo: stat.team.logo,
                  season: stat.league?.season || 0,
                }))
                // Remove duplicates, keep most recent entry per team
                .reduce((acc: any[], curr: any) => {
                  const existing = acc.find((t: any) => t.teamId === curr.teamId);
                  if (!existing || curr.season > existing.season) {
                    return [...acc.filter((t: any) => t.teamId !== curr.teamId), curr];
                  }
                  return acc;
                }, [])
                // Sort by season (most recent first)
                .sort((a: any, b: any) => b.season - a.season);
              
              console.log(`📋 [PlayerDetails] Found ${allTeamsToCheck.length} unique teams to check:`, allTeamsToCheck.map((t: any) => `${t.teamName} (${t.season})`));
              
              // Check each team's current squad (prioritize teams from more recent seasons)
              for (const teamInfo of allTeamsToCheck) {
                if (teamInfo.teamId === latestStats.team.id) {
                  continue; // Skip the team we already checked
                }
                
                try {
                  console.log(`🔍 [PlayerDetails] Checking team ${teamInfo.teamId} (${teamInfo.teamName}) from season ${teamInfo.season}...`);
                  const otherTeamSquad = await teamDetailsApi.getTeamSquad(teamInfo.teamId, currentSeason, activeSport); // ✅ CRITICAL: Pass sport
                  const foundInOtherTeam = otherTeamSquad.find((p: any) => p.id === numericPlayerId);
                  
                  if (foundInOtherTeam) {
                    console.log(`✅ [PlayerDetails] FOUND CURRENT TEAM: ${teamInfo.teamName} (ID: ${teamInfo.teamId})`);
                    currentTeamFromSquad = {
                      id: teamInfo.teamId,
                      name: teamInfo.teamName,
                      logo: teamInfo.teamLogo,
                    };
                    if (foundInOtherTeam.number && foundInOtherTeam.number > 0) {
                      clubJerseyNumber = foundInOtherTeam.number;
                      console.log(`✅ [PlayerDetails] Updated jersey number to ${clubJerseyNumber} from current team`);
                    }
                    // Try to fetch contract expiry date for the found current team
                    try {
                      const foundContractDate = await teamDetailsApi.getPlayerContractEndDate(numericPlayerId, teamInfo.teamId);
                      if (foundContractDate) {
                        contractEndDate = foundContractDate;
                      }
                    } catch (contractError) {
                      console.warn(`⚠️ [PlayerDetails] Could not fetch contract data for found team:`, contractError);
                    }
                    verifiedCurrentTeam = true;
                    break; // Found current team, stop searching
                  }
                } catch (err) {
                  console.warn(`⚠️ [PlayerDetails] Failed to check team ${teamInfo.teamId}:`, err);
                }
              }
              
              // Strategy 2: If still not found, use the MOST RECENT season's team (even if not current)
              // This is better than using an old team
              if (!verifiedCurrentTeam && allTeamsToCheck.length > 0) {
                const mostRecentTeam = allTeamsToCheck[0];
                console.warn(`⚠️ [PlayerDetails] Could not verify player in any current squad. Using MOST RECENT team from statistics: ${mostRecentTeam.teamName} (season ${mostRecentTeam.season})`);
                console.warn(`⚠️ [PlayerDetails] NOTE: This may still be outdated if player transferred to a team not in their statistics.`);
                
                // Use the most recent team as fallback
                currentTeamFromSquad = {
                  id: mostRecentTeam.teamId,
                  name: mostRecentTeam.teamName,
                  logo: mostRecentTeam.teamLogo,
                };
                verifiedCurrentTeam = true; // Mark as verified to use this team
              }
              
              // Strategy 3: If we still don't have a team, use the most recent stats team
              // This ensures we always have SOME team data, even if outdated
              if (!verifiedCurrentTeam && latestStats?.team) {
                console.warn(`⚠️ [PlayerDetails] Using team from most recent statistics as final fallback: ${latestStats.team.name}`);
                currentTeamFromSquad = {
                  id: latestStats.team.id,
                  name: latestStats.team.name,
                  logo: latestStats.team.logo,
                };
                verifiedCurrentTeam = true;
              }
              
              if (!verifiedCurrentTeam) {
                console.warn(`⚠️ [PlayerDetails] Could not verify player in any current squad. Will use most recent team from statistics.`);
              }
            }
          } catch (error) {
            console.warn(`⚠️ [PlayerDetails] Failed to fetch current season team squad (will use statistics data):`, error);
          }
        }
        
        // ALWAYS update team info if we have a verified team (even if from fallback)
        // This ensures we use the most recent/current team data available
        if (currentTeamFromSquad && verifiedCurrentTeam) {
          const previousTeamInfo = { name: finalTeamName, id: finalTeamId };
          finalTeamName = currentTeamFromSquad.name;
          finalTeamLogo = currentTeamFromSquad.logo || finalTeamLogo;
          finalTeamId = currentTeamFromSquad.id.toString();
          
          console.log(`🔄 [PlayerDetails] UPDATING team info:`, {
            from: previousTeamInfo,
            to: currentTeamFromSquad,
          });
          
          // Also update latestStats to reflect the new team for consistency
          if (latestStats) {
            latestStats.team = {
              id: currentTeamFromSquad.id,
              name: currentTeamFromSquad.name,
              logo: currentTeamFromSquad.logo || latestStats.team.logo,
            };
          }
        } else if (latestStats?.team && !verifiedCurrentTeam) {
          // If verification failed but we have stats, use the most recent stats team
          console.log(`🔄 [PlayerDetails] Using team from most recent statistics (verification failed):`, latestStats.team.name);
          finalTeamName = latestStats.team.name;
          finalTeamLogo = latestStats.team.logo || finalTeamLogo;
          finalTeamId = latestStats.team.id.toString();
        }

        // Helper function to safely parse height
        const parseHeight = (heightStr: string | null | undefined): number => {
          if (!heightStr) return 0;
          // Handle formats: "175 cm", "175cm", "175", etc.
          const cleaned = heightStr.toString().replace(/\s*cm\s*/gi, "").trim();
          const parsed = parseInt(cleaned, 10);
          return isNaN(parsed) ? 0 : parsed;
        };

        // Helper function to safely parse weight
        const parseWeight = (weightStr: string | null | undefined): number => {
          if (!weightStr) return 0;
          // Handle formats: "75 kg", "75kg", "75", etc.
          const cleaned = weightStr.toString().replace(/\s*kg\s*/gi, "").trim();
          const parsed = parseInt(cleaned, 10);
          return isNaN(parsed) ? 0 : parsed;
        };

        // Safely extract numeric values with proper fallbacks
        const safeNumber = (value: number | null | undefined, fallback: number = 0): number => {
          if (value === null || value === undefined || isNaN(value)) return fallback;
          return typeof value === 'number' ? value : fallback;
        };

        // Calculate player abilities from statistics
        const calculateAbilities = (stats: any, position: string) => {
          if (!stats) {
            // Return default values if no stats available
            return {
              overall: 50,
              pace: 50,
              shooting: 50,
              passing: 50,
              dribbling: 50,
              defending: 50,
              physical: 50,
            };
          }
          
          const appearances = safeNumber(stats?.games?.appearences);
          const minutes = safeNumber(stats?.games?.minutes);
          const goals = safeNumber(stats?.goals?.total);
          const assists = safeNumber(stats?.goals?.assists);
          const passAccuracy = safeNumber(stats?.passes?.accuracy);
          const shotsOnTarget = safeNumber(stats?.shots?.on);
          const tackles = safeNumber(stats?.tackles?.total);
          const duels = safeNumber(stats?.duels?.total);
          const duelsWon = safeNumber(stats?.duels?.won || 0);
          
          // Parse rating if available (e.g., "7.5" -> 7.5)
          const ratingStr = stats?.games?.rating || "0";
          const rating = parseFloat(ratingStr) || 0;
          
          // Base calculations (0-100 scale)
          // Shooting: Based on goals per appearance and shots on target
          const goalsPerAppearance = appearances > 0 ? (goals / appearances) * 10 : 0;
          const shotsAccuracy = shotsOnTarget > 0 ? Math.min((shotsOnTarget / Math.max(goals, 1)) * 20, 100) : 0;
          const shooting = Math.min(Math.round((goalsPerAppearance * 5) + (shotsAccuracy * 0.5) + (rating * 5)), 100);
          
          // Passing: Based on pass accuracy and assists
          const passing = Math.min(Math.round((passAccuracy * 0.8) + (assists * 3) + (rating * 4)), 100);
          
          // Dribbling: Based on assists and position (attackers get higher base)
          const isAttacker = position?.toUpperCase().includes("F") || position?.toUpperCase().includes("W") || position?.toUpperCase().includes("M");
          const dribblingBase = isAttacker ? 50 : 40;
          const dribbling = Math.min(Math.round(dribblingBase + (assists * 2) + (rating * 3)), 100);
          
          // Defending: Based on tackles and position (defenders get higher base)
          const isDefender = position?.toUpperCase().includes("D") || position?.toUpperCase().includes("B");
          const defendingBase = isDefender ? 60 : 40;
          const tacklesPerAppearance = appearances > 0 ? (tackles / appearances) * 5 : 0;
          const defending = Math.min(Math.round(defendingBase + tacklesPerAppearance + (rating * 3)), 100);
          
          // Physical: Based on duels won, minutes played, and position
          const duelsWinRate = duels > 0 ? (duelsWon / duels) * 100 : 50;
          const minutesPerAppearance = appearances > 0 ? minutes / appearances : 0;
          const stamina = minutesPerAppearance > 60 ? 70 : minutesPerAppearance > 45 ? 60 : 50;
          const physical = Math.min(Math.round((duelsWinRate * 0.4) + stamina + (rating * 2)), 100);
          
          // Pace: Based on position (wingers/forwards typically faster) and assists
          const paceBase = isAttacker ? 65 : isDefender ? 50 : 55;
          const pace = Math.min(Math.round(paceBase + (assists * 1.5) + (rating * 2)), 100);
          
          // Overall: Average of all abilities
          const overall = Math.round((shooting + passing + dribbling + defending + physical + pace) / 6);
          
          return {
            overall: Math.max(overall, 40), // Minimum 40
            pace: Math.max(pace, 40),
            shooting: Math.max(shooting, 40),
            passing: Math.max(passing, 40),
            dribbling: Math.max(dribbling, 40),
            defending: Math.max(defending, 40),
            physical: Math.max(physical, 40),
          };
        };

        // Transform API data to PlayerData format with proper filtering
        const position = latestStats?.games?.position || "Unknown";
        const calculatedAbilities = calculateAbilities(latestStats, position);
        
        // Check if team name needs to be updated from CLUB statistics (skip if already set from squad verification)
        if (!rawTeamName || rawTeamName === playerNationality || rawTeamName.toLowerCase() === playerNationality.toLowerCase()) {
          // Check if we have team info from CLUB statistics array (not national team)
          const clubStats = statistics?.filter((stat: any) => {
            const leagueName = stat?.league?.name?.toLowerCase() || '';
            return !leagueName.includes('world cup') && 
                   !leagueName.includes('euro') && 
                   !leagueName.includes('copa america') &&
                   !leagueName.includes('africa cup') &&
                   !leagueName.includes('nations league');
          });
          
          const teamFromStats = clubStats?.find((stat: any) => 
            stat?.team?.name && 
            stat?.team?.name !== playerNationality &&
            stat?.team?.name.toLowerCase() !== playerNationality.toLowerCase()
          );
          
          if (teamFromStats?.team?.name) {
            finalTeamName = teamFromStats.team.name;
            finalTeamLogo = teamFromStats.team.logo || finalTeamLogo;
            finalTeamId = teamFromStats.team.id?.toString() || finalTeamId;
            console.log(`🔄 [PlayerDetails] Using alternative team: ${finalTeamName} (original was ${rawTeamName})`);
          } else {
            // Last resort: use "Unknown Team" but log it
            finalTeamName = "Unknown Team";
            console.warn(`⚠️ [PlayerDetails] Team name missing or same as nationality for ${player?.name}. Team: ${rawTeamName}, Nationality: ${playerNationality}`);
          }
        }
        
        console.log(`🏆 [PlayerDetails] Final team info:`, {
          name: finalTeamName,
          logo: finalTeamLogo,
          id: finalTeamId,
          jerseyNumber: clubJerseyNumber || latestStats?.games?.number || 0,
          season: latestStats?.league?.season || 'N/A',
          isCurrentSeason: latestStats?.league?.season === currentSeason,
          league: latestStats?.league?.name || 'N/A',
          warning: latestStats?.league?.season !== currentSeason ? `⚠️ Using ${latestStats?.league?.season} season data (not current ${currentSeason})` : '✅ Using current season data',
        });
        
        console.log(`🎯 [PlayerDetails] Calculated abilities for ${player?.name}:`, {
          position,
          abilities: calculatedAbilities,
          nationality: playerNationality,
          teamName: finalTeamName,
          stats: {
            appearances: latestStats?.games?.appearences,
            goals: latestStats?.goals?.total,
            assists: latestStats?.goals?.assists,
            passAccuracy: latestStats?.passes?.accuracy,
            tackles: latestStats?.tackles?.total,
            rating: latestStats?.games?.rating,
          }
        });
        
        const transformedData: PlayerData = {
          id: player?.id?.toString() || "",
          name: player?.name || "Unknown Player",
          englishName: `${player?.firstname || ""} ${player?.lastname || ""}`.trim() || player?.name || "Unknown Player",
          photo: player?.photo || "",
          backgroundImage: "",
          age: safeNumber(player?.age),
          height: parseHeight(player?.height),
          weight: parseWeight(player?.weight),
          nationality: playerNationality,
          nationalityFlag: "",
          position: position,
          preferredFoot: "",
          jerseyNumber: clubJerseyNumber !== null ? clubJerseyNumber : safeNumber(latestStats?.games?.number), // Club team jersey number (from all stats or latest)
          nationalTeamJerseyNumber: nationalJerseyNumber !== null ? nationalJerseyNumber : (nationalTeamStats ? safeNumber(nationalTeamStats?.games?.number) : undefined), // National team jersey number
          marketValue: 0, // Will be set by PlayerNetworthChanges component
          currentTeam: {
            id: finalTeamId || "",
            name: finalTeamName,
            logo: finalTeamLogo || "",
            colors: {
              primary: "#CE2029",
              secondary: "#FFFFFF",
            },
          },
          biography: "",
          birthDate: player?.birth?.date || "",
          birthPlace: player?.birth?.place || "",
          contract: {
            startDate: "",
            endDate: contractEndDate || "",
          },
          stats: {
            appearances: safeNumber(latestStats?.games?.appearences),
            goals: safeNumber(latestStats?.goals?.total),
            assists: safeNumber(latestStats?.goals?.assists),
            yellowCards: safeNumber(latestStats?.cards?.yellow),
            redCards: safeNumber(latestStats?.cards?.red),
            minutesPlayed: safeNumber(latestStats?.games?.minutes),
            passAccuracy: safeNumber(latestStats?.passes?.accuracy),
            shotsOnTarget: safeNumber(latestStats?.shots?.on),
            tackles: safeNumber(latestStats?.tackles?.total),
            interceptions: 0, // Not available in API response
          },
          abilities: calculatedAbilities,
          recentMatches: [],
          moments: [],
        };

        // Update with real API data when ready - template already showing
        setPlayerData(transformedData);
        setIsLoadingApi(false);
      } catch (err) {
        // Don't show error screen - just log and keep empty template
        console.warn("⚠️ [PlayerDetails] Error fetching player data:", err);
        console.log("📋 [PlayerDetails] Template will remain visible with empty data. Future API integrations (e.g., Sportradar) will populate this data.");
        // Keep empty template - UI already showing it
        setIsLoadingApi(false);
      }
    };

    // Load API data in background - template already showing
    fetchPlayerData();
  }, [effectivePlayerId, propPlayerData]); // Use stable effectivePlayerId instead of params object

  // Always use playerData - template is always visible
  const displayData = playerData;
  
  // Get team colors using teamColorService (like team-details does)
  const teamColors = teamColorService.getTeamColors(displayData.currentTeam.name);
  
  // Helper function to check if a URL is a country flag (not a team logo)
  const isCountryFlagUrl = (url: string | undefined | null): boolean => {
    if (!url) return false;
    const urlLower = url.toLowerCase();
    // Check for common country flag URL patterns - be more aggressive
    return (
      urlLower.includes('flagcdn.com') ||
      urlLower.includes('/flag') ||
      urlLower.includes('flag/') ||
      urlLower.includes('flags/') ||
      urlLower.includes('/country') ||
      urlLower.includes('country/') ||
      urlLower.includes('national') ||
      urlLower.match(/\/flags?\/|\/country\//) !== null ||
      // Check if URL ends with country code patterns (e.g., .png/gh.png, .png/ng.png)
      urlLower.match(/\/[a-z]{2}\.png$/) !== null ||
      // Check for common flag image dimensions (20x15, 16x12, etc. - typical flag aspect ratios)
      urlLower.match(/\/(20x15|16x12|32x24|40x30|64x48|128x96)\.png/) !== null
    );
  };

  // Get source team info from navigation params (team user navigated from) - use memoized values
  const sourceTeamName = paramSourceTeamName;
  const sourceTeamLogo = paramSourceTeamLogo;
  
  // Validate source team logo - reject if it's a country flag
  const validSourceTeamLogo = sourceTeamLogo && !isCountryFlagUrl(sourceTeamLogo) ? sourceTeamLogo : undefined;
  
  // Use source team logo for watermark if available and valid (user navigated from team-details)
  // Otherwise fall back to player's current team logo (but validate it's not a country flag)
  const watermarkTeamName = sourceTeamName || displayData.currentTeam.name;
  const rawWatermarkLogo = validSourceTeamLogo || displayData.currentTeam.logo;
  const watermarkTeamLogo = rawWatermarkLogo && !isCountryFlagUrl(rawWatermarkLogo) ? rawWatermarkLogo : undefined;
  
  console.log(`🎨 [PlayerDetails] Watermark team:`, {
    sourceTeamName,
    sourceTeamLogo,
    validSourceTeamLogo,
    watermarkTeamName,
    watermarkTeamLogo,
    currentTeamName: displayData.currentTeam.name,
    currentTeamLogo: displayData.currentTeam.logo,
    isCurrentTeamLogoFlag: isCountryFlagUrl(displayData.currentTeam.logo),
    playerName: displayData.name,
  });
  
  // Get official team logo using teamLogoService for watermark
  // Only pass valid team logo (not country flag) to the service
  const rawTeamLogoUrl = teamLogoService.getOfficialTeamLogo(
    watermarkTeamName,
    undefined,
    watermarkTeamLogo // This will be undefined if it was a country flag
  );
  
  // Final validation: Ensure the logo service didn't return a country flag
  const teamLogoUrl = rawTeamLogoUrl && !isCountryFlagUrl(rawTeamLogoUrl)
    ? rawTeamLogoUrl
    : undefined; // Don't use if it's still a country flag
  
  console.log(`🎨 [PlayerDetails] Watermark logo validation:`, {
    watermarkTeamName,
    watermarkTeamLogo,
    serviceLogo: rawTeamLogoUrl,
    finalLogo: teamLogoUrl,
    isServiceLogoFlag: isCountryFlagUrl(rawTeamLogoUrl),
  });
  
  // Get team logo for the team info section (always use current team)
  // CRITICAL: If API logo is a country flag, don't pass it to the service
  // Let the service find the correct team logo from its database instead
  const nationalityFlagUrl = getCountryFlagUrl(displayData.nationality);
  const isApiLogoSameAsNationalityFlag = nationalityFlagUrl && displayData.currentTeam.logo === nationalityFlagUrl;
  const isApiLogoAFlag = displayData.currentTeam.logo && isCountryFlagUrl(displayData.currentTeam.logo);
  
  // Only pass API logo to service if it's valid and NOT a country flag
  // If it's a flag, pass undefined so service uses its database
  const validApiLogoForService = displayData.currentTeam.logo && 
                                  !isApiLogoAFlag && 
                                  !isApiLogoSameAsNationalityFlag
    ? displayData.currentTeam.logo
    : undefined; // Don't pass flag URLs to service - let it find correct logo
  
  // Get team logo from service - service will use its database if API logo is invalid
  const rawCurrentTeamLogoUrl = teamLogoService.getOfficialTeamLogo(
    displayData.currentTeam.name,
    undefined,
    validApiLogoForService // Only pass valid team logo, never a country flag
  );
  
  // Final validation: Ensure the logo service didn't return a country flag
  // Also check if it matches the nationality flag URL
  const isServiceLogoSameAsNationalityFlag = nationalityFlagUrl && rawCurrentTeamLogoUrl === nationalityFlagUrl;
  const isServiceLogoAFlag = rawCurrentTeamLogoUrl && isCountryFlagUrl(rawCurrentTeamLogoUrl);
  
  // Additional check: If logo URL contains the country code from nationality flag, it might be a flag
  const countryCodeFromFlagForValidation = nationalityFlagUrl?.split('/').pop()?.split('.')[0] || '';
  const logoContainsCountryCode = countryCodeFromFlagForValidation && 
    rawCurrentTeamLogoUrl && 
    (rawCurrentTeamLogoUrl.includes(`/${countryCodeFromFlagForValidation}.`) || 
     rawCurrentTeamLogoUrl.includes(`/${countryCodeFromFlagForValidation}/`) ||
     rawCurrentTeamLogoUrl.includes(`/${countryCodeFromFlagForValidation}-`));
  
  // CRITICAL: Check if the API logo URL matches the nationality flag URL
  // Sometimes API returns country flag URLs that don't match our patterns
  const apiLogoMatchesNationalityFlag = nationalityFlagUrl && 
    displayData.currentTeam.logo && 
    displayData.currentTeam.logo === nationalityFlagUrl;
  
  // Also check if the service logo matches nationality flag (double check)
  const serviceLogoMatchesNationalityFlag = nationalityFlagUrl && 
    rawCurrentTeamLogoUrl && 
    rawCurrentTeamLogoUrl === nationalityFlagUrl;
  
  // Extract team ID from logo URL to validate it's correct
  // Team IDs: Tottenham=47, Bournemouth=35, etc.
  // If API returns wrong team ID (like 1504 for both), it might be a flag
  const teamIdFromLogoUrl = rawCurrentTeamLogoUrl?.match(/\/teams\/(\d+)\.png/)?.[1];
  const expectedTeamIds: Record<string, number> = {
    'Tottenham': 47,
    'Bournemouth': 35,
    'AFC Bournemouth': 35,
  };
  const expectedTeamId = expectedTeamIds[displayData.currentTeam.name];
  const hasWrongTeamId = expectedTeamId && teamIdFromLogoUrl && 
    parseInt(teamIdFromLogoUrl) !== expectedTeamId;
  
  // If team ID is wrong (especially if it's the same wrong ID for different teams), block it
  // Team ID 1504 appearing for multiple different teams is suspicious
  const suspiciousTeamId = teamIdFromLogoUrl === '1504' && 
    displayData.currentTeam.name && 
    !['Unknown Team', displayData.nationality].includes(displayData.currentTeam.name);
  
  const currentTeamLogoUrl = rawCurrentTeamLogoUrl && 
                              !isServiceLogoAFlag && 
                              !isServiceLogoSameAsNationalityFlag &&
                              !logoContainsCountryCode && // Block if URL contains country code (likely a flag)
                              !apiLogoMatchesNationalityFlag && // Block if API logo matches nationality flag
                              !serviceLogoMatchesNationalityFlag && // Block if service logo matches nationality flag
                              !hasWrongTeamId && // Block if team ID doesn't match expected team
                              !suspiciousTeamId // Block suspicious team IDs (like 1504 for multiple teams)
    ? rawCurrentTeamLogoUrl
    : undefined; // Don't display if it's still a country flag or matches nationality flag
  
  console.log(`🏷️ [PlayerDetails] Team logo validation for team info:`, {
    teamName: displayData.currentTeam.name,
    nationality: displayData.nationality,
    apiLogo: displayData.currentTeam.logo,
    nationalityFlagUrl,
    isApiLogoSameAsNationalityFlag,
    isApiLogoAFlag,
    apiLogoMatchesNationalityFlag,
    validApiLogoForService,
    serviceLogo: rawCurrentTeamLogoUrl,
    isServiceLogoSameAsNationalityFlag,
    isServiceLogoAFlag,
    serviceLogoMatchesNationalityFlag,
    logoContainsCountryCode,
    teamIdFromLogoUrl,
    expectedTeamId,
    hasWrongTeamId,
    suspiciousTeamId,
    finalLogo: currentTeamLogoUrl,
    willDisplayLogo: !!currentTeamLogoUrl && !isCountryFlagUrl(currentTeamLogoUrl),
  });
  
  // Use team colors from service, fallback to displayData colors
  const playerColors = {
    primary: teamColors.primary || displayData.currentTeam.colors.primary,
    secondary: teamColors.secondary || displayData.currentTeam.colors.secondary,
  };

  const tabs = useMemo(() => {
    const allTabs = [
      { id: "moments", label: "Moments" },
      { id: "info", label: "Info" },
      { id: "stats", label: "Stats" },
      { id: "matches", label: "Matches" },
      { id: "ability", label: "Ability" },
    ];
    
    // ✅ BASKETBALL: Filter tabs based on sport
    return allTabs.filter(tab => {
      // Hide football-specific "Ability" tab for basketball
      if (isBasketball && tab.id === "ability") {
        console.log("🏀 [PlayerDetails] Hiding 'Ability' tab for basketball (football-specific)");
        return false;
      }
      
      // Show all tabs for football
      return true;
    });
  }, [isBasketball]);


  // Animated header
  const animatedHeaderStyle = {
    opacity: scrollY.interpolate({
      inputRange: [0, 100],
      outputRange: [0, 1],
      extrapolate: "clamp",
    }),
  };

  const formatMarketValue = (value: number): string => {
    // Format as "50M €" (Euros) - e.g., 50M €, 18M €
    if (value >= 1) {
      return `${value.toFixed(0)}M`;
    }
    // For values less than 1M, show in thousands (e.g., 500K €)
    return `${(value * 1000).toFixed(0)}K`;
  };

  const handleTeamNavigation = async () => {
    // Navigate to team details page (with basketball data check)
    if (displayData.currentTeam.id) {
      // ✅ BASKETBALL: Check if team has data before navigation
      const hasData = await checkTeamHasData(
        displayData.currentTeam.id,
        displayData.currentTeam.name,
        activeSport
      );
      
      if (!hasData) {
        console.warn(`⚠️ [PlayerDetails] ${displayData.currentTeam.name} has no API data - navigation blocked`);
        return;
      }
      
      router.push({
        pathname: "/stats/team-details/[teamId]",
        params: { 
          teamId: displayData.currentTeam.id,
          sport: activeSport // ✅ Pass sport parameter
        },
      });
    }
  };

  const renderTabContent = () => {
    switch (selectedTab) {
      case "moments":
        return (
          <PlayerMoments
            playerId={displayData.id}
            playerName={displayData.name}
            teamName={displayData.currentTeam.name}
            theme={theme}
            sport={activeSport} // ✅ Pass sport
          />
        );
      case "info":
        return (
          <PlayerDetailsInfo
            stats={displayData.stats}
            abilities={displayData.abilities}
            playerId={displayData.id}
            transferHistory={displayData.transferHistory || []}
            honors={displayData.honors || []}
            strengths={displayData.strengths || []}
            weaknesses={displayData.weaknesses || []}
            position={displayData.position}
            currentTeam={displayData.currentTeam}
            contractEndDate={displayData.contract?.endDate}
            theme={theme}
            playerColors={playerColors}
            // Player info props for top section
            playerName={displayData.name}
            playerPhoto={displayData.photo}
            age={displayData.age}
            height={displayData.height}
            weight={displayData.weight}
            nationality={displayData.nationality}
            nationalityFlag={displayData.nationalityFlag}
            jerseyNumber={displayData.jerseyNumber}
            preferredFoot={displayData.preferredFoot}
            birthDate={displayData.birthDate}
            // Navigation callback to switch to ability tab
            onNavigateToAbility={() => setSelectedTab("ability")}
            sport={activeSport} // ✅ Pass sport
          />
        );
      case "stats":
        return (
          <PlayerDetailsStats
            playerInfo={{
              englishName: displayData.englishName,
              birthDate: displayData.birthDate,
              birthPlace: displayData.birthPlace,
              nationality: displayData.nationality,
              nationalityFlag: displayData.nationalityFlag,
              height: displayData.height,
              weight: displayData.weight,
              position: displayData.position,
              preferredFoot: displayData.preferredFoot,
              jerseyNumber: displayData.jerseyNumber,
              biography: displayData.biography,
              contract: displayData.contract,
              currentTeam: displayData.currentTeam,
            }}
            theme={theme}
            playerId={displayData.id}
            playerColors={playerColors}
            sport={activeSport} // ✅ Pass sport
          />
        );
      case "matches":
        return (
          <PlayerDetailsMatches
            matches={displayData.recentMatches}
            theme={theme}
            playerColors={playerColors}
            playerId={displayData.id}
            playerTeamId={displayData.currentTeam?.id ? parseInt(displayData.currentTeam.id) : undefined}
            loading={isLoadingApi}
            sport={activeSport} // ✅ Pass sport
          />
        );
      case "ability":
        return (
          <PlayerDetailsAbility
            playerId={displayData.id}
            abilities={displayData.abilities}
            detailedAbilities={displayData.detailedAbilities}
            theme={theme}
            playerColors={playerColors}
            sport={activeSport} // ✅ Pass sport
          />
        );
      default:
        return null;
    }
  };

  // No blocking loading - UI shows immediately with mock data, updates when API data arrives
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Animated Header (shows on scroll) */}
      <Animated.View
        style={[
          styles.animatedHeader,
          animatedHeaderStyle,
          {
            paddingTop: insets.top,
            backgroundColor: playerColors.primary + "F0",
          },
        ]}
      >
        <TouchableOpacity style={styles.animatedBackButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.animatedHeaderTitle}>{displayData.name}</Text>
        <View style={styles.animatedHeaderActions}>
          <TouchableOpacity 
            style={styles.animatedHeaderButton}
            onPress={() => setShowShareModal(true)}
          >
            <Share2 size={24} color="white" />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <ScrollView
        style={[styles.scrollView, { backgroundColor: theme.colors.background }]}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section with Team Color Background */}
        <View
          style={[
            styles.heroSection,
            {
              backgroundColor: playerColors.primary,
              paddingTop: insets.top + 10,
            },
          ]}
        >
          {/* Team Logo Watermark - Beautiful water washed effect */}
          {teamLogoUrl && (
            <Image
              source={{ uri: teamLogoUrl }}
              style={styles.heroBackgroundLogo}
              resizeMode="contain"
            />
          )}

          <View style={styles.heroHeader}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <ArrowLeft size={24} color="white" />
            </TouchableOpacity>
            <View style={styles.headerActions}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => setShowShareModal(true)}
              >
                <Share2 size={24} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Player Info Section */}
          <View style={styles.playerInfoSection}>
            {/* Player Headshot - Left side */}
            <View style={styles.playerPhotoContainer}>
              {displayData.photo ? (
                <Image 
                  source={{ uri: displayData.photo }} 
                  style={styles.playerPhoto}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.playerPhotoPlaceholder}>
                  <Text style={styles.playerPhotoInitials}>
                    {displayData.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .substring(0, 2)
                      .toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
            
            {/* Player Details - Right side of headshot */}
            <View style={styles.playerDetails}>
              {/* Player Name - Display once, bold */}
              <Text style={styles.playerName}>{displayData.name}</Text>
              
              {/* Age / Height / Weight */}
              <Text style={styles.playerBasicInfo}>
                {displayData.age} years / {displayData.height}cm / {displayData.weight}kg
              </Text>
            </View>
          </View>

          {/* Hero Stats Section - 2 lines layout */}
          <View style={styles.heroStatsContainer}>
            {/* Line 1: Country info and Market Value */}
            <View style={styles.heroStatsLine1}>
              {/* Left: Country Flag + Country Name / Jersey Number / Position */}
              <View style={styles.countryInfoContainer}>
                {getCountryFlagUrl(displayData.nationality) && (
                  <Image
                    source={{ uri: getCountryFlagUrl(displayData.nationality)! }}
                    style={styles.countryFlag}
                    resizeMode="contain"
                  />
                )}
                <Text style={styles.heroStatText} numberOfLines={1}>
                  #{(displayData.nationalTeamJerseyNumber ?? displayData.jerseyNumber ?? 0)} / {displayData.nationality} / {displayData.position}
                </Text>
              </View>

              {/* Right: Market Value */}
              <View style={styles.marketValueContainer}>
                <Text style={styles.heroStatValue}>{formatMarketValue(displayData.marketValue)} €</Text>
                <Text style={styles.heroStatLabel}>Market Value (€)</Text>
              </View>
            </View>

            {/* Line 2: Team info with Navigation */}
            <View style={styles.heroStatsLine2}>
              <TouchableOpacity 
                style={styles.teamNavContainer}
                onPress={handleTeamNavigation}
                activeOpacity={0.7}
              >
                {/* Team Logo - Only show if it's NOT a country flag */}
                {/* CRITICAL: Block if URL matches country flag patterns OR matches nationality flag URL */}
                {(() => {
                  // Get country code from nationality flag URL for additional checking
                  const countryCodeFromFlag = nationalityFlagUrl?.split('/').pop()?.split('.')[0] || '';
                  const nationalityLower = displayData.nationality?.toLowerCase() || '';
                  
                  // Check if logo URL contains country code in flag pattern (only if URL is in flag context)
                  const isInFlagContext = currentTeamLogoUrl && (
                    currentTeamLogoUrl.includes('flag') || 
                    currentTeamLogoUrl.includes('country') ||
                    currentTeamLogoUrl.includes('national')
                  );
                  
                  const containsCountryCodeInFlagPattern = countryCodeFromFlag && 
                    currentTeamLogoUrl && 
                    isInFlagContext &&
                    (currentTeamLogoUrl.includes(`/${countryCodeFromFlag}.`) || 
                     currentTeamLogoUrl.includes(`/${countryCodeFromFlag}/`) ||
                     currentTeamLogoUrl.includes(`/${countryCodeFromFlag}-`));
                  
                  // Check if logo URL contains nationality name in flag context
                  const containsNationalityInFlagContext = nationalityLower && 
                    currentTeamLogoUrl && 
                    isInFlagContext &&
                    currentTeamLogoUrl.toLowerCase().includes(nationalityLower);
                  
                  // Check if logo should be blocked
                  const isBlocked = 
                    !currentTeamLogoUrl ||
                    !displayData.currentTeam.name ||
                    displayData.currentTeam.name === displayData.nationality ||
                    displayData.currentTeam.name.toLowerCase() === displayData.nationality.toLowerCase() ||
                    displayData.currentTeam.name === "Unknown Team" ||
                    isCountryFlagUrl(currentTeamLogoUrl) || // Block country flag URL patterns
                    currentTeamLogoUrl === nationalityFlagUrl || // Block if it matches nationality flag URL exactly
                    containsCountryCodeInFlagPattern || // Block if URL contains country code in flag pattern
                    containsNationalityInFlagContext; // Block if URL contains nationality in flag context
                  
                  // Log if blocked
                  if (currentTeamLogoUrl && displayData.currentTeam.name && isBlocked) {
                    console.warn(`🚫 [PlayerDetails] Team logo BLOCKED for ${displayData.currentTeam.name}:`, {
                      logoUrl: currentTeamLogoUrl,
                      isFlagUrl: isCountryFlagUrl(currentTeamLogoUrl),
                      matchesNationalityFlag: currentTeamLogoUrl === nationalityFlagUrl,
                      containsCountryCode: containsCountryCodeInFlagPattern,
                      containsNationality: containsNationalityInFlagContext,
                      countryCodeFromFlag,
                      nationalityFlagUrl,
                      teamName: displayData.currentTeam.name,
                      nationality: displayData.nationality,
                    });
                  }
                  
                  // Show logo only if not blocked initially AND not blocked after load
                  return !isBlocked && !teamLogoBlocked && currentTeamLogoUrl ? (
                    <Image
                      key={`team-logo-${displayData.currentTeam.name}-${currentTeamLogoUrl}`}
                      source={{ uri: currentTeamLogoUrl }}
                      style={styles.teamLogoSmall}
                      resizeMode="contain"
                      onError={(error) => {
                        console.warn(`⚠️ [PlayerDetails] Team logo failed to load: ${currentTeamLogoUrl}`, error);
                      }}
                      onLoadStart={() => {
                        // Final check before loading - compare with nationality flag
                        if (nationalityFlagUrl && currentTeamLogoUrl === nationalityFlagUrl) {
                          console.error(`🚫 [PlayerDetails] BLOCKED: Logo URL matches nationality flag: ${currentTeamLogoUrl}`);
                          setTeamLogoBlocked(true);
                        }
                      }}
                      onLoad={() => {
                        // Log successful load
                        console.log(`✅ [PlayerDetails] Team logo loaded successfully: ${displayData.currentTeam.name} - ${currentTeamLogoUrl}`);
                      }}
                    />
                  ) : null;
                })()}
                <Text style={styles.heroStatText} numberOfLines={1}>
                  #{displayData.jerseyNumber || 0} / {displayData.currentTeam.name} / {displayData.position}
                </Text>
                <ChevronRight size={16} color="white" style={styles.navArrow} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Tab Navigation */}
        <View
          style={[
            styles.tabsContainer,
            {
              backgroundColor: theme.colors.background,
              borderBottomColor: isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
            },
          ]}
        >
          <ScrollView
            ref={tabsScrollViewRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tabsScroll}
          >
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.id}
                style={styles.tab}
                onPress={() => setSelectedTab(tab.id)}
                onLayout={(event) => {
                  const { x } = event.nativeEvent.layout;
                  tabPositionsRef.current[tab.id] = x;
                }}
              >
                <Text
                  style={[
                    styles.tabText,
                    {
                      color: selectedTab === tab.id ? "#FF3B30" : theme.colors.textSecondary,
                      fontWeight: selectedTab === tab.id ? "600" : "500",
                    },
                  ]}
                >
                  {tab.label}
                </Text>
                {selectedTab === tab.id && (
                  <>
                    <View
                      style={[
                        styles.tabIndicator,
                        { backgroundColor: "#FF3B30" },
                      ]}
                    />
                  </>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Tab Content */}
        <View style={{ backgroundColor: theme.colors.background, minHeight: 500 }}>
          {renderTabContent()}
        </View>
      </ScrollView>

      {/* Share Modal */}
      <ShareModal
        visible={showShareModal}
        onClose={() => setShowShareModal(false)}
        title={`Share ${displayData.name}`}
        shareUrl={`player/${paramPlayerId}`}
        shareText={`Check out ${displayData.name} on Champs Sports Lovers!`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 100,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: "Inter-Medium",
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
    paddingHorizontal: 20,
    fontFamily: "Inter-Medium",
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  retryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Inter-SemiBold",
  },
  scrollView: {
    flex: 1,
  },
  animatedHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  animatedBackButton: {
    padding: 8,
  },
  animatedHeaderTitle: {
    flex: 1,
    color: "white",
    fontSize: 18,
    fontWeight: "700",
    marginLeft: 12,
  },
  animatedHeaderActions: {
    flexDirection: "row",
    gap: 8,
  },
  animatedHeaderButton: {
    padding: 8,
  },
  heroSection: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    position: "relative",
    overflow: "hidden",
  },
  heroBackgroundLogo: {
    position: "absolute",
    width: width * 0.8,
    height: width * 0.8,
    opacity: 0.08,
    top: "50%",
    left: "50%",
    marginLeft: -(width * 0.4),
    marginTop: -(width * 0.4),
  },
  heroHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  playerInfoSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 24,
    zIndex: 1,
  },
  playerPhotoContainer: {
    marginRight: 16,
  },
  playerPhoto: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "transparent",
  },
  playerPhotoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  playerPhotoInitials: {
    color: "white",
    fontSize: 32,
    fontWeight: "700",
    fontFamily: "Inter-Bold",
    opacity: 0.8,
  },
  playerDetails: {
    flex: 1,
    justifyContent: "center",
    paddingTop: 8,
  },
  playerName: {
    color: "white",
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
    fontFamily: "Inter-Bold",
  },
  playerBasicInfo: {
    color: "white",
    fontSize: 15,
    opacity: 0.9,
    fontFamily: "Inter-Regular",
  },
  heroStatsContainer: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.2)",
    zIndex: 1,
  },
  heroStatsLine1: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  heroStatsLine2: {
    flexDirection: "row",
    alignItems: "center",
  },
  countryInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 16,
  },
  countryFlag: {
    width: 20,
    height: 15,
    marginRight: 6,
    borderRadius: 2,
  },
  marketValueContainer: {
    alignItems: "flex-end",
    minWidth: 80,
  },
  teamNavContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  teamLogoSmall: {
    width: 18,
    height: 18,
    marginRight: 6,
    borderRadius: 2,
  },
  heroStatText: {
    color: "white",
    fontSize: 13,
    opacity: 0.95,
    fontFamily: "Inter-Medium",
    lineHeight: 18,
    flex: 1,
  },
  heroStatValue: {
    color: "white",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 2,
    fontFamily: "Inter-Bold",
    textAlign: "right",
  },
  heroStatLabel: {
    color: "white",
    fontSize: 11,
    opacity: 0.85,
    fontFamily: "Inter-Regular",
    textAlign: "right",
  },
  navArrow: {
    marginLeft: 6,
    opacity: 0.8,
    marginTop: 2,
  },
  tabsContainer: {
    borderBottomWidth: 1,
  },
  tabsScroll: {
    paddingHorizontal: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    position: "relative",
  },
  tabText: {
    fontSize: 15,
    fontFamily: "Inter-Medium",
  },
  tabIndicator: {
    position: "absolute",
    bottom: 0,
    left: "50%",
    width: 20,
    marginLeft: -10,
    height: 2,
    borderRadius: 1,
  },
});


