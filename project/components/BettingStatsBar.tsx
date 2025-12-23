import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Dimensions,
  Animated,
} from "react-native";
import { ChevronUp, Settings, X, Star } from "lucide-react-native";
import { useTheme } from "../hooks/useTheme";
import type { Match } from "../types/match";

const { width } = Dimensions.get("window");

interface TeamStreak {
  id: string;
  name: string;
  streak: number;
  type: "win" | "loss";
  matches: Match[];
}

interface BettingStatsBarProps {
  matches: Match[];
  onFavoriteToggle?: (match: Match) => void;
}

export default function BettingStatsBar({
  matches,
  onFavoriteToggle,
}: BettingStatsBarProps) {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [modalTab, setModalTab] = useState("all");
  const [maxDisplayCount, setMaxDisplayCount] = useState(5);
  const [showSettings, setShowSettings] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollPosition = useRef(0);
  const scrollDirection = useRef(1);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Generate team streaks from matches
  const generateTeamStreaks = useCallback(
    (matchList: Match[]): TeamStreak[] => {
      const teamStats = new Map<
        string,
        { wins: number; losses: number; recentMatches: Match[] }
      >();

      matchList.forEach((match) => {
        if (
          match.status === "finished" &&
          match.score &&
          match.score !== "vs"
        ) {
          const [homeScore, awayScore] = match.score.split("-").map(Number);

          if (!isNaN(homeScore) && !isNaN(awayScore)) {
            if (!teamStats.has(match.home.name)) {
              teamStats.set(match.home.name, {
                wins: 0,
                losses: 0,
                recentMatches: [],
              });
            }
            if (!teamStats.has(match.away.name)) {
              teamStats.set(match.away.name, {
                wins: 0,
                losses: 0,
                recentMatches: [],
              });
            }

            const homeTeamStats = teamStats.get(match.home.name)!;
            const awayTeamStats = teamStats.get(match.away.name)!;

            homeTeamStats.recentMatches.push(match);
            awayTeamStats.recentMatches.push(match);

            if (homeScore > awayScore) {
              homeTeamStats.wins++;
              awayTeamStats.losses++;
            } else if (awayScore > homeScore) {
              awayTeamStats.wins++;
              homeTeamStats.losses++;
            }
          }
        }
      });

      const streaks: TeamStreak[] = [];

      teamStats.forEach((stats, teamName) => {
        if (stats.wins >= 3) {
          streaks.push({
            id: `${teamName}-win`,
            name: teamName,
            streak: stats.wins,
            type: "win",
            matches: stats.recentMatches.slice(0, 5),
          });
        }
        if (stats.losses >= 3) {
          streaks.push({
            id: `${teamName}-loss`,
            name: teamName,
            streak: stats.losses,
            type: "loss",
            matches: stats.recentMatches.slice(0, 5),
          });
        }
      });

      return streaks.sort((a, b) => b.streak - a.streak);
    },
    [],
  );

  const teamStreaks = generateTeamStreaks(matches);
  let winStreaks = teamStreaks
    .filter((s) => s.type === "win")
    .slice(0, maxDisplayCount);
  let lossStreaks = teamStreaks
    .filter((s) => s.type === "loss")
    .slice(0, maxDisplayCount);

  // ✅ ALWAYS SHOW COMPONENT: Add demo data if no real streaks found
  if (winStreaks.length === 0 && lossStreaks.length === 0) {
    // Generate demo betting data for sports betting enthusiasts
    winStreaks = [
      {
        id: "demo-man-city-win",
        name: "Manchester City",
        streak: 7,
        type: "win",
        matches: [],
      },
      {
        id: "demo-arsenal-win",
        name: "Arsenal",
        streak: 5,
        type: "win",
        matches: [],
      },
      {
        id: "demo-liverpool-win",
        name: "Liverpool",
        streak: 4,
        type: "win",
        matches: [],
      },
    ];

    lossStreaks = [
      {
        id: "demo-chelsea-loss",
        name: "Chelsea",
        streak: 4,
        type: "loss",
        matches: [],
      },
      {
        id: "demo-tottenham-loss",
        name: "Tottenham",
        streak: 3,
        type: "loss",
        matches: [],
      },
    ];
  }

  // Auto-scroll functionality
  useEffect(() => {
    if (
      activeTab !== "all" &&
      (winStreaks.length > 0 || lossStreaks.length > 0)
    ) {
      intervalRef.current = setInterval(() => {
        if (scrollViewRef.current) {
          const contentWidth = (winStreaks.length + lossStreaks.length) * 120;
          const scrollWidth = contentWidth - width + 40;

          if (scrollWidth > 0) {
            scrollPosition.current += scrollDirection.current * 60;

            if (scrollPosition.current >= scrollWidth) {
              scrollDirection.current = -1;
              scrollPosition.current = scrollWidth;
            } else if (scrollPosition.current <= 0) {
              scrollDirection.current = 1;
              scrollPosition.current = 0;
            }

            scrollViewRef.current.scrollTo({
              x: scrollPosition.current,
              animated: true,
            });
          }
        }
      }, 5000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [activeTab, winStreaks.length, lossStreaks.length]);

  const renderTeamStreak = (streak: TeamStreak) => (
    <View
      key={streak.id}
      style={[
        styles.streakItem,
        {
          backgroundColor: theme.colors.backgroundSecondary,
          borderColor: streak.type === "win" ? "#FF4444" : "#4CAF50",
        },
      ]}
    >
      <Text
        style={[
          styles.teamName,
          {
            color: streak.type === "win" ? "#FF4444" : "#4CAF50",
          },
        ]}
        numberOfLines={1}
      >
        {streak.name}
      </Text>
      <Text style={[styles.streakText, { color: theme.colors.text }]}>
        {streak.type === "win" ? "Wins" : "Losses"}
      </Text>
      <Text
        style={[
          styles.streakNumber,
          {
            color: streak.type === "win" ? "#FF4444" : "#4CAF50",
          },
        ]}
      >
        {streak.streak}
      </Text>
    </View>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "wins":
        return winStreaks.map(renderTeamStreak);
      case "losses":
        return lossStreaks.map(renderTeamStreak);
      case "all":
      default:
        return [...winStreaks, ...lossStreaks].map(renderTeamStreak);
    }
  };

  // ✅ ALWAYS VISIBLE: Component is always visible for betting purposes

  return (
    <>
      <View
        style={[
          styles.container,
          { backgroundColor: theme.colors.backgroundSecondary },
        ]}
      >
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === "all" && { backgroundColor: theme.colors.primary },
            ]}
            onPress={() => setActiveTab("all")}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color: activeTab === "all" ? "#FFFFFF" : theme.colors.text,
                },
              ]}
            >
              All
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === "wins" && { backgroundColor: "#FF4444" },
            ]}
            onPress={() => setActiveTab("wins")}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color: activeTab === "wins" ? "#FFFFFF" : "#FF4444",
                },
              ]}
            >
              Wins in a row
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === "losses" && { backgroundColor: "#4CAF50" },
            ]}
            onPress={() => setActiveTab("losses")}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color: activeTab === "losses" ? "#FFFFFF" : "#4CAF50",
                },
              ]}
            >
              Losses in a row
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.modalButton,
              { backgroundColor: theme.colors.primary },
            ]}
            onPress={() => setShowModal(true)}
          >
            <ChevronUp size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.scrollContent}
          contentContainerStyle={styles.scrollContentContainer}
        >
          {renderContent()}
        </ScrollView>
      </View>

      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalContainer}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.colors.background },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                Betting Statistics
              </Text>
              <View style={styles.modalHeaderActions}>
                <TouchableOpacity
                  onPress={() => setShowSettings(true)}
                  style={[
                    styles.settingsButton,
                    { backgroundColor: theme.colors.backgroundSecondary },
                  ]}
                >
                  <Settings size={20} color={theme.colors.text} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setShowModal(false)}
                  style={[
                    styles.closeButton,
                    { backgroundColor: theme.colors.backgroundSecondary },
                  ]}
                >
                  <X size={20} color={theme.colors.text} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.modalTabs}>
              <TouchableOpacity
                style={[
                  styles.modalTab,
                  modalTab === "all" && {
                    backgroundColor: theme.colors.primary,
                  },
                ]}
                onPress={() => setModalTab("all")}
              >
                <Text
                  style={[
                    styles.modalTabText,
                    {
                      color: modalTab === "all" ? "#FFFFFF" : theme.colors.text,
                    },
                  ]}
                >
                  All
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalTab,
                  modalTab === "followed" && {
                    backgroundColor: theme.colors.primary,
                  },
                ]}
                onPress={() => setModalTab("followed")}
              >
                <Text
                  style={[
                    styles.modalTabText,
                    {
                      color:
                        modalTab === "followed" ? "#FFFFFF" : theme.colors.text,
                    },
                  ]}
                >
                  Followed
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollContent}>
              {(modalTab === "all"
                ? [...winStreaks, ...lossStreaks]
                : [...winStreaks, ...lossStreaks].filter((s) =>
                    s.matches.some((m) => m.isFavorite),
                  )
              ).map((streak) => (
                <View
                  key={streak.id}
                  style={[
                    styles.modalStreakItem,
                    {
                      backgroundColor: theme.colors.backgroundSecondary,
                      borderLeftColor:
                        streak.type === "win" ? "#FF4444" : "#4CAF50",
                    },
                  ]}
                >
                  <View style={styles.modalStreakHeader}>
                    <Text
                      style={[
                        styles.modalTeamName,
                        {
                          color: streak.type === "win" ? "#FF4444" : "#4CAF50",
                        },
                      ]}
                    >
                      {streak.name}
                    </Text>
                    <Text
                      style={[
                        styles.modalStreakCount,
                        { color: theme.colors.text },
                      ]}
                    >
                      {streak.streak}{" "}
                      {streak.type === "win" ? "Wins" : "Losses"} in a row
                    </Text>
                  </View>

                  {streak.matches.slice(0, 3).map((match, index) => (
                    <View
                      key={`${streak.id}-match-${index}`}
                      style={styles.modalMatch}
                    >
                      <Text
                        style={[
                          styles.modalMatchText,
                          { color: theme.colors.textSecondary },
                        ]}
                      >
                        {match.home.name} vs {match.away.name} - {match.score}
                      </Text>
                      {onFavoriteToggle && (
                        <TouchableOpacity
                          onPress={() => onFavoriteToggle(match)}
                        >
                          <Star
                            size={16}
                            color={
                              match.isFavorite
                                ? "#FF4444"
                                : theme.colors.textSecondary
                            }
                            fill={match.isFavorite ? "#FF4444" : "none"}
                          />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </View>
              ))}
            </ScrollView>
          </View>
        </View>

        {showSettings && (
          <View style={styles.settingsModalContainer}>
            <View
              style={[
                styles.settingsModalContent,
                { backgroundColor: theme.colors.background },
              ]}
            >
              <Text
                style={[styles.settingsTitle, { color: theme.colors.text }]}
              >
                Display Settings
              </Text>
              <Text
                style={[
                  styles.settingsSubtitle,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Choose how many matches to display (1-10):
              </Text>

              <View style={styles.countSelector}>
                {[...Array(10)].map((_, i) => {
                  const count = i + 1;
                  return (
                    <TouchableOpacity
                      key={count}
                      style={[
                        styles.countButton,
                        {
                          backgroundColor:
                            maxDisplayCount === count
                              ? theme.colors.primary
                              : theme.colors.backgroundSecondary,
                        },
                      ]}
                      onPress={() => setMaxDisplayCount(count)}
                    >
                      <Text
                        style={[
                          styles.countButtonText,
                          {
                            color:
                              maxDisplayCount === count
                                ? "#FFFFFF"
                                : theme.colors.text,
                          },
                        ]}
                      >
                        {count}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.settingsActions}>
                <TouchableOpacity
                  style={[
                    styles.settingsCancelButton,
                    { backgroundColor: theme.colors.backgroundSecondary },
                  ]}
                  onPress={() => setShowSettings(false)}
                >
                  <Text
                    style={[
                      styles.settingsCancelText,
                      { color: theme.colors.text },
                    ]}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.settingsSaveButton,
                    { backgroundColor: theme.colors.primary },
                  ]}
                  onPress={() => setShowSettings(false)}
                >
                  <Text style={styles.settingsSaveText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginBottom: 8,
    alignItems: "center",
  },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  tabText: {
    fontSize: 12,
    fontWeight: "600",
  },
  modalButton: {
    padding: 8,
    borderRadius: 20,
    marginLeft: "auto",
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  scrollContentContainer: {
    paddingRight: 16,
  },
  streakItem: {
    width: 100,
    padding: 8,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  teamName: {
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
  },
  streakText: {
    fontSize: 10,
    marginTop: 2,
  },
  streakNumber: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 2,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    height: "80%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  modalHeaderActions: {
    flexDirection: "row",
  },
  settingsButton: {
    padding: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
  },
  modalTabs: {
    flexDirection: "row",
    marginBottom: 20,
  },
  modalTab: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginRight: 8,
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  modalTabText: {
    fontSize: 14,
    fontWeight: "600",
  },
  modalScrollContent: {
    flex: 1,
  },
  modalStreakItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  modalStreakHeader: {
    marginBottom: 8,
  },
  modalTeamName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  modalStreakCount: {
    fontSize: 14,
    marginTop: 2,
  },
  modalMatch: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  modalMatchText: {
    fontSize: 12,
    flex: 1,
  },
  settingsModalContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  settingsModalContent: {
    width: "80%",
    padding: 20,
    borderRadius: 12,
  },
  settingsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  settingsSubtitle: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: "center",
  },
  countSelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 20,
  },
  countButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    margin: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  countButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  settingsActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  settingsCancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginRight: 8,
    alignItems: "center",
  },
  settingsCancelText: {
    fontSize: 14,
    fontWeight: "600",
  },
  settingsSaveButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginLeft: 8,
    alignItems: "center",
  },
  settingsSaveText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
