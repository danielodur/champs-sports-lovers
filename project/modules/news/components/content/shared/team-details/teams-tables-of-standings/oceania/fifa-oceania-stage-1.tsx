/**
 * FIFA OFC Stage 1 Qualifiers Table Template
 * 2026 FIFA World Cup OFC Zone Stage 1 Qualifiers
 * 
 * This is a TABLE TEMPLATE for OFC Stage 1 Qualifiers.
 * It displays OFC Stage 1 Qualifiers standings (Groups A and B).
 * 
 * Stage 1 features the bottom 4 ranked teams in a knockout format.
 * The template is detected and filtered based on the team's current competition.
 * It does NOT affect the hero section or team logo (those are in news-team-details.tsx).
 */

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from "react-native";

interface TeamStanding {
  pos: number;
  flag: string; // Country flag emoji
  team: string;
  mp: number; // Matches Played
  w: number; // Wins
  d: number; // Draws
  l: number; // Losses
  gf: number; // Goals For
  ga: number; // Goals Against
  pts: number; // Points
  status?: "promoted" | "normal"; // Qualification status
  highlight?: boolean; // Highlight current team
}

interface GroupData {
  group: string; // Group A (Semifinal 1), Group B (Semifinal 2)
  teams: TeamStanding[];
}

interface FIFAOceaniaStage1Props {
  currentTeamName: string;
  theme: any;
  teamColors: { primary: string; secondary: string };
  isDarkMode: boolean;
}

