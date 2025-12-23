import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
} from "react-native";
import Svg, { Circle } from "react-native-svg";
import { useTheme } from "../../../../../hooks/useTheme";
import {
  MessageSquare,
  Calendar,
  TrendingUp,
  Target,
  Flag,
  Activity,
  Sun,
  Cloud,
  CloudRain,
  Wind,
  Thermometer,
  Eye,
  Gauge,
  ChevronRight,
} from "lucide-react-native";
import MatchMomentumChart from "../../../../MatchMomentumChart";
import Weather from "../weather";
import MatchPreviewNews from "../match-preview-news";
import LiveCommentary from "./live-commentary";
import KeyEvents from "./key-events";
import Icons from "./icons";
import MatchStatistics from "../match-statistics";
import StatsDisplay from "../stats-display";
import BasketballQuartersTable from "../basketball-quarters-table";
import MatchDetailsDeepDataModal from "../deep-data-modal";
import { getSportStats, formatStatLabel, getStatDisplayName } from "@/config/sports-config";
import { createApiSportsService } from "@/services/api-sports-service";
import { backendApiService } from "@/services/backendApiService";

// Live tab component for football and basketball matches

const { width: screenWidth } = Dimensions.get("window");

interface LiveEvent {
  id: string;
  minute: number;
  team: "home" | "away" | "neutral";
  type:
    | "commentary"
    | "action"
    | "info"
    | "goal"
    | "yellow_card"
    | "red_card"
    | "substitution"
    | "corner"
    | "penalty"
    | "kick_off"
    | "half_time"
    | "full_time";
  player?: string;
  description: string;
  icon?: string;
  detail?: string;
  timestamp: Date;
  isImportant?: boolean;
}

interface MatchStats {
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
}

interface LiveProps {
  sport: string;
  events: LiveEvent[];
  homeTeamName?: string;
  awayTeamName?: string;
  homeTeamLogo?: string;
  awayTeamLogo?: string;
  currentMinute?: number;
  matchStats?: MatchStats;
  matchId?: string;
  isLive?: boolean;
  quarters?: {
    q1?: { home: number; away: number };
    q2?: { home: number; away: number };
    q3?: { home: number; away: number };
    q4?: { home: number; away: number };
  };
  homeScore?: number;
  awayScore?: number;
  halfTimeHomeScore?: number;
  halfTimeAwayScore?: number;
  venueName?: string;  // ✅ CRITICAL: Venue name from API
  venueCity?: string;  // ✅ CRITICAL: Venue city from API (100% REAL!)
  venueCapacity?: number;  // ✅ Venue capacity from API
  homeTeamId?: string;  // ✅ Add for deep data modal
  awayTeamId?: string;  // ✅ Add for deep data modal
}

