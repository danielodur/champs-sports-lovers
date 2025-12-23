/**
 * League Details Screen
 * 
 * Universal template for displaying detailed league information
 * Similar to team-details but for leagues/competitions
 * 
 * Features:
 * - League header with colors, logo, name
 * - Season selector with current season info
 * - Match statistics (total, played, remaining)
 * - Multiple tabs: Moments, Draft, Standings, Matches, Stats, Transfers, Players
 * - Auto-scrolling tabs
 * - Mock data ready for API integration
 */

import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Animated,
  Easing,
  Modal,
  ActivityIndicator,
  Image,
  Dimensions,
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, ChevronDown, ChevronRight, Share2 } from "lucide-react-native";
import { useTheme } from "../../../hooks/useTheme";
import { trackLeagueVisit } from "../../../services/leagueVisitsService";
import { createApiSportsService } from "../../../services/api-sports-service";
import { fetchLeagueInfo, fetchLeagueStandings } from "../../../services/leagueStandingsService";

// Import tab components (will be created next)
import LeagueStandings from "./standings/league-standings";
import LeagueMatches from "./matches/league-matches";
import LeagueTransfers from "./transfers/league-transfers";
import LeaguePlayers from "./players/league-players";
import LeagueDraft from "./draft";
import LeagueMoments from "./moments/league-moments";
import ShareModal from "../../../modules/news/components/content/shared/share-modal";

// League Color Detector - Returns unique colors for each league (Football & Basketball)
const getLeagueColors = (leagueId: string, sport: string = "football") => {
  // Basketball League Colors
  if (sport === "basketball") {
    const basketballColorMap: { [key: string]: { primary: string; secondary: string } } = {
      // NBA
      "nba": { primary: "#C8102E", secondary: "#1D428A" },
      
      // International Basketball
      "fiba-world-cup": { primary: "#FF6B00", secondary: "#003DA5" },
      "euroleague": { primary: "#FF6600", secondary: "#000000" },
      "basketball-africa-league": { primary: "#FF6B00", secondary: "#009639" },
      
      // European Basketball Leagues
      "liga-acb": { primary: "#FF4C41", secondary: "#FBEE23" }, // Spain
      "turkish-bsl": { primary: "#E30A17", secondary: "#000000" }, // Turkey
      "vtb-united-league": { primary: "#0066B3", secondary: "#FFFFFF" }, // Russia
      "basketball-bundesliga": { primary: "#D20515", secondary: "#000000" }, // Germany
      "lega-basket-serie-a": { primary: "#004B87", secondary: "#00A651" }, // Italy
      "lnb-pro-a": { primary: "#0055A4", secondary: "#EF4135" }, // France
      "adriatic-league": { primary: "#009FE3", secondary: "#003DA5" },
      "greek-a1-league": { primary: "#004C99", secondary: "#FFFFFF" },
      
      // Other Basketball Leagues
      "australian-nbl": { primary: "#007A3D", secondary: "#FDBE11" },
      "lithuanian-lkl": { primary: "#FDB913", secondary: "#006341" },
      "cba": { primary: "#DE2910", secondary: "#FFDE00" }, // China
      "b-league": { primary: "#E60012", secondary: "#000000" }, // Japan
      "korean-kba": { primary: "#C5003E", secondary: "#005AAB" },
    };
    return basketballColorMap[leagueId] || { primary: "#C8102E", secondary: "#1D428A" };
  }
  
  // Football League Colors
  const leagueColorMap: { [key: string]: { primary: string; secondary: string } } = {
    // Top European Leagues
    "premier-league": { primary: "#38003C", secondary: "#00FF87" },
    "la-liga": { primary: "#FF4C41", secondary: "#FBEE23" },
    "serie-a": { primary: "#004B87", secondary: "#00A651" },
    "bundesliga": { primary: "#D20515", secondary: "#000000" },
    "ligue-1": { primary: "#D2122E", secondary: "#104FA3" },
    
    // Other European Leagues
    "eredivisie": { primary: "#FF6B00", secondary: "#000000" },
    "primeira-liga": { primary: "#00A859", secondary: "#D62027" },
    "scottish-premiership": { primary: "#003DA5", secondary: "#ED1C24" },
    
    // European Cups
    "fa-cup": { primary: "#FF1E3C", secondary: "#132257" },
    "copa-del-rey": { primary: "#FF4C41", secondary: "#FBEE23" },
    "coppa-italia": { primary: "#004B87", secondary: "#00A651" },
    "dfb-pokal": { primary: "#D20515", secondary: "#000000" },
    "coupe-de-france": { primary: "#0055A4", secondary: "#EF4135" },
    "efl-cup": { primary: "#00B0F0", secondary: "#132257" },
    
    // Continental Competitions
    "champions-league": { primary: "#00285E", secondary: "#86E2F5" },
    "europa-league": { primary: "#FF8200", secondary: "#000000" },
    "conference-league": { primary: "#00B98F", secondary: "#FFC627" },
    
    // International
    "world-cup": { primary: "#003087", secondary: "#FDB913" },
    "euro": { primary: "#003DA5", secondary: "#00ADB5" },
    "copa-america": { primary: "#C8102E", secondary: "#009FE3" },
    "afcon": { primary: "#009639", secondary: "#FCB814" },
    "asian-cup": { primary: "#FF0000", secondary: "#0052B4" },
    
    // Asian Leagues
    "j1-league": { primary: "#E60012", secondary: "#000000" },
    "k-league-1": { primary: "#C5003E", secondary: "#005AAB" },
    "chinese-super-league": { primary: "#DE2910", secondary: "#FFDE00" },
    "saudi-pro-league": { primary: "#006341", secondary: "#FFFFFF" },
    
    // American Leagues
    "mls": { primary: "#003087", secondary: "#C40A2B" },
    "liga-mx": { primary: "#005B45", secondary: "#D4AF37" },
    "brasileirao": { primary: "#009739", secondary: "#FEDD00" },
    "primera-division-argentina": { primary: "#74ACDF", secondary: "#FFFFFF" },
    
    // African Leagues
    "egyptian-premier-league": { primary: "#CE1126", secondary: "#000000" },
    "south-african-premier-division": { primary: "#007A3D", secondary: "#FDBE11" },
  };

  // Return specific colors or default
  return leagueColorMap[leagueId] || { primary: "#38003C", secondary: "#00FF87" };
};

