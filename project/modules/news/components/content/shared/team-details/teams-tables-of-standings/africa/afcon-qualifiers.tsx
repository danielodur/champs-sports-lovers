/**
 * AFCON Qualifiers Table Template
 * Africa Cup of Nations Qualification Standings
 * 
 * This is a TABLE TEMPLATE that appears inside the Table tab of news-team-details-table.tsx
 * It displays AFCON Qualification standings (Group A to Group L - 12 groups).
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
  group: string; // Group A, B, C, D, E, F, G, H, I, J, K, L
  teams: TeamStanding[];
}

interface AfconQualifiersProps {
  currentTeamName: string;
  theme: any;
  teamColors: { primary: string; secondary: string };
  isDarkMode: boolean;
}

export default function AfconQualifiers({
  currentTeamName,
  theme,
  teamColors,
  isDarkMode,
}: AfconQualifiersProps) {
  
  // AFCON Qualifiers Data (Groups A to L) - 12 groups with placeholders
  // These will be replaced with real API data when available
  const groupsData: GroupData[] = [
    {
      group: "Group A",
      teams: [
        { pos: 1, flag: "🏴", team: "Team 1", mp: 6, w: 3, d: 3, l: 0, gf: 7, ga: 4, pts: 12, status: "promoted" },
        { pos: 2, flag: "🏴", team: "Team 2", mp: 6, w: 3, d: 1, l: 2, gf: 7, ga: 6, pts: 10 },
        { pos: 3, flag: "🏴", team: "Team 3", mp: 6, w: 2, d: 2, l: 2, gf: 6, ga: 6, pts: 8 },
        { pos: 4, flag: "🏴", team: "Team 4", mp: 6, w: 0, d: 2, l: 4, gf: 4, ga: 8, pts: 2 },
      ],
    },
    {
      group: "Group B",
      teams: [
        { pos: 1, flag: "🏴", team: "Team 1", mp: 6, w: 6, d: 0, l: 0, gf: 26, ga: 2, pts: 18, status: "promoted" },
        { pos: 2, flag: "🏴", team: "Team 2", mp: 6, w: 3, d: 1, l: 2, gf: 7, ga: 9, pts: 10 },
        { pos: 3, flag: "🏴", team: "Team 3", mp: 6, w: 1, d: 1, l: 4, gf: 2, ga: 13, pts: 4 },
        { pos: 4, flag: "🏴", team: "Team 4", mp: 6, w: 1, d: 0, l: 5, gf: 3, ga: 14, pts: 3 },
      ],
    },
    {
      group: "Group C",
      teams: [
        { pos: 1, flag: "🏴", team: "Team 1", mp: 6, w: 4, d: 2, l: 0, gf: 12, ga: 2, pts: 14, status: "promoted" },
        { pos: 2, flag: "🏴", team: "Team 2", mp: 6, w: 2, d: 2, l: 2, gf: 4, ga: 7, pts: 8 },
        { pos: 3, flag: "🏴", team: "Team 3", mp: 6, w: 2, d: 1, l: 3, gf: 3, ga: 6, pts: 7 },
        { pos: 4, flag: "🏴", team: "Team 4", mp: 6, w: 1, d: 1, l: 4, gf: 3, ga: 7, pts: 4 },
      ],
    },
    {
      group: "Group D",
      teams: [
        { pos: 1, flag: "🏴", team: "Team 1", mp: 6, w: 3, d: 2, l: 1, gf: 9, ga: 3, pts: 11, status: "promoted" },
        { pos: 2, flag: "🏴", team: "Team 2", mp: 6, w: 2, d: 2, l: 2, gf: 7, ga: 7, pts: 8 },
        { pos: 3, flag: "🏴", team: "Team 3", mp: 6, w: 2, d: 2, l: 2, gf: 5, ga: 7, pts: 8 },
        { pos: 4, flag: "🏴", team: "Team 4", mp: 6, w: 1, d: 2, l: 3, gf: 3, ga: 7, pts: 5 },
      ],
    },
    {
      group: "Group E",
      teams: [
        { pos: 1, flag: "🏴", team: "Team 1", mp: 6, w: 5, d: 1, l: 0, gf: 16, ga: 2, pts: 16, status: "promoted" },
        { pos: 2, flag: "🏴", team: "Team 2", mp: 6, w: 2, d: 2, l: 2, gf: 5, ga: 8, pts: 8 },
        { pos: 3, flag: "🏴", team: "Team 3", mp: 6, w: 1, d: 2, l: 3, gf: 7, ga: 10, pts: 5 },
        { pos: 4, flag: "🏴", team: "Team 4", mp: 6, w: 1, d: 1, l: 4, gf: 4, ga: 12, pts: 4 },
      ],
    },
    {
      group: "Group F",
      teams: [
        { pos: 1, flag: "🏴", team: "Team 1", mp: 6, w: 4, d: 2, l: 0, gf: 7, ga: 2, pts: 14, status: "promoted" },
        { pos: 2, flag: "🏴", team: "Team 2", mp: 6, w: 2, d: 2, l: 2, gf: 4, ga: 6, pts: 8 },
        { pos: 3, flag: "🏴", team: "Team 3", mp: 6, w: 2, d: 1, l: 3, gf: 7, ga: 6, pts: 7 },
        { pos: 4, flag: "🏴", team: "Team 4", mp: 6, w: 0, d: 3, l: 3, gf: 3, ga: 7, pts: 3 },
      ],
    },
    {
      group: "Group G",
      teams: [
        { pos: 1, flag: "🏴", team: "Team 1", mp: 6, w: 4, d: 1, l: 1, gf: 7, ga: 4, pts: 13, status: "promoted" },
        { pos: 2, flag: "🏴", team: "Team 2", mp: 6, w: 4, d: 0, l: 2, gf: 12, ga: 3, pts: 12 },
        { pos: 3, flag: "🏴", team: "Team 3", mp: 6, w: 1, d: 2, l: 3, gf: 5, ga: 10, pts: 5 },
        { pos: 4, flag: "🏴", team: "Team 4", mp: 6, w: 0, d: 3, l: 3, gf: 1, ga: 8, pts: 3 },
      ],
    },
    {
      group: "Group H",
      teams: [
        { pos: 1, flag: "🏴", team: "Team 1", mp: 6, w: 4, d: 0, l: 2, gf: 7, ga: 3, pts: 12, status: "promoted" },
        { pos: 2, flag: "🏴", team: "Team 2", mp: 6, w: 3, d: 1, l: 2, gf: 5, ga: 4, pts: 10 },
        { pos: 3, flag: "🏴", team: "Team 3", mp: 6, w: 3, d: 0, l: 3, gf: 9, ga: 5, pts: 9 },
        { pos: 4, flag: "🏴", team: "Team 4", mp: 6, w: 1, d: 1, l: 4, gf: 3, ga: 12, pts: 4 },
      ],
    },
    {
      group: "Group I",
      teams: [
        { pos: 1, flag: "🏴", team: "Team 1", mp: 6, w: 4, d: 2, l: 0, gf: 10, ga: 1, pts: 14, status: "promoted" },
        { pos: 2, flag: "🏴", team: "Team 2", mp: 6, w: 3, d: 2, l: 1, gf: 9, ga: 5, pts: 11 },
        { pos: 3, flag: "🏴", team: "Team 3", mp: 6, w: 1, d: 2, l: 3, gf: 4, ga: 6, pts: 5 },
        { pos: 4, flag: "🏴", team: "Team 4", mp: 6, w: 0, d: 2, l: 4, gf: 2, ga: 13, pts: 2 },
      ],
    },
    {
      group: "Group J",
      teams: [
        { pos: 1, flag: "🏴", team: "Team 1", mp: 6, w: 4, d: 2, l: 0, gf: 8, ga: 2, pts: 14, status: "promoted" },
        { pos: 2, flag: "🏴", team: "Team 2", mp: 6, w: 2, d: 3, l: 1, gf: 6, ga: 4, pts: 9 },
        { pos: 3, flag: "🏴", team: "Team 3", mp: 6, w: 1, d: 3, l: 2, gf: 4, ga: 7, pts: 6 },
        { pos: 4, flag: "🏴", team: "Team 4", mp: 6, w: 0, d: 2, l: 4, gf: 2, ga: 7, pts: 2 },
      ],
    },
    {
      group: "Group K",
      teams: [
        { pos: 1, flag: "🏴", team: "Team 1", mp: 6, w: 4, d: 2, l: 0, gf: 16, ga: 5, pts: 14, status: "promoted" },
        { pos: 2, flag: "🏴", team: "Team 2", mp: 6, w: 4, d: 1, l: 1, gf: 8, ga: 5, pts: 13 },
        { pos: 3, flag: "🏴", team: "Team 3", mp: 6, w: 1, d: 1, l: 4, gf: 4, ga: 12, pts: 4 },
        { pos: 4, flag: "🏴", team: "Team 4", mp: 6, w: 1, d: 0, l: 5, gf: 6, ga: 12, pts: 3 },
      ],
    },
    {
      group: "Group L",
      teams: [
        { pos: 1, flag: "🏴", team: "Team 1", mp: 6, w: 5, d: 1, l: 0, gf: 10, ga: 1, pts: 16, status: "promoted" },
        { pos: 2, flag: "🏴", team: "Team 2", mp: 6, w: 3, d: 1, l: 2, gf: 10, ga: 7, pts: 10 },
        { pos: 3, flag: "🏴", team: "Team 3", mp: 6, w: 1, d: 1, l: 4, gf: 6, ga: 11, pts: 4 },
        { pos: 4, flag: "🏴", team: "Team 4", mp: 6, w: 1, d: 1, l: 4, gf: 4, ga: 11, pts: 4 },
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
          Africa Cup of Nations - Qualifiers
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          12 Groups (A-L) • 4 Teams per Group • Top Team Qualifies
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
                {team.status && (
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          team.status === "promoted"
                            ? "#FF6B6B"
                            : "#FFA07A",
                      },
                    ]}
                  >
                    <Text style={styles.statusBadgeText}>
                      {team.status === "promoted" ? "PROMOTED" : "PLAYOFF"}
                    </Text>
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
          Important Notice
        </Text>
        <Text
          style={[styles.noticeText, { color: theme.colors.textSecondary }]}
        >
          The Africa Cup of Nations Qualifiers feature 48 teams divided into 12 groups (A-L) with 4 teams each.
          {"\n\n"}
          • The top team from each group qualifies directly for AFCON (12 teams total).
          {"\n"}
          • The 13 best runners-up across all groups also qualify.
          {"\n"}
          • Total of 24 teams qualify for the AFCON tournament.
          {"\n"}
          • Teams are ranked by points, then goal difference, then goals scored.
          {"\n"}
          • In case of a tie, head-to-head records are considered.
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

