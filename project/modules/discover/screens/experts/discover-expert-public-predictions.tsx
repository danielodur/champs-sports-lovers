import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "react-i18next";
import {
  TrendingUp,
  Eye,
  MessageCircle,
  ThumbsUp,
  Globe,
  Users,
  Share2,
} from "lucide-react-native";

interface MatchPredictionResult {
  id: string;
  match: {
    homeTeam: string;
    awayTeam: string;
    homeTeamLogo: string;
    awayTeamLogo: string;
    league: string;
    date: string;
    time: string;
    result?: string;
  };
  prediction: string;
  confidence: number;
  analysis: string;
  result: "win" | "loss" | "pending";
  likes: number;
  comments: number;
  views: number;
  publishedAt: string;
  finalScore?: string;
  isPaid: boolean;
  shares?: number;
}

interface LeagueStats {
  id: string;
  name: string;
  logo: string;
  season: string;
}

interface DiscoverExpertPublicPredictionsProps {
  leagueStats: LeagueStats | null;
  expertId: string;
}

function DiscoverExpertPublicPredictions({
  leagueStats,
  expertId,
}: DiscoverExpertPublicPredictionsProps) {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  const [refreshing, setRefreshing] = useState(false);
  const [predictions, setPredictions] = useState<MatchPredictionResult[]>([]);

  useEffect(() => {
    loadPublicPredictions();
  }, []);

  const loadPublicPredictions = async () => {
    try {
      // Generate league-specific public predictions
      const getLeagueSpecificPredictions = (
        leagueName: string,
      ): MatchPredictionResult[] => {
        const baseTeams: { [key: string]: string[] } = {
          "UEFA Champions League": [
            "Real Madrid",
            "Barcelona",
            "Manchester City",
            "Bayern Munich",
            "PSG",
            "Liverpool",
          ],
          "Premier League": [
            "Manchester City",
            "Arsenal",
            "Liverpool",
            "Chelsea",
            "Tottenham",
            "Manchester United",
          ],
          "Serie A": [
            "Juventus",
            "Inter Milan",
            "AC Milan",
            "Napoli",
            "Roma",
            "Lazio",
          ],
          "La Liga": [
            "Real Madrid",
            "Barcelona",
            "Atletico Madrid",
            "Sevilla",
            "Valencia",
            "Villarreal",
          ],
          Bundesliga: [
            "Bayern Munich",
            "Borussia Dortmund",
            "RB Leipzig",
            "Bayer Leverkusen",
            "Eintracht Frankfurt",
            "Wolfsburg",
          ],
        };

        const teams = baseTeams[leagueName] || baseTeams["Premier League"];

        return [
          {
            id: "public-1",
            match: {
              homeTeam: teams[0],
              awayTeam: teams[1],
              homeTeamLogo: "https://via.placeholder.com/40x40",
              awayTeamLogo: "https://via.placeholder.com/40x40",
              league: leagueName,
              date: "10/20",
              time: "15:30",
              result: "2-1",
            },
            prediction: `Public Analysis: ${teams[0]} strong home form vs ${teams[1]} - Community prediction`,
            confidence: 78,
            analysis: `General analysis available to all followers`,
            result: "win",
            likes: 89,
            comments: 23,
            views: 1247,
            publishedAt: "10/20 13:15",
            finalScore: "2-1",
            isPaid: false,
            shares: 45,
          },
          {
            id: "public-2",
            match: {
              homeTeam: teams[2],
              awayTeam: teams[3],
              homeTeamLogo: "https://via.placeholder.com/40x40",
              awayTeamLogo: "https://via.placeholder.com/40x40",
              league: leagueName,
              date: "10/18",
              time: "20:00",
              result: "1-0",
            },
            prediction: `Community Pick: ${teams[2]} defensive strength against ${teams[3]} attack`,
            confidence: 82,
            analysis: `Public tactical breakdown for community members`,
            result: "win",
            likes: 134,
            comments: 31,
            views: 1892,
            publishedAt: "10/18 18:30",
            finalScore: "1-0",
            isPaid: false,
            shares: 62,
          },
          {
            id: "public-3",
            match: {
              homeTeam: teams[4],
              awayTeam: teams[5],
              homeTeamLogo: "https://via.placeholder.com/40x40",
              awayTeamLogo: "https://via.placeholder.com/40x40",
              league: leagueName,
              date: "10/15",
              time: "19:45",
              result: "3-2",
            },
            prediction: `Free Tip: ${teams[4]} vs ${teams[5]} - Open match prediction for followers`,
            confidence: 75,
            analysis: `Community analysis shared with all subscribers`,
            result: "loss",
            likes: 67,
            comments: 18,
            views: 945,
            publishedAt: "10/15 17:20",
            finalScore: "3-2",
            isPaid: false,
            shares: 28,
          },
          {
            id: "public-4",
            match: {
              homeTeam: teams[1],
              awayTeam: teams[4],
              homeTeamLogo: "https://via.placeholder.com/40x40",
              awayTeamLogo: "https://via.placeholder.com/40x40",
              league: leagueName,
              date: "10/12",
              time: "16:00",
              result: "0-0",
            },
            prediction: `Public Insight: ${teams[1]} vs ${teams[4]} - Community discussion prediction`,
            confidence: 70,
            analysis: `General match overview available to all users`,
            result: "win",
            likes: 156,
            comments: 42,
            views: 2103,
            publishedAt: "10/12 14:45",
            finalScore: "0-0",
            isPaid: false,
            shares: 73,
          },
          {
            id: "public-5",
            match: {
              homeTeam: teams[3],
              awayTeam: teams[0],
              homeTeamLogo: "https://via.placeholder.com/40x40",
              awayTeamLogo: "https://via.placeholder.com/40x40",
              league: leagueName,
              date: "10/08",
              time: "21:00",
              result: "1-3",
            },
            prediction: `Community Choice: ${teams[3]} home advantage vs ${teams[0]} away form`,
            confidence: 85,
            analysis: `Public tactical analysis for community engagement`,
            result: "win",
            likes: 198,
            comments: 56,
            views: 2847,
            publishedAt: "10/08 19:15",
            finalScore: "1-3",
            isPaid: false,
            shares: 91,
          },
          {
            id: "public-6",
            match: {
              homeTeam: teams[5],
              awayTeam: teams[2],
              homeTeamLogo: "https://via.placeholder.com/40x40",
              awayTeamLogo: "https://via.placeholder.com/40x40",
              league: leagueName,
              date: "10/05",
              time: "18:30",
              result: "2-2",
            },
            prediction: `Free Analysis: ${teams[5]} attacking play vs ${teams[2]} - Public prediction`,
            confidence: 73,
            analysis: `Community-focused analysis shared openly`,
            result: "loss",
            likes: 78,
            comments: 19,
            views: 1156,
            publishedAt: "10/05 16:10",
            finalScore: "2-2",
            isPaid: false,
            shares: 34,
          },
        ];
      };

      const mockPredictions = getLeagueSpecificPredictions(
        leagueStats?.name || "Premier League",
      );

      setPredictions(mockPredictions);
    } catch (error) {
      console.error("Error loading public predictions:", error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPublicPredictions();
    setRefreshing(false);
  };

  const getResultColor = (result: string) => {
    switch (result) {
      case "win":
        return "#FF4444";
      case "loss":
        return "#666666";
      default:
        return "#FFA500";
    }
  };

  const getResultText = (result: string) => {
    switch (result) {
      case "win":
        return "Win";
      case "loss":
        return "Loss";
      default:
        return "Pending";
    }
  };

  const handlePredictionPress = (prediction: MatchPredictionResult) => {
    router.push({
      pathname: "/discover/discover-expert-check-out",
      params: {
        expertId,
        predictionId: prediction.id,
        predictionType: "public",
        matchId: prediction.match.homeTeam + "-vs-" + prediction.match.awayTeam,
      },
    });
  };

  const renderPublicPredictionCard = (prediction: MatchPredictionResult) => (
    <TouchableOpacity
      key={prediction.id}
      onPress={() => handlePredictionPress(prediction)}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.predictionCard,
          { backgroundColor: theme.colors.backgroundSecondary },
        ]}
      >
        <View style={styles.predictionHeader}>
          <View style={styles.publicBadge}>
            <Globe size={12} color="#4CAF50" />
            <Text style={styles.publicText}>PUBLIC</Text>
          </View>
          <View
            style={[
              styles.resultBadge,
              { backgroundColor: getResultColor(prediction.result) },
            ]}
          >
            <Text style={styles.resultBadgeText}>
              {getResultText(prediction.result)}
            </Text>
          </View>
        </View>

        <Text
          style={[styles.predictionTitle, { color: theme.colors.text }]}
          numberOfLines={2}
        >
          [Public] {prediction.prediction}
        </Text>

        <View style={styles.matchInfo}>
          <Text style={[styles.matchTime, { color: theme.colors.text }]}>
            {prediction.match.date} {prediction.match.time}
          </Text>
          <Image
            source={{ uri: leagueStats?.logo }}
            style={styles.matchLeagueLogo}
          />
          <Text
            style={[styles.matchDetails, { color: theme.colors.textSecondary }]}
          >
            [{leagueStats?.name}] {prediction.match.homeTeam} VS{" "}
            {prediction.match.awayTeam}
          </Text>
        </View>

        <View style={styles.predictionFooter}>
          <Text
            style={[
              styles.publishedTime,
              { color: theme.colors.textSecondary },
            ]}
          >
            {prediction.publishedAt} Published
          </Text>
          <View style={styles.predictionStats}>
            <View style={styles.statRow}>
              <Text
                style={[styles.statType, { color: theme.colors.textSecondary }]}
              >
                {prediction.result === "win"
                  ? "Correct"
                  : prediction.result === "loss"
                    ? "Wrong"
                    : "Pending"}
              </Text>
              <View style={styles.engagementStats}>
                <View style={styles.statIcon}>
                  <TrendingUp size={12} color="#FF4444" />
                  <Text style={styles.statValue}>{prediction.likes}</Text>
                </View>
                <View style={styles.statIcon}>
                  <MessageCircle size={12} color="#4CAF50" />
                  <Text style={styles.statValue}>{prediction.comments}</Text>
                </View>
                <View style={styles.statIcon}>
                  <Share2 size={12} color="#2196F3" />
                  <Text style={styles.statValue}>{prediction.shares}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {prediction.finalScore && (
          <View style={styles.finalScoreContainer}>
            <Text style={styles.finalScoreText}>
              Final: {prediction.finalScore}
            </Text>
          </View>
        )}

        <View style={styles.confidenceContainer}>
          <Text
            style={[
              styles.confidenceLabel,
              { color: theme.colors.textSecondary },
            ]}
          >
            Confidence:
          </Text>
          <View style={styles.confidenceBar}>
            <View
              style={[
                styles.confidenceProgress,
                { width: `${prediction.confidence}%` },
              ]}
            />
          </View>
          <Text style={styles.confidenceText}>{prediction.confidence}%</Text>
        </View>

        <View style={styles.communityContainer}>
          <Users size={14} color="#4CAF50" />
          <Text
            style={[
              styles.communityText,
              { color: theme.colors.textSecondary },
            ]}
          >
            Shared with {prediction.views} community members
          </Text>
        </View>
      </View>
      <View
        style={[
          styles.sectionSeparator,
          { backgroundColor: theme.colors.border },
        ]}
      />
    </TouchableOpacity>
  );

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.backgroundSecondary },
      ]}
    >
      <ScrollView
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.predictionsContainer}>
          {predictions.map(renderPublicPredictionCard)}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  predictionsContainer: {
    paddingVertical: 0,
    paddingBottom: 20,
  },
  predictionCard: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  predictionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  publicBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(76, 175, 80, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  publicText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#4CAF50",
  },
  resultBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 50,
    alignItems: "center",
  },
  resultBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  predictionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    lineHeight: 22,
  },
  matchInfo: {
    paddingVertical: 8,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  matchTime: {
    fontSize: 14,
    fontWeight: "600",
    marginRight: 12,
  },
  matchLeagueLogo: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 8,
  },
  matchDetails: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  predictionFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  publishedTime: {
    fontSize: 12,
    fontWeight: "500",
  },
  predictionStats: {
    flexDirection: "row",
    alignItems: "center",
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  engagementStats: {
    flexDirection: "row",
    gap: 8,
  },
  statType: {
    fontSize: 12,
    fontWeight: "500",
  },
  statIcon: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statValue: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666666",
  },
  finalScoreContainer: {
    marginBottom: 12,
  },
  finalScoreText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#00FF00",
    textAlign: "center",
  },
  confidenceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
    marginBottom: 8,
  },
  confidenceLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  confidenceBar: {
    flex: 1,
    height: 4,
    backgroundColor: "rgba(76, 175, 80, 0.15)",
    borderRadius: 2,
    overflow: "hidden",
  },
  confidenceProgress: {
    height: "100%",
    backgroundColor: "#4CAF50",
    borderRadius: 2,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4CAF50",
    minWidth: 35,
  },
  communityContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  communityText: {
    fontSize: 11,
    fontWeight: "500",
  },
  sectionSeparator: {
    height: 1,
    marginHorizontal: 0,
  },
});

export default DiscoverExpertPublicPredictions;