// Helper function to map league ID string to API Football/Basketball league ID
// Can accept an optional apiLeagueId param to use directly
// IMPORTANT: Returns different IDs based on whether it's football or basketball
export const getLeagueApiId = (leagueId: string, apiLeagueIdParam?: string | number, sport: string = "football"): number | null => {
  // If API ID is provided directly (from navigation params), use it
  if (apiLeagueIdParam !== undefined) {
    const id = typeof apiLeagueIdParam === 'string' ? parseInt(apiLeagueIdParam, 10) : apiLeagueIdParam;
    if (!isNaN(id) && id > 0) {
      console.log(`🔑 [getLeagueApiId] Using provided API ID: ${id} for ${sport}`);
      return id;
    }
  }

  // Basketball League Mappings (use basketball API IDs)
  const basketballLeagueMap: { [key: string]: number | null } = {
    "nba": 12, // NBA
    "euroleague": 120, // EuroLeague
    "fiba-world-cup": 28, // FIBA World Cup
    "basketball-africa-league": null, // Not available in API
    "liga-acb": 144, // Liga ACB (Spain)
    "turkish-bsl": 146, // Turkish Basketball Super League
    "vtb-united-league": null, // Not available in API
    "basketball-bundesliga": 145, // Basketball Bundesliga (Germany)
    "lega-basket-serie-a": 141, // Lega Basket Serie A (Italy)
    "lnb-pro-a": 140, // LNB Pro A (France)
    "adriatic-league": null, // Not available in API
    "greek-a1-league": null, // Not available in API
    "australian-nbl": 136, // NBL (Australia)
    "lithuanian-lkl": null, // Not available in API
    "cba": 135, // CBA (China)
    "b-league": 139, // B.League (Japan)
    "korean-kba": null, // Not available in API
  };

  // Football League Mappings (use football API IDs)
  const footballLeagueMap: { [key: string]: number | null } = {
    // ⚽ FOOTBALL LEAGUES
    // Premier League & English Football
    "premier-league": 39,
    "english-pl": 39, // Tab ID for Premier League
    
    // Top European Leagues
    "la-liga": 140,
    "bundesliga": 78,
    "serie-a": 135,
    "ligue-1": 61,
    
    // European Competitions
    "champions-league": 2,
    "uefa-champions": 2, // Tab ID
    "europa-league": 3,
    "uefa-europa-l": 3, // Tab ID
    "conference-league": 848,
    "uefa-conference-l": 848, // Tab ID
    "uefa-nations": 5, // UEFA Nations League
    
    // International Tournaments
    "afcon": 6, // Africa Cup of Nations
    "cecafa-east-africa": null, // CECAFA Cup (regional, may not be in API)
    "fifa-qualifiers-europe": null, // World Cup Qualifiers Europe
    "fifa-qualifiers-africa": null, // World Cup Qualifiers Africa
    
    // Other European Leagues
    "eredivisie": 88,
    "liga-portugal": 94,
    "primeira-liga": 94,
    "scottish-premiership": 179,
    "belgian-pro-league": 144,
    "super-league-greece": 197,
    "superliga": 218, // Austria
    "saudi-pro-league": 307,
    
    // Cups
    "fa-cup": 45,
    "copa-del-rey": 143,
    "coppa-italia": 137,
    "dfb-pokal": 81,
    "coupe-de-france": 66,
    "efl-cup": 48,
    "efl-league-two": 42, // EFL League Two
    "bundesliga-2": 79, // 2. Bundesliga
    
    // American Leagues
    "mls": 253,
    "liga-mx": 262,
    "brasileirao": 71,
    "primera-division-argentina": 128,
    
    // Asian Leagues
    "j1-league": 98,
    "k-league-1": 292,
    "chinese-super-league": 169,
    "a-league": 188, // A-League Men (Australia)
    "a-league-men": 188, // A-League Men (Australia)
    
    // African Leagues
    "uganda-premier-league": 585, // ✅ CORRECTED: Uganda Premier League API ID from dynamic discovery
    "ugandan-pl": 585, // ✅ CORRECTED: Uganda Premier League API ID
    "south-african-premier-division": 209, // South African Premier Division
    
  };
  
  // ✅ Select the correct mapping based on sport
  const leagueMap = sport === "basketball" ? basketballLeagueMap : footballLeagueMap;
  const apiId = leagueMap[leagueId] || null;
  
  console.log(`🔑 [getLeagueApiId] Mapping ${sport} league "${leagueId}" -> API ID: ${apiId}`);
  
  return apiId;
};

type TabType = "standings" | "matches" | "moments" | "draft" | "transfers" | "players" | "data" | "stats" | "awards" | "roster";

// Basketball League Tier System - determines which tabs are available
const getBasketballLeagueTier = (leagueId: string): 1 | 2 | 3 | 4 => {
  // Tier 1: Elite leagues with full data (NBA, Euroleague, etc.)
  const tier1Leagues = [
    "nba", "euroleague", "fiba-world-cup"
  ];
  
  // Tier 2: Major leagues with good data coverage
  const tier2Leagues = [
    "liga-acb", "turkish-bsl", "lnb-pro-a", "basketball-bundesliga",
    "lega-basket-serie-a", "adriatic-league", "greek-a1-league",
    "vtb-united-league", "australian-nbl", "cba"
  ];
  
  // Tier 3: Regional leagues with moderate data
  const tier3Leagues = [
    "b-league", "korean-kba", "lithuanian-lkl", "basketball-africa-league"
  ];
  
  // Tier 4: Smaller leagues with basic data
  
  if (tier1Leagues.includes(leagueId)) return 1;
  if (tier2Leagues.includes(leagueId)) return 2;
  if (tier3Leagues.includes(leagueId)) return 3;
  return 4;
};

// Football League Tier System - determines which tabs are available
const getFootballLeagueTier = (leagueId: string): 1 | 2 | 3 | 4 => {
  // Tier 1: Elite leagues with complete data (Top 5 European leagues, UCL, etc.)
  const tier1Leagues = [
    "premier-league", "english-pl", "la-liga", "serie-a", "bundesliga", "ligue-1",
    "champions-league", "uefa-champions", "europa-league", "uefa-europa-l", "world-cup", "euro"
  ];
  
  // Tier 2: Major leagues with extensive data
  const tier2Leagues = [
    "eredivisie", "liga-portugal", "primeira-liga", "scottish-premiership",
    "mls", "liga-mx", "brasileirao", "primera-division-argentina",
    "j1-league", "k-league-1", "saudi-pro-league", "chinese-super-league",
    "conference-league", "uefa-conference-l", "copa-america", "afcon",
    "belgian-pro-league", "super-league-greece", "superliga", "uefa-nations"
  ];
  
  // Tier 3: Regional leagues with good data
  const tier3Leagues = [
    "fa-cup", "copa-del-rey", "coppa-italia", "dfb-pokal", "coupe-de-france",
    "efl-cup", "efl-league-two", "bundesliga-2", "egyptian-premier-league", "south-african-premier-division",
    "asian-cup", "cecafa-east-africa", "fifa-qualifiers-europe", "fifa-qualifiers-africa"
  ];
  
  // Tier 4: Smaller leagues with basic data
  const tier4Leagues = [
    "ugandan-pl", "uganda-premier-league"
  ];
  
  if (tier1Leagues.includes(leagueId)) return 1;
  if (tier2Leagues.includes(leagueId)) return 2;
  if (tier3Leagues.includes(leagueId)) return 3;
  if (tier4Leagues.includes(leagueId)) return 4;
  return 4;
};

