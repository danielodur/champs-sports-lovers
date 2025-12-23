import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  SafeAreaView,
  Dimensions,
  Alert,
  ActivityIndicator,
  Modal,
  Pressable,
  Animated,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  Share2,
  Lock,
  Clock,
  Trophy,
  Star,
  Eye,
  MessageCircle,
  ThumbsUp,
  Users,
  Target,
  TrendingUp,
  Calendar,
  Shield,
  CheckCircle,
  AlertCircle,
  Check,
  X,
  Heart,
  Bell,
  BellOff,
} from "lucide-react-native";
import DiscoverFollowExpert from "./discover-follow-expert";

const { width, height } = Dimensions.get("window");

interface ExpertData {
  id: string;
  name: string;
  username: string;
  avatar: string;
  followers: number;
  level: number;
  badge?: "crown" | "star" | "diamond";
  winStreak: number;
  accuracy: number;
  totalPredictions: number;
  isFollowing: boolean;
}

interface MatchData {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamLogo: string;
  awayTeamLogo: string;
  league: string;
  leagueLogo: string;
  date: string;
  time: string;
  homeOdds: string;
  awayOdds: string;
}

interface PredictionData {
  id: string;
  type: "paid" | "public";
  title: string;
  prediction: string;
  confidence: number;
  analysisWordCount: number;
  analysisPreview: string;
  price: number; // in UGX
  originalPrice?: number;
  discount?: number;
  timeLeft: number; // in seconds
  views: number;
  likes: number;
  comments: number;
  publishedAt: string;
}

interface ComboPackage {
  id: string;
  title: string;
  predictions: string[];
  originalPrice: number;
  discountedPrice: number;
  savings: number;
}

function DiscoverExpertCheckOutScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  const params = useLocalSearchParams();

  const [loading, setLoading] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [expertData, setExpertData] = useState<ExpertData | null>(null);
  const [matchData, setMatchData] = useState<MatchData | null>(null);
  const [predictionData, setPredictionData] = useState<PredictionData | null>(
    null,
  );
  const [comboPackages, setComboPackages] = useState<ComboPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [currentFollowerCount, setCurrentFollowerCount] = useState<number>(0);

  useEffect(() => {
    loadCheckoutData();
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const loadCheckoutData = async () => {
    try {
      setLoading(true);

      // Extract parameters from navigation
      const expertId = params.expertId as string;
      const expertName = params.expertName as string;
      const predictionId = params.predictionId as string;
      const predictionType = params.predictionType as "paid" | "public";
      const matchId = params.matchId as string;

      // Mock expert data
      const mockExpert: ExpertData = {
        id: expertId || "expert-1",
        name: expertName || "Football Master",
        username: "football_master",
        avatar: "https://randomuser.me/api/portraits/men/32.jpg",
        followers: 12547,
        level: 10,
        badge: "crown",
        winStreak: 6,
        accuracy: 78.5,
        totalPredictions: 247,
        isFollowing: false, // Start unfollowed for testing
      };

      // Mock match data
      const mockMatch: MatchData = {
        id: matchId || "match-1",
        homeTeam: "Manchester City",
        awayTeam: "Liverpool",
        homeTeamLogo:
          "https://logos-world.net/wp-content/uploads/2020/06/Manchester-City-Logo.png",
        awayTeamLogo:
          "https://logos-world.net/wp-content/uploads/2020/06/Liverpool-Logo.png",
        league: "Premier League",
        leagueLogo:
          "https://logos-world.net/wp-content/uploads/2020/06/Premier-League-Logo.png",
        date: "2024-12-15",
        time: "15:30",
        homeOdds: "+0.5",
        awayOdds: "-0.5",
      };

      // Mock prediction data
      const mockPrediction: PredictionData = {
        id: predictionId || "pred-1",
        type: predictionType || "paid",
        title:
          "[Prediction] Home team deep ball play, can the relegation team hold their ground in midfield?",
        prediction: "Home team to win with handicap",
        confidence: 85,
        analysisWordCount: 454,
        analysisPreview:
          "Korean K2 League Round 33 match volume battle, Chungbuk Cheongju sits at home to welcome Gimpo Citizens. The former is struggling to stay in the league with low morale at home, while the latter is stable in the middle of the table, with a significant difference in offensive and defensive states becoming the key to the match.",
        price: predictionType === "paid" ? 150000 : 0, // 150,000 UGX
        originalPrice: predictionType === "paid" ? 200000 : undefined,
        discount: predictionType === "paid" ? 25 : undefined,
        timeLeft: 56641, // 15:44:01 in seconds
        views: 1247,
        likes: 89,
        comments: 22,
        publishedAt: "Today 21:54:00",
      };

      // Mock combo packages
      const mockComboPackages: ComboPackage[] = [
        {
          id: "combo-1",
          title:
            "[Prediction] Home team wins, 'Draw Master' swept last week...",
          predictions: ["Manchester City vs Liverpool", "Arsenal vs Chelsea"],
          originalPrice: 300000,
          discountedPrice: 125000,
          savings: 175000,
        },
        {
          id: "combo-2",
          title:
            "[Prediction] Home team status returns to strong momentum, offensive and defensive duel progress...",
          predictions: [
            "Tottenham vs Manchester United",
            "Newcastle vs Brighton",
          ],
          originalPrice: 300000,
          discountedPrice: 125000,
          savings: 175000,
        },
      ];

      setExpertData(mockExpert);
      setMatchData(mockMatch);
      setPredictionData(mockPrediction);
      setComboPackages(mockComboPackages);
      setTimeLeft(mockPrediction.timeLeft);
      setIsFollowing(mockExpert.isFollowing);
      setCurrentFollowerCount(mockExpert.followers);
    } catch (error) {
      console.error("Error loading checkout data:", error);
      Alert.alert("Error", "Failed to load prediction details");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat("en-UG", {
      style: "currency",
      currency: "UGX",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handlePayment = async (packageId?: string) => {
    try {
      setPaymentProcessing(true);

      const paymentAmount = packageId
        ? comboPackages.find((p) => p.id === packageId)?.discountedPrice || 0
        : predictionData?.price || 0;

      if (paymentAmount === 0 && predictionData?.type === "public") {
        // Free public prediction - direct access
        Alert.alert(
          "Success",
          "You now have access to this public prediction!",
          [{ text: "View Prediction", onPress: () => router.back() }],
        );
        return;
      }

      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      Alert.alert(
        "Payment Successful",
        `Payment of ${formatPrice(paymentAmount)} completed successfully. You now have access to the prediction analysis.`,
        [
          {
            text: "View Prediction",
            onPress: () => {
              router.back();
            },
          },
        ],
      );
    } catch (error) {
      console.error("Payment error:", error);
      Alert.alert(
        "Payment Failed",
        "There was an error processing your payment. Please try again.",
      );
    } finally {
      setPaymentProcessing(false);
    }
  };

  const handleFollowChange = (
    newIsFollowing: boolean,
    newFollowerCount: number,
  ) => {
    setIsFollowing(newIsFollowing);
    setCurrentFollowerCount(newFollowerCount);
    if (expertData) {
      setExpertData({
        ...expertData,
        followers: newFollowerCount,
        isFollowing: newIsFollowing,
      });
    }
  };

  const renderWinStreak = () => {
    if (!expertData) return null;

    const streakBadges = [];
    for (let i = 0; i < expertData.winStreak; i++) {
      streakBadges.push(
        <View key={i} style={styles.winBadge}>
          <Text style={styles.winBadgeText}>Win</Text>
        </View>,
      );
    }

    return (
      <View
        style={[
          styles.winStreakContainer,
          { borderBottomColor: theme.colors.border },
        ]}
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {streakBadges}
        </ScrollView>
      </View>
    );
  };

  const renderExpertHeader = () => {
    if (!expertData) return null;

    return (
      <View
        style={[
          styles.expertHeader,
          {
            backgroundColor: theme.colors.background,
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        <Image
          source={{ uri: expertData.avatar }}
          style={styles.expertAvatar}
        />
        <View style={styles.expertInfo}>
          <View style={styles.expertNameRow}>
            <Text style={[styles.expertName, { color: theme.colors.text }]}>
              {expertData.name}
            </Text>
            <View style={styles.levelBadge}>
              <Text style={styles.levelBadgeText}>{expertData.level}</Text>
            </View>
            <Text style={[styles.streakLabel, { color: theme.colors.error }]}>
              {expertData.winStreak} Win Streak
            </Text>
          </View>
          <View style={styles.expertStats}>
            <Text
              style={[styles.expertStat, { color: theme.colors.textSecondary }]}
            >
              Win Streak Ranked 7th
            </Text>
            <Text
              style={[styles.expertStat, { color: theme.colors.textSecondary }]}
            >
              Hit {expertData.winStreak} wins in {expertData.winStreak + 4}{" "}
              games
            </Text>
            <Text
              style={[styles.expertStat, { color: theme.colors.textSecondary }]}
            >
              Longest {expertData.winStreak} win streak
            </Text>
          </View>
        </View>
        <View style={styles.followersInfo}>
          <Text style={[styles.followersCount, { color: theme.colors.text }]}>
            {currentFollowerCount}
          </Text>
          <Text
            style={[
              styles.followersLabel,
              { color: theme.colors.textSecondary },
            ]}
          >
            viewers
          </Text>
        </View>

        {/* Follow Button Section */}
        <View
          style={[
            styles.followButtonContainer,
            { borderBottomColor: theme.colors.border },
          ]}
        >
          <DiscoverFollowExpert
            expertId={expertData.id}
            expertName={expertData.name}
            initialFollowState={isFollowing}
            followerCount={currentFollowerCount}
            onFollowChange={handleFollowChange}
          />
        </View>
      </View>
    );
  };

  const renderMatchInfo = () => {
    if (!matchData) return null;

    return (
      <View
        style={[
          styles.matchContainer,
          {
            backgroundColor: theme.colors.background,
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        <View style={styles.matchHeader}>
          <Text style={[styles.predictionLabel, { color: theme.colors.error }]}>
            Prediction - Football
          </Text>
          <Text
            style={[styles.matchLeague, { color: theme.colors.textSecondary }]}
          >
            Korean K2 League 10/07 15:30
          </Text>
        </View>

        <View style={styles.matchTeams}>
          <View style={styles.teamContainer}>
            <Image
              source={{ uri: matchData.homeTeamLogo }}
              style={styles.teamLogo}
            />
            <Text style={[styles.teamName, { color: theme.colors.text }]}>
              {matchData.homeTeam}
            </Text>
          </View>

          <Text style={[styles.vsText, { color: theme.colors.text }]}>VS</Text>

          <View style={styles.teamContainer}>
            <Image
              source={{ uri: matchData.awayTeamLogo }}
              style={styles.teamLogo}
            />
            <Text style={[styles.teamName, { color: theme.colors.text }]}>
              {matchData.awayTeam}
            </Text>
          </View>
        </View>

        <View style={styles.oddsContainer}>
          <View style={styles.oddItem}>
            <Text style={[styles.oddLabel, { color: theme.colors.text }]}>
              Home
            </Text>
            <Text style={[styles.oddValue, styles.oddPositive]}>
              {matchData.homeOdds}
            </Text>
          </View>
          <View style={styles.oddItem}>
            <Text style={[styles.oddLabel, { color: theme.colors.text }]}>
              Away
            </Text>
            <Text style={[styles.oddValue, styles.oddNegative]}>
              {matchData.awayOdds}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderAnalysisPreview = () => {
    if (!predictionData) return null;

    return (
      <View
        style={[
          styles.analysisContainer,
          { backgroundColor: theme.colors.backgroundSecondary },
        ]}
      >
        <View style={styles.analysisHeader}>
          <Text style={[styles.analysisTitle, { color: theme.colors.text }]}>
            Preview
          </Text>
        </View>
        <Text
          style={[
            styles.analysisPreview,
            { color: theme.colors.textSecondary },
          ]}
        >
          {predictionData.analysisPreview}
        </Text>
      </View>
    );
  };

  const renderLockedContent = () => {
    if (!predictionData || predictionData.type === "public") return null;

    return (
      <View
        style={[
          styles.lockedContainer,
          {
            backgroundColor: theme.colors.backgroundSecondary,
            borderColor: theme.colors.error + "40",
          },
        ]}
      >
        <Lock size={24} color={theme.colors.error} />
        <Text style={[styles.lockedText, { color: theme.colors.error }]}>
          Unlock after payment
        </Text>
        <Text style={[styles.lockedDetails, { color: theme.colors.text }]}>
          {predictionData.analysisWordCount} words professional analysis
        </Text>
        <View
          style={[
            styles.timerContainer,
            {
              backgroundColor: theme.colors.background,
              borderColor: theme.colors.error,
            },
          ]}
        >
          <Text style={[styles.timerText, { color: theme.colors.error }]}>
            {formatTime(timeLeft)}
          </Text>
        </View>
      </View>
    );
  };

  const renderComboPackages = () => {
    if (comboPackages.length === 0) return null;

    return (
      <View style={styles.comboSection}>
        <View style={styles.comboHeader}>
          <Text style={[styles.comboTitle, { color: theme.colors.error }]}>
            Special Offer
          </Text>
          <Text style={[styles.comboSubtitle, { color: theme.colors.text }]}>
            Combo Purchase More Discounts
          </Text>
        </View>

        {comboPackages.map((pkg, index) => (
          <TouchableOpacity
            key={pkg.id}
            style={[
              styles.comboPackage,
              { backgroundColor: theme.colors.background },
              selectedPackage === pkg.id && { borderColor: theme.colors.error },
            ]}
            onPress={() =>
              setSelectedPackage(selectedPackage === pkg.id ? null : pkg.id)
            }
          >
            <View style={styles.comboContent}>
              <View style={styles.comboInfo}>
                <Text
                  style={[
                    styles.comboPackageTitle,
                    { color: theme.colors.text },
                  ]}
                >
                  {pkg.title}
                </Text>
                <View style={styles.comboPredictions}>
                  <Text
                    style={[
                      styles.comboPredictionText,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    {pkg.predictions[0]}
                  </Text>
                  <View style={styles.comboBadges}>
                    <Text
                      style={[styles.comboBadge, { color: theme.colors.error }]}
                    >
                      Long Ball
                    </Text>
                    <Text
                      style={[styles.comboPrice, { color: theme.colors.error }]}
                    >
                      Combo {formatPrice(pkg.discountedPrice)}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.comboSelector}>
                <View
                  style={[
                    styles.radioButton,
                    {
                      borderColor:
                        selectedPackage === pkg.id
                          ? theme.colors.error
                          : theme.colors.border,
                    },
                    selectedPackage === pkg.id && {
                      backgroundColor: theme.colors.error,
                    },
                  ]}
                >
                  {selectedPackage === pkg.id && (
                    <View style={styles.radioButtonInner} />
                  )}
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderFooter = () => {
    const selectedCombo = selectedPackage
      ? comboPackages.find((p) => p.id === selectedPackage)
      : null;
    const paymentAmount = selectedCombo
      ? selectedCombo.discountedPrice
      : predictionData?.price || 0;
    const isFreePrediction =
      predictionData?.type === "public" && paymentAmount === 0;

    return (
      <View
        style={[
          styles.footer,
          {
            backgroundColor: theme.colors.background,
            borderTopColor: theme.colors.border,
          },
        ]}
      >
        <View style={styles.footerContent}>
          <View style={styles.priceInfo}>
            <Text style={[styles.priceAmount, { color: theme.colors.error }]}>
              {isFreePrediction ? "FREE" : formatPrice(paymentAmount)}
            </Text>
            {!isFreePrediction && predictionData?.originalPrice && (
              <Text
                style={[
                  styles.originalPrice,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {formatPrice(predictionData.originalPrice)}
              </Text>
            )}
          </View>
          <TouchableOpacity
            style={[styles.payButton, { backgroundColor: theme.colors.error }]}
            onPress={() => handlePayment(selectedPackage || undefined)}
            disabled={paymentProcessing}
          >
            {paymentProcessing ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.payButtonText}>
                {isFreePrediction ? "Access Now" : "Pay Now"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            Loading prediction details...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <StatusBar
        barStyle={
          theme.colors.text === "#FFFFFF" ? "light-content" : "dark-content"
        }
      />

      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.colors.background,
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Prediction Details
        </Text>
        <TouchableOpacity style={styles.shareButton}>
          <Share2 size={20} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Prediction Title */}
        {predictionData && (
          <View
            style={[
              styles.titleContainer,
              {
                backgroundColor: theme.colors.background,
                borderBottomColor: theme.colors.border,
              },
            ]}
          >
            <Text
              style={[styles.predictionTitle, { color: theme.colors.text }]}
            >
              {predictionData.title}
            </Text>
            <Text
              style={[
                styles.publishedAt,
                { color: theme.colors.textSecondary },
              ]}
            >
              {predictionData.publishedAt} Published
            </Text>
          </View>
        )}

        {/* Expert Header with Win Streak */}
        {renderExpertHeader()}
        {renderWinStreak()}

        {/* Match Information */}
        {renderMatchInfo()}

        {/* Analysis Preview */}
        {renderAnalysisPreview()}

        {/* Locked Content */}
        {renderLockedContent()}

        {/* Combo Packages */}
        {renderComboPackages()}

        {/* Footer Spacer */}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Footer */}
      {renderFooter()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
    marginHorizontal: 16,
  },
  shareButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  titleContainer: {
    padding: 16,
    borderBottomWidth: 1,
  },
  predictionTitle: {
    fontSize: 18,
    fontWeight: "600",
    lineHeight: 24,
    marginBottom: 8,
  },
  publishedAt: {
    fontSize: 14,
    marginTop: 4,
  },
  expertHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
  },
  expertAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  expertInfo: {
    flex: 1,
  },
  expertNameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  expertName: {
    fontSize: 16,
    fontWeight: "600",
    marginRight: 8,
  },
  levelBadge: {
    backgroundColor: "#E53935",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 8,
  },
  levelBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  streakLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  expertStats: {
    marginTop: 4,
  },
  expertStat: {
    fontSize: 12,
    marginBottom: 2,
  },
  followersInfo: {
    alignItems: "center",
  },
  followersCount: {
    fontSize: 16,
    fontWeight: "600",
  },
  followersLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  winStreakContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  winBadge: {
    backgroundColor: "#E53935",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
  },
  winBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  matchContainer: {
    padding: 16,
    borderBottomWidth: 1,
  },
  matchHeader: {
    marginBottom: 16,
  },
  predictionLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  matchLeague: {
    fontSize: 12,
  },
  matchTeams: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  teamContainer: {
    alignItems: "center",
    flex: 1,
  },
  teamLogo: {
    width: 40,
    height: 40,
    marginBottom: 8,
  },
  teamName: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  vsText: {
    fontSize: 16,
    fontWeight: "bold",
    marginHorizontal: 20,
  },
  oddsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  oddItem: {
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    minWidth: 80,
  },
  oddLabel: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 4,
  },
  oddValue: {
    fontSize: 16,
    fontWeight: "bold",
  },
  oddPositive: {
    color: "#E53935",
  },
  oddNegative: {
    color: "#43A047",
  },
  analysisContainer: {
    margin: 16,
    padding: 16,
    borderRadius: 8,
  },
  analysisHeader: {
    marginBottom: 12,
  },
  analysisTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  analysisPreview: {
    fontSize: 14,
    lineHeight: 20,
  },
  lockedContainer: {
    alignItems: "center",
    margin: 16,
    padding: 24,
    borderRadius: 8,
    borderWidth: 1,
  },
  lockedText: {
    fontSize: 16,
    fontWeight: "500",
    marginTop: 8,
    marginBottom: 4,
  },
  lockedDetails: {
    fontSize: 14,
    marginBottom: 16,
  },
  timerContainer: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
  },
  timerText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  comboSection: {
    margin: 16,
  },
  comboHeader: {
    marginBottom: 16,
  },
  comboTitle: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  comboSubtitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  comboPackage: {
    borderRadius: 8,
    marginBottom: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: "transparent",
  },
  comboContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  comboInfo: {
    flex: 1,
  },
  comboPackageTitle: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
    lineHeight: 20,
  },
  comboPredictions: {
    marginBottom: 8,
  },
  comboPredictionText: {
    fontSize: 12,
    marginBottom: 4,
  },
  comboBadges: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  comboBadge: {
    fontSize: 12,
    fontWeight: "500",
  },
  comboPrice: {
    fontSize: 14,
    fontWeight: "bold",
  },
  comboSelector: {
    marginLeft: 16,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  radioButtonInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    paddingBottom: 34, // Safe area padding for iOS
  },
  footerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  priceInfo: {
    flex: 1,
  },
  priceAmount: {
    fontSize: 24,
    fontWeight: "bold",
  },
  originalPrice: {
    fontSize: 14,
    textDecorationLine: "line-through",
    marginTop: 2,
  },
  payButton: {
    borderRadius: 24,
    paddingHorizontal: 32,
    paddingVertical: 12,
    minWidth: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  payButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  followButtonContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    alignItems: "flex-end",
  },
});

export default DiscoverExpertCheckOutScreen;
