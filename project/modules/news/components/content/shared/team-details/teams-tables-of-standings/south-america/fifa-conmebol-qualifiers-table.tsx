/**
 * FIFA CONMEBOL Qualifiers Table Template
 * 2026 FIFA World Cup CONMEBOL Zone Qualifiers
 * 
 * This is a TABLE TEMPLATE for South American World Cup Qualifiers.
 * It displays CONMEBOL (South America) FIFA World Cup Qualifiers standings.
 * 
 * CONMEBOL qualification features all 10 South American nations in a single round-robin group.
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
  status?: "direct" | "playoff" | "normal"; // Qualification status
  highlight?: boolean; // Highlight current team
}

interface FIFACONMEBOLQualifiersProps {
  currentTeamName: string;
  theme: any;
  teamColors: { primary: string; secondary: string };
  isDarkMode: boolean;
}

export default function FIFACONMEBOLQualifiersTable({
  currentTeamName,
  theme,
  teamColors,
  isDarkMode,
}: FIFACONMEBOLQualifiersProps) {
  
  // CONMEBOL Qualifiers Data (Single Group - All 10 South American Nations)
  // Placeholders will be replaced with real API data
  const standingsData: TeamStanding[] = [
    { pos: 1, flag: "🇦🇷", team: "Argentina", mp: 18, w: 12, d: 2, l: 4, gf: 31, ga: 10, pts: 38, status: "direct" },
    { pos: 2, flag: "🇪🇨", team: "Ecuador", mp: 18, w: 8, d: 8, l: 2, gf: 14, ga: 5, pts: 29 },
    { pos: 3, flag: "🇨🇴", team: "Colombia", mp: 18, w: 7, d: 7, l: 4, gf: 28, ga: 18, pts: 28 },
    { pos: 4, flag: "🇬🇷", team: "Uruguay", mp: 18, w: 7, d: 7, l: 4, gf: 22, ga: 12, pts: 28 },
    { pos: 5, flag: "🇧🇷", team: "Brazil", mp: 18, w: 8, d: 4, l: 6, gf: 24, ga: 17, pts: 28 },
    { pos: 6, flag: "🇵🇾", team: "Paraguay", mp: 18, w: 7, d: 7, l: 4, gf: 14, ga: 10, pts: 28 },
    { pos: 7, flag: "🇧🇴", team: "Bolivia", mp: 18, w: 6, d: 2, l: 10, gf: 17, ga: 35, pts: 20, status: "playoff" },
    { pos: 8, flag: "🇻🇪", team: "Venezuela", mp: 18, w: 4, d: 6, l: 8, gf: 18, ga: 28, pts: 18 },
    { pos: 9, flag: "🇵🇪", team: "Peru", mp: 18, w: 2, d: 6, l: 10, gf: 6, ga: 21, pts: 12 },
    { pos: 10, flag: "🇨🇱", team: "Chile", mp: 18, w: 2, d: 5, l: 11, gf: 9, ga: 27, pts: 11 },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Title */}
      <View style={styles.headerContainer}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          2026 FIFA World Cup - CONMEBOL Qualifiers
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          10 Teams • Top 6 Direct Qualification • 7th Place Playoff
        </Text>
      </View>

      {/* Single Table for All Teams */}
      <View style={styles.tableContainer}>
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
          >
            Team
          </Text>
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
        {standingsData.map((team, index) => {
          const isHighlighted = team.highlight || team.team === currentTeamName;
          
          // Determine badge color and text
          let badgeColor = "";
          let badgeText = "";
          
          if (team.status === "direct") {
            badgeColor = "#FF6B6B";
            badgeText = "DIRECT QUALIFICATION";
          } else if (team.status === "playoff") {
            badgeColor = "#FFA07A";
            badgeText = "PLAYOFF";
          }

          return (
            <View key={index} style={styles.rowWrapper}>
              {/* Status Badge */}
              {team.status && team.status !== "normal" && (
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: badgeColor },
                  ]}
                >
                  <Text style={styles.statusBadgeText}>{badgeText}</Text>
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
          <Text style={{ fontWeight: "bold" }}>FIFA World Cup CONMEBOL Zone Qualifiers Scoring Rules</Text>
          {"\n\n"}
          <Text style={{ fontWeight: "bold" }}>1. Points System:</Text>
          {"\n"}
          Each team earns 3 points for a win, 1 point for a draw, and 0 points for a loss.
          {"\n\n"}
          <Text style={{ fontWeight: "bold" }}>2. Group Stage Conclusion:</Text>
          {"\n"}
          After all matches are completed, teams with more points are ranked higher.
          {"\n\n"}
          <Text style={{ fontWeight: "bold" }}>3. Tiebreaker Rules:</Text>
          {"\n"}
          If two or more teams have equal points, the following tiebreaker criteria are applied in order (same points situation has one ranking rule and one condition):
          {"\n\n"}
          <Text style={{ fontWeight: "bold" }}>a) Goal Difference</Text>
          {"\n"}
          The difference between goals scored and goals conceded. A higher goal difference ranks higher.
          {"\n\n"}
          <Text style={{ fontWeight: "bold" }}>b) Goals Scored</Text>
          {"\n"}
          Total number of goals scored throughout the qualification campaign. More goals scored ranks higher.
          {"\n\n"}
          <Text style={{ fontWeight: "bold" }}>c) Head-to-Head Record</Text>
          {"\n"}
          Direct results between the tied teams. The team with better head-to-head results ranks higher.
          {"\n\n"}
          <Text style={{ fontWeight: "bold" }}>d) Head-to-Head Goal Difference</Text>
          {"\n"}
          Goal difference in matches between the tied teams.
          {"\n\n"}
          <Text style={{ fontWeight: "bold" }}>e) Head-to-Head Goals Scored</Text>
          {"\n"}
          Total goals scored in matches between the tied teams.
          {"\n\n"}
          <Text style={{ fontWeight: "bold" }}>f) Fair Play Points</Text>
          {"\n"}
          Teams with fewer yellow and red cards rank higher.
          {"\n\n"}
          <Text style={{ fontWeight: "bold" }}>g) Drawing of Lots</Text>
          {"\n"}
          If all above criteria are equal, FIFA will conduct a drawing of lots to determine the final ranking.
          {"\n\n"}
          <Text style={{ fontWeight: "bold" }}>Qualification Format:</Text>
          {"\n"}
          CONMEBOL features all 10 South American nations competing in a single round-robin group format. Each team plays 18 matches (home and away against each opponent).
          {"\n\n"}
          <Text style={{ fontWeight: "bold" }}>• Top 6 Teams:</Text> Automatically qualify for the 2026 FIFA World Cup
          {"\n"}
          <Text style={{ fontWeight: "bold" }}>• 7th Place Team:</Text> Advances to the intercontinental playoff for a chance at qualification
          {"\n"}
          <Text style={{ fontWeight: "bold" }}>• 8th-10th Place Teams:</Text> Eliminated from World Cup qualification
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
  tableContainer: {
    marginBottom: 24,
    borderRadius: 12,
    overflow: "hidden",
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