// Get available tabs based on league tier and sport
const getAvailableTabs = (sport: string, leagueId: string): { id: TabType; label: string }[] => {
  if (sport === "basketball") {
    const tier = getBasketballLeagueTier(leagueId);
    
    // Base tabs for all basketball leagues
    const baseTabs: { id: TabType; label: string }[] = [
      { id: "moments", label: "Moments" },
      { id: "standings", label: "Standings" },
      { id: "matches", label: "Matches" },
    ];
    
    // Tier 1: Elite leagues (NBA, Euroleague) - Full experience
    if (tier === 1) {
      return [
        { id: "moments", label: "Moments" },
        { id: "standings", label: "Standings" },
        { id: "matches", label: "Matches" },
        { id: "draft", label: "Draft" },
        { id: "stats", label: "Stats" },
        { id: "roster", label: "Roster" },
        { id: "awards", label: "Awards" },
        { id: "data", label: "Data" },
      ];
    }
    
    // Tier 2: Major leagues - Most features
    if (tier === 2) {
      return [
        { id: "moments", label: "Moments" },
        { id: "standings", label: "Standings" },
        { id: "matches", label: "Matches" },
        { id: "draft", label: "Draft" },
        { id: "stats", label: "Stats" },
        { id: "data", label: "Data" },
      ];
    }
    
    // Tier 3: Regional leagues - Core features
    if (tier === 3) {
      return [
        { id: "moments", label: "Moments" },
        { id: "standings", label: "Standings" },
        { id: "matches", label: "Matches" },
        { id: "draft", label: "Draft" },
        { id: "data", label: "Data" },
      ];
    }
    
    // Tier 4: Smaller leagues - Essential features only
    return baseTabs;
  }
  
  // ✅ FOOTBALL: All football leagues get full tabs (no tier restrictions)
  // Football APIs are comprehensive, so all leagues should have access to all tabs
  return [
    { id: "moments", label: "Moments" },
    { id: "standings", label: "Standings" },
    { id: "matches", label: "Matches" },
    { id: "draft", label: "Draft" },
    { id: "transfers", label: "Transfers" },
    { id: "players", label: "Players" },
  ];
};

interface LeagueData {
  id: string;
  name: string;
  country: string;
  logo: string;
  primaryColor: string;
  secondaryColor: string;
  season: string;
  availableSeasons: string[];
  totalMatches: number;
  playedMatches: number;
  remainingMatches: number;
  currentMatchday: number;
  totalMatchdays: number;
  startDate: string;
  endDate: string;
  teams: number;
  info: {
    founded: number | null;
    country: string;
    type: string;
    currentChampion: string;
    mostTitles: string;
  };
}

