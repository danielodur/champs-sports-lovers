/**
 * Player Ability Preview Component
 * Shows a simplified preview of player abilities with "View All" button
 * Clicking "View All" navigates to the Ability tab
 */

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import Svg, {
  Circle,
  Line,
  Text as SvgText,
  Polygon,
} from "react-native-svg";

const { width } = Dimensions.get("window");

interface PlayerAbilities {
  overall: number;
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
}

interface PlayerAbilityPreviewProps {
  abilities: PlayerAbilities;
  theme: any;
  playerColors: {
    primary: string;
    secondary: string;
  };
  onViewAll?: () => void;
}

export default function PlayerAbilityPreview({
  abilities,
  theme,
  playerColors,
  onViewAll,
}: PlayerAbilityPreviewProps) {
  const isDarkMode = theme.colors.background === "#2A2A2A";
  const greyBackground = isDarkMode ? "#3A3A3A" : "#F5F5F5";
  const borderColor = isDarkMode ? "#4A4A4A" : "#E0E0E0";
  const gridColor = isDarkMode ? "rgba(255, 255, 255, 0.4)" : "rgba(0, 0, 0, 0.3)";

  const radarSize = 280;
  const centerX = radarSize / 2;
  const centerY = radarSize / 2;
  const maxRadius = 110;

  const attributes = [
    { label: "Speed", value: abilities.pace, angle: 0 },
    { label: "Shooting", value: abilities.shooting, angle: 60 },
    { label: "Passing", value: abilities.passing, angle: 120 },
    { label: "Dribbling", value: abilities.dribbling, angle: 180 },
    { label: "Defense", value: abilities.defending, angle: 240 },
    { label: "Physical", value: abilities.physical, angle: 300 },
  ];

  // Get specific color for radar chart attributes (matches Chinese app)
  const getRadarAttributeColor = (label: string, value: number): string => {
    switch (label) {
      case "Speed":
        return "#4CAF50"; // Green
      case "Shooting":
        return "#FF3B30"; // Red
      case "Passing":
        return "#FF9800"; // Orange-yellow
      case "Dribbling":
        return "#FF3B30"; // Red
      case "Defense":
        return "#4CAF50"; // Green
      case "Physical":
        return "#FFA726"; // Orange-yellowish
      default:
        return playerColors.primary;
    }
  };

  const getCoordinates = (angle: number, radius: number) => {
    const radians = ((angle - 90) * Math.PI) / 180;
    return {
      x: centerX + radius * Math.cos(radians),
      y: centerY + radius * Math.sin(radians),
    };
  };

  // Generate grid circles
  const gridCircles = [0.25, 0.5, 0.75, 1].map((ratio) => {
    const radius = maxRadius * ratio;
    const points = attributes.map((attr) => {
      const coords = getCoordinates(attr.angle, radius);
      return `${coords.x},${coords.y}`;
    });
    return { points: points.join(" "), radius };
  });

  // Generate grid lines
  const gridLines = attributes.map((attr) => {
    const outer = getCoordinates(attr.angle, maxRadius);
    return { x1: centerX, y1: centerY, x2: outer.x, y2: outer.y };
  });

  // Generate player ability polygon
  const playerPoints = attributes.map((attr) => {
    const radius = (attr.value / 100) * maxRadius;
    return getCoordinates(attr.angle, radius);
  });
  const playerPolygon = playerPoints.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <View style={[styles.abilitySection, { backgroundColor: greyBackground }]}>
      <View style={styles.abilityHeader}>
        <View style={styles.abilityTitleContainer}>
          <View style={styles.abilityTitleBackground}>
            <Text style={[styles.abilityTitleLabel, { color: theme.colors.textSecondary }]}>
              Overall Ability
            </Text>
            <Text style={styles.abilityTitleValue}>
              {abilities.overall}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={onViewAll}>
          <Text style={[styles.viewAllButton, { color: playerColors.primary }]}>
            View All &gt;
          </Text>
        </TouchableOpacity>
      </View>
      <View style={styles.radarContainer}>
        <Svg width={radarSize} height={radarSize}>
          {/* Grid circles - more visible */}
          {gridCircles.map((circle, i) => (
            <Polygon
              key={i}
              points={circle.points}
              fill="none"
              stroke={gridColor}
              strokeWidth="1"
              opacity="1"
            />
          ))}

          {/* Grid lines - more visible */}
          {gridLines.map((line, i) => (
            <Line
              key={i}
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke={gridColor}
              strokeWidth="1"
              opacity="1"
            />
          ))}

          {/* Player ability polygon */}
          <Polygon
            points={playerPolygon}
            fill={playerColors.primary}
            fillOpacity="0.35"
            stroke={playerColors.primary}
            strokeWidth="2.5"
          />

          {/* Attribute points and labels */}
          {attributes.map((attr, i) => {
            const point = playerPoints[i];
            let outer = getCoordinates(attr.angle, maxRadius + 40);
            const attrColor = getRadarAttributeColor(attr.label, attr.value);
            
            // Adjust positioning for Shooting (move left) and Passing (move right) to avoid header overlap
            if (attr.label === "Shooting") {
              // Move Shooting value to the left
              outer = {
                x: outer.x - 25,
                y: outer.y - 5,
              };
            } else if (attr.label === "Passing") {
              // Move Passing value to the right
              outer = {
                x: outer.x + 25,
                y: outer.y - 5,
              };
            }
            
            return (
              <React.Fragment key={i}>
                {/* Outer circle */}
                <Circle
                  cx={point.x}
                  cy={point.y}
                  r="5"
                  fill={attrColor}
                  stroke="white"
                  strokeWidth="1.5"
                />
                {/* Inner dot */}
                <Circle
                  cx={point.x}
                  cy={point.y}
                  r="2.5"
                  fill="white"
                />
                {/* Value above label */}
                <SvgText
                  x={outer.x}
                  y={outer.y - 8}
                  fontSize="14"
                  fill={attrColor}
                  textAnchor="middle"
                  fontWeight="700"
                  fontFamily="Inter-Bold"
                >
                  {attr.value}
                </SvgText>
                {/* Label below value */}
                <SvgText
                  x={outer.x}
                  y={outer.y + 8}
                  fontSize="12"
                  fill={theme.colors.text}
                  textAnchor="middle"
                  fontWeight="500"
                  fontFamily="Inter-Medium"
                >
                  {attr.label}
                </SvgText>
              </React.Fragment>
            );
          })}
        </Svg>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  abilitySection: {
    marginTop: 4,
    marginBottom: 4,
    paddingTop: 12,
    paddingBottom: 16,
    borderRadius: 0,
  },
  abilityHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  abilityTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  abilityTitleBackground: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255, 59, 48, 0.15)",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignSelf: "flex-start",
  },
  abilityTitleLabel: {
    fontSize: 18,
    fontWeight: "700",
  },
  abilityTitleValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FF3B30",
  },
  viewAllButton: {
    fontSize: 14,
    fontWeight: "600",
  },
  radarContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 8,
    paddingBottom: 20,
  },
});

