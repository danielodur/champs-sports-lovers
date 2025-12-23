/**
 * Generic Stats Display Component
 * 
 * This component displays match statistics in a sport-agnostic way.
 * It reads the sport configuration to determine which stats to show
 * and automatically adapts to different sports (football, basketball, etc.)
 * 
 * Features:
 * - Sport-specific stat selection
 * - Visual progress bars for each stat
 * - Responsive layout
 * - Theme-aware styling
 */

import React, { useEffect } from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { getSportStats, formatStatLabel, getStatDisplayName } from "@/config/sports-config";
import { useTheme } from "@/hooks/useTheme";

// ===== INTERFACES =====
interface StatsDisplayProps {
  sport: string;
  homeStats: Record<string, any>;
  awayStats: Record<string, any>;
  homeTeamName: string;
  awayTeamName: string;
  homeTeamLogo?: string; // ✅ Add team logos
  awayTeamLogo?: string; // ✅ Add team logos
}

interface StatRowProps {
  label: string;
  homeValue: any;
  awayValue: any;
  theme: any;
  sport: string;
}

// ===== STAT ROW COMPONENT =====
function StatRow({ label, homeValue, awayValue, theme, sport }: StatRowProps) {
  // Handle different value types (numbers, strings, percentages)
  const homeNum = typeof homeValue === 'number' ? homeValue : parseFloat(homeValue) || 0;
  const awayNum = typeof awayValue === 'number' ? awayValue : parseFloat(awayValue) || 0;
  
  const total = homeNum + awayNum;
  const homePercent = total > 0 ? (homeNum / total) * 100 : 50;
  const awayPercent = total > 0 ? (awayNum / total) * 100 : 50;

  // Format display value
  const formatValue = (val: any): string => {
    if (val === null || val === undefined) return '0';
    if (typeof val === 'string' && val.includes('%')) return val;
    if (typeof val === 'number' || !isNaN(parseFloat(val))) {
      const num = typeof val === 'number' ? val : parseFloat(val);
      return Number.isInteger(num) ? num.toString() : num.toFixed(1);
    }
    return String(val);
  };

  return (
    <View style={styles.statRow}>
      <Text style={[styles.statValue, { color: theme.colors.text }]}>
        {formatValue(homeValue)}
      </Text>
      
      <View style={styles.statCenter}>
        <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
          {getStatDisplayName(label, sport)}
        </Text>
        <View style={styles.statBar}>
          <View 
            style={[
              styles.statBarHome, 
              { 
                width: `${homePercent}%`,
                backgroundColor: theme.colors.primary || '#00A86B'
              }
            ]} 
          />
          <View 
            style={[
              styles.statBarAway, 
              { 
                width: `${awayPercent}%`,
                backgroundColor: theme.colors.secondary || '#FF6B35'
              }
            ]} 
          />
        </View>
      </View>
      
      <Text style={[styles.statValue, { color: theme.colors.text }]}>
        {formatValue(awayValue)}
      </Text>
    </View>
  );
}

