/**
 * Basketball Live Match Screen
 * Displays live basketball match with:
 * 1. Momentum Chart (Orange/Grey colors, 0'-10'-20'-30'-40'-FT timeline)
 * 2. Quarter Scores Table (Q1, Q2, Q3, Q4, Total)
 * 3. Attack Statistics (3-pt, 2-pt, Free throws with yellow/grey diagrams)
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Image,
} from "react-native";
import { useTheme } from "@/hooks/useTheme";
import Svg, { Path, Defs, LinearGradient, Stop, Circle, Line } from "react-native-svg";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CHART_WIDTH = SCREEN_WIDTH - 80;
const CHART_HEIGHT = 120;

interface LiveBasketballProps {
  sport: string;
  homeTeamName?: string;
  awayTeamName?: string;
  homeTeamLogo?: string;
  awayTeamLogo?: string;
  matchId?: string;
  homeScore?: number;
  awayScore?: number;
  isLive?: boolean;
  quarters?: {
    home: (number | null)[];  // ✅ BASKETBALL: Allow null for quarters not yet played
    away: (number | null)[];
  };
  currentQuarter?: string; // "Q1", "Q2", "Q3", "Q4", "OT"
  elapsed?: number; // Elapsed time in seconds
  status?: string; // Match status ("NS", "LIVE", "FT", "AET", etc.)
  startTime?: string; // ✅ Match start time for display
}

// Basketball statistics interface
interface BasketballStats {
  threePointers: { home: number; away: number };
  twoPointers: { home: number; away: number };
  freeThrows: { home: number; away: number };
  rebounds: { home: number; away: number };
  threePointPercentage: { home: number; away: number };
  twoPointPercentage: { home: number; away: number };
  freeThrowPercentage: { home: number; away: number };
  reboundPercentage: { home: number; away: number };
}

export default function LiveBasketballTab({
  sport,
  homeTeamName = "Home Team",
  awayTeamName = "Away Team",
  homeTeamLogo,
  awayTeamLogo,
  matchId,
  homeScore = 0,
  awayScore = 0,
  isLive = false,
  quarters,
  currentQuarter = "Q1",
  elapsed = 0,
  status = "NS",
  startTime, // ✅ Accept start time for display
}: LiveBasketballProps) {
  const theme = useTheme();
  const [stats, setStats] = useState<BasketballStats>({
    threePointers: { home: 0, away: 0 },
    twoPointers: { home: 0, away: 0 },
    freeThrows: { home: 0, away: 0 },
    rebounds: { home: 0, away: 0 },
    threePointPercentage: { home: 50, away: 50 }, // Default 50/50 split
    twoPointPercentage: { home: 50, away: 50 },
    freeThrowPercentage: { home: 50, away: 50 },
    reboundPercentage: { home: 50, away: 50 },
  });

  // Momentum data points (simulated - will be replaced with real API data)
  const [momentumData, setMomentumData] = useState<number[]>([]);

  useEffect(() => {
    // Check if match has started (has live data or is finished)
    const hasMatchData = isLive || status === "FT" || status === "AET" || elapsed > 0;
    
    if (!hasMatchData) {
      // Upcoming match - reset to default 0 values with 50/50 split
      console.log("🏀 BASKETBALL: No match data - resetting to defaults");
      resetToDefaultStats();
    } else {
      // Match has started - fetch real API data only
      console.log(`🏀 BASKETBALL: Match ${matchId} is ${isLive ? 'LIVE' : status} - fetching API data`);
      if (matchId) {
        fetchBasketballStats();
      }
    }
    
    // Generate momentum data based on match state
    generateMomentumData();
  }, [matchId, currentQuarter, isLive, status, elapsed]);

  const resetToDefaultStats = () => {
    // For upcoming matches with no data - all 0s with 50/50 circle split
    console.log("🏀 BASKETBALL: Resetting stats to default (no match data yet)");
    setStats({
      threePointers: { home: 0, away: 0 },
      twoPointers: { home: 0, away: 0 },
      freeThrows: { home: 0, away: 0 },
      rebounds: { home: 0, away: 0 },
      threePointPercentage: { home: 50, away: 50 },
      twoPointPercentage: { home: 50, away: 50 },
      freeThrowPercentage: { home: 50, away: 50 },
      reboundPercentage: { home: 50, away: 50 },
    });
  };

  const fetchBasketballStats = async () => {
    try {
      console.log(`🏀 BASKETBALL API: Fetching live stats for match ${matchId}`);
      
      // TODO: Replace with actual basketball API endpoint
      // const response = await fetch(`https://api-basketball.com/statistics?fixture=${matchId}`);
      // const data = await response.json();
      
      // When API is implemented, parse and set the data:
      // if (data && data.response && data.response.length > 0) {
      //   const stats = data.response[0].statistics;
      //   setStats({
      //     threePointers: { 
      //       home: stats.home.threePointers || 0, 
      //       away: stats.away.threePointers || 0 
      //     },
      //     twoPointers: { 
      //       home: stats.home.twoPointers || 0, 
      //       away: stats.away.twoPointers || 0 
      //     },
      //     freeThrows: { 
      //       home: stats.home.freeThrows || 0, 
      //       away: stats.away.freeThrows || 0 
      //     },
      //     rebounds: { 
      //       home: stats.home.rebounds || 0, 
      //       away: stats.away.rebounds || 0 
      //     },
      //     threePointPercentage: { 
      //       home: stats.home.threePointPercentage || 0, 
      //       away: stats.away.threePointPercentage || 0 
      //     },
      //     twoPointPercentage: { 
      //       home: stats.home.twoPointPercentage || 0, 
      //       away: stats.away.twoPointPercentage || 0 
      //     },
      //     freeThrowPercentage: { 
      //       home: stats.home.freeThrowPercentage || 0, 
      //       away: stats.away.freeThrowPercentage || 0 
      //     },
      //     reboundPercentage: { 
      //       home: stats.home.reboundPercentage || 0, 
      //       away: stats.away.reboundPercentage || 0 
      //     },
      //   });
      //   console.log("✅ BASKETBALL API: Stats loaded successfully");
      // } else {
      //   console.log("⚠️ BASKETBALL API: No stats data available");
      //   resetToDefaultStats();
      // }
      
      // TEMPORARY: Until API is integrated, keep stats at default
      console.log("⚠️ BASKETBALL API: Not yet implemented - awaiting API integration");
      console.log("📝 BASKETBALL: Keeping stats at default until real data is available");
      
    } catch (error) {
      console.error("❌ BASKETBALL API ERROR:", error);
      console.log("🔄 BASKETBALL: Resetting to default stats due to API error");
      resetToDefaultStats();
    }
  };

  const generateMomentumData = () => {
    // Check if match has started
    const hasMatchData = isLive || status === "FT" || status === "AET" || elapsed > 0;
    
    if (!hasMatchData) {
      // No data yet - momentum starts at zero (flat line at center)
      console.log("🏀 BASKETBALL MOMENTUM: No match data - showing zero baseline");
      const zeroPoints = Array(49).fill(0); // 48 minutes + FT marker
      setMomentumData(zeroPoints);
      return;
    }
    
    // TODO: Replace with actual basketball momentum/possession API data
    // For now, generate momentum based on elapsed time only
    // When API is available, use real possession/momentum data points
    
    const points: number[] = [];
    const matchMinutes = Math.min(elapsed / 60, 48);
    
    console.log(`🏀 BASKETBALL MOMENTUM: Match in progress - ${matchMinutes.toFixed(1)} minutes elapsed`);
    console.log("⚠️ BASKETBALL MOMENTUM: Awaiting API integration for real momentum data");
    
    // Create placeholder data structure (will be replaced by API)
    for (let i = 0; i <= 48; i++) {
      if (i > matchMinutes) {
        // Future time - no data yet (stays at zero)
        points.push(0);
      } else {
        // Past/current time - placeholder (will be replaced with API data)
        // API should provide momentum values between -10 and +10
        points.push(0); // Keep at zero until API provides real data
      }
    }
    
    setMomentumData(points);
  };

  // Dark Separator Component - Theme-responsive (dark in dark mode, grey in light mode)
  const DarkSeparator = () => {
    const isDarkMode = theme.colors.background === "#2A2A2A";
    return (
      <View style={[
        styles.darkSeparator,
        { backgroundColor: isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" }
      ]} />
    );
  };

  // ✅ Format match start time for display (HH:MM format like football)
  const getFormattedStartTime = () => {
    if (!startTime) return null;
    
    try {
      const date = new Date(startTime);
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      return `${hours}:${minutes}`;
    } catch (error) {
      console.error("❌ BASKETBALL: Error formatting start time", error);
      return null;
    }
  };

  const renderMomentumChart = () => {
    if (momentumData.length === 0) {
      // No data - show empty chart with flat baseline
      return (
        <View style={styles.chartContainer}>
          <View style={styles.chartWrapper}>
            <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
              <Defs>
                <LinearGradient id="homeGradient" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor="#FFA726" stopOpacity="0.8" />
                  <Stop offset="1" stopColor="#FFA726" stopOpacity="0.3" />
                </LinearGradient>
                <LinearGradient id="awayGradient" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor="#757575" stopOpacity="0.3" />
                  <Stop offset="1" stopColor="#757575" stopOpacity="0.8" />
                </LinearGradient>
              </Defs>
              
              {/* Vertical time interval lines - aligned with time labels */}
              {[0, 1, 2, 3, 4, 5].map((index) => {
                const x = (index / 5) * CHART_WIDTH;
                return (
                  <Line
                    key={index}
                    x1={x}
                    y1={0}
                    x2={x}
                    y2={CHART_HEIGHT}
                    stroke="rgba(150,150,150,0.15)"
                    strokeWidth={1}
                  />
                );
              })}
              
              {/* Center baseline when no data */}
              <Line
                x1={0}
                y1={CHART_HEIGHT / 2}
                x2={CHART_WIDTH}
                y2={CHART_HEIGHT / 2}
                stroke="rgba(255,255,255,0.1)"
                strokeWidth={1}
              />
            </Svg>

            {/* Team Logos */}
            <View style={styles.logoOverlay}>
              {homeTeamLogo ? (
                <Image source={{ uri: homeTeamLogo }} style={styles.homeLogoPositioned} />
              ) : (
                <View style={[styles.homeLogoPositioned, { backgroundColor: "#FFA726" }]} />
              )}
            </View>

            <View style={[styles.logoOverlay, { top: 74 }]}>
              {awayTeamLogo ? (
                <Image source={{ uri: awayTeamLogo }} style={styles.awayLogoPositioned} />
              ) : (
                <View style={[styles.awayLogoPositioned, { backgroundColor: "#757575" }]} />
              )}
            </View>

            {/* Time labels - evenly distributed to match vertical lines */}
            <View style={styles.timeLabels}>
              <Text style={[styles.timeLabel, { color: theme.colors.textSecondary }]}>0'</Text>
              <Text style={[styles.timeLabel, { color: theme.colors.textSecondary }]}>10'</Text>
              <Text style={[styles.timeLabel, { color: theme.colors.textSecondary }]}>20'</Text>
              <Text style={[styles.timeLabel, { color: theme.colors.textSecondary }]}>30'</Text>
              <Text style={[styles.timeLabel, { color: theme.colors.textSecondary }]}>40'</Text>
              <Text style={[styles.timeLabel, { color: theme.colors.textSecondary }]}>FT</Text>
            </View>
          </View>
        </View>
      );
    }

    const maxValue = Math.max(...momentumData.map(Math.abs));
    
    // Handle case when all values are zero (avoid division by zero)
    if (maxValue === 0) {
      // All data is zero - show flat baseline at center
      const centerY = CHART_HEIGHT / 2;
      const flatPath = `M 0 ${centerY} L ${CHART_WIDTH} ${centerY}`;
      
      return (
        <View style={styles.chartContainer}>
          <View style={styles.chartWrapper}>
            <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
              <Defs>
                <LinearGradient id="homeGradient" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor="#FFA726" stopOpacity="0.8" />
                  <Stop offset="1" stopColor="#FFA726" stopOpacity="0.3" />
                </LinearGradient>
                <LinearGradient id="awayGradient" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor="#757575" stopOpacity="0.3" />
                  <Stop offset="1" stopColor="#757575" stopOpacity="0.8" />
                </LinearGradient>
              </Defs>
              
              {/* Vertical time interval lines - aligned with time labels */}
              {[0, 1, 2, 3, 4, 5].map((index) => {
                const x = (index / 5) * CHART_WIDTH;
                return (
                  <Line
                    key={index}
                    x1={x}
                    y1={0}
                    x2={x}
                    y2={CHART_HEIGHT}
                    stroke="rgba(150,150,150,0.15)"
                    strokeWidth={1}
                  />
                );
              })}
              
              {/* Flat baseline at center */}
              <Line
                x1={0}
                y1={centerY}
                x2={CHART_WIDTH}
                y2={centerY}
                stroke="rgba(255,255,255,0.1)"
                strokeWidth={1}
              />
            </Svg>

            {/* Team Logos */}
            <View style={styles.logoOverlay}>
              {homeTeamLogo ? (
                <Image source={{ uri: homeTeamLogo }} style={styles.homeLogoPositioned} />
              ) : (
                <View style={[styles.homeLogoPositioned, { backgroundColor: "#FFA726" }]} />
              )}
            </View>

            <View style={[styles.logoOverlay, { top: 74 }]}>
              {awayTeamLogo ? (
                <Image source={{ uri: awayTeamLogo }} style={styles.awayLogoPositioned} />
              ) : (
                <View style={[styles.awayLogoPositioned, { backgroundColor: "#757575" }]} />
              )}
            </View>

            {/* Time labels - evenly distributed to match vertical lines */}
            <View style={styles.timeLabels}>
              <Text style={[styles.timeLabel, { color: theme.colors.textSecondary }]}>0'</Text>
              <Text style={[styles.timeLabel, { color: theme.colors.textSecondary }]}>10'</Text>
              <Text style={[styles.timeLabel, { color: theme.colors.textSecondary }]}>20'</Text>
              <Text style={[styles.timeLabel, { color: theme.colors.textSecondary }]}>30'</Text>
              <Text style={[styles.timeLabel, { color: theme.colors.textSecondary }]}>40'</Text>
              <Text style={[styles.timeLabel, { color: theme.colors.textSecondary }]}>FT</Text>
            </View>
          </View>
        </View>
      );
    }
    
    const normalizedData = momentumData.map((v) => v / maxValue);

    const stepX = CHART_WIDTH / 48; // 48 minutes for basketball
    const centerY = CHART_HEIGHT / 2;

    // Create SVG path strings for home (orange) and away (grey) areas
    let homePathData = `M 0 ${centerY}`; // Start at baseline
    let awayPathData = `M 0 ${centerY}`; // Start at baseline
    
    normalizedData.forEach((value, index) => {
      const x = index * stepX;
      const y = centerY - value * (CHART_HEIGHT * 0.4);
      
      if (value >= 0) {
        homePathData += ` L ${x} ${y}`;
      } else {
        awayPathData += ` L ${x} ${y}`;
      }
    });

    // Close paths to baseline
    homePathData += ` L ${CHART_WIDTH} ${centerY} Z`;
    awayPathData += ` L ${CHART_WIDTH} ${centerY} Z`;

    return (
      <View style={styles.chartContainer}>
        {/* Momentum Chart */}
        <View style={styles.chartWrapper}>
          <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
            <Defs>
              <LinearGradient id="homeGradient" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#FFA726" stopOpacity="0.8" />
                <Stop offset="1" stopColor="#FFA726" stopOpacity="0.3" />
              </LinearGradient>
              <LinearGradient id="awayGradient" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#757575" stopOpacity="0.3" />
                <Stop offset="1" stopColor="#757575" stopOpacity="0.8" />
              </LinearGradient>
            </Defs>
            
            {/* Vertical time interval lines - aligned with time labels */}
            {[0, 1, 2, 3, 4, 5].map((index) => {
              const x = (index / 5) * CHART_WIDTH;
              return (
                <Line
                  key={index}
                  x1={x}
                  y1={0}
                  x2={x}
                  y2={CHART_HEIGHT}
                  stroke="rgba(150,150,150,0.15)"
                  strokeWidth={1}
                />
              );
            })}
            
            {/* Orange area for home team */}
            <Path d={homePathData} fill="url(#homeGradient)" />
            {/* Grey area for away team */}
            <Path d={awayPathData} fill="url(#awayGradient)" />
          </Svg>

          {/* Team Logos - Positioned with breathing space */}
          <View style={styles.logoOverlay}>
            {/* Home Team Logo - Moved up for breathing space */}
            {homeTeamLogo ? (
              <Image 
                source={{ uri: homeTeamLogo }} 
                style={styles.homeLogoPositioned} 
              />
            ) : (
              <View style={[styles.homeLogoPositioned, { backgroundColor: "#FFA726" }]} />
            )}
          </View>

          <View style={[styles.logoOverlay, { top: 74 }]}>
            {/* Away Team Logo - Moved down for breathing space */}
            {awayTeamLogo ? (
              <Image 
                source={{ uri: awayTeamLogo }} 
                style={styles.awayLogoPositioned} 
              />
            ) : (
              <View style={[styles.awayLogoPositioned, { backgroundColor: "#757575" }]} />
            )}
          </View>

          {/* Time labels */}
          <View style={styles.timeLabels}>
            <Text style={[styles.timeLabel, { color: theme.colors.textSecondary }]}>0'</Text>
            <Text style={[styles.timeLabel, { color: theme.colors.textSecondary }]}>10'</Text>
            <Text style={[styles.timeLabel, { color: theme.colors.textSecondary }]}>20'</Text>
            <Text style={[styles.timeLabel, { color: theme.colors.textSecondary }]}>30'</Text>
            <Text style={[styles.timeLabel, { color: theme.colors.textSecondary }]}>40'</Text>
            <Text style={[styles.timeLabel, { color: theme.colors.textSecondary }]}>FT</Text>
          </View>

          {/* Current time indicator */}
          {isLive && (
            <View
              style={[
                styles.currentTimeIndicator,
                { left: (elapsed / 2880) * CHART_WIDTH }, // 2880 seconds = 48 minutes
              ]}
            >
              <View style={styles.timeMarker} />
              <Text style={styles.timeText}>{Math.floor(elapsed / 60)}'</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderQuarterScores = () => {
    const homeQuarters = quarters?.home || [0, 0, 0, 0];
    const awayQuarters = quarters?.away || [0, 0, 0, 0];
    // ✅ BASKETBALL: Handle null values in quarter scores with proper typing
    const homeTotal = homeQuarters.reduce((sum: number, q: number | null) => sum + (q || 0), 0);
    const awayTotal = awayQuarters.reduce((sum: number, q: number | null) => sum + (q || 0), 0);

    return (
      <View style={styles.quarterTable}>
        {/* Header Row */}
        <View style={styles.tableRow}>
          <Text style={[styles.tableHeaderCell, styles.teamNameCell, { color: theme.colors.text }]}>
            Team
          </Text>
          <Text style={[styles.tableHeaderCell, { color: theme.colors.text }]}>Q1</Text>
          <Text style={[styles.tableHeaderCell, { color: theme.colors.text }]}>Q2</Text>
          <Text style={[styles.tableHeaderCell, { color: theme.colors.text }]}>Q3</Text>
          <Text style={[styles.tableHeaderCell, { color: theme.colors.text }]}>Q4</Text>
          <Text style={[styles.tableHeaderCell, { color: theme.colors.text }]}>Total</Text>
        </View>

        {/* Home Team Row */}
        <View style={[styles.tableRow, { backgroundColor: theme.colors.backgroundSecondary }]}>
          <Text
            style={[styles.tableCell, styles.teamNameCell, { color: theme.colors.text }]}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {homeTeamName}
          </Text>
          {homeQuarters.map((score, idx) => (
            <Text key={`home-q${idx}`} style={[styles.tableCell, { color: theme.colors.text }]}>
              {score || "-"}
            </Text>
          ))}
          <Text style={[styles.tableCell, styles.totalCell, { color: "#FFA726" }]}>
            {homeTotal}
          </Text>
        </View>

        {/* Away Team Row */}
        <View style={styles.tableRow}>
          <Text
            style={[styles.tableCell, styles.teamNameCell, { color: theme.colors.text }]}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {awayTeamName}
          </Text>
          {awayQuarters.map((score, idx) => (
            <Text key={`away-q${idx}`} style={[styles.tableCell, { color: theme.colors.text }]}>
              {score || "-"}
            </Text>
          ))}
          <Text style={[styles.tableCell, styles.totalCell, { color: "#757575" }]}>
            {awayTotal}
          </Text>
        </View>
      </View>
    );
  };

  const renderStatBar = (
    label: string,
    homeValue: number,
    awayValue: number,
    homeColor: string = "#FFC107",
    awayColor: string = "#757575"
  ) => {
    // Check if there's any data
    const hasData = homeValue > 0 || awayValue > 0;
    
    if (!hasData) {
      // No data - show 50% yellow / 50% grey (balanced)
      return (
        <View style={styles.statRow}>
          {/* Home Team Stats */}
          <View style={styles.statLeft}>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>0</Text>
          </View>

          {/* Bar - 50% yellow, 50% grey when no data */}
          <View style={styles.statBarContainer}>
            <Text style={[styles.statLabel, { color: theme.colors.text }]}>{label}</Text>
            <View style={styles.statBar}>
              <View
                style={[
                  styles.statBarFill,
                  {
                    backgroundColor: "#FFC107",
                    width: "50%",
                  },
                ]}
              />
              <View
                style={[
                  styles.statBarFill,
                  {
                    backgroundColor: "#757575",
                    width: "50%",
                  },
                ]}
              />
            </View>
          </View>

          {/* Away Team Stats */}
          <View style={styles.statRight}>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>0</Text>
          </View>
        </View>
      );
    }

    // Has data - show proportional bars
    const total = homeValue + awayValue || 1;
    const homePercentage = (homeValue / total) * 100;
    const awayPercentage = (awayValue / total) * 100;

    return (
      <View style={styles.statRow}>
        {/* Home Team Stats */}
        <View style={styles.statLeft}>
          <Text style={[styles.statValue, { color: theme.colors.text }]}>
            {homeValue}
          </Text>
        </View>

        {/* Bar */}
        <View style={styles.statBarContainer}>
          <Text style={[styles.statLabel, { color: theme.colors.text }]}>{label}</Text>
          <View style={styles.statBar}>
            <View
              style={[
                styles.statBarFill,
                {
                  backgroundColor: homeColor,
                  width: `${homePercentage}%`,
                },
              ]}
            />
            <View
              style={[
                styles.statBarFill,
                {
                  backgroundColor: awayColor,
                  width: `${awayPercentage}%`,
                },
              ]}
            />
          </View>
        </View>

        {/* Away Team Stats */}
        <View style={styles.statRight}>
          <Text style={[styles.statValue, { color: theme.colors.text }]}>
            {awayValue}
          </Text>
        </View>
      </View>
    );
  };

  const renderCircularPercentage = (
    label: string,
    homePercentage: number,
    awayPercentage: number
  ) => {
    // Display values: show actual data when available, 50/50 when no data
    const displayHomePercentage = homePercentage > 0 ? homePercentage : 50;
    const displayAwayPercentage = awayPercentage > 0 ? awayPercentage : 50;
    
    // Arc calculation: use actual percentages for proportional display
    // When both are 0 (no data), default to 50/50 split
    const total = homePercentage + awayPercentage || 100;
    const homeRatio = homePercentage > 0 ? homePercentage / total : 0.5;
    const awayRatio = awayPercentage > 0 ? awayPercentage / total : 0.5;
    
    const radius = 28;
    const strokeWidth = 5;
    const circumference = 2 * Math.PI * radius;
    
    // Calculate arc lengths based on actual data ratios
    const homeArcLength = circumference * homeRatio;
    const awayArcLength = circumference * awayRatio;

    return (
      <View style={styles.circularStat}>
        <Text style={[styles.circularLabel, { color: theme.colors.textSecondary }]}>
          {label}
        </Text>
        <View style={styles.circularContainer}>
          <Svg width={radius * 2 + strokeWidth * 2} height={radius * 2 + strokeWidth * 2}>
            {/* Grey arc (Away team - RIGHT half) - draws first as background */}
            <Circle
              cx={radius + strokeWidth}
              cy={radius + strokeWidth}
              r={radius}
              stroke="#757575"
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={`${awayArcLength} ${circumference}`}
              strokeDashoffset={0}
              strokeLinecap="butt"
            />
            
            {/* Yellow arc (Home team - LEFT half) - draws second on top */}
            <Circle
              cx={radius + strokeWidth}
              cy={radius + strokeWidth}
              r={radius}
              stroke="#FFC107"
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={`${homeArcLength} ${circumference}`}
              strokeDashoffset={-awayArcLength}
              strokeLinecap="butt"
            />
          </Svg>
          {/* Percentage values - show actual data */}
          <View style={styles.circleTextContainer}>
            <Text style={[styles.percentageText, { color: "#FFC107" }]}>
              {displayHomePercentage}
            </Text>
            <Text style={[styles.percentageText, { color: "#757575" }]}>
              {displayAwayPercentage}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderAttackStatistics = () => {
    return (
      <View style={styles.attackSection}>
        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <View style={styles.teamHeaderLeft}>
            {homeTeamLogo && (
              <Image source={{ uri: homeTeamLogo }} style={styles.headerLogo} />
            )}
            <Text style={[styles.teamHeaderText, { color: theme.colors.text }]} numberOfLines={1}>
              {homeTeamName}
            </Text>
          </View>
          <View style={styles.teamHeaderRight}>
            <Text style={[styles.teamHeaderText, { color: theme.colors.text }]} numberOfLines={1}>
              {awayTeamName}
            </Text>
            {awayTeamLogo && (
              <Image source={{ uri: awayTeamLogo }} style={styles.headerLogo} />
            )}
          </View>
        </View>

        {/* Attack Stats Bars */}
        {/* 3-Point Shots - Grey only when no data, Yellow/Grey when has data */}
        {renderStatBar("3-Point Shots", stats.threePointers.home, stats.threePointers.away)}
        {/* 2-Point Shots - Yellow/Grey bars */}
        {renderStatBar("2-Point Shots", stats.twoPointers.home, stats.twoPointers.away)}
        {/* Free Throws - Yellow/Grey bars */}
        {renderStatBar("Free Throws", stats.freeThrows.home, stats.freeThrows.away)}

        {/* Shooting Percentages */}
        <View style={styles.percentageRow}>
          <Text style={[styles.percentageTitle, { color: theme.colors.text }]}>
            Shooting %
          </Text>
        </View>

        <View style={styles.circularRow}>
          {renderCircularPercentage("3 Pt %", stats.threePointPercentage.home, stats.threePointPercentage.away)}
          {renderCircularPercentage("2 Pt %", stats.twoPointPercentage.home, stats.twoPointPercentage.away)}
          {renderCircularPercentage("FT %", stats.freeThrowPercentage.home, stats.freeThrowPercentage.away)}
          {renderCircularPercentage("Rebound %", stats.reboundPercentage.home, stats.reboundPercentage.away)}
        </View>
      </View>
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      {/* ✅ Match Start Time Display (like football screen) */}
      {getFormattedStartTime() && (
        <View style={styles.matchInfoBar}>
          <Text style={[styles.startTimeText, { color: theme.colors.textSecondary }]}>
            {getFormattedStartTime()}
          </Text>
        </View>
      )}

      {/* Feature 1: Momentum Chart */}
      {renderMomentumChart()}

      {/* Dark Separator */}
      <DarkSeparator />

      {/* Feature 2: Quarter Scores Table */}
      {renderQuarterScores()}

      {/* Dark Separator */}
      <DarkSeparator />

      {/* Feature 3: Attack Statistics */}
      {renderAttackStatistics()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // ✅ Match start time info bar (like football screen)
  matchInfoBar: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  startTimeText: {
    fontSize: 13,
    fontWeight: "500",
  },
  // Dark Separator - Theme-responsive (same as football live screen)
  darkSeparator: {
    height: 4,
    marginVertical: 0,
  },
  
  // ===== MOMENTUM CHART STYLES =====
  chartContainer: {
    marginVertical: 16,
    position: "relative",
  },
  chartWrapper: {
    position: "relative",
    marginLeft: 40,
    paddingRight: 16,
  },
  // Team logos positioned absolutely on left side (like football)
  logoOverlay: {
    position: "absolute",
    left: -28,
    top: 18, // Moved up for more breathing space
    zIndex: 10,
  },
  homeLogoPositioned: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  awayLogoPositioned: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  timeLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingHorizontal: 0,
    width: CHART_WIDTH,
  },
  timeLabel: {
    fontSize: 11,
    textAlign: "center",
  },
  currentTimeIndicator: {
    position: "absolute",
    top: 0,
    alignItems: "center",
  },
  timeMarker: {
    width: 2,
    height: CHART_HEIGHT,
    backgroundColor: "#FF6B00",
  },
  timeText: {
    fontSize: 10,
    color: "#FF6B00",
    fontWeight: "600",
    marginTop: 4,
  },

  // ===== QUARTER SCORES TABLE STYLES =====
  quarterTable: {
    paddingHorizontal: 16,
    marginVertical: 12,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  tableHeaderCell: {
    flex: 1,
    padding: 12,
    paddingHorizontal: 8,
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  tableCell: {
    flex: 1,
    padding: 12,
    paddingHorizontal: 8,
    fontSize: 14,
    textAlign: "center",
  },
  teamNameCell: {
    flex: 2.5,
    textAlign: "left",
    paddingLeft: 16,
  },
  totalCell: {
    fontWeight: "700",
    fontSize: 16,
  },

  // ===== ATTACK STATISTICS STYLES =====
  attackSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  teamHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  teamHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    justifyContent: "flex-end",
  },
  headerLogo: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  teamHeaderText: {
    fontSize: 13,
    fontWeight: "600",
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  statLeft: {
    width: 40,
    alignItems: "flex-start",
  },
  statRight: {
    width: 40,
    alignItems: "flex-end",
  },
  statBarContainer: {
    flex: 1,
    marginHorizontal: 8,
  },
  statLabel: {
    fontSize: 12,
    textAlign: "center",
    marginBottom: 4,
  },
  statBar: {
    height: 6,
    flexDirection: "row",
    borderRadius: 3,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  statBarFill: {
    height: "100%",
  },
  statValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  percentageRow: {
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 12,
  },
  percentageTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  circularRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  circularStat: {
    alignItems: "center",
    flex: 1,
  },
  circularLabel: {
    fontSize: 11,
    marginBottom: 8,
    textAlign: "center",
  },
  circularContainer: {
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  circleTextContainer: {
    position: "absolute",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 2,
  },
  percentageText: {
    fontSize: 11,
    fontWeight: "600",
  },
});
