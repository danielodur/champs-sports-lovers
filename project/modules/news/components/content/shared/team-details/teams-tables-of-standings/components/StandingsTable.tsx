/**
 * Standings Table Component
 * 
 * Reusable component for displaying a single standings table
 * (single group or league table without groups)
 */

import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { TeamStanding } from "@/services/leagueStandingsService";

interface StandingsTableProps {
  standings: TeamStanding[];
  currentTeamName: string;
  theme: any;
  teamColors: { primary: string; secondary: string };
  isDarkMode: boolean;
  showGroup?: boolean;
  leagueId?: number;
}

export default function StandingsTable({
  standings,
  currentTeamName,
  theme,
  teamColors,
  isDarkMode,
  showGroup = false,
  leagueId,
}: StandingsTableProps) {
  const router = useRouter();

  const handleTeamPress = (team: TeamStanding["team"]) => {
    if (!team || !team.name) return;
    
    console.log(`👆 [StandingsTable] Team pressed: ${team.name} (ID: ${team.id})`);
    
    router.push({
      pathname: "/team-details",
      params: {
        teamName: team.name,
        teamId: team.id ? team.id.toString() : undefined,
        leagueId: leagueId ? leagueId.toString() : undefined,
        sport: "football", // ✅ Standings table is football-specific
      },
    });
  };
  
  return (
    <View style={styles.container}>
      {/* Horizontal Scrollable Table Wrapper */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={true}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollContainer}
      >
        <View style={styles.tableWrapper}>
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
            <Text style={[styles.headerCell, styles.posCol, { color: theme.colors.textSecondary }]}>
              #
            </Text>
            <Text style={[styles.headerCell, styles.teamCol, { color: theme.colors.textSecondary }]}>
              Team
            </Text>
            <Text style={[styles.headerCell, styles.statCol, { color: theme.colors.textSecondary }]}>
              MP
            </Text>
            <Text style={[styles.headerCell, styles.statCol, { color: theme.colors.textSecondary }]}>
              W
            </Text>
            <Text style={[styles.headerCell, styles.statCol, { color: theme.colors.textSecondary }]}>
              D
            </Text>
            <Text style={[styles.headerCell, styles.statCol, { color: theme.colors.textSecondary }]}>
              L
            </Text>
            <Text style={[styles.headerCell, styles.statCol, { color: theme.colors.textSecondary }]}>
              GD
            </Text>
            <Text style={[styles.headerCell, styles.ptsCol, { color: theme.colors.textSecondary }]}>
              PTS
            </Text>
            <Text style={[styles.headerCell, styles.formCol, { color: theme.colors.textSecondary }]}>
              Form
            </Text>
          </View>

      {/* Table Rows */}
      {standings.map((team, index) => {
        const isHighlighted =
          team.team.name.toLowerCase().includes(currentTeamName.toLowerCase()) ||
          currentTeamName.toLowerCase().includes(team.team.name.toLowerCase());

        const hasStatus = team.description && team.description.trim() !== "";

        return (
          <View key={team.team.id} style={styles.rowWrapper}>
            {/* Status Badge (if applicable) */}
            {hasStatus && (
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: getStatusColor(team.description || ""),
                  },
                ]}
              >
                <Text style={styles.statusBadgeText} numberOfLines={1}>
                  {getStatusLabel(team.description || "")}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.tableRow,
                {
                  backgroundColor: isHighlighted
                    ? isDarkMode
                      ? `${teamColors.primary}20`
                      : `${teamColors.primary}10`
                    : theme.colors.background,
                  borderLeftWidth: isHighlighted ? 3 : 0,
                  borderLeftColor: isHighlighted ? teamColors.primary : "transparent",
                  borderBottomColor: theme.colors.border,
                },
              ]}
              onPress={() => handleTeamPress(team.team)}
              activeOpacity={0.7}
            >
              {/* Position */}
              <Text
                style={[
                  styles.cellText,
                  styles.posCol,
                  {
                    color: isHighlighted ? teamColors.primary : theme.colors.textSecondary,
                    fontWeight: isHighlighted ? "bold" : "500",
                  },
                ]}
              >
                {team.rank}
              </Text>

              {/* Team */}
              <View style={styles.teamCol}>
                <Image source={{ uri: team.team.logo }} style={styles.teamLogo} />
                <Text
                  style={[
                    styles.teamName,
                    {
                      color: isHighlighted ? teamColors.primary : theme.colors.text,
                      fontWeight: isHighlighted ? "bold" : "600",
                    },
                  ]}
                  numberOfLines={1}
                >
                  {team.team.name}
                </Text>
              </View>

              {/* Matches Played */}
              <Text style={[styles.cellText, styles.statCol, { color: theme.colors.textSecondary }]}>
                {team.all.played}
              </Text>

              {/* Wins */}
              <Text style={[styles.cellText, styles.statCol, { color: theme.colors.textSecondary }]}>
                {team.all.win}
              </Text>

              {/* Draws */}
              <Text style={[styles.cellText, styles.statCol, { color: theme.colors.textSecondary }]}>
                {team.all.draw}
              </Text>

              {/* Losses */}
              <Text style={[styles.cellText, styles.statCol, { color: theme.colors.textSecondary }]}>
                {team.all.lose}
              </Text>

              {/* Goal Difference */}
              <Text
                style={[
                  styles.cellText,
                  styles.statCol,
                  {
                    color: team.goalsDiff > 0 ? "#4CAF50" : team.goalsDiff < 0 ? "#F44336" : theme.colors.textSecondary,
                    fontWeight: team.goalsDiff !== 0 ? "600" : "400",
                  },
                ]}
              >
                {team.goalsDiff > 0 ? "+" : ""}
                {team.goalsDiff}
              </Text>

              {/* Points */}
              <Text
                style={[
                  styles.cellText,
                  styles.ptsCol,
                  {
                    color: isHighlighted ? teamColors.primary : theme.colors.text,
                    fontWeight: "bold",
                  },
                ]}
              >
                {team.points}
              </Text>

              {/* Form */}
              <View style={[styles.formCol, styles.formContainer]}>
                {renderForm(team.form)}
              </View>
            </TouchableOpacity>
          </View>
        );
      })}
        </View>
      </ScrollView>
    </View>
  );
}

