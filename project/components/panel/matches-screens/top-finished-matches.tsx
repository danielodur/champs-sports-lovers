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
  CheckCircle,
} from "lucide-react-native";
import { useTheme } from "../../../hooks/useTheme";
import { Match } from "../../../types/match";
import { fetchHotMatches, fetchMatches } from "../../../services/matchService";
import { useFavorites } from "../../../hooks/useFavorites";
import { Fixture } from "../../../types/football-fixtures-response";
import favoritesService from "../../../services/favoritesService";
import { formatTeamName } from "../../../utils/formatTeamName";
import goalDetectionService from "../../../services/goalDetectionService";
import { useMatchSettings } from "../../../contexts/MatchSettingsContext";
import teamLogoService from "../../../services/teamLogoService";
import { useRouter } from "expo-router";
import enhancedMatchService, {
  EnhancedMatchData,
} from "../../../services/enhanced-match-service";
import { createApiSportsService } from "../../../services/api-sports-service";
import { backendApiService } from "../../../services/backendApiService"; // ✅ ADDED: Backend API

import {
  processMatches,
  MatchKeyGenerators,
} from "../../../utils/matchDeduplication";
import {
  smartFormatter,
  getMultiLineTextStyle,
  calculateMatchLayoutDimensions,
} from "../../../utils/teamNameFormatter";
import BasketballMatchItem from "./basketball-match-item";
import { convertFixtureToBasketballMatch } from "./basketball-utils";

