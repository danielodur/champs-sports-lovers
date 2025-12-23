// 🚨 AI PROTECTION NOTICE 🚨
// This file is PROTECTED and should NOT be modified without explicit human permission
// Any unauthorized changes will be reverted immediately
// ASK FIRST before making ANY modifications
// Human developer has ultimate authority over this implementation

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Platform,
} from "react-native";
import {
  Star,
  Users,
  Frown,
  ChevronRight,
  PlayCircle,
} from "lucide-react-native";
import { useTheme } from "../../../hooks/useTheme";
import { Match } from "../../../types/match";
import { fetchHotMatches, fetchMatches } from "../../../services/matchService";
import { useFavorites } from "../../../hooks/useFavorites";
import { Fixture } from "../../../types/football-fixtures-response";
import favoritesService from "@/services/favoritesService";
import { formatTeamName } from "../../../utils/formatTeamName";
import goalDetectionService from "../../../services/goalDetectionService";
import { useMatchSettings } from "../../../contexts/MatchSettingsContext";
import teamLogoService from "../../../services/teamLogoService";
import { useRouter } from "expo-router";
import enhancedMatchService, {
  EnhancedMatchData,
} from "../../../services/enhanced-match-service";
import { playGoalSound } from "../../../utils/SoundManager";

import {
  processMatches,
  MatchKeyGenerators,
} from "../../../utils/matchDeduplication";
import {
  smartFormatter,
  getMultiLineTextStyle,
  calculateMatchLayoutDimensions,
} from "../../../utils/teamNameFormatter";
import MatchExtraTime, { isMatchInExtraTime } from "./extra-time/match-extra-time";
import BasketballMatchItem from "./basketball-match-item";
import { convertFixtureToBasketballMatch } from "./basketball-utils";

interface TopLiveMatchesProps {
  sport: string; // ✅ Sport identifier (football, basketball, etc.)
  onFavoritesChange?: () => void;
  onMatchCountChange?: (count: number) => void;
  refreshing?: boolean;
  onRefresh?: () => void;
  headerComponent?: () => React.ReactElement;
  onMatchesLoaded?: (matches: Match[]) => void;
}

interface MatchItemProps {
  fixture: any;
  onToggleFavorite: (matchId: number) => void;
  onPress: (fixture: any) => void;
  sport?: string; // ✅ Sport identifier for basketball/football
}

