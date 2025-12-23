import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  X,
  Plus,
  Trophy,
  MapPin,
  Globe,
  Star,
} from "lucide-react-native";
import { useTheme } from "@/hooks/useTheme";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface LeagueTab {
  id: string;
  name: string;
  shortName: string;
  country: string;
  icon: any;
}

interface NewsTeamRearrangeReplaysTabsProps {
  visible: boolean;
  onClose: () => void;
  currentActiveLeagues: string[];
  onSaveArrangement: (
    activeLeagues: string[],
    hiddenLeagues: string[],
  ) => void;
}

const allAvailableLeagues: LeagueTab[] = [
  {
    id: "uganda-premier-league",
    name: "Uganda Premier League",
    shortName: "Uganda PL",
    country: "Uganda",
    icon: MapPin,
  },
  {
    id: "premier-league",
    name: "Premier League",
    shortName: "English PL",
    country: "England",
    icon: Trophy,
  },
  {
    id: "la-liga",
    name: "La Liga",
    shortName: "Spanish Liga",
    country: "Spain",
    icon: Trophy,
  },
  {
    id: "serie-a",
    name: "Serie A",
    shortName: "Italian SA",
    country: "Italy",
    icon: Trophy,
  },
  {
    id: "bundesliga",
    name: "Bundesliga",
    shortName: "German BL",
    country: "Germany",
    icon: Trophy,
  },
  {
    id: "ligue-1",
    name: "Ligue 1",
    shortName: "French L1",
    country: "France",
    icon: Trophy,
  },
  {
    id: "champions-league",
    name: "Champions League",
    shortName: "UCL",
    country: "Europe",
    icon: Star,
  },
  {
    id: "europa-league",
    name: "Europa League",
    shortName: "UEL",
    country: "Europe",
    icon: Star,
  },
  {
    id: "africa-cup",
    name: "Africa Cup of Nations",
    shortName: "AFCON",
    country: "Africa",
    icon: Globe,
  },
  {
    id: "caf-cl",
    name: "CAF Champions League",
    shortName: "CAF CL",
    country: "Africa",
    icon: Trophy,
  },
];

const STORAGE_KEY = "@replays_tabs_arrangement";

