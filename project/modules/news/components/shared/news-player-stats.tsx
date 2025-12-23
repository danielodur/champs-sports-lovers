/**
 * Universal Sports Player Stats Screen Template
 *
 * Comprehensive player statistics screen for sports events app covering Soccer, Basketball, and Rugby.
 * Features competition filters, season data, offensive/defensive stats, and disciplinary records.
 * Designed to match Chinese app screenshots with full API integration readiness.
 *
 * Usage:
 * <NewsPlayerStats playerId="player-id" playerData={playerData} />
 *
 * Features:
 * - Competition/League filtering (Champions League, Premier League, World Cup)
 * - Season selector with year range
 * - Comprehensive offensive statistics
 * - Detailed passing and creative metrics
 * - Defensive performance indicators
 * - Disciplinary records and fouls
 * - Universal adaptability for all sports
 *
 * Note: Template adaptable for Soccer, Basketball, Rugby with sport-specific metrics
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { ChevronDown } from "lucide-react-native";

const { width } = Dimensions.get("window");

interface PlayerStatsData {
  id: string;
  name: string;
  competitions: Array<{
    id: string;
    name: string;
    shortName: string;
    isActive: boolean;
    seasons: string[];
  }>;
  currentSeason: string;
  seasonStats: {
    appearances: number;
    starts: number;
    goals: number;
    expectedGoals: number;
    goalAverage: number;
    assists: number;
    assistAverage: number;
    minutesPlayed: number;
    averageMinutes: number;
  };
  offensiveStats: {
    goalsPerGame: number;
    shotsOnTarget: number;
    shotsPerGame: number;
    successfulDribbles: number;
    dribbleSuccessRate: number;
    oneOnOneSuccess: number;
    oneOnOneSuccessRate: number;
    offsides: number;
  };
  passingStats: {
    keyPasses: number;
    successfulPasses: number;
    passAccuracy: number;
    successfulLongBalls: number;
    longBallSuccessRate: number;
    successfulCrosses: number;
    crossSuccessRate: number;
  };
  defensiveStats: {
    tackles: number;
    interceptions: number;
    blocks: number;
    clearances: number;
  };
  disciplinaryStats: {
    yellowCards: number;
    redCards: number;
    foulsCommitted: number;
    foulsWon: number;
  };
}

interface NewsPlayerStatsProps {
  playerId: string;
  playerData?: PlayerStatsData;
}

// Mock comprehensive stats data
const mockPlayerStatsData: PlayerStatsData = {
  id: "kylian-mbappe",
  name: "Kylian Mbappé",
  competitions: [
    {
      id: "champions-league",
      name: "UEFA Champions League",
      shortName: "UCL",
      isActive: true,
      seasons: ["25-26", "24-25", "23-24", "22-23"],
    },
    {
      id: "la-liga",
      name: "La Liga",
      shortName: "La Liga",
      isActive: false,
      seasons: ["25-26", "24-25", "23-24"],
    },
    {
      id: "world-cup",
      name: "FIFA World Cup",
      shortName: "World Cup",
      isActive: false,
      seasons: ["2022", "2018"],
    },
  ],
  currentSeason: "25-26",
  seasonStats: {
    appearances: 2,
    starts: 2,
    goals: 5,
    expectedGoals: 3,
    goalAverage: 2.5,
    assists: 0,
    assistAverage: 0.0,
    minutesPlayed: 171,
    averageMinutes: 85.5,
  },
  offensiveStats: {
    goalsPerGame: 34.2,
    shotsOnTarget: 9.0,
    shotsPerGame: 5.0,
    successfulDribbles: 3.0,
    dribbleSuccessRate: 60.0,
    oneOnOneSuccess: 0.0,
    oneOnOneSuccessRate: 0,
    offsides: 0.5,
  },
  passingStats: {
    keyPasses: 4.5,
    successfulPasses: 27.5,
    passAccuracy: 83.3,
    successfulLongBalls: 0.5,
    longBallSuccessRate: 1.5,
    successfulCrosses: 0.0,
    crossSuccessRate: 0.0,
  },
  defensiveStats: {
    tackles: 0.0,
    interceptions: 0.0,
    blocks: 1.5,
    clearances: 0.0,
  },
  disciplinaryStats: {
    yellowCards: 0,
    redCards: 0,
    foulsCommitted: 1.0,
    foulsWon: 0.0,
  },
};

export default function NewsPlayerStats({
  playerId,
  playerData: propPlayerData,
}: NewsPlayerStatsProps) {
  const theme = useTheme();
  const [selectedCompetition, setSelectedCompetition] = useState<string>("champions-league");
  const [selectedSeason, setSelectedSeason] = useState<string>("25-26");
  const [showSeasonSelector, setShowSeasonSelector] = useState(false);

  // Use provided data or fallback to mock data
  const playerData = propPlayerData || mockPlayerStatsData;

  const currentCompetition = playerData.competitions.find(
    comp => comp.id === selectedCompetition
  ) || playerData.competitions[0];

  const formatStatValue = (value: number, isPercentage: boolean = false): string => {
    if (isPercentage) {
      return `${value.toFixed(1)}%`;
    }
    return value % 1 === 0 ? value.toString() : value.toFixed(1);
  };

  const renderCompetitionFilters = () => (
    <View style={styles.filtersContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {playerData.competitions.map((competition) => (
          <TouchableOpacity
            key={competition.id}
            style={[
              styles.competitionFilter,
              {
                backgroundColor: selectedCompetition === competition.id
                  ? theme.colors.primary
                  : 'transparent',
                borderColor: selectedCompetition === competition.id
                  ? theme.colors.primary
                  : theme.colors.border,
              },
            ]}
            onPress={() => setSelectedCompetition(competition.id)}
          >
            <Text
              style={[
                styles.competitionFilterText,
                {
                  color: selectedCompetition === competition.id
                    ? 'white'
                    : theme.colors.text,
                },
              ]}
            >
              {competition.shortName}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity
        style={[styles.seasonSelector, { borderColor: theme.colors.primary }]}
        onPress={() => setShowSeasonSelector(!showSeasonSelector)}
      >
        <Text style={[styles.seasonText, { color: theme.colors.primary }]}>
          {selectedSeason}
        </Text>
        <ChevronDown
          size={16}
          color={theme.colors.primary}
          style={{
            transform: [{ rotate: showSeasonSelector ? "180deg" : "0deg" }],
          }}
        />
      </TouchableOpacity>
    </View>
  );

  const renderSeasonOverview = () => (
    <View style={styles.seasonOverviewContainer}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        Season Data
      </Text>
      <View style={styles.overviewStats}>
        <View style={styles.overviewStat}>
          <Text style={[styles.overviewValue, { color: theme.colors.text }]}>
            {playerData.seasonStats.appearances}/{playerData.seasonStats.starts}
          </Text>
          <Text style={[styles.overviewLabel, { color: theme.colors.textSecondary }]}>
            Appearances/Starts
          </Text>
        </View>
        <View style={styles.overviewStat}>
          <Text style={[styles.overviewValue, { color: theme.colors.text }]}>
            {playerData.seasonStats.goals}({playerData.seasonStats.expectedGoals})/{playerData.seasonStats.goalAverage}
          </Text>
          <Text style={[styles.overviewLabel, { color: theme.colors.textSecondary }]}>
            Goals/Average
          </Text>
        </View>
        <View style={styles.overviewStat}>
          <Text style={[styles.overviewValue, { color: theme.colors.text }]}>
            {playerData.seasonStats.assists}/{formatStatValue(playerData.seasonStats.assistAverage)}
          </Text>
          <Text style={[styles.overviewLabel, { color: theme.colors.textSecondary }]}>
            Assists/Average
          </Text>
        </View>
        <View style={styles.overviewStat}>
          <Text style={[styles.overviewValue, { color: theme.colors.text }]}>
            {formatStatValue(playerData.seasonStats.averageMinutes)}
          </Text>
          <Text style={[styles.overviewLabel, { color: theme.colors.textSecondary }]}>
            Avg Minutes
          </Text>
        </View>
      </View>
    </View>
  );

  const renderOffensiveStats = () => (
    <View style={styles.statsSection}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        Offensive
      </Text>
      <View style={styles.statsGrid}>
        <View style={styles.statRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Goals/Game
            </Text>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {formatStatValue(playerData.offensiveStats.goalsPerGame)}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Shots on Target
            </Text>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {formatStatValue(playerData.offensiveStats.shotsOnTarget)}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Shots per Game
            </Text>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {formatStatValue(playerData.offensiveStats.shotsPerGame)}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Successful Dribbles
            </Text>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {formatStatValue(playerData.offensiveStats.successfulDribbles)}
            </Text>
          </View>
        </View>
        <View style={styles.statRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Dribble Success Rate
            </Text>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {formatStatValue(playerData.offensiveStats.dribbleSuccessRate, true)}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              1v1 Success
            </Text>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {formatStatValue(playerData.offensiveStats.oneOnOneSuccess)}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              1v1 Success Rate
            </Text>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {formatStatValue(playerData.offensiveStats.oneOnOneSuccessRate)}%
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Offsides
            </Text>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {formatStatValue(playerData.offensiveStats.offsides)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderPassingStats = () => (
    <View style={styles.statsSection}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        Passing
      </Text>
      <View style={styles.statsGrid}>
        <View style={styles.statRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Key Passes
            </Text>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {formatStatValue(playerData.passingStats.keyPasses)}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Successful Passes
            </Text>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {formatStatValue(playerData.passingStats.successfulPasses)}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Pass Accuracy
            </Text>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {formatStatValue(playerData.passingStats.passAccuracy, true)}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Successful Long Balls
            </Text>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {formatStatValue(playerData.passingStats.successfulLongBalls)}
            </Text>
          </View>
        </View>
        <View style={styles.statRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Long Ball Success Rate
            </Text>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {formatStatValue(playerData.passingStats.longBallSuccessRate, true)}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Successful Crosses
            </Text>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {formatStatValue(playerData.passingStats.successfulCrosses)}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Cross Success Rate
            </Text>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {formatStatValue(playerData.passingStats.crossSuccessRate, true)}
            </Text>
          </View>
          <View style={styles.statItem}>
            {/* Empty slot for alignment */}
          </View>
        </View>
      </View>
    </View>
  );

  const renderDefensiveStats = () => (
    <View style={styles.statsSection}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        Defensive
      </Text>
      <View style={styles.statsGrid}>
        <View style={styles.statRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Tackles
            </Text>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {formatStatValue(playerData.defensiveStats.tackles)}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Interceptions
            </Text>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {formatStatValue(playerData.defensiveStats.interceptions)}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Blocks
            </Text>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {formatStatValue(playerData.defensiveStats.blocks)}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Clearances
            </Text>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {formatStatValue(playerData.defensiveStats.clearances)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderDisciplinaryStats = () => (
    <View style={styles.statsSection}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        Disciplinary
      </Text>
      <View style={styles.statsGrid}>
        <View style={styles.statRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Yellow Cards
            </Text>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {formatStatValue(playerData.disciplinaryStats.yellowCards)}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Red Cards
            </Text>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {formatStatValue(playerData.disciplinaryStats.redCards)}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Fouls Committed
            </Text>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {formatStatValue(playerData.disciplinaryStats.foulsCommitted)}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Fouls Won
            </Text>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {formatStatValue(playerData.disciplinaryStats.foulsWon)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      {renderCompetitionFilters()}
      {renderSeasonOverview()}
      {renderOffensiveStats()}
      {renderPassingStats()}
      {renderDefensiveStats()}
      {renderDisciplinaryStats()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filtersContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  competitionFilter: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  competitionFilterText: {
    fontSize: 14,
    fontWeight: "500",
  },
  seasonSelector: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderRadius: 16,
    marginLeft: "auto",
    gap: 4,
  },
  seasonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  seasonOverviewContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  overviewStats: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  overviewStat: {
    alignItems: "center",
    flex: 1,
  },
  overviewValue: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  overviewLabel: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 16,
  },
  statsSection: {
    padding: 16,
    paddingTop: 8,
  },
  statsGrid: {
    gap: 20,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    textAlign: "center",
    marginBottom: 8,
    lineHeight: 16,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
  },
});
