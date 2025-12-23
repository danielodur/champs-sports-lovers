import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Dimensions,
  Animated,
} from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { ChevronDown, ChevronUp, X } from "lucide-react-native";
import NewsMatchesLeagueRoundSelector from "@/modules/news/components/shared/news-matches-league-round-selector";

const { width, height } = Dimensions.get("window");

interface Season {
  id: string;
  name: string;
  shortName: string;
  isActive?: boolean;
}

interface Team {
  id: string;
  name: string;
  league: string;
  season: string;
}

interface Round {
  id: string;
  name: string;
  shortName: string;
}

interface SeasonsTeamReplaysSelectorProps {
  visible: boolean;
  onClose: () => void;
  selectedLeague: string;
  selectedSeason: string;
  selectedTeam: string;
  selectedRound: string;
  onSeasonSelect: (season: string) => void;
  onTeamSelect: (team: string) => void;
  onRoundSelect: (round: string) => void;
}

const SEASONS: Season[] = [
  {
    id: "all-seasons",
    name: "All Seasons",
    shortName: "All",
    isActive: true,
  },
  {
    id: "25-26",
    name: "2025-26 Season",
    shortName: "25-26",
  },
  {
    id: "24-25",
    name: "2024-25 Season",
    shortName: "24-25",
  },
];

const TEAMS_BY_LEAGUE: { [key: string]: Team[] } = {
  "uganda-premier-league": [
    // Season 25-26 teams
    {
      id: "vipers-sc",
      name: "Vipers SC",
      league: "uganda-premier-league",
      season: "25-26",
    },
    {
      id: "kcca-fc",
      name: "KCCA FC",
      league: "uganda-premier-league",
      season: "25-26",
    },
    {
      id: "express-fc",
      name: "Express FC",
      league: "uganda-premier-league",
      season: "25-26",
    },
    {
      id: "sc-villa",
      name: "SC Villa",
      league: "uganda-premier-league",
      season: "25-26",
    },
    {
      id: "bul-fc",
      name: "BUL FC",
      league: "uganda-premier-league",
      season: "25-26",
    },
    {
      id: "ura-fc",
      name: "URA FC",
      league: "uganda-premier-league",
      season: "25-26",
    },
    {
      id: "kitara-fc",
      name: "Kitara FC",
      league: "uganda-premier-league",
      season: "25-26",
    },
    {
      id: "police-fc",
      name: "Police FC",
      league: "uganda-premier-league",
      season: "25-26",
    },
    {
      id: "wakiso-giants",
      name: "Wakiso Giants",
      league: "uganda-premier-league",
      season: "25-26",
    },
    {
      id: "maroons-fc",
      name: "Maroons FC",
      league: "uganda-premier-league",
      season: "25-26",
    },
    {
      id: "arua-hill",
      name: "Arua Hill SC",
      league: "uganda-premier-league",
      season: "25-26",
    },
    {
      id: "bright-stars",
      name: "Bright Stars FC",
      league: "uganda-premier-league",
      season: "25-26",
    },
    // Season 24-25 teams
    {
      id: "vipers-sc-24",
      name: "Vipers SC",
      league: "uganda-premier-league",
      season: "24-25",
    },
    {
      id: "kcca-fc-24",
      name: "KCCA FC",
      league: "uganda-premier-league",
      season: "24-25",
    },
    {
      id: "express-fc-24",
      name: "Express FC",
      league: "uganda-premier-league",
      season: "24-25",
    },
    {
      id: "sc-villa-24",
      name: "SC Villa",
      league: "uganda-premier-league",
      season: "24-25",
    },
    {
      id: "bul-fc-24",
      name: "BUL FC",
      league: "uganda-premier-league",
      season: "24-25",
    },
    {
      id: "ura-fc-24",
      name: "URA FC",
      league: "uganda-premier-league",
      season: "24-25",
    },
  ],
  "premier-league": [
    // Season 25-26 teams
    {
      id: "man-city",
      name: "Manchester City",
      league: "premier-league",
      season: "25-26",
    },
    {
      id: "arsenal",
      name: "Arsenal",
      league: "premier-league",
      season: "25-26",
    },
    {
      id: "liverpool",
      name: "Liverpool",
      league: "premier-league",
      season: "25-26",
    },
    {
      id: "chelsea",
      name: "Chelsea",
      league: "premier-league",
      season: "25-26",
    },
    // Season 24-25 teams
    {
      id: "man-city-24",
      name: "Manchester City",
      league: "premier-league",
      season: "24-25",
    },
    {
      id: "arsenal-24",
      name: "Arsenal",
      league: "premier-league",
      season: "24-25",
    },
    {
      id: "liverpool-24",
      name: "Liverpool",
      league: "premier-league",
      season: "24-25",
    },
    {
      id: "chelsea-24",
      name: "Chelsea",
      league: "premier-league",
      season: "24-25",
    },
  ],
  "la-liga": [
    // Season 25-26 teams
    {
      id: "real-madrid",
      name: "Real Madrid",
      league: "la-liga",
      season: "25-26",
    },
    { id: "barcelona", name: "Barcelona", league: "la-liga", season: "25-26" },
    {
      id: "atletico",
      name: "Atletico Madrid",
      league: "la-liga",
      season: "25-26",
    },
    { id: "sevilla", name: "Sevilla", league: "la-liga", season: "25-26" },
    // Season 24-25 teams
    {
      id: "real-madrid-24",
      name: "Real Madrid",
      league: "la-liga",
      season: "24-25",
    },
    {
      id: "barcelona-24",
      name: "Barcelona",
      league: "la-liga",
      season: "24-25",
    },
    {
      id: "atletico-24",
      name: "Atletico Madrid",
      league: "la-liga",
      season: "24-25",
    },
    { id: "sevilla-24", name: "Sevilla", league: "la-liga", season: "24-25" },
  ],
};

