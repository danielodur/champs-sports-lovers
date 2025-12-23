/**
 * OFC Oceania Cup Table Template
 * OFC Men's Nations Cup - Group Stage
 * 
 * This is a TABLE TEMPLATE for the OFC Oceania Cup (OFC Men's Nations Cup).
 * It displays OFC Oceania Cup Group Stage standings (Groups A and B).
 * 
 * The OFC Oceania Cup features teams from Oceania in a group stage format.
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
  status?: "qualified" | "normal"; // Qualification status
  highlight?: boolean; // Highlight current team
}

interface GroupData {
  group: string; // Group A, B
  teams: TeamStanding[];
}

interface OceaniaCupProps {
  currentTeamName: string;
  theme: any;
  teamColors: { primary: string; secondary: string };
  isDarkMode: boolean;
}

export default function OceaniaCup({
  currentTeamName,
  theme,
  teamColors,
  isDarkMode,
}: OceaniaCupProps) {
  
  // OFC Oceania Cup Group Stage Data
  // Based on Chinese screenshot showing Group A and Group B with 4 teams each
  // Placeholders will be replaced with real API data
  const groupsData: GroupData[] = [
    {
      group: "Group A",
      teams: [
        { pos: 1, flag: "🇳🇿", team: "New Zealand", mp: 2, w: 2, d: 0, l: 0, gf: 7, ga: 0, pts: 6, status: "qualified" },
        { pos: 2, flag: "🏴", team: "Vanuatu", mp: 2, w: 1, d: 0, l: 1, gf: 1, ga: 4, pts: 3 },
        { pos: 3, flag: "🏴", team: "Solomon Islands", mp: 2, w: 0, d: 0, l: 2, gf: 0, ga: 4, pts: 0 },
        { pos: 4, flag: "🏴", team: "New Caledonia", mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
      ],
    },
    {
      group: "Group B",
      teams: [
        { pos: 1, flag: "🏴", team: "Fiji", mp: 3, w: 3, d: 0, l: 0, gf: 15, ga: 2, pts: 9, status: "qualified" },
        { pos: 2, flag: "🏴", team: "Tahiti", mp: 3, w: 2, d: 0, l: 1, gf: 5, ga: 3, pts: 6 },
        { pos: 3, flag: "🏴", team: "Vanuatu", mp: 3, w: 1, d: 0, l: 2, gf: 5, ga: 11, pts: 3 },
        { pos: 4, flag: "🏴", team: "Samoa", mp: 3, w: 0, d: 0, l: 3, gf: 1, ga: 15, pts: 0 },
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
          OFC Men's Nations Cup - Group Stage
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          2 Groups (A-B) • 4 Teams per Group • Top Teams Advance
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
          <Text style={{ fontWeight: "bold" }}>OFC Men's Nations Cup (Oceania Cup)</Text>
          {"\n\n"}
          The OFC Men's Nations Cup, also known as the Oceania Cup, is the main international football competition for men's national teams in the Oceania region. The tournament is organized by the Oceania Football Confederation (OFC).
          {"\n\n"}
          <Text style={{ fontWeight: "bold" }}>Tournament Format:</Text>
          {"\n\n"}
          <Text style={{ fontWeight: "bold" }}>Group Stage:</Text> Teams are divided into groups and play in a round-robin format within their group. Each team plays against all other teams in their group.
          {"\n\n"}
          <Text style={{ fontWeight: "bold" }}>Points System:</Text>
          {"\n"}
          • Teams earn 3 points for a win
          {"\n"}
          • Teams earn 1 point for a draw
          {"\n"}
          • Teams earn 0 points for a loss
          {"\n\n"}
          <Text style={{ fontWeight: "bold" }}>Ranking Rules:</Text>
          {"\n"}
          If two or more teams have equal points, the following tiebreaker criteria are applied:
          {"\n"}
          1. Goal difference (goals scored minus goals conceded)
          {"\n"}
          2. Total goals scored
          {"\n"}
          3. Head-to-head results between tied teams
          {"\n"}
          4. Head-to-head goal difference
          {"\n"}
          5. Head-to-head goals scored
          {"\n"}
          6. Fair play points
          {"\n"}
          7. Drawing of lots by FIFA
          {"\n\n"}
          <Text style={{ fontWeight: "bold" }}>Knockout Stage:</Text> The top teams from each group advance to the knockout stage, which includes quarter-finals, semi-finals, and the final. All knockout matches are single-elimination. If a match is tied after 90 minutes, it goes to extra time and, if necessary, a penalty shootout.
          {"\n\n"}
          <Text style={{ fontWeight: "bold" }}>Participating Teams:</Text> The tournament features national teams from OFC member countries, including New Zealand, Fiji, New Caledonia, Papua New Guinea, Tahiti, Solomon Islands, Vanuatu, Samoa, and other Pacific island nations.
          {"\n\n"}
          <Text style={{ fontWeight: "bold" }}>Tournament Significance:</Text> The OFC Nations Cup winner represents Oceania in various international competitions and qualifies for the FIFA Confederations Cup (when held).
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

