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
import { TeamConfig } from "./ugandan-pl-config";
import ugandanPLApiService, {
  UgandanPLPlayer,
} from "../../../../services/ugandanPLApiService";

const { width: screenWidth } = Dimensions.get("window");

interface UgandanPLTeamProps {
  teamConfig: TeamConfig;
  onBack?: () => void;
  onPlayerSelect?: (player: any) => void;
  selectedPositionId?: string | null;
  onShowAlert?: () => void;
  selectedPlayers?: any[];
}

export default function MyLineupUgandanPLTemplate({
  teamConfig,
  onBack,
  onPlayerSelect,
  selectedPositionId,
  onShowAlert,
  selectedPlayers = [],
}: UgandanPLTeamProps) {
  const theme = useTheme();
  const [players, setPlayers] = useState<UgandanPLPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiStatus, setApiStatus] = useState<string>("Loading...");

  // Fetch real Ugandan PL players from API
  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        setLoading(true);
        setApiStatus("Testing API connection...");

        // Test dual API connection first
        const dualApiTest = await ugandanPLApiService.testDualApiConnection();

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
        const updateCheck = await ugandanPLApiService.checkForSquadUpdates(teamConfig.apiName);
        if (updateCheck.hasUpdates) {
          console.log(`🔄 Squad updates available for ${teamConfig.name}:`, updateCheck);
        }

        setApiStatus(`Fetching ${teamConfig.name} players...`);

        // Use API service to get team players - try multiple seasons
        let apiPlayers: UgandanPLPlayer[] = [];

        // Try current season first, then fallback to previous seasons
        const seasonsToTry = [2025, 2024, 2023];

        for (const season of seasonsToTry) {
          setApiStatus(`Trying season ${season}...`);

          try {
            apiPlayers = await ugandanPLApiService.getUgandanPLTeamPlayers(
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

  // Smart name formatting function for Ugandan PL players
  const formatPlayerName = (fullName: string): string => {
    if (!fullName) return "Unknown";

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

  // Create team-specific player placeholders - used as fallback
  const createPlayerPlaceholders = (): UgandanPLPlayer[] => {
    // Get current realistic player names based on team
    const getCurrentTeamPlayers = () => {
      switch (teamConfig.id) {
        case "kcca-fc":
          return [
            "Benjamin Ochan",
            "Charles Lukwago",
            "Hassan Muhamood",
            "Timothy Awany",
            "Herbert Achai",
            "Mustafa Kizza",
            "Peter Magambo",
            "Sadat Anaku",
            "Gift Ali",
            "Julius Poloto",
            "Ashraf Mugume",
            "Moses Waiswa",
            "Allan Okello",
            "Bright Anukani",
            "Rogers Mato",
            "Samuel Ssenyonjo",
            "Usama Arafat",
            "Patrick Kaddu",
            "Brian Aheebwa",
            "Erisa Ssekisambu",
            "Davis Kasirye",
            "Muzamiru Mutyaba",
            "Filbert Obenchan",
            "Muhammad Shaban",
            "Mike Mutyaba",
            "Julius Kyambadde",
            "Hassan Ssenyondo",
          ];
        case "vipers-sc":
          return [
            "Fabien Mutombora",
            "Alfred Mudekereza",
            "Jack Komakech",
            "Livingstone Mulondo",
            "Halid Lwaliwa",
            "Geoffrey Wasswa",
            "Aziz Kayondo",
            "Joseph Dhata",
            "Bashir Asiku",
            "Bobosi Byaruhanga",
            "Siraje Sentamu",
            "Ibrahim Orit",
            "Allan Kayiwa",
            "Paul Mucureezi",
            "Yunus Sentamu",
            "Milton Karisa",
            "Cesar Manzoki",
            "Dan Sserunkuma",
            "Brian Nkuubi",
            "Fazil Tumwine",
            "Bright Anukani",
            "Martin Kizza",
            "Cromwell Rwothomio",
            "Tito Okello",
            "Najib Yiga",
            "Richard Basangwa",
            "Dickson Matama",
          ];
        case "express-fc":
          return [
            "Mathias Muwanga",
            "Tony Kyamera",
            "Murushid Juuko",
            "Enock Walusimbi",
            "Isa Mubiru",
            "Isaac Mutanga",
            "Arthur Kiggundu",
            "John Revita",
            "Frank Kalanda",
            "Mahad Kakooza",
            "George Senkaaba",
            "Eric Kambale",
            "Godfrey Lwesibawa",
            "Abel Eturude",
            "Ivan Eyam",
            "Disan Galiwango",
            "Alex Kitata",
            "Richard Ayiko",
            "Ivan Bogere",
            "Fred Amaku",
            "Emmanuel Loki",
            "Robert Eseru",
            "Dickson Niwamanya",
            "Emmanuel Wasswa",
            "Joseph Akandwanaho",
            "Baker Lukooya",
            "Bashir Mutanda",
          ];
        case "sc-villa":
          return [
            "Saidi Keni",
            "Hassan Matovu",
            "Joel Mutakubwa",
            "Douglas Muganga",
            "Gavin Kizito",
            "Ambrose Kirya",
            "Ronald Ssempala",
            "Kenneth Kimera",
            "Ashraf Mandela",
            "Umar Mukobe",
            "Denis Guma",
            "Ronald Magwali",
            "Hakim Kiwanuka",
            "Pius Kaggwa",
            "Ivan Ntege",
            "Vialli Bainomugisha",
            "Bashir Sekagya",
            "Abraham Tusubira",
            "Derrick Ndahiro",
            "Shafik Nana Kwikiriza",
            "Goffin Oyirwoth",
            "Andrew Waiswa",
            "Joseph Ssemujju",
            "Travis Mutyaba",
            "Karim Watambala",
            "Henry Kitegenyi",
            "Andrew Kalyesubula",
          ];
        case "ura-fc":
          return [
            "James Alitho",
            "Hannington Ssebwalunyo",
            "Derrick Ochan",
            "Benjamin Nyakojo",
            "Najib Fesali",
            "Joachim Ojera",
            "Shafik Kagimu",
            "Hudu Mulikyi",
            "Ibrahim Dada",
            "Cromwell Rwothomio",
            "Steven Dese Mukwala",
            "Saidi Kyeyune",
            "Shafik Avemah",
            "Ivan Ntege",
            "Ronald Otti",
            "Dickson Matama",
            "Stiven Mukwala",
            "Benjamin Totori",
            "Norman Ojik",
            "Ivan Ahimbisibwe",
            "Innocent Wafula",
            "Julius Mutyaba",
            "Silver Kyekungu",
            "Brian Nkuubi",
            "Cromwell Rwothomio",
            "Godwin Matsiko",
            "Hussein Rajab",
          ];
        case "bul-fc":
          return [
            "Simon Tamale",
            "Christopher Kalungi",
            "Emmanuel Kalyowa",
            "Alex Kitata",
            "Emmanuel Wasswa",
            "Joel Madondo",
            "Ronald Orombi",
            "Joseph Akandwanaho",
            "Baker Lukooya",
            "Bashir Mutanda",
            "Richard Ayiko",
            "Ivan Bogere",
            "Fred Amaku",
            "Emmanuel Loki",
            "Robert Eseru",
            "Dickson Niwamunya",
            "Emmanuel Wasswa",
            "Joseph Dhata",
            "Martin Kizza",
            "Richard Basangwa",
            "Dickson Matama",
            "Najib Yiga",
            "Tito Okello",
            "Cromwell Rwothomio",
            "Brian Nkuubi",
            "Fazil Tumwine",
            "Bright Anukani",
          ];
        case "nec-fc":
          return [
            "Andrew Waiswa",
            "Joseph Ssemujju",
            "Travis Mutyaba",
            "Karim Watambala",
            "Henry Kitegenyi",
            "Andrew Kalyesubula",
            "Ivan Ntege",
            "Ronald Magwali",
            "Hakim Kiwanuka",
            "Pius Kaggwa",
            "Vialli Bainomugisha",
            "Bashir Sekagya",
            "Abraham Tusubira",
            "Derrick Ndahiro",
            "Shafik Nana Kwikiriza",
            "Goffin Oyirwoth",
            "Denis Guma",
            "Umar Mukobe",
            "Ashraf Mandela",
            "Kenneth Kimera",
            "Ronald Ssempala",
            "Ambrose Kirya",
            "Gavin Kizito",
            "Douglas Muganga",
            "Joel Mutakubwa",
            "Hassan Matovu",
            "Saidi Keni",
          ];
        case "updf-fc":
          return [
            "Hussein Rajab",
            "Godwin Matsiko",
            "Silver Kyekungu",
            "Julius Mutyaba",
            "Innocent Wafula",
            "Ivan Ahimbisibwe",
            "Norman Ojik",
            "Benjamin Totori",
            "Stiven Mukwala",
            "Ronald Otti",
            "Shafik Avemah",
            "Saidi Kyeyune",
            "Steven Dese Mukwala",
            "Ibrahim Dada",
            "Hudu Mulikyi",
            "Shafik Kagimu",
            "Joachim Ojera",
            "Najib Fesali",
            "Benjamin Nyakojo",
            "Derrick Ochan",
            "Hannington Ssebwalunyo",
            "James Alitho",
            "Cromwell Rwothomio",
            "Dickson Matama",
            "Brian Nkuubi",
            "Ivan Ntege",
            "Ronald Otti",
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
      nationality: "Uganda",
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
        id: 288,
        name: teamConfig.fullName,
        logo: "",
      },
    }));
  };

  // Check if player is selected
  const isPlayerSelected = (player: UgandanPLPlayer) => {
    const playerId = `${teamConfig.id}_${player.id}`;
    return selectedPlayers.some((p) => p.id === playerId);
  };

  // Get player photo URL with enhanced multi-source support
  const getPlayerPhoto = (player: UgandanPLPlayer) => {
    // Use the enhanced photo method that tries multiple sources
    return ugandanPLApiService.getPlayerPhoto(player);
  };

  // Check for squad updates and refresh if needed
  const checkForSquadUpdates = async () => {
    try {
      const updateCheck = await ugandanPLApiService.checkForSquadUpdates(teamConfig.apiName);
      
      if (updateCheck.hasUpdates) {
        console.log(`🔄 Squad updates available for ${teamConfig.name}:`, updateCheck);
        
        // Optionally auto-refresh or notify user
        if (updateCheck.newPlayers.length > 0 || updateCheck.outdatedPlayers.length > 0) {
          setApiStatus(`Updates available: ${updateCheck.newPlayers.length} new, ${updateCheck.outdatedPlayers.length} outdated`);
          
          // Auto-refresh if significant changes
          if (updateCheck.newPlayers.length > 3) {
            const refreshedPlayers = await ugandanPLApiService.forceRefreshTeamData(teamConfig.apiName);
            setPlayers(refreshedPlayers);
            setApiStatus(`Refreshed with ${refreshedPlayers.length} updated players`);
          }
        }
      }
    } catch (error) {
      console.error("Error checking squad updates:", error);
    }
  };

  const renderPlayerRow = (rowPlayers: UgandanPLPlayer[], rowIndex: number) => (
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
                nationality: player.nationality || "Uganda",
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
          color={teamConfig.primaryColor || "#FFD700"}
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
