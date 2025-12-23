/**
 * Player Details - Moments Tab
 * Displays player news, highlights, awards, and transfer moments
 */

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";

interface Moment {
  id: string;
  title: string;
  summary: string;
  time: string;
  image: string;
  type: "news" | "highlight" | "award" | "transfer";
}

interface PlayerDetailsMomentsProps {
  moments: Moment[];
  theme: any;
  loading?: boolean;
}

export default function PlayerDetailsMoments({
  moments,
  theme,
  loading = false,
}: PlayerDetailsMomentsProps) {
  const router = useRouter();
  const isDarkMode = theme.colors.background === "#2A2A2A";

  const handleMomentPress = (moment: Moment) => {
    console.log(`🚀 [PlayerDetailsMoments] Navigating to news-detail with article: "${moment.title}"`);
    
    // Format article data to match the official news detail screen format
    const validArticle = {
      id: moment.id || `news-${Date.now()}`,
      title: moment.title || "Untitled",
      description: moment.summary || "",
      urlToImage: moment.image || "",
      publishedAt: new Date().toISOString(),
      source: { name: "Sports News", id: "sports" },
      url: "#",
      content: moment.summary || "",
      category: moment.type || "sports",
    };

    router.push({
      pathname: "/news/news-detail",
      params: { data: JSON.stringify(validArticle) },
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
          Loading moments...
        </Text>
      </View>
    );
  }

  if (!moments || moments.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
          No moments available
        </Text>
      </View>
    );
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "award":
        return "#FFD700";
      case "highlight":
        return "#FF6B35";
      case "transfer":
        return "#4CAF50";
      default:
        return theme.colors.primary;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "award":
        return "Award";
      case "highlight":
        return "Highlight";
      case "transfer":
        return "Transfer";
      default:
        return "News";
    }
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {moments.map((moment) => (
        <TouchableOpacity
          key={moment.id}
          style={[
            styles.momentCard,
            { 
              backgroundColor: isDarkMode 
                ? "rgba(255, 255, 255, 0.05)" 
                : "rgba(0, 0, 0, 0.03)",
              borderColor: isDarkMode
                ? "rgba(255, 255, 255, 0.1)"
                : "rgba(0, 0, 0, 0.1)",
            },
          ]}
          activeOpacity={0.7}
          onPress={() => handleMomentPress(moment)}
        >
          <View style={styles.momentContent}>
            <View style={styles.momentHeader}>
              <View
                style={[
                  styles.typeBadge,
                  { backgroundColor: getTypeColor(moment.type) + "20" },
                ]}
              >
                <Text
                  style={[
                    styles.typeBadgeText,
                    { color: getTypeColor(moment.type) },
                  ]}
                >
                  {getTypeLabel(moment.type)}
                </Text>
              </View>
              <Text style={[styles.momentTime, { color: theme.colors.textSecondary }]}>
                {moment.time}
              </Text>
            </View>
            <Text style={[styles.momentTitle, { color: theme.colors.text }]}>
              {moment.title}
            </Text>
            {moment.summary && (
              <Text
                style={[styles.momentSummary, { color: theme.colors.textSecondary }]}
                numberOfLines={2}
              >
                {moment.summary}
              </Text>
            )}
          </View>
          {moment.image && (
            <Image source={{ uri: moment.image }} style={styles.momentImage} />
          )}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 40,
    paddingHorizontal: 16,
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 40,
    paddingHorizontal: 16,
  },
  momentCard: {
    flexDirection: "row",
    borderRadius: 0,
    padding: 12,
    marginBottom: 1,
    borderWidth: 0,
    borderBottomWidth: 1,
  },
  momentContent: {
    flex: 1,
    marginRight: 12,
  },
  momentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  momentTime: {
    fontSize: 12,
  },
  momentTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 6,
    lineHeight: 20,
  },
  momentSummary: {
    fontSize: 13,
    lineHeight: 18,
  },
  momentImage: {
    width: 90,
    height: 90,
    borderRadius: 8,
  },
});

