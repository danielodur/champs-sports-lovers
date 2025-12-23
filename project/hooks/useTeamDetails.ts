/**
 * useTeamDetails Hook
 * Comprehensive hook for fetching all team-related data
 * Replaces mock data with real API data from API-Football and TheSportsDB
 */

import { useState, useEffect } from "react";
import { teamDetailsApi, TeamInfo, TeamStatistics, TeamFixture, TeamPlayer, TeamTransfer, LeagueStanding, TeamNews, TeamHonor } from "@/services/teamDetailsApiService";

export interface FormerManager {
  name: string;
  photo: string;
  startDate: string;
  endDate: string;
  matchesManaged: number;
  wins: number;
  draws: number;
  losses: number;
  winPercentage: number;
}

export interface UseTeamDetailsResult {
  // Team Info
  teamInfo: TeamInfo | null;
  
  // Statistics & Form
  statistics: TeamStatistics | null;
  
  // Matches
  upcomingMatches: TeamFixture[];
  recentMatches: TeamFixture[];
  
  // Squad
  squad: TeamPlayer[];
  
  // Transfers
  transfers: TeamTransfer[];
  
  // League Table
  leagueStandings: LeagueStanding[];
  
  // News
  news: TeamNews[];
  
  // Former Managers
  formerManagers: FormerManager[];
  
  // Honors/Trophies
  honors: TeamHonor[];
  
  // Loading States
  loading: {
    teamInfo: boolean;
    statistics: boolean;
    matches: boolean;
    squad: boolean;
    transfers: boolean;
    standings: boolean;
    managers: boolean;
    honors: boolean;
  };
  
  // Errors
  error: string | null;
  
  // Actions
  refresh: () => Promise<void>;
}

