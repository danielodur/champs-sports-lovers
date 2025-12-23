/**
 * Smart Vertical Content Renderer
 * 
 * This component intelligently:
 * 1. Fetches leagues/cups for the selected vertical tab (country)
 * 2. Smartly categorizes them into leagues, cups, and international
 * 3. Displays filtered data professionally in the center
 * 
 * Works dynamically for both Basketball and Football
 * NOTE: Sidebar is handled by parent component (stats-collapse-and-reveal)
 */

import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "../../hooks/useTheme";
import { useLeaguesByCountryFilter } from "../../hooks/useCountriesByRegion";
import { LeagueData } from "../../services/leaguesByRegionService";
import { getLeagueNavigationFromApi } from "../../utils/leagueSlugGenerator";
import leagueLogoService from "../../services/leagueLogoService";
import { sortLeaguesByRank } from "../../utils/leagueRanking";

type Region = "Hot" | "Top" | "Int'l" | "Africa" | "Europe" | "America" | "Oceania" | "Asia";

interface SmartVerticalDetectorProps {
  horizontalTab: Region;
  activeVerticalTab: string;
  sport: string;
}

interface CategorizedLeagues {
  leagues: LeagueData[];
  cups: LeagueData[];
  internationalCompetitions: LeagueData[];
}

/**
 * Smart League & Cup Detector
 * Intelligently categorizes competitions into leagues, cups, and international
 */
function smartCategorizeCompetitions(allCompetitions: LeagueData[]): CategorizedLeagues {
  const leagues: LeagueData[] = [];
  const cups: LeagueData[] = [];
  const internationalCompetitions: LeagueData[] = [];

  allCompetitions.forEach((competition) => {
    const name = competition.name.toLowerCase();
    const type = competition.type?.toLowerCase() || "";
    const country = competition.country?.toLowerCase() || "";

    // International competitions detection
    const isInternational =
      country === "world" ||
      country === "international" ||
      name.includes("champions league") ||
      name.includes("europa league") ||
      name.includes("conference league") ||
      name.includes("nations league") ||
      name.includes("world cup") ||
      name.includes("continental") ||
      name.includes("uefa") ||
      name.includes("fifa") ||
      name.includes("afcon") ||
      name.includes("copa america") ||
      name.includes("asian cup") ||
      name.includes("concacaf");

    if (isInternational) {
      internationalCompetitions.push(competition);
      return;
    }

    // Cup detection (smart keywords)
    const isCup =
      type === "cup" ||
      name.includes(" cup") ||
      name.includes("cup ") ||
      name.includes("trophy") ||
      name.includes("copa ") ||
      name.includes("coupe ") ||
      name.includes("pokal") ||
      name.includes("fa cup") ||
      name.includes("league cup") ||
      name.includes("super cup") ||
      name.includes("supercup") ||
      (name.includes("championship") && name.includes("cup"));

    if (isCup) {
      cups.push(competition);
    } else {
      leagues.push(competition);
    }
  });

  // ✅ CRITICAL: Sort each category by official rank (popularity/importance)
  // This ensures top-tier leagues appear first, followed by lower divisions
  const sortedLeagues = sortLeaguesByRank(leagues);
  const sortedCups = sortLeaguesByRank(cups);
  const sortedInternational = sortLeaguesByRank(internationalCompetitions);

  return { 
    leagues: sortedLeagues, 
    cups: sortedCups, 
    internationalCompetitions: sortedInternational 
  };
}

