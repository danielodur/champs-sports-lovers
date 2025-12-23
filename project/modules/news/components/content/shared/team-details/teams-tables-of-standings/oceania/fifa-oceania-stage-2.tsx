/**
 * FIFA OFC Stage 2 Qualifiers Table Template
 * 2026 FIFA World Cup OFC Zone Stage 2 Qualifiers
 * 
 * This is a TABLE TEMPLATE for OFC Stage 2 Qualifiers.
 * It displays OFC Stage 2 Qualifiers standings (Groups A and B).
 * 
 * Stage 2 features teams divided into 2 groups.
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
  group: string; // Group A, B
  teams: TeamStanding[];
}

interface FIFAOceaniaStage2Props {
  currentTeamName: string;
  theme: any;
  teamColors: { primary: string; secondary: string };
  isDarkMode: boolean;
}

export default function FIFAOceaniaStage2({
  currentTeamName,
  theme,
  teamColors,
  isDarkMode,
}: FIFAOceaniaStage2Props) {
  
  // Stage 2 OFC Qualifiers Data (Groups A and B)
  // Based on Chinese screenshot showing 2 groups with 4 teams each
  // Placeholders will be replaced with real API data
  const groupsData: GroupData[] = [
    {
      group: "Group A",
      teams: [
        { pos: 1, flag: "🏴", team: "New Caledonia", mp: 3, w: 2, d: 1, l: 0, gf: 7, ga: 4, pts: 7, status: "promoted" },
        { pos: 2, flag: "🏴", team: "Fiji", mp: 3, w: 1, d: 2, l: 0, gf: 5, ga: 4, pts: 5 },
        { pos: 3, flag: "🏴", team: "Solomon Islands", mp: 3, w: 1, d: 0, l: 2, gf: 4, ga: 5, pts: 3 },
        { pos: 4, flag: "🏴", team: "Papua New Guinea", mp: 3, w: 0, d: 1, l: 2, gf: 5, ga: 8, pts: 1 },
      ],
    },
    {
      group: "Group B",
      teams: [
        { pos: 1, flag: "🇳🇿", team: "New Zealand", mp: 3, w: 3, d: 0, l: 0, gf: 19, ga: 1, pts: 9, status: "promoted" },
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
          2026 FIFA World Cup - OFC Stage 2 Qualifiers
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          2 Groups (A-B) • 4 Teams per Group • Top Team Advances
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
          <Text style={{ fontWeight: "bold" }}>2026 FIFA World Cup OFC Zone Qualifiers</Text>
          {"\n\n"}
          The OFC (Oceania Football Confederation) has a total of 3 qualification stages. Oceania has one direct World Cup spot and one intercontinental playoff spot.
          {"\n\n"}
          <Text style={{ fontWeight: "bold" }}>Stage 2 Format:</Text>
          {"\n\n"}
          OFC teams ranked 1-7 plus the Stage 1 winner are divided into 2 groups of 4 teams each. Groups play single round-robin matches. The top team from each group advances to Stage 3.
          {"\n\n"}
          <Text style={{ fontWeight: "bold" }}>Qualification Rules:</Text>
          {"\n"}
          • Teams earn 3 points for a win, 1 point for a draw, and 0 points for a loss
          {"\n"}
          • Top team from each group advances to Stage 3 (final stage)
          {"\n"}
          • Stage 3 winner directly qualifies for the 2026 FIFA World Cup
          {"\n"}
          • Stage 3 runner-up advances to intercontinental playoff
          {"\n\n"}
          <Text style={{ fontWeight: "bold" }}>Tiebreaker Criteria:</Text>
          {"\n"}
          1. Goal difference
          {"\n"}
          2. Goals scored
          {"\n"}
          3. Head-to-head results
          {"\n"}
          4. Fair play points
          {"\n"}
          5. Drawing of lots
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

