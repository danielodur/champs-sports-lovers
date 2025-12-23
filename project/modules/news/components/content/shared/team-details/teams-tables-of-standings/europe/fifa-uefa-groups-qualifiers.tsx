/**
 * FIFA UEFA World Cup Qualifiers - Group Stage Template
 * 2026 FIFA World Cup UEFA Zone Qualifiers
 * 
 * This is a TABLE TEMPLATE that appears inside the Table tab of news-team-details-table.tsx
 * It displays UEFA World Cup Qualifiers Group Stage standings (Groups A through L).
 * 
 * This template features 12 groups with 4-5 teams each competing for World Cup spots.
 * The template is detected and filtered based on the team's current competition.
 * It does NOT affect the hero section or team logo (those are in news-team-details.tsx).
 */

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import UEFANationsLeagueGroupA from "./uefa-nations-league-group-a";

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
  group: string; // Group A through L
  teams: TeamStanding[];
}

interface FIFAUEFAGroupsQualifiersProps {
  currentTeamName: string;
  theme: any;
  teamColors: { primary: string; secondary: string };
  isDarkMode: boolean;
}

export default function FIFAUEFAGroupsQualifiers({
  currentTeamName,
  theme,
  teamColors,
  isDarkMode,
}: FIFAUEFAGroupsQualifiersProps) {
  const [selectedTab, setSelectedTab] = useState("fifa-uefa-groups");

  // UEFA World Cup Qualifiers Group Stage Data (Groups A through L)
  // 12 groups with 4-5 teams each
  // Placeholders will be replaced with real API data
  const groupsData: GroupData[] = [
    {
      group: "Group A",
      teams: [
        { pos: 1, flag: "🏴", team: "Team 1", mp: 4, w: 3, d: 0, l: 1, gf: 8, ga: 3, pts: 9, status: "promoted" },
        { pos: 2, flag: "🏴", team: "Team 2", mp: 4, w: 3, d: 0, l: 1, gf: 5, ga: 2, pts: 9, status: "playoff" },
        { pos: 3, flag: "🏴", team: "Team 3", mp: 4, w: 2, d: 0, l: 2, gf: 6, ga: 5, pts: 6 },
        { pos: 4, flag: "🏴", team: "Team 4", mp: 4, w: 0, d: 0, l: 4, gf: 1, ga: 10, pts: 0 },
      ],
    },
    {
      group: "Group B",
      teams: [
        { pos: 1, flag: "🏴", team: "Team 1", mp: 4, w: 3, d: 1, l: 0, gf: 9, ga: 0, pts: 10, status: "promoted" },
        { pos: 2, flag: "🏴", team: "Team 2", mp: 4, w: 2, d: 1, l: 1, gf: 3, ga: 4, pts: 7, status: "playoff" },
        { pos: 3, flag: "🏴", team: "Team 3", mp: 4, w: 0, d: 3, l: 1, gf: 2, ga: 5, pts: 3 },
        { pos: 4, flag: "🏴", team: "Team 4", mp: 4, w: 0, d: 1, l: 3, gf: 2, ga: 7, pts: 1 },
      ],
    },
    {
      group: "Group C",
      teams: [
        { pos: 1, flag: "🏴", team: "Team 1", mp: 4, w: 3, d: 1, l: 0, gf: 12, ga: 1, pts: 10, status: "promoted" },
        { pos: 2, flag: "🏴", team: "Team 2", mp: 4, w: 3, d: 1, l: 0, gf: 7, ga: 2, pts: 10, status: "playoff" },
        { pos: 3, flag: "🏴", team: "Team 3", mp: 4, w: 1, d: 0, l: 3, gf: 7, ga: 10, pts: 3 },
        { pos: 4, flag: "🏴", team: "Team 4", mp: 4, w: 0, d: 0, l: 4, gf: 2, ga: 15, pts: 0 },
      ],
    },
    {
      group: "Group D",
      teams: [
        { pos: 1, flag: "🏴", team: "Team 1", mp: 4, w: 3, d: 1, l: 0, gf: 9, ga: 3, pts: 10, status: "promoted" },
        { pos: 2, flag: "🏴", team: "Team 2", mp: 4, w: 2, d: 1, l: 1, gf: 8, ga: 7, pts: 7, status: "playoff" },
        { pos: 3, flag: "🏴", team: "Team 3", mp: 4, w: 1, d: 1, l: 2, gf: 4, ga: 5, pts: 4 },
        { pos: 4, flag: "🏴", team: "Team 4", mp: 4, w: 0, d: 1, l: 3, gf: 2, ga: 11, pts: 1 },
      ],
    },
    {
      group: "Group E",
      teams: [
        { pos: 1, flag: "🏴", team: "Team 1", mp: 4, w: 4, d: 0, l: 0, gf: 15, ga: 0, pts: 12, status: "promoted" },
        { pos: 2, flag: "🏴", team: "Team 2", mp: 4, w: 3, d: 0, l: 1, gf: 13, ga: 10, pts: 9, status: "playoff" },
        { pos: 3, flag: "🏴", team: "Team 3", mp: 4, w: 1, d: 0, l: 3, gf: 6, ga: 9, pts: 3 },
        { pos: 4, flag: "🏴", team: "Team 4", mp: 4, w: 0, d: 0, l: 4, gf: 1, ga: 16, pts: 0 },
      ],
    },
    {
      group: "Group F",
      teams: [
        { pos: 1, flag: "🏴", team: "Team 1", mp: 4, w: 3, d: 1, l: 0, gf: 11, ga: 4, pts: 10, status: "promoted" },
        { pos: 2, flag: "🏴", team: "Team 2", mp: 4, w: 1, d: 2, l: 1, gf: 8, ga: 7, pts: 5, status: "playoff" },
        { pos: 3, flag: "🏴", team: "Team 3", mp: 4, w: 1, d: 1, l: 2, gf: 4, ga: 5, pts: 4 },
        { pos: 4, flag: "🏴", team: "Team 4", mp: 4, w: 1, d: 0, l: 3, gf: 2, ga: 9, pts: 3 },
      ],
    },
    {
      group: "Group G",
      teams: [
        { pos: 1, flag: "🏴", team: "Team 1", mp: 6, w: 5, d: 1, l: 0, gf: 22, ga: 3, pts: 16, status: "promoted" },
        { pos: 2, flag: "🏴", team: "Team 2", mp: 6, w: 4, d: 1, l: 1, gf: 10, ga: 4, pts: 13, status: "playoff" },
        { pos: 3, flag: "🏴", team: "Team 3", mp: 7, w: 3, d: 1, l: 3, gf: 8, ga: 13, pts: 10 },
        { pos: 4, flag: "🏴", team: "Team 4", mp: 7, w: 0, d: 3, l: 4, gf: 6, ga: 11, pts: 3 },
        { pos: 5, flag: "🏴", team: "Team 5", mp: 6, w: 0, d: 2, l: 4, gf: 1, ga: 16, pts: 2 },
      ],
    },
    {
      group: "Group H",
      teams: [
        { pos: 1, flag: "🏴", team: "Team 1", mp: 6, w: 5, d: 0, l: 1, gf: 19, ga: 3, pts: 15, status: "promoted" },
        { pos: 2, flag: "🏴", team: "Team 2", mp: 6, w: 4, d: 1, l: 1, gf: 13, ga: 5, pts: 13, status: "playoff" },
        { pos: 3, flag: "🏴", team: "Team 3", mp: 6, w: 3, d: 1, l: 2, gf: 11, ga: 6, pts: 10 },
        { pos: 4, flag: "🏴", team: "Team 4", mp: 6, w: 2, d: 2, l: 3, gf: 11, ga: 9, pts: 8 },
        { pos: 5, flag: "🏴", team: "Team 5", mp: 6, w: 0, d: 0, l: 7, gf: 1, ga: 32, pts: 0 },
      ],
    },
    {
      group: "Group I",
      teams: [
        { pos: 1, flag: "🏴", team: "Team 1", mp: 6, w: 6, d: 0, l: 0, gf: 29, ga: 3, pts: 18, status: "promoted" },
        { pos: 2, flag: "🏴", team: "Team 2", mp: 6, w: 5, d: 0, l: 1, gf: 18, ga: 8, pts: 15, status: "playoff" },
        { pos: 3, flag: "🏴", team: "Team 3", mp: 7, w: 3, d: 0, l: 4, gf: 15, ga: 19, pts: 9 },
        { pos: 4, flag: "🏴", team: "Team 4", mp: 7, w: 1, d: 1, l: 5, gf: 7, ga: 17, pts: 4 },
        { pos: 5, flag: "🏴", team: "Team 5", mp: 6, w: 0, d: 1, l: 5, gf: 4, ga: 26, pts: 1 },
      ],
    },
    {
      group: "Group J",
      teams: [
        { pos: 1, flag: "🏴", team: "Team 1", mp: 6, w: 4, d: 2, l: 0, gf: 21, ga: 6, pts: 14, status: "promoted" },
        { pos: 2, flag: "🏴", team: "Team 2", mp: 7, w: 3, d: 4, l: 0, gf: 12, ga: 3, pts: 13, status: "playoff" },
        { pos: 3, flag: "🏴", team: "Team 3", mp: 6, w: 3, d: 1, l: 2, gf: 13, ga: 10, pts: 10 },
        { pos: 4, flag: "🏴", team: "Team 4", mp: 7, w: 2, d: 1, l: 4, gf: 8, ga: 12, pts: 7 },
        { pos: 5, flag: "🏴", team: "Team 5", mp: 6, w: 0, d: 0, l: 6, gf: 0, ga: 23, pts: 0 },
      ],
    },
    {
      group: "Group K",
      teams: [
        { pos: 1, flag: "🏴", team: "Team 1", mp: 6, w: 6, d: 0, l: 0, gf: 18, ga: 0, pts: 18, status: "promoted" },
        { pos: 2, flag: "🏴", team: "Team 2", mp: 6, w: 3, d: 2, l: 1, gf: 6, ga: 3, pts: 11, status: "playoff" },
        { pos: 3, flag: "🏴", team: "Team 3", mp: 6, w: 3, d: 1, l: 2, gf: 7, ga: 7, pts: 10 },
        { pos: 4, flag: "🏴", team: "Team 4", mp: 7, w: 1, d: 2, l: 4, gf: 4, ga: 13, pts: 5 },
        { pos: 5, flag: "🏴", team: "Team 5", mp: 7, w: 0, d: 1, l: 6, gf: 3, ga: 15, pts: 1 },
      ],
    },
    {
      group: "Group L",
      teams: [
        { pos: 1, flag: "🏴", team: "Team 1", mp: 6, w: 5, d: 1, l: 0, gf: 20, ga: 1, pts: 16, status: "promoted" },
        { pos: 2, flag: "🏴", team: "Team 2", mp: 7, w: 4, d: 1, l: 2, gf: 12, ga: 8, pts: 13, status: "playoff" },
        { pos: 3, flag: "🏴", team: "Team 3", mp: 7, w: 4, d: 0, l: 3, gf: 10, ga: 6, pts: 12 },
        { pos: 4, flag: "🏴", team: "Team 4", mp: 6, w: 2, d: 0, l: 4, gf: 4, ga: 13, pts: 6 },
        { pos: 5, flag: "🏴", team: "Team 5", mp: 6, w: 0, d: 0, l: 6, gf: 2, ga: 20, pts: 0 },
      ],
    },
  ];

  const renderGroupStageContent = () => {
    return (
      <ScrollView
        style={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <View style={styles.headerContainer}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            2026 FIFA World Cup - UEFA Zone Qualifiers
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            12 Groups (A-L) • 4-5 Teams per Group • Top Team Direct Qualification
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
            The FIFA World Cup UEFA Zone Qualifiers determine which European teams qualify for the FIFA World Cup. Europe has a total of 16 World Cup qualifying spots.
            {"\n\n"}
            <Text style={{ fontWeight: "bold" }}>Competition Format:</Text>
            {"\n\n"}
            <Text style={{ fontWeight: "bold" }}>Group Stage Ranking Rules:</Text>
            {"\n"}
            1. Win = 3 points, Draw = 1 point, Loss = 0 points
            {"\n"}
            2. At the end of the group stage, teams with more points are ranked higher
            {"\n"}
            3. If two or more teams have equal points, the following tiebreaker criteria are applied:
            {"\n"}
            {"  "}a) Goal difference
            {"\n"}
            {"  "}b) Goals scored
            {"\n"}
            {"  "}c) Head-to-head record (points, goal difference, goals scored, away goals in head-to-head matches)
            {"\n\n"}
            <Text style={{ fontWeight: "bold" }}>World Cup Qualification Rules:</Text>
            {"\n\n"}
            Europe has a total of 16 World Cup qualifying spots. The top team from each of the 12 groups directly qualifies for the 2026 FIFA World Cup (12 direct spots). The 12 group runners-up plus the 4 best-performing teams from the UEFA Nations League that did not directly qualify or make the playoffs are drawn into 4 independent groups. After semifinals and finals (both single-leg matches), the final 4 teams secure the remaining 4 World Cup qualifying spots. Semifinals are played at the home venue of the higher-ranked team, and the final venue is determined by draw.
            {"\n\n"}
            <Text style={{ fontWeight: "bold" }}>Teams Qualified for World Cup:</Text> England
            {"\n\n"}
            This table uses placeholder data (Team 1, Team 2, etc.) which will be replaced with actual team names when real match data is available through the API.
          </Text>
        </View>
      </ScrollView>
    );
  };

  const renderUEFANationsLeagueContent = () => {
    return (
      <UEFANationsLeagueGroupA
        currentTeamName={currentTeamName}
        theme={theme}
        teamColors={teamColors}
        isDarkMode={isDarkMode}
      />
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Tab Navigation */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            selectedTab === "fifa-uefa-groups" && styles.activeTabButton,
            selectedTab === "fifa-uefa-groups" && { borderBottomColor: teamColors.primary },
          ]}
          onPress={() => setSelectedTab("fifa-uefa-groups")}
        >
          <Text
            style={[
              styles.tabButtonText,
              { color: selectedTab === "fifa-uefa-groups" ? teamColors.primary : theme.colors.textSecondary },
            ]}
          >
            FIFA UEFA Group Stages
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            selectedTab === "uefa-nations-league" && styles.activeTabButton,
            selectedTab === "uefa-nations-league" && { borderBottomColor: teamColors.primary },
          ]}
          onPress={() => setSelectedTab("uefa-nations-league")}
        >
          <Text
            style={[
              styles.tabButtonText,
              { color: selectedTab === "uefa-nations-league" ? teamColors.primary : theme.colors.textSecondary },
            ]}
          >
            UEFA Nations League Group A
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Tab Content */}
      {selectedTab === "fifa-uefa-groups" ? renderGroupStageContent() : renderUEFANationsLeagueContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabsContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 16,
  },
  tabButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 8,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTabButton: {
    borderBottomWidth: 2,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  contentContainer: {
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

