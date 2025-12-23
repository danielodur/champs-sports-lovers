import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import {
  Star,
  Trophy,
  MapPin,
  Users,
  Video,
  Target,
  Menu,
  Clock,
  Flame,
} from "lucide-react-native";
import { useTheme } from "@/hooks/useTheme";
import { horizontalTabScrollConfig } from "@/utils/scrollPerformance";
import RearrangeTab from "../../rearrange-tab";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface Category {
  id: string;
  label: string;
  icon: any;
}

interface NewsFilterTabProps {
  activeCategory: string;
  onCategoryChange: (categoryId: string) => void;
  categories?: Category[];
}

const defaultCategories: Category[] = [
  { id: "recent", label: "Recent", icon: Clock },
  { id: "hot", label: "Hot", icon: Flame },
  { id: "follows", label: "Followed", icon: Star },
  { id: "sports", label: "All Sports", icon: Target },
  { id: "fifa", label: "FIFA", icon: Trophy },
  { id: "uganda", label: "Uganda", icon: MapPin },
  { id: "afcon", label: "AFCON", icon: Users },
  { id: "football", label: "Football", icon: Star },
  { id: "basketball", label: "Basketball", icon: Star },
  { id: "rugby", label: "Rugby", icon: Star },
  { id: "english-pl", label: "English PL", icon: Star },
  { id: "la-liga", label: "La Liga", icon: Star },
  { id: "bundesliga", label: "Bundesliga", icon: Star },
  { id: "serie-a", label: "Serie A", icon: Star },
  { id: "ligue-1", label: "Ligue 1", icon: Star },
  { id: "videos", label: "Videos", icon: Video },
];

const STORAGE_KEY = "@news_tabs_arrangement";

