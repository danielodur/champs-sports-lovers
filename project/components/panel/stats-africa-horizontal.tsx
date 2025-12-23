import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  LayoutChangeEvent,
  Dimensions,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useTheme } from "../../hooks/useTheme";
import { EnhancedCompetition } from "../../data/leagues";
import leagueLogoService from "../../services/leagueLogoService";
import { useLeaguesByCountry } from "../../hooks/useLeaguesByRegion";
import { getLeagueNavigationFromApi } from "../../utils/leagueSlugGenerator";
import { sortLeaguesByCountryRank } from "../../utils/leagueRanking";
import { LeagueData } from "../../services/leaguesByRegionService";

interface StatsAfricaHorizontalProps {
  competitionsList: EnhancedCompetition[];
  handleCompetitionPress: (competition: EnhancedCompetition) => void;
  getCompetitionLogo: (competition: EnhancedCompetition) => string;
  selectedCountry?: string;
  sport?: string;
}

// All data is now API-driven via useLeaguesByCountry hook - no hardcoded lists

export default function StatsAfricaHorizontal({
  competitionsList,
  handleCompetitionPress,
  getCompetitionLogo,
  selectedCountry,
  sport = "football",
}: StatsAfricaHorizontalProps) {
  const theme = useTheme();
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const { leaguesByCountry, loading, error } = useLeaguesByCountry("Africa", sport);
  const [sectionPositions, setSectionPositions] = useState<
    Record<string, number>
  >({});
  const [layoutReady, setLayoutReady] = useState(false);

  // ✅ CRITICAL: Debug logging when data changes (same as Asia)
  useEffect(() => {
    console.log(`📊 [StatsAfrica] Data update - loading: ${loading}, error: ${error || 'none'}`);
    console.log(`📊 [StatsAfrica] leaguesByCountry keys:`, Object.keys(leaguesByCountry));
    console.log(`📊 [StatsAfrica] Total countries: ${Object.keys(leaguesByCountry).length}`);
    console.log(`📊 [StatsAfrica] Selected country: "${selectedCountry}"`);
    
    if (selectedCountry && selectedCountry !== "Africa") {
      const countryData = leaguesByCountry[selectedCountry];
      console.log(`📊 [StatsAfrica] Direct lookup for "${selectedCountry}":`, countryData ? `${countryData.length} leagues` : 'NOT FOUND');
      
      // Check for similar names
      const similarNames = Object.keys(leaguesByCountry).filter(key => 
        key.toLowerCase().includes(selectedCountry.toLowerCase()) || 
        selectedCountry.toLowerCase().includes(key.toLowerCase())
      );
      if (similarNames.length > 0) {
        console.log(`📊 [StatsAfrica] Similar country names found:`, similarNames.join(', '));
      }
    }
  }, [leaguesByCountry, loading, error, selectedCountry]);

  const getDisplayName = (name: string): string => {
    if (name.length > 20) {
      const words = name.split(" ");
      if (words.length > 2) {
        const firstLine = words.slice(0, Math.ceil(words.length / 2)).join(" ");
        const secondLine = words.slice(Math.ceil(words.length / 2)).join(" ");
        if (secondLine.length > 15) {
          return firstLine + "\n" + secondLine.substring(0, 12) + "...";
        }
        return firstLine + "\n" + secondLine;
      }
      return name.length > 25 ? name.substring(0, 22) + "..." : name;
    }
    return name;
  };

  // ✅ Filter leagues by selected country with improved matching (same logic as Asia)
  const filteredLeaguesByCountry = React.useMemo(() => {
    // ✅ CRITICAL: Log initial state for debugging
    console.log(`🔍 [StatsAfrica] Filtering leagues - selectedCountry: "${selectedCountry}", loading: ${loading}, error: ${error}`);
    console.log(`🔍 [StatsAfrica] leaguesByCountry keys:`, Object.keys(leaguesByCountry).join(', '));
    console.log(`🔍 [StatsAfrica] Total countries in data: ${Object.keys(leaguesByCountry).length}`);
    
    // ✅ CRITICAL: If still loading or error, return empty to show loading/error state
    if (loading) {
      console.log(`⏳ [StatsAfrica] Still loading leagues...`);
      return {};
    }
    
    if (error) {
      console.error(`❌ [StatsAfrica] Error loading leagues:`, error);
      return {};
    }
    
    // ✅ CRITICAL: If no data yet, return empty
    if (!leaguesByCountry || Object.keys(leaguesByCountry).length === 0) {
      console.warn(`⚠️ [StatsAfrica] No leagues data available yet`);
      return {};
    }
    
    let filtered: Record<string, LeagueData[]> = {};
    
    if (!selectedCountry || selectedCountry === "Africa") {
      // Show all countries when region is selected
      filtered = leaguesByCountry;
      console.log(`✅ [StatsAfrica] Showing all countries: ${Object.keys(filtered).length} countries`);
    } else {
      // ✅ CRITICAL: Try exact match first
      if (leaguesByCountry[selectedCountry]) {
        console.log(`✅ [StatsAfrica] Found exact match for "${selectedCountry}": ${leaguesByCountry[selectedCountry].length} leagues`);
        filtered = { [selectedCountry]: leaguesByCountry[selectedCountry] };
      } else {
        // ✅ CRITICAL: Try case-insensitive match
        const matchingKey = Object.keys(leaguesByCountry).find(
          key => key.toLowerCase() === selectedCountry.toLowerCase()
        );
        if (matchingKey) {
          console.log(`✅ [StatsAfrica] Found case-insensitive match: "${selectedCountry}" -> "${matchingKey}": ${leaguesByCountry[matchingKey].length} leagues`);
          filtered = { [matchingKey]: leaguesByCountry[matchingKey] };
        } else {
          // ✅ CRITICAL: Try partial match
          const partialMatch = Object.keys(leaguesByCountry).find(
            key => key.toLowerCase().startsWith(selectedCountry.toLowerCase()) ||
                   selectedCountry.toLowerCase().startsWith(key.toLowerCase())
          );
          if (partialMatch) {
            console.log(`✅ [StatsAfrica] Found partial match: "${selectedCountry}" -> "${partialMatch}": ${leaguesByCountry[partialMatch].length} leagues`);
            filtered = { [partialMatch]: leaguesByCountry[partialMatch] };
          } else {
            // ✅ Log all available country keys for debugging
            console.warn(`⚠️ [StatsAfrica] No match found for "${selectedCountry}"`);
            console.warn(`   Available countries:`, Object.keys(leaguesByCountry).slice(0, 5).join(', '));
            console.warn(`   Total countries with leagues: ${Object.keys(leaguesByCountry).length}`);
            filtered = {};
          }
        }
      }
    }
    
    // ✅ CRITICAL: Ensure leagues are sorted by official rank within each country
    const sorted = sortLeaguesByCountryRank(filtered);
    console.log(`✅ [StatsAfrica] Filtered and sorted: ${Object.keys(sorted).length} countries, ${Object.values(sorted).flat().length} total leagues`);
    return sorted;
  }, [leaguesByCountry, selectedCountry, loading, error]);

  // Auto-scroll effect when country is selected
  useEffect(() => {
    if (!layoutReady || !selectedCountry || !scrollViewRef.current) return;

    if (
      selectedCountry !== "Africa" &&
      Object.keys(leaguesByCountry).includes(selectedCountry)
    ) {
      const position = sectionPositions[selectedCountry];
      if (position !== undefined) {
        const finalPosition = Math.max(0, position - 20);
        scrollViewRef.current.scrollTo({
          y: finalPosition,
          animated: true,
        });
      }
    } else {
      // Scroll to top for region selection or other cases
      scrollViewRef.current.scrollTo({
        y: 0,
        animated: true,
      });
    }
  }, [selectedCountry, sectionPositions, layoutReady, leaguesByCountry]);

  const handleSectionLayout = (
    countryName: string,
    event: LayoutChangeEvent,
  ) => {
    const { y } = event.nativeEvent.layout;
    setSectionPositions((prev) => {
      // Only update if position actually changed
      if (prev[countryName] === y) return prev;

      const newPositions = {
        ...prev,
        [countryName]: y,
      };

      // Mark layout as ready when we have positions for most countries
      if (
        !layoutReady &&
        Object.keys(newPositions).length >= Object.keys(filteredLeaguesByCountry).length * 0.8
      ) {
        setLayoutReady(true);
      }

      return newPositions;
    });
  };

  // Loading state (same as Asia)
  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Loading leagues...
          </Text>
          {__DEV__ && (
            <Text style={[styles.loadingText, { color: theme.colors.textSecondary, marginTop: 8, fontSize: 12 }]}>
              Region: Africa, Sport: {sport}, Selected: {selectedCountry || 'None'}
            </Text>
          )}
        </View>
      </View>
    );
  }

  // Error state (same as Asia)
  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.colors.textSecondary }]}>
            {error}
          </Text>
          {__DEV__ && (
            <Text style={[styles.errorText, { color: theme.colors.textSecondary, marginTop: 8, fontSize: 12 }]}>
              Region: Africa, Sport: {sport}, Selected: {selectedCountry || 'None'}
            </Text>
          )}
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor:
            theme.colors.backgroundSecondary === "#F5F5F5"
              ? theme.colors.background // White in light mode
              : "#2A2A2A", // Dull grey in dark mode
        },
      ]}
    >
      {/* African Leagues Section */}
      <View style={styles.sectionContainer}>
        <ScrollView
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContainer,
            { paddingBottom: 50, minHeight: 1000 },
            Object.keys(leaguesByCountry).length === 0 && { flex: 1, justifyContent: "center", minHeight: undefined }
          ]}
        >
          {Object.keys(filteredLeaguesByCountry).length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                {selectedCountry && selectedCountry !== "Africa" 
                  ? `No leagues available for ${selectedCountry}`
                  : "No leagues available"}
              </Text>
              {/* ✅ Enhanced debug info (same as Asia) */}
              {__DEV__ && (
                <>
                  <Text style={[styles.emptyText, { color: theme.colors.textSecondary, marginTop: 8, fontSize: 12 }]}>
                    Selected: "{selectedCountry}"
                  </Text>
                  <Text style={[styles.emptyText, { color: theme.colors.textSecondary, marginTop: 4, fontSize: 12 }]}>
                    Available countries ({Object.keys(leaguesByCountry).length}): {Object.keys(leaguesByCountry).slice(0, 10).join(', ')}
                  </Text>
                  <Text style={[styles.emptyText, { color: theme.colors.textSecondary, marginTop: 4, fontSize: 12 }]}>
                    Loading: {loading ? 'Yes' : 'No'}, Error: {error || 'None'}
                  </Text>
                </>
              )}
            </View>
          ) : (
            Object.entries(filteredLeaguesByCountry).map(([countryName, leagues]) => {
              return (
                <View
                  key={countryName}
                  style={styles.countrySection}
                  onLayout={(event) => handleSectionLayout(countryName, event)}
                >
                  <Text
                    style={[
                      styles.countryHeader,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    {countryName}
                  </Text>
                  <View style={styles.leaguesGrid}>
                    {leagues.length === 0 ? (
                      <View style={styles.emptyLeaguesContainer}>
                        <Text style={[styles.emptyLeaguesText, { color: theme.colors.textSecondary }]}>
                          No leagues available for {countryName}
                        </Text>
                      </View>
                    ) : (
                      leagues.map((league) => {
                        // Use official logo from API, with fallback
                        const logoUrl = league.logo || "https://media.api-sports.io/football/leagues/1.png";

                      return (
                        <TouchableOpacity
                          key={`${countryName}-${league.id}`}
                          style={styles.leagueItem}
                          onPress={() => {
                            // Haptic feedback for smooth UX
                            if (Platform.OS === "ios") {
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            }
                            // Navigate using API data - smooth and seamless
                            try {
                              const navParams = getLeagueNavigationFromApi(league, sport); // ✅ Pass sport parameter
                              router.push(navParams);
                            } catch (error) {
                              console.error("Navigation error:", error);
                            }
                          }}
                          activeOpacity={0.7}
                        >
                          <Image
                            source={{ uri: logoUrl }}
                            style={styles.leagueLogo}
                            resizeMode="contain"
                            // ✅ CRITICAL: Remove any tint that might cause white wash
                            tintColor={undefined}
                            onError={() => {
                              console.log("Logo failed to load for:", league.name);
                            }}
                          />
                          {/* ✅ CRITICAL: Display raw API league name - no hardcoded names */}
                          <Text
                            style={[
                              styles.leagueName,
                              { color: theme.colors.text },
                            ]}
                            numberOfLines={2}
                            ellipsizeMode="tail"
                          >
                            {getDisplayName(league.name)}
                          </Text>
                        </TouchableOpacity>
                      );
                    })
                    )}
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    marginTop: 8,
    paddingLeft: 4,
  },
  scrollContainer: {
    paddingTop: 0, // No padding for perfect alignment
    paddingBottom: 24,
    flexGrow: 1,
  },
  countrySection: {
    marginBottom: 32,
  },
  countryHeader: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    marginTop: 0, // No top margin for perfect alignment
    paddingTop: 8, // Use padding instead of margin for better control
    paddingLeft: 12, // Aligned padding for visual consistency
    lineHeight: 20, // Optimized for alignment with vertical section
    minHeight: 44, // Match vertical section item height exactly
  },
  leaguesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  leagueItem: {
    width: "48%",
    marginBottom: 16,
    padding: 16,
    alignItems: "center",
    minHeight: 100,
  },
  leagueLogo: {
    width: 36,
    height: 36,
    marginBottom: 10,
    // ✅ CRITICAL: Ensure logo maintains original colors - no white wash
    tintColor: undefined, // Remove any tint
  },
  leagueName: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 16,
    fontWeight: "600",
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
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  errorText: {
    fontSize: 14,
    textAlign: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 400,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
  },
  emptyLeaguesContainer: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 100,
  },
  emptyLeaguesText: {
    fontSize: 14,
    textAlign: "center",
    fontStyle: "italic",
  },
});