export function useTeamDetails(
  teamName: string,
  leagueId?: number,
  season?: number,
  teamId?: number,
  sport?: string // ✅ Add sport parameter
): UseTeamDetailsResult {
  const currentSeason = season || new Date().getFullYear();
  const activeSport = sport || "football"; // ✅ Default to football
  
  console.log("🏀⚽ [useTeamDetails] Initialized with sport:", activeSport);
  
  const [teamInfo, setTeamInfo] = useState<TeamInfo | null>(null);
  const [statistics, setStatistics] = useState<TeamStatistics | null>(null);
  const [upcomingMatches, setUpcomingMatches] = useState<TeamFixture[]>([]);
  const [recentMatches, setRecentMatches] = useState<TeamFixture[]>([]);
  const [squad, setSquad] = useState<TeamPlayer[]>([]);
  const [transfers, setTransfers] = useState<TeamTransfer[]>([]);
  const [leagueStandings, setLeagueStandings] = useState<LeagueStanding[]>([]);
  const [news, setNews] = useState<TeamNews[]>([]);
  const [formerManagers, setFormerManagers] = useState<FormerManager[]>([]);
  const [honors, setHonors] = useState<TeamHonor[]>([]);
  
  const [loading, setLoading] = useState({
    teamInfo: false, // Start with false for immediate display
    statistics: false, // Load progressively
    matches: false,
    squad: false,
    transfers: false,
    standings: false,
    managers: false,
    honors: false,
  });
  
  const [error, setError] = useState<string | null>(null);

  const fetchAllData = async () => {
    if (!teamName) {
      setError("Team name is required");
      return;
    }

    try {
      console.log(`🔄 [useTeamDetails] Fetching team details for: ${teamName}`);
      console.log(`⏱️ [useTeamDetails] START TIME:`, new Date().toISOString());
      
      // Step 1: Fetch team info FIRST (critical for getting team ID and league ID)
      setLoading(prev => ({ ...prev, teamInfo: true }));
      
      const startTime = Date.now();
      // CRITICAL: Pass teamId and leagueId for accurate team detection
      console.log(`🎯 [useTeamDetails] Fetching team info with: teamName="${teamName}", teamId=${teamId}, leagueId=${leagueId}`);
      const info = await teamDetailsApi.getTeamInfo(teamName, teamId, leagueId);
      const teamInfoTime = Date.now() - startTime;
      console.log(`⏱️ [useTeamDetails] Team info fetched in ${teamInfoTime}ms`);
      
      if (!info) {
        const errorMsg = teamId 
          ? `Team "${teamName}" (ID: ${teamId}) not found${leagueId ? ` in league ${leagueId}` : ''}`
          : `Team "${teamName}" not found${leagueId ? ` in league ${leagueId}` : ''}`;
        console.warn(`⚠️ [useTeamDetails] ${errorMsg}`);
        setLoading(prev => ({ ...prev, teamInfo: false }));
        setError(errorMsg);
        return;
      }
      
      // CRITICAL: Verify the found team matches what we expected
      if (teamId && info.id !== teamId) {
        console.warn(`⚠️ [useTeamDetails] CRITICAL: Team ID mismatch! Expected ${teamId}, got ${info.id}`);
        console.warn(`   Expected team: ${teamName}, Found team: ${info.name}`);
        setLoading(prev => ({ ...prev, teamInfo: false }));
        setError(`Team ID mismatch: Expected ${teamId}, got ${info.id}`);
        return;
      }
      
      console.log(`✅ [useTeamDetails] Successfully found team: ${info.name} (ID: ${info.id})${info.league ? ` in league ${info.league.name} (${info.league.id})` : ''}`);
      console.log(`🏆 [useTeamDetails] FIFA Ranking in teamInfo: ${info.fifaRanking || 'NOT SET'}`);

      const foundTeamId = info.id;
      console.log(`✅ [useTeamDetails] Team ID: ${foundTeamId}, League ID: ${info.league?.id}`);
      
      // Update with real team info IMMEDIATELY
      setTeamInfo(info);
      console.log(`🏆 [useTeamDetails] TeamInfo state updated with FIFA Ranking: ${info.fifaRanking || 'NOT SET'}`);
      setLoading(prev => ({ ...prev, teamInfo: false }));
      
      // Step 1.5: Fetch additional info in background (non-blocking)
      Promise.all([
        teamDetailsApi.getTeamCoach(foundTeamId),
        teamDetailsApi.getTeamMarketValue(teamName),
      ]).then(([coachName, marketValue]) => {
        if (coachName || (marketValue && marketValue > 0)) {
          setTeamInfo(prev => prev ? {
            ...prev,
            teamManager: coachName || prev.teamManager,
            marketValue: (marketValue && marketValue > 0) ? marketValue : prev.marketValue,
          } : prev);
        }
      }).catch(err => console.warn("Additional info fetch error:", err));

      // Step 2: Fetch all data in parallel (non-blocking)
      // Each section loads independently without blocking others
      
      // Determine the league ID to use (prioritize teamInfo.league.id if available)
      const finalLeagueId = info?.league?.id || leagueId;
      
      // CRITICAL: Standings and Statistics (HIGH PRIORITY - Load in parallel)
      if (finalLeagueId) {
        console.log(`📊 [useTeamDetails] Fetching standings & stats for league ${finalLeagueId}`);
        
        // Standings - HIGHEST PRIORITY (for Table tab)
        setLoading(prev => ({ ...prev, standings: true }));
        const standingsStart = Date.now();
        teamDetailsApi.getLeagueStandings(finalLeagueId, currentSeason)
          .then(standings => {
            const standingsTime = Date.now() - standingsStart;
            console.log(`✅ [useTeamDetails] Standings loaded in ${standingsTime}ms:`, standings?.length || 0, "teams");
            setLeagueStandings(standings);
            setLoading(prev => ({ ...prev, standings: false }));
          })
          .catch(err => {
            console.warn("⚠️ [useTeamDetails] Standings fetch error:", err);
            setLoading(prev => ({ ...prev, standings: false }));
          });

        // Statistics - Load in parallel but lower priority
        setLoading(prev => ({ ...prev, statistics: true }));
        teamDetailsApi.getTeamStatistics(foundTeamId, finalLeagueId, currentSeason)
          .then(stats => {
            setStatistics(stats);
            setLoading(prev => ({ ...prev, statistics: false }));
          })
          .catch(err => {
            console.warn("⚠️ [useTeamDetails] Statistics fetch error:", err);
            setLoading(prev => ({ ...prev, statistics: false }));
          });
      } else {
        console.log(`⚠️ [useTeamDetails] No league ID available for ${teamName}`);
        setLoading(prev => ({ ...prev, standings: false, statistics: false }));
      }

      // Matches - Load independently (MEDIUM PRIORITY)
      setLoading(prev => ({ ...prev, matches: true }));
      const matchesStart = Date.now();
      Promise.all([
        teamDetailsApi.getUpcomingMatches(foundTeamId, 5),
        teamDetailsApi.getRecentMatches(foundTeamId, 10),
      ])
        .then(([upcoming, recent]) => {
          const matchesTime = Date.now() - matchesStart;
          console.log(`⏱️ [useTeamDetails] Matches loaded in ${matchesTime}ms`);
          setUpcomingMatches(upcoming);
          setRecentMatches(recent);
          setLoading(prev => ({ ...prev, matches: false }));
        })
        .catch(err => {
          console.warn("⚠️ [useTeamDetails] Matches fetch error:", err);
          setLoading(prev => ({ ...prev, matches: false }));
        });

      // Squad - Load independently (LOW PRIORITY - Only when squad tab is viewed)
      setLoading(prev => ({ ...prev, squad: true }));
      console.log(`⏱️ [useTeamDetails] Starting squad fetch (low priority)...`);
      teamDetailsApi.getTeamSquad(foundTeamId, currentSeason)
        .then(squadData => {
          console.log(`✅ [useTeamDetails] Squad loaded:`, squadData?.length || 0, "players");
          setSquad(squadData);
          
          // Calculate squad statistics and update teamInfo
          if (squadData.length > 0) {
            const squadStats = teamDetailsApi.getSquadStatistics(squadData);
            setTeamInfo(prev => prev ? {
              ...prev,
              totalMembers: squadStats.totalMembers,
              averageAge: squadStats.averageAge,
            } : null);
          }
          
          setLoading(prev => ({ ...prev, squad: false }));
        })
        .catch(err => {
          console.warn("⚠️ [useTeamDetails] Squad fetch error:", err);
          setLoading(prev => ({ ...prev, squad: false }));
        });

      // Transfers - Load independently
      setLoading(prev => ({ ...prev, transfers: true }));
      teamDetailsApi.getTeamTransfers(teamName)
        .then(transfersData => {
          setTransfers(transfersData);
          setLoading(prev => ({ ...prev, transfers: false }));
        })
        .catch(err => {
          console.warn("⚠️ [useTeamDetails] Transfers fetch error:", err);
          setLoading(prev => ({ ...prev, transfers: false }));
        });

      // News - Load independently
      teamDetailsApi.getTeamNews(teamName)
        .then(newsData => {
          setNews(newsData);
        })
        .catch(err => {
          console.warn("⚠️ [useTeamDetails] News fetch error:", err);
        });

      // Former Managers - Load independently
      setLoading(prev => ({ ...prev, managers: true }));
      teamDetailsApi.getFormerManagers(foundTeamId)
        .then(managersData => {
          setFormerManagers(managersData);
          setLoading(prev => ({ ...prev, managers: false }));
        })
        .catch(err => {
          console.warn("⚠️ [useTeamDetails] Managers fetch error:", err);
          setLoading(prev => ({ ...prev, managers: false }));
        });

      // Team Honors/Trophies - Load independently
      setLoading(prev => ({ ...prev, honors: true }));
      teamDetailsApi.getTeamHonors(foundTeamId)
        .then(honorsData => {
          setHonors(honorsData);
          setLoading(prev => ({ ...prev, honors: false }));
        })
        .catch(err => {
          console.warn("⚠️ [useTeamDetails] Honors fetch error:", err);
          setLoading(prev => ({ ...prev, honors: false }));
        });

      // No need to wait for all promises - each loads independently
      
      console.log(`✅ Team details loaded for: ${teamName}`);
      setError(null);
      
    } catch (err) {
      console.warn("⚠️ [useTeamDetails] Error fetching team details:", err);
      setError(err instanceof Error ? err.message : "Failed to load team details");
      
      // Set all loading states to false on error
      setLoading({
        teamInfo: false,
        statistics: false,
        matches: false,
        squad: false,
        transfers: false,
        standings: false,
        managers: false,
        honors: false,
      });
    }
  };

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      if (!cancelled) {
        await fetchAllData();
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, [teamName, leagueId, currentSeason, teamId]);

  const refresh = async () => {
    setLoading({
      teamInfo: true,
      statistics: true,
      matches: true,
      squad: true,
      transfers: true,
      standings: true,
      managers: true,
      honors: true,
    });
    await fetchAllData();
  };

  return {
    teamInfo,
    statistics,
    upcomingMatches,
    recentMatches,
    squad,
    transfers,
    leagueStandings,
    news,
    formerManagers,
    honors,
    loading,
    error,
    refresh,
  };
}

