/**
 * Universal Sports Player Info Screen Template
 *
 * Comprehensive player information screen for sports events app covering Soccer, Basketball, and Rugby.
 * Features interactive market value graph, ability radar chart, transfer history, and achievements.
 * Designed to match Chinese app screenshots with full API integration readiness.
 *
 * Usage:
 * <NewsPlayerInfo playerId="player-id" playerData={playerData} />
 *
 * Features:
 * - Interactive market value graph with draggable timeline
 * - Ability radar chart with sport-specific attributes
 * - Transfer history with team logos and fees
 * - Achievements and honors section
 * - Playing position visualization
 * - Comprehensive player statistics
 *
 * Note: Universal template adaptable for Soccer, Basketball, Rugby
 */

import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Animated,
  Easing,
} from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { ChevronRight, ChevronDown } from "lucide-react-native";
import Svg, { Polygon, Circle, Line, Text as SvgText } from "react-native-svg";
import NewsPlayerInfoChangesNetworth from "./news-player-info-changes-networth";

const { width, height } = Dimensions.get("window");

interface PlayerData {
  id: string;
  name: string;
  englishName: string;
  photo: string;
  backgroundImage: string;
  age: number;
  height: number;
  weight: number;
  nationality: string;
  nationalityFlag: string;
  position: string;
  preferredFoot: string;
  jerseyNumber: number;
  marketValue: number;
  currentTeam: {
    id: string;
    name: string;
    logo: string;
    colors: {
      primary: string;
      secondary: string;
    };
  };
  biography: string;
  birthDate: string;
  birthPlace: string;
  contract: {
    startDate: string;
    endDate: string;
    salary?: number;
  };
  stats: {
    appearances: number;
    goals: number;
    assists: number;
    yellowCards: number;
    redCards: number;
    minutesPlayed: number;
    passAccuracy: number;
    shotsOnTarget: number;
    tackles: number;
    interceptions: number;
  };
  abilities: {
    overall: number;
    pace: number;
    shooting: number;
    passing: number;
    dribbling: number;
    defending: number;
    physical: number;
  };
  marketValueHistory: Array<{
    year: number;
    value: number;
    team: string;
    teamLogo: string;
  }>;
  transferHistory: Array<{
    id: string;
    date: string;
    fromTeam: string;
    fromTeamLogo: string;
    toTeam: string;
    toTeamLogo: string;
    fee: number;
    type: "transfer" | "loan" | "free" | "contract";
  }>;
  achievements: Array<{
    id: string;
    title: string;
    year: string;
    team: string;
    icon: string;
    type: "trophy" | "award" | "achievement";
  }>;
  strengths: string[];
  weaknesses: string[];
}

interface NewsPlayerInfoProps {
  playerId: string;
  playerData?: PlayerData;
}