export default function NewsFilterTab({
  activeCategory,
  onCategoryChange,
  categories = defaultCategories,
}: NewsFilterTabProps) {
  const theme = useTheme();
  const [showRearrangeModal, setShowRearrangeModal] = useState(false);
  const [visibleCategories, setVisibleCategories] =
    useState<Category[]>(defaultCategories);
  const [activeCategoryIds, setActiveCategoryIds] = useState<string[]>(
    defaultCategories.map((cat) => cat.id),
  );

  // Refs for auto-scrolling tabs
  const tabsScrollViewRef = useRef<ScrollView>(null);
  const tabPositionsRef = useRef<{ [key: string]: number }>({});
  const isManualScrolling = useRef(false);

  // Load saved arrangement on mount
  useEffect(() => {
    loadSavedArrangement();
  }, []);

  const loadSavedArrangement = async () => {
    try {
      const savedArrangement = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedArrangement) {
        const arrangement = JSON.parse(savedArrangement);
        let savedOrder = arrangement.active || defaultCategories.map((cat) => cat.id);

        // Ensure Recent and Hot are always first two categories
        const orderedActiveIds = [
          "recent",
          "hot",
          ...savedOrder.filter((id: string) => id !== "recent" && id !== "hot"),
        ];

        // Show ALL categories in order (no hiding - just reordering)
        // Map saved order first, then add any missing categories
        const orderedCategories = orderedActiveIds
          .map((id: string) =>
            defaultCategories.find((cat: Category) => cat.id === id),
          )
          .filter((cat: Category | undefined): cat is Category => Boolean(cat));

        // Add any missing categories at the end (ensure all tabs are visible)
        const missingCategories = defaultCategories.filter(
          (cat) => !orderedActiveIds.includes(cat.id)
        );
        const allCategories = [...orderedCategories, ...missingCategories];

        console.log("📋 [NewsFilterTab] Loaded arrangement - showing all tabs:", allCategories.map(c => c.id));
        setVisibleCategories(allCategories);
        setActiveCategoryIds(allCategories.map((cat) => cat.id));
      } else {
        // If no saved arrangement, show all tabs by default
        console.log("📋 [NewsFilterTab] No saved arrangement - showing all tabs by default");
        setVisibleCategories(defaultCategories);
        setActiveCategoryIds(defaultCategories.map((cat) => cat.id));
      }
    } catch (error) {
      console.error("❌ [NewsFilterTab] Error loading saved arrangement:", error);
      // If error, show all tabs by default
      setVisibleCategories(defaultCategories);
      setActiveCategoryIds(defaultCategories.map((cat) => cat.id));
    }
  };

  const handleSaveArrangement = (newOrder: string[]) => {
    console.log("🔄 [NewsFilterTab] Saving new arrangement:", newOrder);
    
    // Ensure Recent and Hot are always first two categories
    const orderedActiveIds = [
      "recent",
      "hot",
      ...newOrder.filter((id: string) => id !== "recent" && id !== "hot"),
    ];

    // Show ALL categories in order (no hiding - just reordering)
    // Map saved order first, then add any missing categories
    const orderedCategories = orderedActiveIds
      .map((id: string) =>
        defaultCategories.find((cat: Category) => cat.id === id),
      )
      .filter((cat: Category | undefined): cat is Category => Boolean(cat));

    // Add any missing categories at the end (ensure ALL tabs are always visible)
    const missingCategories = defaultCategories.filter(
      (cat) => !orderedActiveIds.includes(cat.id)
    );
    const allCategories = [...orderedCategories, ...missingCategories];

    console.log("📋 [NewsFilterTab] Updated arrangement - showing all tabs:", allCategories.map(c => c.id));
    setVisibleCategories(allCategories);
    setActiveCategoryIds(allCategories.map((cat) => cat.id));
    
    // Save to AsyncStorage
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ active: allCategories.map(c => c.id), hidden: [] }))
      .catch(error => console.error("❌ [NewsFilterTab] Error saving arrangement:", error));
  };

  // Auto-scroll to selected tab
  const scrollToTab = (categoryId: string) => {
    const tabPosition = tabPositionsRef.current[categoryId];
    if (tabPosition !== undefined && tabsScrollViewRef.current && !isManualScrolling.current) {
      // Calculate the center position for the tab
      const screenWidth = Dimensions.get('window').width;
      const scrollToPosition = Math.max(0, tabPosition - screenWidth / 2 + 50);
      
      tabsScrollViewRef.current.scrollTo({
        x: scrollToPosition,
        y: 0,
        animated: true,
      });
      
      console.log(`🎯 Auto-scrolling to tab: ${categoryId} at position ${tabPosition}`);
    }
  };

  // Trigger auto-scroll when active category changes
  useEffect(() => {
    // Small delay to ensure layout is complete
    const timer = setTimeout(() => {
      scrollToTab(activeCategory);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [activeCategory]);


  const handleCategoryPress = (categoryId: string) => {
    onCategoryChange(categoryId);
  };

  const handleScrollBeginDrag = () => {
    isManualScrolling.current = true;
  };

  const handleScrollEndDrag = () => {
    // Reset manual scrolling flag after a delay
    setTimeout(() => {
      isManualScrolling.current = false;
    }, 500);
  };

  const openRearrangeModal = () => {
    console.log("🔄 Opening rearrange modal...");
    setShowRearrangeModal(true);
  };

  const closeRearrangeModal = () => {
    console.log("🔄 Closing rearrange modal...");
    setShowRearrangeModal(false);
  };

  return (
    <>
      <View
        style={[
          styles.stickyContainer,
          { backgroundColor: theme.colors.backgroundSecondary },
        ]}
      >
        <View style={styles.tabsWrapper}>
          <ScrollView
            ref={tabsScrollViewRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            removeClippedSubviews={
              horizontalTabScrollConfig.removeClippedSubviews
            }
            scrollEventThrottle={horizontalTabScrollConfig.scrollEventThrottle}
            bounces={horizontalTabScrollConfig.bounces}
            decelerationRate={horizontalTabScrollConfig.decelerationRate}
            keyboardShouldPersistTaps={
              horizontalTabScrollConfig.keyboardShouldPersistTaps
            }
            keyboardDismissMode={horizontalTabScrollConfig.keyboardDismissMode}
            onScrollBeginDrag={handleScrollBeginDrag}
            onScrollEndDrag={handleScrollEndDrag}
            onMomentumScrollEnd={handleScrollEndDrag}
            style={styles.categoryContainer}
            contentContainerStyle={styles.categoryContent}
          >
            {visibleCategories.map((category) => {
              const IconComponent = category.icon;
              const isActive = activeCategory === category.id;

              return (
                <View 
                  key={category.id} 
                  style={styles.categoryTabContainer}
                  onLayout={(event) => {
                    const { x } = event.nativeEvent.layout;
                    tabPositionsRef.current[category.id] = x;
                  }}
                >
                  <TouchableOpacity
                    style={styles.categoryTab}
                    onPress={() => handleCategoryPress(category.id)}
                    activeOpacity={1}
                  >
                    <IconComponent
                      size={16}
                      color={
                        isActive
                          ? theme.colors.primary
                          : theme.colors.textSecondary
                      }
                      style={styles.categoryIcon}
                    />
                    <Text
                      style={[
                        styles.categoryText,
                        {
                          color: isActive
                            ? theme.colors.primary
                            : theme.colors.textSecondary,
                          fontWeight: isActive ? "bold" : "normal",
                        },
                      ]}
                    >
                      {category.label}
                    </Text>
                  </TouchableOpacity>
                  {isActive && (
                    <View
                      style={[
                        styles.activeIndicator,
                        {
                          backgroundColor: theme.colors.primary,
                        },
                      ]}
                    />
                  )}
                </View>
              );
            })}
          </ScrollView>

          {/* Three-line menu button */}
          <TouchableOpacity
            style={[
              styles.menuButton,
              { backgroundColor: theme.colors.backgroundSecondary },
            ]}
            onPress={() => {
              console.log("🟢 Menu button pressed!");
              openRearrangeModal();
            }}
            activeOpacity={0.7}
          >
            <Menu size={20} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Rearrange Modal */}
      {showRearrangeModal && (
        <RearrangeTab
          visible={showRearrangeModal}
          onClose={closeRearrangeModal}
          currentTabOrder={activeCategoryIds}
          tabLabels={Object.fromEntries(
            defaultCategories.map((cat) => [cat.id, cat.label])
          )}
          onSaveArrangement={handleSaveArrangement}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  stickyContainer: {
    paddingVertical: 8,
  },
  tabsWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  categoryContainer: {
    flex: 1,
    marginBottom: 0,
  },
  categoryContent: {
    paddingLeft: 16,
    paddingRight: 8,
  },
  categoryTabContainer: {
    marginRight: 12,
    minWidth: 100,
    alignItems: "center",
  },
  categoryTab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "transparent",
  },
  categoryIcon: {
    marginRight: 6,
  },
  categoryText: {
    fontSize: 14,
    fontFamily: "Inter-Medium",
  },
  activeIndicator: {
    position: "absolute",
    bottom: -2,
    left: "50%",
    marginLeft: -20,
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  menuButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginRight: 16,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
});
