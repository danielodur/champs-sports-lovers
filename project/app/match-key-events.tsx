import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Image,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import Svg, { Path, Circle } from "react-native-svg";
import { useTheme } from "@/hooks/useTheme";
import { createApiSportsService } from "@/services/api-sports-service";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const TIMELINE_WIDTH = 2;
const CENTER_OFFSET = SCREEN_WIDTH / 2;

interface LiveEvent {
  id: string;
  minute: number;
  team: "home" | "away";
  type:
    | "commentary"
    | "action"
    | "info"
    | "goal"
    | "yellow_card"
    | "red_card"
    | "substitution"
    | "corner"
    | "penalty";
  player?: string;
  description: string;
  icon?: string;
  detail?: string;
  timestamp: Date;
  isImportant?: boolean;
  teamLogo?: string; // ✅ SYNCED: Team logo for event display
}

interface MatchLiveEventsProps {
  events: LiveEvent[];
  homeTeamName?: string;
  awayTeamName?: string;
  homeTeamLogo?: string;
  awayTeamLogo?: string;
  currentMinute?: number;
  matchId?: string;
  isLive?: boolean;
  onEventsUpdate?: (events: LiveEvent[]) => void;
  homeScore?: number;
  awayScore?: number;
  halfTimeHomeScore?: number;
  halfTimeAwayScore?: number;
  matchStats?: {
    possession?: { home: number; away: number };
    shots?: { home: number; away: number };
    shotsOnTarget?: { home: number; away: number };
    corners?: { home: number; away: number };
  };
}

