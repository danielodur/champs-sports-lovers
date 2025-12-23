/**
 * FIFA Stage 2 AFC Qualifiers Table Template
 * 2026 FIFA World Cup Asian Zone Stage 2 Qualifiers
 * 
 * This is a TABLE TEMPLATE that appears inside the Table tab of news-team-details-table.tsx
 * It displays AFC Stage 2 Qualifiers standings (Group A through Group I).
 * 
 * Stage 2 features 36 teams (ranked 1-25 + 11 Stage 1 winners) divided into 9 groups of 4 teams each.
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
  group: string; // Group A through I
  teams: TeamStanding[];
}

interface FIFAStage2QualifiersProps {
  currentTeamName: string;
  theme: any;
  teamColors: { primary: string; secondary: string };
  isDarkMode: boolean;
}

export default function FIFAStage2Qualifiers({
  currentTeamName,
  theme,
  teamColors,
  isDarkMode,
}: FIFAStage2QualifiersProps) {
  
  // Stage 2 AFC Qualifiers Data (Groups A through I) - 9 groups with 4 teams each
  // 36 teams competing for Stage 3 spots (top 2 from each group advance)
  // Placeholders will be replaced with real API data
  const groupsData: GroupData[] = [
    {
      group: "Group A",
      teams: [
        { pos: 1, flag: "🏴", team: "Team 1", mp: 6, w: 5, d: 1, l: 0, gf: 18, ga: 3, pts: 16, status: "promoted" },
        { pos: 2, flag: "🏴", team: "Team 2", mp: 6, w: 2, d: 1, l: 3, gf: 6, ga: 6, pts: 7, status: "promoted" },
        { pos: 3, flag: "🏴", team: "Team 3", mp: 6, w: 1, d: 2, l: 3, gf: 3, ga: 7, pts: 5 },
        { pos: 4, flag: "🏴", team: "Team 4", mp: 6, w: 1, d: 2, l: 3, gf: 3, ga: 14, pts: 5 },
      ],
    },
    {
      group: "Group B",
      teams: [
        { pos: 1, flag: "🏴", team: "Team 1", mp: 6, w: 6, d: 0, l: 0, gf: 24, ga: 0, pts: 18, status: "promoted" },
        { pos: 2, flag: "🏴", team: "Team 2", mp: 6, w: 3, d: 0, l: 3, gf: 11, ga: 7, pts: 9, status: "promoted" },
        { pos: 3, flag: "🏴", team: "Team 3", mp: 6, w: 2, d: 1, l: 3, gf: 9, ga: 12, pts: 7 },
        { pos: 4, flag: "🏴", team: "Team 4", mp: 6, w: 0, d: 1, l: 5, gf: 3, ga: 28, pts: 1 },
      ],
    },
    {
      group: "Group C",
      teams: [
        { pos: 1, flag: "🏴", team: "Team 1", mp: 6, w: 5, d: 1, l: 0, gf: 20, ga: 1, pts: 16, status: "promoted" },
        { pos: 2, flag: "🏴", team: "Team 2", mp: 6, w: 2, d: 2, l: 2, gf: 9, ga: 9, pts: 8, status: "promoted" },
        { pos: 3, flag: "🏴", team: "Team 3", mp: 6, w: 2, d: 2, l: 2, gf: 9, ga: 9, pts: 8 },
        { pos: 4, flag: "🏴", team: "Team 4", mp: 6, w: 0, d: 1, l: 5, gf: 5, ga: 24, pts: 1 },
      ],
    },
    {
      group: "Group D",
      teams: [
        { pos: 1, flag: "🏴", team: "Team 1", mp: 6, w: 4, d: 1, l: 1, gf: 11, ga: 2, pts: 13, status: "promoted" },
        { pos: 2, flag: "🏴", team: "Team 2", mp: 6, w: 3, d: 2, l: 1, gf: 13, ga: 7, pts: 11, status: "promoted" },
        { pos: 3, flag: "🏴", team: "Team 3", mp: 6, w: 3, d: 1, l: 2, gf: 9, ga: 9, pts: 10 },
        { pos: 4, flag: "🏴", team: "Team 4", mp: 6, w: 0, d: 0, l: 6, gf: 2, ga: 17, pts: 0 },
      ],
    },
    {
      group: "Group E",
      teams: [
        { pos: 1, flag: "🏴", team: "Team 1", mp: 6, w: 4, d: 2, l: 0, gf: 16, ga: 4, pts: 14, status: "promoted" },
        { pos: 2, flag: "🏴", team: "Team 2", mp: 6, w: 4, d: 2, l: 0, gf: 13, ga: 4, pts: 14, status: "promoted" },
        { pos: 3, flag: "🏴", team: "Team 3", mp: 6, w: 0, d: 2, l: 4, gf: 4, ga: 14, pts: 2 },
        { pos: 4, flag: "🏴", team: "Team 4", mp: 6, w: 0, d: 2, l: 4, gf: 4, ga: 15, pts: 2 },
      ],
    },
    {
      group: "Group F",
      teams: [
        { pos: 1, flag: "🏴", team: "Team 1", mp: 6, w: 6, d: 0, l: 0, gf: 17, ga: 2, pts: 18, status: "promoted" },
        { pos: 2, flag: "🏴", team: "Team 2", mp: 6, w: 3, d: 1, l: 2, gf: 8, ga: 8, pts: 10, status: "promoted" },
        { pos: 3, flag: "🏴", team: "Team 3", mp: 6, w: 2, d: 0, l: 4, gf: 6, ga: 10, pts: 6 },
        { pos: 4, flag: "🏴", team: "Team 4", mp: 6, w: 0, d: 1, l: 5, gf: 3, ga: 14, pts: 1 },
      ],
    },
    {
      group: "Group G",
      teams: [
        { pos: 1, flag: "🏴", team: "Team 1", mp: 6, w: 4, d: 1, l: 1, gf: 16, ga: 4, pts: 13, status: "promoted" },
        { pos: 2, flag: "🏴", team: "Team 2", mp: 6, w: 4, d: 1, l: 1, gf: 12, ga: 3, pts: 13, status: "promoted" },
        { pos: 3, flag: "🏴", team: "Team 3", mp: 6, w: 2, d: 2, l: 2, gf: 11, ga: 7, pts: 8 },
        { pos: 4, flag: "🏴", team: "Team 4", mp: 6, w: 0, d: 0, l: 6, gf: 1, ga: 26, pts: 0 },
      ],
    },
    {
      group: "Group H",
      teams: [
        { pos: 1, flag: "🏴", team: "Team 1", mp: 6, w: 5, d: 1, l: 0, gf: 16, ga: 2, pts: 16, status: "promoted" },
        { pos: 2, flag: "🏴", team: "Team 2", mp: 6, w: 3, d: 2, l: 1, gf: 11, ga: 3, pts: 11, status: "promoted" },
        { pos: 3, flag: "🏴", team: "Team 3", mp: 6, w: 1, d: 2, l: 3, gf: 5, ga: 9, pts: 5 },
        { pos: 4, flag: "🏴", team: "Team 4", mp: 6, w: 0, d: 1, l: 5, gf: 2, ga: 20, pts: 1 },
      ],
    },
    {
      group: "Group I",
      teams: [
        { pos: 1, flag: "🏴", team: "Team 1", mp: 6, w: 6, d: 0, l: 0, gf: 22, ga: 0, pts: 18, status: "promoted" },
        { pos: 2, flag: "🏴", team: "Team 2", mp: 6, w: 2, d: 2, l: 2, gf: 6, ga: 6, pts: 8, status: "promoted" },
        { pos: 3, flag: "🏴", team: "Team 3", mp: 6, w: 1, d: 3, l: 2, gf: 5, ga: 8, pts: 6 },
        { pos: 4, flag: "🏴", team: "Team 4", mp: 6, w: 0, d: 1, l: 5, gf: 1, ga: 20, pts: 1 },
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
          2026 FIFA World Cup - AFC Stage 2 Qualifiers
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          9 Groups (A-I) • 4 Teams per Group • Top 2 Teams Advance to Stage 3
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
          The 2026 FIFA World Cup Asian Zone External Qualifiers is the qualifying competition for AFC member countries to secure spots in the 2026 FIFA World Cup. The Asian zone has a total of 8.5 qualifying spots (8 direct spots and 1 intercontinental playoff spot).
          {"\n\n"}
          The external qualifiers consist of five stages, with the first two stages also serving as part of the 2027 AFC Asian Cup External Qualifiers.
          {"\n\n"}
          <Text style={{ fontWeight: "bold" }}>Competition Format:</Text>
          {"\n\n"}
          <Text style={{ fontWeight: "bold" }}>Stage 1:</Text> 22 teams (ranked 26-47) compete in home-and-away knockout format. The 11 winning teams advance to Stage 2.
          {"\n\n"}
          <Text style={{ fontWeight: "bold" }}>Stage 2:</Text> 36 teams (ranked 1-25 + Stage 1 winners) are divided into 9 groups of 4 teams each. Teams play home-and-away round-robin matches. The top 2 teams from each group (18 teams total) advance to Stage 3, along with direct qualification to the 2027 AFC Asian Cup.
          {"\n\n"}
          <Text style={{ fontWeight: "bold" }}>Stage 3:</Text> 18 teams from Stage 2 are divided into 3 groups of 6 teams each. Teams play home-and-away round-robin matches. The top 2 teams from each group (6 teams total) advance to Stage 4.
          {"\n\n"}
          <Text style={{ fontWeight: "bold" }}>Stage 2 Team Ranking Rules:</Text>
          {"\n"}
          a) Total points
          {"\n"}
          b) Goal difference
          {"\n"}
          c) Goals scored
          {"\n"}
          d) Head-to-head points
          {"\n"}
          e) Head-to-head goal difference
          {"\n"}
          f) Head-to-head goals scored
          {"\n"}
          g) Away goals scored
          {"\n"}
          h) Fair play points
          {"\n"}
          {"    "}First yellow card: -1 point
          {"\n"}
          {"    "}Second yellow card / indirect red card: -3 points
          {"\n"}
          {"    "}Direct red card: -4 points
          {"\n"}
          {"    "}One yellow card plus direct red card: -5 points
          {"\n"}
          i) FIFA draw
          {"\n\n"}
          <Text style={{ fontWeight: "bold" }}>Stage 4:</Text> The 6 teams from Stage 3 are divided into 2 groups of 3 teams each. Each team plays against the other teams in their group in a single round-robin format. The top team from each group qualifies directly for the 2026 FIFA World Cup, while the runners-up advance to Stage 5.
          {"\n\n"}
          <Text style={{ fontWeight: "bold" }}>Stage 5:</Text> The two runners-up from Stage 4 play a two-leg home-and-away playoff, with the winner representing Asia in the intercontinental playoff for the 2026 FIFA World Cup.
          {"\n\n"}
          All 46 FIFA member teams under AFC are eligible to participate in the 2026 FIFA World Cup External Qualifiers. Among them, teams belonging to the AFC but not FIFA (Northern Mariana Islands) will directly participate in the 2027 AFC Asian Cup External Qualifiers playoff round.
          {"\n\n"}
          <Text style={{ fontWeight: "bold" }}>Teams Qualified for World Cup:</Text> Iran, Uzbekistan, South Korea, Jordan, Japan, Australia, Qatar, Saudi Arabia
          {"\n\n"}
          <Text style={{ fontWeight: "bold" }}>Teams in Intercontinental Playoffs:</Text> Palestine
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

