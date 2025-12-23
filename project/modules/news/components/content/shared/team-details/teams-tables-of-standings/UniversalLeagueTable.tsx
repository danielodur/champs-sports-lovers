/**
 * Universal League Table Component
 * 
 * Dynamic component that fetches and displays standings for ANY league/competition
 * from API-Football. Automatically handles:
 * - Single table leagues (Premier League, La Liga, etc.)
 * - Group stage competitions (Champions League, Europa League, etc.)
 * - Cup competitions (FA Cup, Copa del Rey, etc.)
 * 
 * This component eliminates the need to create separate template files for each competition.
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
} from "react-native";
import {
  fetchLeagueStandings,
  LeagueStandingsResponse,
} from "@/services/leagueStandingsService";
import StandingsGroup from "./components/StandingsGroup";
import TableLegend from "./components/TableLegend";

interface UniversalLeagueTableProps {
  leagueId?: number;
  season?: number;
  currentTeamName: string;
  theme: any;
  teamColors: { primary: string; secondary: string };
  isDarkMode: boolean;
}

export default function UniversalLeagueTable({
  leagueId,
  season,
  currentTeamName,
  theme,
  teamColors,
  isDarkMode,
}: UniversalLeagueTableProps) {
  const [standingsData, setStandingsData] = useState<LeagueStandingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log(`🏆 [UniversalLeagueTable] Initialized for team: ${currentTeamName}`);
    console.log(`🏆 [UniversalLeagueTable] League ID:`, leagueId);
    console.log(`🏆 [UniversalLeagueTable] Season:`, season);
    
    if (leagueId) {
      loadStandings();
    } else {
      // If no leagueId provided, show helpful message
      console.warn(`⚠️ [UniversalLeagueTable] No leagueId provided for ${currentTeamName}`);
      setLoading(false);
      setError("League information not available for this team");
    }
  }, [leagueId, season]);

  const loadStandings = async () => {
    if (!leagueId) {
      setError("League ID is required");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setStandingsData(null); // Clear previous data

      console.log(`📊 [UniversalLeagueTable] Loading standings for league ${leagueId}...`);

      const data = await fetchLeagueStandings(leagueId, season);

      if (!data) {
        console.error(`❌ [UniversalLeagueTable] No data returned for league ${leagueId}`);
        
        // More helpful error message
        setError(
          `League standings not available.\n\n` +
          `This may happen if:\n` +
          `• The competition hasn't started yet\n` +
          `• It's a cup competition without league tables\n` +
          `• The league data is not in our system\n\n` +
          `Try checking the Matches or Info tabs instead.`
        );
        setLoading(false);
        return;
      }

      console.log(`✅ [UniversalLeagueTable] Successfully loaded standings for ${data.league.name}`);
      console.log(`📊 [UniversalLeagueTable] Groups:`, data.groups.length);

      setStandingsData(data);
      setLoading(false);
    } catch (err) {
      console.error("❌ [UniversalLeagueTable] Error loading standings:", err);
      setError("Failed to load standings data. Please try again later.");
      setLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={teamColors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
          Loading standings...
        </Text>
      </View>
    );
  }

  // Error state
  if (error || !standingsData) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.errorTitle, { color: theme.colors.text }]}>
          No Standings Available
        </Text>
        <Text style={[styles.errorText, { color: theme.colors.textSecondary }]}>
          {error || "Standings data is not available for this competition at the moment."}
          {"\n\n"}
          This may happen if:
          {"\n"}• The team is not currently participating in a league
          {"\n"}• The league data is not yet available in our system
          {"\n"}• The competition has ended or hasn't started yet
        </Text>
        <View style={[styles.suggestContainer, { backgroundColor: theme.colors.backgroundSecondary }]}>
          <Text style={[styles.suggestText, { color: theme.colors.textSecondary }]}>
            💡 Tip: Try checking the team's "Matches" or "Info" tabs for more information
          </Text>
        </View>
      </View>
    );
  }

  const { league, groups } = standingsData;
  const hasMultipleGroups = groups.length > 1;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      {/* League Header */}
      <View style={styles.leagueHeader}>
        <View style={styles.leagueHeaderContent}>
          <Image source={{ uri: league.logo }} style={styles.leagueLogo} />
          <View style={styles.leagueInfo}>
            <Text style={[styles.leagueName, { color: theme.colors.text }]}>
              {league.name}
            </Text>
            <View style={styles.leagueMetadata}>
              {league.countryFlag && !league.countryFlag.startsWith('http') && (
                <Text style={styles.countryFlag}>{league.countryFlag}</Text>
              )}
              {league.countryFlag && league.countryFlag.startsWith('http') && (
                <Image 
                  source={{ uri: league.countryFlag }} 
                  style={styles.countryFlagImage}
                  resizeMode="contain"
                />
              )}
              <Text style={[styles.leagueCountry, { color: theme.colors.textSecondary }]}>
                {league.country}
              </Text>
              <Text style={[styles.leagueSeason, { color: theme.colors.textSecondary }]}>
                • {league.season}/{league.season + 1}
              </Text>
            </View>
            <View style={[styles.leagueTypeBadge, { backgroundColor: `${teamColors.primary}15` }]}>
              <Text style={[styles.leagueType, { color: teamColors.primary }]}>
                {league.type}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Competition Summary */}
      {hasMultipleGroups && (
        <View
          style={[
            styles.summaryContainer,
            { backgroundColor: theme.colors.backgroundSecondary },
          ]}
        >
          <Text style={[styles.summaryText, { color: theme.colors.textSecondary }]}>
            {groups.length} Groups • {groups[0]?.standings.length || 0} Teams per Group
          </Text>
        </View>
      )}

      {/* Standings Groups */}
      <View style={styles.standingsContainer}>
        {groups.map((group, index) => (
          <StandingsGroup
            key={index}
            group={group}
            currentTeamName={currentTeamName}
            theme={theme}
            teamColors={teamColors}
            isDarkMode={isDarkMode}
            leagueId={leagueId}
          />
        ))}
      </View>

      {/* Legend - Generated from actual API data */}
      <TableLegend 
        leagueType={league.type} 
        theme={theme} 
        standings={groups.map(g => g.standings)} 
      />

      {/* API Credit */}
      <View style={styles.apiCredit}>
        <Text style={[styles.apiCreditText, { color: theme.colors.textSecondary }]}>
          Powered by API-Football
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  errorText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  suggestContainer: {
    marginTop: 24,
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 20,
  },
  suggestText: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
  },
  leagueHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  leagueHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  leagueLogo: {
    width: 60,
    height: 60,
    resizeMode: "contain",
  },
  leagueInfo: {
    flex: 1,
  },
  leagueName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  leagueMetadata: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  countryFlag: {
    fontSize: 16,
  },
  countryFlagImage: {
    width: 20,
    height: 14,
    marginRight: 6,
    borderRadius: 2,
  },
  leagueCountry: {
    fontSize: 13,
  },
  leagueSeason: {
    fontSize: 13,
  },
  leagueTypeBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  leagueType: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  summaryContainer: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
  },
  summaryText: {
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  standingsContainer: {
    padding: 16,
  },
  apiCredit: {
    padding: 16,
    alignItems: "center",
  },
  apiCreditText: {
    fontSize: 11,
    fontStyle: "italic",
  },
});

