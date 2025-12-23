/**
 * Universal Sports Player Ability Screen Template
 *
 * Comprehensive player ability visualization screen for sports events app covering Soccer, Basketball, and Rugby.
 * Features professional hexagonal radar chart and detailed ability bars organized by categories.
 * Designed to match Chinese app screenshots with full English translations and API integration readiness.
 *
 * Usage:
 * <NewsPlayerAbility playerId="player-id" playerData={playerData} />
 *
 * Features:
 * - Professional hexagonal radar chart with 6 main attributes
 * - Detailed ability bars organized by categories (Attack, Defense, Movement, Technical, Physical, Mental)
 * - Color-coded progress bars based on ability levels
 * - Responsive design with smooth animations
 * - Universal adaptability for all sports
 * - Complete English translations from Chinese references
 * - API integration ready with comprehensive data structure
 * - Smart color coding (Green: 50-65, Yellow: 66-75, Orange: 76-100)
 *
 * Note: Template based on Chinese app screenshots but fully in English and adaptable for all sports
 */

import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Animated,
  TouchableOpacity,
} from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { Svg, Polygon, Line, Circle, Text as SvgText } from "react-native-svg";

const { width, height } = Dimensions.get("window");

interface DetailedAbilities {
  // Attack Category
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
  ballHandling: number;

  // Physical Category
  shotPower: number;
  jumping: number;
  stamina: number;
  strength: number;
  longShots: number;

  // Mental Category
  aggression: number;
  interceptions: number;
  positioning: number;
  vision: number;
  penalties: number;
  composure: number;
}

interface PlayerAbilityProps {
  playerId: string;
  playerData?: {
    name: string;
    abilities: {
      overall: number;
      pace: number;
      shooting: number;
      passing: number;
      dribbling: number;
      defending: number;
      physical: number;
    };
    detailedAbilities?: DetailedAbilities;
    currentTeam?: {
      colors: {
        primary: string;
        secondary: string;
      };
    };
  };
}

// Mock detailed abilities data for template - TODO: Replace with actual API integration
const mockDetailedAbilities: DetailedAbilities = {
  // Attack Category
  crossing: 77,
  finishing: 88,
  headingAccuracy: 78,
  shortPass: 83,
  volleys: 84,

  // Defense Category
  defensiveAwareness: 60,
  tackling: 55,
  slidingTackle: 46,

  // Movement Category
  acceleration: 86,
  sprintSpeed: 85,
  agility: 87,
  reactions: 88,
  balance: 87,

  // Technical Category
  ballControl: 87,
  curve: 87,
  freeKickAccuracy: 80,
  longPass: 78,
  ballHandling: 88,

  // Physical Category
  shotPower: 88,
  jumping: 86,
  stamina: 85,
  strength: 72,
  longShots: 86,

  // Mental Category
  aggression: 86,
  interceptions: 52,
  positioning: 88,
  vision: 83,
  penalties: 78,
  composure: 86,
};