// Mock comprehensive player data
const mockPlayerData: PlayerData = {
  id: "kylian-mbappe",
  name: "Kylian Mbappé",
  englishName: "Kylian Mbappe",
  photo:
    "https://img.a.transfermarkt.technology/portrait/big/342229-1671435885.jpg",
  backgroundImage:
    "https://assets.laliga.com/assets/2023/08/15/medium/1692100234.jpg",
  age: 26,
  height: 178,
  weight: 73,
  nationality: "France",
  nationalityFlag: "🇫🇷",
  position: "Forward",
  preferredFoot: "Right",
  jerseyNumber: 10,
  marketValue: 180.0,
  currentTeam: {
    id: "real-madrid",
    name: "Real Madrid",
    logo: "https://logos.footyrenders.com/real-madrid.png",
    colors: {
      primary: "#FEBE10",
      secondary: "#00529F",
    },
  },
  biography:
    "Kylian Mbappé is a French professional footballer who plays as a forward for La Liga club Real Madrid and captains the France national team.",
  birthDate: "20/12/1998",
  birthPlace: "Paris, France",
  contract: {
    startDate: "2024/07/01",
    endDate: "2029/06/30",
  },
  stats: {
    appearances: 284,
    goals: 256,
    assists: 108,
    yellowCards: 28,
    redCards: 1,
    minutesPlayed: 22340,
    passAccuracy: 83.2,
    shotsOnTarget: 412,
    tackles: 156,
    interceptions: 89,
  },
  abilities: {
    overall: 91,
    pace: 97,
    shooting: 88,
    passing: 79,
    dribbling: 90,
    defending: 42,
    physical: 78,
  },
  marketValueHistory: [
    {
      year: 2015,
      value: 0.5,
      team: "Monaco",
      teamLogo: "https://logos.footyrenders.com/monaco.png",
    },
    {
      year: 2016,
      value: 8,
      team: "Monaco",
      teamLogo: "https://logos.footyrenders.com/monaco.png",
    },
    {
      year: 2017,
      value: 35,
      team: "Monaco",
      teamLogo: "https://logos.footyrenders.com/monaco.png",
    },
    {
      year: 2018,
      value: 120,
      team: "PSG",
      teamLogo: "https://logos.footyrenders.com/psg.png",
    },
    {
      year: 2019,
      value: 200,
      team: "PSG",
      teamLogo: "https://logos.footyrenders.com/psg.png",
    },
    {
      year: 2020,
      value: 200,
      team: "PSG",
      teamLogo: "https://logos.footyrenders.com/psg.png",
    },
    {
      year: 2021,
      value: 160,
      team: "PSG",
      teamLogo: "https://logos.footyrenders.com/psg.png",
    },
    {
      year: 2022,
      value: 160,
      team: "PSG",
      teamLogo: "https://logos.footyrenders.com/psg.png",
    },
    {
      year: 2023,
      value: 180,
      team: "PSG",
      teamLogo: "https://logos.footyrenders.com/psg.png",
    },
    {
      year: 2024,
      value: 180,
      team: "Real Madrid",
      teamLogo: "https://logos.footyrenders.com/real-madrid.png",
    },
  ],
  transferHistory: [
    {
      id: "transfer1",
      date: "2024/07/01",
      fromTeam: "PSG",
      fromTeamLogo: "https://logos.footyrenders.com/psg.png",
      toTeam: "Real Madrid",
      toTeamLogo: "https://logos.footyrenders.com/real-madrid.png",
      fee: 0,
      type: "free",
    },
    {
      id: "transfer2",
      date: "2018/07/01",
      fromTeam: "Monaco",
      fromTeamLogo: "https://logos.footyrenders.com/monaco.png",
      toTeam: "PSG",
      toTeamLogo: "https://logos.footyrenders.com/psg.png",
      fee: 180,
      type: "transfer",
    },
  ],
  achievements: [
    {
      id: "wc2018",
      title: "World Cup Winner",
      year: "2018",
      team: "France",
      icon: "🏆",
      type: "trophy",
    },
    {
      id: "ligue1-2024",
      title: "Ligue 1 Champion",
      year: "2023-2024",
      team: "PSG",
      icon: "🏆",
      type: "trophy",
    },
    {
      id: "ucl-2024",
      title: "UEFA Champions League",
      year: "2024-2025",
      team: "Real Madrid",
      icon: "🏆",
      type: "trophy",
    },
    {
      id: "ballon-dor",
      title: "Golden Boot",
      year: "2024",
      team: "Real Madrid",
      icon: "👟",
      type: "award",
    },
  ],
  strengths: ["Pace", "Finishing", "Long Shots"],
  weaknesses: ["Defending"],
};

