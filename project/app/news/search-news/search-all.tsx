import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Search, X, ChevronRight, Clock } from "lucide-react-native";
import { useTheme } from "../../../hooks/useTheme";
import { newsService, NewsArticle } from "../../../modules/news";
import { searchPlayers } from "../../../services/sofaScoreTransfersService";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface PlayerResult {
  id: number;
  name: string;
  teamName?: string;
  photo?: string;
  position?: string;
  nationality?: string;
  age?: number;
}

interface ManagerResult {
  id: number;
  name: string;
  teamName?: string;
  photo?: string;
  nationality?: string;
  age?: number;
}

export default function SearchAllScreen() {
  const router = useRouter();
  const theme = useTheme();
  const params = useLocalSearchParams();
  
  // Memoize the query extraction to prevent recalculation on every render
  const searchQuery = useMemo(() => {
    return (params.query as string) || 
           (params as any).query || 
           (typeof params === 'object' && 'query' in params ? (params as any).query : '') ||
           "";
  }, [params.query]);

  const [activeTab, setActiveTab] = useState<"all" | "player" | "manager" | "news">("all");
  const [searchInput, setSearchInput] = useState(searchQuery);
  const [players, setPlayers] = useState<PlayerResult[]>([]);
  const [managers, setManagers] = useState<ManagerResult[]>([]);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sportFilter, setSportFilter] = useState<"all" | "football" | "basketball">("all");
  
  // Track the last searched query to prevent duplicate searches
  const lastSearchedQueryRef = useRef<string>("");
  const isInitialMountRef = useRef(true);

  useEffect(() => {
    // Skip on initial mount if no query
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      if (!searchQuery || !searchQuery.trim()) {
        setLoading(false);
        return;
      }
    }
    
    // Prevent duplicate searches for the same query
    if (lastSearchedQueryRef.current === searchQuery.trim()) {
      return;
    }
    
    // Update search input when query changes from params
    if (searchQuery && searchQuery.trim() && searchQuery !== searchInput) {
      setSearchInput(searchQuery);
    }
    
    if (searchQuery && searchQuery.trim()) {
      lastSearchedQueryRef.current = searchQuery.trim();
      performSearch(searchQuery.trim());
    } else {
      setLoading(false);
    }
  }, [searchQuery]);

  const performSearch = async (query: string, isRefreshing = false) => {
    if (!query.trim()) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    // Update the last searched query ref
    lastSearchedQueryRef.current = query.trim();
    
    if (isRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
    // Only update searchInput if it's different to prevent unnecessary re-renders
    if (searchInput !== query) {
      setSearchInput(query);
    }

    // Reset previous results based on active tab
    if (activeTab === "all") {
      setPlayers([]);
      setManagers([]);
      setNews([]);
    } else if (activeTab === "player") {
      setPlayers([]);
    } else if (activeTab === "manager") {
      setManagers([]);
    } else if (activeTab === "news") {
      setNews([]);
    }

    try {
      // Search based on active tab
      if (activeTab === "all") {
        // Search all: players, managers, and news
        try {
          console.log(`🔍 [SearchAll] Searching players...`);
          const playerResults = await Promise.race([
            searchPlayers(query),
            new Promise<any[]>((resolve) => setTimeout(() => resolve([]), 10000))
          ]);
          const formattedPlayers: PlayerResult[] = playerResults.slice(0, 10).map((p) => ({
            id: p.id,
            name: p.name,
            teamName: p.teamName,
          }));
          setPlayers(formattedPlayers);
          console.log(`✅ [SearchAll] Found ${formattedPlayers.length} players`);
        } catch (error: any) {
          console.error(`❌ [SearchAll] Player search error:`, error?.message || error);
          setPlayers([]);
        }

        try {
          console.log(`🔍 [SearchAll] Searching managers...`);
          const managerResults = await Promise.race([
            searchPlayers(query),
            new Promise<any[]>((resolve) => setTimeout(() => resolve([]), 10000))
          ]);
          const formattedManagers: ManagerResult[] = managerResults.slice(0, 10).map((m) => ({
            id: m.id,
            name: m.name,
            teamName: m.teamName,
          }));
          setManagers(formattedManagers);
          console.log(`✅ [SearchAll] Found ${formattedManagers.length} managers`);
        } catch (error: any) {
          console.error(`❌ [SearchAll] Manager search error:`, error?.message || error);
          setManagers([]);
        }

        try {
          console.log(`🔍 [SearchAll] Searching news...`);
          const newsResults = await Promise.race([
            newsService.searchNews(query, 20),
            new Promise<NewsArticle[]>((resolve) => setTimeout(() => resolve([]), 15000))
          ]);
          setNews(newsResults);
          console.log(`✅ [SearchAll] Found ${newsResults.length} news articles`);
        } catch (error: any) {
          console.error(`❌ [SearchAll] News search error:`, error?.message || error);
          setNews([]);
        }
      } else if (activeTab === "player") {
        // Search players only
        try {
          const playerResults = await Promise.race([
            searchPlayers(query),
            new Promise<any[]>((resolve) => setTimeout(() => resolve([]), 10000))
          ]);
          const formattedPlayers: PlayerResult[] = playerResults.map((p) => ({
            id: p.id,
            name: p.name,
            teamName: p.teamName,
            photo: p.photo,
            position: p.position,
            nationality: p.nationality,
            age: p.age,
          }));
          setPlayers(formattedPlayers);
          console.log(`✅ [SearchAll] Found ${formattedPlayers.length} players`);
        } catch (error: any) {
          console.error(`❌ [SearchAll] Player search error:`, error?.message || error);
          setPlayers([]);
        }
      } else if (activeTab === "manager") {
        // Search managers only
        try {
          const managerResults = await Promise.race([
            searchPlayers(query),
            new Promise<any[]>((resolve) => setTimeout(() => resolve([]), 10000))
          ]);
          const formattedManagers: ManagerResult[] = managerResults.slice(0, 50).map((m) => ({
            id: m.id,
            name: m.name,
            teamName: m.teamName,
            photo: m.photo,
            role: "Head Coach",
          }));
          setManagers(formattedManagers);
          console.log(`✅ [SearchAll] Found ${formattedManagers.length} managers`);
        } catch (error: any) {
          console.error(`❌ [SearchAll] Manager search error:`, error?.message || error);
          setManagers([]);
        }
      } else if (activeTab === "news") {
        // Search news only
        try {
          const newsResults = await Promise.race([
            newsService.searchNews(query, 50),
            new Promise<NewsArticle[]>((resolve) => setTimeout(() => resolve([]), 20000))
          ]);
          
          // Remove duplicates
          const uniqueNews = newsResults.filter((article, index, self) => {
            const articleKey = (article.url && article.url !== '#') 
              ? article.url 
              : article.id || `${article.title}-${article.publishedAt}`;
            return index === self.findIndex((a) => {
              const aKey = (a.url && a.url !== '#') 
                ? a.url 
                : a.id || `${a.title}-${a.publishedAt}`;
              return aKey === articleKey;
            });
          });

          // Sort by published date (newest first)
          const sortedNews = uniqueNews.sort((a, b) => {
            return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
          });

          setNews(sortedNews);
          console.log(`✅ [SearchAll] Found ${sortedNews.length} unique news articles`);
        } catch (error: any) {
          console.error(`❌ [SearchAll] News search error:`, error?.message || error);
          setNews([]);
        }
      }
    } catch (error: any) {
      console.error(`❌ [SearchAll] General search error:`, error?.message || error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      console.log(`✅ [SearchAll] Search completed for: "${query}"`);
    }
  };

  const handleSearch = () => {
    if (searchInput.trim()) {
      console.log(`🔍 [SearchAll] User initiated search from search bar: "${searchInput.trim()}"`);
      performSearch(searchInput.trim());
    }
  };

  const handleRefresh = () => {
    if (searchInput.trim()) {
      performSearch(searchInput.trim(), true);
    }
  };

  // Re-search when tab changes
  useEffect(() => {
    const currentQuery = searchInput.trim();
    if (currentQuery && activeTab !== "all" && lastSearchedQueryRef.current === currentQuery) {
      // Only re-search if we have a query and it's the same as what we last searched
      performSearch(currentQuery);
    }
  }, [activeTab]);

  // Note: Sport filter removed from "all" tab - only exists in "player" and "manager" tabs

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays}d ago`;
    } else if (diffHours > 0) {
      return `${diffHours}h ago`;
    } else {
      return "Just now";
    }
  };

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    const parts = text.split(new RegExp(`(${query})`, "gi"));
    return parts.map((part, index) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <Text key={index} style={{ color: theme.colors.primary, fontWeight: "bold" }}>
          {part}
        </Text>
      ) : (
        part
      )
    );
  };

  const renderPlayerSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Player</Text>
        <TouchableOpacity
          onPress={() => setActiveTab("player")}
          style={styles.viewAllButton}
          activeOpacity={0.7}
        >
          <Text style={[styles.viewAllText, { color: theme.colors.primary }]}>View All</Text>
          <ChevronRight size={16} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
        </View>
      ) : players.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScrollContent}
        >
          {players.map((player) => (
            <TouchableOpacity
              key={player.id}
              style={styles.playerCard}
              onPress={() => {
                router.push({
                  pathname: "/player-details/[playerId]",
                  params: { playerId: player.id.toString() },
                });
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.playerAvatar, { backgroundColor: theme.colors.backgroundSecondary }]}>
                {player.photo ? (
                  <Image source={{ uri: player.photo }} style={styles.playerImage} />
                ) : (
                  <Text style={[styles.playerInitial, { color: theme.colors.text }]}>
                    {player.name.charAt(0).toUpperCase()}
                  </Text>
                )}
              </View>
              <Text style={[styles.playerName, { color: theme.colors.text }]} numberOfLines={1}>
                {highlightText(player.name, searchInput)}
              </Text>
              {player.teamName && (
                <Text style={[styles.playerTeam, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                  {player.teamName}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>No players found</Text>
        </View>
      )}
    </View>
  );

  const renderNewsSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>News</Text>
        <TouchableOpacity
          onPress={() => setActiveTab("news")}
          style={styles.viewAllButton}
          activeOpacity={0.7}
        >
          <Text style={[styles.viewAllText, { color: theme.colors.primary }]}>View All</Text>
          <ChevronRight size={16} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
        </View>
      ) : news.length > 0 ? (
        <View style={styles.newsList}>
          {news.slice(0, 5).map((article) => (
            <TouchableOpacity
              key={article.id}
              style={[styles.newsItem, { borderBottomColor: theme.colors.border }]}
              onPress={() => {
                router.push({
                  pathname: "/news/news-detail",
                  params: { data: JSON.stringify(article) },
                });
              }}
              activeOpacity={0.7}
            >
              <View style={styles.newsContent}>
                <View style={styles.newsTextContent}>
                  <Text style={[styles.newsTitle, { color: theme.colors.text }]} numberOfLines={2}>
                    {highlightText(article.title, searchInput)}
                  </Text>
                  <View style={styles.newsInfo}>
                    <Text style={[styles.newsSource, { color: theme.colors.primary }]}>
                      {article.source.name}
                    </Text>
                    <View style={styles.newsTime}>
                      <Clock size={12} color={theme.colors.textSecondary} />
                      <Text style={[styles.timeText, { color: theme.colors.textSecondary }]}>
                        {formatTimeAgo(article.publishedAt)}
                      </Text>
                    </View>
                  </View>
                </View>
                {article.urlToImage && (
                  <Image source={{ uri: article.urlToImage }} style={styles.newsThumbnail} />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>No news found</Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={["top"]}>
      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: theme.colors.background }]}>
        <View
          style={[
            styles.searchInputContainer,
            {
              backgroundColor: theme.colors.background,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Search size={20} color={theme.colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: theme.colors.text }]}
            placeholder="Search matches, teams, players or news"
            placeholderTextColor={theme.colors.textSecondary}
            value={searchInput}
            onChangeText={setSearchInput}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            autoFocus={false}
          />
          {searchInput.length > 0 && (
            <TouchableOpacity onPress={() => setSearchInput("")} style={styles.clearButton}>
              <X size={16} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity 
          style={styles.cancelButton} 
          onPress={() => {
            if (searchInput.trim().length > 0) {
              // If there's text, perform search
              handleSearch();
            } else {
              // If empty, go back
              router.back();
            }
          }}
        >
          <Text style={[styles.cancelText, { color: theme.colors.text }]}>
            {searchInput && searchInput.trim().length > 0 ? "Search" : "Cancel"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={[styles.tabsContainer, { backgroundColor: theme.colors.background }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "all" && styles.activeTab]}
          onPress={() => setActiveTab("all")}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === "all" ? theme.colors.primary : theme.colors.textSecondary },
            ]}
          >
            All
          </Text>
          {activeTab === "all" && <View style={[styles.tabIndicator, { backgroundColor: theme.colors.primary }]} />}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "player" && styles.activeTab]}
          onPress={() => setActiveTab("player")}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === "player" ? theme.colors.primary : theme.colors.textSecondary },
            ]}
          >
            Player
          </Text>
          {activeTab === "player" && (
            <View style={[styles.tabIndicator, { backgroundColor: theme.colors.primary }]} />
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "manager" && styles.activeTab]}
          onPress={() => setActiveTab("manager")}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === "manager" ? theme.colors.primary : theme.colors.textSecondary },
            ]}
          >
            Manager
          </Text>
          {activeTab === "manager" && (
            <View style={[styles.tabIndicator, { backgroundColor: theme.colors.primary }]} />
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "news" && styles.activeTab]}
          onPress={() => setActiveTab("news")}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === "news" ? theme.colors.primary : theme.colors.textSecondary },
            ]}
          >
            News
          </Text>
          {activeTab === "news" && <View style={[styles.tabIndicator, { backgroundColor: theme.colors.primary }]} />}
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === "all" && (
        <>
          {/* Content area - shows all results without sport filtering */}
          <ScrollView 
            style={styles.content}
            contentContainerStyle={{ backgroundColor: "transparent" }}
            showsVerticalScrollIndicator={false}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
                  Searching...
                </Text>
              </View>
            ) : (
              <>
                {renderPlayerSection()}
                {renderNewsSection()}
                {!loading && players.length === 0 && managers.length === 0 && news.length === 0 && (
                  <View style={styles.emptyContainer}>
                    <Text style={[styles.emptyText, { color: theme.colors.text }]}>
                      No results found for "{searchInput}"
                    </Text>
                    <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>
                      Try searching with different keywords
                    </Text>
                  </View>
                )}
              </>
            )}
          </ScrollView>
        </>
      )}

      {activeTab === "player" && (
        <>
          {/* Sport Filter Tabs - Using stats-followed-matches pattern */}
          <View style={styles.sportFilterContainer}>
            <TouchableOpacity
              style={[
                styles.sportFilterTab,
                {
                  backgroundColor:
                    sportFilter === "all"
                      ? theme.colors.backgroundSecondary
                      : "transparent",
                },
              ]}
              onPress={() => setSportFilter("all")}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.sportFilterText,
                  {
                    color:
                      sportFilter === "all"
                        ? theme.colors.primary
                        : theme.colors.textSecondary,
                    fontWeight: sportFilter === "all" ? "600" : "normal",
                  },
                ]}
              >
                All
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.sportFilterTab,
                {
                  backgroundColor:
                    sportFilter === "football"
                      ? theme.colors.backgroundSecondary
                      : "transparent",
                },
              ]}
              onPress={() => setSportFilter("football")}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.sportFilterText,
                  {
                    color:
                      sportFilter === "football"
                        ? theme.colors.primary
                        : theme.colors.textSecondary,
                    fontWeight: sportFilter === "football" ? "600" : "normal",
                  },
                ]}
              >
                Football
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.sportFilterTab,
                {
                  backgroundColor:
                    sportFilter === "basketball"
                      ? theme.colors.backgroundSecondary
                      : "transparent",
                },
              ]}
              onPress={() => setSportFilter("basketball")}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.sportFilterText,
                  {
                    color:
                      sportFilter === "basketball"
                        ? theme.colors.primary
                        : theme.colors.textSecondary,
                    fontWeight: sportFilter === "basketball" ? "600" : "normal",
                  },
                ]}
              >
                Basketball
              </Text>
            </TouchableOpacity>
          </View>

          {/* Player Results - Content area with grouped background (stats-followed-matches pattern) */}
          <View style={[
            styles.contentWrapper,
            { backgroundColor: theme.colors.backgroundSecondary }
          ]}>
            <ScrollView 
              style={styles.scrollView}
              contentContainerStyle={{ paddingBottom: 20, backgroundColor: "transparent" }}
              showsVerticalScrollIndicator={false}
            >
            {loading ? (
              <View style={[styles.loadingContainer, { backgroundColor: 'transparent' }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
                  Searching players...
                </Text>
              </View>
            ) : players.length > 0 ? (
              <View style={styles.playerList}>
                {players.map((player) => (
                  <TouchableOpacity
                    key={player.id}
                    style={[styles.playerItem, { borderBottomColor: theme.colors.border }]}
                    onPress={() => {
                      router.push({
                        pathname: "/player-details/[playerId]",
                        params: { playerId: player.id.toString() },
                      });
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.playerAvatar, { backgroundColor: theme.colors.backgroundSecondary }]}>
                      {player.photo ? (
                        <Image source={{ uri: player.photo }} style={styles.playerImage} />
                      ) : (
                        <Text style={[styles.playerInitial, { color: theme.colors.text }]}>
                          {player.name.charAt(0).toUpperCase()}
                        </Text>
                      )}
                    </View>
                    <View style={styles.playerInfo}>
                      <Text style={[styles.playerName, { color: theme.colors.text }]}>
                        {highlightText(player.name, searchInput)}
                      </Text>
                      {player.teamName && (
                        <Text style={[styles.playerDetails, { color: theme.colors.textSecondary }]}>
                          {player.teamName}
                        </Text>
                      )}
                      {(player.nationality || player.age) && (
                        <Text style={[styles.playerDetails, { color: theme.colors.textSecondary }]}>
                          {[player.nationality, player.age ? `${player.age} years old` : null]
                            .filter(Boolean)
                            .join(" / ")}
                        </Text>
                      )}
                    </View>
                    <ChevronRight size={20} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: theme.colors.text }]}>No players found</Text>
                <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>
                  Try searching with a different name
                </Text>
              </View>
            )}
            </ScrollView>
          </View>
        </>
      )}

      {activeTab === "manager" && (
        <>
          {/* Sport Filter Tabs - Using stats-followed-matches pattern */}
          <View style={styles.sportFilterContainer}>
            <TouchableOpacity
              style={[
                styles.sportFilterTab,
                {
                  backgroundColor:
                    sportFilter === "all"
                      ? theme.colors.backgroundSecondary
                      : "transparent",
                },
              ]}
              onPress={() => setSportFilter("all")}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.sportFilterText,
                  {
                    color:
                      sportFilter === "all"
                        ? theme.colors.primary
                        : theme.colors.textSecondary,
                    fontWeight: sportFilter === "all" ? "600" : "normal",
                  },
                ]}
              >
                All
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.sportFilterTab,
                {
                  backgroundColor:
                    sportFilter === "football"
                      ? theme.colors.backgroundSecondary
                      : "transparent",
                },
              ]}
              onPress={() => setSportFilter("football")}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.sportFilterText,
                  {
                    color:
                      sportFilter === "football"
                        ? theme.colors.primary
                        : theme.colors.textSecondary,
                    fontWeight: sportFilter === "football" ? "600" : "normal",
                  },
                ]}
              >
                Football
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.sportFilterTab,
                {
                  backgroundColor:
                    sportFilter === "basketball"
                      ? theme.colors.backgroundSecondary
                      : "transparent",
                },
              ]}
              onPress={() => setSportFilter("basketball")}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.sportFilterText,
                  {
                    color:
                      sportFilter === "basketball"
                        ? theme.colors.primary
                        : theme.colors.textSecondary,
                    fontWeight: sportFilter === "basketball" ? "600" : "normal",
                  },
                ]}
              >
                Basketball
              </Text>
            </TouchableOpacity>
          </View>

          {/* Manager Results - Content area with grouped background (stats-followed-matches pattern) */}
          <View style={[
            styles.contentWrapper,
            { backgroundColor: theme.colors.backgroundSecondary }
          ]}>
            <ScrollView 
              style={styles.scrollView}
              contentContainerStyle={{ paddingBottom: 20, backgroundColor: "transparent" }}
              showsVerticalScrollIndicator={false}
            >
            {loading ? (
              <View style={[styles.loadingContainer, { backgroundColor: 'transparent' }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
                  Searching managers...
                </Text>
              </View>
            ) : managers.length > 0 ? (
              <View style={styles.managerList}>
                {managers.map((manager) => (
                  <TouchableOpacity
                    key={manager.id}
                    style={[styles.managerItem, { borderBottomColor: theme.colors.border }]}
                    onPress={() => {
                      console.log("Manager pressed:", manager.name);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.managerAvatar, { backgroundColor: theme.colors.backgroundSecondary }]}>
                      {manager.photo ? (
                        <Image source={{ uri: manager.photo }} style={styles.managerImage} />
                      ) : (
                        <Text style={[styles.managerInitial, { color: theme.colors.text }]}>
                          {manager.name.charAt(0).toUpperCase()}
                        </Text>
                      )}
                    </View>
                    <View style={styles.managerInfo}>
                      <Text style={[styles.managerName, { color: theme.colors.text }]}>
                        {highlightText(manager.name, searchInput)}
                      </Text>
                      {manager.teamName && (
                        <Text style={[styles.managerDetails, { color: theme.colors.textSecondary }]}>
                          {manager.teamName}
                        </Text>
                      )}
                      {(manager.nationality || manager.age || manager.role) && (
                        <Text style={[styles.managerDetails, { color: theme.colors.textSecondary }]}>
                          {[
                            manager.nationality,
                            manager.age ? `${manager.age} years old` : null,
                            manager.role,
                          ]
                            .filter(Boolean)
                            .join(" / ")}
                        </Text>
                      )}
                    </View>
                    <ChevronRight size={20} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: theme.colors.text }]}>No managers found</Text>
                <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>
                  Try searching with a different name
                </Text>
              </View>
            )}
            </ScrollView>
          </View>
        </>
      )}

      {activeTab === "news" && (
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.colors.primary} />
          }
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
                Searching news from multiple sources...
              </Text>
            </View>
          ) : news.length > 0 ? (
            <View style={styles.newsListContainer}>
              <View style={styles.newsList}>
                {news.map((article) => (
                <TouchableOpacity
                  key={article.id}
                  style={[styles.newsItem, { borderBottomColor: theme.colors.border }]}
                  onPress={() => {
                    router.push({
                      pathname: "/news/news-detail",
                      params: { data: JSON.stringify(article) },
                    });
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.newsContent}>
                    <View style={styles.newsTextContent}>
                      <Text style={[styles.newsTitle, { color: theme.colors.text }]} numberOfLines={2}>
                        {highlightText(article.title, searchInput)}
                      </Text>
                      {article.description && (
                        <Text
                          style={[styles.newsDescription, { color: theme.colors.textSecondary }]}
                          numberOfLines={2}
                        >
                          {article.description}
                        </Text>
                      )}
                      <View style={styles.newsInfo}>
                        <Text style={[styles.newsSource, { color: theme.colors.primary }]}>
                          {article.source.name}
                        </Text>
                        <View style={styles.newsTime}>
                          <Clock size={12} color={theme.colors.textSecondary} />
                          <Text style={[styles.timeText, { color: theme.colors.textSecondary }]}>
                            {formatTimeAgo(article.publishedAt)}
                          </Text>
                        </View>
                      </View>
                    </View>
                    {article.urlToImage && (
                      <Image source={{ uri: article.urlToImage }} style={styles.newsThumbnail} />
                    )}
                  </View>
                </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: theme.colors.text }]}>No news found</Text>
              <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>
                Try searching with different keywords or check your spelling
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    paddingHorizontal: 12,
    height: 36,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter-Regular",
    padding: 0,
    height: "100%",
  },
  clearButton: {
    padding: 4,
  },
  cancelButton: {
    marginLeft: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  cancelText: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
  },
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    position: "relative",
  },
  activeTab: {
    // Active tab styling handled by text color
  },
  tabText: {
    fontSize: 14,
    fontFamily: "Inter-SemiBold",
  },
  tabIndicator: {
    position: "absolute",
    bottom: 0,
    alignSelf: "center",
    width: 20,
    height: 3,
    borderRadius: 1.5,
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Inter-SemiBold",
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  viewAllText: {
    fontSize: 14,
    fontFamily: "Inter-Medium",
  },
  horizontalScrollContent: {
    paddingRight: 16,
  },
  playerCard: {
    width: 100,
    marginRight: 12,
    alignItems: "center",
  },
  playerAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  playerImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  playerInitial: {
    fontSize: 24,
    fontFamily: "Inter-Bold",
  },
  playerName: {
    fontSize: 12,
    fontFamily: "Inter-Medium",
    textAlign: "center",
    marginBottom: 4,
  },
  playerTeam: {
    fontSize: 10,
    fontFamily: "Inter-Regular",
    textAlign: "center",
  },
  newsListContainer: {
    paddingHorizontal: 16,
  },
  newsList: {
    marginTop: 8,
  },
  newsItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  newsContent: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  newsTextContent: {
    flex: 1,
    marginRight: 12,
  },
  newsTitle: {
    fontSize: 15,
    fontFamily: "Inter-Medium",
    lineHeight: 20,
    marginBottom: 8,
  },
  newsInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  newsSource: {
    fontSize: 12,
    fontFamily: "Inter-Medium",
  },
  newsTime: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  timeText: {
    fontSize: 12,
    fontFamily: "Inter-Regular",
  },
  newsThumbnail: {
    width: 80,
    height: 60,
    borderRadius: 8,
  },
  loadingContainer: {
    paddingVertical: 20,
    alignItems: "center",
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: "center",
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: "Inter-Medium",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
    textAlign: "center",
  },
  loadingText: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
    marginTop: 12,
  },
  sportGroupContainer: {
    flex: 1,
    paddingTop: 0,
    paddingBottom: 0,
  },
  sportFilterContainer: {
    flexDirection: "row",
    paddingHorizontal: 0,
    paddingTop: 4,
    paddingBottom: 0,
    backgroundColor: 'transparent',
  },
  sportFilterTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    marginHorizontal: 1,
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
  scrollView: {
    flex: 1,
  },
  sportFilterText: {
    fontSize: 14,
    fontFamily: "Inter-SemiBold",
  },
  playerList: {
    paddingHorizontal: 16,
  },
  playerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  playerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  playerDetails: {
    fontSize: 12,
    fontFamily: "Inter-Regular",
    marginTop: 4,
  },
  managerList: {
    paddingHorizontal: 16,
  },
  managerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  managerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  managerImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  managerInitial: {
    fontSize: 20,
    fontFamily: "Inter-Bold",
  },
  managerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  managerName: {
    fontSize: 15,
    fontFamily: "Inter-SemiBold",
  },
  managerDetails: {
    fontSize: 12,
    fontFamily: "Inter-Regular",
    marginTop: 4,
  },
  newsDescription: {
    fontSize: 13,
    fontFamily: "Inter-Regular",
    lineHeight: 18,
    marginBottom: 8,
  },
});
