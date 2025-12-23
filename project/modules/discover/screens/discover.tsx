import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "react-i18next";
import { Bell, ChevronRight, ChevronDown, Menu } from "lucide-react-native";
import useAuth from "@/hooks/useAuth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DiscoverRearrangeTabs from "./community/rearrange-tabs";
import DiscoverFollowedScreen from "./discover-followed";
import DiscoverHotCommunityScreen from "./community/discover-hot-community";
import DiscoverMembershipScreen from "./discover-membership";
import CommunityAllSportsScreen from "./community/community-all-sports";
import CommunityFootballScreen from "./community/community-football";
import CommunityBasketballScreen from "./community/community-basketball";
import {
  getOptimizedScrollStyles,
  detailsScrollConfig,
  horizontalTabScrollConfig,
} from "@/utils/scrollPerformance";
import DiscoverExpertsScreen from "./experts/discover-experts";

// Generate professional realistic avatar using Dicebear adventurer style
const STORAGE_KEY = "@discover_tabs_arrangement";

const generateProfessionalAvatar = (name: string): string => {
  const colors = [
    "#1f2937",
    "#374151",
    "#4b5563",
    "#6b7280",
    "#9ca3af",
    "#d1d5db",
    "#e5e7eb",
    "#f3f4f6",
    "#ffffff",
    "#fef2f2",
    "#fecaca",
    "#f87171",
    "#ef4444",
    "#dc2626",
    "#b91c1c",
    "#991b1b",
    "#7f1d1d",
    "#fef3c7",
    "#fde68a",
    "#fcd34d",
  ];

  const initials = name
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase())
    .join("")
    .slice(0, 2);

  const backgroundColor = colors[name.length % colors.length];
  const textColor =
    backgroundColor === "#ffffff" || backgroundColor.includes("f")
      ? "#1f2937"
      : "#ffffff";

  return `https://ui-avatars.com/api/?name=${initials}&background=${backgroundColor.slice(1)}&color=${textColor.slice(1)}&size=100&font-size=0.6&bold=true`;
};

