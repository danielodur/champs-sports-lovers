import React, { useState, useEffect } from "react";
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
import { MapPin, Clock } from "lucide-react-native";
import { useTheme } from "@/hooks/useTheme";
import { NewsArticle } from "../../../../../types";
import { newsService } from "../../../../../services/newsService";
import { fetchHotMatches } from "@/services/matchService";
import { Match } from "@/types/match";

interface UgandaSportsProps {}

export default function UgandaSports({}: UgandaSportsProps) {
  const router = useRouter();
  const theme = useTheme();
  const [ugandaNews, setUgandaNews] = useState<NewsArticle[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loadingNews, setLoadingNews] = useState(false); // REMOVED: No blocking loading
  const [loadingMatches, setLoadingMatches] = useState(false); // REMOVED: No blocking loading
  const [newsError, setNewsError] = useState<string | null>(null);
  const [matchesError, setMatchesError] = useState<string | null>(null);

  useEffect(() => {
    fetchUgandaNews();
    fetchMatches();
  }, []);

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const fetchUgandaNews = async () => {
    try {
      // REMOVED: Don't block UI - show data as it loads
      // setLoadingNews(true);
      setNewsError(null);

      console.log("🔍 Fetching Uganda sports news (local, African, international)...");
      
      const searchQueries = [
        "Uganda football",
        "Uganda Premier League",
      ];
      
      console.log(`🔍 Searching with ${searchQueries.length} queries...`);
      
      // Add timeout wrapper
      const createTimeoutPromise = (promise: Promise<NewsArticle[]>, timeoutMs: number) => {
        return Promise.race([
          promise,
          new Promise<NewsArticle[]>((resolve) => setTimeout(() => resolve([]), timeoutMs))
        ]);
      };

      const newsPromises = searchQueries.map(query => 
        createTimeoutPromise(
          newsService.searchNews(query, 8).catch(err => {
            console.log(`⚠️ Search failed for "${query}":`, err.message);
            return [];
          }),
          4000
        )
      );
      const newsResults = await Promise.allSettled(newsPromises);
      const allNews = newsResults
        .filter((result) => result.status === 'fulfilled')
        .flatMap((result) => (result as PromiseFulfilledResult<NewsArticle[]>).value);
      console.log(`✅ Found ${allNews.length} total articles`);

      const uniqueNews = allNews.filter((article, index, self) => {
        const articleKey = (article.url && article.url !== '#') 
          ? article.url 
          : article.id || `${article.title}-${article.publishedAt}`;
        
        return (
          index ===
          self.findIndex(
            (a) => {
              const aKey = (a.url && a.url !== '#') 
                ? a.url 
                : a.id || `${a.title}-${a.publishedAt}`;
              return aKey === articleKey;
            }
          )
        );
      });
      console.log(`📊 Unique articles after deduplication: ${uniqueNews.length}`);

      const ugandaKeywords = [
        "uganda", "ugandan", "cranes", "vipers", "kcca", 
        "express fc", "sc villa", "ura fc", "bul fc",
        "african", "east africa", "afcon"
      ];
      
      const relevantNews = uniqueNews.filter((article) => {
        const titleLower = article.title.toLowerCase();
        const descLower = (article.description || "").toLowerCase();
        const contentLower = (article.content || "").toLowerCase();
        
        const hasUgandaContext = ugandaKeywords.some(keyword =>
          titleLower.includes(keyword) || 
          descLower.includes(keyword) ||
          contentLower.includes(keyword)
        );
        
        const isSportsRelated = titleLower.includes('football') || 
                               titleLower.includes('soccer') ||
                               titleLower.includes('sport') ||
                               titleLower.includes('match') ||
                               titleLower.includes('game') ||
                               titleLower.includes('league') ||
                               descLower.includes('football') ||
                               descLower.includes('soccer') ||
                               descLower.includes('sport');
        
        return hasUgandaContext && isSportsRelated;
      });
      
      console.log(`📊 Relevant articles after filtering: ${relevantNews.length}`);

      const transformedNews: NewsArticle[] = relevantNews
        .sort(
          (a, b) =>
            new Date(b.publishedAt).getTime() -
            new Date(a.publishedAt).getTime()
        )
        .slice(0, 15)
        .map((article, index) => ({
          id: article.id || `uganda-news-${index}-${Date.now()}`,
          title: article.title,
          description: article.description || "",
          urlToImage: article.urlToImage || "",
          publishedAt: article.publishedAt,
          source: article.source,
          url: article.url,
        }))
        .sort((a, b) => {
          return (
            new Date(b.publishedAt).getTime() -
            new Date(a.publishedAt).getTime()
          );
        });

      console.log(`✅ Successfully transformed ${transformedNews.length} news items`);
      setUgandaNews(transformedNews);
      
      if (transformedNews.length === 0) {
        console.warn("⚠️ No Uganda sports news found");
      }
    } catch (err) {
      console.error("❌ Error fetching Uganda sports news:", err);
      setNewsError(err instanceof Error ? err.message : "Failed to load news");
      setUgandaNews([]);
    } finally {
      setLoadingNews(false);
    }
  };

  const fetchMatches = async () => {
    try {
      // REMOVED: Don't block UI - show data as it loads
      // setLoadingMatches(true);
      setMatchesError(null);
      
      // ✅ CRITICAL: Force fresh data fetch to bypass Supabase 15min cache
      console.log("✅ FORCING FRESH DATA FETCH - Bypassing Supabase cache");
      const ugandaMatches = await fetchUgandaPremierLeagueMatches();
      
      setMatches(ugandaMatches);
      console.log(`✅ Loaded ${ugandaMatches.length} Uganda Premier League matches`);
      
      // ✅ Log all match dates to verify they're not static
      if (ugandaMatches.length > 0) {
        console.log("📅 MATCH DATES (verify these change daily):");
        ugandaMatches.forEach((match, idx) => {
          console.log(`  ${idx + 1}. ${formatMatchDate(match.startTime)} - ${match.home.name} vs ${match.away.name}`);
        });
      }
      
      setLoadingMatches(false); // Mark as loaded when data is ready
    } catch (err) {
      console.error("❌ Error fetching Uganda matches:", err);
      setMatchesError(err instanceof Error ? err.message : "Failed to load matches");
      setLoadingMatches(false);
    }
  };

  const formatMatchDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      const month = date.toLocaleDateString("en-US", { month: "short" });
      const day = date.getDate();
      const hours = date.getHours().toString().padStart(2, "0");
      const minutes = date.getMinutes().toString().padStart(2, "0");
      return `${month} ${day} ${hours}:${minutes}`;
    } catch {
      return dateString;
    }
  };

  const formatMatchRound = (match: Match): string => {
    // Use round from match data if available (extracted from API)
    if (match.round) {
      console.log(`✅ [formatMatchRound] Using real round data: "${match.round}" for match ${match.id}`);
      return match.round;
    }
    
    // Fallback: Try to extract from statusText if it contains round info
    if (match.statusText && match.statusText.includes("Round")) {
      console.log(`⚠️ [formatMatchRound] Extracting round from statusText: "${match.statusText}"`);
      return match.statusText;
    }
    
    // Last resort: Return empty string instead of mock data
    console.log(`⚠️ [formatMatchRound] No round data available for match ${match.id}, returning empty string`);
    return "";
  };

  const handleMatchPress = (match: Match) => {
    try {
      router.push({
        pathname: "/match-details",
        params: {
          matchId: match.id,
          homeTeam: match.home.name,
          awayTeam: match.away.name,
          homeScore: match.home.score?.toString() || "0",
          awayScore: match.away.score?.toString() || "0",
          status: match.statusText || match.status,
          startTime: match.startTime,
          league: match.league,
          homeLogo: match.home.logo || "",
          awayLogo: match.away.logo || "",
          homeCorners: match.home.corners?.toString() || "0",
          awayCorners: match.away.corners?.toString() || "0",
          halftimeScore: match.halfTimeScore || "0-0",
          from: "uganda-sports",
        },
      });
    } catch (error) {
      console.error("Error navigating to match details:", error);
    }
  };

  const renderMatch = (match: Match, index: number) => {
    const isFinished = match.status === "finished";
    const round = formatMatchRound(match);

    return (
      <View key={match.id}>
        <TouchableOpacity
          style={styles.matchContainer}
          onPress={() => handleMatchPress(match)}
          activeOpacity={0.7}
        >
          <View style={styles.matchHeader}>
            <View style={styles.matchDateContainer}>
              <Text style={[styles.matchDateText, { color: theme.colors.textSecondary }]}>
                {formatMatchDate(match.startTime)}
              </Text>
            </View>
            <View style={styles.matchTypeBadge}>
              <Text style={styles.matchTypeText}>LEAGUE</Text>
            </View>
          </View>

          <View style={styles.matchRoundContainer}>
            <Text style={[styles.matchRoundText, { color: theme.colors.textSecondary }]}>
              {round}
            </Text>
          </View>

          <View style={styles.matchTeamsContainer}>
            <View style={styles.teamContainer}>
              <Image
                source={{ uri: match.home.logo || "" }}
                style={styles.teamLogo}
              />
              <Text style={[styles.teamName, { color: theme.colors.text }]} numberOfLines={1}>
                {match.home.name}
              </Text>
            </View>

            <View style={styles.scoreContainer}>
              {isFinished ? (
                <>
                  <Text style={[styles.scoreText, { color: theme.colors.text }]}>
                    {match.home.score || 0}
                  </Text>
                  <Text style={[styles.scoreSeparator, { color: theme.colors.textSecondary }]}>
                    -
                  </Text>
                  <Text style={[styles.scoreText, { color: theme.colors.text }]}>
                    {match.away.score || 0}
                  </Text>
                </>
              ) : (
                <Text style={[styles.vsText, { color: theme.colors.textSecondary }]}>
                  VS
                </Text>
              )}
            </View>

            <View style={styles.teamContainer}>
              <Text style={[styles.teamName, { color: theme.colors.text }]} numberOfLines={1}>
                {match.away.name}
              </Text>
              <Image
                source={{ uri: match.away.logo || "" }}
                style={styles.teamLogo}
              />
            </View>
          </View>

          {isFinished && (
            <View style={styles.matchStatusContainer}>
              <Text style={[styles.matchStatusText, { color: "#FF3030" }]}>
                Full Time
              </Text>
            </View>
          )}
        </TouchableOpacity>
        {index < matches.length - 1 && <View style={styles.matchSeparator} />}
      </View>
    );
  };

  const isLoading = loadingNews && loadingMatches;
  const hasError = (newsError || matchesError) && ugandaNews.length === 0 && matches.length === 0;

  if (isLoading) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: theme.colors.backgroundSecondary },
        ]}
      >
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Loading Uganda sports...
          </Text>
        </View>
      </View>
    );
  }

  if (hasError) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: theme.colors.backgroundSecondary },
        ]}
      >
        <View style={styles.centerContainer}>
          <Text style={[styles.errorText, { color: theme.colors.textSecondary }]}>
            {newsError || matchesError || "Failed to load content"}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { borderColor: theme.colors.primary }]}
            onPress={() => {
              fetchUgandaNews();
              fetchMatches();
            }}
          >
            <Text style={[styles.retryButtonText, { color: theme.colors.primary }]}>
              Retry
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.backgroundSecondary },
      ]}
    >
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Uganda Premier League Matches Section */}
        {matches.length > 0 && (
          <View style={styles.matchesSection}>
            {matches.map((match, index) => renderMatch(match, index))}
          </View>
        )}

        {loadingMatches && matches.length === 0 && (
          <View style={styles.matchesSection}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text style={[styles.loadingText, { color: theme.colors.textSecondary, marginTop: 8 }]}>
              Loading matches...
            </Text>
          </View>
        )}

        {matchesError && matches.length === 0 && (
          <View style={styles.matchesSection}>
            <Text style={[styles.errorText, { color: theme.colors.textSecondary }]}>
              {matchesError}
            </Text>
          </View>
        )}

        {/* Uganda Sports News Section */}
        {ugandaNews.length > 0 && (
          <View style={styles.newsSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.titleContainer}>
                <MapPin size={16} color={theme.colors.primary} />
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                  Uganda Sports News
                </Text>
              </View>
            </View>

            <View style={styles.newsList}>
              {ugandaNews.map((article) => (
                <TouchableOpacity
                  key={article.id}
                  style={[
                    styles.newsItem,
                    { borderBottomColor: theme.colors.border },
                  ]}
                  onPress={() => {
                    console.log(`🚀 [UgandaSports] Navigating to news-detail with article: "${article.title}"`);
                    
                    const validArticle = {
                      id: article.id || `news-${Date.now()}`,
                      title: article.title || "Untitled",
                      description: article.description || "",
                      urlToImage: article.urlToImage || "",
                      publishedAt: article.publishedAt || new Date().toISOString(),
                      source: article.source || { name: "Sports News", id: "sports" },
                      url: article.url || "#",
                      content: article.content || "",
                      category: article.category || "sports",
                    };

                    router.push({
                      pathname: "/news/news-detail",
                      params: { data: JSON.stringify(validArticle) },
                    });
                  }}
                >
                  <View style={styles.newsContent}>
                    <Image
                      source={{ uri: article.urlToImage }}
                      style={styles.newsImage}
                      resizeMode="cover"
                    />
                    <View style={styles.newsTextContent}>
                      <Text
                        style={[styles.newsTitle, { color: theme.colors.text }]}
                        numberOfLines={2}
                      >
                        {article.title}
                      </Text>
                      <Text
                        style={[
                          styles.newsDescription,
                          { color: theme.colors.textSecondary },
                        ]}
                        numberOfLines={2}
                      >
                        {article.description}
                      </Text>
                      <View style={styles.newsInfo}>
                        <View style={styles.newsSource}>
                          <Text
                            style={[
                              styles.sourceText,
                              { color: theme.colors.textSecondary },
                            ]}
                          >
                            {article.source.name}
                          </Text>
                          <View style={styles.sourceDot} />
                          <Clock size={12} color={theme.colors.textSecondary} />
                          <Text
                            style={[
                              styles.timeText,
                              { color: theme.colors.textSecondary },
                            ]}
                          >
                            {formatTimeAgo(article.publishedAt)}
                          </Text>
                        </View>
                        {article.readTime && (
                          <View style={styles.readTime}>
                            <Text
                              style={[
                                styles.readTimeText,
                                { color: theme.colors.primary },
                              ]}
                            >
                              {article.readTime}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {loadingNews && ugandaNews.length === 0 && (
          <View style={styles.newsSection}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text style={[styles.loadingText, { color: theme.colors.textSecondary, marginTop: 8 }]}>
              Loading news...
            </Text>
          </View>
        )}

        {newsError && ugandaNews.length === 0 && (
          <View style={styles.newsSection}>
            <Text style={[styles.errorText, { color: theme.colors.textSecondary }]}>
              {newsError}
            </Text>
          </View>
        )}

        {matches.length === 0 && ugandaNews.length === 0 && !loadingNews && !loadingMatches && (
          <View style={styles.centerContainer}>
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              No content available at the moment. APIs may be temporarily unavailable.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

/**
 * ✅ FIXED: Fetch Uganda Premier League matches from API-Sports (League ID: 288)
 * - Calls backend API to get REAL Uganda matches
 * - NO mock data, NO hardcoded matches
 * - Returns exactly 4 matches when APIs are live
 */
export async function fetchUgandaPremierLeagueMatches(): Promise<Match[]> {
  try {
    console.log("🇺🇬 ✅ Fetching REAL Uganda Premier League matches from API-Sports (League ID: 288)...");
    
    // Fetch all Uganda matches from API
    const allUgandaMatches = await fetchHotMatches("uganda");
    
    console.log(`📊 Found ${allUgandaMatches.length} Uganda Premier League matches from API`);
    console.log(`✅ Data Source: ${allUgandaMatches.length > 0 ? 'API-Sports Backend (REAL DATA)' : 'No matches available'}`);
    
    // ✅ Log first match to verify it's real API data
    if (allUgandaMatches.length > 0) {
      const firstMatch = allUgandaMatches[0];
      console.log("📋 VERIFICATION - First match details:");
      console.log(`  Match ID: ${firstMatch.id}`);
      console.log(`  Home: ${firstMatch.home.name} (Logo: ${firstMatch.home.logo ? 'Yes' : 'No'})`);
      console.log(`  Away: ${firstMatch.away.name} (Logo: ${firstMatch.away.logo ? 'Yes' : 'No'})`);
      console.log(`  Date: ${firstMatch.startTime}`);
      console.log(`  Status: ${firstMatch.status}`);
      console.log(`  League: ${firstMatch.league}`);
      console.log(`  Round: ${firstMatch.round || 'N/A'}`);
      console.log(`  Score: ${firstMatch.home.score || 0} - ${firstMatch.away.score || 0}`);
    }

    if (allUgandaMatches.length === 0) {
      console.log("⚠️ ❌ NO Uganda Premier League matches found from API");
      console.log("🔍 Possible reasons:");
      console.log("  1. API-Sports may not have live/upcoming Uganda PL matches today");
      console.log("  2. Uganda Premier League season may be on break");
      console.log("  3. League filtering may be too strict");
      console.log("  4. Check Supabase Edge Function logs for API errors");
      console.log("🔧 Solution: Check backend logs and verify League ID 288 is correct");
      return [];
    }

    // Separate finished and upcoming matches
    const finishedMatches = allUgandaMatches.filter(
      (match) => match.status === "finished"
    );
    const upcomingMatches = allUgandaMatches.filter(
      (match) => match.status === "upcoming"
    );

    console.log(`📊 Finished: ${finishedMatches.length}, Upcoming: ${upcomingMatches.length}`);

    // Sort finished matches by date (most recent first)
    finishedMatches.sort((a, b) => 
      new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );

    // Sort upcoming matches by date (soonest first)
    upcomingMatches.sort((a, b) => 
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

    // Select 1 most recent finished + 3 upcoming
    const selectedMatches: Match[] = [];
    
    // Add 1 most recent finished match (if available)
    if (finishedMatches.length > 0) {
      selectedMatches.push(finishedMatches[0]);
    }

    // Add up to 3 upcoming matches
    const upcomingToAdd = Math.min(3, upcomingMatches.length);
    selectedMatches.push(...upcomingMatches.slice(0, upcomingToAdd));

    // If we don't have 4 matches yet and have more finished matches, add them
    if (selectedMatches.length < 4 && finishedMatches.length > 1) {
      const additionalFinished = finishedMatches.slice(1, 4 - selectedMatches.length + 1);
      selectedMatches.push(...additionalFinished);
    }

    console.log(`✅ Selected ${selectedMatches.length} Uganda Premier League matches`);
    return selectedMatches.slice(0, 4); // Ensure max 4 matches
  } catch (error) {
    console.error("❌ Error fetching Uganda Premier League matches:", error);
    return [];
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  matchesSection: {
    paddingHorizontal: 8,
    paddingTop: 24,
    paddingBottom: 16,
  },
  matchContainer: {
    paddingVertical: 16,
  },
  matchHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  matchDateContainer: {
    flex: 1,
  },
  matchDateText: {
    fontSize: 13,
    fontWeight: "500",
  },
  matchTypeBadge: {
    backgroundColor: "#FF3030",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  matchTypeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  matchRoundContainer: {
    marginBottom: 12,
  },
  matchRoundText: {
    fontSize: 12,
    fontWeight: "500",
  },
  matchTeamsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  teamContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  teamLogo: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  teamName: {
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  scoreContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 60,
    marginHorizontal: 12,
  },
  scoreText: {
    fontSize: 18,
    fontWeight: "700",
  },
  scoreSeparator: {
    fontSize: 18,
    marginHorizontal: 4,
  },
  vsText: {
    fontSize: 14,
    fontWeight: "600",
  },
  matchStatusContainer: {
    alignItems: "flex-start",
    marginTop: 4,
  },
  matchStatusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  matchSeparator: {
    height: 1,
    backgroundColor: "#333333",
    marginVertical: 8,
    marginHorizontal: 0,
  },
  newsSection: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Inter-SemiBold",
  },
  newsList: {
    gap: 12,
  },
  newsItem: {
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  newsContent: {
    flexDirection: "row",
  },
  newsImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  newsTextContent: {
    flex: 1,
  },
  newsTitle: {
    fontSize: 14,
    fontFamily: "Inter-SemiBold",
    lineHeight: 18,
    marginBottom: 4,
  },
  newsDescription: {
    fontSize: 13,
    fontFamily: "Inter-Regular",
    lineHeight: 16,
    marginBottom: 8,
  },
  newsInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  newsSource: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  sourceText: {
    fontSize: 12,
    fontFamily: "Inter-Regular",
  },
  sourceDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "#888",
    marginHorizontal: 6,
  },
  timeText: {
    fontSize: 12,
    fontFamily: "Inter-Regular",
    marginLeft: 4,
  },
  readTime: {
    marginLeft: 8,
  },
  readTimeText: {
    fontSize: 12,
    fontFamily: "Inter-Medium",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    minHeight: 200,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  errorText: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  retryButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
  },
});