// ===== MAIN STATS DISPLAY COMPONENT =====
export default function StatsDisplay({ 
  sport, 
  homeStats, 
  awayStats,
  homeTeamName,
  awayTeamName,
  homeTeamLogo, // ✅ Receive team logos
  awayTeamLogo  // ✅ Receive team logos
}: StatsDisplayProps) {
  const theme = useTheme();
  const sportConfig = getSportStats(sport);
  
  // ✅ DEBUG: Log team logos to identify missing logos
  useEffect(() => {
    console.log(`🏀 [StatsDisplay] Rendering for ${sport}`);
    console.log(`🏆 Home Team: ${homeTeamName}, Logo: ${homeTeamLogo || 'MISSING'}`);
    console.log(`🏆 Away Team: ${awayTeamName}, Logo: ${awayTeamLogo || 'MISSING'}`);
  }, [sport, homeTeamName, awayTeamName, homeTeamLogo, awayTeamLogo]);
  
  // Handle loading or missing data
  if (!homeStats || !awayStats) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.noData, { color: theme.colors.textSecondary }]}>
          No statistics available
        </Text>
      </View>
    );
  }
  
  // Get available stats (only show stats that have data)
  const availableStats = {
    primary: sportConfig.primary.filter(stat => 
      homeStats.hasOwnProperty(stat) || awayStats.hasOwnProperty(stat)
    ),
    secondary: sportConfig.secondary.filter(stat => 
      homeStats.hasOwnProperty(stat) || awayStats.hasOwnProperty(stat)
    ),
  };

  // If no stats are available at all
  if (availableStats.primary.length === 0 && availableStats.secondary.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.noData, { color: theme.colors.textSecondary }]}>
          Statistics will be available once the match starts
        </Text>
      </View>
    );
  }
  
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Team Names Header with Logos */}
      <View style={styles.teamsRow}>
        {/* Home Team - Logo on left side of name */}
        <View style={styles.teamContainer}>
          {homeTeamLogo ? (
            <Image 
              source={{ uri: homeTeamLogo }}
              style={styles.teamLogo}
              resizeMode="contain"
              onError={(error) => {
                console.log(`❌ Home team logo failed to load: ${homeTeamLogo}`, error);
              }}
              onLoad={() => {
                console.log(`✅ Home team logo loaded successfully: ${homeTeamLogo}`);
              }}
            />
          ) : (
            console.log(`⚠️ Home team logo is missing or undefined`),
            null
          )}
          <Text 
            style={[styles.teamName, { color: theme.colors.text }]} 
            numberOfLines={1}
          >
            {homeTeamName}
          </Text>
        </View>
        
        {/* Away Team - Logo on right side of name */}
        <View style={[styles.teamContainer, styles.awayTeamContainer]}>
          <Text 
            style={[styles.teamName, styles.awayTeamName, { color: theme.colors.text }]} 
            numberOfLines={1}
          >
            {awayTeamName}
          </Text>
          {awayTeamLogo ? (
            <Image 
              source={{ uri: awayTeamLogo }}
              style={styles.teamLogo}
              resizeMode="contain"
              onError={(error) => {
                console.log(`❌ Away team logo failed to load: ${awayTeamLogo}`, error);
              }}
              onLoad={() => {
                console.log(`✅ Away team logo loaded successfully: ${awayTeamLogo}`);
              }}
            />
          ) : (
            console.log(`⚠️ Away team logo is missing or undefined`),
            null
          )}
        </View>
      </View>
      
      {/* Primary Stats Section */}
      {availableStats.primary.length > 0 && (
        <View style={styles.statsSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Key Statistics
          </Text>
          {availableStats.primary.map(stat => (
            <StatRow 
              key={stat}
              label={stat}
              homeValue={homeStats[stat]}
              awayValue={awayStats[stat]}
              theme={theme}
              sport={sport}
            />
          ))}
        </View>
      )}
      
      {/* Secondary Stats Section */}
      {availableStats.secondary.length > 0 && (
        <View style={styles.statsSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Additional Statistics
          </Text>
          {availableStats.secondary.map(stat => (
            <StatRow 
              key={stat}
              label={stat}
              homeValue={homeStats[stat]}
              awayValue={awayStats[stat]}
              theme={theme}
              sport={sport}
            />
          ))}
        </View>
      )}
    </View>
  );
}

// ===== STYLES =====
const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  teamsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  teamContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 8,
  },
  awayTeamContainer: {
    justifyContent: "flex-end", // ✅ Push away team content to the right
  },
  teamLogo: {
    width: 24,
    height: 24,
  },
  teamName: {
    fontSize: 14,
    fontFamily: "Inter-SemiBold",
    flex: 1,
  },
  awayTeamName: {
    textAlign: "right", // ✅ Right-align away team name text
    flex: 0, // ✅ Don't expand to fill space
  },
  statsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Inter-SemiBold",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  statValue: {
    width: 45,
    textAlign: "center",
    fontSize: 14,
    fontFamily: "Inter-Bold",
  },
  statCenter: {
    flex: 1,
    marginHorizontal: 12,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: "Inter-Medium",
    textAlign: "center",
    marginBottom: 6,
  },
  statBar: {
    flexDirection: "row",
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
    backgroundColor: "rgba(0, 0, 0, 0.1)",
  },
  statBarHome: {
    height: "100%",
  },
  statBarAway: {
    height: "100%",
  },
  noData: {
    textAlign: "center",
    fontSize: 14,
    fontFamily: "Inter-Regular",
    padding: 20,
  },
});

