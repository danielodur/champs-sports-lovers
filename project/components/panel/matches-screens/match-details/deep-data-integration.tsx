import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { BarChart3, TrendingUp } from "lucide-react-native";
import { useTheme } from "@/hooks/useTheme";
import MatchDetailsDeepDataModal from "./deep-data-modal";

interface MatchDetailsDeepDataIntegrationProps {
  matchId: string;
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName: string;
  awayTeamName: string;
  homeTeamLogo: string;
  awayTeamLogo: string;
  homeScore?: number;
  awayScore?: number;
  matchStatus?: string;
  matchTime?: string;
}

export default function MatchDetailsDeepDataIntegration({
  matchId,
  homeTeamId,
  awayTeamId,
  homeTeamName,
  awayTeamName,
  homeTeamLogo,
  awayTeamLogo,
  homeScore = 0,
  awayScore = 0,
  matchStatus = "Live",
  matchTime = "45'",
}: MatchDetailsDeepDataIntegrationProps) {
  const theme = useTheme();
  const [isDeepDataModalVisible, setIsDeepDataModalVisible] = useState(false);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* Match Header */}
      <View
        style={[
          styles.matchHeader,
          { backgroundColor: theme.colors.backgroundSecondary },
        ]}
      >
        <View style={styles.teamSection}>
          <Text style={[styles.teamName, { color: theme.colors.text }]}>
            {homeTeamName}
          </Text>
          <Text style={[styles.score, { color: theme.colors.text }]}>
            {homeScore}
          </Text>
        </View>

        <View style={styles.matchInfo}>
          <Text style={[styles.matchTime, { color: "#FF9500" }]}>
            {matchTime}
          </Text>
          <Text
            style={[styles.matchStatus, { color: theme.colors.textSecondary }]}
          >
            {matchStatus}
          </Text>
        </View>

        <View style={styles.teamSection}>
          <Text style={[styles.score, { color: theme.colors.text }]}>
            {awayScore}
          </Text>
          <Text style={[styles.teamName, { color: theme.colors.text }]}>
            {awayTeamName}
          </Text>
        </View>
      </View>

      {/* Quick Stats Preview */}
      <View
        style={[
          styles.quickStats,
          { backgroundColor: theme.colors.backgroundSecondary },
        ]}
      >
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: "#FF9500" }]}>65%</Text>
          <Text
            style={[styles.statLabel, { color: theme.colors.textSecondary }]}
          >
            Possession
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: "#FF9500" }]}>8</Text>
          <Text
            style={[styles.statLabel, { color: theme.colors.textSecondary }]}
          >
            Shots
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: "#FF9500" }]}>4</Text>
          <Text
            style={[styles.statLabel, { color: theme.colors.textSecondary }]}
          >
            On Target
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: "#FF9500" }]}>12</Text>
          <Text
            style={[styles.statLabel, { color: theme.colors.textSecondary }]}
          >
            Attacks
          </Text>
        </View>
      </View>

      {/* Deep Data Button */}
      <TouchableOpacity
        style={[styles.deepDataButton, { backgroundColor: "#FF9500" }]}
        onPress={() => setIsDeepDataModalVisible(true)}
      >
        <BarChart3 size={20} color="#fff" />
        <Text style={styles.deepDataButtonText}>View Deep Data Analytics</Text>
        <TrendingUp size={20} color="#fff" />
      </TouchableOpacity>

      {/* Additional Match Info */}
      <View
        style={[
          styles.additionalInfo,
          { backgroundColor: theme.colors.backgroundSecondary },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Match Information
        </Text>

        <View style={styles.infoRow}>
          <Text
            style={[styles.infoLabel, { color: theme.colors.textSecondary }]}
          >
            Competition:
          </Text>
          <Text style={[styles.infoValue, { color: theme.colors.text }]}>
            {/* API-driven league name */}
            Unknown League
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text
            style={[styles.infoLabel, { color: theme.colors.textSecondary }]}
          >
            Venue:
          </Text>
          <Text style={[styles.infoValue, { color: theme.colors.text }]}>
            Emirates Stadium
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text
            style={[styles.infoLabel, { color: theme.colors.textSecondary }]}
          >
            Referee:
          </Text>
          <Text style={[styles.infoValue, { color: theme.colors.text }]}>
            Michael Oliver
          </Text>
        </View>
      </View>

      {/* Feature Highlights */}
      <View
        style={[
          styles.featureHighlights,
          { backgroundColor: theme.colors.backgroundSecondary },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Deep Data Features
        </Text>

        <View style={styles.featureList}>
          <View style={styles.featureItem}>
            <View
              style={[styles.featureIcon, { backgroundColor: "#FF950020" }]}
            >
              <BarChart3 size={16} color="#FF9500" />
            </View>
            <View style={styles.featureText}>
              <Text style={[styles.featureTitle, { color: theme.colors.text }]}>
                Team Analytics
              </Text>
              <Text
                style={[
                  styles.featureDesc,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Comprehensive team statistics with circular progress charts
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View
              style={[styles.featureIcon, { backgroundColor: "#FF950020" }]}
            >
              <TrendingUp size={16} color="#FF9500" />
            </View>
            <View style={styles.featureText}>
              <Text style={[styles.featureTitle, { color: theme.colors.text }]}>
                Player Performance
              </Text>
              <Text
                style={[
                  styles.featureDesc,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Individual player ratings and detailed statistics
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View
              style={[styles.featureIcon, { backgroundColor: "#FF950020" }]}
            >
              <BarChart3 size={16} color="#FF9500" />
            </View>
            <View style={styles.featureText}>
              <Text style={[styles.featureTitle, { color: theme.colors.text }]}>
                Time Period Analysis
              </Text>
              <Text
                style={[
                  styles.featureDesc,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Filter data by full match, first half, or second half
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Deep Data Modal */}
      <MatchDetailsDeepDataModal
        visible={isDeepDataModalVisible}
        onClose={() => setIsDeepDataModalVisible(false)}
        matchId={matchId}
        homeTeamId={homeTeamId}
        awayTeamId={awayTeamId}
        homeTeamName={homeTeamName}
        awayTeamName={awayTeamName}
        homeTeamLogo={homeTeamLogo}
        awayTeamLogo={awayTeamLogo}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  matchHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    margin: 16,
    borderRadius: 12,
  },
  teamSection: {
    flex: 1,
    alignItems: "center",
  },
  teamName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  score: {
    fontSize: 32,
    fontWeight: "bold",
  },
  matchInfo: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  matchTime: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  matchStatus: {
    fontSize: 12,
    textTransform: "uppercase",
  },
  quickStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: "center",
  },
  deepDataButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    gap: 12,
  },
  deepDataButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
  },
  additionalInfo: {
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  featureHighlights: {
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
  },
  featureList: {
    gap: 16,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  featureIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
});
