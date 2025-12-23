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
import { ChevronDown, Calendar, Check } from "lucide-react-native";

const { width, height } = Dimensions.get("window");

interface NewsSeasonsSelector {
  selectedSeason: string;
  onSeasonChange: (season: string) => void;
  showModal: boolean;
  setShowModal: (show: boolean) => void;
  seasons?: string[]; // ✅ API-driven seasons (optional, falls back to defaults)
  primaryColor?: string;
  sport?: string; // ✅ CRITICAL: Add sport parameter for future sport-specific logic
}

// Global seasons data for different leagues
// ✅ IMPORTANT: These are FALLBACK defaults - seasons should come from API when available
// Both basketball and football use the same season format (e.g., "24-25" for 2024-2025)
const DEFAULT_SEASONS = [
  "25-26",
  "24-25",
  "23-24",
  "22-23",
  "21-22",
  "20-21",
  "19-20",
];

// Smart function to generate league-specific seasons
// ✅ Uses API-provided seasons if available, otherwise falls back to defaults
const generateSeasons = (currentSeason?: string, apiSeasons?: string[]): string[] => {
  // If API provides seasons, use those (most accurate)
  if (apiSeasons && apiSeasons.length > 0) {
    // Ensure current season is included
    if (currentSeason && !apiSeasons.includes(currentSeason)) {
      return [currentSeason, ...apiSeasons];
    }
    return apiSeasons;
  }
  
  // Otherwise, use defaults with current season if not already included
  if (currentSeason && !DEFAULT_SEASONS.includes(currentSeason)) {
    return [currentSeason, ...DEFAULT_SEASONS];
  }
  return DEFAULT_SEASONS;
};

// Helper function to convert hex color to rgba with opacity
const hexToRgba = (hex: string, opacity: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

export default function NewsSeasonsSelector({
  selectedSeason,
  onSeasonChange,
  showModal,
  setShowModal,
  seasons = DEFAULT_SEASONS, // API-driven seasons (parent should pass API data)
  primaryColor = "#FF6B35",
  sport = "football", // ✅ CRITICAL: Sport parameter for future sport-specific logic
}: NewsSeasonsSelector) {
  const theme = useTheme();

  // Check if we're in dark mode
  const isDarkMode = theme.colors.background === "#2A2A2A";

  // ✅ Use API-provided seasons if available, otherwise use defaults
  const availableSeasons = generateSeasons(selectedSeason, seasons);

  console.log(`📅 [SeasonSelector] Sport: ${sport}, Available seasons:`, availableSeasons);

  const handleSeasonSelect = (season: string) => {
    onSeasonChange(season);
    setShowModal(false);
  };

  const renderSeason = (season: string) => {
    const isSelected = selectedSeason === season;
    return (
      <TouchableOpacity
        key={season}
        style={[
          styles.seasonOption,
          isSelected && {
            backgroundColor: hexToRgba(primaryColor, 0.1),
          },
        ]}
        onPress={() => handleSeasonSelect(season)}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.seasonOptionText,
            {
              color: isSelected ? primaryColor : theme.colors.text,
              fontWeight: isSelected ? "600" : "400",
            },
          ]}
        >
          {season}
        </Text>
        {isSelected && (
          <Check size={18} color={primaryColor} style={styles.checkIcon} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <>
      {/* Season Selector Button */}
      <TouchableOpacity
        style={[
          styles.seasonSelector,
          {
            backgroundColor: theme.colors.backgroundSecondary,
            borderColor: primaryColor,
          },
        ]}
        onPress={() => setShowModal(true)}
        activeOpacity={0.7}
      >
        <Calendar size={12} color={primaryColor} />
        <Text style={[styles.seasonText, { color: primaryColor }]}>
          {selectedSeason}
        </Text>
        <ChevronDown size={12} color={primaryColor} />
      </TouchableOpacity>

      {/* Season Selection Modal */}
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
              styles.seasonModal,
              {
                backgroundColor: theme.colors.background,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                Select Season
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
              style={styles.seasonsContainer}
              contentContainerStyle={styles.seasonsContent}
              showsVerticalScrollIndicator={true}
              bounces={true}
            >
              {availableSeasons.map(renderSeason)}
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
                style={[
                  styles.confirmButton,
                  { backgroundColor: primaryColor },
                ]}
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
  seasonSelector: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
    minWidth: 65,
  },
  seasonText: {
    fontSize: 12,
    fontWeight: "500",
    fontFamily: "Inter-Medium",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)", // Semi-transparent backdrop
  },
  seasonModal: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 34,
    maxHeight: height * 0.55, // Limit to 55% of screen height - stops halfway, positioned under tabs
    width: "100%",
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
  seasonsContainer: {
    maxHeight: height * 0.35, // Limit scrollable area to 35% of screen - ensures smooth scrolling
  },
  seasonsContent: {
    paddingVertical: 0,
  },
  seasonOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(128,128,128,0.1)",
    gap: 8,
  },
  checkIcon: {
    marginLeft: 4,
  },
  seasonOptionText: {
    fontSize: 18,
    fontFamily: "Inter-Regular",
    textAlign: "center",
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
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontFamily: "Inter-Medium",
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
