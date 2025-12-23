import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  Image,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
} from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { ArrowLeft } from "lucide-react-native";
import {
  getCountryImage,
  hasRealCountryImage,
} from "../../../assets/images/countries/index";
import nationalTeamApiService, {
  NationalTeamPlayer,
} from "../../../services/nationalTeamApiService";
import MyLineupTeamUganda from "./national-teams/my-lineup-team-uganda";
import MyLineupTeamArgentina from "./national-teams/my-lineup-team-argentina";
import MyLineupTeamBrazil from "./national-teams/my-lineup-team-brazil";
import MyLineupTeamFrance from "./national-teams/my-lineup-team-france";
import MyLineupTeamBelgium from "./national-teams/my-lineup-team-belgium";
import MyLineupTeamCroatia from "./national-teams/my-lineup-team-croatia";
import MyLineupTeamColombia from "./national-teams/my-lineup-team-colombia";
import MyLineupTeamDenmark from "./national-teams/my-lineup-team-denmark";
import MyLineupTeamEgypt from "./national-teams/my-lineup-team-egypt";
import MyLineupTeamEngland from "./national-teams/my-lineup-team-england";
import MyLineupTeamGermany from "./national-teams/my-lineup-team-germany";
import MyLineupTeamItaly from "./national-teams/my-lineup-team-italy";
import MyLineupTeamJapan from "./national-teams/my-lineup-team-japan";
import MyLineupTeamSKorea from "./national-teams/my-lineup-team-s-korea";
import MyLineupTeamMexico from "./national-teams/my-lineup-team-mexico";
import MyLineupTeamMorocco from "./national-teams/my-lineup-team-morocco";
import MyLineupTeamNetherlands from "./national-teams/my-lineup-team-netherlands";
import MyLineupTeamPortugal from "./national-teams/my-lineup-team-portugal";
import MyLineupTeamSenegal from "./national-teams/my-lineup-team-senegal";
import MyLineupTeamSpain from "./national-teams/my-lineup-team-spain";
import MyLineupTeamSwitzerland from "./national-teams/my-lineup-team-switzerland";

const { width: screenWidth } = Dimensions.get("window");

interface NationalTeamProps {
  onCountrySelect?: (countryName: string) => void;
  onPlayerSelect?: (player: {
    id: string;
    name: string;
    position: string;
    team: string;
    image: string;
    nationality: string;
  }) => void;
  selectedPositionId?: string | null;
  onShowAlert?: () => void;
  selectedPlayers?: any[];
}