export default function NewsTeamRearrangeReplaysTabs({
  visible,
  onClose,
  currentActiveLeagues,
  onSaveArrangement,
}: NewsTeamRearrangeReplaysTabsProps) {
  const theme = useTheme();
  const [activeLeagueIds, setActiveLeagueIds] = useState<string[]>(
    currentActiveLeagues,
  );
  const [hiddenLeagueIds, setHiddenLeagueIds] = useState<string[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    if (visible) {
      const allIds = allAvailableLeagues.map((league) => league.id);

      // Ensure Uganda PL is always first and active
      const orderedActive = [
        "uganda-premier-league",
        ...currentActiveLeagues.filter((id) => id !== "uganda-premier-league"),
      ];

      const hidden = allIds.filter((id) => !orderedActive.includes(id));
      setActiveLeagueIds(orderedActive);
      setHiddenLeagueIds(hidden);
      setIsEditMode(false);
    }
  }, [visible, currentActiveLeagues]);

  const getLeaguesByIds = (ids: string[]): LeagueTab[] => {
    return ids
      .map(
        (id) => allAvailableLeagues.find((league) => league.id === id)!,
      )
      .filter(Boolean);
  };

  const activeLeagues = getLeaguesByIds(activeLeagueIds);
  const hiddenLeagues = getLeaguesByIds(hiddenLeagueIds);

  const moveLeague = (leagueId: string, fromActive: boolean) => {
    if (!isEditMode) return;

    // Prevent moving Uganda PL tab
    if (leagueId === "uganda-premier-league") {
      Alert.alert(
        "Cannot Move",
        "Uganda PL must always remain active and in the first position.",
        [{ text: "OK" }],
      );
      return;
    }

    if (fromActive) {
      if (activeLeagueIds.length <= 3) {
        Alert.alert(
          "Minimum Required",
          "You must have at least 3 active league tabs.",
          [{ text: "OK" }],
        );
        return;
      }

      setActiveLeagueIds((prev) => prev.filter((id) => id !== leagueId));
      setHiddenLeagueIds((prev) => [...prev, leagueId]);
    } else {
      if (activeLeagueIds.length >= 8) {
        Alert.alert(
          "Maximum Reached",
          "You can have maximum of 8 active league tabs.",
          [{ text: "OK" }],
        );
        return;
      }

      setHiddenLeagueIds((prev) => prev.filter((id) => id !== leagueId));
      setActiveLeagueIds((prev) => [...prev, leagueId]);
    }
  };

  const handleEditToggle = () => {
    if (isEditMode) {
      handleSave();
    } else {
      setIsEditMode(true);
    }
  };

  const handleSave = async () => {
    try {
      // Ensure Uganda PL is always first
      const orderedActive = [
        "uganda-premier-league",
        ...activeLeagueIds.filter((id) => id !== "uganda-premier-league"),
      ];

      const arrangement = {
        active: orderedActive,
        hidden: hiddenLeagueIds,
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(arrangement));

      onSaveArrangement(orderedActive, hiddenLeagueIds);
      setIsEditMode(false);
      onClose();
    } catch (error) {
      console.error("Error saving league tabs arrangement:", error);
      Alert.alert("Error", "Failed to save arrangement. Please try again.");
    }
  };

  const renderLeagueGrid = (leagues: LeagueTab[], isActive: boolean) => (
    <View
      style={[
        styles.leagueGrid,
        { backgroundColor: theme.colors.background },
      ]}
    >
      {leagues.map((league) => {
        const IconComponent = league.icon;
        const isDarkMode = theme.colors.background === "#2A2A2A" || theme.colors.text === "#FFFFFF";

        return (
          <View key={league.id} style={styles.leagueItemContainer}>
            <TouchableOpacity
              style={[
                styles.leagueItem,
                {
                  backgroundColor: theme.colors.backgroundSecondary,
                  borderWidth: 1,
                  borderColor:
                    theme.colors.border || "rgba(255, 255, 255, 0.1)",
                },
              ]}
              onPress={() => moveLeague(league.id, isActive)}
              activeOpacity={isEditMode ? 0.7 : 1}
            >
              <View style={styles.leagueContent}>
                <IconComponent
                  size={14}
                  color={
                    league.id === "uganda-premier-league"
                      ? (isDarkMode ? "#FF6B6B" : "#FF4444")
                      : theme.colors.textSecondary
                  }
                  style={styles.leagueIcon}
                />
                <Text
                  style={[
                    styles.leagueLabel,
                    {
                      color:
                        league.id === "uganda-premier-league"
                          ? (isDarkMode ? "#FF6B6B" : "#FF4444")
                          : theme.colors.textSecondary,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {league.shortName}
                </Text>
              </View>

              {isEditMode &&
                league.id !== "uganda-premier-league" && (
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      {
                        backgroundColor: theme.colors.textSecondary,
                      },
                    ]}
                    onPress={() => moveLeague(league.id, isActive)}
                    activeOpacity={0.6}
                  >
                    {isActive ? (
                      <X size={10} color={theme.colors.background} />
                    ) : (
                      <Plus size={10} color={theme.colors.background} />
                    )}
                  </TouchableOpacity>
                )}
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <SafeAreaView
          style={[
            styles.safeArea,
            { backgroundColor: theme.colors.background },
          ]}
          edges={["top", "bottom"]}
        >
          {/* Pull-down handle */}
          <View
            style={[
              styles.pullHandle,
              { backgroundColor: theme.colors.background },
            ]}
          >
            <View
              style={[
                styles.handleBar,
                { backgroundColor: theme.colors.textSecondary },
              ]}
            />
          </View>

          {/* Header */}
          <View
            style={[
              styles.header,
              {
                backgroundColor: theme.colors.background,
                borderBottomColor:
                  theme.colors.border || "rgba(255, 255, 255, 0.1)",
              },
            ]}
          >
            <View style={styles.headerContent}>
              <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
                My League Tabs
              </Text>
              <TouchableOpacity
                style={styles.finishButton}
                onPress={handleEditToggle}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.finishText,
                    {
                      color: isEditMode ? "#FF3B30" : theme.colors.text,
                    },
                  ]}
                >
                  {isEditMode ? "Done" : "Edit"}
                </Text>
              </TouchableOpacity>
            </View>
            <Text
              style={[
                styles.headerSubtitle,
                { color: theme.colors.textSecondary },
              ]}
            >
              {isEditMode
                ? "Tap + or - to add/remove league tabs"
                : "Tap 'Edit' to rearrange league tabs"}
            </Text>
          </View>

          <ScrollView
            style={[
              styles.content,
              { backgroundColor: theme.colors.background },
            ]}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.scrollContent,
              { backgroundColor: theme.colors.background },
            ]}
          >
            {/* Active League Tabs Section */}
            <View
              style={[
                styles.section,
                { backgroundColor: theme.colors.background },
              ]}
            >
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Active League Tabs
              </Text>
              <Text
                style={[
                  styles.sectionSubtitle,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {isEditMode
                  ? `Tap X to hide tabs (${activeLeagueIds.length} active)`
                  : `${activeLeagueIds.length} active tabs`}
              </Text>
              {renderLeagueGrid(activeLeagues, true)}
            </View>

            {/* Hidden League Tabs Section */}
            <View
              style={[
                styles.section,
                { backgroundColor: theme.colors.background },
              ]}
            >
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Hidden League Tabs
              </Text>
              <Text
                style={[
                  styles.sectionSubtitle,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {isEditMode
                  ? `Tap + to show tabs (${hiddenLeagueIds.length} hidden)`
                  : `${hiddenLeagueIds.length} hidden tabs`}
              </Text>
              {renderLeagueGrid(hiddenLeagues, false)}
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  pullHandle: {
    alignItems: "center",
    paddingVertical: 12,
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  finishButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  finishText: {
    fontSize: 16,
    fontWeight: "600",
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  leagueGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "flex-start",
  },
  leagueItemContainer: {
    width: "28%",
    minWidth: 85,
    marginBottom: 12,
  },
  leagueItem: {
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 70,
  },
  leagueContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  leagueIcon: {
    marginBottom: 6,
  },
  leagueLabel: {
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 14,
  },
  actionButton: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
});
