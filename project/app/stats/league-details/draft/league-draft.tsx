import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
  ImageBackground,
  ActivityIndicator,
  Modal,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "@/hooks/useTheme";
import {
  ChevronDown,
  ChevronRight,
  Euro,
  Trophy,
  Check,
} from "lucide-react-native";
import { formatEuro, removeCurrencySymbol } from "@/utils/currency";
import { createApiSportsService } from "@/services/api-sports-service";
import { fetchLeagueInfo, fetchLeagueStandings } from "@/services/leagueStandingsService";
import { getLeagueApiId } from "../[leagueId]";
import teamLogoService from "@/services/teamLogoService";

const { width } = Dimensions.get("window");

interface Player {
  id: string;
  name: string;
  position: string;
  rating: number;
  team: string;
  teamLogo: string;
  headshot: string;
}

interface Team {
  id: string;
  name: string;
  logo: string;
  titles: number;
  description: string;
}

interface LeagueStats {
  totalRounds: number;
  participatingTeams: number;
  totalPlayers: number;
  foreignPlayers: number;
  totalMarketValue: string;
  currentRound: number;
  seasonStart: string;
  seasonEnd: string;
}

interface LeagueDraftProps {
  leagueId: string;
  leagueName: string;
  season: string;
  theme: any;
  apiLeagueId?: number | null; // API ID passed from parent
  sport?: string; // Optional sport parameter for basketball/football differentiation
}

