/**
 * UEFA Nations League Group A Template
 * UEFA Nations League - League A
 * 
 * This is a TABLE TEMPLATE that appears inside the Table tab of news-team-details-table.tsx
 * It displays UEFA Nations League Group A standings (Groups A through D).
 * 
 * League A features the top European teams divided into 4 groups.
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
  status?: "promoted" | "playoff-relegation" | "relegated" | "normal"; // Qualification status
  highlight?: boolean; // Highlight current team
}

interface GroupData {
  group: string; // Group A through D
  teams: TeamStanding[];
}

interface UEFANationsLeagueGroupAProps {
  currentTeamName: string;
  theme: any;
  teamColors: { primary: string; secondary: string };
  isDarkMode: boolean;
}

export default function UEFANationsLeagueGroupA({
  currentTeamName,
  theme,
  teamColors,
  isDarkMode,
}: UEFANationsLeagueGroupAProps) {
  
  // UEFA Nations League Group A Data (Groups A through D)
  // 4 groups with 4 teams each (League A - top tier)
  // Placeholders will be replaced with real API data
  const groupsData: GroupData[] = [
    {
      group: "Group A",
      teams: [
        { pos: 1, flag: "🏴", team: "Team 1", mp: 6, w: 4, d: 2, l: 0, gf: 13, ga: 5, pts: 14, status: "promoted" },
        { pos: 2, flag: "🏴", team: "Team 2", mp: 6, w: 2, d: 2, l: 2, gf: 8, ga: 8, pts: 8 },
        { pos: 3, flag: "🏴", team: "Team 3", mp: 6, w: 2, d: 1, l: 3, gf: 7, ga: 8, pts: 7, status: "playoff-relegation" },
        { pos: 4, flag: "🏴", team: "Team 4", mp: 6, w: 1, d: 1, l: 4, gf: 9, ga: 16, pts: 4, status: "relegated" },
      ],
    },
    {
      group: "Group B",
      teams: [
        { pos: 1, flag: "🏴", team: "Team 1", mp: 6, w: 4, d: 1, l: 1, gf: 12, ga: 6, pts: 13, status: "promoted" },
        { pos: 2, flag: "🏴", team: "Team 2", mp: 6, w: 4, d: 1, l: 1, gf: 13, ga: 8, pts: 13 },
        { pos: 3, flag: "🏴", team: "Team 3", mp: 6, w: 1, d: 1, l: 4, gf: 6, ga: 9, pts: 4, status: "playoff-relegation" },
        { pos: 4, flag: "🏴", team: "Team 4", mp: 6, w: 1, d: 1, l: 4, gf: 5, ga: 13, pts: 4, status: "relegated" },
      ],
    },
    {
      group: "Group C",
      teams: [
        { pos: 1, flag: "🏴", team: "Team 1", mp: 6, w: 4, d: 2, l: 0, gf: 18, ga: 4, pts: 14, status: "promoted" },
        { pos: 2, flag: "🏴", team: "Team 2", mp: 6, w: 2, d: 3, l: 1, gf: 13, ga: 7, pts: 9 },
        { pos: 3, flag: "🏴", team: "Team 3", mp: 6, w: 1, d: 3, l: 2, gf: 4, ga: 11, pts: 6, status: "playoff-relegation" },
        { pos: 4, flag: "🏴", team: "Team 4", mp: 6, w: 0, d: 2, l: 4, gf: 4, ga: 17, pts: 2, status: "relegated" },
      ],
    },
    {
      group: "Group D",
      teams: [
        { pos: 1, flag: "🏴", team: "Team 1", mp: 6, w: 5, d: 1, l: 0, gf: 13, ga: 4, pts: 16, status: "promoted" },
        { pos: 2, flag: "🏴", team: "Team 2", mp: 6, w: 2, d: 2, l: 2, gf: 7, ga: 5, pts: 8 },
        { pos: 3, flag: "🏴", team: "Team 3", mp: 6, w: 1, d: 3, l: 2, gf: 3, ga: 6, pts: 6, status: "playoff-relegation" },
        { pos: 4, flag: "🏴", team: "Team 4", mp: 6, w: 0, d: 2, l: 4, gf: 6, ga: 14, pts: 2, status: "relegated" },
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
          UEFA Nations League - League A
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          4 Groups (A-D) • 4 Teams per Group • Top Teams Qualify for Quarter-Finals
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
                        backgroundColor:
                          team.status === "promoted"
                            ? "#FF6B6B"
                            : team.status === "playoff-relegation"
                            ? "#A0A0A0"
                            : "#808080",
                      },
                    ]}
                  >
                    <Text style={styles.statusBadgeText}>
                      {team.status === "promoted"
                        ? "PROMOTED"
                        : team.status === "playoff-relegation"
                        ? "RELEGATION PLAYOFF"
                        : "RELEGATED"}
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
          Competition Overview
        </Text>
        <Text
          style={[styles.noticeText, { color: theme.colors.textSecondary }]}
        >
          <Text style={{ fontWeight: "bold" }}>UEFA Nations League</Text>
          {"\n\n"}
          <Text style={{ fontWeight: "bold" }}>Group Stage</Text>
          {"\n\n"}
          The Nations League is divided into four leagues: A, B, C, and D
          {"\n\n"}
          Each league contains 4 groups, with each group having 4 teams (except League D which has only 2 groups, with each group having only 3 teams).
          {"\n\n"}
          1. Win = 3 points, Draw = 1 point, Loss = 0 points
          {"\n\n"}
          2. If two or more teams have equal points, the following tiebreaker criteria are applied:
          {"\n"}
          {"  "}a) Head-to-head points
          {"\n"}
          {"  "}b) Head-to-head goal difference
          {"\n"}
          {"  "}c) Head-to-head goals scored
          {"\n"}
          {"  "}d) Head-to-head away goals scored
          {"\n"}
          {"  "}e) Group stage total points
          {"\n"}
          {"  "}f) Group stage goal difference
          {"\n"}
          {"  "}g) Group stage goals scored
          {"\n"}
          {"  "}h) Group stage away goals scored
          {"\n"}
          {"  "}i) Group stage wins
          {"\n"}
          {"  "}j) Group stage away wins
          {"\n"}
          {"  "}k) Group stage fair play points
          {"\n"}
          {"  "}l) UEFA coefficient ranking
          {"\n\n"}
          <Text style={{ fontWeight: "bold" }}>Promotion and Relegation System:</Text>
          {"\n\n"}
          1. League A: The top 2 teams from each of the 4 groups qualify for the quarter-finals, with the winners advancing to the finals.
          {"\n\n"}
          2. Leagues B, C, and D: The first-place team in each group can be promoted to the next higher league. The last-place team in Leagues A and B is relegated to the next lower league. The two worst-performing teams in League C are relegated to League D.
          {"\n\n"}
          3. The third-place teams from the 4 groups in League A and the second-place teams from the 4 groups in League B participate in promotion/relegation playoffs.
          {"\n\n"}
          The third-place teams from the 4 groups in League B and the second-place teams from the 4 groups in League C participate in promotion/relegation playoffs.
          {"\n\n"}
          The two best-performing fourth-place teams from League C and the second-place teams from the 2 groups in League D participate in promotion/relegation playoffs.
          {"\n\n"}
          <Text style={{ fontWeight: "bold" }}>European Cup Qualification:</Text>
          {"\n\n"}
          The top 12 teams from the Nations League with the best overall performance will qualify for the European Cup playoffs (teams in higher leagues take priority over teams in lower leagues). If teams at the same level have already secured direct qualification or playoff spots, the next best team is selected.
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

