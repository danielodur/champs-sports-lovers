import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Image } from "react-native";

interface TeamHonor {
  competition: string;
  competitionLogo: string;
  timesWon: number;
  seasons: string[];
}

interface NewsTeamDetailsHonorsProps {
  honors: TeamHonor[];
  theme: any;
}

export default function NewsTeamDetailsHonors({
  honors,
  theme,
}: NewsTeamDetailsHonorsProps) {
  const [expandedHonor, setExpandedHonor] = useState<number | null>(null);
  const [showAllModal, setShowAllModal] = useState(false);

  // Check if we're in dark mode
  const isDarkMode = theme.colors.background === "#2A2A2A" || theme.colors.text === "#FFFFFF";
  const greyBackground = isDarkMode ? "#3A3A3A" : "#F5F5F5";
  const borderColor = isDarkMode ? "#4A4A4A" : "#E0E0E0";

  // Don't show if no honors
  if (!honors || honors.length === 0) {
    return null;
  }

  // Show maximum 3 honors initially, with ability to expand
  const displayedHonors = showAllModal ? honors : honors.slice(0, 3);
  const hasMoreHonors = honors.length > 3;

  // Trophy/Medal emoji mapping
  const getTrophyEmoji = (competition: string) => {
    const compLower = competition.toLowerCase();
    
    if (compLower.includes('champions league') || compLower.includes('european cup')) {
      return "🏆"; // Champions League
    }
    if (compLower.includes('europa league') || compLower.includes('uefa cup')) {
      return "🥈"; // Europa League
    }
    if (compLower.includes('super cup')) {
      return "🏅"; // Super Cup
    }
    if (compLower.includes('world cup')) {
      return "🏆"; // World Cup
    }
    return "🏆"; // Default trophy
  };

  return (
    <View style={[styles.honorsSection, { backgroundColor: greyBackground }]}>
      <View style={styles.honorsSectionHeader}>
        <Text style={[styles.honorsTitle, { color: theme.colors.text }]}>
          Honors
        </Text>
      </View>

      {displayedHonors.map((honor, index) => {
        const isExpanded = expandedHonor === index;
        const displaySeasons = isExpanded ? honor.seasons : honor.seasons.slice(0, 6);
        const hasMoreSeasons = honor.seasons.length > 6;

        return (
          <View
            key={index}
            style={[
              styles.honorRow,
              {
                borderBottomColor: borderColor,
                borderBottomWidth: index < displayedHonors.length - 1 ? 1 : 0,
              },
            ]}
          >
            {/* Trophy Icon and Competition Name */}
            <View style={styles.honorHeader}>
              <Text style={styles.trophyIcon}>{getTrophyEmoji(honor.competition)}</Text>
              <View style={styles.honorInfo}>
                <Text style={[styles.competitionName, { color: theme.colors.text }]}>
                  {honor.competition} ({honor.timesWon} {honor.timesWon === 1 ? 'time' : 'times'})
                </Text>
              </View>
              {hasMoreSeasons && (
                <TouchableOpacity onPress={() => setExpandedHonor(isExpanded ? null : index)}>
                  <Text style={styles.expandButton}>
                    {isExpanded ? "Less" : "More"} &gt;
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Season Badges */}
            <View style={styles.seasonsGrid}>
              {displaySeasons.map((season, seasonIndex) => (
                <View
                  key={seasonIndex}
                  style={[styles.seasonBadge, { backgroundColor: "#FF9800" }]}
                >
                  <Text style={styles.seasonText}>{season}</Text>
                </View>
              ))}
            </View>
          </View>
        );
      })}

      {/* Show All Button - Only if more than 3 honors */}
      {hasMoreHonors && !showAllModal && (
        <TouchableOpacity
          style={styles.showAllButton}
          onPress={() => setShowAllModal(true)}
        >
          <Text style={styles.showAllText}>Show All Honors</Text>
        </TouchableOpacity>
      )}

      {/* All Honors Modal */}
      <Modal
        visible={showAllModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAllModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: borderColor }]}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                All Honors
              </Text>
              <TouchableOpacity
                onPress={() => setShowAllModal(false)}
                style={styles.modalCloseButton}
              >
                <Text style={[styles.modalCloseText, { color: "#FF6B35" }]}>
                  Close
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              {honors.map((honor, index) => (
                <View
                  key={index}
                  style={[
                    styles.modalHonorRow,
                    {
                      backgroundColor: greyBackground,
                      borderBottomColor: borderColor,
                      borderBottomWidth: index < honors.length - 1 ? 1 : 0,
                    },
                  ]}
                >
                  <View style={styles.modalHonorHeader}>
                    <Text style={styles.modalTrophyIcon}>{getTrophyEmoji(honor.competition)}</Text>
                    <View style={styles.modalHonorInfo}>
                      <Text style={[styles.modalCompetitionName, { color: theme.colors.text }]}>
                        {honor.competition}
                      </Text>
                      <Text style={[styles.modalTimesWon, { color: theme.colors.textSecondary }]}>
                        Won {honor.timesWon} {honor.timesWon === 1 ? 'time' : 'times'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.modalSeasonsGrid}>
                    {honor.seasons.map((season, seasonIndex) => (
                      <View
                        key={seasonIndex}
                        style={[styles.modalSeasonBadge, { backgroundColor: "#FF9800" }]}
                      >
                        <Text style={styles.modalSeasonText}>{season}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  honorsSection: {
    marginTop: 0,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  honorsSectionHeader: {
    marginBottom: 16,
  },
  honorsTitle: {
    fontSize: 17,
    fontWeight: "bold",
  },
  honorRow: {
    paddingVertical: 16,
  },
  honorHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 12,
  },
  trophyIcon: {
    fontSize: 32,
  },
  honorInfo: {
    flex: 1,
  },
  competitionName: {
    fontSize: 15,
    fontWeight: "600",
  },
  expandButton: {
    fontSize: 14,
    color: "#FF6B35",
    fontWeight: "500",
  },
  seasonsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  seasonBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  seasonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  showAllButton: {
    marginTop: 16,
    padding: 12,
    alignItems: "center",
    borderRadius: 8,
    backgroundColor: "rgba(255, 107, 53, 0.1)",
  },
  showAllText: {
    color: "#FF6B35",
    fontSize: 14,
    fontWeight: "600",
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  modalCloseButton: {
    padding: 8,
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: "600",
  },
  modalScroll: {
    padding: 16,
  },
  modalHonorRow: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  modalHonorHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  modalTrophyIcon: {
    fontSize: 40,
  },
  modalHonorInfo: {
    flex: 1,
  },
  modalCompetitionName: {
    fontSize: 17,
    fontWeight: "bold",
    marginBottom: 4,
  },
  modalTimesWon: {
    fontSize: 14,
    fontWeight: "400",
  },
  modalSeasonsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  modalSeasonBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  modalSeasonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
});

