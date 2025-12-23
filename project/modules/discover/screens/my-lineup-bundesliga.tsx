import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  Image,
  TouchableOpacity,
  Animated,
} from "react-native";
import { useTheme } from "@/hooks/useTheme";
import {
  getBundesligaTeamImage,
  hasRealBundesligaTeamImage,
} from "../../../assets/images/bundesliga/index";
import { ArrowLeft } from "lucide-react-native";
import { bundesligaTeams } from "./bundesliga-teams/bundesliga-config";
import MyLineupBundesligaTemplate from "./bundesliga-teams/my-lineup-bundesliga-template";

const { width: screenWidth } = Dimensions.get("window");

interface BundesligaProps {
  onTeamSelect?: (teamId: string) => void;
  onPlayerSelect?: (player: any) => void;
  selectedPositionId?: string | null;
  onShowAlert?: () => void;
  selectedPlayers?: any[];
}

export default function MyLineupBundesliga({
  onTeamSelect,
  onPlayerSelect,
  selectedPositionId,
  onShowAlert,
  selectedPlayers = [],
}: BundesligaProps) {
  const theme = useTheme();
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [slideAnimation] = useState(new Animated.Value(0));

  // Verify all team logos are available
  React.useEffect(() => {
    bundesligaTeams.forEach((team) => {
      const logo = getBundesligaTeamImage(team.logoKey);
      if (!logo) {
        console.warn(`Missing logo for ${team.name}`);
      }
    });
  }, []);

  // Function to get team image with fallback to placeholder
  const getTeamImageData = (teamName: string) => {
    const realImage = getBundesligaTeamImage(teamName);

    if (realImage) {
      return {
        type: "image",
        source: realImage,
      };
    }

    return {
      type: "placeholder",
      initials: getTeamInitials(teamName),
      color: getTeamColor(teamName),
    };
  };

  // Function to get team initials
  const getTeamInitials = (teamName: string) => {
    const words = teamName.split(" ");
    if (words.length >= 2) {
      return `${words[0][0]}${words[1][0]}`.toUpperCase();
    } else if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }
    return "FC";
  };

  // Function to get team color based on name
  const getTeamColor = (teamName: string) => {
    const colors = [
      "#DC052D", // Bayern red
      "#FDE100", // Dortmund yellow
      "#DD0741", // Leipzig red
      "#E32221", // Leverkusen red
      "#00B04F", // Gladbach green
      "#65B32E", // Wolfsburg green
      "#00A652", // Bremen green
      "#E30613", // Freiburg red
      "#EB1923", // Union Berlin red
      "#1861AC", // Hoffenheim blue
      "#BA2234", // Augsburg red
      "#C4122E", // Mainz red
      "#005CA9", // Hertha blue
      "#E32221", // Stuttgart red
      "#DC052D", // Köln red
      "#005CA9", // Bochum blue
      "#DC052D", // Frankfurt red
      "#DC052D", // Heidenheim red
    ];

    // Simple hash function to get consistent color for each team
    let hash = 0;
    for (let i = 0; i < teamName.length; i++) {
      hash = teamName.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  // Handle team selection
  const handleTeamPress = (teamId: string) => {
    setSelectedTeam(teamId);

    // Start slide animation
    Animated.timing(slideAnimation, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    if (onTeamSelect) {
      onTeamSelect(teamId);
    }
  };

  // Handle back to teams
  const handleBackToTeams = () => {
    Animated.timing(slideAnimation, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setSelectedTeam(null);
    });
  };

  const renderTeamRow = (
    rowTeams: typeof bundesligaTeams,
    rowIndex: number,
  ) => (
    <ScrollView
      key={`row_${rowIndex}`}
      horizontal
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      style={styles.teamRow}
      contentContainerStyle={styles.teamRowContent}
      decelerationRate="fast"
      scrollEventThrottle={16}
      bounces={true}
      alwaysBounceHorizontal={false}
      directionalLockEnabled={true}
    >
      {rowTeams.map((team) => (
        <TouchableOpacity
          key={team.id}
          style={styles.teamItemContainer}
          onPress={() => handleTeamPress(team.id)}
          activeOpacity={0.7}
        >
          <View style={styles.teamLogoContainer}>
            <View
              style={[
                styles.teamCircle,
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
                const imageData = getTeamImageData(team.logoKey);

                if (imageData.type === "image") {
                  return (
                    <Image source={imageData.source} style={styles.teamImage} />
                  );
                } else {
                  return (
                    <View
                      style={[
                        styles.teamImage,
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
          </View>
          <Text style={[styles.teamName, { color: theme.colors.text }]}>
            {team.displayName}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  // Split teams into 2 rows of 9 each (18 teams total)
  const row1 = bundesligaTeams.slice(0, 9);
  const row2 = bundesligaTeams.slice(9, 18);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.teamsContainer,
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
        {renderTeamRow(row1, 0)}
        <View style={styles.rowSpacing} />
        {renderTeamRow(row2, 1)}
      </Animated.View>

      <Animated.View
        style={[
          styles.selectedTeamContainer,
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
        {selectedTeam && (
          <View style={styles.teamScreenContainer}>
            <View style={styles.teamHeader}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={handleBackToTeams}
                activeOpacity={0.7}
              >
                <ArrowLeft size={24} color={theme.colors.text} />
              </TouchableOpacity>
              <View style={styles.teamTitleContainer}>
                {(() => {
                  const teamConfig = bundesligaTeams.find(
                    (t) => t.id === selectedTeam,
                  );
                  if (!teamConfig) return null;

                  const teamLogo = getBundesligaTeamImage(teamConfig.logoKey);

                  if (teamLogo) {
                    return (
                      <Image
                        source={teamLogo}
                        style={styles.teamHeaderLogo}
                        resizeMode="contain"
                      />
                    );
                  } else {
                    return (
                      <View style={styles.logoFallback}>
                        <Text style={styles.logoFallbackText}>
                          {teamConfig.name.charAt(0)}
                        </Text>
                      </View>
                    );
                  }
                })()}
                <Text
                  style={[styles.teamHeaderTitle, { color: theme.colors.text }]}
                >
                  {bundesligaTeams.find((t) => t.id === selectedTeam)
                    ?.fullName || "Team FC"}
                </Text>
              </View>
              <View style={styles.headerSpacer} />
            </View>

            {(() => {
              const teamConfig = bundesligaTeams.find(
                (t) => t.id === selectedTeam,
              );
              if (!teamConfig) {
                return (
                  <View style={styles.comingSoonContainer}>
                    <Text
                      style={[
                        styles.comingSoonText,
                        { color: theme.colors.text },
                      ]}
                    >
                      Team not found!
                    </Text>
                  </View>
                );
              }

              return (
                <View style={styles.teamContainer}>
                  <MyLineupBundesligaTemplate
                    teamConfig={teamConfig}
                    onPlayerSelect={onPlayerSelect}
                    selectedPositionId={selectedPositionId}
                    onShowAlert={onShowAlert}
                    selectedPlayers={selectedPlayers}
                  />
                </View>
              );
            })()}
          </View>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 8,
  },
  teamsContainer: {
    width: screenWidth,
  },
  selectedTeamContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: screenWidth,
  },
  teamScreenContainer: {
    flex: 1,
  },
  teamHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(128, 128, 128, 0.1)",
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  teamTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  teamHeaderLogo: {
    width: 28,
    height: 28,
    marginRight: 10,
  },
  logoFallback: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#DC052D",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  logoFallbackText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  teamHeaderTitle: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  headerSpacer: {
    width: 40,
  },
  topSpacing: {
    height: 12,
  },
  rowSpacing: {
    height: 16,
  },
  teamRow: {
    marginBottom: 8,
  },
  teamRowContent: {
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  teamItemContainer: {
    alignItems: "center",
    marginRight: 12,
    width: 72,
    flex: 0,
    flexShrink: 0,
  },
  teamLogoContainer: {
    marginBottom: 6,
  },
  teamCircle: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  teamImage: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    resizeMode: "contain",
  },
  placeholderText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  teamName: {
    fontSize: 12,
    textAlign: "center",
    maxWidth: 72,
    fontWeight: "500",
  },
  teamContainer: {
    flex: 1,
  },
  comingSoonContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  comingSoonText: {
    fontSize: 16,
    fontStyle: "italic",
  },
});
