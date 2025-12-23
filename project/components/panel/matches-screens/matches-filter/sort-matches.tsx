import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import {
  Clock,
  Trophy,
  X,
  BarChart3,
  CornerDownRight,
  Activity,
  TrendingUp,
} from "lucide-react-native";
import { useTheme } from "@/hooks/useTheme";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

// Custom Modal Score Icon Component
const ModalScoreIcon = ({ color }: { color: string }) => (
  <View style={[styles.scoreIcon, { borderColor: color }]}>
    <Text style={[styles.scoreText, { color }]}>2-1</Text>
  </View>
);

interface SortMatchesModalProps {
  visible: boolean;
  currentSport: string;
  currentMatchMode: string;
  currentSortMode: string;
  onConfirm: (matchMode: string, sortMode: string) => void;
  onCancel: () => void;
}

export default function SortMatchesModal({
  visible,
  currentSport,
  currentMatchMode,
  currentSortMode,
  onConfirm,
  onCancel,
}: SortMatchesModalProps) {
  const theme = useTheme();
  const [selectedMatchMode, setSelectedMatchMode] = useState(currentMatchMode);
  const [selectedSortMode, setSelectedSortMode] = useState(currentSortMode);

  // Update state when props change
  useEffect(() => {
    if (visible) {
      setSelectedMatchMode(currentMatchMode);
      setSelectedSortMode(currentSortMode);
    }
  }, [visible, currentMatchMode, currentSortMode]);

  // Sport-specific match modes
  const getMatchModes = (sport: string) => {
    switch (sport) {
      case "football":
        return [
          { id: "score", label: "Score", icon: ModalScoreIcon },
          { id: "score-index", label: "Score & Odds", icon: BarChart3 },
          {
            id: "corner-index",
            label: "Corners & Odds",
            icon: CornerDownRight,
          },
        ];
      case "basketball":
        return [
          { id: "score", label: "Score", icon: ModalScoreIcon },
          { id: "score-index", label: "Score & Odds", icon: BarChart3 },
          { id: "points-rebounds", label: "Points & Rebounds", icon: Activity },
        ];
      default:
        return [
          { id: "score", label: "Score", icon: ModalScoreIcon },
          { id: "score-index", label: "Score & Odds", icon: BarChart3 },
          { id: "general-stats", label: "General Stats", icon: TrendingUp },
        ];
    }
  };

  // Sport-specific sorting modes
  const getSortModes = (sport: string) => {
    switch (sport) {
      case "football":
        return [
          { id: "time", label: "By Time", icon: Clock },
          { id: "league", label: "By League", icon: Trophy },
        ];
      case "basketball":
        return [
          { id: "time", label: "By Time", icon: Clock },
          { id: "conference", label: "By Conference", icon: Trophy },
        ];
      default:
        return [
          { id: "time", label: "By Time", icon: Clock },
          { id: "league", label: "By League", icon: Trophy },
        ];
    }
  };

  const matchModes = getMatchModes(currentSport);
  const sortModes = getSortModes(currentSport);

  // Get sport-specific modal title
  const getModalTitle = (sport: string) => {
    switch (sport) {
      case "football":
        return "Football Match Settings";
      case "basketball":
        return "Basketball Game Settings";
      default:
        return "Match Display Settings";
    }
  };

  const handleConfirm = () => {
    onConfirm(selectedMatchMode, selectedSortMode);
  };

  const handleCancel = () => {
    onCancel();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: theme.colors.background },
          ]}
        >
          {/* Header */}
          <View
            style={[
              styles.modalHeader,
              { borderBottomColor: theme.colors.border },
            ]}
          >
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              {getModalTitle(currentSport)}
            </Text>
            <TouchableOpacity style={styles.closeButton} onPress={handleCancel}>
              <X size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.modalContent}>
            {/* Match Mode Section */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Match Mode
              </Text>
              <View style={styles.optionsGrid}>
                {matchModes.map((mode) => {
                  const IconComponent = mode.icon;
                  const isSelected = selectedMatchMode === mode.id;
                  return (
                    <TouchableOpacity
                      key={mode.id}
                      style={[
                        styles.optionCard,
                        {
                          backgroundColor: isSelected
                            ? theme.colors.primary
                            : theme.colors.backgroundSecondary,
                          borderColor: isSelected
                            ? theme.colors.primary
                            : theme.colors.border,
                        },
                      ]}
                      onPress={() => setSelectedMatchMode(mode.id)}
                    >
                      {IconComponent === ModalScoreIcon ? (
                        <IconComponent
                          color={
                            isSelected ? "#FFFFFF" : theme.colors.textSecondary
                          }
                        />
                      ) : (
                        <IconComponent
                          size={24}
                          color={
                            isSelected ? "#FFFFFF" : theme.colors.textSecondary
                          }
                        />
                      )}
                      <Text
                        style={[
                          styles.optionText,
                          {
                            color: isSelected ? "#FFFFFF" : theme.colors.text,
                          },
                        ]}
                      >
                        {mode.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Match Sorting Section */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Match Sorting
              </Text>
              <View style={styles.sortingOptions}>
                {sortModes.map((mode) => {
                  const IconComponent = mode.icon;
                  const isSelected = selectedSortMode === mode.id;
                  return (
                    <TouchableOpacity
                      key={mode.id}
                      style={[
                        styles.sortingCard,
                        {
                          backgroundColor: isSelected
                            ? theme.colors.primary
                            : theme.colors.backgroundSecondary,
                          borderColor: isSelected
                            ? theme.colors.primary
                            : theme.colors.border,
                        },
                      ]}
                      onPress={() => setSelectedSortMode(mode.id)}
                    >
                      <IconComponent
                        size={20}
                        color={
                          isSelected ? "#FFFFFF" : theme.colors.textSecondary
                        }
                      />
                      <Text
                        style={[
                          styles.sortingText,
                          {
                            color: isSelected ? "#FFFFFF" : theme.colors.text,
                          },
                        ]}
                      >
                        {mode.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          {/* Footer Buttons */}
          <View
            style={[
              styles.modalFooter,
              { borderTopColor: theme.colors.border },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.footerButton,
                styles.cancelButton,
                { borderColor: theme.colors.border },
              ]}
              onPress={handleCancel}
            >
              <Text
                style={[
                  styles.cancelButtonText,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.footerButton,
                styles.confirmButton,
                { backgroundColor: theme.colors.primary },
              ]}
              onPress={handleConfirm}
            >
              <Text style={styles.confirmButtonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: Math.min(screenWidth * 0.9, 400),
    maxHeight: screenHeight * 0.8,
    borderRadius: 16,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "Inter-SemiBold",
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Inter-SemiBold",
    marginBottom: 16,
  },
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  optionCard: {
    flex: 1,
    minWidth: "30%",
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 2,
    padding: 12,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  optionText: {
    fontSize: 12,
    fontFamily: "Inter-Medium",
    textAlign: "center",
  },
  sortingOptions: {
    flexDirection: "row",
    gap: 12,
  },
  sortingCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 2,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sortingText: {
    fontSize: 14,
    fontFamily: "Inter-Medium",
  },
  modalFooter: {
    flexDirection: "row",
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
  },
  footerButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: {
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: "Inter-Medium",
  },
  confirmButton: {},
  confirmButtonText: {
    fontSize: 16,
    fontFamily: "Inter-SemiBold",
    color: "#FFFFFF",
  },
  scoreIcon: {
    borderWidth: 1.5,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  scoreText: {
    fontSize: 14,
    fontFamily: "Inter-Bold",
  },
});

