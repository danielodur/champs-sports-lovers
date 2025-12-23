import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  ActivityIndicator,
  ImageBackground,
  Dimensions,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  ChevronLeft,
  Star,
  Share2,
  Film,
  Video,
  ThumbsUp,
  Flag,
  Menu,
} from "lucide-react-native";
import { useTheme } from "@/hooks/useTheme";
import { useFavorites } from "@/hooks/useFavorites";
import ShareModal from "@/modules/news/components/content/shared/share-modal";
import goalDetectionService from "@/services/goalDetectionService";
import { playGoalSound } from "@/utils/SoundManager";
import { useMatchSettings } from "@/contexts/MatchSettingsContext";
import { backendApiService } from "@/services/backendApiService";
import { teamDetailsApi } from "@/services/teamDetailsApiService";
import favoritesService from "@/services/favoritesService";

// Import tab components
import LiveTab from "./live/live";
import LiveBasketballTab from "./live/live-basketball";
import ChatTab from "./chat";
import HotTab from "./hot";
import DataTab from "./data/index";
import LineupTab from "./lineup";
import RatingsTab from "./ratings/ratings";
import MemberTab from "./member";
import StatsDisplay from "./stats-display";
import MatchDetailsGoalAlert from "./MatchDetailsGoalAlert";
import MatchExtraTime, { isMatchInExtraTime } from "../football-extratime/match-extra-time";
import enhancedMatchService, { EnhancedMatchData } from "@/services/enhanced-match-service";
import DiscoverExpertsScreen from "@/modules/discover/screens/experts/discover-experts";
import RearrangeTabs from "./rearrange-tabs";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { extractBasketballQuarters, BasketballQuarters } from "../basketball-utils";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

interface MatchDetailsParams {
  matchId?: string;
  sport?: string;
  homeTeam?: string;
  awayTeam?: string;
  homeTeamId?: string;
  awayTeamId?: string;
  homeLogo?: string;
  awayLogo?: string;
  homeScore?: string;
  awayScore?: string;
  status?: string;
  startTime?: string;
  league?: string;
  leagueId?: string;
  currentMinute?: string;
  elapsed?: string; // Also accept elapsed from parent screens
  halfTimeScore?: string;
  quarter?: string;
  homeRanking?: string;
  awayRanking?: string;
  hasVideo?: string;
  hasAnimation?: string;
}

