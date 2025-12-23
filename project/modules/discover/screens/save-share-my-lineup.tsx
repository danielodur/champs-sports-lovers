import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
  Share,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTheme } from "@/hooks/useTheme";
import {
  ArrowLeft,
  Users,
  Save,
  Share2,
  ChevronDown,
} from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import MyLineupManagerSelector from "./my-lineup-manager-selector";
import { getManagerImageFromName } from "../../../assets/images/team-managers/index";
import { getCountryImage } from "../../../assets/images/countries/index";
import { getPlayerImage } from "../../../assets/images/players/index";
// Import team images from all leagues
import { getTeamImage as getEnglishPLTeamImage } from "../../../assets/images/english-pl/index";
import { getLaLigaTeamImage } from "../../../assets/images/la liga/index";
import { getSerieATeamImage } from "../../../assets/images/serie-a/index";
import { getBundesligaTeamImage } from "../../../assets/images/bundesliga/index";
import { getLeague1TeamImage } from "../../../assets/images/league-1 /index";
import { getTeamImage as getUgandanPLTeamImage } from "../../../assets/images/ugandan-pl/index";
import PostMyLineupAgreement from "./post-my-lineup-agreement";

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

export default function SaveShareMyLineupScreen() {
  const router = useRouter();
  const theme = useTheme();
  const params = useLocalSearchParams();

  const [formation, setFormation] = useState("4-4-2");
  const [lineup, setLineup] = useState<LineupPosition[]>([]);
  const [managerName, setManagerName] = useState("Team Manager");
  const [currentDate, setCurrentDate] = useState("2025.01.08");
  const [isManagerModalVisible, setIsManagerModalVisible] = useState(false);
  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([]);
  const [isAgreementVisible, setIsAgreementVisible] = useState(false);

  useEffect(() => {
    // Initialize persistent data
    initializePersistentData();

    // Load lineup data from params
    if (params?.formation && typeof params.formation === "string") {
      setFormation(params.formation);
    }
    
    if (params?.lineup && typeof params.lineup === "string") {
      try {
        const lineupData = JSON.parse(params.lineup);
        setLineup(lineupData);
      } catch (error) {
        console.log("Error parsing lineup data:", error);
        loadDefaultLineupData();
      }
    } else {
      loadDefaultLineupData();
    }

    if (params?.managerName && typeof params.managerName === "string") {
      setManagerName(params.managerName);
    }

    if (params?.selectedPlayers && typeof params.selectedPlayers === "string") {
      try {
        const playersData = JSON.parse(params.selectedPlayers);
        setSelectedPlayers(playersData);
      } catch (error) {
        console.log("Error parsing selected players data:", error);
      }
    }
  }, []);

  const initializePersistentData = async () => {
    try {
      // Get or set current date
      let storedDate = await AsyncStorage.getItem("lineup_creation_date");
      if (!storedDate) {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const day = String(today.getDate()).padStart(2, "0");
        const formattedDate = `${year}.${month}.${day}`;
        await AsyncStorage.setItem("lineup_creation_date", formattedDate);
        setCurrentDate(formattedDate);
      } else {
        setCurrentDate(storedDate);
      }

      // Get or set manager name
      let storedManager = await AsyncStorage.getItem("lineup_manager_name");
      if (!storedManager) {
        setManagerName("Team Manager");
        await AsyncStorage.setItem("lineup_manager_name", "Team Manager");
      } else {
        setManagerName(storedManager);
      }
    } catch (error) {
      console.error("Error initializing persistent data:", error);
      // Fallback values
      setCurrentDate("2025.01.08");
      setManagerName("Team Manager");
    }
  };

  const handleManagerSelect = async (manager: string) => {
    setManagerName(manager);
    try {
      await AsyncStorage.setItem("lineup_manager_name", manager);
    } catch (error) {
      console.error("Error saving manager name:", error);
    }
  };

  const loadDefaultLineupData = () => {
    // Default formation positions for 4-4-2
    const defaultPositions: LineupPosition[] = [
      { id: "gk", x: 50, y: 78, player: null },
      { id: "lb", x: 15, y: 62, player: null },
      { id: "cb1", x: 35, y: 67, player: null },
      { id: "cb2", x: 65, y: 67, player: null },
      { id: "rb", x: 85, y: 62, player: null },
      { id: "lm", x: 12, y: 50, player: null },
      { id: "cm1", x: 35, y: 45, player: null },
      { id: "cm2", x: 65, y: 45, player: null },
      { id: "rm", x: 88, y: 50, player: null },
      { id: "lf", x: 30, y: 25, player: null },
      { id: "rf", x: 70, y: 25, player: null },
    ];
    setLineup(defaultPositions);
  };

  // Smart function to get club logo from all available leagues
  const getClubLogo = (teamName: string) => {
    if (!teamName || teamName.trim().length === 0) {
      return null;
    }

    // Try each league in order
    const leagueFunctions = [
      getEnglishPLTeamImage, // English PL
      getLaLigaTeamImage, // La Liga
      getSerieATeamImage, // Serie A
      getBundesligaTeamImage, // Bundesliga
      getLeague1TeamImage, // League 1
      getUgandanPLTeamImage, // Ugandan PL
    ];

    // Normalize team name for better matching
    const normalizedTeamName = teamName.trim();

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

    // Try common variations if exact match fails
    const teamVariations = [
      normalizedTeamName.replace(/FC|CF|SC|AC/gi, "").trim(),
      normalizedTeamName.replace(/United|City|Town|Club/gi, "").trim(),
      normalizedTeamName.split(" ")[0], // First word only
      normalizedTeamName.replace(/'/g, ""), // Remove apostrophes
      normalizedTeamName.replace(/\./g, ""), // Remove periods
      normalizedTeamName.replace(/-/g, " "), // Replace hyphens with spaces
      normalizedTeamName.replace(/ /g, ""), // Remove all spaces
    ];

    for (const variation of teamVariations) {
      if (variation && variation !== normalizedTeamName && variation.length > 1) {
        for (const getTeamFunc of leagueFunctions) {
          try {
            const logo = getTeamFunc(variation);
            if (logo) {
              return logo;
            }
          } catch (error) {
            continue;
          }
        }
      }
    }

    return null;
  };

  // Get country flag image for player with club logo fallback
  const getPlayerCountryFlag = (nationality: string) => {
    if (!nationality) return null;

    // Map common nationality variations to country names
    const nationalityMap: { [key: string]: string } = {
      "s.korea": "s_korea",
      "south korea": "s_korea",
      korea: "s_korea",
      saudi: "saudi",
      "saudi arabia": "saudi",
      "ivory coast": "ivory_coast",
      "cote d'ivoire": "ivory_coast",
      congo: "congo",
      "dr congo": "congo",
      "democratic republic of congo": "congo",
      usa: "united_states",
      "united states": "united_states",
      america: "united_states",
    };

    // Normalize nationality name
    const normalizedNationality = nationality.toLowerCase().trim();

    // Check if we have a mapping for this nationality
    const mappedCountry = nationalityMap[normalizedNationality];
    const countryToSearch = mappedCountry || normalizedNationality;

    const countryImage = getCountryImage(countryToSearch);

    return countryImage;
  };

  // Smart logo function that tries country first, then club logo
  const getPlayerLogo = (player: Player) => {
    // Validate player data
    if (!player) {
      return { type: "fallback", initials: "??" };
    }

    const playerNationality = player.nationality?.trim();
    const playerTeam = player.team?.trim();

    // First try to get country flag
    const countryFlag = playerNationality ? getPlayerCountryFlag(playerNationality) : null;

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

  const navigateToCommunity = () => {
    try {
      router.push({
        pathname: "/post-my-lineup-community",
        params: {
          formation: formation,
          managerName: managerName,
          lineup: JSON.stringify(lineup),
          currentDate: currentDate,
        },
      });
    } catch (error) {
      console.error("Error navigating to community:", error);
      Alert.alert("Error", "Failed to open community posting");
    }
  };

  const handleCommunity = async () => {
    setIsAgreementVisible(true);
  };

  const handleAgreementConfirm = () => {
    setIsAgreementVisible(false);
    navigateToCommunity();
  };

  const handleAgreementClose = () => {
    setIsAgreementVisible(false);
  };

  const handleSave = async () => {
    try {
      Alert.alert("Success", "Lineup saved successfully!", [
        { text: "OK", style: "default" },
      ]);
    } catch (error) {
      console.error("Error saving lineup:", error);
      Alert.alert("Error", "Failed to save lineup");
    }
  };

  const handleShare = async () => {
    try {
      // Navigate to the share screen with lineup data
      router.push({
        pathname: "/share-my-lineup",
        params: {
          formation: formation,
          managerName: managerName,
          lineup: JSON.stringify(lineup),
          currentDate: currentDate,
        },
      });
    } catch (error) {
      console.error("Error navigating to share screen:", error);
      Alert.alert("Error", "Failed to open share screen");
    }
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
              { translateX: -27 }, // Half of player circle width for centering
              { translateY: -27 }, // Half of player circle height for centering
            ],
          },
        ]}
      >
        {position.player ? (
          <View style={styles.playerSlot}>
            {/* Player Image */}
            <View style={styles.playerImageContainer}>
              {(() => {
                // Check if player has a remote URL image (from national team API)
                if (
                  position.player.image &&
                  position.player.image.startsWith("http")
                ) {
                  return (
                    <Image
                      source={{ uri: position.player.image }}
                      style={styles.playerImage}
                      resizeMode="cover"
                      fadeDuration={0}
                      loadingIndicatorSource={undefined}
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
                  // Fallback to placeholder with initials if no image
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

              {/* Smart Logo Badge (Country Flag or Club Logo) */}
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
                        // Fallback to text initials
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
          </View>
        ) : (
          <View
            style={[
              styles.emptySlot,
              {
                backgroundColor:
                  theme.colors.background === "#FFFFFF" ||
                  theme.colors.background === "#ffffff"
                    ? "rgba(255, 255, 255, 0.9)"
                    : "rgba(255, 255, 255, 0.85)",
                borderColor:
                  theme.colors.background === "#FFFFFF" ||
                  theme.colors.background === "#ffffff"
                    ? "rgba(128, 128, 128, 0.2)"
                    : "rgba(128, 128, 128, 0.3)",
              },
            ]}
          >
            <Text style={[styles.playerPlus, { color: "#999999" }]}>+</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.colors.background,
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.6}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          <ArrowLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          My Champs Sports Lineup
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Formation Type and Manager Selector */}
        <View style={styles.formationHeader}>
          <View style={styles.formationRow}>
            <Text style={[styles.formationType, { color: theme.colors.text }]}>
              {formation} Formation
            </Text>

            <TouchableOpacity
              style={styles.managerSelector}
              onPress={() => setIsManagerModalVisible(true)}
              activeOpacity={0.7}
            >
              <View style={styles.managerContent}>
                {(() => {
                  const managerImage = getManagerImageFromName(managerName);

                  if (managerImage) {
                    return (
                      <Image
                        source={managerImage}
                        style={styles.managerPortrait}
                        resizeMode="cover"
                      />
                    );
                  } else {
                    return (
                      <View
                        style={[
                          styles.managerPortrait,
                          {
                            backgroundColor:
                              theme.colors.background === "#FFFFFF" ||
                              theme.colors.background === "#ffffff"
                                ? "rgba(128, 128, 128, 0.05)"
                                : "rgba(128, 128, 128, 0.05)",
                            borderColor:
                              theme.colors.background === "#FFFFFF" ||
                              theme.colors.background === "#ffffff"
                                ? "rgba(128, 128, 128, 0.08)"
                                : "rgba(128, 128, 128, 0.1)",
                          },
                        ]}
                      />
                    );
                  }
                })()}
                <View style={styles.managerNameRow}>
                  <Text
                    style={[styles.managerText, { color: theme.colors.text }]}
                  >
                    {managerName}
                  </Text>
                  <ChevronDown size={12} color={theme.colors.text} />
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Football Pitch */}
        <View style={styles.pitchContainer}>
          <View style={styles.pitch}>
            <Image
              source={require("@/assets/images/soccer-pitch/soccer-pitch.png")}
              style={styles.pitchImage}
              resizeMode="cover"
            />

            {/* Players */}
            {lineup.map((position) => renderPlayer(position))}
          </View>
        </View>

        {/* Manager and Date Info - Directly Under Pitch */}
        <View
          style={[
            styles.infoSection,
            {
              backgroundColor: theme.colors.backgroundSecondary,
              borderTopColor: theme.colors.border,
              borderBottomColor: theme.colors.border,
            },
          ]}
        >
        <View style={styles.managerSection}>
          {(() => {
            const managerImage = getManagerImageFromName(managerName);

            if (managerImage) {
              return (
                <Image
                  source={managerImage}
                  style={styles.managerCircle}
                  resizeMode="cover"
                />
              );
            } else {
              return (
                <View
                  style={[
                    styles.managerCircle,
                    {
                      backgroundColor:
                        theme.colors.background === "#FFFFFF" ||
                        theme.colors.background === "#ffffff"
                          ? "rgba(128, 128, 128, 0.05)"
                          : "rgba(128, 128, 128, 0.05)",
                      borderColor:
                        theme.colors.background === "#FFFFFF" ||
                        theme.colors.background === "#ffffff"
                          ? "rgba(128, 128, 128, 0.08)"
                          : "rgba(128, 128, 128, 0.1)",
                    },
                  ]}
                />
              );
            }
          })()}
          <View style={styles.managerTextContainer}>
            <Text style={[styles.managerLabel, { color: theme.colors.text }]}>
              Manager:
            </Text>
            <Text style={[styles.managerName, { color: theme.colors.text }]}>
              {managerName}
            </Text>
          </View>
        </View>

        <View style={styles.dateSection}>
          <Text
            style={[styles.dateText, { color: theme.colors.textSecondary }]}
          >
            {currentDate}
          </Text>
        </View>
      </View>
      </ScrollView>

      {/* Manager Selector Modal */}
      <MyLineupManagerSelector
        visible={isManagerModalVisible}
        onClose={() => setIsManagerModalVisible(false)}
        onManagerSelect={handleManagerSelect}
        currentManager={managerName}
      />

      <PostMyLineupAgreement
        visible={isAgreementVisible}
        onClose={handleAgreementClose}
        onConfirm={handleAgreementConfirm}
      />

      {/* Bottom Action Buttons */}
      <View
        style={[
          styles.actionButtons,
          { backgroundColor: theme.colors.background },
        ]}
      >
        {/* Community Button */}
        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.communityButton,
            { borderColor: theme.colors.border },
          ]}
          onPress={handleCommunity}
          activeOpacity={0.8}
        >
          <Users size={20} color={theme.colors.text} />
          <Text style={[styles.actionButtonText, { color: theme.colors.text }]}>
            Community
          </Text>
        </TouchableOpacity>

        {/* Save Button */}
        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.saveButton,
            { borderColor: theme.colors.border },
          ]}
          onPress={handleSave}
          activeOpacity={0.8}
        >
          <Save size={20} color={theme.colors.text} />
          <Text style={[styles.actionButtonText, { color: theme.colors.text }]}>
            Save
          </Text>
        </TouchableOpacity>

        {/* Share Button */}
        <TouchableOpacity
          style={[styles.actionButton, styles.shareButton]}
          onPress={handleShare}
          activeOpacity={0.8}
        >
          <Share2 size={20} color="#FFFFFF" />
          <Text style={[styles.actionButtonText, { color: "#FFFFFF" }]}>
            Share
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Header Styles
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
  },

  // Scroll View
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 0,
  },

  // Formation Header
  formationHeader: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  formationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  formationType: {
    fontSize: 16,
    fontWeight: "500",
    flex: 1,
  },
  managerSelector: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    paddingVertical: 6,
    minWidth: 120,
    maxWidth: 140,
    marginLeft: 8,
  },
  managerContent: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  managerNameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  managerPortrait: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: "rgba(128, 128, 128, 0.3)",
    marginBottom: 4,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  managerText: {
    fontSize: 11,
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 13,
    marginRight: 2,
  },

  // Pitch Container
  pitchContainer: {
    justifyContent: "flex-start",
    alignItems: "center",
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
    marginTop: -16,
    marginBottom: -48,
  },
  pitch: {
    width: screenWidth,
    height: screenWidth * 1.3,
    maxHeight: screenHeight * 0.55,
    borderRadius: 8,
    position: "relative",
    overflow: "hidden",
  },
  pitchImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
    top: 0,
    left: 0,
  },

  // Player position styles
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
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 4,
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
    backgroundColor: "#4A8B3B",
    alignItems: "center",
    justifyContent: "center",
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  playerInitials: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },

  // Smart logo badge (country flag or club logo)
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

  // Empty slot styles
  emptySlot: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  playerPlus: {
    fontSize: 20,
    fontWeight: "200",
    opacity: 0.5,
  },

  // Info Section
  infoSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginTop: -48,
    minHeight: 80,
  },
  managerSection: {
    flexDirection: "column",
    alignItems: "center",
  },
  managerCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: "rgba(128, 128, 128, 0.3)",
    marginBottom: 8,
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
  managerTextContainer: {
    alignItems: "center",
  },
  managerLabel: {
    fontSize: 14,
    fontWeight: "400",
    marginBottom: 2,
    textAlign: "center",
  },
  managerName: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  dateSection: {},
  dateText: {
    fontSize: 18,
    fontWeight: "500",
  },

  // Action Buttons
  actionButtons: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 8,
    paddingBottom: 20,
    backgroundColor: "transparent",
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 6,
    borderRadius: 24,
    borderWidth: 1,
  },
  communityButton: {
    backgroundColor: "transparent",
  },
  saveButton: {
    backgroundColor: "transparent",
  },
  shareButton: {
    backgroundColor: "#FF6B6B",
    borderColor: "#FF6B6B",
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 6,
  },
});