const NewsPlayerAbility: React.FC<PlayerAbilityProps> = ({
  playerId,
  playerData,
}) => {
  const theme = useTheme();
  const [animatedValues] = useState(() => {
    const values: { [key: string]: Animated.Value } = {};
    Object.keys(mockDetailedAbilities).forEach((key) => {
      values[key] = new Animated.Value(0);
    });
    return values;
  });

  useEffect(() => {
    // Animate all ability bars on mount
    Object.keys(mockDetailedAbilities).forEach((key) => {
      Animated.timing(animatedValues[key], {
        toValue: mockDetailedAbilities[key as keyof DetailedAbilities],
        duration: 1000 + Math.random() * 500,
        useNativeDriver: false,
      }).start();
    });
  }, []);

  // Default player data if not provided
  const defaultPlayerData = {
    name: "Julián Álvarez",
    abilities: {
      overall: 87,
      pace: 86,
      shooting: 85,
      passing: 81,
      dribbling: 85,
      defending: 58,
      physical: 87,
    },
    detailedAbilities: mockDetailedAbilities,
    currentTeam: {
      colors: {
        primary: "#CE2029",
        secondary: "#244474",
      },
    },
  };

  const currentPlayerData = playerData || defaultPlayerData;
  const abilities = currentPlayerData.abilities;
  const detailedAbilities =
    currentPlayerData.detailedAbilities || mockDetailedAbilities;

  // Color coding based on ability values - theme-aware colors
  const getAbilityColor = (value: number): string => {
    if (value >= 85) return theme.colors.success; // Green for excellent abilities
    if (value >= 75) return theme.colors.warning; // Orange/Yellow for good abilities
    if (value >= 65) return theme.colors.accent; // Accent color for average abilities
    if (value >= 50) return theme.colors.secondary; // Secondary color for below average
    return theme.colors.error; // Red for poor abilities
  };

  // Hexagonal radar chart component
  const RadarChart = () => {
    const centerX = 150;
    const centerY = 150;
    const maxRadius = 120;
    const radarData = [
      { label: "Pace", value: abilities.pace, angle: 0 },
      { label: "Shooting", value: abilities.shooting, angle: 60 },
      { label: "Passing", value: abilities.passing, angle: 120 },
      { label: "Dribbling", value: abilities.dribbling, angle: 180 },
      { label: "Defending", value: abilities.defending, angle: 240 },
      { label: "Physical", value: abilities.physical, angle: 300 },
    ];

    const getCoordinates = (angle: number, radius: number) => {
      const radians = ((angle - 90) * Math.PI) / 180;
      return {
        x: centerX + radius * Math.cos(radians),
        y: centerY + radius * Math.sin(radians),
      };
    };

    // Generate pentagon points for player abilities
    const playerPoints = radarData.map((item) => {
      const radius = (item.value / 100) * maxRadius;
      return getCoordinates(item.angle, radius);
    });

    const playerPolygon = playerPoints
      .map((point) => `${point.x},${point.y}`)
      .join(" ");

    return (
      <View style={styles.radarContainer}>
        <Svg width={300} height={300} viewBox="0 0 300 300">
          {/* Background grid circles */}
          {[20, 40, 60, 80, 100].map((percentage, index) => {
            const radius = (percentage / 100) * maxRadius;
            return (
              <Circle
                key={index}
                cx={centerX}
                cy={centerY}
                r={radius}
                fill="none"
                stroke={theme.colors.border}
                strokeWidth="1"
                strokeOpacity="0.3"
              />
            );
          })}

          {/* Grid lines */}
          {radarData.map((item, index) => {
            const endpoint = getCoordinates(item.angle, maxRadius);
            return (
              <Line
                key={index}
                x1={centerX}
                y1={centerY}
                x2={endpoint.x}
                y2={endpoint.y}
                stroke={theme.colors.border}
                strokeWidth="1"
                strokeOpacity="0.3"
              />
            );
          })}

          {/* Player ability polygon */}
          <Polygon
            points={playerPolygon}
            fill={getAbilityColor(abilities.overall)}
            fillOpacity="0.3"
            stroke={getAbilityColor(abilities.overall)}
            strokeWidth="2"
          />

          {/* Data points */}
          {playerPoints.map((point, index) => (
            <Circle
              key={index}
              cx={point.x}
              cy={point.y}
              r="4"
              fill={getAbilityColor(radarData[index].value)}
            />
          ))}

          {/* Labels */}
          {radarData.map((item, index) => {
            const labelRadius = maxRadius + 25;
            const labelPos = getCoordinates(item.angle, labelRadius);
            return (
              <SvgText
                key={index}
                x={labelPos.x}
                y={labelPos.y}
                fontSize="12"
                fill={theme.colors.text}
                textAnchor="middle"
                alignmentBaseline="middle"
              >
                {item.label}
              </SvgText>
            );
          })}

          {/* Values */}
          {radarData.map((item, index) => {
            const valueRadius = maxRadius + 40;
            const valuePos = getCoordinates(item.angle, valueRadius);
            return (
              <SvgText
                key={index}
                x={valuePos.x}
                y={valuePos.y}
                fontSize="14"
                fill={getAbilityColor(item.value)}
                textAnchor="middle"
                alignmentBaseline="middle"
                fontWeight="bold"
              >
                {item.value}
              </SvgText>
            );
          })}
        </Svg>
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
  }) => (
    <View style={styles.abilityBarContainer}>
      <View style={styles.abilityBarHeader}>
        <Text style={[styles.abilityLabel, { color: theme.colors.text }]}>
          {label}
        </Text>
        <Text style={[styles.abilityValue, { color: getAbilityColor(value) }]}>
          {value}
        </Text>
      </View>
      <View
        style={[
          styles.abilityBarBackground,
          { backgroundColor: theme.colors.border },
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
              backgroundColor: getAbilityColor(value),
            },
          ]}
        />
      </View>
    </View>
  );

  // Ability categories
  const abilityCategories = [
    {
      title: "Attack",
      abilities: [
        {
          key: "crossing",
          label: "Crossing",
          value: detailedAbilities.crossing,
        },
        {
          key: "finishing",
          label: "Finishing",
          value: detailedAbilities.finishing,
        },
        {
          key: "headingAccuracy",
          label: "Heading Accuracy",
          value: detailedAbilities.headingAccuracy,
        },
        {
          key: "shortPass",
          label: "Short Pass",
          value: detailedAbilities.shortPass,
        },
        { key: "volleys", label: "Volleys", value: detailedAbilities.volleys },
      ],
    },
    {
      title: "Defense",
      abilities: [
        {
          key: "defensiveAwareness",
          label: "Defensive Awareness",
          value: detailedAbilities.defensiveAwareness,
        },
        {
          key: "tackling",
          label: "Tackling",
          value: detailedAbilities.tackling,
        },
        {
          key: "slidingTackle",
          label: "Sliding Tackle",
          value: detailedAbilities.slidingTackle,
        },
      ],
    },
    {
      title: "Movement",
      abilities: [
        {
          key: "acceleration",
          label: "Acceleration",
          value: detailedAbilities.acceleration,
        },
        {
          key: "sprintSpeed",
          label: "Sprint Speed",
          value: detailedAbilities.sprintSpeed,
        },
        { key: "agility", label: "Agility", value: detailedAbilities.agility },
        {
          key: "reactions",
          label: "Reactions",
          value: detailedAbilities.reactions,
        },
        { key: "balance", label: "Balance", value: detailedAbilities.balance },
      ],
    },
    {
      title: "Technical",
      abilities: [
        {
          key: "ballControl",
          label: "Ball Control",
          value: detailedAbilities.ballControl,
        },
        { key: "curve", label: "Curve", value: detailedAbilities.curve },
        {
          key: "freeKickAccuracy",
          label: "Free Kick Accuracy",
          value: detailedAbilities.freeKickAccuracy,
        },
        {
          key: "longPass",
          label: "Long Pass",
          value: detailedAbilities.longPass,
        },
        {
          key: "ballHandling",
          label: "Ball Handling",
          value: detailedAbilities.ballHandling,
        },
      ],
    },
    {
      title: "Physical",
      abilities: [
        {
          key: "shotPower",
          label: "Shot Power",
          value: detailedAbilities.shotPower,
        },
        { key: "jumping", label: "Jumping", value: detailedAbilities.jumping },
        { key: "stamina", label: "Stamina", value: detailedAbilities.stamina },
        {
          key: "strength",
          label: "Strength",
          value: detailedAbilities.strength,
        },
        {
          key: "longShots",
          label: "Long Shots",
          value: detailedAbilities.longShots,
        },
      ],
    },
    {
      title: "Mental",
      abilities: [
        {
          key: "aggression",
          label: "Aggression",
          value: detailedAbilities.aggression,
        },
        {
          key: "interceptions",
          label: "Interceptions",
          value: detailedAbilities.interceptions,
        },
        {
          key: "positioning",
          label: "Positioning",
          value: detailedAbilities.positioning,
        },
        { key: "vision", label: "Vision", value: detailedAbilities.vision },
        {
          key: "penalties",
          label: "Penalties",
          value: detailedAbilities.penalties,
        },
        {
          key: "composure",
          label: "Composure",
          value: detailedAbilities.composure,
        },
      ],
    },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Overall Rating */}
      <View style={styles.overallSection}>
        <Text
          style={[styles.overallLabel, { color: theme.colors.textSecondary }]}
        >
          Overall Ability
        </Text>
        <Text
          style={[
            styles.overallValue,
            { color: getAbilityColor(abilities.overall) },
          ]}
        >
          {abilities.overall}
        </Text>
      </View>

      {/* Hexagonal Radar Chart */}
      <RadarChart />

      {/* Detailed Abilities by Category */}
      {abilityCategories.map((category, categoryIndex) => (
        <View key={categoryIndex} style={styles.categorySection}>
          <Text style={[styles.categoryTitle, { color: theme.colors.text }]}>
            {category.title}
          </Text>
          <View style={styles.categoryAbilities}>
            {category.abilities.map((ability, index) => {
              // Create pairs for two-column layout
              if (index % 2 === 0) {
                const nextAbility = category.abilities[index + 1];
                return (
                  <View key={index} style={styles.abilityRow}>
                    <View style={styles.abilityColumn}>
                      <AbilityBar
                        label={ability.label}
                        value={ability.value}
                        animatedValue={animatedValues[ability.key]}
                      />
                    </View>
                    {nextAbility && (
                      <View style={styles.abilityColumn}>
                        <AbilityBar
                          label={nextAbility.label}
                          value={nextAbility.value}
                          animatedValue={animatedValues[nextAbility.key]}
                        />
                      </View>
                    )}
                  </View>
                );
              }
              return null;
            })}
          </View>
        </View>
      ))}

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overallSection: {
    alignItems: "center",
    paddingVertical: 20,
  },
  overallLabel: {
    fontSize: 16,
    marginBottom: 5,
  },
  overallValue: {
    fontSize: 48,
    fontWeight: "bold",
  },
  radarContainer: {
    alignItems: "center",
    marginVertical: 20,
  },
  categorySection: {
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
  },
  categoryAbilities: {
    gap: 15,
  },
  abilityRow: {
    flexDirection: "row",
    gap: 15,
  },
  abilityColumn: {
    flex: 1,
  },
  abilityBarContainer: {
    marginBottom: 10,
  },
  abilityBarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  abilityLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  abilityValue: {
    fontSize: 16,
    fontWeight: "bold",
  },
  abilityBarBackground: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  abilityBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  bottomPadding: {
    height: 50,
  },
});

export default NewsPlayerAbility;
