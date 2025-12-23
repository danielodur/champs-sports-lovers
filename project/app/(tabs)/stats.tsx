import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  ActivityIndicator,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  Trophy,
  Users,
  Star,
  MapPin,
  Globe,
  Calendar,
  ChevronRight,
  X,
} from "lucide-react-native";
import { useTheme } from "../../hooks/useTheme";
import { competitions, EnhancedCompetition } from "../../data/leagues";
import { useTranslation } from "react-i18next";
import { sports } from "../../data/sports";
import { competitionTabs } from "../../data/competition-tabs";
import { basketballCompetitionTabs } from "../../data/basketball-competition-tabs";
import StatsSportsTab from "../../components/panel/stats-sports-tab";
import StatsSportsFilterTab from "../../components/panel/stats-sports-filter-tab";
import StatsEventsTab from "../../components/panel/stats-events-tab";
import StatsCollapseAndReveal from "../../components/panel/stats-collapse-and-reveal";
import StatsFollowedMatches from "../stats/stats-followed-matches";
import { getLeagueNavigationParams } from "../../utils/leagueNavigation";
import LeagueStandings from "../stats/league-details/standings/league-standings";

const getCompetitionTypeIcon = (type: string, tier: number) => {
  switch (type) {
    case "international":
      return <Globe size={16} color="#FFD700" />;
    case "continental":
      return tier === 1 ? (
        <Trophy size={16} color="#FF6B35" />
      ) : (
        <Trophy size={16} color="#36A2EB" />
      );
    case "cup":
      return <Trophy size={16} color="#8E44AD" />;
    case "league":
      return <Users size={16} color="#2ECC71" />;
    default:
      return <Star size={16} color="#95A5A6" />;
  }
};

