/**
 * Team Managers Records Component
 * Displays current and former managers with their statistics
 * Fetches data from API-Football coaches endpoint
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { teamDetailsApi } from "@/services/teamDetailsApiService";
import { teamColorService } from "@/services/teamColorService";

interface ManagerRecord {
  name: string;
  photo: string;
  startDate: string;
  endDate: string;
  matchesManaged: number;
  wins: number;
  draws: number;
  losses: number;
  winPercentage: number;
}

interface TeamManagersRecordsProps {
  teamId: number;
  theme: any;
  teamColors?: {
    primary: string;
    secondary: string;
  };
}

export default function TeamManagersRecords({
  teamId,
  theme,
  teamColors = { primary: "#FF1744", secondary: "#FF6B35" },
}: TeamManagersRecordsProps) {
  const [managers, setManagers] = useState<ManagerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllManagers, setShowAllManagers] = useState(false);

  const isDarkMode = theme.colors.background === "#2A2A2A";

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
  const greyBackground = isDarkMode ? "#3A3A3A" : "#F5F5F5";
  const borderColor = isDarkMode ? "#4A4A4A" : "#E0E0E0";

  // Format date for display
  const formatDate = (dateStr: string): string => {
    if (!dateStr || dateStr === "Present" || dateStr.trim() === "") return "Now";
    
    try {
      // Handle formats: "2019-12-20" or "2019/12/20" or "2019-12-20T00:00:00+00:00"
      let dateStrClean = dateStr.split("T")[0]; // Remove time if present
      dateStrClean = dateStrClean.replace(/\//g, "-");
      const date = new Date(dateStrClean);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.warn(`⚠️ [TeamManagersRecords] Invalid date: ${dateStr}`);
        return dateStr; // Return original if invalid
      }
      
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}/${month}/${day}`;
    } catch (error) {
      console.warn(`⚠️ [TeamManagersRecords] Error formatting date ${dateStr}:`, error);
      return dateStr;
    }
  };

  // Calculate duration between two dates
  const calculateDuration = (startDate: string, endDate: string): string => {
    if (!startDate || startDate.trim() === "") return "";
    
    const isPresent = endDate === "Present" || !endDate || endDate.trim() === "";
    
    try {
      // Parse start date
      let startStr = startDate.split("T")[0].replace(/\//g, "-");
      const start = new Date(startStr);
      
      if (isNaN(start.getTime())) {
        console.warn(`⚠️ [TeamManagersRecords] Invalid start date: ${startDate}`);
        return "";
      }
      
      // Parse end date (or use now if present)
      const end = isPresent ? new Date() : new Date(endDate.split("T")[0].replace(/\//g, "-"));
      
      if (!isPresent && isNaN(end.getTime())) {
        console.warn(`⚠️ [TeamManagersRecords] Invalid end date: ${endDate}`);
        return "";
      }
      
      // Calculate difference
      let years = end.getFullYear() - start.getFullYear();
      let months = end.getMonth() - start.getMonth();
      let days = end.getDate() - start.getDate();
      
      // Adjust for negative days
      if (days < 0) {
        months--;
        const lastDayOfPrevMonth = new Date(end.getFullYear(), end.getMonth(), 0).getDate();
        days += lastDayOfPrevMonth;
      }
      
      // Adjust for negative months
      if (months < 0) {
        years--;
        months += 12;
      }
      
      // Build duration string
      const parts: string[] = [];
      if (years > 0) {
        parts.push(`${years} Year${years > 1 ? "s" : ""}`);
      }
      if (months > 0) {
        parts.push(`${months} Month${months > 1 ? "s" : ""}`);
      }
      if (days > 0 && years === 0) {
        parts.push(`${days} Day${days > 1 ? "s" : ""}`);
      }
      
      return parts.join(" ");
    } catch (error) {
      console.warn(`⚠️ [TeamManagersRecords] Error calculating duration:`, error);
      return "";
    }
  };

  // Fetch managers
  const fetchManagers = useCallback(async () => {
    if (!teamId) {
      console.warn("⚠️ [TeamManagersRecords] Missing teamId");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      console.log(`🔍 [TeamManagersRecords] Fetching managers for team ${teamId}`);

      const managersData = await teamDetailsApi.getFormerManagers(teamId);

      if (managersData && managersData.length > 0) {
        // Ensure managers are sorted: current manager first, then by start date descending (most recent first)
        const sortedManagers = [...managersData].sort((a, b) => {
          // Current manager (Present) always first
          if (a.endDate === "Present" && b.endDate !== "Present") return -1;
          if (a.endDate !== "Present" && b.endDate === "Present") return 1;
          
          // Both are past or both are present - sort by start date descending (most recent first)
          // Parse dates for proper comparison
          try {
            const dateA = new Date(a.startDate.split("T")[0].replace(/\//g, "-"));
            const dateB = new Date(b.startDate.split("T")[0].replace(/\//g, "-"));
            return dateB.getTime() - dateA.getTime(); // Descending order
          } catch {
            return b.startDate.localeCompare(a.startDate);
          }
        });
        
        console.log(`✅ [TeamManagersRecords] Loaded ${sortedManagers.length} managers:`, 
          sortedManagers.map(m => ({ name: m.name, start: m.startDate, end: m.endDate }))
        );
        setManagers(sortedManagers);
      } else {
        console.log(`ℹ️ [TeamManagersRecords] No managers found for team ${teamId}`);
        setManagers([]);
      }
    } catch (error: any) {
      console.error(`❌ [TeamManagersRecords] Error fetching managers:`, error?.message || error);
      setManagers([]);
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    fetchManagers();
  }, [fetchManagers]);

  if (loading) {
    return null; // Don't show loading state, just return null
  }

  if (managers.length === 0) {
    return null; // Don't show section if no data
  }

  const displayedManagers = managers.slice(0, 3);
  const hasMoreManagers = managers.length > 3;

  return (
    <>
      {/* Separator before section */}
      <View style={[styles.separator, { backgroundColor: borderColor }]} />
      
      <View style={[styles.container, { backgroundColor: greyBackground }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Managers Records</Text>
        {hasMoreManagers && (
          <TouchableOpacity onPress={() => setShowAllManagers(true)}>
            <Text style={[styles.viewAllButton, { color: getReadableTextColor(teamColors.primary) }]}>
              View All &gt;
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {displayedManagers.map((manager, index) => {
        const isCurrent = manager.endDate === "Present";
        const duration = calculateDuration(manager.startDate, manager.endDate);

        return (
          <View
            key={index}
            style={[
              styles.managerRow,
              {
                borderBottomColor: borderColor,
                borderBottomWidth: index < displayedManagers.length - 1 ? 1 : 0,
              },
            ]}
          >
            {/* Period indicator */}
            <View style={styles.periodContainer}>
              <View style={[styles.periodDot, { backgroundColor: teamColors.primary }]} />
              <Text style={[styles.periodText, { color: theme.colors.textSecondary }]}>
                {formatDate(manager.startDate)}~{formatDate(manager.endDate)}
                {duration && duration.trim() !== "" && ` (${duration})`}
              </Text>
            </View>

            {/* Manager info */}
            <View style={styles.managerInfo}>
              {manager.photo && manager.photo.trim() !== "" ? (
                <Image
                  source={{ uri: manager.photo }}
                  style={styles.managerPhoto}
                  resizeMode="cover"
                  onError={() => {
                    console.log(`Failed to load manager photo: ${manager.photo}`);
                  }}
                />
              ) : (
                <View style={[styles.managerPhoto, styles.managerPhotoPlaceholder]}>
                  <Text style={styles.managerInitials}>
                    {manager.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .substring(0, 2)
                      .toUpperCase()}
                  </Text>
                </View>
              )}
              <Text style={[styles.managerName, { color: theme.colors.text }]}>
                {manager.name}
              </Text>
            </View>

            {/* Stats */}
            <View style={styles.statsContainer}>
              <Text style={[styles.matchesText, { color: theme.colors.text }]}>
                {manager.matchesManaged} Matches
              </Text>
              <Text style={[styles.winRateText, { color: "#4CAF50" }]}>
                Win Rate {manager.winPercentage.toFixed(2)}%
              </Text>
              <Text style={[styles.recordText, { color: theme.colors.textSecondary }]}>
                (W{manager.wins}/D{manager.draws}/L{manager.losses})
              </Text>
            </View>
          </View>
        );
      })}

      {/* Modal - View All Managers */}
      <Modal
        visible={showAllManagers}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAllManagers(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: borderColor }]}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                All Managers
              </Text>
              <TouchableOpacity
                onPress={() => setShowAllManagers(false)}
                style={styles.modalCloseButton}
              >
                <Text style={[styles.modalCloseText, { color: getReadableTextColor(teamColors.primary) }]}>
                  Close
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              {managers.map((manager, index) => {
                const duration = calculateDuration(manager.startDate, manager.endDate);

                return (
                  <View
                    key={index}
                    style={[
                      styles.modalManagerRow,
                      {
                        backgroundColor: greyBackground,
                        borderBottomColor: borderColor,
                        borderBottomWidth: index < managers.length - 1 ? 1 : 0,
                      },
                    ]}
                  >
                    <View style={styles.modalPeriodContainer}>
                      <View style={[styles.periodDot, { backgroundColor: teamColors.primary }]} />
                      <Text style={[styles.modalPeriodText, { color: theme.colors.textSecondary }]}>
                        {formatDate(manager.startDate)}~{formatDate(manager.endDate)}
                        {duration && duration.trim() !== "" && ` (${duration})`}
                      </Text>
                    </View>

                    <View style={styles.modalManagerDetails}>
                      {manager.photo && manager.photo.trim() !== "" ? (
                        <Image
                          source={{ uri: manager.photo }}
                          style={styles.modalManagerPhoto}
                          resizeMode="cover"
                          onError={() => {
                            console.log(`Failed to load manager photo: ${manager.photo}`);
                          }}
                        />
                      ) : (
                        <View style={[styles.modalManagerPhoto, styles.managerPhotoPlaceholder]}>
                          <Text style={styles.modalManagerInitials}>
                            {manager.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .substring(0, 2)
                              .toUpperCase()}
                          </Text>
                        </View>
                      )}
                      <View style={styles.modalManagerTextInfo}>
                        <Text style={[styles.modalManagerName, { color: theme.colors.text }]}>
                          {manager.name}
                        </Text>
                        <View style={styles.modalStatsRow}>
                          <Text style={[styles.modalMatchesText, { color: theme.colors.text }]}>
                            {manager.matchesManaged} Matches
                          </Text>
                          <Text style={[styles.modalWinRateText, { color: "#4CAF50" }]}>
                            Win Rate {manager.winPercentage.toFixed(2)}%
                          </Text>
                        </View>
                        <Text style={[styles.modalRecordText, { color: theme.colors.textSecondary }]}>
                          (W{manager.wins}/D{manager.draws}/L{manager.losses})
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
    </>
  );
}

const styles = StyleSheet.create({
  separator: {
    height: 1,
    width: "100%",
    marginVertical: 0,
  },
  container: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: "bold",
  },
  viewAllButton: {
    fontSize: 14,
    fontWeight: "500",
  },
  managerRow: {
    paddingVertical: 16,
  },
  periodContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  periodDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  periodText: {
    fontSize: 13,
    fontWeight: "400",
  },
  managerInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 12,
  },
  managerPhoto: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  managerPhotoPlaceholder: {
    backgroundColor: "#666",
    justifyContent: "center",
    alignItems: "center",
  },
  managerInitials: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  managerName: {
    fontSize: 16,
    fontWeight: "600",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    flexWrap: "wrap",
  },
  matchesText: {
    fontSize: 14,
    fontWeight: "500",
  },
  winRateText: {
    fontSize: 14,
    fontWeight: "600",
  },
  recordText: {
    fontSize: 13,
    fontWeight: "400",
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
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
  modalManagerRow: {
    padding: 16,
    borderRadius: 0,
    marginBottom: 0,
    paddingVertical: 16,
  },
  modalPeriodContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
    flexWrap: "wrap",
  },
  modalPeriodText: {
    fontSize: 13,
    fontWeight: "400",
  },
  modalManagerDetails: {
    flexDirection: "row",
    gap: 12,
  },
  modalManagerPhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  modalManagerInitials: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
  modalManagerTextInfo: {
    flex: 1,
    justifyContent: "center",
  },
  modalManagerName: {
    fontSize: 17,
    fontWeight: "bold",
    marginBottom: 8,
  },
  modalStatsRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 4,
  },
  modalMatchesText: {
    fontSize: 14,
    fontWeight: "500",
  },
  modalWinRateText: {
    fontSize: 14,
    fontWeight: "600",
  },
  modalRecordText: {
    fontSize: 13,
    fontWeight: "400",
  },
});

