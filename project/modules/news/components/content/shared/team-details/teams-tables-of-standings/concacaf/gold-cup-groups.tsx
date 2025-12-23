/**
 * CONCACAF Gold Cup Group Stage Table Template
 * CONCACAF Gold Cup - Group Stage
 * 
 * This is a TABLE TEMPLATE that appears inside the FIFA CONCACAF Stage 3 tab system.
 * It displays CONCACAF Gold Cup Group Stage standings (Groups A through D).
 * 
 * The Gold Cup features 16 teams from CONCACAF divided into 4 groups of 4 teams each.
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
  group: string; // Group A through D
  teams: TeamStanding[];
}

interface GoldCupGroupsProps {
  currentTeamName: string;
  theme: any;
  teamColors: { primary: string; secondary: string };
  isDarkMode: boolean;
}

export default function GoldCupGroups({
  currentTeamName,
  theme,
  teamColors,
  isDarkMode,
}: GoldCupGroupsProps) {
  
  // Gold Cup Group Stage Data (Groups A through D)
  // 4 groups with 4 teams each (16 teams total)
  // Placeholders will be replaced with real API data
  const groupsData: GroupData[] = [
    {
      group: "Group A",
      teams: [
        { pos: 1, flag: "🏴", team: "Team 1", mp: 3, w: 2, d: 1, l: 0, gf: 5, ga: 2, pts: 7, status: "promoted" },
        { pos: 2, flag: "🏴", team: "Team 2", mp: 3, w: 2, d: 1, l: 0, gf: 6, ga: 4, pts: 7, status: "promoted" },
        { pos: 3, flag: "🏴", team: "Team 3", mp: 3, w: 0, d: 1, l: 2, gf: 3, ga: 5, pts: 1 },
        { pos: 4, flag: "🏴", team: "Team 4", mp: 3, w: 0, d: 1, l: 2, gf: 3, ga: 6, pts: 1 },
      ],
    },
    {
      group: "Group B",
      teams: [
        { pos: 1, flag: "🏴", team: "Team 1", mp: 3, w: 2, d: 1, l: 0, gf: 9, ga: 1, pts: 7, status: "promoted" },
        { pos: 2, flag: "🏴", team: "Team 2", mp: 3, w: 2, d: 0, l: 1, gf: 4, ga: 7, pts: 6, status: "promoted" },
        { pos: 3, flag: "🏴", team: "Team 3", mp: 3, w: 0, d: 2, l: 1, gf: 2, ga: 3, pts: 2 },
        { pos: 4, flag: "🏴", team: "Team 4", mp: 3, w: 0, d: 1, l: 2, gf: 0, ga: 4, pts: 1 },
      ],
    },
    {
      group: "Group C",
      teams: [
        { pos: 1, flag: "🏴", team: "Team 1", mp: 3, w: 3, d: 0, l: 0, gf: 10, ga: 3, pts: 9, status: "promoted" },
        { pos: 2, flag: "🏴", team: "Team 2", mp: 3, w: 2, d: 0, l: 1, gf: 4, ga: 3, pts: 6, status: "promoted" },
        { pos: 3, flag: "🏴", team: "Team 3", mp: 3, w: 1, d: 0, l: 2, gf: 3, ga: 6, pts: 3 },
        { pos: 4, flag: "🏴", team: "Team 4", mp: 3, w: 0, d: 0, l: 3, gf: 5, ga: 10, pts: 0 },
      ],
    },
    {
      group: "Group D",
      teams: [
        { pos: 1, flag: "🏴", team: "Team 1", mp: 3, w: 3, d: 0, l: 0, gf: 8, ga: 1, pts: 9, status: "promoted" },
        { pos: 2, flag: "🏴", team: "Team 2", mp: 3, w: 1, d: 1, l: 1, gf: 2, ga: 2, pts: 4, status: "promoted" },
        { pos: 3, flag: "🏴", team: "Team 3", mp: 3, w: 0, d: 2, l: 1, gf: 2, ga: 7, pts: 2 },
        { pos: 4, flag: "🏴", team: "Team 4", mp: 3, w: 0, d: 1, l: 2, gf: 2, ga: 4, pts: 1 },
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
          CONCACAF Gold Cup - Group Stage
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          4 Groups (A-D) • 4 Teams per Group • Top 2 Teams Advance to Quarter-Finals
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
          The CONCACAF Gold Cup is the main association football competition of the men's national football teams governed by CONCACAF, determining the continental champion of North America, Central America, and the Caribbean. The Gold Cup is held every two years.
          {"\n\n"}
          <Text style={{ fontWeight: "bold" }}>Competition Format:</Text>
          {"\n\n"}
          <Text style={{ fontWeight: "bold" }}>Group Stage:</Text> The tournament begins with a group stage featuring 16 teams divided into 4 groups (A, B, C, D) of 4 teams each. Each team plays three matches in a round-robin format within their group.
          {"\n\n"}
          Teams earn 3 points for a win, 1 point for a draw, and 0 points for a loss.
          {"\n\n"}
          <Text style={{ fontWeight: "bold" }}>Group Stage Ranking Rules:</Text>
          {"\n"}
          If two or more teams are equal on points, the following tiebreaker criteria are applied:
          {"\n"}
          1. Goal difference
          {"\n"}
          2. Goals scored
          {"\n"}
          3. Head-to-head points
          {"\n"}
          4. Head-to-head goal difference
          {"\n"}
          5. Head-to-head goals scored
          {"\n"}
          6. Fair play points
          {"\n"}
          7. Drawing of lots
          {"\n\n"}
          <Text style={{ fontWeight: "bold" }}>Knockout Stage:</Text> The top 2 teams from each group (8 teams total) advance to the quarter-finals. The knockout stage consists of quarter-finals, semi-finals, and the final, with all matches being single-elimination. If a knockout match is tied after 90 minutes, it goes to extra time and, if necessary, a penalty shootout.
          {"\n\n"}
          <Text style={{ fontWeight: "bold" }}>Tournament Structure:</Text>
          {"\n"}
          - Group Stage: 4 groups × 4 teams = 16 teams
          {"\n"}
          - Quarter-Finals: Top 2 from each group = 8 teams
          {"\n"}
          - Semi-Finals: 4 teams
          {"\n"}
          - Final: 2 teams compete for the championship
          {"\n\n"}
          <Text style={{ fontWeight: "bold" }}>Participating Countries:</Text> The Gold Cup features teams from CONCACAF member associations, including countries from North America (USA, Canada, Mexico), Central America, and the Caribbean nations. The tournament winner represents CONCACAF at the FIFA Confederations Cup (when held).
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

