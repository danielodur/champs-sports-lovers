import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
  StatusBar,
  PanResponder,
  LayoutChangeEvent,
  Platform,
  ActivityIndicator,
} from "react-native";
import { ChevronDown } from "lucide-react-native";
import { useTheme } from "../../hooks/useTheme";
import { EnhancedCompetition } from "../../data/leagues";
import { useCountriesByRegion, useLeaguesByCountryFilter } from "../../hooks/useCountriesByRegion";
import { useRouter } from "expo-router";
import { getLeagueNavigationFromApi } from "../../utils/leagueSlugGenerator";
import leagueLogoService from "../../services/leagueLogoService";
import SmartVerticalDetector from "./stats-vertical-smart-detector";
import StatsIntlHorizontal from "./stats-intl-horizontal";
import StatsAfricaHorizontal from "./stats-africa-horizontal";
import StatsEuropeHorizontal from "./stats-europe-horizontal";
import StatsAmericaHorizontal from "./stats-america-horizontal";
import StatsOceaniaHorizontal from "./stats-oceania-horizontal";
import StatsAsiaHorizontal from "./stats-asia-horizontal";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");
const STATUS_BAR_HEIGHT =
  Platform.OS === "android" ? StatusBar.currentHeight || 0 : 0;
const HEADER_HEIGHT = 140; // Height including sports + filter tabs section
const FILTER_TAB_HEIGHT = 60; // Height of just the filter tab
const STATS_EVENTS_TAB_HEIGHT = 260; // Height of stats-events-tab section (nav + buttons + content)
const BOTTOM_TAB_HEIGHT = Platform.OS === "ios" ? 75 : 60; // Height of bottom tab bar
const START_POSITION =
  HEADER_HEIGHT +
  FILTER_TAB_HEIGHT -
  10 -
  (Platform.OS === "android" ? STATUS_BAR_HEIGHT + 10 : 0); // Position just below filter tabs without covering indicators
const EXPANDED_HEIGHT = SCREEN_HEIGHT - START_POSITION - BOTTOM_TAB_HEIGHT; // Coverage below filter tab
const PARTIAL_VISIBLE_HEIGHT = 380; // Reduced height to account for stats-events-tab
const COLLAPSED_POSITION =
  HEADER_HEIGHT +
  FILTER_TAB_HEIGHT +
  STATS_EVENTS_TAB_HEIGHT +
  (Platform.OS === "ios" ? 8 : -4); // iOS: 8px spacing, Android: -4px spacing (moves up)
const ANIMATION_DURATION = 250;

interface StatsCollapseAndRevealProps {
  competitionsList: EnhancedCompetition[];
  handleCompetitionPress: (competition: EnhancedCompetition) => void;
  getCompetitionLogo: (competition: EnhancedCompetition) => string;
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
  sport?: string; // Add sport parameter to filter data by sport type
}

