import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Switch,
  Modal,
  Image,
  Dimensions,
  BackHandler,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams, useFocusEffect, useNavigation } from "expo-router";
import { useTheme } from "@/hooks/useTheme";
import {
  ArrowLeft,
  Plus,
  Link,
  Trophy,
  Gift,
  ChevronRight,
} from "lucide-react-native";
import Svg, { Path } from "react-native-svg";
import { getPlayerImage } from "../../../assets/images/players/index";
import { getCountryImage } from "../../../assets/images/countries/index";
import { getManagerImageFromName } from "../../../assets/images/team-managers/index";
// Import team images from all leagues
import { getTeamImage as getEnglishPLTeamImage } from "../../../assets/images/english-pl/index";
import { getLaLigaTeamImage } from "../../../assets/images/la liga/index";
import { getSerieATeamImage } from "../../../assets/images/serie-a/index";
import { getBundesligaTeamImage } from "../../../assets/images/bundesliga/index";
import { getLeague1TeamImage } from "../../../assets/images/league-1 /index";
import { getTeamImage as getUgandanPLTeamImage } from "../../../assets/images/ugandan-pl/index";
import FontColorModal from "./post-my-lineup-community-fonts";
import PostMyLineupAddLink from "./post-my-lineup-add-link";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

interface Player {
  id: string;
  name: string;
  position: string;
  image: string;
  team: string;
  nationality: string;
}

interface LineupPosition {
  id: string;
  x: number;
  y: number;
  player: Player | null;
}

