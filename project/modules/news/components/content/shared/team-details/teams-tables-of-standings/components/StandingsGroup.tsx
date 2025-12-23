/**
 * Standings Group Component
 * 
 * Displays a single group with header (e.g., "Group A") and its standings table
 * Used for competitions with group stages (Champions League, World Cup, etc.)
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import StandingsTable from "./StandingsTable";
import { StandingsGroup as StandingsGroupType } from "@/services/leagueStandingsService";

interface StandingsGroupProps {
  group: StandingsGroupType;
  currentTeamName: string;
  theme: any;
  teamColors: { primary: string; secondary: string };
  isDarkMode: boolean;
  leagueId?: number;
}

export default function StandingsGroup({
  group,
  currentTeamName,
  theme,
  teamColors,
  isDarkMode,
  leagueId,
}: StandingsGroupProps) {
  
  return (
    <View style={styles.container}>
      {/* Group Header (only show if group has a name) */}
      {group.groupName && (
        <View
          style={[
            styles.groupHeader,
            {
              backgroundColor: `${teamColors.primary}15`,
              borderLeftColor: teamColors.primary,
            },
          ]}
        >
          <Text style={[styles.groupTitle, { color: teamColors.primary }]}>
            {group.groupName}
          </Text>
        </View>
      )}

      {/* Standings Table */}
      <StandingsTable
        standings={group.standings}
        currentTeamName={currentTeamName}
        theme={theme}
        teamColors={teamColors}
        isDarkMode={isDarkMode}
        showGroup={!!group.groupName}
        leagueId={leagueId}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  groupHeader: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderLeftWidth: 4,
    marginBottom: 2,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
});

