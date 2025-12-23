import React, { useRef, useState, useCallback, useEffect, useImperativeHandle, forwardRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
  LayoutChangeEvent,
} from "react-native";
import {
  Menu,
  Star,
  Flame,
  Trophy,
  ChevronUp,
  ChevronDown,
} from "lucide-react-native";
import { useTheme } from "../../hooks/useTheme";

interface CompetitionTab {
  id: string;
  label: string;
  iconName: string;
  iconColor?: string;
}

interface StatsSportsFilterTabProps {
  activeTab: string;
  setActiveTab: (tabId: string) => void;
  setActiveCategory: (category: string) => void;
  setActiveRegion: (region: string) => void;
  setShowBottomSheet: (show: boolean) => void;
  competitionTabs: CompetitionTab[];
  isCollapsibleExpanded: boolean;
  setIsCollapsibleExpanded: (expanded: boolean) => void;
  onLeagueTabPress?: (leagueId: string) => void; // NEW: Handler for league tab navigation
}

export interface StatsSportsFilterTabRef {
  scrollToTab: (tabId: string) => void;
}

const StatsSportsFilterTab = forwardRef<StatsSportsFilterTabRef, StatsSportsFilterTabProps>(({
  activeTab,
  setActiveTab,
  setActiveCategory,
  setActiveRegion,
  setShowBottomSheet,
  competitionTabs,
  isCollapsibleExpanded,
  setIsCollapsibleExpanded,
  onLeagueTabPress,
}, ref) => {
  const theme = useTheme();
  const scrollViewRef = useRef<ScrollView>(null);
  const [tabPositions, setTabPositions] = useState<Record<string, { x: number; width: number }>>({});
  const [layoutReady, setLayoutReady] = useState(false);

  const handleTabLayout = useCallback((tabId: string, event: LayoutChangeEvent) => {
    const { x, width } = event.nativeEvent.layout;
    setTabPositions((prev) => {
      const newPositions = {
        ...prev,
        [tabId]: { x, width },
      };
      
      // Mark layout as ready when we have positions for all tabs
      if (!layoutReady && Object.keys(newPositions).length >= competitionTabs.length) {
        setLayoutReady(true);
      }
      
      return newPositions;
    });
  }, [competitionTabs.length, layoutReady]);

  const scrollToTab = useCallback((tabId: string) => {
    if (!scrollViewRef.current || !tabPositions[tabId]) return;
    
    const { x, width } = tabPositions[tabId];
    const screenWidth = 375; // Approximate screen width, could use Dimensions.get('window').width
    const centerOffset = (screenWidth / 2) - (width / 2);
    const scrollX = Math.max(0, x - centerOffset);
    
    scrollViewRef.current.scrollTo({
      x: scrollX,
      animated: true,
    });
  }, [tabPositions]);

  // Expose scrollToTab method to parent component
  useImperativeHandle(ref, () => ({
    scrollToTab,
  }), [scrollToTab]);

  // Auto-scroll to active tab when it changes (e.g., sport switch)
  useEffect(() => {
    if (layoutReady && activeTab === "hot") {
      // Small delay to ensure layout is complete
      setTimeout(() => {
        scrollToTab("hot");
      }, 100);
    }
  }, [activeTab, layoutReady, scrollToTab]);

  const handleTabPress = (tab: CompetitionTab) => {
    // Smooth scroll to center the pressed tab
    if (layoutReady) {
      scrollToTab(tab.id);
    }
    
    // Football league tabs that should display inline in stats screen
    const footballLeagueTabs = [
      "english-pl", 
      "la-liga", 
      "serie-a", 
      "bundesliga",
      "ligue-1",
      "ugandan-pl",
      "uefa-champions",
      "uefa-europa-l",
      "uefa-conference-l",
      "uefa-nations",
      "afcon",
      "cecafa-east-africa",
      "fifa-qualifiers-europe",
      "fifa-qualifiers-africa",
      "liga-portugal",
      "eredivisie",
      "saudi-pro-league",
      "belgian-pro-league",
      "liga-mx",
      "mls",
      "super-league-greece",
      "superliga",
      "efl-league-two",
      "j1-league",
      "k-league-1",
      "bundesliga-2"
    ];

    // Basketball league tabs that should display inline in stats screen
    const basketballLeagueTabs = [
      "nba",
      "fiba-world-cup",
      "euroleague",
      "basketball-africa-league",
      "liga-acb",
      "turkish-bsl",
      "vtb-united-league",
      "basketball-bundesliga",
      "lega-basket-serie-a",
      "lnb-pro-a",
      "adriatic-league",
      "greek-a1-league",
      "australian-nbl",
      "lithuanian-lkl",
      "cba",
      "b-league",
      "korean-kba"
    ];

    const allLeagueTabs = [...footballLeagueTabs, ...basketballLeagueTabs];
    
    if (allLeagueTabs.includes(tab.id) && onLeagueTabPress) {
      // Pass the tab ID directly as the league ID
      onLeagueTabPress(tab.id);
    } else {
      // Regular behavior for "followed" and "hot"
      setActiveTab(tab.id);
      setActiveCategory(tab.id);
      setActiveRegion(tab.id);
      
      // ALWAYS ensure collapse/reveal starts COLLAPSED (half-way) when switching tabs
      setIsCollapsibleExpanded(false);
    }
  };

  const renderTabIcon = (iconName: string, iconColor?: string) => {
    // Keep red color for Followed and Hot
    if (iconName === "star") {
      return <Star size={14} color="#D32F2F" />;
    }
    if (iconName === "flame") {
      return <Flame size={14} color="#D32F2F" />;
    }

    // For league tabs, use same color logic as text
    const tab = competitionTabs.find((t) => t.iconName === iconName);
    const color =
      activeTab === tab?.id
        ? theme.colors.background === "#FFFFFF"
          ? "#000000"
          : "#FFFFFF"
        : theme.colors.textSecondary;

    switch (iconName) {
      case "trophy":
        return <Trophy size={14} color={color} />;
      default:
        return <Trophy size={14} color={color} />;
    }
  };

  return (
    <View style={[styles.header, { backgroundColor: "transparent" }]}>
      <View style={styles.tabsContainer}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          bounces={true}
          alwaysBounceHorizontal={true}
          decelerationRate="normal"
          scrollEventThrottle={16}
          style={styles.unifiedTabScroll}
          directionalLockEnabled={true}
          scrollEnabled={true}
          removeClippedSubviews={false}
          contentContainerStyle={{ paddingRight: 60 }}
        >
          {competitionTabs.map((tab, index) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.unifiedTabButton,
                {
                  backgroundColor: theme.colors.backgroundSecondary,
                },
              ]}
              onPress={() => handleTabPress(tab)}
              onLayout={(event) => handleTabLayout(tab.id, event)}
              activeOpacity={0.7}
            >
              {activeTab === tab.id && (
                <View style={styles.unifiedTabActiveIndicator} />
              )}
              {renderTabIcon(tab.iconName, tab.iconColor)}
              <Text
                style={[
                  styles.unifiedTabText,
                  {
                    color:
                      activeTab === tab.id
                        ? theme.colors.background === "#FFFFFF"
                          ? "#000000"
                          : "#FFFFFF"
                        : theme.colors.textSecondary,
                  },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <TouchableOpacity
          style={[
            styles.unifiedCompactButton,
            { 
              backgroundColor: theme.colors.backgroundSecondary,
              opacity: activeTab === "hot" ? 1 : 0.15, // More blur effect when not in Hot screen
            },
          ]}
          onPress={() => setIsCollapsibleExpanded(!isCollapsibleExpanded)}
          disabled={activeTab !== "hot"} // Disable when not in Hot screen
          activeOpacity={activeTab === "hot" ? 0.7 : 1} // No press effect when disabled
        >
          {isCollapsibleExpanded ? (
            <ChevronDown size={16} color={theme.colors.text} />
          ) : (
            <ChevronUp size={16} color={theme.colors.text} />
          )}
          <Menu size={16} color={theme.colors.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  tabsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  unifiedTabScroll: {
    flex: 1,
  },
  scrollContent: {
    paddingRight: 8,
  },
  unifiedTabButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    borderRadius: 20,
    position: "relative",
    minHeight: 40,
  },
  unifiedTabActiveIndicator: {
    position: "absolute",
    bottom: -2,
    left: "50%",
    transform: [{ translateX: -1 }],
    width: 28,
    height: 6,
    backgroundColor: "#D32F2F",
    borderRadius: 3,
  },
  unifiedTabText: {
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 6,
  },
  unifiedCompactButton: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: 6,
    borderRadius: 16,
    marginLeft: 4,
    minWidth: 34,
    minHeight: 44,
  },
});

StatsSportsFilterTab.displayName = "StatsSportsFilterTab";

export default StatsSportsFilterTab;
