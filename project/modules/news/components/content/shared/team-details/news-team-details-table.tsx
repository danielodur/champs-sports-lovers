/**
 * News Team Details Table - Smart Table Router
 * 
 * This component intelligently detects which competition/league/tournament a team belongs to
 * and displays the correct table templates with appropriate tabs.
 * 
 * It supports all 6 FIFA confederations:
 * - Africa (CAF): AFCON, FIFA AFCON Qualifiers, etc.
 * - Asia (AFC): AFC Asian Cup, FIFA World Cup Qualifiers, Gulf Cup
 * - Europe (UEFA): UEFA Nations League, FIFA World Cup Qualifiers
 * - CONCACAF: Gold Cup, FIFA World Cup Qualifiers, Champions Cup
 * - South America (CONMEBOL): Copa América, FIFA World Cup Qualifiers
 * - Oceania (OFC): OFC Nations Cup, FIFA World Cup Qualifiers
 * 
 * The system automatically detects the team's confederation based on:
 * - Team name
 * - Country
 * - League ID
 * - Competition name
 */

import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { detectCompetition, detectCompetitionFromApiData, detectCompetitionType, CompetitionDetectionResult } from "./utils/competitionDetector";

// Import Universal League Table for club competitions
import UniversalLeagueTable from "./teams-tables-of-standings/UniversalLeagueTable";
import MultiLeagueTable from "./teams-tables-of-standings/MultiLeagueTable";

// Import all continental table templates for national team competitions
import { FIFAAfconQualifiers, AfconGroups, AfconQualifiers, AfconChampionships } from "./teams-tables-of-standings/africa";
import { FIFAStage4Qualifiers, FIFAStage3Qualifiers, FIFAStage2Qualifiers, GulfCupGroups } from "./teams-tables-of-standings/asia";
import { FIFAUEFAGroupsQualifiers, UEFANationsLeagueGroupA } from "./teams-tables-of-standings/europe";
import { FIFACONCACAFStage3, FIFACONCACAFStage2, GoldCupGroups, CONCACAFChampionsCup } from "./teams-tables-of-standings/concacaf";
import { CONMEBOLCompetitions, FIFACONMEBOLQualifiersTable, CopaAmericaGroups } from "./teams-tables-of-standings/south-america";
import { FIFAOceaniaGroupsQualifiers, FIFAOceaniaStage3, FIFAOceaniaStage2, FIFAOceaniaStage1, OceaniaCup } from "./teams-tables-of-standings/oceania";

interface LeagueStanding {
  position: number;
  teamName: string;
  teamLogo: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalsDiff: number;
  points: number;
  form: string;
}

interface NewsTeamDetailsTableProps {
  standings?: LeagueStanding[];
  currentTeamName: string;
  theme: any;
  teamColors: { primary: string; secondary: string; logo: string };
  isDarkMode: boolean;
  loading?: boolean;
  leagueId?: number;
  leagueName?: string;
  country?: string;
  competitionName?: string;
  season?: number; // Selected season from parent component
  teamId?: number; // Team ID for fetching all competitions
}

