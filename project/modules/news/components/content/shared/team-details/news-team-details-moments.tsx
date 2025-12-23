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

interface TeamData {
  id: string;
  name: string;
  logo: string;
  upcomingMatches: Array<{
    opponent: string;
    opponentLogo?: string;
    date: string;
    homeAway: "H" | "A";
  }>;
  news?: Array<{
    id: string;
    title: string;
    summary: string;
    time: string;
    image: string;
  }>;
}

interface TeamMoment {
  id: string;
  title: string;
  summary: string;
  time: string;
  image: string;
  publishedAt: string;
  url: string;
  source: string;
}

interface NewsTeamDetailsMomentsProps {
  teamData: TeamData;
  theme: any;
  teamColors: { primary: string; secondary: string; logo: string };
  isMatchLive: (matchDate: string, matchTime: string) => boolean;
  getCountdownData: (
    matchDate: string,
    matchTime: string
  ) => {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    showSeconds: boolean;
  };
  loading?: boolean;
  sport?: string; // ✅ Add sport parameter
}

export default function NewsTeamDetailsMoments({
  teamData,
  theme,
  teamColors,
  isMatchLive,
  getCountdownData,
}: NewsTeamDetailsMomentsProps) {
  const router = useRouter();
  // Initialize with empty array for instant display
  const [moments, setMoments] = useState<TeamMoment[]>([]);
  const [isLoadingApi, setIsLoadingApi] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Format timestamp to relative time (e.g., "2 hours ago", "Yesterday")
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

  // Fetch team-related news using all 6 APIs - non-blocking
  const fetchTeamNews = useCallback(async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setIsLoadingApi(true);
      }
      setError(null);

      console.log(`🔍 Fetching team news for: ${teamData.name}`);
      
      // Create multiple search queries for better API compatibility
      const teamQueries = [
        `${teamData.name} football`,
        `${teamData.name} soccer`,
        `${teamData.name}`,
      ];
      
      // Fetch news related to team name with multiple queries
      console.log(`🔍 Searching team news with queries: ${teamQueries.join(', ')}`);
      const teamNewsPromises = teamQueries.map(query => 
        newsService.searchNews(query, 15).catch(err => {
          console.log(`⚠️ Team search failed for "${query}":`, err.message);
          return [];
        })
      );
      const teamNewsResults = await Promise.all(teamNewsPromises);
      const allNews = teamNewsResults.flat();
      console.log(`✅ Found ${allNews.length} team news articles`);

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

      // Filter to ensure relevance to team
      const teamNameLower = teamData.name.toLowerCase();
      const relevantNews = uniqueNews.filter((article) => {
        const titleLower = article.title.toLowerCase();
        const descLower = (article.description || "").toLowerCase();
        const contentLower = (article.content || "").toLowerCase();
        
        // Check for team name (more flexible - check partial matches)
        const teamWords = teamNameLower.split(/\s+/).filter(w => w.length > 2);
        const hasTeamName = teamWords.some(word => 
          titleLower.includes(word) || 
          descLower.includes(word) ||
          contentLower.includes(word)
        ) || titleLower.includes(teamNameLower) || 
           descLower.includes(teamNameLower) ||
           contentLower.includes(teamNameLower);
        
        // Also check if it's sports-related
        const isSportsRelated = titleLower.includes('football') || 
                               titleLower.includes('soccer') ||
                               titleLower.includes('match') ||
                               titleLower.includes('game') ||
                               descLower.includes('football') ||
                               descLower.includes('soccer');
        
        return hasTeamName || isSportsRelated;
      });
      
      console.log(`📊 Relevant articles after filtering: ${relevantNews.length}`);

      // Transform to TeamMoment format
      const transformedMoments: TeamMoment[] = relevantNews
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
        console.warn(`⚠️ No moments found for team: ${teamData.name}`);
        console.warn(`📊 Debug info: allNews=${allNews.length}, uniqueNews=${uniqueNews.length}, relevantNews=${relevantNews.length}`);
      }
    } catch (err) {
      console.error("❌ Error fetching team moments:", err);
      setError(err instanceof Error ? err.message : "Failed to load moments");
      setMoments([]);
    } finally {
      setIsLoadingApi(false);
      setRefreshing(false);
    }
  }, [teamData.name, formatTimeAgo]);

  useEffect(() => {
    if (teamData.name) {
      fetchTeamNews();
    }
  }, [teamData.name, fetchTeamNews]);

  // Sort matches: Live matches first, then by date
  const sortedMatches = [...teamData.upcomingMatches].sort((a, b) => {
    const aIsLive = a.date && isMatchLive(a.date.split(" ")[0], a.date.split(" ")[1]);
    const bIsLive = b.date && isMatchLive(b.date.split(" ")[0], b.date.split(" ")[1]);
    
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
          onRefresh={() => fetchTeamNews(true)}
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
            {sortedMatches.map((match, index) => {
            const matchIsLive = match.date && isMatchLive(match.date.split(" ")[0], match.date.split(" ")[1]);
            
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.mainMatchCard,
                  {
                    backgroundColor: matchIsLive ? "rgba(255, 23, 68, 0.05)" : "transparent",
                    borderColor: matchIsLive ? "#FF1744" : teamColors.primary,
                    borderWidth: matchIsLive ? 2 : 1,
                  },
                ]}
                onPress={() => {
                  if (!match) return;
                  
                  const isHome = match.homeAway === "H";
                  
                  // Create match start time from date string
                  const [dateStr, timeStr] = match.date.split(" ");
                  const [month, day] = dateStr.split("/");
                  const [hours, minutes] = timeStr?.split(":") || ["00", "00"];
                  
                  const matchDate = new Date();
                  matchDate.setMonth(parseInt(month) - 1);
                  matchDate.setDate(parseInt(day));
                  matchDate.setHours(parseInt(hours));
                  matchDate.setMinutes(parseInt(minutes));
                  matchDate.setSeconds(0);
                  
                  const matchId = `${teamData.id}-${match.opponent.toLowerCase().replace(/\s+/g, "-")}-${dateStr.replace("/", "")}`;
                  
                  router.push({
                    pathname: "/match-details",
                    params: {
                      matchId: matchId,
                      homeTeam: isHome ? teamData.name : match.opponent,
                      awayTeam: isHome ? match.opponent : teamData.name,
                      homeScore: "0",
                      awayScore: "0",
                      status: matchIsLive ? "1H" : "NS",
                      league: `${teamData.name} Match`,
                      startTime: matchDate.toISOString(),
                      homeLogo: (isHome ? teamData.logo : match.opponentLogo) || "",
                      awayLogo: (isHome ? match.opponentLogo : teamData.logo) || "",
                      homeCorners: "0",
                      awayCorners: "0",
                      halftimeScore: "0-0",
                      from: "team-details-moments",
                    },
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
                    {match ? `${teamData.name} vs ${match.opponent}` : "Upcoming Match"}
                  </Text>
                  <Text
                    style={[
                      styles.matchTime,
                      { color: theme.colors.textSecondary },
                    ]}
                    numberOfLines={1}
                  >
                    {match?.date || "TBD"}
                  </Text>
                </View>

                <View style={styles.teamsContainer}>
                  <View style={styles.verticalTeamsSection}>
                    {/* Home Team Row */}
                    <View style={styles.teamRow}>
                      {teamData.logo && teamData.logo.startsWith('http') ? (
                        <Image
                          source={{ uri: teamData.logo }}
                          style={styles.smallTeamLogo}
                          resizeMode="contain"
                        />
                      ) : (
                        <View
                          style={[
                            styles.smallTeamLogo,
                            {
                              backgroundColor: teamColors.primary,
                            },
                          ]}
                        >
                          <Text style={styles.smallTeamLogoText}>
                            {teamData.name.substring(0, 2).toUpperCase()}
                          </Text>
                        </View>
                      )}
                      <Text
                        style={[styles.teamNameText, { color: theme.colors.text }]}
                      >
                        {teamData.name}
                      </Text>
                    </View>

                    {/* Away Team Row */}
                    <View style={styles.teamRow}>
                      {match?.opponentLogo ? (
                        <Image
                          source={{ uri: match.opponentLogo }}
                          style={styles.smallTeamLogo}
                          resizeMode="contain"
                        />
                      ) : (
                        <View
                          style={[
                            styles.smallTeamLogo,
                            {
                              backgroundColor: theme.colors.textSecondary,
                            },
                          ]}
                        >
                          <Text style={styles.smallTeamLogoText}>
                            {match?.opponent.substring(0, 2).toUpperCase() || "VS"}
                          </Text>
                        </View>
                      )}
                      <Text
                        style={[styles.teamNameText, { color: theme.colors.text }]}
                      >
                        {match?.opponent || "TBD"}
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
                    ) : match && match.date ? (
                      (() => {
                        const countdown = getCountdownData(
                          match.date.split(" ")[0],
                          match.date.split(" ")[1]
                        );
                        return (
                          <View style={styles.countdownRow}>
                            {countdown.days > 0 && (
                              <View
                                style={[
                                  styles.countdownCircle,
                                  {
                                    backgroundColor: teamColors.primary + "15",
                                  },
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.countdownText,
                                    { color: teamColors.primary },
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
                                    backgroundColor: teamColors.primary + "15",
                                  },
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.countdownText,
                                    { color: teamColors.primary },
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
                                  backgroundColor: teamColors.primary + "15",
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.countdownText,
                                  { color: teamColors.primary },
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
                                    backgroundColor: teamColors.primary + "15",
                                  },
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.countdownText,
                                    { color: teamColors.primary },
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
            onPress={() => fetchTeamNews()}
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
              console.log(`🚀 [NewsTeamDetailsMoments] Navigating to news-detail with article: "${newsItem.title}"`);
              
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
                content: newsItem.summary || "", // Use summary as content if available
                category: "Team Moments",
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
            Check back later for updates about {teamData.name}
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
