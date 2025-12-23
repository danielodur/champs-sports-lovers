import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "react-i18next";

interface DiscoverFollowedProps {
  onBackPress?: () => void;
}

export default function DiscoverFollowedScreen({
  onBackPress,
}: DiscoverFollowedProps = {}) {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  const [activeFilter, setActiveFilter] = useState("all");

  const followedFilters = [
    { id: "all", label: "All" },
    { id: "football", label: "Football" },
    { id: "basketball", label: "Basketball" },
  ];

  const followedPeople = [
    {
      id: "1",
      name: "John Expert",
      type: "expert",
      category: "football",
      followers: "12.5K",
      avatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
    },
    {
      id: "2",
      name: "Basketball Pro",
      type: "expert",
      category: "basketball",
      followers: "8.2K",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
    },
  ];

  const filteredFollowed =
    activeFilter === "all"
      ? followedPeople
      : followedPeople.filter((person) => person.category === activeFilter);

  return (
    <>
      <StatusBar
        barStyle={
          theme.colors.background === "#FFFFFF"
            ? "dark-content"
            : "light-content"
        }
        backgroundColor={theme.colors.background}
        translucent
      />
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        edges={["top"]}
      >
        <View
          style={[
            styles.followedContainer,
            { backgroundColor: theme.colors.background },
          ]}
        >
          {/* Filter Buttons */}
          <View style={styles.followedFilters}>
            {followedFilters.map((filter) => (
              <TouchableOpacity
                key={filter.id}
                style={[
                  styles.followedFilterButton,
                  {
                    backgroundColor:
                      activeFilter === filter.id
                        ? `${theme.colors.primary}15`
                        : theme.colors.backgroundSecondary,
                    borderColor:
                      activeFilter === filter.id
                        ? theme.colors.primary
                        : theme.colors.border || "rgba(255, 255, 255, 0.1)",
                  },
                ]}
                onPress={() => setActiveFilter(filter.id)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.followedFilterText,
                    {
                      color:
                        activeFilter === filter.id
                          ? theme.colors.primary
                          : theme.colors.textSecondary,
                    },
                  ]}
                >
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Content Area */}
          <View style={styles.followedContent}>
            {filteredFollowed.length > 0 ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                {filteredFollowed.map((person) => (
                  <TouchableOpacity
                    key={person.id}
                    style={[
                      styles.followedPersonCard,
                      { backgroundColor: theme.colors.background },
                    ]}
                  >
                    <Image
                      source={{ uri: person.avatar }}
                      style={styles.followedPersonAvatar}
                    />
                    <View style={styles.followedPersonInfo}>
                      <Text
                        style={[
                          styles.followedPersonName,
                          { color: theme.colors.text },
                        ]}
                      >
                        {person.name}
                      </Text>
                      <Text
                        style={[
                          styles.followedPersonType,
                          { color: theme.colors.textSecondary },
                        ]}
                      >
                        {person.type} • {person.followers} followers
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.followButton,
                        { backgroundColor: theme.colors.primary },
                      ]}
                    >
                      <Text style={styles.followButtonText}>Following</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.emptyState}>
                <View
                  style={[
                    styles.emptyStateIcon,
                    {
                      backgroundColor:
                        theme.colors.background === "#FFFFFF"
                          ? "#E5E5E5"
                          : "#404040",
                      borderColor:
                        theme.colors.border || "rgba(255, 255, 255, 0.1)",
                    },
                  ]}
                >
                  <View style={styles.emptyBoxContent}>
                    <View
                      style={[
                        styles.emptyBoxLine,
                        {
                          backgroundColor:
                            theme.colors.background === "#FFFFFF"
                              ? "#D1D5DB"
                              : "#6B7280",
                        },
                      ]}
                    />
                    <View
                      style={[
                        styles.emptyBoxLine,
                        styles.emptyBoxLineShort,
                        {
                          backgroundColor:
                            theme.colors.background === "#FFFFFF"
                              ? "#D1D5DB"
                              : "#6B7280",
                        },
                      ]}
                    />
                  </View>
                </View>
                <Text
                  style={[
                    styles.emptyStateText,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  No Followed Content
                </Text>
                <Text
                  style={[
                    styles.emptyStateSubtext,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Start following experts, teams, and community members to see
                  their updates here
                </Text>
              </View>
            )}
          </View>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  followedContainer: {
    flex: 1,
    paddingTop: 0,
  },
  followedFilters: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginBottom: 16,
    marginTop: -35,
    gap: 12,
  },
  followedFilterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  followedFilterText: {
    fontSize: 14,
    fontFamily: "Inter-Medium",
  },
  followedContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  followedPersonCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  followedPersonAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  followedPersonInfo: {
    flex: 1,
  },
  followedPersonName: {
    fontSize: 16,
    fontFamily: "Inter-SemiBold",
    marginBottom: 4,
  },
  followedPersonType: {
    fontSize: 13,
    fontFamily: "Inter-Regular",
  },
  followButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  followButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontFamily: "Inter-SemiBold",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyStateIcon: {
    width: 120,
    height: 80,
    borderRadius: 8,
    borderWidth: 2,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyBoxContent: {
    alignItems: "center",
    gap: 8,
  },
  emptyBoxLine: {
    width: 40,
    height: 3,
    borderRadius: 2,
  },
  emptyBoxLineShort: {
    width: 25,
  },
  emptyStateText: {
    fontSize: 18,
    fontFamily: "Inter-SemiBold",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyStateSubtext: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 40,
  },
});
