/**
 * AFCON Groups Table Template
 * Africa Cup of Nations Group Stage Standings
 * 
 * This is a TABLE TEMPLATE that appears inside the Table tab of news-team-details-table.tsx
 * It displays AFCON Group Stage standings (Group A to Group F).
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
  group: string; // Group A, B, C, D, E, F
  teams: TeamStanding[];
}

interface AfconGroupsProps {
  currentTeamName: string;
  theme: any;
  teamColors: { primary: string; secondary: string };
  isDarkMode: boolean;
}

export default function AfconGroups({
  currentTeamName,
  theme,
  teamColors,
  isDarkMode,
}: AfconGroupsProps) {
  
  // AFCON Groups Data (Groups A to F) - Based on Chinese app screenshots
  const groupsData: GroupData[] = [
    {
      group: "Group A",
      teams: [
        { pos: 1, flag: "🇲🇦", team: "Morocco", mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0, status: "promoted" },
        { pos: 2, flag: "🇲🇱", team: "Mali", mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
        { pos: 3, flag: "🇿🇲", team: "Zambia", mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
        { pos: 4, flag: "🇰🇲", team: "Comoros", mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
      ],
    },
    {
      group: "Group B",
      teams: [
        { pos: 1, flag: "🇿🇦", team: "South Africa", mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0, status: "promoted" },
        { pos: 2, flag: "🇿🇼", team: "Zimbabwe", mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
        { pos: 3, flag: "🇪🇬", team: "Egypt", mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
        { pos: 4, flag: "🇦🇴", team: "Angola", mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
      ],
    },
    {
      group: "Group C",
      teams: [
        { pos: 1, flag: "🇹🇿", team: "Tanzania", mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0, status: "promoted" },
        { pos: 2, flag: "🇳🇬", team: "Nigeria", mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0, highlight: currentTeamName.toLowerCase().includes("nigeria") },
        { pos: 3, flag: "🇹🇳", team: "Tunisia", mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
        { pos: 4, flag: "🇺🇬", team: "Uganda", mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0, highlight: currentTeamName.toLowerCase().includes("uganda") },
      ],
    },
    {
      group: "Group D",
      teams: [
        { pos: 1, flag: "🇨🇻", team: "Cabo Verde", mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0, status: "promoted" },
        { pos: 2, flag: "🇨🇲", team: "Cameroon", mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0, highlight: currentTeamName.toLowerCase().includes("cameroon") },
        { pos: 3, flag: "🇱🇾", team: "Libya", mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
        { pos: 4, flag: "🇲🇺", team: "Mauritius", mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
      ],
    },
    {
      group: "Group E",
      teams: [
        { pos: 1, flag: "🇩🇿", team: "Algeria", mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0, status: "promoted" },
        { pos: 2, flag: "🇪🇹", team: "Equatorial Guinea", mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
        { pos: 3, flag: "🇬🇳", team: "Guinea", mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
        { pos: 4, flag: "🇬🇼", team: "Guinea-Bissau", mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
      ],
    },
    {
      group: "Group F",
      teams: [
        { pos: 1, flag: "🇨🇮", team: "Côte d'Ivoire", mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0, status: "promoted" },
        { pos: 2, flag: "🇬🇦", team: "Gabon", mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
        { pos: 3, flag: "🇸🇳", team: "Senegal", mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
        { pos: 4, flag: "🇧🇯", team: "Benin", mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
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
          Africa Cup of Nations - Group Stage
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          6 Groups • 4 Teams per Group
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
          The Africa Cup of Nations Group Stage features 24 teams divided into 6 groups (A-F) with 4 teams each.
          {"\n\n"}
          • The top 2 teams from each group advance to the Round of 16.
          {"\n"}
          • The 4 best third-placed teams also qualify for the Round of 16.
          {"\n"}
          • Teams are ranked by points, then goal difference, then goals scored.
          {"\n"}
          • In case of a tie, head-to-head records are considered.
          {"\n\n"}
          This table is updated after each matchday and reflects the current standings.
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