// Red Whistle Icon Component - Realistic referee whistle
const WhistleIcon = ({ size = 20, color = "#FF4444" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {/* Main whistle body - elongated teardrop shape */}
    <Path
      d="M6 10 C6 8 7 7 9 7 L13 7 C15 7 16 8 16 10 L16 14 C16 16 15 17 13 17 L9 17 C7 17 6 16 6 14 Z"
      fill={color}
      stroke={color}
      strokeWidth="0.3"
    />
    
    {/* Mouthpiece - left side (where referee blows) */}
    <Path
      d="M5 11 C5 10.5 5.5 10 6 10 L6 14 C6 14.5 5.5 15 5 15 Z"
      fill={color}
      stroke={color}
      strokeWidth="0.3"
    />
    
    {/* Sound holes - realistic circular holes */}
    <Circle cx="9.5" cy="12" r="1.2" fill="#fff" opacity="0.95" />
    <Circle cx="12" cy="12" r="1.2" fill="#fff" opacity="0.95" />
    <Circle cx="14.5" cy="12" r="1.2" fill="#fff" opacity="0.95" />
    
    {/* Air chamber detail lines - adds depth */}
    <Path
      d="M8 9.5 Q11 9 14 9.5"
      stroke="#fff"
      strokeWidth="0.6"
      strokeLinecap="round"
      opacity="0.5"
      fill="none"
    />
    <Path
      d="M8 14.5 Q11 15 14 14.5"
      stroke="#fff"
      strokeWidth="0.6"
      strokeLinecap="round"
      opacity="0.5"
      fill="none"
    />
    
    {/* Lanyard ring - right side */}
    <Circle 
      cx="17.5" 
      cy="12" 
      r="1.8" 
      fill="none" 
      stroke={color} 
      strokeWidth="1.2"
    />
    
    {/* Lanyard chain - hanging down */}
    <Path
      d="M19 12 L20.5 13.5 M20.5 13.5 L21.5 15"
      stroke={color}
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    
    {/* Highlight/shine on whistle body */}
    <Path
      d="M7 9 Q11 8.5 15 9"
      stroke="#fff"
      strokeWidth="0.8"
      strokeLinecap="round"
      opacity="0.3"
      fill="none"
    />
  </Svg>
);

// ============================================================================
// ✅ KEY EVENTS COMPONENT - 100% API-DRIVEN
// ============================================================================
// Data Sources:
// 1. Timer (currentMinute): Received from parent (match-details-main → LiveTab → KeyEvents)
//    - Updated by match-details-main polling every 15s
//    - Ensures timer is SYNCED across all screens
// 2. Events: Fetched independently from API every 45s
//    - ALL event types detected from API (goals, cards, subs, penalties, etc.)
//    - ALL icons mapped from API event types
//    - ALL descriptions from API detail/comments fields
//    - NO hardcoded or mock data
// ============================================================================
export default function MatchLiveEvents({
  events,
  homeTeamName,
  awayTeamName,
  homeTeamLogo, // ✅ SYNCED: Team logos for event display
  awayTeamLogo, // ✅ SYNCED: Team logos for event display
  currentMinute = 0, // ✅ SYNCED from parent (match-details-main polling)
  matchId,
  isLive = false,
  onEventsUpdate,
  homeScore = 0,
  awayScore = 0,
  halfTimeHomeScore,
  halfTimeAwayScore,
  matchStats,
}: MatchLiveEventsProps) {
  const theme = useTheme();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);
  const [realTimeEvents, setRealTimeEvents] = useState<LiveEvent[]>(events);
  const [showOnlyGoals, setShowOnlyGoals] = useState(false);

  // 🔍 DEBUG: Log all props on mount and when they change
  useEffect(() => {
    console.log("🔍 [KEY EVENTS DEBUG] Component props:", {
      eventsLength: events?.length || 0,
      hasEvents: !!events && events.length > 0,
      matchId,
      isLive,
      homeTeamName,
      awayTeamName,
      eventsPreview: events?.slice(0, 3).map(e => ({
        type: e.type,
        minute: e.minute,
        player: e.player,
      })),
    });
  }, [events, matchId, isLive, homeTeamName, awayTeamName]);

  // Fetch real-time key events data
  const fetchRealKeyEventsData = useCallback(async () => {
    if (!matchId || !isLive) {
      console.log("⚠️ [KEY EVENTS] Skipping fetch:", { matchId, isLive });
      return;
    }

    try {
      console.log(`⭐ Fetching REAL key events for match ${matchId}`);
      setIsRefreshing(true);

      // Helper function to get API key
      const getApiKey = () => {
        return (
          process.env.EXPO_PUBLIC_API_FOOTBALL_KEY ||
          process.env.EXPO_PUBLIC_API_SPORT_KEY ||
          process.env.EXPO_PUBLIC_THE_SPORTSDB_API_KEY ||
          process.env.EXPO_API_FOOTBALL_KEY
        );
      };

      // Check if API key is available
      const apiKey = getApiKey();
      if (!apiKey) {
        console.error("❌ No API key available for key events request");
        setIsRefreshing(false);
        return;
      }

      // Get match events from API using factory function
      const apiService = createApiSportsService(apiKey, {
        enableCaching: true,
        cacheExpiry: 2 * 60 * 1000, // 2 minutes for live events
        retryAttempts: 3,
        timeout: 10000,
      });
      const eventsResponse = await apiService.getMatchEvents(parseInt(matchId));

      if (eventsResponse?.response?.length > 0) {
        console.log(`📊 [API RESPONSE] Raw events:`, eventsResponse.response.map((e: any) => ({
          type: e.type,
          detail: e.detail,
          player: e.player?.name,
          time: e.time?.elapsed,
        })));
        
        const formattedEvents: LiveEvent[] = eventsResponse.response
          .filter((event: any) => {
            // Only include key events
            const eventType = event.type?.toLowerCase() || "";
            const eventDetail = event.detail?.toLowerCase() || "";
            
            // ✅ COMPREHENSIVE KEY EVENT FILTER - Include ALL important match events
            const isKeyEvent = [
              "goal",
              "card",
              "subst",
              "substitution",
              "yellow card",
              "red card",
              "penalty",
              "own goal",
              "var",
              "injury",
              "shot", // Include shots for shot_on/shot_off
              "corner", // ✅ Ensure corner kicks are included
              "assist", // ✅ Include assists
            ].some((keyType) => eventType.includes(keyType) || eventDetail.includes(keyType));
            
            console.log(`🔍 Event filter: "${event.type}" (${event.detail}) -> ${isKeyEvent ? 'KEEP' : 'SKIP'}`);
            return isKeyEvent;
          })
          .map((event: any, index: number) => {
            const eventType = event.type?.toLowerCase() || "";
            const eventDetail = event.detail?.toLowerCase() || "";
            
            console.log(`🔍 [EVENT MAPPING] Processing:`, {
              rawType: event.type,
              rawDetail: event.detail,
              player: event.player?.name,
              minute: event.time?.elapsed,
            });
            
            // ============================================
            // Determine event type based on type AND detail fields
            // Order-sensitive: Check specific events BEFORE general ones
            // All supported types: og, goal, yellow_card, red_card, yellow_red_card,
            // penalty, penalty_missed, substitution, substitution_out, corner,
            // var, injury, shot_on, shot_off
            // ============================================
            let mappedType: string;
            
            // 1. YELLOW-RED CARD (Second Yellow = Red) - Check FIRST
            if (eventType.includes("card") && 
                (eventDetail.includes("second yellow") || 
                 (eventDetail.includes("yellow") && eventDetail.includes("red")))) {
              mappedType = "yellow_red_card";
              console.log(`✅ Mapped to: yellow_red_card (Second Yellow)`);
            }
            // 2. OWN GOAL - Check before normal goal
            else if ((eventType.includes("own") && eventType.includes("goal")) ||
                     (eventDetail.includes("own") && eventDetail.includes("goal"))) {
              mappedType = "og";
              console.log(`✅ Mapped to: og (Own Goal)`);
            }
            // 3. NORMAL GOAL - Check after own goal, exclude substitution mentions
            else if (eventType.includes("goal") || eventDetail.includes("goal")) {
              if (eventDetail.includes("substitution") || eventType.includes("subst")) {
                mappedType = "substitution";
                console.log(`✅ Mapped to: substitution (from goal context)`);
              } else {
                mappedType = "goal";
                console.log(`✅ Mapped to: goal`);
              }
            }
            // 4. RED CARD (Direct Red) - Check before yellow
            else if (eventType.includes("card") && eventDetail.includes("red") && !eventDetail.includes("yellow")) {
              mappedType = "red_card";
              console.log(`✅ Mapped to: red_card (Direct Red)`);
            }
            // 5. YELLOW CARD (Individual Yellow)
            else if (eventType.includes("card") && eventDetail.includes("yellow") && !eventDetail.includes("red")) {
              mappedType = "yellow_card";
              console.log(`✅ Mapped to: yellow_card`);
            }
            // 6. CARD (Generic - default to yellow)
            else if (eventType.includes("card")) {
              mappedType = "yellow_card";
              console.log(`✅ Mapped to: yellow_card (default card type)`);
            }
            // 7. PENALTY MISSED
            else if ((eventType.includes("penalty") || eventDetail.includes("penalty")) && 
                     (eventDetail.includes("miss") || eventDetail.includes("saved"))) {
              mappedType = "penalty_missed";
              console.log(`✅ Mapped to: penalty_missed`);
            }
            // 8. PENALTY SCORED
            else if (eventType.includes("penalty") || eventDetail.includes("penalty")) {
              mappedType = "penalty";
              console.log(`✅ Mapped to: penalty (scored)`);
            }
            // 9. SUBSTITUTION OUT (Player leaving) - Both icons shown together
            else if (eventType.includes("subst") && eventDetail.includes("out")) {
              mappedType = "substitution"; // ✅ Use "substitution" to trigger both icons display
              console.log(`✅ Mapped to: substitution (will show both player_out and player_in icons)`);
            }
            // 10. SUBSTITUTION IN (Player entering) - Both icons shown together
            else if (eventType.includes("subst") && (eventDetail.includes("in") || event.assist?.name)) {
              mappedType = "substitution"; // ✅ Use "substitution" to trigger both icons display
              console.log(`✅ Mapped to: substitution (will show both player_out and player_in icons)`);
            }
            // 11. SUBSTITUTION (Generic) - Both icons shown together
            else if (eventType.includes("subst") || eventDetail.includes("substitution")) {
              mappedType = "substitution";
              console.log(`✅ Mapped to: substitution (will show both player_out and player_in icons)`);
            }
            // 12. SHOT ON TARGET
            else if ((eventType.includes("shot") && eventDetail.includes("on")) ||
                     (eventType.includes("shot") && eventDetail.includes("target"))) {
              mappedType = "shot_on";
              console.log(`✅ Mapped to: shot_on (Shot On Target)`);
            }
            // 13. SHOT OFF TARGET
            else if (eventType.includes("shot") && eventDetail.includes("off")) {
              mappedType = "shot_off";
              console.log(`✅ Mapped to: shot_off (Shot Off Target)`);
            }
            // 14. CORNER KICK - ✅ Ensure corner kicks are detected
            else if (eventType.includes("corner") || 
                     eventDetail.includes("corner") ||
                     event.comments?.toLowerCase().includes("corner")) {
              mappedType = "corner";
              console.log(`✅ Mapped to: corner (Corner Kick)`);
            }
            // 15. VAR DECISION
            else if (eventType.includes("var") || 
                     eventDetail.includes("var") || 
                     eventDetail.includes("video") ||
                     event.comments?.toLowerCase().includes("var")) {
              mappedType = "var";
              console.log(`✅ Mapped to: var (VAR Decision)`);
            }
            // 16. INJURY
            else if (eventType.includes("injury") || 
                     eventDetail.includes("injury") || 
                     eventDetail.includes("injured") ||
                     event.comments?.toLowerCase().includes("injury")) {
              mappedType = "injury";
              console.log(`✅ Mapped to: injury`);
            }
            // 17. ASSIST
            else if (eventType.includes("assist") || 
                     eventDetail.includes("assist") ||
                     event.comments?.toLowerCase().includes("assist")) {
              mappedType = "assist";
              console.log(`✅ Mapped to: assist`);
            }
            // 18. DEFAULT - Generic action
            else {
              mappedType = "action";
              console.log(`⚠️ Mapped to: action (unknown event type: ${eventType}, detail: ${eventDetail})`);
            }
            
            console.log(`✅ [EVENT MAPPING] Result: "${event.type}" (${event.detail}) -> ${mappedType}`);
            
            // Robust team assignment with fallback logic
            const determineTeam = () => {
              const apiTeamName = event.team?.name?.toLowerCase().trim() || "";
              const apiTeamId = event.team?.id;
              const homeNameClean = homeTeamName?.toLowerCase().trim() || "";
              const awayNameClean = awayTeamName?.toLowerCase().trim() || "";
              
              console.log(`🏠 [TEAM MATCHING] API: "${apiTeamName}" (ID: ${apiTeamId}) | Home: "${homeNameClean}" | Away: "${awayNameClean}"`);
              
              // Try exact match first
              if (apiTeamName === homeNameClean) {
                console.log(`✅ Matched HOME (exact)`);
                return "home";
              }
              if (apiTeamName === awayNameClean) {
                console.log(`✅ Matched AWAY (exact)`);
                return "away";
              }
              
              // Try partial match (contains)
              if (homeNameClean && apiTeamName.includes(homeNameClean)) {
                console.log(`✅ Matched HOME (partial - API contains home)`);
                return "home";
              }
              if (awayNameClean && apiTeamName.includes(awayNameClean)) {
                console.log(`✅ Matched AWAY (partial - API contains away)`);
                return "away";
              }
              
              // Reverse: check if home/away name contains API name
              if (homeNameClean && homeNameClean.includes(apiTeamName)) {
                console.log(`✅ Matched HOME (partial - home contains API)`);
                return "home";
              }
              if (awayNameClean && awayNameClean.includes(apiTeamName)) {
                console.log(`✅ Matched AWAY (partial - away contains API)`);
                return "away";
              }
              
              // Use team ID alternating pattern as last resort
              console.warn(`⚠️ NO MATCH FOUND - Using team ID alternating pattern`);
              return apiTeamId % 2 === 0 ? "away" : "home";
            };
            
            // Build comprehensive description from API fields (like Chinese app)
            const getDescription = () => {
              const detail = event.detail || "";
              const comments = event.comments || "";
              const playerName = event.player?.name || "";
              const assistName = event.assist?.name || "";
              const teamName = event.team?.name || "";
              
              // Use comments if available (most detailed API description)
              if (comments && comments.trim().length > 0) {
                return comments.trim();
              }
              
              // Build rich description based on event type
              if (mappedType === "goal") {
                if (assistName) {
                  return `Goal! ${playerName ? `${playerName} ` : ""}scores${assistName ? ` with an assist from ${assistName}` : ""}. ${detail || ""}`;
                }
                return `Goal! ${playerName ? `${playerName} ` : ""}${detail || "scores!"}`;
              } else if (mappedType === "og") {
                return `Own goal! ${playerName ? `${playerName} ` : ""}${detail || "scores an own goal"}`;
              } else if (mappedType === "yellow_card") {
                return `Yellow card! ${playerName ? `${playerName} ` : ""}receives a yellow card. ${detail || ""}`;
              } else if (mappedType === "red_card") {
                return `Red card! ${playerName ? `${playerName} ` : ""}is shown a red card and sent off. ${detail || ""}`;
              } else if (mappedType === "yellow_red_card") {
                return `Second yellow card! ${playerName ? `${playerName} ` : ""}receives a second yellow card and is sent off. ${detail || ""}`;
              } else if (mappedType === "substitution") {
                const playerIn = assistName || "";
                const playerOut = playerName || "";
                if (playerIn && playerOut) {
                  return `Substitution: ${playerOut} is replaced by ${playerIn}. ${detail || ""}`;
                }
                return `Substitution${playerName ? `: ${playerName}` : ""}. ${detail || ""}`;
              } else if (mappedType === "substitution_out") {
                return `Substituted off: ${playerName || ""}. ${detail || ""}`;
              } else if (mappedType === "corner") {
                return `Corner kick awarded to ${teamName || "team"}. ${detail || ""}`;
              } else if (mappedType === "penalty") {
                return `Penalty scored! ${playerName ? `${playerName} ` : ""}converts the penalty. ${detail || ""}`;
              } else if (mappedType === "penalty_missed") {
                return `Penalty missed! ${playerName ? `${playerName} ` : ""}${detail || "fails to convert the penalty"}`;
              } else if (mappedType === "var") {
                return `VAR decision: ${detail || comments || "Video review in progress"}`;
              } else if (mappedType === "injury") {
                return `Injury: ${playerName ? `${playerName} ` : ""}${detail || "Player requires medical attention"}`;
              } else if (mappedType === "shot_on") {
                return `Shot on target${playerName ? ` by ${playerName}` : ""}. ${detail || ""}`;
              } else if (mappedType === "shot_off") {
                return `Shot off target${playerName ? ` by ${playerName}` : ""}. ${detail || ""}`;
              }
              
              // Default: combine available fields
              const parts: string[] = [];
              if (detail) parts.push(detail);
              if (playerName && !detail.includes(playerName)) parts.push(`(${playerName})`);
              if (comments && comments !== detail) parts.push(comments);
              
              return parts.length > 0 ? parts.join(" - ") : "Match event";
            };
            
            // ✅ SYNCED: Assign team logo based on determined team (same logic as LiveCommentary)
            const assignedTeam = determineTeam();
            const teamLogo = assignedTeam === "home" ? homeTeamLogo : 
                            assignedTeam === "away" ? awayTeamLogo : undefined;
            
            return {
              id: `key-${event.team?.id || "system"}-${event.time?.elapsed || 0}-${index}`,
              minute: event.time?.elapsed || 0,
              team: assignedTeam,
              type: mappedType,
              player: event.player?.name || "",
              description: getDescription(),
              teamLogo, // ✅ SYNCED: Team logo assigned based on team
              icon: mappedType === "goal" ? "⚽"
                : mappedType === "og" ? "⚽"
                : mappedType === "yellow_card" ? "🟨"
                : mappedType === "red_card" ? "🟥"
                : mappedType === "yellow_red_card" ? "🟨🟥"
                : mappedType === "substitution" ? "🔄"
                : mappedType === "substitution_out" ? "🔄"
                : mappedType === "penalty" ? "🥅"
                : mappedType === "penalty_missed" ? "❌"
                : mappedType === "corner" ? "🚩"
                : mappedType === "var" ? "📹"
                : mappedType === "injury" ? "🤕"
                : mappedType === "shot_on" ? "🎯"
                : mappedType === "shot_off" ? "📤"
                : "📢",
              timestamp: new Date(),
            };
          });

        setRealTimeEvents(formattedEvents);
        onEventsUpdate?.(formattedEvents);
        setLastFetchTime(new Date());
        console.log(
          `✅ Real key events loaded: ${formattedEvents.length} events`,
        );
      } else {
        console.log(
          "⚠️ No key events available from API, using provided events",
        );
        setRealTimeEvents(
          events.filter((e) =>
            [
              "goal",
              "og",
              "own_goal",
              "yellow_card",
              "red_card",
              "yellow_red_card",
              "substitution",
              "substitution_in",
              "substitution_out",
              "corner",
              "penalty",
              "penalty_scored",
              "penalty_missed",
              "var",
              "injury",
              "shot_on",
              "shot_on_target",
              "shot_off",
              "shot_off_target",
              "assist", // ✅ Include assists
            ].includes(e.type),
          ),
        );
      }
    } catch (error) {
      console.error("Error fetching real key events:", error);
      // Fallback to provided events with comprehensive filter
      setRealTimeEvents(
        events.filter((e) =>
          [
            "goal",
            "og",
            "own_goal",
            "yellow_card",
            "red_card",
            "yellow_red_card",
            "substitution",
            "substitution_in",
            "substitution_out",
            "corner",
            "penalty",
            "penalty_scored",
            "penalty_missed",
            "var",
            "injury",
            "shot_on",
            "shot_on_target",
            "shot_off",
            "shot_off_target",
            "assist", // ✅ Include assists
          ].includes(e.type),
        ),
      );
    } finally {
      setIsRefreshing(false);
    }
  }, [matchId, isLive, homeTeamName, awayTeamName, homeTeamLogo, awayTeamLogo, onEventsUpdate, events]);

  // ✅ Auto-refresh for live matches - 100% API-DRIVEN
  // Fetches fresh event data every 45 seconds to stay synced with API
  // Timer comes from parent (match-details-main → LiveTab → KeyEvents → here)
  useEffect(() => {
    if (isLive && matchId) {
      console.log(`🔄 [KEY EVENTS] Starting auto-refresh for match ${matchId}`);
      console.log(`   Timer synced from parent: ${currentMinute}'`);
      fetchRealKeyEventsData();

      // Set up interval for live updates every 45 seconds
      const interval = setInterval(() => {
        console.log(`🔄 [KEY EVENTS] Auto-refreshing events (timer: ${currentMinute}')`);
        fetchRealKeyEventsData();
      }, 45000);

      return () => {
        console.log(`🛑 [KEY EVENTS] Stopping auto-refresh for match ${matchId}`);
        clearInterval(interval);
      };
    }
  }, [isLive, matchId, fetchRealKeyEventsData]);

  // Update real-time events when props change
  useEffect(() => {
    if (!isLive) {
      setRealTimeEvents(
        events.filter((e) =>
          [
            "goal",
            "og",
            "own_goal",
            "yellow_card",
            "red_card",
            "yellow_red_card",
            "substitution",
            "substitution_in",
            "substitution_out",
            "corner",
            "penalty",
            "penalty_scored",
            "penalty_missed",
            "var",
            "injury",
            "shot_on",
            "shot_on_target",
            "shot_off",
            "shot_off_target",
            "assist", // ✅ Include assists
          ].includes(e.type),
        ),
      );
    }
  }, [events, isLive]);

  // Filter for key events only (non-commentary events)
  // Sort chronologically: earliest events at top, latest at bottom
  let keyEvents = realTimeEvents.sort((a, b) => a.minute - b.minute);
  
  // 🔍 DEBUG: Log filtering
  console.log("🔍 [KEY EVENTS] Before filtering:", {
    realTimeEventsCount: realTimeEvents.length,
    eventTypes: realTimeEvents.map(e => e.type),
  });
  
  // Apply "only goals" filter if enabled
  if (showOnlyGoals) {
    keyEvents = keyEvents.filter((e) => e.type === "goal");
    console.log("🔍 [KEY EVENTS] After goals filter:", keyEvents.length);
  }
  
  console.log("🔍 [KEY EVENTS] Final display count:", keyEvents.length);

  // ✅ Map event icons based on API event type - 100% API-DRIVEN
  // Icons are determined by the event.type field from API response
  // Supports ALL event types: goals, cards, subs, penalties, corners, VAR, etc.
  const getEventIcon = (event: LiveEvent): string => {
    if (event.icon) return event.icon;

    const iconMap: { [key: string]: string } = {
      goal: "⚽",
      yellow_card: "🟨",
      red_card: "🟥",
      corner: "🚩",
      substitution: "🔄",
      penalty: "🥅",
    };

    return iconMap[event.type] || "📢";
  };

  // ✅ SYNCED: Icon mapping matches LiveCommentary - checks both type AND description
  // Get icon image source based on event type - comprehensive mapping for ALL football events
  const getEventIconImage = (type: string, description?: string) => {
    const typeStr = type?.toLowerCase() || "";
    const descStr = description?.toLowerCase() || "";
    
    console.log(`🎯 [KEY EVENTS ICON] Type: "${type}", Description: "${description}"`);
    
    // ============================================
    // CRITICAL: Check specific events BEFORE general ones
    // Order matters to prevent mismatches!
    // ============================================
    
    // 1. YELLOW-RED CARD (Second Yellow = Red) - Check FIRST
    if ((typeStr.includes("yellow") && typeStr.includes("red")) || 
        typeStr === "yellow_red_card" ||
        typeStr === "second yellow" ||
        (typeStr === "card" && (descStr.includes("second yellow") || (descStr.includes("yellow") && descStr.includes("red"))))) {
      console.log(`✅ Icon: yell_red.png`);
      return require("@/assets/matchIcons/yell_red.png");
    }
    
    // 2. RED CARD (Direct Red) - Check before yellow
    if ((typeStr.includes("red") && !typeStr.includes("yellow")) || 
        typeStr === "red_card" ||
        (typeStr === "card" && descStr.includes("red") && !descStr.includes("yellow") && !descStr.includes("second"))) {
      console.log(`✅ Icon: red.png`);
      return require("@/assets/matchIcons/red.png");
    }
    
    // 3. YELLOW CARD (Individual Yellow)
    if ((typeStr.includes("yellow") && !typeStr.includes("red")) || 
        typeStr === "yellow_card" ||
        (typeStr === "card" && descStr.includes("yellow") && !descStr.includes("red") && !descStr.includes("second"))) {
      console.log(`✅ Icon: yellow.png`);
      return require("@/assets/matchIcons/yellow.png");
    }
    
    // 4. OWN GOAL - Check before normal goal
    if ((typeStr.includes("own") && typeStr.includes("goal")) || 
        typeStr === "og" ||
        descStr.includes("own goal")) {
      console.log(`✅ Icon: og.png`);
      return require("@/assets/matchIcons/og.png");
    }
    
    // 5. NORMAL GOAL
    if (typeStr === "goal" || typeStr.includes("normal goal") || descStr.includes("goal")) {
      console.log(`✅ Icon: goal.png`);
      return require("@/assets/matchIcons/goal.png");
    }
    
    // 6. PENALTY MISSED
    if ((typeStr.includes("miss") || descStr.includes("miss")) && 
        (typeStr.includes("pen") || descStr.includes("penalty"))) {
      console.log(`✅ Icon: pen_missed.png`);
      return require("@/assets/matchIcons/pen_missed.png");
    }
    
    // 7. PENALTY SCORED
    if (typeStr === "penalty" || typeStr.includes("penalty") || descStr.includes("penalty")) {
      console.log(`✅ Icon: pen_in.png`);
      return require("@/assets/matchIcons/pen_in.png");
    }
    
    // 8. SUBSTITUTION OUT (Player leaving)
    if (typeStr === "substitution_out" || 
        typeStr.includes("subst out") ||
        descStr.includes("off:") || 
        descStr.includes("substituted out")) {
      console.log(`✅ Icon: player_out.png`);
      return require("@/assets/matchIcons/player_out.png");
    }
    
    // 9. SUBSTITUTION IN (Player entering)
    if (typeStr.includes("subst") || 
        typeStr === "substitution" || 
        typeStr === "substitution_in" ||
        descStr.includes("substitution") ||
        descStr.includes("on:")) {
      console.log(`✅ Icon: player_in.png`);
      return require("@/assets/matchIcons/player_in.png");
    }
    
    // 10. SHOT ON TARGET
    if (typeStr.includes("shot") && (typeStr.includes("on") || descStr.includes("on target"))) {
      console.log(`✅ Icon: shot_on.png`);
      return require("@/assets/matchIcons/shot_on.png");
    }
    
    // 11. SHOT OFF TARGET
    if (typeStr.includes("shot") && (typeStr.includes("off") || descStr.includes("off target"))) {
      console.log(`✅ Icon: shot_off.png`);
      return require("@/assets/matchIcons/shot_off.png");
    }
    
    // 12. CORNER KICK
    if (typeStr.includes("corner") || descStr.includes("corner")) {
      console.log(`✅ Icon: corner.png`);
      return require("@/assets/matchIcons/corner.png");
    }
    
    // 13. ASSIST (for goals)
    if (typeStr.includes("assist") || descStr.includes("assist")) {
      console.log(`✅ Icon: assist.png`);
      return require("@/assets/matchIcons/assist.png");
    }
    
    // 14. INJURY
    if (typeStr.includes("injury") || descStr.includes("injury") || descStr.includes("injured")) {
      console.log(`✅ Icon: injury.png`);
      return require("@/assets/matchIcons/injury.png");
    }
    
    // 15. VAR DECISION
    if (typeStr.includes("var") || descStr.includes("var") || descStr.includes("video review")) {
      console.log(`✅ Icon: var.png`);
      return require("@/assets/matchIcons/var.png");
    }
    
    // 16. DEFAULT FALLBACK - Use goal icon as neutral fallback
    console.warn(`⚠️ [KEY EVENTS] Unknown event type: "${type}", description: "${description}" - using goal.png as fallback`);
    return require("@/assets/matchIcons/goal.png");
  };

  const getEventTypeColor = (type: string): string => {
    const colorMap: { [key: string]: string } = {
      goal: "#4CAF50",
      yellow_card: "#FFC107",
      red_card: "#F44336",
      corner: "#2196F3",
      substitution: "#9C27B0",
      penalty: "#FF5722",
    };

    return colorMap[type] || theme.colors.textSecondary;
  };

  // ✅ SYNCED: Consistent time formatting with LiveCommentary
  // Format: "0'" for <= 0, "90+X'" for >= 90, "X'" otherwise
  const formatTime = (minute: number): string => {
    if (minute <= 0) return "0'";
    if (minute >= 90) {
      const added = minute - 90;
      return `90+${added}'`;
    }
    return `${minute}'`;
  };

  // Render event with central timeline layout (like Chinese app)
  const renderEventItem = (event: LiveEvent, index: number) => {
    const isHomeTeam = event.team === "home";
    const isLastItem = index === keyEvents.length - 1;
    
    // ✅ Check if this is a substitution event - show BOTH icons together
    const isSubstitution = event.type?.toLowerCase().includes("subst") || 
                           event.type?.toLowerCase().includes("substitution") ||
                           event.type === "substitution_in" ||
                           event.type === "substitution_out" ||
                           event.description?.toLowerCase().includes("substitution") ||
                           event.description?.toLowerCase().includes("replaced");

    return (
      <View key={event.id} style={styles.timelineRow}>
        {/* LEFT SIDE - Home Team Events */}
        <View style={styles.leftEventContainer}>
          {isHomeTeam && (
            <View style={[styles.eventCard, { backgroundColor: theme.colors.backgroundSecondary }]}>
              {/* Icon and player name - icon near timeline */}
              <View style={[styles.eventContentRow, styles.homeTeamRow]}>
                {event.player && (
                  <Text
                    style={[
                      styles.eventPlayerName,
                      { color: theme.colors.text },
                    ]}
                  >
                    {event.player}
                  </Text>
                )}

                {/* ✅ Event icon(s) on RIGHT for home team (near timeline) */}
                {isSubstitution ? (
                  // ✅ Show BOTH substitution icons together (twins) - NO space between them
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 0 }}>
                    <Image
                      source={require("@/assets/matchIcons/player_out.png")}
                      style={[styles.eventCardIcon, { marginRight: -2 }]} // ✅ Overlap by 2px
                      resizeMode="contain"
                    />
                    <Image
                      source={require("@/assets/matchIcons/player_in.png")}
                      style={[styles.eventCardIcon, { marginLeft: -2 }]} // ✅ Overlap by 2px for compact display
                      resizeMode="contain"
                    />
                  </View>
                ) : (
                  <Image
                    source={getEventIconImage(event.type, event.description)}
                    style={styles.eventCardIcon}
                    resizeMode="contain"
                  />
                )}
              </View>
              
              {/* Event description for all event types */}
              {event.description && (
                <View style={styles.descriptionRow}>
                  {event.type === "goal" && event.description.includes("Assist") && (
                    <Image
                      source={require("@/assets/matchIcons/assist.png")}
                      style={styles.descriptionIcon}
                      resizeMode="contain"
                    />
                  )}
                  <Text
                    style={[
                      styles.descriptionText,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    {event.description}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* CENTER - Timeline */}
        <View style={styles.centerTimeline}>
          {/* Time marker - positioned at player name level */}
          <View style={styles.timeMarkerContainer}>
            <Text
              style={[
                styles.timeMarkerText,
                { 
                  color: theme.colors.textSecondary,
                  backgroundColor: theme.colors.backgroundSecondary,
                },
              ]}
            >
              {formatTime(event.minute)}
            </Text>
          </View>

          {/* Connecting line - no dot, just continuous line */}
          <View
            style={[
              styles.timelineConnector,
              { backgroundColor: theme.colors.border },
            ]}
          />
        </View>

        {/* RIGHT SIDE - Away Team Events */}
        <View style={styles.rightEventContainer}>
          {!isHomeTeam && (
            <View style={[styles.eventCard, { backgroundColor: theme.colors.backgroundSecondary }]}>
              {/* Icon and player name - icon near timeline */}
              <View style={[styles.eventContentRow, styles.awayTeamRow]}>
                {/* ✅ Event icon(s) on LEFT for away team (near timeline) */}
                {isSubstitution ? (
                  // ✅ Show BOTH substitution icons together (twins) - NO space between them
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 0 }}>
                    <Image
                      source={require("@/assets/matchIcons/player_out.png")}
                      style={[styles.eventCardIcon, { marginRight: -2 }]} // ✅ Overlap by 2px
                      resizeMode="contain"
                    />
                    <Image
                      source={require("@/assets/matchIcons/player_in.png")}
                      style={[styles.eventCardIcon, { marginLeft: -2 }]} // ✅ Overlap by 2px for compact display
                      resizeMode="contain"
                    />
                  </View>
                ) : (
                  <Image
                    source={getEventIconImage(event.type, event.description)}
                    style={styles.eventCardIcon}
                    resizeMode="contain"
                  />
                )}

                {event.player && (
                  <Text
                    style={[
                      styles.eventPlayerName,
                      { color: theme.colors.text },
                    ]}
                  >
                    {event.player}
                  </Text>
                )}
              </View>
              
              {/* Event description for all event types */}
              {event.description && (
                <View style={styles.descriptionRow}>
                  {event.type === "goal" && event.description.includes("Assist") && (
                    <Image
                      source={require("@/assets/matchIcons/assist.png")}
                      style={styles.descriptionIcon}
                      resizeMode="contain"
                    />
                  )}
                  <Text
                    style={[
                      styles.descriptionText,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    {event.description}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    );
  };

  // Render half-time marker with score
  const renderHalfTimeMarker = () => {
    // Calculate actual half-time score by counting goals before minute 46
    const calculateHalfTimeScore = () => {
      let homeGoals = 0;
      let awayGoals = 0;
      
      keyEvents.forEach(event => {
        if (event.type === "goal" && event.minute <= 45) {
          if (event.team === "home") {
            homeGoals++;
          } else {
            awayGoals++;
          }
        }
      });
      
      return { home: homeGoals, away: awayGoals };
    };
    
    // Use provided half-time scores if available, otherwise calculate from events
    const htScore = halfTimeHomeScore !== undefined && halfTimeAwayScore !== undefined
      ? { home: halfTimeHomeScore, away: halfTimeAwayScore }
      : calculateHalfTimeScore();
    
    const htHomeScore = htScore.home;
    const htAwayScore = htScore.away;
    
    return (
      <View key="marker-45" style={styles.specialMarkerRow}>
        <View style={styles.leftEventContainer} />
        <View style={styles.centerTimeline}>
          {/* Timeline connector ends BEFORE the marker card */}
          <View
            style={[{
              width: TIMELINE_WIDTH,
              flex: 1,
              backgroundColor: theme.colors.border,
              opacity: 0.4,
              alignSelf: 'center',
            }]}
          />
          <View style={[styles.specialMarkerCard, { backgroundColor: theme.colors.backgroundSecondary }]}>
            <View style={styles.halfTimeRow}>
              <Text
                style={[styles.specialMarkerText, { color: theme.colors.text }]}
              >
                HT
              </Text>
              <Text
                style={[styles.halfTimeScore, { color: theme.colors.textSecondary }]}
              >
                {htHomeScore} - {htAwayScore}
              </Text>
            </View>
          </View>
          <View
            style={[
              styles.timelineDot,
              { backgroundColor: theme.colors.textSecondary },
            ]}
          />
          {/* Timeline connector starts AFTER the marker card */}
          <View
            style={[{
              width: TIMELINE_WIDTH,
              flex: 1,
              backgroundColor: theme.colors.border,
              opacity: 0.4,
              alignSelf: 'center',
            }]}
          />
        </View>
        <View style={styles.rightEventContainer} />
      </View>
    );
  };

  // Legend removed - icons are self-explanatory and match Chinese app

  const onRefresh = useCallback(() => {
    if (isLive && matchId) {
      fetchRealKeyEventsData();
    }
  }, [isLive, matchId, fetchRealKeyEventsData]);

  // Group events with special markers (match start, half-time, match end)
  const renderEventsWithMarkers = () => {
    const items: React.ReactNode[] = [];
    let hasHalfTime = false;

    // Add match start marker with whistle
    items.push(
      <View key="match-start" style={styles.specialMarkerRow}>
        <View style={styles.leftEventContainer} />
        <View style={styles.centerTimeline}>
          <View style={[styles.matchStartCard, { backgroundColor: theme.colors.backgroundSecondary }]}>
            <WhistleIcon size={18} color="#FF4444" />
            <Text
              style={[styles.matchStartText, { color: theme.colors.text }]}
            >
              Match Begins
            </Text>
          </View>
          {/* Timeline connector starts AFTER the marker card */}
          <View
            style={[{
              width: TIMELINE_WIDTH,
              flex: 1,
              backgroundColor: theme.colors.border,
              opacity: 0.4,
              alignSelf: 'center',
            }]}
          />
        </View>
        <View style={styles.rightEventContainer} />
      </View>
    );

    keyEvents.forEach((event, index) => {
      // Add half-time marker if we cross minute 45
      if (!hasHalfTime && event.minute > 45 && keyEvents[index - 1]?.minute <= 45) {
        items.push(renderHalfTimeMarker());
        hasHalfTime = true;
      }

      items.push(renderEventItem(event, index));
    });

    // Add match end marker if match is finished (using API score with whistle)
    if (!isLive && keyEvents.length > 0) {
      items.push(
        <View key="match-end" style={styles.specialMarkerRow}>
          <View style={styles.leftEventContainer} />
          <View style={styles.centerTimeline}>
            {/* Timeline connector ends BEFORE the marker card */}
            <View
              style={[{
                width: TIMELINE_WIDTH,
                flex: 1,
                backgroundColor: theme.colors.border,
                opacity: 0.4,
                alignSelf: 'center',
              }]}
            />
            <View style={[styles.matchEndCard, { backgroundColor: theme.colors.backgroundSecondary }]}>
              <View style={styles.matchEndRow}>
                <Text
                  style={[styles.matchEndText, { color: theme.colors.text }]}
                >
                  Match Ends
                </Text>
                <Text
                  style={[styles.matchScoreText, { color: theme.colors.primary }]}
                >
                  {homeScore} - {awayScore}
                </Text>
                <WhistleIcon size={18} color="#FF4444" />
              </View>
            </View>
          </View>
          <View style={styles.rightEventContainer} />
        </View>
      );
    }

    return items;
  };

  return (
    <View style={styles.container}>
      {/* Toggle Filter - Only Show Goals */}
      <View
        style={[
          styles.filterContainer,
        ]}
      >
        <Text style={[styles.filterLabel, { color: theme.colors.text }]}>
          Only Show Goals
        </Text>
        <TouchableOpacity
          style={[
            styles.toggleSwitch,
            {
              backgroundColor: showOnlyGoals
                ? theme.colors.primary
                : theme.colors.border,
            },
          ]}
          onPress={() => setShowOnlyGoals(!showOnlyGoals)}
          activeOpacity={0.8}
        >
          <View
            style={[
              styles.toggleThumb,
              {
                backgroundColor: "#FFFFFF",
                transform: [{ translateX: showOnlyGoals ? 20 : 2 }],
              },
            ]}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={onRefresh}
            tintColor="transparent"
            colors={["transparent"]}
          />
        }
      >
        {keyEvents.length === 0 ? (
          <View style={styles.noEventsContainer}>
            <Text
              style={[
                styles.noEventsText,
                { color: theme.colors.textSecondary },
              ]}
            >
              {isLive ? "⏳ No key events yet" : "📭 No key events"}
            </Text>
          </View>
        ) : (
          <>
            {renderEventsWithMarkers()}

            {/* Real Data Attribution */}
            <View style={styles.dataAttribution}>
              <Text
                style={[
                  styles.attributionText,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {isLive
                  ? "⭐ Live events from API-Football"
                  : "📊 Match events from API-Football"}
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 8,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  noEventsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  noEventsText: {
    fontSize: 14,
    textAlign: "center",
    fontFamily: "Inter-Regular",
  },

  // Timeline Layout (Chinese App Style)
  timelineRow: {
    flexDirection: "row",
    alignItems: "flex-start",  // Align to top for precise positioning
    paddingVertical: 6,
    minHeight: 65,
  },
  leftEventContainer: {
    flex: 1,
    alignItems: "flex-end",
    paddingRight: 8,
    justifyContent: "flex-start",  // Align to top
  },
  centerTimeline: {
    width: 60,
    alignItems: "center",
    position: "relative",
    minHeight: 65,
  },
  rightEventContainer: {
    flex: 1,
    alignItems: "flex-start",
    paddingLeft: 8,
    justifyContent: "flex-start",  // Align to top
  },

  // Time Marker - positioned at exact icon level
  timeMarkerContainer: {
    marginBottom: 0,  // No margin - align exactly with icons
    zIndex: 10,
    backgroundColor: "transparent",
    paddingVertical: 0,
  },
  timeMarkerText: {
    fontSize: 13,
    fontWeight: "bold",
    fontFamily: "Inter-Bold",
    lineHeight: 20,  // Match icon height for perfect alignment
    // backgroundColor removed - now set inline with theme
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },

  // Timeline Dot
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    zIndex: 2,
  },

  // Timeline Connector
  timelineConnector: {
    width: TIMELINE_WIDTH,
    position: "absolute",
    top: 22,  // Start after time marker (aligned with new positioning)
    bottom: -6,
    left: "50%",
    marginLeft: -1,
    opacity: 0.4,  // Subtle line like Chinese app
  },

  // Filter Controls
  filterContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(128, 128, 128, 0.2)",
    gap: 12,
  },
  filterLabel: {
    fontSize: 14,
    fontFamily: "Inter-Medium",
  },
  toggleSwitch: {
    width: 44,
    height: 24,
    borderRadius: 12,
    padding: 2,
    justifyContent: "center",
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },

  // Event Card (Home & Away) - Extended width and better positioning
  eventCard: {
    // backgroundColor removed - now set inline with theme
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    minWidth: "92%",  // Much wider - near screen edges like Chinese app
    flexDirection: "column",
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
    marginTop: -10,  // Shift ONLY the background block upward to align icons with time
  },
  eventContentRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 22,  // Match icon size for perfect alignment
  },
  homeTeamRow: {
    justifyContent: "flex-end",  // Push content (icon) to RIGHT edge for home team
  },
  awayTeamRow: {
    justifyContent: "flex-start",  // Keep content (icon) at LEFT edge for away team
  },
  playerNameContainer: {
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  eventCardIcon: {
    width: 22,
    height: 22,
  },
  eventPlayerName: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter-SemiBold",
    lineHeight: 20,
    flexShrink: 1,
    letterSpacing: 0.3,  // Better readability
  },
  eventDescription: {
    fontSize: 11,
    fontFamily: "Inter-Regular",
    marginTop: 4,
  },
  
  // Description row (for all event descriptions)
  descriptionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
    paddingLeft: 2,
  },
  descriptionIcon: {
    width: 22,
    height: 22,
    opacity: 0.8,
  },
  descriptionText: {
    fontSize: 13,
    fontFamily: "Inter-Regular",
    flex: 1,
    opacity: 0.9,
    lineHeight: 20,
    marginTop: 2,
  },

  // Special Markers (Half-time, etc.)
  specialMarkerRow: {
    flexDirection: "row",
    minHeight: 55,
    paddingVertical: 10,
  },
  specialMarkerCard: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 4,  // Add gap above card so line doesn't enter
    marginBottom: 4,  // Add gap below card so line doesn't enter
    // backgroundColor removed - now set inline with theme
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 2,
  },
  specialMarkerText: {
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "Inter-SemiBold",
  },
  
  // Match Start Marker
  matchStartCard: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 4,  // Add gap above card so line doesn't enter
    marginBottom: 4,  // Add gap below card so line doesn't enter
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    // backgroundColor removed - now set inline with theme
    minWidth: 150,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 2,
  },
  matchStartText: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter-SemiBold",
    letterSpacing: 0.3,
  },
  
  // Half-time Marker with Score
  halfTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  halfTimeScore: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter-SemiBold",
  },
  
  // Match End Marker
  matchEndCard: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 4,  // Add gap above card so line doesn't enter
    marginBottom: 4,  // Add gap below card so line doesn't enter
    // backgroundColor removed - now set inline with theme
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 2,
  },
  matchEndRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  matchEndText: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter-SemiBold",
    letterSpacing: 0.3,
  },
  matchScoreText: {
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: "Inter-Bold",
    letterSpacing: 0.5,
  },

  // Data Attribution
  dataAttribution: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
  },
  attributionText: {
    fontSize: 11,
    fontFamily: "Inter-Regular",
    textAlign: "center",
  },
});
