import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  ScrollView,
} from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { ChevronDown, Trophy, Check } from "lucide-react-native";
import { teamColorService } from "@/services/teamColorService";

const { width } = Dimensions.get("window");

interface NewsMatchesLeagueRoundSelectorProps {
  rounds: string[]; // ✅ API-driven rounds array
  selectedRound: string;
  onRoundChange: (round: string) => void;
  showModal: boolean;
  setShowModal: (show: boolean) => void;
  leagueName?: string;
  primaryColor?: string;
  sport?: string; // ✅ CRITICAL: Add sport parameter for future sport-specific logic
}

// Smart function to generate round display names
const getRoundDisplayName = (round: string, leagueName?: string): string => {
  if (round.toLowerCase().includes("final")) {
    return round;
  }

  if (round.toLowerCase().includes("semi")) {
    return round;
  }

  if (round.toLowerCase().includes("quarter")) {
    return round;
  }

  if (round.toLowerCase().includes("round")) {
    return round;
  }

  // Default format
  return `Round ${round.replace(/\D/g, "") || round}`;
};

// Smart function to get round status
const getRoundStatus = (
  round: string,
  selectedRound: string,
  totalRounds: number,
): "completed" | "current" | "upcoming" => {
  const roundNum = parseInt(round.replace(/\D/g, "")) || 0;
  const currentRoundNum = parseInt(selectedRound.replace(/\D/g, "")) || 0;

  if (roundNum < currentRoundNum) return "completed";
  if (roundNum === currentRoundNum) return "current";
  return "upcoming";
};

// Helper function to convert hex color to rgba with opacity
const hexToRgba = (hex: string, opacity: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

export default function NewsMatchesLeagueRoundSelector({
  rounds,
  selectedRound,
  onRoundChange,
  showModal,
  setShowModal,
  leagueName = "League",
  primaryColor = "#FF6B35",
  sport = "football", // ✅ CRITICAL: Sport parameter for future sport-specific logic
}: NewsMatchesLeagueRoundSelectorProps) {
  const theme = useTheme();

  // Check if we're in dark mode
  const isDarkMode =
    theme.colors.background === "#2A2A2A" || theme.colors.text === "#FFFFFF";

  console.log(`🏆 [RoundSelector] Sport: ${sport}, League: ${leagueName}, Rounds: ${rounds.length}`);

  // Helper function to get readable text color for team primary color
  // If team color is bright (like yellow), use white/light text for better contrast
  // Otherwise, use the team color itself
  const getReadableTextColor = (teamColor: string): string => {
    const isBright = teamColorService.isLightColor(teamColor);
    if (isBright) {
      // For bright colors (yellow, light blue, etc.), use white/light text
      return isDarkMode ? "#FFFFFF" : theme.colors.text;
    }
    // For dark colors, use the team color itself
    return teamColor;
  };

  const handleRoundSelect = (round: string) => {
    onRoundChange(round);
    setShowModal(false);
  };

  const getStatusColor = (status: "completed" | "current" | "upcoming") => {
    switch (status) {
      case "completed":
        return "#4CAF50";
      case "current":
        return primaryColor;
      case "upcoming":
        return theme.colors.textSecondary;
      default:
        return theme.colors.textSecondary;
    }
  };

  const getStatusIcon = (status: "completed" | "current" | "upcoming") => {
    switch (status) {
      case "completed":
        return <Check size={14} color="#4CAF50" />;
      case "current":
        return <Trophy size={14} color={primaryColor} />;
      case "upcoming":
        return (
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: theme.colors.textSecondary,
            }}
          />
        );
      default:
        return null;
    }
  };

  const renderRound = (round: string, index: number) => {
    const displayName = getRoundDisplayName(round, leagueName);
    const isSelected = selectedRound === round;

    return (
      <TouchableOpacity
        key={`${round}-${index}`}
        style={[
          styles.roundOption,
          isSelected && {
            backgroundColor: hexToRgba(primaryColor, isDarkMode ? 0.15 : 0.08),
            borderLeftWidth: 3,
            borderLeftColor: primaryColor,
          },
        ]}
        onPress={() => handleRoundSelect(round)}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.roundOptionText,
            {
              color: isSelected ? getReadableTextColor(primaryColor) : theme.colors.text,
              fontWeight: isSelected ? "700" : "400",
            },
          ]}
        >
          {displayName}
        </Text>
        {isSelected && (
          <Check size={20} color={primaryColor} style={styles.checkIcon} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <>
      {/* Round Selection Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowModal(false)}
          />

          <View
            style={[
              styles.roundModal,
              {
                backgroundColor: theme.colors.background,
                borderTopColor: isDarkMode ? "#444" : "#E0E0E0",
              },
            ]}
          >
            <View
              style={{
                width: 40,
                height: 4,
                backgroundColor: "rgba(0,0,0,0.3)",
                borderRadius: 2,
                alignSelf: "center",
                marginTop: 8,
                marginBottom: 16,
              }}
            />

            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                Select League Round
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowModal(false)}
              >
                <Text
                  style={[
                    styles.closeButtonText,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  ×
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.roundsContainer}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={styles.roundsContentContainer}
            >
              {rounds.map((round, index) => renderRound(round, index))}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  { backgroundColor: theme.colors.backgroundSecondary },
                ]}
                onPress={() => setShowModal(false)}
              >
                <Text
                  style={[
                    styles.actionButtonText,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, { backgroundColor: primaryColor }]}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "transparent",
  },
  roundModal: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 34,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(128,128,128,0.2)",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    fontFamily: "Inter-SemiBold",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(128,128,128,0.1)",
  },
  closeButtonText: {
    fontSize: 20,
    fontFamily: "Inter-Regular",
  },
  roundsContainer: {
    maxHeight: 400,
    paddingVertical: 0,
  },
  roundsContentContainer: {
    paddingBottom: 8,
  },
  roundOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(128,128,128,0.1)",
    position: "relative",
  },
  roundOptionText: {
    fontSize: 18,
    fontFamily: "Inter-Regular",
    textAlign: "center",
  },
  checkIcon: {
    position: "absolute",
    right: 20,
  },
  modalFooter: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(128,128,128,0.2)",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
    backgroundColor: "rgba(128,128,128,0.1)",
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontFamily: "Inter-Medium",
    color: "#666",
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
    borderRadius: 8,
  },
  confirmButtonText: {
    fontSize: 16,
    fontFamily: "Inter-Medium",
    color: "white",
  },
});
