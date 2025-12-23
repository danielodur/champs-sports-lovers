/**
 * FIFA CONCACAF Stage 2 Qualifiers Table Template
 * 2026 FIFA World Cup CONCACAF Zone Stage 2 Qualifiers
 * 
 * This is a TABLE TEMPLATE that appears inside the FIFA CONCACAF Stage 3 tab system.
 * It displays CONCACAF Stage 2 Qualifiers standings (Groups A through F).
 * 
 * Stage 2 features 30 teams (ranked 1-28 + 2 Stage 1 winners) divided into 6 groups of 5 teams each.
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
  group: string; // Group A through F
  teams: TeamStanding[];
}

interface FIFACONCACAFStage2Props {
  currentTeamName: string;
  theme: any;
  teamColors: { primary: string; secondary: string };
  isDarkMode: boolean;
}

export default function FIFACONCACAFStage2({
  currentTeamName,
  theme,
  teamColors,
  isDarkMode,
}: FIFACONCACAFStage2Props) {
  
  // Stage 2 CONCACAF Qualifiers Data (Groups A through F)
  // 6 groups with 5 teams each (30 teams total)
  // Placeholders will be replaced with real API data
  const groupsData: GroupData[] = [
    {
      group: "Group A",
      teams: [
        { pos: 1, flag: "🏴", team: "Team 1", mp: 4, w: 4, d: 0, l: 0, gf: 12, ga: 2, pts: 12, status: "promoted" },
        { pos: 2, flag: "🏴", team: "Team 2", mp: 4, w: 2, d: 1, l: 1, gf: 9, ga: 8, pts: 7 },
        { pos: 3, flag: "🏴", team: "Team 3", mp: 4, w: 2, d: 0, l: 2, gf: 6, ga: 5, pts: 6 },
        { pos: 4, flag: "🏴", team: "Team 4", mp: 4, w: 1, d: 0, l: 3, gf: 1, ga: 9, pts: 3 },
        { pos: 5, flag: "🏴", team: "Team 5", mp: 4, w: 0, d: 1, l: 3, gf: 1, ga: 5, pts: 1 },
      ],
    },
    {
      group: "Group B",
      teams: [
        { pos: 1, flag: "🏴", team: "Team 1", mp: 4, w: 4, d: 0, l: 0, gf: 17, ga: 1, pts: 12, status: "promoted" },
        { pos: 2, flag: "🏴", team: "Team 2", mp: 4, w: 2, d: 1, l: 1, gf: 16, ga: 7, pts: 7 },
        { pos: 3, flag: "🏴", team: "Team 3", mp: 4, w: 2, d: 1, l: 1, gf: 11, ga: 7, pts: 7 },
        { pos: 4, flag: "🏴", team: "Team 4", mp: 4, w: 1, d: 0, l: 3, gf: 5, ga: 13, pts: 3 },
        { pos: 5, flag: "🏴", team: "Team 5", mp: 4, w: 0, d: 0, l: 4, gf: 1, ga: 22, pts: 0 },
      ],
    },
    {
      group: "Group C",
      teams: [
        { pos: 1, flag: "🏴", team: "Team 1", mp: 4, w: 4, d: 0, l: 0, gf: 15, ga: 2, pts: 12, status: "promoted" },
        { pos: 2, flag: "🏴", team: "Team 2", mp: 4, w: 3, d: 0, l: 1, gf: 11, ga: 7, pts: 9 },
        { pos: 3, flag: "🏴", team: "Team 3", mp: 4, w: 1, d: 1, l: 2, gf: 5, ga: 9, pts: 4 },
        { pos: 4, flag: "🏴", team: "Team 4", mp: 4, w: 0, d: 2, l: 2, gf: 3, ga: 10, pts: 2 },
        { pos: 5, flag: "🏴", team: "Team 5", mp: 4, w: 0, d: 1, l: 3, gf: 4, ga: 10, pts: 1 },
      ],
    },
    {
      group: "Group D",
      teams: [
        { pos: 1, flag: "🏴", team: "Team 1", mp: 4, w: 4, d: 0, l: 0, gf: 10, ga: 1, pts: 12, status: "promoted" },
        { pos: 2, flag: "🏴", team: "Team 2", mp: 4, w: 3, d: 0, l: 1, gf: 9, ga: 4, pts: 9 },
        { pos: 3, flag: "🏴", team: "Team 3", mp: 4, w: 2, d: 0, l: 2, gf: 6, ga: 4, pts: 6 },
        { pos: 4, flag: "🏴", team: "Team 4", mp: 4, w: 1, d: 0, l: 3, gf: 3, ga: 10, pts: 3 },
        { pos: 5, flag: "🏴", team: "Team 5", mp: 4, w: 0, d: 0, l: 4, gf: 1, ga: 10, pts: 0 },
      ],
    },
    {
      group: "Group E",
      teams: [
        { pos: 1, flag: "🏴", team: "Team 1", mp: 4, w: 4, d: 0, l: 0, gf: 8, ga: 2, pts: 12, status: "promoted" },
        { pos: 2, flag: "🏴", team: "Team 2", mp: 4, w: 3, d: 0, l: 1, gf: 13, ga: 5, pts: 9 },
        { pos: 3, flag: "🏴", team: "Team 3", mp: 4, w: 2, d: 0, l: 2, gf: 11, ga: 5, pts: 6 },
        { pos: 4, flag: "🏴", team: "Team 4", mp: 4, w: 1, d: 0, l: 3, gf: 5, ga: 14, pts: 3 },
        { pos: 5, flag: "🏴", team: "Team 5", mp: 4, w: 0, d: 0, l: 4, gf: 0, ga: 11, pts: 0 },
      ],
    },
    {
      group: "Group F",
      teams: [
        { pos: 1, flag: "🏴", team: "Team 1", mp: 4, w: 3, d: 1, l: 0, gf: 10, ga: 2, pts: 10, status: "promoted" },
        { pos: 2, flag: "🏴", team: "Team 2", mp: 4, w: 2, d: 2, l: 0, gf: 7, ga: 2, pts: 8 },
        { pos: 3, flag: "🏴", team: "Team 3", mp: 4, w: 2, d: 1, l: 1, gf: 10, ga: 2, pts: 7 },
        { pos: 4, flag: "🏴", team: "Team 4", mp: 4, w: 1, d: 0, l: 3, gf: 9, ga: 9, pts: 3 },
        { pos: 5, flag: "🏴", team: "Team 5", mp: 4, w: 0, d: 0, l: 4, gf: 0, ga: 21, pts: 0 },
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
          2026 FIFA World Cup - CONCACAF Stage 2 Qualifiers
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          6 Groups (A-F) • 5 Teams per Group • Top 2 Teams Advance to Stage 3
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
          The 2026 FIFA World Cup CONCACAF Zone Qualifiers is the qualifying competition for CONCACAF member countries to secure spots in the 2026 FIFA World Cup. The United States, Canada, and Mexico automatically qualified as hosts and do not participate in this qualifier. CONCACAF has a total of 3 direct qualifying spots and 2 intercontinental playoff spots.
          {"\n\n"}
          The CONCACAF and Caribbean Football Federation has a total of 35 member countries. Excluding the 3 host countries, there are 32 member countries participating in this qualifier. The competition consists of three stages.
          {"\n\n"}
          <Text style={{ fontWeight: "bold" }}>Competition Format:</Text>
          {"\n\n"}
          <Text style={{ fontWeight: "bold" }}>Stage 1:</Text> Based on FIFA rankings, teams ranked 29-32 are divided into two groups for home-and-away matches. The winning teams advance to Stage 2.
          {"\n\n"}
          <Text style={{ fontWeight: "bold" }}>Stage 2:</Text> 30 teams (ranked 1-28 plus the 2 Stage 1 winners) are divided into 6 groups of 5 teams each. Groups play single round-robin matches (two home, two away). The top 2 teams from each group advance to Stage 3.
          {"\n\n"}
          <Text style={{ fontWeight: "bold" }}>Stage 3:</Text> The 12 teams from Stage 2 are divided into 3 groups of 4 teams each. Groups play home-and-away double round-robin matches. The top team from each of the 3 groups directly qualifies for the 2026 FIFA World Cup, while the two best second-place teams secure intercontinental playoff spots.
          {"\n\n"}
          <Text style={{ fontWeight: "bold" }}>Teams Qualified for World Cup:</Text> United States, Canada, Mexico (hosts)
          {"\n\n"}
          <Text style={{ fontWeight: "bold" }}>Teams in Intercontinental Playoffs:</Text> None yet
          {"\n\n"}
          This table uses placeholder data (Team 1, Team 2, etc.) which will be replaced with actual team names when real match data is available through the API.
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

