import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { getCountryImage } from "../../../../assets/images/countries/index";
import nationalTeamApiService, {
  NationalTeamPlayer,
} from "../../../../services/nationalTeamApiService";

const { width: screenWidth } = Dimensions.get("window");

interface FranceTeamProps {
  onPlayerSelect?: (player: any) => void;
  selectedPositionId?: string | null;
  onShowAlert?: () => void;
  selectedPlayers?: any[];
}

export default function MyLineupTeamFrance({
  onPlayerSelect,
  selectedPositionId,
  onShowAlert,
  selectedPlayers = [],
}: FranceTeamProps) {
  const theme = useTheme();
  const [players, setPlayers] = useState<NationalTeamPlayer[]>([]);
  const [loading, setLoading] = useState(true);

  console.log("🇫🇷 France Team Component is rendering!");

  // Get France flag
  const franceFlag = getCountryImage("France");

  // Fetch real France players
  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        setLoading(true);
        console.log("🔄 Fetching France players...");
        const francePlayers =
          await nationalTeamApiService.getNationalTeamPlayers("France");

        if (francePlayers.length > 0) {
          setPlayers(francePlayers);
          console.log(`✅ Loaded ${francePlayers.length} France players`);
        } else {
          // Fallback to hardcoded names if API fails
          const fallbackPlayers = createPlayerPlaceholders();
          setPlayers(fallbackPlayers);
          console.warn("⚠️ Using fallback France players");
        }
      } catch (error) {
        console.error("❌ Error fetching France players:", error);
        const fallbackPlayers = createPlayerPlaceholders();
        setPlayers(fallbackPlayers);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayers();
  }, []);

  // Smart name formatting function
  const formatPlayerName = (fullName: string): string => {
    const nameParts = fullName.trim().split(" ");

    if (nameParts.length === 1) {
      // Single name - truncate if too long
      return nameParts[0].length > 12
        ? nameParts[0].substring(0, 10) + "..."
        : nameParts[0];
    } else if (nameParts.length === 2) {
      // Two names - "First Last" format, truncate last name if needed
      const lastName =
        nameParts[1].length > 8
          ? nameParts[1].substring(0, 6) + "..."
          : nameParts[1];
      return `${nameParts[0][0]}. ${lastName}`;
    } else if (nameParts.length >= 3) {
      // Three or more names - "F. Middle" format
      const middleName =
        nameParts[1].length > 8
          ? nameParts[1].substring(0, 6) + "..."
          : nameParts[1];
      return `${nameParts[0][0]}. ${middleName}`;
    }

    return fullName;
  };

  // Create array of 22 player placeholders (2 rows of 11 each) - used as fallback
  const createPlayerPlaceholders = (): NationalTeamPlayer[] => {
    const playerNames = [
      // Row 1 - 11 players
      "K. Mbappé",
      "A. Griezmann",
      "O. Giroud",
      "N. Kanté",
      "P. Pogba",
      "R. Varane",
      "H. Lloris",
      "B. Pavard",
      "L. Hernández",
      "A. Tchouaméni",
      "K. Benzema",
      // Row 2 - 11 players
      "O. Dembélé",
      "T. Lemar",
      "M. Maignan",
      "J. Clauss",
      "I. Konaté",
      "W. Saliba",
      "Y. Fofana",
      "E. Camavinga",
      "C. Nkunku",
      "M. Coman",
      "R. Kolo Muani",
    ];

    return Array.from({ length: 22 }, (_, index) => ({
      id: index + 1,
      name: formatPlayerName(playerNames[index]),
      firstname: playerNames[index].split(" ")[0] || "",
      lastname: playerNames[index].split(" ")[1] || "",
      age: 25,
      nationality: "France",
      height: null,
      weight: null,
      photo: "",
      position:
        index === 0
          ? "Goalkeeper"
          : index < 5
            ? "Defender"
            : index < 10
              ? "Midfielder"
              : "Forward",
      team: {
        id: 0,
        name: "France National Team",
        logo: "",
      },
    }));
  };

  // Check if player is selected
  const isPlayerSelected = (player: NationalTeamPlayer) => {
    const playerId = `france_${player.id}`;
    return selectedPlayers.some((p: any) => p.id === playerId);
  };

  const renderPlayerRow = (rowPlayers: typeof players, rowIndex: number) => (
    <ScrollView
      key={`row_${rowIndex}`}
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

              // Convert to simple Player format matching popular players
              const convertedPlayer = {
                id: `france_${player.id}`,
                name: player.name || "Unknown Player",
                position: player.position || "Forward",
                team: player.team?.name || "France National Team",
                image: player.photo
                  ? nationalTeamApiService.getPlayerPhoto(player)
                  : "",
                nationality: player.nationality || "France",
              };
              onPlayerSelect(convertedPlayer);
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
              // Add red border for selected players
              isPlayerSelected(player) && {
                borderColor: "#FF4444",
                borderWidth: 2,
              },
            ]}
          >
            {player.photo && player.photo !== "" ? (
              <Image
                source={{ uri: nationalTeamApiService.getPlayerPhoto(player) }}
                style={styles.playerPhoto}
                resizeMode="cover"
                onError={() => {
                  console.log(`Failed to load photo for ${player.name}`);
                }}
              />
            ) : (
              <View style={styles.playerImage}>
                <Text style={styles.playerInitials}>
                  {(
                    (player.firstname?.[0] || "") + (player.lastname?.[0] || "")
                  ).substring(0, 2)}
                </Text>
              </View>
            )}

            {/* Selection indicator - red checkmark */}
            {isPlayerSelected(player) && (
              <View style={styles.selectionIndicator}>
                <View style={styles.checkmark}>
                  <Text style={styles.checkmarkText}>✓</Text>
                </View>
              </View>
            )}
          </View>
          <Text
            style={[styles.playerName, { color: theme.colors.text }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {player.name}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  // Split players into 2 rows of 11 each
  const row1 = players.slice(0, 11);
  const row2 = players.slice(11, 22);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF4444" />
        <Text style={[styles.loadingText, { color: theme.colors.text }]}>
          Loading France players...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderPlayerRow(row1, 0)}
      <View style={styles.rowSpacing} />
      {renderPlayerRow(row2, 1)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 20,
    paddingBottom: 0,
    marginTop: -5,
    paddingHorizontal: 0,
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 50,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
  },
  rowSpacing: {
    height: 15,
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
    marginBottom: 8,
  },
  playerCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 6,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  playerImageContainer: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },
  playerImage: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#4A8B3B",
    alignItems: "center",
    justifyContent: "center",
  },
  playerPhoto: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  playerInitials: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
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
  playerName: {
    fontSize: 12,
    textAlign: "center",
    maxWidth: 72,
    fontWeight: "500",
    lineHeight: 16,
    height: 16,
    marginTop: 4,
  },
});