export default function DiscoverScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { isLoggedIn, userInfo } = useAuth();
  const [activeTab, setActiveTab] = useState("hot");
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  const [savedProfilePicture, setSavedProfilePicture] = useState<string | null>(
    null,
  );
  const [showRearrangeModal, setShowRearrangeModal] = useState(false);
  const [communityActive, setCommunityActive] = useState(true);
  const [expertsActive, setExpertsActive] = useState(false);
  const [showExpertsScreen, setShowExpertsScreen] = useState(false);

  const [visibleCategories, setVisibleCategories] = useState([
    { id: "following", label: t("Followed") },
    { id: "hot", label: t("Hot") },
    { id: "membership", label: t("Membership") },
    { id: "all-sports", label: t("All Sports") },
    { id: "football", label: t("Football") },
    { id: "basketball", label: t("Basketball") },
  ]);
  const [activeCategoryIds, setActiveCategoryIds] = useState<string[]>([
    "following",
    "hot",
    "membership",
    "all-sports",
    "football",
    "basketball",
  ]);

  // Load saved profile picture
  useEffect(() => {
    if (
      global.savedProfileData &&
      global.savedProfileData.personalInfo &&
      global.savedProfileData.personalInfo.profilePicture
    ) {
      setSavedProfilePicture(
        global.savedProfileData.personalInfo.profilePicture,
      );
    }
  }, []);

  // Handle tab parameter from navigation
  useEffect(() => {
    if (params.tab && typeof params.tab === "string") {
      const validTabs = [
        "following",
        "hot",
        "membership",
        "all-sports",
        "football",
        "basketball",
      ];
      if (validTabs.includes(params.tab)) {
        setActiveTab(params.tab);
      }
    }
  }, [params.tab]);

  // Load saved arrangement on mount and clean up community
  useEffect(() => {
    cleanupSavedArrangement();
    loadSavedArrangement();
  }, []);

  const cleanupSavedArrangement = async () => {
    try {
      const savedArrangement = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedArrangement) {
        const arrangement = JSON.parse(savedArrangement);
        if (arrangement.active && arrangement.active.includes("community")) {
          arrangement.active = arrangement.active.filter(
            (id: string) => id !== "community",
          );
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(arrangement));
        }
      }
    } catch (error) {
      console.error("Error cleaning saved arrangement:", error);
    }
  };

  const loadSavedArrangement = async () => {
    try {
      const savedArrangement = await AsyncStorage.getItem(STORAGE_KEY);
      
      // Define all valid tabs in the desired order
      const defaultTabOrder = [
        "following",
        "hot",
        "membership",
        "all-sports",
        "football",
        "basketball",
      ];
      
      if (savedArrangement) {
        const arrangement = JSON.parse(savedArrangement);
        let activeIds = arrangement.active || defaultTabOrder;

        // Filter out community from saved arrangement
        activeIds = activeIds.filter((id: string) => id !== "community");

        // ROBUST MERGE: Ensure all new tabs are added if missing
        const existingTabsSet = new Set(activeIds);
        const finalIds: string[] = [...activeIds];
        
        // Collect all missing tabs
        const missingTabs = defaultTabOrder.filter(tab => !existingTabsSet.has(tab));
        
        if (missingTabs.length > 0) {
          // Separate sports tabs from other tabs
          const missingSportsTabs = missingTabs.filter(tab => 
            ["all-sports", "football", "basketball"].includes(tab)
          );
          const otherMissingTabs = missingTabs.filter(tab => 
            !["all-sports", "football", "basketball"].includes(tab)
          );
          
          // Insert sports tabs after membership
          const membershipIndex = finalIds.indexOf("membership");
          if (membershipIndex !== -1 && missingSportsTabs.length > 0) {
            // Insert all sports tabs right after membership in correct order
            finalIds.splice(membershipIndex + 1, 0, ...missingSportsTabs);
          } else if (missingSportsTabs.length > 0) {
            // If no membership, append sports tabs at end
            finalIds.push(...missingSportsTabs);
          }
          
          // Append any other missing tabs at the end
          if (otherMissingTabs.length > 0) {
            finalIds.push(...otherMissingTabs);
          }
        }

        // Ensure Following and Hot are always first two categories
        const orderedActiveIds = [
          "following",
          "hot",
          ...finalIds.filter(
            (id: string) =>
              id !== "following" && id !== "hot" && id !== "community",
          ),
        ];

        // Filter categories to show only active ones in order
        const orderedCategories = orderedActiveIds.map((id: string) => ({
          id,
          label:
            id === "following"
              ? t("Followed")
              : id === "hot"
                ? t("Hot")
                : id === "membership"
                  ? t("Membership")
                  : id === "all-sports"
                    ? t("All Sports")
                    : id === "football"
                      ? t("Football")
                      : id === "basketball"
                        ? t("Basketball")
                        : id,
        }));

        setVisibleCategories(orderedCategories);
        setActiveCategoryIds(orderedActiveIds);
        
        // Auto-save the updated arrangement with new tabs
        const updatedArrangement = {
          active: orderedActiveIds,
          hidden: [],
        };
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedArrangement));
        console.log('✅ Tabs loaded and updated:', orderedActiveIds);
      } else {
        // If no saved arrangement, show all tabs by default
        const defaultCategories = [
          { id: "following", label: t("Followed") },
          { id: "hot", label: t("Hot") },
          { id: "membership", label: t("Membership") },
          { id: "all-sports", label: t("All Sports") },
          { id: "football", label: t("Football") },
          { id: "basketball", label: t("Basketball") },
        ];
        setVisibleCategories(defaultCategories);
        setActiveCategoryIds(defaultCategories.map((cat) => cat.id));
      }
    } catch (error) {
      console.error("Error loading saved arrangement:", error);
      // If error, show all tabs by default
      const defaultCategories = [
        { id: "following", label: t("Followed") },
        { id: "hot", label: t("Hot") },
        { id: "membership", label: t("Membership") },
        { id: "all-sports", label: t("All Sports") },
        { id: "football", label: t("Football") },
        { id: "basketball", label: t("Basketball") },
      ];
      setVisibleCategories(defaultCategories);
      setActiveCategoryIds(defaultCategories.map((cat) => cat.id));
    }
  };

  const handleSaveArrangement = (activeIds: string[]) => {
    // Filter out community and ensure Following and Hot are always first two categories
    const filteredActiveIds = activeIds.filter(
      (id: string) => id !== "community",
    );
    const orderedActiveIds = [
      "following",
      "hot",
      ...filteredActiveIds.filter(
        (id: string) =>
          id !== "following" && id !== "hot" && id !== "community",
      ),
    ];

    // Update visible categories based on new arrangement
    const orderedCategories = orderedActiveIds.map((id: string) => ({
      id,
      label:
        id === "following"
          ? t("Followed")
          : id === "hot"
            ? t("Hot")
            : id === "membership"
              ? t("Membership")
              : id === "all-sports"
                ? t("All Sports")
                : id === "football"
                  ? t("Football")
                  : id === "basketball"
                    ? t("Basketball")
                    : id,
    }));

    setVisibleCategories(orderedCategories);
    setActiveCategoryIds(orderedActiveIds);
  };

  const categories = visibleCategories;

  // Base tools that are available across all categories
  const baseTools = [
    {
      id: "video",
      label: t("Video Record"),
      icon: "📹",
      route: "/video-records",
    },
    {
      id: "tactics",
      label: t("Tactics Board"),
      icon: "📋",
      route: "/tactics-board",
    },
    { id: "rankings", label: t("Rankings"), icon: "📊", route: "/rankings" },
    {
      id: "value",
      label: t("Value Rankings"),
      icon: "💎",
      route: "/value-rankings",
    },
    {
      id: "calculator",
      label: t("Calculator"),
      icon: "🔢",
      route: "/calculator",
    },
    {
      id: "trends",
      label: t("Trend Charts"),
      icon: "📈",
      route: "/trend-charts",
    },
    { id: "data", label: t("Data Models"), icon: "📊", route: "/data-models" },
    { id: "results", label: t("Results"), icon: "🎯", route: "/results" },
    { id: "index", label: t("Heat Index"), icon: "🌡️", route: "/heat-index" },
    {
      id: "indicators",
      label: t("Indicators"),
      icon: "📉",
      route: "/indicators",
    },
  ];

  // Category-specific tools
  const categoryTools = {
    following: [
      {
        id: "video",
        label: "Video Record",
        icon: "📹",
        route: "/video-records",
      },
      { id: "results", label: "Results", icon: "🎯", route: "/results" },
      {
        id: "trends",
        label: "Trend Charts",
        icon: "📈",
        route: "/trend-charts",
      },
      { id: "index", label: "Heat Index", icon: "🌡️", route: "/heat-index" },
      {
        id: "calculator",
        label: "Calculator",
        icon: "🔢",
        route: "/calculator",
      },
      {
        id: "indicators",
        label: "Indicators",
        icon: "📉",
        route: "/indicators",
      },
    ],
    hot: [
      {
        id: "video",
        label: "Video Record",
        icon: "📹",
        route: "/video-records",
      },
      {
        id: "tactics",
        label: "Tactics Board",
        icon: "📋",
        route: "/tactics-board",
      },
      { id: "rankings", label: "Rankings", icon: "📊", route: "/rankings" },
      {
        id: "value",
        label: "Value Rankings",
        icon: "💎",
        route: "/value-rankings",
      },
      {
        id: "calculator",
        label: "Calculator",
        icon: "🔢",
        route: "/calculator",
      },
      {
        id: "trends",
        label: "Trend Charts",
        icon: "📈",
        route: "/trend-charts",
      },
      { id: "data", label: "Data Models", icon: "📊", route: "/data-models" },
      { id: "results", label: "Results", icon: "🎯", route: "/results" },
      { id: "index", label: "Heat Index", icon: "🌡️", route: "/heat-index" },
      {
        id: "indicators",
        label: "Indicators",
        icon: "📉",
        route: "/indicators",
      },
    ],
    membership: [
      {
        id: "video",
        label: "Premium Videos",
        icon: "🎬",
        route: "/video-records",
      },
      {
        id: "data",
        label: "Premium Models",
        icon: "🔍",
        route: "/data-models",
      },
      {
        id: "calculator",
        label: "Pro Calculator",
        icon: "🧮",
        route: "/calculator",
      },
      {
        id: "indicators",
        label: "VIP Indicators",
        icon: "📊",
        route: "/indicators",
      },
      {
        id: "value",
        label: "Market Analysis",
        icon: "📈",
        route: "/value-rankings",
      },
      {
        id: "results",
        label: "Exclusive Results",
        icon: "🏆",
        route: "/results",
      },
    ],
    football: [
      {
        id: "video",
        label: "Match Highlights",
        icon: "🎥",
        route: "/video-records",
      },
      {
        id: "tactics",
        label: "Tactical Analysis",
        icon: "⚽",
        route: "/tactics-board",
      },
      {
        id: "rankings",
        label: "Team Rankings",
        icon: "🏆",
        route: "/rankings",
      },
      {
        id: "value",
        label: "Player Values",
        icon: "💰",
        route: "/value-rankings",
      },
      {
        id: "data",
        label: "Match Predictions",
        icon: "🔮",
        route: "/data-models",
      },
      { id: "results", label: "Match Results", icon: "📋", route: "/results" },
      { id: "index", label: "Team Form", icon: "📈", route: "/heat-index" },
      {
        id: "indicators",
        label: "Performance Stats",
        icon: "📊",
        route: "/indicators",
      },
    ],
    basketball: [
      {
        id: "tactics",
        label: "Court Tactics",
        icon: "🏀",
        route: "/tactics-board",
      },
      { id: "rankings", label: "NBA Rankings", icon: "🏆", route: "/rankings" },
      {
        id: "value",
        label: "Player Values",
        icon: "💰",
        route: "/value-rankings",
      },
      {
        id: "data",
        label: "Game Predictions",
        icon: "🔮",
        route: "/data-models",
      },
      { id: "results", label: "Game Results", icon: "📋", route: "/results" },
      { id: "index", label: "Player Form", icon: "📈", route: "/heat-index" },
      {
        id: "video",
        label: "Game Highlights",
        icon: "🎥",
        route: "/video-records",
      },
      {
        id: "indicators",
        label: "Performance Stats",
        icon: "📊",
        route: "/indicators",
      },
    ],
  };

  // Get tools based on active tab
  const getToolsForCategory = () => {
    return categoryTools[activeTab as keyof typeof categoryTools] || baseTools;
  };

  const tools = getToolsForCategory();

  const posts = [
    {
      id: "1",
      author: "John Smith",
      avatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
      timestamp: "2 minutes ago",
      category: "Football",
      content:
        "Tonight's match analysis: Arsenal vs Bayern Munich - Key tactical breakdown and predictions",
      engagement: "3.2K",
      comments: "245",
      level: 61,
      verified: true,
    },
    {
      id: "2",
      author: "Sarah Wilson",
      avatar:
        "https://images.unsplash.com/photo-1494790108755-2616b9d3c93d?w=100&h=100&fit=crop&crop=face",
      timestamp: "15 minutes ago",
      category: "Basketball",
      content:
        "NBA Playoffs: Lakers' defensive strategy against Warriors - What to expect tonight",
      engagement: "2.8K",
      comments: "189",
      level: 45,
      verified: true,
    },
    {
      id: "3",
      author: "Mike Johnson",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
      timestamp: "32 minutes ago",
      category: "Football",
      content:
        "Premier League title race: Statistical analysis of remaining fixtures and team performance",
      engagement: "4.1K",
      comments: "312",
      level: 38,
      verified: false,
    },
  ];

  const filteredPosts = posts.filter((post) => {
    if (activeTab === "following") return true;
    if (activeTab === "hot") return true;
    if (activeTab === "football") return post.category === "Football";
    if (activeTab === "basketball") return post.category === "Basketball";
    return true;
  });

  const handleToolPress = (route: string) => {
    router.push(route as any);
  };

  const handleCommunityPress = () => {
    const newCommunityState = !communityActive;
    setCommunityActive(newCommunityState);
    setExpertsActive(false);
    // Always set to hot tab when community is active
    setActiveTab("hot");
  };

  const handleExpertsPress = () => {
    setExpertsActive(!expertsActive);
    if (!expertsActive) {
      setShowExpertsScreen(true);
      setCommunityActive(false);
    } else {
      setShowExpertsScreen(false);
    }
  };

  const renderHeader = () => (
    <View style={[styles.header, { backgroundColor: theme.colors.background }]}>
      <View style={styles.headerLeft}>
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/profile")}
          activeOpacity={0.7}
        >
          <Image
            source={{
              uri:
                savedProfilePicture ||
                generateProfessionalAvatar(userInfo?.username || "User"),
            }}
            style={styles.profilePic}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.headerCenter}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleCommunityPress}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.headerButtonText,
              {
                color: communityActive
                  ? theme.colors.primary
                  : theme.colors.textSecondary,
              },
            ]}
          >
            Community
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleExpertsPress}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.headerButtonText,
              {
                color: expertsActive
                  ? theme.colors.primary
                  : theme.colors.textSecondary,
              },
            ]}
          >
            Experts
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.notificationButton}
        onPress={() => router.push("/notifications")}
        activeOpacity={0.7}
      >
        <Bell size={24} color={theme.colors.text} />
        <View
          style={[
            styles.notificationBadge,
            { backgroundColor: theme.colors.primary },
          ]}
        >
          <Text style={[styles.notificationText, { color: "#FFFFFF" }]}>3</Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  const renderCategories = () => (
    <View
      style={[
        styles.categoriesContainer,
        {
          backgroundColor: theme.colors.background,
          borderBottomColor: theme.colors.border || "rgba(255, 255, 255, 0.1)",
        },
      ]}
    >
      <View style={styles.tabsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScrollContent}
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
          style={styles.categoriesScroll}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={styles.categoryButton}
              onPress={() => {
                setActiveTab(category.id);
                // Community stays active for all tab presses since they all filter community data
                setCommunityActive(true);
              }}
            >
              <Text
                style={[
                  styles.categoryText,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {category.label}
              </Text>
              {activeTab === category.id && (
                <View
                  style={[
                    styles.activeIndicator,
                    { backgroundColor: theme.colors.primary },
                  ]}
                />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Menu button for rearranging tabs */}
        <TouchableOpacity
          style={[
            styles.menuButton,
            {
              backgroundColor: theme.colors.background,
              shadowColor:
                theme.colors.background === "#FFFFFF" ? "#000000" : "#FFFFFF",
            },
          ]}
          onPress={() => setShowRearrangeModal(true)}
          activeOpacity={0.7}
        >
          <Menu size={20} color={theme.colors.text} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderTools = () => (
    <View
      style={[styles.toolsGrid, { backgroundColor: theme.colors.background }]}
    >
      {tools.map((tool) => (
        <TouchableOpacity
          key={tool.id}
          style={[
            styles.toolItem,
            {
              backgroundColor: theme.colors.background,
              shadowColor:
                theme.colors.background === "#FFFFFF" ? "#000000" : "#FFFFFF",
            },
          ]}
          onPress={() => handleToolPress(tool.route)}
          activeOpacity={0.7}
        >
          <Text style={styles.toolIcon}>{tool.icon}</Text>
          <Text style={[styles.toolLabel, { color: theme.colors.text }]}>
            {tool.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderSectionSeparator = () => (
    <View style={styles.sectionSeparatorContainer}>
      <View
        style={[
          styles.sectionSeparator,
          {
            backgroundColor:
              theme.colors.background === "#FFFFFF" ? "#F0F0F0" : "#1A1A1A",
            shadowColor:
              theme.colors.background === "#FFFFFF" ? "#000000" : "#FFFFFF",
          },
        ]}
      />
    </View>
  );

  const renderPosts = () => (
    <View style={styles.postsContainer}>
      {filteredPosts.map((post, index) => (
        <View key={post.id}>
          <View
            style={[
              styles.postCard,
              {
                backgroundColor: theme.colors.background,
                borderColor: theme.colors.border || "rgba(255, 255, 255, 0.1)",
              },
            ]}
          >
            <View style={styles.postHeader}>
              <View style={styles.authorInfo}>
                <Image
                  source={{ uri: post.avatar }}
                  style={styles.authorAvatar}
                />
                <View>
                  <View style={styles.authorNameContainer}>
                    <Text
                      style={[styles.authorName, { color: theme.colors.text }]}
                    >
                      {post.author}
                    </Text>
                    {post.verified && (
                      <Text style={styles.verifiedBadge}>👑</Text>
                    )}
                    <Text
                      style={[
                        styles.authorLevel,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      Lv{post.level}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.postMeta,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    {post.timestamp} • {post.category}
                  </Text>
                </View>
              </View>
              <TouchableOpacity>
                <ChevronRight size={20} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.postContent, { color: theme.colors.text }]}>
              {post.content}
            </Text>
            <View style={styles.postFooter}>
              <Text
                style={[
                  styles.engagementText,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {post.engagement} views • {post.comments} comments
              </Text>
            </View>
          </View>
          {index < filteredPosts.length - 1 && (
            <View
              style={[
                styles.postSeparator,
                {
                  backgroundColor:
                    theme.colors.border || "rgba(255, 255, 255, 0.1)",
                },
              ]}
            />
          )}
        </View>
      ))}
    </View>
  );

  // If experts screen should be shown, render it instead
  if (showExpertsScreen) {
    return (
      <DiscoverExpertsScreen
        onBackPress={() => {
          setShowExpertsScreen(false);
          setExpertsActive(false);
          setCommunityActive(true);
        }}
        communityActive={communityActive}
        expertsActive={expertsActive}
        onCommunityPress={() => {
          setShowExpertsScreen(false);
          setExpertsActive(false);
          setCommunityActive(true);
        }}
        onExpertsPress={() => {
          // Already on experts, just toggle state
          setExpertsActive(!expertsActive);
        }}
      />
    );
  }

  return (
    <>
      <StatusBar
        barStyle={
          theme.colors.background === "#FFFFFF"
            ? "dark-content"
            : "light-content"
        }
        backgroundColor={theme.colors.background}
        translucent
      />
      <View
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <View
          style={[
            styles.headerBackground,
            {
              backgroundColor: theme.colors.background,
              shadowColor:
                theme.colors.background === "#FFFFFF" ? "#000000" : "#FFFFFF",
            },
          ]}
        >
          <SafeAreaView edges={["top"]} />
          <View style={styles.headerWrapper}>
            {renderHeader()}
            {renderCategories()}
          </View>
        </View>

        <ScrollView
          style={[styles.content, getOptimizedScrollStyles()]}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={detailsScrollConfig.removeClippedSubviews}
          scrollEventThrottle={detailsScrollConfig.scrollEventThrottle}
          bounces={detailsScrollConfig.bounces}
          decelerationRate={detailsScrollConfig.decelerationRate}
          keyboardShouldPersistTaps={
            detailsScrollConfig.keyboardShouldPersistTaps
          }
          keyboardDismissMode={detailsScrollConfig.keyboardDismissMode}
        >
          {activeTab === "following" ? (
            <DiscoverFollowedScreen />
          ) : activeTab === "hot" ? (
            <DiscoverHotCommunityScreen />
          ) : activeTab === "membership" ? (
            <DiscoverMembershipScreen />
          ) : activeTab === "all-sports" ? (
            <CommunityAllSportsScreen />
          ) : activeTab === "football" ? (
            <CommunityFootballScreen />
          ) : activeTab === "basketball" ? (
            <CommunityBasketballScreen />
          ) : (
            <>
              {renderTools()}
              {renderSectionSeparator()}
              {renderPosts()}
            </>
          )}
        </ScrollView>
      </View>

      {/* Rearrange Tabs Modal */}
      {showRearrangeModal && (
        <DiscoverRearrangeTabs
          visible={showRearrangeModal}
          onClose={() => setShowRearrangeModal(false)}
          currentTabOrder={activeCategoryIds}
          tabLabels={{
            following: t("Followed"),
            hot: t("Hot"),
            membership: t("Membership"),
            "all-sports": t("All Sports"),
            football: t("Football"),
            basketball: t("Basketball"),
          }}
          onSaveArrangement={handleSaveArrangement}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBackground: {
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 8,
  },
  headerWrapper: {
    paddingTop: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerCenter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  headerButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 4,
  },
  headerButtonText: {
    fontSize: 18,
    fontFamily: "Inter-SemiBold",
  },
  profilePic: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  notificationButton: {
    position: "relative",
    padding: 4,
  },
  notificationBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
  },
  notificationText: {
    fontSize: 12,
    fontFamily: "Inter-Bold",
  },
  categoriesContainer: {
    borderBottomWidth: 1,
  },
  tabsWrapper: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
  },
  categoriesScroll: {
    flex: 1,
  },
  categoriesScrollContent: {
    paddingLeft: 16,
    paddingRight: 60,
  },
  menuButton: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    zIndex: 10,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    position: "relative",
  },
  activeIndicator: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    marginHorizontal: 20,
    height: 2,
  },
  categoryText: {
    fontSize: 14,
    fontFamily: "Inter-Medium",
  },
  content: {
    flex: 1,
  },
  toolsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 8,
    paddingTop: 12,
    paddingBottom: 12,
    gap: 8,
    justifyContent: "flex-start",
  },
  toolItem: {
    width: "19%",
    aspectRatio: 1,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  toolIcon: {
    fontSize: 24,
    marginBottom: 4,
    marginRight: 1,
  },
  toolLabel: {
    fontSize: 10,
    fontFamily: "Inter-Medium",
    textAlign: "center",
  },
  sectionSeparatorContainer: {
    width: "100%",
    paddingVertical: 16,
  },
  sectionSeparator: {
    height: 3,
    width: "100%",
    borderRadius: 1.5,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  postsContainer: {
    paddingTop: 16,
    paddingBottom: 16,
  },
  postCard: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
  },
  postSeparator: {
    height: 1,
    width: "100%",
    marginVertical: 16,
  },
  postHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  authorInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  authorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  authorNameContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  authorName: {
    fontSize: 16,
    fontFamily: "Inter-SemiBold",
  },
  verifiedBadge: {
    fontSize: 14,
  },
  authorLevel: {
    fontSize: 12,
    fontFamily: "Inter-Regular",
  },
  postMeta: {
    fontSize: 12,
    fontFamily: "Inter-Regular",
    marginTop: 2,
  },
  postContent: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
    lineHeight: 20,
    marginBottom: 12,
  },
  postFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  engagementText: {
    fontSize: 12,
    fontFamily: "Inter-Regular",
  },
});
