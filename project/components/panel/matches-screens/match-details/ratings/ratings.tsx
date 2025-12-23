import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
} from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { Clock, Flame, Star } from "lucide-react-native";
import { fetchLineupData, LineupData, PlayerData } from "@/services/lineupService";
import { backendApiService } from "@/services/backendApiService";
import supabaseClient from "@/services/supabaseClient";

const { width: screenWidth } = Dimensions.get("window");

interface PlayerEvent {
  type: "goal" | "assist" | "yellow_card" | "red_card" | "substitution_in" | "substitution_out" | "var";
  minute: number;
  icon?: string;
}

interface PlayerRating {
  id: string;
  name: string;
  headshot?: string;
  teamLogo?: string;
  position?: string;
  number?: number;
  rating: number; // Average fan rating out of 10
  fansRatings: number; // Total fan ratings count
  stars: number; // User's star rating (0-5)
  playTime: "full" | "substituted_out" | "substituted_in";
  substituteTime?: number; // Minute of substitution
  events: PlayerEvent[];
  isManager?: boolean;
  isReferee?: boolean;
  isHot?: boolean; // Top 2 players get hot badge
  matchStatus?: string; // Match status (FT, 1H, 2H, etc.)
  matchElapsed?: number | null; // Elapsed time in minutes
}

interface RatingsProps {
  homeTeamName: string;
  awayTeamName: string;
  homeTeamLogo?: string;
  awayTeamLogo?: string;
  matchId?: string;
  sport?: string; // Add sport prop for API calls
}

