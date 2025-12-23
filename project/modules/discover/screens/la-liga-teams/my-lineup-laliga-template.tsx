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
import { TeamConfig } from "./la-liga-config";
import laLigaApiService, {
  LaLigaPlayer,
} from "../../../../services/laLigaApiService";

const { width: screenWidth } = Dimensions.get("window");

interface LaLigaTeamProps {
  teamConfig: TeamConfig;
  onBack?: () => void;
  onPlayerSelect?: (player: any) => void;
  selectedPositionId?: string | null;
  onShowAlert?: () => void;
  selectedPlayers?: any[];
}

export default function MyLineupLaLigaTemplate({
  teamConfig,
  onBack,
  onPlayerSelect,
  selectedPositionId,
  onShowAlert,
  selectedPlayers = [],
}: LaLigaTeamProps) {
  const theme = useTheme();
  const [players, setPlayers] = useState<LaLigaPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiStatus, setApiStatus] = useState<string>("Loading...");

  console.log(`🔥⚽ ${teamConfig.name} La Liga Team Template is rendering!`);

  // Fetch real La Liga players from API using dual API approach
  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        setLoading(true);
        setApiStatus("Testing API connection...");
        console.log(
          `🔄 Fetching ${teamConfig.name} players from La Liga API...`,
        );

        // Test API connection first
        const apiTest = await laLigaApiService.testApiConnection();

        if (!apiTest.success) {
          setApiStatus(
            `API offline - showing current ${teamConfig.name} squad`,
          );
          const fallbackPlayers = createPlayerPlaceholders();
          setPlayers(fallbackPlayers);
          return;
        }

        setApiStatus(`Fetching ${teamConfig.name} players...`);

        // Use API service to get team players - try multiple seasons
        console.log(`📡 Calling API with team name: "${teamConfig.apiName}"`);

        const apiPlayers = await laLigaApiService.getLaLigaTeamPlayers(
          teamConfig.apiName,
          2024,
        );

        if (apiPlayers.length > 0) {
          // Process and format the real API players
          const processedPlayers = apiPlayers.map((player) => ({
            id: player.id,
            name: formatPlayerName(player.name),
            firstname: player.firstname,
            lastname: player.lastname,
            age: player.age,
            nationality: player.nationality,
            height: player.height,
            weight: player.weight,
            photo: player.photo,
            position: player.position,
            team: {
              id: player.team.id,
              name: teamConfig.fullName,
              logo: player.team.logo,
            },
          }));

          setPlayers(processedPlayers);

          setApiStatus(
            `✅ Live data: ${processedPlayers.length} current players`,
          );
        } else {
          // Fallback to placeholder players if API returns empty
          setApiStatus(
            `⚠️ No API data - showing current ${teamConfig.name} squad`,
          );
          const fallbackPlayers = createPlayerPlaceholders();
          setPlayers(fallbackPlayers);
        }
      } catch (error) {
        setApiStatus("Error occurred, using fallback players");
        console.error(
          `❌ Error fetching ${teamConfig.name} players from dual APIs:`,
          error,
        );
        const fallbackPlayers = createPlayerPlaceholders();
        setPlayers(fallbackPlayers);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayers();
  }, [teamConfig]);

  // Smart name formatting function for La Liga players
  const formatPlayerName = (fullName: string): string => {
    if (!fullName) return "Unknown";

    const nameParts = fullName.trim().split(" ");

    if (nameParts.length === 1) {
      // Single name (e.g., "Pedri") - truncate if too long
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

  // Create team-specific player placeholders - used as fallback
  const createPlayerPlaceholders = (): LaLigaPlayer[] => {
    // Get current realistic player names based on team
    const getCurrentTeamPlayers = () => {
      switch (teamConfig.id) {
        case "real-madrid":
          return [
            "Thibaut Courtois",
            "Andriy Lunin",
            "Dani Carvajal",
            "Éder Militão",
            "David Alaba",
            "Antonio Rüdiger",
            "Ferland Mendy",
            "Fran García",
            "Lucas Vázquez",
            "Nacho Fernández",
            "Eduardo Camavinga",
            "Federico Valverde",
            "Aurélien Tchouaméni",
            "Luka Modrić",
            "Arda Güler",
            "Dani Ceballos",
            "Brahim Díaz",
            "Vinícius Júnior",
            "Kylian Mbappé",
            "Jude Bellingham",
            "Rodrygo",
            "Endrick",
            "Jesús Vallejo",
            "Álvaro Rodríguez",
            "Nico Paz",
            "Mario Martin",
            "Jacobo Ramón",
          ];
        case "barcelona":
          return [
            "Marc-André ter Stegen",
            "Iñaki Peña",
            "Ronald Araújo",
            "Andreas Christensen",
            "Jules Koundé",
            "Pau Cubarsí",
            "Iñigo Martínez",
            "Alejandro Balde",
            "Jordi Alba",
            "Pedri",
            "Gavi",
            "Frenkie de Jong",
            "Ilkay Gündogan",
            "Pablo Torre",
            "Fermín López",
            "Robert Lewandowski",
            "Raphinha",
            "Ferran Torres",
            "João Félix",
            "Lamine Yamal",
            "Ansu Fati",
            "Vitor Roque",
            "Oriol Romeu",
            "Sergi Roberto",
            "Marcos Alonso",
            "Héctor Fort",
            "Marc Guiu",
          ];
        default:
          return Array.from(
            { length: 27 },
            (_, i) => `${teamConfig.name} Player ${i + 1}`,
          );
      }
    };

    const teamPlayers = getCurrentTeamPlayers();

    return teamPlayers.slice(0, 27).map((name, index) => ({
      id: index + 1,
      name: formatPlayerName(name),
      firstname: name.split(" ")[0],
      lastname: name.split(" ").slice(1).join(" ") || `${index + 1}`,
      age: 20 + Math.floor(Math.random() * 15),
      nationality: "Spain",
      height: null,
      weight: null,
      photo: "",
      position:
        index < 2
          ? "Goalkeeper"
          : index < 10
            ? "Defender"
            : index < 18
              ? "Midfielder"
              : "Forward",
      team: {
        id: 541,
        name: teamConfig.fullName,
        logo: "",
      },
    }));
  };

  // Check if player is selected
  const isPlayerSelected = (player: LaLigaPlayer) => {
    const playerId = `${teamConfig.id}_${player.id}`;
    return selectedPlayers.some((p) => p.id === playerId);
  };

  // Get player photo with La Liga service
  const getPlayerPhoto = (player: LaLigaPlayer) => {
    return laLigaApiService.getPlayerPhoto(player);
  };

  const renderPlayerRow = (rowPlayers: LaLigaPlayer[], rowIndex: number) => (
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

              // Convert to lineup format
              const convertedPlayer = {
                id: `${teamConfig.id}_${player.id}`,
                name: player.name || "Unknown Player",
                position: player.position || "Forward",
                team: teamConfig.fullName,
                image: player.photo || "",
                nationality: player.nationality || "Spain",
                age: player.age,
                height: player.height,
                weight: player.weight,
              };

              console.log(
                `🎯 Player selected: ${convertedPlayer.name} (${convertedPlayer.position}) for ${teamConfig.name}`,
              );
              onPlayerSelect(convertedPlayer);
            }
          }}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.playerCircle,
              {
                backgroundColor:
                  theme.colors.background === "#FFFFFF" ||
                  theme.colors.background === "#ffffff"
                    ? "rgba(128, 128, 128, 0.05)"
                    : "rgba(0, 0, 0, 0.01)",
                borderColor:
                  theme.colors.background === "#FFFFFF" ||
                  theme.colors.background === "#ffffff"
                    ? "rgba(128, 128, 128, 0.08)"
                    : "rgba(255, 255, 255, 0.02)",
              },
              // Add bright red border for selected players
              isPlayerSelected(player) && {
                borderColor: "#FF0000",
                borderWidth: 2,
              },
            ]}
          >
            <View style={styles.playerImageContainer}>
              {player.photo && player.photo !== "" ? (
                <Image
                  source={{ uri: getPlayerPhoto(player) }}
                  style={styles.playerPhoto}
                  resizeMode="cover"
                  onError={(error) => {
                    console.log(
                      `📷 Failed to load photo for ${player.name}:`,
                      error.nativeEvent.error,
                    );
                  }}
                  onLoad={() => {
                    console.log(
                      `✅ Successfully loaded photo for ${player.name}`,
                    );
                  }}
                />
              ) : (
                <View
                  style={[
                    styles.playerImage,
                    { backgroundColor: teamConfig.primaryColor },
                  ]}
                >
                  <Text style={styles.playerInitials}>
                    {(
                      (player.firstname?.[0] || "") +
                      (player.lastname?.[0] || "")
                    )
                      .substring(0, 2)
                      .toUpperCase()}
                  </Text>
                </View>
              )}
            </View>

            {/* Selection indicator with team colors */}
            {isPlayerSelected(player) && (
              <View
                style={[
                  styles.selectionIndicator,
                  { backgroundColor: "#FF0000" },
                ]}
              >
                <View
                  style={[styles.checkmark, { backgroundColor: "#FF0000" }]}
                >
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

  // Split players into 2 rows of 14 and 13 (matching original layout)
  const row1 = players.slice(0, 14);
  const row2 = players.slice(14, 27);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color={teamConfig.primaryColor || "#FF4444"}
        />
        <Text style={[styles.loadingText, { color: theme.colors.text }]}>
          Loading {teamConfig.name} players...
        </Text>
        <Text style={[styles.loadingSubText, { color: theme.colors.text }]}>
          Fetching real player data with smart enhancement
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.topSpacing} />

        {renderPlayerRow(row1, 0)}
        <View style={styles.rowSpacing} />
        {renderPlayerRow(row2, 1)}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 0,
    paddingBottom: 20,
  },
  scrollContainer: {
    flex: 1,
  },
  topSpacing: {
    height: 4,
  },
  rowSpacing: {
    height: 16,
  },
  bottomSpacing: {
    height: 30,
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
    marginRight: 10,
    width: 64,
    flex: 0,
    flexShrink: 0,
  },
  playerCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 6,
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
    position: "relative",
  },
  playerImageContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "transparent",
  },
  playerPhoto: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  playerImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  playerInitials: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  playerName: {
    fontSize: 10,
    textAlign: "center",
    maxWidth: 64,
    fontWeight: "600",
    lineHeight: 12,
    height: 12,
  },
  // Selection indicator styles - EXACT MATCH to English PL
  selectionIndicator: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  checkmark: {
    width: 12,
    height: 12,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  checkmarkText: {
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "bold",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    textAlign: "center",
  },
  loadingSubText: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 40,
  },
});
