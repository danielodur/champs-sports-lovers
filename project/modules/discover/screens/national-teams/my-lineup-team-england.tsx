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
import { ArrowLeft } from "lucide-react-native";
import { getCountryImage } from "../../../../assets/images/countries/index";
import nationalTeamApiService, {
  NationalTeamPlayer,
} from "../../../../services/nationalTeamApiService";

const { width: screenWidth } = Dimensions.get("window");

interface EnglandTeamProps {
  onBack?: () => void;
  onPlayerSelect?: (player: any) => void;
  selectedPositionId?: string | null;
  onShowAlert?: () => void;
  selectedPlayers?: any[];
}

export default function MyLineupTeamEngland({
  onBack,
  onPlayerSelect,
  selectedPositionId,
  onShowAlert,
  selectedPlayers = [],
}: EnglandTeamProps) {
  const theme = useTheme();
  const [players, setPlayers] = useState<NationalTeamPlayer[]>([]);
  const [loading, setLoading] = useState(true);

  console.log("🟡🔴⚪ England Team Component is rendering!");

  // Get England flag
  const englandFlag = getCountryImage("England");

  // Fetch real England players
  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        setLoading(true);
        console.log("🔄 Fetching England players...");
        const englandPlayers =
          await nationalTeamApiService.getNationalTeamPlayers("England");

        if (englandPlayers.length > 0) {
          setPlayers(englandPlayers);
          console.log(`✅ Loaded ${englandPlayers.length} England players`);
        } else {
          // Fallback to hardcoded names if API fails
          const fallbackPlayers = createPlayerPlaceholders();
          setPlayers(fallbackPlayers);
          console.warn("⚠️ Using fallback England players");
        }
      } catch (error) {
        console.error("❌ Error fetching England players:", error);
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

  // Create array of 22 player placeholders (2 rows of 11 each)
  const createPlayerPlaceholders = () => {
    const playerNames = [
      // Row 1 - 11 players
      "J. Pickford",
      "A. Ramsdale",
      "K. Walker",
      "L. Shaw",
      "H. Maguire",
      "J. Stones",
      "D. Rice",
      "J. Bellingham",
      "P. Foden",
      "R. Sterling",
      "H. Kane",
      // Row 2 - 11 players
      "M. Rashford",
      "J. Grealish",
      "B. Saka",
      "K. Phillips",
      "J. Henderson",
      "C. Gallagher",
      "E. Konsa",
      "B. White",
      "K. Trippier",
      "T. Alexander-Arnold",
      "I. Watkins",
    ];

    return Array.from({ length: 22 }, (_, index) => ({
      id: index + 1,
      name: formatPlayerName(playerNames[index]),
      firstname: formatPlayerName(playerNames[index]).split(" ")[0] || "",
      lastname:
        formatPlayerName(playerNames[index]).split(" ").slice(1).join(" ") ||
        "",
      age: 25,
      nationality: "England",
      height: "180cm",
      weight: "75kg",
      photo: "",
      position: "Forward",
      team: {
        id: 1,
        name: "England National Team",
        logo: "",
      },
    }));
  };

  // Check if player is selected
  const isPlayerSelected = (player: NationalTeamPlayer) => {
    const playerId = `england_${player.id}`;
    const isSelected = selectedPlayers.some((p: any) => p.id === playerId);

    return isSelected;
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
                id: `england_${player.id}`,
                name: player.name || "Unknown Player",
                position: player.position || "Forward",
                team: player.team?.name || "England National Team",
                image: player.photo
                  ? nationalTeamApiService.getPlayerPhoto(player)
                  : "",
                nationality: player.nationality || "England",
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
          Loading England players...
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
  rowSpacing: {
    height: 15,
  },
  playerRow: {
    marginBottom: 4,
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
  playerName: {
    fontSize: 12,
    textAlign: "center",
    maxWidth: 72,
    fontWeight: "500",
    lineHeight: 16,
    height: 16,
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  playerPhoto: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  playerImage: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#4A8B3B",
    alignItems: "center",
    justifyContent: "center",
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
});