export default function SmartVerticalDetector({
  horizontalTab,
  activeVerticalTab,
  sport,
}: SmartVerticalDetectorProps) {
  const theme = useTheme();
  const router = useRouter();

  // Smart league filtering - fetches leagues for selected vertical tab (country)
  const { leagues: filteredLeagues, loading: leaguesLoading } = useLeaguesByCountryFilter(
    horizontalTab,
    activeVerticalTab,
    sport
  );

  // Memoized categorized leagues (leagues, cups, international)
  const categorizedData = useMemo(() => {
    return smartCategorizeCompetitions(filteredLeagues);
  }, [filteredLeagues]);

  // Render league/cup item
  const renderCompetitionItem = (competition: LeagueData) => {
    const logo = competition.logo || leagueLogoService.getLeagueLogo(competition.id);

    return (
      <TouchableOpacity
        key={competition.id}
        style={[
          styles.competitionCard,
          {
            backgroundColor: theme.colors.backgroundSecondary,
            borderColor: theme.colors.border,
          },
        ]}
        onPress={() => {
          const navPath = getLeagueNavigationFromApi({
            id: competition.id,
            name: competition.name,
            country: competition.country,
            logo: competition.logo,
          });
          router.push(navPath);
        }}
        activeOpacity={0.7}
      >
        {logo ? (
          <Image 
            source={{ uri: logo }} 
            style={styles.competitionLogo} 
            resizeMode="contain"
            // ✅ CRITICAL: Remove any tint that might cause white wash
            tintColor={undefined}
          />
        ) : (
          <View style={[styles.competitionLogoPlaceholder, { backgroundColor: theme.colors.border }]} />
        )}
        {/* ✅ CRITICAL: Display raw API league name - no hardcoded names */}
        <Text
          style={[styles.competitionName, { color: theme.colors.text }]}
          numberOfLines={2}
        >
          {competition.name}
        </Text>
      </TouchableOpacity>
    );
  };

  // Render section (Leagues, Cups, International)
  const renderSection = (title: string, competitions: LeagueData[]) => {
    if (competitions.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          {title} ({competitions.length})
        </Text>
        <View style={styles.competitionsGrid}>
          {competitions.map(renderCompetitionItem)}
        </View>
      </View>
    );
  };

  // Render center content only (sidebar is handled by parent)
  return (
    <View
      style={[
        styles.centerContent,
        {
          backgroundColor:
            theme.colors.backgroundSecondary === "#F5F5F5"
              ? theme.colors.background
              : "#2A2A2A",
        },
      ]}
    >
      {leaguesLoading ? (
        <View style={styles.centerLoadingContainer}>
          <ActivityIndicator size="large" color="#EF5350" />
          <Text style={[styles.centerLoadingText, { color: theme.colors.textSecondary }]}>
            Loading {sport} competitions...
          </Text>
        </View>
      ) : filteredLeagues.length > 0 ? (
        <View style={styles.scrollContent}>
          {renderSection("Leagues", categorizedData.leagues)}
          {renderSection("Cups", categorizedData.cups)}
          {renderSection("International", categorizedData.internationalCompetitions)}
        </View>
      ) : (
        <View style={styles.centerEmptyContainer}>
          <Text style={[styles.centerEmptyText, { color: theme.colors.textSecondary }]}>
            No {sport} competitions available
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  centerContent: {
    flex: 1,
    padding: 12,
  },
  scrollContent: {
    flex: 1,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
    paddingLeft: 4,
  },
  competitionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  competitionCard: {
    width: "30%",
    minWidth: 100,
    aspectRatio: 1,
    borderRadius: 12,
    padding: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  competitionLogo: {
    width: 40,
    height: 40,
    marginBottom: 8,
    // ✅ CRITICAL: Ensure logo maintains original colors - no white wash
    tintColor: undefined, // Remove any tint
  },
  competitionLogoPlaceholder: {
    width: 40,
    height: 40,
    marginBottom: 8,
    borderRadius: 20,
  },
  competitionName: {
    fontSize: 10,
    fontWeight: "600",
    textAlign: "center",
  },
  centerLoadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  centerLoadingText: {
    fontSize: 14,
    marginTop: 12,
  },
  centerEmptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  centerEmptyText: {
    fontSize: 14,
    textAlign: "center",
  },
});

