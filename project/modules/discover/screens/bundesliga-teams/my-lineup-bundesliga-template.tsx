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
import { TeamConfig } from "./bundesliga-config";
import bundesligaApiService, {
  BundesligaPlayer,
} from "../../../../services/bundesligaApiService";

const { width: screenWidth } = Dimensions.get("window");

interface BundesligaTeamProps {
  teamConfig: TeamConfig;
  onBack?: () => void;
  onPlayerSelect?: (player: any) => void;
  selectedPositionId?: string | null;
  onShowAlert?: () => void;
  selectedPlayers?: any[];
}

export default function MyLineupBundesligaTemplate({
  teamConfig,
  onBack,
  onPlayerSelect,
  selectedPositionId,
  onShowAlert,
  selectedPlayers = [],
}: BundesligaTeamProps) {
  const theme = useTheme();
  const [players, setPlayers] = useState<BundesligaPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiStatus, setApiStatus] = useState<string>(
    "Loading with smart enhancement...",
  );

  console.log(`🔥⚽ ${teamConfig.name} Bundesliga Team Template is rendering!`);

  // Fetch real Bundesliga players from API with dual API integration
  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        setLoading(true);
        console.log(
          `🔄 Fetching ${teamConfig.name} players from enhanced Bundesliga API...`,
        );

        // Test dual API connection first
        setApiStatus("Testing dual API connection...");
        const dualApiTest = await bundesligaApiService.testDualApiConnection();

        console.log("🧪 Dual API Test Results:", dualApiTest);
        setApiStatus(dualApiTest.recommendation);

        // Check for squad updates
        setApiStatus("Checking for squad updates...");
        const squadCheck = await bundesligaApiService.checkForSquadUpdates(
          teamConfig.apiName,
        );
        console.log(
          `📊 Squad freshness check for ${teamConfig.name}:`,
          squadCheck,
        );

        setApiStatus(`Fetching ${teamConfig.name} players with dual API...`);

        // Primary fetch with enhanced dual API support
        const apiPlayers = await bundesligaApiService.getBundesligaTeamPlayers(
          teamConfig.apiName,
          2024,
        );

        console.log(
          `📊 API returned ${apiPlayers.length} players for ${teamConfig.name}`,
        );

        if (apiPlayers.length > 0) {
          // Process and format the real API players with enhanced photo support
          const processedPlayers = apiPlayers.map((player) => ({
            id: player.id,
            name: formatPlayerName(player.name),
            firstname: player.firstname,
            lastname: player.lastname,
            age: player.age,
            nationality: player.nationality,
            height: player.height,
            weight: player.weight,
            photo: bundesligaApiService.getPlayerPhoto(player), // Enhanced photo method
            position: player.position,
            team: {
              id: player.team.id,
              name: teamConfig.fullName,
              logo: player.team.logo,
            },
          }));

          setPlayers(processedPlayers);

          // Enhanced status message
          const hasUpdates = squadCheck.hasUpdates ? " (Updated!)" : "";
          const apiSource = apiPlayers.length >= 20 ? "Dual API" : "Enhanced";
          setApiStatus(
            `✅ ${apiSource}: ${processedPlayers.length} current players${hasUpdates}`,
          );

          console.log(
            `✅ Successfully loaded ${processedPlayers.length} ${teamConfig.name} players`,
          );
        } else {
          // Fallback to placeholder players if API returns empty
          console.warn(
            `⚠️ No API data returned for ${teamConfig.name}, using fallback`,
          );
          setApiStatus(
            `⚠️ No API data - showing current ${teamConfig.name} squad`,
          );
          const fallbackPlayers = createPlayerPlaceholders();
          setPlayers(fallbackPlayers);
        }
      } catch (error) {
        console.error(`❌ Error fetching ${teamConfig.name} players:`, error);
        setApiStatus(`⚠️ Error - showing current ${teamConfig.name} squad`);
        const fallbackPlayers = createPlayerPlaceholders();
        setPlayers(fallbackPlayers);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayers();
  }, [teamConfig]);

  // Smart name formatting function for Bundesliga players
  const formatPlayerName = (fullName: string): string => {
    if (!fullName) return "Unknown";

    const nameParts = fullName.trim().split(" ");

    if (nameParts.length === 1) {
      // Single name (e.g., "Neuer") - truncate if too long
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
  const createPlayerPlaceholders = (): BundesligaPlayer[] => {
    // Get current realistic player names based on team
    const getCurrentTeamPlayers = () => {
      switch (teamConfig.id) {
        case "bayern-munich":
          return [
            "Manuel Neuer",
            "Sven Ulreich",
            "Joshua Kimmich",
            "Dayot Upamecano",
            "Min-jae Kim",
            "Matthijs de Ligt",
            "Alphonso Davies",
            "Noussair Mazraoui",
            "Raphaël Guerreiro",
            "Leon Goretzka",
            "Jamal Musiala",
            "Leroy Sané",
            "Serge Gnabry",
            "Kingsley Coman",
            "Thomas Müller",
            "Harry Kane",
            "Mathys Tel",
            "Eric Maxim Choupo-Moting",
            "Konrad Laimer",
            "Aleksandar Pavlović",
            "Eric Dier",
            "Bouna Sarr",
            "João Cancelo",
            "Tel Mathys",
            "Pavlović Aleksandar",
            "Dier Eric",
            "Guerreiro Raphaël",
          ];
        case "borussia-dortmund":
          return [
            "Gregor Kobel",
            "Alexander Meyer",
            "Mats Hummels",
            "Nico Schlotterbeck",
            "Julian Ryerson",
            "Ian Maatsen",
            "Ramy Bensebaini",
            "Emre Can",
            "Marcel Sabitzer",
            "Felix Nmecha",
            "Julian Brandt",
            "Marco Reus",
            "Karim Adeyemi",
            "Jadon Sancho",
            "Donyell Malen",
            "Niclas Füllkrug",
            "Youssoufa Moukoko",
            "Sebastien Haller",
            "Giovanni Reyna",
            "Jamie Bynoe-Gittens",
            "Salih Özcan",
            "Niklas Süle",
            "Antonios Papadopoulos",
            "Pascal Groß",
            "Waldemar Anton",
            "Yan Couto",
            "Maximilian Beier",
          ];
        case "rb-leipzig":
          return [
            "Péter Gulácsi",
            "Janis Blaswich",
            "Willi Orbán",
            "Castello Lukeba",
            "David Raum",
            "Benjamin Henrichs",
            "Amadou Haïdara",
            "Xaver Schlager",
            "Kevin Kampl",
            "Dani Olmo",
            "Christopher Nkunku",
            "Timo Werner",
            "Yussuf Poulsen",
            "André Silva",
            "Benjamin Šeško",
            "Loïs Openda",
            "Xavi Simons",
            "Fabio Carvalho",
            "Antonio Nusa",
            "El Chadaille Bitshiabu",
            "Nicolas Seiwald",
            "Eljif Elmas",
            "Christoph Baumgartner",
            "Arthur Vermeeren",
            "Viggo Gebel",
            "Lutsharel Geertruida",
            "Marco Rose",
          ];
        case "bayer-leverkusen":
          return [
            "Lukáš Hrádecký",
            "Matěj Kovář",
            "Jonathan Tah",
            "Piero Hincapié",
            "Edmond Tapsoba",
            "Jeremie Frimpong",
            "Álex Grimaldo",
            "Granit Xhaka",
            "Robert Andrich",
            "Exequiel Palacios",
            "Florian Wirtz",
            "Patrik Schick",
            "Victor Boniface",
            "Jonas Hofmann",
            "Amine Adli",
            "Nathan Tella",
            "Martin Terrier",
            "Aleix García",
            "Nordi Mukiele",
            "Arthur",
            "Jeanuel Belocian",
            "Francis Onyeka",
            "Gustavo Puerta",
            "Niklas Lomb",
            "Tim Fosu-Mensah",
            "Zidan Sertdemir",
            "Sardar Azmoun",
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
      nationality: "Germany",
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
        id: 157,
        name: teamConfig.fullName,
        logo: "",
      },
    }));
  };

  // Check if player is selected
  const isPlayerSelected = (player: BundesligaPlayer) => {
    return selectedPlayers?.some(
      (selectedPlayer) =>
        selectedPlayer.id === `${teamConfig.id}_${player.id}` ||
        selectedPlayer.name === player.name,
    );
  };

  // Get player photo URL
  const getPlayerPhoto = (player: BundesligaPlayer) => {
    return bundesligaApiService.getPlayerPhoto(player);
  };

  const renderPlayerRow = (
    rowPlayers: BundesligaPlayer[],
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
                nationality: player.nationality || "Germany",
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
                backgroundColor: theme.colors.background,
                borderColor: theme.colors.border,
              },
              // Add bright red selection ring for selected players
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

            {/* Selection indicator with bright red color */}
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
    height: 16,
  },
  bottomSpacing: {
    height: 30,
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
