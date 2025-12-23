import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
  Alert,
  Share,
  Modal,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTheme } from "@/hooks/useTheme";
import { ArrowLeft } from "lucide-react-native";
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

export default function ShareMyLineupScreen() {
  const router = useRouter();
  const theme = useTheme();
  const params = useLocalSearchParams();

  const [formation, setFormation] = useState("4-4-2");
  const [lineup, setLineup] = useState<LineupPosition[]>([]);
  const [managerName, setManagerName] = useState("Team Manager");
  const [currentDate, setCurrentDate] = useState("2025.11.07");
  const [isShareModalVisible, setIsShareModalVisible] = useState(false);
  const [capturedImageUri, setCapturedImageUri] = useState<string | null>(null);

  React.useEffect(() => {
    console.log("ShareMyLineupScreen mounted");
    console.log("Params received:", params);
    
    // Load data from params
    if (params?.formation && typeof params.formation === "string") {
      setFormation(params.formation);
      console.log("Formation set:", params.formation);
    }
    
    if (params?.lineup && typeof params.lineup === "string") {
      try {
        const lineupData = JSON.parse(params.lineup);
        setLineup(lineupData);
        console.log("Lineup data loaded:", lineupData.length, "positions");
      } catch (error) {
        console.log("Error parsing lineup data:", error);
      }
    }

    if (params?.managerName && typeof params.managerName === "string") {
      setManagerName(params.managerName);
      console.log("Manager name set:", params.managerName);
    }

    // Set current date
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    setCurrentDate(`${year}.${month}.${day}`);

    // Auto-show share modal after a delay
    setTimeout(() => {
      setIsShareModalVisible(true);
    }, 1000);
  }, []);

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

  const handleSharePlatform = async (platform: string) => {
    try {
      let shareMessage = `Check out my ${formation} formation lineup! 🏆⚽\n\nManager: ${managerName}\nDate: ${currentDate}\n\n#MyChamps #Football #Lineup`;

      await Share.share({
        message: shareMessage,
        title: "My Champs Lineup",
      });
      
      setIsShareModalVisible(false);
    } catch (error) {
      console.error("Error sharing:", error);
      Alert.alert("Error", "Failed to share lineup");
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
    <SafeAreaView style={[styles.container, { backgroundColor: "#1a1a1a" }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: "#333" }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Share Lineup</Text>
      </View>

      {/* Lineup Template */}
      <View style={styles.screenshotContainer}>
        {/* Red Header Banner */}
        <View style={styles.templateHeader}>
          <Text style={styles.templateTitle}>My Champs Lineup</Text>
        </View>

        {/* Formation Label */}
        <View style={styles.formationLabelContainer}>
          <Text style={styles.formationLabel}>{formation} Formation</Text>
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

        {/* Manager Info */}
        <View style={styles.managerInfo}>
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
                        backgroundColor: "rgba(128, 128, 128, 0.05)",
                        borderColor: "rgba(128, 128, 128, 0.1)",
                      },
                    ]}
                  />
                );
              }
            })()}
            <View style={styles.managerTextContainer}>
              <Text style={styles.managerLabel}>Manager:</Text>
              <Text style={styles.managerName}>{managerName}</Text>
            </View>
          </View>
          <View style={styles.dateSection}>
            <Text style={styles.dateText}>{currentDate}</Text>
          </View>
        </View>
      </View>

      {/* Share Modal */}
      <Modal
        visible={isShareModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsShareModalVisible(false)}
      >
        <View style={styles.shareModalContainer}>
          <TouchableOpacity
            style={styles.shareOverlay}
            onPress={() => setIsShareModalVisible(false)}
            activeOpacity={1}
          />
          <View style={styles.shareModal}>
            {/* Share Options */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.shareOptions}
              style={styles.shareScrollView}
            >
              {/* WhatsApp */}
              <TouchableOpacity
                style={styles.shareOption}
                onPress={() => handleSharePlatform("WhatsApp")}
              >
                <View style={[styles.shareIcon, { backgroundColor: "#25D366" }]}>
                  <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"
                      fill="#FFFFFF"
                    />
                  </Svg>
                </View>
                <Text style={styles.shareLabel}>WhatsApp</Text>
              </TouchableOpacity>

              {/* Facebook */}
              <TouchableOpacity
                style={styles.shareOption}
                onPress={() => handleSharePlatform("Facebook")}
              >
                <View style={[styles.shareIcon, { backgroundColor: "#1877F2" }]}>
                  <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                      fill="#FFFFFF"
                    />
                  </Svg>
                </View>
                <Text style={styles.shareLabel}>Facebook</Text>
              </TouchableOpacity>

              {/* X (Twitter) */}
              <TouchableOpacity
                style={styles.shareOption}
                onPress={() => handleSharePlatform("X")}
              >
                <View style={[styles.shareIcon, { backgroundColor: "#000000" }]}>
                  <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
                      fill="#FFFFFF"
                    />
                  </Svg>
                </View>
                <Text style={styles.shareLabel}>X</Text>
              </TouchableOpacity>

              {/* Phone */}
              <TouchableOpacity
                style={styles.shareOption}
                onPress={() => handleSharePlatform("Phone")}
              >
                <View style={[styles.shareIcon, { backgroundColor: "#34C759" }]}>
                  <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"
                      fill="#FFFFFF"
                    />
                  </Svg>
                </View>
                <Text style={styles.shareLabel}>Phone</Text>
              </TouchableOpacity>
            </ScrollView>

            {/* Cancel Button */}
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setIsShareModalVisible(false)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    color: "#FFFFFF",
  },

  // Screenshot Container
  screenshotContainer: {
    flex: 1,
    backgroundColor: "#2a2a2a",
    margin: 16,
    borderRadius: 12,
    overflow: "hidden",
  },

  // Template Header (Red Banner)
  templateHeader: {
    backgroundColor: "#DC143C",
    paddingVertical: 20,
    paddingHorizontal: 24,
    alignItems: "center",
    position: "relative",
  },
  templateTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
  },

  // Formation Label
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

  // Pitch Container
  pitchContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 16,
    backgroundColor: "#2a2a2a",
  },
  pitch: {
    width: screenWidth - 64,
    height: (screenWidth - 64) * 1.6,
    maxHeight: screenHeight * 0.65,
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

  // Player Styles
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

  // Country/Club Badge
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

  // Empty Slot
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

  // Manager Info
  managerInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: "#2a2a2a",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#444",
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
    color: "#FFFFFF",
  },
  managerName: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    color: "#FFFFFF",
  },
  dateSection: {},
  dateText: {
    fontSize: 18,
    fontWeight: "500",
    color: "#CCCCCC",
  },

  // Share Modal Styles
  shareModalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  shareOverlay: {
    flex: 1,
  },
  shareModal: {
    backgroundColor: "#1a1a1a",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  shareScrollView: {
    paddingHorizontal: 20,
  },
  shareOptions: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
  shareOption: {
    alignItems: "center",
    marginHorizontal: 20,
  },
  shareIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  shareLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#FFFFFF",
    textAlign: "center",
  },
  cancelButton: {
    alignItems: "center",
    paddingVertical: 16,
    marginTop: 20,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#CCCCCC",
  },
});