export default function Live({
  sport,
  events = [],
  homeTeamName = "Home",
  awayTeamName = "Away",
  homeTeamLogo,
  awayTeamLogo,
  currentMinute = 0,
  matchStats,
  matchId,
  isLive = false,
  quarters,
  homeScore,
  awayScore,
  halfTimeHomeScore,
  halfTimeAwayScore,
  venueName,  // ✅ CRITICAL: Extract venue name from props
  venueCity,  // ✅ CRITICAL: Extract REAL venue city from props
  venueCapacity,  // ✅ Extract venue capacity
  homeTeamId,  // ✅ Extract for deep data modal
  awayTeamId,  // ✅ Extract for deep data modal
}: LiveProps) {
  const theme = useTheme();
  const isBasketball = sport === "basketball";

  // Ensure theme has fallback values
  const safeTheme = {
    ...theme,
    colors: {
      text: theme?.colors?.text || "#000000",
      textSecondary: theme?.colors?.textSecondary || "#666666",
      background: theme?.colors?.background || "#FFFFFF",
      backgroundSecondary: theme?.colors?.backgroundSecondary || "#F5F5F5",
      border: theme?.colors?.border || "#E0E0E0",
    },
  };
  const [activeSubTab, setActiveSubTab] = useState<"live" | "events">("live");
  const [showDeepDataModal, setShowDeepDataModal] = useState(false);
  
  // ✅ API-DRIVEN STATE: Fetch events and matchStats from API
  const [apiEvents, setApiEvents] = useState<LiveEvent[]>(events || []);
  const [apiMatchStats, setApiMatchStats] = useState<MatchStats | null>(matchStats || null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // ✅ Fetch events from API (100% API-driven)
  const fetchEventsFromAPI = useCallback(async () => {
    if (!matchId) return;
    
    try {
      const getApiKey = () => {
        return (
          process.env.EXPO_PUBLIC_API_FOOTBALL_KEY ||
          process.env.EXPO_PUBLIC_API_SPORT_KEY ||
          process.env.EXPO_PUBLIC_THE_SPORTSDB_API_KEY ||
          process.env.EXPO_API_FOOTBALL_KEY
        );
      };

      const apiKey = getApiKey();
      if (!apiKey) {
        console.log("⚠️ [LIVE TAB] No API key available for events");
        return;
      }

      const apiService = createApiSportsService(apiKey, {
        enableCaching: true,
        cacheExpiry: 2 * 60 * 1000, // 2 minutes for live events
        retryAttempts: 3,
        timeout: 10000,
      });
      
      const eventsResponse = await apiService.getMatchEvents(parseInt(matchId), sport);
      
      if (eventsResponse?.response?.length > 0) {
        const transformedEvents: LiveEvent[] = eventsResponse.response.map((ev: any, index: number) => {
          const isHomeTeam = ev.team?.name === homeTeamName;
          const isAwayTeam = ev.team?.name === awayTeamName;
          
          // ✅ Detect corner kicks and other important events
          const eventType = ev.type?.toLowerCase() || "";
          const isImportant = ["Goal", "Card", "subst", "Corner", "corner", "Penalty", "penalty"].includes(ev.type);
          
          return {
            id: `event-${ev.time?.elapsed || 0}-${index}-${ev.type || "event"}`,
            minute: ev.time?.elapsed || 0,
            team: isHomeTeam ? "home" : isAwayTeam ? "away" : "neutral",
            type: eventType, // ✅ Preserve original type for proper detection
            player: ev.player?.name || "",
            description: ev.comments || ev.detail || "",
            detail: ev.detail || "",
            timestamp: new Date(),
            isImportant: isImportant,
          };
        });
        
        setApiEvents(transformedEvents);
        console.log(`✅ [LIVE TAB] Fetched ${transformedEvents.length} events from API`);
      }
    } catch (error) {
      console.error("❌ [LIVE TAB] Error fetching events:", error);
    }
  }, [matchId, sport, homeTeamName, awayTeamName]);

  // ✅ Fetch match statistics from API (100% API-driven, NO hardcoded data)
  const fetchMatchStatsFromAPI = useCallback(async () => {
    if (!matchId || isLoadingStats) return;
    
    try {
      setIsLoadingStats(true);
      console.log(`📊 [LIVE TAB] Fetching REAL match statistics for ${matchId}`);
      
      // Get API key for direct statistics call
      const getApiKey = () => {
        return (
          process.env.EXPO_PUBLIC_API_FOOTBALL_KEY ||
          process.env.EXPO_PUBLIC_API_SPORT_KEY ||
          process.env.EXPO_PUBLIC_THE_SPORTSDB_API_KEY ||
          process.env.EXPO_API_FOOTBALL_KEY
        );
      };

      const apiKey = getApiKey();
      if (!apiKey) {
        console.error("❌ [LIVE TAB] No API key available for statistics");
        setIsLoadingStats(false);
        return;
      }

      // Create API service and fetch statistics directly
      const apiService = createApiSportsService(apiKey, {
        enableCaching: true,
        cacheExpiry: 2 * 60 * 1000, // 2 minutes cache
        retryAttempts: 3,
        timeout: 10000,
      });

      // Try direct statistics API call first
      let statisticsResponse = null;
      try {
        statisticsResponse = await apiService.getMatchStatistics(parseInt(matchId), sport);
        console.log(`📊 [LIVE TAB] Direct statistics API response:`, {
          hasResponse: !!statisticsResponse?.response,
          responseLength: statisticsResponse?.response?.length,
        });
      } catch (error) {
        console.warn("⚠️ [LIVE TAB] Direct statistics API failed, trying getLiveMatches fallback");
      }

      // Fallback to getLiveMatches if direct call fails or returns no data
      if (!statisticsResponse?.response || statisticsResponse.response.length === 0) {
        const matchData = await backendApiService.getLiveMatches(sport, true);
        const currentMatch = matchData.find(m => m.fixture?.id?.toString() === matchId);
        if (currentMatch?.statistics?.length > 0) {
          statisticsResponse = {
            response: currentMatch.statistics.map((stat: any) => ({
              statistics: stat.statistics || [],
              team: stat.team || null,
            })),
          };
        }
      }

      if (statisticsResponse?.response?.length >= 2) {
        const homeStats = statisticsResponse.response[0];
        const awayStats = statisticsResponse.response[1];
        
        // Extract statistics from API response - handle multiple possible stat type names
        const extractStatValue = (stats: any[], possibleTypes: string[]): number => {
          if (!stats || !Array.isArray(stats)) return 0;
          
          // Try each possible stat type name
          for (const statType of possibleTypes) {
            const stat = stats.find((s: any) => {
              const type = (s.type || "").toLowerCase();
              return type === statType.toLowerCase() || type.includes(statType.toLowerCase());
            });
            
            if (stat) {
              const value = stat.value;
              if (typeof value === "number") return value;
              if (typeof value === "string") {
                // Handle percentage values like "65%"
                if (value.includes("%")) {
                  return parseInt(value.replace("%", "").trim()) || 0;
                }
                // Handle numeric strings
                const parsed = parseInt(value.trim());
                if (!isNaN(parsed)) return parsed;
              }
            }
          }
          return 0; // Return 0 only if API truly has no data for this stat
        };

        const homeStatsArray = homeStats?.statistics || [];
        const awayStatsArray = awayStats?.statistics || [];

        // ✅ Extract ALL stats with multiple possible API field names - NO hardcoded defaults
        const stats: MatchStats = {
          possession: {
            home: extractStatValue(homeStatsArray, ["Ball Possession", "Possession", "Ball possession"]),
            away: extractStatValue(awayStatsArray, ["Ball Possession", "Possession", "Ball possession"]),
          },
          attacks: {
            home: extractStatValue(homeStatsArray, ["Attacks", "Total Attacks", "Attack"]),
            away: extractStatValue(awayStatsArray, ["Attacks", "Total Attacks", "Attack"]),
          },
          dangerousAttacks: {
            home: extractStatValue(homeStatsArray, ["Dangerous Attacks", "Dangerous attacks", "Dangerous Attack"]),
            away: extractStatValue(awayStatsArray, ["Dangerous Attacks", "Dangerous attacks", "Dangerous Attack"]),
          },
          shotsOnTarget: {
            home: extractStatValue(homeStatsArray, ["Shots on Goal", "Shots on Target", "Shots On Target", "On Target"]),
            away: extractStatValue(awayStatsArray, ["Shots on Goal", "Shots on Target", "Shots On Target", "On Target"]),
          },
          shotsOffTarget: {
            home: extractStatValue(homeStatsArray, ["Shots off Goal", "Shots off Target", "Shots Off Target", "Off Target"]),
            away: extractStatValue(awayStatsArray, ["Shots off Goal", "Shots off Target", "Shots Off Target", "Off Target"]),
          },
          corners: {
            home: extractStatValue(homeStatsArray, ["Corner Kicks", "Corner kicks", "Corners", "Corner"]),
            away: extractStatValue(awayStatsArray, ["Corner Kicks", "Corner kicks", "Corners", "Corner"]),
          },
          fouls: {
            home: extractStatValue(homeStatsArray, ["Fouls", "Foul"]),
            away: extractStatValue(awayStatsArray, ["Fouls", "Foul"]),
          },
          yellowCards: {
            home: extractStatValue(homeStatsArray, ["Yellow Cards", "Yellow cards", "Yellow Card", "Yellow"]),
            away: extractStatValue(awayStatsArray, ["Yellow Cards", "Yellow cards", "Yellow Card", "Yellow"]),
          },
          redCards: {
            home: extractStatValue(homeStatsArray, ["Red Cards", "Red cards", "Red Card", "Red"]),
            away: extractStatValue(awayStatsArray, ["Red Cards", "Red cards", "Red Card", "Red"]),
          },
          offsides: {
            home: extractStatValue(homeStatsArray, ["Offsides", "Offside"]),
            away: extractStatValue(awayStatsArray, ["Offsides", "Offside"]),
          },
        };
        
        setApiMatchStats(stats);
        console.log(`✅ [LIVE TAB] Fetched REAL match statistics from API:`, stats);
      } else {
        console.log(`⚠️ [LIVE TAB] No statistics available for match ${matchId} - API returned empty`);
        // Don't set default stats - let it remain null so UI can handle gracefully
      }
    } catch (error) {
      console.error("❌ [LIVE TAB] Error fetching match statistics:", error);
      // Don't set default stats on error - let it remain null
    } finally {
      setIsLoadingStats(false);
    }
  }, [matchId, sport, isLoadingStats]);

  // ✅ Fetch data on mount and when matchId changes
  useEffect(() => {
    if (matchId) {
      fetchEventsFromAPI();
      fetchMatchStatsFromAPI();
    }
  }, [matchId, fetchEventsFromAPI, fetchMatchStatsFromAPI]);

  // ✅ Poll for updates if match is live
  useEffect(() => {
    if (!isLive || !matchId) return;
    
    const interval = setInterval(() => {
      fetchEventsFromAPI();
      fetchMatchStatsFromAPI();
    }, 30000); // Update every 30 seconds for live matches
    
    return () => clearInterval(interval);
  }, [isLive, matchId, fetchEventsFromAPI, fetchMatchStatsFromAPI]);

  // ✅ Use REAL API events for momentum chart (100% API-driven)
  // Ensure ALL event types are detected: corners, subs, goals, penalties, cards, etc.
  const momentumEvents = React.useMemo(() => {
    const eventsToUse = apiEvents.length > 0 ? apiEvents : events;
    if (!eventsToUse || eventsToUse.length === 0) return [];
    
    // ✅ Filter and map ALL relevant events for momentum chart
    // Include corner kicks, substitutions, goals, cards, penalties, shots, etc.
    const keyEvents = eventsToUse.filter((e) => {
      const type = e.type?.toLowerCase() || "";
      const detail = e.detail?.toLowerCase() || "";
      const description = e.description?.toLowerCase() || "";
      
      // ✅ Include corner kicks and all important events
      // Exclude only commentary/info events
      const isCorner = type.includes("corner") || detail.includes("corner") || description.includes("corner");
      const isImportantEvent = !["commentary", "kick_off", "half_time", "full_time", "info", "action"].includes(type);
      
      return isCorner || isImportantEvent;
    });
    
    // ✅ Transform API events to momentum chart format with proper type mapping
    const chartEvents = keyEvents.map((event) => {
      const eventType = event.type?.toLowerCase() || "";
      let mappedType = eventType;
      
      // ✅ Map API event types to chart event types - ALL major icons detected
      if (eventType.includes("goal") && !eventType.includes("own")) {
        mappedType = "goal";
      } else if (eventType.includes("own") && eventType.includes("goal")) {
        mappedType = "own_goal";
      } else if (eventType.includes("corner") || eventType.includes("Corner")) {
        // ✅ Corner kick detection - ensure corner icons are displayed
        mappedType = "corner";
      } else if (eventType.includes("yellow") && eventType.includes("card")) {
        mappedType = "yellow_card";
      } else if (eventType.includes("red") && eventType.includes("card") && !eventType.includes("yellow")) {
        mappedType = "red_card";
      } else if (eventType.includes("yellow") && eventType.includes("red")) {
        mappedType = "yellow_red_card";
      } else if (eventType.includes("subst") || eventType.includes("substitution")) {
        // ✅ Detect substitution_in vs substitution_out
        if (eventType.includes("out") || eventType.includes("player_out") || event.detail?.includes("out")) {
          mappedType = "substitution_out";
        } else if (eventType.includes("in") || eventType.includes("player_in") || event.detail?.includes("in")) {
          mappedType = "substitution_in";
        } else {
          mappedType = "substitution";
        }
      } else if (eventType.includes("penalty")) {
        if (eventType.includes("miss") || eventType.includes("saved") || event.detail?.includes("miss")) {
          mappedType = "penalty_missed";
        } else {
          mappedType = "penalty_scored";
        }
      } else if (eventType.includes("shot") && (eventType.includes("on") || event.detail?.includes("on target"))) {
        mappedType = "shot_on_target";
      } else if (eventType.includes("shot") && (eventType.includes("off") || event.detail?.includes("off target"))) {
        mappedType = "shot_off_target";
      } else if (eventType.includes("var") || eventType.includes("VAR")) {
        mappedType = "var";
      } else if (eventType.includes("injury") || eventType.includes("injured")) {
        mappedType = "injury";
      } else if (eventType.includes("assist")) {
        mappedType = "assist";
      } else if (eventType.includes("penalties") || eventType.includes("penalty shootout")) {
        mappedType = "penalties";
      }
      
      return {
        id: event.id || `event-${event.minute}-${mappedType}`,
        type: mappedType,
        team: event.team === "home" || event.team === "away" ? event.team : "home",
        minute: parseInt(event.minute?.toString() || "0") || 0,
        player: event.player,
        detail: event.detail,
      };
    });
    
    console.log(`📊 Momentum chart using ${chartEvents.length} real API events:`, 
      chartEvents.map(e => `${e.type}@${e.minute}'`).slice(0, 10));
    return chartEvents as any[];
  }, [apiEvents, events]);

  // ✅ Use API stats if available, otherwise fallback to prop stats (NO hardcoded defaults)
  // Only use 0 values when API truly returns nothing - this ensures 100% real data
  const statsToUse = apiMatchStats || matchStats;
  
  // Ensure stats is always defined - use 0 only when API returns no data (not hardcoded defaults)
  const safeStats = {
    possession: statsToUse?.possession || { home: 0, away: 0 },
    attacks: statsToUse?.attacks || { home: 0, away: 0 },
    dangerousAttacks: statsToUse?.dangerousAttacks || { home: 0, away: 0 },
    shotsOnTarget: statsToUse?.shotsOnTarget || { home: 0, away: 0 },
    shotsOffTarget: statsToUse?.shotsOffTarget || { home: 0, away: 0 },
    corners: statsToUse?.corners || { home: 0, away: 0 },
    fouls: statsToUse?.fouls || { home: 0, away: 0 },
    yellowCards: statsToUse?.yellowCards || { home: 0, away: 0 },
    redCards: statsToUse?.redCards || { home: 0, away: 0 },
    offsides: statsToUse?.offsides || { home: 0, away: 0 },
  };

  // ✅ Use API events if available, otherwise fallback to prop events
  const eventsToUse = apiEvents.length > 0 ? apiEvents : events;
  
  // Commentary events - ALL events for live commentary
  const commentaryEvents = (eventsToUse || []).map(
    (e) =>
      ({
        ...e,
        team: e.team === "neutral" ? "home" : e.team || "home",
      }) as any,
  );

  // Key events - only important match events
  const keyEvents = (eventsToUse || [])
    .filter((e) =>
      [
        "goal",
        "yellow_card",
        "red_card",
        "substitution",
        "corner",
        "penalty",
      ].includes(e?.type || ""),
    )
    .map(
      (e) =>
        ({
          ...e,
          team: e.team === "neutral" ? "home" : e.team || "home",
        }) as any,
    );

  // 🔍 DEBUG: Log events being passed to Key Events component
  useEffect(() => {
    console.log("🔍 [LIVE.TSX] Events data:", {
      totalEvents: eventsToUse?.length || 0,
      apiEvents: apiEvents.length,
      propEvents: events?.length || 0,
      commentaryEventsCount: commentaryEvents.length,
      keyEventsCount: keyEvents.length,
      keyEventsPreview: keyEvents.slice(0, 3).map(e => ({
        type: e.type,
        minute: e.minute,
        player: e.player,
      })),
      matchStats: !!apiMatchStats,
      matchId,
      isLive,
    });
  }, [eventsToUse, apiEvents, events, keyEvents, commentaryEvents, apiMatchStats, matchId, isLive]);

  const renderSubTabs = () => (
    <View style={styles.subTabsContainer}>
      <TouchableOpacity
        style={[
          styles.subTab,
          activeSubTab === "live" && [
            styles.subTabActive,
            { backgroundColor: safeTheme.colors.backgroundSecondary },
          ],
        ]}
        onPress={() => setActiveSubTab("live")}
        activeOpacity={0.7}
      >
        <MessageSquare
          size={16}
          color={
            activeSubTab === "live" ? "#FF4444" : safeTheme.colors.textSecondary
          }
        />
        <Text
          style={[
            styles.subTabText,
            {
              color:
                activeSubTab === "live"
                  ? "#FF4444"
                  : safeTheme.colors.textSecondary,
              fontWeight: activeSubTab === "live" ? "700" : "500",
            },
          ]}
        >
          Live Commentary
        </Text>
        <View style={styles.eventCount}>
          <Text style={styles.eventCountText}>{commentaryEvents.length}</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.subTab,
          activeSubTab === "events" && [
            styles.subTabActive,
            { backgroundColor: safeTheme.colors.backgroundSecondary },
          ],
        ]}
        onPress={() => setActiveSubTab("events")}
        activeOpacity={0.7}
      >
        <Calendar
          size={16}
          color={
            activeSubTab === "events"
              ? "#FF4444"
              : safeTheme.colors.textSecondary
          }
        />
        <Text
          style={[
            styles.subTabText,
            {
              color:
                activeSubTab === "events"
                  ? "#FF4444"
                  : safeTheme.colors.textSecondary,
              fontWeight: activeSubTab === "events" ? "700" : "500",
            },
          ]}
        >
          Key Events
        </Text>
        <View style={styles.eventCount}>
          <Text style={styles.eventCountText}>{keyEvents.length}</Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  // ✅ Smart Momentum/Weather Section - ALWAYS show momentum chart (100% API-driven)
  const renderSmartMomentumWeatherSection = () => {
    // ✅ ALWAYS show momentum chart for ALL matches (upcoming, live, finished)
    // Chart will use API data or fallback to defaults if API data not available yet
    return (
      <View style={styles.momentumSection}>
        <MatchMomentumChart
          homeTeamLogo={homeTeamLogo}
          awayTeamLogo={awayTeamLogo}
          matchEvents={momentumEvents}
          currentMinute={currentMinute}
          matchStats={{
            attacks: safeStats.attacks,
            corners: safeStats.corners,
            dangerousAttacks: safeStats.dangerousAttacks,
            shotsOnTarget: safeStats.shotsOnTarget,
            shotsOffTarget: safeStats.shotsOffTarget,
          }}
          isLive={isLive}
          isFinished={isBasketball ? currentMinute >= 40 : currentMinute >= 90}
          homeTeamName={homeTeamName}
          awayTeamName={awayTeamName}
          sport={sport}
          matchId={matchId}
        />
      </View>
    );
  };

  const renderBasketballQuarters = () => {
    // Only render for basketball
    if (!isBasketball) return null;

    // Transform quarters data to expected format
    const transformedQuarters = {
      home: [
        quarters?.q1?.home ?? null,
        quarters?.q2?.home ?? null,
        quarters?.q3?.home ?? null,
        quarters?.q4?.home ?? null,
      ],
      away: [
        quarters?.q1?.away ?? null,
        quarters?.q2?.away ?? null,
        quarters?.q3?.away ?? null,
        quarters?.q4?.away ?? null,
      ],
    };

    return (
      <BasketballQuartersTable
        homeTeamName={homeTeamName}
        awayTeamName={awayTeamName}
        quarters={transformedQuarters}
        homeScore={homeScore || 0}
        awayScore={awayScore || 0}
      />
    );
  };

  // Circular Diagram Component - Always displays circles showing data proportions
  const CircularDiagram = ({ 
    homeValue, 
    awayValue, 
    label, 
    size = 70 
  }: { 
    homeValue: number; 
    awayValue: number; 
    label: string; 
    size?: number;
  }) => {
    // ✅ Use REAL API values - show equal halves (50/50) when both are 0, otherwise show actual proportions
    const total = homeValue + awayValue;
    // When total is 0, show equal halves so circles are always visible
    const homePercent = total > 0 ? (homeValue / total) * 100 : 50;
    const awayPercent = total > 0 ? (awayValue / total) * 100 : 50;
    
    const radius = (size - 16) / 2;
    const circumference = 2 * Math.PI * radius;
    const homeArcLength = (homePercent / 100) * circumference;
    const awayArcLength = (awayPercent / 100) * circumference;
    
    // Colors matching bars and momentum chart: Left side (home) = Yellow, Right side (away) = Grey
    const homeColor = "#FFA500"; // Orange/Yellow matching bars and momentum chart
    const awayColor = "#9E9E9E"; // Grey for away team (right side)
    
    // For left side = home, right side = away:
    // When rotated -90 degrees: top = left, bottom = right
    // Home (left) should be from top (0°) clockwise to bottom (180°) - YELLOW
    // Away (right) should be from bottom (180°) clockwise to top (360°/0°) - GREY
    
    return (
      <View style={styles.circularDiagramContainer}>
        <View style={styles.circularDiagramWrapper}>
          <Svg width={size} height={size}>
            {/* Background circle - always visible */}
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke="#404040"
              strokeWidth={8}
            />
            
            {/* Home team arc - LEFT side (from top clockwise to bottom) - YELLOW */}
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke={homeColor}
              strokeWidth={8}
              strokeLinecap="round"
              strokeDasharray={`${homeArcLength} ${circumference}`}
              strokeDashoffset={0}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
            
            {/* Away team arc - RIGHT side (from bottom clockwise to top) - GREY */}
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke={awayColor}
              strokeWidth={8}
              strokeLinecap="round"
              strokeDasharray={`${awayArcLength} ${circumference}`}
              strokeDashoffset={-homeArcLength}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          </Svg>
          
          {/* Center values */}
          <View style={styles.circularDiagramCenter}>
            <View style={styles.circularValuesRow}>
              <Text style={[styles.circularValue, { color: homeColor }]}>
                {homeValue}
              </Text>
              <View style={styles.circularDivider} />
              <Text style={[styles.circularValue, { color: awayColor }]}>
                {awayValue}
              </Text>
            </View>
          </View>
        </View>
        <Text style={[styles.circularLabel, { color: safeTheme.colors.text }]}>
          {label}
        </Text>
      </View>
    );
  };

  // Render Key Statistics only (without Additional Statistics)
  const renderKeyStatistics = () => {
    const homeStats = {
      possession: safeStats.possession.home,
      attacks: safeStats.attacks.home,
      dangerousAttacks: safeStats.dangerousAttacks.home,
      shotsOnTarget: safeStats.shotsOnTarget.home,
      shotsOffTarget: safeStats.shotsOffTarget.home,
      corners: safeStats.corners.home,
      yellowCards: safeStats.yellowCards.home,
      redCards: safeStats.redCards.home,
    };
    const awayStats = {
      possession: safeStats.possession.away,
      attacks: safeStats.attacks.away,
      dangerousAttacks: safeStats.dangerousAttacks.away,
      shotsOnTarget: safeStats.shotsOnTarget.away,
      shotsOffTarget: safeStats.shotsOffTarget.away,
      corners: safeStats.corners.away,
      yellowCards: safeStats.yellowCards.away,
      redCards: safeStats.redCards.away,
    };

    // Colors matching momentum chart
    const homeColor = "#FFA500"; // Orange/Yellow
    const awayColor = "#9E9E9E"; // Grey

    // Calculate percentages for indicator bars - ensures proportions are always visible
    // When both values are 0, shows 50/50 so bars are always visible
    const getBarPercentage = (homeVal: number, awayVal: number) => {
      const total = homeVal + awayVal;
      if (total === 0) return 50; // Show equal halves when no data
      return (homeVal / total) * 100;
    };

    // ✅ Calculate proportions for shots bars - shows which team has more/less
    const shotsOnTargetHomePercent = getBarPercentage(homeStats.shotsOnTarget, awayStats.shotsOnTarget);
    const shotsOffTargetHomePercent = getBarPercentage(homeStats.shotsOffTarget, awayStats.shotsOffTarget);

    return (
      <View style={styles.statsContainer}>
        {/* Team Names Header with Logos */}
        <View style={styles.teamsRow}>
          <View style={styles.teamContainer}>
            {homeTeamLogo ? (
              <Image source={{ uri: homeTeamLogo }} style={styles.teamLogo} resizeMode="contain" />
            ) : null}
            <Text style={[styles.teamName, { color: safeTheme.colors.text }]} numberOfLines={1}>
              {homeTeamName}
            </Text>
          </View>
          
          {/* Deep Data Button - Centered */}
          <TouchableOpacity
            style={styles.deepDataButton}
            onPress={() => setShowDeepDataModal(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.deepDataButtonText}>Deep Data</Text>
            <ChevronRight size={16} color="#E37871" />
          </TouchableOpacity>
          
          <View style={[styles.teamContainer, styles.awayTeamContainer]}>
            <Text style={[styles.teamName, styles.awayTeamName, { color: safeTheme.colors.text }]} numberOfLines={1}>
              {awayTeamName}
            </Text>
            {awayTeamLogo ? (
              <Image source={{ uri: awayTeamLogo }} style={styles.teamLogo} resizeMode="contain" />
            ) : null}
          </View>
        </View>

        {/* Three Circular Diagrams */}
        <View style={styles.circularDiagramsRow}>
          <CircularDiagram
            homeValue={homeStats.attacks}
            awayValue={awayStats.attacks}
            label="Attack"
          />
          <CircularDiagram
            homeValue={homeStats.dangerousAttacks}
            awayValue={awayStats.dangerousAttacks}
            label="Dangerous Attack"
          />
          <CircularDiagram
            homeValue={homeStats.possession}
            awayValue={awayStats.possession}
            label="Ball Possession"
          />
        </View>

        {/* Shots on Target Indicator Bar */}
        <View style={styles.shotsIndicatorRow}>
          {/* Left side icons and value */}
          <View style={styles.shotsLeftSide}>
            <Image 
              source={require("@/assets/matchIcons/corner.png")} 
              style={styles.shotsIcon} 
              resizeMode="contain"
            />
            <Image 
              source={require("@/assets/matchIcons/red.png")} 
              style={styles.shotsIcon} 
              resizeMode="contain"
            />
            <Image 
              source={require("@/assets/matchIcons/yellow.png")} 
              style={styles.shotsIcon} 
              resizeMode="contain"
            />
            <Text style={[styles.shotsValue, { color: safeTheme.colors.text }]}>
              {homeStats.shotsOnTarget}
            </Text>
          </View>

          {/* Indicator Bar - Centered */}
          <View style={styles.shotsBarContainer}>
            <View style={styles.shotsBarLabelRow}>
              <View style={styles.shotsBarLabelSpacer} />
              <Text style={[styles.shotsBarLabel, { color: safeTheme.colors.textSecondary }]}>
                Shots on Target
              </Text>
              <View style={styles.shotsBarLabelSpacer} />
            </View>
            <View style={styles.shotsBar}>
              {/* Home team bar - shows proportion based on real API data */}
              <View 
                style={[
                  styles.shotsBarHome, 
                  { 
                    width: `${Math.max(shotsOnTargetHomePercent, 0)}%`,
                    backgroundColor: homeColor,
                    minWidth: shotsOnTargetHomePercent > 0 ? 2 : 0, // Ensure visibility when > 0
                  }
                ]} 
              />
              {/* Away team bar - shows proportion based on real API data */}
              <View 
                style={[
                  styles.shotsBarAway, 
                  { 
                    width: `${Math.max(100 - shotsOnTargetHomePercent, 0)}%`,
                    backgroundColor: awayColor,
                    minWidth: (100 - shotsOnTargetHomePercent) > 0 ? 2 : 0, // Ensure visibility when > 0
                  }
                ]} 
              />
            </View>
          </View>

          {/* Right side value and icons */}
          <View style={styles.shotsRightSide}>
            <Text style={[styles.shotsValue, { color: safeTheme.colors.text }]}>
              {awayStats.shotsOnTarget}
            </Text>
            <Image 
              source={require("@/assets/matchIcons/yellow.png")} 
              style={styles.shotsIcon} 
              resizeMode="contain"
            />
            <Image 
              source={require("@/assets/matchIcons/red.png")} 
              style={styles.shotsIcon} 
              resizeMode="contain"
            />
            <Image 
              source={require("@/assets/matchIcons/corner.png")} 
              style={styles.shotsIcon} 
              resizeMode="contain"
            />
          </View>
        </View>

        {/* Shots off Target Indicator Bar */}
        <View style={styles.shotsIndicatorRow}>
          {/* Left side values (vertically aligned with icons above, horizontally aligned with label) */}
          <View style={styles.shotsLeftSide}>
            <Text style={[styles.shotsValue, { color: safeTheme.colors.text }]}>
              {homeStats.corners}
            </Text>
            <Text style={[styles.shotsValue, { color: safeTheme.colors.text }]}>
              {homeStats.redCards}
            </Text>
            <Text style={[styles.shotsValue, { color: safeTheme.colors.text }]}>
              {homeStats.yellowCards}
            </Text>
            <Text style={[styles.shotsValue, { color: safeTheme.colors.text }]}>
              {homeStats.shotsOffTarget}
            </Text>
          </View>

          {/* Indicator Bar - Centered */}
          <View style={styles.shotsBarContainer}>
            <View style={styles.shotsBarLabelRow}>
              <View style={styles.shotsBarLabelSpacer} />
              <Text style={[styles.shotsBarLabel, { color: safeTheme.colors.textSecondary }]}>
                Shots off Target
              </Text>
              <View style={styles.shotsBarLabelSpacer} />
            </View>
            <View style={styles.shotsBar}>
              {/* Home team bar - shows proportion based on real API data */}
              <View 
                style={[
                  styles.shotsBarHome, 
                  { 
                    width: `${Math.max(shotsOffTargetHomePercent, 0)}%`,
                    backgroundColor: homeColor,
                    minWidth: shotsOffTargetHomePercent > 0 ? 2 : 0, // Ensure visibility when > 0
                  }
                ]} 
              />
              {/* Away team bar - shows proportion based on real API data */}
              <View 
                style={[
                  styles.shotsBarAway, 
                  { 
                    width: `${Math.max(100 - shotsOffTargetHomePercent, 0)}%`,
                    backgroundColor: awayColor,
                    minWidth: (100 - shotsOffTargetHomePercent) > 0 ? 2 : 0, // Ensure visibility when > 0
                  }
                ]} 
              />
            </View>
          </View>

          {/* Right side values (vertically aligned with icons above, horizontally aligned with label) */}
          <View style={styles.shotsRightSide}>
            <Text style={[styles.shotsValue, { color: safeTheme.colors.text }]}>
              {awayStats.shotsOffTarget}
            </Text>
            <Text style={[styles.shotsValue, { color: safeTheme.colors.text }]}>
              {awayStats.yellowCards}
            </Text>
            <Text style={[styles.shotsValue, { color: safeTheme.colors.text }]}>
              {awayStats.redCards}
            </Text>
            <Text style={[styles.shotsValue, { color: safeTheme.colors.text }]}>
              {awayStats.corners}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderCommentarySection = () => (
    <View
      style={[
        styles.commentarySection,
        { backgroundColor: safeTheme.colors.backgroundSecondary },
      ]}
    >
      {activeSubTab === "live" ? (
        <LiveCommentary
          events={commentaryEvents}
          homeTeamName={homeTeamName}
          awayTeamName={awayTeamName}
          homeTeamLogo={homeTeamLogo}
          awayTeamLogo={awayTeamLogo}
          currentMinute={currentMinute}
          matchId={matchId}
          isLive={isLive}
        />
      ) : (
        <KeyEvents
          events={keyEvents}
          homeTeamName={homeTeamName}
          awayTeamName={awayTeamName}
          homeTeamLogo={homeTeamLogo}
          awayTeamLogo={awayTeamLogo}
          currentMinute={currentMinute}
          matchId={matchId}
          isLive={isLive}
          homeScore={homeScore}
          awayScore={awayScore}
          halfTimeHomeScore={halfTimeHomeScore}
          halfTimeAwayScore={halfTimeAwayScore}
          matchStats={{
            possession: safeStats.possession,
            shots: {
              home:
                safeStats.shotsOnTarget.home + safeStats.shotsOffTarget.home,
              away:
                safeStats.shotsOnTarget.away + safeStats.shotsOffTarget.away,
            },
            shotsOnTarget: safeStats.shotsOnTarget,
            corners: safeStats.corners,
          }}
        />
      )}
    </View>
  );

  const renderWeatherSection = () => {
    // ✅ BASKETBALL: Hide weather (indoor sport)
    if (isBasketball) {
      console.log("🏀 [Weather] Hiding weather section for basketball (indoor sport)");
      return null;
    }

    // Only show weather section separately for live/finished matches (when momentum is shown above)
    if (isLive || currentMinute >= 90) {
      // ✅ 100% API-DRIVEN: Use venue city from API only - no hardcoded fallbacks
      const cityForWeather = venueCity || undefined;
      
      // If no venue city from API, don't show weather (no hardcoding allowed)
      if (!cityForWeather) {
        console.log(`⚠️ [Weather] No venue city from API for ${homeTeamName} - hiding weather section`);
        return null;
      }

      return (
        <Weather
          sport={sport}
          homeTeamName={homeTeamName}
          cityName={cityForWeather}  // ✅ Use venue city if available, else fallback
          stadiumName={venueName || undefined}  // ✅ Don't create fake stadium names
          stadiumCapacity={venueCapacity}
          venueCityName={venueCity}  // ✅ Pass REAL city for display (if available)
          matchId={matchId}
        />
      );
    }
    // For upcoming matches, weather is shown in momentum position, so return null here
    return null;
  };

  // Dark Separator Component - Theme-responsive (dark in dark mode, grey in light mode)
  const DarkSeparator = () => {
    const isDarkMode = safeTheme.colors.background === "#2A2A2A";
    return (
      <View style={[
        styles.darkSeparator,
        { backgroundColor: isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" }
      ]} />
    );
  };

  // Function to render team info with proper alignment
  const renderTeamInfo = (teamName: string, teamLogo: string | undefined, isAway = false) => (
    <View style={[styles.teamInfo, isAway && styles.awayTeamInfo]}>
      {!isAway ? (
        // Home team - left aligned
        <>
          {teamLogo ? (
            <Image source={{ uri: teamLogo }} style={styles.teamLogo} resizeMode="contain" />
          ) : (
            <View style={styles.teamLogoPlaceholder} />
          )}
          <Text style={styles.teamName} numberOfLines={2}>{teamName}</Text>
        </>
      ) : (
        // Away team - right aligned
        <>
          <Text style={[styles.teamName, styles.awayTeamName]} numberOfLines={2}>{teamName}</Text>
          {teamLogo ? (
            <Image source={{ uri: teamLogo }} style={styles.teamLogo} resizeMode="contain" />
          ) : (
            <View style={styles.teamLogoPlaceholder} />
          )}
        </>
      )}
    </View>
  );

  return (
    <ScrollView
      style={[
        styles.container,
        { backgroundColor: safeTheme.colors.background },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Smart Momentum/Weather Section */}
      {renderSmartMomentumWeatherSection()}

      {/* Dark Separator after Momentum Chart */}
      <DarkSeparator />

      {/* Basketball Quarters Table (only for basketball) */}
      {renderBasketballQuarters()}

      {/* Dark Separator */}
      <DarkSeparator />

      {/* Key Statistics Only (with Deep Data button) */}
      {renderKeyStatistics()}

      {/* Dark Separator */}
      <DarkSeparator />

      {/* Sub Tabs for Commentary/Events */}
      {renderSubTabs()}

      {/* Commentary/Events Content */}
      {renderCommentarySection()}

      {/* Dark Separator */}
      <DarkSeparator />

      {/* Match Event Icons - Football Only */}
      <Icons
        sport={sport}
        onIconPress={(iconId) => {
          console.log("Icon pressed:", iconId);
        }}
      />

      {/* Dark Separator */}
      <DarkSeparator />

      {/* Weather Section */}
      {renderWeatherSection()}

      {/* Match Preview News Section - Has its own separators */}
      <MatchPreviewNews
        homeTeamName={homeTeamName}
        awayTeamName={awayTeamName}
        leagueName="League"
        matchId={matchId}
      />

      {/* Bottom spacing */}
      <View style={{ height: 20 }} />

      {/* Deep Data Modal */}
      {matchId && homeTeamId && awayTeamId && (
        <MatchDetailsDeepDataModal
          visible={showDeepDataModal}
          onClose={() => setShowDeepDataModal(false)}
          matchId={matchId}
          homeTeamId={homeTeamId}
          awayTeamId={awayTeamId}
          homeTeamName={homeTeamName}
          awayTeamName={awayTeamName}
          homeTeamLogo={homeTeamLogo || ""}
          awayTeamLogo={awayTeamLogo || ""}
          sport={sport}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  // Team Info styling
  teamInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  awayTeamInfo: {
    justifyContent: 'flex-end',
  },
  teamLogo: {
    width: 40,
    height: 40,
    marginRight: 10,
    marginLeft: 0,
  },
  teamLogoPlaceholder: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    marginRight: 10,
    marginLeft: 0,
  },
  teamName: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    textAlign: 'left',
  },
  awayTeamName: {
    marginRight: 10,
    marginLeft: 0,
    textAlign: 'right',
    flex: 0, // ✅ Remove flex to position near logo on the right
  },

  // Dark Separator - Theme-responsive (uses border color from theme)
  darkSeparator: {
    height: 4,
    // backgroundColor removed - now set inline with theme.colors.border
    marginVertical: 0,
  },

  // Key Statistics Styles
  statsContainer: {
    padding: 16,
    backgroundColor: 'transparent',
  },
  teamsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  teamContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 8,
    marginTop: 36, // Move team names/logos even lower
  },
  awayTeamContainer: {
    justifyContent: "flex-end",
  },
  teamLogo: {
    width: 24,
    height: 24,
  },
  teamName: {
    fontSize: 14,
    fontFamily: "Inter-SemiBold",
    flex: 1,
  },
  awayTeamName: {
    textAlign: "right",
    flex: 0,
  },
  deepDataButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#524C4B", // Dark desaturated reddish-brown/grey interior matching screenshot
    borderWidth: 2,
    borderColor: "#E45D51", // Vibrant red ring matching screenshot
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
    marginHorizontal: 8,
    marginTop: -4, // Move button upwards to avoid touching team names
  },
  deepDataButtonText: {
    color: "#E37871", // Muted reddish-coral text color matching screenshot
    fontSize: 13,
    fontFamily: "Inter-SemiBold",
  },
  statsSection: {
    marginBottom: 0,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Inter-SemiBold",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  statValue: {
    width: 45,
    textAlign: "center",
    fontSize: 14,
    fontFamily: "Inter-Bold",
  },
  statCenter: {
    flex: 1,
    marginHorizontal: 12,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: "Inter-Medium",
    textAlign: "center",
    marginBottom: 6,
  },
  statBar: {
    flexDirection: "row",
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
    backgroundColor: "rgba(0, 0, 0, 0.1)",
  },
  statBarHome: {
    height: "100%",
  },
  statBarAway: {
    height: "100%",
  },
  noDataText: {
    textAlign: "center",
    fontSize: 14,
    fontFamily: "Inter-Regular",
    padding: 20,
  },
  
  // Circular Diagrams Styles
  circularDiagramsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 8,
  },
  circularDiagramContainer: {
    alignItems: "center",
    flex: 1,
  },
  circularDiagramWrapper: {
    width: 70,
    height: 70,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    marginBottom: 8,
  },
  circularDiagramCenter: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  circularValuesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  circularValue: {
    fontSize: 14,
    fontFamily: "Inter-Bold",
    fontWeight: "700",
  },
  circularDivider: {
    width: 1,
    height: 12,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
  },
  circularLabel: {
    fontSize: 11,
    fontFamily: "Inter-Medium",
    textAlign: "center",
    marginTop: 4,
  },
  
  // Shots Indicator Styles
  shotsIndicatorRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  shotsLeftSide: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    width: 100,
    justifyContent: "flex-start",
    height: 22,
    marginTop: 0,
  },
  shotsRightSide: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    width: 100,
    justifyContent: "flex-end",
    height: 22,
    marginTop: 0,
  },
  shotsIcon: {
    width: 22,
    height: 22,
  },
  shotsValue: {
    fontSize: 14,
    fontFamily: "Inter-Bold",
    fontWeight: "700",
    minWidth: 20,
    textAlign: "center",
    lineHeight: 22,
    height: 22,
  },
  shotsBarContainer: {
    flex: 1,
    marginHorizontal: 12,
  },
  shotsBarLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
    height: 22,
  },
  shotsBarLabelSpacer: {
    width: 100,
  },
  shotsBarLabel: {
    fontSize: 12,
    fontFamily: "Inter-Medium",
    textAlign: "center",
    lineHeight: 22,
    height: 22,
  },
  shotsBar: {
    flexDirection: "row",
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  shotsBarHome: {
    height: "100%",
  },
  shotsBarAway: {
    height: "100%",
  },

  // Section Headers
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  updateTime: {
    fontSize: 12,
  },
  stadiumInfo: {
    alignItems: "flex-end",
  },
  stadiumName: {
    fontSize: 12,
    fontWeight: "500",
  },
  stadiumCapacity: {
    fontSize: 10,
  },

  // Momentum Section
  momentumSection: {
    marginVertical: 8,
  },

  // Statistics Section
  statsSection: {
    marginVertical: 8,
  },

  // Stats Grid
  statsGrid: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  statLabel: {
    flex: 1,
    fontSize: 14,
  },
  statValue: {
    width: 30,
    textAlign: "center",
    fontSize: 14,
    fontWeight: "600",
  },
  statBar: {
    flex: 2,
    height: 4,
    backgroundColor: "rgba(0,0,0,0.1)",
    borderRadius: 2,
    marginHorizontal: 12,
    position: "relative",
  },
  statBarFill: {
    height: "100%",
    borderRadius: 2,
  },
  statBarContainer: {
    position: "absolute",
    left: "50%",
    top: -4,
    transform: [{ translateX: -6 }],
  },

  // Sub Tabs
  subTabsContainer: {
    flexDirection: "row",
    marginTop: 2,
    marginBottom: -4,
    marginHorizontal: 0,
    paddingHorizontal: 0,
    gap: 0,
  },
  subTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 12,
    gap: 6,
    borderRadius: 0,
    minHeight: 56,
  },
  subTabActive: {
    // Additional styling for active state to ensure full coverage
  },
  subTabText: {
    fontSize: 14,
  },
  eventCount: {
    backgroundColor: "#FF4444",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
  },
  eventCountText: {
    fontSize: 10,
    color: "white",
    fontWeight: "600",
  },

  // Commentary Section
  commentarySection: {
    paddingTop: 16,
    paddingBottom: 16,
    minHeight: 200,
    marginHorizontal: 0,
  },
});
