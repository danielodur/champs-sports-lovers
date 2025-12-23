/**
 * Player Details - Ability Tab
 * Displays player abilities with radar chart and detailed ratings
 * Matches Chinese app design with full-width blocks and proper color coding
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Animated,
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

interface DetailedAbilities {
  // Offense Category
  crossing: number;
  finishing: number;
  headingAccuracy: number;
  shortPass: number;
  volleys: number;

  // Defense Category
  defensiveAwareness: number;
  tackling: number;
  slidingTackle: number;

  // Movement Category
  acceleration: number;
  sprintSpeed: number;
  agility: number;
  reactions: number;
  balance: number;

  // Technical Category
  ballControl: number;
  curve: number;
  freeKickAccuracy: number;
  longPass: number;

  // Body Category
  shotPower: number;
  jumping: number;
  stamina: number;
  strength: number;
  longShots: number;

  // Tactics Category
  aggression: number;
  interceptions: number;
  positioning: number;
  vision: number;
  penalties: number;
  composure: number;
}

interface PlayerDetailsAbilityProps {
  playerId: string;
  abilities: PlayerAbilities;
  detailedAbilities?: DetailedAbilities;
  theme: any;
  playerColors: {
    primary: string;
    secondary: string;
  };
  loading?: boolean;
  sport?: string; // ✅ Sport parameter (basketball/football)
}

export default function PlayerDetailsAbility({
  playerId,
  abilities,
  detailedAbilities,
  theme,
  playerColors,
  loading = false,
  sport = "football", // ✅ Default to football (already hidden for basketball via tab filter)
}: PlayerDetailsAbilityProps) {
  const isBasketball = sport === "basketball";
  console.log(`🏀⚽ [PlayerDetailsAbility] Sport: ${sport}, isBasketball: ${isBasketball}`);
  const [animatedValues] = useState(() => {
    const values: { [key: string]: Animated.Value } = {};
    if (detailedAbilities) {
      Object.keys(detailedAbilities).forEach((key) => {
        values[key] = new Animated.Value(0);
      });
    }
    // Always initialize all ability stats animated values
    const allAbilityKeys = [
      "crossing", "finishing", "headingAccuracy", "shortPass", "volleys",
      "defensiveAwareness", "tackling", "slidingTackle",
      "acceleration", "sprintSpeed", "agility", "reactions", "balance",
      "dribbling", "curve", "freeKickAccuracy", "longPass", "ballControl",
      "shotPower", "jumping", "stamina", "strength", "longShots",
      "aggression", "interceptions", "positioning", "vision", "penalties", "composure",
    ];
    allAbilityKeys.forEach((key) => {
      if (!values[key]) {
        values[key] = new Animated.Value(0);
      }
    });
    return values;
  });

  useEffect(() => {
    if (detailedAbilities) {
      Object.keys(detailedAbilities).forEach((key) => {
        if (animatedValues[key]) {
          Animated.timing(animatedValues[key], {
            toValue: detailedAbilities[key as keyof DetailedAbilities],
            duration: 800 + Math.random() * 400,
            useNativeDriver: false,
          }).start();
        }
      });
    }
    
    // Always animate all ability stats (use detailedAbilities if available, otherwise use fallback values)
    const allAbilityKeys = [
      "crossing", "finishing", "headingAccuracy", "shortPass", "volleys",
      "defensiveAwareness", "tackling", "slidingTackle",
      "acceleration", "sprintSpeed", "agility", "reactions", "balance",
      "dribbling", "curve", "freeKickAccuracy", "longPass", "ballControl",
      "shotPower", "jumping", "stamina", "strength", "longShots",
      "aggression", "interceptions", "positioning", "vision", "penalties", "composure",
    ];
    
    allAbilityKeys.forEach((key) => {
      if (animatedValues[key]) {
        let targetValue = detailedAbilities?.[key as keyof DetailedAbilities];
        
        // If not in detailedAbilities, calculate from main abilities
        if (targetValue === undefined) {
          switch (key) {
            case "finishing": targetValue = abilities.shooting; break;
            case "shortPass": targetValue = abilities.passing; break;
            case "crossing": targetValue = Math.round(abilities.passing * 0.8); break;
            case "headingAccuracy": targetValue = Math.round(abilities.shooting * 0.7); break;
            case "volleys": targetValue = Math.round(abilities.shooting * 0.85); break;
            case "defensiveAwareness": targetValue = Math.round(abilities.defending * 0.6); break;
            case "tackling": targetValue = Math.round(abilities.defending * 0.7); break;
            case "slidingTackle": targetValue = Math.round(abilities.defending * 0.65); break;
            case "acceleration": targetValue = Math.round(abilities.pace * 0.95); break;
            case "sprintSpeed": targetValue = Math.round(abilities.pace * 0.95); break;
            case "agility": targetValue = Math.round(abilities.dribbling * 0.9); break;
            case "reactions": targetValue = Math.round((abilities.shooting + abilities.passing) / 2); break;
            case "balance": targetValue = Math.round(abilities.physical * 0.85); break;
            case "dribbling": targetValue = abilities.dribbling; break;
            case "curve": targetValue = Math.round(abilities.passing * 0.85); break;
            case "freeKickAccuracy": targetValue = Math.round(abilities.passing * 0.75); break;
            case "longPass": targetValue = Math.round(abilities.passing * 0.8); break;
            case "ballControl": targetValue = Math.round(abilities.dribbling * 0.95); break;
            case "shotPower": targetValue = Math.round(abilities.shooting * 0.9); break;
            case "jumping": targetValue = Math.round(abilities.physical * 0.8); break;
            case "stamina": targetValue = Math.round(abilities.physical * 0.85); break;
            case "strength": targetValue = Math.round(abilities.physical * 0.75); break;
            case "longShots": targetValue = Math.round(abilities.shooting * 0.85); break;
            case "aggression": targetValue = Math.round(abilities.physical * 0.6); break;
            case "interceptions": targetValue = Math.round(abilities.defending * 0.7); break;
            case "positioning": targetValue = Math.round(abilities.shooting * 0.9); break;
            case "vision": targetValue = Math.round(abilities.passing * 0.9); break;
            case "penalties": targetValue = Math.round(abilities.shooting * 0.85); break;
            case "composure": targetValue = Math.round((abilities.shooting + abilities.passing) / 2); break;
            default: targetValue = 0;
          }
        }
        
        Animated.timing(animatedValues[key], {
          toValue: targetValue || 0,
          duration: 800 + Math.random() * 400,
          useNativeDriver: false,
        }).start();
      }
    });
  }, [detailedAbilities, abilities]);

  // Color coding based on ability values (matches Chinese app)
  const getAbilityColor = (value: number): string => {
    if (value >= 85) return "#FF3B30"; // Red for high values (85+)
    if (value >= 65) return "#FF9800"; // Orange for medium values (65-84)
    return "#4CAF50"; // Green for lower values (<65)
  };

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
        return getAbilityColor(value);
    }
  };

  // Render radar chart
  const renderRadarChart = () => {
    const radarSize = width * 0.9;
    const centerX = radarSize / 2;
    const centerY = radarSize / 2;
    const maxRadius = radarSize * 0.35;

    const radarData = [
      { label: "Speed", value: abilities.pace, angle: 0 },
      { label: "Shooting", value: abilities.shooting, angle: 60 },
      { label: "Passing", value: abilities.passing, angle: 120 },
      { label: "Dribbling", value: abilities.dribbling, angle: 180 },
      { label: "Defense", value: abilities.defending, angle: 240 },
      { label: "Physical", value: abilities.physical, angle: 300 },
    ];

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
      const points = radarData.map((attr) => {
        const coords = getCoordinates(attr.angle, radius);
        return `${coords.x},${coords.y}`;
      });
      return { points: points.join(" "), radius };
    });

    // Generate grid lines
    const gridLines = radarData.map((attr) => {
      const outer = getCoordinates(attr.angle, maxRadius);
      return { x1: centerX, y1: centerY, x2: outer.x, y2: outer.y };
    });

    // Generate player ability polygon
    const playerPoints = radarData.map((attr) => {
      const radius = (attr.value / 100) * maxRadius;
      return getCoordinates(attr.angle, radius);
    });
    const playerPolygon = playerPoints.map((p) => `${p.x},${p.y}`).join(" ");

    const isDarkMode = theme.colors.background === "#2A2A2A";
    const gridColor = isDarkMode ? "rgba(255, 255, 255, 0.4)" : "rgba(0, 0, 0, 0.3)";

    return (
      <View style={styles.radarSection}>
        <View style={styles.abilityHeader}>
          <View style={styles.abilityHeaderBackground}>
            <Text style={[styles.overallAbilityLabel, { color: theme.colors.textSecondary }]}>
              Overall Ability
            </Text>
            <Text style={styles.overallAbilityValue}>
              {abilities.overall}
            </Text>
          </View>
        </View>
        <View style={styles.radarContainer}>
          <Svg width={radarSize} height={radarSize + 30}>
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
              fillOpacity="0.3"
              stroke={playerColors.primary}
              strokeWidth="2.5"
            />

            {/* Attribute points and labels */}
            {radarData.map((attr, i) => {
              const point = playerPoints[i];
              let outer = getCoordinates(attr.angle, maxRadius + 50);
              const attrColor = getRadarAttributeColor(attr.label, attr.value);
              
              // Adjust positioning for bottom labels (Dribbling at 180 degrees) to prevent cutoff
              if (attr.angle === 180) {
                // Dribbling is at bottom - move it further down
                outer = {
                  x: outer.x,
                  y: outer.y + 15,
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
                  <Circle cx={point.x} cy={point.y} r="2.5" fill="white" />
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
                    y={outer.y + 10}
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
  };

  // Ability bar component
  const AbilityBar = ({
    label,
    value,
    animatedValue,
  }: {
    label: string;
    value: number;
    animatedValue: Animated.Value;
  }) => {
    const barColor = getAbilityColor(value);

    return (
      <View style={styles.abilityRow}>
        <Text style={[styles.abilityLabel, { color: theme.colors.text }]}>
          {label}
        </Text>
        <View style={styles.abilityBarContainer}>
          <View
            style={[
              styles.abilityBarBackground,
              {
                backgroundColor:
                  theme.dark || theme.colors.background === "#2A2A2A"
                    ? "rgba(255, 255, 255, 0.1)"
                    : "rgba(0, 0, 0, 0.1)",
              },
            ]}
          >
            <Animated.View
              style={[
                styles.abilityBarFill,
                {
                  width: animatedValue.interpolate({
                    inputRange: [0, 100],
                    outputRange: ["0%", "100%"],
                    extrapolate: "clamp",
                  }),
                  backgroundColor: barColor,
                },
              ]}
            />
          </View>
          <Text style={[styles.abilityValue, { color: barColor }]}>
            {value}
          </Text>
        </View>
      </View>
    );
  };

  // Two-column ability row component
  const TwoColumnAbilityRow = ({
    leftLabel,
    leftValue,
    leftAnimated,
    rightLabel,
    rightValue,
    rightAnimated,
  }: {
    leftLabel: string;
    leftValue: number;
    leftAnimated: Animated.Value;
    rightLabel: string;
    rightValue: number;
    rightAnimated: Animated.Value;
  }) => {
    const leftColor = getAbilityColor(leftValue);
    const rightColor = getAbilityColor(rightValue);

    return (
      <View style={styles.twoColumnRow}>
        {/* Left Column */}
        <View style={styles.halfColumn}>
          <View style={styles.abilityRow}>
            <Text style={[styles.abilityLabelCompact, { color: theme.colors.text }]}>
              {leftLabel}
            </Text>
            <View style={styles.abilityBarContainerCompact}>
              <View
                style={[
                  styles.abilityBarBackground,
                  {
                    backgroundColor:
                      theme.dark || theme.colors.background === "#2A2A2A"
                        ? "rgba(255, 255, 255, 0.1)"
                        : "rgba(0, 0, 0, 0.1)",
                  },
                ]}
              >
                <Animated.View
                  style={[
                    styles.abilityBarFill,
                    {
                      width: leftAnimated.interpolate({
                        inputRange: [0, 100],
                        outputRange: ["0%", "100%"],
                        extrapolate: "clamp",
                      }),
                      backgroundColor: leftColor,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.abilityValueCompact, { color: leftColor }]}>
                {leftValue}
              </Text>
            </View>
          </View>
        </View>

        {/* Right Column */}
        <View style={styles.halfColumn}>
          <View style={styles.abilityRow}>
            <Text style={[styles.abilityLabelCompact, { color: theme.colors.text }]}>
              {rightLabel}
            </Text>
            <View style={styles.abilityBarContainerCompact}>
              <View
                style={[
                  styles.abilityBarBackground,
                  {
                    backgroundColor:
                      theme.dark || theme.colors.background === "#2A2A2A"
                        ? "rgba(255, 255, 255, 0.1)"
                        : "rgba(0, 0, 0, 0.1)",
                  },
                ]}
              >
                <Animated.View
                  style={[
                    styles.abilityBarFill,
                    {
                      width: rightAnimated.interpolate({
                        inputRange: [0, 100],
                        outputRange: ["0%", "100%"],
                        extrapolate: "clamp",
                      }),
                      backgroundColor: rightColor,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.abilityValueCompact, { color: rightColor }]}>
                {rightValue}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
          Loading abilities...
        </Text>
      </View>
    );
  }

  // Always render radar chart if abilities object exists (even with zero values)
  // The radar chart will display properly with any numeric values

  // Helper function to get stat value with fallback
  const getStatValue = (key: keyof DetailedAbilities, fallback: number = 0): number => {
    if (detailedAbilities && detailedAbilities[key] !== undefined) {
      return detailedAbilities[key] || fallback;
    }
    return fallback;
  };

  // Render All Ability Sections
  const renderAttackingSection = () => {
    // Use detailedAbilities if available (real API data), otherwise use calculated values from main abilities
    const getValue = (key: keyof DetailedAbilities, fallback: number) => getStatValue(key, fallback);

    const sections = [
      {
        title: "Attacking",
        stats: [
          { label: "Crossing", value: getValue("crossing", Math.round(abilities.passing * 0.8)), key: "crossing" },
          { label: "Finishing", value: getValue("finishing", abilities.shooting), key: "finishing" },
          { label: "Heading Accuracy", value: getValue("headingAccuracy", Math.round(abilities.shooting * 0.7)), key: "headingAccuracy" },
          { label: "Short Pass", value: getValue("shortPass", abilities.passing), key: "shortPass" },
          { label: "Volley Shot", value: getValue("volleys", Math.round(abilities.shooting * 0.85)), key: "volleys" },
        ],
      },
      {
        title: "Defense",
        stats: [
          { label: "Defensive Awareness", value: getValue("defensiveAwareness", Math.round(abilities.defending * 0.6)), key: "defensiveAwareness" },
          { label: "Tackling", value: getValue("tackling", Math.round(abilities.defending * 0.7)), key: "tackling" },
          { label: "Sliding Tackle", value: getValue("slidingTackle", Math.round(abilities.defending * 0.65)), key: "slidingTackle" },
        ],
      },
      {
        title: "Movement",
        stats: [
          { label: "Acceleration", value: getValue("acceleration", Math.round(abilities.pace * 0.95)), key: "acceleration" },
          { label: "Sprint Speed", value: getValue("sprintSpeed", Math.round(abilities.pace * 0.95)), key: "sprintSpeed" },
          { label: "Agility", value: getValue("agility", Math.round(abilities.dribbling * 0.9)), key: "agility" },
          { label: "Reactions", value: getValue("reactions", Math.round((abilities.shooting + abilities.passing) / 2)), key: "reactions" },
          { label: "Balance", value: getValue("balance", Math.round(abilities.physical * 0.85)), key: "balance" },
        ],
      },
      {
        title: "Technique",
        stats: [
          { label: "Dribbling", value: abilities.dribbling, key: "dribbling" },
          { label: "Curve", value: getValue("curve", Math.round(abilities.passing * 0.85)), key: "curve" },
          { label: "Free Kick Accuracy", value: getValue("freeKickAccuracy", Math.round(abilities.passing * 0.75)), key: "freeKickAccuracy" },
          { label: "Long Pass", value: getValue("longPass", Math.round(abilities.passing * 0.8)), key: "longPass" },
          { label: "Ball Control", value: getValue("ballControl", Math.round(abilities.dribbling * 0.95)), key: "ballControl" },
        ],
      },
      {
        title: "Body",
        stats: [
          { label: "Shot Power", value: getValue("shotPower", Math.round(abilities.shooting * 0.9)), key: "shotPower" },
          { label: "Jumping", value: getValue("jumping", Math.round(abilities.physical * 0.8)), key: "jumping" },
          { label: "Stamina", value: getValue("stamina", Math.round(abilities.physical * 0.85)), key: "stamina" },
          { label: "Strength", value: getValue("strength", Math.round(abilities.physical * 0.75)), key: "strength" },
          { label: "Long Shots", value: getValue("longShots", Math.round(abilities.shooting * 0.85)), key: "longShots" },
        ],
      },
      {
        title: "Tactics",
        stats: [
          { label: "Aggression", value: getValue("aggression", Math.round(abilities.physical * 0.6)), key: "aggression" },
          { label: "Interceptions", value: getValue("interceptions", Math.round(abilities.defending * 0.7)), key: "interceptions" },
          { label: "Positioning", value: getValue("positioning", Math.round(abilities.shooting * 0.9)), key: "positioning" },
          { label: "Vision", value: getValue("vision", Math.round(abilities.passing * 0.9)), key: "vision" },
          { label: "Penalties", value: getValue("penalties", Math.round(abilities.shooting * 0.85)), key: "penalties" },
          { label: "Composure", value: getValue("composure", Math.round((abilities.shooting + abilities.passing) / 2)), key: "composure" },
        ],
      },
    ];

    return (
      <View style={styles.attackingSection}>
        {sections.map((section, sectionIndex) => (
          <React.Fragment key={sectionIndex}>
            <View style={styles.abilityCategorySection}>
              {/* Section Header - Only first section (Attacking) gets background */}
              <View style={styles.categoryHeader}>
                {sectionIndex === 0 ? (
                  <View style={styles.categoryHeaderBackground}>
                    <Text style={[styles.categoryHeaderLabel, { color: theme.colors.textSecondary }]}>
                      {section.title}
                    </Text>
                  </View>
                ) : (
                  <Text style={[styles.categoryHeaderLabel, { color: theme.colors.textSecondary }]}>
                    {section.title}
                  </Text>
                )}
              </View>

              {/* Section Stats */}
              <View style={styles.categoryStatsContainer}>
                {section.stats.map((stat) => (
                  <AbilityBar
                    key={stat.key}
                    label={stat.label}
                    value={stat.value}
                    animatedValue={animatedValues[stat.key] || new Animated.Value(stat.value)}
                  />
                ))}
              </View>
            </View>
            
            {/* Dull separator line between sections (except after last section) */}
            {sectionIndex < sections.length - 1 && (
              <View style={[
                styles.sectionSeparator,
                {
                  backgroundColor: theme.colors.background === "#2A2A2A"
                    ? "rgba(255, 255, 255, 0.1)"
                    : "rgba(0, 0, 0, 0.1)",
                },
              ]} />
            )}
          </React.Fragment>
        ))}
      </View>
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Radar Chart */}
      {renderRadarChart()}

      {/* Dark Thin Space Separator */}
      <View style={[
        styles.darkSeparator,
        {
          backgroundColor: theme.colors.background === "#2A2A2A"
            ? "rgba(255, 255, 255, 0.1)"
            : "rgba(0, 0, 0, 0.1)",
        },
      ]} />

      {/* All Ability Sections */}
      {renderAttackingSection()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 40,
    paddingHorizontal: 16,
  },
  radarSection: {
    marginTop: 4,
    marginBottom: 4,
    paddingBottom: 8,
    paddingTop: 16,
    backgroundColor: "transparent",
  },
  abilityHeader: {
    paddingHorizontal: 16,
    marginBottom: 16,
    alignItems: "flex-start",
  },
  abilityHeaderBackground: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255, 59, 48, 0.15)",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: "flex-start",
  },
  overallAbilityLabel: {
    fontSize: 18,
    fontWeight: "700",
  },
  overallAbilityValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FF3B30",
  },
  radarContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 20,
    paddingBottom: 0,
  },
  darkSeparator: {
    height: 8,
    marginVertical: 0,
    marginTop: 0,
    marginBottom: 0,
  },
  sectionSeparator: {
    height: 1,
    marginVertical: 16,
  },
  attackingSection: {
    marginTop: 4,
    marginBottom: 4,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: "transparent",
  },
  abilityCategorySection: {
    marginBottom: 0,
  },
  categoryHeader: {
    paddingHorizontal: 16,
    marginBottom: 16,
    alignItems: "flex-start",
  },
  categoryHeaderBackground: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 59, 48, 0.15)",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: "flex-start",
  },
  categoryHeaderLabel: {
    fontSize: 18,
    fontWeight: "700",
    paddingHorizontal: 0,
  },
  categoryStatsContainer: {
    paddingHorizontal: 16,
  },
  detailedSection: {
    paddingHorizontal: 0,
    paddingBottom: 16,
  },
  categorySection: {
    marginBottom: 0,
    paddingVertical: 16,
    backgroundColor: "transparent",
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  abilityRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    paddingHorizontal: 16,
  },
  abilityLabel: {
    fontSize: 14,
    width: 140,
    fontWeight: "500",
  },
  abilityBarContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  abilityBarBackground: {
    flex: 1,
    height: 10,
    borderRadius: 5,
    overflow: "hidden",
  },
  abilityBarFill: {
    height: "100%",
    borderRadius: 5,
  },
  abilityValue: {
    fontSize: 14,
    fontWeight: "700",
    width: 35,
    textAlign: "right",
  },
  twoColumnRow: {
    flexDirection: "row",
    marginBottom: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  halfColumn: {
    flex: 1,
  },
  abilityLabelCompact: {
    fontSize: 13,
    width: 70,
    fontWeight: "500",
  },
  abilityBarContainerCompact: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  abilityValueCompact: {
    fontSize: 13,
    fontWeight: "700",
    width: 28,
    textAlign: "right",
  },
});