interface TopFinishedMatchesProps {
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

const FinishedMatchItem = React.memo(
  ({ fixture, onToggleFavorite, onPress, sport = "football" }: MatchItemProps) => {
    const theme = useTheme();
    const [isFavorite, setIsFavorite] = useState(false);
    
    // ✅ Detect if this is a basketball match
    const isBasketball = sport === "basketball";
    const [enhancedData, setEnhancedData] = useState<EnhancedMatchData | null>(
      null,
    );

    // Debug: Log fixture events on mount
    useEffect(() => {
      console.log("🎯 FIXTURE LOADED:", {
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

    const getMatchTime = () => {
      return new Date(fixture.fixture.date).toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
      });
    };

    const getMatchEvents = () => {
      if (!fixture.events || !Array.isArray(fixture.events)) {
        console.log("🎯 No events for fixture:", fixture.fixture?.id);
        return [];
      }

      console.log("🎯 Processing events for fixture:", fixture.fixture?.id, "Events count:", fixture.events.length);
      console.log("🏠 Home team:", fixture.teams.home?.name, "ID:", fixture.teams.home?.id);
      console.log("✈️ Away team:", fixture.teams.away?.name, "ID:", fixture.teams.away?.id);
      
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
          { backgroundColor: theme.colors.backgroundSecondary },
        ]}
        onPress={handleMatchPress}
        activeOpacity={0.7}
      >
        {/* Top Row - Finished Time and FT */}
        <View style={styles.topRow}>
          <View style={styles.timeContainer}>
            <Text
              style={[styles.startTime, { color: theme.colors.textSecondary }]}
            >
              {getMatchTime()}
            </Text>
          </View>
          <View style={styles.centerStatusContainer}>
            <Text style={[styles.matchStatus, { color: "#888888" }]}>FT</Text>
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
                  </View>
                </View>
              </View>

              {/* Score Section for Finished Matches */}
              <View style={styles.scoreSection}>
                <View style={styles.finishedScoreContainer}>
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
          console.log("🎯 CHECKING EVENTS:", {
            fixtureId: fixture.fixture?.id,
            hasEventsProperty: "events" in fixture,
            eventsValue: fixture.events,
            isArray: Array.isArray(fixture.events),
            length: fixture.events?.length || 0,
          });
          return null;
        })()}
        {fixture.events && fixture.events.length > 0 && (() => {
          console.log("🎯 RENDERING EVENTS TIMELINE for fixture:", fixture.fixture?.id);
          const events = getMatchEvents();
          // ✅ Finished matches always get grey dots
          const isFinished = fixture.fixture.status?.short && ["FT", "AET", "PEN", "AOT"].includes(fixture.fixture.status.short);
          
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
                        { backgroundColor: isFinished ? "#666666" : "#FF4444" }
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
                        { backgroundColor: isFinished ? "#666666" : "#FF4444" }
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
          console.log("🏀 Rendering basketball stats for finished fixture:", fixture.fixture?.id);
          
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
      </TouchableOpacity>
    );
  },
);

export default function TopFinishedMatches({
  sport, // ✅ Sport prop added
  onFavoritesChange,
  onMatchCountChange,
  refreshing = false,
  onRefresh,
  headerComponent,
  onMatchesLoaded,
}: TopFinishedMatchesProps) {
  const theme = useTheme();
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { addFavorite, removeFavorite, refreshFavoritesCount } = useFavorites();
  const { showGoalNotification } = useMatchSettings();

  // Load finished matches with real API data and smooth background refresh
  const loadTopFinishedMatches = useCallback(
    async (isBackgroundRefresh = false) => {
      try {
        if (!isBackgroundRefresh) {
          console.log("🔄 TOP FINISHED: Starting real API data fetch...");
          setIsLoading(true);
        }

        // ✅ CRITICAL FIX: Use BACKEND API instead of direct API calls to avoid rate limits
        let fixtures: Fixture[] = [];

        try {
          // ✅ BACKEND API: Get finished matches from Supabase Edge Functions
          const today = new Date().toISOString().split('T')[0];
          console.log(
            `📡 TOP FINISHED: Fetching finished matches via BACKEND for sport: ${sport}`,
          );
          const response = await backendApiService.getFinishedMatches(sport, today, false);
          
          console.log(
            "📊 TOP FINISHED: Fixtures received:",
            response?.length || 0,
          );

          if (response && response.length > 0) {
            fixtures = response
              .filter((f: any) => {
                if (!f || !f.teams?.home?.name || !f.teams?.away?.name) return false;
                
                // ✅ CRITICAL SPORT FILTER: Remove matches from wrong sport
                const fixtureWithSport = f as any;
                const fixtureSport = fixtureWithSport.league?.sport || fixtureWithSport.sportType || 'football';
                if (sport === 'basketball' && fixtureSport !== 'basketball') {
                  console.warn(`🚫 TOP FINISHED: REMOVING WRONG SPORT: ${f.teams?.home?.name || 'Unknown'} vs ${f.teams?.away?.name || 'Unknown'} is ${fixtureSport}, expected basketball`);
                  return false;
                }
                if (sport === 'football' && fixtureSport === 'basketball') {
                  console.warn(`🚫 TOP FINISHED: REMOVING WRONG SPORT: ${f.teams?.home?.name || 'Unknown'} vs ${f.teams?.away?.name || 'Unknown'} is ${fixtureSport}, expected football`);
                  return false;
                }
                
                const status = f.fixture?.status?.short || "";
                
                // Only include truly finished matches
                return (
                  status === "FT" ||
                  status === "AET" ||
                  status === "PEN" ||
                  status === "AOT"  // ✅ Basketball After OverTime
                );
              })
              .slice(0, 20);
            console.log(
              "✅ TOP FINISHED: Filtered finished fixtures:",
              fixtures.length,
            );
            // Log event counts
            const fixturesWithEvents = fixtures.filter(f => f.events && f.events.length > 0);
            console.log(
              "🎯 TOP FINISHED: Fixtures with events:",
              fixturesWithEvents.length,
              "out of",
              fixtures.length,
            );
          }

          // If no finished matches found, try yesterday's matches
          if (fixtures.length === 0) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split("T")[0];
            
            console.log(
              `📡 TOP FINISHED: Trying yesterday's fixtures: ${yesterdayStr}, sport: ${sport}`,
            );
            const yesterdayResponse = await backendApiService.getFinishedMatches(sport, yesterdayStr, false);
            
            console.log(
              "📊 TOP FINISHED: Yesterday's fixtures received:",
              yesterdayResponse?.length || 0,
            );

            if (yesterdayResponse && yesterdayResponse.length > 0) {
              fixtures = yesterdayResponse
                .filter((f: any) => {
                  if (!f || !f.teams?.home?.name || !f.teams?.away?.name) return false;
                  
                  // ✅ CRITICAL SPORT FILTER: Remove matches from wrong sport
                  const fixtureWithSport = f as any;
                  const fixtureSport = fixtureWithSport.league?.sport || fixtureWithSport.sportType || 'football';
                  if (sport === 'basketball' && fixtureSport !== 'basketball') {
                    console.warn(`🚫 TOP FINISHED (YESTERDAY): REMOVING WRONG SPORT: ${f.teams?.home?.name || 'Unknown'} vs ${f.teams?.away?.name || 'Unknown'} is ${fixtureSport}, expected basketball`);
                    return false;
                  }
                  if (sport === 'football' && fixtureSport === 'basketball') {
                    console.warn(`🚫 TOP FINISHED (YESTERDAY): REMOVING WRONG SPORT: ${f.teams?.home?.name || 'Unknown'} vs ${f.teams?.away?.name || 'Unknown'} is ${fixtureSport}, expected football`);
                    return false;
                  }
                  
                  const status = f.fixture?.status?.short || "";
                  return status === "FT" || status === "AET" || status === "PEN" || status === "AOT";
                })
                .slice(0, 15);
              console.log(
                "✅ TOP FINISHED: Filtered yesterday's fixtures:",
                fixtures.length,
              );
            }
          }
        } catch (error) {
          console.error("❌ TOP FINISHED: API calls failed:", error);
          fixtures = [];
        }

        // Convert fixtures to Match format for compatibility
        let matches: Match[] = fixtures.map((f) => ({
          id: f.fixture.id.toString(),
          sport: sport, // ✅ Use dynamic sport instead of hardcoded "football"
          league: f.league?.name || "Unknown League",
          leagueLogo: f.league?.logo || null,
          leagueId: f.league?.id || null,
          status: "finished" as const,
          statusText: f.fixture.status?.long || "Finished",
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

        console.log(
          "🎯 TOP FINISHED: Final matches to process:",
          matches.length,
        );

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

          console.log("✅ TOP FINISHED: After filtering:", matches.length);
        }

        // Remove duplicates using utility function
        const uniqueMatches = processMatches(matches, "TOP FINISHED");

        // Sort matches by start time (most recent first)
        const sortedMatches = uniqueMatches.sort((a, b) => {
          const timeA = new Date(a.startTime).getTime();
          const timeB = new Date(b.startTime).getTime();
          return timeB - timeA;
        });

        // Enhance matches with team logos
        const enhancedMatches = sortedMatches.map((match) => ({
          ...teamLogoService.enhanceMatchWithLogos(match),
          isFavorite: match.isFavorite || false,
        }));

        setMatches(enhancedMatches);
        onMatchCountChange?.(enhancedMatches.length);
        onMatchesLoaded?.(enhancedMatches);
      } catch (error) {
        console.error("❌ TOP FINISHED: Error loading matches:", error);
        if (!isBackgroundRefresh) {
          setMatches([]);
        }
      } finally {
        if (!isBackgroundRefresh) {
          setIsLoading(false);
        }
      }
    },
    [onMatchCountChange, onMatchesLoaded, sport],
  );

  useEffect(() => {
    loadTopFinishedMatches();
  }, [loadTopFinishedMatches]);

  // Smooth background refresh for finished matches - invisible to user
  useEffect(() => {
    const backgroundRefreshInterval = setInterval(() => {
      console.log("🔄 TOP FINISHED: Background refresh triggered");
      loadTopFinishedMatches(true); // Background refresh - no loading indicator
    }, 60000); // Every 60 seconds for finished matches

    return () => {
      clearInterval(backgroundRefreshInterval);
    };
  }, [loadTopFinishedMatches]);

  const handleMatchPress = useCallback(
    (fixture: Fixture) => {
      router.push({
        pathname: "/match-details",
        params: {
          matchId: fixture.fixture.id.toString(),
          homeTeam: fixture.teams.home.name || "",
          awayTeam: fixture.teams.away.name || "",
          homeScore: sport === "basketball"
            ? ((fixture as any).scores?.home?.total ?? 0).toString()
            : ((fixture.goals?.home || 0).toString()),
          awayScore: sport === "basketball"
            ? ((fixture as any).scores?.away?.total ?? 0).toString()
            : ((fixture.goals?.away || 0).toString()),
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
          from: "top-finished-matches",
          // ✅ API-DRIVEN: Pass venue data from API (no hardcoding)
          venueName: fixture.fixture.venue?.name || "",
          venueCity: fixture.fixture.venue?.city || "",
        },
      });
    },
    [router],
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
            short: match.status === "finished" ? "FT" : "FT",
            elapsed: null,
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

      console.log("🎯 RENDER_MATCH - Creating Fixture:", {
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
          <FinishedMatchItem
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
            Loading finished matches...
          </Text>
        </View>
      )}

      <FlatList
        data={matches}
        renderItem={renderMatch}
        keyExtractor={MatchKeyGenerators.topFinished}
        refreshing={refreshing}
        onRefresh={onRefresh || loadTopFinishedMatches}
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
              <CheckCircle size={64} color={theme.colors.textSecondary} />
              <Text
                style={[styles.emptyStateTitle, { color: theme.colors.text }]}
              >
                No Finished Matches
              </Text>
              <Text
                style={[
                  styles.emptyStateSubtitle,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Match results will appear here after matches are completed
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
    fontWeight: "500",
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
  scoreSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 60,
    paddingHorizontal: 6,
  },
  centerStatusContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingLeft: 25,
  },
  rightSpacer: {
    width: 40,
  },
  matchStatus: {
    fontSize: 12,
    fontFamily: "Inter-Bold",
    fontWeight: "700",
    textAlign: "center",
  },
  finishedScoreContainer: {
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
