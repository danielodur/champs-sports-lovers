/**
 * AFCON Championships Table Template
 * Africa Cup of Nations Championship/Tournament Group Stage
 * 
 * This is a TABLE TEMPLATE that appears inside the Table tab of news-team-details-table.tsx
 * It displays AFCON Championship Group Stage standings (Group A to Group D - 4 groups).
 * 
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
  status?: "promoted" | "playoff" | "normal"; // Qualification status
  highlight?: boolean; // Highlight current team
}

interface GroupData {
  group: string; // Group A, B, C, D
  teams: TeamStanding[];
}

interface AfconChampionshipsProps {
  currentTeamName: string;
  theme: any;
  teamColors: { primary: string; secondary: string };
  isDarkMode: boolean;
}

export default function AfconChampionships({
  currentTeamName,
  theme,
  teamColors,
  isDarkMode,
}: AfconChampionshipsProps) {
  
  // AFCON Championships Data (Groups A to D) - 4 groups with 5 teams each
  // These placeholders will be replaced with real API data when available
  const groupsData: GroupData[] = [
    {
      group: "Group A",
      teams: [
        { pos: 1, flag: "🏴", team: "Team 1", mp: 4, w: 3, d: 1, l: 0, gf: 4, ga: 1, pts: 10 },
        { pos: 2, flag: "🏴", team: "Team 2", mp: 4, w: 3, d: 0, l: 1, gf: 8, ga: 3, pts: 9 },
        { pos: 3, flag: "🏴", team: "Team 3", mp: 4, w: 2, d: 0, l: 2, gf: 5, ga: 4, pts: 6 },
        { pos: 4, flag: "🏴", team: "Team 4", mp: 4, w: 1, d: 1, l: 2, gf: 3, ga: 6, pts: 4 },
        { pos: 5, flag: "🏴", team: "Team 5", mp: 4, w: 0, d: 0, l: 4, gf: 2, ga: 8, pts: 0 },
      ],
    },
    {
      group: "Group B",
      teams: [
        { pos: 1, flag: "🏴", team: "Team 1", mp: 4, w: 3, d: 1, l: 0, gf: 5, ga: 1, pts: 10 },
        { pos: 2, flag: "🏴", team: "Team 2", mp: 4, w: 2, d: 1, l: 1, gf: 5, ga: 3, pts: 7 },
        { pos: 3, flag: "🏴", team: "Team 3", mp: 4, w: 2, d: 1, l: 1, gf: 2, ga: 1, pts: 7 },
        { pos: 4, flag: "🏴", team: "Team 4", mp: 4, w: 1, d: 0, l: 3, gf: 5, ga: 7, pts: 3 },
        { pos: 5, flag: "🏴", team: "Team 5", mp: 4, w: 0, d: 1, l: 3, gf: 2, ga: 7, pts: 1 },
      ],
    },
    {
      group: "Group C",
      teams: [
        { pos: 1, flag: "🏴", team: "Team 1", mp: 4, w: 2, d: 1, l: 1, gf: 8, ga: 6, pts: 7 },
        { pos: 2, flag: "🏴", team: "Team 2", mp: 4, w: 1, d: 3, l: 0, gf: 5, ga: 2, pts: 6 },
        { pos: 3, flag: "🏴", team: "Team 3", mp: 4, w: 1, d: 3, l: 0, gf: 6, ga: 5, pts: 6 },
        { pos: 4, flag: "🏴", team: "Team 4", mp: 4, w: 1, d: 1, l: 2, gf: 3, ga: 6, pts: 4 },
        { pos: 5, flag: "🏴", team: "Team 5", mp: 4, w: 0, d: 2, l: 2, gf: 0, ga: 3, pts: 2 },
      ],
    },
    {
      group: "Group D",
      teams: [
        { pos: 1, flag: "🏴", team: "Team 1", mp: 3, w: 1, d: 2, l: 0, gf: 5, ga: 1, pts: 5 },
        { pos: 2, flag: "🏴", team: "Team 2", mp: 3, w: 1, d: 2, l: 0, gf: 2, ga: 1, pts: 5 },
        { pos: 3, flag: "🏴", team: "Team 3", mp: 3, w: 1, d: 0, l: 2, gf: 2, ga: 5, pts: 3 },
        { pos: 4, flag: "🏴", team: "Team 4", mp: 3, w: 0, d: 2, l: 1, gf: 2, ga: 4, pts: 2 },
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
          Africa Cup of Nations - Championship Groups
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          4 Groups (A-D) • 5 Teams per Group • Top 2 + Best 3rd Place Teams Advance
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
            const isQualified = team.pos <= 2; // Top 2 qualify

            return (
              <View key={index} style={styles.rowWrapper}>
                {/* Qualification Indicator for top 2 */}
                {isQualified && (
                  <View
                    style={[
                      styles.qualificationIndicator,
                      { backgroundColor: teamColors.primary },
                    ]}
                  />
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
                      { 
                        color: isQualified 
                          ? teamColors.primary 
                          : theme.colors.textSecondary,
                        fontWeight: isQualified ? "bold" : "500",
                      },
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
                          : isQualified
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

      {/* Legend */}
      <View
        style={[
          styles.legendContainer,
          { backgroundColor: theme.colors.backgroundSecondary },
        ]}
      >
        <Text style={[styles.legendTitle, { color: theme.colors.text }]}>
          Qualification Legend
        </Text>
        <View style={styles.legendItem}>
          <View style={[styles.legendIndicator, { backgroundColor: teamColors.primary }]} />
          <Text style={[styles.legendText, { color: theme.colors.textSecondary }]}>
            Top 2 teams advance to Round of 16
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendIndicator, { backgroundColor: "#FFA07A" }]} />
          <Text style={[styles.legendText, { color: theme.colors.textSecondary }]}>
            4 best 3rd place teams also advance
          </Text>
        </View>
      </View>

      {/* Important Notice */}
      <View
        style={[
          styles.noticeContainer,
          { backgroundColor: theme.colors.backgroundSecondary },
        ]}
      >
        <Text style={[styles.noticeTitle, { color: teamColors.primary }]}>
          Important Notice
        </Text>
        <Text
          style={[styles.noticeText, { color: theme.colors.textSecondary }]}
        >
          The Africa Cup of Nations Championship features 24 qualified teams divided into 4 groups (A-D) with 5-6 teams each.
          {"\n\n"}
          <Text style={{ fontWeight: "bold" }}>Advancement Rules:</Text>
          {"\n"}
          • The top 2 teams from each group (8 teams) advance to the Round of 16.
          {"\n"}
          • The 4 best 3rd-place teams across all groups also advance.
          {"\n"}
          • Total of 16 teams proceed to the knockout stage.
          {"\n\n"}
          <Text style={{ fontWeight: "bold" }}>Ranking Criteria:</Text>
          {"\n"}
          1. Points (3 for win, 1 for draw, 0 for loss)
          {"\n"}
          2. Goal difference
          {"\n"}
          3. Goals scored
          {"\n"}
          4. Head-to-head record
          {"\n"}
          5. Fair play points
          {"\n"}
          6. Drawing of lots
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
  qualificationIndicator: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    zIndex: 5,
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
  legendContainer: {
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  legendIndicator: {
    width: 20,
    height: 3,
    marginRight: 12,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 13,
    flex: 1,
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

