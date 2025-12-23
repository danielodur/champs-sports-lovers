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
import { TeamConfig } from "./league-1-config";
import league1ApiService, {
  League1Player,
} from "../../../../services/league1ApiService";

const { width: screenWidth } = Dimensions.get("window");

interface League1TeamProps {
  teamConfig: TeamConfig;
  onBack?: () => void;
  onPlayerSelect?: (player: any) => void;
  selectedPositionId?: string | null;
  onShowAlert?: () => void;
  selectedPlayers?: any[];
}

export default function MyLineupLeague1Template({
  teamConfig,
  onBack,
  onPlayerSelect,
  selectedPositionId,
  onShowAlert,
  selectedPlayers = [],
}: League1TeamProps) {
  const theme = useTheme();
  const [players, setPlayers] = useState<League1Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiStatus, setApiStatus] = useState<string>("Loading...");

  // Fetch real Ligue 1 players from API
  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        setLoading(true);
        setApiStatus("Testing API connection...");

        // Test dual API connection first
        const dualApiTest = await league1ApiService.testDualApiConnection();

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
        const updateCheck = await league1ApiService.checkForSquadUpdates(teamConfig.apiName);
        if (updateCheck.hasUpdates) {
          console.log(`🔄 Squad updates available for ${teamConfig.name}:`, updateCheck);
        }

        setApiStatus(`Fetching ${teamConfig.name} players...`);

        // Use API service to get team players - try multiple seasons
        let apiPlayers: League1Player[] = [];

        // Try current season first, then fallback to previous seasons
        const seasonsToTry = [2025, 2024, 2023];

        for (const season of seasonsToTry) {
          setApiStatus(`Trying season ${season}...`);

          try {
            apiPlayers = await league1ApiService.getLeague1TeamPlayers(
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

  // Smart name formatting function for Ligue 1 players
  const formatPlayerName = (fullName: string): string => {
    if (!fullName) return "Unknown";

    const nameParts = fullName.trim().split(" ");

    if (nameParts.length === 1) {
      // Single name (e.g., "Mbappé") - truncate if too long
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
  const createPlayerPlaceholders = (): League1Player[] => {
    // Get current realistic player names based on team
    const getCurrentTeamPlayers = () => {
      switch (teamConfig.id) {
        case "psg":
          return [
            "Gianluigi Donnarumma",
            "Keylor Navas",
            "Achraf Hakimi",
            "Marquinhos",
            "Presnel Kimpembe",
            "Nuno Mendes",
            "Nordi Mukiele",
            "Milan Škriniar",
            "Marco Verratti",
            "Vitinha",
            "Fabián Ruiz",
            "Warren Zaïre-Emery",
            "Renato Sanches",
            "Lee Kang-in",
            "Ousmane Dembélé",
            "Bradley Barcola",
            "Kylian Mbappé",
            "Gonçalo Ramos",
            "Randal Kolo Muani",
            "Hugo Ekitike",
            "Senny Mayulu",
            "Lucas Hernández",
            "Danilo Pereira",
            "Manuel Ugarte",
            "Carlos Soler",
            "Layvin Kurzawa",
            "Alexandre Letellier",
          ];
        case "marseille":
          return [
            "Pau López",
            "Rubén Blanco",
            "Jonathan Clauss",
            "Samuel Gigot",
            "Leonardo Balerdi",
            "Chancel Mbemba",
            "Quentin Merlin",
            "Amir Murillo",
            "Pierre-Emerick Aubameyang",
            "Ismaïla Sarr",
            "Geoffrey Kondogbia",
            "Azzedine Ounahi",
            "Jordan Veretout",
            "Amine Harit",
            "Iliman Ndiaye",
            "Luis Henrique",
            "Mason Greenwood",
            "Neal Maupay",
            "Elye Wahi",
            "Valentin Rongier",
            "Ulisses Garcia",
            "Derek Cornelius",
            "Bamo Meïté",
            "Bilal Nadir",
            "Emran Soglo",
            "Simon Ngapandouetnbu",
            "Roggerio Nyakossi",
          ];
        case "monaco":
          return [
            "Alexander Nübel",
            "Radosław Majecki",
            "Vanderson",
            "Thilo Kehrer",
            "Wilfried Singo",
            "Caio Henrique",
            "Mohammed Salisu",
            "Denis Zakaria",
            "Youssouf Fofana",
            "Aleksandr Golovin",
            "Takumi Minamino",
            "Wissam Ben Yedder",
            "Folarin Balogun",
            "Breel Embolo",
            "Eliesse Ben Seghir",
            "Maghnes Akliouche",
            "Krepin Diatta",
            "Ismail Jakobs",
            "Soungoutou Magassa",
            "Eliot Matazo",
            "Lucas Michal",
            "Myron Boadu",
            "Mamadou Coulibaly",
            "Edan Diop",
            "George Ilenikhena",
            "Kassoum Ouattara",
            "Chrislain Matsima",
          ];
        case "lille":
          return [
            "Lucas Chevalier",
            "Vito Mannone",
            "Tiago Santos",
            "Bafodé Diakité",
            "Leny Yoro",
            "Alexsandro Ribeiro",
            "Gabriel Gudmundsson",
            "Ismaily",
            "Benjamin André",
            "Angel Gomes",
            "Nabil Bentaleb",
            "Rémy Cabella",
            "Edon Zhegrova",
            "Hakon Arnar Haraldsson",
            "Jonathan David",
            "Yusuf Yazıcı",
            "Mohamed Bayo",
            "Osame Sahraoui",
            "Ivan Cavaleiro",
            "Trevis Dago",
            "Ayyoub Bouaddi",
            "Ngal'ayel Mukau",
            "Ousmane Touré",
            "Thomas Meunier",
            "Samuel Umtiti",
            "Aaron Malouda",
            "Matias Fernandez-Pardo",
          ];
        case "lyon":
          return [
            "Anthony Lopes",
            "Lucas Perri",
            "Malo Gusto",
            "Dejan Lovren",
            "Castello Lukeba",
            "Nicolás Tagliafico",
            "Duje Ćaleta-Car",
            "Clinton Mata",
            "Nemanja Matić",
            "Corentin Tolisso",
            "Maxence Caqueret",
            "Johann Lepenant",
            "Rayan Cherki",
            "Alexandre Lacazette",
            "Moussa Dembélé",
            "Gift Orban",
            "Ernest Nuamah",
            "Malick Fofana",
            "Saïd Benrahma",
            "Ainsley Maitland-Niles",
            "Paul Akouokou",
            "Mahamadou Diawara",
            "Florent Sanchez",
            "Justin Bengui",
            "Georges Mikautadze",
            "Wilfried Zaha",
            "Jordan Teze",
          ];
        case "lens":
          return [
            "Brice Samba",
            "Hervé Koffi",
            "Jonathan Gradit",
            "Kevin Danso",
            "Facundo Medina",
            "Jhoanner Chávez",
            "Przemysław Frankowski",
            "Ruben Aguilar",
            "Seko Fofana",
            "Andy Diouf",
            "Neil El Aynaoui",
            "Adrien Thomasson",
            "Angelo Fulgini",
            "Florian Sotoca",
            "Elye Wahi",
            "Wesley Saïd",
            "Morgan Guilavogui",
            "Rémy Labeau Lascary",
            "Oscar Cortes",
            "Nampalys Mendy",
            "Massadio Haïdara",
            "Abdukodir Khusanov",
            "Malang Sarr",
            "David Pereira da Costa",
            "Tom Pouilly",
            "Ayanda Sishuba",
            "Goduine Koyalipou",
          ];
        case "rennes":
          return [
            "Steve Mandanda",
            "Gauthier Gallon",
            "Lorenz Assignon",
            "Arthur Theate",
            "Christopher Wooh",
            "Adrien Truffert",
            "Mikayil Faye",
            "Leo Østigård",
            "Baptiste Santamaría",
            "Désiré Doué",
            "Ludovic Blas",
            "Fabian Rieder",
            "Amine Gouiri",
            "Martin Terrier",
            "Arnaud Kalimuendo",
            "Ibrahim Salah",
            "Glen Kamara",
            "Azor Matusiwa",
            "Alidu Seidu",
            "Jordan James",
            "Albert Grønbæk",
            "Henrik Meister",
            "Mahamadou Nagida",
            "Mohamed Jaouab",
            "Warmed Omari",
            "Jeanuel Belocian",
            "Andrés Gomez",
          ];
        case "nice":
          return [
            "Marcin Bułka",
            "Matteo Carnesecchi",
            "Jordan Lotomba",
            "Dante",
            "Jean-Clair Todibo",
            "Melvin Bard",
            "Youcef Atal",
            "Antoine Mendy",
            "Khéphren Thuram",
            "Morgan Sanson",
            "Hicham Boudaoui",
            "Pablo Rosario",
            "Terem Moffi",
            "Gaëtan Laborde",
            "Evann Guessand",
            "Jérémie Boga",
            "Billal Brahimi",
            "Sofiane Diop",
            "Jonathan Clauss",
            "Romain Perraud",
            "Tom Louchet",
            "Aliou Balde",
            "Victor Orakpo",
            "Issiaga Camara",
            "Yanis Ali Issoufou",
            "Amidou Doumbouya",
            "Badredine Bouanani",
          ];
        case "strasbourg":
          return [
            "Matz Sels",
            "Alaa Bellaarouch",
            "Guela Doué",
            "Abakar Sylla",
            "Ismaël Doukouré",
            "Frédéric Guilbert",
            "Marvin Senaya",
            "Thomas Delaine",
            "Jean-Ricner Bellegarde",
            "Ibrahima Sissoko",
            "Andrey Santos",
            "Habib Diarra",
            "Dilane Bakwa",
            "Emanuel Emegha",
            "Lebo Mothiba",
            "Moïse Sahi Dion",
            "Junior Mwanga",
            "Caleb Wiley",
            "Diego Moreira",
            "Saïdou Sow",
            "Eduard Sobol",
            "Sebastian Nanasi",
            "Félix Lemaréchal",
            "Pape Diong",
            "Rabby Nzingoula",
            "Jeremy Sebas",
            "Rayane Messi",
          ];
        case "nantes":
          return [
            "Alban Lafont",
            "Rémy Descamps",
            "Nicolas Cozza",
            "Jean-Charles Castelletto",
            "Nathan Zeze",
            "Marcus Coco",
            "Fabien Centonze",
            "Jean-Kévin Duverne",
            "Pedro Chirivella",
            "Douglas Augusto",
            "Moussa Sissoko",
            "Samuel Moutoussamy",
            "Mostafa Mohamed",
            "Moses Simon",
            "Matthis Abline",
            "Tino Kadewere",
            "Johann Lepenant",
            "Sorba Thomas",
            "Florent Mollet",
            "Kelvin Amian",
            "Ronaël Pierre-Gabriel",
            "Louis Leroux",
            "Lohann Doucet",
            "Ignatius Ganago",
            "Bahereba Guirassy",
            "Hugo Boutsingkham",
            "Nathan Zéouski",
          ];
        case "montpellier":
          return [
            "Benjamin Lecomte",
            "Dimitry Bertaud",
            "Enzo Tchato",
            "Becir Omeragić",
            "Issiaga Sylla",
            "Lucas Mincarelli",
            "Falaye Sacko",
            "Modibo Sagnan",
            "Joris Chotard",
            "Jordan Ferri",
            "Téji Savanier",
            "Léo Leroy",
            "Wahbi Khazri",
            "Akor Adams",
            "Tanguy Coulibaly",
            "Arnaud Nordin",
            "Yanis Issoufou",
            "Rabby Nzingoula",
            "Khalil Fayad",
            "Stefan Dzodic",
            "Enzo Tchato",
            "Mamadou Sakho",
            "Christopher Jullien",
            "Théo Chennahi",
            "Junior Ndiaye",
            "Yanis Ali Issoufou",
            "Gabriel Barès",
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
      nationality: "France",
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
        id: 61,
        name: teamConfig.fullName,
        logo: "",
      },
    }));
  };

  // Check if player is selected
  const isPlayerSelected = (player: League1Player) => {
    const playerId = `${teamConfig.id}_${player.id}`;
    return selectedPlayers.some((p) => p.id === playerId);
  };

  // Get player photo URL with enhanced multi-source support
  const getPlayerPhoto = (player: League1Player) => {
    // Use the enhanced photo method that tries multiple sources
    return league1ApiService.getPlayerPhoto(player);
  };

  // Check for squad updates and refresh if needed
  const checkForSquadUpdates = async () => {
    try {
      const updateCheck = await league1ApiService.checkForSquadUpdates(teamConfig.apiName);
      
      if (updateCheck.hasUpdates) {
        console.log(`🔄 Squad updates available for ${teamConfig.name}:`, updateCheck);
        
        // Optionally auto-refresh or notify user
        if (updateCheck.newPlayers.length > 0 || updateCheck.outdatedPlayers.length > 0) {
          setApiStatus(`Updates available: ${updateCheck.newPlayers.length} new, ${updateCheck.outdatedPlayers.length} outdated`);
          
          // Auto-refresh if significant changes
          if (updateCheck.newPlayers.length > 3) {
            const refreshedPlayers = await league1ApiService.forceRefreshTeamData(teamConfig.apiName);
            setPlayers(refreshedPlayers);
            setApiStatus(`Refreshed with ${refreshedPlayers.length} updated players`);
          }
        }
      }
    } catch (error) {
      console.error("Error checking squad updates:", error);
    }
  };

  const renderPlayerRow = (rowPlayers: League1Player[], rowIndex: number) => (
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
                nationality: player.nationality || "France",
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
          color={teamConfig.primaryColor || "#004170"}
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