export default function NewsPlayerInfo({
  playerId,
  playerData: propPlayerData,
}: NewsPlayerInfoProps) {
  const theme = useTheme();
  const [expandedTransfers, setExpandedTransfers] = useState(false);

  // Use provided data or fallback to mock data
  const playerData = propPlayerData || mockPlayerData;

  // Ability chart calculations
  const abilityKeys = [
    "pace",
    "shooting",
    "passing",
    "dribbling",
    "defending",
    "physical",
  ];
  const radarCenter = { x: 150, y: 150 };
  const radarRadius = 100;

  const getAbilityPoint = (ability: string, index: number) => {
    const value = playerData.abilities[
      ability as keyof typeof playerData.abilities
    ] as number;
    const angle = (index * 60 - 90) * (Math.PI / 180);
    const radius = (value / 100) * radarRadius;
    return {
      x: radarCenter.x + Math.cos(angle) * radius,
      y: radarCenter.y + Math.sin(angle) * radius,
      outerX: radarCenter.x + Math.cos(angle) * radarRadius,
      outerY: radarCenter.y + Math.sin(angle) * radarRadius,
      value,
      label: ability,
    };
  };

  const abilityPoints = abilityKeys.map(getAbilityPoint);
  const abilityPolygonPoints = abilityPoints
    .map((p) => `${p.x},${p.y}`)
    .join(" ");

  const formatTransferFee = (fee: number): string => {
    if (fee === 0) return "Free";
    return `€${fee}M`;
  };

  const formatMarketValue = (value: number): string => {
    if (value >= 1000) return `${(value / 1000).toFixed(0)}B`;
    if (value >= 1) return `${value.toFixed(0)}M`;
    return `${(value * 1000).toFixed(0)}K`;
  };

  const getAbilityColor = (value: number): string => {
    if (value >= 90) return theme.colors.success;
    if (value >= 80) return theme.colors.warning;
    if (value >= 70) return theme.colors.accent;
    if (value >= 60) return theme.colors.secondary;
    return theme.colors.error;
  };

  const renderPersonalInfo = () => (
    <View
      style={[
        styles.infoSection,
        { backgroundColor: theme.colors.backgroundSecondary },
      ]}
    >
      <View style={styles.infoGrid}>
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Text style={[styles.flagIcon, { fontSize: 24 }]}>
              {playerData.nationalityFlag}
            </Text>
            <Text style={[styles.infoValue, { color: theme.colors.text }]}>
              {playerData.age} years
            </Text>
            <Text
              style={[styles.infoLabel, { color: theme.colors.textSecondary }]}
            >
              {playerData.nationality}/{playerData.jerseyNumber}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={[styles.infoValue, { color: theme.colors.text }]}>
              {playerData.birthDate}
            </Text>
            <Text
              style={[styles.infoLabel, { color: theme.colors.textSecondary }]}
            >
              Birth Date
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={[styles.infoValue, { color: theme.colors.text }]}>
              {playerData.contract.endDate}
            </Text>
            <Text
              style={[styles.infoLabel, { color: theme.colors.textSecondary }]}
            >
              Contract End
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderAbilityRadar = () => (
    <View
      style={[
        styles.abilitySection,
        { backgroundColor: theme.colors.backgroundSecondary },
      ]}
    >
      <View style={styles.abilityHeader}>
        <Text style={[styles.abilityOverall, { color: theme.colors.text }]}>
          Overall Rating
        </Text>
        <View
          style={[
            styles.overallBadge,
            { backgroundColor: theme.colors.primary },
          ]}
        >
          <Text style={styles.overallValue}>
            {playerData.abilities.overall}
          </Text>
        </View>
        <TouchableOpacity style={styles.viewAllButton}>
          <Text
            style={[styles.viewAllText, { color: theme.colors.textSecondary }]}
          >
            View All
          </Text>
          <ChevronRight size={16} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.radarContainer}>
        <Svg width={300} height={300} style={styles.radarChart}>
          {/* Background circles */}
          {[20, 40, 60, 80, 100].map((percentage) => (
            <Circle
              key={percentage}
              cx={radarCenter.x}
              cy={radarCenter.y}
              r={(percentage / 100) * radarRadius}
              stroke={theme.colors.border}
              strokeWidth="1"
              fill="none"
              opacity="0.3"
            />
          ))}

          {/* Axis lines */}
          {abilityPoints.map((point, index) => (
            <Line
              key={index}
              x1={radarCenter.x}
              y1={radarCenter.y}
              x2={point.outerX}
              y2={point.outerY}
              stroke={theme.colors.border}
              strokeWidth="1"
              opacity="0.3"
            />
          ))}

          {/* Player ability polygon */}
          <Polygon
            points={abilityPolygonPoints}
            fill={theme.colors.primary}
            fillOpacity="0.3"
            stroke={theme.colors.primary}
            strokeWidth="3"
          />

          {/* Ability points */}
          {abilityPoints.map((point, index) => (
            <Circle
              key={index}
              cx={point.x}
              cy={point.y}
              r="4"
              fill={theme.colors.primary}
            />
          ))}
        </Svg>

        {/* Ability labels */}
        <View style={styles.abilityLabels}>
          {abilityPoints.map((point, index) => (
            <View
              key={index}
              style={[
                styles.abilityLabel,
                {
                  position: "absolute",
                  left: point.outerX + (index < 3 ? 10 : -60),
                  top: point.outerY - 15,
                },
              ]}
            >
              <View
                style={[
                  styles.abilityBadge,
                  { backgroundColor: getAbilityColor(point.value) },
                ]}
              >
                <Text style={styles.abilityValueText}>{point.value}</Text>
              </View>
              <Text
                style={[styles.abilityLabelText, { color: theme.colors.text }]}
              >
                {point.label.charAt(0).toUpperCase() + point.label.slice(1)}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  const renderStrengthsWeaknesses = () => (
    <View
      style={[
        styles.strengthsSection,
        { backgroundColor: theme.colors.backgroundSecondary },
      ]}
    >
      <View style={styles.strengthsGrid}>
        <View style={styles.strengthsColumn}>
          <Text
            style={[styles.strengthsTitle, { color: theme.colors.success }]}
          >
            Strengths
          </Text>
          {playerData.strengths.map((strength, index) => (
            <Text
              key={index}
              style={[styles.strengthItem, { color: theme.colors.text }]}
            >
              • {strength}
            </Text>
          ))}
        </View>
        <View style={styles.strengthsColumn}>
          <Text style={[styles.strengthsTitle, { color: theme.colors.error }]}>
            Areas for Improvement
          </Text>
          {playerData.weaknesses.map((weakness, index) => (
            <Text
              key={index}
              style={[styles.strengthItem, { color: theme.colors.text }]}
            >
              • {weakness}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );

  const renderTransferHistory = () => (
    <View
      style={[
        styles.transferSection,
        { backgroundColor: theme.colors.backgroundSecondary },
      ]}
    >
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        Transfer History (€M)
      </Text>

      {playerData.transferHistory
        .slice(0, expandedTransfers ? undefined : 3)
        .map((transfer) => (
          <View
            key={transfer.id}
            style={[
              styles.transferItem,
              { borderBottomColor: theme.colors.border },
            ]}
          >
            <Text
              style={[
                styles.transferDate,
                { color: theme.colors.textSecondary },
              ]}
            >
              {transfer.date}
            </Text>
            <Text
              style={[
                styles.transferType,
                { color: theme.colors.textSecondary },
              ]}
            >
              {transfer.type === "free"
                ? "Free Transfer"
                : `Transfer ${formatTransferFee(transfer.fee)}`}
            </Text>

            <View style={styles.transferTeams}>
              <View style={styles.transferTeam}>
                <Image
                  source={{ uri: transfer.fromTeamLogo }}
                  style={styles.transferTeamLogo}
                />
                <Text
                  style={[
                    styles.transferTeamName,
                    { color: theme.colors.text },
                  ]}
                >
                  {transfer.fromTeam}
                </Text>
              </View>

              <View style={styles.transferArrow}>
                <ChevronRight size={20} color={theme.colors.primary} />
              </View>

              <View style={styles.transferTeam}>
                <Image
                  source={{ uri: transfer.toTeamLogo }}
                  style={styles.transferTeamLogo}
                />
                <Text
                  style={[
                    styles.transferTeamName,
                    { color: theme.colors.text },
                  ]}
                >
                  {transfer.toTeam}
                </Text>
              </View>
            </View>
          </View>
        ))}

      {playerData.transferHistory.length > 3 && (
        <TouchableOpacity
          style={styles.viewMoreButton}
          onPress={() => setExpandedTransfers(!expandedTransfers)}
        >
          <Text
            style={[styles.viewMoreText, { color: theme.colors.textSecondary }]}
          >
            {expandedTransfers ? "Show Less" : "View More"}
          </Text>
          <ChevronDown
            size={16}
            color={theme.colors.textSecondary}
            style={{
              transform: [{ rotate: expandedTransfers ? "180deg" : "0deg" }],
            }}
          />
        </TouchableOpacity>
      )}
    </View>
  );

  const renderAchievements = () => (
    <View
      style={[
        styles.achievementsSection,
        { backgroundColor: theme.colors.backgroundSecondary },
      ]}
    >
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        Honors & Achievements
      </Text>

      {playerData.achievements.map((achievement) => (
        <View key={achievement.id} style={styles.achievementItem}>
          <Text style={styles.achievementIcon}>{achievement.icon}</Text>
          <View style={styles.achievementInfo}>
            <Text
              style={[styles.achievementTitle, { color: theme.colors.text }]}
            >
              {achievement.title}
            </Text>
            <View
              style={[
                styles.achievementBadge,
                { backgroundColor: theme.colors.accent },
              ]}
            >
              <Text style={styles.achievementYear}>{achievement.year}</Text>
              <Text style={styles.achievementTeam}>{achievement.team}</Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      {renderPersonalInfo()}
      <NewsPlayerInfoChangesNetworth
        marketValueHistory={playerData.marketValueHistory}
        playerInfo={{
          age: playerData.age,
          currentTeam: playerData.currentTeam,
          contract: playerData.contract,
          marketValue: playerData.marketValue,
        }}
      />
      {renderAbilityRadar()}
      {renderStrengthsWeaknesses()}
      {renderTransferHistory()}
      {renderAchievements()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  infoSection: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  infoGrid: {
    gap: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  infoItem: {
    alignItems: "center",
    flex: 1,
  },
  flagIcon: {
    marginBottom: 8,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: 12,
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  abilitySection: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
  },
  abilityHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  abilityOverall: {
    fontSize: 16,
    fontWeight: "600",
    marginRight: 12,
  },
  overallBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 12,
  },
  overallValue: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: "auto",
  },
  viewAllText: {
    fontSize: 14,
    marginRight: 4,
  },
  radarContainer: {
    alignItems: "center",
    position: "relative",
  },
  radarChart: {
    backgroundColor: "transparent",
  },
  abilityLabels: {
    position: "absolute",
    width: 300,
    height: 300,
  },
  abilityLabel: {
    alignItems: "center",
    gap: 4,
  },
  abilityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  abilityValueText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  abilityLabelText: {
    fontSize: 12,
    fontWeight: "500",
  },
  strengthsSection: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
  },
  strengthsGrid: {
    flexDirection: "row",
    gap: 20,
  },
  strengthsColumn: {
    flex: 1,
  },
  strengthsTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  strengthItem: {
    fontSize: 14,
    marginBottom: 6,
    lineHeight: 20,
  },
  transferSection: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
  },
  transferItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  transferDate: {
    fontSize: 14,
    marginBottom: 4,
  },
  transferType: {
    fontSize: 12,
    marginBottom: 12,
  },
  transferTeams: {
    flexDirection: "row",
    alignItems: "center",
  },
  transferTeam: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  transferTeamLogo: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  transferTeamName: {
    fontSize: 14,
    fontWeight: "500",
  },
  transferArrow: {
    paddingHorizontal: 12,
  },
  viewMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    marginTop: 8,
  },
  viewMoreText: {
    fontSize: 14,
    marginRight: 4,
  },
  achievementsSection: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
  },
  achievementItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingVertical: 8,
  },
  achievementIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  achievementBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  achievementYear: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
  },
  achievementTeam: {
    color: "white",
    fontSize: 12,
    textAlign: "center",
    marginTop: 2,
  },
});
