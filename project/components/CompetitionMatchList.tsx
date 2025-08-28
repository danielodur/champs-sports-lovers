import React, { useState, useEffect, useCallback, useRef } from "react";
import { StyleSheet, Text, View, FlatList } from "react-native";
import MatchItem from "./MatchItem";
import { useTheme } from "@/hooks/useTheme";
import { useFavorites } from "@/hooks/useFavorites";
import { Match } from "@/types/match";
import { usePathname, useRouter } from "expo-router";
import teamLogoService from "@/services/teamLogoService";
// Removed leagueNormalizationService import - using API league names directly
import { favoritesService } from "@/services/favoritesService";

interface CompetitionMatchListProps {
  matches: Match[];
  onFavoritesChange?: () => void;
  onMatchCountChange?: (count: number) => void;
}

// League priority mapping for sorting - Higher ranking leagues come first
const leaguePriority: { [key: string]: number } = {
  // Tier 1: Top European Football Leagues
  "Premier League": 1,
  "UEFA Champions League": 2,
  "La Liga": 3,
  Bundesliga: 4,
  "Serie A": 5,
  "Ligue 1": 6,

  // Tier 2: European Competitions
  "Europa League": 7,
  "UEFA Europa League": 7,
  "Europa Conference League": 8,
  "UEFA Europa Conference League": 8,

  // Tier 3: Other Major Leagues
  Eredivisie: 9,
  "Primeira Liga": 10,
  "Belgium Pro League": 11,
  "Scottish Premiership": 12,

  // Basketball
  NBA: 1,
  EuroLeague: 2,
  FIBA: 3,

  // Rugby
  "Six Nations": 1,
  "Rugby World Cup": 1,
  "Premiership Rugby": 2,

  // Boxing
  WBC: 1,
  WBA: 1,
  IBF: 1,
  WBO: 1,

  // Default priority for unknown leagues
  Default: 999,
};

// Helper function to get league priority
const getLeaguePriority = (leagueName: string): number => {
  // Check for exact match first
  if (leaguePriority[leagueName]) {
    return leaguePriority[leagueName];
  }

  // Check for partial matches (e.g., "England Premier League" should match "Premier League")
  for (const [key, priority] of Object.entries(leaguePriority)) {
    if (leagueName.includes(key) || key.includes(leagueName)) {
      return priority;
    }
  }

  // Return default priority for unknown leagues
  return leaguePriority["Default"];
};

// Group matches by competition/league name
const groupByCompetition = (matches: Match[]) => {
  const groups: { [competition: string]: Match[] } = {};

  matches.forEach((match) => {
    // Use the league name directly from the API data
    let competitionName = match.league || "Other Competition";

    // Clean up the competition name - capitalize first letter of each word
    competitionName = competitionName
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");

    // Ensure we have a valid competition name
    if (!competitionName || competitionName.trim() === "") {
      competitionName = "Other Competition";
    }

    if (!groups[competitionName]) {
      groups[competitionName] = [];
    }
    groups[competitionName].push(match);
  });

  // Sort competitions by priority (same as league priority)
  const sortedCompetitions = Object.keys(groups).sort((a, b) => {
    const priorityA = getLeaguePriority(a);
    const priorityB = getLeaguePriority(b);
    return priorityA - priorityB;
  });

  return sortedCompetitions.map((competition) => ({
    competition,
    matches: groups[competition].sort((a, b) => {
      // Sort matches within each competition by status and time
      const statusPriority = { live: 1, upcoming: 2, finished: 3 };
      const priorityA = statusPriority[a.status] || 4;
      const priorityB = statusPriority[b.status] || 4;

      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      // If same status, sort by start time
      return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
    }),
  }));
};

