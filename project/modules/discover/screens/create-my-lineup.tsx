import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Animated,
  Easing,
  Dimensions,
} from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { Plus } from "lucide-react-native";
import { getCountryImage } from "../../../assets/images/countries/index";
import { getPlayerImage } from "../../../assets/images/players/index";
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
  team: string;
  image: string;
  nationality: string;
}

interface LineupPosition {
  id: string;
  x: number;
  y: number;
  player: Player | null;
}

interface CreateMyLineupProps {
  formation: string;
  lineup: LineupPosition[];
  onPlayerSelect: (positionId: string) => void;
  onPlayerReplace: (positionId: string, player: Player) => void;
  selectedPlayers?: Player[];
  selectedPositionId?: string | null;
  animatedValues: React.MutableRefObject<{ [key: string]: Animated.ValueXY }>;
}

/**
 * Smart Logo System Documentation
 * ===============================
 *
 * This component implements a smart logo fallback system for player badges:
 *
 * 1. PRIMARY: Country Flag
 *    - Attempts to show the player's national team flag
 *    - Only works if country is available in National Team screen
 *    - Available countries: Uganda, Argentina, France, Portugal, Spain, England,
 *      Brazil, Germany, Italy, Netherlands, Saudi, Belgium, Croatia, Morocco,
 *      Mexico, Japan, Egypt, Senegal, Denmark, Switzerland, Colombia, S.Korea
 *
 * 2. FALLBACK: Club Logo
 *    - If country flag unavailable, fetches player's current club logo
 *    - Searches across all 6 leagues: English PL, La Liga, Serie A,
 *      Bundesliga, League 1, Ugandan PL
 *    - Uses intelligent name matching with variations and abbreviations
 *
 * 3. FINAL FALLBACK: Text Initials
 *    - If neither country nor club logo available, shows nationality initials
 *    - Prevents generic placeholder icons
 *
 * This ensures all players have meaningful logos instead of fallback placeholders.
 */