export default function PostMyLineupCommunityScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const isNavigatingAwayRef = useRef(false);
  const theme = useTheme();
  const params = useLocalSearchParams();

  // Post creation states
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);

  // Font color toggles
  const [titleColorEnabled, setTitleColorEnabled] = useState(false);
  const [contentColorEnabled, setContentColorEnabled] = useState(false);

  // Lineup data from params
  const [formation, setFormation] = useState("4-4-2");
  const [lineup, setLineup] = useState<LineupPosition[]>([]);
  const [managerName, setManagerName] = useState("Team Manager");
  const [currentDate, setCurrentDate] = useState("");

  // Preview modal state
  const [isPreviewModalVisible, setIsPreviewModalVisible] = useState(false);
  
  // Font color states
  const [isFontColorModalVisible, setIsFontColorModalVisible] = useState(false);
  const [titleFontType, setTitleFontType] = useState("default");
  const [contentFontType, setContentFontType] = useState("default");

  // Add link modal state
  const [isAddLinkModalVisible, setIsAddLinkModalVisible] = useState(false);
  const [selectedLinkData, setSelectedLinkData] = useState<{
    link: string;
    option: string;
  } | null>(null);

  // Daily post tracking
  const dailyPostLimit = 3;
  const [dailyPostCount, setDailyPostCount] = useState(0);
  const [postCountStorageKey, setPostCountStorageKey] = useState("");

  // Get club logo function
  const getClubLogo = (teamName: string) => {
    if (!teamName) return null;

    const normalizedTeamName = teamName.toLowerCase().trim();
    const leagueFunctions = [
      getEnglishPLTeamImage,
      getLaLigaTeamImage,
      getSerieATeamImage,
      getBundesligaTeamImage,
      getLeague1TeamImage,
      getUgandanPLTeamImage,
    ];

    // Try exact match first
    for (const getTeamFunc of leagueFunctions) {
      try {
        const logo = getTeamFunc(normalizedTeamName);
        if (logo) {
          return logo;
        }
      } catch (error) {
        continue;
      }
    }

    return null;
  };

  // Get player logo (country flag or club logo)
  const getPlayerLogo = (player: Player) => {
    if (!player) {
      return { type: "fallback", initials: "??" };
    }

    const playerNationality = player.nationality?.trim();
    const playerTeam = player.team?.trim();

    // First try to get country flag
    const countryFlag = playerNationality ? getCountryImage(playerNationality.toLowerCase()) : null;

    if (countryFlag) {
      return {
        type: "country",
        source: countryFlag,
      };
    }

    // If no country flag, try to get club logo
    const clubLogo = playerTeam ? getClubLogo(playerTeam) : null;
    if (clubLogo) {
      return {
        type: "club",
        source: clubLogo,
      };
    }

    // If neither available, return fallback
    let fallbackInitials = "??";
    if (playerNationality && playerNationality.length > 0) {
      fallbackInitials =
        playerNationality
          .split(" ")
          .filter((word) => word.length > 0)
          .map((word) => word[0])
          .join("")
          .toUpperCase()
          .substring(0, 2) || "??";
    }

    return {
      type: "fallback",
      initials: fallbackInitials,
    };
  };

  // Memoize dynamic styles to prevent re-renders
  const publishButtonStyle = useMemo(() => [
    styles.publishButton,
    {
      backgroundColor: content.trim() ? "#FF3B30" : "#666666",
    },
  ], [content]);

  const titleInputStyle = useMemo(() => [
    styles.titleInput,
    titleColorEnabled && styles.coloredText,
  ], [titleColorEnabled]);

  const contentInputStyle = useMemo(() => [
    styles.contentInput,
    contentColorEnabled && styles.coloredText,
  ], [contentColorEnabled]);

  // Render mini player for thumbnail
  const renderMiniPlayer = (position: LineupPosition, index: number) => {
    return (
      <View
        key={position.id}
        style={[
          styles.miniPlayerPosition,
          {
            left: `${position.x}%`,
            bottom: `${position.y}%`,
          },
        ]}
      >
        {position.player ? (
          <View style={styles.miniPlayerContainer}>
            {/* Mini Player Image */}
            <View style={styles.miniPlayerImageContainer}>
              {(() => {
                // Check if player has a remote URL image
                if (
                  position.player.image &&
                  position.player.image.startsWith("http")
                ) {
                  return (
                    <Image
                      source={{ uri: position.player.image }}
                      style={styles.miniPlayerImage}
                      resizeMode="cover"
                    />
                  );
                }

                // Try to get local asset image
                const playerImage = getPlayerImage(position.player.name);
                if (playerImage) {
                  return (
                    <Image
                      source={playerImage}
                      style={styles.miniPlayerImage}
                      resizeMode="cover"
                    />
                  );
                } else {
                  // Fallback to placeholder with initials
                  const initials = position.player.name
                    .split(" ")
                    .map((word) => word[0])
                    .join("")
                    .toUpperCase()
                    .substring(0, 2);

                  return (
                    <View style={[styles.miniPlayerImage, styles.miniPlayerPlaceholder]}>
                      <Text style={styles.miniPlayerInitials}>{initials}</Text>
                    </View>
                  );
                }
              })()}

              {/* Mini Country Badge */}
              {position.player &&
                (position.player.nationality || position.player.team) && (
                  <View style={styles.miniCountryBadge}>
                    {(() => {
                      const logoData = getPlayerLogo(position.player);

                      if (
                        logoData.type === "country" ||
                        logoData.type === "club"
                      ) {
                        return (
                          <Image
                            source={logoData.source}
                            style={styles.miniCountryImage}
                            resizeMode="cover"
                          />
                        );
                      } else {
                        return (
                          <View style={[styles.miniCountryImage, styles.miniCountryText]}>
                            <Text style={styles.miniCountryInitials}>
                              {logoData.initials}
                            </Text>
                          </View>
                        );
                      }
                    })()}
                  </View>
                )}
            </View>
          </View>
        ) : (
          <View style={styles.miniEmptySlot}>
            <Text style={styles.miniPlayerPlus}>+</Text>
          </View>
        )}
      </View>
    );
  };

  // Memoize lineup preview to prevent re-renders
  const lineupPreview = useMemo(() => {
    if (lineup.length === 0) {
      // Default formation dots
      return (
        <>
          <View style={[styles.playerDot, { left: "50%", bottom: "8%" }]} />
          <View style={[styles.playerDot, { left: "20%", bottom: "25%" }]} />
          <View style={[styles.playerDot, { left: "40%", bottom: "25%" }]} />
          <View style={[styles.playerDot, { left: "60%", bottom: "25%" }]} />
          <View style={[styles.playerDot, { left: "80%", bottom: "25%" }]} />
          <View style={[styles.playerDot, { left: "20%", bottom: "55%" }]} />
          <View style={[styles.playerDot, { left: "40%", bottom: "55%" }]} />
          <View style={[styles.playerDot, { left: "60%", bottom: "55%" }]} />
          <View style={[styles.playerDot, { left: "80%", bottom: "55%" }]} />
          <View style={[styles.playerDot, { left: "35%", bottom: "80%" }]} />
          <View style={[styles.playerDot, { left: "65%", bottom: "80%" }]} />
        </>
      );
    }

    return lineup.map((position, index) => renderMiniPlayer(position, index));
  }, [lineup]);

  useEffect(() => {
    console.log("PostMyLineupCommunityScreen mounted");
    console.log("Params received:", params);

    let hasChanges = false;

    // Load data from params
    if (params?.formation && typeof params.formation === "string" && params.formation !== formation) {
      setFormation(params.formation);
      console.log("Formation set:", params.formation);
      hasChanges = true;
    }

    if (params?.lineup && typeof params.lineup === "string") {
      try {
        const lineupData = JSON.parse(params.lineup);
        if (Array.isArray(lineupData) && JSON.stringify(lineupData) !== JSON.stringify(lineup)) {
          setLineup(lineupData);
          console.log("Lineup data loaded:", lineupData.length, "positions");
          hasChanges = true;
        }
      } catch (error) {
        console.log("Error parsing lineup data:", error);
      }
    }

    if (params?.managerName && typeof params.managerName === "string" && params.managerName !== managerName) {
      setManagerName(params.managerName);
      console.log("Manager name set:", params.managerName);
      hasChanges = true;
    }

    // Set current date only once
    if (!currentDate) {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, "0");
      const day = String(today.getDate()).padStart(2, "0");
      setCurrentDate(`${year}.${month}.${day}`);
    }
  }, []); // Empty dependency array to run only once

  useEffect(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    const key = `community_post_count_${year}${month}${day}`;
    setPostCountStorageKey(key);

    const loadCount = async () => {
      try {
        const stored = await AsyncStorage.getItem(key);
        setDailyPostCount(stored ? Number(stored) || 0 : 0);
      } catch (error) {
        console.error("Error loading daily post count:", error);
        setDailyPostCount(0);
      }
    };

    loadCount();
  }, []);

  // Close Font Color modal when screen loses focus (navigates away)
  useFocusEffect(
    useCallback(() => {
      // Cleanup function - runs when screen loses focus
      return () => {
        // Close the Font Color modal when navigating away
        setIsFontColorModalVisible(false);
      };
    }, [])
  );

  const showUnsavedExitAlert = useCallback(
    (onConfirm: () => void) => {
      Alert.alert(
        "Unsaved Changes",
        "You have unsaved content. Are you sure you want to go back? Your post will not be saved.",
        [
          {
            text: "Stay Here",
            style: "cancel",
          },
          {
            text: "Leave",
            style: "destructive",
            onPress: () => {
              onConfirm();
            },
          },
        ],
        { cancelable: true }
      );
    },
    []
  );

  // Handle back button press with warning (for Android hardware back button)
  const handleBackPress = useCallback(() => {
    if (isNavigatingAwayRef.current) {
      return false;
    }

    if (isFontColorModalVisible) {
      setIsFontColorModalVisible(false);
      return true;
    }

    if (isPreviewModalVisible) {
      setIsPreviewModalVisible(false);
      return true;
    }

    const hasUnsavedContent = title.trim().length > 0 || content.trim().length > 0;

    if (hasUnsavedContent) {
      showUnsavedExitAlert(() => {
        isNavigatingAwayRef.current = true;
        router.back();
      });
      return true;
    }

    return false;
  }, [title, content, isFontColorModalVisible, isPreviewModalVisible, router, showUnsavedExitAlert]);

  // Handle back button press from header (TouchableOpacity)
  const handleHeaderBackPress = useCallback(() => {
    if (isNavigatingAwayRef.current) {
      router.back();
      return;
    }

    if (isFontColorModalVisible) {
      setIsFontColorModalVisible(false);
      return;
    }

    if (isPreviewModalVisible) {
      setIsPreviewModalVisible(false);
      return;
    }

    const hasUnsavedContent = title.trim().length > 0 || content.trim().length > 0;

    if (hasUnsavedContent) {
      showUnsavedExitAlert(() => {
        isNavigatingAwayRef.current = true;
        router.back();
      });
      return;
    }

    router.back();
  }, [title, content, isFontColorModalVisible, isPreviewModalVisible, router, showUnsavedExitAlert]);

  // Handle Android hardware back button - ensure it's always up to date
  useEffect(() => {
    if (Platform.OS === "android") {
      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        handleBackPress
      );
      return () => {
        backHandler.remove();
      };
    }
  }, [handleBackPress]);

  // Intercept navigation gestures/back actions
  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (event) => {
      if (isNavigatingAwayRef.current) {
        return;
      }

      if (isFontColorModalVisible) {
        event.preventDefault();
        setIsFontColorModalVisible(false);
        return;
      }

      if (isPreviewModalVisible) {
        event.preventDefault();
        setIsPreviewModalVisible(false);
        return;
      }

      const hasUnsavedContent = title.trim().length > 0 || content.trim().length > 0;

      if (!hasUnsavedContent) {
        return;
      }

      event.preventDefault();
      showUnsavedExitAlert(() => {
        isNavigatingAwayRef.current = true;
        navigation.dispatch(event.data.action);
      });
    });

    return unsubscribe;
  }, [navigation, title, content, isFontColorModalVisible, isPreviewModalVisible, showUnsavedExitAlert]);

  const handlePublish = async () => {
    if (!content.trim()) {
      Alert.alert("Error", "Please add some content to your post");
      return;
    }

    if (dailyPostCount >= dailyPostLimit) {
      Alert.alert(
        "Daily Limit Reached",
        `You can share up to ${dailyPostLimit} community posts per day. Please try again tomorrow.`
      );
      return;
    }

    setIsPublishing(true);

    // Simulate API call
    setTimeout(async () => {
      setIsPublishing(false);
      const newCount = dailyPostCount + 1;
      setDailyPostCount(newCount);
      if (postCountStorageKey) {
        try {
          await AsyncStorage.setItem(postCountStorageKey, newCount.toString());
        } catch (error) {
          console.error("Error saving daily post count:", error);
        }
      }

      Alert.alert(
        "Success",
        "Your lineup has been shared with the community!",
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ],
      );
    }, 2000);
  };

  const handleAddLink = () => {
    setIsAddLinkModalVisible(true);
  };

  const handleLinkConfirmed = (payload: { link: string; option: string }) => {
    setSelectedLinkData(payload);
    setIsAddLinkModalVisible(false);
  };

  const handleLinkModalClose = () => {
    setIsAddLinkModalVisible(false);
  };

  const handleRelatedMatch = () => {
    Alert.alert("Related Match", "Match selection will be implemented here");
  };





  const handleLineupPreview = () => {
    setIsPreviewModalVisible(true);
  };



  const renderPlayer = (position: LineupPosition) => {
    return (
      <View
        key={position.id}
        style={[
          styles.playerPosition,
          {
            left: `${position.x}%`,
            top: `${position.y}%`,
            transform: [
              { translateX: -27 },
              { translateY: -27 },
            ],
          },
        ]}
      >
        {position.player ? (
          <View style={styles.playerSlot}>
            {/* Player Image */}
            <View style={styles.playerImageContainer}>
              {(() => {
                // Check if player has a remote URL image
                if (
                  position.player.image &&
                  position.player.image.startsWith("http")
                ) {
                  return (
                    <Image
                      source={{ uri: position.player.image }}
                      style={styles.playerImage}
                      resizeMode="cover"
                    />
                  );
                }

                // Try to get local asset image
                const playerImage = getPlayerImage(position.player.name);
                if (playerImage) {
                  return (
                    <Image
                      source={playerImage}
                      style={styles.playerImage}
                      resizeMode="cover"
                    />
                  );
                } else {
                  // Fallback to placeholder with initials
                  const initials = position.player.name
                    .split(" ")
                    .map((word) => word[0])
                    .join("")
                    .toUpperCase()
                    .substring(0, 2);

                  return (
                    <View
                      style={[
                        styles.playerImage,
                        styles.playerImagePlaceholder,
                      ]}
                    >
                      <Text style={styles.playerInitials}>{initials}</Text>
                    </View>
                  );
                }
              })()}

              {/* Country Flag or Club Logo Badge */}
              {position.player &&
                (position.player.nationality || position.player.team) && (
                  <View style={styles.countryBadgeContainer}>
                    {(() => {
                      const logoData = getPlayerLogo(position.player);

                      if (
                        logoData.type === "country" ||
                        logoData.type === "club"
                      ) {
                        return (
                          <Image
                            source={logoData.source}
                            style={styles.countryBadge}
                            resizeMode="cover"
                          />
                        );
                      } else {
                        return (
                          <View
                            style={[
                              styles.countryBadge,
                              styles.countryBadgeText,
                            ]}
                          >
                            <Text style={styles.countryInitials}>
                              {logoData.initials}
                            </Text>
                          </View>
                        );
                      }
                    })()}
                  </View>
                )}
            </View>

            {/* Player Name */}
            <Text style={styles.playerName} numberOfLines={1}>
              {position.player.name}
            </Text>
          </View>
        ) : (
          <View style={styles.emptySlot}>
            <Text style={styles.playerPlus}>+</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleHeaderBackPress}
          activeOpacity={0.6}
        >
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Trophy size={20} color="#FFFFFF" />
        </View>

        <TouchableOpacity
          style={publishButtonStyle}
          onPress={handlePublish}
          disabled={!content.trim() || isPublishing}
          activeOpacity={0.8}
        >
          <Text style={styles.publishButtonText}>
            {isPublishing ? "Publishing..." : "Post"}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Title (Optional)</Text>
            <Text style={styles.characterCount}>{title.length}</Text>
          </View>
          <TextInput
            style={titleInputStyle}
            placeholder=""
            placeholderTextColor="#666666"
            value={title}
            onChangeText={setTitle}
            maxLength={50}
          />
        </View>

        {/* Content Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Content</Text>
            <Text style={styles.characterCount}>{content.length}</Text>
          </View>
          <TextInput
            style={contentInputStyle}
            placeholder="Share your content or add a photo. Once published, it cannot be modified or deleted."
            placeholderTextColor="#666666"
            value={content}
            onChangeText={setContent}
            multiline
            maxLength={500}
            textAlignVertical="top"
          />
        </View>

        {/* Lineup Preview */}
        <View style={styles.lineupPreviewSection}>
          <View style={styles.previewHeader}>
            <Text style={styles.previewTitle}>Preview Lineup</Text>
          </View>
          <View style={styles.previewContent}>
            <TouchableOpacity
              style={styles.lineupThumbnail}
              activeOpacity={0.8}
              onPress={handleLineupPreview}
            >
              <View style={styles.thumbnailPitch}>
                {/* Display lineup positions */}
                {lineupPreview}

                {/* Formation text */}
                <Text style={styles.formationText}>{formation}</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Options Menu */}
        <View style={styles.optionsSection}>
          {/* Add Link */}
          <TouchableOpacity
            style={styles.optionItem}
            onPress={handleAddLink}
            activeOpacity={0.7}
          >
            <Link size={20} color="#FFFFFF" />
            <Text style={styles.optionText}>Add Link</Text>
            <ChevronRight size={16} color="#666666" />
          </TouchableOpacity>
          {selectedLinkData && (
            <View style={styles.selectedLinkContainer}>
              <Text style={styles.selectedLinkLabel}>Attached Link:</Text>
              <Text style={styles.selectedLinkValue}>{selectedLinkData.link}</Text>
              <Text style={styles.selectedLinkMeta}>
                Type: {selectedLinkData.option === "analysis" ? "Tactical Analysis" : "Community Discussion"}
              </Text>
            </View>
          )}

          {/* Font Color */}
          <TouchableOpacity
            style={styles.fontColorSection}
            onPress={() => setIsFontColorModalVisible(true)}
            activeOpacity={0.7}
          >
            <View style={styles.fontColorHeader}>
              <View style={styles.fontColorIconContainer}>
                <Text style={styles.fontColorIcon}>Aa</Text>
              </View>
              <Text style={styles.fontColorTitle}>Font Color</Text>
            </View>
            <View style={styles.fontColorControls}>
              <View style={styles.fontColorItem}>
                <Text style={styles.fontColorLabel}>Title</Text>
                <View style={styles.colorToggle}>
                  <View style={styles.colorToggleRing}>
                    <View style={[
                      styles.colorToggleDot,
                      titleFontType === "vip" && styles.colorToggleDotVip
                    ]} />
                  </View>
                </View>
              </View>
              <View style={styles.fontColorItem}>
                <Text style={styles.fontColorLabel}>Content</Text>
                <View style={styles.colorToggle}>
                  <View style={styles.colorToggleRing}>
                    <View style={[
                      styles.colorToggleDot,
                      contentFontType === "vip" && styles.colorToggleDotVip
                    ]} />
                  </View>
                </View>
              </View>
            </View>
            <ChevronRight size={16} color="#666666" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Beautiful Lineup Preview Modal */}
      <Modal
        visible={isPreviewModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsPreviewModalVisible(false)}
      >
        <View style={styles.previewModalContainer}>
          <TouchableOpacity
            style={styles.previewOverlay}
            onPress={() => setIsPreviewModalVisible(false)}
            activeOpacity={1}
          />
          <View style={styles.previewModal}>

            {/* Beautiful Lineup Template */}
            <View style={styles.lineupTemplate}>
              {/* Red Header Banner */}
              <View style={styles.templateHeader}>
                <Text style={styles.templateTitle}>My Champs Lineup</Text>
              </View>

              {/* Formation Label */}
              <View style={styles.formationLabelContainer}>
                <Text style={styles.formationLabel}>{formation} Formation</Text>
              </View>

              {/* Football Pitch */}
              <View style={styles.templatePitchContainer}>
                <View style={styles.templatePitch}>
                  <Image
                    source={require("@/assets/images/soccer-pitch/soccer-pitch.png")}
                    style={styles.templatePitchImage}
                    resizeMode="cover"
                  />

                  {/* Players */}
                  {lineup.map((position) => renderPlayer(position))}
                </View>
              </View>

              {/* Manager Info */}
              <View style={styles.templateManagerInfo}>
                <View style={styles.templateManagerSection}>
                  {(() => {
                    const managerImage = getManagerImageFromName(managerName);

                    if (managerImage) {
                      return (
                        <Image
                          source={managerImage}
                          style={styles.templateManagerCircle}
                          resizeMode="cover"
                        />
                      );
                    } else {
                      return (
                        <View
                          style={[
                            styles.templateManagerCircle,
                            {
                              backgroundColor: "rgba(128, 128, 128, 0.05)",
                              borderColor: "rgba(128, 128, 128, 0.1)",
                            },
                          ]}
                        />
                      );
                    }
                  })()}
                  <View style={styles.templateManagerTextContainer}>
                    <Text style={styles.templateManagerLabel}>Manager:</Text>
                    <Text style={styles.templateManagerName}>{managerName}</Text>
                  </View>
                </View>
                <View style={styles.templateDateSection}>
                  <Text style={styles.templateDateText}>{currentDate}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Font Color Modal */}
      <FontColorModal
        visible={isFontColorModalVisible}
        onClose={() => setIsFontColorModalVisible(false)}
        titleFontType={titleFontType}
        contentFontType={contentFontType}
        onTitleFontChange={(type) => {
          setTitleFontType(type);
          setTitleColorEnabled(type === "vip");
        }}
        onContentFontChange={(type) => {
          setContentFontType(type);
          setContentColorEnabled(type === "vip");
        }}
        onVipRequest={(type) => {
          // Close the Font Color modal first
          setIsFontColorModalVisible(false);
          
          // Show Alert.alert for VIP subscription prompt
          const featureType = type === 'title' ? 'title' : 'content';
          Alert.alert(
            'VIP Feature',
            `VIP font colors for your ${featureType} are exclusive to VIP members. Upgrade to unlock this premium feature!`,
            [
              {
                text: 'Cancel',
                style: 'cancel',
              },
              {
                text: 'Activate Now',
                style: 'default',
                onPress: () => {
                  router.push('/activate-vip');
                },
              },
            ],
            { cancelable: true }
          );
        }}
      />

      <PostMyLineupAddLink
        visible={isAddLinkModalVisible}
        onClose={handleLinkModalClose}
        onConfirm={handleLinkConfirmed}
        dailyPostCount={dailyPostCount}
        dailyPostLimit={dailyPostLimit}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#1a1a1a",
  },
  backButton: {
    padding: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  publishButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  publishButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#333333",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    color: "#FFFFFF",
  },
  characterCount: {
    fontSize: 14,
    color: "#666666",
  },
  titleInput: {
    color: "#FFFFFF",
    fontSize: 16,
    paddingVertical: 8,
    backgroundColor: "transparent",
  },
  contentInput: {
    color: "#FFFFFF",
    fontSize: 16,
    paddingVertical: 8,
    minHeight: 100,
    backgroundColor: "transparent",
    textAlignVertical: "top",
  },
  coloredText: {
    color: "#FF3B30",
  },
  lineupPreviewSection: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#333333",
  },
  previewHeader: {
    marginBottom: 12,
  },
  previewTitle: {
    fontSize: 16,
    color: "#FFFFFF",
  },
  previewContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  lineupThumbnail: {
    width: 140,
    height: 110,
    borderRadius: 8,
    backgroundColor: "#4A8B3B",
    marginRight: 16,
    position: "relative",
    overflow: "hidden",
  },
  thumbnailPitch: {
    flex: 1,
    position: "relative",
  },
  playerDot: {
    position: "absolute",
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#FFFFFF",
    transform: [{ translateX: -5 }, { translateY: 5 }],
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.4,
    shadowRadius: 2,
    elevation: 4,
  },
  playerNumber: {
    color: "#FFFFFF",
    fontSize: 6,
    fontWeight: "bold",
    textAlign: "center",
    lineHeight: 8,
  },

  // Mini Player Styles for Thumbnail
  miniPlayerPosition: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    transform: [{ translateX: -8 }, { translateY: 8 }],
  },
  miniPlayerContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  miniPlayerImageContainer: {
    position: "relative",
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  miniPlayerImage: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  miniPlayerPlaceholder: {
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#4A8B3B",
  },
  miniPlayerInitials: {
    color: "#4A8B3B",
    fontSize: 8,
    fontWeight: "bold",
  },
  miniCountryBadge: {
    position: "absolute",
    bottom: -1,
    right: -1,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  miniCountryImage: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  miniCountryText: {
    backgroundColor: "#4A8B3B",
    alignItems: "center",
    justifyContent: "center",
  },
  miniCountryInitials: {
    color: "#FFFFFF",
    fontSize: 3,
    fontWeight: "bold",
  },
  miniEmptySlot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FFFFFF",
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  miniPlayerPlus: {
    fontSize: 6,
    fontWeight: "600",
    color: "#CCCCCC",
  },
  formationText: {
    position: "absolute",
    bottom: 4,
    right: 4,
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "600",
  },
  addImageButton: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#333333",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  optionsSection: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#333333",
  },
  optionText: {
    fontSize: 16,
    color: "#FFFFFF",
    marginLeft: 12,
    flex: 1,
  },
  selectedLinkContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#333333",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
  },
  selectedLinkLabel: {
    fontSize: 12,
    color: "#9CA3AF",
    marginBottom: 4,
  },
  selectedLinkValue: {
    fontSize: 14,
    color: "#4DA3FF",
    marginBottom: 4,
  },
  selectedLinkMeta: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  fontColorSection: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
  },
  fontColorHeader: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  fontColorIconContainer: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: "#FF3B30",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  fontColorIcon: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  fontColorTitle: {
    fontSize: 16,
    color: "#FFFFFF",
    flex: 1,
  },
  fontColorControls: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
  },
  fontColorItem: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 8,
  },
  fontColorLabel: {
    fontSize: 14,
    color: "#FFFFFF",
    marginRight: 8,
  },
  colorToggle: {
    padding: 4,
  },
  colorToggleRing: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#666666",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  colorToggleRingActive: {
    borderColor: "#FFFFFF",
  },
  colorToggleDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#FFFFFF",
  },
  colorToggleDotVip: {
    backgroundColor: "#FF3B30", // Beautiful red color for VIP
  },

  // Preview Modal Styles
  previewModalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "flex-end",
  },
  previewOverlay: {
    flex: 1,
  },
  previewModal: {
    backgroundColor: "#1a1a1a",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: screenHeight * 0.85,
    paddingBottom: 20,
  },



  // Beautiful Template Styles
  lineupTemplate: {
    backgroundColor: "#2a2a2a",
    margin: 16,
    borderRadius: 12,
    overflow: "hidden",
  },
  templateHeader: {
    backgroundColor: "#DC143C",
    paddingVertical: 20,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  templateTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
  },
  formationLabelContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#2a2a2a",
  },
  formationLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#FFFFFF",
  },
  templatePitchContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 12,
    backgroundColor: "#2a2a2a",
  },
  templatePitch: {
    width: screenWidth - 32,
    height: (screenWidth - 32) * 1.4,
    maxHeight: screenHeight * 0.45,
    borderRadius: 8,
    position: "relative",
    overflow: "hidden",
  },
  templatePitchImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
    top: 0,
    left: 0,
  },

  // Player Styles for Template
  playerPosition: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  playerSlot: {
    alignItems: "center",
    justifyContent: "center",
  },
  playerImageContainer: {
    position: "relative",
    width: 54,
    height: 54,
    borderRadius: 27,
    marginBottom: 4,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
    padding: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  playerImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  playerImagePlaceholder: {
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: "#4A8B3B",
  },
  playerInitials: {
    color: "#4A8B3B",
    fontSize: 16,
    fontWeight: "bold",
  },
  playerName: {
    fontSize: 11,
    fontWeight: "600",
    color: "#FFFFFF",
    textAlign: "center",
    maxWidth: 90,
    paddingHorizontal: 4,
    paddingVertical: 2,
    marginTop: 2,
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  countryBadgeContainer: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
  },
  countryBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  countryBadgeText: {
    backgroundColor: "#4A8B3B",
    alignItems: "center",
    justifyContent: "center",
  },
  countryInitials: {
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "bold",
  },
  emptySlot: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 6,
  },
  playerPlus: {
    fontSize: 18,
    fontWeight: "600",
    color: "#CCCCCC",
  },

  // Template Manager Info
  templateManagerInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 8,
    backgroundColor: "#2a2a2a",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#444",
    minHeight: 50,
    marginTop: -40,
  },
  templateManagerSection: {
    flexDirection: "column",
    alignItems: "center",
  },
  templateManagerCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "rgba(128, 128, 128, 0.3)",
    marginBottom: 2,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  templateManagerTextContainer: {
    alignItems: "center",
  },
  templateManagerLabel: {
    fontSize: 12,
    fontWeight: "400",
    marginBottom: 2,
    textAlign: "center",
    color: "#FFFFFF",
  },
  templateManagerName: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    color: "#FFFFFF",
  },
  templateDateSection: {},
  templateDateText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#CCCCCC",
  },
});