export default function FIFAOceaniaStage1({
  currentTeamName,
  theme,
  teamColors,
  isDarkMode,
}: FIFAOceaniaStage1Props) {
  
  // Stage 1 OFC Qualifiers Data (2 Semifinals)
  // Bottom 4 ranked teams play in semifinals
  // Placeholders will be replaced with real API data
  const groupsData: GroupData[] = [
    {
      group: "Group A (Semifinal 1)",
      teams: [
        { pos: 1, flag: "🏴", team: "Team 1", mp: 2, w: 2, d: 0, l: 0, gf: 7, ga: 0, pts: 6, status: "promoted" },
        { pos: 2, flag: "🏴", team: "Team 2", mp: 2, w: 0, d: 0, l: 2, gf: 0, ga: 7, pts: 0 },
      ],
    },
    {
      group: "Group B (Semifinal 2)",
      teams: [
        { pos: 1, flag: "🏴", team: "Team 3", mp: 2, w: 1, d: 0, l: 1, gf: 1, ga: 4, pts: 3 },
        { pos: 2, flag: "🏴", team: "Team 4", mp: 2, w: 0, d: 0, l: 2, gf: 0, ga: 0, pts: 0 },
      ],
    },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Title */}
      <View style={styles.headerContainer}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          2026 FIFA World Cup - OFC Stage 1 Qualifiers
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          2 Semifinals • Winner Advances to Stage 2
        </Text>
      </View>

      {/* Groups Display */}
      {groupsData.map((groupData, groupIndex) => (
        <View key={groupIndex} style={styles.groupContainer}>
          {/* Group Header */}
          <View
            style={[
              styles.groupHeader,
              {
                backgroundColor: `${teamColors.primary}15`,
                borderLeftColor: teamColors.primary,
              },
            ]}
          >
            <Text
              style={[styles.groupTitle, { color: teamColors.primary }]}
            >
              {groupData.group}
            </Text>
          </View>

          {/* Table Header */}
          <View
            style={[
              styles.tableHeader,
              {
                backgroundColor: theme.colors.backgroundSecondary,
                borderBottomColor: theme.colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.headerCell,
                styles.headerPos,
                { color: theme.colors.textSecondary },
              ]}
            >
              #
            </Text>
            <Text
              style={[
                styles.headerCell,
                styles.headerTeam,
                { color: theme.colors.textSecondary },
              ]}
            ></Text>
            <Text
              style={[
                styles.headerCell,
                styles.headerStat,
                { color: theme.colors.textSecondary },
              ]}
            >
              MP
            </Text>
            <Text
              style={[
                styles.headerCell,
                styles.headerStat,
                { color: theme.colors.textSecondary },
              ]}
            >
              W/D/L
            </Text>
            <Text
              style={[
                styles.headerCell,
                styles.headerStat,
                { color: theme.colors.textSecondary },
              ]}
            >
              GF/GA
            </Text>
            <Text
              style={[
                styles.headerCell,
                styles.headerPoints,
                { color: theme.colors.textSecondary },
              ]}
            >
              PTS
            </Text>
          </View>

          {/* Team Rows */}
          {groupData.teams.map((team, index) => {
            const isHighlighted = team.highlight || team.team === currentTeamName;

            return (
              <View key={index} style={styles.rowWrapper}>
                {/* Status Badge */}
                {team.status && team.status !== "normal" && (
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: "#FF6B6B",
                      },
                    ]}
                  >
                    <Text style={styles.statusBadgeText}>PROMOTED</Text>
                  </View>
                )}

                <View
                  style={[
                    styles.tableRow,
                    {
                      backgroundColor: isHighlighted
                        ? isDarkMode
                          ? `${teamColors.primary}20`
                          : `${teamColors.primary}10`
                        : theme.colors.background,
                      borderLeftWidth: isHighlighted ? 3 : 0,
                      borderLeftColor: isHighlighted
                        ? teamColors.primary
                        : "transparent",
                      borderBottomColor: theme.colors.border,
                    },
                  ]}
                >
                  {/* Position */}
                  <Text
                    style={[
                      styles.cellText,
                      styles.posCell,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    {team.pos}
                  </Text>

                  {/* Team */}
                  <View style={styles.teamCell}>
                    <Text style={styles.flagText}>{team.flag}</Text>
                    <Text
                      style={[
                        styles.teamNameText,
                        {
                          color: isHighlighted
                            ? teamColors.primary
                            : theme.colors.text,
                          fontWeight: isHighlighted ? "bold" : "600",
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {team.team}
                    </Text>
                  </View>

                  {/* Matches Played */}
                  <Text
                    style={[
                      styles.cellText,
                      styles.statCell,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    {team.mp}
                  </Text>

                  {/* W/D/L */}
                  <Text
                    style={[
                      styles.cellText,
                      styles.statCell,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    {team.w}/{team.d}/{team.l}
                  </Text>

                  {/* GF/GA */}
                  <Text
                    style={[
                      styles.cellText,
                      styles.statCell,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    {team.gf}/{team.ga}
                  </Text>

                  {/* Points */}
                  <Text
                    style={[
                      styles.cellText,
                      styles.pointsCell,
                      {
                        color: isHighlighted
                          ? teamColors.primary
                          : theme.colors.text,
                        fontWeight: "bold",
                      },
                    ]}
                  >
                    {team.pts}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      ))}

      {/* Important Notice */}
      <View
        style={[
          styles.noticeContainer,
          { backgroundColor: theme.colors.backgroundSecondary },
        ]}
      >
        <Text style={[styles.noticeTitle, { color: teamColors.primary }]}>
          Competition Overview
        </Text>
        <Text
          style={[styles.noticeText, { color: theme.colors.textSecondary }]}
        >
          <Text style={{ fontWeight: "bold" }}>2026 FIFA World Cup OFC Zone Qualifiers - Stage 1</Text>
          {"\n\n"}
          The OFC (Oceania Football Confederation) qualification consists of 3 stages. Oceania has one direct World Cup spot and one intercontinental playoff spot.
          {"\n\n"}
          <Text style={{ fontWeight: "bold" }}>Stage 1 Format:</Text>
          {"\n\n"}
          Based on FIFA rankings, the bottom 4 OFC teams play in Stage 1. The 4 teams are divided into two semifinals, with matches played home and away. The winner of the final advances to Stage 2.
          {"\n\n"}
          <Text style={{ fontWeight: "bold" }}>Tournament Structure:</Text>
          {"\n"}
          • <Text style={{ fontWeight: "bold" }}>Semifinals:</Text> 2 matches (Team A vs Team B, Team C vs Team D)
          {"\n"}
          • <Text style={{ fontWeight: "bold" }}>Final:</Text> Winners of semifinals face each other
          {"\n"}
          • <Text style={{ fontWeight: "bold" }}>All matches:</Text> Home-and-away two-leg format
          {"\n"}
          • <Text style={{ fontWeight: "bold" }}>Winner:</Text> Advances to Stage 2
          {"\n\n"}
          <Text style={{ fontWeight: "bold" }}>Match Rules:</Text>
          {"\n"}
          • Aggregate score determines the winner
          {"\n"}
          • If tied, away goals rule applies
          {"\n"}
          • If still tied, extra time and penalty shootout
          {"\n\n"}
          <Text style={{ fontWeight: "bold" }}>Full Qualification Path:</Text>
          {"\n"}
          <Text style={{ fontWeight: "bold" }}>Stage 1:</Text> Bottom 4 ranked teams play semifinals and final. Winner advances to Stage 2.
          {"\n\n"}
          <Text style={{ fontWeight: "bold" }}>Stage 2:</Text> Top 7 ranked teams plus Stage 1 winner divided into 2 groups of 4. Top team from each group advances to Stage 3.
          {"\n\n"}
          <Text style={{ fontWeight: "bold" }}>Stage 3:</Text> 2 group winners from Stage 2 play home-and-away final. Winner qualifies for World Cup, runner-up goes to intercontinental playoff.
          {"\n\n"}
          This table uses placeholder data which will be replaced with actual team names and statistics when real match data is available through the API.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  headerContainer: {
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  groupContainer: {
    marginBottom: 24,
    borderRadius: 12,
    overflow: "hidden",
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
  tableHeader: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    alignItems: "center",
  },
  headerCell: {
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
  },
  headerPos: {
    width: 30,
  },
  headerTeam: {
    flex: 1,
    textAlign: "left",
  },
  headerStat: {
    width: 60,
  },
  headerPoints: {
    width: 40,
  },
  rowWrapper: {
    position: "relative",
  },
  statusBadge: {
    position: "absolute",
    top: -8,
    left: 12,
    zIndex: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "bold",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: "center",
    borderBottomWidth: 0.5,
  },
  cellText: {
    fontSize: 13,
    textAlign: "center",
  },
  posCell: {
    width: 30,
    fontWeight: "500",
  },
  teamCell: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  flagText: {
    fontSize: 20,
  },
  teamNameText: {
    fontSize: 14,
    flex: 1,
  },
  statCell: {
    width: 60,
  },
  pointsCell: {
    width: 40,
  },
  noticeContainer: {
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  noticeTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
  },
  noticeText: {
    fontSize: 13,
    lineHeight: 20,
  },
});

