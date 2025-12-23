/**
 * Player Market Value Changes Graph Component
 *
 * Interactive graph showing player's market value evolution over time.
 * Features draggable timeline, team logos, and smart value formatting.
 * Separated from main player info screen for better code organization.
 */

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { ChevronRight } from "lucide-react-native";
import Svg, {
  Circle,
  Line,
  Text as SvgText,
  Path,
} from "react-native-svg";

const { width } = Dimensions.get("window");

interface MarketValueHistoryItem {
  year: number;
  value: number;
  team: string;
  teamLogo: string;
}

interface PlayerBasicInfo {
  age: number;
  currentTeam: {
    name: string;
    logo: string;
  };
  contract: {
    endDate: string;
  };
  marketValue: number;
}

interface NewsPlayerInfoChangesNetworthProps {
  marketValueHistory: MarketValueHistoryItem[];
  playerInfo: PlayerBasicInfo;
}

export default function NewsPlayerInfoChangesNetworth({
  marketValueHistory,
  playerInfo,
}: NewsPlayerInfoChangesNetworthProps) {
  const theme = useTheme();
  const [selectedGraphPoint, setSelectedGraphPoint] = useState<number | null>(null);

  // Calculate graph dimensions and points
  const graphWidth = width - 64; // Account for container padding
  const graphHeight = 200;
  const maxValue = Math.max(...marketValueHistory.map((h) => h.value));
  const minYear = Math.min(...marketValueHistory.map((h) => h.year));
  const maxYear = Math.max(...marketValueHistory.map((h) => h.year));

  const getGraphPoint = (item: MarketValueHistoryItem, index: number) => {
    const x = ((item.year - minYear) / (maxYear - minYear)) * (graphWidth - 60) + 30;
    const y = graphHeight - 30 - (item.value / maxValue) * (graphHeight - 60);
    return { x, y, ...item };
  };

  const graphPoints = marketValueHistory.map(getGraphPoint);

  const formatMarketValue = (value: number): string => {
    if (value >= 1000) return `${(value / 1000).toFixed(0)}B`;
    if (value >= 1) return `${value.toFixed(0)}M`;
    return `${(value * 1000).toFixed(0)}K`;
  };

  const handleGraphPointPress = (index: number) => {
    setSelectedGraphPoint(selectedGraphPoint === index ? null : index);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.backgroundSecondary }]}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        Market Value History (€M)
      </Text>

      <View style={styles.graphContainer}>
        <Svg width={graphWidth} height={graphHeight} style={styles.graph}>
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = graphHeight - 30 - ratio * (graphHeight - 60);
            return (
              <Line
                key={ratio}
                x1="30"
                y1={y}
                x2={graphWidth - 30}
                y2={y}
                stroke={theme.colors.border}
                strokeWidth="1"
                opacity="0.3"
              />
            );
          })}

          {/* Y-axis labels */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = graphHeight - 30 - ratio * (graphHeight - 60);
            const value = ratio * maxValue;
            return (
              <SvgText
                key={ratio}
                x="20"
                y={y + 5}
                fontSize="12"
                fill={theme.colors.textSecondary}
                textAnchor="end"
              >
                {formatMarketValue(value)}
              </SvgText>
            );
          })}

          {/* Graph line */}
          <Path
            d={`M ${graphPoints.map((p) => `${p.x},${p.y}`).join(" L ")}`}
            stroke={theme.colors.primary}
            strokeWidth="3"
            fill="none"
          />

          {/* Data points */}
          {graphPoints.map((point, index) => (
            <Circle
              key={index}
              cx={point.x}
              cy={point.y}
              r="6"
              fill={selectedGraphPoint === index ? theme.colors.accent : theme.colors.primary}
              stroke="white"
              strokeWidth="2"
              onPress={() => handleGraphPointPress(index)}
            />
          ))}

          {/* X-axis labels */}
          {graphPoints
            .filter((_, i) => i % 2 === 0)
            .map((point, index) => (
              <SvgText
                key={index}
                x={point.x}
                y={graphHeight - 10}
                fontSize="12"
                fill={theme.colors.textSecondary}
                textAnchor="middle"
              >
                {point.year}
              </SvgText>
            ))}
        </Svg>
      </View>

      {/* Selected point details */}
      {selectedGraphPoint !== null && (
        <View style={[styles.selectedPointDetails, { backgroundColor: theme.colors.background }]}>
          <View style={styles.selectedPointInfo}>
            <Text style={[styles.selectedYear, { color: theme.colors.text }]}>
              {graphPoints[selectedGraphPoint].year}
            </Text>
            <Text style={[styles.selectedValue, { color: theme.colors.primary }]}>
              €{formatMarketValue(graphPoints[selectedGraphPoint].value)}
            </Text>
            <Text style={[styles.selectedTeam, { color: theme.colors.textSecondary }]}>
              {graphPoints[selectedGraphPoint].team}
            </Text>
          </View>
          <Image
            source={{ uri: graphPoints[selectedGraphPoint].teamLogo }}
            style={styles.selectedTeamLogo}
          />
        </View>
      )}

      {/* Current market value display */}
      <TouchableOpacity
        style={styles.currentValueContainer}
        onPress={() => setSelectedGraphPoint(null)}
      >
        <Image
          source={{ uri: playerInfo.currentTeam.logo }}
          style={styles.teamLogo}
        />
        <View style={styles.currentValueInfo}>
          <Text style={[styles.currentValueDate, { color: theme.colors.textSecondary }]}>
            {playerInfo.contract.endDate} {playerInfo.age} years
          </Text>
          <Text style={[styles.currentTeam, { color: theme.colors.text }]}>
            {playerInfo.currentTeam.name}
          </Text>
        </View>
        <View style={styles.currentValueAmount}>
          <Text style={[styles.currentValue, { color: theme.colors.primary }]}>
            {formatMarketValue(playerInfo.marketValue * 10)}€
          </Text>
        </View>
        <ChevronRight size={20} color={theme.colors.textSecondary} />
      </TouchableOpacity>

      {/* Value change indicator */}
      {marketValueHistory.length > 1 && (
        <View style={styles.valueChangeContainer}>
          <View style={styles.valueChangeInfo}>
            <Text style={[styles.valueChangeLabel, { color: theme.colors.textSecondary }]}>
              1 Year Change
            </Text>
            <Text
              style={[
                styles.valueChangeValue,
                {
                  color:
                    marketValueHistory[marketValueHistory.length - 1].value >
                    marketValueHistory[marketValueHistory.length - 2].value
                      ? theme.colors.success
                      : theme.colors.error,
                },
              ]}
            >
              {marketValueHistory[marketValueHistory.length - 1].value >
              marketValueHistory[marketValueHistory.length - 2].value
                ? "+"
                : ""}
              {(
                marketValueHistory[marketValueHistory.length - 1].value -
                marketValueHistory[marketValueHistory.length - 2].value
              ).toFixed(0)}
              M
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  graphContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  graph: {
    backgroundColor: "transparent",
  },
  selectedPointDetails: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  selectedPointInfo: {
    flex: 1,
  },
  selectedYear: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 2,
  },
  selectedValue: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 2,
  },
  selectedTeam: {
    fontSize: 14,
  },
  selectedTeamLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  currentValueContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  teamLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  currentValueInfo: {
    flex: 1,
  },
  currentValueDate: {
    fontSize: 14,
    marginBottom: 2,
  },
  currentTeam: {
    fontSize: 16,
    fontWeight: "600",
  },
  currentValueAmount: {
    alignItems: "flex-end",
    marginRight: 8,
  },
  currentValue: {
    fontSize: 18,
    fontWeight: "bold",
  },
  valueChangeContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
  },
  valueChangeInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  valueChangeLabel: {
    fontSize: 14,
  },
  valueChangeValue: {
    fontSize: 16,
    fontWeight: "bold",
  },
});
