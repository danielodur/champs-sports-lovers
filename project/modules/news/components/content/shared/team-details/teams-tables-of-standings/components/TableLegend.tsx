/**
 * Table Legend Component
 * 
 * Displays the legend explaining promotion/relegation zones and status colors
 * Adapts based on league type (domestic league vs international competition)
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { TeamStanding } from "@/services/leagueStandingsService";

interface TableLegendProps {
  leagueType?: string; // "League" or "Cup"
  theme: any;
  customLegendItems?: { color: string; label: string }[];
  standings?: TeamStanding[][]; // Array of groups, each containing standings
}

export default function TableLegend({
  leagueType = "League",
  theme,
  customLegendItems,
  standings,
}: TableLegendProps) {
  
  // Helper function to get color based on description
  const getDescriptionColor = (description: string): string => {
    const desc = description.toLowerCase();
    
    if (desc.includes("champions")) return "#4CAF50";
    if (desc.includes("europa") || desc.includes("confederation")) return "#FF9800";
    if (desc.includes("conference")) return "#2196F3";
    if (desc.includes("promotion")) return "#4CAF50";
    if (desc.includes("playoff")) return "#2196F3";
    if (desc.includes("relegation")) return "#F44336";
    
    return "#9E9E9E";
  };
  
  // Generate legend from actual standings data if available
  const generateLegendFromStandings = (): { color: string; label: string }[] => {
    if (!standings || standings.length === 0) return [];
    
    const uniqueDescriptions = new Set<string>();
    
    // Collect all unique descriptions from all groups
    standings.forEach(group => {
      group.forEach(team => {
        if (team.description && team.description.trim() !== "") {
          uniqueDescriptions.add(team.description);
        }
      });
    });
    
    // Convert to legend items with colors
    return Array.from(uniqueDescriptions).map(desc => ({
      color: getDescriptionColor(desc),
      label: desc,
    }));
  };
  
  // Default legend items based on league type (fallback if no standings data)
  const defaultLegendItems = leagueType === "Cup" 
    ? [
        { color: "#4CAF50", label: "Knockout Stage Qualification" },
        { color: "#2196F3", label: "Playoff Round" },
      ]
    : [
        { color: "#4CAF50", label: "Promotion / Champions League" },
        { color: "#FF9800", label: "Europa League" },
        { color: "#2196F3", label: "Conference League / Playoff" },
        { color: "#F44336", label: "Relegation" },
      ];

  // Priority: customLegendItems > generated from standings > defaults
  const legendItems = customLegendItems || generateLegendFromStandings() || defaultLegendItems;

  if (legendItems.length === 0) return null;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.backgroundSecondary },
      ]}
    >
      <Text style={[styles.title, { color: theme.colors.text }]}>
        Legend
      </Text>
      
      <View style={styles.legendGrid}>
        {legendItems.map((item, index) => (
          <View key={index} style={styles.legendItem}>
            <View
              style={[
                styles.colorBox,
                { backgroundColor: item.color },
              ]}
            />
            <Text
              style={[styles.legendText, { color: theme.colors.textSecondary }]}
              numberOfLines={2}
            >
              {item.label}
            </Text>
          </View>
        ))}
      </View>

      {/* Form Legend */}
      <View style={styles.formLegendContainer}>
        <Text style={[styles.formLegendTitle, { color: theme.colors.text }]}>
          Form (Last 5 Matches):
        </Text>
        <View style={styles.formLegend}>
          <View style={styles.formLegendItem}>
            <View style={[styles.formDot, { backgroundColor: "#4CAF50" }]}>
              <Text style={styles.formText}>W</Text>
            </View>
            <Text style={[styles.formLegendText, { color: theme.colors.textSecondary }]}>
              Win
            </Text>
          </View>
          <View style={styles.formLegendItem}>
            <View style={[styles.formDot, { backgroundColor: "#FF9800" }]}>
              <Text style={styles.formText}>D</Text>
            </View>
            <Text style={[styles.formLegendText, { color: theme.colors.textSecondary }]}>
              Draw
            </Text>
          </View>
          <View style={styles.formLegendItem}>
            <View style={[styles.formDot, { backgroundColor: "#F44336" }]}>
              <Text style={styles.formText}>L</Text>
            </View>
            <Text style={[styles.formLegendText, { color: theme.colors.textSecondary }]}>
              Loss
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  title: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 12,
  },
  legendGrid: {
    gap: 8,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 4,
  },
  colorBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    flex: 1,
  },
  formLegendContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  formLegendTitle: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
  },
  formLegend: {
    flexDirection: "row",
    gap: 16,
  },
  formLegendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  formDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  formText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "bold",
  },
  formLegendText: {
    fontSize: 12,
  },
});

