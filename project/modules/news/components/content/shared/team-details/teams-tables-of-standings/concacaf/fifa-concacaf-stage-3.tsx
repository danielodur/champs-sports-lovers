/**
 * FIFA CONCACAF Stage 3 Qualifiers - Main Router
 * 2026 FIFA World Cup CONCACAF Zone Qualifiers
 * 
 * This component manages the CONCACAF qualifiers tab system with 4 tabs:
 * 1. FIFA CONCACAF Stage 3
 * 2. FIFA CONCACAF Stage 2
 * 3. CONCACAF Gold Cup Groups
 * 4. CONCACAF Champions Cup
 * 
 * It loads the appropriate table template based on the selected tab.
 */

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import FIFACONCACAFStage2 from "./fifa-concacaf-stage-2";
import GoldCupGroups from "./gold-cup-groups";
import CONCACAFChampionsCup from "./concacaf-champions-cup";

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
  status?: "promoted" | "promoted-pending" | "normal"; // Qualification status
  highlight?: boolean; // Highlight current team
}

interface GroupData {
  group: string; // Group A, B, C
  teams: TeamStanding[];
}

interface FIFACONCACAFStage3Props {
  currentTeamName: string;
  theme: any;
  teamColors: { primary: string; secondary: string };
  isDarkMode: boolean;
}

