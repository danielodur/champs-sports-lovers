/**
 * FIFA Stage 3 AFC Qualifiers Table Template
 * 2026 FIFA World Cup Asian Zone Stage 3 Qualifiers
 * 
 * This is a TABLE TEMPLATE that appears inside the Table tab of news-team-details-table.tsx
 * It displays AFC Stage 3 Qualifiers standings (Group A, Group B, and Group C).
 * 
 * Stage 3 features 18 teams from Stage 2 divided into 3 groups of 6 teams each.
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
  group: string; // Group A, B, C
  teams: TeamStanding[];
}

interface FIFAStage3QualifiersProps {
  currentTeamName: string;
  theme: any;
  teamColors: { primary: string; secondary: string };
  isDarkMode: boolean;
}

export default function FIFAStage3Qualifiers({
  currentTeamName,
  theme,
  teamColors,
  isDarkMode,
}: FIFAStage3QualifiersProps) {
  
  // Stage 3 AFC Qualifiers Data (Groups A, B, and C) - 3 groups with 6 teams each
  // 18 teams from Stage 2 competing for Stage 4 spots
  // Placeholders will be replaced with real API data
  const groupsData: GroupData[] = [
    {
      group: "Group A",
      teams: [
        { pos: 1, flag: "🏴", team: "Team 1", mp: 10, w: 7, d: 2, l: 1, gf: 19, ga: 8, pts: 23, status: "promoted" },
        { pos: 2, flag: "🏴", team: "Team 2", mp: 10, w: 6, d: 3, l: 1, gf: 14, ga: 7, pts: 21 },
        { pos: 3, flag: "🏴", team: "Team 3", mp: 10, w: 4, d: 3, l: 3, gf: 15, ga: 8, pts: 15, status: "playoff" },
        { pos: 4, flag: "🏴", team: "Team 4", mp: 10, w: 4, d: 1, l: 5, gf: 17, ga: 24, pts: 13 },
        { pos: 5, flag: "🏴", team: "Team 5", mp: 10, w: 2, d: 2, l: 6, gf: 12, ga: 18, pts: 8 },
        { pos: 6, flag: "🏴", team: "Team 6", mp: 10, w: 0, d: 3, l: 7, gf: 9, ga: 21, pts: 3 },
      ],
    },
    {
      group: "Group B",
      teams: [
        { pos: 1, flag: "🏴", team: "Team 1", mp: 10, w: 6, d: 4, l: 0, gf: 20, ga: 7, pts: 22, status: "promoted" },
        { pos: 2, flag: "🏴", team: "Team 2", mp: 10, w: 4, d: 4, l: 2, gf: 16, ga: 8, pts: 16 },
        { pos: 3, flag: "🏴", team: "Team 3", mp: 10, w: 4, d: 3, l: 3, gf: 9, ga: 9, pts: 15, status: "playoff" },
        { pos: 4, flag: "🏴", team: "Team 4", mp: 10, w: 3, d: 2, l: 5, gf: 9, ga: 14, pts: 11 },
        { pos: 5, flag: "🏴", team: "Team 5", mp: 10, w: 2, d: 4, l: 4, gf: 10, ga: 13, pts: 10 },
        { pos: 6, flag: "🏴", team: "Team 6", mp: 10, w: 0, d: 5, l: 5, gf: 7, ga: 20, pts: 5 },
      ],
    },
    {
      group: "Group C",
      teams: [
        { pos: 1, flag: "🏴", team: "Team 1", mp: 10, w: 7, d: 2, l: 1, gf: 30, ga: 3, pts: 23, status: "promoted" },
        { pos: 2, flag: "🏴", team: "Team 2", mp: 10, w: 5, d: 4, l: 1, gf: 16, ga: 7, pts: 19 },
        { pos: 3, flag: "🏴", team: "Team 3", mp: 10, w: 3, d: 4, l: 3, gf: 7, ga: 8, pts: 13, status: "playoff" },
        { pos: 4, flag: "🏴", team: "Team 4", mp: 10, w: 3, d: 3, l: 4, gf: 9, ga: 20, pts: 12 },
        { pos: 5, flag: "🏴", team: "Team 5", mp: 10, w: 3, d: 0, l: 7, gf: 7, ga: 20, pts: 9 },
        { pos: 6, flag: "🏴", team: "Team 6", mp: 10, w: 1, d: 3, l: 6, gf: 5, ga: 16, pts: 6 },
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
          2026 FIFA World Cup - AFC Stage 3 Qualifiers
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          3 Groups (A-C) • 6 Teams per Group • Top Teams Advance to Stage 4
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
          <Text style={{ fontWeight: "bold" }}>Stage 3 Team Ranking Rules:</Text>
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
          <Text style={{ fontWeight: "bold" }}>Stage 4:</Text> The 6 teams from Stage 3 (3rd and 4th place) are divided into 2 groups of 3 teams each. Each team plays against the other teams in their group in a single round-robin format. The top team from each group qualifies directly for the 2026 FIFA World Cup, while the runners-up advance to Stage 5. Saudi Arabia and Qatar will host the Stage 4 matches.
          {"\n\n"}
          <Text style={{ fontWeight: "bold" }}>Stage 5:</Text> The two runners-up from Stage 4 play a two-leg home-and-away playoff, with the winner representing Asia in the intercontinental playoff for the 2026 FIFA World Cup.
          {"\n\n"}
          All 46 FIFA member teams under AFC are eligible to participate in the 2026 FIFA World Cup External Qualifiers. Among them, teams belonging to the AFC but not FIFA (Northern Mariana Islands) will directly participate in the 2027 AFC Asian Cup External Qualifiers playoff round, but the AFC will exclude Northern Mariana Islands from the draw. The AFC's FIFA World Ranking at the time of the draw will be used to determine which teams need to participate in Stage 1. The seeding for Stage 2 and Stage 3 draws will use the updated FIFA World Rankings.
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

