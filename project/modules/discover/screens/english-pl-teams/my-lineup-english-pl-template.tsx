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
import { TeamConfig } from "./english-pl-config";
import premierLeagueApiService, {
  PremierLeaguePlayer,
} from "../../../../services/premierLeagueApiService";

const { width: screenWidth } = Dimensions.get("window");

interface EnglishPLTeamProps {
  teamConfig: TeamConfig;
  onBack?: () => void;
  onPlayerSelect?: (player: any) => void;
  selectedPositionId?: string | null;
  onShowAlert?: () => void;
  selectedPlayers?: any[];
}

export default function MyLineupEnglishPLTemplate({
  teamConfig,
  onBack,
  onPlayerSelect,
  selectedPositionId,
  onShowAlert,
  selectedPlayers = [],
}: EnglishPLTeamProps) {
  const theme = useTheme();
  const [players, setPlayers] = useState<PremierLeaguePlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiStatus, setApiStatus] = useState<string>("Loading...");

  console.log(`🔥⚽ ${teamConfig.name} English PL Team Template is rendering!`);

  // Fetch real Premier League players from API
  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        setLoading(true);
        console.log(
          `🔄 Fetching ${teamConfig.name} players from Premier League API...`,
        );

        // Test API connection first
        const apiTest = await premierLeagueApiService.testApiConnection();
        if (!apiTest.success) {
          console.warn(
            `⚠️ Premier League API connection failed:`,
            apiTest.message,
          );
          const fallbackPlayers = createPlayerPlaceholders();
          setPlayers(fallbackPlayers);
          return;
        }

        // Use API service to get team players
        console.log(`📡 Calling API with team name: "${teamConfig.apiName}"`);
        const apiPlayers =
          await premierLeagueApiService.getPremierLeagueTeamPlayers(
            teamConfig.apiName,
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
          console.log(
            `✅ Loaded ${processedPlayers.length} real ${teamConfig.name} players from Premier League API`,
          );

          // Log some player details for verification
          console.log(
            `🔍 Sample players:`,
            processedPlayers.slice(0, 3).map((p) => ({
              name: p.name,
              position: p.position,
              hasPhoto: !!p.photo,
              nationality: p.nationality,
            })),
          );
        } else {
          // Fallback to placeholder players if API returns empty
          console.warn(
            `⚠️ API returned no players for ${teamConfig.name}, using fallback`,
          );
          const fallbackPlayers = createPlayerPlaceholders();
          setPlayers(fallbackPlayers);
        }
      } catch (error) {
        console.error(`❌ Error fetching ${teamConfig.name} players:`, error);
        const fallbackPlayers = createPlayerPlaceholders();
        setPlayers(fallbackPlayers);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayers();
  }, [teamConfig]);

  // Smart name formatting function for Premier League players
  const formatPlayerName = (fullName: string): string => {
    if (!fullName) return "Unknown";

    const nameParts = fullName.trim().split(" ");

    if (nameParts.length === 1) {
      // Single name (e.g., "Jorginho") - truncate if too long
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
  const createPlayerPlaceholders = (): PremierLeaguePlayer[] => {
    // Get team-specific realistic player names based on team
    const getTeamSpecificPlayers = () => {
      switch (teamConfig.id) {
        case "arsenal":
          return [
            "David Raya",
            "Bukayo Saka",
            "Kai Havertz",
            "W. Saliba",
            "Declan Rice",
            "C. Mosquera",
            "Ben White",
            "P. Hincapié",
            "G. Magalhães",
            "J. Timber",
            "O. Zinchenko",
            "R. Calafiori",
            "M. Ødegaard",
            "E. Eze",
            "L. Trossard",
            "C. Nørgaard",
            "Fábio Vieira",
            "E. Nwaneri",
            "Mikel Merino",
            "M. Zubimendi",
            "G. Jesus",
            "G. Martinelli",
            "V. Gyökeres",
            "N. Madueke",
            "Reiss Nelson",
            "K. Arrizabalaga",
            "M. Lewis-Skelly",
          ];
        case "liverpool":
          return [
            "Alisson",
            "Mohamed Salah",
            "Darwin Núñez",
            "Virgil van Dijk",
            "Sadio Mané",
            "Jordan Henderson",
            "Fabinho",
            "Thiago",
            "Andrew Robertson",
            "Trent Alexander-Arnold",
            "Diogo Jota",
            "Roberto Firmino",
            "Luis Díaz",
            "Harvey Elliott",
            "Curtis Jones",
            "Joel Matip",
            "Ibrahima Konaté",
            "Joe Gomez",
            "Kostas Tsimikas",
            "James Milner",
            "Alex Oxlade-Chamberlain",
            "Naby Keïta",
            "Adrian",
            "Caoimhín Kelleher",
            "Tyler Morton",
            "Kaide Gordon",
            "Owen Beck",
          ];
        case "man-city":
          return [
            "Ederson",
            "Kevin De Bruyne",
            "Erling Haaland",
            "Phil Foden",
            "Riyad Mahrez",
            "Bernardo Silva",
            "Rodri",
            "John Stones",
            "Ruben Dias",
            "Joao Cancelo",
            "Kyle Walker",
            "Nathan Aké",
            "Aymeric Laporte",
            "Ilkay Gündogan",
            "Jack Grealish",
            "Raheem Sterling",
            "Gabriel Jesus",
            "Oleksandr Zinchenko",
            "Fernandinho",
            "Sergio Gómez",
            "Kalvin Phillips",
            "Julian Álvarez",
            "Stefan Ortega",
            "Scott Carson",
            "Rico Lewis",
            "Josh Wilson-Esbrand",
            "Luke Mbete",
          ];
        case "chelsea":
          return [
            "Kepa Arrizabalaga",
            "Thiago Silva",
            "N'Golo Kanté",
            "Mason Mount",
            "Kai Havertz",
            "Timo Werner",
            "Christian Pulisic",
            "Hakim Ziyech",
            "Mateo Kovačić",
            "Jorginho",
            "Reece James",
            "Ben Chilwell",
            "Antonio Rüdiger",
            "César Azpilicueta",
            "Marcos Alonso",
            "Romelu Lukaku",
            "Callum Hudson-Odoi",
            "Ross Barkley",
            "Ruben Loftus-Cheek",
            "Trevoh Chalobah",
            "Malang Sarr",
            "Saúl Ñíguez",
            "Marcus Bettinelli",
            "Édouard Mendy",
            "Armando Broja",
            "Conor Gallagher",
            "Lewis Hall",
          ];
        default:
          return [
            "Star Goalkeeper",
            "Captain Leader",
            "Main Striker",
            "Creative Mid",
            "Solid Defender",
            "Wing Player",
            "Box to Box",
            "Playmaker",
            "Full Back",
            "Centre Back",
            "Winger",
            "Striker",
            "Midfielder",
            "Defender",
            "Backup GK",
            "Squad Player",
            "Young Talent",
            "Veteran Pro",
            "Utility Man",
            "Sub Forward",
            "Rotation Mid",
            "Squad Depth",
            "Future Star",
            "Experience",
            "Academy Grad",
            "Loan Player",
            "New Signing",
          ];
      }
    };

    const teamPlayers = getTeamSpecificPlayers();

    return Array.from({ length: 27 }, (_, index) => ({
      id: index + 1,
      name: formatPlayerName(teamPlayers[index] || `Player ${index + 1}`),
      firstname: teamPlayers[index]?.split(" ")[0] || "Player",
      lastname: teamPlayers[index]?.split(" ")[1] || `${index + 1}`,
      age: 25,
      nationality: "England",
      height: null,
      weight: null,
      photo: "",
      position:
        index === 0 || index === 26
          ? "Goalkeeper"
          : index < 7
            ? "Forward"
            : index < 14
              ? "Midfielder"
              : "Defender",
      team: {
        id: parseInt(teamConfig.id.replace(/\D/g, "")) || 1,
        name: teamConfig.fullName,
        logo: "",
      },
    }));
  };

  // Check if player is selected
  const isPlayerSelected = (player: PremierLeaguePlayer) => {
    const playerId = `${teamConfig.id}_${player.id}`;
    return selectedPlayers.some((p) => p.id === playerId);
  };

  // Get player photo with Premier League service
  const getPlayerPhoto = (player: PremierLeaguePlayer) => {
    return premierLeagueApiService.getPlayerPhoto(player);
  };

  const renderPlayerRow = (
    rowPlayers: PremierLeaguePlayer[],
    rowIndex: number,
  ) => (
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
                nationality: player.nationality || "England",
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