export default function StatsCollapseAndReveal({
  competitionsList,
  handleCompetitionPress,
  getCompetitionLogo,
  isExpanded,
  setIsExpanded,
  sport = "football", // Default to football
}: StatsCollapseAndRevealProps) {
  const theme = useTheme();
  const router = useRouter();
  const translateY = useRef(new Animated.Value(COLLAPSED_POSITION)).current;
  const panY = useRef(0);
  const verticalScrollRef = useRef<ScrollView>(null);
  const horizontalScrollRef = useRef<ScrollView>(null);
  const mainContentScrollRef = useRef<ScrollView>(null);
  const [activeHorizontalTab, setActiveHorizontalTab] = useState("Top");
  const [activeVerticalTab, setActiveVerticalTab] = useState("Top");
  const [verticalItemPositions, setVerticalItemPositions] = useState<
    Record<string, number>
  >({});
  const [horizontalTabPositions, setHorizontalTabPositions] = useState<
    Record<string, number>
  >({});
  const [isScrolling, setIsScrolling] = useState(false);
  const [isManualScrolling, setIsManualScrolling] = useState(false);
  const [currentScrollPosition, setCurrentScrollPosition] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [scrollViewHeight, setScrollViewHeight] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Fetch countries from API based on active horizontal tab and sport (100% API-driven)
  const { countries: apiCountries, loading: countriesLoading } = useCountriesByRegion(
    activeHorizontalTab as "Hot" | "Top" | "Int'l" | "Africa" | "Europe" | "America" | "Oceania" | "Asia",
    sport
  );

  // Debug logging for countries
  useEffect(() => {
    console.log(`📍 [CollapseReveal] Horizontal Tab: ${activeHorizontalTab}, Sport: ${sport}`);
    console.log(`📍 [CollapseReveal] Countries Loading: ${countriesLoading}`);
    console.log(`📍 [CollapseReveal] API Countries (${apiCountries.length}):`, apiCountries.map(c => c.label).join(', '));
  }, [activeHorizontalTab, sport, countriesLoading, apiCountries]);

  // Fetch leagues filtered by selected country from API (100% API-driven)
  const { leagues: filteredLeagues, loading: leaguesLoading } = useLeaguesByCountryFilter(
    activeHorizontalTab as "Hot" | "Top" | "Int'l" | "Africa" | "Europe" | "America" | "Oceania" | "Asia",
    activeVerticalTab,
    sport
  );

  useEffect(() => {
    const toValue = isExpanded ? START_POSITION : COLLAPSED_POSITION;
    Animated.spring(translateY, {
      toValue,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();
  }, [isExpanded]);

  const handlePanResponder = PanResponder.create({
    onStartShouldSetPanResponder: (evt, gestureState) => {
      // Only respond to touches on the handle area (top 60px of screen)
      return evt.nativeEvent.locationY <= 60;
    },
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      // Only allow dragging if touch started on handle and vertical movement > 10px
      return evt.nativeEvent.locationY <= 60 && Math.abs(gestureState.dy) > 10;
    },
    onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: () => {
      panY.current = isExpanded ? START_POSITION : COLLAPSED_POSITION;
    },
    onPanResponderMove: (evt, gestureState) => {
      const newValue = panY.current + gestureState.dy;

      // Constrain movement between START_POSITION and COLLAPSED_POSITION
      if (newValue >= START_POSITION && newValue <= COLLAPSED_POSITION) {
        translateY.setValue(newValue);
      } else if (newValue < START_POSITION) {
        translateY.setValue(START_POSITION);
      } else {
        translateY.setValue(COLLAPSED_POSITION);
      }
    },
    onPanResponderRelease: (evt, gestureState) => {
      const { dy, vy } = gestureState;
      const finalPosition = panY.current + dy;

      // Determine if should expand or collapse
      const threshold = (START_POSITION + COLLAPSED_POSITION) / 2;
      const shouldExpand = finalPosition < threshold || vy < -800;

      // Animate to final position
      const targetPosition = shouldExpand ? START_POSITION : COLLAPSED_POSITION;

      Animated.spring(translateY, {
        toValue: targetPosition,
        useNativeDriver: true,
        tension: 80,
        friction: 10,
      }).start();

      // Update state if changed
      if (shouldExpand !== isExpanded) {
        setIsExpanded(shouldExpand);
      }
    },
  });

  // Define horizontal tabs (syncs with vertical categories)
  const horizontalTabs = useMemo(
    () => [
      { id: "Top", label: "Top" },
      { id: "Int'l", label: "Int'l" },
      { id: "Africa", label: "Africa" },
      { id: "Europe", label: "Europe" },
      { id: "America", label: "America" },
      { id: "Oceania", label: "Oceania" },
      { id: "Asia", label: "Asia" },
    ],
    [],
  );

  // Use API-driven countries instead of hardcoded lists
  const verticalCategories = useMemo(() => {
    // Convert API countries to the format expected by the component
    const categories = apiCountries.map(country => ({
      id: country.id,
      label: country.label,
    }));
    console.log(`📊 [CollapseReveal] Vertical Categories (${categories.length}):`, categories.map(c => c.label).join(', '));
    return categories;
  }, [apiCountries]);

  // Ensure activeVerticalTab is always valid for current horizontal selection
  // Auto-scroll to first country when horizontal tab changes
  useEffect(() => {
    if (!countriesLoading && verticalCategories.length > 0) {
      const validIds = verticalCategories.map((cat) => cat.id);

      // If current vertical tab is not valid for the horizontal selection, reset to first available
      if (!validIds.includes(activeVerticalTab)) {
        const defaultTab = verticalCategories[0].id;
        setActiveVerticalTab(defaultTab);
        
        // Smart auto-scroll: Scroll to top of vertical sidebar
        setTimeout(() => {
          verticalScrollRef.current?.scrollTo({ y: 0, animated: true });
        }, 100);
      }
    }
  }, [activeHorizontalTab, activeVerticalTab, verticalCategories, countriesLoading]);

  // Smooth automatic scrolling for seamless country transitions
  const handleSeamlessScroll = useCallback(
    (event: any) => {
      const { contentOffset, contentSize, layoutMeasurement } =
        event.nativeEvent;
      const scrollY = contentOffset.y;
      const scrollHeight = contentSize.height;
      const viewHeight = layoutMeasurement.height;

      setCurrentScrollPosition(scrollY);
      setContentHeight(scrollHeight);
      setScrollViewHeight(viewHeight);

      // Auto-advance when reaching bottom
      const isNearBottom = scrollY + viewHeight >= scrollHeight - 100;

      if (isNearBottom && !isScrolling && scrollHeight > viewHeight) {
        setIsScrolling(true);

        const currentCategories = verticalCategories;
        const currentIndex = currentCategories.findIndex(
          (cat) => cat.id === activeVerticalTab,
        );

        if (currentIndex < currentCategories.length - 1) {
          const nextTab = currentCategories[currentIndex + 1];

          setTimeout(() => {
            setActiveVerticalTab(nextTab.id);
            setTimeout(() => {
              mainContentScrollRef.current?.scrollTo({ y: 0, animated: true });
              setIsScrolling(false);
            }, 300);
          }, 200);
        } else {
          const horizontalTabs = [
            "Top",
            "Int'l",
            "Africa",
            "Europe",
            "America",
            "Oceania",
            "Asia",
          ];
          const currentHorizontalIndex = horizontalTabs.findIndex(
            (tab) => tab === activeHorizontalTab,
          );

          if (currentHorizontalIndex < horizontalTabs.length - 1) {
            const nextHorizontalTab =
              horizontalTabs[currentHorizontalIndex + 1];
            const nextVerticalTab =
              nextHorizontalTab === "Top" ? "Hot" : nextHorizontalTab;

            setTimeout(() => {
              setActiveHorizontalTab(nextHorizontalTab);
              setActiveVerticalTab(nextVerticalTab);
              setTimeout(() => {
                mainContentScrollRef.current?.scrollTo({
                  y: 0,
                  animated: true,
                });
                setIsScrolling(false);
              }, 300);
            }, 200);
          } else {
            setIsScrolling(false);
          }
        }
      }
    },
    [activeVerticalTab, activeHorizontalTab, verticalCategories, isScrolling],
  );

  // Enhanced horizontal swipe gesture handling with smooth center transitions
  const horizontalPanResponder = PanResponder.create({
    onStartShouldSetPanResponder: (evt, gestureState) => {
      return (
        Math.abs(gestureState.dx) > Math.abs(gestureState.dy) &&
        Math.abs(gestureState.dx) > 10 &&
        !isTransitioning
      );
    },
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      return (
        Math.abs(gestureState.dx) > Math.abs(gestureState.dy) &&
        Math.abs(gestureState.dx) > 10 &&
        !isTransitioning
      );
    },
    onPanResponderTerminationRequest: () => false,
    onPanResponderRelease: (evt, gestureState) => {
      if (isTransitioning) return;

      const { dx } = gestureState;
      const horizontalTabs = [
        "Top",
        "Int'l",
        "Africa",
        "Europe",
        "America",
        "Oceania",
        "Asia",
      ];
      const currentIndex = horizontalTabs.findIndex(
        (tab) => tab === activeHorizontalTab,
      );

      if (Math.abs(dx) > 50) {
        setIsTransitioning(true);

        if (dx > 0 && currentIndex > 0) {
          // Swipe right - go to previous tab with smooth center update
          const prevTab = horizontalTabs[currentIndex - 1];
          const prevVerticalTab = prevTab === "Top" ? "Top" : prevTab;

          setTimeout(() => {
            setActiveHorizontalTab(prevTab);
            setActiveVerticalTab(prevVerticalTab);
            mainContentScrollRef.current?.scrollTo({ y: 0, animated: true });
            setTimeout(() => setIsTransitioning(false), 400);
          }, 100);
        } else if (dx < 0 && currentIndex < horizontalTabs.length - 1) {
          // Swipe left - go to next tab with smooth center update
          const nextTab = horizontalTabs[currentIndex + 1];
          const nextVerticalTab = nextTab === "Top" ? "Top" : nextTab;

          setTimeout(() => {
            setActiveHorizontalTab(nextTab);
            setActiveVerticalTab(nextVerticalTab);
            mainContentScrollRef.current?.scrollTo({ y: 0, animated: true });
            setTimeout(() => setIsTransitioning(false), 400);
          }, 100);
        } else {
          setIsTransitioning(false);
        }
      }
    },
  });

  // No longer needed - using API-driven data instead of hardcoded groups

  const handleHorizontalTabPress = useCallback(
    (tabId: string) => {
      if (activeHorizontalTab === tabId || isManualScrolling) return;

      // When horizontal tab changes, set vertical tab to the first available option
      // This will be updated by the useEffect that validates vertical tabs
      setActiveHorizontalTab(tabId);
      setActiveVerticalTab(tabId); // Set to same as horizontal initially

      // Immediate scroll to center the active tab
      if (!isManualScrolling) {
        const tabPosition = horizontalTabPositions[tabId];
        if (tabPosition !== undefined && horizontalScrollRef.current) {
          horizontalScrollRef.current.scrollTo({
            x: Math.max(0, tabPosition - 50),
            animated: true,
          });
        }
      }
    },
    [
      activeHorizontalTab,
      horizontalTabPositions,
      isManualScrolling,
    ],
  );

  const handleVerticalTabPress = useCallback(
    (tabId: string) => {
      if (activeVerticalTab === tabId) return;

      const regionTabs = new Set([
        "Top",
        "Hot",
        "Africa",
        "Int'l",
        "Europe",
        "America",
        "Oceania",
        "Asia",
      ]);

      // Batch state updates using React's automatic batching
      if (regionTabs.has(tabId)) {
        // Direct region/category selection
        setActiveVerticalTab(tabId);
        if (tabId === "Hot") {
          // Hot category should use Top horizontal tab
          setActiveHorizontalTab("Top");
        } else if (tabId !== "Top") {
          // Other regions should set horizontal to match
          setActiveHorizontalTab(tabId);
        }
      } else {
        // Country selection - just update vertical tab
        // Horizontal tab stays on the current region
        setActiveVerticalTab(tabId);
      }

      // Immediate scroll reset without delay for fast response
      requestAnimationFrame(() => {
        mainContentScrollRef.current?.scrollTo({ y: 0, animated: false });
      });
    },
    [activeVerticalTab],
  );

  const handleVerticalItemLayout = useCallback(
    (categoryId: string, event: LayoutChangeEvent) => {
      const { y } = event.nativeEvent.layout;
      // Only update if position changed to prevent excessive re-renders
      if (verticalItemPositions[categoryId] !== y) {
        verticalItemPositions[categoryId] = y;
      }
    },
    [verticalItemPositions],
  );

  const handleHorizontalTabLayout = useCallback(
    (tabId: string, event: LayoutChangeEvent) => {
      const { x } = event.nativeEvent.layout;
      // Only track positions, don't trigger re-renders
      horizontalTabPositions[tabId] = x;
    },
    [horizontalTabPositions],
  );

  // Use ORIGINAL component rendering with proper styling
  const renderLeagueContent = useMemo(() => {
    const props = {
      competitionsList,
      handleCompetitionPress,
      getCompetitionLogo,
      selectedCountry: activeVerticalTab,
      sport, // Pass sport parameter to child components
    };

    // For regional horizontal tabs, always show horizontal view (grouped by country)
    // CRITICAL: Include sport in key to force remount when sport changes
    if (activeHorizontalTab === "Africa") {
      return <StatsAfricaHorizontal key={`africa-horizontal-${sport}`} {...props} />;
    }
    if (activeHorizontalTab === "Europe") {
      return <StatsEuropeHorizontal key={`europe-horizontal-${sport}`} {...props} />;
    }
    if (activeHorizontalTab === "America") {
      return <StatsAmericaHorizontal key={`america-horizontal-${sport}`} {...props} />;
    }
    if (activeHorizontalTab === "Oceania") {
      return <StatsOceaniaHorizontal key={`oceania-horizontal-${sport}`} {...props} />;
    }
    if (activeHorizontalTab === "Asia") {
      return <StatsAsiaHorizontal key={`asia-horizontal-${sport}`} {...props} />;
    }
    if (activeHorizontalTab === "Int'l") {
      return <StatsIntlHorizontal key={`intl-horizontal-${sport}`} {...props} />;
    }

    // For Top and Hot tabs, use SmartVerticalDetector with intelligent country detection
    return (
      <SmartVerticalDetector
        key={`smart-detector-${sport}`}
        horizontalTab={activeHorizontalTab as "Hot" | "Top" | "Int'l" | "Africa" | "Europe" | "America" | "Oceania" | "Asia"}
        activeVerticalTab={activeVerticalTab}
        sport={sport}
      />
    );
  }, [
    activeHorizontalTab,
    activeVerticalTab,
    competitionsList,
    handleCompetitionPress,
    getCompetitionLogo,
    sport,
  ]);

  return (
    <>
      {/* Backdrop - only visible when expanded */}
      {isExpanded && (
        <Animated.View
          style={[
            styles.backdrop,
            {
              opacity: translateY.interpolate({
                inputRange: [START_POSITION, COLLAPSED_POSITION],
                outputRange: [0.4, 0],
                extrapolate: "clamp",
              }),
            },
          ]}
        >
          <TouchableOpacity
            style={styles.backdropTouchable}
            onPress={() => setIsExpanded(false)}
            activeOpacity={1}
          />
        </Animated.View>
      )}

      {/* Main container with drag functionality */}
      <Animated.View
        style={[
          styles.container,
          {
            backgroundColor: theme.colors.backgroundSecondary,
            transform: [{ translateY }],
          },
        ]}
      >
        {/* Top handle icon only (no long line) - draggable area */}
        <View
          style={[
            styles.handleContainer,
            {
              backgroundColor: theme.colors.backgroundSecondary,
            }, // Match container background
          ]}
          {...handlePanResponder.panHandlers}
        >
          <View
            style={[
              styles.handle,
              { backgroundColor: theme.colors.textSecondary },
            ]}
          />
        </View>

        {/* Horizontal Tabs Row */}
        <View
          style={[
            styles.horizontalTabsContainer,
            {
              backgroundColor: theme.colors.backgroundSecondary,
            },
          ]}
        >
          <ScrollView
            ref={horizontalScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            bounces={true}
            bouncesZoom={false}
            alwaysBounceHorizontal={true}
            decelerationRate="normal"
            scrollEventThrottle={8}
            style={styles.horizontalTabsScrollView}
            contentContainerStyle={styles.horizontalTabsContent}
            directionalLockEnabled={true}
            scrollEnabled={true}
            removeClippedSubviews={false}
            onScrollEndDrag={(event) => {
              const { contentOffset, contentSize, layoutMeasurement } =
                event.nativeEvent;
              const scrollX = contentOffset.x;
              const contentWidth = contentSize.width;
              const viewWidth = layoutMeasurement.width;

              // Auto-center the closest tab
              let closestTab = "";
              let minDistance = Infinity;

              Object.entries(horizontalTabPositions).forEach(
                ([tabId, position]) => {
                  const distance = Math.abs(scrollX + viewWidth / 2 - position);
                  if (distance < minDistance) {
                    minDistance = distance;
                    closestTab = tabId;
                  }
                },
              );

              if (closestTab && closestTab !== activeHorizontalTab) {
                setTimeout(() => {
                  setActiveHorizontalTab(closestTab);
                  setActiveVerticalTab(
                    closestTab === "Top" ? "Hot" : closestTab,
                  );
                }, 150);
              }
            }}
          >
            {horizontalTabs.map((tab) => (
              <HorizontalTabButton
                key={tab.id}
                tab={tab}
                isActive={activeHorizontalTab === tab.id}
                onPress={handleHorizontalTabPress}
                onLayout={handleHorizontalTabLayout}
                theme={theme}
              />
            ))}
          </ScrollView>
        </View>

        {/* Main Content Area with Sidebar and Leagues */}
        <View style={styles.mainContentContainer}>
          {/* Vertical Sidebar with seamless grey flow effect */}
          <View
            style={[
              styles.verticalSidebar,
              {
                backgroundColor: theme.colors.backgroundSecondary, // Light grey background for sidebar
              },
            ]}
          >
            <ScrollView
              ref={verticalScrollRef}
              showsVerticalScrollIndicator={false}
              scrollEventThrottle={16}
              contentContainerStyle={{
                paddingBottom: 50,
                paddingTop: 10,
                minHeight: 800,
              }}
              style={{
                flex: 1,
                ...Platform.select({
                  ios: {
                    backgroundColor: "transparent",
                  },
                  android: {},
                }),
              }}
              bounces={true}
              alwaysBounceVertical={true}
              scrollEnabled={true}
              keyboardShouldPersistTaps="handled"
              decelerationRate="normal"
              removeClippedSubviews={false}
              nestedScrollEnabled={Platform.OS === "android"}
              scrollsToTop={Platform.OS === "ios"}
            >
              {countriesLoading ? (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <ActivityIndicator size="small" color="#FF4757" />
                  <Text style={{ color: theme.colors.textSecondary, fontSize: 10, marginTop: 8 }}>Loading...</Text>
                </View>
              ) : verticalCategories.length === 0 ? (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <Text style={{ color: theme.colors.textSecondary, fontSize: 10, textAlign: 'center' }}>No countries found</Text>
                </View>
              ) : (
                verticalCategories.map((category) => (
                  <VerticalTabButton
                    key={category.id}
                    category={category}
                    isActive={activeVerticalTab === category.id}
                    onPress={handleVerticalTabPress}
                    onLayout={handleVerticalItemLayout}
                    theme={theme}
                  />
                ))
              )}
            </ScrollView>
          </View>

          {/* Enhanced Leagues Content with Country Display */}
          <View
            style={[
              styles.leaguesContainer,
              {
                backgroundColor:
                  theme.colors.backgroundSecondary === "#F5F5F5"
                    ? theme.colors.background // White in light mode
                    : "#2A2A2A", // Dull grey in dark mode
              },
            ]}
            {...horizontalPanResponder.panHandlers}
          >
            <ScrollView
              ref={mainContentScrollRef}
              showsVerticalScrollIndicator={false}
              scrollEventThrottle={16}
              onScroll={handleSeamlessScroll}
              bounces={true}
              alwaysBounceVertical={true}
              contentContainerStyle={{
                flexGrow: 1,
                paddingBottom: 50,
                minHeight: 1200,
              }}
              style={{
                flex: 1,
                backgroundColor: "transparent",
              }}
              key={`${activeHorizontalTab}-${activeVerticalTab}`}
            >
              {renderLeagueContent}
            </ScrollView>
          </View>
        </View>

        {/* Small red collapse button in bottom right corner */}
        <TouchableOpacity
          style={[
            styles.smallCollapseButton,
            { backgroundColor: theme.colors.primary },
          ]}
          onPress={() => setIsExpanded(false)}
          activeOpacity={0.8}
        >
          <ChevronDown size={14} color="#FFFFFF" />
        </TouchableOpacity>
      </Animated.View>
    </>
  );
}

// Memoized horizontal tab button component
const HorizontalTabButton = React.memo<{
  tab: { id: string; label: string };
  isActive: boolean;
  onPress: (id: string) => void;
  onLayout: (id: string, event: LayoutChangeEvent) => void;
  theme: any;
}>(({ tab, isActive, onPress, onLayout, theme }) => (
  <TouchableOpacity
    style={[
      styles.horizontalTab,
      {
        backgroundColor: isActive 
          ? "rgba(239, 83, 80, 0.15)" // Transparent red for active
          : "transparent", // Transparent for inactive
        borderColor: isActive ? "#EF5350" : theme.colors.border,
        borderWidth: 1,
      },
    ]}
    onPress={() => onPress(tab.id)}
    onLayout={(event) => onLayout(tab.id, event)}
    activeOpacity={0.7}
  >
    <Text
      style={[
        styles.horizontalTabText,
        {
          color: isActive ? "#EF5350" : theme.colors.textSecondary,
          fontWeight: isActive ? "700" : "500",
        },
      ]}
    >
      {tab.label}
    </Text>
  </TouchableOpacity>
));

// Memoized vertical tab button component
const VerticalTabButton = React.memo<{
  category: { id: string; label: string };
  isActive: boolean;
  onPress: (id: string) => void;
  onLayout: (id: string, event: LayoutChangeEvent) => void;
  theme: any;
}>(({ category, isActive, onPress, onLayout, theme }) => (
  <TouchableOpacity
    style={[
      styles.verticalSidebarItem,
      {
        backgroundColor: isActive
          ? theme.colors.backgroundSecondary === "#F5F5F5"
            ? theme.colors.background // White in light mode
            : "#2A2A2A" // Dull grey in dark mode
          : "transparent",
        marginRight: 0,
        paddingLeft: 6,
        paddingRight: 6,
        borderRadius: 0,
      },
    ]}
    onPress={() => onPress(category.id)}
    onLayout={(event) => onLayout(category.id, event)}
    activeOpacity={0.3}
  >
    <Text
      style={[
        styles.verticalSidebarText,
        {
          color: isActive ? "#FF3333" : theme.colors.textSecondary,
          fontWeight: isActive ? "900" : "600",
          opacity: isActive ? 1 : 0.75,
          fontSize: 11,
          textShadowColor: isActive ? "rgba(255, 51, 51, 0.3)" : "transparent",
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 2,
        },
      ]}
      numberOfLines={1}
      ellipsizeMode="tail"
    >
      {category.label}
    </Text>
  </TouchableOpacity>
));

const styles = StyleSheet.create({
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 998,
  },
  backdropTouchable: {
    flex: 1,
  },
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: EXPANDED_HEIGHT,
    zIndex: 999,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 20,
  },
  handleContainer: {
    alignItems: "center",
    paddingVertical: 2,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    minHeight: 16,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    opacity: 0.4,
  },
  horizontalTabsContainer: {
    paddingVertical: 2,
    paddingTop: 0,
    paddingBottom: 0,
    // Remove border for clean look
  },
  horizontalTabsScrollView: {
    paddingHorizontal: 16,
    flexGrow: 0,
    flex: 0,
    height: 50,
  },
  horizontalTabsContent: {
    paddingRight: 64,
    paddingLeft: 8,
    alignItems: "center",
    flexGrow: 0,
    minHeight: 50,
  },
  horizontalTab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
    marginRight: 10,
    marginLeft: 4,
    minWidth: 75,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    // Optimize for touch interaction
    minHeight: 40,
    maxHeight: 40,
  },
  horizontalTabText: {
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  mainContentContainer: {
    flex: 1,
    flexDirection: "row",
    marginTop: 0, // Remove gap to connect vertical with horizontal
  },
  verticalSidebar: {
    width: 90,
    overflow: "visible", // Allow smooth curves to extend
  },
  verticalSidebarItem: {
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
    position: "relative",
    marginVertical: 2, // Increased spacing for better scrolling
    // Allow smooth curves to flow naturally
  },
  verticalSidebarText: {
    fontSize: 11,
    textAlign: "center",
    lineHeight: 14,
    fontWeight: "600",
    paddingHorizontal: 2,
  },
  leaguesContainer: {
    flex: 1,
    paddingTop: 0,
    position: "relative",
  },
  leagueGroup: {
    marginBottom: 24, // Reduce spacing between groups
  },
  groupTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 12, // Reduce space below group title
    paddingLeft: 8,
  },
  leaguesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 8,
  },
  leaguesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  leagueItem: {
    width: "22%",
    alignItems: "center",
    marginBottom: 20,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  leagueLogoContainer: {
    position: "relative",
    alignItems: "center",
    marginBottom: 8,
  },
  leagueLogo: {
    width: 32,
    height: 32,
    borderRadius: 4,
  },
  statusIndicator: {
    position: "absolute",
    top: -2,
    right: -6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  leagueName: {
    fontSize: 11,
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 15,
    maxWidth: "100%",
    paddingHorizontal: 2,
  },
  smallCollapseButton: {
    position: "absolute",
    bottom: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 6,
  },
});