export default function Ratings({
  homeTeamName,
  awayTeamName,
  homeTeamLogo,
  awayTeamLogo,
  matchId,
  sport = "football", // Default to football
}: RatingsProps) {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState<"hot" | "home" | "away">("hot");
  const [playerRatings, setPlayerRatings] = useState<{
    home: PlayerRating[];
    away: PlayerRating[];
    referee?: PlayerRating;
  }>({ home: [], away: [] });
  const [loading, setLoading] = useState(true);

  // Fetch player ratings from API
  useEffect(() => {
    if (matchId) {
      fetchPlayerRatings();
    }
  }, [matchId]);

  const fetchPlayerRatings = async () => {
    try {
      setLoading(true);
      console.log("🔄 Fetching player ratings for match:", matchId);

      // Fetch lineup data from API (now returns real data)
      const lineupData = await fetchLineupData(matchId || "", sport);
      
      if (!lineupData) {
        console.log("⚠️ No lineup data available");
        setLoading(false);
        return;
      }

      // Fetch match status/time from API with proper fallback chain
      // ✅ API FALLBACK ORDER: API-Sports → API-Football → TheSportsDB
      let matchStatus: string = "FT";
      let matchElapsed: number | null = null;
      try {
        // ✅ PRIMARY: Use backend API service which has proper 3-tier fallback chain
        // Backend API uses: API-Sports → API-Football → TheSportsDB
        const fixture = await backendApiService.getFixtureById(parseInt(matchId || "0"), sport);
        
        if (fixture?.fixture) {
          matchStatus = fixture.fixture.status?.short || "FT";
          matchElapsed = fixture.fixture.status?.elapsed || null;
          console.log("✅ [RATINGS] Match status fetched from backend API:", matchStatus, matchElapsed);
        } else {
          // ✅ FALLBACK: Try direct API service (has fallback to TheSportsDB)
          console.log("⚠️ [RATINGS] Backend API returned no data, trying direct API service...");
          const ApiSportsService = (await import("@/services/api-sports-service")).default;
          const apiService = new ApiSportsService({
            apiKey: process.env.EXPO_PUBLIC_API_FOOTBALL_KEY || "",
            baseUrl: "https://v3.football.api-sports.io",
          });
          // ✅ This method has fallback: API-Football → TheSportsDB
          const fixtureResponse = await apiService.getFixtureById(parseInt(matchId || "0"), sport);
          if (fixtureResponse?.response?.[0]?.fixture) {
            const fixtureData = fixtureResponse.response[0];
            matchStatus = fixtureData.fixture.status?.short || "FT";
            matchElapsed = fixtureData.fixture.status?.elapsed || null;
            console.log("✅ [RATINGS] Match status fetched from direct API service:", matchStatus, matchElapsed);
          }
        }
      } catch (error) {
        console.warn("⚠️ [RATINGS] Could not fetch match status from any API:", error);
      }

      // Fetch existing ratings from database
      const { data: existingRatings } = await supabaseClient
        .from("player_ratings")
        .select("*")
        .eq("match_id", matchId);

      // Get current user ID to fetch their ratings
      const { data: { user } } = await supabaseClient.auth.getUser();
      const currentUserId = user?.id;

      // Calculate aggregated ratings per player (average and total count)
      const playerRatingsMap = new Map<string, { total: number; count: number; userRating?: number }>();
      
      if (existingRatings) {
        existingRatings.forEach((rating: any) => {
          const playerId = rating.player_id?.toString();
          if (!playerId) return;

          if (!playerRatingsMap.has(playerId)) {
            playerRatingsMap.set(playerId, { total: 0, count: 0 });
          }

          const stats = playerRatingsMap.get(playerId)!;
          stats.total += rating.rating || 0;
          stats.count += 1;

          // Store user's rating if this is the current user's rating
          if (currentUserId && rating.user_id === currentUserId) {
            stats.userRating = rating.rating;
          }
        });
      }

      // Convert lineup data to player ratings format
      const convertToPlayerRating = (
        player: PlayerData,
        teamLogo?: string,
        playerStats?: { total: number; count: number; userRating?: number }
      ): PlayerRating => {
        // Calculate average rating (convert from 10-point scale to display)
        const averageRating = playerStats && playerStats.count > 0
          ? playerStats.total / playerStats.count
          : 0;

        // Get user's star rating (convert from 10-point scale to 5-star)
        const userStars = playerStats?.userRating
          ? Math.round(playerStats.userRating / 2) // Convert 10-point to 5-star
          : 0;

        // Calculate play time from events
        let playTime: "full" | "substituted_out" | "substituted_in" = "full";
        let substituteTime: number | undefined;

        // Check for substitution events
        const subOut = player.events?.find((e) => e.type === "substitution_out" || e.type === "substitution");
        const subIn = player.events?.find((e) => e.type === "substitution_in");
        
        if (subOut) {
          playTime = "substituted_out";
          substituteTime = subOut.minute;
        } else if (subIn) {
          playTime = "substituted_in";
          substituteTime = subIn.minute;
        }

        // Map events to our rating event format (only show relevant events)
        const events: PlayerEvent[] = (player.events || [])
          .filter((e) => e.type !== "substitution") // Filter out generic substitution, use specific ones
          .map((e) => {
            if (e.type === "goal") return { type: "goal" as const, minute: e.minute };
            if (e.type === "yellow_card") return { type: "yellow_card" as const, minute: e.minute };
            if (e.type === "red_card") return { type: "red_card" as const, minute: e.minute };
            if (e.type === "assist") return { type: "assist" as const, minute: e.minute };
            if (e.type === "var") return { type: "var" as const, minute: e.minute };
            // Skip substitution events as they're handled in playTime
            return null;
          })
          .filter((e): e is PlayerEvent => e !== null);

        return {
          id: player.id,
          name: player.name,
          headshot: player.photo,
          teamLogo,
          position: player.position,
          number: player.number,
          rating: averageRating,
          fansRatings: playerStats?.count || 0,
          stars: userStars,
          playTime,
          substituteTime,
          events,
        };
      };

      // Convert home team players
      const homePlayers = lineupData.home.players.map((player) => {
        const playerStats = playerRatingsMap.get(player.id);
        const rating = convertToPlayerRating(player, homeTeamLogo, playerStats);
        rating.matchStatus = matchStatus;
        rating.matchElapsed = matchElapsed;
        return rating;
      });

      // ✅ STEP 3: Add home team manager (100% API-driven name and photo)
      // Only show manager if API provides a name
      const homeManager: PlayerRating | null = lineupData.home.manager.name
        ? {
            id: `home-manager-${lineupData.home.manager.name}`,
            name: lineupData.home.manager.name, // ✅ API-driven name
            headshot: lineupData.home.manager.photo, // ✅ API-driven photo
            teamLogo: homeTeamLogo, // ✅ From props, not hardcoded
            rating: 0,
            fansRatings: 0,
            stars: 0,
            playTime: "full",
            events: [],
            isManager: true,
            matchStatus,
            matchElapsed,
          }
        : null;

      // Convert away team players (100% API-driven)
      const awayPlayers = lineupData.away.players.map((player) => {
        const playerStats = playerRatingsMap.get(player.id);
        const rating = convertToPlayerRating(player, awayTeamLogo, playerStats); // ✅ awayTeamLogo from props
        rating.matchStatus = matchStatus;
        rating.matchElapsed = matchElapsed;
        return rating;
      });

      // ✅ STEP 4: Add away team manager (100% API-driven name and photo)
      // Only show manager if API provides a name
      const awayManager: PlayerRating | null = lineupData.away.manager.name
        ? {
            id: `away-manager-${lineupData.away.manager.name}`,
            name: lineupData.away.manager.name, // ✅ API-driven name
            headshot: lineupData.away.manager.photo, // ✅ API-driven photo
            teamLogo: awayTeamLogo, // ✅ From props, not hardcoded
            rating: 0,
            fansRatings: 0,
            stars: 0,
            playTime: "full",
            events: [],
            isManager: true,
            matchStatus,
            matchElapsed,
          }
        : null;

      // Fetch referee data from API with proper fallback chain
      // ✅ API FALLBACK ORDER: API-Sports → API-Football → TheSportsDB → Database
      let referee: PlayerRating | undefined = undefined;
      try {
        // ✅ PRIMARY: Use backend API service which has proper 3-tier fallback chain
        // Backend API uses: API-Sports → API-Football → TheSportsDB
        const fixture = await backendApiService.getFixtureById(parseInt(matchId || "0"), sport);
        
        if (fixture?.fixture?.referee) {
          const refereeName = fixture.fixture.referee;
          referee = {
            id: `referee-${refereeName}`,
            name: refereeName,
            headshot: undefined, // Referee photos not typically available in API
            rating: 0,
            fansRatings: 0,
            stars: 0,
            playTime: "full",
            events: [],
            isReferee: true,
            matchStatus,
            matchElapsed,
          };
          console.log("✅ [RATINGS] Referee fetched from backend API:", refereeName);
        } else {
          // ✅ FALLBACK: Try direct API service (has fallback to TheSportsDB)
          console.log("⚠️ [RATINGS] Backend API returned no referee, trying direct API service...");
          const ApiSportsService = (await import("@/services/api-sports-service")).default;
          const apiService = new ApiSportsService({
            apiKey: process.env.EXPO_PUBLIC_API_FOOTBALL_KEY || "",
            baseUrl: "https://v3.football.api-sports.io",
          });
          // ✅ This method has fallback: API-Football → TheSportsDB
          const fixtureResponse = await apiService.getFixtureById(parseInt(matchId || "0"), sport);
          if (fixtureResponse?.response?.[0]?.fixture?.referee) {
            const refereeName = fixtureResponse.response[0].fixture.referee;
            referee = {
              id: `referee-${refereeName}`,
              name: refereeName,
              headshot: undefined,
              rating: 0,
              fansRatings: 0,
              stars: 0,
              playTime: "full",
              events: [],
              isReferee: true,
              matchStatus,
              matchElapsed,
            };
            console.log("✅ [RATINGS] Referee fetched from direct API service:", refereeName);
          }
        }
      } catch (error) {
        console.warn("⚠️ [RATINGS] Could not fetch referee data from APIs:", error);
        // ✅ FINAL FALLBACK: Try from database
        try {
          const { data: matchData } = await supabaseClient
            .from("matches")
            .select("referee_name, referee_photo")
            .eq("id", matchId)
            .single();

          if (matchData?.referee_name) {
            referee = {
              id: `referee-${matchData.referee_name}`,
              name: matchData.referee_name,
              headshot: matchData.referee_photo,
              rating: 0,
              fansRatings: 0,
              stars: 0,
              playTime: "full",
              events: [],
              isReferee: true,
              matchStatus,
              matchElapsed,
            };
            console.log("✅ [RATINGS] Referee fetched from database:", matchData.referee_name);
          }
        } catch (dbError) {
          console.warn("⚠️ [RATINGS] Could not fetch referee data from database:", dbError);
        }
      }

      // Mark top 2 players as HOT based on ratings
      const allPlayers = [...homePlayers, ...awayPlayers]
        .filter((p) => !p.isManager)
        .sort((a, b) => b.rating - a.rating);
      
      if (allPlayers.length >= 1) allPlayers[0].isHot = true;
      if (allPlayers.length >= 2) allPlayers[1].isHot = true;

      // ✅ Build player ratings arrays (only include managers if API provided names)
      setPlayerRatings({
        home: homeManager ? [homeManager, ...homePlayers] : homePlayers,
        away: awayManager ? [awayManager, ...awayPlayers] : awayPlayers,
        referee,
      });

      setLoading(false);
    } catch (error) {
      console.error("❌ Error fetching player ratings:", error);
      setLoading(false);
    }
  };

  const handleStarPress = async (playerId: string, starIndex: number) => {
    const newStars = starIndex + 1;
    
    // Update UI immediately
    setPlayerRatings((prev) => {
      const updatePlayers = (players: PlayerRating[]) =>
        players.map((player) =>
          player.id === playerId
            ? { ...player, stars: newStars }
            : player
        );

      return {
        ...prev,
        home: updatePlayers(prev.home),
        away: updatePlayers(prev.away),
        referee:
          prev.referee?.id === playerId
            ? { ...prev.referee, stars: newStars }
            : prev.referee,
      };
    });

    // Save to database
    try {
      // Get current user ID
      const { data: { user } } = await supabaseClient.auth.getUser();
      
      if (!user) {
        Alert.alert("Login Required", "Please log in to rate players.");
        return;
      }

      const { error } = await supabaseClient
        .from("player_ratings")
        .upsert({
          match_id: matchId,
          player_id: playerId,
          user_id: user.id,
          rating: newStars * 2, // Convert 5-star to 10-point scale
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error("❌ Error saving rating:", error);
        Alert.alert("Error", "Failed to save your rating. Please try again.");
        return;
      }

      console.log("✅ Rating saved successfully for player:", playerId);
      
      // Refresh ratings to get updated average
      fetchPlayerRatings();
    } catch (error) {
      console.error("❌ Error in handleStarPress:", error);
      Alert.alert("Error", "Failed to save your rating. Please try again.");
    }
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case "goal":
        return require("@/assets/matchIcons/goal.png");
      case "assist":
        return require("@/assets/matchIcons/assist.png");
      case "yellow_card":
        return require("@/assets/matchIcons/yellow.png");
      case "red_card":
        return require("@/assets/matchIcons/red.png");
      case "substitution_in":
        return require("@/assets/matchIcons/player_in.png");
      case "substitution_out":
        return require("@/assets/matchIcons/player_out.png");
      case "var":
        return require("@/assets/matchIcons/var.png");
      default:
        return null;
    }
  };

  const renderPlayerCard = (player: PlayerRating) => (
    <View
      key={player.id}
      style={[
        styles.playerCard,
        {
          backgroundColor: theme.colors.backgroundSecondary,
          borderColor: theme.colors.border,
        },
      ]}
    >
      {/* Hot Badge for top 2 players */}
      {player.isHot && (
        <View style={styles.hotBadge}>
          <Text style={styles.hotText}>HOT</Text>
        </View>
      )}

      <View style={styles.playerCardContent}>
        {/* Left: Player Info */}
        <View style={styles.playerLeft}>
          {/* Headshot with team logo overlay */}
          <View style={styles.headshotContainer}>
            {player.headshot ? (
              <Image
                source={{ uri: player.headshot }}
                style={styles.headshot}
              />
            ) : (
              <View style={[styles.headshot, styles.placeholderHeadshot]}>
                <Text style={styles.placeholderText}>
                  {player.name.substring(0, 2).toUpperCase()}
                </Text>
              </View>
            )}
            {!player.isReferee && player.teamLogo && (
              <Image
                source={{ uri: player.teamLogo }}
                style={styles.teamLogoOverlay}
              />
            )}
          </View>

          <View style={styles.playerInfo}>
            {/* Player Name */}
            <Text
              style={[styles.playerName, { color: theme.colors.text }]}
              numberOfLines={1}
            >
              {player.name} ›
            </Text>

            {/* Stars - Beautiful Star icons like header */}
            <View style={styles.starsContainer}>
              {[0, 1, 2, 3, 4].map((index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleStarPress(player.id, index)}
                  activeOpacity={0.7}
                  style={styles.starButton}
                >
                  <Star
                    size={20}
                    color={index < player.stars ? "#FF4444" : "#808080"}
                    fill={index < player.stars ? "#FF4444" : "transparent"}
                    strokeWidth={2}
                  />
                </TouchableOpacity>
              ))}
            </View>

            {/* Play Time & Events */}
            <View style={styles.timeEventsContainer}>
              {/* Play Time */}
              <View style={styles.playTimeContainer}>
                <Clock size={12} color="#FF6B6B" style={styles.clockIcon} />
                {player.playTime === "full" && (
                  <Text
                    style={[
                      styles.playTimeText,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    {player.matchStatus === "FT" || player.matchStatus === "AET" || player.matchStatus === "PEN"
                      ? "Full Time"
                      : player.matchElapsed !== null && player.matchElapsed !== undefined
                      ? `${player.matchElapsed}'`
                      : player.matchStatus || "Full Time"}
                  </Text>
                )}
                {player.playTime === "substituted_out" && (
                  <View style={styles.subTimeContainer}>
                    <Image
                      source={require("@/assets/matchIcons/player_out.png")}
                      style={styles.subIcon}
                    />
                    <Text
                      style={[
                        styles.playTimeText,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      ↓ {player.substituteTime}'
                    </Text>
                  </View>
                )}
                {player.playTime === "substituted_in" && (
                  <View style={styles.subTimeContainer}>
                    <Image
                      source={require("@/assets/matchIcons/player_in.png")}
                      style={styles.subIcon}
                    />
                    <Text
                      style={[
                        styles.playTimeText,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      ↑ {player.substituteTime}'
                    </Text>
                  </View>
                )}
              </View>

              {/* Events Icons */}
              {player.events.length > 0 && (
                <View style={styles.eventsContainer}>
                  {player.events.map((event, index) => {
                    const iconSource = getEventIcon(event.type);
                    if (!iconSource) return null;
                    return (
                      <Image
                        key={`${player.id}-event-${index}`}
                        source={iconSource}
                        style={styles.eventIcon}
                      />
                    );
                  })}
                </View>
              )}
            </View>

            {/* Manager/Referee Label */}
            {player.isManager && (
              <Text
                style={[
                  styles.roleLabel,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Manager
              </Text>
            )}
          </View>
        </View>

        {/* Right: Rating */}
        <View style={styles.playerRight}>
          <Text style={styles.ratingScore}>{player.rating.toFixed(1)}</Text>
          <Text
            style={[
              styles.fansRatings,
              { color: theme.colors.textSecondary },
            ]}
          >
            {player.fansRatings} Fans Ratings
          </Text>
        </View>
      </View>
    </View>
  );

  const getHotPlayers = () => {
    const allPlayers = [...playerRatings.home, ...playerRatings.away];
    const sortedPlayers = allPlayers
      .filter((p) => !p.isManager)
      .sort((a, b) => b.rating - a.rating);
    
    // Mark top 2 as hot
    const hotPlayers = sortedPlayers.map((player, index) => ({
      ...player,
      isHot: index < 2,
    }));

    return hotPlayers;
  };

  const renderContent = () => {
    if (activeTab === "hot") {
      const hotPlayers = getHotPlayers();
      return (
        <View style={[styles.contentContainer, { backgroundColor: theme.colors.backgroundSecondary }]}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {hotPlayers.map(renderPlayerCard)}
            
            {/* Referee at the bottom */}
            {playerRatings.referee && (
              <View style={styles.refereeSection}>
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Referee
                </Text>
                {renderPlayerCard(playerRatings.referee)}
              </View>
            )}
          </ScrollView>
        </View>
      );
    } else if (activeTab === "home") {
      return (
        <View style={[styles.contentContainer, { backgroundColor: theme.colors.backgroundSecondary }]}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {playerRatings.home.map(renderPlayerCard)}
          </ScrollView>
        </View>
      );
    } else {
      return (
        <View style={[styles.contentContainer, { backgroundColor: theme.colors.backgroundSecondary }]}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {playerRatings.away.map(renderPlayerCard)}
          </ScrollView>
        </View>
      );
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Horizontal Tabs */}
      <View style={styles.tabsContainer}>
        {/* Hot Tab */}
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "hot" && [
              styles.activeTab,
              { backgroundColor: theme.colors.backgroundSecondary },
            ],
          ]}
          onPress={() => setActiveTab("hot")}
          activeOpacity={0.7}
        >
          <Flame
            size={18}
            color={activeTab === "hot" ? "#FF4444" : theme.colors.textSecondary}
          />
          <Text
            style={[
              styles.tabText,
              {
                color:
                  activeTab === "hot"
                    ? "#FF4444"
                    : theme.colors.textSecondary,
                fontWeight: activeTab === "hot" ? "700" : "500",
              },
            ]}
          >
            Hot
          </Text>
        </TouchableOpacity>

        {/* Home Team Tab */}
        <TouchableOpacity
          style={[
            styles.tab,
            styles.teamTab,
            activeTab === "home" && [
              styles.activeTab,
              { backgroundColor: theme.colors.backgroundSecondary },
            ],
          ]}
          onPress={() => setActiveTab("home")}
          activeOpacity={0.7}
        >
          {homeTeamLogo && (
            <Image
              source={{ uri: homeTeamLogo }}
              style={styles.tabTeamLogo}
            />
          )}
          <Text
            style={[
              styles.tabText,
              {
                color:
                  activeTab === "home"
                    ? "#FF4444"
                    : theme.colors.textSecondary,
                fontWeight: activeTab === "home" ? "700" : "500",
              },
            ]}
            numberOfLines={1}
          >
            {homeTeamName}
          </Text>
        </TouchableOpacity>

        {/* Away Team Tab */}
        <TouchableOpacity
          style={[
            styles.tab,
            styles.teamTab,
            activeTab === "away" && [
              styles.activeTab,
              { backgroundColor: theme.colors.backgroundSecondary },
            ],
          ]}
          onPress={() => setActiveTab("away")}
          activeOpacity={0.7}
        >
          {awayTeamLogo && (
            <Image
              source={{ uri: awayTeamLogo }}
              style={styles.tabTeamLogo}
            />
          )}
          <Text
            style={[
              styles.tabText,
              {
                color:
                  activeTab === "away"
                    ? "#FF4444"
                    : theme.colors.textSecondary,
                fontWeight: activeTab === "away" ? "700" : "500",
              },
            ]}
            numberOfLines={1}
          >
            {awayTeamName}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content with grouped background */}
      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    marginHorizontal: 0,
    marginTop: 0,
    marginBottom: 0,
    paddingTop: 16,
    paddingBottom: 16,
    minHeight: 200,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  refereeSection: {
    marginTop: 12,
  },
  tabsContainer: {
    flexDirection: "row",
    marginTop: 2,
    marginBottom: -4,
    marginHorizontal: 0,
    paddingHorizontal: 0,
    gap: 0,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 0,
    gap: 6,
    minHeight: 56,
  },
  teamTab: {
    flex: 1,
    justifyContent: "center",
  },
  activeTab: {
    // Background color set inline with theme
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter-SemiBold",
  },
  tabTeamLogo: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter-SemiBold",
    marginTop: 20,
    marginBottom: 12,
  },
  playerCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    position: "relative",
  },
  hotBadge: {
    position: "absolute",
    top: 0,
    left: 0,
    backgroundColor: "#FF4444",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderTopLeftRadius: 12,
    borderBottomRightRadius: 12,
    zIndex: 10,
  },
  hotText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "bold",
    fontFamily: "Inter-Bold",
  },
  playerCardContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  playerLeft: {
    flexDirection: "row",
    flex: 1,
    gap: 12,
  },
  headshotContainer: {
    position: "relative",
    width: 50,
    height: 50,
  },
  headshot: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#2A2A2A",
  },
  placeholderHeadshot: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#3A3A3A",
  },
  placeholderText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  teamLogoOverlay: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#1A1A1A",
  },
  playerInfo: {
    flex: 1,
    gap: 6,
  },
  playerName: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Inter-SemiBold",
  },
  starsContainer: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  starButton: {
    padding: 2,
  },
  timeEventsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  playTimeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  clockIcon: {
    marginRight: 2,
  },
  playTimeText: {
    fontSize: 12,
    fontFamily: "Inter-Regular",
  },
  subTimeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  subIcon: {
    width: 14,
    height: 14,
    resizeMode: "contain",
  },
  eventsContainer: {
    flexDirection: "row",
    gap: 6,
  },
  eventIcon: {
    width: 18,
    height: 18,
    resizeMode: "contain",
  },
  roleLabel: {
    fontSize: 11,
    fontFamily: "Inter-Regular",
    fontStyle: "italic",
  },
  playerRight: {
    alignItems: "flex-end",
    gap: 4,
  },
  ratingScore: {
    fontSize: 28,
    fontWeight: "bold",
    fontFamily: "Inter-Bold",
    color: "#FF4444",
  },
  fansRatings: {
    fontSize: 11,
    fontFamily: "Inter-Regular",
  },
});
