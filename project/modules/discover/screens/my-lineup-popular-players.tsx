import React, { useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  Image,
  TouchableOpacity,
} from "react-native";
import { useTheme } from "@/hooks/useTheme";
import {
  getPlayerImage,
  hasRealImage,
} from "../../../assets/images/players/index";

const { width: screenWidth } = Dimensions.get("window");

/**
 * PLAYER DATA MANAGEMENT - IMPORTANT NOTES
 * =======================================
 *
 * This file contains player data for the popular players section.
 * When real-world transfers occur, update the "team" field for affected players.
 *
 * CURRENT TRANSFER STATUS (Last updated: January 2025):
 * - Alexander Isak: Transferred to Liverpool FC (Updated)
 * - All other players: Current data reflects their actual teams
 *
 * HOW TO UPDATE WHEN TRANSFERS HAPPEN:
 * 1. Verify transfer from reliable sources (official club announcements)
 * 2. Find the player in the popularPlayers array below
 * 3. Update their "team" field to match the team names used in league screens:
 *    - English PL: "Arsenal", "Liverpool", "Man City", "Newcastle", etc.
 *    - La Liga: "Barcelona", "R Madrid", "Atlético M", etc.
 *    - Serie A: "Juventus", "Inter Milan", "AC Milan", etc.
 *    - Bundesliga: "Bayern", "Dortmund", "RB Leipzig", etc.
 *    - League 1: "PSG", "AS Monaco", "Marseille", etc.
 *    - Ugandan PL: "KCCA FC", "Vipers SC", "Express FC", etc.
 * 4. Update the timestamp comment above
 *
 * The smart logo system will automatically show the correct club logo
 * once the team data is updated here.
 */

// Helper function to verify player data is up to date
// Call this manually in console for debugging: window.verifyPlayerData()
const verifyPlayerData = (players: any[]) => {
  console.log("📋 Player Data Verification Report:");
  console.log("==================================");

  players.forEach((player, index) => {
    console.log(
      `${index + 1}. ${player.name} - Team: ${player.team}, Country: ${player.nationality}`,
    );
  });

  console.log(
    "\n⚠️  If any player data looks outdated, update it in the popularPlayers array below.",
  );
  console.log(
    "💡 Remember: The smart logo system will automatically use the correct logo once data is updated.",
  );
  console.log(
    "🔧 To run this verification again, call: verifyPlayerData(popularPlayers) in console.",
  );
};

// Make verification function available globally for debugging
if (__DEV__) {
  (global as any).verifyPlayerData = verifyPlayerData;
}

interface Player {
  id: string;
  name: string;
  position: string;
  team: string;
  image: string;
  nationality: string;
  imageData?: {
    type: string;
    source?: any;
    initials?: string;
    color?: string;
  };
}

interface PopularPlayersProps {
  onPlayerSelect?: (player: Player) => void;
  onScroll?: (progress: number) => void;
  selectedPlayers?: Player[];
  selectedPositionId?: string | null;
  onShowAlert?: () => void;
}

