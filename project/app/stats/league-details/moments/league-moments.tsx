/**
 * League Moments Tab
 * Displays league-related news and moments from all 6 news APIs
 * Includes Match Day section with upcoming/live matches
 * Similar to team-details/moments screen
 */

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
import { useRouter } from "expo-router";
import { newsService } from "@/modules/news/services/newsService";
import { createApiSportsService } from "@/services/api-sports-service";
import { getLeagueApiId } from "../[leagueId]";
import teamLogoService from "@/services/teamLogoService";

interface LeagueMomentsProps {
  leagueId: string;
  season: string;
  theme: any;
  primaryColor?: string;
  sport?: string; // Optional sport parameter for basketball/football differentiation
}

interface LeagueMoment {
  id: string;
  title: string;
  summary: string;
  time: string;
  image: string;
  publishedAt: string;
  url: string;
  source: string;
}

interface LeagueMatch {
  id: number;
  homeTeam: {
    name: string;
    logo: string;
  };
  awayTeam: {
    name: string;
    logo: string;
  };
  date: string;
  time: string;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  fixtureId: number;
}

// Map league IDs to search-friendly names
const getLeagueSearchName = (leagueId: string): string => {
  const leagueNameMap: { [key: string]: string } = {
    "premier-league": "Premier League",
    "la-liga": "La Liga",
    "bundesliga": "Bundesliga",
    "serie-a": "Serie A",
    "ligue-1": "Ligue 1",
    "champions-league": "Champions League",
    "europa-league": "Europa League",
    "uganda-premier-league": "Uganda Premier League",
    "eredivisie": "Eredivisie",
    "primeira-liga": "Primeira Liga",
  };
  return leagueNameMap[leagueId] || leagueId.replace(/-/g, " ");
};

// Check if match is live
const isMatchLive = (status: string): boolean => {
  const liveStatuses = ["1H", "2H", "HT", "ET", "BT", "P", "LIVE"];
  return liveStatuses.includes(status);
};

// Get countdown data for upcoming match
const getCountdownData = (matchDate: string, matchTime: string) => {
  try {
    const [dateStr, timeStr] = matchDate.split(" ");
    const [month, day] = dateStr.split("/");
    const [matchHours, matchMinutes] = timeStr?.split(":") || ["00", "00"];
    
    const matchDateTime = new Date();
    matchDateTime.setMonth(parseInt(month) - 1);
    matchDateTime.setDate(parseInt(day));
    matchDateTime.setHours(parseInt(matchHours));
    matchDateTime.setMinutes(parseInt(matchMinutes));
    matchDateTime.setSeconds(0);
    
    const now = new Date();
    const diffMs = matchDateTime.getTime() - now.getTime();
    
    if (diffMs <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, showSeconds: false };
    }
    
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
    
    return {
      days,
      hours,
      minutes,
      seconds,
      showSeconds: days === 0 && hours === 0 && minutes < 60,
    };
  } catch {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, showSeconds: false };
  }
};