export default function CreateMyLineup({
  formation,
  lineup,
  onPlayerSelect,
  onPlayerReplace,
  selectedPlayers = [],
  selectedPositionId,
  animatedValues,
}: CreateMyLineupProps) {
  const theme = useTheme();

  // Smart function to get club logo from all available leagues
  const getClubLogo = (teamName: string) => {
    if (!teamName || teamName.trim().length === 0) {
      console.log(`❌ No team name provided for club logo lookup`);
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
          console.log(`✅ Found club logo for: "${normalizedTeamName}"`);
          return logo;
        }
      } catch (error) {
        // Continue to next league if this one fails
        console.log(
          `⚠️ League function error for "${normalizedTeamName}":`,
          error,
        );
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
      // Common abbreviations
      normalizedTeamName.replace(/Manchester/gi, "Man").trim(),
      normalizedTeamName.replace(/Real /gi, "R ").trim(),
      normalizedTeamName.replace(/Athletic /gi, "").trim(),
    ];

    for (const variation of teamVariations) {
      if (
        variation &&
        variation !== normalizedTeamName &&
        variation.length > 1
      ) {
        for (const getTeamFunc of leagueFunctions) {
          try {
            const logo = getTeamFunc(variation);
            if (logo) {
              console.log(
                `✅ Found club logo for variation "${variation}" of "${normalizedTeamName}"`,
              );
              return logo;
            }
          } catch (error) {
            continue;
          }
        }
      }
    }

    console.log(`❌ No club logo found for: "${normalizedTeamName}"`);
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

  // Helper function to get available countries from National Team screen
  const getAvailableCountries = () => {
    return [
      "Uganda",
      "Argentina",
      "France",
      "Portugal",
      "Spain",
      "England",
      "Brazil",
      "Germany",
      "Italy",
      "Netherlands",
      "Saudi",
      "Belgium",
      "Croatia",
      "Morocco",
      "Mexico",
      "Japan",
      "Egypt",
      "Senegal",
      "Denmark",
      "Switzerland",
      "Colombia",
      "S.Korea",
    ];
  };

  // Smart logo function that tries country first, then club logo
  const getPlayerLogo = (player: Player) => {
    // Validate player data
    if (!player) {
      console.log(`❌ No player data provided`);
      return { type: "fallback", initials: "??" };
    }

    const playerName = player.name || "Unknown Player";
    const playerNationality = player.nationality?.trim();
    const playerTeam = player.team?.trim();

    // First try to get country flag
    const availableCountries = getAvailableCountries();
    const countryFlag = playerNationality
      ? getPlayerCountryFlag(playerNationality)
      : null;

    if (countryFlag) {
      console.log(
        `✅ Using country flag for ${playerName} (${playerNationality}) - Available in National Team`,
      );
      return {
        type: "country",
        source: countryFlag,
      };
    } else if (playerNationality) {
      console.log(
        `❌ Country "${playerNationality}" not available in National Team screen. Available countries:`,
        availableCountries.join(", "),
      );
    }

    // If no country flag, try to get club logo
    const clubLogo = playerTeam ? getClubLogo(playerTeam) : null;
    if (clubLogo) {
      console.log(`✅ Using club logo for ${playerName} (${playerTeam})`);
      return {
        type: "club",
        source: clubLogo,
      };
    }

    // If neither available, return fallback
    console.log(
      `⚠️ Using fallback for ${playerName} - no country or club logo found`,
    );

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

  // Check if this position is the currently selected position (for arrow indicator)
  const isSelectedPosition = (positionId: string) => {
    return selectedPositionId === positionId;
  };

  // Render individual player position
  const renderPlayerPosition = (position: LineupPosition) => {
    // Initialize animated values if not exists
    if (!animatedValues.current[position.id]) {
      animatedValues.current[position.id] = new Animated.ValueXY({
        x: position.x,
        y: position.y,
      });
    }

    const animatedStyle = {
      left: animatedValues.current[position.id].x.interpolate({
        inputRange: [0, 100],
        outputRange: ["0%", "100%"],
      }),
      top: animatedValues.current[position.id].y.interpolate({
        inputRange: [0, 100],
        outputRange: ["0%", "100%"],
      }),
      transform: [
        {
          translateX: animatedValues.current[position.id].x.interpolate({
            inputRange: [0, 100],
            outputRange: [-25, -25], // Half of player circle width for centering
          }),
        },
        {
          translateY: animatedValues.current[position.id].y.interpolate({
            inputRange: [0, 100],
            outputRange: [-25, -25], // Half of player circle height for centering
          }),
        },
      ],
    };

    return (
      <Animated.View
        key={position.id}
        style={[styles.playerPosition, animatedStyle]}
      >
        {position.player ? (
          <TouchableOpacity
            style={styles.playerSlot}
            onPress={() => onPlayerSelect(position.id)}
            activeOpacity={0.8}
          >
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

              {/* Downward Arrow Indicator - Only on selected position */}
              {isSelectedPosition(position.id) && (
                <View style={styles.arrowIndicator}>
                  <Text style={styles.arrowText}>▼</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
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
              // Highlight selected position with orange border
              selectedPositionId === position.id && {
                borderColor: "#FF8C00",
                borderWidth: 3,
                shadowColor: "#FF8C00",
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.5,
                shadowRadius: 8,
                elevation: 8,
              },
            ]}
            onPress={() => onPlayerSelect(position.id)}
            activeOpacity={0.7}
          >
            <Plus
              size={20}
              color={selectedPositionId === position.id ? "#FF8C00" : "#999999"}
            />
          </TouchableOpacity>
        )}
        {/* Downward Arrow Indicator - For both filled and empty positions */}
        {isSelectedPosition(position.id) && (
          <View style={styles.arrowIndicator}>
            <Text style={styles.arrowText}>▼</Text>
          </View>
        )}
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Football Pitch Background */}
      <View style={styles.pitchContainer}>
        <View style={styles.pitch}>
          <Image
            source={require("@/assets/images/soccer-pitch/soccer-pitch.png")}
            style={styles.pitchImage}
            resizeMode="cover"
          />

          {/* Render all player positions */}
          {lineup.map(renderPlayerPosition)}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pitchContainer: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 20,
    marginTop: -100,
  },
  pitch: {
    width: screenWidth,
    height: screenWidth * 1.4,
    maxHeight: screenHeight * 0.6,
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

  // Downward arrow indicator
  arrowIndicator: {
    position: "absolute",
    top: -10,
    left: "50%",
    marginLeft: -8,
    width: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FF4444",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  arrowText: {
    color: "#FFFFFF",
    fontSize: 10,
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
});
