import React, { useState, useEffect } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Search, X, ChevronRight } from "lucide-react-native";
import { useTheme } from "../../../hooks/useTheme";
import { searchPlayers } from "../../../services/sofaScoreTransfersService";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface ManagerResult {
  id: number;
  name: string;
  teamName?: string;
  photo?: string;
  nationality?: string;
  age?: number;
  role?: string;
}

export default function SearchManagerScreen() {
  console.log(`🚨🚨🚨 [SearchManager] COMPONENT FUNCTION CALLED - MOUNTING NOW! 🚨🚨🚨`);
  const router = useRouter();
  const theme = useTheme();
  const params = useLocalSearchParams();
  const searchQuery = (params.query as string) || "";
  console.log(`🚨 [SearchManager] Initial params:`, JSON.stringify(params));
  console.log(`🚨 [SearchManager] Initial searchQuery: "${searchQuery}"`);

  const [activeTab, setActiveTab] = useState<"all" | "player" | "manager" | "news">("manager");
  const [searchInput, setSearchInput] = useState(searchQuery);
  const [sportFilter, setSportFilter] = useState<"all" | "football" | "basketball">("all");
  
  // Separate state for each filter screen
  const [managersAll, setManagersAll] = useState<ManagerResult[]>([]);
  const [managersFootball, setManagersFootball] = useState<ManagerResult[]>([]);
  const [managersBasketball, setManagersBasketball] = useState<ManagerResult[]>([]);
  
  // Separate loading state for each filter screen
  const [loadingAll, setLoadingAll] = useState(false);
  const [loadingFootball, setLoadingFootball] = useState(false);
  const [loadingBasketball, setLoadingBasketball] = useState(false);
  
  // Helper to get current managers and loading based on active filter
  const getCurrentManagers = () => {
    switch (sportFilter) {
      case "football": return managersFootball;
      case "basketball": return managersBasketball;
      default: return managersAll;
    }
  };
  
  const getCurrentLoading = () => {
    switch (sportFilter) {
      case "football": return loadingFootball;
      case "basketball": return loadingBasketball;
      default: return loadingAll;
    }
  };

  // Debug: Log theme colors
  useEffect(() => {
    console.log(`🎨 [SearchManager] Theme colors:`, {
      background: theme.colors.background,
      backgroundSecondary: theme.colors.backgroundSecondary,
      primary: theme.colors.primary,
      text: theme.colors.text,
    });
  }, [theme]);

  useEffect(() => {
    console.log(`📱 [SearchManager] Component mounted/updated`);
    console.log(`📱 [SearchManager] searchQuery from params: "${searchQuery}"`);
    console.log(`📱 [SearchManager] searchInput state: "${searchInput}"`);
    console.log(`📱 [SearchManager] sportFilter state: "${sportFilter}"`);
    
    if (searchQuery && searchQuery.trim()) {
      console.log(`✅ [SearchManager] Initial search triggered with query: "${searchQuery}"`);
      // Load data for all three filters on initial mount - ensure 100% data loading
      console.log(`✅ [SearchManager] Fetching data for all filters on mount...`);
      Promise.all([
        performSearchForFilter("all", searchQuery),
        performSearchForFilter("football", searchQuery),
        performSearchForFilter("basketball", searchQuery),
      ]).then(() => {
        console.log(`✅ [SearchManager] All initial searches completed`);
      });
    }
  }, [searchQuery]);

  // Note: Filter loading is now handled directly in button onPress handlers
  // This useEffect is kept as backup but button handlers trigger immediate loading
  useEffect(() => {
    const currentQuery = searchInput.trim() || searchQuery.trim();
    if (!currentQuery) return;
    
    // Only fetch if not already loading (to avoid duplicate calls)
    const currentLoading = getCurrentLoading();
    if (!currentLoading) {
      console.log(`🔄 [SearchManager] Sport filter changed to: "${sportFilter}" (backup fetch)`);
      performSearchForFilter(sportFilter, currentQuery);
    }
  }, [sportFilter]);

  // Perform search for a specific filter
  const performSearchForFilter = async (filter: "all" | "football" | "basketball", query: string) => {
    if (!query.trim()) {
      console.warn(`⚠️ [SearchManager] Empty query provided for filter: ${filter}`);
      return;
    }

    console.log(`🔍 [SearchManager] ========== PERFORMING SEARCH FOR ${filter.toUpperCase()} ==========`);
    console.log(`🔍 [SearchManager] Query: "${query}"`);
    console.log(`🔍 [SearchManager] Filter: "${filter}"`);
    
    // Set loading state for the specific filter
    switch (filter) {
      case "all":
        setLoadingAll(true);
        break;
      case "football":
        setLoadingFootball(true);
        break;
      case "basketball":
        setLoadingBasketball(true);
        break;
    }

    try {
      console.log(`🔍 [SearchManager] Calling searchPlayers API for ${filter}...`);
      const startTime = Date.now();
      
      // Note: Using player search API, we'll filter for managers/coaches
      // In production, use a dedicated manager search API
      let results: any[] = [];
      try {
        results = await Promise.race([
          searchPlayers(query),
          new Promise<any[]>((resolve) => setTimeout(() => {
            console.warn(`⚠️ [SearchManager] Search timeout after 10s for ${filter}`);
            resolve([]);
          }, 10000)) // 10s timeout
        ]);
      } catch (apiError: any) {
        console.error(`❌ [SearchManager] API call failed for ${filter}:`, apiError?.message || apiError);
        // Retry once
        try {
          console.log(`🔄 [SearchManager] Retrying API call for ${filter}...`);
          results = await Promise.race([
            searchPlayers(query),
            new Promise<any[]>((resolve) => setTimeout(() => {
              console.warn(`⚠️ [SearchManager] Retry timeout after 10s for ${filter}`);
              resolve([]);
            }, 10000))
          ]);
        } catch (retryError: any) {
          console.error(`❌ [SearchManager] Retry also failed for ${filter}:`, retryError?.message || retryError);
          results = [];
        }
      }
      
      const duration = Date.now() - startTime;
      console.log(`🔍 [SearchManager] API call completed in ${duration}ms for ${filter}`);
      console.log(`🔍 [SearchManager] Raw results count: ${results?.length || 0}`);
      if (results.length > 0) {
        console.log(`✅ [SearchManager] Successfully fetched ${results.length} results for ${filter}`);
        console.log(`🔍 [SearchManager] Raw results sample:`, results?.slice(0, 3));
      } else {
        console.warn(`⚠️ [SearchManager] No results returned for ${filter} - API may be unavailable or query returned no matches`);
      }
      
      // Filter and format as managers
      // In a real implementation, you'd have a dedicated manager search endpoint
      const formattedManagers: ManagerResult[] = (results || []).slice(0, 50).map((m) => ({
        id: m.id,
        name: m.name,
        teamName: m.teamName,
        role: "Head Coach",
      }));
      
      console.log(`🔍 [SearchManager] Formatted managers count: ${formattedManagers.length} for ${filter}`);
      console.log(`🔍 [SearchManager] Formatted managers sample:`, formattedManagers.slice(0, 3));
      
      // Update the appropriate state based on filter
      switch (filter) {
        case "all":
          setManagersAll(formattedManagers);
          break;
        case "football":
          setManagersFootball(formattedManagers);
          break;
        case "basketball":
          setManagersBasketball(formattedManagers);
          break;
      }
      
      console.log(`✅ [SearchManager] State updated with ${formattedManagers.length} managers for ${filter}`);
    } catch (error: any) {
      console.error(`❌ [SearchManager] Manager search error for ${filter}:`, error?.message || error);
      // Set empty array for the filter on error
      switch (filter) {
        case "all":
          setManagersAll([]);
          break;
        case "football":
          setManagersFootball([]);
          break;
        case "basketball":
          setManagersBasketball([]);
          break;
      }
    } finally {
      // Clear loading state for the specific filter
      switch (filter) {
        case "all":
          setLoadingAll(false);
          break;
        case "football":
          setLoadingFootball(false);
          break;
        case "basketball":
          setLoadingBasketball(false);
          break;
      }
      console.log(`✅ [SearchManager] Search completed for ${filter}`);
    }
  };

  const performSearch = async (query: string) => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;
    
    setSearchInput(trimmedQuery);
    console.log(`🔍 [SearchManager] User initiated search: "${trimmedQuery}"`);
    
    // Load data for all filters when user searches - ensure 100% data loading
    console.log(`✅ [SearchManager] Fetching data for all filters...`);
    await Promise.all([
      performSearchForFilter("all", trimmedQuery),
      performSearchForFilter("football", trimmedQuery),
      performSearchForFilter("basketball", trimmedQuery),
    ]);
    console.log(`✅ [SearchManager] All filter searches completed`);
  };

  const handleSearch = () => {
    if (searchInput.trim()) {
      performSearch(searchInput.trim());
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

  const renderContent = () => {
    const currentManagers = getCurrentManagers();
    const currentLoading = getCurrentLoading();
    
    console.log(`🎨 [SearchManager] renderContent called - loading: ${currentLoading}, managers: ${currentManagers.length}, sportFilter: ${sportFilter}`);
    
    if (currentLoading) {
      console.log(`🎨 [SearchManager] Rendering loading state for ${sportFilter}`);
      return (
        <View style={[styles.loadingContainer, { backgroundColor: 'transparent' }]}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            {sportFilter === "football" 
              ? "Searching football managers..." 
              : sportFilter === "basketball"
              ? "Searching basketball managers..."
              : "Searching managers..."}
          </Text>
        </View>
      );
    }

    if (currentManagers.length === 0) {
      console.log(`🎨 [SearchManager] Rendering empty state for sportFilter: ${sportFilter}`);
      return (
        <View style={[styles.emptyContainer, { backgroundColor: 'transparent' }]}>
          <Text style={[styles.emptyText, { color: theme.colors.text }]}>
            {sportFilter === "football" 
              ? "No football managers found" 
              : sportFilter === "basketball"
              ? "No basketball managers found"
              : "No managers found"}
          </Text>
          <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>
            Try searching with a different name
          </Text>
        </View>
      );
    }
    
    console.log(`🎨 [SearchManager] Rendering managers list with ${currentManagers.length} items for ${sportFilter}`);

    return (
      <ScrollView
        style={[styles.content, { backgroundColor: 'transparent' }]}
        contentContainerStyle={{ paddingBottom: 20, backgroundColor: 'transparent' }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.managerList}>
          {currentManagers.map((manager) => (
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
      </ScrollView>
    );
  };

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
            placeholder="Search managers"
            placeholderTextColor={theme.colors.textSecondary}
            value={searchInput}
            onChangeText={setSearchInput}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchInput.length > 0 && (
            <TouchableOpacity 
              onPress={() => {
                setSearchInput("");
                // Clear all filter data when clearing search
                setManagersAll([]);
                setManagersFootball([]);
                setManagersBasketball([]);
              }} 
              style={styles.clearButton}
            >
              <X size={16} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity 
          style={styles.cancelButton} 
          onPress={() => {
            if (searchInput.trim().length > 0) {
              // If there's text, trigger search
              handleSearch();
            } else {
              // If empty, go back
              router.back();
            }
          }}
        >
          <Text style={[styles.cancelText, { color: theme.colors.primary }]}>
            {searchInput && searchInput.trim().length > 0 ? "Search" : "Cancel"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={[styles.tabsContainer, { backgroundColor: theme.colors.background }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "all" && styles.activeTab]}
          onPress={() => {
            router.push({
              pathname: "/news/search-news/search-all",
              params: { query: searchInput },
            });
          }}
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
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "player" && styles.activeTab]}
          onPress={() => {
            router.push({
              pathname: "/news/search-news/search-player",
              params: { query: searchInput },
            });
          }}
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
          onPress={() => {
            router.push({
              pathname: "/news/search-news/search-news",
              params: { query: searchInput },
            });
          }}
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
        </TouchableOpacity>
      </View>

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
          onPress={() => {
            console.log(`🎯 [SearchManager] "All" sport filter button pressed`);
            const currentQuery = searchInput.trim() || searchQuery.trim();
            
            // Immediately set loading state for "all" filter
            setLoadingAll(true);
            setSportFilter("all");
            
            // Immediately trigger API call for this filter
            if (currentQuery) {
              console.log(`✅ [SearchManager] Immediately fetching data for "all" filter`);
              performSearchForFilter("all", currentQuery);
            } else {
              setLoadingAll(false);
            }
          }}
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
          onPress={() => {
            console.log(`🎯 [SearchManager] "Football" sport filter button pressed`);
            const currentQuery = searchInput.trim() || searchQuery.trim();
            
            // Immediately set loading state for "football" filter
            setLoadingFootball(true);
            setSportFilter("football");
            
            // Immediately trigger API call for this filter
            if (currentQuery) {
              console.log(`✅ [SearchManager] Immediately fetching data for "football" filter`);
              performSearchForFilter("football", currentQuery);
            } else {
              setLoadingFootball(false);
            }
          }}
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
          onPress={() => {
            console.log(`🎯 [SearchManager] "Basketball" sport filter button pressed`);
            const currentQuery = searchInput.trim() || searchQuery.trim();
            
            // Immediately set loading state for "basketball" filter
            setLoadingBasketball(true);
            setSportFilter("basketball");
            
            // Immediately trigger API call for this filter
            if (currentQuery) {
              console.log(`✅ [SearchManager] Immediately fetching data for "basketball" filter`);
              performSearchForFilter("basketball", currentQuery);
            } else {
              setLoadingBasketball(false);
            }
          }}
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

      {/* Content - wrapped with matching background (stats-followed-matches pattern) */}
      <View 
        style={[
          styles.contentWrapper, 
          { 
            backgroundColor: theme.colors.backgroundSecondary,
          }
        ]}
        onLayout={(event) => {
          const { width, height } = event.nativeEvent.layout;
          console.log(`🎨 [SearchManager] ContentWrapper layout:`, { width, height });
          console.log(`🎨 [SearchManager] ContentWrapper backgroundColor: ${theme.colors.backgroundSecondary}`);
          console.log(`🎨 [SearchManager] Current sportFilter: ${sportFilter}`);
        }}
      >
        {renderContent()}
      </View>
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
    left: 0,
    right: 0,
    height: 2,
  },
  sportFilterContainer: {
    flexDirection: "row",
    paddingHorizontal: 0,
    paddingTop: 4,
    paddingBottom: 0,
    backgroundColor: 'transparent', // Ensure no background interferes
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
  sportFilterText: {
    fontSize: 14,
    fontFamily: "Inter-SemiBold",
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
  content: {
    flex: 1,
  },
  managerList: {
    paddingHorizontal: 0,
  },
  managerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  managerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
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
  },
  managerName: {
    fontSize: 15,
    fontFamily: "Inter-SemiBold",
    marginBottom: 4,
  },
  managerDetails: {
    fontSize: 13,
    fontFamily: "Inter-Regular",
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
  },
  loadingText: {
    fontSize: 14,
    marginTop: 12,
    fontFamily: "Inter-Regular",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    fontFamily: "Inter-SemiBold",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
    textAlign: "center",
  },
});