export default function NewsTeamDetailsTable({
  standings = [],
  currentTeamName,
  theme,
  teamColors,
  isDarkMode,
  loading = false,
  leagueId,
  leagueName,
  country,
  competitionName,
  season,
  teamId,
}: NewsTeamDetailsTableProps) {
  // Use teamColors.primary directly (already processed with muted yellow in parent component)
  const getDynamicColor = (primary: string, secondary: string): string => {
    // Parent component already processes the color, so use it directly
    return primary || teamColors.primary;
  };

  // Helper function to get readable text color for team primary color
  // Always uses white text for better contrast on colored backgrounds
  const getReadableTextColor = (teamColor: string): string => {
    return "#FFFFFF";
  };

  // Smart competition detection
  const [detectionResult, setDetectionResult] = useState<CompetitionDetectionResult | null>(null);
  const [selectedTab, setSelectedTab] = useState<string>("");
  const [useUniversalTable, setUseUniversalTable] = useState(false);

  useEffect(() => {
    console.log("📋 [TableRouter] Detection starting for:", currentTeamName);
    console.log("📋 [TableRouter] League ID:", leagueId);
    console.log("📋 [TableRouter] League Name:", leagueName);
    console.log("📋 [TableRouter] Country:", country);
    console.log("📋 [TableRouter] Competition:", competitionName);

    // Priority 1: If we have a leagueId, always use UniversalLeagueTable
    if (leagueId && leagueId > 0) {
      console.log("✅ [TableRouter] Using UniversalLeagueTable (has leagueId)");
      setUseUniversalTable(true);
      setDetectionResult(null);
      return;
    }

    // Priority 2: Determine if this is a national team or club competition
    const compType = detectCompetitionType(leagueId, leagueName, currentTeamName);
    console.log("🔍 [TableRouter] Detected type:", compType);
    
    if (compType === "club-league") {
      // Use UniversalLeagueTable for all club leagues (even without leagueId, will show message)
      console.log("✅ [TableRouter] Using UniversalLeagueTable (club league)");
      setUseUniversalTable(true);
      setDetectionResult(null);
    } else {
      // Use confederation-specific templates for national team competitions
      console.log("✅ [TableRouter] Using Confederation Templates (national team)");
      setUseUniversalTable(false);
      
      const result = detectCompetitionFromApiData(
        currentTeamName,
        leagueId,
        leagueName,
        country,
        competitionName
      );
      
      console.log("🔍 [TableRouter] Confederation detection result:", result);
      setDetectionResult(result);
      
      // Set initial tab to the primary competition
      if (result.detected && result.competitions.length > 0) {
        setSelectedTab(result.primaryCompetition);
      }
    }
  }, [currentTeamName, leagueId, leagueName, country, competitionName]);

  if (loading) {
    const dynamicColor = getDynamicColor(teamColors.primary, teamColors.secondary);
    return (
      <View style={[styles.tabContent, styles.centered]}>
        <ActivityIndicator size="large" color={dynamicColor} />
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
          Loading standings...
        </Text>
      </View>
    );
  }

  // Component mapping - maps component names to actual components
  const componentMap: { [key: string]: React.ComponentType<any> } = {
    // Africa
    FIFAAfconQualifiers,
    AfconGroups,
    AfconQualifiers,
    AfconChampionships,
    
    // Asia
    FIFAStage4Qualifiers,
    FIFAStage3Qualifiers,
    FIFAStage2Qualifiers,
    GulfCupGroups,
    
    // Europe
    FIFAUEFAGroupsQualifiers,
    UEFANationsLeagueGroupA,
    
    // CONCACAF
    FIFACONCACAFStage3,
    FIFACONCACAFStage2,
    GoldCupGroups,
    CONCACAFChampionsCup,
    
    // South America
    CONMEBOLCompetitions,
    FIFACONMEBOLQualifiersTable,
    CopaAmericaGroups,
    
    // Oceania
    FIFAOceaniaGroupsQualifiers,
    FIFAOceaniaStage3,
    FIFAOceaniaStage2,
    FIFAOceaniaStage1,
    OceaniaCup,
  };

  // Render tab content based on selected tab
  const renderTabContent = () => {
    if (!detectionResult || !detectionResult.detected) {
      return (
        <View style={[styles.tabContent, styles.centered]}>
          <Text style={[styles.noDetectionTitle, { color: theme.colors.text }]}>
            Competition Not Detected
          </Text>
          <Text style={[styles.noDetectionText, { color: theme.colors.textSecondary }]}>
            We couldn't detect the competition for "{currentTeamName}".
            {"\n\n"}
            Table templates are available for teams from:
            {"\n"}• Africa (CAF)
            {"\n"}• Asia (AFC)
            {"\n"}• Europe (UEFA)
            {"\n"}• CONCACAF
            {"\n"}• South America (CONMEBOL)
            {"\n"}• Oceania (OFC)
          </Text>
        </View>
      );
    }

    const commonProps = {
      currentTeamName,
      theme,
      teamColors: { primary: teamColors.primary, secondary: teamColors.secondary },
      isDarkMode,
    };

    // Find the selected competition
    const selectedCompetition = detectionResult.competitions.find(
      comp => comp.id === selectedTab
    );

    if (!selectedCompetition) {
      return null;
    }

    // Get the component from the map
    const Component = componentMap[selectedCompetition.component];

    if (!Component) {
      return (
        <View style={[styles.tabContent, styles.centered]}>
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            Template "{selectedCompetition.component}" not found
          </Text>
        </View>
      );
    }

    return <Component {...commonProps} />;
  };

  // HYBRID APPROACH: Use UniversalLeagueTable for club leagues, confederation templates for national teams
  
  // If this is a club league, use MultiLeagueTable (shows all competitions with tabs)
  if (useUniversalTable) {
    // If we have teamId, use MultiLeagueTable to show ALL competitions
    if (teamId) {
      console.log(`🏆 [TableRouter] Using MultiLeagueTable for team ID ${teamId}`);
      return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
          <MultiLeagueTable
            teamId={teamId}
            teamName={currentTeamName}
            season={season || new Date().getFullYear()}
            currentTeamName={currentTeamName}
            theme={theme}
            teamColors={teamColors}
            isDarkMode={isDarkMode}
          />
        </View>
      );
    }
    
    // Fallback: If no teamId, use single UniversalLeagueTable
    console.log(`📊 [TableRouter] Using single UniversalLeagueTable (no teamId)`);
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <UniversalLeagueTable
          leagueId={leagueId}
          season={season || new Date().getFullYear()}
          currentTeamName={currentTeamName}
          theme={theme}
          teamColors={teamColors}
          isDarkMode={isDarkMode}
        />
      </View>
    );
  }

  // For national team competitions, use confederation-specific templates with tabs
  
  // Don't show tabs if no competition detected
  if (!detectionResult || !detectionResult.detected) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {renderTabContent()}
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Competition Info Header */}
      {detectionResult.confederation && (
        <View style={[styles.confederationHeader, { backgroundColor: `${getDynamicColor(teamColors.primary, teamColors.secondary)}15` }]}>
          <Text style={[styles.confederationText, { color: getReadableTextColor(getDynamicColor(teamColors.primary, teamColors.secondary)) }]}>
            {getConfederationName(detectionResult.confederation)} • {currentTeamName}
          </Text>
        </View>
      )}

      {/* Tab Buttons - Dynamically generated based on detected competitions */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.tabsContainer}
        contentContainerStyle={styles.tabsContentContainer}
      >
        {detectionResult.competitions.map((tab) => {
          const dynamicColor = getDynamicColor(teamColors.primary, teamColors.secondary);
          return (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tabButton,
                {
                  borderBottomWidth: selectedTab === tab.id ? 2 : 0,
                  borderBottomColor: selectedTab === tab.id ? dynamicColor : "transparent",
                  backgroundColor: selectedTab === tab.id 
                    ? `${dynamicColor}10` 
                    : "transparent",
                },
              ]}
              onPress={() => setSelectedTab(tab.id)}
            >
              <Text
                style={[
                  styles.tabButtonText,
                  {
                    color: selectedTab === tab.id 
                      ? getReadableTextColor(dynamicColor)
                      : theme.colors.textSecondary,
                    fontWeight: selectedTab === tab.id ? "bold" : "600",
                  },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Tab Content */}
      <View style={styles.contentContainer}>
        {renderTabContent()}
      </View>
    </View>
  );
}

// Helper function to get confederation display name
function getConfederationName(confederation: string): string {
  const names: { [key: string]: string } = {
    "africa": "CAF (Africa)",
    "asia": "AFC (Asia)",
    "europe": "UEFA (Europe)",
    "concacaf": "CONCACAF",
    "south-america": "CONMEBOL (South America)",
    "oceania": "OFC (Oceania)",
  };
  return names[confederation] || confederation.toUpperCase();
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  confederationHeader: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  confederationText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tabsContainer: {
    maxHeight: 50,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  tabsContentContainer: {
    paddingHorizontal: 8,
    gap: 4,
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  tabButtonText: {
    fontSize: 13,
    whiteSpace: "nowrap",
  },
  contentContainer: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
    flex: 1,
    minHeight: 400,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  noDetectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  noDetectionText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 14,
    textAlign: "center",
  },
  upcomingSoonContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  upcomingSoonTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  upcomingSoonText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
  },
});
