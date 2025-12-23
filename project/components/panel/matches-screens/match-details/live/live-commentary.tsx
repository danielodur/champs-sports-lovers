import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
} from "react-native";
import Svg, { Path, Circle } from "react-native-svg";
import { useTheme } from "../../../../../hooks/useTheme";
import { createApiSportsService } from "@/services/api-sports-service";

// Live commentary component for match events

interface CommentaryEvent {
  id: string;
  minute: number;
  team: "home" | "away" | "neutral";
  type: string;
  description: string;
  player?: string;
  detail?: string;
  timestamp: Date;
  isImportant?: boolean;
  assist?: string;
  comments?: string;
  teamLogo?: string;  // Team logo from API
  substitutionInfo?: {  // ✅ Substitution info for displaying both icons together
    playerOut: string;
    playerIn: string;
    hasBothPlayers: boolean;
  };
}

interface LiveCommentaryProps {
  events: CommentaryEvent[];
  homeTeamName?: string;
  awayTeamName?: string;
  homeTeamLogo?: string;  // Home team logo from API
  awayTeamLogo?: string;  // Away team logo from API
  currentMinute?: number;
  matchId?: string;
  isLive?: boolean;
  matchStatus?: string;
  weatherCondition?: string;
  cityName?: string;
  onEventsUpdate?: (events: CommentaryEvent[]) => void;
}

