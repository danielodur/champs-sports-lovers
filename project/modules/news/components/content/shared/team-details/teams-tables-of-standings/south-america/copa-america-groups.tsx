/**
 * Copa América Groups Table Template
 * CONMEBOL Copa América - Group Stage
 * 
 * This is a TABLE TEMPLATE for Copa América Group Stage.
 * It displays Copa América Group Stage standings (Groups A, B, C, D).
 * 
 * Copa América features 16 teams from South America and invited nations divided into 4 groups.
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
  status?: "knockout" | "normal"; // Qualification status
  highlight?: boolean; // Highlight current team
}

interface GroupData {
  group: string; // Group A, B, C, D
  teams: TeamStanding[];
}

interface CopaAmericaGroupsProps {
  currentTeamName: string;
  theme: any;
  teamColors: { primary: string; secondary: string };
  isDarkMode: boolean;
}

export default function CopaAmericaGroups({
  currentTeamName,
  theme,
  teamColors,
  isDarkMode,
}: CopaAmericaGroupsProps) {
  
  // Copa América Group Stage Data (Groups A, B, C, D)
  // 4 groups with 4 teams each (16 teams total)
  // Placeholders will be replaced with real API data
  const groupsData: GroupData[] = [
    {
      group: "Group A",
      teams: [
        { pos: 1, flag: "🇦🇷", team: "Argentina", mp: 3, w: 3, d: 0, l: 0, gf: 5, ga: 0, pts: 9, status: "knockout" },
        { pos: 2, flag: "🇨🇦", team: "Canada", mp: 3, w: 1, d: 1, l: 1, gf: 1, ga: 2, pts: 4, status: "knockout" },
        { pos: 3, flag: "🇨🇱", team: "Chile", mp: 3, w: 0, d: 2, l: 1, gf: 0, ga: 1, pts: 2 },
        { pos: 4, flag: "🇵🇪", team: "Peru", mp: 3, w: 0, d: 1, l: 2, gf: 0, ga: 3, pts: 1 },
      ],
    },
    {
      group: "Group B",
      teams: [
        { pos: 1, flag: "🇻🇪", team: "Venezuela", mp: 3, w: 3, d: 0, l: 0, gf: 6, ga: 1, pts: 9, status: "knockout" },
        { pos: 2, flag: "🇪🇨", team: "Ecuador", mp: 3, w: 1, d: 1, l: 1, gf: 4, ga: 3, pts: 4, status: "knockout" },
        { pos: 3, flag: "🇲🇽", team: "Mexico", mp: 3, w: 1, d: 1, l: 1, gf: 1, ga: 1, pts: 4 },
        { pos: 4, flag: "🇯🇲", team: "Jamaica", mp: 3, w: 0, d: 0, l: 3, gf: 1, ga: 7, pts: 0 },
      ],
    },
    {
      group: "Group C",
      teams: [
        { pos: 1, flag: "🇺🇾", team: "Uruguay", mp: 3, w: 3, d: 0, l: 0, gf: 9, ga: 1, pts: 9, status: "knockout" },
        { pos: 2, flag: "🇵🇦", team: "Panama", mp: 3, w: 2, d: 0, l: 1, gf: 6, ga: 5, pts: 6, status: "knockout" },
        { pos: 3, flag: "🇺🇸", team: "USA", mp: 3, w: 1, d: 0, l: 2, gf: 3, ga: 3, pts: 3 },
        { pos: 4, flag: "🇧🇴", team: "Bolivia", mp: 3, w: 0, d: 0, l: 3, gf: 1, ga: 10, pts: 0 },
      ],
    },
    {
      group: "Group D",
      teams: [
        { pos: 1, flag: "🇨🇴", team: "Colombia", mp: 3, w: 2, d: 1, l: 0, gf: 6, ga: 2, pts: 7, status: "knockout" },
        { pos: 2, flag: "🇧🇷", team: "Brazil", mp: 3, w: 1, d: 2, l: 0, gf: 5, ga: 2, pts: 5, status: "knockout" },
        { pos: 3, flag: "🇨🇷", team: "Costa Rica", mp: 3, w: 1, d: 1, l: 1, gf: 2, ga: 4, pts: 4 },
        { pos: 4, flag: "🇵🇾", team: "Paraguay", mp: 3, w: 0, d: 0, l: 3, gf: 3, ga: 8, pts: 0 },
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
          Copa América - Group Stage
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          4 Groups (A-D) • 4 Teams per Group • Top 2 Advance to Knockout Stage
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
                    <Text style={styles.statusBadgeText}>KNOCKOUT</Text>
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
          <Text style={{ fontWeight: "bold" }}>Copa América Tournament Rules:</Text>
          {"\n\n"}
          <Text style={{ fontWeight: "bold" }}>Participating Teams:</Text>
          {"\n\n"}
          A total of 16 teams participate in the Copa América. 10 teams are from CONMEBOL (South American Football Confederation), and 6 teams are from CONCACAF (North, Central America & Caribbean). The 16 teams are drawn into 4 groups (A, B, C, D) of 4 teams each, where they play single round-robin group stage matches. The top 2 teams from each group advance to the knockout stage.
          {"\n\n"}
          <Text style={{ fontWeight: "bold" }}>Group Stage Ranking Rules:</Text>
          {"\n\n"}
          Each team earns 3 points for a win, 1 point for a draw, and 0 points for a loss. If teams have equal points, the following tiebreaker criteria are applied in order (same points situation has one ranking rule and one condition):
          {"\n\n"}
          <Text style={{ fontWeight: "bold" }}>a) Goal Difference</Text>
          {"\n"}
          The difference between goals scored and goals conceded. A higher goal difference ranks higher.
          {"\n\n"}
          <Text style={{ fontWeight: "bold" }}>b) Goals Scored</Text>
          {"\n"}
          Total number of goals scored in the group stage. More goals scored ranks higher.
          {"\n\n"}
          <Text style={{ fontWeight: "bold" }}>c) Head-to-Head Record</Text>
          {"\n"}
          Direct results between the tied teams. The team with better head-to-head results ranks higher.
          {"\n\n"}
          <Text style={{ fontWeight: "bold" }}>d) Head-to-Head Goal Difference</Text>
          {"\n"}
          Goal difference in matches between the tied teams only.
          {"\n\n"}
          <Text style={{ fontWeight: "bold" }}>e) Head-to-Head Goals Scored</Text>
          {"\n"}
          Total goals scored in matches between the tied teams only.
          {"\n\n"}
          <Text style={{ fontWeight: "bold" }}>f) Fair Play Points</Text>
          {"\n"}
          Teams with fewer yellow and red cards rank higher. Yellow card = -1 point, Red card = -3 points.
          {"\n\n"}
          <Text style={{ fontWeight: "bold" }}>g) Drawing of Lots</Text>
          {"\n"}
          If all above criteria are equal, CONMEBOL will conduct a drawing of lots to determine the final ranking.
          {"\n\n"}
          <Text style={{ fontWeight: "bold" }}>Tournament Format:</Text>
          {"\n\n"}
          <Text style={{ fontWeight: "bold" }}>Group Stage:</Text> 4 groups of 4 teams each. Each team plays 3 matches (one against each other team in their group). Top 2 teams from each group advance to the knockout stage.
          {"\n\n"}
          <Text style={{ fontWeight: "bold" }}>Knockout Stage:</Text> The 8 qualified teams (top 2 from each group) enter the quarter-finals. The knockout stage consists of quarter-finals, semi-finals, third-place match, and the final. All knockout matches are single-elimination. If a match is tied after 90 minutes, it goes to extra time (2 × 15 minutes) and, if necessary, a penalty shootout.
          {"\n\n"}
          <Text style={{ fontWeight: "bold" }}>Tournament History:</Text> Copa América is the oldest international continental football competition, first held in 1916. It is organized by CONMEBOL and held every 4 years (formerly held more frequently). The tournament determines the champion of South America.
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

