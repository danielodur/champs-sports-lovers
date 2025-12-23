import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ImageBackground,
  Dimensions,
  Modal,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "@/hooks/useTheme";
import { ArrowLeft, ChevronDown, Check } from "lucide-react-native";
import { createApiSportsService } from "@/services/api-sports-service";
import { getLeagueApiId } from "../[leagueId]";
import teamLogoService from "@/services/teamLogoService";

const { width } = Dimensions.get("window");

interface WeekSquadPlayer {
  id: string;
  name: string;
  position: string;
  rating: number;
  teamName: string;
  teamLogo: string;
  headshot: string;
  teamId?: string;
}

interface LeagueWeekSquadProps {
  leagueId: string;
  leagueName: string;
  round: number;
  season: string;
  theme: any;
  onBack: () => void;
  onRoundChange?: (round: string) => void;
  showRoundSelector?: boolean;
  setShowRoundSelector?: (show: boolean) => void;
  totalRounds?: number;
}

export default function LeagueWeekSquad({
  leagueId,
  leagueName,
  round,
  season,
  theme,
  onBack,
  onRoundChange,
  showRoundSelector = false,
  setShowRoundSelector,
  totalRounds = 38,
}: LeagueWeekSquadProps) {
  const router = useRouter();
  const [squadData, setSquadData] = useState<any>(null);
  const [loading, setLoading] = useState(false); // Start with false - no loading spinner
  const [formation, setFormation] = useState<string>("4-4-2"); // Default formation
  const [updateDate, setUpdateDate] = useState<string>("11-10");
  const [selectedWeek, setSelectedWeek] = useState<number>(round);
  const [showWeekModal, setShowWeekModal] = useState(false);
  
  const isDarkMode = theme.colors.background === "#2A2A2A" || theme.colors.text === "#FFFFFF";

  const apiSportsService = createApiSportsService();
  const apiLeagueId = getLeagueApiId(leagueId);

  useEffect(() => {
    setSelectedWeek(round);
    fetchWeekSquadData();
  }, [leagueId, round, season]);

  const fetchWeekSquadData = async () => {
    try {
      // Don't show loading spinner - display data immediately as it loads
      setLoading(false);
      
      if (!apiLeagueId) {
        throw new Error("League ID is required");
      }
      
      const seasonYear = parseInt(season.split("-")[0]);
      
      // Step 1: Fetch fixtures for the selected round/week (uses cached backend data)
      // Note: API-Sports.io uses round parameter in format "Regular Season - {roundNumber}"
      const matchesResponse = await apiSportsService.getFixtures(
        undefined, // teamId
        apiLeagueId,
        seasonYear,
        undefined, // date
        undefined, // status
        undefined, // live
      );
      
      // Filter matches by round if round parameter is not directly supported
      let filteredMatches = matchesResponse?.response || [];
      if (round && filteredMatches.length > 0) {
        filteredMatches = filteredMatches.filter((match: any) => {
          const matchRound = match.league?.round;
          return matchRound && matchRound.includes(round.toString());
        });
      }
      
      if (!filteredMatches || filteredMatches.length === 0) {
        throw new Error(`No matches found for round ${round} in season ${season}`);
      }
      
      // Step 2: Extract best performers from matches (optimized - limit to first 3 matches for speed)
      // Use only first 3 matches to reduce API calls and loading time
      const limitedMatches = filteredMatches.slice(0, 3);
      const squad = await generateSquadFromMatches(limitedMatches, round);
      
      if (!squad || !squad.players || squad.players.length === 0) {
        throw new Error("Failed to generate squad from matches");
      }
      
      // Detect formation from player positions
      const detectedFormation = detectFormation(squad.players) || squad.formation || "4-4-2";
      setSquadData(squad);
      setFormation(detectedFormation);
      
      // Extract date from latest match
      const latestMatch = filteredMatches[filteredMatches.length - 1];
      if (latestMatch.fixture?.date) {
        const matchDate = new Date(latestMatch.fixture.date);
        setUpdateDate(`${String(matchDate.getMonth() + 1).padStart(2, '0')}-${String(matchDate.getDate()).padStart(2, '0')}`);
      } else {
        const today = new Date();
        setUpdateDate(`${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`);
      }
    } catch (error) {
      console.error("Error fetching week squad data:", error);
      // Set error state - no mock data fallback
      setSquadData(null);
      setFormation("4-4-2");
      const today = new Date();
      setUpdateDate(`${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`);
    }
  };

  const generateSquadFromMatches = async (matches: any[], roundNumber: number): Promise<any> => {
    // API INTEGRATION READY: Extract best performers from match data
    try {
      const players: WeekSquadPlayer[] = [];
      const playerStatsMap = new Map<string, {
        playerId: number;
        playerName: string;
        position: string;
        teamId: number;
        teamName: string;
        teamLogo: string;
        goals: number;
        assists: number;
        rating: number;
        appearances: number;
        saves?: number; // For goalkeepers
        cleanSheets?: number; // For goalkeepers/defenders
      }>();

      // Process each match to extract player statistics
      for (const match of matches) {
        const fixtureId = match.fixture?.id;
        if (!fixtureId) continue;

        try {
          // Fetch player statistics for this match
          const playerStatsResponse = await apiSportsService.getMatchPlayerStats(fixtureId);
          
          if (playerStatsResponse?.response) {
            const homeTeamId = match.teams?.home?.id;
            const awayTeamId = match.teams?.away?.id;
            const homeTeamName = match.teams?.home?.name || "";
            const awayTeamName = match.teams?.away?.name || "";
            const homeTeamLogo = match.teams?.home?.logo || "";
            const awayTeamLogo = match.teams?.away?.logo || "";

            // Process home team players
            if (playerStatsResponse.response[0]?.players) {
              playerStatsResponse.response[0].players.forEach((player: any) => {
                const playerId = player.player?.id;
                const playerName = player.player?.name;
                if (!playerId || !playerName) return;

                const key = `${playerId}-${homeTeamId}`;
                const stats = player.statistics?.[0] || {};
                
                if (!playerStatsMap.has(key)) {
                  playerStatsMap.set(key, {
                    playerId,
                    playerName,
                    position: stats.games?.position || "Unknown",
                    teamId: homeTeamId,
                    teamName: homeTeamName,
                    teamLogo: teamLogoService.getOfficialTeamLogo(homeTeamName, leagueName, homeTeamLogo),
                    goals: stats.goals?.total || 0,
                    assists: stats.goals?.assists || 0,
                    rating: parseFloat(stats.games?.rating || "0"),
                    appearances: 1,
                    saves: stats.goals?.saves || 0,
                    cleanSheets: stats.goals?.conceded === 0 ? 1 : 0,
                  });
                } else {
                  const existing = playerStatsMap.get(key)!;
                  existing.goals += stats.goals?.total || 0;
                  existing.assists += stats.goals?.assists || 0;
                  existing.appearances += 1;
                  existing.rating = (existing.rating + parseFloat(stats.games?.rating || "0")) / 2;
                  if (stats.goals?.saves) existing.saves = (existing.saves || 0) + stats.goals.saves;
                  if (stats.goals?.conceded === 0) existing.cleanSheets = (existing.cleanSheets || 0) + 1;
                }
              });
            }

            // Process away team players
            if (playerStatsResponse.response[1]?.players) {
              playerStatsResponse.response[1].players.forEach((player: any) => {
                const playerId = player.player?.id;
                const playerName = player.player?.name;
                if (!playerId || !playerName) return;

                const key = `${playerId}-${awayTeamId}`;
                const stats = player.statistics?.[0] || {};
                
                if (!playerStatsMap.has(key)) {
                  playerStatsMap.set(key, {
                    playerId,
                    playerName,
                    position: stats.games?.position || "Unknown",
                    teamId: awayTeamId,
                    teamName: awayTeamName,
                    teamLogo: teamLogoService.getOfficialTeamLogo(awayTeamName, leagueName, awayTeamLogo),
                    goals: stats.goals?.total || 0,
                    assists: stats.goals?.assists || 0,
                    rating: parseFloat(stats.games?.rating || "0"),
                    appearances: 1,
                    saves: stats.goals?.saves || 0,
                    cleanSheets: stats.goals?.conceded === 0 ? 1 : 0,
                  });
                } else {
                  const existing = playerStatsMap.get(key)!;
                  existing.goals += stats.goals?.total || 0;
                  existing.assists += stats.goals?.assists || 0;
                  existing.appearances += 1;
                  existing.rating = (existing.rating + parseFloat(stats.games?.rating || "0")) / 2;
                  if (stats.goals?.saves) existing.saves = (existing.saves || 0) + stats.goals.saves;
                  if (stats.goals?.conceded === 0) existing.cleanSheets = (existing.cleanSheets || 0) + 1;
                }
              });
            }
          }
        } catch (matchError) {
          console.log(`Error processing match ${fixtureId}:`, matchError);
          continue; // Skip this match and continue with others
        }
      }

      // Convert map to array and sort by rating (best performers first)
      const allPlayers = Array.from(playerStatsMap.values())
        .sort((a, b) => {
          // Sort by rating, then by goals + assists
          const scoreA = a.rating + (a.goals * 2) + a.assists;
          const scoreB = b.rating + (b.goals * 2) + b.assists;
          return scoreB - scoreA;
        });

      // Select best 11 players (1 GK, 3-4 defenders, 3-4 midfielders, 2-3 forwards)
      const goalkeepers = allPlayers.filter(p => p.position === "Goalkeeper" || p.position === "G").slice(0, 1);
      const defenders = allPlayers.filter(p => 
        p.position === "Defender" || p.position === "D" || p.position.includes("Back")
      ).slice(0, 4);
      const midfielders = allPlayers.filter(p => 
        p.position === "Midfielder" || p.position === "M" || p.position.includes("midfield")
      ).slice(0, 4);
      const forwards = allPlayers.filter(p => 
        p.position === "Attacker" || p.position === "F" || p.position === "Forward" || p.position.includes("Wing")
      ).slice(0, 3);

      // Combine and map to WeekSquadPlayer format
      const selectedPlayers = [
        ...goalkeepers,
        ...defenders,
        ...midfielders,
        ...forwards,
      ].slice(0, 11);

      // Map to WeekSquadPlayer format
      const squadPlayers: WeekSquadPlayer[] = selectedPlayers.map((p, index) => ({
        id: p.playerId.toString(),
        name: p.playerName,
        position: p.position,
        rating: Math.min(10, Math.max(1, p.rating)), // Clamp rating between 1-10
        teamName: p.teamName,
        teamLogo: p.teamLogo,
        headshot: "", // Will be fetched separately if needed
      }));

      // Determine formation (e.g., "4-4-2", "3-4-3")
      const formation = `${defenders.length}-${midfielders.length}-${forwards.length}`;

      return {
        players: squadPlayers,
        formation,
        topPerformer: selectedPlayers[0] ? {
          id: selectedPlayers[0].playerId.toString(),
          name: selectedPlayers[0].playerName,
          team: selectedPlayers[0].teamName,
          position: selectedPlayers[0].position,
          rating: Math.min(10, Math.max(1, selectedPlayers[0].rating)),
          stats: {
            goals: selectedPlayers[0].goals,
            assists: selectedPlayers[0].assists,
            appearances: selectedPlayers[0].appearances,
          },
        } : null,
      };
    } catch (error) {
      console.error("Error generating squad from matches:", error);
      throw error; // Re-throw to be handled by caller
    }
  };


  const getRatingColor = (rating: number) => {
    if (rating >= 9.0) return "#FF4444";
    if (rating >= 8.5) return "#FF6B35";
    if (rating >= 8.0) return "#FFA500";
    if (rating >= 7.5) return "#FFD700";
    return "#90EE90";
  };

  const renderPlayerOnPitch = (player: WeekSquadPlayer, position: { x: number; y: number }) => {
    return (
      <View
        key={player.id}
        style={[
          styles.playerOnPitch,
          {
            position: "absolute",
            left: position.x,
            top: position.y,
          },
        ]}
      >
        {/* Player Headshot */}
        <View style={styles.playerHeadshotContainer}>
          {player.headshot ? (
            <Image source={{ uri: player.headshot }} style={styles.playerHeadshot} />
          ) : (
            <View style={styles.playerHeadshotPlaceholder}>
              <Text style={styles.playerInitials}>
                {player.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)}
              </Text>
            </View>
          )}
          
          {/* Team Logo Badge */}
          <View style={styles.teamLogoBadge}>
            {player.teamLogo ? (
              <Image source={{ uri: player.teamLogo }} style={styles.teamLogoSmall} />
            ) : (
              <View style={styles.teamLogoPlaceholder}>
                <Text style={styles.teamLogoText}>
                  {player.teamName
                    .split(" ")
                    .map((word) => word[0])
                    .join("")
                    .slice(0, 2)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Player Name */}
        <Text style={styles.playerNameOnPitch} numberOfLines={1}>
          {player.name}
        </Text>

        {/* Rating Badge */}
        <View
          style={[
            styles.ratingBadgeOnPitch,
            { backgroundColor: getRatingColor(player.rating) },
          ]}
        >
          <Text style={styles.ratingTextOnPitch}>{player.rating}</Text>
        </View>
      </View>
    );
  };

  // Formation data with percentage-based coordinates - optimized for better vertical spacing
  // X coordinates between 25-65% to ensure names/headshots NEVER touch left/right edges (very conservative margins)
  // CRITICAL: Right-edge players at 65% (not 68%) to account for team logo badge extension (20px beyond headshot)
  // Accounts for: pitch borderRadius (16px), badge extension, and safe visual margins
  // Y coordinates: GK at bottom (85%), Defenders (57-62%), Midfielders (32-42%), Strikers at TOP (4-7%)
  // All players shifted upwards by 2-3% to improve vertical positioning
  // Reference: Chinese app shows strikers at the very top of the pitch with minimal space above
  const formationData: { [key: string]: Array<{ x: number; y: number; id: string }> } = {
    "4-4-2": [
      { x: 50, y: 85, id: "gk" },
      { x: 25, y: 57, id: "lb" },
      { x: 35, y: 60, id: "cb1" },
      { x: 65, y: 60, id: "cb2" },
      { x: 65, y: 57, id: "rb" },
      { x: 25, y: 37, id: "lm" },
      { x: 35, y: 39, id: "cm1" },
      { x: 65, y: 39, id: "cm2" },
      { x: 65, y: 37, id: "rm" },
      { x: 35, y: 4, id: "lf" },
      { x: 65, y: 4, id: "rf" },
    ],
    "3-4-3": [
      { x: 50, y: 85, id: "gk" },
      { x: 30, y: 57, id: "cb1" },
      { x: 50, y: 60, id: "cb2" },
      { x: 70, y: 57, id: "cb3" },
      { x: 25, y: 42, id: "lwb" },
      { x: 40, y: 39, id: "cm1" },
      { x: 60, y: 39, id: "cm2" },
      { x: 65, y: 42, id: "rwb" },
      { x: 25, y: 5, id: "lw" },
      { x: 50, y: 3, id: "cf" },
      { x: 65, y: 5, id: "rw" },
    ],
    "4-3-3": [
      { x: 50, y: 85, id: "gk" },
      { x: 25, y: 57, id: "lb" },
      { x: 35, y: 60, id: "cb1" },
      { x: 65, y: 60, id: "cb2" },
      { x: 65, y: 57, id: "rb" },
      { x: 30, y: 39, id: "lm" },
      { x: 50, y: 41, id: "cm" },
      { x: 70, y: 39, id: "rm" },
      { x: 25, y: 5, id: "lw" },
      { x: 50, y: 3, id: "cf" },
      { x: 65, y: 5, id: "rw" },
    ],
    "4-2-3-1": [
      { x: 50, y: 85, id: "gk" },
      { x: 25, y: 57, id: "lb" },
      { x: 35, y: 60, id: "cb1" },
      { x: 65, y: 60, id: "cb2" },
      { x: 65, y: 57, id: "rb" },
      { x: 35, y: 47, id: "cdm1" },
      { x: 65, y: 47, id: "cdm2" },
      { x: 25, y: 29, id: "lam" },
      { x: 50, y: 29, id: "cam" },
      { x: 65, y: 29, id: "ram" },
      { x: 50, y: 4, id: "cf" },
    ],
    "3-5-2": [
      { x: 50, y: 85, id: "gk" },
      { x: 30, y: 57, id: "cb1" },
      { x: 50, y: 60, id: "cb2" },
      { x: 70, y: 57, id: "cb3" },
      { x: 25, y: 42, id: "lwb" },
      { x: 30, y: 37, id: "lm" },
      { x: 50, y: 39, id: "cm" },
      { x: 70, y: 37, id: "rm" },
      { x: 65, y: 42, id: "rwb" },
      { x: 35, y: 4, id: "lf" },
      { x: 65, y: 4, id: "rf" },
    ],
    "4-5-1": [
      { x: 50, y: 85, id: "gk" },
      { x: 25, y: 57, id: "lb" },
      { x: 35, y: 60, id: "cb1" },
      { x: 65, y: 60, id: "cb2" },
      { x: 65, y: 57, id: "rb" },
      { x: 25, y: 37, id: "lm" },
      { x: 35, y: 39, id: "cm1" },
      { x: 50, y: 41, id: "cm" },
      { x: 65, y: 39, id: "cm2" },
      { x: 65, y: 37, id: "rm" },
      { x: 50, y: 4, id: "cf" },
    ],
    "4-4-1-1": [
      { x: 50, y: 85, id: "gk" },
      { x: 25, y: 57, id: "lb" },
      { x: 35, y: 60, id: "cb1" },
      { x: 65, y: 60, id: "cb2" },
      { x: 65, y: 57, id: "rb" },
      { x: 25, y: 37, id: "lm" },
      { x: 38, y: 41, id: "cm1" },
      { x: 62, y: 41, id: "cm2" },
      { x: 65, y: 37, id: "rm" },
      { x: 50, y: 24, id: "cam" },
      { x: 50, y: 4, id: "cf" },
    ],
    "4-1-4-1": [
      { x: 50, y: 85, id: "gk" },
      { x: 25, y: 57, id: "lb" },
      { x: 35, y: 60, id: "cb1" },
      { x: 65, y: 60, id: "cb2" },
      { x: 65, y: 57, id: "rb" },
      { x: 50, y: 52, id: "dm" },
      { x: 25, y: 34, id: "lm" },
      { x: 36, y: 37, id: "cm1" },
      { x: 64, y: 37, id: "cm2" },
      { x: 65, y: 34, id: "rm" },
      { x: 50, y: 4, id: "cf" },
    ],
    "4-3-2-1": [
      { x: 50, y: 85, id: "gk" },
      { x: 25, y: 57, id: "lb" },
      { x: 35, y: 60, id: "cb1" },
      { x: 65, y: 60, id: "cb2" },
      { x: 65, y: 57, id: "rb" },
      { x: 30, y: 47, id: "lm" },
      { x: 50, y: 49, id: "cm" },
      { x: 70, y: 47, id: "rm" },
      { x: 35, y: 27, id: "lam" },
      { x: 65, y: 27, id: "ram" },
      { x: 50, y: 4, id: "cf" },
    ],
    "4-3-1-2": [
      { x: 50, y: 85, id: "gk" },
      { x: 25, y: 57, id: "lb" },
      { x: 35, y: 60, id: "cb1" },
      { x: 65, y: 60, id: "cb2" },
      { x: 65, y: 57, id: "rb" },
      { x: 30, y: 47, id: "lm" },
      { x: 50, y: 49, id: "cm" },
      { x: 70, y: 47, id: "rm" },
      { x: 50, y: 29, id: "cam" },
      { x: 35, y: 4, id: "lf" },
      { x: 65, y: 4, id: "rf" },
    ],
    "4-2-4": [
      { x: 50, y: 85, id: "gk" },
      { x: 25, y: 57, id: "lb" },
      { x: 35, y: 60, id: "cb1" },
      { x: 65, y: 60, id: "cb2" },
      { x: 65, y: 57, id: "rb" },
      { x: 38, y: 44, id: "cm1" },
      { x: 62, y: 44, id: "cm2" },
      { x: 25, y: 17, id: "lw" },
      { x: 38, y: 4, id: "lf" },
      { x: 62, y: 4, id: "rf" },
      { x: 65, y: 17, id: "rw" },
    ],
    "4-1-3-2": [
      { x: 50, y: 85, id: "gk" },
      { x: 25, y: 57, id: "lb" },
      { x: 35, y: 60, id: "cb1" },
      { x: 65, y: 60, id: "cb2" },
      { x: 65, y: 57, id: "rb" },
      { x: 50, y: 51, id: "dm" },
      { x: 25, y: 34, id: "lm" },
      { x: 50, y: 31, id: "cam" },
      { x: 65, y: 34, id: "rm" },
      { x: 35, y: 4, id: "lf" },
      { x: 65, y: 4, id: "rf" },
    ],
    "4-1-2-1-2": [
      { x: 50, y: 85, id: "gk" },
      { x: 25, y: 57, id: "lb" },
      { x: 35, y: 60, id: "cb1" },
      { x: 65, y: 60, id: "cb2" },
      { x: 65, y: 57, id: "rb" },
      { x: 50, y: 54, id: "dm" },
      { x: 30, y: 41, id: "cm1" },
      { x: 70, y: 41, id: "cm2" },
      { x: 50, y: 27, id: "cam" },
      { x: 35, y: 4, id: "lf" },
      { x: 65, y: 4, id: "rf" },
    ],
    "3-4-2-1": [
      { x: 50, y: 85, id: "gk" },
      { x: 30, y: 62, id: "cb1" },
      { x: 50, y: 65, id: "cb2" },
      { x: 70, y: 62, id: "cb3" },
      { x: 25, y: 44, id: "lwb" },
      { x: 38, y: 44, id: "cm1" },
      { x: 62, y: 44, id: "cm2" },
      { x: 65, y: 44, id: "rwb" },
      { x: 32, y: 24, id: "lam" },
      { x: 65, y: 24, id: "ram" },
      { x: 50, y: 4, id: "cf" },
    ],
    "3-4-1-2": [
      { x: 50, y: 85, id: "gk" },
      { x: 30, y: 62, id: "cb1" },
      { x: 50, y: 65, id: "cb2" },
      { x: 70, y: 62, id: "cb3" },
      { x: 25, y: 44, id: "lwb" },
      { x: 38, y: 44, id: "cm1" },
      { x: 62, y: 44, id: "cm2" },
      { x: 65, y: 44, id: "rwb" },
      { x: 50, y: 29, id: "cam" },
      { x: 35, y: 4, id: "lf" },
      { x: 65, y: 4, id: "rf" },
    ],
    "5-3-2": [
      { x: 50, y: 85, id: "gk" },
      { x: 25, y: 55, id: "lwb" },
      { x: 30, y: 62, id: "cb1" },
      { x: 50, y: 65, id: "cb2" },
      { x: 70, y: 62, id: "cb3" },
      { x: 65, y: 55, id: "rwb" },
      { x: 25, y: 41, id: "lm" },
      { x: 50, y: 44, id: "cm" },
      { x: 65, y: 41, id: "rm" },
      { x: 35, y: 4, id: "lf" },
      { x: 65, y: 4, id: "rf" },
    ],
    "5-4-1": [
      { x: 50, y: 85, id: "gk" },
      { x: 25, y: 55, id: "lwb" },
      { x: 30, y: 62, id: "cb1" },
      { x: 50, y: 65, id: "cb2" },
      { x: 70, y: 62, id: "cb3" },
      { x: 65, y: 55, id: "rwb" },
      { x: 25, y: 39, id: "lm" },
      { x: 40, y: 41, id: "cm1" },
      { x: 60, y: 41, id: "cm2" },
      { x: 65, y: 39, id: "rm" },
      { x: 50, y: 4, id: "cf" },
    ],
  };

  // Convert percentage coordinates to pixel coordinates for the pitch
  const convertPercentageToPixels = (percentX: number, percentY: number) => {
    // Pitch width matches screen width for full immersion
    const pitchWidth = width;
    const pitchHeight = 1100; // Beautiful longer height matching Chinese app screenshot
    
    // Player container is 80px wide, so we subtract 40px to center it
    // X coordinates use 25-65% range to ensure names/headshots NEVER touch left/right edges
    // CRITICAL: Team logo badge extends 20px beyond headshot (2px offset + 18px badge width)
    // This conservative range accounts for: badge extension, pitch borderRadius (16px), and safe visual margins
    const playerContainerWidth = 80;
    const xOffset = playerContainerWidth / 2;
    
    // Y offset centers the headshot (38px / 2 = 19px)
    const headshotHeight = 38;
    const yOffset = headshotHeight / 2;
    
    return {
      x: (percentX / 100) * pitchWidth - xOffset, // Center player container horizontally
      y: (percentY / 100) * pitchHeight - yOffset, // Center headshot vertically at the Y position
    };
  };

  // Smart formation detection based on player positions
  const detectFormation = (players: WeekSquadPlayer[]): string => {
    if (!players || players.length === 0) return "4-4-2";

    const gkCount = players.filter(p => 
      p.position?.toLowerCase().includes("goalkeeper") || 
      p.position?.toLowerCase() === "g" ||
      p.position?.toLowerCase() === "gk"
    ).length;

    const defCount = players.filter(p => 
      p.position?.toLowerCase().includes("defender") || 
      p.position?.toLowerCase() === "d" ||
      p.position?.toLowerCase().includes("back") ||
      p.position?.toLowerCase().includes("cb") ||
      p.position?.toLowerCase().includes("lb") ||
      p.position?.toLowerCase().includes("rb")
    ).length;

    const midCount = players.filter(p => 
      p.position?.toLowerCase().includes("midfielder") || 
      p.position?.toLowerCase() === "m" ||
      p.position?.toLowerCase().includes("cm") ||
      p.position?.toLowerCase().includes("dm") ||
      p.position?.toLowerCase().includes("lm") ||
      p.position?.toLowerCase().includes("rm") ||
      p.position?.toLowerCase().includes("cam") ||
      p.position?.toLowerCase().includes("winger")
    ).length;

    const fwdCount = players.filter(p => 
      p.position?.toLowerCase().includes("attacker") || 
      p.position?.toLowerCase() === "f" ||
      p.position?.toLowerCase().includes("forward") ||
      p.position?.toLowerCase().includes("st") ||
      p.position?.toLowerCase().includes("cf") ||
      p.position?.toLowerCase().includes("lw") ||
      p.position?.toLowerCase().includes("rw")
    ).length;

    // Determine formation based on counts - All 17 official formations
    // 4-back formations
    if (defCount === 4 && midCount === 4 && fwdCount === 2) {
      // Check for 4-4-1-1 vs 4-4-2
      const hasCAM = players.some(p => 
        p.position?.toLowerCase().includes("cam") || 
        p.position?.toLowerCase().includes("attacking midfielder")
      );
      if (hasCAM) return "4-4-1-1";
      return "4-4-2";
    }
    if (defCount === 4 && midCount === 3 && fwdCount === 3) {
      // Check for 4-3-2-1 vs 4-3-3
      const hasTwoAMs = players.filter(p => 
        p.position?.toLowerCase().includes("lam") || 
        p.position?.toLowerCase().includes("ram") ||
        p.position?.toLowerCase().includes("attacking midfielder")
      ).length >= 2;
      if (hasTwoAMs) return "4-3-2-1";
      return "4-3-3";
    }
    if (defCount === 4 && midCount === 3 && fwdCount === 2) {
      // Check for 4-3-1-2
      const hasCAM = players.some(p => 
        p.position?.toLowerCase().includes("cam") || 
        p.position?.toLowerCase().includes("attacking midfielder")
      );
      if (hasCAM) return "4-3-1-2";
    }
    if (defCount === 4 && midCount === 2 && fwdCount === 4) return "4-2-4";
    if (defCount === 4 && midCount === 2 && fwdCount === 3) {
      // Check for 4-2-3-1
      const hasCAM = players.some(p => 
        p.position?.toLowerCase().includes("cam") || 
        p.position?.toLowerCase().includes("lam") ||
        p.position?.toLowerCase().includes("ram") ||
        p.position?.toLowerCase().includes("attacking midfielder")
      );
      if (hasCAM) return "4-2-3-1";
    }
    if (defCount === 4 && midCount === 5 && fwdCount === 1) {
      // Check for 4-1-4-1 vs 4-5-1
      const hasDM = players.some(p => 
        p.position?.toLowerCase().includes("dm") || 
        p.position?.toLowerCase().includes("defensive midfielder") ||
        p.position?.toLowerCase().includes("cdm")
      );
      if (hasDM) return "4-1-4-1";
      return "4-5-1";
    }
    if (defCount === 4 && midCount === 1 && fwdCount === 3) {
      // Check for 4-1-3-2
      const hasDM = players.some(p => 
        p.position?.toLowerCase().includes("dm") || 
        p.position?.toLowerCase().includes("defensive midfielder")
      );
      if (hasDM) return "4-1-3-2";
    }
    if (defCount === 4 && midCount === 1 && fwdCount === 2) {
      // Check for 4-1-2-1-2
      const hasDM = players.some(p => 
        p.position?.toLowerCase().includes("dm") || 
        p.position?.toLowerCase().includes("defensive midfielder")
      );
      const hasCAM = players.some(p => 
        p.position?.toLowerCase().includes("cam") || 
        p.position?.toLowerCase().includes("attacking midfielder")
      );
      if (hasDM && hasCAM) return "4-1-2-1-2";
    }
    
    // 3-back formations
    if (defCount === 3 && midCount === 4 && fwdCount === 3) {
      // Check for 3-4-2-1 vs 3-4-3
      const hasTwoAMs = players.filter(p => 
        p.position?.toLowerCase().includes("lam") || 
        p.position?.toLowerCase().includes("ram") ||
        p.position?.toLowerCase().includes("attacking midfielder")
      ).length >= 2;
      if (hasTwoAMs) return "3-4-2-1";
      return "3-4-3";
    }
    if (defCount === 3 && midCount === 4 && fwdCount === 2) {
      // Check for 3-4-1-2
      const hasCAM = players.some(p => 
        p.position?.toLowerCase().includes("cam") || 
        p.position?.toLowerCase().includes("attacking midfielder")
      );
      if (hasCAM) return "3-4-1-2";
    }
    if (defCount === 3 && midCount === 5 && fwdCount === 2) return "3-5-2";
    
    // 5-back formations
    if (defCount === 5 && midCount === 3 && fwdCount === 2) return "5-3-2";
    if (defCount === 5 && midCount === 4 && fwdCount === 1) return "5-4-1";

    // Default fallback
    return "4-4-2";
  };

  // Map players to formation positions intelligently
  const mapPlayersToFormation = (players: WeekSquadPlayer[], formationName: string) => {
    const formationPositions = formationData[formationName] || formationData["4-4-2"];
    const mappedPlayers: { [key: string]: WeekSquadPlayer | null } = {};

    // Initialize all positions as empty
    formationPositions.forEach(pos => {
      mappedPlayers[pos.id] = null;
    });

    // Sort players by rating (best first)
    const sortedPlayers = [...players].sort((a, b) => b.rating - a.rating);

    // Map goalkeeper first
    const gk = sortedPlayers.find(p => 
      p.position?.toLowerCase().includes("goalkeeper") || 
      p.position?.toLowerCase() === "g" ||
      p.position?.toLowerCase() === "gk"
    );
    if (gk) {
      mappedPlayers["gk"] = gk;
      sortedPlayers.splice(sortedPlayers.indexOf(gk), 1);
    }

    // Map defenders
    const defenders = sortedPlayers.filter(p => 
      p.position?.toLowerCase().includes("defender") || 
      p.position?.toLowerCase() === "d" ||
      p.position?.toLowerCase().includes("back") ||
      p.position?.toLowerCase().includes("cb") ||
      p.position?.toLowerCase().includes("lb") ||
      p.position?.toLowerCase().includes("rb")
    ).slice(0, formationPositions.filter(p => p.id.includes("cb") || p.id.includes("lb") || p.id.includes("rb") || p.id.includes("lwb") || p.id.includes("rwb")).length);

    const defPositions = formationPositions.filter(p => 
      p.id.includes("cb") || p.id.includes("lb") || p.id.includes("rb") || p.id.includes("lwb") || p.id.includes("rwb")
    );
    defenders.forEach((def, index) => {
      if (defPositions[index]) {
        mappedPlayers[defPositions[index].id] = def;
        sortedPlayers.splice(sortedPlayers.indexOf(def), 1);
      }
    });

    // Map midfielders
    const midfielders = sortedPlayers.filter(p => 
      p.position?.toLowerCase().includes("midfielder") || 
      p.position?.toLowerCase() === "m" ||
      p.position?.toLowerCase().includes("cm") ||
      p.position?.toLowerCase().includes("dm") ||
      p.position?.toLowerCase().includes("lm") ||
      p.position?.toLowerCase().includes("rm") ||
      p.position?.toLowerCase().includes("cam") ||
      p.position?.toLowerCase().includes("winger")
    ).slice(0, formationPositions.filter(p => 
      p.id.includes("cm") || p.id.includes("dm") || p.id.includes("lm") || p.id.includes("rm") || 
      p.id.includes("cam") || p.id.includes("lam") || p.id.includes("ram")
    ).length);

    const midPositions = formationPositions.filter(p => 
      p.id.includes("cm") || p.id.includes("dm") || p.id.includes("lm") || p.id.includes("rm") || 
      p.id.includes("cam") || p.id.includes("lam") || p.id.includes("ram")
    );
    midfielders.forEach((mid, index) => {
      if (midPositions[index]) {
        mappedPlayers[midPositions[index].id] = mid;
        sortedPlayers.splice(sortedPlayers.indexOf(mid), 1);
      }
    });

    // Map forwards
    const forwards = sortedPlayers.filter(p => 
      p.position?.toLowerCase().includes("attacker") || 
      p.position?.toLowerCase() === "f" ||
      p.position?.toLowerCase().includes("forward") ||
      p.position?.toLowerCase().includes("st") ||
      p.position?.toLowerCase().includes("cf") ||
      p.position?.toLowerCase().includes("lw") ||
      p.position?.toLowerCase().includes("rw")
    ).slice(0, formationPositions.filter(p => 
      p.id.includes("st") || p.id.includes("cf") || p.id.includes("lw") || p.id.includes("rw") || 
      p.id.includes("lf") || p.id.includes("rf")
    ).length);

    const fwdPositions = formationPositions.filter(p => 
      p.id.includes("st") || p.id.includes("cf") || p.id.includes("lw") || p.id.includes("rw") || 
      p.id.includes("lf") || p.id.includes("rf")
    );
    forwards.forEach((fwd, index) => {
      if (fwdPositions[index]) {
        mappedPlayers[fwdPositions[index].id] = fwd;
        sortedPlayers.splice(sortedPlayers.indexOf(fwd), 1);
      }
    });

    return mappedPlayers;
  };

  // Get formation positions in pixel coordinates
  const getFormationPositions = () => {
    const formationToUse = formation || "4-4-2";
    const formationPositions = formationData[formationToUse] || formationData["4-4-2"];
    const positions: { [key: string]: { x: number; y: number } } = {};

    formationPositions.forEach(pos => {
      const pixelPos = convertPercentageToPixels(pos.x, pos.y);
      positions[pos.id] = pixelPos;
    });

    return positions;
  };

  // Show error state if no data (no loading screen - data displays instantly)
  if (!squadData) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <ArrowLeft size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
              Squad of the Week
            </Text>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            No squad data available for Week {round}
          </Text>
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary, marginTop: 8, fontSize: 14 }]}>
            Please try selecting a different week or check your API connection.
          </Text>
        </View>
      </View>
    );
  }
  
  // Get players array (handle both old and new data structures)
  const playersArray: WeekSquadPlayer[] = squadData.players?.length 
    ? squadData.players 
    : [
        ...(squadData.players?.goalkeeper ? [squadData.players.goalkeeper] : []),
        ...(squadData.players?.defenders || []),
        ...(squadData.players?.midfielders || []),
        ...(squadData.players?.forwards || []),
      ];
  
  // Use current formation
  const currentFormation = formation || "4-4-2";
  
  // Ensure we have at least some players
  if (!playersArray || playersArray.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <ArrowLeft size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
              Squad of the Week
            </Text>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            No players found for Week {round}
          </Text>
        </View>
      </View>
    );
  }

  // Map players to formation positions
  const mappedPlayers = mapPlayersToFormation(playersArray, currentFormation);
  const positions = getFormationPositions();
  const currentFormationPositions = formationData[currentFormation] || formationData["4-4-2"];

  // Render white circle for empty position
  const renderEmptyPosition = (positionId: string, position: { x: number; y: number }) => {
    return (
      <View
        key={`empty-${positionId}`}
        style={[
          styles.emptyPositionCircle,
          {
            position: "absolute",
            left: position.x,
            top: position.y,
            backgroundColor: isDarkMode 
              ? "rgba(255, 255, 255, 0.15)" 
              : "rgba(255, 255, 255, 0.9)",
            borderColor: isDarkMode 
              ? "rgba(255, 255, 255, 0.3)" 
              : "rgba(128, 128, 128, 0.3)",
          },
        ]}
      />
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            Squad of the Week
          </Text>
          <TouchableOpacity 
            style={styles.roundSelector}
            onPress={() => setShowWeekModal(true)}
          >
            <Text style={[styles.roundSelectorText, { color: theme.colors.text }]}>
              Week {selectedWeek}
            </Text>
            <ChevronDown size={16} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Football Pitch */}
        <View style={styles.pitchContainer}>
          <ImageBackground
            source={require("../../../../modules/discover/assets/football_pitch.png")}
            style={styles.pitch}
            imageStyle={styles.pitchImage}
            resizeMode="cover"
          >
            {/* Render white circles for all formation positions */}
            {currentFormationPositions.map((pos) => {
              const pixelPos = convertPercentageToPixels(pos.x, pos.y);
              // Only show empty circle if position is not filled
              if (!mappedPlayers[pos.id]) {
                return renderEmptyPosition(pos.id, pixelPos);
              }
              return null;
            })}

            {/* Render players on their mapped positions */}
            {currentFormationPositions.map((pos) => {
              const player = mappedPlayers[pos.id];
              if (player) {
                const pixelPos = convertPercentageToPixels(pos.x, pos.y);
                return renderPlayerOnPitch(player, pixelPos);
              }
              return null;
            })}
          </ImageBackground>

          {/* Formation and Date Info */}
          <View style={styles.pitchInfo}>
            <Text style={styles.formationText}>
              Formation: {currentFormation}
            </Text>
            <Text style={styles.updateDateText}>
              Update Date: {updateDate}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Week Selector Modal - Matching league-matches.tsx design */}
      <Modal
        visible={showWeekModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowWeekModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setShowWeekModal(false)}
          />

          <View
            style={[
              styles.weekModal,
              {
                backgroundColor: theme.colors.background,
                borderTopColor: isDarkMode ? "#444" : "#E0E0E0",
              },
            ]}
          >
            {/* Drag Handle */}
            <View
              style={{
                width: 40,
                height: 4,
                backgroundColor: "rgba(0,0,0,0.3)",
                borderRadius: 2,
                alignSelf: "center",
                marginTop: 8,
                marginBottom: 16,
              }}
            />

            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                Select Week
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowWeekModal(false)}
              >
                <Text
                  style={[
                    styles.closeButtonText,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  ×
                </Text>
              </TouchableOpacity>
            </View>

            {/* Weeks List */}
            <ScrollView
              style={styles.weeksContainer}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={styles.weeksContentContainer}
              bounces={true}
              decelerationRate="normal"
              scrollEventThrottle={16}
            >
              {Array.from({ length: totalRounds }, (_, i) => i + 1).map((week) => {
                const isSelected = selectedWeek === week;
                return (
                  <TouchableOpacity
                    key={week}
                    style={[
                      styles.weekOption,
                      isSelected && {
                        backgroundColor: isDarkMode
                          ? "rgba(255, 107, 53, 0.15)"
                          : "rgba(255, 107, 53, 0.08)",
                        borderLeftWidth: 3,
                        borderLeftColor: "#FF6B35",
                      },
                    ]}
                    onPress={() => {
                      setSelectedWeek(week);
                      onRoundChange?.(week.toString());
                      setShowWeekModal(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.weekOptionText,
                        {
                          color: isSelected ? "#FF6B35" : theme.colors.text,
                          fontWeight: isSelected ? "700" : "400",
                        },
                      ]}
                    >
                      Week {week}
                    </Text>
                    {isSelected && (
                      <Check size={20} color="#FF6B35" style={styles.checkIcon} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => setShowWeekModal(false)}
              >
                <Text style={[styles.actionButtonText, { color: theme.colors.textSecondary }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, { backgroundColor: "#FF6B35" }]}
                onPress={() => setShowWeekModal(false)}
              >
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: "Inter-Medium",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(128,128,128,0.2)",
  },
  backButton: {
    marginRight: 12,
  },
  headerTitleContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    fontFamily: "Inter-SemiBold",
  },
  roundSelector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  roundSelectorText: {
    fontSize: 14,
    marginRight: 4,
    fontFamily: "Inter-Medium",
  },
  content: {
    flex: 1,
  },
  pitchContainer: {
    margin: 0, // Removed margin to touch edges
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  pitch: {
    width: width, // Full width
    height: 1100, // Beautiful longer height matching Chinese app screenshot - prominent and elegant
    borderRadius: 0, // No radius since touching edges
    position: "relative",
    overflow: "visible", // Changed to visible so players can extend slightly beyond pitch edges
    justifyContent: "center",
    alignItems: "center",
    // No backgroundColor - let the PNG image show through
  },
  pitchImage: {
    borderRadius: 16,
  },
  playerOnPitch: {
    alignItems: "center",
    width: 80, // Increased from 70 to give more breathing room
  },
  playerHeadshotContainer: {
    position: "relative",
    marginBottom: 4,
  },
  playerHeadshot: {
    width: 38, // Reduced from 50 to 38 for more spacious look
    height: 38, // Reduced from 50 to 38 for more spacious look
    borderRadius: 19, // Adjusted for new size
    borderWidth: 2,
    borderColor: "white",
  },
  playerHeadshotPlaceholder: {
    width: 38, // Reduced from 50 to 38 for more spacious look
    height: 38, // Reduced from 50 to 38 for more spacious look
    borderRadius: 19, // Adjusted for new size
    borderWidth: 2,
    borderColor: "white",
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  playerInitials: {
    color: "white",
    fontSize: 14, // Slightly reduced from 16 to match smaller headshot
    fontWeight: "bold",
    fontFamily: "Inter-Bold",
  },
  teamLogoBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 18, // Slightly reduced from 20
    height: 18, // Slightly reduced from 20
    borderRadius: 9, // Adjusted for new size
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#4CAF50",
  },
  teamLogoSmall: {
    width: 14, // Slightly reduced from 16
    height: 14, // Slightly reduced from 16
    borderRadius: 7, // Adjusted for new size
  },
  teamLogoPlaceholder: {
    width: 14, // Slightly reduced from 16
    height: 14, // Slightly reduced from 16
    borderRadius: 7, // Adjusted for new size
    backgroundColor: "#4CAF50",
    alignItems: "center",
    justifyContent: "center",
  },
  teamLogoText: {
    color: "white",
    fontSize: 8,
    fontWeight: "bold",
  },
  emptyPositionCircle: {
    width: 38, // Reduced from 50 to match new headshot size
    height: 38, // Reduced from 50 to match new headshot size
    borderRadius: 19, // Adjusted for new size
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  playerNameOnPitch: {
    color: "white",
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 4,
    fontFamily: "Inter-SemiBold",
    maxWidth: 80, // Increased from 70 to match container width
  },
  ratingBadgeOnPitch: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: 30,
    alignItems: "center",
  },
  ratingTextOnPitch: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
    fontFamily: "Inter-Bold",
  },
  pitchInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    paddingHorizontal: 4,
  },
  formationText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter-SemiBold",
  },
  updateDateText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    fontFamily: "Inter-Regular",
  },
  // Week Modal Styles - Matching league-matches.tsx
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "transparent",
  },
  weekModal: {
    height: "60%",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 34,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(128,128,128,0.2)",
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
    backgroundColor: "rgba(128,128,128,0.1)",
  },
  closeButtonText: {
    fontSize: 20,
  },
  weeksContainer: {
    flex: 1,
    paddingVertical: 0,
  },
  weeksContentContainer: {
    paddingBottom: 16,
  },
  weekOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(128,128,128,0.1)",
    position: "relative",
  },
  weekOptionText: {
    fontSize: 18,
    textAlign: "center",
  },
  checkIcon: {
    position: "absolute",
    right: 20,
  },
  modalFooter: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(128,128,128,0.2)",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(128,128,128,0.1)",
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
