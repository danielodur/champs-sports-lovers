/**
 * Team Honors Component
 * Displays team honors with trophy icons and season badges
 * Fetches honors from API-Football trophies endpoint
 */

import React, { useState, useEffect, useLayoutEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import leagueLogoService from "@/services/leagueLogoService";
import { teamColorService } from "@/services/teamColorService";

interface TeamHonor {
  id: string;
  competition: string;
  competitionLogo: string;
  timesWon: number;
  seasons: Array<{
    year: string;
    team: string;
    teamLogo?: string;
  }>;
}

interface TeamHonorsProps {
  honors?: TeamHonor[];
  theme: any;
  teamColors?: {
    primary: string;
    secondary: string;
  };
  teamId?: number;
  teamName?: string;
  teamLogo?: string;
}

// Get trophy emoji based on competition
const getTrophyEmoji = (competition: string): string => {
  const compLower = competition.toLowerCase();
  if (compLower.includes("champions league") || compLower.includes("european cup")) {
    return "🏆";
  }
  if (compLower.includes("world cup")) {
    return "🏆";
  }
  if (compLower.includes("super cup")) {
    return "🏅";
  }
  return "🏆";
};

export default function TeamHonors({
  honors: propHonors = [],
  theme,
  teamColors = { primary: "#FF1744", secondary: "#FF6B35" },
  teamId,
  teamName = "",
  teamLogo: propTeamLogo = "",
}: TeamHonorsProps) {
  console.log(`🚀 [TeamHonors] Component rendered with props:`, {
    teamId,
    teamIdType: typeof teamId,
    teamName,
    propHonorsCount: propHonors?.length || 0,
    hasTeamLogo: !!propTeamLogo,
  });

  const [showAllHonors, setShowAllHonors] = useState(false);
  const [expandedHonor, setExpandedHonor] = useState<number | null>(null);
  const [honors, setHonors] = useState<TeamHonor[]>(propHonors);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const isMountedRef = useRef(true);
  // Use a Map to track which teamIds have been fetched (persists across renders but resets per teamId)
  const fetchedTeamIdsRef = useRef<Set<number>>(new Set());
  const fetchHonorsRef = useRef<(() => Promise<void>) | null>(null);
  const prevTeamIdRef = useRef<number | undefined>(undefined);

  // Log immediately after state initialization to verify component is mounting
  console.log(`🔧 [TeamHonors] State initialized, teamId: ${teamId}, honors count: ${honors.length}`);

  // Track previous teamId and check if we need to fetch
  const teamIdChanged = prevTeamIdRef.current !== teamId;
  
  if (teamIdChanged) {
    console.log(`🔄 [TeamHonors] teamId changed from ${prevTeamIdRef.current} to ${teamId}`);
    prevTeamIdRef.current = teamId;
    // Clear the fetched flag when teamId changes, so we fetch again
    if (teamId) {
      fetchedTeamIdsRef.current.delete(teamId);
      console.log(`🔄 [TeamHonors] Cleared fetched flag for teamId: ${teamId}`);
    }
  }
  
  // Check if we've fetched AND have data - if we have no honors, we should fetch again
  const hasFetchedForThisTeam = teamId ? fetchedTeamIdsRef.current.has(teamId) : false;
  const shouldFetch = teamId && (!hasFetchedForThisTeam || honors.length === 0);
  
  console.log(`🔧 [TeamHonors] Fetch status - teamId: ${teamId}, hasFetchedForThisTeam: ${hasFetchedForThisTeam}, honorsCount: ${honors.length}, shouldFetch: ${shouldFetch}`);

  const isDarkMode = theme.colors.background === "#2A2A2A";
  const greyBackground = isDarkMode ? "#3A3A3A" : "#F5F5F5";
  const borderColor = isDarkMode ? "#4A4A4A" : "#E0E0E0";

  // Helper function to get readable text color for team primary color
  // If team color is bright (like yellow), use white/light text for better contrast
  // Otherwise, use the team color itself
  const getReadableTextColor = (teamColor: string): string => {
    const isBright = teamColorService.isLightColor(teamColor);
    if (isBright) {
      // For bright colors (yellow, light blue, etc.), use white/light text
      return isDarkMode ? "#FFFFFF" : theme.colors.text;
    }
    // For dark colors, use the team color itself
    return teamColor;
  };

  // Helper to convert propHonors format (seasons as strings) to component format (seasons as objects)
  // The service returns TeamHonor with seasons: string[], but component expects seasons: Array<{year, team, teamLogo}>
  const convertPropHonorsFormat = useCallback((honors: any[]): TeamHonor[] => {
    return honors.map((honor, index) => ({
      id: honor.id || `honor-${teamId || 'unknown'}-${index}`,
      competition: honor.competition || "Trophy",
      competitionLogo: honor.competitionLogo || "",
      timesWon: honor.timesWon || 0,
      seasons: (honor.seasons || []).map((season: any) => {
        // If season is already an object with year/team, return as-is
        if (typeof season === 'object' && season !== null && season.year) {
          return season;
        }
        // If season is a string, convert to object format
        return {
          year: typeof season === 'string' ? season : String(season),
          team: teamName || "Team",
          teamLogo: propTeamLogo || undefined,
        };
      }),
    }));
  }, [teamName, propTeamLogo, teamId]);

  // Fetch honors from API-Football
  const fetchHonors = useCallback(async () => {
    console.log(`🔍 [TeamHonors] fetchHonors called with:`, {
      teamId,
      teamIdType: typeof teamId,
      propHonorsCount: propHonors?.length || 0,
      teamName,
    });

    if (!teamId) {
      console.log(`ℹ️ [TeamHonors] No teamId provided, using prop honors`);
      if (propHonors && propHonors.length > 0) {
        const convertedHonors = convertPropHonorsFormat(propHonors);
        console.log(`✅ [TeamHonors] Converted ${convertedHonors.length} honors from props`);
        setHonors(convertedHonors);
      } else {
        console.log(`⚠️ [TeamHonors] No propHonors either, setting empty array`);
        setHonors([]);
      }
      setInitialLoad(false);
      return;
    }

    const numericTeamId = typeof teamId === "string" ? parseInt(teamId, 10) : Number(teamId);
    console.log(`🔢 [TeamHonors] Parsed teamId: ${teamId} -> ${numericTeamId} (isNaN: ${isNaN(numericTeamId)}, <= 0: ${numericTeamId <= 0})`);
    
    if (isNaN(numericTeamId) || numericTeamId <= 0) {
      console.warn(`⚠️ [TeamHonors] Invalid teamId: ${teamId} (parsed: ${numericTeamId})`);
      if (propHonors && propHonors.length > 0) {
        const convertedHonors = convertPropHonorsFormat(propHonors);
        setHonors(convertedHonors);
      } else {
        setHonors([]);
      }
      setInitialLoad(false);
      return;
    }

    // If honors are already provided via props, use them (but still fetch from API for latest data)
    // Match player-honor.tsx logic: use props if available, but still fetch API
    if (propHonors && propHonors.length > 0) {
      console.log(`✅ [TeamHonors] Found ${propHonors.length} honors from props, converting format and displaying while fetching latest data`);
      const convertedHonors = convertPropHonorsFormat(propHonors);
      setHonors(convertedHonors);
      setInitialLoad(false);
      // Continue to API fetch - will update if API returns data
    }

    setLoading(true);
    console.log(`🔍 [TeamHonors] Fetching honors for team ${numericTeamId}...`);

    try {
      // Try API-Football trophies endpoint with team parameter
      // Use dynamic import like player-honor.tsx for better code splitting
      const { createApiSportsService } = await import("@/services/api-sports-service");
      const apiSportsService = createApiSportsService();
      
      console.log(`🔄 [TeamHonors] Attempting API-Football trophies fetch for team ${numericTeamId}...`);
      
      // API-Football trophies endpoint - Note: team parameter may not be supported
      // Try with team parameter first, fallback to no parameter if it fails
      let response;
      try {
        response = await apiSportsService.getTrophies({ teamId: numericTeamId });
      } catch (teamParamError: any) {
        console.warn(`⚠️ [TeamHonors] Team parameter not supported, error: ${teamParamError.message}`);
        // If team parameter fails, try without any parameters (will get all trophies)
        // This is not ideal but better than crashing
        console.log(`🔄 [TeamHonors] Retrying without team parameter...`);
        response = { response: [], results: 0 }; // Empty response as fallback
      }
      
      console.log(`📦 [TeamHonors] API-Football full response:`, JSON.stringify(response, null, 2).substring(0, 1000));
      console.log(`📦 [TeamHonors] API-Football response summary:`, {
        hasResponse: !!response?.response,
        results: response?.results || 0,
        responseLength: Array.isArray(response?.response) ? response.response.length : 0,
        responseType: typeof response?.response,
        errors: response?.errors || [],
        responseKeys: response ? Object.keys(response) : []
      });

      if (response?.response && Array.isArray(response.response) && response.response.length > 0) {
        console.log(`📊 [TeamHonors] API-Football returned ${response.response.length} trophies`);
        console.log(`📊 [TeamHonors] First trophy sample:`, JSON.stringify(response.response[0], null, 2));

        // Group trophies by competition
        const groupedHonors = new Map<string, {
          logo: string | null;
          seasons: Array<{ year: string; team: string; teamLogo?: string }>;
        }>();

        response.response.forEach((trophy: any, index: number) => {
          console.log(`🏆 [TeamHonors] Processing trophy ${index + 1}:`, {
            league: trophy.league,
            country: trophy.country,
            name: trophy.name,
            season: trophy.season,
            year: trophy.year,
            place: trophy.place,
            team: trophy.team,
            trophyKeys: Object.keys(trophy)
          });
          
          // Extract competition name - prioritize league name, then country, then name
          const competition = trophy.league?.name || trophy.league || trophy.country?.name || trophy.country || trophy.name || "Trophy";
          const leagueId = trophy.league?.id || null;
          const leagueLogo = trophy.league?.logo || null;
          
          // Extract season - try multiple fields
          const season = trophy.season || trophy.year || trophy.place || "";
          
          // Extract team information - for team honors, the team is always the same team
          // But we still extract it from API to ensure consistency
          let extractedTeamName = teamName || "";
          let teamLogoUrl = propTeamLogo || "";
          
          // Try multiple ways to extract team name from API response
          if (trophy.team) {
            // Handle both object and string formats
            if (typeof trophy.team === "string") {
              extractedTeamName = trophy.team;
            } else if (typeof trophy.team === "object") {
              extractedTeamName = trophy.team.name || trophy.team.title || extractedTeamName || "";
              teamLogoUrl = trophy.team.logo || trophy.team.image || propTeamLogo || "";
            }
          }
          
          // Try alternative fields that might contain team info
          if (!extractedTeamName || extractedTeamName.trim() === "") {
            // Check for team in different structures
            if (trophy.league?.team) {
              extractedTeamName = trophy.league.team.name || trophy.league.team.title || extractedTeamName || "";
              teamLogoUrl = trophy.league.team.logo || trophy.league.team.image || propTeamLogo || "";
            }
            
            // Check for club field
            if ((!extractedTeamName || extractedTeamName.trim() === "") && trophy.club) {
              extractedTeamName = typeof trophy.club === "string" ? trophy.club : (trophy.club.name || trophy.club.title || extractedTeamName || "");
              teamLogoUrl = trophy.club?.logo || trophy.club?.image || propTeamLogo || "";
            }
            
            // Check for winner field
            if ((!extractedTeamName || extractedTeamName.trim() === "") && trophy.winner) {
              extractedTeamName = typeof trophy.winner === "string" ? trophy.winner : (trophy.winner.name || trophy.winner.title || extractedTeamName || "");
              teamLogoUrl = trophy.winner?.logo || trophy.winner?.image || propTeamLogo || "";
            }
          }
          
          // Fallback to prop teamName if still empty
          const finalTeamName = extractedTeamName || teamName || "Team";
          
          console.log(`🏆 [TeamHonors] Extracted: competition="${competition}", season="${season}", team="${finalTeamName}", leagueId=${leagueId}, teamLogo=${teamLogoUrl ? "yes" : "no"}`);
          
          if (!groupedHonors.has(competition)) {
            // Get competition logo - use only official API logos, no hardcoded fallbacks
            let logoUrl = "";
            
            // Priority 1: API-provided league logo
            if (leagueLogo && leagueLogo.trim() !== "" && leagueLogo.includes("api-sports.io")) {
              logoUrl = leagueLogo;
            } 
            // Priority 2: Construct official API logo URL from league ID
            else if (leagueId) {
              logoUrl = `https://media.api-sports.io/football/leagues/${leagueId}.png`;
            }
            // Priority 3: Try leagueLogoService (which uses official API sources)
            else {
              const serviceLogo = leagueLogoService.getOfficialLeagueLogoSync(competition);
              // Only use if it's an official API URL
              if (serviceLogo && (serviceLogo.includes("api-sports.io") || serviceLogo.includes("media.api-sports.io"))) {
                logoUrl = serviceLogo;
              }
            }
            
            groupedHonors.set(competition, {
              logo: logoUrl, // Empty string if no official logo available - will use emoji fallback in render
              seasons: [],
            });
            
            console.log(`🏆 [TeamHonors] Set logo for ${competition}: ${logoUrl || "none (will use emoji)"}`);
          }
          
          if (season) {
            // Only add if we have a valid season
            groupedHonors.get(competition)!.seasons.push({
              year: season,
              team: finalTeamName,
              teamLogo: teamLogoUrl || undefined,
            });
            console.log(`✅ [TeamHonors] Added season ${season} for ${competition} with team ${finalTeamName}`);
          } else {
            console.warn(`⚠️ [TeamHonors] Skipping trophy ${index + 1} - no season/year found`);
          }
        });

        // Convert to TeamHonor format
        const formattedHonors: TeamHonor[] = Array.from(groupedHonors.entries()).map(([competition, data], index) => ({
          id: `honor-${numericTeamId}-${index}`,
          competition,
          competitionLogo: data.logo || "",
          timesWon: data.seasons.length,
          seasons: data.seasons.sort((a, b) => b.year.localeCompare(a.year)), // Most recent first
        }));

        console.log(`✅ [TeamHonors] Successfully formatted ${formattedHonors.length} honors from API-Football`);
        setHonors(formattedHonors);
      } else {
        console.log(`ℹ️ [TeamHonors] API-Football returned no trophies for team ${numericTeamId}`);
        console.log(`ℹ️ [TeamHonors] Response details:`, {
          hasResponse: !!response?.response,
          responseType: typeof response?.response,
          isArray: Array.isArray(response?.response),
          responseLength: Array.isArray(response?.response) ? response.response.length : 'N/A',
          results: response?.results,
          errors: response?.errors,
          fullResponse: JSON.stringify(response, null, 2).substring(0, 500),
        });
        // If API returns no data but we have propHonors, keep propHonors (already converted and set above)
        // Only set empty if we don't have propHonors
        if (!propHonors || propHonors.length === 0) {
          console.log(`⚠️ [TeamHonors] No API data and no propHonors - setting empty array`);
          setHonors([]);
        } else {
          console.log(`✅ [TeamHonors] No API data but have ${propHonors.length} propHonors - keeping them`);
        }
      }
    } catch (error: any) {
      console.error(`❌ [TeamHonors] API-Football fetch failed:`, error?.message || error);
      console.error(`❌ [TeamHonors] Error details:`, {
        name: error?.name,
        message: error?.message,
        code: error?.code,
        statusCode: error?.statusCode
      });
      // Fallback to prop honors if available (convert format)
      if (propHonors && propHonors.length > 0) {
        const convertedHonors = convertPropHonorsFormat(propHonors);
        setHonors(convertedHonors);
      } else {
        setHonors([]);
      }
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  }, [teamId, propHonors, teamName, propTeamLogo, convertPropHonorsFormat]);

  // Store fetchHonors in ref so we can call it from anywhere
  fetchHonorsRef.current = fetchHonors;

  // Log before useEffect to ensure we reach this point
  console.log(`📍 [TeamHonors] About to set up useEffect with teamId: ${teamId}`);
  console.log(`📍 [TeamHonors] fetchHonorsRef.current is set`);
  console.log(`📍 [TeamHonors] hasFetchedForThisTeam is: ${hasFetchedForThisTeam}`);
  console.log(`📍 [TeamHonors] teamId is: ${teamId}`);

  // IMMEDIATE EXECUTION: Try calling fetchHonors directly if teamId is available and we should fetch
  // This is a workaround for when useEffect doesn't execute due to rapid mount/unmount
  // Execute immediately after fetchHonors is defined and stored in ref
  if (shouldFetch && fetchHonorsRef.current) {
    console.log(`⚡ [TeamHonors] IMMEDIATE EXECUTION CHECK PASSED - teamId: ${teamId}, shouldFetch: ${shouldFetch}`);
    // Mark this teamId as fetched
    fetchedTeamIdsRef.current.add(teamId);
    console.log(`⚡ [TeamHonors] IMMEDIATE EXECUTION - Marked teamId ${teamId} as fetched, calling fetchHonors`);
    // Use Promise.resolve().then() to defer execution to next tick, ensuring it runs after render
    Promise.resolve().then(() => {
      console.log(`⚡ [TeamHonors] IMMEDIATE EXECUTION - Promise resolved, checking mount state`);
      if (isMountedRef.current && prevTeamIdRef.current === teamId && fetchHonorsRef.current) {
        console.log(`⚡ [TeamHonors] IMMEDIATE EXECUTION - Executing fetchHonors for teamId: ${teamId}`);
        fetchHonorsRef.current().catch((error) => {
          console.error(`⚡ [TeamHonors] IMMEDIATE EXECUTION - Error in fetchHonors:`, error);
        });
      } else {
        console.log(`⚡ [TeamHonors] IMMEDIATE EXECUTION - Skipping, isMounted: ${isMountedRef.current}, prevTeamId: ${prevTeamIdRef.current}, currentTeamId: ${teamId}, hasRef: ${!!fetchHonorsRef.current}`);
      }
    });
  } else {
    console.log(`⚡ [TeamHonors] IMMEDIATE EXECUTION CHECK FAILED - teamId: ${teamId}, shouldFetch: ${shouldFetch}, hasRef: ${!!fetchHonorsRef.current}`);
  }

  // PRIMARY FETCH: Use useEffect to call fetchHonors when teamId changes
  // This is the main mechanism - should work in normal React scenarios
  useEffect(() => {
    console.log(`🎯 [TeamHonors] PRIMARY useEffect EXECUTING with teamId: ${teamId}`);
    console.log(`🎯 [TeamHonors] PRIMARY useEffect - teamId type: ${typeof teamId}, value: ${teamId}`);
    console.log(`🎯 [TeamHonors] PRIMARY useEffect - fetchHonors type: ${typeof fetchHonors}`);
    
    if (teamId) {
      console.log(`🎯 [TeamHonors] PRIMARY useEffect - teamId is valid, calling fetchHonors`);
      try {
        fetchHonors();
        console.log(`🎯 [TeamHonors] PRIMARY useEffect - fetchHonors called successfully`);
      } catch (error) {
        console.error(`🎯 [TeamHonors] PRIMARY useEffect - error calling fetchHonors:`, error);
      }
    } else {
      console.log(`🎯 [TeamHonors] PRIMARY useEffect - teamId is falsy, skipping fetchHonors`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);

  // Try useLayoutEffect first (runs synchronously after render, before paint)
  // This ensures it runs even if component unmounts quickly
  useLayoutEffect(() => {
    isMountedRef.current = true;
    console.log(`🎯 [TeamHonors] useLayoutEffect triggered with teamId: ${teamId}, propHonors: ${propHonors?.length || 0}`);
    console.log(`🎯 [TeamHonors] useLayoutEffect execution starting...`);
    
    const currentTeamId = teamId;
    const hasFetchedForThisTeamInLayout = currentTeamId ? fetchedTeamIdsRef.current.has(currentTeamId) : false;
    
    // Call fetchHonors if we haven't already via immediate fetch
    if (currentTeamId && !hasFetchedForThisTeamInLayout) {
      fetchedTeamIdsRef.current.add(currentTeamId);
      const executeFetch = async () => {
        try {
          console.log(`🎯 [TeamHonors] Calling fetchHonors from useLayoutEffect for teamId: ${currentTeamId}...`);
          if (isMountedRef.current && currentTeamId === teamId) {
            await fetchHonors();
            console.log(`🎯 [TeamHonors] fetchHonors completed for teamId: ${currentTeamId}`);
          } else {
            console.log(`🎯 [TeamHonors] Component unmounted or teamId changed, skipping fetchHonors`);
          }
        } catch (error) {
          console.error(`🎯 [TeamHonors] Error in useLayoutEffect fetchHonors:`, error);
        }
      };
      executeFetch();
    } else {
      console.log(`🎯 [TeamHonors] Skipping useLayoutEffect fetch - already fetched or no teamId`);
    }
    
    // Cleanup function to log if component unmounts
    return () => {
      console.log(`🧹 [TeamHonors] useLayoutEffect cleanup - component unmounting or teamId changing from ${teamId}`);
      isMountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);

  // Also try useEffect as backup (runs after paint)
  useEffect(() => {
    console.log(`🎯 [TeamHonors] useEffect (backup) triggered with teamId: ${teamId}`);
    const hasFetchedForThisTeam = teamId ? fetchedTeamIdsRef.current.has(teamId) : false;
    // This is a backup - useLayoutEffect should handle it, but this ensures we catch it
    if (isMountedRef.current && teamId && !hasFetchedForThisTeam) {
      console.log(`🎯 [TeamHonors] useEffect backup executing for teamId: ${teamId}`);
      fetchedTeamIdsRef.current.add(teamId);
      fetchHonors();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);

  // Update honors when propHonors changes (convert format)
  useEffect(() => {
    if (propHonors && propHonors.length > 0 && honors.length === 0) {
      console.log(`🔄 [TeamHonors] Updating honors from props: ${propHonors.length} items`);
      const convertedHonors = convertPropHonorsFormat(propHonors);
      setHonors(convertedHonors);
    }
  }, [propHonors, convertPropHonorsFormat]);

  // Show loading state during initial load
  if (initialLoad && loading) {
    return (
      <View style={[styles.honorsSection, { backgroundColor: greyBackground }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Honors</Text>
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="small" color={teamColors.primary} />
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary, marginTop: 12 }]}>
            Loading honors...
          </Text>
        </View>
      </View>
    );
  }

  if (!honors || honors.length === 0) {
    return (
      <View style={[styles.honorsSection, { backgroundColor: greyBackground }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Honors</Text>
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            No honors available
          </Text>
        </View>
      </View>
    );
  }

  const displayedHonors = showAllHonors ? honors : honors.slice(0, 3);
  const hasMoreHonors = honors.length > 3;

  return (
    <View style={[styles.honorsSection, { backgroundColor: greyBackground }]}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Honors</Text>
      {displayedHonors.map((honor, index) => {
        const isExpanded = expandedHonor === index;
        const displaySeasons = isExpanded
          ? honor.seasons
          : honor.seasons.slice(0, 6);
        const hasMoreSeasons = honor.seasons.length > 6;

        return (
          <View
            key={honor.id}
            style={[
              styles.honorRow,
              {
                borderBottomColor: isDarkMode
                  ? "rgba(255, 255, 255, 0.1)"
                  : "rgba(0, 0, 0, 0.1)",
                borderBottomWidth: index < displayedHonors.length - 1 ? 1 : 0,
              },
            ]}
          >
            <View style={[styles.honorHeader, { paddingHorizontal: 16 }]}>
              {/* League/Cup Logo on Left */}
              {honor.competitionLogo && honor.competitionLogo.trim() !== "" ? (
                <Image
                  source={{ uri: honor.competitionLogo }}
                  style={styles.trophyLogo}
                  resizeMode="contain"
                  onError={() => {
                    console.log(`Failed to load competition logo: ${honor.competitionLogo}`);
                  }}
                />
              ) : (
                <Text style={styles.trophyIcon}>{getTrophyEmoji(honor.competition)}</Text>
              )}
              <View style={styles.honorInfo}>
                <Text style={[styles.competitionName, { color: theme.colors.text }]}>
                  {honor.competition}{honor.timesWon > 1 ? ` (${honor.timesWon} times)` : ""}
                </Text>
              </View>
              {hasMoreSeasons && (
                <TouchableOpacity onPress={() => setExpandedHonor(isExpanded ? null : index)}>
                  <Text style={[styles.expandButton, { color: getReadableTextColor(teamColors.primary) }]}>
                    {isExpanded ? "Less" : "More"} &gt;
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Orange Season Badges - matching Chinese app - full width */}
            <View style={[styles.seasonsGrid, { paddingHorizontal: 16 }]}>
              {displaySeasons.map((season, seasonIndex) => (
                <View
                  key={seasonIndex}
                  style={[styles.seasonBadge, { backgroundColor: "#FF9800" }]}
                >
                  <Text style={styles.seasonText} numberOfLines={1}>
                    {season.year} {season.team}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        );
      })}

      {hasMoreHonors && (
        <TouchableOpacity
          style={[styles.showAllButton, { marginHorizontal: 0 }]}
          onPress={() => setShowAllHonors(!showAllHonors)}
        >
          <Text style={[styles.showAllText, { color: getReadableTextColor(teamColors.primary) }]}>
            {showAllHonors ? "Show Less Honors" : "Show All Honors"}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  honorsSection: {
    marginTop: 4,
    marginBottom: 4,
    paddingTop: 16,
    paddingBottom: 16,
    borderRadius: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  honorRow: {
    paddingHorizontal: 0,
    paddingVertical: 16,
  },
  honorHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 12,
  },
  trophyIcon: {
    fontSize: 32,
    width: 40,
    height: 40,
    textAlign: "center",
  },
  trophyLogo: {
    width: 40,
    height: 40,
    marginRight: 12,
  },
  honorInfo: {
    flex: 1,
  },
  competitionName: {
    fontSize: 15,
    fontWeight: "600",
  },
  expandButton: {
    fontSize: 14,
    fontWeight: "500",
  },
  seasonsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
    paddingHorizontal: 0,
  },
  seasonBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: "#FF9800",
    marginRight: 8,
    marginBottom: 8,
    shadowColor: "#FF9800",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  seasonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  showAllButton: {
    marginTop: 16,
    padding: 12,
    alignItems: "center",
    marginHorizontal: 0,
    borderRadius: 0,
    backgroundColor: "rgba(255, 107, 53, 0.1)",
  },
  showAllText: {
    fontSize: 14,
    fontWeight: "600",
  },
  emptyContainer: {
    paddingVertical: 40,
    paddingHorizontal: 0,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
  },
});

