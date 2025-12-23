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
}

interface LeagueStats {
  id: string;
  name: string;
  logo: string;
  season: string;
}

interface DiscoverExpertPaidPredictionsProps {
  leagueStats: LeagueStats | null;
  expertId: string;
}

function DiscoverExpertPaidPredictions({
  leagueStats,
  expertId,
}: DiscoverExpertPaidPredictionsProps) {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  const [refreshing, setRefreshing] = useState(false);
  const [predictions, setPredictions] = useState<MatchPredictionResult[]>([]);

  useEffect(() => {
    loadPaidPredictions();
  }, []);

  const loadPaidPredictions = async () => {
    try {
      // Generate league-specific paid predictions
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
            id: "paid-1",
            match: {
              homeTeam: teams[0],
              awayTeam: teams[1],
              homeTeamLogo: "https://via.placeholder.com/40x40",
              awayTeamLogo: "https://via.placeholder.com/40x40",
              league: leagueName,
              date: "10/15",
              time: "20:00",
              result: "3-1",
            },
            prediction: `PREMIUM ANALYSIS: ${teams[0]} vs ${teams[1]} - Exclusive tactical breakdown with 95% accuracy`,
            confidence: 95,
            analysis: `Detailed premium analysis with insider information and advanced statistics`,
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
              homeTeam: teams[2],
              awayTeam: teams[3],
              homeTeamLogo: "https://via.placeholder.com/40x40",
              awayTeamLogo: "https://via.placeholder.com/40x40",
              league: leagueName,
              date: "10/12",
              time: "19:45",
              result: "2-0",
            },
            prediction: `VIP PREDICTION: ${teams[2]} home dominance - Premium statistical analysis`,
            confidence: 92,
            analysis: `Exclusive premium content with detailed match insights`,
            result: "win",
            likes: 203,
            comments: 45,
            views: 3124,
            publishedAt: "10/12 17:15",
            finalScore: "2-0",
            isPaid: true,
            price: 25863,
          },
          {
            id: "paid-3",
            match: {
              homeTeam: teams[4],
              awayTeam: teams[5],
              homeTeamLogo: "https://via.placeholder.com/40x40",
              awayTeamLogo: "https://via.placeholder.com/40x40",
              league: leagueName,
              date: "10/08",
              time: "21:30",
              result: "1-1",
            },
            prediction: `PREMIUM TIP: ${teams[4]} vs ${teams[5]} - High-value betting insight`,
            confidence: 88,
            analysis: `Professional analysis available to premium subscribers only`,
            result: "loss",
            likes: 89,
            comments: 22,
            views: 1967,
            publishedAt: "10/08 19:00",
            finalScore: "1-1",
            isPaid: true,
            price: 14763,
          },
          {
            id: "paid-4",
            match: {
              homeTeam: teams[1],
              awayTeam: teams[0],
              homeTeamLogo: "https://via.placeholder.com/40x40",
              awayTeamLogo: "https://via.placeholder.com/40x40",
              league: leagueName,
              date: "10/05",
              time: "18:00",
              result: "2-2",
            },
            prediction: `EXCLUSIVE: ${teams[1]} tactical advantage - Premium subscriber content`,
            confidence: 90,
            analysis: `Advanced metrics and insider information for paid subscribers`,
            result: "win",
            likes: 178,
            comments: 38,
            views: 2756,
            publishedAt: "10/05 16:30",
            finalScore: "2-2",
            isPaid: true,
            price: 22163,
          },
          {
            id: "paid-5",
            match: {
              homeTeam: teams[3],
              awayTeam: teams[2],
              homeTeamLogo: "https://via.placeholder.com/40x40",
              awayTeamLogo: "https://via.placeholder.com/40x40",
              league: leagueName,
              date: "10/01",
              time: "20:45",
              result: "4-1",
            },
            prediction: `PREMIUM PICK: ${teams[3]} offensive strategy - VIP analysis`,
            confidence: 94,
            analysis: `High-level tactical breakdown with premium insights`,
            result: "win",
            likes: 245,
            comments: 52,
            views: 3892,
            publishedAt: "10/01 18:15",
            finalScore: "4-1",
            isPaid: true,
            price: 29563,
          },
        ];
      };

      const mockPredictions = getLeagueSpecificPredictions(
        leagueStats?.name || "Premier League",
      );

      setPredictions(mockPredictions);
    } catch (error) {
      console.error("Error loading paid predictions:", error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPaidPredictions();
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
        predictionType: "paid",
        matchId: prediction.match.homeTeam + "-vs-" + prediction.match.awayTeam,
      },
    });
  };

  const renderPaidPredictionCard = (prediction: MatchPredictionResult) => (
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
          <View style={styles.premiumBadge}>
            <Lock size={12} color="#FFD700" />
            <Text style={styles.premiumText}>PREMIUM</Text>
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
          [Premium] {prediction.prediction}
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
          <View style={styles.priceContainer}>
            <Star size={14} color="#FFD700" />
            <Text style={styles.priceText}>UGX {prediction.price}</Text>
          </View>
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
              <View style={styles.statIcon}>
                <TrendingUp size={12} color="#FF4444" />
                <Text style={styles.statValue}>{prediction.likes}</Text>
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
          {predictions.map(renderPaidPredictionCard)}
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
    color: "#00FF00",
    textAlign: "center",
  },
  confidenceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
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
  sectionSeparator: {
    height: 1,
    marginHorizontal: 0,
  },
});

export default DiscoverExpertPaidPredictions;
