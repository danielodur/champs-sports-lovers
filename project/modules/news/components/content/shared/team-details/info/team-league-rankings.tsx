/**
 * Team League Rankings Component
 * Displays a line graph showing team's league position across multiple seasons
 * Fetches data from API-Football standings endpoint
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import Svg, { Polyline, Circle, Line, Text as SvgText } from "react-native-svg";
import { createApiSportsService } from "@/services/api-sports-service";
import leagueLogoService from "@/services/leagueLogoService";

interface TeamLeagueRankingsProps {
  teamId: number;
  leagueId?: number;
  theme: any;
  teamColors?: {
    primary: string;
    secondary: string;
  };
}

interface SeasonRanking {
  season: string;
  year: number;
  position: number;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const TEAM_LOGO_WIDTH = 28; // Reduced logo size
const LOGO_GAP = 10; // Reduced gap between logo and graph
const SIDE_PADDING = 8; // Further reduced padding to maximize graph width
const PADDING_X = 12; // Further reduced internal SVG padding for more graph space
const PADDING_Y = 10; // Top padding for vertical lines
const GRAPH_HEIGHT = 80; // Significantly reduced height to match Chinese app
const SEASON_LABEL_HEIGHT = 28; // Increased space for season labels - more spacious
const SEASON_LABEL_OFFSET = 22; // Distance from horizontal line to season labels
const POINT_SPACING = 16; // Increased spacing between data points for more breathing room
// Calculate graph width: screen width - left padding - logo - gap - right padding - SVG internal padding
const GRAPH_WIDTH = SCREEN_WIDTH - SIDE_PADDING - TEAM_LOGO_WIDTH - LOGO_GAP - SIDE_PADDING - PADDING_X * 2;

export default function TeamLeagueRankings({
  teamId,
  leagueId,
  theme,
  teamColors = { primary: "#FF1744", secondary: "#FF6B35" },
}: TeamLeagueRankingsProps) {
  const [rankings, setRankings] = useState<SeasonRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [leagueLogo, setLeagueLogo] = useState<string>("");
  const [leagueName, setLeagueName] = useState<string>("");
  const [teamLogo, setTeamLogo] = useState<string>("");

  const isDarkMode = theme.colors.background === "#2A2A2A";
  const greyBackground = isDarkMode ? "#3A3A3A" : "#F5F5F5";
  const darkerBackground = isDarkMode ? "#2A2A2A" : "#E8E8E8"; // Darker background for rankings
  const borderColor = isDarkMode ? "#4A4A4A" : "#E0E0E0";
  const verticalLineColor = isDarkMode ? "#4A4A4A" : "#D0D0D0"; // Vertical lines color
  const horizontalLineColor = isDarkMode ? "#5A5A5A" : "#C0C0C0"; // Dull grey horizontal line above seasons
  
  // Use teamColors.primary directly (already processed with muted yellow in parent component)
  const circleColors = {
    circleColor: teamColors.primary,
    textColor: "#FFFFFF",
  };

  // Generate seasons from 16-17 to 25-26
  const generateSeasons = (): string[] => {
    const seasons: string[] = [];
    for (let year = 2016; year <= 2025; year++) {
      const nextYear = year + 1;
      // Format: "16-17" (last 2 digits of each year)
      const yearShort = year.toString().slice(-2);
      const nextYearShort = nextYear.toString().slice(-2);
      seasons.push(`${yearShort}-${nextYearShort}`);
    }
    return seasons;
  };

  // Fetch rankings for all seasons
  const fetchRankings = useCallback(async () => {
    if (!teamId || !leagueId) {
      console.warn("⚠️ [TeamLeagueRankings] Missing teamId or leagueId");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      console.log(`🔍 [TeamLeagueRankings] Fetching rankings for team ${teamId}, league ${leagueId}`);

      const apiSportsService = createApiSportsService();
      const seasons = generateSeasons();
      const rankingsData: SeasonRanking[] = [];

      // Fetch team info first to get team logo
      try {
        const teamResponse = await apiSportsService.getTeamInfo(teamId);
        if (teamResponse?.response?.[0]?.team) {
          const team = teamResponse.response[0].team;
          if (team.logo && team.logo.includes("api-sports.io")) {
            setTeamLogo(team.logo);
            console.log(`✅ [TeamLeagueRankings] Loaded team logo: ${team.logo}`);
          } else if (team.id) {
            const logoUrl = `https://media.api-sports.io/football/teams/${team.id}.png`;
            setTeamLogo(logoUrl);
            console.log(`✅ [TeamLeagueRankings] Using constructed team logo URL: ${logoUrl}`);
          }
        }
      } catch (error) {
        console.warn("⚠️ [TeamLeagueRankings] Failed to fetch team info:", error);
      }

      // Fetch league info to get logo
      try {
        const leagueResponse: any = await apiSportsService.getLeagueById(leagueId);
        if (leagueResponse?.response?.[0]?.league) {
          const league = leagueResponse.response[0].league;
          setLeagueName(league.name || "");
          
          // Get league logo - prioritize official API logos
          let logoUrl = "";
          if (league.logo && league.logo.includes("api-sports.io")) {
            logoUrl = league.logo;
          } else if (league.id) {
            logoUrl = `https://media.api-sports.io/football/leagues/${league.id}.png`;
          } else {
            const serviceLogo = leagueLogoService.getOfficialLeagueLogoSync(league.name);
            if (serviceLogo && serviceLogo.includes("api-sports.io")) {
              logoUrl = serviceLogo;
            }
          }
          setLeagueLogo(logoUrl);
        }
      } catch (error) {
        console.warn("⚠️ [TeamLeagueRankings] Failed to fetch league info:", error);
      }

      // Fetch standings for each season
      for (const seasonStr of seasons) {
        // Parse season string like "16-17" to get start year (2016)
        const yearShort = parseInt(seasonStr.split("-")[0], 10);
        const year = 2000 + yearShort; // Convert "16" to 2016
        
        try {
          const standingsResponse = await apiSportsService.getStandings(leagueId, year);
          
          // API-Football standings structure: response[0].league.standings[0] contains the table
          const standings = standingsResponse?.response?.[0]?.league?.standings?.[0];
          
          if (standings && Array.isArray(standings) && standings.length > 0) {
            // Find team in standings by matching team.id
            // Handle both flat array and array of groups
            let teamStanding: any = null;
            
            // Check if standings is array of arrays (groups) or flat array
            if (Array.isArray(standings[0])) {
              // Multiple groups (e.g., Champions League) - search all groups
              for (const group of standings) {
                if (Array.isArray(group)) {
                  teamStanding = group.find((s: any) => s?.team?.id === teamId);
                  if (teamStanding) break;
                }
              }
            } else {
              // Single flat array (most common - e.g., Premier League)
              teamStanding = standings.find((s: any) => s?.team?.id === teamId);
            }
            
            if (teamStanding) {
              // Get position - prioritize rank, fallback to position
              const position = teamStanding.rank ?? teamStanding.position;
              
              // Validate position is valid (positive integer)
              if (position && typeof position === 'number' && position > 0) {
                rankingsData.push({
                  season: seasonStr,
                  year,
                  position: Math.floor(position), // Ensure integer
                });
                console.log(`✅ [TeamLeagueRankings] Found position ${position} for ${seasonStr} (year ${year})`);
              } else {
                console.warn(`⚠️ [TeamLeagueRankings] Invalid position ${position} for ${seasonStr}, skipping`);
              }
            } else {
              console.log(`ℹ️ [TeamLeagueRankings] Team ${teamId} not found in standings for ${seasonStr} (year ${year})`);
            }
          } else {
            console.log(`ℹ️ [TeamLeagueRankings] No standings data available for ${seasonStr} (year ${year})`);
          }
        } catch (error: any) {
          console.warn(`⚠️ [TeamLeagueRankings] Failed to fetch standings for ${seasonStr} (year ${year}):`, error?.message || error);
        }
      }

      // Sort by year
      rankingsData.sort((a, b) => a.year - b.year);
      setRankings(rankingsData);
      
      console.log(`✅ [TeamLeagueRankings] Loaded ${rankingsData.length} season rankings`);
    } catch (error: any) {
      console.error(`❌ [TeamLeagueRankings] Error fetching rankings:`, error?.message || error);
    } finally {
      setLoading(false);
    }
  }, [teamId, leagueId]);

  useEffect(() => {
    fetchRankings();
  }, [fetchRankings]);

  // Smart Y-axis distribution function
  // Rank 1 at top, 2-10 slight drop, 11-15 middle, 16+ lower
  const getYPositionForRank = (position: number, minPosition: number, maxPosition: number): number => {
    // Normalize position to 0-1 range based on actual data range
    const normalizedPosition = (position - minPosition) / (maxPosition - minPosition || 1);
    
    // Smart distribution based on position tiers
    let yRatio: number;
    
    if (position === 1) {
      // Rank 1: At the very top (0% of graph height)
      yRatio = 0;
    } else if (position >= 2 && position <= 10) {
      // Ranks 2-10: Slight drop (5% to 35% of graph height)
      // Map position 2-10 to 0.05-0.35
      const tierPosition = (position - 2) / (10 - 2); // 0 to 1 within tier
      yRatio = 0.05 + tierPosition * 0.30; // 0.05 to 0.35
    } else if (position >= 11 && position <= 15) {
      // Ranks 11-15: Middle portion (35% to 65% of graph height)
      // Map position 11-15 to 0.35-0.65
      const tierPosition = (position - 11) / (15 - 11); // 0 to 1 within tier
      yRatio = 0.35 + tierPosition * 0.30; // 0.35 to 0.65
    } else {
      // Ranks 16+: Lower portion (65% to 100% of graph height)
      // Map position 16+ to 0.65-1.0
      // Use maxPosition to determine the scale
      const lowerBound = 16;
      const upperBound = Math.max(maxPosition, 20); // Assume at least 20 teams in league
      const tierPosition = Math.min((position - lowerBound) / (upperBound - lowerBound), 1);
      yRatio = 0.65 + tierPosition * 0.35; // 0.65 to 1.0
    }
    
    return PADDING_Y + yRatio * GRAPH_HEIGHT;
  };

  // Calculate graph dimensions
  const calculateGraphData = () => {
    if (rankings.length === 0) return null;

    // Filter out invalid positions and ensure we have valid data
    const validRankings = rankings.filter((r) => r.position > 0 && Number.isInteger(r.position));
    
    if (validRankings.length === 0) {
      console.warn("⚠️ [TeamLeagueRankings] No valid rankings found after filtering");
      return null;
    }

    const allPositions = validRankings.map((r) => r.position);
    const minPosition = Math.min(...allPositions);
    const maxPosition = Math.max(...allPositions);
    
    console.log(`📊 [TeamLeagueRankings] Position range: ${minPosition} - ${maxPosition} (${validRankings.length} valid seasons)`);

    // Calculate points for the line with increased spacing for breathing room
    const numPoints = validRankings.length;
    const numGaps = numPoints - 1;
    const totalSpacing = numGaps * POINT_SPACING;
    const availableWidth = GRAPH_WIDTH - totalSpacing;
    
    const points = validRankings.map((ranking, index) => {
      // Distribute points evenly across available width, then add spacing between them
      const baseX = PADDING_X + (index / (numGaps || 1)) * availableWidth;
      const spacingOffset = index * POINT_SPACING;
      const x = baseX + spacingOffset;
      // Use smart Y-axis distribution
      const y = getYPositionForRank(ranking.position, minPosition, maxPosition);
      return { x, y, position: ranking.position, season: ranking.season };
    });

    return { points, yMin: minPosition, yMax: maxPosition };
  };

  const graphData = calculateGraphData();

  if (loading) {
    return null; // Don't show loading state, just return null
  }

  if (!graphData || rankings.length === 0) {
    return null; // Don't show section if no data
  }

  const { points, yMin, yMax } = graphData;

  return (
    <>
      {/* Separator before section */}
      <View style={[styles.separator, { backgroundColor: borderColor }]} />
      
      <View style={styles.container}>
      {/* Header outside dark section */}
      <View style={styles.header}>
        {leagueLogo && (
          <Image
            source={{ uri: leagueLogo }}
            style={styles.leagueLogo}
            resizeMode="contain"
            onError={() => {
              console.log(`Failed to load league logo: ${leagueLogo}`);
            }}
          />
        )}
        <Text style={[styles.title, { color: theme.colors.text }]}>League Rankings</Text>
      </View>

      {/* Dark section - only covers the graph */}
      <View style={[styles.graphWrapper, { backgroundColor: darkerBackground }]}>
        <View style={styles.graphContainer}>
          {/* Team Logo on the left - vertically centered */}
          {teamLogo && (
            <Image
              source={{ uri: teamLogo }}
              style={styles.teamLogo}
              resizeMode="contain"
              onError={() => {
                console.log(`Failed to load team logo: ${teamLogo}`);
              }}
            />
          )}
          
          <Svg width={GRAPH_WIDTH + PADDING_X * 2} height={GRAPH_HEIGHT + PADDING_Y + SEASON_LABEL_HEIGHT}>
          {/* Top horizontal line - touches tips of vertical lines to form perfect rectangle */}
          <Line
            x1={PADDING_X}
            y1={PADDING_Y}
            x2={PADDING_X + GRAPH_WIDTH}
            y2={PADDING_Y}
            stroke={horizontalLineColor}
            strokeWidth={1}
            opacity={0.8}
          />

          {/* Vertical lines at every season - form sides of rectangle */}
          {points.map((point, index) => (
            <Line
              key={`vertical-${index}`}
              x1={point.x}
              y1={PADDING_Y}
              x2={point.x}
              y2={PADDING_Y + GRAPH_HEIGHT}
              stroke={verticalLineColor}
              strokeWidth={1}
              opacity={0.6}
            />
          ))}

          {/* Bottom horizontal line above seasons - dull grey */}
          <Line
            x1={PADDING_X}
            y1={PADDING_Y + GRAPH_HEIGHT}
            x2={PADDING_X + GRAPH_WIDTH}
            y2={PADDING_Y + GRAPH_HEIGHT}
            stroke={horizontalLineColor}
            strokeWidth={1}
            opacity={0.8}
          />

          {/* Line connecting points - thicker and more visible */}
          {points.length > 1 && (
            <Polyline
              points={points.map((p) => `${p.x},${p.y}`).join(" ")}
              fill="none"
              stroke={circleColors.circleColor}
              strokeWidth={4}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Data points with circles - larger and more visible */}
          {points.map((point, index) => (
            <React.Fragment key={`point-${index}`}>
              {/* Outer circle - larger */}
              <Circle
                cx={point.x}
                cy={point.y}
                r={14}
                fill={circleColors.circleColor}
                opacity={0.3}
              />
              {/* Inner circle - larger */}
              <Circle
                cx={point.x}
                cy={point.y}
                r={10}
                fill={circleColors.circleColor}
              />
              {/* Position number - larger font */}
              <SvgText
                x={point.x}
                y={point.y + 5}
                fontSize={14}
                fontWeight="bold"
                fill={circleColors.textColor}
                textAnchor="middle"
              >
                {point.position}
              </SvgText>
            </React.Fragment>
          ))}

          {/* X-axis labels (seasons) - show all seasons in "16-17" format, positioned lower with more spacing */}
          {points.map((point, index) => (
            <SvgText
              key={`label-${index}`}
              x={point.x}
              y={GRAPH_HEIGHT + PADDING_Y + SEASON_LABEL_OFFSET}
              fontSize={11}
              fill={theme.colors.textSecondary}
              textAnchor="middle"
            >
              {point.season}
            </SvgText>
          ))}
          </Svg>
        </View>
      </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  separator: {
    height: 1,
    width: "100%",
    marginVertical: 0,
  },
  container: {
    marginTop: 0,
    paddingTop: 12,
    paddingBottom: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 12,
    paddingHorizontal: 16,
  },
  leagueLogo: {
    width: 32,
    height: 32,
  },
  title: {
    fontSize: 17,
    fontWeight: "bold",
  },
  graphWrapper: {
    paddingVertical: 0, // No vertical padding - dark section height matches rectangle exactly
    paddingHorizontal: 0, // No horizontal padding - touches edges
    borderRadius: 0,
    width: "100%",
  },
  graphContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    width: "100%",
    paddingLeft: 8,
    paddingRight: 8,
  },
  teamLogo: {
    width: 28,
    height: 28,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
  },
});