export default function FIFACONCACAFStage3({
  currentTeamName,
  theme,
  teamColors,
  isDarkMode,
}: FIFACONCACAFStage3Props) {
  const [selectedTab, setSelectedTab] = useState("stage-3");

  // Stage 3 CONCACAF Qualifiers Data (Groups A, B, C)
  // 3 groups with 4 teams each
  // Placeholders will be replaced with real API data
  const stage3GroupsData: GroupData[] = [
    {
      group: "Group A",
      teams: [
        { pos: 1, flag: "🏴", team: "Team 1", mp: 4, w: 1, d: 3, l: 0, gf: 4, ga: 3, pts: 6, status: "promoted" },
        { pos: 2, flag: "🏴", team: "Team 2", mp: 4, w: 1, d: 3, l: 0, gf: 3, ga: 2, pts: 6, status: "promoted-pending" },
        { pos: 3, flag: "🏴", team: "Team 3", mp: 4, w: 1, d: 2, l: 1, gf: 3, ga: 3, pts: 5 },
        { pos: 4, flag: "🏴", team: "Team 4", mp: 4, w: 1, d: 0, l: 3, gf: 2, ga: 4, pts: 3 },
      ],
    },
    {
      group: "Group B",
      teams: [
        { pos: 1, flag: "🏴", team: "Team 1", mp: 4, w: 3, d: 0, l: 1, gf: 10, ga: 2, pts: 9, status: "promoted" },
        { pos: 2, flag: "🏴", team: "Team 2", mp: 4, w: 2, d: 2, l: 0, gf: 6, ga: 3, pts: 8, status: "promoted-pending" },
        { pos: 3, flag: "🏴", team: "Team 3", mp: 4, w: 1, d: 2, l: 1, gf: 4, ga: 3, pts: 5 },
        { pos: 4, flag: "🏴", team: "Team 4", mp: 4, w: 0, d: 0, l: 4, gf: 2, ga: 14, pts: 0 },
      ],
    },
    {
      group: "Group C",
      teams: [
        { pos: 1, flag: "🏴", team: "Team 1", mp: 4, w: 2, d: 2, l: 0, gf: 5, ga: 0, pts: 8, status: "promoted" },
        { pos: 2, flag: "🏴", team: "Team 2", mp: 4, w: 1, d: 3, l: 0, gf: 8, ga: 5, pts: 6, status: "promoted-pending" },
        { pos: 3, flag: "🏴", team: "Team 3", mp: 4, w: 1, d: 2, l: 1, gf: 6, ga: 6, pts: 5 },
        { pos: 4, flag: "🏴", team: "Team 4", mp: 4, w: 0, d: 1, l: 3, gf: 2, ga: 10, pts: 1 },
      ],
    },
  ];

  const renderStage3Content = () => {
    return (
      <ScrollView
        style={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <View style={styles.headerContainer}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            2026 FIFA World Cup - CONCACAF Stage 3 Qualifiers
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            3 Groups (A-C) • 4 Teams per Group • Top 2 Teams Advance
          </Text>
        </View>

        {/* Groups Display */}
        {stage3GroupsData.map((groupData, groupIndex) => (
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
                        {team.status === "promoted" ? "PROMOTED" : "PROMOTION PENDING"}
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
            The 2026 FIFA World Cup CONCACAF Zone Qualifiers is the qualifying competition for CONCACAF member countries to secure spots in the 2026 FIFA World Cup. The United States, Canada, and Mexico automatically qualified as hosts and do not participate in this qualifier. CONCACAF has a total of 3 direct qualifying spots and 2 intercontinental playoff spots.
            {"\n\n"}
            The CONCACAF and Caribbean Football Federation has a total of 35 member countries. Excluding the 3 host countries, there are 32 member countries participating in this qualifier. The competition consists of three stages.
            {"\n\n"}
            <Text style={{ fontWeight: "bold" }}>Competition Format:</Text>
            {"\n\n"}
            <Text style={{ fontWeight: "bold" }}>Stage 1:</Text> Based on FIFA rankings, teams ranked 29-32 are divided into two groups for home-and-away matches. The winning teams advance to Stage 2.
            {"\n\n"}
            <Text style={{ fontWeight: "bold" }}>Stage 2:</Text> 30 teams (ranked 1-28 plus the 2 Stage 1 winners) are divided into 6 groups of 5 teams each. Groups play single round-robin matches (two home, two away). The top 2 teams from each group advance to Stage 3.
            {"\n\n"}
            <Text style={{ fontWeight: "bold" }}>Stage 3:</Text> The 12 teams from Stage 2 are divided into 3 groups of 4 teams each. Groups play home-and-away double round-robin matches. The top team from each of the 3 groups directly qualifies for the 2026 FIFA World Cup, while the two best second-place teams secure intercontinental playoff spots.
            {"\n\n"}
            <Text style={{ fontWeight: "bold" }}>Teams Qualified for World Cup:</Text> United States, Canada, Mexico (hosts)
            {"\n\n"}
            <Text style={{ fontWeight: "bold" }}>Teams in Intercontinental Playoffs:</Text> None yet
            {"\n\n"}
            This table uses placeholder data (Team 1, Team 2, etc.) which will be replaced with actual team names when real match data is available through the API.
          </Text>
        </View>
      </ScrollView>
    );
  };

  const renderOtherContent = (tabName: string) => {
    return (
      <View style={[styles.placeholderContainer, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.placeholderText, { color: theme.colors.textSecondary }]}>
          {tabName} content coming soon...
        </Text>
      </View>
    );
  };

  const renderTabContent = () => {
    const commonProps = {
      currentTeamName,
      theme,
      teamColors,
      isDarkMode,
    };

    switch (selectedTab) {
      case "stage-3":
        return renderStage3Content();
      case "stage-2":
        return <FIFACONCACAFStage2 {...commonProps} />;
      case "gold-cup":
        return <GoldCupGroups {...commonProps} />;
      case "champions-cup":
        return <CONCACAFChampionsCup {...commonProps} />;
      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Tab Navigation */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            selectedTab === "stage-3" && styles.activeTabButton,
            selectedTab === "stage-3" && { borderBottomColor: teamColors.primary },
          ]}
          onPress={() => setSelectedTab("stage-3")}
        >
          <Text
            style={[
              styles.tabButtonText,
              { color: selectedTab === "stage-3" ? teamColors.primary : theme.colors.textSecondary },
            ]}
          >
            FIFA CONCACAF Stage 3
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            selectedTab === "stage-2" && styles.activeTabButton,
            selectedTab === "stage-2" && { borderBottomColor: teamColors.primary },
          ]}
          onPress={() => setSelectedTab("stage-2")}
        >
          <Text
            style={[
              styles.tabButtonText,
              { color: selectedTab === "stage-2" ? teamColors.primary : theme.colors.textSecondary },
            ]}
          >
            FIFA CONCACAF Stage 2
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            selectedTab === "gold-cup" && styles.activeTabButton,
            selectedTab === "gold-cup" && { borderBottomColor: teamColors.primary },
          ]}
          onPress={() => setSelectedTab("gold-cup")}
        >
          <Text
            style={[
              styles.tabButtonText,
              { color: selectedTab === "gold-cup" ? teamColors.primary : theme.colors.textSecondary },
            ]}
          >
            CONCACAF Gold Cup Groups
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            selectedTab === "champions-cup" && styles.activeTabButton,
            selectedTab === "champions-cup" && { borderBottomColor: teamColors.primary },
          ]}
          onPress={() => setSelectedTab("champions-cup")}
        >
          <Text
            style={[
              styles.tabButtonText,
              { color: selectedTab === "champions-cup" ? teamColors.primary : theme.colors.textSecondary },
            ]}
          >
            CONCACAF Champions Cup
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Tab Content */}
      {renderTabContent()}
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
  placeholderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  placeholderText: {
    fontSize: 16,
    textAlign: "center",
  },
});