export default function MyLinePopularPlayers({
  onPlayerSelect,
  onScroll,
  selectedPlayers = [],
  selectedPositionId,
  onShowAlert,
}: PopularPlayersProps) {
  const theme = useTheme();
  const scrollViewRef1 = useRef<ScrollView>(null);
  const scrollViewRef2 = useRef<ScrollView>(null);

  // Function to get player image with fallback to placeholder
  const getPlayerImageData = (playerName: string) => {
    const realImage = getPlayerImage(playerName);

    if (realImage) {
      return {
        type: "image",
        source: realImage,
      };
    }

    return {
      type: "placeholder",
      initials: getPlayerInitials(playerName),
      color: getPlayerColor(playerName),
    };
  };

  // Function to get player initials
  const getPlayerInitials = (playerName: string) => {
    const words = playerName.split(" ");
    if (words.length >= 2) {
      return `${words[0][0]}${words[1][0]}`.toUpperCase();
    } else if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }
    return "PL";
  };

  // Function to get player color based on name
  const getPlayerColor = (playerName: string) => {
    const colors = [
      "#FF6B35",
      "#4ECDC4",
      "#45B7D1",
      "#96CEB4",
      "#FFEAA7",
      "#DDA0DD",
      "#98D8C8",
      "#F7DC6F",
      "#BB8FCE",
      "#85C1E9",
      "#F8C471",
      "#82E0AA",
      "#F1948A",
      "#A569BD",
      "#5DADE2",
      "#58D68D",
      "#F4D03F",
      "#EC7063",
      "#AF7AC5",
      "#5499C7",
      "#52BE80",
      "#F39C12",
      "#E74C3C",
      "#9B59B6",
      "#3498DB",
    ];

    // Simple hash function to get consistent color for each player
    let hash = 0;
    for (let i = 0; i < playerName.length; i++) {
      hash = playerName.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  // Create array of all 88 players distributed across 2 rows (44 each)
  const createPlayerPlaceholders = (): Player[] => {
    const playerData = [
      // First row - 44 players with full data
      {
        name: "Dembélé",
        position: "RW",
        team: "Barcelona",
        nationality: "France",
      },
      {
        name: "B Saka",
        position: "RW",
        team: "Arsenal",
        nationality: "England",
      },
      {
        name: "Mbappe",
        position: "CF",
        team: "Real Madrid",
        nationality: "France",
      },
      {
        name: "W Saliba",
        position: "CB",
        team: "Arsenal",
        nationality: "France",
      },
      {
        name: "A Isak",
        position: "CF",
        team: "Liverpool", // UPDATED: Transferred to Liverpool FC
        nationality: "Sweden",
      },
      {
        name: "L Messi",
        position: "RW",
        team: "Inter Miami",
        nationality: "Argentina",
      },
      {
        name: "M Olise",
        position: "RW",
        team: "Bayern Munich",
        nationality: "France",
      },
      {
        name: "F Wirtz",
        position: "CAM",
        team: "Bayer Leverkusen",
        nationality: "Germany",
      },
      {
        name: "N Mendes",
        position: "LB",
        team: "PSG",
        nationality: "Portugal",
      },
      {
        name: "A Becker",
        position: "GK",
        team: "Liverpool",
        nationality: "Brazil",
      },
      {
        name: "Khvicha K",
        position: "LW",
        team: "Napoli",
        nationality: "Georgia",
      },
      {
        name: "C Palmer",
        position: "CAM",
        team: "Chelsea",
        nationality: "England",
      },
      {
        name: "T Courtois",
        position: "GK",
        team: "Real Madrid",
        nationality: "Belgium",
      },
      {
        name: "Wan-Bissaka",
        position: "RB",
        team: "Man United",
        nationality: "England",
      },
      {
        name: "D Rice",
        position: "CDM",
        team: "Arsenal",
        nationality: "England",
      },
      { name: "J Neves", position: "CM", team: "PSG", nationality: "Portugal" },
      {
        name: "Desire Doue",
        position: "LW",
        team: "PSG",
        nationality: "France",
      },
      {
        name: "Rodri",
        position: "CDM",
        team: "Man City",
        nationality: "Spain",
      },
      {
        name: "J Musiala",
        position: "CAM",
        team: "Bayern Munich",
        nationality: "Germany",
      },
      {
        name: "Mbuemo",
        position: "RW",
        team: "Brentford",
        nationality: "Cameroon",
      },
      { name: "A Hakimi", position: "RB", team: "PSG", nationality: "Morocco" },
      {
        name: "F Valverde",
        position: "CM",
        team: "Real Madrid",
        nationality: "Uruguay",
      },
      {
        name: "Vinicius Jr",
        position: "LW",
        team: "Real Madrid",
        nationality: "Brazil",
      },
      {
        name: "E Haaland",
        position: "CF",
        team: "Man City",
        nationality: "Norway",
      },
      { name: "Vitinha", position: "CM", team: "PSG", nationality: "Portugal" },
      {
        name: "van Dijk",
        position: "CB",
        team: "Liverpool",
        nationality: "Netherlands",
      },
      {
        name: "Bellingham",
        position: "CM",
        team: "Real Madrid",
        nationality: "England",
      },
      {
        name: "E Martínez",
        position: "GK",
        team: "Aston Villa",
        nationality: "Argentina",
      },
      {
        name: "Lewandowski",
        position: "CF",
        team: "Barcelona",
        nationality: "Poland",
      },
      {
        name: "Joan García",
        position: "GK",
        team: "Espanyol",
        nationality: "Spain",
      },
      {
        name: "Pedri",
        position: "CM",
        team: "Barcelona",
        nationality: "Spain",
      },
      {
        name: "Carlos Baleba",
        position: "CDM",
        team: "Brighton",
        nationality: "Cameroon",
      },
      {
        name: "Harry Kane",
        position: "CF",
        team: "Bayern Munich",
        nationality: "England",
      },
      {
        name: "Raphinha",
        position: "RW",
        team: "Barcelona",
        nationality: "Brazil",
      },
      {
        name: "M Salah",
        position: "RW",
        team: "Liverpool",
        nationality: "Egypt",
      },
      {
        name: "L Yamal",
        position: "RW",
        team: "Barcelona",
        nationality: "Spain",
      },
      {
        name: "Yoane Wissa",
        position: "CF",
        team: "Brentford",
        nationality: "Congo",
      },
      {
        name: "C Ronaldo",
        position: "CF",
        team: "Al-Nassr",
        nationality: "Portugal",
      },
      {
        name: "Allan Okello",
        position: "CAM",
        team: "Vipers SC",
        nationality: "Uganda",
      },
      { name: "Donnarumma", position: "GK", team: "PSG", nationality: "Italy" },
      {
        name: "Upamecano",
        position: "CB",
        team: "Bayern Munich",
        nationality: "France",
      },
      {
        name: "Heung-min Son",
        position: "LW",
        team: "Tottenham",
        nationality: "S.Korea",
      },
      {
        name: "J Sserunjogi",
        position: "CM",
        team: "KCCA FC",
        nationality: "Uganda",
      },
      {
        name: "E NgondE",
        position: "RB",
        team: "Express FC",
        nationality: "Uganda",
      },
      // Second row - 44 players with full data
      {
        name: "A Davies",
        position: "LB",
        team: "Bayern Munich",
        nationality: "Canada",
      },
      {
        name: "Y Tielemans",
        position: "CM",
        team: "Aston Villa",
        nationality: "Belgium",
      },
      {
        name: "A Semenyo",
        position: "RW",
        team: "Bournemouth",
        nationality: "Ghana",
      },
      {
        name: "X Simons",
        position: "CAM",
        team: "PSG",
        nationality: "Netherlands",
      },
      {
        name: "Ait Nouri",
        position: "LB",
        team: "Wolves",
        nationality: "Morocco",
      },
      {
        name: "W Endo",
        position: "CDM",
        team: "Liverpool",
        nationality: "Japan",
      },
      {
        name: "Alex Iwobi",
        position: "CM",
        team: "Fulham",
        nationality: "Nigeria",
      },
      {
        name: "T Sibbik",
        position: "RB",
        team: "Vipers SC",
        nationality: "Uganda",
      },
      {
        name: "S Mané",
        position: "LW",
        team: "Al-Nassr",
        nationality: "Senegal",
      },
      {
        name: "Sacha Boey",
        position: "RB",
        team: "AC Milan",
        nationality: "France",
      },
      {
        name: "Amad Diallo",
        position: "RW",
        team: "Man United",
        nationality: "Ivory Coast",
      },
      {
        name: "S Lammens",
        position: "GK",
        team: "KCCA FC",
        nationality: "Uganda",
      },
      {
        name: "B Fernandes",
        position: "CAM",
        team: "Man United",
        nationality: "Portugal",
      },
      {
        name: "S Gnabry",
        position: "RW",
        team: "Bayern Munich",
        nationality: "Germany",
      },
      {
        name: "SJ Magoola",
        position: "LB",
        team: "Express FC",
        nationality: "Uganda",
      },
      {
        name: "Rodrygo",
        position: "RW",
        team: "Real Madrid",
        nationality: "Brazil",
      },
      {
        name: "Rafael Leão",
        position: "LW",
        team: "AC Milan",
        nationality: "Portugal",
      },
      {
        name: "R Mahrez",
        position: "RW",
        team: "Al-Ahli",
        nationality: "Algeria",
      },
      {
        name: "R Lukaku",
        position: "CF",
        team: "Napoli",
        nationality: "Belgium",
      },
      {
        name: "N Jackson",
        position: "CF",
        team: "Chelsea",
        nationality: "Senegal",
      },
      {
        name: "Mo Kudus",
        position: "CAM",
        team: "West Ham",
        nationality: "Ghana",
      },
      {
        name: "N Williams",
        position: "RB",
        team: "Athletic Bilbao",
        nationality: "Spain",
      },
      {
        name: "Min-jae Kim",
        position: "CB",
        team: "Bayern Munich",
        nationality: "S.Korea",
      },
      {
        name: "M Rashford",
        position: "LW",
        team: "Man United",
        nationality: "England",
      },
      {
        name: "M Neuer",
        position: "GK",
        team: "Bayern Munich",
        nationality: "Germany",
      },
      {
        name: "M Caicedo",
        position: "CDM",
        team: "Chelsea",
        nationality: "Ecuador",
      },
      {
        name: "M Cucurella",
        position: "LB",
        team: "Chelsea",
        nationality: "Spain",
      },
      {
        name: "Luke Shaw",
        position: "LB",
        team: "Man United",
        nationality: "England",
      },
      {
        name: "Luka Modrić",
        position: "CM",
        team: "Real Madrid",
        nationality: "Croatia",
      },
      {
        name: "L Sane",
        position: "RW",
        team: "Bayern Munich",
        nationality: "Germany",
      },
      {
        name: "KD Bruyne",
        position: "CAM",
        team: "Man City",
        nationality: "Belgium",
      },
      {
        name: "João Félix",
        position: "CAM",
        team: "Chelsea",
        nationality: "Portugal",
      },
      {
        name: "J Tah",
        position: "CB",
        team: "Bayer Leverkusen",
        nationality: "Germany",
      },
      {
        name: "J Kimmich",
        position: "CDM",
        team: "Bayern Munich",
        nationality: "Germany",
      },
      {
        name: "J Frimpong",
        position: "RB",
        team: "Bayer Leverkusen",
        nationality: "Netherlands",
      },
      {
        name: "I Watenda",
        position: "CF",
        team: "Vipers SC",
        nationality: "Uganda",
      },
      {
        name: "I Konate",
        position: "CB",
        team: "Liverpool",
        nationality: "France",
      },
      { name: "Gavi", position: "CM", team: "Barcelona", nationality: "Spain" },
      {
        name: "G Gapko",
        position: "CF",
        team: "Liverpool",
        nationality: "Netherlands",
      },
      {
        name: "E Fernández",
        position: "CM",
        team: "Chelsea",
        nationality: "Argentina",
      },
      {
        name: "David Raya",
        position: "GK",
        team: "Arsenal",
        nationality: "Spain",
      },
      {
        name: "Dani Olmo",
        position: "CAM",
        team: "Barcelona",
        nationality: "Spain",
      },
      {
        name: "Casemiro",
        position: "CDM",
        team: "Man United",
        nationality: "Brazil",
      },
      {
        name: "B Guimarães",
        position: "CDM",
        team: "Newcastle",
        nationality: "Brazil",
      },
    ];

    return playerData.map((player, index) => {
      const imageData = getPlayerImageData(player.name);

      // Provide proper image value - either local asset or empty string for fallback
      let imageValue = "";
      if (imageData.type === "image" && imageData.source) {
        // For local assets, we need to pass the actual require() result
        // The main component will handle this via getPlayerImage(player.name)
        imageValue = player.name; // Pass name so main component can get local asset
      }

      return {
        id: `player_${index + 1}`,
        name: player.name,
        position: player.position,
        team: player.team,
        nationality: player.nationality,
        image: imageValue,
        imageData: imageData, // Include full image data for fallback handling
      };
    });
  };

  const players = createPlayerPlaceholders();

  // Check if player is selected
  const isPlayerSelected = (player: Player) => {
    return selectedPlayers.some((p) => p.id === player.id);
  };

  const handleScroll = (event: any, rowIndex: number) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const maxScrollDistance = contentSize.width - layoutMeasurement.width;
    const progress =
      maxScrollDistance > 0 ? contentOffset.x / maxScrollDistance : 0;

    if (onScroll) {
      onScroll(Math.max(0, Math.min(1, progress)));
    }
  };

  const renderPlayerRow = (rowPlayers: typeof players, rowIndex: number) => (
    <ScrollView
      key={`row_${rowIndex}`}
      ref={rowIndex === 0 ? scrollViewRef1 : scrollViewRef2}
      horizontal
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      style={styles.playerRow}
      contentContainerStyle={styles.playerRowContent}
      decelerationRate="fast"
      scrollEventThrottle={16}
      bounces={true}
      alwaysBounceHorizontal={false}
      directionalLockEnabled={true}
      onScroll={(event) => handleScroll(event, rowIndex)}
    >
      {rowPlayers.map((player) => (
        <TouchableOpacity
          key={player.id}
          style={styles.playerContainer}
          onPress={() => {
            if (onPlayerSelect && player) {
              if (!selectedPositionId) {
                // Show alert if no position is selected
                if (onShowAlert) {
                  onShowAlert();
                }
                return;
              }

              // Check if player is already selected
              if (isPlayerSelected(player)) {
                // Show alert if player is already selected
                if (onShowAlert) {
                  onShowAlert();
                }
                return;
              }
              onPlayerSelect(player);
            }
          }}
          activeOpacity={1}
          delayPressIn={0}
          delayPressOut={0}
          delayLongPress={0}
        >
          <View
            style={[
              styles.playerCircle,
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
              // Add red border for selected players
              isPlayerSelected(player) && {
                borderColor: "#FF4444",
                borderWidth: 2,
              },
            ]}
          >
            {(() => {
              const imageData = getPlayerImageData(player.name);

              if (imageData.type === "image") {
                return (
                  <Image
                    source={imageData.source}
                    style={styles.playerImage}
                    resizeMode="cover"
                  />
                );
              } else {
                return (
                  <View
                    style={[
                      styles.playerImage,
                      {
                        backgroundColor: imageData.color,
                        justifyContent: "center",
                        alignItems: "center",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.placeholderText,
                        { color: theme.colors.background },
                      ]}
                    >
                      {imageData.initials}
                    </Text>
                  </View>
                );
              }
            })()}

            {/* Selection indicator - red checkmark */}
            {isPlayerSelected(player) && (
              <View style={styles.selectionIndicator}>
                <View style={styles.checkmark}>
                  <Text style={styles.checkmarkText}>✓</Text>
                </View>
              </View>
            )}
          </View>
          <Text style={[styles.playerName, { color: theme.colors.text }]}>
            {player.name}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  // Split players into 2 rows of 44 each
  const row1 = players.slice(0, 44);
  const row2 = players.slice(44, 88);

  // One-time verification call for development (outside of hooks)
  if (__DEV__ && typeof console !== "undefined") {
    // Use a flag to prevent multiple calls
    if (!(global as any)._playerDataVerified) {
      (global as any)._playerDataVerified = true;
      setTimeout(() => verifyPlayerData(players), 0);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.topSpacing} />
      {renderPlayerRow(row1, 0)}
      <View style={styles.rowSpacing} />
      {renderPlayerRow(row2, 1)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  topSpacing: {
    height: 12,
  },
  rowSpacing: {
    height: 16,
  },
  playerRow: {
    marginBottom: 8,
  },
  playerRowContent: {
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  playerContainer: {
    alignItems: "center",
    marginRight: 12,
    width: 72,
    flex: 0,
    flexShrink: 0,
  },
  playerCircle: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    borderWidth: 1,
    marginBottom: 6,
  },
  playerName: {
    fontSize: 12,
    textAlign: "center",
    maxWidth: 72,
    fontWeight: "500",
  },
  playerImage: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
  },
  placeholderText: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
  },

  // Selection indicator styles
  selectionIndicator: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FF4444",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  checkmark: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#FF4444",
    alignItems: "center",
    justifyContent: "center",
  },
  checkmarkText: {
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "bold",
  },
});
