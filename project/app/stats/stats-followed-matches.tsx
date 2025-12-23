import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useTheme } from "../../hooks/useTheme";
import { useRouter } from "expo-router";
import FollowedMatches from "../../components/panel/matches-screens/followed-matches";
import { followedTeamsService, FollowedTeam } from "../../services/followedTeamsService";
import { checkTeamHasData } from "@/utils/basketballTeamDataCheck";

export default function StatsFollowedMatches({ sport = "football" }: { sport?: string }) {
  const theme = useTheme();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"events" | "teams">("events");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [followedTeams, setFollowedTeams] = useState<FollowedTeam[]>([]);
  const [matchCount, setMatchCount] = useState(0);

  useEffect(() => {
    if (activeTab === "teams") {
      loadFollowedTeams();
    }
  }, [activeTab]);

  const loadFollowedTeams = async () => {
    try {
      setLoading(true);
      const teams = await followedTeamsService.getFollowedTeams();
      setFollowedTeams(teams);
    } catch (error) {
      console.error("Error loading followed teams:", error);
      setFollowedTeams([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (activeTab === "teams") {
        await loadFollowedTeams();
      }
    } catch (error) {
      console.error("Error refreshing:", error);
    } finally {
      setRefreshing(false);
    }
  }, [activeTab]);

  const handleUnfollowTeam = async (teamId: string) => {
    try {
      const success = await followedTeamsService.unfollowTeam(teamId);
      if (success) {
        setFollowedTeams((prev) => prev.filter((t) => t.teamId !== teamId));
      }
    } catch (error) {
      console.error("Error unfollowing team:", error);
    }
  };

  const handleTeamPress = async (team: FollowedTeam) => {
    // ✅ BASKETBALL: Check if team has data before navigation
    const hasData = await checkTeamHasData(
      team.teamId,
      team.teamName,
      team.sport
    );
    
    if (!hasData) {
      console.warn(`⚠️ [StatsFollowedMatches] ${team.teamName} has no API data - navigation blocked`);
      return;
    }
    
    // Navigate to team details
    router.push({
      pathname: "/team-details",
      params: {
        teamId: team.teamId,
        teamName: team.teamName,
        sport: team.sport,
      },
    });
  };

  const handleMatchesLoaded = useCallback((count: number) => {
    setMatchCount(count);
    setLoading(false);
  }, []);

  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <View style={styles.emptyIllustration}>
        <View style={styles.boxContainer}>
          <View style={[styles.box, { backgroundColor: theme.colors.border }]}>
            <View style={styles.boxFlap} />
          </View>
          <Text style={styles.boxIcon}>⚽</Text>
        </View>
      </View>
      <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
        No data
      </Text>
    </View>
  );

  const renderTeamItem = (team: FollowedTeam) => {
    return (
      <TouchableOpacity
        key={team.teamId}
        style={[
          styles.teamListItem,
          {
            backgroundColor: "transparent",
            borderBottomColor: theme.colors.border || "rgba(255, 255, 255, 0.1)",
          },
        ]}
        onPress={() => handleTeamPress(team)}
        activeOpacity={0.7}
      >
        {/* Team Logo */}
        <View style={styles.teamLogoContainer}>
          {team.teamLogo ? (
            <Image
              source={{ uri: team.teamLogo }}
              style={styles.teamLogo}
              resizeMode="contain"
            />
          ) : (
            <View
              style={[
                styles.teamLogo,
                { backgroundColor: "transparent" },
              ]}
            >
              <Text style={{ fontSize: 16 }}>⚽</Text>
            </View>
          )}
        </View>

        {/* Team Name */}
        <View style={styles.teamInfo}>
          <Text
            style={[styles.teamName, { color: theme.colors.text }]}
            numberOfLines={1}
          >
            {team.teamName}
          </Text>
          {team.league && (
            <Text
              style={[styles.teamLeague, { color: theme.colors.textSecondary }]}
              numberOfLines={1}
            >
              {team.league}
            </Text>
          )}
        </View>

        {/* Unfollow Button */}
        <TouchableOpacity
          style={[
            styles.unfollowButton,
            { borderColor: theme.colors.border || "rgba(255, 255, 255, 0.2)" },
          ]}
          onPress={(e) => {
            e.stopPropagation();
            handleUnfollowTeam(team.teamId);
          }}
          activeOpacity={0.7}
        >
          <Text style={[styles.unfollowButtonText, { color: theme.colors.textSecondary }]}>
            Unfollow
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderContent = () => {
    if (activeTab === "events") {
      // Show followed matches using the FollowedMatches component
      return (
        <View style={styles.matchesContainer}>
          <FollowedMatches
            sport={sport} // ✅ Use dynamic sport prop instead of hardcoded "football"
            refreshing={refreshing}
            onRefresh={handleRefresh}
            onMatchCountChange={(count) => {
              setMatchCount(count);
              if (count === 0) setLoading(false);
            }}
            onMatchesLoaded={() => setLoading(false)}
          />
        </View>
      );
    } else {
      // Teams tab
      if (loading) {
        return (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF4757" />
          </View>
        );
      }

      if (followedTeams.length === 0) {
        return renderEmptyState();
      }

      return (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.teamsContentContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          {followedTeams.map((team) => renderTeamItem(team))}
        </ScrollView>
      );
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            {
              backgroundColor:
                activeTab === "events"
                  ? theme.colors.backgroundSecondary
                  : "transparent",
            },
          ]}
          onPress={() => setActiveTab("events")}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.tabText,
              {
                color:
                  activeTab === "events"
                    ? "#FF4757"
                    : theme.colors.textSecondary,
              },
            ]}
          >
            Events
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            {
              backgroundColor:
                activeTab === "teams"
                  ? theme.colors.backgroundSecondary
                  : "transparent",
            },
          ]}
          onPress={() => setActiveTab("teams")}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.tabText,
              {
                color:
                  activeTab === "teams"
                    ? "#FF4757"
                    : theme.colors.textSecondary,
              },
            ]}
          >
            Teams
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content - wrapped with matching background */}
      <View style={[styles.contentWrapper, { backgroundColor: theme.colors.backgroundSecondary }]}>
        {renderContent()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: 0,
    paddingTop: 4,
    paddingBottom: 0,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    marginHorizontal: 1,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
  },
  contentWrapper: {
    flex: 1,
    marginTop: -1,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    paddingTop: 4,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  matchesContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  teamsContentContainer: {
    paddingTop: 0,
    paddingBottom: 24,
  },
  teamListItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  teamLogoContainer: {
    marginRight: 12,
  },
  teamLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  teamInfo: {
    flex: 1,
    marginRight: 12,
  },
  teamName: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  teamLeague: {
    fontSize: 12,
    fontWeight: "400",
  },
  unfollowButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  unfollowButtonText: {
    fontSize: 13,
    fontWeight: "500",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 80,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 80,
  },
  emptyIllustration: {
    marginBottom: 16,
  },
  boxContainer: {
    position: "relative",
    width: 120,
    height: 120,
    justifyContent: "center",
    alignItems: "center",
  },
  box: {
    width: 80,
    height: 60,
    borderRadius: 8,
    position: "relative",
  },
  boxFlap: {
    position: "absolute",
    top: -10,
    left: 10,
    right: 10,
    height: 15,
    backgroundColor: "rgba(150, 150, 150, 0.3)",
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  boxIcon: {
    position: "absolute",
    bottom: 20,
    fontSize: 32,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: "500",
    marginTop: 8,
  },
});
