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
  Lock,
  Star,
  Trophy,
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
  price?: number;
  shares?: number;
}

interface DiscoverExpertAvailablePredictionsProps {
  expertId: string;
  onRefresh?: () => void;
  showFilterTabs?: boolean;
}

export default function DiscoverExpertAvailablePredictions({
  expertId,
  onRefresh,
  showFilterTabs = true,
}: DiscoverExpertAvailablePredictionsProps) {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  const [refreshing, setRefreshing] = useState(false);
  const [predictions, setPredictions] = useState<MatchPredictionResult[]>([]);
  const [activePredictionFilter, setActivePredictionFilter] = useState<
    "all" | "paid" | "public"
  >("all");

  useEffect(() => {
    loadAllPredictions();
  }, [expertId]);

  const loadAllPredictions = async () => {
    try {
      // Mock data combining both paid and public predictions
      const mockPaidPredictions: MatchPredictionResult[] = [
        {
          id: "paid-1",
          match: {
            homeTeam: "Real Madrid",
            awayTeam: "Barcelona",
            homeTeamLogo: "https://via.placeholder.com/40x40",
            awayTeamLogo: "https://via.placeholder.com/40x40",
            league: "La Liga",
            date: "10/15",
            time: "20:00",
            result: "3-1",
          },
          prediction:
            "PREMIUM ANALYSIS: Real Madrid vs Barcelona - Exclusive tactical breakdown with 95% accuracy",
          confidence: 95,
          analysis:
            "Detailed premium analysis with insider information and advanced statistics",
          result: "win",
          likes: 156,
          comments: 34,
          views: 2847,
          publishedAt: "10/15 18:30",
          finalScore: "3-1",
          isPaid: true,
          price: 18463,
        },
        {
          id: "paid-2",
          match: {
            homeTeam: "Manchester City",
            awayTeam: "Bayern Munich",
            homeTeamLogo: "https://via.placeholder.com/40x40",
            awayTeamLogo: "https://via.placeholder.com/40x40",
            league: "UEFA Champions League",
            date: "10/12",
            time: "19:45",
            result: "2-0",
          },
          prediction:
            "VIP PREDICTION: Manchester City home dominance - Premium statistical analysis",
          confidence: 92,
          analysis: "Exclusive premium content with detailed match insights",
          result: "win",
          likes: 203,
          comments: 45,
          views: 3124,
          publishedAt: "10/12 17:15",
          finalScore: "2-0",
          isPaid: true,
          price: 25863,
        },
      ];

      const mockPublicPredictions: MatchPredictionResult[] = [
        {
          id: "public-1",
          match: {
            homeTeam: "Arsenal",
            awayTeam: "Chelsea",
            homeTeamLogo: "https://via.placeholder.com/40x40",
            awayTeamLogo: "https://via.placeholder.com/40x40",
            league: "Premier League",
            date: "10/20",
            time: "15:30",
            result: "2-1",
          },
          prediction:
            "Public Analysis: Arsenal strong home form vs Chelsea - Community prediction",
          confidence: 78,
          analysis: "General analysis available to all followers",
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
            homeTeam: "Bayern Munich",
            awayTeam: "Borussia Dortmund",
            homeTeamLogo: "https://via.placeholder.com/40x40",
            awayTeamLogo: "https://via.placeholder.com/40x40",
            league: "Bundesliga",
            date: "10/18",
            time: "20:00",
            result: "1-0",
          },
          prediction:
            "Community Pick: Bayern Munich defensive strength against Dortmund attack",
          confidence: 82,
          analysis: "Public tactical breakdown for community members",
          result: "win",
          likes: 134,
          comments: 31,
          views: 1892,
          publishedAt: "10/18 18:30",
          finalScore: "1-0",
          isPaid: false,
          shares: 62,
        },
      ];

      // Combine and sort by publish date (newest first)
      const allPredictions = [
        ...mockPaidPredictions,
        ...mockPublicPredictions,
      ].sort(
        (a, b) =>
          new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
      );

      setPredictions(allPredictions);
    } catch (error) {
      console.error("Error loading predictions:", error);
      setPredictions([]);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAllPredictions();
    if (onRefresh) {
      onRefresh();
    }
    setRefreshing(false);
  };

  const getResultColor = (result: string) => {
    switch (result) {
      case "win":
        return theme.colors.primary;
      case "loss":
        return theme.colors.textSecondary;
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
        return "Live";
    }
  };

  const handlePredictionPress = (prediction: MatchPredictionResult) => {
    router.push({
      pathname: "/discover/discover-expert-check-out",
      params: {
        expertId,
        predictionId: prediction.id,
        predictionType: prediction.isPaid ? "paid" : "public",
        matchId: prediction.match.homeTeam + "-vs-" + prediction.match.awayTeam,
      },
    });
  };

  const getFilteredPredictions = () => {
    // When showFilterTabs is false, always show all predictions
    if (!showFilterTabs) {
      return predictions;
    }

    if (activePredictionFilter === "paid") {
      return predictions.filter((p) => p.isPaid);
    } else if (activePredictionFilter === "public") {
      return predictions.filter((p) => !p.isPaid);
    }
    return predictions;
  };

  const renderPredictionCard = (prediction: MatchPredictionResult) => (
    <TouchableOpacity
      key={prediction.id}
      onPress={() => handlePredictionPress(prediction)}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.predictionCard,
          {
            backgroundColor:
              theme.colors.backgroundSecondary ||
              (theme.colors.background === "#FFFFFF" ? "#F5F5F5" : "#2A2A2A"),
          },
        ]}
      >
        {/* Header with badges */}
        <View style={styles.predictionHeader}>
          {prediction.isPaid ? (
            <View style={styles.premiumBadge}>
              <Lock size={12} color="#FFD700" />
              <Text style={styles.premiumText}>PREMIUM</Text>
            </View>
          ) : (
            <View style={styles.publicBadge}>
              <Globe size={12} color="#4CAF50" />
              <Text style={styles.publicText}>PUBLIC</Text>
            </View>
          )}

          {prediction.result && (
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
          )}
        </View>

        {/* Prediction Title */}
        <Text
          style={[styles.predictionTitle, { color: theme.colors.text }]}
          numberOfLines={2}
        >
          [{prediction.isPaid ? "Premium" : "Public"}] {prediction.prediction}
        </Text>

        {/* Match Info */}
        <View style={styles.matchInfo}>
          <Text style={[styles.matchTime, { color: theme.colors.text }]}>
            {prediction.match.date} {prediction.match.time}
          </Text>
          <Text
            style={[styles.matchDetails, { color: theme.colors.textSecondary }]}
          >
            [{prediction.match.league}] {prediction.match.homeTeam} VS{" "}
            {prediction.match.awayTeam}
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.predictionFooter}>
          {prediction.isPaid && prediction.price && (
            <View style={styles.priceContainer}>
              <Star size={14} color="#FFD700" />
              <Text style={styles.priceText}>UGX {prediction.price}</Text>
            </View>
          )}

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
                {!prediction.isPaid && (
                  <>
                    <View style={styles.statIcon}>
                      <MessageCircle size={12} color="#4CAF50" />
                      <Text style={styles.statValue}>
                        {prediction.comments}
                      </Text>
                    </View>
                    <View style={styles.statIcon}>
                      <Share2 size={12} color="#2196F3" />
                      <Text style={styles.statValue}>{prediction.shares}</Text>
                    </View>
                  </>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Final Score */}
        {prediction.finalScore && (
          <View style={styles.finalScoreContainer}>
            <Text style={styles.finalScoreText}>
              Final: {prediction.finalScore}
            </Text>
          </View>
        )}

        {/* Confidence Bar */}
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

        {/* Community Info for Public Predictions */}
        {!prediction.isPaid && (
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
        )}
      </View>

      {/* Separator Line */}
      <View
        style={[
          styles.sectionSeparator,
          {
            backgroundColor:
              theme.colors.border ||
              (theme.colors.background === "#FFFFFF" ? "#E0E0E0" : "#404040"),
          },
        ]}
      />
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
        No predictions available
      </Text>
    </View>
  );

  const renderTabButtons = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[
          styles.tabButton,
          styles.leftTab,
          activePredictionFilter === "all" && {
            backgroundColor:
              theme.colors.backgroundSecondary ||
              (theme.colors.background === "#FFFFFF" ? "#F5F5F5" : "#2A2A2A"),
          },
        ]}
        onPress={() => setActivePredictionFilter("all")}
      >
        <Text
          style={[
            styles.tabButtonText,
            {
              color:
                activePredictionFilter === "all"
                  ? theme.colors.primary
                  : theme.colors.textSecondary,
            },
          ]}
        >
          All Predictions
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.tabButton,
          styles.middleTab,
          activePredictionFilter === "paid" && {
            backgroundColor:
              theme.colors.backgroundSecondary ||
              (theme.colors.background === "#FFFFFF" ? "#F5F5F5" : "#2A2A2A"),
          },
        ]}
        onPress={() => setActivePredictionFilter("paid")}
      >
        <Text
          style={[
            styles.tabButtonText,
            {
              color:
                activePredictionFilter === "paid"
                  ? theme.colors.primary
                  : theme.colors.textSecondary,
            },
          ]}
        >
          Paid Predictions
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.tabButton,
          styles.rightTab,
          activePredictionFilter === "public" && {
            backgroundColor:
              theme.colors.backgroundSecondary ||
              (theme.colors.background === "#FFFFFF" ? "#F5F5F5" : "#2A2A2A"),
          },
        ]}
        onPress={() => setActivePredictionFilter("public")}
      >
        <Text
          style={[
            styles.tabButtonText,
            {
              color:
                activePredictionFilter === "public"
                  ? theme.colors.primary
                  : theme.colors.textSecondary,
            },
          ]}
        >
          Public Predictions
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {showFilterTabs && renderTabButtons()}
      <ScrollView
        style={[
          styles.scrollView,
          {
            backgroundColor:
              theme.colors.backgroundSecondary ||
              (theme.colors.background === "#FFFFFF" ? "#F5F5F5" : "#2A2A2A"),
          },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
          />
        }
      >
        <View style={styles.predictionsContainer}>
          {getFilteredPredictions().length > 0
            ? getFilteredPredictions().map(renderPredictionCard)
            : renderEmptyState()}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: "row",
    marginTop: 16,
    marginBottom: 0,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 0,
  },
  leftTab: {},
  middleTab: {},
  rightTab: {},
  tabButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
  },
  predictionsContainer: {
    paddingVertical: 0,
  },
  predictionCard: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  sectionSeparator: {
    height: 1,
    marginHorizontal: 0,
  },
  predictionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  premiumBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 215, 0, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  premiumText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFD700",
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
  },
  matchTime: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  matchDetails: {
    fontSize: 14,
    fontWeight: "500",
  },
  predictionFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255, 215, 0, 0.08)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priceText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFD700",
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
  statType: {
    fontSize: 12,
    fontWeight: "500",
  },
  engagementStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  statIcon: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statValue: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FF4444",
  },
  finalScoreContainer: {
    marginBottom: 12,
  },
  finalScoreText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4CAF50",
    textAlign: "center",
  },
  confidenceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  confidenceLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  confidenceBar: {
    flex: 1,
    height: 4,
    backgroundColor: "rgba(255, 68, 68, 0.15)",
    borderRadius: 2,
    overflow: "hidden",
  },
  confidenceProgress: {
    height: "100%",
    backgroundColor: "#FF4444",
    borderRadius: 2,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FF4444",
    minWidth: 35,
  },
  communityContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  communityText: {
    fontSize: 12,
    fontWeight: "500",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
  },
});
