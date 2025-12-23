/**
 * CONCACAF Champions Cup Table Template
 * CONCACAF Champions Cup - Group Stage
 * 
 * This is a TABLE TEMPLATE that appears inside the FIFA CONCACAF tab system.
 * It displays CONCACAF Champions Cup Group Stage standings.
 * 
 * The CONCACAF Champions Cup (formerly CONCACAF Champions League) is the premier club competition in CONCACAF.
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
  flag: string; // Country flag emoji (club's country)
  team: string;
  mp: number; // Matches Played
  w: number; // Wins
  d: number; // Draws
  l: number; // Losses
  gf: number; // Goals For
  ga: number; // Goals Against
  pts: number; // Points
  status?: "qualified" | "normal"; // Qualification status
  highlight?: boolean; // Highlight current team
}

interface GroupData {
  group: string; // Group A, B, C, etc.
  teams: TeamStanding[];
}

interface CONCACAFChampionsCupProps {
  currentTeamName: string;
  theme: any;
  teamColors: { primary: string; secondary: string };
  isDarkMode: boolean;
}

export default function CONCACAFChampionsCup({
  currentTeamName,
  theme,
  teamColors,
  isDarkMode,
}: CONCACAFChampionsCupProps) {
  
  // CONCACAF Champions Cup Group Stage Data
  // Typically 5 groups with 4 teams each (20 teams total)
  // Placeholders will be replaced with real API data
  const groupsData: GroupData[] = [
    {
      group: "Group A",
      teams: [
        { pos: 1, flag: "🏴", team: "Club 1", mp: 4, w: 2, d: 2, l: 0, gf: 7, ga: 1, pts: 8, status: "qualified" },
        { pos: 2, flag: "🏴", team: "Club 2", mp: 4, w: 2, d: 1, l: 1, gf: 9, ga: 4, pts: 7, status: "qualified" },
        { pos: 3, flag: "🏴", team: "Club 3", mp: 4, w: 2, d: 1, l: 1, gf: 5, ga: 5, pts: 7 },
        { pos: 4, flag: "🏴", team: "Club 4", mp: 4, w: 1, d: 2, l: 1, gf: 4, ga: 5, pts: 5 },
        { pos: 5, flag: "🏴", team: "Club 5", mp: 4, w: 1, d: 1, l: 2, gf: 4, ga: 7, pts: 4 },
        { pos: 6, flag: "🏴", team: "Club 6", mp: 4, w: 0, d: 1, l: 3, gf: 4, ga: 10, pts: 1 },
      ],
    },
    {
      group: "Group B",
      teams: [
        { pos: 1, flag: "🏴", team: "Club 1", mp: 4, w: 2, d: 2, l: 0, gf: 8, ga: 4, pts: 8, status: "qualified" },
        { pos: 2, flag: "🏴", team: "Club 2", mp: 4, w: 2, d: 1, l: 1, gf: 8, ga: 4, pts: 7, status: "qualified" },
        { pos: 3, flag: "🏴", team: "Club 3", mp: 4, w: 2, d: 1, l: 1, gf: 5, ga: 5, pts: 7 },
        { pos: 4, flag: "🏴", team: "Club 4", mp: 4, w: 1, d: 1, l: 2, gf: 2, ga: 2, pts: 4 },
        { pos: 5, flag: "🏴", team: "Club 5", mp: 4, w: 0, d: 3, l: 1, gf: 4, ga: 10, pts: 3 },
        { pos: 6, flag: "🏴", team: "Club 6", mp: 4, w: 0, d: 2, l: 2, gf: 2, ga: 4, pts: 2 },
      ],
    },
    {
      group: "Group C",
      teams: [
        { pos: 1, flag: "🏴", team: "Club 1", mp: 4, w: 4, d: 0, l: 0, gf: 15, ga: 2, pts: 12, status: "qualified" },
        { pos: 2, flag: "🏴", team: "Club 2", mp: 4, w: 2, d: 0, l: 2, gf: 4, ga: 3, pts: 6, status: "qualified" },
        { pos: 3, flag: "🏴", team: "Club 3", mp: 4, w: 1, d: 1, l: 2, gf: 3, ga: 6, pts: 4 },
        { pos: 4, flag: "🏴", team: "Club 4", mp: 4, w: 1, d: 1, l: 2, gf: 1, ga: 9, pts: 4 },
        { pos: 5, flag: "🏴", team: "Club 5", mp: 4, w: 1, d: 0, l: 3, gf: 1, ga: 4, pts: 3 },
        { pos: 6, flag: "🏴", team: "Club 6", mp: 4, w: 0, d: 0, l: 4, gf: 5, ga: 10, pts: 0 },
      ],
    },
    {
      group: "Group D",
      teams: [
        { pos: 1, flag: "🏴", team: "Club 1", mp: 4, w: 3, d: 0, l: 1, gf: 8, ga: 1, pts: 9, status: "qualified" },
        { pos: 2, flag: "🏴", team: "Club 2", mp: 4, w: 1, d: 1, l: 2, gf: 2, ga: 2, pts: 4, status: "qualified" },
        { pos: 3, flag: "🏴", team: "Club 3", mp: 4, w: 0, d: 2, l: 2, gf: 2, ga: 7, pts: 2 },
        { pos: 4, flag: "🏴", team: "Club 4", mp: 4, w: 0, d: 1, l: 3, gf: 2, ga: 4, pts: 1 },
        { pos: 5, flag: "🏴", team: "Club 5", mp: 4, w: 1, d: 2, l: 1, gf: 5, ga: 7, pts: 5 },
        { pos: 6, flag: "🏴", team: "Club 6", mp: 4, w: 2, d: 0, l: 2, gf: 8, ga: 4, pts: 6 },
      ],
    },
    {
      group: "Group E",
      teams: [
        { pos: 1, flag: "🏴", team: "Club 1", mp: 4, w: 3, d: 1, l: 0, gf: 10, ga: 3, pts: 10, status: "qualified" },
        { pos: 2, flag: "🏴", team: "Club 2", mp: 4, w: 2, d: 2, l: 0, gf: 4, ga: 7, pts: 8, status: "qualified" },
        { pos: 3, flag: "🏴", team: "Club 3", mp: 4, w: 1, d: 0, l: 3, gf: 5, ga: 5, pts: 3 },
        { pos: 4, flag: "🏴", team: "Club 4", mp: 4, w: 1, d: 1, l: 2, gf: 3, ga: 10, pts: 4 },
        { pos: 5, flag: "🏴", team: "Club 5", mp: 4, w: 0, d: 1, l: 3, gf: 1, ga: 4, pts: 1 },
        { pos: 6, flag: "🏴", team: "Club 6", mp: 4, w: 1, d: 1, l: 2, gf: 4, ga: 6, pts: 4 },
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
          CONCACAF Champions Cup - Group Stage
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          5 Groups • Top 2 Teams Advance to Round of 16
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
                        backgroundColor: "#4CAF50",
                      },
                    ]}
                  >
                    <Text style={styles.statusBadgeText}>QUALIFIED</Text>
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
          The CONCACAF Champions Cup (formerly CONCACAF Champions League) is the annual continental club football competition organized by CONCACAF. It is the premier club tournament in North America, Central America, and the Caribbean. The competition determines the best club team in the CONCACAF region.
          {"\n\n"}
          <Text style={{ fontWeight: "bold" }}>Competition Format:</Text>
          {"\n\n"}
          <Text style={{ fontWeight: "bold" }}>Group Stage:</Text> The tournament begins with a group stage featuring teams divided into multiple groups. Each team plays against all other teams in their group in a round-robin format. Teams earn 3 points for a win, 1 point for a draw, and 0 points for a loss.
          {"\n\n"}
          <Text style={{ fontWeight: "bold" }}>Qualification Rules:</Text> The top 2 teams from each group advance to the Round of 16 knockout stage. Group rankings are determined by:
          {"\n"}
          1. Total points earned
          {"\n"}
          2. Goal difference (goals scored minus goals conceded)
          {"\n"}
          3. Total goals scored
          {"\n"}
          4. Head-to-head results between tied teams
          {"\n"}
          5. Head-to-head goal difference
          {"\n"}
          6. Head-to-head away goals scored
          {"\n"}
          7. Fair play points
          {"\n"}
          8. Drawing of lots
          {"\n\n"}
          <Text style={{ fontWeight: "bold" }}>Knockout Stage:</Text> After the group stage, the competition continues with a knockout format consisting of Round of 16, Quarter-Finals, Semi-Finals, and the Final. All knockout matches are played over two legs (home and away), with aggregate score determining the winner. If the aggregate score is tied, away goals rule applies, followed by extra time and penalty shootout if necessary.
          {"\n\n"}
          <Text style={{ fontWeight: "bold" }}>Participating Teams:</Text> The competition features the top club teams from CONCACAF member associations, including champions and top-finishing clubs from domestic leagues across North America (USA, Canada, Mexico), Central America, and Caribbean nations.
          {"\n\n"}
          <Text style={{ fontWeight: "bold" }}>Tournament Winner:</Text> The CONCACAF Champions Cup winner represents CONCACAF at the FIFA Club World Cup and earns the right to compete against the best club teams from other confederations around the world.
          {"\n\n"}
          This table uses placeholder data (Club 1, Club 2, etc.) which will be replaced with actual club names when real match data is available through the API.
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