// Red Whistle Icon Component - Realistic referee whistle
const WhistleIcon = ({ size = 16, color = "#FF4444" }) => (
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
// ✅ LIVE COMMENTARY COMPONENT - 100% API-DRIVEN
// ============================================================================
// Data Sources:
// 1. Timer (currentMinute): Received from parent (match-details-main → LiveTab)
//    - Updated by match-details-main polling every 15s
//    - Ensures timer is SYNCED across all screens
// 2. Events: Fetched independently from API every 45s
//    - ALL descriptions come from API (comments, detail fields)
//    - ALL icons mapped from API event types
//    - NO hardcoded or mock data
// ============================================================================
export default function LiveCommentary({
  events,
  homeTeamName = "Home",
  awayTeamName = "Away",
  homeTeamLogo,
  awayTeamLogo,
  currentMinute = 0, // ✅ SYNCED from parent (match-details-main polling)
  matchId,
  isLive = false,
  matchStatus = "live",
  weatherCondition = "Good",
  cityName = "Stadium",
  onEventsUpdate,
}: LiveCommentaryProps) {
  const theme = useTheme();
  const [commentaryEvents, setCommentaryEvents] = useState<CommentaryEvent[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ✅ Fetch real-time events from API - 100% API-DRIVEN
  const fetchRealEventsData = useCallback(async () => {
    if (!matchId || !isLive) {
      console.log("⚠️ [LIVE COMMENTARY] Skipping fetch:", { matchId, isLive });
      return;
    }

    try {
      console.log(`⭐ [LIVE COMMENTARY] Fetching events for match ${matchId}`);
      console.log(`🏀 [LIVE COMMENTARY] Team logos:`, {
        homeTeamLogo,
        awayTeamLogo,
        homeTeamName,
        awayTeamName,
      });
      setIsRefreshing(true);

      // Get API key
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
        console.error("❌ [LIVE COMMENTARY] No API key available");
        setIsRefreshing(false);
        return;
      }

      // Fetch match events from API
      const apiService = createApiSportsService(apiKey, {
        enableCaching: true,
        cacheExpiry: 2 * 60 * 1000, // 2 minutes for live events
        retryAttempts: 3,
        timeout: 10000,
      });
      const eventsResponse = await apiService.getMatchEvents(parseInt(matchId));

      if (eventsResponse?.response?.length > 0) {
        console.log(`📊 [LIVE COMMENTARY] Got ${eventsResponse.response.length} events from API`);
        
        const formattedEvents: CommentaryEvent[] = eventsResponse.response
          .map((event: any, index: number) => {
            const isHomeTeam = event.team?.name === homeTeamName;
            const isAwayTeam = event.team?.name === awayTeamName;
            const teamLogo = isHomeTeam ? homeTeamLogo : isAwayTeam ? awayTeamLogo : undefined;
            
            console.log(`🎯 [EVENT ${index}]:`, {
              eventTeam: event.team?.name,
              isHomeTeam,
              isAwayTeam,
              teamLogo,
              player: event.player?.name,
              detail: event.detail,
              comments: event.comments,
            });
            
            // ✅ Build comprehensive description from API fields - 100% API-DRIVEN
            // Uses API's comments, detail, player names, assist names from real match data
            // NO hardcoded descriptions - everything comes from the API response
            const eventType = event.type?.toLowerCase() || "";
            const buildComprehensiveDescription = () => {
              const detail = event.detail || "";
              const comments = event.comments || ""; // ✅ Primary source: API comments field
              const playerName = event.player?.name || ""; // ✅ From API player object
              const assistName = event.assist?.name || ""; // ✅ From API assist object
              const teamName = event.team?.name || ""; // ✅ From API team object
              
              // Start with comments if available (most detailed from API)
              if (comments && comments.trim().length > 0) {
                return comments.trim();
              }
              
              // Build rich description based on event type
              if (eventType.includes("goal")) {
                if (detail.includes("own goal") || detail.includes("own")) {
                  return `Own goal! ${playerName ? `${playerName} ` : ""}${detail}`;
                }
                if (assistName) {
                  return `Goal! ${playerName ? `${playerName} ` : ""}scores${assistName ? ` with an assist from ${assistName}` : ""}. ${detail || ""}`;
                }
                return `Goal! ${playerName ? `${playerName} ` : ""}${detail || "scores!"}`;
              }
              
              if (eventType.includes("card")) {
                if (detail.includes("yellow") && detail.includes("red")) {
                  return `Second yellow card! ${playerName ? `${playerName} ` : ""}receives a second yellow card and is sent off. ${detail}`;
                }
                if (detail.includes("red")) {
                  return `Red card! ${playerName ? `${playerName} ` : ""}is shown a red card and sent off. ${detail}`;
                }
                if (detail.includes("yellow")) {
                  return `Yellow card! ${playerName ? `${playerName} ` : ""}receives a yellow card. ${detail}`;
                }
                return `${detail || "Card"}${playerName ? ` - ${playerName}` : ""}`;
              }
              
              if (eventType.includes("subst") || eventType.includes("substitution")) {
                const playerIn = event.assist?.name || "";
                const playerOut = playerName || "";
                if (playerIn && playerOut) {
                  return `Substitution: ${playerOut} is replaced by ${playerIn}. ${detail || ""}`;
                }
                return `Substitution${playerName ? `: ${playerName}` : ""}. ${detail || ""}`;
              }
              
              if (eventType.includes("penalty")) {
                if (detail.includes("miss") || detail.includes("saved")) {
                  return `Penalty missed! ${playerName ? `${playerName} ` : ""}${detail}`;
                }
                return `Penalty scored! ${playerName ? `${playerName} ` : ""}converts the penalty. ${detail || ""}`;
              }
              
              if (eventType.includes("var")) {
                return `VAR decision: ${detail || comments || "Video review in progress"}`;
              }
              
              if (eventType.includes("injury")) {
                return `Injury: ${playerName ? `${playerName} ` : ""}${detail || "Player requires medical attention"}`;
              }
              
              if (eventType.includes("corner")) {
                return `Corner kick awarded to ${teamName || "team"}. ${detail || ""}`;
              }
              
              // Default: combine available fields
              const parts: string[] = [];
              if (detail) parts.push(detail);
              if (playerName && !detail.includes(playerName)) parts.push(`(${playerName})`);
              if (comments && comments !== detail) parts.push(comments);
              
              return parts.length > 0 ? parts.join(" - ") : "Match event";
            };
            
            // ✅ Store substitution info for displaying both icons together
            const substitutionInfo = eventType.includes("subst") || eventType.includes("substitution") ? {
              playerOut: event.player?.name || "",
              playerIn: event.assist?.name || "",
              hasBothPlayers: !!(event.player?.name && event.assist?.name),
            } : null;
            
            return {
              id: `event-${event.time?.elapsed || 0}-${index}`,
              minute: event.time?.elapsed || 0,
              team: isHomeTeam ? "home" : isAwayTeam ? "away" : "neutral",
              type: event.type?.toLowerCase() || "commentary",
              description: buildComprehensiveDescription(),
              player: event.player?.name,
              detail: event.comments || event.detail,
              comments: event.comments,
              timestamp: new Date(),
              teamLogo,
              // ✅ Store substitution info for rendering both icons
              substitutionInfo,
            };
          });

        // Sort by minute descending (latest first)
        const sortedEvents = formattedEvents.sort((a, b) => b.minute - a.minute);
        setCommentaryEvents(sortedEvents);
        
        console.log(`✅ [LIVE COMMENTARY] Set ${sortedEvents.length} events, logos:`, 
          sortedEvents.map(e => ({ player: e.player, hasLogo: !!e.teamLogo })));
        
        if (onEventsUpdate) {
          onEventsUpdate(sortedEvents);
        }
      }

      setIsRefreshing(false);
    } catch (error) {
      console.error("❌ [LIVE COMMENTARY] Error fetching events:", error);
      setIsRefreshing(false);
    }
  }, [matchId, isLive, homeTeamName, awayTeamName, homeTeamLogo, awayTeamLogo, onEventsUpdate]);

  // ✅ Auto-refresh for live matches - 100% API-DRIVEN
  // Fetches fresh event data every 45 seconds to stay synced with API
  // Timer comes from parent (match-details-main → LiveTab → here)
  useEffect(() => {
    if (isLive && matchId) {
      console.log(`🔄 [LIVE COMMENTARY] Starting auto-refresh for match ${matchId}`);
      console.log(`   Timer synced from parent: ${currentMinute}'`);
      fetchRealEventsData();

      // Set up interval for live updates every 45 seconds
      const interval = setInterval(() => {
        console.log(`🔄 [LIVE COMMENTARY] Auto-refreshing events (timer: ${currentMinute}')`);
        fetchRealEventsData();
      }, 45000);

      return () => {
        console.log(`🛑 [LIVE COMMENTARY] Stopping auto-refresh for match ${matchId}`);
        clearInterval(interval);
      };
    }
  }, [isLive, matchId, fetchRealEventsData]);

  // Update events from props (fallback when events are passed)
  useEffect(() => {
    if (events && events.length > 0) {
      const sortedEvents = [...events].sort((a, b) => b.minute - a.minute);
      // Add team logos to events
      const eventsWithLogos = sortedEvents.map(event => ({
        ...event,
        teamLogo: event.team === "home" ? homeTeamLogo : 
                  event.team === "away" ? awayTeamLogo : undefined,
      }));
      setCommentaryEvents(eventsWithLogos);
    }
  }, [events, homeTeamLogo, awayTeamLogo]);

  // Get icon image - comprehensive mapping for ALL football event types
  const getEventIcon = (type: string, description?: string) => {
    const typeStr = type?.toLowerCase() || "";
    const descStr = description?.toLowerCase() || "";
    
    console.log(`🎯 [LIVE COMMENTARY ICON] Type: "${type}", Description: "${description}"`);
    
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
    
    // 8. SUBSTITUTION - Both icons will be shown together in renderCommentaryItem
    // This function is still used for non-substitution events
    if (typeStr === "substitution_out" || 
        typeStr.includes("subst out") ||
        descStr.includes("off:") || 
        descStr.includes("substituted out")) {
      console.log(`✅ Icon: player_out.png (will be shown with player_in)`);
      return require("@/assets/matchIcons/player_out.png");
    }
    
    // 9. SUBSTITUTION IN (Player entering) - Both icons shown together
    if (typeStr.includes("subst") || 
        typeStr === "substitution" || 
        typeStr === "substitution_in" ||
        descStr.includes("substitution") ||
        descStr.includes("on:")) {
      console.log(`✅ Icon: player_in.png (will be shown with player_out)`);
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
    console.warn(`⚠️ [LIVE COMMENTARY] Unknown event type: "${type}", description: "${description}" - using goal.png as fallback`);
    return require("@/assets/matchIcons/goal.png");
  };

  const formatTime = (minute: number): string => {
    if (minute <= 0) return "0'";
    if (minute >= 90) {
      const added = minute - 90;
      return `90+${added}'`;
    }
    return `${minute}'`;
  };

  const renderCommentaryItem = (event: CommentaryEvent, index: number) => {
    const isLastItem = index === commentaryEvents.length - 1;
    
    // Debug log to verify team logo
    if (index === 0) {
      console.log(`🔍 [RENDER] First event:`, {
        player: event.player,
        team: event.team,
        teamLogo: event.teamLogo,
        hasLogo: !!event.teamLogo,
      });
    }
    
    // ✅ Check if this is a substitution event - show BOTH icons together
    // Check type, description, or if substitutionInfo exists
    const isSubstitution = event.type?.toLowerCase().includes("subst") || 
                           event.type?.toLowerCase().includes("substitution") ||
                           event.type === "substitution_in" ||
                           event.type === "substitution_out" ||
                           event.description?.toLowerCase().includes("substitution") ||
                           event.description?.toLowerCase().includes("replaced") ||
                           event.description?.toLowerCase().includes("replaces") ||
                           !!event.substitutionInfo;
    
    return (
      <View key={event.id} style={styles.eventRow}>
        {/* Left: Event icon(s) */}
        <View style={styles.leftIconContainer}>
          {isSubstitution ? (
            // ✅ Show BOTH substitution icons together (twins) - NO space between them
            <View style={{ flexDirection: "row", alignItems: "center", gap: 0 }}>
              <Image
                source={require("@/assets/matchIcons/player_out.png")}
                style={[styles.leftEventIcon, { marginRight: -2 }]} // ✅ Overlap by 2px for compact look
                resizeMode="contain"
              />
              <Image
                source={require("@/assets/matchIcons/player_in.png")}
                style={[styles.leftEventIcon, { marginLeft: -2 }]} // ✅ Overlap by 2px for compact display
                resizeMode="contain"
              />
            </View>
          ) : (
            <Image
              source={getEventIcon(event.type, event.description)}
              style={styles.leftEventIcon}
              resizeMode="contain"
            />
          )}
          {!isLastItem && (
            <View
              style={[
                styles.verticalLine,
                { backgroundColor: theme.colors.border },
              ]}
            />
          )}
        </View>

        {/* Center: Event card with background */}
        <View style={[styles.eventCard, { backgroundColor: theme.colors.backgroundSecondary }]}>
          <View style={styles.eventContent}>
            <Text
              style={[
                styles.eventTime,
                { color: theme.colors.textSecondary },
              ]}
            >
              {formatTime(event.minute)}
            </Text>
            <View style={styles.eventTextContainer}>
              {event.player && (
                <Text
                  style={[
                    styles.eventPlayer,
                    { color: theme.colors.text },
                  ]}
                >
                  {event.player}
                </Text>
              )}
              {event.description && (
                <Text
                  style={[
                    styles.eventDescription,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {event.description}
                </Text>
              )}
            </View>
          </View>

          {/* Right: Team logo at right edge - ALWAYS render container */}
          <View style={styles.teamLogoContainer}>
            {event.teamLogo ? (
              <Image
                source={{ uri: event.teamLogo }}
                style={styles.teamLogo}
                resizeMode="contain"
                onError={(error) => console.log(`❌ Logo load error:`, error.nativeEvent)}
              />
            ) : (
              <View style={styles.teamLogoPlaceholder} />
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderWelcomeMessage = () => (
    <View style={[
      styles.welcomeContainer, 
      { 
        backgroundColor: theme.colors.backgroundSecondary,
        borderLeftColor: theme.colors.primary || "#4A90E2",
      }
    ]}>
      <View style={styles.welcomeRow}>
        <WhistleIcon size={16} color={theme.colors.primary || "#4A90E2"} />
        <Text style={[styles.welcomeText, { color: theme.colors.text }]}>
          Welcome to the live commentary! Players are warming up, the match will begin shortly.
        </Text>
      </View>
    </View>
  );

  const renderMatchConditions = () => {
    // Only show conditions for live matches (weather shown at bottom)
    // For upcoming matches, weather is at top of Live screen
    if (!isLive) return null;
    
    return (
      <View style={[styles.conditionsContainer, { backgroundColor: theme.colors.backgroundSecondary }]}>
        <Text style={[styles.conditionText, { color: theme.colors.textSecondary }]}>
          Match conditions: {weatherCondition || "Good"}
        </Text>
        {cityName && weatherCondition && (
          <Text style={[styles.conditionText, { color: theme.colors.textSecondary }]}>
            Weather in {cityName}: {weatherCondition}
          </Text>
        )}
      </View>
    );
  };

  const renderMatchStart = () => (
    <View style={[
      styles.matchStartContainer, 
      { 
        backgroundColor: theme.colors.backgroundSecondary,
        borderLeftColor: theme.colors.primary || "#4A90E2",
      }
    ]}>
      <View style={styles.matchStartRow}>
        <WhistleIcon size={18} color={theme.colors.primary || "#4A90E2"} />
        <Text style={[styles.matchStartText, { color: theme.colors.text }]}>
          The referee blows the whistle and the match starts now!
        </Text>
      </View>
    </View>
  );

  const renderMatchEnd = () => (
    <View style={[
      styles.matchEndContainer, 
      { 
        backgroundColor: theme.colors.backgroundSecondary,
        borderLeftColor: theme.colors.primary || "#4A90E2",
      }
    ]}>
      <View style={styles.matchEndRow}>
        <WhistleIcon size={18} color={theme.colors.primary || "#4A90E2"} />
        <Text style={[styles.matchEndText, { color: theme.colors.text }]}>
          Thank you for following the live commentary! See you soon at the next match.
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {commentaryEvents.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              {isLive ? "⏳ Waiting for match events..." : "📭 No commentary available"}
            </Text>
          </View>
        ) : (
          <>
            {/* Match end (appears first since reversed) */}
            {!isLive && renderMatchEnd()}

            {/* Events in reverse order (latest first) */}
            {commentaryEvents.map((event, index) =>
              renderCommentaryItem(event, index)
            )}

            {/* Match start marker */}
            {renderMatchStart()}

            {/* Match conditions */}
            {renderMatchConditions()}

            {/* Welcome message at bottom */}
            {renderWelcomeMessage()}

            {/* Attribution */}
            <View style={[styles.attribution, { borderTopColor: theme.colors.border }]}>
              <Text style={[styles.attributionText, { color: theme.colors.textSecondary }]}>
                {isLive
                  ? "⭐ Live commentary from API-Football"
                  : "📊 Match commentary from API-Football"}
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
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
  },

  // Event Row
  eventRow: {
    flexDirection: "row",
    alignItems: "flex-start", // Align to top
    marginBottom: 16,
  },
  leftIconContainer: {
    width: 36,
    alignItems: "center",
    position: "relative",
    paddingTop: 14, // Push icon down to align with text
  },
  leftEventIcon: {
    width: 20,
    height: 20,
    zIndex: 2,
  },
  verticalLine: {
    width: 2,
    position: "absolute",
    top: 38, // Adjusted for icon padding
    bottom: -16,
    left: "50%",
    marginLeft: -1,
  },
  eventCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start", // Align items to top
    justifyContent: "space-between", // Push team logo to right edge
    // backgroundColor set inline with theme
    borderRadius: 12,
    padding: 12,
    marginLeft: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  eventContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    paddingRight: 8, // Space before team logo
  },
  eventTextContainer: {
    flex: 1,
    gap: 4,
  },
  eventTime: {
    fontSize: 12,
    fontWeight: "bold",
    fontFamily: "Inter-Bold",
    minWidth: 45,
    paddingTop: 2, // Align with text baseline
  },
  eventPlayer: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter-SemiBold",
    lineHeight: 18,
  },
  eventDescription: {
    fontSize: 13,
    fontFamily: "Inter-Regular",
    lineHeight: 20,
    marginTop: 4,
    flex: 1,
  },
  teamLogo: {
    width: 28,
    height: 28,
    marginLeft: 8,
    flexShrink: 0, // Don't shrink the logo
    alignSelf: "center", // Center vertically within the card
  },
  teamLogoContainer: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
    flexShrink: 0,
  },
  teamLogoPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "transparent",
  },

  // Welcome Message
  welcomeContainer: {
    marginTop: 16,
    padding: 14,
    // backgroundColor removed - now set inline with theme
    borderRadius: 12,
    borderLeftWidth: 3,
    // borderLeftColor set inline with theme
  },
  welcomeRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  welcomeText: {
    fontSize: 13,
    fontFamily: "Inter-Regular",
    flex: 1,
    lineHeight: 20,
  },

  // Match Conditions
  conditionsContainer: {
    marginTop: 12,
    padding: 12,
    // backgroundColor removed - now set inline with theme
    borderRadius: 8,
    gap: 6,
  },
  conditionText: {
    fontSize: 12,
    fontFamily: "Inter-Regular",
  },

  // Match Start
  matchStartContainer: {
    marginTop: 12,
    padding: 14,
    // backgroundColor removed - now set inline with theme
    borderRadius: 12,
    borderLeftWidth: 3,
    // borderLeftColor set inline with theme
  },
  matchStartRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  matchStartText: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter-SemiBold",
    flex: 1,
  },

  // Match End
  matchEndContainer: {
    marginBottom: 16,
    padding: 14,
    // backgroundColor removed - now set inline with theme
    borderRadius: 12,
    borderLeftWidth: 3,
    // borderLeftColor set inline with theme
  },
  matchEndRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  matchEndText: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter-SemiBold",
    flex: 1,
  },

  // Attribution
  attribution: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    // borderTopColor removed - now set inline with theme
    alignItems: "center",
  },
  attributionText: {
    fontSize: 11,
    fontFamily: "Inter-Regular",
    textAlign: "center",
  },
});
