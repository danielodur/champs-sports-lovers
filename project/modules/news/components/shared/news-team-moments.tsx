import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "@/hooks/useTheme";

const { width } = Dimensions.get("window");

interface NewsItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  timestamp: string;
  category: string;
  readTime?: string;
}

interface NewsTeamMomentsProps {
  teamName?: string;
  leagueId?: string;
}

// Generate sample news data matching Chinese app layout
const generateNewsData = (teamName?: string): NewsItem[] => {
  const baseNews = [
    {
      id: "1",
      title: `${teamName || "Team"} tactical preparation intensifies ahead of KCCA FC clash`,
      description:
        "Latest updates on tactical preparations and squad readiness for the upcoming fixture.",
      imageUrl:
        "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=500&h=300&fit=crop",
      timestamp: "2 hours ago",
      category: "Match Preview",
    },
    {
      id: "2",
      title:
        "Key players return from injury boost for upcoming KCCA FC fixture",
      description:
        "Medical team confirms several key players are fit and available for selection.",
      imageUrl:
        "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=500&h=300&fit=crop",
      timestamp: "5 hours ago",
      category: "Team News",
    },
    {
      id: "3",
      title: `Match day preparations: ${teamName || "Team"} squad named for KCCA showdown`,
      description:
        "Final squad selection announced with tactical focus on attacking options.",
      imageUrl:
        "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=500&h=300&fit=crop",
      timestamp: "8 hours ago",
      category: "Squad News",
    },
    {
      id: "4",
      title: "Coach provides update on player fitness ahead of crucial match",
      description:
        "Latest fitness report and tactical insights from the coaching staff.",
      imageUrl:
        "https://images.unsplash.com/photo-1577223625816-7546f13df25d?w=500&h=300&fit=crop",
      timestamp: "12 hours ago",
      category: "Press Conference",
    },
    {
      id: "5",
      title:
        "Fan expectations high as team prepares for important league fixture",
      description:
        "Supporters rally behind the team ahead of crucial upcoming match.",
      imageUrl:
        "https://images.unsplash.com/photo-1459865264687-595d652de67e?w=500&h=300&fit=crop",
      timestamp: "1 day ago",
      category: "Fan News",
    },
  ];

  return baseNews.map((news, index) => ({
    ...news,
    id: `${news.id}-${teamName || "default"}-${index}`,
  }));
};

export default function NewsTeamMoments({
  teamName,
  leagueId,
}: NewsTeamMomentsProps) {
  const router = useRouter();
  const theme = useTheme();
  const [newsData, setNewsData] = useState<NewsItem[]>([]);

  const isDarkMode =
    theme.colors.background === "#2A2A2A" || theme.colors.text === "#FFFFFF";

  useEffect(() => {
    const news = generateNewsData(teamName);
    setNewsData(news);
  }, [teamName]);

  const handleNewsPress = (newsItem: NewsItem) => {
    console.log(`🚀 [NewsTeamMoments] Navigating to news-detail with article: "${newsItem.title}"`);
    
    // Format article data to match the official news detail screen format
    const validArticle = {
      id: newsItem.id || `news-${Date.now()}`,
      title: newsItem.title || "Untitled",
      description: newsItem.description || "",
      urlToImage: newsItem.imageUrl || "",
      publishedAt: new Date().toISOString(), // Use current time if no publishedAt available
      source: { name: "Sports News", id: "sports" },
      url: "#",
      content: newsItem.description || "",
      category: newsItem.category || "sports",
    };

    router.push({
      pathname: "/news/news-detail",
      params: { data: JSON.stringify(validArticle) },
    });
  };

  const renderNewsItem = (item: NewsItem) => (
    <TouchableOpacity
      key={item.id}
      style={[
        styles.newsItem,
        {
          borderBottomColor: theme.colors.border,
        },
      ]}
      onPress={() => handleNewsPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.newsContent}>
        <Text style={[styles.newsTitle, { color: theme.colors.text }]}>
          {item.title}
        </Text>
        <Text
          style={[styles.newsTimestamp, { color: theme.colors.textSecondary }]}
        >
          {item.timestamp}
        </Text>
      </View>
      <Image source={{ uri: item.imageUrl }} style={styles.newsImage} />
    </TouchableOpacity>
  );

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Latest Highlights
        </Text>
      </View>

      {/* News List */}
      <ScrollView
        style={styles.newsList}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.newsListContent}
      >
        {newsData.map(renderNewsItem)}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Inter-SemiBold",
  },
  newsList: {
    flex: 1,
  },
  newsListContent: {
    paddingBottom: 20,
  },
  newsItem: {
    flexDirection: "row",
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    marginHorizontal: -16,
    paddingHorizontal: 16,
    alignItems: "flex-start",
  },
  newsContent: {
    flex: 1,
    paddingRight: 16,
  },
  newsTitle: {
    fontSize: 15,
    fontWeight: "500",
    fontFamily: "Inter-Medium",
    lineHeight: 20,
    marginBottom: 6,
  },
  newsTimestamp: {
    fontSize: 12,
    fontFamily: "Inter-Regular",
  },
  newsImage: {
    width: 90,
    height: 70,
    borderRadius: 8,
  },
});