export default function MyLineupNationalTeam({
  onCountrySelect,
  onPlayerSelect,
  selectedPositionId,
  onShowAlert,
  selectedPlayers = [],
}: NationalTeamProps) {
  const theme = useTheme();

  // State for country selection and slide animation
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [slideAnimation] = useState(new Animated.Value(0));
  const [countryPlayers, setCountryPlayers] = useState<NationalTeamPlayer[]>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Function to get country image with fallback to placeholder
  const getCountryImageData = (countryName: string) => {
    const realImage = getCountryImage(countryName);

    if (realImage) {
      return {
        type: "image",
        source: realImage,
      };
    }

    return {
      type: "placeholder",
      initials: getCountryInitials(countryName),
      color: getCountryColor(countryName),
    };
  };

  // Function to get country initials
  const getCountryInitials = (countryName: string) => {
    const words = countryName.split(" ");
    if (words.length >= 2) {
      return `${words[0][0]}${words[1][0]}`.toUpperCase();
    } else if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }
    return "FL";
  };

  // Function to get country color based on name
  const getCountryColor = (countryName: string) => {
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
    ];

    // Simple hash function to get consistent color for each country
    let hash = 0;
    for (let i = 0; i < countryName.length; i++) {
      hash = countryName.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  // Create array of 22 countries distributed across 2 rows (11 each)
  const createCountryPlaceholders = () => {
    const countryNames = [
      // Row 1 - 11 countries (Updated list according to your requirements)
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
      "Turkey",
      // Row 2 - 11 countries
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

    return Array.from({ length: 22 }, (_, index) => ({
      id: `country_${index + 1}`,
      name: countryNames[index],
    }));
  };

  // Fetch real players for selected country
  const fetchCountryPlayers = async (countryName: string) => {
    setLoading(true);
    setError(null);

    try {
      console.log(`🔄 Fetching players for ${countryName}...`);
      console.log(
        `📊 API Key check:`,
        process.env.EXPO_PUBLIC_API_FOOTBALL_KEY ? "Present" : "Missing",
      );

      const players =
        await nationalTeamApiService.getNationalTeamPlayers(countryName);

      if (players.length > 0) {
        setCountryPlayers(players);
        console.log(`✅ Loaded ${players.length} players for ${countryName}`);
        console.log(
          `📸 Sample player photos:`,
          players
            .slice(0, 3)
            .map((p) => ({ name: p.name, hasPhoto: !!p.photo })),
        );
      } else {
        console.warn(
          `⚠️ No players returned from API for ${countryName}, using fallback`,
        );
        const placeholderPlayers = Array.from({ length: 22 }, (_, index) => ({
          id: index + 1,
          name: `${countryName} Player ${index + 1}`,
          firstname: `Player`,
          lastname: `${index + 1}`,
          age: 25,
          nationality: countryName,
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
            name: `${countryName} National Team`,
            logo: "",
          },
        }));
        setCountryPlayers(placeholderPlayers);
        setError(
          `Using sample data - API returned no players for ${countryName}`,
        );
      }
    } catch (error: any) {
      console.error(`❌ Error fetching players for ${countryName}:`, error);
      console.error(`❌ Error details:`, {
        message: error?.message,
        status: error?.status,
        response: error?.response,
      });

      const errorMessage = error?.message?.includes("403")
        ? `API Authentication failed - please check API key for ${countryName}`
        : `Failed to load players for ${countryName}: ${error?.message || "Unknown error"}`;

      setError(errorMessage);

      // Set placeholder data on error
      const placeholderPlayers = Array.from({ length: 22 }, (_, index) => ({
        id: index + 1,
        name: `${countryName} Player ${index + 1}`,
        firstname: `Player`,
        lastname: `${index + 1}`,
        age: 25,
        nationality: countryName,
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
          name: `${countryName} National Team`,
          logo: "",
        },
      }));
      setCountryPlayers(placeholderPlayers);
    } finally {
      setLoading(false);
    }
  };

  // Handle country selection
  const handleCountryPress = async (countryName: string) => {
    setSelectedCountry(countryName);

    // Start slide animation
    Animated.timing(slideAnimation, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // For Uganda, Argentina, Brazil, and France, we don't need to fetch API data as we have dedicated components
    if (
      countryName !== "Uganda" &&
      countryName !== "Argentina" &&
      countryName !== "Brazil" &&
      countryName !== "France"
    ) {
      // Fetch real player data for other countries
      await fetchCountryPlayers(countryName);
    }
  };

  // Handle back to countries
  const handleBackToCountries = () => {
    Animated.timing(slideAnimation, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setSelectedCountry(null);
    });
  };

  const countries = createCountryPlaceholders();

  const renderCountryRow = (
    rowCountries: typeof countries,
    rowIndex: number,
  ) => (
    <ScrollView
      key={`row_${rowIndex}`}
      horizontal
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      style={styles.countryRow}
      contentContainerStyle={styles.countryRowContent}
      decelerationRate="fast"
      scrollEventThrottle={16}
      bounces={true}
      alwaysBounceHorizontal={false}
      directionalLockEnabled={true}
    >
      {rowCountries.map((country) => (
        <TouchableOpacity
          key={country.id}
          style={styles.countryContainer}
          onPress={() => handleCountryPress(country.name)}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.countryCircle,
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
            ]}
          >
            {(() => {
              const imageData = getCountryImageData(country.name);

              if (imageData.type === "image") {
                return (
                  <Image
                    source={imageData.source}
                    style={styles.countryImage}
                    resizeMode="cover"
                  />
                );
              } else {
                return (
                  <View
                    style={[
                      styles.countryImage,
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
          </View>
          <Text style={[styles.countryName, { color: theme.colors.text }]}>
            {country.name}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  // Render country players with real data and photos
  const renderCountryPlayerRow = (
    rowPlayers: NationalTeamPlayer[],
    rowIndex: number,
  ) => (
    <ScrollView
      key={`player_row_${rowIndex}`}
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
          onPress={() =>
            onPlayerSelect &&
            onPlayerSelect({
              id: player.id.toString(),
              name: player.name,
              position: player.position,
              team: player.team.name,
              image: nationalTeamApiService.getPlayerPhoto(player),
              nationality: player.nationality,
            })
          }
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.playerCircle,
              {
                backgroundColor: "#FFFFFF",
                borderColor: "rgba(128, 128, 128, 0.2)",
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
              <View style={styles.playerPhotoPlaceholder}>
                <Text style={styles.playerInitials}>
                  {(player.firstname[0] || "") + (player.lastname[0] || "")}
                </Text>
              </View>
            )}
          </View>
          <Text
            style={[styles.playerName, { color: theme.colors.text }]}
            numberOfLines={2}
          >
            {player.name}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  // Split countries into 2 rows of 11 each
  const row1 = countries.slice(0, 11);
  const row2 = countries.slice(11, 22);

  // Split real country players into rows
  const playerRow1 = countryPlayers.slice(0, 11);
  const playerRow2 = countryPlayers.slice(11, 22);

  return (
    <View style={styles.container}>
      {/* Countries View */}
      <Animated.View
        style={[
          styles.countriesContainer,
          {
            transform: [
              {
                translateX: slideAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -screenWidth],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.topSpacing} />
        {renderCountryRow(row1, 0)}
        <View style={styles.rowSpacing} />
        {renderCountryRow(row2, 1)}
      </Animated.View>

      {/* Country Players View */}
      <Animated.View
        style={[
          styles.playersContainer,
          {
            transform: [
              {
                translateX: slideAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [screenWidth, 0],
                }),
              },
            ],
          },
        ]}
      >
        {/* Header with back button and country info */}
        <View style={styles.playersHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackToCountries}
            activeOpacity={0.7}
          >
            <ArrowLeft size={20} color={theme.colors.text} />
          </TouchableOpacity>
          <View style={styles.countryHeaderInfo}>
            {selectedCountry && getCountryImage(selectedCountry) && (
              <Image
                source={getCountryImage(selectedCountry)}
                style={styles.countryHeaderFlag}
                resizeMode="cover"
              />
            )}
            <Text
              style={[styles.countryHeaderName, { color: theme.colors.text }]}
            >
              {selectedCountry}
            </Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        {/* Players Grid */}
        {selectedCountry === "Uganda" ? (
          <View style={styles.ugandaContainer}>
            <MyLineupTeamUganda
              onPlayerSelect={onPlayerSelect}
              selectedPositionId={selectedPositionId}
              onShowAlert={onShowAlert}
              selectedPlayers={selectedPlayers}
            />
          </View>
        ) : selectedCountry === "Argentina" ? (
          <View style={styles.argentinaContainer}>
            <MyLineupTeamArgentina
              onPlayerSelect={onPlayerSelect}
              selectedPositionId={selectedPositionId}
              onShowAlert={onShowAlert}
              selectedPlayers={selectedPlayers}
            />
          </View>
        ) : selectedCountry === "Brazil" ? (
          <View style={styles.brazilContainer}>
            <MyLineupTeamBrazil
              onPlayerSelect={onPlayerSelect}
              selectedPositionId={selectedPositionId}
              onShowAlert={onShowAlert}
              selectedPlayers={selectedPlayers}
            />
          </View>
        ) : selectedCountry === "France" ? (
          <View style={styles.franceContainer}>
            <MyLineupTeamFrance
              onPlayerSelect={onPlayerSelect}
              selectedPositionId={selectedPositionId}
              onShowAlert={onShowAlert}
              selectedPlayers={selectedPlayers}
            />
          </View>
        ) : selectedCountry === "Belgium" ? (
          <View style={styles.belgiumContainer}>
            <MyLineupTeamBelgium
              onPlayerSelect={onPlayerSelect}
              selectedPositionId={selectedPositionId}
              onShowAlert={onShowAlert}
              selectedPlayers={selectedPlayers}
            />
          </View>
        ) : selectedCountry === "Croatia" ? (
          <View style={styles.croatiaContainer}>
            <MyLineupTeamCroatia
              onPlayerSelect={onPlayerSelect}
              selectedPositionId={selectedPositionId}
              onShowAlert={onShowAlert}
              selectedPlayers={selectedPlayers}
            />
          </View>
        ) : selectedCountry === "Colombia" ? (
          <View style={styles.colombiaContainer}>
            <MyLineupTeamColombia
              onPlayerSelect={onPlayerSelect}
              selectedPositionId={selectedPositionId}
              onShowAlert={onShowAlert}
              selectedPlayers={selectedPlayers}
            />
          </View>
        ) : selectedCountry === "Denmark" ? (
          <View style={styles.denmarkContainer}>
            <MyLineupTeamDenmark
              onPlayerSelect={onPlayerSelect}
              selectedPositionId={selectedPositionId}
              onShowAlert={onShowAlert}
              selectedPlayers={selectedPlayers}
            />
          </View>
        ) : selectedCountry === "Egypt" ? (
          <View style={styles.egyptContainer}>
            <MyLineupTeamEgypt
              onPlayerSelect={onPlayerSelect}
              selectedPositionId={selectedPositionId}
              onShowAlert={onShowAlert}
              selectedPlayers={selectedPlayers}
            />
          </View>
        ) : selectedCountry === "England" ? (
          <View style={styles.englandContainer}>
            <MyLineupTeamEngland
              onPlayerSelect={onPlayerSelect}
              selectedPositionId={selectedPositionId}
              onShowAlert={onShowAlert}
              selectedPlayers={selectedPlayers}
            />
          </View>
        ) : selectedCountry === "Germany" ? (
          <View style={styles.germanyContainer}>
            <MyLineupTeamGermany
              onPlayerSelect={onPlayerSelect}
              selectedPositionId={selectedPositionId}
              onShowAlert={onShowAlert}
              selectedPlayers={selectedPlayers}
            />
          </View>
        ) : selectedCountry === "Italy" ? (
          <View style={styles.italyContainer}>
            <MyLineupTeamItaly
              onPlayerSelect={onPlayerSelect}
              selectedPositionId={selectedPositionId}
              onShowAlert={onShowAlert}
              selectedPlayers={selectedPlayers}
            />
          </View>
        ) : selectedCountry === "Japan" ? (
          <View style={styles.japanContainer}>
            <MyLineupTeamJapan
              onPlayerSelect={onPlayerSelect}
              selectedPositionId={selectedPositionId}
              onShowAlert={onShowAlert}
              selectedPlayers={selectedPlayers}
            />
          </View>
        ) : selectedCountry === "S.Korea" ? (
          <View style={styles.sKoreaContainer}>
            <MyLineupTeamSKorea
              onPlayerSelect={onPlayerSelect}
              selectedPositionId={selectedPositionId}
              onShowAlert={onShowAlert}
              selectedPlayers={selectedPlayers}
            />
          </View>
        ) : selectedCountry === "Mexico" ? (
          <View style={styles.mexicoContainer}>
            <MyLineupTeamMexico
              onPlayerSelect={onPlayerSelect}
              selectedPositionId={selectedPositionId}
              onShowAlert={onShowAlert}
              selectedPlayers={selectedPlayers}
            />
          </View>
        ) : selectedCountry === "Morocco" ? (
          <View style={styles.moroccoContainer}>
            <MyLineupTeamMorocco
              onPlayerSelect={onPlayerSelect}
              selectedPositionId={selectedPositionId}
              onShowAlert={onShowAlert}
              selectedPlayers={selectedPlayers}
            />
          </View>
        ) : selectedCountry === "Netherlands" ? (
          <View style={styles.netherlandsContainer}>
            <MyLineupTeamNetherlands
              onPlayerSelect={onPlayerSelect}
              selectedPositionId={selectedPositionId}
              onShowAlert={onShowAlert}
              selectedPlayers={selectedPlayers}
            />
          </View>
        ) : selectedCountry === "Portugal" ? (
          <View style={styles.portugalContainer}>
            <MyLineupTeamPortugal
              onPlayerSelect={onPlayerSelect}
              selectedPositionId={selectedPositionId}
              onShowAlert={onShowAlert}
              selectedPlayers={selectedPlayers}
            />
          </View>
        ) : selectedCountry === "Senegal" ? (
          <View style={styles.senegalContainer}>
            <MyLineupTeamSenegal
              onPlayerSelect={onPlayerSelect}
              selectedPositionId={selectedPositionId}
              onShowAlert={onShowAlert}
              selectedPlayers={selectedPlayers}
            />
          </View>
        ) : selectedCountry === "Spain" ? (
          <View style={styles.spainContainer}>
            <MyLineupTeamSpain
              onPlayerSelect={onPlayerSelect}
              selectedPositionId={selectedPositionId}
              onShowAlert={onShowAlert}
              selectedPlayers={selectedPlayers}
            />
          </View>
        ) : selectedCountry === "Switzerland" ? (
          <View style={styles.switzerlandContainer}>
            <MyLineupTeamSwitzerland
              onPlayerSelect={onPlayerSelect}
              selectedPositionId={selectedPositionId}
              onShowAlert={onShowAlert}
              selectedPlayers={selectedPlayers}
            />
          </View>
        ) : loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF4444" />
            <Text style={[styles.loadingText, { color: theme.colors.text }]}>
              Loading players...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: theme.colors.text }]}>
              {error}
            </Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() =>
                selectedCountry && fetchCountryPlayers(selectedCountry)
              }
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.topSpacing} />
            {renderCountryPlayerRow(playerRow1, 0)}
            <View style={styles.rowSpacing} />
            {renderCountryPlayerRow(playerRow2, 1)}
            <View style={styles.topSpacing} />
          </>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    position: "relative",
  },
  countriesContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingVertical: 8,
  },
  playersContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingVertical: 8,
  },
  topSpacing: {
    height: 12,
  },
  rowSpacing: {
    height: 16,
  },
  countryRow: {
    marginBottom: 8,
  },
  countryRowContent: {
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  countryContainer: {
    alignItems: "center",
    marginRight: 12,
    width: 72,
    flex: 0,
    flexShrink: 0,
  },
  countryCircle: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    borderWidth: 1,
    marginBottom: 6,
  },
  countryName: {
    fontSize: 12,
    textAlign: "center",
    maxWidth: 72,
    fontWeight: "500",
  },
  countryImage: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
  },
  placeholderText: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
  },

  // Players header styles
  playersHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 0,
    marginBottom: 4,
    marginTop: -8,
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  countryHeaderInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  countryHeaderFlag: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  countryHeaderName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  headerSpacer: {
    width: 40,
  },
  ugandaContainer: {
    flex: 1,
  },
  argentinaContainer: {
    flex: 1,
  },
  brazilContainer: {
    flex: 1,
  },
  franceContainer: {
    flex: 1,
  },
  belgiumContainer: {
    flex: 1,
  },
  croatiaContainer: {
    flex: 1,
  },
  colombiaContainer: {
    flex: 1,
  },
  denmarkContainer: {
    flex: 1,
  },
  egyptContainer: {
    flex: 1,
  },
  englandContainer: {
    flex: 1,
  },
  germanyContainer: {
    flex: 1,
  },
  italyContainer: {
    flex: 1,
  },
  japanContainer: {
    flex: 1,
  },
  sKoreaContainer: {
    flex: 1,
  },
  mexicoContainer: {
    flex: 1,
  },
  moroccoContainer: {
    flex: 1,
  },
  netherlandsContainer: {
    flex: 1,
  },
  portugalContainer: {
    flex: 1,
  },
  senegalContainer: {
    flex: 1,
  },
  spainContainer: {
    flex: 1,
  },
  switzerlandContainer: {
    flex: 1,
  },

  // Player styles (similar to other league screens)
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

  // Player photo styles
  playerPhoto: {
    width: 43,
    height: 43,
    borderRadius: 21.5,
  },
  playerPhotoPlaceholder: {
    width: 43,
    height: 43,
    borderRadius: 21.5,
    backgroundColor: "#4A8B3B",
    alignItems: "center",
    justifyContent: "center",
  },
  playerInitials: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },

  // Loading and error states
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: "500",
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 14,
    textAlign: "center",
    fontWeight: "500",
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: "#FF4444",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 16,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
});