export default function LeagueDetailsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  // Proper theme detection using backgroundSecondary for consistent theming
  const isDarkMode = theme.colors.backgroundSecondary !== "#F5F5F5";
  
  // Get league data from params (passed from vertical components)
  const leagueId = (params.leagueId as string) || "premier-league";
  const leagueName = params.leagueName as string | undefined;
  const country = params.country as string | undefined;
  const logoUrl = params.logoUrl as string | undefined;
  const apiLeagueIdParam = params.apiLeagueId as string | undefined; // API ID passed from navigation
  const sport = (params.sport as string) || "football"; // ✅ Get sport from params
  const fromStats = params.fromStats === "true"; // ✅ Check if navigating from stats screen
  // Default to "standings" unless explicitly set via params (navigating from stats screen)
  const initialTab = (params.tab as TabType) || "standings";
  
  const [selectedTab, setSelectedTab] = useState<TabType>(initialTab);
  
  // ✅ CRITICAL: Resolve API ID early for use in child components - must pass sport parameter
  const resolvedApiLeagueId = React.useMemo(() => {
    return getLeagueApiId(leagueId, apiLeagueIdParam, sport);
  }, [leagueId, apiLeagueIdParam, sport]);
  
  // Initialize with minimal data structure for instant UI render - no mock data
  const colors = getLeagueColors(leagueId, sport); // ✅ Pass sport parameter
  const currentYear = new Date().getFullYear();
  const [leagueData, setLeagueData] = useState<LeagueData | null>({
    id: leagueId,
    name: leagueName || "",
    country: country || "",
    logo: logoUrl || "",
    primaryColor: colors.primary,
    secondaryColor: colors.secondary,
    season: `${currentYear}-${currentYear + 1}`,
    availableSeasons: [],
    totalMatches: 0,
    playedMatches: 0,
    remainingMatches: 0,
    currentMatchday: 0,
    totalMatchdays: 0,
    startDate: "",
    endDate: "",
    teams: 0,
    info: {
      founded: null,
      country: country || "",
      type: "",
      currentChampion: "",
      mostTitles: "",
    },
  });
  const [selectedSeason, setSelectedSeason] = useState<string>(`${currentYear}-${currentYear + 1}`);
  const [showSeasonModal, setShowSeasonModal] = useState(false);
  const [isLoadingApi, setIsLoadingApi] = useState(false);
  const [progressBarWidth, setProgressBarWidth] = useState<number>(0);
  const [showShareModal, setShowShareModal] = useState(false);
  
  const tabsScrollViewRef = useRef<ScrollView>(null);
  const tabPositionsRef = useRef<{ [key: string]: number }>({});
  
  // Animation for progress bar
  const progressAnimation = useRef(new Animated.Value(0)).current;
  
  // Initialize API service (memoized to prevent recreation)
  const apiSportsService = React.useMemo(() => createApiSportsService(), []);

  // Fetch league data from API immediately - no blocking, but fetch right away
  useEffect(() => {
    const fetchLeagueData = async () => {
      try {
        setIsLoadingApi(true);
        console.log(`🔍 [LeagueDetails] Fetching REAL API data for leagueId: ${leagueId}, initialTab: ${initialTab}`);
        // Use API ID from params if available, otherwise try to map from leagueId
        const apiLeagueId = getLeagueApiId(leagueId, apiLeagueIdParam, sport);
        console.log(`🔍 [LeagueDetails] Mapped to API ID: ${apiLeagueId} for leagueId: ${leagueId} (from params: ${apiLeagueIdParam})`);
        const currentYear = new Date().getFullYear();
        
        if (!apiLeagueId) {
          console.log(`ℹ️ [LeagueDetails] No API ID found for leagueId: ${leagueId}, using fallback data`);
          
          // Special handling for Uganda Premier League - use proper fallback data
          let fallbackName = leagueName || "League Name";
          let fallbackCountry = country || "Country";
          
          if (leagueId === "uganda-premier-league") {
            fallbackName = "Uganda Premier League";
            fallbackCountry = "Uganda";
            console.log(`🇺🇬 [LeagueDetails] Using Uganda Premier League fallback data (API-Football doesn't support this league)`);
          }
          
          // Fallback to provided params if API ID not found
          const fallbackData: LeagueData = {
            id: leagueId,
            name: fallbackName,
            country: fallbackCountry,
            logo: logoUrl || "https://media.api-sports.io/football/leagues/1.png",
            primaryColor: colors.primary,
            secondaryColor: colors.secondary,
            season: `${currentYear}-${currentYear + 1}`,
            availableSeasons: [`${currentYear}-${currentYear + 1}`, `${currentYear - 1}-${currentYear}`],
            totalMatches: 0,
            playedMatches: 0,
            remainingMatches: 0,
            currentMatchday: 0,
            totalMatchdays: 30, // Uganda Premier League typically has 30 matchdays
            startDate: "",
            endDate: "",
            teams: 16, // Uganda Premier League typically has 16 teams
            info: {
              founded: null,
              country: fallbackCountry,
              type: "League",
              currentChampion: "",
              mostTitles: "",
            },
          };
          setLeagueData(fallbackData);
          setSelectedSeason(fallbackData.season);
          setIsLoadingApi(false);
          return;
        }

        // Fetch league info from API
        console.log(`📡 [LeagueDetails] Fetching league info for API ID: ${apiLeagueId}`);
        const leagueInfo = await fetchLeagueInfo(apiLeagueId);
        
        if (leagueInfo) {
          // Safely access country name with proper null checking
          const leagueCountryName = leagueInfo.country?.name || "Unknown";
          const leagueCountryCode = leagueInfo.country?.code || "";
          
          console.log(`✅ [LeagueDetails] League info received: ${leagueInfo.league.name} (ID: ${leagueInfo.league.id}), Country: ${leagueCountryName} (${leagueCountryCode})`);
          
          // Verify we got the correct league (especially for Uganda)
          if (leagueId === "uganda-premier-league") {
            const isUganda = leagueCountryName.toLowerCase() === "uganda" || 
                             leagueCountryCode.toLowerCase() === "ug";
            if (!isUganda) {
              console.error(`❌ [LeagueDetails] WRONG LEAGUE! Expected Uganda, got: ${leagueCountryName} (${leagueCountryCode}) for API ID ${apiLeagueId}`);
              console.error(`   This suggests API ID ${apiLeagueId} is incorrect for Uganda Premier League`);
            } else {
              console.log(`✅ [LeagueDetails] Correctly identified Uganda Premier League`);
            }
          }
          // Get current season
          const currentSeason = leagueInfo.seasons?.find(s => s.current) || leagueInfo.seasons?.[0];
          const seasonYear = currentSeason?.year || currentYear;
          
          // OPTIMIZED: Fetch data in parallel and limit fixtures to reduce loading
          const [standingsResponse, limitedFixturesResponse] = await Promise.all([
            // Fetch standings to get team count (more reliable than teams endpoint)
            fetchLeagueStandings(apiLeagueId, seasonYear, false, sport), // ✅ Pass sport parameter
            // Fetch only recent fixtures (last 10 rounds) to reduce data load
            apiSportsService.getFixtures(
              undefined,
              apiLeagueId,
              seasonYear,
              undefined,
              undefined,
              undefined,
              sport // ✅ Pass sport parameter
            ).catch(() => ({ response: [] })), // Graceful fallback
          ]);
          
          const teams = standingsResponse?.groups?.[0]?.standings || [];
          const fixtures = limitedFixturesResponse?.response || [];
          
          // Limit fixtures processing to reduce computation
          const fixturesToProcess = fixtures.slice(0, 200); // Limit to 200 fixtures max
          const finishedFixtures = fixturesToProcess.filter((f: any) => 
            f.fixture?.status?.short === "FT" || f.fixture?.status?.short === "AET"
          );
          
          // Calculate matchday info - extract round numbers properly
          const extractRoundNumber = (roundString: string | null | undefined): number => {
            if (!roundString) return 0;
            // Handle formats like "Regular Season - 1", "Matchday 1", "1", etc.
            const match = roundString.match(/\d+/);
            return match ? parseInt(match[0], 10) : 0;
          };
          
          const roundNumbers = fixturesToProcess
            .map((f: any) => extractRoundNumber(f.league?.round))
            .filter((r: number) => r > 0);
          
          // Calculate current and total matchdays
          let currentMatchday = 0;
          let totalMatchdays = 38; // Default
          
          if (roundNumbers.length > 0) {
            currentMatchday = Math.max(...roundNumbers);
            totalMatchdays = Math.max(...roundNumbers);
          } else {
            // If no round data, estimate based on league type
            const leagueRoundMap: { [key: string]: number } = {
              "premier-league": 38,
              "la-liga": 38,
              "bundesliga": 34,
              "serie-a": 38,
              "ligue-1": 38,
              "champions-league": 13,
              "europa-league": 15,
              "conference-league": 15,
              "uganda-premier-league": 30,
            };
            totalMatchdays = leagueRoundMap[leagueId] || 38;
            
            // Try to estimate current matchday from fixtures
            if (finishedFixtures.length > 0) {
              // Estimate: if we have finished fixtures, we're at least past matchday 1
              const estimatedMatchday = Math.ceil((finishedFixtures.length / fixtures.length) * totalMatchdays);
              currentMatchday = Math.max(1, Math.min(estimatedMatchday, totalMatchdays));
            }
          }
          
          // Get season dates
          const seasonStart = currentSeason?.start || "";
          const seasonEnd = currentSeason?.end || "";
          
          // Build available seasons list
          const availableSeasons = leagueInfo.seasons
            ?.map(s => `${s.year}-${s.year + 1}`)
            .reverse() || [`${seasonYear}-${seasonYear + 1}`];
          
          // CRITICAL: Ensure we preserve the original leagueId (especially for Uganda)
          // Don't use leagueInfo.league.id as it might be different from our mapping
          const finalLeagueId = leagueId; // Always use the route param leagueId
          
          // Reuse leagueCountryName and leagueCountryCode already declared above
          console.log(`📊 [LeagueDetails] Building league data:`);
          console.log(`   - Route leagueId: ${leagueId}`);
          console.log(`   - API league ID: ${apiLeagueId}`);
          console.log(`   - API returned name: ${leagueInfo.league.name}`);
          console.log(`   - API returned country: ${leagueCountryName}`);
          console.log(`   - Using final leagueId: ${finalLeagueId}`);
          
          // ✅ CRITICAL FIX: Prioritize API country data - API is the source of truth
          // Never use params.country if API provides different country data
          const apiCountryName = leagueInfo.country?.name || "";
          const finalCountry = apiCountryName || country || "Country";
          
          // ✅ Log country mismatch for debugging
          if (country && apiCountryName && country.toLowerCase() !== apiCountryName.toLowerCase()) {
            console.warn(`⚠️ [LeagueDetails] Country mismatch detected:`);
            console.warn(`   Params country: "${country}"`);
            console.warn(`   API country: "${apiCountryName}"`);
            console.warn(`   Using API country: "${finalCountry}" (API is source of truth)`);
          }
          
          const data: LeagueData = {
            id: finalLeagueId, // Use route param, not API ID
            name: leagueInfo.league.name || leagueName || "League Name", // ✅ Prioritize API name
            country: finalCountry, // ✅ Use API country as source of truth
            logo: leagueInfo.league.logo || logoUrl || "https://media.api-sports.io/football/leagues/1.png", // ✅ Prioritize API logo
            primaryColor: colors.primary,
            secondaryColor: colors.secondary,
            season: `${seasonYear}-${seasonYear + 1}`,
            availableSeasons,
            totalMatches: fixtures.length, // Total from API
            playedMatches: finishedFixtures.length,
            remainingMatches: Math.max(0, fixtures.length - finishedFixtures.length),
            currentMatchday,
            totalMatchdays,
            startDate: seasonStart,
            endDate: seasonEnd,
            teams: teams.length,
            info: {
              founded: null, // API Football doesn't provide this directly
              country: finalCountry, // ✅ Use API country as source of truth
              type: leagueInfo.league.type || "League",
              currentChampion: "", // Would need to fetch from standings
              mostTitles: "", // Would need historical data
            },
          };
          
          setLeagueData(data);
          setSelectedSeason(data.season);
        } else {
          // Fallback if API fails
          const fallbackData: LeagueData = {
            id: leagueId,
            name: leagueName || "League Name",
            country: country || "Country",
            logo: logoUrl || "https://media.api-sports.io/football/leagues/1.png",
            primaryColor: colors.primary,
            secondaryColor: colors.secondary,
            season: `${currentYear}-${currentYear + 1}`,
            availableSeasons: [`${currentYear}-${currentYear + 1}`],
            totalMatches: 0,
            playedMatches: 0,
            remainingMatches: 0,
            currentMatchday: 0,
            totalMatchdays: 0,
            startDate: "",
            endDate: "",
            teams: 0,
            info: {
              founded: null,
              country: country || "",
              type: "League",
              currentChampion: "",
              mostTitles: "",
            },
          };
          setLeagueData(fallbackData);
          setSelectedSeason(fallbackData.season);
        }
      } catch (error) {
        console.error("Error fetching league data:", error);
        // Fallback on error
        const colors = getLeagueColors(leagueId);
        const currentYear = new Date().getFullYear();
        const fallbackData: LeagueData = {
          id: leagueId,
          name: leagueName || "League Name",
          country: country || "Country",
          logo: logoUrl || "https://media.api-sports.io/football/leagues/1.png",
          primaryColor: colors.primary,
          secondaryColor: colors.secondary,
          season: `${currentYear}-${currentYear + 1}`,
          availableSeasons: [`${currentYear}-${currentYear + 1}`],
          totalMatches: 0,
          playedMatches: 0,
          remainingMatches: 0,
          currentMatchday: 0,
          totalMatchdays: 0,
          startDate: "",
          endDate: "",
          teams: 0,
          info: {
            founded: null,
            country: country || "",
            type: "League",
            currentChampion: "",
            mostTitles: "",
          },
        };
        setLeagueData(fallbackData);
        setSelectedSeason(fallbackData.season);
      } finally {
        setIsLoadingApi(false);
      }
    };

    // Fetch in background - don't block UI
    fetchLeagueData();
  }, [leagueId, leagueName, country, logoUrl]);

  // Define which tabs use season filtering - adapt for basketball
  const seasonAwareTabs: TabType[] = ["standings", "matches", "draft", "stats", "roster", "awards"];
  
  // Get tabs dynamically based on sport and league tier
  const tabs = React.useMemo(() => {
    const availableTabs = getAvailableTabs(sport, leagueId);
    
    // Log tier information for both basketball and football leagues
    if (sport === "basketball") {
      const tier = getBasketballLeagueTier(leagueId);
      console.log(`🏀 [LeagueDetails] Basketball League: ${leagueId}`);
      console.log(`📊 [LeagueDetails] League Tier: ${tier}`);
      console.log(`📑 [LeagueDetails] Available Tabs (${availableTabs.length}):`, availableTabs.map(t => t.label).join(", "));
    } else if (sport === "football") {
      const tier = getFootballLeagueTier(leagueId);
      console.log(`⚽ [LeagueDetails] Football League: ${leagueId}`);
      console.log(`📊 [LeagueDetails] League Tier: ${tier}`);
      console.log(`📑 [LeagueDetails] Available Tabs (${availableTabs.length}):`, availableTabs.map(t => t.label).join(", "));
    }
    
    return availableTabs;
  }, [sport, leagueId]);
  
  // Season selector is active when: tab is season-aware AND league data (match data) is available
  const isSeasonSelectorActive = seasonAwareTabs.includes(selectedTab) && !!leagueData && leagueData.totalMatchdays > 0;

  // Auto-scroll to selected tab
  const scrollToTab = (tabId: TabType) => {
    const tabPosition = tabPositionsRef.current[tabId];
    if (tabPosition !== undefined && tabsScrollViewRef.current) {
      const screenWidth = 375; // Approximate screen width
      const scrollPosition = Math.max(0, tabPosition - screenWidth / 2 + 50);
      tabsScrollViewRef.current.scrollTo({
        x: scrollPosition,
        animated: true,
      });
    }
  };

  useEffect(() => {
    scrollToTab(selectedTab);
  }, [selectedTab]);

  // Update tab when initialTab param changes
  useEffect(() => {
    if (initialTab && initialTab !== selectedTab) {
      setSelectedTab(initialTab);
    }
  }, [initialTab]);

  // Animate progress bar on mount
  useEffect(() => {
    if (leagueData && leagueData.totalMatches > 0) {
      const progressPercent = Math.min(
        leagueData.playedMatches / leagueData.totalMatches,
        1
      );
      Animated.timing(progressAnimation, {
        toValue: progressPercent,
        duration: 1500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    } else {
      // Default to 0 if no data
      progressAnimation.setValue(0);
    }
  }, [leagueData]);

  // Track league visit
  useEffect(() => {
    if (leagueData) {
      trackLeagueVisit(
        leagueData.id,
        leagueData.name,
        leagueData.logo,
        leagueData.country
      );
    }
  }, [leagueData]);

  // Always render - leagueData is initialized with empty structure
  if (!leagueData) {
    // Fallback - should never happen, but ensure we have a structure
    const colors = getLeagueColors(leagueId);
    const currentYear = new Date().getFullYear();
    setLeagueData({
      id: leagueId,
      name: leagueName || "",
      country: country || "",
      logo: logoUrl || "",
      primaryColor: colors.primary,
      secondaryColor: colors.secondary,
      season: `${currentYear}-${currentYear + 1}`,
      availableSeasons: [],
      totalMatches: 0,
      playedMatches: 0,
      remainingMatches: 0,
      currentMatchday: 0,
      totalMatchdays: 0,
      startDate: "",
      endDate: "",
      teams: 0,
      info: {
        founded: null,
        country: country || "",
        type: "",
        currentChampion: "",
        mostTitles: "",
      },
    });
  }

  const renderTabContent = () => {
    // Null safety check
    if (!leagueData) {
      return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={{ color: theme.colors.textSecondary, marginTop: 12 }}>Loading league data...</Text>
        </View>
      );
    }

    switch (selectedTab) {
      case "standings":
        return <LeagueStandings leagueId={leagueData.id} season={selectedSeason} theme={theme} sport={sport} />;
      case "matches":
        return <LeagueMatches leagueId={leagueData.id} season={selectedSeason} theme={theme} primaryColor={leagueData.primaryColor} sport={sport} />;
      case "moments":
        return <LeagueMoments leagueId={leagueData.id} season={selectedSeason} theme={theme} primaryColor={leagueData.primaryColor} sport={sport} />;
      case "draft":
        return (
          <LeagueDraft
            leagueId={leagueData.id}
            leagueName={leagueData.name}
            season={selectedSeason}
            theme={theme}
            apiLeagueId={resolvedApiLeagueId}
            sport={sport}
          />
        );
      case "transfers":
        // Transfers only for football
        if (sport === "football") {
          return <LeagueTransfers leagueId={leagueData.id} season={selectedSeason} theme={theme} apiLeagueId={resolvedApiLeagueId} sport={sport} />; // ✅ CRITICAL: Pass sport
        }
        return null;
      case "players":
        // Players only for football
        if (sport === "football") {
          return <LeaguePlayers leagueId={leagueData.id} season={selectedSeason} theme={theme} apiLeagueId={resolvedApiLeagueId} sport={sport} />; // ✅ CRITICAL: Pass sport
        }
        return null;
      case "stats":
        // Stats tab for basketball - league statistics and leaders
        if (sport === "basketball") {
          return (
            <View style={{ flex: 1, padding: 20 }}>
              <Text style={{ color: theme.colors.text, fontSize: 18, fontWeight: "bold", marginBottom: 16 }}>League Statistics</Text>
              <View style={{ padding: 16, backgroundColor: theme.colors.backgroundSecondary, borderRadius: 8 }}>
                <Text style={{ color: theme.colors.text, fontSize: 16, marginBottom: 8 }}>📊 Statistical Leaders</Text>
                <Text style={{ color: theme.colors.textSecondary, fontSize: 14 }}>• Points per game leaders</Text>
                <Text style={{ color: theme.colors.textSecondary, fontSize: 14 }}>• Assists leaders</Text>
                <Text style={{ color: theme.colors.textSecondary, fontSize: 14 }}>• Rebounds leaders</Text>
                <Text style={{ color: theme.colors.textSecondary, fontSize: 14, marginTop: 8 }}>Coming soon...</Text>
              </View>
            </View>
          );
        }
        return null;
      case "roster":
        // Roster tab for elite basketball leagues (NBA, Euroleague)
        if (sport === "basketball") {
          return (
            <View style={{ flex: 1, padding: 20 }}>
              <Text style={{ color: theme.colors.text, fontSize: 18, fontWeight: "bold", marginBottom: 16 }}>Team Rosters</Text>
              <View style={{ padding: 16, backgroundColor: theme.colors.backgroundSecondary, borderRadius: 8 }}>
                <Text style={{ color: theme.colors.text, fontSize: 16, marginBottom: 8 }}>🏀 All Team Rosters</Text>
                <Text style={{ color: theme.colors.textSecondary, fontSize: 14 }}>• Complete player listings</Text>
                <Text style={{ color: theme.colors.textSecondary, fontSize: 14 }}>• Player positions & stats</Text>
                <Text style={{ color: theme.colors.textSecondary, fontSize: 14 }}>• Team depth charts</Text>
                <Text style={{ color: theme.colors.textSecondary, fontSize: 14, marginTop: 8 }}>Coming soon...</Text>
              </View>
            </View>
          );
        }
        return null;
      case "awards":
        // Awards tab for elite basketball leagues (NBA, Euroleague)
        if (sport === "basketball") {
          return (
            <View style={{ flex: 1, padding: 20 }}>
              <Text style={{ color: theme.colors.text, fontSize: 18, fontWeight: "bold", marginBottom: 16 }}>League Awards</Text>
              <View style={{ padding: 16, backgroundColor: theme.colors.backgroundSecondary, borderRadius: 8 }}>
                <Text style={{ color: theme.colors.text, fontSize: 16, marginBottom: 8 }}>🏆 Season Awards</Text>
                <Text style={{ color: theme.colors.textSecondary, fontSize: 14 }}>• MVP (Most Valuable Player)</Text>
                <Text style={{ color: theme.colors.textSecondary, fontSize: 14 }}>• Rookie of the Year</Text>
                <Text style={{ color: theme.colors.textSecondary, fontSize: 14 }}>• Defensive Player of the Year</Text>
                <Text style={{ color: theme.colors.textSecondary, fontSize: 14 }}>• All-League Teams</Text>
                <Text style={{ color: theme.colors.textSecondary, fontSize: 14, marginTop: 8 }}>Coming soon...</Text>
              </View>
            </View>
          );
        }
        return null;
      case "data":
        // Data tab for basketball - general league info
        if (sport === "basketball") {
          return (
            <View style={{ flex: 1, padding: 20 }}>
              <Text style={{ color: theme.colors.text, fontSize: 18, fontWeight: "bold", marginBottom: 16 }}>League Data & Info</Text>
              <View style={{ padding: 16, backgroundColor: theme.colors.backgroundSecondary, borderRadius: 8 }}>
                <Text style={{ color: theme.colors.text, fontSize: 16, marginBottom: 8 }}>📈 General Information</Text>
                <Text style={{ color: theme.colors.textSecondary, fontSize: 14 }}>• League format & rules</Text>
                <Text style={{ color: theme.colors.textSecondary, fontSize: 14 }}>• Season schedule</Text>
                <Text style={{ color: theme.colors.textSecondary, fontSize: 14 }}>• Historical data</Text>
                <Text style={{ color: theme.colors.textSecondary, fontSize: 14, marginTop: 8 }}>Coming soon...</Text>
              </View>
            </View>
          );
        }
        return null;
      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {leagueData && (
        <>
          <StatusBar
            barStyle={isDarkMode ? "light-content" : "dark-content"}
            backgroundColor={fromStats ? theme.colors.background : leagueData.primaryColor}
          />

          {/* Beautiful Header with League Colors - Hidden when from stats screen */}
          {!fromStats && (
        <View
          style={[
            styles.header,
            {
              backgroundColor: leagueData.primaryColor,
            },
          ]}
        >
        <SafeAreaView edges={["top"]}>
          <View style={styles.headerContent}>
            {/* Header Actions Row */}
            <View style={styles.headerActionsRow}>
              {/* Back Button */}
              <TouchableOpacity
                onPress={() => router.back()}
                style={styles.backButton}
              >
                <ArrowLeft size={24} color="#FFFFFF" />
              </TouchableOpacity>
              
              {/* Right Actions: Share */}
              <View style={styles.headerRightActions}>
                <TouchableOpacity
                  style={styles.headerActionButton}
                  onPress={() => setShowShareModal(true)}
                >
                  <Share2 size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Centered League Logo and Info */}
            <View style={styles.centeredLeagueInfo}>
              <View style={styles.leagueLogo}>
                {leagueData.logo ? (
                  <Image 
                    source={{ uri: leagueData.logo }} 
                    style={styles.leagueLogoImage}
                    resizeMode="contain"
                  />
                ) : (
                  <Text style={styles.leagueLogoPlaceholder}>🏆</Text>
                )}
              </View>
              <Text style={styles.leagueName}>{leagueData.name}</Text>
              {/* ✅ CRITICAL: Display API country data only - no hardcoded overrides */}
              <Text style={styles.leagueCountry}>{leagueData.country}</Text>
            </View>

            {/* Season Progress Bar */}
            <View style={styles.seasonProgress}>
              <View style={styles.progressRow}>
                {/* Start Date with Arrow */}
                <View style={styles.progressDateContainer}>
                  <Text style={styles.progressDate}>
                    {leagueData.startDate.split("-").slice(1).join("/")}
                  </Text>
                </View>

                {/* Progress Bar with Animation */}
                <View style={styles.progressBarWrapper}>
                  <View style={styles.progressBarContainer}>
                    {/* Background Line (transparent) */}
                    <View style={styles.progressBar}>
                      {/* Animated Played Section (dull grey) */}
                      <View 
                        style={styles.progressBarInner}
                        onLayout={(e) => {
                          const width = e.nativeEvent.layout.width;
                          if (width > 0 && width !== progressBarWidth) {
                            setProgressBarWidth(width);
                          }
                        }}
                      >
                        {progressBarWidth > 0 && (
                          <Animated.View
                            style={[
                              styles.progressFill,
                              {
                                width: progressAnimation.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [0, progressBarWidth],
                                }),
                                backgroundColor: 'rgba(150, 150, 150, 0.6)', // Dull grey
                              },
                            ]}
                          />
                        )}
                      </View>
                    </View>
                  </View>
                  
                  {/* Matchday Text Above Bar */}
                  <View style={styles.progressTextContainer}>
                    <Text style={styles.progressText}>
                      {leagueData.currentMatchday > 0 && leagueData.totalMatchdays > 0
                        ? `${leagueData.currentMatchday}/${leagueData.totalMatchdays}`
                        : "-"}
                    </Text>
                  </View>
                </View>

                {/* End Date with Arrow */}
                <View style={styles.progressDateContainer}>
                  <Text style={styles.progressDate}>
                    {leagueData.endDate.split("-").slice(1).join("/")}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </View>
      )}

      {/* Back button for stats screen navigation */}
      {fromStats && (
        <SafeAreaView edges={["top"]} style={[styles.simpleHeader, { backgroundColor: theme.colors.background }]}>
          <View style={styles.simpleHeaderContent}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.simpleBackButton}
            >
              <ArrowLeft size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={[styles.simpleHeaderTitle, { color: theme.colors.text }]}>
              {leagueData.name}
            </Text>
            <TouchableOpacity
              style={styles.simpleShareButton}
              onPress={() => setShowShareModal(true)}
            >
              <Share2 size={20} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      )}

      {/* Tabs */}
      <View style={[styles.tabsContainer, { backgroundColor: theme.colors.background }]}>
        <ScrollView
          ref={tabsScrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScrollContent}
        >
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={styles.tab}
              onPress={() => setSelectedTab(tab.id)}
              onLayout={(event) => {
                tabPositionsRef.current[tab.id] = event.nativeEvent.layout.x;
              }}
            >
              {selectedTab === tab.id && (
                <View style={styles.tabIndicator} />
              )}
              <Text
                style={[
                  styles.tabText,
                  {
                    color: selectedTab === tab.id
                      ? theme.colors.text
                      : theme.colors.textSecondary,
                  },
                  selectedTab === tab.id && styles.tabTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Season Selector */}
        <TouchableOpacity
          style={[
            styles.seasonSelector,
            {
              backgroundColor: theme.colors.backgroundSecondary,
              opacity: isSeasonSelectorActive ? 1 : 0.4,
            },
          ]}
          onPress={() => isSeasonSelectorActive && setShowSeasonModal(true)}
          disabled={!isSeasonSelectorActive}
          activeOpacity={isSeasonSelectorActive ? 0.7 : 1}
        >
          <Text
            style={[
              styles.seasonText,
              {
                color: isSeasonSelectorActive
                  ? theme.colors.text
                  : theme.colors.textSecondary,
              },
            ]}
          >
            {selectedSeason.split("-")[0].slice(2)}-
            {selectedSeason.split("-")[1].slice(2)}
          </Text>
          <ChevronDown
            size={16}
            color={
              isSeasonSelectorActive
                ? theme.colors.text
                : theme.colors.textSecondary
            }
          />
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {renderTabContent()}
      </ScrollView>

      {/* Season Modal - Improved Design */}
      {/* Only show modal when league data (match data) is available */}
      {showSeasonModal && leagueData && leagueData.totalMatchdays > 0 && (
        <Modal
          visible={showSeasonModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowSeasonModal(false)}
        >
          <View style={styles.modalOverlay}>
            <TouchableOpacity
              style={styles.modalBackdrop}
              activeOpacity={1}
              onPress={() => setShowSeasonModal(false)}
            />
            <View
              style={[
                styles.seasonModal,
                { backgroundColor: theme.colors.background },
              ]}
            >
              <View style={[styles.modalHeader, { borderBottomColor: isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(128,128,128,0.2)" }]}>
                <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                  Select Season
                </Text>
                <TouchableOpacity
                  style={[styles.closeButton, { backgroundColor: isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(128,128,128,0.1)" }]}
                  onPress={() => setShowSeasonModal(false)}
                >
                  <Text style={[styles.closeButtonText, { color: theme.colors.textSecondary }]}>
                    ×
                  </Text>
                </TouchableOpacity>
              </View>

              <ScrollView 
                style={styles.seasonsContainer}
                contentContainerStyle={styles.seasonsContent}
                showsVerticalScrollIndicator={true}
                bounces={true}
              >
                {leagueData?.availableSeasons?.map((season) => (
                  <TouchableOpacity
                    key={season}
                    style={[
                      styles.seasonOption,
                      { borderBottomColor: isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(128,128,128,0.1)" }
                    ]}
                    onPress={() => {
                      setSelectedSeason(season);
                      setShowSeasonModal(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.seasonOptionText,
                        {
                          color: season === selectedSeason ? leagueData.primaryColor : theme.colors.text,
                          fontWeight: season === selectedSeason ? "600" : "400",
                        },
                      ]}
                    >
                      {season}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={[styles.modalFooter, { borderTopColor: isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(128,128,128,0.2)" }]}>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: theme.colors.backgroundSecondary }]}
                  onPress={() => setShowSeasonModal(false)}
                >
                  <Text style={[styles.actionButtonText, { color: theme.colors.textSecondary }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.confirmButton, { backgroundColor: leagueData?.primaryColor || "#38003C" }]}
                  onPress={() => setShowSeasonModal(false)}
                >
                  <Text style={styles.confirmButtonText}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Share Modal */}
      <ShareModal
        visible={showShareModal}
        onClose={() => setShowShareModal(false)}
        title={`Share ${leagueData?.name || 'League'}`}
        shareUrl={`league/${leagueId}`}
        shareText={`Check out ${leagueData?.name || 'this league'} on Champs Sports Lovers!`}
      />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  simpleHeader: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  simpleHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  simpleBackButton: {
    padding: 8,
  },
  simpleHeaderTitle: {
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
    marginHorizontal: 16,
  },
  simpleShareButton: {
    padding: 8,
  },
  header: {
    paddingBottom: 20,
  },
  headerContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  headerActionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    width: "100%",
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerRightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerActionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  centeredLeagueInfo: {
    alignItems: "center",
    marginBottom: 16,
  },
  leagueLogo: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(255, 255, 255, 0.15)", // ✅ Reduced opacity to prevent white wash
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    overflow: "hidden",
    // ✅ Add shadow to make logo stand out
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  leagueLogoImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    // ✅ Ensure logo maintains its original colors - no white wash
    tintColor: undefined, // Remove any tint that might cause white wash
  },
  leagueLogoPlaceholder: {
    fontSize: 45,
  },
  leagueName: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
    textAlign: "center",
  },
  leagueCountry: {
    fontSize: 15,
    color: "rgba(255, 255, 255, 0.85)",
    textAlign: "center",
  },
  seasonProgress: {
    marginTop: 16,
    marginBottom: -4,
    paddingHorizontal: 0,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  progressDateContainer: {
    alignItems: "center",
  },
  progressDate: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "500",
    marginBottom: 6,
  },
  progressBarWrapper: {
    flex: 1,
    marginHorizontal: 2,
    position: "relative",
  },
  progressBarContainer: {
    position: "relative",
  },
  progressBar: {
    width: "100%",
    height: 5,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 2.5,
    overflow: "hidden",
  },
  progressBarInner: {
    width: "100%",
    height: "100%",
    position: "relative",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2.5,
    position: "absolute",
    left: 0,
    top: 0,
  },
  progressTextContainer: {
    position: "absolute",
    top: -22,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  progressText: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "700",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  tabsContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(128, 128, 128, 0.2)",
  },
  tabsScrollContent: {
    paddingHorizontal: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 4,
    position: "relative",
  },
  tabIndicator: {
    position: "absolute",
    bottom: 0,
    left: "25%",
    right: "25%",
    height: 3,
    backgroundColor: "#FF3B30",
    borderRadius: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
  },
  tabTextActive: {
    fontWeight: "700",
  },
  seasonSelector: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 12,
    gap: 4,
  },
  seasonText: {
    fontSize: 13,
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  seasonModal: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 34,
    maxHeight: Dimensions.get("window").height * 0.55, // Limit to 55% of screen height - stops halfway
    width: "100%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 24,
    lineHeight: 24,
  },
  seasonsContainer: {
    maxHeight: Dimensions.get("window").height * 0.35, // Limit scrollable area for smooth scrolling
  },
  seasonsContent: {
    paddingVertical: 0,
  },
  seasonOption: {
    alignItems: "center",
    paddingVertical: 18,
    borderBottomWidth: 1,
  },
  seasonOptionText: {
    fontSize: 18,
    textAlign: "center",
  },
  modalFooter: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
    borderRadius: 8,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
  },
});
