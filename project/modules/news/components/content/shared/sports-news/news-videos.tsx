import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Video } from "lucide-react-native";
import { useTheme } from "@/hooks/useTheme";

interface NewsVideosProps {}

export default function NewsVideos({}: NewsVideosProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.newsSection,
        { backgroundColor: theme.colors.backgroundSecondary },
      ]}
    >
      <View style={styles.emptyContainer}>
        <Video size={48} color={theme.colors.textSecondary} />
        <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
          Videos Coming Soon
        </Text>
        <Text
          style={[styles.emptyText, { color: theme.colors.textSecondary }]}
        >
          TikTok-style video swiping will be implemented here
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  newsSection: {
    borderRadius: 12,
    padding: 16,
    paddingHorizontal: 8,
    marginBottom: 16,
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Inter-SemiBold",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
    textAlign: "center",
  },
});
