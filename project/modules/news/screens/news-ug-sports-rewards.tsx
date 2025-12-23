import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
  SafeAreaView,
} from "react-native";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Gift, Trophy, Award, Star } from "lucide-react-native";
import { useTheme } from "../../../hooks/useTheme";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

interface League {
  id: string;
  name: string;
  shortName: string;
  totalRewards: number;
  activeRewards: number;
}

interface RewardItem {
  id: string;
  title: string;
  description: string;
  image: string;
  category: "premium" | "excellence" | "lucky";
  value: string;
}

const LEAGUES: League[] = [
  {
    id: "uganda-premier",
    name: "Uganda Premier League",
    shortName: "UPL",
    totalRewards: 45,
    activeRewards: 12,
  },
  {
    id: "afrcon",
    name: "AFRCON",
    shortName: "CAF",
    totalRewards: 28,
    activeRewards: 8,
  },
  {
    id: "champions-league",
    name: "Champions League",
    shortName: "UCL",
    totalRewards: 35,
    activeRewards: 15,
  },
  {
    id: "europa-league",
    name: "Europa League",
    shortName: "UEL",
    totalRewards: 22,
    activeRewards: 6,
  },
];

const REWARD_ITEMS: RewardItem[] = [
  {
    id: "1",
    title: "Premium Gift Package",
    description: "Official Uganda Premier League merchandise package",
    image:
      "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=200&h=200&fit=crop",
    category: "premium",
    value: "Premium",
  },
  {
    id: "2",
    title: "Excellence Award",
    description: "Uganda Premier League official team jersey",
    image:
      "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=200&h=200&fit=crop",
    category: "excellence",
    value: "Excellence",
  },
  {
    id: "3",
    title: "Lucky Winner Prize",
    description: "Official Uganda Premier League match ball",
    image:
      "https://images.unsplash.com/photo-1606925797300-0b35e9d1794e?w=200&h=200&fit=crop",
    category: "lucky",
    value: "Lucky Draw",
  },
];

