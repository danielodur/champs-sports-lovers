/**
 * FIFA AFCON Qualifiers Table Template
 * 2026 FIFA World Cup African Zone Qualifiers & Africa Cup of Nations
 * 
 * This is a TABLE TEMPLATE that appears inside the Table tab of news-team-details-table.tsx
 * It displays competition-specific standings (Group A to Group I) for African qualifiers.
 * 
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

interface TeamStanding {
  pos: number;
  flag: string; // Country flag emoji or code
  team: string;
  mp: number; // Matches Played
  w: number; // Wins
  d: number; // Draws
  l: number; // Losses
  gf: number; // Goals For
  ga: number; // Goals Against
  pts: number; // Points
  status?: "promoted" | "playoff" | "normal"; // Promoted or Playoff qualification
  highlight?: boolean; // Highlight current team
}

interface GroupData {
  group: string; // Group A, B, C, etc.
  round: string; // Competition round (e.g., "Group Stage")
  teams: TeamStanding[];
}

interface FIFAAfconQualifiersProps {
  currentTeamName: string;
  theme: any;
  teamColors: { primary: string; secondary: string };
  isDarkMode: boolean;
}

export default function FIFAAfconQualifiers({
  currentTeamName,
  theme,
  teamColors,
  isDarkMode,
}: FIFAAfconQualifiersProps) {
  const [selectedGroup, setSelectedGroup] = useState("group-stage"); // Default to Group Stage

  // Group Stage Data - Based on screenshots
  const groupsData: GroupData[] = [
    {
      group: "Group A",
      round: "Competition",
      teams: [
        { pos: 1, flag: "🇪🇬", team: "Egypt", mp: 10, w: 8, d: 2, l: 0, gf: 20, ga: 2, pts: 26, status: "promoted" },
        { pos: 2, flag: "🇧🇫", team: "Burkina Faso", mp: 10, w: 6, d: 3, l: 1, gf: 23, ga: 8, pts: 21 },
        { pos: 3, flag: "🇸🇱", team: "Sierra Leone", mp: 10, w: 4, d: 3, l: 3, gf: 12, ga: 10, pts: 15 },
        { pos: 4, flag: "🇬🇼", team: "Guinea-Bissau", mp: 10, w: 2, d: 4, l: 4, gf: 8, ga: 10, pts: 10 },
        { pos: 5, flag: "🇪🇹", team: "Ethiopia", mp: 10, w: 2, d: 3, l: 5, gf: 9, ga: 14, pts: 9 },
        { pos: 6, flag: "🇩🇯", team: "Djibouti", mp: 10, w: 0, d: 1, l: 9, gf: 5, ga: 33, pts: 1 },
      ],
    },
    {
      group: "Group B",
      round: "Competition",
      teams: [
        { pos: 1, flag: "🇸🇳", team: "Senegal", mp: 10, w: 7, d: 3, l: 0, gf: 22, ga: 3, pts: 24, status: "promoted" },
        { pos: 2, flag: "🇨🇩", team: "DR Congo", mp: 10, w: 7, d: 1, l: 2, gf: 15, ga: 6, pts: 22, status: "playoff", highlight: currentTeamName.toLowerCase().includes("congo") || currentTeamName.toLowerCase().includes("dr congo") },
        { pos: 3, flag: "🇸🇩", team: "Sudan", mp: 10, w: 3, d: 4, l: 3, gf: 8, ga: 6, pts: 13 },
        { pos: 4, flag: "🇲🇿", team: "Mozambique", mp: 10, w: 1, d: 5, l: 4, gf: 5, ga: 10, pts: 8 },
        { pos: 5, flag: "🇲🇷", team: "Mauritania", mp: 10, w: 1, d: 4, l: 5, gf: 4, ga: 13, pts: 7 },
        { pos: 6, flag: "🇸🇸", team: "South Sudan", mp: 10, w: 0, d: 5, l: 5, gf: 3, ga: 19, pts: 5 },
      ],
    },
    {
      group: "Group C",
      round: "Competition",
      teams: [
        { pos: 1, flag: "🇿🇦", team: "South Africa", mp: 10, w: 5, d: 3, l: 2, gf: 15, ga: 9, pts: 18, status: "promoted" },
        { pos: 2, flag: "🇳🇬", team: "Nigeria", mp: 10, w: 4, d: 5, l: 1, gf: 15, ga: 8, pts: 17, status: "playoff", highlight: currentTeamName.toLowerCase().includes("nigeria") },
        { pos: 3, flag: "🇧🇯", team: "Benin", mp: 10, w: 5, d: 2, l: 3, gf: 12, ga: 11, pts: 17 },
        { pos: 4, flag: "🇱🇸", team: "Lesotho", mp: 10, w: 3, d: 3, l: 4, gf: 9, ga: 12, pts: 12 },
        { pos: 5, flag: "🇷🇼", team: "Rwanda", mp: 10, w: 3, d: 2, l: 5, gf: 5, ga: 9, pts: 11 },
        { pos: 6, flag: "🇿🇼", team: "Zimbabwe", mp: 10, w: 0, d: 5, l: 5, gf: 5, ga: 12, pts: 5 },
      ],
    },
    {
      group: "Group D",
      round: "Competition",
      teams: [
        { pos: 1, flag: "🇨🇻", team: "Cabo Verde", mp: 10, w: 7, d: 2, l: 1, gf: 16, ga: 8, pts: 23, status: "promoted" },
        { pos: 2, flag: "🇨🇲", team: "Cameroon", mp: 10, w: 5, d: 4, l: 1, gf: 17, ga: 5, pts: 19, status: "playoff", highlight: currentTeamName.toLowerCase().includes("cameroon") },
        { pos: 3, flag: "🇱🇾", team: "Libya", mp: 10, w: 4, d: 4, l: 2, gf: 12, ga: 10, pts: 16 },
        { pos: 4, flag: "🇦🇴", team: "Angola", mp: 10, w: 2, d: 6, l: 2, gf: 9, ga: 8, pts: 12 },
        { pos: 5, flag: "🇲🇺", team: "Mauritius", mp: 10, w: 1, d: 3, l: 6, gf: 7, ga: 17, pts: 6 },
        { pos: 6, flag: "🇸🇿", team: "Eswatini", mp: 10, w: 0, d: 3, l: 7, gf: 6, ga: 19, pts: 3 },
      ],
    },
    {
      group: "Group E",
      round: "Competition",
      teams: [
        { pos: 1, flag: "🇲🇦", team: "Morocco", mp: 8, w: 8, d: 0, l: 0, gf: 22, ga: 2, pts: 24, status: "promoted" },
        { pos: 2, flag: "🇳🇪", team: "Niger", mp: 8, w: 5, d: 0, l: 3, gf: 11, ga: 10, pts: 15 },
        { pos: 3, flag: "🇹🇿", team: "Tanzania", mp: 8, w: 3, d: 1, l: 4, gf: 6, ga: 7, pts: 10 },
        { pos: 4, flag: "🇿🇲", team: "Zambia", mp: 8, w: 3, d: 0, l: 5, gf: 10, ga: 10, pts: 9 },
        { pos: 5, flag: "🇨🇬", team: "Congo", mp: 8, w: 0, d: 1, l: 7, gf: 4, ga: 24, pts: 1 },
        { pos: 6, flag: "🇪🇷", team: "Eritrea", mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
      ],
    },
    {
      group: "Group F",
      round: "Competition",
      teams: [
        { pos: 1, flag: "🇨🇮", team: "Côte d'Ivoire", mp: 10, w: 8, d: 2, l: 0, gf: 25, ga: 0, pts: 26, status: "promoted" },
        { pos: 2, flag: "🇬🇦", team: "Gabon", mp: 10, w: 8, d: 1, l: 1, gf: 22, ga: 9, pts: 25, status: "playoff" },
        { pos: 3, flag: "🇰🇪", team: "Kenya", mp: 10, w: 4, d: 1, l: 5, gf: 27, ga: 18, pts: 13 },
        { pos: 4, flag: "🇲🇱", team: "Mali", mp: 10, w: 4, d: 1, l: 5, gf: 11, ga: 10, pts: 13 },
        { pos: 5, flag: "🇺🇬", team: "Uganda", mp: 10, w: 3, d: 3, l: 4, gf: 18, ga: 14, pts: 12 },
        { pos: 6, flag: "🇲🇼", team: "Malawi", mp: 10, w: 0, d: 0, l: 10, gf: 2, ga: 53, pts: 0 },
      ],
    },
    {
      group: "Group G",
      round: "Competition",
      teams: [
        { pos: 1, flag: "🇩🇿", team: "Algeria", mp: 10, w: 7, d: 3, l: 0, gf: 22, ga: 3, pts: 24, status: "promoted" },
        { pos: 2, flag: "🇺🇬", team: "Uganda", mp: 10, w: 6, d: 1, l: 3, gf: 17, ga: 12, pts: 19, status: "playoff" },
        { pos: 3, flag: "🇲🇱", team: "Mali", mp: 10, w: 5, d: 3, l: 2, gf: 17, ga: 6, pts: 18 },
        { pos: 4, flag: "🇰🇲", team: "Comoros", mp: 10, w: 5, d: 0, l: 5, gf: 12, ga: 13, pts: 15 },
        { pos: 5, flag: "🇨🇫", team: "Central African Republic", mp: 10, w: 2, d: 2, l: 6, gf: 11, ga: 24, pts: 8 },
        { pos: 6, flag: "🇹🇩", team: "Chad", mp: 10, w: 0, d: 1, l: 9, gf: 5, ga: 24, pts: 1 },
      ],
    },
    {
      group: "Group H",
      round: "Competition",
      teams: [
        { pos: 1, flag: "🇹🇳", team: "Tunisia", mp: 10, w: 9, d: 1, l: 0, gf: 22, ga: 0, pts: 28, status: "promoted" },
        { pos: 2, flag: "🇳🇦", team: "Namibia", mp: 10, w: 4, d: 3, l: 3, gf: 13, ga: 10, pts: 15 },
        { pos: 3, flag: "🇱🇷", team: "Liberia", mp: 10, w: 4, d: 3, l: 3, gf: 13, ga: 11, pts: 15 },
        { pos: 4, flag: "🇲🇼", team: "Malawi", mp: 10, w: 4, d: 1, l: 5, gf: 11, ga: 10, pts: 13 },
        { pos: 5, flag: "🇬🇶", team: "Equatorial Guinea", mp: 10, w: 3, d: 2, l: 5, gf: 8, ga: 15, pts: 11 },
        { pos: 6, flag: "🇸🇹", team: "São Tomé and Príncipe", mp: 10, w: 1, d: 0, l: 9, gf: 5, ga: 26, pts: 3 },
      ],
    },
    {
      group: "Group I",
      round: "Competition",
      teams: [
        { pos: 1, flag: "🇬🇭", team: "Ghana", mp: 10, w: 8, d: 1, l: 1, gf: 23, ga: 6, pts: 25, status: "promoted" },
        { pos: 2, flag: "🇲🇬", team: "Madagascar", mp: 10, w: 6, d: 1, l: 3, gf: 17, ga: 12, pts: 19, status: "playoff" },
        { pos: 3, flag: "🇲🇱", team: "Mali", mp: 10, w: 5, d: 3, l: 2, gf: 17, ga: 6, pts: 18 },
        { pos: 4, flag: "🇰🇲", team: "Comoros", mp: 10, w: 5, d: 0, l: 5, gf: 12, ga: 13, pts: 15 },
        { pos: 5, flag: "🇨🇫", team: "Central African Republic", mp: 10, w: 2, d: 2, l: 6, gf: 11, ga: 24, pts: 8 },
        { pos: 6, flag: "🇹🇩", team: "Chad", mp: 10, w: 0, d: 1, l: 9, gf: 5, ga: 24, pts: 1 },
      ],
    },
  ];

  // Competition Notice (from Chinese screenshots)
  const competitionNotice = `2026 FIFA World Cup African Zone External Qualifiers is the qualifying competition for CAF member countries to compete for the 2026 FIFA World Cup qualifying spots. The African zone has a total of 9 direct qualifying spots and 1 intercontinental playoff spot.

54 CAF member countries will participate in the 2026 FIFA World Cup African Zone External Qualifiers, divided into group stage and playoff stage.

Group Stage: Based on the draw by the International Football Federation, it is divided into six groups with 6 teams each in the first to sixth groups. The 54 teams will be divided into nine groups. A home and away double round-robin format will be used, with a total of ten match days. The top team from each group can directly advance to the World Cup final stage, and the four teams with the best second-place results will advance to the playoffs.

Playoff Stage: The four teams with the best second-place results will advance to the playoffs to decide which team will enter the intercontinental playoffs. This round will have a total of three matches, namely two playoff semifinals and one playoff final. The three matches will all be held in a neutral venue.

World Preliminary Competition Period: The period runs from November 13, 2023 to November 18, 2025.

Note: Eritrea withdrew from this World Preliminary competition event, so all related matches have been cancelled. Since there are only five teams in the small group where Eritrea is located, when comparing the second place results in each small group, the results of the second place team in each small group and the last place team do not count.`;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Competition Filters */}
      <View style={styles.filtersContainer}>
        <TouchableOpacity
          style={[
            styles.filterChip,
            selectedGroup === "group-stage" && {
              backgroundColor: teamColors.primary + "20",
              borderColor: teamColors.primary,
            },
          ]}
          onPress={() => setSelectedGroup("group-stage")}
        >
          <Text
            style={[
              styles.filterChipText,
              {
                color:
                  selectedGroup === "group-stage"
                    ? teamColors.primary
                    : theme.colors.text,
              },
            ]}
          >
            African Qualifiers Group Stage
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterChip,
            selectedGroup === "africa-cup-group" && {
              backgroundColor: teamColors.primary + "20",
              borderColor: teamColors.primary,
            },
          ]}
          onPress={() => setSelectedGroup("africa-cup-group")}
        >
          <Text
            style={[
              styles.filterChipText,
              {
                color:
                  selectedGroup === "africa-cup-group"
                    ? teamColors.primary
                    : theme.colors.text,
              },
            ]}
          >
            Africa Cup Group Stage
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterChip,
            selectedGroup === "africa-cup-external" && {
              backgroundColor: teamColors.primary + "20",
              borderColor: teamColors.primary,
            },
          ]}
          onPress={() => setSelectedGroup("africa-cup-external")}
        >
          <Text
            style={[
              styles.filterChipText,
              {
                color:
                  selectedGroup === "africa-cup-external"
                    ? teamColors.primary
                    : theme.colors.text,
              },
            ]}
          >
            Africa Cup External Group Stage
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterChip,
            selectedGroup === "africa-cup-nations" && {
              backgroundColor: teamColors.primary + "20",
              borderColor: teamColors.primary,
            },
          ]}
          onPress={() => setSelectedGroup("africa-cup-nations")}
        >
          <Text
            style={[
              styles.filterChipText,
              {
                color:
                  selectedGroup === "africa-cup-nations"
                    ? teamColors.primary
                    : theme.colors.text,
              },
            ]}
          >
            Africa Cup of Nations
          </Text>
        </TouchableOpacity>
      </View>

      {/* Groups Display */}
      {groupsData.map((groupData, groupIndex) => (
        <View key={groupIndex} style={styles.groupContainer}>
          {/* Group Header */}
          <View style={styles.groupHeader}>
            <Text
              style={[
                styles.groupTitle,
                { color: theme.colors.text, backgroundColor: teamColors.primary + "15" },
              ]}
            >
              {groupData.group} ({groupData.round})
            </Text>
          </View>

          {/* Table Header */}
          <View
            style={[
              styles.tableHeader,
              { backgroundColor: isDarkMode ? "#1a1a1a" : "#f5f5f5" },
            ]}
          >
            <Text
              style={[
                styles.headerCell,
                styles.headerRank,
                { color: theme.colors.textSecondary },
              ]}
            ></Text>
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
            const bgColor = team.status === "promoted"
              ? (isDarkMode ? "#8B0000" : "#FFE5E5")
              : team.status === "playoff"
              ? (isDarkMode ? "#8B4513" : "#FFEEDD")
              : isHighlighted
              ? (isDarkMode ? "#0f3f2f" : "#e8f5e8")
              : theme.colors.background;

            return (
              <View key={index}>
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
                      backgroundColor: bgColor,
                      borderLeftWidth: isHighlighted ? 3 : 0,
                      borderLeftColor: isHighlighted
                        ? teamColors.primary
                        : "transparent",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.cellRank,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    {team.pos}
                  </Text>

                  <View style={styles.cellTeam}>
                    <Text style={styles.flagIcon}>{team.flag}</Text>
                    <Text
                      style={[
                        styles.teamName,
                        {
                          color: isHighlighted
                            ? teamColors.primary
                            : theme.colors.text,
                          fontWeight: isHighlighted ? "bold" : "600",
                        },
                      ]}
                    >
                      {team.team}
                    </Text>
                  </View>

                  <Text
                    style={[styles.cellStat, { color: theme.colors.text }]}
                  >
                    {team.mp}
                  </Text>

                  <Text
                    style={[
                      styles.cellStat,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    {team.w}/{team.d}/{team.l}
                  </Text>

                  <Text
                    style={[
                      styles.cellStat,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    {team.gf}/{team.ga}
                  </Text>

                  <Text
                    style={[
                      styles.cellPoints,
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

      {/* Competition Notice */}
      <View
        style={[
          styles.noticeContainer,
          { backgroundColor: isDarkMode ? "#1a1a1a" : "#f9f9f9" },
        ]}
      >
        <Text
          style={[
            styles.noticeTitle,
            { color: theme.colors.text, fontWeight: "bold" },
          ]}
        >
          Competition Explanation
        </Text>
        <Text
          style={[
            styles.noticeText,
            { color: theme.colors.textSecondary, lineHeight: 22 },
          ]}
        >
          {competitionNotice}
        </Text>

        <Text
          style={[
            styles.qualifiedTeamsTitle,
            { color: theme.colors.text, fontWeight: "bold", marginTop: 16 },
          ]}
        >
          Teams Qualified for World Cup Final Stage:
        </Text>
        <Text
          style={[
            styles.qualifiedTeamsText,
            { color: theme.colors.textSecondary },
          ]}
        >
          Egypt, Senegal, Cabo Verde, Côte d'Ivoire, Morocco, Algeria, Tunisia,
          Ghana, South Africa
        </Text>

        <Text
          style={[
            styles.qualifiedTeamsTitle,
            { color: theme.colors.text, fontWeight: "bold", marginTop: 12 },
          ]}
        >
          Teams Qualified for Intercontinental Playoffs:
        </Text>
        <Text
          style={[
            styles.qualifiedTeamsText,
            { color: theme.colors.textSecondary },
          ]}
        >
          Cameroon
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
  filtersContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: "500",
  },
  groupContainer: {
    marginBottom: 24,
  },
  groupHeader: {
    marginBottom: 8,
  },
  groupTitle: {
    fontSize: 14,
    fontWeight: "bold",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  tableHeader: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  headerCell: {
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
  },
  headerRank: {
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
    width: 50,
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    marginLeft: 8,
  },
  statusBadgeText: {
    color: "white",
    fontSize: 11,
    fontWeight: "bold",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  cellRank: {
    width: 30,
    fontSize: 13,
    textAlign: "center",
  },
  cellTeam: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  flagIcon: {
    fontSize: 20,
  },
  teamName: {
    fontSize: 13,
  },
  cellStat: {
    width: 60,
    fontSize: 12,
    textAlign: "center",
  },
  cellPoints: {
    width: 50,
    fontSize: 14,
    textAlign: "center",
  },
  noticeContainer: {
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 24,
  },
  noticeTitle: {
    fontSize: 15,
    marginBottom: 12,
  },
  noticeText: {
    fontSize: 13,
  },
  qualifiedTeamsTitle: {
    fontSize: 14,
    marginBottom: 8,
  },
  qualifiedTeamsText: {
    fontSize: 13,
    lineHeight: 20,
  },
});

