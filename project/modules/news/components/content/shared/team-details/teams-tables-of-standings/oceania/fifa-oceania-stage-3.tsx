/**
 * FIFA OFC Stage 3 Qualifiers Table Template
 * 2026 FIFA World Cup OFC Zone Stage 3 Qualifiers (Final Stage)
 * 
 * This is a TABLE TEMPLATE for OFC Stage 3 Qualifiers.
 * It displays OFC Stage 3 Qualifiers - the final stage with 2 teams.
 * 
 * Stage 3 is the final stage featuring the 2 group winners from Stage 2.
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
  status?: "world-cup" | "playoff" | "normal"; // Qualification status
  highlight?: boolean; // Highlight current team
}

interface FIFAOceaniaStage3Props {
  currentTeamName: string;
  theme: any;
  teamColors: { primary: string; secondary: string };
  isDarkMode: boolean;
}

export default function FIFAOceaniaStage3({
  currentTeamName,
  theme,
  teamColors,
  isDarkMode,
}: FIFAOceaniaStage3Props) {
  
  // Stage 3 OFC Qualifiers Data (Final 2 Teams)
  // Placeholders will be replaced with real API data
  const standingsData: TeamStanding[] = [
    { pos: 1, flag: "🇳🇿", team: "New Zealand", mp: 2, w: 2, d: 0, l: 0, gf: 7, ga: 0, pts: 6, status: "world-cup" },
    { pos: 2, flag: "🏴", team: "Team 2", mp: 2, w: 0, d: 0, l: 2, gf: 0, ga: 7, pts: 0, status: "playoff" },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Title */}
      <View style={styles.headerContainer}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          2026 FIFA World Cup - OFC Stage 3 Qualifiers (Final)
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          2 Teams • Winner → World Cup • Runner-Up → Playoff
        </Text>
      </View>

      {/* Single Table */}
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
          
          let badgeColor = "";
          let badgeText = "";
          
          if (team.status === "world-cup") {
            badgeColor = "#4CAF50";
            badgeText = "WORLD CUP QUALIFIED";
          } else if (team.status === "playoff") {
            badgeColor = "#FFA07A";
            badgeText = "INTERCONTINENTAL PLAYOFF";
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
          <Text style={{ fontWeight: "bold" }}>2026 FIFA World Cup OFC Zone Qualifiers - Stage 3 (Final Stage)</Text>
          {"\n\n"}
          The OFC (Oceania Football Confederation) qualification consists of 3 stages. Oceania has one direct World Cup spot and one intercontinental playoff spot.
          {"\n\n"}
          <Text style={{ fontWeight: "bold" }}>Stage 3 Format (Final):</Text>
          {"\n\n"}
          The 2 group winners from Stage 2 face each other in a home-and-away two-leg final.
          {"\n\n"}
          <Text style={{ fontWeight: "bold" }}>Qualification Outcomes:</Text>
          {"\n"}
          • <Text style={{ fontWeight: "bold" }}>Winner:</Text> Directly qualifies for the 2026 FIFA World Cup
          {"\n"}
          • <Text style={{ fontWeight: "bold" }}>Runner-Up:</Text> Advances to the intercontinental playoff for a chance at World Cup qualification
          {"\n\n"}
          <Text style={{ fontWeight: "bold" }}>Match Format:</Text>
          {"\n"}
          • Two-leg home-and-away series
          {"\n"}
          • Aggregate score determines the winner
          {"\n"}
          • If aggregate is tied, away goals rule applies
          {"\n"}
          • If still tied, extra time and penalty shootout
          {"\n\n"}
          <Text style={{ fontWeight: "bold" }}>Full Qualification Path:</Text>
          {"\n"}
          <Text style={{ fontWeight: "bold" }}>Stage 1:</Text> Bottom 4 ranked teams play semifinals and final. Winner advances to Stage 2.
          {"\n\n"}
          <Text style={{ fontWeight: "bold" }}>Stage 2:</Text> Top 7 ranked teams plus Stage 1 winner divided into 2 groups of 4. Top team from each group advances to Stage 3.
          {"\n\n"}
          <Text style={{ fontWeight: "bold" }}>Stage 3:</Text> 2 group winners from Stage 2 play home-and-away final. Winner qualifies for World Cup, runner-up goes to intercontinental playoff.
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