// Helper function to render form indicators
function renderForm(form: string) {
  if (!form) return null;

  const formArray = form.split("").slice(-5); // Last 5 matches

  return (
    <View style={styles.formIndicators}>
      {formArray.map((result, index) => {
        const backgroundColor =
          result === "W" ? "#4CAF50" : result === "D" ? "#FF9800" : result === "L" ? "#F44336" : "#666";

        return (
          <View key={index} style={[styles.formDot, { backgroundColor }]}>
            <Text style={styles.formText}>{result}</Text>
          </View>
        );
      })}
    </View>
  );
}

// Helper function to get status color based on description (API-driven)
function getStatusColor(description: string): string {
  const desc = description.toLowerCase();

  // Champions League variants (UCL, CAF Champions League, etc.)
  if (desc.includes("champions")) {
    return "#4CAF50"; // Green for Champions League
  }
  
  // Europa League variants (UEL, CAF Confederation, etc.)
  if (desc.includes("europa") || desc.includes("confederation")) {
    return "#FF9800"; // Orange for Europa League
  }
  
  // Conference League variants (UECL)
  if (desc.includes("conference")) {
    return "#2196F3"; // Blue for Conference
  }
  
  // Promotion
  if (desc.includes("promotion")) {
    return "#4CAF50"; // Green
  }
  
  // Playoff
  if (desc.includes("playoff")) {
    return "#2196F3"; // Blue for Playoff
  }
  
  // Relegation
  if (desc.includes("relegation")) {
    return "#F44336"; // Red for relegation
  }

  return "#9E9E9E"; // Grey default
}

// Helper function to get status label (shortened badge from API description)
function getStatusLabel(description: string): string {
  const desc = description.toLowerCase();

  // Champions League variants
  if (desc.includes("champions league")) return "UCL";
  if (desc.includes("caf champions")) return "CAF CL";
  
  // Europa/Confederation variants
  if (desc.includes("europa league")) return "UEL";
  if (desc.includes("confederation")) return "CAF CC";
  
  // Conference League
  if (desc.includes("conference league")) return "UECL";
  
  // Promotion
  if (desc.includes("promotion")) return "PROM";
  
  // Relegation
  if (desc.includes("relegation")) return "REL";
  
  // Playoff
  if (desc.includes("playoff")) return "PO";
  
  // Knockout/Qualification
  if (desc.includes("knockout")) return "KO";
  if (desc.includes("qualification")) return "QUAL";

  // If no match, create smart abbreviation from description
  // Take first letter of each word, max 5 characters
  const words = description.split(" ").filter(w => w.length > 2); // Filter out short words
  if (words.length > 0) {
    return words
      .slice(0, 3) // Max 3 words
      .map(w => w[0].toUpperCase())
      .join("");
  }
  
  // Fallback: first 10 characters uppercase
  return description.substring(0, 10).toUpperCase();
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    alignItems: "center",
  },
  headerCell: {
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
  },
  rowWrapper: {
    position: "relative",
  },
  statusBadge: {
    position: "absolute",
    top: -6,
    left: 8,
    zIndex: 10,
    paddingHorizontal: 6,
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
    paddingHorizontal: 8,
    alignItems: "center",
    borderBottomWidth: 0.5,
  },
  cellText: {
    fontSize: 13,
    textAlign: "center",
  },
  posCol: {
    width: 30,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  tableWrapper: {
    minWidth: 700, // Minimum width to ensure proper spacing
  },
  teamCol: {
    width: 200, // Fixed width instead of flex to allow scrolling
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingRight: 8,
  },
  teamLogo: {
    width: 24,
    height: 24,
    resizeMode: "contain",
  },
  teamName: {
    fontSize: 13,
    flex: 1,
  },
  statCol: {
    width: 40, // Increased from 32 for better spacing
  },
  ptsCol: {
    width: 45, // Increased from 35 for better spacing
  },
  formCol: {
    width: 110, // Increased from 90 for better spacing
  },
  formContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  formIndicators: {
    flexDirection: "row",
    gap: 2,
  },
  formDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  formText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "bold",
  },
});