export default function MatchDetailsScreen() {
  // Hooks
  const router = useRouter();
  const theme = useTheme();
  const {
    isFavorite: checkIsFavorite,
    addFavorite,
    removeFavorite,
  } = useFavorites();
  const params = useLocalSearchParams() as MatchDetailsParams;
  const { settings } = useMatchSettings();

  // State
  const [activeTab, setActiveTab] = useState<string>("live");
  const [loading, setLoading] = useState<boolean>(false); // ✅ Start as false for instant display
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [showRearrangeTabs, setShowRearrangeTabs] = useState<boolean>(false);
  const [tabOrder, setTabOrder] = useState<string[]>([]);
  const [attackPercentages, setAttackPercentages] = useState({
    home: 50,
    away: 50,
  });
  const scrollY = useRef(new Animated.Value(0)).current;
  
  // Goal/Points Alert State
  const [showGoalAlert, setShowGoalAlert] = useState(false);
  const [goalAlertTeam, setGoalAlertTeam] = useState<"home" | "away">("home");
  const [goalAlertMinute, setGoalAlertMinute] = useState<string>("");
  const [goalAlertType, setGoalAlertType] = useState<"goal" | "cancelled">("goal");
  
  // Enhanced Data State (for corners, cards, etc.)
  const [enhancedData, setEnhancedData] = useState<EnhancedMatchData | null>(null);
  
  // Lineup Data State
  const [lineupData, setLineupData] = useState<any>(null);
  
  // ✅ BASKETBALL: Quarter scores state
  const [quarters, setQuarters] = useState<BasketballQuarters | undefined>(undefined);
  
  // ✅ BASKETBALL: Track which teams have API data available
  const [homeTeamHasData, setHomeTeamHasData] = useState<boolean>(true); // Default true for football
  const [awayTeamHasData, setAwayTeamHasData] = useState<boolean>(true); // Default true for football
  
  // Track processed goal IDs to prevent duplicates
  const processedGoalIdsRef = useRef<Set<string>>(new Set());
  const [isInitialized, setIsInitialized] = useState(false);

  // Live data state (updated by polling for live matches)
  const [countdown, setCountdown] = useState<string>("");
  const [showApostrophe, setShowApostrophe] = useState<boolean>(true);
  const [liveMinute, setLiveMinute] = useState<number>(parseInt(params.currentMinute || params.elapsed || "0"));
  const [liveHomeScore, setLiveHomeScore] = useState<string>(params.homeScore || "0");
  const [liveAwayScore, setLiveAwayScore] = useState<string>(params.awayScore || "0");
  const [liveStatus, setLiveStatus] = useState<string>(params.status || "NS");
  // ✅ FIX: Track league name from params to sync with parent updates
  const [displayLeague, setDisplayLeague] = useState<string>(params.league || "League");

  // Extract and parse params
  const {
    matchId = "0",
    sport = "football",
    homeTeam = "Home Team",
    awayTeam = "Away Team",
    homeTeamId,
    awayTeamId,
    homeLogo,
    awayLogo,
    homeScore = "0",
    awayScore = "0",
    status = "NS",
    startTime,
    league = "League",
    leagueId,
    currentMinute: rawCurrentMinute,
    elapsed,
    halfTimeScore,
    quarter,
    homeRanking,
    awayRanking,
    hasVideo = "false",
    hasAnimation = "false",
  } = params;

  // Use either currentMinute or elapsed (parent screens may pass either)
  const currentMinute = rawCurrentMinute || elapsed;

  // ✅ FIX: Sync league name from params updates (when parent screen updates league)
  useEffect(() => {
    if (params.league && params.league !== displayLeague) {
      setDisplayLeague(params.league);
      console.log(`🔄 [SYNC] League name updated: "${displayLeague}" → "${params.league}"`);
    }
  }, [params.league]);

  // ✅ FIX: Sync timer from params updates (when parent screen updates timer)
  useEffect(() => {
    const newMinute = parseInt(params.currentMinute || params.elapsed || "0");
    if (newMinute !== liveMinute && newMinute > 0) {
      setLiveMinute(newMinute);
      console.log(`🔄 [SYNC] Timer updated from params: ${liveMinute} → ${newMinute}`);
      console.log(`   ✅ Timer now synced across all screens:
        - Parent Screen: ${newMinute}'
        - Match Details Main: ${newMinute}'
        - Live Tab → LiveCommentary: ${newMinute}'
        - Live Tab → KeyEvents: ${newMinute}'`);
    }
  }, [params.currentMinute, params.elapsed]);

  const isBasketball = sport === "basketball";
  const isFootball = sport === "football";
  
  // Use live status for real-time updates
  const currentStatus = liveStatus || status;
  
  const isLive =
    currentStatus === "LIVE" ||
    currentStatus === "1H" ||
    currentStatus === "2H" ||
    currentStatus === "HT" ||
    currentStatus === "ET" ||
    currentStatus === "BT" ||
    currentStatus === "P" ||
    currentStatus === "Q1" ||
    currentStatus === "Q2" ||
    currentStatus === "Q3" ||
    currentStatus === "Q4" ||
    currentStatus === "OT";
  const isFinished =
    currentStatus === "FT" ||
    currentStatus === "AET" ||
    currentStatus === "PEN" ||
    currentStatus === "AOT" ||
    currentStatus === "Finished";
  const isFixture =
    currentStatus === "NS" || currentStatus === "Not Started" || (!isLive && !isFinished);

  // Background image selection
  const backgroundImage = isBasketball
    ? require("@/assets/matchIcons/match_details_basketball.png")
    : require("@/assets/matchIcons/match_details_football.png");

  // Initialize
  useEffect(() => {
    const initialize = async () => {
      try {
        console.log("🏟️ Match Details - Initializing with params:", {
          matchId,
          sport,
          homeTeam,
          awayTeam,
          status,
          homeTeamId: homeTeamId || "MISSING",
          awayTeamId: awayTeamId || "MISSING",
          leagueId: leagueId || "MISSING",
        });

        // ✅ NO LOADING BLOCKING - All data fetching happens in background without blocking UI
        // The screen displays instantly with passed params while real data loads

        // ✅ CRITICAL FIX: If team IDs/logos are missing (from followed-matches),
        // fetch complete match data from API using matchId IN BACKGROUND
        if (matchId && (!homeTeamId || !awayTeamId || !homeLogo || !awayLogo)) {
          console.log("🔄 Match data incomplete - fetching from API using matchId...");
          // Non-blocking background fetch
          backendApiService.getLiveMatches(sport, true).then(matchData => {
            const currentMatch = matchData.find(m => m.fixture?.id?.toString() === matchId);
            if (currentMatch) {
              console.log("✅ Found match in API:", {
                home: currentMatch.teams?.home?.name,
                away: currentMatch.teams?.away?.name,
              });
              
              // ✅ BASKETBALL: Extract quarter scores
              if (isBasketball) {
                const basketballQuarters = extractBasketballQuarters(currentMatch as any);
                setQuarters(basketballQuarters);
                console.log("🏀 BASKETBALL: Extracted quarters:", basketballQuarters);
              }
            }
          }).catch(err => {
            console.error("❌ Error fetching match data:", err);
          });
        } else if (isBasketball && matchId) {
          // ✅ BASKETBALL: Even if IDs are present, fetch quarters for basketball matches
          console.log("🏀 BASKETBALL: Fetching quarters for match:", matchId);
          backendApiService.getLiveMatches(sport, true).then(matchData => {
            const currentMatch = matchData.find(m => m.fixture?.id?.toString() === matchId);
            if (currentMatch) {
              const basketballQuarters = extractBasketballQuarters(currentMatch as any);
              setQuarters(basketballQuarters);
              console.log("🏀 BASKETBALL: Extracted quarters:", basketballQuarters);
            }
          }).catch(err => {
            console.error("❌ Error fetching basketball quarters:", err);
          });
        }

        // Check if match is favorited IN BACKGROUND
        if (matchId) {
          checkIsFavorite(matchId).then(favoriteStatus => {
            setIsFavorite(favoriteStatus);
            console.log("⭐ Favorite status:", favoriteStatus);
          }).catch(err => {
            console.log("⚠️ Could not check favorite status:", err);
          });
        }

        // Fetch attack/possession percentages from API IN BACKGROUND
        // Set default 50-50 first, update when data arrives
        setAttackPercentages({ home: 50, away: 50 });
        
        // Non-blocking background fetch for possession data
        if (isLive || isFinished) {
          backendApiService.getLiveMatches(sport, true).then(matchData => {
            const currentMatch = matchData.find(m => m.fixture?.id?.toString() === matchId);
            if (currentMatch?.statistics?.length > 0) {
              const homeStats = currentMatch.statistics[0];
              const awayStats = currentMatch.statistics[1];
              const homePossession = homeStats?.statistics?.find((stat: any) => stat.type === "Ball Possession");
              const awayPossession = awayStats?.statistics?.find((stat: any) => stat.type === "Ball Possession");
              
              if (homePossession?.value && awayPossession?.value) {
                const homePercent = parseInt(homePossession.value.replace("%", "")) || 50;
                const awayPercent = parseInt(awayPossession.value.replace("%", "")) || 50;
                setAttackPercentages({ home: homePercent, away: awayPercent });
                console.log("📊 Match possession from API:", { home: homePercent, away: awayPercent });
              }
            }
          }).catch(error => {
            console.error("❌ Error fetching possession:", error);
          });
        } else if (isFixture && homeTeamId && awayTeamId && leagueId) {
          // For upcoming matches, fetch team strength IN BACKGROUND
          const currentSeason = new Date().getFullYear();
          Promise.allSettled([
            teamDetailsApi.getTeamStatistics(parseInt(homeTeamId), parseInt(leagueId), currentSeason),
            teamDetailsApi.getTeamStatistics(parseInt(awayTeamId), parseInt(leagueId), currentSeason)
          ]).then(([homeTeamStats, awayTeamStats]) => {
            let homeStrength = 50;
            let awayStrength = 50;
            
            if (homeTeamStats.status === 'fulfilled' && awayTeamStats.status === 'fulfilled' &&
                homeTeamStats.value && awayTeamStats.value) {
              const homeStats = homeTeamStats.value;
              const awayStats = awayTeamStats.value;
              
              const homePoints = homeStats.points || 0;
              const awayPoints = awayStats.points || 0;
              const homeGoalDiff = homeStats.goalsDiff || 0;
              const awayGoalDiff = awayStats.goalsDiff || 0;
              const homeWins = homeStats.wins || 0;
              const awayWins = awayStats.wins || 0;
              const homePlayed = homeStats.matchesPlayed || 1;
              const awayPlayed = awayStats.matchesPlayed || 1;
              
              const maxPoints = Math.max(homePoints, awayPoints, 1);
              const maxGoalDiff = Math.max(Math.abs(homeGoalDiff), Math.abs(awayGoalDiff), 1);
              
              const homePointsScore = (homePoints / maxPoints) * 100;
              const awayPointsScore = (awayPoints / maxPoints) * 100;
              const homeGoalDiffScore = ((homeGoalDiff + maxGoalDiff) / (maxGoalDiff * 2)) * 100;
              const awayGoalDiffScore = ((awayGoalDiff + maxGoalDiff) / (maxGoalDiff * 2)) * 100;
              const homeWinRateScore = (homeWins / homePlayed) * 100;
              const awayWinRateScore = (awayWins / awayPlayed) * 100;
              
              const homeScore = (homePointsScore * 0.4) + (homeGoalDiffScore * 0.3) + (homeWinRateScore * 0.3);
              const awayScore = (awayPointsScore * 0.4) + (awayGoalDiffScore * 0.3) + (awayWinRateScore * 0.3);
              
              const totalScore = homeScore + awayScore;
              if (totalScore > 0) {
                homeStrength = Math.round((homeScore / totalScore) * 100);
                awayStrength = 100 - homeStrength;
              }
            }
            
            setAttackPercentages({ home: homeStrength, away: awayStrength });
            console.log("📊 Team strength from standings:", { home: homeStrength, away: awayStrength });
          }).catch(error => {
            console.error("❌ Error fetching team strength:", error);
          });
        }

        // Initialize processed goal IDs set
        processedGoalIdsRef.current.clear();
        setIsInitialized(true);

        // ✅ BASKETBALL: Check if teams have API data available (only for basketball)
        if (sport === "basketball") {
          Promise.all([
            checkTeamHasData(homeTeamId, homeTeam),
            checkTeamHasData(awayTeamId, awayTeam)
          ]).then(([homeHasData, awayHasData]) => {
            setHomeTeamHasData(homeHasData);
            setAwayTeamHasData(awayHasData);
            console.log(`🏀 [Init] Team data availability - Home: ${homeHasData ? '✅' : '❌'}, Away: ${awayHasData ? '✅' : '❌'}`);
          });
        }

        console.log("✅ Match Details - Initialization complete (instant display)");
        // ✅ NO setLoading(false) needed - we started with loading=false
      } catch (error) {
        console.error("❌ Error initializing match details:", error);
        // Screen still displays with fallback data
      }
    };

    initialize();
  }, [matchId]);

  // Load enhanced data for corners, cards, rankings, etc.
  useEffect(() => {
    const loadEnhancedData = async () => {
      if (!matchId || !homeTeamId || !awayTeamId || !leagueId) {
        console.log("⚠️ Enhanced data loading skipped - missing IDs:", {
          matchId,
          homeTeamId,
          awayTeamId,
          leagueId
        });
        return;
      }
      
      try {
        console.log("🔄 Loading enhanced data (corners, cards, rankings) for match:", matchId);
        const data = await enhancedMatchService.getEnhancedMatchData(
          parseInt(matchId),
          parseInt(homeTeamId),
          parseInt(awayTeamId),
          homeTeam,
          awayTeam,
          parseInt(leagueId),
          league,
          [],
          null
        );
        setEnhancedData(data);
        console.log("✅ Enhanced data loaded:", {
          corners: data.corners,
          rankings: data.rankings,
          cards: data.cards,
          isDataLoaded: data.isDataLoaded
        });
      } catch (error) {
        console.error("❌ Error loading enhanced data:", error);
      }
    };

    // ✅ FIX: Load enhanced data for ALL match states (upcoming, live, finished)
    // This ensures rankings, corners, and cards are available for all matches
    if (matchId && homeTeamId && awayTeamId && leagueId) {
      loadEnhancedData();
    }
  }, [matchId, homeTeamId, awayTeamId, leagueId, isLive, isFinished]);

  // Load lineup data from API
  useEffect(() => {
    const loadLineupData = async () => {
      if (!matchId || sport !== 'football') {
        console.log("⚠️ LINEUP: Skipping lineup fetch - matchId:", matchId, "sport:", sport);
        return; // Lineup only for football
      }
      
      try {
        console.log("🏃 LINEUP: Fetching lineup data for match:", matchId, "sport:", sport);
        // ✅ NEW: Fetch lineup directly from backend API using dedicated endpoint
        const lineupResponse = await backendApiService.getLineupByFixtureId(matchId, sport);
        console.log("🔍 LINEUP: API Response received:", {
          hasResponse: !!lineupResponse,
          isArray: Array.isArray(lineupResponse),
          length: lineupResponse?.length,
          firstTeamFormation: lineupResponse?.[0]?.formation,
          secondTeamFormation: lineupResponse?.[1]?.formation,
        });
          
        if (lineupResponse && lineupResponse.length >= 2) {
            console.log("🔄 LINEUP: Transforming API response to lineup structure...");
            console.log("   Home team raw data:", {
              formation: lineupResponse[0]?.formation,
              startXI_count: lineupResponse[0]?.startXI?.length,
              subs_count: lineupResponse[0]?.substitutes?.length,
              firstPlayer: lineupResponse[0]?.startXI?.[0],
            });
            console.log("   Away team raw data:", {
              formation: lineupResponse[1]?.formation,
              startXI_count: lineupResponse[1]?.startXI?.length,
              subs_count: lineupResponse[1]?.substitutes?.length,
              firstPlayer: lineupResponse[1]?.startXI?.[0],
            });

            // Transform API lineup format to our structure
            const lineup = {
              homeTeam: {
                formation: lineupResponse[0]?.formation || "4-4-2",
              players: [
                // Starting XI
                ...(lineupResponse[0]?.startXI?.map((p: any, index: number) => {
                  const playerData = {
                    id: p.player?.id?.toString() || Math.random().toString(),
                    name: p.player?.name || "",
                    number: p.player?.number || 0,
                    position: p.player?.pos || "FW",
                    photo: p.player?.photo || null,
                    grid: p.player?.grid || null,
                    captain: p.player?.captain || false,
                    age: p.player?.age || null,
                    isStarting: true
                  };
                  console.log(`   Home starter ${index + 1}: ${playerData.name} (#${playerData.number}) - Photo: ${playerData.photo ? '✅' : '❌'}`);
                  return playerData;
                }) || []),
                // Substitutes
                ...(lineupResponse[0]?.substitutes?.map((p: any, index: number) => {
                  const playerData = {
                    id: p.player?.id?.toString() || Math.random().toString(),
                    name: p.player?.name || "",
                    number: p.player?.number || 0,
                    position: p.player?.pos || "SUB",
                    photo: p.player?.photo || null,
                    grid: p.player?.grid || null,
                    isStarting: false
                  };
                  console.log(`   Home sub ${index + 1}: ${playerData.name} (#${playerData.number})`);
                  return playerData;
                }) || [])
              ],
              coach: lineupResponse[0]?.coach ? {
                id: lineupResponse[0].coach.id?.toString() || '',
                name: lineupResponse[0].coach.name || '',
                photo: lineupResponse[0].coach.photo || ''
              } : undefined,
              colors: lineupResponse[0]?.team?.colors || undefined
              },
              awayTeam: {
                formation: lineupResponse[1]?.formation || "4-4-2",
              players: [
                // Starting XI
                ...(lineupResponse[1]?.startXI?.map((p: any, index: number) => {
                  const playerData = {
                    id: p.player?.id?.toString() || Math.random().toString(),
                    name: p.player?.name || "",
                    number: p.player?.number || 0,
                    position: p.player?.pos || "FW",
                    photo: p.player?.photo || null,
                    grid: p.player?.grid || null,
                    captain: p.player?.captain || false,
                    age: p.player?.age || null,
                    isStarting: true
                  };
                  console.log(`   Away starter ${index + 1}: ${playerData.name} (#${playerData.number}) - Photo: ${playerData.photo ? '✅' : '❌'}`);
                  return playerData;
                }) || []),
                // Substitutes
                ...(lineupResponse[1]?.substitutes?.map((p: any, index: number) => {
                  const playerData = {
                    id: p.player?.id?.toString() || Math.random().toString(),
                    name: p.player?.name || "",
                    number: p.player?.number || 0,
                    position: p.player?.pos || "SUB",
                    photo: p.player?.photo || null,
                    grid: p.player?.grid || null,
                    isStarting: false
                  };
                  console.log(`   Away sub ${index + 1}: ${playerData.name} (#${playerData.number})`);
                  return playerData;
                }) || [])
              ],
              coach: lineupResponse[1]?.coach ? {
                id: lineupResponse[1].coach.id?.toString() || '',
                name: lineupResponse[1].coach.name || '',
                photo: lineupResponse[1].coach.photo || ''
              } : undefined,
              colors: lineupResponse[1]?.team?.colors || undefined
              }
            };
            
            setLineupData(lineup);
          console.log("✅ Lineup data loaded from backend:", lineup);
          console.log("  👉 Home starters:", lineup.homeTeam.players.filter(p => p.isStarting).length);
          console.log("  👉 Home subs:", lineup.homeTeam.players.filter(p => !p.isStarting).length);
          console.log("  👉 Away starters:", lineup.awayTeam.players.filter(p => p.isStarting).length);
          console.log("  👉 Away subs:", lineup.awayTeam.players.filter(p => !p.isStarting).length);
        } else {
          console.log("⚠️ LINEUP: No lineup data available from backend API for this match");
          console.log("   Match ID:", matchId);
          console.log("   Sport:", sport);
          console.log("   Response:", lineupResponse);
          setLineupData(null);
        }
      } catch (error) {
        console.error("❌ LINEUP: Error in loadLineupData:", error);
        console.error("   Match ID:", matchId);
        console.error("   Sport:", sport);
        setLineupData(null);
      }
    };

    // ✅ Load lineup for ALL match states (live, finished, AND upcoming matches that have lineups announced)
    loadLineupData();
  }, [matchId, sport]);

  // Real-time update of attack/possession percentages when match status changes
  useEffect(() => {
    const updateAttackPercentages = () => {  // ✅ REMOVED async - no blocking!
      try {
        let homePercent = 50;
        let awayPercent = 50;

        // For live/finished matches, get real possession from match statistics
        if (isLive || isFinished) {
          console.log("📊 LIVE UPDATE: Fetching real-time possession data in BACKGROUND");
          
          // ✅ NON-BLOCKING: Fetch in background without await
          backendApiService.getLiveMatches(sport, true).then(matchData => {
            const currentMatch = matchData.find(m => m.fixture?.id?.toString() === matchId);
            
            if (currentMatch?.statistics?.length > 0) {
              // Get possession from API statistics
              const homeStats = currentMatch.statistics[0];
              const awayStats = currentMatch.statistics[1];
              
              const homePossession = homeStats?.statistics?.find(
                (stat: any) => stat.type === "Ball Possession"
              );
              const awayPossession = awayStats?.statistics?.find(
                (stat: any) => stat.type === "Ball Possession"
              );
              
              if (homePossession?.value && awayPossession?.value) {
                const homePercent = parseInt(homePossession.value.replace("%", "")) || 50;
                const awayPercent = parseInt(awayPossession.value.replace("%", "")) || 50;
                console.log("✅ LIVE UPDATE: Real possession from API:", { home: homePercent, away: awayPercent });
                setAttackPercentages({ home: homePercent, away: awayPercent });
              } else {
                console.log("⚠️ LIVE UPDATE: No possession data in statistics");
              }
            } else {
              console.log("⚠️ LIVE UPDATE: No statistics available yet");
            }
          }).catch(error => {
            console.error("❌ LIVE UPDATE: Error fetching attack percentages:", error);
          });
        }
        // For upcoming matches, percentages are set during initialization and don't need real-time updates
      } catch (error) {
        console.error("❌ LIVE UPDATE: Error in updateAttackPercentages:", error);
      }
    };

    // Update immediately when match goes live
    if (isLive || isFinished) {
      updateAttackPercentages();
    }
  }, [isLive, isFinished, matchId, sport]);

  // ✅ 100% API-DRIVEN GOAL DETECTION: Subscribe to goalDetectionService for all goal/point alerts
  // This is the ONLY source of goal alerts - no duplicate score comparison detection
  useEffect(() => {
    if (!matchId || !isLive || !isInitialized) return;

    const handleGoalDetected = (data: any) => {
      console.log(`🎯 MATCH-DETAILS: Goal/Point notification received:`, {
        notificationMatchId: data.matchId,
        currentMatchId: matchId,
        scoringTeam: data.scoringTeam,
        eventType: data.eventType,
        sport: data.sport,
        goalId: data.id,
      });
      
      // ✅ CRITICAL: Match by matchId string comparison
      if (data.matchId !== matchId.toString()) {
        console.log(`❌ MATCH-DETAILS: Match ID mismatch - ignoring alert`);
        return;
      }

      // ✅ DEDUPLICATION: Check if this goal has already been processed
      const goalId = data.id || `${data.matchId}-${data.eventType}-${data.scoringTeam}-${data.timestamp}`;
      if (processedGoalIdsRef.current.has(goalId)) {
        console.log(`⚠️ MATCH-DETAILS: Goal already processed - ignoring duplicate:`, goalId);
        return;
      }

      // Mark this goal as processed
      processedGoalIdsRef.current.add(goalId);
      console.log(`✅ MATCH-DETAILS: Processing new goal alert:`, goalId);

      // ✅ HANDLE ALL EVENT TYPES: goals, cancelled goals, red cards, etc.
      if (data.eventType === 'goal' || data.eventType === 'cancelled') {
        setGoalAlertTeam(data.scoringTeam);
        setGoalAlertType(data.eventType); // Set alert type (goal or cancelled)
        // Use minute from API data if available, otherwise use liveMinute
        const alertMinute = data.minute || liveMinute.toString();
        setGoalAlertMinute(alertMinute);
        setShowGoalAlert(true);
        
        // Play sound if enabled (only for goals, not cancelled)
        if (data.eventType === 'goal' && settings?.soundNotification) {
          try {
            playGoalSound(data.scoringTeam, settings);
          } catch (error) {
            console.error("Error playing goal sound:", error);
          }
        }
      }
    };

    const unsubscribe = goalDetectionService.subscribe(handleGoalDetected);
    return unsubscribe;
  }, [matchId, isLive, isInitialized, liveMinute, settings, isBasketball]);

  // ✅ CLEANUP: Clear processed goal IDs when match ends or component unmounts
  useEffect(() => {
    if (!isLive) {
      processedGoalIdsRef.current.clear();
      console.log(`🧹 MATCH-DETAILS: Match no longer live - cleared processed goal IDs`);
    }
  }, [isLive]);

  // Auto-dismiss goal alert
  const handleDismissGoalAlert = useCallback(() => {
    setShowGoalAlert(false);
  }, []);

  // Handle favorite toggle
  const handleFavoriteToggle = async () => {
    if (!matchId) return;

    try {
      console.log(`⭐ MATCH-DETAILS: Toggling favorite for match ${matchId}, current status: ${isFavorite}`);
      
      if (isFavorite) {
        // Remove from favorites
        console.log(`🗑️ MATCH-DETAILS: Removing match ${matchId} from favorites`);
        await removeFavorite(matchId);
        setIsFavorite(false);
        console.log(`✅ MATCH-DETAILS: Match ${matchId} removed from favorites`);
        
        // Broadcast change to favoritesService for full sync
        await favoritesService.removeFromFavorites(matchId);
      } else {
        // Add to favorites
        console.log(`➕ MATCH-DETAILS: Adding match ${matchId} to favorites`);
        await addFavorite({
          id: matchId,
          sport,
          homeTeam,
          awayTeam,
          startTime: startTime || new Date().toISOString(),
          league,
        });
        setIsFavorite(true);
        console.log(`✅ MATCH-DETAILS: Match ${matchId} added to favorites`);
        
        // Broadcast change to favoritesService for full sync
        await favoritesService.addToFavorites({
          id: matchId,
          sport,
          homeTeam,
          awayTeam,
          league,
          startTime: startTime || new Date().toISOString(),
          status: isLive ? "live" : isFinished ? "finished" : "upcoming",
        });
      }
      
      console.log(`🔄 MATCH-DETAILS: Favorite change completed for match ${matchId}`);
    } catch (error) {
      console.error("❌ MATCH-DETAILS: Error toggling favorite:", error);
      // Revert local state on error
      const currentStatus = await checkIsFavorite(matchId);
      setIsFavorite(currentStatus);
    }
  };

  // ✅ BASKETBALL: Smart function to check if team has API data
  // For basketball teams, we verify they have data before allowing navigation
  // This prevents users from accessing empty team-details screens for unsupported teams
  const checkTeamHasData = async (teamId?: string, teamName?: string): Promise<boolean> => {
    // Football teams generally have good data coverage, allow navigation
    if (sport !== "basketball") {
      return true;
    }

    // Basketball: Check if team has API data - 100% determined by API
    if (!teamId && !teamName) {
      return false;
    }

    try {
      console.log(`🏀 [checkTeamHasData] Checking data availability for ${teamName} (ID: ${teamId})`);
      
      // Try to fetch basic team info to verify team exists in API
      const teamData = await teamDetailsApi.getTeamInfo(
        teamName || "",
        parseInt(teamId || "0") || undefined,
        undefined // leagueId - not needed for this check
      );

      const hasData = teamData !== null && (
        teamData.id !== undefined || 
        teamData.name !== undefined
      );

      console.log(`🏀 [checkTeamHasData] Result for ${teamName}: ${hasData ? '✅ HAS DATA' : '❌ NO DATA'}`);
      return hasData;
    } catch (error) {
      console.error(`❌ [checkTeamHasData] Error checking team data:`, error);
      // On error, allow navigation (API might be temporarily down)
      return true;
    }
  };

  // Handle team navigation
  const handleHomeTeamPress = async () => {
    if (!homeTeamId && !homeTeam) return;
    
    // ✅ BASKETBALL: Check if team has data before navigation
    const hasData = await checkTeamHasData(homeTeamId, homeTeam);
    if (!hasData) {
      console.warn(`⚠️ [Navigation] ${homeTeam} has no API data - navigation blocked`);
      return;
    }
    
    router.push({
      pathname: "/team-details",
      params: {
        teamId: homeTeamId || homeTeam,
        teamName: homeTeam,
        teamLogo: homeLogo,
        sport,
      },
    });
  };

  const handleAwayTeamPress = async () => {
    if (!awayTeamId && !awayTeam) return;
    
    // ✅ BASKETBALL: Check if team has data before navigation
    const hasData = await checkTeamHasData(awayTeamId, awayTeam);
    if (!hasData) {
      console.warn(`⚠️ [Navigation] ${awayTeam} has no API data - navigation blocked`);
      return;
    }
    
    router.push({
      pathname: "/team-details",
      params: {
        teamId: awayTeamId || awayTeam,
        teamName: awayTeam,
        teamLogo: awayLogo,
        sport,
      },
    });
  };

  // Format time/date display
  const formatDateTime = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  };

  // Format countdown timer
  
  // ============================================================================
  // ✅ REAL-TIME MATCH DATA POLLING - 100% API-DRIVEN
  // ============================================================================
  // This is the PRIMARY source of truth for live match data
  // - Polls API every 15 seconds for live matches
  // - Updates: timer (liveMinute), scores, status, league name, possession
  // - Timer is then passed to LiveTab → LiveCommentary/KeyEvents
  // - Ensures all screens show the SAME data from the SAME API source
  // ============================================================================
  useEffect(() => {
    if (!isLive || !matchId) return;

    console.log("⚡ MATCH-DETAILS: Setting up real-time polling for live match", matchId);
    console.log("   📊 Data Flow: API → match-details-main → LiveTab → LiveCommentary/KeyEvents");

    // Function to fetch latest match data
    const fetchLiveMatchData = async () => {
      try {
        // Fetch all live matches and find the one we're watching
        const liveMatches = await backendApiService.getLiveMatches(sport, true);
        const matchData = liveMatches.find(m => m.fixture?.id?.toString() === matchId);
        
        if (matchData) {
          const newElapsed = matchData.fixture?.status?.elapsed || parseInt(currentMinute || "0");
          const newHomeScore = (matchData.goals?.home || 0).toString();
          const newAwayScore = (matchData.goals?.away || 0).toString();
          const newStatus = matchData.fixture?.status?.short || status;

          console.log("⏱️ MATCH-DETAILS POLLING:", {
            matchId,
            elapsed: newElapsed,
            score: `${newHomeScore}-${newAwayScore}`,
            status: newStatus,
          });

          // ✅ 100% API-DRIVEN: Update all live data from API polling
          setLiveMinute(newElapsed);
          setLiveHomeScore(newHomeScore);
          setLiveAwayScore(newAwayScore);
          setLiveStatus(newStatus);
          
          console.log(`✅ [SYNC] API Polling Update Complete:
            - Match ID: ${matchId}
            - Timer: ${newElapsed}' (synced to LiveTab → LiveCommentary/KeyEvents)
            - Score: ${newHomeScore}-${newAwayScore}
            - Status: ${newStatus}
            - All data is 100% API-driven from backend`);

          // ✅ FIX: Also sync league name from API if available
          if (matchData.league?.name && matchData.league.name !== displayLeague) {
            setDisplayLeague(matchData.league.name);
            console.log(`🔄 [SYNC] League name updated from polling: "${displayLeague}" → "${matchData.league.name}"`);
          }

          // ✅ ALSO UPDATE POSSESSION PERCENTAGES from live statistics
          if (matchData.statistics?.length > 0) {
            const homeStats = matchData.statistics[0];
            const awayStats = matchData.statistics[1];
            
            const homePossession = homeStats?.statistics?.find(
              (stat: any) => stat.type === "Ball Possession"
            );
            const awayPossession = awayStats?.statistics?.find(
              (stat: any) => stat.type === "Ball Possession"
            );
            
            if (homePossession?.value && awayPossession?.value) {
              const homePercent = parseInt(homePossession.value.replace("%", "")) || 50;
              const awayPercent = parseInt(awayPossession.value.replace("%", "")) || 50;
              setAttackPercentages({ home: homePercent, away: awayPercent });
              console.log("📊 POLLING UPDATE: Real-time possession:", { home: homePercent, away: awayPercent });
            }
          }
        } else {
          console.warn("⚠️ MATCH-DETAILS: Match not found in live matches", matchId);
        }
      } catch (error) {
        console.error("❌ Error fetching live match data:", error);
      }
    };

    // Initial fetch
    fetchLiveMatchData();

    // Poll every 15 seconds for live updates
    const pollingInterval = setInterval(fetchLiveMatchData, 15000);

    return () => {
      console.log("🚫 MATCH-DETAILS: Cleaning up polling for match", matchId);
      clearInterval(pollingInterval);
    };
  }, [isLive, matchId, sport]);

  // Update homeScore/awayScore when live values change
  useEffect(() => {
    if (isLive) {
      // Update the parent values so goal detection works
      // This is a workaround since we can't change props
      // The goal detection useEffect will pick up these changes
    }
  }, [liveHomeScore, liveAwayScore, isLive]);

  // Blinking apostrophe effect for live matches
  useEffect(() => {
    if (!isLive) {
      setShowApostrophe(true);
      return;
    }

    const interval = setInterval(() => {
      setShowApostrophe((prev) => !prev);
    }, 1000); // Blink every second

    return () => clearInterval(interval);
  }, [isLive]);

  // ✅ CLIENT-SIDE TIMER: Increment liveMinute every 60 seconds for smooth time display
  // This runs between API polls (every 15s) to keep time moving smoothly
  useEffect(() => {
    if (!isLive || !liveMinute) {
      return;
    }

    // Don't increment during halftime, break time, or penalties
    if (["HT", "BT", "P"].includes(liveStatus)) {
      return;
    }

    console.log("⏱️ CLIENT TIMER: Starting minute increment timer at", liveMinute);

    // Increment liveMinute every 60 seconds (1 minute of real time = 1 minute of match time)
    const minuteTimer = setInterval(() => {
      setLiveMinute((prev) => {
        const newMinute = prev + 1;
        console.log("⏱️ CLIENT TIMER: Incremented minute:", prev, "→", newMinute);
        return newMinute;
      });
    }, 60000); // 60 seconds = 1 minute

    return () => {
      console.log("🚫 CLIENT TIMER: Cleaning up minute increment timer");
      clearInterval(minuteTimer);
    };
  }, [isLive, liveStatus]); // Re-run when match goes live or status changes

  // Countdown timer for fixture matches
  // Countdown timer for fixture matches - 100% API-driven using startTime from params
  useEffect(() => {
    if (!isFixture || !startTime) {
      console.log("⏰ Countdown: Not a fixture or no startTime provided", { isFixture, startTime });
      return;
    }

    console.log("⏰ Countdown: Starting countdown timer for match", matchId, "startTime:", startTime);

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const matchTime = new Date(startTime).getTime(); // API-provided startTime
      const distance = matchTime - now;

      if (distance < 0) {
        // Countdown is over - show 00:00 and match should be live
        setCountdown("00:00");
        clearInterval(interval);
        console.log("⏰ Countdown complete - match should start now");
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
      );
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      if (days > 0) {
        setCountdown(`${days}d ${hours}h ${minutes}m`);
      } else if (hours > 0) {
        setCountdown(
          `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`,
        );
      } else {
        setCountdown(
          `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`,
        );
      }
    }, 1000);

    return () => {
      console.log("⏰ Countdown: Cleaning up timer for match", matchId);
      clearInterval(interval);
    };
  }, [isFixture, startTime, matchId]);

  // Poll fixture matches to detect when they go live
  useEffect(() => {
    if (!isFixture || !matchId) return;

    console.log("⏰ FIXTURE POLLING: Setting up polling for fixture match", matchId);

    const checkFixtureStatus = async () => {
      try {
        // Check if match has started by fetching live matches
        const liveMatches = await backendApiService.getLiveMatches(sport, true);
        const matchData = liveMatches.find(m => m.fixture?.id?.toString() === matchId);
        
        if (matchData) {
          // Match has gone live! Update state
          const newStatus = matchData.fixture?.status?.short || "1H";
          const newElapsed = matchData.fixture?.status?.elapsed || 0;
          const newHomeScore = (matchData.goals?.home || 0).toString();
          const newAwayScore = (matchData.goals?.away || 0).toString();

          console.log("🚀 FIXTURE NOW LIVE!", {
            matchId,
            status: newStatus,
            elapsed: newElapsed,
            score: `${newHomeScore}-${newAwayScore}`,
          });

          setLiveStatus(newStatus);
          setLiveMinute(newElapsed);
          setLiveHomeScore(newHomeScore);
          setLiveAwayScore(newAwayScore);
          
          // ✅ FIX: Also sync league name from API if available
          if (matchData.league?.name && matchData.league.name !== displayLeague) {
            setDisplayLeague(matchData.league.name);
            console.log(`🔄 [SYNC] League name updated from API: "${displayLeague}" → "${matchData.league.name}"`);
          }
          
          // Force re-render by updating a key or reloading
          // The isLive computation will automatically update based on liveStatus
        }
      } catch (error) {
        console.error("❌ Error checking fixture status:", error);
      }
    };

    // Check every 30 seconds (less frequent than live match polling)
    const pollingInterval = setInterval(checkFixtureStatus, 30000);

    // Also check immediately when countdown hits 0
    const countdownCheck = setInterval(() => {
      if (countdown === "00:00") {
        checkFixtureStatus();
      }
    }, 2000);

    return () => {
      console.log("🚫 FIXTURE POLLING: Cleaning up for match", matchId);
      clearInterval(pollingInterval);
      clearInterval(countdownCheck);
    };
  }, [isFixture, matchId, sport, countdown]);

  // Get status display text with blinking apostrophe for live matches
  // ✅ MEMOIZED to prevent re-computation on every render
  // ✅ FIX: Ensure FT displays when match ends instead of disappearing
  const getStatusDisplay = useCallback(() => {
    if (isFixture) return "NS";
    
    // ✅ FIX: Check liveStatus first (from polling) for finished matches
    const effectiveStatus = liveStatus || status;
    
    // FT should display in dull grey/white color - check both liveStatus and status
    if (effectiveStatus === "FT" || status === "FT") return "FT";
    if (effectiveStatus === "AET" || status === "AET") return "AET";
    if (effectiveStatus === "PEN" || status === "PEN") return "PEN";
    if (effectiveStatus === "AOT" || status === "AOT") return "AOT";
    
    // ✅ FIX: Also check isFinished flag to ensure FT shows
    if (isFinished && (effectiveStatus === "Finished" || status === "Finished")) {
      return "FT";
    }
    
    if (isBasketball && quarter) return quarter;
    
    // For extra time matches, return empty string - ET badge will be shown instead
    if (isMatchInExtraTime({ fixture: { status: { short: effectiveStatus, elapsed: liveMinute } } } as any)) {
      return "";
    }
    
    // For live football matches, show elapsed time with blinking apostrophe
    if (isLive && (currentMinute || liveMinute > 0)) {
      let elapsed = liveMinute;
      const apostrophe = showApostrophe ? "'" : " ";
      
      if (effectiveStatus === "1H" || status === "1H") {
        // ✅ CLIENT-SIDE STOPPAGE TIME CALCULATION
        // If API caps at 45 (stoppage time), calculate realistic time from match start
        if (elapsed === 45 && startTime) {
          const matchStart = new Date(startTime);
          const now = new Date();
          const minutesElapsed = Math.floor((now.getTime() - matchStart.getTime()) / (1000 * 60));
          
          // If more than 45 minutes have passed, use calculated time
          if (minutesElapsed > 45 && minutesElapsed < 60) {
            elapsed = minutesElapsed;
          }
        }
        
        // First half: display 45+1, 45+2, etc. when elapsed > 45
        if (elapsed > 45) {
          const addedTime = elapsed - 45;
          return `45+${addedTime}${apostrophe}`;
        }
        // Regular first half time (1-45)
        return `${elapsed}${apostrophe}`;
      } else if (effectiveStatus === "2H" || status === "2H") {
        // ✅ CLIENT-SIDE STOPPAGE TIME CALCULATION
        // If API caps at 90 (stoppage time), calculate realistic time from match start
        if (elapsed === 90 && startTime) {
          const matchStart = new Date(startTime);
          const now = new Date();
          const minutesElapsed = Math.floor((now.getTime() - matchStart.getTime()) / (1000 * 60));
          
          console.log(`🕐 MATCH-DETAILS (2H): Match started ${minutesElapsed} min ago, API shows ${elapsed}, startTime: ${startTime}`);
          
          // Account for halftime (typically 15 minutes), so 2H starts at ~60 min real time
          // If more than 105 real minutes have passed, we're likely in stoppage time
          // Allow up to 150 minutes to handle very long stoppages or data delays
          if (minutesElapsed > 105 && minutesElapsed <= 150) {
            // Convert real time to match time (subtract first half + break)
            elapsed = minutesElapsed - 60; // 60 = first half (45) + halftime (15)
            console.log(`🟢 MATCH-DETAILS: Calculated 2H stoppage time: 90+${elapsed - 90}`);
          } else {
            console.log(`⚠️ MATCH-DETAILS: minutesElapsed ${minutesElapsed} not in stoppage range (105-150)`);
          }
        } else if (elapsed === 90) {
          console.log(`⚠️ MATCH-DETAILS: elapsed=90 but startTime missing: ${startTime}`);
        }
        
        // Second half: display 90+1, 90+2, etc. when elapsed > 90
        if (elapsed > 90) {
          const addedTime = elapsed - 90;
          return `90+${addedTime}${apostrophe}`;
        }
        // Regular second half time (46-90)
        return `${elapsed}${apostrophe}`;
      } else if (effectiveStatus === "HT" || status === "HT") {
        return "HT";
      } else if (effectiveStatus === "BT" || status === "BT") {
        // BT (Break Time) - Return empty string, ET badge shown instead
        return "";
      } else if (effectiveStatus === "P" || status === "P") {
        return "Penalties";
      }
      
      return `${elapsed}${apostrophe}`;
    }
    
    return effectiveStatus || status;
  }, [isFixture, status, liveStatus, isBasketball, quarter, liveMinute, isLive, isFinished, currentMinute, showApostrophe, startTime]);

  // Get corner kicks display
  // ✅ MEMOIZED to prevent re-computation on every render
  const getCornerKicks = useCallback(() => {
    if (enhancedData?.corners !== undefined) {
      return `${enhancedData.corners.home}-${enhancedData.corners.away}`;
    }
    return "0-0";
  }, [enhancedData?.corners]);

  // Tab configuration based on sport
  const getTabsForSport = () => {
    if (isBasketball) {
      return [
        { key: "live", label: "Live" },
        { key: "stats", label: "Stats" },
        // Ratings tab hidden for basketball matches
        // { key: "ratings", label: "Ratings" },
        { key: "member", label: "Member" },
        { key: "experts", label: "Experts" },
        { key: "chat", label: "Chat" },
        { key: "info", label: "Info" },
        { key: "hot", label: "Hot" },
      ];
    } else {
      // Football
      return [
        { key: "live", label: "Live" },
        { key: "lineup", label: "Lineup" },
        { key: "ratings", label: "Ratings" },
        { key: "member", label: "Member" },
        { key: "experts", label: "Experts" },
        { key: "hot", label: "Hot" },
        { key: "chat", label: "Chat" },
        { key: "data", label: "Data" },
      ];
    }
  };

  const tabs = getTabsForSport();

  // Load saved tab order
  useEffect(() => {
    const loadTabOrder = async () => {
      try {
        const savedOrder = await AsyncStorage.getItem("@match_details_tab_order");
        if (savedOrder) {
          const parsedOrder = JSON.parse(savedOrder);
          setTabOrder(parsedOrder);
          console.log("✅ Loaded tab order:", parsedOrder);
        } else {
          // Initialize with default order
          const defaultOrder = tabs.map(tab => tab.key);
          setTabOrder(defaultOrder);
        }
      } catch (error) {
        console.error("Error loading tab order:", error);
        const defaultOrder = tabs.map(tab => tab.key);
        setTabOrder(defaultOrder);
      }
    };
    
    loadTabOrder();
  }, [isBasketball]);

  // Handle tab arrangement save
  const handleSaveTabArrangement = async (newOrder: string[]) => {
    try {
      console.log("💾 Saving new tab arrangement:", newOrder);
      setTabOrder(newOrder);
      await AsyncStorage.setItem("@match_details_tab_order", JSON.stringify(newOrder));
      console.log("✅ Tab arrangement saved successfully");
    } catch (error) {
      console.error("❌ Error saving tab arrangement:", error);
    }
  };

  // Get ordered tabs based on saved order
  const getOrderedTabs = () => {
    if (tabOrder.length === 0) {
      return tabs;
    }
    
    // Create a map for quick lookup
    const tabMap = new Map(tabs.map(tab => [tab.key, tab]));
    
    // Return tabs in saved order
    return tabOrder
      .map(key => tabMap.get(key))
      .filter(tab => tab !== undefined) as typeof tabs;
  };

  const orderedTabs = getOrderedTabs();

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case "live":
        // Use basketball-specific live screen for basketball matches
        if (isBasketball) {
          return (
            <LiveBasketballTab
              sport={sport}
              homeTeamName={homeTeam}
              awayTeamName={awayTeam}
              homeTeamLogo={homeLogo ?? undefined}
              awayTeamLogo={awayLogo ?? undefined}
              matchId={matchId}
              homeScore={parseInt(liveHomeScore) || 0}
              awayScore={parseInt(liveAwayScore) || 0}
              isLive={isLive}
              quarters={quarters} // ✅ BASKETBALL: Pass extracted quarters
              currentQuarter={quarter || "Q1"}
              elapsed={liveMinute * 60} // Convert minutes to seconds for basketball
              status={currentStatus}
              startTime={startTime}
            />
          );
        }
        // Use football live screen for football matches
        return (
          <LiveTab
            sport={sport}
            events={[]}
            homeTeamName={homeTeam}
            awayTeamName={awayTeam}
            homeTeamLogo={homeLogo ?? undefined}
            awayTeamLogo={awayLogo ?? undefined}
            matchId={matchId}
            homeScore={parseInt(liveHomeScore) || parseInt(homeScore) || 0}
            awayScore={parseInt(liveAwayScore) || parseInt(awayScore) || 0}
            isLive={isLive}
            currentMinute={liveMinute || parseInt(currentMinute || "0")}
            homeTeamId={homeTeamId}
            awayTeamId={awayTeamId}
          />
        );
      case "lineup":
        // Create match object for screenshot component
        const matchForScreenshot = {
          id: matchId,
          time: currentMinute?.toString() || "0",
          league: league,
          status: (isLive ? "live" : isFinished ? "finished" : "upcoming") as "upcoming" | "live" | "finished",
          home: {
            name: homeTeam,
            logo: homeLogo,
            rank: homeRanking ? parseInt(homeRanking) : null,
            corners: 0,
          },
          away: {
            name: awayTeam,
            logo: awayLogo,
            rank: awayRanking ? parseInt(awayRanking) : null,
            corners: 0,
          },
          score: `${liveHomeScore}-${liveAwayScore}`,
          startTime: startTime,
          statusText: currentStatus,
        };

        return (
          <LineupTab
            homeTeamName={homeTeam}
            awayTeamName={awayTeam}
            homeTeamLogo={homeLogo || ""}
            awayTeamLogo={awayLogo || ""}
            lineupData={lineupData}
            sport={sport}
            matchData={matchForScreenshot}
            currentMinute={liveMinute}
            matchStatus={currentStatus}
            league={league}
            startTime={startTime}
          />
        );
      case "chat":
        return (
          <ChatTab
            matchId={matchId}
            homeTeamName={homeTeam}
            awayTeamName={awayTeam}
          />
        );
      case "hot":
        return (
          <HotTab
            matchId={matchId}
            homeTeamName={homeTeam}
            awayTeamName={awayTeam}
          />
        );
      case "data":
        return (
          <DataTab
            homeTeamName={homeTeam}
            awayTeamName={awayTeam}
            homeTeamLogo={homeLogo || ""}
            awayTeamLogo={awayLogo || ""}
            matchId={matchId}
            homeTeamId={homeTeamId}
            awayTeamId={awayTeamId}
            leagueId={leagueId}
            leagueName={league}
            sport={sport}
          />
        );
      case "ratings":
        return (
          <RatingsTab
            homeTeamName={homeTeam}
            awayTeamName={awayTeam}
            homeTeamLogo={homeLogo ?? undefined}
            awayTeamLogo={awayLogo ?? undefined}
            matchId={matchId}
            sport={sport} // ✅ Pass sport prop for API calls
          />
        );
      case "member":
        return (
          <MemberTab
            homeTeamName={homeTeam}
            awayTeamName={awayTeam}
            matchId={matchId}
          />
        );
      case "experts":
        return (
          <DiscoverExpertsScreen
            hideTopNavigation={true}
          />
        );
      case "stats":
        return (
          <StatsDisplay
            homeTeamName={homeTeam}
            awayTeamName={awayTeam}
            homeTeamLogo={homeLogo || ""}
            awayTeamLogo={awayLogo || ""}
            sport={sport}
            homeStats={{}}
            awayStats={{}}
          />
        );
      case "info":
        return (
          <HotTab
            matchId={matchId}
            homeTeamName={homeTeam}
            awayTeamName={awayTeam}
          />
        );
      default:
        // Default to appropriate live screen based on sport
        if (isBasketball) {
          return (
            <LiveBasketballTab
              sport={sport}
              homeTeamName={homeTeam}
              awayTeamName={awayTeam}
              homeTeamLogo={homeLogo ?? undefined}
              awayTeamLogo={awayLogo ?? undefined}
              matchId={matchId}
              homeScore={parseInt(liveHomeScore) || 0}
              awayScore={parseInt(liveAwayScore) || 0}
              isLive={isLive}
              quarters={undefined}
              currentQuarter={quarter || "Q1"}
              elapsed={liveMinute * 60}
              status={currentStatus}
              startTime={startTime}
            />
          );
        }
        return (
          <LiveTab
            sport={sport}
            events={[]}
            homeTeamName={homeTeam}
            awayTeamName={awayTeam}
            homeTeamLogo={homeLogo ?? undefined}
            awayTeamLogo={awayLogo ?? undefined}
            matchId={matchId}
            homeScore={parseInt(liveHomeScore) || parseInt(homeScore) || 0}
            awayScore={parseInt(liveAwayScore) || parseInt(awayScore) || 0}
            isLive={isLive}
            currentMinute={liveMinute || parseInt(currentMinute || "0")}
            homeTeamId={homeTeamId}
            awayTeamId={awayTeamId}
          />
        );
    }
  };

  if (loading) {
    console.log("🔄 Match Details - Loading...");
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <StatusBar barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            Loading match details...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Removed excessive console.log that causes performance issues

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          {
            useNativeDriver: false,
          },
        )}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContentContainer}
      >
        {/* Match Info Section with Background */}
        <ImageBackground
          source={backgroundImage}
          style={styles.matchSection}
          imageStyle={styles.backgroundImage}
        >
          <View style={styles.matchOverlay}>
            {/* Header inside background */}
            <View style={styles.headerInBackground}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => router.back()}
              >
                <ChevronLeft size={24} color="#FFFFFF" />
              </TouchableOpacity>

              <View style={styles.headerCenter}>
                <Text
                  style={[styles.headerTitle, { color: "#FFFFFF" }]}
                  numberOfLines={1}
                >
                  {displayLeague}
                </Text>
                <Text
                  style={[
                    styles.headerSubtitle,
                    { color: "rgba(255, 255, 255, 0.9)" },
                  ]}
                  numberOfLines={1}
                >
                  {formatDateTime(startTime)}
                </Text>
              </View>

              <View style={styles.headerRight}>
                <TouchableOpacity
                  style={styles.headerButton}
                  onPress={handleFavoriteToggle}
                >
                  <Star
                    size={20}
                    color={isFavorite ? "#FF4444" : "#FFFFFF"}
                    fill={isFavorite ? "#FF4444" : "transparent"}
                  />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.headerButton}
                  onPress={() => setShowShareModal(true)}
                >
                  <Share2 size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Status Badge */}
            {isMatchInExtraTime({ fixture: { status: { short: currentStatus, elapsed: liveMinute || parseInt(currentMinute || "0") } } } as any) ? (
              // Show ET badge for extra time matches
              <View style={styles.etBadgeContainer}>
                <MatchExtraTime
                  fixture={{
                    fixture: {
                      status: {
                        short: currentStatus,
                        long: "",
                        elapsed: liveMinute || parseInt(currentMinute || "0"),
                      },
                    },
                    goals: {
                      home: parseInt(liveHomeScore) || parseInt(homeScore) || 0,
                      away: parseInt(liveAwayScore) || parseInt(awayScore) || 0,
                    },
                  }}
                  regularTimeScore={halfTimeScore ? {
                    home: parseInt(halfTimeScore.split("-")[0]) || 0,
                    away: parseInt(halfTimeScore.split("-")[1]) || 0,
                  } : undefined}
                  showDetailedET={false}
                  disableBlink={true} // Use beautiful pulse animation only, no blinking
                />
              </View>
            ) : (
              // ✅ FIX: Always show status badge, even when match ends (FT)
              <View
                style={[
                  styles.statusBadge,
                  isFinished
                    ? styles.statusFinished
                    : isLive
                      ? styles.statusLive
                      : styles.statusFixture,
                ]}
              >
                <Text style={[
                  styles.statusBadgeText,
                  isLive && { color: "#FF4444" },
                  isFinished && { color: "rgba(255, 255, 255, 0.7)" } // Dull grey/white for FT
                ]}>
                  {getStatusDisplay() || (isFinished ? "FT" : "NS")}
                </Text>
              </View>
            )}

            {/* Teams and Score/Countdown */}
            <View style={styles.teamsContainer}>
              {/* Home Team */}
              <TouchableOpacity
                style={styles.teamSection}
                onPress={handleHomeTeamPress}
                activeOpacity={homeTeamHasData ? 0.7 : 1}
                disabled={!homeTeamHasData}
              >
                {homeLogo ? (
                  <Image
                    source={{ uri: homeLogo }}
                    style={styles.teamLogo}
                    resizeMode="contain"
                  />
                ) : (
                  <View style={[styles.teamLogo, styles.placeholderLogo]} />
                )}
                <Text style={styles.teamName} numberOfLines={2}>
                  {homeTeam}
                </Text>
                {/* ✅ FIX: Display rankings from enhancedData, fallback to params */}
                {(enhancedData?.rankings?.home || homeRanking) && (
                  <Text style={styles.teamRanking}>
                    [{enhancedData?.rankings?.home || homeRanking}]
                  </Text>
                )}
              </TouchableOpacity>

              {/* Score or Countdown */}
              <View style={styles.centerSection}>
                {isFixture ? (
                  <View style={styles.countdownContainer}>
                    <View style={styles.countdownBox}>
                      <Text style={styles.countdownLabel}>Match starts in</Text>
                      <Text style={styles.countdownText}>{countdown}</Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.scoreSection}>
                    <View style={styles.scoreDisplay}>
                      <Text style={[styles.scoreText, isLive && { color: "#FF4444" }]}>{homeScore}</Text>
                      <Text style={[styles.scoreSeparator, isLive && { color: "#FF4444" }]}>-</Text>
                      <Text style={[styles.scoreText, isLive && { color: "#FF4444" }]}>{awayScore}</Text>
                    </View>
                    
                    {/* Half Time Score / Corner Kicks / Basketball Info */}
                    {!isFixture && (
                      <View style={styles.matchInfoRow}>
                        {/* Half Time Score OR Extra Time Scores - Show for 2H, ET, finished matches */}
                        {/* For ET/BT, show ET scores even without halfTimeScore. For others, require halfTimeScore */}
                        {((status === "ET" || status === "BT") || ((status === "2H" || status === "P" || isFinished) && halfTimeScore)) && !isBasketball && (
                          <>
                            {/* Show ET scores if in extra time, otherwise show HT score */}
                            {(status === "ET" || status === "BT") ? (
                              <View style={{ alignItems: "center" }}>
                                {/* Always show 1st ET on top */}
                                <Text style={styles.halfTimeScore}>
                                  1st ET: {homeScore}-{awayScore}
                                </Text>
                                {/* Show 2nd ET below when past 105 minutes */}
                                {parseInt(currentMinute || "0") > 105 && (
                                  <Text style={[styles.halfTimeScore, { marginTop: 2 }]}>
                                    2nd ET: {homeScore}-{awayScore}
                                  </Text>
                                )}
                              </View>
                            ) : (
                              <Text style={styles.halfTimeScore}>
                                HT: {halfTimeScore}
                              </Text>
                            )}
                          </>
                        )}
                        
                        {/* Corner Kicks - Hide during ET/BT, show for other live/finished matches */}
                        {!isBasketball && (isLive || isFinished) && status !== "ET" && status !== "BT" && (
                          <View style={styles.cornerKicksContainer}>
                            <Flag size={12} color="rgba(255, 255, 255, 0.9)" />
                            <Text style={styles.cornerKicksText}>{getCornerKicks()}</Text>
                          </View>
                        )}
                        
                        {/* Basketball Quarter Info */}
                        {isBasketball && quarter && (
                          <Text style={styles.quarterInfo}>
                            Diff {Math.abs(parseInt(homeScore) - parseInt(awayScore))} pts
                          </Text>
                        )}
                      </View>
                    )}
                  </View>
                )}
              </View>

              {/* Away Team */}
              <TouchableOpacity
                style={[styles.teamSection, styles.awayTeamSection]}
                onPress={handleAwayTeamPress}
                activeOpacity={awayTeamHasData ? 0.7 : 1}
                disabled={!awayTeamHasData}
              >
                {awayLogo ? (
                  <Image
                    source={{ uri: awayLogo }}
                    style={styles.teamLogo}
                    resizeMode="contain"
                  />
                ) : (
                  <View style={[styles.teamLogo, styles.placeholderLogo]} />
                )}
                <Text style={[styles.teamName, styles.awayTeamName]} numberOfLines={2}>
                  {awayTeam}
                </Text>
                {/* ✅ FIX: Display rankings from enhancedData, fallback to params */}
                {(enhancedData?.rankings?.away || awayRanking) && (
                  <Text style={styles.teamRanking}>
                    [{enhancedData?.rankings?.away || awayRanking}]
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Broadcast Buttons - Inside background */}
            <View style={styles.broadcastContainer}>
              {true && (
                <TouchableOpacity style={styles.broadcastButton}>
                  <Video size={18} color="#FFFFFF" />
                  <Text style={styles.broadcastButtonText}>Video</Text>
                </TouchableOpacity>
              )}
              {true && (
                <TouchableOpacity style={styles.broadcastButton}>
                  <Film size={18} color="#FFFFFF" />
                  <Text style={styles.broadcastButtonText}>
                    Animation
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Attack Percentage Indicators - Show for ALL match types (upcoming, live, finished) */}
            <View style={styles.attackContainer}>
              {/* Labels with thumbs and percentages */}
              <View style={styles.attackLabelsRow}>
                <View style={styles.homeTeamLabel}>
                  <ThumbsUp size={18} color="#FFFFFF" fill="#FFFFFF" />
                  <Text style={styles.attackPercentageText}>{attackPercentages.home}%</Text>
                </View>
                <View style={styles.awayTeamLabel}>
                  <Text style={styles.attackPercentageText}>{attackPercentages.away}%</Text>
                  <View style={styles.awayThumb}>
                    <ThumbsUp size={18} color="#FFFFFF" fill="#FFFFFF" />
                  </View>
                </View>
              </View>
              {/* Indicator bar */}
              <View style={styles.attackBar}>
                <View style={[styles.attackBarSegment, { width: `${attackPercentages.home}%`, backgroundColor: "#E53935" }]} />
                <View style={[styles.attackBarSegment, { width: `${attackPercentages.away}%`, backgroundColor: "#1E88E5" }]} />
              </View>
            </View>
          </View>
        </ImageBackground>

        {/* Goal/Points Alert - 100% API-driven */}
        <MatchDetailsGoalAlert
          visible={showGoalAlert}
          scoringTeam={goalAlertTeam}
          minute={goalAlertMinute}
          sport={sport}
          eventType={goalAlertType}
          onDismiss={handleDismissGoalAlert}
        />

        {/* Tabs */}
        <View
          style={[
            styles.tabsContainer,
            { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.border || "rgba(0, 0, 0, 0.1)" },
          ]}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tabsScroll}
          >
            {orderedTabs.map((tab) => (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tab, activeTab === tab.key && styles.tabActive]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Text
                  style={[
                    styles.tabText,
                    { color: theme.colors.text },
                    activeTab === tab.key && styles.tabTextActive,
                  ]}
                >
                  {tab.label}
                </Text>
                {activeTab === tab.key && <View style={styles.tabIndicator} />}
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Menu Button - Nearly invisible for basketball matches */}
          <TouchableOpacity 
            style={[
              styles.menuButton,
              isBasketball && styles.menuButtonBasketball,
            ]}
            onPress={() => setShowRearrangeTabs(true)}
            activeOpacity={0.7}
          >
            <View style={styles.menuIcon}>
              <View style={[
                styles.menuLine,
                isBasketball && styles.menuLineBasketball,
              ]} />
              <View style={[
                styles.menuLine,
                isBasketball && styles.menuLineBasketball,
              ]} />
              <View style={[
                styles.menuLine,
                isBasketball && styles.menuLineBasketball,
              ]} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        <View
          style={[
            styles.tabContent,
            { backgroundColor: theme.colors.background },
          ]}
        >
          {renderTabContent()}
        </View>
      </ScrollView>

      {/* Share Modal */}
      <ShareModal
        visible={showShareModal}
        onClose={() => setShowShareModal(false)}
        title="Share Match"
        shareUrl={`https://champssportslovers.com/match/${matchId}`}
        shareText={`${homeTeam} vs ${awayTeam} - ${displayLeague}`}
      />

      {/* Rearrange Tabs Modal */}
      <RearrangeTabs
        visible={showRearrangeTabs}
        onClose={() => setShowRearrangeTabs(false)}
        currentTabOrder={tabOrder.length > 0 ? tabOrder : tabs.map(tab => tab.key)}
        tabLabels={Object.fromEntries(tabs.map(tab => [tab.key, tab.label]))}
        onSaveArrangement={handleSaveTabArrangement}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContentContainer: {
    flexGrow: 1,
  },
  headerInBackground: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: 50,
    paddingBottom: 8,
    marginBottom: 8,
  },
  headerButton: {
    padding: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  matchSection: {
    width: screenWidth,
    minHeight: 310,
    justifyContent: "flex-start",
  },
  backgroundImage: {
    opacity: 0.9,
  },
  matchOverlay: {
    paddingTop: 0,
    paddingBottom: 0,
    paddingHorizontal: 16,
  },
  statusBadge: {
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  statusFinished: {
    // Badge uses dark transparent background
  },
  statusLive: {
    // Badge uses dark transparent background
  },
  statusFixture: {
    // Badge uses dark transparent background
  },
  statusBadgeText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  etBadgeContainer: {
    alignSelf: "center",
    marginBottom: 8,
  },
  matchInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginTop: 8,
  },
  cornerKicksContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  cornerKicksText: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "600",
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  teamsContainer: {
    flexDirection: "row",
    alignItems: "flex-start", // ✅ Changed from "center" to "flex-start" to align countdown with team logos
    justifyContent: "space-between",
    paddingHorizontal: 8,
    marginTop: 4,
    marginBottom: 16,
  },
  teamSection: {
    flex: 1,
    alignItems: "center",
    maxWidth: screenWidth * 0.28,
  },
  awayTeamSection: {
    alignItems: "flex-end", // ✅ Align away team content to the right
  },
  teamLogo: {
    width: 68,
    height: 68,
    marginBottom: 10,
  },
  placeholderLogo: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 32,
  },
  teamName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  awayTeamName: {
    textAlign: "right", // ✅ Right-align away team name text
  },
  teamRanking: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.9)",
    marginTop: 4,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  centerSection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start", // ✅ Changed from "center" to "flex-start" to align with team logos
    paddingHorizontal: 12,
    marginTop: 0, // ✅ No top margin - aligns with team logos at the top
  },
  countdownContainer: {
    alignItems: "center",
    marginTop: 0, // ✅ Align with team logos (68px height)
  },
  countdownBox: {
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    borderRadius: 8,
    paddingHorizontal: 14, // ✅ Reduced from 16 to make it more compact
    paddingVertical: 10, // ✅ Reduced from 12 to make it more compact
    alignItems: "center",
    minWidth: 140, // ✅ Reduced from 160 to prevent collision with team names
  },
  countdownLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "rgba(255, 255, 255, 0.95)",
    marginBottom: 8,
    textAlign: "center",
    letterSpacing: 0.3,
  },
  countdownText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
    letterSpacing: 0.5,
  },
  scoreSection: {
    alignItems: "center",
  },
  liveMatchTimer: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FF4444",
    marginBottom: 6,
    textShadowColor: "rgba(0, 0, 0, 0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  scoreDisplay: {
    flexDirection: "row",
    alignItems: "center",
  },
  scoreText: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#FFFFFF",
    textShadowColor: "rgba(0, 0, 0, 0.6)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  scoreSeparator: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginHorizontal: 8,
    textShadowColor: "rgba(0, 0, 0, 0.6)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  halfTimeScore: {
    fontSize: 15,
    color: "rgba(255, 255, 255, 0.9)",
    marginTop: 8,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  quarterInfo: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.9)",
    marginTop: 4,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  broadcastContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginTop: 32,
    marginBottom: 12,
    overflow: "visible",
  },
  broadcastButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    paddingHorizontal: 24,
    paddingVertical: 11,
    borderRadius: 22,
    gap: 8,
  },
  broadcastButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  attackContainer: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    marginTop: 0,
    marginBottom: 0,
    marginHorizontal: -16,
    backgroundColor: "transparent",
    zIndex: 10,
  },
  attackLabelsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingVertical: 0,
    marginBottom: -12,
    zIndex: 6,
    position: "relative",
    height: "auto",
  },
  homeTeamLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingLeft: 0,
    justifyContent: "flex-start",
  },
  awayTeamLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingRight: 0,
    justifyContent: "flex-end",
  },
  attackPercentageText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  awayThumb: {
    transform: [{ rotateY: '180deg' }],
  },
  attackBar: {
    height: 8,
    flexDirection: "row",
    backgroundColor: "rgba(158, 158, 158, 0.4)",
    marginHorizontal: 0,
    marginTop: 12,
    marginBottom: 0,
    paddingHorizontal: 0,
    overflow: "hidden",
  },
  attackBarSegment: {
    height: "100%",
  },
  attackIndicators: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  attackRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  attackTeam: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  attackPercentage: {
    fontSize: 14,
    fontWeight: "600",

  },
  attackBars: {
    flex: 1,
    marginHorizontal: 12,
    gap: 4,
  },
  followButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    marginHorizontal: 16,
    marginVertical: 12,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  followButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  followButtonTextActive: {
    color: "#FFFFFF",
  },
  tabsContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  tabsScroll: {
    flex: 1,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    position: "relative",
  },
  tabActive: {
    // Active state
  },
  tabText: {
    fontSize: 15,
    fontWeight: "500",
  },
  tabTextActive: {
    fontWeight: "700",
  },
  tabIndicator: {
    position: "absolute",
    bottom: 0,
    left: "35%",
    right: "35%",
    height: 3,
    backgroundColor: "#E53935",
    borderRadius: 1.5,
  },
  menuButton: {
    padding: 12,
    paddingRight: 16,
  },
  menuButtonBasketball: {
    opacity: 0.15, // Nearly invisible for basketball matches
  },
  menuIcon: {
    flexDirection: "column",
    gap: 3,
    justifyContent: "center",
    alignItems: "center",
  },
  menuLine: {
    width: 18,
    height: 2.5,
    borderRadius: 1.5,
    backgroundColor: "#666",
  },
  menuLineBasketball: {
    backgroundColor: "rgba(102, 102, 102, 0.3)", // Extra blur for basketball
  },
  tabContent: {
    flex: 1, // ✅ Use flex to fill available space instead of fixed minHeight
    paddingBottom: 40,
  },
});