export default function LeagueMoments({ leagueId, season, theme, primaryColor, sport = "football" }: LeagueMomentsProps) {
  const router = useRouter();
  // Initialize with empty arrays for instant display
  const [moments, setMoments] = useState<LeagueMoment[]>([]);
  const [matches, setMatches] = useState<LeagueMatch[]>([]);
  const [isLoadingApi, setIsLoadingApi] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const leagueSearchName = getLeagueSearchName(leagueId);
  const apiSportsService = createApiSportsService();
  const apiLeagueId = getLeagueApiId(leagueId);
  
  // Use league's primary color for match cards, fallback to theme primary
  const leaguePrimaryColor = primaryColor || theme.colors.primary || "#38003C";

  // Format timestamp to relative time
  const formatTimeAgo = useCallback((dateString: string): string => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);

      if (diffDays > 1) {
        return `${diffDays} days ago`;
      } else if (diffDays === 1) {
        return "Yesterday";
      } else if (diffHours > 0) {
        return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
      } else if (diffMinutes > 0) {
        return `${diffMinutes} minute${diffMinutes > 1 ? "s" : ""} ago`;
      } else {
        return "Just now";
      }
    } catch {
      return "Recently";
    }
  }, []);

  // Fetch upcoming/live matches for the league
  const fetchLeagueMatches = useCallback(async () => {
    // Special handling for Uganda Premier League (no API ID available)
    if (leagueId === "uganda-premier-league" && !apiLeagueId) {
      console.log("🇺🇬 [LeagueMoments] Uganda Premier League matches not available via API-Football");
      // Set empty matches - will show empty state
      setMatches([]);
      return;
    }

    if (!apiLeagueId) return;

    try {
      const seasonYear = parseInt(season.split("-")[0]);
      
      // Fetch upcoming and live fixtures with sport parameter
      const fixturesResponse = await apiSportsService.getFixtures(
        undefined,
        apiLeagueId,
        seasonYear,
        undefined,
        undefined,
        undefined,
        sport // ✅ Pass sport parameter to get correct data
      );

      const fixtures = fixturesResponse?.response || [];
      
      // Filter for upcoming and live matches, limit to 10
      const upcomingAndLive = fixtures
        .filter((f: any) => {
          const status = f.fixture?.status?.short || "";
          return status === "NS" || status === "TBD" || isMatchLive(status);
        })
        .slice(0, 10)
        .map((fixture: any) => {
          const fixtureDate = new Date(fixture.fixture.date);
          const dateStr = `${fixtureDate.getMonth() + 1}/${fixtureDate.getDate()}`;
          const timeStr = fixtureDate.toTimeString().split(" ")[0].slice(0, 5);
          
          return {
            id: fixture.fixture.id,
            homeTeam: {
              name: fixture.teams.home.name,
              logo: teamLogoService.getOfficialTeamLogo(
                fixture.teams.home.name,
                leagueSearchName,
                fixture.teams.home.logo || ""
              ),
            },
            awayTeam: {
              name: fixture.teams.away.name,
              logo: teamLogoService.getOfficialTeamLogo(
                fixture.teams.away.name,
                leagueSearchName,
                fixture.teams.away.logo || ""
              ),
            },
            date: `${dateStr} ${timeStr}`,
            time: timeStr,
            status: fixture.fixture.status.short,
            homeScore: fixture.goals?.home ?? null,
            awayScore: fixture.goals?.away ?? null,
            fixtureId: fixture.fixture.id,
          };
        });

      setMatches(upcomingAndLive);
    } catch (err) {
      console.log("Error fetching league matches:", err);
    }
  }, [apiLeagueId, season, leagueSearchName, leagueId]);

  // Fetch league-related news using all 6 APIs - non-blocking
  const fetchLeagueMoments = useCallback(async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setIsLoadingApi(true);
      }
      setError(null);

      console.log(`🔍 Fetching league moments for: ${leagueSearchName}`);
      
      // Create multiple search queries for better API compatibility
      // Special handling for Uganda Premier League - add more specific queries
      let leagueQueries: string[] = [];
      
      if (leagueId === "uganda-premier-league") {
        // Uganda-specific search terms
        leagueQueries = [
          "Uganda Premier League",
          "Uganda Premier League football",
          "UPL Uganda",
          "Uganda football",
          "Uganda soccer",
          "Uganda Premier League news",
          "Uganda Premier League transfer",
          "FUFA Super League",
          "Uganda football league",
          "Uganda soccer league",
          "Vipers SC",
          "KCCA FC",
          "Express FC",
          "SC Villa",
          "Uganda football news",
        ];
      } else {
        // Standard queries for other leagues
        leagueQueries = [
          `${leagueSearchName} football`,
          `${leagueSearchName} soccer`,
          `${leagueSearchName}`,
          `${leagueSearchName} news`,
          `${leagueSearchName} transfer`,
        ];
      }
      
      // Fetch news related to league name with multiple queries
      console.log(`🔍 Searching league news with queries: ${leagueQueries.join(', ')}`);
      const leagueNewsPromises = leagueQueries.map(query => 
        newsService.searchNews(query, 15).catch(err => {
          console.log(`⚠️ League search failed for "${query}":`, err.message);
          return [];
        })
      );
      const leagueNewsResults = await Promise.all(leagueNewsPromises);
      const allNews = leagueNewsResults.flat();
      console.log(`✅ Found ${allNews.length} league news articles`);

      // Remove duplicates based on URL or ID
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

      // Filter to ensure relevance to league
      const leagueNameLower = leagueSearchName.toLowerCase();
      const relevantNews = uniqueNews.filter((article) => {
        const titleLower = article.title.toLowerCase();
        const descLower = (article.description || "").toLowerCase();
        const contentLower = (article.content || "").toLowerCase();
        
        // Special handling for Uganda Premier League - more flexible filtering
        if (leagueId === "uganda-premier-league") {
          // Uganda-specific keywords
          const ugandaKeywords = [
            "uganda",
            "ugandan",
            "upl",
            "fufa",
            "vipers",
            "kcca",
            "express",
            "sc villa",
            "villa",
            "uganda premier",
            "uganda football",
            "uganda soccer",
          ];
          
          const hasUgandaKeyword = ugandaKeywords.some(keyword =>
            titleLower.includes(keyword) ||
            descLower.includes(keyword) ||
            contentLower.includes(keyword)
          );
          
          // Also check for sports-related terms
          const isSportsRelated = titleLower.includes('football') || 
                                 titleLower.includes('soccer') ||
                                 titleLower.includes('match') ||
                                 titleLower.includes('game') ||
                                 titleLower.includes('league') ||
                                 descLower.includes('football') ||
                                 descLower.includes('soccer');
          
          return hasUgandaKeyword || isSportsRelated;
        }
        
        // Standard filtering for other leagues
        // Check for league name (more flexible - check partial matches)
        const leagueWords = leagueNameLower.split(/\s+/).filter(w => w.length > 2);
        const hasLeagueName = leagueWords.some(word => 
          titleLower.includes(word) || 
          descLower.includes(word) ||
          contentLower.includes(word)
        ) || titleLower.includes(leagueNameLower) || 
           descLower.includes(leagueNameLower) ||
           contentLower.includes(leagueNameLower);
        
        // Also check if it's sports-related
        const isSportsRelated = titleLower.includes('football') || 
                               titleLower.includes('soccer') ||
                               titleLower.includes('match') ||
                               titleLower.includes('game') ||
                               titleLower.includes('league') ||
                               descLower.includes('football') ||
                               descLower.includes('soccer');
        
        return hasLeagueName || isSportsRelated;
      });
      
      console.log(`📊 Relevant articles after filtering: ${relevantNews.length}`);

      // Transform to LeagueMoment format
      const transformedMoments: LeagueMoment[] = relevantNews
        .slice(0, 30) // Limit to 30 most relevant
        .map((article, index) => ({
          id: article.id || `moment-${index}-${Date.now()}`,
          title: article.title,
          summary: article.description || "",
          time: formatTimeAgo(article.publishedAt),
          image: article.urlToImage || "",
          publishedAt: article.publishedAt,
          url: article.url,
          source: article.source?.name || "Sports News",
        }))
        .sort((a, b) => {
          // Sort by published date (newest first)
          return (
            new Date(b.publishedAt).getTime() -
            new Date(a.publishedAt).getTime()
          );
        });

      console.log(`✅ Successfully transformed ${transformedMoments.length} moments`);
      setMoments(transformedMoments);
      
      // If no moments found, log detailed info for debugging
      if (transformedMoments.length === 0) {
        console.warn(`⚠️ No moments found for league: ${leagueSearchName}`);
        console.warn(`📊 Debug info: allNews=${allNews.length}, uniqueNews=${uniqueNews.length}, relevantNews=${relevantNews.length}`);
      }
    } catch (err) {
      console.error("❌ Error fetching league moments:", err);
      setError(err instanceof Error ? err.message : "Failed to load moments");
      setMoments([]);
    } finally {
      setIsLoadingApi(false);
      setRefreshing(false);
    }
  }, [leagueSearchName, formatTimeAgo]);

  useEffect(() => {
    if (leagueSearchName) {
      fetchLeagueMatches();
      fetchLeagueMoments();
    }
  }, [leagueSearchName, fetchLeagueMatches, fetchLeagueMoments]);

  const onRefresh = useCallback(async () => {
    await Promise.all([fetchLeagueMatches(), fetchLeagueMoments(true)]);
  }, [fetchLeagueMatches, fetchLeagueMoments]);

  // Sort matches: Live matches first, then by date
  const sortedMatches = [...matches].sort((a, b) => {
    const aIsLive = isMatchLive(a.status);
    const bIsLive = isMatchLive(b.status);
    
    if (aIsLive && !bIsLive) return -1;
    if (!aIsLive && bIsLive) return 1;
    return 0;
  });

  // Check if we have real match data
  const hasMatches = sortedMatches.length > 0;
  const hasNews = moments.length > 0;

  return (
    <ScrollView
      style={styles.tabContent}
      contentContainerStyle={styles.tabContentContainer}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#FF3B30"
        />
      }
    >
      {/* Match Day Section - Only show if real matches exist */}
      {hasMatches ? (
        <View style={styles.matchDaySection}>
          <Text style={[styles.matchDayTitle, { color: theme.colors.text }]}>
            Match Day
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.matchDayScroll}
            contentContainerStyle={styles.matchDayContent}
          >
            {sortedMatches.map((match) => {
              const matchIsLive = isMatchLive(match.status);
              
              return (
                <TouchableOpacity
                  key={match.id}
                    style={[
                      styles.mainMatchCard,
                      {
                        backgroundColor: matchIsLive ? "rgba(255, 23, 68, 0.05)" : "transparent",
                        borderColor: matchIsLive ? "#FF1744" : leaguePrimaryColor,
                        borderWidth: matchIsLive ? 2 : 1,
                      },
                    ]}
                  onPress={() => {
                    router.push({
                      pathname: "/match-details/[matchId]",
                      params: { matchId: match.fixtureId.toString() },
                    });
                  }}
                >
                  {/* Enhanced LIVE Badge at top of card */}
                  {matchIsLive && (
                    <View style={styles.liveCardBadge}>
                      <View style={styles.livePulseContainer}>
                        <View style={styles.livePulse} />
                        <View style={styles.liveDot} />
                      </View>
                      <Text style={styles.liveBadgeText}>LIVE NOW</Text>
                    </View>
                  )}

                  <View style={styles.matchCardHeader}>
                    <Text
                      style={[
                        styles.competitionText,
                        {
                          color: matchIsLive ? "#FF1744" : theme.colors.textSecondary,
                          fontWeight: matchIsLive ? "700" : "600",
                        },
                      ]}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {match.homeTeam.name} vs {match.awayTeam.name}
                    </Text>
                    <Text
                      style={[
                        styles.matchTime,
                        { color: theme.colors.textSecondary },
                      ]}
                      numberOfLines={1}
                    >
                      {match.date}
                    </Text>
                  </View>

                  <View style={styles.teamsContainer}>
                    <View style={styles.verticalTeamsSection}>
                      {/* Home Team Row */}
                      <View style={styles.teamRow}>
                        <Image
                          source={{ uri: match.homeTeam.logo }}
                          style={styles.smallTeamLogo}
                          resizeMode="contain"
                        />
                        <Text
                          style={[styles.teamNameText, { color: theme.colors.text }]}
                        >
                          {match.homeTeam.name}
                        </Text>
                      </View>

                      {/* Away Team Row */}
                      <View style={styles.teamRow}>
                        <Image
                          source={{ uri: match.awayTeam.logo }}
                          style={styles.smallTeamLogo}
                          resizeMode="contain"
                        />
                        <Text
                          style={[styles.teamNameText, { color: theme.colors.text }]}
                        >
                          {match.awayTeam.name}
                        </Text>
                      </View>
                    </View>

                    {/* Countdown or LIVE Indicator */}
                    <View style={styles.countdownContainer}>
                      {matchIsLive ? (
                        <View style={styles.liveIndicatorLarge}>
                          <View style={styles.liveIconContainer}>
                            <View style={styles.livePulseDot} />
                            <Text style={styles.liveTextLarge}>LIVE</Text>
                          </View>
                          <Text style={styles.liveSubtext}>In Progress</Text>
                        </View>
                      ) : match.date ? (
                        (() => {
                          const countdown = getCountdownData(match.date, match.time);
                          return (
                            <View style={styles.countdownRow}>
                              {countdown.days > 0 && (
                                <View
                                  style={[
                                    styles.countdownCircle,
                                    {
                                      backgroundColor: leaguePrimaryColor + "15",
                                    },
                                  ]}
                                >
                                  <Text
                                    style={[
                                      styles.countdownText,
                                      { color: leaguePrimaryColor },
                                    ]}
                                  >
                                    {countdown.days.toString().padStart(2, "0")}d
                                  </Text>
                                </View>
                              )}
                              {(countdown.days > 0 || countdown.hours > 0) && (
                                <View
                                  style={[
                                    styles.countdownCircle,
                                    {
                                      backgroundColor: leaguePrimaryColor + "15",
                                    },
                                  ]}
                                >
                                  <Text
                                    style={[
                                      styles.countdownText,
                                      { color: leaguePrimaryColor },
                                    ]}
                                  >
                                    {countdown.hours.toString().padStart(2, "0")}h
                                  </Text>
                                </View>
                              )}
                              <View
                                style={[
                                  styles.countdownCircle,
                                  {
                                    backgroundColor: leaguePrimaryColor + "15",
                                  },
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.countdownText,
                                    { color: leaguePrimaryColor },
                                  ]}
                                >
                                  {countdown.minutes.toString().padStart(2, "0")}m
                                </Text>
                              </View>
                              {countdown.showSeconds && (
                                <View
                                  style={[
                                    styles.countdownCircle,
                                    {
                                      backgroundColor: leaguePrimaryColor + "15",
                                    },
                                  ]}
                                >
                                  <Text
                                    style={[
                                      styles.countdownText,
                                      { color: leaguePrimaryColor },
                                    ]}
                                  >
                                    {countdown.seconds.toString().padStart(2, "0")}s
                                  </Text>
                                </View>
                              )}
                            </View>
                          );
                        })()
                      ) : (
                        <Text style={[styles.countdownText, { color: theme.colors.textSecondary }]}>
                          TBD
                        </Text>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      ) : (
        <View style={styles.noDataSection}>
          <Text style={[styles.noDataText, { color: theme.colors.textSecondary }]}>
            No upcoming matches available
          </Text>
        </View>
      )}

      {/* News/Moments Content - Show error or news (no blocking loading) */}
      {error && moments.length === 0 && !isLoadingApi ? (
        <View style={styles.noDataSection}>
          <Text style={[styles.noDataText, { color: theme.colors.textSecondary }]}>
            {error}
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => fetchLeagueMoments()}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : hasNews ? (
        <View style={styles.newsSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Latest Moments
          </Text>
          {moments.map((newsItem) => (
            <TouchableOpacity
              key={newsItem.id}
              style={[
                styles.newsItem,
                { borderBottomColor: theme.colors.border },
              ]}
              onPress={() => {
                console.log(`🚀 [LeagueMoments] Navigating to news-detail with article: "${newsItem.title}"`);
                
                // Format article data to match the official news detail screen format
                const validArticle = {
                  id: newsItem.id || `news-${Date.now()}`,
                  title: newsItem.title || "Untitled",
                  description: newsItem.summary || "",
                  urlToImage: newsItem.image || "",
                  publishedAt: newsItem.publishedAt || new Date().toISOString(),
                  source: typeof newsItem.source === 'string' 
                    ? { name: newsItem.source, id: "sports" }
                    : newsItem.source || { name: "Sports News", id: "sports" },
                  url: newsItem.url || "#",
                  content: newsItem.summary || "",
                  category: "League Moments",
                };

                router.push({
                  pathname: "/news/news-detail",
                  params: { data: JSON.stringify(validArticle) },
                });
              }}
            >
              <View style={styles.newsContent}>
                <Text
                  style={[styles.newsTitle, { color: theme.colors.text }]}
                  numberOfLines={2}
                >
                  {newsItem.title}
                </Text>
                <Text
                  style={[
                    styles.newsTime,
                    {
                      color: theme.colors.textSecondary,
                    },
                  ]}
                >
                  {newsItem.time}
                </Text>
              </View>
              {newsItem.image ? (
                <Image source={{ uri: newsItem.image }} style={styles.newsImage} />
              ) : (
                <View style={[styles.newsImagePlaceholder, { backgroundColor: theme.colors.border }]} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View style={styles.noDataSection}>
          <Text style={[styles.noDataText, { color: theme.colors.textSecondary }]}>
            No news available
          </Text>
          <Text style={[styles.noDataSubtext, { color: theme.colors.textSecondary }]}>
            Check back later for updates about {leagueSearchName}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  tabContent: {
    flex: 1,
  },
  tabContentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 100,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: "Inter-Medium",
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "#FF3B30",
    borderRadius: 8,
  },
  retryButtonText: {
    color: "white",
    fontSize: 14,
    fontFamily: "Inter-SemiBold",
  },
  matchDaySection: {
    marginBottom: 24,
  },
  matchDayTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  matchDayScroll: {
    marginHorizontal: -16,
  },
  matchDayContent: {
    paddingHorizontal: 16,
    gap: 16,
  },
  mainMatchCard: {
    width: 320,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: "relative",
  },
  liveCardBadge: {
    position: "absolute",
    top: -8,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF1744",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    zIndex: 10,
    shadowColor: "#FF1744",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  livePulseContainer: {
    width: 12,
    height: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  livePulse: {
    position: "absolute",
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#FFFFFF",
    opacity: 0.4,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
  },
  liveBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  matchCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  competitionText: {
    fontSize: 12,
    fontWeight: "600",
    flex: 1,
    flexShrink: 1,
  },
  matchTime: {
    fontSize: 14,
    fontWeight: "600",
    flexShrink: 0,
    minWidth: 85,
    textAlign: "right",
  },
  teamsContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 20,
  },
  verticalTeamsSection: {
    flex: 1,
    gap: 16,
    justifyContent: "center",
  },
  teamRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  smallTeamLogo: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  smallTeamLogoText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  teamNameText: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  countdownContainer: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  countdownRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  countdownCircle: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
  },
  countdownText: {
    fontSize: 11,
    fontWeight: "bold",
    textAlign: "center",
  },
  liveIndicatorLarge: {
    alignItems: "center",
    gap: 4,
  },
  liveIconContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF1744",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    shadowColor: "#FF1744",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  livePulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
  },
  liveTextLarge: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  liveSubtext: {
    color: "#FF1744",
    fontSize: 10,
    fontWeight: "600",
  },
  newsSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  newsItem: {
    flexDirection: "row",
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    marginHorizontal: -16,
    paddingHorizontal: 16,
    alignItems: "flex-start",
  },
  newsContent: {
    flex: 1,
    paddingRight: 16,
  },
  newsTitle: {
    fontSize: 15,
    fontWeight: "500",
    lineHeight: 22,
    marginBottom: 6,
    fontFamily: "Inter-Medium",
  },
  newsTime: {
    fontSize: 13,
    fontWeight: "400",
    fontFamily: "Inter-Regular",
  },
  newsImage: {
    width: 90,
    height: 70,
    borderRadius: 8,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
  },
  newsImagePlaceholder: {
    width: 90,
    height: 70,
    borderRadius: 8,
  },
  noDataSection: {
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  noDataText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 8,
    fontFamily: "Inter-Medium",
  },
  noDataSubtext: {
    fontSize: 14,
    textAlign: "center",
    fontFamily: "Inter-Regular",
  },
});