export default function NewsUgSportsRewardsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();

  const [selectedLeague, setSelectedLeague] = useState("uganda-premier");
  const scrollViewRef = useRef<ScrollView>(null);

  const ugandaGradientColors = ["#FFB800", "#FFA000", "#FF8F00"];

  const currentLeague =
    LEAGUES.find((league) => league.id === selectedLeague) || LEAGUES[0];

  const handleLeagueSelect = (leagueId: string) => {
    setSelectedLeague(leagueId);
  };

  const renderRewardImage = (item: RewardItem, index: number) => (
    <View key={item.id} style={styles.rewardImageContainer}>
      <View
        style={[
          styles.rewardImageWrapper,
          {
            backgroundColor:
              item.category === "premium"
                ? "#FF6B35"
                : item.category === "excellence"
                  ? "#4CAF50"
                  : "#2196F3",
          },
        ]}
      >
        <Image
          source={{ uri: item.image }}
          style={styles.rewardImage}
          resizeMode="contain"
        />
      </View>
      <Text style={[styles.rewardTitle, { color: theme.colors.text }]}>
        {item.title}
      </Text>
    </View>
  );

  const renderLeagueTab = (league: League) => {
    const isSelected = selectedLeague === league.id;
    return (
      <TouchableOpacity
        key={league.id}
        style={[
          styles.leagueTab,
          {
            backgroundColor: isSelected
              ? ugandaGradientColors[0]
              : theme.colors.backgroundSecondary,
            borderColor: isSelected ? ugandaGradientColors[1] : "transparent",
          },
        ]}
        onPress={() => handleLeagueSelect(league.id)}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.leagueTabText,
            {
              color: isSelected ? "white" : theme.colors.text,
              fontWeight: isSelected ? "700" : "500",
            },
          ]}
        >
          {league.shortName}
        </Text>
        <Text
          style={[
            styles.leagueRewardCount,
            {
              color: isSelected
                ? "rgba(255,255,255,0.9)"
                : theme.colors.textSecondary,
            },
          ]}
        >
          {league.activeRewards} Active
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar
        barStyle={
          theme.colors.background === "#FFFFFF"
            ? "dark-content"
            : "light-content"
        }
        backgroundColor={theme.colors.background}
      />

      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top,
            backgroundColor: theme.colors.background,
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.backButton,
            {
              backgroundColor: theme.colors.backgroundSecondary,
            },
          ]}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Uganda Sports Rewards
        </Text>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[
              styles.headerIconButton,
              {
                backgroundColor: theme.colors.backgroundSecondary,
              },
            ]}
          >
            <Gift size={20} color={ugandaGradientColors[0]} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Rewards Gallery Header */}
        <View
          style={[
            styles.rewardsHeader,
            {
              backgroundColor: ugandaGradientColors[0],
            },
          ]}
        >
          <Text style={styles.rewardsHeaderTitle}>
            Participate and Win Amazing Sports Rewards
          </Text>
          <Text style={styles.rewardsHeaderSubtitle}>
            Uganda Premier League & International Competitions
          </Text>
        </View>

        {/* Reward Images Carousel */}
        <View style={styles.rewardImagesSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.rewardImagesContainer}
          >
            {REWARD_ITEMS.map((item, index) => renderRewardImage(item, index))}
          </ScrollView>
        </View>

        {/* Current Competition Info */}
        <View
          style={[
            styles.competitionInfo,
            {
              backgroundColor: theme.colors.backgroundSecondary,
              borderColor: ugandaGradientColors[0],
            },
          ]}
        >
          <View style={styles.competitionHeader}>
            <Trophy size={24} color={ugandaGradientColors[0]} />
            <Text
              style={[styles.competitionTitle, { color: theme.colors.text }]}
            >
              Current Competition Rewards
            </Text>
          </View>

          <View
            style={[
              styles.totalRewardsContainer,
              {
                backgroundColor: ugandaGradientColors[0],
              },
            ]}
          >
            <Text style={styles.totalRewardsValue}>181,898</Text>
            <Text style={styles.totalRewardsLabel}>Total Reward Points</Text>
          </View>

          <Text
            style={[
              styles.competitionNote,
              { color: theme.colors.textSecondary },
            ]}
          >
            Official rewards sponsored by Uganda Premier League partners
          </Text>
        </View>

        {/* League Tabs */}
        <View style={styles.leagueTabsContainer}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Choose Your League
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.leagueTabsScroll}
          >
            {LEAGUES.map(renderLeagueTab)}
          </ScrollView>
        </View>

        {/* Selected League Details */}
        <View
          style={[
            styles.leagueDetailsContainer,
            {
              backgroundColor: theme.colors.backgroundSecondary,
            },
          ]}
        >
          <View style={styles.leagueDetailsHeader}>
            <View
              style={[
                styles.leagueIcon,
                {
                  backgroundColor: ugandaGradientColors[0],
                },
              ]}
            >
              <Text style={styles.leagueIconText}>
                {currentLeague.shortName}
              </Text>
            </View>

            <View style={styles.leagueInfo}>
              <Text style={[styles.leagueName, { color: theme.colors.text }]}>
                {currentLeague.name}
              </Text>
              <Text
                style={[
                  styles.leagueStats,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {currentLeague.activeRewards} active rewards •{" "}
                {currentLeague.totalRewards} total
              </Text>
            </View>
          </View>

          {/* Reward Categories */}
          <View style={styles.rewardCategoriesContainer}>
            <View
              style={[
                styles.rewardCategory,
                {
                  backgroundColor: theme.colors.backgroundSecondary,
                },
              ]}
            >
              <Award size={20} color="#FF6B35" />
              <Text
                style={[styles.categoryTitle, { color: theme.colors.text }]}
              >
                Premium Rewards
              </Text>
              <Text
                style={[
                  styles.categoryCount,
                  { color: ugandaGradientColors[0] },
                ]}
              >
                {Math.floor(currentLeague.activeRewards * 0.4)}
              </Text>
            </View>

            <View
              style={[
                styles.rewardCategory,
                {
                  backgroundColor: theme.colors.backgroundSecondary,
                },
              ]}
            >
              <Star size={20} color="#4CAF50" />
              <Text
                style={[styles.categoryTitle, { color: theme.colors.text }]}
              >
                Excellence Awards
              </Text>
              <Text
                style={[
                  styles.categoryCount,
                  { color: ugandaGradientColors[0] },
                ]}
              >
                {Math.floor(currentLeague.activeRewards * 0.4)}
              </Text>
            </View>

            <View
              style={[
                styles.rewardCategory,
                {
                  backgroundColor: theme.colors.backgroundSecondary,
                },
              ]}
            >
              <Gift size={20} color="#2196F3" />
              <Text
                style={[styles.categoryTitle, { color: theme.colors.text }]}
              >
                Lucky Draws
              </Text>
              <Text
                style={[
                  styles.categoryCount,
                  { color: ugandaGradientColors[0] },
                ]}
              >
                {currentLeague.activeRewards -
                  Math.floor(currentLeague.activeRewards * 0.8)}
              </Text>
            </View>
          </View>
        </View>

        {/* Participation Info */}
        <View
          style={[
            styles.participationInfo,
            {
              backgroundColor: theme.colors.backgroundSecondary,
            },
          ]}
        >
          <Text
            style={[styles.participationTitle, { color: theme.colors.text }]}
          >
            How to Earn Rewards
          </Text>

          <View style={styles.participationSteps}>
            <View style={styles.participationStep}>
              <View
                style={[
                  styles.stepNumber,
                  {
                    backgroundColor: ugandaGradientColors[0],
                  },
                ]}
              >
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <Text
                style={[styles.stepText, { color: theme.colors.textSecondary }]}
              >
                Participate in match predictions
              </Text>
            </View>

            <View style={styles.participationStep}>
              <View
                style={[
                  styles.stepNumber,
                  {
                    backgroundColor: ugandaGradientColors[0],
                  },
                ]}
              >
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <Text
                style={[styles.stepText, { color: theme.colors.textSecondary }]}
              >
                Engage with Uganda Premier League content
              </Text>
            </View>

            <View style={styles.participationStep}>
              <View
                style={[
                  styles.stepNumber,
                  {
                    backgroundColor: ugandaGradientColors[0],
                  },
                ]}
              >
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <Text
                style={[styles.stepText, { color: theme.colors.textSecondary }]}
              >
                Collect points and win amazing prizes
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Inter-Bold",
  },
  headerRight: {
    width: 40,
    alignItems: "flex-end",
  },
  headerIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  rewardsHeader: {
    padding: 20,
    alignItems: "center",
  },
  rewardsHeaderTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "white",
    textAlign: "center",
    fontFamily: "Inter-Bold",
    marginBottom: 8,
  },
  rewardsHeaderSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
    fontFamily: "Inter-Medium",
  },
  rewardImagesSection: {
    paddingVertical: 20,
  },
  rewardImagesContainer: {
    paddingHorizontal: 16,
    gap: 16,
  },
  rewardImageContainer: {
    alignItems: "center",
    width: 140,
  },
  rewardImageWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  rewardImage: {
    width: 80,
    height: 80,
  },
  rewardTitle: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    fontFamily: "Inter-SemiBold",
  },
  competitionInfo: {
    margin: 16,
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  competitionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  competitionTitle: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Inter-Bold",
  },
  totalRewardsContainer: {
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 12,
  },
  totalRewardsValue: {
    fontSize: 28,
    fontWeight: "900",
    color: "white",
    fontFamily: "Inter-Black",
  },
  totalRewardsLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.9)",
    fontFamily: "Inter-Medium",
  },
  competitionNote: {
    fontSize: 12,
    textAlign: "center",
    fontFamily: "Inter-Regular",
  },
  leagueTabsContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
    fontFamily: "Inter-Bold",
  },
  leagueTabsScroll: {
    gap: 12,
    paddingHorizontal: 4,
  },
  leagueTab: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 100,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  leagueTabText: {
    fontSize: 14,
    fontFamily: "Inter-SemiBold",
    marginBottom: 2,
  },
  leagueRewardCount: {
    fontSize: 11,
    fontFamily: "Inter-Medium",
  },
  leagueDetailsContainer: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  leagueDetailsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 12,
  },
  leagueIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  leagueIconText: {
    fontSize: 14,
    fontWeight: "700",
    color: "white",
    fontFamily: "Inter-Bold",
  },
  leagueInfo: {
    flex: 1,
  },
  leagueName: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Inter-Bold",
    marginBottom: 4,
  },
  leagueStats: {
    fontSize: 12,
    fontFamily: "Inter-Medium",
  },
  rewardCategoriesContainer: {
    flexDirection: "row",
    gap: 8,
  },
  rewardCategory: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryTitle: {
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "Inter-SemiBold",
    textAlign: "center",
  },
  categoryCount: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Inter-Bold",
  },
  participationInfo: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  participationTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 16,
    fontFamily: "Inter-Bold",
  },
  participationSteps: {
    gap: 12,
  },
  participationStep: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: "700",
    color: "white",
    fontFamily: "Inter-Bold",
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter-Medium",
  },
  bottomSpacing: {
    height: 20,
  },
});
