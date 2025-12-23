/**
 * Team Statistics Screen
 * Displays comprehensive team statistics with multiple data tables
 * Fetches real data from API Football
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Image,
  TouchableOpacity,
} from "react-native";
import { createApiSportsService } from "@/services/api-sports-service";
import teamLogoService from "@/services/teamLogoService";

interface TeamStatsProps {
  teamId?: number;
  teamName: string;
  season: string;
  theme: any;
  teamColors?: {
    primary: string;
    secondary: string;
  };
  sport?: string; // ✅ Sport parameter (football/basketball)
}

interface SummaryStats {
  home: {
    points: number;
    matches: number;
    wins: number;
    draws: number;
    losses: number;
    goalsFor: number;
    goalsAgainst: number;
  };
  away: {
    points: number;
    matches: number;
    wins: number;
    draws: number;
    losses: number;
    goalsFor: number;
    goalsAgainst: number;
  };
  total: {
    points: number;
    matches: number;
    wins: number;
    draws: number;
    losses: number;
    goalsFor: number;
    goalsAgainst: number;
  };
}

interface TimePeriodStats {
  period: string;
  goalsFor: number;
  goalsAgainst: number;
  totalGoals: number;
}

interface HalfFullTimeResult {
  halfTime: "W" | "D" | "L";
  fullTime: "W" | "D" | "L";
  home: number;
  away: number;
  total: number;
}

interface GoalDistribution {
  goals: number;
  home: number;
  away: number;
  total: number;
}

interface CornerDistribution {
  range: string;
  home: number;
  away: number;
  total: number;
}

export default function TeamStats({ teamId, teamName, season, theme, teamColors = { primary: "#FF6B35", secondary: "#FF8C61" }, sport = "football" }: TeamStatsProps) {
  const isBasketball = sport === "basketball"; // ✅ Detect basketball
  const scoreLabel = isBasketball ? "Points" : "Goals"; // ✅ Dynamic label
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Statistics data
  const [summaryStats, setSummaryStats] = useState<SummaryStats | null>(null);
  const [timePeriodStats, setTimePeriodStats] = useState<TimePeriodStats[]>([]);
  const [halfFullTimeStats, setHalfFullTimeStats] = useState<HalfFullTimeResult[]>([]);
  const [goalDistribution, setGoalDistribution] = useState<GoalDistribution[]>([]);
  const [cornerDistribution, setCornerDistribution] = useState<CornerDistribution[]>([]);
  const [teamLogo, setTeamLogo] = useState<string | null>(null);
  const [finishedFixtures, setFinishedFixtures] = useState<any[]>([]);
  const [allFixtures, setAllFixtures] = useState<any[]>([]);
  
  // Filter states
  const [selectedCompetition, setSelectedCompetition] = useState<string>("all");
  const [availableCompetitions, setAvailableCompetitions] = useState<string[]>([]);
  const [timePeriodView, setTimePeriodView] = useState<"home" | "away">("home");
  const [timePeriodType, setTimePeriodType] = useState<"matches" | "count">("matches");

  // Memoize apiSportsService to prevent infinite loops - it should only be created once
  const apiSportsService = useMemo(() => createApiSportsService(), []);
  const seasonYear = useMemo(() => 2000 + parseInt(season.split("-")[0]), [season]);
  const isInitialLoadRef = useRef(true);

  // Recalculate all statistics with filtered fixtures
  const recalculateAllStatistics = useCallback(async (filteredFixtures: any[]) => {
    console.log(`🔄 [TeamStats] Recalculating statistics for ${filteredFixtures.length} fixtures`);
    if (!teamId || filteredFixtures.length === 0) {
      setSummaryStats(null);
      setTimePeriodStats([]);
      setHalfFullTimeStats([]);
      setGoalDistribution([]);
      setCornerDistribution([]);
      return;
    }

    // Recalculate summary statistics
    const homeStats = {
      points: 0,
      matches: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
    };

    const awayStats = {
      points: 0,
      matches: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
    };

    // Calculate half-full time statistics
    const halfFullTimeMap: { [key: string]: { home: number; away: number; total: number } } = {
      "W-W": { home: 0, away: 0, total: 0 },
      "W-D": { home: 0, away: 0, total: 0 },
      "W-L": { home: 0, away: 0, total: 0 },
      "D-W": { home: 0, away: 0, total: 0 },
      "D-D": { home: 0, away: 0, total: 0 },
      "D-L": { home: 0, away: 0, total: 0 },
      "L-W": { home: 0, away: 0, total: 0 },
      "L-D": { home: 0, away: 0, total: 0 },
      "L-L": { home: 0, away: 0, total: 0 },
    };

    // Calculate goal distribution
    const goalDistMap: { [key: number]: { home: number; away: number; total: number } } = {};

    filteredFixtures.forEach((fixture: any) => {
      // Handle both fixture structure formats
      const fixtureData = fixture.fixture || fixture;
      const teams = fixture.teams || fixtureData?.teams;
      const goals = fixture.goals || fixtureData?.goals || { home: 0, away: 0 };
      const score = fixture.score || fixtureData?.score || {};
      
      if (!teams || !goals) {
        console.warn(`⚠️ [TeamStats] Invalid fixture structure:`, fixture);
        return; // Skip invalid fixtures
      }
      
      const isHome = teams.home?.id === teamId;
      const teamGoals = isHome ? (goals.home ?? 0) : (goals.away ?? 0);
      const opponentGoals = isHome ? (goals.away ?? 0) : (goals.home ?? 0);
      const halftimeScore = score?.halftime || { home: 0, away: 0 };
      const fulltimeScore = score?.fulltime || goals;
      
      const teamHalfGoals = isHome ? halftimeScore.home : halftimeScore.away;
      const opponentHalfGoals = isHome ? halftimeScore.away : halftimeScore.home;
      const teamFullGoals = isHome ? fulltimeScore.home : fulltimeScore.away;
      const opponentFullGoals = isHome ? fulltimeScore.away : fulltimeScore.home;

      // Determine result
      let result: "W" | "D" | "L";
      if (teamFullGoals > opponentFullGoals) result = "W";
      else if (teamFullGoals === opponentFullGoals) result = "D";
      else result = "L";

      // Determine half-time result
      let halfResult: "W" | "D" | "L";
      if (teamHalfGoals > opponentHalfGoals) halfResult = "W";
      else if (teamHalfGoals === opponentHalfGoals) halfResult = "D";
      else halfResult = "L";

      const key = `${halfResult}-${result}`;
      if (halfFullTimeMap[key]) {
        if (isHome) {
          halfFullTimeMap[key].home++;
        } else {
          halfFullTimeMap[key].away++;
        }
        halfFullTimeMap[key].total++;
      }

      // Update stats
      if (isHome) {
        homeStats.matches++;
        homeStats.goalsFor += teamGoals || 0;
        homeStats.goalsAgainst += opponentGoals || 0;
        if (result === "W") {
          homeStats.wins++;
          homeStats.points += 3;
        } else if (result === "D") {
          homeStats.draws++;
          homeStats.points += 1;
        } else {
          homeStats.losses++;
        }
      } else {
        awayStats.matches++;
        awayStats.goalsFor += teamGoals || 0;
        awayStats.goalsAgainst += opponentGoals || 0;
        if (result === "W") {
          awayStats.wins++;
          awayStats.points += 3;
        } else if (result === "D") {
          awayStats.draws++;
          awayStats.points += 1;
        } else {
          awayStats.losses++;
        }
      }

      // Goal distribution
      const goalCount = teamGoals || 0;
      if (!goalDistMap[goalCount]) {
        goalDistMap[goalCount] = { home: 0, away: 0, total: 0 };
      }
      if (isHome) {
        goalDistMap[goalCount].home++;
      } else {
        goalDistMap[goalCount].away++;
      }
      goalDistMap[goalCount].total++;
    });

    const totalStats = {
      points: homeStats.points + awayStats.points,
      matches: homeStats.matches + awayStats.matches,
      wins: homeStats.wins + awayStats.wins,
      draws: homeStats.draws + awayStats.draws,
      losses: homeStats.losses + awayStats.losses,
      goalsFor: homeStats.goalsFor + awayStats.goalsFor,
      goalsAgainst: homeStats.goalsAgainst + awayStats.goalsAgainst,
    };

    setSummaryStats({ home: homeStats, away: awayStats, total: totalStats });
    
    console.log(`✅ [TeamStats] Statistics calculated:`, {
      totalMatches: totalStats.matches,
      totalWins: totalStats.wins,
      totalDraws: totalStats.draws,
      totalLosses: totalStats.losses,
      totalGoalsFor: totalStats.goalsFor,
      totalGoalsAgainst: totalStats.goalsAgainst,
    });

    // Convert half-full time stats to array
    const halfFullTimeArray: HalfFullTimeResult[] = Object.entries(halfFullTimeMap).map(([key, stats]) => {
      const [half, full] = key.split("-") as ["W" | "D" | "L", "W" | "D" | "L"];
      return {
        halfTime: half,
        fullTime: full,
        home: stats.home,
        away: stats.away,
        total: stats.total,
      };
    });
    setHalfFullTimeStats(halfFullTimeArray);

    // Convert goal distribution to array
    const goalDistArray: GoalDistribution[] = [];
    for (let i = 0; i <= 7; i++) {
      goalDistArray.push({
        goals: i === 7 ? 7 : i,
        home: goalDistMap[i]?.home || 0,
        away: goalDistMap[i]?.away || 0,
        total: goalDistMap[i]?.total || 0,
      });
    }
    // Add 7+ for goals >= 7
    if (goalDistMap[7]) {
      for (let i = 8; i <= 10; i++) {
        if (goalDistMap[i]) {
          goalDistArray[7].home += goalDistMap[i].home;
          goalDistArray[7].away += goalDistMap[i].away;
          goalDistArray[7].total += goalDistMap[i].total;
        }
      }
    }
    setGoalDistribution(goalDistArray);

    // Initialize empty time period stats (will be populated asynchronously if needed)
    const emptyTimePeriods: TimePeriodStats[] = [
      { period: "0'-15'", goalsFor: 0, goalsAgainst: 0, totalGoals: 0 },
      { period: "15'-30'", goalsFor: 0, goalsAgainst: 0, totalGoals: 0 },
      { period: "30'-45'", goalsFor: 0, goalsAgainst: 0, totalGoals: 0 },
      { period: "45'-60'", goalsFor: 0, goalsAgainst: 0, totalGoals: 0 },
      { period: "60'-75'", goalsFor: 0, goalsAgainst: 0, totalGoals: 0 },
      { period: "75'-90'", goalsFor: 0, goalsAgainst: 0, totalGoals: 0 },
    ];
    setTimePeriodStats(emptyTimePeriods);

    // Fetch events for time period analysis asynchronously (only for recent 5 fixtures to minimize loading)
    // This runs in the background without blocking the main stats display
    const limitedFixtures = filteredFixtures.slice(0, 5);
    
    if (limitedFixtures.length > 0) {
      // Fetch events asynchronously without blocking using apiSportsService
      (async () => {
        try {
          const dataPromises = limitedFixtures.map(async (fixture: any) => {
            try {
              // Use apiSportsService to fetch events
              const eventsResponse = await apiSportsService.getMatchEvents(fixture.fixture?.id);
              const events = eventsResponse?.response || [];
              return { fixture, events };
            } catch (err) {
              console.warn(`⚠️ [TeamStats] Failed to fetch events for fixture ${fixture.fixture?.id}:`, err);
              return { fixture, events: [] };
            }
          });
          
          const dataResults = await Promise.all(dataPromises);

          // Calculate time period statistics
          const timePeriods: { [key: string]: { goalsFor: number; goalsAgainst: number; matches: number } } = {
            "0-15": { goalsFor: 0, goalsAgainst: 0, matches: 0 },
            "15-30": { goalsFor: 0, goalsAgainst: 0, matches: 0 },
            "30-45": { goalsFor: 0, goalsAgainst: 0, matches: 0 },
            "45-60": { goalsFor: 0, goalsAgainst: 0, matches: 0 },
            "60-75": { goalsFor: 0, goalsAgainst: 0, matches: 0 },
            "75-90": { goalsFor: 0, goalsAgainst: 0, matches: 0 },
          };

          dataResults.forEach(({ events, fixture }) => {
            const isHome = fixture.teams.home.id === teamId;
            
            events.forEach((event: any) => {
              if (event.type === "Goal") {
                const minute = event.time.elapsed || 0;
                const isTeamGoal = event.team.id === teamId;
                
                if (minute >= 0 && minute < 15) {
                  if (isTeamGoal) timePeriods["0-15"].goalsFor++;
                  else timePeriods["0-15"].goalsAgainst++;
                } else if (minute >= 15 && minute < 30) {
                  if (isTeamGoal) timePeriods["15-30"].goalsFor++;
                  else timePeriods["15-30"].goalsAgainst++;
                } else if (minute >= 30 && minute < 45) {
                  if (isTeamGoal) timePeriods["30-45"].goalsFor++;
                  else timePeriods["30-45"].goalsAgainst++;
                } else if (minute >= 45 && minute < 60) {
                  if (isTeamGoal) timePeriods["45-60"].goalsFor++;
                  else timePeriods["45-60"].goalsAgainst++;
                } else if (minute >= 60 && minute < 75) {
                  if (isTeamGoal) timePeriods["60-75"].goalsFor++;
                  else timePeriods["60-75"].goalsAgainst++;
                } else if (minute >= 75 && minute <= 90) {
                  if (isTeamGoal) timePeriods["75-90"].goalsFor++;
                  else timePeriods["75-90"].goalsAgainst++;
                }
              }
            });
          });

          const timePeriodArray: TimePeriodStats[] = Object.entries(timePeriods).map(([period, stats]) => ({
            period: period.replace("-", "'-") + "'",
            goalsFor: stats.goalsFor,
            goalsAgainst: stats.goalsAgainst,
            totalGoals: stats.goalsFor + stats.goalsAgainst,
          }));

          setTimePeriodStats(timePeriodArray);
        } catch (err) {
          // Silently fail - time period stats will remain empty
          console.log("Time period stats could not be loaded");
        }
      })();
    }

    // Corner distribution (simplified - would need statistics API)
    const cornerDistArray: CornerDistribution[] = [
      { range: "0-7", home: 0, away: 0, total: 0 },
      { range: "8", home: 0, away: 0, total: 0 },
      { range: "9", home: 0, away: 0, total: 0 },
      { range: "10", home: 0, away: 0, total: 0 },
      { range: "11", home: 0, away: 0, total: 0 },
      { range: "12", home: 0, away: 0, total: 0 },
      { range: "13+", home: 0, away: 0, total: 0 },
    ];
    setCornerDistribution(cornerDistArray);
  }, [teamId, apiSportsService]);

  // Detect competitions from fixtures (memoized as pure function)
  const detectCompetitionsFromFixtures = useCallback((fixtures: any[]): string[] => {
    const competitions = new Set<string>();
    
    fixtures.forEach((fixture: any) => {
      const leagueName = fixture.league?.name?.toLowerCase() || "";
      const leagueType = fixture.league?.type?.toLowerCase() || "";
      
      // Detect League
      if (
        leagueType === "league" ||
        (!leagueName.includes("cup") && 
         !leagueName.includes("friendly") && 
         !leagueName.includes("trophy") &&
         !leagueName.includes("shield"))
      ) {
        competitions.add("league");
      }
      
      // Detect Cup
      if (
        leagueName.includes("cup") ||
        leagueName.includes("trophy") ||
        leagueName.includes("shield") ||
        leagueName.includes("fa ") ||
        leagueName.includes("carabao") ||
        leagueName.includes("efl") ||
        leagueType === "cup"
      ) {
        competitions.add("cup");
      }
      
      // Detect Friendly
      if (
        leagueName.includes("friendly") ||
        leagueName.includes("friendlies") ||
        leagueType === "friendly"
      ) {
        competitions.add("friendly");
      }
    });
    
    // Always include "all"
    const result = ["all", ...Array.from(competitions)];
    return result;
  }, []);

  // Filter fixtures by competition type (memoized as pure function)
  const filterFixturesByCompetition = useCallback((fixtures: any[], competitionType: string): any[] => {
    if (competitionType === "all") {
      return fixtures;
    }
    
    return fixtures.filter((fixture: any) => {
      const leagueName = fixture.league?.name?.toLowerCase() || "";
      const leagueType = fixture.league?.type?.toLowerCase() || "";
      
      if (competitionType === "league") {
        return (
          leagueType === "league" ||
          (!leagueName.includes("cup") && 
           !leagueName.includes("friendly") && 
           !leagueName.includes("trophy") &&
           !leagueName.includes("shield"))
        );
      }
      
      if (competitionType === "cup") {
        return (
          leagueName.includes("cup") ||
          leagueName.includes("trophy") ||
          leagueName.includes("shield") ||
          leagueName.includes("fa ") ||
          leagueName.includes("carabao") ||
          leagueName.includes("efl") ||
          leagueType === "cup"
        );
      }
      
      if (competitionType === "friendly") {
        return (
          leagueName.includes("friendly") ||
          leagueName.includes("friendlies") ||
          leagueType === "friendly"
        );
      }
      
      return true;
    });
  }, []);

  // Fetch team statistics
  const fetchTeamStats = useCallback(async () => {
    if (!teamId) {
      console.warn(`⚠️ [TeamStats] Team ID not available for ${teamName}`);
      setError("Team ID not available. Please try again.");
      setLoading(false);
      return;
    }

    console.log(`📊 [TeamStats] Fetching statistics for team ${teamId} (${teamName}) - Season ${seasonYear}`);

    setError(null);
    setLoading(true);

    try {
      // Use apiSportsService instead of direct fetch
      const fixturesResponse = await apiSportsService.getFixtures(
        teamId,
        undefined, // leagueId - not filtering by league
        seasonYear
      );

      if (!fixturesResponse || !fixturesResponse.response) {
        throw new Error("Invalid API response");
      }

      const fixtures = fixturesResponse.response || [];
      
      console.log(`📦 [TeamStats] Received ${fixtures.length} fixtures from API`);

      // The API already filters by season, so use all fixtures returned
      // Only filter out if season explicitly doesn't match (rare edge case)
      const seasonFixtures = fixtures.filter((f: any) => {
        const fixtureSeason = f.league?.season;
        // Include if no season data (API filtered) or if season matches
        if (!fixtureSeason) return true;
        // Convert both to numbers for comparison
        const seasonNum = typeof fixtureSeason === 'number' ? fixtureSeason : parseInt(fixtureSeason);
        return seasonNum === seasonYear;
      });

      // Store all fixtures for the season
      setAllFixtures(seasonFixtures);

      // Filter finished matches only
      const finishedMatches = seasonFixtures.filter((f: any) => 
        f.fixture?.status?.short === "FT" || f.fixture?.status?.short === "AET"
      );
      
      console.log(`📊 [TeamStats] Season ${seasonYear}: ${fixtures.length} total fixtures, ${seasonFixtures.length} valid season fixtures, ${finishedMatches.length} finished matches`);
      
      if (finishedMatches.length === 0) {
        console.warn(`⚠️ [TeamStats] No finished matches found for team ${teamId} in season ${seasonYear}`);
        // Don't set error - just show empty state
        setAllFixtures(seasonFixtures);
        setFinishedFixtures([]);
        setAvailableCompetitions([]);
        setSummaryStats(null);
        setTimePeriodStats([]);
        setHalfFullTimeStats([]);
        setGoalDistribution([]);
        setCornerDistribution([]);
        isInitialLoadRef.current = false;
        setLoading(false);
        return;
      }
      
      // Detect available competitions from finished matches for this season
      const competitions = detectCompetitionsFromFixtures(finishedMatches);
      setAvailableCompetitions(competitions);
      
      console.log(`🏆 [TeamStats] Detected competitions: ${competitions.join(", ") || "None"}`);
      
      // Always start with "all" filter when fetching new season data
      const filteredMatches = filterFixturesByCompetition(finishedMatches, "all");
      setFinishedFixtures(filteredMatches);

      // Get team logo from first fixture
      if (finishedMatches.length > 0) {
        const firstFixture = finishedMatches[0];
        const teamLogoUrl = teamId === firstFixture.teams?.home?.id 
          ? firstFixture.teams.home.logo 
          : firstFixture.teams?.away?.logo;
        if (teamLogoUrl) {
          setTeamLogo(teamLogoUrl);
        } else {
          // Fallback to teamLogoService
          const logoUrl = teamLogoService.getOfficialTeamLogo(teamName);
          if (logoUrl) setTeamLogo(logoUrl);
        }
      } else {
        // If no finished matches, try to get logo from any fixture
        if (seasonFixtures.length > 0) {
          const firstFixture = seasonFixtures[0];
          const teamLogoUrl = teamId === firstFixture.teams?.home?.id 
            ? firstFixture.teams.home.logo 
            : firstFixture.teams?.away?.logo;
          if (teamLogoUrl) {
            setTeamLogo(teamLogoUrl);
          } else {
            // Fallback to teamLogoService
            const logoUrl = teamLogoService.getOfficialTeamLogo(teamName);
            if (logoUrl) setTeamLogo(logoUrl);
          }
        } else {
          // Fallback to teamLogoService if no fixtures
          const logoUrl = teamLogoService.getOfficialTeamLogo(teamName);
          if (logoUrl) setTeamLogo(logoUrl);
        }
      }

      // Calculate all statistics with filtered matches
      await recalculateAllStatistics(filteredMatches);

      // Mark initial load as complete
      isInitialLoadRef.current = false;

      console.log(`✅ [TeamStats] Successfully fetched statistics for ${teamName} - Season ${seasonYear} - ${finishedMatches.length} finished matches - Competitions: ${competitions.join(", ") || "None"}`);
    } catch (err: any) {
      console.error(`❌ [TeamStats] Error fetching team statistics:`, err);
      const errorMessage = err?.message || "Failed to load statistics. Please try again.";
      setError(errorMessage);
      isInitialLoadRef.current = false;
    } finally {
      setLoading(false);
    }
  }, [teamId, teamName, seasonYear, recalculateAllStatistics, detectCompetitionsFromFixtures, filterFixturesByCompetition, apiSportsService]);

  // Update fixtures when competition filter changes (only after initial load)
  useEffect(() => {
    // Skip on initial load - fetchTeamStats handles that
    if (isInitialLoadRef.current) {
      return;
    }
    
    // Only run this effect if we have fixtures loaded and competition filter is set
    if (allFixtures.length > 0 && selectedCompetition) {
      // Filter finished matches only (season is already validated in fetchTeamStats)
      const finishedMatches = allFixtures.filter((f: any) => 
        f.fixture?.status?.short === "FT" || f.fixture?.status?.short === "AET"
      );
      
      // Re-detect competitions from current season's finished matches to ensure accuracy
      const competitions = detectCompetitionsFromFixtures(finishedMatches);
      if (competitions.length > 0) {
        setAvailableCompetitions(competitions);
      }
      
      // Filter by selected competition
      const filtered = filterFixturesByCompetition(finishedMatches, selectedCompetition);
      
      // Only update if the filtered result is different from current finishedFixtures
      // This prevents unnecessary recalculations on initial load
      if (filtered.length !== finishedFixtures.length || 
          (filtered.length > 0 && finishedFixtures.length > 0 && 
           filtered[0]?.fixture?.id !== finishedFixtures[0]?.fixture?.id)) {
        setFinishedFixtures(filtered);
        
        // Recalculate all statistics with filtered data
        if (filtered.length > 0) {
          recalculateAllStatistics(filtered);
        } else {
          // If no matches after filtering, clear stats
          setSummaryStats(null);
          setTimePeriodStats([]);
          setHalfFullTimeStats([]);
          setGoalDistribution([]);
          setCornerDistribution([]);
        }
      }
    }
  }, [selectedCompetition, allFixtures, recalculateAllStatistics, filterFixturesByCompetition, detectCompetitionsFromFixtures]);

  // Reset competition filter when season changes
  useEffect(() => {
    // Reset to "all" competition filter when season changes
    setSelectedCompetition("all");
  }, [season]);

  // Fetch data when teamId or season changes
  useEffect(() => {
    if (!teamId) {
      console.warn(`⚠️ [TeamStats] teamId is undefined for ${teamName}. Waiting for teamId...`);
      return;
    }

    if (!seasonYear || isNaN(seasonYear)) {
      console.warn(`⚠️ [TeamStats] Invalid seasonYear: ${seasonYear} for ${teamName}`);
      return;
    }

    console.log(`🔄 [TeamStats] useEffect triggered - teamId: ${teamId}, seasonYear: ${seasonYear}, teamName: ${teamName}`);
    
    // Mark as initial load
    isInitialLoadRef.current = true;
    // Clear existing data to show loading state
    setAllFixtures([]);
    setFinishedFixtures([]);
    setAvailableCompetitions([]);
    setSummaryStats(null);
    setTimePeriodStats([]);
    setHalfFullTimeStats([]);
    setGoalDistribution([]);
    setCornerDistribution([]);
    // Fetch fresh data
    fetchTeamStats();
  }, [teamId, seasonYear, fetchTeamStats, teamName]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTeamStats();
    setRefreshing(false);
  }, [fetchTeamStats]);

  // Render summary statistics table
  const renderSummaryTable = () => {
    if (!summaryStats) return null;

    return (
      <View style={[styles.tableCard, { backgroundColor: theme.colors.backgroundSecondary }]}>
        <Text style={[styles.tableTitle, { color: theme.colors.text }]}>
          Summary Statistics
        </Text>
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <Text style={[styles.tableHeader, { color: theme.colors.textSecondary }]}>Stat</Text>
            <Text style={[styles.tableHeader, { color: theme.colors.textSecondary }]}>Home</Text>
            <Text style={[styles.tableHeader, { color: theme.colors.textSecondary }]}>Away</Text>
            <Text style={[styles.tableHeader, { color: theme.colors.textSecondary }]}>Total</Text>
          </View>
          <View style={[styles.tableRow, { backgroundColor: theme.colors.background }]}>
            <Text style={[styles.tableCell, { color: theme.colors.text }]}>Points</Text>
            <Text style={[styles.tableCell, { color: theme.colors.text }]}>{summaryStats.home.points}</Text>
            <Text style={[styles.tableCell, { color: theme.colors.text }]}>{summaryStats.away.points}</Text>
            <Text style={[styles.tableCell, { color: theme.colors.text, fontWeight: "700" }]}>{summaryStats.total.points}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, { color: theme.colors.text }]}>Matches</Text>
            <Text style={[styles.tableCell, { color: theme.colors.text }]}>{summaryStats.home.matches}</Text>
            <Text style={[styles.tableCell, { color: theme.colors.text }]}>{summaryStats.away.matches}</Text>
            <Text style={[styles.tableCell, { color: theme.colors.text, fontWeight: "700" }]}>{summaryStats.total.matches}</Text>
          </View>
          <View style={[styles.tableRow, { backgroundColor: theme.colors.background }]}>
            <Text style={[styles.tableCell, { color: theme.colors.text }]}>Wins</Text>
            <Text style={[styles.tableCell, { color: theme.colors.text }]}>{summaryStats.home.wins}</Text>
            <Text style={[styles.tableCell, { color: theme.colors.text }]}>{summaryStats.away.wins}</Text>
            <Text style={[styles.tableCell, { color: theme.colors.text, fontWeight: "700" }]}>{summaryStats.total.wins}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, { color: theme.colors.text }]}>Draws</Text>
            <Text style={[styles.tableCell, { color: theme.colors.text }]}>{summaryStats.home.draws}</Text>
            <Text style={[styles.tableCell, { color: theme.colors.text }]}>{summaryStats.away.draws}</Text>
            <Text style={[styles.tableCell, { color: theme.colors.text, fontWeight: "700" }]}>{summaryStats.total.draws}</Text>
          </View>
          <View style={[styles.tableRow, { backgroundColor: theme.colors.background }]}>
            <Text style={[styles.tableCell, { color: theme.colors.text }]}>Losses</Text>
            <Text style={[styles.tableCell, { color: theme.colors.text }]}>{summaryStats.home.losses}</Text>
            <Text style={[styles.tableCell, { color: theme.colors.text }]}>{summaryStats.away.losses}</Text>
            <Text style={[styles.tableCell, { color: theme.colors.text, fontWeight: "700" }]}>{summaryStats.total.losses}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, { color: theme.colors.text }]}>{scoreLabel} For</Text>
            <Text style={[styles.tableCell, { color: theme.colors.text }]}>{summaryStats.home.goalsFor}</Text>
            <Text style={[styles.tableCell, { color: theme.colors.text }]}>{summaryStats.away.goalsFor}</Text>
            <Text style={[styles.tableCell, { color: theme.colors.text, fontWeight: "700" }]}>{summaryStats.total.goalsFor}</Text>
          </View>
          <View style={[styles.tableRow, { backgroundColor: theme.colors.background }]}>
            <Text style={[styles.tableCell, { color: theme.colors.text }]}>{scoreLabel} Against</Text>
            <Text style={[styles.tableCell, { color: theme.colors.text }]}>{summaryStats.home.goalsAgainst}</Text>
            <Text style={[styles.tableCell, { color: theme.colors.text }]}>{summaryStats.away.goalsAgainst}</Text>
            <Text style={[styles.tableCell, { color: theme.colors.text, fontWeight: "700" }]}>{summaryStats.total.goalsAgainst}</Text>
          </View>
        </View>
      </View>
    );
  };

  // Render time period analysis table
  const renderTimePeriodTable = () => {
    if (timePeriodStats.length === 0) return null;

    return (
      <View style={[styles.tableCard, { backgroundColor: theme.colors.backgroundSecondary }]}>
        <View style={styles.tableHeaderRow}>
          <Text style={[styles.tableTitle, { color: theme.colors.text }]}>
            Time Period Analysis (0'-15' means 0'00"~14'59")
          </Text>
          <View style={styles.tabButtons}>
            <TouchableOpacity
              style={[
                styles.tabButton,
                timePeriodView === "home" && { backgroundColor: "#FF3B30" },
              ]}
              onPress={() => setTimePeriodView("home")}
            >
              <Text style={[
                styles.tabButtonText,
                { color: timePeriodView === "home" ? "#FFFFFF" : theme.colors.textSecondary }
              ]}>
                Home
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tabButton,
                timePeriodView === "away" && { backgroundColor: "#FF3B30" },
              ]}
              onPress={() => setTimePeriodView("away")}
            >
              <Text style={[
                styles.tabButtonText,
                { color: timePeriodView === "away" ? "#FFFFFF" : theme.colors.textSecondary }
              ]}>
                Away
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <Text style={[styles.tableHeader, { color: theme.colors.textSecondary }]}>Period</Text>
            <Text style={[styles.tableHeader, { color: theme.colors.textSecondary }]}>Total {scoreLabel}</Text>
            <Text style={[styles.tableHeader, { color: theme.colors.textSecondary }]}>{scoreLabel} For</Text>
            <Text style={[styles.tableHeader, { color: theme.colors.textSecondary }]}>{scoreLabel} Against</Text>
          </View>
          {timePeriodStats.map((stat, index) => (
            <View
              key={stat.period}
              style={[
                styles.tableRow,
                index % 2 === 0 && { backgroundColor: theme.colors.background }
              ]}
            >
              <Text style={[styles.tableCell, { color: theme.colors.text }]}>{stat.period}</Text>
              <Text style={[styles.tableCell, { color: theme.colors.text }]}>{stat.totalGoals}</Text>
              <Text style={[styles.tableCell, { color: "#4CAF50" }]}>{stat.goalsFor}</Text>
              <Text style={[styles.tableCell, { color: "#F44336" }]}>{stat.goalsAgainst}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  // Render half-full time table
  const renderHalfFullTimeTable = () => {
    if (halfFullTimeStats.length === 0) return null;

    const getResultLabel = (half: "W" | "D" | "L", full: "W" | "D" | "L"): string => {
      const labels: { [key: string]: string } = {
        "W-W": "Win-Win",
        "W-D": "Win-Draw",
        "W-L": "Win-Loss",
        "D-W": "Draw-Win",
        "D-D": "Draw-Draw",
        "D-L": "Draw-Loss",
        "L-W": "Loss-Win",
        "L-D": "Loss-Draw",
        "L-L": "Loss-Loss",
      };
      return labels[`${half}-${full}`] || `${half}-${full}`;
    };

    return (
      <View style={[styles.tableCard, { backgroundColor: theme.colors.backgroundSecondary }]}>
        <Text style={[styles.tableTitle, { color: theme.colors.text }]}>
          Half-Full Time Results
        </Text>
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <Text style={[styles.tableHeader, { color: theme.colors.textSecondary }]}>Result</Text>
            <Text style={[styles.tableHeader, { color: theme.colors.textSecondary }]}>Home</Text>
            <Text style={[styles.tableHeader, { color: theme.colors.textSecondary }]}>Away</Text>
            <Text style={[styles.tableHeader, { color: theme.colors.textSecondary }]}>Total</Text>
          </View>
          {halfFullTimeStats
            .filter(stat => stat.total > 0)
            .map((stat, index) => (
              <View
                key={`${stat.halfTime}-${stat.fullTime}`}
                style={[
                  styles.tableRow,
                  index % 2 === 0 && { backgroundColor: theme.colors.background }
                ]}
              >
                <Text style={[styles.tableCell, { color: theme.colors.text }]}>
                  {getResultLabel(stat.halfTime, stat.fullTime)}
                </Text>
                <Text style={[
                  styles.tableCell,
                  { color: stat.home > 0 ? "#FF3B30" : theme.colors.text }
                ]}>
                  {stat.home}
                </Text>
                <Text style={[
                  styles.tableCell,
                  { color: stat.away > 0 ? "#FF3B30" : theme.colors.text }
                ]}>
                  {stat.away}
                </Text>
                <Text style={[
                  styles.tableCell,
                  { color: stat.total > 0 ? "#FF3B30" : theme.colors.text, fontWeight: "700" }
                ]}>
                  {stat.total}
                </Text>
              </View>
            ))}
        </View>
      </View>
    );
  };

  // Render goal distribution table
  const renderGoalDistributionTable = () => {
    if (goalDistribution.length === 0) return null;

    return (
      <View style={[styles.tableCard, { backgroundColor: theme.colors.backgroundSecondary }]}>
        <Text style={[styles.tableTitle, { color: theme.colors.text }]}>
          {scoreLabel} Distribution
        </Text>
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <Text style={[styles.tableHeader, { color: theme.colors.textSecondary }]}>{scoreLabel}</Text>
            <Text style={[styles.tableHeader, { color: theme.colors.textSecondary }]}>Home</Text>
            <Text style={[styles.tableHeader, { color: theme.colors.textSecondary }]}>Away</Text>
            <Text style={[styles.tableHeader, { color: theme.colors.textSecondary }]}>Total</Text>
          </View>
          {goalDistribution.map((dist, index) => (
            <View
              key={dist.goals}
              style={[
                styles.tableRow,
                index % 2 === 0 && { backgroundColor: theme.colors.background }
              ]}
            >
              <Text style={[styles.tableCell, { color: theme.colors.text }]}>
                {dist.goals === 7 ? "7+" : dist.goals}
              </Text>
              <Text style={[styles.tableCell, { color: theme.colors.text }]}>{dist.home}</Text>
              <Text style={[styles.tableCell, { color: theme.colors.text }]}>{dist.away}</Text>
              <Text style={[styles.tableCell, { color: theme.colors.text, fontWeight: "700" }]}>{dist.total}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  // Render corner distribution table
  const renderCornerDistributionTable = () => {
    if (cornerDistribution.length === 0) return null;

    return (
      <View style={[styles.tableCard, { backgroundColor: theme.colors.backgroundSecondary }]}>
        <Text style={[styles.tableTitle, { color: theme.colors.text }]}>
          Corner Kick Distribution
        </Text>
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <Text style={[styles.tableHeader, { color: theme.colors.textSecondary }]}>Range</Text>
            <Text style={[styles.tableHeader, { color: theme.colors.textSecondary }]}>Home</Text>
            <Text style={[styles.tableHeader, { color: theme.colors.textSecondary }]}>Away</Text>
            <Text style={[styles.tableHeader, { color: theme.colors.textSecondary }]}>Total</Text>
          </View>
          {cornerDistribution.map((dist, index) => (
            <View
              key={dist.range}
              style={[
                styles.tableRow,
                index % 2 === 0 && { backgroundColor: theme.colors.background }
              ]}
            >
              <Text style={[styles.tableCell, { color: theme.colors.text }]}>{dist.range}</Text>
              <Text style={[styles.tableCell, { color: theme.colors.text }]}>{dist.home}</Text>
              <Text style={[styles.tableCell, { color: theme.colors.text }]}>{dist.away}</Text>
              <Text style={[styles.tableCell, { color: theme.colors.text, fontWeight: "700" }]}>{dist.total}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  // Render points ranking table
  const renderPointsRankingTable = () => {
    if (!summaryStats) return null;

    return (
      <View style={[styles.tableCard, { backgroundColor: theme.colors.backgroundSecondary }]}>
        <Text style={[styles.tableTitle, { color: theme.colors.text }]}>
          Points Ranking
        </Text>
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <Text style={[styles.tableHeader, { color: theme.colors.textSecondary }]}>Category</Text>
            <Text style={[styles.tableHeader, { color: theme.colors.textSecondary }]}>Matches</Text>
            <Text style={[styles.tableHeader, { color: theme.colors.textSecondary }]}>W/D/L</Text>
            <Text style={[styles.tableHeader, { color: theme.colors.textSecondary }]}>Goals</Text>
            <Text style={[styles.tableHeader, { color: theme.colors.textSecondary }]}>Points</Text>
          </View>
          <View style={[styles.tableRow, { backgroundColor: theme.colors.background }]}>
            <Text style={[styles.tableCell, { color: theme.colors.text }]}>Total</Text>
            <Text style={[styles.tableCell, { color: theme.colors.text }]}>{summaryStats.total.matches}</Text>
            <Text style={[styles.tableCell, { color: theme.colors.text }]}>
              {summaryStats.total.wins}/{summaryStats.total.draws}/{summaryStats.total.losses}
            </Text>
            <Text style={[styles.tableCell, { color: theme.colors.text }]}>
              {summaryStats.total.goalsFor}/{summaryStats.total.goalsAgainst}
            </Text>
            <Text style={[styles.tableCell, { color: theme.colors.text, fontWeight: "700" }]}>{summaryStats.total.points}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, { color: theme.colors.text }]}>Home</Text>
            <Text style={[styles.tableCell, { color: theme.colors.text }]}>{summaryStats.home.matches}</Text>
            <Text style={[styles.tableCell, { color: theme.colors.text }]}>
              {summaryStats.home.wins}/{summaryStats.home.draws}/{summaryStats.home.losses}
            </Text>
            <Text style={[styles.tableCell, { color: theme.colors.text }]}>
              {summaryStats.home.goalsFor}/{summaryStats.home.goalsAgainst}
            </Text>
            <Text style={[styles.tableCell, { color: theme.colors.text, fontWeight: "700" }]}>{summaryStats.home.points}</Text>
          </View>
          <View style={[styles.tableRow, { backgroundColor: theme.colors.background }]}>
            <Text style={[styles.tableCell, { color: theme.colors.text }]}>Away</Text>
            <Text style={[styles.tableCell, { color: theme.colors.text }]}>{summaryStats.away.matches}</Text>
            <Text style={[styles.tableCell, { color: theme.colors.text }]}>
              {summaryStats.away.wins}/{summaryStats.away.draws}/{summaryStats.away.losses}
            </Text>
            <Text style={[styles.tableCell, { color: theme.colors.text }]}>
              {summaryStats.away.goalsFor}/{summaryStats.away.goalsAgainst}
            </Text>
            <Text style={[styles.tableCell, { color: theme.colors.text, fontWeight: "700" }]}>{summaryStats.away.points}</Text>
          </View>
        </View>
      </View>
    );
  };

  // Render total goals index table
  const renderTotalGoalsIndexTable = () => {
    if (!summaryStats) return null;

    // Calculate over/under statistics
    const calculateOverUnder = (matches: any[], isHome: boolean) => {
      let over = 0;
      let under = 0;
      const threshold = 2.5; // Standard over/under threshold

      matches.forEach((fixture: any) => {
        const teamGoals = isHome ? fixture.goals.home : fixture.goals.away;
        const opponentGoals = isHome ? fixture.goals.away : fixture.goals.home;
        const totalGoals = (teamGoals || 0) + (opponentGoals || 0);
        
        if (totalGoals > threshold) over++;
        else if (totalGoals < threshold) under++;
      });

      return { over, under, total: matches.length };
    };

    const homeOverUnder = calculateOverUnder(
      finishedFixtures.filter((f: any) => f.teams.home.id === teamId),
      true
    );
    const awayOverUnder = calculateOverUnder(
      finishedFixtures.filter((f: any) => f.teams.away.id === teamId),
      false
    );
    const totalOverUnder = {
      over: homeOverUnder.over + awayOverUnder.over,
      under: homeOverUnder.under + awayOverUnder.under,
      total: homeOverUnder.total + awayOverUnder.total,
    };

    return (
      <View style={[styles.tableCard, { backgroundColor: theme.colors.backgroundSecondary }]}>
        <Text style={[styles.tableTitle, { color: theme.colors.text }]}>
          Total Goals Index
        </Text>
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <Text style={[styles.tableHeader, { color: theme.colors.textSecondary }]}>Category</Text>
            <Text style={[styles.tableHeader, { color: theme.colors.textSecondary }]}>Matches</Text>
            <Text style={[styles.tableHeader, { color: theme.colors.textSecondary }]}>Over</Text>
            <Text style={[styles.tableHeader, { color: theme.colors.textSecondary }]}>Under</Text>
            <Text style={[styles.tableHeader, { color: theme.colors.textSecondary }]}>Over Rate</Text>
            <Text style={[styles.tableHeader, { color: theme.colors.textSecondary }]}>Under Rate</Text>
          </View>
          <View style={[styles.tableRow, { backgroundColor: theme.colors.background }]}>
            <Text style={[styles.tableCell, { color: theme.colors.text }]}>Home</Text>
            <Text style={[styles.tableCell, { color: theme.colors.text }]}>{homeOverUnder.total}</Text>
            <Text style={[styles.tableCell, { color: "#4CAF50" }]}>{homeOverUnder.over}</Text>
            <Text style={[styles.tableCell, { color: "#F44336" }]}>{homeOverUnder.under}</Text>
            <Text style={[styles.tableCell, { color: theme.colors.text }]}>
              {homeOverUnder.total > 0 ? Math.round((homeOverUnder.over / homeOverUnder.total) * 100) : 0}%
            </Text>
            <Text style={[styles.tableCell, { color: theme.colors.text }]}>
              {homeOverUnder.total > 0 ? Math.round((homeOverUnder.under / homeOverUnder.total) * 100) : 0}%
            </Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, { color: theme.colors.text }]}>Away</Text>
            <Text style={[styles.tableCell, { color: theme.colors.text }]}>{awayOverUnder.total}</Text>
            <Text style={[styles.tableCell, { color: "#4CAF50" }]}>{awayOverUnder.over}</Text>
            <Text style={[styles.tableCell, { color: "#F44336" }]}>{awayOverUnder.under}</Text>
            <Text style={[styles.tableCell, { color: theme.colors.text }]}>
              {awayOverUnder.total > 0 ? Math.round((awayOverUnder.over / awayOverUnder.total) * 100) : 0}%
            </Text>
            <Text style={[styles.tableCell, { color: theme.colors.text }]}>
              {awayOverUnder.total > 0 ? Math.round((awayOverUnder.under / awayOverUnder.total) * 100) : 0}%
            </Text>
          </View>
          <View style={[styles.tableRow, { backgroundColor: theme.colors.background }]}>
            <Text style={[styles.tableCell, { color: theme.colors.text }]}>Total</Text>
            <Text style={[styles.tableCell, { color: theme.colors.text }]}>{totalOverUnder.total}</Text>
            <Text style={[styles.tableCell, { color: "#4CAF50" }]}>{totalOverUnder.over}</Text>
            <Text style={[styles.tableCell, { color: "#F44336" }]}>{totalOverUnder.under}</Text>
            <Text style={[styles.tableCell, { color: theme.colors.text, fontWeight: "700" }]}>
              {totalOverUnder.total > 0 ? Math.round((totalOverUnder.over / totalOverUnder.total) * 100) : 0}%
            </Text>
            <Text style={[styles.tableCell, { color: theme.colors.text, fontWeight: "700" }]}>
              {totalOverUnder.total > 0 ? Math.round((totalOverUnder.under / totalOverUnder.total) * 100) : 0}%
            </Text>
          </View>
        </View>
      </View>
    );
  };

  // Render odd/even statistics table
  const renderOddEvenTable = () => {
    if (!summaryStats) return null;

    const calculateOddEven = (matches: any[], isHome: boolean) => {
      let odd = 0;
      let even = 0;

      matches.forEach((fixture: any) => {
        const teamGoals = isHome ? fixture.goals.home : fixture.goals.away;
        const opponentGoals = isHome ? fixture.goals.away : fixture.goals.home;
        const totalGoals = (teamGoals || 0) + (opponentGoals || 0);
        
        if (totalGoals % 2 === 0) even++;
        else odd++;
      });

      return { odd, even, total: matches.length };
    };

    const homeOddEven = calculateOddEven(
      finishedFixtures.filter((f: any) => f.teams.home.id === teamId),
      true
    );
    const awayOddEven = calculateOddEven(
      finishedFixtures.filter((f: any) => f.teams.away.id === teamId),
      false
    );
    const totalOddEven = {
      odd: homeOddEven.odd + awayOddEven.odd,
      even: homeOddEven.even + awayOddEven.even,
      total: homeOddEven.total + awayOddEven.total,
    };

    return (
      <View style={[styles.tableCard, { backgroundColor: theme.colors.backgroundSecondary }]}>
        <Text style={[styles.tableTitle, { color: theme.colors.text }]}>
          Odd/Even Statistics
        </Text>
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <Text style={[styles.tableHeader, { color: theme.colors.textSecondary }]}>Category</Text>
            <Text style={[styles.tableHeader, { color: theme.colors.textSecondary }]}>Matches</Text>
            <Text style={[styles.tableHeader, { color: theme.colors.textSecondary }]}>Odd</Text>
            <Text style={[styles.tableHeader, { color: theme.colors.textSecondary }]}>Even</Text>
            <Text style={[styles.tableHeader, { color: theme.colors.textSecondary }]}>Odd Rate</Text>
            <Text style={[styles.tableHeader, { color: theme.colors.textSecondary }]}>Even Rate</Text>
          </View>
          <View style={[styles.tableRow, { backgroundColor: theme.colors.background }]}>
            <Text style={[styles.tableCell, { color: theme.colors.text }]}>Home</Text>
            <Text style={[styles.tableCell, { color: theme.colors.text }]}>{homeOddEven.total}</Text>
            <Text style={[styles.tableCell, { color: "#F44336" }]}>{homeOddEven.odd}</Text>
            <Text style={[styles.tableCell, { color: "#4CAF50" }]}>{homeOddEven.even}</Text>
            <Text style={[styles.tableCell, { color: theme.colors.text }]}>
              {homeOddEven.total > 0 ? Math.round((homeOddEven.odd / homeOddEven.total) * 100) : 0}%
            </Text>
            <Text style={[styles.tableCell, { color: theme.colors.text }]}>
              {homeOddEven.total > 0 ? Math.round((homeOddEven.even / homeOddEven.total) * 100) : 0}%
            </Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, { color: theme.colors.text }]}>Away</Text>
            <Text style={[styles.tableCell, { color: theme.colors.text }]}>{awayOddEven.total}</Text>
            <Text style={[styles.tableCell, { color: "#F44336" }]}>{awayOddEven.odd}</Text>
            <Text style={[styles.tableCell, { color: "#4CAF50" }]}>{awayOddEven.even}</Text>
            <Text style={[styles.tableCell, { color: theme.colors.text }]}>
              {awayOddEven.total > 0 ? Math.round((awayOddEven.odd / awayOddEven.total) * 100) : 0}%
            </Text>
            <Text style={[styles.tableCell, { color: theme.colors.text }]}>
              {awayOddEven.total > 0 ? Math.round((awayOddEven.even / awayOddEven.total) * 100) : 0}%
            </Text>
          </View>
          <View style={[styles.tableRow, { backgroundColor: theme.colors.background }]}>
            <Text style={[styles.tableCell, { color: theme.colors.text }]}>Total</Text>
            <Text style={[styles.tableCell, { color: theme.colors.text }]}>{totalOddEven.total}</Text>
            <Text style={[styles.tableCell, { color: "#F44336" }]}>{totalOddEven.odd}</Text>
            <Text style={[styles.tableCell, { color: "#4CAF50" }]}>{totalOddEven.even}</Text>
            <Text style={[styles.tableCell, { color: theme.colors.text, fontWeight: "700" }]}>
              {totalOddEven.total > 0 ? Math.round((totalOddEven.odd / totalOddEven.total) * 100) : 0}%
            </Text>
            <Text style={[styles.tableCell, { color: theme.colors.text, fontWeight: "700" }]}>
              {totalOddEven.total > 0 ? Math.round((totalOddEven.even / totalOddEven.total) * 100) : 0}%
            </Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={teamColors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
          Loading statistics...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={[styles.errorText, { color: theme.colors.text }]}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[teamColors.primary]}
          tintColor={teamColors.primary}
        />
      }
    >
      {/* Team Header */}
      {teamLogo && (
        <View style={styles.teamHeader}>
          <Image source={{ uri: teamLogo }} style={styles.teamLogo} resizeMode="contain" />
          <Text style={[styles.teamName, { color: theme.colors.text }]}>{teamName}</Text>
        </View>
      )}

      {/* Competition Filter Tabs */}
      {availableCompetitions.length > 1 && (
        <View style={styles.filterTabs}>
          {availableCompetitions.map((comp) => {
            const isSelected = selectedCompetition === comp;
            return (
              <TouchableOpacity
                key={comp}
                style={[
                  styles.filterTab,
                  isSelected && styles.filterTabSelected,
                  {
                    borderColor: isSelected ? teamColors.primary : "transparent",
                    backgroundColor: isSelected 
                      ? (theme.colors.background === "#2A2A2A" || theme.colors.text === "#FFFFFF" 
                          ? `${teamColors.primary}26` 
                          : `${teamColors.primary}1A`)
                      : "rgba(128, 128, 128, 0.1)",
                  },
                ]}
                onPress={() => setSelectedCompetition(comp)}
              >
                <Text
                  style={[
                    styles.filterTabText,
                    {
                      color: isSelected ? teamColors.primary : theme.colors.textSecondary,
                      fontWeight: isSelected ? "600" : "400",
                    },
                  ]}
                >
                  {comp === "all" ? "All" : comp.charAt(0).toUpperCase() + comp.slice(1)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Statistics Tables */}
      {renderSummaryTable()}
      {renderPointsRankingTable()}
      {renderTimePeriodTable()}
      {renderHalfFullTimeTable()}
      {renderTotalGoalsIndexTable()}
      {renderGoalDistributionTable()}
      {renderOddEvenTable()}
      {renderCornerDistributionTable()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 32,
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  errorText: {
    fontSize: 14,
    textAlign: "center",
  },
  teamHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 16,
    gap: 12,
  },
  teamLogo: {
    width: 48,
    height: 48,
  },
  teamName: {
    fontSize: 20,
    fontWeight: "700",
  },
  filterTabs: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "transparent",
  },
  filterTabSelected: {
    borderColor: "#FF3B30",
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: "400",
  },
  tableCard: {
    marginBottom: 16,
    paddingVertical: 16,
  },
  tableTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  tableHeaderRow: {
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  tabButtons: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  tabButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "rgba(128, 128, 128, 0.1)",
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: "600",
  },
  table: {
    width: "100%",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(128, 128, 128, 0.1)",
  },
  tableHeader: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  tableCell: {
    flex: 1,
    fontSize: 13,
    textAlign: "center",
  },
});

