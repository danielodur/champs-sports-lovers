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
import { TeamConfig } from "./serie-a-config";
import serieAApiService, {
  SerieAPlayer,
} from "../../../../services/serieAApiService";

const { width: screenWidth } = Dimensions.get("window");

interface SerieATeamProps {
  teamConfig: TeamConfig;
  onBack?: () => void;
  onPlayerSelect?: (player: any) => void;
  selectedPositionId?: string | null;
  onShowAlert?: () => void;
  selectedPlayers?: any[];
}

export default function MyLineupSerieATemplate({
  teamConfig,
  onBack,
  onPlayerSelect,
  selectedPositionId,
  onShowAlert,
  selectedPlayers = [],
}: SerieATeamProps) {
  const theme = useTheme();
  const [players, setPlayers] = useState<SerieAPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiStatus, setApiStatus] = useState<string>("Loading...");

  // Fetch real Serie A players from API
  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        setLoading(true);
        setApiStatus("Testing API connection...");

        // Test dual API connection first
        const dualApiTest = await serieAApiService.testDualApiConnection();

        if (!dualApiTest.success) {
          setApiStatus(
            `APIs offline - showing current ${teamConfig.name} squad`,
          );
          const fallbackPlayers = createPlayerPlaceholders();
          setPlayers(fallbackPlayers);
          return;
        }

        setApiStatus(`${dualApiTest.message} - Fetching players...`);

        // Check for squad updates
        const updateCheck = await serieAApiService.checkForSquadUpdates(teamConfig.apiName);
        if (updateCheck.hasUpdates) {
          console.log(`🔄 Squad updates available for ${teamConfig.name}:`, updateCheck);
        }

        setApiStatus(`Fetching ${teamConfig.name} players...`);

        // Use API service to get team players - try multiple seasons
        let apiPlayers: SerieAPlayer[] = [];

        // Try current season first, then fallback to previous seasons
        const seasonsToTry = [2024, 2023, 2025];

        for (const season of seasonsToTry) {
          setApiStatus(`Trying season ${season}...`);

          try {
            apiPlayers = await serieAApiService.getSerieATeamPlayers(
              teamConfig.apiName,
              season,
            );

            if (apiPlayers.length > 0) {
              setApiStatus(`Found ${apiPlayers.length} players (${season})`);
              break;
            }
          } catch (seasonError) {
            continue;
          }
        }

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
        console.error(`Error fetching ${teamConfig.name} players:`, error);
        setApiStatus(`❌ Error: Using current ${teamConfig.name} squad`);
        const fallbackPlayers = createPlayerPlaceholders();
        setPlayers(fallbackPlayers);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayers();
  }, [teamConfig]);

  // Smart name formatting function for Serie A players
  const formatPlayerName = (fullName: string): string => {
    if (!fullName) return "Unknown";

    const nameParts = fullName.trim().split(" ");

    if (nameParts.length === 1) {
      // Single name (e.g., "Vlahović") - truncate if too long
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
  const createPlayerPlaceholders = (): SerieAPlayer[] => {
    // Get current realistic player names based on team
    const getCurrentTeamPlayers = () => {
      switch (teamConfig.id) {
        case "juventus":
          return [
            "Wojciech Szczęsny",
            "Mattia Perin",
            "Danilo",
            "Gleison Bremer",
            "Alex Sandro",
            "Juan Cuadrado",
            "Mattia De Sciglio",
            "Federico Gatti",
            "Weston McKennie",
            "Manuel Locatelli",
            "Adrien Rabiot",
            "Paul Pogba",
            "Fabio Miretti",
            "Nicolò Fagioli",
            "Federico Chiesa",
            "Filip Kostić",
            "Ángel Di María",
            "Dušan Vlahović",
            "Arkadiusz Milik",
            "Moise Kean",
            "Samuel Iling-Junior",
            "Kenan Yıldız",
            "Timothy Weah",
            "Andrea Cambiaso",
            "Dean Huijsen",
            "Mattia Perin",
            "Carlo Pinsoglio",
          ];
        case "inter":
          return [
            "André Onana",
            "Yann Sommer",
            "Alessandro Bastoni",
            "Milan Škriniar",
            "Stefan de Vrij",
            "Matteo Darmian",
            "Denzel Dumfries",
            "Federico Dimarco",
            "Nicolò Barella",
            "Marcelo Brozović",
            "Hakan Çalhanoğlu",
            "Henrikh Mkhitaryan",
            "Kristjan Asllani",
            "Lautaro Martínez",
            "Romelu Lukaku",
            "Edin Džeko",
            "Joaquín Correa",
            "Alexis Sánchez",
            "Marcus Thuram",
            "Marko Arnautović",
            "Carlos Augusto",
            "Yann Bisseck",
            "Davide Frattesi",
            "Benjamin Pavard",
            "Francesco Acerbi",
            "Matteo Darmian",
            "Tajon Buchanan",
          ];
        case "ac-milan":
          return [
            "Mike Maignan",
            "Marco Sportiello",
            "Theo Hernández",
            "Pierre Kalulu",
            "Fikayo Tomori",
            "Matteo Gabbia",
            "Malick Thiaw",
            "Davide Calabria",
            "Alessandro Florenzi",
            "Sandro Tonali",
            "Tijjani Reijnders",
            "Yunus Musah",
            "Ruben Loftus-Cheek",
            "Ismaël Bennacer",
            "Rafael Leão",
            "Christian Pulisic",
            "Samuel Chukwueze",
            "Olivier Giroud",
            "Tammy Abraham",
            "Luka Jović",
            "Noah Okafor",
            "Emerson Royal",
            "Strahinja Pavlović",
            "Álvaro Morata",
            "Youssouf Fofana",
            "Alex Jiménez",
            "Lorenzo Torriani",
          ];
        case "napoli":
          return [
            "Alex Meret",
            "Pierluigi Gollini",
            "Amir Rrahmani",
            "Juan Jesus",
            "Natan",
            "Mathías Olivera",
            "Giovanni Di Lorenzo",
            "Mario Rui",
            "Stanislav Lobotka",
            "Frank Anguissa",
            "Piotr Zieliński",
            "Jens Cajuste",
            "Jesper Lindstrøm",
            "Khvicha Kvaratskhelia",
            "Matteo Politano",
            "Giacomo Raspadori",
            "Victor Osimhen",
            "Giovanni Simeone",
            "Cyril Ngonge",
            "Scott McTominay",
            "Billy Gilmour",
            "Alessandro Buongiorno",
            "Leonardo Spinazzola",
            "Romelu Lukaku",
            "David Neres",
            "Pasquale Mazzocchi",
            "Nikita Contini",
          ];
        case "atalanta":
          return [
            "Juan Musso",
            "Marco Carnesecchi",
            "José Luis Palomino",
            "Rafael Tolói",
            "Giorgio Scalvini",
            "Berat Djimsiti",
            "Matteo Ruggeri",
            "Davide Zappacosta",
            "Teun Koopmeiners",
            "Marten de Roon",
            "Éderson",
            "Mario Pašalić",
            "Ademola Lookman",
            "Charles De Ketelaere",
            "Aleksei Miranchuk",
            "Gianluca Scamacca",
            "Mateo Retegui",
            "El Bilal Touré",
            "Lazar Samardžić",
            "Marco Brescianini",
            "Odilon Kossounou",
            "Ben Godfrey",
            "Nicolò Zaniolo",
            "Raoul Bellanova",
            "Sead Kolašinac",
            "Giovanni Bonfanti",
            "Rui Patrício",
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
      nationality: "Italy",
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
        id: 496,
        name: teamConfig.fullName,
        logo: "",
      },
    }));
  };

  // Check if player is selected
  const isPlayerSelected = (player: SerieAPlayer) => {
    const playerId = `${teamConfig.id}_${player.id}`;
    return selectedPlayers.some((p) => p.id === playerId);
  };

  // Get player photo URL with enhanced multi-source support
  const getPlayerPhoto = (player: SerieAPlayer) => {
    // Use the enhanced photo method that tries multiple sources
    return serieAApiService.getPlayerPhoto(player);
  };

  // Check for squad updates and refresh if needed
  const checkForSquadUpdates = async () => {
    try {
      const updateCheck = await serieAApiService.checkForSquadUpdates(teamConfig.apiName);
      
      if (updateCheck.hasUpdates) {
        console.log(`🔄 Squad updates available for ${teamConfig.name}:`, updateCheck);
        
        // Optionally auto-refresh or notify user
        if (updateCheck.newPlayers.length > 0 || updateCheck.outdatedPlayers.length > 0) {
          setApiStatus(`Updates available: ${updateCheck.newPlayers.length} new, ${updateCheck.outdatedPlayers.length} outdated`);
          
          // Auto-refresh if significant changes
          if (updateCheck.newPlayers.length > 3) {
            const refreshedPlayers = await serieAApiService.forceRefreshTeamData(teamConfig.apiName);
            setPlayers(refreshedPlayers);
            setApiStatus(`Refreshed with ${refreshedPlayers.length} updated players`);
          }
        }
      }
    } catch (error) {
      console.error("Error checking squad updates:", error);
    }
  };

  const renderPlayerRow = (rowPlayers: SerieAPlayer[], rowIndex: number) => (
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
                nationality: player.nationality || "Italy",
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
                    (player.firstname?.[0] || "") + (player.lastname?.[0] || "")
                  )
                    .substring(0, 2)
                    .toUpperCase()}
                </Text>
              </View>
            )}

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
          {apiStatus}
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 45,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: "600",
  },
  loadingSubText: {
    marginTop: 5,
    fontSize: 12,
    opacity: 0.7,
    textAlign: "center",
  },
  topSpacing: {
    height: 4,
  },
  rowSpacing: {
    height: 20,
  },
  bottomSpacing: {
    height: 20,
  },
  playerRow: {
    marginBottom: 0,
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
  },
  playerImageContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  playerImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  playerPhoto: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
  playerName: {
    fontSize: 10,
    textAlign: "center",
    maxWidth: 64,
    fontWeight: "600",
    lineHeight: 12,
    height: 12,
  },
});
