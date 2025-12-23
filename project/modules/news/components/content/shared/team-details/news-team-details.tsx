import React, { useState, useRef, useEffect, useMemo } from "react";
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
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTheme } from "@/hooks/useTheme";
import { useTeamDetails } from "@/hooks/useTeamDetails";
import { teamColorService } from "@/services/teamColorService";
import { ArrowLeft, Share2, ChevronDown, Star } from "lucide-react-native";
import ShareModal from "../share-modal";
import { ActivityIndicator } from "react-native";
import NewsSeasonsSelector from "@/modules/news/components/shared/news-seasons-selector";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import NewsTeamMatches from "./matches/news-team-matches";
import NewsTeamDetailsMoments from "./news-team-details-moments";
import NewsTeamDetailsInfo from "./news-team-details-info";
import NewsTeamDetailsTable from "./news-team-details-table";
import { TeamSquad } from "./squad";
import TeamTransfers from "./transfers";
import TeamStats from "./stats";
import { followedTeamsService } from "@/services/followedTeamsService";

const { width } = Dimensions.get("window");

interface TeamData {
  id: string;
  name: string;
  englishName: string;
  logo: string;
  stadium: string;
  city: string;
  primaryColor: string;
  secondaryColor: string;
  position: number;
  points: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  recentForm: ("W" | "D" | "L")[];
  upcomingMatches: Array<{
    opponent: string;
    opponentLogo?: string;
    date: string;
    homeAway: "H" | "A";
  }>;
  news: Array<{
    id: string;
    title: string;
    summary: string;
    time: string;
    image: string;
  }>;
}

// Team colors are now handled by the teamColorService

const teamDataConfigurations: { [key: string]: TeamData } = {
  "vipers-sc": {
    id: "vipers-sc",
    name: "Vipers SC",
    englishName: "Vipers Sports Club",
    logo: "VS",
    stadium: "St. Mary's Stadium",
    city: "Kitende",
    primaryColor: "#4CAF50",
    secondaryColor: "#2E7D32",
    position: 1,
    points: 65,
    wins: 20,
    draws: 5,
    losses: 3,
    goalsFor: 58,
    goalsAgainst: 18,
    recentForm: ["W", "W", "D"],
    upcomingMatches: [
      { opponent: "KCCA FC", date: "10/05 20:00", homeAway: "H" },
      { opponent: "Express FC", date: "10/19 16:00", homeAway: "A" },
      { opponent: "SC Villa", date: "10/25 18:00", homeAway: "H" },
    ],
    news: [
      {
        id: "1",
        title:
          "Vipers SC tactical preparation intensifies ahead of KCCA FC clash",
        summary:
          "Coach reviews set pieces and defensive formations for the crucial home match",
        time: "2 hours ago",
        image:
          "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=90&h=70&fit=crop",
      },
      {
        id: "2",
        title:
          "Key players return from injury boost for upcoming KCCA FC fixture",
        summary:
          "Medical team confirms three players cleared for match selection",
        time: "5 hours ago",
        image:
          "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=90&h=70&fit=crop",
      },
      {
        id: "3",
        title:
          "Match day preparations: Vipers SC squad named for KCCA showdown",
        summary: "Final 18-man squad announced with focus on attacking options",
        time: "8 hours ago",
        image:
          "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=90&h=70&fit=crop",
      },
    ],
  },
  "real-madrid": {
    id: "real-madrid",
    name: "Real Madrid",
    englishName: "Real Madrid Club de Fútbol",
    logo: "RM",
    stadium: "Santiago Bernabéu",
    city: "Madrid",
    primaryColor: "#FEBE10",
    secondaryColor: "#00529F",
    position: 2,
    points: 6,
    wins: 6,
    draws: 0,
    losses: 1,
    goalsFor: 15,
    goalsAgainst: 5,
    recentForm: ["W", "W", "W"],
    upcomingMatches: [
      { opponent: "Villarreal", date: "10/05 03:00", homeAway: "H" },
      { opponent: "Getafe", date: "10/20 00:00", homeAway: "A" },
    ],
    news: [
      {
        id: "1",
        title:
          "Real Madrid squad training focuses on Villarreal tactical setup",
        summary:
          "Ancelotti drills counter-attack patterns ahead of home fixture",
        time: "1 hour ago",
        image:
          "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=90&h=70&fit=crop",
      },
      {
        id: "2",
        title: "Benzema and Vinicius Jr. sharp in final training session",
        summary: "Strike partnership looks ready for weekend's crucial match",
        time: "4 hours ago",
        image:
          "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=90&h=70&fit=crop",
      },
    ],
  },
};

// Enhanced team detection function
const detectTeamFromData = (teamId: string, teamName?: string): TeamData => {
  // First try exact teamId match
  if (teamDataConfigurations[teamId]) {
    return teamDataConfigurations[teamId];
  }

  // Try to find by team name
  if (teamName) {
    const foundTeam = Object.values(teamDataConfigurations).find(
      (team) =>
        team.name.toLowerCase() === teamName.toLowerCase() ||
        team.englishName.toLowerCase() === teamName.toLowerCase()
    );
    if (foundTeam) return foundTeam;
  }

  // Create dynamic team data if not found
  if (teamName) {
    const teamColors = teamColorService.getTeamColors(teamName);
    return {
      id: teamId,
      name: teamName,
      englishName: teamName,
      logo: teamColors.logo,
      stadium: "Home Stadium",
      city: "City",
      primaryColor: teamColors.primary,
      secondaryColor: teamColors.secondary,
      position: 1,
      points: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      recentForm: ["W", "W", "D"],
      upcomingMatches: [],
      news: [
        {
          id: "1",
          title: "Team prepares tactical setup for upcoming match",
          summary: "Final preparations underway ahead of crucial fixture",
          time: "3 hours ago",
          image:
            "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=90&h=70&fit=crop",
        },
        {
          id: "2",
          title: "Squad fitness update: Key players ready for selection",
          summary: "Medical team confirms players available for match day",
          time: "6 hours ago",
          image:
            "https://images.unsplash.com/photo-1577223625816-7546f13df25d?w=90&h=70&fit=crop",
        },
      ],
    };
  }

  // Default fallback
  return teamDataConfigurations["vipers-sc"];
};

