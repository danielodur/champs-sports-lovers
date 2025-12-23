import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, TouchableOpacity, Image, Platform } from "react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "../../hooks/useTheme";
import { useRouter, useFocusEffect } from "expo-router";
import { getRecentVisits, type LeagueVisit } from "../../services/leagueVisitsService";
import { getLeagueApiId } from "../../app/stats/league-details/[leagueId]";

interface StatsRecentVisitsProps {
  onVisitPress?: (visit: LeagueVisit) => void;
  sport?: string; // Add sport parameter to filter data by sport type
}

export default function StatsRecentVisits({
  onVisitPress,
  sport = "football", // Default to football
}: StatsRecentVisitsProps) {
  const theme = useTheme();
  const router = useRouter();
  const [recentVisits, setRecentVisits] = useState<LeagueVisit[]>([]);
  const [loading, setLoading] = useState(false); // Start with false for instant render

  // Refresh when screen comes into focus OR when sport changes
  useFocusEffect(
    React.useCallback(() => {
      loadRecentVisits();
    }, [sport]) // ✅ Add sport dependency to reload when switching sports
  );

  // Also reload immediately when sport changes (don't wait for focus)
  useEffect(() => {
    loadRecentVisits();
  }, [sport]);

  const loadRecentVisits = async () => {
    try {
      // Don't show loading spinner - load instantly from AsyncStorage
      const visits = await getRecentVisits(9, sport);
      
      // Always ensure 9 slots (fill with empty if needed)
      const filledVisits: LeagueVisit[] = [];
      for (let i = 0; i < 9; i++) {
        if (visits[i]) {
          filledVisits.push(visits[i]);
        } else {
          // Empty slot
          filledVisits.push({
            leagueId: `empty-${i}`,
            leagueName: "No Visit",
            leagueLogo: "",
            country: "",
            lastVisited: 0,
            visitCount: 0,
          });
        }
      }
      
      setRecentVisits(filledVisits);
    } catch (error) {
      console.error("Failed to load recent visits:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVisitPress = (visit: LeagueVisit) => {
    // Don't navigate if it's an empty slot
    if (visit.visitCount === 0) return;
    
    // Haptic feedback for smooth UX
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    if (onVisitPress) {
      onVisitPress(visit);
    }
    
    // Navigate to league details Matches tab
    try {
      // Try to get API ID from leagueId slug
      const apiLeagueId = getLeagueApiId(visit.leagueId);
      
      router.push({
        pathname: "/stats/league-details/[leagueId]" as const,
        params: {
          leagueId: visit.leagueId,
          leagueName: visit.leagueName,
          country: visit.country,
          logoUrl: visit.leagueLogo || "",
          apiLeagueId: apiLeagueId ? apiLeagueId.toString() : undefined,
          tab: "matches", // Navigate to Matches tab
        },
      });
    } catch (error) {
      console.error("Navigation error:", error);
    }
  };

  const renderVisitItem = (visit: LeagueVisit, index: number) => {
    const isLeftColumn = index % 3 === 0;
    const isRightColumn = index % 3 === 2;
    const isEmpty = visit.visitCount === 0;

    return (
      <TouchableOpacity
        key={visit.leagueId}
        style={[
          styles.visitItem,
          {
            backgroundColor: isEmpty 
              ? (theme.colors.background === "#121212" ? "#1A1A1A" : "#F5F5F5")
              : theme.colors.backgroundSecondary,
            borderColor: theme.colors.border || "rgba(255, 255, 255, 0.1)",
            marginLeft: isLeftColumn ? 0 : 8,
            marginRight: isRightColumn ? 0 : 8,
            opacity: isEmpty ? 0.4 : 1,
          },
        ]}
        onPress={() => handleVisitPress(visit)}
        activeOpacity={isEmpty ? 1 : 0.7}
        disabled={isEmpty}
      >
        {!isEmpty ? (
          <>
            <View style={styles.visitHeader}>
              {visit.leagueLogo ? (
                <Image
                  source={{ uri: visit.leagueLogo }}
                  style={styles.leagueLogo}
                  resizeMode="contain"
                />
              ) : (
                <View style={[styles.leagueLogo, { backgroundColor: theme.colors.border }]}>
                  <Text style={{ fontSize: 8 }}>🏆</Text>
                </View>
              )}
              <View style={styles.statusIndicator}>
                <View style={[styles.statusDot, { backgroundColor: "#FF9800" }]} />
              </View>
            </View>

            <Text
              style={[styles.leagueName, { color: theme.colors.text }]}
              numberOfLines={1}
            >
              {visit.leagueName}
            </Text>

            <Text
              style={[styles.visitCount, { color: theme.colors.textSecondary }]}
            >
              {visit.visitCount} visits
            </Text>
          </>
        ) : (
          <View style={styles.emptySlot}>
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              0
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.visitsGrid}>
        {recentVisits.map((visit, index) => renderVisitItem(visit, index))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 4,
    height: 240,
    paddingBottom: 6,
  },

  visitsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 8,
    justifyContent: "space-around",
  },
  visitItem: {
    width: "30%",
    marginBottom: 8,
    marginHorizontal: "1.5%",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    minHeight: 68,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  visitHeader: {
    position: "relative",
    marginBottom: 3,
    alignItems: "center",
  },
  leagueLogo: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  statusIndicator: {
    position: "absolute",
    top: -2,
    right: -2,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  leagueName: {
    fontSize: 10,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 1,
    lineHeight: 12,
  },
  visitCount: {
    fontSize: 9,
    textAlign: "center",
    fontWeight: "400",
    opacity: 0.7,
  },
  emptySlot: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "bold",
    opacity: 0.3,
  },
});