const LiveMatchItem = React.memo(
  ({ fixture, onToggleFavorite, onPress, sport = "football" }: MatchItemProps) => {
    const theme = useTheme();
    const [isFavorite, setIsFavorite] = useState(false);
    const [enhancedData, setEnhancedData] = useState<EnhancedMatchData | null>(
      null,
    );
    const [currentSeconds, setCurrentSeconds] = useState(0);
    const [showApostrophe, setShowApostrophe] = useState(true);
    // ✅ GOAL FLASH STATE: Add state for team background flash animation
    const [homeTeamFlash, setHomeTeamFlash] = useState(false);
    const [awayTeamFlash, setAwayTeamFlash] = useState(false);
    const { settings } = useMatchSettings();
    
    // ✅ Detect if this is a basketball match
    const isBasketball = sport === "basketball";

    // ✅ GOAL FLASH ANIMATION: Trigger flash when team scores
    // ✅ SYNCHRONIZED: Flash duration matches banner display (6 seconds)
    const GOAL_FLASH_DURATION = 6000; // Match banner auto-dismiss duration
    
    const triggerGoalFlash = useCallback(
      (team: "home" | "away") => {
        console.log(`🔴 TOP-LIVE: Triggering goal flash for ${team} team`);
        if (team === "home") {
          setHomeTeamFlash(true);
          setTimeout(() => setHomeTeamFlash(false), GOAL_FLASH_DURATION);
        } else {
          setAwayTeamFlash(true);
          setTimeout(() => setAwayTeamFlash(false), GOAL_FLASH_DURATION);
        }

        // Play sound if enabled
        if (settings?.soundNotification) {
          try {
            playGoalSound(team, settings);
          } catch (error) {
            console.error("Error playing goal sound:", error);
          }
        }
      },
      [settings],
    );

    // ✅ GOAL DETECTION EFFECT: Subscribe to goal notifications
    useEffect(() => {
      if (!fixture.fixture?.id) return;

      const handleGoalDetected = (data: any) => {
        console.log('🎯 TOP-LIVE: Goal detected callback triggered:', {
          notificationMatchId: data.matchId,
          currentFixtureId: fixture.fixture.id.toString(),
          scoringTeam: data.scoringTeam,
          eventType: data.eventType,
          sport: data.sport,
        });
        
        // ✅ CRITICAL FIX: Match by matchId string comparison
        if (data.matchId === fixture.fixture.id.toString()) {
          console.log('✅ TOP-LIVE: Match ID matches! Triggering flash for:', data.scoringTeam);
          
          // ✅ ENHANCED: Only flash for regular goals/points, not cancelled or red cards
          // ✅ BASKETBALL: Flash for basketball points too
          if (data.eventType === 'goal') {
            triggerGoalFlash(data.scoringTeam);
          }
        } else {
          console.log('❌ TOP-LIVE: Match ID does not match');
        }
      };

      const unsubscribe = goalDetectionService.subscribe(handleGoalDetected);
      return unsubscribe;
    }, [
      fixture.fixture?.id,
      triggerGoalFlash,
    ]);

    // Debug: Log fixture events on mount
    useEffect(() => {
      console.log("🎯 LIVE FIXTURE LOADED:", {
        id: fixture.fixture?.id,
        hasEvents: !!fixture.events,
        eventsCount: fixture.events?.length || 0,
        homeTeam: fixture.teams.home.name,
        awayTeam: fixture.teams.away.name,
      });
    }, [fixture]);

    useEffect(() => {
      const checkFavoriteStatus = async () => {
        if (fixture.fixture?.id) {
          const isFav = await favoritesService.isFavorite(
            fixture.fixture.id.toString(),
          );
          setIsFavorite(isFav);
        }
      };
      checkFavoriteStatus();
    }, [fixture.fixture?.id]);

    // Global sync listener for immediate star updates
    useEffect(() => {
      if (!fixture.fixture?.id) return;

      const matchIdString = fixture.fixture.id.toString();
      const unsubscribe = favoritesService.addSyncListener(
        (matchId: string, isFav: boolean) => {
          if (matchId === matchIdString) {
            setIsFavorite(isFav);
          }
        },
      );

      return () => {
        unsubscribe();
      };
    }, [fixture.fixture?.id]);

    // Load enhanced match data
    useEffect(() => {
      const loadEnhancedData = async () => {
        if (fixture.fixture?.id) {
          try {
            const data = await enhancedMatchService.getEnhancedMatchData(
              fixture.fixture.id,
              fixture.teams.home.id,
              fixture.teams.away.id,
              fixture.teams.home?.name || "",
              fixture.teams.away?.name || "",
              fixture.league.id,
              fixture.league?.name || "",
              fixture.events || [],
            );
            setEnhancedData(data);
          } catch (error) {
            console.warn("Failed to load enhanced match data:", error);
          }
        }
      };
      loadEnhancedData();
    }, [fixture.fixture?.id]);

    const handleFavoritePress = () => {
      // Immediate optimistic update
      setIsFavorite(!isFavorite);
      onToggleFavorite(fixture.fixture.id);
    };

    const handleMatchPress = () => {
      onPress(fixture);
    };

    // Simple timer with apostrophe ticking per second
    useEffect(() => {
      const status = fixture.fixture.status;
      const isLive =
        status?.short === "1H" ||
        status?.short === "2H" ||
        status?.short === "ET" ||
        status?.elapsed;

      if (isLive) {
        const timer = setInterval(() => {
          setCurrentSeconds((prev) => prev + 1);
          setShowApostrophe((prev) => !prev); // Toggle apostrophe visibility
        }, 1000);

        return () => clearInterval(timer);
      }
    }, [fixture.fixture.id]);

    const getMatchTime = () => {
      const status = fixture.fixture.status;

      if (status?.elapsed) {
        let elapsed = status.elapsed;
        const apostrophe = showApostrophe ? "'" : " ";
        
        // ✅ CLIENT-SIDE STOPPAGE TIME CALCULATION
        // If API caps at 45 (stoppage time), calculate realistic time from match start
        if (status.short === "1H" && elapsed === 45 && fixture.fixture.date) {
          const matchStart = new Date(fixture.fixture.date);
          const now = new Date();
          const minutesElapsed = Math.floor((now.getTime() - matchStart.getTime()) / (1000 * 60));
          
          // If more than 45 minutes have passed, use calculated time
          if (minutesElapsed > 45 && minutesElapsed < 60) {
            elapsed = minutesElapsed;
          }
        }
        
        // ✅ CLIENT-SIDE STOPPAGE TIME CALCULATION FOR 2H
        // If API caps at 90 (stoppage time), calculate realistic time from match start
        if (status.short === "2H" && elapsed === 90 && fixture.fixture.date) {
          const matchStart = new Date(fixture.fixture.date);
          const now = new Date();
          const minutesElapsed = Math.floor((now.getTime() - matchStart.getTime()) / (1000 * 60));
          
          // Account for halftime (typically 15 minutes), so 2H starts at ~60 min real time
          // If more than 105 real minutes have passed, we're likely in stoppage time
          // Allow up to 150 minutes to handle very long stoppages or data delays
          if (minutesElapsed > 105 && minutesElapsed <= 150) {
            // Convert real time to match time (subtract first half + break)
            elapsed = minutesElapsed - 60; // 60 = first half (45) + halftime (15)
          }
        }
        
        // ✅ ADDED TIME LOGIC: Progressive display like Chinese app
        // First half added time (45+ onwards) - but only during 1H status
        if (status.short === "1H" && elapsed > 45) {
          const addedTime = elapsed - 45;
          return `45+${addedTime}${apostrophe}`;
        }
        
        // Second half added time (90+ onwards) - but only during 2H status
        if (status.short === "2H" && elapsed > 90) {
          const addedTime = elapsed - 90;
          return `90+${addedTime}${apostrophe}`;
        }
        
        // Regular match time
        return `${elapsed}${apostrophe}`;
      }
      if (status?.short === "1H") {
        const minutes = Math.floor(currentSeconds / 60);
        const apostrophe = showApostrophe ? "'" : " ";
        return `${Math.min(45, minutes)}${apostrophe}`;
      }
      if (status?.short === "2H") {
        const minutes = Math.floor(currentSeconds / 60) + 45;
        const apostrophe = showApostrophe ? "'" : " ";
        return `${Math.min(90, minutes)}${apostrophe}`;
      }
      if (status?.short === "HT") return "HT";
      if (status?.short === "FT") return "FT";
      if (status?.short === "ET") {
        const minutes = Math.floor(currentSeconds / 60) + 90;
        const apostrophe = showApostrophe ? "'" : " ";
        return `${minutes}${apostrophe}`;
      }
      return "Live";
    };

    const getApostropheOpacity = () => {
      return showApostrophe ? 1 : 0.3;
    };

    const getMatchEvents = () => {
      if (!fixture.events || !Array.isArray(fixture.events)) {
        console.log("🎯 No events for fixture:", fixture.fixture?.id);
        return [];
      }

      console.log("🎯 Processing events for fixture:", fixture.fixture?.id, "Events count:", fixture.events.length);
      console.log("🏠 Home team:", fixture.teams.home?.name, "ID:", fixture.teams.home?.id, "TYPE:", typeof fixture.teams.home?.id);
      console.log("✈️ Away team:", fixture.teams.away?.name, "ID:", fixture.teams.away?.id, "TYPE:", typeof fixture.teams.away?.id);
      console.log("📦 First event team:", fixture.events[0]?.team?.name, "ID:", fixture.events[0]?.team?.id, "TYPE:", typeof fixture.events[0]?.team?.id);
      
      const events = fixture.events
        .filter((event: any) => {
          // Filter for goals and red cards
          if (event.type === "Goal") {
            return event.detail !== "Missed Penalty";
          }
          if (event.type === "Card") {
            return event.detail === "Red Card";
          }
          return false;
        })
        .map((event: any) => {
          // ✅ FIX: Determine team side using name comparison (more reliable than IDs)
          const eventTeamName = event.team?.name?.toLowerCase()?.trim() || "";
          const homeTeamName = fixture.teams.home?.name?.toLowerCase()?.trim() || "";
          const awayTeamName = fixture.teams.away?.name?.toLowerCase()?.trim() || "";
          
          let teamSide: "home" | "away" = "home"; // Default to home
          
          // Primary method: Compare team names (most reliable)
          if (eventTeamName && homeTeamName && eventTeamName === homeTeamName) {
            teamSide = "home";
          } else if (eventTeamName && awayTeamName && eventTeamName === awayTeamName) {
            teamSide = "away";
          } else {
            // Fallback: Try ID comparison if names don't match
            const eventTeamId = event.team?.id;
            const homeTeamId = fixture.teams.home?.id;
            const awayTeamId = fixture.teams.away?.id;
            
            // Only compare IDs if they exist and are not null/undefined
            if (eventTeamId != null && homeTeamId != null && eventTeamId === homeTeamId) {
              teamSide = "home";
            } else if (eventTeamId != null && awayTeamId != null && eventTeamId === awayTeamId) {
              teamSide = "away";
            }
          }
          
          console.log(`⚽ Event: ${event.player?.name} - Event Team: "${eventTeamName}" vs Home: "${homeTeamName}" vs Away: "${awayTeamName}" => Side: ${teamSide}, Type: ${event.type}`);
          
          return {
            time: event.time?.elapsed || 0,
            type: event.type,
            detail: event.detail,
            player: event.player?.name || "Unknown",
            team: teamSide,
          };
        })
        .sort((a: any, b: any) => a.time - b.time);

      return events;
    };

    return (
      <TouchableOpacity
        style={[
          styles.matchItem,
          {
            backgroundColor:
              homeTeamFlash || awayTeamFlash
                ? "#ffa8a8"
                : theme.colors.backgroundSecondary,
          },
        ]}
        onPress={handleMatchPress}
        activeOpacity={0.7}
      >
        {/* Top Row - Match Start Time and Timer */}
        <View style={styles.topRow}>
          <View style={styles.timeContainer}>
            <Text
              style={[styles.startTime, { color: theme.colors.textSecondary }]}
            >
              {new Date(fixture.fixture.date).toLocaleTimeString("en-US", {
                hour12: false,
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </View>
          <View style={styles.centerTimerContainer}>
            <View style={styles.timerContainer}>
              {/* Show ET badge for football extra time matches, otherwise show regular timer */}
              {!isBasketball && isMatchInExtraTime(fixture) ? (
                <MatchExtraTime fixture={fixture} showDetailedET={false} />
              ) : (
                <>
                  <Text style={[styles.matchTimer, { color: "#FF4444" }]}>
                    {getMatchTime().slice(0, -1)}
                  </Text>
                  <Text
                    style={[
                      styles.apostrophe,
                      {
                        color: "#FF4444",
                        opacity: getApostropheOpacity(),
                      },
                    ]}
                  >
                    '
                  </Text>
                </>
              )}
            </View>
          </View>
          <View style={styles.rightSpacer} />
        </View>

        {/* Followers - Absolute positioned at right edge */}
        <View style={styles.absoluteFollowers}>
          <View style={styles.followersContainer}>
            <Users size={12} color={theme.colors.textSecondary} />
            <Text
              style={[
                styles.followersText,
                { color: theme.colors.textSecondary },
              ]}
            >
              12
            </Text>
          </View>
        </View>

        {/* Main Match Content */}
        <View style={styles.mainContent}>
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={handleFavoritePress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Star
              size={20}
              color={isFavorite ? "#FF4444" : theme.colors.textSecondary}
              fill={isFavorite ? "#FF4444" : "none"}
            />
          </TouchableOpacity>

          <View style={styles.centeredMatchContent}>
            {/* Teams and Score Row */}
            <View style={styles.teamsAndScoreRow}>
              {/* Home Team */}
              <View style={styles.homeTeamSection}>
                <View style={styles.homeTeamContainer}>
                  <View style={styles.homeTeamWithLogo}>
                    {fixture.teams.home?.logo && (
                      <Image
                        source={{ uri: fixture.teams.home.logo }}
                        style={styles.homeTeamLogo}
                        resizeMode="contain"
                      />
                    )}
                    {homeTeamFlash && settings?.goalAnimation ? (
                      <View style={styles.teamNameWrapperHome}>
                        <Text
                          style={[
                            styles.teamName,
                            styles.homeTeamName,
                            styles.teamNameScored,
                          ]}
                          numberOfLines={
                            fixture.teams.home?.name &&
                            fixture.teams.home.name.split(" ").length > 2
                              ? 2
                              : 1
                          }
                        >
                          {fixture.teams.home?.name || ""}
                        </Text>
                      </View>
                    ) : (
                      <Text
                        style={[
                          styles.teamName,
                          styles.homeTeamName,
                          { color: theme.colors.text },
                        ]}
                        numberOfLines={
                          fixture.teams.home?.name &&
                          fixture.teams.home.name.split(" ").length > 2
                            ? 2
                            : 1
                        }
                      >
                        {fixture.teams.home?.name || ""}
                      </Text>
                    )}
                  </View>
                </View>
              </View>

              {/* Score Section - Close Together */}
              <View style={styles.scoreSection}>
                <View style={styles.liveScoreContainer}>
                  <Text
                    style={[
                      styles.scoreText,
                      { color: "#FF4444", fontWeight: "700" },
                    ]}
                  >
                    {isBasketball 
                      ? ((fixture as any).scores?.home?.total ?? 0)
                      : (fixture.goals?.home || 0)}
                  </Text>
                  <Text style={[styles.scoreSeparator, { color: "#FF4444" }]}>
                    -
                  </Text>
                  <Text
                    style={[
                      styles.scoreText,
                      { color: "#FF4444", fontWeight: "700" },
                    ]}
                  >
                    {isBasketball 
                      ? ((fixture as any).scores?.away?.total ?? 0)
                      : (fixture.goals?.away || 0)}
                  </Text>
                </View>
              </View>

              {/* Away Team */}
              <View style={styles.awayTeamSection}>
                <View style={styles.awayTeamContainer}>
                  <View style={styles.awayTeamWithLogo}>
                    {awayTeamFlash && settings?.goalAnimation ? (
                      <View style={styles.teamNameWrapperAway}>
                        <Text
                          style={[
                            styles.teamName,
                            styles.awayTeamName,
                            styles.teamNameScored,
                          ]}
                          numberOfLines={
                            fixture.teams.away?.name &&
                            fixture.teams.away.name.split(" ").length > 2
                              ? 2
                              : 1
                          }
                        >
                          {fixture.teams.away?.name || ""}
                        </Text>
                      </View>
                    ) : (
                      <Text
                        style={[
                          styles.teamName,
                          styles.awayTeamName,
                          { color: theme.colors.text },
                        ]}
                        numberOfLines={
                          fixture.teams.away?.name &&
                          fixture.teams.away.name.split(" ").length > 2
                            ? 2
                            : 1
                        }
                      >
                        {fixture.teams.away?.name || ""}
                      </Text>
                    )}
                    {fixture.teams.away?.logo && (
                      <Image
                        source={{ uri: fixture.teams.away.logo }}
                        style={styles.awayTeamLogo}
                        resizeMode="contain"
                      />
                    )}
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Navigation Button - Absolute positioned at right edge */}
        <View style={styles.rightSection}>
          <TouchableOpacity
            onPress={handleMatchPress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <View style={styles.navigationRing}>
              <ChevronRight size={14} color="#FF4444" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Goals and Events Timeline */}
        {(() => {
          console.log("🎯 LIVE CHECKING EVENTS:", {
            fixtureId: fixture.fixture?.id,
            hasEventsProperty: "events" in fixture,
            eventsValue: fixture.events,
            isArray: Array.isArray(fixture.events),
            length: fixture.events?.length || 0,
          });
          return null;
        })()}
        {fixture.events && fixture.events.length > 0 && (() => {
          console.log("🎯 RENDERING LIVE EVENTS TIMELINE for fixture:", fixture.fixture?.id);
          const events = getMatchEvents();
          const isLive = fixture.fixture.status?.short && ["1H", "2H", "HT", "Q1", "Q2", "Q3", "Q4", "OT"].includes(fixture.fixture.status.short);
          
          return (
          <View style={styles.eventsTimeline}>
            {events.map((event: any, index: number) => (
              <View key={index} style={styles.eventRow}>
                {/* Home Team Section - Dot near home score, expanding left */}
                <View style={styles.homeEventSection}>
                  {event.team === "home" && (
                    <View style={styles.eventItem}>
                      <Text
                        style={[
                          styles.eventPlayer,
                          { color: theme.colors.text },
                        ]}
                        numberOfLines={1}
                      >
                        {event.player}
                      </Text>
                      <View style={styles.eventIconContainer}>
                        {event.type === "Goal" && (
                          <View style={styles.goalIcon}>
                            <Text style={styles.goalIconText}>⚽</Text>
                          </View>
                        )}
                        {event.type === "Card" && event.detail === "Red Card" && (
                          <View style={styles.redCardIcon}>
                            <View style={styles.redCard} />
                          </View>
                        )}
                      </View>
                      <Text
                        style={[
                          styles.eventTime,
                          { color: theme.colors.textSecondary },
                        ]}
                      >
                        {event.time}'
                      </Text>
                      <View style={[
                        styles.timelineDot,
                        { backgroundColor: isLive ? "#FF4444" : "#666666" }
                      ]} />
                    </View>
                  )}
                </View>

                {/* Away Team Section - Dot near away score, expanding right */}
                <View style={styles.awayEventSection}>
                  {event.team === "away" && (
                    <View style={styles.eventItem}>
                      <View style={[
                        styles.timelineDot,
                        { backgroundColor: isLive ? "#FF4444" : "#666666" }
                      ]} />
                      <Text
                        style={[
                          styles.eventTime,
                          { color: theme.colors.textSecondary },
                        ]}
                      >
                        {event.time}'
                      </Text>
                      <View style={styles.eventIconContainer}>
                        {event.type === "Goal" && (
                          <View style={styles.goalIcon}>
                            <Text style={styles.goalIconText}>⚽</Text>
                          </View>
                        )}
                        {event.type === "Card" && event.detail === "Red Card" && (
                          <View style={styles.redCardIcon}>
                            <View style={styles.redCard} />
                          </View>
                        )}
                      </View>
                      <Text
                        style={[
                          styles.eventPlayer,
                          { color: theme.colors.text },
                        ]}
                        numberOfLines={1}
                      >
                        {event.player}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
          );
        })()}
        
        {/* ✅ Basketball Player Stats Table */}
        {isBasketball && fixture.statistics && fixture.statistics.length > 0 && (() => {
          console.log("🏀 Rendering basketball stats for fixture:", fixture.fixture?.id);
          
          // Get top 3 players from each team
          const homeStats = fixture.statistics.find((s: any) => s.team?.id === fixture.teams.home?.id);
          const awayStats = fixture.statistics.find((s: any) => s.team?.id === fixture.teams.away?.id);
          
          const getTopPlayers = (teamStats: any, limit = 3) => {
            if (!teamStats?.players || !Array.isArray(teamStats.players)) return [];
            
            return teamStats.players
              .filter((p: any) => p?.statistics?.[0]?.points !== null)
              .sort((a: any, b: any) => {
                const aPoints = a.statistics?.[0]?.points || 0;
                const bPoints = b.statistics?.[0]?.points || 0;
                return bPoints - aPoints;
              })
              .slice(0, limit);
          };
          
          const homePlayers = getTopPlayers(homeStats);
          const awayPlayers = getTopPlayers(awayStats);
          
          if (homePlayers.length === 0 && awayPlayers.length === 0) return null;
          
          return (
            <View style={styles.basketballStatsContainer}>
              <View style={styles.statsTable}>
                {/* Home Team Players */}
                <View style={styles.statsTeamColumn}>
                  {homePlayers.map((player: any, index: number) => {
                    const stats = player.statistics?.[0];
                    return (
                      <View key={index} style={styles.statsPlayerRow}>
                        <Text style={[styles.statsPlayerName, { color: theme.colors.text }]} numberOfLines={1}>
                          {player.player?.name || 'Unknown'}
                        </Text>
                        <View style={styles.statsValues}>
                          <Text style={[styles.statsValue, { color: theme.colors.textSecondary }]}>
                            {stats?.points || 0}pts
                          </Text>
                          <Text style={[styles.statsValue, { color: theme.colors.textSecondary }]}>
                            {stats?.totReb || 0}reb
                          </Text>
                          <Text style={[styles.statsValue, { color: theme.colors.textSecondary }]}>
                            {stats?.assists || 0}ast
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
                
                {/* Center Divider */}
                <View style={styles.statsDivider} />
                
                {/* Away Team Players */}
                <View style={styles.statsTeamColumn}>
                  {awayPlayers.map((player: any, index: number) => {
                    const stats = player.statistics?.[0];
                    return (
                      <View key={index} style={styles.statsPlayerRow}>
                        <View style={styles.statsValues}>
                          <Text style={[styles.statsValue, { color: theme.colors.textSecondary }]}>
                            {stats?.points || 0}pts
                          </Text>
                          <Text style={[styles.statsValue, { color: theme.colors.textSecondary }]}>
                            {stats?.totReb || 0}reb
                          </Text>
                          <Text style={[styles.statsValue, { color: theme.colors.textSecondary }]}>
                            {stats?.assists || 0}ast
                          </Text>
                        </View>
                        <Text style={[styles.statsPlayerName, { color: theme.colors.text, textAlign: 'right' }]} numberOfLines={1}>
                          {player.player?.name || 'Unknown'}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </View>
          );
        })()}

        {/* Extra Time Detailed Section - Beautiful Red Transparent Bar (Football Only) */}
        {!isBasketball && isMatchInExtraTime(fixture) && (
          <MatchExtraTime
            fixture={fixture}
            regularTimeScore={{
              home: fixture.score?.fulltime?.home ?? fixture.score?.halftime?.home ?? 0,
              away: fixture.score?.fulltime?.away ?? fixture.score?.halftime?.away ?? 0,
            }}
            showDetailedET={true}
          />
        )}
      </TouchableOpacity>
    );
  },
);

export default function TopLiveMatches({
  sport, // ✅ Sport prop added
  onFavoritesChange,
  onMatchCountChange,
  refreshing = false,
  onRefresh,
  headerComponent,
  onMatchesLoaded,
}: TopLiveMatchesProps) {
  const theme = useTheme();
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { addFavorite, removeFavorite, refreshFavoritesCount } = useFavorites();
  const { showGoalNotification } = useMatchSettings();

  // Load live matches with real API data and smooth background refresh
  const loadTopLiveMatches = useCallback(
    async (isBackgroundRefresh = false) => {
      try {
        if (!isBackgroundRefresh) {
          console.log("🔄 TOP LIVE: Starting real API data fetch...");
          setIsLoading(true);
        }

        // ✅ BACKEND API: Fetch real live matches from Supabase Edge Functions
        console.log(`📡 [Backend API] TOP LIVE: Fetching fixtures with events for sport: ${sport}`);
        
        let fixtures: Fixture[] = [];

        try {
          // Import backend API service
          const { backendApiService } = await import("../../../services/backendApiService");
          
          // Fetch live matches from backend
          const liveMatches = await backendApiService.getLiveMatches(sport, false);
          
          // Convert to response format
          const response = {
            get: 'fixtures',
            parameters: { live: 'all', sport },
            errors: [],
            results: liveMatches.length,
            paging: { current: 1, total: 1 },
            response: liveMatches,
          };
          
          console.log(
            "📊 [Backend API] TOP LIVE: Fixtures received:",
            response?.response?.length || 0,
          );

          if (response && response.response && response.response.length > 0) {
            fixtures = response.response
              .filter((f) => {
                if (!f || !f.teams?.home?.name || !f.teams?.away?.name) return false;
                const status = f.fixture?.status?.short || "";
                
                // ✅ BASKETBALL FIX: Include truly live matches for both sports
                return (
                  status === "1H" ||
                  status === "2H" ||
                  status === "HT" ||
                  status === "ET" ||
                  status === "BT" ||
                  status === "P" ||
                  // ✅ Basketball statuses
                  status === "Q1" ||
                  status === "Q2" ||
                  status === "Q3" ||
                  status === "Q4" ||
                  status === "OT"
                );
              })
              .slice(0, 20);
            console.log(
              "✅ TOP LIVE: Filtered live fixtures:",
              fixtures.length,
            );
            // Log event counts
            const fixturesWithEvents = fixtures.filter(f => f.events && f.events.length > 0);
            console.log(
              "🎯 TOP LIVE: Fixtures with events:",
              fixturesWithEvents.length,
              "out of",
              fixtures.length,
            );
          }

          // If no live matches found, log and continue with empty array
          if (fixtures.length === 0) {
            console.log(
              `⚠️ TOP LIVE: No live matches found for ${sport}`,
            );
          }
        } catch (error) {
          console.error("❌ TOP LIVE: API calls failed:", error);
          fixtures = [];
        }

        // Convert fixtures to Match format for compatibility
        let matches: Match[] = fixtures.map((f) => ({
          id: f.fixture.id.toString(),
          sport: sport, // ✅ Use dynamic sport instead of hardcoded "football"
          league: f.league?.name || "Unknown League",
          leagueLogo: f.league?.logo || null,
          leagueId: f.league?.id || null,
          status: "live" as const,
          statusText: f.fixture.status?.long || "Live",
          startTime: f.fixture.date || "",
          time: f.fixture.status?.elapsed?.toString() || "",
          home: {
            name: f.teams.home.name || "",
            logo: f.teams.home.logo || undefined,
            score: f.goals?.home || undefined,
          },
          away: {
            name: f.teams.away.name || "",
            logo: f.teams.away.logo || undefined,
            score: f.goals?.away || undefined,
          },
          score: `${f.goals?.home || 0}-${f.goals?.away || 0}`,
          halfTimeScore: `${f.score?.halftime?.home || 0}-${f.score?.halftime?.away || 0}`,
          viewers: "0",
          hasVideo: f.hasVideoBroadcast || false,
          isFavorite: f.isFavorite || false,
          addedTime: "",
          round: "",
          // ✅ Store team IDs and events for proper event rendering
          homeTeamId: f.teams.home.id,
          awayTeamId: f.teams.away.id,
          events: f.events || null,
        } as any));

        console.log("🎯 TOP LIVE: Final matches to process:", matches.length);

        // Apply enhanced filtering for quality matches
        if (matches.length > 0) {
          matches = matches
            .filter((match) => {
              if (
                !match ||
                !match.home?.name ||
                !match.away?.name ||
                !match.league
              )
                return false;

              // Filter out test/invalid matches
              if (
                match.home.name.includes("test") ||
                match.away.name.includes("test")
              )
                return false;

              return true;
            })
            .slice(0, 20);

          console.log("✅ TOP LIVE: After filtering:", matches.length);
        }

        // Remove duplicates using utility function
        const uniqueMatches = processMatches(matches, "TOP LIVE");

        // ✅ LIVE MATCHES: Sort by ELAPSED TIME (most advanced first)
        // Professional standard: 90' appears before 75', which appears before 45'
        const sortedMatches = uniqueMatches.sort((a, b) => {
          // Get elapsed time for each match
          const getMatchMinute = (match: Match): number => {
            if (match.time) {
              const timeStr = match.time.replace(/'/g, "");
              if (timeStr.includes("+")) {
                const [base, extra] = timeStr.split("+");
                return parseInt(base) + parseInt(extra);
              }
              return parseInt(timeStr) || 0;
            }
            return 0;
          };
          
          const elapsedA = getMatchMinute(a);
          const elapsedB = getMatchMinute(b);
          
          if (elapsedA !== elapsedB) {
            return elapsedB - elapsedA; // Higher elapsed time first (90' > 45')
          }
          
          // If same elapsed time, sort by start time (earlier first)
          const startTimeA = new Date(a.startTime).getTime();
          const startTimeB = new Date(b.startTime).getTime();
          return startTimeA - startTimeB;
        });

        // Enhance matches with team logos
        const enhancedMatches = sortedMatches.map((match) => ({
          ...teamLogoService.enhanceMatchWithLogos(match),
          isFavorite: match.isFavorite || false,
        }));

        // Update goal detection for live matches
        if (enhancedMatches.length > 0) {
          goalDetectionService.updateMatches(enhancedMatches);
        }

        setMatches(enhancedMatches);
        onMatchCountChange?.(enhancedMatches.length);
        onMatchesLoaded?.(enhancedMatches);
      } catch (error) {
        console.error("❌ TOP LIVE: Error loading matches:", error);
        if (!isBackgroundRefresh) {
          setMatches([]);
        }
      } finally {
        if (!isBackgroundRefresh) {
          setIsLoading(false);
        }
      }
    },
    [onMatchCountChange, onMatchesLoaded],
  );

  useEffect(() => {
    loadTopLiveMatches();
  }, [loadTopLiveMatches]);

  // Smooth background refresh for live matches - invisible to user
  useEffect(() => {
    const backgroundRefreshInterval = setInterval(() => {
      console.log("🔄 TOP LIVE: Background refresh triggered");
      loadTopLiveMatches(true); // Background refresh - no loading indicator
    }, 30000); // Every 30 seconds for live matches

    return () => {
      clearInterval(backgroundRefreshInterval);
    };
  }, [loadTopLiveMatches]);

  const handleMatchPress = useCallback(
    (fixture: Fixture) => {
      // ✅ BASKETBALL FIX: Get correct scores based on sport
      const scores = (fixture as any).scores;
      const homeScore =
        sport === "basketball"
          ? (scores?.home?.total ?? 0)
          : (fixture.goals?.home ?? 0);
      const awayScore =
        sport === "basketball"
          ? (scores?.away?.total ?? 0)
          : (fixture.goals?.away ?? 0);
      
      router.push({
        pathname: "/match-details",
        params: {
          matchId: fixture.fixture.id.toString(),
          homeTeam: fixture.teams.home.name || "",
          awayTeam: fixture.teams.away.name || "",
          homeScore: homeScore.toString(),
          awayScore: awayScore.toString(),
          status:
            fixture.fixture.status.long || fixture.fixture.status.short || "",
          startTime: fixture.fixture.date || "",
          league: fixture.league?.name || "Unknown League",
          homeLogo: fixture.teams.home.logo || "",
          awayLogo: fixture.teams.away.logo || "",
          venue: fixture.fixture.venue?.name || "",
          referee: fixture.fixture.referee || "",
          elapsed: fixture.fixture.status?.elapsed?.toString() || "",
          homeRank: "",
          awayRank: "",
          from: "top-live-matches",
          sport: sport, // ✅ Pass sport to match details
          // ✅ API-DRIVEN: Pass venue data from API (no hardcoding)
          venueName: fixture.fixture.venue?.name || "",
          venueCity: fixture.fixture.venue?.city || "",
        },
      });
    },
    [router, sport],
  );

  const toggleFavorite = useCallback(
    async (matchId: number) => {
      try {
        if (!matchId || typeof matchId !== "number") {
          console.log("Invalid match ID:", matchId);
          return;
        }

        const matchIdString = matchId.toString();
        console.log("Toggling favorite for match:", matchIdString);

        const match = matches.find((m) => parseInt(m.id) === matchId);
        if (!match) {
          console.log("Match not found:", matchId);
          return;
        }

        const wasAlreadyFavorite = match.isFavorite;

        // Optimistic update
        setMatches((prevMatches) =>
          prevMatches.map((m) =>
            parseInt(m.id) === matchId
              ? { ...m, isFavorite: !wasAlreadyFavorite, isToggling: true }
              : m,
          ),
        );

        let success = false;
        if (!wasAlreadyFavorite) {
          const standardizedMatch = {
            ...match,
            id: matchIdString,
            isFavorite: true,
          };
          success = await addFavorite(standardizedMatch);
          console.log("Add favorite result:", success);
        } else {
          success = await removeFavorite(matchIdString);
          console.log("Remove favorite result:", success);
        }

        // Remove loading state
        setMatches((prevMatches) =>
          prevMatches.map((m) =>
            m.id === matchIdString ? { ...m, isToggling: false } : m,
          ),
        );

        if (success) {
          await refreshFavoritesCount();
          onFavoritesChange?.();
        } else {
          // Revert on failure
          setMatches((prevMatches) =>
            prevMatches.map((m) =>
              m.id === matchIdString
                ? {
                    ...m,
                    isFavorite: wasAlreadyFavorite,
                    isToggling: false,
                  }
                : m,
            ),
          );
        }
      } catch (error) {
        console.error("Error in toggleFavorite:", error);
      }
    },
    [
      matches,
      addFavorite,
      removeFavorite,
      refreshFavoritesCount,
      onFavoritesChange,
    ],
  );

  const renderMatch = useCallback(
    ({ item: match, index }: { item: Match; index: number }) => {
      // Convert Match to Fixture for consistent rendering
      // Access events from match (stored when we fetched from API)
      const matchWithEvents = match as any;
      
      const fixture: Fixture = {
        fixture: {
          id: parseInt(match.id),
          referee: null,
          timezone: "UTC",
          date: match.startTime,
          timestamp: new Date(match.startTime).getTime() / 1000,
          periods: { first: null, second: null },
          venue: { id: null, name: null, city: null },
          status: {
            long: match.statusText,
            short: match.status === "live" ? "1H" : "NS",
            elapsed:
              match.status === "live" ? parseInt(match.time || "0") : null,
            extra: null,
          },
        },
        league: {
          id: null,
          name: match.league,
          country: null,
          logo: null,
          flag: null,
        },
        teams: {
          home: {
            id: matchWithEvents.homeTeamId || null,
            name: match.home.name,
            logo: match.home.logo || null,
          },
          away: {
            id: matchWithEvents.awayTeamId || null,
            name: match.away.name,
            logo: match.away.logo || null,
          },
        },
        goals: {
          home: match.home.score || 0,
          away: match.away.score || 0,
        },
        score: {
          halftime: { home: 0, away: 0 },
          fulltime: {
            home: match.home.score || 0,
            away: match.away.score || 0,
          },
          extratime: { home: null, away: null },
          penalty: { home: null, away: null },
        },
        events: matchWithEvents.events || null,
      };

      console.log("🎯 LIVE RENDER_MATCH - Creating Fixture:", {
        matchId: match.id,
        hasEventsInMatch: !!matchWithEvents.events,
        eventsInMatch: matchWithEvents.events,
        hasEventsInFixture: !!fixture.events,
        eventsCountInFixture: fixture.events?.length || 0,
      });

      // ✅ BASKETBALL SUPPORT: Use basketball vertical layout for basketball matches
      if (sport === "basketball") {
        const isFav = match.isFavorite || false;
        const basketballMatch = convertFixtureToBasketballMatch(fixture, isFav);
        
        return (
          <View>
            <BasketballMatchItem
              match={basketballMatch}
              onToggleFavorite={() => toggleFavorite(parseInt(match.id))}
              sport={sport}
            />
            {index < matches.length - 1 && (
              <View style={styles.matchSpacer} />
            )}
          </View>
        );
      }

      // Default: Football horizontal layout
      return (
        <View>
          <LiveMatchItem
            fixture={fixture}
            onToggleFavorite={toggleFavorite}
            onPress={handleMatchPress}
            sport={sport}
          />
          {index < matches.length - 1 && (
            <View style={styles.matchSpacer} />
          )}
        </View>
      );
    },
    [matches.length, toggleFavorite, handleMatchPress, theme.colors.border, sport],
  );

  // Always render scrollable content with Mac-specific fixes
  return (
    <View style={styles.container}>
      {/* Loading overlay that doesn't block scrolling */}
      {isLoading && matches.length === 0 && (
        <View style={[styles.loadingOverlay, { pointerEvents: "none" }]}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            Loading live matches...
          </Text>
        </View>
      )}

      <FlatList
        data={matches}
        renderItem={renderMatch}
        keyExtractor={MatchKeyGenerators.topLive}
        refreshing={refreshing}
        onRefresh={onRefresh || loadTopLiveMatches}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={headerComponent}
        contentContainerStyle={styles.flatListContent}
        removeClippedSubviews={false}
        scrollEventThrottle={16}
        maxToRenderPerBatch={8}
        initialNumToRender={6}
        windowSize={12}
        bounces={true}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyStateContainer}>
              <PlayCircle size={64} color={theme.colors.textSecondary} />
              <Text
                style={[styles.emptyStateTitle, { color: theme.colors.text }]}
              >
                No Live Matches
              </Text>
              <Text
                style={[
                  styles.emptyStateSubtitle,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Live matches will appear here when they are in progress
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  flatListContent: {
    flexGrow: 1,
    paddingBottom: 20,
    minHeight: "100%",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.8)",
    zIndex: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: "Inter-Medium",
    marginTop: 12,
  },
  matchItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingRight: 50,
    marginHorizontal: 0,
    marginVertical: 1,
    borderRadius: 0,
    backgroundColor: "#1a1a1a",
    position: "relative",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 16,
  },
  startTime: {
    fontSize: 13,
    fontFamily: "Inter-Medium",
    fontWeight: "600",
  },
  leagueInfo: {
    fontSize: 12,
    fontWeight: "500",
  },
  homeTeamLogo: {
    width: 24,
    height: 24,
    marginRight: 6,
    marginTop: 1,
    flexShrink: 0,
  },
  awayTeamLogo: {
    width: 24,
    height: 24,
    marginLeft: 6,
    marginTop: 1,
    flexShrink: 0,
  },
  absoluteFollowers: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 5,
  },
  followersContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  followersText: {
    fontSize: 10,
    fontFamily: "Inter-Medium",
    fontWeight: "500",
  },
  rightSection: {
    position: "absolute",
    right: 8,
    top: 44,
    zIndex: 10,
  },
  navigationRing: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FF4444",
  },
  mainContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  favoriteButton: {
    paddingRight: 6,
    paddingTop: 4,
    width: 32,
    alignItems: "flex-start",
    justifyContent: "flex-start",
  },
  centeredMatchContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 4,
  },
  teamsAndScoreRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  homeTeamSection: {
    flex: 1,
    alignItems: "flex-end",
    justifyContent: "center",
    paddingRight: 8,
    maxWidth: calculateMatchLayoutDimensions().homeTeamMaxWidth + 40,
  },
  homeTeamContainer: {
    flexDirection: "column",
    alignItems: "flex-end",
    paddingRight: 4,
    flex: 1,
  },
  homeTeamWithLogo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginBottom: 2,
    flex: 1,
    minHeight: 32,
  },
  awayTeamSection: {
    flex: 1,
    alignItems: "flex-start",
    justifyContent: "center",
    paddingLeft: 8,
    maxWidth: calculateMatchLayoutDimensions().awayTeamMaxWidth + 40,
  },
  awayTeamContainer: {
    flexDirection: "column",
    alignItems: "flex-start",
    paddingLeft: 4,
    flex: 1,
  },
  awayTeamWithLogo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginBottom: 2,
    flex: 1,
    minHeight: 32,
  },
  teamName: {
    fontSize: 14,
    fontFamily: "Inter-Medium",
    fontWeight: "500",
    flexShrink: 1,
    flexWrap: "wrap",
    lineHeight: 18,
  },
  homeTeamName: {
    textAlign: "right",
  },
  awayTeamName: {
    textAlign: "left",
  },
  teamNameWrapperHome: {
    // Wrapper for home team (right aligned) - doesn't affect layout
    alignSelf: 'flex-end',
  },
  teamNameWrapperAway: {
    // Wrapper for away team (left aligned) - doesn't affect layout
    alignSelf: 'flex-start',
  },
  teamNameScored: {
    backgroundColor: '#EF5350',
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: "Inter-Medium",
    fontWeight: "500",
    paddingHorizontal: 0, // No horizontal padding - background fits text exactly
    paddingVertical: 2, // Keep vertical padding for readability
    borderRadius: 2,
    overflow: 'hidden',
    // Ensure text doesn't add extra font padding
    includeFontPadding: false,
    textAlignVertical: 'center',
    flexShrink: 1,
    flexWrap: "wrap",
    lineHeight: 18,
    // Maintain original text alignment
    textAlign: 'inherit', // Inherits from homeTeamName/awayTeamName
  },
  scoreSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 60,
    paddingHorizontal: 6,
  },
  centerTimerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingLeft: 25,
  },
  rightSpacer: {
    width: 40,
  },
  timerContainer: {
    flexDirection: "row",
    alignItems: "center",
    minWidth: 30,
    justifyContent: "center",
  },
  matchTimer: {
    fontSize: 12,
    fontFamily: "Inter-Bold",
    fontWeight: "700",
    textAlign: "center",
    textShadowColor: "rgba(255, 68, 68, 0.3)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 2,
  },
  apostrophe: {
    fontSize: 12,
    fontFamily: "Inter-Bold",
    fontWeight: "700",
    textAlign: "center",
    textShadowColor: "rgba(255, 68, 68, 0.3)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 2,
    width: 4,
  },
  liveScoreContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  scoreText: {
    fontSize: 18,
    fontFamily: "Inter-Bold",
    fontWeight: "800",
    minWidth: 20,
    textAlign: "center",
  },
  scoreSeparator: {
    fontSize: 16,
    fontFamily: "Inter-Bold",
    fontWeight: "800",
    marginHorizontal: 8,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 12,
  },
  upcomingTime: {
    fontSize: 11,
    fontFamily: "Inter-Regular",
    textAlign: "center",
  },
  matchSpacer: {
    height: 4,
    backgroundColor: "transparent",
    marginHorizontal: 0,
    width: "100%",
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  emptyStateSubtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  // Events Timeline Styles
  eventsTimeline: {
    paddingHorizontal: 16,
    paddingVertical: 0,
    marginTop: 0,
  },
  eventRow: {
    position: "relative",
    marginBottom: 4,
    minHeight: 18,
    width: "100%",
  },
  homeEventSection: {
    position: "absolute",
    left: 0,
    right: "50%",
    alignItems: "flex-end",
    justifyContent: "flex-end",
    paddingRight: 8,
  },
  awayEventSection: {
    position: "absolute",
    left: "50%",
    right: 0,
    alignItems: "flex-start",
    justifyContent: "flex-start",
    paddingLeft: 48,
  },
  timelineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FF4444",
  },
  eventTime: {
    fontSize: 10,
    fontFamily: "Inter-Medium",
    fontWeight: "500",
    marginHorizontal: 4,
  },
  eventItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    minHeight: 18,
  },
  eventIconContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 18,
  },
  goalIcon: {
    width: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  goalIconText: {
    fontSize: 14,
  },
  redCardIcon: {
    width: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  redCard: {
    width: 10,
    height: 14,
    backgroundColor: "#FF0000",
    borderRadius: 2,
  },
  eventPlayer: {
    fontSize: 11,
    fontFamily: "Inter-Regular",
    maxWidth: 130,
    lineHeight: 16,
  },
  // Basketball Stats Table Styles
  basketballStatsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: "#333333",
  },
  statsTable: {
    flexDirection: "row",
    gap: 16,
  },
  statsTeamColumn: {
    flex: 1,
    gap: 6,
  },
  statsDivider: {
    width: 1,
    backgroundColor: "#333333",
  },
  statsPlayerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  statsPlayerName: {
    fontSize: 11,
    fontFamily: "Inter-Regular",
    flex: 1,
  },
  statsValues: {
    flexDirection: "row",
    gap: 8,
    marginLeft: 8,
  },
  statsValue: {
    fontSize: 10,
    fontFamily: "Inter-Regular",
    minWidth: 32,
  },
});