const ROUNDS: Round[] = [
  { id: "all-rounds", name: "All Rounds", shortName: "All" },
  { id: "round-1", name: "Round 1", shortName: "R1" },
  { id: "round-2", name: "Round 2", shortName: "R2" },
  { id: "round-3", name: "Round 3", shortName: "R3" },
  { id: "round-4", name: "Round 4", shortName: "R4" },
  { id: "round-5", name: "Round 5", shortName: "R5" },
  { id: "round-6", name: "Round 6", shortName: "R6" },
  { id: "round-7", name: "Round 7", shortName: "R7" },
  { id: "round-8", name: "Round 8", shortName: "R8" },
];

export default function SeasonsTeamReplaysSelector({
  visible,
  onClose,
  selectedLeague,
  selectedSeason,
  selectedTeam,
  selectedRound,
  onSeasonSelect,
  onTeamSelect,
  onRoundSelect,
}: SeasonsTeamReplaysSelectorProps) {
  const theme = useTheme();
  const [slideAnim] = useState(new Animated.Value(height));
  const [activeSection, setActiveSection] = useState<
    "seasons" | "teams" | "rounds"
  >("seasons");
  const [showRoundModal, setShowRoundModal] = useState(false);

  const isDarkMode =
    theme.colors.background === "#2A2A2A" || theme.colors.text === "#FFFFFF";

  // Get teams for current league and season
  const availableTeams = TEAMS_BY_LEAGUE[selectedLeague] || [];
  const filteredTeams = availableTeams.filter((team) => {
    if (selectedSeason === "all-seasons") {
      return true;
    }
    return team.season === selectedSeason;
  });

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: height,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  const handleSeasonSelect = (seasonId: string) => {
    onSeasonSelect(seasonId);
    if (seasonId !== "all-seasons") {
      setActiveSection("teams");
    }
  };

  const handleTeamSelect = (teamId: string) => {
    onTeamSelect(teamId);
    if (teamId !== "all-teams") {
      setActiveSection("rounds");
    }
  };

  const handleRoundSelect = (roundId: string) => {
    onRoundSelect(roundId);
    handleClose();
  };

  const getSelectedSeasonName = () => {
    const season = SEASONS.find((s) => s.id === selectedSeason);
    return season ? season.shortName : "All";
  };

  const getSelectedTeamName = () => {
    if (selectedTeam === "all-teams") return "All";
    const team = availableTeams.find((t) => t.id === selectedTeam);
    return team ? team.name : "All";
  };

  const getSelectedRoundName = () => {
    const round = ROUNDS.find((r) => r.id === selectedRound);
    return round ? round.shortName : "All";
  };

  const renderLeftPanel = () => (
    <View style={styles.leftPanel}>
      {/* League Header */}
      <View style={styles.leagueHeader}>
        <Text
          style={[
            styles.leagueHeaderText,
            { color: isDarkMode ? "#FF6B6B" : "#FF4444" },
          ]}
        >
          {selectedLeague === "uganda-premier-league"
            ? "Uganda PL"
            : selectedLeague === "premier-league"
              ? "English PL"
              : selectedLeague === "la-liga"
                ? "Spanish Liga"
                : "League"}
        </Text>
        <View
          style={[
            styles.leagueUnderline,
            { backgroundColor: isDarkMode ? "#FF6B6B" : "#FF4444" },
          ]}
        />
      </View>

      {/* All Button */}
      <TouchableOpacity
        style={styles.leftPanelItem}
        onPress={() => {
          handleSeasonSelect("all-seasons");
          onTeamSelect("all-teams");
          onRoundSelect("all-rounds");
          handleClose();
        }}
      >
        <Text
          style={[
            styles.leftPanelText,
            {
              color:
                activeSection === "seasons" && selectedSeason === "all-seasons"
                  ? isDarkMode
                    ? "#FF6B6B"
                    : "#FF4444"
                  : theme.colors.text,
            },
          ]}
        >
          All
        </Text>
      </TouchableOpacity>

      {/* Seasons */}
      {SEASONS.filter((s) => s.id !== "all-seasons").map((season) => (
        <TouchableOpacity
          key={season.id}
          style={styles.leftPanelItem}
          onPress={() => handleSeasonSelect(season.id)}
        >
          <Text
            style={[
              styles.leftPanelText,
              {
                color:
                  selectedSeason === season.id
                    ? isDarkMode
                      ? "#FF6B6B"
                      : "#FF4444"
                    : theme.colors.text,
              },
            ]}
          >
            {season.shortName}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderRightPanel = () => {
    if (activeSection === "seasons" || selectedSeason === "all-seasons") {
      return (
        <View style={styles.rightPanel}>
          <View
            style={[
              styles.rightPanelHeader,
              { borderBottomColor: isDarkMode ? "#333" : "#E0E0E0" },
            ]}
          >
            <Text
              style={[
                styles.rightPanelHeaderText,
                { color: theme.colors.text },
              ]}
            >
              All Seasons
            </Text>
          </View>
          <Text
            style={[styles.emptyText, { color: theme.colors.textSecondary }]}
          >
            Select a specific season to view teams
          </Text>
        </View>
      );
    }

    if (activeSection === "teams") {
      return (
        <View style={styles.rightPanel}>
          <View
            style={[
              styles.rightPanelHeader,
              { borderBottomColor: isDarkMode ? "#333" : "#E0E0E0" },
            ]}
          >
            <Text
              style={[
                styles.rightPanelHeaderText,
                { color: theme.colors.text },
              ]}
            >
              Teams
            </Text>
          </View>

          <ScrollView
            style={styles.rightPanelScroll}
            showsVerticalScrollIndicator={false}
          >
            {/* All Teams Option - Only show when "All Seasons" is selected */}
            {selectedSeason === "all-seasons" && (
              <TouchableOpacity
                style={styles.rightPanelItem}
                onPress={() => {
                  handleTeamSelect("all-teams");
                  onRoundSelect("all-rounds");
                  handleClose();
                }}
              >
                <Text
                  style={[
                    styles.rightPanelText,
                    {
                      color:
                        selectedTeam === "all-teams"
                          ? isDarkMode
                            ? "#FF6B6B"
                            : "#FF4444"
                          : theme.colors.text,
                    },
                  ]}
                >
                  All
                </Text>
              </TouchableOpacity>
            )}

            {/* Individual Teams */}
            {filteredTeams.map((team) => (
              <TouchableOpacity
                key={team.id}
                style={styles.rightPanelItem}
                onPress={() => handleTeamSelect(team.id)}
              >
                <Text
                  style={[
                    styles.rightPanelText,
                    {
                      color:
                        selectedTeam === team.id
                          ? isDarkMode
                            ? "#FF6B6B"
                            : "#FF4444"
                          : theme.colors.text,
                    },
                  ]}
                >
                  {team.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      );
    }

    if (activeSection === "rounds") {
      return (
        <View style={styles.rightPanel}>
          <View
            style={[
              styles.rightPanelHeader,
              { borderBottomColor: isDarkMode ? "#333" : "#E0E0E0" },
            ]}
          >
            <Text
              style={[
                styles.rightPanelHeaderText,
                { color: theme.colors.text },
              ]}
            >
              League Round 1
            </Text>
            <ChevronDown size={16} color={theme.colors.textSecondary} />
          </View>

          <ScrollView
            style={styles.rightPanelScroll}
            showsVerticalScrollIndicator={false}
          >
            {ROUNDS.map((round) => (
              <TouchableOpacity
                key={round.id}
                style={styles.rightPanelItem}
                onPress={() => handleRoundSelect(round.id)}
              >
                <Text
                  style={[
                    styles.rightPanelText,
                    {
                      color:
                        selectedRound === round.id
                          ? isDarkMode
                            ? "#FF6B6B"
                            : "#FF4444"
                          : theme.colors.text,
                    },
                  ]}
                >
                  {round.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      );
    }

    return null;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleClose}
        />

        <Animated.View
          style={[
            styles.modalContainer,
            {
              backgroundColor: theme.colors.background,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Top Header */}
          <View
            style={[
              styles.topHeader,
              { borderBottomColor: isDarkMode ? "#333" : "#E0E0E0" },
            ]}
          >
            <View style={styles.filterItem}>
              <Text style={[styles.filterLabel, { color: theme.colors.text }]}>
                {getSelectedSeasonName()}
              </Text>
              <Text
                style={[
                  styles.filterSubLabel,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {selectedLeague === "uganda-premier-league"
                  ? "Uganda PL"
                  : selectedLeague === "premier-league"
                    ? "English PL"
                    : selectedLeague === "la-liga"
                      ? "Spanish Liga"
                      : "League"}
              </Text>
              <ChevronUp size={16} color={isDarkMode ? "#FF6B6B" : "#FF4444"} />
            </View>

            <TouchableOpacity
              style={styles.filterItem}
              onPress={() => setShowRoundModal(true)}
            >
              <Text style={[styles.filterLabel, { color: theme.colors.text }]}>
                Round
              </Text>
              <ChevronDown size={16} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Main Content */}
          <View style={styles.mainContent}>
            {renderLeftPanel()}
            {renderRightPanel()}
          </View>
        </Animated.View>

        {/* Round Selector Modal */}
        <NewsMatchesLeagueRoundSelector
          rounds={ROUNDS.map((round) => round.name)}
          selectedRound={getSelectedRoundName()}
          onRoundChange={(roundName) => {
            const round = ROUNDS.find((r) => r.name === roundName);
            if (round) {
              onRoundSelect(round.id);
              handleClose();
            }
          }}
          showModal={showRoundModal}
          setShowModal={setShowRoundModal}
          leagueName={
            selectedLeague === "uganda-premier-league"
              ? "Uganda PL"
              : selectedLeague === "premier-league"
                ? "English PL"
                : selectedLeague === "la-liga"
                  ? "Spanish Liga"
                  : "League"
          }
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  backdrop: {
    flex: 1,
  },
  modalContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.7,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  topHeader: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    justifyContent: "space-between",
  },
  filterItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginRight: 8,
  },
  filterSubLabel: {
    fontSize: 14,
    marginRight: 8,
  },
  mainContent: {
    flex: 1,
    flexDirection: "row",
  },
  leftPanel: {
    width: width * 0.3,
    borderRightWidth: 1,
    borderRightColor: "#333",
  },
  leagueHeader: {
    padding: 12,
    alignItems: "center",
    position: "relative",
  },
  leagueHeaderText: {
    fontSize: 14,
    fontWeight: "700",
  },
  leagueUnderline: {
    position: "absolute",
    bottom: 0,
    left: "50%",
    marginLeft: -15,
    width: 30,
    height: 3,
    borderRadius: 1.5,
  },
  leftPanelItem: {
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  leftPanelText: {
    fontSize: 14,
    fontWeight: "500",
  },
  rightPanel: {
    flex: 1,
  },
  rightPanelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  rightPanelHeaderText: {
    fontSize: 16,
    fontWeight: "600",
  },
  rightPanelScroll: {
    flex: 1,
    paddingHorizontal: 20,
  },
  rightPanelItem: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginVertical: 2,
  },
  rightPanelText: {
    fontSize: 15,
    fontWeight: "500",
  },
  emptyText: {
    textAlign: "center",
    marginTop: 40,
    fontSize: 14,
    fontStyle: "italic",
  },
});