export default function CompetitionMatchList({
  matches,
  onFavoritesChange,
  onMatchCountChange,
}: CompetitionMatchListProps) {
  const theme = useTheme();
  const { addFavorite, removeFavorite } = useFavorites();
  const pathname = usePathname();
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);

  // Group matches by competition
  const competitionGroups = groupByCompetition(matches);

  const toggleFavorite = useCallback(
    async (matchId: string) => {
      try {
        // Find the match in any competition group
        let match: Match | undefined;
        for (const group of competitionGroups) {
          match = group.matches.find((m) => m.id === matchId);
          if (match) break;
        }

        if (!match) {
          return;
        }

        // Store the original state for potential rollback
        const originalFavoriteStatus = match.isFavorite;
        const targetFavoriteStatus = !originalFavoriteStatus;

        // ✅ IMMEDIATE UI UPDATE for instant visual feedback
        // Update the match in the appropriate group
        const updatedGroups = competitionGroups.map((group) => ({
          ...group,
          matches: group.matches.map((m) =>
            m.id === matchId ? { ...m, isFavorite: targetFavoriteStatus } : m
          ),
        }));

        // ✅ CRITICAL FIX: Perform the actual backend operation based on ORIGINAL state
        let success = false;
        let operation = "";

        if (originalFavoriteStatus) {
          // Was favorited, so remove it
          operation = "REMOVE";
          success = await removeFavorite(matchId);
        } else {
          // Was not favorited, so add it
          operation = "ADD";
          success = await addFavorite(match);
        }

        if (success) {
          // ✅ ENHANCED: Force refresh of favorites count for button synchronization
          if (onFavoritesChange) {
            onFavoritesChange();
          }
        } else {
          // ✅ REVERT UI change if operation failed
          const revertedGroups = competitionGroups.map((group) => ({
            ...group,
            matches: group.matches.map((m) =>
              m.id === matchId
                ? { ...m, isFavorite: originalFavoriteStatus }
                : m
            ),
          }));

          // ✅ FORCE REFRESH: Try to refresh favorites count even on failure
          if (onFavoritesChange) {
            onFavoritesChange();
          }
        }
      } catch (error) {
        // Silently handle errors
      }
    },
    [competitionGroups, addFavorite, removeFavorite, onFavoritesChange]
  );

  const handleMatchPress = useCallback(
    (match: Match) => {
      // Using API Sports logos directly from match data
      const enhancedHomeLogo =
        match.home.logo ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(
          match.home.name.charAt(0)
        )}&background=FFD700&color=000000&size=128&rounded=true&font-size=0.6`;
      const enhancedAwayLogo =
        match.away.logo ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(
          match.away.name.charAt(0)
        )}&background=9CA3AF&color=FFFFFF&size=128&rounded=true&font-size=0.6`;

      router.push({
        pathname: "/match-details-new",
        params: {
          matchId: match.id,
        },
      });
    },
    [router]
  );

  const renderMatchItem = useCallback(
    ({ item }: { item: Match }) => (
      <MatchItem
        match={item}
        onToggleFavorite={toggleFavorite}
        onPress={handleMatchPress}
      />
    ),
    [toggleFavorite, handleMatchPress]
  );

  const renderCompetitionHeader = useCallback(
    ({ item }: { item: { competition: string; matches: Match[] } }) => (
      <View
        style={[
          styles.competitionHeader,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <Text
          style={[styles.competitionHeaderText, { color: theme.colors.text }]}
        >
          {item.competition}
        </Text>
      </View>
    ),
    [theme]
  );

  const renderCompetitionSection = useCallback(
    ({ item }: { item: { competition: string; matches: Match[] } }) => (
      <View style={styles.competitionSection}>
        {renderCompetitionHeader({ item })}
        {item.matches.map((match, index) => (
          <View key={`${match.id}-${index}`}>
            {renderMatchItem({ item: match })}
          </View>
        ))}
      </View>
    ),
    [renderCompetitionHeader, renderMatchItem]
  );

  if (matches.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
          No matches available
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={competitionGroups}
        renderItem={renderCompetitionSection}
        keyExtractor={(item) => item.competition}
        showsVerticalScrollIndicator={true}
        removeClippedSubviews={true}
        maxToRenderPerBatch={5}
        updateCellsBatchingPeriod={100}
        initialNumToRender={3}
        windowSize={5}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: "Inter-Medium",
    textAlign: "center",
  },
  competitionSection: {
    marginBottom: 8,
  },
  competitionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
    backgroundColor: "#F8F9FA",
  },
  competitionHeaderText: {
    fontSize: 16,
    fontFamily: "Inter-Bold",
    fontWeight: "bold",
  },
});
