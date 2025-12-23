import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
  Platform,
  Modal,
  ScrollView,
} from "react-native";
import { Camera, Download, X, Share2, MessageCircle, Send } from "lucide-react-native";
import { useTheme } from "@/hooks/useTheme";
import type { MatchWithRating, WeatherData, LineupData } from "@/types/match-details/match-details";
// import * as Sharing from "expo-sharing"; // ⚠️ TEMPORARILY DISABLED - Native module issue
// import * as FileSystem from "expo-file-system"; // ⚠️ TEMPORARILY DISABLED - Native module issue
// import * as MediaLibrary from "expo-media-library"; // ⚠️ TEMPORARILY DISABLED - Native module issue

// Safely import react-native-view-shot with error handling
let captureRef: ((ref: React.RefObject<View>, options?: any) => Promise<string>) | null = null;
let viewShotAvailable = false;

try {
  const viewShotModule = require("react-native-view-shot");
  if (viewShotModule && viewShotModule.captureRef) {
    captureRef = viewShotModule.captureRef;
    viewShotAvailable = true;
  }
} catch (error) {
  console.warn("react-native-view-shot is not available:", error);
  viewShotAvailable = false;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

interface MatchDayScreenshotProps {
  match: MatchWithRating;
  lineupData: LineupData | null;
  weatherData?: WeatherData | null;
  homeTeamLogo?: string;
  awayTeamLogo?: string;
  currentMinute?: number;
  sport?: string;
}

export default function MatchDayScreenshot({
  match,
  lineupData,
  weatherData,
  homeTeamLogo,
  awayTeamLogo,
  currentMinute = 0,
  sport = "football",
}: MatchDayScreenshotProps) {
  const theme = useTheme();
  const screenshotRef = useRef<View>(null);
  const [isShareModalVisible, setIsShareModalVisible] = useState(false);
  const [capturedImageUri, setCapturedImageUri] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [moduleAvailable, setModuleAvailable] = useState(viewShotAvailable);

  // Check module availability on mount
  useEffect(() => {
    // Verify module is actually functional
    if (viewShotAvailable && captureRef) {
      setModuleAvailable(true);
    } else {
      setModuleAvailable(false);
    }
  }, []);

  // Get match status text (HT, FT, or live timer)
  const getMatchStatusText = () => {
    const status = match.status;
    const statusShort = match.fixture?.status?.short;

    if (status === "finished" || statusShort === "FT") {
      return "FT";
    } else if (statusShort === "HT") {
      return "HT";
    } else if (status === "live") {
      // Show current minute for live matches
      if (currentMinute >= 90) {
        return `90+${currentMinute - 90}'`;
      }
      return `${currentMinute}'`;
    }
    return "";
  };

  // Format match date/time
  const formatMatchDateTime = () => {
    if (match.startTime) {
      const date = new Date(match.startTime);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      return `${year}/${month}/${day} ${hours}:${minutes}`;
    }
    return "";
  };

  // Get score display
  const getScoreDisplay = () => {
    if (match.score) {
      const [homeScore, awayScore] = match.score.split("-").map((s) => s.trim());
      return { home: homeScore, away: awayScore };
    }
    return { home: "0", away: "0" };
  };

  const scores = getScoreDisplay();
  const matchStatus = getMatchStatusText();

  // Capture screenshot
  const handleCapture = async () => {
    if (!screenshotRef.current || isCapturing) return;

    // Check if module is available
    if (!moduleAvailable || !captureRef) {
      Alert.alert(
        "Screenshot Feature Unavailable",
        "The screenshot feature requires the native module to be properly installed and linked.\n\n" +
        "To fix this:\n" +
        "1. Make sure 'react-native-view-shot' is installed\n" +
        "2. Rebuild your native app:\n" +
        "   - iOS: npx expo run:ios\n" +
        "   - Android: npx expo run:android\n" +
        "3. Restart the development server\n\n" +
        "Note: You cannot use this feature in Expo Go. You need a development build.",
        [{ text: "OK" }]
      );
      return;
    }

    setIsCapturing(true);
    try {
      const uri = await captureRef(screenshotRef, {
        format: "jpg",
        quality: 0.9,
      });

      console.log("Screenshot captured:", uri);
      setCapturedImageUri(uri);
      setIsShareModalVisible(true);
    } catch (error: any) {
      console.error("Error capturing screenshot:", error);
      
      // Provide more specific error messages
      const errorMessage = error?.message || "Unknown error";
      if (errorMessage.includes("RNViewShot") || errorMessage.includes("could not be found")) {
        Alert.alert(
          "Native Module Not Found",
          "The RNViewShot native module is not properly linked.\n\n" +
          "Please rebuild your app:\n" +
          Platform.OS === "ios" 
            ? "npx expo run:ios"
            : "npx expo run:android",
          [{ text: "OK" }]
        );
      } else {
        Alert.alert("Error", `Failed to capture screenshot: ${errorMessage}`);
      }
    } finally {
      setIsCapturing(false);
    }
  };

  // Download screenshot to phone's album (TEMPORARILY DISABLED)
  const handleDownload = async () => {
    if (!capturedImageUri) {
      Alert.alert("Error", "No screenshot to download");
      return;
    }

    // ⚠️ TEMPORARILY DISABLED - expo-media-library native module issue
    Alert.alert(
      "Feature Temporarily Unavailable",
      "Screenshot download is temporarily disabled due to a native module issue. We're working on fixing this.",
      [{ text: "OK" }]
    );

    /* ORIGINAL CODE - RESTORE WHEN expo-media-library IS FIXED
    try {
      // Request media library permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please grant permission to save images to your photo library"
        );
        return;
      }

      // Save to media library
      const asset = await MediaLibrary.createAssetAsync(capturedImageUri);
      await MediaLibrary.createAlbumAsync("Champs Sports Lovers", asset, false);

      Alert.alert(
        "Success",
        "Match Day screenshot saved to your photo library!",
        [{ text: "OK", onPress: () => setIsShareModalVisible(false) }]
      );
    } catch (error) {
      console.error("Error downloading screenshot:", error);
      Alert.alert("Error", "Failed to save screenshot to photo library");
    }
    */
  };

  // Share via native share (TEMPORARILY DISABLED)
  const handleShare = async () => {
    if (!capturedImageUri) {
      Alert.alert("Error", "No screenshot to share");
      return;
    }

    // ⚠️ TEMPORARILY DISABLED - expo-sharing native module issue
    Alert.alert(
      "Feature Temporarily Unavailable",
      "Sharing functionality is temporarily disabled. Please use the Download option to save the screenshot to your device.",
      [{ text: "OK", onPress: () => setIsShareModalVisible(false) }]
    );

    /* ORIGINAL CODE - RESTORE WHEN expo-sharing IS FIXED
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(capturedImageUri, {
          mimeType: "image/jpeg",
          dialogTitle: `Match Day: ${match.home.name} vs ${match.away.name}`,
        });
        setIsShareModalVisible(false);
      } else {
        Alert.alert("Error", "Sharing is not available on this device");
      }
    } catch (error) {
      console.error("Error sharing screenshot:", error);
      Alert.alert("Error", "Failed to share screenshot");
    }
    */
  };

  // Share to specific platform
  const handleShareToPlatform = (platform: string) => {
    // Close modal and initiate native share
    setIsShareModalVisible(false);
    setTimeout(() => {
      handleShare();
    }, 300);
  };

  // Calculate player positions based on formation
  const calculatePlayerPositions = (
    players: any[],
    formation: string,
    isHome: boolean
  ) => {
    const startingPlayers = players?.filter((p: any) => p.isStarting) || [];
    const formationParts = formation.split("-").map(Number);
    const positions: { player: any; x: number; y: number }[] = [];

    let playerIndex = 0;

    // Process each formation line
    formationParts.forEach((lineCount, lineIndex) => {
      const yPosition = isHome
        ? 15 + (lineIndex + 1) * (70 / (formationParts.length + 1))
        : 85 - (lineIndex + 1) * (70 / (formationParts.length + 1));

      for (let i = 0; i < lineCount; i++) {
        const xPosition = 100 / (lineCount + 1) * (i + 1);
        if (startingPlayers[playerIndex]) {
          positions.push({
            player: startingPlayers[playerIndex],
            x: xPosition,
            y: yPosition,
          });
          playerIndex++;
        }
      }
    });

    // Add goalkeeper
    if (startingPlayers[playerIndex]) {
      positions.push({
        player: startingPlayers[playerIndex],
        x: 50,
        y: isHome ? 8 : 92,
      });
    }

    return positions;
  };

  const homePlayerPositions = lineupData
    ? calculatePlayerPositions(
        lineupData.homeTeam.players,
        lineupData.homeTeam.formation,
        true
      )
    : [];

  const awayPlayerPositions = lineupData
    ? calculatePlayerPositions(
        lineupData.awayTeam.players,
        lineupData.awayTeam.formation,
        false
      )
    : [];

  const homeColor = lineupData?.homeTeam.colors?.primary || theme.colors.primary;
  const awayColor = lineupData?.awayTeam.colors?.primary || "#2196F3";

  return (
    <View style={styles.container}>
      {/* Capture Button */}
      <TouchableOpacity
        style={[
          styles.captureButton, 
          { 
            backgroundColor: moduleAvailable ? theme.colors.primary : "#666",
            opacity: moduleAvailable ? 1 : 0.6,
          }
        ]}
        onPress={handleCapture}
        disabled={isCapturing || !moduleAvailable}
        activeOpacity={0.8}
      >
        <Camera size={20} color="#FFFFFF" />
        <Text style={styles.captureButtonText}>
          {isCapturing ? "Capturing..." : moduleAvailable ? "Capture Match Day" : "Screenshot Unavailable"}
        </Text>
      </TouchableOpacity>
      
      {!moduleAvailable && (
        <View style={styles.warningContainer}>
          <Text style={[styles.warningText, { color: theme.colors.textSecondary }]}>
            ⚠️ Screenshot feature requires app rebuild
          </Text>
        </View>
      )}

      {/* Screenshot Template - Positioned offscreen but rendered for capture */}
      <View style={styles.screenshotWrapper}>
        <View ref={screenshotRef} collapsable={false} style={styles.screenshotContainer}>
          {/* Match Day Header */}
          <View style={styles.header}>
            <View style={styles.headerGradient}>
              <Text style={styles.headerTitle}>Match Day</Text>
            </View>
          </View>

          {/* League and Date Info */}
          <View style={[styles.leagueSection, { backgroundColor: theme.colors.backgroundSecondary }]}>
            <Text style={[styles.leagueName, { color: theme.colors.text }]}>
              {match.league}
            </Text>
            <Text style={[styles.matchDateTime, { color: theme.colors.textSecondary }]}>
              {formatMatchDateTime()}
            </Text>
          </View>

          {/* Scores Section */}
          <View style={[styles.scoresSection, { backgroundColor: theme.colors.backgroundSecondary }]}>
            {/* Home Team */}
            <View style={styles.teamSection}>
              {homeTeamLogo && (
                <Image
                  source={{ uri: homeTeamLogo }}
                  style={styles.teamLogo}
                  resizeMode="contain"
                />
              )}
              <Text style={[styles.teamName, { color: theme.colors.text }]} numberOfLines={1}>
                {match.home.name}
              </Text>
            </View>

            {/* Score Display */}
            <View style={styles.scoreDisplay}>
              <Text style={[styles.scoreText, { color: theme.colors.text }]}>
                {scores.home} - {scores.away}
              </Text>
              {matchStatus && (
                <View style={[styles.statusBadge, { 
                  backgroundColor: match.status === "live" ? "#FF4444" : theme.colors.textSecondary 
                }]}>
                  <Text style={styles.statusText}>{matchStatus}</Text>
                </View>
              )}
            </View>

            {/* Away Team */}
            <View style={styles.teamSection}>
              {awayTeamLogo && (
                <Image
                  source={{ uri: awayTeamLogo }}
                  style={styles.teamLogo}
                  resizeMode="contain"
                />
              )}
              <Text style={[styles.teamName, { color: theme.colors.text }]} numberOfLines={1}>
                {match.away.name}
              </Text>
            </View>
          </View>

          {/* Weather & Stadium Info */}
          {weatherData && (
            <View style={[styles.weatherSection, { backgroundColor: theme.colors.backgroundSecondary }]}>
              <View style={styles.weatherItem}>
                <Text style={[styles.weatherLabel, { color: theme.colors.textSecondary }]}>
                  Temperature
                </Text>
                <Text style={[styles.weatherValue, { color: theme.colors.text }]}>
                  {weatherData.temperature}
                </Text>
              </View>
              <View style={styles.weatherItem}>
                <Text style={[styles.weatherLabel, { color: theme.colors.textSecondary }]}>
                  Stadium
                </Text>
                <Text style={[styles.weatherValue, { color: theme.colors.text }]}>
                  Stadium
                </Text>
              </View>
              <View style={styles.weatherItem}>
                <Text style={[styles.weatherLabel, { color: theme.colors.textSecondary }]}>
                  Humidity
                </Text>
                <Text style={[styles.weatherValue, { color: theme.colors.text }]}>
                  {weatherData.humidity}
                </Text>
              </View>
            </View>
          )}

          {/* Lineup Display */}
          {lineupData && (
            <View style={[styles.lineupSection, { backgroundColor: theme.colors.backgroundSecondary }]}>
              <View style={styles.pitchContainer}>
                <Image
                  source={require("@/assets/matchIcons/football_pitch2.png")}
                  style={styles.pitchImage}
                  resizeMode="cover"
                />

                {/* Home Team Players */}
                {homePlayerPositions.map((pos, index) => (
                  <View
                    key={`home-${index}`}
                    style={[
                      styles.playerOnPitch,
                      {
                        left: `${pos.x}%`,
                        top: `${pos.y}%`,
                      },
                    ]}
                  >
                    <View style={[styles.playerCircle, { backgroundColor: homeColor }]}>
                      <Text style={styles.playerNumber}>{pos.player.number}</Text>
                    </View>
                  </View>
                ))}

                {/* Away Team Players */}
                {awayPlayerPositions.map((pos, index) => (
                  <View
                    key={`away-${index}`}
                    style={[
                      styles.playerOnPitch,
                      {
                        left: `${pos.x}%`,
                        top: `${pos.y}%`,
                      },
                    ]}
                  >
                    <View style={[styles.playerCircle, { backgroundColor: awayColor }]}>
                      <Text style={styles.playerNumber}>{pos.player.number}</Text>
                    </View>
                  </View>
                ))}
              </View>

              {/* Formation Info */}
              <View style={styles.formationInfo}>
                <View style={styles.formationItem}>
                  <Text style={[styles.formationLabel, { color: theme.colors.textSecondary }]}>
                    Formation:
                  </Text>
                  <Text style={[styles.formationValue, { color: theme.colors.text }]}>
                    {lineupData.homeTeam.formation}
                  </Text>
                </View>
                <View style={styles.formationDivider} />
                <View style={styles.formationItem}>
                  <Text style={[styles.formationLabel, { color: theme.colors.textSecondary }]}>
                    Formation:
                  </Text>
                  <Text style={[styles.formationValue, { color: theme.colors.text }]}>
                    {lineupData.awayTeam.formation}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* App Branding Footer */}
          <View style={[styles.footer, { backgroundColor: theme.colors.backgroundSecondary }]}>
            <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
              Champs Sports Lovers
            </Text>
          </View>
        </View>
      </View>

      {/* Custom Share Modal */}
      <Modal
        visible={isShareModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsShareModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackground}
            activeOpacity={1}
            onPress={() => setIsShareModalVisible(false)}
          />
          <View style={[styles.shareModal, { backgroundColor: theme.colors.background }]}>
            {/* Modal Header */}
            <View style={styles.shareModalHeader}>
              <Text style={[styles.shareModalTitle, { color: theme.colors.text }]}>
                Share Match Day
              </Text>
              <TouchableOpacity
                onPress={() => setIsShareModalVisible(false)}
                style={styles.closeButton}
              >
                <X size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            {/* Share Options */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.shareOptionsContainer}
            >
              {/* Download Option (First) */}
              <TouchableOpacity
                style={styles.shareOption}
                onPress={handleDownload}
                activeOpacity={0.7}
              >
                <View style={[styles.shareIconContainer, { backgroundColor: "#FF6B6B" }]}>
                  <Download size={28} color="#FFFFFF" />
                </View>
                <Text style={[styles.shareOptionText, { color: theme.colors.text }]}>
                  Download
                </Text>
              </TouchableOpacity>

              {/* WhatsApp */}
              <TouchableOpacity
                style={styles.shareOption}
                onPress={() => handleShareToPlatform("whatsapp")}
                activeOpacity={0.7}
              >
                <View style={[styles.shareIconContainer, { backgroundColor: "#25D366" }]}>
                  <MessageCircle size={28} color="#FFFFFF" />
                </View>
                <Text style={[styles.shareOptionText, { color: theme.colors.text }]}>
                  WhatsApp
                </Text>
              </TouchableOpacity>

              {/* Telegram */}
              <TouchableOpacity
                style={styles.shareOption}
                onPress={() => handleShareToPlatform("telegram")}
                activeOpacity={0.7}
              >
                <View style={[styles.shareIconContainer, { backgroundColor: "#0088cc" }]}>
                  <Send size={28} color="#FFFFFF" />
                </View>
                <Text style={[styles.shareOptionText, { color: theme.colors.text }]}>
                  Telegram
                </Text>
              </TouchableOpacity>

              {/* More Options */}
              <TouchableOpacity
                style={styles.shareOption}
                onPress={handleShare}
                activeOpacity={0.7}
              >
                <View style={[styles.shareIconContainer, { backgroundColor: theme.colors.primary }]}>
                  <Share2 size={28} color="#FFFFFF" />
                </View>
                <Text style={[styles.shareOptionText, { color: theme.colors.text }]}>
                  More
                </Text>
              </TouchableOpacity>
            </ScrollView>

            {/* Cancel Button */}
            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: theme.colors.backgroundSecondary }]}
              onPress={() => setIsShareModalVisible(false)}
              activeOpacity={0.7}
            >
              <Text style={[styles.cancelButtonText, { color: theme.colors.text }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // Don't use flex: 1, only take up space needed for button
  },
  captureButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    marginHorizontal: 16,
    marginVertical: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  captureButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  screenshotWrapper: {
    position: "absolute",
    left: -9999, // Position offscreen
    top: -9999,
    width: screenWidth,
    height: screenHeight,
  },
  screenshotContainer: {
    width: screenWidth,
    height: screenHeight * 0.9,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#1a1a1a",
  },

  // Header Section
  header: {
    height: 60,
    overflow: "hidden",
  },
  headerGradient: {
    flex: 1,
    backgroundColor: "#DC143C",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
  },

  // League Section
  leagueSection: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  leagueName: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  matchDateTime: {
    fontSize: 12,
  },

  // Scores Section
  scoresSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  teamSection: {
    flex: 1,
    alignItems: "center",
    gap: 8,
  },
  teamLogo: {
    width: 50,
    height: 50,
  },
  teamName: {
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  scoreDisplay: {
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
  },
  scoreText: {
    fontSize: 36,
    fontWeight: "bold",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },

  // Weather Section
  weatherSection: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  weatherItem: {
    alignItems: "center",
    gap: 4,
  },
  weatherLabel: {
    fontSize: 10,
  },
  weatherValue: {
    fontSize: 12,
    fontWeight: "600",
  },

  // Lineup Section
  lineupSection: {
    marginTop: 8,
    paddingVertical: 16,
  },
  pitchContainer: {
    width: screenWidth - 64,
    height: (screenWidth - 64) * 0.8,
    marginHorizontal: 16,
    position: "relative",
    borderRadius: 8,
    overflow: "hidden",
  },
  pitchImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  playerOnPitch: {
    position: "absolute",
    alignItems: "center",
    transform: [{ translateX: -15 }, { translateY: -15 }],
  },
  playerCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  playerNumber: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },

  // Formation Info
  formationInfo: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 12,
  },
  formationItem: {
    alignItems: "center",
    gap: 4,
  },
  formationLabel: {
    fontSize: 10,
  },
  formationValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  formationDivider: {
    width: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },

  // Footer
  footer: {
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 8,
  },
  footerText: {
    fontSize: 12,
    fontWeight: "500",
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalBackground: {
    flex: 1,
  },
  shareModal: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  shareModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  shareModalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  closeButton: {
    padding: 4,
  },
  shareOptionsContainer: {
    paddingVertical: 10,
    gap: 20,
  },
  shareOption: {
    alignItems: "center",
    gap: 8,
    width: 80,
  },
  shareIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  shareOptionText: {
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
  },
  cancelButton: {
    marginTop: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  warningContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: "center",
  },
  warningText: {
    fontSize: 12,
    textAlign: "center",
  },
});