export default function NewsTeamDetails({
  teamId,
  teamData: propTeamData,
  sport = "football", // ✅ Add sport parameter with default
}: {
  teamId: string;
  teamData?: TeamData;
  sport?: string; // ✅ Add to interface
}) {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  
  // ✅ Get sport from params or props
  const activeSport = (params.sport as string) || sport || "football";
  
  console.log("🏀⚽ [TeamDetails] Sport parameter:", {
    paramsSport: params.sport,
    propsSport: sport,
    activeSport,
    teamName: (params.teamName as string) || propTeamData?.name || teamId,
  });
  
  // ✅ Initialize selectedTab from params.defaultTab if provided, otherwise default to "moments"
  const [selectedTab, setSelectedTab] = useState(() => {
    const defaultTab = (params.defaultTab as string) || "moments";
    return defaultTab;
  });
  const [showShareModal, setShowShareModal] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedSeason, setSelectedSeason] = useState("25-26");
  const [showSeasonModal, setShowSeasonModal] = useState(false);
  const [isFollowed, setIsFollowed] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  
  // Refs for auto-scrolling tabs
  const tabsScrollViewRef = useRef<ScrollView>(null);
  const tabPositionsRef = useRef<{ [key: string]: number }>({});
  
  // ✅ Update selectedTab when defaultTab param changes (e.g., when navigating from Recent Form)
  useEffect(() => {
    const defaultTab = (params.defaultTab as string);
    if (defaultTab && defaultTab !== selectedTab) {
      console.log(`🔄 [TeamDetails] Setting tab from params.defaultTab: ${defaultTab}`);
      setSelectedTab(defaultTab);
    }
  }, [params.defaultTab]);

  // Check if we're in dark mode
  const isDarkMode =
    theme.colors.background === "#2A2A2A" || theme.colors.text === "#FFFFFF";

  // Helper function to detect and replace bright yellow with muted yellow (matches Chinese app)
  // Chinese app uses a more muted/darker yellow instead of bright yellow
  const getHeroBackgroundColor = (primary: string, secondary: string): string => {
    if (!primary) return theme.colors.primary;
    
    // Check if color is bright yellow (like #FFFF01, #FFD700, #FFE500, #FDE100)
    const isYellow = teamColorService.isLightColor(primary) && 
                     (primary.toUpperCase().includes("FFFF") || 
                      primary.toUpperCase().includes("FFD7") ||
                      primary.toUpperCase().includes("FFE5") ||
                      primary.toUpperCase().includes("FDE1"));
    
    if (isYellow) {
      // Use muted golden yellow that matches Chinese app screenshot
      // This is a darker, more professional yellow than bright #FFFF01
      return "#D4AF37"; // Muted golden yellow (matches Chinese app)
    }
    
    // For non-yellow colors, use primary as-is
    return primary;
  };

  // Helper function to get readable text color for team primary color
  // If team color is bright (like yellow), use appropriate contrast color
  // Otherwise, use the team color itself for selected tabs
  const getReadableTextColor = (teamColor: string | undefined | null): string => {
    // Safety check: if color is undefined/null, return default
    if (!teamColor || typeof teamColor !== 'string') {
      return isDarkMode ? "#FFFFFF" : "#000000";
    }
    
    try {
      const isBright = teamColorService.isLightColor(teamColor);
      if (isBright) {
        // For bright colors (yellow, light blue, etc.), use dark text for contrast
        return isDarkMode ? "#FFFFFF" : "#000000";
      }
      // For dark colors, use the team color itself
      return teamColor;
    } catch (error) {
      // Fallback if color parsing fails
      return isDarkMode ? "#FFFFFF" : "#000000";
    }
  };

  // Define tabs that use season filtering
  const seasonAwareTabs = ["table", "matches", "transfers", "stats", "squad"];
  const isSeasonSelectorActive = seasonAwareTabs.includes(selectedTab);

  // Determine league ID from team name or params
  // Map team names to their league IDs for proper API coverage
  const getLeagueIdFromTeam = (name: string): number | undefined => {
    const teamLower = name.toLowerCase();
    
    // ✅ FIXED: Uganda teams now have API coverage (League ID: 288)
    if (teamLower.includes('uganda') || teamLower.includes('vipers') || 
        teamLower.includes('kcca') || teamLower.includes('express') ||
        teamLower.includes('sc villa') || teamLower.includes('ura fc') ||
        teamLower.includes('bul fc')) {
      return 288; // Uganda Premier League
    }
    
    // English Premier League (39)
    if (teamLower.includes('arsenal') || teamLower.includes('chelsea') || 
        teamLower.includes('liverpool') || teamLower.includes('manchester') ||
        teamLower.includes('tottenham') || teamLower.includes('everton')) {
      return 39;
    }
    
    // Spanish La Liga (140)
    if (teamLower.includes('barcelona') || teamLower.includes('madrid') || 
        teamLower.includes('atletico') || teamLower.includes('sevilla') ||
        teamLower.includes('valencia') || teamLower.includes('villarreal')) {
      return 140;
    }
    
    // Italian Serie A (135)
    if (teamLower.includes('juventus') || teamLower.includes('milan') || 
        teamLower.includes('inter') || teamLower.includes('roma') ||
        teamLower.includes('napoli') || teamLower.includes('lazio')) {
      return 135;
    }
    
    // German Bundesliga (78)
    if (teamLower.includes('bayern') || teamLower.includes('dortmund') || 
        teamLower.includes('leipzig') || teamLower.includes('leverkusen')) {
      return 78;
    }
    
    // French Ligue 1 (61)
    if (teamLower.includes('psg') || teamLower.includes('marseille') || 
        teamLower.includes('lyon') || teamLower.includes('monaco')) {
      return 61;
    }
    
    return undefined; // Unknown team - let API try to find it
  };

  const inferredLeagueId = params.leagueId
    ? Number(params.leagueId)
    : getLeagueIdFromTeam((params.teamName as string) || propTeamData?.name || teamId);

  console.log("🔍 [TeamDetails] League ID Detection:");
  console.log("  - Params League ID:", params.leagueId);
  console.log("  - Inferred League ID:", inferredLeagueId);
  console.log("  - Team Name:", (params.teamName as string) || propTeamData?.name || teamId);

  // Extract teamId from params if available
  const paramTeamId = params.teamId ? parseInt(params.teamId as string) : undefined;
  
  // Fetch real team data from comprehensive API
  const {
    teamInfo,
    statistics,
    upcomingMatches: apiUpcomingMatches,
    recentMatches,
    squad,
    transfers,
    leagueStandings,
    news: apiNews,
    formerManagers,
    honors,
    loading: apiLoading,
    error: apiError,
  } = useTeamDetails(
    (params.teamName as string) || propTeamData?.name || teamId,
    inferredLeagueId,
    parseInt(selectedSeason.split("-")[0]) + 2000,
    paramTeamId, // Pass teamId for accurate team detection
    activeSport // ✅ Pass sport parameter
  );

  // Function to check if a match is live
  const isMatchLive = (matchDate: string, matchTime: string) => {
    const now = new Date();
    const [month, day] = matchDate.split("/");
    const [hours, minutes] = matchTime.split(":");

    const matchDateTime = new Date();
    matchDateTime.setMonth(parseInt(month) - 1);
    matchDateTime.setDate(parseInt(day));
    matchDateTime.setHours(parseInt(hours));
    matchDateTime.setMinutes(parseInt(minutes));

    // Check if match started and hasn't ended (assuming 2 hour match duration)
    const matchStart = matchDateTime.getTime();
    const matchEnd = matchStart + 2 * 60 * 60 * 1000; // 2 hours
    const currentTime = now.getTime();

    return currentTime >= matchStart && currentTime <= matchEnd;
  };

  // Function to calculate countdown to match
  const getCountdownData = (matchDate: string, matchTime: string) => {
    const [month, day] = matchDate.split("/");
    const [hours, minutes] = matchTime.split(":");

    const matchDateTime = new Date();
    matchDateTime.setMonth(parseInt(month) - 1);
    matchDateTime.setDate(parseInt(day));
    matchDateTime.setHours(parseInt(hours));
    matchDateTime.setMinutes(parseInt(minutes));

    const diff = matchDateTime.getTime() - currentTime.getTime();

    if (diff <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, showSeconds: false };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours_left = Math.floor(
      (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    const minutes_left = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds_left = Math.floor((diff % (1000 * 60)) / 1000);

    // Show seconds only when less than 1 minute remaining
    const showSeconds = diff < 60 * 1000;

    return {
      days,
      hours: hours_left,
      minutes: minutes_left,
      seconds: seconds_left,
      showSeconds,
    };
  };

  // Update timer every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Merge ONLY real API data - NO fallback to mock data for stats
  const fallbackData = detectTeamFromData(teamId, (params.teamName as string) || "");
  
  const teamData: TeamData = propTeamData || {
    id: teamId,
    name: teamInfo?.name || fallbackData.name,
    englishName: teamInfo?.englishName || fallbackData.englishName,
    logo: teamInfo?.logo || fallbackData.logo,
    stadium: teamInfo?.stadium || fallbackData.stadium,
    city: teamInfo?.city || fallbackData.city,
    primaryColor: fallbackData.primaryColor, // Use color config
    secondaryColor: fallbackData.secondaryColor,
    // ONLY use real API data for stats - show 0 if not available
    position: statistics?.position || 0,
    points: statistics?.points || 0,
    wins: statistics?.wins || 0,
    draws: statistics?.draws || 0,
    losses: statistics?.losses || 0,
    goalsFor: statistics?.goalsFor || 0,
    goalsAgainst: statistics?.goalsAgainst || 0,
    // ONLY use real API form data
    recentForm: statistics?.recentForm.length ? statistics.recentForm.slice(-3) as ("W" | "D" | "L")[] : [],
    upcomingMatches: apiUpcomingMatches.length > 0
      ? apiUpcomingMatches.map(m => ({
          opponent: m.opponent,
          opponentLogo: m.opponentLogo,
          date: `${m.date} ${m.time}`,
          homeAway: m.homeAway,
        }))
      : [],
    news: apiNews.length > 0 ? apiNews : [],
  };
  
  // REMOVED: No loading overlay - display data immediately as it loads
  const isInitialLoading = false; // Disable loading overlay
  
  // Check if we have real data (not from mock/fallback)
  const hasRealStatsData = statistics !== null && (
    statistics.position > 0 || 
    statistics.matchesPlayed > 0 || 
    (teamInfo?.fifaRanking && teamInfo.fifaRanking > 0) ||
    (teamInfo?.averageAge && teamInfo.averageAge > 0)
  );

  // Get team colors dynamically using enhanced service
  const teamColors = teamColorService.getTeamColors(teamData.name, teamInfo || undefined);
  
  // Get hero background color (replaces yellow with Chinese app color)
  const heroBackgroundColor = getHeroBackgroundColor(teamColors.primary, teamColors.secondary);
  
  // Always use white text to match the header icons
  const heroTextColor = "#FFFFFF";
  
  // ============================================================================
  // FOLLOW/UNFOLLOW FUNCTIONALITY
  // ============================================================================
  
  // Check if team is followed
  useEffect(() => {
    const checkFollowStatus = async () => {
      const followed = await followedTeamsService.isTeamFollowed(teamId);
      setIsFollowed(followed);
    };
    checkFollowStatus();
  }, [teamId]);
  
  // Handle follow/unfollow
  const handleToggleFollow = async () => {
    setIsFollowLoading(true);
    try {
      if (isFollowed) {
        // Unfollow
        const success = await followedTeamsService.unfollowTeam(teamId);
        if (success) {
          setIsFollowed(false);
        }
      } else {
        // Follow
        const success = await followedTeamsService.followTeam({
          teamId: teamId,
          teamName: teamData.name,
          teamLogo: teamData.logo,
          sport: activeSport, // ✅ Use activeSport instead of params
          league: teamInfo?.league?.name,
        });
        if (success) {
          setIsFollowed(true);
        }
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
    } finally {
      setIsFollowLoading(false);
    }
  };
  
  // ============================================================================
  // DYNAMIC TAB VISIBILITY - Hide "Table" tab if no league data available
  // ============================================================================
  
  /**
   * SMART CHECK: Show Table tab if league ID exists, hide only if confirmed no data
   * 
   * RULES:
   * 1. If standings successfully loaded → SHOW tab ✅
   * 2. If API returned league ID → SHOW tab (let user try) ✅
   * 3. If no league ID from API → HIDE tab ❌
   * 4. If known invalid league → HIDE tab ❌
   * 5. Future-proof: New APIs with more leagues will work automatically
   */
  const hasTableDataAvailable = (): boolean => {
    // Rule 1: If standings successfully loaded, ALWAYS show tab
    if (leagueStandings && leagueStandings.length > 0) {
      console.log("📊 [TabVisibility] ✅ Table available - Standings successfully loaded");
      return true;
    }
    
    // REMOVED: Don't block rendering - show data as it loads
    // Rule 2: Always show tab, even if data is loading
    // if (apiLoading.teamInfo) {
    //   console.log("📊 [TabVisibility] ⏳ Waiting for team info to load...");
    //   return false;
    // }
    
    // Rule 3: Check if API returned league information
    const apiLeagueId = teamInfo?.league?.id;
    
    if (!apiLeagueId) {
      console.log("📊 [TabVisibility] ❌ No table - API did not return league information");
      console.log("   Team:", teamData.name);
      return false;
    }
    
    // Rule 4: Validate league ID is reasonable (not 0, not negative, not obviously wrong)
    if (apiLeagueId <= 0 || apiLeagueId > 10000) {
      console.log("📊 [TabVisibility] ❌ No table - Invalid league ID:", apiLeagueId);
      return false;
    }
    
    // Rule 5: Check for known problematic league IDs that NEVER have standings
    // IMPORTANT: Only add leagues here if you're 100% sure they never have standings
    const knownInvalidLeagues = [10]; // League 10 doesn't exist in API-Football
    if (knownInvalidLeagues.includes(apiLeagueId)) {
      console.log("📊 [TabVisibility] ❌ No table - Known invalid league ID:", apiLeagueId);
      return false;
    }
    
    // Rule 6: If API confirmed league, show the tab!
    // The UniversalLeagueTable will handle showing proper error messages if data isn't available
    console.log("📊 [TabVisibility] ✅ Table available - API confirmed league ID:", apiLeagueId);
    return true;
  };

  // Dynamically build tabs based on data availability AND sport type
  const allTabs = [
    { id: "moments", label: "Moments" },
    { id: "info", label: "Info" },
    { id: "table", label: "Table" }, // Will be filtered if not available
    { id: "matches", label: "Matches" },
    { id: "squad", label: "Squad" },
    { id: "transfers", label: "Transfers" },
    { id: "stats", label: "Stats" },
  ];

  // ✅ Filter out tabs based on sport and data availability
  // Re-compute whenever relevant data changes
  const tabs = useMemo(() => {
    return allTabs.filter(tab => {
      // ✅ TRANSFERS: Always show for football if teamId exists (TeamTransfers fetches its own data)
      // For basketball, hide transfers tab (not supported yet)
      if (tab.id === "transfers") {
        // Always show for football if we have a teamId (TeamTransfers component handles its own loading/empty states)
        if (activeSport === "football") {
          const hasTeamId = teamInfo?.id !== undefined && teamInfo?.id !== null;
          if (hasTeamId) {
            console.log(`📊 [TabVisibility] ✅ Transfers tab available for football - TeamId: ${teamInfo?.id}`);
            return true;
          } else {
            console.log(`📊 [TabVisibility] ⏳ Transfers tab waiting for teamId...`);
            // Still show if team info is loading (optimistic display)
            return apiLoading.teamInfo;
          }
        }
        
        // Hide for basketball (transfers not supported yet)
        if (activeSport === "basketball") {
          console.log("🏀 [TabVisibility] Hiding Transfers tab for basketball");
          return false;
        }
        
        return false;
      }
      
      // ✅ BASKETBALL: Hide "Table" tab (no league standings for basketball yet)
      if (activeSport === "basketball" && tab.id === "table") {
        console.log("🏀 [TabVisibility] Hiding Table tab for basketball");
        return false;
      }
      
      // ✅ FOOTBALL: Show Table tab only if league data available
      if (activeSport === "football" && tab.id === "table") {
        return hasTableDataAvailable();
      }
      
      return true; // Show all other tabs
    });
  }, [
    leagueStandings?.length,      // Re-check when standings data changes
    apiLoading.teamInfo,          // Re-check when team info loading changes
    teamInfo?.league?.id,         // Re-check when API returns league info
    teamInfo?.id,                 // ✅ Re-check when teamId changes (needed for Transfers)
    teamData.name,                // Re-check when team changes
    activeSport,                  // ✅ Re-check when sport changes
  ]);

  // Auto-switch away from "table" tab if it becomes unavailable
  useEffect(() => {
    const tableTabExists = tabs.some(tab => tab.id === "table");
    
    if (selectedTab === "table" && !tableTabExists) {
      console.log("⚠️ [TabVisibility] Table tab not available, switching to Info tab");
      setSelectedTab("info");
    }
  }, [tabs, selectedTab]);

  // Auto-scroll to selected tab
  const scrollToTab = (tabId: string) => {
    const tabPosition = tabPositionsRef.current[tabId];
    if (tabPosition !== undefined && tabsScrollViewRef.current) {
      // Calculate the center position for the tab
      const screenWidth = Dimensions.get('window').width;
      // Improved scrolling: center the tab in view with better offset calculation
      // Account for tab width (~80-100px) to properly center
      const tabWidth = 90; // Average tab width
      const scrollToPosition = Math.max(0, tabPosition - (screenWidth / 2) + (tabWidth / 2));
      
      tabsScrollViewRef.current.scrollTo({
        x: scrollToPosition,
        y: 0,
        animated: true,
      });
      
      console.log(`🎯 Auto-scrolling to tab: ${tabId} at position ${tabPosition} (scroll to: ${scrollToPosition})`);
    }
  };

  // Trigger auto-scroll when tab changes
  useEffect(() => {
    scrollToTab(selectedTab);
  }, [selectedTab]);

  const renderFormIndicator = (result: "W" | "D" | "L", index: number, isLast: boolean = false) => {
    const backgroundColor =
      result === "W" ? "#4CAF50" : result === "D" ? "#FF9800" : "#F44336";
    // Form indicators use semantic colors (green/orange/red), so use white text for contrast
    const formTextColor = "#FFFFFF";

    return (
      <View key={index} style={styles.formIndicatorWrapper}>
        <View style={[styles.formIndicator, { backgroundColor }]}>
          <Text style={[styles.formText, { color: formTextColor }]}>{result}</Text>
        </View>
        {isLast && <View style={styles.currentIndicatorLine} />}
      </View>
    );
  };

  // Smart function to determine if we should use Recent 5 matches instead of Recent 3
  // Returns: { useRecent5: boolean, recent5Form: ("W" | "D" | "L")[] }
  const getSmartRecentForm = useMemo(() => {
    // Count available hero stats items
    const availableStatsCount = [
      statistics?.position && statistics.position > 0,
      teamInfo?.fifaRanking && teamInfo.fifaRanking > 0,
      teamInfo?.averageAge && teamInfo.averageAge > 0,
      statistics?.recentForm && statistics.recentForm.length > 0,
    ].filter(Boolean).length;

    console.log(`🔍 [HeroStats] Available stats count: ${availableStatsCount}/4`);

    // If less than 3 stats available, use Recent 5 matches
    if (availableStatsCount < 3 && recentMatches.length > 0) {
      // Get recent 5 matches and convert to W/D/L form
      const recent5Matches = recentMatches.slice(0, 5);
      const recent5Form: ("W" | "D" | "L")[] = recent5Matches.map((match) => {
        // Determine if team won, drew, or lost
        if (match.homeScore === undefined || match.homeScore === null || 
            match.awayScore === undefined || match.awayScore === null) {
          // If scores are not available, skip this match
          return null;
        }

        const isHome = match.homeAway === "H";
        const teamScore = isHome ? match.homeScore : match.awayScore;
        const opponentScore = isHome ? match.awayScore : match.homeScore;

        if (teamScore > opponentScore) return "W";
        if (teamScore === opponentScore) return "D";
        return "L";
      }).filter((result): result is "W" | "D" | "L" => result !== null);

      console.log(`📊 [HeroStats] Using Recent 5 matches: ${recent5Form.length} results`, recent5Form);

      return {
        useRecent5: true,
        recent5Form: recent5Form.slice(0, 5), // Ensure max 5
      };
    }

    // Normal Recent 3 logic
    const recent3Form = statistics?.recentForm?.slice(-3) || [];
    console.log(`📊 [HeroStats] Using Recent 3 form: ${recent3Form.length} results`, recent3Form);

    return {
      useRecent5: false,
      recent5Form: [],
    };
  }, [statistics, teamInfo, recentMatches]);

  const animatedHeaderStyle = {
    opacity: scrollY.interpolate({
      inputRange: [0, 200],
      outputRange: [0, 1],
      extrapolate: "clamp",
    }),
  };

  const renderTabContent = () => {
    switch (selectedTab) {
      case "moments":
        return (
          <NewsTeamDetailsMoments
            teamData={teamData}
            theme={theme}
            teamColors={{ ...teamColors, primary: heroBackgroundColor }}
            isMatchLive={isMatchLive}
            getCountdownData={getCountdownData}
            loading={apiLoading.matches}
            sport={activeSport} // ✅ Pass sport
          />
        );
      case "info":
        return (
          <NewsTeamDetailsInfo
            teamData={teamData}
            teamInfo={teamInfo}
            formerManagers={formerManagers}
            honors={honors}
            theme={theme}
            loading={apiLoading.teamInfo}
            teamId={teamInfo?.id ? parseInt(teamInfo.id.toString(), 10) : undefined}
            leagueId={teamInfo?.league?.id}
            teamColors={{ ...teamColors, primary: heroBackgroundColor }}
            sport={activeSport} // ✅ Pass sport
          />
        );
      case "table":
        // CRITICAL FIX: ONLY use API-confirmed league ID, ignore inferred ID
        // This prevents errors from invalid league IDs like "10"
        const apiConfirmedLeagueId = teamInfo?.league?.id;
        
        console.log("🏈 [TeamDetails] Rendering Table:");
        console.log("  - Team Name:", teamData.name);
        console.log("  - API League ID:", apiConfirmedLeagueId);
        console.log("  - League Name:", teamInfo?.league?.name);
        console.log("  - Country:", teamInfo?.country);
        console.log("  - Standings Loaded:", leagueStandings?.length || 0);
        
        // SAFETY CHECK: If no API-confirmed league ID, show message
        // This should rarely happen since hasTableDataAvailable() should hide the tab
        if (!apiConfirmedLeagueId) {
          console.warn("⚠️ [TeamDetails] No API league ID - showing fallback message");
          return (
            <View style={[
              { 
                flex: 1, 
                justifyContent: "center", 
                alignItems: "center",
                padding: 20,
                backgroundColor: theme.colors.background 
              }
            ]}>
              <Text style={{ 
                color: theme.colors.textSecondary,
                textAlign: "center",
                fontSize: 16,
                marginBottom: 10
              }}>
                No league data available for this team.
              </Text>
              <Text style={{ 
                color: theme.colors.textSecondary,
                textAlign: "center",
                fontSize: 14
              }}>
                The API did not return league information.
              </Text>
            </View>
          );
        }
        
        // REMOVED: No loading state - show data immediately
        const isTableLoading = false; // Disable loading state
        
        return (
          <NewsTeamDetailsTable
            standings={leagueStandings}
            currentTeamName={teamData.name}
            theme={theme}
            teamColors={{ ...teamColors, primary: heroBackgroundColor }}
            isDarkMode={isDarkMode}
            loading={isTableLoading}
            leagueId={apiConfirmedLeagueId}
            leagueName={teamInfo?.league?.name}
            country={teamInfo?.country}
            competitionName={teamInfo?.league?.name}
            season={parseInt(selectedSeason.split("-")[0]) + 2000}
            teamId={teamInfo?.id}
          />
        );
      case "matches":
        return (
          <NewsTeamMatches
            teamName={teamData.name}
            teamId={teamInfo?.id}
            leagueId={teamInfo?.league?.id}
            selectedSeason={selectedSeason}
            teamLogoUrl={teamData.logo}
            teamColors={{ ...teamColors, primary: heroBackgroundColor }}
            sport={activeSport} // ✅ CRITICAL: Pass sport parameter
          />
        );
      case "squad":
        // Create manager object from teamInfo and formerManagers (includes current manager)
        const currentManager = formerManagers && formerManagers.length > 0 
          ? formerManagers[0] // First manager in list is usually current
          : null;
        
        // Get manager photo - prioritize from formerManagers, ensure it's a valid URL
        let managerPhoto = currentManager?.photo;
        if (managerPhoto && managerPhoto !== "" && managerPhoto !== "null") {
          // Ensure it's a full URL (API Football photos are usually full URLs)
          if (!managerPhoto.startsWith("http")) {
            // If it's not a full URL, it might be a relative path - construct full URL
            managerPhoto = `https://media.api-sports.io/football/coachs/${managerPhoto}`;
          }
        } else {
          managerPhoto = undefined;
        }
        
        const managerData = teamInfo?.teamManager || currentManager
          ? {
              id: 0,
              name: currentManager?.name || teamInfo?.teamManager || "Manager",
              photo: managerPhoto,
              age: undefined,
              nationality: teamInfo?.country,
              country: teamInfo?.country,
            }
          : undefined;

        // Calculate season year for squad fetching
        const squadSeasonYear = parseInt(selectedSeason.split("-")[0]) + 2000;
        console.log(`🔍 [TeamDetails] Squad tab - Season: ${selectedSeason} (${squadSeasonYear}), Players: ${squad.length}`);

        // Helper function to check if a URL is a country flag (not a team logo)
        const isCountryFlagUrl = (url: string | undefined | null): boolean => {
          if (!url) return false;
          const urlLower = url.toLowerCase();
          // Check for common country flag URL patterns
          return (
            urlLower.includes('flagcdn.com') ||
            urlLower.includes('flag') ||
            urlLower.includes('country') ||
            urlLower.includes('national') ||
            urlLower.match(/\/flags?\/|\/country\//) !== null
          );
        };

        // Get team logo and validate it's not a country flag
        const rawTeamLogo = teamData.logo || teamInfo?.logo;
        const validTeamLogo = rawTeamLogo && !isCountryFlagUrl(rawTeamLogo) 
          ? rawTeamLogo 
          : undefined; // Don't pass country flags as team logos

        console.log(`🏷️ [TeamDetails] Squad tab - Team logo validation:`, {
          teamName: teamData.name,
          rawTeamLogo,
          validTeamLogo,
          isCountryFlag: isCountryFlagUrl(rawTeamLogo),
        });

        return (
          <TeamSquad
            manager={managerData}
            squad={squad}
            injuries={[]} // TODO: Add injuries API endpoint
            theme={theme}
            loading={apiLoading.squad}
            isDarkMode={isDarkMode}
            sourceTeamName={teamData.name} // Pass team name for watermark in player-details
            sourceTeamLogo={validTeamLogo} // Pass validated team logo (not country flag) for watermark in player-details
            sport={activeSport} // ✅ Pass sport parameter
          />
        );
      case "transfers":
        return (
          <TeamTransfers
            teamId={teamInfo?.id}
            teamName={teamData.name}
            season={selectedSeason}
            theme={theme}
            sport={activeSport} // ✅ Pass sport parameter
          />
        );
      case "stats":
        return (
          <TeamStats
            teamId={teamInfo?.id ? parseInt(teamInfo.id.toString()) : undefined}
            teamName={teamData.name}
            season={selectedSeason}
            theme={theme}
            teamColors={{ ...teamColors, primary: heroBackgroundColor }}
            sport={activeSport} // ✅ Pass sport parameter
          />
        );
      default:
        return (
          <View
            style={[
              styles.tabContent,
              {
                backgroundColor: theme.colors.background,
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
              },
            ]}
          >
            <Text
              style={[
                styles.comingSoonText,
                {
                  color: theme.colors.textSecondary,
                },
              ]}
            >
              {tabs.find((t) => t.id === selectedTab)?.label} - Coming Soon
            </Text>
          </View>
        );
    }
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      {/* Minimal Loading Overlay - Only for initial team info */}
      {isInitialLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={heroBackgroundColor} />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            Loading {teamData.name}...
          </Text>
        </View>
      )}

      {/* Error Message */}
      {apiError && !isInitialLoading && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{apiError}</Text>
        </View>
      )}

      {/* Animated Header */}
      <Animated.View
        style={[
          styles.animatedHeader,
          animatedHeaderStyle,
          {
            paddingTop: insets.top,
            backgroundColor: heroBackgroundColor + "F0",
          },
        ]}
      >
        <TouchableOpacity
          style={styles.animatedBackButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.animatedHeaderTitle}>{teamData.name}</Text>
        <View style={styles.animatedHeaderActions}>
          <TouchableOpacity 
            style={styles.animatedHeaderButton}
            onPress={handleToggleFollow}
            disabled={isFollowLoading}
          >
            <Star 
              size={24} 
              color="white" 
              fill={isFollowed ? "white" : "transparent"}
            />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.animatedHeaderButton}
            onPress={() => setShowShareModal(true)}
          >
            <Share2 size={24} color="white" />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <ScrollView
        style={[
          styles.scrollView,
          { backgroundColor: theme.colors.background },
        ]}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View
          style={[
            styles.heroSection,
            {
              backgroundColor: heroBackgroundColor,
              paddingTop: insets.top + 10,
            },
          ]}
        >
          {/* Transparent team logo watermark */}
          {teamData.logo && (
            <Image
              source={{ uri: teamData.logo }}
              style={styles.heroBackgroundLogo}
              resizeMode="contain"
            />
          )}

          <View style={styles.heroHeader}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <ArrowLeft size={24} color="white" />
            </TouchableOpacity>

            <View style={styles.headerActions}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={handleToggleFollow}
                disabled={isFollowLoading}
              >
                <Star 
                  size={24} 
                  color="white" 
                  fill={isFollowed ? "white" : "transparent"}
                />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => setShowShareModal(true)}
              >
                <Share2 size={24} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.teamInfo}>
            {teamData.logo ? (
              <Image
                source={{ uri: teamData.logo }}
                style={styles.teamLogoImage}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.teamLogoContainer}>
                <Text style={styles.teamLogoText}>
                  {teamData.name
                    .split(" ")
                    .map((word) => word[0])
                    .join("")
                    .slice(0, 2)}
                </Text>
              </View>
            )}
            <Text style={[styles.teamName, { color: heroTextColor }]}>{teamData.name}</Text>
            <Text style={[styles.teamSubtitle, { color: heroTextColor }]}>
              {teamData.englishName} | {teamData.stadium}
            </Text>
          </View>

          {/* Always show stats container - with skeleton or real data - Horizontally scrollable */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.statsScrollContent}
            style={styles.statsScrollContainer}
          >
            <View style={styles.statsContainer}>
            {/* Show skeleton loaders while loading, real data when available */}
            {apiLoading.statistics ? (
              // Skeleton loaders for statistics
              <>
                <View style={styles.statItem}>
                  <View style={[styles.skeletonValue, { backgroundColor: heroTextColor + "33" }]} />
                  <Text style={[styles.statLabel, { color: heroTextColor }]}>League Position</Text>
                </View>
                <View style={styles.statItem}>
                  <View style={[styles.skeletonValue, { backgroundColor: heroTextColor + "33" }]} />
                  <Text style={[styles.statLabel, { color: heroTextColor }]}>Club Points</Text>
                </View>
                <View style={styles.statItem}>
                  <View style={[styles.skeletonValue, { backgroundColor: heroTextColor + "33" }]} />
                  <Text style={[styles.statLabel, { color: heroTextColor }]}>League Record</Text>
                </View>
                <View style={styles.formSection}>
                  <View style={styles.recentForm}>
                    {[1, 2, 3, 4, 5].map((_, index) => (
                      <View key={index} style={[styles.formIndicator, { backgroundColor: heroTextColor + "33" }]} />
                    ))}
                  </View>
                  <Text style={[styles.formLabel, { color: heroTextColor }]}>Recent 5</Text>
                </View>
              </>
            ) : hasRealStatsData ? (
              // Real API data - Order: League Position (left) -> FIFA Ranking (right of League Position) -> Average Age (right side) -> Recent Games (far right)
              <>
                {/* League Position - Centered */}
                {statistics?.position && statistics.position > 0 && (
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: heroTextColor }]} numberOfLines={1}>{statistics.position}</Text>
                    <Text style={[styles.statLabel, { color: heroTextColor }]} numberOfLines={1}>League Position</Text>
                  </View>
                )}

                {/* FIFA Ranking - Positioned right after League Position */}
                {(() => {
                  // Always log for debugging - make it very visible
                  if (teamInfo) {
                    console.log(`🏆🏆🏆 [HeroStats] FIFA RANKING CHECK for ${teamInfo.name}:`, {
                      fifaRanking: teamInfo.fifaRanking,
                      fifaRankingType: typeof teamInfo.fifaRanking,
                      hasFifaRanking: !!teamInfo.fifaRanking,
                      isGreaterThanZero: teamInfo.fifaRanking && teamInfo.fifaRanking > 0,
                      fullTeamInfo: JSON.stringify(teamInfo, null, 2)
                    });
                  } else {
                    console.warn(`⚠️⚠️⚠️ [HeroStats] teamInfo is NULL!`);
                  }
                  
                  const shouldShow = teamInfo?.fifaRanking && teamInfo.fifaRanking > 0;
                  console.log(`🏆🏆🏆 [HeroStats] Should show FIFA ranking? ${shouldShow}`);
                  
                  return shouldShow ? (
                    <View style={styles.statItem}>
                      <Text style={[styles.statValue, { color: heroTextColor }]} numberOfLines={1}>{teamInfo.fifaRanking}</Text>
                      <Text style={[styles.statLabel, { color: heroTextColor }]} numberOfLines={1}>FIFA</Text>
                    </View>
                  ) : null;
                })()}

                {/* Average Age - Positioned to the right side */}
                {teamInfo?.averageAge && teamInfo.averageAge > 0 && (
                  <View style={[styles.statItem, styles.statItemRight]}>
                    <Text style={[styles.statValue, { color: heroTextColor }]} numberOfLines={1}>{teamInfo.averageAge.toFixed(1)}</Text>
                    <Text style={[styles.statLabel, { color: heroTextColor }]} numberOfLines={1}>Average Age</Text>
                  </View>
                )}

                {/* Smart Recent Form: Use Recent 5 if less than 3 stats available, otherwise Recent 5 - Positioned at far right edge */}
                {(getSmartRecentForm.useRecent5 ? getSmartRecentForm.recent5Form.length > 0 : 
                  statistics?.recentForm && statistics.recentForm.length > 0) && (
                  <View style={[styles.statItem, styles.statItemRight]}>
                    <View style={styles.recentForm}>
                      {getSmartRecentForm.useRecent5 ? (
                        // Display Recent 5 matches
                        getSmartRecentForm.recent5Form.map((result, index, array) => 
                          renderFormIndicator(result, index, index === array.length - 1)
                        )
                      ) : (
                        // Display Recent 5 form (normal behavior)
                        statistics.recentForm.slice(-5).map((result, index, array) => 
                          renderFormIndicator(result, index, index === array.length - 1)
                        )
                      )}
                    </View>
                    <Text style={[styles.statLabel, { color: heroTextColor }]} numberOfLines={1}>
                      Recent 5
                    </Text>
                  </View>
                )}
              </>
            ) : null}
            </View>
          </ScrollView>
        </View>

        {/* Navigation Tabs */}
        <View
          style={[
            styles.tabsContainer,
            {
              backgroundColor: theme.colors.background,
              borderBottomColor: theme.colors.border,
            },
          ]}
        >
          <ScrollView
            ref={tabsScrollViewRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tabsScroll}
          >
            {tabs.map((tab, index) => {
              const isSelected = selectedTab === tab.id;
              
              // Get safe team color with fallback
              const safeTeamColor = heroBackgroundColor || teamColors?.primary || "#FF6B35";
              
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={styles.tab}
                  onPress={() => setSelectedTab(tab.id)}
                  onLayout={(event) => {
                    const { x } = event.nativeEvent.layout;
                    tabPositionsRef.current[tab.id] = x;
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.tabText,
                      {
                        color: isSelected
                          ? safeTeamColor // Use team's primary color for selected tab text
                          : theme.colors.textSecondary || (isDarkMode ? "#999999" : "#666666"), // Use secondary text color for unselected
                        fontWeight: isSelected ? "700" : "500",
                      },
                    ]}
                  >
                    {tab.label}
                  </Text>
                  {isSelected && (
                    <View 
                      style={[
                        styles.activeTabIndicator,
                        { backgroundColor: safeTeamColor }
                      ]} 
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <TouchableOpacity
            style={[
              styles.seasonSelector,
              {
                backgroundColor: isDarkMode
                  ? "#3A3A3A"
                  : theme.colors.border || "#F5F5F5",
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
                    ? (isDarkMode ? "#B0B0B0" : theme.colors.text)
                    : (isDarkMode ? "#666666" : "#AAAAAA"),
                },
              ]}
            >
              {selectedSeason}
            </Text>
            <ChevronDown
              size={16}
              color={isSeasonSelectorActive 
                ? (isDarkMode ? "#B0B0B0" : theme.colors.text)
                : (isDarkMode ? "#666666" : "#AAAAAA")}
            />
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        <View
          style={{
            backgroundColor: theme.colors.background,
            flex: 1,
            minHeight: 500,
          }}
        >
          {renderTabContent()}
        </View>
      </ScrollView>

      {/* Season Selector Modal */}
      {showSeasonModal && (
        <NewsSeasonsSelector
          selectedSeason={selectedSeason}
          onSeasonChange={setSelectedSeason}
          showModal={showSeasonModal}
          setShowModal={setShowSeasonModal}
          primaryColor={heroBackgroundColor}
        />
      )}

      {/* Share Modal */}
      <ShareModal
        visible={showShareModal}
        onClose={() => setShowShareModal(false)}
        title={`Share ${teamData.name}`}
        shareUrl={`team/${teamId}`}
        shareText={`Check out ${teamData.name} on Champs Sports Lovers!`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  animatedHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 60,
    zIndex: 1000,
  },
  animatedBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  animatedHeaderActions: {
    flexDirection: "row",
    gap: 12,
  },
  animatedHeaderButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  animatedHeaderTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    flex: 1,
    textAlign: "center",
  },
  scrollView: {
    flex: 1,
  },
  heroSection: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    alignItems: "center",
    paddingTop: 40,
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
  teamLogoImage: {
    width: 90,
    height: 90,
    marginBottom: 10,
  },
  heroHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: 8,
    paddingTop: 0,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerActions: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  teamInfo: {
    alignItems: "center",
    marginBottom: 8,
  },
  teamLogoContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  teamLogoText: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
  },
  teamName: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 4,
  },
  teamSubtitle: {
    fontSize: 13,
    textAlign: "center",
  },
  statsScrollContainer: {
    width: "100%",
    marginTop: 0,
  },
  statsScrollContent: {
    flexGrow: 1,
    paddingHorizontal: 4,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    minWidth: "100%", // Ensure minimum width
    gap: 6, // Reduced gap for better spacing
  },
  statItem: {
    alignItems: "center",
    flex: 1,
    minWidth: 0, // Allow flex shrinking to prevent overflow
  },
  statItemLeft: {
    alignItems: "center", // Center alignment for League Position
    paddingLeft: 0,
  },
  statItemRight: {
    alignItems: "center", // Center align Recent 5 section
    paddingRight: 8, // Add padding to prevent touching screen edge
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11, // Slightly smaller to prevent wrapping
    textAlign: "center",
    flexShrink: 1, // Allow text to shrink if needed
  },
  formSection: {
    alignItems: "center",
    flex: 0.6,
    marginTop: 8,
  },
  recentForm: {
    flexDirection: "row",
    gap: 4,
    marginBottom: 8,
  },
  formIndicatorWrapper: {
    alignItems: "center",
  },
  formIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  formText: {
    fontSize: 10,
    fontWeight: "bold",
  },
  formLabel: {
    fontSize: 10,
    textAlign: "center",
  },
  currentIndicatorLine: {
    width: 20,
    height: 2,
    backgroundColor: "white",
    marginTop: 2,
    borderRadius: 1,
  },
  tabsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  tabsScroll: {
    flex: 1,
  },
  tab: {
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginRight: 16,
  },
  tabText: {
    fontSize: 16,
    fontWeight: "500",
  },
  activeTabIndicator: {
    position: "absolute",
    bottom: 0,
    left: "50%",
    width: 16,
    height: 2,
    backgroundColor: "#FF6B35",
    borderRadius: 1,
    transform: [{ translateX: -8 }],
  },
  seasonSelector: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  seasonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  tabContent: {
    padding: 16,
    flex: 1,
    minHeight: 400,
  },
  comingSoonText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 100,
    fontStyle: "italic",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: "600",
  },
  errorContainer: {
    position: "absolute",
    top: 100,
    left: 20,
    right: 20,
    backgroundColor: "#F44336",
    padding: 16,
    borderRadius: 8,
    zIndex: 9998,
  },
  errorText: {
    color: "white",
    fontSize: 14,
    textAlign: "center",
  },
  statsLoadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    gap: 8,
  },
  statsLoadingText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
  },
  skeletonValue: {
    height: 24,
    width: 40,
    borderRadius: 4,
    marginBottom: 4,
  },
  noStatsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
  noStatsText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    textAlign: "center",
    fontStyle: "italic",
  },
});

