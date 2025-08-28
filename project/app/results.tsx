import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Image,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  ChevronLeft,
  Search,
  Filter,
  Calendar,
  Clock,
  Trophy,
  Target,
  Flag,
  Settings,
  ChevronRight,
  ChevronDown,
  Star,
  Play,
} from "lucide-react-native";
import { useTheme } from "@/hooks/useTheme";
import { fetchMatches } from "@/services/matchService";
import { useFavorites } from "@/hooks/useFavorites";
import type { Match } from "@/types/match";
import teamLogoService from "@/services/teamLogoService";
import { leagueNormalizationService } from "@/services/leagueNormalizationService"; // ✅ CRITICAL: Add league normalization

interface MatchResult {
  id: string;
  competition: string;
  date: string;
  time: string;
  homeTeam: {
    name: string;
    logo: string;
    score: number;
    scorers?: string[];
  };
  awayTeam: {
    name: string;
    logo: string;
    score: number;
    scorers?: string[];
  };
  status: "FT" | "HT" | "LIVE" | "UPCOMING";
  hasHighlights: boolean;
  hasStats: boolean;
  isFavorite: boolean;
}

export default function ResultsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { addFavorite, removeFavorite, isFavorite } = useFavorites();
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [expandedResult, setExpandedResult] = useState<string | null>(null);

  // ✅ NEW: Real API integration states
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tabs = [
    { id: "all", label: "All" },
    { id: "football", label: "Football" },
    { id: "basketball", label: "Basketball" },
    { id: "rugby", label: "Rugby" },
    { id: "boxing", label: "Boxing" },
  ];

  // ✅ ENHANCED: Generate date options like Chinese app with proper formatting
  const generateDateOptions = () => {
    const dates: { label: string; value: string; date: Date }[] = [];
    const today = new Date();

    // Add "Today" (今天)
    dates.push({
      label: "Today",
      value: today.toISOString().split("T")[0],
      date: today,
    });

    // Add previous 6 days with proper format like Chinese app
    for (let i = 1; i <= 6; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);

      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const dayName = dayNames[date.getDay()];

      let label: string;
      if (i === 1) {
        label = "Yesterday";
      } else {
        // Format like Chinese app: "07/21" or "Jul 21"
        label = `${month}/${day}`;
      }

      dates.push({
        label,
        value: date.toISOString().split("T")[0],
        date,
      });
    }

    return dates;
  };

  const dateOptions = generateDateOptions();

  // ✅ ENHANCED: Load ALL matches from API for comprehensive All matches screen
  const loadAllMatches = useCallback(
    async (dateToLoad?: string) => {
      try {
        setError(null);
        const targetDate = dateToLoad || selectedDate;

        console.log(
          `🌍 RESULTS: Loading ALL matches for ${targetDate} (${
            targetDate === new Date().toISOString().split("T")[0]
              ? "TODAY"
              : "SELECTED DATE"
          })`
        );

        // ✅ ENHANCED: For All matches, don't filter by specific date to get comprehensive data
        // Live matches are always current, fixtures span multiple days
        const allMatches = await fetchMatches("football", "all");

        console.log(
          `🌍 RESULTS: Loaded ${allMatches.length} matches total for ${targetDate}`
        );

        // ✅ DEBUG: Show match type breakdown in All matches screen
        const matchTypeBreakdown: Record<string, number> = {};
        allMatches.forEach((match) => {
          const status = match?.status || "unknown";
          matchTypeBreakdown[status] = (matchTypeBreakdown[status] || 0) + 1;
        });
        console.log(`📊 ALL MATCHES BREAKDOWN:`, matchTypeBreakdown);

        // ✅ DEBUG: Show sample matches from each type
        const liveMatches = allMatches.filter((m) => m.status === "live");
        const upcomingMatches = allMatches.filter(
          (m) => m.status === "upcoming"
        );
        const finishedMatches = allMatches.filter(
          (m) => m.status === "finished"
        );

        console.log(
          `🔴 LIVE in ALL SCREEN (${liveMatches.length}):`,
          liveMatches
            .slice(0, 3)
            .map((m) => `${m.home.name} vs ${m.away.name} - ${m.statusText}`)
        );
        console.log(
          `📅 UPCOMING in ALL SCREEN (${upcomingMatches.length}):`,
          upcomingMatches
            .slice(0, 3)
            .map(
              (m) =>
                `${m.home.name} vs ${m.away.name} - ${new Date(
                  m.startTime
                ).toLocaleTimeString()}`
            )
        );
        console.log(
          `🏁 FINISHED in ALL SCREEN (${finishedMatches.length}):`,
          finishedMatches
            .slice(0, 3)
            .map((m) => `${m.home.name} vs ${m.away.name} - ${m.score}`)
        );

        // Enhance with team logos - sorting is already handled by fetchMatches
        const enhancedMatches = allMatches.map((match) =>
          teamLogoService.enhanceMatchWithLogos(match)
        );

        setMatches(enhancedMatches);
      } catch (err) {
        console.error("❌ RESULTS: Error loading all matches:", err);
        setError("Failed to load matches. Please try again.");
        setMatches([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [selectedDate]
  );

  // ✅ ENHANCED: Load matches when component mounts or date changes
  useEffect(() => {
    loadAllMatches();
  }, [selectedDate, loadAllMatches]);

  // ✅ ENHANCED: Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAllMatches();
  }, [loadAllMatches]);

  // ✅ ENHANCED: Handle tab change (in future can filter by sport)
  const handleTabChange = useCallback(
    (tabId: string) => {
      setActiveTab(tabId);
      // In future, can add sport filtering here
      loadAllMatches();
    },
    [loadAllMatches]
  );

  const matchResults: MatchResult[] = [
    {
      id: "1",
      competition: "Premier League",
      date: "2024-01-15",
      time: "19:45",
      homeTeam: {
        name: "Arsenal",
        logo: "https://images.pexels.com/photos/274506/pexels-photo-274506.jpeg",
        score: 3,
        scorers: ["Saka (23')", "Ødegaard (45')", "Martinelli (78')"],
      },
      awayTeam: {
        name: "Manchester City",
        logo: "https://images.pexels.com/photos/1884574/pexels-photo-1884574.jpeg",
        score: 1,
        scorers: ["Haaland (56')"],
      },
      status: "FT",
      hasHighlights: true,
      hasStats: true,
      isFavorite: true,
    },
    {
      id: "2",
      competition: "NBA",
      date: "2024-01-15",
      time: "20:30",
      homeTeam: {
        name: "Lakers",
        logo: "https://images.pexels.com/photos/1752757/pexels-photo-1752757.jpeg",
        score: 112,
        scorers: ["James (32 pts)", "Davis (28 pts)", "Reaves (18 pts)"],
      },
      awayTeam: {
        name: "Warriors",
        logo: "https://images.pexels.com/photos/1618200/pexels-photo-1618200.jpeg",
        score: 106,
        scorers: ["Curry (35 pts)", "Thompson (22 pts)", "Green (12 pts)"],
      },
      status: "FT",
      hasHighlights: true,
      hasStats: true,
      isFavorite: false,
    },
    {
      id: "3",
      competition: "Champions League",
      date: "2024-01-16",
      time: "20:00",
      homeTeam: {
        name: "Real Madrid",
        logo: "https://images.pexels.com/photos/274506/pexels-photo-274506.jpeg",
        score: 2,
        scorers: ["Vinicius Jr. (34')", "Bellingham (67')"],
      },
      awayTeam: {
        name: "Bayern Munich",
        logo: "https://images.pexels.com/photos/1884574/pexels-photo-1884574.jpeg",
        score: 2,
        scorers: ["Kane (12')", "Musiala (89')"],
      },
      status: "FT",
      hasHighlights: true,
      hasStats: true,
      isFavorite: true,
    },
  ];

  const toggleResultExpansion = (resultId: string) => {
    setExpandedResult(expandedResult === resultId ? null : resultId);
  };

  const handleToggleFavorite = async (match: Match) => {
    try {
      if (match.isFavorite) {
        await removeFavorite(match.id);
      } else {
        await addFavorite(match);
      }

      // Update local state
      setMatches((prevMatches) =>
        prevMatches.map((m) =>
          m.id === match.id ? { ...m, isFavorite: !m.isFavorite } : m
        )
      );
    } catch (error) {
      console.error("❌ Error toggling favorite:", error);
    }
  };

  const viewHighlights = (resultId: string) => {
    // In a real app, this would navigate to highlights
    console.log(`View highlights for result ${resultId}`);
  };

  const viewStats = (resultId: string) => {
    // ✅ ENHANCED: Navigate to match details with real corner kick and half-time data
    const match = matches.find((m) => m.id === resultId);
    if (match) {
      // ✅ ENHANCED: Log corner and half-time data before navigation
      console.log(
        `🚩 NAVIGATING TO MATCH DETAILS: ${match.home.name} vs ${
          match.away.name
        } - Corners: ${match.home.corners || 0}-${
          match.away.corners || 0
        }, HT: ${match.halfTimeScore || "--"}`
      );

      router.push({
        pathname: "/match-details",
        params: {
          id: match.id,
          homeTeam: match.home.name,
          awayTeam: match.away.name,
          league: (() => {
            // ✅ CRITICAL: Pass normalized league name to match-details
            const teamNames = `${match.home.name} ${match.away.name}`;
            const normalizedLeague =
              leagueNormalizationService.normalizeLeagueName(
                match.league,
                teamNames
              );
            console.log(
              `🏆 RESULTS NAV: Passing "${match.league}" → "${
                normalizedLeague || match.league
              }" to match-details`
            );
            return normalizedLeague || match.league;
          })(),
          status: match.status,
          statusText: match.statusText || "FT",
          score: match.score,
          startTime: match.startTime,
          sport: match.sport,
          halfTimeScore: match.halfTimeScore || "--", // ✅ CRITICAL: Pass real half-time score
          homeCorners: match.home.corners || 0, // ✅ CRITICAL: Pass real corner data
          awayCorners: match.away.corners || 0, // ✅ CRITICAL: Pass real corner data
        },
      });
    } else {
      console.log(`⚠️ Match not found for ID: ${resultId}`);
    }
  };

  const renderHeader = () => (
    <View
      style={[
        styles.header,
        { backgroundColor: theme.colors.backgroundSecondary },
      ]}
    >
      <TouchableOpacity
        onPress={() => router.back()}
        style={styles.backButton}
        activeOpacity={0.7}
      >
        <ChevronLeft size={28} color={theme.colors.text} />
      </TouchableOpacity>
      <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
        Results
      </Text>
      <TouchableOpacity style={styles.settingsButton} activeOpacity={0.7}>
        <Settings size={24} color={theme.colors.text} />
      </TouchableOpacity>
    </View>
  );

  const renderTabs = () => (
    <View
      style={[
        styles.tabContainer,
        { backgroundColor: theme.colors.backgroundSecondary },
      ]}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabScrollContent}
      >
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tab,
              activeTab === tab.id && {
                borderBottomColor: theme.colors.primary,
              },
            ]}
            onPress={() => handleTabChange(tab.id)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText,
                { color: theme.colors.textSecondary },
                activeTab === tab.id && { color: theme.colors.primary },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderSearchAndFilter = () => (
    <View style={styles.searchFilterContainer}>
      <View
        style={[
          styles.searchContainer,
          { backgroundColor: theme.colors.backgroundSecondary },
        ]}
      >
        <Search size={20} color={theme.colors.textSecondary} />
        <TextInput
          style={[
            styles.searchInput,
            {
              color: theme.colors.text,
            },
          ]}
          placeholder="Search results..."
          placeholderTextColor={theme.colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <TouchableOpacity
        style={[
          styles.filterButton,
          { backgroundColor: theme.colors.backgroundSecondary },
        ]}
        activeOpacity={0.7}
      >
        <Filter size={20} color={theme.colors.text} />
      </TouchableOpacity>
    </View>
  );

  const renderDateSelector = () => (
    <View style={styles.dateSelectorContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dateOptions}
      >
        {dateOptions.map((dateOption) => (
          <TouchableOpacity
            key={dateOption.value}
            style={[
              styles.dateOption,
              {
                backgroundColor:
                  selectedDate === dateOption.value
                    ? theme.colors.primary
                    : theme.colors.backgroundSecondary,
              },
            ]}
            onPress={() => setSelectedDate(dateOption.value)}
            activeOpacity={0.7}
          >
            <Calendar
              size={16}
              color={
                selectedDate === dateOption.value
                  ? "#FFFFFF"
                  : theme.colors.text
              }
            />
            <Text
              style={[
                styles.dateOptionText,
                {
                  color:
                    selectedDate === dateOption.value
                      ? "#FFFFFF"
                      : theme.colors.text,
                },
              ]}
            >
              {dateOption.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  // Helper function to format team names with smart word breaking
  const formatTeamName = (teamName: string) => {
    if (!teamName) return "Team";

    const cleanName = teamName.trim();

    // DIRECT FIX: Handle "Duquecaxiense" specifically
    if (cleanName.toLowerCase() === "duquecaxiense") {
      return "Duque\nCaxiense";
    }

    // Check if it's a multi-word name
    const words = cleanName.split(" ");

    console.log(
      `🔍 RESULTS: Formatting "${cleanName}" with ${
        words.length
      } words: [${words.join(", ")}]`
    );

    // SINGLE WORD: Check if it's too long and needs breaking
    if (words.length === 1) {
      // If single word is longer than 10 characters, break it
      if (cleanName.length > 10) {
        // Check for known prefixes
        const prefixes = ["san", "real", "new", "los", "las", "st", "fc"];
        for (const prefix of prefixes) {
          if (cleanName.toLowerCase().startsWith(prefix)) {
            const remaining = cleanName.substring(prefix.length).trim();
            if (remaining.length > 0) {
              return (
                prefix.charAt(0).toUpperCase() +
                prefix.substring(1) +
                "\n" +
                remaining
              );
            }
          }
        }

        // For other single long words, break at reasonable points
        const midPoint = Math.floor(cleanName.length / 2);
        let breakPoint = midPoint;

        // Try to find a better break point (like after consonants)
        for (
          let i = Math.floor(cleanName.length * 0.4);
          i <= Math.floor(cleanName.length * 0.6);
          i++
        ) {
          const char = cleanName[i].toLowerCase();
          if ("bcdfghjklmnpqrstvwxyz".includes(char)) {
            breakPoint = i + 1;
            break;
          }
        }

        return (
          cleanName.substring(0, breakPoint) +
          "\n" +
          cleanName.substring(breakPoint)
        );
      }
      return cleanName; // Short single word - no breaking needed
    }

    // TWO WORDS: Standard splitting
    if (words.length === 2) {
      const result = words[0] + "\n" + words[1];
      console.log(`🔍 RESULTS: Two words → "${result}"`);
      return result;
    }

    // THREE WORDS: Smart breaking based on word length
    if (words.length === 3) {
      const [first, second, third] = words;

      // If first word > 8 characters: break after first word
      if (first.length > 8) {
        const result = first + "\n" + second + " " + third;
        console.log(`🔍 RESULTS: Three words (first>8) → "${result}"`);
        return result;
      }

      // If combined first two words > 12 characters: break after first
      if ((first + " " + second).length > 12) {
        const result = first + "\n" + second + " " + third;
        console.log(`🔍 RESULTS: Three words (long combined) → "${result}"`);
        return result;
      }

      // Standard case: first two words on first line, third on second
      const result = first + " " + second + "\n" + third;
      console.log(`🔍 RESULTS: Three words (standard) → "${result}"`);
      return result;
    }

    // FOUR+ WORDS: Very aggressive breaking
    if (words.length >= 4) {
      const [first, second, third, fourth, ...rest] = words;

      // If first word is long (>7 chars), break after it with initials
      if (first.length > 7) {
        const remainingInitials = words
          .slice(1)
          .map((word) => word.charAt(0).toUpperCase())
          .join("");
        const result = first + "\n" + remainingInitials;
        console.log(`🔍 RESULTS: Four+ words (first>7) → "${result}"`);
        return result;
      }

      // If first two words total > 10 chars, break after first
      if ((first + " " + second).length > 10) {
        const remainingInitials = words
          .slice(1)
          .map((word) => word.charAt(0).toUpperCase())
          .join("");
        const result = first + "\n" + remainingInitials;
        console.log(`🔍 RESULTS: Four+ words (long total) → "${result}"`);
        return result;
      }

      // Standard case: first word + initials of remaining
      const remainingInitials = words
        .slice(1)
        .map((word) => word.charAt(0).toUpperCase())
        .join("");
      const result = first + "\n" + remainingInitials;
      console.log(`🔍 RESULTS: Four+ words (standard) → "${result}"`);
      return result;
    }

    return cleanName;
  };

  // ✅ NEW: Render real match card from API data
  const renderMatchCard = (match: Match) => (
    <View
      key={match.id}
      style={[
        styles.resultCard,
        { backgroundColor: theme.colors.backgroundSecondary },
      ]}
    >
      <View style={styles.resultHeader}>
        <View style={styles.competitionInfo}>
          <Text style={[styles.competitionText, { color: theme.colors.text }]}>
            {(() => {
              // ✅ CRITICAL: Apply league normalization like MatchItem
              const teamNames = `${match.home.name} ${match.away.name}`;
              const normalizedLeague =
                leagueNormalizationService.normalizeLeagueName(
                  match.league,
                  teamNames
                );
              console.log(
                `🏆 RESULTS SCREEN: "${match.league}" → "${
                  normalizedLeague || match.league
                }"`
              );
              return normalizedLeague || match.league;
            })()}
          </Text>
          <View style={styles.dateTimeContainer}>
            <Calendar size={12} color={theme.colors.textSecondary} />
            <Text
              style={[
                styles.dateTimeText,
                { color: theme.colors.textSecondary },
              ]}
            >
              {new Date(match.startTime).toLocaleDateString()}
            </Text>
            <Clock size={12} color={theme.colors.textSecondary} />
            <Text
              style={[
                styles.dateTimeText,
                { color: theme.colors.textSecondary },
              ]}
            >
              {new Date(match.startTime).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => handleToggleFavorite(match)}
          style={styles.favoriteButton}
          activeOpacity={0.7}
        >
          <Star
            size={20}
            color={match.isFavorite ? "#FF4444" : theme.colors.textSecondary}
            fill={match.isFavorite ? "#FF4444" : "none"}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.matchResult}>
        <View style={styles.teamContainer}>
          <Image
            source={{
              uri:
                match.home.logo ||
                teamLogoService.getOfficialTeamLogo(
                  match.home.name,
                  match.league
                ),
            }}
            style={styles.teamLogo}
          />
          <Text
            style={[styles.teamName, { color: theme.colors.text }]}
            numberOfLines={2}
          >
            {formatTeamName(match.home.name)}
          </Text>
        </View>

        <View style={styles.scoreContainer}>
          <Text
            style={[
              styles.score,
              {
                color:
                  match.status === "live"
                    ? "#FF4444"
                    : match.status === "upcoming"
                    ? theme.colors.primary
                    : theme.colors.text,
              },
            ]}
          >
            {match.status === "upcoming" ? "vs" : match.score}
          </Text>
          <Text
            style={[
              styles.status,
              {
                color:
                  match.status === "live"
                    ? "#FF4444"
                    : match.status === "upcoming"
                    ? theme.colors.primary
                    : theme.colors.textSecondary,
              },
            ]}
          >
            {(() => {
              // ✅ ENHANCED STATUS: Color-coded and properly formatted
              if (match.status === "live") {
                return match.statusText || "LIVE";
              } else if (match.status === "upcoming") {
                return new Date(match.startTime).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                });
              } else {
                return match.statusText || "FT";
              }
            })()}
          </Text>
          {/* ✅ Show HT and corner stats like Chinese app */}
          <Text
            style={[
              styles.halfTimeScore,
              { color: theme.colors.textSecondary },
            ]}
          >
            HT: {match.halfTimeScore || "--"}
          </Text>
          {(match.home.corners || match.away.corners) && (
            <Text
              style={[
                styles.cornerScore,
                { color: theme.colors.textSecondary },
              ]}
            >
              Corners: {match.home.corners || 0}-{match.away.corners || 0}
            </Text>
          )}
        </View>

        <View style={styles.teamContainer}>
          <Image
            source={{
              uri:
                match.away.logo ||
                teamLogoService.getOfficialTeamLogo(
                  match.away.name,
                  match.league
                ),
            }}
            style={styles.teamLogo}
          />
          <Text
            style={[styles.teamName, { color: theme.colors.text }]}
            numberOfLines={2}
          >
            {formatTeamName(match.away.name)}
          </Text>
        </View>
      </View>

      <View style={styles.resultActions}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            { backgroundColor: theme.colors.background },
          ]}
          onPress={() => toggleResultExpansion(match.id)}
          activeOpacity={0.7}
        >
          <Target size={16} color={theme.colors.text} />
          <Text style={[styles.actionButtonText, { color: theme.colors.text }]}>
            Details
          </Text>
          {expandedResult === match.id ? (
            <ChevronDown size={16} color={theme.colors.text} />
          ) : (
            <ChevronRight size={16} color={theme.colors.text} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionButton,
            { backgroundColor: theme.colors.background },
          ]}
          onPress={() => viewStats(match.id)}
          activeOpacity={0.7}
        >
          <Trophy size={16} color={theme.colors.text} />
          <Text style={[styles.actionButtonText, { color: theme.colors.text }]}>
            Stats
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderResultCard = (result: MatchResult) => (
    <View
      key={result.id}
      style={[
        styles.resultCard,
        { backgroundColor: theme.colors.backgroundSecondary },
      ]}
    >
      <View style={styles.resultHeader}>
        <View style={styles.competitionInfo}>
          <Text style={[styles.competitionText, { color: theme.colors.text }]}>
            {result.competition}
          </Text>
          <View style={styles.dateTimeContainer}>
            <Calendar size={12} color={theme.colors.textSecondary} />
            <Text
              style={[
                styles.dateTimeText,
                { color: theme.colors.textSecondary },
              ]}
            >
              {result.date}
            </Text>
            <Clock size={12} color={theme.colors.textSecondary} />
            <Text
              style={[
                styles.dateTimeText,
                { color: theme.colors.textSecondary },
              ]}
            >
              {result.time}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => {
            // Convert MatchResult to Match format for legacy compatibility
            const matchData: Match = {
              id: result.id,
              sport: "football",
              league: result.competition,
              status: "finished",
              statusText: result.status,
              startTime: result.date,
              home: {
                name: result.homeTeam.name,
                logo: result.homeTeam.logo,
              },
              away: {
                name: result.awayTeam.name,
                logo: result.awayTeam.logo,
              },
              score: `${result.homeTeam.score}-${result.awayTeam.score}`,
              halfTimeScore: "0-0",
              viewers: "1", // Show 1 viewer (current user) for all matches
              hasVideo: false,
              isFavorite: result.isFavorite,
            };
            handleToggleFavorite(matchData);
          }}
          style={styles.favoriteButton}
          activeOpacity={0.7}
        >
          <Star
            size={20}
            color={result.isFavorite ? "#FF4444" : theme.colors.textSecondary}
            fill={result.isFavorite ? "#FF4444" : "none"}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.matchResult}>
        <View style={styles.teamContainer}>
          <Image
            source={{ uri: result.homeTeam.logo }}
            style={styles.teamLogo}
          />
          <Text
            style={[styles.teamName, { color: theme.colors.text }]}
            numberOfLines={2}
          >
            {formatTeamName(result.homeTeam.name)}
          </Text>
        </View>

        <View style={styles.scoreContainer}>
          <Text style={[styles.score, { color: theme.colors.text }]}>
            {result.homeTeam.score} - {result.awayTeam.score}
          </Text>
          <Text style={[styles.status, { color: theme.colors.primary }]}>
            {result.status}
          </Text>
        </View>

        <View style={styles.teamContainer}>
          <Image
            source={{ uri: result.awayTeam.logo }}
            style={styles.teamLogo}
          />
          <Text
            style={[styles.teamName, { color: theme.colors.text }]}
            numberOfLines={2}
          >
            {formatTeamName(result.awayTeam.name)}
          </Text>
        </View>
      </View>

      <View style={styles.resultActions}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            { backgroundColor: theme.colors.background },
          ]}
          onPress={() => toggleResultExpansion(result.id)}
          activeOpacity={0.7}
        >
          <Target size={16} color={theme.colors.text} />
          <Text style={[styles.actionButtonText, { color: theme.colors.text }]}>
            Details
          </Text>
          {expandedResult === result.id ? (
            <ChevronDown size={16} color={theme.colors.text} />
          ) : (
            <ChevronRight size={16} color={theme.colors.text} />
          )}
        </TouchableOpacity>

        {result.hasHighlights && (
          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: theme.colors.background },
            ]}
            onPress={() => viewHighlights(result.id)}
            activeOpacity={0.7}
          >
            <Play
              size={16}
              color={theme.colors.text}
              fill={theme.colors.text}
            />
            <Text
              style={[styles.actionButtonText, { color: theme.colors.text }]}
            >
              Highlights
            </Text>
          </TouchableOpacity>
        )}

        {result.hasStats && (
          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: theme.colors.background },
            ]}
            onPress={() => viewStats(result.id)}
            activeOpacity={0.7}
          >
            <Trophy size={16} color={theme.colors.text} />
            <Text
              style={[styles.actionButtonText, { color: theme.colors.text }]}
            >
              Stats
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {expandedResult === result.id && (
        <View style={styles.expandedContent}>
          <View style={styles.scorersContainer}>
            <View style={styles.teamScorers}>
              <Text style={[styles.scorersTitle, { color: theme.colors.text }]}>
                {result.homeTeam.name} Scorers:
              </Text>
              {result.homeTeam.scorers?.map((scorer, index) => (
                <Text
                  key={index}
                  style={[
                    styles.scorerText,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  • {scorer}
                </Text>
              ))}
            </View>

            <View style={styles.teamScorers}>
              <Text style={[styles.scorersTitle, { color: theme.colors.text }]}>
                {result.awayTeam.name} Scorers:
              </Text>
              {result.awayTeam.scorers?.map((scorer, index) => (
                <Text
                  key={index}
                  style={[
                    styles.scorerText,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  • {scorer}
                </Text>
              ))}
            </View>
          </View>

          <View style={styles.matchStats}>
            <Text
              style={[styles.matchStatsTitle, { color: theme.colors.text }]}
            >
              Match Stats
            </Text>

            <View style={styles.statRow}>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>
                58%
              </Text>
              <View style={styles.statBarContainer}>
                <Text
                  style={[
                    styles.statLabel,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Possession
                </Text>
                <View style={styles.statBar}>
                  <View
                    style={[
                      styles.statBarFill,
                      {
                        width: "58%",
                        backgroundColor: theme.colors.primary,
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.statBarFill,
                      {
                        width: "42%",
                        backgroundColor: "#42A5F5",
                      },
                    ]}
                  />
                </View>
              </View>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>
                42%
              </Text>
            </View>

            <View style={styles.statRow}>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>
                12
              </Text>
              <View style={styles.statBarContainer}>
                <Text
                  style={[
                    styles.statLabel,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Shots
                </Text>
                <View style={styles.statBar}>
                  <View
                    style={[
                      styles.statBarFill,
                      {
                        width: "60%",
                        backgroundColor: theme.colors.primary,
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.statBarFill,
                      {
                        width: "40%",
                        backgroundColor: "#42A5F5",
                      },
                    ]}
                  />
                </View>
              </View>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>
                8
              </Text>
            </View>

            <View style={styles.statRow}>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>
                6
              </Text>
              <View style={styles.statBarContainer}>
                <Text
                  style={[
                    styles.statLabel,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Shots on Target
                </Text>
                <View style={styles.statBar}>
                  <View
                    style={[
                      styles.statBarFill,
                      {
                        width: "67%",
                        backgroundColor: theme.colors.primary,
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.statBarFill,
                      {
                        width: "33%",
                        backgroundColor: "#42A5F5",
                      },
                    ]}
                  />
                </View>
              </View>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>
                3
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {renderHeader()}
      {renderTabs()}

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        {renderSearchAndFilter()}
        {renderDateSelector()}

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text
              style={[
                styles.loadingText,
                { color: theme.colors.textSecondary },
              ]}
            >
              Loading all matches...
            </Text>
          </View>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: theme.colors.error }]}>
              {error}
            </Text>
            <TouchableOpacity
              style={[
                styles.retryButton,
                { backgroundColor: theme.colors.primary },
              ]}
              onPress={() => loadAllMatches()}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loading && !error && matches.length === 0 && (
          <View style={styles.emptyContainer}>
            <Calendar size={48} color={theme.colors.textSecondary} />
            <Text
              style={[styles.emptyText, { color: theme.colors.textSecondary }]}
            >
              No matches found for this date
            </Text>
          </View>
        )}

        {!loading && !error && matches.length > 0 && (
          <View style={styles.resultsContainer}>
            {/* ✅ ENHANCED: Group matches by type with headers for better UX */}
            {(() => {
              const liveMatches = matches.filter((m) => m.status === "live");
              const upcomingMatches = matches.filter(
                (m) => m.status === "upcoming"
              );
              const finishedMatches = matches.filter(
                (m) => m.status === "finished"
              );

              return (
                <>
                  {/* Live Matches Section */}
                  {liveMatches.length > 0 && (
                    <>
                      <View style={styles.sectionHeader}>
                        <Text
                          style={[styles.sectionTitle, { color: "#FF4444" }]}
                        >
                          🔴 Live Matches ({liveMatches.length})
                        </Text>
                      </View>
                      {liveMatches.map((match) => renderMatchCard(match))}
                    </>
                  )}

                  {/* Upcoming Matches Section */}
                  {upcomingMatches.length > 0 && (
                    <>
                      <View style={styles.sectionHeader}>
                        <Text
                          style={[
                            styles.sectionTitle,
                            { color: theme.colors.primary },
                          ]}
                        >
                          📅 Upcoming Matches ({upcomingMatches.length})
                        </Text>
                      </View>
                      {upcomingMatches.map((match) => renderMatchCard(match))}
                    </>
                  )}

                  {/* Finished Matches Section */}
                  {finishedMatches.length > 0 && (
                    <>
                      <View style={styles.sectionHeader}>
                        <Text
                          style={[
                            styles.sectionTitle,
                            { color: theme.colors.textSecondary },
                          ]}
                        >
                          🏁 Finished Matches ({finishedMatches.length})
                        </Text>
                      </View>
                      {finishedMatches.map((match) => renderMatchCard(match))}
                    </>
                  )}
                </>
              );
            })()}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#2A2A2A",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Inter-SemiBold",
    flex: 1,
    textAlign: "center",
  },
  settingsButton: {
    padding: 4,
  },
  tabContainer: {
    borderBottomWidth: 1,
    borderBottomColor: "#2A2A2A",
  },
  tabScrollContent: {
    paddingHorizontal: 16,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 8,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabText: {
    fontSize: 14,
    fontFamily: "Inter-Medium",
  },
  content: {
    flex: 1,
  },
  searchFilterContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Inter-Regular",
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  dateSelectorContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  dateOptions: {
    gap: 8,
  },
  dateOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  dateOptionText: {
    fontSize: 14,
    fontFamily: "Inter-Medium",
  },
  resultsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 16,
  },
  resultCard: {
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  resultHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#2A2A2A",
  },
  competitionInfo: {
    flex: 1,
  },
  competitionText: {
    fontSize: 14,
    fontFamily: "Inter-SemiBold",
    marginBottom: 4,
  },
  dateTimeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dateTimeText: {
    fontSize: 12,
    fontFamily: "Inter-Regular",
  },
  favoriteButton: {
    padding: 4,
  },
  matchResult: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  teamContainer: {
    alignItems: "center",
    width: "35%",
  },
  teamLogo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginBottom: 8,
  },
  teamName: {
    fontSize: 14,
    fontFamily: "Inter-Medium",
    textAlign: "center",
    lineHeight: 18,
    maxWidth: 100, // Force text wrapping
    minHeight: 36, // Allow space for two lines
  },
  scoreContainer: {
    alignItems: "center",
    width: "30%",
  },
  score: {
    fontSize: 24,
    fontFamily: "Inter-Bold",
    marginBottom: 4,
  },
  status: {
    fontSize: 12,
    fontFamily: "Inter-SemiBold",
  },
  resultActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "#2A2A2A",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  actionButtonText: {
    fontSize: 12,
    fontFamily: "Inter-Medium",
  },
  expandedContent: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#2A2A2A",
  },
  scorersContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  teamScorers: {
    flex: 1,
  },
  scorersTitle: {
    fontSize: 14,
    fontFamily: "Inter-SemiBold",
    marginBottom: 8,
  },
  scorerText: {
    fontSize: 12,
    fontFamily: "Inter-Regular",
    marginBottom: 4,
  },
  matchStats: {
    marginTop: 8,
  },
  matchStatsTitle: {
    fontSize: 14,
    fontFamily: "Inter-SemiBold",
    marginBottom: 12,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  statValue: {
    fontSize: 14,
    fontFamily: "Inter-SemiBold",
    width: 40,
    textAlign: "center",
  },
  statBarContainer: {
    flex: 1,
    marginHorizontal: 8,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: "Inter-Regular",
    textAlign: "center",
    marginBottom: 4,
  },
  statBar: {
    height: 6,
    flexDirection: "row",
    borderRadius: 3,
    overflow: "hidden",
    backgroundColor: "#2A2A2A",
  },
  statBarFill: {
    height: "100%",
  },
  // ✅ NEW: Loading, error, and empty states
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: "Inter-Regular",
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    fontFamily: "Inter-Regular",
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontFamily: "Inter-SemiBold",
    color: "#FFFFFF",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: "Inter-Regular",
    textAlign: "center",
    marginTop: 16,
  },
  halfTimeScore: {
    fontSize: 10,
    fontFamily: "Inter-Regular",
    marginTop: 2,
  },
  cornerScore: {
    fontSize: 10,
    fontFamily: "Inter-Regular",
    marginTop: 1,
  },
  // ✅ NEW: Section header styles for grouped matches
  sectionHeader: {
    paddingVertical: 12,
    paddingHorizontal: 4,
    marginTop: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Inter-SemiBold",
    fontWeight: "600",
  },
});
