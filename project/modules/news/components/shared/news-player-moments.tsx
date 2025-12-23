/**
 * Universal Sports Player Moments Screen Template
 *
 * Universal template for sports events app covering Soccer, Basketball, and Rugby.
 * Displays player-specific news and moments with synchronized upper/lower sections.
 * Features player header with photo, stats, and scrollable news list.
 *
 * Usage:
 * <NewsPlayerMoments playerId="player-id" playerData={playerData} />
 *
 * Note: Design based on LaLiga reference screenshots but adaptable for all sports
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  Dimensions,
  Animated,
} from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "@/hooks/useTheme";
import { ArrowLeft, Share2 } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

interface PlayerMoment {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  timestamp: string;
  category: "news" | "highlight" | "award" | "transfer" | "match";
  readCount?: number;
  isHot?: boolean;
}

interface PlayerData {
  id: string;
  name: string;
  englishName: string;
  photo: string;
  backgroundImage: string;
  age: number;
  height: number; // in cm
  weight: number; // in kg
  nationality: string;
  nationalityFlag: string;
  position: string;
  preferredFoot: string;
  jerseyNumber: number;
  marketValue: number; // in millions of euros
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
  recentMatches: Array<{
    id: string;
    date: string;
    opponent: string;
    opponentLogo: string;
    homeAway: "H" | "A";
    result: string;
    goals: number;
    assists: number;
    rating: number;
    minutesPlayed: number;
  }>;
  moments: Array<{
    id: string;
    title: string;
    summary: string;
    time: string;
    image: string;
    type: "news" | "highlight" | "award" | "transfer";
  }>;
}

interface NewsPlayerMomentsProps {
  playerId: string;
  playerData?: PlayerData;
}

// Mock player data - synchronized with news-player-details.tsx
const mockPlayerData: PlayerData = {
  id: "julian-alvarez",
  name: "Julián Álvarez",
  englishName: "Julian Alvarez",
  photo:
    "https://img.a.transfermarkt.technology/portrait/big/532826-1659947765.jpg",
  backgroundImage:
    "https://assets.laliga.com/assets/2023/08/15/medium/1692100234.jpg",
  age: 25,
  height: 170,
  weight: 68,
  nationality: "Argentina",
  nationalityFlag: "🇦🇷",
  position: "Forward",
  preferredFoot: "Right",
  jerseyNumber: 19,
  marketValue: 100.0,
  currentTeam: {
    id: "atletico-madrid",
    name: "Atletico Madrid",
    logo: "https://logos.footyrenders.com/atletico-madrid.png",
    colors: {
      primary: "#CE2029",
      secondary: "#244474",
    },
  },
  biography:
    "Julián Álvarez is an Argentine professional footballer who plays as a forward for La Liga club Atlético Madrid and the Argentina national team. Known for his pace, versatility, and clinical finishing.",
  birthDate: "31/01/2000",
  birthPlace: "Calchín, Argentina",
  contract: {
    startDate: "2024/08/12",
    endDate: "2030/06/30",
  },
  stats: {
    appearances: 45,
    goals: 23,
    assists: 8,
    yellowCards: 3,
    redCards: 0,
    minutesPlayed: 3780,
    passAccuracy: 85.2,
    shotsOnTarget: 67,
    tackles: 23,
    interceptions: 15,
  },
  abilities: {
    overall: 86,
    pace: 89,
    shooting: 88,
    passing: 82,
    dribbling: 85,
    defending: 45,
    physical: 78,
  },
  recentMatches: [
    {
      id: "match1",
      date: "15/01/2025",
      opponent: "Real Madrid",
      opponentLogo: "https://logos.footyrenders.com/real-madrid.png",
      homeAway: "H",
      result: "2-1 W",
      goals: 1,
      assists: 1,
      rating: 8.5,
      minutesPlayed: 90,
    },
    {
      id: "match2",
      date: "10/01/2025",
      opponent: "Barcelona",
      opponentLogo: "https://logos.footyrenders.com/barcelona.png",
      homeAway: "A",
      result: "1-1 D",
      goals: 0,
      assists: 1,
      rating: 7.8,
      minutesPlayed: 85,
    },
  ],
  moments: [
    {
      id: "moment1",
      title:
        "5 Goals 3 Assists! Official: Álvarez Wins September Player of the Month Award",
      summary:
        "Outstanding performance in September makes him the standout player",
      time: "Yesterday",
      image:
        "https://assets.laliga.com/assets/2023/08/15/medium/1692100234.jpg",
      type: "award",
    },
    {
      id: "moment2",
      title:
        "Argentina Announces Latest Squad: Messi Leading, Lautaro, Spider in the List",
      summary: "National team call-up for upcoming international fixtures",
      time: "1 day ago",
      image:
        "https://assets.laliga.com/assets/2023/08/15/medium/1692100235.jpg",
      type: "news",
    },
    {
      id: "moment3",
      title:
        "Atletico Madrid Transfer Market Value Top 10: Álvarez Highest, Llorente Falls",
      summary: "Market value analysis shows Álvarez as most valuable player",
      time: "2 days ago",
      image:
        "https://assets.laliga.com/assets/2023/08/15/medium/1692100236.jpg",
      type: "transfer",
    },
  ],
};

// Generate mock moments data - synchronized with playerData.moments
const generatePlayerMoments = (playerData: PlayerData): PlayerMoment[] =>
  playerData.moments.map((moment, index) => ({
    id: moment.id,
    title: moment.title,
    description: moment.summary,
    imageUrl: moment.image,
    timestamp: moment.time,
    category: moment.type,
    readCount: Math.floor(Math.random() * 3000) + 500, // Random read count
    isHot: index < 2, // First two moments are "hot"
  }));

export default function NewsPlayerMoments({
  playerId,
  playerData: propPlayerData,
}: NewsPlayerMomentsProps) {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [moments, setMoments] = useState<PlayerMoment[]>([]);
  const scrollY = new Animated.Value(0);

  // Use provided data or fallback to mock data
  const playerData = propPlayerData || mockPlayerData;

  const isDarkMode = theme.colors.background !== "#FFFFFF";

  useEffect(() => {
    const playerMoments = generatePlayerMoments(playerData);
    setMoments(playerMoments);
  }, [playerData]);

  const handleBack = () => {
    router.back();
  };

  const handleShare = () => {
    console.log("Share player moments:", playerData.name);
  };

  const handleMomentPress = (moment: PlayerMoment) => {
    console.log(`🚀 [NewsPlayerMoments] Navigating to news-detail with article: "${moment.title}"`);
    
    // Format article data to match the official news detail screen format
    const validArticle = {
      id: moment.id || `news-${Date.now()}`,
      title: moment.title || "Untitled",
      description: moment.description || "",
      urlToImage: moment.imageUrl || "",
      publishedAt: new Date().toISOString(), // Use current time if no publishedAt available
      source: { name: "Sports News", id: "sports" },
      url: "#",
      content: moment.description || "",
      category: moment.category || "sports",
    };

    router.push({
      pathname: "/news/news-detail",
      params: { data: JSON.stringify(validArticle) },
    });
  };

  const formatMarketValue = (value: number): string => {
    if (value >= 1) {
      return `${value.toFixed(0)}M`;
    }
    return `${(value * 1000).toFixed(0)}K`;
  };

  // Header animation
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 150],
    outputRange: [1, 0.8],
    extrapolate: "clamp",
  });

  const renderMomentItem = (moment: PlayerMoment) => (
    <TouchableOpacity
      key={moment.id}
      style={[styles.momentItem, { borderBottomColor: theme.colors.border }]}
      onPress={() => handleMomentPress(moment)}
      activeOpacity={0.7}
    >
      <View style={styles.momentContent}>
        <View style={styles.momentHeader}>
          {moment.isHot && (
            <View
              style={[styles.hotBadge, { backgroundColor: theme.colors.error }]}
            >
              <Text
                style={[
                  styles.hotBadgeText,
                  { color: theme.colors.background },
                ]}
              >
                HOT
              </Text>
            </View>
          )}
        </View>
        <Text style={[styles.momentTitle, { color: theme.colors.text }]}>
          {moment.title}
        </Text>
        <Text
          style={[
            styles.momentTimestamp,
            { color: theme.colors.textSecondary },
          ]}
        >
          {moment.timestamp}
        </Text>
      </View>
      <Image source={{ uri: moment.imageUrl }} style={styles.momentImage} />
    </TouchableOpacity>
  );

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor={playerData.currentTeam.colors.primary}
      />

      {/* Player Header */}
      <Animated.View
        style={[
          styles.header,
          {
            backgroundColor: playerData.currentTeam.colors.primary,
            paddingTop: insets.top,
            opacity: headerOpacity,
          },
        ]}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <ArrowLeft color="white" size={24} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
            <Share2 color="white" size={24} />
          </TouchableOpacity>
        </View>

        <View style={styles.playerInfo}>
          <Image
            source={{ uri: playerData.photo }}
            style={styles.playerPhoto}
          />
          <View style={styles.playerDetails}>
            <Text style={styles.playerName}>{playerData.name}</Text>
            <Text style={styles.playerEnglishName}>
              {playerData.englishName}
            </Text>
            <Text style={styles.playerBasicInfo}>
              {playerData.age}y /{playerData.height}cm/{playerData.weight}kg
            </Text>
          </View>
        </View>

        <View style={styles.playerStats}>
          <View style={styles.statItem}>
            <Text style={styles.flagIcon}>{playerData.nationalityFlag}</Text>
            <Text style={styles.statLabel}>
              {playerData.nationality.slice(0, 3).toUpperCase()}/
              {playerData.jerseyNumber}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {playerData.position}/{playerData.preferredFoot}
            </Text>
            <Text style={styles.statLabel}>Position/Foot</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{playerData.jerseyNumber}</Text>
            <Text style={styles.statLabel}>Jersey</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {formatMarketValue(playerData.marketValue)}
            </Text>
            <Text style={styles.statLabel}>Value (€M)</Text>
          </View>
        </View>
      </Animated.View>

      {/* Tab Navigation - Moments Selected */}
      <View
        style={[
          styles.tabContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <View style={styles.tabWrapper}>
          <View
            style={[
              styles.activeTab,
              { borderBottomColor: playerData.currentTeam.colors.primary },
            ]}
          >
            <Text
              style={[
                styles.activeTabText,
                { color: playerData.currentTeam.colors.primary },
              ]}
            >
              Moments
            </Text>
          </View>
          <TouchableOpacity style={styles.inactiveTab}>
            <Text
              style={[
                styles.inactiveTabText,
                { color: theme.colors.textSecondary },
              ]}
            >
              Info
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.inactiveTab}>
            <Text
              style={[
                styles.inactiveTabText,
                { color: theme.colors.textSecondary },
              ]}
            >
              Stats
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.inactiveTab}>
            <Text
              style={[
                styles.inactiveTabText,
                { color: theme.colors.textSecondary },
              ]}
            >
              Matches
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.inactiveTab}>
            <Text
              style={[
                styles.inactiveTabText,
                { color: theme.colors.textSecondary },
              ]}
            >
              Ability
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Moments List */}
      <Animated.ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          {
            useNativeDriver: false,
          },
        )}
        scrollEventThrottle={16}
      >
        <View style={styles.momentsList}>{moments.map(renderMomentItem)}</View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  shareButton: {
    padding: 8,
  },
  playerInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  playerPhoto: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  playerDetails: {
    flex: 1,
  },
  playerName: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  playerEnglishName: {
    color: "white",
    fontSize: 16,
    opacity: 0.9,
    marginBottom: 4,
  },
  playerBasicInfo: {
    color: "white",
    fontSize: 14,
    opacity: 0.8,
  },
  playerStats: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  flagIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  statValue: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  statLabel: {
    color: "white",
    fontSize: 12,
    opacity: 0.8,
    textAlign: "center",
  },
  tabContainer: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  tabWrapper: {
    flexDirection: "row",
    paddingHorizontal: 16,
  },
  activeTab: {
    paddingVertical: 15,
    marginRight: 20,
    borderBottomWidth: 2,
  },
  activeTabText: {
    fontSize: 16,
    fontWeight: "600",
  },
  inactiveTab: {
    paddingVertical: 15,
    marginRight: 20,
  },
  inactiveTabText: {
    fontSize: 16,
    fontWeight: "500",
  },
  content: {
    flex: 1,
  },
  momentsList: {
    paddingVertical: 8,
  },
  momentItem: {
    flexDirection: "row",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    alignItems: "flex-start",
  },
  momentContent: {
    flex: 1,
    paddingRight: 16,
  },
  momentHeader: {
    flexDirection: "row",
    marginBottom: 8,
  },
  hotBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  hotBadgeText: {
    fontSize: 10,
    fontWeight: "bold",
  },
  momentTitle: {
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 22,
    marginBottom: 8,
  },
  momentTimestamp: {
    fontSize: 14,
  },
  momentImage: {
    width: 100,
    height: 75,
    borderRadius: 8,
  },
});