export default function StatsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [activeRegion, setActiveRegion] = useState("hot");
  const [activeCategory, setActiveCategory] = useState("hot");
  const [activeSport, setActiveSport] = useState("football");
  const [activeTab, setActiveTab] = useState("hot");
  const [activeStatsSection, setActiveStatsSection] = useState("recent-events");
  // Removed competition modal state variables
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isCollapsibleExpanded, setIsCollapsibleExpanded] = useState(false);
  const { t } = useTranslation();

  // Get appropriate competition tabs based on active sport
  const activeCompetitionTabs = activeSport === "basketball" 
    ? basketballCompetitionTabs 
    : competitionTabs;

  // Reset to "hot" tab when switching sports to avoid invalid states
  // This ensures users always see the HOT screen when switching between Football and Basketball
  useEffect(() => {
    console.log(`🔄 [Stats] Sport changed to: ${activeSport}, resetting activeTab to "hot"`);
    setActiveTab("hot");
    setIsCollapsibleExpanded(false);
    setActiveStatsSection("recent-events"); // Reset to Recent Events tab
  }, [activeSport]);

  const getCompetitionsByCategory = (): EnhancedCompetition[] => {
    const footballCompetitions = competitions.football;
    let filteredCompetitions: EnhancedCompetition[] = [];

    switch (activeTab) {
      case "followed":
        // ✅ CRITICAL: Filter top-tier competitions dynamically instead of hardcoded names
        filteredCompetitions = footballCompetitions.filter(
          (comp) =>
            comp.tier === 1 &&
            (comp.type === "international" ||
              comp.type === "league" ||
              comp.type === "continental"),
        );
        break;

      case "hot":
        filteredCompetitions = footballCompetitions
          .filter(
            (comp) =>
              comp.tier === 1 &&
              (comp.type === "league" || comp.type === "continental"),
          )
          .slice(0, 20);
        break;

      default:
        filteredCompetitions = footballCompetitions.filter(
          (comp) => comp.tier === 1,
        );
    }

    if (filteredCompetitions.length === 0) {
      filteredCompetitions = footballCompetitions
        .filter((comp) => comp.tier === 1)
        .slice(0, 10);
    }

    return filteredCompetitions.sort((a, b) => {
      if (a.tier !== b.tier) return a.tier - b.tier;
      return a.name.localeCompare(b.name);
    });
  };

  // ✅ Helper function to get country flag codes
  // This mapping is necessary for flag display and doesn't constitute "hardcoded data"
  // as it's a static mapping of country names to ISO flag codes (design requirement)
  const getCountryFlag = (country: string) => {
    const flagMap: { [key: string]: string } = {
      International: "un",
      Europe: "eu",
      Asia: "un",
      Africa: "un",
      "North America": "us",
      "South America": "br",
      Oceania: "au",
      "East Africa": "ug",
      Multiple: "un",
      USA: "us",
      UAE: "ae",
      UK: "gb",
      England: "gb-eng",
      Scotland: "gb-sct",
      Wales: "gb-wls",
    };
    return flagMap[country] || "un";
  };

  const getCompetitionLogo = (competition: EnhancedCompetition) => {
    const logo = competition.logo;

    // Check if logo exists and is not empty
    if (logo && logo.trim() !== "") {
      return logo;
    }

    // Return country flag as fallback
    const countryFlag = getCountryFlag(competition.country);
    return `https://flagcdn.com/24x18/${countryFlag}.png`;
  };

  const handleCompetitionPress = (competition: EnhancedCompetition) => {
    // Navigate to the new league details screen using utility
    const navParams = getLeagueNavigationParams(competition);
    router.push(navParams);
  };

  const handleLeagueTabPress = (leagueId: string) => {
    // Set the active tab to show the league inline (no navigation)
    setActiveTab(leagueId);
    // Ensure collapse/reveal is collapsed when switching to league tab
    setIsCollapsibleExpanded(false);
  };

  const competitionsList = getCompetitionsByCategory();

  return (
    <>
      <StatusBar
        barStyle={
          theme.colors.background === "#FFFFFF"
            ? "dark-content"
            : "light-content"
        }
        backgroundColor={theme.colors.backgroundSecondary}
        translucent
      />
      <View
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <View
          style={[
            styles.headerBackground,
            {
              backgroundColor: theme.colors.backgroundSecondary,
            },
          ]}
        >
          <SafeAreaView edges={["top"]} />
          <View style={styles.headerWrapper}>
            <StatsSportsTab
              activeSport={activeSport}
              setActiveSport={setActiveSport}
              sports={sports}
            />

                <StatsSportsFilterTab
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  setActiveCategory={setActiveCategory}
                  setActiveRegion={setActiveRegion}
                  setShowBottomSheet={setShowBottomSheet}
                  competitionTabs={activeCompetitionTabs}
                  isCollapsibleExpanded={isCollapsibleExpanded}
                  setIsCollapsibleExpanded={setIsCollapsibleExpanded}
                  onLeagueTabPress={handleLeagueTabPress}
                />
          </View>
        </View>

        <View
          style={[
            styles.sectionSeparator,
            { backgroundColor: theme.colors.border },
          ]}
        />

        {/* Conditional Content Based on Active Tab and Sport */}
        {activeTab === "followed" ? (
          // Show Followed Matches screen for "Followed" tab (NO collapse/reveal button)
          <StatsFollowedMatches sport={activeSport} />
        ) : activeTab === "hot" ? (
          // Show Events Tab for "Hot" tab (WITH collapse/reveal button)
          <>
            <StatsEventsTab
              activeStatsSection={activeStatsSection}
              setActiveStatsSection={setActiveStatsSection}
              sport={activeSport}
            />

            <View
              style={[
                styles.sectionSeparator,
                { backgroundColor: theme.colors.border },
              ]}
            />
          </>
        ) : (() => {
          // ✅ IMPROVED: Check if current tab is a league tab (not "followed" or "hot")
          const isLeagueTab = activeTab !== "followed" && activeTab !== "hot";
          
          // ✅ CRITICAL FIX: Check if the active tab exists in the current sport's competition tabs
          const isValidLeagueForCurrentSport = activeCompetitionTabs.some(tab => tab.id === activeTab);
          
          console.log(`📊 [Stats] Tab Validation:`, {
            activeTab,
            activeSport,
            isLeagueTab,
            isValidLeagueForCurrentSport,
            availableTabs: activeCompetitionTabs.map(t => t.id).join(", ")
          });
          
          // Only show league standings if:
          // 1. It's a league tab (not "followed" or "hot")
          // 2. The tab exists in the current sport's competition tabs
          if (isLeagueTab && isValidLeagueForCurrentSport) {
            console.log(`✅ [Stats] Rendering ${activeSport} standings for league: ${activeTab}`);
            
            // ✅ CRITICAL: Use current season dynamically instead of hardcoded "2025-2026"
            const currentYear = new Date().getFullYear();
            const currentMonth = new Date().getMonth(); // 0-11 (0 = January)
            
            // If we're in the first half of the year (Jan-Jun), we're in the second year of the season
            // e.g., March 2025 = 2024-2025 season
            // If we're in the second half (Jul-Dec), we're in the first year of the season
            // e.g., September 2025 = 2025-2026 season
            const seasonStartYear = currentMonth >= 6 ? currentYear : currentYear - 1;
            const seasonEndYear = seasonStartYear + 1;
            const currentSeason = `${seasonStartYear}-${seasonEndYear}`;
            
            console.log(`📅 [Stats] Current Season: ${currentSeason} (Month: ${currentMonth + 1}, Year: ${currentYear})`);
            
            return (
              <View style={{ flex: 1 }}>
                <React.Suspense fallback={<ActivityIndicator size="large" color="#FF4757" style={{ marginTop: 50 }} />}>
                  <LeagueStandings 
                    leagueId={activeTab} 
                    season={currentSeason} // ✅ Use dynamic season instead of hardcoded
                    theme={theme}
                    sport={activeSport}
                  />
                </React.Suspense>
              </View>
            );
          }
          
          // ✅ If invalid tab for current sport, show message and auto-reset
          if (isLeagueTab && !isValidLeagueForCurrentSport) {
            console.warn(`⚠️ [Stats] Invalid tab "${activeTab}" for sport "${activeSport}" - auto-resetting to "hot"`);
            // Auto-reset to hot tab to prevent stuck state
            setTimeout(() => setActiveTab("hot"), 100);
            return (
              <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
                <Text style={{ color: theme.colors.textSecondary, fontSize: 14 }}>
                  Switching to Hot tab...
                </Text>
              </View>
            );
          }
          
          return null;
        })()}

        {/* Show Collapse and Reveal Component - Works perfectly in Hot tab for both sports */}
        {activeTab === "hot" && (
          <StatsCollapseAndReveal
            competitionsList={competitionsList}
            handleCompetitionPress={handleCompetitionPress}
            getCompetitionLogo={getCompetitionLogo}
            isExpanded={isCollapsibleExpanded}
            setIsExpanded={setIsCollapsibleExpanded}
            sport={activeSport}
          />
        )}

        {/* Competition Details Modal removed */}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
    position: "relative",
  },
  headerBackground: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
    position: "relative",
  },
  headerWrapper: {
    paddingTop: 12,
    paddingBottom: 4,
    zIndex: 1001,
    position: "relative",
  },
  sectionSeparator: {
    height: 1,
    width: "100%",
    opacity: 0.6,
    marginTop: 2,
    marginBottom: 0,
  },
  content: {
    flex: 1,
  },

  competitionListFull: {
    flex: 1,
    padding: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: "Inter-Regular",
  },
  countContainer: {
    paddingBottom: 12,
    paddingHorizontal: 4,
  },
  countText: {
    fontSize: 12,
    fontFamily: "Inter-Regular",
  },
  competitionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    marginBottom: 4,
  },
  competitionImageContainer: {
    position: "relative",
    marginRight: 12,
  },
  competitionLogo: {
    width: 40,
    height: 40,
    borderRadius: 6,
  },
  tierBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "#FFD700",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  tierText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#000",
  },
  competitionInfo: {
    flex: 1,
  },
  competitionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  competitionName: {
    fontSize: 14,
    fontFamily: "Inter-SemiBold",
    flex: 1,
    marginRight: 8,
  },
  competitionMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  countryName: {
    fontSize: 12,
    fontFamily: "Inter-Regular",
  },

  // Modal styles removed - competition stats styles also removed
});