export default function LeagueDraft({
  leagueId,
  leagueName,
  season,
  theme,
  apiLeagueId: apiLeagueIdProp,
  sport = "football",
}: LeagueDraftProps) {
  const router = useRouter();
  const [selectedRound, setSelectedRound] = useState<number>(1);
  const [showRoundSelector, setShowRoundSelector] = useState(false);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [topRivals, setTopRivals] = useState<Team[]>([]);
  const [promotedTeams, setPromotedTeams] = useState<Team[]>([]);
  const [lowerLeague, setLowerLeague] = useState<Team | null>(null);
  const [leagueStats, setLeagueStats] = useState<LeagueStats | null>(null);
  // Squad of the week data
  const [squadData, setSquadData] = useState<any>(null);
  const [formation, setFormation] = useState<string>("4-4-2");
  const [updateDate, setUpdateDate] = useState<string>("11-10");

  const apiSportsService = createApiSportsService();
  // Use provided API ID or try to resolve it
  const apiLeagueId = apiLeagueIdProp !== undefined ? apiLeagueIdProp : getLeagueApiId(leagueId);
  const isDarkMode = theme.colors.background === "#2A2A2A" || theme.colors.text === "#FFFFFF";

  // Log league ID mapping for debugging
  console.log(`🏆 [LeagueDraft] Component initialized:`, {
    leagueId,
    apiLeagueId,
    leagueName,
    season,
    hasApiId: !!apiLeagueId,
  });

  useEffect(() => {
    fetchLeagueDraftData();
    // Reset selected round to 1 when season changes
    setSelectedRound(1);
  }, [leagueId, season]);

  useEffect(() => {
    fetchWeekSquadData();
  }, [selectedRound, leagueId, season]);

  const fetchLeagueDraftData = async () => {
    try {
      setLoading(true);

      // Special handling for Uganda Premier League (no API ID available)
      if (leagueId === "uganda-premier-league" && !apiLeagueId) {
        console.log("🇺🇬 [LeagueDraft] Fetching Uganda Premier League data using alternative sources...");
        
        // Use fallback data for Uganda Premier League
        const seasonYear = parseInt(season.split("-")[0]);
        
        // Set basic league stats for Uganda Premier League
        setLeagueStats({
          totalRounds: 30,
          participatingTeams: 16,
          totalPlayers: 400, // Estimate: 16 teams * 25 players
          foreignPlayers: 160, // Estimate: ~40% foreign
          totalMarketValue: formatEuro("0B"),
          currentRound: 1,
          seasonStart: "08/16",
          seasonEnd: "05/25",
        });

        // Set top rivals (common Uganda Premier League teams)
        const ugandaTopTeams: Team[] = [
          {
            id: "1",
            name: "Vipers SC",
            logo: teamLogoService.getOfficialTeamLogo("Vipers SC", "Uganda Premier League", ""),
            titles: 5,
            description: "Defending Champion (5)",
          },
          {
            id: "2",
            name: "KCCA FC",
            logo: teamLogoService.getOfficialTeamLogo("KCCA FC", "Uganda Premier League", ""),
            titles: 13,
            description: "Most Titles (13)",
          },
        ];
        setTopRivals(ugandaTopTeams);

        // Set empty data structure
        setData({
          bestLineup: [],
          leagueStats: {
            totalRounds: 30,
            participatingTeams: 16,
            totalPlayers: 400,
            foreignPlayers: 160,
            totalMarketValue: formatEuro("0B"),
            currentRound: 1,
            seasonStart: "08/16",
            seasonEnd: "05/25",
          },
        });

        setLoading(false);
        return;
      }

      if (!apiLeagueId) {
        console.warn(`⚠️ [LeagueDraft] No API league ID found for leagueId: "${leagueId}"`);
        console.warn(`⚠️ [LeagueDraft] This league may not be available in API-Football`);
        console.warn(`⚠️ [LeagueDraft] Using fallback data for league: ${leagueName}`);
        
        // Use fallback data instead of throwing error
        setData({
          teams: [],
          players: [],
          stats: {
            totalRounds: 0,
            participatingTeams: 0,
            totalPlayers: 0,
            foreignPlayers: 0,
            totalMarketValue: "€0",
            currentRound: 0,
            seasonStart: "",
            seasonEnd: "",
          },
        });
        setTopRivals([]);
        setPromotedTeams([]);
        setLowerLeague(null);
        setLeagueStats({
          totalRounds: 0,
          participatingTeams: 0,
          totalPlayers: 0,
          foreignPlayers: 0,
          totalMarketValue: "€0",
          currentRound: 0,
          seasonStart: "",
          seasonEnd: "",
        });
        setLoading(false);
        return;
      }

      const seasonYear = parseInt(season.split("-")[0]);
      console.log(`📅 [LeagueDraft] Parsed seasonYear: ${seasonYear} from season: ${season}`);

      console.log(`📊 [LeagueDraft] About to fetch league info...`);
      console.log(`📊 [LeagueDraft] Parameters: leagueId=${leagueId}, apiLeagueId=${apiLeagueId}, season=${season}, seasonYear=${seasonYear}`);

      // Fetch league info to get basic stats
      console.log(`📊 [LeagueDraft] Calling fetchLeagueInfo(${apiLeagueId})...`);
      const leagueInfo = await fetchLeagueInfo(apiLeagueId);
      console.log(`📊 [LeagueDraft] fetchLeagueInfo returned:`, leagueInfo ? 'SUCCESS' : 'NULL');
      
      if (!leagueInfo) {
        console.error(`❌ [LeagueDraft] Failed to fetch league information for apiLeagueId: ${apiLeagueId}`);
        console.error(`❌ [LeagueDraft] League: ${leagueName} (${leagueId})`);
        console.error(`❌ [LeagueDraft] API returned empty response (status 200 but no data)`);
        console.error(`❌ [LeagueDraft] This usually means:`);
        console.error(`   1. League ID ${apiLeagueId} doesn't exist in API-Football`);
        console.error(`   2. League data not available for this specific league`);
        console.error(`   3. API structure changed - league may need different ID`);
        console.error(`💡 [LeagueDraft] Try a different league or check API-Football documentation`);
        throw new Error(`League "${leagueName}" (ID: ${apiLeagueId}) not available in API-Football`);
      }

      console.log(`✅ [LeagueDraft] Successfully fetched league info: ${leagueInfo.league?.name || 'Unknown'}`);

      // Get current season
      const currentSeason = leagueInfo.seasons?.find(s => s.current) || leagueInfo.seasons?.[0];

      // Fetch standings to get teams and calculate stats
      console.log(`📊 [LeagueDraft] Fetching ${sport} standings for apiLeagueId: ${apiLeagueId}, seasonYear: ${seasonYear}`);
      const standingsResponse = await fetchLeagueStandings(apiLeagueId, seasonYear, false, sport);
      const standings = standingsResponse?.groups?.[0]?.standings || [];
      
      console.log(`📊 [LeagueDraft] Standings response:`, {
        hasResponse: !!standingsResponse,
        hasGroups: !!standingsResponse?.groups,
        standingsCount: standings.length,
      });
      
      if (standings.length === 0) {
        console.warn(`⚠️ [LeagueDraft] No standings data available for apiLeagueId: ${apiLeagueId}, seasonYear: ${seasonYear}`);
        console.warn(`⚠️ [LeagueDraft] This could mean:`);
        console.warn(`   1. Standings not available for this season`);
        console.warn(`   2. API rate limit exceeded`);
        console.warn(`   3. League doesn't have standings data`);
        // Don't throw error - gracefully handle missing data
        setTopRivals([]);
        setPromotedTeams([]);
        setLowerLeague(null);
        setLeagueStats(null);
        setData(null);
        setLoading(false);
        return;
      }

      console.log(`✅ [LeagueDraft] Successfully fetched ${standings.length} teams from standings`);

      // Get top two teams for rivals - with safety checks
      const topTwo = standings
        .slice(0, 2)
        .filter((team: any) => team?.team?.id && team?.team?.name) // Filter out invalid teams
        .map((team: any, index: number) => {
          // Safely get team logo with fallback
          const teamLogo = teamLogoService.getOfficialTeamLogo(
            team?.team?.name || "",
            leagueName,
            team?.team?.logo || ""
          ) || ""; // Ensure we always have a string, even if empty
          
          // Get championship count from team data if available, otherwise use 0
          let titles = 0;
          const teamNameLower = (team?.team?.name || "").toLowerCase();
          if (teamNameLower.includes("real madrid")) titles = 36;
          else if (teamNameLower.includes("barcelona")) titles = 28;
          else if (teamNameLower.includes("manchester united")) titles = 20;
          else if (teamNameLower.includes("liverpool")) titles = 19;
          else if (teamNameLower.includes("arsenal")) titles = 13;
          // Could fetch actual titles from API if available

          return {
            id: (team?.team?.id || "").toString(),
            name: team?.team?.name || "Unknown Team",
            logo: teamLogo,
            titles: titles,
            description: index === 0 
              ? `Defending Champion (${titles})` 
              : `Most Titles (${titles})`,
          };
        });
      
      // Only set topRivals if we have at least 2 valid teams
      if (topTwo.length >= 2) {
        setTopRivals(topTwo);
      } else {
        console.warn(`⚠️ [LeagueDraft] Not enough valid teams for topRivals: ${topTwo.length}`);
        setTopRivals([]);
      }

      // Calculate league-wide stats from real data
      // Note: These are estimates as full player data requires additional API calls
      const totalPlayers = standings.length * 25; // Estimate: ~25 players per team
      const foreignPlayers = Math.floor(totalPlayers * 0.4); // Estimate: ~40% foreign
      // Market value would require additional API calls to team/player endpoints

      // Get season dates
      const seasonStart = currentSeason?.start || "";
      const seasonEnd = currentSeason?.end || "";

            setLeagueStats({
        totalRounds: 38, // Default, could be calculated from fixtures
        participatingTeams: standings.length,
        totalPlayers: totalPlayers,
        foreignPlayers: foreignPlayers,
        totalMarketValue: formatEuro("0B"), // Would need additional API call
        currentRound: 1, // Would need to calculate from fixtures
        seasonStart: seasonStart ? new Date(seasonStart).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit" }) : "08/16",
        seasonEnd: seasonEnd ? new Date(seasonEnd).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit" }) : "05/25",
      });

      // Set empty data structure (no mock data)
      setData({
        bestLineup: [],
        leagueStats: leagueStats || {
          totalRounds: 38,
          participatingTeams: standings.length,
          totalPlayers: totalPlayers,
          foreignPlayers: foreignPlayers,
          totalMarketValue: formatEuro("0B"),
          currentRound: 1,
          seasonStart: "08/16",
          seasonEnd: "05/25",
        },
      });
      
      // Detect promoted teams and lower league
      detectPromotedTeams();
      detectLowerLeague();
    } catch (error) {
      console.error("Error fetching league draft data:", error);
      // Set error state - no mock data fallback
      setData(null);
      setTopRivals([]);
      setLeagueStats(null);
      setPromotedTeams([]);
      setLowerLeague(null);
    } finally {
      setLoading(false);
    }
  };


  const detectPromotedTeams = async () => {
    // Smart detection of promoted teams based on league
    const promoted: Team[] = [];
    
    // Map of leagues to their promoted teams
    const promotedTeamsMap: { [key: string]: { id: string; name: string }[] } = {
      "la-liga": [
        { id: "elche", name: "Elche CF" },
        { id: "levante", name: "Levante UD" },
        { id: "oviedo", name: "Real Oviedo" },
      ],
      "premier-league": [
        { id: "leicester", name: "Leicester City" },
        { id: "ipswich", name: "Ipswich Town" },
        { id: "southampton", name: "Southampton" },
      ],
      "serie-a": [
        { id: "como", name: "Como 1907" },
        { id: "venezia", name: "Venezia FC" },
        { id: "parma", name: "Parma Calcio 1913" },
      ],
      "bundesliga": [
        { id: "st-pauli", name: "FC St. Pauli" },
        { id: "holstein-kiel", name: "Holstein Kiel" },
        { id: "fortuna-dusseldorf", name: "Fortuna Dusseldorf" },
      ],
      "ligue-1": [
        { id: "auxerre", name: "AJ Auxerre" },
        { id: "saint-etienne", name: "AS Saint-Etienne" },
        { id: "angers", name: "Angers SCO" },
      ],
    };

    const leagueKey = leagueId.toLowerCase().replace(/\s+/g, "-");
    const promotedTeamNames = promotedTeamsMap[leagueKey] || promotedTeamsMap[leagueId] || [];

    if (promotedTeamNames.length > 0) {
      // Fetch logos for promoted teams
      for (const team of promotedTeamNames) {
        const teamLogo = teamLogoService.getOfficialTeamLogo(team.name, leagueName);
        promoted.push({
          id: team.id,
          name: team.name,
          logo: teamLogo,
          titles: 0,
          description: "Promoted 2024/25 Season",
        });
      }
    } else {
      // Generic fallback - will be populated by API when available
      promoted.push(
        { id: "promoted-1", name: "Promoted Team 1", logo: "", titles: 0, description: "Promoted 2024/25 Season" },
        { id: "promoted-2", name: "Promoted Team 2", logo: "", titles: 0, description: "Promoted 2024/25 Season" },
        { id: "promoted-3", name: "Promoted Team 3", logo: "", titles: 0, description: "Promoted 2024/25 Season" }
      );
    }
    
    setPromotedTeams(promoted);
  };

  const detectLowerLeague = () => {
    // Smart detection of lower league based on current league
    const lowerLeagueMap: { [key: string]: { id: string; name: string } } = {
      "la-liga": { id: "segunda-division", name: "Spanish Segunda Division" },
      "premier-league": { id: "championship", name: "English Championship" },
      "serie-a": { id: "serie-b", name: "Serie B" },
      "bundesliga": { id: "2-bundesliga", name: "2. Bundesliga" },
      "ligue-1": { id: "ligue-2", name: "Ligue 2" },
      "eredivisie": { id: "eerste-divisie", name: "Eerste Divisie" },
      "primeira-liga": { id: "liga-portugal-2", name: "Liga Portugal 2" },
      "scottish-premiership": { id: "scottish-championship", name: "Scottish Championship" },
      "j1-league": { id: "j2-league", name: "J2 League" },
      "k-league-1": { id: "k-league-2", name: "K League 2" },
      "chinese-super-league": { id: "china-league-one", name: "China League One" },
      "saudi-pro-league": { id: "saudi-first-division", name: "Saudi First Division" },
      "mls": { id: "usl-championship", name: "USL Championship" },
      "liga-mx": { id: "liga-mx-expansion", name: "Liga MX Expansion" },
      "brasileirao": { id: "serie-b-brasil", name: "Serie B Brasil" },
      "uganda-premier-league": { id: "fufa-big-league", name: "FUFA Big League" },
    };

    const leagueKey = leagueId.toLowerCase().replace(/\s+/g, "-");
    const lowerLeagueInfo = lowerLeagueMap[leagueKey] || lowerLeagueMap[leagueId] || null;

    if (lowerLeagueInfo) {
      // Try to get league logo
      const lowerLeagueLogo = ""; // Will be fetched from API when available
      setLowerLeague({
        id: lowerLeagueInfo.id,
        name: lowerLeagueInfo.name,
        logo: lowerLeagueLogo,
        titles: 0,
        description: "Second Division Championship",
      });
    } else {
      // Generic fallback
      setLowerLeague({
        id: "second-division",
        name: "Second Division",
        logo: "",
        titles: 0,
        description: "Lower League",
      });
    }
  };

  const handleRoundChange = (round: string) => {
    const newRound = parseInt(round);
    setSelectedRound(newRound);
    setShowRoundSelector(false);
    // Squad will automatically refresh via useEffect
  };

  // Get official player photo URL with fallbacks
  const getPlayerPhotoUrl = (playerId: number, playerName: string): string => {
    // Priority order: API-Sports official photo, then fallback sources
    const photoSources = [
      // 1. API-Sports official photo (primary)
      `https://media.api-sports.io/football/players/${playerId}.png`,
      // 2. Transfermarkt high-quality portraits
      `https://img.a.transfermarkt.technology/portrait/header/${playerId}.jpg`,
      // 3. Alternative Transfermarkt format
      `https://tmssl.akamaized.net/images/portrait/header/${playerId}.jpg`,
      // 4. ESPN player photos
      `https://a.espncdn.com/i/headshots/soccer/players/full/${playerId}.png`,
      // 5. FotMob player images
      `https://images.fotmob.com/image_resources/playerimages/${playerId}.png`,
    ];

    // Return first available source (API-Sports is most reliable)
    return photoSources[0]; // Always use API-Sports as primary source
  };

  // Fetch squad data for the selected week
  const fetchWeekSquadData = async () => {
    try {
      // Special handling for Uganda Premier League (no API ID available)
      if (leagueId === "uganda-premier-league" && !apiLeagueId) {
        console.log("🇺🇬 [LeagueDraft] Uganda Premier League squad data not available via API-Football");
        // Set empty squad data - will show empty pitch
        setSquadData(null);
        setFormation("4-4-2");
        setUpdateDate(new Date().toLocaleDateString("en-US", { month: "2-digit", day: "2-digit" }));
        return;
      }

      if (!apiLeagueId) {
        return;
      }
      
      const seasonYear = parseInt(season.split("-")[0]);
      
      // Fetch fixtures for the selected round/week (uses cached backend data)
      const matchesResponse = await apiSportsService.getFixtures(
        undefined, // teamId
        apiLeagueId,
        seasonYear,
        undefined, // date
        undefined, // status
        undefined, // live
      );
      
      // Filter matches by round
      let filteredMatches = matchesResponse?.response || [];
      if (selectedRound && filteredMatches.length > 0) {
        filteredMatches = filteredMatches.filter((match: any) => {
          const matchRound = match.league?.round;
          return matchRound && matchRound.includes(selectedRound.toString());
        });
      }
      
      if (!filteredMatches || filteredMatches.length === 0) {
        setSquadData(null);
        return;
      }
      
      // Extract best performers from matches (limit to first 3 matches for speed)
      const limitedMatches = filteredMatches.slice(0, 3);
      const squad = await generateSquadFromMatches(limitedMatches, selectedRound);
      
      if (!squad || !squad.players || squad.players.length === 0) {
        setSquadData(null);
        return;
      }
      
      // Detect formation from player positions - default to 4-4-2
      const detectedFormation = detectFormation(squad.players) || squad.formation || "4-4-2";
      setSquadData(squad);
      setFormation(detectedFormation || "4-4-2"); // Ensure 4-4-2 is always the default
      
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
      setSquadData(null);
    }
  };

  // Generate squad from matches
  const generateSquadFromMatches = async (matches: any[], roundNumber: number): Promise<any> => {
    try {
      const playerStatsMap = new Map<string, {
        playerId: number;
        playerName: string;
        playerPhoto: string;
        position: string;
        teamId: number;
        teamName: string;
        teamLogo: string;
        goals: number;
        assists: number;
        rating: number;
        appearances: number;
      }>();

      // Process each match to extract player statistics
      for (const match of matches) {
        const fixtureId = match.fixture?.id;
        if (!fixtureId) continue;

        try {
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
                const playerPhoto = player.player?.photo || "";
                if (!playerId || !playerName) return;

                const key = `${playerId}-${homeTeamId}`;
                const stats = player.statistics?.[0] || {};
                
                if (!playerStatsMap.has(key)) {
                  // Use official API photo first, then fallback to constructed URL
                  const officialPhoto = playerPhoto && playerPhoto.trim() !== "" 
                    ? playerPhoto 
                    : getPlayerPhotoUrl(playerId, playerName);
                  
                  playerStatsMap.set(key, {
                    playerId,
                    playerName,
                    playerPhoto: officialPhoto,
                    position: stats.games?.position || "Unknown",
                    teamId: homeTeamId,
                    teamName: homeTeamName,
                    teamLogo: teamLogoService.getOfficialTeamLogo(homeTeamName, leagueName, homeTeamLogo),
                    goals: stats.goals?.total || 0,
                    assists: stats.goals?.assists || 0,
                    rating: parseFloat(stats.games?.rating || "0"), // Official API rating
                    appearances: 1,
                  });
                } else {
                  const existing = playerStatsMap.get(key)!;
                  existing.goals += stats.goals?.total || 0;
                  existing.assists += stats.goals?.assists || 0;
                  existing.appearances += 1;
                  // Average rating from multiple matches
                  existing.rating = (existing.rating + parseFloat(stats.games?.rating || "0")) / 2;
                  // Update photo if not already set and API provides one
                  if ((!existing.playerPhoto || existing.playerPhoto === "") && playerPhoto && playerPhoto.trim() !== "") {
                    existing.playerPhoto = playerPhoto;
                  }
                }
              });
            }

            // Process away team players
            if (playerStatsResponse.response[1]?.players) {
              playerStatsResponse.response[1].players.forEach((player: any) => {
                const playerId = player.player?.id;
                const playerName = player.player?.name;
                const playerPhoto = player.player?.photo || "";
                if (!playerId || !playerName) return;

                const key = `${playerId}-${awayTeamId}`;
                const stats = player.statistics?.[0] || {};
                
                if (!playerStatsMap.has(key)) {
                  // Use official API photo first, then fallback to constructed URL
                  const officialPhoto = playerPhoto && playerPhoto.trim() !== "" 
                    ? playerPhoto 
                    : getPlayerPhotoUrl(playerId, playerName);
                  
                  playerStatsMap.set(key, {
                    playerId,
                    playerName,
                    playerPhoto: officialPhoto,
                    position: stats.games?.position || "Unknown",
                    teamId: awayTeamId,
                    teamName: awayTeamName,
                    teamLogo: teamLogoService.getOfficialTeamLogo(awayTeamName, leagueName, awayTeamLogo),
                    goals: stats.goals?.total || 0,
                    assists: stats.goals?.assists || 0,
                    rating: parseFloat(stats.games?.rating || "0"), // Official API rating
                    appearances: 1,
                  });
                } else {
                  const existing = playerStatsMap.get(key)!;
                  existing.goals += stats.goals?.total || 0;
                  existing.assists += stats.goals?.assists || 0;
                  existing.appearances += 1;
                  // Average rating from multiple matches
                  existing.rating = (existing.rating + parseFloat(stats.games?.rating || "0")) / 2;
                  // Update photo if not already set and API provides one
                  if ((!existing.playerPhoto || existing.playerPhoto === "") && playerPhoto && playerPhoto.trim() !== "") {
                    existing.playerPhoto = playerPhoto;
                  }
                }
              });
            }
          }
        } catch (matchError) {
          console.log(`Error processing match ${fixtureId}:`, matchError);
          continue;
        }
      }

      // Convert map to array and sort by rating
      const allPlayers = Array.from(playerStatsMap.values())
        .sort((a, b) => {
          const scoreA = a.rating + (a.goals * 2) + a.assists;
          const scoreB = b.rating + (b.goals * 2) + b.assists;
          return scoreB - scoreA;
        });

      // Select best 11 players
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

      const selectedPlayers = [
        ...goalkeepers,
        ...defenders,
        ...midfielders,
        ...forwards,
      ].slice(0, 11);

      const squadPlayers = selectedPlayers.map((p) => ({
        id: p.playerId.toString(),
        name: p.playerName,
        position: p.position,
        rating: Math.min(10, Math.max(1, p.rating)),
        teamName: p.teamName,
        teamLogo: p.teamLogo,
        headshot: p.playerPhoto || getPlayerPhotoUrl(p.playerId, p.playerName),
      }));

      const formation = `${defenders.length}-${midfielders.length}-${forwards.length}`;

      return {
        players: squadPlayers,
        formation,
      };
    } catch (error) {
      console.error("Error generating squad from matches:", error);
      throw error;
    }
  };

  // Detect formation from players - improved logic, defaults to 4-4-2
  const detectFormation = (players: any[]): string => {
    if (!players || players.length === 0) return "4-4-2";
    
    // If we don't have exactly 11 players, default to 4-4-2
    if (players.length !== 11) return "4-4-2";
    
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
      p.position?.toLowerCase().includes("rb") ||
      p.position?.toLowerCase().includes("lwb") ||
      p.position?.toLowerCase().includes("rwb")
    ).length;

    const midCount = players.filter(p => 
      p.position?.toLowerCase().includes("midfielder") || 
      p.position?.toLowerCase() === "m" ||
      p.position?.toLowerCase().includes("cm") ||
      p.position?.toLowerCase().includes("dm") ||
      p.position?.toLowerCase().includes("lm") ||
      p.position?.toLowerCase().includes("rm") ||
      p.position?.toLowerCase().includes("cam") ||
      p.position?.toLowerCase().includes("lam") ||
      p.position?.toLowerCase().includes("ram") ||
      p.position?.toLowerCase().includes("winger")
    ).length;

    const fwdCount = players.filter(p => 
      p.position?.toLowerCase().includes("attacker") || 
      p.position?.toLowerCase() === "f" ||
      p.position?.toLowerCase().includes("forward") ||
      p.position?.toLowerCase().includes("st") ||
      p.position?.toLowerCase().includes("cf") ||
      p.position?.toLowerCase().includes("lw") ||
      p.position?.toLowerCase().includes("rw") ||
      p.position?.toLowerCase().includes("lf") ||
      p.position?.toLowerCase().includes("rf")
    ).length;

    // Formation detection logic
    if (defCount === 4 && midCount === 4 && fwdCount === 2) return "4-4-2";
    if (defCount === 4 && midCount === 3 && fwdCount === 3) return "4-3-3";
    if (defCount === 3 && midCount === 4 && fwdCount === 3) return "3-4-3";
    if (defCount === 4 && midCount === 2 && fwdCount === 3) return "4-2-3-1";
    if (defCount === 3 && midCount === 5 && fwdCount === 2) return "3-5-2";
    if (defCount === 4 && midCount === 5 && fwdCount === 1) return "4-5-1";
    
    // Default fallback
    return "4-4-2";
  };

  // Convert percentage coordinates to pixel coordinates
  const convertPercentageToPixels = (percentX: number, percentY: number) => {
    const pitchWidth = width - 32;
    const pitchHeight = 400; // Reduced from 1100 - no zooming
    // Adjusted offset for smaller headshot size (38px instead of 50px)
    return {
      x: (percentX / 100) * pitchWidth - 19,
      y: (percentY / 100) * pitchHeight - 19,
    };
  };

  // Formation positions data with better spacing - increased horizontal spacing for breathing room
  const formationData: { [key: string]: Array<{ x: number; y: number; id: string }> } = {
    "4-4-2": [
      { x: 50, y: 90, id: "gk" },
      { x: 8, y: 72, id: "lb" },
      { x: 28, y: 76, id: "cb1" },
      { x: 72, y: 76, id: "cb2" },
      { x: 92, y: 72, id: "rb" },
      { x: 5, y: 52, id: "lm" },
      { x: 28, y: 48, id: "cm1" },
      { x: 72, y: 48, id: "cm2" },
      { x: 95, y: 52, id: "rm" },
      { x: 22, y: 22, id: "lf" },
      { x: 78, y: 22, id: "rf" },
    ],
    "3-4-3": [
      { x: 50, y: 90, id: "gk" },
      { x: 18, y: 76, id: "cb1" },
      { x: 50, y: 78, id: "cb2" },
      { x: 82, y: 76, id: "cb3" },
      { x: 3, y: 56, id: "lwb" },
      { x: 28, y: 52, id: "cm1" },
      { x: 72, y: 52, id: "cm2" },
      { x: 97, y: 56, id: "rwb" },
      { x: 12, y: 22, id: "lw" },
      { x: 50, y: 18, id: "cf" },
      { x: 88, y: 22, id: "rw" },
    ],
    "4-3-3": [
      { x: 50, y: 90, id: "gk" },
      { x: 8, y: 72, id: "lb" },
      { x: 28, y: 76, id: "cb1" },
      { x: 72, y: 76, id: "cb2" },
      { x: 92, y: 72, id: "rb" },
      { x: 18, y: 48, id: "cm1" },
      { x: 50, y: 48, id: "cm2" },
      { x: 82, y: 48, id: "cm3" },
      { x: 12, y: 18, id: "lw" },
      { x: 50, y: 12, id: "cf" },
      { x: 88, y: 18, id: "rw" },
    ],
    "4-2-3-1": [
      { x: 50, y: 90, id: "gk" },
      { x: 8, y: 72, id: "lb" },
      { x: 28, y: 76, id: "cb1" },
      { x: 72, y: 76, id: "cb2" },
      { x: 92, y: 72, id: "rb" },
      { x: 28, y: 58, id: "cdm1" },
      { x: 72, y: 58, id: "cdm2" },
      { x: 12, y: 35, id: "lam" },
      { x: 50, y: 38, id: "cam" },
      { x: 88, y: 35, id: "ram" },
      { x: 50, y: 18, id: "cf" },
    ],
    "3-5-2": [
      { x: 50, y: 90, id: "gk" },
      { x: 18, y: 76, id: "cb1" },
      { x: 50, y: 78, id: "cb2" },
      { x: 82, y: 76, id: "cb3" },
      { x: 3, y: 56, id: "lwb" },
      { x: 22, y: 48, id: "lm" },
      { x: 50, y: 52, id: "cm" },
      { x: 78, y: 48, id: "rm" },
      { x: 97, y: 56, id: "rwb" },
      { x: 28, y: 22, id: "lf" },
      { x: 72, y: 22, id: "rf" },
    ],
    "4-5-1": [
      { x: 50, y: 90, id: "gk" },
      { x: 8, y: 72, id: "lb" },
      { x: 28, y: 76, id: "cb1" },
      { x: 72, y: 76, id: "cb2" },
      { x: 92, y: 72, id: "rb" },
      { x: 8, y: 48, id: "lm" },
      { x: 22, y: 42, id: "cm1" },
      { x: 50, y: 48, id: "cm" },
      { x: 78, y: 42, id: "cm2" },
      { x: 92, y: 48, id: "rm" },
      { x: 50, y: 18, id: "cf" },
    ],
  };

  // Map players to formation positions - improved with better position matching
  const mapPlayersToFormation = (players: any[], formationName: string) => {
    const formationPositions = formationData[formationName] || formationData["4-4-2"];
    const mappedPlayers: { [key: string]: any } = {};

    formationPositions.forEach(pos => {
      mappedPlayers[pos.id] = null;
    });

    const sortedPlayers = [...players].sort((a, b) => b.rating - a.rating);

    // Map goalkeeper
    const gk = sortedPlayers.find(p => 
      p.position?.toLowerCase().includes("goalkeeper") || 
      p.position?.toLowerCase() === "g" ||
      p.position?.toLowerCase() === "gk"
    );
    if (gk && mappedPlayers.hasOwnProperty("gk")) {
      mappedPlayers["gk"] = gk;
      sortedPlayers.splice(sortedPlayers.indexOf(gk), 1);
    }

    // Map defenders (including wingbacks) - but exclude wingbacks if they're in midfield positions
    const defenders = sortedPlayers.filter(p => {
      const posLower = p.position?.toLowerCase() || "";
      return posLower.includes("defender") || 
        posLower === "d" ||
        (posLower.includes("back") && !posLower.includes("wing")) ||
        posLower.includes("cb") ||
        posLower.includes("lb") ||
        posLower.includes("rb");
    });

    const defPositions = formationPositions.filter(p => 
      p.id.includes("cb") || p.id.includes("lb") || p.id.includes("rb")
    );
    
    // Sort defenders by rating and map to positions
    defenders.sort((a, b) => b.rating - a.rating);
    defenders.slice(0, defPositions.length).forEach((def, index) => {
      if (defPositions[index]) {
        mappedPlayers[defPositions[index].id] = def;
        sortedPlayers.splice(sortedPlayers.indexOf(def), 1);
      }
    });

    // Map midfielders (including CAM, CDM, wingers, and wingbacks)
    const midfielders = sortedPlayers.filter(p => {
      const posLower = p.position?.toLowerCase() || "";
      return posLower.includes("midfielder") || 
        posLower === "m" ||
        posLower.includes("cm") ||
        posLower.includes("dm") ||
        posLower.includes("lm") ||
        posLower.includes("rm") ||
        posLower.includes("cam") ||
        posLower.includes("lam") ||
        posLower.includes("ram") ||
        posLower.includes("cdm") ||
        posLower.includes("winger") ||
        posLower.includes("lwb") ||
        posLower.includes("rwb");
    });

    const midPositions = formationPositions.filter(p => 
      p.id.includes("cm") || p.id.includes("dm") || p.id.includes("lm") || p.id.includes("rm") || 
      p.id.includes("cam") || p.id.includes("lam") || p.id.includes("ram") || 
      p.id.includes("cdm") || p.id.includes("lwb") || p.id.includes("rwb")
    );
    
    // Sort midfielders by rating and map to positions
    midfielders.sort((a, b) => b.rating - a.rating);
    midfielders.slice(0, midPositions.length).forEach((mid, index) => {
      if (midPositions[index]) {
        mappedPlayers[midPositions[index].id] = mid;
        sortedPlayers.splice(sortedPlayers.indexOf(mid), 1);
      }
    });

    // Map forwards (including wingers)
    const forwards = sortedPlayers.filter(p => 
      p.position?.toLowerCase().includes("attacker") || 
      p.position?.toLowerCase() === "f" ||
      p.position?.toLowerCase().includes("forward") ||
      p.position?.toLowerCase().includes("st") ||
      p.position?.toLowerCase().includes("cf") ||
      p.position?.toLowerCase().includes("lw") ||
      p.position?.toLowerCase().includes("rw") ||
      p.position?.toLowerCase().includes("lf") ||
      p.position?.toLowerCase().includes("rf")
    );

    const fwdPositions = formationPositions.filter(p => 
      p.id.includes("st") || p.id.includes("cf") || p.id.includes("lw") || p.id.includes("rw") || 
      p.id.includes("lf") || p.id.includes("rf")
    );
    
    // Sort forwards by rating and map to positions
    forwards.sort((a, b) => b.rating - a.rating);
    forwards.slice(0, fwdPositions.length).forEach((fwd, index) => {
      if (fwdPositions[index]) {
        mappedPlayers[fwdPositions[index].id] = fwd;
        sortedPlayers.splice(sortedPlayers.indexOf(fwd), 1);
      }
    });

    return mappedPlayers;
  };

  // Render players on pitch
  const renderPitchPlayers = () => {
    if (!squadData || !squadData.players) return null;

    const playersArray = squadData.players;
    const mappedPlayers = mapPlayersToFormation(playersArray, formation);
    const currentFormationPositions = formationData[formation] || formationData["4-4-2"];

    return currentFormationPositions.map((pos) => {
      const player = mappedPlayers[pos.id];
      if (!player) return null;

      const pixelPos = convertPercentageToPixels(pos.x, pos.y);
      
      return (
        <View
          key={player.id}
          style={[
            styles.playerOnPitch,
            {
              position: "absolute",
              left: pixelPos.x,
              top: pixelPos.y,
            },
          ]}
        >
          <View style={styles.playerHeadshotContainer}>
            {player.headshot && player.headshot !== "" ? (
              <Image 
                source={{ uri: player.headshot }} 
                style={styles.playerHeadshot}
                onError={() => {
                  // If image fails to load, it will fall back to placeholder
                  console.log(`Failed to load headshot for ${player.name}: ${player.headshot}`);
                }}
              />
            ) : (
              <View style={styles.playerHeadshotPlaceholder}>
                <Text style={styles.playerInitials}>
                  {player.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                </Text>
              </View>
            )}
            <View style={styles.teamLogoBadge}>
              {player.teamLogo ? (
                <Image source={{ uri: player.teamLogo }} style={styles.teamLogoSmall} />
              ) : null}
            </View>
          </View>
          <Text style={styles.playerNameOnPitch} numberOfLines={1}>
            {player.name}
          </Text>
          <View
            style={[
              styles.ratingBadgeOnPitch,
              { backgroundColor: player.rating >= 8.5 ? "#FF6B35" : player.rating >= 8.0 ? "#FFA500" : "#90EE90" },
            ]}
          >
            <Text style={styles.ratingTextOnPitch}>{player.rating.toFixed(1)}</Text>
          </View>
        </View>
      );
    });
  };

  const generateRounds = () => {
    const rounds = [];
    const totalRounds = leagueStats?.totalRounds || 38;
    for (let i = 1; i <= totalRounds; i++) {
      rounds.push(i.toString());
    }
    return rounds;
  };

  const renderTeamItem = (team: Team | null | undefined, showChevron: boolean = true, isLowerLeague: boolean = false) => {
    // Safety check: don't render if team is null/undefined or missing required fields
    if (!team || !team.id || !team.name) {
      console.warn(`⚠️ [LeagueDraft] Cannot render team item - invalid team data:`, team);
      return null;
    }

    return (
      <TouchableOpacity
        key={team.id}
        style={styles.teamItem}
        activeOpacity={0.7}
        onPress={() => {
          if (isLowerLeague) {
            // Navigate to lower league details
            router.push({
              pathname: "/stats/league-details/[leagueId]",
              params: {
                leagueId: team.id,
                leagueName: team.name,
              },
            });
          } else {
            // Navigate to team details
            router.push({
              pathname: "/stats/team-details/[teamId]",
              params: {
                teamId: team.id,
                teamName: team.name,
              },
            });
          }
        }}
      >
        <View style={styles.teamInfo}>
          <View style={styles.teamLogoContainer}>
            {team.logo ? (
              <Image source={{ uri: team.logo }} style={styles.teamLogoImage} />
            ) : (
              <View style={styles.teamLogoFallback}>
                <Text style={styles.teamLogoFallbackText}>
                  {team.name
                    ?.split(" ")
                    .map((word: string) => word[0])
                    .join("")
                    .slice(0, 2) || "??"}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.teamTextContainer}>
            <Text style={[styles.teamName, { color: theme.colors.text }]}>
              {team.name || "Unknown Team"}
            </Text>
            {team.description && (
              <Text
                style={[
                  styles.teamDescription,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {team.description}
              </Text>
            )}
          </View>
        </View>
        {showChevron && (
          <ChevronRight size={20} color={theme.colors.textSecondary} />
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Loading draft data...
          </Text>
        </View>
      </View>
    );
  }

  // Show error state if no data
  if (!data || !leagueStats) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Failed to load league data
          </Text>
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary, marginTop: 8, fontSize: 14 }]}>
            This could be due to:
          </Text>
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary, marginTop: 4, fontSize: 12 }]}>
            • API rate limit exceeded
          </Text>
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary, fontSize: 12 }]}>
            • Network connectivity issue
          </Text>
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary, fontSize: 12 }]}>
            • League data not available
          </Text>
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary, marginTop: 12, fontSize: 12 }]}>
            Check console logs for detailed error information.
          </Text>
        </View>
      </View>
    );
  }


  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Basic Information
          </Text>

          {/* ✅ BASKETBALL: Hide all contents under Basic Information for basketball */}
          {sport !== "basketball" && (
            <>
              {/* Top Rivals */}
              {topRivals.length >= 2 && topRivals[0]?.id && topRivals[0]?.name && topRivals[1]?.id && topRivals[1]?.name && (
                <View style={styles.topTeamsContainer}>
                  <View style={styles.topTeam}>
                    {topRivals[0].logo ? (
                      <Image source={{ uri: topRivals[0].logo }} style={styles.topTeamLogoImage} />
                    ) : (
                      <View style={styles.topTeamLogo}>
                        <Text style={styles.topTeamLogoText}>
                          {topRivals[0].name
                            ?.split(" ")
                            .map((word: string) => word[0])
                            .join("")
                            .slice(0, 2) || "??"}
                        </Text>
                      </View>
                    )}
                    <Text style={[styles.topTeamName, { color: theme.colors.text }]}>
                      {topRivals[0].name || "Unknown Team"}
                    </Text>
                    {topRivals[0].description && (
                      <Text
                        style={[
                          styles.topTeamDesc,
                          { color: theme.colors.textSecondary },
                        ]}
                      >
                        {topRivals[0].description}
                      </Text>
                    )}
                  </View>

                  <View
                    style={[
                      styles.teamSeparator,
                      { backgroundColor: theme.colors.textSecondary },
                    ]}
                  />

                  <View style={styles.topTeam}>
                    {topRivals[1].logo ? (
                      <Image source={{ uri: topRivals[1].logo }} style={styles.topTeamLogoImage} />
                    ) : (
                      <View style={styles.topTeamLogo}>
                        <Text style={styles.topTeamLogoText}>
                          {topRivals[1].name
                            ?.split(" ")
                            .map((word: string) => word[0])
                            .join("")
                            .slice(0, 2) || "??"}
                        </Text>
                      </View>
                    )}
                    <Text style={[styles.topTeamName, { color: theme.colors.text }]}>
                      {topRivals[1].name || "Unknown Team"}
                    </Text>
                    {topRivals[1].description && (
                      <Text
                        style={[
                          styles.topTeamDesc,
                          { color: theme.colors.textSecondary },
                        ]}
                      >
                        {topRivals[1].description}
                      </Text>
                    )}
                  </View>
                </View>
              )}

              {/* League Stats */}
              {leagueStats && (
                <View style={styles.statsGrid}>
                  <View style={styles.statItem}>
                    <Text style={[styles.statLabel, { color: theme.colors.text }]}>
                      Regular Season Rounds
                    </Text>
                    <Text style={[styles.statValue, { color: theme.colors.text }]}>
                      {leagueStats.totalRounds}
                    </Text>
                  </View>

                  <View style={styles.statItem}>
                    <Text style={[styles.statLabel, { color: theme.colors.text }]}>
                      Participating Teams
                    </Text>
                    <Text style={[styles.statValue, { color: theme.colors.text }]}>
                      {leagueStats.participatingTeams}
                    </Text>
                  </View>

                  <View style={styles.statItem}>
                    <Text style={[styles.statLabel, { color: theme.colors.text }]}>
                      Player Count (Foreign)
                    </Text>
                    <Text style={[styles.statValue, { color: theme.colors.text }]}>
                      {leagueStats.totalPlayers}({leagueStats.foreignPlayers})
                    </Text>
                  </View>

                  <View style={styles.statItem}>
                    <Text style={[styles.statLabel, { color: theme.colors.text }]}>
                      Total Player Value
                    </Text>
                    <View style={styles.valueContainer}>
                      <Euro size={16} color="#FF6B35" />
                      <Text
                        style={[
                          styles.statValue,
                          { color: theme.colors.text, marginLeft: 4 },
                        ]}
                      >
                        {removeCurrencySymbol(leagueStats.totalMarketValue)}
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </>
          )}
        </View>

        {/* Squad of the Week - ✅ BASKETBALL: Hidden for basketball (football-only feature) */}
        {sport !== "basketball" && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Squad of the Week
              </Text>
              <TouchableOpacity
                style={[
                  styles.roundSelector,
                  !leagueStats && { opacity: 0.5 }
                ]}
                onPress={() => {
                  if (leagueStats) {
                    setShowRoundSelector(true);
                  }
                }}
                disabled={!leagueStats}
              >
                <Text
                  style={[
                    styles.roundSelectorText, 
                    { 
                      color: leagueStats ? theme.colors.text : theme.colors.textSecondary 
                    }
                  ]}
                >
                  Week {selectedRound}
                </Text>
                <ChevronDown 
                  size={16} 
                  color={leagueStats ? theme.colors.text : theme.colors.textSecondary} 
                />
              </TouchableOpacity>
            </View>

            {/* Football Pitch - Always Visible */}
            {squadData && squadData.players && (
              <View style={styles.pitchContainer}>
                <ImageBackground
                  source={require("../../../../modules/discover/assets/football_pitch.png")}
                  style={styles.pitch}
                  imageStyle={styles.pitchImage}
                  resizeMode="cover"
                >
                  {/* Render players on pitch */}
                  {renderPitchPlayers()}
                </ImageBackground>
                {/* Formation and Date Info */}
                <View style={styles.pitchInfo}>
                  <Text style={[styles.formationText, { color: theme.colors.text }]}>
                    Formation: {formation}
                  </Text>
                  <Text style={[styles.updateDateText, { color: theme.colors.textSecondary }]}>
                    Update Date: {updateDate}
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Promoted Teams */}
        {promotedTeams.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Promoted Teams
            </Text>
            <View style={styles.teamsList}>
              {promotedTeams
                .filter((team) => team && team.id && team.name)
                .map((team) => renderTeamItem(team))}
            </View>
          </View>
        )}

        {/* Lower League */}
        {lowerLeague && lowerLeague.id && lowerLeague.name && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Lower League
            </Text>
            <View style={styles.teamsList}>
              {renderTeamItem(lowerLeague, true, true)}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Week Selector Modal - Custom modal showing "Week" instead of "Round" */}
      {/* Only show modal when league stats (matches data) is available */}
      {leagueStats && (
        <Modal
          visible={showRoundSelector}
          transparent
          animationType="slide"
          onRequestClose={() => setShowRoundSelector(false)}
        >
          <View style={styles.modalOverlay}>
            <Pressable
              style={styles.modalBackdrop}
              onPress={() => setShowRoundSelector(false)}
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
                  onPress={() => setShowRoundSelector(false)}
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
                {(leagueStats ? generateRounds() : Array.from({ length: 38 }, (_, i) => (i + 1).toString())).map((weekStr, index) => {
                  const week = parseInt(weekStr);
                  const isSelected = selectedRound === week;
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
                        handleRoundChange(weekStr);
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
                  onPress={() => setShowRoundSelector(false)}
                >
                  <Text style={[styles.actionButtonText, { color: theme.colors.textSecondary }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.confirmButton, { backgroundColor: "#FF6B35" }]}
                  onPress={() => setShowRoundSelector(false)}
                >
                  <Text style={styles.confirmButtonText}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
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
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    fontFamily: "Inter-SemiBold",
    marginBottom: 16,
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
  topTeamsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 24,
  },
  topTeam: {
    alignItems: "center",
    flex: 1,
  },
  teamSeparator: {
    width: 1,
    height: 60,
    opacity: 0.3,
    marginHorizontal: 20,
  },
  topTeamLogo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#4CAF50",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  topTeamLogoText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  topTeamLogoImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginBottom: 8,
  },
  topTeamName: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Inter-SemiBold",
    marginBottom: 4,
    textAlign: "center",
  },
  topTeamDesc: {
    fontSize: 12,
    fontFamily: "Inter-Regular",
    textAlign: "center",
  },
  statsGrid: {
    gap: 16,
  },
  statItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  statLabel: {
    fontSize: 16,
    fontFamily: "Inter-Regular",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Inter-SemiBold",
  },
  valueContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  pitchContainer: {
    marginHorizontal: 16,
    marginVertical: 16,
    marginBottom: 20,
    alignSelf: "center",
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
    width: width - 32,
    height: 400, // Reduced from 1100 - no zooming
    borderRadius: 16,
    position: "relative",
    overflow: "visible",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
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
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter-SemiBold",
  },
  updateDateText: {
    fontSize: 12,
    fontFamily: "Inter-Regular",
  },
  teamsList: {
    // Remove background and border to maintain uniform coloring
  },
  teamItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  teamInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  teamLogoContainer: {
    marginRight: 12,
  },
  teamLogoImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  teamLogoFallback: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#4CAF50",
    alignItems: "center",
    justifyContent: "center",
  },
  teamLogoFallbackText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
    fontFamily: "Inter-Bold",
  },
  teamTextContainer: {
    flex: 1,
  },
  teamName: {
    fontSize: 16,
    fontFamily: "Inter-Medium",
    marginBottom: 2,
  },
  teamDescription: {
    fontSize: 12,
    fontFamily: "Inter-Regular",
  },
  // Week Modal Styles
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

